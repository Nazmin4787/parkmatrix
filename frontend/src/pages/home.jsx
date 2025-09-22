import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSession from '../hooks/useSession';
import '../stylesheets/homepage.css';

const HomePage = () => {
  const user = useSession();
  const isAuthenticated = Boolean(user);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleQuickBook = () => {
    if (isAuthenticated) navigate('/slots'); else navigate('/signin');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Handle search functionality
      console.log('Searching for:', searchQuery);
    }
  };

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Smart Parking
              <span className="highlight"> Made Simple</span>
            </h1>
            <p className="hero-subtitle">
              Find, book, and manage parking spaces with ease. 
              Save time and never worry about parking again.
            </p>
            
            {/* Quick Search Bar */}
            <form id="parking-search-form" onSubmit={handleSearch} className="search-form">
              <div className="search-container">
                <input
                  id="parking-search-input"
                  name="searchQuery"
                  type="text"
                  placeholder="Search for parking locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <button type="submit" className="search-button">
                  🔍 Search
                </button>
              </div>
            </form>

            {/* Quick Action Buttons */}
            <div className="hero-actions">
              <button onClick={handleQuickBook} className="btn-primary">
                🚗 Book Now
              </button>
              <button onClick={() => navigate('/slots')} className="btn-secondary">
                📍 View Slots
              </button>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="parking-illustration">
              <div className="car-icon">🚗</div>
              <div className="parking-spots">
                <div className="spot available">P1</div>
                <div className="spot booked">P2</div>
                <div className="spot available">P3</div>
                <div className="spot available">P4</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Why Choose Our Parking System?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Instant Booking</h3>
              <p>Book your parking spot in seconds with our streamlined booking process.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure & Safe</h3>
              <p>24/7 security monitoring and secure payment processing for your peace of mind.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Mobile Friendly</h3>
              <p>Access your parking from anywhere with our responsive mobile app.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Best Prices</h3>
              <p>Competitive rates and flexible pricing options for all your parking needs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats Section */}
      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Parking Spots</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">10K+</div>
              <div className="stat-label">Happy Users</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">99%</div>
              <div className="stat-label">Uptime</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Get Started?</h2>
            <p>Join thousands of users who trust our parking system daily.</p>
            <div className="cta-buttons">
              {!isAuthenticated ? (
                <>
                  <button onClick={() => navigate('/signup')} className="btn-primary">
                    Get Started Free
                  </button>
                  <button onClick={() => navigate('/signin')} className="btn-outline">
                    Sign In
                  </button>
                </>
              ) : (
                <button onClick={() => navigate('/bookings')} className="btn-primary">
                  Go to Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
