import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Clipboard, PackageCheck, AlertTriangle, ShieldCheck } from 'lucide-react';
import Button from '../../components/Button';

const PharmacistDashboard = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-brand">Subhan Care HMS</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span className="user-badge" style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)', color: '#EC4899' }}>Pharmacy Portal</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{user?.name || user?.email}</span>
          <Button onClick={signOut} variant="link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <LogOut size={16} /> Sign Out
          </Button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-title-bar">
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '4px' }}>Pharmacy & Stock Control</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Dispense prescription medicines and manage pharmaceutical inventory levels.</p>
        </div>

        <div className="dashboard-grid" style={{ marginBottom: '30px' }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-color)' }}>
              <Clipboard size={24} />
            </div>
            <div className="stat-info">
              <h3>Pending Prescriptions</h3>
              <p>5 Active</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--secondary-color)' }}>
              <PackageCheck size={24} />
            </div>
            <div className="stat-info">
              <h3>Total Stock Items</h3>
              <p>420 Types</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#D97706' }}>
              <AlertTriangle size={24} />
            </div>
            <div className="stat-info">
              <h3>Nearing Expiry</h3>
              <p>12 Items</p>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} className="auth-logo-icon" /> Pharmacist Role Access (R/L/F)
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '16px' }}>
            You have full authority (F) to manage drug inventories and process prescribed items. You are authorized to read prescriptions (R) but cannot alter any dosage limits or clinical instructions issued by doctors.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button style={{ width: 'auto', padding: '0 20px' }}>View Dispense Queue</Button>
            <Button variant="secondary" style={{ width: 'auto', padding: '0 20px' }}>Manage Drug Stock</Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PharmacistDashboard;
