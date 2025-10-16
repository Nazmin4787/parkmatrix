import React, { useState, useEffect } from 'react';
import { adminListSlots, adminCreateSlot, adminBulkUpdateSlots, adminDeleteSlot } from '../../services/parkingSlot';
import '../../stylesheets/admin.css';

// Component for slot management in admin panel
const SlotManagement = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [parkingLots, setParkingLots] = useState([]);
  
  // Form states
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState('any');
  
  // New slot form
  const [newSlot, setNewSlot] = useState({
    slot_number: '',
    floor: '1',
    section: 'A',
    vehicle_type: 'any',
    parking_lot: '',
    pos_x: 0,
    pos_y: 0,
    height_cm: 200,
    width_cm: 300,
    length_cm: 500
  });
  
  // Bulk creation form
  const [bulkCreate, setBulkCreate] = useState({
    prefix: 'A',
    start: 1,
    count: 10,
    floor: '1',
    parking_lot: '',
    vehicle_type: 'any'
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    vehicle_type: '',
    parking_lot: ''
  });

  // Fetch parking lots and slots on component mount
  useEffect(() => {
    fetchParkingLots();
    fetchSlots();
  }, []);
  
  // Re-fetch slots when filters change
  useEffect(() => {
    fetchSlots();
  }, [filters]);
  
  // Fetch parking lots
  const fetchParkingLots = async () => {
    try {
      const response = await fetch('/api/parking-lots/');
      const data = await response.json();
      setParkingLots(data);
      
      // Set default parking lot for forms if available
      if (data.length > 0) {
        setNewSlot(prev => ({ ...prev, parking_lot: data[0].id }));
        setBulkCreate(prev => ({ ...prev, parking_lot: data[0].id }));
      }
    } catch (err) {
      console.error('Error fetching parking lots:', err);
      setError('Failed to load parking lots');
    }
  };

  // Fetch slots with optional filters
  const fetchSlots = async () => {
    setLoading(true);
    try {
      const data = await adminListSlots(filters.vehicle_type, filters.parking_lot);
      setSlots(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching slots:', err);
      setError('Failed to load slots');
      setLoading(false);
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle new slot form changes
  const handleNewSlotChange = (e) => {
    const { name, value } = e.target;
    setNewSlot(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle bulk create form changes
  const handleBulkCreateChange = (e) => {
    const { name, value } = e.target;
    setBulkCreate(prev => ({ ...prev, [name]: value }));
  };
  
  // Submit new slot form
  const handleCreateSlot = async (e) => {
    e.preventDefault();
    setMessage(null);
    
    try {
      await adminCreateSlot(newSlot);
      setMessage('Slot created successfully!');
      
      // Reset form and refresh data
      setNewSlot({
        ...newSlot,
        slot_number: ''
      });
      fetchSlots();
    } catch (err) {
      console.error('Error creating slot:', err);
      setError(err.response?.data?.error || 'Failed to create slot');
    }
  };
  
  // Submit bulk create form
  const handleBulkCreate = async (e) => {
    e.preventDefault();
    setMessage(null);
    
    try {
      const { prefix, start, count, floor, parking_lot, vehicle_type } = bulkCreate;
      const startNum = parseInt(start);
      const countNum = parseInt(count);
      
      if (isNaN(startNum) || isNaN(countNum) || countNum <= 0) {
        setError('Invalid start or count values');
        return;
      }
      
      setMessage('Creating slots...');
      
      // Create slots one by one
      for (let i = 0; i < countNum; i++) {
        const slotNumber = `${prefix}${startNum + i}`;
        
        await adminCreateSlot({
          slot_number: slotNumber,
          floor,
          section: prefix,
          vehicle_type,
          parking_lot,
          pos_x: i % 10,
          pos_y: Math.floor(i / 10)
        });
      }
      
      setMessage(`Successfully created ${countNum} slots`);
      fetchSlots();
    } catch (err) {
      console.error('Error bulk creating slots:', err);
      setError(err.response?.data?.error || 'Failed to bulk create slots');
    }
  };
  
  // Handle slot selection
  const handleSlotSelect = (slotId) => {
    setSelectedSlots(prev => {
      if (prev.includes(slotId)) {
        return prev.filter(id => id !== slotId);
      } else {
        return [...prev, slotId];
      }
    });
  };
  
  // Handle bulk update of vehicle types
  const handleBulkUpdate = async () => {
    if (selectedSlots.length === 0) {
      setError('No slots selected');
      return;
    }
    
    try {
      await adminBulkUpdateSlots(selectedSlots, selectedVehicleType);
      setMessage(`Updated ${selectedSlots.length} slots to ${selectedVehicleType} type`);
      setSelectedSlots([]);
      fetchSlots();
    } catch (err) {
      console.error('Error updating slots:', err);
      setError(err.response?.data?.error || 'Failed to update slots');
    }
  };
  
  // Handle slot deletion
  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this slot? This action cannot be undone.')) {
      return;
    }
    
    try {
      await adminDeleteSlot(slotId);
      setMessage('Slot deleted successfully');
      fetchSlots();
    } catch (err) {
      console.error('Error deleting slot:', err);
      setError(err.response?.data?.error || 'Failed to delete slot');
    }
  };

  return (
    <div className="admin-slot-management">
      <h1>Parking Slot Management</h1>
      
      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}
      
      <div className="admin-section">
        <h2>Create New Slot</h2>
        <form onSubmit={handleCreateSlot} className="admin-form">
          <div className="form-group">
            <label>Slot Number:</label>
            <input 
              type="text" 
              name="slot_number" 
              value={newSlot.slot_number} 
              onChange={handleNewSlotChange}
              required
              placeholder="A1, B5, etc."
            />
          </div>
          
          <div className="form-group">
            <label>Floor:</label>
            <input 
              type="text" 
              name="floor" 
              value={newSlot.floor} 
              onChange={handleNewSlotChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Section:</label>
            <input 
              type="text" 
              name="section" 
              value={newSlot.section} 
              onChange={handleNewSlotChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Vehicle Type:</label>
            <select 
              name="vehicle_type" 
              value={newSlot.vehicle_type} 
              onChange={handleNewSlotChange}
            >
              <option value="car">Car</option>
              <option value="suv">SUV</option>
              <option value="bike">Bike</option>
              <option value="truck">Truck</option>
              <option value="any">Any Vehicle</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Parking Lot:</label>
            <select 
              name="parking_lot" 
              value={newSlot.parking_lot} 
              onChange={handleNewSlotChange}
              required
            >
              <option value="">Select Parking Lot</option>
              {parkingLots.map(lot => (
                <option key={lot.id} value={lot.id}>{lot.name}</option>
              ))}
            </select>
          </div>
          
          <button type="submit" className="btn-primary">Create Slot</button>
        </form>
      </div>
      
      <div className="admin-section">
        <h2>Bulk Create Slots</h2>
        <form onSubmit={handleBulkCreate} className="admin-form">
          <div className="form-group">
            <label>Section Prefix:</label>
            <input 
              type="text" 
              name="prefix" 
              value={bulkCreate.prefix} 
              onChange={handleBulkCreateChange}
              required
              placeholder="A, B, C, etc."
            />
          </div>
          
          <div className="form-group">
            <label>Start Number:</label>
            <input 
              type="number" 
              name="start" 
              value={bulkCreate.start} 
              onChange={handleBulkCreateChange}
              required
              min="1"
            />
          </div>
          
          <div className="form-group">
            <label>Number of Slots:</label>
            <input 
              type="number" 
              name="count" 
              value={bulkCreate.count} 
              onChange={handleBulkCreateChange}
              required
              min="1"
              max="100"
            />
          </div>
          
          <div className="form-group">
            <label>Floor:</label>
            <input 
              type="text" 
              name="floor" 
              value={bulkCreate.floor} 
              onChange={handleBulkCreateChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Vehicle Type:</label>
            <select 
              name="vehicle_type" 
              value={bulkCreate.vehicle_type} 
              onChange={handleBulkCreateChange}
            >
              <option value="car">Car</option>
              <option value="suv">SUV</option>
              <option value="bike">Bike</option>
              <option value="truck">Truck</option>
              <option value="any">Any Vehicle</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Parking Lot:</label>
            <select 
              name="parking_lot" 
              value={bulkCreate.parking_lot} 
              onChange={handleBulkCreateChange}
              required
            >
              <option value="">Select Parking Lot</option>
              {parkingLots.map(lot => (
                <option key={lot.id} value={lot.id}>{lot.name}</option>
              ))}
            </select>
          </div>
          
          <button type="submit" className="btn-primary">Bulk Create Slots</button>
        </form>
      </div>
      
      <div className="admin-section">
        <h2>Manage Existing Slots</h2>
        
        <div className="filter-section">
          <h3>Filters</h3>
          <div className="filter-form">
            <div className="form-group">
              <label>Vehicle Type:</label>
              <select 
                name="vehicle_type" 
                value={filters.vehicle_type} 
                onChange={handleFilterChange}
              >
                <option value="">All Types</option>
                <option value="car">Car</option>
                <option value="suv">SUV</option>
                <option value="bike">Bike</option>
                <option value="truck">Truck</option>
                <option value="any">Any Vehicle</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Parking Lot:</label>
              <select 
                name="parking_lot" 
                value={filters.parking_lot} 
                onChange={handleFilterChange}
              >
                <option value="">All Lots</option>
                {parkingLots.map(lot => (
                  <option key={lot.id} value={lot.id}>{lot.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {selectedSlots.length > 0 && (
          <div className="bulk-actions">
            <h3>Bulk Actions ({selectedSlots.length} slots selected)</h3>
            <div className="form-group">
              <label>Set Vehicle Type:</label>
              <select 
                value={selectedVehicleType} 
                onChange={(e) => setSelectedVehicleType(e.target.value)}
              >
                <option value="car">Car</option>
                <option value="suv">SUV</option>
                <option value="bike">Bike</option>
                <option value="truck">Truck</option>
                <option value="any">Any Vehicle</option>
              </select>
              <button onClick={handleBulkUpdate} className="btn-primary">Update Selected</button>
            </div>
          </div>
        )}
        
        {loading ? (
          <div>Loading slots...</div>
        ) : (
          <div className="slot-grid">
            <table>
              <thead>
                <tr>
                  <th><input 
                    type="checkbox" 
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSlots(slots.map(slot => slot.id));
                      } else {
                        setSelectedSlots([]);
                      }
                    }}
                    checked={selectedSlots.length === slots.length && slots.length > 0}
                  /></th>
                  <th>Slot ID</th>
                  <th>Slot Number</th>
                  <th>Floor</th>
                  <th>Section</th>
                  <th>Vehicle Type</th>
                  <th>Occupied</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {slots.map(slot => (
                  <tr key={slot.id} className={slot.is_occupied ? 'occupied' : ''}>
                    <td>
                      <input 
                        type="checkbox"
                        checked={selectedSlots.includes(slot.id)}
                        onChange={() => handleSlotSelect(slot.id)}
                      />
                    </td>
                    <td>{slot.id}</td>
                    <td>{slot.slot_number}</td>
                    <td>{slot.floor}</td>
                    <td>{slot.section}</td>
                    <td>{slot.vehicle_type}</td>
                    <td>{slot.is_occupied ? 'Yes' : 'No'}</td>
                    <td>
                      <button 
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="btn-danger"
                        disabled={slot.is_occupied}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {slots.length === 0 && (
                  <tr>
                    <td colSpan="8">No slots found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlotManagement;