import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Get check-in/check-out logs with filtering
 * @param {Object} params - Query parameters
 * @returns {Promise} - API response with check-in/check-out logs
 */
export async function getCheckInCheckOutLogs(params = {}) {
  const token = localStorage.getItem('accessToken');
  
  console.log('getCheckInCheckOutLogs - Token present:', !!token);
  console.log('getCheckInCheckOutLogs - Params:', params);
  
  const queryParams = new URLSearchParams();
  if (params.booking_id) queryParams.append('booking_id', params.booking_id);
  if (params.user_id) queryParams.append('user_id', params.user_id);
  if (params.username) queryParams.append('username', params.username);
  if (params.vehicle_plate) queryParams.append('vehicle_plate', params.vehicle_plate);
  if (params.vehicle_type) queryParams.append('vehicle_type', params.vehicle_type);
  if (params.action) queryParams.append('action', params.action);
  if (params.status) queryParams.append('status', params.status);
  if (params.date_from) queryParams.append('date_from', params.date_from);
  if (params.date_to) queryParams.append('date_to', params.date_to);
  if (params.parking_lot) queryParams.append('parking_lot', params.parking_lot);
  if (params.floor) queryParams.append('floor', params.floor);
  if (params.section) queryParams.append('section', params.section);
  if (params.current_status) queryParams.append('current_status', params.current_status);
  if (params.ordering) queryParams.append('ordering', params.ordering);

  const response = await axios.get(
    `${API_BASE_URL}/api/admin/checkin-checkout-logs/?${queryParams.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }
  );
  
  console.log('getCheckInCheckOutLogs - Response:', response.status, response.data);
  return response.data;
}

/**
 * Get detailed information about a specific check-in/check-out log
 * @param {number} id - Log ID
 * @returns {Promise} - API response with log details
 */
export async function getCheckInCheckOutLogDetail(id) {
  const token = localStorage.getItem('accessToken');
  
  const response = await axios.get(
    `${API_BASE_URL}/api/admin/checkin-checkout-logs/${id}/`,
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
 * Get check-in/check-out statistics
 * @param {Object} params - Query parameters (date_from, date_to)
 * @returns {Promise} - API response with statistics
 */
export async function getCheckInCheckOutStats(params = {}) {
  const token = localStorage.getItem('accessToken');
  
  const queryParams = new URLSearchParams();
  if (params.date_from) queryParams.append('date_from', params.date_from);
  if (params.date_to) queryParams.append('date_to', params.date_to);

  const response = await axios.get(
    `${API_BASE_URL}/api/admin/checkin-checkout-logs/stats/?${queryParams.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }
  );
  
  console.log('getCheckInCheckOutStats - Response:', response.status, response.data);
  return response.data;
}

/**
 * Export check-in/check-out logs to CSV
 * @param {Object} params - Query parameters (same as getCheckInCheckOutLogs)
 * @returns {Promise} - Blob data for CSV download
 */
export async function exportCheckInCheckOutLogs(params = {}) {
  const token = localStorage.getItem('accessToken');
  
  const queryParams = new URLSearchParams();
  if (params.booking_id) queryParams.append('booking_id', params.booking_id);
  if (params.user_id) queryParams.append('user_id', params.user_id);
  if (params.username) queryParams.append('username', params.username);
  if (params.vehicle_plate) queryParams.append('vehicle_plate', params.vehicle_plate);
  if (params.vehicle_type) queryParams.append('vehicle_type', params.vehicle_type);
  if (params.action) queryParams.append('action', params.action);
  if (params.status) queryParams.append('status', params.status);
  if (params.date_from) queryParams.append('date_from', params.date_from);
  if (params.date_to) queryParams.append('date_to', params.date_to);
  if (params.parking_lot) queryParams.append('parking_lot', params.parking_lot);
  if (params.floor) queryParams.append('floor', params.floor);
  if (params.section) queryParams.append('section', params.section);

  const response = await axios.get(
    `${API_BASE_URL}/api/admin/checkin-checkout-logs/export/?${queryParams.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      responseType: 'blob',
    }
  );
  
  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `checkin_checkout_logs_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  return response.data;
}

/**
 * Get currently parked vehicles
 * @returns {Promise} - API response with currently parked vehicles
 */
export async function getCurrentlyParkedVehicles() {
  const token = localStorage.getItem('accessToken');
  
  const response = await axios.get(
    `${API_BASE_URL}/api/admin/currently-parked/`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }
  );
  
  console.log('getCurrentlyParkedVehicles - Response:', response.status, response.data);
  return response.data;
}

/**
 * Get user's own check-in/check-out logs
 * @returns {Promise} - API response with user's logs
 */
export async function getMyCheckInCheckOutLogs() {
  const token = localStorage.getItem('accessToken');
  
  const response = await axios.get(
    `${API_BASE_URL}/api/checkin-checkout-logs/my/`,
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
 * Get user's current parking session
 * @returns {Promise} - API response with current parking details
 */
export async function getMyCurrentParking() {
  const token = localStorage.getItem('accessToken');
  
  const response = await axios.get(
    `${API_BASE_URL}/api/parking/current/`,
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
