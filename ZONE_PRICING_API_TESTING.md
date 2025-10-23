# 🧪 Zone Pricing API Testing Guide

## Prerequisites

Before testing, ensure:
1. ✅ Backend server is running: `python backend/manage.py runserver`
2. ✅ You have admin user credentials
3. ✅ You've obtained a valid JWT access token
4. ✅ Initial zone pricing rates have been created

---

## 🔑 Authentication

### 1. Login to Get Access Token

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_password"
  }'
```

**Response:**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

**Save the access token** - you'll need it for all subsequent requests.

---

## 📋 API Testing Examples

### Test 1: List All Zone Pricing Rates

**Request:**
```bash
curl -X GET http://localhost:8000/api/zone-pricing/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:** (Paginated list of all 16 rates)
```json
{
  "count": 16,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "parking_zone": "COLLEGE_PARKING_CENTER",
      "parking_zone_display": "College Parking Center",
      "vehicle_type": "car",
      "vehicle_type_display": "Car",
      "rate_name": "College Car Rate",
      "description": "Standard parking rate for car vehicles at College Parking Center",
      "hourly_rate": "15.00",
      "daily_rate": "100.00",
      "weekend_rate": "12.00",
      "is_active": true,
      "is_valid": true,
      "effective_from": "2025-01-21T10:30:00Z",
      "effective_to": null,
      "created_by": 1,
      "created_by_name": "Admin User",
      "created_at": "2025-01-21T10:30:00Z",
      "updated_at": "2025-01-21T10:30:00Z"
    },
    // ... 15 more rates
  ]
}
```

---

### Test 2: Get Rate Summary (All Zones)

**Request:**
```bash
curl -X GET http://localhost:8000/api/zone-pricing/rate_summary/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "summary": [
    {
      "zone_code": "COLLEGE_PARKING_CENTER",
      "zone_name": "College Parking Center",
      "rate_count": 4,
      "rates": [
        {
          "id": 1,
          "vehicle_type_display": "Car",
          "hourly_rate": "15.00",
          "daily_rate": "100.00",
          "weekend_rate": "12.00"
        },
        {
          "id": 2,
          "vehicle_type_display": "Bike",
          "hourly_rate": "8.00",
          "daily_rate": "50.00",
          "weekend_rate": "6.00"
        },
        // ... 2 more vehicle types
      ]
    },
    // ... 3 more zones
  ],
  "total_zones": 4,
  "total_active_rates": 16
}
```

---

### Test 3: Get Rates for Specific Zone

**Request:**
```bash
curl -X GET "http://localhost:8000/api/zone-pricing/by_zone/?zone=METRO_PARKING_CENTER" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "zone": "METRO_PARKING_CENTER",
  "zone_display": "Metro Parking Center",
  "count": 4,
  "rates": [
    {
      "id": 9,
      "vehicle_type": "car",
      "vehicle_type_display": "Car",
      "rate_name": "Metro Car Rate",
      "hourly_rate": "30.00",
      "daily_rate": "200.00",
      "weekend_rate": "25.00",
      "is_active": true,
      "is_valid": true
    },
    {
      "id": 10,
      "vehicle_type": "bike",
      "vehicle_type_display": "Bike",
      "hourly_rate": "15.00",
      "daily_rate": "100.00",
      "weekend_rate": "12.00"
    },
    // ... 2 more vehicle types
  ]
}
```

---

### Test 4: Get Only Active Rates

**Request:**
```bash
curl -X GET "http://localhost:8000/api/zone-pricing/active_rates/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "parking_zone_display": "College Parking Center",
    "vehicle_type_display": "Car",
    "rate_name": "College Car Rate",
    "hourly_rate": "15.00",
    "is_valid": true
  },
  // ... all 16 active rates
]
```

---

### Test 5: Filter Rates by Zone and Vehicle Type

**Request:**
```bash
curl -X GET "http://localhost:8000/api/zone-pricing/?parking_zone=COLLEGE_PARKING_CENTER&vehicle_type=car" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "count": 1,
  "results": [
    {
      "id": 1,
      "parking_zone": "COLLEGE_PARKING_CENTER",
      "parking_zone_display": "College Parking Center",
      "vehicle_type": "car",
      "vehicle_type_display": "Car",
      "rate_name": "College Car Rate",
      "hourly_rate": "15.00",
      "daily_rate": "100.00",
      "weekend_rate": "12.00",
      "is_active": true
    }
  ]
}
```

