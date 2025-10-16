from django.core.management.base import BaseCommand
from api.models import ParkingSlot, ParkingLot
from django.db import transaction

class Command(BaseCommand):
    help = 'Add new parking slots with consistent numbering'

    def add_arguments(self, parser):
        parser.add_argument(
            'parking_lot_id',
            type=int,
            help='ID of the parking lot to add slots to'
        )
        parser.add_argument(
            '--sections',
            type=str,
            default='A,B,C',
            help='Comma-separated list of sections (e.g., "A,B,C")'
        )
        parser.add_argument(
            '--slots-per-section',
            type=int,
            default=20,
            help='Number of slots per section'
        )
        parser.add_argument(
            '--floor',
            type=str,
            default='1',
            help='Floor number for the slots'
        )
        parser.add_argument(
            '--vehicle-type',
            type=str,
            default='any',
            choices=['car', 'suv', 'bike', 'truck', 'any'],
            help='Vehicle type for the slots'
        )

    def handle(self, *args, **options):
        parking_lot_id = options['parking_lot_id']
        sections = options['sections'].split(',')
        slots_per_section = options['slots_per_section']
        floor = options['floor']
        vehicle_type = options['vehicle_type']
        
        try:
            parking_lot = ParkingLot.objects.get(id=parking_lot_id)
        except ParkingLot.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Parking lot with ID {parking_lot_id} does not exist'))
            return
        
        # Create slots in a transaction to ensure consistency
        try:
            with transaction.atomic():
                slots_created = 0
                
                # Get current max position for layout
                max_x = ParkingSlot.objects.filter(parking_lot=parking_lot).order_by('-pos_x').values_list('pos_x', flat=True).first() or 0
                
                for section in sections:
                    section = section.strip()
                    self.stdout.write(f"Creating slots for Section {section}...")
                    
                    # For positioning: each section starts at a new row
                    max_x += 1
                    pos_y = 0
                    
                    for i in range(1, slots_per_section + 1):
                        slot_number = f"{section}{i}"
                        
                        # Check if slot with this number already exists
                        if ParkingSlot.objects.filter(parking_lot=parking_lot, slot_number=slot_number).exists():
                            self.stdout.write(self.style.WARNING(f'Slot {slot_number} already exists, skipping'))
                            continue
                        
                        # Create the slot
                        ParkingSlot.objects.create(
                            parking_lot=parking_lot,
                            slot_number=slot_number,
                            floor=floor,
                            section=section,
                            pos_x=max_x,
                            pos_y=pos_y,
                            is_occupied=False,
                            vehicle_type=vehicle_type
                        )
                        
                        pos_y += 1
                        slots_created += 1
                
                self.stdout.write(self.style.SUCCESS(f'Successfully created {slots_created} parking slots'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating slots: {e}'))
            return