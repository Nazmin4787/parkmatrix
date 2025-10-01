import React from 'react';
import '../stylesheets/slots.css';

export default function SlotCard({ slot, onBook, disabled, userVehicleType }) {
  const isBooked = Boolean(slot.is_occupied);
  // Fix compatibility logic - a slot is compatible if:
  // 1. It's for "any" vehicle type, OR
  // 2. User doesn't have a specific vehicle type selected, OR
  // 3. The slot's vehicle type matches the user's vehicle type
  const isCompatible = slot.vehicle_type === 'any' || !userVehicleType || slot.vehicle_type === userVehicleType;
  
  const getVehicleTypeIcon = (type) => {
    const icons = {
      'car': '🚗',
      'suv': '🚙', 
      'bike': '🏍️',
      'truck': '🚚',
      'any': '🅿️'
    };
    return icons[type] || '🅿️';
  };

  const getVehicleTypeLabel = (type) => {
    const labels = {
      'car': 'Car',
      'suv': 'SUV',
      'bike': 'Bike', 
      'truck': 'Truck',
      'any': 'Any Vehicle'
    };
    return labels[type] || 'Any Vehicle';
  };

  return (
    <div className={`slot-card ${isBooked ? 'booked' : 'available'} ${!isCompatible ? 'incompatible' : ''}`}>
      <div className="slot-header">
        <div className="slot-code">{slot.slot_number}</div>
        <div className={`slot-status ${isBooked ? 's-booked' : 's-available'}`}>
          {isBooked ? 'Booked' : 'Available'}
        </div>
      </div>
      <div className="slot-meta">
        <div className="slot-floor">Floor {slot.floor}</div>
        <div className="slot-vehicle-type">
          <span className="vehicle-icon">{getVehicleTypeIcon(slot.vehicle_type)}</span>
          <span className="vehicle-label">{getVehicleTypeLabel(slot.vehicle_type)}</span>
        </div>
        <div className="slot-price">$5/hr</div>
      </div>
      {!isCompatible && (
        <div className="compatibility-warning">
          Not compatible with your vehicle type
        </div>
      )}
      <button
        className={`slot-book-btn ${disabled ? 'booking' : ''}`}
        onClick={() => onBook && onBook(slot.id)}
        disabled={isBooked || disabled || !isCompatible}
      >
        {disabled ? 'Booking...' : isBooked ? 'Unavailable' : !isCompatible ? 'Incompatible' : 'Quick Book'}
      </button>
    </div>
  );
}


