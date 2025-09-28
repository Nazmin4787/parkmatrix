#!/usr/bin/env python
"""
Test script to verify vehicle type functionality is working correctly.
Run this from the backend directory while the Django server is running.
"""

import requests
import json
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import ParkingSlot

BASE_URL = "http://127.0.0.1:8000/api"

def test_available_slots_with_vehicle_type():
    """Test the available slots endpoint with vehicle type filtering"""
    print("🔍 Testing available slots with vehicle type filtering...")
    
    # Test getting all available slots
    url = f"{BASE_URL}/slots/available/"
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Available slots endpoint is working!")
            print(f"Response structure: {type(data)}")
            
            if isinstance(data, dict):
                if 'slots' in data:
                    print(f"Total available slots: {data.get('total_available', 'N/A')}")
                    print(f"Available by type: {data.get('available_by_type', {})}")
                else:
                    print(f"Available slots count: {len(data) if isinstance(data, list) else 'Unknown'}")
            
        elif response.status_code == 401:
            print("ℹ️ Authentication required - this is expected for protected endpoints")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure Django server is running.")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_find_nearest_with_vehicle_type():
    """Test the find nearest slot endpoint with vehicle type"""
    print("\n🔍 Testing find nearest slot with vehicle type...")
    
    url = f"{BASE_URL}/slots/find-nearest/"
    params = {
        'lat': 19.205500135441547,
        'lon': 73.15605296577588,
        'vehicle_type': 'car'
    }
    
    try:
        response = requests.get(url, params=params)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Find nearest slot endpoint is working!")
            print(f"Found slot: {json.dumps(data, indent=2)}")
        elif response.status_code == 404:
            print("ℹ️ No available slots found (this is normal if no slots exist)")
            try:
                error_data = response.json()
                print(f"Message: {error_data.get('message', 'No message')}")
            except:
                pass
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure Django server is running.")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_admin_endpoints():
    """Test admin slot management endpoints"""
    print("\n🔍 Testing admin slot management endpoints...")
    
    # Test slot statistics
    url = f"{BASE_URL}/admin/slots/statistics/"
    try:
        response = requests.get(url)
        print(f"Slot statistics - Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print("ℹ️ Authentication required for admin endpoints - this is expected")
        elif response.status_code == 200:
            print("✅ Admin endpoints are accessible!")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure Django server is running.")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_vehicle_type_filtering():
    """Test the vehicle type filtering functionality"""
    
    base_url = "http://127.0.0.1:8000/api"
    
    print("🧪 Testing Vehicle Type Filtering\n")
    
    # Test 1: Check database slots by type
    print("📊 Database slots by vehicle type:")
    for vehicle_type, display_name in ParkingSlot.VEHICLE_TYPE_CHOICES:
        count = ParkingSlot.objects.filter(vehicle_type=vehicle_type, is_occupied=False).count()
        print(f"   {display_name}: {count} available slots")
    
    print(f"\n📍 Testing find-nearest endpoint with different vehicle types:")
    
    # Test coordinates
    lat, lon = 19.205, 73.156
    
    # Test different vehicle types
    vehicle_types = ['car', 'bike', 'suv', 'truck']
    
    for v_type in vehicle_types:
        try:
            url = f"{base_url}/slots/find-nearest/?lat={lat}&lon={lon}&vehicle_type={v_type}"
            response = requests.get(url)
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ {v_type.upper()}: Found slot {data.get('slot_number')} (type: {data.get('vehicle_type')})")
            elif response.status_code == 404:
                print(f"   ❌ {v_type.upper()}: No available slots")
            else:
                print(f"   ⚠️  {v_type.upper()}: Error {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print(f"   🔌 {v_type.upper()}: Server not running")
    
    print(f"\n🔍 Testing without vehicle type filter (should show compatible slots):")
    try:
        url = f"{base_url}/slots/find-nearest/?lat={lat}&lon={lon}"
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ ANY: Found slot {data.get('slot_number')} (type: {data.get('vehicle_type')})")
        else:
            print(f"   ⚠️  ANY: Error {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print(f"   🔌 ANY: Server not running")

def main():
    print("🚀 Testing Vehicle Type Functionality")
    print("=" * 50)
    
    test_available_slots_with_vehicle_type()
    test_find_nearest_with_vehicle_type()
    test_admin_endpoints()
    test_vehicle_type_filtering()
    
    print("\n" + "=" * 50)
    print("✅ Testing completed!")
    print("\nNext steps:")
    print("1. Create some parking slots with different vehicle types via Django admin")
    print("2. Register some vehicles with different types")
    print("3. Test booking functionality with vehicle type validation")

if __name__ == "__main__":
    main()