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
        # Include all active statuses: confirmed, verified, checked_in, checkout_requested
        active_bookings = Booking.objects.filter(
            status__in=['confirmed', 'verified', 'checked_in', 'checkout_requested'],
            is_active=True
        ).select_related('user', 'slot', 'vehicle')
        
        # Format response data
        result = []
        for booking in active_bookings:
            result.append({
                'id': booking.id,
                'slot': {
                    'id': booking.slot.id,
                    'slot_number': booking.slot.slot_number,
                },
                'vehicle': {
                    'number_plate': booking.vehicle.number_plate if booking.vehicle else None,
                    'vehicle_type': booking.vehicle.vehicle_type if booking.vehicle else None,
                },
                'user_id': booking.user.id,
                'user_name': f"{booking.user.first_name} {booking.user.last_name}",
                'checked_in_at': booking.checked_in_at,
                'checkout_requested_at': booking.checkout_requested_at if hasattr(booking, 'checkout_requested_at') else None,
                'status': booking.status,
                'start_time': booking.start_time,
                'end_time': booking.end_time
            })
        
        return Response(result)