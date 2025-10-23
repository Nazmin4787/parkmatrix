from rest_framework import serializers
from .models import User, ParkingSlot, Booking, ParkingLot, Vehicle, Notification, AuditLog, AccessLog, PricingRate, ZonePricingRate
from datetime import timedelta
from django.utils import timezone


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True, style={'input_type': 'password'})


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    id = serializers.CharField(read_only=True)  # Handle MongoDB ObjectId as string

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'password']
    

    def validate_username(self, value):
        # Skip validation for now to avoid database issues
        return value
    
    def validate_email(self, value):
        # Skip validation for now to avoid database issues
        return value
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password is not None:
            user.set_password(password)
        user.save()
        return user

class ParkingLotSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParkingLot
        fields = '__all__'

class ParkingSlotSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    parking_lot = ParkingLotSerializer(read_only=True)
    is_compatible = serializers.SerializerMethodField()
    parking_zone_display = serializers.SerializerMethodField()
    
    class Meta:
        model = ParkingSlot
        fields = ['id', 'slot_number', 'floor', 'section', 'is_occupied', 'vehicle_type', 'parking_lot', 'is_compatible', 'parking_zone', 'parking_zone_display']
    
    def get_is_compatible(self, obj):
        """Check if slot is compatible with user's vehicle types"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            user_vehicle_types = request.user.vehicle_set.values_list('vehicle_type', flat=True)
            return any(obj.is_compatible_with_vehicle(v_type) for v_type in user_vehicle_types)
        return True
    
    def get_parking_zone_display(self, obj):
        """Get human-readable zone name"""
        return obj.get_parking_zone_display()

class VehicleSerializer(serializers.ModelSerializer):

    class Meta:
        model = Vehicle
        fields = ['id', 'vehicle_type', 'number_plate', 'model', 'color', 'is_default']

    def validate(self, data):
        # Only validate uniqueness if we have a request context
        if hasattr(self, 'context') and 'request' in self.context:
            user = self.context['request'].user
            number_plate = data.get('number_plate')

            # Skip validation during nested serialization in BookingSerializer
            if self.parent and isinstance(self.parent, BookingSerializer):
                return data

            # Check if vehicle with same number plate already exists for this user
            if Vehicle.objects.filter(user=user, number_plate__iexact=number_plate).exists():
                raise serializers.ValidationError("Vehicle with this number plate already exists.")

        return data


from rest_framework import serializers
from .models import User, ParkingSlot, Booking, ParkingLot, Vehicle, Notification, PricingRate
from datetime import timedelta
from django.utils import timezone
from .pricing import calculate_booking_price, calculate_extension_price

class PricingRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PricingRate
        fields = '__all__'

class BookingSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    vehicle = VehicleSerializer(required=False) # Made not required for updates
    slot = ParkingSlotSerializer(read_only=True)
    slot_id = serializers.PrimaryKeyRelatedField(
        queryset=ParkingSlot.objects.all(),
        source='slot',
        write_only=True
    )
    
    # Add parking zone display for direct access
    parking_zone_display = serializers.SerializerMethodField()
    
    # Use CharField for start/end time to accept various formats
    start_time = serializers.DateTimeField()
    end_time = serializers.DateTimeField()
    
    # Read-only fields for check-in/check-out details
    checked_in_by = UserSerializer(read_only=True)
    checked_out_by = UserSerializer(read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'slot', 'slot_id', 'parking_zone_display', 'vehicle', 
            'start_time', 'end_time', 'total_price', 'is_active', 
            'initial_end_time', 'extension_count', 'status', 'secret_code',
            'checked_in_at', 'checked_in_by', 'checked_in_ip', 'check_in_notes', 
            'checked_out_at', 'checked_out_by', 'checked_out_ip', 'check_out_notes', 
            'actual_duration_minutes', 'overtime_minutes', 'overtime_amount'
        ]
        read_only_fields = [
            'user', 'slot', 'parking_zone_display', 'total_price', 'initial_end_time', 
            'extension_count', 'status', 'secret_code', 'checked_in_at', 'checked_in_by', 
            'checked_in_ip', 'checked_out_at', 'checked_out_by', 'checked_out_ip',
            'actual_duration_minutes', 'overtime_minutes', 'overtime_amount'
        ]
    
    def get_parking_zone_display(self, obj):
        """Get the human-readable parking zone name"""
        if obj.slot and obj.slot.parking_zone:
            return obj.slot.get_parking_zone_display()
        return None

    def validate(self, data):
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        slot = data.get('slot')

        if start_time >= end_time:
            raise serializers.ValidationError("End time must be after start time.")

        # Check if the slot is already occupied
        if slot.is_occupied:
            # Import here to avoid circular imports
            from .utils import find_alternative_slots
            
            # Find alternative time slots
            alternatives = find_alternative_slots(slot, start_time, end_time)
            
            # Format alternatives for better display
            formatted_alternatives = []
            for alt in alternatives:
                formatted_alternatives.append({
                    'start_time': alt['start_time'].strftime('%Y-%m-%d %H:%M'),
                    'end_time': alt['end_time'].strftime('%Y-%m-%d %H:%M'),
                    'message': alt.get('message', 'Available slot')
                })
            
            # Custom error with suggestions
            error_msg = {
                'error': "This parking slot is already occupied.",
                'alternative_slots': formatted_alternatives
            }
            
            raise serializers.ValidationError(error_msg)

        # Check for booking conflicts
        conflicting_bookings = Booking.objects.filter(
            slot=slot,
            start_time__lt=end_time,
            end_time__gt=start_time,
            is_active=True
        ).exclude(pk=self.instance.pk if self.instance else None)

        if conflicting_bookings.exists():
            # Import here to avoid circular imports
            from .utils import find_alternative_slots
            
            # Find alternative time slots
            alternatives = find_alternative_slots(slot, start_time, end_time)
            
            # Format alternatives for better display
            formatted_alternatives = []
            for alt in alternatives:
                formatted_alternatives.append({
                    'start_time': alt['start_time'].strftime('%Y-%m-%d %H:%M'),
                    'end_time': alt['end_time'].strftime('%Y-%m-%d %H:%M'),
                    'message': alt.get('message', 'Available slot')
                })
            
            # Custom error with suggestions
            error_msg = {
                'error': "This time slot is already booked.",
                'alternative_slots': formatted_alternatives
            }
            
            raise serializers.ValidationError(error_msg)

        return data

    def create(self, validated_data):
        user = self.context['request'].user
        vehicle_data = validated_data.pop('vehicle', None)
        
        if not vehicle_data:
            # Use user's default vehicle if none is provided
            vehicle = Vehicle.objects.filter(user=user, is_default=True).first()
            if not vehicle:
                raise serializers.ValidationError("No vehicle provided and no default vehicle set.")
        else:
            number_plate = vehicle_data.get('number_plate')
            if not number_plate:
                raise serializers.ValidationError("Vehicle number plate is required.")

            # Try to find an existing vehicle first
            vehicle = Vehicle.objects.filter(user=user, number_plate__iexact=number_plate).first()

            if not vehicle:
                # If no vehicle found, we need enough data to create one.
                # The VehicleSerializer will validate this.
                vehicle_serializer = VehicleSerializer(data=vehicle_data, context=self.context)
                vehicle_serializer.is_valid(raise_exception=True)
                vehicle = vehicle_serializer.save(user=user)
            # If vehicle is found, we just use it.

        start_time = validated_data.get('start_time')
        end_time = validated_data.get('end_time')
        
        # Calculate price
        total_price = calculate_booking_price(start_time, end_time, vehicle.vehicle_type)
        
        booking = Booking.objects.create(
            user=user,
            vehicle=vehicle,
            total_price=total_price,
            **validated_data
        )
        
        # Mark the slot as occupied
        slot = validated_data.get('slot')
        slot.is_occupied = True
        slot.save()
        
        return booking

class ExtendBookingSerializer(serializers.Serializer):
    new_end_time = serializers.DateTimeField()

    def validate_new_end_time(self, value):
        booking = self.context.get('booking')
        if value <= booking.end_time:
            raise serializers.ValidationError("New end time must be after the current end time.")
        
        # Check for conflicts
        conflicting = Booking.objects.filter(
            slot=booking.slot,
            start_time__lt=value,
            end_time__gt=booking.end_time,
            is_active=True
        ).exclude(pk=booking.pk).exists()
        
        if conflicting:
            raise serializers.ValidationError("Cannot extend, slot is booked by another user.")
            
        return value

class PricePreviewSerializer(serializers.Serializer):
    start_time = serializers.DateTimeField()
    end_time = serializers.DateTimeField()
    vehicle_type = serializers.CharField()

    def validate(self, data):
        if data['start_time'] >= data['end_time']:
            raise serializers.ValidationError("End time must be after start time.")
        return data


class NotificationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Notification
        fields = ['id', 'user', 'notification_type', 'title', 'message', 'related_object_id', 
                 'related_object_type', 'additional_data', 'is_read', 'created_at']
        read_only_fields = ['created_at', 'additional_data']
    
    def create(self, validated_data):
        # Get the user from the context if it's not provided in the data
        user = None
        if 'user' not in validated_data and 'request' in self.context:
            user = self.context['request'].user
            validated_data['user'] = user
        
        return Notification.objects.create(**validated_data)

# Add a new serializer for admin slot management
class AdminParkingSlotSerializer(serializers.ModelSerializer):
    parking_lot_name = serializers.CharField(source='parking_lot.name', read_only=True)
    parking_zone_display = serializers.SerializerMethodField()
    
    class Meta:
        model = ParkingSlot
        fields = ['id', 'slot_number', 'floor', 'section', 'vehicle_type', 'is_occupied', 'parking_lot', 'parking_lot_name', 'pos_x', 'pos_y', 'height_cm', 'width_cm', 'length_cm', 'parking_zone', 'parking_zone_display']
    
    def get_parking_zone_display(self, obj):
        """Get human-readable zone name"""
        return obj.get_parking_zone_display()


# Check-in/Check-out Serializers
class CheckInSerializer(serializers.Serializer):
    """
    Serializer for check-in operation
    """
    booking_id = serializers.IntegerField()
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_booking_id(self, value):
        try:
            booking = Booking.objects.get(id=value)
        except Booking.DoesNotExist:
            raise serializers.ValidationError("Booking not found")
        return value


class CheckOutSerializer(serializers.Serializer):
    """
    Serializer for check-out operation
    """
    booking_id = serializers.IntegerField()
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_booking_id(self, value):
        try:
            booking = Booking.objects.get(id=value)
        except Booking.DoesNotExist:
            raise serializers.ValidationError("Booking not found")
        return value


class AuditLogSerializer(serializers.ModelSerializer):
    """
    Serializer for AuditLog model
    """
    user = UserSerializer(read_only=True)
    booking_details = serializers.SerializerMethodField()
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'booking', 'booking_details', 'user', 'action', 
            'timestamp', 'ip_address', 'user_agent', 'success', 
            'error_message', 'notes', 'additional_data'
        ]
        read_only_fields = ['timestamp']
    
    def get_booking_details(self, obj):
        """
        Return minimal booking information for audit log display
        """
        if obj.booking:
            return {
                'id': obj.booking.id,
                'slot_number': obj.booking.slot.slot_number,
                'user': obj.booking.user.username,
                'vehicle': obj.booking.vehicle.number_plate if obj.booking.vehicle else None
            }
        return None


class NearestParkingLocationSerializer(serializers.Serializer):
    """
    Serializer for nearest parking location information.
    Used to display parking locations with distance and availability.
    """
    name = serializers.CharField(max_length=100)
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    radius_meters = serializers.IntegerField()
    distance_meters = serializers.FloatField()
    distance_km = serializers.FloatField()
    walking_time_minutes = serializers.IntegerField()
    driving_time_minutes = serializers.IntegerField()
    total_slots = serializers.IntegerField()
    occupied_slots = serializers.IntegerField()
    available_slots = serializers.IntegerField()
    occupancy_percentage = serializers.FloatField()
    availability_status = serializers.CharField(max_length=20)
    availability_color = serializers.CharField(max_length=20)
    
    # Optional fields that can be added later
    address = serializers.CharField(max_length=255, required=False, allow_null=True)
    price_per_hour = serializers.DecimalField(max_digits=8, decimal_places=2, required=False, allow_null=True)
    amenities = serializers.ListField(child=serializers.CharField(), required=False, allow_null=True)


class AccessLogSerializer(serializers.ModelSerializer):
    """
    Serializer for Access Log model with all details
    """
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    session_duration = serializers.IntegerField(read_only=True, help_text="Session duration in minutes")
    is_active_session = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = AccessLog
        fields = [
            'id', 'user', 'user_id', 'username', 'email', 'role',
            'login_timestamp', 'logout_timestamp', 'session_duration',
            'ip_address', 'location_city', 'location_country',
            'latitude', 'longitude', 'status', 'failure_reason',
            'user_agent', 'device_type', 'browser', 'operating_system',
            'session_id', 'is_active_session'
        ]
        read_only_fields = [
            'id', 'login_timestamp', 'session_duration', 'is_active_session'
        ]


class AccessLogListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for list view (excludes heavy fields)
    """
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    session_duration = serializers.IntegerField(read_only=True)
    is_active_session = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = AccessLog
        fields = [
            'id', 'user_id', 'username', 'role',
            'login_timestamp', 'logout_timestamp', 'session_duration',
            'ip_address', 'location_city', 'location_country',
            'status', 'device_type', 'is_active_session'
        ]


