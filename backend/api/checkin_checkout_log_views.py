"""
Check-In/Check-Out Log Views
Handles viewing, filtering, and managing check-in/check-out logs for admin and security
"""
from django.db.models import Q, Count, Avg, F, ExpressionWrapper, DurationField
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import timedelta

from .models import AuditLog, Booking, ParkingSlot
from .permissions import IsAdminUser
from .serializers import (
    AuditLogSerializer, 
    AuditLogListSerializer, 
    AuditLogStatsSerializer,
    CurrentlyParkedVehicleSerializer
)


class CheckInCheckOutLogListView(generics.ListAPIView):
    """
    List all check-in/check-out logs with filtering
    Admin and Security only
    Returns booking-based data (one row per booking session)
    """
    serializer_class = AuditLogListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Only admin and security can view all logs
        if user.role not in ['admin', 'security']:
            return AuditLog.objects.none()
        
        # Base queryset - show check-in events (both old and new workflow)
        # This avoids duplicates by showing only the check-in log entry
        queryset = AuditLog.objects.filter(
            Q(action='check_in_success') | Q(action='customer_check_in')
        ).select_related(
            'booking', 
            'user', 
            'booking__vehicle', 
            'booking__slot',
            'booking__slot__parking_lot',
            'booking__user'
        )
        
        # Filter by booking ID
        booking_id = self.request.query_params.get('booking_id')
        if booking_id:
            queryset = queryset.filter(booking_id=booking_id)
        
        # Filter by user ID
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(booking__user_id=user_id)
        
        # Filter by username
        username = self.request.query_params.get('username')
        if username:
            queryset = queryset.filter(
                Q(booking__user__username__icontains=username) |
                Q(user__username__icontains=username)
            )
        
        # Filter by vehicle plate number
        vehicle_plate = self.request.query_params.get('vehicle_plate')
        if vehicle_plate:
            queryset = queryset.filter(
                booking__vehicle__number_plate__icontains=vehicle_plate
            )
        
        # Filter by vehicle type
        vehicle_type = self.request.query_params.get('vehicle_type')
        if vehicle_type:
            queryset = queryset.filter(booking__vehicle__vehicle_type=vehicle_type)
        
        # Filter by action type (check_in/check_out status)
        action_type = self.request.query_params.get('action')
        if action_type:
            if action_type == 'check_out' or action_type == 'check_out_success':
                # Only show bookings that have been checked out
                queryset = queryset.filter(booking__status='checked_out')
            elif action_type == 'check_in' or action_type == 'check_in_success':
                # Only show bookings that are still checked in
                queryset = queryset.filter(booking__status='checked_in')
        
        # Filter by success/failure status
        status_filter = self.request.query_params.get('status')
        if status_filter == 'success':
            queryset = queryset.filter(success=True)
        elif status_filter == 'failed':
            queryset = queryset.filter(success=False)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(timestamp__gte=date_from)
        
        date_to = self.request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(timestamp__lte=date_to)
        
        # Filter by parking lot
        parking_lot = self.request.query_params.get('parking_lot')
        if parking_lot:
            queryset = queryset.filter(
                booking__slot__parking_lot__name__icontains=parking_lot
            )
        
        # Filter by floor
        floor = self.request.query_params.get('floor')
        if floor:
            queryset = queryset.filter(booking__slot__floor=floor)
        
        # Filter by section
        section = self.request.query_params.get('section')
        if section:
            queryset = queryset.filter(booking__slot__section=section)
        
        # Current status filter (parked/left)
        current_status = self.request.query_params.get('current_status')
        if current_status == 'parked':
            queryset = queryset.filter(
                booking__status='checked_in',
                action='check_in_success'
            )
        elif current_status == 'left':
            queryset = queryset.filter(
                booking__status='checked_out',
                action='check_out_success'
            )
        
        # Ordering
        ordering = self.request.query_params.get('ordering', '-timestamp')
        queryset = queryset.order_by(ordering)
        
        return queryset


class CheckInCheckOutLogDetailView(generics.RetrieveAPIView):
    """
    Get detailed information about a specific check-in/check-out log
    Admin and Security only
    """
    queryset = AuditLog.objects.select_related(
        'booking', 'user', 'booking__vehicle', 'booking__slot',
        'booking__slot__parking_lot', 'booking__user'
    )
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role not in ['admin', 'security']:
            return AuditLog.objects.none()
        return super().get_queryset()


