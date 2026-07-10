import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { dbDoctors } from '../services/db';
import Button from '../components/Button';
import InputField from '../components/InputField';
import {
    Plus, Search, Edit2, Trash2, X, Calendar,
    User, Phone, Mail, Clock, Check, AlertCircle,
    ArrowLeft, Stethoscope, ChevronRight, Filter,
    Eye, Printer, Users, Activity, FileText, Save
} from 'lucide-react';

const Doctors = () => {
    // ===== STATE =====
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [specializationFilter, setSpecializationFilter] = useState('');
    const [availabilityFilter, setAvailabilityFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // ===== MODALS =====
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);

    const [selectedDoctor, setSelectedDoctor] = useState(null);

    // ===== FORM STATE =====
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        specialization: '',
        availability: 'Available',
        weekly_schedule: {
            Monday: ['09:00 AM - 05:00 PM'],
            Tuesday: ['09:00 AM - 05:00 PM'],
            Wednesday: ['09:00 AM - 05:00 PM'],
            Thursday: ['09:00 AM - 05:00 PM'],
            Friday: ['09:00 AM - 05:00 PM'],
            Saturday: [],
            Sunday: []
        }
    });

    // ===== SCHEDULE STATE FOR ADD/EDIT MODAL =====
    const [modalSchedule, setModalSchedule] = useState({
        Monday: ['09:00 AM - 05:00 PM'],
        Tuesday: ['09:00 AM - 05:00 PM'],
        Wednesday: ['09:00 AM - 05:00 PM'],
        Thursday: ['09:00 AM - 05:00 PM'],
        Friday: ['09:00 AM - 05:00 PM'],
        Saturday: [],
        Sunday: []
    });

    const [newSlotTime, setNewSlotTime] = useState({ day: 'Monday', start: '09:00 AM', end: '05:00 PM' });
    const [scheduleState, setScheduleState] = useState({});

    // ===== VIEW MODAL SCHEDULE STATE =====
    const [viewSchedule, setViewSchedule] = useState({});
    const [viewNewSlot, setViewNewSlot] = useState({ day: 'Monday', start: '09:00 AM', end: '05:00 PM' });
    const [viewIsEditing, setViewIsEditing] = useState(false);

    // ===== PROFILE CARD SCHEDULE STATE =====
    const [cardSchedule, setCardSchedule] = useState({});
    const [cardNewSlot, setCardNewSlot] = useState({ day: 'Monday', start: '09:00 AM', end: '05:00 PM' });
    const [editingCardId, setEditingCardId] = useState(null);

    const [formErrors, setFormErrors] = useState({});
    const [actionLoading, setActionLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

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

    // ===== WEEK DAYS =====
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // ===== LOAD DOCTORS =====
    const loadDoctors = async () => {
        setLoading(true);
        try {
            const data = await dbDoctors.getDoctors({ search: searchQuery });
            setDoctors(data);
        } catch (err) {
            console.error('Failed to load doctors:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDoctors();
    }, [searchQuery]);

    // ===== FILTERED DOCTORS =====
    const filteredDoctors = doctors.filter(doc => {
        const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.specialization.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSpecialization = specializationFilter === '' || doc.specialization === specializationFilter;
        const matchesAvailability = availabilityFilter === '' || doc.availability === availabilityFilter;
        return matchesSearch && matchesSpecialization && matchesAvailability;
    });

    // ===== SPECIALIZATIONS LIST =====
    const specializations = [...new Set(doctors.map(d => d.specialization))].filter(Boolean);

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
        if (!formData.name.trim()) errors.name = 'Doctor name is required';
        if (!formData.specialization.trim()) errors.specialization = 'Specialization is required';
        if (!formData.phone.trim()) {
            errors.phone = 'Phone number is required';
        } else if (!/^\+?[0-9\s-]{7,15}$/.test(formData.phone)) {
            errors.phone = 'Enter a valid phone number (7-15 digits)';
        }
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Enter a valid email address';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // ===== TIME VALIDATION HELPER =====
    const getTimeNumber = (timeStr) => {
        const isPM = timeStr.includes('PM');
        let hours = parseInt(timeStr.replace(/[^0-9]/g, ''));
        if (isPM && hours !== 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
        return hours;
    };

    // ===== SCHEDULE FUNCTIONS FOR MODAL (ADD/EDIT) =====
    const addModalScheduleSlot = () => {
        const { day, start, end } = newSlotTime;
        const timeSlot = `${start} - ${end}`;
        const currentSlots = modalSchedule[day] || [];

        if (currentSlots.includes(timeSlot)) {
            alert('This time slot is already added for ' + day);
            return;
        }

        const startNum = getTimeNumber(start);
        const endNum = getTimeNumber(end);

        if (startNum >= endNum) {
            alert('Start time must be before end time.');
            return;
        }

        setModalSchedule(prev => ({
            ...prev,
            [day]: [...currentSlots, timeSlot]
        }));
    };

    const removeModalScheduleSlot = (day, slotToRemove) => {
        setModalSchedule(prev => ({
            ...prev,
            [day]: (prev[day] || []).filter(slot => slot !== slotToRemove)
        }));
    };

    // ===== VIEW MODAL SCHEDULE FUNCTIONS =====
    const addViewScheduleSlot = () => {
        const { day, start, end } = viewNewSlot;
        const timeSlot = `${start} - ${end}`;
        const currentSlots = viewSchedule[day] || [];

        if (currentSlots.includes(timeSlot)) {
            alert('This time slot is already added for ' + day);
            return;
        }

        const startNum = getTimeNumber(start);
        const endNum = getTimeNumber(end);

        if (startNum >= endNum) {
            alert('Start time must be before end time.');
            return;
        }

        setViewSchedule(prev => ({
            ...prev,
            [day]: [...currentSlots, timeSlot]
        }));
    };

    const removeViewScheduleSlot = (day, slotToRemove) => {
        setViewSchedule(prev => ({
            ...prev,
            [day]: (prev[day] || []).filter(slot => slot !== slotToRemove)
        }));
    };

    const saveViewSchedule = async () => {
        setActionLoading(true);
        try {
            await dbDoctors.updateDoctor(selectedDoctor.id, {
                weekly_schedule: viewSchedule
            });
            setViewIsEditing(false);
            loadDoctors();
            window.dispatchEvent(new Event('doctorChanged'));
            setSuccessMsg('✅ Schedule updated successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            alert('Failed to save schedule: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // ===== PROFILE CARD SCHEDULE FUNCTIONS =====
    const startEditingCardSchedule = (doctor) => {
        setEditingCardId(doctor.id);
        setCardSchedule(doctor.weekly_schedule || {
            Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
        });
        setCardNewSlot({ day: 'Monday', start: '09:00 AM', end: '05:00 PM' });
    };

    const addCardScheduleSlot = () => {
        const { day, start, end } = cardNewSlot;
        const timeSlot = `${start} - ${end}`;
        const currentSlots = cardSchedule[day] || [];

        if (currentSlots.includes(timeSlot)) {
            alert('This time slot is already added for ' + day);
            return;
        }

        const startNum = getTimeNumber(start);
        const endNum = getTimeNumber(end);

        if (startNum >= endNum) {
            alert('Start time must be before end time.');
            return;
        }

        setCardSchedule(prev => ({
            ...prev,
            [day]: [...currentSlots, timeSlot]
        }));
    };

    const removeCardScheduleSlot = (day, slotToRemove) => {
        setCardSchedule(prev => ({
            ...prev,
            [day]: (prev[day] || []).filter(slot => slot !== slotToRemove)
        }));
    };

    const saveCardSchedule = async (doctorId) => {
        setActionLoading(true);
        try {
            await dbDoctors.updateDoctor(doctorId, {
                weekly_schedule: cardSchedule
            });
            setEditingCardId(null);
            loadDoctors();
            window.dispatchEvent(new Event('doctorChanged'));
            setSuccessMsg('✅ Schedule updated successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            alert('Failed to save schedule: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // ===== OPEN MODALS =====
    const openAddModal = () => {
        const defaultSchedule = {
            Monday: ['09:00 AM - 05:00 PM'],
            Tuesday: ['09:00 AM - 05:00 PM'],
            Wednesday: ['09:00 AM - 05:00 PM'],
            Thursday: ['09:00 AM - 05:00 PM'],
            Friday: ['09:00 AM - 05:00 PM'],
            Saturday: [],
            Sunday: []
        };
        setFormData({
            name: '',
            email: '',
            phone: '',
            specialization: '',
            availability: 'Available',
            weekly_schedule: defaultSchedule
        });
        setModalSchedule(defaultSchedule);
        setNewSlotTime({ day: 'Monday', start: '09:00 AM', end: '05:00 PM' });
        setFormErrors({});
        setErrorMsg('');
        setSuccessMsg('');
        setIsAddOpen(true);
    };

    const openEditModal = (doctor) => {
        setSelectedDoctor(doctor);
        const schedule = doctor.weekly_schedule || {
            Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
        };
        setFormData({
            name: doctor.name || '',
            email: doctor.email || '',
            phone: doctor.phone || '',
            specialization: doctor.specialization || '',
            availability: doctor.availability || 'Available',
            weekly_schedule: schedule
        });
        setModalSchedule(JSON.parse(JSON.stringify(schedule))); // Deep copy
        setNewSlotTime({ day: 'Monday', start: '09:00 AM', end: '05:00 PM' });
        setFormErrors({});
        setErrorMsg('');
        setSuccessMsg('');
        setIsEditOpen(true);
    };

    const openViewModal = (doctor) => {
        setSelectedDoctor(doctor);
        const schedule = doctor.weekly_schedule || {
            Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
        };
        setViewSchedule(JSON.parse(JSON.stringify(schedule))); // Deep copy
        setViewNewSlot({ day: 'Monday', start: '09:00 AM', end: '05:00 PM' });
        setViewIsEditing(false);
        setIsViewOpen(true);
    };

    const openScheduleModal = (doctor) => {
        setSelectedDoctor(doctor);
        setScheduleState(doctor.weekly_schedule || {
            Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
        });
        setNewSlotTime({ day: 'Monday', start: '09:00 AM', end: '05:00 PM' });
        setIsScheduleOpen(true);
    };

    const openDeleteModal = (doctor) => {
        setSelectedDoctor(doctor);
        setIsDeleteOpen(true);
    };

    // ===== ADD DOCTOR =====
    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setActionLoading(true);
        setErrorMsg('');
        try {
            const finalData = {
                ...formData,
                weekly_schedule: modalSchedule
            };
            await dbDoctors.createDoctor(finalData);
            setIsAddOpen(false);
            loadDoctors();
            window.dispatchEvent(new Event('doctorChanged'));
            setSuccessMsg('✅ Doctor added successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setErrorMsg(err.message || 'Failed to add doctor.');
        } finally {
            setActionLoading(false);
        }
    };

    // ===== EDIT DOCTOR =====
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setActionLoading(true);
        setErrorMsg('');
        try {
            const finalData = {
                ...formData,
                weekly_schedule: modalSchedule
            };
            await dbDoctors.updateDoctor(selectedDoctor.id, finalData);
            setIsEditOpen(false);
            loadDoctors();
            window.dispatchEvent(new Event('doctorChanged'));
            setSuccessMsg('✅ Doctor updated successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setErrorMsg(err.message || 'Failed to update doctor.');
        } finally {
            setActionLoading(false);
        }
    };

    // ===== TOGGLE AVAILABILITY =====
    const handleAvailabilityChange = async (doctor, newStatus) => {
        try {
            await dbDoctors.toggleAvailability(doctor.id, newStatus);
            setDoctors(prev =>
                prev.map(d => (d.id === doctor.id ? { ...d, availability: newStatus } : d))
            );
            window.dispatchEvent(new Event('doctorChanged'));
        } catch (err) {
            alert('Failed to change availability: ' + err.message);
        }
    };

    // ===== DELETE DOCTOR =====
    const handleDeleteSubmit = async () => {
        setActionLoading(true);
        try {
            await dbDoctors.deleteDoctor(selectedDoctor.id);
            setIsDeleteOpen(false);
            loadDoctors();
            window.dispatchEvent(new Event('doctorChanged'));
            setSuccessMsg('✅ Doctor deleted successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } finally {
            setActionLoading(false);
        }
    };

    // ===== SCHEDULE FUNCTIONS (for separate schedule modal) =====
    const addScheduleSlot = () => {
        const { day, start, end } = newSlotTime;
        const timeSlot = `${start} - ${end}`;
        const currentSlots = scheduleState[day] || [];

        if (currentSlots.includes(timeSlot)) {
            alert('This time slot is already added for ' + day);
            return;
        }

        const startNum = getTimeNumber(start);
        const endNum = getTimeNumber(end);

        if (startNum >= endNum) {
            alert('Start time must be before end time.');
            return;
        }

        setScheduleState(prev => ({
            ...prev,
            [day]: [...currentSlots, timeSlot]
        }));
    };

    const removeScheduleSlot = (day, slotToRemove) => {
        setScheduleState(prev => ({
            ...prev,
            [day]: (prev[day] || []).filter(slot => slot !== slotToRemove)
        }));
    };

    const saveSchedule = async () => {
        setActionLoading(true);
        try {
            await dbDoctors.updateDoctor(selectedDoctor.id, {
                weekly_schedule: scheduleState
            });
            setIsScheduleOpen(false);
            loadDoctors();
            window.dispatchEvent(new Event('doctorChanged'));
            setSuccessMsg('✅ Schedule saved successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } finally {
            setActionLoading(false);
        }
    };

    // ===== GET TODAY'S SCHEDULE =====
    const getTodaySchedule = (doctor) => {
        const today = new Date().toLocaleString('en-US', { weekday: 'long' });
        const slots = doctor.weekly_schedule?.[today] || [];
        return slots.length > 0 ? slots.join(', ') : 'Off';
    };

    // ===== GET AVAILABILITY BADGE =====
    const getAvailabilityBadge = (availability) => {
        const map = {
            'Available': { color: '#22C55E', bg: '#22C55E20' },
            'Unavailable': { color: '#EF4444', bg: '#EF444420' },
            'On Leave': { color: '#F59E0B', bg: '#F59E0B20' }
        };
        const info = map[availability] || map['Available'];
        return (
            <span style={{
                padding: '3px 12px',
                borderRadius: '20px',
                fontSize: '0.7rem',
                display: 'inline-flex',
                alignItems: 'center',
                background: info.bg,
                color: info.color,
                fontWeight: 500
            }}>
                {availability}
            </span>
        );
    };

    // ===== RENDER SCHEDULE UI =====
    const renderScheduleUI = (schedule, onAdd, onRemove, addSlotState, setAddSlotState, isCard = false) => {
        const safeSchedule = schedule || {};

        return (
            <div>
                {/* Add Slot Controls */}
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    alignItems: 'flex-end',
                    padding: '10px',
                    background: 'var(--bg-primary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    marginBottom: '12px'
                }}>
                    <div className="form-group" style={{ margin: 0, flex: '1 1 100px' }}>
                        <label className="form-label" style={{ fontSize: '0.65rem' }}>Day</label>
                        <select
                            className="hms-select"
                            value={addSlotState?.day || 'Monday'}
                            onChange={(e) => setAddSlotState(prev => ({ ...prev, day: e.target.value }))}
                            style={{ height: '32px', padding: '0 8px', fontSize: '0.7rem', width: '100%' }}
                        >
                            {weekDays.map(d => <option key={d} value={d}>{d.slice(0, 3)}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ margin: 0, flex: '1 1 80px' }}>
                        <label className="form-label" style={{ fontSize: '0.65rem' }}>Start</label>
                        <select
                            className="hms-select"
                            value={addSlotState?.start || '09:00 AM'}
                            onChange={(e) => setAddSlotState(prev => ({ ...prev, start: e.target.value }))}
                            style={{ height: '32px', padding: '0 8px', fontSize: '0.7rem', width: '100%' }}
                        >
                            {['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM'].map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group" style={{ margin: 0, flex: '1 1 80px' }}>
                        <label className="form-label" style={{ fontSize: '0.65rem' }}>End</label>
                        <select
                            className="hms-select"
                            value={addSlotState?.end || '05:00 PM'}
                            onChange={(e) => setAddSlotState(prev => ({ ...prev, end: e.target.value }))}
                            style={{ height: '32px', padding: '0 8px', fontSize: '0.7rem', width: '100%' }}
                        >
                            {['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM'].map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="button"
                        onClick={onAdd}
                        style={{
                            padding: '4px 12px',
                            height: '32px',
                            border: 'none',
                            borderRadius: '6px',
                            background: 'var(--primary-color)',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: 'white',
                            fontWeight: 500,
                            transition: 'all 0.2s ease',
                            flex: '0 0 auto'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#1D4ED8'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--primary-color)'; }}
                    >
                        <Plus size={12} /> Add
                    </button>
                </div>

                {/* Schedule Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isCard ? '1fr 1fr' : 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '8px'
                }}>
                    {weekDays.map((day) => {
                        const slots = safeSchedule[day] || [];
                        return (
                            <div key={day} style={{
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                padding: '6px 8px'
                            }}>
                                <div style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    marginBottom: '4px',
                                    paddingBottom: '3px',
                                    borderBottom: '1px solid var(--border-color)'
                                }}>{day}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    {slots.length === 0 ? (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontStyle: 'italic' }}>No slots</span>
                                    ) : (
                                        slots.map((slot, index) => (
                                            <div key={index} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                fontSize: '0.6rem',
                                                padding: '2px 4px',
                                                background: 'var(--card-bg)',
                                                borderRadius: '3px',
                                                border: '1px solid var(--border-color)'
                                            }}>
                                                <span style={{ color: 'var(--text-primary)' }}>{slot}</span>
                                                <button
                                                    type="button"
                                                    style={{
                                                        border: 'none',
                                                        background: 'none',
                                                        color: 'var(--danger-color)',
                                                        cursor: 'pointer',
                                                        padding: '2px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        borderRadius: '3px',
                                                        transition: 'background 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                                                    onClick={() => onRemove(day, slot)}
                                                    title="Remove slot"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // ===== CLEAR FILTERS =====
    const clearFilters = () => {
        setSearchQuery('');
        setSpecializationFilter('');
        setAvailabilityFilter('');
        setShowFilters(false);
    };

    const activeFilterCount = (searchQuery ? 1 : 0) + (specializationFilter ? 1 : 0) + (availabilityFilter ? 1 : 0);

    // ===== GO BACK =====
    const goBack = () => {
        window.history.back();
    };

    return (
        <DashboardLayout active="doctors" title="Doctors Management">
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
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'transparent';
                        e.target.style.color = 'var(--text-secondary)';
                        e.target.style.borderColor = 'var(--border-color)';
                    }}
                >
                    <ArrowLeft size={16} /> Back
                </button>
            </div>

            {/* ===== SUCCESS / ERROR MESSAGES ===== */}
            {successMsg && (
                <div className="alert alert-success" style={{ marginBottom: '16px', borderRadius: '8px', padding: '12px 16px', background: '#22C55E15', border: '1px solid #22C55E30', color: '#22C55E' }}>
                    {successMsg}
                </div>
            )}
            {errorMsg && (
                <div className="alert alert-danger" style={{ marginBottom: '16px', borderRadius: '8px', padding: '12px 16px', background: '#EF444415', border: '1px solid #EF444430', color: '#EF4444' }}>
                    {errorMsg}
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
                    gap: '12px'
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
                        <Users size={16} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{doctors.length}</div>
                    </div>
                </div>
                <div className="stat-card" style={{
                    padding: '12px 16px',
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
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
                        <Check size={16} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Available</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {doctors.filter(d => d.availability === 'Available').length}
                        </div>
                    </div>
                </div>
                <div className="stat-card" style={{
                    padding: '12px 16px',
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
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
                        <Clock size={16} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>On Leave</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {doctors.filter(d => d.availability === 'On Leave').length}
                        </div>
                    </div>
                </div>
                <div className="stat-card" style={{
                    padding: '12px 16px',
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
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
                        <X size={16} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Unavailable</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {doctors.filter(d => d.availability === 'Unavailable').length}
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
                padding: '10px 14px',
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
                        placeholder="Search doctors..."
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
                    />
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                    >
                        <Plus size={14} /> Add Doctor
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
                        value={specializationFilter}
                        onChange={(e) => setSpecializationFilter(e.target.value)}
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
                        <option value="">All Specializations</option>
                        {specializations.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <select
                        value={availabilityFilter}
                        onChange={(e) => setAvailabilityFilter(e.target.value)}
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
                        <option value="">All Availability</option>
                        <option value="Available">Available</option>
                        <option value="Unavailable">Unavailable</option>
                        <option value="On Leave">On Leave</option>
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
                    >
                        Clear All
                    </button>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {filteredDoctors.length} found
                    </span>
                </div>
            )}

            {/* ===== DOCTORS GRID ===== */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    <div className="spinner" style={{ margin: '0 auto 12px' }}>⏳</div>
                    Loading doctors...
                </div>
            ) : filteredDoctors.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>👨‍⚕️</div>
                    No doctors found.
                    {activeFilterCount > 0 && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>
                            Try clearing your filters to see all doctors.
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
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontFamily: 'var(--font-family)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <Plus size={16} /> First Doctor
                    </button>
                </div>
            ) : (
                <div className="hms-grid hms-grid-3">
                    {filteredDoctors.map((doctor) => {
                        const avatarInitial = doctor.name.replace('Dr. ', '').charAt(0).toUpperCase();
                        const isEditing = editingCardId === doctor.id;

                        return (
                            <div key={doctor.id} className="auth-card" style={{
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                animation: 'none',
                                transition: 'all 0.3s ease',
                                background: 'var(--card-bg)',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)'
                            }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}>
                                {/* Header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div className="profile-card-avatar" style={{
                                        margin: '0',
                                        width: '44px',
                                        height: '44px',
                                        fontSize: '1.1rem',
                                        background: 'linear-gradient(135deg, var(--primary-color), #7C3AED)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 600,
                                        flexShrink: 0
                                    }}>
                                        {avatarInitial}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h4 style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0 }}>
                                            {doctor.name}
                                        </h4>
                                        <p style={{ color: 'var(--primary-color)', fontSize: '0.75rem', fontWeight: 500, margin: 0 }}>
                                            {doctor.specialization}
                                        </p>
                                    </div>
                                    {getAvailabilityBadge(doctor.availability)}
                                </div>

                                {/* Details */}
                                <div style={{
                                    fontSize: '0.8rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                    borderTop: '1px solid var(--border-color)',
                                    borderBottom: '1px solid var(--border-color)',
                                    padding: '10px 0'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{doctor.email || 'N/A'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
                                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{doctor.phone}</span>
                                    </div>
                                    {/* Today's Schedule Quick View */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '2px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Today:</span>
                                        <span style={{ fontWeight: 500 }}>
                                            {getTodaySchedule(doctor)}
                                        </span>
                                    </div>
                                </div>

                                {/* ===== PROFILE CARD SCHEDULE EDIT ===== */}
                                {isEditing ? (
                                    <div style={{
                                        border: '2px solid var(--primary-color)',
                                        borderRadius: '8px',
                                        padding: '10px',
                                        background: 'var(--bg-primary)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-color)' }}>
                                                <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} /> Edit Schedule
                                            </span>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button
                                                    onClick={() => setEditingCardId(null)}
                                                    style={{
                                                        padding: '2px 8px',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '4px',
                                                        background: 'transparent',
                                                        cursor: 'pointer',
                                                        fontSize: '0.6rem',
                                                        color: 'var(--text-secondary)'
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => saveCardSchedule(doctor.id)}
                                                    style={{
                                                        padding: '2px 8px',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        background: 'var(--primary-color)',
                                                        cursor: 'pointer',
                                                        fontSize: '0.6rem',
                                                        color: 'white',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '3px'
                                                    }}
                                                >
                                                    <Save size={12} /> Save
                                                </button>
                                            </div>
                                        </div>
                                        {renderScheduleUI(
                                            cardSchedule,
                                            addCardScheduleSlot,
                                            removeCardScheduleSlot,
                                            cardNewSlot,
                                            setCardNewSlot,
                                            true
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => startEditingCardSchedule(doctor)}
                                        style={{
                                            padding: '4px 10px',
                                            border: '1px dashed var(--border-color)',
                                            borderRadius: '6px',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '0.7rem',
                                            color: 'var(--text-secondary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px',
                                            transition: 'all 0.2s ease',
                                            width: '100%'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--primary-color)';
                                            e.currentTarget.style.color = 'var(--primary-color)';
                                            e.currentTarget.style.background = 'var(--primary-color)10';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--border-color)';
                                            e.currentTarget.style.color = 'var(--text-secondary)';
                                            e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        <Calendar size={12} /> Edit Schedule
                                    </button>
                                )}

                                {/* Actions */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                    <select
                                        className="hms-select"
                                        style={{
                                            height: '28px',
                                            padding: '0 8px',
                                            fontSize: '0.7rem',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '6px',
                                            background: 'var(--card-bg)',
                                            color: 'var(--text-primary)',
                                            fontFamily: 'var(--font-family)'
                                        }}
                                        value={doctor.availability}
                                        onChange={(e) => handleAvailabilityChange(doctor, e.target.value)}
                                    >
                                        <option value="Available">Available</option>
                                        <option value="Unavailable">Unavailable</option>
                                        <option value="On Leave">On Leave</option>
                                    </select>
                                    <div className="hms-actions" style={{ gap: '4px', display: 'flex' }}>
                                        <button className="hms-action-btn view" title="View Details" onClick={() => openViewModal(doctor)}>
                                            <Eye size={14} />
                                        </button>
                                        <button className="hms-action-btn edit" title="Manage Schedule" onClick={() => openScheduleModal(doctor)}>
                                            <Calendar size={14} />
                                        </button>
                                        <button className="hms-action-btn edit" title="Edit Details" onClick={() => openEditModal(doctor)}>
                                            <Edit2 size={14} />
                                        </button>
                                        <button className="hms-action-btn delete" title="Delete Doctor" onClick={() => openDeleteModal(doctor)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ===== ADD DOCTOR MODAL ===== */}
            {isAddOpen && (
                <div className="hms-modal-backdrop" onClick={() => setIsAddOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column', maxWidth: '720px' }}>
                        <div className="hms-modal-header">
                            <h3 className="hms-modal-title"><Stethoscope size={18} style={{ color: 'var(--primary-color)' }} /> Add New Doctor</h3>
                            <button className="hms-modal-close" onClick={() => setIsAddOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="hms-modal-body" style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                            {errorMsg && <div className="alert alert-danger" style={{ padding: '10px', marginBottom: '12px', background: '#EF444415', border: '1px solid #EF444430', borderRadius: '8px', color: '#EF4444' }}>{errorMsg}</div>}
                            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <InputField
                                    label="Full Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Dr. Ahmed Khan"
                                    error={formErrors.name}
                                    required
                                />
                                <InputField
                                    label="Specialization"
                                    name="specialization"
                                    value={formData.specialization}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Cardiology"
                                    error={formErrors.specialization}
                                    required
                                />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <InputField
                                        label="Phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 03001234567"
                                        error={formErrors.phone}
                                        required
                                    />
                                    <InputField
                                        label="Email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="e.g. doctor@hospital.com"
                                        error={formErrors.email}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Availability</label>
                                    <select name="availability" className="hms-select" value={formData.availability} onChange={handleInputChange} style={{ width: '100%', height: '40px' }}>
                                        <option value="Available">Available</option>
                                        <option value="Unavailable">Unavailable</option>
                                        <option value="On Leave">On Leave</option>
                                    </select>
                                </div>

                                <div style={{ marginTop: '8px', borderTop: '2px solid var(--border-color)', paddingTop: '16px' }}>
                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', marginBottom: '12px' }}>
                                        <Calendar size={18} style={{ color: 'var(--primary-color)' }} /> Weekly Schedule
                                    </h4>
                                    {renderScheduleUI(
                                        modalSchedule,
                                        addModalScheduleSlot,
                                        removeModalScheduleSlot,
                                        newSlotTime,
                                        setNewSlotTime
                                    )}
                                </div>
                            </form>
                        </div>
                        <div className="hms-modal-footer">
                            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddSubmit} loading={actionLoading}>Add Doctor</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== EDIT DOCTOR MODAL ===== */}
            {isEditOpen && (
                <div className="hms-modal-backdrop" onClick={() => setIsEditOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column', maxWidth: '720px' }}>
                        <div className="hms-modal-header">
                            <h3 className="hms-modal-title"><Edit2 size={18} style={{ color: 'var(--secondary-color)' }} /> Edit Doctor</h3>
                            <button className="hms-modal-close" onClick={() => setIsEditOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="hms-modal-body" style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                            {errorMsg && <div className="alert alert-danger" style={{ padding: '10px', marginBottom: '12px', background: '#EF444415', border: '1px solid #EF444430', borderRadius: '8px', color: '#EF4444' }}>{errorMsg}</div>}
                            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <InputField
                                    label="Full Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Dr. Ahmed Khan"
                                    error={formErrors.name}
                                    required
                                />
                                <InputField
                                    label="Specialization"
                                    name="specialization"
                                    value={formData.specialization}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Cardiology"
                                    error={formErrors.specialization}
                                    required
                                />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <InputField
                                        label="Phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 03001234567"
                                        error={formErrors.phone}
                                        required
                                    />
                                    <InputField
                                        label="Email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="e.g. doctor@hospital.com"
                                        error={formErrors.email}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Availability</label>
                                    <select name="availability" className="hms-select" value={formData.availability} onChange={handleInputChange} style={{ width: '100%', height: '40px' }}>
                                        <option value="Available">Available</option>
                                        <option value="Unavailable">Unavailable</option>
                                        <option value="On Leave">On Leave</option>
                                    </select>
                                </div>

                                <div style={{ marginTop: '8px', borderTop: '2px solid var(--border-color)', paddingTop: '16px' }}>
                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', marginBottom: '12px' }}>
                                        <Calendar size={18} style={{ color: 'var(--primary-color)' }} /> Weekly Schedule
                                    </h4>
                                    {renderScheduleUI(
                                        modalSchedule,
                                        addModalScheduleSlot,
                                        removeModalScheduleSlot,
                                        newSlotTime,
                                        setNewSlotTime
                                    )}
                                </div>
                            </form>
                        </div>
                        <div className="hms-modal-footer">
                            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                            <Button onClick={handleEditSubmit} loading={actionLoading}>Save Changes</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== DELETE CONFIRMATION MODAL ===== */}
            {isDeleteOpen && (
                <div className="hms-modal-backdrop" onClick={() => setIsDeleteOpen(false)}>
                    <div className="hms-modal small" onClick={(e) => e.stopPropagation()}>
                        <div className="hms-modal-header">
                            <h3 className="hms-modal-title" style={{ color: 'var(--danger-color)' }}><Trash2 size={18} /> Delete Doctor</h3>
                            <button className="hms-modal-close" onClick={() => setIsDeleteOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="hms-modal-body" style={{ textAlign: 'center', padding: '24px' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚠️</div>
                            <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '8px' }}>Are you sure?</p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Delete <strong>{selectedDoctor?.name}</strong>'s profile permanently?
                            </p>
                        </div>
                        <div className="hms-modal-footer">
                            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                            <Button variant="danger" onClick={handleDeleteSubmit} loading={actionLoading}>Delete</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== SEPARATE SCHEDULE MODAL ===== */}
            {isScheduleOpen && selectedDoctor && (
                <div className="hms-modal-backdrop" onClick={() => setIsScheduleOpen(false)}>
                    <div className="hms-modal large" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column', maxWidth: '720px' }}>
                        <div className="hms-modal-header">
                            <h3 className="hms-modal-title"><Calendar size={18} style={{ color: 'var(--primary-color)' }} /> Schedule: {selectedDoctor.name}</h3>
                            <button className="hms-modal-close" onClick={() => setIsScheduleOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="hms-modal-body" style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                            {renderScheduleUI(
                                scheduleState,
                                addScheduleSlot,
                                removeScheduleSlot,
                                newSlotTime,
                                setNewSlotTime
                            )}
                        </div>
                        <div className="hms-modal-footer">
                            <Button variant="outline" onClick={() => setIsScheduleOpen(false)}>Cancel</Button>
                            <Button onClick={saveSchedule} loading={actionLoading}>Save Schedule</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== VIEW DOCTOR MODAL - WITH SCHEDULE EDIT ===== */}
            {isViewOpen && selectedDoctor && (
                <div className="hms-modal-backdrop" onClick={() => setIsViewOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{
                        maxWidth: '560px',
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
                        <div className="hms-modal-header" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '14px 18px',
                            borderBottom: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)'
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
                                <User size={18} style={{ color: 'var(--primary-color)' }} />
                                Doctor Details
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
                            flex: 1,
                            background: 'var(--bg-primary)'
                        }}>
                            {/* Doctor Info */}
                            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                <div className="profile-card-avatar" style={{
                                    margin: '0 auto',
                                    width: '64px',
                                    height: '64px',
                                    fontSize: '1.5rem',
                                    background: 'linear-gradient(135deg, var(--primary-color), #7C3AED)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 600
                                }}>
                                    {selectedDoctor.name.replace('Dr. ', '').charAt(0).toUpperCase()}
                                </div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '8px', marginBottom: '2px', color: 'var(--text-primary)' }}>
                                    {selectedDoctor.name}
                                </h3>
                                <p style={{ color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: 500 }}>
                                    {selectedDoctor.specialization}
                                </p>
                                <div style={{ marginTop: '4px' }}>{getAvailabilityBadge(selectedDoctor.availability)}</div>
                            </div>

                            {/* Contact Info */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '10px',
                                marginBottom: '16px'
                            }}>
                                <div style={{
                                    padding: '10px 12px',
                                    background: 'var(--card-bg)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                        <Mail size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                        Email
                                    </div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                        {selectedDoctor.email || 'N/A'}
                                    </div>
                                </div>
                                <div style={{
                                    padding: '10px 12px',
                                    background: 'var(--card-bg)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                        <Phone size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                        Phone
                                    </div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                        {selectedDoctor.phone}
                                    </div>
                                </div>
                            </div>

                            {/* Schedule Section */}
                            <div style={{
                                borderTop: '1px solid var(--border-color)',
                                paddingTop: '14px',
                                marginTop: '4px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '10px'
                                }}>
                                    <h4 style={{
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        margin: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        color: 'var(--text-primary)'
                                    }}>
                                        <Calendar size={16} style={{ color: 'var(--primary-color)' }} />
                                        Weekly Schedule
                                    </h4>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        {!viewIsEditing ? (
                                            <button
                                                onClick={() => setViewIsEditing(true)}
                                                style={{
                                                    padding: '3px 10px',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: '6px',
                                                    background: 'transparent',
                                                    cursor: 'pointer',
                                                    fontSize: '0.6rem',
                                                    color: 'var(--text-secondary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '3px'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.borderColor = 'var(--primary-color)';
                                                    e.target.style.color = 'var(--primary-color)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.borderColor = 'var(--border-color)';
                                                    e.target.style.color = 'var(--text-secondary)';
                                                }}
                                            >
                                                <Edit2 size={12} /> Edit
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => setViewIsEditing(false)}
                                                    style={{
                                                        padding: '3px 10px',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '6px',
                                                        background: 'transparent',
                                                        cursor: 'pointer',
                                                        fontSize: '0.6rem',
                                                        color: 'var(--text-secondary)'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.background = 'var(--hover-bg)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.background = 'transparent';
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={saveViewSchedule}
                                                    disabled={actionLoading}
                                                    style={{
                                                        padding: '3px 10px',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        background: 'var(--primary-color)',
                                                        cursor: actionLoading ? 'not-allowed' : 'pointer',
                                                        fontSize: '0.6rem',
                                                        color: 'white',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '3px',
                                                        opacity: actionLoading ? 0.7 : 1
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!actionLoading) {
                                                            e.target.style.background = '#1D4ED8';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!actionLoading) {
                                                            e.target.style.background = 'var(--primary-color)';
                                                        }
                                                    }}
                                                >
                                                    <Save size={12} /> Save
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {viewIsEditing ? (
                                    // Edit Mode - Schedule with Add/Remove
                                    renderScheduleUI(
                                        viewSchedule,
                                        addViewScheduleSlot,
                                        removeViewScheduleSlot,
                                        viewNewSlot,
                                        setViewNewSlot,
                                        false
                                    )
                                ) : (
                                    // View Mode - Schedule Display
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '6px'
                                    }}>
                                        {weekDays.map(day => {
                                            const slots = viewSchedule[day] || [];
                                            return (
                                                <div key={day} style={{
                                                    padding: '6px 10px',
                                                    background: 'var(--card-bg)',
                                                    borderRadius: '6px',
                                                    border: '1px solid var(--border-color)'
                                                }}>
                                                    <div style={{
                                                        fontSize: '0.6rem',
                                                        fontWeight: 600,
                                                        color: 'var(--text-muted)',
                                                        marginBottom: '2px'
                                                    }}>
                                                        {day}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '0.7rem',
                                                        color: 'var(--text-primary)',
                                                        fontWeight: 500
                                                    }}>
                                                        {slots.length > 0 ? slots.join(', ') : 'Off'}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="hms-modal-footer" style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '8px',
                            padding: '12px 18px',
                            borderTop: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)'
                        }}>
                            <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
                            <Button onClick={() => { setIsViewOpen(false); openEditModal(selectedDoctor); }}>
                                <Edit2 size={16} /> Edit Profile
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default Doctors;