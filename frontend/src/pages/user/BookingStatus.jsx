import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getActiveBooking, getMyBookings } from '../../services/bookingslot';

const BookingStatus = () => {
  const [activeBooking, setActiveBooking] = useState(null);
  const [totalBookings, setTotalBookings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookingData();
  }, []);

  const fetchBookingData = async () => {
    try {
      setLoading(true);
      
      // Fetch active booking and total bookings in parallel
      const [activeBookingData, allBookingsData] = await Promise.all([
        getActiveBooking().catch(() => null), // Don't fail if no active booking
        getMyBookings().catch(() => [])
      ]);
      
      setActiveBooking(activeBookingData);
      setTotalBookings(Array.isArray(allBookingsData) ? allBookingsData.length : 0);
    } catch (error) {
      console.error('Error fetching booking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusMessage = () => {
    if (!activeBooking) {
      return {
        message: "No active booking",
        color: "text-gray-600",
        action: "Book a slot",
        link: "/slots"
      };
    }

    switch (activeBooking.status) {
      case 'confirmed':
        return {
          message: "Ready for check-in",
          color: "text-blue-600",
          action: "Check in now",
          link: "/checkin-checkout"
        };
      case 'checked_in':
        return {
          message: "Currently checked in",
          color: "text-green-600", 
          action: "Check out",
          link: "/checkin-checkout"
        };
      case 'checked_out':
        return {
          message: "Recently checked out",
          color: "text-gray-600",
          action: "View details",
          link: "/bookings"
        };
      default:
        return {
          message: activeBooking.status,
          color: "text-gray-600",
          action: "View bookings",
          link: "/bookings"
        };
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  const status = getStatusMessage();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border p-6"
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Parking Status</h3>
      
      <div className="space-y-4">
        {/* Active Booking Status */}
        <div>
          <p className="text-sm text-gray-600 mb-1">Current Status</p>
          <p className={`font-medium ${status.color}`}>{status.message}</p>
          {activeBooking && (
            <p className="text-sm text-gray-500 mt-1">
              Slot {activeBooking.slot?.slot_number} • {activeBooking.vehicle?.number_plate}
            </p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="flex items-center justify-between py-3 border-t border-gray-100">
          <div>
            <p className="text-sm text-gray-600">Total Bookings</p>
            <p className="text-2xl font-bold text-gray-800">{totalBookings}</p>
          </div>
          
          {activeBooking && activeBooking.status === 'checked_in' && (
            <div className="text-right">
              <p className="text-sm text-gray-600">Checked In</p>
              <p className="text-sm font-medium text-green-600">
                {new Date(activeBooking.checked_in_at).toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Link 
          to={status.link}
          className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          {status.action}
        </Link>
      </div>
    </motion.div>
  );
};

export default BookingStatus;