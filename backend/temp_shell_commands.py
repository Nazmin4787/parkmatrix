
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
