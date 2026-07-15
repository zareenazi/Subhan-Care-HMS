import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Plus, Search, FileText, X, User, Heart, Calendar,
    Clock, Filter, Eye, Trash2, Edit2,
    ArrowLeft, Activity, RefreshCw, Save,
    Thermometer, Droplets, Weight, Ruler, Brain, AlertCircle,
    CheckCircle, Stethoscope, TrendingUp, TrendingDown,
    Users, Download, Printer, Shield, BarChart3
} from 'lucide-react';

const Vitals = () => {
    const navigate = useNavigate();
    const { user, role } = useAuth();
    const [vitals, setVitals] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [patientFilter, setPatientFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState('newest');

    // ===== ROLE-BASED ACCESS =====
    const canAdd = ['Admin', 'Doctor', 'Nurse'].includes(role);
    const canEdit = ['Admin', 'Doctor', 'Nurse'].includes(role);
    const canDelete = ['Admin'].includes(role);

    // ===== STATS STATE =====
    const [stats, setStats] = useState({
        totalVitals: 0,
        normalVitals: 0,
        abnormalVitals: 0,
        patientsWithVitals: 0,
        todayVitals: 0,
        avgHeartRate: 0,
        avgBPSystolic: 0,
        avgTemperature: 0
    });

    // ===== MODAL STATES =====
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedVital, setSelectedVital] = useState(null);

    // ===== FORM STATE =====
    const [formData, setFormData] = useState({
        patient_id: '',
        patient_name: '',
        blood_pressure_systolic: '',
        blood_pressure_diastolic: '',
        heart_rate: '',
        temperature: '',
        weight: '',
        height: '',
        bmi: '',
        oxygen_saturation: '',
        blood_sugar: '',
        respiratory_rate: '',
        notes: '',
        recorded_at: new Date().toISOString().split('T')[0]
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
        if (!canAdd) {
            setErrorMsg('You do not have permission to add vital signs.');
            return;
        }
        setFormData({
            patient_id: '',
            patient_name: '',
            blood_pressure_systolic: '',
            blood_pressure_diastolic: '',
            heart_rate: '',
            temperature: '',
            weight: '',
            height: '',
            bmi: '',
            oxygen_saturation: '',
            blood_sugar: '',
            respiratory_rate: '',
            notes: '',
            recorded_at: new Date().toISOString().split('T')[0]
        });
        setFormErrors({});
        setErrorMsg('');
        setSuccessMsg('');
        setIsAddOpen(true);
    };

    const openEditModal = (vital) => {
        if (!canEdit) {
            setErrorMsg('You do not have permission to edit vital signs.');
            return;
        }
        setSelectedVital(vital);
        setFormData({
            patient_id: vital.patient_id || '',
            patient_name: vital.patients?.name || '',
            blood_pressure_systolic: vital.blood_pressure_systolic || '',
            blood_pressure_diastolic: vital.blood_pressure_diastolic || '',
            heart_rate: vital.heart_rate || '',
            temperature: vital.temperature || '',
            weight: vital.weight || '',
            height: vital.height || '',
            bmi: vital.bmi || '',
            oxygen_saturation: vital.oxygen_saturation || '',
            blood_sugar: vital.blood_sugar || '',
            respiratory_rate: vital.respiratory_rate || '',
            notes: vital.notes || '',
            recorded_at: vital.recorded_at || new Date().toISOString().split('T')[0]
        });
        setFormErrors({});
        setErrorMsg('');
        setSuccessMsg('');
        setIsEditOpen(true);
    };

    const openViewModal = (vital) => {
        setSelectedVital(vital);
        setIsViewOpen(true);
    };

    const openDeleteModal = (vital) => {
        if (!canDelete) {
            setErrorMsg('You do not have permission to delete vital signs.');
            return;
        }
        setSelectedVital(vital);
        setIsDeleteOpen(true);
    };

    // ===== CALCULATE STATS =====
    const calculateStats = (vitalsData) => {
        const total = vitalsData.length;
        if (total === 0) {
            setStats({
                totalVitals: 0,
                normalVitals: 0,
                abnormalVitals: 0,
                patientsWithVitals: 0,
                todayVitals: 0,
                avgHeartRate: 0,
                avgBPSystolic: 0,
                avgTemperature: 0
            });
            return;
        }

        let normal = 0;
        let abnormal = 0;
        let totalHR = 0;
        let totalBP = 0;
        let totalTemp = 0;
        let hrCount = 0;
        let bpCount = 0;
        let tempCount = 0;
        const uniquePatients = new Set();
        const today = new Date().toDateString();

        vitalsData.forEach(v => {
            uniquePatients.add(v.patient_id);

            const bp = v.blood_pressure_systolic;
            const hr = v.heart_rate;
            const temp = v.temperature;
            const o2 = v.oxygen_saturation;

            const isNormal = !(bp > 140 || bp < 90 || hr > 100 || hr < 60 || temp > 38 || o2 < 95);

            if (isNormal) {
                normal++;
            } else {
                abnormal++;
            }

            if (hr) { totalHR += hr; hrCount++; }
            if (bp) { totalBP += bp; bpCount++; }
            if (temp) { totalTemp += temp; tempCount++; }
        });

        const todayVitals = vitalsData.filter(v =>
            new Date(v.recorded_at).toDateString() === today
        ).length;

        setStats({
            totalVitals: total,
            normalVitals: normal,
            abnormalVitals: abnormal,
            patientsWithVitals: uniquePatients.size,
            todayVitals: todayVitals,
            avgHeartRate: hrCount > 0 ? Math.round(totalHR / hrCount) : 0,
            avgBPSystolic: bpCount > 0 ? Math.round(totalBP / bpCount) : 0,
            avgTemperature: tempCount > 0 ? (totalTemp / tempCount).toFixed(1) : 0
        });
    };

    // ===== LOAD DATA =====
    const loadData = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const { data: vitalsData, error: vitalsError } = await supabase
                .from('vitals')
                .select('*')
                .order('recorded_at', { ascending: false });

            if (vitalsError) {
                console.error('Error loading vitals:', vitalsError);
                setErrorMsg('Failed to load vitals: ' + vitalsError.message);
                setVitals([]);
            } else {
                console.log('✅ Vitals loaded:', vitalsData);

                const { data: patData, error: patError } = await supabase
                    .from('patients')
                    .select('id, name, phone, age, gender');

                if (patError) {
                    console.error('Error loading patients:', patError);
                }

                const enrichedVitals = (vitalsData || []).map(vital => {
                    const patient = patData?.find(p => p.id === vital.patient_id);
                    return {
                        ...vital,
                        patients: patient || { name: 'Unknown Patient', phone: '', age: '', gender: '' }
                    };
                });

                setVitals(enrichedVitals);
                setPatients(patData || []);
                calculateStats(enrichedVitals);
            }

        } catch (err) {
            console.error('Error loading data:', err);
            setErrorMsg('Failed to load data: ' + err.message);
            setVitals([]);
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

        if (name === 'weight' || name === 'height') {
            const weight = parseFloat(name === 'weight' ? value : formData.weight);
            const height = parseFloat(name === 'height' ? value : formData.height);
            if (weight > 0 && height > 0) {
                const heightInMeters = height / 100;
                const bmi = weight / (heightInMeters * heightInMeters);
                if (!isNaN(bmi) && isFinite(bmi)) {
                    setFormData(prev => ({ ...prev, bmi: bmi.toFixed(1) }));
                }
            }
        }
    };

    // ===== VALIDATE FORM =====
    const validateForm = () => {
        const errors = {};
        if (!formData.patient_id) errors.patient_id = 'Please select a patient';
        if (!formData.blood_pressure_systolic && !formData.heart_rate) {
            errors.vitals = 'Please enter at least one vital sign';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // ===== CREATE VITAL =====
    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setActionLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const { data, error } = await supabase
                .from('vitals')
                .insert([{
                    patient_id: formData.patient_id,
                    blood_pressure_systolic: formData.blood_pressure_systolic ? parseInt(formData.blood_pressure_systolic) : null,
                    blood_pressure_diastolic: formData.blood_pressure_diastolic ? parseInt(formData.blood_pressure_diastolic) : null,
                    heart_rate: formData.heart_rate ? parseInt(formData.heart_rate) : null,
                    temperature: formData.temperature ? parseFloat(formData.temperature) : null,
                    weight: formData.weight ? parseFloat(formData.weight) : null,
                    height: formData.height ? parseFloat(formData.height) : null,
                    bmi: formData.bmi ? parseFloat(formData.bmi) : null,
                    oxygen_saturation: formData.oxygen_saturation ? parseInt(formData.oxygen_saturation) : null,
                    blood_sugar: formData.blood_sugar ? parseInt(formData.blood_sugar) : null,
                    respiratory_rate: formData.respiratory_rate ? parseInt(formData.respiratory_rate) : null,
                    notes: formData.notes || null,
                    recorded_at: formData.recorded_at || new Date().toISOString().split('T')[0],
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) {
                console.error('Error creating vital:', error);
                setErrorMsg('Failed to create vital: ' + error.message);
                return;
            }

            console.log('✅ Vital created:', data);
            setSuccessMsg('✅ Vital signs recorded successfully!');
            setIsAddOpen(false);
            await loadData();
            window.dispatchEvent(new Event('vitalAdded'));

        } catch (err) {
            console.error('Error recording vitals:', err);
            setErrorMsg('Error recording vitals: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // ===== UPDATE VITAL =====
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setActionLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const { data, error } = await supabase
                .from('vitals')
                .update({
                    patient_id: formData.patient_id,
                    blood_pressure_systolic: formData.blood_pressure_systolic ? parseInt(formData.blood_pressure_systolic) : null,
                    blood_pressure_diastolic: formData.blood_pressure_diastolic ? parseInt(formData.blood_pressure_diastolic) : null,
                    heart_rate: formData.heart_rate ? parseInt(formData.heart_rate) : null,
                    temperature: formData.temperature ? parseFloat(formData.temperature) : null,
                    weight: formData.weight ? parseFloat(formData.weight) : null,
                    height: formData.height ? parseFloat(formData.height) : null,
                    bmi: formData.bmi ? parseFloat(formData.bmi) : null,
                    oxygen_saturation: formData.oxygen_saturation ? parseInt(formData.oxygen_saturation) : null,
                    blood_sugar: formData.blood_sugar ? parseInt(formData.blood_sugar) : null,
                    respiratory_rate: formData.respiratory_rate ? parseInt(formData.respiratory_rate) : null,
                    notes: formData.notes || null,
                    recorded_at: formData.recorded_at || new Date().toISOString().split('T')[0],
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedVital.id)
                .select();

            if (error) {
                console.error('Error updating vital:', error);
                setErrorMsg('Failed to update vital: ' + error.message);
                return;
            }

            console.log('✅ Vital updated:', data);
            setSuccessMsg('✅ Vital signs updated successfully!');
            setIsEditOpen(false);
            await loadData();
            window.dispatchEvent(new Event('vitalUpdated'));

        } catch (err) {
            console.error('Error updating vitals:', err);
            setErrorMsg('Error updating vitals: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // ===== DELETE VITAL =====
    const handleDeleteSubmit = async () => {
        setActionLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const { error } = await supabase
                .from('vitals')
                .delete()
                .eq('id', selectedVital.id);

            if (error) {
                console.error('Error deleting vital:', error);
                setErrorMsg('Failed to delete vital: ' + error.message);
                return;
            }

            console.log('✅ Vital deleted');
            setSuccessMsg('✅ Vital signs deleted successfully!');
            setIsDeleteOpen(false);
            await loadData();
            window.dispatchEvent(new Event('vitalDeleted'));

        } catch (err) {
            console.error('Error deleting vitals:', err);
            setErrorMsg('Error deleting vitals: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // ===== CHECK IF VITAL IS NORMAL =====
    const isVitalNormal = (vital) => {
        const bp = vital.blood_pressure_systolic;
        const hr = vital.heart_rate;
        const temp = vital.temperature;
        const o2 = vital.oxygen_saturation;
        return !(bp > 140 || bp < 90 || hr > 100 || hr < 60 || temp > 38 || o2 < 95);
    };

    // ===== FILTERED VITALS =====
    const filtered = vitals.filter(vital => {
        const patientName = vital.patients?.name || '';
        const matchesSearch = patientName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPatient = patientFilter === '' || vital.patient_id === patientFilter;
        const matchesDate = dateFilter === '' ||
            new Date(vital.recorded_at).toDateString() === new Date(dateFilter).toDateString();
        const matchesStatus = statusFilter === '' ||
            (statusFilter === 'normal' && isVitalNormal(vital)) ||
            (statusFilter === 'abnormal' && !isVitalNormal(vital));
        return matchesSearch && matchesPatient && matchesDate && matchesStatus;
    });

    // ===== SORT VITALS =====
    const sortedVitals = [...filtered].sort((a, b) => {
        if (sortBy === 'newest') {
            return new Date(b.recorded_at) - new Date(a.recorded_at);
        } else if (sortBy === 'oldest') {
            return new Date(a.recorded_at) - new Date(b.recorded_at);
        } else if (sortBy === 'patient') {
            return (a.patients?.name || '').localeCompare(b.patients?.name || '');
        }
        return 0;
    });

    // ===== CLEAR FILTERS =====
    const clearFilters = () => {
        setSearchQuery('');
        setPatientFilter('');
        setDateFilter('');
        setStatusFilter('');
        setSortBy('newest');
        setShowFilters(false);
    };

    const activeFilterCount = (searchQuery ? 1 : 0) + (patientFilter ? 1 : 0) +
        (dateFilter ? 1 : 0) + (statusFilter ? 1 : 0);

    const getStatusColor = (vital) => {
        const bp = vital.blood_pressure_systolic;
        const hr = vital.heart_rate;
        const temp = vital.temperature;
        const o2 = vital.oxygen_saturation;

        if (bp > 140 || bp < 90 || hr > 100 || hr < 60 || temp > 38 || o2 < 95) {
            return { color: '#EF4444', label: 'Abnormal', bg: '#EF444415', icon: '⚠️' };
        }
        return { color: '#22C55E', label: 'Normal', bg: '#22C55E15', icon: '✅' };
    };

    const getRoleLabel = () => {
        switch (role) {
            case 'Admin': return 'Administrator';
            case 'Doctor': return 'Physician';
            case 'Nurse': return 'Nurse';
            case 'Receptionist': return 'Receptionist';
            case 'Pharmacist': return 'Pharmacist';
            case 'Billing Staff': return 'Billing Staff';
            default: return 'User';
        }
    };

    const getRoleIcon = () => {
        switch (role) {
            case 'Admin': return <Shield size={16} />;
            case 'Doctor': return <Stethoscope size={16} />;
            case 'Nurse': return <Heart size={16} />;
            default: return <User size={16} />;
        }
    };

    // ============================================================
    // ===== MAIN RENDER =====
    // ============================================================
    return (
        <DashboardLayout active="vitals" title="Vital Signs">
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
                        <Heart size={24} style={{ color: '#EF4444' }} />
                        Vital Signs
                        <span style={{
                            fontSize: '0.6rem',
                            padding: '2px 10px',
                            borderRadius: '20px',
                            background: 'var(--primary-color)15',
                            color: 'var(--primary-color)',
                            fontWeight: 500,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginLeft: '8px'
                        }}>
                            {getRoleIcon()} {getRoleLabel()}
                        </span>
                    </h1>
                    <p style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        marginTop: '4px'
                    }}>
                        Record and track patient vital signs
                        {!canAdd && ' (View Only)'}
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
                    {canAdd && (
                        <button
                            onClick={openAddModal}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 18px',
                                border: 'none',
                                borderRadius: '10px',
                                background: '#EF4444',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontFamily: 'var(--font-family)',
                                color: 'white',
                                fontWeight: 500,
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = '#DC2626';
                                e.target.style.transform = 'translateY(-1px)';
                                e.target.style.boxShadow = '0 4px 14px rgba(239, 68, 68, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = '#EF4444';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                            }}
                        >
                            <Plus size={16} /> Record Vitals
                        </button>
                    )}
                </div>
            </div>

            {/* ===== STATS CARDS ===== */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
                marginBottom: '20px'
            }}>
                <div style={{
                    padding: '14px 16px',
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Heart size={16} style={{ color: '#EF4444' }} />
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total Vitals</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {stats.totalVitals}
                    </div>
                </div>

                <div style={{
                    padding: '14px 16px',
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <CheckCircle size={16} style={{ color: '#22C55E' }} />
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Normal</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22C55E' }}>
                        {stats.normalVitals}
                    </div>
                </div>

                <div style={{
                    padding: '14px 16px',
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <AlertCircle size={16} style={{ color: '#EF4444' }} />
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Abnormal</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#EF4444' }}>
                        {stats.abnormalVitals}
                    </div>
                </div>

                <div style={{
                    padding: '14px 16px',
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Users size={16} style={{ color: '#8B5CF6' }} />
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Patients</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {stats.patientsWithVitals}
                    </div>
                </div>

                <div style={{
                    padding: '14px 16px',
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Calendar size={16} style={{ color: '#F59E0B' }} />
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Today</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {stats.todayVitals}
                    </div>
                </div>
            </div>

            {/* ===== AVERAGE VITALS ===== */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
                marginBottom: '20px'
            }}>
                <div style={{
                    padding: '10px 14px',
                    background: 'var(--bg-primary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    textAlign: 'center'
                }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Avg Heart Rate</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {stats.avgHeartRate || '—'} bpm
                    </div>
                </div>
                <div style={{
                    padding: '10px 14px',
                    background: 'var(--bg-primary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    textAlign: 'center'
                }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Avg BP (Systolic)</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {stats.avgBPSystolic || '—'} mmHg
                    </div>
                </div>
                <div style={{
                    padding: '10px 14px',
                    background: 'var(--bg-primary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    textAlign: 'center'
                }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Avg Temperature</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {stats.avgTemperature || '—'} °C
                    </div>
                </div>
                <div style={{
                    padding: '10px 14px',
                    background: 'var(--bg-primary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    textAlign: 'center'
                }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Normal Rate</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#22C55E' }}>
                        {stats.totalVitals > 0 ? Math.round((stats.normalVitals / stats.totalVitals) * 100) : 0}%
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
                        placeholder="Search by patient..."
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

                    {canAdd && (
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
                                background: '#EF4444',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontFamily: 'var(--font-family)',
                                color: 'white',
                                fontWeight: 500,
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = '#DC2626';
                                e.target.style.transform = 'translateY(-1px)';
                                e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.25)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = '#EF4444';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                            }}
                        >
                            <Plus size={14} /> Record Vitals
                        </button>
                    )}
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
                        value={patientFilter}
                        onChange={(e) => setPatientFilter(e.target.value)}
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
                        <option value="">All Patients</option>
                        {patients.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
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
                        <option value="">All Status</option>
                        <option value="normal">✅ Normal</option>
                        <option value="abnormal">⚠️ Abnormal</option>
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
                        {sortedVitals.length} vital{sortedVitals.length !== 1 ? 's' : ''} found
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
                        Loading vitals...
                    </div>
                ) : sortedVitals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>❤️</div>
                        <h3 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>No Vital Signs Recorded</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            {canAdd ? 'Start by recording vital signs for your patients.' : 'No vital signs available.'}
                        </p>
                        {canAdd && (
                            <div style={{ marginTop: '12px' }}>
                                <button
                                    onClick={openAddModal}
                                    style={{
                                        padding: '8px 20px',
                                        background: '#EF4444',
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
                                    onMouseEnter={(e) => e.target.style.background = '#DC2626'}
                                    onMouseLeave={(e) => e.target.style.background = '#EF4444'}
                                >
                                    <Plus size={16} /> Record First Vitals
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '800px' }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                        <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} /> Date
                                    </th>
                                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                        <User size={12} style={{ display: 'inline', marginRight: '4px' }} /> Patient
                                    </th>
                                    <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                        BP
                                    </th>
                                    <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                        HR
                                    </th>
                                    <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                        Temp
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
                                {sortedVitals.map(vital => {
                                    const status = getStatusColor(vital);
                                    return (
                                        <tr key={vital.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s ease' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '8px 14px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                                <Clock size={11} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} />
                                                {new Date(vital.recorded_at).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '8px 14px', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                                                {vital.patients?.name || 'Unknown Patient'}
                                                {vital.patients?.age && (
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                                        {vital.patients.age} yrs • {vital.patients.gender || 'N/A'}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '8px 14px', textAlign: 'center', color: 'var(--text-primary)', fontWeight: 500 }}>
                                                {vital.blood_pressure_systolic && vital.blood_pressure_diastolic ?
                                                    `${vital.blood_pressure_systolic}/${vital.blood_pressure_diastolic}` :
                                                    '—'
                                                }
                                            </td>
                                            <td style={{ padding: '8px 14px', textAlign: 'center', color: 'var(--text-primary)', fontWeight: 500 }}>
                                                {vital.heart_rate || '—'}
                                            </td>
                                            <td style={{ padding: '8px 14px', textAlign: 'center', color: 'var(--text-primary)', fontWeight: 500 }}>
                                                {vital.temperature ? `${vital.temperature}°C` : '—'}
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
                                                    {status.icon} {status.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '8px 14px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                                    <button
                                                        onClick={() => openViewModal(vital)}
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
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => openEditModal(vital)}
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
                                                                e.target.style.borderColor = '#22C55E';
                                                                e.target.style.color = '#22C55E';
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
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => openDeleteModal(vital)}
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
                                                                e.target.style.borderColor = '#EF4444';
                                                                e.target.style.color = '#EF4444';
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
                                                    )}
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
            {/* ===== ADD MODAL ===== */}
            {/* ============================================================ */}
            {isAddOpen && (
                <div className="hms-modal-backdrop" onClick={() => setIsAddOpen(false)}>
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
                                <Heart size={18} style={{ color: '#EF4444' }} />
                                Record Vital Signs
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
                                <div className="form-group">
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
                                        onChange={(e) => {
                                            handleFormChange(e);
                                            const selectedPatient = patients.find(p => p.id === e.target.value);
                                            if (selectedPatient) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    patient_name: selectedPatient.name || ''
                                                }));
                                            }
                                        }}
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
                                        {patients.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} {p.phone ? `(${p.phone})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {formErrors.patient_id && <span className="error-text" style={{ fontSize: '0.75rem', color: 'var(--danger-color)' }}>{formErrors.patient_id}</span>}
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '12px'
                                }}>
                                    <div className="form-group">
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}>BP (Systolic)</label>
                                        <input
                                            type="number"
                                            name="blood_pressure_systolic"
                                            className="input-control"
                                            value={formData.blood_pressure_systolic}
                                            onChange={handleFormChange}
                                            placeholder="e.g. 120"
                                            style={{
                                                width: '100%',
                                                height: '36px',
                                                padding: '0 10px',
                                                fontFamily: 'var(--font-family)',
                                                fontSize: '0.75rem',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '8px',
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
                                    <div className="form-group">
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}>BP (Diastolic)</label>
                                        <input
                                            type="number"
                                            name="blood_pressure_diastolic"
                                            className="input-control"
                                            value={formData.blood_pressure_diastolic}
                                            onChange={handleFormChange}
                                            placeholder="e.g. 80"
                                            style={{
                                                width: '100%',
                                                height: '36px',
                                                padding: '0 10px',
                                                fontFamily: 'var(--font-family)',
                                                fontSize: '0.75rem',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '8px',
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
                                    <div className="form-group">
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}>Heart Rate (bpm)</label>
                                        <input
                                            type="number"
                                            name="heart_rate"
                                            className="input-control"
                                            value={formData.heart_rate}
                                            onChange={handleFormChange}
                                            placeholder="e.g. 72"
                                            style={{
                                                width: '100%',
                                                height: '36px',
                                                padding: '0 10px',
                                                fontFamily: 'var(--font-family)',
                                                fontSize: '0.75rem',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '8px',
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
                                    <div className="form-group">
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}>Temperature (°C)</label>
                                        <input
                                            type="number"
                                            name="temperature"
                                            className="input-control"
                                            value={formData.temperature}
                                            onChange={handleFormChange}
                                            placeholder="e.g. 36.5"
                                            step="0.1"
                                            style={{
                                                width: '100%',
                                                height: '36px',
                                                padding: '0 10px',
                                                fontFamily: 'var(--font-family)',
                                                fontSize: '0.75rem',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '8px',
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
                                    <div className="form-group">
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}>Weight (kg)</label>
                                        <input
                                            type="number"
                                            name="weight"
                                            className="input-control"
                                            value={formData.weight}
                                            onChange={handleFormChange}
                                            placeholder="e.g. 70"
                                            step="0.1"
                                            style={{
                                                width: '100%',
                                                height: '36px',
                                                padding: '0 10px',
                                                fontFamily: 'var(--font-family)',
                                                fontSize: '0.75rem',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '8px',
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
                                    <div className="form-group">
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}>Height (cm)</label>
                                        <input
                                            type="number"
                                            name="height"
                                            className="input-control"
                                            value={formData.height}
                                            onChange={handleFormChange}
                                            placeholder="e.g. 175"
                                            style={{
                                                width: '100%',
                                                height: '36px',
                                                padding: '0 10px',
                                                fontFamily: 'var(--font-family)',
                                                fontSize: '0.75rem',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '8px',
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
                                    <div className="form-group">
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}>BMI</label>
                                        <input
                                            type="text"
                                            name="bmi"
                                            className="input-control"
                                            value={formData.bmi}
                                            readOnly
                                            style={{
                                                width: '100%',
                                                height: '36px',
                                                padding: '0 10px',
                                                fontFamily: 'var(--font-family)',
                                                fontSize: '0.75rem',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '8px',
                                                background: 'var(--bg-primary)',
                                                color: 'var(--text-secondary)',
                                                outline: 'none',
                                                cursor: 'not-allowed'
                                            }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}>O₂ Saturation (%)</label>
                                        <input
                                            type="number"
                                            name="oxygen_saturation"
                                            className="input-control"
                                            value={formData.oxygen_saturation}
                                            onChange={handleFormChange}
                                            placeholder="e.g. 98"
                                            style={{
                                                width: '100%',
                                                height: '36px',
                                                padding: '0 10px',
                                                fontFamily: 'var(--font-family)',
                                                fontSize: '0.75rem',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '8px',
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

                                <div className="form-group">
                                    <label className="form-label" style={{
                                        display: 'block',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}><FileText size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Notes</label>
                                    <textarea
                                        name="notes"
                                        className="input-control"
                                        value={formData.notes}
                                        onChange={handleFormChange}
                                        placeholder="Any additional notes..."
                                        style={{
                                            minHeight: '50px',
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
                                    background: '#EF4444',
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
                                        e.target.style.background = '#DC2626';
                                        e.target.style.transform = 'translateY(-1px)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.25)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!actionLoading) {
                                        e.target.style.background = '#EF4444';
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = 'none';
                                    }
                                }}
                            >
                                <Heart size={14} />
                                {actionLoading ? 'Saving...' : 'Save Vitals'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* ===== VIEW MODAL ===== */}
            {/* ============================================================ */}
            {isViewOpen && selectedVital && (
                <div className="hms-modal-backdrop" onClick={() => setIsViewOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{
                        maxWidth: '500px',
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
                                <Heart size={18} style={{ color: '#EF4444' }} />
                                Vital Signs Details
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
                            flex: 1
                        }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '12px'
                            }}>
                                <div style={{
                                    padding: '12px',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Patient</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {selectedVital.patients?.name || 'Unknown'}
                                    </div>
                                </div>
                                <div style={{
                                    padding: '12px',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Date Recorded</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {new Date(selectedVital.recorded_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr 1fr',
                                gap: '8px',
                                marginTop: '12px'
                            }}>
                                {selectedVital.blood_pressure_systolic && (
                                    <div style={{
                                        padding: '10px',
                                        background: 'var(--bg-primary)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>BP</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {selectedVital.blood_pressure_systolic}/{selectedVital.blood_pressure_diastolic}
                                        </div>
                                    </div>
                                )}
                                {selectedVital.heart_rate && (
                                    <div style={{
                                        padding: '10px',
                                        background: 'var(--bg-primary)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>HR</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {selectedVital.heart_rate} bpm
                                        </div>
                                    </div>
                                )}
                                {selectedVital.temperature && (
                                    <div style={{
                                        padding: '10px',
                                        background: 'var(--bg-primary)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Temp</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {selectedVital.temperature}°C
                                        </div>
                                    </div>
                                )}
                                {selectedVital.weight && (
                                    <div style={{
                                        padding: '10px',
                                        background: 'var(--bg-primary)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Weight</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {selectedVital.weight} kg
                                        </div>
                                    </div>
                                )}
                                {selectedVital.height && (
                                    <div style={{
                                        padding: '10px',
                                        background: 'var(--bg-primary)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Height</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {selectedVital.height} cm
                                        </div>
                                    </div>
                                )}
                                {selectedVital.bmi && (
                                    <div style={{
                                        padding: '10px',
                                        background: 'var(--bg-primary)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>BMI</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {selectedVital.bmi}
                                        </div>
                                    </div>
                                )}
                                {selectedVital.oxygen_saturation && (
                                    <div style={{
                                        padding: '10px',
                                        background: 'var(--bg-primary)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>O₂ Sat</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {selectedVital.oxygen_saturation}%
                                        </div>
                                    </div>
                                )}
                            </div>

                            {selectedVital.notes && (
                                <div style={{
                                    marginTop: '12px',
                                    padding: '12px',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Notes</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                                        {selectedVital.notes}
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
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* ===== DELETE MODAL ===== */}
            {/* ============================================================ */}
            {isDeleteOpen && selectedVital && (
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
                                Delete Vital Signs
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
                                Are you sure you want to delete this vital record?
                            </p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                Patient: <strong>{selectedVital.patients?.name || 'Unknown'}</strong>
                                <br />
                                Date: <strong>{new Date(selectedVital.recorded_at).toLocaleDateString()}</strong>
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
                                {actionLoading ? 'Deleting...' : 'Delete Permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default Vitals;