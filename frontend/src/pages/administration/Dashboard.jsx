import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import '../../stylesheets/admin.css';
import { listAllSlots } from '../../services/parkingSlot';

export default function AdminDashboard() {
  const [slotStats, setSlotStats] = useState({
    total: 0,
    occupied: 0,
    free: 0,
    rate: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch slot statistics on component mount
  useEffect(() => {
    const fetchSlotStats = async () => {
      try {
        // We'll replace this with the getSlotStatistics API call when the backend is ready
        const slots = await listAllSlots();
        const occupied = slots.filter(slot => slot.is_occupied).length;
        const total = slots.length;
        const free = total - occupied;
        const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;
        
        setSlotStats({
          total,
          occupied,
          free,
          rate
        });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching slot statistics:', err);
        setLoading(false);
      }
    };

    fetchSlotStats();
  }, []);

  return (
    <div className="admin-dashboard-container">
      <div className="dashboard-header">
        <h2>🎛️ Admin Dashboard</h2>
        <p className="dashboard-subtitle">Monitor and manage your parking system</p>
      </div>

      {/* Statistics Cards */}
      <div className="kpis">
        <div className="kpi-card kpi-total">
          <div className="kpi-icon">🏢</div>
          <div className="kpi-content">
            <div className="kpi-label">Total Slots</div>
            <div className="kpi-value">{loading ? '...' : slotStats.total}</div>
          </div>
        </div>
        <div className="kpi-card kpi-occupied">
          <div className="kpi-icon">🚗</div>
          <div className="kpi-content">
            <div className="kpi-label">Occupied Slots</div>
            <div className="kpi-value">{loading ? '...' : slotStats.occupied}</div>
          </div>
        </div>
        <div className="kpi-card kpi-free">
          <div className="kpi-icon">✅</div>
          <div className="kpi-content">
            <div className="kpi-label">Free Slots</div>
            <div className="kpi-value">{loading ? '...' : slotStats.free}</div>
          </div>
        </div>
        <div className="kpi-card kpi-rate">
          <div className="kpi-icon">📊</div>
          <div className="kpi-content">
            <div className="kpi-label">Occupancy Rate</div>
            <div className="kpi-value">{loading ? '...' : slotStats.rate + '%'}</div>
          </div>
          <div className="kpi-progress">
            <div className="kpi-progress-bar" style={{width: `${slotStats.rate}%`}}></div>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="dashboard-section">
        <h3 className="section-title">⚡ Quick Actions</h3>
        <div className="admin-actions-grid">
          {/* Check-In/Check-Out Actions */}
          <Link className="action-card action-success" to="/admin/checkin">
            <div className="action-icon">✅</div>
            <div className="action-content">
              <div className="action-title">Check-In Vehicle</div>
              <div className="action-desc">Manual vehicle check-in</div>
            </div>
          </Link>

          <Link className="action-card action-danger" to="/admin/checkout">
            <div className="action-icon">🚪</div>
            <div className="action-content">
              <div className="action-title">Check-Out Vehicle</div>
              <div className="action-desc">Complete parking session</div>
            </div>
          </Link>

          <Link className="action-card action-primary" to="/admin/slots">
            <div className="action-icon">🎯</div>
            <div className="action-content">
              <div className="action-title">Manage Slots</div>
              <div className="action-desc">Add, edit or remove parking slots</div>
            </div>
          </Link>

          <Link className="action-card action-secondary" to="/admin/zone-pricing">
            <div className="action-icon">🏷️</div>
            <div className="action-content">
              <div className="action-title">Zone Pricing</div>
              <div className="action-desc">Zone-specific pricing rates</div>
            </div>
          </Link>

          <Link className="action-card action-warning" to="/admin/long-stay">
            <div className="action-icon action-pulse">🚨</div>
            <div className="action-content">
              <div className="action-title">Long-Stay Monitor</div>
              <div className="action-desc">Track vehicles exceeding time limits</div>
            </div>
          </Link>

          <Link className="action-card action-info" to="/admin/slot-tracker">
            <div className="action-icon">🅿️</div>
            <div className="action-content">
              <div className="action-title">Track Parking</div>
              <div className="action-desc">Real-time slot monitoring</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Logs & Reports Section */}
      <div className="dashboard-section">
        <h3 className="section-title">📊 Logs & Reports</h3>
        <div className="admin-actions-grid reports-grid">
          <Link className="action-card action-outline" to="/admin/revenue">
            <div className="action-icon">💰</div>
            <div className="action-content">
              <div className="action-title">Revenue Management</div>
              <div className="action-desc">Track earnings & overstay fees</div>
            </div>
          </Link>

          <Link className="action-card action-outline" to="/admin/access-logs">
            <div className="action-icon">📋</div>
            <div className="action-content">
              <div className="action-title">Access Logs</div>
              <div className="action-desc">View system access history</div>
            </div>
          </Link>

          <Link className="action-card action-outline" to="/admin/checkin-checkout-logs">
            <div className="action-icon">🚗</div>
            <div className="action-content">
              <div className="action-title">Check-In/Out Logs</div>
              <div className="action-desc">Monitor vehicle entries & exits</div>
            </div>
          </Link>

          <Link className="action-card action-outline" to="/admin/user-history">
            <div className="action-icon">👥</div>
            <div className="action-content">
              <div className="action-title">User History</div>
              <div className="action-desc">View user parking records</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}


