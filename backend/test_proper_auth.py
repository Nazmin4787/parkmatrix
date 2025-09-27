#!/usr/bin/env python
"""
Test authentication with proper headers
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def test_login_with_proper_headers():
    """Test login with proper Accept and Content-Type headers"""
    print("🔐 Testing login with proper headers...")
    
    login_url = f"{BASE_URL}/auth/login/"
    login_data = {
        "email": "testadmin@example.com",
        "password": "testpass123"
    }
    
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    
    try:
        response = requests.post(login_url, json=login_data, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type')}")
        
        if response.status_code == 200:
            try:
                json_data = response.json()
                print("✅ Login successful!")
                print(f"Access token available: {'access' in json_data}")
                print(f"Refresh token available: {'refresh' in json_data}")
                
                if 'access' in json_data:
                    access_token = json_data['access']
                    print(f"Access token length: {len(access_token)}")
                    
                    # Test admin endpoint with proper authentication
                    admin_headers = {
                        'Authorization': f'Bearer {access_token}',
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                    
                    admin_url = f"{BASE_URL}/admin/slots/"
                    admin_response = requests.get(admin_url, headers=admin_headers)
                    print(f"Admin GET Status: {admin_response.status_code}")
                    
                    if admin_response.status_code == 200:
                        print("✅ Admin endpoint works with authentication!")
                        slots_data = admin_response.json()
                        print(f"Found {len(slots_data)} slots")
                        
                        # Test POST to admin endpoint
                        new_slot = {
                            "slot_number": "API_TEST_01",
                            "floor": "1",
                            "section": "A",
                            "vehicle_type": "car"
                        }
                        
                        post_response = requests.post(admin_url, json=new_slot, headers=admin_headers)
                        print(f"Admin POST Status: {post_response.status_code}")
                        
                        if post_response.status_code == 201:
                            print("✅ Successfully created slot via API!")
                        elif post_response.status_code == 400:
                            print("ℹ️ Validation error (expected)")
                            error_data = post_response.json()
                            print(f"Validation errors: {error_data}")
                        else:
                            print(f"POST error: {post_response.text}")
                            
                    elif admin_response.status_code == 403:
                        print("❌ User doesn't have admin permissions")
                    else:
                        print(f"Admin GET error: {admin_response.text}")
                        
            except json.JSONDecodeError as e:
                print(f"❌ JSON decode error: {e}")
                print(f"Response text: {response.text[:200]}...")
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_login_with_proper_headers()