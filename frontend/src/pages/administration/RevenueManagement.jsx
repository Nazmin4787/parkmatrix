import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RevenueManagement.css';

export default function RevenueManagement() {
  const [revenueData, setRevenueData] = useState({
    total_revenue: 0,
    booking_revenue: 0,
    overstay_revenue: 0,
    today_revenue: 0,
    month_revenue: 0,
    by_zone: [],
    by_vehicle_type: [],
    recent_transactions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });
  const [filterZone, setFilterZone] = useState('all');
  const [filterVehicleType, setFilterVehicleType] = useState('all');

  useEffect(() => {
    loadRevenueData();
  }, [dateRange, filterZone, filterVehicleType]);

  async function loadRevenueData() {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        start_date: dateRange.start_date,
        end_date: dateRange.end_date
      });
      
      if (filterZone !== 'all') {
        params.append('zone', filterZone);
      }
      
      if (filterVehicleType !== 'all') {
        params.append('vehicle_type', filterVehicleType);
      }

      const response = await axios.get(
        `http://localhost:8000/api/admin/revenue/?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRevenueData(response.data);
    } catch (err) {
      console.error('Error loading revenue data:', err);
      setError(err.response?.data?.error || 'Failed to load revenue data');
      
      // Set empty data structure on error
      setRevenueData({
        total_revenue: 0,
        booking_revenue: 0,
        overstay_revenue: 0,
        today_revenue: 0,
        month_revenue: 0,
        by_zone: [],
        by_vehicle_type: [],
        recent_transactions: []
      });
    } finally {
      setLoading(false);
    }
  }

  function exportToCSV() {
    const csvData = [
      ['Booking ID', 'Vehicle', 'Booking Amount', 'Overstay Fee', 'Total', 'Date', 'Zone'],
      ...revenueData.recent_transactions.map(t => [
        t.id,
        t.vehicle,
        t.amount.toFixed(2),
        t.overstay.toFixed(2),
        t.total.toFixed(2),
        t.date,
        t.zone
      ])
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue_report_${dateRange.start_date}_to_${dateRange.end_date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (loading && !revenueData.total_revenue) {
    return (
      <div className="revenue-management">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading revenue data...</p>
        </div>
      </div>
    );
  }

  const hasData = revenueData.total_revenue > 0 || revenueData.recent_transactions.length > 0;

  return (
    <div className="revenue-management">
      <div className="revenue-header">
        <div>
          <h1>💰 Revenue Management</h1>
          <p className="subtitle">Track earnings from bookings and overstay fees</p>
        </div>
        <button className="btn-export" onClick={exportToCSV} disabled={!hasData}>
          📥 Export Report
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {!hasData && !loading && (
        <div className="alert alert-info">
          <strong>No Data Available:</strong> There are no revenue records for the selected date range and filters.
        </div>
      )}

      {/* Filters */}
      <div className="revenue-filters">
        <div className="filter-group">
          <label>Date Range</label>
          <div className="date-inputs">
            <input
              type="date"
              value={dateRange.start_date}
              onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
            />
            <span>to</span>
            <input
              type="date"
              value={dateRange.end_date}
              onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Parking Zone</label>
          <select value={filterZone} onChange={(e) => setFilterZone(e.target.value)}>
            <option value="all">All Zones</option>
            <option value="college">College Parking</option>
            <option value="home">Home Parking</option>
            <option value="mall">Mall Parking</option>
            <option value="airport">Airport Parking</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Vehicle Type</label>
          <select value={filterVehicleType} onChange={(e) => setFilterVehicleType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="car">Car</option>
            <option value="suv">SUV</option>
            <option value="bike">Bike</option>
            <option value="truck">Truck</option>
          </select>
        </div>

        <button className="btn-apply-filters" onClick={loadRevenueData}>
          🔍 Apply Filters
        </button>
      </div>

      {/* Summary Cards */}
      <div className="revenue-summary-cards">
        <div className="summary-card total">
          <div className="card-icon">💵</div>
          <div className="card-content">
            <h3>Total Revenue</h3>
            <div className="amount">${revenueData.total_revenue.toFixed(2)}</div>
            <p className="card-subtitle">All time earnings</p>
          </div>
        </div>

        <div className="summary-card bookings">
          <div className="card-icon">🅿️</div>
          <div className="card-content">
            <h3>Booking Revenue</h3>
            <div className="amount">${revenueData.booking_revenue.toFixed(2)}</div>
            <p className="card-subtitle">Regular parking fees</p>
          </div>
        </div>

        <div className="summary-card overstay">
          <div className="card-icon">⏰</div>
          <div className="card-content">
            <h3>Overstay Revenue</h3>
            <div className="amount">${revenueData.overstay_revenue.toFixed(2)}</div>
            <p className="card-subtitle">Additional charges</p>
          </div>
        </div>

        <div className="summary-card today">
          <div className="card-icon">📅</div>
          <div className="card-content">
            <h3>Today's Revenue</h3>
            <div className="amount">${revenueData.today_revenue.toFixed(2)}</div>
            <p className="card-subtitle">Last 24 hours</p>
          </div>
        </div>

        <div className="summary-card month">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <h3>This Month</h3>
            <div className="amount">${revenueData.month_revenue.toFixed(2)}</div>
            <p className="card-subtitle">Current month earnings</p>
          </div>
        </div>

        <div className="summary-card percentage">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <h3>Overstay %</h3>
            <div className="amount">
              {((revenueData.overstay_revenue / revenueData.total_revenue) * 100).toFixed(1)}%
            </div>
            <p className="card-subtitle">Of total revenue</p>
          </div>
        </div>
      </div>

      {/* Revenue by Zone */}
      <div className="revenue-section">
        <h2>💼 Revenue by Parking Zone</h2>
        {revenueData.by_zone.length > 0 ? (
          <div className="zone-revenue-grid">
            {revenueData.by_zone.map((zone, index) => (
              <div key={index} className="zone-card">
                <div className="zone-header">
                  <h3>{zone.zone}</h3>
                  <div className="zone-total">${zone.revenue.toFixed(2)}</div>
                </div>
                <div className="zone-details">
                  <div className="detail-row">
                    <span className="label">Total Bookings:</span>
                    <span className="value">{zone.bookings}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Booking Revenue:</span>
                    <span className="value">${(zone.revenue - zone.overstay).toFixed(2)}</span>
                  </div>
                  <div className="detail-row overstay">
                    <span className="label">Overstay Revenue:</span>
                    <span className="value">${zone.overstay.toFixed(2)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Avg per Booking:</span>
                    <span className="value">${(zone.revenue / zone.bookings).toFixed(2)}</span>
                  </div>
                </div>
                <div className="zone-progress">
                  <div 
                    className="progress-bar" 
                    style={{ 
                      width: `${(zone.revenue / Math.max(...revenueData.by_zone.map(z => z.revenue))) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No zone revenue data available for the selected period.</p>
          </div>
        )}
      </div>

      {/* Revenue by Vehicle Type */}
      <div className="revenue-section">
        <h2>🚗 Revenue by Vehicle Type</h2>
        {revenueData.by_vehicle_type.length > 0 ? (
          <div className="vehicle-revenue-table">
            <table>
              <thead>
                <tr>
                  <th>Vehicle Type</th>
                  <th>Total Vehicles</th>
                  <th>Total Revenue</th>
                  <th>Avg Revenue/Vehicle</th>
                  <th>% of Total</th>
                </tr>
              </thead>
              <tbody>
                {revenueData.by_vehicle_type.map((vehicle, index) => (
                  <tr key={index}>
                    <td>
                      <span className="vehicle-type-badge">{vehicle.vehicle_type}</span>
                    </td>
                    <td>{vehicle.count}</td>
                    <td className="revenue-cell">${vehicle.revenue.toFixed(2)}</td>
                    <td>${(vehicle.revenue / vehicle.count).toFixed(2)}</td>
                    <td>
                      <div className="percentage-bar">
                        <div 
                          className="percentage-fill" 
                          style={{ 
                            width: `${(vehicle.revenue / revenueData.total_revenue) * 100}%` 
                          }}
                        ></div>
                        <span className="percentage-text">
                          {((vehicle.revenue / revenueData.total_revenue) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No vehicle revenue data available for the selected period.</p>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="revenue-section">
        <h2>📝 Recent Transactions</h2>
        {revenueData.recent_transactions.length > 0 ? (
          <div className="transactions-table">
            <table>
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Vehicle</th>
                  <th>Zone</th>
                  <th>Booking Amount</th>
                  <th>Overstay Fee</th>
                  <th>Total Amount</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {revenueData.recent_transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      <span className="booking-id">#{transaction.id}</span>
                    </td>
                    <td className="vehicle-cell">{transaction.vehicle}</td>
                    <td>{transaction.zone}</td>
                    <td className="amount-cell">${transaction.amount.toFixed(2)}</td>
                    <td className="overstay-cell">
                      {transaction.overstay > 0 ? (
                        <span className="overstay-badge">
                          +${transaction.overstay.toFixed(2)}
                        </span>
                      ) : (
                        <span className="no-overstay">-</span>
                      )}
                    </td>
                    <td className="total-cell">
                      <strong>${transaction.total.toFixed(2)}</strong>
                    </td>
                    <td className="date-cell">{transaction.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No transactions available for the selected period.</p>
          </div>
        )}
      </div>
    </div>
  );
}