class AccessLogStatsSerializer(serializers.Serializer):
    """
    Serializer for access log statistics
    """
    total_logins = serializers.IntegerField()
    successful_logins = serializers.IntegerField()
    failed_logins = serializers.IntegerField()
    unique_users = serializers.IntegerField()
    active_sessions = serializers.IntegerField()
    logins_by_role = serializers.DictField()
    logins_by_status = serializers.DictField()
    recent_failed_attempts = serializers.ListField()


# ============================================
# Check-In/Check-Out Log Serializers
# ============================================

class AuditLogSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for AuditLog (check-in/check-out logs)
    """
    booking_id = serializers.IntegerField(source='booking.id', read_only=True)
    user_username = serializers.CharField(source='booking.user.username', read_only=True)
    user_email = serializers.EmailField(source='booking.user.email', read_only=True)
    vehicle_type = serializers.CharField(source='booking.vehicle.vehicle_type', read_only=True)
    vehicle_plate = serializers.CharField(source='booking.vehicle.number_plate', read_only=True)
    slot_number = serializers.CharField(source='booking.slot.slot_number', read_only=True)
    floor = serializers.CharField(source='booking.slot.floor', read_only=True)
    section = serializers.CharField(source='booking.slot.section', read_only=True)
    parking_lot = serializers.CharField(source='booking.slot.parking_lot.name', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'booking_id', 'action', 'action_display', 'timestamp',
            'user_username', 'user_email', 'vehicle_type', 'vehicle_plate',
            'parking_lot', 'slot_number', 'floor', 'section',
            'ip_address', 'user_agent', 'success', 'error_message', 
            'notes', 'additional_data'
        ]


class AuditLogListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for AuditLog list view
    """
    booking_id = serializers.IntegerField(source='booking.id', read_only=True)
    user_id = serializers.IntegerField(source='booking.user.id', read_only=True)
    user_username = serializers.CharField(source='booking.user.username', read_only=True)
    vehicle_type = serializers.CharField(source='booking.vehicle.vehicle_type', read_only=True)
    vehicle_plate = serializers.CharField(source='booking.vehicle.number_plate', read_only=True)
    slot_number = serializers.CharField(source='booking.slot.slot_number', read_only=True)
    parking_zone = serializers.SerializerMethodField()
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    status = serializers.SerializerMethodField()
    checkin_time = serializers.SerializerMethodField()
    checkout_time = serializers.SerializerMethodField()
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'booking_id', 'user_id', 'action', 'action_display', 'timestamp',
            'user_username', 'vehicle_type', 'vehicle_plate',
            'parking_zone', 'slot_number', 'ip_address', 'status',
            'checkin_time', 'checkout_time'
        ]
    
    def get_parking_zone(self, obj):
        """Get the parking zone name"""
        if obj.booking and obj.booking.slot and obj.booking.slot.parking_zone:
            return obj.booking.slot.get_parking_zone_display()
        return 'Unknown'
    
    def get_status(self, obj):
        return 'Success' if obj.success else 'Failed'
    
    def get_checkin_time(self, obj):
        """Return the check-in time from the booking"""
        if obj.booking and obj.booking.checked_in_at:
            return obj.booking.checked_in_at
        return None
    
    def get_checkout_time(self, obj):
        """Return the check-out time from the booking"""
        if obj.booking and obj.booking.checked_out_at:
            return obj.booking.checked_out_at
        return None


