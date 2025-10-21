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
    <div>
      <h2>Admin Dashboard</h2>

      <div className="kpis">
        <div className="kpi-card">
          <div className="kpi-label">Total Slots</div>
          <div className="kpi-value">{loading ? '...' : slotStats.total}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Occupied Slots</div>
          <div className="kpi-value">{loading ? '...' : slotStats.occupied}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Free Slots</div>
          <div className="kpi-value">{loading ? '...' : slotStats.free}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Occupancy Rate</div>
          <div className="kpi-value">{loading ? '...' : slotStats.rate + '%'}</div>
        </div>
      </div>

      <div className="admin-actions">
        <Link className="btn-primary small" to="/admin/slots">Manage Slots</Link>
        <Link className="btn-outline" to="/admin/slot-tracker">🅿️ Track Parking Slots</Link>
        {/* REMOVED: View Bookings feature */}
        {/* <Link className="btn-outline" to="/admin/bookings">View Bookings</Link> */}
        <Link className="btn-outline" to="/admin/access-logs">📋 View Access Logs</Link>
        <Link className="btn-outline" to="/admin/checkin-checkout-logs">🚗 Check-In/Out Logs</Link>
        <Link className="btn-outline" to="/admin/user-history">👥 User Parking History</Link>
      </div>
    </div>
  );
}


