import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ApplicationStatusPage from './pages/ApplicationStatusPage';
import HomePage from './pages/HomePage';
import TripAcceptedPage from './pages/TripAcceptedPage';
import ArrivedAtPickupPage from './pages/ArrivedAtPickupPage';
import OnTheWayPage from './pages/OnTheWayPage';
import DeliveredPage from './pages/DeliveredPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/application-status" element={<ApplicationStatusPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/trip-accepted" element={<TripAcceptedPage />} />
        <Route path="/arrived-at-pickup" element={<ArrivedAtPickupPage />} />
        <Route path="/on-the-way" element={<OnTheWayPage />} />
        <Route path="/delivered" element={<DeliveredPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/wallet" element={<Navigate to="/home" replace />} />
        <Route path="/dashboard" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
