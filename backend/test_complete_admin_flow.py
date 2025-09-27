#!/usr/bin/env python
import requests
import json

def test_complete_admin_flow():
    """Test the complete admin flow with proper headers"""
    print("🧪 Testing complete admin API flow...")
    
    base_url = "http://127.0.0.1:8000/api"
    
    # 1. Login
    login_data = {
        "email": "admin@example.com",
        "password": "admin123"
    }
    
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    
    response = requests.post(f"{base_url}/auth/login/", json=login_data, headers=headers)
    print(f"Login Status: {response.status_code}")
    
    if response.status_code == 200:
        tokens = response.json()
        auth_headers = {
            'Authorization': f'Bearer {tokens["access"]}',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        print("✅ Login successful!")
        
        # 2. Get current slots
        response = requests.get(f"{base_url}/admin/slots/", headers=auth_headers)
        print(f"GET slots status: {response.status_code}")
        if response.status_code == 200:
            slots = response.json()
            print(f"Found {len(slots)} existing slots")
            
        # 3. Create a new slot
        new_slot_data = {
            "slot_number": "TEST_ADMIN_02",
            "floor": "2",
            "section": "B",  
            "vehicle_type": "suv",
            "parking_lot": 29,  # Use existing parking lot ID
            "pos_x": 5,
            "pos_y": 5,
            "height_cm": 220,
            "width_cm": 350,
            "length_cm": 550
        }
        
        response = requests.post(f"{base_url}/admin/slots/", json=new_slot_data, headers=auth_headers)
        print(f"POST create slot status: {response.status_code}")
        
        if response.status_code == 201:
            new_slot = response.json()
            print(f"✅ Created new slot: {new_slot['slot_number']} for {new_slot['vehicle_type']}")
            slot_id = new_slot['id']
            
            # 4. Update the slot
            update_data = {
                "vehicle_type": "truck",
                "height_cm": 250,
                "section": "C"
            }
            
            response = requests.patch(f"{base_url}/admin/slots/{slot_id}/", json=update_data, headers=auth_headers)
            print(f"PATCH update slot status: {response.status_code}")
            
            if response.status_code == 200:
                updated_slot = response.json()
                print(f"✅ Updated slot to vehicle_type: {updated_slot['vehicle_type']}, section: {updated_slot['section']}")
            
            # 5. Delete the test slot
            response = requests.delete(f"{base_url}/admin/slots/{slot_id}/", headers=auth_headers)
            print(f"DELETE slot status: {response.status_code}")
            if response.status_code == 204:
                print("✅ Successfully deleted test slot")
                
        else:
            print(f"❌ Failed to create slot: {response.text}")
            
        # 6. Test slot statistics
        response = requests.get(f"{base_url}/admin/slots/statistics/", headers=auth_headers)
        print(f"GET statistics status: {response.status_code}")
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Statistics: Total: {stats.get('total_slots')}, Available: {stats.get('available_slots')}")
            
    else:
        print(f"❌ Login failed: {response.text}")

if __name__ == '__main__':
    test_complete_admin_flow()