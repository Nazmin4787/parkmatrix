from rest_framework.negotiation import DefaultContentNegotiation

class CustomContentNegotiation(DefaultContentNegotiation):
    """
    Custom content negotiation class that is more lenient with Accept headers.
    This helps solve 406 Not Acceptable errors when clients don't specify
    exact content types they can accept.
    """
    
    def select_renderer(self, request, renderers, format_suffix=None):
        # If format_suffix is explicitly provided, use that
        if format_suffix:
            return super().select_renderer(request, renderers, format_suffix)
        
        # For any requests with known problematic endpoints, force JSON renderer
        if request.path_info.endswith('/unread_count/'):
            # Find the JSON renderer
            for renderer in renderers:
                if renderer.media_type.startswith('application/json'):
                    return (renderer, renderer.media_type)
        
        # Otherwise, use default behavior
        return super().select_renderer(request, renderers, format_suffix)