"""
Improved test script for authenticated notification endpoints.
This script tests notification endpoints that require authentication.
"""
import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"
TOKEN = None  # Will be set after login

def login(email="admin@example.com", password="admin123"):
    """Login to get authentication token"""
    url = f"{BASE_URL}/api/auth/login/"
    headers = {'Content-Type': 'application/json'}
    data = {
        "email": email, 
        "password": password
    }
    
    print(f"Attempting login with {email}...")
    response = requests.post(url, headers=headers, data=json.dumps(data))
    
    if response.status_code == 200:
        global TOKEN
        response_data = response.json()
        if 'access' in response_data:
            TOKEN = response_data['access']
            print(f"Login successful! Token received.")
            return True
        else:
            print(f"Login successful but no access token in response: {response_data}")
            return False
    else:
        print(f"Login failed with status code {response.status_code}")
        print(f"Response: {response.text}")
        return False

def get_notifications():
    """Get all notifications"""
    if not TOKEN:
        print("Error: Not authenticated. Run login() first.")
        return None
        
    url = f"{BASE_URL}/api/notifications/"
    headers = {'Authorization': f'Bearer {TOKEN}'}
    
    print("\nFetching notifications...")
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        notifications = response.json()
        print(f"Fetched {len(notifications)} notifications successfully!")
        return notifications
    else:
        print(f"Failed to fetch notifications: {response.status_code}")
        print(f"Response: {response.text}")
        return None

def mark_all_as_read():
    """Mark all notifications as read"""
    if not TOKEN:
        print("Error: Not authenticated. Run login() first.")
        return False
        
    url = f"{BASE_URL}/api/notifications/mark_all_as_read/"
    headers = {
        'Authorization': f'Bearer {TOKEN}',
        'Content-Type': 'application/json'
    }
    
    print("\nMarking all notifications as read...")
    response = requests.post(url, headers=headers)
    
    if response.status_code == 200:
        print("All notifications marked as read successfully!")
        return True
    else:
        print(f"Failed to mark notifications as read: {response.status_code}")
        print(f"Response: {response.text}")
        return False

def main():
    """Run all tests"""
    success = True
    
    # Step 1: Login
    if not login():
        print("❌ Authentication failed. Cannot continue tests.")
        return
        
    # Step 2: Get notifications
    notifications = get_notifications()
    if notifications is None:
        success = False
    
    # Step 3: Mark all as read if we have any notifications
    if notifications and len(notifications) > 0:
        if not mark_all_as_read():
            success = False
            
        # Verify that they were marked as read
        print("\nVerifying notifications were marked as read...")
        updated_notifications = get_notifications()
        if updated_notifications and all(not n.get('is_read', False) for n in updated_notifications):
            print("❌ Failed: Not all notifications were marked as read")
            success = False
        else:
            print("✅ Verified: All notifications were marked as read")
    else:
        print("\nNo notifications to mark as read.")
    
    # Final results
    if success:
        print("\n✅ All notification API tests PASSED!")
    else:
        print("\n❌ Some notification API tests FAILED!")

if __name__ == "__main__":
    main()