import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/home';
import SignIn from './pages/access/SignIn';
import SignUp from './pages/access/SignUp';
import UserDashboard from './pages/user/Dashboard';
import AdminDashboard from './pages/administration/Dashboard';
import AvailableSlots from './pages/user/AvailableSlots';
import BookingHistory from './pages/user/BookingHistory';
import BookingHistoryDebug from './pages/user/BookingHistoryDebug';
import SimpleBookingsList from './pages/user/SimpleBookingsList';
import UserDebug from './pages/user/UserDebug';
import BookingFlow from './pages/user/BookingFlow';
import ManageSlots from './pages/administration/ManageSlots';
import EditSlot from './pages/administration/EditSlot';
import AdminListBookings from './pages/administration/list_bookings';
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
        <Route path="/bookings" element={<Guard roles={['customer']}><BookingHistory /></Guard>} />
        <Route path="/simple-bookings" element={<Guard roles={['customer']}><SimpleBookingsList /></Guard>} />
        <Route path="/bookings-debug" element={<BookingHistoryDebug />} />
        <Route path="/user-debug" element={<UserDebug />} />
        <Route path="/admin" element={<Guard roles={['admin']}><AdminDashboard /></Guard>} />
        <Route path="/admin/slots" element={<Guard roles={['admin']}><ManageSlots /></Guard>} />
        <Route path="/admin/slots/:id/edit" element={<Guard roles={['admin']}><EditSlot /></Guard>} />
        <Route path="/admin/bookings" element={<Guard roles={['admin']}><AdminListBookings /></Guard>} />

        <Route path="/parking-map" element={<ParkingMap />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
    </NotificationProvider>
  );
}
