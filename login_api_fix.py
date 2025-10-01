
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
