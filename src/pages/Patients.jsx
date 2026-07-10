import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { supabase } from '../services/supabaseClient';
import Button from '../components/Button';
import InputField from '../components/InputField';
import {
    Plus, Search, Edit2, Trash2, Eye, X,
    ChevronLeft, ChevronRight, User, Phone, Mail,
    MapPin, Calendar, Heart, Activity, FileText,
    Filter, ArrowLeft, Save, CheckCircle, XCircle, Clock,
    Stethoscope, Pill, Clipboard, Home, Users, Award,
    AlertCircle, CreditCard, CalendarDays, Printer,
    Syringe, ClipboardList, History
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Patients = () => {
    const navigate = useNavigate();

    // ===== STATE =====
    const [patients, setPatients] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [genderFilter, setGenderFilter] = useState('');
    const [bloodFilter, setBloodFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [activeTab, setActiveTab] = useState('demographics');
    const limit = 8;

    // Modals
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);

    // ===== PATIENT DATA FOR DETAILS =====
    const [patientAppointments, setPatientAppointments] = useState([]);
    const [patientPrescriptions, setPatientPrescriptions] = useState([]);
    const [loadingAppointments, setLoadingAppointments] = useState(false);
    const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        gender: 'Male',
        blood_group: 'A+',
        address: '',
        medical_history: '',
        status: 'Active',
        emergency_contact: '',
        emergency_phone: '',
        cnic: ''
    });

    const [formErrors, setFormErrors] = useState({});
    const [actionLoading, setActionLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // ===== GO BACK =====
    const goBack = () => {
        navigate(-1);
    };

    // ===== CALCULATE AGE =====
    const calculateAge = (dateOfBirth) => {
        if (!dateOfBirth) return 'N/A';
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    // ===== LOAD PATIENTS =====
    const loadPatients = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('patients')
                .select('*', { count: 'exact' });

            if (searchQuery && searchQuery.trim() !== '') {
                query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
            }
            if (genderFilter && genderFilter !== '') {
                query = query.eq('gender', genderFilter);
            }
            if (bloodFilter && bloodFilter !== '') {
                query = query.eq('blood_group', bloodFilter);
            }
            if (statusFilter && statusFilter !== '') {
                query = query.eq('status', statusFilter);
            }

            const from = (currentPage - 1) * limit;
            const to = from + limit - 1;

            const { data, count, error } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;
            setPatients(data || []);
            setTotal(count || 0);
        } catch (err) {
            console.error('Error loading patients:', err);
            setErrorMsg('Failed to load patients: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPatients();
    }, [searchQuery, genderFilter, bloodFilter, statusFilter, currentPage]);

    // ===== FETCH PATIENT APPOINTMENTS =====
    const fetchPatientAppointments = async (patientId) => {
        setLoadingAppointments(true);
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    id,
                    appointment_date,
                    time_slot,
                    status,
                    reason,
                    doctors:doctor_id (name, specialization)
                `)
                .eq('patient_id', patientId)
                .order('appointment_date', { ascending: false })
                .limit(10);

            if (error) throw error;
            setPatientAppointments(data || []);
        } catch (err) {
            console.error('Error fetching appointments:', err);
            setPatientAppointments([]);
        } finally {
            setLoadingAppointments(false);
        }
    };

    // ===== FETCH PATIENT PRESCRIPTIONS =====
    const fetchPatientPrescriptions = async (patientId) => {
        setLoadingPrescriptions(true);
        try {
            const { data, error } = await supabase
                .from('prescriptions')
                .select(`
                    id,
                    date,
                    diagnosis,
                    medications,
                    status,
                    doctors:doctor_id (name, specialization)
                `)
                .eq('patient_id', patientId)
                .order('date', { ascending: false })
                .limit(10);

            if (error) throw error;
            setPatientPrescriptions(data || []);
        } catch (err) {
            console.error('Error fetching prescriptions:', err);
            setPatientPrescriptions([]);
        } finally {
            setLoadingPrescriptions(false);
        }
    };

    // ===== OPEN DETAIL MODAL =====
    const openDetailModal = async (patient) => {
        setSelectedPatient(patient);
        setActiveTab('demographics');
        setIsDetailOpen(true);

        // Fetch appointments and prescriptions
        await Promise.all([
            fetchPatientAppointments(patient.id),
            fetchPatientPrescriptions(patient.id)
        ]);
    };

    // ===== HANDLE FORM CHANGE =====
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // ===== VALIDATE FORM =====
    const validateForm = () => {
        const errors = {};
        if (!formData.name.trim()) errors.name = 'Patient name is required';
        if (!formData.phone.trim()) {
            errors.phone = 'Phone number is required';
        } else if (!/^\+?[0-9\s-]{7,15}$/.test(formData.phone)) {
            errors.phone = 'Enter a valid phone number (7-15 digits)';
        }
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Enter a valid email address';
        }
        if (!formData.date_of_birth) errors.date_of_birth = 'Date of birth is required';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // ===== OPEN MODALS =====
    const openAddModal = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            date_of_birth: '',
            gender: 'Male',
            blood_group: 'A+',
            address: '',
            medical_history: '',
            status: 'Active',
            emergency_contact: '',
            emergency_phone: '',
            cnic: ''
        });
        setFormErrors({});
        setErrorMsg('');
        setSuccessMsg('');
        setIsAddOpen(true);
    };

    const openEditModal = (patient) => {
        setSelectedPatient(patient);
        setFormData({
            name: patient.name || '',
            email: patient.email || '',
            phone: patient.phone || '',
            date_of_birth: patient.date_of_birth || '',
            gender: patient.gender || 'Male',
            blood_group: patient.blood_group || 'A+',
            address: patient.address || '',
            medical_history: patient.medical_history || '',
            status: patient.status || 'Active',
            emergency_contact: patient.emergency_contact || '',
            emergency_phone: patient.emergency_phone || '',
            cnic: patient.cnic || ''
        });
        setFormErrors({});
        setErrorMsg('');
        setSuccessMsg('');
        setIsEditOpen(true);
    };

    const openDeleteModal = (patient) => {
        setSelectedPatient(patient);
        setIsDeleteOpen(true);
    };

    // ===== ADD PATIENT =====
    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setActionLoading(true);
        setErrorMsg('');
        try {
            const { data, error } = await supabase
                .from('patients')
                .insert([{
                    name: formData.name,
                    email: formData.email || null,
                    phone: formData.phone,
                    date_of_birth: formData.date_of_birth || null,
                    gender: formData.gender || null,
                    blood_group: formData.blood_group || null,
                    address: formData.address || null,
                    medical_history: formData.medical_history || null,
                    status: formData.status || 'Active',
                    emergency_contact: formData.emergency_contact || null,
                    emergency_phone: formData.emergency_phone || null,
                    cnic: formData.cnic || null,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;

            setSuccessMsg('✅ Patient added successfully!');
            setIsAddOpen(false);
            loadPatients();
            window.dispatchEvent(new Event('patientAdded'));
        } catch (err) {
            setErrorMsg(err.message || 'Failed to add patient.');
        } finally {
            setActionLoading(false);
        }
    };

    // ===== EDIT PATIENT =====
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setActionLoading(true);
        setErrorMsg('');
        try {
            const { error } = await supabase
                .from('patients')
                .update({
                    name: formData.name,
                    email: formData.email || null,
                    phone: formData.phone,
                    date_of_birth: formData.date_of_birth || null,
                    gender: formData.gender || null,
                    blood_group: formData.blood_group || null,
                    address: formData.address || null,
                    medical_history: formData.medical_history || null,
                    status: formData.status || 'Active',
                    emergency_contact: formData.emergency_contact || null,
                    emergency_phone: formData.emergency_phone || null,
                    cnic: formData.cnic || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedPatient.id);

            if (error) throw error;

            setSuccessMsg('✅ Patient updated successfully!');
            setIsEditOpen(false);
            loadPatients();
            window.dispatchEvent(new Event('patientAdded'));
        } catch (err) {
            setErrorMsg(err.message || 'Failed to update patient.');
        } finally {
            setActionLoading(false);
        }
    };

    // ===== DELETE PATIENT =====
    const handleDeleteSubmit = async () => {
        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('patients')
                .delete()
                .eq('id', selectedPatient.id);

            if (error) throw error;
            setIsDeleteOpen(false);
            loadPatients();
            window.dispatchEvent(new Event('patientAdded'));
        } catch (err) {
            alert('Failed to delete patient: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // ===== QUICK STATUS CHANGE =====
    const handleStatusChange = async (patientId, newStatus) => {
        try {
            const { error } = await supabase
                .from('patients')
                .update({ status: newStatus })
                .eq('id', patientId);

            if (error) throw error;

            setPatients(prev =>
                prev.map(p => p.id === patientId ? { ...p, status: newStatus } : p)
            );

            setSuccessMsg(`✅ Patient status updated to ${newStatus}`);
            setTimeout(() => setSuccessMsg(''), 3000);

            window.dispatchEvent(new Event('patientAdded'));
            loadPatients();
        } catch (err) {
            setErrorMsg('Failed to update status: ' + err.message);
            setTimeout(() => setErrorMsg(''), 3000);
        }
    };

    // ===== STATUS BADGE WITH DROPDOWN =====
    const getStatusBadge = (status, patientId) => {
        const statusOptions = ['Active', 'Inactive', 'Discharged'];
        const statusColors = {
            'Active': 'success',
            'Inactive': 'danger',
            'Discharged': 'warning'
        };
        const statusIcons = {
            'Active': <CheckCircle size={12} style={{ marginRight: '4px' }} />,
            'Inactive': <XCircle size={12} style={{ marginRight: '4px' }} />,
            'Discharged': <Clock size={12} style={{ marginRight: '4px' }} />
        };

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span className={`hms-badge ${statusColors[status] || 'secondary'}`}
                    style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', display: 'flex', alignItems: 'center' }}>
                    {statusIcons[status]}
                    {status || 'Active'}
                </span>
                <select
                    value={status}
                    onChange={(e) => handleStatusChange(patientId, e.target.value)}
                    style={{
                        padding: '2px 6px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        fontFamily: 'var(--font-family)',
                        background: 'var(--card-bg)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        outline: 'none',
                        height: '26px'
                    }}
                    onMouseEnter={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                    onMouseLeave={(e) => e.target.style.borderColor = 'var(--border-color)'}
                >
                    {statusOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            </div>
        );
    };

    // ===== GET APPOINTMENT STATUS BADGE =====
    const getAppointmentStatusBadge = (status) => {
        const colors = {
            'scheduled': 'info',
            'in-progress': 'warning',
            'completed': 'success',
            'cancelled': 'danger',
            'no-show': 'danger'
        };
        const labels = {
            'scheduled': 'Scheduled',
            'in-progress': 'In Progress',
            'completed': 'Completed',
            'cancelled': 'Cancelled',
            'no-show': 'No Show'
        };
        return (
            <span className={`hms-badge ${colors[status] || 'secondary'}`}
                style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '0.6rem' }}>
                {labels[status] || status}
            </span>
        );
    };

    // ===== GET PRESCRIPTION STATUS BADGE =====
    const getPrescriptionStatusBadge = (status) => {
        const colors = {
            'active': 'success',
            'completed': 'primary',
            'expired': 'danger',
            'cancelled': 'danger'
        };
        return (
            <span className={`hms-badge ${colors[status] || 'secondary'}`}
                style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '0.6rem' }}>
                {status || 'Active'}
            </span>
        );
    };

    // ===== PAGINATION =====
    const totalPages = Math.ceil(total / limit) || 1;
    const startRange = (currentPage - 1) * limit + 1;
    const endRange = Math.min(currentPage * limit, total);

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    // ===== TOGGLE FILTERS =====
    const toggleFilters = () => {
        setShowFilters(!showFilters);
    };

    const clearFilters = () => {
        setGenderFilter('');
        setBloodFilter('');
        setStatusFilter('');
        setSearchQuery('');
        setCurrentPage(1);
    };

    // ===== COUNT ACTIVE FILTERS =====
    const activeFilterCount = (genderFilter ? 1 : 0) + (bloodFilter ? 1 : 0) + (statusFilter ? 1 : 0);

    // ===== RENDER DETAIL MODAL CONTENT =====
    const renderDetailContent = () => {
        if (!selectedPatient) return null;

        const age = calculateAge(selectedPatient.date_of_birth);

        const tabs = [
            { id: 'demographics', label: 'Demographics', icon: User },
            { id: 'medical', label: 'Medical History', icon: Heart },
            { id: 'appointments', label: 'Appointments', icon: Calendar },
            { id: 'prescriptions', label: 'Prescriptions', icon: Pill }
        ];

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Profile Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    padding: '16px 20px',
                    background: 'linear-gradient(135deg, var(--primary-color)15, var(--secondary-color)15)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    flexWrap: 'wrap'
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary-color), #7C3AED)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.8rem',
                        fontWeight: 700,
                        flexShrink: 0
                    }}>
                        {selectedPatient.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                                {selectedPatient.name}
                            </h2>
                            <span style={{
                                fontSize: '0.7rem',
                                color: 'var(--text-muted)',
                                background: 'var(--bg-primary)',
                                padding: '2px 12px',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)'
                            }}>
                                PT-{selectedPatient.id?.slice(0, 6).toUpperCase()}
                            </span>
                            {getStatusBadge(selectedPatient.status, selectedPatient.id)}
                        </div>
                        <div style={{ display: 'flex', gap: '16px', marginTop: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                {selectedPatient.date_of_birth ? new Date(selectedPatient.date_of_birth).toLocaleDateString() : 'N/A'}
                                {age !== 'N/A' && ` (${age} yrs)`}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                <User size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                {selectedPatient.gender || 'N/A'}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                <Heart size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                Blood: {selectedPatient.blood_group || 'N/A'}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                <Phone size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                {selectedPatient.phone}
                            </span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                            onClick={() => window.print()}
                            style={{
                                padding: '6px 12px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                                color: 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                            onMouseEnter={(e) => { e.target.style.background = 'var(--hover-bg)'; }}
                            onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
                        >
                            <Printer size={14} /> Print
                        </button>
                        <button
                            onClick={() => {
                                setIsDetailOpen(false);
                                openEditModal(selectedPatient);
                            }}
                            style={{
                                padding: '6px 12px',
                                border: 'none',
                                borderRadius: '6px',
                                background: 'var(--primary-color)',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                            onMouseEnter={(e) => { e.target.style.background = 'var(--primary-hover)'; }}
                            onMouseLeave={(e) => { e.target.style.background = 'var(--primary-color)'; }}
                        >
                            <Edit2 size={14} /> Edit
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    gap: '4px',
                    borderBottom: '2px solid var(--border-color)',
                    paddingBottom: '8px',
                    flexWrap: 'wrap'
                }}>
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    if (tab.id === 'appointments') {
                                        fetchPatientAppointments(selectedPatient.id);
                                    } else if (tab.id === 'prescriptions') {
                                        fetchPatientPrescriptions(selectedPatient.id);
                                    }
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderBottom: isActive ? '2px solid var(--primary-color)' : '2px solid transparent',
                                    background: isActive ? 'var(--primary-color)08' : 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-family)',
                                    color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)',
                                    fontWeight: isActive ? 600 : 400,
                                    transition: 'all 0.2s ease',
                                    borderRadius: '8px 8px 0 0'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.target.style.background = 'var(--hover-bg)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.target.style.background = 'transparent';
                                    }
                                }}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div style={{ minHeight: '200px' }}>
                    {/* ===== DEMOGRAPHICS TAB ===== */}
                    {activeTab === 'demographics' && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '12px'
                        }}>
                            <div style={{
                                padding: '12px 16px',
                                background: 'var(--bg-primary)',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <User size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                    Full Name
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)', marginTop: '2px' }}>
                                    {selectedPatient.name}
                                </div>
                            </div>
                            <div style={{
                                padding: '12px 16px',
                                background: 'var(--bg-primary)',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                    Date of Birth / Age
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)', marginTop: '2px' }}>
                                    {selectedPatient.date_of_birth ? new Date(selectedPatient.date_of_birth).toLocaleDateString() : 'N/A'}
                                    {age !== 'N/A' && ` (${age} yrs)`}
                                </div>
                            </div>
                            <div style={{
                                padding: '12px 16px',
                                background: 'var(--bg-primary)',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <User size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                    Gender
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)', marginTop: '2px' }}>
                                    {selectedPatient.gender || 'N/A'}
                                </div>
                            </div>
                            <div style={{
                                padding: '12px 16px',
                                background: 'var(--bg-primary)',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <Phone size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                    Phone Number
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)', marginTop: '2px' }}>
                                    {selectedPatient.phone}
                                </div>
                            </div>
                            <div style={{
                                padding: '12px 16px',
                                background: 'var(--bg-primary)',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <Mail size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                    Email
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)', marginTop: '2px' }}>
                                    {selectedPatient.email || 'N/A'}
                                </div>
                            </div>
                            <div style={{
                                padding: '12px 16px',
                                background: 'var(--bg-primary)',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <Heart size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                    Blood Group
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)', marginTop: '2px' }}>
                                    {selectedPatient.blood_group || 'N/A'}
                                </div>
                            </div>
                            {selectedPatient.cnic && (
                                <div style={{
                                    padding: '12px 16px',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        <CreditCard size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                        CNIC / ID
                                    </div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)', marginTop: '2px' }}>
                                        {selectedPatient.cnic}
                                    </div>
                                </div>
                            )}
                            {selectedPatient.emergency_contact && (
                                <div style={{
                                    padding: '12px 16px',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        <AlertCircle size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                        Emergency Contact
                                    </div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)', marginTop: '2px' }}>
                                        {selectedPatient.emergency_contact}
                                        {selectedPatient.emergency_phone && ` (${selectedPatient.emergency_phone})`}
                                    </div>
                                </div>
                            )}
                            {selectedPatient.address && (
                                <div style={{
                                    padding: '12px 16px',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    gridColumn: '1 / -1'
                                }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                        Residential Address
                                    </div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)', marginTop: '2px' }}>
                                        {selectedPatient.address}
                                    </div>
                                </div>
                            )}
                            {selectedPatient.created_at && (
                                <div style={{
                                    padding: '12px 16px',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    gridColumn: '1 / -1'
                                }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        <CalendarDays size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                        Registration Date
                                    </div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)', marginTop: '2px' }}>
                                        {new Date(selectedPatient.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ===== MEDICAL HISTORY TAB ===== */}
                    {activeTab === 'medical' && (
                        <div style={{
                            padding: '16px',
                            background: 'var(--bg-primary)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            minHeight: '150px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <Heart size={18} style={{ color: 'var(--danger-color)' }} />
                                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    Medical History & Allergies
                                </h4>
                            </div>
                            {selectedPatient.medical_history ? (
                                <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                                    {selectedPatient.medical_history}
                                </p>
                            ) : (
                                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                                    No medical history recorded for this patient.
                                </p>
                            )}
                            <div style={{
                                marginTop: '16px',
                                padding: '12px',
                                background: 'var(--card-bg)',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                gap: '16px',
                                flexWrap: 'wrap'
                            }}>
                                <div>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Status</span>
                                    <div>{getStatusBadge(selectedPatient.status, selectedPatient.id)}</div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Blood Group</span>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedPatient.blood_group || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== APPOINTMENTS TAB - FIXED ===== */}
                    {activeTab === 'appointments' && (
                        <div style={{
                            padding: '16px',
                            background: 'var(--bg-primary)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            minHeight: '150px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Calendar size={18} style={{ color: 'var(--primary-color)' }} />
                                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        Appointments
                                    </h4>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        ({patientAppointments.length})
                                    </span>
                                </div>
                                <button
                                    onClick={() => navigate('/appointments')}
                                    style={{
                                        padding: '4px 12px',
                                        border: 'none',
                                        borderRadius: '6px',
                                        background: 'var(--primary-color)',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontSize: '0.7rem',
                                        fontFamily: 'var(--font-family)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => { e.target.style.background = 'var(--primary-hover)'; }}
                                    onMouseLeave={(e) => { e.target.style.background = 'var(--primary-color)'; }}
                                >
                                    <Plus size={14} /> Book Appointment
                                </button>
                            </div>

                            {loadingAppointments ? (
                                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                                    <div className="spinner" style={{ margin: '0 auto 8px' }}>⏳</div>
                                    Loading appointments...
                                </div>
                            ) : patientAppointments.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                                    <Calendar size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                                    <p>No appointments found for this patient.</p>
                                    <button
                                        onClick={() => navigate('/appointments')}
                                        style={{
                                            marginTop: '8px',
                                            padding: '4px 12px',
                                            border: 'none',
                                            borderRadius: '6px',
                                            background: 'var(--primary-color)',
                                            color: 'white',
                                            cursor: 'pointer',
                                            fontSize: '0.7rem',
                                            fontFamily: 'var(--font-family)'
                                        }}
                                    >
                                        Book an Appointment
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {patientAppointments.map((appt, index) => (
                                        <div key={appt.id || index} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '10px 14px',
                                            background: 'var(--card-bg)',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            flexWrap: 'wrap',
                                            gap: '8px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                                <div style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '50%',
                                                    background: 'var(--primary-color)15',
                                                    color: 'var(--primary-color)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 600
                                                }}>
                                                    {new Date(appt.appointment_date).getDate()}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                                        {new Date(appt.appointment_date).toLocaleDateString('en-US', {
                                                            weekday: 'short',
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                        <Clock size={12} style={{ display: 'inline' }} />
                                                        {appt.time_slot || 'N/A'}
                                                        <span style={{ color: 'var(--text-muted)' }}>•</span>
                                                        <Stethoscope size={12} style={{ display: 'inline' }} />
                                                        {appt.doctors?.name || 'Unknown Doctor'}
                                                        {appt.doctors?.specialization && (
                                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                                                ({appt.doctors.specialization})
                                                            </span>
                                                        )}
                                                    </div>
                                                    {appt.reason && (
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                            Reason: {appt.reason}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {getAppointmentStatusBadge(appt.status)}
                                                <button
                                                    onClick={() => navigate(`/appointments`)}
                                                    style={{
                                                        padding: '2px 8px',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '4px',
                                                        background: 'transparent',
                                                        cursor: 'pointer',
                                                        fontSize: '0.6rem',
                                                        color: 'var(--text-secondary)'
                                                    }}
                                                    onMouseEnter={(e) => { e.target.style.background = 'var(--hover-bg)'; }}
                                                    onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
                                                >
                                                    View
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ===== PRESCRIPTIONS TAB - FIXED ===== */}
                    {activeTab === 'prescriptions' && (
                        <div style={{
                            padding: '16px',
                            background: 'var(--bg-primary)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            minHeight: '150px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Pill size={18} style={{ color: 'var(--primary-color)' }} />
                                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        Prescriptions
                                    </h4>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        ({patientPrescriptions.length})
                                    </span>
                                </div>
                                <button
                                    onClick={() => navigate('/prescriptions')}
                                    style={{
                                        padding: '4px 12px',
                                        border: 'none',
                                        borderRadius: '6px',
                                        background: 'var(--primary-color)',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontSize: '0.7rem',
                                        fontFamily: 'var(--font-family)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => { e.target.style.background = 'var(--primary-hover)'; }}
                                    onMouseLeave={(e) => { e.target.style.background = 'var(--primary-color)'; }}
                                >
                                    <Plus size={14} /> New Prescription
                                </button>
                            </div>

                            {loadingPrescriptions ? (
                                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                                    <div className="spinner" style={{ margin: '0 auto 8px' }}>⏳</div>
                                    Loading prescriptions...
                                </div>
                            ) : patientPrescriptions.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                                    <Pill size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                                    <p>No prescriptions found for this patient.</p>
                                    <button
                                        onClick={() => navigate('/prescriptions')}
                                        style={{
                                            marginTop: '8px',
                                            padding: '4px 12px',
                                            border: 'none',
                                            borderRadius: '6px',
                                            background: 'var(--primary-color)',
                                            color: 'white',
                                            cursor: 'pointer',
                                            fontSize: '0.7rem',
                                            fontFamily: 'var(--font-family)'
                                        }}
                                    >
                                        Create Prescription
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {patientPrescriptions.map((presc, index) => (
                                        <div key={presc.id || index} style={{
                                            padding: '10px 14px',
                                            background: 'var(--card-bg)',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                                            {presc.diagnosis || 'General Checkup'}
                                                        </span>
                                                        {getPrescriptionStatusBadge(presc.status)}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                        <Calendar size={12} style={{ display: 'inline' }} />
                                                        {presc.date ? new Date(presc.date).toLocaleDateString() : 'N/A'}
                                                        <span style={{ color: 'var(--text-muted)' }}>•</span>
                                                        <Stethoscope size={12} style={{ display: 'inline' }} />
                                                        {presc.doctors?.name || 'Unknown Doctor'}
                                                        {presc.doctors?.specialization && (
                                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                                                ({presc.doctors.specialization})
                                                            </span>
                                                        )}
                                                    </div>
                                                    {presc.medications && (
                                                        <div style={{
                                                            fontSize: '0.75rem',
                                                            color: 'var(--text-secondary)',
                                                            marginTop: '4px',
                                                            background: 'var(--bg-primary)',
                                                            padding: '6px 10px',
                                                            borderRadius: '4px',
                                                            border: '1px solid var(--border-color)'
                                                        }}>
                                                            <Pill size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--purple-color)' }} />
                                                            {presc.medications}
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => navigate(`/prescriptions`)}
                                                    style={{
                                                        padding: '2px 10px',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '4px',
                                                        background: 'transparent',
                                                        cursor: 'pointer',
                                                        fontSize: '0.6rem',
                                                        color: 'var(--text-secondary)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                    onMouseEnter={(e) => { e.target.style.background = 'var(--hover-bg)'; }}
                                                    onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
                                                >
                                                    <Eye size={12} /> View
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <DashboardLayout active="patients" title="Patient Management">
            {/* ===== BACK BUTTON ===== */}
            <div style={{ marginBottom: '16px' }}>
                <button
                    onClick={goBack}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        background: 'transparent',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-family)',
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
                    <ArrowLeft size={18} /> Back
                </button>
            </div>

            {/* ===== CONTROLS BAR ===== */}
            <div className="hms-controls-bar" style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '14px 18px'
            }}>
                <div className="hms-search-box" style={{ flex: 1, minWidth: '200px' }}>
                    <Search size={18} className="hms-search-icon" />
                    <input
                        type="text"
                        placeholder="Search by name, phone..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        style={{
                            width: '100%',
                            padding: '8px 16px 8px 38px',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            fontFamily: 'var(--font-family)',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            transition: 'all 0.2s ease'
                        }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={toggleFilters}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '8px',
                            background: 'var(--bg-primary)',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
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
                        <Filter size={16} /> Filters
                        {activeFilterCount > 0 && (
                            <span style={{
                                background: 'var(--primary-color)',
                                color: 'white',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
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
                            gap: '6px',
                            padding: '6px 16px',
                            border: 'none',
                            borderRadius: '8px',
                            background: 'var(--primary-color)',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontFamily: 'var(--font-family)',
                            color: 'white',
                            fontWeight: 500,
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'var(--primary-hover)';
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'var(--primary-color)';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                        }}
                    >
                        <Plus size={16} /> Add Patient
                    </button>
                </div>
            </div>

            {/* ===== FILTERS BAR ===== */}
            {showFilters && (
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    padding: '14px 18px',
                    background: 'var(--bg-primary)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    marginBottom: '16px',
                    alignItems: 'center'
                }}>
                    <select
                        value={genderFilter}
                        onChange={(e) => { setGenderFilter(e.target.value); setCurrentPage(1); }}
                        style={{
                            height: '38px',
                            fontSize: '0.8rem',
                            minWidth: '130px',
                            padding: '0 14px',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '8px',
                            fontFamily: 'var(--font-family)',
                            background: 'var(--card-bg)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="">All Genders</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                    <select
                        value={bloodFilter}
                        onChange={(e) => { setBloodFilter(e.target.value); setCurrentPage(1); }}
                        style={{
                            height: '38px',
                            fontSize: '0.8rem',
                            minWidth: '130px',
                            padding: '0 14px',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '8px',
                            fontFamily: 'var(--font-family)',
                            background: 'var(--card-bg)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="">All Blood Groups</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                        style={{
                            height: '38px',
                            fontSize: '0.8rem',
                            minWidth: '130px',
                            padding: '0 14px',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '8px',
                            fontFamily: 'var(--font-family)',
                            background: 'var(--card-bg)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Discharged">Discharged</option>
                    </select>
                    <button
                        onClick={clearFilters}
                        style={{
                            padding: '6px 14px',
                            border: '1.5px solid var(--border-color)',
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
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'transparent';
                            e.target.style.color = 'var(--text-secondary)';
                        }}
                    >
                        Clear All
                    </button>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {total} patients found
                    </span>
                </div>
            )}

            {/* ===== SUCCESS / ERROR MESSAGES ===== */}
            {successMsg && (
                <div className="alert alert-success" style={{ marginBottom: '16px', borderRadius: '8px', padding: '12px 16px' }}>
                    {successMsg}
                </div>
            )}
            {errorMsg && (
                <div className="alert alert-danger" style={{ marginBottom: '16px', borderRadius: '8px', padding: '12px 16px' }}>
                    {errorMsg}
                </div>
            )}

            {/* ===== PATIENTS TABLE ===== */}
            <div className="hms-table-container" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        <div className="spinner" style={{ margin: '0 auto 12px' }}>⏳</div>
                        Loading patient records...
                    </div>
                ) : patients.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>👤</div>
                        No patient records found.
                        {activeFilterCount > 0 && (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>
                                Try clearing your filters to see all patients.
                            </p>
                        )}
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
                            <Plus size={16} /> Add First Patient
                        </button>
                    </div>
                ) : (
                    <table className="hms-table">
                        <thead>
                            <tr>
                                <th style={{ padding: '12px 16px', fontSize: '0.7rem' }}>Name</th>
                                <th style={{ padding: '12px 16px', fontSize: '0.7rem' }}>Contact</th>
                                <th style={{ padding: '12px 16px', fontSize: '0.7rem' }}>D.O.B</th>
                                <th style={{ padding: '12px 16px', fontSize: '0.7rem' }}>Gender</th>
                                <th style={{ padding: '12px 16px', fontSize: '0.7rem' }}>Blood</th>
                                <th style={{ padding: '12px 16px', fontSize: '0.7rem' }}>Status</th>
                                <th style={{ padding: '12px 16px', fontSize: '0.7rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patients.map((patient) => (
                                <tr key={patient.id}>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{patient.name}</div>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ fontSize: '0.85rem' }}>{patient.phone}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{patient.email || 'N/A'}</div>
                                    </td>
                                    <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                                        {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span className={`hms-badge ${patient.gender === 'Male' ? 'info' : patient.gender === 'Female' ? 'success' : 'secondary'}`}
                                            style={{ padding: '2px 12px', borderRadius: '12px', fontSize: '0.7rem' }}>
                                            {patient.gender || 'N/A'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span className="hms-badge warning" style={{ padding: '2px 12px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700 }}>
                                            {patient.blood_group || 'N/A'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        {getStatusBadge(patient.status, patient.id)}
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                        <div className="hms-actions" style={{ justifyContent: 'flex-end', gap: '6px', flexWrap: 'wrap' }}>
                                            <button className="hms-action-btn view" title="View Details" onClick={() => openDetailModal(patient)}
                                                style={{ padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                                <Eye size={16} />
                                            </button>
                                            <button className="hms-action-btn edit" title="Edit Patient" onClick={() => openEditModal(patient)}
                                                style={{ padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="hms-action-btn delete" title="Delete Patient" onClick={() => openDeleteModal(patient)}
                                                style={{ padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ===== PAGINATION ===== */}
            {totalPages > 1 && (
                <div className="hms-pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '12px 18px' }}>
                    <div className="hms-pagination-info" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Showing <strong>{startRange}</strong> to <strong>{endRange}</strong> of <strong>{total}</strong> patients
                    </div>
                    <div className="hms-pagination-buttons" style={{ display: 'flex', gap: '6px' }}>
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                background: 'transparent',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                fontSize: '0.8rem',
                                fontFamily: 'var(--font-family)',
                                color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                                opacity: currentPage === 1 ? 0.5 : 1,
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <ChevronLeft size={16} /> Prev
                        </button>
                        {getPageNumbers().map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                style={{
                                    padding: '6px 12px',
                                    minWidth: '36px',
                                    border: currentPage === page ? 'none' : '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    background: currentPage === page ? 'var(--primary-color)' : 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-family)',
                                    color: currentPage === page ? 'white' : 'var(--text-secondary)',
                                    fontWeight: currentPage === page ? 600 : 400,
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    if (currentPage !== page) {
                                        e.target.style.background = 'var(--hover-bg)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (currentPage !== page) {
                                        e.target.style.background = 'transparent';
                                    }
                                }}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                background: 'transparent',
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                fontSize: '0.8rem',
                                fontFamily: 'var(--font-family)',
                                color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-secondary)',
                                opacity: currentPage === totalPages ? 0.5 : 1,
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* ===== ADD PATIENT MODAL ===== */}
            {isAddOpen && (
                <div className="hms-modal-backdrop" onClick={() => setIsAddOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="hms-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
                            <h3 className="hms-modal-title" style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <User size={20} style={{ color: 'var(--primary-color)' }} />
                                Register New Patient
                            </h3>
                            <button className="hms-modal-close" onClick={() => setIsAddOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px', borderRadius: '6px' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="hms-modal-body" style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                            {errorMsg && <div className="alert alert-danger" style={{ marginBottom: '16px' }}>{errorMsg}</div>}
                            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <InputField
                                    label="Patient Full Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Ahmed Khan"
                                    error={formErrors.name}
                                    required
                                />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <InputField
                                        label="Phone Number"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 03001234567"
                                        error={formErrors.phone}
                                        required
                                    />
                                    <InputField
                                        label="Email Address"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="e.g. patient@care.com"
                                        error={formErrors.email}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                                    <InputField
                                        label="Date of Birth"
                                        name="date_of_birth"
                                        type="date"
                                        value={formData.date_of_birth}
                                        onChange={handleInputChange}
                                        error={formErrors.date_of_birth}
                                        required
                                    />
                                    <div className="form-group">
                                        <label className="form-label">Gender</label>
                                        <select
                                            name="gender"
                                            className="hms-select"
                                            value={formData.gender}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', height: '42px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.85rem', background: 'var(--card-bg)', color: 'var(--text-primary)' }}
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Blood Group</label>
                                        <select
                                            name="blood_group"
                                            className="hms-select"
                                            value={formData.blood_group}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', height: '42px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.85rem', background: 'var(--card-bg)', color: 'var(--text-primary)' }}
                                        >
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                        </select>
                                    </div>
                                </div>
                                <InputField
                                    label="CNIC / ID Number"
                                    name="cnic"
                                    value={formData.cnic}
                                    onChange={handleInputChange}
                                    placeholder="e.g. 42101-1234567-1"
                                />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <InputField
                                        label="Emergency Contact Name"
                                        name="emergency_contact"
                                        value={formData.emergency_contact}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Sara Khan (Wife)"
                                    />
                                    <InputField
                                        label="Emergency Contact Phone"
                                        name="emergency_phone"
                                        value={formData.emergency_phone}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 0300-9876543"
                                    />
                                </div>
                                <InputField
                                    label="Residential Address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Flat 402, Block C, Gulshan-e-Iqbal, Karachi"
                                />
                                <div className="form-group">
                                    <label className="form-label">Medical History / Allergies / Notes</label>
                                    <textarea
                                        name="medical_history"
                                        className="input-control"
                                        value={formData.medical_history}
                                        onChange={handleInputChange}
                                        placeholder="Enter details like Penicillin allergy, Hypertension, previous surgeries..."
                                        style={{ minHeight: '70px', width: '100%', padding: '10px', fontFamily: 'var(--font-family)', fontSize: '0.85rem', border: '1.5px solid var(--border-color)', borderRadius: '8px', background: 'var(--card-bg)', color: 'var(--text-primary)', resize: 'vertical' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select
                                        name="status"
                                        className="hms-select"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', height: '42px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.85rem', background: 'var(--card-bg)', color: 'var(--text-primary)' }}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                        <option value="Discharged">Discharged</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div className="hms-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '14px 20px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
                            <button
                                onClick={() => setIsAddOpen(false)}
                                style={{
                                    padding: '8px 20px',
                                    border: '1.5px solid var(--border-color)',
                                    borderRadius: '8px',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'var(--text-secondary)',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => { e.target.style.background = 'var(--hover-bg)'; }}
                                onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddSubmit}
                                disabled={actionLoading}
                                style={{
                                    padding: '8px 20px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    background: 'var(--primary-color)',
                                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.85rem',
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
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!actionLoading) {
                                        e.target.style.background = 'var(--primary-color)';
                                    }
                                }}
                            >
                                <Save size={16} />
                                {actionLoading ? 'Saving...' : 'Register Patient'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== EDIT PATIENT MODAL ===== */}
            {isEditOpen && (
                <div className="hms-modal-backdrop" onClick={() => setIsEditOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="hms-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
                            <h3 className="hms-modal-title" style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Edit2 size={20} style={{ color: 'var(--secondary-color)' }} />
                                Edit Patient Profile
                            </h3>
                            <button className="hms-modal-close" onClick={() => setIsEditOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px', borderRadius: '6px' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="hms-modal-body" style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                            {errorMsg && <div className="alert alert-danger" style={{ marginBottom: '16px' }}>{errorMsg}</div>}
                            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <InputField
                                    label="Patient Full Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Ahmed Khan"
                                    error={formErrors.name}
                                    required
                                />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <InputField
                                        label="Phone Number"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 03001234567"
                                        error={formErrors.phone}
                                        required
                                    />
                                    <InputField
                                        label="Email Address"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="e.g. patient@care.com"
                                        error={formErrors.email}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                                    <InputField
                                        label="Date of Birth"
                                        name="date_of_birth"
                                        type="date"
                                        value={formData.date_of_birth}
                                        onChange={handleInputChange}
                                        error={formErrors.date_of_birth}
                                        required
                                    />
                                    <div className="form-group">
                                        <label className="form-label">Gender</label>
                                        <select
                                            name="gender"
                                            className="hms-select"
                                            value={formData.gender}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', height: '42px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.85rem', background: 'var(--card-bg)', color: 'var(--text-primary)' }}
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Blood Group</label>
                                        <select
                                            name="blood_group"
                                            className="hms-select"
                                            value={formData.blood_group}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', height: '42px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.85rem', background: 'var(--card-bg)', color: 'var(--text-primary)' }}
                                        >
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                        </select>
                                    </div>
                                </div>
                                <InputField
                                    label="CNIC / ID Number"
                                    name="cnic"
                                    value={formData.cnic}
                                    onChange={handleInputChange}
                                    placeholder="e.g. 42101-1234567-1"
                                />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <InputField
                                        label="Emergency Contact Name"
                                        name="emergency_contact"
                                        value={formData.emergency_contact}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Sara Khan (Wife)"
                                    />
                                    <InputField
                                        label="Emergency Contact Phone"
                                        name="emergency_phone"
                                        value={formData.emergency_phone}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 0300-9876543"
                                    />
                                </div>
                                <InputField
                                    label="Residential Address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Flat 402, Block C, Gulshan-e-Iqbal, Karachi"
                                />
                                <div className="form-group">
                                    <label className="form-label">Medical History / Allergies / Notes</label>
                                    <textarea
                                        name="medical_history"
                                        className="input-control"
                                        value={formData.medical_history}
                                        onChange={handleInputChange}
                                        placeholder="Enter details like Penicillin allergy, Hypertension, previous surgeries..."
                                        style={{ minHeight: '70px', width: '100%', padding: '10px', fontFamily: 'var(--font-family)', fontSize: '0.85rem', border: '1.5px solid var(--border-color)', borderRadius: '8px', background: 'var(--card-bg)', color: 'var(--text-primary)', resize: 'vertical' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select
                                        name="status"
                                        className="hms-select"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', height: '42px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.85rem', background: 'var(--card-bg)', color: 'var(--text-primary)' }}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                        <option value="Discharged">Discharged</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div className="hms-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '14px 20px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
                            <button
                                onClick={() => setIsEditOpen(false)}
                                style={{
                                    padding: '8px 20px',
                                    border: '1.5px solid var(--border-color)',
                                    borderRadius: '8px',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'var(--text-secondary)',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => { e.target.style.background = 'var(--hover-bg)'; }}
                                onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditSubmit}
                                disabled={actionLoading}
                                style={{
                                    padding: '8px 20px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    background: 'var(--primary-color)',
                                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.85rem',
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
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!actionLoading) {
                                        e.target.style.background = 'var(--primary-color)';
                                    }
                                }}
                            >
                                <Save size={16} />
                                {actionLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== DELETE CONFIRMATION MODAL ===== */}
            {isDeleteOpen && (
                <div className="hms-modal-backdrop" onClick={() => setIsDeleteOpen(false)}>
                    <div className="hms-modal small" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="hms-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
                            <h3 className="hms-modal-title" style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, color: 'var(--danger-color)' }}>
                                Delete Patient Record
                            </h3>
                            <button className="hms-modal-close" onClick={() => setIsDeleteOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px', borderRadius: '6px' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="hms-modal-body" style={{ padding: '24px', textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚠️</div>
                            <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
                                Are you absolutely sure?
                            </p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                This will permanently delete <strong>{selectedPatient?.name}</strong>'s medical record, files, and billing history from the system.
                            </p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '8px' }}>
                                This action cannot be undone.
                            </p>
                        </div>
                        <div className="hms-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '14px 20px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
                            <button
                                onClick={() => setIsDeleteOpen(false)}
                                style={{
                                    padding: '8px 20px',
                                    border: '1.5px solid var(--border-color)',
                                    borderRadius: '8px',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'var(--text-secondary)',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => { e.target.style.background = 'var(--hover-bg)'; }}
                                onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteSubmit}
                                disabled={actionLoading}
                                style={{
                                    padding: '8px 20px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    background: 'var(--danger-color)',
                                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.85rem',
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
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!actionLoading) {
                                        e.target.style.background = 'var(--danger-color)';
                                    }
                                }}
                            >
                                <Trash2 size={16} />
                                {actionLoading ? 'Deleting...' : 'Delete Patient'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== VIEW DETAILS / PROFILE CARD MODAL ===== */}
            {isDetailOpen && selectedPatient && (
                <div className="hms-modal-backdrop" onClick={() => setIsDetailOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{
                        maxWidth: '820px',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'var(--card-bg)',
                        borderRadius: '16px',
                        boxShadow: 'var(--shadow-xl)',
                        border: '1px solid var(--border-color)',
                        width: '100%',
                        margin: '16px',
                        overflow: 'hidden'
                    }}>
                        {/* Modal Header */}
                        <div className="hms-modal-header" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '16px 20px',
                            borderBottom: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            flexShrink: 0
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <button
                                    onClick={() => setIsDetailOpen(false)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-secondary)',
                                        padding: '4px',
                                        borderRadius: '6px',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                    onMouseEnter={(e) => { e.target.style.background = 'var(--hover-bg)'; }}
                                    onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
                                >
                                    <X size={20} />
                                </button>
                                <h3 className="hms-modal-title" style={{
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    margin: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: 'var(--text-primary)'
                                }}>
                                    <User size={20} style={{ color: 'var(--primary-color)' }} />
                                    Patient Profile
                                </h3>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                    onClick={() => window.print()}
                                    style={{
                                        padding: '6px 12px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '6px',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        fontSize: '0.7rem',
                                        color: 'var(--text-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                    onMouseEnter={(e) => { e.target.style.background = 'var(--hover-bg)'; }}
                                    onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
                                >
                                    <Printer size={14} /> Print
                                </button>
                                <button
                                    onClick={() => {
                                        setIsDetailOpen(false);
                                        openEditModal(selectedPatient);
                                    }}
                                    style={{
                                        padding: '6px 14px',
                                        border: 'none',
                                        borderRadius: '6px',
                                        background: 'var(--primary-color)',
                                        cursor: 'pointer',
                                        fontSize: '0.7rem',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                    onMouseEnter={(e) => { e.target.style.background = 'var(--primary-hover)'; }}
                                    onMouseLeave={(e) => { e.target.style.background = 'var(--primary-color)'; }}
                                >
                                    <Edit2 size={14} /> Edit
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="hms-modal-body" style={{
                            padding: '20px',
                            overflowY: 'auto',
                            flex: 1,
                            background: 'var(--bg-primary)'
                        }}>
                            {renderDetailContent()}
                        </div>

                        {/* Modal Footer */}
                        <div className="hms-modal-footer" style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '10px',
                            padding: '14px 20px',
                            borderTop: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            flexShrink: 0
                        }}>
                            <button
                                onClick={() => setIsDetailOpen(false)}
                                style={{
                                    padding: '8px 20px',
                                    border: '1.5px solid var(--border-color)',
                                    borderRadius: '8px',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'var(--text-secondary)',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => { e.target.style.background = 'var(--hover-bg)'; }}
                                onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    setIsDetailOpen(false);
                                    openEditModal(selectedPatient);
                                }}
                                style={{
                                    padding: '8px 20px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    background: 'var(--primary-color)',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'white',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => { e.target.style.background = 'var(--primary-hover)'; }}
                                onMouseLeave={(e) => { e.target.style.background = 'var(--primary-color)'; }}
                            >
                                <Edit2 size={16} /> Edit Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .spinner {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @media print {
                    .hms-modal-backdrop {
                        background: white !important;
                    }
                    .hms-modal {
                        box-shadow: none !important;
                        border: none !important;
                    }
                    .hms-modal-footer,
                    .hms-modal-header button:not(.hms-modal-title) {
                        display: none !important;
                    }
                }
                @media (max-width: 768px) {
                    .patient-detail-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .profile-card-details {
                        border-right: none !important;
                        border-bottom: 1px solid var(--border-color) !important;
                        padding-bottom: 20px !important;
                    }
                }
                @media (max-width: 480px) {
                    .hms-modal {
                        max-width: 95% !important;
                        margin: 8px !important;
                    }
                    .hms-modal-body {
                        padding: 12px !important;
                    }
                }
            `}</style>
        </DashboardLayout>
    );
};

export default Patients;