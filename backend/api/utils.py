from django.utils import timezone
from datetime import timedelta
from .models import Booking
from math import radians, sin, cos, sqrt, atan2

# ============================================
# PARKING LOCATION CONFIGURATION
# ============================================
COLLEGE_PARKING_CENTER = {
    "lat": 19.2479,
    "lon": 73.1471,
    "radius_meters": 500,  # Adjust based on your campus size (500m = ~0.31 miles)
    "name": "College Parking"
}

HOME_PARKING_CENTER = {
    "lat": 19.2056,
    "lon": 73.1556,
    "radius_meters": 50,  # 50 meters radius for home parking
    "name": "Home Parking"
}

# List of all valid parking locations
PARKING_LOCATIONS = [
    COLLEGE_PARKING_CENTER,
    HOME_PARKING_CENTER
]


# ============================================
# GEOLOCATION UTILITIES
# ============================================
def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the distance between two GPS coordinates using the Haversine formula.
    
    Args:
        lat1: Latitude of first point
        lon1: Longitude of first point
        lat2: Latitude of second point
        lon2: Longitude of second point
    
    Returns:
        Distance in meters between the two points
    """
    # Earth's radius in meters
    R = 6371000
    
    # Convert degrees to radians
    φ1 = radians(lat1)
    φ2 = radians(lat2)
    Δφ = radians(lat2 - lat1)
    Δλ = radians(lon2 - lon1)
    
    # Haversine formula
    a = sin(Δφ/2) * sin(Δφ/2) + cos(φ1) * cos(φ2) * sin(Δλ/2) * sin(Δλ/2)
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    # Distance in meters
    distance = R * c
    
    return distance


def is_within_parking_area(user_lat, user_lon, parking_center=None):
    """
    Check if the user's location is within the allowed parking area radius.
    Supports multiple parking locations.
    
    Args:
        user_lat: User's latitude
        user_lon: User's longitude
        parking_center: Optional dict with 'lat', 'lon', and 'radius_meters'.
                       If None, checks all PARKING_LOCATIONS and returns True
                       if user is within ANY of them.
    
    Returns:
        tuple: (is_within_area: bool, distance: float, allowed_radius: float, location_name: str)
               - is_within_area: True if user is within parking area
               - distance: Distance in meters from parking center (closest if multiple)
               - allowed_radius: The radius used for validation
               - location_name: Name of the parking location (or "any parking area" if checking all)
    """
    # If specific parking center provided, check only that one
    if parking_center is not None:
        distance = calculate_distance(
            user_lat, user_lon,
            parking_center["lat"],
            parking_center["lon"]
        )
        is_within = distance <= parking_center["radius_meters"]
        location_name = parking_center.get("name", "parking area")
        return is_within, distance, parking_center["radius_meters"], location_name
    
    # Check all parking locations and return True if within ANY of them
    closest_distance = float('inf')
    closest_location = None
    is_within_any = False
    
    for location in PARKING_LOCATIONS:
        distance = calculate_distance(
            user_lat, user_lon,
            location["lat"],
            location["lon"]
        )
        
        # Track the closest location
        if distance < closest_distance:
            closest_distance = distance
            closest_location = location
        
        # Check if within this location's radius
        if distance <= location["radius_meters"]:
            is_within_any = True
            # Return immediately with this location's details
            return True, distance, location["radius_meters"], location.get("name", "parking area")
    
    # Not within any location - return details of closest one
    if closest_location:
        location_name = closest_location.get("name", "parking area")
        return False, closest_distance, closest_location["radius_meters"], location_name
    
    # Fallback (should never happen if PARKING_LOCATIONS is not empty)
    return False, closest_distance, 500, "any parking area"


def validate_location_data(latitude, longitude):
    """
    Validate that latitude and longitude values are valid.
    
    Args:
        latitude: Latitude value to validate
        longitude: Longitude value to validate
    
    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    try:
        lat = float(latitude)
        lon = float(longitude)
        
        # Check valid ranges
        if not (-90 <= lat <= 90):
            return False, "Latitude must be between -90 and 90 degrees"
        
        if not (-180 <= lon <= 180):
            return False, "Longitude must be between -180 and 180 degrees"
        
        return True, None
    except (TypeError, ValueError):
        return False, "Invalid latitude or longitude format"


def find_alternative_slots(slot, requested_start, requested_end, max_alternatives=3, buffer_hours=1):
    """
    Find alternative available time slots when a booking conflict occurs.
    
    Args:
        slot: The ParkingSlot object that has a conflict
        requested_start: The originally requested start time
        requested_end: The originally requested end time
        max_alternatives: Maximum number of alternative slots to suggest
        buffer_hours: Hours to check before and after the requested time
    
    Returns:
        A list of dictionaries with alternative start and end times
    """
    # Calculate the duration of the requested booking
    duration = requested_end - requested_start
    
    # Get all bookings for this slot around the requested time (with buffer)
    buffer_start = requested_start - timedelta(hours=buffer_hours)
    buffer_end = requested_end + timedelta(hours=buffer_hours)
    
    bookings = Booking.objects.filter(
        slot=slot,
        start_time__lt=buffer_end,
        end_time__gt=buffer_start,
        is_active=True
    ).order_by('start_time')
    
    # If no bookings found, there was an error in the conflict detection
    if not bookings:
        return []
    
    alternatives = []
    
    # Check for a slot before the conflicting booking
    first_booking = bookings.first()
    if first_booking.start_time > buffer_start:
        # There's space before the first booking
        alt_start = max(buffer_start, timezone.now())
        alt_end = min(first_booking.start_time, alt_start + duration)
        
        # Only add if the alternative provides enough time
        if alt_end - alt_start >= duration * 0.8:  # At least 80% of requested duration
            alternatives.append({
                'start_time': alt_start,
                'end_time': alt_end
            })
    
    # Check for slots between bookings
    prev_booking_end = None
    for booking in bookings:
        if prev_booking_end:
            gap_duration = booking.start_time - prev_booking_end
            # If there's enough gap between bookings
            if gap_duration >= duration * 0.8:
                alternatives.append({
                    'start_time': prev_booking_end,
                    'end_time': prev_booking_end + duration
                })
        prev_booking_end = booking.end_time
    
    # Check for a slot after the last booking
    last_booking = bookings.last()
    if last_booking.end_time < buffer_end:
        alternatives.append({
            'start_time': last_booking.end_time,
            'end_time': last_booking.end_time + duration
        })
    
    # If we still need more alternatives, try extending the search range
    if len(alternatives) < max_alternatives:
        # Look for the next day
        next_day_start = timezone.make_aware(timezone.datetime.combine(
            requested_start.date() + timedelta(days=1),
            requested_start.time()
        ))
        next_day_end = next_day_start + duration
        
        next_day_bookings = Booking.objects.filter(
            slot=slot,
            start_time__lt=next_day_end,
            end_time__gt=next_day_start,
            is_active=True
        )
        
        if not next_day_bookings.exists():
            alternatives.append({
                'start_time': next_day_start,
                'end_time': next_day_end,
                'message': 'Next day availability'
            })
    
    # Limit to max alternatives and format datetime objects for easy display
    return alternatives[:max_alternatives]