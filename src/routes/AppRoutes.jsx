import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import OtpVerification from '../pages/auth/OtpVerification';
import ResetPassword from '../pages/auth/ResetPassword';
import RoleRedirect from '../pages/auth/RoleRedirect';

// Dashboards
import AdminDashboard from '../pages/dashboard/AdminDashboard';
import DoctorDashboard from '../pages/dashboard/DoctorDashboard';
import ReceptionistDashboard from '../pages/dashboard/ReceptionistDashboard';
import PharmacistDashboard from '../pages/dashboard/PharmacistDashboard';
import BillingDashboard from '../pages/dashboard/BillingDashboard';

// Helper to protect routes that require authentication
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-container">
        <p style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Verifying credentials...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Helper to protect routes that require specific roles
const RoleRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-container">
        <p style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Resolving role access permissions...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    // If user's role is not allowed, send them to the redirection hub
    return <Navigate to="/role-redirect" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/role-redirect" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/role-redirect" />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-otp" element={<OtpVerification />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected Transit Hub */}
      <Route
        path="/role-redirect"
        element={
          <ProtectedRoute>
            <RoleRedirect />
          </ProtectedRoute>
        }
      />

      {/* Role-Specific Protected Dashboards */}
      <Route
        path="/admin/dashboard"
        element={
          <RoleRoute allowedRoles={['Admin']}>
            <AdminDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/doctor/dashboard"
        element={
          <RoleRoute allowedRoles={['Doctor']}>
            <DoctorDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/receptionist/dashboard"
        element={
          <RoleRoute allowedRoles={['Receptionist']}>
            <ReceptionistDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/pharmacist/dashboard"
        element={
          <RoleRoute allowedRoles={['Pharmacist']}>
            <PharmacistDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/billing/dashboard"
        element={
          <RoleRoute allowedRoles={['Billing Staff']}>
            <BillingDashboard />
          </RoleRoute>
        }
      />

      {/* Default redirect route */}
      <Route
        path="*"
        element={<Navigate to={user ? '/role-redirect' : '/login'} replace />}
      />
    </Routes>
  );
};

export default AppRoutes;
