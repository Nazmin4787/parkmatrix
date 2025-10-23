/**
 * Parking Zone Management Service
 * Handles API calls for zone-wise parking slot management
 */

import http from './httpClient';

/**
 * Get list of all parking zones with statistics
 * @returns {Promise<Object>} List of zones with availability info
 */
export async function getParkingZones() {
  const { data } = await http.get('/api/parking-zones/');
  return data;
}

/**
 * Get all slots for a specific zone
 * @param {string} zoneCode - The zone code (e.g., 'COLLEGE_PARKING_CENTER')
 * @param {Object} filters - Optional filters
 * @param {string} filters.vehicle_type - Filter by vehicle type
 * @param {boolean} filters.available_only - Show only available slots
 * @param {string} filters.floor - Filter by floor
 * @param {string} filters.section - Filter by section
 * @returns {Promise<Object>} Slots data for the zone
 */
export async function getSlotsByZone(zoneCode, filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.vehicle_type) params.append('vehicle_type', filters.vehicle_type);
  if (filters.available_only) params.append('available_only', 'true');
  if (filters.floor) params.append('floor', filters.floor);
  if (filters.section) params.append('section', filters.section);
  
  const queryString = params.toString();
  const url = `/api/parking-zones/${zoneCode}/slots/${queryString ? '?' + queryString : ''}`;
  
  const { data } = await http.get(url);
  return data;
}

/**
 * Get detailed statistics for a specific zone
 * @param {string} zoneCode - The zone code
 * @returns {Promise<Object>} Zone statistics
 */
export async function getZoneStatistics(zoneCode) {
  const { data } = await http.get(`/api/parking-zones/${zoneCode}/statistics/`);
  return data;
}

/**
 * Get admin dashboard data for all zones
 * @returns {Promise<Object>} Dashboard data with all zones
 */
export async function getZoneDashboard() {
  const { data } = await http.get('/api/admin/parking-zones/dashboard/');
  return data;
}

/**
 * Get slots for admin management in a specific zone
 * @param {string} zoneCode - The zone code
 * @returns {Promise<Object>} Zone management data
 */
export async function getAdminZoneSlots(zoneCode) {
  const { data } = await http.get(`/api/admin/parking-zones/${zoneCode}/`);
  return data;
}

/**
 * Create a new slot in a specific zone (Admin only)
 * @param {string} zoneCode - The zone code
 * @param {Object} slotData - Slot data
 * @returns {Promise<Object>} Created slot data
 */
export async function createSlotInZone(zoneCode, slotData) {
  const { data } = await http.post(`/api/admin/parking-zones/${zoneCode}/`, slotData);
  return data;
}

/**
 * Get available slots with zone filter
 * @param {string} zoneCode - Optional zone code to filter
 * @param {string} vehicleType - Optional vehicle type to filter
 * @returns {Promise<Array>} Available slots
 */
export async function getAvailableSlotsByZone(zoneCode = null, vehicleType = null) {
  const params = new URLSearchParams();
  
  if (zoneCode) params.append('parking_zone', zoneCode);
  if (vehicleType) params.append('vehicle_type', vehicleType);
  
  const queryString = params.toString();
  const url = `/api/slots/available/${queryString ? '?' + queryString : ''}`;
  
  const { data } = await http.get(url);
  return data;
}
