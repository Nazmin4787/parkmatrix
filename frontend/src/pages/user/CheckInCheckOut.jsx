import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  getActiveBooking, 
  checkInBooking, 
  checkOutBooking 
} from '../../services/bookingslot';
import Toast from '../../UIcomponents/Toast';

const CheckInCheckOut = () => {
  const [activeBooking, setActiveBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [actionType, setActionType] = useState(''); // 'checkin' or 'checkout'
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

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

  const handleCheckIn = async () => {
    if (!activeBooking) return;
    
    try {
      setActionLoading(true);
      const result = await checkInBooking(activeBooking.id, notes);
      
      showToast('Successfully checked in!', 'success');
      setNotes('');
      setShowNotesInput(false);
      
      // Refresh active booking data
      await fetchActiveBooking();
    } catch (error) {
      console.error('Check-in error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to check in';
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!activeBooking) return;
    
    try {
      setActionLoading(true);
      const result = await checkOutBooking(activeBooking.id, notes);
      
      let message = 'Successfully checked out!';
      if (result.overtime_charge && parseFloat(result.overtime_charge) > 0) {
        message += ` Overtime charge: $${result.overtime_charge}`;
      }
      
      showToast(message, 'success');
      setNotes('');
      setShowNotesInput(false);
      
      // Refresh active booking data
      await fetchActiveBooking();
    } catch (error) {
      console.error('Check-out error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to check out';
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
        <div className="flex gap-4">
          {activeBooking.status === 'confirmed' && (
            <button
              onClick={() => initiateAction('checkin')}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Check In
            </button>
          )}
          
          {activeBooking.status === 'checked_in' && (
            <button
              onClick={() => initiateAction('checkout')}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Check Out
            </button>
          )}
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
            {actionType === 'checkin' ? 'Check-in' : 'Check-out'} Notes (Optional)
          </h5>
          
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
                  Processing...
                </span>
              ) : (
                `Confirm ${actionType === 'checkin' ? 'Check-in' : 'Check-out'}`
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