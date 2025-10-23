"""
Test script for Parking Zone Management API endpoints
Run this after starting the Django server
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

# Headers to request JSON response
HEADERS = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
}

def test_parking_zones():
    """Test the parking zones list endpoint"""
    print("\n=== Testing Parking Zones List ===")
    response = requests.get(f"{BASE_URL}/parking-zones/", headers=HEADERS)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        try:
            data = response.json()
            print(f"Number of zones: {data.get('count')}")
            for zone in data.get('zones', []):
                print(f"\n  Zone: {zone['name']} ({zone['code']})")
                print(f"  Total Slots: {zone['total_slots']}")
                print(f"  Available: {zone['available_slots']}")
                print(f"  Occupied: {zone['occupied_slots']}")
                print(f"  Occupancy Rate: {zone['occupancy_rate']}%")
        except json.JSONDecodeError as e:
            print(f"JSON Decode Error: {e}")
    else:
        print(f"Error: {response.text}")

def test_slots_by_zone(zone_code="COLLEGE_PARKING_CENTER"):
    """Test getting slots for a specific zone"""
    print(f"\n=== Testing Slots for {zone_code} ===")
    response = requests.get(f"{BASE_URL}/parking-zones/{zone_code}/slots/", headers=HEADERS)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Zone: {data.get('zone_name')}")
        print(f"Total Slots: {data.get('total_slots')}")
        print(f"Available Slots: {data.get('available_slots')}")
        print(f"First 3 slots:")
        for slot in data.get('slots', [])[:3]:
            print(f"  - Slot {slot['slot_number']}: {slot['vehicle_type']}, Floor {slot['floor']}, Occupied: {slot['is_occupied']}")
    else:
        print(f"Error: {response.text}")

def test_available_slots_with_zone_filter(zone_code="HOME_PARKING_CENTER", token=None):
    """Test filtering available slots by zone"""
    print(f"\n=== Testing Available Slots filtered by {zone_code} ===")
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
    response = requests.get(
        f"{BASE_URL}/slots/available/",
        params={'parking_zone': zone_code},
        headers=headers
    )
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Available slots in {zone_code}: {len(data) if isinstance(data, list) else 'N/A'}")
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    print("=" * 60)
    print("PARKING ZONE MANAGEMENT API TESTS")
    print("=" * 60)
    
    try:
        # Test public endpoints
        test_parking_zones()
        test_slots_by_zone("COLLEGE_PARKING_CENTER")
        test_slots_by_zone("HOME_PARKING_CENTER")
        test_slots_by_zone("METRO_PARKING_CENTER")
        test_slots_by_zone("VIVIVANA_PARKING_CENTER")
        
        print("\n" + "=" * 60)
        print("PUBLIC ENDPOINTS TEST COMPLETED")
        print("=" * 60)
        
        # Note: For authenticated endpoints, you need to login first
        print("\nNote: To test authenticated endpoints (zone statistics, admin dashboard),")
        print("you need to login first and pass the access token.")
        
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Could not connect to server.")
        print("Make sure Django server is running: python manage.py runserver 8000")
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
