from api.models import Booking, User
from django.contrib.auth import get_user_model

User = get_user_model()

# Get all users
print("==== ALL USERS ====")
all_users = User.objects.all()
print(f"Total users: {all_users.count()}")
for i, user in enumerate(all_users[:10]):
    print(f"{i+1}. {user.username} (ID: {user.id})")

# Get all bookings
print("\n==== ALL BOOKINGS ====")
all_bookings = Booking.objects.all()
print(f"Total bookings: {all_bookings.count()}")
for i, booking in enumerate(all_bookings[:10]):
    print(f"{i+1}. Booking {booking.id}: User {booking.user.username} (ID: {booking.user.id}), Active: {booking.is_active}")

# Check for a specific user by username
username = input("\nEnter username to check (or press Enter to skip): ")
if username:
    try:
        user = User.objects.get(username=username)
        print(f"\nFound user: {user.username}, ID: {user.id}")
        
        user_bookings = Booking.objects.filter(user=user)
        print(f"Found {user_bookings.count()} bookings for user {username}")
        for booking in user_bookings:
            print(f"- Booking {booking.id}: Slot {booking.slot}, Active: {booking.is_active}")
    except User.DoesNotExist:
        print(f"No user found with username: {username}")

# Check for a specific user by ID
user_id = input("\nEnter user ID to check (or press Enter to skip): ")
if user_id:
    try:
        user = User.objects.get(id=user_id)
        print(f"\nFound user: {user.username}, ID: {user.id}")
        
        user_bookings = Booking.objects.filter(user=user)
        print(f"Found {user_bookings.count()} bookings for user {user.username}")
        for booking in user_bookings:
            print(f"- Booking {booking.id}: Slot {booking.slot}, Active: {booking.is_active}")
    except User.DoesNotExist:
        print(f"No user found with ID: {user_id}")