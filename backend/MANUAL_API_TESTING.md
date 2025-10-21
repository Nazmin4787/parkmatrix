# Manual API Testing Commands for Check-In/Check-Out Logs

## Prerequisites
1. Server running at: http://127.0.0.1:8000
2. Admin/Security user credentials
3. Some test data (check-ins/check-outs)

## Step 1: Get Authentication Token

```bash
# Login (replace email/password with your admin credentials)
curl -X POST http://127.0.0.1:8000/api/auth/login/ ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@example.com\",\"password\":\"admin123\"}"

# Save the token from response
# Response will be: {"access": "TOKEN_HERE", "refresh": "...", "user": {...}}
```

## Step 2: Test List All Logs

```bash
# Replace YOUR_TOKEN with actual token from Step 1
curl -X GET http://127.0.0.1:8000/api/admin/checkin-checkout-logs/ ^
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Step 3: Test with Filters

```bash
# Filter by check-in success
curl -X GET "http://127.0.0.1:8000/api/admin/checkin-checkout-logs/?action=check_in&status=success" ^
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by date range
curl -X GET "http://127.0.0.1:8000/api/admin/checkin-checkout-logs/?date_from=2025-10-01" ^
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter currently parked
curl -X GET "http://127.0.0.1:8000/api/admin/checkin-checkout-logs/?current_status=parked" ^
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Step 4: Test Statistics

```bash
curl -X GET http://127.0.0.1:8000/api/admin/checkin-checkout-logs/stats/ ^
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Step 5: Test Currently Parked Vehicles

```bash
curl -X GET http://127.0.0.1:8000/api/admin/currently-parked/ ^
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Step 6: Test User's Own Logs

```bash
curl -X GET http://127.0.0.1:8000/api/checkin-checkout-logs/my/ ^
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Step 7: Test Current Parking

```bash
curl -X GET http://127.0.0.1:8000/api/parking/current/ ^
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Step 8: Test CSV Export

```bash
curl -X GET http://127.0.0.1:8000/api/admin/checkin-checkout-logs/export/ ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -o checkin_logs.csv
```

## Step 9: Test Log Detail (if you have a log ID)

```bash
# Replace 1 with actual log ID
curl -X GET http://127.0.0.1:8000/api/admin/checkin-checkout-logs/1/ ^
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Using PowerShell (Better for Windows)

### Step 1: Login
```powershell
$body = @{
    email = "admin@example.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/login/" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"

$token = $response.access
Write-Host "Token: $token"
```

### Step 2: Test List Logs
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$logs = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/admin/checkin-checkout-logs/" `
    -Headers $headers

$logs | ConvertTo-Json -Depth 3
```

### Step 3: Test Statistics
```powershell
$stats = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/admin/checkin-checkout-logs/stats/" `
    -Headers $headers

Write-Host "Statistics:"
$stats | ConvertTo-Json -Depth 3
```

### Step 4: Test Currently Parked
```powershell
$parked = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/admin/currently-parked/" `
    -Headers $headers

Write-Host "Currently Parked Vehicles: $($parked.Count)"
$parked | ConvertTo-Json -Depth 3
```

---

## Expected Responses

### Login Success:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### List Logs Success:
```json
[
  {
    "id": 1,
    "booking_id": 5,
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

### Statistics Success:
```json
{
  "total_check_ins": 10,
  "failed_check_ins": 2,
  "total_check_outs": 8,
  "failed_check_outs": 0,
  "currently_parked": 5,
  "average_parking_duration_hours": 3.5,
  "total_completed_sessions": 8,
  "check_ins_by_vehicle_type": {
    "car": 6,
    "bike": 2,
    "suv": 2
  }
}
```

---

## Common Issues

### Issue: 401 Unauthorized
**Solution:** Token expired or invalid. Re-login to get new token.

### Issue: 403 Forbidden
**Solution:** User doesn't have admin/security role. Use admin credentials.

### Issue: 404 Not Found
**Solution:** Endpoint URL is incorrect or log ID doesn't exist.

### Issue: Empty array [] returned
**Solution:** No check-in/check-out logs exist yet. Create test bookings and check-in first.

---

## Creating Test Data (Optional)

If you don't have test data, create some bookings and check them in:

1. Create a booking via admin panel or API
2. Check-in the booking
3. Then run the tests again

---

Ready to test! 🚀
