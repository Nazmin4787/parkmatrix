# Feature 2: User Parking History - Quick Reference

## 🚀 Quick Start

### Start Backend
```bash
cd backend
.\activate_env.ps1
python manage.py runserver
```

### Test API
```bash
cd backend
.\test_user_history_api.ps1
```

---

## 📋 API Endpoints Cheat Sheet

### User Endpoints (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/parking-history/` | List all sessions |
| GET | `/api/user/parking-history/{id}/` | Session details |
| GET | `/api/user/parking-history/stats/` | User statistics |
| GET | `/api/user/parking-history/export/` | Export to CSV |

### Admin Endpoints (Admin Role Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/user-history/{user_id}/` | Any user's history |
| GET | `/api/admin/user-history/{user_id}/stats/` | Any user's stats |

---

## 🔍 Query Parameters

### List & Export Endpoints

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `start_date` | date | From date | `2024-10-01` |
| `end_date` | date | To date | `2024-10-31` |
| `location` | string | Location name | `Downtown` |
| `status` | string | Session status | `completed` |
| `vehicle_type` | string | Vehicle type | `car` |
| `page` | integer | Page number | `1` |
| `page_size` | integer | Results per page | `20` |
| `ordering` | string | Sort field | `-start_time` |

### Stats Endpoint

| Parameter | Type | Description |
|-----------|------|-------------|
| `start_date` | date | Stats from date |
| `end_date` | date | Stats to date |

---

## 📊 Response Objects

### Session List Item
```json
{
  "id": 123,
  "vehicle_plate": "XK01AB1234",
  "vehicle_type": "car",
  "location_name": "Downtown Parking",
  "check_in_time": "2024-10-15T09:00:00Z",
  "check_out_time": "2024-10-15T17:30:00Z",
  "duration": "8h 30m",
  "amount": 850.00,
  "session_status": "completed"
}
```

### Statistics Object
```json
{
  "total_sessions": 45,
  "total_time_parked": {
    "minutes": 15480,
    "formatted": "258 hours"
  },
  "total_amount_paid": 38500.00,
  "favorite_location": {
    "name": "Downtown Parking",
    "count": 23
  },
  "most_used_vehicle": {
    "type": "car",
    "plate": "XK01AB1234",
    "count": 40
  },
  "average_duration_minutes": 344,
  "average_amount": 855.56,
  "this_month": {
    "sessions": 8,
    "total_amount": 6800.00
  },
  "active_sessions": 2,
  "completed_sessions": 43
}
```

---

## 🧪 Test Commands

### Get Token
```bash
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```

### List History
```bash
curl http://127.0.0.1:8000/api/user/parking-history/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Filter by Status
```bash
curl "http://127.0.0.1:8000/api/user/parking-history/?status=completed" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Statistics
```bash
curl http://127.0.0.1:8000/api/user/parking-history/stats/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Export CSV
```bash
curl http://127.0.0.1:8000/api/user/parking-history/export/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -O
```

---

## 🔐 Authentication

All endpoints require JWT Bearer token:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Get token from login endpoint.

---

## 📁 Files Reference

| File | Purpose |
|------|---------|
| `user_history_views.py` | View functions (6 endpoints) |
| `serializers.py` | Data serializers (6 added) |
| `urls.py` | URL routing (6 routes added) |
| `test_user_history_api.ps1` | Test script |

---

## ✅ Status Values

### Session Status
- `pending` - Booking pending
- `active` - Currently parked or confirmed
- `completed` - Checked out
- `cancelled` - Booking cancelled
- `expired` - Booking expired

### Payment Status
- `pending` - Not yet paid
- `paid` - Payment complete
- `refunded` - Cancelled booking

---

## 🎯 Common Use Cases

### 1. Get Last 10 Sessions
```
GET /api/user/parking-history/?page_size=10
```

### 2. Get This Month's History
```
GET /api/user/parking-history/?start_date=2024-10-01&end_date=2024-10-31
```

### 3. Get Only Completed Sessions
```
GET /api/user/parking-history/?status=completed
```

### 4. Filter by Location
```
GET /api/user/parking-history/?location=Downtown
```

### 5. Get Full Statistics
```
GET /api/user/parking-history/stats/
```

---

## 💡 Tips

- Use `page_size` to limit results
- Default ordering is newest first (`-start_time`)
- Export includes all filtered data
- Statistics can be filtered by date range
- Admin can view any user's data by user ID

---

## 🐛 Troubleshooting

### 401 Unauthorized
- Check token is valid
- Token may be expired (refresh it)

### 403 Forbidden (Admin endpoints)
- User must have admin or security role

### 404 Not Found (Detail endpoint)
- Session ID doesn't exist
- Session doesn't belong to user

### Empty Results
- User has no parking history
- Filters too restrictive
- Check date range format (YYYY-MM-DD)

---

**Quick Reference for Feature 2: User Parking History**  
_Backend API v1.0_
