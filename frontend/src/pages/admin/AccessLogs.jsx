import { useState, useEffect } from 'react';
import { getAccessLogs, getAccessLogStats, exportAccessLogs } from '../../services/accessLogs';
import '../../stylesheets/components.css';
import './AccessLogs.css';

export default function AccessLogs() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Filters
  const [filters, setFilters] = useState({
    username: '',
    role: '',
    status: '',
    ip_address: '',
    location: '',
    date_from: '',
    date_to: '',
    active_only: false,
    ordering: '-login_timestamp',
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Check if user is admin before loading data
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    
    console.log('AccessLogs - Token present:', !!token);
    console.log('AccessLogs - User:', user);
    
    if (!token) {
      setError('Please log in to access this page.');
      setLoading(false);
      return;
    }
    
    if (user) {
      try {
        const userData = JSON.parse(user);
        console.log('Current user role:', userData.role);
        if (userData.role !== 'admin') {
          setError('Access Denied: You must be logged in as an admin to view access logs.');
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    loadAccessLogs();
    loadStats();
  }, [currentPage, pageSize]);

  async function loadAccessLogs() {
    try {
      setLoading(true);
      setError('');
      
      console.log('Loading access logs with filters:', filters);
      
      const data = await getAccessLogs({
        ...filters,
        page: currentPage,
        page_size: pageSize,
      });
      
      console.log('Access logs data received:', data);
      
      // Handle paginated response
      if (data.results) {
        setLogs(data.results);
        setTotalPages(Math.ceil(data.count / pageSize));
      } else if (Array.isArray(data)) {
        setLogs(data);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error('Error loading access logs:', err);
      const errorMsg = err.response?.data?.error 
        || err.response?.data?.detail 
        || err.message 
        || 'Unknown error';
      setError('Failed to load access logs: ' + errorMsg);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      console.log('Loading stats with filters:', filters);
      const data = await getAccessLogStats({
        date_from: filters.date_from,
        date_to: filters.date_to,
      });
      console.log('Stats data received:', data);
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
      // Set default stats on error
      setStats({
        total_logs: 0,
        successful_logins: 0,
        failed_logins: 0,
        active_sessions: 0,
        unique_users: 0
      });
    }
  }

  function handleFilterChange(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  function handleApplyFilters() {
    setCurrentPage(1);
    loadAccessLogs();
    loadStats();
  }

  function handleClearFilters() {
    setFilters({
      username: '',
      role: '',
      status: '',
      ip_address: '',
      location: '',
      date_from: '',
      date_to: '',
      active_only: false,
      ordering: '-login_timestamp',
    });
    setCurrentPage(1);
    setTimeout(() => {
      loadAccessLogs();
      loadStats();
    }, 100);
  }

  async function handleExport() {
    try {
      await exportAccessLogs(filters);
    } catch (err) {
      setError('Failed to export logs: ' + (err.response?.data?.error || err.message));
    }
  }

  function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  function getRoleBadgeClass(role) {
    switch (role?.toLowerCase()) {
      case 'admin': return 'badge-admin';
      case 'security': return 'badge-security';
      case 'customer': return 'badge-customer';
      default: return 'badge-default';
    }
  }

  function getStatusBadge(status) {
    if (status === 'success') {
      return <span className="status-badge status-success">✓ Success</span>;
    } else if (status === 'failed') {
      return <span className="status-badge status-failed">✗ Failed</span>;
    } else {
      return <span className="status-badge status-locked">🔒 Locked</span>;
    }
  }

  return (
    <div className="access-logs-container">
      <div className="page-header">
        <h1>Access Logs</h1>
        <div className="header-actions">
          <button 
            className="btn-secondary small" 
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? '✕ Hide Filters' : '🔍 Show Filters'}
          </button>
          <button className="btn-primary small" onClick={handleExport}>
            📥 Export CSV
          </button>
          <button className="btn-secondary small" onClick={loadAccessLogs}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">{stats.total_logins}</div>
              <div className="stat-label">Total Logins</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon success">✓</div>
            <div className="stat-content">
              <div className="stat-value">{stats.successful_logins}</div>
              <div className="stat-label">Successful</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon failed">✗</div>
            <div className="stat-content">
              <div className="stat-value">{stats.failed_logins}</div>
              <div className="stat-label">Failed</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-value">{stats.unique_users}</div>
              <div className="stat-label">Unique Users</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon active">●</div>
            <div className="stat-content">
              <div className="stat-value">{stats.active_sessions}</div>
              <div className="stat-label">Active Sessions</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filters-grid">
            <div className="filter-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="Search username..."
                value={filters.username}
                onChange={(e) => handleFilterChange('username', e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Role</label>
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
                <option value="security">Security</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="locked">Locked</option>
              </select>
            </div>
            <div className="filter-group">
              <label>IP Address</label>
              <input
                type="text"
                placeholder="Search IP..."
                value={filters.ip_address}
                onChange={(e) => handleFilterChange('ip_address', e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Location</label>
              <input
                type="text"
                placeholder="Search location..."
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Date From</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Date To</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
              />
            </div>
            <div className="filter-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={filters.active_only}
                  onChange={(e) => handleFilterChange('active_only', e.target.checked)}
                />
                Active Sessions Only
              </label>
            </div>
          </div>
          <div className="filter-actions">
            <button className="btn-primary small" onClick={handleApplyFilters}>
              Apply Filters
            </button>
            <button className="btn-secondary small" onClick={handleClearFilters}>
              Clear All
            </button>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {/* Access Logs Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading access logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <p>No access logs found</p>
          </div>
        ) : (
          <table className="access-logs-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Login Time</th>
                <th>Logout Time</th>
                <th>IP Address</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <div className="user-info">
                      <strong>{log.username || 'Unknown'}</strong>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge ${getRoleBadgeClass(log.role)}`}>
                      {log.role || 'N/A'}
                    </span>
                  </td>
                  <td>{formatDateTime(log.login_timestamp)}</td>
                  <td>
                    {log.logout_timestamp ? (
                      formatDateTime(log.logout_timestamp)
                    ) : (
                      <span className="active-indicator">● Active</span>
                    )}
                  </td>
                  <td>
                    <code className="ip-address">{log.ip_address || 'N/A'}</code>
                  </td>
                  <td>
                    {log.location_city && log.location_country
                      ? `${log.location_city}, ${log.location_country}`
                      : log.location_country || 'Unknown'}
                  </td>
                  <td>{getStatusBadge(log.status)}</td>
                  <td>
                    <button
                      className="btn-link small"
                      onClick={() => {
                        setSelectedLog(log);
                        setShowDetail(true);
                      }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn-secondary small"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            ← Previous
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn-secondary small"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            Next →
          </button>
          <select
            className="page-size-select"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedLog && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Access Log Details</h2>
              <button className="close-btn" onClick={() => setShowDetail(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-section">
                  <h3>User Information</h3>
                  <div className="detail-row">
                    <span className="detail-label">Username:</span>
                    <span className="detail-value">{selectedLog.username || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedLog.email || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Role:</span>
                    <span className={`role-badge ${getRoleBadgeClass(selectedLog.role)}`}>
                      {selectedLog.role || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Session Information</h3>
                  <div className="detail-row">
                    <span className="detail-label">Login Time:</span>
                    <span className="detail-value">{formatDateTime(selectedLog.login_timestamp)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Logout Time:</span>
                    <span className="detail-value">
                      {selectedLog.logout_timestamp ? formatDateTime(selectedLog.logout_timestamp) : 'Still Active'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Session Duration:</span>
                    <span className="detail-value">
                      {selectedLog.session_duration ? `${selectedLog.session_duration} minutes` : 'N/A'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Status:</span>
                    {getStatusBadge(selectedLog.status)}
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Location & Network</h3>
                  <div className="detail-row">
                    <span className="detail-label">IP Address:</span>
                    <code className="detail-value">{selectedLog.ip_address || 'N/A'}</code>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">
                      {selectedLog.location_city && selectedLog.location_country
                        ? `${selectedLog.location_city}, ${selectedLog.location_country}`
                        : 'Unknown'}
                    </span>
                  </div>
                  {selectedLog.latitude && selectedLog.longitude && (
                    <div className="detail-row">
                      <span className="detail-label">Coordinates:</span>
                      <span className="detail-value">
                        {selectedLog.latitude}, {selectedLog.longitude}
                      </span>
                    </div>
                  )}
                </div>

                <div className="detail-section">
                  <h3>Device Information</h3>
                  <div className="detail-row">
                    <span className="detail-label">Device Type:</span>
                    <span className="detail-value">{selectedLog.device_type || 'Unknown'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Browser:</span>
                    <span className="detail-value">{selectedLog.browser || 'Unknown'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Operating System:</span>
                    <span className="detail-value">{selectedLog.operating_system || 'Unknown'}</span>
                  </div>
                  {selectedLog.user_agent && (
                    <div className="detail-row full-width">
                      <span className="detail-label">User Agent:</span>
                      <code className="detail-value small">{selectedLog.user_agent}</code>
                    </div>
                  )}
                </div>

                {selectedLog.failure_reason && (
                  <div className="detail-section full-width">
                    <h3>Failure Information</h3>
                    <div className="detail-row">
                      <span className="detail-label">Reason:</span>
                      <span className="detail-value error-text">{selectedLog.failure_reason}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDetail(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
