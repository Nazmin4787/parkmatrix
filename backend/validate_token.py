import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from api.models import User

# Test token validation
print("=" * 60)
print("JWT TOKEN VALIDATION TEST")
print("=" * 60)

# You need to paste the actual token from the browser localStorage here
# For now, let's just show how to validate
print("\nTo check your token:")
print("1. Open browser DevTools (F12)")
print("2. Go to Application > Local Storage > http://localhost:5173")
print("3. Find 'access_token' and copy its value")
print("4. Replace YOUR_TOKEN_HERE below with the actual token")
print("\nThen run this script again.\n")

# Example token validation (replace with real token)
test_token = "YOUR_TOKEN_HERE"

if test_token != "YOUR_TOKEN_HERE":
    try:
        # Decode the token
        access_token = AccessToken(test_token)
        user_id = access_token['user_id']
        
        # Get user
        user = User.objects.get(id=user_id)
        
        print(f"\n✅ Token is VALID")
        print(f"User ID: {user_id}")
        print(f"Username: {user.username}")
        print(f"Role: {user.role}")
        print(f"Email: {user.email}")
        
        # Check if role matches what's needed
        if user.role in ['admin', 'security']:
            print(f"\n✅ User has correct role for admin check-in endpoints")
        else:
            print(f"\n❌ User role '{user.role}' is NOT allowed for admin check-in")
            print(f"   Required roles: 'admin' or 'security'")
            
    except (InvalidToken, TokenError) as e:
        print(f"\n❌ Token is INVALID or EXPIRED")
        print(f"Error: {e}")
    except User.DoesNotExist:
        print(f"\n❌ User with ID {user_id} does not exist")
else:
    print("❌ Please provide an actual token to validate")

print("\n" + "=" * 60)
print("All admin/security users available for login:")
print("=" * 60)
admin_users = User.objects.filter(role__in=['admin', 'security'])
for user in admin_users:
    print(f"\nUsername: {user.username:<20} | Email: {user.email:<30} | Role: {user.role}")
