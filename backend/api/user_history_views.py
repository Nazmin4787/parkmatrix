"""
User Parking History Views
Feature 2: View User History

This module provides API endpoints for users to view their complete parking history,
including past sessions, statistics, and export functionality.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from datetime import timedelta, datetime
from decimal import Decimal
import csv
from django.http import HttpResponse

from .models import Booking, User, AuditLog
from .serializers import (
    ParkingSessionSerializer,
    ParkingSessionListSerializer,
    UserParkingStatsSerializer
)


# ============================================================================
# USER ENDPOINTS - Customer Access
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_parking_history_list(request):
    """
    Get list of all user's parking sessions with filters
    
    Query Parameters:
    - start_date: Filter from date (YYYY-MM-DD)
    - end_date: Filter to date (YYYY-MM-DD)
    - location: Filter by location name
    - status: Filter by status (active, completed, cancelled)
    - vehicle_type: Filter by vehicle type
    - page: Page number for pagination
    - page_size: Number of results per page
    - ordering: Sort field (default: -checked_in_at)
    """
    try:
        user = request.user
        
        # Base queryset - user's bookings only
        queryset = Booking.objects.filter(user=user).select_related(
            'user', 'slot', 'slot__parking_lot', 'vehicle'
        )
        
        # Apply filters
        filters = request.GET
        
        # Date range filter
        start_date = filters.get('start_date')
        end_date = filters.get('end_date')
        
        if start_date:
            try:
                start_datetime = datetime.strptime(start_date, '%Y-%m-%d')
                queryset = queryset.filter(start_time__gte=start_datetime)
            except ValueError:
                pass
        
        if end_date:
            try:
                end_datetime = datetime.strptime(end_date, '%Y-%m-%d')
                # Add one day to include the entire end date
                end_datetime = end_datetime + timedelta(days=1)
                queryset = queryset.filter(start_time__lt=end_datetime)
            except ValueError:
                pass
        
        # Location filter
        location = filters.get('location')
        if location:
            queryset = queryset.filter(slot__parking_lot__name__icontains=location)
        
        # Status filter
        session_status = filters.get('status')
        if session_status:
            if session_status == 'active':
                queryset = queryset.filter(status__in=['confirmed', 'checked_in'])
            elif session_status == 'completed':
                queryset = queryset.filter(status='checked_out')
            elif session_status == 'cancelled':
                queryset = queryset.filter(status='cancelled')
        
        # Vehicle type filter
        vehicle_type = filters.get('vehicle_type')
        if vehicle_type:
            queryset = queryset.filter(vehicle__vehicle_type=vehicle_type)
        
        # Ordering
        ordering = filters.get('ordering', '-start_time')
        queryset = queryset.order_by(ordering)
        
        # Pagination
        page = int(filters.get('page', 1))
        page_size = int(filters.get('page_size', 20))
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        
        total_count = queryset.count()
        paginated_queryset = queryset[start_idx:end_idx]
        
        # Serialize data
        serializer = ParkingSessionListSerializer(paginated_queryset, many=True)
        
        return Response({
            'count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size,
            'results': serializer.data
        })
    
    except Exception as e:
        return Response(
            {'error': f'Failed to load parking history: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_parking_history_detail(request, pk):
    """
    Get detailed information for a single parking session
    """
    try:
        user = request.user
        
        # Get booking - ensure it belongs to the user
        try:
            booking = Booking.objects.select_related(
                'user', 'slot', 'slot__parking_lot', 'vehicle'
            ).get(pk=pk, user=user)
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Parking session not found or you do not have permission to view it.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Serialize data
        serializer = ParkingSessionSerializer(booking)
        
        return Response(serializer.data)
    
    except Exception as e:
        return Response(
            {'error': f'Failed to load session details: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_parking_stats(request):
    """
    Get user's parking statistics
    
    Query Parameters:
    - start_date: Calculate stats from date (YYYY-MM-DD)
    - end_date: Calculate stats to date (YYYY-MM-DD)
    """
    try:
        user = request.user
        
        # Base queryset
        queryset = Booking.objects.filter(user=user)
        
        # Date range filter
        filters = request.GET
        start_date = filters.get('start_date')
        end_date = filters.get('end_date')
        
        if start_date:
            try:
                start_datetime = datetime.strptime(start_date, '%Y-%m-%d')
                queryset = queryset.filter(start_time__gte=start_datetime)
            except ValueError:
                pass
        
        if end_date:
            try:
                end_datetime = datetime.strptime(end_date, '%Y-%m-%d')
                end_datetime = end_datetime + timedelta(days=1)
                queryset = queryset.filter(start_time__lt=end_datetime)
            except ValueError:
                pass
        
        # Calculate statistics
        total_sessions = queryset.count()
        
        # Total time parked (only completed sessions)
        completed_bookings = queryset.filter(
            status='checked_out',
            checked_in_at__isnull=False,
            checked_out_at__isnull=False
        )
        
        total_minutes = 0
        for booking in completed_bookings:
            duration = booking.checked_out_at - booking.checked_in_at
            total_minutes += int(duration.total_seconds() / 60)
        
        total_hours = total_minutes // 60
        
        # Total amount paid
        total_amount = queryset.filter(
            status='checked_out'
        ).aggregate(
            total=Sum('total_price')
        )['total'] or Decimal('0.00')
        
        # Favorite location
        location_stats = queryset.filter(
            slot__parking_lot__isnull=False
        ).values(
            'slot__parking_lot__name'
        ).annotate(
            count=Count('id')
        ).order_by('-count').first()
        
        favorite_location = None
        if location_stats:
            favorite_location = {
                'name': location_stats['slot__parking_lot__name'],
                'count': location_stats['count']
            }
        
        # Most used vehicle
        vehicle_stats = queryset.filter(
            vehicle__isnull=False
        ).values(
            'vehicle__vehicle_type',
            'vehicle__number_plate'
        ).annotate(
            count=Count('id')
        ).order_by('-count').first()
        
        most_used_vehicle = None
        if vehicle_stats:
            most_used_vehicle = {
                'type': vehicle_stats['vehicle__vehicle_type'],
                'plate': vehicle_stats['vehicle__number_plate'],
                'count': vehicle_stats['count']
            }
        
        # Average duration
        average_duration = total_minutes // total_sessions if total_sessions > 0 else 0
        
        # Average amount
        average_amount = total_amount / total_sessions if total_sessions > 0 else Decimal('0.00')
        
        # This month's stats
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        month_bookings = queryset.filter(start_time__gte=month_start)
        month_sessions = month_bookings.count()
        month_amount = month_bookings.filter(
            status='checked_out'
        ).aggregate(
            total=Sum('total_price')
        )['total'] or Decimal('0.00')
        
        # Active vs completed sessions
        active_sessions = queryset.filter(status__in=['confirmed', 'checked_in']).count()
        completed_sessions = queryset.filter(status='checked_out').count()
        
        # Build response
        stats_data = {
            'total_sessions': total_sessions,
            'total_time_parked': {
                'minutes': total_minutes,
                'formatted': f"{total_hours} hours"
            },
            'total_amount_paid': float(total_amount),
            'favorite_location': favorite_location,
            'most_used_vehicle': most_used_vehicle,
            'average_duration_minutes': average_duration,
            'average_amount': float(average_amount),
            'this_month': {
                'sessions': month_sessions,
                'total_amount': float(month_amount)
            },
            'active_sessions': active_sessions,
            'completed_sessions': completed_sessions
        }
        
        return Response(stats_data)
    
    except Exception as e:
        return Response(
            {'error': f'Failed to calculate statistics: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_parking_history_export(request):
    """
    Export user's parking history to CSV
    
    Query Parameters: Same as list endpoint
    """
    try:
        user = request.user
        
        # Base queryset
        queryset = Booking.objects.filter(user=user).select_related(
            'user', 'slot', 'slot__parking_lot', 'vehicle'
        ).order_by('-start_time')
        
        # Apply same filters as list endpoint
        filters = request.GET
        
        start_date = filters.get('start_date')
        end_date = filters.get('end_date')
        
        if start_date:
            try:
                start_datetime = datetime.strptime(start_date, '%Y-%m-%d')
                queryset = queryset.filter(start_time__gte=start_datetime)
            except ValueError:
                pass
        
        if end_date:
            try:
                end_datetime = datetime.strptime(end_date, '%Y-%m-% d')
                end_datetime = end_datetime + timedelta(days=1)
                queryset = queryset.filter(start_time__lt=end_datetime)
            except ValueError:
                pass
        
        location = filters.get('location')
        if location:
            queryset = queryset.filter(slot__parking_lot__name__icontains=location)
        
        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="parking_history_{user.username}_{timezone.now().strftime("%Y%m%d")}.csv"'
        
        writer = csv.writer(response)
        
        # Write header
        writer.writerow([
            'Booking ID',
            'Vehicle Type',
            'Vehicle Plate',
            'Location',
            'Zone',
            'Floor',
            'Slot Number',
            'Check-In Time',
            'Check-Out Time',
            'Duration',
            'Amount',
            'Status'
        ])
        
        # Write data rows
        for booking in queryset:
            check_in = booking.checked_in_at or booking.start_time
            check_out = booking.checked_out_at
            
            # Calculate duration
            duration = 'N/A'
            if check_in and check_out:
                delta = check_out - check_in
                minutes = int(delta.total_seconds() / 60)
                hours = minutes // 60
                mins = minutes % 60
                duration = f"{hours}h {mins}m"
            
            writer.writerow([
                booking.id,
                booking.vehicle.vehicle_type if booking.vehicle else 'N/A',
                booking.vehicle.number_plate if booking.vehicle else 'N/A',
                booking.slot.parking_lot.name if booking.slot and booking.slot.parking_lot else 'Unknown',
                booking.slot.section if booking.slot else 'N/A',
                booking.slot.floor if booking.slot else 'N/A',
                booking.slot.slot_number if booking.slot else 'N/A',
                check_in.strftime('%Y-%m-%d %H:%M:%S') if check_in else 'N/A',
                check_out.strftime('%Y-%m-%d %H:%M:%S') if check_out else 'N/A',
                duration,
                float(booking.total_price) if booking.total_price else 0.00,
                booking.status
            ])
        
        return response
    
    except Exception as e:
        return Response(
            {'error': f'Failed to export parking history: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ============================================================================
# ADMIN ENDPOINTS - Admin Access to Any User's History
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_user_history(request, user_id):
    """
    Admin endpoint to view any user's parking history
    
    Requires: Admin role
    """
    try:
        # Check if user is admin
        if request.user.role not in ['admin', 'security']:
            return Response(
                {'error': 'Permission denied. Admin access required.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get target user
        try:
            target_user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get user's bookings
        queryset = Booking.objects.filter(user=target_user).select_related(
            'user', 'slot', 'slot__parking_lot', 'vehicle'
        ).order_by('-start_time')
        
        # Apply filters (same as user endpoint)
        filters = request.GET
        
        start_date = filters.get('start_date')
        if start_date:
            try:
                start_datetime = datetime.strptime(start_date, '%Y-%m-%d')
                queryset = queryset.filter(start_time__gte=start_datetime)
            except ValueError:
                pass
        
        end_date = filters.get('end_date')
        if end_date:
            try:
                end_datetime = datetime.strptime(end_date, '%Y-%m-%d')
                end_datetime = end_datetime + timedelta(days=1)
                queryset = queryset.filter(start_time__lt=end_datetime)
            except ValueError:
                pass
        
        # Pagination
        page = int(filters.get('page', 1))
        page_size = int(filters.get('page_size', 20))
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        
        total_count = queryset.count()
        paginated_queryset = queryset[start_idx:end_idx]
        
        # Serialize
        serializer = ParkingSessionListSerializer(paginated_queryset, many=True)
        
        return Response({
            'user': {
                'id': target_user.id,
                'username': target_user.username,
                'email': target_user.email
            },
            'count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size,
            'results': serializer.data
        })
    
    except Exception as e:
        return Response(
            {'error': f'Failed to load user history: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_user_stats(request, user_id):
    """
    Admin endpoint to view any user's parking statistics
    
    Requires: Admin role
    """
    try:
        # Check if user is admin
        if request.user.role not in ['admin', 'security']:
            return Response(
                {'error': 'Permission denied. Admin access required.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get target user
        try:
            target_user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Calculate stats (reuse logic from user_parking_stats)
        queryset = Booking.objects.filter(user=target_user)
        
        # Date range filter
        filters = request.GET
        start_date = filters.get('start_date')
        end_date = filters.get('end_date')
        
        if start_date:
            try:
                start_datetime = datetime.strptime(start_date, '%Y-%m-%d')
                queryset = queryset.filter(start_time__gte=start_datetime)
            except ValueError:
                pass
        
        if end_date:
            try:
                end_datetime = datetime.strptime(end_date, '%Y-%m-%d')
                end_datetime = end_datetime + timedelta(days=1)
                queryset = queryset.filter(start_time__lt=end_datetime)
            except ValueError:
                pass
        
        # Calculate statistics (same logic as user stats)
        total_sessions = queryset.count()
        
        completed_bookings = queryset.filter(
            status='checked_out',
            checked_in_at__isnull=False,
            checked_out_at__isnull=False
        )
        
        total_minutes = 0
        for booking in completed_bookings:
            duration = booking.checked_out_at - booking.checked_in_at
            total_minutes += int(duration.total_seconds() / 60)
        
        total_hours = total_minutes // 60
        
        total_amount = queryset.filter(
            status='checked_out'
        ).aggregate(
            total=Sum('total_price')
        )['total'] or Decimal('0.00')
        
        location_stats = queryset.filter(
            slot__parking_lot__isnull=False
        ).values(
            'slot__parking_lot__name'
        ).annotate(
            count=Count('id')
        ).order_by('-count').first()
        
        favorite_location = None
        if location_stats:
            favorite_location = {
                'name': location_stats['slot__parking_lot__name'],
                'count': location_stats['count']
            }
        
        vehicle_stats = queryset.filter(
            vehicle__isnull=False
        ).values(
            'vehicle__vehicle_type',
            'vehicle__number_plate'
        ).annotate(
            count=Count('id')
        ).order_by('-count').first()
        
        most_used_vehicle = None
        if vehicle_stats:
            most_used_vehicle = {
                'type': vehicle_stats['vehicle__vehicle_type'],
                'plate': vehicle_stats['vehicle__number_plate'],
                'count': vehicle_stats['count']
            }
        
        average_duration = total_minutes // total_sessions if total_sessions > 0 else 0
        average_amount = total_amount / total_sessions if total_sessions > 0 else Decimal('0.00')
        
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        month_bookings = queryset.filter(start_time__gte=month_start)
        month_sessions = month_bookings.count()
        month_amount = month_bookings.filter(
            status='checked_out'
        ).aggregate(
            total=Sum('total_price')
        )['total'] or Decimal('0.00')
        
        active_sessions = queryset.filter(status__in=['confirmed', 'checked_in']).count()
        completed_sessions = queryset.filter(status='checked_out').count()
        
        stats_data = {
            'user': {
                'id': target_user.id,
                'username': target_user.username,
                'email': target_user.email
            },
            'total_sessions': total_sessions,
            'total_time_parked': {
                'minutes': total_minutes,
                'formatted': f"{total_hours} hours"
            },
            'total_amount_paid': float(total_amount),
            'favorite_location': favorite_location,
            'most_used_vehicle': most_used_vehicle,
            'average_duration_minutes': average_duration,
            'average_amount': float(average_amount),
            'this_month': {
                'sessions': month_sessions,
                'total_amount': float(month_amount)
            },
            'active_sessions': active_sessions,
            'completed_sessions': completed_sessions
        }
        
        return Response(stats_data)
    
    except Exception as e:
        return Response(
            {'error': f'Failed to calculate user statistics: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_users_list(request):
    """
    Get list of all users for admin dropdown selection
    
    Admin only endpoint to fetch all users in the system.
    Returns user id, username, email, and role for display in admin interface.
    """
    try:
        # Verify user is admin
        if not request.user.is_staff:
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all users, ordered by username
        users = User.objects.all().order_by('username')
        
        # Build user list with essential info
        users_data = [
            {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': 'admin' if user.is_staff else 'customer',
                'is_active': user.is_active,
                'full_name': f"{user.first_name} {user.last_name}".strip() or user.username
            }
            for user in users
        ]
        
        return Response({
            'count': len(users_data),
            'users': users_data
        })
    
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch users list: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
