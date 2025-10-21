# 🚀 Check-In/Check-Out Logs - Quick Reference

## API Endpoints Cheat Sheet

### Admin/Security Endpoints
```
GET  /api/admin/checkin-checkout-logs/           # List all logs
GET  /api/admin/checkin-checkout-logs/<id>/      # Get log detail
GET  /api/admin/checkin-checkout-logs/stats/     # Get statistics
GET  /api/admin/checkin-checkout-logs/export/    # Export CSV
GET  /api/admin/currently-parked/                # Currently parked
```

### User Endpoints
```
GET  /api/checkin-checkout-logs/my/              # My logs
GET  /api/parking/current/                       # My current parking
```

---

## Quick Filter Examples

```bash
# By date range
?date_from=2025-10-01&date_to=2025-10-19

# By vehicle plate
?vehicle_plate=ABC123

# By status
?status=success
?status=failed

# By action
?action=check_in
?action=check_out

# Currently parked
?current_status=parked

# By parking location
?parking_lot=Main&floor=G&section=A

# By vehicle type
?vehicle_type=car
```

---

## Common Use Cases

### 1. View Today's Check-Ins
```bash
GET /api/admin/checkin-checkout-logs/?action=check_in&date_from=2025-10-19&status=success
```

### 2. Get Failed Attempts
```bash
GET /api/admin/checkin-checkout-logs/?status=failed
```

### 3. Export Last Week's Data
```bash
GET /api/admin/checkin-checkout-logs/export/?date_from=2025-10-12&date_to=2025-10-19
```

### 4. Check Who's Currently Parked
```bash
GET /api/admin/currently-parked/
```

### 5. Get Dashboard Statistics
```bash
GET /api/admin/checkin-checkout-logs/stats/
```

---

## Response Structure

### Log List Response
```json
{
  "id": 123,
  "booking_id": 45,
  "action": "check_in_success",
  "timestamp": "2025-10-19T10:30:00Z",
  "user_username": "john_doe",
  "vehicle_plate": "ABC123",
  "parking_lot": "Main Parking",
  "slot_number": "A-101",
  "status": "Success"
}
```

### Stats Response
```json
{
  "total_check_ins": 150,
  "failed_check_ins": 5,
  "currently_parked": 42,
  "average_parking_duration_hours": 3.5,
  "check_ins_by_vehicle_type": {...},
  "hourly_check_ins_today": [...],
  "peak_hours": [...]
}
```

---

## Permission Matrix

| Endpoint | Admin | Security | Customer |
|----------|-------|----------|----------|
| List all logs | ✅ | ✅ | ❌ |
| Log detail | ✅ | ✅ | ❌ |
| Statistics | ✅ | ✅ | ❌ |
| Export CSV | ✅ | ✅ | ❌ |
| Currently parked | ✅ | ✅ | ❌ |
| My logs | ✅ | ✅ | ✅ |
| My current parking | ✅ | ✅ | ✅ |

---

## Files Reference

```
backend/api/
├── checkin_checkout_log_views.py    # Views (480 lines)
├── serializers.py                   # Serializers (added)
└── urls.py                          # Routes (added)

docs/
├── CHECKIN_CHECKOUT_LOGS_BACKEND_COMPLETE.md  # Full docs
├── CHECKIN_CHECKOUT_LOGS_API_TESTING.md       # Testing guide
├── CHECKIN_CHECKOUT_LOGS_SUMMARY.md           # Summary
└── CHECKIN_CHECKOUT_LOGS_QUICK_REF.md         # This file
```

---

## Testing Commands

```bash
# Start server
python manage.py runserver

# Test with curl (replace TOKEN)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/admin/checkin-checkout-logs/

# Test with httpie
http GET :8000/api/admin/checkin-checkout-logs/ \
  Authorization:"Bearer TOKEN"
```

---

## Next: Frontend Implementation

1. Create `CheckInCheckOutLogs.jsx` page
2. Create `checkInCheckOutLogService.js` API service
3. Add routes to `MainApp.jsx`
4. Add menu items to admin sidebar
5. Implement filters and search UI
6. Add charts for statistics
7. Add export button

---

**Ready to build the frontend!** 🎨
