from django.utils import timezone
from datetime import timedelta
from .models import Notification, Booking
# Temporarily commented out due to compatibility issues
# from background_task import background

# Define a dummy background decorator to prevent errors
def background(schedule=None):
    def decorator(func):
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)
        return wrapper
    return decorator

def create_rich_notification(user, notification_type, title, message, related_object_id=None, related_object_type=None, additional_data=None):
    """
    Creates an enhanced notification with additional data for rich display.
    
    Parameters:
        user: User to send notification to
        notification_type: Type of notification from NOTIFICATION_TYPES
        title: Notification title
        message: Main notification message
        related_object_id: ID of related object (e.g., booking ID)
        related_object_type: Type of related object (e.g., 'Booking')
        additional_data: Dict of additional data for rich display
    """
    # Create notification with standard fields
    notification = Notification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        message=message,
        related_object_id=related_object_id,
        related_object_type=related_object_type
    )
    
    # If additional data is provided, store it in the notification
    if additional_data and isinstance(additional_data, dict):
        # Store additional_data in a JSON field or another mechanism
        # This implementation assumes we've added a JSONField to the Notification model
        # If not available, consider adding it or using another approach
        if hasattr(notification, 'additional_data'):
            notification.additional_data = additional_data
            notification.save()
    
    return notification

def create_booking_confirmation_notification(booking):
    """
    Creates a rich booking confirmation notification with detailed information.
    """
    # Format times nicely
    start_time_formatted = booking.start_time.strftime("%A, %B %d at %I:%M %p")
    end_time_formatted = booking.end_time.strftime("%I:%M %p")
    
    # Calculate duration
    duration_minutes = int((booking.end_time - booking.start_time).total_seconds() / 60)
    hours = duration_minutes // 60
    minutes = duration_minutes % 60
    duration_formatted = f"{hours} hour{'s' if hours != 1 else ''}"
    if minutes > 0:
        duration_formatted += f" {minutes} minute{'s' if minutes != 1 else ''}"
    
    # Create a more detailed message
    message = (
        f"Your booking has been confirmed!\n\n"
        f"📅 Date & Time: {start_time_formatted} to {end_time_formatted}\n"
        f"⏱️ Duration: {duration_formatted}\n"
        f"🅿️ Parking Slot: {booking.slot.slot_number}"
    )
    
    if booking.slot.parking_lot:
        message += f"\n📍 Location: {booking.slot.parking_lot.name}"
    
    message += f"\n💰 Total Price: ${booking.total_price}"
    
    if booking.vehicle:
        message += f"\n🚗 Vehicle: {booking.vehicle.model} ({booking.vehicle.number_plate})"
    
    # Additional data for rich display
    additional_data = {
        'booking_id': str(booking.id),
        'start_time': booking.start_time.isoformat(),
        'end_time': booking.end_time.isoformat(),
        'slot_number': booking.slot.slot_number,
        'price': str(booking.total_price),
        'can_extend': True,
        'can_cancel': True,
        'directions_url': f"/directions?slot={booking.slot.id}"
    }
    
    return create_rich_notification(
        user=booking.user,
        notification_type='booking_confirmation',
        title='Booking Confirmed!',
        message=message,
        related_object_id=str(booking.id),
        related_object_type='Booking',
        additional_data=additional_data
    )

def create_booking_reminder_notification(booking, time_before=None):
    """
    Creates a reminder notification for an upcoming booking.
    
    Parameters:
        booking: The booking to create a reminder for
        time_before: How long before the booking to send the reminder (default: 30 minutes)
    """
    if time_before is None:
        time_before = timedelta(minutes=30)
    
    # Calculate when the reminder should be sent
    reminder_time = booking.start_time - time_before
    
    # Format times nicely
    start_time_formatted = booking.start_time.strftime("%I:%M %p")
    
    # Create the reminder message
    message = (
        f"Your booking for slot {booking.slot.slot_number} is starting soon at {start_time_formatted}.\n\n"
    )
    
    if booking.slot.parking_lot:
        message += f"📍 Location: {booking.slot.parking_lot.name}\n"
    
    message += "Tap for directions to your parking slot."
    
    # Additional data for rich display
    additional_data = {
        'booking_id': str(booking.id),
        'start_time': booking.start_time.isoformat(),
        'end_time': booking.end_time.isoformat(),
        'slot_number': booking.slot.slot_number,
        'directions_url': f"/directions?slot={booking.slot.id}"
    }
    
    # Check if the reminder time is in the future
    now = timezone.now()
    if reminder_time > now:
        # TODO: Schedule the notification to be sent at reminder_time
        # Background task scheduling is disabled for now
        # from background_task.tasks import Task
        # Task.objects.create(
        #     task_name='api.notification_utils.schedule_booking_reminder',
        #     task_params=(booking.user.id, str(booking.id), message, additional_data),
        #     run_at=reminder_time,
        #     verbose_name=f"Reminder for booking {booking.id}"
        # )
        print(f"Would schedule reminder for booking {booking.id} at {reminder_time}")
    else:
        # If the reminder time has already passed, create the notification immediately
        create_rich_notification(
            user=booking.user,
            notification_type='booking_reminder',
            title='Booking Starting Soon!',
            message=message,
            related_object_id=str(booking.id),
            related_object_type='Booking',
            additional_data=additional_data
        )

