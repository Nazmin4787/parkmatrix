import React, { useState, useEffect, useContext } from 'react';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  deleteNotification,
  markAllNotificationsAsRead,
  getUnreadCount,
  sortNotificationsByDate,
  formatNotificationDate,
  getNotificationPriority,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITY,
  subscribeToPushNotifications
} from '../services/notification';
import NotificationIcon from './NotificationIcons';
import '../stylesheets/notification-center.css';

/**
 * NotificationCenter - Enhanced notification management component
 * Displays notification dropdown/panel with smooth animations
 */
export default function NotificationCenter({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [processedNotifications, setProcessedNotifications] = useState([]);

  // Check if push notifications are enabled
  useEffect(() => {
    const checkPushPermission = async () => {
      if ('Notification' in window) {
        const permission = Notification.permission;
        setIsPushEnabled(permission === 'granted');
      }
    };
    
    checkPushPermission();
  }, []);

  // Fetch notifications on component mount and when opened
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Filter notifications based on active tab and search query
  useEffect(() => {
    let filtered = [...notifications];
    
    // Apply tab filter
    if (activeTab === 'upcoming') {
      filtered = filtered.filter(notif => 
        ['booking_expiry', 'booking_start', 'booking_confirmation'].includes(notif.notification_type)
      );
    } else if (activeTab === 'unread') {
      filtered = filtered.filter(notif => !notif.is_read);
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(notif => 
        (notif.title && notif.title.toLowerCase().includes(query)) || 
        (notif.message && notif.message.toLowerCase().includes(query))
      );
    }
    
    // Apply sort order
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    setProcessedNotifications(filtered);
  }, [activeTab, notifications, searchQuery, sortOrder]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserNotifications();
      const sortedNotifications = sortNotificationsByDate(data);
      setNotifications(sortedNotifications);
    } catch (err) {
      setError('Failed to load notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications
      .filter(notif => !notif.is_read)
      .map(notif => notif.id);
    
    if (unreadIds.length === 0) return;

    try {
      await markAllNotificationsAsRead(unreadIds);
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleEnablePushNotifications = async () => {
    const success = await subscribeToPushNotifications();
    if (success) {
      setIsPushEnabled(true);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest');
  };

  const unreadCount = getUnreadCount(notifications);
  
  // Get count of upcoming notifications (booking start, expiry, etc.)
  const getUpcomingCount = (notifications) => {
    return notifications.filter(
      notif => ['booking_expiry', 'booking_start', 'booking_confirmation'].includes(notif.notification_type)
    ).length;
  };

  if (!isOpen) return null;
  
  return (
    <div className="notification-center">
      <div 
        className="notification-overlay" 
        onClick={onClose}
      />
      
      <div 
        className="notification-panel"
        role="dialog"
        aria-label="Notifications"
        aria-modal="true"
      >
        {/* Header */}
        <div className="notification-header">
          <h2>Notifications</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        {/* Notification Tabs */}
        <div className="notification-tabs">
          <button 
            className={`tab-button ${activeTab === 'all' ? 'active' : ''}`} 
            onClick={() => setActiveTab('all')}
          >
            All
            {notifications.length > 0 && (
              <span className="notification-count">{notifications.length}</span>
            )}
          </button>
          <button 
            className={`tab-button ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming
            {getUpcomingCount(notifications) > 0 && (
              <span className="notification-count">{getUpcomingCount(notifications)}</span>
            )}
          </button>
          <button 
            className={`tab-button ${activeTab === 'unread' ? 'active' : ''}`}
            onClick={() => setActiveTab('unread')}
          >
            Unread
            {unreadCount > 0 && (
              <span className="notification-count">{unreadCount}</span>
            )}
          </button>
        </div>

        {/* Search (optional) */}
        <div className="notification-search">
          <input 
            type="text" 
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="notification-loading">
            <div className="spinner"></div>
            <span>Loading notifications...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="notification-error">
            <p>{error}</p>
            <button onClick={fetchNotifications} className="retry-btn">Retry</button>
          </div>
        )}

        {/* Notifications List */}
        {!loading && !error && (
          <div className="notification-list">
            {processedNotifications.length === 0 ? (
              <div className="no-notifications">
                <div className="empty-state-icon">🔔</div>
                <p>No {activeTab !== 'all' ? activeTab : ''} notifications to display</p>
                {(searchQuery || activeTab !== 'all') && (
                  <button 
                    className="clear-filters-btn"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveTab('all');
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div>
                {processedNotifications.map((notification, index) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * NotificationCard - Clean card-based notification component
 * Matches the design seen in the screenshots
 */
function NotificationCard({ notification, onMarkAsRead, onDelete }) {
  const formattedDate = formatNotificationDate(notification.created_at);
  
  // Get appropriate icon color based on notification type
  const getIconColor = (type) => {
    const colorMap = {
      'booking_confirmation': '#4CAF50', // Green
      'booking_expiry': '#FF9800',       // Orange/Amber
      'booking_start': '#2196F3',        // Blue
      'booking_end': '#9C27B0',          // Purple
      'booking_cancelled': '#F44336',    // Red
      'payment_confirmation': '#4CAF50'  // Green
    };
    return colorMap[type] || '#607D8B'; // Default gray
  };
  
  // Get icon based on notification type
  const getNotificationTypeIcon = (type) => {
    // Try to use the NotificationIcon component first, falling back to emojis if needed
    try {
      return <NotificationIcon type={type} />;
    } catch (err) {
      // Fallback to emojis if component fails
      switch(type) {
        case 'booking_confirmation':
          return <span role="img" aria-label="Confirmation">✓</span>;
        case 'booking_start':
          return <span role="img" aria-label="Info">ℹ️</span>;
        case 'booking_cancelled':
          return <span role="img" aria-label="Cancelled">❌</span>;
        case 'booking_expiry':
          return <span role="img" aria-label="Expiring">⏰</span>;
        case 'payment_confirmation':
          return <span role="img" aria-label="Payment">💰</span>;
        default:
          return <span role="img" aria-label="Notification">🔔</span>;
      }
    }
  };

  return (
    <div className={`notification-card ${!notification.is_read ? 'unread' : ''}`}>
      {/* Icon section */}
      <div className="notification-card-icon" style={{backgroundColor: `${getIconColor(notification.notification_type)}20`}}>
        {getNotificationTypeIcon(notification.notification_type)}
      </div>
      
      {/* Content section */}
      <div className="notification-card-content">
        <h3 className="notification-card-title">{notification.title}</h3>
        <p className="notification-card-message">{notification.message}</p>
        
        <div className="notification-meta">
          <span className="notification-time">{formattedDate}</span>
        </div>
        
        {!notification.is_read && (
          <div className="notification-card-actions">
            <button 
              className="mark-read-btn"
              onClick={() => onMarkAsRead(notification.id)}
            >
              Mark as read
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
