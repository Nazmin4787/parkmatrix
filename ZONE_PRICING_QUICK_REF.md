# 🚀 Zone Pricing Quick Reference

## 📋 Phase 1 Implementation Status: ✅ COMPLETE

All backend components for zone-specific pricing are now operational!

---

## 🎯 What You Can Do Now

### 1. **View Zone Pricing Rates**

**Via Django Admin:**
- Navigate to http://localhost:8000/admin/api/zonepricingrate/
- View all 16 pre-configured rates across 4 zones
- Filter by zone, vehicle type, or active status

**Via API:**
```bash
# Get all active rates
GET /api/zone-pricing/active_rates/

# Get rates for specific zone
GET /api/zone-pricing/by_zone/?zone=METRO_PARKING_CENTER

# Get comprehensive summary
GET /api/zone-pricing/rate_summary/
```

### 2. **Manage Rates (Admin Only)**

**Create New Rate:**
```json
POST /api/zone-pricing/
{
  "parking_zone": "COLLEGE_PARKING_CENTER",
  "vehicle_type": "car",
  "rate_name": "College Car Premium",
  "description": "Premium rate for cars",
  "hourly_rate": 18.00,
  "daily_rate": 120.00,
  "weekend_rate": 15.00,
  "is_active": true
}
```

**Update Existing Rate:**
```json
PATCH /api/zone-pricing/{id}/
{
  "hourly_rate": 20.00,
  "weekend_rate": 18.00
}
```

**Bulk Update Multiple Rates:**
```json
POST /api/zone-pricing/bulk_update/
{
  "rates": [
    {
      "parking_zone": "METRO_PARKING_CENTER",
      "vehicle_type": "car",
      "hourly_rate": 35.00,
      "daily_rate": 250.00
    },
    {
      "parking_zone": "METRO_PARKING_CENTER",
      "vehicle_type": "bike",
      "hourly_rate": 18.00,
      "daily_rate": 120.00
    }
  ]
}
```

---

## 💰 Current Zone Pricing Matrix

| Zone | Car (₹/hr) | Bike (₹/hr) | SUV (₹/hr) | Truck (₹/hr) |
|------|-----------|------------|-----------|-------------|
| **College** | 15 (12*) | 8 (6*) | 20 (18*) | 25 (22*) |
| **Home** | 10 (8*) | 5 (4*) | 15 (12*) | 18 (15*) |
| **Metro** | 30 (25*) | 15 (12*) | 40 (35*) | 50 (45*) |
| **Vivivana** | 20 (18*) | 10 (8*) | 25 (22*) | 30 (27*) |

\* *Weekend rates in parentheses*

### Daily Rates (24 hours):

| Zone | Car | Bike | SUV | Truck |
|------|-----|------|-----|-------|
| **College** | ₹100 | ₹50 | ₹140 | ₹180 |
| **Home** | ₹70 | ₹30 | ₹100 | ₹120 |
| **Metro** | ₹200 | ₹100 | ₹280 | ₹350 |
| **Vivivana** | ₹140 | ₹70 | ₹180 | ₹210 |

---

## 🔍 Query Examples

### Filter by Zone:
```bash
GET /api/zone-pricing/?parking_zone=COLLEGE_PARKING_CENTER
```

### Filter by Vehicle Type:
```bash
GET /api/zone-pricing/?vehicle_type=car
```

### Get Only Active Rates:
```bash
GET /api/zone-pricing/?is_active=true
```

### Get Only Currently Valid Rates:
```bash
GET /api/zone-pricing/?only_valid=true
```

### Combine Filters:
```bash
GET /api/zone-pricing/?parking_zone=METRO_PARKING_CENTER&vehicle_type=car&is_active=true
```

---

## 🛠️ Development Commands

### Start Backend Server:
```bash
cd c:\Projects\parking-system\backend
python manage.py runserver
```

### Access Django Admin:
```
http://localhost:8000/admin/
```

### Recreate/Update Initial Rates:
```bash
cd c:\Projects\parking-system\backend
python create_zone_pricing_rates.py
```

### Django Shell Testing:
```bash
python manage.py shell

# Then in shell:
from api.models import ZonePricingRate

# Get rate for Metro car parking
rate = ZonePricingRate.objects.get(
    parking_zone='METRO_PARKING_CENTER',
    vehicle_type='car',
    is_active=True
)

print(f"Hourly: ₹{rate.hourly_rate}")
print(f"Weekend: ₹{rate.get_effective_rate(is_weekend=True)}")
print(f"Valid: {rate.is_valid_now()}")
```

