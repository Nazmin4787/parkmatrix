#!/usr/bin/env python3
"""
Quick verification script to test the check-in/check-out system setup
"""

import requests
import json
from datetime import datetime

# API Base URL
API_BASE = "http://127.0.0.1:8000/api"

def test_api_connection():
    """Test if the API is accessible"""
    try:
        response = requests.get(f"{API_BASE}/parking-lots/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API Connection: SUCCESS")
            print(f"   Found {len(data)} parking lots")
            return True
        else:
            print(f"❌ API Connection: FAILED (Status: {response.status_code})")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ API Connection: FAILED (Error: {e})")
        return False

def test_check_in_sessions():
    """Test check-in sessions endpoint"""
    try:
        response = requests.get(f"{API_BASE}/sessions/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Check-in Sessions: SUCCESS")
            print(f"   Found {len(data)} sessions")
            
            # Show sample sessions
            for session in data[:3]:  # Show first 3
                status = session.get('status', 'unknown')
                ticket = session.get('ticket_code', 'N/A')
                license = session.get('license_plate', 'N/A')
                print(f"     • {ticket} - {status} - {license}")
            
            return True
        else:
            print(f"❌ Check-in Sessions: FAILED (Status: {response.status_code})")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Check-in Sessions: FAILED (Error: {e})")
        return False

def test_geofence_logs():
    """Test geofence logs endpoint (read-only)"""
    try:
        response = requests.get(f"{API_BASE}/geofence-logs/")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Geofence Logs: SUCCESS")
            print(f"   Found {len(data)} validation logs")
            
            # Show sample logs
            for log in data[:2]:  # Show first 2
                validation_type = log.get('validation_type', 'unknown')
                result = log.get('result', 'unknown')
                distance = log.get('distance_from_center', 'N/A')
                print(f"     • {validation_type} - {result} - {distance}m from center")
            
            return True
        else:
            print(f"❌ Geofence Logs: FAILED (Status: {response.status_code})")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Geofence Logs: FAILED (Error: {e})")
        return False

def test_parking_lots():
    """Test parking lots with geofence data"""
    try:
        response = requests.get(f"{API_BASE}/parking-lots/")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Parking Lots: SUCCESS")
            
            for lot in data[:2]:  # Show first 2 lots
                name = lot.get('name', 'Unknown')
                slots_count = len(lot.get('parking_slots', []))
                has_geofence = lot.get('geofence_config') is not None
                print(f"     • {name} - {slots_count} slots - Geofence: {'Yes' if has_geofence else 'No'}")
            
            return True
        else:
            print(f"❌ Parking Lots: FAILED (Status: {response.status_code})")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Parking Lots: FAILED (Error: {e})")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Check-In/Check-Out System Setup")
    print("=" * 50)
    print()
    
    tests_passed = 0
    total_tests = 4
    
    # Run tests
    if test_api_connection():
        tests_passed += 1
    print()
    
    if test_parking_lots():
        tests_passed += 1
    print()
    
    if test_check_in_sessions():
        tests_passed += 1
    print()
    
    if test_geofence_logs():
        tests_passed += 1
    print()
    
    # Summary
    print("=" * 50)
    print(f"🎯 Test Results: {tests_passed}/{total_tests} tests passed")
    
    if tests_passed == total_tests:
        print("🎉 All systems operational! Ready for testing.")
        print()
        print("Next steps:")
        print("1. Open http://localhost:5173 in your browser")
        print("2. Look for the Testing Panel in the top-right corner")
        print("3. Use the panel to mock GPS locations and test scenarios")
        print("4. Check browser console for detailed GPS events")
    else:
        print("⚠️  Some tests failed. Check the Django server logs.")
        print("Make sure both servers are running:")
        print("- Frontend: npm run dev (port 5173)")
        print("- Backend: python manage.py runserver (port 8000)")
    
    print()

if __name__ == "__main__":
    main()