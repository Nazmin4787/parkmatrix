from django.core.management.base import BaseCommand
from api.models import ParkingSlot, Booking
from django.db.models import Count
from django.utils import timezone

class Command(BaseCommand):
    help = 'Safely clear all slot data from the database while preserving bookings'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force clearing slots even if active bookings exist',
        )
        parser.add_argument(
            '--preserve-active',
            action='store_true',
            help='Preserve slots that have active bookings',
        )

    def handle(self, *args, **options):
        force = options['force']
        preserve_active = options['preserve_active']
        
        # Check for active bookings first
        active_bookings = Booking.objects.filter(is_active=True).count()
        
        if active_bookings > 0 and not force and not preserve_active:
            self.stdout.write(self.style.WARNING(
                f'Warning: There are {active_bookings} active bookings in the system. '
                f'Use --force to clear all slots anyway, or --preserve-active to keep slots with active bookings.'
            ))
            return
        
        # Get slots with active bookings if we need to preserve them
        slots_to_preserve = []
        if preserve_active and not force:
            slots_with_bookings = ParkingSlot.objects.filter(
                booking__is_active=True
            ).distinct()
            slots_to_preserve = list(slots_with_bookings.values_list('id', flat=True))
            self.stdout.write(self.style.SUCCESS(
                f'Will preserve {len(slots_to_preserve)} slots with active bookings'
            ))
        
        # Count slots before deletion
        total_slots = ParkingSlot.objects.count()
        
        # Delete slots (with appropriate filtering)
        if preserve_active and not force:
            # Delete only slots without active bookings
            slots_to_delete = ParkingSlot.objects.exclude(id__in=slots_to_preserve)
            deleted_count = slots_to_delete.count()
            slots_to_delete.delete()
        else:
            # Delete all slots
            deleted_count = total_slots
            ParkingSlot.objects.all().delete()
        
        self.stdout.write(self.style.SUCCESS(f'Successfully deleted {deleted_count} parking slots'))
        if preserve_active and not force:
            self.stdout.write(self.style.SUCCESS(f'Preserved {len(slots_to_preserve)} slots with active bookings'))