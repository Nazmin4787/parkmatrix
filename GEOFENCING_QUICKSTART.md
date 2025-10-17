# 🚀 Geo-Fencing Quick Start

## 🎯 What's Implemented
Your parking system now requires users to be **within 500m of your college** (19.2479, 73.1471) to check in/out.

---

## ⚙️ Change Parking Location

**File:** `backend/api/utils.py` (line 11-15)

```python
COLLEGE_PARKING_CENTER = {
    "lat": 19.2479,      # ← Change this
    "lon": 73.1471,      # ← Change this
    "radius_meters": 500  # ← Adjust radius
}
```

**Get coordinates:** Right-click on Google Maps → Copy coordinates

---

## 🧪 Test Backend

```bash
cd backend
python test_geofencing.py
```

Should see: **✅ ALL TESTS COMPLETED**

---

## 📡 API Changes

### Check-In & Check-Out NOW REQUIRE:

```json
{
  "latitude": 19.2479,
  "longitude": 73.1471
}
```

### Error Response (Outside Parking):

```json
{
  "error": "Location verification failed",
  "message": "You are 750m away (allowed: 500m)",
  "distance_meters": 750
}
```

---

## 💻 Frontend Integration

### 1. Get User Location
```javascript
const location = await new Promise((resolve, reject) => {
  navigator.geolocation.getCurrentPosition(
    (pos) => resolve({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude
    }),
    reject,
    { enableHighAccuracy: true }
  );
});
```

### 2. Send to API
```javascript
const response = await fetch(`/api/bookings/${id}/check-in/`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    latitude: location.latitude,
    longitude: location.longitude
  })
});
```

### 3. Handle Errors
```javascript
if (!response.ok) {
  const error = await response.json();
  if (response.status === 403) {
    alert(`You are ${error.distance_meters}m away from parking`);
  }
}
```

---

## 📊 View Audit Logs

Location data is stored in `AuditLog.additional_data`:

```python
# Get recent check-ins with location
logs = AuditLog.objects.filter(
    action='check_in_success'
).order_by('-timestamp')[:10]

for log in logs:
    print(f"Distance: {log.additional_data.get('distance_from_parking')}m")
```

---

## 🔧 Adjust Radius

**Small lot:** `radius_meters: 100`  
**Campus:** `radius_meters: 500` ← Current  
**Large area:** `radius_meters: 1000`

---

## ✅ Files Changed

- `backend/api/utils.py` - Core logic
- `backend/api/views.py` - API endpoints
- `backend/test_geofencing.py` - Tests
- `GEOFENCING_GUIDE.md` - Full docs
- `GEOFENCING_IMPLEMENTATION_SUMMARY.md` - Summary

---

## 🆘 Troubleshooting

**Always denied:**
- Check parking center coordinates
- Verify you're testing from correct location
- Run `python test_geofencing.py`

**Frontend not working:**
- Requires HTTPS for geolocation
- User must allow location permission
- Check browser console for errors

---

## 📞 Quick Commands

```bash
# Test backend
python backend/test_geofencing.py

# Start server
cd backend
python manage.py runserver

# Test API
curl -X POST http://localhost:8000/api/bookings/1/check-in/ \
  -H "Authorization: Bearer TOKEN" \
  -d '{"latitude": 19.2479, "longitude": 73.1471}'
```

---

**Status:** ✅ Backend Complete | ⏳ Frontend Pending  
**Next:** Implement GPS capture in frontend
