# Parking Slot Management System Guide

## Overview

This document provides guidance for clearing existing slot data, adding new slots with consistent naming, and updating the frontend to properly display the new slot information.

## Backend Management Tools

We've created several management commands to help manage parking slots:

### 1. Clear Slot Data

Use the `clear_slot_data` command to safely remove existing slots from the database:

```bash
python manage.py clear_slot_data [options]
```

**Options:**
- `--force`: Force clearing all slots even if active bookings exist
- `--preserve-active`: Preserve slots that have active bookings

**Example:**
```bash
# Check for active bookings first (safe mode)
python manage.py clear_slot_data

# Clear all slots, including those with active bookings
python manage.py clear_slot_data --force

# Clear only slots without active bookings
python manage.py clear_slot_data --preserve-active
```

### 2. Add Consistent Slots

Use the `add_consistent_slots` command to add new slots with a consistent naming scheme:

```bash
python manage.py add_consistent_slots <parking_lot_id> [options]
```

**Options:**
- `--sections`: Comma-separated list of sections (e.g., "A,B,C")
- `--slots-per-section`: Number of slots per section
- `--floor`: Floor number for the slots
- `--vehicle-type`: Vehicle type for the slots (car, suv, bike, truck, any)

**Example:**
```bash
# Add 20 slots each to sections A, B, and C on floor 1 for any vehicle type
python manage.py add_consistent_slots 1 --sections=A,B,C --slots-per-section=20 --floor=1 --vehicle-type=any

# Add 15 slots to section D on floor 2 for cars
python manage.py add_consistent_slots 1 --sections=D --slots-per-section=15 --floor=2 --vehicle-type=car
```

## Frontend Admin Interface

We've created a new admin interface for slot management, available at `/admin/slots`. This interface allows administrators to:

1. View all existing slots
2. Create new individual slots
3. Bulk create slots with consistent numbering
4. Delete slots (if not currently occupied)
5. Update slot vehicle types in bulk
6. Filter slots by vehicle type and parking lot

### Using the Admin Interface

1. Navigate to `/admin/slots` in the frontend application
2. Use the "Create New Slot" form to add individual slots
3. Use the "Bulk Create Slots" form to add multiple slots with sequential numbering
4. Use the filters to view specific subsets of slots
5. Use the checkboxes to select multiple slots for bulk operations

## Best Practices for Slot Naming

To avoid slot number discrepancies:

1. **Consistent Format**: Always use the same format for slot numbers (e.g., "A1", "B12", not a mix of alphanumeric and purely numeric IDs)
2. **Logical Structure**: Organize slots by section, with clear sequential numbering
3. **Unique Numbers**: Ensure each slot has a unique slot number across the entire parking system
4. **Avoid Changes**: Once assigned, avoid changing slot numbers to prevent confusion
5. **Data Validation**: Implement validation to ensure slot numbers follow your chosen format

## Implementation Steps

Follow these steps to refresh your slot data:

1. **Backup the Database**: Always create a backup before making large-scale changes
2. **Export Active Bookings**: Use Django's dumpdata to export active bookings if needed
3. **Clear Slot Data**:
   ```bash
   python manage.py clear_slot_data --preserve-active
   ```
4. **Add New Slots**:
   ```bash
   python manage.py add_consistent_slots 1 --sections=A,B,C --slots-per-section=20
   ```
5. **Update Frontend**: Ensure the frontend is using the updated API endpoints

## Troubleshooting

If slot discrepancies still occur:

1. **Check Booking References**: Use the `fix_slot_discrepancies` command to identify and fix issues
2. **Database Consistency**: Verify that booking records correctly reference slot objects
3. **API Response Format**: Ensure API responses include proper slot information
4. **Frontend Parsing**: Check how the frontend parses and displays slot information

## Database Schema

The ParkingSlot model has the following fields:

- `parking_lot`: Foreign key to ParkingLot
- `slot_number`: CharField (the display name, like "A1")
- `floor`: CharField (floor number or identifier)
- `section`: CharField (section identifier, like "A", "B")
- `pos_x`: IntegerField (x-position for layout)
- `pos_y`: IntegerField (y-position for layout)
- `is_occupied`: BooleanField (whether slot is currently occupied)
- `vehicle_type`: CharField (type of vehicle this slot is designated for)
- `height_cm`, `width_cm`, `length_cm`: IntegerFields (dimensions)