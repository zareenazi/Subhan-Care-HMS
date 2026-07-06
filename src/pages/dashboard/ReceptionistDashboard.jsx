import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, UserPlus, CalendarDays, CheckCircle } from 'lucide-react';
import Button from '../../components/Button';

const ReceptionistDashboard = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-brand">Subhan Care HMS</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span className="user-badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary-color)' }}>Receptionist</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{user?.name || user?.email}</span>
          <Button onClick={signOut} variant="link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <LogOut size={16} /> Sign Out
          </Button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-title-bar">
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '4px' }}>Front Desk Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Register new patients and schedule consultation bookings.</p>
        </div>

        <div className="dashboard-grid" style={{ marginBottom: '30px' }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-color)' }}>
              <UserPlus size={24} />
            </div>
            <div className="stat-info">
              <h3>New Registrations</h3>
              <p>12 Today</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--secondary-color)' }}>
              <CalendarDays size={24} />
            </div>
            <div className="stat-info">
              <h3>Pending Appointments</h3>
              <p>15 Scheduled</p>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={20} className="auth-logo-icon" /> Front Desk Role Access (F/R)
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '16px' }}>
            You have full authorization (F) to register patients, edit basic demographic files, and book doctor consultation slots. You cannot view diagnoses, clinical case history details, or generate payment invoices.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button style={{ width: 'auto', padding: '0 20px' }}>Register New Patient</Button>
            <Button variant="secondary" style={{ width: 'auto', padding: '0 20px' }}>Schedule Appointment</Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReceptionistDashboard;