---

### Test 6: Create New Zone Pricing Rate

**Request:**
```bash
curl -X POST http://localhost:8000/api/zone-pricing/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parking_zone": "COLLEGE_PARKING_CENTER",
    "vehicle_type": "suv",
    "rate_name": "College SUV Special Rate",
    "description": "Special promotional rate for SUVs",
    "hourly_rate": 18.00,
    "daily_rate": 120.00,
    "weekend_rate": 15.00,
    "is_active": false
  }'
```

**Expected Response:**
```json
{
  "id": 17,
  "parking_zone": "COLLEGE_PARKING_CENTER",
  "parking_zone_display": "College Parking Center",
  "vehicle_type": "suv",
  "vehicle_type_display": "SUV",
  "rate_name": "College SUV Special Rate",
  "description": "Special promotional rate for SUVs",
  "hourly_rate": "18.00",
  "daily_rate": "120.00",
  "weekend_rate": "15.00",
  "is_active": false,
  "is_valid": false,
  "created_by": 1,
  "created_by_name": "Admin User",
  "created_at": "2025-01-21T11:00:00Z",
  "updated_at": "2025-01-21T11:00:00Z"
}
```

---

### Test 7: Update Existing Rate (Partial)

**Request:**
```bash
curl -X PATCH http://localhost:8000/api/zone-pricing/1/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hourly_rate": 18.00,
    "weekend_rate": 15.00
  }'
```

**Expected Response:**
```json
{
  "id": 1,
  "parking_zone": "COLLEGE_PARKING_CENTER",
  "parking_zone_display": "College Parking Center",
  "vehicle_type": "car",
  "vehicle_type_display": "Car",
  "rate_name": "College Car Rate",
  "hourly_rate": "18.00",  // Updated
  "daily_rate": "100.00",
  "weekend_rate": "15.00",  // Updated
  "is_active": true,
  "updated_at": "2025-01-21T11:15:00Z"
}
```

---

### Test 8: Bulk Update Rates

**Request:**
```bash
curl -X POST http://localhost:8000/api/zone-pricing/bulk_update/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rates": [
      {
        "parking_zone": "METRO_PARKING_CENTER",
        "vehicle_type": "car",
        "rate_name": "Metro Car Premium",
        "hourly_rate": 35.00,
        "daily_rate": 250.00,
        "weekend_rate": 30.00,
        "is_active": true
      },
      {
        "parking_zone": "METRO_PARKING_CENTER",
        "vehicle_type": "bike",
        "rate_name": "Metro Bike Premium",
        "hourly_rate": 18.00,
        "daily_rate": 120.00,
        "weekend_rate": 15.00,
        "is_active": true
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "message": "Bulk update completed. Created: 0, Updated: 2, Errors: 0",
  "created": [],
  "updated": [
    {
      "id": 9,
      "rate_name": "Metro Car Premium",
      "hourly_rate": "35.00",
      "daily_rate": "250.00"
    },
    {
      "id": 10,
      "rate_name": "Metro Bike Premium",
      "hourly_rate": "18.00",
      "daily_rate": "120.00"
    }
  ],
  "errors": []
}
```

---

### Test 9: Delete a Rate

**Request:**
```bash
curl -X DELETE http://localhost:8000/api/zone-pricing/17/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```
HTTP 204 No Content
```

---

### Test 10: Try to Create Duplicate Active Rate (Should Fail)

**Request:**
```bash
curl -X POST http://localhost:8000/api/zone-pricing/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parking_zone": "COLLEGE_PARKING_CENTER",
    "vehicle_type": "car",
    "rate_name": "Duplicate Rate",
    "hourly_rate": 20.00,
    "daily_rate": 150.00,
    "is_active": true
  }'
```

**Expected Response (Error):**
```json
{
  "non_field_errors": [
    "An active rate already exists for COLLEGE_PARKING_CENTER - car. Please deactivate the existing rate first."
  ]
}
```

---

## 🧪 Using Postman

### Import Collection

Create a new Postman collection with these settings:

**Collection Variables:**
- `base_url`: `http://localhost:8000`
- `access_token`: (obtained from login)

**Authorization:**
- Type: `Bearer Token`
- Token: `{{access_token}}`

### Sample Requests:

