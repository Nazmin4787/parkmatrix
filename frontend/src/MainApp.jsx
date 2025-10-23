import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/home';
import SignIn from './pages/access/SignIn';
import SignUp from './pages/access/SignUp';
import UserDashboard from './pages/user/Dashboard';
import AdminDashboard from './pages/administration/Dashboard';
import AvailableSlots from './pages/user/AvailableSlots';
import BookingHistory from './pages/user/BookingHistory';
import EnhancedBookingHistory from './pages/user/EnhancedBookingHistory';
import BookingHistoryDebug from './pages/user/BookingHistoryDebug';
import SimpleBookingsList from './pages/user/SimpleBookingsList';
import UserDebug from './pages/user/UserDebug';
import BookingFlow from './pages/user/BookingFlow';
import CheckInCheckOut from './pages/user/CheckInCheckOut';
import NearestParking from './pages/user/NearestParking';
import Phase8TestPage from './pages/Phase8TestPage';
import ManageSlots from './pages/administration/ManageSlots';
import EditSlot from './pages/administration/EditSlot';
// REMOVED: View Bookings feature
// import AdminListBookings from './pages/administration/list_bookings';
import RateManagement from './pages/administration/RateManagement';
import RateForm from './pages/administration/RateForm';
import ZonePricingManagement from './pages/administration/ZonePricingManagement';
import AccessLogs from './pages/admin/AccessLogs';
import CheckInCheckOutLogs from './pages/administration/CheckInCheckOutLogs';
import AdminUserHistory from './pages/administration/AdminUserHistory';
import SlotStatusTracker from './pages/administration/SlotStatusTracker';
import LongStayMonitor from './pages/admin/LongStayMonitor';
import CheckIn from './pages/administration/CheckIn';
import CheckOut from './pages/administration/CheckOut';
import MyParking from './pages/customer/MyParking';
import { getCurrentUser } from './store/userstore';
import Navbar from './UIcomponents/Navbar';
import ParkingMap from './pages/ParkingMap';
import { NotificationProvider } from './context/NotificationContext';


function Guard({ children, roles }) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/signin" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

// Navbar moved to UIcomponents/Navbar

export default function MainApp() {
  return (
    <NotificationProvider>
      <div className="container">
        <Navbar />
        <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<Guard roles={['customer']}><UserDashboard /></Guard>} />
        <Route path="/slots" element={<Guard roles={['customer']}><AvailableSlots /></Guard>} />
        <Route path="/booking" element={<Guard roles={['customer']}><BookingFlow /></Guard>} />
        <Route path="/checkin-checkout" element={<Guard roles={['customer']}><CheckInCheckOut /></Guard>} />
        <Route path="/bookings" element={<Guard roles={['customer']}><EnhancedBookingHistory /></Guard>} />
        <Route path="/bookings-legacy" element={<Guard roles={['customer']}><BookingHistory /></Guard>} />
        <Route path="/simple-bookings" element={<Guard roles={['customer']}><SimpleBookingsList /></Guard>} />
        <Route path="/my-parking" element={<Guard roles={['customer']}><MyParking /></Guard>} />
        <Route path="/bookings-debug" element={<BookingHistoryDebug />} />
        <Route path="/phase8-test" element={<Phase8TestPage />} />
        <Route path="/user-debug" element={<UserDebug />} />
        <Route path="/admin" element={<Guard roles={['admin']}><AdminDashboard /></Guard>} />
        <Route path="/admin/dashboard" element={<Guard roles={['admin']}><AdminDashboard /></Guard>} />
        <Route path="/admin/slots" element={<Guard roles={['admin']}><ManageSlots /></Guard>} />
        <Route path="/admin/slots/:id/edit" element={<Guard roles={['admin']}><EditSlot /></Guard>} />
        <Route path="/admin/rates" element={<Guard roles={['admin']}><RateManagement /></Guard>} />
        <Route path="/admin/rates/new" element={<Guard roles={['admin']}><RateForm /></Guard>} />
        <Route path="/admin/rates/:id/edit" element={<Guard roles={['admin']}><RateForm /></Guard>} />
        <Route path="/admin/zone-pricing" element={<Guard roles={['admin']}><ZonePricingManagement /></Guard>} />
        {/* REMOVED: View Bookings feature */}
        {/* <Route path="/admin/bookings" element={<Guard roles={['admin']}><AdminListBookings /></Guard>} /> */}
        <Route path="/admin/access-logs" element={<Guard roles={['admin']}><AccessLogs /></Guard>} />
        <Route path="/admin/checkin-checkout-logs" element={<Guard roles={['admin']}><CheckInCheckOutLogs /></Guard>} />
        <Route path="/admin/user-history" element={<Guard roles={['admin']}><AdminUserHistory /></Guard>} />
        <Route path="/admin/slot-tracker" element={<Guard roles={['admin']}><SlotStatusTracker /></Guard>} />
        <Route path="/admin/long-stay" element={<Guard roles={['admin', 'security']}><LongStayMonitor /></Guard>} />
        
        {/* Check-In/Check-Out Forms */}
        <Route path="/admin/checkin" element={<Guard roles={['admin', 'security']}><CheckIn /></Guard>} />
        <Route path="/admin/checkout" element={<Guard roles={['admin', 'security']}><CheckOut /></Guard>} />

        <Route path="/nearest-parking" element={<NearestParking />} />
        <Route path="/parking-map" element={<ParkingMap />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
    </NotificationProvider>
  );
}
