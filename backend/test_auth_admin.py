#!/usr/bin/env python
"""
Test authentication and admin endpoints
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def test_login_and_admin_access():
    """Test login and then access admin endpoints with proper auth"""
    print("🔐 Testing authentication flow...")
    
    # First, let's try to register a test admin user (this might fail if user exists)
    register_url = f"{BASE_URL}/auth/register/"
    register_data = {
        "username": "testadmin",
        "email": "testadmin@example.com",
        "password": "testpass123",
        "role": "admin"
    }
    
    try:
        register_response = requests.post(register_url, json=register_data)
        print(f"Register Status: {register_response.status_code}")
        if register_response.status_code == 201:
            print("✅ Test admin user created successfully")
        elif "already exists" in register_response.text.lower():
            print("ℹ️ Test admin user already exists")
        else:
            print(f"Register response: {register_response.text}")
    except Exception as e:
        print(f"Register error: {e}")
    
    # Now try to login
    login_url = f"{BASE_URL}/auth/login/"
    login_data = {
        "email": "testadmin@example.com",
        "password": "testpass123"
    }
    
    try:
        login_response = requests.post(login_url, json=login_data)
        print(f"Login Status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_data_response = login_response.json()
            access_token = login_data_response.get('access_token')
            
            if access_token:
                print("✅ Login successful, got access token")
                
                # Now try to access admin endpoints with authentication
                headers = {
                    'Authorization': f'Bearer {access_token}',
                    'Content-Type': 'application/json'
                }
                
                # Test admin slots endpoint
                admin_slots_url = f"{BASE_URL}/admin/slots/"
                admin_response = requests.get(admin_slots_url, headers=headers)
                print(f"Admin slots GET Status: {admin_response.status_code}")
                
                if admin_response.status_code == 200:
                    print("✅ Admin endpoint accessible with authentication")
                    data = admin_response.json()
                    print(f"Response type: {type(data)}")
                    if isinstance(data, list):
                        print(f"Found {len(data)} slots")
                    
                    # Try to create a new slot
                    new_slot_data = {
                        "slot_number": "TEST02",
                        "floor": "1",
                        "section": "A",
                        "vehicle_type": "car",
                        "parking_lot": 1  # Assuming parking lot exists
                    }
                    
                    create_response = requests.post(admin_slots_url, json=new_slot_data, headers=headers)
                    print(f"Create slot Status: {create_response.status_code}")
                    
                    if create_response.status_code == 201:
                        print("✅ Successfully created a new slot")
                    elif create_response.status_code == 400:
                        print("ℹ️ Validation error (expected if parking lot doesn't exist)")
                        print(f"Error: {create_response.text}")
                    else:
                        print(f"Create error: {create_response.text}")
                        
                elif admin_response.status_code == 403:
                    print("❌ 403 Forbidden - user might not have admin permissions")
                else:
                    print(f"❌ Admin endpoint error: {admin_response.status_code}")
                    print(f"Response: {admin_response.text}")
            else:
                print("❌ No access token received")
                print(f"Login response: {login_response.text}")
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            
    except Exception as e:
        print(f"❌ Login error: {e}")

def main():
    print("🔐 Testing Authentication and Admin Access")
    print("=" * 50)
    
    test_login_and_admin_access()
    
    print("\n" + "=" * 50)
    print("Authentication test completed!")

if __name__ == "__main__":
    main()