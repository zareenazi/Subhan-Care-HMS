import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, FileText, X, User, Heart, Calendar,
    Clock, ChevronDown, Filter, Eye, Printer,
    Stethoscope, Pill, AlertCircle, CheckCircle,
    Clock as ClockIcon, ArrowUpDown, Trash2, Edit2,
    ArrowLeft, Activity, RefreshCw, Save
} from 'lucide-react';

const Prescriptions = () => {
    const navigate = useNavigate();
    const [prescriptions, setPrescriptions] = useState([]);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [doctorFilter, setDoctorFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState('newest');

    // ===== MODAL STATES =====
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedPresc, setSelectedPresc] = useState(null);

    // ===== FORM STATE =====
    const [formData, setFormData] = useState({
        patient_id: '',
        doctor_id: '',
        diagnosis: '',
        medications: '',
        instructions: '',
        status: 'active'
    });

    const [formErrors, setFormErrors] = useState({});
    const [actionLoading, setActionLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // ===== GO BACK =====
    const goBack = () => {
        navigate(-1);
    };

    // ===== OPEN MODALS =====
    const openAddModal = () => {
        setFormData({
            patient_id: '',
            doctor_id: '',
            diagnosis: '',
            medications: '',
            instructions: '',
            status: 'active'
        });
        setFormErrors({});
        setErrorMsg('');
        setSuccessMsg('');
        setIsAddOpen(true);
    };

    const openEditModal = (presc) => {
        setSelectedPresc(presc);
        setFormData({
            patient_id: presc.patient_id || '',
            doctor_id: presc.doctor_id || '',
            diagnosis: presc.diagnosis || '',
            medications: presc.medications || '',
            instructions: presc.instructions || '',
            status: presc.status || 'active'
        });
        setFormErrors({});
        setErrorMsg('');
        setSuccessMsg('');
        setIsEditOpen(true);
    };

    const openViewModal = (presc) => {
        setSelectedPresc(presc);
        setIsViewOpen(true);
    };

    const openDeleteModal = (presc) => {
        setSelectedPresc(presc);
        setIsDeleteOpen(true);
    };

    // ===== LOAD DATA =====
    const loadData = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            // Load prescriptions
            const { data: prescData, error: prescError } = await supabase
                .from('prescriptions')
                .select('*')
                .order('created_at', { ascending: false });

            if (prescError) {
                console.error('Error loading prescriptions:', prescError);
                setErrorMsg('Failed to load prescriptions: ' + prescError.message);
                setPrescriptions([]);
            } else {
                console.log('✅ Prescriptions loaded:', prescData);

                // Load patients
                const { data: patData, error: patError } = await supabase
                    .from('patients')
                    .select('id, name, phone');

                if (patError) {
                    console.error('Error loading patients:', patError);
                }

                // Load doctors
                const { data: docData, error: docError } = await supabase
                    .from('doctors')
                    .select('id, name, specialization');

                if (docError) {
                    console.error('Error loading doctors:', docError);
                }

                // Enrich prescriptions
                const enrichedPrescriptions = (prescData || []).map(presc => {
                    const patient = patData?.find(p => p.id === presc.patient_id);
                    const doctor = docData?.find(d => d.id === presc.doctor_id);
                    return {
                        ...presc,
                        patients: patient || { name: 'Unknown Patient', phone: '' },
                        doctors: doctor || { name: 'Unknown Doctor', specialization: '' }
                    };
                });

                console.log('📋 Enriched prescriptions:', enrichedPrescriptions);
                setPrescriptions(enrichedPrescriptions);
                setPatients(patData || []);
                setDoctors(docData || []);
            }

        } catch (err) {
            console.error('Error loading data:', err);
            setErrorMsg('Failed to load data: ' + err.message);
            setPrescriptions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // ===== HANDLE FORM CHANGE =====
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    // ===== VALIDATE FORM =====
    const validateForm = () => {
        const errors = {};
        if (!formData.patient_id) errors.patient_id = 'Please select a patient';
        if (!formData.doctor_id) errors.doctor_id = 'Please select a prescribing doctor';
        if (!formData.medications.trim()) errors.medications = 'Please input medications';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // ===== CREATE PRESCRIPTION =====
    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setActionLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            console.log('📝 Creating prescription with data:', formData);

            const { data, error } = await supabase
                .from('prescriptions')
                .insert([{
                    patient_id: formData.patient_id,
                    doctor_id: formData.doctor_id,
                    diagnosis: formData.diagnosis || null,
                    medications: formData.medications,
                    instructions: formData.instructions || null,
                    status: formData.status || 'active',
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) {
                console.error('Error creating prescription:', error);
                setErrorMsg('Failed to create prescription: ' + error.message);
                return;
            }

            console.log('✅ Prescription created:', data);
            setSuccessMsg('✅ Prescription issued successfully!');
            setIsAddOpen(false);
            await loadData();
            window.dispatchEvent(new Event('prescriptionAdded'));

        } catch (err) {
            console.error('Error issuing prescription:', err);
            setErrorMsg('Error issuing prescription: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // ===== UPDATE PRESCRIPTION =====
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setActionLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            console.log('📝 Updating prescription:', selectedPresc.id, formData);

            const { data, error } = await supabase
                .from('prescriptions')
                .update({
                    patient_id: formData.patient_id,
                    doctor_id: formData.doctor_id,
                    diagnosis: formData.diagnosis || null,
                    medications: formData.medications,
                    instructions: formData.instructions || null,
                    status: formData.status || 'active',
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedPresc.id)
                .select();

            if (error) {
                console.error('Error updating prescription:', error);
                setErrorMsg('Failed to update prescription: ' + error.message);
                return;
            }

            console.log('✅ Prescription updated:', data);
            setSuccessMsg('✅ Prescription updated successfully!');
            setIsEditOpen(false);
            await loadData();
            window.dispatchEvent(new Event('prescriptionUpdated'));

        } catch (err) {
            console.error('Error updating prescription:', err);
            setErrorMsg('Error updating prescription: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // ===== DELETE PRESCRIPTION =====
    const handleDeleteSubmit = async () => {
        setActionLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            console.log('🗑️ Deleting prescription:', selectedPresc.id);

            const { error } = await supabase
                .from('prescriptions')
                .delete()
                .eq('id', selectedPresc.id);

            if (error) {
                console.error('Error deleting prescription:', error);
                setErrorMsg('Failed to delete prescription: ' + error.message);
                return;
            }

            console.log('✅ Prescription deleted');
            setSuccessMsg('✅ Prescription deleted successfully!');
            setIsDeleteOpen(false);
            await loadData();
            window.dispatchEvent(new Event('prescriptionDeleted'));

        } catch (err) {
            console.error('Error deleting prescription:', err);
            setErrorMsg('Error deleting prescription: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // ===== FILTERED PRESCRIPTIONS =====
    const filtered = prescriptions.filter(presc => {
        const patientName = presc.patients?.name || '';
        const doctorName = presc.doctors?.name || '';
        const matchesSearch = patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doctorName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDoctor = doctorFilter === '' || presc.doctor_id === doctorFilter;
        const matchesDate = dateFilter === '' ||
            new Date(presc.created_at).toDateString() === new Date(dateFilter).toDateString();
        return matchesSearch && matchesDoctor && matchesDate;
    });

    // ===== SORT PRESCRIPTIONS =====
    const sortedPrescriptions = [...filtered].sort((a, b) => {
        if (sortBy === 'newest') {
            return new Date(b.created_at) - new Date(a.created_at);
        } else if (sortBy === 'oldest') {
            return new Date(a.created_at) - new Date(b.created_at);
        } else if (sortBy === 'patient') {
            return (a.patients?.name || '').localeCompare(b.patients?.name || '');
        } else if (sortBy === 'doctor') {
            return (a.doctors?.name || '').localeCompare(b.doctors?.name || '');
        }
        return 0;
    });

    // ===== CLEAR FILTERS =====
    const clearFilters = () => {
        setSearchQuery('');
        setDoctorFilter('');
        setDateFilter('');
        setSortBy('newest');
        setShowFilters(false);
    };

    const activeFilterCount = (searchQuery ? 1 : 0) + (doctorFilter ? 1 : 0) + (dateFilter ? 1 : 0);

    const statusColors = {
        primary: '#2563EB',
        success: '#22C55E',
        danger: '#EF4444',
        warning: '#F59E0B',
        purple: '#8B5CF6',
        pink: '#EC4899',
        teal: '#14B8A6'
    };

    const getStatusBadge = (presc) => {
        const now = new Date();
        const created = new Date(presc.created_at);
        const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));

        if (diffDays <= 7) {
            return {
                label: 'Active',
                color: statusColors.success,
                bg: '#22C55E15'
            };
        } else if (diffDays <= 30) {
            return {
                label: 'Recent',
                color: statusColors.warning,
                bg: '#F59E0B15'
            };
        } else {
            return {
                label: 'Old',
                color: statusColors.danger,
                bg: '#EF444415'
            };
        }
    };

    return (
        <DashboardLayout active="prescriptions" title="Prescriptions">
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
                        <FileText size={24} style={{ color: 'var(--primary-color)' }} />
                        Prescriptions
                    </h1>
                    <p style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        marginTop: '4px'
                    }}>
                        Manage and track all prescriptions issued to patients.
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
                        <Plus size={16} /> New Prescription
                    </button>
                </div>
            </div>

            {/* ===== STATS ===== */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '12px',
                marginBottom: '20px'
            }}>
                <div className="stat-card" style={{
                    padding: '16px 18px',
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
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
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: `${statusColors.purple}15`,
                        color: statusColors.purple,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <Pill size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>{prescriptions.length}</div>
                    </div>
                </div>

                <div className="stat-card" style={{
                    padding: '16px 18px',
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
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
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: `${statusColors.success}15`,
                        color: statusColors.success,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <User size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Patients</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>{patients.length}</div>
                    </div>
                </div>

                <div className="stat-card" style={{
                    padding: '16px 18px',
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
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
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: `${statusColors.primary}15`,
                        color: statusColors.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <Stethoscope size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Doctors</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>{doctors.length}</div>
                    </div>
                </div>

                <div className="stat-card" style={{
                    padding: '16px 18px',
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
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
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: `${statusColors.warning}15`,
                        color: statusColors.warning,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <Activity size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {prescriptions.filter(p => {
                                const now = new Date();
                                const created = new Date(p.created_at);
                                const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
                                return diffDays <= 7;
                            }).length}
                        </div>
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
                padding: '12px 16px',
                background: 'var(--card-bg)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: '16px'
            }}>
                <div className="hms-search-box" style={{ flex: 1, minWidth: '160px', position: 'relative' }}>
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
                            height: '36px',
                            padding: '6px 12px 6px 34px',
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
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 12px',
                            height: '36px',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '10px',
                            background: 'var(--bg-primary)',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
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
                            padding: '5px 14px',
                            height: '36px',
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
                        <Plus size={14} /> New Prescription
                    </button>
                </div>
            </div>

            {/* ===== FILTERS BAR ===== */}
            {showFilters && (
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    padding: '12px 16px',
                    background: 'var(--bg-primary)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    marginBottom: '16px',
                    alignItems: 'center'
                }}>
                    <select
                        value={doctorFilter}
                        onChange={(e) => setDoctorFilter(e.target.value)}
                        style={{
                            height: '34px',
                            padding: '0 12px',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-family)',
                            background: 'var(--card-bg)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            cursor: 'pointer',
                            minWidth: '120px'
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
                            height: '34px',
                            padding: '0 12px',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-family)',
                            background: 'var(--card-bg)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            minWidth: '140px'
                        }}
                    />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{
                            height: '34px',
                            padding: '0 12px',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-family)',
                            background: 'var(--card-bg)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            cursor: 'pointer',
                            minWidth: '110px'
                        }}
                    >
                        <option value="newest">📅 Newest</option>
                        <option value="oldest">📅 Oldest</option>
                        <option value="patient">👤 By Patient</option>
                        <option value="doctor">👨‍⚕️ By Doctor</option>
                    </select>
                    <button
                        onClick={clearFilters}
                        style={{
                            padding: '4px 12px',
                            height: '34px',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '8px',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
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
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {sortedPrescriptions.length} prescription{sortedPrescriptions.length !== 1 ? 's' : ''} found
                    </span>
                </div>
            )}

            {/* ===== TABLE ===== */}
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
                        Loading prescriptions...
                    </div>
                ) : sortedPrescriptions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>💊</div>
                        <h3 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>No Prescriptions Found</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            {activeFilterCount > 0 ? 'Try clearing your filters to see all prescriptions.' : 'Start by creating your first prescription.'}
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
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontFamily: 'var(--font-family)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'var(--primary-hover)'}
                            onMouseLeave={(e) => e.target.style.background = 'var(--primary-color)'}
                        >
                            <Plus size={16} /> First Prescription
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
                                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                        <Calendar size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Date
                                    </th>
                                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                        <User size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Patient
                                    </th>
                                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                        <Stethoscope size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Doctor
                                    </th>
                                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                        <Pill size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Medications
                                    </th>
                                    <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                        Status
                                    </th>
                                    <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedPrescriptions.map(presc => {
                                    const status = getStatusBadge(presc);
                                    return (
                                        <tr key={presc.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s ease' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '8px 14px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                                <ClockIcon size={11} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} />
                                                {new Date(presc.created_at).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '8px 14px', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                                                {presc.patients?.name || 'Unknown Patient'}
                                            </td>
                                            <td style={{ padding: '8px 14px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                                {presc.doctors?.name || 'Unknown Doctor'}
                                                {presc.doctors?.specialization && (
                                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                                                        {presc.doctors.specialization}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '8px 14px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                                                {presc.medications}
                                            </td>
                                            <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '2px 10px',
                                                    borderRadius: '20px',
                                                    fontSize: '0.65rem',
                                                    fontWeight: 600,
                                                    background: status.bg,
                                                    color: status.color,
                                                    border: `1px solid ${status.color}30`
                                                }}>
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '8px 14px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                                    <button
                                                        onClick={() => openViewModal(presc)}
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
                                                    <button
                                                        onClick={() => openEditModal(presc)}
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
                                                        onClick={() => openDeleteModal(presc)}
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
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ============================================================ */}
            {/* ===== ADD PRESCRIPTION MODAL ===== */}
            {/* ============================================================ */}
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
                            padding: '16px 20px',
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
                                <FileText size={18} style={{ color: 'var(--primary-color)' }} />
                                New Prescription
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
                            padding: '20px',
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
                            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {/* Patient */}
                                <div className="form-group" style={{ marginBottom: '0' }}>
                                    <label className="form-label" style={{
                                        display: 'block',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}><User size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--primary-color)' }} /> Patient *</label>
                                    <select
                                        name="patient_id"
                                        className="hms-select"
                                        value={formData.patient_id}
                                        onChange={handleFormChange}
                                        required
                                        style={{
                                            width: '100%',
                                            height: '40px',
                                            padding: '0 12px',
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
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.name} {p.phone ? `(${p.phone})` : ''}</option>)}
                                    </select>
                                    {formErrors.patient_id && <span className="error-text" style={{ fontSize: '0.75rem', color: 'var(--danger-color)' }}>{formErrors.patient_id}</span>}
                                </div>

                                {/* Doctor */}
                                <div className="form-group" style={{ marginBottom: '0' }}>
                                    <label className="form-label" style={{
                                        display: 'block',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}><Stethoscope size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--secondary-color)' }} /> Doctor *</label>
                                    <select
                                        name="doctor_id"
                                        className="hms-select"
                                        value={formData.doctor_id}
                                        onChange={handleFormChange}
                                        required
                                        style={{
                                            width: '100%',
                                            height: '40px',
                                            padding: '0 12px',
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
                                        {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.name} {d.specialization ? `(${d.specialization})` : ''}</option>)}
                                    </select>
                                    {formErrors.doctor_id && <span className="error-text" style={{ fontSize: '0.75rem', color: 'var(--danger-color)' }}>{formErrors.doctor_id}</span>}
                                </div>

                                {/* Diagnosis */}
                                <div className="form-group" style={{ marginBottom: '0' }}>
                                    <label className="form-label" style={{
                                        display: 'block',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}><FileText size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--warning-color, #F59E0B)' }} /> Diagnosis</label>
                                    <input
                                        type="text"
                                        name="diagnosis"
                                        className="input-control"
                                        value={formData.diagnosis}
                                        onChange={handleFormChange}
                                        placeholder="e.g. Upper Respiratory Tract Infection, Hypertension"
                                        style={{
                                            width: '100%',
                                            height: '40px',
                                            padding: '0 12px',
                                            fontFamily: 'var(--font-family)',
                                            fontSize: '0.8rem',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
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

                                {/* Medications */}
                                <div className="form-group" style={{ marginBottom: '0' }}>
                                    <label className="form-label" style={{
                                        display: 'block',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}><Pill size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--purple-color, #8B5CF6)' }} /> Medications & Dosages *</label>
                                    <textarea
                                        name="medications"
                                        className="input-control"
                                        value={formData.medications}
                                        onChange={handleFormChange}
                                        placeholder="e.g. Paracetamol 500mg - 1 tablet three times a day"
                                        required
                                        style={{
                                            minHeight: '70px',
                                            width: '100%',
                                            padding: '8px 12px',
                                            fontFamily: 'var(--font-family)',
                                            fontSize: '0.8rem',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            background: 'var(--card-bg)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            resize: 'vertical',
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
                                    {formErrors.medications && <span className="error-text" style={{ fontSize: '0.75rem', color: 'var(--danger-color)' }}>{formErrors.medications}</span>}
                                </div>

                                {/* Instructions */}
                                <div className="form-group" style={{ marginBottom: '0' }}>
                                    <label className="form-label" style={{
                                        display: 'block',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}><FileText size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Instructions / Notes</label>
                                    <textarea
                                        name="instructions"
                                        className="input-control"
                                        value={formData.instructions}
                                        onChange={handleFormChange}
                                        placeholder="e.g. Drink plenty of water, avoid driving if feeling dizzy..."
                                        style={{
                                            minHeight: '60px',
                                            width: '100%',
                                            padding: '8px 12px',
                                            fontFamily: 'var(--font-family)',
                                            fontSize: '0.8rem',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            background: 'var(--card-bg)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            resize: 'vertical',
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
                            </form>
                        </div>
                        <div className="hms-modal-footer" style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '8px',
                            padding: '14px 20px',
                            borderTop: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            borderRadius: '0 0 16px 16px'
                        }}>
                            <button
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
                                <FileText size={14} />
                                {actionLoading ? 'Issuing...' : 'Issue'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* ===== EDIT PRESCRIPTION MODAL ===== */}
            {/* ============================================================ */}
            {isEditOpen && selectedPresc && (
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
                            padding: '16px 20px',
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
                                Edit Prescription
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
                            padding: '20px',
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
                            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div className="form-group" style={{ marginBottom: '0' }}>
                                    <label className="form-label" style={{
                                        display: 'block',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}><User size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--primary-color)' }} /> Patient *</label>
                                    <select
                                        name="patient_id"
                                        className="hms-select"
                                        value={formData.patient_id}
                                        onChange={handleFormChange}
                                        required
                                        style={{
                                            width: '100%',
                                            height: '40px',
                                            padding: '0 12px',
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
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.name} {p.phone ? `(${p.phone})` : ''}</option>)}
                                    </select>
                                    {formErrors.patient_id && <span className="error-text" style={{ fontSize: '0.75rem', color: 'var(--danger-color)' }}>{formErrors.patient_id}</span>}
                                </div>

                                <div className="form-group" style={{ marginBottom: '0' }}>
                                    <label className="form-label" style={{
                                        display: 'block',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}><Stethoscope size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--secondary-color)' }} /> Doctor *</label>
                                    <select
                                        name="doctor_id"
                                        className="hms-select"
                                        value={formData.doctor_id}
                                        onChange={handleFormChange}
                                        required
                                        style={{
                                            width: '100%',
                                            height: '40px',
                                            padding: '0 12px',
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
                                        {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.name} {d.specialization ? `(${d.specialization})` : ''}</option>)}
                                    </select>
                                    {formErrors.doctor_id && <span className="error-text" style={{ fontSize: '0.75rem', color: 'var(--danger-color)' }}>{formErrors.doctor_id}</span>}
                                </div>

                                <div className="form-group" style={{ marginBottom: '0' }}>
                                    <label className="form-label" style={{
                                        display: 'block',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}><FileText size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--warning-color, #F59E0B)' }} /> Diagnosis</label>
                                    <input
                                        type="text"
                                        name="diagnosis"
                                        className="input-control"
                                        value={formData.diagnosis}
                                        onChange={handleFormChange}
                                        placeholder="e.g. Upper Respiratory Tract Infection, Hypertension"
                                        style={{
                                            width: '100%',
                                            height: '40px',
                                            padding: '0 12px',
                                            fontFamily: 'var(--font-family)',
                                            fontSize: '0.8rem',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
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
                                    }}><Pill size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--purple-color, #8B5CF6)' }} /> Medications & Dosages *</label>
                                    <textarea
                                        name="medications"
                                        className="input-control"
                                        value={formData.medications}
                                        onChange={handleFormChange}
                                        placeholder="e.g. Paracetamol 500mg - 1 tablet three times a day"
                                        required
                                        style={{
                                            minHeight: '70px',
                                            width: '100%',
                                            padding: '8px 12px',
                                            fontFamily: 'var(--font-family)',
                                            fontSize: '0.8rem',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            background: 'var(--card-bg)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            resize: 'vertical',
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
                                    {formErrors.medications && <span className="error-text" style={{ fontSize: '0.75rem', color: 'var(--danger-color)' }}>{formErrors.medications}</span>}
                                </div>

                                <div className="form-group" style={{ marginBottom: '0' }}>
                                    <label className="form-label" style={{
                                        display: 'block',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}><FileText size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Instructions / Notes</label>
                                    <textarea
                                        name="instructions"
                                        className="input-control"
                                        value={formData.instructions}
                                        onChange={handleFormChange}
                                        placeholder="e.g. Drink plenty of water, avoid driving if feeling dizzy..."
                                        style={{
                                            minHeight: '60px',
                                            width: '100%',
                                            padding: '8px 12px',
                                            fontFamily: 'var(--font-family)',
                                            fontSize: '0.8rem',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            background: 'var(--card-bg)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            resize: 'vertical',
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
                            </form>
                        </div>
                        <div className="hms-modal-footer" style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '8px',
                            padding: '14px 20px',
                            borderTop: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            borderRadius: '0 0 16px 16px'
                        }}>
                            <button
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
                                onClick={handleEditSubmit}
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
                                <Save size={14} />
                                {actionLoading ? 'Saving...' : 'Update'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* ===== VIEW PRESCRIPTION MODAL ===== */}
            {/* ============================================================ */}
            {isViewOpen && selectedPresc && (
                <div className="hms-modal-backdrop" onClick={() => setIsViewOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{
                        maxWidth: '600px',
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
                            padding: '16px 20px',
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
                                <FileText size={18} style={{ color: 'var(--primary-color)' }} />
                                Prescription Details
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
                            padding: '20px',
                            overflowY: 'auto',
                            flex: 1,
                            fontFamily: 'var(--font-family)'
                        }}>
                            <div style={{
                                borderBottom: '2px solid var(--border-color)',
                                paddingBottom: '14px',
                                marginBottom: '16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '10px'
                            }}>
                                <div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-color)' }}>🏥 Subhan Care Clinic</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ph: +92-51-1234567 | Sector G-8, Islamabad</div>
                                </div>
                                <div style={{
                                    padding: '3px 12px',
                                    borderRadius: '20px',
                                    background: 'rgba(37, 99, 235, 0.08)',
                                    color: 'var(--primary-color)',
                                    fontSize: '0.65rem',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Prescription
                                </div>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '12px',
                                marginBottom: '16px',
                                fontSize: '0.8rem'
                            }}>
                                <div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block', marginBottom: '2px' }}>
                                        <User size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--primary-color)' }} /> Patient
                                    </span>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedPresc.patients?.name || 'Unknown'}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block', marginBottom: '2px' }}>
                                        <Calendar size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Date
                                    </span>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{new Date(selectedPresc.created_at).toLocaleDateString()}</div>
                                </div>
                                <div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block', marginBottom: '2px' }}>
                                        <Stethoscope size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--secondary-color)' }} /> Doctor
                                    </span>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedPresc.doctors?.name || 'Consultant'}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block', marginBottom: '2px' }}>
                                        <FileText size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> ID
                                    </span>
                                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>#RX-{selectedPresc.id?.slice(0, 6).toUpperCase() || 'N/A'}</div>
                                </div>
                            </div>

                            {selectedPresc.diagnosis && (
                                <div style={{
                                    borderTop: '1px solid var(--border-color)',
                                    paddingTop: '14px',
                                    marginBottom: '14px'
                                }}>
                                    <h4 style={{
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        marginBottom: '6px',
                                        color: 'var(--text-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <FileText size={16} style={{ color: 'var(--warning-color, #F59E0B)' }} /> Diagnosis
                                    </h4>
                                    <div style={{
                                        background: 'var(--bg-primary)',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        fontSize: '0.85rem',
                                        color: 'var(--text-primary)'
                                    }}>
                                        {selectedPresc.diagnosis}
                                    </div>
                                </div>
                            )}

                            <div style={{
                                borderTop: '1px solid var(--border-color)',
                                paddingTop: '14px',
                                marginBottom: '14px'
                            }}>
                                <h4 style={{
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    marginBottom: '6px',
                                    color: 'var(--primary-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    <Pill size={16} style={{ color: 'var(--purple-color, #8B5CF6)' }} /> Medications
                                </h4>
                                <div style={{
                                    background: 'var(--bg-primary)',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)',
                                    fontSize: '0.85rem',
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: '1.6',
                                    color: 'var(--text-primary)'
                                }}>
                                    {selectedPresc.medications}
                                </div>
                            </div>

                            {selectedPresc.instructions && (
                                <div>
                                    <h4 style={{
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        marginBottom: '6px',
                                        color: 'var(--text-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <FileText size={16} style={{ color: 'var(--warning-color, #F59E0B)' }} /> Instructions
                                    </h4>
                                    <div style={{
                                        fontSize: '0.8rem',
                                        color: 'var(--text-secondary)',
                                        lineHeight: '1.5',
                                        background: 'var(--bg-primary)',
                                        padding: '10px',
                                        borderRadius: '10px',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        {selectedPresc.instructions}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="hms-modal-footer" style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '8px',
                            padding: '14px 20px',
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
                            <button
                                onClick={() => window.print()}
                                style={{
                                    padding: '6px 16px',
                                    border: 'none',
                                    borderRadius: '10px',
                                    background: 'var(--primary-color)',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'white',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
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
                                <Printer size={14} /> Print
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* ===== DELETE CONFIRMATION MODAL ===== */}
            {/* ============================================================ */}
            {isDeleteOpen && selectedPresc && (
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
                                Delete Prescription
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
                                Are you sure you want to delete this prescription?
                            </p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                Patient: <strong>{selectedPresc.patients?.name || 'Unknown'}</strong>
                                <br />
                                Medications: <strong>{selectedPresc.medications?.substring(0, 50)}...</strong>
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

export default Prescriptions;