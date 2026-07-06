import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import {
    Users, Calendar, DollarSign, Package,
    LogOut, ShieldAlert, UserPlus, X, Eye, EyeOff
} from 'lucide-react';
import Button from '../../components/Button';

const AddStaffModal = ({ onClose, onSuccess }) => {
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Doctor' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPass, setShowPass] = useState(false);

    const ROLES = ['Admin', 'Doctor', 'Receptionist', 'Pharmacist', 'Billing Staff'];

    const handleChange = (e) =>
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        setLoading(true);
        try {
            const { error: signUpError } = await supabase.auth.signUp({
                email: form.email,
                password: form.password,
                options: { data: { name: form.name, role: form.role } },
            });
            if (signUpError) throw signUpError;
            onSuccess(`${form.name} added as ${form.role} successfully!`);
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to add staff member.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={modal.overlay}>
            <div style={modal.box}>
                <div style={modal.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserPlus size={20} color="var(--primary-color)" />
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Add Staff Member</h3>
                    </div>
                    <button onClick={onClose} style={modal.closeBtn}><X size={20} /></button>
                </div>

                {error && <div style={modal.errorBanner}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={modal.field}>
                        <label style={modal.label}>Full Name</label>
                        <input name="name" value={form.name} onChange={handleChange}
                            placeholder="e.g. Dr. Ahmed Khan" required style={modal.input} />
                    </div>

                    <div style={modal.field}>
                        <label style={modal.label}>Email Address</label>
                        <input name="email" type="email" value={form.email} onChange={handleChange}
                            placeholder="e.g. doctor@subhancare.com" required style={modal.input} />
                    </div>

                    <div style={modal.field}>
                        <label style={modal.label}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <input name="password" type={showPass ? 'text' : 'password'}
                                value={form.password} onChange={handleChange}
                                placeholder="Min. 6 characters" required
                                style={{ ...modal.input, paddingRight: '42px', width: '100%' }} />
                            <button type="button" onClick={() => setShowPass((p) => !p)} style={modal.eyeBtn}>
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div style={modal.field}>
                        <label style={modal.label}>Role</label>
                        <select name="role" value={form.role} onChange={handleChange} style={modal.input}>
                            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>

                    <Button type="submit" loading={loading} style={{ marginTop: '4px' }}>
                        {loading ? 'Adding...' : 'Add Staff Member'}
                    </Button>
                </form>
            </div>
        </div>
    );
};

const modal = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' },
    box: { background: 'var(--card-bg)', borderRadius: 'var(--border-radius)', padding: '28px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid var(--border-color)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' },
    errorBanner: { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--danger-color)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem', marginBottom: '12px' },
    field: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' },
    input: { height: 'var(--input-height)', border: '1.5px solid var(--border-color)', borderRadius: '8px', padding: '0 12px', fontSize: '0.875rem', fontFamily: 'var(--font-family)', outline: 'none', background: '#fff', color: 'var(--text-primary)', width: '100%', boxSizing: 'border-box' },
    eyeBtn: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: 0 },
};

const AdminDashboard = () => {
    const { user, signOut } = useAuth();
    const [showAddStaff, setShowAddStaff] = useState(false);
    const [successMsg, setSuccessMsg] = useState(null);

    const handleStaffSuccess = (msg) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(null), 4000);
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="dashboard-brand">Subhan Care HMS</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span className="user-badge">Administrator</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{user?.name || user?.email}</span>
                    <Button onClick={signOut} variant="link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <LogOut size={16} /> Sign Out
                    </Button>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="dashboard-title-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '4px' }}>Admin Dashboard</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Welcome back to the hospital command center.</p>
                    </div>
                    <Button onClick={() => setShowAddStaff(true)} style={{ width: 'auto', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <UserPlus size={16} /> Add Staff
                    </Button>
                </div>

                {successMsg && (
                    <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#16A34A', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '0.9rem', fontWeight: 500 }}>
                        ✓ {successMsg}
                    </div>
                )}

                <div className="dashboard-grid" style={{ marginBottom: '30px' }}>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: 'var(--primary-color)' }}>
                            <Users size={24} />
                        </div>
                        <div className="stat-info"><h3>Daily Patients Seen</h3><p>42</p></div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: 'var(--secondary-color)' }}>
                            <Calendar size={24} />
                        </div>
                        <div className="stat-info"><h3>Appointments Scheduled</h3><p>18</p></div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger-color)' }}>
                            <DollarSign size={24} />
                        </div>
                        <div className="stat-info"><h3>Daily Revenue Collected</h3><p>Rs. 85,400</p></div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: 'rgba(168,85,247,0.1)', color: '#A855F7' }}>
                            <Package size={24} />
                        </div>
                        <div className="stat-info"><h3>Low Stock Alerts</h3><p>5 Items</p></div>
                    </div>
                </div>

                <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', padding: '24px' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldAlert size={20} className="auth-logo-icon" /> Role Access and Administration Panel
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '16px' }}>
                        As an Administrator, you have full access to all modules including Patient Records, Doctor Profiles, Staff Scheduling, Financial reports, and Audit logs.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <Button onClick={() => setShowAddStaff(true)} style={{ width: 'auto', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <UserPlus size={16} /> Manage Users
                        </Button>
                        <Button variant="secondary" style={{ width: 'auto', padding: '0 20px' }}>
                            Generate Financial Report
                        </Button>
                    </div>
                </div>
            </main>

            {showAddStaff && (
                <AddStaffModal
                    onClose={() => setShowAddStaff(false)}
                    onSuccess={handleStaffSuccess}
                />
            )}
        </div>
    );
};

export default AdminDashboard;
