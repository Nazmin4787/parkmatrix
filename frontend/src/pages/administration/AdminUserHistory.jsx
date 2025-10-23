import React, { useState, useEffect } from 'react';
import {
  getAdminUserHistory,
  getAdminUserStats,
  exportUserParkingHistory
} from '../../services/userHistory';
import './AdminUserHistory.css';

const AdminUserHistory = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserInfo, setSelectedUserInfo] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    location: '',
    status: '',
    vehicleType: '',
    ordering: '-check_in_time'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10
  });

  // Fetch all users for the dropdown
  useEffect(() => {
    console.log('Component mounted, fetching users...');
    fetchUsers();
  }, []);

  // Debug: Log users state whenever it changes
  useEffect(() => {
    console.log('Users state updated:', users.length, 'users');
  }, [users]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      console.log('Fetching users with token:', token ? 'Token exists' : 'No token');
      
      const response = await fetch('http://localhost:8000/api/admin/users/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Users API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Users data received:', data);
        console.log('Data structure:', {
          hasCount: 'count' in data,
          hasUsers: 'users' in data,
          hasResults: 'results' in data,
          keys: Object.keys(data)
        });
        console.log('Number of users:', data.users ? data.users.length : 0);
        
        // Set users from the response
        if (data.users && Array.isArray(data.users)) {
          console.log('Setting users array with', data.users.length, 'items');
          setUsers(data.users);
        } else if (Array.isArray(data)) {
          console.log('Data is directly an array with', data.length, 'items');
          setUsers(data);
        } else {
          console.error('Unexpected data structure:', data);
          setUsers([]);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch users:', response.status, response.statusText, errorData);
        setError(`Failed to load users: ${errorData.error || response.statusText}`);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(`Error loading users: ${err.message}`);
    }
  };

  // Fetch history for selected user
  const fetchHistory = async (userId, page = 1) => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        page_size: pagination.pageSize,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) {
          delete params[key];
        }
      });

      const response = await getAdminUserHistory(userId, params);
      setHistory(response.results || []);
      setPagination({
        ...pagination,
        currentPage: page,
        totalPages: Math.ceil(response.count / pagination.pageSize),
        totalCount: response.count
      });
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(err.response?.data?.error || 'Failed to load parking history');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics for selected user
  const fetchStats = async (userId) => {
    if (!userId) return;

    try {
      const response = await getAdminUserStats(userId);
      setStats(response);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Handle user selection
  const handleUserSelect = (e) => {
    const userId = e.target.value;
    setSelectedUserId(userId);
    
    if (userId) {
      const user = users.find(u => u.id === parseInt(userId));
      setSelectedUserInfo(user);
      fetchHistory(userId, 1);
      fetchStats(userId);
    } else {
      setSelectedUserInfo(null);
      setHistory([]);
      setStats(null);
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply filters
  const applyFilters = () => {
    if (selectedUserId) {
      fetchHistory(selectedUserId, 1);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      location: '',
      status: '',
      vehicleType: '',
      ordering: '-check_in_time'
    });
    if (selectedUserId) {
      setTimeout(() => fetchHistory(selectedUserId, 1), 100);
    }
  };

  // Export to CSV
  const handleExport = async () => {
    if (!selectedUserId) {
      alert('Please select a user first');
      return;
    }

    try {
      const params = { ...filters };
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) {
          delete params[key];
        }
      });
      
      await exportUserParkingHistory(params);
    } catch (err) {
      console.error('Error exporting:', err);
      alert('Failed to export data');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format duration
  const formatDuration = (minutes) => {
    if (!minutes) return 'Ongoing';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} mins`;
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      'parked': { icon: '🅿️', text: 'Parked', class: 'status-parked' },
      'completed': { icon: '✅', text: 'Completed', class: 'status-completed' },
      'cancelled': { icon: '❌', text: 'Cancelled', class: 'status-cancelled' }
    };
    const badge = badges[status?.toLowerCase()] || { icon: '📍', text: status, class: 'status-default' };
    return (
      <span className={`status-badge ${badge.class}`}>
        <span className="status-icon">{badge.icon}</span>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="admin-user-history-container">
      <div className="history-header">
        <div className="header-left">
          <h1 className="page-title">
            <span className="title-icon">👥</span>
            Admin: User Parking History
          </h1>
          <p className="page-subtitle">View parking history for any user</p>
        </div>
        <div className="header-actions">
          {selectedUserId && (
            <button className="btn-export" onClick={handleExport}>
              📥 Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          <span>⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="alert-close">×</button>
        </div>
      )}

      {/* User Selection */}
      <div className="user-selection-section">
        <div className="user-select-group">
          <label htmlFor="userSelect">Select User</label>
          <select
            id="userSelect"
            value={selectedUserId}
            onChange={handleUserSelect}
            className="user-select"
            disabled={users.length === 0}
          >
            <option value="">
              {users.length === 0 ? '-- Loading users... --' : '-- Select a user --'}
            </option>
            {console.log('Rendering dropdown with', users.length, 'users')}
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.full_name || user.username} ({user.email}) - {user.role}
              </option>
            ))}
          </select>
          {users.length === 0 && (
            <small style={{ color: '#999', display: 'block', marginTop: '0.5rem' }}>
              Loading user list...
            </small>
          )}
        </div>

        {selectedUserInfo && (
          <div className="selected-user-info">
            <div className="user-info-card">
              <div className="user-avatar">
                {selectedUserInfo.username.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <h3>{selectedUserInfo.username}</h3>
                <p>{selectedUserInfo.email}</p>
                <span className={`role-badge role-${selectedUserInfo.role}`}>
                  {selectedUserInfo.role}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      {stats && selectedUserId && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🚗</div>
            <div className="stat-content">
              <div className="stat-value">{stats.total_sessions}</div>
              <div className="stat-label">Total Sessions</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <div className="stat-value">{formatDuration(stats.total_time_parked_minutes)}</div>
              <div className="stat-label">Total Time Parked</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-value">₹{stats.total_amount_paid}</div>
              <div className="stat-label">Total Amount Paid</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📍</div>
            <div className="stat-content">
              <div className="stat-value">{stats.favorite_location || 'N/A'}</div>
              <div className="stat-label">Favorite Location</div>
            </div>
          </div>
        </div>
      )}

      {/* History Content */}
      <div className="history-content">
        {!selectedUserId ? (
          <div className="empty-state">
            <span className="empty-icon">👤</span>
            <h3>No User Selected</h3>
            <p>Please select a user from the dropdown above to view their parking history.</p>
          </div>
        ) : loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading parking history...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
            <button onClick={() => fetchHistory(selectedUserId, 1)} className="btn-retry">
              Try Again
            </button>
          </div>
        ) : history.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <h3>No Parking History Found</h3>
            <p>This user doesn't have any parking sessions yet.</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Parking Zone</th>
                    <th>Vehicle No</th>
                    <th>Check-In</th>
                    <th>Check-Out</th>
                    <th>Duration</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((session) => (
                    <tr key={session.id}>
                      <td>{formatDate(session.check_in_time)}</td>
                      <td className="zone-cell">
                        <span className="zone-name">{session.location_name}</span>
                      </td>
                      <td className="vehicle-cell">
                        <span className="vehicle-number">{session.vehicle_plate}</span>
                      </td>
                      <td>{formatTime(session.check_in_time)}</td>
                      <td>{formatTime(session.check_out_time)}</td>
                      <td>{session.duration}</td>
                      <td className="amount-cell">
                        {session.amount ? `₹${session.amount}` : '—'}
                      </td>
                      <td>{getStatusBadge(session.session_status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => fetchHistory(selectedUserId, pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  ← Previous
                </button>
                <span className="pagination-info">
                  Page {pagination.currentPage} of {pagination.totalPages}
                  <span className="total-count">({pagination.totalCount} total sessions)</span>
                </span>
                <button
                  className="pagination-btn"
                  onClick={() => fetchHistory(selectedUserId, pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminUserHistory;
