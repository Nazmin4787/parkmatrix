# 📝 Optional: Add Location Fields to Booking Model

If you want to store GPS coordinates directly in the Booking model (instead of just audit logs), follow these steps:

## 1. Update Model

**File:** `backend/api/models.py`

Find the `Booking` model and add these fields (around line 180-200):

```python
class Booking(models.Model):
    # ... existing fields ...
    
    # Check-in location
    check_in_latitude = models.FloatField(null=True, blank=True, help_text="Latitude at check-in")
    check_in_longitude = models.FloatField(null=True, blank=True, help_text="Longitude at check-in")
    check_in_distance = models.FloatField(null=True, blank=True, help_text="Distance from parking center at check-in (meters)")
    
    # Check-out location
    check_out_latitude = models.FloatField(null=True, blank=True, help_text="Latitude at check-out")
    check_out_longitude = models.FloatField(null=True, blank=True, help_text="Longitude at check-out")
    check_out_distance = models.FloatField(null=True, blank=True, help_text="Distance from parking center at check-out (meters)")
```

## 2. Create Migration

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

## 3. Update Views

**File:** `backend/api/views.py`

### Update CheckInView (around line 920):
```python
# Perform check-in
booking.checked_in_at = timezone.now()
booking.checked_in_by = request.user
booking.checked_in_ip = self.get_client_ip(request)
booking.check_in_notes = notes
booking.status = 'checked_in'

# Store location data
booking.check_in_latitude = float(user_latitude)
booking.check_in_longitude = float(user_longitude)
booking.check_in_distance = distance

booking.save()
```

### Update CheckOutView (around line 1060):
```python
# Perform check-out
booking.checked_out_at = timezone.now()
booking.checked_out_by = request.user
booking.checked_out_ip = self.get_client_ip(request)
booking.check_out_notes = notes
booking.status = 'checked_out'

# Store location data
booking.check_out_latitude = float(user_latitude)
booking.check_out_longitude = float(user_longitude)
booking.check_out_distance = distance

# Calculate overtime
booking.calculate_overtime()
booking.save()
```

## 4. Update Serializer (Optional)

**File:** `backend/api/serializers.py`

Find `BookingSerializer` and add fields:

```python
class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = [
            # ... existing fields ...
            'check_in_latitude',
            'check_in_longitude',
            'check_in_distance',
            'check_out_latitude',
            'check_out_longitude',
            'check_out_distance',
        ]
```

## 5. Query Location Data

```python
# Get bookings with location data
bookings = Booking.objects.filter(
    check_in_distance__lte=500,  # Within 500m
    status='checked_in'
)

# Find suspicious check-ins (very close to edge)
suspicious = Booking.objects.filter(
    check_in_distance__gte=450,  # 450-500m (suspicious)
    check_in_distance__lte=500
)

# Average distance
from django.db.models import Avg
avg_distance = Booking.objects.aggregate(
    Avg('check_in_distance')
)
```

## Benefits of Adding Fields

✅ **Easier to query** - Direct database fields vs JSON  
✅ **Better indexing** - Can create database indexes  
✅ **Simpler analytics** - Standard SQL queries  
✅ **Type safety** - FloatField vs JSON  

## Current Implementation (Without New Fields)

✅ **Already working** - Location stored in AuditLog  
✅ **No migration needed** - Uses existing JSON field  
✅ **Audit trail complete** - All data preserved  

## Recommendation

**For now:** ✅ Keep current implementation (AuditLog only)

**Add fields later if:**
- You need frequent location queries
- Building analytics dashboard
- Performance optimization needed
- Want direct model access

---

**Note:** The current implementation works perfectly without database changes. Only add fields if you need them for analytics or performance.
