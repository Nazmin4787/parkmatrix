import http from './httpClient';

export async function getAvailableSlots() {
  const { data } = await http.get('/api/slots/available/');
  return data;
}

export async function createSlot({ slot_number, floor, is_occupied = false, vehicle_type = 'any', section = 'A', pos_x = 0, pos_y = 0, height_cm = 200, width_cm = 300, length_cm = 500 }) {
  const { data } = await http.post('/api/slots/', { 
    slot_number, 
    floor, 
    is_occupied, 
    vehicle_type, 
    section, 
    pos_x, 
    pos_y, 
    height_cm, 
    width_cm, 
    length_cm 
  });
  return data;
}

export async function listAllSlots() {
  const { data } = await http.get('/api/slots/');
  return data;
}

export async function listAvailableSlots(vehicleType = null) {
  let url = '/api/slots/available/';
  if (vehicleType) {
    url += `?vehicle_type=${vehicleType}`;
  }
  const { data } = await http.get(url);
  return data;
}

export async function getSlot(id) {
  const { data } = await http.get(`/api/slots/${id}/`);
  return data;
}

export async function updateSlot(id, { slot_number, floor, is_occupied }) {
  const { data } = await http.put(`/api/slots/${id}/`, { slot_number, floor, is_occupied });
  return data;
}

export async function deleteSlot(id) {
  await http.delete(`/api/slots/${id}/`);
}

export const findNearestSlot = async (lat = 19.205, lon = 73.156, vehicleType = null) => {
    try {
        const url = vehicleType 
            ? `/api/slots/find-nearest/?lat=${lat}&lon=${lon}&vehicle_type=${vehicleType}`
            : `/api/slots/find-nearest/?lat=${lat}&lon=${lon}`;
        const { data } = await http.get(url);
        return data;
    } catch (error) {
        console.error("Error finding the nearest slot:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
};

// Admin API functions for vehicle type management
export async function adminListSlots(vehicleType = null, parkingLot = null, parkingZone = null) {
    let url = '/api/admin/slots/';
    const params = new URLSearchParams();
    if (vehicleType) params.append('vehicle_type', vehicleType);
    if (parkingLot) params.append('parking_lot', parkingLot);
    if (parkingZone) params.append('parking_zone', parkingZone);
    if (params.toString()) url += `?${params.toString()}`;
    
    const { data } = await http.get(url);
    return data;
}

export async function adminCreateSlot(slotData) {
    const { data } = await http.post('/api/admin/slots/', slotData);
    return data;
}

export async function adminUpdateSlot(id, slotData) {
    const { data } = await http.patch(`/api/admin/slots/${id}/`, slotData);
    return data;
}

export async function adminDeleteSlot(id) {
    await http.delete(`/api/admin/slots/${id}/`);
}

export async function adminGetSlotStatistics() {
    const { data } = await http.get('/api/admin/slots/statistics/');
    return data;
}

export async function adminBulkUpdateSlots(slotIds, vehicleType) {
    const { data } = await http.post('/api/admin/slots/bulk-update/', {
        slot_ids: slotIds,
        vehicle_type: vehicleType
    });
    return data;
}


