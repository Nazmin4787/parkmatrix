import requests
import json
import time

# API Configuration
BASE_URL = 'http://127.0.0.1:8000/api'
TEST_USER = {
    'email': 'test@example.com',
    'password': 'testpass123',
    'username': 'testuser'
}

ADMIN_USER = {
    'email': 'admin@example.com', 
    'password': 'adminpass123',
    'username': 'adminuser',
    'role': 'admin'
}

class NotificationAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.user_token = None
        self.admin_token = None
        
    def print_test(self, test_name, success=True, message=""):
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if message:
            print(f"   {message}")
        print()
    
    def register_and_login_users(self):
        """Step 1: Register and login test users"""
        print("🔧 Setting up test users...")
        
        # Register regular user
        try:
            response = self.session.post(f"{BASE_URL}/auth/register/", json=TEST_USER)
            if response.status_code in [201, 400]:  # 400 might be user already exists
                self.print_test("Register regular user", True, f"Status: {response.status_code}")
            else:
                self.print_test("Register regular user", False, f"Status: {response.status_code}")
        except Exception as e:
            self.print_test("Register regular user", False, str(e))
        
        # Register admin user
        try:
            response = self.session.post(f"{BASE_URL}/auth/register/", json=ADMIN_USER)
            if response.status_code in [201, 400]:
                self.print_test("Register admin user", True, f"Status: {response.status_code}")
            else:
                self.print_test("Register admin user", False, f"Status: {response.status_code}")
        except Exception as e:
            self.print_test("Register admin user", False, str(e))
        
        # Login regular user
        try:
            response = self.session.post(f"{BASE_URL}/auth/login/", json={
                'email': TEST_USER['email'],
                'password': TEST_USER['password']
            })
            if response.status_code == 200:
                data = response.json()
                self.user_token = data.get('access')
                self.print_test("Login regular user", True, f"Got access token")
            else:
                self.print_test("Login regular user", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.print_test("Login regular user", False, str(e))
        
        # Login admin user  
        try:
            response = self.session.post(f"{BASE_URL}/auth/login/", json={
                'email': ADMIN_USER['email'],
                'password': ADMIN_USER['password']
            })
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get('access')
                self.print_test("Login admin user", True, f"Got access token")
            else:
                self.print_test("Login admin user", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.print_test("Login admin user", False, str(e))
    
    def test_get_notifications(self):
        """Test GET /api/notifications/ - List user notifications"""
        print("📋 Testing GET notifications endpoint...")
        
        if not self.user_token:
            self.print_test("GET /api/notifications/", False, "No user token available")
            return
        
        headers = {'Authorization': f'Bearer {self.user_token}'}
        
        try:
            response = self.session.get(f"{BASE_URL}/notifications/", headers=headers)
            if response.status_code == 200:
                data = response.json()
                self.print_test("GET /api/notifications/", True, f"Retrieved {len(data)} notifications")
                return data
            else:
                self.print_test("GET /api/notifications/", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.print_test("GET /api/notifications/", False, str(e))
        
        return []
    
    def test_create_system_alert(self):
        """Test POST /api/admin/system-alert/ - Create system alert"""
        print("🚨 Testing POST system alert endpoint...")
        
        if not self.admin_token:
            self.print_test("POST /api/admin/system-alert/", False, "No admin token available")
            return
        
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        alert_data = {
            'title': 'Test System Alert',
            'message': 'This is a test system alert created by the API tester.',
            'target_users': 'all'
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/admin/system-alert/", 
                                       json=alert_data, headers=headers)
            if response.status_code == 201:
                data = response.json()
                self.print_test("POST /api/admin/system-alert/", True, f"Created alert: {data.get('message', 'Success')}")
            else:
                self.print_test("POST /api/admin/system-alert/", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.print_test("POST /api/admin/system-alert/", False, str(e))
    
    def test_create_maintenance_alert(self):
        """Test POST /api/admin/maintenance-alert/ - Create maintenance alert"""
        print("🔧 Testing POST maintenance alert endpoint...")
        
        if not self.admin_token:
            self.print_test("POST /api/admin/maintenance-alert/", False, "No admin token available")
            return
        
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        maintenance_data = {
            'title': 'Test Maintenance Alert',
            'message': 'Scheduled maintenance will occur tonight.',
            'maintenance_start': '2025-09-10T02:00:00',
            'maintenance_end': '2025-09-10T04:00:00'
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/admin/maintenance-alert/", 
                                       json=maintenance_data, headers=headers)
            if response.status_code == 201:
                data = response.json()
                self.print_test("POST /api/admin/maintenance-alert/", True, f"Created maintenance alert: {data.get('message', 'Success')}")
            else:
                self.print_test("POST /api/admin/maintenance-alert/", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.print_test("POST /api/admin/maintenance-alert/", False, str(e))
    
    def test_notification_stats(self):
        """Test GET /api/admin/notification-stats/ - Get notification statistics"""
        print("📊 Testing GET notification stats endpoint...")
        
        if not self.admin_token:
            self.print_test("GET /api/admin/notification-stats/", False, "No admin token available")
            return
        
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        try:
            response = self.session.get(f"{BASE_URL}/admin/notification-stats/", headers=headers)
            if response.status_code == 200:
                data = response.json()
                stats_count = len(data.get('notification_stats', []))
                total_users = data.get('total_users', 0)
                self.print_test("GET /api/admin/notification-stats/", True, f"Got stats for {stats_count} notification types, {total_users} total users")
            else:
                self.print_test("GET /api/admin/notification-stats/", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.print_test("GET /api/admin/notification-stats/", False, str(e))
    
    def test_mark_notification_read(self, notifications):
        """Test POST /api/notifications/<id>/read/ - Mark notification as read"""
        print("✅ Testing POST mark notification as read endpoint...")
        
        if not notifications or not self.user_token:
            self.print_test("POST /api/notifications/<id>/read/", False, "No notifications or user token available")
            return
        
        headers = {'Authorization': f'Bearer {self.user_token}'}
        notification_id = notifications[0]['id']
        
        try:
            response = self.session.post(f"{BASE_URL}/notifications/{notification_id}/read/", 
                                       headers=headers)
            if response.status_code == 204:
                self.print_test("POST /api/notifications/<id>/read/", True, f"Marked notification {notification_id} as read")
            else:
                self.print_test("POST /api/notifications/<id>/read/", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.print_test("POST /api/notifications/<id>/read/", False, str(e))
    
    def test_delete_notification(self, notifications):
        """Test DELETE /api/notifications/<id>/delete/ - Delete notification"""
        print("🗑️  Testing DELETE notification endpoint...")
        
        if len(notifications) < 2 or not self.user_token:
            self.print_test("DELETE /api/notifications/<id>/delete/", False, "Need at least 2 notifications or no user token")
            return
        
        headers = {'Authorization': f'Bearer {self.user_token}'}
        notification_id = notifications[-1]['id']  # Use last notification
        
        try:
            response = self.session.delete(f"{BASE_URL}/notifications/{notification_id}/delete/", 
                                         headers=headers)
            if response.status_code == 204:
                self.print_test("DELETE /api/notifications/<id>/delete/", True, f"Deleted notification {notification_id}")
            else:
                self.print_test("DELETE /api/notifications/<id>/delete/", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.print_test("DELETE /api/notifications/<id>/delete/", False, str(e))
    
    def run_all_tests(self):
        """Run all notification API tests"""
        print("🚀 Starting Notification API Tests")
        print("=" * 50)
        
        # Setup
        self.register_and_login_users()
        
        # Wait a moment for any welcome notifications to be created
        time.sleep(1)
        
        # Test admin endpoints (these create notifications)
        self.test_create_system_alert()
        self.test_create_maintenance_alert()
        self.test_notification_stats()
        
        # Wait a moment for notifications to be created
        time.sleep(1)
        
        # Test user endpoints
        notifications = self.test_get_notifications()
        
        if notifications:
            self.test_mark_notification_read(notifications)
            self.test_delete_notification(notifications)
        
        print("=" * 50)
        print("🏁 Notification API Tests Complete!")

if __name__ == "__main__":
    tester = NotificationAPITester()
    tester.run_all_tests()
