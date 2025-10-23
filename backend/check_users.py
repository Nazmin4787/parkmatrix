import os
import django
import sys

sys.path.insert(0, r'c:\Projects\parking-system\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import User

print("\n" + "="*80)
print("USER ACCOUNTS")
print("="*80 + "\n")

users = User.objects.all()

for user in users:
    print(f"Username: {user.username}")
    print(f"Email: {user.email}")
    print(f"Role: {user.role}")
    print(f"Is Active: {user.is_active}")
    print(f"Is Staff: {user.is_staff}")
    print(f"Is Superuser: {user.is_superuser}")
    print("-" * 80 + "\n")

# Check admin users
admins = User.objects.filter(role='admin')
print(f"Total Admin Users: {admins.count()}")
if admins.exists():
    print("\nAdmin Users:")
    for admin in admins:
        print(f"  - {admin.username} ({admin.email})")

# Check security users
security = User.objects.filter(role='security')
print(f"\nTotal Security Users: {security.count()}")
if security.exists():
    print("\nSecurity Users:")
    for sec in security:
        print(f"  - {sec.username} ({sec.email})")

print("\n" + "="*80)
