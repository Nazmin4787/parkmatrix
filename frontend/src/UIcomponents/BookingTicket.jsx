import { useState } from 'react';
import '../stylesheets/ticket.css';

export default function BookingTicket({ booking }) {
  const [isPrinting, setIsPrinting] = useState(false);

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = () => {
    if (!booking.start_time || !booking.end_time) return 'N/A';
    const start = new Date(booking.start_time);
    const end = new Date(booking.end_time);
    const diffMs = end - start;
    const diffHours = Math.round(diffMs / (1000 * 60 * 60) * 100) / 100;
    return `${diffHours} hours`;
  };

  const generateBookingReference = () => {
    if (booking.booking_reference) return booking.booking_reference;
    const date = new Date(booking.start_time || booking.created_at);
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    return `PK-${dateStr}-${String(booking.id).padStart(6, '0')}`;
  };

  const handlePrint = () => {
    setIsPrinting(true);
    window.print();
    setTimeout(() => setIsPrinting(false), 1000);
  };

  const handleDownload = () => {
    // Simple download as text file (you can enhance this to PDF later)
    const ticketContent = `
PARKSMART BOOKING TICKET
========================

Booking Reference: ${generateBookingReference()}
Status: ${booking.is_active ? 'Active' : 'Completed'}

VEHICLE DETAILS
---------------
License Plate: ${booking.vehicle || 'N/A'}

PARKING DETAILS
---------------
Slot Number: ${booking.slot_number ?? booking.slot_detail?.slot_number ?? `#${booking.slot}`}
Floor: ${booking.floor ?? booking.slot_detail?.floor ?? 'N/A'}

TIME DETAILS
------------
Start Time: ${formatDateTime(booking.start_time)}
End Time: ${formatDateTime(booking.end_time)}
Duration: ${calculateDuration()}

PAYMENT DETAILS
---------------
Amount Paid: ₹${booking.total_amount || 'N/A'}

Generated on: ${new Date().toLocaleString()}
    `;

    const blob = new Blob([ticketContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parking-ticket-${generateBookingReference()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="booking-ticket">
      <div className="ticket-header">
        <div className="logo-section">
          <h1>🅿️ ParkSmart</h1>
          <p className="tagline">Smart Parking Solutions</p>
        </div>
        <div className="ticket-id">
          <strong>Booking ID</strong>
          <p>{generateBookingReference()}</p>
        </div>
      </div>

      <div className="ticket-status">
        <span className={`status-badge ${booking.is_active ? 'active' : 'completed'}`}>
          {booking.is_active ? '🟢 ACTIVE' : '✅ COMPLETED'}
        </span>
      </div>

      <div className="ticket-body">
        <div className="ticket-section">
          <h3>🚗 Vehicle Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">License Plate:</span>
              <span className="value">{booking.vehicle || 'Not specified'}</span>
            </div>
          </div>
        </div>

        <div className="ticket-section">
          <h3>🅿️ Parking Details</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Slot Number:</span>
              <span className="value">{booking.slot_number ?? booking.slot_detail?.slot_number ?? `#${booking.slot}`}</span>
            </div>
            <div className="info-item">
              <span className="label">Parking Location:</span>
              <span className="value">{booking.slot?.parking_zone_display || booking.parking_zone_display || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="label">Floor:</span>
              <span className="value">{booking.floor ?? booking.slot_detail?.floor ?? 'Ground'}</span>
            </div>
          </div>
        </div>

        <div className="ticket-section">
          <h3>⏰ Time Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Start Time:</span>
              <span className="value">{formatDateTime(booking.start_time)}</span>
            </div>
            <div className="info-item">
              <span className="label">End Time:</span>
              <span className="value">{formatDateTime(booking.end_time)}</span>
            </div>
            <div className="info-item">
              <span className="label">Duration:</span>
              <span className="value">{calculateDuration()}</span>
            </div>
          </div>
        </div>

        <div className="ticket-section">
          <h3>💳 Payment Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Amount Paid:</span>
              <span className="value payment-amount">₹{booking.total_amount || '0.00'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="ticket-footer">
        <div className="ticket-actions">
          <button 
            className="btn-secondary" 
            onClick={handlePrint}
            disabled={isPrinting}
          >
            {isPrinting ? 'Printing...' : '🖨️ Print Ticket'}
          </button>
          <button 
            className="btn-secondary" 
            onClick={handleDownload}
          >
            📥 Download
          </button>
        </div>
        
        <div className="ticket-note">
          <p>Please keep this ticket for reference. Show this ticket to security if required.</p>
          <p className="generated-time">Generated: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}