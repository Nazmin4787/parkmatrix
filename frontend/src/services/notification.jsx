import { http } from './httpClient';

// Notification Types Enum
export const NOTIFICATION_TYPES = {
  BOOKING_CONFIRMATION: 'booking_confirmation',
  UPCOMING_EXPIRY: 'booking_expiry',
  SESSION_START: 'booking_start',
  SESSION_END: 'booking_end',
  SLOT_AVAILABILITY: 'lot_available',
  OVERSTAY_WARNING: 'booking_expiry',
  PAYMENT_CONFIRMATION: 'payment_confirmation',
  OCCUPANCY_THRESHOLD: 'lot_full',
  BOOKING_MODIFICATION: 'booking_update',
  ACCESS_CONTROL: 'system_alert',
  PROMOTIONAL_OFFER: 'system_alert',
  UNAUTHORIZED_PARKING: 'system_alert'
};

// Priority levels for notifications
export const NOTIFICATION_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Map notification types to priorities
export const notificationPriorityMap = {
  'booking_confirmation': NOTIFICATION_PRIORITY.MEDIUM,
  'booking_expiry': NOTIFICATION_PRIORITY.HIGH,
  'booking_start': NOTIFICATION_PRIORITY.MEDIUM,
  'booking_end': NOTIFICATION_PRIORITY.MEDIUM,
  'lot_available': NOTIFICATION_PRIORITY.LOW,
  'payment_confirmation': NOTIFICATION_PRIORITY.MEDIUM,
  'lot_full': NOTIFICATION_PRIORITY.LOW,
  'booking_update': NOTIFICATION_PRIORITY.MEDIUM,
  'system_alert': NOTIFICATION_PRIORITY.HIGH,
  'booking_cancelled': NOTIFICATION_PRIORITY.MEDIUM,
  'booking_error': NOTIFICATION_PRIORITY.HIGH,
  'slot_reserved': NOTIFICATION_PRIORITY.MEDIUM,
  'account_update': NOTIFICATION_PRIORITY.MEDIUM,
  'payment_failed': NOTIFICATION_PRIORITY.HIGH,
  'payment_receipt': NOTIFICATION_PRIORITY.MEDIUM,
  'maintenance': NOTIFICATION_PRIORITY.HIGH
};

// Map sound effects to notification types
export const notificationSoundMap = {
  [NOTIFICATION_PRIORITY.LOW]: '/sounds/notification-low.mp3',
  [NOTIFICATION_PRIORITY.MEDIUM]: '/sounds/notification-medium.mp3',
  [NOTIFICATION_PRIORITY.HIGH]: '/sounds/notification-high.mp3',
  [NOTIFICATION_PRIORITY.URGENT]: '/sounds/notification-urgent.mp3'
};

// Fetch user notifications
export const getUserNotifications = async () => {
  try {
    const { data } = await http.get('/api/notifications/');
    return data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    const { data } = await http.post(`/api/notifications/${notificationId}/read/`);
    return data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Delete notification
export const deleteNotification = async (notificationId) => {
  try {
    await http.delete(`/api/notifications/${notificationId}/delete/`);
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Mark multiple notifications as read
export const markAllNotificationsAsRead = async () => {
  try {
    const { data } = await http.post('/api/notifications/mark_all_as_read/');
    return data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Get count of unread notifications
export const getUnreadNotificationsCount = async () => {
  try {
    const { data } = await http.get('/api/notifications/unread_count/', {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return data.unread_count;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

// Subscribe to push notifications
export const subscribeToPushNotifications = async () => {
  try {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notifications');
      return false;
    }
    
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // Register service worker for push notifications
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        
        try {
          // Get subscription
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            // The VAPID public key would come from your server
            applicationServerKey: urlBase64ToUint8Array(
              process.env.REACT_APP_VAPID_PUBLIC_KEY || 
              'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
            )
          });
          
          // Send the subscription to the server
          await http.post('/api/notifications/subscribe/', {
            subscription: JSON.stringify(subscription)
          });
          
          return true;
        } catch (error) {
          console.error('Error subscribing to push notifications:', error);
          return false;
        }
      }
    }
    
    return permission === 'granted';
  } catch (error) {
    console.error('Error in push notification subscription process:', error);
    return false;
  }
};

// Helper functions
export const getUnreadCount = (notifications) => {
  return notifications.filter(notif => !notif.is_read).length;
};

export const sortNotificationsByDate = (notifications) => {
  return [...notifications].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );
};

export const formatNotificationDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
};

export const getNotificationIcon = (notificationType) => {
  // This function will be implemented in NotificationIcons.jsx
  // We'll return null here as a placeholder
  return null;
};

export const getNotificationPriority = (notificationType) => {
  return notificationPriorityMap[notificationType] || NOTIFICATION_PRIORITY.MEDIUM;
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Play notification sound
export const playNotificationSound = (priority) => {
  const soundUrl = notificationSoundMap[priority] || notificationSoundMap[NOTIFICATION_PRIORITY.MEDIUM];
  const audio = new Audio(soundUrl);
  audio.play().catch(e => console.log('Audio playback prevented:', e));
};

// Show browser notification
export const showBrowserNotification = (title, options) => {
  if (!('Notification' in window)) {
    console.log('This browser does not support desktop notifications');
    return;
  }
  
  if (Notification.permission === 'granted') {
    new Notification(title, options);
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(title, options);
      }
    });
  }
};