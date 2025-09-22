import { Link } from 'react-router-dom';
import '../../stylesheets/admin.css';

export default function AdminDashboard() {
  return (
    <div>
      <h2>Admin Dashboard</h2>

      <div className="kpis">
        <div className="kpi-card">
          <div className="kpi-label">Total Slots</div>
          <div className="kpi-value">50</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Active Bookings</div>
          <div className="kpi-value">12</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Revenue Today</div>
          <div className="kpi-value">$150</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Users Online</div>
          <div className="kpi-value">25</div>
        </div>
      </div>

      <div className="admin-actions">
        <Link className="btn-primary small" to="/admin/slots">Manage Slots</Link>
        <Link className="btn-outline" to="/admin/bookings">View Bookings</Link>
      </div>
    </div>
  );
}


