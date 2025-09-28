import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  adminListSlots, 
  adminCreateSlot, 
  adminDeleteSlot, 
  adminGetSlotStatistics,
  adminBulkUpdateSlots 
} from '../../services/parkingSlot';
import VehicleTypeSelector from '../../UIcomponents/VehicleTypeSelector';
import Modal from '../../UIcomponents/Modal';
import Toast from '../../UIcomponents/Toast';
import '../../stylesheets/components.css';
import '../../stylesheets/vehicle-type-selector.css';

export default function ManageSlots() {
  const [slots, setSlots] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [filterVehicleType, setFilterVehicleType] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [bulkUpdateType, setBulkUpdateType] = useState('car');
  
  // Form state for new slot creation
  const [newSlot, setNewSlot] = useState({
    slot_number: '',
    floor: '1',
    section: 'A',
    vehicle_type: 'car',
    pos_x: 0,
    pos_y: 0,
    height_cm: 200,
    width_cm: 300,
    length_cm: 500,
    parking_lot: null
  });
  
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState(false);

  async function load() {
    try {
      const data = await adminListSlots(filterVehicleType);
      setSlots(data);
      
      // Load statistics
      const stats = await adminGetSlotStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading slots:', error);
      setMessage('Failed to load slots');
    }
  }

  useEffect(() => { load(); }, [filterVehicleType]);

  async function addSlot(e) {
    e.preventDefault();
    setMessage('');
    try {
      await adminCreateSlot(newSlot);
      setNewSlot({
        slot_number: '',
        floor: '1',
        section: 'A',
        vehicle_type: 'car',
        pos_x: 0,
        pos_y: 0,
        height_cm: 200,
        width_cm: 300,
        length_cm: 500,
        parking_lot: null
      });
      await load();
      setMessage('Slot created successfully');
    } catch (error) {
      console.error('Create slot error:', error);
      setMessage('Failed to create slot');
    }
  }

  async function remove(id) {
    setMessage('');
    try {
      await adminDeleteSlot(id);
      await load();
      setMessage('Slot deleted successfully');
    } catch (error) {
      console.error('Delete slot error:', error);
      setMessage('Failed to delete slot');
    }
  }

  async function bulkUpdateVehicleType() {
    if (selectedSlots.length === 0) {
      setMessage('Please select slots to update');
      return;
    }
    
    setMessage('');
    try {
      await adminBulkUpdateSlots(selectedSlots, bulkUpdateType);
      setSelectedSlots([]);
      await load();
      setMessage(`Updated ${selectedSlots.length} slots to ${bulkUpdateType} type`);
    } catch (error) {
      console.error('Bulk update error:', error);
      setMessage('Failed to update slots');
    }
  }

  const handleSlotSelection = (slotId, isSelected) => {
    if (isSelected) {
      setSelectedSlots(prev => [...prev, slotId]);
    } else {
      setSelectedSlots(prev => prev.filter(id => id !== slotId));
    }
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedSlots(slots.map(slot => slot.id));
    } else {
      setSelectedSlots([]);
    }
  };

  const handleNewSlotChange = (field, value) => {
    setNewSlot(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <h2>Manage Slots</h2>

      {/* Statistics Dashboard */}
      {statistics && (
        <div className="stats-dashboard" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div className="stat-card">
            <h3>Total Slots</h3>
            <p className="stat-number">{statistics.total_slots || slots.length}</p>
          </div>
          <div className="stat-card">
            <h3>Available</h3>
            <p className="stat-number">{statistics.available_slots || slots.filter(s => !s.is_occupied).length}</p>
          </div>
          <div className="stat-card">
            <h3>Occupied</h3>
            <p className="stat-number">{statistics.occupied_slots || slots.filter(s => s.is_occupied).length}</p>
          </div>
          <div className="stat-card">
            <h3>Selected</h3>
            <p className="stat-number">{selectedSlots.length}</p>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div style={{ marginBottom: '20px' }}>
        <VehicleTypeSelector
          selectedType={filterVehicleType}
          onTypeChange={setFilterVehicleType}
          showAllOption={true}
          label="Filter by Vehicle Type"
        />
      </div>

      <div className="row" style={{ marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
        <button className="btn-primary small" onClick={() => setOpen(true)}>Add Slot</button>
        <button className="btn-outline" onClick={load}>Refresh</button>
        
        {/* Bulk Actions */}
        {selectedSlots.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select 
                value={bulkUpdateType} 
                onChange={(e) => setBulkUpdateType(e.target.value)}
                style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="car">Car</option>
                <option value="suv">SUV</option>
                <option value="bike">Bike</option>
                <option value="truck">Truck</option>
                <option value="any">Any Vehicle</option>
              </select>
              <button className="btn-secondary small" onClick={bulkUpdateVehicleType}>
                Update Selected ({selectedSlots.length})
              </button>
            </div>
          </>
        )}
      </div>

      {/* Bulk Selection Controls */}
      <div style={{ marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="checkbox"
            checked={selectedSlots.length === slots.length && slots.length > 0}
            onChange={(e) => handleSelectAll(e.target.checked)}
          />
          Select All
        </label>
        {selectedSlots.length > 0 && (
          <button 
            className="btn-link small"
            onClick={() => setSelectedSlots([])}
          >
            Clear Selection
          </button>
        )}
      </div>

      {/* Slots List */}
      <ul className="list">
        {slots.map(s => (
          <li key={s.id} className="list-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="checkbox"
                checked={selectedSlots.includes(s.id)}
                onChange={(e) => handleSlotSelection(s.id, e.target.checked)}
              />
              <div style={{ flex: 1 }}>
                <div>
                  <strong>{s.slot_number}</strong> (Floor {s.floor}, Section {s.section})
                  {s.is_occupied && <span style={{ color: '#dc2626', marginLeft: '8px' }}>— Occupied</span>}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  <span className={`vehicle-type-badge ${s.vehicle_type}`}>
                    {s.vehicle_type === 'car' && '🚗'}
                    {s.vehicle_type === 'suv' && '🚙'}
                    {s.vehicle_type === 'bike' && '🏍️'}
                    {s.vehicle_type === 'truck' && '🚚'}
                    {s.vehicle_type === 'any' && '🅿️'}
                    {s.vehicle_type === 'car' ? 'Car' : 
                     s.vehicle_type === 'suv' ? 'SUV' : 
                     s.vehicle_type === 'bike' ? 'Bike' : 
                     s.vehicle_type === 'truck' ? 'Truck' : 'Any Vehicle'}
                  </span>
                  <span style={{ marginLeft: '12px' }}>
                    {s.width_cm}×{s.length_cm}×{s.height_cm} cm
                  </span>
                </div>
              </div>
              <div className="row">
                <Link to={`/admin/slots/${s.id}/edit`} className="btn-link small">Edit</Link>
                <button onClick={() => remove(s.id)} className="btn-link small" style={{ color: '#dc2626' }}>Delete</button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {slots.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>No slots found</p>
          {filterVehicleType && (
            <p>Try changing the vehicle type filter or <button className="btn-link" onClick={() => setFilterVehicleType(null)}>show all slots</button></p>
          )}
        </div>
      )}

      {/* Enhanced Add Slot Modal */}
      <Modal open={open} title="Add New Slot" onClose={() => setOpen(false)} footer={(
        <>
          <button className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary small" onClick={(e) => { addSlot(e); setOpen(false); }}>Create Slot</button>
        </>
      )}>
        <form onSubmit={addSlot} style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label>Slot Number
              <input 
                placeholder="e.g. A001" 
                value={newSlot.slot_number} 
                onChange={e => handleNewSlotChange('slot_number', e.target.value)} 
                required 
              />
            </label>
            <label>Floor
              <input 
                placeholder="e.g. 1" 
                value={newSlot.floor} 
                onChange={e => handleNewSlotChange('floor', e.target.value)} 
                required 
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label>Section
              <input 
                placeholder="e.g. A" 
                value={newSlot.section} 
                onChange={e => handleNewSlotChange('section', e.target.value)} 
                required 
              />
            </label>
            <label>Vehicle Type
              <select 
                value={newSlot.vehicle_type} 
                onChange={e => handleNewSlotChange('vehicle_type', e.target.value)}
              >
                <option value="car">🚗 Car</option>
                <option value="suv">🚙 SUV</option>
                <option value="bike">🏍️ Bike</option>
                <option value="truck">🚚 Truck</option>
                <option value="any">🅿️ Any Vehicle</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <label>Width (cm)
              <input 
                type="number" 
                placeholder="300" 
                value={newSlot.width_cm} 
                onChange={e => handleNewSlotChange('width_cm', parseInt(e.target.value) || 0)} 
              />
            </label>
            <label>Length (cm)
              <input 
                type="number" 
                placeholder="500" 
                value={newSlot.length_cm} 
                onChange={e => handleNewSlotChange('length_cm', parseInt(e.target.value) || 0)} 
              />
            </label>
            <label>Height (cm)
              <input 
                type="number" 
                placeholder="200" 
                value={newSlot.height_cm} 
                onChange={e => handleNewSlotChange('height_cm', parseInt(e.target.value) || 0)} 
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label>Position X
              <input 
                type="number" 
                placeholder="0" 
                value={newSlot.pos_x} 
                onChange={e => handleNewSlotChange('pos_x', parseInt(e.target.value) || 0)} 
              />
            </label>
            <label>Position Y
              <input 
                type="number" 
                placeholder="0" 
                value={newSlot.pos_y} 
                onChange={e => handleNewSlotChange('pos_y', parseInt(e.target.value) || 0)} 
              />
            </label>
          </div>
        </form>
      </Modal>

      <Toast 
        message={message} 
        type={/success|created|updated|deleted/i.test(message) ? 'success' : message ? 'error' : 'info'} 
        onClose={() => setMessage('')} 
      />
    </div>
  );
}



