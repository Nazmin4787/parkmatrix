import React from 'react';
import { Link } from 'react-router-dom';
import '../stylesheets/components.css';

// Simple test page to showcase Phase 8 integration
export default function Phase8TestPage() {
  return (
    <div className="container">
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <h1 style={{ color: '#1f2937', marginBottom: '20px' }}>
          🎉 Phase 8: Frontend Integration Complete!
        </h1>
        
        <div style={{ 
          background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', 
          padding: '20px', 
          borderRadius: '12px', 
          marginBottom: '30px',
          border: '1px solid #93c5fd'
        }}>
          <h2 style={{ color: '#1d4ed8', margin: '0 0 15px 0' }}>✅ Integration Features</h2>
          <ul style={{ color: '#1e40af', margin: 0, paddingLeft: '20px' }}>
            <li>Enhanced BookingCard with check-in/check-out buttons</li>
            <li>Real-time status updates and animations</li>
            <li>Improved booking history with status filtering</li>
            <li>Auto-refresh for active bookings</li>
            <li>Enhanced error handling and caching</li>
            <li>Mobile-responsive design</li>
            <li>Toast notifications for actions</li>
            <li>Overtime charge display</li>
          </ul>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px', 
          marginBottom: '30px' 
        }}>
          <Link 
            to="/bookings" 
            style={{ 
              display: 'block',
              background: 'linear-gradient(135deg, #10b981, #047857)',
              color: 'white',
              padding: '20px',
              borderRadius: '12px',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: '600' }}>
              🔥 Enhanced Bookings
            </h3>
            <p style={{ margin: 0, opacity: 0.9 }}>
              Try the new integrated booking system with check-in/check-out
            </p>
          </Link>

          <Link 
            to="/bookings-legacy" 
            style={{ 
              display: 'block',
              background: 'linear-gradient(135deg, #6b7280, #374151)',
              color: 'white',
              padding: '20px',
              borderRadius: '12px',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 25px rgba(107, 114, 128, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.3)';
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: '600' }}>
              📜 Legacy Bookings
            </h3>
            <p style={{ margin: 0, opacity: 0.9 }}>
              Compare with the old booking interface
            </p>
          </Link>

          <Link 
            to="/checkin-checkout" 
            style={{ 
              display: 'block',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white',
              padding: '20px',
              borderRadius: '12px',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 25px rgba(245, 158, 11, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: '600' }}>
              🚗 Check-In/Out
            </h3>
            <p style={{ margin: 0, opacity: 0.9 }}>
              Dedicated check-in/check-out interface
            </p>
          </Link>
        </div>

        <div style={{ 
          background: 'linear-gradient(135deg, #fef3c7, #fde68a)', 
          padding: '20px', 
          borderRadius: '12px', 
          marginBottom: '30px',
          border: '1px solid #f59e0b'
        }}>
          <h3 style={{ color: '#92400e', margin: '0 0 15px 0' }}>🧪 Test Scenarios</h3>
          <ol style={{ color: '#78350f', margin: 0, paddingLeft: '20px' }}>
            <li>Navigate to Enhanced Bookings to see your bookings with status</li>
            <li>Try checking in to a confirmed booking</li>
            <li>Watch real-time status updates and animations</li>
            <li>Test check-out with overtime calculation</li>
            <li>Use tab filters to view different booking states</li>
            <li>Compare with legacy interface functionality</li>
          </ol>
        </div>

        <div style={{ 
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', 
          padding: '20px', 
          borderRadius: '12px',
          border: '1px solid #22c55e'
        }}>
          <h3 style={{ color: '#15803d', margin: '0 0 15px 0' }}>📋 Implementation Status</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            <div style={{ color: '#166534' }}>
              <strong>✅ Completed Phases:</strong>
              <ul style={{ margin: '5px 0 0 20px', fontSize: '0.9rem' }}>
                <li>Phase 1-7: Backend & Components</li>
                <li>Phase 8: Frontend Integration</li>
              </ul>
            </div>
            <div style={{ color: '#166534' }}>
              <strong>🔄 Next Phases:</strong>
              <ul style={{ margin: '5px 0 0 20px', fontSize: '0.9rem' }}>
                <li>Phase 9: Testing</li>
                <li>Phase 10: Documentation</li>
              </ul>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <Link 
            to="/dashboard" 
            style={{ 
              display: 'inline-block',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
            }}
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}