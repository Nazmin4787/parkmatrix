import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MyParking.css';

export default function MyParking() {
  const [currentBooking, setCurrentBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInError, setCheckInError] = useState('');
  const [checkInSuccess, setCheckInSuccess] = useState('');

  useEffect(() => {
    loadCurrentBooking();
  }, []);

  async function loadCurrentBooking() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get('http://localhost:8000/api/bookings/active/', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.id) {
        setCurrentBooking(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No active booking found');
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckInNow() {
    setCheckInLoading(true);
    setCheckInError('');
    setCheckInSuccess('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        'http://localhost:8000/api/customer/checkin/',
        { booking_id: currentBooking.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCheckInSuccess('✅ Check-in successful! Your secret code has been generated.');
      setCurrentBooking(response.data.booking);
    } catch (err) {
      setCheckInError(err.response?.data?.error || 'Failed to check in');
    } finally {
      setCheckInLoading(false);
    }
  }

  async function handleRequestCheckout() {
    setCheckInLoading(true);
    setCheckInError('');
    setCheckInSuccess('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        'http://localhost:8000/api/customer/checkout/request/',
        { booking_id: currentBooking.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCheckInSuccess('✅ Checkout requested! Please proceed to exit gate with your secret code.');
      setCurrentBooking(response.data.booking);
    } catch (err) {
      setCheckInError(err.response?.data?.error || 'Failed to request checkout');
    } finally {
      setCheckInLoading(false);
    }
  }

  async function handleConfirmCheckout() {
    setCheckInLoading(true);
    setCheckInError('');
    setCheckInSuccess('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        'http://localhost:8000/api/customer/checkout/confirm/',
        { booking_id: currentBooking.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCheckInSuccess('✅ Checkout complete! Thank you for parking with us.');
      // Reload booking or navigate away
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setCheckInError(err.response?.data?.error || 'Failed to complete checkout');
    } finally {
      setCheckInLoading(false);
    }
  }

  function formatDateTime(datetime) {
    if (!datetime) return '-';
    return new Date(datetime).toLocaleString();
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    alert('Secret code copied to clipboard!');
  }

  if (loading) {
    return (
      <div className="my-parking-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-parking-page">
        <div className="no-booking">
          <div className="no-booking-icon">🅿️</div>
          <h2>No Active Parking</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-parking-page">
      <div className="my-parking-container">
        <div className="page-header">
          <h1>My Current Parking</h1>
          <span className={`status-badge status-${currentBooking.status}`}>
            {currentBooking.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {/* Check-In Button for Verified Bookings */}
        {currentBooking.status === 'verified' && (
          <div className="checkin-prompt">
            <div className="checkin-prompt-header">
              <h3>✅ Your booking has been verified at the gate!</h3>
              <p>Tap the button below to complete check-in and receive your secret code.</p>
            </div>
            
            {checkInError && (
              <div className="alert alert-error">{checkInError}</div>
            )}
            
            {checkInSuccess && (
              <div className="alert alert-success">{checkInSuccess}</div>
            )}

            <button 
              className="btn-checkin-now"
              onClick={handleCheckInNow}
              disabled={checkInLoading}
            >
              {checkInLoading ? '⏳ Checking In...' : '🎫 Check In Now'}
            </button>
          </div>
        )}

        {/* Secret Code Display */}
        {currentBooking.secret_code && currentBooking.status === 'checked_in' && (
          <div className="secret-code-section">
            <div className="secret-code-header">
              <h3>🔐 Your Secret Code</h3>
              <p>You will need this code for checkout</p>
            </div>
            <div className="secret-code-display">
              <div className="code-value">
                {currentBooking.secret_code}
              </div>
              <button 
                className="copy-btn"
                onClick={() => copyToClipboard(currentBooking.secret_code)}
              >
                📋 Copy Code
              </button>
            </div>
            <div className="code-warning">
              ⚠️ Keep this code safe. You'll need it to checkout your vehicle.
            </div>
          </div>
        )}

        {/* Booking Details */}
        <div className="booking-info-card">
          <h3>Booking Details</h3>
          
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Booking ID</span>
              <span className="info-value">#{currentBooking.id}</span>
            </div>

            <div className="info-item">
              <span className="info-label">Vehicle</span>
              <span className="info-value">
                {currentBooking.vehicle?.number_plate || 'N/A'}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">Parking Slot</span>
              <span className="info-value">
                {currentBooking.slot?.slot_number || 'N/A'}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">Location</span>
              <span className="info-value">
                {currentBooking.parking_zone_display || 'N/A'}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">Booked Time</span>
              <span className="info-value">
                {formatDateTime(currentBooking.start_time)}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">Until</span>
              <span className="info-value">
                {formatDateTime(currentBooking.end_time)}
              </span>
            </div>

            {currentBooking.checked_in_at && (
              <div className="info-item">
                <span className="info-label">Checked In At</span>
                <span className="info-value">
                  {formatDateTime(currentBooking.checked_in_at)}
                </span>
              </div>
            )}

            <div className="info-item">
              <span className="info-label">Total Price</span>
              <span className="info-value price">
                ₹{currentBooking.total_price || '0.00'}
              </span>
            </div>
          </div>
        </div>

        {/* Checkout Actions for Checked-In Bookings */}
        {currentBooking.status === 'checked_in' && (
          <div className="checkin-prompt" style={{background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'}}>
            <div className="checkin-prompt-header">
              <h3>� Ready to Leave?</h3>
              <p>Request checkout to initiate the exit process</p>
            </div>
            
            {checkInError && (
              <div className="alert alert-error">{checkInError}</div>
            )}
            
            {checkInSuccess && (
              <div className="alert alert-success">{checkInSuccess}</div>
            )}

            <button 
              className="btn-checkin-now"
              onClick={handleRequestCheckout}
              disabled={checkInLoading}
            >
              {checkInLoading ? '⏳ Processing...' : '🚪 Request Checkout'}
            </button>
          </div>
        )}

        {/* Checkout Verification Status */}
        {currentBooking.status === 'checkout_requested' && (
          <div className="checkin-prompt" style={{background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'}}>
            <div className="checkin-prompt-header">
              <h3>⏳ Checkout Pending Verification</h3>
              <p>Please proceed to the exit gate and show your secret code to security</p>
            </div>
            
            <div className="alert alert-info" style={{background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)'}}>
              <strong>Your Secret Code:</strong> {currentBooking.secret_code}
            </div>
          </div>
        )}

        {/* Final Checkout Confirmation */}
        {currentBooking.status === 'checkout_verified' && (
          <div className="checkin-prompt" style={{background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'}}>
            <div className="checkin-prompt-header">
              <h3>✅ Checkout Verified!</h3>
              <p>Your exit has been approved. Tap below to complete checkout</p>
            </div>
            
            {checkInError && (
              <div className="alert alert-error">{checkInError}</div>
            )}
            
            {checkInSuccess && (
              <div className="alert alert-success">{checkInSuccess}</div>
            )}

            <button 
              className="btn-checkin-now"
              onClick={handleConfirmCheckout}
              disabled={checkInLoading}
            >
              {checkInLoading ? '⏳ Completing...' : '✅ Confirm Checkout'}
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="instructions-card">
          <h4>📝 {currentBooking.status === 'checked_in' ? 'Checkout' : currentBooking.status === 'verified' ? 'Check-In' : 'Parking'} Instructions</h4>
          {currentBooking.status === 'checked_in' && (
            <ol>
              <li>Tap "Request Checkout" when ready to leave</li>
              <li>Drive to exit gate</li>
              <li>Show secret code ({currentBooking.secret_code}) to security</li>
              <li>After verification, confirm checkout in app</li>
            </ol>
          )}
          {currentBooking.status === 'verified' && (
            <ol>
              <li>Find your assigned parking slot</li>
              <li>Tap "Check In Now" button above</li>
              <li>Receive your secret code</li>
              <li>Keep the code safe for checkout</li>
            </ol>
          )}
          {(currentBooking.status === 'checkout_requested' || currentBooking.status === 'checkout_verified') && (
            <ol>
              <li>Proceed to exit gate</li>
              <li>Show secret code to security</li>
              <li>Wait for verification</li>
              <li>Confirm final checkout in app</li>
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
