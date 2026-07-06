import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, ReceiptText, CreditCard, Banknote, ShieldCheck } from 'lucide-react';
import Button from '../../components/Button';

const BillingDashboard = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-brand">Subhan Care HMS</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span className="user-badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary-color)' }}>Billing Dept</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{user?.name || user?.email}</span>
          <Button onClick={signOut} variant="link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <LogOut size={16} /> Sign Out
          </Button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-title-bar">
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '4px' }}>Invoicing & Cash Ledger</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track payments, generate patient invoice bills, and manage receipts.</p>
        </div>

        <div className="dashboard-grid" style={{ marginBottom: '30px' }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-color)' }}>
              <ReceiptText size={24} />
            </div>
            <div className="stat-info">
              <h3>Unpaid Invoices</h3>
              <p>8 Patients</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--secondary-color)' }}>
              <CreditCard size={24} />
            </div>
            <div className="stat-info">
              <h3>Payments Collected</h3>
              <p>24 Invoices</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)' }}>
              <Banknote size={24} />
            </div>
            <div className="stat-info">
              <h3>Collected Amount</h3>
              <p>Rs. 32,500</p>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} className="auth-logo-icon" /> Billing Staff Role Access (F/R)
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '16px' }}>
            You have full access (F) to invoice compilation, print actions, and ledger management. You cannot access clinical history notes, doctor files, or change prescription dosages.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button style={{ width: 'auto', padding: '0 20px' }}>Generate New Invoice</Button>
            <Button variant="secondary" style={{ width: 'auto', padding: '0 20px' }}>Daily Collection Ledger</Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BillingDashboard;
