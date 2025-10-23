import React, { useState } from 'react';
import axios from 'axios';
import './CheckOutForm.css';

export default function CheckOutForm() {
  const [searchType, setSearchType] = useState('vehicle_plate'); // 'vehicle_plate' or 'booking_id'
  const [searchValue, setSearchValue] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [notes, setNotes] = useState('');
  
  const [booking, setBooking] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [paymentSummary, setPaymentSummary] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    setSearching(true);
    setError('');
    setSearchResults([]);
    setBooking(null);

    if (!searchValue.trim()) {
      setError('Please enter a search value');
      setSearching(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const params = searchType === 'booking_id' 
        ? { booking_id: searchValue }
        : { vehicle_plate: searchValue };

      const response = await axios.get(
        'http://localhost:8000/api/admin/bookings/search/',
        {
          headers: { Authorization: `Bearer ${token}` },
          params
        }
      );

      if (response.data.bookings && response.data.bookings.length > 0) {
        setSearchResults(response.data.bookings);
        if (response.data.bookings.length === 1) {
          setBooking(response.data.bookings[0]);
        }
      } else {
        setError('No active checked-in bookings found');
      }
    } catch (err) {
      console.error('Search failed:', err);
      setError(err.response?.data?.error || 'Failed to search bookings');
    } finally {
      setSearching(false);
    }
  }

  function selectBooking(selectedBooking) {
    setBooking(selectedBooking);
    setSearchResults([]);
  }

  async function handleCheckOut(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!booking) {
      setError('Please search and select a booking first');
      setLoading(false);
      return;
    }

    if (!secretCode.trim()) {
      setError('Secret code is required');
      setLoading(false);
      return;
    }

    if (secretCode.length !== 6) {
      setError('Secret code must be 6 digits');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:8000/api/admin/checkout/',
        {
          booking_id: booking.id,
          secret_code: secretCode,
          notes: notes
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccess(true);
      setPaymentSummary(response.data.payment_summary);
    } catch (err) {
      console.error('Check-out failed:', err);
      setError(err.response?.data?.error || 'Failed to check out vehicle');
    } finally {
      setLoading(false);
    }
  }

  function handleNewCheckOut() {
    setSearchValue('');
    setSecretCode('');
    setNotes('');
    setBooking(null);
    setSearchResults([]);
    setSuccess(false);
    setPaymentSummary(null);
    setError('');
  }

  function formatDuration(checkinTime) {
    if (!checkinTime) return 'N/A';
    const start = new Date(checkinTime);
    const now = new Date();
    const diffMs = now - start;
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  }

  function printReceipt() {
    if (!booking || !paymentSummary) return;

    const printWindow = window.open('', '', 'width=400,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Parking Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .row { display: flex; justify-content: space-between; margin: 10px 0; }
            .label { font-weight: bold; }
            .total { font-size: 20px; margin-top: 20px; padding-top: 10px; border-top: 2px solid #333; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h2>Parking Receipt</h2>
          <div class="row">
            <span class="label">Vehicle:</span>
            <span>${booking.vehicle?.number_plate || 'N/A'}</span>
          </div>
          <div class="row">
            <span class="label">Booking ID:</span>
            <span>${booking.id}</span>
          </div>
          <div class="row">
            <span class="label">Check-In:</span>
            <span>${new Date(booking.checked_in_at).toLocaleString()}</span>
          </div>
          <div class="row">
            <span class="label">Check-Out:</span>
            <span>${new Date().toLocaleString()}</span>
          </div>
          <div class="row">
            <span class="label">Duration:</span>
            <span>${paymentSummary.duration}</span>
          </div>
          <hr>
          <div class="row">
            <span class="label">Base Charge:</span>
            <span>${paymentSummary.base_charge}</span>
          </div>
          <div class="row">
            <span class="label">Overtime Charge:</span>
            <span>${paymentSummary.overtime_charge}</span>
          </div>
          <div class="row total">
            <span class="label">Total Amount:</span>
            <span><strong>${paymentSummary.total_charge}</strong></span>
          </div>
          <div class="footer">
            <p>Thank you for parking with us!</p>
            <p>${new Date().toLocaleString()}</p>
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  if (success && paymentSummary) {
    return (
      <div className="checkout-form-container">
        <div className="success-display">
          <div className="success-icon">✓</div>
          <h2>Check-Out Successful!</h2>

          <div className="payment-summary">
            <h3>Payment Summary</h3>
            <div className="summary-row">
              <span>Base Charge:</span>
              <span className="amount">{paymentSummary.base_charge}</span>
            </div>
            {paymentSummary.overtime_minutes > 0 && (
              <div className="summary-row overtime">
                <span>Overtime ({paymentSummary.overtime_minutes} mins):</span>
                <span className="amount">{paymentSummary.overtime_charge}</span>
              </div>
            )}
            <div className="summary-row total">
              <span>Total Amount:</span>
              <span className="amount">{paymentSummary.total_charge}</span>
            </div>
            <div className="summary-row">
              <span>Duration:</span>
              <span>{paymentSummary.duration}</span>
            </div>
          </div>

          <div className="booking-details">
            <h4>Booking Details</h4>
            <div className="detail-row">
              <span className="label">Vehicle:</span>
              <span className="value">{booking?.vehicle?.number_plate || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Slot:</span>
              <span className="value">{booking?.slot?.slot_number}</span>
            </div>
            <div className="detail-row">
              <span className="label">Check-Out Time:</span>
              <span className="value">{new Date().toLocaleString()}</span>
            </div>
          </div>

          <div className="action-buttons">
            <button onClick={printReceipt} className="btn-secondary">
              🖨️ Print Receipt
            </button>
            <button onClick={handleNewCheckOut} className="btn-primary">
              New Check-Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-form-container">
      <div className="form-header">
        <h2>Vehicle Check-Out</h2>
        <p>Complete parking session and calculate charges</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Search Section */}
      <div className="search-section">
        <h3>Step 1: Find Booking</h3>
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-type-selector">
            <label>
              <input
                type="radio"
                value="vehicle_plate"
                checked={searchType === 'vehicle_plate'}
                onChange={(e) => setSearchType(e.target.value)}
              />
              <span>Search by Vehicle Plate</span>
            </label>
            <label>
              <input
                type="radio"
                value="booking_id"
                checked={searchType === 'booking_id'}
                onChange={(e) => setSearchType(e.target.value)}
              />
              <span>Search by Booking ID</span>
            </label>
          </div>

          <div className="search-input-group">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={
                searchType === 'vehicle_plate'
                  ? 'Enter vehicle plate number'
                  : 'Enter booking ID'
              }
              className="form-control"
            />
            <button
              type="submit"
              className="btn-search"
              disabled={searching}
            >
              {searching ? 'Searching...' : '🔍 Search'}
            </button>
          </div>
        </form>

        {/* Search Results */}
        {searchResults.length > 1 && (
          <div className="search-results">
            <h4>Multiple bookings found. Select one:</h4>
            {searchResults.map((result) => (
              <div
                key={result.id}
                className="result-item"
                onClick={() => selectBooking(result)}
              >
                <div className="result-info">
                  <strong>Booking #{result.id}</strong>
                  <span>{result.vehicle?.number_plate}</span>
                  <span>Slot: {result.slot?.slot_number}</span>
                </div>
                <span className="result-duration">
                  {formatDuration(result.checked_in_at)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Selected Booking Display */}
        {booking && (
          <div className="selected-booking">
            <h4>✓ Booking Found</h4>
            <div className="booking-card">
              <div className="booking-info">
                <div className="info-row">
                  <span className="label">Booking ID:</span>
                  <span className="value">#{booking.id}</span>
                </div>
                <div className="info-row">
                  <span className="label">Vehicle:</span>
                  <span className="value">{booking.vehicle?.number_plate || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Slot:</span>
                  <span className="value">{booking.slot?.slot_number}</span>
                </div>
                <div className="info-row">
                  <span className="label">Parking Zone:</span>
                  <span className="value">{booking.parking_zone_display}</span>
                </div>
                <div className="info-row">
                  <span className="label">Check-In Time:</span>
                  <span className="value">
                    {new Date(booking.checked_in_at).toLocaleString()}
                  </span>
                </div>
                <div className="info-row highlight">
                  <span className="label">Duration:</span>
                  <span className="value">{formatDuration(booking.checked_in_at)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Check-Out Section */}
      {booking && (
        <div className="checkout-section">
          <h3>Step 2: Verify and Check-Out</h3>
          <form onSubmit={handleCheckOut} className="checkout-form">
            <div className="form-group">
              <label htmlFor="secret_code" className="required">
                Secret Code
              </label>
              <input
                type="text"
                id="secret_code"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                placeholder="Enter 6-digit code from user"
                className="form-control code-input"
                maxLength={6}
                pattern="\d{6}"
                required
              />
              <small className="form-text">
                Ask the vehicle owner for their 6-digit secret code
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes (Optional)</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
                className="form-control"
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={handleNewCheckOut}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Complete Check-Out'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
