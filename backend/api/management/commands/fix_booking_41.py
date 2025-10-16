from django.core.management.base import BaseCommand
from api.models import Booking

class Command(BaseCommand):
    help = 'Fix slot number display issue for booking #41'

    def handle(self, *args, **options):
        try:
            booking = Booking.objects.get(id=41)
            
            # Get the actual slot number from the slot relationship
            actual_slot_number = booking.slot.slot_number
            
            self.stdout.write(self.style.SUCCESS(f"Booking #41 has slot '{actual_slot_number}' in database"))
            
            # Now let's check the specific issue for booking #41
            if actual_slot_number == "195":
                self.stdout.write(self.style.WARNING(f"Booking #41 has numeric slot '195' instead of expected 'A17'"))
                
                # Verify if A17 slot exists
                from api.models import ParkingSlot
                try:
                    a17_slot = ParkingSlot.objects.get(slot_number="A17")
                    self.stdout.write(self.style.SUCCESS(f"Found slot A17 in database with ID {a17_slot.id}"))
                    
                    # Update booking to use A17 slot
                    booking.slot = a17_slot
                    booking.save()
                    self.stdout.write(self.style.SUCCESS(f"Updated booking #41 to use slot A17"))
                except ParkingSlot.DoesNotExist:
                    self.stdout.write(self.style.ERROR(f"Slot A17 does not exist in the database"))
            else:
                self.stdout.write(self.style.SUCCESS(f"Booking #41 already has the expected slot number"))
        
        except Booking.DoesNotExist:
            self.stdout.write(self.style.ERROR("Booking #41 not found"))