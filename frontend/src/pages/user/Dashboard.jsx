import { Link } from 'react-router-dom';
import BookingStatus from './BookingStatus';
import ActiveBooking from './ActiveBooking';

export default function UserDashboard() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">User Dashboard</h2>
        <p className="text-gray-600">Manage your parking bookings and check-in/check-out</p>
        
        {/* Phase 8 Test Link */}
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-800">🎉 New Enhanced Booking System</h3>
              <p className="text-xs text-blue-600 mt-1">Try our integrated check-in/check-out features!</p>
            </div>
            <Link 
              to="/phase8-test" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Try Now
            </Link>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Booking Status - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <BookingStatus />
        </div>
        
        {/* Active Booking - Takes 1 column */}
        <div>
          <ActiveBooking />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link 
          to="/nearest-parking" 
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md border-0 p-6 hover:shadow-xl hover:scale-105 transition-all text-center"
        >
          <div className="mb-3">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="font-semibold mb-1">📍 Nearest Parking</h3>
          <p className="text-sm text-blue-100">Find parking near you</p>
        </Link>

        <Link 
          to="/slots" 
          className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow text-center"
        >
          <div className="text-blue-600 mb-3">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="font-medium text-gray-800 mb-1">Browse Slots</h3>
          <p className="text-sm text-gray-500">Find available parking</p>
        </Link>

        <Link 
          to="/checkin-checkout" 
          className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow text-center"
        >
          <div className="text-green-600 mb-3">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-medium text-gray-800 mb-1">Check In/Out</h3>
          <p className="text-sm text-gray-500">Manage active booking</p>
        </Link>

        <Link 
          to="/bookings" 
          className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow text-center"
        >
          <div className="text-purple-600 mb-3">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="font-medium text-gray-800 mb-1">My Bookings</h3>
          <p className="text-sm text-gray-500">View booking history</p>
        </Link>

        <Link 
          to="/vehicles" 
          className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow text-center"
        >
          <div className="text-orange-600 mb-3">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v0H8a2 2 0 002-2z" />
            </svg>
          </div>
          <h3 className="font-medium text-gray-800 mb-1">My Vehicles</h3>
          <p className="text-sm text-gray-500">Manage vehicles</p>
        </Link>
      </div>
    </div>
  );
}


