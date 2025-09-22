import React from 'react';

// Map notification types to their corresponding emoji icons
export const iconMap = {
  'booking_confirmation': <span style={{color: "#4CAF50"}}>📅</span>,
  'booking_expiry': <span style={{color: "#FF9800"}}>⏰</span>,
  'booking_start': <span style={{color: "#2196F3"}}>▶️</span>,
  'booking_end': <span style={{color: "#9C27B0"}}>⏹️</span>,
  'lot_available': <span style={{color: "#00BCD4"}}>🅿️</span>,
  'booking_reminder': <span style={{color: "#FF9800"}}>⏰</span>,
  'booking_cancelled': <span style={{color: "#F44336"}}>⚠️</span>,
  'booking_update': <span style={{color: "#673AB7"}}>✏️</span>,
  'booking_error': <span style={{color: "#F44336"}}>⚠️</span>,
  'lot_full': <span style={{color: "#607D8B"}}>📊</span>,
  'slot_reserved': <span style={{color: "#2196F3"}}>🅿️</span>,
  'account_update': <span style={{color: "#607D8B"}}>ℹ️</span>,
  'payment_confirmation': <span style={{color: "#4CAF50"}}>🧾</span>,
  'payment_failed': <span style={{color: "#F44336"}}>⭕</span>,
  'payment_receipt': <span style={{color: "#4CAF50"}}>💰</span>,
  'system_alert': <span style={{color: "#FF5722"}}>⚠️</span>,
  'maintenance': <span style={{color: "#607D8B"}}>🔧</span>
};

/**
 * Returns the appropriate icon component for a given notification type
 * @param {string} type - The notification type
 * @returns {React.ReactElement} The icon component
 */
export const getIcon = (type) => {
  return iconMap[type] || <span style={{color: "#757575"}}>🔔</span>;
};

/**
 * NotificationIcon component
 * @param {Object} props - Component props
 * @param {string} props.type - The notification type
 * @returns {React.ReactElement} The icon component
 */
export default function NotificationIcon({ type }) {
  return getIcon(type);
}