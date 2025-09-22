import React from 'react';
import '../stylesheets/booking-card.css';

// Single-responsibility component for displaying a booking card
export default function BookingCard({ booking, onViewTicket, onCancel }) {
  return (
    <div className="booking-card">
      <div className="booking-details">
        <h3>Booking #{booking.id}</h3>
        
        <div>
          <strong>Slot:</strong> {booking.slot_number || booking.slot}
        </div>
        
        <div>
          <strong>Start:</strong> {new Date(booking.start_time).toLocaleString()}
        </div>
        
        {booking.end_time && (
          <div>
            <strong>End:</strong> {new Date(booking.end_time).toLocaleString()}
          </div>
        )}
        
        <div>
          <strong>Status:</strong> 
          <span className={`status-badge ${booking.is_active ? 'active' : 'completed'}`}>
            {booking.is_active ? 'Active' : 'Completed'}
          </span>
        </div>
        
        {booking.total_price && (
          <div>
            <strong>Amount:</strong> ${booking.total_price}
          </div>
        )}
      </div>
      
      <div className="booking-actions">
        {onViewTicket && (
          <button 
            className="btn-secondary" 
            onClick={() => onViewTicket(booking)}
          >
            View Ticket
          </button>
        )}
        
        {booking.is_active && onCancel && (
          <button 
            className="btn-danger" 
            onClick={() => onCancel(booking.id)}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}


