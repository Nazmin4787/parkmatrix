# Phase 1 API Testing Guide

## Quick Test Commands for Check-In/Check-Out Workflow

### Prerequisites
1. Start the backend server
2. Have an admin/security user token
3. Have at least one available parking slot

---

## 1. Admin Check-In (Manual Booking)

### Test 1: Basic Check-In with Auto-Generated Code
```bash
POST http://localhost:8000/api/admin/checkin/
Authorization: Bearer YOUR_ADMIN_TOKEN

{
  "vehicle_plate": "KA01AB1234",
  "slot_id": 1,
  "vehicle_type": "car",
  "parking_zone": "COLLEGE_PARKING_CENTER"
}
```

**Expected Response:**
```json
{
  "message": "Check-in successful",
  "secret_code": "123456",  // Auto-generated
  "booking": {
    "id": 123,
    "status": "checked_in",
    "secret_code": "123456",
    ...
  },
  "instructions": "Please provide this secret code to the vehicle owner for check-out."
}
```

### Test 2: Check-In with Custom Secret Code
```bash
POST http://localhost:8000/api/admin/checkin/

{
  "vehicle_plate": "KA02XY5678",
  "slot_id": 2,
  "vehicle_type": "bike",
  "parking_zone": "METRO_PARKING_CENTER",
  "secret_code": "999888",
  "notes": "VIP guest parking"
}
```

### Test 3: Check-In with User ID
```bash
POST http://localhost:8000/api/admin/checkin/

{
  "vehicle_plate": "KA03CD9999",
  "slot_id": 3,
  "vehicle_type": "suv",
  "user_id": 5,
  "parking_zone": "HOME_PARKING_CENTER"
}
```

---

## 2. Search Bookings

### Test 4: Search by Vehicle Plate
```bash
GET http://localhost:8000/api/admin/bookings/search/?vehicle_plate=KA01AB1234
Authorization: Bearer YOUR_ADMIN_TOKEN
```

### Test 5: Search by Booking ID
```bash
GET http://localhost:8000/api/admin/bookings/search/?booking_id=123
Authorization: Bearer YOUR_ADMIN_TOKEN
```

---

## 3. Admin Check-Out (with Secret Code Verification)

### Test 6: Check-Out by Booking ID
```bash
POST http://localhost:8000/api/admin/checkout/
Authorization: Bearer YOUR_ADMIN_TOKEN

{
  "booking_id": 123,
  "secret_code": "123456"
}
```

**Expected Response:**
```json
{
  "message": "Check-out successful",
  "booking": {
    "id": 123,
    "status": "checked_out",
    ...
  },
  "payment_summary": {
    "base_charge": "₹150.00",
    "overtime_charge": "₹0.00",
    "total_charge": "₹150.00",
    "duration": "2h 15m",
    "overtime_minutes": 0
  }
}
```

### Test 7: Check-Out by Vehicle Plate
```bash
POST http://localhost:8000/api/admin/checkout/

{
  "vehicle_plate": "KA01AB1234",
  "secret_code": "123456",
  "notes": "Normal checkout - customer satisfied"
}
```

---

## 4. Error Cases

### Test 8: Invalid Secret Code
```bash
POST http://localhost:8000/api/admin/checkout/

{
  "booking_id": 123,
  "secret_code": "000000"  // Wrong code
}
```

**Expected Response:**
```json
{
  "error": "Invalid secret code"
}
```

### Test 9: Duplicate Secret Code
```bash
POST http://localhost:8000/api/admin/checkin/

{
  "vehicle_plate": "KA05XX1111",
  "slot_id": 5,
  "secret_code": "123456"  // Already used
}
```

**Expected Response:**
```json
{
  "error": "This secret code is already in use. Please use a different code or leave blank for auto-generation."
}
```

### Test 10: Occupied Slot
```bash
POST http://localhost:8000/api/admin/checkin/

{
  "vehicle_plate": "KA06YY2222",
  "slot_id": 1  // Already occupied
}
```

**Expected Response:**
```json
{
  "error": "Slot A-01 is already occupied"
}
```

---

## 5. Full Workflow Test

### Step-by-Step Manual Test:

#### Step 1: Check-In
```bash
POST /api/admin/checkin/

{
  "vehicle_plate": "TEST1234",
  "slot_id": 10,
  "vehicle_type": "car"
}
```
📝 **Note down the secret_code from response** (e.g., "456789")

#### Step 2: Verify Check-In
```bash
GET /api/admin/bookings/search/?vehicle_plate=TEST1234
```
✅ Confirm status is "checked_in"

#### Step 3: Check-Out (after some time)
```bash
POST /api/admin/checkout/

{
  "vehicle_plate": "TEST1234",
  "secret_code": "456789"  // Use the code from Step 1
}
```

#### Step 4: Verify Check-Out
```bash
GET /api/admin/bookings/search/?vehicle_plate=TEST1234
```
✅ Should return empty or show status "checked_out"

---

## Using cURL

### Check-In:
```bash
curl -X POST http://localhost:8000/api/admin/checkin/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_plate": "KA01AB1234",
    "slot_id": 1,
    "vehicle_type": "car"
  }'
```

### Check-Out:
```bash
curl -X POST http://localhost:8000/api/admin/checkout/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_plate": "KA01AB1234",
    "secret_code": "123456"
  }'
```

---

## Using Postman

1. **Import Collection:**
   - Create new collection "Check-In/Check-Out API"
   - Set collection variable `{{baseUrl}}` = `http://localhost:8000`
   - Set collection variable `{{token}}` = Your admin token

2. **Add Requests:**
   - POST `{{baseUrl}}/api/admin/checkin/`
   - POST `{{baseUrl}}/api/admin/checkout/`
   - GET `{{baseUrl}}/api/admin/bookings/search/`

3. **Set Authorization:**
   - Type: Bearer Token
   - Token: `{{token}}`

---

## Expected Audit Logs

After testing, check audit logs:
```bash
GET /api/admin/checkin-checkout-logs/
```

You should see entries for:
- ✅ `check_in_success` - For each successful check-in
- ✅ `check_out_success` - For each successful check-out
- ✅ `check_out_failed` - For invalid secret code attempts

---

## Database Verification

Check in Django admin or database:
```sql
SELECT id, vehicle_id, slot_id, secret_code, status, checked_in_at, checked_out_at
FROM api_booking
WHERE status IN ('checked_in', 'checked_out')
ORDER BY id DESC
LIMIT 10;
```

---

## Next Steps After Testing

Once all tests pass:
1. ✅ Verify secret codes are unique
2. ✅ Verify slots are marked occupied/available correctly
3. ✅ Verify audit logs are created
4. ✅ Verify payment calculations
5. ✅ Move to Phase 2 (Frontend)

---

**Happy Testing! 🚀**
