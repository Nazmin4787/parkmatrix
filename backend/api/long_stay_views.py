"""
API Views for Long-Stay Vehicle Management
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .long_stay_detection import get_long_stay_service
from .permissions import IsAdminUser


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_long_stay_vehicles(request):
    """
    Get current list of long-stay vehicles
    Admin/Security only
    """
    # Check if user is admin or security
    if request.user.role not in ['admin', 'security']:
        return Response(
            {'error': 'Only admin and security personnel can access this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    service = get_long_stay_service()
    results = service.detect_long_stay_vehicles()
    
    # Convert datetime objects to ISO format for JSON serialization
    if results['timestamp']:
        results['timestamp'] = results['timestamp'].isoformat()
    
    for vehicle in results['long_stay_vehicles']:
        if vehicle['timing']['checked_in_at']:
            vehicle['timing']['checked_in_at'] = vehicle['timing']['checked_in_at'].isoformat()
        if vehicle['timing']['expected_checkout']:
            vehicle['timing']['expected_checkout'] = vehicle['timing']['expected_checkout'].isoformat()
    
    for vehicle in results['warning_vehicles']:
        if vehicle['timing']['checked_in_at']:
            vehicle['timing']['checked_in_at'] = vehicle['timing']['checked_in_at'].isoformat()
        if vehicle['timing']['expected_checkout']:
            vehicle['timing']['expected_checkout'] = vehicle['timing']['expected_checkout'].isoformat()
    
    return Response(results)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_long_stay_detection(request):
    """
    Manually trigger long-stay detection
    Admin only
    """
    # Check if user is admin
    if request.user.role != 'admin':
        return Response(
            {'error': 'Only administrators can trigger manual detection'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    service = get_long_stay_service()
    results = service.detect_long_stay_vehicles()
    
    # Convert datetime objects to ISO format for JSON serialization
    if results['timestamp']:
        results['timestamp'] = results['timestamp'].isoformat()
    
    for vehicle in results['long_stay_vehicles']:
        if vehicle['timing']['checked_in_at']:
            vehicle['timing']['checked_in_at'] = vehicle['timing']['checked_in_at'].isoformat()
        if vehicle['timing']['expected_checkout']:
            vehicle['timing']['expected_checkout'] = vehicle['timing']['expected_checkout'].isoformat()
    
    for vehicle in results['warning_vehicles']:
        if vehicle['timing']['checked_in_at']:
            vehicle['timing']['checked_in_at'] = vehicle['timing']['checked_in_at'].isoformat()
        if vehicle['timing']['expected_checkout']:
            vehicle['timing']['expected_checkout'] = vehicle['timing']['expected_checkout'].isoformat()
    
    return Response({
        'message': 'Long-stay detection completed successfully',
        'results': results
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_scheduler_status(request):
    """
    Get APScheduler status and scheduled jobs
    Admin only
    """
    # Check if user is admin
    if request.user.role != 'admin':
        return Response(
            {'error': 'Only administrators can view scheduler status'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    from .scheduler import get_scheduler
    
    scheduler = get_scheduler()
    if scheduler is None:
        return Response({
            'running': False,
            'message': 'Scheduler not started',
            'jobs': []
        })
    
    jobs = []
    for job in scheduler.get_jobs():
        jobs.append({
            'id': job.id,
            'name': job.name,
            'next_run_time': job.next_run_time.isoformat() if job.next_run_time else None,
            'trigger': str(job.trigger)
        })
    
    return Response({
        'running': scheduler.running,
        'jobs': jobs,
        'total_jobs': len(jobs),
        'message': 'Scheduler is running normally'
    })
