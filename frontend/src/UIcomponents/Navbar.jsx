import { Link, useNavigate } from 'react-router-dom';
import { clearSession, getCurrentUser } from '../store/userstore';
import NotificationBell from './NotificationBell';
import '../stylesheets/navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">🅿️</span>
          <span className="brand-name">ParkSmart</span>
        </Link>

        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/nearest-parking">📍 Nearest Parking</Link>
          {user?.role === 'customer' && <Link to="/slots">Available Slots</Link>}
          {user?.role === 'customer' && <Link to="/bookings">My Bookings</Link>}
          {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
          {user?.role === 'admin' && <Link to="/admin/slots">Manage Slots</Link>}
        </nav>

        <div className="nav-cta">
          {user && <NotificationBell />}
          {!user && <Link className="btn-outline" to="/signin">Sign In</Link>}
          {!user && <Link className="btn-primary small" to="/signup">Sign Up</Link>}
          {user && (
            <button className="btn-outline" onClick={() => { clearSession(); navigate('/signin'); }}>Sign Out</button>
          )}
        </div>
      </div>
    </header>
  );
}
