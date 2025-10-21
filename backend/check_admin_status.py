"""
Quick script to check user admin status and optionally make them admin
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import User

print("\n" + "="*60)
print("USER ADMIN STATUS CHECKER")
print("="*60)

# Show all users with their admin status
print("\n📋 All Users:")
print(f"{'ID':<5} {'Username':<20} {'Email':<30} {'Admin':<10}")
print("-" * 70)

for user in User.objects.all().order_by('username'):
    admin_status = "✅ YES" if user.is_staff else "❌ NO"
    print(f"{user.id:<5} {user.username:<20} {user.email:<30} {admin_status:<10}")

print("\n" + "="*60)
print(f"Total: {User.objects.count()} users")
print(f"Admins: {User.objects.filter(is_staff=True).count()} users")
print(f"Regular: {User.objects.filter(is_staff=False).count()} users")
print("="*60)

# Prompt to make user admin
print("\n💡 To make a user admin:")
print("   1. Note the user's email from the list above")
print("   2. Run: python make_user_admin.py")
print("\n")
