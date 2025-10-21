"""
Test Script for Check-In/Check-Out Logs API (Feature 1)
Run this script to test all endpoints
"""
import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://127.0.0.1:8000/api"
USERNAME = "admin"  # Change to your admin username
PASSWORD = "admin"  # Change to your admin password

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

class APITester:
    def __init__(self):
        self.token = None
        self.headers = {}
        self.test_results = []
        
    def print_header(self, text):
        print(f"\n{BLUE}{'='*80}")
        print(f"{text}")
        print(f"{'='*80}{RESET}\n")
    
    def print_success(self, text):
        print(f"{GREEN}✓ {text}{RESET}")
        
    def print_error(self, text):
        print(f"{RED}✗ {text}{RESET}")
        
    def print_info(self, text):
        print(f"{YELLOW}ℹ {text}{RESET}")
    
    def login(self):
        """Step 1: Login to get authentication token"""
        self.print_header("STEP 1: Authentication")
        
        try:
            response = requests.post(
                f"{BASE_URL}/auth/login/",
                json={
                    "email": USERNAME,
                    "password": PASSWORD
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('access')
                self.headers = {
                    'Authorization': f'Bearer {self.token}',
                    'Content-Type': 'application/json'
                }
                self.print_success(f"Login successful! Token received.")
                self.print_info(f"User: {data.get('user', {}).get('username')}")
                self.print_info(f"Role: {data.get('user', {}).get('role')}")
                return True
            else:
                self.print_error(f"Login failed: {response.status_code}")
                self.print_error(f"Response: {response.text}")
                return False
                
        except Exception as e:
            self.print_error(f"Login error: {str(e)}")
            return False
    
    def test_list_logs(self):
        """Test: List all check-in/check-out logs"""
        self.print_header("TEST 1: List All Check-In/Check-Out Logs")
        
        try:
            response = requests.get(
                f"{BASE_URL}/admin/checkin-checkout-logs/",
                headers=self.headers
            )
            
            self.print_info(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.print_success(f"Retrieved {len(data)} log entries")
                
                if len(data) > 0:
                    self.print_info("Sample log entry:")
                    print(json.dumps(data[0], indent=2))
                else:
                    self.print_info("No log entries found. This is expected if no check-ins/check-outs have been made.")
                    
                return True
            else:
                self.print_error(f"Failed to retrieve logs: {response.text}")
                return False
                
        except Exception as e:
            self.print_error(f"Error: {str(e)}")
            return False
    
    def test_list_logs_with_filters(self):
        """Test: List logs with various filters"""
        self.print_header("TEST 2: List Logs with Filters")
        
        # Test different filters
        filters = [
            ("action=check_in_success", "Filter by check-in success"),
            ("status=success", "Filter by success status"),
            ("date_from=2025-10-01", "Filter by date range"),
            ("current_status=parked", "Filter currently parked"),
        ]
        
        for filter_param, description in filters:
            try:
                self.print_info(f"\nTesting: {description}")
                response = requests.get(
                    f"{BASE_URL}/admin/checkin-checkout-logs/?{filter_param}",
                    headers=self.headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.print_success(f"Filter '{filter_param}' works! Found {len(data)} entries")
                else:
                    self.print_error(f"Filter failed: {response.status_code}")
                    
            except Exception as e:
                self.print_error(f"Error testing filter: {str(e)}")
    
    def test_statistics(self):
        """Test: Get check-in/check-out statistics"""
        self.print_header("TEST 3: Check-In/Check-Out Statistics")
        
        try:
            response = requests.get(
                f"{BASE_URL}/admin/checkin-checkout-logs/stats/",
                headers=self.headers
            )
            
            self.print_info(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.print_success("Statistics retrieved successfully!")
                
                print("\n📊 Statistics Summary:")
                print(f"  • Total Check-Ins: {data.get('total_check_ins', 0)}")
                print(f"  • Failed Check-Ins: {data.get('failed_check_ins', 0)}")
                print(f"  • Total Check-Outs: {data.get('total_check_outs', 0)}")
                print(f"  • Failed Check-Outs: {data.get('failed_check_outs', 0)}")
                print(f"  • Currently Parked: {data.get('currently_parked', 0)}")
                print(f"  • Average Duration: {data.get('average_parking_duration_hours', 0)} hours")
                print(f"  • Completed Sessions: {data.get('total_completed_sessions', 0)}")
                
                if data.get('check_ins_by_vehicle_type'):
                    print("\n🚗 Check-Ins by Vehicle Type:")
                    for vtype, count in data['check_ins_by_vehicle_type'].items():
                        print(f"  • {vtype}: {count}")
                
                return True
            else:
                self.print_error(f"Failed to retrieve statistics: {response.text}")
                return False
                
        except Exception as e:
            self.print_error(f"Error: {str(e)}")
            return False
    
    def test_currently_parked(self):
        """Test: Get currently parked vehicles"""
        self.print_header("TEST 4: Currently Parked Vehicles")
        
        try:
            response = requests.get(
                f"{BASE_URL}/admin/currently-parked/",
                headers=self.headers
            )
            
            self.print_info(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.print_success(f"Found {len(data)} currently parked vehicles")
                
                if len(data) > 0:
                    self.print_info("\nCurrently Parked Vehicles:")
                    for vehicle in data[:3]:  # Show first 3
                        print(f"\n  Vehicle: {vehicle.get('vehicle_info', {}).get('number_plate', 'N/A')}")
                        print(f"  User: {vehicle.get('user_username', 'N/A')}")
                        print(f"  Slot: {vehicle.get('slot_info', {}).get('slot_number', 'N/A')}")
                        print(f"  Duration: {vehicle.get('duration_minutes', 0)} minutes")
                        print(f"  Overtime: {vehicle.get('is_overtime', False)}")
                else:
                    self.print_info("No vehicles currently parked.")
                    
                return True
            else:
                self.print_error(f"Failed: {response.text}")
                return False
                
        except Exception as e:
            self.print_error(f"Error: {str(e)}")
            return False
    
    def test_user_logs(self):
        """Test: Get user's own check-in/check-out logs"""
        self.print_header("TEST 5: User's Own Logs")
        
        try:
            response = requests.get(
                f"{BASE_URL}/checkin-checkout-logs/my/",
                headers=self.headers
            )
            
            self.print_info(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.print_success(f"Retrieved {len(data)} personal log entries")
                
                if len(data) > 0:
                    self.print_info("Recent activity:")
                    for log in data[:3]:  # Show first 3
                        print(f"\n  Action: {log.get('action_display', 'N/A')}")
                        print(f"  Time: {log.get('timestamp', 'N/A')}")
                        print(f"  Vehicle: {log.get('vehicle_plate', 'N/A')}")
                        print(f"  Status: {log.get('status', 'N/A')}")
                else:
                    self.print_info("No personal logs found.")
                    
                return True
            else:
                self.print_error(f"Failed: {response.text}")
                return False
                
        except Exception as e:
            self.print_error(f"Error: {str(e)}")
            return False
    
    def test_current_parking(self):
        """Test: Get user's current parking session"""
        self.print_header("TEST 6: Current Parking Session")
        
        try:
            response = requests.get(
                f"{BASE_URL}/parking/current/",
                headers=self.headers
            )
            
            self.print_info(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.print_success("Current parking session found!")
                
                print("\n🅿️ Current Parking Details:")
                print(f"  • Vehicle: {data.get('vehicle_info', {}).get('number_plate', 'N/A')}")
                print(f"  • Slot: {data.get('slot_info', {}).get('slot_number', 'N/A')}")
                print(f"  • Checked In: {data.get('checked_in_at', 'N/A')}")
                print(f"  • Expected Checkout: {data.get('expected_checkout', 'N/A')}")
                print(f"  • Duration: {data.get('duration_minutes', 0)} minutes")
                print(f"  • Overtime: {data.get('is_overtime', False)}")
                
                return True
            elif response.status_code == 404:
                self.print_info("No active parking session (this is OK if not currently parked)")
                return True
            else:
                self.print_error(f"Failed: {response.text}")
                return False
                
        except Exception as e:
            self.print_error(f"Error: {str(e)}")
            return False
    
    def test_export_csv(self):
        """Test: Export logs to CSV"""
        self.print_header("TEST 7: Export Logs to CSV")
        
        try:
            response = requests.get(
                f"{BASE_URL}/admin/checkin-checkout-logs/export/",
                headers=self.headers
            )
            
            self.print_info(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                self.print_success("CSV export successful!")
                
                # Get filename from Content-Disposition header
                content_disp = response.headers.get('Content-Disposition', '')
                self.print_info(f"Content-Type: {response.headers.get('Content-Type', 'N/A')}")
                self.print_info(f"File: {content_disp}")
                
                # Show first few lines of CSV
                csv_content = response.text
                lines = csv_content.split('\n')[:5]
                self.print_info(f"\nFirst 5 lines of CSV:")
                for line in lines:
                    print(f"  {line}")
                
                return True
            else:
                self.print_error(f"Export failed: {response.text}")
                return False
                
        except Exception as e:
            self.print_error(f"Error: {str(e)}")
            return False
    
    def test_log_detail(self):
        """Test: Get specific log detail (if logs exist)"""
        self.print_header("TEST 8: Get Log Detail")
        
        try:
            # First get a log ID
            response = requests.get(
                f"{BASE_URL}/admin/checkin-checkout-logs/",
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if len(data) > 0:
                    log_id = data[0]['id']
                    self.print_info(f"Testing with log ID: {log_id}")
                    
                    # Get log detail
                    detail_response = requests.get(
                        f"{BASE_URL}/admin/checkin-checkout-logs/{log_id}/",
                        headers=self.headers
                    )
                    
                    if detail_response.status_code == 200:
                        detail = detail_response.json()
                        self.print_success("Log detail retrieved successfully!")
                        print("\n📋 Log Details:")
                        print(json.dumps(detail, indent=2))
                        return True
                    else:
                        self.print_error(f"Failed to get detail: {detail_response.text}")
                        return False
                else:
                    self.print_info("No logs available to test detail view")
                    return True
            else:
                self.print_error(f"Failed to get logs: {response.text}")
                return False
                
        except Exception as e:
            self.print_error(f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all API tests"""
        print(f"\n{BLUE}{'='*80}")
        print("🧪 CHECK-IN/CHECK-OUT LOGS API TEST SUITE")
        print(f"{'='*80}{RESET}")
        print(f"Base URL: {BASE_URL}")
        print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Step 1: Login
        if not self.login():
            self.print_error("\n❌ Cannot proceed without authentication!")
            return
        
        # Run all tests
        tests = [
            self.test_list_logs,
            self.test_list_logs_with_filters,
            self.test_statistics,
            self.test_currently_parked,
            self.test_user_logs,
            self.test_current_parking,
            self.test_export_csv,
            self.test_log_detail,
        ]
        
        passed = 0
        failed = 0
        
        for test in tests:
            try:
                if test():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                self.print_error(f"Test error: {str(e)}")
                failed += 1
        
        # Summary
        self.print_header("TEST SUMMARY")
        print(f"Total Tests: {passed + failed}")
        print(f"{GREEN}Passed: {passed}{RESET}")
        print(f"{RED}Failed: {failed}{RESET}")
        
        if failed == 0:
            print(f"\n{GREEN}🎉 ALL TESTS PASSED!{RESET}")
        else:
            print(f"\n{YELLOW}⚠️  Some tests failed. Check the output above.{RESET}")


if __name__ == "__main__":
    print("\n" + "="*80)
    print("IMPORTANT: Update USERNAME and PASSWORD at the top of this script!")
    print("="*80)
    
    input("\nPress Enter to start testing...")
    
    tester = APITester()
    tester.run_all_tests()
    
    print("\n" + "="*80)
    print("Testing complete!")
    print("="*80 + "\n")
