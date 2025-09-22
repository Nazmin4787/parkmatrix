from rest_framework import serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.utils import timezone
from decimal import Decimal
from .models import Booking, Notification
from .pricing import calculate_booking_price

class EarlyCheckInSerializer(serializers.Serializer):
    booking_id = serializers.IntegerField()
    new_start_time = serializers.DateTimeField(default=timezone.now)
    
    def validate(self, data):
        booking_id = data.get('booking_id')
        new_start_time = data.get('new_start_time')
        
        try:
            booking = Booking.objects.get(pk=booking_id, is_active=True)
        except Booking.DoesNotExist:
            raise serializers.ValidationError("Booking not found or not active.")
        
        # Check if new start time is earlier than original start time
        if new_start_time >= booking.start_time:
            raise serializers.ValidationError("New start time must be earlier than the original start time.")
        
        # Check if new start time is in the future
        if new_start_time < timezone.now():
            raise serializers.ValidationError("New start time cannot be in the past.")
        
        # Check if the slot is available for the earlier time
        conflicting_bookings = Booking.objects.filter(
            slot=booking.slot,
            start_time__lt=booking.start_time,
            end_time__gt=new_start_time,
            is_active=True
        ).exclude(pk=booking_id).exists()
        
        if conflicting_bookings:
            raise serializers.ValidationError("Slot is not available for early check-in at the requested time.")
        
        data['booking'] = booking
        return data


class EarlyCheckInView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = EarlyCheckInSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        data = serializer.validated_data
        booking = data['booking']
        
        # Check that the user owns this booking
        if booking.user != request.user:
            return Response(
                {"error": "You do not have permission to modify this booking."}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        new_start_time = data['new_start_time']
        original_price = booking.total_price
        
        # Recalculate price for extended duration
        new_price = calculate_booking_price(
            new_start_time, 
            booking.end_time, 
            booking.vehicle.vehicle_type
        )
        
        price_difference = new_price - original_price
        
        # Update booking
        booking.start_time = new_start_time
        booking.total_price = new_price
        
        # Add to extension history even though it's not technically an extension
        if not booking.extension_history:
            booking.extension_history = []
            
        booking.extension_history.append({
            'action': 'early_check_in',
            'original_start_time': booking.start_time.isoformat(),
            'new_start_time': new_start_time.isoformat(),
            'additional_cost': str(price_difference),
            'timestamp': timezone.now().isoformat()
        })
        
        booking.save()
        
        # Create notification
        Notification.objects.create(
            user=request.user,
            notification_type='booking_update',
            title='Early Check-in Confirmed',
            message=f'Your booking has been updated for early check-in. Additional cost: ${price_difference:.2f}',
            related_object_id=str(booking.id),
            related_object_type='Booking'
        )
        
        return Response({
            'booking_id': booking.id,
            'new_start_time': booking.start_time,
            'total_price': booking.total_price,
            'additional_cost': price_difference
        }, status=status.HTTP_200_OK)