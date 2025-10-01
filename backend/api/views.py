import math
from geopy.distance import geodesic

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.db import models
from django.db.models import Count, Q
from django.http import JsonResponse
from django.utils import timezone
from django.utils.http import urlsafe_base64_decode

from rest_framework import generics, permissions, serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Booking, Notification, ParkingLot, ParkingSlot, Vehicle
from .permissions import IsAdminUser, IsCustomerUser, IsSecurityUser
from .pricing import calculate_booking_price, calculate_extension_price
from .serializers import (
    AdminParkingSlotSerializer,
    BookingSerializer,
    ExtendBookingSerializer,
    LoginSerializer,
    NotificationSerializer,
    ParkingLotSerializer,
    ParkingSlotSerializer,
    PricePreviewSerializer,
    PricingRateSerializer,
    UserSerializer,
    VehicleSerializer,
)
from .tokens import CustomRefreshToken
from .notification_utils import (
    create_booking_confirmation_notification,
    create_booking_extension_notification,
    create_booking_reminder_notification,
    create_rich_notification,
)

User = get_user_model()

class MarkVehicleLeftView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSecurityUser]

    def post(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk, is_active=True)
        except Booking.DoesNotExist:
            return Response({"error": "Active booking not found."}, status=status.HTTP_404_NOT_FOUND)
            
        booking.vehicle_has_left = True
        booking.is_active = False
        booking.save()
        
        # Free up the slot
        booking.slot.is_occupied = False
        booking.slot.save()
        
        return Response({"message": "Vehicle marked as left and slot is now free."}, status=status.HTTP_200_OK)

