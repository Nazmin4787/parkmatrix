"""
Test script to verify the vehicle-slot compatibility and capacity management features
"""
import requests
import json
from datetime import datetime, timedelta

# Base URL for the API
BASE_URL = "http://127.0.0.1:8000/api"

def test_vehicle_types():
    """Test vehicle types endpoint"""
    print("\n=== Testing Vehicle Types ===")
    response = requests.get(f"{BASE_URL}/vehicle-types/")
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Found {len(data)} vehicle types:")
        for vt in data:
            print(f"  - {vt['name']}: {vt['width_cm']}x{vt['length_cm']}x{vt['height_cm']}cm")
    else:
        print(f"✗ Error: {response.status_code}")

def test_compatible_slots():
    """Test compatible slots endpoint"""
    print("\n=== Testing Compatible Slots ===")
    
    # Test for Car (ID: 1)
    response = requests.get(f"{BASE_URL}/vehicle-types/1/compatible-slots/")
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Car compatible slots: {data['compatible_slots_count']}")
    else:
        print(f"✗ Error getting car compatible slots: {response.status_code}")
    
    # Test for Truck (ID: 4)
    response = requests.get(f"{BASE_URL}/vehicle-types/4/compatible-slots/")
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Truck compatible slots: {data['compatible_slots_count']}")
    else:
        print(f"✗ Error getting truck compatible slots: {response.status_code}")

def test_slot_suggestion():
    """Test slot suggestion endpoint"""
    print("\n=== Testing Slot Suggestion ===")
    
    # Get parking lot ID first
    parking_lots_response = requests.get(f"{BASE_URL}/parking-lots/")
    if parking_lots_response.status_code != 200:
        print("✗ Could not fetch parking lots")
        return
    
    parking_lot_id = parking_lots_response.json()[0]['id']
    
    # Test slot suggestion for car
    payload = {
        "vehicle_type_id": 1,  # Car
        "parking_lot_id": parking_lot_id,
        "preferences": {
            "floor": "1"
        }
    }
    
    response = requests.post(f"{BASE_URL}/slot-suggestion/", json=payload)
    if response.status_code == 200:
        data = response.json()
        if data['suggested_slot']:
            print(f"✓ Suggested slot for Car: {data['suggested_slot']['slot_number']}")
        else:
            print("✓ No available slots found for Car")
    else:
        print(f"✗ Error getting slot suggestion: {response.status_code}")

def test_real_time_capacity():
    """Test real-time capacity endpoint"""
    print("\n=== Testing Real-Time Capacity ===")
    
    response = requests.get(f"{BASE_URL}/real-time-capacity/")
    if response.status_code == 200:
        data = response.json()
        print("✓ Real-time capacity data:")
        for lot_name, lot_data in data['capacity_data'].items():
            print(f"  {lot_name}:")
            for vehicle_type, capacity_info in lot_data['vehicle_types'].items():
                print(f"    {vehicle_type}: {capacity_info['available_slots']}/{capacity_info['total_slots']} available ({capacity_info['occupancy_rate']}% occupied)")
    else:
        print(f"✗ Error getting real-time capacity: {response.status_code}")

def test_availability_check():
    """Test availability check endpoint"""
    print("\n=== Testing Availability Check ===")
    
    # Get parking lot ID first
    parking_lots_response = requests.get(f"{BASE_URL}/parking-lots/")
    if parking_lots_response.status_code != 200:
        print("✗ Could not fetch parking lots")
        return
    
    parking_lot_id = parking_lots_response.json()[0]['id']
    
    # Check availability for next hour
    start_time = datetime.now()
    end_time = start_time + timedelta(hours=1)
    
    payload = {
        "vehicle_type_id": 1,  # Car
        "parking_lot_id": parking_lot_id,
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat()
    }
    
    response = requests.post(f"{BASE_URL}/availability-check/", json=payload)
    if response.status_code == 200:
        data = response.json()
        availability = data['availability']
        print(f"✓ Availability check for Car:")
        print(f"  Total compatible slots: {availability['total_compatible_slots']}")
        print(f"  Available slots: {availability['available_slots_count']}")
        print(f"  Available: {'Yes' if availability['is_available'] else 'No'}")
    else:
        print(f"✗ Error checking availability: {response.status_code}")

if __name__ == "__main__":
    print("Testing Vehicle-Slot Compatibility and Capacity Management Features")
    print("=" * 70)
    
    try:
        test_vehicle_types()
        test_compatible_slots()
        test_slot_suggestion()
        test_real_time_capacity()
        test_availability_check()
        
        print("\n" + "=" * 70)
        print("✓ All tests completed!")
        
    except requests.exceptions.ConnectionError:
        print("✗ Error: Could not connect to the server. Make sure Django is running on http://127.0.0.1:8000")
    except Exception as e:
        print(f"✗ Unexpected error: {e}")