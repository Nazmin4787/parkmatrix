# 📍 PARKING LOCATIONS - QUICK REFERENCE

## Current Setup (October 17, 2025)

### 🎓 Location 1: College Parking
```
Coordinates: 19.2479, 73.1471
Radius:      500 meters
Name:        "College Parking"
Google Maps: https://www.google.com/maps?q=19.2479,73.1471
```

### 🏠 Location 2: Home Parking
```
Coordinates: 19.2056, 73.1556
Radius:      500 meters
Name:        "Home Parking"
Google Maps: https://www.google.com/maps?q=19.2056,73.1556
```

---

## 📝 Configuration Files

### Backend: `backend/api/utils.py`
```python
COLLEGE_PARKING_CENTER = {
    "lat": 19.2479,
    "lon": 73.1471,
    "radius_meters": 500,
    "name": "College Parking"
}

HOME_PARKING_CENTER = {
    "lat": 19.2056,
    "lon": 73.1556,
    "radius_meters": 500,
    "name": "Home Parking"
}

PARKING_LOCATIONS = [
    COLLEGE_PARKING_CENTER,
    HOME_PARKING_CENTER
]
```

### Frontend: `frontend/src/services/geolocation.jsx`
```javascript
export const COLLEGE_PARKING_CENTER = {
  lat: 19.2479,
  lon: 73.1471,
  radius_meters: 500,
  name: 'College Parking'
};

export const HOME_PARKING_CENTER = {
  lat: 19.2056,
  lon: 73.1556,
  radius_meters: 500,
  name: 'Home Parking'
};

export const PARKING_LOCATIONS = [
  COLLEGE_PARKING_CENTER,
  HOME_PARKING_CENTER
];
```

---

## ✏️ How to Change Coordinates

### 1. Update Backend
Edit: `backend/api/utils.py` (Lines 9-27)

### 2. Update Frontend
Edit: `frontend/src/services/geolocation.jsx` (Lines 7-25)

### 3. Update Tests (Optional)
Edit: `backend/test_geofencing.py` (Lines 11-29)

### 4. Restart Servers
```bash
# Backend terminal
cd backend
python manage.py runserver 8000

# Frontend terminal
cd frontend
npm run dev
```

---

## 🧪 Test Your Changes

```bash
cd backend
python test_geofencing.py
```

Should show both locations in the output.

---

## 🔍 Find New Coordinates

**Method 1: Google Maps**
1. Go to https://www.google.com/maps
2. Right-click on location
3. Click "What's here?"
4. Copy coordinates (e.g., `19.2479, 73.1471`)

**Method 2: Your Phone**
1. Stand at parking location
2. Open parking app
3. Click "Verify Location"
4. Check console for coordinates

---

## 📊 Current Distance Rules

- ✅ **Within 500m** of College → Check-in allowed
- ✅ **Within 500m** of Home → Check-in allowed
- ❌ **Outside both** → Shows distance to nearest location

---

## 🎯 Quick Add New Location

```python
# 1. Add to backend/api/utils.py
NEW_LOCATION_CENTER = {
    "lat": YOUR_LATITUDE,
    "lon": YOUR_LONGITUDE,
    "radius_meters": 500,
    "name": "Your Location Name"
}

PARKING_LOCATIONS = [
    COLLEGE_PARKING_CENTER,
    HOME_PARKING_CENTER,
    NEW_LOCATION_CENTER  # Add here
]
```

```javascript
// 2. Add to frontend/src/services/geolocation.jsx
export const NEW_LOCATION_CENTER = {
  lat: YOUR_LATITUDE,
  lon: YOUR_LONGITUDE,
  radius_meters: 500,
  name: 'Your Location Name'
};

export const PARKING_LOCATIONS = [
  COLLEGE_PARKING_CENTER,
  HOME_PARKING_CENTER,
  NEW_LOCATION_CENTER  // Add here
];
```

---

**Last Updated:** October 17, 2025  
**Status:** ✅ Multi-location support active  
**Locations:** 2 (College + Home)
