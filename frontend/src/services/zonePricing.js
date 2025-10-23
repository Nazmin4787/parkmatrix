import api from './httpClient';

/**
 * Zone Pricing Service - Handles all zone pricing rate API calls
 */

// Get all zone pricing rates with optional filters
export const getZonePricingRates = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.parking_zone) params.append('parking_zone', filters.parking_zone);
    if (filters.vehicle_type) params.append('vehicle_type', filters.vehicle_type);
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active);
    if (filters.only_valid) params.append('only_valid', filters.only_valid);
    
    const response = await api.get(`/api/zone-pricing/?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching zone pricing rates:', error);
    throw error;
  }
};

// Get rate summary (all zones organized)
export const getZonePricingRateSummary = async () => {
  try {
    const response = await api.get('/api/zone-pricing/rate_summary/');
    return response.data;
  } catch (error) {
    console.error('Error fetching zone pricing rate summary:', error);
    throw error;
  }
};

// Get rates for specific zone
export const getRatesByZone = async (zoneCode) => {
  try {
    const response = await api.get(`/api/zone-pricing/by_zone/?zone=${zoneCode}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching rates for zone ${zoneCode}:`, error);
    throw error;
  }
};

// Get only active rates
export const getActiveRates = async () => {
  try {
    const response = await api.get('/api/zone-pricing/active_rates/');
    return response.data;
  } catch (error) {
    console.error('Error fetching active rates:', error);
    throw error;
  }
};

// Get specific zone pricing rate
export const getZonePricingRate = async (id) => {
  try {
    const response = await api.get(`/api/zone-pricing/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching zone pricing rate ${id}:`, error);
    throw error;
  }
};

// Create new zone pricing rate
export const createZonePricingRate = async (rateData) => {
  try {
    const response = await api.post('/api/zone-pricing/', rateData);
    return response.data;
  } catch (error) {
    console.error('Error creating zone pricing rate:', error);
    throw error;
  }
};

// Update zone pricing rate
export const updateZonePricingRate = async (id, rateData) => {
  try {
    const response = await api.patch(`/api/zone-pricing/${id}/`, rateData);
    return response.data;
  } catch (error) {
    console.error(`Error updating zone pricing rate ${id}:`, error);
    throw error;
  }
};

// Delete zone pricing rate
export const deleteZonePricingRate = async (id) => {
  try {
    const response = await api.delete(`/api/zone-pricing/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting zone pricing rate ${id}:`, error);
    throw error;
  }
};

// Bulk update rates
export const bulkUpdateZonePricingRates = async (rates) => {
  try {
    const response = await api.post('/api/zone-pricing/bulk_update/', { rates });
    return response.data;
  } catch (error) {
    console.error('Error bulk updating zone pricing rates:', error);
    throw error;
  }
};

// Helper: Get zone choices
export const PARKING_ZONE_CHOICES = [
  { value: 'COLLEGE_PARKING_CENTER', label: 'College Parking Center' },
  { value: 'HOME_PARKING_CENTER', label: 'Home Parking Center' },
  { value: 'METRO_PARKING_CENTER', label: 'Metro Parking Center' },
  { value: 'VIVIVANA_PARKING_CENTER', label: 'Vivivana Parking Center' },
];

// Helper: Get vehicle type choices
export const VEHICLE_TYPE_CHOICES = [
  { value: 'car', label: 'Car' },
  { value: 'bike', label: 'Bike' },
  { value: 'suv', label: 'SUV' },
  { value: 'truck', label: 'Truck' },
];

// Helper: Format currency
export const formatCurrency = (amount) => {
  return `₹${parseFloat(amount).toFixed(2)}`;
};

export default {
  getZonePricingRates,
  getZonePricingRateSummary,
  getRatesByZone,
  getActiveRates,
  getZonePricingRate,
  createZonePricingRate,
  updateZonePricingRate,
  deleteZonePricingRate,
  bulkUpdateZonePricingRates,
  PARKING_ZONE_CHOICES,
  VEHICLE_TYPE_CHOICES,
  formatCurrency,
};
