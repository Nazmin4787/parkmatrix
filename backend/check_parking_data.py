#!/usr/bin/env python
import os
import sys
import django

# Set up Django environment
sys.path.append(r'C:\Projects\parking-system\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

django.setup()

from api.models import ParkingLot, ParkingSlot

def check_parking_data():
    print("🅿️ Checking parking lots and slots...")
    
    # Check parking lots
    lots = ParkingLot.objects.all()
    print(f"\nFound {lots.count()} parking lots:")
    for lot in lots:
        print(f"  ID: {lot.id} - {lot.name} ({lot.address})")
    
    # Check parking slots
    slots = ParkingSlot.objects.all()
    print(f"\nFound {slots.count()} parking slots:")
    for slot in slots[:5]:  # Show first 5 slots
        print(f"  ID: {slot.id} - Slot {slot.slot_number} (Type: {slot.vehicle_type}, Lot: {slot.parking_lot})")
    
    if slots.count() > 5:
        print(f"  ... and {slots.count() - 5} more slots")
    
    # If no parking lots exist, create one
    if lots.count() == 0:
        print("\n🏗️ Creating a default parking lot...")
        default_lot = ParkingLot.objects.create(
            name="Main Parking Lot",
            address="123 Main Street, City, State",
            latitude=40.7128,
            longitude=-74.0060,
            hourly_rate=5.00,
            daily_rate=25.00,
            monthly_rate=150.00
        )
        print(f"✅ Created parking lot: ID {default_lot.id} - {default_lot.name}")

if __name__ == '__main__':
    check_parking_data()