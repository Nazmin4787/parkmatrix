import http from './httpClient';

// Service to manage a user's vehicles

/**
 * Fetches all vehicles belonging to the currently authenticated user.
 * @returns {Promise<Array>} A promise that resolves to an array of vehicle objects.
 */
export async function getMyVehicles() {
    const { data } = await http.get('/api/vehicles/');
    return data;
}

/**
 * Fetches a single vehicle by its ID.
 * @param {number} id - The ID of the vehicle to fetch.
 * @returns {Promise<Object>} A promise that resolves to the vehicle object.
 */
export async function getVehicleDetails(id) {
    const { data } = await http.get(`/api/vehicles/${id}/`);
    return data;
}

/**
 * Creates a new vehicle for the user.
 * @param {Object} vehicleData - The data for the new vehicle.
 * @param {string} vehicleData.number_plate
 * @param {string} vehicleData.vehicle_type - e.g., 'car', 'bike', 'suv'
 * @param {string} [vehicleData.model]
 * @param {string} [vehicleData.color]
 * @param {boolean} [vehicleData.is_default]
 * @returns {Promise<Object>} A promise that resolves to the newly created vehicle object.
 */
export async function createVehicle(vehicleData) {
    const { data } = await http.post('/api/vehicles/', vehicleData);
    return data;
}

/**
 * Updates an existing vehicle.
 * @param {number} id - The ID of the vehicle to update.
 * @param {Object} vehicleData - The updated data for the vehicle.
 * @returns {Promise<Object>} A promise that resolves to the updated vehicle object.
 */
export async function updateVehicle(id, vehicleData) {
    const { data } = await http.patch(`/api/vehicles/${id}/`, vehicleData);
    return data;
}

/**
 * Deletes a vehicle.
 * @param {number} id - The ID of the vehicle to delete.
 * @returns {Promise<void>} A promise that resolves when the vehicle is deleted.
 */
export async function deleteVehicle(id) {
    await http.delete(`/api/vehicles/${id}/`);
}

/**
 * Sets a vehicle as the user's default.
 * @param {number} id - The ID of the vehicle to set as default.
 * @returns {Promise<Object>} A promise that resolves to the updated vehicle object.
 */
export async function setDefaultVehicle(id) {
    const { data } = await http.post(`/api/vehicles/${id}/set_default/`);
    return data;
}

/**
 * Fetches the user's default vehicle.
 * @returns {Promise<Object|null>} A promise that resolves to the default vehicle object, or null if not found.
 */
export async function getDefaultVehicle() {
    try {
        const { data } = await http.get('/api/vehicles/default/');
        return data;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return null; // No default vehicle set
        }
        console.error("Error fetching default vehicle:", error);
        throw error;
    }
}
