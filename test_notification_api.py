"""
Test script to verify notification endpoints.
Run this script to test the notification API endpoints.
"""
import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"
TOKEN = None  # Will be set after login

def login():
    """Login to get authentication token"""
    url = f"{BASE_URL}/api/auth/login/"
    headers = {'Content-Type': 'application/json'}
    # Using default admin credentials
    data = {
        "email": "admin@example.com", 
        "password": "admin123"
    }
    
    print(f"Attempting login with {data['email']}...")
    response = requests.post(url, headers=headers, data=json.dumps(data))
    
    if response.status_code == 200:
        global TOKEN
        TOKEN = response.json()['access']
        print(f"Login successful! Token received.")
        return True
    else:
        print(f"Login failed with status code {response.status_code}")
        print(f"Response: {response.text}")
        return False

def get_notifications():
    """Get all notifications"""
    url = f"{BASE_URL}/api/notifications/"
    headers = {'Authorization': f'Bearer {TOKEN}'}
    
    print("Fetching notifications...")
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        notifications = response.json()
        print(f"Fetched {len(notifications)} notifications successfully!")
        return notifications
    else:
        print(f"Failed to fetch notifications: {response.status_code}")
        print(f"Response: {response.text}")
        return []

def get_unread_count():
    """Get unread notification count"""
    url = f"{BASE_URL}/api/notifications/unread_count/"
    headers = {'Authorization': f'Bearer {TOKEN}'}
    
    print("Checking unread count...")
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        count = response.json()['unread_count']
        print(f"Unread notifications count: {count}")
        return count
    else:
        print(f"Failed to get unread count: {response.status_code}")
        print(f"Response: {response.text}")
        return -1

def mark_notification_as_read(notification_id):
    """Mark a notification as read"""
    url = f"{BASE_URL}/api/notifications/{notification_id}/read/"
    headers = {'Authorization': f'Bearer {TOKEN}'}
    
    print(f"Marking notification {notification_id} as read...")
    response = requests.post(url, headers=headers)
    
    if response.status_code in (200, 204):
        print(f"Successfully marked notification {notification_id} as read!")
        return True
    else:
        print(f"Failed to mark notification as read: {response.status_code}")
        print(f"Response: {response.text}")
        return False

def mark_all_as_read():
    """Mark all notifications as read"""
    url = f"{BASE_URL}/api/notifications/mark_all_as_read/"
    headers = {'Authorization': f'Bearer {TOKEN}'}
    
    print("Marking all notifications as read...")
    response = requests.post(url, headers=headers)
    
    if response.status_code in (200, 204):
        print("Successfully marked all notifications as read!")
        return True
    else:
        print(f"Failed to mark all as read: {response.status_code}")
        print(f"Response: {response.text}")
        return False

def delete_notification(notification_id):
    """Delete a notification"""
    url = f"{BASE_URL}/api/notifications/{notification_id}/delete/"
    headers = {'Authorization': f'Bearer {TOKEN}'}
    
    print(f"Deleting notification {notification_id}...")
    response = requests.delete(url, headers=headers)
    
    if response.status_code in (200, 204):
        print(f"Successfully deleted notification {notification_id}!")
        return True
    else:
        print(f"Failed to delete notification: {response.status_code}")
        print(f"Response: {response.text}")
        return False

def run_tests():
    """Run all API tests"""
    # Login first to get token
    if not login():
        print("Cannot continue tests without authentication.")
        return
    
    # Wait for token to be properly processed
    time.sleep(1)
    
    # Get initial notifications and unread count
    notifications = get_notifications()
    unread_count = get_unread_count()
    
    if not notifications:
        print("No notifications found to test with.")
        return
    
    # Test marking a notification as read
    if unread_count > 0:
        # Find an unread notification
        unread = next((n for n in notifications if not n['is_read']), None)
        if unread:
            mark_notification_as_read(unread['id'])
            # Verify unread count decreased
            new_unread_count = get_unread_count()
            print(f"Unread count before: {unread_count}, after: {new_unread_count}")
    
    # Test marking all as read
    mark_all_as_read()
    new_unread_count = get_unread_count()
    if new_unread_count == 0:
        print("All notifications marked as read successfully!")
    
    # Test deleting a notification if any exist
    if notifications:
        delete_notification(notifications[0]['id'])
        # Verify notification was deleted
        new_notifications = get_notifications()
        if len(new_notifications) < len(notifications):
            print("Notification deleted successfully!")
        else:
            print("Notification deletion may have failed.")
    
    print("\nAPI tests completed!")

if __name__ == "__main__":
    run_tests()