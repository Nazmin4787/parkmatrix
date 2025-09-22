import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaClock, FaCarSide, FaMapMarkerAlt, FaReceipt, FaExclamationCircle } from 'react-icons/fa';
import { getUserNotifications, markNotificationAsRead } from '../../services/notification';
import { getUpcomingBookings } from '../../services/bookingslot';
import '../../stylesheets/notification-center.css';

/**
 * NotificationCenter - Enhanced notification display component
 * Shows rich interactive notifications with actions
 */
const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'upcoming', 'unread'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch notifications and upcoming bookings in parallel
      const [notificationsRes, upcomingRes] = await Promise.all([
        getUserNotifications(),
        fetchUpcomingBookings()
      ]);
      
      setNotifications(notificationsRes || []);
      setUpcomingBookings(upcomingRes || []);
    } catch (err) {
      console.error('Error fetching notification data:', err);
      setError('Failed to load notification data');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUpcomingBookings = async () => {
    try {
      const upcomingBookings = await getUpcomingBookings();
      return upcomingBookings;
    } catch (error) {
      console.error('Error fetching upcoming bookings:', error);
      return [];
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Get filtered notifications based on active tab
  const getFilteredItems = () => {
    switch (activeTab) {
      case 'upcoming':
        return upcomingBookings.map(booking => ({
          ...booking,
          type: 'upcoming_booking',
          id: `booking-${booking.id}`,
          created_at: booking.start_time,
          isBooking: true
        }));
      case 'unread':
        return notifications.filter(n => !n.is_read);
      default:
        // For 'all' tab, combine notifications with upcoming bookings at the top
        const bookingItems = upcomingBookings.map(booking => ({
          ...booking,
          type: 'upcoming_booking',
          id: `booking-${booking.id}`,
          created_at: booking.start_time,
          isBooking: true
        }));
        
        return [...bookingItems, ...notifications].sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
    }
  };

  const filteredItems = getFilteredItems();
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Render a single notification/booking item
  const renderNotificationItem = (item) => {
    const isBooking = item.isBooking;
    
    if (isBooking) {
      return renderUpcomingBooking(item);
    }
    
    // Handle regular notifications
    const { id, title, message, is_read, notification_type, created_at, additional_data = {} } = item;
    
    const getIcon = () => {
      switch (notification_type) {
        case 'booking_confirmation':
          return <FaCarSide className="notification-icon booking" />;
        case 'booking_reminder':
        case 'booking_reminder_24h':
        case 'booking_reminder_30m':
          return <FaClock className="notification-icon reminder" />;
        case 'payment_confirmation':
          return <FaReceipt className="notification-icon payment" />;
        case 'system_alert':
        case 'booking_error':
          return <FaExclamationCircle className="notification-icon alert" />;
        default:
          return <FaBell className="notification-icon" />;
      }
    };

    return (
      <motion.div
        key={id}
        className={`notification-item ${is_read ? 'read' : 'unread'}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="notification-content">
          {getIcon()}
          
          <div className="notification-details">
            <div className="notification-header">
              <h4>{title}</h4>
              <span className="notification-time">{formatTime(created_at)}</span>
            </div>
            
            <p>{message}</p>
            
            {/* Rich content based on notification type */}
            {renderRichNotificationContent(notification_type, additional_data)}
            
            <div className="notification-actions">
              {!is_read && (
                <button 
                  className="action-button mark-read" 
                  onClick={() => handleMarkAsRead(id)}
                >
                  Mark as read
                </button>
              )}
              
              {additional_data?.action_url && (
                <a 
                  href={additional_data.action_url} 
                  className="action-button action-link"
                >
                  {additional_data.action_name || 'View Details'}
                </a>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Render upcoming booking item
  const renderUpcomingBooking = (booking) => {
    const { id, slot, start_time, end_time, countdown_message } = booking;
    
    return (
      <motion.div
        key={`booking-${id}`}
        className="notification-item upcoming-booking"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="notification-content">
          <FaClock className="notification-icon upcoming" />
          
          <div className="notification-details">
            <div className="notification-header">
              <h4>Upcoming Booking</h4>
              <span className="notification-time">{formatTime(start_time)}</span>
            </div>
            
            <div className="upcoming-booking-details">
              <p><strong>Slot:</strong> {slot?.slot_number || 'N/A'}</p>
              <p><strong>Location:</strong> {slot?.parking_lot?.name || 'N/A'}</p>
              <p><strong>Time:</strong> {formatTimeRange(start_time, end_time)}</p>
              
              {countdown_message && (
                <div className="countdown-badge">
                  {countdown_message}
                </div>
              )}
            </div>
            
            <div className="notification-actions">
              <a 
                href={`/bookings/${id}`} 
                className="action-button action-link"
              >
                View Booking
              </a>
              
              {slot?.parking_lot && (
                <a 
                  href={`/directions?slot=${slot.id}`} 
                  className="action-button"
                >
                  <FaMapMarkerAlt /> Get Directions
                </a>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Render rich notification content based on type and additional data
  const renderRichNotificationContent = (type, data = {}) => {
    if (!data || Object.keys(data).length === 0) return null;
    
    switch (type) {
      case 'payment_confirmation':
        return (
          <div className="rich-notification payment-receipt">
            <div className="receipt-summary">
              <div className="receipt-row">
                <span>Amount:</span>
                <span className="receipt-amount">${parseFloat(data.total_amount).toFixed(2)}</span>
              </div>
              {data.receipt_id && (
                <div className="receipt-row">
                  <span>Receipt ID:</span>
                  <span>{data.receipt_id}</span>
                </div>
              )}
            </div>
          </div>
        );
        
      case 'booking_update':
      case 'booking_extension':
        return (
          <div className="rich-notification booking-update">
            {data.extension_price && (
              <div className="extension-details">
                <div className="extension-row">
                  <span>Additional Cost:</span>
                  <span>${parseFloat(data.extension_price).toFixed(2)}</span>
                </div>
                <div className="extension-row">
                  <span>New Total:</span>
                  <span>${parseFloat(data.new_total_price).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  // Helper function to format time
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  // Format time range for bookings
  const formatTimeRange = (start, end) => {
    if (!start || !end) return '';
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    return `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="notification-center">
      <div className="notification-center-header">
        <h2>Notifications</h2>
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button 
            className={`tab-button ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming ({upcomingBookings.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'unread' ? 'active' : ''}`}
            onClick={() => setActiveTab('unread')}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>
      </div>
      
      <div className="notification-center-content">
        {loading ? (
          <div className="notification-loading">
            <div className="spinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="notification-error">
            <FaExclamationCircle />
            <p>{error}</p>
            <button onClick={fetchData} className="retry-button">
              Retry
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="no-notifications">
            <div className="empty-icon">
              <FaBell />
            </div>
            <p>No notifications to display</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredItems.map(item => renderNotificationItem(item))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;