---

## 📊 Model Fields Reference

| Field | Type | Description |
|-------|------|-------------|
| `parking_zone` | CharField | Zone code (COLLEGE/HOME/METRO/VIVIVANA) |
| `vehicle_type` | CharField | Vehicle type (car/bike/suv/truck/any) |
| `rate_name` | CharField | Display name |
| `description` | TextField | Detailed description (optional) |
| `hourly_rate` | Decimal(10,2) | Hourly parking rate |
| `daily_rate` | Decimal(10,2) | Daily (24hr) parking rate |
| `weekend_rate` | Decimal(10,2) | Weekend hourly rate (optional) |
| `is_active` | Boolean | Is this rate currently active? |
| `effective_from` | DateTime | When rate becomes effective |
| `effective_to` | DateTime | When rate expires (optional) |
| `created_by` | ForeignKey | User who created the rate |
| `created_at` | DateTime | Creation timestamp |
| `updated_at` | DateTime | Last update timestamp |

---

## 🔐 Permissions

All zone pricing endpoints require:
- ✅ Authentication (JWT Bearer Token)
- ✅ Admin role (`is_staff=True`)

**Example Authorization Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🎨 Frontend Integration (Next Steps)

### 1. **Create Admin Rate Management UI**
```javascript
// Fetch all rates
const response = await fetch('/api/zone-pricing/rate_summary/', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
const data = await response.json();
```

### 2. **Update Booking Calculation**
```javascript
// Get rate for selected zone and vehicle
const rate = await fetch(
  `/api/zone-pricing/by_zone/?zone=${selectedZone}`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);
```

### 3. **Display Zone Pricing to Users**
```javascript
// Show pricing info when user selects zone
<div className="zone-pricing">
  <h3>{zone.name}</h3>
  <p>Car: ₹{rate.hourly_rate}/hour</p>
  <p>Daily: ₹{rate.daily_rate}/day</p>
  <p>Weekend: ₹{rate.weekend_rate}/hour</p>
</div>
```

---

## 🐛 Troubleshooting

### Issue: Server won't start
**Error:** `ModuleNotFoundError: No module named 'apscheduler'`

**Solution:**
```bash
pip install apscheduler
```

### Issue: Can't create duplicate active rate
**Error:** `An active rate already exists for ZONE - VEHICLE_TYPE`

**Solution:** Deactivate the existing rate first, then create new one.

### Issue: Unauthorized API access
**Error:** `401 Unauthorized`

**Solution:** Ensure you're:
1. Logged in as admin user
2. Including valid JWT token in Authorization header
3. User has `is_staff=True` permission

---

## 📁 File Locations

| Component | File Path |
|-----------|-----------|
| Model | `backend/api/models.py` (line 675+) |
| Serializers | `backend/api/serializers.py` (line 1071+) |
| ViewSet | `backend/api/zone_pricing_views.py` |
| URLs | `backend/api/urls.py` |
| Admin | `backend/api/admin.py` (line 83+) |
| Migration | `backend/api/migrations/0014_zonepricingrate_and_more.py` |
| Seed Script | `backend/create_zone_pricing_rates.py` |

---

## 🎯 Phase Roadmap

### ✅ Phase 1: Zone-Specific Pricing (COMPLETE)
- [x] ZonePricingRate model
- [x] CRUD API endpoints
- [x] Admin interface
- [x] Initial data seeding
- [ ] Frontend admin UI
- [ ] Booking price calculation integration
- [ ] User-facing pricing display

### ⏳ Phase 2: Revenue Analytics (Pending)
- [ ] Zone revenue reports
- [ ] Vehicle type breakdown
- [ ] Peak hour analysis
- [ ] Occupancy correlation
- [ ] Export functionality

### ⏳ Phase 3: Dynamic Pricing (Pending)
- [ ] Surge pricing
- [ ] AI recommendations
- [ ] Seasonal automation
- [ ] Promotional discounts

---

## 🔗 Related Features

- **Parking Zone Management**: Zone selection and filtering
- **Booking System**: Will integrate zone-specific pricing
- **Admin Dashboard**: Will show zone revenue analytics
- **User Dashboard**: Will display applicable zone rates

---

**Last Updated:** January 21, 2025
**Status:** Phase 1 Backend ✅ Complete | Frontend ⏳ Pending
