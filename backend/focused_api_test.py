#!/usr/bin/env python
"""
Focused API Test for Notification System
Tests user registration, login, and notification endpoints specifically
"""

import os
import sys
import django
import requests
import json

# Add the backend directory to the Python path
sys.path.append('c:/Users/nazmi/OneDrive/Desktop/car-parking-system/backend')

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Configuration
BASE_URL = "http://127.0.0.1:8000"
API_BASE = f"{BASE_URL}/api"

def test_auth_and_notifications():
    """Test authentication and notification endpoints"""
    
    print("=== 🔐 TESTING AUTHENTICATION ===")
    
    # Test user registration
    print("\n1️⃣ Testing User Registration...")
    register_data = {
        "username": "testuser123",
        "email": "testuser123@example.com", 
        "password": "TestPassword123!",
        "user_type": "customer"
    }
    
    try:
        response = requests.post(f"{API_BASE}/auth/register/", json=register_data)
        print(f"Registration Status: {response.status_code}")
        
        if response.status_code == 201:
            print("✅ Registration successful!")
            print(f"Response: {response.json()}")
        else:
            print(f"❌ Registration failed: {response.text}")
            # Try to continue with login anyway (user might already exist)
    except Exception as e:
        print(f"❌ Registration error: {e}")
    
    # Test user login
    print("\n2️⃣ Testing User Login...")
    login_data = {
        "email": "testuser123@example.com",
        "password": "TestPassword123!"
    }
    
    try:
        response = requests.post(f"{API_BASE}/auth/login/", json=login_data)
        print(f"Login Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Login successful!")
            user_data = response.json()
            access_token = user_data.get('access')
            print(f"Access token received: {access_token[:20]}...")
            
            if access_token:
                # Test notification endpoints
                test_notifications(access_token)
            else:
                print("❌ No access token in response")
        else:
            print(f"❌ Login failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Login error: {e}")

def test_notifications(token):
    """Test notification endpoints with authentication"""
    
    print("\n=== 🔔 TESTING NOTIFICATIONS ===")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Test getting notifications
    print("\n3️⃣ Testing Get Notifications...")
    try:
        response = requests.get(f"{API_BASE}/notifications/", headers=headers)
        print(f"Get Notifications Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Notifications retrieved successfully!")
            notifications = response.json()
            print(f"Number of notifications: {len(notifications)}")
            
            if notifications:
                print("Sample notification:")
                print(json.dumps(notifications[0], indent=2))
            else:
                print("No notifications found (this is normal for a new user)")
        else:
            print(f"❌ Get notifications failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Get notifications error: {e}")
    
    # Test system alert creation (admin only - will likely fail)
    print("\n4️⃣ Testing System Alert Creation (may fail if not admin)...")
    alert_data = {
        "title": "Test System Alert",
        "message": "This is a test system alert created via API",
        "alert_type": "general",
        "priority": "medium"
    }
    
    try:
        response = requests.post(f"{API_BASE}/admin/system-alert/", 
                               json=alert_data, headers=headers)
        print(f"System Alert Status: {response.status_code}")
        
        if response.status_code == 201:
            print("✅ System alert created successfully!")
            print(f"Response: {response.json()}")
        else:
            print(f"⚠️ System alert creation failed (expected for non-admin): {response.text}")
            
    except Exception as e:
        print(f"❌ System alert error: {e}")

def main():
    """Main test function"""
    print("🚀 Starting Focused Notification API Test")
    print(f"Testing against: {API_BASE}")
    
    # First check if server is running
    try:
        response = requests.get(BASE_URL, timeout=5)
        print(f"✅ Server is running (Status: {response.status_code})")
    except Exception as e:
        print(f"❌ Server connection failed: {e}")
        return
    
    # Run authentication and notification tests
    test_auth_and_notifications()
    
    print("\n🏁 Focused API Test Complete!")

if __name__ == "__main__":
    main()
