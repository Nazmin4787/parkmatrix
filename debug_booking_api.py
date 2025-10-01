"""
Test script to debug the booking API issue.
This script will test the booking functionality step by step.
"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://127.0.0.1:8000"
TOKEN = None

def login():
    """Login to get authentication token"""
    url = f"{BASE_URL}/api/auth/login/"
    headers = {
        'Content-Type': 'application/json', 
        'Accept': 'application/json'
    }
    data = {
        "email": "admin@example.com", 
        "password": "admin123"
    }
    
    print(f"Logging in with {data['email']}...")
    response = requests.post(url, headers=headers, data=json.dumps(data))
    
    if response.status_code == 200:
        global TOKEN
        response_data = response.json()
        TOKEN = response_data['access']
        print(f"✅ Login successful! Token: {TOKEN[:20]}...")
        return True
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(f"Response: {response.text}")
        return False

def get_available_slots():
    """Get available slots"""
    url = f"{BASE_URL}/api/slots/available/"
    headers = {'Authorization': f'Bearer {TOKEN}'}
    
    print("\\nFetching available slots...")
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        slots = response.json()
        print(f"✅ Found {len(slots)} available slots")
        return slots
    else:
        print(f"❌ Failed to get slots: {response.status_code}")
        print(f"Response: {response.text}")
        return []

def test_booking(slot_id, vehicle_data=None):
    """Test booking a specific slot"""
    if not TOKEN:
        print("❌ Not authenticated")
        return False
        
    url = f"{BASE_URL}/api/bookings/"
    headers = {
        'Authorization': f'Bearer {TOKEN}',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    
    # Default vehicle data if none provided
    if not vehicle_data:
        vehicle_data = {
            "number_plate": "TEST123",
            "vehicle_type": "car",
            "model": "Test Car",
            "color": "Blue"
        }
    
    # Calculate start and end times
    start_time = datetime.now() + timedelta(minutes=30)  # Start in 30 minutes
    end_time = start_time + timedelta(hours=2)  # 2 hour duration
    
    booking_data = {
        "slot": slot_id,
        "vehicle": vehicle_data,
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat()
    }
    
    print(f"\\nTesting booking for slot {slot_id}...")
    print(f"Booking data: {json.dumps(booking_data, indent=2)}")
    
    response = requests.post(url, headers=headers, data=json.dumps(booking_data))
    
    print(f"Response status: {response.status_code}")
    print(f"Response headers: {dict(response.headers)}")
    
    if response.status_code == 201:
        booking = response.json()
        print(f"✅ Booking successful!")
        print(f"Booking ID: {booking.get('id')}")
        return True
    else:
        print(f"❌ Booking failed: {response.status_code}")
        try:
            error_data = response.json()
            print(f"Error details: {json.dumps(error_data, indent=2)}")
        except:
            print(f"Raw response: {response.text}")
        return False

def test_booking_with_different_formats():
    """Test booking with different date/time formats"""
    if not login():
        return
        
    slots = get_available_slots()
    if not slots:
        print("❌ No available slots to test with")
        return
        
    # Get the first available slot
    test_slot = slots[0]
    slot_id = test_slot.get('id')
    
    print(f"\\nTesting with slot: {test_slot.get('slot_number')} (ID: {slot_id})")
    
    # Test 1: ISO format (what frontend should send)
    print("\\n=== Test 1: ISO format ===")
    test_booking(slot_id)
    
    # Test 2: With legacy date/time format
    print("\\n=== Test 2: Legacy format ===")
    test_booking_legacy_format(slot_id)

def test_booking_legacy_format(slot_id):
    """Test booking with legacy date/time format"""
    if not TOKEN:
        print("❌ Not authenticated")
        return False
        
    url = f"{BASE_URL}/api/bookings/"
    headers = {
        'Authorization': f'Bearer {TOKEN}',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    
    vehicle_data = {
        "number_plate": "TEST456",
        "vehicle_type": "car",
        "model": "Test Car",
        "color": "Red"
    }
    
    # Legacy format
    tomorrow = datetime.now() + timedelta(days=1)
    booking_data = {
        "slot": slot_id,
        "vehicle": vehicle_data,
        "date": tomorrow.strftime("%Y-%m-%d"),
        "time": "14:30",
        "duration": 2
    }
    
    print(f"Legacy booking data: {json.dumps(booking_data, indent=2)}")
    
    response = requests.post(url, headers=headers, data=json.dumps(booking_data))
    
    print(f"Response status: {response.status_code}")
    
    if response.status_code == 201:
        booking = response.json()
        print(f"✅ Legacy booking successful!")
        print(f"Booking ID: {booking.get('id')}")
        return True
    else:
        print(f"❌ Legacy booking failed: {response.status_code}")
        try:
            error_data = response.json()
            print(f"Error details: {json.dumps(error_data, indent=2)}")
        except:
            print(f"Raw response: {response.text}")
        return False

if __name__ == "__main__":
    print("=== BOOKING API DEBUG TEST ===")
    test_booking_with_different_formats()