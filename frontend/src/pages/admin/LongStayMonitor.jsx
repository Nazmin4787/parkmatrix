import React, { useState, useEffect } from 'react';
import {
  getLongStayVehicles,
  triggerLongStayDetection,
  getSchedulerStatus,
  formatDuration,
  getAlertLevelColor,
  getAlertLevelIcon
} from '../../services/longStayDetection';
import './LongStayMonitor.css';

/**
 * LongStayMonitor Component
 * Displays long-stay vehicles and allows manual detection triggers
 */
export default function LongStayMonitor() {
  const [data, setData] = useState(null);
  const [schedulerStatus, setSchedulerStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch data on component mount and set up auto-refresh
  useEffect(() => {
    fetchLongStayVehicles();
    fetchSchedulerStatus();

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchLongStayVehicles(true); // Silent refresh
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Fetch long-stay vehicles
   */
  const fetchLongStayVehicles = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const result = await getLongStayVehicles();
      setData(result);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch long-stay vehicles');
      setLoading(false);
    }
  };

  /**
   * Fetch scheduler status
   */
  const fetchSchedulerStatus = async () => {
    try {
      const status = await getSchedulerStatus();
      setSchedulerStatus(status);
    } catch (err) {
      console.error('Failed to fetch scheduler status:', err);
    }
  };

  /**
   * Manually trigger detection
   */
  const handleManualDetection = async () => {
    setDetecting(true);
    setError(null);

    try {
      const result = await triggerLongStayDetection();
      setData(result.results);
      setLastUpdated(new Date());
      setDetecting(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to trigger detection');
      setDetecting(false);
    }
  };

  if (loading) {
    return (
      <div className="long-stay-monitor">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading long-stay vehicle data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="long-stay-monitor">
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button className="btn-primary" onClick={() => fetchLongStayVehicles()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="long-stay-monitor">
      {/* Header */}
      <div className="monitor-header">
        <div className="header-left">
          <h2>🚨 Long-Stay Vehicle Monitor</h2>
          {lastUpdated && (
            <p className="last-updated">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="header-right">
          <button
            className="btn-secondary"
            onClick={() => fetchLongStayVehicles()}
            disabled={loading}
          >
            🔄 Refresh
          </button>
          <button
            className="btn-primary"
            onClick={handleManualDetection}
            disabled={detecting}
          >
            {detecting ? '⏳ Detecting...' : '▶️ Run Detection'}
          </button>
        </div>
      </div>

      {/* Scheduler Status */}
      {schedulerStatus && (
        <div className={`scheduler-status ${schedulerStatus.running ? 'running' : 'stopped'}`}>
          <div className="status-indicator">
            <span className={`status-dot ${schedulerStatus.running ? 'active' : 'inactive'}`}></span>
            <span className="status-text">
              Scheduler: {schedulerStatus.running ? 'Running' : 'Stopped'}
            </span>
          </div>
          {schedulerStatus.jobs && schedulerStatus.jobs.length > 0 && (
            <div className="scheduled-jobs">
              <span className="jobs-label">Next detection:</span>
              {schedulerStatus.jobs[0].next_run_time && (
                <span className="next-run">
                  {new Date(schedulerStatus.jobs[0].next_run_time).toLocaleString()}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon">🅿️</div>
          <div className="card-content">
            <div className="card-value">{data?.total_parked || 0}</div>
            <div className="card-label">Total Parked</div>
          </div>
        </div>
        
        <div className="summary-card critical">
          <div className="card-icon">🚨</div>
          <div className="card-content">
            <div className="card-value">{data?.summary?.critical_count || 0}</div>
            <div className="card-label">Critical (&gt;24h)</div>
          </div>
        </div>
        
        <div className="summary-card warning">
          <div className="card-icon">⚡</div>
          <div className="card-content">
            <div className="card-value">{data?.summary?.warning_count || 0}</div>
            <div className="card-label">Warning (20-24h)</div>
          </div>
        </div>
        
        <div className="summary-card normal">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <div className="card-value">{data?.summary?.normal_count || 0}</div>
            <div className="card-label">Normal (&lt;20h)</div>
          </div>
        </div>
      </div>

      {/* Critical Long-Stay Vehicles */}
      {data?.long_stay_vehicles && data.long_stay_vehicles.length > 0 && (
        <div className="vehicles-section critical-section">
          <h3>🚨 Critical Long-Stay Vehicles (&gt;24 hours)</h3>
          <div className="vehicles-table">
            <table>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>User</th>
                  <th>Location</th>
                  <th>Duration</th>
                  <th>Overtime</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.long_stay_vehicles.map((vehicle, index) => (
                  <tr key={index} className="vehicle-row critical-row">
                    <td>
                      <div className="vehicle-info">
                        <strong>{vehicle.vehicle.plate}</strong>
                        <small>{vehicle.vehicle.type} - {vehicle.vehicle.model}</small>
                      </div>
                    </td>
                    <td>
                      <div className="user-info">
                        <strong>{vehicle.user.username}</strong>
                        <small>{vehicle.user.email}</small>
                      </div>
                    </td>
                    <td>
                      <div className="location-info">
                        <strong>{vehicle.slot.parking_lot}</strong>
                        <small>
                          Slot {vehicle.slot.number} | Floor {vehicle.slot.floor} | Section {vehicle.slot.section}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div className="duration-info">
                        <strong>{vehicle.timing.current_duration_formatted}</strong>
                        <small>({vehicle.timing.current_duration_hours.toFixed(1)}h)</small>
                      </div>
                    </td>
                    <td>
                      {vehicle.is_overtime ? (
                        <span className="overtime-badge">
                          ⏰ +{vehicle.overtime_hours.toFixed(1)}h
                        </span>
                      ) : (
                        <span className="on-time">On time</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${getAlertLevelColor(vehicle.alert_level)}`}>
                        {getAlertLevelIcon(vehicle.alert_level)} {vehicle.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Warning Vehicles */}
      {data?.warning_vehicles && data.warning_vehicles.length > 0 && (
        <div className="vehicles-section warning-section">
          <h3>⚡ Warning Vehicles (Approaching 24h Limit)</h3>
          <div className="vehicles-table">
            <table>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>User</th>
                  <th>Location</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.warning_vehicles.map((vehicle, index) => (
                  <tr key={index} className="vehicle-row warning-row">
                    <td>
                      <div className="vehicle-info">
                        <strong>{vehicle.vehicle.plate}</strong>
                        <small>{vehicle.vehicle.type}</small>
                      </div>
                    </td>
                    <td>
                      <strong>{vehicle.user.username}</strong>
                    </td>
                    <td>
                      <div className="location-info">
                        <strong>{vehicle.slot.parking_lot}</strong>
                        <small>Slot {vehicle.slot.number}</small>
                      </div>
                    </td>
                    <td>
                      <strong>{vehicle.timing.current_duration_formatted}</strong>
                    </td>
                    <td>
                      <span className={`status-badge ${getAlertLevelColor(vehicle.alert_level)}`}>
                        {getAlertLevelIcon(vehicle.alert_level)} {vehicle.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Vehicles Found */}
      {(!data?.long_stay_vehicles || data.long_stay_vehicles.length === 0) &&
       (!data?.warning_vehicles || data.warning_vehicles.length === 0) && (
        <div className="no-vehicles">
          <div className="no-vehicles-icon">✅</div>
          <h3>All Clear!</h3>
          <p>No long-stay vehicles detected at this time.</p>
          <p className="info-text">
            Vehicles are monitored automatically every hour. Critical alerts are sent when a vehicle
            exceeds 24 hours of parking.
          </p>
        </div>
      )}
    </div>
  );
}
