import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { supabase } from '../services/supabaseClient';
import Button from '../components/Button';
import InputField from '../components/InputField';
import {
    Plus, Search, Edit2, Trash2, X, Calendar,
    User, Phone, Mail, Clock, Check, AlertCircle,
    ArrowLeft, Stethoscope, ChevronRight, Filter,
    Eye, Printer, Users, Activity, FileText, Save,
    MapPin, Award, CreditCard, Briefcase, Building,
    Globe, Heart, BookOpen, DollarSign, Calendar as CalIcon,
    Hash, Target, Users as UsersIcon, MessageCircle,
    // ===== FIXED ICONS =====
    Share2,      // Twitter ki jagah
    Link2,       // Linkedin ki jagah
    Camera,      // Instagram ki jagah
    Play,        // Youtube ki jagah
    Facebook,
    Link2 as LinkIcon, File, Upload, Camera as CameraIcon, UserCheck,
    Shield, Key, Lock, Smartphone, Home, Hospital,
    Clipboard, Thermometer, Droplet, Scissors, Bone,
    Brain, Eye as EyeIcon, Ear, Baby, HeartPulse,
    Stethoscope as StethIcon, Pill, Syringe, Ambulance,
    Bed, ClipboardList, Star, StarOff, Trophy,
    Medal, GraduationCap, BriefcaseMedical,
    Languages, Clock as ClockIcon, Sun, Moon
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

    // ===== COMPLETE FORM STATE =====
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        cnic: '',
        date_of_birth: '',
        gender: '',
        blood_group: '',
        religion: '',
        nationality: '',
        specialization: '',
        qualification: '',
        experience: '',
        license_number: '',
        pmdc_number: '',
        council_registration: '',
        practicing_since: '',
        department: 'Medical',
        designation: '',
        employment_type: 'Full-time',
        joining_date: '',
        salary: '',
        shift: 'Morning',
        employee_id: '',
        address: '',
        city: '',
        state: '',
        country: '',
        zip_code: '',
        emergency_contact: '',
        emergency_phone: '',
        availability: 'Available',
        weekly_schedule: {
            Monday: ['09:00 AM - 05:00 PM'],
            Tuesday: ['09:00 AM - 05:00 PM'],
            Wednesday: ['09:00 AM - 05:00 PM'],
            Thursday: ['09:00 AM - 05:00 PM'],
            Friday: ['09:00 AM - 05:00 PM'],
            Saturday: [],
            Sunday: []
        },
        bio: '',
        languages: [],
        special_interests: [],
        awards: [],
        publications: [],
        certifications: [],
        social_media: {
            facebook: '',
            twitter: '',
            linkedin: '',
            instagram: '',
            youtube: ''
        },
        username: '',
        password: '',
        confirm_password: '',
        role: 'Doctor',
        permissions: [],
        status: 'Active',
        backup_contact: '',
        backup_phone: '',
        preferred_contact_method: 'phone',
        notes: ''
    });

    // ===== MODAL SCHEDULE STATE =====
    const [modalSchedule, setModalSchedule] = useState({
        Monday: ['09:00 AM - 05:00 PM'],
        Tuesday: ['09:00 AM - 05:00 PM'],
        Wednesday: ['09:00 AM - 05:00 PM'],
        Thursday: ['09:00 AM - 05:00 PM'],
        Friday: ['09:00 AM - 05:00 PM'],
        Saturday: [],
        Sunday: []
    });

    const [newSlotTime, setNewSlotTime] = useState({
        day: 'Monday',
        start: '09:00 AM',
        end: '05:00 PM'
    });

    const [scheduleState, setScheduleState] = useState({});

    // ===== VIEW MODAL SCHEDULE STATE =====
    const [viewSchedule, setViewSchedule] = useState({});
    const [viewNewSlot, setViewNewSlot] = useState({
        day: 'Monday',
        start: '09:00 AM',
        end: '05:00 PM'
    });
    const [viewIsEditing, setViewIsEditing] = useState(false);

    // ===== PROFILE CARD SCHEDULE STATE =====
    const [cardSchedule, setCardSchedule] = useState({});
    const [cardNewSlot, setCardNewSlot] = useState({
        day: 'Monday',
        start: '09:00 AM',
        end: '05:00 PM'
    });
    const [editingCardId, setEditingCardId] = useState(null);

    const [formErrors, setFormErrors] = useState({});
    const [actionLoading, setActionLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // ===== CONSTANTS =====
    const statusColors = {
        primary: '#2563EB',
        success: '#22C55E',
        danger: '#EF4444',
        warning: '#F59E0B',
        purple: '#8B5CF6',
        pink: '#EC4899',
        teal: '#14B8A6'
    };

    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const departments = [
        'Medical', 'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics',
        'Dermatology', 'Ophthalmology', 'ENT', 'Gynecology', 'Psychiatry',
        'Radiology', 'Pathology', 'Emergency', 'ICU', 'Surgery',
        'Internal Medicine', 'Family Medicine', 'Geriatrics', 'Oncology',
        'Nephrology', 'Urology', 'Gastroenterology', 'Pulmonology',
        'Rheumatology', 'Infectious Disease', 'Endocrinology', 'Hematology',
        'Immunology', 'Allergy', 'Sports Medicine', 'Pain Management',
        'Anesthesiology', 'Dentistry', 'Physiotherapy', 'Nutrition'
    ];

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const genders = ['Male', 'Female', 'Other'];
    const shifts = ['Morning', 'Evening', 'Night', 'Rotating', 'On-Call'];
    const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Locum', 'Consultant'];
    const preferredContactMethods = ['phone', 'email', 'sms', 'whatsapp'];
    const languages = ['English', 'Urdu', 'Arabic', 'French', 'Spanish', 'German', 'Chinese', 'Russian', 'Hindi', 'Punjabi', 'Pashto', 'Sindhi', 'Balochi'];

    // ===== TIME VALIDATION - IMPROVED =====
    const getTimeNumber = (timeStr) => {
        if (!timeStr || !timeStr.trim()) return 0;

        let clean = timeStr.trim().toUpperCase();
        const isPM = clean.includes('PM');
        const isAM = clean.includes('AM');

        let match = clean.match(/(\d{1,2}):(\d{2})/);
        if (!match) {
            match = clean.match(/(\d{1,2})\s*(\d{2})/);
        }

        if (!match) {
            const numMatch = clean.match(/(\d{1,2})/);
            if (numMatch) {
                let hours = parseInt(numMatch[1]);
                if (isPM && hours !== 12) hours += 12;
                if (isAM && hours === 12) hours = 0;
                return hours * 60;
            }
            return 0;
        }

        let hours = parseInt(match[1]);
        let minutes = parseInt(match[2]) || 0;

        if (isPM && hours !== 12) hours += 12;
        if (isAM && hours === 12) hours = 0;

        return (hours * 60) + minutes;
    };

    const validateTimeFormat = (timeStr) => {
        if (!timeStr || !timeStr.trim()) return false;
        const clean = timeStr.trim();
        const timeRegex = /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i;
        return timeRegex.test(clean);
    };

    // ===== LOAD DOCTORS =====
    const loadDoctors = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            let query = supabase
                .from('doctors')
                .select('*');

            if (searchQuery && searchQuery.trim() !== '') {
                query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,specialization.ilike.%${searchQuery}%`);
            }

            const { data, error } = await query;

            if (error) {
                console.error('❌ Error loading doctors:', error);
                setErrorMsg('Failed to load doctors: ' + error.message);
                setDoctors([]);
                return;
            }

            console.log('✅ Doctors loaded:', data);
            setDoctors(data || []);
        } catch (err) {
            console.error('❌ Error loading doctors:', err);
            setErrorMsg('Failed to load doctors: ' + err.message);
            setDoctors([]);
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

    // ===== GET UNIQUE SPECIALIZATIONS =====
    const uniqueSpecializations = [...new Set(doctors.map(d => d.specialization))].filter(Boolean);

    // ===== HANDLE FORM CHANGE =====
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // ===== COMPLETE VALIDATION =====
    const validateField = (name, value) => {
        let error = '';

        switch (name) {
            case 'name':
                if (!value || !value.trim()) {
                    error = 'Doctor name is required';
                } else if (value.trim().length < 3) {
                    error = 'Name must be at least 3 characters';
                } else if (value.trim().length > 100) {
                    error = 'Name must be less than 100 characters';
                } else if (!/^[a-zA-Z\s\-'.]+$/.test(value.trim())) {
                    error = 'Name contains invalid characters';
                }
                break;

            case 'email':
                if (value && value.trim()) {
                    if (!/\S+@\S+\.\S+/.test(value.trim())) {
                        error = 'Enter a valid email address';
                    } else if (value.trim().length > 100) {
                        error = 'Email must be less than 100 characters';
                    }
                }
                break;

            case 'phone':
                if (!value || !value.trim()) {
                    error = 'Phone number is required';
                } else if (!/^\+?[0-9\s-]{7,15}$/.test(value.trim())) {
                    error = 'Enter a valid phone number (7-15 digits)';
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
                    const now = new Date();
                    const age = now.getFullYear() - dob.getFullYear();
                    if (age < 18) {
                        error = 'Doctor must be at least 18 years old';
                    } else if (age > 80) {
                        error = 'Invalid date of birth';
                    }
                }
                break;

            case 'specialization':
                if (!value || !value.trim()) {
                    error = 'Specialization is required';
                } else if (value.trim().length < 3) {
                    error = 'Specialization must be at least 3 characters';
                }
                break;

            case 'qualification':
                if (value && value.trim().length > 200) {
                    error = 'Qualification must be less than 200 characters';
                }
                break;

            case 'experience':
                if (value && value.trim()) {
                    if (!/^[0-9]+$/.test(value.trim())) {
                        error = 'Experience must be a number';
                    } else if (parseInt(value) > 50) {
                        error = 'Experience cannot be more than 50 years';
                    }
                }
                break;

            case 'license_number':
                if (value && value.trim().length > 50) {
                    error = 'License number must be less than 50 characters';
                }
                break;

            case 'pmdc_number':
                if (value && value.trim().length > 20) {
                    error = 'PMDC number must be less than 20 characters';
                }
                break;

            case 'salary':
                if (value && value.trim() && !/^[0-9,]+$/.test(value.trim().replace(/,/g, ''))) {
                    error = 'Salary must be a valid number';
                }
                break;

            case 'emergency_phone':
                if (value && value.trim() && !/^\+?[0-9\s-]{7,15}$/.test(value.trim())) {
                    error = 'Enter a valid emergency phone number';
                }
                break;

            case 'username':
                if (value && value.trim()) {
                    if (!/^[a-zA-Z0-9_]{3,20}$/.test(value.trim())) {
                        error = 'Username must be 3-20 characters (letters, numbers, underscore)';
                    }
                }
                break;

            case 'password':
                if (value && value.trim()) {
                    if (value.trim().length < 8) {
                        error = 'Password must be at least 8 characters';
                    } else if (!/(?=.*[A-Z])(?=.*[0-9])/.test(value.trim())) {
                        error = 'Password must contain at least one uppercase letter and one number';
                    }
                }
                break;

            case 'confirm_password':
                if (value && value.trim() !== formData.password) {
                    error = 'Passwords do not match';
                }
                break;

            default:
                break;
        }

        return error;
    };

    const validateForm = () => {
        const errors = {};
        const requiredFields = ['name', 'phone', 'specialization'];

        requiredFields.forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) {
                errors[field] = error;
            }
        });

        const optionalFields = ['email', 'cnic', 'date_of_birth', 'qualification', 'experience',
            'license_number', 'pmdc_number', 'salary', 'emergency_phone', 'username', 'password', 'confirm_password'];

        optionalFields.forEach(field => {
            if (formData[field]) {
                const error = validateField(field, formData[field]);
                if (error) {
                    errors[field] = error;
                }
            }
        });

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // ===== SCHEDULE FUNCTIONS - IMPROVED =====

    // Add slot for modal (Add/Edit)
    const addModalScheduleSlot = () => {
        const { day, start, end } = newSlotTime;
        const cleanStart = start.trim();
        const cleanEnd = end.trim();

        if (!cleanStart || !cleanEnd) {
            alert('⚠️ Please enter both start and end time');
            return;
        }

        if (!validateTimeFormat(cleanStart)) {
            alert('⚠️ Please enter valid start time (e.g., 09:00 AM, 2:30 PM)');
            return;
        }
        if (!validateTimeFormat(cleanEnd)) {
            alert('⚠️ Please enter valid end time (e.g., 05:00 PM, 6:30 PM)');
            return;
        }

        const timeSlot = `${cleanStart} - ${cleanEnd}`;
        const currentSlots = modalSchedule[day] || [];

        if (currentSlots.includes(timeSlot)) {
            alert('⚠️ This time slot is already added for ' + day);
            return;
        }

        const startNum = getTimeNumber(cleanStart);
        const endNum = getTimeNumber(cleanEnd);

        if (startNum >= endNum) {
            alert('⚠️ Start time must be before end time.');
            return;
        }

        setModalSchedule(prev => ({
            ...prev,
            [day]: [...currentSlots, timeSlot]
        }));

        setNewSlotTime(prev => ({
            ...prev,
            start: '',
            end: ''
        }));
    };

    const removeModalScheduleSlot = (day, slotToRemove) => {
        setModalSchedule(prev => ({
            ...prev,
            [day]: (prev[day] || []).filter(slot => slot !== slotToRemove)
        }));
    };

    // Add slot for schedule modal
    const addScheduleSlot = () => {
        const { day, start, end } = newSlotTime;
        const cleanStart = start.trim();
        const cleanEnd = end.trim();

        if (!cleanStart || !cleanEnd) {
            alert('⚠️ Please enter both start and end time');
            return;
        }

        if (!validateTimeFormat(cleanStart)) {
            alert('⚠️ Please enter valid start time (e.g., 09:00 AM, 2:30 PM)');
            return;
        }
        if (!validateTimeFormat(cleanEnd)) {
            alert('⚠️ Please enter valid end time (e.g., 05:00 PM, 6:30 PM)');
            return;
        }

        const timeSlot = `${cleanStart} - ${cleanEnd}`;
        const currentSlots = scheduleState[day] || [];

        if (currentSlots.includes(timeSlot)) {
            alert('⚠️ This time slot is already added for ' + day);
            return;
        }

        const startNum = getTimeNumber(cleanStart);
        const endNum = getTimeNumber(cleanEnd);

        if (startNum >= endNum) {
            alert('⚠️ Start time must be before end time.');
            return;
        }

        setScheduleState(prev => ({
            ...prev,
            [day]: [...currentSlots, timeSlot]
        }));

        setNewSlotTime(prev => ({
            ...prev,
            start: '',
            end: ''
        }));
    };

    const removeScheduleSlot = (day, slotToRemove) => {
        setScheduleState(prev => ({
            ...prev,
            [day]: (prev[day] || []).filter(slot => slot !== slotToRemove)
        }));
    };

    // Add slot for view modal
    const addViewScheduleSlot = () => {
        const { day, start, end } = viewNewSlot;
        const cleanStart = start.trim();
        const cleanEnd = end.trim();

        if (!cleanStart || !cleanEnd) {
            alert('⚠️ Please enter both start and end time');
            return;
        }

        if (!validateTimeFormat(cleanStart)) {
            alert('⚠️ Please enter valid start time (e.g., 09:00 AM, 2:30 PM)');
            return;
        }
        if (!validateTimeFormat(cleanEnd)) {
            alert('⚠️ Please enter valid end time (e.g., 05:00 PM, 6:30 PM)');
            return;
        }

        const timeSlot = `${cleanStart} - ${cleanEnd}`;
        const currentSlots = viewSchedule[day] || [];

        if (currentSlots.includes(timeSlot)) {
            alert('⚠️ This time slot is already added for ' + day);
            return;
        }

        const startNum = getTimeNumber(cleanStart);
        const endNum = getTimeNumber(cleanEnd);

        if (startNum >= endNum) {
            alert('⚠️ Start time must be before end time.');
            return;
        }

        setViewSchedule(prev => ({
            ...prev,
            [day]: [...currentSlots, timeSlot]
        }));

        setViewNewSlot(prev => ({
            ...prev,
            start: '',
            end: ''
        }));
    };

    const removeViewScheduleSlot = (day, slotToRemove) => {
        setViewSchedule(prev => ({
            ...prev,
            [day]: (prev[day] || []).filter(slot => slot !== slotToRemove)
        }));
    };

    // Add slot for card
    const addCardScheduleSlot = () => {
        const { day, start, end } = cardNewSlot;
        const cleanStart = start.trim();
        const cleanEnd = end.trim();

        if (!cleanStart || !cleanEnd) {
            alert('⚠️ Please enter both start and end time');
            return;
        }

        if (!validateTimeFormat(cleanStart)) {
            alert('⚠️ Please enter valid start time (e.g., 09:00 AM, 2:30 PM)');
            return;
        }
        if (!validateTimeFormat(cleanEnd)) {
            alert('⚠️ Please enter valid end time (e.g., 05:00 PM, 6:30 PM)');
            return;
        }

        const timeSlot = `${cleanStart} - ${cleanEnd}`;
        const currentSlots = cardSchedule[day] || [];

        if (currentSlots.includes(timeSlot)) {
            alert('⚠️ This time slot is already added for ' + day);
            return;
        }

        const startNum = getTimeNumber(cleanStart);
        const endNum = getTimeNumber(cleanEnd);

        if (startNum >= endNum) {
            alert('⚠️ Start time must be before end time.');
            return;
        }

        setCardSchedule(prev => ({
            ...prev,
            [day]: [...currentSlots, timeSlot]
        }));

        setCardNewSlot(prev => ({
            ...prev,
            start: '',
            end: ''
        }));
    };

    const removeCardScheduleSlot = (day, slotToRemove) => {
        setCardSchedule(prev => ({
            ...prev,
            [day]: (prev[day] || []).filter(slot => slot !== slotToRemove)
        }));
    };

    // ===== SAVE SCHEDULES =====
    const saveViewSchedule = async () => {
        setActionLoading(true);
        try {
            const scheduleToSave = { ...viewSchedule };
            weekDays.forEach(day => {
                if (!scheduleToSave[day]) {
                    scheduleToSave[day] = [];
                }
            });

            const { error } = await supabase
                .from('doctors')
                .update({
                    weekly_schedule: scheduleToSave,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedDoctor.id);

            if (error) throw error;

            setViewIsEditing(false);
            await loadDoctors();
            window.dispatchEvent(new Event('doctorChanged'));
            window.dispatchEvent(new Event('staffChanged'));
            setSuccessMsg('✅ Schedule updated successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            alert('Failed to save schedule: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const saveSchedule = async () => {
        setActionLoading(true);
        try {
            const scheduleToSave = { ...scheduleState };
            weekDays.forEach(day => {
                if (!scheduleToSave[day]) {
                    scheduleToSave[day] = [];
                }
            });

            const { error } = await supabase
                .from('doctors')
                .update({
                    weekly_schedule: scheduleToSave,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedDoctor.id);

            if (error) throw error;

            setIsScheduleOpen(false);
            await loadDoctors();
            window.dispatchEvent(new Event('doctorChanged'));
            window.dispatchEvent(new Event('staffChanged'));
            setSuccessMsg('✅ Schedule saved successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            alert('Failed to save schedule: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const saveCardSchedule = async (doctorId) => {
        setActionLoading(true);
        try {
            const scheduleToSave = { ...cardSchedule };
            weekDays.forEach(day => {
                if (!scheduleToSave[day]) {
                    scheduleToSave[day] = [];
                }
            });

            const { error } = await supabase
                .from('doctors')
                .update({
                    weekly_schedule: scheduleToSave,
                    updated_at: new Date().toISOString()
                })
                .eq('id', doctorId);

            if (error) throw error;

            setEditingCardId(null);
            await loadDoctors();
            window.dispatchEvent(new Event('doctorChanged'));
            window.dispatchEvent(new Event('staffChanged'));
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
            cnic: '',
            date_of_birth: '',
            gender: '',
            blood_group: '',
            religion: '',
            nationality: '',
            specialization: '',
            qualification: '',
            experience: '',
            license_number: '',
            pmdc_number: '',
            council_registration: '',
            practicing_since: '',
            department: 'Medical',
            designation: '',
            employment_type: 'Full-time',
            joining_date: '',
            salary: '',
            shift: 'Morning',
            employee_id: '',
            address: '',
            city: '',
            state: '',
            country: '',
            zip_code: '',
            emergency_contact: '',
            emergency_phone: '',
            availability: 'Available',
            weekly_schedule: defaultSchedule,
            bio: '',
            languages: [],
            special_interests: [],
            awards: [],
            publications: [],
            certifications: [],
            social_media: {
                facebook: '',
                twitter: '',
                linkedin: '',
                instagram: '',
                youtube: ''
            },
            username: '',
            password: '',
            confirm_password: '',
            role: 'Doctor',
            permissions: [],
            status: 'Active',
            backup_contact: '',
            backup_phone: '',
            preferred_contact_method: 'phone',
            notes: ''
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
            cnic: doctor.cnic || '',
            date_of_birth: doctor.date_of_birth || '',
            gender: doctor.gender || '',
            blood_group: doctor.blood_group || '',
            religion: doctor.religion || '',
            nationality: doctor.nationality || '',
            specialization: doctor.specialization || '',
            qualification: doctor.qualification || '',
            experience: doctor.experience || '',
            license_number: doctor.license_number || '',
            pmdc_number: doctor.pmdc_number || '',
            council_registration: doctor.council_registration || '',
            practicing_since: doctor.practicing_since || '',
            department: doctor.department || 'Medical',
            designation: doctor.designation || '',
            employment_type: doctor.employment_type || 'Full-time',
            joining_date: doctor.joining_date || '',
            salary: doctor.salary || '',
            shift: doctor.shift || 'Morning',
            employee_id: doctor.employee_id || '',
            address: doctor.address || '',
            city: doctor.city || '',
            state: doctor.state || '',
            country: doctor.country || '',
            zip_code: doctor.zip_code || '',
            emergency_contact: doctor.emergency_contact || '',
            emergency_phone: doctor.emergency_phone || '',
            availability: doctor.availability || 'Available',
            weekly_schedule: schedule,
            bio: doctor.bio || '',
            languages: doctor.languages || [],
            special_interests: doctor.special_interests || [],
            awards: doctor.awards || [],
            publications: doctor.publications || [],
            certifications: doctor.certifications || [],
            social_media: doctor.social_media || {
                facebook: '', twitter: '', linkedin: '', instagram: '', youtube: ''
            },
            username: doctor.username || '',
            password: '',
            confirm_password: '',
            role: doctor.role || 'Doctor',
            permissions: doctor.permissions || [],
            status: doctor.status || 'Active',
            backup_contact: doctor.backup_contact || '',
            backup_phone: doctor.backup_phone || '',
            preferred_contact_method: doctor.preferred_contact_method || 'phone',
            notes: doctor.notes || ''
        });
        setModalSchedule(JSON.parse(JSON.stringify(schedule)));
        setNewSlotTime({ day: 'Monday', start: '09:00 AM', end: '05:00 PM' });
        setFormErrors({});
        setErrorMsg('');
        setSuccessMsg('');
        setIsEditOpen(true);
    };

    const openViewModal = (doctor) => {
        if (!doctor) {
            console.error('No doctor selected for view');
            return;
        }

        setSelectedDoctor(doctor);

        const schedule = doctor.weekly_schedule || {
            Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
        };

        weekDays.forEach(day => {
            if (!schedule[day]) {
                schedule[day] = [];
            }
        });

        setViewSchedule(JSON.parse(JSON.stringify(schedule)));
        setViewNewSlot({ day: 'Monday', start: '09:00 AM', end: '05:00 PM' });
        setViewIsEditing(false);
        setIsViewOpen(true);
    };

    const openScheduleModal = (doctor) => {
        setSelectedDoctor(doctor);
        const schedule = doctor.weekly_schedule || {
            Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
        };
        setScheduleState(JSON.parse(JSON.stringify(schedule)));
        setNewSlotTime({ day: 'Monday', start: '09:00 AM', end: '05:00 PM' });
        setIsScheduleOpen(true);
    };

    const openDeleteModal = (doctor) => {
        setSelectedDoctor(doctor);
        setIsDeleteOpen(true);
    };

    // ===== START CARD SCHEDULE EDIT =====
    const startEditingCardSchedule = (doctor) => {
        setEditingCardId(doctor.id);
        const schedule = doctor.weekly_schedule || {
            Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
        };
        setCardSchedule(schedule);
        setCardNewSlot({ day: 'Monday', start: '09:00 AM', end: '05:00 PM' });
    };

    // ===== ADD DOCTOR =====
    const handleAddSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            setErrorMsg('Please fix all validation errors before submitting.');
            return;
        }

        setActionLoading(true);
        setErrorMsg('');
        try {
            const scheduleToSave = { ...modalSchedule };
            weekDays.forEach(day => {
                if (!scheduleToSave[day]) {
                    scheduleToSave[day] = [];
                }
            });

            const finalData = {
                name: formData.name.trim(),
                email: formData.email ? formData.email.trim() : null,
                phone: formData.phone.trim(),
                cnic: formData.cnic ? formData.cnic.trim() : null,
                date_of_birth: formData.date_of_birth || null,
                gender: formData.gender || null,
                blood_group: formData.blood_group || null,
                religion: formData.religion || null,
                nationality: formData.nationality || null,
                specialization: formData.specialization.trim(),
                qualification: formData.qualification ? formData.qualification.trim() : null,
                experience: formData.experience ? formData.experience.trim() : null,
                license_number: formData.license_number ? formData.license_number.trim() : null,
                pmdc_number: formData.pmdc_number ? formData.pmdc_number.trim() : null,
                council_registration: formData.council_registration ? formData.council_registration.trim() : null,
                practicing_since: formData.practicing_since || null,
                department: formData.department || 'Medical',
                designation: formData.designation || null,
                employment_type: formData.employment_type || 'Full-time',
                joining_date: formData.joining_date || null,
                salary: formData.salary ? formData.salary.replace(/,/g, '') : null,
                shift: formData.shift || 'Morning',
                employee_id: formData.employee_id || null,
                address: formData.address ? formData.address.trim() : null,
                city: formData.city || null,
                state: formData.state || null,
                country: formData.country || null,
                zip_code: formData.zip_code || null,
                emergency_contact: formData.emergency_contact || null,
                emergency_phone: formData.emergency_phone || null,
                availability: formData.availability || 'Available',
                weekly_schedule: scheduleToSave,
                bio: formData.bio || null,
                languages: formData.languages || [],
                special_interests: formData.special_interests || [],
                awards: formData.awards || [],
                publications: formData.publications || [],
                certifications: formData.certifications || [],
                social_media: formData.social_media || {},
                username: formData.username || null,
                role: 'Doctor',
                status: formData.status || 'Active',
                backup_contact: formData.backup_contact || null,
                backup_phone: formData.backup_phone || null,
                preferred_contact_method: formData.preferred_contact_method || 'phone',
                notes: formData.notes || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data: doctorData, error: doctorError } = await supabase
                .from('doctors')
                .insert([finalData])
                .select();

            if (doctorError) {
                console.error('❌ Doctor Insert Error:', doctorError);
                setErrorMsg(doctorError.message || 'Failed to add doctor.');
                setActionLoading(false);
                return;
            }

            const staffData = {
                name: formData.name.trim(),
                email: formData.email ? formData.email.trim() : null,
                phone: formData.phone.trim(),
                cnic: formData.cnic ? formData.cnic.trim() : null,
                role: 'Doctor',
                department: formData.department || 'Medical',
                specialization: formData.specialization.trim(),
                qualification: formData.qualification ? formData.qualification.trim() : null,
                experience: formData.experience ? formData.experience.trim() : null,
                license_number: formData.license_number ? formData.license_number.trim() : null,
                address: formData.address ? formData.address.trim() : null,
                status: formData.availability === 'Available' ? 'Active' :
                    formData.availability === 'Unavailable' ? 'Inactive' : 'On Leave',
                username: formData.username || (formData.email ? formData.email.split('@')[0] : formData.name.toLowerCase().replace(/\s/g, '.')),
                password: formData.password || 'Doctor@123',
                joining_date: formData.joining_date || new Date().toISOString().split('T')[0],
                shift: formData.shift || 'Morning',
                salary: formData.salary ? formData.salary.replace(/,/g, '') : null,
                gender: formData.gender || null,
                date_of_birth: formData.date_of_birth || null,
                blood_group: formData.blood_group || null,
                emergency_contact: formData.emergency_contact || null,
                emergency_phone: formData.emergency_phone || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { error: staffError } = await supabase
                .from('staff')
                .insert([staffData]);

            if (staffError) {
                console.error('❌ Staff Insert Error:', staffError);
                const minimalStaffData = {
                    name: formData.name.trim(),
                    email: formData.email ? formData.email.trim() : null,
                    phone: formData.phone.trim(),
                    role: 'Doctor',
                    department: formData.department || 'Medical',
                    specialization: formData.specialization.trim(),
                    status: formData.availability === 'Available' ? 'Active' :
                        formData.availability === 'Unavailable' ? 'Inactive' : 'On Leave',
                    username: formData.username || (formData.email ? formData.email.split('@')[0] : formData.name.toLowerCase().replace(/\s/g, '.')),
                    password: 'Doctor@123',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                const { error: retryError } = await supabase
                    .from('staff')
                    .insert([minimalStaffData]);

                if (retryError) {
                    console.error('❌ Staff Insert Retry Error:', retryError);
                    setErrorMsg('Doctor added but failed to add to staff. Please refresh.');
                } else {
                    console.log('✅ Staff added with minimal data');
                }
            } else {
                console.log('✅ Staff added successfully!');
            }

            setIsAddOpen(false);
            await loadDoctors();
            window.dispatchEvent(new Event('doctorChanged'));
            window.dispatchEvent(new Event('staffChanged'));
            setSuccessMsg('✅ Doctor added successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            console.error('❌ Error adding doctor:', err);
            setErrorMsg(err.message || 'Failed to add doctor.');
        } finally {
            setActionLoading(false);
        }
    };

    // ===== EDIT DOCTOR =====
    const handleEditSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            setErrorMsg('Please fix all validation errors before submitting.');
            return;
        }

        setActionLoading(true);
        setErrorMsg('');
        try {
            const scheduleToSave = { ...modalSchedule };
            weekDays.forEach(day => {
                if (!scheduleToSave[day]) {
                    scheduleToSave[day] = [];
                }
            });

            const finalData = {
                name: formData.name.trim(),
                email: formData.email ? formData.email.trim() : null,
                phone: formData.phone.trim(),
                cnic: formData.cnic ? formData.cnic.trim() : null,
                date_of_birth: formData.date_of_birth || null,
                gender: formData.gender || null,
                blood_group: formData.blood_group || null,
                religion: formData.religion || null,
                nationality: formData.nationality || null,
                specialization: formData.specialization.trim(),
                qualification: formData.qualification ? formData.qualification.trim() : null,
                experience: formData.experience ? formData.experience.trim() : null,
                license_number: formData.license_number ? formData.license_number.trim() : null,
                pmdc_number: formData.pmdc_number ? formData.pmdc_number.trim() : null,
                council_registration: formData.council_registration ? formData.council_registration.trim() : null,
                practicing_since: formData.practicing_since || null,
                department: formData.department || 'Medical',
                designation: formData.designation || null,
                employment_type: formData.employment_type || 'Full-time',
                joining_date: formData.joining_date || null,
                salary: formData.salary ? formData.salary.replace(/,/g, '') : null,
                shift: formData.shift || 'Morning',
                employee_id: formData.employee_id || null,
                address: formData.address ? formData.address.trim() : null,
                city: formData.city || null,
                state: formData.state || null,
                country: formData.country || null,
                zip_code: formData.zip_code || null,
                emergency_contact: formData.emergency_contact || null,
                emergency_phone: formData.emergency_phone || null,
                availability: formData.availability || 'Available',
                weekly_schedule: scheduleToSave,
                bio: formData.bio || null,
                languages: formData.languages || [],
                special_interests: formData.special_interests || [],
                awards: formData.awards || [],
                publications: formData.publications || [],
                certifications: formData.certifications || [],
                social_media: formData.social_media || {},
                username: formData.username || null,
                status: formData.status || 'Active',
                backup_contact: formData.backup_contact || null,
                backup_phone: formData.backup_phone || null,
                preferred_contact_method: formData.preferred_contact_method || 'phone',
                notes: formData.notes || null,
                updated_at: new Date().toISOString()
            };

            const { error: doctorError } = await supabase
                .from('doctors')
                .update(finalData)
                .eq('id', selectedDoctor.id);

            if (doctorError) {
                console.error('❌ Doctor Update Error:', doctorError);
                setErrorMsg(doctorError.message || 'Failed to update doctor.');
                setActionLoading(false);
                return;
            }

            const staffUpdateData = {
                name: formData.name.trim(),
                email: formData.email ? formData.email.trim() : null,
                phone: formData.phone.trim(),
                cnic: formData.cnic ? formData.cnic.trim() : null,
                department: formData.department || 'Medical',
                specialization: formData.specialization.trim(),
                qualification: formData.qualification ? formData.qualification.trim() : null,
                experience: formData.experience ? formData.experience.trim() : null,
                license_number: formData.license_number ? formData.license_number.trim() : null,
                address: formData.address ? formData.address.trim() : null,
                status: formData.availability === 'Available' ? 'Active' :
                    formData.availability === 'Unavailable' ? 'Inactive' : 'On Leave',
                salary: formData.salary ? formData.salary.replace(/,/g, '') : null,
                gender: formData.gender || null,
                date_of_birth: formData.date_of_birth || null,
                blood_group: formData.blood_group || null,
                emergency_contact: formData.emergency_contact || null,
                emergency_phone: formData.emergency_phone || null,
                shift: formData.shift || 'Morning',
                joining_date: formData.joining_date || null,
                updated_at: new Date().toISOString()
            };

            const { error: staffError } = await supabase
                .from('staff')
                .update(staffUpdateData)
                .eq('name', selectedDoctor.name)
                .eq('role', 'Doctor');

            if (staffError) {
                console.warn('⚠️ Staff update warning:', staffError);
            }

            setIsEditOpen(false);
            await loadDoctors();
            window.dispatchEvent(new Event('doctorChanged'));
            window.dispatchEvent(new Event('staffChanged'));
            setSuccessMsg('✅ Doctor updated successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            console.error('❌ Error updating doctor:', err);
            setErrorMsg(err.message || 'Failed to update doctor.');
        } finally {
            setActionLoading(false);
        }
    };

    // ===== TOGGLE AVAILABILITY =====
    const handleAvailabilityChange = async (doctor, newStatus) => {
        try {
            const { error: doctorError } = await supabase
                .from('doctors')
                .update({
                    availability: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', doctor.id);

            if (doctorError) throw doctorError;

            const staffStatus = newStatus === 'Available' ? 'Active' :
                newStatus === 'Unavailable' ? 'Inactive' : 'On Leave';

            await supabase
                .from('staff')
                .update({
                    status: staffStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('name', doctor.name)
                .eq('role', 'Doctor');

            setDoctors(prev =>
                prev.map(d => (d.id === doctor.id ? { ...d, availability: newStatus } : d))
            );
            window.dispatchEvent(new Event('doctorChanged'));
            window.dispatchEvent(new Event('staffChanged'));
        } catch (err) {
            alert('Failed to change availability: ' + err.message);
        }
    };

    // ===== DELETE DOCTOR =====
    const handleDeleteSubmit = async () => {
        setActionLoading(true);
        try {
            const { error: doctorError } = await supabase
                .from('doctors')
                .delete()
                .eq('id', selectedDoctor.id);

            if (doctorError) {
                console.error('❌ Delete Doctor Error:', doctorError);
                setErrorMsg(doctorError.message || 'Failed to delete doctor.');
                setActionLoading(false);
                return;
            }

            await supabase
                .from('staff')
                .delete()
                .eq('name', selectedDoctor.name)
                .eq('role', 'Doctor');

            setIsDeleteOpen(false);
            await loadDoctors();
            window.dispatchEvent(new Event('doctorChanged'));
            window.dispatchEvent(new Event('staffChanged'));
            setSuccessMsg('✅ Doctor deleted successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            console.error('❌ Error deleting doctor:', err);
            setErrorMsg(err.message || 'Failed to delete doctor.');
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
                {availability || 'Available'}
            </span>
        );
    };

    // ===== RENDER SCHEDULE UI =====
    const renderScheduleUI = (schedule, onAdd, onRemove, addSlotState, setAddSlotState, isCard = false) => {
        const safeSchedule = schedule || {};

        weekDays.forEach(day => {
            if (!safeSchedule[day]) {
                safeSchedule[day] = [];
            }
        });

        return (
            <div>
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    alignItems: 'flex-end',
                    padding: '12px',
                    background: 'var(--bg-primary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    marginBottom: '12px'
                }}>
                    <div className="form-group" style={{ margin: 0, flex: '1 1 100px' }}>
                        <label className="form-label" style={{ fontSize: '0.65rem', fontWeight: 600 }}>Day</label>
                        <select
                            className="hms-select"
                            value={addSlotState?.day || 'Monday'}
                            onChange={(e) => setAddSlotState(prev => ({ ...prev, day: e.target.value }))}
                            style={{ height: '32px', padding: '0 8px', fontSize: '0.7rem', width: '100%' }}
                        >
                            {weekDays.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ margin: 0, flex: '1 1 120px' }}>
                        <label className="form-label" style={{ fontSize: '0.65rem', fontWeight: 600 }}>Start Time</label>
                        <input
                            type="text"
                            placeholder="e.g. 09:00 AM"
                            value={addSlotState?.start || ''}
                            onChange={(e) => setAddSlotState(prev => ({ ...prev, start: e.target.value }))}
                            style={{
                                height: '32px',
                                padding: '0 8px',
                                fontSize: '0.7rem',
                                width: '100%',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                background: 'var(--card-bg)',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                fontFamily: 'var(--font-family)'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                        />
                        <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Format: 09:00 AM, 2:30 PM
                        </div>
                    </div>
                    <div className="form-group" style={{ margin: 0, flex: '1 1 120px' }}>
                        <label className="form-label" style={{ fontSize: '0.65rem', fontWeight: 600 }}>End Time</label>
                        <input
                            type="text"
                            placeholder="e.g. 05:00 PM"
                            value={addSlotState?.end || ''}
                            onChange={(e) => setAddSlotState(prev => ({ ...prev, end: e.target.value }))}
                            style={{
                                height: '32px',
                                padding: '0 8px',
                                fontSize: '0.7rem',
                                width: '100%',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                background: 'var(--card-bg)',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                fontFamily: 'var(--font-family)'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                        />
                        <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Format: 05:00 PM, 6:30 PM
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onAdd}
                        style={{
                            padding: '4px 16px',
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
                        <Plus size={12} /> Add Slot
                    </button>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isCard ? '1fr 1fr' : 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '8px'
                }}>
                    {weekDays.map((day) => {
                        const slots = safeSchedule[day] || [];
                        return (
                            <div key={day} style={{
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                padding: '6px 8px',
                                minHeight: '60px'
                            }}>
                                <div style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    marginBottom: '4px',
                                    paddingBottom: '3px',
                                    borderBottom: '1px solid var(--border-color)',
                                    textAlign: 'center'
                                }}>{day}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    {slots.length === 0 ? (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontStyle: 'italic', textAlign: 'center' }}>No slots</span>
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

                <div style={{
                    fontSize: '0.6rem',
                    color: 'var(--text-muted)',
                    marginTop: '8px',
                    textAlign: 'center',
                    fontStyle: 'italic'
                }}>
                    💡 Enter any time (e.g., 09:00 AM, 2:30 PM, 10:45 AM)
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

    // ===== RENDER INPUT FIELD =====
    const renderDoctorInput = (name, label, type = 'text', placeholder = '', required = false, options = null, icon = null) => {
        const hasError = formErrors[name];
        const value = formData[name] || '';

        if (type === 'select' && options) {
            return (
                <div className="form-group" key={name} style={{ marginBottom: '14px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        marginBottom: '4px'
                    }}>
                        {icon && <span style={{ marginRight: '4px' }}>{icon}</span>}
                        {label} {required && <span style={{ color: 'var(--danger-color)' }}>*</span>}
                    </label>
                    <select
                        name={name}
                        value={value}
                        onChange={handleInputChange}
                        style={{
                            width: '100%',
                            height: '40px',
                            padding: '0 12px',
                            border: hasError ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            fontFamily: 'var(--font-family)',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            transition: 'all 0.2s ease',
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
                        <option value="">Select {label}</option>
                        {options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                    {hasError && (
                        <div style={{
                            fontSize: '0.7rem',
                            color: 'var(--danger-color)',
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <AlertCircle size={12} />
                            {formErrors[name]}
                        </div>
                    )}
                </div>
            );
        }

        if (type === 'textarea') {
            return (
                <div className="form-group" key={name} style={{ marginBottom: '14px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        marginBottom: '4px'
                    }}>
                        {icon && <span style={{ marginRight: '4px' }}>{icon}</span>}
                        {label} {required && <span style={{ color: 'var(--danger-color)' }}>*</span>}
                    </label>
                    <textarea
                        name={name}
                        value={value}
                        onChange={handleInputChange}
                        placeholder={placeholder}
                        rows={3}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: hasError ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            fontFamily: 'var(--font-family)',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            transition: 'all 0.2s ease',
                            resize: 'vertical',
                            minHeight: '80px',
                            boxSizing: 'border-box'
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
                    {hasError && (
                        <div style={{
                            fontSize: '0.7rem',
                            color: 'var(--danger-color)',
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <AlertCircle size={12} />
                            {formErrors[name]}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="form-group" key={name} style={{ marginBottom: '14px' }}>
                <label style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    marginBottom: '4px'
                }}>
                    {icon && <span style={{ marginRight: '4px' }}>{icon}</span>}
                    {label} {required && <span style={{ color: 'var(--danger-color)' }}>*</span>}
                </label>
                <input
                    name={name}
                    type={type}
                    value={value}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    style={{
                        width: '100%',
                        height: '40px',
                        padding: '0 12px',
                        border: hasError ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontFamily: 'var(--font-family)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        boxSizing: 'border-box'
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
                {hasError && (
                    <div style={{
                        fontSize: '0.7rem',
                        color: 'var(--danger-color)',
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <AlertCircle size={12} />
                        {formErrors[name]}
                    </div>
                )}
            </div>
        );
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
                        {uniqueSpecializations.map(s => (
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
                        const avatarInitial = doctor.name ? doctor.name.replace('Dr. ', '').charAt(0).toUpperCase() : 'D';
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
                                            {doctor.name || 'N/A'}
                                        </h4>
                                        <p style={{ color: 'var(--primary-color)', fontSize: '0.75rem', fontWeight: 500, margin: 0 }}>
                                            {doctor.specialization || 'N/A'}
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
                                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{doctor.phone || 'N/A'}</span>
                                    </div>
                                    {doctor.qualification && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Qualification:</span>
                                            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{doctor.qualification}</span>
                                        </div>
                                    )}
                                    {doctor.experience && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Experience:</span>
                                            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{doctor.experience} years</span>
                                        </div>
                                    )}
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
                                        value={doctor.availability || 'Available'}
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

            {/* ===== VIEW DOCTOR MODAL ===== */}
            {isViewOpen && selectedDoctor && (
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
                                    e.currentTarget.style.background = 'var(--hover-bg)';
                                    e.currentTarget.style.color = 'var(--danger-color)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="hms-modal-body" style={{
                            padding: '20px',
                            overflowY: 'auto',
                            flex: 1,
                            background: 'var(--bg-primary)'
                        }}>
                            {/* Doctor Header */}
                            <div style={{
                                textAlign: 'center',
                                marginBottom: '20px',
                                padding: '16px',
                                background: 'var(--card-bg)',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{
                                    margin: '0 auto',
                                    width: '72px',
                                    height: '72px',
                                    fontSize: '1.8rem',
                                    background: 'linear-gradient(135deg, var(--primary-color), #7C3AED)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 600
                                }}>
                                    {selectedDoctor.name ? selectedDoctor.name.replace('Dr. ', '').charAt(0).toUpperCase() : 'D'}
                                </div>
                                <h3 style={{
                                    fontSize: '1.2rem',
                                    fontWeight: 600,
                                    marginTop: '10px',
                                    marginBottom: '2px',
                                    color: 'var(--text-primary)'
                                }}>
                                    {selectedDoctor.name || 'N/A'}
                                </h3>
                                <p style={{
                                    color: 'var(--primary-color)',
                                    fontSize: '0.9rem',
                                    fontWeight: 500,
                                    margin: '2px 0'
                                }}>
                                    {selectedDoctor.specialization || 'N/A'}
                                </p>
                                <div style={{ marginTop: '6px', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    {getAvailabilityBadge(selectedDoctor.availability)}
                                </div>
                            </div>

                            {/* Quick Info */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr 1fr',
                                gap: '10px',
                                marginBottom: '16px'
                            }}>
                                <div style={{
                                    padding: '10px 12px',
                                    background: 'var(--card-bg)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Email</div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                                        {selectedDoctor.email || 'N/A'}
                                    </div>
                                </div>
                                <div style={{
                                    padding: '10px 12px',
                                    background: 'var(--card-bg)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Phone</div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                        {selectedDoctor.phone || 'N/A'}
                                    </div>
                                </div>
                                <div style={{
                                    padding: '10px 12px',
                                    background: 'var(--card-bg)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Department</div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                        {selectedDoctor.department || 'N/A'}
                                    </div>
                                </div>
                            </div>

                            {/* Personal Info */}
                            <div style={{
                                background: 'var(--card-bg)',
                                borderRadius: '10px',
                                padding: '14px',
                                border: '1px solid var(--border-color)',
                                marginBottom: '12px'
                            }}>
                                <h4 style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    margin: '0 0 10px 0',
                                    color: 'var(--text-primary)',
                                    borderBottom: '1px solid var(--border-color)',
                                    paddingBottom: '8px'
                                }}>
                                    Personal Information
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                    <div><span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>CNIC</span><div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{selectedDoctor.cnic || 'N/A'}</div></div>
                                    <div><span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>DOB</span><div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{selectedDoctor.date_of_birth ? new Date(selectedDoctor.date_of_birth).toLocaleDateString() : 'N/A'}</div></div>
                                    <div><span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Gender</span><div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{selectedDoctor.gender || 'N/A'}</div></div>
                                    <div><span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Blood Group</span><div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{selectedDoctor.blood_group || 'N/A'}</div></div>
                                </div>
                            </div>

                            {/* Professional Info */}
                            <div style={{
                                background: 'var(--card-bg)',
                                borderRadius: '10px',
                                padding: '14px',
                                border: '1px solid var(--border-color)',
                                marginBottom: '12px'
                            }}>
                                <h4 style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    margin: '0 0 10px 0',
                                    color: 'var(--text-primary)',
                                    borderBottom: '1px solid var(--border-color)',
                                    paddingBottom: '8px'
                                }}>
                                    Professional Information
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                    <div><span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Qualification</span><div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{selectedDoctor.qualification || 'N/A'}</div></div>
                                    <div><span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Experience</span><div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{selectedDoctor.experience ? `${selectedDoctor.experience} years` : 'N/A'}</div></div>
                                    <div><span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>License</span><div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{selectedDoctor.license_number || 'N/A'}</div></div>
                                    <div><span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>PMDC</span><div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{selectedDoctor.pmdc_number || 'N/A'}</div></div>
                                </div>
                            </div>

                            {/* Employment Info */}
                            <div style={{
                                background: 'var(--card-bg)',
                                borderRadius: '10px',
                                padding: '14px',
                                border: '1px solid var(--border-color)',
                                marginBottom: '12px'
                            }}>
                                <h4 style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    margin: '0 0 10px 0',
                                    color: 'var(--text-primary)',
                                    borderBottom: '1px solid var(--border-color)',
                                    paddingBottom: '8px'
                                }}>
                                    Employment Details
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                    <div><span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Designation</span><div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{selectedDoctor.designation || 'N/A'}</div></div>
                                    <div><span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Employment Type</span><div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{selectedDoctor.employment_type || 'N/A'}</div></div>
                                    <div><span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Joining Date</span><div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{selectedDoctor.joining_date ? new Date(selectedDoctor.joining_date).toLocaleDateString() : 'N/A'}</div></div>
                                    <div><span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Salary</span><div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{selectedDoctor.salary ? `Rs. ${selectedDoctor.salary}` : 'N/A'}</div></div>
                                    <div><span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Shift</span><div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{selectedDoctor.shift || 'N/A'}</div></div>
                                    <div><span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Employee ID</span><div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{selectedDoctor.employee_id || 'N/A'}</div></div>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div style={{
                                background: 'var(--card-bg)',
                                borderRadius: '10px',
                                padding: '14px',
                                border: '1px solid var(--border-color)',
                                marginBottom: '12px'
                            }}>
                                <h4 style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    margin: '0 0 10px 0',
                                    color: 'var(--text-primary)',
                                    borderBottom: '1px solid var(--border-color)',
                                    paddingBottom: '8px'
                                }}>
                                    Contact Information
                                </h4>
                                <div>
                                    <div><span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Address</span><div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{selectedDoctor.address || 'N/A'}</div></div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '4px' }}>
                                        <div><span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>City</span><div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{selectedDoctor.city || 'N/A'}</div></div>
                                        <div><span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>State</span><div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{selectedDoctor.state || 'N/A'}</div></div>
                                        <div><span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Country</span><div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{selectedDoctor.country || 'N/A'}</div></div>
                                        <div><span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>ZIP</span><div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{selectedDoctor.zip_code || 'N/A'}</div></div>
                                    </div>
                                </div>
                            </div>

                            {/* Schedule */}
                            <div style={{
                                background: 'var(--card-bg)',
                                borderRadius: '10px',
                                padding: '14px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <h4 style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    margin: '0 0 10px 0',
                                    color: 'var(--text-primary)',
                                    borderBottom: '1px solid var(--border-color)',
                                    paddingBottom: '8px'
                                }}>
                                    Weekly Schedule
                                </h4>
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
                                                background: 'var(--bg-primary)',
                                                borderRadius: '6px',
                                                border: '1px solid var(--border-color)'
                                            }}>
                                                <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-muted)' }}>{day}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                                                    {slots.length > 0 ? slots.join(', ') : 'Off'}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
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
                            <button
                                onClick={() => setIsViewOpen(false)}
                                style={{
                                    padding: '8px 20px',
                                    border: '1.5px solid var(--border-color)',
                                    borderRadius: '8px',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'var(--text-secondary)',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'var(--hover-bg)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    setIsViewOpen(false);
                                    openEditModal(selectedDoctor);
                                }}
                                style={{
                                    padding: '8px 24px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    background: 'var(--primary-color)',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'white',
                                    fontWeight: 500,
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#1D4ED8';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'var(--primary-color)';
                                }}
                            >
                                <Edit2 size={14} /> Edit Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== ADD DOCTOR MODAL ===== */}
            {isAddOpen && (
                <div className="hms-modal-backdrop" onClick={() => setIsAddOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        maxWidth: '900px',
                        width: '100%'
                    }}>
                        <div className="hms-modal-header" style={{
                            padding: '14px 20px',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexShrink: 0,
                            background: 'var(--bg-primary)'
                        }}>
                            <h3 className="hms-modal-title" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                margin: 0,
                                color: 'var(--text-primary)'
                            }}>
                                <Stethoscope size={20} style={{ color: 'var(--primary-color)' }} />
                                Add New Doctor
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
                            overflowY: 'auto',
                            flex: 1,
                            background: 'var(--bg-primary)'
                        }}>
                            {errorMsg && (
                                <div style={{
                                    padding: '10px 14px',
                                    marginBottom: '16px',
                                    background: '#EF444415',
                                    border: '1px solid #EF444430',
                                    borderRadius: '8px',
                                    color: '#EF4444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '0.85rem'
                                }}>
                                    <AlertCircle size={16} />
                                    {errorMsg}
                                </div>
                            )}

                            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {/* Personal Information */}
                                <div style={{
                                    background: 'var(--card-bg)',
                                    borderRadius: '10px',
                                    padding: '16px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <h4 style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        margin: '0 0 12px 0',
                                        color: 'var(--text-primary)',
                                        borderBottom: '1px solid var(--border-color)',
                                        paddingBottom: '10px'
                                    }}>
                                        <User size={18} style={{ color: 'var(--primary-color)' }} />
                                        Personal Information
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                        {renderDoctorInput('name', 'Full Name', 'text', 'e.g. Dr. Ahmed Khan', true, null, '👤')}
                                        {renderDoctorInput('email', 'Email', 'email', 'e.g. doctor@hospital.com', false, null, '📧')}
                                        {renderDoctorInput('phone', 'Phone Number', 'text', 'e.g. 03001234567', true, null, '📱')}
                                        {renderDoctorInput('cnic', 'CNIC Number', 'text', 'e.g. 12345-1234567-1', false, null, '🆔')}
                                        {renderDoctorInput('date_of_birth', 'Date of Birth', 'date', '', false, null, '🎂')}
                                        {renderDoctorInput('gender', 'Gender', 'select', '', false, genders, '⚥')}
                                        {renderDoctorInput('blood_group', 'Blood Group', 'select', '', false, bloodGroups, '🩸')}
                                        {renderDoctorInput('religion', 'Religion', 'text', 'e.g. Islam', false, null, '🕌')}
                                        {renderDoctorInput('nationality', 'Nationality', 'text', 'e.g. Pakistani', false, null, '🌍')}
                                    </div>
                                </div>

                                {/* Professional Information */}
                                <div style={{
                                    background: 'var(--card-bg)',
                                    borderRadius: '10px',
                                    padding: '16px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <h4 style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        margin: '0 0 12px 0',
                                        color: 'var(--text-primary)',
                                        borderBottom: '1px solid var(--border-color)',
                                        paddingBottom: '10px'
                                    }}>
                                        <Stethoscope size={18} style={{ color: 'var(--secondary-color)' }} />
                                        Professional Information
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                        {renderDoctorInput('specialization', 'Specialization', 'select', '', true, departments, '🏥')}
                                        {renderDoctorInput('qualification', 'Qualification', 'text', 'e.g. MBBS, FCPS', false, null, '🎓')}
                                        {renderDoctorInput('experience', 'Experience (Years)', 'text', 'e.g. 5', false, null, '📅')}
                                        {renderDoctorInput('license_number', 'License Number', 'text', 'e.g. PMC-12345', false, null, '📜')}
                                        {renderDoctorInput('pmdc_number', 'PMDC Number', 'text', 'e.g. PMDC-12345', false, null, '🏛️')}
                                        {renderDoctorInput('council_registration', 'Council Registration', 'text', 'e.g. CPSP-12345', false, null, '📋')}
                                        {renderDoctorInput('practicing_since', 'Practicing Since', 'date', '', false, null, '📆')}
                                    </div>
                                </div>

                                {/* Employment Details */}
                                <div style={{
                                    background: 'var(--card-bg)',
                                    borderRadius: '10px',
                                    padding: '16px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <h4 style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        margin: '0 0 12px 0',
                                        color: 'var(--text-primary)',
                                        borderBottom: '1px solid var(--border-color)',
                                        paddingBottom: '10px'
                                    }}>
                                        <Briefcase size={18} style={{ color: 'var(--warning-color)' }} />
                                        Employment Details
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                        {renderDoctorInput('department', 'Department', 'select', '', true, departments, '🏢')}
                                        {renderDoctorInput('designation', 'Designation', 'text', 'e.g. Senior Consultant', false, null, '👔')}
                                        {renderDoctorInput('employment_type', 'Employment Type', 'select', '', false, employmentTypes, '📋')}
                                        {renderDoctorInput('joining_date', 'Joining Date', 'date', '', false, null, '📆')}
                                        {renderDoctorInput('salary', 'Salary', 'text', 'e.g. 150,000', false, null, '💰')}
                                        {renderDoctorInput('shift', 'Shift', 'select', '', false, shifts, '🕐')}
                                        {renderDoctorInput('employee_id', 'Employee ID', 'text', 'e.g. EMP-001', false, null, '🔢')}
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div style={{
                                    background: 'var(--card-bg)',
                                    borderRadius: '10px',
                                    padding: '16px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <h4 style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        margin: '0 0 12px 0',
                                        color: 'var(--text-primary)',
                                        borderBottom: '1px solid var(--border-color)',
                                        paddingBottom: '10px'
                                    }}>
                                        <MapPin size={18} style={{ color: 'var(--purple-color)' }} />
                                        Contact Information
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                        {renderDoctorInput('address', 'Address', 'textarea', 'e.g. House 45, G-11, Islamabad', false, null, '🏠')}
                                        {renderDoctorInput('city', 'City', 'text', 'e.g. Islamabad', false, null, '🏙️')}
                                        {renderDoctorInput('state', 'State/Province', 'text', 'e.g. Punjab', false, null, '🗺️')}
                                        {renderDoctorInput('country', 'Country', 'text', 'e.g. Pakistan', false, null, '🌎')}
                                        {renderDoctorInput('zip_code', 'ZIP Code', 'text', 'e.g. 44000', false, null, '📮')}
                                        {renderDoctorInput('emergency_contact', 'Emergency Contact Name', 'text', 'e.g. Sara Khan', false, null, '👤')}
                                        {renderDoctorInput('emergency_phone', 'Emergency Phone', 'text', 'e.g. 0300-9876543', false, null, '📞')}
                                    </div>
                                </div>

                                {/* Additional Information */}
                                <div style={{
                                    background: 'var(--card-bg)',
                                    borderRadius: '10px',
                                    padding: '16px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <h4 style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        margin: '0 0 12px 0',
                                        color: 'var(--text-primary)',
                                        borderBottom: '1px solid var(--border-color)',
                                        paddingBottom: '10px'
                                    }}>
                                        <FileText size={18} style={{ color: 'var(--teal-color)' }} />
                                        Additional Information
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                        {renderDoctorInput('bio', 'Bio / About', 'textarea', 'Tell us about yourself...', false, null, '📝')}
                                        {renderDoctorInput('languages', 'Languages', 'select', '', false, languages, '🗣️')}
                                        {renderDoctorInput('status', 'Status', 'select', '', false, ['Active', 'Inactive', 'Suspended'], '🟢')}
                                        {renderDoctorInput('preferred_contact_method', 'Preferred Contact', 'select', '', false, preferredContactMethods, '📱')}
                                        {renderDoctorInput('backup_contact', 'Backup Contact Name', 'text', 'e.g. Ahmed Khan', false, null, '👤')}
                                        {renderDoctorInput('backup_phone', 'Backup Phone', 'text', 'e.g. 0300-9876543', false, null, '📞')}
                                        {renderDoctorInput('notes', 'Notes', 'textarea', 'Additional notes...', false, null, '📝')}
                                    </div>
                                </div>

                                {/* Schedule */}
                                <div style={{
                                    background: 'var(--card-bg)',
                                    borderRadius: '10px',
                                    padding: '16px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <h4 style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        margin: '0 0 12px 0',
                                        color: 'var(--text-primary)',
                                        borderBottom: '1px solid var(--border-color)',
                                        paddingBottom: '10px'
                                    }}>
                                        <Calendar size={18} style={{ color: 'var(--primary-color)' }} />
                                        Weekly Schedule
                                    </h4>
                                    {renderScheduleUI(
                                        modalSchedule,
                                        addModalScheduleSlot,
                                        removeModalScheduleSlot,
                                        newSlotTime,
                                        setNewSlotTime
                                    )}
                                </div>

                                {/* Availability */}
                                <div style={{
                                    background: 'var(--card-bg)',
                                    borderRadius: '10px',
                                    padding: '16px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <h4 style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        margin: '0 0 12px 0',
                                        color: 'var(--text-primary)',
                                        borderBottom: '1px solid var(--border-color)',
                                        paddingBottom: '10px'
                                    }}>
                                        <UserCheck size={18} style={{ color: 'var(--success-color)' }} />
                                        Availability
                                    </h4>
                                    {renderDoctorInput('availability', 'Availability Status', 'select', '', false, ['Available', 'Unavailable', 'On Leave'], '🟢')}
                                </div>

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '10px',
                                    paddingTop: '16px',
                                    borderTop: '1px solid var(--border-color)',
                                    marginTop: '4px'
                                }}>
                                    <button
                                        type="button"
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
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        onClick={handleAddSubmit}
                                        disabled={actionLoading}
                                        style={{
                                            padding: '10px 32px',
                                            border: 'none',
                                            borderRadius: '10px',
                                            background: 'var(--primary-color)',
                                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                                            fontSize: '0.85rem',
                                            fontFamily: 'var(--font-family)',
                                            color: 'white',
                                            fontWeight: 500,
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            opacity: actionLoading ? 0.7 : 1
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!actionLoading) {
                                                e.currentTarget.style.background = '#1D4ED8';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!actionLoading) {
                                                e.currentTarget.style.background = 'var(--primary-color)';
                                            }
                                        }}
                                    >
                                        {actionLoading ? 'Saving...' : 'Add Doctor'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== EDIT DOCTOR MODAL ===== */}
            {isEditOpen && selectedDoctor && (
                <div className="hms-modal-backdrop" onClick={() => setIsEditOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        maxWidth: '900px',
                        width: '100%'
                    }}>
                        <div className="hms-modal-header" style={{
                            padding: '14px 20px',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexShrink: 0,
                            background: 'var(--bg-primary)'
                        }}>
                            <h3 className="hms-modal-title" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                margin: 0,
                                color: 'var(--text-primary)'
                            }}>
                                <Edit2 size={20} style={{ color: 'var(--secondary-color)' }} />
                                Edit Doctor: {selectedDoctor.name}
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
                            overflowY: 'auto',
                            flex: 1,
                            background: 'var(--bg-primary)'
                        }}>
                            {errorMsg && (
                                <div style={{
                                    padding: '10px 14px',
                                    marginBottom: '16px',
                                    background: '#EF444415',
                                    border: '1px solid #EF444430',
                                    borderRadius: '8px',
                                    color: '#EF4444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '0.85rem'
                                }}>
                                    <AlertCircle size={16} />
                                    {errorMsg}
                                </div>
                            )}

                            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {/* Personal Information */}
                                <div style={{
                                    background: 'var(--card-bg)',
                                    borderRadius: '10px',
                                    padding: '16px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <h4 style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        margin: '0 0 12px 0',
                                        color: 'var(--text-primary)',
                                        borderBottom: '1px solid var(--border-color)',
                                        paddingBottom: '10px'
                                    }}>
                                        <User size={18} style={{ color: 'var(--primary-color)' }} />
                                        Personal Information
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                        {renderDoctorInput('name', 'Full Name', 'text', 'e.g. Dr. Ahmed Khan', true, null, '👤')}
                                        {renderDoctorInput('email', 'Email', 'email', 'e.g. doctor@hospital.com', false, null, '📧')}
                                        {renderDoctorInput('phone', 'Phone Number', 'text', 'e.g. 03001234567', true, null, '📱')}
                                        {renderDoctorInput('cnic', 'CNIC Number', 'text', 'e.g. 12345-1234567-1', false, null, '🆔')}
                                        {renderDoctorInput('date_of_birth', 'Date of Birth', 'date', '', false, null, '🎂')}
                                        {renderDoctorInput('gender', 'Gender', 'select', '', false, genders, '⚥')}
                                        {renderDoctorInput('blood_group', 'Blood Group', 'select', '', false, bloodGroups, '🩸')}
                                        {renderDoctorInput('religion', 'Religion', 'text', 'e.g. Islam', false, null, '🕌')}
                                        {renderDoctorInput('nationality', 'Nationality', 'text', 'e.g. Pakistani', false, null, '🌍')}
                                    </div>
                                </div>

                                {/* Professional Information */}
                                <div style={{
                                    background: 'var(--card-bg)',
                                    borderRadius: '10px',
                                    padding: '16px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <h4 style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        margin: '0 0 12px 0',
                                        color: 'var(--text-primary)',
                                        borderBottom: '1px solid var(--border-color)',
                                        paddingBottom: '10px'
                                    }}>
                                        <Stethoscope size={18} style={{ color: 'var(--secondary-color)' }} />
                                        Professional Information
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                        {renderDoctorInput('specialization', 'Specialization', 'select', '', true, departments, '🏥')}
                                        {renderDoctorInput('qualification', 'Qualification', 'text', 'e.g. MBBS, FCPS', false, null, '🎓')}
                                        {renderDoctorInput('experience', 'Experience (Years)', 'text', 'e.g. 5', false, null, '📅')}
                                        {renderDoctorInput('license_number', 'License Number', 'text', 'e.g. PMC-12345', false, null, '📜')}
                                        {renderDoctorInput('pmdc_number', 'PMDC Number', 'text', 'e.g. PMDC-12345', false, null, '🏛️')}
                                        {renderDoctorInput('council_registration', 'Council Registration', 'text', 'e.g. CPSP-12345', false, null, '📋')}
                                        {renderDoctorInput('practicing_since', 'Practicing Since', 'date', '', false, null, '📆')}
                                    </div>
                                </div>

                                {/* Employment Details */}
                                <div style={{
                                    background: 'var(--card-bg)',
                                    borderRadius: '10px',
                                    padding: '16px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <h4 style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        margin: '0 0 12px 0',
                                        color: 'var(--text-primary)',
                                        borderBottom: '1px solid var(--border-color)',
                                        paddingBottom: '10px'
                                    }}>
                                        <Briefcase size={18} style={{ color: 'var(--warning-color)' }} />
                                        Employment Details
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                        {renderDoctorInput('department', 'Department', 'select', '', true, departments, '🏢')}
                                        {renderDoctorInput('designation', 'Designation', 'text', 'e.g. Senior Consultant', false, null, '👔')}
                                        {renderDoctorInput('employment_type', 'Employment Type', 'select', '', false, employmentTypes, '📋')}
                                        {renderDoctorInput('joining_date', 'Joining Date', 'date', '', false, null, '📆')}
                                        {renderDoctorInput('salary', 'Salary', 'text', 'e.g. 150,000', false, null, '💰')}
                                        {renderDoctorInput('shift', 'Shift', 'select', '', false, shifts, '🕐')}
                                        {renderDoctorInput('employee_id', 'Employee ID', 'text', 'e.g. EMP-001', false, null, '🔢')}
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div style={{
                                    background: 'var(--card-bg)',
                                    borderRadius: '10px',
                                    padding: '16px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <h4 style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        margin: '0 0 12px 0',
                                        color: 'var(--text-primary)',
                                        borderBottom: '1px solid var(--border-color)',
                                        paddingBottom: '10px'
                                    }}>
                                        <MapPin size={18} style={{ color: 'var(--purple-color)' }} />
                                        Contact Information
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                        {renderDoctorInput('address', 'Address', 'textarea', 'e.g. House 45, G-11, Islamabad', false, null, '🏠')}
                                        {renderDoctorInput('city', 'City', 'text', 'e.g. Islamabad', false, null, '🏙️')}
                                        {renderDoctorInput('state', 'State/Province', 'text', 'e.g. Punjab', false, null, '🗺️')}
                                        {renderDoctorInput('country', 'Country', 'text', 'e.g. Pakistan', false, null, '🌎')}
                                        {renderDoctorInput('zip_code', 'ZIP Code', 'text', 'e.g. 44000', false, null, '📮')}
                                        {renderDoctorInput('emergency_contact', 'Emergency Contact Name', 'text', 'e.g. Sara Khan', false, null, '👤')}
                                        {renderDoctorInput('emergency_phone', 'Emergency Phone', 'text', 'e.g. 0300-9876543', false, null, '📞')}
                                    </div>
                                </div>

                                {/* Additional Information */}
                                <div style={{
                                    background: 'var(--card-bg)',
                                    borderRadius: '10px',
                                    padding: '16px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <h4 style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        margin: '0 0 12px 0',
                                        color: 'var(--text-primary)',
                                        borderBottom: '1px solid var(--border-color)',
                                        paddingBottom: '10px'
                                    }}>
                                        <FileText size={18} style={{ color: 'var(--teal-color)' }} />
                                        Additional Information
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                        {renderDoctorInput('bio', 'Bio / About', 'textarea', 'Tell us about yourself...', false, null, '📝')}
                                        {renderDoctorInput('languages', 'Languages', 'select', '', false, languages, '🗣️')}
                                        {renderDoctorInput('status', 'Status', 'select', '', false, ['Active', 'Inactive', 'Suspended'], '🟢')}
                                        {renderDoctorInput('preferred_contact_method', 'Preferred Contact', 'select', '', false, preferredContactMethods, '📱')}
                                        {renderDoctorInput('backup_contact', 'Backup Contact Name', 'text', 'e.g. Ahmed Khan', false, null, '👤')}
                                        {renderDoctorInput('backup_phone', 'Backup Phone', 'text', 'e.g. 0300-9876543', false, null, '📞')}
                                        {renderDoctorInput('notes', 'Notes', 'textarea', 'Additional notes...', false, null, '📝')}
                                    </div>
                                </div>

                                {/* Schedule */}
                                <div style={{
                                    background: 'var(--card-bg)',
                                    borderRadius: '10px',
                                    padding: '16px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <h4 style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        margin: '0 0 12px 0',
                                        color: 'var(--text-primary)',
                                        borderBottom: '1px solid var(--border-color)',
                                        paddingBottom: '10px'
                                    }}>
                                        <Calendar size={18} style={{ color: 'var(--primary-color)' }} />
                                        Weekly Schedule
                                    </h4>
                                    {renderScheduleUI(
                                        modalSchedule,
                                        addModalScheduleSlot,
                                        removeModalScheduleSlot,
                                        newSlotTime,
                                        setNewSlotTime
                                    )}
                                </div>

                                {/* Availability */}
                                <div style={{
                                    background: 'var(--card-bg)',
                                    borderRadius: '10px',
                                    padding: '16px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <h4 style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        margin: '0 0 12px 0',
                                        color: 'var(--text-primary)',
                                        borderBottom: '1px solid var(--border-color)',
                                        paddingBottom: '10px'
                                    }}>
                                        <UserCheck size={18} style={{ color: 'var(--success-color)' }} />
                                        Availability
                                    </h4>
                                    {renderDoctorInput('availability', 'Availability Status', 'select', '', false, ['Available', 'Unavailable', 'On Leave'], '🟢')}
                                </div>

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '10px',
                                    paddingTop: '16px',
                                    borderTop: '1px solid var(--border-color)',
                                    marginTop: '4px'
                                }}>
                                    <button
                                        type="button"
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
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        onClick={handleEditSubmit}
                                        disabled={actionLoading}
                                        style={{
                                            padding: '10px 32px',
                                            border: 'none',
                                            borderRadius: '10px',
                                            background: 'var(--primary-color)',
                                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                                            fontSize: '0.85rem',
                                            fontFamily: 'var(--font-family)',
                                            color: 'white',
                                            fontWeight: 500,
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            opacity: actionLoading ? 0.7 : 1
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!actionLoading) {
                                                e.currentTarget.style.background = '#1D4ED8';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!actionLoading) {
                                                e.currentTarget.style.background = 'var(--primary-color)';
                                            }
                                        }}
                                    >
                                        {actionLoading ? 'Saving...' : 'Update Doctor'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== DELETE CONFIRMATION MODAL ===== */}
            {isDeleteOpen && selectedDoctor && (
                <div className="hms-modal-backdrop" onClick={() => setIsDeleteOpen(false)}>
                    <div className="hms-modal small" onClick={(e) => e.stopPropagation()} style={{
                        maxWidth: '420px',
                        background: 'var(--card-bg)',
                        borderRadius: '16px',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-xl)',
                        width: '100%',
                        margin: '16px',
                        overflow: 'hidden'
                    }}>
                        <div className="hms-modal-header" style={{
                            padding: '14px 18px',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'var(--bg-primary)'
                        }}>
                            <h3 className="hms-modal-title" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                margin: 0,
                                color: 'var(--danger-color)'
                            }}>
                                <Trash2 size={18} />
                                Delete Doctor
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
                                <X size={18} />
                            </button>
                        </div>
                        <div className="hms-modal-body" style={{
                            padding: '24px',
                            textAlign: 'center',
                            background: 'var(--bg-primary)'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚠️</div>
                            <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
                                Are you sure?
                            </p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Delete <strong>{selectedDoctor.name}</strong>'s profile permanently? This action cannot be undone.
                            </p>
                        </div>
                        <div className="hms-modal-footer" style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '10px',
                            padding: '12px 18px',
                            borderTop: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)'
                        }}>
                            <button
                                onClick={() => setIsDeleteOpen(false)}
                                style={{
                                    padding: '8px 20px',
                                    border: '1.5px solid var(--border-color)',
                                    borderRadius: '8px',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'var(--text-secondary)',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'var(--hover-bg)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteSubmit}
                                disabled={actionLoading}
                                style={{
                                    padding: '8px 24px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    background: 'var(--danger-color)',
                                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'white',
                                    fontWeight: 500,
                                    transition: 'all 0.2s ease',
                                    opacity: actionLoading ? 0.7 : 1
                                }}
                                onMouseEnter={(e) => {
                                    if (!actionLoading) {
                                        e.currentTarget.style.background = '#DC2626';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!actionLoading) {
                                        e.currentTarget.style.background = 'var(--danger-color)';
                                    }
                                }}
                            >
                                {actionLoading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== SCHEDULE MODAL ===== */}
            {isScheduleOpen && selectedDoctor && (
                <div className="hms-modal-backdrop" onClick={() => setIsScheduleOpen(false)}>
                    <div className="hms-modal large" onClick={(e) => e.stopPropagation()} style={{
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        maxWidth: '720px',
                        width: '100%'
                    }}>
                        <div className="hms-modal-header" style={{
                            padding: '14px 18px',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexShrink: 0,
                            background: 'var(--bg-primary)'
                        }}>
                            <h3 className="hms-modal-title" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                margin: 0,
                                color: 'var(--text-primary)'
                            }}>
                                <Calendar size={18} style={{ color: 'var(--primary-color)' }} />
                                Schedule: {selectedDoctor.name}
                            </h3>
                            <button
                                className="hms-modal-close"
                                onClick={() => setIsScheduleOpen(false)}
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
                                <X size={18} />
                            </button>
                        </div>
                        <div className="hms-modal-body" style={{
                            padding: '20px',
                            overflowY: 'auto',
                            flex: 1,
                            background: 'var(--bg-primary)'
                        }}>
                            {renderScheduleUI(
                                scheduleState,
                                addScheduleSlot,
                                removeScheduleSlot,
                                newSlotTime,
                                setNewSlotTime
                            )}
                        </div>
                        <div className="hms-modal-footer" style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '10px',
                            padding: '12px 18px',
                            borderTop: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)'
                        }}>
                            <button
                                onClick={() => setIsScheduleOpen(false)}
                                style={{
                                    padding: '8px 20px',
                                    border: '1.5px solid var(--border-color)',
                                    borderRadius: '8px',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'var(--text-secondary)',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'var(--hover-bg)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveSchedule}
                                disabled={actionLoading}
                                style={{
                                    padding: '8px 24px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    background: 'var(--primary-color)',
                                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'white',
                                    fontWeight: 500,
                                    transition: 'all 0.2s ease',
                                    opacity: actionLoading ? 0.7 : 1
                                }}
                                onMouseEnter={(e) => {
                                    if (!actionLoading) {
                                        e.currentTarget.style.background = '#1D4ED8';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!actionLoading) {
                                        e.currentTarget.style.background = 'var(--primary-color)';
                                    }
                                }}
                            >
                                {actionLoading ? 'Saving...' : 'Save Schedule'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default Doctors;