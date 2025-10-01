"""
Improved test script for notification endpoints.
This script focuses specifically on the public notification API endpoint that doesn't require authentication.
"""
import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def test_public_notification_endpoint():
    """Test the public notification endpoint that doesn't require authentication"""
    url = f"{BASE_URL}/api/notifications/unread_count/"
    
    # Test with different accept headers to ensure compatibility
    headers_list = [
        {'Accept': '*/*'}, 
        {'Accept': 'application/json'},
        {'Accept': 'application/json, text/plain, */*'}, 
        {'Accept': 'text/html'},
        {}  # No Accept header
    ]
    
    print("\n===== TESTING PUBLIC NOTIFICATION ENDPOINT =====\n")
    
    all_success = True
    for headers in headers_list:
        accept_header = headers.get('Accept', 'No Accept header')
        print(f"Testing with Accept: '{accept_header}'")
        
        try:
            response = requests.get(url, headers=headers)
            print(f"  Status: {response.status_code}")
            print(f"  Content-Type: {response.headers.get('Content-Type', 'Not specified')}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"  Response: {data}")
                print("  ✅ Success!")
            else:
                print(f"  Response: {response.text}")
                print("  ❌ Failed!")
                all_success = False
                
        except Exception as e:
            print(f"  Exception: {e}")
            print("  ❌ Failed!")
            all_success = False
            
        print("-" * 60)
    
    return all_success

def main():
    """Run all tests"""
    if test_public_notification_endpoint():
        print("\n✅ All public notification tests PASSED!")
    else:
        print("\n❌ Some public notification tests FAILED!")

if __name__ == "__main__":
    main()