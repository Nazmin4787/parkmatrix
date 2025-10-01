"""
Simple notification API fix

This script demonstrates how to fix and use the notification API correctly.
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def get_unread_count():
    """
    Get the unread notification count from the public endpoint.
    This endpoint works without authentication.
    """
    url = f"{BASE_URL}/api/notifications/unread_count/"
    
    # Different accept headers that should all work
    test_cases = [
        {'Accept': '*/*'}, 
        {'Accept': 'application/json'},
        {'Accept': 'application/json, text/plain, */*'}, 
        {'Accept': 'text/html'},
        {}  # No Accept header
    ]
    
    print("\n===== TESTING NOTIFICATION COUNT ENDPOINT =====\n")
    
    all_passed = True
    for headers in test_cases:
        accept_header = headers.get('Accept', 'No Accept header')
        print(f"Testing with Accept: '{accept_header}'")
        
        try:
            response = requests.get(url, headers=headers)
            
            print(f"Status: {response.status_code}")
            print(f"Content-Type: {response.headers.get('Content-Type', 'Not specified')}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    print(f"Response: {data}")
                    print("✅ Success!")
                except json.JSONDecodeError:
                    print(f"❌ Response is not valid JSON: {response.text[:100]}...")
                    all_passed = False
            else:
                print(f"❌ Failed with status code: {response.status_code}")
                all_passed = False
        except Exception as e:
            print(f"❌ Exception: {e}")
            all_passed = False
        
        print("-" * 60)
    
    if all_passed:
        print("✅ All notification count tests PASSED!")
    else:
        print("❌ Some notification count tests FAILED!")
    
    return all_passed

if __name__ == "__main__":
    get_unread_count()