import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  getActiveBooking, 
  checkInBooking, 
  checkOutBooking 
} from '../../services/bookingslot';
import { 
  getUserLocation, 
  isWithinParkingArea,
  formatDistance,
  PARKING_CENTER
} from '../../services/geolocation';
import Toast from '../../UIcomponents/Toast';

const CheckInCheckOut = () => {
  const [activeBooking, setActiveBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [actionType, setActionType] = useState(''); // 'checkin' or 'checkout'
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    fetchActiveBooking();
  }, []);

  const fetchActiveBooking = async () => {
    try {
      setLoading(true);
      const booking = await getActiveBooking();
      setActiveBooking(booking);
    } catch (error) {
      console.error('Error fetching active booking:', error);
      if (error.response?.status !== 404) {
        showToast('Error fetching active booking', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 5000);
  };

  const fetchUserLocation = async () => {
    try {
      setLocationLoading(true);
      setLocationError(null);
      
      const location = await getUserLocation();
      const validation = isWithinParkingArea(location.latitude, location.longitude);
      
      setUserLocation({
        ...location,
        ...validation
      });
      
      // Show warning if outside parking area
      if (!validation.isWithin) {
        showToast(
          `⚠️ You are ${formatDistance(validation.distance)} away from the parking area. You must be within ${formatDistance(validation.allowedRadius)} to check in/out.`,
          'warning'
        );
      } else {
        showToast(
          `📍 Location verified! You are ${formatDistance(validation.distance)} from parking center.`,
          'success'
        );
      }
      
      return location;
    } catch (error) {
      console.error('Location error:', error);
      setLocationError(error.message);
      showToast(error.message, 'error');
      throw error;
    } finally {
      setLocationLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!activeBooking) return;
    
    try {
      setActionLoading(true);
      
      // Get user location first
      const location = await fetchUserLocation();
      
      // Call API with location
      const result = await checkInBooking(activeBooking.id, notes, location);
      
      showToast('✅ Successfully checked in!', 'success');
      setNotes('');
      setShowNotesInput(false);
      setUserLocation(null);
      
      // Refresh active booking data
      await fetchActiveBooking();
    } catch (error) {
      console.error('Check-in error:', error);
      
      // Handle different error types
      if (error.message && error.message.includes('location')) {
        // Location error already shown by fetchUserLocation
        return;
      }
      
      const errorData = error.response?.data;
      let errorMessage = errorData?.error || errorData?.message || 'Failed to check in';
      
      // If location verification failed (403)
      if (error.response?.status === 403 && errorData?.distance_meters) {
        errorMessage = `❌ ${errorData.message}\n\nYou are ${formatDistance(errorData.distance_meters)} away from the parking area.`;
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!activeBooking) return;
    
    try {
      setActionLoading(true);
      
      // Get user location first
      const location = await fetchUserLocation();
      
      // Call API with location
      const result = await checkOutBooking(activeBooking.id, notes, location);
      
      let message = '✅ Successfully checked out!';
      if (result.overtime_charge && parseFloat(result.overtime_charge) > 0) {
        message += `\n\n⏱️ Overtime charge: $${result.overtime_charge}`;
      }
      
      showToast(message, 'success');
      setNotes('');
      setShowNotesInput(false);
      setUserLocation(null);
      
      // Refresh active booking data
      await fetchActiveBooking();
    } catch (error) {
      console.error('Check-out error:', error);
      
      // Handle different error types
      if (error.message && error.message.includes('location')) {
        // Location error already shown by fetchUserLocation
        return;
      }
      
      const errorData = error.response?.data;
      let errorMessage = errorData?.error || errorData?.message || 'Failed to check out';
      
      // If location verification failed (403)
      if (error.response?.status === 403 && errorData?.distance_meters) {
        errorMessage = `❌ ${errorData.message}\n\nYou are ${formatDistance(errorData.distance_meters)} away from the parking area.`;
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const initiateAction = (type) => {
    setActionType(type);
    setShowNotesInput(true);
  };

  const executeAction = () => {
    if (actionType === 'checkin') {
      handleCheckIn();
    } else if (actionType === 'checkout') {
      handleCheckOut();
    }
  };

  const cancelAction = () => {
    setShowNotesInput(false);
    setNotes('');
    setActionType('');
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    return new Date(dateTimeString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'checked_in': return 'bg-green-100 text-green-800';
      case 'checked_out': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading your active booking...</span>
      </div>
    );
  }

  if (!activeBooking) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Check-in / Check-out</h3>
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 6v6m0 0V7m0 6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-gray-600 mb-2">No active booking found</p>
          <p className="text-sm text-gray-500">You need an active booking to check in or check out</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md p-6"
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Check-in / Check-out</h3>
      
      {/* Active Booking Info */}
      <div className="border rounded-lg p-4 mb-6 bg-gray-50">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="font-medium text-gray-800">Active Booking</h4>
            <p className="text-sm text-gray-600">#{activeBooking.id}</p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activeBooking.status)}`}>
            {activeBooking.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Slot:</p>
            <p className="font-medium">{activeBooking.slot?.slot_number || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-600">Vehicle:</p>
            <p className="font-medium">{activeBooking.vehicle?.number_plate || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-600">Start Time:</p>
            <p className="font-medium">{formatDateTime(activeBooking.start_time)}</p>
          </div>
          <div>
            <p className="text-gray-600">End Time:</p>
            <p className="font-medium">{formatDateTime(activeBooking.end_time)}</p>
          </div>
          {activeBooking.checked_in_at && (
            <div>
              <p className="text-gray-600">Checked In:</p>
              <p className="font-medium">{formatDateTime(activeBooking.checked_in_at)}</p>
            </div>
          )}
          {activeBooking.checked_out_at && (
            <div>
              <p className="text-gray-600">Checked Out:</p>
              <p className="font-medium">{formatDateTime(activeBooking.checked_out_at)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {!showNotesInput && (
        <div className="space-y-4">
          {/* Location Status Indicator */}
          {userLocation && (
            <div className={`p-3 rounded-lg border ${
              userLocation.isWithin 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {userLocation.isWithin ? (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <div>
                    <p className={`text-sm font-medium ${
                      userLocation.isWithin ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {userLocation.isWithin 
                        ? '✓ Within parking area' 
                        : '✗ Outside parking area'}
                    </p>
                    <p className={`text-xs ${
                      userLocation.isWithin ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatDistance(userLocation.distance)} from parking center
                    </p>
                  </div>
                </div>
                <button
                  onClick={fetchUserLocation}
                  disabled={locationLoading}
                  className="text-xs text-blue-600 hover:text-blue-700 underline"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}

          {/* Check Location Button */}
          {!userLocation && (
            <button
              onClick={fetchUserLocation}
              disabled={locationLoading}
              className="w-full px-4 py-2 border-2 border-blue-500 text-blue-600 rounded-md hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              {locationLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Getting your location...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Verify Location</span>
                </>
              )}
            </button>
          )}

          {/* Location Error */}
          {locationError && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">Location Access Required</p>
                  <p className="text-xs text-yellow-700 mt-1">{locationError}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-4">
            {activeBooking.status === 'confirmed' && (
              <button
                onClick={() => initiateAction('checkin')}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Check In
              </button>
            )}
            
            {activeBooking.status === 'checked_in' && (
              <button
                onClick={() => initiateAction('checkout')}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Check Out
              </button>
            )}
          </div>
        </div>
      )}

      {/* Notes Input Section */}
      {showNotesInput && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border rounded-lg p-4 bg-blue-50"
        >
          <h5 className="font-medium text-gray-800 mb-3">
            {actionType === 'checkin' ? '📍 Check-in' : '📍 Check-out'} Confirmation
          </h5>
          
          <div className="mb-4 p-3 bg-blue-100 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                Your location will be verified when you confirm. Please ensure you are at the parking area.
              </span>
            </p>
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="3"
          />
          
          <div className="flex gap-3 mt-4">
            <button
              onClick={executeAction}
              disabled={actionLoading}
              className={`flex-1 px-4 py-2 rounded-md text-white transition-colors ${
                actionType === 'checkin' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {actionLoading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {locationLoading ? 'Verifying location...' : 'Processing...'}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {`Confirm ${actionType === 'checkin' ? 'Check-in' : 'Check-out'}`}
                </span>
              )}
            </button>
            
            <button
              onClick={cancelAction}
              disabled={actionLoading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: '' })}
        />
      )}
    </motion.div>
  );
};

export default CheckInCheckOut;