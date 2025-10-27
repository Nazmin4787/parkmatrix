# Long-Stay Alert Notifications - Quick Reference

## 🚨 Alert Types

### Critical Alerts (>24 hours)
- **Customer**: Gets immediate critical alert with duration, location, overtime
- **Admin**: Gets individual alert per vehicle + comprehensive summary
- **Priority**: CRITICAL
- **Cooldown**: 12 hours (won't send duplicate alerts)

### Warning Alerts (20-24 hours)
- **Customer**: Gets warning with time remaining
- **Admin**: Gets individual warning per vehicle + summary
- **Priority**: MEDIUM
- **Cooldown**: 6 hours (won't send duplicate alerts)

## 📊 Notification Priorities

| Priority | Icon | When | Recipients |
|----------|------|------|------------|
| CRITICAL | 🚨 | >24h parked | Customer + All Admins |
| MEDIUM | ⚡ | 20-24h parked | Customer + All Admins |
| LOW | ✅ | All clear | Admins only (summary) |

## 📱 Customer Notification Examples

### Critical (>24h)
```
🚨 CRITICAL: Long-Stay Alert

Your vehicle (ABC1234) has been parked for 1d 2h at 
College Parking, Slot A07. This exceeds the 24-hour 
limit. Please check out immediately to avoid additional 
charges and potential penalties.
```

### Warning (20-24h)
```
⚡ Parking Duration Warning

Your vehicle (ABC1234) has been parked for 20h at 
College Parking, Slot A08. You have approximately 4.0 
hours remaining before the 24-hour limit. Please plan 
to check out soon.
```

## 👨‍💼 Admin Notification Types

1. **Individual Critical Alert** - One per vehicle exceeding 24h
2. **Individual Warning Alert** - One per vehicle approaching 24h
3. **Comprehensive Summary** - All vehicles in one notification

## 🔄 Detection Flow

```
Scheduler runs hourly
    ↓
Check all checked-in vehicles
    ↓
Calculate duration
    ↓
If >24h → Critical Alert → Customer + Admins
If 20-24h → Warning Alert → Customer + Admins
If <20h → No alert
    ↓
Create audit log
    ↓
Prevent duplicates (cooldown period)
```

## ⚙️ Configuration

```python
# Thresholds
LONG_STAY_THRESHOLD_HOURS = 24  # Critical
WARNING_THRESHOLD_HOURS = 20    # Warning

# Cooldowns
Critical: 12 hours
Warning: 6 hours
```

## 🧪 Testing

```bash
cd backend
python test_long_stay_notifications.py
```

Expected Results:
- ✅ Critical vehicles detected
- ✅ Customer notifications sent (2)
- ✅ Admin notifications sent (3+)

## 📊 Notification Data

### Additional Data Fields

**Customer Critical:**
```json
{
  "alert_type": "long_stay_critical",
  "duration_hours": 26.0,
  "slot_number": "A07",
  "priority": "critical",
  "overtime_hours": 2.0
}
```

**Admin Critical:**
```json
{
  "alert_type": "long_stay_critical_admin",
  "booking_id": 84,
  "vehicle_plate": "ABC1234",
  "duration_hours": 26.0,
  "slot_number": "A07",
  "priority": "critical"
}
```

**Admin Summary:**
```json
{
  "alert_type": "long_stay_summary",
  "critical_count": 3,
  "warning_count": 2,
  "priority": "critical",
  "timestamp": "2025-10-27T18:45:00Z"
}
```

## 🔍 Monitoring

### Check Audit Logs
```python
from api.models import AuditLog

# Recent long-stay detections
AuditLog.objects.filter(
    action__in=['long_stay_detected', 'long_stay_warning']
).order_by('-timestamp')[:10]
```

### Check Notifications
```python
from api.models import Notification

# Critical alerts
Notification.objects.filter(
    additional_data__alert_type='long_stay_critical'
).count()

# All long-stay notifications
Notification.objects.filter(
    additional_data__alert_type__startswith='long_stay'
).count()
```

## 🚀 Manual Trigger

### Via API (Admin only)
```bash
POST /api/admin/long-stay-vehicles/detect/
Authorization: Bearer <admin_token>
```

### Via Python
```python
from api.long_stay_detection import get_long_stay_service

service = get_long_stay_service()
results = service.detect_long_stay_vehicles()
```

## ✅ Verification Checklist

- [ ] Customer receives critical alert (>24h)
- [ ] Customer receives warning alert (20-24h)
- [ ] Admin receives individual critical alerts
- [ ] Admin receives individual warning alerts
- [ ] Admin receives summary notification
- [ ] Audit logs created for all events
- [ ] No duplicate alerts within cooldown period
- [ ] Notification badges update in real-time

## 📞 Support

For issues or questions:
1. Check audit logs for detection events
2. Verify notification table for created alerts
3. Check scheduler status: `/api/admin/scheduler/status/`
4. Run test script to verify system functionality
