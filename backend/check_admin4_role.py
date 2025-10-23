import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import User

# Check admin4 user
try:
    admin4 = User.objects.get(username='admin4')
    print(f"Username: {admin4.username}")
    print(f"Email: {admin4.email}")
    print(f"Role: {admin4.role}")
    print(f"Is active: {admin4.is_active}")
    print(f"Is staff: {admin4.is_staff}")
    print(f"Is superuser: {admin4.is_superuser}")
except User.DoesNotExist:
    print("admin4 user not found")

print("\n" + "="*50)
print("All users with admin or security role:")
print("="*50)

admin_users = User.objects.filter(role__in=['admin', 'security'])
for user in admin_users:
    print(f"\nUsername: {user.username}")
    print(f"Email: {user.email}")
    print(f"Role: {user.role}")
    print(f"Active: {user.is_active}")
