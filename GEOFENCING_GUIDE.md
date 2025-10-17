# 🌍 Geo-Fencing Implementation Guide

## Overview
This document describes the geo-fencing feature implemented in the Smart Parking System. The feature ensures that users can only check in/check out when they are physically present at the parking location.

## 📍 Configuration

### Parking Location Settings
Location: **`backend/api/utils.py`**

```python
COLLEGE_PARKING_CENTER = {
    "lat": 19.2479,      # Your college latitude
    "lon": 73.1471,      # Your college longitude
    "radius_meters": 500  # Allowed radius (500m = ~0.31 miles)
}
```

### How to Update Location
1. Get your college GPS coordinates from Google Maps:
   - Right-click on your parking area
   - Click on the coordinates to copy
   - Format: `19.2479, 73.1471`

2. Update `COLLEGE_PARKING_CENTER` in `backend/api/utils.py`

3. Adjust `radius_meters` based on your campus size:
   - Small parking lot: 100-200m
   - Campus parking: 300-500m
   - Large campus: 500-1000m

---

## 🔧 Backend Implementation

### Files Modified

#### 1. **`backend/api/utils.py`** (New Functions)
- `calculate_distance()` - Haversine formula for GPS distance
- `is_within_parking_area()` - Validates if user is within radius
- `validate_location_data()` - Validates GPS coordinate format

#### 2. **`backend/api/views.py`** (Updated Views)
- `CheckInView` - Added location validation before check-in
- `CheckOutView` - Added location validation before check-out

### API Changes

#### Check-In Endpoint: `POST /api/bookings/{id}/check-in/`

**New Required Parameters:**
```json
{
  "latitude": 19.2479,
  "longitude": 73.1471,
  "notes": "Optional notes"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Check-in successful",
  "booking": { ... }
}
```

**Error Responses:**

**400 Bad Request - Location Missing:**
```json
{
  "error": "Location required",
  "message": "Please enable GPS/location services to check in. Your location must be verified to ensure you are at the parking area."
}
```

**400 Bad Request - Invalid Location:**
```json
{
  "error": "Invalid location data",
  "message": "Latitude must be between -90 and 90 degrees"
}
```

**403 Forbidden - Outside Parking Area:**
```json
{
  "error": "Location verification failed",
  "message": "You must be at the parking location to check in. You are 750m away from the parking area (allowed radius: 500m).",
  "distance_meters": 750,
  "allowed_radius_meters": 500,
  "parking_center": {
    "lat": 19.2479,
    "lon": 73.1471
  }
}
```

#### Check-Out Endpoint: `POST /api/bookings/{id}/check-out/`
Same changes as Check-In endpoint.

---

## 🔬 Testing

### Test the Backend
```bash
cd backend
python test_geofencing.py
```

This will test:
- Distance calculations
- Location validation
- Radius checking
- Error handling

### Manual API Testing

**Test with cURL (from college):**
```bash
curl -X POST http://localhost:8000/api/bookings/1/check-in/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 19.2479,
    "longitude": 73.1471,
    "notes": "Testing check-in"
  }'
```

**Test from outside (should fail):**
```bash
curl -X POST http://localhost:8000/api/bookings/1/check-in/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 18.5204,
    "longitude": 73.8567,
    "notes": "Testing from Pune"
  }'
```

---

## 📊 Audit Logs

Location data is automatically stored in the `AuditLog` table for security and analytics:

```json
{
  "booking_id": 123,
  "action": "check_in_success",
  "additional_data": {
    "latitude": 19.2479,
    "longitude": 73.1471,
    "distance_from_parking": 45.2,
    "within_allowed_area": true
  }
}
```

---

## 🎯 Next Steps: Frontend Implementation

### 1. Update Check-In Component

**Location:** `frontend/src/pages/CheckInPage.jsx` (or similar)

