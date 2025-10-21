"""
Access Log Views
Handles viewing, filtering, and managing access logs for the admin dashboard
"""
import requests
from django.db.models import Count, Q
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AccessLog
from .permissions import IsAdminUser
from .serializers import AccessLogSerializer, AccessLogListSerializer, AccessLogStatsSerializer


class AccessLogListView(generics.ListAPIView):
    """
    List all access logs with filtering and search capabilities
    Admin only
    """
    serializer_class = AccessLogListSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    pagination_class = None  # Disable pagination for now, or can configure later
    
    def get_queryset(self):
        queryset = AccessLog.objects.select_related('user').all()
        
        # Filter by user
        user_id = self.request.query_params.get('user_id', None)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by username (search)
        username = self.request.query_params.get('username', None)
        if username:
            queryset = queryset.filter(username__icontains=username)
        
        # Filter by role
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by IP address
        ip_address = self.request.query_params.get('ip_address', None)
        if ip_address:
            queryset = queryset.filter(ip_address__icontains=ip_address)
        
        # Filter by location
        location = self.request.query_params.get('location', None)
        if location:
            queryset = queryset.filter(
                Q(location_city__icontains=location) | 
                Q(location_country__icontains=location)
            )
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from', None)
        if date_from:
            queryset = queryset.filter(login_timestamp__gte=date_from)
        
        date_to = self.request.query_params.get('date_to', None)
        if date_to:
            queryset = queryset.filter(login_timestamp__lte=date_to)
        
        # Filter active sessions only
        active_only = self.request.query_params.get('active_only', None)
        if active_only == 'true':
            queryset = queryset.filter(logout_timestamp__isnull=True, status='success')
        
        # Ordering
        ordering = self.request.query_params.get('ordering', '-login_timestamp')
        queryset = queryset.order_by(ordering)
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        # Pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class AccessLogDetailView(generics.RetrieveAPIView):
    """
    Get detailed information about a specific access log
    Admin only
    """
    queryset = AccessLog.objects.all()
    serializer_class = AccessLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]


class AccessLogStatsView(APIView):
    """
    Get statistics about access logs
    Admin only
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        # Get date range from query params (default: last 30 days)
        date_from = request.query_params.get('date_from', None)
        date_to = request.query_params.get('date_to', None)
        
        queryset = AccessLog.objects.all()
        
        if date_from:
            queryset = queryset.filter(login_timestamp__gte=date_from)
        else:
            # Default to last 30 days
            thirty_days_ago = timezone.now() - timezone.timedelta(days=30)
            queryset = queryset.filter(login_timestamp__gte=thirty_days_ago)
        
        if date_to:
            queryset = queryset.filter(login_timestamp__lte=date_to)
        
        # Calculate statistics
        total_logins = queryset.count()
        successful_logins = queryset.filter(status='success').count()
        failed_logins = queryset.filter(status='failed').count()
        unique_users = queryset.filter(user__isnull=False).values('user').distinct().count()
        active_sessions = queryset.filter(logout_timestamp__isnull=True, status='success').count()
        
        # Logins by role
        logins_by_role = dict(
            queryset.values('role').annotate(count=Count('id')).values_list('role', 'count')
        )
        
        # Logins by status
        logins_by_status = dict(
            queryset.values('status').annotate(count=Count('id')).values_list('status', 'count')
        )
        
        # Recent failed attempts (last 10)
        recent_failed = queryset.filter(status='failed').order_by('-login_timestamp')[:10]
        recent_failed_data = AccessLogListSerializer(recent_failed, many=True).data
        
        stats = {
            'total_logins': total_logins,
            'successful_logins': successful_logins,
            'failed_logins': failed_logins,
            'unique_users': unique_users,
            'active_sessions': active_sessions,
            'logins_by_role': logins_by_role,
            'logins_by_status': logins_by_status,
            'recent_failed_attempts': recent_failed_data,
        }
        
        serializer = AccessLogStatsSerializer(stats)
        return Response(serializer.data)


class AccessLogExportView(APIView):
    """
    Export access logs to CSV
    Admin only
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        import csv
        from io import StringIO
        
        # Get filtered queryset (reuse logic from list view)
        queryset = AccessLog.objects.select_related('user').all()
        
        # Apply same filters as list view
        user_id = request.query_params.get('user_id', None)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        role = request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)
        
        status_filter = request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        date_from = request.query_params.get('date_from', None)
        if date_from:
            queryset = queryset.filter(login_timestamp__gte=date_from)
        
        date_to = request.query_params.get('date_to', None)
        if date_to:
            queryset = queryset.filter(login_timestamp__lte=date_to)
        
        queryset = queryset.order_by('-login_timestamp')
        
        # Create CSV
        output = StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'ID', 'Username', 'Email', 'Role', 'Login Time', 'Logout Time',
            'Session Duration (min)', 'IP Address', 'Location', 'Status',
            'Device Type', 'Browser', 'Operating System'
        ])
        
        # Write data rows
        for log in queryset:
            writer.writerow([
                log.id,
                log.username,
                log.email,
                log.role,
                log.login_timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                log.logout_timestamp.strftime('%Y-%m-%d %H:%M:%S') if log.logout_timestamp else 'Active',
                log.session_duration if log.session_duration else 'N/A',
                log.ip_address,
                f"{log.location_city}, {log.location_country}" if log.location_city else 'Unknown',
                log.status,
                log.device_type,
                log.browser,
                log.operating_system,
            ])
        
        # Create HTTP response
        response = HttpResponse(output.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="access_logs_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'
        
        return response


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_access_logs(request):
    """
    Get current user's own access logs
    """
    queryset = AccessLog.objects.filter(user=request.user).order_by('-login_timestamp')[:20]
    serializer = AccessLogListSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_auth_status(request):
    """
    Check the authentication status and user role for debugging
    """
    return Response({
        'authenticated': request.user.is_authenticated,
        'username': request.user.username if request.user.is_authenticated else None,
        'email': request.user.email if request.user.is_authenticated else None,
        'role': request.user.role if hasattr(request.user, 'role') else None,
        'is_admin': request.user.role == 'admin' if hasattr(request.user, 'role') else False,
    })
