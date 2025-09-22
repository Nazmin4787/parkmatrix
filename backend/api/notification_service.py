"""
Notification Service for the Car Parking System

This module provides functions to create various types of in-app notifications
for users of the car parking system.
"""

from django.utils import timezone
from datetime import timedelta
from .models import Notification, User, Booking, Vehicle, ParkingLot

def create_notification(user, notification_type, title, message, related_object=None, related_object_type=None):
    """
    Create a new notification for a user.
    
    Args:
        user: The User object who will receive the notification
        notification_type: The type of notification (from Notification.NOTIFICATION_TYPES)
        title: The notification title
        message: The detailed notification message
        related_object: Optional related object (e.g., a Booking instance)
        related_object_type: Optional string specifying the type of related object
        
    Returns:
        The created Notification instance
    """
    notification = Notification(
        user=user,
        notification_type=notification_type,
        title=title,
        message=message
    )
    
    if related_object and hasattr(related_object, 'id'):
        notification.related_object_id = str(related_object.id)
        notification.related_object_type = related_object_type or related_object.__class__.__name__
        
    notification.save()
    return notification

def send_booking_confirmation_notification(booking):
    """
    Create a notification for a booking confirmation.
    
    Args:
        booking: The Booking object that was created
        
    Returns:
        The created Notification instance
    """
    user = booking.user
    slot = booking.slot
    vehicle = booking.vehicle
    
    title = f"Booking Confirmed: Slot {slot.slot_number}"
    message = f"""Your parking booking has been confirmed.
    
    Details:
    - Parking Lot: {slot.parking_lot.name if slot.parking_lot else 'N/A'}
    - Slot: {slot.slot_number} (Floor {slot.floor}, Section {slot.section})
    - Vehicle: {vehicle.number_plate} ({vehicle.model}, {vehicle.color})
    - Start Time: {booking.start_time.strftime('%Y-%m-%d %H:%M')}
    
    Thank you for using our parking service.
    """
    
    return create_notification(
        user=user,
        notification_type='booking_confirmation',
        title=title,
        message=message,
        related_object=booking,
        related_object_type='Booking'
    )

def send_booking_reminder_notification(booking, minutes_left):
    """
    Create a reminder notification for an upcoming booking expiry.
    
    Args:
        booking: The Booking object that is about to expire
        minutes_left: Number of minutes left until expiry
        
    Returns:
        The created Notification instance
    """
    user = booking.user
    slot = booking.slot
    
    title = f"Reminder: Your parking session ends in {minutes_left} minutes"
    message = f"""Your parking session for slot {slot.slot_number} will expire soon.
    
    - Parking Lot: {slot.parking_lot.name if slot.parking_lot else 'N/A'}
    - Slot: {slot.slot_number} (Floor {slot.floor}, Section {slot.section})
    - Time Remaining: {minutes_left} minutes
    
    Please return to your vehicle or extend your booking if needed.
    """
    
    return create_notification(
        user=user,
        notification_type='booking_reminder',
        title=title,
        message=message,
        related_object=booking,
        related_object_type='Booking'
    )

def send_booking_cancellation_notification(booking):
    """
    Create a notification for a cancelled booking.
    
    Args:
        booking: The Booking object that was cancelled
        
    Returns:
        The created Notification instance
    """
    user = booking.user
    slot = booking.slot
    
    title = f"Booking Cancelled: Slot {slot.slot_number}"
    message = f"""Your parking booking has been cancelled.
    
    Details:
    - Parking Lot: {slot.parking_lot.name if slot.parking_lot else 'N/A'}
    - Slot: {slot.slot_number} (Floor {slot.floor}, Section {slot.section})
    - Start Time: {booking.start_time.strftime('%Y-%m-%d %H:%M')}
    - Cancellation Time: {timezone.now().strftime('%Y-%m-%d %H:%M')}
    
    Thank you for using our parking service.
    """
    
    return create_notification(
        user=user,
        notification_type='booking_cancelled',
        title=title,
        message=message,
        related_object=booking,
        related_object_type='Booking'
    )

def send_registration_notification(user):
    """
    Create a notification for a new user registration.
    
    Args:
        user: The User object who just registered
        
    Returns:
        The created Notification instance
    """
    title = "Welcome to Car Parking System"
    message = f"""Welcome, {user.username}!
    
    Thank you for registering with our Car Parking System. You can now book parking slots and manage your vehicles.
    
    Get started by adding your vehicle details and booking a parking slot.
    """
    
    return create_notification(
        user=user,
        notification_type='account_update',
        title=title,
        message=message
    )

def send_lot_status_notification(parking_lot, is_full=False):
    """
    Create notifications for all users about parking lot occupancy.
    
    Args:
        parking_lot: The ParkingLot object whose status changed
        is_full: Boolean indicating if the lot is now full or has spaces available
        
    Returns:
        List of created Notification instances
    """
    # Find users who have active bookings in this parking lot
    active_bookings = Booking.objects.filter(
        slot__parking_lot=parking_lot,
        is_active=True
    ).select_related('user').distinct('user')
    
    users = [booking.user for booking in active_bookings]
    
    # Set notification details based on lot status
    if is_full:
        notification_type = 'lot_full'
        title = f"Parking Lot Full: {parking_lot.name}"
        message = f"""The parking lot at {parking_lot.name} is currently at full capacity.
        
        Address: {parking_lot.address}
        
        Please consider using alternative parking options if you're planning to visit.
        """
    else:
        notification_type = 'lot_available'
        title = f"Parking Available: {parking_lot.name}"
        message = f"""Parking spaces are now available at {parking_lot.name}.
        
        Address: {parking_lot.address}
        
        Book now to secure your spot!
        """
    
    # Create notifications for all relevant users
    notifications = []
    for user in users:
        notification = create_notification(
            user=user,
            notification_type=notification_type,
            title=title,
            message=message,
            related_object=parking_lot,
            related_object_type='ParkingLot'
        )
        notifications.append(notification)
        
    return notifications
