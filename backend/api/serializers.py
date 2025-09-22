
from rest_framework import serializers
from .models import User, ParkingSlot, Booking, ParkingLot, Vehicle, Notification
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
    id = serializers.CharField(read_only=True)  # Handle MongoDB ObjectId as string
    parking_lot = ParkingLotSerializer(read_only=True)
    
    class Meta:
        model = ParkingSlot
        fields = ['id', 'slot_number', 'floor', 'is_occupied', 'parking_lot']

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
    slot = serializers.PrimaryKeyRelatedField(queryset=ParkingSlot.objects.all())
    
    # Use CharField for start/end time to accept various formats
    start_time = serializers.DateTimeField()
    end_time = serializers.DateTimeField()

    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'slot', 'vehicle', 'start_time', 'end_time', 
            'total_price', 'is_active', 'initial_end_time', 'extension_count'
        ]
        read_only_fields = ['user', 'total_price', 'initial_end_time', 'extension_count']

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
