/**
 * Parking Location Service
 * Handles API calls for finding nearest parking locations
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const NEAREST_PARKING_ENDPOINT = `${API_BASE_URL}/api/parking/nearest/`;

/**
 * Get nearest parking locations based on user's GPS coordinates
 * @param {number} latitude - User's current latitude
 * @param {number} longitude - User's current longitude
 * @param {number} maxResults - Maximum number of locations to return (default: 10)
 * @returns {Promise<Object>} API response with nearest parking locations
 */
export const getNearestParkingLocations = async (latitude, longitude, maxResults = 10) => {
  try {
    const response = await axios.get(NEAREST_PARKING_ENDPOINT, {
      params: {
        latitude,
        longitude,
        max_results: maxResults
      }
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching nearest parking locations:', error);
    
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      return {
        success: false,
        error: error.response.data.error || 'Server error',
        message: error.response.data.message || 'Failed to fetch parking locations',
        status: error.response.status
      };
    } else if (error.request) {
      // Request made but no response
      return {
        success: false,
        error: 'Network error',
        message: 'Could not connect to server. Please check your internet connection.'
      };
    } else {
      // Something else happened
      return {
        success: false,
        error: 'Unknown error',
        message: error.message || 'An unexpected error occurred'
      };
    }
  }
};

/**
 * Get user's current location and find nearest parking
 * Combines geolocation API with parking location API
 * @param {number} maxResults - Maximum number of locations to return
 * @returns {Promise<Object>} User location and nearest parking data
 */
export const getUserLocationAndFindNearest = async (maxResults = 10) => {
  return new Promise((resolve, reject) => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      reject({
        success: false,
        error: 'Geolocation not supported',
        message: 'Your browser does not support geolocation.'
      });
      return;
    }

    // Get user's current position
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Fetch nearest parking locations
        const result = await getNearestParkingLocations(latitude, longitude, maxResults);
        
        if (result.success) {
          resolve({
            success: true,
            userLocation: {
              latitude,
              longitude,
              accuracy: position.coords.accuracy
            },
            parkingData: result.data
          });
        } else {
          reject(result);
        }
      },
      (error) => {
        // Handle geolocation errors
        let errorMessage = 'Could not get your location.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location services in your browser.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
        }
        
        reject({
          success: false,
          error: 'Geolocation error',
          message: errorMessage
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

/**
 * Format distance for display
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance string
 */
export const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(2)}km`;
};

/**
 * Get color class based on availability status
 * @param {string} availabilityColor - Color from API (green/yellow/orange/red)
 * @returns {string} Tailwind CSS color class
 */
export const getAvailabilityColorClass = (availabilityColor) => {
  const colorMap = {
    green: 'text-green-600 bg-green-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    orange: 'text-orange-600 bg-orange-100',
    red: 'text-red-600 bg-red-100'
  };
  
  return colorMap[availabilityColor] || 'text-gray-600 bg-gray-100';
};

/**
 * Get availability icon based on status
 * @param {string} availabilityStatus - Status from API (available/moderate/limited/full)
 * @returns {string} Icon emoji
 */
export const getAvailabilityIcon = (availabilityStatus) => {
  const iconMap = {
    available: '✅',
    moderate: '⚠️',
    limited: '🟠',
    full: '🔴'
  };
  
  return iconMap[availabilityStatus] || '❓';
};

/**
 * Get marker color for map based on availability
 * @param {string} availabilityColor - Color from API
 * @returns {string} Hex color code for map marker
 */
export const getMarkerColor = (availabilityColor) => {
  const colorMap = {
    green: '#22c55e',   // Green-500
    yellow: '#eab308',  // Yellow-500
    orange: '#f97316',  // Orange-500
    red: '#ef4444'      // Red-500
  };
  
  return colorMap[availabilityColor] || '#6b7280'; // Gray-500
};

export default {
  getNearestParkingLocations,
  getUserLocationAndFindNearest,
  formatDistance,
  getAvailabilityColorClass,
  getAvailabilityIcon,
  getMarkerColor
};
