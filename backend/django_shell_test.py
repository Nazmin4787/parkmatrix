#!/usr/bin/env python
"""
Simple Django Management Command Test
"""

import subprocess
import sys

def run_django_command(command):
    """Run a Django management command"""
    manage_path = "c:/Users/nazmi/OneDrive/Desktop/car-parking-system/backend/manage.py"
    python_path = "C:/Users/nazmi/OneDrive/Desktop/car-parking-system/myenvv/Scripts/python.exe"
    
    try:
        result = subprocess.run([python_path, manage_path] + command.split(), 
                              capture_output=True, text=True, cwd="c:/Users/nazmi/OneDrive/Desktop/car-parking-system/backend")
        return result
    except Exception as e:
        print(f"Error running command: {e}")
        return None

def main():
    print("🚀 Testing Django Commands")
    
    # Test Django shell command to create user
    print("\n=== Creating User via Django Shell ===")
    
    shell_commands = """
from django.contrib.auth import get_user_model
from api.models import Notification
User = get_user_model()

# Check if user exists
email = "testuser123@example.com"
existing_user = User.objects.filter(email=email).first()

if existing_user:
    print(f"User already exists: {existing_user.username} ({existing_user.email})")
    user = existing_user
else:
    print(f"Creating new user with email: {email}")
    user = User.objects.create_user(
        username='testuser123',
        email=email,
        password='TestPassword123!',
        role='customer',
        is_email_verified=True
    )
    print(f"User created: {user.username} ({user.email})")

# Create a test notification
notification = Notification.objects.create(
    recipient=user,
    title="Test Notification from Shell",
    message="This notification was created via Django shell",
    notification_type="info",
    priority="medium"
)
print(f"Notification created: ID {notification.id}")

# Count notifications
count = Notification.objects.filter(recipient=user).count()
print(f"Total notifications for user: {count}")

print("SUCCESS: Django operations completed")
"""
    
    # Write shell commands to a temporary file
    with open("c:/Users/nazmi/OneDrive/Desktop/car-parking-system/backend/temp_shell_commands.py", "w") as f:
        f.write(shell_commands)
    
    # Run shell command with proper input
    manage_path = "c:/Users/nazmi/OneDrive/Desktop/car-parking-system/backend/manage.py"
    python_path = "C:/Users/nazmi/OneDrive/Desktop/car-parking-system/myenvv/Scripts/python.exe"
    
    try:
        with open("c:/Users/nazmi/OneDrive/Desktop/car-parking-system/backend/temp_shell_commands.py", "r") as f:
            commands = f.read()
        
        result = subprocess.run([python_path, manage_path, "shell"], 
                              input=commands, text=True, capture_output=True,
                              cwd="c:/Users/nazmi/OneDrive/Desktop/car-parking-system/backend")
    except Exception as e:
        print(f"Error: {e}")
        result = None
    
    if result:
        print("STDOUT:")
        print(result.stdout)
        if result.stderr:
            print("STDERR:")
            print(result.stderr)
        print(f"Return Code: {result.returncode}")
    
    print("\n🏁 Django Command Test Complete!")

if __name__ == "__main__":
    main()
