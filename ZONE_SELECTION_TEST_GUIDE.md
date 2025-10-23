# 🧪 Zone Selection Testing Guide

## Quick Test Steps

### Step 1: Open User Booking Page
1. Navigate to `http://localhost:5173/slots`
2. Make sure you're logged in as a customer (not admin)

### Step 2: Verify Zone Selector Appears
Look for the zone dropdown in the filters section:
```
[Vehicle Type Selector] [📍 Parking Zone: ▼] [Search Box]
```

### Step 3: Test "All Zones" (Default)
- Zone selector should show "All Zones" by default
- Should display slots from all parking zones
- Each slot should have a zone badge (📍 Zone Name)

### Step 4: Test Individual Zone Selection

#### Test College Parking Center
1. Select "College Parking Center" from dropdown
2. Should show: `College Parking Center (70 available)`
3. All displayed slots should show "📍 College Parking" badge
4. Should see ~70 slots

#### Test Metro Parking Center
1. Select "Metro Parking Center" from dropdown
2. Should show: `Metro Parking Center (2 available)`
3. All displayed slots should show "📍 Metro Parking" badge
4. Should see 2+ slots

#### Test Empty Zones
1. Select "Home Parking Center"
2. Should show: "No available slots match your criteria"
3. This is expected as no slots exist yet in this zone

### Step 5: Test Combined Filters

#### Zone + Vehicle Type
1. Select "College Parking Center"
2. Select vehicle type "Car"
3. Should show only Car slots in College Parking zone
4. Try "Bike" → Should show only Bike slots in College zone

#### Zone + Search
1. Select "College Parking Center"
2. Type "A-1" in search box
3. Should show only slots matching "A-1" in College zone

### Step 6: Verify Zone Badge Styling
Each slot should show a zone badge with:
- Purple gradient background (from #667eea to #764ba2)
- White text
- 📍 emoji icon
- Zone name (e.g., "College Parking", "Metro Parking")

### Step 7: Test Zone Switching
1. Select "College Parking Center" → Verify slots load
2. Switch to "Metro Parking Center" → Verify slots change
3. Switch to "All Zones" → Verify all slots appear
4. Each switch should be instant (no page reload)

---

## Expected Results

### ✅ Pass Criteria
- [ ] Zone dropdown appears in filters section
- [ ] "All Zones" shows slots from all zones
- [ ] Individual zone selection filters correctly
- [ ] Zone badges appear on all slot cards
- [ ] Zone badges have correct styling
- [ ] Combined filters work (zone + vehicle type)
- [ ] Zone switching is instant
- [ ] No console errors
- [ ] Available counts match actual slots

### ❌ Fail Indicators
- Zone dropdown not visible
- Selecting zone doesn't filter slots
- Zone badges missing or incorrectly styled
- Console errors when changing zones
- Slots not loading after zone change
- Incorrect slot counts

---

## 🐛 Common Issues & Solutions

### Issue: Zone dropdown not showing
**Solution**: 
- Check browser console for errors
- Verify backend is running (`python manage.py runserver`)
- Check Network tab for `/api/parking-zones/` request

### Issue: Slots not filtering by zone
**Solution**:
- Verify backend endpoint returns filtered data
- Check Network tab for correct query parameters
- Verify `selectedZone` state is updating

### Issue: Zone badges not appearing
**Solution**:
- Verify slots have `parking_zone` field
- Check `parking_zone_display` field exists
- Verify SlotCard component renders badge

---

## 📱 Browser Compatibility

Test on:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (responsive)

---

## 🎯 Performance Checks

- [ ] Zone list loads within 1 second
- [ ] Zone switching is instant
- [ ] No lag when changing filters
- [ ] Smooth animations on hover
- [ ] No memory leaks after multiple switches

---

## 📊 Test Data Verification

### Current Test Data
```
College Parking Center: 70 slots
Metro Parking Center: 2+ slots  
Home Parking Center: 0 slots
Vivivana Parking Center: 0 slots
```

### To Add More Test Data
```bash
# In Django admin or use Python shell
python manage.py shell

from api.models import ParkingSlot

# Add slots to Home Parking
ParkingSlot.objects.create(
    slot_number="H-A-001",
    floor=1,
    section="A",
    vehicle_type="car",
    parking_zone="HOME_PARKING_CENTER"
)
```

---

## 🎉 Success Indicators

When everything works, you should see:
1. **Clean UI**: Zone selector integrates seamlessly with existing filters
2. **Fast Loading**: Zone switching happens instantly
3. **Visual Clarity**: Each slot clearly shows its zone with badge
4. **Accurate Data**: Slot counts match what's displayed
5. **No Errors**: Browser console is clean

---

**Ready to Test?** Open `http://localhost:5173/slots` and follow the steps above!