class AuditLogStatsSerializer(serializers.Serializer):
    """
    Serializer for check-in/check-out statistics
    """
    total_check_ins = serializers.IntegerField()
    failed_check_ins = serializers.IntegerField()
    total_check_outs = serializers.IntegerField()
    failed_check_outs = serializers.IntegerField()
    currently_parked = serializers.IntegerField()
    average_parking_duration_hours = serializers.FloatField()
    total_completed_sessions = serializers.IntegerField()
    check_ins_by_vehicle_type = serializers.DictField()
    hourly_check_ins_today = serializers.ListField()
    peak_hours = serializers.ListField()
    recent_failed_attempts = serializers.ListField()


class CurrentlyParkedVehicleSerializer(serializers.ModelSerializer):
    """
    Serializer for currently parked vehicles
    """
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    vehicle_info = serializers.SerializerMethodField()
    slot_info = serializers.SerializerMethodField()
    duration_minutes = serializers.SerializerMethodField()
    expected_checkout = serializers.DateTimeField(source='end_time', read_only=True)
    is_overtime = serializers.SerializerMethodField()
    
    class Meta:
        model = Booking
        fields = [
            'id', 'user_username', 'user_email', 'vehicle_info',
            'slot_info', 'checked_in_at', 'expected_checkout',
            'duration_minutes', 'is_overtime', 'overtime_minutes',
            'check_in_notes'
        ]
    
    def get_vehicle_info(self, obj):
        if obj.vehicle:
            return {
                'type': obj.vehicle.vehicle_type,
                'number_plate': obj.vehicle.number_plate,
                'model': obj.vehicle.model,
                'color': obj.vehicle.color
            }
        return None
    
    def get_slot_info(self, obj):
        if obj.slot:
            return {
                'slot_number': obj.slot.slot_number,
                'floor': obj.slot.floor,
                'section': obj.slot.section,
                'parking_zone': obj.slot.get_parking_zone_display() if obj.slot.parking_zone else 'Unknown'
            }
        return None
    
    def get_duration_minutes(self, obj):
        if obj.checked_in_at:
            from django.utils import timezone
            duration = timezone.now() - obj.checked_in_at
            return int(duration.total_seconds() / 60)
        return 0
    
    def get_is_overtime(self, obj):
        if obj.end_time:
            from django.utils import timezone
            return timezone.now() > obj.end_time
        return False


