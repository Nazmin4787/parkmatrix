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
  const [overstayPaid, setOverstayPaid] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

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

  const handlePayOverstay = async () => {
    try {
      setPaymentLoading(true);
      showToast('Processing overstay payment...', 'info');
      
      // Simulate payment processing (you can integrate real payment gateway here)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setOverstayPaid(true);
      showToast('✅ Overstay fee paid successfully! You can now proceed with checkout.', 'success');
      
      // Optional: You can make an API call here to record the payment
      // const token = localStorage.getItem('accessToken');
      // await fetch('http://localhost:8000/api/bookings/pay-overstay/', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({ booking_id: booking.id })
      // });
      
    } catch (error) {
      showToast('❌ Payment failed. Please try again.', 'error');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCheckOut = async () => {
    // Check if overstay exists and is not paid (only for checkout_verified status)
    const overstayInfo = calculateOverstay();
    if (booking.status === 'checkout_verified' && overstayInfo && overstayInfo.has_overstay && !overstayPaid) {
      showToast('⚠️ Payment Required: Please pay the overstay fee of $' + overstayInfo.overstay_amount.toFixed(2) + ' to complete checkout successfully.', 'error');
      return;
    }
    
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

  const calculateOverstay = () => {
    if (!booking || !booking.end_time) return null;
    
    const status = booking.status || (booking.is_active ? 'confirmed' : 'completed');
    
    // Calculate overstay for checked-in, checkout_requested, and checkout_verified statuses
    if (status !== 'checked_in' && status !== 'checkout_requested' && status !== 'checkout_verified') {
      return null;
    }
    
    const endTime = new Date(booking.end_time);
    const now = new Date();
    
    // Check if current time exceeds booking end time
    if (now > endTime) {
      const overstayMs = now - endTime;
      const overstayMinutes = Math.floor(overstayMs / (1000 * 60));
      const overstayHours = (overstayMinutes / 60).toFixed(2);
      
      // Calculate overstay amount (assuming hourly rate from slot's parking lot)
      // For now, use a default rate if not available
      const hourlyRate = booking.slot?.parking_lot?.hourly_rate || 10;
      const overstayAmount = (overstayMinutes / 60) * hourlyRate;
      
      return {
        has_overstay: true,
        overstay_minutes: overstayMinutes,
        overstay_hours: parseFloat(overstayHours),
        overstay_amount: overstayAmount
      };
    }
    
    return null;
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    return new Date(dateTimeString).toLocaleString();
  };

  const statusInfo = getStatusInfo();
  const overstayInfo = calculateOverstay();

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

          {/* Overstay Fee Display */}
          {overstayInfo && overstayInfo.has_overstay && (
            <div className="detail-item" style={{ 
              background: overstayPaid 
                ? 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)' 
                : 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
              padding: '0.75rem',
              borderRadius: '8px',
              border: overstayPaid ? '2px solid #10B981' : '2px solid #F59E0B',
              gridColumn: '1 / -1'
            }}>
              <span className="detail-label" style={{ color: overstayPaid ? '#065F46' : '#92400E' }}>
                Overstay Fee {overstayPaid 
                  ? <span style={{ fontWeight: 'bold', color: '#10B981' }}>✅ (Paid)</span>
                  : <span style={{ fontWeight: 'bold', color: '#F59E0B' }}>(Pending)</span>
                }
              </span>
              <span className="detail-value font-semibold" style={{ 
                color: overstayPaid ? '#10B981' : '#DC2626', 
                fontSize: '1.1rem',
                textDecoration: overstayPaid ? 'line-through' : 'none'
              }}>
                ${overstayInfo.overstay_amount.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Overstay Warning Banner - Checked In (before checkout verification) */}
      {overstayInfo && overstayInfo.has_overstay && booking.status === 'checked_in' && (
        <div style={{
          background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
          padding: '1rem',
          margin: '1rem',
          borderRadius: '8px',
          border: '2px solid #F59E0B',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', color: '#92400E', marginBottom: '0.25rem' }}>
              Overstay Detected
            </div>
            <div style={{ fontSize: '0.9rem', color: '#78350F' }}>
              You have exceeded your booking time by <strong>{overstayInfo.overstay_hours} hours</strong> ({overstayInfo.overstay_minutes} minutes). 
              Please request checkout to proceed.
            </div>
          </div>
        </div>
      )}

      {/* Overstay Warning Banner with Pay Button - After Checkout Verification */}
      {overstayInfo && overstayInfo.has_overstay && !overstayPaid && booking.status === 'checkout_verified' && (
        <div style={{
          background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
          padding: '1rem',
          margin: '1rem',
          borderRadius: '8px',
          border: '2px solid #F59E0B'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', color: '#92400E', marginBottom: '0.25rem' }}>
                Overstay Detected - Payment Required
              </div>
              <div style={{ fontSize: '0.9rem', color: '#78350F' }}>
                You have exceeded your booking time by <strong>{overstayInfo.overstay_hours} hours</strong> ({overstayInfo.overstay_minutes} minutes). 
                Please pay the overstay fee to complete checkout.
              </div>
            </div>
          </div>
          <button 
            onClick={handlePayOverstay}
            disabled={paymentLoading}
            style={{
              width: '100%',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: paymentLoading ? 'not-allowed' : 'pointer',
              opacity: paymentLoading ? 0.7 : 1,
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              if (!paymentLoading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
          >
            {paymentLoading ? '⏳ Processing Payment...' : `💳 Pay Overstay Fee ($${overstayInfo.overstay_amount.toFixed(2)})`}
          </button>
        </div>
      )}

      {/* Payment Success Banner */}
      {overstayInfo && overstayInfo.has_overstay && overstayPaid && booking.status === 'checkout_verified' && (
        <div style={{
          background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
          padding: '1rem',
          margin: '1rem',
          borderRadius: '8px',
          border: '2px solid #10B981',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>✅</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', color: '#065F46', marginBottom: '0.25rem' }}>
              Overstay Payment Completed
            </div>
            <div style={{ fontSize: '0.9rem', color: '#047857' }}>
              Your overstay fee of <strong>${overstayInfo.overstay_amount.toFixed(2)}</strong> has been paid successfully. 
              You can now proceed with checkout.
            </div>
          </div>
        </div>
      )}
      
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
            <>
              <button 
                className="btn-checkout"
                onClick={handleCheckOut}
                disabled={actionLoading || (overstayInfo && overstayInfo.has_overstay && !overstayPaid)}
                style={{
                  opacity: (overstayInfo && overstayInfo.has_overstay && !overstayPaid) ? 0.5 : 1,
                  cursor: (overstayInfo && overstayInfo.has_overstay && !overstayPaid) ? 'not-allowed' : 'pointer'
                }}
                title={overstayInfo && overstayInfo.has_overstay && !overstayPaid ? 'Please pay the overstay fee first' : ''}
              >
                {actionLoading ? 'Completing Checkout...' : '✅ Confirm Checkout'}
              </button>
              
              {/* Warning message when payment is pending */}
              {overstayInfo && overstayInfo.has_overstay && !overstayPaid && (
                <div style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: '#FEE2E2',
                  border: '1px solid #EF4444',
                  borderRadius: '6px',
                  color: '#991B1B',
                  fontSize: '0.875rem',
                  textAlign: 'center',
                  marginTop: '0.5rem'
                }}>
                  ⚠️ Pay overstay fee to enable checkout
                </div>
              )}
            </>
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