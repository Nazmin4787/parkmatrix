"""
Utility functions for generating and validating secret codes for check-in/check-out workflow.
"""
import random
import string
from .models import Booking


def generate_unique_secret_code():
    """
    Generate a unique 6-digit numeric secret code for booking verification.
    
    Returns:
        str: A unique 6-digit code
    """
    max_attempts = 100
    
    for _ in range(max_attempts):
        # Generate 6-digit numeric code
        code = ''.join(random.choices(string.digits, k=6))
        
        # Ensure uniqueness
        if not Booking.objects.filter(secret_code=code).exists():
            return code
    
    # Fallback: use alphanumeric if too many collisions
    for _ in range(max_attempts):
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if not Booking.objects.filter(secret_code=code).exists():
            return code
    
    raise ValueError("Unable to generate unique secret code after multiple attempts")


def validate_secret_code(booking_id, secret_code):
    """
    Validate that the provided secret code matches the booking.
    
    Args:
        booking_id: ID of the booking
        secret_code: Secret code to validate
        
    Returns:
        tuple: (is_valid: bool, error_message: str, booking: Booking or None)
    """
    try:
        booking = Booking.objects.get(id=booking_id)
    except Booking.DoesNotExist:
        return False, "Booking not found", None
    
    # Check if booking has a secret code assigned
    if not booking.secret_code:
        return False, "No secret code assigned to this booking", booking
    
    # Validate the code
    if booking.secret_code != secret_code:
        return False, "Invalid secret code", booking
    
    return True, "", booking


def format_secret_code_for_display(code):
    """
    Format secret code for better readability (e.g., 123456 -> 123-456).
    
    Args:
        code: The 6-digit code
        
    Returns:
        str: Formatted code
    """
    if len(code) == 6:
        return f"{code[:3]}-{code[3:]}"
    return code
