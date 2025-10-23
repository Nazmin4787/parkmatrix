import React from 'react';
import '../stylesheets/slots.css';

export default function SlotCard({ slot, onBook, disabled, userVehicleType, zonePricingRate }) {
  const isBooked = Boolean(slot.is_occupied);
  // Allow all users to book any slot - remove compatibility restrictions
  const isCompatible = true;
  
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

  const getZoneDisplayName = (zoneCode) => {
    const zoneNames = {
      'COLLEGE_PARKING_CENTER': 'College Parking',
      'HOME_PARKING_CENTER': 'Home Parking',
      'METRO_PARKING_CENTER': 'Metro Parking',
      'VIVIVANA_PARKING_CENTER': 'Vivivana Parking'
    };
    return zoneNames[zoneCode] || zoneCode;
  };

  return (
    <div className={`slot-card ${isBooked ? 'booked' : 'available'}`}>
      <div className="slot-header">
        <div className="slot-code">{slot.slot_number}</div>
        <div className={`slot-status ${isBooked ? 's-booked' : 's-available'}`}>
          {isBooked ? 'Booked' : 'Available'}
        </div>
      </div>
      
      {/* Zone badge */}
      {slot.parking_zone && (
        <div className="slot-zone-badge">
          📍 {slot.parking_zone_display || getZoneDisplayName(slot.parking_zone)}
        </div>
      )}
      
      <div className="slot-meta">
        <div className="slot-floor">Floor {slot.floor}</div>
        <div className="slot-vehicle-type">
          <span className="vehicle-icon">{getVehicleTypeIcon(slot.vehicle_type)}</span>
          <span className="vehicle-label">{getVehicleTypeLabel(slot.vehicle_type)}</span>
        </div>
        <div className="slot-price">
          {zonePricingRate ? (
            <>
              <span className="price-hourly">₹{zonePricingRate.hourly_rate}/hr</span>
              {zonePricingRate.daily_rate && (
                <span className="price-daily">₹{zonePricingRate.daily_rate}/day</span>
              )}
            </>
          ) : (
            <span className="price-default">₹50/hr</span>
          )}
        </div>
      </div>
      <button
        className={`slot-book-btn ${disabled ? 'booking' : ''}`}
        onClick={() => onBook && onBook(slot.id)}
        disabled={isBooked || disabled}
      >
        {disabled ? 'Booking...' : isBooked ? 'Unavailable' : 'Quick Book'}
      </button>
    </div>
  );
}


