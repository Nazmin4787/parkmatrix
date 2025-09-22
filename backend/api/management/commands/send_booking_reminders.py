"""
Command to send reminder emails for upcoming bookings.
Run this command via a cron job to automate the reminder emails.
"""
from django.core.management.base import BaseCommand
from api.models import Booking
from api.email_service import send_booking_reminder_email
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Sends reminder emails for bookings that are scheduled to begin soon'

    def add_arguments(self, parser):
        parser.add_argument(
            '--hours',
            type=int,
            default=24,
            help='Send reminders for bookings starting within this many hours',
        )

    def handle(self, *args, **options):
        hours_ahead = options['hours']
        now = timezone.now()
        reminder_window = now + timezone.timedelta(hours=hours_ahead)
        
        # Get active bookings that start within the reminder window
        upcoming_bookings = Booking.objects.filter(
            is_active=True,
            start_time__gt=now,
            start_time__lte=reminder_window
        )
        
        reminder_count = 0
        for booking in upcoming_bookings:
            try:
                send_booking_reminder_email(booking)
                reminder_count += 1
                self.stdout.write(self.style.SUCCESS(
                    f'Sent reminder email for booking {booking.id} to user {booking.user.email}'
                ))
            except Exception as e:
                logger.error(f"Failed to send reminder for booking {booking.id}: {str(e)}")
        
        self.stdout.write(self.style.SUCCESS(
            f'Successfully sent {reminder_count} reminder emails for bookings in the next {hours_ahead} hours'
        ))
