from rest_framework.views import APIView
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework import status
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .models import Notification

class PublicNotificationUnreadCountView(APIView):
    """
    A special view that returns unread notification count, designed to handle
    any content type and accept requests with or without authentication.
    """
    permission_classes = []  # No permissions required
    authentication_classes = []  # No authentication required
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def get(self, request):
        """
        Return the count of unread notifications for the current user.
        If no user is authenticated, returns 0.
        """
        if not request.user or not request.user.is_authenticated:
            # No user authenticated, return 0 count
            return self.create_response(0)
        
        # User is authenticated, return their unread count
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return self.create_response(count)
    
    def create_response(self, count):
        """Create a response that works with any content type"""
        response = Response(
            {"unread_count": count}, 
            status=status.HTTP_200_OK
        )
        # Set multiple content type headers to ensure compatibility
        response["Content-Type"] = "application/json; charset=utf-8"
        response["Accept"] = "*/*"
        return response