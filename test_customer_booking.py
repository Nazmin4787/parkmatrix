"""
Test script to create a customer user and test booking functionality
"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://127.0.0.1:8000"
ADMIN_TOKEN = None
CUSTOMER_TOKEN = None

def admin_login():
    """Login as admin to get token"""
    url = f"{BASE_URL}/api/auth/login/"
    headers = {
        'Content-Type': 'application/json', 
        'Accept': 'application/json'
    }
    data = {
        "email": "admin@example.com", 
        "password": "admin123"
    }
    
    print(f"Admin login...")
    response = requests.post(url, headers=headers, data=json.dumps(data))
    
    if response.status_code == 200:
        global ADMIN_TOKEN
        response_data = response.json()
        ADMIN_TOKEN = response_data['access']
        print(f"✅ Admin login successful!")
        return True
    else:
        print(f"❌ Admin login failed: {response.status_code}")
        return False

def create_customer_user():
    """Create a customer user using admin privileges"""
    url = f"{BASE_URL}/api/auth/register/"
    headers = {
        'Content-Type': 'application/json', 
        'Accept': 'application/json'
    }
    data = {
        "username": "testcustomer",
        "email": "customer@example.com", 
        "password": "customer123",
        "role": "customer"
    }
    
    print(f"Creating customer user...")
    response = requests.post(url, headers=headers, data=json.dumps(data))
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 201:
        print(f"✅ Customer user created successfully!")
        return True
    else:
        print(f"❌ Customer creation failed: {response.status_code}")
        try:
            error_data = response.json()
            print(f"Error: {json.dumps(error_data, indent=2)}")
        except:
            print(f"Raw response: {response.text}")
        return False

def customer_login():
    """Login as customer to test booking"""
    url = f"{BASE_URL}/api/auth/login/"
    headers = {
        'Content-Type': 'application/json', 
        'Accept': 'application/json'
    }
    data = {
        "email": "customer@example.com", 
        "password": "customer123"
    }
    
    print(f"Customer login...")
    response = requests.post(url, headers=headers, data=json.dumps(data))
    
    if response.status_code == 200:
        global CUSTOMER_TOKEN
        response_data = response.json()
        CUSTOMER_TOKEN = response_data['access']
        print(f"✅ Customer login successful!")
        return True
    else:
        print(f"❌ Customer login failed: {response.status_code}")
        try:
            error_data = response.json()
            print(f"Error: {json.dumps(error_data, indent=2)}")
        except:
            print(f"Raw response: {response.text}")
        return False

def test_customer_booking():
    """Test booking as customer user"""
    if not CUSTOMER_TOKEN:
        print("❌ No customer token available")
        return False
        
    # Get available slots first
    url = f"{BASE_URL}/api/slots/available/"
    headers = {
        'Authorization': f'Bearer {CUSTOMER_TOKEN}',
        'Accept': 'application/json'
    }
    
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print(f"❌ Failed to get slots: {response.status_code}")
        return False
        
    slots_data = response.json()
    slots = slots_data.get('slots', [])
    
    if not slots:
        print("❌ No available slots")
        return False
        
    # Test booking
    slot = slots[0]
    slot_id = slot['id']
    
    booking_url = f"{BASE_URL}/api/bookings/"
    booking_headers = {
        'Authorization': f'Bearer {CUSTOMER_TOKEN}',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    
    start_time = datetime.now() + timedelta(hours=1)
    end_time = start_time + timedelta(hours=2)
    
    booking_data = {
        "slot": slot_id,
        "vehicle": {
            "number_plate": "CUST123",
            "vehicle_type": "car",
            "model": "Customer Car",
            "color": "Red"
        },
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat()
    }
    
    print(f"\\nTesting booking for slot {slot['slot_number']} (ID: {slot_id})")
    
    response = requests.post(booking_url, headers=booking_headers, data=json.dumps(booking_data))
    
    print(f"Booking status: {response.status_code}")
    
    if response.status_code == 201:
        booking = response.json()
        print(f"✅ Booking successful! ID: {booking.get('id')}")
        return True
    else:
        print(f"❌ Booking failed: {response.status_code}")
        try:
            error_data = response.json()
            print(f"Error: {json.dumps(error_data, indent=2)}")
        except:
            print(f"Raw response: {response.text}")
        return False

def run_customer_booking_test():
    """Run the complete customer booking test"""
    print("=== CUSTOMER BOOKING TEST ===\\n")
    
    # Step 1: Login as admin
    if not admin_login():
        return
    
    # Step 2: Create customer user
    create_customer_user()
    
    # Step 3: Login as customer
    if not customer_login():
        return
    
    # Step 4: Test booking as customer
    if test_customer_booking():
        print("\\n✅ CUSTOMER BOOKING TEST SUCCESSFUL!")
    else:
        print("\\n❌ CUSTOMER BOOKING TEST FAILED!")

if __name__ == "__main__":
    run_customer_booking_test()