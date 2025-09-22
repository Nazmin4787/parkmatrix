import requests

def test_unread_count():
    """Test the unread_count endpoint with various Accept headers"""
    
    # Test cases with different Accept headers
    test_cases = [
        {'Accept': '*/*'},
        {'Accept': 'application/json'},
        {'Accept': 'application/json, text/plain, */*'},
        {'Accept': 'text/html'},
        # No Accept header
        {}
    ]
    
    print("Testing /api/notifications/unread_count/ with various Accept headers")
    print("-" * 60)
    
    for headers in test_cases:
        try:
            accept_header = headers.get('Accept', 'No Accept header')
            print(f"Testing with: '{accept_header}'")
            
            response = requests.get(
                'http://127.0.0.1:8000/api/notifications/unread_count/',
                headers=headers
            )
            
            print(f"Status: {response.status_code}")
            print(f"Content-Type: {response.headers.get('Content-Type', 'Not specified')}")
            
            if response.ok:
                print(f"Response: {response.json()}")
                print("✓ Success!")
            else:
                print(f"Error: {response.text}")
                print("✗ Failed!")
        except Exception as e:
            print(f"Exception: {e}")
            print("✗ Failed!")
        
        print("-" * 60)

if __name__ == "__main__":
    test_unread_count()