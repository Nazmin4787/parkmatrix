"""
Comprehensive booking test with proper authentication
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
    """Get available slots with proper authentication"""
    url = f"{BASE_URL}/api/slots/available/"
    headers = {
        'Authorization': f'Bearer {TOKEN}',
        'Accept': 'application/json'
    }
    
    print("\\nFetching available slots...")
    response = requests.get(url, headers=headers)
    
    print(f"Status: {response.status_code}")
    print(f"Content-Type: {response.headers.get('Content-Type')}")
    
    if response.status_code == 200:
        try:
            data = response.json()
            print(f"✅ Response received")
            print(f"Response type: {type(data)}")
            print(f"Response data: {json.dumps(data, indent=2)}")
            
            # Check if it's a list or dict with slots
            if isinstance(data, list):
                slots = data
            elif isinstance(data, dict) and 'slots' in data:
                slots = data['slots']
            elif isinstance(data, dict) and 'results' in data:
                slots = data['results']
            else:
                slots = data if isinstance(data, list) else []
            
            print(f"Found {len(slots)} available slots")
            return slots
        except json.JSONDecodeError:
            print(f"❌ Invalid JSON response: {response.text[:100]}...")
            return []
    else:
        print(f"❌ Failed to get slots: {response.status_code}")
        try:
            error_data = response.json()
            print(f"Error: {error_data}")
        except:
            print(f"Raw response: {response.text[:200]}...")
        return []

def test_booking_creation(slot_id):
    """Test creating a booking"""
    if not TOKEN:
        print("❌ Not authenticated")
        return False
        
    url = f"{BASE_URL}/api/bookings/"
    headers = {
        'Authorization': f'Bearer {TOKEN}',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    
    # Create booking data
    start_time = datetime.now() + timedelta(hours=1)  # Start in 1 hour
    end_time = start_time + timedelta(hours=2)  # 2 hour duration
    
    booking_data = {
        "slot": slot_id,
        "vehicle": {
            "number_plate": "TEST123",
            "vehicle_type": "car",
            "model": "Test Car",
            "color": "Blue"
        },
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat()
    }
    
    print(f"\\n=== TESTING BOOKING CREATION ===")
    print(f"Slot ID: {slot_id}")
    print(f"Start time: {start_time}")
    print(f"End time: {end_time}")
    print(f"Booking data: {json.dumps(booking_data, indent=2)}")
    
    response = requests.post(url, headers=headers, data=json.dumps(booking_data))
    
    print(f"\\nBooking response:")
    print(f"Status: {response.status_code}")
    print(f"Content-Type: {response.headers.get('Content-Type')}")
    
    if response.status_code == 201:
        try:
            booking = response.json()
            print(f"✅ Booking successful!")
            print(f"Booking details: {json.dumps(booking, indent=2)}")
            return booking
        except json.JSONDecodeError:
            print(f"❌ Invalid JSON response: {response.text}")
            return None
    else:
        print(f"❌ Booking failed: {response.status_code}")
        try:
            error_data = response.json()
            print(f"Error details: {json.dumps(error_data, indent=2)}")
        except:
            print(f"Raw error response: {response.text}")
        return None

def run_complete_booking_test():
    """Run the complete booking test"""
    print("=== COMPLETE BOOKING TEST ===\\n")
    
    # Step 1: Login
    if not login():
        print("❌ Cannot proceed without authentication")
        return
    
    # Step 2: Get available slots
    slots = get_available_slots()
    if not slots:
        print("❌ No available slots found")
        return
    
    # Step 3: Try to book the first available slot
    first_slot = slots[0]
    slot_id = first_slot.get('id')
    slot_number = first_slot.get('slot_number', 'Unknown')
    
    print(f"\\nTesting booking for slot: {slot_number} (ID: {slot_id})")
    
    booking = test_booking_creation(slot_id)
    
    if booking:
        print(f"\\n✅ BOOKING TEST SUCCESSFUL!")
        print(f"Booking ID: {booking.get('id')}")
        print(f"Slot: {booking.get('slot', {}).get('slot_number', 'Unknown')}")
    else:
        print(f"\\n❌ BOOKING TEST FAILED!")

if __name__ == "__main__":
    run_complete_booking_test()