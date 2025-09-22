from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from .models import User, Vehicle, ParkingSlot, Booking

class ParkingSystemAPITest(APITestCase):

    def setUp(self):
        # Create a user and authenticate
        self.user = User.objects.create_user(username='testuser', email='testuser@example.com', password='testpass')
        url = reverse('login')  # Using our custom login view
        response = self.client.post(url, {'email': 'testuser@example.com', 'password': 'testpass'})
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        # Create parking slots
        self.slot1 = ParkingSlot.objects.create(slot_number='A1', floor='1', is_occupied=False)
        self.slot2 = ParkingSlot.objects.create(slot_number='A2', floor='1', is_occupied=False)

    def test_user_registration(self):
        url = reverse('register')  # Your registration endpoint name
        data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "newpassword",
            "role": "customer"
        }
        self.client.logout()  # Ensure unauthenticated
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.filter(username='newuser').exists(), True)

    def test_vehicle_creation(self):
        url = reverse('vehicle-list-create')
        data = {
            "vehicle_type": "car",
            "number_plate": "MH12AB1234",
            "model": "Honda City",
            "color": "White",
            "is_default": True
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Vehicle.objects.filter(user=self.user, number_plate="MH12AB1234").exists())

    def test_duplicate_vehicle_number_plate(self):
        url = reverse('vehicle-list-create')
        Vehicle.objects.create(user=self.user,
                               vehicle_type="car",
                               number_plate="MH12AB1234",
                               model="Honda City",
                               color="White")
        data = {
            "vehicle_type": "car",
            "number_plate": "MH12AB1234",  # Same plate
            "model": "Honda City New",
            "color": "Black"
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Vehicle with this number plate already exists.', response.data['non_field_errors'] or response.data.values())

    def test_booking_creation(self):
        # Create vehicle first
        vehicle = Vehicle.objects.create(user=self.user,
                                         vehicle_type="car",
                                         number_plate="MH12AB1235",
                                         model="Honda City",
                                         color="White")
        url = reverse('booking-create')  # Updated to correct URL name

        data = {
            "slot": self.slot1.id,
            "start_time": timezone.now().isoformat(),  # Add required start_time
            "end_time": (timezone.now() + timedelta(hours=2)).isoformat(),  # Add required end_time
            "vehicle": {
                "vehicle_type": vehicle.vehicle_type,
                "number_plate": vehicle.number_plate,
                "model": vehicle.model,
                "color": vehicle.color
            }
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.slot1.refresh_from_db()
        self.assertTrue(self.slot1.is_occupied)

    def test_booking_on_occupied_slot(self):
        vehicle = Vehicle.objects.create(user=self.user,
                                         vehicle_type="car",
                                         number_plate="MH12AB1236",
                                         model="Honda City",
                                         color="White")
        self.slot2.is_occupied = True
        self.slot2.save()
        url = reverse('booking-create')
        data = {
            "slot": self.slot2.id,
            "vehicle": {
                "vehicle_type": vehicle.vehicle_type,
                "number_plate": vehicle.number_plate,
                "model": vehicle.model,
                "color": vehicle.color
            },
            "start_time": timezone.now().isoformat(),  # Add required start_time
            "end_time": (timezone.now() + timedelta(hours=2)).isoformat()  # Add required end_time
        }
        response = self.client.post(url, data, format='json')
        # Should now return 409 CONFLICT with alternative suggestions
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn('error', response.data)
        self.assertIn('alternative_slots', response.data)

    def test_booking_report(self):
        # Assume BookingReportView is at this url name
        url = reverse('booking-report')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('booking_by_vehicle_type', response.data)

