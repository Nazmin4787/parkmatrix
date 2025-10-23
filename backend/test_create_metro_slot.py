"""
Test creating a slot in Metro Parking zone via API
"""
import requests
import json

BASE_URL = "http://localhost:8000/api"

# First, login to get token
print("=== Logging in ===")
login_response = requests.post(f"{BASE_URL}/auth/login/", json={
    "email": "admin@admin.com",  # Change to your admin email
    "password": "admin123"  # Change to your admin password
})

if login_response.status_code != 200:
    print(f"Login failed: {login_response.status_code}")
    print(login_response.text)
    exit()

token = login_response.json().get('access')
print(f"✓ Logged in successfully")

# Create headers with token
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

# Create a slot in Metro Parking
print("\n=== Creating slot in Metro Parking ===")
slot_data = {
    "slot_number": "M001",
    "floor": "1",
    "section": "A",
    "vehicle_type": "car",
    "parking_zone": "METRO_PARKING_CENTER",
    "pos_x": 0,
    "pos_y": 0,
    "height_cm": 200,
    "width_cm": 300,
    "length_cm": 500
}

print(f"Slot data: {json.dumps(slot_data, indent=2)}")

create_response = requests.post(
    f"{BASE_URL}/admin/slots/",
    headers=headers,
    json=slot_data
)

print(f"\nStatus: {create_response.status_code}")
print(f"Response: {json.dumps(create_response.json(), indent=2)}")

if create_response.status_code == 201:
    print("\n✓ Slot created successfully!")
    
    # Now check Metro Parking zone
    print("\n=== Checking Metro Parking zone ===")
    zone_response = requests.get(
        f"{BASE_URL}/parking-zones/METRO_PARKING_CENTER/slots/",
        headers={'Accept': 'application/json'}
    )
    
    if zone_response.status_code == 200:
        zone_data = zone_response.json()
        print(f"Total slots in Metro Parking: {zone_data['total_slots']}")
        print(f"Available slots: {zone_data['available_slots']}")
        if zone_data['slots']:
            print("\nSlots:")
            for slot in zone_data['slots']:
                print(f"  - {slot['slot_number']}: {slot['vehicle_type']}, Floor {slot['floor']}")
else:
    print(f"\n✗ Failed to create slot")
    print(f"Error: {create_response.text}")
