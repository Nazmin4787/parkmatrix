import requests
import json

# Get available slots to see their structure
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

print("Getting available slots...")
slots_response = requests.get('http://localhost:8000/api/slots/', headers=headers)
print('Slots Response Status:', slots_response.status_code)

if slots_response.status_code == 200:
    slots_data = slots_response.json()
    print('Available Slots:')
    for slot in slots_data[:5]:  # Show first 5 slots
        print(f"ID: {slot.get('id')}, Slot ID: {slot.get('slot_id')}, Status: {slot.get('status')}")
    
    # Test login and booking with correct slot ID
    login_data = {
        'email': 'customer@example.com',
        'password': 'customer123'
    }
    
    login_response = requests.post('http://localhost:8000/api/auth/login/', 
                                  json=login_data, 
                                  headers=headers)
    
    if login_response.status_code == 200:
        token_data = login_response.json()
        token = token_data.get('access')
        
        # Find an available slot
        available_slot = None
        for slot in slots_data:
            if slot.get('status') == 'available':
                available_slot = slot
                break
        
        if available_slot:
            print(f"\nTesting booking with slot ID: {available_slot['id']} (Slot: {available_slot['slot_id']})")
            
            booking_headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
            
            booking_data = {
                'slot': available_slot['id'],  # Use the database ID
                'vehicle_data': {
                    'license_plate': 'FRONTEND123',
                    'vehicle_type': 'Car',
                    'color': 'Blue',
                    'make': 'Toyota',
                    'model': 'Camry'
                },
                'start_time': '2025-09-29T12:00:00Z',
                'end_time': '2025-09-29T14:00:00Z'
            }
            
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
            print("No available slots found")
else:
    print('Failed to get slots:', slots_response.text)