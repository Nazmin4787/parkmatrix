import requests
import json

# Test the login API to see what's wrong
login_data = {
    'email': 'customer@example.com',
    'password': 'customer123'
}

print("Testing login API...")
login_response = requests.post('http://localhost:8000/api/auth/login/', json=login_data)
print('Login Response Status:', login_response.status_code)
print('Login Response Headers:', dict(login_response.headers))
print('Login Response Raw Text:', repr(login_response.text))

if login_response.status_code == 200:
    try:
        token_data = login_response.json()
        print('Login Success - Token Data:', token_data)
    except Exception as e:
        print('JSON Decode Error:', e)
        print('Raw content:', login_response.content)
else:
    print('Login Failed')
    print('Response:', login_response.text)