"""
Access Log Utilities
Helper functions for tracking user login/logout activity
"""
import re
import requests
from django.conf import settings
from .models import AccessLog


def get_client_ip(request):
    """
    Extract client IP address from request
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_location_from_ip(ip_address):
    """
    Get geolocation information from IP address using ipapi.co (free service)
    Returns dict with city, country, latitude, longitude
    """
    try:
        # Skip localhost/private IPs
        if ip_address in ['127.0.0.1', 'localhost'] or ip_address.startswith('192.168.') or ip_address.startswith('10.'):
            return {
                'city': 'Local Network',
                'country': 'Local',
                'latitude': None,
                'longitude': None
            }
        
        # Use ipapi.co free API (no key required, 1000 requests/day)
        response = requests.get(f'https://ipapi.co/{ip_address}/json/', timeout=2)
        
        if response.status_code == 200:
            data = response.json()
            return {
                'city': data.get('city', ''),
                'country': data.get('country_name', ''),
                'latitude': data.get('latitude'),
                'longitude': data.get('longitude')
            }
    except Exception as e:
        print(f"Error getting location from IP: {e}")
    
    return {
        'city': '',
        'country': '',
        'latitude': None,
        'longitude': None
    }


def parse_user_agent(user_agent_string):
    """
    Parse user agent string to extract device type, browser, and OS
    """
    if not user_agent_string:
        return {
            'device_type': 'unknown',
            'browser': '',
            'operating_system': ''
        }
    
    ua = user_agent_string.lower()
    
    # Detect device type
    if 'mobile' in ua or 'android' in ua or 'iphone' in ua:
        device_type = 'mobile'
    elif 'tablet' in ua or 'ipad' in ua:
        device_type = 'tablet'
    else:
        device_type = 'desktop'
    
    # Detect browser
    if 'chrome' in ua and 'edg' not in ua:
        browser = 'Chrome'
    elif 'firefox' in ua:
        browser = 'Firefox'
    elif 'safari' in ua and 'chrome' not in ua:
        browser = 'Safari'
    elif 'edg' in ua:
        browser = 'Edge'
    elif 'opera' in ua or 'opr' in ua:
        browser = 'Opera'
    else:
        browser = 'Other'
    
    # Detect OS
    if 'windows' in ua:
        os = 'Windows'
    elif 'mac' in ua:
        os = 'macOS'
    elif 'linux' in ua:
        os = 'Linux'
    elif 'android' in ua:
        os = 'Android'
    elif 'ios' in ua or 'iphone' in ua or 'ipad' in ua:
        os = 'iOS'
    else:
        os = 'Other'
    
    return {
        'device_type': device_type,
        'browser': browser,
        'operating_system': os
    }


def create_access_log(user, request, status='success', failure_reason='', session_id=''):
    """
    Create an access log entry for user login attempt
    
    Args:
        user: User instance (or None for failed login with unknown user)
        request: Django request object
        status: 'success', 'failed', or 'locked'
        failure_reason: Reason for failed login
        session_id: Session ID for tracking logout
    
    Returns:
        AccessLog instance
    """
    # Get IP address
    ip_address = get_client_ip(request)
    
    # Get location from IP
    location_data = get_location_from_ip(ip_address)
    
    # Get user agent
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    device_info = parse_user_agent(user_agent)
    
    # Create access log
    access_log = AccessLog.objects.create(
        user=user,
        username=user.username if user else request.data.get('email', ''),
        email=user.email if user else request.data.get('email', ''),
        role=user.role if user else '',
        ip_address=ip_address,
        location_city=location_data['city'],
        location_country=location_data['country'],
        latitude=location_data['latitude'],
        longitude=location_data['longitude'],
        status=status,
        failure_reason=failure_reason,
        user_agent=user_agent,
        device_type=device_info['device_type'],
        browser=device_info['browser'],
        operating_system=device_info['operating_system'],
        session_id=session_id,
    )
    
    return access_log


def update_logout(session_id):
    """
    Update access log with logout timestamp
    
    Args:
        session_id: Session ID to find the access log
    
    Returns:
        Updated AccessLog instance or None
    """
    from django.utils import timezone
    
    try:
        access_log = AccessLog.objects.filter(
            session_id=session_id,
            logout_timestamp__isnull=True
        ).latest('login_timestamp')
        
        access_log.logout_timestamp = timezone.now()
        access_log.save()
        
        return access_log
    except AccessLog.DoesNotExist:
        return None
