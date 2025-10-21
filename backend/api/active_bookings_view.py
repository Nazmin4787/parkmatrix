from django.db.models import Count, Q
from rest_framework import views, status, permissions
from rest_framework.response import Response
from .models import ParkingSlot, Booking, Vehicle
from .serializers import ParkingSlotSerializer
from datetime import datetime

class ActiveBookingsWithDetailsView(views.APIView):
    """
    API endpoint that returns active bookings with related vehicle and user details
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Get active bookings with user and vehicle details
        active_bookings = Booking.objects.filter(
            status__in=['confirmed', 'checked_in'],
            is_active=True
        ).select_related('user', 'slot', 'vehicle')
        
        # Format response data
        result = []
        for booking in active_bookings:
            result.append({
                'id': booking.id,
                'slot_id': booking.slot.id,
                'slot_number': booking.slot.slot_number,
                'user_id': booking.user.id,
                'user_name': f"{booking.user.first_name} {booking.user.last_name}",
                'vehicle_no': booking.vehicle.number_plate if booking.vehicle else None,
                'vehicle_type': booking.vehicle.vehicle_type if booking.vehicle else None,
                'check_in_time': booking.checked_in_at,
                'status': booking.status,
                'start_time': booking.start_time,
                'end_time': booking.end_time
            })
        
        return Response(result)