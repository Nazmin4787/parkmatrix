import requests
import json

# Test the login API with proper headers
login_data = {
    'email': 'customer@example.com',
    'password': 'customer123'
}

# Add proper headers for JSON API request
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

print("Testing login API with proper headers...")
login_response = requests.post('http://localhost:8000/api/auth/login/', 
                              json=login_data, 
                              headers=headers)

print('Login Response Status:', login_response.status_code)
print('Login Response Headers:', dict(login_response.headers))

if login_response.status_code == 200:
    try:
        token_data = login_response.json()
        print('Login Success - Token Data:', token_data)
        
        # Test booking with proper token
        token = token_data.get('access')
        booking_headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        booking_data = {
            'slot_id': 'T5',
            'vehicle_data': {
                'license_plate': 'TEST123',
                'vehicle_type': 'Car',
                'color': 'Blue',
                'make': 'Toyota',
                'model': 'Camry'
            },
            'start_time': '2025-09-29T10:00:00Z',
            'end_time': '2025-09-29T12:00:00Z'
        }
        
        print("Testing booking API...")
        booking_response = requests.post('http://localhost:8000/api/bookings/', 
                                       json=booking_data, 
                                       headers=booking_headers)
        print('Booking Response Status:', booking_response.status_code)
        print('Booking Response:', booking_response.text)
        
    except Exception as e:
        print('JSON Decode Error:', e)
        print('Raw content:', login_response.text[:500])
else:
    print('Login Failed')
    print('Response:', login_response.text[:500])