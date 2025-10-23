"""
Check and display parking zones for all slots
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import ParkingSlot

print("\n" + "="*60)
print("PARKING SLOT ZONES CHECK")
print("="*60 + "\n")

slots = ParkingSlot.objects.all()

print(f"Total slots: {slots.count()}\n")

# Group by zone
zones = {}
for slot in slots:
    zone = slot.parking_zone
    if zone not in zones:
        zones[zone] = []
    zones[zone].append(slot)

print("Slots by Zone:")
print("-" * 60)
for zone_code, zone_slots in zones.items():
    zone_name = dict(ParkingSlot.PARKING_ZONE_CHOICES).get(zone_code, zone_code)
    print(f"\n{zone_name} ({zone_code}):")
    print(f"  Total: {len(zone_slots)}")
    print(f"  Sample slots: {', '.join([s.slot_number for s in zone_slots[:5]])}")
    if len(zone_slots) > 5:
        print(f"  ... and {len(zone_slots) - 5} more")

print("\n" + "="*60)
