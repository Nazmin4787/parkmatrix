import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Get access logs with filtering and pagination
 * @param {Object} params - Query parameters
 * @returns {Promise} - API response with access logs
 */
export async function getAccessLogs(params = {}) {
  const token = localStorage.getItem('accessToken');
  
  console.log('getAccessLogs - Token present:', !!token);
  console.log('getAccessLogs - Params:', params);
  
  const queryParams = new URLSearchParams();
  if (params.user_id) queryParams.append('user_id', params.user_id);
  if (params.username) queryParams.append('username', params.username);
  if (params.role) queryParams.append('role', params.role);
  if (params.status) queryParams.append('status', params.status);
  if (params.ip_address) queryParams.append('ip_address', params.ip_address);
  if (params.location) queryParams.append('location', params.location);
  if (params.date_from) queryParams.append('date_from', params.date_from);
  if (params.date_to) queryParams.append('date_to', params.date_to);
  if (params.active_only) queryParams.append('active_only', params.active_only);
  if (params.ordering) queryParams.append('ordering', params.ordering);
  if (params.page) queryParams.append('page', params.page);
  if (params.page_size) queryParams.append('page_size', params.page_size);

  const response = await axios.get(
    `${API_BASE_URL}/api/admin/access-logs/?${queryParams.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }
  );
  
  console.log('getAccessLogs - Response:', response.status, response.data);
  return response.data;
}

/**
 * Get detailed information about a specific access log
 * @param {number} id - Access log ID
 * @returns {Promise} - API response with log details
 */
export async function getAccessLogDetail(id) {
  const token = localStorage.getItem('accessToken');
  
  const response = await axios.get(
    `${API_BASE_URL}/api/admin/access-logs/${id}/`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
}

/**
 * Get access logs statistics
 * @param {Object} params - Query parameters
 * @returns {Promise} - API response with statistics
 */
export async function getAccessLogStats(params = {}) {
  const token = localStorage.getItem('accessToken');
  
  console.log('getAccessLogStats - Token present:', !!token);
  
  const queryParams = new URLSearchParams();
  if (params.date_from) queryParams.append('date_from', params.date_from);
  if (params.date_to) queryParams.append('date_to', params.date_to);

  const response = await axios.get(
    `${API_BASE_URL}/api/admin/access-logs/stats/?${queryParams.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }
  );
  
  console.log('getAccessLogStats - Response:', response.status, response.data);
  return response.data;
}

/**
 * Export access logs to CSV
 * @param {Object} params - Query parameters for filtering
 * @returns {Promise} - Blob for download
 */
export async function exportAccessLogs(params = {}) {
  const token = localStorage.getItem('accessToken');
  
  const queryParams = new URLSearchParams();
  if (params.user_id) queryParams.append('user_id', params.user_id);
  if (params.role) queryParams.append('role', params.role);
  if (params.status) queryParams.append('status', params.status);
  if (params.date_from) queryParams.append('date_from', params.date_from);
  if (params.date_to) queryParams.append('date_to', params.date_to);

  const response = await axios.get(
    `${API_BASE_URL}/api/admin/access-logs/export/?${queryParams.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/csv',
      },
      responseType: 'blob',
    }
  );
  
  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `access_logs_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  return response.data;
}

/**
 * Get current user's own access logs
 * @returns {Promise} - API response with user's logs
 */
export async function getMyAccessLogs() {
  const token = localStorage.getItem('accessToken');
  
  const response = await axios.get(
    `${API_BASE_URL}/api/access-logs/my/`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
}
