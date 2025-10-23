from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db import transaction
from django.utils import timezone
from .models import Booking, AuditLog
from .serializers import BookingSerializer
from .permissions import IsCustomerUser
from .secret_code_utils import generate_unique_secret_code
from .notification_utils import create_rich_notification


class CustomerCheckInView(APIView):
    """
    Customer self-check-in endpoint (after gate verification by admin)
    
    Workflow:
    1. Customer's booking must be in 'verified' status (verified by admin at gate)
    2. Customer opens app → "My Bookings" → sees verified booking
    3. Customer taps "Check In Now" button
    4. System generates secret code
    5. Slot marked as occupied
    6. Booking status → 'checked_in'
    7. Customer receives notification with secret code
    """
    permission_classes = [permissions.IsAuthenticated, IsCustomerUser]
    
    def post(self, request):
        """
        Customer completes check-in for their verified booking
        """
        booking_id = request.data.get('booking_id')
        
        if not booking_id:
            return Response({
                "error": "Booking ID is required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find the booking
        try:
            booking = Booking.objects.select_related(
                'user', 'vehicle', 'slot'
            ).get(id=booking_id, user=request.user)
        except Booking.DoesNotExist:
            return Response({
                "error": "Booking not found or you don't have permission to access it"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Validate booking status
        if booking.status != 'verified':
            if booking.status == 'confirmed':
                return Response({
                    "error": "Booking not yet verified. Please check in at the gate first.",
                    "hint": "Ask security/admin to verify your booking at the entrance gate."
                }, status=status.HTTP_400_BAD_REQUEST)
            elif booking.status == 'checked_in':
                return Response({
                    "error": "You are already checked in!",
                    "secret_code": booking.secret_code
                }, status=status.HTTP_400_BAD_REQUEST)
            elif booking.status in ['checked_out', 'cancelled', 'expired']:
                return Response({
                    "error": f"Cannot check in. Booking is {booking.status}."
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if slot is available (or occupied by this same booking)
        if booking.slot.is_occupied:
            # Check if it's occupied by a different booking
            current_occupant = Booking.objects.filter(
                slot=booking.slot,
                status='checked_in',
                is_active=True
            ).exclude(id=booking.id).first()
            
            if current_occupant:
                return Response({
                    "error": f"Slot {booking.slot.slot_number} is already occupied by another booking. Please contact support.",
                    "support_contact": "admin@parksmart.com"
                }, status=status.HTTP_400_BAD_REQUEST)
            else:
                # Slot marked as occupied but no active booking - free it
                booking.slot.is_occupied = False
                booking.slot.save()
        
        try:
            with transaction.atomic():
                # Generate secret code
                secret_code = generate_unique_secret_code()
                booking.secret_code = secret_code
                
                # Update booking to checked_in
                booking.status = 'checked_in'
                booking.checked_in_at = timezone.now()
                booking.checked_in_by = request.user
                booking.checked_in_ip = self.get_client_ip(request)
                booking.save()
                
                # Mark slot as occupied
                booking.slot.is_occupied = True
                booking.slot.save()
                
                # Create audit log
                AuditLog.objects.create(
                    booking=booking,
                    user=request.user,
                    action='customer_check_in',
                    ip_address=self.get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    success=True,
                    notes=f"Customer self check-in after gate verification",
                    additional_data={
                        'vehicle_plate': booking.vehicle.number_plate,
                        'slot_number': booking.slot.slot_number,
                        'secret_code_generated': secret_code
                    }
                )
                
                # Send notification to customer with secret code
                create_rich_notification(
                    user=booking.user,
                    notification_type='check_in_code',
                    title='🎫 Check-In Complete - Your Secret Code',
                    message=f'You are now checked in to Slot {booking.slot.slot_number}!\n\n🔐 Secret Code: {secret_code}\n\n⚠️ IMPORTANT: Save this code! You will need it for checkout.',
                    related_object_id=str(booking.id),
                    related_object_type='Booking',
                    additional_data={
                        'booking_id': booking.id,
                        'secret_code': secret_code,
                        'slot_number': booking.slot.slot_number,
                        'vehicle_plate': booking.vehicle.number_plate,
                        'parking_zone': booking.slot.parking_zone,
                        'checked_in_at': booking.checked_in_at.isoformat()
                    }
                )
                
                serialized_booking = BookingSerializer(booking)
                
                return Response({
                    "message": "Check-in successful!",
                    "secret_code": secret_code,
                    "booking": serialized_booking.data,
                    "reminder": "Please save your secret code. You'll need it for checkout."
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response({
                "error": f"Failed to check-in: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get_client_ip(self, request):
        """Extract client IP from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class CustomerCheckoutRequestView(APIView):
    """
    Customer initiates checkout request (Step 1 of checkout workflow)
    
    Workflow:
    1. Customer wants to leave → Opens app → Clicks "Request Checkout"
    2. Booking status → 'checkout_requested'
    3. Customer drives to exit gate
    4. Admin verifies secret code at gate
    5. Booking status → 'checkout_verified'
    6. Customer confirms final checkout
    7. Slot freed, booking status → 'checked_out'
    """
    permission_classes = [permissions.IsAuthenticated, IsCustomerUser]
    
    def post(self, request):
        """
        Customer requests checkout (initiates checkout process)
        """
        booking_id = request.data.get('booking_id')
        
        if not booking_id:
            return Response({
                "error": "Booking ID is required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find the booking
        try:
            booking = Booking.objects.select_related(
                'user', 'vehicle', 'slot'
            ).get(id=booking_id, user=request.user)
        except Booking.DoesNotExist:
            return Response({
                "error": "Booking not found or you don't have permission to access it"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Validate booking status
        if booking.status != 'checked_in':
            if booking.status == 'checkout_requested':
                return Response({
                    "message": "Checkout already requested. Please proceed to exit gate for verification."
                }, status=status.HTTP_200_OK)
            elif booking.status == 'checkout_verified':
                return Response({
                    "message": "Checkout already verified at gate. You can now confirm final checkout."
                }, status=status.HTTP_200_OK)
            elif booking.status == 'checked_out':
                return Response({
                    "error": "This booking is already checked out."
                }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    "error": f"Cannot request checkout. Booking status is {booking.status}."
                }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                # Update booking status to checkout_requested
                booking.status = 'checkout_requested'
                booking.checkout_requested_at = timezone.now()
                booking.save()
                
                # Create audit log
                AuditLog.objects.create(
                    booking=booking,
                    user=request.user,
                    action='checkout_requested',
                    ip_address=self.get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    success=True,
                    notes=f"Customer requested checkout",
                    additional_data={
                        'vehicle_plate': booking.vehicle.number_plate,
                        'slot_number': booking.slot.slot_number,
                        'secret_code': booking.secret_code
                    }
                )
                
                # Send notification
                create_rich_notification(
                    user=booking.user,
                    notification_type='checkout_requested',
                    title='🚗 Checkout Requested',
                    message=f'Your checkout request has been submitted.\n\nPlease proceed to the exit gate with your secret code: {booking.secret_code}',
                    related_object_id=str(booking.id),
                    related_object_type='Booking',
                    additional_data={
                        'booking_id': booking.id,
                        'slot_number': booking.slot.slot_number,
                        'vehicle_plate': booking.vehicle.number_plate,
                        'secret_code': booking.secret_code
                    }
                )
                
                serialized_booking = BookingSerializer(booking)
                
                return Response({
                    "message": "Checkout requested successfully! Please proceed to exit gate.",
                    "booking": serialized_booking.data,
                    "secret_code": booking.secret_code,
                    "next_step": "Show your secret code to security at the exit gate"
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response({
                "error": f"Failed to request checkout: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get_client_ip(self, request):
        """Extract client IP from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class CustomerFinalCheckoutView(APIView):
    """
    Customer completes final checkout (Step 3 of checkout workflow)
    After admin has verified at gate
    """
    permission_classes = [permissions.IsAuthenticated, IsCustomerUser]
    
    def post(self, request):
        """
        Customer confirms final checkout (after gate verification)
        """
        booking_id = request.data.get('booking_id')
        
        if not booking_id:
            return Response({
                "error": "Booking ID is required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find the booking
        try:
            booking = Booking.objects.select_related(
                'user', 'vehicle', 'slot'
            ).get(id=booking_id, user=request.user)
        except Booking.DoesNotExist:
            return Response({
                "error": "Booking not found or you don't have permission to access it"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Validate booking status
        if booking.status != 'checkout_verified':
            if booking.status == 'checked_in':
                return Response({
                    "error": "Please request checkout first and get verified at the exit gate.",
                    "hint": "Tap 'Request Checkout' button first"
                }, status=status.HTTP_400_BAD_REQUEST)
            elif booking.status == 'checkout_requested':
                return Response({
                    "error": "Checkout not yet verified. Please show your secret code to security at the exit gate.",
                    "secret_code": booking.secret_code
                }, status=status.HTTP_400_BAD_REQUEST)
            elif booking.status == 'checked_out':
                return Response({
                    "error": "This booking is already checked out."
                }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    "error": f"Cannot complete checkout. Booking status is {booking.status}."
                }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                # Calculate duration and charges
                actual_duration = timezone.now() - booking.checked_in_at
                actual_minutes = int(actual_duration.total_seconds() / 60)
                
                # Update booking
                booking.status = 'checked_out'
                booking.checked_out_at = timezone.now()
                booking.checked_out_by = request.user
                booking.checked_out_ip = self.get_client_ip(request)
                booking.actual_duration_minutes = actual_minutes
                booking.is_active = False
                booking.save()
                
                # Free the parking slot
                booking.slot.is_occupied = False
                booking.slot.save()
                
                # Create audit log
                AuditLog.objects.create(
                    booking=booking,
                    user=request.user,
                    action='customer_checkout',
                    ip_address=self.get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    success=True,
                    notes=f"Customer completed final checkout",
                    additional_data={
                        'vehicle_plate': booking.vehicle.number_plate,
                        'slot_number': booking.slot.slot_number,
                        'duration_minutes': actual_minutes
                    }
                )
                
                # Send notification
                create_rich_notification(
                    user=booking.user,
                    notification_type='checkout_complete',
                    title='✅ Checkout Complete',
                    message=f'Thank you for parking with us!\n\nSlot {booking.slot.slot_number} is now free.\nDuration: {actual_minutes} minutes',
                    related_object_id=str(booking.id),
                    related_object_type='Booking',
                    additional_data={
                        'booking_id': booking.id,
                        'slot_number': booking.slot.slot_number,
                        'duration_minutes': actual_minutes,
                        'checked_out_at': booking.checked_out_at.isoformat()
                    }
                )
                
                serialized_booking = BookingSerializer(booking)
                
                return Response({
                    "message": "Checkout completed successfully! Thank you for parking with us.",
                    "booking": serialized_booking.data,
                    "duration_minutes": actual_minutes
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response({
                "error": f"Failed to complete checkout: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get_client_ip(self, request):
        """Extract client IP from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
