import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import InputField from '../components/InputField';
import {
    User, Mail, Shield, CheckCircle, AlertCircle,
    ArrowLeft, Phone, MapPin, Calendar, Stethoscope,
    Edit2, Save, X, Award, Clock, Users,
    FileText, Loader, Briefcase, BookOpen, Heart,
    Droplet, Activity, CreditCard, Building, Home,
    UserCircle, Calendar as CalendarIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

const MyProfile = () => {
    const { user, profile, updateProfile } = useAuth();
    const navigate = useNavigate();

    // ===== STATE =====
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [formErrors, setFormErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // ===== FORM DATA =====
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        cnic: '',
        date_of_birth: '',
        gender: '',
        role: '',
        department: '',
        specialization: '',
        experience: '',
        qualification: '',
        license_number: '',
        address: '',
        bio: '',
        blood_group: '',
        religion: '',
        nationality: '',
        emergency_contact: '',
        emergency_phone: '',
        shift: 'Morning',
        joining_date: '',
        salary: ''
    });

    // ===== DOCTOR STATS =====
    const [stats, setStats] = useState({
        totalPatients: 0,
        appointmentsToday: 0,
        prescriptionsIssued: 0
    });

    // ===== HANDLE RESIZE =====
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ===== GO BACK =====
    const goBack = () => {
        navigate(-1);
    };

    // ===== LOAD PROFILE DATA =====
    useEffect(() => {
        const loadData = async () => {
            setFetchLoading(true);
            setErrorMsg('');
            try {
                if (!user?.id) {
                    setFetchLoading(false);
                    return;
                }

                let profileData = null;

                // First try to get from profiles table
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    console.log('Profile not found in database, checking auth metadata');
                    // If not found in profiles, use auth metadata
                    const meta = user?.user_metadata || {};
                    profileData = {
                        name: meta.name || user?.email?.split('@')[0] || 'Staff User',
                        email: user?.email || '',
                        role: meta.role || 'Receptionist',
                        phone: meta.phone || '',
                        cnic: meta.cnic || '',
                        date_of_birth: meta.date_of_birth || '',
                        gender: meta.gender || '',
                        department: meta.department || '',
                        specialization: meta.specialization || '',
                        experience: meta.experience || '',
                        qualification: meta.qualification || '',
                        license_number: meta.license_number || '',
                        address: meta.address || '',
                        bio: meta.bio || '',
                        blood_group: meta.blood_group || '',
                        religion: meta.religion || '',
                        nationality: meta.nationality || '',
                        emergency_contact: meta.emergency_contact || '',
                        emergency_phone: meta.emergency_phone || '',
                        shift: meta.shift || 'Morning',
                        joining_date: meta.joining_date || '',
                        salary: meta.salary || ''
                    };
                } else {
                    profileData = data;
                }

                // Merge with profile from context
                const finalProfile = profile || profileData;
                setFormData({
                    name: finalProfile?.name || user?.user_metadata?.name || '',
                    email: finalProfile?.email || user?.email || '',
                    phone: finalProfile?.phone || user?.user_metadata?.phone || '',
                    cnic: finalProfile?.cnic || user?.user_metadata?.cnic || '',
                    date_of_birth: finalProfile?.date_of_birth || user?.user_metadata?.date_of_birth || '',
                    gender: finalProfile?.gender || user?.user_metadata?.gender || '',
                    role: finalProfile?.role || user?.user_metadata?.role || 'Receptionist',
                    department: finalProfile?.department || user?.user_metadata?.department || '',
                    specialization: finalProfile?.specialization || user?.user_metadata?.specialization || '',
                    experience: finalProfile?.experience || user?.user_metadata?.experience || '',
                    qualification: finalProfile?.qualification || user?.user_metadata?.qualification || '',
                    license_number: finalProfile?.license_number || user?.user_metadata?.license_number || '',
                    address: finalProfile?.address || user?.user_metadata?.address || '',
                    bio: finalProfile?.bio || user?.user_metadata?.bio || '',
                    blood_group: finalProfile?.blood_group || user?.user_metadata?.blood_group || '',
                    religion: finalProfile?.religion || user?.user_metadata?.religion || '',
                    nationality: finalProfile?.nationality || user?.user_metadata?.nationality || '',
                    emergency_contact: finalProfile?.emergency_contact || user?.user_metadata?.emergency_contact || '',
                    emergency_phone: finalProfile?.emergency_phone || user?.user_metadata?.emergency_phone || '',
                    shift: finalProfile?.shift || user?.user_metadata?.shift || 'Morning',
                    joining_date: finalProfile?.joining_date || user?.user_metadata?.joining_date || '',
                    salary: finalProfile?.salary || user?.user_metadata?.salary || ''
                });

                // Fetch doctor stats if role is Doctor
                const currentRole = finalProfile?.role || user?.user_metadata?.role || '';
                if (currentRole === 'Doctor' && user?.id) {
                    const today = new Date().toISOString().split('T')[0];

                    const { count: totalPatients } = await supabase
                        .from('appointments')
                        .select('patient_id', { count: 'exact', head: true })
                        .eq('doctor_id', user.id);

                    const { count: appointmentsToday } = await supabase
                        .from('appointments')
                        .select('*', { count: 'exact', head: true })
                        .eq('doctor_id', user.id)
                        .eq('appointment_date', today);

                    const { count: prescriptionsIssued } = await supabase
                        .from('prescriptions')
                        .select('*', { count: 'exact', head: true })
                        .eq('doctor_id', user.id);

                    setStats({
                        totalPatients: totalPatients || 0,
                        appointmentsToday: appointmentsToday || 0,
                        prescriptionsIssued: prescriptionsIssued || 0
                    });
                }

            } catch (err) {
                console.error('❌ Error loading profile:', err);
                setErrorMsg('Failed to load profile data');
            } finally {
                setFetchLoading(false);
            }
        };

        loadData();
    }, [user]);

    // ===== VALIDATION FUNCTIONS =====
    const validateField = (name, value) => {
        let error = '';

        switch (name) {
            case 'name':
                if (!value || !value.trim()) {
                    error = 'Full name is required';
                } else if (value.trim().length < 2) {
                    error = 'Name must be at least 2 characters';
                } else if (value.trim().length > 100) {
                    error = 'Name must be less than 100 characters';
                } else if (!/^[a-zA-Z\s\-'.]+$/.test(value.trim())) {
                    error = 'Name contains invalid characters';
                }
                break;

            case 'phone':
                if (value && value.trim() && !/^\+?[0-9\s-]{7,15}$/.test(value.trim())) {
                    error = 'Enter a valid phone number';
                }
                break;

            case 'email':
                if (value && value.trim()) {
                    if (!/\S+@\S+\.\S+/.test(value.trim())) {
                        error = 'Enter a valid email address';
                    }
                }
                break;

            case 'cnic':
                if (value && value.trim()) {
                    if (!/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/.test(value.trim())) {
                        error = 'Enter valid CNIC format (xxxxx-xxxxxxx-x)';
                    }
                }
                break;

            case 'date_of_birth':
                if (value && value.trim()) {
                    const dob = new Date(value);
                    const today = new Date();
                    let age = today.getFullYear() - dob.getFullYear();
                    const m = today.getMonth() - dob.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                        age--;
                    }
                    if (age < 0 || age > 120) {
                        error = 'Please enter a valid date of birth';
                    }
                }
                break;

            case 'blood_group':
                if (value && !['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(value)) {
                    error = 'Please select a valid blood group';
                }
                break;

            case 'experience':
                if (value && value.trim() && !/^[0-9]+$/.test(value.trim())) {
                    error = 'Experience must be a number';
                } else if (value && parseInt(value) > 50) {
                    error = 'Experience cannot be more than 50 years';
                }
                break;

            case 'salary':
                if (value && value.trim() && !/^[0-9,]+$/.test(value.trim().replace(/,/g, ''))) {
                    error = 'Salary must be a number';
                }
                break;

            case 'emergency_phone':
                if (value && value.trim() && !/^\+?[0-9\s-]{7,15}$/.test(value.trim())) {
                    error = 'Enter a valid emergency phone number';
                }
                break;

            case 'emergency_contact':
                if (value && value.trim().length < 2) {
                    error = 'Emergency contact name must be at least 2 characters';
                }
                break;

            case 'address':
                if (value && value.trim().length > 200) {
                    error = 'Address must be less than 200 characters';
                }
                break;

            case 'bio':
                if (value && value.trim().length > 500) {
                    error = 'Bio must be less than 500 characters';
                }
                break;

            default:
                break;
        }

        return error;
    };

    const validateForm = () => {
        const errors = {};
        const fields = ['name', 'phone', 'email', 'cnic', 'date_of_birth',
            'blood_group', 'experience', 'salary', 'emergency_phone',
            'emergency_contact', 'address', 'bio'];

        fields.forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) {
                errors[field] = error;
            }
        });

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, value);
        setFormErrors(prev => ({ ...prev, [name]: error }));
    };

    // ===== HANDLE INPUT CHANGE =====
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // ===== SAVE PROFILE - FIXED =====
    const handleSubmit = async (e) => {
        e.preventDefault();

        const allFields = ['name', 'phone', 'email', 'cnic', 'date_of_birth',
            'blood_group', 'experience', 'salary', 'emergency_phone',
            'emergency_contact', 'address', 'bio'];
        const touchedFields = {};
        allFields.forEach(field => {
            touchedFields[field] = true;
        });
        setTouched(touchedFields);

        if (!validateForm()) {
            setErrorMsg('Please fix all validation errors before submitting.');
            return;
        }

        setLoading(true);
        setSuccessMsg('');
        setErrorMsg('');

        try {
            const profileData = {
                name: formData.name.trim(),
                role: formData.role || 'Receptionist',
                phone: formData.phone || '',
                cnic: formData.cnic || '',
                date_of_birth: formData.date_of_birth || '',
                gender: formData.gender || '',
                department: formData.department || '',
                specialization: formData.specialization || '',
                experience: formData.experience || '',
                qualification: formData.qualification || '',
                license_number: formData.license_number || '',
                address: formData.address || '',
                bio: formData.bio || '',
                blood_group: formData.blood_group || '',
                religion: formData.religion || '',
                nationality: formData.nationality || '',
                emergency_contact: formData.emergency_contact || '',
                emergency_phone: formData.emergency_phone || '',
                shift: formData.shift || 'Morning',
                joining_date: formData.joining_date || '',
                salary: formData.salary || '',
                updated_at: new Date().toISOString()
            };

            console.log('📝 Saving profile data:', profileData);

            // First try to update the profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update(profileData)
                .eq('id', user.id);

            if (updateError) {
                // If update fails, try to insert
                if (updateError.code === 'PGRST116' || updateError.message.includes('not found')) {
                    console.log('Profile not found, inserting new record...');
                    const { error: insertError } = await supabase
                        .from('profiles')
                        .insert([{
                            id: user.id,
                            ...profileData,
                            created_at: new Date().toISOString()
                        }]);

                    if (insertError) {
                        throw insertError;
                    }
                } else {
                    throw updateError;
                }
            }

            // Also update auth metadata
            const { error: metaError } = await supabase.auth.updateUser({
                data: {
                    name: formData.name.trim(),
                    role: formData.role || 'Receptionist',
                    phone: formData.phone || '',
                    cnic: formData.cnic || '',
                    date_of_birth: formData.date_of_birth || '',
                    gender: formData.gender || '',
                    department: formData.department || '',
                    specialization: formData.specialization || '',
                    experience: formData.experience || '',
                    qualification: formData.qualification || '',
                    license_number: formData.license_number || '',
                    address: formData.address || '',
                    bio: formData.bio || '',
                    blood_group: formData.blood_group || '',
                    religion: formData.religion || '',
                    nationality: formData.nationality || '',
                    emergency_contact: formData.emergency_contact || '',
                    emergency_phone: formData.emergency_phone || '',
                    shift: formData.shift || 'Morning',
                    joining_date: formData.joining_date || '',
                    salary: formData.salary || ''
                }
            });

            if (metaError) {
                console.warn('Failed to update auth metadata:', metaError);
            }

            setSuccessMsg('✅ Profile updated successfully!');
            setIsEditing(false);

            // Update the local state
            setFormData({
                ...formData,
                name: formData.name.trim(),
                role: formData.role || 'Receptionist',
                phone: formData.phone || '',
                cnic: formData.cnic || '',
                date_of_birth: formData.date_of_birth || '',
                gender: formData.gender || '',
                department: formData.department || '',
                specialization: formData.specialization || '',
                experience: formData.experience || '',
                qualification: formData.qualification || '',
                license_number: formData.license_number || '',
                address: formData.address || '',
                bio: formData.bio || '',
                blood_group: formData.blood_group || '',
                religion: formData.religion || '',
                nationality: formData.nationality || '',
                emergency_contact: formData.emergency_contact || '',
                emergency_phone: formData.emergency_phone || '',
                shift: formData.shift || 'Morning',
                joining_date: formData.joining_date || '',
                salary: formData.salary || ''
            });

            setTimeout(() => {
                setSuccessMsg('');
            }, 3000);

        } catch (err) {
            console.error('❌ Save error:', err);
            setErrorMsg(err.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    // ===== CANCEL EDIT =====
    const handleCancel = () => {
        setIsEditing(false);
        // Reload the profile data
        const loadData = async () => {
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    setFormData({
                        name: data.name || '',
                        email: data.email || user?.email || '',
                        phone: data.phone || '',
                        cnic: data.cnic || '',
                        date_of_birth: data.date_of_birth || '',
                        gender: data.gender || '',
                        role: data.role || 'Receptionist',
                        department: data.department || '',
                        specialization: data.specialization || '',
                        experience: data.experience || '',
                        qualification: data.qualification || '',
                        license_number: data.license_number || '',
                        address: data.address || '',
                        bio: data.bio || '',
                        blood_group: data.blood_group || '',
                        religion: data.religion || '',
                        nationality: data.nationality || '',
                        emergency_contact: data.emergency_contact || '',
                        emergency_phone: data.emergency_phone || '',
                        shift: data.shift || 'Morning',
                        joining_date: data.joining_date || '',
                        salary: data.salary || ''
                    });
                }
            } catch (err) {
                console.error('Error reloading profile:', err);
            }
        };
        loadData();
        setFormErrors({});
        setTouched({});
        setErrorMsg('');
    };

    const userInitial = formData.name.charAt(0).toUpperCase() || 'U';
    const isDoctor = formData.role === 'Doctor';

    // ===== BLOOD GROUPS =====
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const genders = ['Male', 'Female', 'Other'];
    const shifts = ['Morning', 'Evening', 'Night', 'Rotating'];
    const roles = ['Admin', 'Doctor', 'Receptionist', 'Pharmacist', 'Billing Staff'];
    const departments = ['Administration', 'Medical', 'Pharmacy', 'Billing', 'Nursing',
        'Laboratory', 'Radiology', 'Inventory', 'IT', 'Security'];

    // ===== RENDER INPUT =====
    const renderInput = (name, label, type = 'text', placeholder = '', required = false, options = null) => {
        const hasError = formErrors[name] && touched[name];
        const value = formData[name];

        const handleFocus = (e) => {
            if (!hasError) {
                e.target.style.borderColor = 'var(--primary-color)';
                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
            }
        };

        const handleBlurWithStyles = (e) => {
            handleBlur(e);
            if (!hasError) {
                e.target.style.borderColor = 'var(--border-color)';
                e.target.style.boxShadow = 'none';
            }
        };

        if (type === 'select' && options) {
            return (
                <div className="form-group" key={name}>
                    <label style={{
                        display: 'block',
                        fontSize: isMobile ? '0.8rem' : '0.85rem',
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        marginBottom: '6px'
                    }}>
                        {label} {required && <span style={{ color: 'var(--danger-color)' }}>*</span>}
                    </label>
                    <div style={{ position: 'relative' }}>
                        <select
                            name={name}
                            value={value}
                            onChange={handleChange}
                            onBlur={handleBlurWithStyles}
                            style={{
                                width: '100%',
                                height: isMobile ? '48px' : '45px',
                                padding: '0 16px',
                                border: hasError ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                borderRadius: '10px',
                                fontSize: isMobile ? '16px' : '0.95rem',
                                fontFamily: 'inherit',
                                outline: 'none',
                                background: 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                appearance: 'none',
                                boxSizing: 'border-box',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer'
                            }}
                            onFocus={handleFocus}
                        >
                            <option value="">Select {label}</option>
                            {options.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                        <div style={{
                            position: 'absolute',
                            right: '14px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                            color: 'var(--text-muted)'
                        }}>
                            <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                                <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                    {hasError && (
                        <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--danger-color)',
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <AlertCircle size={14} />
                            {formErrors[name]}
                        </div>
                    )}
                </div>
            );
        }

        if (type === 'textarea') {
            return (
                <div className="form-group" key={name}>
                    <label style={{
                        display: 'block',
                        fontSize: isMobile ? '0.8rem' : '0.85rem',
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        marginBottom: '6px'
                    }}>
                        {label} {required && <span style={{ color: 'var(--danger-color)' }}>*</span>}
                    </label>
                    <textarea
                        name={name}
                        value={value}
                        onChange={handleChange}
                        onBlur={handleBlurWithStyles}
                        placeholder={placeholder}
                        rows={isMobile ? 4 : 3}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: hasError ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                            borderRadius: '10px',
                            fontSize: isMobile ? '16px' : '0.95rem',
                            fontFamily: 'inherit',
                            outline: 'none',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            resize: 'vertical',
                            minHeight: isMobile ? '100px' : '80px',
                            boxSizing: 'border-box',
                            transition: 'all 0.2s ease'
                        }}
                        onFocus={handleFocus}
                    />
                    {hasError && (
                        <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--danger-color)',
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <AlertCircle size={14} />
                            {formErrors[name]}
                        </div>
                    )}
                </div>
            );
        }

        if (type === 'date') {
            return (
                <div className="form-group" key={name}>
                    <label style={{
                        display: 'block',
                        fontSize: isMobile ? '0.8rem' : '0.85rem',
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        marginBottom: '6px'
                    }}>
                        {label} {required && <span style={{ color: 'var(--danger-color)' }}>*</span>}
                    </label>
                    <input
                        name={name}
                        type="date"
                        value={value}
                        onChange={handleChange}
                        onBlur={handleBlurWithStyles}
                        style={{
                            width: '100%',
                            height: isMobile ? '48px' : '45px',
                            padding: '0 16px',
                            border: hasError ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                            borderRadius: '10px',
                            fontSize: isMobile ? '16px' : '0.95rem',
                            fontFamily: 'inherit',
                            outline: 'none',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            boxSizing: 'border-box',
                            transition: 'all 0.2s ease'
                        }}
                        onFocus={handleFocus}
                    />
                    {hasError && (
                        <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--danger-color)',
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <AlertCircle size={14} />
                            {formErrors[name]}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="form-group" key={name}>
                <label style={{
                    display: 'block',
                    fontSize: isMobile ? '0.8rem' : '0.85rem',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    marginBottom: '6px'
                }}>
                    {label} {required && <span style={{ color: 'var(--danger-color)' }}>*</span>}
                </label>
                <input
                    name={name}
                    type={type}
                    value={value}
                    onChange={handleChange}
                    onBlur={handleBlurWithStyles}
                    placeholder={placeholder}
                    style={{
                        width: '100%',
                        height: isMobile ? '48px' : '45px',
                        padding: '0 16px',
                        border: hasError ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                        borderRadius: '10px',
                        fontSize: isMobile ? '16px' : '0.95rem',
                        fontFamily: 'inherit',
                        outline: 'none',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        boxSizing: 'border-box',
                        transition: 'all 0.2s ease'
                    }}
                    onFocus={handleFocus}
                />
                {hasError && (
                    <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--danger-color)',
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <AlertCircle size={14} />
                        {formErrors[name]}
                    </div>
                )}
            </div>
        );
    };

    if (fetchLoading) {
        return (
            <DashboardLayout active="profile" title="My Profile" showSearch={false}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '60vh',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    <Loader size={40} className="spinner" />
                    <p style={{ color: 'var(--text-secondary)' }}>Loading profile...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout active="profile" title="My Profile" showSearch={false}>
            <div style={{
                maxWidth: '860px',
                margin: '0 auto',
                padding: isMobile ? '0 8px' : '0'
            }}>

                {/* ===== BACK BUTTON ===== */}
                <button
                    onClick={goBack}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: isMobile ? '10px 16px' : '8px 16px',
                        marginBottom: isMobile ? '12px' : '16px',
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: isMobile ? '0.85rem' : '0.9rem',
                        fontFamily: 'var(--font-family)',
                        color: 'var(--text-secondary)',
                        transition: 'all 0.2s ease',
                        width: isMobile ? '100%' : 'auto',
                        justifyContent: isMobile ? 'center' : 'flex-start'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--hover-bg)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                        e.currentTarget.style.borderColor = 'var(--primary-color)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--card-bg)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                >
                    <ArrowLeft size={isMobile ? 18 : 18} /> Back to Dashboard
                </button>

                {/* ===== PROFILE CARD ===== */}
                <div style={{
                    padding: isMobile ? '16px' : '32px',
                    borderRadius: isMobile ? '12px' : '16px',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)'
                }}>

                    {/* ===== HEADER ===== */}
                    <div style={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: isMobile ? 'center' : 'flex-start',
                        gap: isMobile ? '16px' : '20px',
                        paddingBottom: isMobile ? '16px' : '20px',
                        borderBottom: '1px solid var(--border-color)'
                    }}>
                        <div style={{
                            width: isMobile ? '72px' : '84px',
                            height: isMobile ? '72px' : '84px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--primary-color), #7C3AED)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: isMobile ? '1.8rem' : '2.2rem',
                            fontWeight: 600,
                            flexShrink: 0
                        }}>
                            {userInitial}
                        </div>

                        <div style={{
                            flex: 1,
                            textAlign: isMobile ? 'center' : 'left',
                            width: isMobile ? '100%' : 'auto'
                        }}>
                            <h2 style={{
                                fontSize: isMobile ? '1.2rem' : '1.5rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                margin: 0
                            }}>
                                {formData.name || 'Staff User'}
                            </h2>
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '6px',
                                marginTop: '6px',
                                justifyContent: isMobile ? 'center' : 'flex-start'
                            }}>
                                <span style={{
                                    padding: '4px 14px',
                                    fontSize: '0.75rem',
                                    borderRadius: '20px',
                                    background: 'rgba(37, 99, 235, 0.1)',
                                    color: '#2563EB'
                                }}>
                                    {formData.role}
                                </span>
                                {isDoctor && formData.specialization && (
                                    <span style={{
                                        padding: '4px 14px',
                                        fontSize: '0.75rem',
                                        borderRadius: '20px',
                                        background: 'rgba(37, 99, 235, 0.08)',
                                        color: '#2563EB'
                                    }}>
                                        <Stethoscope size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                        {formData.specialization}
                                    </span>
                                )}
                            </div>
                        </div>

                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: isMobile ? '10px 20px' : '8px 20px',
                                    background: 'var(--primary-color)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: isMobile ? '0.85rem' : '0.85rem',
                                    fontFamily: 'var(--font-family)',
                                    fontWeight: 500,
                                    transition: 'all 0.2s ease',
                                    width: isMobile ? '100%' : 'auto',
                                    justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#1D4ED8';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'var(--primary-color)';
                                }}
                            >
                                <Edit2 size={isMobile ? 18 : 16} /> Edit Profile
                            </button>
                        )}
                    </div>

                    {/* ===== MESSAGES ===== */}
                    {successMsg && (
                        <div style={{
                            marginTop: isMobile ? '16px' : '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: isMobile ? '12px 16px' : '12px 16px',
                            fontSize: isMobile ? '0.9rem' : '0.9rem',
                            borderRadius: '8px',
                            background: 'var(--success-color)15',
                            border: '1px solid var(--success-color)30',
                            color: 'var(--success-color)'
                        }}>
                            <CheckCircle size={isMobile ? 20 : 18} style={{ flexShrink: 0 }} />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {errorMsg && (
                        <div style={{
                            marginTop: isMobile ? '16px' : '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: isMobile ? '12px 16px' : '12px 16px',
                            fontSize: isMobile ? '0.9rem' : '0.9rem',
                            borderRadius: '8px',
                            background: 'var(--danger-color)15',
                            border: '1px solid var(--danger-color)30',
                            color: 'var(--danger-color)'
                        }}>
                            <AlertCircle size={isMobile ? 20 : 18} style={{ flexShrink: 0 }} />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* ===== DOCTOR STATS ===== */}
                    {isDoctor && !isEditing && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr 1fr 1fr' : 'repeat(3, 1fr)',
                            gap: isMobile ? '8px' : '12px',
                            marginTop: isMobile ? '16px' : '20px',
                            padding: isMobile ? '14px' : '16px',
                            background: 'var(--bg-primary)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    fontSize: isMobile ? '1.1rem' : '1.4rem',
                                    fontWeight: 700,
                                    color: 'var(--primary-color)'
                                }}>
                                    {stats.totalPatients}
                                </div>
                                <div style={{
                                    fontSize: '0.55rem',
                                    color: 'var(--text-muted)',
                                    marginTop: '2px'
                                }}>
                                    <Users size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                    Patients
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    fontSize: isMobile ? '1.1rem' : '1.4rem',
                                    fontWeight: 700,
                                    color: 'var(--success-color)'
                                }}>
                                    {stats.appointmentsToday}
                                </div>
                                <div style={{
                                    fontSize: '0.55rem',
                                    color: 'var(--text-muted)',
                                    marginTop: '2px'
                                }}>
                                    <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                    Today
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    fontSize: isMobile ? '1.1rem' : '1.4rem',
                                    fontWeight: 700,
                                    color: 'var(--purple-color)'
                                }}>
                                    {stats.prescriptionsIssued}
                                </div>
                                <div style={{
                                    fontSize: '0.55rem',
                                    color: 'var(--text-muted)',
                                    marginTop: '2px'
                                }}>
                                    <FileText size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                    Prescriptions
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== VIEW MODE ===== */}
                    {!isEditing && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                            gap: isMobile ? '10px' : '16px',
                            marginTop: isMobile ? '16px' : '20px'
                        }}>
                            {/* Personal Information */}
                            <div style={{
                                padding: isMobile ? '12px 14px' : '12px 16px',
                                background: 'var(--bg-primary)',
                                borderRadius: '10px',
                                border: '1px solid var(--border-color)',
                                gridColumn: isMobile ? '1' : '1 / -1'
                            }}>
                                <div style={{
                                    fontSize: '0.6rem',
                                    color: 'var(--text-muted)',
                                    textTransform: 'uppercase',
                                    fontWeight: 600,
                                    letterSpacing: '0.5px',
                                    marginBottom: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    <User size={14} style={{ color: 'var(--primary-color)' }} />
                                    Personal Information
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                                    gap: '8px'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Name</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                            {formData.name || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Email</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                            {formData.email || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Phone</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                            {formData.phone || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>CNIC</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                            {formData.cnic || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Date of Birth</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                            {formData.date_of_birth || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Gender</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                            {formData.gender || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Blood Group</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                            {formData.blood_group || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Religion</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                            {formData.religion || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Nationality</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                            {formData.nationality || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Employment Information */}
                            <div style={{
                                padding: isMobile ? '12px 14px' : '12px 16px',
                                background: 'var(--bg-primary)',
                                borderRadius: '10px',
                                border: '1px solid var(--border-color)',
                                gridColumn: isMobile ? '1' : '1 / -1'
                            }}>
                                <div style={{
                                    fontSize: '0.6rem',
                                    color: 'var(--text-muted)',
                                    textTransform: 'uppercase',
                                    fontWeight: 600,
                                    letterSpacing: '0.5px',
                                    marginBottom: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    <Briefcase size={14} style={{ color: 'var(--secondary-color)' }} />
                                    Employment Information
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                                    gap: '8px'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Role</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                            {formData.role || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Department</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                            {formData.department || 'N/A'}
                                        </div>
                                    </div>
                                    {isDoctor && (
                                        <>
                                            <div>
                                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Specialization</div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                                    {formData.specialization || 'N/A'}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Qualification</div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                                    {formData.qualification || 'N/A'}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Experience</div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                                    {formData.experience || 'N/A'} years
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>License Number</div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                                    {formData.license_number || 'N/A'}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    <div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Shift</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                            {formData.shift || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Joining Date</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                            {formData.joining_date || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Salary</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                            {formData.salary ? `$${formData.salary}` : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Address & Emergency Contact */}
                            {formData.address && (
                                <div style={{
                                    padding: isMobile ? '12px 14px' : '12px 16px',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)',
                                    gridColumn: '1 / -1'
                                }}>
                                    <div style={{
                                        fontSize: '0.6rem',
                                        color: 'var(--text-muted)',
                                        textTransform: 'uppercase',
                                        fontWeight: 600,
                                        letterSpacing: '0.5px',
                                        marginBottom: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <MapPin size={14} style={{ color: 'var(--warning-color)' }} />
                                        Address & Emergency Contact
                                    </div>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                                        gap: '8px'
                                    }}>
                                        <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Address</div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                                {formData.address || 'N/A'}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Emergency Contact</div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                                {formData.emergency_contact || 'N/A'}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Emergency Phone</div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                                {formData.emergency_phone || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Bio */}
                            {formData.bio && (
                                <div style={{
                                    padding: isMobile ? '12px 14px' : '12px 16px',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)',
                                    gridColumn: '1 / -1'
                                }}>
                                    <div style={{
                                        fontSize: '0.6rem',
                                        color: 'var(--text-muted)',
                                        textTransform: 'uppercase',
                                        fontWeight: 600,
                                        letterSpacing: '0.5px',
                                        marginBottom: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <FileText size={14} style={{ color: 'var(--purple-color)' }} />
                                        Bio / About
                                    </div>
                                    <div style={{
                                        fontSize: '0.9rem',
                                        color: 'var(--text-primary)',
                                        lineHeight: 1.6,
                                        fontWeight: 400
                                    }}>
                                        {formData.bio}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ===== EDIT MODE ===== */}
                    {isEditing && (
                        <form onSubmit={handleSubmit} style={{
                            marginTop: isMobile ? '16px' : '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: isMobile ? '14px' : '16px'
                        }}>
                            {/* Personal Information */}
                            <div style={{
                                background: 'var(--bg-primary)',
                                borderRadius: '12px',
                                padding: isMobile ? '14px' : '16px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: isMobile ? '12px' : '14px',
                                    borderBottom: '1px solid var(--border-color)',
                                    paddingBottom: '8px'
                                }}>
                                    <User size={18} style={{ color: 'var(--primary-color)' }} />
                                    <span style={{
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)'
                                    }}>Personal Information</span>
                                </div>

                                {renderInput('name', 'Full Name', 'text', 'Your full name', true)}
                                {renderInput('email', 'Email Address', 'email', 'your@email.com')}
                                {renderInput('phone', 'Phone Number', 'text', 'e.g. 03001234567')}
                                {renderInput('cnic', 'CNIC / ID Number', 'text', 'xxxxx-xxxxxxx-x')}
                                {renderInput('date_of_birth', 'Date of Birth', 'date', '')}
                                {renderInput('gender', 'Gender', 'select', '', false, genders)}
                                {renderInput('blood_group', 'Blood Group', 'select', '', false, bloodGroups)}
                                {renderInput('religion', 'Religion', 'text', 'e.g. Islam')}
                                {renderInput('nationality', 'Nationality', 'text', 'e.g. Pakistani')}
                            </div>

                            {/* Employment Details */}
                            <div style={{
                                background: 'var(--bg-primary)',
                                borderRadius: '12px',
                                padding: isMobile ? '14px' : '16px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: isMobile ? '12px' : '14px',
                                    borderBottom: '1px solid var(--border-color)',
                                    paddingBottom: '8px'
                                }}>
                                    <Briefcase size={18} style={{ color: 'var(--secondary-color)' }} />
                                    <span style={{
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)'
                                    }}>Employment Details</span>
                                </div>

                                <div className="form-group">
                                    <label className="form-label" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '0.85rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)'
                                    }}>
                                        <Shield size={isMobile ? 16 : 16} /> Role
                                    </label>
                                    <select
                                        name="role"
                                        className="hms-select"
                                        style={{
                                            width: '100%',
                                            height: isMobile ? '48px' : '45px',
                                            fontSize: isMobile ? '16px' : '0.9rem',
                                            padding: isMobile ? '10px 14px' : '8px 14px',
                                            borderRadius: '10px',
                                            border: '1.5px solid var(--border-color)',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            fontFamily: 'var(--font-family)'
                                        }}
                                        value={formData.role}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        disabled={loading}
                                        onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                                    >
                                        <option value="">Select Role</option>
                                        {roles.map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                </div>

                                {renderInput('department', 'Department', 'select', '', false, departments)}

                                {formData.role === 'Doctor' && (
                                    <>
                                        {renderInput('specialization', 'Specialization', 'text', 'e.g. Cardiology')}
                                        {renderInput('qualification', 'Qualification', 'text', 'e.g. MBBS, FCPS')}
                                        {renderInput('experience', 'Experience (Years)', 'text', 'e.g. 5')}
                                        {renderInput('license_number', 'License Number', 'text', 'e.g. PMC-12345')}
                                    </>
                                )}

                                {renderInput('shift', 'Shift', 'select', '', false, shifts)}
                                {renderInput('joining_date', 'Joining Date', 'date', '')}
                                {renderInput('salary', 'Salary', 'text', 'e.g. 50000')}
                            </div>

                            {/* Address & Emergency Contact */}
                            <div style={{
                                background: 'var(--bg-primary)',
                                borderRadius: '12px',
                                padding: isMobile ? '14px' : '16px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: isMobile ? '12px' : '14px',
                                    borderBottom: '1px solid var(--border-color)',
                                    paddingBottom: '8px'
                                }}>
                                    <MapPin size={18} style={{ color: 'var(--warning-color)' }} />
                                    <span style={{
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)'
                                    }}>Address & Emergency Contact</span>
                                </div>

                                {renderInput('address', 'Address', 'textarea', 'Enter your address')}
                                {renderInput('emergency_contact', 'Emergency Contact Name', 'text', 'e.g. Sara Khan (Wife)')}
                                {renderInput('emergency_phone', 'Emergency Phone', 'text', 'e.g. 0300-9876543')}
                            </div>

                            {/* Bio */}
                            <div style={{
                                background: 'var(--bg-primary)',
                                borderRadius: '12px',
                                padding: isMobile ? '14px' : '16px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: isMobile ? '12px' : '14px',
                                    borderBottom: '1px solid var(--border-color)',
                                    paddingBottom: '8px'
                                }}>
                                    <FileText size={18} style={{ color: 'var(--purple-color)' }} />
                                    <span style={{
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)'
                                    }}>Bio / About</span>
                                </div>

                                {renderInput('bio', 'Bio / About', 'textarea', 'Tell us about yourself...')}
                            </div>

                            {/* Form Actions */}
                            <div style={{
                                display: 'flex',
                                flexDirection: isMobile ? 'column' : 'row',
                                gap: isMobile ? '12px' : '12px',
                                marginTop: isMobile ? '8px' : '8px',
                                borderTop: '1px solid var(--border-color)',
                                paddingTop: isMobile ? '20px' : '20px'
                            }}>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    style={{
                                        padding: isMobile ? '14px 20px' : '10px 24px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        fontSize: isMobile ? '1rem' : '0.85rem',
                                        fontFamily: 'var(--font-family)',
                                        color: 'var(--text-secondary)',
                                        transition: 'all 0.2s ease',
                                        width: isMobile ? '100%' : 'auto',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'var(--hover-bg)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    <X size={isMobile ? 18 : 16} />
                                    Cancel
                                </button>
                                <Button
                                    type="submit"
                                    loading={loading}
                                    style={{
                                        width: isMobile ? '100%' : 'auto',
                                        justifyContent: 'center',
                                        padding: isMobile ? '14px 20px' : '10px 24px',
                                        fontSize: isMobile ? '1rem' : '0.85rem',
                                        borderRadius: '10px'
                                    }}
                                >
                                    <Save size={isMobile ? 18 : 16} style={{ display: 'inline', marginRight: '6px' }} />
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            <style>{`
                .spinner {
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                input:focus, select:focus, textarea:focus {
                    outline: none;
                }
                
                input::placeholder, textarea::placeholder {
                    color: var(--text-muted);
                }
            `}</style>
        </DashboardLayout>
    );
};

export default MyProfile;