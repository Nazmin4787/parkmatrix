#!/usr/bin/env python
"""
Simple test script to verify the find_nearest_slot endpoint is working.
Run this from the backend directory while the Django server is running.
"""

import requests
import json

def test_find_nearest_endpoint():
    url = "http://127.0.0.1:8000/api/slots/find-nearest/"
    params = {
        'lat': 19.205500135441547,
        'lon': 73.15605296577588
    }
    
    try:
        response = requests.get(url, params=params)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Endpoint is working!")
            print(f"Found slot: {data}")
        elif response.status_code == 404:
            print("ℹ️ No available slots found (this is normal if no slots exist)")
        else:
            print(f"❌ Error: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure Django server is running.")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_find_nearest_endpoint()