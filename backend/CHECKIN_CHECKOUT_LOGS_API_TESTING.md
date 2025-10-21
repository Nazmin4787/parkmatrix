# Check-In/Check-Out Logs API Testing Guide

## Quick Start Testing

### Prerequisites
1. Backend server running
2. Admin/Security user credentials
3. API testing tool (Postman, Thunder Client, or curl)

---

## Authentication

All endpoints require authentication. Include the token in headers:
```
Authorization: Bearer <your_token>
```

---

## ADMIN/SECURITY ENDPOINTS

### 1. List All Check-In/Check-Out Logs

**Endpoint:** `GET /api/admin/checkin-checkout-logs/`

**Access:** Admin, Security

**Query Parameters:**
- `booking_id` - Filter by booking ID
- `user_id` - Filter by user ID
- `username` - Search by username
- `vehicle_plate` - Search by vehicle plate number
- `vehicle_type` - Filter by vehicle type (car, suv, bike, truck)
- `action` - Filter by action (check_in, check_out, or specific action type)
- `status` - Filter by status (success, failed)
- `date_from` - Start date (YYYY-MM-DD or ISO format)
- `date_to` - End date (YYYY-MM-DD or ISO format)
- `parking_lot` - Search by parking lot name
- `floor` - Filter by floor
- `section` - Filter by section
- `current_status` - Filter by current status (parked, left)
- `ordering` - Sort field (default: -timestamp)

**Examples:**

```bash
# Get all logs
GET /api/admin/checkin-checkout-logs/

# Get logs for specific user
GET /api/admin/checkin-checkout-logs/?user_id=5

# Get logs by vehicle plate
GET /api/admin/checkin-checkout-logs/?vehicle_plate=ABC123

# Get successful check-ins only
GET /api/admin/checkin-checkout-logs/?action=check_in&status=success

# Get logs for date range
GET /api/admin/checkin-checkout-logs/?date_from=2025-10-01&date_to=2025-10-19

# Get currently parked vehicles (check-ins without check-outs)
GET /api/admin/checkin-checkout-logs/?current_status=parked

# Get logs by parking lot and floor
GET /api/admin/checkin-checkout-logs/?parking_lot=Main&floor=G

# Get failed check-in attempts
GET /api/admin/checkin-checkout-logs/?action=check_in&status=failed
```

**Response:**
```json
[
  {
    "id": 123,
    "booking_id": 45,
    "action": "check_in_success",
    "action_display": "Check-in Success",
    "timestamp": "2025-10-19T10:30:00Z",
    "user_username": "john_doe",
    "vehicle_type": "car",
    "vehicle_plate": "ABC123",
    "parking_lot": "Main Parking",
    "slot_number": "A-101",
    "ip_address": "192.168.1.100",
    "status": "Success"
  }
]
```

---

### 2. Get Specific Log Detail

**Endpoint:** `GET /api/admin/checkin-checkout-logs/<id>/`

**Access:** Admin, Security

**Example:**
```bash
GET /api/admin/checkin-checkout-logs/123/
```

**Response:**
```json
{
  "id": 123,
  "booking_id": 45,
  "action": "check_in_success",
  "action_display": "Check-in Success",
  "timestamp": "2025-10-19T10:30:00Z",
  "user_username": "john_doe",
  "user_email": "john@example.com",
  "vehicle_type": "car",
  "vehicle_plate": "ABC123",
  "parking_lot": "Main Parking",
  "slot_number": "A-101",
  "floor": "G",
  "section": "A",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "success": true,
  "error_message": null,
  "notes": "Regular check-in",
  "additional_data": {}
}
```

---

### 3. Get Check-In/Check-Out Statistics

**Endpoint:** `GET /api/admin/checkin-checkout-logs/stats/`

**Access:** Admin, Security

**Query Parameters:**
- `date_from` - Start date (default: 30 days ago)
- `date_to` - End date (default: now)

