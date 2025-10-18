/**
 * Nearest Parking Page Component
 * Shows nearest parking locations based on user's GPS with interactive map
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  getUserLocationAndFindNearest,
  formatDistance,
  getAvailabilityColorClass,
  getAvailabilityIcon,
  getMarkerColor
} from '../../services/parkingLocation';

// Fix Leaflet default marker icon issue with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * Component to update map center when user location changes
 */
const MapController = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
};

/**
 * Create custom colored marker icon
 */
const createColoredIcon = (color, isUserLocation = false) => {
  if (isUserLocation) {
    // User location marker (blue dot)
    return L.divIcon({
      className: 'custom-user-marker',
      html: `<div style="
        width: 20px;
        height: 20px;
        background-color: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  }
  
  // Parking location marker (colored pin)
  return L.divIcon({
    className: 'custom-parking-marker',
    html: `<div style="
      width: 30px;
      height: 30px;
      background-color: ${color};
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    "><div style="
      width: 10px;
      height: 10px;
      background-color: white;
      border-radius: 50%;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    "></div></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  });
};

const NearestParking = () => {
  // State management
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [parkingLocations, setParkingLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([19.2479, 73.1471]); // Default: College
  const [mapZoom, setMapZoom] = useState(13);
  const mapRef = useRef(null);

  /**
   * Load user location and nearest parking on component mount
   */
  useEffect(() => {
    loadNearestParking();
  }, []);

  /**
   * Fetch user location and nearest parking locations
   */
  const loadNearestParking = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getUserLocationAndFindNearest(10);
      
      if (result.success) {
        setUserLocation(result.userLocation);
        setParkingLocations(result.parkingData.locations || []);
        
        // Center map on user location
        setMapCenter([result.userLocation.latitude, result.userLocation.longitude]);
        setMapZoom(14);
      }
    } catch (err) {
      console.error('Error loading nearest parking:', err);
      setError(err.message || 'Failed to load parking locations. Please enable location services.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle location card click - zoom to location on map
   */
  const handleLocationClick = (location) => {
    setSelectedLocation(location);
    setMapCenter([location.latitude, location.longitude]);
    setMapZoom(16);
  };

  /**
   * Handle booking button click - navigate to available slots page
   */
  const handleBookNow = (location) => {
    // Navigate to available slots page (customer can browse and select slots)
    navigate('/slots');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📍 Nearest Parking</h1>
              <p className="text-gray-600 mt-1">Find available parking spots near you</p>
            </div>
            <button
              onClick={loadNearestParking}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Loading...
                </>
              ) : (
                <>
                  🔄 Refresh
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {/* Loading State */}
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
              <p className="text-gray-600 text-lg">Getting your location...</p>
              <p className="text-gray-400 text-sm mt-2">Please allow location access</p>
            </motion.div>
          )}

          {/* Error State */}
          {!loading && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-6"
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">⚠️</div>
                <div className="flex-1">
                  <h3 className="text-red-800 font-semibold text-lg mb-2">Location Error</h3>
                  <p className="text-red-700 mb-4">{error}</p>
                  <button
                    onClick={loadNearestParking}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Success State - Map and List */}
          {!loading && !error && parkingLocations.length > 0 && (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Map Section - 2 columns */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ height: '600px' }}>
                  <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    style={{ height: '100%', width: '100%' }}
                    ref={mapRef}
                  >
                    <MapController center={mapCenter} zoom={mapZoom} />
                    
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* User Location Marker */}
                    {userLocation && (
                      <Marker
                        position={[userLocation.latitude, userLocation.longitude]}
                        icon={createColoredIcon('#3b82f6', true)}
                      >
                        <Popup>
                          <div className="text-center">
                            <strong>📍 Your Location</strong>
                            <br />
                            <span className="text-sm text-gray-600">
                              Accuracy: {Math.round(userLocation.accuracy)}m
                            </span>
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Parking Location Markers */}
                    {parkingLocations.map((location, index) => (
                      <Marker
                        key={index}
                        position={[location.latitude, location.longitude]}
                        icon={createColoredIcon(getMarkerColor(location.availability_color))}
                        eventHandlers={{
                          click: () => handleLocationClick(location)
                        }}
                      >
                        <Popup>
                          <div className="min-w-[200px]">
                            <h3 className="font-bold text-lg mb-2">{location.name}</h3>
                            <div className="space-y-1 text-sm">
                              <p>📏 <strong>Distance:</strong> {location.distance_km.toFixed(2)} km</p>
                              <p>🚶 <strong>Walk:</strong> ~{location.walking_time_minutes} min</p>
                              <p>🚗 <strong>Drive:</strong> ~{location.driving_time_minutes} min</p>
                              <p className={`font-semibold ${getAvailabilityColorClass(location.availability_color)}`}>
                                {getAvailabilityIcon(location.availability_status)} {location.available_slots}/{location.total_slots} Available
                              </p>
                            </div>
                            <button
                              onClick={() => handleBookNow(location)}
                              className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                            >
                              Book Now
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>

              {/* Location List - 1 column */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    📋 Locations ({parkingLocations.length})
                  </h2>
                  
                  <div className="space-y-3 max-h-[530px] overflow-y-auto">
                    {parkingLocations.map((location, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleLocationClick(location)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                          selectedLocation?.name === location.name
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{location.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getAvailabilityColorClass(location.availability_color)}`}>
                            {getAvailabilityIcon(location.availability_status)}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>📏 {location.distance_km.toFixed(2)} km away</p>
                          <p>🚶 ~{location.walking_time_minutes} min walk | 🚗 ~{location.driving_time_minutes} min drive</p>
                          <p className="font-semibold text-gray-900">
                            {location.available_slots}/{location.total_slots} slots available
                          </p>
                        </div>
                        
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLocationClick(location);
                            }}
                            className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm font-medium"
                          >
                            📍 View
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookNow(location);
                            }}
                            disabled={location.available_slots === 0}
                            className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                          >
                            🎫 Book
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* No Results State */}
          {!loading && !error && parkingLocations.length === 0 && (
            <motion.div
              key="no-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center"
            >
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="text-yellow-800 font-semibold text-lg mb-2">No Parking Locations Found</h3>
              <p className="text-yellow-700">There are no parking locations available near your current location.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NearestParking;
