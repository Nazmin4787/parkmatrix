import { useEffect, useState } from 'react';
import { getUserBookings } from '../../services/bookingslot';

export default function SimpleBookingsList() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchBookings() {
      try {
        setLoading(true);
        const data = await getUserBookings();
        console.log('Raw API response:', data);
        if (Array.isArray(data)) {
          setBookings(data);
        } else {
          setBookings([]);
        }
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load bookings: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBookings();
  }, []);

  if (loading) return <div>Loading bookings...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!bookings.length) return <div>No bookings found.</div>;

  return (
    <div>
      <h2>My Bookings ({bookings.length})</h2>
      
      <div>
        {bookings.map(booking => (
          <div 
            key={booking.id} 
            style={{ 
              border: '1px solid #ccc', 
              margin: '10px 0', 
              padding: '10px',
              borderRadius: '4px' 
            }}
          >
            <h3>Booking #{booking.id}</h3>
            <pre>{JSON.stringify(booking, null, 2)}</pre>
            <p>Status: {booking.is_active ? 'Active' : 'Completed'}</p>
            {booking.start_time && (
              <p>Start: {new Date(booking.start_time).toLocaleString()}</p>
            )}
            {booking.end_time && (
              <p>End: {new Date(booking.end_time).toLocaleString()}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}