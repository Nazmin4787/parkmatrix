import React, { useState, useEffect } from 'react';
import { getUserBookings, cancelBooking } from '../../services/bookingslot';
import BookingTicket from '../../UIcomponents/BookingTicket';
import BookingCard from '../../UIcomponents/BookingCard';
import Toast from '../../UIcomponents/Toast';
import Loading from '../../UIcomponents/Loading';
import '../../stylesheets/components.css';
import '../../stylesheets/booking-history.css';

// Super simple implementation
export default function BookingHistory() {
  // Basic state
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  // Load bookings function with localStorage backup
  function loadBookings() {
    setLoading(true);
    setError(null);
    
    getUserBookings()
      .then(response => {
        console.log("API Response:", response);
        
        // Handle different response formats
        let bookingsData = [];
        if (Array.isArray(response)) {
          bookingsData = response;
        } else if (response && typeof response === 'object') {
          // Try to extract from object
          bookingsData = response.bookings || response.results || [];
        }
        
        console.log("Processed bookings:", bookingsData);
        
        // Save to localStorage as backup
        if (bookingsData && bookingsData.length > 0) {
          try {
            localStorage.setItem('userBookings', JSON.stringify(bookingsData));
            console.log('Bookings saved to localStorage');
          } catch (e) {
            console.error('Error saving to localStorage:', e);
          }
        }
        
        setBookings(bookingsData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading bookings:", err);
        setError("Failed to load bookings from server");
        setLoading(false);
        
        // Try to load from localStorage as fallback
        try {
          const cachedBookings = localStorage.getItem('userBookings');
          if (cachedBookings) {
            const parsedBookings = JSON.parse(cachedBookings);
            console.log('Loaded', parsedBookings.length, 'bookings from localStorage');
            setBookings(parsedBookings);
            setMessage('Showing cached bookings. Click refresh to try again.');
          } else {
            setBookings([]);
          }
        } catch (cacheErr) {
          console.error('Error reading from localStorage:', cacheErr);
          setBookings([]);
        }
      });
  }

  // Load bookings on component mount
  useEffect(() => {
    console.log('BookingHistory component mounted');
    
    // Check authentication before loading
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('You must be logged in to view bookings');
      setLoading(false);
      return;
    }
    
    loadBookings();
    
    // Set up periodic refresh every 30 seconds for active bookings
    const refreshInterval = setInterval(() => {
      if (activeTab === 'active') {
        console.log('Auto-refreshing active bookings');
        loadBookings();
      }
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [activeTab]);
  
  // Log when bookings change
  useEffect(() => {
    console.log('Bookings updated:', bookings.length, 'items');
    
    // Save last successful booking data
    if (bookings.length > 0) {
      const timestamp = new Date().toISOString();
      localStorage.setItem('lastBookingsFetch', timestamp);
    }
  }, [bookings]);

  // Handle cancellation
  function handleCancelBooking(id) {
    setMessage(null);
    cancelBooking(id)
      .then(() => {
        setMessage("Booking cancelled successfully");
        loadBookings(); // Reload the list
      })
      .catch(err => {
        console.error("Error cancelling booking:", err);
        setMessage("Failed to cancel booking");
      });
  }
  
  // Show/hide ticket modal
  function handleShowTicket(booking) {
    setSelectedTicket(booking);
    setShowTicketModal(true);
  }
  
  function closeTicketModal() {
    setShowTicketModal(false);
    setSelectedTicket(null);
  }
  
  // Filter bookings by active tab
  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'active') return booking.is_active;
    if (activeTab === 'completed') return !booking.is_active;
    return true; // all bookings
  });

  return (
    <div className="container">
      <h2>My Bookings</h2>
      
      {/* Header with refresh button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '10px 0' }}>
        <button 
          onClick={loadBookings} 
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      
      {/* Tab navigation */}
      <div className="tab-navigation" style={{ display: 'flex', marginBottom: '20px' }}>
        <button 
          className={activeTab === 'active' ? 'btn-outline is-active' : 'btn-outline'}
          onClick={() => setActiveTab('active')}
        >
          Active
        </button>
        <button 
          className={activeTab === 'completed' ? 'btn-outline is-active' : 'btn-outline'}
          onClick={() => setActiveTab('completed')}
        >
          Completed
        </button>
        <button 
          className={activeTab === 'all' ? 'btn-outline is-active' : 'btn-outline'}
          onClick={() => setActiveTab('all')}
        >
          All
        </button>
      </div>
      
      {/* Loading state */}
      {loading && <Loading />}
      
      {/* Error message with more context */}
      {error && !loading && (
        <div style={{ background: '#f8d7da', color: '#721c24', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Error Loading Bookings</h4>
          <p>{error}</p>
          
          {/* Show last successful fetch time if available */}
          {localStorage.getItem('lastBookingsFetch') && (
            <p>Last successful update: {new Date(localStorage.getItem('lastBookingsFetch')).toLocaleString()}</p>
          )}
          
          <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
            <button onClick={loadBookings} className="btn-primary">
              Retry
            </button>
            {localStorage.getItem('userBookings') && (
              <button 
                onClick={() => {
                  try {
                    const cachedData = JSON.parse(localStorage.getItem('userBookings') || '[]');
                    setBookings(cachedData);
                    setError(null);
                    setMessage('Showing cached bookings from your last session');
                  } catch (e) {
                    console.error('Failed to load cached bookings', e);
                  }
                }}
                className="btn-secondary"
              >
                Load Cached Data
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {!loading && !error && filteredBookings.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>No bookings found.</p>
          <p>Start by making your first booking!</p>
        </div>
      )}
      
      {/* Bookings list */}
      {!loading && !error && filteredBookings.length > 0 && (
        <div>
          <p>Showing {filteredBookings.length} bookings</p>
          <div className="booking-list">
            {filteredBookings.map(booking => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onViewTicket={handleShowTicket}
                onCancel={handleCancelBooking}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Ticket modal */}
      {showTicketModal && selectedTicket && (
        <div className="modal-overlay" onClick={closeTicketModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Booking Ticket</h3>
              <button onClick={closeTicketModal} className="close-btn">×</button>
            </div>
            <BookingTicket booking={selectedTicket} />
          </div>
        </div>
      )}
      
      {/* Toast notifications */}
      {message && (
        <Toast 
          message={message} 
          type={message.includes('success') ? 'success' : 'info'}
          onClose={() => setMessage(null)} 
        />
      )}
    </div>
  );
}


