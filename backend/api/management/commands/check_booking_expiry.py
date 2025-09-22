from django.core.management.base import BaseCommand
from api.views import check_and_notify_booking_expiry


class Command(BaseCommand):
    help = 'Check for expiring bookings and send notifications'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without actually creating notifications',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            from api.models import Booking, Notification
            from datetime import timedelta
            from django.utils import timezone
            
            # Find bookings expiring within the next 30 minutes
            upcoming_expiry = timezone.now() + timedelta(minutes=30)
            expiring_bookings = Booking.objects.filter(
                is_active=True,
                end_time__lte=upcoming_expiry,
                end_time__gt=timezone.now()
            )
            
            self.stdout.write(
                self.style.WARNING(f'DRY RUN: Found {expiring_bookings.count()} bookings expiring within 30 minutes')
            )
            
            for booking in expiring_bookings:
                # Check if notification already exists
                existing_notification = Notification.objects.filter(
                    user=booking.user,
                    notification_type='booking_expiry',
                    related_object_id=str(booking.id),
                    related_object_type='Booking'
                ).exists()
                
                status = "ALREADY NOTIFIED" if existing_notification else "NEEDS NOTIFICATION"
                self.stdout.write(
                    f'  - Booking {booking.id} for user {booking.user.username} '
                    f'(slot {booking.slot.slot_number}) - {status}'
                )
        else:
            try:
                check_and_notify_booking_expiry()
                self.stdout.write(
                    self.style.SUCCESS('Successfully checked and created expiry notifications.')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error checking expiry notifications: {str(e)}')
                )
