from django.utils import timezone
from datetime import timedelta
from .models import Booking

def find_alternative_slots(slot, requested_start, requested_end, max_alternatives=3, buffer_hours=1):
    """
    Find alternative available time slots when a booking conflict occurs.
    
    Args:
        slot: The ParkingSlot object that has a conflict
        requested_start: The originally requested start time
        requested_end: The originally requested end time
        max_alternatives: Maximum number of alternative slots to suggest
        buffer_hours: Hours to check before and after the requested time
    
    Returns:
        A list of dictionaries with alternative start and end times
    """
    # Calculate the duration of the requested booking
    duration = requested_end - requested_start
    
    # Get all bookings for this slot around the requested time (with buffer)
    buffer_start = requested_start - timedelta(hours=buffer_hours)
    buffer_end = requested_end + timedelta(hours=buffer_hours)
    
    bookings = Booking.objects.filter(
        slot=slot,
        start_time__lt=buffer_end,
        end_time__gt=buffer_start,
        is_active=True
    ).order_by('start_time')
    
    # If no bookings found, there was an error in the conflict detection
    if not bookings:
        return []
    
    alternatives = []
    
    # Check for a slot before the conflicting booking
    first_booking = bookings.first()
    if first_booking.start_time > buffer_start:
        # There's space before the first booking
        alt_start = max(buffer_start, timezone.now())
        alt_end = min(first_booking.start_time, alt_start + duration)
        
        # Only add if the alternative provides enough time
        if alt_end - alt_start >= duration * 0.8:  # At least 80% of requested duration
            alternatives.append({
                'start_time': alt_start,
                'end_time': alt_end
            })
    
    # Check for slots between bookings
    prev_booking_end = None
    for booking in bookings:
        if prev_booking_end:
            gap_duration = booking.start_time - prev_booking_end
            # If there's enough gap between bookings
            if gap_duration >= duration * 0.8:
                alternatives.append({
                    'start_time': prev_booking_end,
                    'end_time': prev_booking_end + duration
                })
        prev_booking_end = booking.end_time
    
    # Check for a slot after the last booking
    last_booking = bookings.last()
    if last_booking.end_time < buffer_end:
        alternatives.append({
            'start_time': last_booking.end_time,
            'end_time': last_booking.end_time + duration
        })
    
    # If we still need more alternatives, try extending the search range
    if len(alternatives) < max_alternatives:
        # Look for the next day
        next_day_start = timezone.make_aware(timezone.datetime.combine(
            requested_start.date() + timedelta(days=1),
            requested_start.time()
        ))
        next_day_end = next_day_start + duration
        
        next_day_bookings = Booking.objects.filter(
            slot=slot,
            start_time__lt=next_day_end,
            end_time__gt=next_day_start,
            is_active=True
        )
        
        if not next_day_bookings.exists():
            alternatives.append({
                'start_time': next_day_start,
                'end_time': next_day_end,
                'message': 'Next day availability'
            })
    
    # Limit to max alternatives and format datetime objects for easy display
    return alternatives[:max_alternatives]