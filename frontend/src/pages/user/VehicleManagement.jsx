import { useEffect, useState } from 'react';
import VehicleTypeSelector from '../../UIcomponents/VehicleTypeSelector';
import Modal from '../../UIcomponents/Modal';
import Toast from '../../UIcomponents/Toast';
import http from '../../services/httpClient';
import '../../stylesheets/vehicle-management.css';
import '../../stylesheets/vehicle-type-selector.css';

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState([]);
  const [message, setMessage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  
  const [vehicleForm, setVehicleForm] = useState({
    vehicle_type: 'car',
    number_plate: '',
    model: '',
    color: '',
    is_default: false
  });

  // Load user's vehicles
  async function loadVehicles() {
    try {
      const { data } = await http.get('/api/vehicles/list/');
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      setMessage('Failed to load vehicles');
    }
  }

  useEffect(() => {
    loadVehicles();
  }, []);

  // Add new vehicle
  async function addVehicle(e) {
    e.preventDefault();
    setMessage('');
    
    try {
      await http.post('/api/vehicles/', vehicleForm);
      setVehicleForm({
        vehicle_type: 'car',
        number_plate: '',
        model: '',
        color: '',
        is_default: false
      });
      setShowAddModal(false);
      await loadVehicles();
      setMessage('Vehicle added successfully');
    } catch (error) {
      console.error('Error adding vehicle:', error);
      setMessage('Failed to add vehicle');
    }
  }

  // Update vehicle
  async function updateVehicle(e) {
    e.preventDefault();
    setMessage('');
    
    try {
      await http.put(`/api/vehicles/${editingVehicle.id}/`, vehicleForm);
      setEditingVehicle(null);
      setVehicleForm({
        vehicle_type: 'car',
        number_plate: '',
        model: '',
        color: '',
        is_default: false
      });
      await loadVehicles();
      setMessage('Vehicle updated successfully');
    } catch (error) {
      console.error('Error updating vehicle:', error);
      setMessage('Failed to update vehicle');
    }
  }

  // Delete vehicle
  async function deleteVehicle(id) {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    
    setMessage('');
    try {
      await http.delete(`/api/vehicles/${id}/`);
      await loadVehicles();
      setMessage('Vehicle deleted successfully');
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      setMessage('Failed to delete vehicle');
    }
  }

  // Set as default vehicle
  async function setAsDefault(id) {
    setMessage('');
    try {
      const vehicle = vehicles.find(v => v.id === id);
      await http.put(`/api/vehicles/${id}/`, { ...vehicle, is_default: true });
      await loadVehicles();
      setMessage('Default vehicle updated');
    } catch (error) {
      console.error('Error setting default vehicle:', error);
      setMessage('Failed to set default vehicle');
    }
  }

  const handleFormChange = (field, value) => {
    setVehicleForm(prev => ({ ...prev, [field]: value }));
  };

  const openEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setVehicleForm({
      vehicle_type: vehicle.vehicle_type,
      number_plate: vehicle.number_plate,
      model: vehicle.model,
      color: vehicle.color,
      is_default: vehicle.is_default
    });
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingVehicle(null);
    setVehicleForm({
      vehicle_type: 'car',
      number_plate: '',
      model: '',
      color: '',
      is_default: false
    });
  };

  const getVehicleIcon = (type) => {
    const icons = {
      'car': '🚗',
      'suv': '🚙',
      'bike': '🏍️',
      'truck': '🚚'
    };
    return icons[type] || '🚗';
  };

  return (
    <div className="vehicle-management">
      <div className="vehicle-header">
        <h2>My Vehicles</h2>
        <button 
          className="btn-primary" 
          onClick={() => setShowAddModal(true)}
        >
          Add Vehicle
        </button>
      </div>

      {vehicles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🚗</div>
          <h3>No vehicles registered</h3>
          <p>Add your first vehicle to start booking parking slots</p>
          <button 
            className="btn-primary" 
            onClick={() => setShowAddModal(true)}
          >
            Add Vehicle
          </button>
        </div>
      ) : (
        <div className="vehicles-grid">
          {vehicles.map(vehicle => (
            <div key={vehicle.id} className={`vehicle-card ${vehicle.is_default ? 'default' : ''}`}>
              <div className="vehicle-card-header">
                <div className="vehicle-type">
                  <span className="vehicle-icon">{getVehicleIcon(vehicle.vehicle_type)}</span>
                  <span className="vehicle-type-label">
                    {vehicle.vehicle_type.charAt(0).toUpperCase() + vehicle.vehicle_type.slice(1)}
                  </span>
                </div>
                {vehicle.is_default && (
                  <span className="default-badge">Default</span>
                )}
              </div>
              
              <div className="vehicle-details">
                <div className="number-plate">{vehicle.number_plate}</div>
                <div className="vehicle-info">
                  <div className="model">{vehicle.model}</div>
                  {vehicle.color && (
                    <div className="color" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div 
                        className="color-swatch" 
                        style={{ 
                          width: '12px', 
                          height: '12px', 
                          borderRadius: '50%', 
                          backgroundColor: vehicle.color.toLowerCase(),
                          border: '1px solid #ddd'
                        }}
                      ></div>
                      {vehicle.color}
                    </div>
                  )}
                </div>
              </div>

              <div className="vehicle-actions">
                {!vehicle.is_default && (
                  <button 
                    className="btn-link small"
                    onClick={() => setAsDefault(vehicle.id)}
                  >
                    Set as Default
                  </button>
                )}
                <button 
                  className="btn-link small"
                  onClick={() => openEditModal(vehicle)}
                >
                  Edit
                </button>
                <button 
                  className="btn-link small danger"
                  onClick={() => deleteVehicle(vehicle.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Vehicle Modal */}
      <Modal 
        open={showAddModal || editingVehicle} 
        title={editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
        onClose={closeModal}
        footer={(
          <>
            <button className="btn-outline" onClick={closeModal}>Cancel</button>
            <button 
              className="btn-primary" 
              onClick={editingVehicle ? updateVehicle : addVehicle}
            >
              {editingVehicle ? 'Update' : 'Add'} Vehicle
            </button>
          </>
        )}
      >
        <form onSubmit={editingVehicle ? updateVehicle : addVehicle} className="vehicle-form">
          <VehicleTypeSelector
            selectedType={vehicleForm.vehicle_type}
            onTypeChange={(type) => handleFormChange('vehicle_type', type)}
            showAllOption={false}
            label="Vehicle Type"
          />

          <div className="form-row">
            <label>Number Plate *
              <input
                type="text"
                placeholder="e.g. ABC 1234"
                value={vehicleForm.number_plate}
                onChange={(e) => handleFormChange('number_plate', e.target.value)}
                required
              />
            </label>
          </div>

          <div className="form-row">
            <label>Model
              <input
                type="text"
                placeholder="e.g. Honda Civic"
                value={vehicleForm.model}
                onChange={(e) => handleFormChange('model', e.target.value)}
              />
            </label>
          </div>

          <div className="form-row">
            <label>Color
              <input
                type="text"
                placeholder="e.g. Red"
                value={vehicleForm.color}
                onChange={(e) => handleFormChange('color', e.target.value)}
              />
            </label>
          </div>

          <div className="form-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={vehicleForm.is_default}
                onChange={(e) => handleFormChange('is_default', e.target.checked)}
              />
              Set as default vehicle
            </label>
          </div>
        </form>
      </Modal>

      <Toast 
        message={message} 
        type={/success|added|updated|deleted/i.test(message) ? 'success' : message ? 'error' : 'info'} 
        onClose={() => setMessage('')} 
      />
    </div>
  );
}