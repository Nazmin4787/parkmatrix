import http from './httpClient';

export async function createBooking({ slot, vehicle, start_time, end_time, date, time, duration }) {
  console.log('Creating booking with parameters:', {
    slot, vehicle, start_time, end_time, date, time, duration
  });
  
  const bookingData = { 
    slot,
    vehicle
  };
  
  // Add datetime fields if provided - use start_time/end_time if available (preferred)
  if (start_time) {
    // Ensure date is properly formatted for API
    if (start_time instanceof Date) {
      bookingData.start_time = start_time.toISOString();
    } else {
      bookingData.start_time = start_time;
    }
  }
  
  if (end_time) {
    // Ensure date is properly formatted for API
    if (end_time instanceof Date) {
      bookingData.end_time = end_time.toISOString();
    } else {
      bookingData.end_time = end_time;
    }
  }
  
  // Legacy support for date/time/duration
  if (!start_time && date) {
    if (date instanceof Date) {
      bookingData.date = date.toISOString().split('T')[0];
    } else {
      bookingData.date = date;
    }
  }
  
  if (!start_time && time) bookingData.time = time;
  if (!end_time && duration) bookingData.duration = duration;
  
  console.log('Final booking data being sent to API:', bookingData);
  
  try {
    const { data } = await http.post('/api/bookings/', bookingData);
    console.log('Booking created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating booking:', error);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }
    throw error;
  }
}

export async function getUpcomingBookings() {
  const { data } = await http.get('/api/bookings/upcoming/');
  return data.upcoming_bookings || [];
}

export async function getPricePreview({ slot, vehicle, date, time, duration }) {
  const previewData = { slot };
  
  // Add optional fields if provided
  if (vehicle) previewData.vehicle = vehicle;
  if (date) previewData.date = date;
  if (time) previewData.time = time;
  if (duration) previewData.duration = duration;
  
  const { data } = await http.post('/api/bookings/price-preview/', previewData);
  return data;
}

export async function getUserBookings() {
  try {
    console.log('Getting user bookings...');
    const response = await http.get('/api/bookings/user/');
    console.log('User bookings response:', response);
    return response.data;
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }
}

export async function cancelBooking(id) {
  const { data } = await http.post(`/api/bookings/${id}/cancel/`);
  return data;
}

export async function listAllBookings({ active, email, slot, page, page_size, start_after, start_before } = {}) {
  const params = {};
  if (active !== undefined) params.active = String(Boolean(active));
  if (email) params.email = email;
  if (slot) params.slot = slot;
  if (page) params.page = page;
  if (page_size) params.page_size = page_size;
  if (start_after) params.start_after = start_after;
  if (start_before) params.start_before = start_before;
  const { data } = await http.get('/api/bookings/all/', { params });
  return data;
}

export async function adminCancelBooking(id) {
  const { data } = await http.post(`/api/bookings/${id}/admin-cancel/`);
  return data;
}

export async function getBookingPricePreview({ slot, date, time, duration, vehicle }) {
  const previewData = { slot };
  if (date) previewData.date = date;
  if (time) previewData.time = time;
  if (duration) previewData.duration = duration;
  if (vehicle) previewData.vehicle = vehicle;
  
  const { data } = await http.post('/api/bookings/price-preview/', previewData);
  return data;
}
