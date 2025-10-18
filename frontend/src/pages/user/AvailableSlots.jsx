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
import '../../stylesheets/enhanced-booking-modal.css';

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
  const [userVehicles, setUserVehicles] = useState([]);
  const [bookingInProgress, setBookingInProgress] = useState(new Set());
  
  // Enhanced booking modal state
  const [enhancedModal, setEnhancedModal] = useState({ open: false, slotId: null });
  const [bookingForm, setBookingForm] = useState({
    date: new Date().toISOString().split('T')[0],
    duration: 2,
    numberPlate: '',
    vehicleType: 'car',
    model: '',
    color: ''
  });
  
  // Add state for booking date/time with better defaults
  const [bookingDetails, setBookingDetails] = useState({
    date: new Date(),
    time: new Date().getHours() + ':' + (new Date().getMinutes() < 10 ? '0' : '') + new Date().getMinutes(), // Default to current time
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
      
      // Fetch user's default vehicle and vehicles
      let defaultVehicle = null;
      let userVehicles = [];
      try {
        // First try to get user's default vehicle
        defaultVehicle = await getDefaultVehicle();
        console.log('Default vehicle loaded:', defaultVehicle);
        
        // Also fetch all user vehicles to populate the booking form later
        userVehicles = await getMyVehicles();
        console.log('User vehicles loaded:', userVehicles);
        
        // If we have vehicles but no default, use the first one
        if (!defaultVehicle && userVehicles && userVehicles.length > 0) {
          defaultVehicle = userVehicles[0];
          console.log('No default vehicle found, using first vehicle:', defaultVehicle);
        }
        
        // Store user vehicles in state
        setUserVehicles(userVehicles || []);
        
        // If we have default vehicle info, populate the vehicle details
        if (defaultVehicle) {
          setVehicleDetails({
            number_plate: defaultVehicle.number_plate || '',
            vehicle_type: defaultVehicle.vehicle_type || 'car',
            model: defaultVehicle.model || '',
            color: defaultVehicle.color || ''
          });
        }
      } catch (vehicleError) {
        console.error('Error loading vehicle data:', vehicleError);
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
        
        // Check if data has the correct structure and extract slots array
        if (data && data.slots && Array.isArray(data.slots)) {
          // If the API returns a structure with a 'slots' property
          setSlots(data.slots);
        } else if (Array.isArray(data)) {
          // If the API returns an array directly
          setSlots(data);
        } else {
          console.error('Unexpected data structure:', data);
          setSlots([]);
        }
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

  async function quickBook(slotId) {
    console.log('=== QUICK BOOK STARTED ===');
    console.log('Slot ID:', slotId);
    
    const user = getCurrentUser();
    if (!user || user.role !== 'customer') {
      setMessage('Only customers can make bookings.');
      return;
    }

    // Pre-populate form with user's default vehicle if available
    if (userVehicles && userVehicles.length > 0) {
      const defaultVehicle = userVehicles.find(v => v.is_default) || userVehicles[0];
      if (defaultVehicle) {
        setBookingForm(prev => ({
          ...prev,
          numberPlate: defaultVehicle.number_plate,
          vehicleType: defaultVehicle.vehicle_type,
          model: defaultVehicle.model || '',
          color: defaultVehicle.color || ''
        }));
      }
    } else {
      // Reset form if no vehicles available
      setBookingForm(prev => ({
        ...prev,
        numberPlate: '',
        vehicleType: 'car',
        model: '',
        color: ''
      }));
    }

    // Always open the enhanced booking modal - let user enter details
    console.log('Opening enhanced modal for slot:', slotId);
    console.log('Current enhancedModal state:', enhancedModal);
    setEnhancedModal({ open: true, slotId });
    console.log('Enhanced modal state should now be:', { open: true, slotId });
  }

  // Enhanced booking function that uses the form data
  async function performEnhancedBooking() {
    setMessage('');
    console.log('=== ENHANCED BOOKING STARTED ===');
    
    const user = getCurrentUser();
    if (!user || user.role !== 'customer') {
      setMessage('Only customers can make bookings.');
      return;
    }

    // Validate form data
    if (!bookingForm.numberPlate.trim()) {
      setMessage('Please enter vehicle number plate.');
      return;
    }

    if (!bookingForm.date) {
      setMessage('Please select a booking date.');
      return;
    }

    if (!bookingForm.duration || bookingForm.duration < 1 || bookingForm.duration > 24) {
      setMessage('Please select a valid duration (1-24 hours).');
      return;
    }

    // Set booking in progress
    const slotId = enhancedModal.slotId;
    const newBookingSet = new Set(bookingInProgress);
    newBookingSet.add(slotId);
    setBookingInProgress(newBookingSet);

    try {
      // Create start time from selected date (current time on selected date)
      const selectedDate = new Date(bookingForm.date);
      const now = new Date();
      const startTime = new Date(selectedDate);
      startTime.setHours(now.getHours(), now.getMinutes(), 0, 0);
      
      // If selected date is today and start time is in the past, add 5 minutes buffer
      if (selectedDate.toDateString() === now.toDateString() && startTime <= now) {
        startTime.setTime(now.getTime() + 5 * 60 * 1000);
      }

      // Calculate end time based on duration
      const endTime = new Date(startTime.getTime() + bookingForm.duration * 60 * 60 * 1000);

      const vehicleData = {
        number_plate: bookingForm.numberPlate.trim(),
        vehicle_type: bookingForm.vehicleType,
        model: bookingForm.model.trim() || 'Unknown',
        color: bookingForm.color.trim() || ''
      };

      const bookingData = {
        slot: parseInt(slotId),
        vehicle: vehicleData,
        start_time: startTime,
        end_time: endTime
      };

      console.log('Enhanced booking data:', bookingData);

      const result = await createBooking(bookingData);
      console.log('=== ENHANCED BOOKING SUCCESSFUL ===');
      console.log('Booking result:', result);

      setMessage(`✅ Booking successful! Slot booked for vehicle ${vehicleData.number_plate} for ${bookingForm.duration} hour(s) starting ${startTime.toLocaleTimeString()} on ${startTime.toDateString()}`);
      
      // Close modal and reload slots
      setEnhancedModal({ open: false, slotId: null });
      await load();
      
    } catch (error) {
      console.error('=== ENHANCED BOOKING ERROR ===');
      console.error('Error:', error);
      
      let errorMessage = 'Booking failed. ';
      if (error.response?.status === 403) {
        errorMessage = 'Permission denied. Please ensure you are logged in as a customer.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error.response?.data?.detail) {
        errorMessage += error.response.data.detail;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again later.';
      }
      
      setMessage(errorMessage);
    } finally {
      // Remove booking in progress
      const newBookingSet = new Set(bookingInProgress);
      newBookingSet.delete(slotId);
      setBookingInProgress(newBookingSet);
    }
  }

  // Form handlers
  const handleBookingFormChange = (field, value) => {
    setBookingForm(prev => ({ ...prev, [field]: value }));
  };

  const handleVehicleSelection = (vehicleId) => {
    const selectedVehicle = userVehicles.find(v => v.id === parseInt(vehicleId));
    if (selectedVehicle) {
      setBookingForm(prev => ({
        ...prev,
        vehicleId: selectedVehicle.id,
        numberPlate: selectedVehicle.number_plate,
        vehicleType: selectedVehicle.vehicle_type,
        model: selectedVehicle.model || '',
        color: selectedVehicle.color || ''
      }));
    } else {
      // Clear vehicle data if no vehicle selected
      setBookingForm(prev => ({
        ...prev,
        vehicleId: '',
        numberPlate: '',
        vehicleType: 'car',
        model: '',
        color: ''
      }));
    }
  };

  // Calculate estimated price (placeholder calculation)
  const calculatePrice = () => {
    const hourlyRate = 50; // Base rate per hour
    return bookingForm.duration * hourlyRate;
  };

  async function book(id, vehicle, bookingInfo) {
    setMessage('');
    console.log('=== BOOKING ATTEMPT STARTED ===');
    console.log('Attempting to book slot with ID:', id);
    console.log('Vehicle details:', vehicle);
    console.log('Booking details:', bookingInfo);
    console.log('Available slots:', slots);
    
    // Check user role first
    const user = getCurrentUser();
    console.log('Current user:', user);
    
    if (!user) {
      const errorMsg = 'Please log in to make a booking.';
      console.error(errorMsg);
      setMessage(errorMsg);
      navigate('/signin');
      return;
    }
    
    if (user.role !== 'customer') {
      const errorMsg = `Only customers can make bookings. Your role is '${user.role}'. Please log in with a customer account.`;
      console.error(errorMsg);
      setMessage(errorMsg);
      return;
    }
    
    // Check if user has a vehicle registered with plate number
    if (!vehicle.number_plate) {
      const errorMsg = 'Vehicle number plate is required. Please add your vehicle information first.';
      console.error(errorMsg);
      setMessage(errorMsg);
      // Redirect to vehicle management after 2 seconds
      setTimeout(() => {
        navigate('/vehicles');
      }, 2000);
      return;
    }
    
    // Validate time and date
    if (!bookingInfo.date) {
      const errorMsg = 'Please select a booking date.';
      console.error(errorMsg);
      setMessage(errorMsg);
      return;
    }
    
    if (!bookingInfo.time) {
      const errorMsg = 'Please select a booking time.';
      console.error(errorMsg);
      setMessage(errorMsg);
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
      console.log('Preparing booking data...');
      // Create booking with user-selected date and time
      // Parse the selected time (HH:MM format) and combine with date
      const [hours, minutes] = bookingInfo.time.split(':').map(Number);
      
      if (isNaN(hours) || isNaN(minutes)) {
        throw new Error('Invalid time format. Please use HH:MM format.');
      }
      
      // Create a proper date object
      let startTime;
      if (bookingInfo.date instanceof Date) {
        startTime = new Date(bookingInfo.date);
      } else {
        startTime = new Date(bookingInfo.date);
        if (isNaN(startTime.getTime())) {
          throw new Error('Invalid date format.');
        }
      }
      
      // Set hours and minutes
      startTime.setHours(hours, minutes, 0, 0);
      console.log('Start time set to:', startTime);
      
      // Calculate end time based on the selected duration
      const duration = Number(bookingInfo.duration);
      if (isNaN(duration) || duration <= 0) {
        throw new Error('Duration must be a positive number.');
      }
      
      const durationMs = duration * 60 * 60 * 1000; // Convert hours to ms
      const endTime = new Date(startTime.getTime() + durationMs);
      console.log('End time calculated as:', endTime);
      
      // Prepare booking data
      const bookingData = { 
        slot: id, 
        vehicle: completeVehicle, 
        start_time: startTime, 
        end_time: endTime
      };
      console.log('Sending booking request with data:', bookingData);
      
      // Create the booking
      const result = await createBooking(bookingData);
      console.log('=== BOOKING SUCCESSFUL ===');
      console.log('Booking response:', result);
      
      // Show success message with vehicle number plate and reload
      setMessage(`✅ Booking successful! Slot reserved for vehicle ${completeVehicle.number_plate}.`);
      await load();
    } catch (e) {
      console.error('=== BOOKING ERROR ===');
      console.error('Booking error:', e);
      
      // Detailed error logging to help diagnose issues
      if (e.response) {
        console.error('Error response status:', e.response.status);
        console.error('Error response data:', e.response.data);
        console.error('Error response headers:', e.response.headers);
      }
      
      // Provide a more user-friendly error message
      let errorMessage = 'Booking failed. ';
      
      // Handle specific error cases
      if (e.response?.status === 403) {
        errorMessage = 'Permission denied. Only customers can make bookings. Please log in with a customer account.';
      } else if (e.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (e.response?.data?.vehicle?.number_plate) {
        errorMessage += e.response.data.vehicle.number_plate[0];
      } else if (e.response?.data?.non_field_errors) {
        errorMessage += e.response.data.non_field_errors[0];
      } else if (e.response?.data?.detail) {
        errorMessage += e.response.data.detail;
      } else if (e.response?.data?.error) {
        errorMessage += e.response.data.error;
      } else if (e.message) {
        errorMessage += e.message;
      } else {
        errorMessage += 'Please try again later.';
      }
      
      setMessage(errorMessage);
    }
  }

  // Make sure slots is an array before filtering
  // First ensure slots is an array and properly structured
  const slotsArray = Array.isArray(slots) 
    ? slots 
    : (slots && slots.slots && Array.isArray(slots.slots)) 
        ? slots.slots 
        : [];
  
  const filtered = slotsArray.filter(s =>
    (!q || String(s.slot_number).toLowerCase().includes(q.toLowerCase())) &&
    (!floor || String(s.floor) === floor)
  );

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
        <p>Click "Quick Book" to open the booking form where you can select duration, date, and vehicle details. Make sure you have a vehicle registered first.</p>
        
        {/* User Role Indicator */}
        {(() => {
          const currentUser = getCurrentUser();
          if (currentUser) {
            const roleStyle = {
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '10px',
              backgroundColor: currentUser.role === 'customer' ? '#4CAF50' : '#ff9800',
              color: 'white'
            };
            return (
              <div style={roleStyle}>
                {currentUser.role === 'customer' 
                  ? `✅ Logged in as: ${currentUser.email} (Customer - Can book slots)`
                  : `⚠️ Logged in as: ${currentUser.email} (${currentUser.role} - Cannot book slots)`
                }
              </div>
            );
          }
          return null;
        })()}
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
      ) : !filtered || filtered.length === 0 ? (
        <div className="no-slots-message">
          No available slots match your criteria. Try a different vehicle type or check back later.
        </div>
      ) : (
        <div className="slots-grid">
          {search(filtered).map((slot) => (
            <SlotCard
              key={slot.id}
              slot={slot}
              onBook={() => quickBook(slot.id)}
              disabled={bookingInProgress.has(slot.id)}
              userVehicleType={userDefaultVehicleType} // Pass user's default vehicle type
            />
          ))}
        </div>
      )}

      {/* Enhanced Booking Modal */}
      {enhancedModal.open && (
        <Modal 
          open={true}
          onClose={() => setEnhancedModal({ open: false, slotId: null })}
        >
          <div className="booking-modal">
            <div className="booking-modal-header">
              <h2>Book Parking Slot {slots.find(s => s.id === enhancedModal.slotId)?.slot_number}</h2>
              <button 
                className="close-modal-btn" 
                onClick={() => setEnhancedModal({ open: false, slotId: null })}
              >
                &times;
              </button>
            </div>

            {/* Section 1: Select Parking Duration */}
            <div className="booking-section">
              <h3>1. Select Your Parking Duration</h3>
              <div className="time-row">
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={bookingForm.date}
                    onChange={(e) => handleBookingFormChange('date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label>Duration</label>
                  <select 
                    value={bookingForm.duration}
                    onChange={(e) => handleBookingFormChange('duration', parseInt(e.target.value))}
                  >
                    {Array.from({ length: 24 }, (_, i) => i + 1).map(hour => (
                      <option key={hour} value={hour}>
                        {hour} hour{hour > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Enter Vehicle Details */}
            <div className="booking-section">
              <h3>2. Enter Vehicle Details</h3>
              
              {/* Show message if no vehicles registered */}
              {(!userVehicles || userVehicles.length === 0) && (
                <div style={{ 
                  padding: '10px', 
                  backgroundColor: '#fff3cd', 
                  border: '1px solid #ffeaa7', 
                  borderRadius: '4px',
                  marginBottom: '15px',
                  fontSize: '14px',
                  color: '#856404'
                }}>
                  ℹ️ You don't have any vehicles registered. Please enter your vehicle details below or 
                  <button 
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#007bff', 
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '0 4px'
                    }}
                    onClick={() => {
                      setEnhancedModal({ open: false, slotId: null });
                      navigate('/vehicles');
                    }}
                  >
                    register a vehicle first
                  </button>.
                </div>
              )}

              <div className="vehicle-details-row">
                <div className="form-group">
                  <label>Number Plate *</label>
                  <input
                    type="text"
                    value={bookingForm.numberPlate}
                    onChange={(e) => handleBookingFormChange('numberPlate', e.target.value)}
                    placeholder="e.g., MH-01-AB-1234"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Vehicle Type</label>
                  <select 
                    value={bookingForm.vehicleType}
                    onChange={(e) => handleBookingFormChange('vehicleType', e.target.value)}
                  >
                    <option value="car">Car</option>
                    <option value="suv">SUV</option>
                    <option value="truck">Truck</option>
                    <option value="motorcycle">Motorcycle</option>
                    <option value="van">Van</option>
                  </select>
                </div>
              </div>

              <div className="vehicle-details-row">
                <div className="form-group">
                  <label>Model</label>
                  <input
                    type="text"
                    value={bookingForm.model}
                    onChange={(e) => handleBookingFormChange('model', e.target.value)}
                    placeholder="e.g., Tesla Model 3"
                  />
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <input
                    type="text"
                    value={bookingForm.color}
                    onChange={(e) => handleBookingFormChange('color', e.target.value)}
                    placeholder="e.g., Red"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Booking Summary */}
            <div className="booking-summary">
              <h3>3. Booking Summary</h3>
              <div className="summary-item">
                <span>Slot Number:</span>
                <span>{slots.find(s => s.id === enhancedModal.slotId)?.slot_number}</span>
              </div>
              <div className="summary-item">
                <span>Date:</span>
                <span>{bookingForm.date ? new Date(bookingForm.date).toLocaleDateString() : 'Not selected'}</span>
              </div>
              <div className="summary-item">
                <span>Duration:</span>
                <span>{bookingForm.duration} hour{bookingForm.duration > 1 ? 's' : ''}</span>
              </div>
              <div className="summary-item">
                <span>Vehicle:</span>
                <span>{bookingForm.numberPlate || 'Not entered'}</span>
              </div>
              <div className="summary-item">
                <span>Estimated Total:</span>
                <span>₹{calculatePrice()}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="booking-actions">
              <button
                className="cancel-booking-btn"
                onClick={() => setEnhancedModal({ open: false, slotId: null })}
              >
                Cancel
              </button>
              <button
                className="confirm-booking-btn"
                onClick={performEnhancedBooking}
                disabled={!bookingForm.numberPlate.trim() || !bookingForm.date || bookingInProgress.has(enhancedModal.slotId)}
              >
                {bookingInProgress.has(enhancedModal.slotId) ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {confirm.open && (
        <Modal 
          open={true}
          onClose={() => {
            // When modal is closed, reset the confirmation state completely
            setConfirm({ open: false, id: null });
          }}
        >
          <div className="booking-modal">
            <div className="booking-modal-header">
              <h2>Confirm Booking</h2>
              <button 
                className="close-modal-btn" 
                onClick={() => setConfirm({ open: false, id: null })}
              >
                &times;
              </button>
            </div>
            {userVehicles && userVehicles.length > 0 ? (
              <p>Please provide your booking details for Slot {slots.find(s => s.id === confirm.id)?.slot_number}.</p>
            ) : (
              <p className="warning-message">
                You don't have any vehicles registered. Please add vehicle information or 
                <button 
                  className="link-button" 
                  onClick={() => {
                    setConfirm({ open: false, id: null });
                    navigate('/vehicles');
                  }}
                >
                  register a vehicle first
                </button>.
              </p>
            )}
            
            {userVehicles && userVehicles.length > 0 ? (
            <div className="form-group">
              <label>Select Your Vehicle</label>
              <select 
                onChange={(e) => {
                  const selectedVehicle = userVehicles.find(v => v.id === parseInt(e.target.value));
                  if (selectedVehicle) {
                    setVehicleDetails({
                      number_plate: selectedVehicle.number_plate,
                      vehicle_type: selectedVehicle.vehicle_type,
                      model: selectedVehicle.model || '',
                      color: selectedVehicle.color || ''
                    });
                  }
                }}
                defaultValue={vehicleDetails.number_plate ? userVehicles.find(v => v.number_plate === vehicleDetails.number_plate)?.id : ''}
              >
                <option value="">-- Select a vehicle --</option>
                {userVehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.number_plate} ({vehicle.vehicle_type}{vehicle.model ? ` - ${vehicle.model}` : ''})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
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
            </>
          )}

            <div className="form-group">
              <label>Booking Date <span className="required-field">*</span></label>
              <input 
                type="date"
                value={bookingDetails.date instanceof Date ? bookingDetails.date.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const selectedDate = new Date(e.target.value);
                  console.log('Selected date:', selectedDate);
                  setBookingDetails({...bookingDetails, date: selectedDate});
                }}
                min={new Date().toISOString().split('T')[0]} // Prevent booking for past dates
                required
              />
            </div>

            <div className="form-group">
              <label>Booking Time <span className="required-field">*</span></label>
              <input 
                type="time"
                value={bookingDetails.time || ''}
                onChange={(e) => {
                  console.log('Selected time:', e.target.value);
                  setBookingDetails({...bookingDetails, time: e.target.value});
                }}
                required
              />
              <small className="form-hint">Select a time in 24-hour format (HH:MM)</small>
            </div>
            
            <div className="form-group">
              <label>Duration (hours) <span className="required-field">*</span></label>
              <input 
                type="number"
                min="1"
                max="24"
                value={bookingDetails.duration}
                onChange={(e) => {
                  const duration = Math.max(1, parseInt(e.target.value) || 1);
                  setBookingDetails({...bookingDetails, duration: duration});
                }}
                required
              />
              <small className="form-hint">Minimum 1 hour, maximum 24 hours</small>
            </div>

            <div className="booking-actions">
              <button
                className="cancel-booking-btn"
                onClick={() => {
                  setConfirm({ open: false, id: null });
                }}
              >
                Cancel
              </button>
              <button
                className="confirm-booking-btn"
                onClick={() => {
                  // First validate all required fields
                  if (!vehicleDetails.number_plate) {
                    setMessage('Vehicle number plate is required');
                    return;
                  }
                  
                  if (!bookingDetails.date) {
                    setMessage('Please select a booking date');
                    return;
                  }
                  
                  if (!bookingDetails.time) {
                    setMessage('Please select a booking time');
                    return;
                  }
                  
                  if (!bookingDetails.duration || bookingDetails.duration < 1) {
                    setMessage('Please enter a valid duration (minimum 1 hour)');
                    return;
                  }
                  
                  // All validation passed, proceed with booking
                  console.log('=== MODAL CONFIRM CLICKED ===');
                  console.log('Slot ID:', confirm.id);
                  console.log('Vehicle details:', vehicleDetails);
                  console.log('Booking details:', bookingDetails);
                  
                  try {
                    // Pass the vehicle and booking details to the booking function
                    book(confirm.id, vehicleDetails, bookingDetails);
                    // Close the modal and reset the confirmation state
                    setConfirm({ open: false, id: null });
                  } catch (error) {
                    console.error('Error in booking process:', error);
                    // Don't close the modal if there's an error
                  }
                }}
              >
                Confirm and Book
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}


