# Notification System Fix Implementation Plan

## Overview

This document outlines a step-by-step plan to fix the content negotiation issues in the notification and authentication system of the parking application.

## Prerequisites

1. Ensure Django server is running
2. Make backup copies of files that will be modified
3. Have the test scripts ready for verification after each step

## Step 1: Fix Content Negotiation Decorator

**File: `api/decorators.py`**

Enhance the existing `accept_any_content_type` decorator:

```python
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
        if hasattr(response, 'accepted_media_type'):
            response.accepted_media_type = 'application/json; charset=utf-8'
        return response
    return wrapper
```

## Step 2: Add JSON Response Decorator

**File: `api/decorators.py`**

Add a new decorator for ensuring JSON responses:

```python
def ensure_json_response(view_func):
    """
    Decorator to ensure a view function always returns a JSON response.
    """
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
```

## Step 3: Fix Login View

**File: `api/views.py`**

Modify the `LoginView` class:

```python
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
```

## Step 4: Fix Token Refresh View

**File: `api/views.py`**

Modify the `TokenRefreshView` class:

```python
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
```

## Step 5: Fix Error Handling

**File: `api/views.py`**

For all authentication-related views, update error responses:

```python
# Instead of:
return Response({
    'error': 'Invalid credentials'
}, status=status.HTTP_401_UNAUTHORIZED)

# Use:
return Response({
    'error': 'Invalid credentials'
}, status=status.HTTP_401_UNAUTHORIZED, content_type='application/json; charset=utf-8')
```

## Step 6: Verify Fixes

Run the test scripts to verify all fixes work correctly:

1. Run `python simple_notification_fix.py` to verify public endpoints
2. Run `python login_api_content_fix.py` to verify login API
3. Run `python test_auth_notifications.py` to verify authenticated endpoints

## Step 7: Additional Testing

Test with different clients:

1. Test with a web browser to verify HTML responses
2. Test with Postman/curl to verify API responses
3. Test with the frontend application to verify integration

## Troubleshooting

If issues persist:

1. Check browser console for CORS errors
2. Verify that all content-type headers are set correctly
3. Confirm that all authentication views have the `ensure_json_response` decorator
4. Verify that tokens are being properly passed in the Authorization header