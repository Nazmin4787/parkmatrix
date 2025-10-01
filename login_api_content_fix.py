"""
Fix for the login API content negotiation issue.
Run this script to test the fix for the login API.
"""
import requests
import json
import os

BASE_URL = "http://127.0.0.1:8000"

def test_login_with_content_type():
    """Test the login API with explicit content negotiation headers"""
    url = f"{BASE_URL}/api/auth/login/"
    
    # Test with default admin credentials
    credentials = {"email": "admin@example.com", "password": "admin123"}
    
    # Different combinations of headers to test
    header_combinations = [
        {
            'Content-Type': 'application/json', 
            'Accept': 'application/json'
        },
        {
            'Content-Type': 'application/json', 
            'Accept': '*/*',
            'X-Requested-With': 'XMLHttpRequest'  # Simulate AJAX request
        },
        {
            'Content-Type': 'application/json; charset=utf-8',
            'Accept': 'application/json; charset=utf-8'
        }
    ]
    
    print("\n===== TESTING LOGIN API WITH CONTENT NEGOTIATION =====\n")
    
    for headers in header_combinations:
        print(f"Testing with headers: {json.dumps(headers, indent=2)}")
        
        try:
            response = requests.post(
                url, 
                headers=headers, 
                data=json.dumps(credentials),
                timeout=10
            )
            
            print(f"Status: {response.status_code}")
            print(f"Content-Type: {response.headers.get('Content-Type', 'Not specified')}")
            
            if response.status_code == 200:
                try:
                    response_data = response.json()
                    print(f"Response contains token: {'access' in response_data}")
                    if 'access' in response_data:
                        print(f"✅ Success! Token: {response_data['access'][:20]}...")
                        return response_data['access']  # Return the token for further use
                    else:
                        print("❌ No access token in response")
                except json.JSONDecodeError:
                    print(f"❌ Response is not valid JSON: {response.text[:100]}...")
            else:
                print(f"❌ Failed with status code: {response.status_code}")
                print(f"Response: {response.text[:100]}...")
                
        except Exception as e:
            print(f"❌ Exception: {str(e)}")
        
        print("-" * 60)
    
    return None

def test_notifications_with_token(token):
    """Test notification endpoints with the provided token"""
    if not token:
        print("❌ No token available. Cannot test notification endpoints.")
        return
        
    url = f"{BASE_URL}/api/notifications/"
    headers = {
        'Authorization': f'Bearer {token}',
        'Accept': 'application/json'
    }
    
    print("\n===== TESTING NOTIFICATIONS WITH TOKEN =====\n")
    
    try:
        response = requests.get(url, headers=headers)
        
        print(f"Status: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type', 'Not specified')}")
        
        if response.status_code == 200:
            try:
                notifications = response.json()
                print(f"✅ Success! Retrieved {len(notifications)} notifications.")
            except json.JSONDecodeError:
                print(f"❌ Response is not valid JSON: {response.text[:100]}...")
        else:
            print(f"❌ Failed with status code: {response.status_code}")
            print(f"Response: {response.text[:200]}...")
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")

def generate_fix_file():
    """Generate a fix Python file that can be applied to the backend"""
    fix_content = """
# Login API Content Negotiation Fix
# Apply this fix to the backend/api/views.py file

from rest_framework import status
from rest_framework.response import Response
from functools import wraps
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

# This decorator ensures proper content negotiation for authentication endpoints
def ensure_json_response(view_func):
    @wraps(view_func)
    def wrapper(self, request, *args, **kwargs):
        response = view_func(self, request, *args, **kwargs)
        
        # Force JSON content type
        if hasattr(response, 'content_type'):
            response.content_type = 'application/json; charset=utf-8'
        if hasattr(response, 'accepted_media_type'):
            response.accepted_media_type = 'application/json; charset=utf-8'
        if hasattr(response, 'headers'):
            response.headers['Content-Type'] = 'application/json; charset=utf-8'
        
        return response
    return wrapper

# Modify the LoginView class like this:
'''
@method_decorator(csrf_exempt)
class LoginView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer
    
    @ensure_json_response
    def post(self, request, *args, **kwargs):
        # Existing login code...
        
        # When returning the response:
        return Response(
            {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, 
            status=status.HTTP_200_OK,
            content_type='application/json; charset=utf-8'
        )
'''

# Also modify the TokenRefreshView class:
'''
@method_decorator(csrf_exempt)
class TokenRefreshView(APIView):
    permission_classes = [permissions.AllowAny]
    
    @ensure_json_response
    def post(self, request):
        # Existing code...
        
        # When returning the response:
        return Response(
            {
                'access': str(access_token),
            }, 
            status=status.HTTP_200_OK,
            content_type='application/json; charset=utf-8'
        )
'''
"""
    
    # Create the fix file
    fix_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "login_api_fix.py")
    with open(fix_file_path, "w") as f:
        f.write(fix_content)
    
    print(f"\n✅ Fix file generated: {fix_file_path}")
    print("Apply these changes to fix the content negotiation issues in the login API.")

if __name__ == "__main__":
    # First test the login API
    token = test_login_with_content_type()
    
    # Then test notifications with the token if available
    if token:
        test_notifications_with_token(token)
    
    # Generate a fix file
    generate_fix_file()