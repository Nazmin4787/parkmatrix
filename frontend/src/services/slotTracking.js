import http from './httpClient';

// Get summary statistics for all slots
export async function getSlotStatistics() {
  const { data } = await http.get('/api/slots/statistics/');
  return data;
}

// Get detailed information on all slots with status
export async function getDetailedSlotStatus() {
  const { data } = await http.get('/api/slots/detailed-status/');
  return data;
}

// Get active bookings with vehicle and user information
export async function getActiveBookings() {
  const { data } = await http.get('/api/bookings/active-with-details/');
  return data;
}

// Filter slots by status (free/occupied)
export async function getSlotsByStatus(status) {
  const { data } = await http.get(`/api/slots/filter/?status=${status}`);
  return data;
}

// Get real-time updates for slot status (for polling)
export async function getSlotUpdates(lastUpdateTime) {
  const { data } = await http.get(`/api/slots/updates/?since=${lastUpdateTime}`);
  return data;
}