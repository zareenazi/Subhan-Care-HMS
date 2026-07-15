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
    const [statusFilter, setStatusFilter] = useState('');
    const [patientFilter, setPatientFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState('newest');

    // ===== MODAL STATES =====
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedPresc, setSelectedPresc] = useState(null);

    // ===== ENHANCED FORM STATE =====
    const [formData, setFormData] = useState({
        // Patient Info
        patient_id: '',
        patient_name: '',
        patient_age: '',
        patient_gender: '',
        patient_contact: '',

        // Doctor Info
        doctor_id: '',
        doctor_name: '',
        doctor_specialization: '',

        // Prescription Details
        prescription_date: new Date().toISOString().split('T')[0],
        diagnosis: '',
        medications: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
        notes: '',

        // Status & Tracking
        status: 'active',
        priority: 'normal',
        refill_count: 0,
        max_refills: 0,
        expiry_date: '',

        // Additional Info
        allergies: '',
        side_effects: '',
        special_instructions: '',
        follow_up_date: '',

        // Pharmacy
        pharmacy_name: '',
        pharmacy_address: '',
        pharmacy_phone: '',

        // Insurance
        insurance_provider: '',
        insurance_number: '',
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
            patient_name: '',
            patient_age: '',
            patient_gender: '',
            patient_contact: '',
            doctor_id: '',
            doctor_name: '',
            doctor_specialization: '',
            prescription_date: new Date().toISOString().split('T')[0],
            diagnosis: '',
            medications: '',
            dosage: '',
            frequency: '',
            duration: '',
            instructions: '',
            notes: '',
            status: 'active',
            priority: 'normal',
            refill_count: 0,
            max_refills: 0,
            expiry_date: '',
            allergies: '',
            side_effects: '',
            special_instructions: '',
            follow_up_date: '',
            pharmacy_name: '',
            pharmacy_address: '',
            pharmacy_phone: '',
            insurance_provider: '',
            insurance_number: '',
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
            patient_name: presc.patients?.name || '',
            patient_age: presc.patients?.age || '',
            patient_gender: presc.patients?.gender || '',
            patient_contact: presc.patients?.phone || '',
            doctor_id: presc.doctor_id || '',
            doctor_name: presc.doctors?.name || '',
            doctor_specialization: presc.doctors?.specialization || '',
            prescription_date: presc.prescription_date || new Date().toISOString().split('T')[0],
            diagnosis: presc.diagnosis || '',
            medications: presc.medications || '',
            dosage: presc.dosage || '',
            frequency: presc.frequency || '',
            duration: presc.duration || '',
            instructions: presc.instructions || '',
            notes: presc.notes || '',
            status: presc.status || 'active',
            priority: presc.priority || 'normal',
            refill_count: presc.refill_count || 0,
            max_refills: presc.max_refills || 0,
            expiry_date: presc.expiry_date || '',
            allergies: presc.allergies || '',
            side_effects: presc.side_effects || '',
            special_instructions: presc.special_instructions || '',
            follow_up_date: presc.follow_up_date || '',
            pharmacy_name: presc.pharmacy_name || '',
            pharmacy_address: presc.pharmacy_address || '',
            pharmacy_phone: presc.pharmacy_phone || '',
            insurance_provider: presc.insurance_provider || '',
            insurance_number: presc.insurance_number || '',
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

                const { data: patData, error: patError } = await supabase
                    .from('patients')
                    .select('id, name, phone, age, gender');

                if (patError) {
                    console.error('Error loading patients:', patError);
                }

                const { data: docData, error: docError } = await supabase
                    .from('doctors')
                    .select('id, name, specialization');

                if (docError) {
                    console.error('Error loading doctors:', docError);
                }

                const enrichedPrescriptions = (prescData || []).map(presc => {
                    const patient = patData?.find(p => p.id === presc.patient_id);
                    const doctor = docData?.find(d => d.id === presc.doctor_id);
                    return {
                        ...presc,
                        patients: patient || { name: 'Unknown Patient', phone: '', age: '', gender: '' },
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

        if (formData.priority === 'urgent' && !formData.diagnosis.trim()) {
            errors.diagnosis = 'Diagnosis is required for urgent prescriptions';
        }

        if (formData.status === 'active' && formData.expiry_date) {
            const expiry = new Date(formData.expiry_date);
            const now = new Date();
            if (expiry < now) {
                errors.expiry_date = 'Expiry date cannot be in the past';
            }
        }

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
                    dosage: formData.dosage || null,
                    frequency: formData.frequency || null,
                    duration: formData.duration || null,
                    instructions: formData.instructions || null,
                    notes: formData.notes || null,
                    status: formData.status || 'active',
                    priority: formData.priority || 'normal',
                    refill_count: parseInt(formData.refill_count) || 0,
                    max_refills: parseInt(formData.max_refills) || 0,
                    expiry_date: formData.expiry_date || null,
                    allergies: formData.allergies || null,
                    side_effects: formData.side_effects || null,
                    special_instructions: formData.special_instructions || null,
                    follow_up_date: formData.follow_up_date || null,
                    pharmacy_name: formData.pharmacy_name || null,
                    pharmacy_address: formData.pharmacy_address || null,
                    pharmacy_phone: formData.pharmacy_phone || null,
                    insurance_provider: formData.insurance_provider || null,
                    insurance_number: formData.insurance_number || null,
                    prescription_date: formData.prescription_date || new Date().toISOString().split('T')[0],
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
                    dosage: formData.dosage || null,
                    frequency: formData.frequency || null,
                    duration: formData.duration || null,
                    instructions: formData.instructions || null,
                    notes: formData.notes || null,
                    status: formData.status || 'active',
                    priority: formData.priority || 'normal',
                    refill_count: parseInt(formData.refill_count) || 0,
                    max_refills: parseInt(formData.max_refills) || 0,
                    expiry_date: formData.expiry_date || null,
                    allergies: formData.allergies || null,
                    side_effects: formData.side_effects || null,
                    special_instructions: formData.special_instructions || null,
                    follow_up_date: formData.follow_up_date || null,
                    pharmacy_name: formData.pharmacy_name || null,
                    pharmacy_address: formData.pharmacy_address || null,
                    pharmacy_phone: formData.pharmacy_phone || null,
                    insurance_provider: formData.insurance_provider || null,
                    insurance_number: formData.insurance_number || null,
                    prescription_date: formData.prescription_date || new Date().toISOString().split('T')[0],
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
        const status = presc.status || '';
        const patientId = presc.patient_id || '';
        const prescriptionDate = presc.prescription_date || presc.created_at || '';

        const matchesSearch = patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (presc.medications || '').toLowerCase().includes(searchQuery.toLowerCase());

        const matchesDoctor = doctorFilter === '' || presc.doctor_id === doctorFilter;
        const matchesDate = dateFilter === '' ||
            new Date(prescriptionDate).toDateString() === new Date(dateFilter).toDateString();
        const matchesStatus = statusFilter === '' || status === statusFilter;
        const matchesPatient = patientFilter === '' || patientId === patientFilter;

        return matchesSearch && matchesDoctor && matchesDate && matchesStatus && matchesPatient;
    });

    // ===== SORT PRESCRIPTIONS =====
    const sortedPrescriptions = [...filtered].sort((a, b) => {
        const dateA = a.prescription_date || a.created_at || '';
        const dateB = b.prescription_date || b.created_at || '';

        if (sortBy === 'newest') {
            return new Date(dateB) - new Date(dateA);
        } else if (sortBy === 'oldest') {
            return new Date(dateA) - new Date(dateB);
        } else if (sortBy === 'patient') {
            return (a.patients?.name || '').localeCompare(b.patients?.name || '');
        } else if (sortBy === 'doctor') {
            return (a.doctors?.name || '').localeCompare(b.doctors?.name || '');
        } else if (sortBy === 'status') {
            return (a.status || '').localeCompare(b.status || '');
        }
        return 0;
    });

    // ===== CLEAR FILTERS =====
    const clearFilters = () => {
        setSearchQuery('');
        setDoctorFilter('');
        setDateFilter('');
        setStatusFilter('');
        setPatientFilter('');
        setSortBy('newest');
        setShowFilters(false);
    };

    const activeFilterCount = (searchQuery ? 1 : 0) + (doctorFilter ? 1 : 0) +
        (dateFilter ? 1 : 0) + (statusFilter ? 1 : 0) +
        (patientFilter ? 1 : 0);

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

        if (presc.status === 'cancelled') {
            return {
                label: 'Cancelled',
                color: statusColors.danger,
                bg: '#EF444415'
            };
        } else if (presc.status === 'completed') {
            return {
                label: 'Completed',
                color: statusColors.success,
                bg: '#22C55E15'
            };
        } else if (presc.status === 'expired') {
            return {
                label: 'Expired',
                color: statusColors.danger,
                bg: '#EF444415'
            };
        } else if (diffDays <= 7) {
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

    // ===== RENDER FORM SECTIONS (Reusable) =====
    const renderFormSections = () => (
        <>
            {/* ===== SECTION 1: PATIENT INFORMATION ===== */}
            <div style={{
                background: 'var(--bg-primary)',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                marginBottom: '4px'
            }}>
                <h4 style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '10px'
                }}>
                    <User size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    Patient Information
                </h4>

                <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label" style={{
                        display: 'block',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        marginBottom: '4px'
                    }}>Patient *</label>
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
                                    patient_name: selectedPatient.name || '',
                                    patient_age: selectedPatient.age || '',
                                    patient_gender: selectedPatient.gender || '',
                                    patient_contact: selectedPatient.phone || '',
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
                                {p.age ? ` - ${p.age}yrs` : ''}
                                {p.gender ? ` - ${p.gender}` : ''}
                            </option>
                        ))}
                    </select>
                    {formErrors.patient_id && <span className="error-text" style={{ fontSize: '0.75rem', color: 'var(--danger-color)' }}>{formErrors.patient_id}</span>}
                </div>

                {(formData.patient_name || formData.patient_age || formData.patient_gender) && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                        gap: '8px',
                        padding: '8px',
                        background: 'var(--card-bg)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)'
                    }}>
                        {formData.patient_name && (
                            <div>
                                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Name</span>
                                <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                    {formData.patient_name}
                                </div>
                            </div>
                        )}
                        {formData.patient_age && (
                            <div>
                                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Age</span>
                                <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                    {formData.patient_age} yrs
                                </div>
                            </div>
                        )}
                        {formData.patient_gender && (
                            <div>
                                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Gender</span>
                                <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                    {formData.patient_gender}
                                </div>
                            </div>
                        )}
                        {formData.patient_contact && (
                            <div>
                                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Contact</span>
                                <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                    {formData.patient_contact}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ===== SECTION 2: DOCTOR INFORMATION ===== */}
            <div style={{
                background: 'var(--bg-primary)',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                marginBottom: '4px'
            }}>
                <h4 style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '10px'
                }}>
                    <Stethoscope size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    Doctor Information
                </h4>

                <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label" style={{
                        display: 'block',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        marginBottom: '4px'
                    }}>Prescribing Doctor *</label>
                    <select
                        name="doctor_id"
                        className="hms-select"
                        value={formData.doctor_id}
                        onChange={(e) => {
                            handleFormChange(e);
                            const selectedDoctor = doctors.find(d => d.id === e.target.value);
                            if (selectedDoctor) {
                                setFormData(prev => ({
                                    ...prev,
                                    doctor_name: selectedDoctor.name || '',
                                    doctor_specialization: selectedDoctor.specialization || '',
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
                        <option value="">-- Choose Doctor --</option>
                        {doctors.map(d => (
                            <option key={d.id} value={d.id}>
                                Dr. {d.name} {d.specialization ? `(${d.specialization})` : ''}
                            </option>
                        ))}
                    </select>
                    {formErrors.doctor_id && <span className="error-text" style={{ fontSize: '0.75rem', color: 'var(--danger-color)' }}>{formErrors.doctor_id}</span>}
                </div>

                {formData.doctor_name && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        padding: '8px',
                        background: 'var(--card-bg)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div>
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Doctor</span>
                            <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                Dr. {formData.doctor_name}
                            </div>
                        </div>
                        {formData.doctor_specialization && (
                            <div>
                                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Specialization</span>
                                <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                    {formData.doctor_specialization}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ===== SECTION 3: PRESCRIPTION DETAILS ===== */}
            <div style={{
                background: 'var(--bg-primary)',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                marginBottom: '4px'
            }}>
                <h4 style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '10px'
                }}>
                    <FileText size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    Prescription Details
                </h4>

                <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label" style={{
                        display: 'block',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        marginBottom: '4px'
                    }}><Calendar size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--primary-color)' }} /> Prescription Date</label>
                    <input
                        type="date"
                        name="prescription_date"
                        className="input-control"
                        value={formData.prescription_date}
                        onChange={handleFormChange}
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

                <div className="form-group" style={{ marginBottom: '10px' }}>
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
                        placeholder="e.g. Upper Respiratory Tract Infection, Hypertension, Diabetes Type 2"
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

                <div className="form-group" style={{ marginBottom: '10px' }}>
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
                        placeholder="e.g. Paracetamol 500mg - 1 tablet three times a day after meals"
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

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '8px',
                    marginBottom: '10px'
                }}>
                    <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label" style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            marginBottom: '4px'
                        }}>Dosage</label>
                        <input
                            type="text"
                            name="dosage"
                            className="input-control"
                            value={formData.dosage}
                            onChange={handleFormChange}
                            placeholder="e.g. 500mg"
                            style={{
                                width: '100%',
                                height: '34px',
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
                    <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label" style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            marginBottom: '4px'
                        }}>Frequency</label>
                        <input
                            type="text"
                            name="frequency"
                            className="input-control"
                            value={formData.frequency}
                            onChange={handleFormChange}
                            placeholder="e.g. 3x daily"
                            style={{
                                width: '100%',
                                height: '34px',
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
                    <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label" style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            marginBottom: '4px'
                        }}>Duration</label>
                        <input
                            type="text"
                            name="duration"
                            className="input-control"
                            value={formData.duration}
                            onChange={handleFormChange}
                            placeholder="e.g. 7 days"
                            style={{
                                width: '100%',
                                height: '34px',
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

                <div className="form-group" style={{ marginBottom: '10px' }}>
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
                        placeholder="e.g. Drink plenty of water, avoid driving if feeling dizzy, take with food"
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

                <div className="form-group" style={{ marginBottom: '0' }}>
                    <label className="form-label" style={{
                        display: 'block',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        marginBottom: '4px'
                    }}><FileText size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Additional Notes</label>
                    <textarea
                        name="notes"
                        className="input-control"
                        value={formData.notes}
                        onChange={handleFormChange}
                        placeholder="Any additional notes or observations..."
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
            </div>

            {/* ===== SECTION 4: STATUS & TRACKING ===== */}
            <div style={{
                background: 'var(--bg-primary)',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                marginBottom: '4px'
            }}>
                <h4 style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '10px'
                }}>
                    <Activity size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    Status & Tracking
                </h4>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '8px',
                    marginBottom: '10px'
                }}>
                    <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label" style={{
                            display: 'block',
                            fontSize: '0.75rem',
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
                                height: '34px',
                                padding: '0 10px',
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
                            <option value="active">🟢 Active</option>
                            <option value="completed">✅ Completed</option>
                            <option value="expired">🔴 Expired</option>
                            <option value="cancelled">⛔ Cancelled</option>
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label" style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            marginBottom: '4px'
                        }}>Priority</label>
                        <select
                            name="priority"
                            className="hms-select"
                            value={formData.priority}
                            onChange={handleFormChange}
                            style={{
                                width: '100%',
                                height: '34px',
                                padding: '0 10px',
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
                            <option value="normal">ℹ️ Normal</option>
                            <option value="high">🔶 High</option>
                            <option value="urgent">🔴 Urgent</option>
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label" style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            marginBottom: '4px'
                        }}>Expiry Date</label>
                        <input
                            type="date"
                            name="expiry_date"
                            className="input-control"
                            value={formData.expiry_date}
                            onChange={handleFormChange}
                            style={{
                                width: '100%',
                                height: '34px',
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
                        {formErrors.expiry_date && <span className="error-text" style={{ fontSize: '0.7rem', color: 'var(--danger-color)' }}>{formErrors.expiry_date}</span>}
                    </div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px'
                }}>
                    <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label" style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            marginBottom: '4px'
                        }}>Refills Used</label>
                        <input
                            type="number"
                            name="refill_count"
                            className="input-control"
                            value={formData.refill_count}
                            onChange={handleFormChange}
                            min="0"
                            style={{
                                width: '100%',
                                height: '34px',
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
                    <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label" style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            marginBottom: '4px'
                        }}>Max Refills Allowed</label>
                        <input
                            type="number"
                            name="max_refills"
                            className="input-control"
                            value={formData.max_refills}
                            onChange={handleFormChange}
                            min="0"
                            style={{
                                width: '100%',
                                height: '34px',
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
            </div>

            {/* ===== SECTION 5: ADDITIONAL MEDICAL INFO ===== */}
            <div style={{
                background: 'var(--bg-primary)',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                marginBottom: '4px'
            }}>
                <h4 style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '10px'
                }}>
                    <AlertCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    Additional Information
                </h4>

                <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label" style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        marginBottom: '4px'
                    }}>Allergies</label>
                    <input
                        type="text"
                        name="allergies"
                        className="input-control"
                        value={formData.allergies}
                        onChange={handleFormChange}
                        placeholder="e.g. Penicillin, Latex, Aspirin"
                        style={{
                            width: '100%',
                            height: '34px',
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

                <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label" style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        marginBottom: '4px'
                    }}>Known Side Effects</label>
                    <input
                        type="text"
                        name="side_effects"
                        className="input-control"
                        value={formData.side_effects}
                        onChange={handleFormChange}
                        placeholder="e.g. Drowsiness, Nausea, Dizziness"
                        style={{
                            width: '100%',
                            height: '34px',
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

                <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label" style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        marginBottom: '4px'
                    }}>Special Instructions</label>
                    <textarea
                        name="special_instructions"
                        className="input-control"
                        value={formData.special_instructions}
                        onChange={handleFormChange}
                        placeholder="Any special instructions for the patient..."
                        style={{
                            minHeight: '50px',
                            width: '100%',
                            padding: '8px 10px',
                            fontFamily: 'var(--font-family)',
                            fontSize: '0.75rem',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '8px',
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

                <div className="form-group" style={{ marginBottom: '0' }}>
                    <label className="form-label" style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        marginBottom: '4px'
                    }}><Calendar size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--primary-color)' }} /> Follow-up Date</label>
                    <input
                        type="date"
                        name="follow_up_date"
                        className="input-control"
                        value={formData.follow_up_date}
                        onChange={handleFormChange}
                        style={{
                            width: '100%',
                            height: '34px',
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

            {/* ===== SECTION 6: PHARMACY INFORMATION ===== */}
            <div style={{
                background: 'var(--bg-primary)',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                marginBottom: '4px'
            }}>
                <h4 style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '10px'
                }}>
                    <Pill size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    Pharmacy Information (Optional)
                </h4>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px'
                }}>
                    <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label" style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            marginBottom: '4px'
                        }}>Pharmacy Name</label>
                        <input
                            type="text"
                            name="pharmacy_name"
                            className="input-control"
                            value={formData.pharmacy_name}
                            onChange={handleFormChange}
                            placeholder="e.g. Subhan Care Pharmacy"
                            style={{
                                width: '100%',
                                height: '34px',
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
                    <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label" style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            marginBottom: '4px'
                        }}>Pharmacy Phone</label>
                        <input
                            type="text"
                            name="pharmacy_phone"
                            className="input-control"
                            value={formData.pharmacy_phone}
                            onChange={handleFormChange}
                            placeholder="e.g. 051-1234567"
                            style={{
                                width: '100%',
                                height: '34px',
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

                <div className="form-group" style={{ marginBottom: '0', marginTop: '8px' }}>
                    <label className="form-label" style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        marginBottom: '4px'
                    }}>Pharmacy Address</label>
                    <input
                        type="text"
                        name="pharmacy_address"
                        className="input-control"
                        value={formData.pharmacy_address}
                        onChange={handleFormChange}
                        placeholder="e.g. Sector G-8, Islamabad"
                        style={{
                            width: '100%',
                            height: '34px',
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

            {/* ===== SECTION 7: INSURANCE INFORMATION ===== */}
            <div style={{
                background: 'var(--bg-primary)',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                marginBottom: '4px'
            }}>
                <h4 style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '10px'
                }}>
                    <FileText size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    Insurance Information (Optional)
                </h4>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px'
                }}>
                    <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label" style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            marginBottom: '4px'
                        }}>Insurance Provider</label>
                        <input
                            type="text"
                            name="insurance_provider"
                            className="input-control"
                            value={formData.insurance_provider}
                            onChange={handleFormChange}
                            placeholder="e.g. State Life Insurance"
                            style={{
                                width: '100%',
                                height: '34px',
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
                    <div className="form-group" style={{ marginBottom: '0' }}>
                        <label className="form-label" style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            marginBottom: '4px'
                        }}>Insurance Policy #</label>
                        <input
                            type="text"
                            name="insurance_number"
                            className="input-control"
                            value={formData.insurance_number}
                            onChange={handleFormChange}
                            placeholder="e.g. SLI-12345-6789"
                            style={{
                                width: '100%',
                                height: '34px',
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
            </div>
        </>
    );

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
                                return diffDays <= 7 && p.status !== 'cancelled' && p.status !== 'completed';
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
                        placeholder="Search by patient, doctor or medication..."
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
                        <option value="active">🟢 Active</option>
                        <option value="completed">✅ Completed</option>
                        <option value="expired">🔴 Expired</option>
                        <option value="cancelled">⛔ Cancelled</option>
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
                        <option value="status">📊 By Status</option>
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
                                    <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                        Priority
                                    </th>
                                    <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedPrescriptions.map(presc => {
                                    const status = getStatusBadge(presc);
                                    const priorityColors = {
                                        normal: { color: '#6B7280', bg: '#6B728015' },
                                        high: { color: '#F59E0B', bg: '#F59E0B15' },
                                        urgent: { color: '#EF4444', bg: '#EF444415' }
                                    };
                                    const priority = priorityColors[presc.priority || 'normal'] || priorityColors.normal;

                                    return (
                                        <tr key={presc.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s ease' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '8px 14px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                                <ClockIcon size={11} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} />
                                                {new Date(presc.prescription_date || presc.created_at).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '8px 14px', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                                                {presc.patients?.name || 'Unknown Patient'}
                                                {presc.patients?.age && (
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                                        {presc.patients.age} yrs • {presc.patients.gender || 'N/A'}
                                                    </div>
                                                )}
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
                                                {presc.dosage && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: '4px' }}>({presc.dosage})</span>}
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
                                            <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.6rem',
                                                    fontWeight: 600,
                                                    background: priority.bg,
                                                    color: priority.color,
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {presc.priority || 'normal'}
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
                                {renderFormSections()}
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
                                {actionLoading ? 'Issuing...' : 'Issue Prescription'}
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
                                {renderFormSections()}
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
                                {actionLoading ? 'Saving...' : 'Update Prescription'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== VIEW PRESCRIPTION MODAL ===== */}
            {isViewOpen && selectedPresc && (
                <div className="hms-modal-backdrop" onClick={() => setIsViewOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{
                        maxWidth: '650px',
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
                                    {selectedPresc.patients?.age && (
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            {selectedPresc.patients.age} yrs • {selectedPresc.patients.gender || 'N/A'}
                                        </div>
                                    )}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block', marginBottom: '2px' }}>
                                        <Calendar size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Date
                                    </span>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {new Date(selectedPresc.prescription_date || selectedPresc.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block', marginBottom: '2px' }}>
                                        <Stethoscope size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--secondary-color)' }} /> Doctor
                                    </span>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                        Dr. {selectedPresc.doctors?.name || 'Consultant'}
                                    </div>
                                    {selectedPresc.doctors?.specialization && (
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            {selectedPresc.doctors.specialization}
                                        </div>
                                    )}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block', marginBottom: '2px' }}>
                                        <FileText size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> ID
                                    </span>
                                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>#RX-{selectedPresc.id?.slice(0, 6).toUpperCase() || 'N/A'}</div>
                                </div>
                            </div>

                            {/* Status & Priority */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr 1fr',
                                gap: '8px',
                                padding: '10px',
                                background: 'var(--bg-primary)',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                marginBottom: '16px'
                            }}>
                                <div>
                                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Status</span>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                        <span style={{
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            background: getStatusBadge(selectedPresc).bg,
                                            color: getStatusBadge(selectedPresc).color,
                                            border: `1px solid ${getStatusBadge(selectedPresc).color}30`
                                        }}>
                                            {getStatusBadge(selectedPresc).label}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Priority</span>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'capitalize' }}>
                                        {selectedPresc.priority || 'Normal'}
                                    </div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Refills</span>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                        {selectedPresc.refill_count || 0} / {selectedPresc.max_refills || 0}
                                    </div>
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
                                    {selectedPresc.dosage && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                            Dosage: {selectedPresc.dosage}
                                            {selectedPresc.frequency && ` • Frequency: ${selectedPresc.frequency}`}
                                            {selectedPresc.duration && ` • Duration: ${selectedPresc.duration}`}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedPresc.instructions && (
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

                            {/* Additional Info */}
                            {(selectedPresc.allergies || selectedPresc.side_effects || selectedPresc.follow_up_date) && (
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
                                        <AlertCircle size={16} style={{ color: 'var(--warning-color, #F59E0B)' }} /> Additional Information
                                    </h4>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '8px'
                                    }}>
                                        {selectedPresc.allergies && (
                                            <div style={{
                                                padding: '8px',
                                                background: 'var(--bg-primary)',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border-color)'
                                            }}>
                                                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Allergies</span>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{selectedPresc.allergies}</div>
                                            </div>
                                        )}
                                        {selectedPresc.side_effects && (
                                            <div style={{
                                                padding: '8px',
                                                background: 'var(--bg-primary)',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border-color)'
                                            }}>
                                                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Side Effects</span>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{selectedPresc.side_effects}</div>
                                            </div>
                                        )}
                                        {selectedPresc.follow_up_date && (
                                            <div style={{
                                                padding: '8px',
                                                background: 'var(--bg-primary)',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border-color)'
                                            }}>
                                                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Follow-up Date</span>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                                                    {new Date(selectedPresc.follow_up_date).toLocaleDateString()}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Pharmacy & Insurance */}
                            {(selectedPresc.pharmacy_name || selectedPresc.insurance_provider) && (
                                <div style={{
                                    borderTop: '1px solid var(--border-color)',
                                    paddingTop: '14px',
                                    marginBottom: '14px'
                                }}>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '8px'
                                    }}>
                                        {selectedPresc.pharmacy_name && (
                                            <div style={{
                                                padding: '8px',
                                                background: 'var(--bg-primary)',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border-color)'
                                            }}>
                                                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Pharmacy</span>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                                    {selectedPresc.pharmacy_name}
                                                </div>
                                                {selectedPresc.pharmacy_address && (
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                        {selectedPresc.pharmacy_address}
                                                    </div>
                                                )}
                                                {selectedPresc.pharmacy_phone && (
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                        {selectedPresc.pharmacy_phone}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {selectedPresc.insurance_provider && (
                                            <div style={{
                                                padding: '8px',
                                                background: 'var(--bg-primary)',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border-color)'
                                            }}>
                                                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Insurance</span>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                                    {selectedPresc.insurance_provider}
                                                </div>
                                                {selectedPresc.insurance_number && (
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                        Policy: {selectedPresc.insurance_number}
                                                    </div>
                                                )}
                                            </div>
                                        )}
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
                                onClick={() => {
                                    setIsViewOpen(false);
                                    openEditModal(selectedPresc);
                                }}
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
                                <Edit2 size={14} /> Edit
                            </button>
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

            {/* ===== DELETE CONFIRMATION MODAL ===== */}
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
                                <br />
                                Status: <strong>{getStatusBadge(selectedPresc).label}</strong>
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

export default Prescriptions;