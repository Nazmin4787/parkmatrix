"""
Make specified users admin
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import User

print("\n" + "="*60)
print("MAKING USERS ADMIN")
print("="*60)

# List of emails to make admin
emails_to_make_admin = [
    'admin1@example.com',
    'naaz@example.com',
    'admin3@example.com',
    'admin4@example.com',
    'admin_1755616987918@example.com'
]

print("\n📝 Making the following users admin:")
for email in emails_to_make_admin:
    try:
        user = User.objects.get(email=email)
        user.is_staff = True
        user.save()
        print(f"   ✅ {user.username} ({email}) - NOW ADMIN")
    except User.DoesNotExist:
        print(f"   ❌ {email} - NOT FOUND")

print("\n" + "="*60)
print("✅ DONE! Admin users updated.")
print("="*60)

# Show updated admin count
admin_count = User.objects.filter(is_staff=True).count()
print(f"\nTotal admin users now: {admin_count}")

print("\n🔄 IMPORTANT: Users must LOGOUT and LOGIN again for changes to take effect!")
print("   (JWT tokens need to be refreshed with new role)\n")
