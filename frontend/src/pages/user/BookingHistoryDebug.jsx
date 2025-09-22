import { useEffect, useState } from 'react';
import { getUserBookings, cancelBooking } from '../../services/bookingslot';
import '../../stylesheets/booking-history.css';

export default function BookingHistoryDebug() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadBookings() {
      try {
        console.log('Starting to load bookings...');
        setLoading(true);
        setError(null);
        
        // Check authentication
        const token = localStorage.getItem('accessToken');
        console.log('Token exists:', !!token);
        
        if (!token) {
          throw new Error('No authentication token found. Please log in.');
        }
        
        const data = await getUserBookings();
        console.log('Raw API response:', data);
        
        if (Array.isArray(data)) {
          setBookings(data);
          console.log('Set bookings array:', data);
        } else if (data && data.results && Array.isArray(data.results)) {
          setBookings(data.results);
          console.log('Set bookings from results:', data.results);
        } else {
          setBookings([]);
          console.log('No bookings data, set empty array');
        }
        
      } catch (err) {
        console.error('Error in loadBookings:', err);
        setError(err.message || 'Failed to load bookings');
        setBookings([]);
      } finally {
        setLoading(false);
      }
    }
    
    loadBookings();
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  console.log('Render state:', { loading, error, bookingsCount: bookings.length });

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>My Bookings</h2>
        <div>Loading your bookings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>My Bookings</h2>
        <div style={{ 
          background: '#f8d7da', 
          color: '#721c24', 
          padding: '15px', 
          borderRadius: '5px',
          border: '1px solid #f5c6cb'
        }}>
          <strong>Error:</strong> {error}
          <br />
          <button 
            onClick={handleRetry}
            style={{ 
              marginTop: '10px',
              padding: '8px 16px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>My Bookings</h2>
      
      <div style={{ 
        background: '#d4edda', 
        padding: '10px', 
        marginBottom: '20px',
        borderRadius: '4px',
        border: '1px solid #c3e6cb'
      }}>
        Debug Info: Found {bookings.length} bookings
      </div>

      {bookings.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          background: '#f8f9fa',
          borderRadius: '8px',
          color: '#666'
        }}>
          <p>No bookings found.</p>
          <p>Create your first booking to see it here!</p>
        </div>
      ) : (
        <div>
          {bookings.map((booking, index) => (
            <div key={booking.id || index} style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '10px',
              background: 'white'
            }}>
              <h4>Booking #{booking.id || 'Unknown'}</h4>
              <p><strong>Slot:</strong> {booking.slot_number || booking.slot || 'N/A'}</p>
              <p><strong>Start:</strong> {booking.start_time ? new Date(booking.start_time).toLocaleString() : 'N/A'}</p>
              <p><strong>End:</strong> {booking.end_time ? new Date(booking.end_time).toLocaleString() : 'N/A'}</p>
              <p><strong>Status:</strong> {booking.is_active ? 'Active' : 'Completed'}</p>
              {booking.vehicle && <p><strong>Vehicle:</strong> {booking.vehicle}</p>}
              {booking.total_amount && <p><strong>Amount:</strong> ₹{booking.total_amount}</p>}
              
              <div style={{ marginTop: '10px' }}>
                <button style={{
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  marginRight: '8px',
                  cursor: 'pointer'
                }}>
                  View Details
                </button>
                {booking.is_active && (
                  <button style={{
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}