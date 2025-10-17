import React, { useState } from 'react';
import { 
  getUserLocation, 
  isWithinParkingArea,
  calculateDistance,
  formatDistance,
  PARKING_CENTER
} from '../services/geolocation';

/**
 * Geolocation Test Page
 * Use this page to test GPS functionality and distance calculations
 */
const GeolocationTestPage = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);

  const testLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const loc = await getUserLocation();
      const validation = isWithinParkingArea(loc.latitude, loc.longitude);
      
      const result = {
        ...loc,
        ...validation,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setLocation(result);
      setLocationHistory(prev => [result, ...prev].slice(0, 5)); // Keep last 5
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistanceTo = (lat, lon) => {
    if (!location) return 'N/A';
    const dist = calculateDistance(
      location.latitude,
      location.longitude,
      lat,
      lon
    );
    return formatDistance(dist);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            📍 Geolocation Test Page
          </h1>
          <p className="text-gray-600 text-sm mb-6">
            Test GPS functionality and distance calculations for geo-fencing
          </p>

          {/* Test Button */}
          <button
            onClick={testLocation}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Getting Location...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Get My Location</span>
              </>
            )}
          </button>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Current Location */}
        {location && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📍 Current Location</h2>
            
            {/* Status Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${
              location.isWithin 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {location.isWithin ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className="font-medium">
                {location.isWithin ? 'WITHIN PARKING AREA' : 'OUTSIDE PARKING AREA'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Latitude</p>
                <p className="text-lg font-mono font-medium">{location.latitude.toFixed(6)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Longitude</p>
                <p className="text-lg font-mono font-medium">{location.longitude.toFixed(6)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Distance from Parking</p>
                <p className="text-lg font-medium">{formatDistance(location.distance)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">GPS Accuracy</p>
                <p className="text-lg font-medium">±{Math.round(location.accuracy)}m</p>
              </div>
            </div>
          </div>
        )}

        {/* Parking Center Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🎯 Parking Center</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 mb-1">Latitude</p>
              <p className="text-lg font-mono font-medium">{PARKING_CENTER.lat}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 mb-1">Longitude</p>
              <p className="text-lg font-mono font-medium">{PARKING_CENTER.lon}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 mb-1">Radius</p>
              <p className="text-lg font-medium">{formatDistance(PARKING_CENTER.radius_meters)}</p>
            </div>
          </div>
          
          {location && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Google Maps Link to parking center:
              </p>
              <a 
                href={`https://www.google.com/maps?q=${PARKING_CENTER.lat},${PARKING_CENTER.lon}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                https://www.google.com/maps?q={PARKING_CENTER.lat},{PARKING_CENTER.lon}
              </a>
            </div>
          )}
        </div>

        {/* Location History */}
        {locationHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📜 Location History</h2>
            <div className="space-y-2">
              {locationHistory.map((loc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      loc.isWithin ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium">
                        {formatDistance(loc.distance)} from parking
                      </p>
                      <p className="text-xs text-gray-600">{loc.timestamp}</p>
                    </div>
                  </div>
                  <div className="text-xs font-mono text-gray-500">
                    {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Locations */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🧪 Test Calculations</h2>
          <p className="text-sm text-gray-600 mb-4">
            Calculate distance from your current location to various points
          </p>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Parking Center</p>
                <p className="text-xs text-gray-600">
                  {PARKING_CENTER.lat}, {PARKING_CENTER.lon}
                </p>
              </div>
              <p className="font-medium text-blue-600">
                {location ? formatDistance(location.distance) : 'N/A'}
              </p>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">~200m North of Parking</p>
                <p className="text-xs text-gray-600">
                  {(PARKING_CENTER.lat + 0.0018).toFixed(6)}, {PARKING_CENTER.lon}
                </p>
              </div>
              <p className="font-medium text-gray-600">
                {calculateDistanceTo(PARKING_CENTER.lat + 0.0018, PARKING_CENTER.lon)}
              </p>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">~1km South of Parking</p>
                <p className="text-xs text-gray-600">
                  {(PARKING_CENTER.lat - 0.009).toFixed(6)}, {PARKING_CENTER.lon}
                </p>
              </div>
              <p className="font-medium text-gray-600">
                {calculateDistanceTo(PARKING_CENTER.lat - 0.009, PARKING_CENTER.lon)}
              </p>
            </div>
          </div>
        </div>

        {/* Browser Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🌐 Browser Info</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-600">Geolocation API:</span>
              <span className={`font-medium ${
                navigator.geolocation ? 'text-green-600' : 'text-red-600'
              }`}>
                {navigator.geolocation ? '✓ Supported' : '✗ Not Supported'}
              </span>
            </div>
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-600">HTTPS:</span>
              <span className={`font-medium ${
                window.location.protocol === 'https:' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {window.location.protocol === 'https:' ? '✓ Secure' : '⚠️ Not Secure'}
              </span>
            </div>
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-600">User Agent:</span>
              <span className="font-mono text-xs text-gray-600 truncate max-w-xs">
                {navigator.userAgent.substring(0, 50)}...
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeolocationTestPage;
