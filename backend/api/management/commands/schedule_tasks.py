from django.core.management.base import BaseCommand
from api import tasks

class Command(BaseCommand):
    help = 'Schedule recurring background tasks for the application'

    def handle(self, *args, **options):
        # Schedule the overstayed bookings task if not already scheduled
        # Temporarily commented out due to compatibility issues
        # from background_task.models import Task
        
        # Clear existing tasks to avoid duplicates
        # Task.objects.filter(verbose_name="process_overstayed").delete()
        # Task.objects.filter(verbose_name="send_booking_reminders").delete()
        
        # Schedule new tasks - temporarily commented out
        # tasks.process_overstayed_bookings(repeat=60, repeat_until=None, verbose_name="process_overstayed")
        self.stdout.write(self.style.SUCCESS('Background tasks temporarily disabled due to compatibility issues'))
        
        # tasks.send_booking_reminders(repeat=300, repeat_until=None, verbose_name="send_booking_reminders")
        # self.stdout.write(self.style.SUCCESS('Scheduled booking reminders task'))