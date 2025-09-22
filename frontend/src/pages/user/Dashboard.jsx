import { Link } from 'react-router-dom';

export default function UserDashboard() {
  return (
    <div>
      <h2>User Dashboard</h2>
      <ul className="list">
        <li className="list-item"><Link to="/slots">Browse Available Slots</Link></li>
        <li className="list-item"><Link to="/bookings">My Bookings</Link></li>
      </ul>
    </div>
  );
}


