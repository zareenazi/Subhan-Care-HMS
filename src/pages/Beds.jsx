import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { supabase } from '../services/supabaseClient';
import Button from '../components/Button';
import { Search, Plus, Trash2, X, RefreshCw } from 'lucide-react';

const Beds = () => {
    const [beds, setBeds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newRoomNumber, setNewRoomNumber] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const loadBeds = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('beds')
                .select('*')
                .order('room_number', { ascending: true });

            if (error) throw error;
            setBeds(data || []);
        } catch (err) {
            alert('Error loading beds: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBeds();
    }, []);

    const handleAddBed = async () => {
        if (!newRoomNumber.trim()) return;
        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('beds')
                .insert([{ room_number: newRoomNumber.trim(), status: 'available' }]);

            if (error) throw error;
            setNewRoomNumber('');
            setIsAddOpen(false);
            loadBeds();
            // Update dashboard
            window.dispatchEvent(new Event('bedChanged'));
        } catch (err) {
            alert('Error adding bed: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleStatusChange = async (bedId, newStatus) => {
        try {
            const { error } = await supabase
                .from('beds')
                .update({ status: newStatus })
                .eq('id', bedId);

            if (error) throw error;
            loadBeds();
            window.dispatchEvent(new Event('bedChanged'));
        } catch (err) {
            alert('Error updating bed: ' + err.message);
        }
    };

    const handleDeleteBed = async (bedId) => {
        if (!window.confirm('Are you sure you want to delete this bed?')) return;
        try {
            const { error } = await supabase
                .from('beds')
                .delete()
                .eq('id', bedId);

            if (error) throw error;
            loadBeds();
            window.dispatchEvent(new Event('bedChanged'));
        } catch (err) {
            alert('Error deleting bed: ' + err.message);
        }
    };

    const totalBeds = beds.length;
    const occupiedBeds = beds.filter(b => b.status === 'occupied').length;
    const availableBeds = beds.filter(b => b.status === 'available').length;

    return (
        <DashboardLayout active="beds" title="Bed Management">
            {/* Stats Summary */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '16px',
                marginBottom: '20px'
            }}>
                <div className="stat-card" style={{ borderLeft: '4px solid #2563EB' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Beds</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{totalBeds}</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid #22C55E' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Available</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#22C55E' }}>{availableBeds}</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid #EF4444' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Occupied</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#EF4444' }}>{occupiedBeds}</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid #F59E0B' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Occupancy Rate</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#F59E0B' }}>
                        {totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0}%
                    </div>
                </div>
            </div>

            {/* Control Bar */}
            <div className="hms-controls-bar">
                <div className="hms-search-box">
                    <Search size={18} className="hms-search-icon" />
                    <input
                        type="text"
                        placeholder="Search by room number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={loadBeds}
                        style={{
                            padding: '8px 16px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            background: 'var(--bg-primary)',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-family)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                    <Button onClick={() => setIsAddOpen(true)} variant="primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={16} /> Add Bed
                    </Button>
                </div>
            </div>

            {/* Beds Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading beds...</div>
            ) : beds.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No beds found.</div>
            ) : (
                <div className="hms-grid hms-grid-4">
                    {beds
                        .filter(bed => bed.room_number.includes(searchQuery))
                        .map((bed) => (
                            <div key={bed.id} className="auth-card" style={{ padding: '16px', animation: 'none' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                            Room {bed.room_number}
                                        </div>
                                        <span className={`hms-badge ${bed.status === 'available' ? 'success' : 'danger'}`}>
                                            {bed.status}
                                        </span>
                                        {bed.patient_id && (
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                Patient ID: {bed.patient_id}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <select
                                            value={bed.status}
                                            onChange={(e) => handleStatusChange(bed.id, e.target.value)}
                                            className="hms-select"
                                            style={{ height: '32px', padding: '0 8px', fontSize: '0.75rem', minWidth: '100px' }}
                                        >
                                            <option value="available">Available</option>
                                            <option value="occupied">Occupied</option>
                                        </select>
                                        <button
                                            className="hms-action-btn delete"
                                            onClick={() => handleDeleteBed(bed.id)}
                                            title="Delete bed"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            )}

            {/* Add Bed Modal */}
            {isAddOpen && (
                <div className="hms-modal-backdrop">
                    <div className="hms-modal small">
                        <div className="hms-modal-header">
                            <h3 className="hms-modal-title">Add New Bed</h3>
                            <button className="hms-modal-close" onClick={() => setIsAddOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="hms-modal-body">
                            <div className="form-group">
                                <label className="form-label">Room Number</label>
                                <input
                                    type="text"
                                    value={newRoomNumber}
                                    onChange={(e) => setNewRoomNumber(e.target.value)}
                                    placeholder="e.g. 101, 201, ICU-01"
                                    className="form-input"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        fontSize: '0.9rem',
                                        fontFamily: 'var(--font-family)',
                                        background: '#fff',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                            </div>
                        </div>
                        <div className="hms-modal-footer">
                            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddBed} loading={actionLoading}>Add Bed</Button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default Beds;