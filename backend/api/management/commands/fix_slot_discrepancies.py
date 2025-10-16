from django.core.management.base import BaseCommand
from api.models import Booking, ParkingSlot, Vehicle

class Command(BaseCommand):
    help = 'Fix UI and database slot number discrepancies'

    def add_arguments(self, parser):
        parser.add_argument('--booking_id', type=int, help='Specific booking ID to fix')
        parser.add_argument('--check_all', action='store_true', help='Check all bookings for discrepancies')
        parser.add_argument('--fix', action='store_true', help='Actually fix the discrepancies (otherwise just report)')

    def handle(self, *args, **options):
        booking_id = options.get('booking_id')
        check_all = options.get('check_all')
        fix_mode = options.get('fix')
        
        if booking_id:
            self.stdout.write(f"Checking booking #{booking_id}")
            try:
                booking = Booking.objects.get(id=booking_id)
                self.check_booking(booking, fix_mode)
            except Booking.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"Booking #{booking_id} not found"))
                return
        elif check_all:
            self.stdout.write("Checking all active bookings...")
            bookings = Booking.objects.filter(status__in=['confirmed', 'checked_in'])
            for booking in bookings:
                self.check_booking(booking, fix_mode)
        else:
            self.stdout.write("Please specify --booking_id or --check_all")
    
    def check_booking(self, booking, fix_mode):
        """Check and optionally fix a single booking's slot data"""
        self.stdout.write(f"\nBooking #{booking.id}:")
        self.stdout.write(f"  Status: {booking.status}")
        self.stdout.write(f"  User: {booking.user.username}")
        
        if booking.vehicle:
            self.stdout.write(f"  Vehicle: {booking.vehicle.number_plate}")
        else:
            self.stdout.write("  Vehicle: None")
        
        if booking.slot:
            self.stdout.write(f"  Slot in DB: {booking.slot.slot_number}")
        else:
            self.stdout.write("  Slot in DB: None")
        
        # Known slot discrepancies based on UI observations
        known_discrepancies = {
            # booking_id: (current_slot_number, ui_slot_number)
            38: ('A4', '239'),
            41: ('A17', '195'),
            40: ('A5', '238'),
        }
        
        if booking.id in known_discrepancies and booking.slot:
            current_slot, ui_slot = known_discrepancies[booking.id]
            
            # Verify the current slot number
            if booking.slot.slot_number == current_slot:
                self.stdout.write(self.style.WARNING(f"  Found potential UI discrepancy: Slot {current_slot} may show as {ui_slot} in UI"))
                
                if fix_mode:
                    # Try to find the UI slot number
                    ui_slot_obj = ParkingSlot.objects.filter(slot_number=ui_slot).first()
                    
                    if not ui_slot_obj:
                        # Create the UI slot if it doesn't exist
                        self.stdout.write(f"  Creating slot {ui_slot}...")
                        ui_slot_obj = ParkingSlot.objects.create(
                            slot_number=ui_slot,
                            floor=booking.slot.floor,
                            section=booking.slot.section,
                            vehicle_type=booking.slot.vehicle_type
                        )
                    
                    # Update booking to use UI slot
                    old_slot = booking.slot.slot_number
                    booking.slot = ui_slot_obj
                    booking.save()
                    self.stdout.write(self.style.SUCCESS(f"  ✓ Fixed: Changed slot from {old_slot} to {ui_slot}"))
        else:
            self.stdout.write("  No known discrepancies found")
