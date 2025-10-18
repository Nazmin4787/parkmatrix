"""
Test script for geo-fencing functionality
Run this to test the location validation logic (standalone version)
"""

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
    "radius_meters": 500,  # 500 meters radius for home parking
    "name": "Home Parking"
}

METRO_PARKING_CENTER = {
    "lat": 19.2291,
    "lon": 73.1233,
    "radius_meters": 500,  # 500 meters radius for metro parking
    "name": "Metro Parking"
}

VIVIVANA_PARKING_CENTER = {
    "lat": 19.2088,
    "lon": 72.9716,
    "radius_meters": 500,  # 500 meters radius for Vivivana parking
    "name": "Vivivana Parking"
}

# List of all valid parking locations
PARKING_LOCATIONS = [
    COLLEGE_PARKING_CENTER,
    HOME_PARKING_CENTER,
    METRO_PARKING_CENTER,
    VIVIVANA_PARKING_CENTER
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
               - location_name: Name of the parking location
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
            # Return immediately with this location's details
            return True, distance, location["radius_meters"], location.get("name", "parking area")
    
    # Not within any location - return details of closest one
    if closest_location:
        location_name = closest_location.get("name", "parking area")
        return False, closest_distance, closest_location["radius_meters"], location_name
    
    # Fallback
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

def test_geofencing():
    print("=" * 60)
    print("TESTING GEO-FENCING FUNCTIONALITY (MULTI-LOCATION)")
    print("=" * 60)
    print()
    
    # Test 0: Show all parking locations
    print("📍 AVAILABLE PARKING LOCATIONS:")
    for i, location in enumerate(PARKING_LOCATIONS, 1):
        print(f"   {i}. {location['name']}:")
        print(f"      Latitude: {location['lat']}")
        print(f"      Longitude: {location['lon']}")
        print(f"      Allowed Radius: {location['radius_meters']}m")
    print()
    
    # Test 1: College parking center coordinates
    print("✅ TEST 1: User at exact College Parking location")
    is_within, distance, radius, location_name = is_within_parking_area(
        COLLEGE_PARKING_CENTER['lat'],
        COLLEGE_PARKING_CENTER['lon']
    )
    print(f"   Distance: {distance:.2f}m")
    print(f"   Location: {location_name}")
    print(f"   Within area: {is_within}")
    print(f"   Status: {'✅ PASS' if is_within else '❌ FAIL'}")
    print()
    
    # Test 2: Home parking center coordinates
    print("✅ TEST 2: User at exact Home Parking location")
    is_within, distance, radius, location_name = is_within_parking_area(
        HOME_PARKING_CENTER['lat'],
        HOME_PARKING_CENTER['lon']
    )
    print(f"   Distance: {distance:.2f}m")
    print(f"   Location: {location_name}")
    print(f"   Within area: {is_within}")
    print(f"   Status: {'✅ PASS' if is_within else '❌ FAIL'}")
    print()
    
    # Test 3: Test location 200m away from college (should pass)
    print("✅ TEST 3: User 200m away from College Parking (should pass)")
    test_lat = 19.2497  # ~200m north
    test_lon = 73.1471
    is_within, distance, radius, location_name = is_within_parking_area(test_lat, test_lon)
    is_within, distance, radius, location_name = is_within_parking_area(test_lat, test_lon)
    print(f"   Test Location: {test_lat}, {test_lon}")
    print(f"   Distance: {distance:.2f}m")
    print(f"   Location: {location_name}")
    print(f"   Within area: {is_within}")
    print(f"   Status: {'✅ PASS' if is_within else '❌ FAIL'}")
    print()
    
    # Test 4: Test location 600m away (should fail)
    print("❌ TEST 4: User 600m away from all locations (should fail)")
    test_lat = 19.2533  # ~600m north of college
    test_lon = 73.1471
    is_within, distance, radius, location_name = is_within_parking_area(test_lat, test_lon)
    print(f"   Test Location: {test_lat}, {test_lon}")
    print(f"   Distance: {distance:.2f}m")
    print(f"   Nearest Location: {location_name}")
    print(f"   Within area: {is_within}")
    print(f"   Status: {'✅ PASS (correctly rejected)' if not is_within else '❌ FAIL (should reject)'}")
    print()
    
    # Test 5: Test location 1km away (should fail)
    print("❌ TEST 5: User ~1km away from all locations (should fail)")
    test_lat = 19.2389  # ~1km south of college
    test_lon = 73.1471
    is_within, distance, radius, location_name = is_within_parking_area(test_lat, test_lon)
    print(f"   Test Location: {test_lat}, {test_lon}")
    print(f"   Distance: {distance:.2f}m")
    print(f"   Nearest Location: {location_name}")
    print(f"   Within area: {is_within}")
    print(f"   Status: {'✅ PASS (correctly rejected)' if not is_within else '❌ FAIL (should reject)'}")
    print()
    
    # Test 6: Validate location data
    print("✅ TEST 6: Location data validation")
    is_valid, error = validate_location_data(19.2479, 73.1471)
    print(f"   Valid coordinates: {is_valid}")
    print(f"   Error: {error}")
    print(f"   Status: {'✅ PASS' if is_valid else '❌ FAIL'}")
    print()
    
    # Test 7: Invalid location data
    print("❌ TEST 7: Invalid location data (should fail)")
    is_valid, error = validate_location_data(999, 999)
    print(f"   Valid coordinates: {is_valid}")
    print(f"   Error: {error}")
    print(f"   Status: {'✅ PASS (correctly rejected)' if not is_valid else '❌ FAIL (should reject)'}")
    print()
    
    # Test 8: Distance calculation
    print("📏 TEST 8: Distance calculation accuracy")
    dist = calculate_distance(19.2479, 73.1471, 19.2489, 73.1471)
    print(f"   Distance between two points: {dist:.2f}m")
    print(f"   Expected: ~111m (1 degree latitude ≈ 111km)")
    print()
    
    # Test 9: Distance between two parking locations
    print("📏 TEST 9: Distance between parking locations")
    dist = calculate_distance(
        COLLEGE_PARKING_CENTER['lat'],
        COLLEGE_PARKING_CENTER['lon'],
        HOME_PARKING_CENTER['lat'],
        HOME_PARKING_CENTER['lon']
    )
    print(f"   Distance from College to Home: {dist:.2f}m ({dist/1000:.2f}km)")
    print()
    
    print("=" * 60)
    print("✅ ALL TESTS COMPLETED")
    print("=" * 60)
    print()
    print("🎯 SUMMARY:")
    print(f"   - Total Parking Locations: {len(PARKING_LOCATIONS)}")
    print(f"   - College Parking: {COLLEGE_PARKING_CENTER['lat']}, {COLLEGE_PARKING_CENTER['lon']}")
    print(f"   - Home Parking: {HOME_PARKING_CENTER['lat']}, {HOME_PARKING_CENTER['lon']}")
    print(f"   - Check-in/check-out allowed from ANY of these locations")
    print()
    print("🎯 NEXT STEPS:")
    print("   1. Start Django server: python manage.py runserver")
    print("   2. Frontend will automatically check all parking locations")
    print("   3. Test check-in/check-out from both College and Home locations")
    print()

if __name__ == "__main__":
    test_geofencing()
