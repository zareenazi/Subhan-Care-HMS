import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { supabase } from '../services/supabaseClient';
import {
    Search, Plus, Trash2, X, RefreshCw, Bed, Users,
    CheckCircle, AlertCircle, Loader, Edit2, Eye,
    Calendar, User, Phone, MapPin, Activity, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Beds = () => {
    const navigate = useNavigate();
    const [beds, setBeds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [newRoomNumber, setNewRoomNumber] = useState('');
    const [editingBed, setEditingBed] = useState(null);
    const [viewingBed, setViewingBed] = useState(null);
    const [deletingBed, setDeletingBed] = useState(null);
    const [editRoomNumber, setEditRoomNumber] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [patientDetails, setPatientDetails] = useState(null);
    const [loadingPatient, setLoadingPatient] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [error, setError] = useState(null);

    // Handle resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const loadBeds = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('beds')
                .select('*')
                .order('room_number', { ascending: true });

            if (error) throw error;
            setBeds(data || []);
        } catch (err) {
            console.error('Error loading beds:', err);
            setError('Failed to load beds: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBeds();
    }, []);

    const fetchPatientDetails = async (patientId) => {
        if (!patientId) {
            setPatientDetails(null);
            return;
        }
        setLoadingPatient(true);
        try {
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .eq('id', patientId)
                .single();

            if (error) {
                console.error('Error fetching patient:', error);
                setPatientDetails(null);
            } else {
                setPatientDetails(data);
            }
        } catch (err) {
            console.error('Error fetching patient:', err);
            setPatientDetails(null);
        } finally {
            setLoadingPatient(false);
        }
    };

    const handleAddBed = async () => {
        if (!newRoomNumber.trim()) {
            alert('Please enter a room number');
            return;
        }

        // Check if room number already exists
        const existingBed = beds.find(bed => bed.room_number === newRoomNumber.trim());
        if (existingBed) {
            alert(`Room ${newRoomNumber.trim()} already exists!`);
            return;
        }

        setActionLoading(true);
        setError(null);

        try {
            console.log('Adding bed with room_number:', newRoomNumber.trim());

            const { data, error } = await supabase
                .from('beds')
                .insert([{
                    room_number: newRoomNumber.trim(),
                    status: 'available'
                }])
                .select();

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            console.log('Bed added successfully:', data);

            setNewRoomNumber('');
            setIsAddOpen(false);
            await loadBeds();
            window.dispatchEvent(new Event('bedChanged'));

            // Show success message
            alert(`Bed ${newRoomNumber.trim()} added successfully!`);

        } catch (err) {
            console.error('Error adding bed:', err);
            setError('Error adding bed: ' + err.message);
            alert('Error adding bed: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleStatusChange = async (bedId, newStatus) => {
        try {
            const updateData = { status: newStatus };

            // If status is 'occupied', set occupied_at to now
            if (newStatus === 'occupied' || newStatus === 'Occupied') {
                updateData.occupied_at = new Date().toISOString();
            } else {
                // If status is 'available', clear occupied_at
                updateData.occupied_at = null;
            }

            const { error } = await supabase
                .from('beds')
                .update(updateData)
                .eq('id', bedId);

            if (error) throw error;
            await loadBeds();
            window.dispatchEvent(new Event('bedChanged'));
        } catch (err) {
            console.error('Error updating bed:', err);
            alert('Error updating bed: ' + err.message);
        }
    };

    const handleDeleteBed = async () => {
        if (!deletingBed) return;
        setActionLoading(true);
        setError(null);

        try {
            const { error } = await supabase
                .from('beds')
                .delete()
                .eq('id', deletingBed.id);

            if (error) throw error;

            setIsDeleteOpen(false);
            setDeletingBed(null);
            await loadBeds();
            window.dispatchEvent(new Event('bedChanged'));

        } catch (err) {
            console.error('Error deleting bed:', err);
            setError('Error deleting bed: ' + err.message);
            alert('Error deleting bed: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleEditBed = async () => {
        if (!editRoomNumber.trim()) {
            alert('Please enter a room number');
            return;
        }

        // Check if room number already exists (excluding current bed)
        const existingBed = beds.find(bed =>
            bed.room_number === editRoomNumber.trim() &&
            bed.id !== editingBed.id
        );

        if (existingBed) {
            alert(`Room ${editRoomNumber.trim()} already exists!`);
            return;
        }

        setActionLoading(true);
        setError(null);

        try {
            const { error } = await supabase
                .from('beds')
                .update({ room_number: editRoomNumber.trim() })
                .eq('id', editingBed.id);

            if (error) throw error;

            setIsEditOpen(false);
            setEditingBed(null);
            await loadBeds();
            window.dispatchEvent(new Event('bedChanged'));

        } catch (err) {
            console.error('Error updating bed:', err);
            setError('Error updating bed: ' + err.message);
            alert('Error updating bed: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const openViewModal = async (bed) => {
        setViewingBed(bed);
        setPatientDetails(null);
        setIsViewOpen(true);

        if (bed.patient_id) {
            await fetchPatientDetails(bed.patient_id);
        }
    };

    const openEditModal = (bed) => {
        setEditingBed(bed);
        setEditRoomNumber(bed.room_number);
        setIsEditOpen(true);
    };

    const openDeleteModal = (bed) => {
        setDeletingBed(bed);
        setIsDeleteOpen(true);
    };

    const filteredBeds = beds.filter(bed =>
        bed.room_number?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalBeds = beds.length;
    const occupiedBeds = beds.filter(b => b.status === 'occupied' || b.status === 'Occupied').length;
    const availableBeds = beds.filter(b => b.status === 'available' || b.status === 'Available').length;
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    const getStatusColor = (status) => {
        if (status === 'available' || status === 'Available') return '#22C55E';
        if (status === 'occupied' || status === 'Occupied') return '#EF4444';
        return '#F59E0B';
    };

    const getStatusBg = (status) => {
        if (status === 'available' || status === 'Available') return '#22C55E15';
        if (status === 'occupied' || status === 'Occupied') return '#EF444415';
        return '#F59E0B15';
    };

    const getStatusLabel = (status) => {
        if (status === 'available' || status === 'Available') return 'Available';
        if (status === 'occupied' || status === 'Occupied') return 'Occupied';
        return status;
    };

    return (
        <DashboardLayout active="beds" title="Bed Management">
            {/* ===== GO BACK BUTTON ===== */}
            <div style={{ marginBottom: '16px' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        background: 'transparent',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Back to Dashboard
                </button>
            </div>

            {/* ===== ERROR DISPLAY ===== */}
            {error && (
                <div style={{
                    padding: '12px 16px',
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '10px',
                    color: '#DC2626',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <AlertCircle size={18} />
                    <span>{error}</span>
                    <button
                        onClick={() => setError(null)}
                        style={{
                            marginLeft: 'auto',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#DC2626'
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* ===== STATS SUMMARY ===== */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: isMobile ? '12px' : '16px',
                marginBottom: '24px'
            }}>
                <div className="stat-card" style={{
                    padding: '16px 20px',
                    background: 'var(--card-bg)',
                    borderRadius: '14px',
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
                    }}
                >
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: '#2563EB15',
                        color: '#2563EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <Bed size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Beds</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>{totalBeds}</div>
                    </div>
                </div>

                <div className="stat-card" style={{
                    padding: '16px 20px',
                    background: 'var(--card-bg)',
                    borderRadius: '14px',
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
                    }}
                >
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: '#22C55E15',
                        color: '#22C55E',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <CheckCircle size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Available</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#22C55E' }}>{availableBeds}</div>
                    </div>
                </div>

                <div className="stat-card" style={{
                    padding: '16px 20px',
                    background: 'var(--card-bg)',
                    borderRadius: '14px',
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
                    }}
                >
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: '#EF444415',
                        color: '#EF4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <Users size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Occupied</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#EF4444' }}>{occupiedBeds}</div>
                    </div>
                </div>

                <div className="stat-card" style={{
                    padding: '16px 20px',
                    background: 'var(--card-bg)',
                    borderRadius: '14px',
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
                    }}
                >
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: '#F59E0B15',
                        color: '#F59E0B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Occupancy Rate</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#F59E0B' }}>{occupancyRate}%</div>
                    </div>
                </div>
            </div>

            {/* ===== CONTROLS BAR ===== */}
            <div className="hms-controls-bar" style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '14px 18px',
                background: 'var(--card-bg)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: '20px'
            }}>
                <div className="hms-search-box" style={{ flex: 1, minWidth: '180px', position: 'relative' }}>
                    <Search size={18} className="hms-search-icon" style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)'
                    }} />
                    <input
                        type="text"
                        placeholder="Search by room number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 16px 8px 40px',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '10px',
                            fontSize: '0.85rem',
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
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                        onClick={loadBeds}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '10px',
                            background: 'var(--bg-primary)',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontFamily: 'var(--font-family)',
                            color: 'var(--text-secondary)',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--hover-bg)';
                            e.currentTarget.style.borderColor = 'var(--primary-color)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--bg-primary)';
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                    <button
                        onClick={() => setIsAddOpen(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 20px',
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
                            e.currentTarget.style.background = '#1D4ED8';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--primary-color)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <Plus size={16} /> Add Bed
                    </button>
                </div>
            </div>

            {/* ===== BEDS GRID ===== */}
            {loading ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                    color: 'var(--text-secondary)'
                }}>
                    <Loader size={36} className="spinner" />
                    <p>Loading beds...</p>
                </div>
            ) : filteredBeds.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: 'var(--text-muted)'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🛏️</div>
                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>No Beds Found</h3>
                    <p style={{ fontSize: '0.9rem' }}>
                        {searchQuery ? 'Try adjusting your search.' : 'Start by adding your first bed.'}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={() => setIsAddOpen(true)}
                            style={{
                                marginTop: '16px',
                                padding: '10px 24px',
                                background: 'var(--primary-color)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontFamily: 'var(--font-family)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#1D4ED8'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--primary-color)'}
                        >
                            <Plus size={16} /> Add First Bed
                        </button>
                    )}
                </div>
            ) : (
                <div className="hms-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: isMobile ? '12px' : '16px'
                }}>
                    {filteredBeds.map((bed) => {
                        const status = bed.status || 'available';
                        const statusColor = getStatusColor(status);
                        const statusBg = getStatusBg(status);
                        const isOccupied = status === 'occupied' || status === 'Occupied';
                        const statusLabel = getStatusLabel(status);

                        return (
                            <div
                                key={bed.id}
                                className="bed-card"
                                style={{
                                    padding: '16px 18px',
                                    background: 'var(--card-bg)',
                                    borderRadius: '14px',
                                    border: '1px solid var(--border-color)',
                                    transition: 'all 0.3s ease',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                    e.currentTarget.style.borderColor = statusColor;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                }}
                                onClick={() => openViewModal(bed)}
                            >
                                {/* Status Indicator Line */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '4px',
                                    background: statusColor,
                                    borderRadius: '14px 14px 0 0'
                                }} />

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    marginTop: '4px',
                                    gap: '12px'
                                }}>
                                    {/* LEFT SIDE - Bed Info */}
                                    <div style={{
                                        flex: 1,
                                        minWidth: 0,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px'
                                        }}>
                                            <div style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '10px',
                                                background: statusBg,
                                                color: statusColor,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                <Bed size={18} />
                                            </div>
                                            <div>
                                                <div style={{
                                                    fontSize: '1rem',
                                                    fontWeight: 600,
                                                    color: 'var(--text-primary)'
                                                }}>
                                                    Room {bed.room_number}
                                                </div>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    marginTop: '2px'
                                                }}>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        width: '8px',
                                                        height: '8px',
                                                        borderRadius: '50%',
                                                        background: statusColor,
                                                        flexShrink: 0
                                                    }} />
                                                    <span style={{
                                                        fontSize: '0.8rem',
                                                        color: statusColor,
                                                        fontWeight: 600,
                                                        textTransform: 'capitalize',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {statusLabel}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {isOccupied && bed.patient_id && (
                                            <div style={{
                                                fontSize: '0.7rem',
                                                color: 'var(--text-muted)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                background: 'var(--bg-primary)',
                                                padding: '3px 10px',
                                                borderRadius: '6px',
                                                width: 'fit-content'
                                            }}>
                                                <Users size={12} />
                                                Patient Assigned
                                            </div>
                                        )}
                                    </div>

                                    {/* RIGHT SIDE - Controls */}
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px',
                                        alignItems: 'flex-end',
                                        flexShrink: 0
                                    }}>
                                        <select
                                            value={status}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                handleStatusChange(bed.id, e.target.value);
                                            }}
                                            className="hms-select"
                                            onClick={(e) => e.stopPropagation()}
                                            style={{
                                                height: '32px',
                                                padding: '0 10px',
                                                fontSize: '0.7rem',
                                                fontFamily: 'var(--font-family)',
                                                borderRadius: '8px',
                                                border: '1.5px solid var(--border-color)',
                                                background: 'var(--bg-primary)',
                                                color: 'var(--text-primary)',
                                                outline: 'none',
                                                cursor: 'pointer',
                                                width: '120px'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                                            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                                        >
                                            <option value="available">🟢 Available</option>
                                            <option value="occupied">🔴 Occupied</option>
                                        </select>

                                        {/* Action Buttons */}
                                        <div style={{
                                            display: 'flex',
                                            gap: '4px',
                                            background: 'var(--bg-primary)',
                                            padding: '3px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)'
                                        }}>
                                            <button
                                                className="hms-action-btn view"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openViewModal(bed);
                                                }}
                                                title="View details"
                                                style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    background: 'transparent',
                                                    cursor: 'pointer',
                                                    color: 'var(--primary-color)',
                                                    transition: 'all 0.2s ease',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '4px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 500
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'var(--primary-color)';
                                                    e.currentTarget.style.color = 'white';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'transparent';
                                                    e.currentTarget.style.color = 'var(--primary-color)';
                                                }}
                                            >
                                                <Eye size={13} />
                                                <span>View</span>
                                            </button>
                                            <button
                                                className="hms-action-btn edit"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openEditModal(bed);
                                                }}
                                                title="Edit room number"
                                                style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    background: 'transparent',
                                                    cursor: 'pointer',
                                                    color: 'var(--secondary-color)',
                                                    transition: 'all 0.2s ease',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '4px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 500
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'var(--secondary-color)';
                                                    e.currentTarget.style.color = 'white';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'transparent';
                                                    e.currentTarget.style.color = 'var(--secondary-color)';
                                                }}
                                            >
                                                <Edit2 size={13} />
                                                <span>Edit</span>
                                            </button>
                                            <button
                                                className="hms-action-btn delete"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openDeleteModal(bed);
                                                }}
                                                title="Delete bed"
                                                style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    background: 'transparent',
                                                    cursor: 'pointer',
                                                    color: 'var(--danger-color)',
                                                    transition: 'all 0.2s ease',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '4px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 500
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'var(--danger-color)';
                                                    e.currentTarget.style.color = 'white';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'transparent';
                                                    e.currentTarget.style.color = 'var(--danger-color)';
                                                }}
                                            >
                                                <Trash2 size={13} />
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ===== ADD BED MODAL ===== */}
            {isAddOpen && (
                <div className="hms-modal-backdrop" onClick={() => setIsAddOpen(false)} style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{
                        maxWidth: '440px',
                        width: '100%',
                        background: 'var(--card-bg)',
                        borderRadius: '16px',
                        boxShadow: 'var(--shadow-xl)',
                        border: '1px solid var(--border-color)',
                        overflow: 'hidden',
                        animation: 'slideUp 0.3s ease'
                    }}>
                        <div className="hms-modal-header" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '16px 20px',
                            borderBottom: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)'
                        }}>
                            <h3 className="hms-modal-title" style={{
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'var(--text-primary)'
                            }}>
                                <Bed size={20} style={{ color: 'var(--primary-color)' }} />
                                Add New Bed
                            </h3>
                            <button
                                className="hms-modal-close"
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
                                    e.currentTarget.style.background = 'var(--hover-bg)';
                                    e.currentTarget.style.color = 'var(--danger-color)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="hms-modal-body" style={{
                            padding: '20px',
                            background: 'var(--bg-primary)'
                        }}>
                            <div className="form-group" style={{ marginBottom: '0' }}>
                                <label className="form-label" style={{
                                    display: 'block',
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '6px'
                                }}>
                                    Room Number <span style={{ color: 'var(--danger-color)' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newRoomNumber}
                                    onChange={(e) => setNewRoomNumber(e.target.value)}
                                    placeholder="e.g. 101, 201, ICU-01"
                                    className="form-input"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.95rem',
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
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleAddBed();
                                        }
                                    }}
                                />
                                <div style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--text-muted)',
                                    marginTop: '4px'
                                }}>
                                    💡 Beds are created with "Available" status by default
                                </div>
                            </div>
                        </div>

                        <div className="hms-modal-footer" style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '10px',
                            padding: '14px 20px',
                            borderTop: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)'
                        }}>
                            <button
                                onClick={() => setIsAddOpen(false)}
                                style={{
                                    padding: '10px 24px',
                                    border: '1.5px solid var(--border-color)',
                                    borderRadius: '10px',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'var(--text-secondary)',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'var(--hover-bg)';
                                    e.currentTarget.style.color = 'var(--text-primary)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddBed}
                                disabled={actionLoading}
                                style={{
                                    padding: '10px 28px',
                                    border: 'none',
                                    borderRadius: '10px',
                                    background: actionLoading ? 'var(--primary-color)70' : 'var(--primary-color)',
                                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.85rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'white',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    opacity: actionLoading ? 0.7 : 1,
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    if (!actionLoading) {
                                        e.currentTarget.style.background = '#1D4ED8';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.3)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!actionLoading) {
                                        e.currentTarget.style.background = 'var(--primary-color)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }
                                }}
                            >
                                <Plus size={18} />
                                {actionLoading ? 'Adding...' : 'Add Bed'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== EDIT BED MODAL ===== */}
            {isEditOpen && editingBed && (
                <div className="hms-modal-backdrop" onClick={() => setIsEditOpen(false)} style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{
                        maxWidth: '440px',
                        width: '100%',
                        background: 'var(--card-bg)',
                        borderRadius: '16px',
                        boxShadow: 'var(--shadow-xl)',
                        border: '1px solid var(--border-color)',
                        overflow: 'hidden',
                        animation: 'slideUp 0.3s ease'
                    }}>
                        <div className="hms-modal-header" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '16px 20px',
                            borderBottom: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)'
                        }}>
                            <h3 className="hms-modal-title" style={{
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'var(--text-primary)'
                            }}>
                                <Edit2 size={20} style={{ color: 'var(--secondary-color)' }} />
                                Edit Bed
                            </h3>
                            <button
                                className="hms-modal-close"
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
                                    e.currentTarget.style.background = 'var(--hover-bg)';
                                    e.currentTarget.style.color = 'var(--danger-color)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="hms-modal-body" style={{
                            padding: '20px',
                            background: 'var(--bg-primary)'
                        }}>
                            <div className="form-group" style={{ marginBottom: '0' }}>
                                <label className="form-label" style={{
                                    display: 'block',
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '6px'
                                }}>
                                    Room Number <span style={{ color: 'var(--danger-color)' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editRoomNumber}
                                    onChange={(e) => setEditRoomNumber(e.target.value)}
                                    placeholder="e.g. 101, 201, ICU-01"
                                    className="form-input"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.95rem',
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
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleEditBed();
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="hms-modal-footer" style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '10px',
                            padding: '14px 20px',
                            borderTop: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)'
                        }}>
                            <button
                                onClick={() => setIsEditOpen(false)}
                                style={{
                                    padding: '10px 24px',
                                    border: '1.5px solid var(--border-color)',
                                    borderRadius: '10px',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'var(--text-secondary)',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'var(--hover-bg)';
                                    e.currentTarget.style.color = 'var(--text-primary)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditBed}
                                disabled={actionLoading}
                                style={{
                                    padding: '10px 28px',
                                    border: 'none',
                                    borderRadius: '10px',
                                    background: actionLoading ? 'var(--primary-color)70' : 'var(--primary-color)',
                                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.85rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'white',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    opacity: actionLoading ? 0.7 : 1,
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    if (!actionLoading) {
                                        e.currentTarget.style.background = '#1D4ED8';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.3)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!actionLoading) {
                                        e.currentTarget.style.background = 'var(--primary-color)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }
                                }}
                            >
                                <Edit2 size={18} />
                                {actionLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== VIEW BED MODAL ===== */}
            {isViewOpen && viewingBed && (
                <div className="hms-modal-backdrop" onClick={() => setIsViewOpen(false)} style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{
                        maxWidth: '520px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'var(--card-bg)',
                        borderRadius: '16px',
                        boxShadow: 'var(--shadow-xl)',
                        border: '1px solid var(--border-color)',
                        animation: 'slideUp 0.3s ease'
                    }}>
                        <div className="hms-modal-header" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '16px 20px',
                            borderBottom: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            flexShrink: 0
                        }}>
                            <h3 className="hms-modal-title" style={{
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'var(--text-primary)'
                            }}>
                                <Eye size={20} style={{ color: 'var(--primary-color)' }} />
                                Bed Details
                            </h3>
                            <button
                                className="hms-modal-close"
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
                                    e.currentTarget.style.background = 'var(--hover-bg)';
                                    e.currentTarget.style.color = 'var(--danger-color)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="hms-modal-body" style={{
                            padding: '20px',
                            overflowY: 'auto',
                            flex: 1,
                            background: 'var(--bg-primary)'
                        }}>
                            {/* Bed Info */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                padding: '16px',
                                background: 'var(--card-bg)',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)',
                                marginBottom: '16px'
                            }}>
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '12px',
                                    background: getStatusBg(viewingBed.status),
                                    color: getStatusColor(viewingBed.status),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Bed size={28} />
                                </div>
                                <div>
                                    <div style={{
                                        fontSize: '1.2rem',
                                        fontWeight: 700,
                                        color: 'var(--text-primary)'
                                    }}>
                                        Room {viewingBed.room_number}
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginTop: '2px'
                                    }}>
                                        <span style={{
                                            display: 'inline-block',
                                            width: '10px',
                                            height: '10px',
                                            borderRadius: '50%',
                                            background: getStatusColor(viewingBed.status)
                                        }} />
                                        <span style={{
                                            fontSize: '0.85rem',
                                            color: getStatusColor(viewingBed.status),
                                            fontWeight: 500
                                        }}>
                                            {getStatusLabel(viewingBed.status)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Patient Details if occupied */}
                            {viewingBed.patient_id ? (
                                <>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginBottom: '12px',
                                        paddingBottom: '8px',
                                        borderBottom: '1px solid var(--border-color)'
                                    }}>
                                        <Users size={16} style={{ color: 'var(--primary-color)' }} />
                                        <span style={{
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            color: 'var(--text-primary)'
                                        }}>Assigned Patient</span>
                                    </div>

                                    {loadingPatient ? (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '16px',
                                            color: 'var(--text-muted)'
                                        }}>
                                            <Loader size={18} className="spinner" />
                                            Loading patient details...
                                        </div>
                                    ) : patientDetails ? (
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                                            gap: '10px',
                                            padding: '12px',
                                            background: 'var(--card-bg)',
                                            borderRadius: '10px',
                                            border: '1px solid var(--border-color)'
                                        }}>
                                            <div>
                                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                                    <User size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                                    Name
                                                </div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                                    {patientDetails.name || 'N/A'}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                                    <Phone size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                                    Phone
                                                </div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                                    {patientDetails.phone || 'N/A'}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                                    <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                                    D.O.B
                                                </div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                                    {patientDetails.date_of_birth || 'N/A'}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                                    <Activity size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                                    Blood Group
                                                </div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                                    {patientDetails.blood_group || 'N/A'}
                                                </div>
                                            </div>
                                            {patientDetails.address && (
                                                <div style={{ gridColumn: '1 / -1' }}>
                                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                                        <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                                        Address
                                                    </div>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                                        {patientDetails.address}
                                                    </div>
                                                </div>
                                            )}
                                            {patientDetails.medical_history && (
                                                <div style={{ gridColumn: '1 / -1' }}>
                                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                                        <FileText size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                                        Medical History
                                                    </div>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                                        {patientDetails.medical_history}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{
                                            padding: '12px',
                                            background: '#FEF2F2',
                                            borderRadius: '8px',
                                            color: '#DC2626',
                                            fontSize: '0.85rem',
                                            textAlign: 'center'
                                        }}>
                                            ⚠️ Patient details not found
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div style={{
                                    padding: '16px',
                                    textAlign: 'center',
                                    color: 'var(--text-muted)',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '10px',
                                    border: '1px dashed var(--border-color)'
                                }}>
                                    <Bed size={24} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                                    <p>This bed is currently available</p>
                                </div>
                            )}

                            {/* Meta Info */}
                            <div style={{
                                marginTop: '16px',
                                paddingTop: '12px',
                                borderTop: '1px solid var(--border-color)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.7rem',
                                color: 'var(--text-muted)'
                            }}>
                                <span>ID: {viewingBed.id?.slice(0, 8)}</span>
                                {viewingBed.created_at && (
                                    <span>Created: {new Date(viewingBed.created_at).toLocaleDateString()}</span>
                                )}
                            </div>
                        </div>

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
                                onClick={() => {
                                    setIsViewOpen(false);
                                    openEditModal(viewingBed);
                                }}
                                style={{
                                    padding: '8px 20px',
                                    border: '1.5px solid var(--border-color)',
                                    borderRadius: '10px',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'var(--secondary-color)',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(34, 197, 94, 0.04)';
                                    e.currentTarget.style.borderColor = 'var(--secondary-color)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                }}
                            >
                                <Edit2 size={16} /> Edit
                            </button>
                            <button
                                onClick={() => {
                                    setIsViewOpen(false);
                                    openDeleteModal(viewingBed);
                                }}
                                style={{
                                    padding: '8px 20px',
                                    border: 'none',
                                    borderRadius: '10px',
                                    background: 'var(--danger-color)',
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
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'var(--danger-hover)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'var(--danger-color)';
                                }}
                            >
                                <Trash2 size={16} /> Delete
                            </button>
                            <button
                                onClick={() => setIsViewOpen(false)}
                                style={{
                                    padding: '8px 24px',
                                    border: 'none',
                                    borderRadius: '10px',
                                    background: 'var(--primary-color)',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'white',
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
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== DELETE CONFIRMATION MODAL ===== */}
            {isDeleteOpen && deletingBed && (
                <div className="hms-modal-backdrop" onClick={() => setIsDeleteOpen(false)} style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div className="hms-modal small" onClick={(e) => e.stopPropagation()} style={{
                        maxWidth: '420px',
                        width: '100%',
                        background: 'var(--card-bg)',
                        borderRadius: '16px',
                        boxShadow: 'var(--shadow-xl)',
                        border: '1px solid var(--border-color)',
                        overflow: 'hidden',
                        animation: 'slideUp 0.3s ease'
                    }}>
                        <div className="hms-modal-header" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '16px 20px',
                            borderBottom: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)'
                        }}>
                            <h3 className="hms-modal-title" style={{
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                margin: 0,
                                color: 'var(--danger-color)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <Trash2 size={20} /> Delete Bed
                            </h3>
                            <button
                                className="hms-modal-close"
                                onClick={() => setIsDeleteOpen(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)',
                                    padding: '4px',
                                    borderRadius: '6px'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="hms-modal-body" style={{
                            padding: '24px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚠️</div>
                            <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
                                Are you absolutely sure?
                            </p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                This will permanently delete <strong>Room {deletingBed.room_number}</strong>.
                            </p>
                            {deletingBed.status === 'occupied' && (
                                <p style={{ color: 'var(--warning-color)', fontSize: '0.85rem', marginTop: '8px' }}>
                                    ⚠️ This bed is currently occupied. Deleting it will free up the patient.
                                </p>
                            )}
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '8px' }}>
                                This action cannot be undone.
                            </p>
                        </div>

                        <div className="hms-modal-footer" style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '10px',
                            padding: '14px 20px',
                            borderTop: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)'
                        }}>
                            <button
                                onClick={() => setIsDeleteOpen(false)}
                                style={{
                                    padding: '8px 24px',
                                    border: '1.5px solid var(--border-color)',
                                    borderRadius: '10px',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'var(--text-secondary)',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'var(--hover-bg)';
                                    e.currentTarget.style.color = 'var(--text-primary)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteBed}
                                disabled={actionLoading}
                                style={{
                                    padding: '8px 24px',
                                    border: 'none',
                                    borderRadius: '10px',
                                    background: actionLoading ? 'var(--danger-color)70' : 'var(--danger-color)',
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
                                        e.currentTarget.style.background = 'var(--danger-hover)';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(239, 68, 68, 0.3)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!actionLoading) {
                                        e.currentTarget.style.background = 'var(--danger-color)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }
                                }}
                            >
                                <Trash2 size={16} />
                                {actionLoading ? 'Deleting...' : 'Delete Bed'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .spinner {
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </DashboardLayout>
    );
};

export default Beds;