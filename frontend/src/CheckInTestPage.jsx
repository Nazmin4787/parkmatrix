import React from 'react';
import CheckInCheckOut from './pages/user/CheckInCheckOut';
import ActiveBooking from './pages/user/ActiveBooking';
import BookingStatus from './pages/user/BookingStatus';

// Test page to verify check-in/check-out components
const CheckInTestPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Check-in/Check-out Components Test
        </h1>
        
        <div className="space-y-8">
          {/* Main Check-in/Check-out Component */}
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              1. Full Check-in/Check-out Component
            </h2>
            <CheckInCheckOut />
          </div>
          
          {/* Active Booking Component */}
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              2. Active Booking Display
            </h2>
            <div className="max-w-md">
              <ActiveBooking />
            </div>
          </div>
          
          {/* Booking Status Component */}
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              3. Booking Status Dashboard Widget
            </h2>
            <div className="max-w-lg">
              <BookingStatus />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckInTestPage;