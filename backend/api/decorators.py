from functools import wraps
from rest_framework import status
from rest_framework.response import Response
from django.conf import settings
from rest_framework import authentication

def accept_any_content_type(view_func):
    """
    Decorator to ensure an endpoint accepts any content type.
    This specifically addresses the 406 Not Acceptable issue.
    """
    @wraps(view_func)
    def wrapper(self, request, *args, **kwargs):
        # Force content_type to be flexible
        response = view_func(self, request, *args, **kwargs)
        if hasattr(response, 'content_type'):
            response.content_type = 'application/json; charset=utf-8'
        if hasattr(response, 'headers'):
            response.headers['Content-Type'] = 'application/json; charset=utf-8'
            response.headers['Accept'] = '*/*'
        return response
    return wrapper

def public_endpoint(view_func):
    """
    Decorator to make an endpoint public (no authentication required).
    """
    @wraps(view_func)
    def wrapper(self, request, *args, **kwargs):
        # Save original authentication classes
        original_auth = self.authentication_classes
        original_perm = self.permission_classes
        
        # Remove authentication for this request only
        self.authentication_classes = []
        self.permission_classes = []
        
        try:
            response = view_func(self, request, *args, **kwargs)
            return response
        finally:
            # Restore original authentication classes
            self.authentication_classes = original_auth
            self.permission_classes = original_perm
            
    return wrapper