class APIRootView(APIView):
    """
    Root endpoint for the Car Parking System API.
    Returns basic information about API and available endpoints.
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        return Response({
            'message': 'Welcome to the Car Parking System API',
            'version': '1.0',
            'endpoints': {
                'auth': '/api/auth/',
                'slots': '/api/slots/',
                'bookings': '/api/bookings/',
                'vehicles': '/api/vehicles/',
                'notifications': '/api/notifications/',
                'parking_lots': '/api/parking-lots/',
                'reports': '/api/reports/'
            }
        })

def create_system_notification(notification_type, title, message, users=None):
    """
    Helper function to create system-wide or user-specific notifications
    """
    if users is None:
        # Create for all active users if no specific users provided
        users = User.objects.filter(is_active=True)
    
    notifications = []
    for user in users:
        notifications.append(
            Notification(
                user=user,
                notification_type=notification_type,
                title=title,
                message=message
            )
        )
    
    # Bulk create for efficiency
    if notifications:
        Notification.objects.bulk_create(notifications)

def check_and_notify_booking_expiry():
    """
    Check for bookings that are about to expire and create notifications
    This would typically be called by a scheduled task/cron job
    """
    from datetime import timedelta
    
    # Find bookings expiring within the next 30 minutes
    upcoming_expiry = timezone.now() + timedelta(minutes=30)
    expiring_bookings = Booking.objects.filter(
        is_active=True,
        end_time__lte=upcoming_expiry,
        end_time__gt=timezone.now()
    )
    
    for booking in expiring_bookings:
        # Check if notification already exists to avoid duplicates
        existing_notification = Notification.objects.filter(
            user=booking.user,
            notification_type='booking_expiry',
            related_object_id=str(booking.id),
            related_object_type='Booking'
        ).exists()
        
        if not existing_notification:
            Notification.objects.create(
                user=booking.user,
                notification_type='booking_expiry',
                title='Booking Expiring Soon',
                message=f'Your booking for slot {booking.slot.slot_number} will expire soon.',
                related_object_id=str(booking.id),
                related_object_type='Booking'
            )

def create_emergency_alert(title, message):
    """
    Create an emergency system alert for all users
    """
    users = User.objects.filter(is_active=True)
    create_system_notification(
        notification_type='system_alert',
        title=f"🚨 EMERGENCY: {title}",
        message=message,
        users=users
    )

def create_scheduled_maintenance_alert(maintenance_date, duration_hours=2):
    """
    Create a scheduled maintenance notification
    """
    from datetime import datetime, timedelta
    
    if isinstance(maintenance_date, str):
        maintenance_date = datetime.fromisoformat(maintenance_date)
    
    end_time = maintenance_date + timedelta(hours=duration_hours)
    
    users = User.objects.filter(is_active=True)
    create_system_notification(
        notification_type='maintenance',
        title='Scheduled System Maintenance',
        message=f'System maintenance is scheduled from {maintenance_date.strftime("%Y-%m-%d %H:%M")} to {end_time.strftime("%Y-%m-%d %H:%M")}. Some services may be temporarily unavailable.',
        users=users
    )

def create_system_status_alert(service_name, status, message=None):
    """
    Create system status notifications (service up/down)
    """
    if status.lower() == 'down':
        title = f"Service Alert: {service_name} Unavailable"
        default_message = f"The {service_name} service is currently experiencing issues. We are working to resolve this as quickly as possible."
        notification_type = 'system_alert'
    elif status.lower() == 'up':
        title = f"Service Restored: {service_name} Available"
        default_message = f"The {service_name} service has been restored and is now functioning normally."
        notification_type = 'system_alert'
    else:
        title = f"Service Update: {service_name}"
        default_message = f"There is an update regarding the {service_name} service."
        notification_type = 'system_alert'
    
    final_message = message if message else default_message
    
    users = User.objects.filter(is_active=True)
    create_system_notification(
        notification_type=notification_type,
        title=title,
        message=final_message,
        users=users
    )

class UserVehiclesView(generics.ListAPIView):
    serializer_class = VehicleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Vehicle.objects.filter(user=self.request.user).order_by('-is_default', 'number_plate')



class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, uidb64, token):
        try:
            # Decode user id
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
            
            # Verify token is valid
            if default_token_generator.check_token(user, token):
                if not user.is_email_verified:
                    user.is_email_verified = True
                    user.save()
                    
                    # Create email verification notification
                    Notification.objects.create(
                        user=user,
                        notification_type='account_update',
                        title='Email Verified!',
                        message='Your email address has been successfully verified.'
                    )
                    
                    return Response({
                        'message': 'Email successfully verified.',
                        'status': 'success'
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        'message': 'Email already verified.',
                        'status': 'info'
                    }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'message': 'Verification link is invalid or has expired.',
                    'status': 'error'
                }, status=status.HTTP_400_BAD_REQUEST)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({
                'message': 'Verification link is invalid.',
                'status': 'error'
            }, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(email=email)
            # NOTE: Email sending is disabled. In-app notifications will be used instead.
            # from .email_service import send_password_reset_email
            # send_password_reset_email(user, request)
            
            return Response({
                'message': 'If an account with this email exists, a password reset link has been sent.',
                'status': 'success'
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            # For security reasons, don't reveal that the user doesn't exist
            return Response({
                'message': 'If an account with this email exists, a password reset link has been sent.',
                'status': 'success'
            }, status=status.HTTP_200_OK)

class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, uidb64, token):
        try:
            # Decode user id
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
            
            # Verify token is valid
            if default_token_generator.check_token(user, token):
                password = request.data.get('password')
                if not password:
                    return Response({'error': 'Password is required'}, status=status.HTTP_400_BAD_REQUEST)
                
                user.set_password(password)
                user.save()
                
                # Create password reset confirmation notification
                Notification.objects.create(
                    user=user,
                    notification_type='account_update',
                    title='Password Reset Successful',
                    message='Your password has been successfully reset.'
                )
                
                return Response({
                    'message': 'Password reset successful.',
                    'status': 'success'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'message': 'Password reset link is invalid or has expired.',
                    'status': 'error'
                }, status=status.HTTP_400_BAD_REQUEST)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({
                'message': 'Password reset link is invalid.',
                'status': 'error'
            }, status=status.HTTP_400_BAD_REQUEST)

class BookingReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        report = (Booking.objects.filter(user=user)
                  .values('vehicle__vehicle_type')
                  .annotate(count=Count('id'))
                  .order_by('-count'))
        return Response({'booking_by_vehicle_type': list(report)})









class VehicleListCreateView(generics.ListCreateAPIView):
    serializer_class = VehicleSerializer
    permission_classes = [permissions.IsAuthenticated, IsCustomerUser]

    def get_queryset(self):
        # List vehicles owned by the current user only
        return Vehicle.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Assign the current user as owner of the vehicle
        vehicle = serializer.save(user=self.request.user)
        
        # Create notification for new vehicle registration
        Notification.objects.create(
            user=self.request.user,
            notification_type='account_update',
            title='Vehicle Added Successfully',
            message=f'Your {vehicle.vehicle_type} with plate number {vehicle.number_plate} has been added to your account.',
            related_object_id=str(vehicle.id),
            related_object_type='Vehicle'
        )

class VehicleRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = VehicleSerializer
    permission_classes = [permissions.IsAuthenticated, IsCustomerUser]

    def get_queryset(self):
        # Only allow users to retrieve/update/delete their own vehicles
        return Vehicle.objects.filter(user=self.request.user)

class UserDefaultVehicleView(APIView):
    """
    Get the user's default vehicle.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            default_vehicle = Vehicle.objects.get(user=request.user, is_default=True)
            serializer = VehicleSerializer(default_vehicle)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Vehicle.DoesNotExist:
            # If no default, return the first vehicle or nothing
            first_vehicle = Vehicle.objects.filter(user=request.user).first()
            if first_vehicle:
                serializer = VehicleSerializer(first_vehicle)
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response({"message": "No vehicles found for this user."}, status=status.HTTP_404_NOT_FOUND)

