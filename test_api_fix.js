import fetch from 'node-fetch';

// Test the unread_count endpoint
async function testUnreadCountAPI() {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/notifications/unread_count/', {
      method: 'GET',
      headers: {
        // Include an authorization token if needed
        'Authorization': 'Bearer YOUR_TOKEN_HERE',
        // Test with various Accept headers
        'Accept': '*/*'
      }
    });
    
    if (!response.ok) {
      console.error(`Error: ${response.status} - ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    console.log('Unread count:', data);
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testUnreadCountAPI();