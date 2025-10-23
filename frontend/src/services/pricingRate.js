import http from './httpClient';

/**
 * Pricing Rate Service
 * Handles all API calls related to parking rate management
 */

// ==================== PUBLIC ENDPOINTS ====================

/**
 * Get default rates for all vehicle types
 * Public endpoint - no authentication required
 * Useful for displaying rate cards on booking page
 */
export async function getDefaultRates() {
  const { data } = await http.get('/api/rates/defaults/');
  return data;
}

/**
 * Get all active rates
 * Requires authentication
 */
export async function getActiveRates() {
  const { data } = await http.get('/api/rates/active/');
  return data;
}

/**
 * Calculate parking fee based on vehicle type, duration, and date/time
 * Public endpoint - accessible to all users for fee preview
 * @param {Object} feeData - { vehicle_type, hours, days, booking_datetime }
 */
export async function calculateParkingFee({ vehicle_type, hours = 0, days = 0, booking_datetime = null }) {
  const payload = {
    vehicle_type,
    hours,
    days
  };
  
  if (booking_datetime) {
    payload.booking_datetime = booking_datetime;
  }
  
  const { data } = await http.post('/api/rates/calculate-fee/', payload);
  return data;
}

// ==================== ADMIN ENDPOINTS ====================

/**
 * Get all rates (admin only)
 * Supports filtering and pagination
 * @param {Object} filters - { vehicle_type, is_active, is_default, page, page_size }
 */
export async function adminGetAllRates(filters = {}) {
  let url = '/api/admin/rates/';
  const params = new URLSearchParams();
  
  if (filters.vehicle_type) params.append('vehicle_type', filters.vehicle_type);
  if (filters.is_active !== undefined) params.append('is_active', filters.is_active);
  if (filters.is_default !== undefined) params.append('is_default', filters.is_default);
  if (filters.page) params.append('page', filters.page);
  if (filters.page_size) params.append('page_size', filters.page_size);
  
  if (params.toString()) url += `?${params.toString()}`;
  
  const { data } = await http.get(url);
  return data;
}

/**
 * Get rates by vehicle type (admin only)
 * @param {string} vehicleType - Vehicle type (2-wheeler, 4-wheeler, suv, electric, heavy)
 */
export async function adminGetRatesByVehicleType(vehicleType) {
  const { data } = await http.get(`/api/admin/rates/by-vehicle/${vehicleType}/`);
  return data;
}

/**
 * Get a specific rate by ID (admin only)
 * @param {number} rateId - Rate ID
 */
export async function adminGetRateById(rateId) {
  const { data } = await http.get(`/api/admin/rates/${rateId}/`);
  return data;
}

/**
 * Create a new rate (admin only)
 * @param {Object} rateData - Rate information
 * @param {string} rateData.rate_name - Name of the rate plan
 * @param {string} rateData.vehicle_type - Vehicle type
 * @param {number} rateData.hourly_rate - Hourly rate in ₹
 * @param {number} rateData.daily_rate - Daily rate in ₹
 * @param {number} [rateData.weekend_rate] - Weekend hourly rate (optional)
 * @param {number} [rateData.holiday_rate] - Holiday hourly rate (optional)
 * @param {string} [rateData.time_slot_start] - Special rate start time (optional)
 * @param {string} [rateData.time_slot_end] - Special rate end time (optional)
 * @param {number} [rateData.special_rate] - Special time slot rate (optional)
 * @param {string} [rateData.description] - Rate description (optional)
 * @param {boolean} [rateData.is_active] - Is rate active (default: true)
 * @param {boolean} [rateData.is_default] - Is default rate for vehicle type (default: false)
 * @param {string} [rateData.effective_from] - Effective start date (optional)
 * @param {string} [rateData.effective_to] - Effective end date (optional)
 */
export async function adminCreateRate(rateData) {
  const { data } = await http.post('/api/admin/rates/', rateData);
  return data;
}

/**
 * Update an existing rate (admin only)
 * @param {number} rateId - Rate ID
 * @param {Object} rateData - Updated rate information
 */
export async function adminUpdateRate(rateId, rateData) {
  const { data } = await http.put(`/api/admin/rates/${rateId}/`, rateData);
  return data;
}

/**
 * Partially update a rate (admin only)
 * @param {number} rateId - Rate ID
 * @param {Object} rateData - Fields to update
 */
export async function adminPatchRate(rateId, rateData) {
  const { data } = await http.patch(`/api/admin/rates/${rateId}/`, rateData);
  return data;
}

/**
 * Delete a rate (admin only)
 * @param {number} rateId - Rate ID
 */
export async function adminDeleteRate(rateId) {
  await http.delete(`/api/admin/rates/${rateId}/`);
}

/**
 * Set a rate as default for its vehicle type (admin only)
 * @param {number} rateId - Rate ID
 */
export async function adminSetDefaultRate(rateId) {
  const { data } = await http.post(`/api/admin/rates/${rateId}/set-default/`);
  return data;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Format currency for display
 * @param {number} amount - Amount in rupees
 */
export function formatCurrency(amount) {
  return `₹${parseFloat(amount).toFixed(2)}`;
}

/**
 * Get vehicle type display name
 * @param {string} vehicleType - Vehicle type code
 */
export function getVehicleTypeDisplay(vehicleType) {
  const displayNames = {
    '2-wheeler': '2-Wheeler (Bike/Scooter)',
    '4-wheeler': '4-Wheeler (Car/Sedan)',
    'suv': 'SUV',
    'electric': 'Electric Vehicle',
    'heavy': 'Heavy Vehicle (Truck/Bus)',
    'car': 'Car', // Backward compatibility
    'bike': 'Bike', // Backward compatibility
    'all': 'All Vehicles'
  };
  
  return displayNames[vehicleType] || vehicleType;
}

/**
 * Get vehicle type options for dropdowns
 */
export function getVehicleTypeOptions() {
  return [
    { value: '2-wheeler', label: '2-Wheeler (Bike/Scooter)' },
    { value: '4-wheeler', label: '4-Wheeler (Car/Sedan)' },
    { value: 'suv', label: 'SUV' },
    { value: 'electric', label: 'Electric Vehicle' },
    { value: 'heavy', label: 'Heavy Vehicle (Truck/Bus)' }
  ];
}

/**
 * Validate rate data before submission
 * @param {Object} rateData - Rate data to validate
 * @returns {Object} { isValid: boolean, errors: {} }
 */
export function validateRateData(rateData) {
  const errors = {};
  
  // Required fields
  if (!rateData.rate_name || rateData.rate_name.trim() === '') {
    errors.rate_name = 'Rate name is required';
  }
  
  if (!rateData.vehicle_type) {
    errors.vehicle_type = 'Vehicle type is required';
  }
  
  // Rate validations
  if (!rateData.hourly_rate || parseFloat(rateData.hourly_rate) <= 0) {
    errors.hourly_rate = 'Hourly rate must be greater than 0';
  }
  
  if (!rateData.daily_rate || parseFloat(rateData.daily_rate) <= 0) {
    errors.daily_rate = 'Daily rate must be greater than 0';
  }
  
  // Optional rate validations
  if (rateData.weekend_rate && parseFloat(rateData.weekend_rate) <= 0) {
    errors.weekend_rate = 'Weekend rate must be greater than 0 if provided';
  }
  
  if (rateData.holiday_rate && parseFloat(rateData.holiday_rate) <= 0) {
    errors.holiday_rate = 'Holiday rate must be greater than 0 if provided';
  }
  
  if (rateData.special_rate && parseFloat(rateData.special_rate) <= 0) {
    errors.special_rate = 'Special rate must be greater than 0 if provided';
  }
  
  // Time slot validation
  if (rateData.time_slot_start && !rateData.time_slot_end) {
    errors.time_slot_end = 'End time is required when start time is provided';
  }
  
  if (rateData.time_slot_end && !rateData.time_slot_start) {
    errors.time_slot_start = 'Start time is required when end time is provided';
  }
  
  // Special rate validation
  if ((rateData.time_slot_start || rateData.time_slot_end) && !rateData.special_rate) {
    errors.special_rate = 'Special rate is required when time slot is defined';
  }
  
  // Date validation
  if (rateData.effective_from && rateData.effective_to) {
    const fromDate = new Date(rateData.effective_from);
    const toDate = new Date(rateData.effective_to);
    
    if (toDate <= fromDate) {
      errors.effective_to = 'End date must be after start date';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Format rate data for display
 * @param {Object} rate - Rate object from API
 */
export function formatRateForDisplay(rate) {
  return {
    ...rate,
    hourly_rate_display: formatCurrency(rate.hourly_rate),
    daily_rate_display: formatCurrency(rate.daily_rate),
    weekend_rate_display: rate.weekend_rate ? formatCurrency(rate.weekend_rate) : 'N/A',
    holiday_rate_display: rate.holiday_rate ? formatCurrency(rate.holiday_rate) : 'N/A',
    special_rate_display: rate.special_rate ? formatCurrency(rate.special_rate) : 'N/A',
    vehicle_type_display: getVehicleTypeDisplay(rate.vehicle_type)
  };
}

export default {
  // Public endpoints
  getDefaultRates,
  getActiveRates,
  calculateParkingFee,
  
  // Admin endpoints
  adminGetAllRates,
  adminGetRatesByVehicleType,
  adminGetRateById,
  adminCreateRate,
  adminUpdateRate,
  adminPatchRate,
  adminDeleteRate,
  adminSetDefaultRate,
  
  // Helper functions
  formatCurrency,
  getVehicleTypeDisplay,
  getVehicleTypeOptions,
  validateRateData,
  formatRateForDisplay
};