```javascript
const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => reject(error),
      { 
        enableHighAccuracy: true, 
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

const handleCheckIn = async (bookingId) => {
  try {
    setLoading(true);
    
    // Get user's current location
    const location = await getUserLocation();
    
    // Call API with location
    const response = await fetch(`/api/bookings/${bookingId}/check-in/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        latitude: location.latitude,
        longitude: location.longitude,
        notes: ''
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Show error message
      if (response.status === 403) {
        alert(`❌ ${data.message}\n\nYou are ${data.distance_meters}m away from the parking area.`);
      } else {
        alert(data.message || data.error);
      }
      return;
    }
    
    // Success!
    alert('✅ Check-in successful!');
    // Refresh booking data...
    
  } catch (error) {
    if (error.message.includes('Geolocation')) {
      alert('❌ Please enable GPS/location services in your browser settings.');
    } else {
      alert('❌ Could not get your location. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};
```

### 2. Add UI Indicators

```jsx
<button 
  onClick={() => handleCheckIn(booking.id)}
  disabled={loading}
>
  {loading ? (
    <>
      <Spinner /> Getting your location...
    </>
  ) : (
    <>
      📍 Check In
    </>
  )}
</button>

{/* Optional: Show distance from parking */}
{distance && (
  <div className="distance-indicator">
    📏 {distance}m from parking area
  </div>
)}
```

---

## 🔒 Security Considerations

### What's Protected
✅ User must be physically at parking location  
✅ Location data logged in audit trail  
✅ Cannot spoof location from different city  
✅ Rate limiting prevents brute force attempts  

### What's NOT Protected
⚠️ Sophisticated GPS spoofing apps (advanced users)  
⚠️ Location sharing between users at same location  

### Additional Security (Optional)
- Add IP geolocation as secondary check
- Implement device fingerprinting
- Add time-based validation (can't check in/out too quickly)
- Monitor suspicious patterns in audit logs

---

## 📱 Browser Location Permissions

### User Experience Flow
1. User clicks "Check In"
2. Browser asks: "Allow parkmatrix.com to access your location?"
3. User clicks "Allow"
4. App gets coordinates and sends to backend
5. Backend validates and allows/denies check-in

### Troubleshooting Location Issues

**"Location permission denied":**
- Browser Settings → Privacy → Location → Allow for your site

**"Location timeout":**
- Increase timeout in `getCurrentPosition()` options
- Check if GPS is enabled on device

**"Location unavailable":**
- Ensure HTTPS (geolocation requires secure context)
- Check if device has GPS/location services

---

## 🧪 Testing Scenarios

### Test Case 1: Valid Check-In ✅
- **Location:** Inside parking area (< 500m)
- **Expected:** Check-in succeeds
- **Verify:** Audit log shows correct distance

### Test Case 2: Outside Parking Area ❌
- **Location:** 1km away from parking
- **Expected:** Error message with distance
- **Verify:** Check-in blocked, error logged

### Test Case 3: No GPS Permission ❌
- **Action:** Deny location permission
- **Expected:** Error asking to enable GPS
- **Verify:** User-friendly error message

### Test Case 4: Invalid Coordinates ❌
- **Data:** `{lat: 999, lon: 999}`
- **Expected:** 400 Bad Request
- **Verify:** Validation error message

---

## 📈 Analytics & Monitoring

### Useful Queries

**Check-ins by distance:**
```sql
SELECT 
  booking_id,
  additional_data->>'distance_from_parking' as distance,
  timestamp
FROM api_auditlog
WHERE action = 'check_in_success'
ORDER BY CAST(additional_data->>'distance_from_parking' AS FLOAT) DESC;
```

**Failed location validations:**
```sql
SELECT 
  COUNT(*) as failed_attempts,
  DATE(timestamp) as date
FROM api_auditlog
WHERE 
  action = 'check_in_failed' 
  AND error_message LIKE '%location%'
GROUP BY DATE(timestamp);
```

---

## 🛠️ Configuration Options

### Adjust for Different Scenarios

**Small parking lot (strict):**
```python
COLLEGE_PARKING_CENTER = {
    "lat": 19.2479,
    "lon": 73.1471,
    "radius_meters": 100  # 100m radius
}
```

**Large campus (lenient):**
```python
COLLEGE_PARKING_CENTER = {
    "lat": 19.2479,
    "lon": 73.1471,
    "radius_meters": 1000  # 1km radius
}
```

**Multiple parking sections (advanced):**
```python
PARKING_SECTIONS = {
    "north_parking": {"lat": 19.2479, "lon": 73.1471, "radius_meters": 300},
    "south_parking": {"lat": 19.2450, "lon": 73.1480, "radius_meters": 300},
    "visitor_parking": {"lat": 19.2490, "lon": 73.1465, "radius_meters": 200}
}
```

---

## ✅ Implementation Checklist

### Backend ✅ (COMPLETED)
- [x] Add location configuration
- [x] Implement distance calculation (Haversine)
- [x] Add location validation function
- [x] Update CheckInView with geo-fencing
- [x] Update CheckOutView with geo-fencing
- [x] Store location in audit logs
- [x] Add error responses with distance info

### Frontend (NEXT)
- [ ] Add geolocation API call
- [ ] Update check-in handler
- [ ] Update check-out handler
- [ ] Add loading states
- [ ] Display error messages
- [ ] Handle permission denied
- [ ] Test on mobile devices

### Testing
- [ ] Run backend tests
- [ ] Test API with cURL
- [ ] Test from inside parking area
- [ ] Test from outside parking area
- [ ] Test without GPS permission
- [ ] Test on different browsers
- [ ] Test on mobile devices

---

## 📞 Support

**Common Issues:**
- Location not working → Check HTTPS and browser permissions
- Always denied → Verify parking center coordinates
- Timeout errors → Increase timeout in geolocation options

**Need Help?**
- Check audit logs for debugging
- Review browser console for errors
- Verify GPS is enabled on device

---

**Last Updated:** October 17, 2025  
**Version:** 1.0  
**Status:** Backend ✅ Complete | Frontend ⏳ Pending
