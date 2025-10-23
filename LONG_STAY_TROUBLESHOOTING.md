# Long-Stay Detection - Troubleshooting Guide

## ✅ Issue Fixed: Authentication Error

### **Problem**
Error message: "Given token not valid for any token type"

### **Root Cause**
The longStayDetection service was using the wrong localStorage key name:
- ❌ Was using: `access_token` (snake_case)
- ✅ Should use: `accessToken` (camelCase)

### **Solution Applied**
Updated `frontend/src/services/longStayDetection.js` to:
1. Import and use the shared `httpClient` 
2. Automatically uses correct `accessToken` from localStorage
3. Inherits automatic token refresh on 401 errors

---

## 🔧 Quick Fixes

### **If you still see authentication errors:**

1. **Check if you're logged in**
   - Open browser console (F12)
   - Type: `localStorage.getItem('accessToken')`
   - Should return a JWT token string
   - If null, you need to sign in

2. **Sign in as Admin**
   ```
   Navigate to: http://localhost:5173/signin
   Use admin credentials
   ```

3. **Clear and re-login**
   ```javascript
   // In browser console:
   localStorage.clear();
   // Then sign in again
   ```

4. **Check user role**
   ```javascript
   // In browser console:
   JSON.parse(localStorage.getItem('user')).role
   // Should be 'admin' or 'security'
   ```

---

## 🚀 Testing Checklist

### **Step 1: Verify Backend is Running**
```bash
# In backend terminal, should see:
✅ APScheduler started successfully
Scheduled jobs: ['long_stay_detection', ...]
```

### **Step 2: Verify Frontend is Running**
```bash
# In frontend terminal:
npm run dev
# Should open at http://localhost:5173
```

### **Step 3: Sign In**
1. Go to: http://localhost:5173/signin
2. Sign in with admin account
3. Check browser console for any errors

### **Step 4: Access Long-Stay Monitor**
1. Go to: http://localhost:5173/admin/dashboard
2. Click "🚨 Long-Stay Monitor" button
3. Should load without errors

---

## 🐛 Common Issues & Solutions

### **Issue 1: "Failed to fetch long-stay vehicles"**

**Solution:**
- Check backend is running on port 8000
- Check CORS is enabled in backend
- Verify API endpoint exists: http://localhost:8000/api/admin/long-stay-vehicles/

**Test with curl:**
```bash
# Get admin token first from localStorage
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/admin/long-stay-vehicles/
```

---

### **Issue 2: "403 Forbidden" Error**

**Solution:**
- User role must be 'admin' or 'security'
- Check user role:
  ```javascript
  JSON.parse(localStorage.getItem('user')).role
  ```
- If customer, sign in with admin account

---

### **Issue 3: Page shows loading forever**

**Solution:**
- Open browser console (F12)
- Check for JavaScript errors
- Check network tab for failed requests
- Verify backend API is responding

---

### **Issue 4: "Scheduler: Stopped"**

**Solution:**
- Backend scheduler may not have started
- Check backend console for errors
- Restart Django server:
  ```bash
  python manage.py runserver
  ```
- Look for: "✅ APScheduler started successfully"

---

### **Issue 5: No data showing (but no errors)**

**Explanation:**
- This is normal if no vehicles are currently parked >20 hours
- The "All Clear!" message should appear

**To test with data:**
1. Create a booking in admin
2. Check it in
3. Manually change `checked_in_at` to 30 hours ago:
   ```python
   # In Django shell: python manage.py shell
   from api.models import Booking
   from django.utils import timezone
   from datetime import timedelta
   
   booking = Booking.objects.filter(status='checked_in').first()
   booking.checked_in_at = timezone.now() - timedelta(hours=30)
   booking.save()
   ```
4. Refresh the long-stay monitor page

---

## 📊 Expected Behavior

### **When No Long-Stay Vehicles:**
```
✅ All Clear!
No long-stay vehicles detected at this time.

Summary Cards:
- Total Parked: 0
- Critical (>24h): 0
- Warning (20-24h): 0
- Normal (<20h): 0
```

### **When Long-Stay Vehicles Exist:**
```
🚨 Long-Stay Vehicle Monitor

Summary Cards:
- Total Parked: 5
- Critical (>24h): 2
- Warning (20-24h): 1
- Normal (<20h): 2

Table showing:
- ABC123 - User: john_doe - Slot A1-01 - 1d 8h 30m
- XYZ789 - User: jane_smith - Slot B2-15 - 2d 4h 15m
```

---

## 🔍 Debugging Commands

### **Check Backend API:**
```bash
# Test scheduler status
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/admin/scheduler/status/

# Test long-stay vehicles
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/admin/long-stay-vehicles/

# Trigger manual detection
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/admin/long-stay-vehicles/detect/
```

### **Check Frontend State:**
```javascript
// In browser console (F12):

// 1. Check if logged in
localStorage.getItem('accessToken')

// 2. Check user data
JSON.parse(localStorage.getItem('user'))

// 3. Check role
JSON.parse(localStorage.getItem('user')).role

// 4. Test API call
fetch('http://localhost:8000/api/admin/scheduler/status/', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
  }
})
.then(r => r.json())
.then(console.log)
```

---

## ✅ Verification Steps

After fixing the authentication issue, verify everything works:

1. ✅ Sign in as admin
2. ✅ Navigate to admin dashboard
3. ✅ Click "Long-Stay Monitor" button
4. ✅ Page loads without errors
5. ✅ Summary cards display
6. ✅ Scheduler status shows "Running"
7. ✅ Either shows "All Clear" or vehicle tables
8. ✅ Refresh button works
9. ✅ Manual trigger button works

---

## 📞 Still Having Issues?

### **Check these logs:**

1. **Backend Console**
   - Django server output
   - Look for APScheduler messages
   - Check for API request logs

2. **Browser Console (F12)**
   - JavaScript errors
   - Network tab for failed requests
   - Console logs from components

3. **Network Tab**
   - Check request/response
   - Verify Authorization header is present
   - Check response status codes

---

## 🎉 Success!

Once working, you should see:
- ✅ Scheduler running
- ✅ Summary cards populated
- ✅ Automatic refresh every 5 minutes
- ✅ Manual trigger works
- ✅ Notifications in notification center

The authentication issue is now fixed! Simply refresh your browser and try again.
