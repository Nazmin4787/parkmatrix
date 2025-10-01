// Example frontend notification integration
// Add this to your main frontend application

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Configure axios with the right headers for content negotiation
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Login function that handles content negotiation
async function login(email, password) {
  try {
    const response = await apiClient.post('/api/auth/login/', {
      email,
      password
    });
    
    // Store the tokens
    localStorage.setItem('accessToken', response.data.access);
    localStorage.setItem('refreshToken', response.data.refresh);
    
    return {
      success: true,
      token: response.data.access
    };
  } catch (error) {
    console.error('Login failed:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Login failed'
    };
  }
}

// Function to get unread notification count (public endpoint)
async function getUnreadNotificationCount() {
  try {
    // This endpoint works with any content-type
    const response = await axios.get(`${API_BASE_URL}/api/notifications/unread_count/`);
    return response.data.unread_count;
  } catch (error) {
    console.error('Failed to get notification count:', error);
    return 0; // Default to 0 on error
  }
}

// Function to get all notifications (authenticated endpoint)
async function getNotifications() {
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    console.error('No access token found');
    return [];
  }
  
  try {
    const response = await apiClient.get('/api/notifications/', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to get notifications:', error);
    
    // If unauthorized, try to refresh token
    if (error.response?.status === 401) {
      const refreshed = await refreshToken();
      if (refreshed) {
        // Try again with new token
        return getNotifications();
      }
    }
    
    return [];
  }
}

// Function to mark a notification as read
async function markNotificationAsRead(notificationId) {
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    console.error('No access token found');
    return false;
  }
  
  try {
    await apiClient.post(`/api/notifications/${notificationId}/read/`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return true;
  } catch (error) {
    console.error(`Failed to mark notification ${notificationId} as read:`, error);
    return false;
  }
}

// Function to mark all notifications as read
async function markAllNotificationsAsRead() {
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    console.error('No access token found');
    return false;
  }
  
  try {
    await apiClient.post('/api/notifications/mark_all_as_read/', {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return true;
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return false;
  }
}

// Function to refresh the token
async function refreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    return false;
  }
  
  try {
    const response = await apiClient.post('/api/auth/refresh/', {
      refresh: refreshToken
    });
    
    localStorage.setItem('accessToken', response.data.access);
    return true;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    // Clear tokens if refresh fails
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    return false;
  }
}

export {
  login,
  getUnreadNotificationCount,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
};