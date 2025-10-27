import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CheckOut.css';

export default function CheckOut() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [vehiclePlate, setVehiclePlate] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [overstayInfo, setOverstayInfo] = useState(null);
  const [showOverstayWarning, setShowOverstayWarning] = useState(false);
  
  // NEW: State for displaying checked-in bookings
  const [checkedInBookings, setCheckedInBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // NEW: Fetch checked-in bookings on mount
  useEffect(() => {
    fetchCheckedInBookings();
  }, []);

  async function fetchCheckedInBookings() {
    try {
      const token = localStorage.getItem('accessToken');
      
      console.log('Fetching checked-in bookings...');
      console.log('Token:', token ? 'Present' : 'Missing');
      
      if (!token) {
        console.error('No auth token found');
        setLoadingBookings(false);
        return;
      }

      const response = await axios.get(
        'http://localhost:8000/api/bookings/active-with-details/',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('API Response:', response.data);
      
      // Filter to only show checked_in and checkout_requested bookings
      const checkoutReadyBookings = (response.data || []).filter(
        booking => booking.status === 'checked_in' || booking.status === 'checkout_requested'
      );
      
      console.log('Filtered bookings:', checkoutReadyBookings);
      setCheckedInBookings(checkoutReadyBookings);
    } catch (err) {
      console.error('Failed to fetch checked-in bookings:', err);
      console.error('Error response:', err.response?.data);
    } finally {
      setLoadingBookings(false);
    }
  }

  // NEW: Quick select booking from list
  function handleQuickSelect(booking, e) {
    // Prevent event bubbling if clicking button
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('Quick selecting booking:', booking);
    setVehiclePlate(booking.vehicle?.number_plate || '');
    
    // Small delay to ensure state updates, then scroll
    setTimeout(() => {
      const form = document.querySelector('.checkout-form');
      if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Focus on secret code input
        const secretInput = document.querySelector('input[type="text"][placeholder*="6-digit"]');
        if (secretInput) {
          secretInput.focus();
        }
      }
    }, 100);
  }

  async function handleCheckOut() {
    if (!vehiclePlate.trim() || !secretCode.trim()) {
      setError('Please enter both vehicle plate and secret code');
      return;
    }

    if (secretCode.length !== 6) {
      setError('Secret code must be 6 digits');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setOverstayInfo(null);
    setShowOverstayWarning(false);

    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        setError('You are not logged in. Please sign in as admin.');
        navigate('/signin');
        return;
      }

      // First, check for overstay fee
      try {
        const overstayResponse = await axios.get(
          `http://localhost:8000/api/admin/checkout/overstay/?vehicle_plate=${vehiclePlate}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        const overstayData = overstayResponse.data.overstay_info;
        
        if (overstayData.has_overstay) {
          setOverstayInfo(overstayData);
          setShowOverstayWarning(true);
          setLoading(false);
          
          // Ask admin to confirm
          const confirmCheckout = window.confirm(
            `⚠️ OVERSTAY DETECTED!\n\n` +
            `Vehicle: ${vehiclePlate}\n` +
            `Overstay Time: ${overstayData.overstay_hours} hours (${overstayData.overstay_minutes} minutes)\n` +
            `Additional Fee: ₹${overstayData.overstay_amount.toFixed(2)}\n\n` +
            `Do you want to proceed with checkout verification?`
          );
          
          if (!confirmCheckout) {
            setLoading(false);
            return;
          }
        }
      } catch (overstayErr) {
        console.log('Could not fetch overstay info:', overstayErr);
        // Continue with checkout even if overstay check fails
      }

      // Proceed with checkout verification
      const response = await axios.post(
        'http://localhost:8000/api/admin/checkout/',
        {
          vehicle_plate: vehiclePlate,
          secret_code: secretCode
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setPaymentSummary(response.data.payment_summary);
      
      // Check if overstay info is in response
      if (response.data.overstay_info) {
        setOverstayInfo(response.data.overstay_info);
      }
      
      let successMessage = '✅ Check-out verified successfully!';
      if (response.data.overstay_warning) {
        successMessage += '\n\n' + response.data.overstay_warning;
      }
      
      setSuccess(successMessage);
      
      // Refresh bookings list
      fetchCheckedInBookings();
      
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expired. Please sign in again.');
        setTimeout(() => navigate('/signin'), 2000);
      } else {
        setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to check-out');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setVehiclePlate('');
    setSecretCode('');
    setPaymentSummary(null);
    setError('');
    setSuccess('');
    fetchCheckedInBookings(); // Refresh the list
  }

  function formatDateTime(dateTimeString) {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <div className="checkout-page">
      {/* NEW: Display checked-in bookings for quick reference */}
      {!paymentSummary && (
        <div className="active-bookings-section">
          <h2>🚗 Active Parking Sessions</h2>
          <p className="section-subtitle">Select a vehicle for quick checkout verification</p>
          
          {loadingBookings ? (
            <div className="loading-state">Loading active sessions...</div>
          ) : checkedInBookings.length === 0 ? (
            <div className="empty-state">
              <p>No active parking sessions at the moment</p>
            </div>
          ) : (
            <div className="bookings-grid">
              {checkedInBookings.map((booking) => (
                <div 
                  key={booking.id} 
                  className="booking-quick-card"
                  onClick={(e) => handleQuickSelect(booking, e)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card-header">
                    <span className="booking-id">#{booking.id}</span>
                    <span className={`status-badge ${booking.status === 'checkout_requested' ? 'requested' : 'active'}`}>
                      {booking.status === 'checkout_requested' ? '🚪 Checkout Requested' : '🅿️ Checked In'}
                    </span>
                  </div>
                  <div className="card-body">
                    <div className="info-row">
                      <span className="label">🚗 Vehicle:</span>
                      <span className="value">{booking.vehicle?.number_plate || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">📍 Slot:</span>
                      <span className="value">{booking.slot?.slot_number || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">⏰ Checked In:</span>
                      <span className="value">{formatDateTime(booking.checked_in_at)}</span>
                    </div>
                    {booking.status === 'checkout_requested' && (
                      <div className="info-row highlight">
                        <span className="label">🕒 Requested:</span>
                        <span className="value">{formatDateTime(booking.checkout_requested_at)}</span>
                      </div>
                    )}
                  </div>
                  <div className="card-footer">
                    <button 
                      className="quick-select-btn"
                      onClick={(e) => handleQuickSelect(booking, e)}
                      type="button"
                    >
                      Select for Verification →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="checkout-container">
        <div className="checkout-header">
          <h1>Vehicle Check-Out</h1>
          <p className="subtitle">Verify secret code and process checkout</p>
        </div>

        {error && (
          <div className="alert alert-error">
            ⚠️ {error}
          </div>
        )}

        {success && !paymentSummary && (
          <div className="alert alert-success">
            ✓ {success}
          </div>
        )}

        {overstayInfo && overstayInfo.has_overstay && (
          <div className="alert alert-warning overstay-alert">
            <h3>⚠️ Overstay Fee Detected</h3>
            <div className="overstay-details">
              <div className="overstay-row">
                <span className="label">Overstay Duration:</span>
                <span className="value">{overstayInfo.overstay_hours} hours ({overstayInfo.overstay_minutes} minutes)</span>
              </div>
              <div className="overstay-row highlight">
                <span className="label">Additional Fee:</span>
                <span className="value fee">₹{overstayInfo.overstay_amount.toFixed(2)}</span>
              </div>
            </div>
            <p className="overstay-note">
              💡 This amount will be added to the customer's total bill.
            </p>
          </div>
        )}

        {!paymentSummary ? (
          <div className="checkout-form">
            <div className="form-group">
              <label>Vehicle Plate Number *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., KA01AB1234"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
              />
            </div>

            <div className="form-group">
              <label>Secret Code *</label>
              <input
                type="text"
                className="form-control code-input"
                placeholder="Enter 6-digit code"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
              />
              <small className="form-text">
                Ask customer for the 6-digit code they received at check-in
              </small>
            </div>

            <div className="form-actions">
              <button
                className="btn btn-secondary"
                onClick={() => navigate('/admin')}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCheckOut}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Process Check-Out'}
              </button>
            </div>
          </div>
        ) : (
          <div className="checkout-success">
            <div className="success-icon">✓</div>
            <h2>Check-Out Successful!</h2>

            <div className="payment-card">
              <h3>💰 Payment Summary</h3>
              <div className="payment-details">
                <div className="payment-row">
                  <span>Base Charge:</span>
                  <span className="amount">{paymentSummary.base_charge}</span>
                </div>
                <div className="payment-row">
                  <span>Overtime Charge:</span>
                  <span className="amount">{paymentSummary.overtime_charge}</span>
                </div>
                {paymentSummary.overtime_minutes > 0 && (
                  <div className="payment-row overtime">
                    <span>Overtime Duration:</span>
                    <span>{paymentSummary.overtime_minutes} minutes</span>
                  </div>
                )}
                <div className="payment-row">
                  <span>Parking Duration:</span>
                  <span>{paymentSummary.duration}</span>
                </div>
                <div className="payment-row total">
                  <span>Total Amount:</span>
                  <span className="amount">{paymentSummary.total_charge}</span>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => navigate('/admin')}>
                Back to Dashboard
              </button>
              <button className="btn btn-primary" onClick={handleReset}>
                Check-Out Another Vehicle
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
