import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  adminGetRateById,
  adminCreateRate,
  adminUpdateRate,
  getVehicleTypeOptions,
  validateRateData
} from '../../services/pricingRate';
import Toast from '../../UIcomponents/Toast';
import './RateForm.css';

export default function RateForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [errors, setErrors] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    rate_name: '',
    description: '',
    vehicle_type: '2-wheeler',
    hourly_rate: '',
    daily_rate: '',
    weekend_rate: '',
    holiday_rate: '',
    time_slot_start: '',
    time_slot_end: '',
    special_rate: '',
    effective_from: '',
    effective_to: '',
    is_active: true,
    is_default: false
  });

  // Load existing rate in edit mode
  useEffect(() => {
    if (isEditMode) {
      loadRate();
    }
  }, [id]);

  async function loadRate() {
    try {
      const response = await adminGetRateById(id);
      const rate = response.data || response;
      
      setFormData({
        rate_name: rate.rate_name || '',
        description: rate.description || '',
        vehicle_type: rate.vehicle_type || '2-wheeler',
        hourly_rate: rate.hourly_rate || '',
        daily_rate: rate.daily_rate || '',
        weekend_rate: rate.weekend_rate || '',
        holiday_rate: rate.holiday_rate || '',
        time_slot_start: rate.time_slot_start || '',
        time_slot_end: rate.time_slot_end || '',
        special_rate: rate.special_rate || '',
        effective_from: rate.effective_from || '',
        effective_to: rate.effective_to || '',
        is_active: rate.is_active !== undefined ? rate.is_active : true,
        is_default: rate.is_default || false
      });
    } catch (error) {
      console.error('Error loading rate:', error);
      showMessage('Failed to load rate', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Handle form input changes
  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }

  // Show toast message
  function showMessage(msg, type = 'success') {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  }

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();
    
    // Validate form data
    const validation = validateRateData(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      showMessage('Please fix the errors in the form', 'error');
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      // Prepare data for API
      const payload = {
        ...formData,
        // Convert empty strings to null for all optional numeric fields
        hourly_rate: formData.hourly_rate || null,
        daily_rate: formData.daily_rate || null,
        weekend_rate: formData.weekend_rate || null,
        holiday_rate: formData.holiday_rate || null,
        time_slot_start: formData.time_slot_start || null,
        time_slot_end: formData.time_slot_end || null,
        special_rate: formData.special_rate || null,
        effective_from: formData.effective_from || null,
        effective_to: formData.effective_to || null
      };

      // Remove extension_rate_multiplier if empty (will use default from backend)
      if (!payload.extension_rate_multiplier) {
        delete payload.extension_rate_multiplier;
      }

      if (isEditMode) {
        await adminUpdateRate(id, payload);
        showMessage('Rate updated successfully', 'success');
      } else {
        await adminCreateRate(payload);
        showMessage('Rate created successfully', 'success');
      }

      setTimeout(() => navigate('/admin/rates'), 1500);
    } catch (error) {
      console.error('Error saving rate:', error);
      const errorMsg = error.response?.data?.message || 'Failed to save rate';
      showMessage(errorMsg, 'error');
      
      // Handle field-specific errors from API
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rate-form-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading rate...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rate-form-container">
      <div className="form-header">
        <h1>{isEditMode ? '✏️ Edit Rate' : '➕ Create New Rate'}</h1>
        <p className="subtitle">
          {isEditMode 
            ? 'Update parking rate information' 
            : 'Create a new parking rate for a vehicle type'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rate-form">
        {/* Basic Information Section */}
        <div className="form-section">
          <h3 className="section-title">Basic Information</h3>
          
          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="rate_name">
                Rate Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="rate_name"
                name="rate_name"
                value={formData.rate_name}
                onChange={handleChange}
                placeholder="e.g., Standard Weekday Rate"
                className={errors.rate_name ? 'error' : ''}
                required
              />
              {errors.rate_name && <span className="error-text">{errors.rate_name}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of this rate plan..."
                rows="3"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="vehicle_type">
                Vehicle Type <span className="required">*</span>
              </label>
              <select
                id="vehicle_type"
                name="vehicle_type"
                value={formData.vehicle_type}
                onChange={handleChange}
                className={errors.vehicle_type ? 'error' : ''}
                required
              >
                {getVehicleTypeOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.vehicle_type && <span className="error-text">{errors.vehicle_type}</span>}
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="form-section">
          <h3 className="section-title">Standard Rates</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="hourly_rate">
                Hourly Rate (₹) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="hourly_rate"
                name="hourly_rate"
                value={formData.hourly_rate}
                onChange={handleChange}
                placeholder="15.00"
                step="0.01"
                min="0"
                className={errors.hourly_rate ? 'error' : ''}
                required
              />
              {errors.hourly_rate && <span className="error-text">{errors.hourly_rate}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="daily_rate">
                Daily Rate (₹) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="daily_rate"
                name="daily_rate"
                value={formData.daily_rate}
                onChange={handleChange}
                placeholder="200.00"
                step="0.01"
                min="0"
                className={errors.daily_rate ? 'error' : ''}
                required
              />
              {errors.daily_rate && <span className="error-text">{errors.daily_rate}</span>}
            </div>
          </div>
        </div>

        {/* Special Rates Section */}
        <div className="form-section">
          <h3 className="section-title">Special Rates (Optional)</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="weekend_rate">Weekend Hourly Rate (₹)</label>
              <input
                type="number"
                id="weekend_rate"
                name="weekend_rate"
                value={formData.weekend_rate}
                onChange={handleChange}
                placeholder="20.00"
                step="0.01"
                min="0"
                className={errors.weekend_rate ? 'error' : ''}
              />
              {errors.weekend_rate && <span className="error-text">{errors.weekend_rate}</span>}
              <small className="helper-text">Applied on Saturdays and Sundays</small>
            </div>

            <div className="form-group">
              <label htmlFor="holiday_rate">Holiday Hourly Rate (₹)</label>
              <input
                type="number"
                id="holiday_rate"
                name="holiday_rate"
                value={formData.holiday_rate}
                onChange={handleChange}
                placeholder="25.00"
                step="0.01"
                min="0"
                className={errors.holiday_rate ? 'error' : ''}
              />
              {errors.holiday_rate && <span className="error-text">{errors.holiday_rate}</span>}
              <small className="helper-text">Applied on public holidays</small>
            </div>
          </div>
        </div>

        {/* Time Slot Rates Section */}
        <div className="form-section">
          <h3 className="section-title">Time Slot Special Rate (Optional)</h3>
          <p className="section-description">
            Define a special rate for a specific time period (e.g., peak hours)
          </p>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="time_slot_start">Start Time</label>
              <input
                type="time"
                id="time_slot_start"
                name="time_slot_start"
                value={formData.time_slot_start}
                onChange={handleChange}
                className={errors.time_slot_start ? 'error' : ''}
              />
              {errors.time_slot_start && <span className="error-text">{errors.time_slot_start}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="time_slot_end">End Time</label>
              <input
                type="time"
                id="time_slot_end"
                name="time_slot_end"
                value={formData.time_slot_end}
                onChange={handleChange}
                className={errors.time_slot_end ? 'error' : ''}
              />
              {errors.time_slot_end && <span className="error-text">{errors.time_slot_end}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="special_rate">Special Rate (₹)</label>
              <input
                type="number"
                id="special_rate"
                name="special_rate"
                value={formData.special_rate}
                onChange={handleChange}
                placeholder="30.00"
                step="0.01"
                min="0"
                className={errors.special_rate ? 'error' : ''}
              />
              {errors.special_rate && <span className="error-text">{errors.special_rate}</span>}
            </div>
          </div>
        </div>

        {/* Validity Period Section */}
        <div className="form-section">
          <h3 className="section-title">Validity Period (Optional)</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="effective_from">Effective From</label>
              <input
                type="date"
                id="effective_from"
                name="effective_from"
                value={formData.effective_from}
                onChange={handleChange}
                className={errors.effective_from ? 'error' : ''}
              />
              {errors.effective_from && <span className="error-text">{errors.effective_from}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="effective_to">Effective To</label>
              <input
                type="date"
                id="effective_to"
                name="effective_to"
                value={formData.effective_to}
                onChange={handleChange}
                className={errors.effective_to ? 'error' : ''}
              />
              {errors.effective_to && <span className="error-text">{errors.effective_to}</span>}
            </div>
          </div>
        </div>

        {/* Status Section */}
        <div className="form-section">
          <h3 className="section-title">Status</h3>
          
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
              <span>Active</span>
              <small className="helper-text">Make this rate available for use</small>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_default"
                checked={formData.is_default}
                onChange={handleChange}
              />
              <span>Set as Default</span>
              <small className="helper-text">Use this rate as the default for this vehicle type</small>
            </label>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/admin/rates')}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="spinner-small"></span>
                Saving...
              </>
            ) : (
              isEditMode ? 'Update Rate' : 'Create Rate'
            )}
          </button>
        </div>
      </form>

      {/* Toast Message */}
      {message && (
        <Toast message={message} type={messageType} onClose={() => setMessage('')} />
      )}
    </div>
  );
}