**Examples:**
```bash
# Get stats for last 30 days (default)
GET /api/admin/checkin-checkout-logs/stats/

# Get stats for specific period
GET /api/admin/checkin-checkout-logs/stats/?date_from=2025-10-01&date_to=2025-10-19

# Get stats for today
GET /api/admin/checkin-checkout-logs/stats/?date_from=2025-10-19
```

**Response:**
```json
{
  "total_check_ins": 150,
  "failed_check_ins": 5,
  "total_check_outs": 145,
  "failed_check_outs": 2,
  "currently_parked": 42,
  "average_parking_duration_hours": 3.5,
  "total_completed_sessions": 145,
  "check_ins_by_vehicle_type": {
    "car": 100,
    "suv": 30,
    "bike": 15,
    "truck": 5
  },
  "hourly_check_ins_today": [
    {"hour": 0, "count": 0},
    {"hour": 1, "count": 0},
    {"hour": 8, "count": 15},
    {"hour": 9, "count": 25},
    ...
  ],
  "peak_hours": [
    {"hour": 9, "count": 25},
    {"hour": 17, "count": 22},
    {"hour": 8, "count": 15}
  ],
  "recent_failed_attempts": [
    {
      "id": 200,
      "booking_id": 67,
      "action": "check_in_failed",
      "timestamp": "2025-10-19T14:20:00Z",
      "user_username": "jane_smith",
      "vehicle_plate": "XYZ789",
      "status": "Failed"
    }
  ]
}
```

---

### 4. Export Logs to CSV

**Endpoint:** `GET /api/admin/checkin-checkout-logs/export/`

**Access:** Admin, Security

**Query Parameters:** Same as list endpoint (all filters apply)

**Examples:**
```bash
# Export all logs
GET /api/admin/checkin-checkout-logs/export/

# Export logs for specific date range
GET /api/admin/checkin-checkout-logs/export/?date_from=2025-10-01&date_to=2025-10-19

# Export successful check-ins only
GET /api/admin/checkin-checkout-logs/export/?action=check_in&status=success
```

**Response:** CSV file download
```csv
ID,Booking ID,Action,Status,Timestamp,User,Email,Vehicle Type,Number Plate,Parking Lot,Slot,Floor,Section,IP Address,Error Message,Notes
123,45,Check-in Success,Success,2025-10-19 10:30:00,john_doe,john@example.com,car,ABC123,Main Parking,A-101,G,A,192.168.1.100,,Regular check-in
```

---

### 5. Get Currently Parked Vehicles

**Endpoint:** `GET /api/admin/currently-parked/`

**Access:** Admin, Security

**Example:**
```bash
GET /api/admin/currently-parked/
```

**Response:**
```json
[
  {
    "id": 45,
    "user_username": "john_doe",
    "user_email": "john@example.com",
    "vehicle_info": {
      "type": "car",
      "number_plate": "ABC123",
      "model": "Toyota Camry",
      "color": "Blue"
    },
    "slot_info": {
      "slot_number": "A-101",
      "floor": "G",
      "section": "A",
      "parking_lot": "Main Parking"
    },
    "checked_in_at": "2025-10-19T10:30:00Z",
    "expected_checkout": "2025-10-19T14:30:00Z",
    "duration_minutes": 180,
    "is_overtime": false,
    "overtime_minutes": 0,
    "check_in_notes": "Regular check-in"
  }
]
```

---

## USER ENDPOINTS

### 6. Get My Check-In/Check-Out Logs

**Endpoint:** `GET /api/checkin-checkout-logs/my/`

**Access:** All authenticated users

**Example:**
```bash
GET /api/checkin-checkout-logs/my/
```

**Response:**
```json
[
  {
    "id": 123,
    "booking_id": 45,
    "action": "check_in_success",
    "action_display": "Check-in Success",
    "timestamp": "2025-10-19T10:30:00Z",
    "user_username": "john_doe",
    "vehicle_type": "car",
    "vehicle_plate": "ABC123",
    "parking_lot": "Main Parking",
    "slot_number": "A-101",
    "ip_address": "192.168.1.100",
    "status": "Success"
  }
]
```

---

### 7. Get My Current Parking

