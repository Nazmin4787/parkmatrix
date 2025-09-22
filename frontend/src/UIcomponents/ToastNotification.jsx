import React, { useState, useEffect } from 'react';
import NotificationIcon from './NotificationIcons';
import { getNotificationPriority, playNotificationSound } from '../services/notification';
import '../stylesheets/toast.css';

/**
 * Single toast notification component that displays a notification and auto-closes
 * 
 * @param {Object} props Component properties
 * @param {Object} props.notification The notification object to display
 * @param {Function} props.onClose Callback when the toast is closed
 * @param {number} props.autoClose Milliseconds after which the toast auto-closes (0 to disable)
 */
export default function ToastNotification({ notification, onClose, autoClose = 5000 }) {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    if (!autoClose) return;
    
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow animation to complete before removal
    }, autoClose);
    
    return () => clearTimeout(timer);
  }, [autoClose, onClose]);
  
  useEffect(() => {
    // Play sound when notification appears
    const priority = getNotificationPriority(notification.notification_type);
    playNotificationSound(priority);
  }, [notification]);
  
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };
  
  const handleClick = () => {
    // Handle specific actions based on notification type
    if (notification.additional_data?.action_url) {
      window.location.href = notification.additional_data.action_url;
    }
    handleClose();
  };
  
  const priority = getNotificationPriority(notification.notification_type);
  
  return (
      isVisible && (
        <div 
          className={`toast-notification priority-${priority}`}
        >
          <div className="toast-content" onClick={handleClick}>
            <div className="toast-icon">
              <NotificationIcon type={notification.notification_type} />
            </div>
            <div className="toast-body">
              <div className="toast-title">{notification.title}</div>
              <div className="toast-message">{notification.message}</div>
            </div>
            <button className="toast-close" onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}>×</button>
          </div>
          
          {autoClose > 0 && (
            <div 
              className="toast-progress"
              style={{
                width: isVisible ? '100%' : '0%',
                transition: `width ${autoClose / 1000}s linear`
              }}
            />
          )}
        </div>
      )
  );
}

/**
 * Container component for multiple toast notifications
 * 
 * @param {Object} props Component properties
 * @param {Array} props.notifications Array of notification objects
 * @param {Function} props.onClose Callback when a toast is closed
 */
export function ToastContainer({ notifications, onClose }) {
  return (
    <div className="toast-container">
      {notifications.map(notification => (
        <ToastNotification 
          key={notification.id}
          notification={notification}
          onClose={() => onClose(notification.id)}
          autoClose={
            getNotificationPriority(notification.notification_type) === 'urgent' ? 0 : 5000
          }
        />
      ))}
    </div>
  );
}