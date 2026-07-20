import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { dbPharmacy } from '../services/db';
import { supabase } from '../services/supabaseClient';
import {
    BarChart3, TrendingUp, Users, Calendar, Printer, Download,
    Filter, Eye, FileText, DollarSign, CreditCard, Building,
    TrendingDown, AlertCircle, CheckCircle, Clock, RefreshCw,
    ChevronDown, PieChart, Activity, Wallet,
    Banknote, ShieldAlert, CalendarDays, Stethoscope, Pill,
    Package, X, Loader, FileSpreadsheet, FileJson,
    Receipt, UserPlus, Sparkles, Award, Target,
    Grid, List, LayoutGrid, FileBarChart,
    ArrowLeft, CircleDot, CircleCheck, ArrowUp, ArrowDown,
    HeartPulse, FileChartPie, Home, Briefcase, UserCircle, Calendar as CalendarIcon, UserCog, Pill as PillIcon,
    LineChart, ChartNoAxesColumnIncreasing, ChartColumnStacked
} from 'lucide-react';

// ==================== TAB COMPONENTS ====================

// 1. OVERVIEW TAB
const OverviewTab = ({ stats, filteredInvoices, formatCurrency, getStatusBadgeClass }) => {
    return (
        <div>
            {/* KPI CARDS */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                marginBottom: '20px'
            }}>
                {[
                    { icon: TrendingUp, label: 'Revenue', value: formatCurrency(stats.totalRevenue), change: `${stats.revenueChange >= 0 ? '+' : ''}${stats.revenueChange.toFixed(1)}%`, color: '#10B981', bg: '#DCFCE7' },
                    { icon: AlertCircle, label: 'Pending', value: formatCurrency(stats.pendingRevenue), change: `${stats.pendingInvoices} inv`, color: '#EF4444', bg: '#FEE2E2' },
                    { icon: Target, label: 'Collection', value: `${stats.collectionRate.toFixed(1)}%`, change: `Avg: ${formatCurrency(stats.averageInvoice)}`, color: '#3B82F6', bg: '#DBEAFE' },
                    { icon: Award, label: 'Invoices', value: filteredInvoices.length, change: `${filteredInvoices.filter(inv => inv.status === 'paid').length} Paid`, color: '#8B5CF6', bg: '#EDE9FE' },
                ].map((card, i) => (
                    <div key={i} style={{
                        background: 'var(--card-bg)',
                        borderRadius: '12px',
                        padding: '16px 18px',
                        border: '1px solid var(--border-color)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {card.label}
                                </div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                                    {card.value}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                    <span style={{ color: stats.revenueChange >= 0 ? '#10B981' : '#EF4444', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '2px' }}>
                                        {stats.revenueChange >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                        {card.change}
                                    </span>
                                </div>
                            </div>
                            <div style={{ padding: '8px', borderRadius: '10px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <card.icon size={20} style={{ color: card.color }} />
                            </div>
                        </div>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${card.color}, ${card.color}88)`, borderRadius: '0 0 12px 12px' }} />
                    </div>
                ))}
            </div>

            {/* SECONDARY METRICS */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '12px',
                marginBottom: '20px'
            }}>
                {[
                    { icon: Calendar, label: 'Today', value: formatCurrency(stats.todayRevenue), color: '#10B981' },
                    { icon: CalendarDays, label: 'Month', value: formatCurrency(stats.monthlyRevenue), color: '#3B82F6' },
                    { icon: Clock, label: 'Week', value: formatCurrency(stats.weeklyRevenue), color: '#8B5CF6' },
                    { icon: Users, label: 'Patients', value: stats.totalPatients, color: '#F59E0B' },
                    { icon: Stethoscope, label: 'Doctors', value: stats.totalDoctors, color: '#EC4899' },
                    { icon: Pill, label: 'Medicines', value: stats.totalMedicines, color: '#14B8A6' },
                ].map((metric, i) => (
                    <div key={i} style={{
                        background: 'var(--card-bg)',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <div style={{ padding: '6px', borderRadius: '8px', background: metric.color + '12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <metric.icon size={16} style={{ color: metric.color }} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                {metric.label}
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {metric.value}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* CHARTS */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '20px'
            }}>
                <MonthlyChart stats={stats} formatCurrency={formatCurrency} />
                <WeeklyChart stats={stats} formatCurrency={formatCurrency} />
            </div>

            {/* PAYMENT METHODS & STATUS */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '20px'
            }}>
                <PaymentMethods stats={stats} formatCurrency={formatCurrency} />
                <StatusBreakdown stats={stats} formatCurrency={formatCurrency} />
            </div>

            {/* TOP DOCTORS & SERVICES */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '20px'
            }}>
                <TopDoctors stats={stats} formatCurrency={formatCurrency} />
                <TopServices stats={stats} formatCurrency={formatCurrency} />
            </div>
        </div>
    );
};

// Monthly Chart Component
const MonthlyChart = ({ stats, formatCurrency }) => (
    <div style={{
        background: 'var(--card-bg)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid var(--border-color)'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BarChart3 size={16} style={{ color: 'var(--primary-color)' }} /> Monthly Revenue
            </h3>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Last 12 Months</span>
        </div>
        <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
            {stats.monthlyData && stats.monthlyData.length > 0 ? (
                stats.monthlyData.map((data, index) => {
                    const maxRevenue = Math.max(...stats.monthlyData.map(d => d.revenue), 1000);
                    const heightPct = Math.max((data.revenue / maxRevenue) * 100, 5);
                    return (
                        <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '4px' }}>
                            <div style={{ fontSize: '0.45rem', fontWeight: 600, color: data.revenue > 0 ? 'var(--text-primary)' : 'var(--text-muted)', opacity: data.revenue > 0 ? 1 : 0.4 }}>
                                {data.revenue > 0 ? formatCurrency(data.revenue).replace('Rs. ', '') : '0'}
                            </div>
                            <div style={{
                                width: '60%',
                                height: `${heightPct}px`,
                                background: data.revenue > 0 ? `linear-gradient(to top, var(--primary-color), #60A5FA)` : '#E5E7EB',
                                borderRadius: '4px 4px 0 0',
                                transition: 'all 0.6s ease',
                                minHeight: '3px'
                            }} />
                            <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)', marginTop: '2px' }}>{data.month}</span>
                        </div>
                    );
                })
            ) : (
                <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0', fontSize: '0.7rem' }}>No data</div>
            )}
        </div>
    </div>
);

// Weekly Chart Component
const WeeklyChart = ({ stats, formatCurrency }) => (
    <div style={{
        background: 'var(--card-bg)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid var(--border-color)'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={16} style={{ color: '#8B5CF6' }} /> Weekly Revenue
            </h3>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Last 7 Days</span>
        </div>
        <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
            {stats.weeklyData && stats.weeklyData.length > 0 ? (
                stats.weeklyData.map((data, index) => {
                    const maxRevenue = Math.max(...stats.weeklyData.map(d => d.revenue), 1000);
                    const heightPct = Math.max((data.revenue / maxRevenue) * 100, 5);
                    return (
                        <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '4px' }}>
                            <div style={{ fontSize: '0.45rem', fontWeight: 600, color: data.revenue > 0 ? 'var(--text-primary)' : 'var(--text-muted)', opacity: data.revenue > 0 ? 1 : 0.4 }}>
                                {data.revenue > 0 ? formatCurrency(data.revenue).replace('Rs. ', '') : '0'}
                            </div>
                            <div style={{
                                width: '60%',
                                height: `${heightPct}px`,
                                background: data.revenue > 0 ? `linear-gradient(to top, #8B5CF6, #C084FC)` : '#E5E7EB',
                                borderRadius: '4px 4px 0 0',
                                transition: 'all 0.6s ease',
                                minHeight: '3px'
                            }} />
                            <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)', marginTop: '2px' }}>{data.date}</span>
                        </div>
                    );
                })
            ) : (
                <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0', fontSize: '0.7rem' }}>No data</div>
            )}
        </div>
    </div>
);

// Payment Methods Component
const PaymentMethods = ({ stats, formatCurrency }) => (
    <div style={{
        background: 'var(--card-bg)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid var(--border-color)'
    }}>
        <h3 style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PieChart size={16} style={{ color: '#F59E0B' }} /> Payment Methods
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
            {Object.entries(stats.paymentMethods).map(([key, data]) => {
                const percentage = stats.totalRevenue > 0 ? (data.amount / stats.totalRevenue) * 100 : 0;
                const colors = { cash: '#10B981', card: '#3B82F6', bankTransfer: '#8B5CF6', insurance: '#F59E0B', online: '#EC4899' };
                const color = colors[key] || '#6B7280';
                return (
                    <div key={key} style={{ padding: '8px 12px', background: 'var(--bg-light)', borderRadius: '6px', borderLeft: `3px solid ${color}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.65rem' }}>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                            <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{data.count} transactions</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{formatCurrency(data.amount)}</span>
                            <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{percentage.toFixed(0)}%</span>
                        </div>
                        <div style={{ width: '100%', height: '3px', background: 'var(--bg-dark)', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${percentage}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.6s ease' }} />
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);

// Status Breakdown Component
const StatusBreakdown = ({ stats, formatCurrency }) => (
    <div style={{
        background: 'var(--card-bg)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid var(--border-color)'
    }}>
        <h3 style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={16} style={{ color: '#3B82F6' }} /> Status Breakdown
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {stats.statusBreakdown.map((item, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-light)', borderRadius: '6px', borderLeft: `3px solid ${item.color}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem' }}>{item.icon}</span>
                        <span style={{ fontWeight: 500, fontSize: '0.65rem' }}>{item.status}</span>
                        <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>({item.count})</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.7rem' }}>{item.amount > 0 ? formatCurrency(item.amount) : '—'}</div>
                </div>
            ))}
        </div>
    </div>
);

// Top Doctors Component
const TopDoctors = ({ stats, formatCurrency }) => (
    <div style={{
        background: 'var(--card-bg)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid var(--border-color)'
    }}>
        <h3 style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Stethoscope size={16} style={{ color: '#EC4899' }} /> Top Doctors
        </h3>
        {stats.topDoctors && stats.topDoctors.length > 0 ? (
            stats.topDoctors.slice(0, 5).map((doc, index) => (
                <div key={index} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 12px',
                    background: index === 0 ? 'var(--primary-light)' : 'var(--bg-light)',
                    borderRadius: '6px',
                    marginBottom: '4px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.6rem', color: index === 0 ? 'var(--primary-color)' : 'var(--text-muted)' }}>#{index + 1}</span>
                        <span style={{ fontWeight: 500, fontSize: '0.65rem' }}>{doc.name || 'Unknown Doctor'}</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.65rem' }}>{formatCurrency(doc.amount)}</div>
                </div>
            ))
        ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.7rem' }}>No doctor data available</div>
        )}
    </div>
);

// Top Services Component
const TopServices = ({ stats, formatCurrency }) => (
    <div style={{
        background: 'var(--card-bg)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid var(--border-color)'
    }}>
        <h3 style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HeartPulse size={16} style={{ color: '#14B8A6' }} /> Top Services
        </h3>
        {stats.topServices && stats.topServices.length > 0 ? (
            stats.topServices.slice(0, 5).map((service, index) => (
                <div key={index} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 12px',
                    background: index === 0 ? 'var(--primary-light)' : 'var(--bg-light)',
                    borderRadius: '6px',
                    marginBottom: '4px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.6rem', color: index === 0 ? 'var(--primary-color)' : 'var(--text-muted)' }}>#{index + 1}</span>
                        <span style={{ fontWeight: 500, fontSize: '0.65rem' }}>{service.name || 'Unknown'}</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.65rem' }}>{formatCurrency(service.amount)}</div>
                </div>
            ))
        ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.7rem' }}>No service data available</div>
        )}
    </div>
);

