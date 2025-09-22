from django.utils import timezone
from datetime import timedelta
from .models import Booking, Notification
from .pricing import calculate_extension_price

# Temporarily commented out due to compatibility issues
# from background_task import background

# Define a dummy background decorator to prevent errors
def background(schedule=None):
    def decorator(func):
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)
        return wrapper
    return decorator

@background(schedule=300)  # Run every 5 minutes
def send_booking_reminders():
    """
    This background task sends reminders for upcoming bookings.
    It sends reminders at two intervals:
    1. 24 hours before booking start time
    2. 30 minutes before booking start time
    """
    print("Running booking reminders task...")
    
    now = timezone.now()
    
    # Find bookings starting in ~24 hours (with a small buffer)
    day_before_start = now + timedelta(hours=23, minutes=55)
    day_before_end = now + timedelta(hours=24, minutes=5)
    
    day_before_bookings = Booking.objects.filter(
        start_time__gt=day_before_start,
        start_time__lt=day_before_end,
        is_active=True
    )
    
    # Find bookings starting in ~30 minutes (with a small buffer)
    soon_start = now + timedelta(minutes=25)
    soon_end = now + timedelta(minutes=35)
    
    soon_bookings = Booking.objects.filter(
        start_time__gt=soon_start,
        start_time__lt=soon_end,
        is_active=True
    )
    
    from .notification_utils import create_rich_notification
    
    # Process 24-hour reminders
    for booking in day_before_bookings:
        # Check if we've already sent a 24-hour reminder
        existing = Notification.objects.filter(
            user=booking.user,
            notification_type='booking_reminder_24h',
            related_object_id=str(booking.id)
        ).exists()
        
        if not existing:
            print(f"Sending 24-hour reminder for booking {booking.id}")
            
            # Format time for notification
            start_time = booking.start_time.strftime("%I:%M %p")
            date = booking.start_time.strftime("%A, %B %d")
            
            create_rich_notification(
                user=booking.user,
                notification_type='booking_reminder_24h',
                title='Booking Tomorrow',
                message=f"Reminder: You have a parking booking tomorrow at {start_time} on {date} at slot {booking.slot.slot_number}.",
                related_object_id=str(booking.id),
                related_object_type='Booking',
                additional_data={
                    'booking_id': str(booking.id),
                    'start_time': booking.start_time.isoformat(),
                    'end_time': booking.end_time.isoformat(),
                    'slot_number': booking.slot.slot_number,
                    'reminder_type': '24h',
                    'directions_url': f"/directions?slot={booking.slot.id}"
                }
            )
    
    # Process 30-minute reminders
    for booking in soon_bookings:
        # Check if we've already sent a 30-minute reminder
        existing = Notification.objects.filter(
            user=booking.user,
            notification_type='booking_reminder_30m',
            related_object_id=str(booking.id)
        ).exists()
        
        if not existing:
            print(f"Sending 30-minute reminder for booking {booking.id}")
            
            # Format time for notification
            start_time = booking.start_time.strftime("%I:%M %p")
            
            create_rich_notification(
                user=booking.user,
                notification_type='booking_reminder_30m',
                title='Booking Starting Soon',
                message=f"Your parking booking starts in 30 minutes at {start_time} for slot {booking.slot.slot_number}. Please arrive on time.",
                related_object_id=str(booking.id),
                related_object_type='Booking',
                additional_data={
                    'booking_id': str(booking.id),
                    'start_time': booking.start_time.isoformat(),
                    'end_time': booking.end_time.isoformat(),
                    'slot_number': booking.slot.slot_number,
                    'reminder_type': '30m',
                    'directions_url': f"/directions?slot={booking.slot.id}",
                    'urgent': True
                }
            )

@background(schedule=60)  # Run this task every 60 seconds
def process_overstayed_bookings():
    """
    This background task checks for bookings where the vehicle has overstayed
    and automatically extends them.
    """
    print("Running overstayed bookings task...")
    
    # Find active bookings that have passed their end time but the vehicle hasn't left
    overstayed_bookings = Booking.objects.filter(
        end_time__lt=timezone.now(),
        is_active=True,
        vehicle_has_left=False
    )
    
    for booking in overstayed_bookings:
        print(f"Processing overstay for booking {booking.id}")
        
        # Extend by a default of 30 minutes
        new_end_time = booking.end_time + timedelta(minutes=30)
        
        # Check for conflicts before extending
        conflicting = Booking.objects.filter(
            slot=booking.slot,
            start_time__lt=new_end_time,
            end_time__gt=booking.end_time,
            is_active=True
        ).exclude(pk=booking.pk).exists()
        
        if conflicting:
            # Cannot extend, notify user and admin
            Notification.objects.create(
                user=booking.user,
                notification_type='booking_error',
                title='Auto-Extension Failed',
                message=f'Could not auto-extend your booking for slot {booking.slot.slot_number} as it is now reserved. Please move your vehicle.'
            )
            # Also notify admin
            # (Implementation for admin notification can be added here)
            print(f"Could not extend booking {booking.id} due to conflict.")
            continue

        # Calculate extension price
        extension_price = calculate_extension_price(booking, new_end_time)
        
        # Update booking
        booking.end_time = new_end_time
        booking.total_price += extension_price
        booking.extension_count += 1
        booking.extension_history.append({
            'extended_at': timezone.now().isoformat(),
            'new_end_time': new_end_time.isoformat(),
            'additional_cost': str(extension_price),
            'type': 'auto'
        })
        booking.save()
        
        # Notify user with enhanced notification
        from .notification_utils import create_booking_extension_notification
        create_booking_extension_notification(booking, new_end_time, extension_price, is_automatic=True)
        print(f"Extended booking {booking.id} to {new_end_time}")
