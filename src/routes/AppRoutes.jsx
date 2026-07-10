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

// Real Module Pages
import Patients from '../pages/Patients';
import Doctors from '../pages/Doctors';
import Appointments from '../pages/Appointments';
import Billing from '../pages/Billing';
import MyProfile from '../pages/MyProfile';
import Settings from '../pages/Settings';
import SearchResults from '../pages/Search';
import Prescriptions from '../pages/Prescriptions';
import Inventory from '../pages/Inventory';
import Pharmacy from '../pages/Pharmacy';
import Reports from '../pages/Reports';
import Staff from '../pages/Staff';
import AddPatient from '../pages/AddPatient';
import Beds from '../pages/Beds';

// ===== Temporary Pages for Quick Actions =====
const TempPage = ({ title, icon, description }) => (
  <div style={{
    padding: '60px 40px',
    textAlign: 'center',
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <div style={{
      fontSize: '4rem',
      marginBottom: '20px'
    }}>{icon}</div>
    <h1 style={{
      fontSize: '2rem',
      fontWeight: 700,
      color: 'var(--text-primary)',
      marginBottom: '12px'
    }}>{title}</h1>
    <p style={{
      fontSize: '1.1rem',
      color: 'var(--text-secondary)',
      maxWidth: '500px'
    }}>{description}</p>
    <button
      onClick={() => window.history.back()}
      style={{
        marginTop: '24px',
        padding: '10px 32px',
        background: 'var(--primary-color)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '1rem',
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: 'var(--font-family)'
      }}
    >
      ← Go Back
    </button>
  </div>
);

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
    return <Navigate to="/role-redirect" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* ===== PUBLIC AUTH ROUTES ===== */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/role-redirect" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/role-redirect" />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-otp" element={<OtpVerification />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* ===== PROTECTED TRANSIT HUB ===== */}
      <Route
        path="/role-redirect"
        element={
          <ProtectedRoute>
            <RoleRedirect />
          </ProtectedRoute>
        }
      />

      {/* ===== ROLE-SPECIFIC DASHBOARDS ===== */}
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

      {/* ===== SHORTHAND DASHBOARD ROUTES ===== */}
      <Route
        path="/admin"
        element={
          <RoleRoute allowedRoles={['Admin']}>
            <AdminDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/doctor"
        element={
          <RoleRoute allowedRoles={['Doctor']}>
            <DoctorDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/receptionist"
        element={
          <RoleRoute allowedRoles={['Receptionist']}>
            <ReceptionistDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/pharmacist"
        element={
          <RoleRoute allowedRoles={['Pharmacist']}>
            <PharmacistDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <RoleRoute allowedRoles={['Billing Staff']}>
            <BillingDashboard />
          </RoleRoute>
        }
      />

      {/* ===== PROFILE & SETTINGS ROUTES ===== */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <MyProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-profile"
        element={
          <ProtectedRoute>
            <MyProfile />
          </ProtectedRoute>
        }
      />

      {/* ===== SIDEBAR NAVIGATION ROUTES ===== */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Navigate to="/admin/dashboard" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients"
        element={
          <ProtectedRoute>
            <Patients />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctors"
        element={
          <ProtectedRoute>
            <Doctors />
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <ProtectedRoute>
            <Appointments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/prescriptions"
        element={
          <ProtectedRoute>
            <Prescriptions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <ProtectedRoute>
            <Billing />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <Inventory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pharmacy"
        element={
          <ProtectedRoute>
            <Pharmacy />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />

      {/* ===== STAFF ROUTE - TEMPORARILY OPEN FOR ALL (TESTING) ===== */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute>
            <Staff />
          </ProtectedRoute>
        }
      />

      <Route
        path="/beds"
        element={
          <ProtectedRoute>
            <Beds />
          </ProtectedRoute>
        }
      />

      {/* ===== QUICK ACTIONS ROUTES ===== */}
      <Route
        path="/patients/add"
        element={
          <ProtectedRoute>
            <AddPatient />
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments/book"
        element={
          <ProtectedRoute>
            <TempPage
              title="Book Appointment"
              icon="📅"
              description="Book a new appointment for a patient. Select doctor, date, time, and reason for visit."
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/prescriptions/new"
        element={
          <ProtectedRoute>
            <TempPage
              title="New Prescription"
              icon="💊"
              description="Create a new prescription for a patient. Add medicines, dosage, and instructions."
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients/vitals"
        element={
          <ProtectedRoute>
            <TempPage
              title="Vital Signs"
              icon="❤️"
              description="Record patient vital signs including blood pressure, heart rate, temperature, and more."
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/activity"
        element={
          <ProtectedRoute>
            <TempPage
              title="Recent Activity"
              icon="📋"
              description="View all recent activities across the hospital including consultations, prescriptions, and lab results."
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/financial"
        element={
          <RoleRoute allowedRoles={['Admin', 'Billing Staff']}>
            <TempPage
              title="Financial Reports"
              icon="📊"
              description="Generate and view financial reports including revenue, expenses, and collections."
            />
          </RoleRoute>
        }
      />
      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <SearchResults />
          </ProtectedRoute>
        }
      />

      {/* ===== DASHBOARD STATS ROUTES ===== */}
      <Route
        path="/dashboard/active-patients"
        element={
          <ProtectedRoute>
            <TempPage
              title="Active Patients Details"
              icon="👥"
              description="Detailed view of all active patients in the system."
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/appointments"
        element={
          <ProtectedRoute>
            <TempPage
              title="Appointments Details"
              icon="📅"
              description="Detailed view of all appointments."
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/prescriptions"
        element={
          <ProtectedRoute>
            <TempPage
              title="Prescriptions Details"
              icon="💊"
              description="Detailed view of all prescriptions."
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/bed-occupancy"
        element={
          <ProtectedRoute>
            <TempPage
              title="Bed Occupancy Details"
              icon="🛏️"
              description="Detailed view of bed occupancy status."
            />
          </ProtectedRoute>
        }
      />

      {/* ===== LEGACY QUICK ACTION ROUTES (Redirect) ===== */}
      <Route
        path="/patients/register"
        element={
          <ProtectedRoute>
            <Navigate to="/patients/add" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments/schedule"
        element={
          <ProtectedRoute>
            <Navigate to="/appointments/book" replace />
          </ProtectedRoute>
        }
      />

      {/* ===== DEFAULT REDIRECT ===== */}
      <Route
        path="*"
        element={<Navigate to={user ? '/role-redirect' : '/login'} replace />}
      />
    </Routes>
  );
};

export default AppRoutes;