"""
Simple test to check API endpoints directly
"""
import requests

BASE_URL = "http://127.0.0.1:8000"

def test_api_root():
    """Test the API root endpoint"""
    url = f"{BASE_URL}/api/"
    print(f"Testing: {url}")
    
    response = requests.get(url)
    print(f"Status: {response.status_code}")
    print(f"Content-Type: {response.headers.get('Content-Type')}")
    print(f"Response: {response.text[:200]}...")
    print("-" * 60)

def test_available_slots():
    """Test available slots endpoint without auth"""
    url = f"{BASE_URL}/api/slots/available/"
    print(f"Testing: {url}")
    
    response = requests.get(url)
    print(f"Status: {response.status_code}")
    print(f"Content-Type: {response.headers.get('Content-Type')}")
    print(f"Response: {response.text[:200]}...")
    print("-" * 60)

def test_with_json_headers():
    """Test with explicit JSON headers"""
    url = f"{BASE_URL}/api/slots/available/"
    headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
    
    print(f"Testing with JSON headers: {url}")
    response = requests.get(url, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Content-Type: {response.headers.get('Content-Type')}")
    
    if response.status_code == 200:
        try:
            data = response.json()
            print(f"✅ JSON Response received with {len(data)} items")
        except:
            print(f"❌ Not valid JSON: {response.text[:100]}...")
    else:
        print(f"❌ Error response: {response.text[:100]}...")
    print("-" * 60)

if __name__ == "__main__":
    print("=== TESTING API ENDPOINTS ===\\n")
    test_api_root()
    test_available_slots()
    test_with_json_headers()