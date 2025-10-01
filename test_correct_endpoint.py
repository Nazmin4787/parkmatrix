import requests
import json

# Test the correct available slots endpoint
print("=== Testing Available Slots Endpoint ===\n")

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
    
    # Test available slots endpoint (correct one)
    auth_headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*'
    }
    
    print("\nTesting /api/slots/available/ (customer endpoint)...")
    available_response = requests.get('http://localhost:8000/api/slots/available/', headers=auth_headers)
    print(f"Available Slots Status: {available_response.status_code}")
    print(f"Available Slots Response: {available_response.text[:500]}...")
    
    if available_response.status_code == 200:
        slots_data = available_response.json()
        print(f"✅ Got {len(slots_data)} available slots")
        
        # Test booking with first available slot
        if slots_data:
            slot = slots_data[0]
            print(f"\nTesting booking with slot: {slot['slot_id']} (ID: {slot['id']})")
            
            booking_data = {
                "slot": slot['id'],
                "vehicle": {
                    "number_plate": "CUSTOMER123",
                    "vehicle_type": "car",
                    "model": "Test",
                    "color": "Blue"
                },
                "start_time": "2025-09-29T14:00:00.000Z",
                "end_time": "2025-09-29T16:00:00.000Z"
            }
            
            booking_response = requests.post('http://localhost:8000/api/bookings/', 
                                           json=booking_data, 
                                           headers=auth_headers)
            
            print(f"Booking Status: {booking_response.status_code}")
            print(f"Booking Response: {booking_response.text}")
            
            if booking_response.status_code == 201:
                print("✅ Booking successful!")
            else:
                print("❌ Booking failed")
        else:
            print("No available slots to test booking")
    else:
        print("❌ Failed to get available slots")
        
    # Also test the admin endpoint for comparison
    print("\nTesting /api/slots/ (admin endpoint)...")
    admin_response = requests.get('http://localhost:8000/api/slots/', headers=auth_headers)
    print(f"Admin Slots Status: {admin_response.status_code}")
    print(f"Admin Slots Response: {admin_response.text[:200]}...")
    
else:
    print(f"❌ Login failed: {login_response.text}")