# Testing Guide: Check-In/Check-Out System

## 🚀 Quick Start Testing

### Step 1: Setup Test Data
```bash
# Backend setup
cd backend
python setup_test_data.py

# Or use the batch file on Windows
setup_test_data.bat
```

### Step 2: Start Development Servers
```bash
# Terminal 1 - Backend
cd backend
python manage.py runserver

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Step 3: Access Testing Interface
1. Open browser: `http://localhost:5173`
2. Login with test credentials: `test_customer1` / `testpass123`
3. Navigate to: `/check-in-out`
4. Use the **Testing Panel** (top-right corner) to mock GPS locations

---

## 📊 Test Data Overview

### 👤 Test Users
| Username | Email | Password | Role | Purpose |
|----------|-------|----------|------|---------|
| `test_customer1` | `customer1@test.com` | `testpass123` | customer | Primary testing user |
| `test_customer2` | `customer2@test.com` | `testpass123` | customer | Secondary scenarios |
| `test_admin` | `admin@test.com` | `testpass123` | admin | Admin functionality |
| `admin` | `admin@example.com` | `admin123` | admin | Super admin |

### 🏢 Test Parking Lots
| Name | Coordinates | Geofence Radius | Slots |
|------|-------------|----------------|-------|
| Test Mall Parking | `19.205500, 73.156053` | 100m | 12 |
| Test Office Complex | `19.208500, 73.154053` | 150m | 8 |
| Test Shopping Center | `19.203500, 73.159053` | 120m | 15 |
| Test Airport Parking | `19.213500, 73.164053` | 200m | 20 |

### 🎫 Pre-created Test Sessions
- **Active Sessions**: 3 sessions in progress
- **Completed Sessions**: 2 finished sessions
- **Overdue Sessions**: 1 overdue session
- **Various License Plates**: MH01AB1234, MH02CD5678, etc.

---

## 🧪 Testing Scenarios

### 1. Successful Check-In Flow ✅

**Test Steps:**
1. Use Testing Panel → Mock **"Mall Parking"** location
2. Enter vehicle info: `MH05XY1234`, Vehicle Type: `car`
3. Select any available parking slot
4. Click **"Complete Check-In"**

**Expected Result:**
- ✅ Location validation shows "Valid location"
- ✅ Check-in button becomes enabled
- ✅ Redirects to ticket page with QR code
- ✅ Session created in database

### 2. Outside Geofence ❌

**Test Steps:**
1. Use Testing Panel → Mock **"Far Location"**
2. Try to enter vehicle information
3. Attempt check-in

**Expected Result:**
- ❌ Location validation shows "Outside parking area"
- ❌ Check-in button remains disabled
- ❌ Error message displayed

### 3. GPS Permission Denied 🚫

**Test Steps:**
1. Use Testing Panel → **"Permission Denied"** error
2. Try to get location

**Expected Result:**
- ❌ Error message about GPS permission
- ⚠️ Fallback options offered
- 📱 Instructions to enable GPS

### 4. Edge Case - Boundary Location ⚠️

**Test Steps:**
1. Use Testing Panel → **"Boundary Case"** location
2. Attempt check-in process

**Expected Result:**
- ⚠️ May show valid or invalid (depends on exact calculation)
- 📊 Good for testing geofence accuracy

### 5. Low GPS Accuracy 📶

**Test Steps:**
1. Use Testing Panel → **"Low Accuracy Valid"** location
2. Check GPS accuracy indicator

**Expected Result:**
- ⚠️ Warning about low GPS accuracy
- 🔄 Option to retry location
- 📋 May require manual verification

---

## 🛠️ Testing Tools

### 🧪 Testing Panel Features
- **Location Mocking**: Override GPS with test coordinates
- **Error Simulation**: Test GPS permission, timeout, unavailable errors
- **Scenario Testing**: Pre-defined test scenarios
- **Real-time Results**: Live testing feedback
- **Quick Reset**: Return to browser GPS

### 📍 Test Coordinates
```javascript
// Valid locations (inside geofence)
VALID_MALL_PARKING: 19.205500, 73.156053
VALID_OFFICE_COMPLEX: 19.208500, 73.154053  
VALID_SHOPPING_CENTER: 19.203500, 73.159053

// Invalid locations (outside geofence)
INVALID_FAR_LOCATION: 19.220000, 73.170000
INVALID_DIFFERENT_AREA: 19.190000, 73.140000

// Edge cases
BOUNDARY_MALL: 19.206400, 73.156953 (near boundary)
```

