import React, { useState } from 'react';
import { checkInBooking, checkOutBooking } from '../services/bookingslot';
import { getUserLocation, formatDistance } from '../services/geolocation';
import Toast from './Toast';
import '../stylesheets/booking-card.css';

// Enhanced BookingCard with check-in/check-out functionality
export default function EnhancedBookingCard({ 
  booking, 
  onViewTicket, 
  onCancel, 
  onStatusChange,
  showActions = true 
}) {
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 5000);
  };

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      
      // NEW WORKFLOW: If booking is verified, use customer self check-in endpoint
      if (booking.status === 'verified') {
        showToast('Completing check-in...', 'info');
        
        // Call new customer check-in endpoint (no location needed)
        const token = localStorage.getItem('accessToken');
        const response = await fetch('http://localhost:8000/api/customer/checkin/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ booking_id: booking.id })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to check in');
        }
        
        showToast(`✅ Check-in successful! Your secret code: ${data.secret_code}`, 'success');
        if (onStatusChange) onStatusChange();
        return;
      }
      
      // OLD WORKFLOW: Location-based check-in for confirmed bookings
      showToast('Getting your location...', 'info');
      
      // Get user's GPS location
      const location = await getUserLocation();
      
      showToast('Verifying location...', 'info');
      
      // Call API with location data
      await checkInBooking(booking.id, '', location);
      
      showToast('✅ Successfully checked in!', 'success');
      if (onStatusChange) onStatusChange();
    } catch (error) {
      console.error('Check-in error:', error);
      
      // Handle location errors
      if (error.message && error.message.includes('location')) {
        showToast(`❌ ${error.message}`, 'error');
        return;
      }
      
      // Handle API errors
      const errorData = error.response?.data;
      let errorMessage = errorData?.error || errorData?.message || error.message || 'Failed to check in';
      
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
    try {
      setActionLoading(true);
      
      // NEW WORKFLOW: If booking is checkout_verified, use customer final checkout endpoint
      if (booking.status === 'checkout_verified') {
        showToast('Completing checkout...', 'info');
        
        const token = localStorage.getItem('accessToken');
        const response = await fetch(
          'http://localhost:8000/api/customer/checkout/confirm/',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              booking_id: booking.id
            })
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to complete checkout');
        }

        let message = '✅ Checkout complete! Thank you for parking with us.';
        if (result.booking?.overtime_charge && parseFloat(result.booking.overtime_charge) > 0) {
          message += `\n\n⏱️ Overtime charge: $${result.booking.overtime_charge}`;
        }

        showToast(message, 'success');
        if (onStatusChange) onStatusChange();
        return;
      }
      
      // OLD WORKFLOW: Direct checkout (fallback for old bookings)
      // Show loading message
      showToast('Getting your location...', 'info');
      
      // Get user's GPS location
      const location = await getUserLocation();
      
      showToast('Verifying location...', 'info');
      
      // Call API with location data
      const result = await checkOutBooking(booking.id, '', location);
      
      let message = '✅ Successfully checked out!';
      if (result.overtime_charge && parseFloat(result.overtime_charge) > 0) {
        message += `\n\n⏱️ Overtime charge: $${result.overtime_charge}`;
      }
      
      showToast(message, 'success');
      if (onStatusChange) onStatusChange();
    } catch (error) {
      console.error('Check-out error:', error);
      
      // Handle location errors
      if (error.message && error.message.includes('location')) {
        showToast(`❌ ${error.message}`, 'error');
        return;
      }
      
      // Handle API errors
      const errorData = error.response?.data;
      let errorMessage = errorData?.error || errorData?.message || error.message || 'Failed to check out';
      
      // If location verification failed (403)
      if (error.response?.status === 403 && errorData?.distance_meters) {
        errorMessage = `❌ ${errorData.message}\n\nYou are ${formatDistance(errorData.distance_meters)} away from the parking area.`;
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusInfo = () => {
    const status = booking.status || (booking.is_active ? 'confirmed' : 'completed');
    
    // For confirmed bookings - waiting for gate verification by admin
    if (status === 'confirmed') {
      return { text: '🚗 Arrive at Gate for Verification', class: 'status-pending', color: '#F59E0B' };
    }
    
    switch (status) {
      case 'verified':
        return { text: '✅ Verified - Ready to Check In', class: 'status-verified', color: '#8B5CF6' };
      case 'checked_in':
        return { text: 'Checked In', class: 'status-checked-in', color: '#10B981' };
      case 'checkout_requested':
        return { text: '🚪 Checkout Requested', class: 'status-checkout-requested', color: '#F59E0B' };
      case 'checkout_verified':
        return { text: '✅ Checkout Verified', class: 'status-checkout-verified', color: '#8B5CF6' };
      case 'checked_out':
        return { text: 'Checked Out', class: 'status-checked-out', color: '#6B7280' };
      case 'cancelled':
        return { text: 'Cancelled', class: 'status-cancelled', color: '#EF4444' };
      case 'expired':
        return { text: 'Expired', class: 'status-expired', color: '#F59E0B' };
      default:
        return { text: booking.is_active ? 'Active' : 'Completed', class: booking.is_active ? 'status-active' : 'status-completed', color: '#6B7280' };
    }
  };

  const canCheckIn = () => {
    const status = booking.status || 'confirmed';
    
    // NEW WORKFLOW: Only allow check-in for verified bookings (verified at gate by admin)
    // Customer CANNOT check in until admin has verified at the gate
    if (status === 'verified' && booking.is_active) {
      return true;
    }
    
    // Confirmed bookings must be verified at gate first
    return false;
  };

  const canCheckOut = () => {
    const status = booking.status;
    // NEW WORKFLOW: Only allow final checkout after admin verification at exit gate
    // Customer CANNOT checkout until admin has verified at the exit gate
    return status === 'checkout_verified';
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    return new Date(dateTimeString).toLocaleString();
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="booking-card enhanced">
      <div className="booking-header">
        <div className="booking-id">
          <h3>Booking #{booking.id}</h3>
          <div className="booking-meta">
            <span className="booking-date">
              {new Date(booking.start_time).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="booking-status">
          <span 
            className={`status-badge ${statusInfo.class}`}
            style={{ backgroundColor: statusInfo.color }}
          >
            {statusInfo.text}
          </span>
        </div>
      </div>
      
      <div className="booking-details">
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Slot</span>
            <span className="detail-value">
              {booking.slot?.slot_number || booking.slot_number || booking.slot || 'N/A'}
            </span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Parking Location</span>
            <span className="detail-value">
              {booking.slot?.parking_zone_display || booking.parking_zone_display || 'N/A'}
            </span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Vehicle</span>
            <span className="detail-value">
              {booking.vehicle?.number_plate || 'N/A'}
            </span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Start Time</span>
            <span className="detail-value">
              {formatDateTime(booking.start_time)}
            </span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">End Time</span>
            <span className="detail-value">
              {formatDateTime(booking.end_time)}
            </span>
          </div>

          {booking.checked_in_at && (
            <div className="detail-item">
              <span className="detail-label">Checked In</span>
              <span className="detail-value">
                {formatDateTime(booking.checked_in_at)}
              </span>
            </div>
          )}

          {booking.checked_out_at && (
            <div className="detail-item">
              <span className="detail-label">Checked Out</span>
              <span className="detail-value">
                {formatDateTime(booking.checked_out_at)}
              </span>
            </div>
          )}

          {booking.overtime_minutes > 0 && (
            <div className="detail-item">
              <span className="detail-label">Overtime</span>
              <span className="detail-value text-red-600">
                {booking.overtime_minutes}m (+${booking.overtime_amount})
              </span>
            </div>
          )}

          {booking.total_price && (
            <div className="detail-item">
              <span className="detail-label">Amount</span>
              <span className="detail-value font-semibold">
                ${booking.total_price}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {showActions && (
        <div className="booking-actions">
          {/* Check-in/Check-out actions */}
          {canCheckIn() && (
            <button 
              className="btn-checkin"
              onClick={handleCheckIn}
              disabled={actionLoading}
            >
              {actionLoading ? 'Checking In...' : (booking.status === 'verified' ? '🎫 Check In Now' : 'Check In')}
            </button>
          )}
          
          {canCheckOut() && (
            <button 
              className="btn-checkout"
              onClick={handleCheckOut}
              disabled={actionLoading}
            >
              {actionLoading ? 'Completing Checkout...' : '✅ Confirm Checkout'}
            </button>
          )}
          
          {/* Standard actions */}
          {onViewTicket && (
            <button 
              className="btn-secondary" 
              onClick={() => onViewTicket(booking)}
            >
              View Ticket
            </button>
          )}
          
          {booking.is_active && onCancel && booking.status !== 'checked_in' && (
            <button 
              className="btn-cancel"
              onClick={() => onCancel(booking.id)}
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: '' })}
        />
      )}
    </div>
  );
}