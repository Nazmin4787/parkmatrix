import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getActiveBooking } from '../../services/bookingslot';

const ActiveBooking = () => {
  const [activeBooking, setActiveBooking] = useState(null);
  const [loading, setLoading] = useState(true);

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
      // Don't show error for 404 (no active booking)
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    return new Date(dateTimeString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'checked_in': return 'bg-green-100 text-green-800 border-green-200';
      case 'checked_out': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'expired': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTimeRemaining = () => {
    if (!activeBooking?.end_time) return null;
    
    const now = new Date();
    const endTime = new Date(activeBooking.end_time);
    const timeDiff = endTime - now;
    
    if (timeDiff <= 0) return 'Expired';
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!activeBooking) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h4 className="font-medium text-gray-800 mb-2">Active Booking</h4>
        <p className="text-sm text-gray-500">No active booking</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-lg shadow-sm border p-4"
    >
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-medium text-gray-800">Active Booking</h4>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(activeBooking.status)}`}>
          {activeBooking.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Slot:</span>
          <span className="font-medium">{activeBooking.slot?.slot_number || 'N/A'}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Vehicle:</span>
          <span className="font-medium">{activeBooking.vehicle?.number_plate || 'N/A'}</span>
        </div>
        
        {activeBooking.status === 'confirmed' && (
          <div className="flex justify-between">
            <span className="text-gray-600">Time:</span>
            <span className="font-medium text-orange-600">{getTimeRemaining()}</span>
          </div>
        )}
        
        {activeBooking.status === 'checked_in' && (
          <div className="flex justify-between">
            <span className="text-gray-600">Checked in:</span>
            <span className="font-medium text-green-600">
              {formatDateTime(activeBooking.checked_in_at)}
            </span>
          </div>
        )}
        
        {activeBooking.status === 'checked_out' && activeBooking.overtime_minutes > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Overtime:</span>
            <span className="font-medium text-red-600">
              {activeBooking.overtime_minutes}m (+${activeBooking.overtime_amount})
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ActiveBooking;