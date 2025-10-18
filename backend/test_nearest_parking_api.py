"""
Test script for Nearest Parking Location API
Tests the new GET /api/parking/nearest/ endpoint
"""

import requests
import json

# API endpoint
BASE_URL = "http://127.0.0.1:8000"
NEAREST_PARKING_URL = f"{BASE_URL}/api/parking/nearest/"

print("=" * 70)
print("TESTING NEAREST PARKING LOCATION API")
print("=" * 70)
print()

# Test 1: Valid request from College location
print("🧪 TEST 1: Request from College Parking location")
print("-" * 70)
params = {
    "latitude": 19.2479,
    "longitude": 73.1471,
    "max_results": 5
}
print(f"Request: GET {NEAREST_PARKING_URL}")
print(f"Params: {json.dumps(params, indent=2)}")
print()

try:
    response = requests.get(NEAREST_PARKING_URL, params=params)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Success!")
        print(f"\nUser Location: {data['user_location']}")
        print(f"Total Locations Found: {data['total_locations']}")
        print()
        
        for i, location in enumerate(data['locations'], 1):
            print(f"📍 {i}. {location['name']}")
            print(f"   Distance: {location['distance_km']} km ({location['distance_meters']} m)")
            print(f"   Available Slots: {location['available_slots']} / {location['total_slots']}")
            print(f"   Status: {location['availability_status']} ({location['availability_color']})")
            print(f"   Walking Time: ~{location['walking_time_minutes']} min")
            print(f"   Driving Time: ~{location['driving_time_minutes']} min")
            print()
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"❌ Request failed: {str(e)}")

print()

# Test 2: Request from Home location
print("🧪 TEST 2: Request from Home Parking location")
print("-" * 70)
params = {
    "latitude": 19.2056,
    "longitude": 73.1556,
}
print(f"Request: GET {NEAREST_PARKING_URL}")
print(f"Params: {json.dumps(params, indent=2)}")
print()

try:
    response = requests.get(NEAREST_PARKING_URL, params=params)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Success!")
        print(f"\nNearest location: {data['locations'][0]['name']}")
        print(f"Distance: {data['locations'][0]['distance_km']} km")
        print()
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"❌ Request failed: {str(e)}")

print()

# Test 3: Request from Metro location
print("🧪 TEST 3: Request from Metro Parking location")
print("-" * 70)
params = {
    "latitude": 19.2291,
    "longitude": 73.1233,
}
print(f"Request: GET {NEAREST_PARKING_URL}")
print(f"Params: {json.dumps(params, indent=2)}")
print()

try:
    response = requests.get(NEAREST_PARKING_URL, params=params)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Success!")
        print(f"\nNearest location: {data['locations'][0]['name']}")
        print(f"Distance: {data['locations'][0]['distance_km']} km")
        print()
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"❌ Request failed: {str(e)}")

print()

# Test 4: Missing parameters (error handling)
print("🧪 TEST 4: Missing latitude parameter (should fail)")
print("-" * 70)
params = {
    "longitude": 73.1471,
}
print(f"Request: GET {NEAREST_PARKING_URL}")
print(f"Params: {json.dumps(params, indent=2)}")
print()

try:
    response = requests.get(NEAREST_PARKING_URL, params=params)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 400:
        data = response.json()
        print(f"✅ Error handling works!")
        print(f"Error: {data.get('error')}")
        print(f"Message: {data.get('message')}")
    else:
        print(f"❌ Expected 400, got {response.status_code}")
except Exception as e:
    print(f"❌ Request failed: {str(e)}")

print()

# Test 5: Invalid coordinates (error handling)
print("🧪 TEST 5: Invalid latitude (should fail)")
print("-" * 70)
params = {
    "latitude": 999,  # Invalid
    "longitude": 73.1471,
}
print(f"Request: GET {NEAREST_PARKING_URL}")
print(f"Params: {json.dumps(params, indent=2)}")
print()

try:
    response = requests.get(NEAREST_PARKING_URL, params=params)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 400:
        data = response.json()
        print(f"✅ Validation works!")
        print(f"Error: {data.get('error')}")
        print(f"Message: {data.get('message')}")
    else:
        print(f"❌ Expected 400, got {response.status_code}")
except Exception as e:
    print(f"❌ Request failed: {str(e)}")

print()
print("=" * 70)
print("✅ ALL TESTS COMPLETED")
print("=" * 70)
