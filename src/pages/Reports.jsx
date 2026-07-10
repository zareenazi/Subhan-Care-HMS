import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { dbInvoices, dbPatients, dbAppointments } from '../services/db';
import { BarChart3, TrendingUp, Users, Calendar, Printer } from 'lucide-react';

const Reports = () => {
    const [invoices, setInvoices] = useState([]);
    const [patientsCount, setPatientsCount] = useState(0);
    const [appointmentsCount, setAppointmentsCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Financial stats
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [pendingRevenue, setPendingRevenue] = useState(0);

    const loadReportData = async () => {
        setLoading(true);
        try {
            const [invData, patData, apptData] = await Promise.all([
                dbInvoices.getInvoices(),
                dbPatients.getPatients({ limit: 1 }),
                dbAppointments.getAppointments()
            ]);

            setInvoices(invData);
            setPatientsCount(patData.total);
            setAppointmentsCount(apptData.length);

            // Sum revenues
            let paid = 0;
            let pending = 0;
            invData.forEach(inv => {
                const val = parseFloat(inv.amount) || 0;
                if (inv.status === 'Paid') {
                    paid += val;
                } else {
                    pending += val;
                }
            });
            setTotalRevenue(paid);
            setPendingRevenue(pending);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReportData();
    }, []);

    // SVG Bar Chart Calculation (Revenues by billing method)
    const methods = { Cash: 0, Card: 0, 'Bank Transfer': 0, Insurance: 0 };
    invoices.forEach(inv => {
        if (inv.status === 'Paid' && methods[inv.payment_method] !== undefined) {
            methods[inv.payment_method] += parseFloat(inv.amount) || 0;
        }
    });

    const maxVal = Math.max(...Object.values(methods), 1000);

    return (
        <DashboardLayout active="reports" title="Reports & Financial Statements">
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading reports analytics...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'slideUp 0.3s ease-out' }}>
                    
                    {/* Summary row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                        <div className="auth-card" style={{ padding: '20px', animation: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ padding: '8px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#16A34A', borderRadius: '8px' }}><TrendingUp size={20} /></div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Settled Revenue</div>
                                    <strong style={{ fontSize: '1.2rem' }}>Rs. {totalRevenue.toLocaleString()}</strong>
                                </div>
                            </div>
                        </div>
                        <div className="auth-card" style={{ padding: '20px', animation: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ padding: '8px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#D97706', borderRadius: '8px' }}><BarChart3 size={20} /></div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending Billing</div>
                                    <strong style={{ fontSize: '1.2rem' }}>Rs. {pendingRevenue.toLocaleString()}</strong>
                                </div>
                            </div>
                        </div>
                        <div className="auth-card" style={{ padding: '20px', animation: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ padding: '8px', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-color)', borderRadius: '8px' }}><Users size={20} /></div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Patients</div>
                                    <strong style={{ fontSize: '1.2rem' }}>{patientsCount}</strong>
                                </div>
                            </div>
                        </div>
                        <div className="auth-card" style={{ padding: '20px', animation: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ padding: '8px', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', borderRadius: '8px' }}><Calendar size={20} /></div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Appointments Booked</div>
                                    <strong style={{ fontSize: '1.2rem' }}>{appointmentsCount}</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart & Breakdowns */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                        
                        {/* Revenue by Method SVG Chart */}
                        <div className="auth-card" style={{ padding: '24px', animation: 'none' }}>
                            <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '20px' }}>Revenue Share by Payment Method</h3>
                            <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
                                {Object.entries(methods).map(([method, amount]) => {
                                    const heightPct = Math.max((amount / maxVal) * 100, 5); // min 5% height for visual
                                    return (
                                        <div key={method} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px' }}>{amount > 0 ? `Rs. ${Math.round(amount/1000)}k` : '0'}</span>
                                            <div
                                                style={{
                                                    width: '32px',
                                                    height: `${heightPct * 1.2}px`,
                                                    background: 'linear-gradient(to top, var(--primary-color), #60A5FA)',
                                                    borderRadius: '4px 4px 0 0',
                                                    transition: 'height 0.5s ease'
                                                }}
                                            />
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center', height: '24px', lineHeight: '1.2' }}>{method}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Recent Billing Log */}
                        <div className="auth-card" style={{ padding: '24px', animation: 'none' }}>
                            <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '16px' }}>Statement Summary Log</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '220px', overflowY: 'auto' }}>
                                {invoices.slice(0, 5).map(inv => (
                                    <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                                        <div>
                                            <strong style={{ fontSize: '0.85rem', display: 'block' }}>{inv.patient?.name}</strong>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Inv: {inv.invoice_number} | {new Date(inv.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <strong style={{ fontSize: '0.85rem', display: 'block', color: 'var(--primary-color)' }}>Rs. {inv.amount}</strong>
                                            <span className={`hms-badge ${inv.status === 'Paid' ? 'success' : 'danger'}`} style={{ fontSize: '0.65rem', padding: '1px 6px' }}>{inv.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default Reports;
