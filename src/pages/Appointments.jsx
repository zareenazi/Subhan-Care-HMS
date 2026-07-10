import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { supabase } from '../services/supabaseClient';
import Button from '../components/Button';
import InputField from '../components/InputField';
import {
    Plus, Search, Calendar, Clock, User, Stethoscope,
    Filter, Eye, X, ChevronLeft, ChevronRight,
    CheckCircle, XCircle, Clock as ClockIcon,
    Calendar as CalendarIcon, Edit2, Trash2,
    Users, Activity, FileText, AlertCircle, ChevronDown,
    ArrowLeft, RefreshCw, Save
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Appointments = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // ===== STATE =====
    const [appointments, setAppointments] = useState([]);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [doctorFilter, setDoctorFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState('newest');
    const [viewMode, setViewMode] = useState('table');
    const [totalAppointments, setTotalAppointments] = useState(0);

    // ===== MODALS =====
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    // ===== FORM STATE =====
    const [formData, setFormData] = useState({
        patient_id: '',
        doctor_id: '',
        appointment_date: '',
        time_slot: '',
        reason: '',
        status: 'scheduled'
    });

    const [formErrors, setFormErrors] = useState({});
    const [actionLoading, setActionLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // ===== CALENDAR STATE =====
    const [currentDate, setCurrentDate] = useState(new Date());

    // ===== STATUS COLORS =====
    const statusColors = {
        primary: '#2563EB',
        success: '#22C55E',
        danger: '#EF4444',
        warning: '#F59E0B',
        purple: '#8B5CF6',
        pink: '#EC4899',
        teal: '#14B8A6'
    };

    const statusOptions = ['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'];

    const timeSlots = [
        '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
        '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
        '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
        '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
        '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
        '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM',
        '08:00 PM'
    ];

    // ===== GO BACK =====
    const goBack = () => {
        navigate(-1);
    };

    // ===== GET STATUS BADGE =====
    const getStatusBadge = (status) => {
        const statusMap = {
            'scheduled': { color: 'info', icon: <ClockIcon size={12} style={{ marginRight: '4px' }} />, label: 'Scheduled' },
            'in-progress': { color: 'warning', icon: <Activity size={12} style={{ marginRight: '4px' }} />, label: 'In Progress' },
            'completed': { color: 'success', icon: <CheckCircle size={12} style={{ marginRight: '4px' }} />, label: 'Completed' },
            'cancelled': { color: 'danger', icon: <XCircle size={12} style={{ marginRight: '4px' }} />, label: 'Cancelled' },
            'no-show': { color: 'danger', icon: <AlertCircle size={12} style={{ marginRight: '4px' }} />, label: 'No Show' }
        };
        const info = statusMap[status] || statusMap['scheduled'];
        return (
            <span className={`hms-badge ${info.color}`} style={{
                padding: '3px 12px',
                borderRadius: '20px',
                fontSize: '0.7rem',
                display: 'inline-flex',
                alignItems: 'center'
            }}>
                {info.icon} {info.label}
            </span>
        );
    };

    // ===== LOAD DATA (FIXED) =====
    const loadData = async () => {
        setLoading(true);
        setErrorMsg('');
        console.log('🔍 Loading data...');

        try {
            // ===== LOAD PATIENTS =====
            console.log('🔍 Loading patients...');
            const { data: patientsData, error: patientsError } = await supabase
                .from('patients')
                .select('id, name, phone')
                .order('name', { ascending: true });

            if (patientsError) {
                console.error('❌ Patients Error:', patientsError);
                setPatients([]);
            } else {
                console.log('✅ Patients loaded:', patientsData?.length || 0);
                setPatients(patientsData || []);
            }

            // ===== LOAD DOCTORS =====
            console.log('🔍 Loading doctors...');
            const { data: doctorsData, error: doctorsError } = await supabase
                .from('doctors')
                .select('id, name, specialization')
                .order('name', { ascending: true });

            if (doctorsError) {
                console.error('❌ Doctors Error:', doctorsError);
                setDoctors([]);
            } else {
                console.log('✅ Doctors loaded:', doctorsData?.length || 0);
                setDoctors(doctorsData || []);
            }

            // ===== LOAD APPOINTMENTS =====
            console.log('🔍 Loading appointments...');

            let query = supabase
                .from('appointments')
                .select('*');

            if (statusFilter && statusFilter !== '') {
                query = query.eq('status', statusFilter);
            }
            if (doctorFilter && doctorFilter !== '') {
                query = query.eq('doctor_id', doctorFilter);
            }
            if (dateFilter && dateFilter !== '') {
                query = query.eq('appointment_date', dateFilter);
            }

            if (sortBy === 'newest') {
                query = query.order('appointment_date', { ascending: false });
            } else if (sortBy === 'oldest') {
                query = query.order('appointment_date', { ascending: true });
            }

            const { data: appointmentsData, error: appointmentsError } = await query;

            if (appointmentsError) {
                console.error('❌ Appointments Error:', appointmentsError);
                setAppointments([]);
                setTotalAppointments(0);
            } else {
                console.log('✅ Appointments loaded:', appointmentsData?.length || 0);

                const enrichedAppointments = (appointmentsData || []).map(app => {
                    const patient = patientsData?.find(p => p.id === app.patient_id);
                    const doctor = doctorsData?.find(d => d.id === app.doctor_id);
                    return {
                        ...app,
                        patients: patient || { name: 'Unknown Patient', phone: '' },
                        doctors: doctor || { name: 'Unknown Doctor', specialization: '' }
                    };
                });

                let filteredAppointments = enrichedAppointments;
                if (searchQuery && searchQuery.trim() !== '') {
                    const query = searchQuery.toLowerCase().trim();
                    filteredAppointments = enrichedAppointments.filter(app =>
                        (app.patients?.name || '').toLowerCase().includes(query) ||
                        (app.doctors?.name || '').toLowerCase().includes(query)
                    );
                }

                console.log('📋 Final appointments:', filteredAppointments);
                setAppointments(filteredAppointments);
                setTotalAppointments(filteredAppointments.length);
            }

        } catch (err) {
            console.error('❌ Error loading data:', err);
            setErrorMsg('Failed to load data: ' + err.message);
        } finally {
            setLoading(false);
            console.log('🏁 Loading complete');
        }
    };

    useEffect(() => {
        loadData();
    }, [searchQuery, statusFilter, doctorFilter, dateFilter, sortBy]);

    // ===== HANDLE FORM CHANGE =====
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // ===== VALIDATE FORM =====
    const validateForm = () => {
        const errors = {};
        if (!formData.patient_id) errors.patient_id = 'Please select a patient';
        if (!formData.doctor_id) errors.doctor_id = 'Please select a doctor';
        if (!formData.appointment_date) errors.appointment_date = 'Please select a date';
        if (!formData.time_slot) errors.time_slot = 'Please select a time slot';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // ===== OPEN MODALS =====
    const openAddModal = () => {
        const defaultDoctorId = user?.id || '';
        setFormData({
            patient_id: '',
            doctor_id: defaultDoctorId,
            appointment_date: new Date().toISOString().split('T')[0],
            time_slot: '',
            reason: '',
            status: 'scheduled'
        });
        setFormErrors({});
        setErrorMsg('');
        setSuccessMsg('');
        setIsAddOpen(true);
    };

    const openEditModal = (app) => {
        setSelectedAppointment(app);
        setFormData({
            patient_id: app.patient_id,
            doctor_id: app.doctor_id,
            appointment_date: app.appointment_date,
            time_slot: app.time_slot,
            reason: app.reason || '',
            status: app.status || 'scheduled'
        });
        setFormErrors({});
        setErrorMsg('');
        setSuccessMsg('');
        setIsEditOpen(true);
    };

    const openViewModal = (app) => {
        setSelectedAppointment(app);
        setIsViewOpen(true);
    };

    const openDeleteModal = (app) => {
        setSelectedAppointment(app);
        setIsDeleteOpen(true);
    };

    // ===== ADD APPOINTMENT (FIXED) =====
    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setActionLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            console.log('📝 Booking appointment with data:', {
                patient_id: formData.patient_id,
                doctor_id: formData.doctor_id,
                appointment_date: formData.appointment_date,
                time_slot: formData.time_slot,
                reason: formData.reason,
                status: formData.status
            });

            const { data, error } = await supabase
                .from('appointments')
                .insert([{
                    patient_id: formData.patient_id,
                    doctor_id: formData.doctor_id,
                    appointment_date: formData.appointment_date,
                    time_slot: formData.time_slot,
                    reason: formData.reason || null,
                    status: formData.status || 'scheduled'
                }])
                .select();

            if (error) {
                console.error('❌ Insert Error:', error);
                setErrorMsg('Failed to book appointment: ' + error.message);
                return;
            }

            console.log('✅ Appointment booked:', data);
            setSuccessMsg('✅ Appointment booked successfully!');
            setIsAddOpen(false);
            await loadData();

            window.dispatchEvent(new Event('appointmentAdded'));
            setTimeout(() => {
                window.dispatchEvent(new Event('appointmentChanged'));
            }, 500);

        } catch (err) {
            console.error('❌ Error:', err);
            setErrorMsg(err.message || 'Failed to book appointment.');
        } finally {
            setActionLoading(false);
        }
    };

    // ===== UPDATE APPOINTMENT (FIXED - removed updated_at) =====
    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setActionLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const { error } = await supabase
                .from('appointments')
                .update({
                    patient_id: formData.patient_id,
                    doctor_id: formData.doctor_id,
                    appointment_date: formData.appointment_date,
                    time_slot: formData.time_slot,
                    reason: formData.reason || null,
                    status: formData.status || 'scheduled'
                })
                .eq('id', selectedAppointment.id);

            if (error) {
                console.error('Update Error:', error);
                setErrorMsg('Failed to update appointment: ' + error.message);
                return;
            }

            setSuccessMsg('✅ Appointment updated successfully!');
            setIsEditOpen(false);
            await loadData();
            window.dispatchEvent(new Event('appointmentAdded'));
        } catch (err) {
            setErrorMsg(err.message || 'Failed to update appointment.');
        } finally {
            setActionLoading(false);
        }
    };

    // ===== DELETE APPOINTMENT =====
    const handleDeleteSubmit = async () => {
        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('id', selectedAppointment.id);

            if (error) {
                console.error('Delete Error:', error);
                setErrorMsg('Failed to delete appointment: ' + error.message);
                return;
            }

            setIsDeleteOpen(false);
            await loadData();
            window.dispatchEvent(new Event('appointmentAdded'));
            setSuccessMsg('✅ Appointment deleted successfully!');
        } catch (err) {
            setErrorMsg(err.message || 'Failed to delete appointment.');
        } finally {
            setActionLoading(false);
        }
    };

    // ===== CALENDAR FUNCTIONS =====
    const getMonthDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];
        const startDay = firstDay.getDay();
        const totalDays = lastDay.getDate();

        for (let i = 0; i < startDay; i++) {
            days.push(null);
        }
        for (let i = 1; i <= totalDays; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const changeMonth = (delta) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
    };

    const getAppointmentsForDate = (date) => {
        if (!date) return [];
        const dateStr = date.toISOString().split('T')[0];
        return appointments.filter(app => app.appointment_date === dateStr);
    };

    // ===== CLEAR FILTERS =====
    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('');
        setDoctorFilter('');
        setDateFilter('');
        setSortBy('newest');
        setShowFilters(false);
    };

    const activeFilterCount = (searchQuery ? 1 : 0) + (statusFilter ? 1 : 0) + (doctorFilter ? 1 : 0) + (dateFilter ? 1 : 0);

    // ===== STATS =====
    const scheduledCount = appointments.filter(a => a.status === 'scheduled').length;
    const inProgressCount = appointments.filter(a => a.status === 'in-progress').length;
    const completedCount = appointments.filter(a => a.status === 'completed').length;
    const cancelledCount = appointments.filter(a => a.status === 'cancelled' || a.status === 'no-show').length;

    return (
        <DashboardLayout active="appointments" title="Appointments">
            {/* ===== BACK BUTTON ===== */}
            <div style={{ marginBottom: '16px' }}>
                <button
                    onClick={goBack}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        background: 'transparent',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontFamily: 'var(--font-family)',
                        color: 'var(--text-secondary)',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = 'var(--hover-bg)';
                        e.target.style.color = 'var(--text-primary)';
                        e.target.style.borderColor = 'var(--primary-color)';
                        e.target.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'transparent';
                        e.target.style.color = 'var(--text-secondary)';
                        e.target.style.borderColor = 'var(--border-color)';
                        e.target.style.boxShadow = 'none';
                    }}
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>
            </div>

            {/* ===== HEADER ===== */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div>
                    <h1 style={{
                        fontSize: '1.4rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <Calendar size={24} style={{ color: 'var(--primary-color)' }} />
                        Appointments
                    </h1>
                    <p style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        marginTop: '4px'
                    }}>
                        Manage all appointments. Total: <strong>{totalAppointments}</strong> appointments
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={loadData}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-family)',
                            color: 'var(--text-secondary)',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'var(--hover-bg)';
                            e.target.style.color = 'var(--text-primary)';
                            e.target.style.borderColor = 'var(--primary-color)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'transparent';
                            e.target.style.color = 'var(--text-secondary)';
                            e.target.style.borderColor = 'var(--border-color)';
                        }}
                    >
                        <RefreshCw size={14} /> Refresh
                    </button>
                    <button
                        onClick={openAddModal}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 18px',
                            border: 'none',
                            borderRadius: '10px',
                            background: 'var(--primary-color)',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontFamily: 'var(--font-family)',
                            color: 'white',
                            fontWeight: 500,
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = '#1D4ED8';
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'var(--primary-color)';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                        }}
                    >
                        <Plus size={16} /> Book Appointment
                    </button>
                </div>
            </div>

            {/* ===== STATS SUMMARY ===== */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
                marginBottom: '20px'
            }}>
                <div className="stat-card" style={{
                    padding: '12px 16px',
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.3s ease'
                }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: `${statusColors.primary}15`,
                        color: statusColors.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Calendar size={16} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{totalAppointments}</div>
                    </div>
                </div>

                <div className="stat-card" style={{
                    padding: '12px 16px',
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.3s ease'
                }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: `${statusColors.warning}15`,
                        color: statusColors.warning,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <ClockIcon size={16} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Scheduled</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{scheduledCount}</div>
                    </div>
                </div>

                <div className="stat-card" style={{
                    padding: '12px 16px',
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.3s ease'
                }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: `${statusColors.success}15`,
                        color: statusColors.success,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <CheckCircle size={16} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Completed</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{completedCount}</div>
                    </div>
                </div>

                <div className="stat-card" style={{
                    padding: '12px 16px',
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.3s ease'
                }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: `${statusColors.danger}15`,
                        color: statusColors.danger,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <XCircle size={16} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cancelled</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{cancelledCount}</div>
                    </div>
                </div>
            </div>

            {/* ===== CONTROLS BAR ===== */}
            <div className="hms-controls-bar" style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                padding: '10px 14px',
                background: 'var(--card-bg)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: '16px'
            }}>
                <div className="hms-search-box" style={{ flex: 1, minWidth: '140px', position: 'relative' }}>
                    <Search size={16} className="hms-search-icon" style={{
                        position: 'absolute',
                        left: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)'
                    }} />
                    <input
                        type="text"
                        placeholder="Search by patient or doctor..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            height: '34px',
                            padding: '4px 10px 4px 32px',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '10px',
                            fontSize: '0.8rem',
                            fontFamily: 'var(--font-family)',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = 'var(--primary-color)';
                            e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = 'var(--border-color)';
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '3px', background: 'var(--bg-primary)', borderRadius: '8px', padding: '2px' }}>
                        <button
                            onClick={() => setViewMode('table')}
                            style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                background: viewMode === 'table' ? 'var(--card-bg)' : 'transparent',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                                fontFamily: 'var(--font-family)',
                                color: viewMode === 'table' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                fontWeight: viewMode === 'table' ? 600 : 400,
                                boxShadow: viewMode === 'table' ? 'var(--shadow-sm)' : 'none',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            📋 List
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                background: viewMode === 'calendar' ? 'var(--card-bg)' : 'transparent',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                                fontFamily: 'var(--font-family)',
                                color: viewMode === 'calendar' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                fontWeight: viewMode === 'calendar' ? 600 : 400,
                                boxShadow: viewMode === 'calendar' ? 'var(--shadow-sm)' : 'none',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            📅 Calendar
                        </button>
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            height: '34px',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '10px',
                            background: 'var(--bg-primary)',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            fontFamily: 'var(--font-family)',
                            color: 'var(--text-secondary)',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.borderColor = 'var(--primary-color)';
                            e.target.style.background = 'rgba(37, 99, 235, 0.04)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.borderColor = 'var(--border-color)';
                            e.target.style.background = 'var(--bg-primary)';
                        }}
                    >
                        <Filter size={14} style={{ color: 'var(--primary-color)' }} /> Filters
                        {activeFilterCount > 0 && (
                            <span style={{
                                background: 'var(--primary-color)',
                                color: 'white',
                                borderRadius: '50%',
                                width: '18px',
                                height: '18px',
                                fontSize: '0.6rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 600
                            }}>
                                {activeFilterCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={openAddModal}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 12px',
                            height: '34px',
                            border: 'none',
                            borderRadius: '10px',
                            background: 'var(--primary-color)',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-family)',
                            color: 'white',
                            fontWeight: 500,
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'var(--primary-hover)';
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'var(--primary-color)';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                        }}
                    >
                        <Plus size={14} /> Book
                    </button>
                </div>
            </div>

            {/* ===== FILTERS BAR ===== */}
            {showFilters && (
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    padding: '10px 14px',
                    background: 'var(--bg-primary)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    marginBottom: '16px',
                    alignItems: 'center'
                }}>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{
                            height: '32px',
                            padding: '0 10px',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '8px',
                            fontSize: '0.7rem',
                            fontFamily: 'var(--font-family)',
                            background: 'var(--card-bg)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            cursor: 'pointer',
                            minWidth: '100px'
                        }}
                    >
                        <option value="">All Status</option>
                        {statusOptions.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <select
                        value={doctorFilter}
                        onChange={(e) => setDoctorFilter(e.target.value)}
                        style={{
                            height: '32px',
                            padding: '0 10px',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '8px',
                            fontSize: '0.7rem',
                            fontFamily: 'var(--font-family)',
                            background: 'var(--card-bg)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            cursor: 'pointer',
                            minWidth: '100px'
                        }}
                    >
                        <option value="">All Doctors</option>
                        {doctors.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        style={{
                            height: '32px',
                            padding: '0 10px',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '8px',
                            fontSize: '0.7rem',
                            fontFamily: 'var(--font-family)',
                            background: 'var(--card-bg)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            minWidth: '130px'
                        }}
                    />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{
                            height: '32px',
                            padding: '0 10px',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '8px',
                            fontSize: '0.7rem',
                            fontFamily: 'var(--font-family)',
                            background: 'var(--card-bg)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            cursor: 'pointer',
                            minWidth: '90px'
                        }}
                    >
                        <option value="newest">📅 Newest</option>
                        <option value="oldest">📅 Oldest</option>
                    </select>
                    <button
                        onClick={clearFilters}
                        style={{
                            padding: '4px 10px',
                            height: '32px',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '8px',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontSize: '0.65rem',
                            fontFamily: 'var(--font-family)',
                            color: 'var(--text-secondary)',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'var(--hover-bg)';
                            e.target.style.color = 'var(--text-primary)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'transparent';
                            e.target.style.color = 'var(--text-secondary)';
                        }}
                    >
                        Clear All
                    </button>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {totalAppointments} found
                    </span>
                </div>
            )}

            {/* ===== VIEW: TABLE ===== */}
            {viewMode === 'table' && (
                <div className="hms-table-container" style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                            <div className="spinner" style={{ margin: '0 auto 12px' }}>⏳</div>
                            Loading appointments...
                        </div>
                    ) : appointments.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📅</div>
                            <h3 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>No Appointments Found</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                {activeFilterCount > 0 ? 'Try clearing your filters to see all appointments.' : 'Start by booking your first appointment.'}
                            </p>
                            <br />
                            <button
                                onClick={openAddModal}
                                style={{
                                    marginTop: '12px',
                                    padding: '8px 20px',
                                    background: 'var(--primary-color)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontFamily: 'var(--font-family)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                                onMouseEnter={(e) => e.target.style.background = 'var(--primary-hover)'}
                                onMouseLeave={(e) => e.target.style.background = 'var(--primary-color)'}
                            >
                                <Plus size={16} /> First Appointment
                            </button>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                            <table className="hms-table" style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                fontSize: '0.8rem',
                                minWidth: '650px'
                            }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '8px 12px', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                            <CalendarIcon size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Date
                                        </th>
                                        <th style={{ padding: '8px 12px', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                            <Clock size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Time
                                        </th>
                                        <th style={{ padding: '8px 12px', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                            <User size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Patient
                                        </th>
                                        <th style={{ padding: '8px 12px', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                            <Stethoscope size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Doctor
                                        </th>
                                        <th style={{ padding: '8px 12px', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                            Status
                                        </th>
                                        <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {appointments.map(app => (
                                        <tr key={app.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s ease' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '6px 12px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                                {new Date(app.appointment_date).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '6px 12px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                                {app.time_slot}
                                            </td>
                                            <td style={{ padding: '6px 12px', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                                                {app.patients?.name || 'Unknown Patient'}
                                            </td>
                                            <td style={{ padding: '6px 12px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                                {app.doctors?.name || 'Unknown Doctor'}
                                                {app.doctors?.specialization && (
                                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                                                        {app.doctors.specialization}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '6px 12px' }}>
                                                {getStatusBadge(app.status)}
                                            </td>
                                            <td style={{ padding: '6px 12px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                                    <button
                                                        onClick={() => openViewModal(app)}
                                                        style={{
                                                            padding: '4px 8px',
                                                            border: '1px solid var(--border-color)',
                                                            borderRadius: '6px',
                                                            background: 'transparent',
                                                            cursor: 'pointer',
                                                            fontSize: '0.65rem',
                                                            fontFamily: 'var(--font-family)',
                                                            color: 'var(--text-secondary)',
                                                            transition: 'all 0.2s ease',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '3px'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.target.style.borderColor = 'var(--primary-color)';
                                                            e.target.style.color = 'var(--primary-color)';
                                                            e.target.style.background = 'rgba(37, 99, 235, 0.04)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.target.style.borderColor = 'var(--border-color)';
                                                            e.target.style.color = 'var(--text-secondary)';
                                                            e.target.style.background = 'transparent';
                                                        }}
                                                    >
                                                        <Eye size={12} /> View
                                                    </button>
                                                    {app.status !== 'cancelled' && app.status !== 'completed' && (
                                                        <>
                                                            <button
                                                                onClick={() => openEditModal(app)}
                                                                style={{
                                                                    padding: '4px 8px',
                                                                    border: '1px solid var(--border-color)',
                                                                    borderRadius: '6px',
                                                                    background: 'transparent',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.65rem',
                                                                    fontFamily: 'var(--font-family)',
                                                                    color: 'var(--text-secondary)',
                                                                    transition: 'all 0.2s ease',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '3px'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.target.style.borderColor = 'var(--secondary-color)';
                                                                    e.target.style.color = 'var(--secondary-color)';
                                                                    e.target.style.background = 'rgba(34, 197, 94, 0.04)';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.target.style.borderColor = 'var(--border-color)';
                                                                    e.target.style.color = 'var(--text-secondary)';
                                                                    e.target.style.background = 'transparent';
                                                                }}
                                                            >
                                                                <Edit2 size={12} /> Edit
                                                            </button>
                                                            <button
                                                                onClick={() => openDeleteModal(app)}
                                                                style={{
                                                                    padding: '4px 8px',
                                                                    border: '1px solid var(--border-color)',
                                                                    borderRadius: '6px',
                                                                    background: 'transparent',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.65rem',
                                                                    fontFamily: 'var(--font-family)',
                                                                    color: 'var(--text-secondary)',
                                                                    transition: 'all 0.2s ease',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '3px'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.target.style.borderColor = 'var(--danger-color)';
                                                                    e.target.style.color = 'var(--danger-color)';
                                                                    e.target.style.background = 'rgba(239, 68, 68, 0.04)';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.target.style.borderColor = 'var(--border-color)';
                                                                    e.target.style.color = 'var(--text-secondary)';
                                                                    e.target.style.background = 'transparent';
                                                                }}
                                                            >
                                                                <Trash2 size={12} /> Delete
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ===== VIEW: CALENDAR ===== */}
            {viewMode === 'calendar' && (
                <div className="calendar-view-container" style={{
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    padding: '16px',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <div className="calendar-header" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '16px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button
                                onClick={() => changeMonth(-1)}
                                style={{
                                    padding: '6px 10px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'var(--hover-bg)';
                                    e.target.style.borderColor = 'var(--primary-color)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'transparent';
                                    e.target.style.borderColor = 'var(--border-color)';
                                }}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <h3 style={{
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                margin: 0,
                                minWidth: '150px',
                                textAlign: 'center'
                            }}>
                                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </h3>
                            <button
                                onClick={() => changeMonth(1)}
                                style={{
                                    padding: '6px 10px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'var(--hover-bg)';
                                    e.target.style.borderColor = 'var(--primary-color)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'transparent';
                                    e.target.style.borderColor = 'var(--border-color)';
                                }}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                        <button
                            onClick={openAddModal}
                            style={{
                                padding: '6px 14px',
                                border: 'none',
                                borderRadius: '8px',
                                background: 'var(--primary-color)',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontFamily: 'var(--font-family)',
                                color: 'white',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = '#1D4ED8';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'var(--primary-color)';
                            }}
                        >
                            <Plus size={14} /> Book
                        </button>
                    </div>

                    <div className="calendar-days-row" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        textAlign: 'center',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        borderBottom: '2px solid var(--border-color)',
                        paddingBottom: '8px',
                        marginBottom: '8px'
                    }}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <span key={day}>{day}</span>
                        ))}
                    </div>

                    <div className="calendar-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: '4px'
                    }}>
                        {getMonthDays().map((day, index) => {
                            const dayAppointments = day ? getAppointmentsForDate(day) : [];
                            const isToday = day ? day.toDateString() === new Date().toDateString() : false;

                            return (
                                <div
                                    key={index}
                                    style={{
                                        minHeight: '70px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        padding: '4px 6px',
                                        background: day ? (isToday ? 'rgba(37, 99, 235, 0.05)' : 'var(--card-bg)') : 'var(--bg-primary)',
                                        opacity: day ? 1 : 0.3,
                                        cursor: day ? 'pointer' : 'default',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (day) {
                                            e.currentTarget.style.borderColor = 'var(--primary-color)';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.08)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (day) {
                                            e.currentTarget.style.borderColor = 'var(--border-color)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }
                                    }}
                                    onClick={() => {
                                        if (day) {
                                            setFormData({
                                                ...formData,
                                                appointment_date: day.toISOString().split('T')[0]
                                            });
                                            setIsAddOpen(true);
                                        }
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '2px'
                                    }}>
                                        <span style={{
                                            fontSize: '0.7rem',
                                            fontWeight: isToday ? 700 : 400,
                                            color: isToday ? 'var(--primary-color)' : 'var(--text-secondary)',
                                            background: isToday ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                                            borderRadius: '50%',
                                            width: '22px',
                                            height: '22px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {day?.getDate()}
                                        </span>
                                        {dayAppointments.length > 0 && (
                                            <span style={{
                                                fontSize: '0.55rem',
                                                color: 'var(--text-muted)',
                                                background: 'var(--bg-primary)',
                                                padding: '1px 6px',
                                                borderRadius: '10px'
                                            }}>
                                                {dayAppointments.length}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '2px',
                                        overflow: 'hidden'
                                    }}>
                                        {dayAppointments.slice(0, 2).map(app => (
                                            <div
                                                key={app.id}
                                                style={{
                                                    fontSize: '0.55rem',
                                                    padding: '1px 4px',
                                                    borderRadius: '4px',
                                                    background: app.status === 'completed' ? 'rgba(34, 197, 94, 0.1)' :
                                                        app.status === 'cancelled' ? 'rgba(239, 68, 68, 0.1)' :
                                                            'rgba(37, 99, 235, 0.1)',
                                                    color: app.status === 'completed' ? '#16A34A' :
                                                        app.status === 'cancelled' ? '#DC2626' :
                                                            'var(--primary-color)',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openViewModal(app);
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1.02)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                }}
                                            >
                                                {app.time_slot} {app.patients?.name?.split(' ')[0] || 'Unknown'}
                                            </div>
                                        ))}
                                        {dayAppointments.length > 2 && (
                                            <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                                +{dayAppointments.length - 2} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ===== ADD APPOINTMENT MODAL ===== */}
            {isAddOpen && (
                <div className="hms-modal-backdrop" onClick={() => setIsAddOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{
                        maxWidth: '520px',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'var(--card-bg)',
                        borderRadius: '16px',
                        boxShadow: 'var(--shadow-xl)',
                        border: '1px solid var(--border-color)',
                        width: '100%',
                        margin: '16px'
                    }}>
                        <div className="hms-modal-header" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '14px 18px',
                            borderBottom: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            borderRadius: '16px 16px 0 0'
                        }}>
                            <h3 className="hms-modal-title" style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'var(--text-primary)'
                            }}>
                                <CalendarIcon size={18} style={{ color: 'var(--primary-color)' }} />
                                Book Appointment
                            </h3>
                            <button
                                onClick={() => setIsAddOpen(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)',
                                    padding: '4px',
                                    borderRadius: '6px',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'var(--hover-bg)';
                                    e.target.style.color = 'var(--danger-color)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'transparent';
                                    e.target.style.color = 'var(--text-secondary)';
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="hms-modal-body" style={{
                            padding: '18px',
                            overflowY: 'auto',
                            flex: 1
                        }}>
                            {errorMsg && (
                                <div className="alert alert-danger" style={{
                                    marginBottom: '12px',
                                    padding: '10px 14px',
                                    background: '#EF444415',
                                    border: '1px solid #EF444430',
                                    borderRadius: '8px',
                                    color: '#EF4444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <AlertCircle size={16} /> {errorMsg}
                                </div>
                            )}
                            {successMsg && (
                                <div className="alert alert-success" style={{
                                    marginBottom: '12px',
                                    padding: '10px 14px',
                                    background: '#22C55E15',
                                    border: '1px solid #22C55E30',
                                    borderRadius: '8px',
                                    color: '#16A34A',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <CheckCircle size={16} /> {successMsg}
                                </div>
                            )}
                            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {/* ===== PATIENT SELECTION ===== */}
                                <div className="form-group" style={{ marginBottom: '0' }}>
                                    <label className="form-label" style={{
                                        display: 'block',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        <User size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--primary-color)' }} /> Patient <span style={{ color: 'var(--danger-color)' }}>*</span>
                                    </label>
                                    <select
                                        name="patient_id"
                                        className="hms-select"
                                        value={formData.patient_id}
                                        onChange={handleFormChange}
                                        required
                                        style={{
                                            width: '100%',
                                            height: '38px',
                                            padding: '0 10px',
                                            border: formErrors.patient_id ? '1.5px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            fontFamily: 'var(--font-family)',
                                            fontSize: '0.8rem',
                                            background: 'var(--card-bg)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            transition: 'all 0.2s ease',
                                            appearance: 'none',
                                            cursor: 'pointer'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--primary-color)';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border-color)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    >
                                        <option value="">-- Choose Patient --</option>
                                        {patients.length === 0 ? (
                                            <option value="" disabled>No patients found</option>
                                        ) : (
                                            patients.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} {p.phone ? `(${p.phone})` : ''}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    {patients.length === 0 && (
                                        <span style={{ fontSize: '0.7rem', color: 'var(--warning-color)', marginTop: '4px', display: 'block' }}>
                                            ⚠️ No patients found. Please add patients first.
                                        </span>
                                    )}
                                    {formErrors.patient_id && <span className="error-text" style={{ fontSize: '0.7rem', color: 'var(--danger-color)', display: 'block', marginTop: '4px' }}>{formErrors.patient_id}</span>}
                                </div>

                                {/* ===== DOCTOR SELECTION ===== */}
                                <div className="form-group" style={{ marginBottom: '0' }}>
                                    <label className="form-label" style={{
                                        display: 'block',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        <Stethoscope size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--secondary-color)' }} /> Doctor <span style={{ color: 'var(--danger-color)' }}>*</span>
                                    </label>
                                    <select
                                        name="doctor_id"
                                        className="hms-select"
                                        value={formData.doctor_id}
                                        onChange={handleFormChange}
                                        required
                                        style={{
                                            width: '100%',
                                            height: '38px',
                                            padding: '0 10px',
                                            border: formErrors.doctor_id ? '1.5px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            fontFamily: 'var(--font-family)',
                                            fontSize: '0.8rem',
                                            background: 'var(--card-bg)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            transition: 'all 0.2s ease',
                                            appearance: 'none',
                                            cursor: 'pointer'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--primary-color)';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border-color)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    >
                                        <option value="">-- Choose Doctor --</option>
                                        {doctors.length === 0 ? (
                                            <option value="" disabled>No doctors found</option>
                                        ) : (
                                            doctors.map(d => (
                                                <option key={d.id} value={d.id}>
                                                    Dr. {d.name} {d.specialization ? `(${d.specialization})` : ''}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    {doctors.length === 0 && (
                                        <span style={{ fontSize: '0.7rem', color: 'var(--warning-color)', marginTop: '4px', display: 'block' }}>
                                            ⚠️ No doctors found. Please add doctors first.
                                        </span>
                                    )}
                                    {formErrors.doctor_id && <span className="error-text" style={{ fontSize: '0.7rem', color: 'var(--danger-color)', display: 'block', marginTop: '4px' }}>{formErrors.doctor_id}</span>}
                                </div>

                                {/* ===== DATE & TIME ===== */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div className="form-group" style={{ marginBottom: '0' }}>
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.8rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}>
                                            <CalendarIcon size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--warning-color, #F59E0B)' }} /> Date <span style={{ color: 'var(--danger-color)' }}>*</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="appointment_date"
                                            value={formData.appointment_date}
                                            onChange={handleFormChange}
                                            min={new Date().toISOString().split('T')[0]}
                                            required
                                            style={{
                                                width: '100%',
                                                height: '38px',
                                                padding: '0 10px',
                                                border: formErrors.appointment_date ? '1.5px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                                borderRadius: '10px',
                                                fontSize: '0.8rem',
                                                fontFamily: 'var(--font-family)',
                                                background: 'var(--card-bg)',
                                                color: 'var(--text-primary)',
                                                outline: 'none',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = 'var(--primary-color)';
                                                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = 'var(--border-color)';
                                                e.target.style.boxShadow = 'none';
                                            }}
                                        />
                                        {formErrors.appointment_date && <span className="error-text" style={{ fontSize: '0.7rem', color: 'var(--danger-color)' }}>{formErrors.appointment_date}</span>}
                                    </div>

                                    <div className="form-group" style={{ marginBottom: '0' }}>
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.8rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}>
                                            <Clock size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--purple-color, #8B5CF6)' }} /> Time <span style={{ color: 'var(--danger-color)' }}>*</span>
                                        </label>
                                        <select
                                            name="time_slot"
                                            className="hms-select"
                                            value={formData.time_slot}
                                            onChange={handleFormChange}
                                            required
                                            style={{
                                                width: '100%',
                                                height: '38px',
                                                padding: '0 10px',
                                                border: formErrors.time_slot ? '1.5px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                                borderRadius: '10px',
                                                fontFamily: 'var(--font-family)',
                                                fontSize: '0.8rem',
                                                background: 'var(--card-bg)',
                                                color: 'var(--text-primary)',
                                                outline: 'none',
                                                transition: 'all 0.2s ease',
                                                appearance: 'none',
                                                cursor: 'pointer'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = 'var(--primary-color)';
                                                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = 'var(--border-color)';
                                                e.target.style.boxShadow = 'none';
                                            }}
                                        >
                                            <option value="">Select Time</option>
                                            {timeSlots.map(slot => (
                                                <option key={slot} value={slot}>{slot}</option>
                                            ))}
                                        </select>
                                        {formErrors.time_slot && <span className="error-text" style={{ fontSize: '0.7rem', color: 'var(--danger-color)' }}>{formErrors.time_slot}</span>}
                                    </div>
                                </div>

                                {/* ===== REASON ===== */}
                                <div className="form-group" style={{ marginBottom: '0' }}>
                                    <label className="form-label" style={{
                                        display: 'block',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        <FileText size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Reason
                                    </label>
                                    <input
                                        type="text"
                                        name="reason"
                                        value={formData.reason}
                                        onChange={handleFormChange}
                                        placeholder="e.g. General Checkup, Follow-up..."
                                        style={{
                                            width: '100%',
                                            height: '38px',
                                            padding: '0 10px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            fontSize: '0.8rem',
                                            fontFamily: 'var(--font-family)',
                                            background: 'var(--card-bg)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--primary-color)';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border-color)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                {/* ===== STATUS ===== */}
                                <div className="form-group" style={{ marginBottom: '0' }}>
                                    <label className="form-label" style={{
                                        display: 'block',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>Status</label>
                                    <select
                                        name="status"
                                        className="hms-select"
                                        value={formData.status}
                                        onChange={handleFormChange}
                                        style={{
                                            width: '100%',
                                            height: '38px',
                                            padding: '0 10px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            fontFamily: 'var(--font-family)',
                                            fontSize: '0.8rem',
                                            background: 'var(--card-bg)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            transition: 'all 0.2s ease',
                                            appearance: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {statusOptions.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="hms-modal-footer" style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '8px',
                                    padding: '12px 18px 0 0',
                                    borderTop: 'none',
                                    background: 'transparent'
                                }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddOpen(false)}
                                        style={{
                                            padding: '6px 16px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem',
                                            fontFamily: 'var(--font-family)',
                                            color: 'var(--text-secondary)',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.background = 'var(--hover-bg)';
                                            e.target.style.color = 'var(--text-primary)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.background = 'transparent';
                                            e.target.style.color = 'var(--text-secondary)';
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        onClick={handleAddSubmit}
                                        disabled={actionLoading}
                                        style={{
                                            padding: '6px 16px',
                                            border: 'none',
                                            borderRadius: '10px',
                                            background: 'var(--primary-color)',
                                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                                            fontSize: '0.8rem',
                                            fontFamily: 'var(--font-family)',
                                            color: 'white',
                                            fontWeight: 500,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            opacity: actionLoading ? 0.7 : 1,
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!actionLoading) {
                                                e.target.style.background = 'var(--primary-hover)';
                                                e.target.style.transform = 'translateY(-1px)';
                                                e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.25)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!actionLoading) {
                                                e.target.style.background = 'var(--primary-color)';
                                                e.target.style.transform = 'translateY(0)';
                                                e.target.style.boxShadow = 'none';
                                            }
                                        }}
                                    >
                                        <CalendarIcon size={14} />
                                        {actionLoading ? 'Booking...' : 'Book'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== EDIT APPOINTMENT MODAL ===== */}
            {isEditOpen && (
                <div className="hms-modal-backdrop" onClick={() => setIsEditOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{
                        maxWidth: '520px',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'var(--card-bg)',
                        borderRadius: '16px',
                        boxShadow: 'var(--shadow-xl)',
                        border: '1px solid var(--border-color)',
                        width: '100%',
                        margin: '16px'
                    }}>
                        <div className="hms-modal-header" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '14px 18px',
                            borderBottom: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            borderRadius: '16px 16px 0 0'
                        }}>
                            <h3 className="hms-modal-title" style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'var(--text-primary)'
                            }}>
                                <Edit2 size={18} style={{ color: 'var(--secondary-color)' }} />
                                Edit Appointment
                            </h3>
                            <button
                                onClick={() => setIsEditOpen(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)',
                                    padding: '4px',
                                    borderRadius: '6px',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'var(--hover-bg)';
                                    e.target.style.color = 'var(--danger-color)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'transparent';
                                    e.target.style.color = 'var(--text-secondary)';
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="hms-modal-body" style={{
                            padding: '18px',
                            overflowY: 'auto',
                            flex: 1
                        }}>
                            {errorMsg && (
                                <div className="alert alert-danger" style={{
                                    marginBottom: '12px',
                                    padding: '10px 14px',
                                    background: '#EF444415',
                                    border: '1px solid #EF444430',
                                    borderRadius: '8px',
                                    color: '#EF4444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <AlertCircle size={16} /> {errorMsg}
                                </div>
                            )}
                            {successMsg && (
                                <div className="alert alert-success" style={{
                                    marginBottom: '12px',
                                    padding: '10px 14px',
                                    background: '#22C55E15',
                                    border: '1px solid #22C55E30',
                                    borderRadius: '8px',
                                    color: '#16A34A',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <CheckCircle size={16} /> {successMsg}
                                </div>
                            )}
                            <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div className="form-group" style={{ marginBottom: '0' }}>
                                    <label className="form-label" style={{
                                        display: 'block',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        <User size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--primary-color)' }} /> Patient <span style={{ color: 'var(--danger-color)' }}>*</span>
                                    </label>
                                    <select
                                        name="patient_id"
                                        className="hms-select"
                                        value={formData.patient_id}
                                        onChange={handleFormChange}
                                        required
                                        style={{
                                            width: '100%',
                                            height: '38px',
                                            padding: '0 10px',
                                            border: formErrors.patient_id ? '1.5px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            fontFamily: 'var(--font-family)',
                                            fontSize: '0.8rem',
                                            background: 'var(--card-bg)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            transition: 'all 0.2s ease',
                                            appearance: 'none',
                                            cursor: 'pointer'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--primary-color)';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border-color)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    >
                                        <option value="">-- Choose Patient --</option>
                                        {patients.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} {p.phone ? `(${p.phone})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {formErrors.patient_id && <span className="error-text" style={{ fontSize: '0.7rem', color: 'var(--danger-color)' }}>{formErrors.patient_id}</span>}
                                </div>

                                <div className="form-group" style={{ marginBottom: '0' }}>
                                    <label className="form-label" style={{
                                        display: 'block',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        <Stethoscope size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--secondary-color)' }} /> Doctor <span style={{ color: 'var(--danger-color)' }}>*</span>
                                    </label>
                                    <select
                                        name="doctor_id"
                                        className="hms-select"
                                        value={formData.doctor_id}
                                        onChange={handleFormChange}
                                        required
                                        style={{
                                            width: '100%',
                                            height: '38px',
                                            padding: '0 10px',
                                            border: formErrors.doctor_id ? '1.5px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            fontFamily: 'var(--font-family)',
                                            fontSize: '0.8rem',
                                            background: 'var(--card-bg)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            transition: 'all 0.2s ease',
                                            appearance: 'none',
                                            cursor: 'pointer'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--primary-color)';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border-color)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    >
                                        <option value="">-- Choose Doctor --</option>
                                        {doctors.map(d => (
                                            <option key={d.id} value={d.id}>
                                                Dr. {d.name} {d.specialization ? `(${d.specialization})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {formErrors.doctor_id && <span className="error-text" style={{ fontSize: '0.7rem', color: 'var(--danger-color)' }}>{formErrors.doctor_id}</span>}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div className="form-group" style={{ marginBottom: '0' }}>
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.8rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}>
                                            <CalendarIcon size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--warning-color, #F59E0B)' }} /> Date <span style={{ color: 'var(--danger-color)' }}>*</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="appointment_date"
                                            value={formData.appointment_date}
                                            onChange={handleFormChange}
                                            required
                                            style={{
                                                width: '100%',
                                                height: '38px',
                                                padding: '0 10px',
                                                border: formErrors.appointment_date ? '1.5px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                                borderRadius: '10px',
                                                fontSize: '0.8rem',
                                                fontFamily: 'var(--font-family)',
                                                background: 'var(--card-bg)',
                                                color: 'var(--text-primary)',
                                                outline: 'none',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = 'var(--primary-color)';
                                                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = 'var(--border-color)';
                                                e.target.style.boxShadow = 'none';
                                            }}
                                        />
                                        {formErrors.appointment_date && <span className="error-text" style={{ fontSize: '0.7rem', color: 'var(--danger-color)' }}>{formErrors.appointment_date}</span>}
                                    </div>

                                    <div className="form-group" style={{ marginBottom: '0' }}>
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.8rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}>
                                            <Clock size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--purple-color, #8B5CF6)' }} /> Time <span style={{ color: 'var(--danger-color)' }}>*</span>
                                        </label>
                                        <select
                                            name="time_slot"
                                            className="hms-select"
                                            value={formData.time_slot}
                                            onChange={handleFormChange}
                                            required
                                            style={{
                                                width: '100%',
                                                height: '38px',
                                                padding: '0 10px',
                                                border: formErrors.time_slot ? '1.5px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                                borderRadius: '10px',
                                                fontFamily: 'var(--font-family)',
                                                fontSize: '0.8rem',
                                                background: 'var(--card-bg)',
                                                color: 'var(--text-primary)',
                                                outline: 'none',
                                                transition: 'all 0.2s ease',
                                                appearance: 'none',
                                                cursor: 'pointer'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = 'var(--primary-color)';
                                                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = 'var(--border-color)';
                                                e.target.style.boxShadow = 'none';
                                            }}
                                        >
                                            <option value="">Select Time</option>
                                            {timeSlots.map(slot => (
                                                <option key={slot} value={slot}>{slot}</option>
                                            ))}
                                        </select>
                                        {formErrors.time_slot && <span className="error-text" style={{ fontSize: '0.7rem', color: 'var(--danger-color)' }}>{formErrors.time_slot}</span>}
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: '0' }}>
                                    <label className="form-label" style={{
                                        display: 'block',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        <FileText size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Reason
                                    </label>
                                    <input
                                        type="text"
                                        name="reason"
                                        value={formData.reason}
                                        onChange={handleFormChange}
                                        placeholder="e.g. General Checkup, Follow-up..."
                                        style={{
                                            width: '100%',
                                            height: '38px',
                                            padding: '0 10px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            fontSize: '0.8rem',
                                            fontFamily: 'var(--font-family)',
                                            background: 'var(--card-bg)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--primary-color)';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border-color)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: '0' }}>
                                    <label className="form-label" style={{
                                        display: 'block',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>Status</label>
                                    <select
                                        name="status"
                                        className="hms-select"
                                        value={formData.status}
                                        onChange={handleFormChange}
                                        style={{
                                            width: '100%',
                                            height: '38px',
                                            padding: '0 10px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            fontFamily: 'var(--font-family)',
                                            fontSize: '0.8rem',
                                            background: 'var(--card-bg)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            transition: 'all 0.2s ease',
                                            appearance: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {statusOptions.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="hms-modal-footer" style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '8px',
                                    padding: '12px 18px 0 0',
                                    borderTop: 'none',
                                    background: 'transparent'
                                }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditOpen(false)}
                                        style={{
                                            padding: '6px 16px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem',
                                            fontFamily: 'var(--font-family)',
                                            color: 'var(--text-secondary)',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.background = 'var(--hover-bg)';
                                            e.target.style.color = 'var(--text-primary)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.background = 'transparent';
                                            e.target.style.color = 'var(--text-secondary)';
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        onClick={handleUpdateSubmit}
                                        disabled={actionLoading}
                                        style={{
                                            padding: '6px 16px',
                                            border: 'none',
                                            borderRadius: '10px',
                                            background: 'var(--primary-color)',
                                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                                            fontSize: '0.8rem',
                                            fontFamily: 'var(--font-family)',
                                            color: 'white',
                                            fontWeight: 500,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            opacity: actionLoading ? 0.7 : 1,
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!actionLoading) {
                                                e.target.style.background = 'var(--primary-hover)';
                                                e.target.style.transform = 'translateY(-1px)';
                                                e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.25)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!actionLoading) {
                                                e.target.style.background = 'var(--primary-color)';
                                                e.target.style.transform = 'translateY(0)';
                                                e.target.style.boxShadow = 'none';
                                            }
                                        }}
                                    >
                                        <Edit2 size={14} />
                                        {actionLoading ? 'Updating...' : 'Update'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== VIEW APPOINTMENT MODAL ===== */}
            {isViewOpen && selectedAppointment && (
                <div className="hms-modal-backdrop" onClick={() => setIsViewOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{
                        maxWidth: '480px',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'var(--card-bg)',
                        borderRadius: '16px',
                        boxShadow: 'var(--shadow-xl)',
                        border: '1px solid var(--border-color)',
                        width: '100%',
                        margin: '16px'
                    }}>
                        <div className="hms-modal-header" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '14px 18px',
                            borderBottom: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            borderRadius: '16px 16px 0 0'
                        }}>
                            <h3 className="hms-modal-title" style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'var(--text-primary)'
                            }}>
                                <CalendarIcon size={18} style={{ color: 'var(--primary-color)' }} />
                                Appointment Details
                            </h3>
                            <button
                                onClick={() => setIsViewOpen(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)',
                                    padding: '4px',
                                    borderRadius: '6px',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'var(--hover-bg)';
                                    e.target.style.color = 'var(--danger-color)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'transparent';
                                    e.target.style.color = 'var(--text-secondary)';
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="hms-modal-body" style={{
                            padding: '18px',
                            overflowY: 'auto',
                            flex: 1
                        }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '12px',
                                marginBottom: '16px'
                            }}>
                                <div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block', marginBottom: '2px' }}>
                                        <User size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--primary-color)' }} /> Patient
                                    </span>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedAppointment.patients?.name || 'Unknown'}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{selectedAppointment.patients?.phone || ''}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block', marginBottom: '2px' }}>
                                        <Stethoscope size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--secondary-color)' }} /> Doctor
                                    </span>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedAppointment.doctors?.name || 'Unknown'}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{selectedAppointment.doctors?.specialization || ''}</div>
                                </div>
                                <div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block', marginBottom: '2px' }}>
                                        <CalendarIcon size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--warning-color, #F59E0B)' }} /> Date
                                    </span>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{new Date(selectedAppointment.appointment_date).toLocaleDateString()}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block', marginBottom: '2px' }}>
                                        <Clock size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--purple-color, #8B5CF6)' }} /> Time
                                    </span>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedAppointment.time_slot}</div>
                                </div>
                            </div>

                            <div style={{
                                borderTop: '1px solid var(--border-color)',
                                paddingTop: '12px',
                                marginBottom: '12px'
                            }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block', marginBottom: '2px' }}>
                                    <FileText size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Reason
                                </span>
                                <div style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                                    {selectedAppointment.reason || 'No reason provided'}
                                </div>
                            </div>

                            <div style={{
                                borderTop: '1px solid var(--border-color)',
                                paddingTop: '12px'
                            }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block', marginBottom: '2px' }}>Status</span>
                                <div>{getStatusBadge(selectedAppointment.status)}</div>
                            </div>
                        </div>
                        <div className="hms-modal-footer" style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '8px',
                            padding: '12px 18px',
                            borderTop: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            borderRadius: '0 0 16px 16px'
                        }}>
                            <button
                                onClick={() => setIsViewOpen(false)}
                                style={{
                                    padding: '6px 16px',
                                    border: '1.5px solid var(--border-color)',
                                    borderRadius: '10px',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'var(--text-secondary)',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'var(--hover-bg)';
                                    e.target.style.color = 'var(--text-primary)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'transparent';
                                    e.target.style.color = 'var(--text-secondary)';
                                }}
                            >
                                Close
                            </button>
                            {selectedAppointment.status !== 'cancelled' && selectedAppointment.status !== 'completed' && (
                                <>
                                    <button
                                        onClick={() => {
                                            setIsViewOpen(false);
                                            openEditModal(selectedAppointment);
                                        }}
                                        style={{
                                            padding: '6px 16px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem',
                                            fontFamily: 'var(--font-family)',
                                            color: 'var(--secondary-color)',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.background = 'rgba(34, 197, 94, 0.04)';
                                            e.target.style.borderColor = 'var(--secondary-color)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.background = 'transparent';
                                            e.target.style.borderColor = 'var(--border-color)';
                                        }}
                                    >
                                        <Edit2 size={14} /> Edit
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsViewOpen(false);
                                            openDeleteModal(selectedAppointment);
                                        }}
                                        style={{
                                            padding: '6px 16px',
                                            border: 'none',
                                            borderRadius: '10px',
                                            background: 'var(--danger-color)',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem',
                                            fontFamily: 'var(--font-family)',
                                            color: 'white',
                                            fontWeight: 500,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.background = 'var(--danger-hover)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.background = 'var(--danger-color)';
                                        }}
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== DELETE CONFIRMATION MODAL ===== */}
            {isDeleteOpen && (
                <div className="hms-modal-backdrop" onClick={() => setIsDeleteOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{
                        maxWidth: '400px',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'var(--card-bg)',
                        borderRadius: '16px',
                        boxShadow: 'var(--shadow-xl)',
                        border: '1px solid var(--border-color)',
                        width: '100%',
                        margin: '16px'
                    }}>
                        <div className="hms-modal-header" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '14px 18px',
                            borderBottom: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            borderRadius: '16px 16px 0 0'
                        }}>
                            <h3 className="hms-modal-title" style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'var(--text-primary)'
                            }}>
                                <Trash2 size={18} style={{ color: 'var(--danger-color)' }} />
                                Delete Appointment
                            </h3>
                            <button
                                onClick={() => setIsDeleteOpen(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)',
                                    padding: '4px',
                                    borderRadius: '6px',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'var(--hover-bg)';
                                    e.target.style.color = 'var(--danger-color)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'transparent';
                                    e.target.style.color = 'var(--text-secondary)';
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="hms-modal-body" style={{
                            padding: '18px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚠️</div>
                            <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
                                Are you sure you want to delete this appointment?
                            </p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                Patient: <strong>{selectedAppointment?.patients?.name || 'Unknown'}</strong>
                                <br />
                                Date: <strong>{selectedAppointment?.appointment_date}</strong>
                            </p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '8px' }}>
                                This action cannot be undone.
                            </p>
                        </div>
                        <div className="hms-modal-footer" style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '8px',
                            padding: '12px 18px',
                            borderTop: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            borderRadius: '0 0 16px 16px'
                        }}>
                            <button
                                onClick={() => setIsDeleteOpen(false)}
                                style={{
                                    padding: '6px 16px',
                                    border: '1.5px solid var(--border-color)',
                                    borderRadius: '10px',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'var(--text-secondary)',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'var(--hover-bg)';
                                    e.target.style.color = 'var(--text-primary)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'transparent';
                                    e.target.style.color = 'var(--text-secondary)';
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteSubmit}
                                disabled={actionLoading}
                                style={{
                                    padding: '6px 16px',
                                    border: 'none',
                                    borderRadius: '10px',
                                    background: 'var(--danger-color)',
                                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'white',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    opacity: actionLoading ? 0.7 : 1,
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    if (!actionLoading) {
                                        e.target.style.background = 'var(--danger-hover)';
                                        e.target.style.transform = 'translateY(-1px)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.25)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!actionLoading) {
                                        e.target.style.background = 'var(--danger-color)';
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = 'none';
                                    }
                                }}
                            >
                                <Trash2 size={14} />
                                {actionLoading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default Appointments;