@background(schedule=60)
def schedule_booking_reminder(booking_id, days_before=1):
    """
    Schedule a reminder notification for an upcoming booking.
    Will be sent 'days_before' days before the booking start time.
    """
    try:
        # Import Task here to avoid circular imports - temporarily commented out
        # from background_task.tasks import Task
        
        # Get the booking
        booking = Booking.objects.get(pk=booking_id)
    except Booking.DoesNotExist:
        # If booking is deleted before reminder, do nothing.
        pass

def create_booking_extension_notification(booking, extension_time, extension_price, is_automatic=False):
    """
    Creates a notification for a booking extension.
    """
    # Format times nicely
    new_end_time_formatted = booking.end_time.strftime("%A, %B %d at %I:%M %p")
    
    # Create the extension message
    extension_type = "automatically " if is_automatic else ""
    message = (
        f"Your booking has been {extension_type}extended.\n\n"
        f"📅 New End Time: {new_end_time_formatted}\n"
        f"💰 Additional Cost: ${extension_price}\n"
        f"💵 New Total: ${booking.total_price}"
    )
    
    title = "Booking Automatically Extended" if is_automatic else "Booking Extended"
    
    # Additional data for rich display
    additional_data = {
        'booking_id': str(booking.id),
        'extension_time': extension_time.isoformat() if hasattr(extension_time, 'isoformat') else str(extension_time),
        'extension_price': str(extension_price),
        'new_end_time': booking.end_time.isoformat(),
        'new_total_price': str(booking.total_price),
        'is_automatic': is_automatic
    }
    
    return create_rich_notification(
        user=booking.user,
        notification_type='booking_update',
        title=title,
        message=message,
        related_object_id=str(booking.id),
        related_object_type='Booking',
        additional_data=additional_data
    )

def create_payment_receipt_notification(booking):
    """
    Creates a payment receipt notification with detailed breakdown.
    """
    # Format times for display
    start_time_formatted = booking.start_time.strftime("%a, %b %d, %Y at %I:%M %p")
    end_time_formatted = booking.end_time.strftime("%a, %b %d, %Y at %I:%M %p")
    
    # Calculate duration in hours and minutes
    duration_seconds = (booking.end_time - booking.start_time).total_seconds()
    hours = int(duration_seconds // 3600)
    minutes = int((duration_seconds % 3600) // 60)
    
    # Format duration
    duration_text = f"{hours} hour{'s' if hours != 1 else ''}"
    if minutes > 0:
        duration_text += f" {minutes} minute{'s' if minutes != 1 else ''}"
    
    # Create detailed message with receipt-like formatting
    message = (
        f"Thank you for using our parking service!\n\n"
        f"🧾 RECEIPT\n"
        f"-------------------\n"
        f"📆 From: {start_time_formatted}\n"
        f"📆 To: {end_time_formatted}\n"
        f"⏱️ Duration: {duration_text}\n"
        f"🅿️ Slot: {booking.slot.slot_number}"
    )
    
    # Add parking lot name if available
    if booking.slot.parking_lot:
        message += f"\n📍 Location: {booking.slot.parking_lot.name}"
    
    # Add vehicle details if available
    if booking.vehicle:
        message += f"\n🚗 Vehicle: {booking.vehicle.model} ({booking.vehicle.number_plate})"
    
    # Add pricing breakdown
    message += f"\n\n💰 CHARGES\n-------------------\n"
    
    # Base charge
    base_price = booking.total_price
    if booking.extension_count > 0:
        # If there were extensions, calculate the original price
        # This is an approximation assuming we don't store the original price separately
        extension_prices = sum(float(ext.get('additional_cost', 0)) 
                               for ext in booking.extension_history)
        base_price = booking.total_price - extension_prices
        
        message += f"Base Charge: ${base_price:.2f}\n"
        
        # Add extension charges
        for i, extension in enumerate(booking.extension_history):
            ext_cost = float(extension.get('additional_cost', 0))
            message += f"Extension {i+1}: ${ext_cost:.2f}\n"
    
    # Total
    message += f"\nTotal Paid: ${booking.total_price:.2f}"
    
    # Additional data for rich receipt display
    additional_data = {
        'booking_id': str(booking.id),
        'receipt_id': f"RCT-{booking.id}-{int(timezone.now().timestamp())}",
        'start_time': booking.start_time.isoformat(),
        'end_time': booking.end_time.isoformat(),
        'duration_seconds': int(duration_seconds),
        'slot_number': booking.slot.slot_number,
        'vehicle': booking.vehicle.number_plate if booking.vehicle else None,
        'total_amount': str(booking.total_price),
        'base_amount': str(base_price),
        'extensions': booking.extension_history
    }
    
    return create_rich_notification(
        user=booking.user,
        notification_type='payment_confirmation',
        title='Payment Receipt',
        message=message,
        related_object_id=str(booking.id),
        related_object_type='Booking',
        additional_data=additional_data
    )