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
    ArrowLeft, RefreshCw, Save, Phone, Mail, MapPin,
    DollarSign, ClipboardList, Clock as TimeIcon,
    Scissors, Heart, Hospital, Home, PhoneCall,
    FileCheck, UserCheck, MessageSquare
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

    // ===== TOAST NOTIFICATIONS =====
    const [toast, setToast] = useState({
        show: false,
        message: '',
        type: 'success'
    });

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
        status: 'scheduled',
        duration: '30',
        appointment_type: 'general',
        priority: 'normal',
        notes: '',
        symptoms: '',
        diagnosis: '',
        prescription: '',
        follow_up_date: '',
        fee: '',
        payment_status: 'pending',
        payment_method: 'cash',
        department: '',
        room_number: '',
        emergency_contact: '',
        emergency_phone: '',
        special_instructions: '',
        medical_history: '',
        allergies: '',
        blood_pressure: '',
        heart_rate: '',
        temperature: '',
        weight: '',
        height: '',
        bmi: '',
        visit_type: 'in-person'
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
    const appointmentTypes = ['general', 'consultation', 'follow-up', 'emergency', 'surgery', 'checkup', 'vaccination', 'lab-test'];
    const priorityOptions = ['low', 'normal', 'high', 'urgent', 'emergency'];
    const paymentStatusOptions = ['pending', 'paid', 'partial', 'insurance', 'waived'];
    const paymentMethodOptions = ['cash', 'card', 'insurance', 'online', 'bank-transfer'];
    const visitTypeOptions = ['in-person', 'telemedicine', 'home-visit', 'video-call', 'phone-consultation'];
    const departmentOptions = ['general', 'cardiology', 'neurology', 'orthopedics', 'pediatrics', 'dermatology', 'ophthalmology', 'ent', 'gynecology', 'urology', 'psychiatry', 'dentistry'];

    const timeSlots = [
        '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
        '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
        '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
        '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
        '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
        '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM',
        '08:00 PM'
    ];

    const durationOptions = ['15', '20', '30', '45', '60', '90', '120'];

    // ===== TOAST FUNCTIONS =====
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'success' });
        }, 5000);
    };

    const hideToast = () => {
        setToast({ show: false, message: '', type: 'success' });
    };

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

    // ===== LOAD DATA =====
    const loadData = async () => {
        setLoading(true);
        setErrorMsg('');
        console.log('🔍 Loading data...');

        try {
            // ===== LOAD PATIENTS =====
            console.log('🔍 Loading patients...');
            const { data: patientsData, error: patientsError } = await supabase
                .from('patients')
                .select('id, name, phone, email, address, date_of_birth, gender')
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
                .select('id, name, specialization, department, phone, email')
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
                        patients: patient || { name: 'Unknown Patient', phone: '', email: '', address: '' },
                        doctors: doctor || { name: 'Unknown Doctor', specialization: '', department: '', phone: '', email: '' }
                    };
                });

                let filteredAppointments = enrichedAppointments;
                if (searchQuery && searchQuery.trim() !== '') {
                    const query = searchQuery.toLowerCase().trim();
                    filteredAppointments = enrichedAppointments.filter(app =>
                        (app.patients?.name || '').toLowerCase().includes(query) ||
                        (app.doctors?.name || '').toLowerCase().includes(query) ||
                        (app.reason || '').toLowerCase().includes(query)
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
        if (!formData.appointment_type) errors.appointment_type = 'Please select appointment type';
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
            status: 'scheduled',
            duration: '30',
            appointment_type: 'general',
            priority: 'normal',
            notes: '',
            symptoms: '',
            diagnosis: '',
            prescription: '',
            follow_up_date: '',
            fee: '',
            payment_status: 'pending',
            payment_method: 'cash',
            department: '',
            room_number: '',
            emergency_contact: '',
            emergency_phone: '',
            special_instructions: '',
            medical_history: '',
            allergies: '',
            blood_pressure: '',
            heart_rate: '',
            temperature: '',
            weight: '',
            height: '',
            bmi: '',
            visit_type: 'in-person'
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
            status: app.status || 'scheduled',
            duration: app.duration || '30',
            appointment_type: app.appointment_type || 'general',
            priority: app.priority || 'normal',
            notes: app.notes || '',
            symptoms: app.symptoms || '',
            diagnosis: app.diagnosis || '',
            prescription: app.prescription || '',
            follow_up_date: app.follow_up_date || '',
            fee: app.fee || '',
            payment_status: app.payment_status || 'pending',
            payment_method: app.payment_method || 'cash',
            department: app.department || '',
            room_number: app.room_number || '',
            emergency_contact: app.emergency_contact || '',
            emergency_phone: app.emergency_phone || '',
            special_instructions: app.special_instructions || '',
            medical_history: app.medical_history || '',
            allergies: app.allergies || '',
            blood_pressure: app.blood_pressure || '',
            heart_rate: app.heart_rate || '',
            temperature: app.temperature || '',
            weight: app.weight || '',
            height: app.height || '',
            bmi: app.bmi || '',
            visit_type: app.visit_type || 'in-person'
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

    // ===== ADD APPOINTMENT =====
    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setActionLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            console.log('📝 Booking appointment with data:', formData);

            // Calculate BMI if weight and height are provided
            let bmi = '';
            if (formData.weight && formData.height) {
                const heightInMeters = parseFloat(formData.height) / 100;
                const weightInKg = parseFloat(formData.weight);
                if (heightInMeters > 0 && weightInKg > 0) {
                    bmi = (weightInKg / (heightInMeters * heightInMeters)).toFixed(1);
                }
            }

            const { data, error } = await supabase
                .from('appointments')
                .insert([{
                    patient_id: formData.patient_id,
                    doctor_id: formData.doctor_id,
                    appointment_date: formData.appointment_date,
                    time_slot: formData.time_slot,
                    reason: formData.reason || null,
                    status: formData.status || 'scheduled',
                    duration: formData.duration || '30',
                    appointment_type: formData.appointment_type || 'general',
                    priority: formData.priority || 'normal',
                    notes: formData.notes || null,
                    symptoms: formData.symptoms || null,
                    diagnosis: formData.diagnosis || null,
                    prescription: formData.prescription || null,
                    follow_up_date: formData.follow_up_date || null,
                    fee: formData.fee || null,
                    payment_status: formData.payment_status || 'pending',
                    payment_method: formData.payment_method || 'cash',
                    department: formData.department || null,
                    room_number: formData.room_number || null,
                    emergency_contact: formData.emergency_contact || null,
                    emergency_phone: formData.emergency_phone || null,
                    special_instructions: formData.special_instructions || null,
                    medical_history: formData.medical_history || null,
                    allergies: formData.allergies || null,
                    blood_pressure: formData.blood_pressure || null,
                    heart_rate: formData.heart_rate || null,
                    temperature: formData.temperature || null,
                    weight: formData.weight || null,
                    height: formData.height || null,
                    bmi: bmi || null,
                    visit_type: formData.visit_type || 'in-person',
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) {
                console.error('❌ Insert Error:', error);
                setErrorMsg('Failed to book appointment: ' + error.message);
                showToast('Failed to book appointment: ' + error.message, 'error');
                return;
            }

            console.log('✅ Appointment booked:', data);
            const patientName = patients.find(p => p.id === formData.patient_id)?.name || 'Patient';
            const doctorName = doctors.find(d => d.id === formData.doctor_id)?.name || 'Doctor';

            const successMessage = `✅ Appointment booked successfully for ${patientName} with Dr. ${doctorName}!`;
            setSuccessMsg(successMessage);
            showToast(successMessage, 'success');
            setIsAddOpen(false);

            await loadData();

            window.dispatchEvent(new Event('appointmentAdded'));
            setTimeout(() => {
                window.dispatchEvent(new Event('appointmentChanged'));
            }, 500);

        } catch (err) {
            console.error('❌ Error:', err);
            setErrorMsg(err.message || 'Failed to book appointment.');
            showToast('Failed to book appointment: ' + err.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // ===== UPDATE APPOINTMENT =====
    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setActionLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            // Calculate BMI if weight and height are provided
            let bmi = '';
            if (formData.weight && formData.height) {
                const heightInMeters = parseFloat(formData.height) / 100;
                const weightInKg = parseFloat(formData.weight);
                if (heightInMeters > 0 && weightInKg > 0) {
                    bmi = (weightInKg / (heightInMeters * heightInMeters)).toFixed(1);
                }
            }

            const { error } = await supabase
                .from('appointments')
                .update({
                    patient_id: formData.patient_id,
                    doctor_id: formData.doctor_id,
                    appointment_date: formData.appointment_date,
                    time_slot: formData.time_slot,
                    reason: formData.reason || null,
                    status: formData.status || 'scheduled',
                    duration: formData.duration || '30',
                    appointment_type: formData.appointment_type || 'general',
                    priority: formData.priority || 'normal',
                    notes: formData.notes || null,
                    symptoms: formData.symptoms || null,
                    diagnosis: formData.diagnosis || null,
                    prescription: formData.prescription || null,
                    follow_up_date: formData.follow_up_date || null,
                    fee: formData.fee || null,
                    payment_status: formData.payment_status || 'pending',
                    payment_method: formData.payment_method || 'cash',
                    department: formData.department || null,
                    room_number: formData.room_number || null,
                    emergency_contact: formData.emergency_contact || null,
                    emergency_phone: formData.emergency_phone || null,
                    special_instructions: formData.special_instructions || null,
                    medical_history: formData.medical_history || null,
                    allergies: formData.allergies || null,
                    blood_pressure: formData.blood_pressure || null,
                    heart_rate: formData.heart_rate || null,
                    temperature: formData.temperature || null,
                    weight: formData.weight || null,
                    height: formData.height || null,
                    bmi: bmi || null,
                    visit_type: formData.visit_type || 'in-person',
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedAppointment.id);

            if (error) {
                console.error('Update Error:', error);
                setErrorMsg('Failed to update appointment: ' + error.message);
                showToast('Failed to update appointment: ' + error.message, 'error');
                return;
            }

            const patientName = patients.find(p => p.id === formData.patient_id)?.name || 'Patient';
            const doctorName = doctors.find(d => d.id === formData.doctor_id)?.name || 'Doctor';

            const successMessage = `✅ Appointment updated successfully for ${patientName} with Dr. ${doctorName}!`;
            setSuccessMsg(successMessage);
            showToast(successMessage, 'success');
            setIsEditOpen(false);
            await loadData();
            window.dispatchEvent(new Event('appointmentAdded'));
        } catch (err) {
            setErrorMsg(err.message || 'Failed to update appointment.');
            showToast('Failed to update appointment: ' + err.message, 'error');
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
                showToast('Failed to delete appointment: ' + error.message, 'error');
                return;
            }

            setIsDeleteOpen(false);
            await loadData();
            window.dispatchEvent(new Event('appointmentAdded'));
            const patientName = selectedAppointment?.patients?.name || 'Patient';
            const successMessage = `✅ Appointment for ${patientName} deleted successfully!`;
            setSuccessMsg(successMessage);
            showToast(successMessage, 'success');
        } catch (err) {
            setErrorMsg(err.message || 'Failed to delete appointment.');
            showToast('Failed to delete appointment: ' + err.message, 'error');
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
            {/* ===== TOAST NOTIFICATION ===== */}
            {toast.show && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: 10000,
                    animation: 'slideInRight 0.5s ease-out',
                    maxWidth: '450px',
                    width: '100%'
                }}>
                    <div style={{
                        padding: '16px 20px',
                        borderRadius: '12px',
                        background: toast.type === 'success' ? '#22C55E' : toast.type === 'error' ? '#EF4444' : '#3B82F6',
                        color: 'white',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        {toast.type === 'success' && <CheckCircle size={24} />}
                        {toast.type === 'error' && <XCircle size={24} />}
                        {toast.type === 'info' && <AlertCircle size={24} />}
                        <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500 }}>
                            {toast.message}
                        </div>
                        <button
                            onClick={hideToast}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                padding: '4px',
                                opacity: 0.8,
                                transition: 'opacity 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.opacity = '1'}
                            onMouseLeave={(e) => e.target.style.opacity = '0.8'}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}

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

            {/* ===== SUCCESS MESSAGE BANNER ===== */}
            {successMsg && (
                <div style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: '#22C55E15',
                    border: '1px solid #22C55E30',
                    color: '#16A34A',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <CheckCircle size={20} />
                    <span style={{ fontSize: '0.9rem' }}>{successMsg}</span>
                    <button
                        onClick={() => setSuccessMsg('')}
                        style={{
                            marginLeft: 'auto',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#16A34A'
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* ===== ERROR MESSAGE BANNER ===== */}
            {errorMsg && (
                <div style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: '#EF444415',
                    border: '1px solid #EF444430',
                    color: '#EF4444',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <AlertCircle size={20} />
                    <span style={{ fontSize: '0.9rem' }}>{errorMsg}</span>
                    <button
                        onClick={() => setErrorMsg('')}
                        style={{
                            marginLeft: 'auto',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#EF4444'
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

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
                        maxWidth: '800px',
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
                            borderRadius: '16px 16px 0 0',
                            flexShrink: 0
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
                            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {/* ===== SECTION 1: BASIC INFO ===== */}
                                <div style={{
                                    background: 'var(--bg-primary)',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <h4 style={{
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                        margin: '0 0 10px 0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <User size={14} style={{ color: 'var(--primary-color)' }} />
                                        Basic Information
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <label className="form-label" style={{
                                                display: 'block',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Patient <span style={{ color: 'var(--danger-color)' }}>*</span>
                                            </label>
                                            <select
                                                name="patient_id"
                                                className="hms-select"
                                                value={formData.patient_id}
                                                onChange={handleFormChange}
                                                required
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: formErrors.patient_id ? '1.5px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontFamily: 'var(--font-family)',
                                                    fontSize: '0.75rem',
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
                                            {formErrors.patient_id && <span className="error-text" style={{ fontSize: '0.65rem', color: 'var(--danger-color)', display: 'block', marginTop: '2px' }}>{formErrors.patient_id}</span>}
                                        </div>

                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <label className="form-label" style={{
                                                display: 'block',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Doctor <span style={{ color: 'var(--danger-color)' }}>*</span>
                                            </label>
                                            <select
                                                name="doctor_id"
                                                className="hms-select"
                                                value={formData.doctor_id}
                                                onChange={handleFormChange}
                                                required
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: formErrors.doctor_id ? '1.5px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontFamily: 'var(--font-family)',
                                                    fontSize: '0.75rem',
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
                                            {formErrors.doctor_id && <span className="error-text" style={{ fontSize: '0.65rem', color: 'var(--danger-color)', display: 'block', marginTop: '2px' }}>{formErrors.doctor_id}</span>}
                                        </div>

                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <label className="form-label" style={{
                                                display: 'block',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Department
                                            </label>
                                            <select
                                                name="department"
                                                className="hms-select"
                                                value={formData.department}
                                                onChange={handleFormChange}
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontFamily: 'var(--font-family)',
                                                    fontSize: '0.75rem',
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
                                                <option value="">-- Select Department --</option>
                                                {departmentOptions.map(dept => (
                                                    <option key={dept} value={dept}>{dept.charAt(0).toUpperCase() + dept.slice(1)}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <label className="form-label" style={{
                                                display: 'block',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Appointment Type <span style={{ color: 'var(--danger-color)' }}>*</span>
                                            </label>
                                            <select
                                                name="appointment_type"
                                                className="hms-select"
                                                value={formData.appointment_type}
                                                onChange={handleFormChange}
                                                required
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: formErrors.appointment_type ? '1.5px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontFamily: 'var(--font-family)',
                                                    fontSize: '0.75rem',
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
                                                <option value="">-- Select Type --</option>
                                                {appointmentTypes.map(type => (
                                                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                                                ))}
                                            </select>
                                            {formErrors.appointment_type && <span className="error-text" style={{ fontSize: '0.65rem', color: 'var(--danger-color)', display: 'block', marginTop: '2px' }}>{formErrors.appointment_type}</span>}
                                        </div>

                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <label className="form-label" style={{
                                                display: 'block',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Visit Type
                                            </label>
                                            <select
                                                name="visit_type"
                                                className="hms-select"
                                                value={formData.visit_type}
                                                onChange={handleFormChange}
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontFamily: 'var(--font-family)',
                                                    fontSize: '0.75rem',
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
                                                {visitTypeOptions.map(type => (
                                                    <option key={type} value={type}>{type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <label className="form-label" style={{
                                                display: 'block',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Priority
                                            </label>
                                            <select
                                                name="priority"
                                                className="hms-select"
                                                value={formData.priority}
                                                onChange={handleFormChange}
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontFamily: 'var(--font-family)',
                                                    fontSize: '0.75rem',
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
                                                {priorityOptions.map(p => (
                                                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <label className="form-label" style={{
                                                display: 'block',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Room Number
                                            </label>
                                            <input
                                                type="text"
                                                name="room_number"
                                                value={formData.room_number}
                                                onChange={handleFormChange}
                                                placeholder="e.g. 101"
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
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
                                    </div>
                                </div>

                                {/* ===== SECTION 2: DATE & TIME ===== */}
                                <div style={{
                                    background: 'var(--bg-primary)',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <h4 style={{
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                        margin: '0 0 10px 0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <Calendar size={14} style={{ color: 'var(--warning-color, #F59E0B)' }} />
                                        Date & Time
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <label className="form-label" style={{
                                                display: 'block',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Date <span style={{ color: 'var(--danger-color)' }}>*</span>
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
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: formErrors.appointment_date ? '1.5px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
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
                                            {formErrors.appointment_date && <span className="error-text" style={{ fontSize: '0.65rem', color: 'var(--danger-color)', display: 'block', marginTop: '2px' }}>{formErrors.appointment_date}</span>}
                                        </div>

                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <label className="form-label" style={{
                                                display: 'block',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Time <span style={{ color: 'var(--danger-color)' }}>*</span>
                                            </label>
                                            <select
                                                name="time_slot"
                                                className="hms-select"
                                                value={formData.time_slot}
                                                onChange={handleFormChange}
                                                required
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: formErrors.time_slot ? '1.5px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontFamily: 'var(--font-family)',
                                                    fontSize: '0.75rem',
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
                                            {formErrors.time_slot && <span className="error-text" style={{ fontSize: '0.65rem', color: 'var(--danger-color)', display: 'block', marginTop: '2px' }}>{formErrors.time_slot}</span>}
                                        </div>

                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <label className="form-label" style={{
                                                display: 'block',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Duration (minutes)
                                            </label>
                                            <select
                                                name="duration"
                                                className="hms-select"
                                                value={formData.duration}
                                                onChange={handleFormChange}
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontFamily: 'var(--font-family)',
                                                    fontSize: '0.75rem',
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
                                                {durationOptions.map(d => (
                                                    <option key={d} value={d}>{d} min</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* ===== SECTION 3: MEDICAL INFO ===== */}
                                <div style={{
                                    background: 'var(--bg-primary)',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <h4 style={{
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                        margin: '0 0 10px 0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <Heart size={14} style={{ color: 'var(--danger-color)' }} />
                                        Medical Information
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <label className="form-label" style={{
                                                display: 'block',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Reason <span style={{ color: 'var(--danger-color)' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="reason"
                                                value={formData.reason}
                                                onChange={handleFormChange}
                                                placeholder="e.g. General Checkup, Follow-up..."
                                                required
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
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
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Symptoms
                                            </label>
                                            <input
                                                type="text"
                                                name="symptoms"
                                                value={formData.symptoms}
                                                onChange={handleFormChange}
                                                placeholder="e.g. Fever, Headache..."
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
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
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Medical History
                                            </label>
                                            <textarea
                                                name="medical_history"
                                                value={formData.medical_history}
                                                onChange={handleFormChange}
                                                placeholder="Previous conditions, surgeries..."
                                                rows="2"
                                                style={{
                                                    width: '100%',
                                                    padding: '6px 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
                                                    fontFamily: 'var(--font-family)',
                                                    background: 'var(--card-bg)',
                                                    color: 'var(--text-primary)',
                                                    outline: 'none',
                                                    transition: 'all 0.2s ease',
                                                    resize: 'vertical',
                                                    minHeight: '50px'
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
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Allergies
                                            </label>
                                            <input
                                                type="text"
                                                name="allergies"
                                                value={formData.allergies}
                                                onChange={handleFormChange}
                                                placeholder="e.g. Penicillin, Dust..."
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
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
                                    </div>
                                </div>

                                {/* ===== SECTION 4: VITAL SIGNS ===== */}
                                <div style={{
                                    background: 'var(--bg-primary)',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <h4 style={{
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                        margin: '0 0 10px 0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <Activity size={14} style={{ color: 'var(--purple-color, #8B5CF6)' }} />
                                        Vital Signs
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <label className="form-label" style={{
                                                display: 'block',
                                                fontSize: '0.65rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                BP (mmHg)
                                            </label>
                                            <input
                                                type="text"
                                                name="blood_pressure"
                                                value={formData.blood_pressure}
                                                onChange={handleFormChange}
                                                placeholder="120/80"
                                                style={{
                                                    width: '100%',
                                                    height: '32px',
                                                    padding: '0 6px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '6px',
                                                    fontSize: '0.7rem',
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
                                                fontSize: '0.65rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                HR (bpm)
                                            </label>
                                            <input
                                                type="text"
                                                name="heart_rate"
                                                value={formData.heart_rate}
                                                onChange={handleFormChange}
                                                placeholder="72"
                                                style={{
                                                    width: '100%',
                                                    height: '32px',
                                                    padding: '0 6px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '6px',
                                                    fontSize: '0.7rem',
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
                                                fontSize: '0.65rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Temp (°C)
                                            </label>
                                            <input
                                                type="text"
                                                name="temperature"
                                                value={formData.temperature}
                                                onChange={handleFormChange}
                                                placeholder="36.5"
                                                style={{
                                                    width: '100%',
                                                    height: '32px',
                                                    padding: '0 6px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '6px',
                                                    fontSize: '0.7rem',
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
                                                fontSize: '0.65rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Weight (kg)
                                            </label>
                                            <input
                                                type="text"
                                                name="weight"
                                                value={formData.weight}
                                                onChange={handleFormChange}
                                                placeholder="70"
                                                style={{
                                                    width: '100%',
                                                    height: '32px',
                                                    padding: '0 6px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '6px',
                                                    fontSize: '0.7rem',
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
                                                fontSize: '0.65rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Height (cm)
                                            </label>
                                            <input
                                                type="text"
                                                name="height"
                                                value={formData.height}
                                                onChange={handleFormChange}
                                                placeholder="175"
                                                style={{
                                                    width: '100%',
                                                    height: '32px',
                                                    padding: '0 6px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '6px',
                                                    fontSize: '0.7rem',
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
                                                fontSize: '0.65rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                BMI
                                            </label>
                                            <input
                                                type="text"
                                                name="bmi"
                                                value={formData.bmi}
                                                onChange={handleFormChange}
                                                placeholder="Auto-calculated"
                                                style={{
                                                    width: '100%',
                                                    height: '32px',
                                                    padding: '0 6px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '6px',
                                                    fontSize: '0.7rem',
                                                    fontFamily: 'var(--font-family)',
                                                    background: 'var(--bg-primary)',
                                                    color: 'var(--text-primary)',
                                                    outline: 'none',
                                                    transition: 'all 0.2s ease',
                                                    cursor: 'not-allowed'
                                                }}
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ===== SECTION 5: PAYMENT & BILLING ===== */}
                                <div style={{
                                    background: 'var(--bg-primary)',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <h4 style={{
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                        margin: '0 0 10px 0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <DollarSign size={14} style={{ color: 'var(--success-color, #22C55E)' }} />
                                        Payment & Billing
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <label className="form-label" style={{
                                                display: 'block',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Fee ($)
                                            </label>
                                            <input
                                                type="text"
                                                name="fee"
                                                value={formData.fee}
                                                onChange={handleFormChange}
                                                placeholder="0.00"
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
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
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Payment Status
                                            </label>
                                            <select
                                                name="payment_status"
                                                className="hms-select"
                                                value={formData.payment_status}
                                                onChange={handleFormChange}
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontFamily: 'var(--font-family)',
                                                    fontSize: '0.75rem',
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
                                                {paymentStatusOptions.map(p => (
                                                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <label className="form-label" style={{
                                                display: 'block',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Payment Method
                                            </label>
                                            <select
                                                name="payment_method"
                                                className="hms-select"
                                                value={formData.payment_method}
                                                onChange={handleFormChange}
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontFamily: 'var(--font-family)',
                                                    fontSize: '0.75rem',
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
                                                {paymentMethodOptions.map(p => (
                                                    <option key={p} value={p}>{p.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* ===== SECTION 6: ADDITIONAL INFO ===== */}
                                <div style={{
                                    background: 'var(--bg-primary)',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <h4 style={{
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                        margin: '0 0 10px 0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <ClipboardList size={14} style={{ color: 'var(--teal-color, #14B8A6)' }} />
                                        Additional Information
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <label className="form-label" style={{
                                                display: 'block',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Notes
                                            </label>
                                            <textarea
                                                name="notes"
                                                value={formData.notes}
                                                onChange={handleFormChange}
                                                placeholder="Additional notes about the appointment..."
                                                rows="3"
                                                style={{
                                                    width: '100%',
                                                    padding: '6px 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
                                                    fontFamily: 'var(--font-family)',
                                                    background: 'var(--card-bg)',
                                                    color: 'var(--text-primary)',
                                                    outline: 'none',
                                                    transition: 'all 0.2s ease',
                                                    resize: 'vertical',
                                                    minHeight: '60px'
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
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Special Instructions
                                            </label>
                                            <textarea
                                                name="special_instructions"
                                                value={formData.special_instructions}
                                                onChange={handleFormChange}
                                                placeholder="Special instructions for patient..."
                                                rows="3"
                                                style={{
                                                    width: '100%',
                                                    padding: '6px 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
                                                    fontFamily: 'var(--font-family)',
                                                    background: 'var(--card-bg)',
                                                    color: 'var(--text-primary)',
                                                    outline: 'none',
                                                    transition: 'all 0.2s ease',
                                                    resize: 'vertical',
                                                    minHeight: '60px'
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
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Emergency Contact
                                            </label>
                                            <input
                                                type="text"
                                                name="emergency_contact"
                                                value={formData.emergency_contact}
                                                onChange={handleFormChange}
                                                placeholder="Full name"
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
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
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Emergency Phone
                                            </label>
                                            <input
                                                type="text"
                                                name="emergency_phone"
                                                value={formData.emergency_phone}
                                                onChange={handleFormChange}
                                                placeholder="Phone number"
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
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
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Follow-up Date
                                            </label>
                                            <input
                                                type="date"
                                                name="follow_up_date"
                                                value={formData.follow_up_date}
                                                onChange={handleFormChange}
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
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
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Status
                                            </label>
                                            <select
                                                name="status"
                                                className="hms-select"
                                                value={formData.status}
                                                onChange={handleFormChange}
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontFamily: 'var(--font-family)',
                                                    fontSize: '0.75rem',
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
                                                {statusOptions.map(s => (
                                                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="hms-modal-footer" style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '8px',
                                    padding: '12px 0 0 0',
                                    borderTop: '1px solid var(--border-color)',
                                    background: 'transparent',
                                    marginTop: '4px',
                                    flexShrink: 0
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
                        maxWidth: '800px',
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
                            borderRadius: '16px 16px 0 0',
                            flexShrink: 0
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
                            <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {/* ===== SECTION 1: BASIC INFO ===== */}
                                <div style={{
                                    background: 'var(--bg-primary)',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <h4 style={{
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                        margin: '0 0 10px 0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <User size={14} style={{ color: 'var(--primary-color)' }} />
                                        Basic Information
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <label className="form-label" style={{
                                                display: 'block',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Patient <span style={{ color: 'var(--danger-color)' }}>*</span>
                                            </label>
                                            <select
                                                name="patient_id"
                                                className="hms-select"
                                                value={formData.patient_id}
                                                onChange={handleFormChange}
                                                required
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: formErrors.patient_id ? '1.5px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontFamily: 'var(--font-family)',
                                                    fontSize: '0.75rem',
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
                                            {formErrors.patient_id && <span className="error-text" style={{ fontSize: '0.65rem', color: 'var(--danger-color)', display: 'block', marginTop: '2px' }}>{formErrors.patient_id}</span>}
                                        </div>

                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <label className="form-label" style={{
                                                display: 'block',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Doctor <span style={{ color: 'var(--danger-color)' }}>*</span>
                                            </label>
                                            <select
                                                name="doctor_id"
                                                className="hms-select"
                                                value={formData.doctor_id}
                                                onChange={handleFormChange}
                                                required
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: formErrors.doctor_id ? '1.5px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontFamily: 'var(--font-family)',
                                                    fontSize: '0.75rem',
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
                                            {formErrors.doctor_id && <span className="error-text" style={{ fontSize: '0.65rem', color: 'var(--danger-color)', display: 'block', marginTop: '2px' }}>{formErrors.doctor_id}</span>}
                                        </div>

                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <label className="form-label" style={{
                                                display: 'block',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Department
                                            </label>
                                            <select
                                                name="department"
                                                className="hms-select"
                                                value={formData.department}
                                                onChange={handleFormChange}
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontFamily: 'var(--font-family)',
                                                    fontSize: '0.75rem',
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
                                                <option value="">-- Select Department --</option>
                                                {departmentOptions.map(dept => (
                                                    <option key={dept} value={dept}>{dept.charAt(0).toUpperCase() + dept.slice(1)}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <label className="form-label" style={{
                                                display: 'block',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Appointment Type <span style={{ color: 'var(--danger-color)' }}>*</span>
                                            </label>
                                            <select
                                                name="appointment_type"
                                                className="hms-select"
                                                value={formData.appointment_type}
                                                onChange={handleFormChange}
                                                required
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: formErrors.appointment_type ? '1.5px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontFamily: 'var(--font-family)',
                                                    fontSize: '0.75rem',
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
                                                <option value="">-- Select Type --</option>
                                                {appointmentTypes.map(type => (
                                                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                                                ))}
                                            </select>
                                            {formErrors.appointment_type && <span className="error-text" style={{ fontSize: '0.65rem', color: 'var(--danger-color)', display: 'block', marginTop: '2px' }}>{formErrors.appointment_type}</span>}
                                        </div>

                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <label className="form-label" style={{
                                                display: 'block',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Visit Type
                                            </label>
                                            <select
                                                name="visit_type"
                                                className="hms-select"
                                                value={formData.visit_type}
                                                onChange={handleFormChange}
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontFamily: 'var(--font-family)',
                                                    fontSize: '0.75rem',
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
                                                {visitTypeOptions.map(type => (
                                                    <option key={type} value={type}>{type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <label className="form-label" style={{
                                                display: 'block',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Priority
                                            </label>
                                            <select
                                                name="priority"
                                                className="hms-select"
                                                value={formData.priority}
                                                onChange={handleFormChange}
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontFamily: 'var(--font-family)',
                                                    fontSize: '0.75rem',
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
                                                {priorityOptions.map(p => (
                                                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <label className="form-label" style={{
                                                display: 'block',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Room Number
                                            </label>
                                            <input
                                                type="text"
                                                name="room_number"
                                                value={formData.room_number}
                                                onChange={handleFormChange}
                                                placeholder="e.g. 101"
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
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
                                    </div>
                                </div>

                                {/* ===== SECTION 2: DATE & TIME ===== */}
                                <div style={{
                                    background: 'var(--bg-primary)',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <h4 style={{
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                        margin: '0 0 10px 0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <Calendar size={14} style={{ color: 'var(--warning-color, #F59E0B)' }} />
                                        Date & Time
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <label className="form-label" style={{
                                                display: 'block',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Date <span style={{ color: 'var(--danger-color)' }}>*</span>
                                            </label>
                                            <input
                                                type="date"
                                                name="appointment_date"
                                                value={formData.appointment_date}
                                                onChange={handleFormChange}
                                                required
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: formErrors.appointment_date ? '1.5px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
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
                                            {formErrors.appointment_date && <span className="error-text" style={{ fontSize: '0.65rem', color: 'var(--danger-color)', display: 'block', marginTop: '2px' }}>{formErrors.appointment_date}</span>}
                                        </div>

                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <label className="form-label" style={{
                                                display: 'block',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Time <span style={{ color: 'var(--danger-color)' }}>*</span>
                                            </label>
                                            <select
                                                name="time_slot"
                                                className="hms-select"
                                                value={formData.time_slot}
                                                onChange={handleFormChange}
                                                required
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: formErrors.time_slot ? '1.5px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontFamily: 'var(--font-family)',
                                                    fontSize: '0.75rem',
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
                                            {formErrors.time_slot && <span className="error-text" style={{ fontSize: '0.65rem', color: 'var(--danger-color)', display: 'block', marginTop: '2px' }}>{formErrors.time_slot}</span>}
                                        </div>

                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <label className="form-label" style={{
                                                display: 'block',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Duration (minutes)
                                            </label>
                                            <select
                                                name="duration"
                                                className="hms-select"
                                                value={formData.duration}
                                                onChange={handleFormChange}
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontFamily: 'var(--font-family)',
                                                    fontSize: '0.75rem',
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
                                                {durationOptions.map(d => (
                                                    <option key={d} value={d}>{d} min</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* ===== SECTION 3: MEDICAL INFO ===== */}
                                <div style={{
                                    background: 'var(--bg-primary)',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <h4 style={{
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                        margin: '0 0 10px 0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <Heart size={14} style={{ color: 'var(--danger-color)' }} />
                                        Medical Information
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <label className="form-label" style={{
                                                display: 'block',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Reason <span style={{ color: 'var(--danger-color)' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="reason"
                                                value={formData.reason}
                                                onChange={handleFormChange}
                                                placeholder="e.g. General Checkup, Follow-up..."
                                                required
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
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
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Symptoms
                                            </label>
                                            <input
                                                type="text"
                                                name="symptoms"
                                                value={formData.symptoms}
                                                onChange={handleFormChange}
                                                placeholder="e.g. Fever, Headache..."
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
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
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Medical History
                                            </label>
                                            <textarea
                                                name="medical_history"
                                                value={formData.medical_history}
                                                onChange={handleFormChange}
                                                placeholder="Previous conditions, surgeries..."
                                                rows="2"
                                                style={{
                                                    width: '100%',
                                                    padding: '6px 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
                                                    fontFamily: 'var(--font-family)',
                                                    background: 'var(--card-bg)',
                                                    color: 'var(--text-primary)',
                                                    outline: 'none',
                                                    transition: 'all 0.2s ease',
                                                    resize: 'vertical',
                                                    minHeight: '50px'
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
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Allergies
                                            </label>
                                            <input
                                                type="text"
                                                name="allergies"
                                                value={formData.allergies}
                                                onChange={handleFormChange}
                                                placeholder="e.g. Penicillin, Dust..."
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
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
                                    </div>
                                </div>

                                {/* ===== SECTION 4: VITAL SIGNS ===== */}
                                <div style={{
                                    background: 'var(--bg-primary)',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <h4 style={{
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                        margin: '0 0 10px 0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <Activity size={14} style={{ color: 'var(--purple-color, #8B5CF6)' }} />
                                        Vital Signs
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <label className="form-label" style={{
                                                display: 'block',
                                                fontSize: '0.65rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                BP (mmHg)
                                            </label>
                                            <input
                                                type="text"
                                                name="blood_pressure"
                                                value={formData.blood_pressure}
                                                onChange={handleFormChange}
                                                placeholder="120/80"
                                                style={{
                                                    width: '100%',
                                                    height: '32px',
                                                    padding: '0 6px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '6px',
                                                    fontSize: '0.7rem',
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
                                                fontSize: '0.65rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                HR (bpm)
                                            </label>
                                            <input
                                                type="text"
                                                name="heart_rate"
                                                value={formData.heart_rate}
                                                onChange={handleFormChange}
                                                placeholder="72"
                                                style={{
                                                    width: '100%',
                                                    height: '32px',
                                                    padding: '0 6px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '6px',
                                                    fontSize: '0.7rem',
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
                                                fontSize: '0.65rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Temp (°C)
                                            </label>
                                            <input
                                                type="text"
                                                name="temperature"
                                                value={formData.temperature}
                                                onChange={handleFormChange}
                                                placeholder="36.5"
                                                style={{
                                                    width: '100%',
                                                    height: '32px',
                                                    padding: '0 6px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '6px',
                                                    fontSize: '0.7rem',
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
                                                fontSize: '0.65rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Weight (kg)
                                            </label>
                                            <input
                                                type="text"
                                                name="weight"
                                                value={formData.weight}
                                                onChange={handleFormChange}
                                                placeholder="70"
                                                style={{
                                                    width: '100%',
                                                    height: '32px',
                                                    padding: '0 6px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '6px',
                                                    fontSize: '0.7rem',
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
                                                fontSize: '0.65rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Height (cm)
                                            </label>
                                            <input
                                                type="text"
                                                name="height"
                                                value={formData.height}
                                                onChange={handleFormChange}
                                                placeholder="175"
                                                style={{
                                                    width: '100%',
                                                    height: '32px',
                                                    padding: '0 6px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '6px',
                                                    fontSize: '0.7rem',
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
                                                fontSize: '0.65rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                BMI
                                            </label>
                                            <input
                                                type="text"
                                                name="bmi"
                                                value={formData.bmi}
                                                onChange={handleFormChange}
                                                placeholder="Auto-calculated"
                                                style={{
                                                    width: '100%',
                                                    height: '32px',
                                                    padding: '0 6px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '6px',
                                                    fontSize: '0.7rem',
                                                    fontFamily: 'var(--font-family)',
                                                    background: 'var(--bg-primary)',
                                                    color: 'var(--text-primary)',
                                                    outline: 'none',
                                                    transition: 'all 0.2s ease',
                                                    cursor: 'not-allowed'
                                                }}
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ===== SECTION 5: PAYMENT & BILLING ===== */}
                                <div style={{
                                    background: 'var(--bg-primary)',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <h4 style={{
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                        margin: '0 0 10px 0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <DollarSign size={14} style={{ color: 'var(--success-color, #22C55E)' }} />
                                        Payment & Billing
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <label className="form-label" style={{
                                                display: 'block',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Fee ($)
                                            </label>
                                            <input
                                                type="text"
                                                name="fee"
                                                value={formData.fee}
                                                onChange={handleFormChange}
                                                placeholder="0.00"
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
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
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Payment Status
                                            </label>
                                            <select
                                                name="payment_status"
                                                className="hms-select"
                                                value={formData.payment_status}
                                                onChange={handleFormChange}
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontFamily: 'var(--font-family)',
                                                    fontSize: '0.75rem',
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
                                                {paymentStatusOptions.map(p => (
                                                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <label className="form-label" style={{
                                                display: 'block',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Payment Method
                                            </label>
                                            <select
                                                name="payment_method"
                                                className="hms-select"
                                                value={formData.payment_method}
                                                onChange={handleFormChange}
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontFamily: 'var(--font-family)',
                                                    fontSize: '0.75rem',
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
                                                {paymentMethodOptions.map(p => (
                                                    <option key={p} value={p}>{p.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* ===== SECTION 6: ADDITIONAL INFO ===== */}
                                <div style={{
                                    background: 'var(--bg-primary)',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <h4 style={{
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                        margin: '0 0 10px 0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <ClipboardList size={14} style={{ color: 'var(--teal-color, #14B8A6)' }} />
                                        Additional Information
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <label className="form-label" style={{
                                                display: 'block',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Notes
                                            </label>
                                            <textarea
                                                name="notes"
                                                value={formData.notes}
                                                onChange={handleFormChange}
                                                placeholder="Additional notes about the appointment..."
                                                rows="3"
                                                style={{
                                                    width: '100%',
                                                    padding: '6px 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
                                                    fontFamily: 'var(--font-family)',
                                                    background: 'var(--card-bg)',
                                                    color: 'var(--text-primary)',
                                                    outline: 'none',
                                                    transition: 'all 0.2s ease',
                                                    resize: 'vertical',
                                                    minHeight: '60px'
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
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Special Instructions
                                            </label>
                                            <textarea
                                                name="special_instructions"
                                                value={formData.special_instructions}
                                                onChange={handleFormChange}
                                                placeholder="Special instructions for patient..."
                                                rows="3"
                                                style={{
                                                    width: '100%',
                                                    padding: '6px 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
                                                    fontFamily: 'var(--font-family)',
                                                    background: 'var(--card-bg)',
                                                    color: 'var(--text-primary)',
                                                    outline: 'none',
                                                    transition: 'all 0.2s ease',
                                                    resize: 'vertical',
                                                    minHeight: '60px'
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
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Emergency Contact
                                            </label>
                                            <input
                                                type="text"
                                                name="emergency_contact"
                                                value={formData.emergency_contact}
                                                onChange={handleFormChange}
                                                placeholder="Full name"
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
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
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Emergency Phone
                                            </label>
                                            <input
                                                type="text"
                                                name="emergency_phone"
                                                value={formData.emergency_phone}
                                                onChange={handleFormChange}
                                                placeholder="Phone number"
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
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
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Follow-up Date
                                            </label>
                                            <input
                                                type="date"
                                                name="follow_up_date"
                                                value={formData.follow_up_date}
                                                onChange={handleFormChange}
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
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
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                marginBottom: '3px'
                                            }}>
                                                Status
                                            </label>
                                            <select
                                                name="status"
                                                className="hms-select"
                                                value={formData.status}
                                                onChange={handleFormChange}
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontFamily: 'var(--font-family)',
                                                    fontSize: '0.75rem',
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
                                                {statusOptions.map(s => (
                                                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="hms-modal-footer" style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '8px',
                                    padding: '12px 0 0 0',
                                    borderTop: '1px solid var(--border-color)',
                                    background: 'transparent',
                                    marginTop: '4px',
                                    flexShrink: 0
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
                        maxWidth: '700px',
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
                            borderRadius: '16px 16px 0 0',
                            flexShrink: 0
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
                            {/* ===== STATUS BADGE ===== */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Status:</span>
                                    {getStatusBadge(selectedAppointment.status)}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    ID: #{selectedAppointment.id?.slice(0, 8)}
                                </div>
                            </div>

                            {/* ===== PATIENT & DOCTOR INFO ===== */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '16px',
                                marginBottom: '16px'
                            }}>
                                <div style={{
                                    padding: '12px',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <User size={16} style={{ color: 'var(--primary-color)' }} />
                                        <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>Patient Information</span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {selectedAppointment.patients?.name || 'Unknown'}
                                    </div>
                                    {selectedAppointment.patients?.phone && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Phone size={12} /> {selectedAppointment.patients.phone}
                                        </div>
                                    )}
                                    {selectedAppointment.patients?.email && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Mail size={12} /> {selectedAppointment.patients.email}
                                        </div>
                                    )}
                                    {selectedAppointment.patients?.address && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <MapPin size={12} /> {selectedAppointment.patients.address}
                                        </div>
                                    )}
                                </div>

                                <div style={{
                                    padding: '12px',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <Stethoscope size={16} style={{ color: 'var(--secondary-color)' }} />
                                        <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>Doctor Information</span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        Dr. {selectedAppointment.doctors?.name || 'Unknown'}
                                    </div>
                                    {selectedAppointment.doctors?.specialization && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {selectedAppointment.doctors.specialization}
                                        </div>
                                    )}
                                    {selectedAppointment.doctors?.phone && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Phone size={12} /> {selectedAppointment.doctors.phone}
                                        </div>
                                    )}
                                    {selectedAppointment.doctors?.email && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Mail size={12} /> {selectedAppointment.doctors.email}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ===== APPOINTMENT DETAILS ===== */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr 1fr',
                                gap: '10px',
                                marginBottom: '16px'
                            }}>
                                <div style={{
                                    padding: '10px',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {new Date(selectedAppointment.appointment_date).toLocaleDateString()}
                                    </div>
                                </div>
                                <div style={{
                                    padding: '10px',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Time</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {selectedAppointment.time_slot}
                                    </div>
                                </div>
                                <div style={{
                                    padding: '10px',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Duration</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {selectedAppointment.duration || '30'} min
                                    </div>
                                </div>
                            </div>

                            {/* ===== MORE DETAILS ===== */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '12px',
                                marginBottom: '16px'
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '2px' }}>
                                        <ClipboardList size={12} style={{ display: 'inline', marginRight: '4px' }} /> Appointment Type
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                        {selectedAppointment.appointment_type ? selectedAppointment.appointment_type.charAt(0).toUpperCase() + selectedAppointment.appointment_type.slice(1) : 'General'}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '2px' }}>
                                        <Home size={12} style={{ display: 'inline', marginRight: '4px' }} /> Visit Type
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                        {selectedAppointment.visit_type ? selectedAppointment.visit_type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'In-person'}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '2px' }}>
                                        <Hospital size={12} style={{ display: 'inline', marginRight: '4px' }} /> Department
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                        {selectedAppointment.department ? selectedAppointment.department.charAt(0).toUpperCase() + selectedAppointment.department.slice(1) : 'Not specified'}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '2px' }}>
                                        <AlertCircle size={12} style={{ display: 'inline', marginRight: '4px' }} /> Priority
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                        {selectedAppointment.priority ? selectedAppointment.priority.charAt(0).toUpperCase() + selectedAppointment.priority.slice(1) : 'Normal'}
                                    </div>
                                </div>
                                {selectedAppointment.room_number && (
                                    <div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '2px' }}>
                                            <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} /> Room Number
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                            {selectedAppointment.room_number}
                                        </div>
                                    </div>
                                )}
                                {selectedAppointment.follow_up_date && (
                                    <div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '2px' }}>
                                            <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} /> Follow-up Date
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                            {new Date(selectedAppointment.follow_up_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ===== MEDICAL INFO ===== */}
                            <div style={{
                                background: 'var(--bg-primary)',
                                padding: '12px',
                                borderRadius: '10px',
                                border: '1px solid var(--border-color)',
                                marginBottom: '12px'
                            }}>
                                <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Heart size={14} style={{ color: 'var(--danger-color)' }} /> Medical Information
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    {selectedAppointment.reason && (
                                        <div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Reason</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{selectedAppointment.reason}</div>
                                        </div>
                                    )}
                                    {selectedAppointment.symptoms && (
                                        <div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Symptoms</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{selectedAppointment.symptoms}</div>
                                        </div>
                                    )}
                                    {selectedAppointment.diagnosis && (
                                        <div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Diagnosis</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{selectedAppointment.diagnosis}</div>
                                        </div>
                                    )}
                                    {selectedAppointment.prescription && (
                                        <div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Prescription</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{selectedAppointment.prescription}</div>
                                        </div>
                                    )}
                                    {selectedAppointment.medical_history && (
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Medical History</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{selectedAppointment.medical_history}</div>
                                        </div>
                                    )}
                                    {selectedAppointment.allergies && (
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Allergies</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{selectedAppointment.allergies}</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ===== VITAL SIGNS ===== */}
                            {(selectedAppointment.blood_pressure || selectedAppointment.heart_rate ||
                                selectedAppointment.temperature || selectedAppointment.weight ||
                                selectedAppointment.height || selectedAppointment.bmi) && (
                                    <div style={{
                                        background: 'var(--bg-primary)',
                                        padding: '12px',
                                        borderRadius: '10px',
                                        border: '1px solid var(--border-color)',
                                        marginBottom: '12px'
                                    }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Activity size={14} style={{ color: 'var(--purple-color, #8B5CF6)' }} /> Vital Signs
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                                            {selectedAppointment.blood_pressure && (
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>BP</div>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedAppointment.blood_pressure}</div>
                                                </div>
                                            )}
                                            {selectedAppointment.heart_rate && (
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>HR</div>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedAppointment.heart_rate}</div>
                                                </div>
                                            )}
                                            {selectedAppointment.temperature && (
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Temp</div>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedAppointment.temperature}°C</div>
                                                </div>
                                            )}
                                            {selectedAppointment.weight && (
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Weight</div>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedAppointment.weight} kg</div>
                                                </div>
                                            )}
                                            {selectedAppointment.height && (
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Height</div>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedAppointment.height} cm</div>
                                                </div>
                                            )}
                                            {selectedAppointment.bmi && (
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>BMI</div>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedAppointment.bmi}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                            {/* ===== PAYMENT INFO ===== */}
                            {(selectedAppointment.fee || selectedAppointment.payment_status || selectedAppointment.payment_method) && (
                                <div style={{
                                    background: 'var(--bg-primary)',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)',
                                    marginBottom: '12px'
                                }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <DollarSign size={14} style={{ color: 'var(--success-color, #22C55E)' }} /> Payment & Billing
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                        {selectedAppointment.fee && (
                                            <div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Fee</div>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>${selectedAppointment.fee}</div>
                                            </div>
                                        )}
                                        {selectedAppointment.payment_status && (
                                            <div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Payment Status</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                                                    {selectedAppointment.payment_status.charAt(0).toUpperCase() + selectedAppointment.payment_status.slice(1)}
                                                </div>
                                            </div>
                                        )}
                                        {selectedAppointment.payment_method && (
                                            <div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Payment Method</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                                                    {selectedAppointment.payment_method.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ===== ADDITIONAL INFO ===== */}
                            {(selectedAppointment.notes || selectedAppointment.special_instructions ||
                                selectedAppointment.emergency_contact || selectedAppointment.emergency_phone) && (
                                    <div style={{
                                        background: 'var(--bg-primary)',
                                        padding: '12px',
                                        borderRadius: '10px',
                                        border: '1px solid var(--border-color)',
                                        marginBottom: '12px'
                                    }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <ClipboardList size={14} style={{ color: 'var(--teal-color, #14B8A6)' }} /> Additional Information
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                            {selectedAppointment.notes && (
                                                <div style={{ gridColumn: '1 / -1' }}>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Notes</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{selectedAppointment.notes}</div>
                                                </div>
                                            )}
                                            {selectedAppointment.special_instructions && (
                                                <div style={{ gridColumn: '1 / -1' }}>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Special Instructions</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{selectedAppointment.special_instructions}</div>
                                                </div>
                                            )}
                                            {selectedAppointment.emergency_contact && (
                                                <div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                                        <PhoneCall size={12} style={{ display: 'inline', marginRight: '4px' }} /> Emergency Contact
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{selectedAppointment.emergency_contact}</div>
                                                </div>
                                            )}
                                            {selectedAppointment.emergency_phone && (
                                                <div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                                        <Phone size={12} style={{ display: 'inline', marginRight: '4px' }} /> Emergency Phone
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{selectedAppointment.emergency_phone}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                            {/* ===== TIMESTAMPS ===== */}
                            <div style={{
                                fontSize: '0.6rem',
                                color: 'var(--text-muted)',
                                textAlign: 'center',
                                borderTop: '1px solid var(--border-color)',
                                paddingTop: '12px',
                                marginTop: '4px'
                            }}>
                                Created: {selectedAppointment.created_at ? new Date(selectedAppointment.created_at).toLocaleString() : 'N/A'}
                                {selectedAppointment.updated_at && ` • Updated: ${new Date(selectedAppointment.updated_at).toLocaleString()}`}
                            </div>
                        </div>
                        <div className="hms-modal-footer" style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '8px',
                            padding: '12px 18px',
                            borderTop: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            borderRadius: '0 0 16px 16px',
                            flexShrink: 0
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
                                <br />
                                Time: <strong>{selectedAppointment?.time_slot}</strong>
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

            {/* ===== CSS FOR TOAST ANIMATION ===== */}
            <style>{`
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </DashboardLayout>
    );
};

export default Appointments;