import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import InputField from '../components/InputField';
import {
    User, Mail, Shield, CheckCircle, AlertCircle,
    ArrowLeft, Phone, MapPin, Calendar, Stethoscope,
    Edit2, Save, X, Camera, Award, Clock, Users,
    FileText, Activity, HeartPulse, Loader
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

    // ===== FORM DATA =====
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: '',
        specialization: '',
        experience: '',
        qualification: '',
        address: '',
        bio: '',
        gender: ''
    });

    // ===== DOCTOR STATS =====
    const [stats, setStats] = useState({
        totalPatients: 0,
        appointmentsToday: 0,
        prescriptionsIssued: 0
    });

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
                console.log('🔍 Loading profile for user:', user?.id);

                if (!user?.id) {
                    console.warn('No user ID found');
                    setFetchLoading(false);
                    return;
                }

                let profileData = null;

                // Try to get from profiles table
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    console.warn('Profile not found in database, using auth metadata:', error.message);
                    // Use auth metadata
                    const meta = user?.user_metadata || {};
                    profileData = {
                        name: meta.name || user?.email?.split('@')[0] || 'Staff User',
                        email: user?.email || '',
                        role: meta.role || 'Receptionist',
                        phone: meta.phone || '',
                        specialization: meta.specialization || '',
                        experience: meta.experience || '',
                        qualification: meta.qualification || '',
                        address: meta.address || '',
                        bio: meta.bio || '',
                        gender: meta.gender || ''
                    };
                } else {
                    console.log('✅ Profile loaded from database:', data);
                    profileData = data;
                }

                // Also check profile from AuthContext
                const finalProfile = profile || profileData;
                setFormData({
                    name: finalProfile?.name || user?.user_metadata?.name || '',
                    email: finalProfile?.email || user?.email || '',
                    phone: finalProfile?.phone || user?.user_metadata?.phone || '',
                    role: finalProfile?.role || user?.user_metadata?.role || 'Receptionist',
                    specialization: finalProfile?.specialization || user?.user_metadata?.specialization || '',
                    experience: finalProfile?.experience || user?.user_metadata?.experience || '',
                    qualification: finalProfile?.qualification || user?.user_metadata?.qualification || '',
                    address: finalProfile?.address || user?.user_metadata?.address || '',
                    bio: finalProfile?.bio || user?.user_metadata?.bio || '',
                    gender: finalProfile?.gender || user?.user_metadata?.gender || ''
                });

                console.log('📋 Form data set:', formData);

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

    // ===== HANDLE INPUT CHANGE =====
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // ===== VALIDATE =====
    const validateForm = () => {
        const errors = {};
        if (!formData.name.trim()) {
            errors.name = 'Full name is required';
        } else if (formData.name.trim().length < 2) {
            errors.name = 'Name must be at least 2 characters';
        }
        if (formData.phone && !/^\+?[0-9\s-]{7,15}$/.test(formData.phone)) {
            errors.phone = 'Enter a valid phone number';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // ===== SAVE PROFILE =====
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);
        setSuccessMsg('');
        setErrorMsg('');

        try {
            const profileData = {
                name: formData.name.trim(),
                role: formData.role || 'Receptionist',
                phone: formData.phone || '',
                specialization: formData.specialization || '',
                experience: formData.experience || '',
                qualification: formData.qualification || '',
                address: formData.address || '',
                bio: formData.bio || '',
                gender: formData.gender || ''
            };

            console.log('📝 Saving profile data:', profileData);

            // Update profile using AuthContext
            const result = await updateProfile(profileData);
            console.log('✅ Profile saved successfully:', result);

            setSuccessMsg('✅ Profile updated successfully!');
            setIsEditing(false);

            // Refresh data after save
            setTimeout(() => {
                setSuccessMsg('');
                window.location.reload();
            }, 2000);

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
        // Reset to current values
        setFormData({
            name: profile?.name || user?.user_metadata?.name || '',
            email: profile?.email || user?.email || '',
            phone: profile?.phone || user?.user_metadata?.phone || '',
            role: profile?.role || user?.user_metadata?.role || 'Receptionist',
            specialization: profile?.specialization || user?.user_metadata?.specialization || '',
            experience: profile?.experience || user?.user_metadata?.experience || '',
            qualification: profile?.qualification || user?.user_metadata?.qualification || '',
            address: profile?.address || user?.user_metadata?.address || '',
            bio: profile?.bio || user?.user_metadata?.bio || '',
            gender: profile?.gender || user?.user_metadata?.gender || ''
        });
        setFormErrors({});
        setErrorMsg('');
    };

    const userInitial = formData.name.charAt(0).toUpperCase() || 'U';
    const isDoctor = formData.role === 'Doctor';

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
            <div style={{ maxWidth: '720px', margin: '0 auto' }}>

                {/* ===== BACK BUTTON ===== */}
                <div style={{ marginBottom: '16px' }}>
                    <button
                        onClick={goBack}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
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
                            e.currentTarget.style.background = 'var(--hover-bg)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                            e.currentTarget.style.borderColor = 'var(--primary-color)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                        }}
                    >
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>
                </div>

                {/* ===== PROFILE CARD ===== */}
                <div className="auth-card" style={{ padding: '30px' }}>

                    {/* ===== HEADER ===== */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: '16px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                fontSize: '2rem',
                                flexShrink: 0,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--primary-color), #7C3AED)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 600
                            }}>
                                {userInitial}
                            </div>
                            <div>
                                <h2 style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    margin: 0
                                }}>
                                    {formData.name || 'Staff User'}
                                </h2>
                                <span className="hms-badge info" style={{ marginTop: '4px', display: 'inline-block' }}>
                                    {formData.role}
                                </span>
                                {isDoctor && (
                                    <span className="hms-badge primary" style={{ marginTop: '4px', marginLeft: '6px', display: 'inline-block' }}>
                                        <Stethoscope size={12} style={{ marginRight: '4px' }} />
                                        {formData.specialization || 'General'}
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
                                    padding: '8px 16px',
                                    background: 'var(--primary-color)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-family)',
                                    fontWeight: 500,
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#1D4ED8';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'var(--primary-color)';
                                }}
                            >
                                <Edit2 size={16} /> Edit Profile
                            </button>
                        )}
                    </div>

                    {/* ===== MESSAGES ===== */}
                    {successMsg && (
                        <div className="alert alert-success" style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle size={18} style={{ flexShrink: 0 }} />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {errorMsg && (
                        <div className="alert alert-danger" style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertCircle size={18} style={{ flexShrink: 0 }} />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* ===== DOCTOR STATS ===== */}
                    {isDoctor && !isEditing && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                            gap: '12px',
                            marginTop: '20px',
                            padding: '16px',
                            background: 'var(--bg-primary)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                                    {stats.totalPatients}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                    <Users size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                    Total Patients
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--success-color)' }}>
                                    {stats.appointmentsToday}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                    <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                    Today's Appointments
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--purple-color)' }}>
                                    {stats.prescriptionsIssued}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                    <FileText size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                    Prescriptions
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== VIEW MODE ===== */}
                    {!isEditing && (
                        <>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '16px',
                                marginTop: '20px'
                            }}>
                                <div style={{
                                    padding: '12px',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div style={{
                                        fontSize: '0.6rem',
                                        color: 'var(--text-muted)',
                                        textTransform: 'uppercase',
                                        marginBottom: '4px'
                                    }}>
                                        <Mail size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                        Email
                                    </div>
                                    <div style={{
                                        fontSize: '0.85rem',
                                        color: 'var(--text-primary)',
                                        fontWeight: 500
                                    }}>
                                        {formData.email || 'N/A'}
                                    </div>
                                </div>

                                <div style={{
                                    padding: '12px',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div style={{
                                        fontSize: '0.6rem',
                                        color: 'var(--text-muted)',
                                        textTransform: 'uppercase',
                                        marginBottom: '4px'
                                    }}>
                                        <Phone size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                        Phone
                                    </div>
                                    <div style={{
                                        fontSize: '0.85rem',
                                        color: 'var(--text-primary)',
                                        fontWeight: 500
                                    }}>
                                        {formData.phone || 'N/A'}
                                    </div>
                                </div>
                            </div>

                            {/* Doctor Details */}
                            {isDoctor && (
                                <>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '16px',
                                        marginTop: '16px'
                                    }}>
                                        <div style={{
                                            padding: '12px',
                                            background: 'var(--bg-primary)',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)'
                                        }}>
                                            <div style={{
                                                fontSize: '0.6rem',
                                                color: 'var(--text-muted)',
                                                textTransform: 'uppercase',
                                                marginBottom: '4px'
                                            }}>
                                                <Stethoscope size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                                Specialization
                                            </div>
                                            <div style={{
                                                fontSize: '0.85rem',
                                                color: 'var(--text-primary)',
                                                fontWeight: 500
                                            }}>
                                                {formData.specialization || 'N/A'}
                                            </div>
                                        </div>

                                        <div style={{
                                            padding: '12px',
                                            background: 'var(--bg-primary)',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)'
                                        }}>
                                            <div style={{
                                                fontSize: '0.6rem',
                                                color: 'var(--text-muted)',
                                                textTransform: 'uppercase',
                                                marginBottom: '4px'
                                            }}>
                                                <Award size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                                Qualification
                                            </div>
                                            <div style={{
                                                fontSize: '0.85rem',
                                                color: 'var(--text-primary)',
                                                fontWeight: 500
                                            }}>
                                                {formData.qualification || 'N/A'}
                                            </div>
                                        </div>

                                        <div style={{
                                            padding: '12px',
                                            background: 'var(--bg-primary)',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)'
                                        }}>
                                            <div style={{
                                                fontSize: '0.6rem',
                                                color: 'var(--text-muted)',
                                                textTransform: 'uppercase',
                                                marginBottom: '4px'
                                            }}>
                                                <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                                Experience
                                            </div>
                                            <div style={{
                                                fontSize: '0.85rem',
                                                color: 'var(--text-primary)',
                                                fontWeight: 500
                                            }}>
                                                {formData.experience || 'N/A'}
                                            </div>
                                        </div>

                                        <div style={{
                                            padding: '12px',
                                            background: 'var(--bg-primary)',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)'
                                        }}>
                                            <div style={{
                                                fontSize: '0.6rem',
                                                color: 'var(--text-muted)',
                                                textTransform: 'uppercase',
                                                marginBottom: '4px'
                                            }}>
                                                <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                                Address
                                            </div>
                                            <div style={{
                                                fontSize: '0.85rem',
                                                color: 'var(--text-primary)',
                                                fontWeight: 500
                                            }}>
                                                {formData.address || 'N/A'}
                                            </div>
                                        </div>
                                    </div>

                                    {formData.bio && (
                                        <div style={{
                                            padding: '12px',
                                            background: 'var(--bg-primary)',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            marginTop: '16px'
                                        }}>
                                            <div style={{
                                                fontSize: '0.6rem',
                                                color: 'var(--text-muted)',
                                                textTransform: 'uppercase',
                                                marginBottom: '4px'
                                            }}>
                                                <FileText size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                                Bio / About
                                            </div>
                                            <div style={{
                                                fontSize: '0.85rem',
                                                color: 'var(--text-primary)',
                                                lineHeight: 1.5
                                            }}>
                                                {formData.bio}
                                            </div>
                                        </div>
                                    )}

                                    {formData.gender && (
                                        <div style={{
                                            padding: '12px',
                                            background: 'var(--bg-primary)',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            marginTop: '16px'
                                        }}>
                                            <div style={{
                                                fontSize: '0.6rem',
                                                color: 'var(--text-muted)',
                                                textTransform: 'uppercase',
                                                marginBottom: '4px'
                                            }}>
                                                Gender
                                            </div>
                                            <div style={{
                                                fontSize: '0.85rem',
                                                color: 'var(--text-primary)',
                                                fontWeight: 500
                                            }}>
                                                {formData.gender}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {/* ===== EDIT MODE ===== */}
                    {isEditing && (
                        <form onSubmit={handleSubmit} style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <InputField
                                label="Full Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Your full name"
                                icon={User}
                                error={formErrors.name}
                                disabled={loading}
                                required
                            />

                            <InputField
                                label="Email Address (Login Identifier)"
                                name="email"
                                value={formData.email}
                                icon={Mail}
                                disabled
                            />

                            <InputField
                                label="Phone Number"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="e.g. 03001234567"
                                icon={Phone}
                                error={formErrors.phone}
                                disabled={loading}
                            />

                            <div className="form-group">
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Shield size={16} /> Access Permission Role
                                </label>
                                <select
                                    name="role"
                                    className="hms-select"
                                    style={{ width: '100%', height: '45px' }}
                                    value={formData.role}
                                    onChange={handleChange}
                                    disabled={loading}
                                >
                                    <option value="Admin">Administrator</option>
                                    <option value="Doctor">Doctor</option>
                                    <option value="Receptionist">Receptionist</option>
                                    <option value="Pharmacist">Pharmacist</option>
                                    <option value="Billing Staff">Billing Staff</option>
                                </select>
                            </div>

                            {formData.role === 'Doctor' && (
                                <>
                                    <InputField
                                        label="Specialization"
                                        name="specialization"
                                        value={formData.specialization}
                                        onChange={handleChange}
                                        placeholder="e.g. Cardiology"
                                        icon={Stethoscope}
                                        disabled={loading}
                                    />

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <InputField
                                            label="Experience"
                                            name="experience"
                                            value={formData.experience}
                                            onChange={handleChange}
                                            placeholder="e.g. 5 years"
                                            icon={Clock}
                                            disabled={loading}
                                        />
                                        <InputField
                                            label="Qualification"
                                            name="qualification"
                                            value={formData.qualification}
                                            onChange={handleChange}
                                            placeholder="e.g. MBBS, FCPS"
                                            icon={Award}
                                            disabled={loading}
                                        />
                                    </div>

                                    <InputField
                                        label="Address"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Hospital or clinic address"
                                        icon={MapPin}
                                        disabled={loading}
                                    />

                                    <div className="form-group">
                                        <label className="form-label">Bio / About</label>
                                        <textarea
                                            name="bio"
                                            value={formData.bio}
                                            onChange={handleChange}
                                            rows="3"
                                            placeholder="Tell us about yourself..."
                                            style={{
                                                width: '100%',
                                                padding: '10px 14px',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '8px',
                                                fontSize: '0.85rem',
                                                background: 'var(--bg-primary)',
                                                color: 'var(--text-primary)',
                                                fontFamily: 'var(--font-family)',
                                                outline: 'none',
                                                resize: 'vertical',
                                                transition: 'border-color 0.2s ease'
                                            }}
                                            disabled={loading}
                                            onFocus={(e) => {
                                                e.currentTarget.style.borderColor = 'var(--primary-color)';
                                            }}
                                            onBlur={(e) => {
                                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                            }}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Gender</label>
                                        <select
                                            name="gender"
                                            className="hms-select"
                                            style={{ width: '100%', height: '45px' }}
                                            value={formData.gender}
                                            onChange={handleChange}
                                            disabled={loading}
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                marginTop: '8px',
                                borderTop: '1px solid var(--border-color)',
                                paddingTop: '20px'
                            }}>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    style={{
                                        padding: '10px 24px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        fontFamily: 'var(--font-family)',
                                        color: 'var(--text-secondary)',
                                        transition: 'all 0.2s ease',
                                        flex: 1
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'var(--hover-bg)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    <X size={16} style={{ display: 'inline', marginRight: '6px' }} />
                                    Cancel
                                </button>
                                <Button type="submit" loading={loading} style={{ flex: 1 }}>
                                    <Save size={16} style={{ display: 'inline', marginRight: '6px' }} />
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default MyProfile;