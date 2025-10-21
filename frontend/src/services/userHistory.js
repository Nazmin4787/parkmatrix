import axios from 'axios';

// Base API URL
const API_BASE_URL = 'http://localhost:8000/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('accessToken');
};

// Configure axios with auth header
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

/**
 * ADMIN ENDPOINTS
 * These endpoints allow admins to view any user's parking history
 */

/**
 * Get parking history for a specific user (Admin only)
 * @param {number} userId - ID of the user to fetch history for
 * @param {Object} params - Query parameters for filtering and pagination
 * @returns {Promise} - Parking history data
 */
export const getAdminUserHistory = async (userId, params = {}) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/admin/user-history/${userId}/`,
      {
        ...getAuthHeaders(),
        params
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching admin user history:', error);
    throw error;
  }
};

/**
 * Get parking statistics for a specific user (Admin only)
 * @param {number} userId - ID of the user to fetch stats for
 * @returns {Promise} - User parking statistics
 */
export const getAdminUserStats = async (userId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/admin/user-history/${userId}/stats/`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching admin user stats:', error);
    throw error;
  }
};

/**
 * Export user parking history to CSV (Admin only)
 * @param {Object} params - Query parameters for filtering
 * @returns {Promise} - CSV file blob
 */
export const exportUserParkingHistory = async (params = {}) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/user/parking-history/export/`,
      {
        ...getAuthHeaders(),
        params,
        responseType: 'blob'
      }
    );
    
    // Create a download link and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `parking_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return response.data;
  } catch (error) {
    console.error('Error exporting parking history:', error);
    throw error;
  }
};

/**
 * USER ENDPOINTS (for future use if needed)
 * These endpoints allow users to view their own parking history
 */

/**
 * Get current user's parking history
 * @param {Object} params - Query parameters for filtering and pagination
 * @returns {Promise} - Parking history data
 */
export const getUserParkingHistory = async (params = {}) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/user/parking-history/`,
      {
        ...getAuthHeaders(),
        params
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching user parking history:', error);
    throw error;
  }
};

/**
 * Get current user's parking statistics
 * @returns {Promise} - User parking statistics
 */
export const getUserParkingStats = async () => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/user/parking-history/stats/`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching user parking stats:', error);
    throw error;
  }
};

/**
 * Get detailed information for a specific parking session
 * @param {number} sessionId - ID of the parking session
 * @returns {Promise} - Detailed parking session data
 */
export const getParkingSessionDetail = async (sessionId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/user/parking-history/${sessionId}/`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching parking session detail:', error);
    throw error;
  }
};

export default {
  getAdminUserHistory,
  getAdminUserStats,
  exportUserParkingHistory,
  getUserParkingHistory,
  getUserParkingStats,
  getParkingSessionDetail
};
