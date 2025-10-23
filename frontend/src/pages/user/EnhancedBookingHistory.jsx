import React, { useState, useEffect } from 'react';
import { getMyBookings, cancelBooking } from '../../services/bookingslot';
import BookingTicket from '../../UIcomponents/BookingTicket';
import EnhancedBookingCard from '../../UIcomponents/EnhancedBookingCard';
import Toast from '../../UIcomponents/Toast';
import Loading from '../../UIcomponents/Loading';
import '../../stylesheets/components.css';
import '../../stylesheets/booking-history.css';
import '../../stylesheets/booking-card.css';

// Enhanced BookingHistory with check-in/check-out integration
export default function EnhancedBookingHistory() {
  // Enhanced state with new booking statuses
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Enhanced booking status filters
  const statusFilters = {
    active: ['confirmed', 'verified', 'checked_in', 'checkout_requested', 'checkout_verified'],
    completed: ['checked_out', 'cancelled', 'expired'],
    checkedIn: ['checked_in', 'checkout_requested', 'checkout_verified'],
    all: []
  };

  // Load bookings function with enhanced error handling
  const loadBookings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Loading bookings with getMyBookings...");
      const response = await getMyBookings();
      console.log("Enhanced API Response:", response);
      
      // Handle paginated response from our new API
      let bookingsData = [];
      if (response && typeof response === 'object') {
        if (response.results && Array.isArray(response.results)) {
          bookingsData = response.results;
        } else if (Array.isArray(response)) {
          bookingsData = response;
        } else if (response.bookings && Array.isArray(response.bookings)) {
          bookingsData = response.bookings;
        }
      }
      
      console.log("Processed enhanced bookings:", bookingsData);
      
      // Save to localStorage with enhanced data structure
      if (bookingsData && bookingsData.length > 0) {
        try {
          const dataToCache = {
            bookings: bookingsData,
            timestamp: new Date().toISOString(),
            version: '2.0' // Enhanced version
          };
          localStorage.setItem('enhancedUserBookings', JSON.stringify(dataToCache));
          console.log('Enhanced bookings saved to localStorage');
        } catch (e) {
          console.error('Error saving to localStorage:', e);
        }
      }
      
      setBookings(bookingsData);
      setLoading(false);
      
    } catch (err) {
      console.error("Error loading enhanced bookings:", err);
      setError("Failed to load bookings from server");
      setLoading(false);
      
      // Try to load from enhanced localStorage as fallback
      try {
        const cachedData = localStorage.getItem('enhancedUserBookings');
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          if (parsedData.bookings && Array.isArray(parsedData.bookings)) {
            console.log('Loaded', parsedData.bookings.length, 'enhanced bookings from localStorage');
            setBookings(parsedData.bookings);
            setMessage('Showing cached bookings. Click refresh to try again.');
          }
        } else {
          // Fallback to old localStorage format
          const oldCachedBookings = localStorage.getItem('userBookings');
          if (oldCachedBookings) {
            const parsedBookings = JSON.parse(oldCachedBookings);
            console.log('Loaded', parsedBookings.length, 'bookings from old localStorage');
            setBookings(parsedBookings);
            setMessage('Showing cached bookings. Click refresh to try again.');
          } else {
            setBookings([]);
          }
        }
      } catch (cacheErr) {
        console.error('Error reading from localStorage:', cacheErr);
        setBookings([]);
      }
    }
  };

  // Enhanced auto-refresh for checked-in bookings
  useEffect(() => {
    console.log('EnhancedBookingHistory component mounted, tab:', activeTab);
    
    // Check authentication
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('You must be logged in to view bookings');
      setLoading(false);
      return;
    }
    
    loadBookings();
    
    // Clear existing interval
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    
    // Set up enhanced auto-refresh based on tab
    let interval = null;
    if (activeTab === 'active' || activeTab === 'checkedIn') {
      // Refresh more frequently for active and checked-in bookings
      interval = setInterval(() => {
        console.log('Auto-refreshing enhanced bookings for tab:', activeTab);
        loadBookings();
      }, 15000); // 15 seconds for active/checked-in
    } else if (activeTab === 'all') {
      // Less frequent refresh for all bookings
      interval = setInterval(() => {
        console.log('Auto-refreshing all bookings');
        loadBookings();
      }, 60000); // 60 seconds for all
    }
    
    setRefreshInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  // Handle status change (after check-in/check-out)
  const handleStatusChange = () => {
    console.log('Booking status changed, refreshing...');
    loadBookings();
  };

  // Enhanced cancellation with status check
  const handleCancelBooking = async (id) => {
    const booking = bookings.find(b => b.id === id);
    if (booking && booking.status === 'checked_in') {
      setMessage("Cannot cancel a booking that is already checked in. Please check out first.");
      return;
    }

    setMessage(null);
    try {
      await cancelBooking(id);
      setMessage("Booking cancelled successfully");
      loadBookings();
    } catch (err) {
      console.error("Error cancelling booking:", err);
      const errorMessage = err.response?.data?.error || "Failed to cancel booking";
      setMessage(errorMessage);
    }
  };
  
  // Show/hide ticket modal
  const handleShowTicket = (booking) => {
    setSelectedTicket(booking);
    setShowTicketModal(true);
  };
  
  const closeTicketModal = () => {
    setShowTicketModal(false);
    setSelectedTicket(null);
  };
  
  // Enhanced filtering with new status types
  const filteredBookings = bookings.filter(booking => {
    const status = booking.status || (booking.is_active ? 'confirmed' : 'completed');
    
    if (activeTab === 'all') return true;
    
    const allowedStatuses = statusFilters[activeTab] || [];
    if (allowedStatuses.length === 0) return true;
    
    return allowedStatuses.includes(status);
  });

  // Get stats for display
  const getBookingStats = () => {
    const stats = bookings.reduce((acc, booking) => {
      const status = booking.status || (booking.is_active ? 'confirmed' : 'completed');
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    return {
      total: bookings.length,
      confirmed: stats.confirmed || 0,
      checkedIn: stats.checked_in || 0,
      checkedOut: stats.checked_out || 0,
      cancelled: stats.cancelled || 0,
      expired: stats.expired || 0
    };
  };

  const stats = getBookingStats();

  return (
    <div className="container">
      <div className="enhanced-booking-history">
        <h2>My Bookings</h2>
        
        {/* Enhanced header with stats and refresh */}
        <div className="booking-header-controls">
          <div className="booking-stats">
            <span className="stat-item">Total: {stats.total}</span>
            {stats.confirmed > 0 && <span className="stat-item confirmed">Ready: {stats.confirmed}</span>}
            {stats.checkedIn > 0 && <span className="stat-item checked-in">Checked In: {stats.checkedIn}</span>}
            {stats.checkedOut > 0 && <span className="stat-item checked-out">Checked Out: {stats.checkedOut}</span>}
          </div>
          <button 
            onClick={loadBookings} 
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        
        {/* Enhanced tab navigation */}
        <div className="enhanced-tab-navigation">
          <button 
            className={activeTab === 'active' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setActiveTab('active')}
          >
            Active ({stats.confirmed + stats.checkedIn})
          </button>
          <button 
            className={activeTab === 'checkedIn' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setActiveTab('checkedIn')}
          >
            Checked In ({stats.checkedIn})
          </button>
          <button 
            className={activeTab === 'completed' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setActiveTab('completed')}
          >
            Completed ({stats.checkedOut + stats.cancelled + stats.expired})
          </button>
          <button 
            className={activeTab === 'all' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setActiveTab('all')}
          >
            All ({stats.total})
          </button>
        </div>
        
        {/* Loading state */}
        {loading && <Loading />}
        
        {/* Enhanced error display */}
        {error && !loading && (
          <div className="error-container">
            <h4>Error Loading Bookings</h4>
            <p>{error}</p>
            
            {localStorage.getItem('enhancedUserBookings') && (
              <p>Last successful update: {(() => {
                try {
                  const data = JSON.parse(localStorage.getItem('enhancedUserBookings'));
                  return new Date(data.timestamp).toLocaleString();
                } catch (e) {
                  return 'Unknown';
                }
              })()}</p>
            )}
            
            <div className="error-actions">
              <button onClick={loadBookings} className="btn-primary">
                Retry
              </button>
              {localStorage.getItem('enhancedUserBookings') && (
                <button 
                  onClick={() => {
                    try {
                      const cachedData = JSON.parse(localStorage.getItem('enhancedUserBookings'));
                      setBookings(cachedData.bookings || []);
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
        
        {/* Enhanced empty state */}
        {!loading && !error && filteredBookings.length === 0 && (
          <div className="empty-state">
            {activeTab === 'checkedIn' ? (
              <>
                <p>No checked-in bookings found.</p>
                <p>Check in to your confirmed bookings to see them here!</p>
              </>
            ) : activeTab === 'active' ? (
              <>
                <p>No active bookings found.</p>
                <p>Start by making your first booking!</p>
              </>
            ) : (
              <>
                <p>No {activeTab} bookings found.</p>
                <p>Your {activeTab} bookings will appear here.</p>
              </>
            )}
          </div>
        )}
        
        {/* Enhanced bookings list */}
        {!loading && !error && filteredBookings.length > 0 && (
          <div>
            <p className="booking-count">
              Showing {filteredBookings.length} {activeTab} booking{filteredBookings.length !== 1 ? 's' : ''}
            </p>
            <div className="enhanced-booking-list">
              {filteredBookings.map(booking => (
                <EnhancedBookingCard
                  key={booking.id}
                  booking={booking}
                  onViewTicket={handleShowTicket}
                  onCancel={handleCancelBooking}
                  onStatusChange={handleStatusChange}
                  showActions={true}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Enhanced ticket modal */}
        {showTicketModal && selectedTicket && (
          <div className="modal-overlay" onClick={closeTicketModal}>
            <div className="modal-content enhanced" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Booking Ticket #{selectedTicket.id}</h3>
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
            type={message.includes('success') ? 'success' : message.includes('Error') || message.includes('Failed') ? 'error' : 'info'}
            onClose={() => setMessage(null)} 
          />
        )}
      </div>
    </div>
  );
}