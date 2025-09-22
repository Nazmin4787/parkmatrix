"""
Notification API views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer
from .decorators import accept_any_content_type, public_endpoint

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for managing user notifications
    
    Provides endpoints for:
    - List all user notifications
    - Retrieve a specific notification
    - Mark notifications as read
    - Get unread notification count
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return only notifications for the current user"""
        return Notification.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark a specific notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'notification marked as read'})
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Mark all of the user's notifications as read"""
        notifications = self.get_queryset()
        notifications.update(is_read=True)
        return Response({'status': 'all notifications marked as read'})
    
    @action(detail=False, methods=['get'])
    @accept_any_content_type
    @public_endpoint
    def unread_count(self, request):
        """Get the count of unread notifications"""
        count = self.get_queryset().filter(is_read=False).count()
        # Explicitly set content type to handle 406 errors
        return Response(
            {'unread_count': count},
            content_type='application/json; charset=utf-8'
        )
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Get notifications filtered by type"""
        notification_type = request.query_params.get('type', None)
        if not notification_type:
            return Response(
                {'error': 'Notification type parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        notifications = self.get_queryset().filter(notification_type=notification_type)
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)
