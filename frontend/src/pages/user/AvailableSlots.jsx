import { useEffect, useState } from 'react';
import { listAvailableSlots } from '../../services/parkingSlot';
import { createBooking } from '../../services/bookingslot';
import SlotCard from '../../UIcomponents/SlotCard';
import Modal from '../../UIcomponents/Modal';
import Toast from '../../UIcomponents/Toast';
import '../../stylesheets/slots.css';
import '../../stylesheets/booking-modal.css';

export default function AvailableSlots() {
  const [slots, setSlots] = useState([]);
  const [message, setMessage] = useState('');
  const [q, setQ] = useState('');
  const [floor, setFloor] = useState('');
  const [time, setTime] = useState('');
  const [confirm, setConfirm] = useState({ open: false, id: null });
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
    const data = await listAvailableSlots();
    setSlots(data);
  }

  useEffect(() => { load(); }, []);

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

  const filtered = slots.filter(s =>
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

  return (
    <div>
      <h2>Available Slots</h2>

      <div className="filters-bar">
        <input placeholder="Search slot code" value={q} onChange={e => setQ(e.target.value)} />
        <select value={floor} onChange={e => setFloor(e.target.value)}>
          <option value="">All floors</option>
          <option value="1">Floor 1</option>
          <option value="2">Floor 2</option>
          <option value="3">Floor 3</option>
        </select>
        <input type="time" value={time} onChange={e => setTime(e.target.value)} />
        <button className="btn-clear" onClick={() => { setQ(''); setFloor(''); setTime(''); }}>Reset</button>
      </div>

      <div className="slots-grid">
        {filtered.map(s => (
          <SlotCard key={s.id} slot={s} onBook={(id) => setConfirm({ open: true, id })} />
        ))}
      </div>

      <Modal
        open={confirm.open}
        title="Confirm Booking"
        onClose={() => setConfirm({ open: false, id: null })}
        footer={(
          <>
            <button className="btn-outline" onClick={() => setConfirm({ open: false, id: null })}>Cancel</button>
            <button 
              className="btn-primary small" 
              onClick={() => { 
                book(confirm.id, vehicleDetails, bookingDetails); 
                setConfirm({ open: false, id: null }); 
              }}
            >
              Confirm
            </button>
          </>
        )}
      >
        <h3>1. Select Your Parking Time</h3>
        <div className="booking-date-time">
          <div className="input-group">
            <label>Date:</label>
            <input 
              type="date" 
              value={bookingDetails.date ? bookingDetails.date.toISOString().split('T')[0] : ''} 
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => handleDateChange(new Date(e.target.value))} 
              required
            />
          </div>
          
          <div className="input-group">
            <label>Time:</label>
            <input 
              type="time" 
              value={bookingDetails.time} 
              onChange={(e) => handleTimeChange(e.target.value)} 
              required
            />
          </div>
          
          <div className="input-group">
            <label>Duration (hours):</label>
            <select 
              value={bookingDetails.duration} 
              onChange={(e) => handleDurationChange(Number(e.target.value))}
            >
              <option value="1">1 hour</option>
              <option value="2">2 hours</option>
              <option value="3">3 hours</option>
              <option value="4">4 hours</option>
              <option value="8">8 hours</option>
              <option value="12">12 hours</option>
              <option value="24">24 hours</option>
            </select>
          </div>
        </div>
        
        <h3>2. Enter Vehicle Details</h3>
        <div className="vehicle-form">
          <input 
            name="number_plate" 
            placeholder="Number Plate (required)" 
            value={vehicleDetails.number_plate} 
            onChange={handleVehicleChange} 
            required
          />
          <select name="vehicle_type" value={vehicleDetails.vehicle_type} onChange={handleVehicleChange}>
            <option value="car">Car</option>
            <option value="suv">SUV</option>
            <option value="bike">Bike</option>
          </select>
          <input name="model" placeholder="Model" value={vehicleDetails.model} onChange={handleVehicleChange} />
          <input name="color" placeholder="Color" value={vehicleDetails.color} onChange={handleVehicleChange} />
        </div>
        
        <div className="booking-summary">
          <h3>Booking Summary</h3>
          <p>
            <strong>Slot:</strong> {confirm.id ? slots.find(s => s.id === confirm.id)?.slot_number : 'N/A'}
          </p>
          <p>
            <strong>Duration:</strong> {bookingDetails.duration} hour(s)
          </p>
          <p>
            <strong>Estimated Price:</strong> ${(bookingDetails.duration * 5).toFixed(2)}
          </p>
        </div>
      </Modal>

      <Toast message={message} type={message === 'Booked!' ? 'success' : message ? 'error' : 'info'} onClose={() => setMessage('')} />
    </div>
  );
}


