import React, { useState, useEffect } from 'react';
import { getSlotStatistics, getDetailedSlotStatus, getActiveBookings } from '../../services/slotTracking';
import { listAllSlots } from '../../services/parkingSlot';
import './SlotStatusTracker.css';

const SlotStatusTracker = () => {
  // State for tracking statistics and slot details
  const [stats, setStats] = useState({
    totalSlots: 0,
    occupiedSlots: 0,
    freeSlots: 0,
    occupancyRate: 0
  });
  const [slotDetails, setSlotDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVehicleType, setFilterVehicleType] = useState('all');

  // Fetch initial data
  useEffect(() => {
    fetchData();
    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch data based on filters
  useEffect(() => {
    fetchSlotDetails();
  }, [filterStatus, filterVehicleType]);

  // Function to fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchStatistics(), fetchSlotDetails()]);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch parking data. Please try again later.');
      setLoading(false);
      console.error('Error fetching parking data:', err);
    }
  };

  // Function to fetch statistics
  const fetchStatistics = async () => {
    try {
      // Temporary workaround until backend endpoint is ready
      // Replace with getSlotStatistics() when backend is ready
      const slots = await listAllSlots();
      const occupied = slots.filter(slot => slot.is_occupied).length;
      const total = slots.length;
      const free = total - occupied;
      const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;
      
      setStats({
        totalSlots: total,
        occupiedSlots: occupied,
        freeSlots: free,
        occupancyRate: rate
      });
    } catch (err) {
      console.error('Error fetching statistics:', err);
      throw err;
    }
  };

  // Function to fetch slot details
  const fetchSlotDetails = async () => {
    try {
      console.log("Fetching slot details...");
      // Fetch all slots and active bookings
      const [allSlots, activeBookings] = await Promise.all([
        listAllSlots(),
        getActiveBookings()
      ]);
      
      console.log("All slots:", allSlots);
      console.log("Active bookings:", activeBookings);
      
      // Create a lookup map for active bookings by slot_number
      const bookingMap = {};
      if (activeBookings && Array.isArray(activeBookings)) {
        activeBookings.forEach(booking => {
          if (booking && booking.slot_number) {
            bookingMap[booking.slot_number] = booking;
          }
        });
      }
      
      // Apply filters to slots
      let filteredSlots = [...allSlots];
      
      // Apply status filter
      if (filterStatus === 'free') {
        filteredSlots = filteredSlots.filter(slot => !slot.is_occupied);
      } else if (filterStatus === 'occupied') {
        filteredSlots = filteredSlots.filter(slot => slot.is_occupied);
      }
      
      // Apply vehicle type filter
      if (filterVehicleType !== 'all') {
        filteredSlots = filteredSlots.filter(slot => {
          // Check if this slot has an active booking
          const booking = bookingMap[slot.slot_number];
          if (slot.is_occupied && booking) {
            return booking.vehicle_type === filterVehicleType;
          }
          // Otherwise check the slot's designated vehicle type
          return slot.vehicle_type === filterVehicleType;
        });
      }
      
      // Transform slot data for display
      const transformedSlots = filteredSlots.map(slot => {
        // Check if we have booking data for this slot
        const booking = bookingMap[slot.slot_number];
        const isOccupied = slot.is_occupied;
        
        return {
          id: slot.id,
          slotId: slot.slot_number,
          status: isOccupied ? 'Occupied' : 'Free',
          vehicleNo: (isOccupied && booking && booking.vehicle_no) ? booking.vehicle_no : '',
          vehicleType: (booking && booking.vehicle_type) ? booking.vehicle_type : slot.vehicle_type || 'any',
          userId: (isOccupied && booking && booking.user_id) ? booking.user_id : '',
          checkIn: (isOccupied && booking && booking.check_in_time) ? booking.check_in_time : '',
          checkOut: (isOccupied && booking) ? (booking.checked_out_at || '') : '',
          parkingZone: slot.parking_zone_display || 'Unknown'
        };
      });

      setSlotDetails(transformedSlots);
    } catch (err) {
      console.error('Error fetching slot details:', err);
      // Don't throw error, just set empty array to prevent crash
      setSlotDetails([]);
    }
  };

  // Handle status filter change
  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
  };

  // Handle vehicle type filter change
  const handleVehicleTypeFilterChange = (e) => {
    setFilterVehicleType(e.target.value);
  };

  // Refresh data manually
  const handleRefresh = () => {
    fetchData();
  };

  // Format time
  const formatTime = (timeString) => {
    if (!timeString) return '';
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    return status === 'Free' ? 'status-free' : 'status-occupied';
  };

  return (
    <div className="slot-tracker-container">
      <div className="header-with-actions">
        <h2>Parking Slot Status</h2>
        <div className="actions">
          <button 
            className="refresh-btn" 
            onClick={handleRefresh} 
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <div className="last-updated">
            {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stat-cards">
        <div className="stat-card total">
          <div className="card-icon">P</div>
          <div className="card-content">
            <div className="card-title">Total Slots</div>
            <div className="card-value">{stats.totalSlots}</div>
          </div>
        </div>
        <div className="stat-card occupied">
          <div className="card-icon">🚗</div>
          <div className="card-content">
            <div className="card-title">Occupied Slots</div>
            <div className="card-value">{stats.occupiedSlots}</div>
          </div>
        </div>
        <div className="stat-card free">
          <div className="card-icon">✓</div>
          <div className="card-content">
            <div className="card-title">Free Slots</div>
            <div className="card-value">{stats.freeSlots}</div>
          </div>
        </div>
        <div className="stat-card rate">
          <div className="card-icon">⟳</div>
          <div className="card-content">
            <div className="card-title">Occupancy Rate</div>
            <div className="card-value">{stats.occupancyRate}%</div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="filter-controls">
        <div className="filter-group">
          <label htmlFor="statusFilter">Status:</label>
          <select 
            id="statusFilter" 
            value={filterStatus} 
            onChange={handleFilterChange}
          >
            <option value="all">All Slots</option>
            <option value="free">Free Slots</option>
            <option value="occupied">Occupied Slots</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="vehicleTypeFilter">Vehicle Type:</label>
          <select 
            id="vehicleTypeFilter" 
            value={filterVehicleType} 
            onChange={handleVehicleTypeFilterChange}
          >
            <option value="all">All Types</option>
            <option value="car">Car</option>
            <option value="suv">SUV</option>
            <option value="bike">Bike</option>
            <option value="truck">Truck</option>
            <option value="any">Any Vehicle</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Slot Details Table */}
      <div className="slot-status-table-container">
        <h3>Slot Status</h3>
        {loading && slotDetails.length === 0 ? (
          <div className="loading-message">Loading slot data...</div>
        ) : (
          <table className="slot-status-table">
            <thead>
              <tr>
                <th>Slot ID</th>
                <th>Status</th>
                <th>Vehicle No</th>
                <th>Vehicle Type</th>
                <th>User ID</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Parking Zone</th>
              </tr>
            </thead>
            <tbody>
              {slotDetails.length > 0 ? (
                slotDetails.map((slot) => (
                  <tr key={slot.id}>
                    <td>{slot.slotId}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadge(slot.status)}`}>
                        {slot.status}
                      </span>
                    </td>
                    <td>{slot.status === 'Occupied' ? slot.vehicleNo : '-'}</td>
                    <td>
                      {slot.vehicleType ? 
                        slot.vehicleType.charAt(0).toUpperCase() + slot.vehicleType.slice(1) : 
                        (slot.status === 'Occupied' ? 'Car' : 'Any')}
                    </td>
                    <td>{slot.status === 'Occupied' ? slot.userId : '-'}</td>
                    <td>{slot.status === 'Occupied' ? formatTime(slot.checkIn) : '-'}</td>
                    <td>{slot.status === 'Occupied' ? (slot.checkOut ? formatTime(slot.checkOut) : 'Active') : '-'}</td>
                    <td>{slot.parkingZone || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="no-data">No slot data available</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SlotStatusTracker;