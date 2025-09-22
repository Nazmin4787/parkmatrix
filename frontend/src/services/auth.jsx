import { http } from './httpClient';
import axios from 'axios';

// Use the same base URL as httpClient
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function registerUser({ username, email, password, role = 'customer' }) {
  const { data } = await http.post('/api/auth/register/', { username, email, password, role });
  return data;
}

export async function loginUser({ email, password }) {
  try {
    // Ensure we're using the correct endpoint format
    const loginUrl = '/api/auth/login/';
    console.log('Sending login request to:', loginUrl);
    
    // Use explicit headers to ensure correct content negotiation
    const response = await axios({
      method: 'post',
      url: `${BASE_URL}${loginUrl}`,
      data: { email, password },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json' // Only application/json, not comma-separated
      }
    });
    
    console.log('Login response received:', response);
    
    if (response.data) {
      return response.data;
    } else {
      throw new Error('Empty response received from server');
    }
  } catch (error) {
    console.error('Login request failed:', error);
    
    if (error.response) {
      // Check if we received HTML (common Django error pattern)
      const contentType = error.response.headers['content-type'];
      if (contentType && contentType.includes('text/html')) {
        console.error('Received HTML response instead of JSON. Backend might be in DEBUG mode or URL is incorrect.');
        throw new Error('Invalid response format from server. Please contact support.');
      }
      
      console.error('Error response:', error.response.status, error.response.data);
      return error.response.data;
    } else if (error.request) {
      console.error('No response received:', error.request);
      throw new Error('Network error: No response from the server');
    } else {
      console.error('Request setup error:', error.message);
      throw error;
    }
  }
}

export async function refreshToken(refresh) {
  // Using SimpleJWT standard endpoint shape; adjust if custom
  const { data } = await http.post('/api/auth/refresh/', { refresh });
  return data;
}


