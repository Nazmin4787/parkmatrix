# 🧪 Complete Testing Guide - Check-In/Check-Out System

This guide provides comprehensive instructions for testing the parking system's check-in/check-out functionality with realistic test data and mock GPS locations.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Test Data Generation](#test-data-generation)
3. [Frontend Testing](#frontend-testing)
4. [Backend Testing](#backend-testing)
5. [GPS Location Testing](#gps-location-testing)
6. [Test Scenarios](#test-scenarios)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### 1. Generate Test Data

```bash
# Navigate to backend directory
cd backend

# Generate complete test data (recommended)
python manage.py create_test_data --reset --with-sessions

# Or generate basic data only (no sessions)
python manage.py create_test_data --reset
```

### 2. Start Development Server

```bash
# Backend (Django)
cd backend
python manage.py runserver

# Frontend (React + Vite)
cd frontend  
npm run dev
```

### 3. Access Testing Panel

- Open your browser to the frontend URL (usually `http://localhost:5173`)
- The **Testing Panel** will appear in the top-right corner (development mode only)
- Use it to mock GPS locations and run test scenarios

---

## 🗃️ Test Data Generation

### What Gets Created

When you run `python manage.py create_test_data --reset --with-sessions`:

#### **Users Created:**
- `test_customer1` (password: `testpass123`)
- `test_customer2` (password: `testpass123`)  
- `test_admin` (password: `testpass123`)
- Plus 20+ additional test users

#### **Parking Locations:**
1. **Test Mall Parking** (3.1390, 101.6869) - 12 slots
2. **Test Office Complex** (3.1580, 101.7000) - 8 slots
3. **Test Shopping Center** (3.1500, 101.6800) - 15 slots
4. **Test Airport Parking** (3.1200, 101.7200) - 20 slots

#### **Check-In Sessions:**
- **Active Sessions:** Users currently checked in (3 sessions)
- **Completed Sessions:** Finished check-ins with check-out times (2 sessions)
- **Overdue Sessions:** Sessions past expected check-out time (1 session)

#### **Geofence Data:**
- Geofence configurations for each parking lot
- Validation logs for testing geolocation accuracy

### Manual Test Data Script

```bash
# Use the standalone script
cd backend
python setup_test_data.py
```

---

## 🎨 Frontend Testing

### Testing Panel Features

The **Testing Panel** (visible only in development) provides:

#### **GPS Location Mocking**
- **Mall Location:** Simulates being at Test Mall Parking
- **Office Location:** Simulates being at Test Office Complex  
- **Shopping Center:** Simulates being at Test Shopping Center
- **Airport Location:** Simulates being at Test Airport Parking
- **Outside Location:** Simulates being outside all geofences
- **Poor GPS:** Simulates low GPS accuracy

#### **Test Scenarios**
- **Successful Check-In:** Mock location → navigate to check-in
- **Failed Geofence:** Try check-in from outside valid area
- **GPS Error:** Test with poor GPS accuracy
- **Check-Out Test:** Test check-out process
- **Overdue Session:** Test overdue session handling

### Manual Frontend Testing

1. **Open Development Tools (F12)**
2. **Navigate to Check-In Page**
3. **Use Testing Panel to:**
   - Select a location (e.g., "Mall")
   - Click "Successful Check-In" scenario
   - Monitor browser console for GPS events
   - Verify geofence validation responses

### Location Testing Example

```javascript
// In browser console, you can also manually mock:
navigator.geolocation.getCurrentPosition = function(success) {
    success({
        coords: {
            latitude: 3.1390,   // Mall location
            longitude: 101.6869,
            accuracy: 10
        }
    });
};
```

---

## ⚙️ Backend Testing

### Django Shell Testing

```bash
cd backend
python manage.py shell
```

```python
# Test check-in sessions
from api.checkin_models import CheckInOutSession
sessions = CheckInOutSession.objects.all()
for session in sessions:
    print(f"{session.ticket_code} - {session.status} - {session.license_plate}")

# Test geofence validation
from api.checkin_models import GeofenceValidationLog
logs = GeofenceValidationLog.objects.all()[:5]
for log in logs:
    print(f"{log.validation_type} - {log.result} - {log.distance_from_center}m")

# Test active sessions
active_sessions = CheckInOutSession.objects.filter(status='active')
print(f"Active sessions: {active_sessions.count()}")
```

### API Testing

Use the provided test files to verify API endpoints:

```bash
cd backend

# Test notification API
python test_notification_api.py

# Test geofence service
python -c "
from api.geofence_service import GeofenceService
service = GeofenceService()
result = service.validate_location(3.1390, 101.6869, 1)  # Mall location
print(f'Geofence validation: {result}')
"
```

---

## 📍 GPS Location Testing

### Test Locations Available

| Location | Latitude | Longitude | Purpose |
|----------|----------|-----------|---------|
| Mall | 3.1390 | 101.6869 | Valid check-in location |
| Office | 3.1580 | 101.7000 | Valid check-in location |
| Shopping | 3.1500 | 101.6800 | Valid check-in location |
| Airport | 3.1200 | 101.7200 | Valid check-in location |
| Outside | 3.2000 | 101.8000 | Outside all geofences |
| Poor GPS | 3.1390 | 101.6869 | Low accuracy (50m) |

### Geofence Validation Testing

```bash
# Test geofence validation directly
cd backend
python -c "
from api.geofence_service import GeofenceService
from api.models import ParkingLot

service = GeofenceService()

# Test mall location (should pass)
mall = ParkingLot.objects.get(name='Test Mall Parking')
result = service.validate_checkin_location(3.1390, 101.6869, 10, mall.id)
print(f'Mall check-in: {result}')

# Test outside location (should fail)
result = service.validate_checkin_location(3.2000, 101.8000, 10, mall.id)
print(f'Outside check-in: {result}')
"
```

---

## 🧪 Test Scenarios

### Scenario 1: Successful Check-In Flow

1. **Setup:** Use Testing Panel → Select "Mall Location"
2. **Action:** Navigate to Check-In page → Select parking slot
3. **Expected:** Geofence validation passes → Check-in succeeds
4. **Verify:** Session created with `active` status

### Scenario 2: Failed Geofence Validation

1. **Setup:** Use Testing Panel → Select "Outside Location"  
2. **Action:** Attempt to check-in at any parking lot
3. **Expected:** Geofence validation fails → Error message shown
4. **Verify:** No session created → Validation log shows failure

### Scenario 3: Check-Out Process

1. **Setup:** Ensure you have an active session (use test data)
2. **Action:** Use Testing Panel → Same location → Navigate to check-out
3. **Expected:** Check-out succeeds → Session status becomes `completed`
4. **Verify:** `actual_check_out_time` is set

### Scenario 4: Overdue Session Handling

1. **Setup:** Test data includes overdue sessions automatically
2. **Action:** Check system notifications and alerts
3. **Expected:** Overdue sessions are flagged appropriately
4. **Verify:** `is_overdue()` method returns `True`

---

## 🔧 Troubleshooting

### Common Issues

#### **1. Test Data Creation Fails**

```bash
# Error: Model field issues
# Solution: Ensure migrations are up to date
python manage.py makemigrations
python manage.py migrate
```

#### **2. GPS Mocking Not Working**

```javascript
// Check browser console for errors
// Ensure you're in development mode
console.log('NODE_ENV:', process.env.NODE_ENV);
```

#### **3. Geofence Validation Always Fails**

```python
# Check geofence configuration
from api.checkin_models import GeofenceConfig
configs = GeofenceConfig.objects.all()
for config in configs:
    print(f"{config.parking_lot.name}: {config.radius_meters}m")
```

#### **4. Sessions Not Created**

```bash
# Check for database errors
python manage.py shell
>>> from api.checkin_models import CheckInOutSession
>>> CheckInOutSession.objects.count()
```

### Debug Commands

```bash
# View all test data
python manage.py shell -c "
from api.models import *
from api.checkin_models import *
print(f'Users: {User.objects.count()}')
print(f'Parking Lots: {ParkingLot.objects.count()}') 
print(f'Slots: {ParkingSlot.objects.count()}')
print(f'Sessions: {CheckInOutSession.objects.count()}')
print(f'Validation Logs: {GeofenceValidationLog.objects.count()}')
"

# Reset everything and start fresh
python manage.py flush --noinput
python manage.py create_test_data --reset --with-sessions
```

---

## 📚 Additional Resources

### Files Created for Testing

- `api/management/commands/create_test_data.py` - Django management command
- `frontend/src/utils/testingUtils.js` - Frontend testing utilities
- `frontend/src/components/TestingPanel.jsx` - Testing UI panel
- `backend/setup_test_data.py` - Standalone test data script

### Test Users Available

Login with any of these accounts:
- Username: `test_customer1`, Password: `testpass123`
- Username: `test_customer2`, Password: `testpass123`
- Username: `test_admin`, Password: `testpass123`

### Sample API Endpoints to Test

```bash
# Get active sessions
curl http://localhost:8000/api/checkin/sessions/active/

# Get parking lots
curl http://localhost:8000/api/parking-lots/

# Validate geofence (POST)
curl -X POST http://localhost:8000/api/geofence/validate/ \
  -H "Content-Type: application/json" \
  -d '{"latitude": 3.1390, "longitude": 101.6869, "parking_lot_id": 1}'
```

---

## ✅ Testing Checklist

### Initial Setup
- [ ] Backend server running
- [ ] Frontend server running  
- [ ] Test data generated successfully
- [ ] Testing panel visible in development

### GPS Location Testing
- [ ] Mall location mocking works
- [ ] Office location mocking works
- [ ] Outside location triggers validation failure
- [ ] Poor GPS accuracy handled appropriately

### Check-In Flow Testing  
- [ ] Valid location allows check-in
- [ ] Invalid location blocks check-in
- [ ] Session created with correct data
- [ ] Parking slot marked as occupied

### Check-Out Flow Testing
- [ ] Check-out from correct location works
- [ ] Session status updated to completed
- [ ] Parking slot freed up
- [ ] Duration calculated correctly

### Edge Cases
- [ ] Overdue sessions handled properly
- [ ] Multiple sessions per user prevented
- [ ] Geofence validation logs created
- [ ] Error messages user-friendly

---

**🎉 You're all set!** The comprehensive testing infrastructure is now ready. Use the Testing Panel for quick frontend tests and the Django management commands for backend data generation.

For questions or issues, check the browser console and Django server logs for detailed error information.