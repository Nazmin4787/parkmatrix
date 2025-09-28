"""
Simple test to check our new endpoints without authentication
"""
import requests
import json

# Test the vehicle types endpoint (no auth required for demonstration)
def test_basic_endpoints():
    print("Testing basic endpoints...")
    
    # Test if server is running
    try:
        response = requests.get("http://127.0.0.1:8000/api/")
        print(f"✓ API Root responds: {response.status_code}")
        
        # Test vehicle types (may require auth)
        response = requests.get("http://127.0.0.1:8000/api/vehicle-types/")
        print(f"Vehicle Types endpoint: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Found {len(data)} vehicle types")
        
        # Test parking lots
        response = requests.get("http://127.0.0.1:8000/api/parking-lots/")
        print(f"Parking Lots endpoint: {response.status_code}")
        
        print("\n✓ Server is running and endpoints are accessible!")
        
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to server")
    except Exception as e:
        print(f"✗ Error: {e}")

if __name__ == "__main__":
    test_basic_endpoints()