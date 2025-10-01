import requests
import json

# Test the correct available slots endpoint with proper response handling
print("=== Testing Available Slots Endpoint (Fixed) ===\n")

# Login first
login_data = {
    'email': 'customer@example.com',
    'password': 'customer123'
}

headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*'
}

login_response = requests.post('http://localhost:8000/api/auth/login/', 
                              json=login_data, 
                              headers=headers)

if login_response.status_code == 200:
    token_data = login_response.json()
    token = token_data.get('access')
    print("✅ Login successful")
    
    # Test available slots endpoint
    auth_headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*'
    }
    
    print("\nTesting /api/slots/available/ endpoint...")
    available_response = requests.get('http://localhost:8000/api/slots/available/', headers=auth_headers)
    print(f"Available Slots Status: {available_response.status_code}")
    
    if available_response.status_code == 200:
        response_data = available_response.json()
        print(f"Response structure: {list(response_data.keys())}")
        
        # Handle the response structure properly
        if 'slots' in response_data:
            slots_data = response_data['slots']
        else:
            slots_data = response_data
            
        print(f"✅ Got {len(slots_data)} available slots")
        
        # Test booking with first available slot
        if slots_data:
            slot = slots_data[0]
            print(f"\nFound slot structure: {list(slot.keys())}")
            print(f"Slot ID: {slot.get('id')}, Slot Number: {slot.get('slot_number')}")
            
            booking_data = {
                "slot": int(slot['id']),  # Make sure it's an integer
                "vehicle": {
                    "number_plate": "WORKING123",
                    "vehicle_type": "car",
                    "model": "Test",
                    "color": "Blue"
                },
                "start_time": "2025-09-29T15:00:00.000Z",
                "end_time": "2025-09-29T17:00:00.000Z"
            }
            
            print(f"\nTesting booking with data: {json.dumps(booking_data, indent=2)}")
            
            booking_response = requests.post('http://localhost:8000/api/bookings/', 
                                           json=booking_data, 
                                           headers=auth_headers)
            
            print(f"Booking Status: {booking_response.status_code}")
            print(f"Booking Response: {booking_response.text}")
            
            if booking_response.status_code == 201:
                print("✅ BOOKING SUCCESSFUL! The API is working correctly.")
                booking_result = booking_response.json()
                print(f"Booking ID: {booking_result.get('id')}")
            else:
                print("❌ Booking failed - investigating...")
                try:
                    error_data = booking_response.json()
                    print(f"Error details: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"Raw error: {booking_response.text}")
        else:
            print("No available slots to test booking")
    else:
        print(f"❌ Failed to get available slots: {available_response.text}")
else:
    print(f"❌ Login failed: {login_response.text}")