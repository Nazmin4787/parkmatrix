from django.core.management.base import BaseCommand
from api.models import ParkingSlot

class Command(BaseCommand):
    help = 'Set default vehicle types for existing parking slots'

    def add_arguments(self, parser):
        parser.add_argument(
            '--vehicle-type',
            type=str,
            default='any',
            help='Default vehicle type to assign to existing slots'
        )

    def handle(self, *args, **options):
        vehicle_type = options['vehicle_type']
        
        # Update all existing slots that don't have a vehicle_type set
        updated_count = ParkingSlot.objects.filter(
            vehicle_type__isnull=True
        ).update(vehicle_type=vehicle_type)
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully updated {updated_count} slots to vehicle type: {vehicle_type}'
            )
        )