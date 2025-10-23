# Quick Reference - Pre-Booked Slot Check-In/Out

## 🚗 Workflow at a Glance

```
Customer                    Admin                       System
   |                          |                            |
   |--Book Slot-------------->|                            |
   |                          |                            |
   |--Arrive at Parking------>|                            |
   |                          |                            |
   |                          |--Enter Vehicle Plate------>|
   |                          |                            |
   |                          |<--Show Booking Details-----|
   |                          |                            |
   |                          |--Confirm Check-In--------->|
   |                          |                            |
   |                          |<--Secret Code Generated----|
   |                          |                            |
   |<--Notification with Code----------------------|       |
   |                          |                            |
   |--View Code in App------->|                            |
   |                          |                            |
   |--Leave Parking---------->|                            |
   |                          |                            |
   |--Show Code to Admin----->|                            |
   |                          |                            |
   |                          |--Enter Code + Vehicle----->|
   |                          |                            |
   |                          |<--Validate & Calculate-----|
   |                          |                            |
   |                          |--Process Payment---------->|
   |                          |                            |
   |<--Receipt----------------<----------------------------|
```

## 📋 Admin Quick Steps

### Check-In (3 Steps)
1. **Search**: Enter vehicle plate → Click "Search"
2. **Verify**: Review booking details → Click "Confirm Check-In"
3. **Done**: Code generated & sent to customer

### Check-Out (2 Steps)
1. **Verify**: Enter vehicle plate + secret code
2. **Process**: Click "Process Check-Out" → Show payment

## 🔑 Secret Code Format
- **Length**: 6 digits
- **Example**: `123456`
- **Type**: Numeric only
- **Unique**: Each code used only once

## 💰 Pricing
- **Base Charge**: ₹150.00
- **Overtime**: Calculated if late
- **Formula**: Base + (Overtime minutes × Hourly rate)

## 🔗 Quick Links

### Admin:
- Check-In: `/admin/checkin`
- Check-Out: `/admin/checkout`
- Dashboard: `/admin`

### Customer:
- My Parking: `/my-parking`
- Book Slot: `/booking`
- History: `/bookings`

## 🐛 Common Issues

### "No pre-booked slot found"
- ✅ Verify vehicle plate is correct
- ✅ Check if booking status is "confirmed"
- ✅ Ensure booking is within check-in window

### "Invalid secret code"
- ✅ Verify 6-digit code from customer
- ✅ Check if booking is checked-in
- ✅ Ensure no typos in code

### "Slot already occupied"
- ✅ Check if slot is actually free
- ✅ Contact support to release slot
- ✅ Assign different slot if needed

## 📱 Mobile Testing
- Frontend: `http://localhost:5173` or `http://YOUR_IP:5173`
- Backend: `http://localhost:8000` or `http://YOUR_IP:8000`

## 🔍 Debugging

### Check Logs:
```bash
# Backend logs
cd backend
python manage.py shell
>>> from api.models import Booking
>>> Booking.objects.filter(status='checked_in').count()

# View recent bookings
>>> Booking.objects.all().order_by('-id')[:5]
```

### Test API:
```bash
# Find booking
curl http://localhost:8000/api/admin/checkin/find/?vehicle_plate=TEST123

# Check-in
curl -X POST http://localhost:8000/api/admin/checkin/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vehicle_plate":"TEST123"}'

# Check-out
curl -X POST http://localhost:8000/api/admin/checkout/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vehicle_plate":"TEST123","secret_code":"123456"}'
```

## ✅ Testing Checklist

- [ ] Customer can book a slot
- [ ] Admin can search by vehicle plate
- [ ] Booking details display correctly
- [ ] Secret code generates on check-in
- [ ] Notification sent to customer
- [ ] Customer can view code in My Parking
- [ ] Copy-to-clipboard works
- [ ] Admin can checkout with valid code
- [ ] Invalid code shows error
- [ ] Payment calculates correctly
- [ ] Overtime charges work
- [ ] Slot freed after checkout

## 🎯 Success Metrics

After implementation, verify:
- ✅ Code generation: < 2 seconds
- ✅ Notification delivery: < 5 seconds
- ✅ Check-out validation: < 1 second
- ✅ No duplicate codes
- ✅ Audit logs created
- ✅ Zero downtime

---

**Status**: ✅ Phase 2 Complete
**Ready for**: Production Testing
