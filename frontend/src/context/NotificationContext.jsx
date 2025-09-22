import React, { createContext, useState, useContext, useEffect } from 'react';
import { ToastContainer } from '../UIcomponents/ToastNotification';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead as markAllRead,
  getUnreadNotificationsCount,
  showBrowserNotification 
} from '../services/notification';

// Create the context
const NotificationContext = createContext();

/**
 * Custom hook to access notification context
 * @returns {Object} The notification context
 */
export const useNotifications = () => useContext(NotificationContext);

/**
 * NotificationProvider component to manage global notification state
 */
export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initial fetch of notifications and setup polling
  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 2 minutes
    const intervalId = setInterval(fetchUnreadCount, 120000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  /**
   * Fetches all user notifications from the server
   */
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await getUserNotifications();
      setNotifications(data);
      const newUnreadCount = data.filter(n => !n.is_read).length;
      setUnreadCount(newUnreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetches only the unread count (lightweight operation for polling)
   */
  const fetchUnreadCount = async () => {
    try {
      const count = await getUnreadNotificationsCount();
      setUnreadCount(count);
      
      // If the unread count has changed, fetch full notifications
      if (count > unreadCount) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  /**
   * Handle the arrival of a new notification
   */
  const handleNewNotification = (notification) => {
    // Update notifications list
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Show toast notification
    setToasts(prev => [...prev, notification]);
    
    // Show browser notification if enabled
    showBrowserNotification(notification.title, {
      body: notification.message,
      icon: '/logo192.png'
    });
  };

  /**
   * Dismiss a toast notification
   */
  const dismissToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  /**
   * Toggle the notification center open/closed state
   */
  const toggleNotificationCenter = () => {
    setIsNotificationCenterOpen(prev => !prev);
    if (!isNotificationCenterOpen) {
      fetchNotifications(); // Refresh when opening
    }
  };

  /**
   * Mark a notification as read
   */
  const markAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = async () => {
    try {
      await markAllRead();
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Context value
  const value = {
    notifications,
    unreadCount,
    isLoading,
    isNotificationCenterOpen,
    toggleNotificationCenter,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastContainer notifications={toasts} onClose={dismissToast} />
    </NotificationContext.Provider>
  );
}