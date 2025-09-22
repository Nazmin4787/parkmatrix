#!/usr/bin/env python
"""
Direct Django Test for User Creation and Notification Testing
"""

import os
import sys
import django
import json

# Add the backend directory to the Python path
sys.path.append('c:/Users/nazmi/OneDrive/Desktop/car-parking-system/backend')

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.models import Notification

User = get_user_model()

def test_user_creation():
    """Test creating a user directly via Django"""
    
    print("=== 🔧 DIRECT DJANGO USER CREATION TEST ===")
    
    # Check if user already exists
    email = "testuser123@example.com"
    existing_user = User.objects.filter(email=email).first()
    
    if existing_user:
        print(f"✅ User already exists: {existing_user.username} ({existing_user.email})")
        user = existing_user
    else:
        print(f"Creating new user with email: {email}")
        
        try:
            # Create user directly
            user = User.objects.create_user(
                username='testuser123',
                email=email,
                password='TestPassword123!',
                role='customer',
                is_email_verified=True  # Skip email verification for testing
            )
            print(f"✅ User created successfully: {user.username} ({user.email})")
        except Exception as e:
            print(f"❌ User creation failed: {e}")
            return None
    
    return user

def test_notifications_direct(user):
    """Test notification creation directly via Django"""
    
    print("\n=== 🔔 DIRECT DJANGO NOTIFICATION TEST ===")
    
    try:
        # Create a test notification
        notification = Notification.objects.create(
            recipient=user,
            title="Test Notification",
            message="This is a test notification created directly via Django",
            notification_type="info",
            priority="medium"
        )
        print(f"✅ Notification created: ID {notification.id}")
        
        # Get all notifications for user
        notifications = Notification.objects.filter(recipient=user)
        print(f"📊 Total notifications for user: {notifications.count()}")
        
        for notif in notifications:
            print(f"  - ID {notif.id}: {notif.title} | {notif.notification_type} | Read: {notif.is_read}")
            
        return True
        
    except Exception as e:
        print(f"❌ Notification test failed: {e}")
        return False

def test_notification_api_direct():
    """Test notification API using Django test client"""
    
    print("\n=== 🌐 DJANGO TEST CLIENT API TEST ===")
    
    from django.test import Client
    from django.contrib.auth import authenticate
    from rest_framework_simplejwt.tokens import RefreshToken
    
    client = Client()
    
    # Get or create user
    user = test_user_creation()
    if not user:
        print("❌ Cannot proceed without user")
        return
    
    try:
        # Generate JWT token
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        print(f"✅ JWT token generated: {access_token[:20]}...")
        
        # Test notifications API endpoint
        response = client.get('/api/notifications/', 
                            HTTP_AUTHORIZATION=f'Bearer {access_token}',
                            content_type='application/json')
        
        print(f"📡 API Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API call successful! Found {len(data)} notifications")
            
            if data:
                print("Sample notification:")
                print(json.dumps(data[0], indent=2))
            else:
                print("No notifications found (normal for new user)")
                
        else:
            print(f"❌ API call failed: {response.content.decode()}")
            
    except Exception as e:
        print(f"❌ API test error: {e}")

def main():
    """Main test function"""
    print("🚀 Starting Direct Django Notification Test")
    
    # Test user creation
    user = test_user_creation()
    
    if user:
        # Test notification creation
        test_notifications_direct(user)
        
        # Test API via Django test client
        test_notification_api_direct()
    
    print("\n🏁 Direct Django Test Complete!")

if __name__ == "__main__":
    main()
