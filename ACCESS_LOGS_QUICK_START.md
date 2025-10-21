# Access Logs - Quick Start Guide 🚀

## 🎯 Quick Access

**Frontend:** http://localhost:5174/admin/access-logs  
**Backend:** http://localhost:8000/api/admin/access-logs/

---

## 👤 Test Users

Create a superuser to test:
```bash
cd c:\Projects\parking-system\backend
python manage.py createsuperuser
```

Or sign up via frontend with role="admin"

---

## 🔍 How to View Logs

### **Option 1: Frontend (Recommended)**
1. Login as admin at http://localhost:5174/signin
2. Click "Access Logs" in navbar OR
3. Go to Admin Dashboard → "View Access Logs"

### **Option 2: API Direct**
```bash
# Get your access token first by logging in
# Then:
curl http://localhost:8000/api/admin/access-logs/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### **Option 3: Django Admin**
1. Go to http://localhost:8000/admin/
2. Login with superuser credentials
3. Click "Access Logs" in sidebar

---

## 📊 What Gets Tracked

### **Every Login Captures:**
- ✅ Username & Email
- ✅ Role (customer/admin/security)
- ✅ Login timestamp
- ✅ IP address
- ✅ Location (city, country)
- ✅ Device type (mobile/desktop/tablet)
- ✅ Browser & OS
- ✅ Status (success/failed/locked)

### **Every Logout Captures:**
- ✅ Logout timestamp
- ✅ Session duration (in minutes)

---

## 🧪 Quick Test

### **Test 1: Successful Login**
```
1. Open http://localhost:5174/signin
2. Login with valid credentials
3. Check Access Logs → Should see new entry marked "Success"
```

### **Test 2: Failed Login**
```
1. Try logging in with wrong password
2. Login as admin
3. Check Access Logs → Should see "Failed" entry
```

### **Test 3: Logout Tracking**
```
1. Login as any user
2. Click "Sign Out"
3. Login as admin
4. Check Access Logs → Should see logout time recorded
```

---

## 🔧 Common Tasks

### **View Today's Logins**
```javascript
// In frontend filters:
- Date From: 2025-10-19
- Date To: 2025-10-19
- Click "Apply Filters"
```

### **Find Failed Login Attempts**
```javascript
// In frontend filters:
- Status: Failed
- Click "Apply Filters"
```

### **Check Active Sessions**
```javascript
// In frontend filters:
- Check "Active Sessions Only"
- Click "Apply Filters"
```

### **Export Data**
```javascript
// In frontend:
1. Apply desired filters
2. Click "Export CSV" button
3. File downloads automatically
```

---

## 🎨 UI Elements Explained

### **Statistics Cards (Top)**
- 📊 **Total Logins**: All login attempts
- ✓ **Successful**: Successful logins
- ✗ **Failed**: Failed attempts
- 👥 **Unique Users**: Distinct users
- ● **Active Sessions**: Currently logged in

### **Role Badges**
- 🔵 **Admin** - Blue
- 🟠 **Security** - Orange
- 🟢 **Customer** - Green

### **Status Badges**
- ✓ **Success** - Green background
- ✗ **Failed** - Red background
- 🔒 **Locked** - Yellow background

---

## 🐛 Troubleshooting

### **Problem: No logs showing**
**Solution:** Make sure you've logged in at least once. Access logs are created on login.

### **Problem: Can't access /admin/access-logs**
**Solution:** Ensure you're logged in as admin role. Check localStorage for user role.

### **Problem: Export not working**
**Solution:** Check browser console for errors. Ensure backend is running.

### **Problem: Statistics not loading**
**Solution:** Check network tab for API call. Verify token is valid.

---

## 📁 Project Structure

```
parking-system/
├── backend/
│   └── api/
│       ├── models.py (AccessLog model)
│       ├── serializers.py (AccessLog serializers)
│       ├── views.py (Login/Logout with tracking)
│       ├── access_log_views.py (Access log endpoints)
│       ├── access_log_utils.py (Helper functions)
│       ├── urls.py (Routes)
│       └── admin.py (Django admin)
│
└── frontend/
    └── src/
        ├── services/
        │   ├── accessLogs.js (API calls)
        │   └── auth.jsx (Login/Logout)
        ├── pages/
        │   └── admin/
        │       ├── AccessLogs.jsx (Main component)
        │       └── AccessLogs.css (Styles)
        └── MainApp.jsx (Routes)
```

---

## 🔑 Key Files

### **Backend**
- `backend/api/models.py` → AccessLog model
- `backend/api/access_log_views.py` → API endpoints
- `backend/api/access_log_utils.py` → IP tracking, geolocation

### **Frontend**
- `frontend/src/pages/admin/AccessLogs.jsx` → Main UI
- `frontend/src/services/accessLogs.js` → API service
- `frontend/src/services/auth.jsx` → Login/Logout tracking

---

## 💡 Pro Tips

1. **Use date filters** to narrow down logs quickly
2. **Export filtered data** for reports
3. **Check failed logins** regularly for security
4. **Monitor active sessions** for unusual activity
5. **View details** for complete user information

---

## 🌟 Features Highlights

✨ **Automatic Tracking** - No manual logging needed  
✨ **Real-time Updates** - Refresh to see latest logs  
✨ **Advanced Filters** - Find exactly what you need  
✨ **Export to CSV** - Download for offline analysis  
✨ **Responsive Design** - Works on all devices  
✨ **Security Focused** - Admin-only access  
✨ **Comprehensive Data** - Everything you need to know  

---

## 📞 Need Help?

Check the detailed documentation:
- `ACCESS_LOGS_IMPLEMENTATION_COMPLETE.md` (Backend)
- `ACCESS_LOGS_FRONTEND_COMPLETE.md` (Frontend)

---

**Status:** ✅ Fully Operational  
**Servers:** Backend (8000) | Frontend (5174)  
**Access:** Admin only  

---

*Quick Start Guide - October 19, 2025*
