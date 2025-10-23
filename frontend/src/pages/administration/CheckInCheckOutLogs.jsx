import { useState, useEffect } from 'react';
import {
  getCheckInCheckOutLogs,
  getCheckInCheckOutStats,
  exportCheckInCheckOutLogs,
  getCurrentlyParkedVehicles
} from '../../services/checkInCheckOutLogs';
import '../../stylesheets/components.css';
import './CheckInCheckOutLogs.css';

export default function CheckInCheckOutLogs() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [parkedVehicles, setParkedVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [activeTab, setActiveTab] = useState('logs'); // 'logs', 'stats', 'parked'

  // Filters
  const [filters, setFilters] = useState({
    booking_id: '',
    username: '',
    vehicle_plate: '',
    vehicle_type: '',
    action: '',
    status: '',
    date_from: '',
    date_to: '',
    parking_lot: '',
    floor: '',
    section: '',
    current_status: '',
    ordering: '-timestamp',
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Check if user is admin or security
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    
    console.log('CheckInCheckOutLogs - Token present:', !!token);
    console.log('CheckInCheckOutLogs - User:', user);
    
    if (!token) {
      setError('Please log in to access this page.');
      setLoading(false);
      return;
    }
    
    if (user) {
      try {
        const userData = JSON.parse(user);
        console.log('Current user role:', userData.role);
        if (userData.role !== 'admin' && userData.role !== 'security') {
          setError('Access Denied: You must be logged in as an admin or security to view these logs.');
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    loadData();
  }, [activeTab]);

  async function loadData() {
    if (activeTab === 'logs') {
      await loadLogs();
    } else if (activeTab === 'stats') {
      await loadStats();
    } else if (activeTab === 'parked') {
      await loadParkedVehicles();
    }
  }

  async function loadLogs() {
    try {
      setLoading(true);
      setError('');
      
      console.log('Loading check-in/check-out logs with filters:', filters);
      
      const data = await getCheckInCheckOutLogs(filters);
      
      console.log('Check-in/check-out logs data received:', data);
      
      if (Array.isArray(data)) {
        setLogs(data);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error('Error loading check-in/check-out logs:', err);
      const errorMsg = err.response?.data?.error 
        || err.response?.data?.detail 
        || err.message 
        || 'Unknown error';
      setError('Failed to load check-in/check-out logs: ' + errorMsg);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      setLoading(true);
      setError('');
      console.log('Loading stats with filters:', filters);
      const data = await getCheckInCheckOutStats({
        date_from: filters.date_from,
        date_to: filters.date_to,
      });
      console.log('Stats data received:', data);
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
      setError('Failed to load statistics: ' + (err.response?.data?.detail || err.message));
      setStats({
        total_check_ins: 0,
        failed_check_ins: 0,
        total_check_outs: 0,
        failed_check_outs: 0,
        currently_parked: 0,
        average_parking_duration_hours: 0,
        total_completed_sessions: 0
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadParkedVehicles() {
    try {
      setLoading(true);
      setError('');
      const data = await getCurrentlyParkedVehicles();
      console.log('Currently parked vehicles:', data);
      setParkedVehicles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load parked vehicles:', err);
      setError('Failed to load parked vehicles: ' + (err.response?.data?.detail || err.message));
      setParkedVehicles([]);
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  function handleApplyFilters() {
    loadLogs();
  }

  function handleClearFilters() {
    setFilters({
      booking_id: '',
      username: '',
      vehicle_plate: '',
      vehicle_type: '',
      action: '',
      status: '',
      date_from: '',
      date_to: '',
      parking_lot: '',
      floor: '',
      section: '',
      current_status: '',
      ordering: '-timestamp',
    });
    setTimeout(() => {
      loadLogs();
    }, 100);
  }

  async function handleExport() {
    try {
      setLoading(true);
      await exportCheckInCheckOutLogs(filters);
      alert('Export successful! Check your downloads folder.');
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export logs: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  }

  function handleRowClick(log) {
    setSelectedLog(log);
    setShowDetail(true);
  }

  function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  }

  function formatTimeOnly(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }

  function formatDuration(minutes) {
    if (!minutes) return '0 min';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  function getStatusBadgeClass(status) {
    return status === 'Success' ? 'badge-success' : 'badge-error';
  }

  function getActionBadgeClass(action) {
    if (action.includes('check_in')) return 'badge-info';
    if (action.includes('check_out')) return 'badge-warning';
    return 'badge-default';
  }

  // Render content based on active tab
  function renderContent() {
    if (loading) {
      return <div className="loading">Loading...</div>;
    }

    if (error) {
      return <div className="error-message">{error}</div>;
    }

    switch (activeTab) {
      case 'logs':
        return renderLogsTab();
      case 'stats':
        return renderStatsTab();
      case 'parked':
        return renderParkedTab();
      default:
        return null;
    }
  }

  function renderLogsTab() {
    return (
      <>
        {/* Filters */}
        <div className="filters-section">
          <button 
            className="btn-outline" 
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? '🔽 Hide Filters' : '🔍 Show Filters'}
          </button>

          {showFilters && (
            <div className="filters-panel">
              <div className="filters-grid">
                <input
                  type="text"
                  placeholder="Search Username"
                  value={filters.username}
                  onChange={(e) => handleFilterChange('username', e.target.value)}
                />
                
                <input
                  type="text"
                  placeholder="Vehicle Plate"
                  value={filters.vehicle_plate}
                  onChange={(e) => handleFilterChange('vehicle_plate', e.target.value)}
                />

                <select
                  value={filters.vehicle_type}
                  onChange={(e) => handleFilterChange('vehicle_type', e.target.value)}
                >
                  <option value="">All Vehicle Types</option>
                  <option value="car">Car</option>
                  <option value="suv">SUV</option>
                  <option value="bike">Bike</option>
                  <option value="truck">Truck</option>
                </select>

                <select
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                >
                  <option value="">All Actions</option>
                  <option value="check_in">Check-In</option>
                  <option value="check_out">Check-Out</option>
                  <option value="check_in_success">Check-In Success</option>
                  <option value="check_in_failed">Check-In Failed</option>
                  <option value="check_out_success">Check-Out Success</option>
                  <option value="check_out_failed">Check-Out Failed</option>
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                </select>

                <input
                  type="date"
                  placeholder="Date From"
                  value={filters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                />

                <input
                  type="date"
                  placeholder="Date To"
                  value={filters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                />

                <input
                  type="text"
                  placeholder="Parking Lot"
                  value={filters.parking_lot}
                  onChange={(e) => handleFilterChange('parking_lot', e.target.value)}
                />

                <input
                  type="text"
                  placeholder="Floor"
                  value={filters.floor}
                  onChange={(e) => handleFilterChange('floor', e.target.value)}
                />

                <input
                  type="text"
                  placeholder="Section"
                  value={filters.section}
                  onChange={(e) => handleFilterChange('section', e.target.value)}
                />
              </div>

              <div className="filters-actions">
                <button className="btn-primary" onClick={handleApplyFilters}>
                  Apply Filters
                </button>
                <button className="btn-outline" onClick={handleClearFilters}>
                  Clear Filters
                </button>
                <button className="btn-success" onClick={handleExport}>
                  📥 Export CSV
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Logs Table */}
        <div className="logs-table-container">
          {logs.length === 0 ? (
            <div className="no-data">No logs found matching your criteria.</div>
          ) : (
            <div className="table-responsive">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>User ID</th>
                    <th>Parking Zone</th>
                    <th>Check-In Time</th>
                    <th>Check-Out Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const isCheckedOut = log.checkout_time || log.action === 'check_out';
                    const isParked = !isCheckedOut;
                    
                    return (
                      <tr 
                        key={log.id} 
                        onClick={() => handleRowClick(log)}
                        className="clickable-row"
                      >
                        <td className="vehicle-plate">{log.vehicle_plate || 'N/A'}</td>
                        <td>{log.user_username || `user${log.user_id}` || 'N/A'}</td>
                        <td>{log.parking_zone || 'Unknown'}</td>
                        <td>{formatTimeOnly(log.checkin_time || log.timestamp)}</td>
                        <td>{isCheckedOut ? formatTimeOnly(log.checkout_time || log.timestamp) : '—'}</td>
                        <td>
                          {isParked ? (
                            <span className="status-badge status-parked">
                              🅿️ Parked
                            </span>
                          ) : (
                            <span className="status-badge status-left">
                              ✅ Left
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    );
  }

  function renderStatsTab() {
    if (!stats) return <div className="loading">Loading statistics...</div>;

    return (
      <div className="stats-container">
        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon">✅</div>
            <div className="stat-value">{stats.total_check_ins || 0}</div>
            <div className="stat-label">Total Check-Ins</div>
          </div>

          <div className="stat-card stat-danger">
            <div className="stat-icon">❌</div>
            <div className="stat-value">{stats.failed_check_ins || 0}</div>
            <div className="stat-label">Failed Check-Ins</div>
          </div>

          <div className="stat-card stat-success">
            <div className="stat-icon">✅</div>
            <div className="stat-value">{stats.total_check_outs || 0}</div>
            <div className="stat-label">Total Check-Outs</div>
          </div>

          <div className="stat-card stat-warning">
            <div className="stat-icon">❌</div>
            <div className="stat-value">{stats.failed_check_outs || 0}</div>
            <div className="stat-label">Failed Check-Outs</div>
          </div>

          <div className="stat-card stat-info">
            <div className="stat-icon">🅿️</div>
            <div className="stat-value">{stats.currently_parked || 0}</div>
            <div className="stat-label">Currently Parked</div>
          </div>

          <div className="stat-card stat-secondary">
            <div className="stat-icon">⏱️</div>
            <div className="stat-value">{stats.average_parking_duration_hours?.toFixed(1) || 0}h</div>
            <div className="stat-label">Avg. Duration</div>
          </div>

          <div className="stat-card stat-success">
            <div className="stat-icon">✔️</div>
            <div className="stat-value">{stats.total_completed_sessions || 0}</div>
            <div className="stat-label">Completed Sessions</div>
          </div>
        </div>

        {/* Vehicle Type Chart */}
        {stats.check_ins_by_vehicle_type && Object.keys(stats.check_ins_by_vehicle_type).length > 0 && (
          <div className="chart-section">
            <h3>Check-Ins by Vehicle Type</h3>
            <div className="vehicle-type-stats">
              {Object.entries(stats.check_ins_by_vehicle_type).map(([type, count]) => (
                <div key={type} className="vehicle-stat-item">
                  <span className="vehicle-type">{type || 'Unknown'}</span>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${(count / Math.max(...Object.values(stats.check_ins_by_vehicle_type))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="vehicle-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderParkedTab() {
    return (
      <div className="parked-vehicles-container">
        <div className="table-header">
          <h3>Currently Parked Vehicles ({parkedVehicles.length})</h3>
          <button className="btn-primary" onClick={loadParkedVehicles}>
            🔄 Refresh
          </button>
        </div>

        {parkedVehicles.length === 0 ? (
          <div className="no-data">No vehicles currently parked.</div>
        ) : (
          <div className="parked-vehicles-grid">
            {parkedVehicles.map((vehicle) => (
              <div key={vehicle.id} className={`parked-vehicle-card ${vehicle.is_overtime ? 'overtime' : ''}`}>
                <div className="vehicle-card-header">
                  <div className="vehicle-plate">
                    {vehicle.vehicle_info?.number_plate || 'N/A'}
                  </div>
                  {vehicle.is_overtime && (
                    <span className="badge badge-error">Overtime</span>
                  )}
                </div>

                <div className="vehicle-card-body">
                  <div className="vehicle-detail">
                    <span className="detail-label">User:</span>
                    <span className="detail-value">{vehicle.user_username}</span>
                  </div>

                  <div className="vehicle-detail">
                    <span className="detail-label">Vehicle:</span>
                    <span className="detail-value">
                      {vehicle.vehicle_info?.type} {vehicle.vehicle_info?.model && `- ${vehicle.vehicle_info.model}`}
                    </span>
                  </div>

                  <div className="vehicle-detail">
                    <span className="detail-label">Slot:</span>
                    <span className="detail-value">
                      {vehicle.slot_info?.slot_number} (Floor: {vehicle.slot_info?.floor}, Section: {vehicle.slot_info?.section})
                    </span>
                  </div>

                  <div className="vehicle-detail">
                    <span className="detail-label">Parking Zone:</span>
                    <span className="detail-value">{vehicle.slot_info?.parking_zone || 'Unknown'}</span>
                  </div>

                  <div className="vehicle-detail">
                    <span className="detail-label">Checked In:</span>
                    <span className="detail-value">{formatTimestamp(vehicle.checked_in_at)}</span>
                  </div>

                  <div className="vehicle-detail">
                    <span className="detail-label">Expected Checkout:</span>
                    <span className="detail-value">{formatTimestamp(vehicle.expected_checkout)}</span>
                  </div>

                  <div className="vehicle-detail">
                    <span className="detail-label">Duration:</span>
                    <span className="detail-value">{formatDuration(vehicle.duration_minutes)}</span>
                  </div>

                  {vehicle.overtime_minutes > 0 && (
                    <div className="vehicle-detail overtime-info">
                      <span className="detail-label">Overtime:</span>
                      <span className="detail-value">{formatDuration(vehicle.overtime_minutes)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="checkin-checkout-logs-page">
      <div className="page-header">
        <h2>🚗 Check-In / Check-Out Logs</h2>
        <p className="page-description">Monitor all vehicle check-in and check-out activities</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          📋 Activity Logs
        </button>
        <button 
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Statistics
        </button>
        <button 
          className={`tab ${activeTab === 'parked' ? 'active' : ''}`}
          onClick={() => setActiveTab('parked')}
        >
          🅿️ Currently Parked ({parkedVehicles.length})
        </button>
      </div>

      {/* Content */}
      <div className="tab-content">
        {renderContent()}
      </div>

      {/* Detail Modal */}
      {showDetail && selectedLog && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Log Details</h3>
              <button className="close-btn" onClick={() => setShowDetail(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <strong>Log ID:</strong> {selectedLog.id}
                </div>
                <div className="detail-item">
                  <strong>Booking ID:</strong> {selectedLog.booking_id || 'N/A'}
                </div>
                <div className="detail-item">
                  <strong>Action:</strong> {selectedLog.action_display || selectedLog.action}
                </div>
                <div className="detail-item">
                  <strong>Status:</strong> 
                  <span className={`badge ${getStatusBadgeClass(selectedLog.status)}`}>
                    {selectedLog.status}
                  </span>
                </div>
                <div className="detail-item">
                  <strong>Timestamp:</strong> {formatTimestamp(selectedLog.timestamp)}
                </div>
                <div className="detail-item">
                  <strong>User:</strong> {selectedLog.user_username || 'N/A'}
                </div>
                <div className="detail-item">
                  <strong>Vehicle Type:</strong> {selectedLog.vehicle_type || 'N/A'}
                </div>
                <div className="detail-item">
                  <strong>Vehicle Plate:</strong> {selectedLog.vehicle_plate || 'N/A'}
                </div>
                <div className="detail-item">
                  <strong>Parking Lot:</strong> {selectedLog.parking_lot || 'N/A'}
                </div>
                <div className="detail-item">
                  <strong>Slot Number:</strong> {selectedLog.slot_number || 'N/A'}
                </div>
                <div className="detail-item">
                  <strong>IP Address:</strong> {selectedLog.ip_address || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
