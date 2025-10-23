import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CheckIn.css';

export default function CheckIn() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Search, 2: Verify
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Step 1: Search data
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Step 2: Verification result
  const [verifiedBooking, setVerifiedBooking] = useState(null);
  
  // NEW: State for displaying confirmed bookings waiting for verification
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // NEW: Fetch pending bookings on mount
  useEffect(() => {
    fetchPendingBookings();
  }, []);

  async function fetchPendingBookings() {
    try {
      const token = localStorage.getItem('accessToken');
      
      console.log('Fetching pending check-in bookings...');
      
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
      
      // Filter to only show confirmed bookings (waiting for gate verification)
      const confirmedBookings = (response.data || []).filter(
        booking => booking.status === 'confirmed'
      );
      
      console.log('Confirmed bookings:', confirmedBookings);
      setPendingBookings(confirmedBookings);
    } catch (err) {
      console.error('Failed to fetch pending bookings:', err);
      console.error('Error response:', err.response?.data);
    } finally {
      setLoadingBookings(false);
    }
  }

  // NEW: Quick select booking from list
  function handleQuickSelect(booking, e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('Quick selecting booking:', booking);
    setVehiclePlate(booking.vehicle?.number_plate || '');
    
    // Small delay to ensure state updates, then scroll
    setTimeout(() => {
      const form = document.querySelector('.checkin-form');
      if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Focus on the search button or input
        const searchBtn = document.querySelector('button[type="button"]');
        if (searchBtn && searchBtn.textContent.includes('Search')) {
          // Auto-click search after selecting
          handleSearchBooking();
        }
      }
    }, 100);
  }

  async function handleSearchBooking() {
    if (!vehiclePlate.trim()) {
      setError('Please enter vehicle plate number');
      return;
    }

    setLoading(true);
    setError('');
    setSearchResults([]);

    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        setError('You are not logged in. Please sign in as admin.');
        navigate('/signin');
        return;
      }

      const response = await axios.get(
        `http://localhost:8000/api/admin/checkin/find/?vehicle_plate=${vehiclePlate}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.bookings && response.data.bookings.length > 0) {
        setSearchResults(response.data.bookings);
        setStep(2);
      } else {
        setError(response.data.message || 'No pre-booked slot found for this vehicle');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expired. Please sign in again.');
        setTimeout(() => navigate('/signin'), 2000);
      } else {
        setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to search booking');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmCheckIn(booking) {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        setError('You are not logged in. Please sign in as admin.');
        navigate('/signin');
        return;
      }

      const response = await axios.post(
        'http://localhost:8000/api/admin/checkin/',
        {
          booking_id: booking.id,
          vehicle_plate: booking.vehicle.number_plate,
          notes: 'Verified at gate'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setVerifiedBooking(response.data.booking);
      setStep(2);
      setSuccess('✅ Booking verified! Gate opened. Customer can now enter and check in from their app.');
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expired. Please sign in again.');
        setTimeout(() => navigate('/signin'), 2000);
      } else {
        setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to verify booking');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setStep(1);
    setVehiclePlate('');
    setSearchResults([]);
    setVerifiedBooking(null);
    setError('');
    setSuccess('');
    fetchPendingBookings(); // Refresh the pending bookings list
  }

  function formatDateTime(datetime) {
    if (!datetime) return '-';
    return new Date(datetime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <div className="checkin-page">
      {/* NEW: Display pending bookings for quick reference */}
      {step === 1 && (
        <div className="pending-bookings-section">
          <h2>📋 Bookings Waiting for Gate Verification</h2>
          <p className="section-subtitle">Select a vehicle to verify their booking at the entrance gate</p>
          
          {loadingBookings ? (
            <div className="loading-state">Loading pending bookings...</div>
          ) : pendingBookings.length === 0 ? (
            <div className="empty-state">
              <p>No bookings waiting for verification at the moment</p>
            </div>
          ) : (
            <div className="bookings-grid">
              {pendingBookings.map((booking) => (
                <div 
                  key={booking.id} 
                  className="booking-quick-card"
                  onClick={(e) => handleQuickSelect(booking, e)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card-header">
                    <span className="booking-id">#{booking.id}</span>
                    <span className="status-badge pending">
                      ⏳ Awaiting Verification
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
                      <span className="label">👤 Customer:</span>
                      <span className="value">{booking.user_name || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">🕐 Start Time:</span>
                      <span className="value">{formatDateTime(booking.start_time)}</span>
                    </div>
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

      <div className="checkin-container">
        <div className="checkin-header">
          <h1>🚪 Gate Verification</h1>
          <p className="subtitle">Verify bookings at entrance gate - Customer will check in from their app</p>
        </div>

        {/* Step Indicator */}
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <span>Search Vehicle</span>
          </div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <span>Verify & Open Gate</span>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            ✓ {success}
          </div>
        )}

        {/* Step 1: Search Vehicle */}
        {step === 1 && (
          <div className="checkin-form">
            <div className="form-group">
              <label>Vehicle Plate Number *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., KA01AB1234"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchBooking()}
              />
              <small className="form-text">
                Enter the vehicle number to find pre-booked slot
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
                onClick={handleSearchBooking}
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search Booking'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Confirm Booking */}
        {step === 2 && (
          <div className="booking-results">
            <h3>Found {searchResults.length} Booking(s)</h3>
            {searchResults.map((booking) => (
              <div key={booking.id} className="booking-card">
                <div className="booking-header">
                  <div>
                    <h4>Booking #{booking.id}</h4>
                    <span className={`badge badge-${booking.status}`}>
                      {booking.status}
                    </span>
                  </div>
                </div>

                <div className="booking-details">
                  <div className="detail-row">
                    <span className="label">Customer:</span>
                    <span className="value">{booking.user.username}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Vehicle:</span>
                    <span className="value">
                      {booking.vehicle.number_plate} ({booking.vehicle.vehicle_type})
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Parking Slot:</span>
                    <span className="value">
                      {booking.slot.slot_number} - {booking.parking_zone_display}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Booked Time:</span>
                    <span className="value">
                      {formatDateTime(booking.start_time)} to {formatDateTime(booking.end_time)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Price:</span>
                    <span className="value">₹{booking.total_price}</span>
                  </div>
                </div>

                <div className="booking-actions">
                  <button
                    className="btn btn-success"
                    onClick={() => handleConfirmCheckIn(booking)}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : '✅ Verify & Open Gate'}
                  </button>
                </div>
              </div>
            ))}

            <div className="form-actions">
              <button className="btn btn-secondary" onClick={handleReset}>
                Search Again
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Verification Success */}
        {step === 2 && verifiedBooking && (
          <div className="checkin-success">
            <div className="success-icon">✅</div>
            <h2>Booking Verified!</h2>
            <p className="success-message">Gate has been opened. Customer may enter.</p>

            <div className="info-box">
              <h3>📋 Verification Details</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="label">Slot Number:</span>
                  <span className="value">{verifiedBooking.slot?.slot_number}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Customer:</span>
                  <span className="value">{verifiedBooking.user?.username}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Vehicle:</span>
                  <span className="value">{verifiedBooking.vehicle?.number_plate}</span>
                </div>
              </div>
            </div>

            <div className="alert alert-info" style={{marginTop: '20px'}}>
              <strong>ℹ️ Next Step:</strong> Customer needs to open their app and tap "Check In Now" to complete check-in and receive their secret code.
            </div>

            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => navigate('/admin')}>
                Back to Dashboard
              </button>
              <button className="btn btn-primary" onClick={handleReset}>
                Verify Another Vehicle
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