class SetDefaultVehicleView(APIView):
    """
    Set a vehicle as the user's default.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            vehicle_to_set = Vehicle.objects.get(pk=pk, user=request.user)
            
            # Unset other defaults
            Vehicle.objects.filter(user=request.user).exclude(pk=pk).update(is_default=False)
            
            # Set the new default
            vehicle_to_set.is_default = True
            vehicle_to_set.save()
            
            return Response({"message": f"Vehicle {vehicle_to_set.number_plate} is now your default."}, status=status.HTTP_200_OK)
        except Vehicle.DoesNotExist:
            return Response({"error": "Vehicle not found or you do not have permission to access it."}, status=status.HTTP_404_NOT_FOUND)


User = get_user_model()

















# Registration view
class RegisterUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()
        # NOTE: Email sending is disabled. In-app notifications will be used instead.
        # send_registration_confirmation_email(user)
        # send_email_verification_email(user, self.request)


    def create(self, request, *args, **kwargs):
        # Allow role setting during registration (defaults to customer)
        data = request.data.copy()
        if 'role' not in data:
            data['role'] = 'customer'

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Create a welcome notification
        Notification.objects.create(
            user=user,
            notification_type='account_update',
            title='Welcome to Our Service!',
            message='Your account has been successfully created.'
        )
        
        # Create custom tokens manually
        refresh = CustomRefreshToken.for_user(user)
        return Response({
            'user': serializer.data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)

# Custom JWT Login view
class LoginView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        if not email or not password:
            return Response({
                'error': 'Please provide both email and password'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Authenticate user
        user = authenticate(request, username=email, password=password)
        
        if user is None:
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check if email is verified (skip in development)
        
        if not user.is_email_verified and not getattr(settings, 'SKIP_EMAIL_VERIFICATION', False):
            # NOTE: Email sending is disabled. In-app notifications will be used instead.
            # from .email_service import send_email_verification_email
            # send_email_verification_email(user, request)
            return Response({
                'error': 'Email not verified',
                'message': 'Please verify your email address. A new verification email has been sent.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Debug info (can be removed in production)
        print(f"Authenticated user: {user.username}, {user.email}")
        
        # Create custom tokens manually
        refresh = CustomRefreshToken.for_user(user)
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_200_OK)

# JWT Token Refresh view
class TokenRefreshView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        refresh_token = request.data.get('refresh')
        
        if not refresh_token:
            return Response({
                'error': 'Refresh token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Validate and decode the refresh token
            refresh = CustomRefreshToken(refresh_token)
            
            # Generate new access token
            access_token = refresh.access_token
            
            return Response({
                'access': str(access_token),
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Invalid refresh token'
            }, status=status.HTTP_401_UNAUTHORIZED)

# Admin-only: CRUD ParkingSlot views
class ParkingSlotListCreateView(generics.ListCreateAPIView):
    queryset = ParkingSlot.objects.all()
    serializer_class = ParkingSlotSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

class ParkingSlotRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ParkingSlot.objects.all()
    serializer_class = ParkingSlotSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

# Customer: List available parking slots (not occupied)
class AvailableParkingSlotsView(generics.ListAPIView):
    serializer_class = ParkingSlotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = ParkingSlot.objects.filter(is_occupied=False)
        
        # Filter by vehicle type if specified
        vehicle_type = self.request.query_params.get('vehicle_type', None)
        if vehicle_type:
            # Include slots that are specifically for this vehicle type OR slots that accept any vehicle
            queryset = queryset.filter(
                models.Q(vehicle_type=vehicle_type) | models.Q(vehicle_type='any')
            )
        else:
            # If no vehicle type specified, filter by user's vehicle types
            user_vehicle_types = self.request.user.vehicle_set.values_list('vehicle_type', flat=True)
            if user_vehicle_types:
                # Show slots compatible with any of user's vehicles
                q_filter = models.Q(vehicle_type='any')
                for v_type in user_vehicle_types:
                    q_filter |= models.Q(vehicle_type=v_type)
                queryset = queryset.filter(q_filter)
        
        return queryset.select_related('parking_lot')
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        # Add summary statistics
        vehicle_type_counts = {}
        for slot in queryset:
            v_type = slot.vehicle_type
            if v_type not in vehicle_type_counts:
                vehicle_type_counts[v_type] = 0
            vehicle_type_counts[v_type] += 1
        
        return Response({
            'slots': serializer.data,
            'total_available': queryset.count(),
            'available_by_type': vehicle_type_counts
        })

from .pricing import calculate_booking_price, calculate_extension_price

class PricePreviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PricePreviewSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            price = calculate_booking_price(
                data['start_time'], data['end_time'], data['vehicle_type']
            )
            return Response({'estimated_price': price})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class BookingCreateView(generics.CreateAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated, IsCustomerUser]

    def perform_create(self, serializer):
        # Validate vehicle type compatibility before saving
        slot = serializer.validated_data['slot']
        vehicle_data = serializer.validated_data.get('vehicle')
        
        # Extract vehicle type from the raw vehicle data
        if vehicle_data:
            vehicle_type = vehicle_data.get('vehicle_type')
            if vehicle_type and not slot.is_compatible_with_vehicle(vehicle_type):
                raise serializers.ValidationError({
                    'error': f'This slot is designated for {slot.get_vehicle_type_display()} vehicles only. Your vehicle is a {vehicle_type}.',
                    'slot_vehicle_type': slot.vehicle_type,
                    'your_vehicle_type': vehicle_type
                })
        
        booking = serializer.save()
        
        # Use our enhanced notification system
        
        
        # Create rich confirmation notification
        create_booking_confirmation_notification(booking)
        
        # Schedule a reminder 30 minutes before the booking
        if booking.start_time > timezone.now():
            create_booking_reminder_notification(booking)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except serializers.ValidationError as e:
            # Check if the error contains alternative slot suggestions
            error_data = getattr(e, 'detail', {})
            if isinstance(error_data, dict) and 'alternative_slots' in error_data:
                # Return a custom response with alternatives
                return Response({
                    'error': str(error_data.get('error', 'Booking conflict')),
                    'alternative_slots': error_data.get('alternative_slots', []),
                    'message': 'Here are some alternative times you might consider.'
                }, status=status.HTTP_409_CONFLICT)
            # Re-raise the exception for regular validation errors
            raise e

class ExtendBookingView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk, user=request.user, is_active=True)
        except Booking.DoesNotExist:
            return Response({"error": "Active booking not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ExtendBookingSerializer(data=request.data, context={'booking': booking})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        new_end_time = serializer.validated_data['new_end_time']
        
        # Calculate extension price
        extension_price = calculate_extension_price(booking, new_end_time)
        
        # Update booking
        booking.end_time = new_end_time
        booking.total_price += extension_price
        booking.extension_count += 1
        booking.extension_history.append({
            'extended_at': timezone.now().isoformat(),
            'new_end_time': new_end_time.isoformat(),
            'additional_cost': str(extension_price)
        })
        booking.save()
        
        # Use our enhanced notification system
        
        
        # Create rich extension notification
        create_booking_extension_notification(booking, new_end_time, extension_price, is_automatic=False)
        
        return Response(BookingSerializer(booking).data)

# Customer: View own bookings
class UserBookingListView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated, IsCustomerUser]

    def get_queryset(self):
        # Debug info to see what's happening
        print(f"Current user: {self.request.user}, ID: {self.request.user.id}, Username: {self.request.user.username}")
        
        # Get user's bookings only
        user_bookings = Booking.objects.filter(user=self.request.user)
        print(f"Found {user_bookings.count()} bookings for current user {self.request.user.username}")
        
        # Return only the current user's bookings, ordered by start time descending
        return user_bookings.order_by('-start_time')

# Customer: Cancel booking
class CancelBookingView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCustomerUser]

    def post(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk, user=request.user, is_active=True)
        except Booking.DoesNotExist:
            return Response({"error": "Active booking not found."}, status=status.HTTP_404_NOT_FOUND)

        booking.is_active = False
        booking.end_time = timezone.now()
        booking.save()
        # Free the parking slot
        booking.slot.is_occupied = False
        booking.slot.save()
        
        # Create a rich notification for booking cancellation
        
        
        # Calculate any refund amount if applicable
        refund_amount = 0
        now = timezone.now()
        if booking.start_time > now:
            # Full refund for future bookings
            refund_amount = booking.total_price
        elif booking.end_time > now:
            # Partial refund for ongoing bookings based on time used
            total_duration = (booking.end_time - booking.start_time).total_seconds()
            used_duration = (now - booking.start_time).total_seconds()
            
            if total_duration > 0:
                refund_ratio = max(0, 1 - (used_duration / total_duration))
                refund_amount = booking.total_price * refund_ratio
        
        refund_text = ""
        additional_data = {
            'booking_id': str(booking.id),
            'slot_number': booking.slot.slot_number,
            'refund_amount': str(round(refund_amount, 2)) if refund_amount > 0 else "0.00"
        }
        
        if refund_amount > 0:
            refund_text = f"\n\nA refund of ${round(refund_amount, 2)} will be processed to your original payment method."
            
        create_rich_notification(
            user=request.user,
            notification_type='booking_cancelled',
            title='Booking Cancelled',
            message=f'Your booking for slot {booking.slot.slot_number} has been cancelled.{refund_text}',
            related_object_id=str(booking.id),
            related_object_type='Booking',
            additional_data=additional_data
        )
        
        # Create notification for slot becoming available if parking lot was previously full
        if booking.slot.parking_lot:
            available_slots = ParkingSlot.objects.filter(
                parking_lot=booking.slot.parking_lot, 
                is_occupied=False
            ).count()
            
            # If this was the first available slot, notify users
            if available_slots == 1:
                recent_users = User.objects.filter(is_active=True)[:20]  # Limit for performance
                
                create_system_notification(
                    notification_type='lot_available',
                    title='Parking Now Available',
                    message=f'Parking slots are now available at {booking.slot.parking_lot.name}.',
                    users=recent_users
                )

        return Response({"message": "Booking cancelled successfully."}, status=status.HTTP_200_OK)

# Admin: View all bookings
class AdminAllBookingsView(generics.ListAPIView):
    queryset = Booking.objects.all().order_by('-start_time')
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

# Admin: Cancel any booking
class AdminCancelBookingView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        if booking.is_active:
            booking.is_active = False
            booking.end_time = timezone.now()
            booking.save()
            # Free the parking slot
            booking.slot.is_occupied = False
            booking.slot.save()
            
            # Create notification for the user whose booking was cancelled by admin
            Notification.objects.create(
                user=booking.user,
                notification_type='booking_cancelled',
                title='Booking Cancelled by Admin',
                message=f'Your booking for slot {booking.slot.slot_number} has been cancelled by an administrator.',
                related_object_id=str(booking.id),
                related_object_type='Booking'
            )
            
            return Response({"message": "Booking cancelled successfully."}, status=status.HTTP_200_OK)
        else:
            return Response({"message": "Booking is already inactive."}, status=status.HTTP_400_BAD_REQUEST)

# Find parking lots by user location
class ParkingLotsByLocationView(generics.ListAPIView):
    serializer_class = ParkingLotSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        lat = self.request.query_params.get('lat')
        lon = self.request.query_params.get('lon')

        if not lat or not lon:
            return ParkingLot.objects.none()

        try:
            user_location = (float(lat), float(lon))
        except (ValueError, TypeError):
            return ParkingLot.objects.none()

        parking_lots = ParkingLot.objects.all()
        
        # Sort parking lots by distance
        sorted_lots = sorted(
            parking_lots,
            key=lambda lot: geodesic(user_location, (lot.latitude, lot.longitude)).kilometers
        )
        
        return sorted_lots

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        # Add distance to each parking lot in the response
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')
        user_location = (float(lat), float(lon))

        response_data = []
        for lot_data in serializer.data:
            lot_location = (float(lot_data['latitude']), float(lot_data['longitude']))
            distance = geodesic(user_location, lot_location).kilometers
            lot_data['distance'] = f"{distance:.2f} km"
            response_data.append(lot_data)
            
        return Response(response_data)

def find_nearest_slot(request):
    """
    Finds the nearest unoccupied parking slot to a given point.
    Expects 'lat' and 'lon' as query parameters.
    Optionally accepts 'vehicle_type' to filter compatible slots.
    """
    try:
        # Entry point or user's current location from query params
        current_lat = float(request.GET.get('lat', 0))
        current_lon = float(request.GET.get('lon', 0))
        
        # Also support legacy pos_x and pos_y parameters for backward compatibility
        if not current_lat and not current_lon:
            current_lat = float(request.GET.get('pos_x', 0))
            current_lon = float(request.GET.get('pos_y', 0))
            
    except (TypeError, ValueError):
        return JsonResponse({'error': 'Invalid position coordinates. Please provide lat and lon parameters.'}, status=400)

    # Get vehicle type filter
    vehicle_type = request.GET.get('vehicle_type')
    
    # Filter available slots
    available_slots = ParkingSlot.objects.filter(is_occupied=False)
    
    if vehicle_type:
        # Filter by vehicle type compatibility
        available_slots = available_slots.filter(
            models.Q(vehicle_type=vehicle_type) | models.Q(vehicle_type='any')
        )
    elif request.user.is_authenticated:
        # Filter by user's vehicle types
        user_vehicle_types = request.user.vehicle_set.values_list('vehicle_type', flat=True)
        if user_vehicle_types:
            q_filter = models.Q(vehicle_type='any')
            for v_type in user_vehicle_types:
                q_filter |= models.Q(vehicle_type=v_type)
            available_slots = available_slots.filter(q_filter)

    if not available_slots.exists():
        return JsonResponse({
            'message': 'No available parking slots at the moment for your vehicle type.' if vehicle_type else 'No available parking slots at the moment.',
            'vehicle_type_requested': vehicle_type
        }, status=404)

    nearest_slot = None
    min_distance = float('inf')

    for slot in available_slots:
        # Simple Euclidean distance calculation using lat/lon coordinates
        distance = math.sqrt((slot.pos_x - current_lat)**2 + (slot.pos_y - current_lon)**2)
        if distance < min_distance:
            min_distance = distance
            nearest_slot = slot

    if nearest_slot:
        slot_data = {
            'slot_id': nearest_slot.id,
            'slot_number': nearest_slot.slot_number,
            'floor': nearest_slot.floor,
            'section': nearest_slot.section,
            'vehicle_type': nearest_slot.vehicle_type,
            'vehicle_type_display': nearest_slot.get_vehicle_type_display(),
            'pos_x': nearest_slot.pos_x,
            'pos_y': nearest_slot.pos_y,
            'lat': nearest_slot.pos_x,
            'lon': nearest_slot.pos_y,
            'distance': round(min_distance, 2),
            'is_compatible': True  # Since we filtered by compatibility
        }
        return JsonResponse(slot_data)
    else:
        return JsonResponse({'message': 'Could not determine the nearest slot.'}, status=500)


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        This view returns a list of all notifications for the currently authenticated user.
        """
        return Notification.objects.filter(user=self.request.user)

class NotificationMarkAsReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        """
        Mark a specific notification as read.
        """
        try:
            notification = Notification.objects.get(pk=pk, user=request.user)
            if not notification.is_read:
                notification.is_read = True
                notification.save()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Notification.DoesNotExist:
            return Response({"error": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)

class NotificationDeleteView(generics.DestroyAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        This view allows the user to delete their own notifications.
        """
        return Notification.objects.filter(user=self.request.user)


class NotificationUnreadCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """
        Return the count of unread notifications for the current user.
        """
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({"unread_count": count}, status=status.HTTP_200_OK)


class MarkAllNotificationsAsReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """
        Mark all notifications as read for the current user.
        """
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SystemAlertCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def post(self, request):
        """
        Create a system alert notification for all users or specific user groups.
        Only admins can create system alerts.
        """
        title = request.data.get('title')
        message = request.data.get('message')
        target_users = request.data.get('target_users', 'all')  # 'all', 'customers', 'admins'
        
        if not title or not message:
            return Response(
                {"error": "Title and message are required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Determine target user groups
        if target_users == 'customers':
            users = User.objects.filter(role='customer', is_active=True)
        elif target_users == 'admins':
            users = User.objects.filter(role='admin', is_active=True)
        elif target_users == 'security':
            users = User.objects.filter(role='security', is_active=True)
        else:  # 'all' or any other value defaults to all users
            users = User.objects.filter(is_active=True)
        
        create_system_notification(
            notification_type='system_alert',
            title=title,
            message=message,
            users=users
        )
        
        return Response({
            "message": f"System alert created for {users.count()} users."
        }, status=status.HTTP_201_CREATED)


class MaintenanceAlertCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def post(self, request):
        """
        Create a maintenance alert notification for all users.
        Only admins can create maintenance alerts.
        """
        title = request.data.get('title')
        message = request.data.get('message')
        maintenance_start = request.data.get('maintenance_start')
        maintenance_end = request.data.get('maintenance_end')
        
        if not title or not message:
            return Response(
                {"error": "Title and message are required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Add maintenance schedule to message if provided
        if maintenance_start and maintenance_end:
            message += f" Scheduled from {maintenance_start} to {maintenance_end}."
        elif maintenance_start:
            message += f" Starting at {maintenance_start}."
        
        # Send to all active users
        users = User.objects.filter(is_active=True)
        
        create_system_notification(
            notification_type='maintenance',
            title=title,
            message=message,
            users=users
        )
        
        return Response({
            "message": f"Maintenance alert created for {users.count()} users."
        }, status=status.HTTP_201_CREATED)


class SystemNotificationStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request):
        """
        Get statistics about system notifications.
        Only admins can view these statistics.
        """
        
        
        # Get notification counts by type
        notification_stats = Notification.objects.values('notification_type').annotate(
            total=Count('id'),
            unread=Count('id', filter=Q(is_read=False))
        ).order_by('-total')
        
        # Get recent system alerts and maintenance notifications
        recent_system_notifications = Notification.objects.filter(
            notification_type__in=['system_alert', 'maintenance']
        ).order_by('-created_at')[:10]
        
        recent_notifications_data = NotificationSerializer(recent_system_notifications, many=True).data
        
        return Response({
            "notification_stats": list(notification_stats),
            "recent_system_notifications": recent_notifications_data,
            "total_users": User.objects.filter(is_active=True).count()
        }, status=status.HTTP_200_OK)

class SlotManagementView(generics.ListCreateAPIView):
    """Admin view for managing parking slots with vehicle types"""
    serializer_class = AdminParkingSlotSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        queryset = ParkingSlot.objects.all().select_related('parking_lot')
        
        # Filter by parking lot if specified
        parking_lot_id = self.request.query_params.get('parking_lot')
        if parking_lot_id:
            queryset = queryset.filter(parking_lot_id=parking_lot_id)
            
        # Filter by vehicle type if specified
        vehicle_type = self.request.query_params.get('vehicle_type')
        if vehicle_type:
            queryset = queryset.filter(vehicle_type=vehicle_type)
            
        return queryset

class SlotDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin view for managing individual parking slots"""
    serializer_class = AdminParkingSlotSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    queryset = ParkingSlot.objects.all().select_related('parking_lot')

class BulkSlotUpdateView(APIView):
    """Admin view for bulk updating slot vehicle types"""
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def post(self, request):
        slot_ids = request.data.get('slot_ids', [])
        vehicle_type = request.data.get('vehicle_type')
        
        if not slot_ids:
            return Response({'error': 'No slot IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
            
        if vehicle_type not in [choice[0] for choice in ParkingSlot.VEHICLE_TYPE_CHOICES]:
            return Response({'error': 'Invalid vehicle type'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update slots
        updated_count = ParkingSlot.objects.filter(id__in=slot_ids).update(vehicle_type=vehicle_type)
        
        return Response({
            'message': f'Successfully updated {updated_count} slots to {vehicle_type} type',
            'updated_count': updated_count
        })

class SlotStatisticsView(APIView):
    """Admin view for slot utilization statistics by vehicle type"""
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        
        
        # Get slot counts by vehicle type
        slot_stats = ParkingSlot.objects.values('vehicle_type').annotate(
            total_slots=Count('id'),
            occupied_slots=Count('id', filter=Q(is_occupied=True)),
            available_slots=Count('id', filter=Q(is_occupied=False))
        )
        
        # Get booking statistics by vehicle type
        booking_stats = Booking.objects.filter(is_active=True).values(
            'vehicle__vehicle_type'
        ).annotate(
            active_bookings=Count('id')
        )
        
        return Response({
            'slot_statistics': list(slot_stats),
            'booking_statistics': list(booking_stats)
        })