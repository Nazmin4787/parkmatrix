#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Now we can import Django models
from api.models import ParkingSlot, ParkingLot

def create_sample_slots():
    """Create sample parking slots with different vehicle types"""
    
    # Get the first parking lot
    parking_lot = ParkingLot.objects.first()
    if not parking_lot:
        print("❌ No parking lots found. Please create a parking lot first.")
        return
    
    print(f"🅿️ Creating sample slots for parking lot: {parking_lot.name}")
    
    # Sample slot data with different vehicle types
    sample_slots = [
        # Car slots
        {'slot_number': 'C001', 'floor': '1', 'section': 'A', 'vehicle_type': 'car', 'pos_x': 10, 'pos_y': 10},
        {'slot_number': 'C002', 'floor': '1', 'section': 'A', 'vehicle_type': 'car', 'pos_x': 12, 'pos_y': 10},
        {'slot_number': 'C003', 'floor': '1', 'section': 'A', 'vehicle_type': 'car', 'pos_x': 14, 'pos_y': 10},
        {'slot_number': 'C004', 'floor': '1', 'section': 'A', 'vehicle_type': 'car', 'pos_x': 16, 'pos_y': 10},
        {'slot_number': 'C005', 'floor': '1', 'section': 'A', 'vehicle_type': 'car', 'pos_x': 18, 'pos_y': 10},
        
        # SUV slots (larger)
        {'slot_number': 'S001', 'floor': '1', 'section': 'B', 'vehicle_type': 'suv', 'pos_x': 20, 'pos_y': 10, 'width_cm': 400, 'length_cm': 600},
        {'slot_number': 'S002', 'floor': '1', 'section': 'B', 'vehicle_type': 'suv', 'pos_x': 22, 'pos_y': 10, 'width_cm': 400, 'length_cm': 600},
        {'slot_number': 'S003', 'floor': '1', 'section': 'B', 'vehicle_type': 'suv', 'pos_x': 24, 'pos_y': 10, 'width_cm': 400, 'length_cm': 600},
        
        # Bike slots (smaller)
        {'slot_number': 'B001', 'floor': '1', 'section': 'C', 'vehicle_type': 'bike', 'pos_x': 30, 'pos_y': 10, 'width_cm': 150, 'length_cm': 250},
        {'slot_number': 'B002', 'floor': '1', 'section': 'C', 'vehicle_type': 'bike', 'pos_x': 31, 'pos_y': 10, 'width_cm': 150, 'length_cm': 250},
        {'slot_number': 'B003', 'floor': '1', 'section': 'C', 'vehicle_type': 'bike', 'pos_x': 32, 'pos_y': 10, 'width_cm': 150, 'length_cm': 250},
        {'slot_number': 'B004', 'floor': '1', 'section': 'C', 'vehicle_type': 'bike', 'pos_x': 33, 'pos_y': 10, 'width_cm': 150, 'length_cm': 250},
        {'slot_number': 'B005', 'floor': '1', 'section': 'C', 'vehicle_type': 'bike', 'pos_x': 34, 'pos_y': 10, 'width_cm': 150, 'length_cm': 250},
        
        # Truck slots (largest)
        {'slot_number': 'T001', 'floor': '1', 'section': 'D', 'vehicle_type': 'truck', 'pos_x': 40, 'pos_y': 10, 'width_cm': 500, 'length_cm': 800, 'height_cm': 400},
        {'slot_number': 'T002', 'floor': '1', 'section': 'D', 'vehicle_type': 'truck', 'pos_x': 42, 'pos_y': 10, 'width_cm': 500, 'length_cm': 800, 'height_cm': 400},
        
        # Any vehicle slots (flexible)
        {'slot_number': 'A001', 'floor': '2', 'section': 'A', 'vehicle_type': 'any', 'pos_x': 50, 'pos_y': 20},
        {'slot_number': 'A002', 'floor': '2', 'section': 'A', 'vehicle_type': 'any', 'pos_x': 52, 'pos_y': 20},
        {'slot_number': 'A003', 'floor': '2', 'section': 'A', 'vehicle_type': 'any', 'pos_x': 54, 'pos_y': 20},
        {'slot_number': 'A004', 'floor': '2', 'section': 'A', 'vehicle_type': 'any', 'pos_x': 56, 'pos_y': 20},
        {'slot_number': 'A005', 'floor': '2', 'section': 'A', 'vehicle_type': 'any', 'pos_x': 58, 'pos_y': 20},
    ]
    
    created_count = 0
    skipped_count = 0
    
    for slot_data in sample_slots:
        # Check if slot already exists
        if ParkingSlot.objects.filter(
            parking_lot=parking_lot,
            slot_number=slot_data['slot_number']
        ).exists():
            print(f"⏭️  Slot {slot_data['slot_number']} already exists, skipping...")
            skipped_count += 1
            continue
        
        # Set default dimensions if not provided
        slot_data.setdefault('height_cm', 200)
        slot_data.setdefault('width_cm', 300)
        slot_data.setdefault('length_cm', 500)
        
        # Create the slot
        ParkingSlot.objects.create(
            parking_lot=parking_lot,
            **slot_data
        )
        print(f"✅ Created {slot_data['vehicle_type']} slot: {slot_data['slot_number']}")
        created_count += 1
    
    print(f"\n🎉 Summary:")
    print(f"   ✅ Created: {created_count} new slots")
    print(f"   ⏭️  Skipped: {skipped_count} existing slots")
    print(f"   📊 Total slots in database: {ParkingSlot.objects.count()}")
    
    # Show breakdown by vehicle type
    print(f"\n📈 Slots by vehicle type:")
    for vehicle_type, display_name in ParkingSlot.VEHICLE_TYPE_CHOICES:
        count = ParkingSlot.objects.filter(vehicle_type=vehicle_type).count()
        print(f"   {display_name}: {count} slots")

if __name__ == '__main__':
    create_sample_slots()