### 🚗 Test Vehicle Data
```javascript
// Use these license plates for testing
TEST_VEHICLES = [
  { license_plate: 'MH01AB1234', vehicle_type: 'car' },
  { license_plate: 'MH02CD5678', vehicle_type: 'motorcycle' },
  { license_plate: 'KA05XY7890', vehicle_type: 'van' }
]
```

---

## 🔍 Manual Testing Checklist

### Check-In Process
- [ ] Location permission request works
- [ ] GPS coordinates are obtained
- [ ] Geofence validation works correctly
- [ ] Available slots load properly
- [ ] Slot selection works
- [ ] Vehicle info validation works
- [ ] Check-in API call succeeds
- [ ] Redirect to ticket page works
- [ ] QR code displays correctly

### Ticket Page
- [ ] Session details display correctly
- [ ] QR code is readable
- [ ] Time remaining updates
- [ ] Check-out button works
- [ ] Share/print functionality works

### Check-Out Process
- [ ] Location validation on check-out
- [ ] Check-out API call succeeds
- [ ] Redirect to success page
- [ ] Receipt generation works
- [ ] Session marked as completed

### Error Handling
- [ ] GPS permission denied handled
- [ ] Network errors handled gracefully
- [ ] Outside geofence handled
- [ ] Invalid vehicle data handled
- [ ] API errors displayed properly

---

## 🐛 Common Issues & Solutions

### Issue: GPS Always Shows Invalid
**Solution:**
- Check Testing Panel is set to valid location
- Verify geofence radius in test data
- Check browser GPS permissions

### Issue: No Available Slots
**Solution:**
- Run test data setup again: `python setup_test_data.py --reset --with-sessions`
- Check if all slots are marked as occupied

### Issue: Check-in API Fails
**Solution:**
- Verify backend is running on port 8000
- Check Django logs for errors
- Ensure test users exist in database

### Issue: QR Code Not Displaying
**Solution:**
- Check if PIL/Pillow is installed: `pip install Pillow`
- Verify QR code generation in backend logs
- Check image serving in Django settings

---

## 📱 Mobile Testing

### Using Chrome DevTools
1. Open DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select mobile device (iPhone, Android)
4. Test geolocation features

### Real Device Testing
1. Connect mobile device to same network
2. Access via IP: `http://YOUR_IP:5173`
3. Allow GPS permissions on mobile browser
4. Test with real GPS coordinates

---

## 🔧 Advanced Testing

### Load Testing
```bash
# Install artillery
npm install -g artillery

# Run load test on check-in endpoint
artillery run load-test-checkin.yml
```

### Database Queries Testing
```python
# Django shell testing
python manage.py shell

# Test queries
from api.checkin_models import CheckInOutSession
CheckInOutSession.objects.filter(status='active').count()
```

### API Testing with curl
```bash
# Test check-in endpoint
curl -X POST http://localhost:8000/api/checkin/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "parking_slot_id": 1,
    "license_plate": "TEST123",
    "vehicle_type": "car",
    "user_lat": 19.205500,
    "user_lon": 73.156053
  }'
```

---

## 📈 Performance Testing

### Frontend Performance
- Check bundle size: `npm run build`
- Test loading times with slow 3G throttling
- Monitor memory usage during long sessions

### Backend Performance
- Monitor database query count
- Check API response times
- Test concurrent user scenarios

---

## ✅ Testing Completion Criteria

### Functional Testing
- [ ] All positive test cases pass
- [ ] All negative test cases handled properly
- [ ] Error messages are user-friendly
- [ ] Data persistence works correctly

### User Experience Testing  
- [ ] UI is responsive on all devices
- [ ] Loading states are clear
- [ ] Success/error feedback is immediate
- [ ] Navigation flow is intuitive

### Security Testing
- [ ] User authentication required
- [ ] Location data handled securely
- [ ] No sensitive data in client-side logs
- [ ] API endpoints properly protected

---

## 🎯 Next Steps After Testing

1. **Performance Optimization**: Based on test results
2. **Security Audit**: Review authentication and data handling
3. **User Acceptance Testing**: Test with real users
4. **Production Deployment**: Deploy to staging environment
5. **Monitoring Setup**: Add logging and analytics

---

## 📞 Support

If you encounter issues during testing:

1. **Check Logs**: Browser console + Django logs
2. **Reset Test Data**: Run setup script again
3. **Clear Browser Data**: Clear cache and localStorage
4. **Restart Servers**: Kill and restart both backend/frontend

**Happy Testing! 🎉**