import React from 'react';
import '../stylesheets/vehicle-type-selector.css';

export default function VehicleTypeSelector({ 
  selectedType, 
  onTypeChange, 
  showAllOption = true, 
  disabled = false,
  label = "Vehicle Type" 
}) {
  const vehicleTypes = [
    { value: 'car', label: 'Car', icon: '🚗' },
    { value: 'suv', label: 'SUV', icon: '🚙' },
    { value: 'bike', label: 'Bike', icon: '🏍️' },
    { value: 'truck', label: 'Truck', icon: '🚚' },
    { value: 'any', label: 'Any Vehicle', icon: '🅿️' }
  ];

  const typesToShow = showAllOption ? vehicleTypes : vehicleTypes.filter(type => type.value !== 'any');

  return (
    <div className="vehicle-type-selector">
      <label className="vehicle-type-label">{label}:</label>
      <div className="vehicle-type-options">
        {showAllOption && (
          <button
            type="button"
            className={`vehicle-type-btn ${selectedType === null || selectedType === '' ? 'active' : ''}`}
            onClick={() => onTypeChange(null)}
            disabled={disabled}
          >
            <span className="vehicle-icon">🔍</span>
            <span>All Types</span>
          </button>
        )}
        {typesToShow.map(type => (
          <button
            key={type.value}
            type="button"
            className={`vehicle-type-btn ${selectedType === type.value ? 'active' : ''}`}
            onClick={() => onTypeChange(type.value)}
            disabled={disabled}
          >
            <span className="vehicle-icon">{type.icon}</span>
            <span>{type.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}