# ============================================================================
# FEATURE 2: USER PARKING HISTORY SERIALIZERS
# ============================================================================

class VehicleInfoSerializer(serializers.Serializer):
    """Serializer for vehicle information in parking history"""
    type = serializers.CharField()
    plate = serializers.CharField()
    model = serializers.CharField(required=False, allow_null=True)
    color = serializers.CharField(required=False, allow_null=True)


class LocationInfoSerializer(serializers.Serializer):
    """Serializer for location information in parking history"""
    name = serializers.CharField()
    zone = serializers.CharField(required=False, allow_null=True)
    floor = serializers.CharField(required=False, allow_null=True)
    slot_number = serializers.CharField(required=False, allow_null=True)


class TimingInfoSerializer(serializers.Serializer):
    """Serializer for timing information in parking history"""
    check_in = serializers.DateTimeField()
    check_out = serializers.DateTimeField(required=False, allow_null=True)
    duration_minutes = serializers.IntegerField()
    duration_formatted = serializers.CharField()


class PaymentInfoSerializer(serializers.Serializer):
    """Serializer for payment information in parking history"""
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField(default='BDT')
    status = serializers.CharField()
    method = serializers.CharField(required=False, allow_null=True)


class ParkingSessionSerializer(serializers.ModelSerializer):
    """Detailed serializer for parking session (user history)"""
    user = serializers.SerializerMethodField()
    vehicle = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    timing = serializers.SerializerMethodField()
    payment = serializers.SerializerMethodField()
    session_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Booking
        fields = [
            'id',
            'booking_id',
            'user',
            'vehicle',
            'location',
            'timing',
            'payment',
            'session_status',
            'notes'
        ]
    
    def get_booking_id(self, obj):
        return obj.id
    
    def get_user(self, obj):
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'email': obj.user.email
        }
    
    def get_vehicle(self, obj):
        if obj.vehicle:
            return {
                'type': obj.vehicle.vehicle_type,
                'plate': obj.vehicle.number_plate,
                'model': obj.vehicle.model or 'N/A',
                'color': obj.vehicle.color or 'N/A'
            }
        return {
            'type': 'N/A',
            'plate': 'N/A',
            'model': 'N/A',
            'color': 'N/A'
        }
    
    def get_location(self, obj):
        if obj.slot:
            return {
                'name': obj.slot.parking_lot.name if obj.slot.parking_lot else 'Unknown',
                'zone': obj.slot.section or 'N/A',
                'floor': obj.slot.floor or 'N/A',
                'slot_number': obj.slot.slot_number or 'N/A'
            }
        return {
            'name': 'Unknown',
            'zone': 'N/A',
            'floor': 'N/A',
            'slot_number': 'N/A'
        }
    
    def get_timing(self, obj):
        check_in_time = obj.checked_in_at or obj.start_time
        check_out_time = obj.checked_out_at
        
        # Calculate duration
        duration_minutes = 0
        if check_in_time and check_out_time:
            duration = check_out_time - check_in_time
            duration_minutes = int(duration.total_seconds() / 60)
        elif check_in_time and obj.status == 'checked_in':
            # Currently parked
            duration = timezone.now() - check_in_time
            duration_minutes = int(duration.total_seconds() / 60)
        
        # Format duration
        hours = duration_minutes // 60
        minutes = duration_minutes % 60
        if hours > 0:
            duration_formatted = f"{hours}h {minutes}m"
        else:
            duration_formatted = f"{minutes}m"
        
        return {
            'check_in': check_in_time,
            'check_out': check_out_time,
            'duration_minutes': duration_minutes,
            'duration_formatted': duration_formatted
        }
    
    def get_payment(self, obj):
        # Determine payment status
        payment_status = 'pending'
        if obj.status == 'checked_out':
            payment_status = 'paid'
        elif obj.status == 'cancelled':
            payment_status = 'refunded'
        
        return {
            'amount': float(obj.total_price) if obj.total_price else 0.00,
            'currency': 'BDT',
            'status': payment_status,
            'method': 'N/A'  # Can be extended if payment method is tracked
        }
    
    def get_session_status(self, obj):
        """Map booking status to session status"""
        status_mapping = {
            'pending': 'pending',
            'confirmed': 'active',
            'checked_in': 'active',
            'checked_out': 'completed',
            'cancelled': 'cancelled',
            'expired': 'expired'
        }
        return status_mapping.get(obj.status, 'unknown')
    
    def get_notes(self, obj):
        notes = []
        if obj.check_in_notes:
            notes.append(f"Check-in: {obj.check_in_notes}")
        if obj.check_out_notes:
            notes.append(f"Check-out: {obj.check_out_notes}")
        return ' | '.join(notes) if notes else ''


class ParkingSessionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for parking session list view"""
    vehicle_plate = serializers.SerializerMethodField()
    vehicle_type = serializers.SerializerMethodField()
    location_name = serializers.SerializerMethodField()
    check_in_time = serializers.SerializerMethodField()
    check_out_time = serializers.SerializerMethodField()
    duration = serializers.SerializerMethodField()
    amount = serializers.SerializerMethodField()
    session_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Booking
        fields = [
            'id',
            'vehicle_plate',
            'vehicle_type',
            'location_name',
            'check_in_time',
            'check_out_time',
            'duration',
            'amount',
            'session_status'
        ]
    
    def get_vehicle_plate(self, obj):
        return obj.vehicle.number_plate if obj.vehicle else 'N/A'
    
    def get_vehicle_type(self, obj):
        return obj.vehicle.vehicle_type if obj.vehicle else 'N/A'
    
    def get_location_name(self, obj):
        """Get the parking zone name"""
        if obj.slot and obj.slot.parking_zone:
            return obj.slot.get_parking_zone_display()
        return 'Unknown'
    
    def get_check_in_time(self, obj):
        return obj.checked_in_at or obj.start_time
    
    def get_check_out_time(self, obj):
        return obj.checked_out_at
    
    def get_duration(self, obj):
        check_in = obj.checked_in_at or obj.start_time
        check_out = obj.checked_out_at
        
        if check_in and check_out:
            duration = check_out - check_in
            minutes = int(duration.total_seconds() / 60)
            hours = minutes // 60
            mins = minutes % 60
            return f"{hours}h {mins}m" if hours > 0 else f"{mins}m"
        elif check_in and obj.status == 'checked_in':
            duration = timezone.now() - check_in
            minutes = int(duration.total_seconds() / 60)
            hours = minutes // 60
            mins = minutes % 60
            return f"{hours}h {mins}m (ongoing)" if hours > 0 else f"{mins}m (ongoing)"
        return 'N/A'
    
    def get_amount(self, obj):
        return float(obj.total_price) if obj.total_price else 0.00
    
    def get_session_status(self, obj):
        status_mapping = {
            'pending': 'pending',
            'confirmed': 'active',
            'checked_in': 'active',
            'checked_out': 'completed',
            'cancelled': 'cancelled',
            'expired': 'expired'
        }
        return status_mapping.get(obj.status, 'unknown')


class UserParkingStatsSerializer(serializers.Serializer):
    """Serializer for user parking statistics"""
    total_sessions = serializers.IntegerField()
    total_time_parked = serializers.DictField()
    total_amount_paid = serializers.DecimalField(max_digits=10, decimal_places=2)
    favorite_location = serializers.DictField(required=False, allow_null=True)
    most_used_vehicle = serializers.DictField(required=False, allow_null=True)
    average_duration_minutes = serializers.IntegerField()
    average_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    this_month = serializers.DictField()
    active_sessions = serializers.IntegerField()
    completed_sessions = serializers.IntegerField()


# ============================================================================
# PRICING RATE SERIALIZERS - For managing parking rates
# ============================================================================

class PricingRateSerializer(serializers.ModelSerializer):
    """
    Full serializer for PricingRate with all details.
    Used for detailed view and display.
    """
    vehicle_type_display = serializers.CharField(source='get_vehicle_type_display', read_only=True)
    is_valid = serializers.SerializerMethodField()
    
    class Meta:
        model = PricingRate
        fields = [
            'id', 'rate_name', 'description', 'vehicle_type', 'vehicle_type_display',
            'hourly_rate', 'daily_rate', 'weekend_rate', 'holiday_rate',
            'time_slot_start', 'time_slot_end', 'special_rate',
            'extension_rate_multiplier', 'is_active', 'is_default',
            'effective_from', 'effective_to', 'is_valid',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'vehicle_type_display', 'is_valid']
    
    def get_is_valid(self, obj):
        """Check if rate is currently valid"""
        return obj.is_valid_now()


class PricingRateListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for listing rates.
    Shows only essential information for table/list views.
    """
    vehicle_type_display = serializers.CharField(source='get_vehicle_type_display', read_only=True)
    is_valid = serializers.SerializerMethodField()
    
    class Meta:
        model = PricingRate
        fields = [
            'id', 'rate_name', 'vehicle_type', 'vehicle_type_display',
            'hourly_rate', 'daily_rate', 'is_active', 'is_default', 'is_valid'
        ]
        read_only_fields = ['id', 'vehicle_type_display', 'is_valid']
    
    def get_is_valid(self, obj):
        """Check if rate is currently valid"""
        return obj.is_valid_now()


class PricingRateCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating rates.
    Includes comprehensive validation.
    """
    
    class Meta:
        model = PricingRate
        fields = [
            'rate_name', 'description', 'vehicle_type',
            'hourly_rate', 'daily_rate', 'weekend_rate', 'holiday_rate',
            'time_slot_start', 'time_slot_end', 'special_rate',
            'extension_rate_multiplier', 'is_active', 'is_default',
            'effective_from', 'effective_to'
        ]
    
    def validate_hourly_rate(self, value):
        """Validate hourly rate is positive"""
        if value is not None and value <= 0:
            raise serializers.ValidationError("Hourly rate must be greater than 0")
        return value
    
    def validate_daily_rate(self, value):
        """Validate daily rate is positive if provided"""
        if value is not None and value <= 0:
            raise serializers.ValidationError("Daily rate must be greater than 0")
        return value
    
    def validate_weekend_rate(self, value):
        """Validate weekend rate is positive if provided"""
        if value is not None and value <= 0:
            raise serializers.ValidationError("Weekend rate must be greater than 0")
        return value
    
    def validate_holiday_rate(self, value):
        """Validate holiday rate is positive if provided"""
        if value is not None and value <= 0:
            raise serializers.ValidationError("Holiday rate must be greater than 0")
        return value
    
    def validate_special_rate(self, value):
        """Validate special rate is positive if provided"""
        if value is not None and value <= 0:
            raise serializers.ValidationError("Special rate must be greater than 0")
        return value
    
    def validate_extension_rate_multiplier(self, value):
        """Validate extension rate multiplier is positive"""
        if value is not None and value <= 0:
            raise serializers.ValidationError("Extension rate multiplier must be greater than 0")
        return value
    
    def validate(self, data):
        """
        Comprehensive validation for the rate data.
        """
        # Ensure at least one rate type is provided
        has_hourly = data.get('hourly_rate') is not None and data.get('hourly_rate') != ''
        has_daily = data.get('daily_rate') is not None and data.get('daily_rate') != ''
        
        if not has_hourly and not has_daily:
            raise serializers.ValidationError({
                'rate_type': 'At least one rate type (hourly or daily) must be provided'
            })
        
        # Validate effective date range
        if data.get('effective_from') and data.get('effective_to'):
            if data['effective_from'] >= data['effective_to']:
                raise serializers.ValidationError({
                    'effective_to': 'Effective end date must be after start date'
                })
        
        # Validate time slot
        if data.get('time_slot_start') or data.get('time_slot_end') or data.get('special_rate'):
            if not (data.get('time_slot_start') and data.get('time_slot_end') and data.get('special_rate')):
                raise serializers.ValidationError({
                    'time_slot': 'Time slot start, end, and special rate must all be provided together'
                })
        
        # Check for overlapping rates (only for active rates with same vehicle type and defined date ranges)
        if data.get('is_active', True):
            vehicle_type = data.get('vehicle_type')
            effective_from = data.get('effective_from')
            effective_to = data.get('effective_to')
            
            # Only check for overlaps if date range is specified
            # If no dates are specified, allow multiple active rates (admin can manage them)
            if effective_from or effective_to:
                # Build query to find overlapping rates
                overlapping_query = PricingRate.objects.filter(
                    vehicle_type=vehicle_type,
                    is_active=True
                )
                
                # Exclude current instance if updating
                if self.instance:
                    overlapping_query = overlapping_query.exclude(pk=self.instance.pk)
                
                # Check for date overlap
                if effective_from and effective_to:
                    overlapping_query = overlapping_query.filter(
                        effective_from__lte=effective_to,
                        effective_to__gte=effective_from
                    )
                elif effective_from:
                    overlapping_query = overlapping_query.filter(
                        effective_to__isnull=True
                    ) | overlapping_query.filter(
                        effective_to__gte=effective_from
                    )
                elif effective_to:
                    overlapping_query = overlapping_query.filter(
                        effective_from__isnull=True
                    ) | overlapping_query.filter(
                        effective_from__lte=effective_to
                    )
                
                if overlapping_query.exists():
                    raise serializers.ValidationError({
                        'effective_dates': f'Another active rate for {vehicle_type} already exists in this time period'
                    })
        
        return data


class FeeCalculationSerializer(serializers.Serializer):
    """
    Serializer for fee calculation requests.
    """
    vehicle_type = serializers.ChoiceField(choices=PricingRate.VEHICLE_TYPE_CHOICES)
    hours = serializers.DecimalField(max_digits=5, decimal_places=2, default=0, min_value=0)
    days = serializers.IntegerField(default=0, min_value=0)
    booking_datetime = serializers.DateTimeField(required=False, allow_null=True)
    
    def validate(self, data):
        """Ensure at least hours or days is provided"""
        if data.get('hours', 0) == 0 and data.get('days', 0) == 0:
            raise serializers.ValidationError('Either hours or days must be greater than 0')
        return data


class FeeCalculationResponseSerializer(serializers.Serializer):
    """
    Serializer for fee calculation response.
    """
    vehicle_type = serializers.CharField()
    rate_name = serializers.CharField()
    hourly_rate = serializers.DecimalField(max_digits=6, decimal_places=2)
    daily_rate = serializers.DecimalField(max_digits=8, decimal_places=2, allow_null=True)
    applicable_rate = serializers.DecimalField(max_digits=6, decimal_places=2)
    hours = serializers.DecimalField(max_digits=5, decimal_places=2)
    days = serializers.IntegerField()
    total_fee = serializers.DecimalField(max_digits=10, decimal_places=2)
    breakdown = serializers.DictField()
    is_weekend = serializers.BooleanField()
    is_special_time = serializers.BooleanField()


class ZonePricingRateSerializer(serializers.ModelSerializer):
    """Serializer for zone pricing rates"""
    parking_zone_display = serializers.CharField(source='get_parking_zone_display', read_only=True)
    vehicle_type_display = serializers.CharField(source='get_vehicle_type_display', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    is_valid = serializers.SerializerMethodField()
    
    class Meta:
        model = ZonePricingRate
        fields = [
            'id', 'parking_zone', 'parking_zone_display',
            'vehicle_type', 'vehicle_type_display',
            'rate_name', 'description',
            'hourly_rate', 'daily_rate', 'weekend_rate',
            'is_active', 'effective_from', 'effective_to',
            'created_by', 'created_by_name',
            'created_at', 'updated_at', 'is_valid'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None
    
    def get_is_valid(self, obj):
        return obj.is_valid_now()
    
    def validate(self, data):
        """Validate that only one active rate exists per zone-vehicle combination"""
        parking_zone = data.get('parking_zone')
        vehicle_type = data.get('vehicle_type')
        is_active = data.get('is_active', True)
        
        if is_active:
            # Check if another active rate exists for same zone-vehicle combo
            existing = ZonePricingRate.objects.filter(
                parking_zone=parking_zone,
                vehicle_type=vehicle_type,
                is_active=True
            )
            
            # Exclude current instance when updating
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            
            if existing.exists():
                raise serializers.ValidationError(
                    f"An active rate already exists for {parking_zone} - {vehicle_type}. "
                    "Please deactivate the existing rate first."
                )
        
        return data


class ZonePricingRateBulkUpdateSerializer(serializers.Serializer):
    """Serializer for bulk updating zone pricing rates"""
    rates = ZonePricingRateSerializer(many=True)
    
    def validate_rates(self, value):
        if not value:
            raise serializers.ValidationError("At least one rate must be provided")
        return value
