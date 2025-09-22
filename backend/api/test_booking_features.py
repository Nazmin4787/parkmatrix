from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from .models import ParkingSlot, ParkingLot, Vehicle, PricingRate, Booking
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

User = get_user_model()

class BookingAndPricingTests(APITestCase):
    def setUp(self):
        # Create users
        self.customer_user = User.objects.create_user(username='customer', email='customer@test.com', password='password', role='customer')
        self.security_user = User.objects.create_user(username='security', email='security@test.com', password='password', role='security')

        # Create a parking lot and slot
        self.parking_lot = ParkingLot.objects.create(name='Test Lot', address='123 Test St', latitude=1, longitude=1)
        self.slot = ParkingSlot.objects.create(parking_lot=self.parking_lot, slot_number='A1', floor='1')

        # Create a vehicle for the customer
        self.vehicle = Vehicle.objects.create(user=self.customer_user, vehicle_type='car', number_plate='TEST1', model='Testla')

        # Create a default pricing rate
        self.pricing_rate = PricingRate.objects.create(
            rate_name='Standard',
            hourly_rate=Decimal('10.00'),
            extension_rate_multiplier=Decimal('1.5'),
            is_default=True
        )

        # Authenticate the customer user
        self.client.force_authenticate(user=self.customer_user)

    def test_price_preview(self):
        """
        Ensure the price preview endpoint returns a correct estimated price.
        """
        url = reverse('price-preview')
        start_time = timezone.now()
        end_time = start_time + timedelta(hours=2)
        
        data = {
            'start_time': start_time.isoformat(),
            'end_time': end_time.isoformat(),
            'vehicle_type': 'car'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['estimated_price'], Decimal('20.00'))

    def test_create_booking(self):
        """
        Ensure a booking can be created with a calculated price.
        """
        url = reverse('booking-create')
        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(hours=3)

        # Use the vehicle's ID instead of providing vehicle data
        data = {
            'slot': self.slot.pk,
            'start_time': start_time.isoformat(),
            'end_time': end_time.isoformat(),
            'vehicle': {'number_plate': 'TEST1', 'vehicle_type': 'car', 'model': 'Testla'}
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['total_price'], '30.00')
        
        booking = Booking.objects.get(pk=response.data['id'])
        self.assertEqual(booking.total_price, Decimal('30.00'))

    def test_booking_conflict(self):
        """
        Ensure the system prevents creating a booking that conflicts with an existing one.
        """
        # Create an initial booking
        start_time1 = timezone.now() + timedelta(days=2)
        end_time1 = start_time1 + timedelta(hours=2)
        Booking.objects.create(
            user=self.customer_user,
            slot=self.slot,
            vehicle=self.vehicle,
            start_time=start_time1,
            end_time=end_time1,
            total_price=20
        )

        # Attempt to create a conflicting booking
        url = reverse('booking-create')
        start_time2 = start_time1 + timedelta(hours=1) # Overlaps
        end_time2 = start_time2 + timedelta(hours=2)
        data = {
            'slot': self.slot.pk,
            'start_time': start_time2.isoformat(),
            'end_time': end_time2.isoformat(),
            'vehicle': {'number_plate': 'TEST1', 'vehicle_type': 'car', 'model': 'Testla'}
        }

        response = self.client.post(url, data, format='json')
        # Should now return 409 CONFLICT with alternative suggestions
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn('error', response.data)
        self.assertIn('alternative_slots', response.data)
        self.assertIn('This time slot is already booked', response.data['error'])

    def test_extend_booking(self):
        """
        Ensure a user can extend their active booking.
        """
        start_time = timezone.now() + timedelta(days=3)
        end_time = start_time + timedelta(hours=1)
        booking = Booking.objects.create(
            user=self.customer_user,
            slot=self.slot,
            vehicle=self.vehicle,
            start_time=start_time,
            end_time=end_time,
            total_price=Decimal('10.00')
        )

        url = reverse('extend-booking', kwargs={'pk': booking.pk})
        new_end_time = end_time + timedelta(hours=1)
        data = {'new_end_time': new_end_time.isoformat()}

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 1 hour extension at 10/hr with 1.5x multiplier = 15
        self.assertEqual(response.data['total_price'], '25.00') 
        self.assertEqual(response.data['extension_count'], 1)

        booking.refresh_from_db()
        self.assertEqual(booking.total_price, Decimal('25.00'))

    def test_mark_vehicle_left(self):
        """
        Ensure a security user can mark a vehicle as having left.
        """
        start_time = timezone.now() + timedelta(days=4)
        end_time = start_time + timedelta(hours=1)
        booking = Booking.objects.create(
            user=self.customer_user,
            slot=self.slot,
            vehicle=self.vehicle,
            start_time=start_time,
            end_time=end_time,
            total_price=Decimal('10.00')
        )
        self.slot.is_occupied = True
        self.slot.save()

        # Authenticate as security user
        self.client.force_authenticate(user=self.security_user)
        
        url = reverse('mark-vehicle-left', kwargs={'pk': booking.pk})
        response = self.client.post(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        booking.refresh_from_db()
        self.assertTrue(booking.vehicle_has_left)
        self.assertFalse(booking.is_active)

        self.slot.refresh_from_db()
        self.assertFalse(self.slot.is_occupied)
        
    def test_early_checkin(self):
        """
        Ensure a user can check in earlier than their booked time if the slot is available.
        """
        # Create a booking that starts in the future
        start_time = timezone.now() + timedelta(hours=5)
        end_time = start_time + timedelta(hours=2)
        booking = Booking.objects.create(
            user=self.customer_user,
            slot=self.slot,
            vehicle=self.vehicle,
            start_time=start_time,
            end_time=end_time,
            total_price=Decimal('20.00')
        )
        
        # Authenticate as the customer
        self.client.force_authenticate(user=self.customer_user)
        
        # Request early check-in
        new_start_time = start_time - timedelta(hours=1)
        url = reverse('early-checkin')
        data = {
            'booking_id': booking.pk,
            'new_start_time': new_start_time.isoformat()
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify the booking was updated
        booking.refresh_from_db()
        self.assertEqual(booking.start_time, new_start_time)
        
        # Total price should now be higher due to the longer duration
        self.assertEqual(booking.total_price, Decimal('30.00'))
        
        # Verify extension history was updated
        self.assertEqual(len(booking.extension_history), 1)
        self.assertEqual(booking.extension_history[0]['action'], 'early_check_in')