// ==================== FINANCIAL TAB ====================
const FinancialTab = ({ stats, filteredInvoices, formatCurrency, getStatusBadgeClass, handleExportTab }) => {
    return (
        <div>
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '16px', flexWrap: 'wrap', gap: '8px'
            }}>
                <h3 style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign size={18} style={{ color: '#10B981' }} /> Financial Overview
                </h3>
                <button onClick={() => handleExportTab('financial')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '6px 14px', borderRadius: '8px',
                        border: 'none', background: 'var(--primary-color)',
                        color: 'white', cursor: 'pointer', fontSize: '0.6rem',
                        fontWeight: 600
                    }}>
                    <Download size={14} /> Export
                </button>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                marginBottom: '20px'
            }}>
                {[
                    { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: '💰', color: '#10B981', bg: '#DCFCE7' },
                    { label: 'Pending Revenue', value: formatCurrency(stats.pendingRevenue), icon: '⏳', color: '#EF4444', bg: '#FEE2E2' },
                    { label: 'Collection Rate', value: `${stats.collectionRate.toFixed(1)}%`, icon: '📊', color: '#3B82F6', bg: '#DBEAFE' },
                    { label: 'Avg Invoice', value: formatCurrency(stats.averageInvoice), icon: '📋', color: '#8B5CF6', bg: '#EDE9FE' },
                ].map((item, i) => (
                    <div key={i} style={{
                        background: 'var(--card-bg)',
                        borderRadius: '12px',
                        padding: '16px',
                        border: '1px solid var(--border-color)',
                        borderLeft: `4px solid ${item.color}`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ padding: '8px', borderRadius: '10px', background: item.bg }}>
                                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{item.label}</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Financial Graphs */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '20px'
            }}>
                <MonthlyChart stats={stats} formatCurrency={formatCurrency} />
                <WeeklyChart stats={stats} formatCurrency={formatCurrency} />
            </div>

            {/* Payment Methods Detail */}
            <div style={{
                background: 'var(--card-bg)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid var(--border-color)',
                marginBottom: '16px'
            }}>
                <h3 style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CreditCard size={16} style={{ color: '#3B82F6' }} /> Payment Methods Detail
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                    {Object.entries(stats.paymentMethods).map(([key, data]) => {
                        const colors = { cash: '#10B981', card: '#3B82F6', bankTransfer: '#8B5CF6', insurance: '#F59E0B', online: '#EC4899' };
                        const color = colors[key] || '#6B7280';
                        return (
                            <div key={key} style={{ padding: '10px 12px', background: 'var(--bg-light)', borderRadius: '8px', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{key}</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: color, marginTop: '4px' }}>{formatCurrency(data.amount)}</div>
                                <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', marginTop: '2px' }}>{data.count} transactions</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Monthly Revenue Table */}
            <div style={{
                background: 'var(--card-bg)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid var(--border-color)'
            }}>
                <h3 style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BarChart3 size={16} style={{ color: '#F59E0B' }} /> Monthly Breakdown
                </h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.6rem', minWidth: '400px' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Month</th>
                                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>Revenue</th>
                                <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>Invoices</th>
                                <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>Paid</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.monthlyData && stats.monthlyData.length > 0 ? (
                                stats.monthlyData.map((data, index) => (
                                    <tr key={index} style={{ borderBottom: index < stats.monthlyData.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                        <td style={{ padding: '8px 12px', fontWeight: 500 }}>{data.month}</td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(data.revenue)}</td>
                                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>{data.count}</td>
                                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                            <span className={`hms-badge ${data.paid === data.count ? 'success' : 'warning'}`}>
                                                {data.paid}/{data.count}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No data</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ==================== PATIENTS TAB ====================
const PatientsTab = ({ stats, patients, formatCurrency, handleExportTab }) => {
    return (
        <div>
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '16px', flexWrap: 'wrap', gap: '8px'
            }}>
                <h3 style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={18} style={{ color: '#3B82F6' }} /> Patient Analytics
                </h3>
                <button onClick={() => handleExportTab('patients')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '6px 14px', borderRadius: '8px',
                        border: 'none', background: 'var(--primary-color)',
                        color: 'white', cursor: 'pointer', fontSize: '0.6rem',
                        fontWeight: 600
                    }}>
                    <Download size={14} /> Export
                </button>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                marginBottom: '20px'
            }}>
                {[
                    { label: 'Total Patients', value: stats.totalPatients, icon: '👤', color: '#3B82F6', bg: '#DBEAFE' },
                    { label: 'New Patients', value: stats.newPatients, icon: '✨', color: '#10B981', bg: '#DCFCE7' },
                    { label: 'Active Patients', value: stats.activePatients, icon: '🟢', color: '#F59E0B', bg: '#FEF3C7' },
                    { label: 'Gender', value: `👨 ${stats.malePatients} | 👩 ${stats.femalePatients}`, icon: '👥', color: '#8B5CF6', bg: '#EDE9FE' },
                ].map((item, i) => (
                    <div key={i} style={{
                        background: 'var(--card-bg)',
                        borderRadius: '12px',
                        padding: '16px',
                        border: '1px solid var(--border-color)',
                        borderLeft: `4px solid ${item.color}`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ padding: '8px', borderRadius: '10px', background: item.bg }}>
                                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{item.label}</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Patients Graph */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '20px'
            }}>
                <div style={{
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid var(--border-color)'
                }}>
                    <h3 style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={16} style={{ color: '#3B82F6' }} /> Patient Growth
                    </h3>
                    <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                        {stats.monthlyData && stats.monthlyData.length > 0 ? (
                            stats.monthlyData.slice(-6).map((data, index) => {
                                const maxCount = Math.max(...stats.monthlyData.slice(-6).map(d => d.count), 1);
                                const heightPct = Math.max((data.count / maxCount) * 100, 5);
                                return (
                                    <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '4px' }}>
                                        <div style={{ fontSize: '0.45rem', fontWeight: 600, color: data.count > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                            {data.count}
                                        </div>
                                        <div style={{
                                            width: '60%',
                                            height: `${heightPct}px`,
                                            background: data.count > 0 ? `linear-gradient(to top, #3B82F6, #60A5FA)` : '#E5E7EB',
                                            borderRadius: '4px 4px 0 0',
                                            transition: 'all 0.6s ease',
                                            minHeight: '3px'
                                        }} />
                                        <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)', marginTop: '2px' }}>{data.month}</span>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0', fontSize: '0.7rem' }}>No data</div>
                        )}
                    </div>
                </div>

                <div style={{
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid var(--border-color)'
                }}>
                    <h3 style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <PieChart size={16} style={{ color: '#8B5CF6' }} /> Gender Distribution
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px', gap: '40px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem' }}>👨</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#3B82F6' }}>{stats.malePatients}</div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Male</div>
                            <div style={{ width: '60px', height: '6px', background: '#3B82F6', borderRadius: '4px', margin: '4px auto' }} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem' }}>👩</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#EC4899' }}>{stats.femalePatients}</div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Female</div>
                            <div style={{ width: '60px', height: '6px', background: '#EC4899', borderRadius: '4px', margin: '4px auto' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Patients */}
            <div style={{
                background: 'var(--card-bg)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid var(--border-color)'
            }}>
                <h3 style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UserPlus size={16} style={{ color: '#3B82F6' }} /> Recent Patients
                </h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.6rem', minWidth: '350px' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Name</th>
                                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Phone</th>
                                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recentPatients && stats.recentPatients.length > 0 ? (
                                stats.recentPatients.map((patient, index) => (
                                    <tr key={index} style={{ borderBottom: index < stats.recentPatients.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                        <td style={{ padding: '8px 12px', fontWeight: 500 }}>{patient.name}</td>
                                        <td style={{ padding: '8px 12px' }}>{patient.phone || 'N/A'}</td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>{new Date(patient.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No recent patients</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ==================== APPOINTMENTS TAB ====================
const AppointmentsTab = ({ stats, formatCurrency, handleExportTab }) => {
    return (
        <div>
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '16px', flexWrap: 'wrap', gap: '8px'
            }}>
                <h3 style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={18} style={{ color: '#F59E0B' }} /> Appointment Analytics
                </h3>
                <button onClick={() => handleExportTab('appointments')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '6px 14px', borderRadius: '8px',
                        border: 'none', background: 'var(--primary-color)',
                        color: 'white', cursor: 'pointer', fontSize: '0.6rem',
                        fontWeight: 600
                    }}>
                    <Download size={14} /> Export
                </button>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                marginBottom: '20px'
            }}>
                {[
                    { label: 'Total Appointments', value: stats.totalAppointments, icon: '📋', color: '#3B82F6', bg: '#DBEAFE' },
                    { label: 'Completed', value: stats.completedAppointments, icon: '✅', color: '#10B981', bg: '#DCFCE7' },
                    { label: 'Upcoming', value: stats.upcomingAppointments, icon: '📅', color: '#F59E0B', bg: '#FEF3C7' },
                    { label: 'Cancelled', value: stats.cancelledAppointments, icon: '❌', color: '#EF4444', bg: '#FEE2E2' },
                ].map((item, i) => (
                    <div key={i} style={{
                        background: 'var(--card-bg)',
                        borderRadius: '12px',
                        padding: '16px',
                        border: '1px solid var(--border-color)',
                        borderLeft: `4px solid ${item.color}`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ padding: '8px', borderRadius: '10px', background: item.bg }}>
                                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{item.label}</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Appointments Graph */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '20px'
            }}>
                <div style={{
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid var(--border-color)'
                }}>
                    <h3 style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <BarChart3 size={16} style={{ color: '#F59E0B' }} /> Weekly Appointments
                    </h3>
                    <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                        {stats.weeklyData && stats.weeklyData.length > 0 ? (
                            stats.weeklyData.map((data, index) => {
                                const maxCount = Math.max(...stats.weeklyData.map(d => d.count), 1);
                                const heightPct = Math.max((data.count / maxCount) * 100, 5);
                                return (
                                    <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '4px' }}>
                                        <div style={{ fontSize: '0.45rem', fontWeight: 600, color: data.count > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                            {data.count}
                                        </div>
                                        <div style={{
                                            width: '60%',
                                            height: `${heightPct}px`,
                                            background: data.count > 0 ? `linear-gradient(to top, #F59E0B, #FBBF24)` : '#E5E7EB',
                                            borderRadius: '4px 4px 0 0',
                                            transition: 'all 0.6s ease',
                                            minHeight: '3px'
                                        }} />
                                        <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)', marginTop: '2px' }}>{data.date}</span>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0', fontSize: '0.7rem' }}>No data</div>
                        )}
                    </div>
                </div>

                <div style={{
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid var(--border-color)'
                }}>
                    <h3 style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <PieChart size={16} style={{ color: '#8B5CF6' }} /> Appointment Status
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                                <span>Completed</span>
                                <span style={{ fontWeight: 600 }}>{stats.completedAppointments}</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'var(--bg-dark)', borderRadius: '4px', overflow: 'hidden', marginTop: '2px' }}>
                                <div style={{ width: `${stats.totalAppointments > 0 ? (stats.completedAppointments / stats.totalAppointments) * 100 : 0}%`, height: '100%', background: '#10B981', borderRadius: '4px' }} />
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                                <span>Upcoming</span>
                                <span style={{ fontWeight: 600 }}>{stats.upcomingAppointments}</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'var(--bg-dark)', borderRadius: '4px', overflow: 'hidden', marginTop: '2px' }}>
                                <div style={{ width: `${stats.totalAppointments > 0 ? (stats.upcomingAppointments / stats.totalAppointments) * 100 : 0}%`, height: '100%', background: '#F59E0B', borderRadius: '4px' }} />
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                                <span>Cancelled</span>
                                <span style={{ fontWeight: 600 }}>{stats.cancelledAppointments}</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'var(--bg-dark)', borderRadius: '4px', overflow: 'hidden', marginTop: '2px' }}>
                                <div style={{ width: `${stats.totalAppointments > 0 ? (stats.cancelledAppointments / stats.totalAppointments) * 100 : 0}%`, height: '100%', background: '#EF4444', borderRadius: '4px' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{
                background: 'var(--card-bg)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid var(--border-color)',
                marginBottom: '16px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Completion Rate</span>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                        {stats.totalAppointments > 0 ? ((stats.completedAppointments / stats.totalAppointments) * 100).toFixed(1) : 0}%
                    </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-dark)', borderRadius: '4px', marginTop: '6px', overflow: 'hidden' }}>
                    <div style={{
                        width: `${stats.totalAppointments > 0 ? (stats.completedAppointments / stats.totalAppointments) * 100 : 0}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #3B82F6, #10B981)',
                        borderRadius: '4px',
                        transition: 'width 0.6s ease'
                    }} />
                </div>
            </div>

            {/* Upcoming Appointments */}
            <div style={{
                background: 'var(--card-bg)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid var(--border-color)'
            }}>
                <h3 style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CalendarIcon size={16} style={{ color: '#F59E0B' }} /> Upcoming Appointments
                </h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.6rem', minWidth: '350px' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Patient</th>
                                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Doctor</th>
                                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.upcomingAppointmentsList && stats.upcomingAppointmentsList.length > 0 ? (
                                stats.upcomingAppointmentsList.map((appt, index) => (
                                    <tr key={index} style={{ borderBottom: index < stats.upcomingAppointmentsList.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                        <td style={{ padding: '8px 12px', fontWeight: 500 }}>{appt.patient_name}</td>
                                        <td style={{ padding: '8px 12px' }}>{appt.doctor_name}</td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>{appt.date} {appt.time}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No upcoming appointments</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ==================== DOCTORS TAB ====================
const DoctorsTab = ({ stats, formatCurrency, handleExportTab }) => {
    return (
        <div>
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '16px', flexWrap: 'wrap', gap: '8px'
            }}>
                <h3 style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Stethoscope size={18} style={{ color: '#EC4899' }} /> Doctor Analytics
                </h3>
                <button onClick={() => handleExportTab('doctors')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '6px 14px', borderRadius: '8px',
                        border: 'none', background: 'var(--primary-color)',
                        color: 'white', cursor: 'pointer', fontSize: '0.6rem',
                        fontWeight: 600
                    }}>
                    <Download size={14} /> Export
                </button>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
                marginBottom: '20px'
            }}>
                {[
                    { label: 'Total Doctors', value: stats.totalDoctors, icon: '🩺', color: '#EC4899', bg: '#FCE7F3' },
                    { label: 'Top Revenue', value: stats.revenueByDoctor && stats.revenueByDoctor.length > 0 ? formatCurrency(stats.revenueByDoctor[0]?.amount || 0) : 'Rs. 0', icon: '🏆', color: '#F59E0B', bg: '#FEF3C7' },
                ].map((item, i) => (
                    <div key={i} style={{
                        background: 'var(--card-bg)',
                        borderRadius: '12px',
                        padding: '16px',
                        border: '1px solid var(--border-color)',
                        borderLeft: `4px solid ${item.color}`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ padding: '8px', borderRadius: '10px', background: item.bg }}>
                                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{item.label}</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Doctors Graph */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '20px'
            }}>
                <div style={{
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid var(--border-color)'
                }}>
                    <h3 style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <BarChart3 size={16} style={{ color: '#EC4899' }} /> Doctor Revenue
                    </h3>
                    <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                        {stats.revenueByDoctor && stats.revenueByDoctor.length > 0 ? (
                            stats.revenueByDoctor.slice(0, 6).map((doc, index) => {
                                const maxRevenue = Math.max(...stats.revenueByDoctor.map(d => d.amount), 1000);
                                const heightPct = Math.max((doc.amount / maxRevenue) * 100, 5);
                                return (
                                    <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '4px' }}>
                                        <div style={{ fontSize: '0.4rem', fontWeight: 600, color: doc.amount > 0 ? 'var(--text-primary)' : 'var(--text-muted)', textAlign: 'center' }}>
                                            {doc.amount > 0 ? formatCurrency(doc.amount).replace('Rs. ', '') : '0'}
                                        </div>
                                        <div style={{
                                            width: '50%',
                                            height: `${heightPct}px`,
                                            background: doc.amount > 0 ? `linear-gradient(to top, #EC4899, #F472B6)` : '#E5E7EB',
                                            borderRadius: '4px 4px 0 0',
                                            transition: 'all 0.6s ease',
                                            minHeight: '3px'
                                        }} />
                                        <span style={{ fontSize: '0.4rem', color: 'var(--text-muted)', marginTop: '2px', textAlign: 'center', maxWidth: '50px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name || 'Unknown'}</span>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0', fontSize: '0.7rem' }}>No doctor data available</div>
                        )}
                    </div>
                </div>

                <div style={{
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid var(--border-color)'
                }}>
                    <h3 style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <PieChart size={16} style={{ color: '#F59E0B' }} /> Doctor Performance
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px' }}>
                        {stats.revenueByDoctor && stats.revenueByDoctor.slice(0, 4).map((doc, index) => {
                            const total = stats.revenueByDoctor.reduce((sum, d) => sum + d.amount, 0) || 1;
                            const percentage = (doc.amount / total) * 100;
                            return (
                                <div key={index}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                                        <span>{doc.name || 'Unknown'}</span>
                                        <span style={{ fontWeight: 600 }}>{formatCurrency(doc.amount)}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: 'var(--bg-dark)', borderRadius: '4px', overflow: 'hidden', marginTop: '2px' }}>
                                        <div style={{
                                            width: `${percentage}%`,
                                            height: '100%',
                                            background: `hsl(${index * 45 + 200}, 70%, 50%)`,
                                            borderRadius: '4px'
                                        }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Doctor Rankings */}
            <div style={{
                background: 'var(--card-bg)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid var(--border-color)'
            }}>
                <h3 style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UserCog size={16} style={{ color: '#EC4899' }} /> Doctor Revenue Rankings
                </h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.6rem', minWidth: '350px' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>#</th>
                                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Doctor</th>
                                <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>Invoices</th>
                                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.revenueByDoctor && stats.revenueByDoctor.length > 0 ? (
                                stats.revenueByDoctor.map((doc, index) => (
                                    <tr key={index} style={{
                                        borderBottom: index < stats.revenueByDoctor.length - 1 ? '1px solid var(--border-color)' : 'none',
                                        background: index === 0 ? 'var(--primary-light)' : 'transparent'
                                    }}>
                                        <td style={{ padding: '8px 12px', fontWeight: 700, color: index === 0 ? 'var(--primary-color)' : 'var(--text-muted)' }}>
                                            {index === 0 ? '🏆' : `#${index + 1}`}
                                        </td>
                                        <td style={{ padding: '8px 12px', fontWeight: 500 }}>{doc.name || 'Unknown Doctor'}</td>
                                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>{doc.count || 0}</td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(doc.amount || 0)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No doctor data available</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ==================== PHARMACY TAB ====================
const PharmacyTab = ({ stats, medicines, formatCurrency, handleExportTab }) => {
    return (
        <div>
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '16px', flexWrap: 'wrap', gap: '8px'
            }}>
                <h3 style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Pill size={18} style={{ color: '#14B8A6' }} /> Pharmacy Analytics
                </h3>
                <button onClick={() => handleExportTab('pharmacy')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '6px 14px', borderRadius: '8px',
                        border: 'none', background: 'var(--primary-color)',
                        color: 'white', cursor: 'pointer', fontSize: '0.6rem',
                        fontWeight: 600
                    }}>
                    <Download size={14} /> Export
                </button>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                marginBottom: '20px'
            }}>
                {[
                    { label: 'Total Medicines', value: stats.totalMedicines, icon: '💊', color: '#14B8A6', bg: '#DCFCE7' },
                    { label: 'Low Stock', value: stats.lowStockMedicines, icon: '⚠️', color: '#F59E0B', bg: '#FEF3C7' },
                    { label: 'Out of Stock', value: stats.outOfStockMedicines, icon: '🚫', color: '#EF4444', bg: '#FEE2E2' },
                    { label: 'Inventory Value', value: formatCurrency(stats.totalInventoryValue), icon: '💰', color: '#8B5CF6', bg: '#EDE9FE' },
                ].map((item, i) => (
                    <div key={i} style={{
                        background: 'var(--card-bg)',
                        borderRadius: '12px',
                        padding: '16px',
                        border: '1px solid var(--border-color)',
                        borderLeft: `4px solid ${item.color}`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ padding: '8px', borderRadius: '10px', background: item.bg }}>
                                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{item.label}</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pharmacy Graphs */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '20px'
            }}>
                <div style={{
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid var(--border-color)'
                }}>
                    <h3 style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Package size={16} style={{ color: '#14B8A6' }} /> Stock Status
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                                <span>✅ In Stock</span>
                                <span style={{ fontWeight: 600 }}>{stats.totalMedicines - stats.outOfStockMedicines}</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'var(--bg-dark)', borderRadius: '4px', overflow: 'hidden', marginTop: '2px' }}>
                                <div style={{
                                    width: `${stats.totalMedicines > 0 ? ((stats.totalMedicines - stats.outOfStockMedicines) / stats.totalMedicines) * 100 : 0}%`,
                                    height: '100%',
                                    background: '#10B981',
                                    borderRadius: '4px'
                                }} />
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                                <span>⚠️ Low Stock (&lt;20)</span>
                                <span style={{ fontWeight: 600 }}>{stats.lowStockMedicines}</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'var(--bg-dark)', borderRadius: '4px', overflow: 'hidden', marginTop: '2px' }}>
                                <div style={{
                                    width: `${stats.totalMedicines > 0 ? (stats.lowStockMedicines / stats.totalMedicines) * 100 : 0}%`,
                                    height: '100%',
                                    background: '#F59E0B',
                                    borderRadius: '4px'
                                }} />
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                                <span>🚫 Out of Stock</span>
                                <span style={{ fontWeight: 600 }}>{stats.outOfStockMedicines}</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'var(--bg-dark)', borderRadius: '4px', overflow: 'hidden', marginTop: '2px' }}>
                                <div style={{
                                    width: `${stats.totalMedicines > 0 ? (stats.outOfStockMedicines / stats.totalMedicines) * 100 : 0}%`,
                                    height: '100%',
                                    background: '#EF4444',
                                    borderRadius: '4px'
                                }} />
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid var(--border-color)'
                }}>
                    <h3 style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <BarChart3 size={16} style={{ color: '#8B5CF6' }} /> Top Medicines by Value
                    </h3>
                    <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                        {medicines && medicines.length > 0 ? (
                            medicines
                                .slice(0, 6)
                                .sort((a, b) => (parseFloat(b.selling_price || b.price || 0) * parseInt(b.stock || 0)) - (parseFloat(a.selling_price || a.price || 0) * parseInt(a.stock || 0)))
                                .map((med, index) => {
                                    const value = (parseFloat(med.selling_price || med.price || 0) * parseInt(med.stock || 0));
                                    const maxValue = Math.max(...medicines.slice(0, 6).map(m => (parseFloat(m.selling_price || m.price || 0) * parseInt(m.stock || 0))), 1000);
                                    const heightPct = Math.max((value / maxValue) * 100, 5);
                                    return (
                                        <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '4px' }}>
                                            <div style={{ fontSize: '0.4rem', fontWeight: 600, color: value > 0 ? 'var(--text-primary)' : 'var(--text-muted)', textAlign: 'center' }}>
                                                {value > 0 ? formatCurrency(value).replace('Rs. ', '') : '0'}
                                            </div>
                                            <div style={{
                                                width: '50%',
                                                height: `${heightPct}px`,
                                                background: value > 0 ? `linear-gradient(to top, #8B5CF6, #C084FC)` : '#E5E7EB',
                                                borderRadius: '4px 4px 0 0',
                                                transition: 'all 0.6s ease',
                                                minHeight: '3px'
                                            }} />
                                            <span style={{ fontSize: '0.4rem', color: 'var(--text-muted)', marginTop: '2px', textAlign: 'center', maxWidth: '50px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {med.medicine_name || med.name || 'Unknown'}
                                            </span>
                                        </div>
                                    );
                                })
                        ) : (
                            <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0', fontSize: '0.7rem' }}>No medicines found</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Medicine List - FIXED: Using medicine_name instead of name */}
            <div style={{
                background: 'var(--card-bg)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid var(--border-color)'
            }}>
                <h3 style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Package size={16} style={{ color: '#14B8A6' }} /> Medicine Inventory
                </h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.6rem', minWidth: '450px' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Medicine Name</th>
                                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>Price</th>
                                <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>Stock</th>
                                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {medicines && medicines.length > 0 ? (
                                medicines.slice(0, 15).map((med, index) => {
                                    const stock = parseInt(med.stock) || 0;
                                    const price = parseFloat(med.selling_price || med.price || 0);
                                    const status = stock === 0 ? 'danger' : stock <= 20 ? 'warning' : 'success';
                                    return (
                                        <tr key={index} style={{ borderBottom: index < Math.min(medicines.length, 15) - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                            <td style={{ padding: '8px 12px', fontWeight: 500 }}>{med.medicine_name || med.name || 'Unknown Medicine'}</td>
                                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatCurrency(price)}</td>
                                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                                <span className={`hms-badge ${status}`}>{stock}</span>
                                            </td>
                                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(stock * price)}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No medicines found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ==================== MAIN COMPONENT ====================
const Reports = () => {
    // ==================== STATE MANAGEMENT ====================
    const [invoices, setInvoices] = useState([]);
    const [patients, setPatients] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [reportType, setReportType] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const [generatingReport, setGeneratingReport] = useState(false);

    // ===== FILTER POPUP STATE =====
    const [showFilterPopup, setShowFilterPopup] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
    const [filterDepartment, setFilterDepartment] = useState('all');
    const [filterMinAmount, setFilterMinAmount] = useState('');
    const [filterMaxAmount, setFilterMaxAmount] = useState('');

    // ===== FILTERED DATA =====
    const [filteredInvoices, setFilteredInvoices] = useState([]);

    // ==================== STATISTICS ====================
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalInvoices: 0,
        paidInvoices: 0,
        unpaidInvoices: 0,
        pendingInvoices: 0,
        pendingRevenue: 0,
        averageInvoice: 0,
        monthlyRevenue: 0,
        weeklyRevenue: 0,
        revenueChange: 0,
        collectionRate: 0,
        todayRevenue: 0,
        totalPatients: 0,
        newPatients: 0,
        activePatients: 0,
        malePatients: 0,
        femalePatients: 0,
        totalAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
        upcomingAppointments: 0,
        totalDoctors: 0,
        totalMedicines: 0,
        lowStockMedicines: 0,
        outOfStockMedicines: 0,
        totalInventoryValue: 0,
        paymentMethods: { cash: { count: 0, amount: 0 }, card: { count: 0, amount: 0 }, bankTransfer: { count: 0, amount: 0 }, insurance: { count: 0, amount: 0 }, online: { count: 0, amount: 0 } },
        monthlyData: [],
        weeklyData: [],
        topDoctors: [],
        topServices: [],
        topPatients: [],
        topMedicines: [],
        recentTransactions: [],
        recentPatients: [],
        upcomingAppointmentsList: [],
        revenueByDoctor: [],
        revenueByDepartment: [],
        statusBreakdown: []
    });

    // ==================== TOAST ====================
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    // ==================== BACK BUTTON ====================
    const handleBack = () => {
        window.history.back();
    };

    // ==================== LOAD DATA ====================
    const loadReportData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: invData, error: invError } = await supabase
                .from('invoices')
                .select('*')
                .order('created_at', { ascending: false });

            if (invError) throw invError;

            const { data: patData, error: patError } = await supabase
                .from('patients')
                .select('*')
                .order('created_at', { ascending: false });

            if (patError) throw patError;

            const { data: apptData, error: apptError } = await supabase
                .from('appointments')
                .select('*')
                .order('created_at', { ascending: false });

            if (apptError) throw apptError;

            // ===== FIXED: LOAD DOCTORS DATA =====
            const { data: docData, error: docError } = await supabase
                .from('doctors')
                .select('id, name, specialization, department');

            if (docError) {
                console.error('❌ Doctors Error:', docError);
                setDoctors([]);
            } else {
                console.log('✅ Doctors loaded:', docData?.length || 0);
                setDoctors(docData || []);
            }

            // ===== FIXED: LOAD PHARMACY DATA =====
            let pharmacyData = [];
            try {
                pharmacyData = await dbPharmacy.getPharmacy();
                console.log('✅ Pharmacy Data loaded:', pharmacyData?.length || 0);
            } catch (pharmErr) {
                console.error('❌ Pharmacy Error:', pharmErr);
                pharmacyData = [];
            }
            setMedicines(pharmacyData || []);

            const patientIds = invData?.map(inv => inv.patient_id).filter(id => id) || [];
            let patientsMap = {};
            if (patientIds.length > 0) {
                const { data: patientsData } = await supabase
                    .from('patients')
                    .select('id, name, phone, gender')
                    .in('id', patientIds);
                if (patientsData) {
                    patientsMap = patientsData.reduce((acc, p) => { acc[p.id] = p; return acc; }, {});
                }
            }

            const mergedInvoices = (invData || []).map(inv => ({
                ...inv,
                patient: patientsMap[inv.patient_id] || { name: inv.patient_name || 'Unknown' },
                amount: inv.total || 0,
                status: inv.status || 'pending',
                payment_method: inv.payment_method || 'cash',
                department: inv.department || 'General'
            }));

            setInvoices(mergedInvoices);
            setFilteredInvoices(mergedInvoices);
            setPatients(patData || []);
            setAppointments(apptData || []);
            calculateStats(mergedInvoices, patData || [], apptData || [], docData || [], pharmacyData || []);
        } catch (err) {
            console.error('❌ Load report error:', err);
            showToast('Failed to load report data', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    // ==================== CALCULATE STATISTICS ====================
    const calculateStats = (invData, patData, apptData, docData, pharmacyData) => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        const totalInvoices = invData.length;
        const totalRevenue = invData.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
        const paidInvoices = invData.filter(inv => inv.status === 'paid');
        const unpaidInvoices = invData.filter(inv => inv.status === 'unpaid');
        const pendingInvoices = invData.filter(inv => inv.status === 'pending');
        const paidRevenue = paidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
        const pendingRevenue = [...pendingInvoices, ...unpaidInvoices].reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

        const todayInvoices = invData.filter(inv => new Date(inv.created_at).toISOString().split('T')[0] === today && inv.status === 'paid');
        const todayRevenue = todayInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
        const averageInvoice = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;
        const collectionRate = totalRevenue > 0 ? (paidRevenue / totalRevenue) * 100 : 0;

        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const currentMonthRevenue = invData.filter(inv => new Date(inv.created_at) >= currentMonth && inv.status === 'paid')
            .reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
        const lastMonthRevenue = invData.filter(inv => new Date(inv.created_at) >= lastMonth && new Date(inv.created_at) < currentMonth && inv.status === 'paid')
            .reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
        const revenueChange = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

        const paymentMethods = { cash: { count: 0, amount: 0 }, card: { count: 0, amount: 0 }, bankTransfer: { count: 0, amount: 0 }, insurance: { count: 0, amount: 0 }, online: { count: 0, amount: 0 } };
        paidInvoices.forEach(inv => {
            const method = inv.payment_method || 'cash';
            const key = method.toLowerCase().replace(' ', '');
            if (paymentMethods[key]) {
                paymentMethods[key].count++;
                paymentMethods[key].amount += parseFloat(inv.total) || 0;
            }
        });

        const monthlyData = [];
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = date.toLocaleString('default', { month: 'short' });
            const monthInvoices = invData.filter(inv => {
                const invDate = new Date(inv.created_at);
                return invDate.getMonth() === date.getMonth() && invDate.getFullYear() === date.getFullYear();
            });
            monthlyData.push({
                month: monthName,
                revenue: monthInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0),
                count: monthInvoices.length,
                paid: monthInvoices.filter(inv => inv.status === 'paid').length
            });
        }

        const weeklyData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayInvoices = invData.filter(inv => new Date(inv.created_at).toISOString().split('T')[0] === dateStr);
            weeklyData.push({
                date: date.toLocaleDateString('default', { weekday: 'short' }),
                revenue: dayInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0),
                count: dayInvoices.length
            });
        }

        // ===== FIXED: Calculate doctor revenue =====
        const doctorRevenue = {};
        (docData || []).forEach(doc => {
            doctorRevenue[doc.id] = {
                id: doc.id,
                name: doc.name || 'Unknown Doctor',
                count: 0,
                amount: 0
            };
        });

        invData.forEach(inv => {
            if (inv.doctor_id && doctorRevenue[inv.doctor_id]) {
                doctorRevenue[inv.doctor_id].count++;
                doctorRevenue[inv.doctor_id].amount += parseFloat(inv.total) || 0;
            }
        });

        const revenueByDoctor = Object.values(doctorRevenue)
            .filter(d => d.count > 0 || d.amount > 0)
            .sort((a, b) => b.amount - a.amount);

        console.log('✅ Revenue by Doctor:', revenueByDoctor);
        setStats(prev => ({ ...prev, revenueByDoctor }));

        const topDoctors = revenueByDoctor.slice(0, 5);

        const serviceCount = {};
        invData.forEach(inv => {
            if (inv.items) {
                const items = typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items;
                if (Array.isArray(items)) {
                    items.forEach(item => {
                        const name = item.medicine_name || item.name || 'Other';
                        if (!serviceCount[name]) serviceCount[name] = { count: 0, amount: 0 };
                        serviceCount[name].count++;
                        serviceCount[name].amount += parseFloat(item.total || item.price || 0);
                    });
                }
            }
        });
        const topServices = Object.entries(serviceCount).sort((a, b) => b[1].amount - a[1].amount).slice(0, 5).map(([name, data]) => ({ name, ...data }));

        const patientRevenue = {};
        invData.forEach(inv => {
            const name = inv.patient?.name || inv.patient_name || 'Unknown';
            if (!patientRevenue[name]) patientRevenue[name] = { count: 0, amount: 0 };
            patientRevenue[name].count++;
            patientRevenue[name].amount += parseFloat(inv.total) || 0;
        });
        const topPatients = Object.entries(patientRevenue).sort((a, b) => b[1].amount - a[1].amount).slice(0, 5).map(([name, data]) => ({ name, ...data }));

        const recentTransactions = invData.slice(0, 10).map(inv => ({
            id: inv.id,
            invoice_number: inv.invoice_number,
            patient_name: inv.patient?.name || inv.patient_name || 'N/A',
            amount: inv.total || 0,
            status: inv.status,
            payment_method: inv.payment_method,
            date: inv.created_at
        }));

        const recentPatients = (patData || []).slice(0, 5).map(p => ({
            id: p.id,
            name: p.name,
            phone: p.phone,
            created_at: p.created_at
        }));

        const upcomingAppointmentsList = (apptData || [])
            .filter(a => a.status === 'scheduled' || a.status === 'pending')
            .slice(0, 5)
            .map(a => ({
                id: a.id,
                patient_name: a.patient_name || 'Unknown',
                doctor_name: a.doctor_name || 'Unknown',
                date: a.date || a.appointment_date,
                time: a.time || a.appointment_time
            }));

        const departmentRevenue = {};
        invData.forEach(inv => {
            const dept = inv.department || 'General';
            if (!departmentRevenue[dept]) departmentRevenue[dept] = { count: 0, amount: 0 };
            departmentRevenue[dept].count++;
            departmentRevenue[dept].amount += parseFloat(inv.total) || 0;
        });
        const revenueByDepartment = Object.entries(departmentRevenue).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.amount - a.amount);

        const statusBreakdown = [
            { status: 'Paid', count: paidInvoices.length, amount: paidRevenue, color: '#10B981', icon: '✅' },
            { status: 'Pending', count: pendingInvoices.length, amount: pendingRevenue, color: '#F59E0B', icon: '⏳' },
            { status: 'Unpaid', count: unpaidInvoices.length, amount: pendingRevenue, color: '#EF4444', icon: '❌' }
        ];

        setStats({
            totalRevenue, totalInvoices, paidInvoices: paidInvoices.length, unpaidInvoices: unpaidInvoices.length,
            pendingInvoices: pendingInvoices.length, pendingRevenue, averageInvoice, monthlyRevenue: monthlyData[monthlyData.length - 1]?.revenue || 0,
            weeklyRevenue: weeklyData.reduce((acc, d) => acc + d.revenue, 0), revenueChange, collectionRate, todayRevenue,
            totalPatients: patData.length, newPatients: patData.filter(p => new Date(p.created_at) >= monthAgo).length,
            activePatients: patData.filter(p => p.status === 'active').length,
            malePatients: patData.filter(p => p.gender === 'male' || p.gender === 'Male').length,
            femalePatients: patData.filter(p => p.gender === 'female' || p.gender === 'Female').length,
            totalAppointments: apptData.length, completedAppointments: apptData.filter(a => a.status === 'completed' || a.status === 'done').length,
            cancelledAppointments: apptData.filter(a => a.status === 'cancelled').length,
            upcomingAppointments: apptData.filter(a => a.status === 'scheduled' || a.status === 'pending').length,
            totalDoctors: docData.length, totalMedicines: pharmacyData.length,
            lowStockMedicines: pharmacyData.filter(m => (parseInt(m.stock) || 0) > 0 && parseInt(m.stock) <= 20).length,
            outOfStockMedicines: pharmacyData.filter(m => parseInt(m.stock) === 0 || !m.stock).length,
            totalInventoryValue: pharmacyData.reduce((sum, m) => sum + (parseFloat(m.selling_price || m.price || 0) * parseInt(m.stock || 0)), 0),
            paymentMethods, monthlyData, weeklyData, topDoctors, topServices, topPatients,
            topMedicines: pharmacyData.slice(0, 5), recentTransactions, recentPatients, upcomingAppointmentsList,
            revenueByDoctor, revenueByDepartment, statusBreakdown
        });
    };

    useEffect(() => { loadReportData(); }, [loadReportData]);

    // ==================== APPLY FILTERS ====================
    const applyFilters = () => {
        let filtered = [...invoices];

        if (filterStatus !== 'all') {
            filtered = filtered.filter(inv => inv.status === filterStatus);
        }

        if (filterPaymentMethod !== 'all') {
            filtered = filtered.filter(inv => inv.payment_method === filterPaymentMethod);
        }

        if (filterDepartment !== 'all') {
            filtered = filtered.filter(inv => inv.department === filterDepartment);
        }

        if (filterMinAmount) {
            filtered = filtered.filter(inv => parseFloat(inv.total) >= parseFloat(filterMinAmount));
        }
        if (filterMaxAmount) {
            filtered = filtered.filter(inv => parseFloat(inv.total) <= parseFloat(filterMaxAmount));
        }

        setFilteredInvoices(filtered);
        setShowFilterPopup(false);
        calculateStats(filtered, patients, appointments, doctors, medicines);
        showToast(`✅ ${filtered.length} invoices found!`, 'success');
    };

    const clearFilters = () => {
        setFilterStatus('all');
        setFilterPaymentMethod('all');
        setFilterDepartment('all');
        setFilterMinAmount('');
        setFilterMaxAmount('');
        setFilteredInvoices(invoices);
        setShowFilterPopup(false);
        calculateStats(invoices, patients, appointments, doctors, medicines);
        showToast('✅ Filters cleared!', 'success');
    };

    // ==================== EXPORT TAB DATA ====================
    const handleExportTab = (tabName) => {
        setExporting(true);
        try {
            let dataToExport = [];
            let fileName = `report_${tabName}_${new Date().toISOString().split('T')[0]}`;
            let headers = [];
            let rows = [];

            switch (tabName) {
                case 'financial':
                    dataToExport = filteredInvoices.length > 0 ? filteredInvoices : invoices;
                    headers = ['Invoice #', 'Patient', 'Amount', 'Status', 'Date', 'Payment Method', 'Department'];
                    rows = dataToExport.map(inv => [
                        inv.invoice_number || '',
                        inv.patient?.name || inv.patient_name || 'N/A',
                        inv.total || 0,
                        inv.status || 'pending',
                        new Date(inv.created_at).toLocaleDateString() || '',
                        inv.payment_method || 'N/A',
                        inv.department || 'General'
                    ]);
                    break;

                case 'patients':
                    dataToExport = patients || [];
                    headers = ['Name', 'Phone', 'Gender', 'Age', 'Status', 'Registered'];
                    rows = dataToExport.map(p => [
                        p.name || 'N/A',
                        p.phone || 'N/A',
                        p.gender || 'N/A',
                        p.age || 'N/A',
                        p.status || 'active',
                        new Date(p.created_at).toLocaleDateString() || ''
                    ]);
                    break;

                case 'appointments':
                    dataToExport = appointments || [];
                    headers = ['Patient', 'Doctor', 'Date', 'Time', 'Status'];
                    rows = dataToExport.map(a => [
                        a.patient_name || 'N/A',
                        a.doctor_name || 'N/A',
                        a.date || a.appointment_date || 'N/A',
                        a.time || a.appointment_time || 'N/A',
                        a.status || 'pending'
                    ]);
                    break;

                case 'doctors':
                    dataToExport = stats.revenueByDoctor || [];
                    headers = ['Doctor Name', 'Invoices', 'Revenue'];
                    rows = dataToExport.map(d => [
                        d.name || 'Unknown',
                        d.count || 0,
                        d.amount || 0
                    ]);
                    break;

                case 'pharmacy':
                    dataToExport = medicines || [];
                    headers = ['Medicine Name', 'Price', 'Stock', 'Value'];
                    rows = dataToExport.map(m => [
                        m.medicine_name || m.name || 'Unknown',
                        m.selling_price || m.price || 0,
                        m.stock || 0,
                        (parseFloat(m.selling_price || m.price || 0) * parseInt(m.stock || 0)) || 0
                    ]);
                    break;

                default:
                    dataToExport = filteredInvoices.length > 0 ? filteredInvoices : invoices;
                    headers = ['Invoice #', 'Patient', 'Amount', 'Status', 'Date', 'Payment Method', 'Department'];
                    rows = dataToExport.map(inv => [
                        inv.invoice_number || '',
                        inv.patient?.name || inv.patient_name || 'N/A',
                        inv.total || 0,
                        inv.status || 'pending',
                        new Date(inv.created_at).toLocaleDateString() || '',
                        inv.payment_method || 'N/A',
                        inv.department || 'General'
                    ]);
            }

            const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showToast(`✅ ${tabName.charAt(0).toUpperCase() + tabName.slice(1)} report exported!`, 'success');
        } catch (err) {
            console.error('Export error:', err);
            showToast('Export failed: ' + err.message, 'error');
        } finally {
            setExporting(false);
        }
    };

    // ==================== GENERATE REPORT ====================
    const generateReport = () => {
        setGeneratingReport(true);
        try {
            const dataToExport = filteredInvoices.length > 0 ? filteredInvoices : invoices;
            const report = {
                title: `${reportType === 'all' ? 'Complete' : reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
                generatedAt: new Date().toISOString(),
                dateRange: dateRange,
                filters: {
                    status: filterStatus,
                    paymentMethod: filterPaymentMethod,
                    department: filterDepartment,
                    minAmount: filterMinAmount || '0',
                    maxAmount: filterMaxAmount || '∞'
                },
                summary: {
                    totalRevenue: stats.totalRevenue,
                    totalInvoices: dataToExport.length,
                    paidInvoices: dataToExport.filter(inv => inv.status === 'paid').length,
                    pendingRevenue: stats.pendingRevenue,
                    collectionRate: stats.collectionRate,
                    averageInvoice: stats.averageInvoice,
                    totalPatients: stats.totalPatients,
                    totalAppointments: stats.totalAppointments,
                    totalMedicines: stats.totalMedicines
                },
                details: {
                    invoices: dataToExport.slice(0, 50),
                    topDoctors: stats.topDoctors,
                    topServices: stats.topServices,
                    paymentMethods: stats.paymentMethods,
                    monthlyData: stats.monthlyData,
                    weeklyData: stats.weeklyData
                }
            };

            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report_${reportType}_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showToast('✅ Report generated successfully!', 'success');
        } catch (err) {
            showToast('Failed to generate report: ' + err.message, 'error');
        } finally {
            setGeneratingReport(false);
        }
    };

    // ==================== EXPORT FUNCTIONS ====================
    const handleExportCSV = () => {
        setExporting(true);
        try {
            const dataToExport = filteredInvoices.length > 0 ? filteredInvoices : invoices;

            if (!dataToExport || dataToExport.length === 0) {
                showToast('No data to export', 'error');
                setExporting(false);
                setShowExportMenu(false);
                return;
            }

            const headers = ['Invoice #', 'Patient', 'Amount', 'Status', 'Date', 'Payment Method', 'Department'];
            const rows = dataToExport.map(inv => [
                inv.invoice_number || '',
                inv.patient?.name || inv.patient_name || 'N/A',
                inv.total || 0,
                inv.status || 'pending',
                new Date(inv.created_at).toLocaleDateString() || '',
                inv.payment_method || 'N/A',
                inv.department || 'General'
            ]);

            const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showToast('✅ Report exported as CSV!', 'success');
        } catch (err) {
            console.error('Export CSV error:', err);
            showToast('Export failed: ' + err.message, 'error');
        } finally {
            setExporting(false);
            setShowExportMenu(false);
        }
    };

    const handleExportExcel = () => {
        setExporting(true);
        try {
            const dataToExport = filteredInvoices.length > 0 ? filteredInvoices : invoices;

            if (!dataToExport || dataToExport.length === 0) {
                showToast('No data to export', 'error');
                setExporting(false);
                setShowExportMenu(false);
                return;
            }

            let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" 
                              xmlns:x="urn:schemas-microsoft-com:office:excel" 
                              xmlns="http://www.w3.org/TR/REC-html40">
                <head>
                    <meta charset="UTF-8">
                    <style>
                        table { border-collapse: collapse; font-family: Arial; font-size: 12px; }
                        th { background: #4A90D9; color: #fff; padding: 8px; border: 1px solid #ddd; }
                        td { padding: 6px 8px; border: 1px solid #ddd; }
                        tr:nth-child(even) { background: #f9f9f9; }
                        .title { font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 10px; }
                    </style>
                </head>
                <body>
                    <div class="title">${reportType === 'all' ? 'Complete' : reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</div>
                    <p>Generated: ${new Date().toLocaleString()}</p>
                    <p>Total Invoices: ${dataToExport.length}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Invoice</th>
                                <th>Patient</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Method</th>
                                <th>Dept</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>`;

            dataToExport.slice(0, 100).forEach((inv, i) => {
                html += `<tr>
                    <td>${i + 1}</td>
                    <td>${inv.invoice_number || ''}</td>
                    <td>${inv.patient?.name || inv.patient_name || 'N/A'}</td>
                    <td>Rs. ${(parseFloat(inv.total) || 0).toFixed(2)}</td>
                    <td>${inv.status || 'pending'}</td>
                    <td>${inv.payment_method || 'N/A'}</td>
                    <td>${inv.department || 'General'}</td>
                    <td>${new Date(inv.created_at).toLocaleDateString()}</td>
                </tr>`;
            });

            html += `
                        </tbody>
                    </table>
                    <br/>
                    <p><strong>Total Revenue:</strong> Rs. ${stats.totalRevenue.toFixed(2)}</p>
                    <p><strong>Total Invoices:</strong> ${dataToExport.length}</p>
                </body>
            </html>`;

            const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report_${new Date().toISOString().split('T')[0]}.xls`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showToast('✅ Report exported as Excel!', 'success');
        } catch (err) {
            console.error('Export Excel error:', err);
            showToast('Export failed: ' + err.message, 'error');
        } finally {
            setExporting(false);
            setShowExportMenu(false);
        }
    };

    const handleExportJSON = () => {
        setExporting(true);
        try {
            const dataToExport = filteredInvoices.length > 0 ? filteredInvoices : invoices;

            if (!dataToExport || dataToExport.length === 0) {
                showToast('No data to export', 'error');
                setExporting(false);
                setShowExportMenu(false);
                return;
            }

            const jsonData = {
                report_date: new Date().toISOString(),
                filters: {
                    status: filterStatus,
                    paymentMethod: filterPaymentMethod,
                    department: filterDepartment,
                    minAmount: filterMinAmount || '0',
                    maxAmount: filterMaxAmount || '∞'
                },
                summary: {
                    totalRevenue: stats.totalRevenue,
                    totalInvoices: dataToExport.length,
                    paidInvoices: dataToExport.filter(inv => inv.status === 'paid').length,
                    pendingRevenue: stats.pendingRevenue,
                    collectionRate: stats.collectionRate
                },
                invoices: dataToExport.slice(0, 50).map(inv => ({
                    invoice_number: inv.invoice_number,
                    patient_name: inv.patient?.name || inv.patient_name,
                    amount: inv.total,
                    status: inv.status,
                    payment_method: inv.payment_method,
                    department: inv.department,
                    date: inv.created_at
                })),
                statistics: stats
            };

            const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showToast('✅ Report exported as JSON!', 'success');
        } catch (err) {
            console.error('Export JSON error:', err);
            showToast('Export failed: ' + err.message, 'error');
        } finally {
            setExporting(false);
            setShowExportMenu(false);
        }
    };

    const handlePrint = () => {
        window.print();
        setShowExportMenu(false);
    };

    // ==================== UTILITY FUNCTIONS ====================
    const getStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'paid': return 'success';
            case 'unpaid': return 'danger';
            case 'pending': return 'warning';
            case 'partial': return 'info';
            default: return 'secondary';
        }
    };

    const getPaymentMethodIcon = (method) => {
        switch (method?.toLowerCase()) {
            case 'cash': return <Banknote size={14} />;
            case 'card': return <CreditCard size={14} />;
            case 'bank transfer': return <Building size={14} />;
            case 'insurance': return <ShieldAlert size={14} />;
            case 'online': return <Wallet size={14} />;
            default: return <CreditCard size={14} />;
        }
    };

    const formatCurrency = (amount) => `Rs. ${parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    const getFilterCount = () => {
        let count = 0;
        if (filterStatus !== 'all') count++;
        if (filterPaymentMethod !== 'all') count++;
        if (filterDepartment !== 'all') count++;
        if (filterMinAmount) count++;
        if (filterMaxAmount) count++;
        return count;
    };

    // ==================== TABS CONFIGURATION ====================
    const tabs = [
        { id: 'overview', label: 'Overview', icon: <Home size={16} /> },
        { id: 'financial', label: 'Financial', icon: <DollarSign size={16} /> },
        { id: 'patients', label: 'Patients', icon: <Users size={16} /> },
        { id: 'appointments', label: 'Appointments', icon: <Calendar size={16} /> },
        { id: 'doctors', label: 'Doctors', icon: <Stethoscope size={16} /> },
        { id: 'pharmacy', label: 'Pharmacy', icon: <Pill size={16} /> }
    ];

    // ==================== RENDER TAB CONTENT ====================
    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return <OverviewTab stats={stats} filteredInvoices={filteredInvoices} formatCurrency={formatCurrency} getStatusBadgeClass={getStatusBadgeClass} />;
            case 'financial':
                return <FinancialTab stats={stats} filteredInvoices={filteredInvoices} formatCurrency={formatCurrency} getStatusBadgeClass={getStatusBadgeClass} handleExportTab={handleExportTab} />;
            case 'patients':
                return <PatientsTab stats={stats} patients={patients} formatCurrency={formatCurrency} handleExportTab={handleExportTab} />;
            case 'appointments':
                return <AppointmentsTab stats={stats} formatCurrency={formatCurrency} handleExportTab={handleExportTab} />;
            case 'doctors':
                return <DoctorsTab stats={stats} formatCurrency={formatCurrency} handleExportTab={handleExportTab} />;
            case 'pharmacy':
                return <PharmacyTab stats={stats} medicines={medicines} formatCurrency={formatCurrency} handleExportTab={handleExportTab} />;
            default:
                return <OverviewTab stats={stats} filteredInvoices={filteredInvoices} formatCurrency={formatCurrency} getStatusBadgeClass={getStatusBadgeClass} />;
        }
    };

    // ==================== MAIN RENDER ====================
    return (
        <DashboardLayout active="reports" title="Reports & Financial Statements">
            {/* Toast */}
            {toast.show && (
                <div style={{
                    position: 'fixed', top: '20px', right: '20px', zIndex: 10000,
                    animation: 'slideInRight 0.5s ease-out', maxWidth: '450px', width: '100%'
                }}>
                    <div style={{
                        padding: '16px 20px', borderRadius: '12px',
                        background: toast.type === 'success' ? '#22C55E' : '#EF4444',
                        color: 'white', boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                        display: 'flex', alignItems: 'center', gap: '12px'
                    }}>
                        {toast.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                        <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500 }}>{toast.message}</div>
                        <button onClick={() => setToast({ show: false, message: '', type: 'success' })}
                            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '4px', opacity: 0.8 }}>
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                    <RefreshCw size={40} className="spinning" style={{ color: 'var(--primary-color)' }} />
                    <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Loading reports analytics...</p>
                </div>
            ) : (
                <div>

                    {/* ===== HERO HEADER ===== */}
                    <div style={{
                        background: 'linear-gradient(135deg, #1E40AF, #3B82F6, #60A5FA)',
                        borderRadius: '16px',
                        padding: '20px 24px',
                        marginBottom: '20px',
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 10px 40px rgba(59, 130, 246, 0.3)'
                    }}>
                        <div style={{ position: 'absolute', top: '-50%', right: '-5%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                <button
                                    onClick={handleBack}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        padding: '8px 14px',
                                        borderRadius: '10px',
                                        background: 'rgba(255,255,255,0.15)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontSize: '0.7rem',
                                        backdropFilter: 'blur(8px)',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                                >
                                    <ArrowLeft size={16} /> Back
                                </button>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                        <Sparkles size={20} />
                                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Analytics Dashboard</h2>
                                        <span style={{
                                            padding: '2px 10px',
                                            borderRadius: '12px',
                                            background: 'rgba(255,255,255,0.15)',
                                            fontSize: '0.5rem',
                                            fontWeight: 600,
                                            textTransform: 'uppercase'
                                        }}>Live</span>
                                    </div>
                                    <p style={{ opacity: 0.8, fontSize: '0.6rem', margin: 0 }}>
                                        {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <button
                                    onClick={generateReport}
                                    disabled={generatingReport}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        padding: '8px 16px', borderRadius: '10px',
                                        background: 'rgba(255,255,255,0.15)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        color: 'white', cursor: 'pointer',
                                        fontSize: '0.65rem', backdropFilter: 'blur(8px)',
                                        transition: 'all 0.3s ease',
                                        opacity: generatingReport ? 0.6 : 1
                                    }}>
                                    {generatingReport ? (
                                        <Loader size={14} className="spinning" />
                                    ) : (
                                        <FileBarChart size={14} />
                                    )}
                                    {generatingReport ? 'Generating...' : 'Generate Report'}
                                </button>
                                <button onClick={loadReportData} style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '8px 14px', borderRadius: '10px',
                                    background: 'rgba(255,255,255,0.15)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: 'white', cursor: 'pointer',
                                    fontSize: '0.65rem', backdropFilter: 'blur(8px)',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <RefreshCw size={14} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ===== CONTROL BAR ===== */}
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
                        gap: '10px', padding: '12px 16px', background: 'var(--card-bg)',
                        borderRadius: '12px', border: '1px solid var(--border-color)',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: '20px'
                    }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                            <select
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                style={{
                                    padding: '8px 12px', paddingRight: '32px',
                                    border: '2px solid var(--border-color)',
                                    borderRadius: '8px', fontSize: '0.7rem',
                                    background: 'var(--bg-primary)', color: 'var(--text-primary)',
                                    outline: 'none', cursor: 'pointer', minWidth: '120px',
                                    transition: 'all 0.2s ease',
                                    appearance: 'none'
                                }}
                            >
                                <option value="all">📊 All</option>
                                <option value="financial">💰 Financial</option>
                                <option value="patients">👤 Patients</option>
                                <option value="appointments">📅 Appointments</option>
                                <option value="doctors">🩺 Doctors</option>
                                <option value="pharmacy">💊 Pharmacy</option>
                            </select>

                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                                <input type="date" value={dateRange.start}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                    style={{ padding: '6px 8px', border: '2px solid var(--border-color)', borderRadius: '8px', fontSize: '0.65rem', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', width: '110px' }} />
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>to</span>
                                <input type="date" value={dateRange.end}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                    style={{ padding: '6px 8px', border: '2px solid var(--border-color)', borderRadius: '8px', fontSize: '0.65rem', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', width: '110px' }} />
                            </div>

                            <button
                                onClick={() => setShowFilterPopup(!showFilterPopup)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '8px 14px', border: '2px solid var(--border-color)',
                                    borderRadius: '8px', background: 'var(--bg-primary)',
                                    cursor: 'pointer', fontSize: '0.65rem',
                                    color: 'var(--text-secondary)', transition: 'all 0.3s ease',
                                    position: 'relative'
                                }}
                            >
                                <Filter size={14} style={{ color: 'var(--primary-color)' }} />
                                Filters
                                {getFilterCount() > 0 && (
                                    <span style={{
                                        position: 'absolute', top: '-4px', right: '-4px',
                                        width: '16px', height: '16px', borderRadius: '50%',
                                        background: '#EF4444', color: 'white', fontSize: '0.45rem',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700
                                    }}>
                                        {getFilterCount()}
                                    </span>
                                )}
                            </button>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{
                                display: 'flex', gap: '4px',
                                background: 'var(--bg-primary)',
                                borderRadius: '8px',
                                padding: '3px',
                                border: '2px solid var(--border-color)'
                            }}>
                                <button onClick={() => setViewMode('grid')}
                                    style={{
                                        padding: '4px 8px', borderRadius: '6px', border: 'none',
                                        background: viewMode === 'grid' ? 'var(--primary-color)' : 'transparent',
                                        color: viewMode === 'grid' ? 'white' : 'var(--text-secondary)',
                                        cursor: 'pointer', transition: 'all 0.3s ease',
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        fontSize: '0.6rem'
                                    }}>
                                    <LayoutGrid size={14} />
                                </button>
                                <button onClick={() => setViewMode('list')}
                                    style={{
                                        padding: '4px 8px', borderRadius: '6px', border: 'none',
                                        background: viewMode === 'list' ? 'var(--primary-color)' : 'transparent',
                                        color: viewMode === 'list' ? 'white' : 'var(--text-secondary)',
                                        cursor: 'pointer', transition: 'all 0.3s ease',
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        fontSize: '0.6rem'
                                    }}>
                                    <List size={14} />
                                </button>
                            </div>

                            <button onClick={handlePrint}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    padding: '6px 12px', border: '2px solid var(--border-color)',
                                    borderRadius: '8px', background: 'var(--bg-primary)',
                                    cursor: 'pointer', fontSize: '0.6rem',
                                    color: 'var(--text-secondary)', transition: 'all 0.3s ease'
                                }}>
                                <Printer size={14} />
                            </button>

                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setShowExportMenu(!showExportMenu)}
                                    disabled={exporting}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        padding: '6px 12px', border: '2px solid var(--border-color)',
                                        borderRadius: '8px', background: 'var(--bg-primary)',
                                        cursor: exporting ? 'not-allowed' : 'pointer',
                                        fontSize: '0.6rem', color: 'var(--text-secondary)',
                                        opacity: exporting ? 0.6 : 1, transition: 'all 0.3s ease'
                                    }}
                                >
                                    {exporting ? <Loader size={14} className="spinning" /> : <Download size={14} />}
                                    <ChevronDown size={12} />
                                </button>
                                {showExportMenu && !exporting && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 'calc(100% + 6px)',
                                        right: 0,
                                        background: 'var(--card-bg)',
                                        border: '2px solid var(--border-color)',
                                        borderRadius: '10px',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                                        minWidth: '140px',
                                        zIndex: 100,
                                        padding: '6px 0',
                                        animation: 'slideDown 0.2s ease'
                                    }}>
                                        <button onClick={handleExportCSV} style={{
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            padding: '8px 14px', width: '100%', border: 'none',
                                            background: 'transparent', cursor: 'pointer',
                                            fontSize: '0.7rem', color: 'var(--text-primary)',
                                            transition: 'all 0.15s ease'
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <FileText size={14} style={{ color: '#3B82F6' }} /> CSV
                                        </button>
                                        <button onClick={handleExportExcel} style={{
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            padding: '8px 14px', width: '100%', border: 'none',
                                            background: 'transparent', cursor: 'pointer',
                                            fontSize: '0.7rem', color: 'var(--text-primary)',
                                            transition: 'all 0.15s ease'
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <FileSpreadsheet size={14} style={{ color: '#22C55E' }} /> Excel
                                        </button>
                                        <button onClick={handleExportJSON} style={{
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            padding: '8px 14px', width: '100%', border: 'none',
                                            background: 'transparent', cursor: 'pointer',
                                            fontSize: '0.7rem', color: 'var(--text-primary)',
                                            transition: 'all 0.15s ease'
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <FileJson size={14} style={{ color: '#8B5CF6' }} /> JSON
                                        </button>
                                        <button onClick={handlePrint} style={{
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            padding: '8px 14px', width: '100%', border: 'none',
                                            background: 'transparent', cursor: 'pointer',
                                            fontSize: '0.7rem', color: 'var(--text-primary)',
                                            borderTop: '1px solid var(--border-color)',
                                            marginTop: '4px', paddingTop: '8px',
                                            transition: 'all 0.15s ease'
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <Printer size={14} style={{ color: '#F59E0B' }} /> Print
                                        </button>
                                        <button onClick={() => setShowExportMenu(false)} style={{
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            padding: '8px 14px', width: '100%', border: 'none',
                                            background: 'transparent', cursor: 'pointer',
                                            fontSize: '0.7rem', color: 'var(--text-secondary)',
                                            borderTop: '1px solid var(--border-color)',
                                            paddingTop: '8px',
                                            transition: 'all 0.15s ease'
                                        }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--hover-bg)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                                            <X size={14} /> Close
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ===== FILTER POPUP ===== */}
                    {showFilterPopup && (
                        <div style={{ marginBottom: '20px', animation: 'slideDown 0.3s ease-out' }}>
                            <div style={{
                                background: 'var(--card-bg)',
                                borderRadius: '12px',
                                padding: '20px',
                                border: '2px solid var(--primary-color)',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.12)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Filter size={18} style={{ color: 'var(--primary-color)' }} />
                                        Filters
                                        {getFilterCount() > 0 && (
                                            <span style={{ padding: '2px 10px', borderRadius: '12px', background: '#EF4444', color: 'white', fontSize: '0.55rem' }}>
                                                {getFilterCount()}
                                            </span>
                                        )}
                                    </h3>
                                    <button onClick={() => setShowFilterPopup(false)}
                                        style={{ padding: '4px', border: 'none', background: 'var(--bg-light)', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: '6px' }}>
                                        <X size={20} />
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.55rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Status</label>
                                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                                            style={{ width: '100%', padding: '8px 10px', border: '2px solid var(--border-color)', borderRadius: '8px', fontSize: '0.65rem', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}>
                                            <option value="all">All</option>
                                            <option value="paid">✅ Paid</option>
                                            <option value="pending">⏳ Pending</option>
                                            <option value="unpaid">❌ Unpaid</option>
                                            <option value="partial">🔶 Partial</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '0.55rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Method</label>
                                        <select value={filterPaymentMethod} onChange={(e) => setFilterPaymentMethod(e.target.value)}
                                            style={{ width: '100%', padding: '8px 10px', border: '2px solid var(--border-color)', borderRadius: '8px', fontSize: '0.65rem', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}>
                                            <option value="all">All</option>
                                            <option value="cash">💵 Cash</option>
                                            <option value="card">💳 Card</option>
                                            <option value="bankTransfer">🏦 Transfer</option>
                                            <option value="insurance">🛡️ Insurance</option>
                                            <option value="online">📱 Online</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '0.55rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Department</label>
                                        <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}
                                            style={{ width: '100%', padding: '8px 10px', border: '2px solid var(--border-color)', borderRadius: '8px', fontSize: '0.65rem', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}>
                                            <option value="all">All</option>
                                            <option value="General">🏥 General</option>
                                            <option value="Pharmacy">💊 Pharmacy</option>
                                            <option value="OPD">👨‍⚕️ OPD</option>
                                            <option value="Radiology">📷 Radiology</option>
                                            <option value="Lab">🔬 Lab</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '0.55rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Amount Range</label>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <input type="number" placeholder="Min" value={filterMinAmount} onChange={(e) => setFilterMinAmount(e.target.value)}
                                                style={{ width: '50%', padding: '8px 8px', border: '2px solid var(--border-color)', borderRadius: '8px', fontSize: '0.65rem', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
                                            <input type="number" placeholder="Max" value={filterMaxAmount} onChange={(e) => setFilterMaxAmount(e.target.value)}
                                                style={{ width: '50%', padding: '8px 8px', border: '2px solid var(--border-color)', borderRadius: '8px', fontSize: '0.65rem', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                                    <button onClick={clearFilters}
                                        style={{ padding: '8px 16px', border: '2px solid var(--border-color)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                                        Clear All
                                    </button>
                                    <button onClick={applyFilters}
                                        style={{ padding: '8px 20px', border: 'none', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary-color), #1D4ED8)', color: 'white', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600, boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
                                        Apply Filters
                                    </button>
                                </div>

                                {getFilterCount() > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                                        <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>Active filters:</span>
                                        {filterStatus !== 'all' && (
                                            <span style={{ padding: '2px 10px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary-color)', fontSize: '0.55rem' }}>
                                                Status: {filterStatus}
                                            </span>
                                        )}
                                        {filterPaymentMethod !== 'all' && (
                                            <span style={{ padding: '2px 10px', borderRadius: '12px', background: '#DBEAFE', color: '#2563EB', fontSize: '0.55rem' }}>
                                                Method: {filterPaymentMethod}
                                            </span>
                                        )}
                                        {filterDepartment !== 'all' && (
                                            <span style={{ padding: '2px 10px', borderRadius: '12px', background: '#EDE9FE', color: '#7C3AED', fontSize: '0.55rem' }}>
                                                Dept: {filterDepartment}
                                            </span>
                                        )}
                                        {(filterMinAmount || filterMaxAmount) && (
                                            <span style={{ padding: '2px 10px', borderRadius: '12px', background: '#FEF3C7', color: '#D97706', fontSize: '0.55rem' }}>
                                                Amount: {filterMinAmount || '0'} - {filterMaxAmount || '∞'}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ===== FILTER RESULTS INFO ===== */}
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 16px', background: 'var(--bg-light)', borderRadius: '10px',
                        marginBottom: '16px', border: '1px solid var(--border-color)',
                        flexWrap: 'wrap', gap: '6px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={16} style={{ color: 'var(--primary-color)' }} />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                <strong style={{ color: 'var(--text-primary)' }}>{filteredInvoices.length}</strong> invoices found
                            </span>
                            {getFilterCount() > 0 && (
                                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                                    • {getFilterCount()} filter{getFilterCount() > 1 ? 's' : ''} active
                                </span>
                            )}
                        </div>
                        {getFilterCount() > 0 && (
                            <button onClick={clearFilters}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'transparent', cursor: 'pointer', fontSize: '0.6rem', color: 'var(--text-secondary)' }}>
                                <X size={12} /> Clear filters
                            </button>
                        )}
                    </div>

                    {/* ===== TABS NAVIGATION ===== */}
                    <div style={{
                        display: 'flex',
                        gap: '6px',
                        overflowX: 'auto',
                        padding: '4px 2px',
                        marginBottom: '20px',
                        borderBottom: '2px solid var(--border-color)',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        WebkitOverflowScrolling: 'touch'
                    }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 20px',
                                    borderRadius: '10px 10px 0 0',
                                    border: 'none',
                                    background: activeTab === tab.id ? 'var(--primary-color)' : 'transparent',
                                    color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: activeTab === tab.id ? 600 : 500,
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.3s ease',
                                    position: 'relative',
                                    minWidth: '80px',
                                    justifyContent: 'center'
                                }}
                            >
                                {tab.icon}
                                <span className="tab-label">{tab.label}</span>
                                {activeTab === tab.id && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '-2px',
                                        left: 0,
                                        right: 0,
                                        height: '3px',
                                        background: 'white',
                                        borderRadius: '3px'
                                    }} />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* ===== TAB CONTENT ===== */}
                    <div style={{
                        animation: 'fadeIn 0.3s ease-out',
                        minHeight: '400px'
                    }}>
                        {renderTabContent()}
                    </div>

                    {/* ===== LIST VIEW (if viewMode is list) ===== */}
                    {viewMode === 'list' && (
                        <div style={{
                            background: 'var(--card-bg)',
                            borderRadius: '12px',
                            padding: '16px',
                            border: '1px solid var(--border-color)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            overflow: 'hidden',
                            marginTop: '16px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h3 style={{ fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <List size={16} style={{ color: 'var(--primary-color)' }} /> All Invoices
                                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>({filteredInvoices.length})</span>
                                </h3>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.65rem', minWidth: '500px' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Invoice</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Patient</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Amount</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Status</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Method</th>
                                            <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredInvoices.slice(0, 15).map((inv, index) => (
                                            <tr key={inv.id} style={{ borderBottom: index < Math.min(filteredInvoices.length, 15) - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                                <td style={{ padding: '8px 12px', fontWeight: 500, fontSize: '0.6rem' }}>{inv.invoice_number}</td>
                                                <td style={{ padding: '8px 12px', fontSize: '0.6rem' }}>{inv.patient?.name || inv.patient_name || 'N/A'}</td>
                                                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, fontSize: '0.6rem' }}>{formatCurrency(inv.total || 0)}</td>
                                                <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                                    <span className={`hms-badge ${getStatusBadgeClass(inv.status)}`} style={{ fontSize: '0.5rem', padding: '2px 8px' }}>{inv.status}</span>
                                                </td>
                                                <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: '0.55rem' }}>{inv.payment_method || 'N/A'}</td>
                                                <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: '0.55rem' }}>{new Date(inv.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <style>{`
                .spinning { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                
                .hms-badge {
                    padding: 2px 10px;
                    borderRadius: 12px;
                    font-size: 0.55rem;
                    font-weight: 600;
                    display: inline-block;
                }
                .hms-badge.success { background: #DCFCE7; color: #16A34A; }
                .hms-badge.danger { background: #FEE2E2; color: #DC2626; }
                .hms-badge.warning { background: #FEF3C7; color: #D97706; }
                .hms-badge.info { background: #DBEAFE; color: #2563EB; }
                .hms-badge.secondary { background: #F3F4F6; color: #6B7280; }

                @media (max-width: 1200px) {
                    .grid-cols-4 { grid-template-columns: repeat(2, 1fr) !important; }
                    .grid-cols-6 { grid-template-columns: repeat(3, 1fr) !important; }
                }

                @media (max-width: 768px) {
                    .grid-cols-4 { grid-template-columns: repeat(2, 1fr) !important; }
                    .grid-cols-6 { grid-template-columns: repeat(3, 1fr) !important; }
                    .grid-cols-2 { grid-template-columns: 1fr !important; }
                    .tab-label { display: none; }
                }

                @media (max-width: 480px) {
                    .grid-cols-4 { grid-template-columns: 1fr !important; }
                    .grid-cols-6 { grid-template-columns: repeat(2, 1fr) !important; }
                    .stat-value { font-size: 0.8rem; }
                }

                @media print {
                    .hms-controls-bar { display: none !important; }
                }
            `}</style>
        </DashboardLayout>
    );
};

export default Reports;