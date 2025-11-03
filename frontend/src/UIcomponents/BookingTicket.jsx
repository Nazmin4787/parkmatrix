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

  const calculateOverstay = () => {
    if (!booking || !booking.end_time) return null;
    
    const status = booking.status || (booking.is_active ? 'confirmed' : 'completed');
    
    // Only calculate overstay for checked-in bookings
    if (status !== 'checked_in') return null;
    
    const endTime = new Date(booking.end_time);
    const now = new Date();
    
    // Check if current time exceeds booking end time
    if (now > endTime) {
      const overstayMs = now - endTime;
      const overstayMinutes = Math.floor(overstayMs / (1000 * 60));
      const overstayHours = (overstayMinutes / 60).toFixed(2);
      
      // Calculate overstay amount (assuming hourly rate from slot's parking lot)
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

  const getStatusText = () => {
    const status = booking.status || (booking.is_active ? 'confirmed' : 'completed');
    switch (status) {
      case 'confirmed': return '🚗 CONFIRMED';
      case 'verified': return '✅ VERIFIED';
      case 'checked_in': return '🟢 CHECKED IN';
      case 'checkout_requested': return '🚪 CHECKOUT REQUESTED';
      case 'checkout_verified': return '✅ CHECKOUT VERIFIED';
      case 'checked_out': return '✅ CHECKED OUT';
      case 'cancelled': return '❌ CANCELLED';
      case 'expired': return '⏰ EXPIRED';
      default: return booking.is_active ? '🟢 ACTIVE' : '✅ COMPLETED';
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    window.print();
    setTimeout(() => setIsPrinting(false), 1000);
  };

  const handleDownload = () => {
    const overstayInfo = calculateOverstay();
    
    // Simple download as text file (you can enhance this to PDF later)
    const ticketContent = `
PARKMATRIX BOOKING TICKET
========================

Booking Reference: ${generateBookingReference()}
Status: ${getStatusText()}

VEHICLE DETAILS
---------------
License Plate: ${booking.vehicle?.number_plate || booking.vehicle || 'N/A'}

PARKING DETAILS
---------------
Slot Number: ${booking.slot?.slot_number || booking.slot_number || booking.slot || 'N/A'}
Parking Location: ${booking.slot?.parking_zone_display || booking.parking_zone_display || 'N/A'}
Floor: ${booking.floor ?? booking.slot_detail?.floor ?? 'Ground'}

TIME DETAILS
------------
Start Time: ${formatDateTime(booking.start_time)}
End Time: ${formatDateTime(booking.end_time)}
Duration: ${calculateDuration()}
${booking.checked_in_at ? `Checked In: ${formatDateTime(booking.checked_in_at)}` : ''}
${booking.checked_out_at ? `Checked Out: ${formatDateTime(booking.checked_out_at)}` : ''}

PAYMENT DETAILS
---------------
Amount Paid: $${booking.total_price || booking.total_amount || '0.00'}
${overstayInfo && overstayInfo.has_overstay ? `Overstay Fee (Pending): $${overstayInfo.overstay_amount.toFixed(2)}` : ''}
${overstayInfo && overstayInfo.has_overstay ? `  (${overstayInfo.overstay_hours} hours overstay)` : ''}

${booking.secret_code ? `\nSECRET CODE: ${booking.secret_code}\n` : ''}

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

  const overstayInfo = calculateOverstay();

  return (
    <div className="booking-ticket">
      <div className="ticket-header">
        <div className="logo-section">
          <h1>🅿️ ParkMatrix</h1>
          <p className="tagline">Smart Parking Solutions</p>
        </div>
        <div className="ticket-id">
          <strong>Booking ID</strong>
          <p>{generateBookingReference()}</p>
        </div>
      </div>

      <div className="ticket-status">
        <span className={`status-badge ${booking.is_active ? 'active' : 'completed'}`}>
          {getStatusText()}
        </span>
      </div>

      <div className="ticket-body">
        <div className="ticket-section">
          <h3>🚗 Vehicle Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">License Plate:</span>
              <span className="value">{booking.vehicle?.number_plate || booking.vehicle || 'Not specified'}</span>
            </div>
          </div>
        </div>

        <div className="ticket-section">
          <h3>🅿️ Parking Details</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Slot Number:</span>
              <span className="value">{booking.slot?.slot_number || booking.slot_number || booking.slot || 'N/A'}</span>
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
            {booking.checked_in_at && (
              <div className="info-item">
                <span className="label">Checked In:</span>
                <span className="value">{formatDateTime(booking.checked_in_at)}</span>
              </div>
            )}
            {booking.checked_out_at && (
              <div className="info-item">
                <span className="label">Checked Out:</span>
                <span className="value">{formatDateTime(booking.checked_out_at)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="ticket-section">
          <h3>💳 Payment Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Amount:</span>
              <span className="value payment-amount">${booking.total_price || booking.total_amount || '0.00'}</span>
            </div>
            
            {/* Overstay Fee Display */}
            {overstayInfo && overstayInfo.has_overstay && (
              <div className="info-item" style={{
                background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '2px solid #F59E0B',
                gridColumn: '1 / -1'
              }}>
                <span className="label" style={{ color: '#92400E' }}>
                  Overstay Fee <span style={{ fontWeight: 'bold', color: '#F59E0B' }}>(Pending)</span>
                </span>
                <span className="value" style={{ color: '#DC2626', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  ${overstayInfo.overstay_amount.toFixed(2)}
                </span>
                <div style={{ fontSize: '0.85rem', color: '#78350F', marginTop: '0.5rem' }}>
                  ⚠️ You have exceeded your booking time by <strong>{overstayInfo.overstay_hours} hours</strong> ({overstayInfo.overstay_minutes} minutes)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Secret Code Section */}
        {booking.secret_code && (
          <div className="ticket-section" style={{
            background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
            border: '2px solid #818CF8',
            padding: '1.5rem',
            borderRadius: '12px'
          }}>
            <h3>🔐 Secret Code</h3>
            <div style={{
              textAlign: 'center',
              padding: '1rem',
              background: 'white',
              borderRadius: '8px',
              marginTop: '0.5rem'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '0.5rem' }}>
                Present this code at checkout
              </div>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold', 
                letterSpacing: '0.2rem',
                color: '#4F46E5',
                fontFamily: 'monospace'
              }}>
                {booking.secret_code}
              </div>
            </div>
          </div>
        )}
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