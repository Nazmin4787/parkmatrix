#!/usr/bin/env python
"""
Debug login response
"""

import requests

BASE_URL = "http://127.0.0.1:8000/api"

def debug_login():
    login_url = f"{BASE_URL}/auth/login/"
    login_data = {
        "email": "testadmin@example.com",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(login_url, json=login_data)
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        print(f"Raw Response Text: '{response.text}'")
        print(f"Response Length: {len(response.text)}")
        
        if response.text.strip():
            try:
                json_data = response.json()
                print(f"JSON Data: {json_data}")
            except Exception as e:
                print(f"JSON parsing error: {e}")
        else:
            print("Empty response body")
            
    except Exception as e:
        print(f"Request error: {e}")

if __name__ == "__main__":
    debug_login()