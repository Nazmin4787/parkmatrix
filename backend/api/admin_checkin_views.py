"""
Admin Check-In/Check-Out Views for Pre-Booked Slot Verification
Workflow: Customer books -> Admin verifies -> Generates code -> Sends to user
"""
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db import transaction

from .models import Booking, ParkingSlot, Vehicle, User, AuditLog
from .permissions import IsAdminUser, IsSecurityUser
from .serializers import BookingSerializer
from .secret_code_utils import generate_unique_secret_code, validate_secret_code
from .notification_utils import create_rich_notification


class FindPreBookedSlotView(APIView):
    """
    Search for pre-booked slots by vehicle number
    Admin uses this before check-in to find the customer's booking
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser | IsSecurityUser]
    
    def get(self, request):
        """
        Find bookings by vehicle plate number that are pending check-in
        """
        vehicle_plate = request.query_params.get('vehicle_plate')
        
        if not vehicle_plate:
            return Response({
                "error": "Vehicle plate number is required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find confirmed bookings (not yet checked in) for this vehicle
        now = timezone.now()
        bookings = Booking.objects.filter(
            vehicle__number_plate__iexact=vehicle_plate,
            status='confirmed',  # Only confirmed, not checked in yet
            start_time__lte=now + timezone.timedelta(hours=2),  # Within check-in window
            end_time__gte=now  # Not expired
        ).select_related('user', 'vehicle', 'slot').order_by('start_time')
        
        if not bookings.exists():
            return Response({
                "message": f"No pre-booked slot found for vehicle {vehicle_plate}",
                "bookings": [],
                "suggestion": "Customer may need to book a slot first, or check-in window may have expired."
            }, status=status.HTTP_200_OK)
        
        serialized = BookingSerializer(bookings, many=True)
        return Response({
            "message": f"Found {bookings.count()} booking(s) for vehicle {vehicle_plate}",
            "bookings": serialized.data
        }, status=status.HTTP_200_OK)


class AdminCheckInView(APIView):
    """
    Admin verifies booking at gate entrance (does NOT complete check-in)
    
    NEW WORKFLOW (Gate Verification):
    1. Customer books a slot (existing flow)
    2. Customer arrives at parking GATE
    3. Admin enters vehicle number
    4. System finds pre-booked slot
    5. Admin verifies booking
    6. Booking status → 'verified', gate opens
    7. Customer drives in, finds slot
    8. Customer opens app → "Check In Now"
    9. System generates secret code
    10. Slot marked as occupied
    11. Booking status → 'checked_in'
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser | IsSecurityUser]
    
    def post(self, request):
        """
        Verify booking at gate (does NOT complete check-in)
        """
        vehicle_plate = request.data.get('vehicle_plate')
        booking_id = request.data.get('booking_id')
        notes = request.data.get('notes', '')
        
        # Validation
        if not vehicle_plate and not booking_id:
            return Response({
                "error": "Either vehicle plate or booking ID is required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find the booking
        try:
            if booking_id:
                booking = Booking.objects.get(id=booking_id, status='confirmed')
            else:
                # Find most recent confirmed booking for this vehicle
                now = timezone.now()
                booking = Booking.objects.filter(
                    vehicle__number_plate__iexact=vehicle_plate,
                    status='confirmed',
                    start_time__lte=now + timezone.timedelta(hours=2),
                    end_time__gte=now
                ).select_related('user', 'vehicle', 'slot').first()
                
                if not booking:
                    return Response({
                        "error": f"No pre-booked slot found for vehicle {vehicle_plate}",
                        "suggestion": "Please ask the customer to book a slot first."
                    }, status=status.HTTP_404_NOT_FOUND)
        
        except Booking.DoesNotExist:
            return Response({
                "error": "Booking not found or already checked in"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Verify the booking belongs to the vehicle
        if vehicle_plate and booking.vehicle.number_plate.upper() != vehicle_plate.upper():
            return Response({
                "error": "Vehicle plate does not match booking"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if already verified or checked in
        if booking.status == 'verified':
            return Response({
                "error": "Booking is already verified. Customer can now check in from their app."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if booking.status == 'checked_in':
            return Response({
                "error": "Booking is already checked in."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                # Update booking to verified (NOT checked_in)
                booking.status = 'verified'
                booking.verified_at = timezone.now()
                booking.verified_by = request.user
                booking.verification_notes = notes
                booking.save()
                
                # DO NOT mark slot as occupied yet - customer will do that on check-in
                # DO NOT generate secret code yet - customer will get it on check-in
                
                # Create audit log
                AuditLog.objects.create(
                    booking=booking,
                    user=request.user,
                    action='booking_verified',
                    ip_address=self.get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    success=True,
                    notes=f"Booking verified at gate by {request.user.username}. {notes}",
                    additional_data={
                        'vehicle_plate': booking.vehicle.number_plate,
                        'slot_number': booking.slot.slot_number,
                        'verified_by': request.user.username
                    }
                )
                
                # Send notification to customer
                create_rich_notification(
                    user=booking.user,
                    notification_type='booking_verified',
                    title='✅ Booking Verified - Welcome!',
                    message=f'Your booking for Slot {booking.slot.slot_number} has been verified at the gate.\n\nPlease proceed to your parking slot and tap "Check In Now" in your app to complete check-in.',
                    related_object_id=str(booking.id),
                    related_object_type='Booking',
                    additional_data={
                        'booking_id': booking.id,
                        'slot_number': booking.slot.slot_number,
                        'vehicle_plate': booking.vehicle.number_plate,
                        'parking_zone': booking.slot.parking_zone,
                        'verified_at': booking.verified_at.isoformat()
                    }
                )
                
                serialized_booking = BookingSerializer(booking)
                
                return Response({
                    "message": "Booking verified successfully! Customer can now check in from their app.",
                    "booking": serialized_booking.data,
                    "customer": {
                        "name": booking.user.username,
                        "email": booking.user.email
                    },
                    "notification_sent": True,
                    "next_step": "Customer needs to open app and tap 'Check In Now'"
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response({
                "error": f"Failed to verify booking: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get_client_ip(self, request):
        """Extract client IP from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class AdminCheckOutView(APIView):
    """
    Admin/Security endpoint to VERIFY checkout at exit gate
    
    NEW WORKFLOW (Gate Verification for Checkout):
    1. Customer requests checkout from app
    2. Customer drives to exit gate
    3. Admin/Security verifies secret code
    4. Booking status → 'checkout_verified'
    5. Gate opens, customer leaves
    6. Customer confirms final checkout from app
    7. Slot freed, booking status → 'checked_out'
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser | IsSecurityUser]
    
    def post(self, request):
        """
        Verify checkout at exit gate (does NOT complete checkout)
        """
        booking_id = request.data.get('booking_id')
        vehicle_plate = request.data.get('vehicle_plate')
        secret_code = request.data.get('secret_code')
        notes = request.data.get('notes', '')
        
        # Validation
        if not secret_code:
            return Response({
                "error": "Secret code is required for checkout verification"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find booking by ID or vehicle plate
        booking = None
        try:
            if booking_id:
                booking = Booking.objects.get(id=booking_id, status__in=['checked_in', 'checkout_requested'])
            elif vehicle_plate:
                # Find active booking by vehicle plate
                booking = Booking.objects.filter(
                    vehicle__number_plate__iexact=vehicle_plate,
                    status__in=['checked_in', 'checkout_requested']
                ).first()
                
                if not booking:
                    return Response({
                        "error": f"No active booking found for vehicle {vehicle_plate}"
                    }, status=status.HTTP_404_NOT_FOUND)
            else:
                return Response({
                    "error": "Either booking_id or vehicle_plate is required"
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Booking.DoesNotExist:
            return Response({
                "error": "Booking not found or not in valid status"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Validate secret code
        is_valid, error_message, _ = validate_secret_code(booking.id, secret_code)
        if not is_valid:
            # Log failed attempt
            AuditLog.objects.create(
                booking=booking,
                user=request.user,
                action='checkout_verification_failed',
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                success=False,
                error_message=error_message,
                notes=notes,
                additional_data={
                    'provided_code': secret_code,
                    'vehicle_plate': booking.vehicle.number_plate
                }
            )
            
            return Response({
                "error": error_message
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if already verified
        if booking.status == 'checkout_verified':
            return Response({
                "message": "Checkout already verified. Customer can now confirm final checkout from their app."
            }, status=status.HTTP_200_OK)
        
        try:
            with transaction.atomic():
                # Update booking to checkout_verified (NOT checked_out)
                booking.status = 'checkout_verified'
                booking.checkout_verified_at = timezone.now()
                booking.checkout_verified_by = request.user
                booking.checkout_verification_notes = notes
                booking.save()
                
                # DO NOT free the slot yet - customer will do that on final checkout
                # DO NOT mark as checked_out yet
                
                # Create audit log
                AuditLog.objects.create(
                    booking=booking,
                    user=request.user,
                    action='checkout_verified',
                    ip_address=self.get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    success=True,
                    notes=f"Checkout verified at exit gate by {request.user.username}. {notes}",
                    additional_data={
                        'vehicle_plate': booking.vehicle.number_plate,
                        'slot_number': booking.slot.slot_number,
                        'secret_code_verified': True
                    }
                )
                
                # Send notification to customer
                create_rich_notification(
                    user=booking.user,
                    notification_type='checkout_verified',
                    title='✅ Checkout Verified - Exit Approved',
                    message=f'Your checkout has been verified at the exit gate.\n\nPlease confirm your final checkout in the app to complete the process.',
                    related_object_id=str(booking.id),
                    related_object_type='Booking',
                    additional_data={
                        'booking_id': booking.id,
                        'slot_number': booking.slot.slot_number,
                        'vehicle_plate': booking.vehicle.number_plate,
                        'verified_at': booking.checkout_verified_at.isoformat()
                    }
                )
                
                serialized_booking = BookingSerializer(booking)
                
                return Response({
                    "message": "Checkout verified successfully! Gate opened. Customer can now confirm final checkout from their app.",
                    "booking": serialized_booking.data,
                    "customer": {
                        "name": booking.user.username,
                        "email": booking.user.email
                    },
                    "notification_sent": True,
                    "next_step": "Customer needs to open app and tap 'Confirm Checkout'"
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response({
                "error": f"Failed to verify checkout: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get_client_ip(self, request):
        """Extract client IP from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class SearchBookingView(APIView):
    """
    Search for bookings by vehicle plate or booking ID
    Used for both finding pre-booked slots and checking out
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser | IsSecurityUser]
    
    def get(self, request):
        """
        Search for bookings (both confirmed and checked-in)
        """
        vehicle_plate = request.query_params.get('vehicle_plate')
        booking_id = request.query_params.get('booking_id')
        status_filter = request.query_params.get('status', 'all')  # 'all', 'confirmed', 'checked_in'
        
        if not vehicle_plate and not booking_id:
            return Response({
                "error": "Please provide either vehicle_plate or booking_id"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        bookings = Booking.objects.all()
        
        # Filter by status
        if status_filter == 'confirmed':
            bookings = bookings.filter(status='confirmed')
        elif status_filter == 'checked_in':
            bookings = bookings.filter(status='checked_in')
        elif status_filter != 'all':
            bookings = bookings.filter(status__in=['confirmed', 'checked_in'])
        
        if booking_id:
            bookings = bookings.filter(id=booking_id)
        
        if vehicle_plate:
            bookings = bookings.filter(vehicle__number_plate__icontains=vehicle_plate)
        
        bookings = bookings.select_related('user', 'vehicle', 'slot').order_by('-start_time')
        
        if not bookings.exists():
            return Response({
                "message": "No bookings found",
                "bookings": []
            }, status=status.HTTP_200_OK)
        
        serialized = BookingSerializer(bookings, many=True)
        return Response({
            "count": bookings.count(),
            "bookings": serialized.data
        }, status=status.HTTP_200_OK)
