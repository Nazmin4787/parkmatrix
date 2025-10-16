
# 🧪 Phase 9: Manual Testing Instructions

## 🎯 Frontend Testing Workflow

### 1. Start Both Servers
- Frontend: http://localhost:5173/ 
- Backend: http://127.0.0.1:8000/

### 2. Login as Test User
- Email: testuser@example.com
- Password: testpass123

### 3. Navigate to Enhanced Bookings
- Go to: http://localhost:5173/bookings
- You should see 3 test bookings

### 4. Test Check-In Process
- Find a booking with "Ready for Check-in" status
- Click "Check In" button
- Verify:
  - Button shows loading state
  - Toast notification appears
  - Status changes to "Checked In"
  - Status badge animates

### 5. Test Check-Out Process  
- Find a checked-in booking
- Click "Check Out" button
- Verify:
  - Button shows loading state
  - Toast notification appears
  - Status changes to "Checked Out"
  - Overtime charges shown (if any)

### 6. Test Tab Filtering
- Click different tabs (Active, Checked In, Completed, All)
- Verify bookings filter correctly
- Check booking counts in tab labels

### 7. Test Auto-Refresh
- Make changes in another browser tab
- Wait 15 seconds
- Verify changes appear automatically

### 8. Test Error Scenarios
- Try checking in an already checked-in booking
- Try checking out a confirmed booking
- Verify appropriate error messages

### 9. Test Mobile Responsiveness
- Resize browser window
- Test on mobile device
- Verify responsive design works

### 10. Compare Legacy vs Enhanced
- Visit: http://localhost:5173/bookings-legacy
- Compare functionality and design
- Verify both work correctly

## ✅ Success Criteria
- [ ] All buttons respond correctly
- [ ] Status updates work in real-time
- [ ] Animations and transitions smooth
- [ ] Error messages clear and helpful
- [ ] Mobile design responsive
- [ ] Auto-refresh functions properly
- [ ] Tab filtering accurate
- [ ] Toast notifications appear
- [ ] Check-in/check-out workflow complete

## 📊 Expected Results
- **Ready bookings**: Can check-in
- **Checked-in bookings**: Can check-out
- **Completed bookings**: Read-only display
- **Real-time updates**: Status changes immediately
- **Error handling**: Clear feedback on invalid actions
