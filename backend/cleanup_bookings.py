import os
import django
import sys

sys.path.insert(0, r'c:\Projects\parking-system\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Booking
from django.utils import timezone

print("\n" + "="*80)
print("CLEANING UP OLD BOOKINGS")
print("="*80 + "\n")

# Find bookings that are checked_out but still active
checked_out_active = Booking.objects.filter(
    status='checked_out',
    is_active=True
)

print(f"Found {checked_out_active.count()} checked-out bookings marked as active\n")

if checked_out_active.exists():
    print("Deactivating these bookings...\n")
    for booking in checked_out_active:
        print(f"- Booking #{booking.id}: {booking.vehicle.number_plate if booking.vehicle else 'No vehicle'}")
        print(f"  Slot: {booking.slot.slot_number}")
        print(f"  Status: {booking.status}")
        print(f"  Time: {booking.start_time} to {booking.end_time}")
        
        # Deactivate
        booking.is_active = False
        booking.save()
        
        # Free slot if needed
        if booking.slot.is_occupied:
            # Check if there are other active bookings for this slot
            other_bookings = Booking.objects.filter(
                slot=booking.slot,
                is_active=True,
                status='checked_in'
            ).exclude(id=booking.id)
            
            if not other_bookings.exists():
                booking.slot.is_occupied = False
                booking.slot.save()
                print(f"  ✓ Freed slot {booking.slot.slot_number}")
        
        print(f"  ✓ Deactivated\n")

print("\n" + "="*80)
print("CLEANUP COMPLETE!")
print("="*80)

# Show updated status
active_count = Booking.objects.filter(is_active=True).count()
print(f"\nRemaining active bookings: {active_count}")
