# Feature 2: View User History - Implementation Plan

## 🎯 Goal
Provide users with a complete parking activity history showing all past parking sessions with detailed information including check-ins, check-outs, zones used, durations, and payments.

---

## 📋 Backend Tasks

### 1. API Endpoints to Create

#### User Endpoints (Customer Access)
- **GET /api/user/parking-history/** - List all user's parking sessions
  - Filters: date_range, location, status (completed/active)
  - Pagination support
  - Sorted by most recent first

- **GET /api/user/parking-history/{id}/** - Single parking session details
  - Full details of one parking session

- **GET /api/user/parking-history/stats/** - User's parking statistics
  - Total sessions
  - Total time parked
  - Total amount paid
  - Favorite locations
  - Most used vehicle

- **GET /api/user/parking-history/export/** - Export user's history to CSV

#### Admin Endpoints (Optional - for viewing any user's history)
- **GET /api/admin/user-history/{user_id}/** - View specific user's history
- **GET /api/admin/user-history/{user_id}/stats/** - User's statistics

---

## 🗃️ Data Structure

### Parking Session Object
```json
{
  "id": 123,
  "booking_id": 456,
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  },
  "vehicle": {
    "type": "car",
    "plate": "XK01AB1234"
  },
  "location": {
    "name": "Downtown Parking",
    "zone": "Zone A",
    "floor": "2",
    "slot_number": "A-24"
  },
  "timing": {
    "check_in": "2024-10-15T09:00:00Z",
    "check_out": "2024-10-15T17:30:00Z",
    "duration_minutes": 510,
    "duration_formatted": "8h 30m"
  },
  "payment": {
    "amount": 850.00,
    "currency": "BDT",
    "status": "paid",
    "method": "card"
  },
  "status": "completed", // completed, active, cancelled
  "notes": "Regular parking session"
}
```

### Statistics Object
```json
{
  "total_sessions": 45,
  "total_time_parked": {
    "minutes": 15480,
    "formatted": "258 hours"
  },
  "total_amount_paid": 38500.00,
  "favorite_location": {
    "name": "Downtown Parking",
    "count": 23
  },
  "most_used_vehicle": {
    "type": "car",
    "plate": "XK01AB1234",
    "count": 40
  },
  "average_duration_minutes": 344,
  "average_amount": 855.56,
  "this_month": {
    "sessions": 8,
    "total_amount": 6800.00
  }
}
```

---

## 🔧 Implementation Steps

### Step 1: Create Serializers
File: `backend/api/serializers.py`

- `ParkingSessionSerializer` - Detailed session with all relations
- `ParkingSessionListSerializer` - Lightweight for list view
- `UserParkingStatsSerializer` - Statistics object
- `VehicleInfoSerializer` - Vehicle details
- `LocationInfoSerializer` - Location details

### Step 2: Create Views
File: `backend/api/user_history_views.py` (new file)

- `UserParkingHistoryListView` - List view with filters
- `UserParkingHistoryDetailView` - Single session detail
- `UserParkingStatsView` - Statistics
- `UserParkingHistoryExportView` - CSV export
- `AdminUserHistoryView` - Admin access to any user's history

### Step 3: Update URLs
File: `backend/api/urls.py`

Add routes:
```python
# User history endpoints
path('user/parking-history/', views.user_parking_history_list, name='user-parking-history'),
path('user/parking-history/<int:pk>/', views.user_parking_history_detail, name='user-parking-history-detail'),
path('user/parking-history/stats/', views.user_parking_stats, name='user-parking-stats'),
path('user/parking-history/export/', views.user_parking_history_export, name='user-parking-history-export'),

# Admin endpoints
path('admin/user-history/<int:user_id>/', views.admin_user_history, name='admin-user-history'),
path('admin/user-history/<int:user_id>/stats/', views.admin_user_stats, name='admin-user-stats'),
```

---

## 📊 Data Sources

### Primary Source: Booking Model
- Contains most parking session data
- Fields: user, vehicle_type, plate_number, slot, start_time, end_time, status

### Secondary Source: AuditLog Model
- Check-in/check-out timestamps
- Action history
- IP addresses and metadata

### Payment Information
- From Booking model or separate Payment model (if exists)
- Amount, payment status, payment method

---

## 🔍 Query Logic

### Combining Booking + AuditLog Data
```python
# Get user's bookings
bookings = Booking.objects.filter(user=request.user)

# For each booking, get related check-in/check-out logs
for booking in bookings:
    check_in_log = AuditLog.objects.filter(
        booking=booking,
        action='check_in'
    ).first()
    
    check_out_log = AuditLog.objects.filter(
        booking=booking,
        action='check_out'
    ).first()
    
    # Calculate duration
    if check_in_log and check_out_log:
        duration = check_out_log.timestamp - check_in_log.timestamp
```

---

## 🎨 Filter Options

- **Date Range**: start_date, end_date
- **Location**: location_name or location_id
- **Status**: active, completed, cancelled
- **Vehicle Type**: car, motorcycle, truck
- **Sort**: -check_in_time (newest first), check_in_time, duration, amount

---

## 🔐 Security & Permissions

### User Access
- ✅ Can view only their own history
- ✅ Cannot access other users' data
- ✅ Authentication required

### Admin Access
- ✅ Can view any user's history
- ✅ Can export any user's data
- ✅ Admin role verification

---

## ✅ Success Criteria

- [ ] User can view list of all their parking sessions
- [ ] User can see detailed information for each session
- [ ] Statistics show accurate calculations
- [ ] Export works with proper CSV format
- [ ] Filters apply correctly
- [ ] Pagination works smoothly
- [ ] Performance is good (< 1 second response)
- [ ] Admin can view any user's history

---

## 🧪 Testing Plan

### Unit Tests
- Test serializers
- Test duration calculations
- Test statistics calculations

### API Tests
- Test list endpoint with filters
- Test detail endpoint
- Test stats endpoint
- Test export endpoint
- Test permissions (user can't see others' data)

### Integration Tests
- Test with real database data
- Test with multiple users
- Test with large datasets

---

## 📝 Next Steps

1. ✅ Create plan (this document)
2. ⏳ Create serializers
3. ⏳ Create views
4. ⏳ Add URL routes
5. ⏳ Test API endpoints
6. ⏳ Create documentation
7. ⏳ Frontend implementation

---

**Ready to start implementation!**
