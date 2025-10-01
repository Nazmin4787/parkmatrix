"""
Test to check the current user's role and fix booking issues
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_user_login_and_role(email, password):
    """Test login and check user role"""
    url = f"{BASE_URL}/api/auth/login/"
    headers = {
        'Content-Type': 'application/json', 
        'Accept': 'application/json'
    }
    data = {
        "email": email, 
        "password": password
    }
    
    print(f"Testing login for {email}...")
    response = requests.post(url, headers=headers, data=json.dumps(data))
    
    if response.status_code == 200:
        response_data = response.json()
        token = response_data['access']
        
        # Decode the JWT token to see user info
        import base64
        
        # Split the JWT token
        header, payload, signature = token.split('.')
        
        # Add padding if needed and decode
        payload += '=' * (4 - len(payload) % 4)
        decoded_payload = base64.b64decode(payload)
        user_info = json.loads(decoded_payload)
        
        print(f"✅ Login successful!")
        print(f"User ID: {user_info.get('user_id')}")
        print(f"Username: {user_info.get('username')}")
        print(f"Email: {user_info.get('email')}")
        print(f"Role: {user_info.get('role')}")
        
        # Test booking if user is customer
        if user_info.get('role') == 'customer':
            print("\\n🎯 User has customer role - testing booking...")
            test_booking_with_token(token)
        else:
            print(f"\\n❌ User role is '{user_info.get('role')}' - need 'customer' role for booking")
            print("Try logging in with customer@example.com / customer123")
        
        return user_info.get('role')
    else:
        print(f"❌ Login failed: {response.status_code}")
        try:
            error_data = response.json()
            print(f"Error: {error_data}")
        except:
            print(f"Raw response: {response.text}")
        return None

def test_booking_with_token(token):
    """Test booking with the provided token"""
    # Get available slots first
    url = f"{BASE_URL}/api/slots/available/"
    headers = {
        'Authorization': f'Bearer {token}',
        'Accept': 'application/json'
    }
    
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print(f"❌ Failed to get slots: {response.status_code}")
        return
        
    slots_data = response.json()
    slots = slots_data.get('slots', [])
    
    if not slots:
        print("❌ No available slots")
        return
        
    # Test booking with first available slot
    slot = slots[0]
    slot_id = slot['id']
    slot_number = slot['slot_number']
    
    print(f"Testing booking for slot {slot_number} (ID: {slot_id})")
    
    from datetime import datetime, timedelta
    
    booking_url = f"{BASE_URL}/api/bookings/"
    booking_headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    
    start_time = datetime.now() + timedelta(hours=1)
    end_time = start_time + timedelta(hours=2)
    
    booking_data = {
        "slot": slot_id,
        "vehicle": {
            "number_plate": "TEST999",
            "vehicle_type": "car",
            "model": "Test Car",
            "color": "Blue"
        },
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat()
    }
    
    response = requests.post(booking_url, headers=booking_headers, data=json.dumps(booking_data))
    
    if response.status_code == 201:
        booking = response.json()
        print(f"✅ Booking successful! Booking ID: {booking.get('id')}")
    else:
        print(f"❌ Booking failed: {response.status_code}")
        try:
            error_data = response.json()
            print(f"Error details: {json.dumps(error_data, indent=2)}")
        except:
            print(f"Raw response: {response.text}")

def create_customer_user_if_needed():
    """Create a customer user for testing"""
    url = f"{BASE_URL}/api/auth/register/"
    headers = {
        'Content-Type': 'application/json', 
        'Accept': 'application/json'
    }
    data = {
        "username": "testcustomer2",
        "email": "testcustomer@example.com", 
        "password": "customer123",
        "role": "customer"
    }
    
    print(f"Creating customer user {data['email']}...")
    response = requests.post(url, headers=headers, data=json.dumps(data))
    
    if response.status_code == 201:
        print(f"✅ Customer user created successfully!")
        return True
    elif response.status_code == 400:
        print(f"ℹ️ User might already exist")
        return True
    else:
        print(f"❌ Customer creation failed: {response.status_code}")
        try:
            error_data = response.json()
            print(f"Error: {json.dumps(error_data, indent=2)}")
        except:
            print(f"Raw response: {response.text}")
        return False

if __name__ == "__main__":
    print("=== USER ROLE AND BOOKING TEST ===\\n")
    
    # Test different users
    users_to_test = [
        ("testuser@example.com", "password123"),  # This is what you're using
        ("customer@example.com", "customer123"),  # This should work
        ("admin@example.com", "admin123"),        # This won't work for booking
    ]
    
    for email, password in users_to_test:
        print(f"\\n{'='*60}")
        role = test_user_login_and_role(email, password)
        print(f"{'='*60}")
    
    print("\\n🔧 CREATING ADDITIONAL TEST USER...")
    create_customer_user_if_needed()
    
    print("\\n📝 SUMMARY:")
    print("- Use customer@example.com / customer123 for booking")
    print("- Or use testcustomer@example.com / customer123 (if created)")
    print("- testuser@example.com might not have customer role")
    print("- admin@example.com cannot make bookings (admin role only)")