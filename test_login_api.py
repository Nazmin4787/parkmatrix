"""
Test script for just the login API endpoint.
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_login():
    """Test the login API endpoint"""
    url = f"{BASE_URL}/api/auth/login/"
    headers = {'Content-Type': 'application/json'}
    
    # Test different credentials
    test_cases = [
        {"email": "admin@example.com", "password": "admin123"},
        {"email": "test@example.com", "password": "password123"},
        {"email": "user@example.com", "password": "userpass"}
    ]
    
    print("\n===== TESTING LOGIN API =====\n")
    
    for data in test_cases:
        print(f"Trying to login with {data['email']}...")
        
        try:
            response = requests.post(url, headers=headers, data=json.dumps(data))
            
            print(f"Status: {response.status_code}")
            print(f"Content-Type: {response.headers.get('Content-Type', 'Not specified')}")
            
            if response.status_code == 200:
                try:
                    response_data = response.json()
                    print(f"Login successful! Response: {json.dumps(response_data, indent=2)}")
                    if 'access' in response_data:
                        print(f"✅ Found access token: {response_data['access'][:20]}...")
                    else:
                        print("❌ No access token found in response")
                except json.JSONDecodeError:
                    print(f"❌ Response is not valid JSON: {response.text[:100]}...")
            else:
                print(f"Failed with status code: {response.status_code}")
                print(f"Response: {response.text[:200]}...")
                
        except Exception as e:
            print(f"Exception: {str(e)}")
        
        print("-" * 60)

if __name__ == "__main__":
    test_login()