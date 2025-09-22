import http from './httpClient';

export async function getAvailableSlots() {
  const { data } = await http.get('/api/slots/available/');
  return data;
}

export async function createSlot({ slot_number, floor, is_occupied = false }) {
  const { data } = await http.post('/api/slots/', { slot_number, floor, is_occupied });
  return data;
}

export async function listAllSlots() {
  const { data } = await http.get('/api/slots/');
  return data;
}

export async function listAvailableSlots() {
  const { data } = await http.get('/api/slots/available/');
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

export const findNearestSlot = async (current_x = 0, current_y = 0) => {
    try {
        const { data } = await http.get(`/api/parking/find_nearest/?pos_x=${current_x}&pos_y=${current_y}`);
        return data;
    } catch (error) {
        console.error("Error finding the nearest slot:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
};