1. **Login** - POST `{{base_url}}/api/auth/login/`
2. **Get Summary** - GET `{{base_url}}/api/zone-pricing/rate_summary/`
3. **Filter by Zone** - GET `{{base_url}}/api/zone-pricing/?parking_zone=METRO_PARKING_CENTER`
4. **Create Rate** - POST `{{base_url}}/api/zone-pricing/`
5. **Update Rate** - PATCH `{{base_url}}/api/zone-pricing/1/`

---

## 🐍 Python Testing Script

Create `test_zone_pricing.py`:

```python
import requests

BASE_URL = "http://localhost:8000"

# 1. Login
login_response = requests.post(f"{BASE_URL}/api/auth/login/", json={
    "email": "admin@example.com",
    "password": "your_password"
})
access_token = login_response.json()["access"]

headers = {
    "Authorization": f"Bearer {access_token}"
}

# 2. Get all rates
rates_response = requests.get(f"{BASE_URL}/api/zone-pricing/", headers=headers)
print(f"Total rates: {rates_response.json()['count']}")

# 3. Get Metro rates
metro_response = requests.get(
    f"{BASE_URL}/api/zone-pricing/by_zone/?zone=METRO_PARKING_CENTER",
    headers=headers
)
print(f"Metro rates: {metro_response.json()['count']}")

# 4. Create new rate
new_rate = requests.post(f"{BASE_URL}/api/zone-pricing/", headers=headers, json={
    "parking_zone": "HOME_PARKING_CENTER",
    "vehicle_type": "car",
    "rate_name": "Home Car Weekend Special",
    "hourly_rate": 8.00,
    "daily_rate": 60.00,
    "is_active": False
})
print(f"Created rate ID: {new_rate.json()['id']}")

# 5. Get rate summary
summary_response = requests.get(f"{BASE_URL}/api/zone-pricing/rate_summary/", headers=headers)
print(f"Total active rates: {summary_response.json()['total_active_rates']}")
```

Run: `python test_zone_pricing.py`

---

## ✅ Test Checklist

- [ ] Can login and get access token
- [ ] Can list all zone pricing rates
- [ ] Can get rate summary
- [ ] Can filter rates by zone
- [ ] Can filter rates by vehicle type
- [ ] Can get rates for specific zone
- [ ] Can get only active rates
- [ ] Can create new rate
- [ ] Can update existing rate (PATCH)
- [ ] Can bulk update rates
- [ ] Can delete rate
- [ ] Duplicate active rate validation works
- [ ] Weekend rate defaults to hourly rate if not set
- [ ] Invalid zone returns error
- [ ] Unauthorized access returns 401

---

## 🔍 Expected API Behavior

### Validation Rules:
1. ✅ Only one active rate per zone-vehicle combination
2. ✅ `hourly_rate` and `daily_rate` are required
3. ✅ `weekend_rate` is optional (defaults to `hourly_rate`)
4. ✅ `effective_from` defaults to current time
5. ✅ `effective_to` is optional (no expiry by default)
6. ✅ `created_by` is automatically set to current user

### Filtering:
- `parking_zone`: Exact match
- `vehicle_type`: Exact match
- `is_active`: Boolean (true/false)
- `only_valid`: Boolean - filters by current validity

### Permissions:
- All endpoints require `IsAuthenticated` AND `IsAdminUser`
- Non-admin users get 403 Forbidden

---

## 📊 Performance Testing

Test with multiple requests:

```bash
# Create 100 requests to test performance
for i in {1..100}; do
  curl -X GET "http://localhost:8000/api/zone-pricing/rate_summary/" \
    -H "Authorization: Bearer YOUR_TOKEN" &
done
```

**Expected:** All requests complete within 2 seconds

---

## 🐛 Common Errors

### Error 1: 401 Unauthorized
**Cause:** Missing or invalid access token
**Fix:** Get fresh token from login endpoint

### Error 2: 403 Forbidden
**Cause:** User is not admin
**Fix:** Ensure user has `is_staff=True` in database

### Error 3: 400 Bad Request - Duplicate Rate
**Cause:** Active rate already exists for zone-vehicle combo
**Fix:** Deactivate existing rate or set `is_active=False` on new rate

### Error 4: 404 Not Found
**Cause:** Invalid zone code or rate ID
**Fix:** Use correct zone codes (COLLEGE_PARKING_CENTER, etc.)

---

**Last Updated:** January 21, 2025
**Status:** Ready for Testing ✅
