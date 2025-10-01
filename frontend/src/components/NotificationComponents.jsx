import React, { useState, useEffect } from 'react';
import {
  getUnreadNotificationCount,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from './notification_api_integration';

/**
 * NotificationBadge component displays a badge with unread notification count
 * This component can be used in headers/navigation and doesn't require authentication
 */
export function NotificationBadge() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    // Check for notifications when the component mounts
    fetchNotificationCount();
    
    // Set up polling to check for new notifications
    const interval = setInterval(fetchNotificationCount, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);
  
  async function fetchNotificationCount() {
    const unreadCount = await getUnreadNotificationCount();
    setCount(unreadCount);
  }
  
  return (
    <div className="notification-badge">
      <i className="fa fa-bell"></i>
      {count > 0 && <span className="badge">{count}</span>}
    </div>
  );
}

/**
 * NotificationList component displays a list of user notifications
 * This component requires authentication
 */
export function NotificationList() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  async function fetchNotifications() {
    setLoading(true);
    try {
      const notificationData = await getNotifications();
      setNotifications(notificationData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch notifications. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleMarkAsRead(notificationId) {
    const success = await markNotificationAsRead(notificationId);
    if (success) {
      // Update the notification in the state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    }
  }
  
  async function handleMarkAllAsRead() {
    const success = await markAllNotificationsAsRead();
    if (success) {
      // Mark all notifications as read in the state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
    }
  }
  
  if (loading) {
    return <div className="notification-list loading">Loading notifications...</div>;
  }
  
  if (error) {
    return <div className="notification-list error">{error}</div>;
  }
  
  if (notifications.length === 0) {
    return <div className="notification-list empty">No notifications</div>;
  }
  
  return (
    <div className="notification-list">
      <div className="notification-header">
        <h3>Notifications</h3>
        {notifications.some(n => !n.is_read) && (
          <button onClick={handleMarkAllAsRead} className="mark-all-read-btn">
            Mark all as read
          </button>
        )}
      </div>
      
      <ul className="notifications">
        {notifications.map(notification => (
          <li 
            key={notification.id} 
            className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
            onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
          >
            <div className="notification-title">{notification.title}</div>
            <div className="notification-message">{notification.message}</div>
            <div className="notification-date">
              {new Date(notification.created_at).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * NotificationDropdown component combines the badge and list in a dropdown
 */
export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  
  const toggleDropdown = () => setOpen(!open);
  
  return (
    <div className="notification-dropdown">
      <div className="notification-icon" onClick={toggleDropdown}>
        <NotificationBadge />
      </div>
      
      {open && (
        <div className="dropdown-content">
          <NotificationList />
        </div>
      )}
    </div>
  );
}