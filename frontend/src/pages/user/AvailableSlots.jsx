import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listAvailableSlots } from '../../services/parkingSlot';
import { createBooking } from '../../services/bookingslot';
import SlotCard from '../../UIcomponents/SlotCard';
import VehicleTypeSelector from '../../UIcomponents/VehicleTypeSelector';
import Modal from '../../UIcomponents/Modal';
import Toast from '../../UIcomponents/Toast';
import { getMyVehicles, getDefaultVehicle } from '../../services/vehicle'; // Import vehicle services
import { getCurrentUser } from '../../store/userstore';
import '../../stylesheets/slots.css';
import '../../stylesheets/booking-modal.css';
import '../../stylesheets/vehicle-type-selector.css';

export default function AvailableSlots() {
  const navigate = useNavigate();
  const [slots, setSlots] = useState([]);
  const [message, setMessage] = useState('');
  const [q, setQ] = useState('');
  const [floor, setFloor] = useState('');
  const [time, setTime] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState(null);
  const [userDefaultVehicleType, setUserDefaultVehicleType] = useState(null); // State for user's default vehicle
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [authError, setAuthError] = useState(false);
  const [vehicleDetails, setVehicleDetails] = useState({
    number_plate: '',
    vehicle_type: 'car',
    model: '',
    color: '',
  });
  
  // Add state for booking date/time
  const [bookingDetails, setBookingDetails] = useState({
    date: new Date(),
    time: '',
    duration: 1,  // Default duration in hours
  });

  async function load() {
    setIsLoading(true); // Start loading
    setMessage('');
    setAuthError(false);
    
    // Check if user is logged in
    const user = getCurrentUser();
    if (!user) {
      console.log('No user logged in, redirecting to login page');
      setAuthError(true);
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('Loading available slots...');
      
      // Fetch user's default vehicle
      let defaultVehicle = null;
      try {
        defaultVehicle = await getDefaultVehicle();
        console.log('Default vehicle loaded:', defaultVehicle);
      } catch (vehicleError) {
        console.error('Error loading default vehicle:', vehicleError);
        if (vehicleError.response && vehicleError.response.status === 401) {
          setAuthError(true);
          setIsLoading(false);
          return;
        }
        // Continue without default vehicle for other errors
      }
      
      const vehicleType = defaultVehicle ? defaultVehicle.vehicle_type : null;
      setUserDefaultVehicleType(vehicleType);
      console.log('Set user default vehicle type:', vehicleType);

      // If no filter is selected, use the user's default vehicle type for the initial fetch
      const filterToUse = selectedVehicleType !== null ? selectedVehicleType : vehicleType;
      console.log('Using filter:', filterToUse);
      
      try {
        const data = await listAvailableSlots(filterToUse);
        console.log('Slots data received:', data);
        setSlots(Array.isArray(data) ? data : []);
      } catch (slotsError) {
        console.error('Error loading slots:', slotsError);
        if (slotsError.response && slotsError.response.status === 401) {
          setAuthError(true);
        } else {
          setMessage('Failed to load available slots. Please try again later.');
          setSlots([]);
        }
      }
    } catch (error) {
      console.error('Error loading slots or vehicle data:', error);
      setMessage('Failed to load available slots. Please try again later.');
      // Initialize slots to empty array if there was an error
      setSlots([]);
    } finally {
      setIsLoading(false); // Stop loading
    }
  }

  // Check if user is authenticated on component mount
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      console.log('User not authenticated, redirecting to login');
      navigate('/signin', { state: { from: '/slots' } });
    }
  }, [navigate]);

  // Load data on component mount and when vehicle type changes
  useEffect(() => { 
    console.log('AvailableSlots component mounted or selectedVehicleType changed:', selectedVehicleType);
    load(); 
  }, [selectedVehicleType]);
  
  // Redirect to login if authentication error occurs
  useEffect(() => {
    if (authError) {
      navigate('/signin', { state: { from: '/slots' } });
    }
  }, [authError, navigate]);

  const handleVehicleTypeChange = (vehicleType) => {
    setSelectedVehicleType(vehicleType);
    setVehicleDetails(prev => ({
      ...prev,
      vehicle_type: vehicleType || 'car'
    }));
  };

  async function book(id, vehicle, bookingInfo) {
    setMessage('');
    if (!vehicle.number_plate) {
      setMessage('Vehicle number plate is required.');
      return;
    }
    
    if (!bookingInfo.date || !bookingInfo.time) {
      setMessage('Please select a date and time for your booking.');
      return;
    }
    
    // Ensure the vehicle has all required fields
    const completeVehicle = {
      number_plate: vehicle.number_plate,
      vehicle_type: vehicle.vehicle_type || 'car',
      model: vehicle.model || 'Unknown',
      color: vehicle.color || ''
    };
    
    try {
      // Create booking with user-selected date and time
      // Parse the selected time (HH:MM format) and combine with date
      const [hours, minutes] = bookingInfo.time.split(':').map(Number);
      const startTime = new Date(bookingInfo.date);
      startTime.setHours(hours, minutes, 0, 0);
      
      // Calculate end time based on the selected duration
      const durationMs = bookingInfo.duration * 60 * 60 * 1000; // Convert hours to ms
      const endTime = new Date(startTime.getTime() + durationMs);
      
      await createBooking({ 
        slot: id, 
        vehicle: completeVehicle, 
        start_time: startTime, 
        end_time: endTime
      });
      
      setMessage('Booked!');
      await load();
    } catch (e) {
      console.error('Booking error:', e);
      setMessage(e?.response?.data?.vehicle?.number_plate?.[0] || 
                e?.response?.data?.non_field_errors?.[0] || 
                'Booking failed');
    }
  }

  // Make sure slots is an array before filtering
  const filtered = Array.isArray(slots) ? slots.filter(s =>
    (!q || String(s.slot_number).toLowerCase().includes(q.toLowerCase())) &&
    (!floor || String(s.floor) === floor)
  ) : [];

  const handleVehicleChange = (e) => {
    const { name, value } = e.target;
    setVehicleDetails(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle date, time, and duration changes
  const handleDateChange = (date) => {
    setBookingDetails(prev => ({ ...prev, date }));
  };
  
  const handleTimeChange = (time) => {
    setBookingDetails(prev => ({ ...prev, time }));
  };
  
  const handleDurationChange = (duration) => {
    setBookingDetails(prev => ({ ...prev, duration }));
  };

  function search(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return [];
    
    const columns = Object.keys(rows[0]);
    return rows.filter((row) =>
      columns.some(
        (column) =>
          row[column]?.toString().toLowerCase().indexOf(q.toLowerCase()) > -1
      )
    );
  }

  return (
    <div className="available-slots-page">
      <Toast message={message} onClose={() => setMessage('')} />
      <div className="page-header">
        <h1>Available Parking Slots</h1>
        <p>Select a vehicle type to find compatible slots.</p>
      </div>

      <div className="filters-container">
        <VehicleTypeSelector
          selectedType={selectedVehicleType}
          onTypeChange={handleVehicleTypeChange}
        />
        <input
          type="text"
          className="search-input"
          placeholder="Search slots..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="loading-indicator">Loading slots...</div>
      ) : !slots || slots.length === 0 ? (
        <div className="no-slots-message">
          No available slots match your criteria. Try a different vehicle type or check back later.
        </div>
      ) : (
        <div className="slots-grid">
          {search(slots).map((slot) => (
            <SlotCard
              key={slot.id}
              slot={slot}
              onBook={() => setConfirm({ open: true, id: slot.id })}
              disabled={confirm.open}
              userVehicleType={userDefaultVehicleType} // Pass user's default vehicle type
            />
          ))}
        </div>
      )}
      
      {/* Debug info - will show in development only */}
      {import.meta.env.DEV && (
        <div style={{ marginTop: '20px', padding: '10px', border: '1px dashed #ccc' }}>
          <h3>Debug Information</h3>
          <p>Loading state: {isLoading ? 'true' : 'false'}</p>
          <p>Selected vehicle type: {selectedVehicleType || 'none'}</p>
          <p>Default vehicle type: {userDefaultVehicleType || 'none'}</p>
          <p>Number of slots: {slots ? slots.length : 0}</p>
          <p>Number of filtered slots: {filtered ? filtered.length : 0}</p>
          {message && <p>Message: {message}</p>}
        </div>
      )}

      {confirm.open && (
        <Modal onClose={() => setConfirm({ open: false, id: null })}>
          <div className="booking-modal">
            <h2>Confirm Booking</h2>
            <p>Please provide your vehicle and booking details.</p>
            
            <div className="form-group">
              <label>Number Plate</label>
              <input
                type="text"
                value={vehicleDetails.number_plate}
                onChange={(e) =>
                  setVehicleDetails({ ...vehicleDetails, number_plate: e.target.value })
                }
                placeholder="e.g., MH-01-AB-1234"
              />
            </div>

            <div className="form-group">
              <label>Vehicle Model</label>
              <input
                type="text"
                value={vehicleDetails.model}
                onChange={(e) =>
                  setVehicleDetails({ ...vehicleDetails, model: e.target.value })
                }
                placeholder="e.g., Tesla Model 3"
              />
            </div>

            <div className="form-group">
              <label>Booking Date</label>
              <input 
                type="date"
                value={bookingDetails.date.toISOString().split('T')[0]}
                onChange={(e) => setBookingDetails({...bookingDetails, date: new Date(e.target.value)})}
                min={new Date().toISOString().split('T')[0]} // Prevent booking for past dates
              />
            </div>

            <div className="form-group">
              <label>Booking Time</label>
              <input 
                type="time"
                value={bookingDetails.time}
                onChange={(e) => setBookingDetails({...bookingDetails, time: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Duration (hours)</label>
              <input 
                type="number"
                min="1"
                value={bookingDetails.duration}
                onChange={(e) => setBookingDetails({...bookingDetails, duration: e.target.value})}
              />
            </div>

            <button
              className="confirm-booking-btn"
              onClick={() => {
                book(confirm.id, vehicleDetails, bookingDetails);
                setConfirm({ open: false, id: null });
              }}
            >
              Confirm and Book
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}


