from rest_framework.renderers import JSONRenderer

class UTF8JSONRenderer(JSONRenderer):
    """
    Custom JSON renderer that includes UTF-8 charset in the Content-Type header.
    This helps fix browser compatibility issues related to character encoding.
    """
    media_type = 'application/json; charset=utf-8'
    charset = 'utf-8'
    
    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = renderer_context.get('response') if renderer_context else None
        
        # Explicitly set Content-Type header with charset
        if response and hasattr(response, 'headers'):
            response.headers['Content-Type'] = 'application/json; charset=utf-8'
            
            # If request has Accept header that could match, ensure we handle it properly
            request = renderer_context.get('request') if renderer_context else None
            if request and 'HTTP_ACCEPT' in request.META:
                accept_header = request.META.get('HTTP_ACCEPT', '')
                # If client accepts anything or explicitly states JSON
                if '*/*' in accept_header or 'application/json' in accept_header:
                    response.headers['Content-Type'] = 'application/json; charset=utf-8'
        
        return super().render(data, accepted_media_type, renderer_context)