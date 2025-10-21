from django.db.models import Count, Q
from rest_framework import views, status, permissions
from rest_framework.response import Response
from .models import ParkingSlot, Booking
from .serializers import ParkingSlotSerializer
from datetime import datetime

class SlotStatisticsView(views.APIView):
    """
    API endpoint that returns statistics about parking slots
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Get counts of total, occupied and free slots
        total_slots = ParkingSlot.objects.count()
        occupied_slots = ParkingSlot.objects.filter(is_occupied=True).count()
        free_slots = total_slots - occupied_slots
        
        # Calculate occupancy rate as a percentage
        occupancy_rate = 0
        if total_slots > 0:
            occupancy_rate = round((occupied_slots / total_slots) * 100)
        
        data = {
            'total_slots': total_slots,
            'occupied_slots': occupied_slots,
            'free_slots': free_slots,
            'occupancy_rate': occupancy_rate
        }
        
        return Response(data)

class DetailedSlotStatusView(views.APIView):
    """
    API endpoint that returns detailed information about all parking slots
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Get filter parameters
        status = request.query_params.get('status')
        
        # Filter slots based on status if provided
        slots = ParkingSlot.objects.all()
        if status == 'free':
            slots = slots.filter(is_occupied=False)
        elif status == 'occupied':
            slots = slots.filter(is_occupied=True)
            
        # Get active bookings for occupied slots to include vehicle and user info
        active_bookings = Booking.objects.filter(
            status__in=['active', 'confirmed', 'checked_in'],
            slot__in=slots.filter(is_occupied=True)
        )
        
        # Create a mapping of slot IDs to their bookings
        booking_map = {}
        for booking in active_bookings:
            booking_map[booking.slot.id] = {
                'user_id': booking.user.id,
                'user_name': f"{booking.user.first_name} {booking.user.last_name}",
                'vehicle_no': booking.vehicle.number_plate if booking.vehicle else None,
                'vehicle_type': booking.vehicle.vehicle_type if booking.vehicle else None,
                'check_in_time': booking.checked_in_at,
                'check_out_time': None  # We don't have a direct check-out time field
            }
        
        # Prepare response data with booking details where available
        result = []
        for slot in slots:
            slot_data = {
                'id': slot.id,
                'slot_id': slot.slot_number,
                'status': 'Occupied' if slot.is_occupied else 'Free',
                'location': f"{slot.section}-{slot.floor}",
                'vehicle_type': slot.vehicle_type
            }
            
            # Add booking details if slot is occupied
            if slot.is_occupied and slot.id in booking_map:
                booking_details = booking_map[slot.id]
                slot_data.update({
                    'user_id': booking_details['user_id'],
                    'user_name': booking_details['user_name'],
                    'vehicle_no': booking_details['vehicle_no'],
                    'vehicle_type': booking_details['vehicle_type'],
                    'check_in_time': booking_details['check_in_time'],
                    'check_out_time': booking_details['check_out_time']
                })
            
            result.append(slot_data)
        
        return Response(result)

class SlotUpdatesView(views.APIView):
    """
    API endpoint that returns updates to slot statuses since a given time
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Get the 'since' parameter (ISO format timestamp)
        since_param = request.query_params.get('since')
        
        try:
            if since_param:
                # Parse the timestamp
                since_time = datetime.fromisoformat(since_param.replace('Z', '+00:00'))
                
                # Get slots updated since the given time
                updated_slots = ParkingSlot.objects.filter(updated_at__gt=since_time)
                serializer = ParkingSlotSerializer(updated_slots, many=True)
                return Response(serializer.data)
            else:
                return Response(
                    {"error": "Missing 'since' parameter"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except ValueError:
            return Response(
                {"error": "Invalid timestamp format. Use ISO format (e.g., 2025-10-21T14:30:00Z)"},
                status=status.HTTP_400_BAD_REQUEST
            )