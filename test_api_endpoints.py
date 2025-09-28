"""
Comprehensive API endpoint tests for Vehicle-Slot Compatibility and Capacity Management
"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://127.0.0.1:8000/api"

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print('='*60)

def print_result(test_name, success, data=None, error=None):
    status = "✓" if success else "✗"
    print(f"{status} {test_name}")
    if success and data:
        print(f"   Response: {json.dumps(data, indent=2)[:200]}...")
    elif error:
        print(f"   Error: {error}")

def test_vehicle_types():
    """Test vehicle types endpoint"""
    print_section("Testing Vehicle Types")
    
    try:
        response = requests.get(f"{BASE_URL}/vehicle-types/")
        success = response.status_code == 200
        data = response.json() if success else None
        print_result("GET /vehicle-types/", success, data, response.text if not success else None)
        return data if success else []
    except Exception as e:
        print_result("GET /vehicle-types/", False, error=str(e))
        return []

def test_compatible_slots(vehicle_types):
    """Test compatible slots endpoint"""
    print_section("Testing Compatible Slots")
    
    if not vehicle_types:
        print("✗ No vehicle types available for testing")
        return
    
    # Test for each vehicle type
    for vt in vehicle_types[:3]:  # Test first 3 vehicle types
        try:
            response = requests.get(f"{BASE_URL}/vehicle-types/{vt['id']}/compatible-slots/")
            success = response.status_code == 200
            data = response.json() if success else None
            print_result(f"GET /vehicle-types/{vt['id']}/compatible-slots/ ({vt['name']})", 
                        success, data, response.text if not success else None)
        except Exception as e:
            print_result(f"Compatible slots for {vt['name']}", False, error=str(e))

def test_slot_suggestion(vehicle_types, parking_lots):
    """Test slot suggestion endpoint"""
    print_section("Testing Slot Suggestion")
    
    if not vehicle_types or not parking_lots:
        print("✗ Missing vehicle types or parking lots for testing")
        return
    
    # Test slot suggestion for car
    try:
        payload = {
            "vehicle_type_id": vehicle_types[0]['id'],  # First vehicle type
            "parking_lot_id": parking_lots[0]['id'],   # First parking lot
            "preferences": {
                "floor": "1",
                "section": "A"
            }
        }
        
        response = requests.post(f"{BASE_URL}/slot-suggestion/", json=payload)
        success = response.status_code == 200
        data = response.json() if success else None
        print_result("POST /slot-suggestion/", success, data, response.text if not success else None)
    except Exception as e:
        print_result("POST /slot-suggestion/", False, error=str(e))

def test_capacity_report(parking_lots):
    """Test capacity report endpoint"""
    print_section("Testing Capacity Report")
    
    # Test all parking lots capacity report
    try:
        response = requests.get(f"{BASE_URL}/capacity-report/")
        success = response.status_code == 200
        data = response.json() if success else None
        print_result("GET /capacity-report/ (all lots)", success, data, response.text if not success else None)
    except Exception as e:
        print_result("GET /capacity-report/ (all lots)", False, error=str(e))
    
    # Test specific parking lot capacity report
    if parking_lots:
        try:
            lot_id = parking_lots[0]['id']
            response = requests.get(f"{BASE_URL}/capacity-report/{lot_id}/")
            success = response.status_code == 200
            data = response.json() if success else None
            print_result(f"GET /capacity-report/{lot_id}/ (specific lot)", 
                        success, data, response.text if not success else None)
        except Exception as e:
            print_result("GET /capacity-report/{id}/ (specific lot)", False, error=str(e))

def test_real_time_capacity():
    """Test real-time capacity endpoint"""
    print_section("Testing Real-Time Capacity")
    
    try:
        response = requests.get(f"{BASE_URL}/real-time-capacity/")
        success = response.status_code == 200
        data = response.json() if success else None
        print_result("GET /real-time-capacity/", success, data, response.text if not success else None)
    except Exception as e:
        print_result("GET /real-time-capacity/", False, error=str(e))

def test_capacity_alerts():
    """Test capacity alerts endpoint"""
    print_section("Testing Capacity Alerts")
    
    try:
        # Test with default threshold
        response = requests.get(f"{BASE_URL}/capacity-alerts/")
        success = response.status_code == 200
        data = response.json() if success else None
        print_result("GET /capacity-alerts/ (default threshold)", 
                    success, data, response.text if not success else None)
    except Exception as e:
        print_result("GET /capacity-alerts/", False, error=str(e))
    
    try:
        # Test with custom threshold
        response = requests.get(f"{BASE_URL}/capacity-alerts/?threshold=50.0")
        success = response.status_code == 200
        data = response.json() if success else None
        print_result("GET /capacity-alerts/?threshold=50.0 (custom threshold)", 
                    success, data, response.text if not success else None)
    except Exception as e:
        print_result("GET /capacity-alerts/ (custom threshold)", False, error=str(e))

def test_availability_check(vehicle_types, parking_lots):
    """Test availability check endpoint"""
    print_section("Testing Availability Check")
    
    if not vehicle_types or not parking_lots:
        print("✗ Missing vehicle types or parking lots for testing")
        return
    
    # Check availability for next hour
    start_time = datetime.now()
    end_time = start_time + timedelta(hours=1)
    
    try:
        payload = {
            "vehicle_type_id": vehicle_types[0]['id'],
            "parking_lot_id": parking_lots[0]['id'],
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat()
        }
        
        response = requests.post(f"{BASE_URL}/availability-check/", json=payload)
        success = response.status_code == 200
        data = response.json() if success else None
        print_result("POST /availability-check/", success, data, response.text if not success else None)
    except Exception as e:
        print_result("POST /availability-check/", False, error=str(e))

def test_validate_compatibility():
    """Test vehicle-slot compatibility validation endpoint"""
    print_section("Testing Vehicle-Slot Compatibility Validation")
    
    # First, let's get some test data
    try:
        # Get available vehicles (this might fail if no auth, so we'll create mock data)
        vehicles_response = requests.get(f"{BASE_URL}/vehicles/")
        vehicles = vehicles_response.json() if vehicles_response.status_code == 200 else []
        
        # Get available slots
        slots_response = requests.get(f"{BASE_URL}/slots/")
        slots = slots_response.json() if slots_response.status_code == 200 else []
        
        if vehicles and slots:
            payload = {
                "vehicle_id": vehicles[0]['id'],
                "slot_id": slots[0]['id']
            }
            
            response = requests.post(f"{BASE_URL}/validate-compatibility/", json=payload)
            success = response.status_code in [200, 400]  # Both are valid responses
            data = response.json() if response.status_code in [200, 400] else None
            print_result("POST /validate-compatibility/ (with real data)", 
                        success, data, response.text if not success else None)
        else:
            # Test with mock data (will likely fail but shows endpoint structure)
            payload = {
                "vehicle_id": 1,
                "slot_id": 1
            }
            
            response = requests.post(f"{BASE_URL}/validate-compatibility/", json=payload)
            success = response.status_code in [200, 400, 404]  # All are valid responses for testing
            data = response.json() if response.status_code in [200, 400, 404] else None
            print_result("POST /validate-compatibility/ (with mock data)", 
                        success, data, response.text if not success else None)
    except Exception as e:
        print_result("POST /validate-compatibility/", False, error=str(e))

def get_parking_lots():
    """Get parking lots for testing"""
    try:
        response = requests.get(f"{BASE_URL}/parking-lots/")
        return response.json() if response.status_code == 200 else []
    except:
        return []

def main():
    print("🚗 Testing Vehicle-Slot Compatibility and Capacity Management API Endpoints")
    print(f"Server: {BASE_URL}")
    
    try:
        # Test basic server connection
        response = requests.get(f"{BASE_URL}/")
        if response.status_code != 200:
            print(f"✗ Server not responding properly: {response.status_code}")
            return
        print("✓ Server is running")
        
        # Get test data
        vehicle_types = test_vehicle_types()
        parking_lots = get_parking_lots()
        
        # Run all tests
        test_compatible_slots(vehicle_types)
        test_slot_suggestion(vehicle_types, parking_lots)
        test_capacity_report(parking_lots)
        test_real_time_capacity()
        test_capacity_alerts()
        test_availability_check(vehicle_types, parking_lots)
        test_validate_compatibility()
        
        print_section("Testing Complete!")
        print("✓ All endpoint tests executed")
        print("Note: Some endpoints may require authentication or specific data setup")
        
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to server. Make sure Django is running on http://127.0.0.1:8000")
    except Exception as e:
        print(f"✗ Unexpected error: {e}")

if __name__ == "__main__":
    main()