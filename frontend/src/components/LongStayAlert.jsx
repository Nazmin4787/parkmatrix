import React from 'react';
import './LongStayAlert.css';

/**
 * LongStayAlert Component
 * Displays long-stay vehicle alert notifications
 * Used in notification dropdowns and notification center
 */
export function LongStayAlert({ notification, onMarkRead, onClose }) {
  const additionalData = notification.additional_data || {};
  const alertType = additionalData.alert_type;
  const isLongStaySummary = alertType === 'long_stay_summary';
  const isLongStayAlert = alertType === 'long_stay';

  // Parse message for better display
  const parseMessage = (message) => {
    if (!message) return { lines: [] };
    
    const lines = message.split('\n').filter(line => line.trim());
    return { lines };
  };

  const { lines } = parseMessage(notification.message);

  return (
    <div className={`long-stay-alert ${notification.is_read ? 'read' : 'unread'} ${additionalData.priority || ''}`}>
      <div className="alert-header">
        <div className="alert-icon">
          {isLongStaySummary ? '🚨' : isLongStayAlert ? '⚠️' : '🔔'}
        </div>
        <div className="alert-title-section">
          <h4 className="alert-title">{notification.title}</h4>
          <span className="alert-time">
            {new Date(notification.created_at).toLocaleString()}
          </span>
        </div>
        {onClose && (
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        )}
      </div>

      <div className="alert-body">
        {isLongStaySummary ? (
          // Summary format for admins
          <div className="summary-content">
            <div className="summary-stats">
              <div className="stat critical">
                <span className="stat-icon">🚨</span>
                <span className="stat-value">{additionalData.critical_count || 0}</span>
                <span className="stat-label">Critical</span>
              </div>
              <div className="stat warning">
                <span className="stat-icon">⚡</span>
                <span className="stat-value">{additionalData.warning_count || 0}</span>
                <span className="stat-label">Warnings</span>
              </div>
            </div>
            <div className="message-lines">
              {lines.map((line, idx) => (
                <p key={idx} className={line.includes('•') ? 'vehicle-line' : 'section-line'}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        ) : (
          // Individual alert format for vehicle owners
          <div className="individual-content">
            <p className="alert-message">{notification.message}</p>
            {additionalData.slot_number && (
              <div className="alert-details">
                <span className="detail-item">
                  <strong>Slot:</strong> {additionalData.slot_number}
                </span>
                {additionalData.duration_hours && (
                  <span className="detail-item">
                    <strong>Duration:</strong> {additionalData.duration_hours.toFixed(1)}h
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {!notification.is_read && onMarkRead && (
        <div className="alert-footer">
          <button className="mark-read-btn" onClick={() => onMarkRead(notification.id)}>
            Mark as Read
          </button>
        </div>
      )}

      {/* Priority indicator */}
      {additionalData.priority === 'high' && (
        <div className="priority-indicator high">
          <span>⚡ High Priority</span>
        </div>
      )}
    </div>
  );
}

/**
 * LongStayAlertBadge Component
 * Small badge showing count of long-stay alerts
 */
export function LongStayAlertBadge({ count }) {
  if (count === 0) return null;

  return (
    <div className="long-stay-badge">
      <span className="badge-icon">🚨</span>
      <span className="badge-count">{count}</span>
      <span className="badge-text">Long-Stay Alerts</span>
    </div>
  );
}

/**
 * LongStayQuickView Component
 * Compact view of long-stay alerts for dashboard widgets
 */
export function LongStayQuickView({ criticalCount, warningCount, onClick }) {
  const totalAlerts = criticalCount + warningCount;

  if (totalAlerts === 0) {
    return (
      <div className="long-stay-quick-view no-alerts">
        <div className="quick-icon">✅</div>
        <div className="quick-text">
          <strong>All Clear</strong>
          <span>No long-stay vehicles</span>
        </div>
      </div>
    );
  }

  return (
    <div className="long-stay-quick-view has-alerts" onClick={onClick}>
      <div className="quick-icon">🚨</div>
      <div className="quick-stats">
        {criticalCount > 0 && (
          <div className="quick-stat critical">
            <span className="stat-number">{criticalCount}</span>
            <span className="stat-label">Critical</span>
          </div>
        )}
        {warningCount > 0 && (
          <div className="quick-stat warning">
            <span className="stat-number">{warningCount}</span>
            <span className="stat-label">Warning</span>
          </div>
        )}
      </div>
      <div className="quick-action">
        <span>View Details →</span>
      </div>
    </div>
  );
}

export default LongStayAlert;
