# Long-Stay Vehicle Detection - Quick Reference

## 🚀 Quick Start

### 1. Installation
```bash
cd backend
.\parking_env\Scripts\activate
pip install APScheduler>=3.10.0
```

### 2. Start Server
```bash
python manage.py runserver
```

✅ Scheduler starts automatically!

---

## 📋 Command Reference

### Manual Detection
```bash
# Basic
python manage.py detect_long_stay

# Custom threshold
python manage.py detect_long_stay --threshold-hours 12

# JSON output
python manage.py detect_long_stay --json
```

### Check Django
```bash
# Verify configuration
python manage.py check

# Run migrations
python manage.py migrate
```

---

## 🔗 API Endpoints

### 1. Get Long-Stay Vehicles
```http
GET /api/admin/long-stay-vehicles/
Authorization: Bearer {admin_token}
```

**Access:** Admin, Security  
**Returns:** Current long-stay vehicles with details

### 2. Trigger Detection
```http
POST /api/admin/long-stay-vehicles/detect/
Authorization: Bearer {admin_token}
```

**Access:** Admin only  
**Returns:** Detection results

### 3. Scheduler Status
```http
GET /api/admin/scheduler/status/
Authorization: Bearer {admin_token}
```

**Access:** Admin only  
**Returns:** Scheduler running status & jobs

---

## 📊 Detection Logic

| Duration | Status | Action |
|----------|--------|--------|
| < 20h | Normal | None |
| 20-24h | Warning | Audit log only |
| > 24h | Critical | User + Admin notification |

### Thresholds
- **WARNING:** 20 hours
- **CRITICAL:** 24 hours

### Schedule
- Every hour (on the hour)
- Plus: 8 AM, 12 PM, 4 PM, 8 PM UTC

---

## 🔧 Configuration

### Change Thresholds
Edit `api/long_stay_detection.py`:
```python
LONG_STAY_THRESHOLD_HOURS = 24  # Critical
WARNING_THRESHOLD_HOURS = 20    # Warning
```

### Change Schedule
Edit `api/scheduler.py`:
```python
# Every 30 minutes instead of 1 hour
trigger=IntervalTrigger(minutes=30)

# Different times
trigger=CronTrigger(hour='6,12,18,24', minute=0)
```

---

## 🧪 Testing

### Test Script
```bash
.\test_long_stay_api.ps1
```

### Manual Test Steps
1. Create booking and check-in
2. Manually set `checked_in_at` to 30 hours ago
3. Run `python manage.py detect_long_stay`
4. Check notifications and audit logs

### Test with curl
```bash
# Get scheduler status
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/admin/scheduler/status/

# Get long-stay vehicles
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/admin/long-stay-vehicles/

# Trigger detection
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/admin/long-stay-vehicles/detect/
```

---

## 📁 Files Overview

| File | Purpose |
|------|---------|
| `api/long_stay_detection.py` | Core detection service |
| `api/scheduler.py` | APScheduler configuration |
| `api/long_stay_views.py` | REST API endpoints |
| `api/management/commands/detect_long_stay.py` | CLI command |
| `api/apps.py` | Auto-start scheduler |
| `api/urls.py` | URL routing |

---

## 🐛 Troubleshooting

### Scheduler Not Running
```bash
# Check status
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/admin/scheduler/status/

# Expected: {"running": true, ...}
```

### No Jobs Scheduled
**Check:** Console output when starting server  
**Should see:** `✅ APScheduler started successfully`

### Import Errors
```bash
# Reinstall APScheduler
pip install --upgrade APScheduler
```

### No Notifications
**Check:**
1. User has admin/security role
2. Notification model has entries
3. `checked_in_at` is old enough (>24h)

---

## 📈 Expected Output

### Console (Detection Running)
```
🔍 Running long-stay vehicle detection...

📊 Detection Summary:
  Total Parked: 5
  🚨 Critical (>24h): 2
  ⚡ Warnings (>20h): 1
  ✅ Normal: 2

🚨 LONG-STAY VEHICLES:
  • ABC123 - Slot A1-01 - 1d 8h (32.0h)
    User: john@example.com
    Location: Downtown Parking, Floor 1
```

### API Response
```json
{
  "timestamp": "2025-10-21T15:30:00Z",
  "threshold_hours": 24,
  "total_parked": 5,
  "summary": {
    "critical_count": 2,
    "warning_count": 1,
    "normal_count": 2
  },
  "long_stay_vehicles": [...],
  "warning_vehicles": [...]
}
```

---

## ✅ Verification Checklist

- [ ] APScheduler installed
- [ ] Server starts without errors
- [ ] Console shows "APScheduler started"
- [ ] `python manage.py detect_long_stay` works
- [ ] API endpoints accessible
- [ ] Scheduler status shows jobs
- [ ] Notifications created in database

---

## 🎯 Key Features

✅ **Fully Automated** - Runs every hour  
✅ **Multi-Level Alerts** - Warning at 20h, Critical at 24h  
✅ **Smart Notifications** - Users + Admins  
✅ **Audit Trail** - Complete logging  
✅ **API Access** - Real-time data  
✅ **Manual Triggers** - On-demand detection  
✅ **Production Ready** - Works with Gunicorn  

---

## 📞 Support

**Documentation:** `LONG_STAY_DETECTION_COMPLETE.md`  
**Implementation:** `LONG_STAY_IMPLEMENTATION_SUMMARY.md`  
**This Guide:** Quick reference for daily use

---

## 🚀 Ready to Use!

Start the server and the feature activates automatically:
```bash
python manage.py runserver
```

That's it! The system will now monitor all parked vehicles 24/7.
