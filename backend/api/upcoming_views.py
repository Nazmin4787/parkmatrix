from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .models import Booking
from .permissions import IsCustomerUser
from django.utils import timezone
from datetime import timedelta
from .serializers import BookingSerializer

class UpcomingBookingsView(APIView):
    """
    Get a list of the user's upcoming bookings for the next 24 hours.
    """
    permission_classes = [permissions.IsAuthenticated, IsCustomerUser]
    
    def get(self, request):
        now = timezone.now()
        next_24_hours = now + timedelta(hours=24)
        
        # Get active bookings that start in the next 24 hours
        upcoming_bookings = Booking.objects.filter(
            user=request.user,
            is_active=True,
            start_time__gte=now,
            start_time__lt=next_24_hours
        ).order_by('start_time')
        
        # Serialize the bookings
        serializer = BookingSerializer(upcoming_bookings, many=True)
        
        # Add time-to-start information for each booking
        results = []
        for booking in serializer.data:
            booking_obj = next((b for b in upcoming_bookings if str(b.id) == booking['id']), None)
            if booking_obj:
                time_to_start = booking_obj.start_time - now
                hours_to_start = time_to_start.total_seconds() / 3600
                
                # Add countdown information
                booking['time_to_start'] = {
                    'hours': int(hours_to_start),
                    'minutes': int((hours_to_start % 1) * 60)
                }
                
                # Add a countdown message based on time remaining
                if hours_to_start < 1:
                    minutes = int((hours_to_start % 1) * 60)
                    booking['countdown_message'] = f"Starting in {minutes} minutes"
                else:
                    booking['countdown_message'] = f"Starting in {int(hours_to_start)} hours"
                    
                results.append(booking)
        
        return Response({
            'upcoming_bookings': results,
            'count': len(results)
        })