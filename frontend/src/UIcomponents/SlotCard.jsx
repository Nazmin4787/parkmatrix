import React from 'react';
import '../stylesheets/slots.css';

export default function SlotCard({ slot, onBook, disabled }) {
  const isBooked = Boolean(slot.is_occupied);
  return (
    <div className={`slot-card ${isBooked ? 'booked' : 'available'}`}>
      <div className="slot-header">
        <div className="slot-code">{slot.slot_number}</div>
        <div className={`slot-status ${isBooked ? 's-booked' : 's-available'}`}>
          {isBooked ? 'Booked' : 'Available'}
        </div>
      </div>
      <div className="slot-meta">
        <div className="slot-floor">Floor {slot.floor}</div>
        <div className="slot-price">$5/hr</div>
      </div>
      <button
        className="slot-book-btn"
        onClick={() => onBook && onBook(slot.id)}
        disabled={isBooked || disabled}
      >
        {isBooked ? 'Unavailable' : 'Book now'}
      </button>
    </div>
  );
}


