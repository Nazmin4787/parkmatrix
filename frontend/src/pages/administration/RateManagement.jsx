import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  adminGetAllRates,
  adminDeleteRate,
  adminSetDefaultRate,
  formatCurrency,
  getVehicleTypeDisplay
} from '../../services/pricingRate';
import Modal from '../../UIcomponents/Modal';
import Toast from '../../UIcomponents/Toast';
import '../../stylesheets/components.css';
import './RateManagement.css';

export default function RateManagement() {
  const navigate = useNavigate();
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterVehicleType, setFilterVehicleType] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [deleteModal, setDeleteModal] = useState({ open: false, rateId: null, rateName: '' });
  const [setDefaultModal, setSetDefaultModal] = useState({ open: false, rateId: null, rateName: '' });

  // Load rates from API
  async function loadRates() {
    setLoading(true);
    try {
      const filters = {};
      
      if (filterVehicleType) {
        filters.vehicle_type = filterVehicleType;
      }
      
      if (filterActive !== 'all') {
        filters.is_active = filterActive === 'active';
      }
      
      const response = await adminGetAllRates(filters);
      // API returns array directly if it's an array, or response.data if wrapped
      setRates(Array.isArray(response) ? response : (response.data || response.results || []));
    } catch (error) {
      console.error('Error loading rates:', error);
      showMessage('Failed to load rates', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRates();
  }, [filterVehicleType, filterActive]);

  // Show toast message
  function showMessage(msg, type = 'success') {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  }

  // Handle delete rate
  async function handleDelete() {
    try {
      await adminDeleteRate(deleteModal.rateId);
      showMessage(`Rate "${deleteModal.rateName}" deleted successfully`, 'success');
      setDeleteModal({ open: false, rateId: null, rateName: '' });
      await loadRates();
    } catch (error) {
      console.error('Error deleting rate:', error);
      showMessage('Failed to delete rate', 'error');
    }
  }

  // Handle set default rate
  async function handleSetDefault() {
    try {
      await adminSetDefaultRate(setDefaultModal.rateId);
      showMessage(`Rate "${setDefaultModal.rateName}" set as default`, 'success');
      setSetDefaultModal({ open: false, rateId: null, rateName: '' });
      await loadRates();
    } catch (error) {
      console.error('Error setting default rate:', error);
      showMessage('Failed to set default rate', 'error');
    }
  }

  // Get vehicle type badge color
  function getVehicleTypeBadgeClass(vehicleType) {
    const colorMap = {
      '2-wheeler': 'badge-blue',
      '4-wheeler': 'badge-green',
      'suv': 'badge-purple',
      'electric': 'badge-yellow',
      'heavy': 'badge-orange',
      'car': 'badge-green',
      'bike': 'badge-blue'
    };
    return colorMap[vehicleType] || 'badge-gray';
  }

  return (
    <div className="rate-management-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>💰 Parking Rate Management</h1>
          <p className="subtitle">Manage parking rates for different vehicle types</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/admin/rates/new')}
        >
          ➕ Create New Rate
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="vehicleTypeFilter">Vehicle Type:</label>
          <select
            id="vehicleTypeFilter"
            value={filterVehicleType}
            onChange={(e) => setFilterVehicleType(e.target.value)}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="2-wheeler">2-Wheeler</option>
            <option value="4-wheeler">4-Wheeler</option>
            <option value="suv">SUV</option>
            <option value="electric">Electric</option>
            <option value="heavy">Heavy Vehicle</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="activeFilter">Status:</label>
          <select
            id="activeFilter"
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => {
            setFilterVehicleType('');
            setFilterActive('all');
          }}
        >
          Clear Filters
        </button>
      </div>

      {/* Rates Table */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading rates...</p>
        </div>
      ) : rates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No rates found</h3>
          <p>Create your first parking rate to get started</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/admin/rates/new')}
          >
            Create Rate
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="rates-table">
            <thead>
              <tr>
                <th>Rate Name</th>
                <th>Vehicle Type</th>
                <th>Hourly Rate</th>
                <th>Daily Rate</th>
                <th>Weekend Rate</th>
                <th>Status</th>
                <th>Default</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((rate) => (
                <tr key={rate.id} className={!rate.is_active ? 'inactive-row' : ''}>
                  <td>
                    <div className="rate-name-cell">
                      <strong>{rate.rate_name}</strong>
                      {rate.description && (
                        <small className="rate-description">{rate.description}</small>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`vehicle-badge ${getVehicleTypeBadgeClass(rate.vehicle_type)}`}>
                      {getVehicleTypeDisplay(rate.vehicle_type)}
                    </span>
                  </td>
                  <td className="rate-value">{formatCurrency(rate.hourly_rate)}/hr</td>
                  <td className="rate-value">{formatCurrency(rate.daily_rate)}/day</td>
                  <td className="rate-value">
                    {rate.weekend_rate ? `${formatCurrency(rate.weekend_rate)}/hr` : '—'}
                  </td>
                  <td>
                    <span className={`status-badge ${rate.is_active ? 'status-active' : 'status-inactive'}`}>
                      {rate.is_active ? '✓ Active' : '✗ Inactive'}
                    </span>
                  </td>
                  <td>
                    {rate.is_default ? (
                      <span className="default-badge">★ Default</span>
                    ) : (
                      <button
                        className="btn-link"
                        onClick={() =>
                          setSetDefaultModal({ open: true, rateId: rate.id, rateName: rate.rate_name })
                        }
                        title="Set as default"
                      >
                        Set Default
                      </button>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => navigate(`/admin/rates/${rate.id}/edit`)}
                        title="Edit rate"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() =>
                          setDeleteModal({ open: true, rateId: rate.id, rateName: rate.rate_name })
                        }
                        title="Delete rate"
                        disabled={rate.is_default}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Back to Dashboard Link */}
      <div className="back-link">
        <Link to="/admin/dashboard">← Back to Dashboard</Link>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, rateId: null, rateName: '' })}
        title="Delete Rate"
      >
        <div className="modal-content">
          <p>Are you sure you want to delete the rate:</p>
          <p className="highlight-text"><strong>"{deleteModal.rateName}"</strong></p>
          <p className="warning-text">⚠️ This action cannot be undone.</p>
          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setDeleteModal({ open: false, rateId: null, rateName: '' })}
            >
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Set Default Confirmation Modal */}
      <Modal
        isOpen={setDefaultModal.open}
        onClose={() => setSetDefaultModal({ open: false, rateId: null, rateName: '' })}
        title="Set Default Rate"
      >
        <div className="modal-content">
          <p>Set this rate as the default for its vehicle type?</p>
          <p className="highlight-text"><strong>"{setDefaultModal.rateName}"</strong></p>
          <p className="info-text">ℹ️ The current default rate will be replaced.</p>
          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setSetDefaultModal({ open: false, rateId: null, rateName: '' })}
            >
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSetDefault}>
              Set as Default
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast Message */}
      {message && (
        <Toast message={message} type={messageType} onClose={() => setMessage('')} />
      )}
    </div>
  );
}
