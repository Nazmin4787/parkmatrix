import { formatCurrency, getVehicleTypeDisplay } from '../services/pricingRate';
import './RateCard.css';

/**
 * Reusable component to display parking rate information
 * @param {Object} rate - Rate object with all rate details
 * @param {boolean} compact - If true, shows compact version
 * @param {Function} onSelect - Optional callback when card is clicked
 * @param {boolean} selected - If true, shows selected state
 */
export default function RateCard({ rate, compact = false, onSelect, selected = false }) {
  if (!rate) return null;

  // Get vehicle icon based on type
  const getVehicleIcon = (vehicleType) => {
    const icons = {
      '2-wheeler': '🏍️',
      '4-wheeler': '🚗',
      'suv': '🚙',
      'electric': '⚡',
      'heavy': '🚚',
      'bike': '🏍️',
      'car': '🚗',
      'all': '🅿️'
    };
    return icons[vehicleType] || '🚗';
  };

  // Format time slot
  const formatTimeSlot = (start, end) => {
    if (!start || !end) return null;
    return `${start.slice(0, 5)} - ${end.slice(0, 5)}`;
  };

  // Check if rate has special features
  const hasSpecialRates = rate.weekend_rate || rate.holiday_rate || rate.special_rate;
  const hasValidityPeriod = rate.effective_from || rate.effective_to;

  const handleClick = () => {
    if (onSelect) onSelect(rate);
  };

  if (compact) {
    return (
      <div 
        className={`rate-card rate-card-compact ${selected ? 'selected' : ''} ${onSelect ? 'clickable' : ''}`}
        onClick={handleClick}
      >
        <div className="rate-card-header-compact">
          <span className="vehicle-icon">{getVehicleIcon(rate.vehicle_type)}</span>
          <div className="rate-info">
            <h4>{rate.rate_name}</h4>
            <span className="vehicle-type">{getVehicleTypeDisplay(rate.vehicle_type)}</span>
          </div>
          <div className="rate-price">
            <span className="price-label">From</span>
            <span className="price-value">{formatCurrency(rate.hourly_rate)}/hr</span>
          </div>
        </div>
        {rate.is_default && <span className="badge badge-default">Default</span>}
        {!rate.is_active && <span className="badge badge-inactive">Inactive</span>}
      </div>
    );
  }

  return (
    <div 
      className={`rate-card ${selected ? 'selected' : ''} ${onSelect ? 'clickable' : ''} ${!rate.is_active ? 'inactive' : ''}`}
      onClick={handleClick}
    >
      {/* Header with vehicle icon and name */}
      <div className="rate-card-header">
        <div className="header-left">
          <span className="vehicle-icon-large">{getVehicleIcon(rate.vehicle_type)}</span>
          <div>
            <h3>{rate.rate_name}</h3>
            <span className="vehicle-type-display">{getVehicleTypeDisplay(rate.vehicle_type)}</span>
          </div>
        </div>
        <div className="header-badges">
          {rate.is_default && <span className="badge badge-default">Default</span>}
          {rate.is_active ? (
            <span className="badge badge-active">Active</span>
          ) : (
            <span className="badge badge-inactive">Inactive</span>
          )}
        </div>
      </div>

      {/* Description */}
      {rate.description && (
        <p className="rate-description">{rate.description}</p>
      )}

      {/* Standard Rates */}
      <div className="rate-details">
        <div className="rate-section">
          <h4>Standard Rates</h4>
          <div className="rate-items">
            {rate.hourly_rate && (
              <div className="rate-item">
                <span className="rate-label">⏰ Hourly Rate</span>
                <span className="rate-value">{formatCurrency(rate.hourly_rate)}/hr</span>
              </div>
            )}
            {rate.daily_rate && (
              <div className="rate-item">
                <span className="rate-label">📅 Daily Rate</span>
                <span className="rate-value">{formatCurrency(rate.daily_rate)}/day</span>
              </div>
            )}
          </div>
        </div>

        {/* Special Rates */}
        {hasSpecialRates && (
          <div className="rate-section special-rates">
            <h4>Special Rates</h4>
            <div className="rate-items">
              {rate.weekend_rate && (
                <div className="rate-item">
                  <span className="rate-label">🎉 Weekend Rate</span>
                  <span className="rate-value">{formatCurrency(rate.weekend_rate)}/hr</span>
                </div>
              )}
              {rate.holiday_rate && (
                <div className="rate-item">
                  <span className="rate-label">🎊 Holiday Rate</span>
                  <span className="rate-value">{formatCurrency(rate.holiday_rate)}/hr</span>
                </div>
              )}
              {rate.special_rate && formatTimeSlot(rate.time_slot_start, rate.time_slot_end) && (
                <div className="rate-item">
                  <span className="rate-label">
                    🌙 {formatTimeSlot(rate.time_slot_start, rate.time_slot_end)}
                  </span>
                  <span className="rate-value">{formatCurrency(rate.special_rate)}/hr</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Extension Rate */}
        {rate.extension_rate_multiplier && rate.extension_rate_multiplier !== 1.0 && (
          <div className="rate-section">
            <div className="rate-item">
              <span className="rate-label">🔄 Extension Multiplier</span>
              <span className="rate-value">{rate.extension_rate_multiplier}x</span>
            </div>
          </div>
        )}

        {/* Validity Period */}
        {hasValidityPeriod && (
          <div className="rate-section validity-section">
            <h4>Valid Period</h4>
            <div className="validity-info">
              {rate.effective_from && (
                <span>From: {new Date(rate.effective_from).toLocaleDateString()}</span>
              )}
              {rate.effective_to && (
                <span>To: {new Date(rate.effective_to).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer with selection indicator */}
      {selected && (
        <div className="rate-card-footer">
          <span className="selected-indicator">✓ Selected</span>
        </div>
      )}
    </div>
  );
}
