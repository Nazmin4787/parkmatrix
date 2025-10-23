import React, { useState, useEffect } from 'react';
import {
  getZonePricingRateSummary,
  getZonePricingRates,
  createZonePricingRate,
  updateZonePricingRate,
  deleteZonePricingRate,
  PARKING_ZONE_CHOICES,
  VEHICLE_TYPE_CHOICES,
  formatCurrency,
} from '../../services/zonePricing';
import './ZonePricingManagement.css';

const ZonePricingManagement = () => {
  const [loading, setLoading] = useState(true);
  const [zoneSummary, setZoneSummary] = useState([]);
  const [allRates, setAllRates] = useState([]);
  const [selectedTab, setSelectedTab] = useState('byZone');
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [currentRate, setCurrentRate] = useState(null);
  const [filters, setFilters] = useState({
    parking_zone: '',
    vehicle_type: '',
    is_active: '',
  });
  
  const [formData, setFormData] = useState({
    parking_zone: '',
    vehicle_type: '',
    rate_name: '',
    description: '',
    hourly_rate: '',
    daily_rate: '',
    weekend_rate: '',
    is_active: true,
  });

  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryData, ratesData] = await Promise.all([
        getZonePricingRateSummary(),
        getZonePricingRates(),
      ]);
      
      console.log('Loaded summary data:', summaryData);
      console.log('Loaded rates data:', ratesData);
      
      setZoneSummary(summaryData.summary || []);
      setAllRates(ratesData.results || ratesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('Failed to load zone pricing data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadFilteredRates = async () => {
    setLoading(true);
    try {
      const activeFilters = {};
      if (filters.parking_zone) activeFilters.parking_zone = filters.parking_zone;
      if (filters.vehicle_type) activeFilters.vehicle_type = filters.vehicle_type;
      if (filters.is_active !== '') activeFilters.is_active = filters.is_active;

      const ratesData = await getZonePricingRates(activeFilters);
      setAllRates(ratesData.results || []);
    } catch (error) {
      showNotification('Failed to filter rates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setDialogMode('create');
    setCurrentRate(null);
    setFormData({
      parking_zone: '',
      vehicle_type: '',
      rate_name: '',
      description: '',
      hourly_rate: '',
      daily_rate: '',
      weekend_rate: '',
      is_active: true,
    });
    setShowDialog(true);
  };

  const handleOpenEditDialog = (rate) => {
    setDialogMode('edit');
    setCurrentRate(rate);
    setFormData({
      parking_zone: rate.parking_zone,
      vehicle_type: rate.vehicle_type,
      rate_name: rate.rate_name,
      description: rate.description || '',
      hourly_rate: rate.hourly_rate,
      daily_rate: rate.daily_rate,
      weekend_rate: rate.weekend_rate || '',
      is_active: rate.is_active,
    });
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setCurrentRate(null);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked} = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.parking_zone || !formData.vehicle_type || !formData.rate_name || 
          !formData.hourly_rate || !formData.daily_rate) {
        showNotification('Please fill in all required fields', 'error');
        return;
      }

      // Check for duplicate rate (only in create mode)
      if (dialogMode === 'create') {
        const isDuplicate = allRates.some(rate => 
          rate.parking_zone === formData.parking_zone && 
          rate.vehicle_type === formData.vehicle_type && 
          rate.is_active === formData.is_active
        );
        
        if (isDuplicate) {
          showNotification(
            `A ${formData.is_active ? 'active' : 'inactive'} rate for ${formData.vehicle_type} in ${formData.parking_zone} already exists. Please edit the existing rate or change the status.`,
            'error'
          );
          return;
        }
      }

      const rateData = {
        ...formData,
        hourly_rate: parseFloat(formData.hourly_rate),
        daily_rate: parseFloat(formData.daily_rate),
        weekend_rate: formData.weekend_rate ? parseFloat(formData.weekend_rate) : null,
      };

      if (dialogMode === 'create') {
        const newRate = await createZonePricingRate(rateData);
        console.log('Created rate:', newRate);
        showNotification('Zone pricing rate created successfully', 'success');
      } else {
        await updateZonePricingRate(currentRate.id, rateData);
        showNotification('Zone pricing rate updated successfully', 'success');
      }

      handleCloseDialog();
      await loadData();
    } catch (error) {
      console.error('Error saving rate:', error);
      let errorMessage = 'Failed to save rate';
      
      if (error.response?.data) {
        if (error.response.data.non_field_errors) {
          errorMessage = error.response.data.non_field_errors[0];
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (typeof error.response.data === 'object') {
          // Handle field-specific errors
          const errors = Object.entries(error.response.data)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs[0] : msgs}`)
            .join(', ');
          errorMessage = errors || errorMessage;
        }
      }
      
      showNotification(errorMessage, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rate?')) {
      return;
    }

    try {
      await deleteZonePricingRate(id);
      showNotification('Zone pricing rate deleted successfully', 'success');
      loadData();
    } catch (error) {
      showNotification('Failed to delete rate', 'error');
    }
  };

  const handleClearFilters = () => {
    setFilters({
      parking_zone: '',
      vehicle_type: '',
      is_active: '',
    });
    loadData();
  };

  const showNotification = (message, type) => {
    setNotification({
      show: true,
      message,
      type,
    });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 5000);
  };

  const getVehicleTypeColor = (type) => {
    const colors = {
      car: 'primary',
      bike: 'info',
      suv: 'secondary',
      truck: 'warning',
    };
    return colors[type] || 'default';
  };

  return (
    <div className="zone-pricing-management">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>💰 Zone Pricing Management</h1>
          <p className="header-subtitle">Manage parking rates for different zones and vehicle types</p>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={loadData}>
            🔄 Refresh
          </button>
          <button className="btn-primary" onClick={handleOpenCreateDialog}>
            ➕ Create New Rate
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification.show && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
          <button onClick={() => setNotification({ ...notification, show: false })}>×</button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading zone pricing data...</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab ${selectedTab === 'byZone' ? 'active' : ''}`}
              onClick={() => setSelectedTab('byZone')}
            >
              📍 By Zone
            </button>
            <button
              className={`tab ${selectedTab === 'allRates' ? 'active' : ''}`}
              onClick={() => setSelectedTab('allRates')}
            >
              📋 All Rates
            </button>
          </div>

          {/* By Zone Tab */}
          {selectedTab === 'byZone' && (
            <div className="zone-cards">
              {zoneSummary.map((zone) => (
                <div key={zone.zone_code} className="zone-card">
                  <div className="zone-header">
                    <h3>{zone.zone_name}</h3>
                    <span className="badge badge-primary">{zone.rate_count} rates</span>
                  </div>
                  <div className="zone-table-wrapper">
                    <table className="zone-table">
                      <thead>
                        <tr>
                          <th>Vehicle</th>
                          <th>Rate Name</th>
                          <th className="text-right">Hourly</th>
                          <th className="text-right">Daily</th>
                          <th className="text-right">Weekend</th>
                          <th>Status</th>
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {zone.rates.map((rate) => (
                          <tr key={rate.id}>
                            <td>
                              <span className={`badge badge-${getVehicleTypeColor(rate.vehicle_type)}`}>
                                {rate.vehicle_type_display}
                              </span>
                            </td>
                            <td>{rate.rate_name}</td>
                            <td className="text-right rate-amount success">
                              {formatCurrency(rate.hourly_rate)}/hr
                            </td>
                            <td className="text-right rate-amount primary">
                              {formatCurrency(rate.daily_rate)}/day
                            </td>
                            <td className="text-right">
                              {rate.weekend_rate ? formatCurrency(rate.weekend_rate) + '/hr' : '—'}
                            </td>
                            <td>
                              <span className={`badge ${rate.is_active ? 'badge-success' : 'badge-default'}`}>
                                {rate.is_active ? '✓ Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="text-center">
                              <button
                                className="icon-btn btn-edit"
                                onClick={() => handleOpenEditDialog(rate)}
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                className="icon-btn btn-delete"
                                onClick={() => handleDelete(rate.id)}
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* All Rates Tab */}
          {selectedTab === 'allRates' && (
            <div className="all-rates-section">
              {/* Filters */}
              <div className="filters-card">
                <h4>🔍 Filters</h4>
                <div className="filters-grid">
                  <div className="form-group">
                    <label>Parking Zone</label>
                    <select
                      value={filters.parking_zone}
                      onChange={(e) => setFilters({ ...filters, parking_zone: e.target.value })}
                    >
                      <option value="">All Zones</option>
                      {PARKING_ZONE_CHOICES.map((zone) => (
                        <option key={zone.value} value={zone.value}>
                          {zone.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Vehicle Type</label>
                    <select
                      value={filters.vehicle_type}
                      onChange={(e) => setFilters({ ...filters, vehicle_type: e.target.value })}
                    >
                      <option value="">All Types</option>
                      {VEHICLE_TYPE_CHOICES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={filters.is_active}
                      onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
                    >
                      <option value="">All Status</option>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                  <div className="form-group filter-actions">
                    <button className="btn-primary" onClick={loadFilteredRates}>
                      Apply Filters
                    </button>
                    {(filters.parking_zone || filters.vehicle_type || filters.is_active !== '') && (
                      <button className="btn-outline" onClick={handleClearFilters}>
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Rates Table */}
              <div className="rates-table-wrapper">
                <table className="rates-table">
                  <thead>
                    <tr>
                      <th>Rate Name</th>
                      <th>Parking Zone</th>
                      <th>Vehicle Type</th>
                      <th className="text-right">Hourly Rate</th>
                      <th className="text-right">Daily Rate</th>
                      <th className="text-right">Weekend Rate</th>
                      <th>Status</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRates.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center">
                          No rates found
                        </td>
                      </tr>
                    ) : (
                      allRates.map((rate) => (
                        <tr key={rate.id}>
                          <td>{rate.rate_name}</td>
                          <td>{rate.parking_zone_display}</td>
                          <td>
                            <span className={`badge badge-${getVehicleTypeColor(rate.vehicle_type)}`}>
                              {rate.vehicle_type_display}
                            </span>
                          </td>
                          <td className="text-right rate-amount success">
                            {formatCurrency(rate.hourly_rate)}/hr
                          </td>
                          <td className="text-right rate-amount primary">
                            {formatCurrency(rate.daily_rate)}/day
                          </td>
                          <td className="text-right">
                            {rate.weekend_rate ? formatCurrency(rate.weekend_rate) + '/hr' : '—'}
                          </td>
                          <td>
                            <span className={`badge ${rate.is_active ? 'badge-success' : 'badge-default'}`}>
                              {rate.is_active ? '✓ Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="text-center">
                            <button
                              className="icon-btn btn-edit"
                              onClick={() => handleOpenEditDialog(rate)}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              className="icon-btn btn-delete"
                              onClick={() => handleDelete(rate.id)}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      {showDialog && (
        <div className="modal-overlay" onClick={handleCloseDialog}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{dialogMode === 'create' ? 'Create New Zone Pricing Rate' : 'Edit Zone Pricing Rate'}</h2>
              <button className="modal-close" onClick={handleCloseDialog}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Parking Zone <span className="required">*</span></label>
                    <select
                      name="parking_zone"
                      value={formData.parking_zone}
                      onChange={handleFormChange}
                      required
                      disabled={dialogMode === 'edit'}
                    >
                      <option value="">Select Zone</option>
                      {PARKING_ZONE_CHOICES.map((zone) => (
                        <option key={zone.value} value={zone.value}>
                          {zone.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Vehicle Type <span className="required">*</span></label>
                    <select
                      name="vehicle_type"
                      value={formData.vehicle_type}
                      onChange={handleFormChange}
                      required
                      disabled={dialogMode === 'edit'}
                    >
                      <option value="">Select Type</option>
                      {VEHICLE_TYPE_CHOICES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Rate Name <span className="required">*</span></label>
                  <input
                    type="text"
                    name="rate_name"
                    value={formData.rate_name}
                    onChange={handleFormChange}
                    placeholder="e.g., College Car Standard Rate"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Optional description"
                    rows="3"
                  />
                </div>
                <div className="form-grid-3">
                  <div className="form-group">
                    <label>Hourly Rate (₹) <span className="required">*</span></label>
                    <input
                      type="number"
                      name="hourly_rate"
                      value={formData.hourly_rate}
                      onChange={handleFormChange}
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Daily Rate (₹) <span className="required">*</span></label>
                    <input
                      type="number"
                      name="daily_rate"
                      value={formData.daily_rate}
                      onChange={handleFormChange}
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Weekend Rate (₹)</label>
                    <input
                      type="number"
                      name="weekend_rate"
                      value={formData.weekend_rate}
                      onChange={handleFormChange}
                      step="0.01"
                      min="0"
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="is_active"
                    value={formData.is_active}
                    onChange={handleFormChange}
                  >
                    <option value={true}>Active</option>
                    <option value={false}>Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={handleCloseDialog}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {dialogMode === 'create' ? 'Create Rate' : 'Update Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZonePricingManagement;
