from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from .models import PricingRate, Booking

def get_applicable_rate(vehicle_type, booking_time):
    """
    Finds the most specific pricing rate for a given vehicle type and time.
    """
    # Try to find a rate for the specific vehicle type
    rate = PricingRate.objects.filter(
        vehicle_type=vehicle_type,
        effective_from__lte=booking_time,
        effective_to__gte=booking_time
    ).order_by('-is_default').first()

    # If no specific rate, try to find a rate for 'all' vehicle types
    if not rate:
        rate = PricingRate.objects.filter(
            vehicle_type='all',
            effective_from__lte=booking_time,
            effective_to__gte=booking_time
        ).order_by('-is_default').first()

    # If still no rate, get the default rate
    if not rate:
        rate = PricingRate.objects.filter(is_default=True).first()
        
    return rate

def calculate_booking_price(start_time, end_time, vehicle_type):
    """
    Calculates the total price for a booking based on duration and pricing rates.
    """
    if end_time <= start_time:
        return Decimal('0.00')

    duration = end_time - start_time
    duration_hours = duration.total_seconds() / 3600
    
    rate = get_applicable_rate(vehicle_type, start_time)
    
    if not rate:
        # Fallback to a hardcoded rate if no pricing is configured
        return Decimal(duration_hours) * Decimal('10.00')

    # Simple hourly calculation for now
    # In a real-world scenario, this would handle daily rates, partial hours, etc.
    total_price = Decimal(duration_hours) * rate.hourly_rate
    
    return round(total_price, 2)

def calculate_extension_price(booking, new_end_time):
    """
    Calculates the additional cost for extending a booking.
    """
    if new_end_time <= booking.end_time:
        return Decimal('0.00')

    extension_duration = new_end_time - booking.end_time
    extension_hours = extension_duration.total_seconds() / 3600
    
    rate = get_applicable_rate(booking.vehicle.vehicle_type, booking.end_time)
    
    if not rate:
        return Decimal(extension_hours) * Decimal('10.00')

    # Apply extension multiplier
    extension_price = (Decimal(extension_hours) * rate.hourly_rate) * rate.extension_rate_multiplier
    
    return round(extension_price, 2)
