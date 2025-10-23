# Fix: "Total Parked: 0" Issue

## Quick Fix Steps

### Step 1: Sign Out and Sign In Again
The token issue is now fixed. You need to:
1. Click "Sign Out"
2. Sign in again with admin credentials
3. Go to `/admin/long-stay` page

### Step 2: Create Test Data

If you still see "0", it means you have no checked-in vehicles. Create some test data:

```bash
cd backend
python manage.py shell
```

Then run:
```python
from django.utils import timezone
from datetime import timedelta
from api.models import Booking, User, Vehicle, ParkingSlot

# Method 1: Modify existing booking
booking = Booking.objects.filter(status='confirmed').first()
if booking:
    booking.status = 'checked_in'
    booking.checked_in_at = timezone.now() - timedelta(hours=30)  # 30 hours ago
    booking.checked_out_at = None
    booking.save()
    print(f"✓ Set booking {booking.id} as long-stay (30 hours)")

# Method 2: Create new booking if none exist
else:
    user = User.objects.filter(role='customer').first()
    slot = ParkingSlot.objects.filter(is_occupied=False).first()
    vehicle = Vehicle.objects.first()
    
    if user and slot and vehicle:
        booking = Booking.objects.create(
            user=user,
            slot=slot,
            vehicle=vehicle,
            start_time=timezone.now() - timedelta(hours=30),
            end_time=timezone.now() + timedelta(hours=2),
            status='checked_in',
            checked_in_at=timezone.now() - timedelta(hours=30)
        )
        print(f"✓ Created long-stay booking {booking.id}")
```

### Step 3: Refresh the Page
Go back to `http://localhost:5173/admin/long-stay` and click "Refresh"

---

## Explanation

**"0 Total Parked" is CORRECT if:**
- No vehicles are currently checked in
- All vehicles have checked out
- You haven't created any test bookings yet

**This is NOT an error!** The system is working correctly.

To see vehicles in the monitor, you need vehicles that are:
1. Status = `checked_in`
2. `checked_in_at` is set (not NULL)
3. `checked_out_at` is NULL (still parked)
4. For critical alerts: `checked_in_at` > 24 hours ago

---

## Quick Test

```bash
# Run detection manually to see results
python manage.py detect_long_stay

# Should show:
# 📊 Detection Summary:
#   Total Parked: X
#   🚨 Critical (>24h): X
#   ⚡ Warnings (>20h): X
```

If this shows 0, then you genuinely have no parked vehicles and need to create test data!
