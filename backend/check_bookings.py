import os
import django
import sys

# Add the project directory to the path
sys.path.insert(0, r'c:\Projects\parking-system\backend')

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Booking, ParkingSlot
from django.utils import timezone
from datetime import datetime, timedelta

print("\n" + "="*80)
print("CHECKING ACTIVE BOOKINGS")
print("="*80 + "\n")

# Get all active bookings
active_bookings = Booking.objects.filter(is_active=True).select_related('slot', 'vehicle', 'user')

print(f"Total active bookings: {active_bookings.count()}\n")

if active_bookings.exists():
    for booking in active_bookings:
        print(f"{'='*80}")
        print(f"Booking ID: {booking.id}")
        print(f"Status: {booking.status}")
        print(f"User: {booking.user.username} ({booking.user.email})")
        print(f"Vehicle: {booking.vehicle.number_plate if booking.vehicle else 'No vehicle'}")
        print(f"Slot: {booking.slot.slot_number} (Floor: {booking.slot.floor}, Section: {booking.slot.section})")
        print(f"Zone: {booking.slot.get_parking_zone_display()}")
        print(f"Start Time: {booking.start_time}")
        print(f"End Time: {booking.end_time}")
        print(f"Is Occupied: {booking.slot.is_occupied}")
        
        # Check if it's current
        now = timezone.now()
        if booking.start_time <= now <= booking.end_time:
            print(f"⏰ STATUS: Currently Active (In Progress)")
        elif now < booking.start_time:
            time_until = booking.start_time - now
            hours = int(time_until.total_seconds() / 3600)
            print(f"⏰ STATUS: Future Booking (Starts in {hours} hours)")
        else:
            print(f"⏰ STATUS: Past Booking (Should be cleaned up)")
        
        print(f"{'='*80}\n")
else:
    print("No active bookings found.\n")

# Check for specific date conflicts
print("\n" + "="*80)
print("CHECKING FOR CONFLICTS ON OCTOBER 23, 2025")
print("="*80 + "\n")

# The time range user is trying to book
target_start = datetime(2025, 10, 23, 0, 0, 0)  # Oct 23, 2025
target_end = target_start + timedelta(hours=21)  # 21 hours later

print(f"User's requested time: {target_start} to {target_end}\n")

# Find conflicting bookings
conflicting = Booking.objects.filter(
    is_active=True,
    start_time__lt=target_end,
    end_time__gt=target_start
).select_related('slot', 'vehicle', 'user')

if conflicting.exists():
    print(f"Found {conflicting.count()} conflicting booking(s):\n")
    for booking in conflicting:
        print(f"Booking ID: {booking.id}")
        print(f"Slot: {booking.slot.slot_number}")
        print(f"Vehicle: {booking.vehicle.number_plate if booking.vehicle else 'No vehicle'}")
        print(f"Time: {booking.start_time} to {booking.end_time}")
        print(f"Overlap Period: {max(booking.start_time, target_start)} to {min(booking.end_time, target_end)}")
        print("-" * 80 + "\n")
else:
    print("No conflicting bookings found for this time period.\n")

# Show all slots status
print("\n" + "="*80)
print("PARKING SLOTS STATUS")
print("="*80 + "\n")

slots = ParkingSlot.objects.all()[:20]  # Show first 20 slots
for slot in slots:
    status = "🔴 OCCUPIED" if slot.is_occupied else "🟢 AVAILABLE"
    bookings_count = Booking.objects.filter(slot=slot, is_active=True).count()
    print(f"Slot {slot.slot_number} ({slot.get_parking_zone_display()}): {status} - Active Bookings: {bookings_count}")

print("\n" + "="*80)