**Endpoint:** `GET /api/parking/current/`

**Access:** All authenticated users

**Example:**
```bash
GET /api/parking/current/
```

**Response (if parked):**
```json
{
  "id": 45,
  "user_username": "john_doe",
  "user_email": "john@example.com",
  "vehicle_info": {
    "type": "car",
    "number_plate": "ABC123",
    "model": "Toyota Camry",
    "color": "Blue"
  },
  "slot_info": {
    "slot_number": "A-101",
    "floor": "G",
    "section": "A",
    "parking_lot": "Main Parking"
  },
  "checked_in_at": "2025-10-19T10:30:00Z",
  "expected_checkout": "2025-10-19T14:30:00Z",
  "duration_minutes": 45,
  "is_overtime": false,
  "overtime_minutes": 0,
  "check_in_notes": "Regular check-in"
}
```

**Response (if not parked):**
```json
{
  "message": "No active parking session"
}
```
**Status Code:** 404

---

## ERROR RESPONSES

### 403 Forbidden (Non-admin/security accessing admin endpoints)
```json
{
  "error": "Permission denied"
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

### 401 Unauthorized (No token)
```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

## TESTING SCENARIOS

### Scenario 1: Admin Views All Check-Ins Today
```bash
# Get today's date
TODAY=$(date +%Y-%m-%d)

# Request
GET /api/admin/checkin-checkout-logs/?action=check_in&date_from=$TODAY&status=success
```

### Scenario 2: Security Officer Checks Currently Parked Vehicles
```bash
GET /api/admin/currently-parked/
```

### Scenario 3: Admin Exports Failed Check-Ins for Last Week
```bash
WEEK_AGO=$(date -d '7 days ago' +%Y-%m-%d)
TODAY=$(date +%Y-%m-%d)

GET /api/admin/checkin-checkout-logs/export/?status=failed&date_from=$WEEK_AGO&date_to=$TODAY
```

### Scenario 4: User Views Their Parking History
```bash
GET /api/checkin-checkout-logs/my/
```

### Scenario 5: User Checks Current Parking Status
```bash
GET /api/parking/current/
```

### Scenario 6: Admin Gets Statistics Dashboard Data
```bash
GET /api/admin/checkin-checkout-logs/stats/
```

### Scenario 7: Search Vehicle by Plate Number
```bash
GET /api/admin/checkin-checkout-logs/?vehicle_plate=ABC
```

### Scenario 8: View Check-Ins for Specific Parking Lot and Floor
```bash
GET /api/admin/checkin-checkout-logs/?parking_lot=Main&floor=G&action=check_in
```

---

## POSTMAN COLLECTION

### Quick Setup:
1. Create a new collection: "Check-In/Check-Out Logs API"
2. Set collection variable: `base_url` = `http://localhost:8000/api`
3. Set collection variable: `token` = `<your_auth_token>`
4. Add header to collection: `Authorization: Bearer {{token}}`

### Import these requests:

```json
{
  "info": {
    "name": "Check-In/Check-Out Logs API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "List All Logs",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/admin/checkin-checkout-logs/"
      }
    },
    {
      "name": "Get Log Detail",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/admin/checkin-checkout-logs/123/"
      }
    },
    {
      "name": "Get Statistics",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/admin/checkin-checkout-logs/stats/"
      }
    },
    {
      "name": "Export to CSV",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/admin/checkin-checkout-logs/export/"
      }
    },
    {
      "name": "Currently Parked",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/admin/currently-parked/"
      }
    },
    {
      "name": "My Logs",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/checkin-checkout-logs/my/"
      }
    },
    {
      "name": "My Current Parking",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/parking/current/"
      }
    }
  ]
}
```

---

## NOTES

- All timestamps are in ISO 8601 format (UTC)
- Date filters accept both `YYYY-MM-DD` and full ISO format
- CSV export filename includes timestamp
- Statistics default to last 30 days if no date range specified
- User endpoints return last 50 logs maximum
- Admin endpoints return all matching records

---

**Ready to test!** 🚀
