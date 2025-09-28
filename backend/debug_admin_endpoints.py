#!/usr/bin/env python
"""
Debug script to test the specific POST request that's failing
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def test_post_slots():
    """Test POST request to admin/slots/ endpoint"""
    print("🔍 Testing POST request to admin/slots/...")
    
    url = f"{BASE_URL}/admin/slots/"
    data = {
        "slot_number": "TEST01",
        "floor": "1",
        "section": "A",
        "vehicle_type": "car",
        "parking_lot": 1  # Assuming parking lot with ID 1 exists
    }
    
    try:
        # Test without authentication first
        response = requests.post(url, json=data)
        print(f"Status Code (no auth): {response.status_code}")
        print(f"Response: {response.text[:500]}...")
        
        if response.status_code == 401:
            print("✅ 401 is expected - authentication required")
        elif response.status_code == 500:
            print("❌ 500 Internal Server Error - this is the issue we need to fix")
            print("Error details:", response.text)
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure Django server is running.")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_cors_preflight():
    """Test CORS preflight request"""
    print("\n🔍 Testing CORS preflight request...")
    
    url = f"{BASE_URL}/admin/slots/"
    headers = {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
    }
    
    try:
        response = requests.options(url, headers=headers)
        print(f"OPTIONS Status Code: {response.status_code}")
        print(f"CORS Headers: {dict(response.headers)}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

def test_simple_get():
    """Test simple GET request to ensure server is working"""
    print("\n🔍 Testing simple GET request...")
    
    url = f"{BASE_URL}/"
    try:
        response = requests.get(url)
        print(f"API Root Status Code: {response.status_code}")
        if response.status_code == 200:
            print("✅ Basic API access is working")
        else:
            print(f"Response: {response.text[:200]}...")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    print("🐛 Debugging Admin Slots POST Request")
    print("=" * 50)
    
    test_simple_get()
    test_cors_preflight()
    test_post_slots()
    
    print("\n" + "=" * 50)
    print("Debug completed!")

if __name__ == "__main__":
    main()