import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, User, Mail, Phone, Calendar, MapPin, Activity, Save, Bed } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

const AddPatient = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [availableBeds, setAvailableBeds] = useState([]);
    const [loadingBeds, setLoadingBeds] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        gender: '',
        address: '',
        blood_group: '',
        medical_history: '',
        emergency_contact: '',
        emergency_phone: '',
        bed_id: '',
        requires_bed: false,
    });

    // ===== FETCH AVAILABLE BEDS =====
    useEffect(() => {
        const fetchAvailableBeds = async () => {
            setLoadingBeds(true);
            try {
                const { data, error } = await supabase
                    .from('beds')
                    .select('id, room_number, status')
                    .eq('status', 'available')
                    .order('room_number', { ascending: true });

                if (error) throw error;
                setAvailableBeds(data || []);
            } catch (err) {
                console.error('Error fetching beds:', err);
            } finally {
                setLoadingBeds(false);
            }
        };

        fetchAvailableBeds();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!formData.name || !formData.phone) {
                throw new Error('Name and Phone are required fields');
            }

            // If bed is selected, check if still available
            if (formData.bed_id) {
                const { data: bedCheck, error: bedError } = await supabase
                    .from('beds')
                    .select('status')
                    .eq('id', formData.bed_id)
                    .single();

                if (bedError) throw bedError;
                if (bedCheck.status !== 'available') {
                    throw new Error('Selected bed is no longer available. Please choose another.');
                }
            }

            // Insert patient
            const { data: patientData, error: supabaseError } = await supabase
                .from('patients')
                .insert([{
                    name: formData.name,
                    email: formData.email || null,
                    phone: formData.phone,
                    date_of_birth: formData.date_of_birth || null,
                    gender: formData.gender || null,
                    address: formData.address || null,
                    blood_group: formData.blood_group || null,
                    medical_history: formData.medical_history || null,
                    emergency_contact: formData.emergency_contact || null,
                    emergency_phone: formData.emergency_phone || null,
                    bed_id: formData.bed_id || null,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (supabaseError) throw supabaseError;

            // If bed assigned, update bed status to occupied
            if (formData.bed_id) {
                const { error: updateBedError } = await supabase
                    .from('beds')
                    .update({
                        status: 'occupied',
                        patient_id: patientData[0].id
                    })
                    .eq('id', formData.bed_id);

                if (updateBedError) throw updateBedError;
            }

            // ============================================================
            // ===== DASHBOARD UPDATE EVENT =====
            // This will update the dashboard when patient is added
            // ============================================================
            window.dispatchEvent(new Event('patientAdded'));
            window.dispatchEvent(new Event('bedChanged'));

            setSuccess(true);
            setTimeout(() => {
                navigate('/patients');
            }, 2000);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-primary)',
            padding: '24px'
        }}>
            <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                background: 'var(--card-bg)',
                borderRadius: 'var(--border-radius)',
                padding: '32px',
                boxShadow: 'var(--shadow-sm)'
            }}>
                {/* HEADER */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '24px',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '16px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            onClick={() => navigate(-1)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-secondary)',
                                padding: '8px',
                                borderRadius: '8px',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'var(--hover-bg)'}
                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                Register New Patient
                            </h1>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                                Fill in the patient's personal and medical information
                            </p>
                        </div>
                    </div>
                </div>

                {success && (
                    <div style={{
                        background: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        marginBottom: '16px',
                        color: '#065F46',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        ✅ Patient registered successfully! Redirecting...
                    </div>
                )}

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        marginBottom: '16px',
                        color: 'var(--danger-color)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        ❌ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px'
                    }}>
                        {/* Personal Information */}
                        <div style={{ gridColumn: 'span 2' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
                                <User size={16} style={{ display: 'inline', marginRight: '8px' }} />
                                Personal Information
                            </h3>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Full Name *</label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter full name"
                                className="form-input"
                                required
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    fontFamily: 'var(--font-family)',
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                    background: '#fff',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="patient@email.com"
                                className="form-input"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    fontFamily: 'var(--font-family)',
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                    background: '#fff',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Phone *</label>
                            <input
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+92 300 1234567"
                                className="form-input"
                                required
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    fontFamily: 'var(--font-family)',
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                    background: '#fff',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Date of Birth</label>
                            <input
                                name="date_of_birth"
                                type="date"
                                value={formData.date_of_birth}
                                onChange={handleChange}
                                className="form-input"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    fontFamily: 'var(--font-family)',
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                    background: '#fff',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Gender</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="form-input"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    fontFamily: 'var(--font-family)',
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                    background: '#fff',
                                    color: 'var(--text-primary)',
                                    appearance: 'none'
                                }}
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="form-label">Address</label>
                            <input
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Enter complete address"
                                className="form-input"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    fontFamily: 'var(--font-family)',
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                    background: '#fff',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>

                        {/* Medical Information */}
                        <div style={{ gridColumn: 'span 2', marginTop: '8px' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
                                <Activity size={16} style={{ display: 'inline', marginRight: '8px' }} />
                                Medical Information
                            </h3>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Blood Group</label>
                            <select
                                name="blood_group"
                                value={formData.blood_group}
                                onChange={handleChange}
                                className="form-input"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    fontFamily: 'var(--font-family)',
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                    background: '#fff',
                                    color: 'var(--text-primary)',
                                    appearance: 'none'
                                }}
                            >
                                <option value="">Select Blood Group</option>
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

                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="form-label">Medical History</label>
                            <textarea
                                name="medical_history"
                                value={formData.medical_history}
                                onChange={handleChange}
                                placeholder="Previous conditions, surgeries, chronic diseases..."
                                rows="3"
                                className="form-input"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    fontFamily: 'var(--font-family)',
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                    background: '#fff',
                                    color: 'var(--text-primary)',
                                    resize: 'vertical',
                                    minHeight: '80px'
                                }}
                            />
                        </div>

                        {/* Emergency Contact */}
                        <div style={{ gridColumn: 'span 2', marginTop: '8px' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
                                <Phone size={16} style={{ display: 'inline', marginRight: '8px' }} />
                                Emergency Contact
                            </h3>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Contact Name</label>
                            <input
                                name="emergency_contact"
                                value={formData.emergency_contact}
                                onChange={handleChange}
                                placeholder="Emergency contact person"
                                className="form-input"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    fontFamily: 'var(--font-family)',
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                    background: '#fff',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Emergency Phone</label>
                            <input
                                name="emergency_phone"
                                value={formData.emergency_phone}
                                onChange={handleChange}
                                placeholder="Emergency contact number"
                                className="form-input"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    fontFamily: 'var(--font-family)',
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                    background: '#fff',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>

                        {/* ===== BED ASSIGNMENT SECTION ===== */}
                        <div style={{ gridColumn: 'span 2', marginTop: '8px' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
                                <Bed size={16} style={{ display: 'inline', marginRight: '8px' }} />
                                Bed Assignment
                            </h3>
                        </div>

                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <input
                                    type="checkbox"
                                    name="requires_bed"
                                    checked={formData.requires_bed}
                                    onChange={handleChange}
                                    style={{
                                        width: '18px',
                                        height: '18px',
                                        cursor: 'pointer',
                                        accentColor: 'var(--primary-color)'
                                    }}
                                />
                                <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)', cursor: 'pointer' }}>
                                    Patient requires bed admission
                                </label>
                            </div>

                            {formData.requires_bed && (
                                <div>
                                    <label className="form-label">Select Available Bed</label>
                                    {loadingBeds ? (
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading available beds...</div>
                                    ) : availableBeds.length === 0 ? (
                                        <div style={{
                                            color: 'var(--danger-color)',
                                            fontSize: '0.9rem',
                                            padding: '12px',
                                            background: 'rgba(239, 68, 68, 0.05)',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(239, 68, 68, 0.2)'
                                        }}>
                                            ⚠️ No beds available at the moment. Please check back later.
                                        </div>
                                    ) : (
                                        <select
                                            name="bed_id"
                                            value={formData.bed_id}
                                            onChange={handleChange}
                                            className="form-input"
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '8px',
                                                fontSize: '0.9rem',
                                                fontFamily: 'var(--font-family)',
                                                outline: 'none',
                                                transition: 'all 0.2s ease',
                                                background: '#fff',
                                                color: 'var(--text-primary)',
                                                appearance: 'none'
                                            }}
                                        >
                                            <option value="">Select a bed</option>
                                            {availableBeds.map(bed => (
                                                <option key={bed.id} value={bed.id}>
                                                    Room {bed.room_number} (Available)
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    {formData.bed_id && (
                                        <div style={{
                                            marginTop: '8px',
                                            fontSize: '0.8rem',
                                            color: 'var(--secondary-color)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            ✅ Bed will be marked as occupied after registration
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        marginTop: '24px',
                        paddingTop: '16px',
                        borderTop: '1px solid var(--border-color)'
                    }}>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            style={{
                                padding: '10px 24px',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontFamily: 'var(--font-family)',
                                color: 'var(--text-secondary)',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'var(--hover-bg)'}
                            onMouseLeave={(e) => e.target.style.background = 'var(--bg-secondary)'}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '10px 24px',
                                background: 'var(--primary-color)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                fontFamily: 'var(--font-family)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s ease',
                                opacity: loading ? 0.7 : 1
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) e.target.style.background = 'var(--primary-hover)';
                            }}
                            onMouseLeave={(e) => {
                                if (!loading) e.target.style.background = 'var(--primary-color)';
                            }}
                        >
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Register Patient'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPatient;