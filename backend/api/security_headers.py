"""
Custom headers middleware for adding required HTTP headers
"""

class SecurityHeadersMiddleware:
    """
    Middleware to add security headers to all responses
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Add security headers
        response['X-Content-Type-Options'] = 'nosniff'
        
        # Modern browsers have this built in and the header is no longer recommended
        # response['X-XSS-Protection'] = '1; mode=block'
        
        response['X-Frame-Options'] = 'DENY'
        
        # Add Content-Security-Policy header to prevent XSS
        response['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'"
        
        # Ensure proper charset in Content-Type header
        if 'Content-Type' in response:
            content_type = response['Content-Type']
            if 'text/html' in content_type and 'charset=' not in content_type:
                response['Content-Type'] = 'text/html; charset=utf-8'
            elif 'application/json' in content_type and 'charset=' not in content_type:
                response['Content-Type'] = 'application/json; charset=utf-8'
        
        return response