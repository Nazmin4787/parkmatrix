import requests
import json

# Test the corrected booking API
login_data = {
    'email': 'customer@example.com',
    'password': 'customer123'
}

# Add proper headers for JSON API request
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

print("Getting authentication token...")
login_response = requests.post('http://localhost:8000/api/auth/login/', 
                              json=login_data, 
                              headers=headers)

if login_response.status_code == 200:
    token_data = login_response.json()
    token = token_data.get('access')
    
    # Test booking with corrected field name
    booking_headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    
    # Use 'slot' instead of 'slot_id'
    booking_data = {
        'slot': 'T5',  # Changed from 'slot_id' to 'slot'
        'vehicle_data': {
            'license_plate': 'TEST789',
            'vehicle_type': 'Car',
            'color': 'Red',
            'make': 'Honda',
            'model': 'Civic'
        },
        'start_time': '2025-09-29T11:00:00Z',
        'end_time': '2025-09-29T13:00:00Z'
    }
    
    print("Testing booking API with correct field names...")
    booking_response = requests.post('http://localhost:8000/api/bookings/', 
                                   json=booking_data, 
                                   headers=booking_headers)
    print('Booking Response Status:', booking_response.status_code)
    print('Booking Response:', booking_response.text)
    
    if booking_response.status_code == 201:
        print("✅ Booking created successfully!")
    else:
        print("❌ Booking failed")
        
else:
    print('Login Failed:', login_response.text)