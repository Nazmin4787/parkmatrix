/**
 * Long-Stay Vehicle Detection API Service
 * Handles all API calls related to long-stay vehicle monitoring
 */

import { http } from './httpClient';

/**
 * Get current list of long-stay vehicles
 * @returns {Promise<Object>} Long-stay detection results
 */
export const getLongStayVehicles = async () => {
  try {
    const response = await http.get('/api/admin/long-stay-vehicles/');
    return response.data;
  } catch (error) {
    console.error('Error fetching long-stay vehicles:', error);
    throw error;
  }
};

/**
 * Manually trigger long-stay detection
 * @returns {Promise<Object>} Detection results
 */
export const triggerLongStayDetection = async () => {
  try {
    const response = await http.post('/api/admin/long-stay-vehicles/detect/', {});
    return response.data;
  } catch (error) {
    console.error('Error triggering long-stay detection:', error);
    throw error;
  }
};

/**
 * Get scheduler status and scheduled jobs
 * @returns {Promise<Object>} Scheduler status
 */
export const getSchedulerStatus = async () => {
  try {
    const response = await http.get('/api/admin/scheduler/status/');
    return response.data;
  } catch (error) {
    console.error('Error fetching scheduler status:', error);
    throw error;
  }
};

/**
 * Format duration from hours to human-readable string
 * @param {number} hours - Duration in hours
 * @returns {string} Formatted duration (e.g., "1d 8h 30m")
 */
export const formatDuration = (hours) => {
  const days = Math.floor(hours / 24);
  const remainingHours = Math.floor(hours % 24);
  const minutes = Math.floor((hours % 1) * 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (remainingHours > 0) parts.push(`${remainingHours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);
  
  return parts.join(' ');
};

/**
 * Get alert level color
 * @param {string} level - Alert level (CRITICAL, WARNING)
 * @returns {string} CSS color class
 */
export const getAlertLevelColor = (level) => {
  switch (level) {
    case 'CRITICAL':
      return 'danger';
    case 'WARNING':
      return 'warning';
    default:
      return 'info';
  }
};

/**
 * Get alert level icon
 * @param {string} level - Alert level
 * @returns {string} Icon class
 */
export const getAlertLevelIcon = (level) => {
  switch (level) {
    case 'CRITICAL':
      return '🚨';
    case 'WARNING':
      return '⚡';
    default:
      return 'ℹ️';
  }
};
