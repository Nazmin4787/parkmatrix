import requests
import json

# Test the complete frontend flow step by step
def test_frontend_api_flow():
    print("=== Testing Complete Frontend API Flow ===\n")
    
    # Step 1: Login
    print("1. Testing Login...")
    login_data = {
        'email': 'customer@example.com',
        'password': 'customer123'
    }
    
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*'  # Same as frontend
    }
    
    login_response = requests.post('http://localhost:8000/api/auth/login/', 
                                  json=login_data, 
                                  headers=headers)
    
    print(f"Login Status: {login_response.status_code}")
    if login_response.status_code != 200:
        print(f"Login Failed: {login_response.text}")
        return
    
    token_data = login_response.json()
    token = token_data.get('access')
    print("✅ Login successful")
    
    # Step 2: Get available slots
    print("\n2. Testing Get Available Slots...")
    auth_headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*'
    }
    
    slots_response = requests.get('http://localhost:8000/api/slots/', headers=auth_headers)
    print(f"Slots Status: {slots_response.status_code}")
    if slots_response.status_code != 200:
        print(f"Slots Failed: {slots_response.text}")
        return
    
    slots_data = slots_response.json()
    print(f"✅ Got {len(slots_data)} slots")
    
    # Find an available slot
    available_slot = None
    for slot in slots_data:
        if slot.get('status') == 'available':
            available_slot = slot
            break
    
    if not available_slot:
        print("❌ No available slots found")
        return
    
    print(f"✅ Found available slot: {available_slot['slot_id']} (ID: {available_slot['id']})")
    
    # Step 3: Test booking exactly as frontend would
    print("\n3. Testing Booking (Frontend style)...")
    
    # This is exactly how the frontend formats the request
    booking_data = {
        "slot": available_slot['id'],  # Database ID, not slot_id
        "vehicle": {
            "number_plate": "FRONTEND123",
            "vehicle_type": "car",
            "model": "Test Model",
            "color": "Blue"
        },
        "start_time": "2025-09-29T13:00:00.000Z",
        "end_time": "2025-09-29T15:00:00.000Z"
    }
    
    print(f"Booking data: {json.dumps(booking_data, indent=2)}")
    
    booking_response = requests.post('http://localhost:8000/api/bookings/', 
                                   json=booking_data, 
                                   headers=auth_headers)
    
    print(f"Booking Status: {booking_response.status_code}")
    print(f"Booking Response: {booking_response.text}")
    
    if booking_response.status_code == 201:
        print("✅ Booking successful!")
        booking_result = booking_response.json()
        print(f"Booking ID: {booking_result.get('id')}")
    else:
        print("❌ Booking failed")
        # Try to parse error details
        try:
            error_data = booking_response.json()
            print(f"Error details: {json.dumps(error_data, indent=2)}")
        except:
            print(f"Raw error: {booking_response.text}")

if __name__ == "__main__":
    test_frontend_api_flow()