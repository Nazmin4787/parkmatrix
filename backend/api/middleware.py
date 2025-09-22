class ContentTypeMiddleware:
    """
    Middleware to ensure all responses have the correct charset in Content-Type header.
    This helps fix browser compatibility issues with character encoding.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Force charset for all Content-Type headers
        if response.has_header('Content-Type'):
            content_type = response['Content-Type']
            
            # Always replace with explicit charset for text/html
            if content_type.startswith('text/html'):
                response['Content-Type'] = 'text/html; charset=utf-8'
            # Always replace with explicit charset for application/json
            elif content_type.startswith('application/json'):
                response['Content-Type'] = 'application/json; charset=utf-8'
            # For any other text-based content type
            elif content_type.startswith('text/'):
                response['Content-Type'] = f"{content_type.split(';')[0]}; charset=utf-8"
        
        return response


class CookieSecurityMiddleware:
    """
    Middleware to ensure all cookies have secure and httponly flags set.
    """
    def __init__(self, get_response):
        self.get_response = get_response
        
        # Initialize is_dev flag at middleware startup for better performance
        # Import locally to avoid circular imports
        try:
            from django.conf import settings
            self.is_dev = getattr(settings, 'DEBUG', True)  # Default to True for safety
        except ImportError:
            # If settings can't be imported, assume development mode for safety
            self.is_dev = True

    def __call__(self, request):
        response = self.get_response(request)
        
        # Process cookies in the response
        if response.cookies:
            for key in response.cookies:
                # Skip CSRF token which has special handling
                if key != 'csrftoken':  
                    # For development environment (localhost), don't set secure flag
                    if self.is_dev:
                        # In development, ensure 'secure' is not set
                        if 'secure' in response.cookies[key]:
                            del response.cookies[key]['secure']
                    elif request.is_secure():
                        # In production, 'secure' should only be set over HTTPS
                        response.cookies[key]['secure'] = True
                    
                    # Always set httponly flag
                    response.cookies[key]['httponly'] = True
                    
                    # Set SameSite attribute to Lax for better security without breaking functionality
                    response.cookies[key]['samesite'] = 'Lax'
        
        return response