class CheckInCheckOutLogStatsView(APIView):
    """
    Get statistics about check-in/check-out activities
    Admin and Security only
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Only admin and security can view stats
        if user.role not in ['admin', 'security']:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Date range
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        queryset = AuditLog.objects.filter(
            action__in=[
                'check_in_attempt', 'check_in_success', 'check_in_failed',
                'check_out_attempt', 'check_out_success', 'check_out_failed'
            ]
        )
        
        if date_from:
            queryset = queryset.filter(timestamp__gte=date_from)
        else:
            # Default to last 30 days
            thirty_days_ago = timezone.now() - timedelta(days=30)
            queryset = queryset.filter(timestamp__gte=thirty_days_ago)
        
        if date_to:
            queryset = queryset.filter(timestamp__lte=date_to)
        
        # Calculate stats
        total_check_ins = queryset.filter(action='check_in_success').count()
        failed_check_ins = queryset.filter(action='check_in_failed').count()
        total_check_outs = queryset.filter(action='check_out_success').count()
        failed_check_outs = queryset.filter(action='check_out_failed').count()
        
        # Currently parked vehicles
        currently_parked = Booking.objects.filter(status='checked_in').count()
        
        # Average parking duration (in hours)
        completed_bookings = Booking.objects.filter(
            status='checked_out',
            checked_in_at__isnull=False,
            checked_out_at__isnull=False
        )
        
        if date_from:
            completed_bookings = completed_bookings.filter(checked_out_at__gte=date_from)
        if date_to:
            completed_bookings = completed_bookings.filter(checked_out_at__lte=date_to)
        
        # Calculate average duration
        total_duration = 0
        booking_count = completed_bookings.count()
        
        for booking in completed_bookings:
            duration = (booking.checked_out_at - booking.checked_in_at).total_seconds() / 3600
            total_duration += duration
        
        avg_duration = round(total_duration / booking_count, 2) if booking_count > 0 else 0
        
        # Check-ins by vehicle type
        check_ins_by_vehicle = dict(
            queryset.filter(action='check_in_success')
            .values('booking__vehicle__vehicle_type')
            .annotate(count=Count('id'))
            .values_list('booking__vehicle__vehicle_type', 'count')
        )
        
        # Check-ins by hour (for today)
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        hourly_check_ins = []
        for hour in range(24):
            hour_start = today_start + timedelta(hours=hour)
            hour_end = hour_start + timedelta(hours=1)
            count = queryset.filter(
                action='check_in_success',
                timestamp__gte=hour_start,
                timestamp__lt=hour_end
            ).count()
            hourly_check_ins.append({'hour': hour, 'count': count})
        
        # Recent failed attempts (last 10)
        recent_failed = queryset.filter(success=False).order_by('-timestamp')[:10]
        recent_failed_data = AuditLogListSerializer(recent_failed, many=True).data
        
        # Peak parking hours (top 5 hours with most check-ins in date range)
        from django.db.models.functions import ExtractHour
        peak_hours = (
            queryset.filter(action='check_in_success')
            .annotate(hour=ExtractHour('timestamp'))
            .values('hour')
            .annotate(count=Count('id'))
            .order_by('-count')[:5]
        )
        
        stats = {
            'total_check_ins': total_check_ins,
            'failed_check_ins': failed_check_ins,
            'total_check_outs': total_check_outs,
            'failed_check_outs': failed_check_outs,
            'currently_parked': currently_parked,
            'average_parking_duration_hours': avg_duration,
            'total_completed_sessions': booking_count,
            'check_ins_by_vehicle_type': check_ins_by_vehicle,
            'hourly_check_ins_today': hourly_check_ins,
            'peak_hours': list(peak_hours),
            'recent_failed_attempts': recent_failed_data,
        }
        
        serializer = AuditLogStatsSerializer(stats)
        return Response(serializer.data)


class CheckInCheckOutLogExportView(APIView):
    """
    Export check-in/check-out logs to CSV
    Admin and Security only
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Only admin and security can export logs
        if user.role not in ['admin', 'security']:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        import csv
        from io import StringIO
        
        # Get filtered queryset (reuse logic from list view)
        queryset = AuditLog.objects.filter(
            action__in=[
                'check_in_attempt', 'check_in_success', 'check_in_failed',
                'check_out_attempt', 'check_out_success', 'check_out_failed'
            ]
        ).select_related(
            'booking', 'user', 'booking__vehicle', 'booking__slot',
            'booking__slot__parking_lot', 'booking__user'
        )
        
        # Apply same filters as list view
        booking_id = request.query_params.get('booking_id')
        if booking_id:
            queryset = queryset.filter(booking_id=booking_id)
        
        user_id = request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(booking__user_id=user_id)
        
        vehicle_plate = request.query_params.get('vehicle_plate')
        if vehicle_plate:
            queryset = queryset.filter(
                booking__vehicle__number_plate__icontains=vehicle_plate
            )
        
        action_type = request.query_params.get('action')
        if action_type:
            queryset = queryset.filter(action__icontains=action_type)
        
        status_filter = request.query_params.get('status')
        if status_filter == 'success':
            queryset = queryset.filter(success=True)
        elif status_filter == 'failed':
            queryset = queryset.filter(success=False)
        
        date_from = request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(timestamp__gte=date_from)
        
        date_to = request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(timestamp__lte=date_to)
        
        queryset = queryset.order_by('-timestamp')
        
        # Create CSV
        output = StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'ID', 'Booking ID', 'Action', 'Status', 'Timestamp',
            'User', 'Email', 'Vehicle Type', 'Number Plate',
            'Parking Lot', 'Slot', 'Floor', 'Section',
            'IP Address', 'Error Message', 'Notes'
        ])
        
        # Write data rows
        for log in queryset:
            writer.writerow([
                log.id,
                log.booking.id if log.booking else 'N/A',
                log.get_action_display(),
                'Success' if log.success else 'Failed',
                log.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                log.booking.user.username if log.booking and log.booking.user else 'N/A',
                log.booking.user.email if log.booking and log.booking.user else 'N/A',
                log.booking.vehicle.vehicle_type if log.booking and log.booking.vehicle else 'N/A',
                log.booking.vehicle.number_plate if log.booking and log.booking.vehicle else 'N/A',
                log.booking.slot.parking_lot.name if log.booking and log.booking.slot and log.booking.slot.parking_lot else 'N/A',
                log.booking.slot.slot_number if log.booking and log.booking.slot else 'N/A',
                log.booking.slot.floor if log.booking and log.booking.slot else 'N/A',
                log.booking.slot.section if log.booking and log.booking.slot else 'N/A',
                log.ip_address or 'N/A',
                log.error_message or '',
                log.notes or '',
            ])
        
        # Create HTTP response
        response = HttpResponse(output.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="checkin_checkout_logs_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'
        
        return response


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_checkin_checkout_logs(request):
    """
    Get current user's own check-in/check-out logs
    Available to all authenticated users
    """
    queryset = AuditLog.objects.filter(
        booking__user=request.user,
        action__in=[
            'check_in_attempt', 'check_in_success', 'check_in_failed',
            'check_out_attempt', 'check_out_success', 'check_out_failed'
        ]
    ).select_related(
        'booking', 'booking__vehicle', 'booking__slot', 'booking__slot__parking_lot'
    ).order_by('-timestamp')[:50]  # Last 50 logs
    
    serializer = AuditLogListSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def currently_parked_vehicles(request):
    """
    Get list of all currently parked vehicles
    Admin and Security only
    """
    user = request.user
    
    # Only admin and security can view all parked vehicles
    if user.role not in ['admin', 'security']:
        return Response(
            {'error': 'Permission denied'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    parked_bookings = Booking.objects.filter(
        status='checked_in'
    ).select_related(
        'user', 'vehicle', 'slot', 'slot__parking_lot'
    ).order_by('-checked_in_at')
    
    serializer = CurrentlyParkedVehicleSerializer(parked_bookings, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_current_parking(request):
    """
    Get current user's active parking session
    Available to all authenticated users
    """
    current_booking = Booking.objects.filter(
        user=request.user,
        status='checked_in'
    ).select_related(
        'vehicle', 'slot', 'slot__parking_lot'
    ).first()
    
    if not current_booking:
        return Response({'message': 'No active parking session'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = CurrentlyParkedVehicleSerializer(current_booking)
    return Response(serializer.data)
