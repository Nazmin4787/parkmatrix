from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.db.models import F, ExpressionWrapper, FloatField
from django.db.models.functions import Cos, Sin, Radians, ACos
import math

# Make sure geopy is installed
try:
    from geopy.distance import geodesic
except ImportError:
    # Fallback simple distance calculation if geopy is not available
    def geodesic(point1, point2):
        class Distance:
            def __init__(self, km):
                self.kilometers = km
        
        # Simple Haversine formula for distance calculation
        lat1, lon1 = point1
        lat2, lon2 = point2
        R = 6371  # Radius of the Earth in km
        
        dLat = math.radians(lat2 - lat1)
        dLon = math.radians(lon2 - lon1)
        
        a = (math.sin(dLat/2) * math.sin(dLat/2) +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dLon/2) * math.sin(dLon/2))
        
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance = R * c
        
        return Distance(distance)

from .models import ParkingLot
from .serializers import ParkingLotSerializer

class NearestParkingLotsView(generics.ListAPIView):
    serializer_class = ParkingLotSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        lat = self.request.query_params.get('lat')
        lon = self.request.query_params.get('lon')
        radius = float(self.request.query_params.get('radius', 5))  # Default 5km radius
        limit = int(self.request.query_params.get('limit', 10))     # Default limit to 10 results
        
        if not lat or not lon:
            return ParkingLot.objects.none()
            
        try:
            lat_float = float(lat)
            lon_float = float(lon)
        except (ValueError, TypeError):
            return ParkingLot.objects.none()
            
        # Calculate distance using geopy's geodesic
        user_location = (lat_float, lon_float)
        
        # Get all parking lots
        parking_lots = ParkingLot.objects.all()
        
        # Calculate distances and filter by radius
        lots_with_distances = []
        for lot in parking_lots:
            lot_location = (lot.latitude, lot.longitude)
            distance = geodesic(user_location, lot_location).kilometers
            
            if distance <= radius:
                # Add distance to the lot object
                lot.distance_km = distance
                lots_with_distances.append(lot)
        
        # Sort by distance and limit results
        sorted_lots = sorted(lots_with_distances, key=lambda x: x.distance_km)[:limit]
        
        return sorted_lots
        
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        # Add distance to each parking lot in the response
        lat = float(request.query_params.get('lat'))
        lon = float(request.query_params.get('lon'))
        user_location = (lat, lon)
        
        response_data = []
        for lot_data in serializer.data:
            lot_location = (float(lot_data['latitude']), float(lot_data['longitude']))
            distance = geodesic(user_location, lot_location).kilometers
            lot_data['distance'] = f"{distance:.2f} km"
            lot_data['distance_value'] = distance  # Add numeric value for sorting
            response_data.append(lot_data)
        
        return Response(response_data)

@api_view(['GET'])
@permission_classes([AllowAny])
def search_parking_by_address(request):
    """
    Search for parking lots by address
    """
    address = request.query_params.get('address', '')
    
    if not address:
        return Response(
            {"error": "Address parameter is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
        
    # Simple partial address matching
    # In a production environment, this should be replaced with a more advanced
    # geo-search solution like geopy's geocoding or Google's Geocoding API
    parking_lots = ParkingLot.objects.filter(address__icontains=address)
    
    if not parking_lots.exists():
        return Response(
            {"message": "No parking lots found matching this address"}, 
            status=status.HTTP_404_NOT_FOUND
        )
        
    serializer = ParkingLotSerializer(parking_lots, many=True)
    return Response(serializer.data)