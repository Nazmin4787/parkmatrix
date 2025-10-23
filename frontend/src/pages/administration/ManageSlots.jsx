import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  adminListSlots, 
  adminCreateSlot, 
  adminDeleteSlot, 
  adminGetSlotStatistics,
  adminBulkUpdateSlots 
} from '../../services/parkingSlot';
import { getParkingZones, getSlotsByZone } from '../../services/parkingZone';
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
  
  // Zone management state
  const [parkingZones, setParkingZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [zoneStats, setZoneStats] = useState(null);
  
  // Form state for new slot creation
  const [newSlot, setNewSlot] = useState({
    slot_number: '',
    floor: '1',
    section: 'A',
    vehicle_type: 'car',
    parking_zone: 'COLLEGE_PARKING_CENTER',
    pos_x: 0,
    pos_y: 0,
    height_cm: 200,
    width_cm: 300,
    length_cm: 500,
    parking_lot: null
  });
  
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState(false);

  // Load parking zones on component mount
  useEffect(() => {
    loadParkingZones();
  }, []);

  async function loadParkingZones() {
    try {
      const data = await getParkingZones();
      setParkingZones(data.zones || []);
    } catch (error) {
      console.error('Error loading parking zones:', error);
    }
  }

  async function load() {
    try {
      let data;
      
      // If a specific zone is selected, load slots for that zone
      if (selectedZone && selectedZone !== 'ALL') {
        // Use admin API with zone filter
        data = await adminListSlots(filterVehicleType, null, selectedZone);
        
        // Get zone data for stats
        try {
          const zoneData = await getSlotsByZone(selectedZone);
          setZoneStats({
            zone_name: zoneData.zone_name,
            total_slots: zoneData.total_slots,
            available_slots: zoneData.available_slots
          });
        } catch (error) {
          console.error('Error loading zone stats:', error);
          // Calculate stats from data
          setZoneStats({
            zone_name: selectedZone,
            total_slots: data.length,
            available_slots: data.filter(s => !s.is_occupied).length
          });
        }
      } else {
        // Load all slots
        data = await adminListSlots(filterVehicleType);
        setZoneStats(null);
      }
      
      setSlots(data);
      
      // Load statistics
      const stats = await adminGetSlotStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading slots:', error);
      setMessage('Failed to load slots');
    }
  }

  useEffect(() => { load(); }, [filterVehicleType, selectedZone]);

  async function addSlot(e) {
    e.preventDefault();
    setMessage('');
    
    console.log('Creating slot with data:', newSlot);
    
    try {
      const createdSlot = await adminCreateSlot(newSlot);
      console.log('Slot created:', createdSlot);
      
      // Get zone display name
      const zoneDisplay = {
        'COLLEGE_PARKING_CENTER': 'College Parking',
        'HOME_PARKING_CENTER': 'Home Parking',
        'METRO_PARKING_CENTER': 'Metro Parking',
        'VIVIVANA_PARKING_CENTER': 'Vivivana Parking'
      }[newSlot.parking_zone] || newSlot.parking_zone;
      
      setNewSlot({
        slot_number: '',
        floor: '1',
        section: 'A',
        vehicle_type: 'car',
        parking_zone: selectedZone !== 'ALL' ? selectedZone : 'COLLEGE_PARKING_CENTER',
        pos_x: 0,
        pos_y: 0,
        height_cm: 200,
        width_cm: 300,
        length_cm: 500,
        parking_lot: null
      });
      
      // Reload both zones and slots
      await Promise.all([loadParkingZones(), load()]);
      
      setMessage(`✅ Slot ${newSlot.slot_number} created successfully in ${zoneDisplay}`);
    } catch (error) {
      console.error('Create slot error:', error);
      console.error('Error response:', error.response?.data);
      setMessage('❌ Failed to create slot: ' + (error.response?.data?.detail || error.message));
    }
  }

  async function remove(id) {
    setMessage('');
    try {
      await adminDeleteSlot(id);
      await Promise.all([loadParkingZones(), load()]);
      setMessage('✅ Slot deleted successfully');
    } catch (error) {
      console.error('Delete slot error:', error);
      setMessage('❌ Failed to delete slot');
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
      await Promise.all([loadParkingZones(), load()]);
      setMessage(`✅ Updated ${selectedSlots.length} slots to ${bulkUpdateType} type`);
    } catch (error) {
      console.error('Bulk update error:', error);
      setMessage('❌ Failed to update slots');
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

  const openAddSlotModal = () => {
    // Set the zone to current selected zone when opening modal
    const zoneToSet = selectedZone !== 'ALL' ? selectedZone : 'COLLEGE_PARKING_CENTER';
    console.log('Opening Add Slot modal. Selected zone:', selectedZone, '→ Setting zone to:', zoneToSet);
    
    setNewSlot(prev => ({
      ...prev,
      parking_zone: zoneToSet
    }));
    setOpen(true);
  };

  return (
    <div>
      <h2>Manage Slots</h2>

      {/* Zone Statistics Cards */}
      {parkingZones.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>Parking Zones Overview</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {parkingZones.map(zone => (
              <div 
                key={zone.code}
                className={`stat-card ${selectedZone === zone.code ? 'active' : ''}`}
                onClick={() => setSelectedZone(zone.code)}
                style={{ 
                  cursor: 'pointer',
                  border: selectedZone === zone.code ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  backgroundColor: selectedZone === zone.code ? '#eff6ff' : '#fff',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>{zone.name}</h4>
                  <span style={{ 
                    fontSize: '11px', 
                    padding: '2px 6px', 
                    borderRadius: '4px',
                    backgroundColor: zone.occupancy_rate > 80 ? '#fee2e2' : zone.occupancy_rate > 50 ? '#fef3c7' : '#dcfce7',
                    color: zone.occupancy_rate > 80 ? '#991b1b' : zone.occupancy_rate > 50 ? '#92400e' : '#166534'
                  }}>
                    {zone.occupancy_rate.toFixed(0)}%
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  <div>Total: <strong>{zone.total_slots}</strong></div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                    <span style={{ color: '#16a34a' }}>✓ {zone.available_slots}</span>
                    <span style={{ color: '#dc2626' }}>✗ {zone.occupied_slots}</span>
                  </div>
                </div>
              </div>
            ))}
            <div 
              className={`stat-card ${selectedZone === 'ALL' ? 'active' : ''}`}
              onClick={() => setSelectedZone('ALL')}
              style={{ 
                cursor: 'pointer',
                border: selectedZone === 'ALL' ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                backgroundColor: selectedZone === 'ALL' ? '#eff6ff' : '#fff',
                transition: 'all 0.2s'
              }}
            >
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>All Zones</h4>
              <div style={{ fontSize: '12px', color: '#666' }}>
                <div>View all parking slots</div>
                <div style={{ marginTop: '4px', color: '#3b82f6', fontWeight: '500' }}>
                  {parkingZones.reduce((sum, z) => sum + z.total_slots, 0)} total slots
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Dashboard */}
      {statistics && (
        <div className="stats-dashboard" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div className="stat-card">
            <h3>Total Slots</h3>
            <p className="stat-number">{zoneStats ? zoneStats.total_slots : (statistics.total_slots || slots.length)}</p>
            {zoneStats && <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>in {zoneStats.zone_name}</p>}
          </div>
          <div className="stat-card">
            <h3>Available</h3>
            <p className="stat-number">{zoneStats ? zoneStats.available_slots : (statistics.available_slots || slots.filter(s => !s.is_occupied).length)}</p>
          </div>
          <div className="stat-card">
            <h3>Occupied</h3>
            <p className="stat-number">{zoneStats ? (zoneStats.total_slots - zoneStats.available_slots) : (statistics.occupied_slots || slots.filter(s => s.is_occupied).length)}</p>
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
        <button className="btn-primary small" onClick={openAddSlotModal}>Add Slot</button>
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
                  {s.parking_zone_display && (
                    <span style={{ 
                      marginLeft: '8px', 
                      fontSize: '11px', 
                      padding: '2px 8px', 
                      borderRadius: '12px',
                      backgroundColor: '#f3f4f6',
                      color: '#4b5563'
                    }}>
                      📍 {s.parking_zone_display}
                    </span>
                  )}
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
          <p>No slots found{selectedZone !== 'ALL' && zoneStats ? ` in ${zoneStats.zone_name}` : ''}</p>
          {filterVehicleType && (
            <p>Try changing the vehicle type filter or <button className="btn-link" onClick={() => setFilterVehicleType(null)}>show all slots</button></p>
          )}
          {selectedZone !== 'ALL' && (
            <p>
              <button className="btn-link" onClick={() => setSelectedZone('ALL')}>View all zones</button>
              {' or '}
              <button className="btn-primary small" onClick={openAddSlotModal}>Add a slot to this zone</button>
            </p>
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
          {/* Parking Zone Selection */}
          <label>Parking Zone
            <select 
              value={newSlot.parking_zone} 
              onChange={e => handleNewSlotChange('parking_zone', e.target.value)}
              required
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="COLLEGE_PARKING_CENTER">🏫 College Parking</option>
              <option value="HOME_PARKING_CENTER">🏠 Home Parking</option>
              <option value="METRO_PARKING_CENTER">🚇 Metro Parking</option>
              <option value="VIVIVANA_PARKING_CENTER">🏢 Vivivana Parking</option>
            </select>
          </label>

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



