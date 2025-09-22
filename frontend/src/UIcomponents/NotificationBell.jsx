import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import NotificationCenter from './NotificationCenter';

/**
 * NotificationBell - A clickable notification bell that shows unread count
 * and opens the notification center when clicked
 */
export default function NotificationBell() {
  const { 
    unreadCount, 
    isNotificationCenterOpen, 
    toggleNotificationCenter 
  } = useNotifications();
  
  return (
    <div className="notification-bell-container">
      <button 
        className={`notification-bell ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={toggleNotificationCenter}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {isNotificationCenterOpen && (
        <NotificationCenter 
          isOpen={isNotificationCenterOpen}
          onClose={toggleNotificationCenter}
        />
      )}
    </div>
  );
}