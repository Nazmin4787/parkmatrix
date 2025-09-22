import { useEffect, useState } from 'react';
import { listUserBookings } from '../../services/bookingslot';

export default function SecurityBookingHistory() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    async function load() {
      const data = await listUserBookings();
      setBookings(Array.isArray(data) ? data : []);
    }
    load();
  }, []);

  return (
    <div>
      <h2>Security — Booking History (placeholder)</h2>
      <ul className="list">
        {bookings.map(b => (
          <li key={b.id} className="list-item">
            <div>Slot #{b.slot} — Start: {new Date(b.start_time).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}


