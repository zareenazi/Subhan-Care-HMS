import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Calendar, HeartPulse, FileText, ClipboardList } from 'lucide-react';
import Button from '../../components/Button';

const DoctorDashboard = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-brand">Subhan Care HMS</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span className="user-badge" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--secondary-color)' }}>Doctor Portal</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{user?.name || user?.email}</span>
          <Button onClick={signOut} variant="link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <LogOut size={16} /> Sign Out
          </Button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-title-bar">
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '4px' }}>Clinical Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Access your scheduled patient visits and issue prescriptions.</p>
        </div>

        <div className="dashboard-grid" style={{ marginBottom: '30px' }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-color)' }}>
              <Calendar size={24} />
            </div>
            <div className="stat-info">
              <h3>Appointments Today</h3>
              <p>8 Patients</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--secondary-color)' }}>
              <HeartPulse size={24} />
            </div>
            <div className="stat-info">
              <h3>Active Consultations</h3>
              <p>1 In-Progress</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#A855F7' }}>
              <FileText size={24} />
            </div>
            <div className="stat-info">
              <h3>Prescriptions Issued</h3>
              <p>24 This Week</p>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={20} className="auth-logo-icon" /> Doctor Role Access (R/L/F)
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '16px' }}>
            You have permissions to view medical histories and create prescriptions (F) for your assigned patients. You have no access to administrative staff management or invoicing systems.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button style={{ width: 'auto', padding: '0 20px' }}>View Appointment List</Button>
            <Button variant="secondary" style={{ width: 'auto', padding: '0 20px' }}>Access Medical History Database</Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DoctorDashboard;
