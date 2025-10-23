import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CheckInForm.css';

export default function CheckInForm() {
  const [formData, setFormData] = useState({
    vehicle_plate: '',
    parking_zone: '',
    slot_id: '',
    user_id: '',
    vehicle_type: 'car',
    secret_code: '',
    notes: ''
  });

  const [slots, setSlots] = useState([]);
  const [filteredSlots, setFilteredSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [autoGenerateCode, setAutoGenerateCode] = useState(true);

  const parkingZones = [
    { value: 'COLLEGE_PARKING_CENTER', label: 'College Parking' },
    { value: 'HOME_PARKING_CENTER', label: 'Home Parking' },
    { value: 'METRO_PARKING_CENTER', label: 'Metro Parking' },
    { value: 'VIVIVANA_PARKING_CENTER', label: 'Vivivana Parking' }
  ];

  const vehicleTypes = [
    { value: 'car', label: 'Car' },
    { value: 'suv', label: 'SUV' },
    { value: 'bike', label: 'Bike' },
    { value: 'truck', label: 'Truck' }
  ];

  // Load available slots
  useEffect(() => {
    loadSlots();
  }, []);

  // Filter slots when parking zone changes
  useEffect(() => {
    if (formData.parking_zone) {
      const filtered = slots.filter(
        slot => slot.parking_zone === formData.parking_zone && !slot.is_occupied
      );
      setFilteredSlots(filtered);
    } else {
      setFilteredSlots([]);
    }
  }, [formData.parking_zone, slots]);

  async function loadSlots() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/slots/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSlots(response.data);
    } catch (err) {
      console.error('Failed to load slots:', err);
      setError('Failed to load parking slots');
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  function handleAutoGenerateToggle(e) {
    setAutoGenerateCode(e.target.checked);
    if (e.target.checked) {
      setFormData(prev => ({ ...prev, secret_code: '' }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Validation
    if (!formData.vehicle_plate.trim()) {
      setError('Vehicle plate number is required');
      setLoading(false);
      return;
    }

    if (!formData.slot_id) {
      setError('Please select a parking slot');
      setLoading(false);
      return;
    }

    if (!autoGenerateCode && formData.secret_code) {
      if (formData.secret_code.length !== 6 || !/^\d+$/.test(formData.secret_code)) {
        setError('Secret code must be exactly 6 digits');
        setLoading(false);
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      const submitData = {
        ...formData,
        secret_code: autoGenerateCode ? undefined : formData.secret_code || undefined
      };

      const response = await axios.post(
        'http://localhost:8000/api/admin/checkin/',
        submitData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccess(true);
      setGeneratedCode(response.data.secret_code);
      
      // Reload slots
      await loadSlots();

      // Reset form
      setFormData({
        vehicle_plate: '',
        parking_zone: '',
        slot_id: '',
        user_id: '',
        vehicle_type: 'car',
        secret_code: '',
        notes: ''
      });
      setAutoGenerateCode(true);

    } catch (err) {
      console.error('Check-in failed:', err);
      setError(err.response?.data?.error || 'Failed to check in vehicle');
    } finally {
      setLoading(false);
    }
  }

  function handleNewCheckIn() {
    setSuccess(false);
    setGeneratedCode('');
    setError('');
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(generatedCode);
    alert('Secret code copied to clipboard!');
  }

  function printCode() {
    const printWindow = window.open('', '', 'width=400,height=500');
    printWindow.document.write(`
      <html>
        <head>
          <title>Parking Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            .code { font-size: 48px; font-weight: bold; margin: 30px 0; letter-spacing: 5px; }
            .info { margin: 10px 0; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Parking Check-In Receipt</h2>
          <div class="info"><span class="label">Vehicle:</span> ${formData.vehicle_plate}</div>
          <div class="info"><span class="label">Date:</span> ${new Date().toLocaleString()}</div>
          <h3>Your Secret Code</h3>
          <div class="code">${generatedCode}</div>
          <p>Please keep this code safe. You will need it for check-out.</p>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  if (success && generatedCode) {
    return (
      <div className="checkin-form-container">
        <div className="success-display">
          <div className="success-icon">✓</div>
          <h2>Check-In Successful!</h2>
          
          <div className="secret-code-display">
            <h3>Secret Code</h3>
            <div className="code-large">{generatedCode}</div>
            <p className="code-subtitle">Please provide this code to the vehicle owner</p>
          </div>

          <div className="action-buttons">
            <button onClick={copyToClipboard} className="btn-secondary">
              📋 Copy Code
            </button>
            <button onClick={printCode} className="btn-secondary">
              🖨️ Print Receipt
            </button>
          </div>

          <div className="booking-details">
            <h4>Booking Details</h4>
            <div className="detail-row">
              <span className="label">Vehicle:</span>
              <span className="value">{formData.vehicle_plate}</span>
            </div>
            <div className="detail-row">
              <span className="label">Parking Zone:</span>
              <span className="value">
                {parkingZones.find(z => z.value === formData.parking_zone)?.label}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Slot:</span>
              <span className="value">
                {slots.find(s => s.id === parseInt(formData.slot_id))?.slot_number}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Time:</span>
              <span className="value">{new Date().toLocaleString()}</span>
            </div>
          </div>

          <button onClick={handleNewCheckIn} className="btn-primary">
            New Check-In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkin-form-container">
      <div className="form-header">
        <h2>Vehicle Check-In</h2>
        <p>Create a new parking booking</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="checkin-form">
        {/* Vehicle Plate */}
        <div className="form-group">
          <label htmlFor="vehicle_plate" className="required">
            Vehicle Plate Number
          </label>
          <input
            type="text"
            id="vehicle_plate"
            name="vehicle_plate"
            value={formData.vehicle_plate}
            onChange={handleChange}
            placeholder="e.g., KA01AB1234"
            className="form-control"
            required
          />
        </div>

        {/* Vehicle Type */}
        <div className="form-group">
          <label htmlFor="vehicle_type" className="required">
            Vehicle Type
          </label>
          <select
            id="vehicle_type"
            name="vehicle_type"
            value={formData.vehicle_type}
            onChange={handleChange}
            className="form-control"
            required
          >
            {vehicleTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Parking Zone */}
        <div className="form-group">
          <label htmlFor="parking_zone" className="required">
            Parking Zone
          </label>
          <select
            id="parking_zone"
            name="parking_zone"
            value={formData.parking_zone}
            onChange={handleChange}
            className="form-control"
            required
          >
            <option value="">Select parking zone...</option>
            {parkingZones.map(zone => (
              <option key={zone.value} value={zone.value}>
                {zone.label}
              </option>
            ))}
          </select>
        </div>

        {/* Parking Slot */}
        <div className="form-group">
          <label htmlFor="slot_id" className="required">
            Parking Slot
          </label>
          <select
            id="slot_id"
            name="slot_id"
            value={formData.slot_id}
            onChange={handleChange}
            className="form-control"
            disabled={!formData.parking_zone}
            required
          >
            <option value="">
              {formData.parking_zone ? 'Select slot...' : 'Select zone first...'}
            </option>
            {filteredSlots.map(slot => (
              <option key={slot.id} value={slot.id}>
                {slot.slot_number} - Floor {slot.floor}, Section {slot.section}
              </option>
            ))}
          </select>
          {formData.parking_zone && filteredSlots.length === 0 && (
            <small className="form-text text-warning">
              No available slots in this zone
            </small>
          )}
        </div>

        {/* User ID (Optional) */}
        <div className="form-group">
          <label htmlFor="user_id">
            User ID (Optional)
          </label>
          <input
            type="number"
            id="user_id"
            name="user_id"
            value={formData.user_id}
            onChange={handleChange}
            placeholder="Leave blank for guest"
            className="form-control"
          />
          <small className="form-text">
            Enter user ID if this is a registered user
          </small>
        </div>

        {/* Secret Code */}
        <div className="form-group">
          <div className="checkbox-wrapper">
            <input
              type="checkbox"
              id="auto_generate"
              checked={autoGenerateCode}
              onChange={handleAutoGenerateToggle}
            />
            <label htmlFor="auto_generate">
              Auto-generate secret code
            </label>
          </div>

          {!autoGenerateCode && (
            <input
              type="text"
              id="secret_code"
              name="secret_code"
              value={formData.secret_code}
              onChange={handleChange}
              placeholder="Enter 6-digit code"
              className="form-control"
              maxLength={6}
              pattern="\d{6}"
            />
          )}
          <small className="form-text">
            {autoGenerateCode
              ? 'System will generate a unique 6-digit code'
              : 'Enter a custom 6-digit code'}
          </small>
        </div>

        {/* Notes */}
        <div className="form-group">
          <label htmlFor="notes">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Additional notes..."
            className="form-control"
            rows={3}
          />
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Check-In Vehicle'}
          </button>
        </div>
      </form>
    </div>
  );
}
