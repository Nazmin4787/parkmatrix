/**
 * Geolocation Service
 * Handles GPS location fetching for geo-fencing features
 */

// Parking center coordinates (matches backend)
export const COLLEGE_PARKING_CENTER = {
  lat: 19.2479,
  lon: 73.1471,
  radius_meters: 500,
  name: 'College Parking'
};

export const HOME_PARKING_CENTER = {
  lat: 19.2056,
  lon: 73.1556,
  radius_meters: 500,
  name: 'Home Parking'
};

export const METRO_PARKING_CENTER = {
  lat: 19.2291,
  lon: 73.1233,
  radius_meters: 500,
  name: 'Metro Parking'
};

export const VIVIVANA_PARKING_CENTER = {
  lat: 19.2088,
  lon: 72.9716,
  radius_meters: 500,
  name: 'Vivivana Parking'
};

// List of all valid parking locations
export const PARKING_LOCATIONS = [
  COLLEGE_PARKING_CENTER,
  HOME_PARKING_CENTER,
  METRO_PARKING_CENTER,
  VIVIVANA_PARKING_CENTER
];

// Default parking center (for backwards compatibility)
export const PARKING_CENTER = COLLEGE_PARKING_CENTER;

/**
 * Get user's current GPS location
 * @param {Object} options - Geolocation options
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
export const getUserLocation = (options = {}) => {
  return new Promise((resolve, reject) => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: true,  // Use GPS if available
      timeout: 10000,            // 10 seconds timeout
      maximumAge: 0              // Don't use cached location
    };

    const finalOptions = { ...defaultOptions, ...options };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let errorMessage = 'Failed to get location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location services in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Please check your GPS settings.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage = 'An unknown error occurred while getting your location.';
        }
        
        reject(new Error(errorMessage));
      },
      finalOptions
    );
  });
};

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's radius in meters
  
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Check if user is within any parking area
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @param {Object} parkingCenter - Optional specific parking center to check
 * @returns {Object} { isWithin: boolean, distance: number, allowedRadius: number, locationName: string }
 */
export const isWithinParkingArea = (userLat, userLon, parkingCenter = null) => {
  // If specific parking center provided, check only that one
  if (parkingCenter) {
    const distance = calculateDistance(
      userLat,
      userLon,
      parkingCenter.lat,
      parkingCenter.lon
    );
    
    return {
      isWithin: distance <= parkingCenter.radius_meters,
      distance: Math.round(distance),
      allowedRadius: parkingCenter.radius_meters,
      locationName: parkingCenter.name || 'parking area'
    };
  }
  
  // Check all parking locations and return true if within ANY of them
  let closestDistance = Infinity;
  let closestLocation = null;
  
  for (const location of PARKING_LOCATIONS) {
    const distance = calculateDistance(
      userLat,
      userLon,
      location.lat,
      location.lon
    );
    
    // Track the closest location
    if (distance < closestDistance) {
      closestDistance = distance;
      closestLocation = location;
    }
    
    // Check if within this location's radius
    if (distance <= location.radius_meters) {
      return {
        isWithin: true,
        distance: Math.round(distance),
        allowedRadius: location.radius_meters,
        locationName: location.name || 'parking area'
      };
    }
  }
  
  // Not within any location - return details of closest one
  return {
    isWithin: false,
    distance: Math.round(closestDistance),
    allowedRadius: closestLocation?.radius_meters || 500,
    locationName: closestLocation?.name || 'any parking area'
  };
};

/**
 * Format distance for display
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance string
 */
export const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(2)}km`;
};

/**
 * Get location with error handling and user feedback
 * @returns {Promise<{success: boolean, location?: Object, error?: string}>}
 */
export const getLocationWithFeedback = async () => {
  try {
    const location = await getUserLocation();
    const validation = isWithinParkingArea(location.latitude, location.longitude);
    
    return {
      success: true,
      location: {
        ...location,
        ...validation
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Request location permission (pre-check before actual location request)
 * @returns {Promise<boolean>} true if permission granted
 */
export const checkLocationPermission = async () => {
  if (!navigator.permissions) {
    // Permissions API not supported, try anyway
    return true;
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state === 'granted' || result.state === 'prompt';
  } catch (error) {
    console.error('Error checking location permission:', error);
    return true; // Assume we can try
  }
};
