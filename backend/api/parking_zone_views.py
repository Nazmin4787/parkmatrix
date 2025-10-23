"""
Parking Zone Management Views
Handles zone-wise parking slot management and filtering
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from .models import ParkingSlot, Booking
from .serializers import ParkingSlotSerializer
from .utils import PARKING_LOCATIONS


class ParkingZoneListView(APIView):
    """
    GET: List all available parking zones with their details
    """
    permission_classes = []  # Public endpoint
    
    def get(self, request):
        """Return list of all parking zones with metadata"""
        zones = []
        
        for zone_key, choice_name in ParkingSlot.PARKING_ZONE_CHOICES:
            # Find matching location from PARKING_LOCATIONS
            location_data = next(
                (loc for loc in PARKING_LOCATIONS if choice_name in loc.get('name', '')),
                None
            )
            
            # Get slot counts for this zone
            total_slots = ParkingSlot.objects.filter(parking_zone=zone_key).count()
            available_slots = ParkingSlot.objects.filter(
                parking_zone=zone_key,
                is_occupied=False
            ).count()
            occupied_slots = total_slots - available_slots
            
            zone_info = {
                'code': zone_key,
                'name': choice_name,
                'total_slots': total_slots,
                'available_slots': available_slots,
                'occupied_slots': occupied_slots,
                'occupancy_rate': round((occupied_slots / total_slots * 100), 2) if total_slots > 0 else 0,
            }
            
            # Add location data if available
            if location_data:
                zone_info.update({
                    'latitude': location_data.get('lat'),
                    'longitude': location_data.get('lon'),
                    'radius_meters': location_data.get('radius_meters'),
                })
            
            zones.append(zone_info)
        
        return Response({
            'success': True,
            'count': len(zones),
            'zones': zones
        }, status=status.HTTP_200_OK)


class SlotsByZoneView(APIView):
    """
    GET: Get all parking slots for a specific zone
    Supports filtering by vehicle type and availability
    """
    permission_classes = []  # Public for viewing
    
    def get(self, request, zone_code):
        """
        Get slots filtered by zone
        Query params:
        - vehicle_type: Filter by vehicle type (car, suv, bike, truck)
        - available_only: Show only available slots (true/false)
        - floor: Filter by floor
        - section: Filter by section
        """
        # Validate zone code
        valid_zones = [code for code, _ in ParkingSlot.PARKING_ZONE_CHOICES]
        if zone_code not in valid_zones:
            return Response({
                'success': False,
                'error': f'Invalid zone code. Valid zones: {", ".join(valid_zones)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Base query
        slots = ParkingSlot.objects.filter(parking_zone=zone_code)
        
        # Apply filters
        vehicle_type = request.query_params.get('vehicle_type')
        if vehicle_type:
            slots = slots.filter(Q(vehicle_type=vehicle_type) | Q(vehicle_type='any'))
        
        available_only = request.query_params.get('available_only', '').lower() == 'true'
        if available_only:
            slots = slots.filter(is_occupied=False)
        
        floor = request.query_params.get('floor')
        if floor:
            slots = slots.filter(floor=floor)
        
        section = request.query_params.get('section')
        if section:
            slots = slots.filter(section=section)
        
        # Serialize and return
        serializer = ParkingSlotSerializer(slots, many=True)
        
        # Get zone name
        zone_name = dict(ParkingSlot.PARKING_ZONE_CHOICES).get(zone_code, zone_code)
        
        return Response({
            'success': True,
            'zone_code': zone_code,
            'zone_name': zone_name,
            'total_slots': slots.count(),
            'available_slots': slots.filter(is_occupied=False).count(),
            'slots': serializer.data
        }, status=status.HTTP_200_OK)


class ZoneStatisticsView(APIView):
    """
    GET: Get detailed statistics for a specific zone
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, zone_code):
        """Get comprehensive statistics for a zone"""
        # Validate zone
        valid_zones = [code for code, _ in ParkingSlot.PARKING_ZONE_CHOICES]
        if zone_code not in valid_zones:
            return Response({
                'success': False,
                'error': 'Invalid zone code'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get all slots for this zone
        slots = ParkingSlot.objects.filter(parking_zone=zone_code)
        
        # Calculate statistics
        total_slots = slots.count()
        available_slots = slots.filter(is_occupied=False).count()
        occupied_slots = total_slots - available_slots
        
        # Vehicle type breakdown
        vehicle_breakdown = {}
        for vehicle_type, _ in ParkingSlot.VEHICLE_TYPE_CHOICES:
            type_slots = slots.filter(vehicle_type=vehicle_type)
            vehicle_breakdown[vehicle_type] = {
                'total': type_slots.count(),
                'available': type_slots.filter(is_occupied=False).count(),
                'occupied': type_slots.filter(is_occupied=True).count()
            }
        
        # Floor breakdown
        floors = slots.values('floor').distinct()
        floor_breakdown = {}
        for floor_data in floors:
            floor = floor_data['floor']
            floor_slots = slots.filter(floor=floor)
            floor_breakdown[floor] = {
                'total': floor_slots.count(),
                'available': floor_slots.filter(is_occupied=False).count(),
                'occupied': floor_slots.filter(is_occupied=True).count()
            }
        
        # Section breakdown
        sections = slots.values('section').distinct()
        section_breakdown = {}
        for section_data in sections:
            section = section_data['section']
            section_slots = slots.filter(section=section)
            section_breakdown[section] = {
                'total': section_slots.count(),
                'available': section_slots.filter(is_occupied=False).count(),
                'occupied': section_slots.filter(is_occupied=True).count()
            }
        
        # Active bookings for this zone
        active_bookings = Booking.objects.filter(
            slot__parking_zone=zone_code,
            status__in=['confirmed', 'checked_in']
        ).count()
        
        zone_name = dict(ParkingSlot.PARKING_ZONE_CHOICES).get(zone_code, zone_code)
        
        return Response({
            'success': True,
            'zone_code': zone_code,
            'zone_name': zone_name,
            'overview': {
                'total_slots': total_slots,
                'available_slots': available_slots,
                'occupied_slots': occupied_slots,
                'occupancy_rate': round((occupied_slots / total_slots * 100), 2) if total_slots > 0 else 0,
                'active_bookings': active_bookings
            },
            'by_vehicle_type': vehicle_breakdown,
            'by_floor': floor_breakdown,
            'by_section': section_breakdown
        }, status=status.HTTP_200_OK)


class AdminZoneManagementView(APIView):
    """
    Admin-only view for managing slots by zone
    GET: List slots with filters
    POST: Create new slot in specific zone
    """
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """Only admin and security can access"""
        return [IsAuthenticated()]
    
    def check_admin_permission(self, user):
        """Check if user is admin or security"""
        if user.role not in ['admin', 'security']:
            return False
        return True
    
    def get(self, request, zone_code):
        """Get all slots for admin management"""
        if not self.check_admin_permission(request.user):
            return Response({
                'success': False,
                'error': 'Admin or security access required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Validate zone
        valid_zones = [code for code, _ in ParkingSlot.PARKING_ZONE_CHOICES]
        if zone_code not in valid_zones:
            return Response({
                'success': False,
                'error': 'Invalid zone code'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        slots = ParkingSlot.objects.filter(parking_zone=zone_code).order_by('floor', 'section', 'slot_number')
        serializer = ParkingSlotSerializer(slots, many=True)
        
        return Response({
            'success': True,
            'zone_code': zone_code,
            'zone_name': dict(ParkingSlot.PARKING_ZONE_CHOICES).get(zone_code),
            'total_slots': slots.count(),
            'slots': serializer.data
        }, status=status.HTTP_200_OK)
    
    def post(self, request, zone_code):
        """Create a new slot in the specified zone"""
        if not self.check_admin_permission(request.user):
            return Response({
                'success': False,
                'error': 'Admin or security access required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Validate zone
        valid_zones = [code for code, _ in ParkingSlot.PARKING_ZONE_CHOICES]
        if zone_code not in valid_zones:
            return Response({
                'success': False,
                'error': 'Invalid zone code'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Add zone to request data
        data = request.data.copy()
        data['parking_zone'] = zone_code
        
        serializer = ParkingSlotSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': f'Slot created successfully in {dict(ParkingSlot.PARKING_ZONE_CHOICES).get(zone_code)}',
                'slot': serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class ZoneDashboardView(APIView):
    """
    GET: Dashboard view showing all zones with summary statistics
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get dashboard data for all zones"""
        if request.user.role not in ['admin', 'security']:
            return Response({
                'success': False,
                'error': 'Admin or security access required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        zones_data = []
        overall_total = 0
        overall_available = 0
        overall_occupied = 0
        
        for zone_code, zone_name in ParkingSlot.PARKING_ZONE_CHOICES:
            slots = ParkingSlot.objects.filter(parking_zone=zone_code)
            total = slots.count()
            available = slots.filter(is_occupied=False).count()
            occupied = total - available
            
            overall_total += total
            overall_available += available
            overall_occupied += occupied
            
            # Get vehicle type distribution
            vehicle_distribution = {}
            for vtype, vname in ParkingSlot.VEHICLE_TYPE_CHOICES:
                count = slots.filter(vehicle_type=vtype).count()
                if count > 0:
                    vehicle_distribution[vtype] = count
            
            zones_data.append({
                'zone_code': zone_code,
                'zone_name': zone_name,
                'total_slots': total,
                'available_slots': available,
                'occupied_slots': occupied,
                'occupancy_rate': round((occupied / total * 100), 2) if total > 0 else 0,
                'vehicle_distribution': vehicle_distribution
            })
        
        return Response({
            'success': True,
            'overall_summary': {
                'total_zones': len(ParkingSlot.PARKING_ZONE_CHOICES),
                'total_slots': overall_total,
                'available_slots': overall_available,
                'occupied_slots': overall_occupied,
                'overall_occupancy_rate': round((overall_occupied / overall_total * 100), 2) if overall_total > 0 else 0
            },
            'zones': zones_data
        }, status=status.HTTP_200_OK)
