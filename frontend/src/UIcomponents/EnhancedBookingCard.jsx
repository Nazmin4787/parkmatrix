import React, { useState } from 'react';
import { checkInBooking, checkOutBooking } from '../services/bookingslot';
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
      await checkInBooking(booking.id, '');
      showToast('Successfully checked in!', 'success');
      if (onStatusChange) onStatusChange();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to check in';
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      const result = await checkOutBooking(booking.id, '');
      
      let message = 'Successfully checked out!';
      if (result.overtime_charge && parseFloat(result.overtime_charge) > 0) {
        message += ` Overtime charge: $${result.overtime_charge}`;
      }
      
      showToast(message, 'success');
      if (onStatusChange) onStatusChange();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to check out';
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusInfo = () => {
    const status = booking.status || (booking.is_active ? 'confirmed' : 'completed');
    
    // For confirmed bookings, check if within check-in window
    if (status === 'confirmed') {
      const now = new Date();
      const startTime = new Date(booking.start_time);
      const endTime = new Date(booking.end_time);
      
      // Check-in window: 30 minutes before start time to 2 hours after end time
      const checkInWindowStart = new Date(startTime);
      checkInWindowStart.setMinutes(checkInWindowStart.getMinutes() - 30);
      
      const checkInWindowEnd = new Date(endTime);
      checkInWindowEnd.setHours(checkInWindowEnd.getHours() + 2);
      
      if (now < checkInWindowStart) {
        return { text: 'Check-in Not Open Yet', class: 'status-pending', color: '#9CA3AF' };
      } else if (now > checkInWindowEnd) {
        return { text: 'Check-in Window Closed', class: 'status-expired', color: '#F59E0B' };
      } else {
        return { text: 'Ready for Check-in', class: 'status-ready', color: '#3B82F6' };
      }
    }
    
    switch (status) {
      case 'checked_in':
        return { text: 'Checked In', class: 'status-checked-in', color: '#10B981' };
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
    
    // Only allow check-in if within the time window
    if (status === 'confirmed' && booking.is_active) {
      const now = new Date();
      const startTime = new Date(booking.start_time);
      const endTime = new Date(booking.end_time);
      
      // Check-in window: 30 minutes before start time to 2 hours after end time
      const checkInWindowStart = new Date(startTime);
      checkInWindowStart.setMinutes(checkInWindowStart.getMinutes() - 30);
      
      const checkInWindowEnd = new Date(endTime);
      checkInWindowEnd.setHours(checkInWindowEnd.getHours() + 2);
      
      return now >= checkInWindowStart && now <= checkInWindowEnd;
    }
    
    return false;
  };

  const canCheckOut = () => {
    const status = booking.status;
    return status === 'checked_in';
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
              {actionLoading ? 'Checking In...' : 'Check In'}
            </button>
          )}
          
          {canCheckOut() && (
            <button 
              className="btn-checkout"
              onClick={handleCheckOut}
              disabled={actionLoading}
            >
              {actionLoading ? 'Checking Out...' : 'Check Out'}
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