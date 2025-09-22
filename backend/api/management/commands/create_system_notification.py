from django.core.management.base import BaseCommand
from api.models import User, Notification
from api.views import create_system_notification, create_emergency_alert, create_scheduled_maintenance_alert
from datetime import datetime


class Command(BaseCommand):
    help = 'Create system alerts and maintenance notifications'

    def add_arguments(self, parser):
        parser.add_argument('--type', type=str, required=True, 
                          choices=['alert', 'maintenance', 'emergency'],
                          help='Type of notification to create')
        parser.add_argument('--title', type=str, required=True, 
                          help='Notification title')
        parser.add_argument('--message', type=str, required=True, 
                          help='Notification message')
        parser.add_argument('--target', type=str, default='all',
                          choices=['all', 'customers', 'admins', 'security'],
                          help='Target user group')
        parser.add_argument('--maintenance-date', type=str,
                          help='Maintenance date in ISO format (YYYY-MM-DD HH:MM:SS)')
        parser.add_argument('--duration', type=int, default=2,
                          help='Maintenance duration in hours')

    def handle(self, *args, **options):
        notification_type = options['type']
        title = options['title']
        message = options['message']
        target = options['target']

        try:
            if notification_type == 'emergency':
                create_emergency_alert(title, message)
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Emergency alert "{title}" created successfully for all users.'
                    )
                )
                
            elif notification_type == 'maintenance':
                maintenance_date = options.get('maintenance_date')
                duration = options.get('duration', 2)
                
                if maintenance_date:
                    maintenance_datetime = datetime.fromisoformat(maintenance_date)
                    create_scheduled_maintenance_alert(maintenance_datetime, duration)
                else:
                    # Create immediate maintenance notification
                    users = User.objects.filter(is_active=True)
                    create_system_notification(
                        notification_type='maintenance',
                        title=title,
                        message=message,
                        users=users
                    )
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Maintenance notification "{title}" created successfully.'
                    )
                )
                
            elif notification_type == 'alert':
                # Determine target user groups
                if target == 'customers':
                    users = User.objects.filter(role='customer', is_active=True)
                elif target == 'admins':
                    users = User.objects.filter(role='admin', is_active=True)
                elif target == 'security':
                    users = User.objects.filter(role='security', is_active=True)
                else:  # 'all'
                    users = User.objects.filter(is_active=True)
                
                create_system_notification(
                    notification_type='system_alert',
                    title=title,
                    message=message,
                    users=users
                )
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'System alert "{title}" created for {users.count()} users in group "{target}".'
                    )
                )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating notification: {str(e)}')
            )
