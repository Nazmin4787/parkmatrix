import requests
import json

# Simple test script for notification endpoints
BASE_URL = 'http://127.0.0.1:8000/api'

print("🔍 Testing Notification API Endpoints")
print("=" * 50)

# Test 1: Try to access notifications without authentication (should fail with 401)
print("1️⃣  Testing GET /api/notifications/ without auth (should fail)...")
try:
    response = requests.get(f"{BASE_URL}/notifications/")
    print(f"   Status: {response.status_code}")
    if response.status_code == 401:
        print("   ✅ PASS - Correctly requires authentication")
    else:
        print("   ❌ FAIL - Should require authentication")
        print(f"   Response: {response.text}")
except Exception as e:
    print(f"   ❌ ERROR: {str(e)}")

print()

# Test 2: Try to register a user (to check if we can create test data)
print("2️⃣  Testing user registration...")
test_user = {
    'email': 'notiftest@example.com',
    'password': 'testpass123',
    'username': 'notiftest'
}

try:
    response = requests.post(f"{BASE_URL}/auth/register/", json=test_user)
    print(f"   Status: {response.status_code}")
    if response.status_code == 201:
        print("   ✅ PASS - User registered successfully")
        user_data = response.json()
        access_token = user_data.get('access')
        
        if access_token:
            print(f"   Got access token: {access_token[:20]}...")
            
            # Test 3: Now test notifications with valid auth
            print()
            print("3️⃣  Testing GET /api/notifications/ with auth...")
            headers = {'Authorization': f'Bearer {access_token}'}
            
            try:
                response = requests.get(f"{BASE_URL}/notifications/", headers=headers)
                print(f"   Status: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    print(f"   ✅ PASS - Got {len(data)} notifications")
                    if len(data) > 0:
                        print(f"   Sample notification: {data[0].get('title', 'No title')}")
                else:
                    print(f"   ❌ FAIL - Status: {response.status_code}")
                    print(f"   Response: {response.text}")
            except Exception as e:
                print(f"   ❌ ERROR: {str(e)}")
                
        else:
            print("   ⚠️  WARNING - No access token in response")
            
    elif response.status_code == 400:
        print("   ⚠️  WARNING - User might already exist (400)")
        response_data = response.json()
        print(f"   Response: {response_data}")
        
        # Try to login with existing user
        print()
        print("3️⃣  Trying to login with existing user...")
        login_data = {'email': test_user['email'], 'password': test_user['password']}
        
        try:
            response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                user_data = response.json()
                access_token = user_data.get('access')
                print(f"   ✅ PASS - Login successful, got token: {access_token[:20]}...")
                
                # Test notifications with this token
                print()
                print("4️⃣  Testing GET /api/notifications/ with login token...")
                headers = {'Authorization': f'Bearer {access_token}'}
                
                try:
                    response = requests.get(f"{BASE_URL}/notifications/", headers=headers)
                    print(f"   Status: {response.status_code}")
                    if response.status_code == 200:
                        data = response.json()
                        print(f"   ✅ PASS - Got {len(data)} notifications")
                    else:
                        print(f"   ❌ FAIL - Status: {response.status_code}")
                        print(f"   Response: {response.text}")
                except Exception as e:
                    print(f"   ❌ ERROR: {str(e)}")
            else:
                print(f"   ❌ FAIL - Login failed: {response.text}")
        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
    else:
        print(f"   ❌ FAIL - Registration failed")
        print(f"   Response: {response.text}")
except Exception as e:
    print(f"   ❌ ERROR: {str(e)}")

print()
print("=" * 50)
print("🏁 Basic Notification API Test Complete!")
