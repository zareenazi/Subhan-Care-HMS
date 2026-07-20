import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { supabase } from '../services/supabaseClient';
import Button from '../components/Button';
import InputField from '../components/InputField';
import {
    Plus, Search, Edit2, Trash2, X, Calendar,
    User, Phone, Mail, Clock, Check, AlertCircle,
    ArrowLeft, Stethoscope, Filter, Eye, Users,
    Activity, FileText, Save, UserCircle, MapPin,
    Briefcase, Award, Shield, Building, CreditCard,
    UserCheck, UserX, Clock as ClockIcon, ChevronLeft,
    ChevronRight, Printer, Heart, Droplet, Pill,
    Eye as EyeIcon, Monitor, RefreshCw, Package, Truck,
    ClipboardList, AlertTriangle, UserPlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Staff = () => {
    const navigate = useNavigate();

    // ===== STATE =====
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [totalStaff, setTotalStaff] = useState(0);
    const [touched, setTouched] = useState({});

    // ===== STATS =====
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        onLeave: 0,
        inactive: 0
    });

    // ===== MODALS =====
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);

    // ===== FORM STATE =====
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        cnic: '',
        date_of_birth: '',
        gender: 'Male',
        role: 'Staff',
        department: '',
        specialization: '',
        qualification: '',
        experience: '',
        license_number: '',
        address: '',
        emergency_contact: '',
        emergency_phone: '',
        joining_date: new Date().toISOString().split('T')[0],
        shift: 'Morning',
        status: 'Active',
        username: '',
        password: '',
        salary: '',
        blood_group: '',
        religion: '',
        nationality: ''
    });

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
        teal: '#14B8A6',
        rose: '#F43F5E',
        cyan: '#06B6D4',
        indigo: '#6366F1',
        emerald: '#10B981'
    };

    // ===== ROLES =====
    const allRoles = [
        'Admin',
        'Doctor',
        'Receptionist',
        'Pharmacist',
        'Billing Staff',
        'Staff'
    ];

    // ===== DEPARTMENTS =====
    const allDepartments = [
        'Administration',
        'Medical',
        'Pharmacy',
        'Billing',
        'Nursing',
        'Laboratory',
        'Radiology',
        'Inventory',
        'IT',
        'Security'
    ];

    // ===== ALL STATUS =====
    const allStatus = ['Active', 'Inactive', 'On Leave'];

    // ===== SHIFTS =====
    const allShifts = ['Morning', 'Evening', 'Night', 'Rotating'];

    // ===== BLOOD GROUPS =====
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    // ===== GENDER =====
    const genders = ['Male', 'Female', 'Other'];

    // ===== GO BACK =====
    const goBack = () => {
        navigate(-1);
    };

    // ===== LOAD STAFF - SIMPLIFIED VERSION =====
    const loadStaff = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            console.log('🔄 Loading staff...');

            // =============================================
            // 1. LOAD FROM STAFF TABLE
            // =============================================
            let staffQuery = supabase
                .from('staff')
                .select('*');

            if (searchQuery && searchQuery.trim() !== '') {
                staffQuery = staffQuery.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
            }
            if (roleFilter && roleFilter !== '') {
                staffQuery = staffQuery.eq('role', roleFilter);
            }
            if (statusFilter && statusFilter !== '') {
                staffQuery = staffQuery.eq('status', statusFilter);
            }
            if (departmentFilter && departmentFilter !== '') {
                staffQuery = staffQuery.eq('department', departmentFilter);
            }

            const { data: staffData, error: staffError } = await staffQuery;

            if (staffError) {
                console.error('❌ Staff Error:', staffError);
                setErrorMsg('Failed to load staff: ' + staffError.message);
                setStaff([]);
                setTotalStaff(0);
                setStats({ total: 0, active: 0, onLeave: 0, inactive: 0 });
                setLoading(false);
                return;
            }

            console.log('✅ Staff data loaded:', staffData?.length || 0, 'records');

            // =============================================
            // 2. LOAD FROM DOCTORS TABLE
            // =============================================
            let doctorQuery = supabase
                .from('doctors')
                .select('*');

            if (searchQuery && searchQuery.trim() !== '') {
                doctorQuery = doctorQuery.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
            }

            const { data: doctorsData, error: doctorsError } = await doctorQuery;

            if (doctorsError) {
                console.error('❌ Doctors Error:', doctorsError);
            }

            console.log('✅ Doctors data loaded:', doctorsData?.length || 0, 'records');

            // =============================================
            // 3. COMBINE BOTH LISTS
            // =============================================
            let combinedStaff = [];

            // Create a Set to track existing staff
            const existingEmails = new Set();
            const existingNames = new Set();

            // First, add all staff from staff table
            if (staffData) {
                staffData.forEach(item => {
                    if (item.email) existingEmails.add(item.email.toLowerCase());
                    if (item.name) existingNames.add(item.name.toLowerCase());
                    combinedStaff.push({
                        ...item,
                        _table: 'staff'
                    });
                });
            }

            // Then, add doctors that are not already in staff
            if (doctorsData && doctorsData.length > 0) {
                doctorsData.forEach(doc => {
                    const emailExists = doc.email ? existingEmails.has(doc.email.toLowerCase()) : false;
                    const nameExists = doc.name ? existingNames.has(doc.name.toLowerCase()) : false;

                    if (!emailExists && !nameExists) {
                        console.log(`📝 Adding doctor to staff view: ${doc.name}`);
                        if (doc.email) existingEmails.add(doc.email.toLowerCase());
                        if (doc.name) existingNames.add(doc.name.toLowerCase());
                        combinedStaff.push({
                            id: doc.id,
                            _table: 'doctors',
                            name: doc.name,
                            email: doc.email || '',
                            phone: doc.phone || '',
                            cnic: '',
                            date_of_birth: '',
                            gender: 'Male',
                            role: 'Doctor',
                            department: doc.department || 'Medical',
                            specialization: doc.specialization || '',
                            qualification: doc.qualification || '',
                            experience: doc.experience || '',
                            license_number: doc.license_number || '',
                            address: doc.address || '',
                            emergency_contact: '',
                            emergency_phone: '',
                            joining_date: doc.created_at ? new Date(doc.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                            shift: 'Morning',
                            status: doc.availability === 'Available' ? 'Active' :
                                doc.availability === 'Unavailable' ? 'Inactive' :
                                    doc.availability === 'On Leave' ? 'On Leave' : 'Active',
                            username: doc.email?.split('@')[0] || doc.name?.toLowerCase().replace(/\s/g, '.') || '',
                            password: 'Doctor@123',
                            salary: '',
                            blood_group: '',
                            religion: '',
                            nationality: '',
                            created_at: doc.created_at,
                            updated_at: doc.updated_at
                        });
                    } else {
                        console.log(`⏭️ Doctor already in staff: ${doc.name}`);
                    }
                });
            }

            // =============================================
            // 4. LOAD AUTH USERS (Direct from Supabase Auth)
            // =============================================
            try {
                // Try to get users from auth.users via admin API
                const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

                if (authError) {
                    console.log('⚠️ Cannot access auth.users:', authError.message);
                } else if (users && users.length > 0) {
                    console.log('✅ Auth users loaded:', users.length, 'records');

                    users.forEach(user => {
                        const emailKey = user.email?.toLowerCase();
                        const nameKey = user.user_metadata?.name?.toLowerCase() || user.email?.toLowerCase();

                        // Check if user already exists in staff
                        if (emailKey && !existingEmails.has(emailKey) && !existingNames.has(nameKey)) {
                            console.log(`📝 Adding auth user to staff view: ${user.email}`);
                            if (emailKey) existingEmails.add(emailKey);
                            if (nameKey) existingNames.add(nameKey);

                            combinedStaff.push({
                                id: user.id,
                                _table: 'auth',
                                name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                                email: user.email || '',
                                phone: user.user_metadata?.phone || '',
                                cnic: user.user_metadata?.cnic || '',
                                date_of_birth: user.user_metadata?.date_of_birth || '',
                                gender: user.user_metadata?.gender || 'Male',
                                role: user.user_metadata?.role || 'Staff',
                                department: user.user_metadata?.department || '',
                                specialization: user.user_metadata?.specialization || '',
                                qualification: user.user_metadata?.qualification || '',
                                experience: user.user_metadata?.experience || '',
                                license_number: user.user_metadata?.license_number || '',
                                address: user.user_metadata?.address || '',
                                emergency_contact: user.user_metadata?.emergency_contact || '',
                                emergency_phone: user.user_metadata?.emergency_phone || '',
                                joining_date: user.user_metadata?.joining_date || (user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
                                shift: user.user_metadata?.shift || 'Morning',
                                status: user.user_metadata?.status || 'Active',
                                username: user.user_metadata?.username || user.email?.split('@')[0] || '',
                                password: user.user_metadata?.password || 'User@123',
                                salary: user.user_metadata?.salary || '',
                                blood_group: user.user_metadata?.blood_group || '',
                                religion: user.user_metadata?.religion || '',
                                nationality: user.user_metadata?.nationality || '',
                                created_at: user.created_at,
                                updated_at: user.updated_at
                            });
                        }
                    });
                }
            } catch (authErr) {
                console.log('⚠️ Auth users error:', authErr.message);
            }

            // =============================================
            // 5. LOAD FROM CUSTOM USERS TABLE (if exists)
            // =============================================
            try {
                const { data: customUsers, error: customError } = await supabase
                    .from('users')
                    .select('*');

                if (customError) {
                    console.log('⚠️ Custom users table not found:', customError.message);
                } else if (customUsers && customUsers.length > 0) {
                    console.log('✅ Custom users loaded:', customUsers.length, 'records');

                    customUsers.forEach(user => {
                        const emailKey = user.email?.toLowerCase();
                        const nameKey = user.name?.toLowerCase();

                        if (emailKey && !existingEmails.has(emailKey) && !existingNames.has(nameKey)) {
                            console.log(`📝 Adding custom user to staff view: ${user.email}`);
                            if (emailKey) existingEmails.add(emailKey);
                            if (nameKey) existingNames.add(nameKey);

                            combinedStaff.push({
                                id: user.id,
                                _table: 'users',
                                name: user.name || user.email?.split('@')[0] || 'User',
                                email: user.email || '',
                                phone: user.phone || '',
                                cnic: user.cnic || '',
                                date_of_birth: user.date_of_birth || '',
                                gender: user.gender || 'Male',
                                role: user.role || 'Staff',
                                department: user.department || '',
                                specialization: user.specialization || '',
                                qualification: user.qualification || '',
                                experience: user.experience || '',
                                license_number: user.license_number || '',
                                address: user.address || '',
                                emergency_contact: user.emergency_contact || '',
                                emergency_phone: user.emergency_phone || '',
                                joining_date: user.joining_date || (user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
                                shift: user.shift || 'Morning',
                                status: user.status || 'Active',
                                username: user.username || user.email?.split('@')[0] || '',
                                password: user.password || 'User@123',
                                salary: user.salary || '',
                                blood_group: user.blood_group || '',
                                religion: user.religion || '',
                                nationality: user.nationality || '',
                                created_at: user.created_at,
                                updated_at: user.updated_at
                            });
                        }
                    });
                }
            } catch (customErr) {
                console.log('⚠️ Custom users error:', customErr.message);
            }

            // Sort by name
            combinedStaff.sort((a, b) => a.name?.localeCompare(b.name) || 0);

            // Calculate stats
            const activeCount = combinedStaff.filter(s => s.status === 'Active').length;
            const onLeaveCount = combinedStaff.filter(s => s.status === 'On Leave').length;
            const inactiveCount = combinedStaff.filter(s => s.status === 'Inactive').length;

            console.log(`✅ Total combined staff: ${combinedStaff.length}`);
            console.log(`📊 Stats: Active=${activeCount}, OnLeave=${onLeaveCount}, Inactive=${inactiveCount}`);

            setStaff(combinedStaff);
            setTotalStaff(combinedStaff.length);
            setStats({
                total: combinedStaff.length,
                active: activeCount,
                onLeave: onLeaveCount,
                inactive: inactiveCount
            });

        } catch (err) {
            console.error('❌ Error loading staff:', err);
            setErrorMsg('Failed to load staff: ' + err.message);
            setStaff([]);
            setTotalStaff(0);
            setStats({ total: 0, active: 0, onLeave: 0, inactive: 0 });
        } finally {
            setLoading(false);
        }
    };

    // ===== INITIAL LOAD =====
    useEffect(() => {
        loadStaff();
    }, []);

    // ===== RE-LOAD WHEN FILTERS CHANGE =====
    useEffect(() => {
        if (searchQuery !== '' || roleFilter !== '' || statusFilter !== '' || departmentFilter !== '') {
            loadStaff();
        }
    }, [searchQuery, roleFilter, statusFilter, departmentFilter]);

    // ===== LISTEN FOR STAFF CHANGES =====
    useEffect(() => {
        const handleStaffChange = () => {
            console.log('📢 Staff changed event received, reloading...');
            loadStaff();
        };
        window.addEventListener('staffChanged', handleStaffChange);
        window.addEventListener('doctorChanged', handleStaffChange);
        return () => {
            window.removeEventListener('staffChanged', handleStaffChange);
            window.removeEventListener('doctorChanged', handleStaffChange);
        };
    }, []);

    // ===== COMPLETE VALIDATION FUNCTIONS =====
    const validateField = (name, value) => {
        let error = '';

        switch (name) {
            case 'name':
                if (!value || !value.trim()) {
                    error = 'Full name is required';
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
                if (value && value.trim() && !/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/.test(value.trim())) {
                    error = 'Enter valid CNIC format (xxxxx-xxxxxxx-x)';
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

            case 'gender':
                if (!value) {
                    error = 'Please select a gender';
                }
                break;

            case 'role':
                if (!value) {
                    error = 'Please select a role';
                }
                break;

            case 'department':
                if (!value) {
                    error = 'Please select a department';
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

            case 'address':
                if (value && value.trim().length > 200) {
                    error = 'Address must be less than 200 characters';
                }
                break;

            case 'emergency_contact':
                if (value && value.trim()) {
                    if (value.trim().length < 3) {
                        error = 'Emergency contact name must be at least 3 characters';
                    } else if (value.trim().length > 100) {
                        error = 'Emergency contact name must be less than 100 characters';
                    }
                }
                break;

            case 'emergency_phone':
                if (value && value.trim()) {
                    if (!/^\+?[0-9\s-]{7,15}$/.test(value.trim())) {
                        error = 'Enter a valid emergency phone number';
                    }
                }
                break;

            case 'username':
                if (!value || !value.trim()) {
                    error = 'Username is required';
                } else if (value.trim().length < 3) {
                    error = 'Username must be at least 3 characters';
                } else if (value.trim().length > 50) {
                    error = 'Username must be less than 50 characters';
                } else if (!/^[a-zA-Z0-9._]+$/.test(value.trim())) {
                    error = 'Username can only contain letters, numbers, dots and underscores';
                }
                break;

            case 'password':
                if (!value && !selectedStaff) {
                    error = 'Password is required';
                } else if (value && value.trim().length < 6) {
                    error = 'Password must be at least 6 characters';
                }
                break;

            case 'salary':
                if (value && value.trim() && !/^[0-9]+$/.test(value.trim())) {
                    error = 'Salary must be a number';
                }
                break;

            default:
                break;
        }

        return error;
    };

    // ===== VALIDATE FORM =====
    const validateForm = () => {
        const errors = {};
        const fields = ['name', 'email', 'phone', 'cnic', 'date_of_birth', 'gender', 'role',
            'department', 'qualification', 'experience', 'license_number', 'address',
            'emergency_contact', 'emergency_phone', 'username', 'password', 'salary'];

        fields.forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) {
                errors[field] = error;
            }
        });

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // ===== HANDLE FIELD BLUR =====
    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, value);
        setFormErrors(prev => ({ ...prev, [name]: error }));
    };

    // ===== HANDLE FORM CHANGE =====
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // ===== OPEN MODALS =====
    const openAddModal = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            cnic: '',
            date_of_birth: '',
            gender: 'Male',
            role: 'Staff',
            department: '',
            specialization: '',
            qualification: '',
            experience: '',
            license_number: '',
            address: '',
            emergency_contact: '',
            emergency_phone: '',
            joining_date: new Date().toISOString().split('T')[0],
            shift: 'Morning',
            status: 'Active',
            username: '',
            password: '',
            salary: '',
            blood_group: '',
            religion: '',
            nationality: ''
        });
        setFormErrors({});
        setTouched({});
        setErrorMsg('');
        setSuccessMsg('');
        setIsAddOpen(true);
    };

    const openEditModal = (staff) => {
        setSelectedStaff(staff);
        setFormData({
            name: staff.name || '',
            email: staff.email || '',
            phone: staff.phone || '',
            cnic: staff.cnic || '',
            date_of_birth: staff.date_of_birth || '',
            gender: staff.gender || 'Male',
            role: staff.role || 'Staff',
            department: staff.department || '',
            specialization: staff.specialization || '',
            qualification: staff.qualification || '',
            experience: staff.experience || '',
            license_number: staff.license_number || '',
            address: staff.address || '',
            emergency_contact: staff.emergency_contact || '',
            emergency_phone: staff.emergency_phone || '',
            joining_date: staff.joining_date || new Date().toISOString().split('T')[0],
            shift: staff.shift || 'Morning',
            status: staff.status || 'Active',
            username: staff.username || '',
            password: '',
            salary: staff.salary || '',
            blood_group: staff.blood_group || '',
            religion: staff.religion || '',
            nationality: staff.nationality || ''
        });
        setFormErrors({});
        setTouched({});
        setErrorMsg('');
        setSuccessMsg('');
        setIsEditOpen(true);
    };

    const openViewModal = (staff) => {
        setSelectedStaff(staff);
        setIsViewOpen(true);
    };

    const openDeleteModal = (staff) => {
        setSelectedStaff(staff);
        setIsDeleteOpen(true);
    };

    // ===== ADD STAFF =====
    const handleAddSubmit = async (e) => {
        e.preventDefault();

        const allFields = ['name', 'email', 'phone', 'cnic', 'date_of_birth', 'gender', 'role',
            'department', 'qualification', 'experience', 'license_number', 'address',
            'emergency_contact', 'emergency_phone', 'username', 'password', 'salary'];
        const touchedFields = {};
        allFields.forEach(field => {
            touchedFields[field] = true;
        });
        setTouched(touchedFields);

        if (!validateForm()) {
            setErrorMsg('Please fix all validation errors before submitting.');
            return;
        }

        setActionLoading(true);
        setErrorMsg('');
        try {
            // Check if username already exists
            const { data: existingUser } = await supabase
                .from('staff')
                .select('username')
                .eq('username', formData.username.trim())
                .single();

            if (existingUser) {
                setErrorMsg('❌ Username already exists. Please choose another.');
                setActionLoading(false);
                return;
            }

            // Check if this is a doctor being added
            if (formData.role === 'Doctor') {
                // Add to doctors table
                const { data: doctorData, error: doctorError } = await supabase
                    .from('doctors')
                    .insert([{
                        name: formData.name.trim(),
                        email: formData.email ? formData.email.trim() : null,
                        phone: formData.phone.trim(),
                        specialization: formData.specialization || null,
                        qualification: formData.qualification || null,
                        experience: formData.experience || null,
                        license_number: formData.license_number || null,
                        address: formData.address || null,
                        department: formData.department || 'Medical',
                        availability: formData.status === 'Active' ? 'Available' :
                            formData.status === 'On Leave' ? 'On Leave' : 'Unavailable',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }])
                    .select();

                if (doctorError) {
                    console.error('Doctor Insert Error:', doctorError);
                    setErrorMsg(doctorError.message || 'Failed to add doctor.');
                    setActionLoading(false);
                    return;
                }

                // Also add to staff table for unified view
                const { error: staffError } = await supabase
                    .from('staff')
                    .insert([{
                        name: formData.name.trim(),
                        email: formData.email ? formData.email.trim() : null,
                        phone: formData.phone.trim(),
                        cnic: formData.cnic || null,
                        date_of_birth: formData.date_of_birth || null,
                        gender: formData.gender || null,
                        role: 'Doctor',
                        department: formData.department || 'Medical',
                        specialization: formData.specialization || null,
                        qualification: formData.qualification || null,
                        experience: formData.experience || null,
                        license_number: formData.license_number || null,
                        address: formData.address || null,
                        emergency_contact: formData.emergency_contact || null,
                        emergency_phone: formData.emergency_phone || null,
                        joining_date: formData.joining_date || null,
                        shift: formData.shift || null,
                        status: formData.status || 'Active',
                        username: formData.username.trim(),
                        password: formData.password,
                        salary: formData.salary || null,
                        blood_group: formData.blood_group || null,
                        religion: formData.religion || null,
                        nationality: formData.nationality || null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }]);

                if (staffError) {
                    console.error('Staff Insert Error:', staffError);
                    // Delete the doctor we just added
                    await supabase.from('doctors').delete().eq('id', doctorData[0].id);
                    setErrorMsg(staffError.message || 'Failed to add to staff.');
                    setActionLoading(false);
                    return;
                }

            } else {
                // Regular staff (non-doctor)
                const { error } = await supabase
                    .from('staff')
                    .insert([{
                        name: formData.name.trim(),
                        email: formData.email ? formData.email.trim() : null,
                        phone: formData.phone.trim(),
                        cnic: formData.cnic || null,
                        date_of_birth: formData.date_of_birth || null,
                        gender: formData.gender || null,
                        role: formData.role,
                        department: formData.department || null,
                        specialization: formData.specialization || null,
                        qualification: formData.qualification || null,
                        experience: formData.experience || null,
                        license_number: formData.license_number || null,
                        address: formData.address || null,
                        emergency_contact: formData.emergency_contact || null,
                        emergency_phone: formData.emergency_phone || null,
                        joining_date: formData.joining_date || null,
                        shift: formData.shift || null,
                        status: formData.status || 'Active',
                        username: formData.username.trim(),
                        password: formData.password,
                        salary: formData.salary || null,
                        blood_group: formData.blood_group || null,
                        religion: formData.religion || null,
                        nationality: formData.nationality || null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }]);

                if (error) {
                    console.error('Insert Error:', error);
                    setErrorMsg(error.message || 'Failed to add staff.');
                    setActionLoading(false);
                    return;
                }
            }

            setSuccessMsg('✅ Staff member added successfully!');
            setIsAddOpen(false);
            await loadStaff();
            window.dispatchEvent(new Event('staffChanged'));
            window.dispatchEvent(new Event('doctorChanged'));
        } catch (err) {
            setErrorMsg(err.message || 'Failed to add staff.');
        } finally {
            setActionLoading(false);
        }
    };

    // ===== EDIT STAFF =====
    const handleEditSubmit = async (e) => {
        e.preventDefault();

        const allFields = ['name', 'email', 'phone', 'cnic', 'date_of_birth', 'gender', 'role',
            'department', 'qualification', 'experience', 'license_number', 'address',
            'emergency_contact', 'emergency_phone', 'username', 'password', 'salary'];
        const touchedFields = {};
        allFields.forEach(field => {
            touchedFields[field] = true;
        });
        setTouched(touchedFields);

        if (!validateForm()) {
            setErrorMsg('Please fix all validation errors before submitting.');
            return;
        }

        setActionLoading(true);
        setErrorMsg('');
        try {
            if (selectedStaff._table === 'doctors') {
                // Update doctors table
                const updateData = {
                    name: formData.name.trim(),
                    email: formData.email ? formData.email.trim() : null,
                    phone: formData.phone.trim(),
                    specialization: formData.specialization || null,
                    qualification: formData.qualification || null,
                    experience: formData.experience || null,
                    license_number: formData.license_number || null,
                    address: formData.address || null,
                    department: formData.department || 'Medical',
                    availability: formData.status === 'Active' ? 'Available' :
                        formData.status === 'On Leave' ? 'On Leave' : 'Unavailable',
                    updated_at: new Date().toISOString()
                };

                const { error } = await supabase
                    .from('doctors')
                    .update(updateData)
                    .eq('id', selectedStaff.id);

                if (error) {
                    console.error('Update Doctor Error:', error);
                    setErrorMsg(error.message || 'Failed to update doctor.');
                    setActionLoading(false);
                    return;
                }

                // Also update in staff table
                const staffUpdateData = {
                    name: formData.name.trim(),
                    email: formData.email ? formData.email.trim() : null,
                    phone: formData.phone.trim(),
                    role: 'Doctor',
                    department: formData.department || 'Medical',
                    specialization: formData.specialization || null,
                    qualification: formData.qualification || null,
                    experience: formData.experience || null,
                    license_number: formData.license_number || null,
                    address: formData.address || null,
                    emergency_contact: formData.emergency_contact || null,
                    emergency_phone: formData.emergency_phone || null,
                    joining_date: formData.joining_date || null,
                    shift: formData.shift || null,
                    status: formData.status || 'Active',
                    username: formData.username.trim(),
                    salary: formData.salary || null,
                    blood_group: formData.blood_group || null,
                    religion: formData.religion || null,
                    nationality: formData.nationality || null,
                    updated_at: new Date().toISOString()
                };

                if (formData.password) {
                    staffUpdateData.password = formData.password;
                }

                const { error: staffUpdateError } = await supabase
                    .from('staff')
                    .update(staffUpdateData)
                    .eq('name', selectedStaff.name)
                    .eq('role', 'Doctor');

                if (staffUpdateError) {
                    console.warn('Staff update warning:', staffUpdateError);
                    // If not found in staff, insert it
                    const { error: staffInsertError } = await supabase
                        .from('staff')
                        .insert([{
                            ...staffUpdateData,
                            cnic: formData.cnic || null,
                            date_of_birth: formData.date_of_birth || null,
                            gender: formData.gender || null,
                            created_at: new Date().toISOString()
                        }]);

                    if (staffInsertError) {
                        console.warn('Staff insert warning:', staffInsertError);
                    }
                }

            } else if (selectedStaff._table === 'auth' || selectedStaff._table === 'users') {
                // Update staff table (since auth users might not be directly editable)
                const staffUpdateData = {
                    name: formData.name.trim(),
                    email: formData.email ? formData.email.trim() : null,
                    phone: formData.phone.trim(),
                    cnic: formData.cnic || null,
                    date_of_birth: formData.date_of_birth || null,
                    gender: formData.gender || null,
                    role: formData.role,
                    department: formData.department || null,
                    specialization: formData.specialization || null,
                    qualification: formData.qualification || null,
                    experience: formData.experience || null,
                    license_number: formData.license_number || null,
                    address: formData.address || null,
                    emergency_contact: formData.emergency_contact || null,
                    emergency_phone: formData.emergency_phone || null,
                    joining_date: formData.joining_date || null,
                    shift: formData.shift || null,
                    status: formData.status || 'Active',
                    username: formData.username.trim(),
                    salary: formData.salary || null,
                    blood_group: formData.blood_group || null,
                    religion: formData.religion || null,
                    nationality: formData.nationality || null,
                    updated_at: new Date().toISOString()
                };

                if (formData.password) {
                    staffUpdateData.password = formData.password;
                }

                // Check if user exists in staff table
                const { data: existingStaff, error: checkError } = await supabase
                    .from('staff')
                    .select('id')
                    .eq('email', selectedStaff.email)
                    .single();

                if (checkError || !existingStaff) {
                    // Insert new staff record
                    const { error: staffInsertError } = await supabase
                        .from('staff')
                        .insert([{
                            ...staffUpdateData,
                            created_at: new Date().toISOString()
                        }]);

                    if (staffInsertError) {
                        console.error('Staff Insert Error:', staffInsertError);
                        setErrorMsg(staffInsertError.message || 'Failed to update staff.');
                        setActionLoading(false);
                        return;
                    }
                } else {
                    // Update existing staff
                    const { error: staffUpdateError } = await supabase
                        .from('staff')
                        .update(staffUpdateData)
                        .eq('id', existingStaff.id);

                    if (staffUpdateError) {
                        console.error('Staff Update Error:', staffUpdateError);
                        setErrorMsg(staffUpdateError.message || 'Failed to update staff.');
                        setActionLoading(false);
                        return;
                    }
                }

            } else {
                // Update staff table
                if (formData.username !== selectedStaff.username) {
                    const { data: existingUser } = await supabase
                        .from('staff')
                        .select('username')
                        .eq('username', formData.username.trim())
                        .neq('id', selectedStaff.id)
                        .single();

                    if (existingUser) {
                        setErrorMsg('❌ Username already exists. Please choose another.');
                        setActionLoading(false);
                        return;
                    }
                }

                const updateData = {
                    name: formData.name.trim(),
                    email: formData.email ? formData.email.trim() : null,
                    phone: formData.phone.trim(),
                    cnic: formData.cnic || null,
                    date_of_birth: formData.date_of_birth || null,
                    gender: formData.gender || null,
                    role: formData.role,
                    department: formData.department || null,
                    specialization: formData.specialization || null,
                    qualification: formData.qualification || null,
                    experience: formData.experience || null,
                    license_number: formData.license_number || null,
                    address: formData.address || null,
                    emergency_contact: formData.emergency_contact || null,
                    emergency_phone: formData.emergency_phone || null,
                    joining_date: formData.joining_date || null,
                    shift: formData.shift || null,
                    status: formData.status || 'Active',
                    username: formData.username.trim(),
                    salary: formData.salary || null,
                    blood_group: formData.blood_group || null,
                    religion: formData.religion || null,
                    nationality: formData.nationality || null,
                    updated_at: new Date().toISOString()
                };

                if (formData.password) {
                    updateData.password = formData.password;
                }

                const { error } = await supabase
                    .from('staff')
                    .update(updateData)
                    .eq('id', selectedStaff.id);

                if (error) {
                    console.error('Update Staff Error:', error);
                    setErrorMsg(error.message || 'Failed to update staff.');
                    setActionLoading(false);
                    return;
                }

                // If role is Doctor, also update doctors table
                if (formData.role === 'Doctor') {
                    const { error: doctorUpdateError } = await supabase
                        .from('doctors')
                        .update({
                            name: formData.name.trim(),
                            email: formData.email ? formData.email.trim() : null,
                            phone: formData.phone.trim(),
                            specialization: formData.specialization || null,
                            qualification: formData.qualification || null,
                            experience: formData.experience || null,
                            license_number: formData.license_number || null,
                            address: formData.address || null,
                            department: formData.department || 'Medical',
                            availability: formData.status === 'Active' ? 'Available' :
                                formData.status === 'On Leave' ? 'On Leave' : 'Unavailable',
                            updated_at: new Date().toISOString()
                        })
                        .eq('name', selectedStaff.name);

                    if (doctorUpdateError) {
                        console.warn('Doctor update warning:', doctorUpdateError);
                        // If doctor doesn't exist, create one
                        const { error: doctorInsertError } = await supabase
                            .from('doctors')
                            .insert([{
                                name: formData.name.trim(),
                                email: formData.email ? formData.email.trim() : null,
                                phone: formData.phone.trim(),
                                specialization: formData.specialization || null,
                                qualification: formData.qualification || null,
                                experience: formData.experience || null,
                                license_number: formData.license_number || null,
                                address: formData.address || null,
                                department: formData.department || 'Medical',
                                availability: formData.status === 'Active' ? 'Available' :
                                    formData.status === 'On Leave' ? 'On Leave' : 'Unavailable',
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            }]);

                        if (doctorInsertError) {
                            console.warn('Doctor insert warning:', doctorInsertError);
                        }
                    }
                }
            }

            setSuccessMsg('✅ Staff member updated successfully!');
            setIsEditOpen(false);
            await loadStaff();
            window.dispatchEvent(new Event('staffChanged'));
            window.dispatchEvent(new Event('doctorChanged'));
        } catch (err) {
            setErrorMsg(err.message || 'Failed to update staff.');
        } finally {
            setActionLoading(false);
        }
    };

    // ===== DELETE STAFF =====
    const handleDeleteSubmit = async () => {
        setActionLoading(true);
        try {
            if (selectedStaff._table === 'doctors') {
                // Delete from doctors table
                const { error } = await supabase
                    .from('doctors')
                    .delete()
                    .eq('id', selectedStaff.id);

                if (error) {
                    console.error('Delete Doctor Error:', error);
                    setErrorMsg(error.message || 'Failed to delete doctor.');
                    setActionLoading(false);
                    return;
                }

                // Also delete from staff table if exists
                await supabase
                    .from('staff')
                    .delete()
                    .eq('name', selectedStaff.name)
                    .eq('role', 'Doctor');

            } else {
                // Delete from staff table
                const { error } = await supabase
                    .from('staff')
                    .delete()
                    .eq('id', selectedStaff.id);

                if (error) {
                    console.error('Delete Staff Error:', error);
                    setErrorMsg(error.message || 'Failed to delete staff.');
                    setActionLoading(false);
                    return;
                }

                // If role was Doctor, also delete from doctors table
                if (selectedStaff.role === 'Doctor') {
                    await supabase
                        .from('doctors')
                        .delete()
                        .eq('name', selectedStaff.name);
                }
            }

            setIsDeleteOpen(false);
            await loadStaff();
            window.dispatchEvent(new Event('staffChanged'));
            window.dispatchEvent(new Event('doctorChanged'));
            setSuccessMsg('✅ Staff member deleted successfully!');
        } catch (err) {
            setErrorMsg(err.message || 'Failed to delete staff.');
        } finally {
            setActionLoading(false);
        }
    };

    // ===== STATUS BADGE =====
    const getStatusBadge = (status) => {
        const colors = {
            'Active': 'success',
            'Inactive': 'danger',
            'On Leave': 'warning'
        };
        const icons = {
            'Active': <Check size={12} style={{ marginRight: '4px' }} />,
            'Inactive': <X size={12} style={{ marginRight: '4px' }} />,
            'On Leave': <ClockIcon size={12} style={{ marginRight: '4px' }} />
        };
        return (
            <span className={`hms-badge ${colors[status] || 'secondary'}`}
                style={{ padding: '3px 12px', borderRadius: '20px', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center' }}>
                {icons[status]}
                {status || 'Active'}
            </span>
        );
    };

    // ===== ROLE INFO =====
    const getRoleInfo = (role) => {
        const roles = {
            'Admin': { icon: Shield, color: statusColors.purple, bg: '#8B5CF620' },
            'Doctor': { icon: Stethoscope, color: statusColors.primary, bg: '#2563EB20' },
            'Receptionist': { icon: User, color: statusColors.teal, bg: '#14B8A620' },
            'Pharmacist': { icon: Pill, color: statusColors.success, bg: '#22C55E20' },
            'Billing Staff': { icon: CreditCard, color: statusColors.warning, bg: '#F59E0B20' },
            'Staff': { icon: User, color: statusColors.primary, bg: '#2563EB20' }
        };
        return roles[role] || roles['Staff'];
    };

    const clearFilters = () => {
        setSearchQuery('');
        setRoleFilter('');
        setStatusFilter('');
        setDepartmentFilter('');
    };

    const activeFilterCount = (searchQuery ? 1 : 0) + (roleFilter ? 1 : 0) + (statusFilter ? 1 : 0) + (departmentFilter ? 1 : 0);

    return (
        <DashboardLayout active="staff" title="Staff Management">
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
                        <Users size={24} style={{ color: 'var(--primary-color)' }} />
                        Staff Management
                    </h1>
                    <p style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        marginTop: '4px'
                    }}>
                        Manage all hospital staff members. Total: <strong>{totalStaff}</strong> staff members
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={loadStaff}
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
                        <Plus size={16} /> Add Staff
                    </button>
                </div>
            </div>

            {/* ===== STATS SUMMARY ===== */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '12px',
                marginBottom: '20px'
            }}>
                <div className="stat-card" style={{
                    padding: '14px 18px',
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
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: `${statusColors.primary}15`,
                        color: statusColors.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <Users size={18} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Staff</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stats.total}</div>
                    </div>
                </div>

                <div className="stat-card" style={{
                    padding: '14px 18px',
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
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: `${statusColors.success}15`,
                        color: statusColors.success,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <UserCheck size={18} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {stats.active}
                        </div>
                    </div>
                </div>

                <div className="stat-card" style={{
                    padding: '14px 18px',
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
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: `${statusColors.warning}15`,
                        color: statusColors.warning,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <ClockIcon size={18} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>On Leave</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {stats.onLeave}
                        </div>
                    </div>
                </div>

                <div className="stat-card" style={{
                    padding: '14px 18px',
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
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: `${statusColors.danger}15`,
                        color: statusColors.danger,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <UserX size={18} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Inactive</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {stats.inactive}
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
                gap: '12px',
                padding: '14px 18px',
                background: 'var(--card-bg)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: '16px'
            }}>
                <div className="hms-search-box" style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                    <Search size={18} className="hms-search-icon" style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)'
                    }} />
                    <input
                        type="text"
                        placeholder="Search by name, email, phone..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); }}
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
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '10px',
                            background: 'var(--bg-primary)',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
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
                        <Filter size={16} style={{ color: 'var(--primary-color)' }} /> Filters
                        {activeFilterCount > 0 && (
                            <span style={{
                                background: 'var(--primary-color)',
                                color: 'white',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
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
                            padding: '6px 16px',
                            height: '36px',
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
                        <Plus size={14} /> Add Staff
                    </button>
                </div>
            </div>

            {/* ===== FILTERS BAR ===== */}
            {showFilters && (
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    padding: '14px 18px',
                    background: 'var(--bg-primary)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    marginBottom: '16px',
                    alignItems: 'center'
                }}>
                    <select
                        value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value); }}
                        style={{
                            height: '38px',
                            fontSize: '0.8rem',
                            minWidth: '140px',
                            padding: '0 14px',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '8px',
                            fontFamily: 'var(--font-family)',
                            background: 'var(--card-bg)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="">All Roles</option>
                        {allRoles.map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); }}
                        style={{
                            height: '38px',
                            fontSize: '0.8rem',
                            minWidth: '130px',
                            padding: '0 14px',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '8px',
                            fontFamily: 'var(--font-family)',
                            background: 'var(--card-bg)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="">All Status</option>
                        {allStatus.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                    <select
                        value={departmentFilter}
                        onChange={(e) => { setDepartmentFilter(e.target.value); }}
                        style={{
                            height: '38px',
                            fontSize: '0.8rem',
                            minWidth: '140px',
                            padding: '0 14px',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '8px',
                            fontFamily: 'var(--font-family)',
                            background: 'var(--card-bg)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="">All Departments</option>
                        {allDepartments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                    <button
                        onClick={clearFilters}
                        style={{
                            padding: '6px 14px',
                            height: '38px',
                            border: '1.5px solid var(--border-color)',
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
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'transparent';
                            e.target.style.color = 'var(--text-secondary)';
                        }}
                    >
                        Clear All
                    </button>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {totalStaff} staff found
                    </span>
                </div>
            )}

            {/* ===== SUCCESS / ERROR MESSAGES ===== */}
            {successMsg && (
                <div className="alert alert-success" style={{
                    marginBottom: '16px',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    background: '#22C55E15',
                    border: '1px solid #22C55E30',
                    color: '#22C55E',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <Check size={18} /> {successMsg}
                </div>
            )}
            {errorMsg && (
                <div className="alert alert-danger" style={{
                    marginBottom: '16px',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    background: '#EF444415',
                    border: '1px solid #EF444430',
                    color: '#EF4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <AlertCircle size={18} /> {errorMsg}
                </div>
            )}

            {/* ===== STAFF TABLE ===== */}
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
                        Loading staff records...
                    </div>
                ) : staff.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>👥</div>
                        <h3 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>No Staff Found</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            {activeFilterCount > 0 ? 'Try clearing your filters to see all staff.' : 'Start by adding your first staff member.'}
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
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontFamily: 'var(--font-family)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'var(--primary-hover)'}
                            onMouseLeave={(e) => e.target.style.background = 'var(--primary-color)'}
                        >
                            <Plus size={16} /> Add First Staff
                        </button>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <table className="hms-table" style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '0.8rem',
                            minWidth: '700px'
                        }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '12px 16px', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                        <User size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Name
                                    </th>
                                    <th style={{ padding: '12px 16px', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                        <Phone size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Contact
                                    </th>
                                    <th style={{ padding: '12px 16px', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                        <Briefcase size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Role
                                    </th>
                                    <th style={{ padding: '12px 16px', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                        <Building size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Department
                                    </th>
                                    <th style={{ padding: '12px 16px', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                        <ClockIcon size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Shift
                                    </th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                        Status
                                    </th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {staff.map((member) => {
                                    const roleInfo = getRoleInfo(member.role);
                                    const Icon = roleInfo.icon || User;
                                    return (
                                        <tr key={`${member._table || 'staff'}-${member.id}`} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s ease' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '10px 16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '50%',
                                                        background: roleInfo.bg || 'var(--primary-color)15',
                                                        color: roleInfo.color || 'var(--primary-color)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 600,
                                                        flexShrink: 0
                                                    }}>
                                                        {member.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                                                            {member.name}
                                                            {member._table === 'doctors' && (
                                                                <span style={{
                                                                    fontSize: '0.6rem',
                                                                    color: 'var(--text-muted)',
                                                                    marginLeft: '4px',
                                                                    fontWeight: 400
                                                                }}>
                                                                    (Doctor)
                                                                </span>
                                                            )}
                                                            {member._table === 'auth' && (
                                                                <span style={{
                                                                    fontSize: '0.6rem',
                                                                    color: 'var(--text-muted)',
                                                                    marginLeft: '4px',
                                                                    fontWeight: 400
                                                                }}>
                                                                    (Auth)
                                                                </span>
                                                            )}
                                                            {member._table === 'users' && (
                                                                <span style={{
                                                                    fontSize: '0.6rem',
                                                                    color: 'var(--text-muted)',
                                                                    marginLeft: '4px',
                                                                    fontWeight: 400
                                                                }}>
                                                                    (User)
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                            @{member.username || member.email?.split('@')[0] || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '10px 16px' }}>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{member.phone}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{member.email || 'N/A'}</div>
                                            </td>
                                            <td style={{ padding: '10px 16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Icon size={14} style={{ color: roleInfo.color }} />
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>{member.role}</span>
                                                </div>
                                                {member.specialization && (
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{member.specialization}</div>
                                                )}
                                            </td>
                                            <td style={{ padding: '10px 16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                {member.department || 'N/A'}
                                            </td>
                                            <td style={{ padding: '10px 16px' }}>
                                                <span style={{
                                                    padding: '2px 10px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.65rem',
                                                    fontWeight: 500,
                                                    background: member.shift === 'Morning' ? 'rgba(37, 99, 235, 0.1)' :
                                                        member.shift === 'Evening' ? 'rgba(245, 158, 11, 0.1)' :
                                                            member.shift === 'Night' ? 'rgba(15, 23, 42, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                                                    color: member.shift === 'Morning' ? '#2563EB' :
                                                        member.shift === 'Evening' ? '#F59E0B' :
                                                            member.shift === 'Night' ? '#1E293B' : '#8B5CF6'
                                                }}>
                                                    {member.shift || 'N/A'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                                                {getStatusBadge(member.status)}
                                            </td>
                                            <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                                                <div className="hms-actions" style={{ justifyContent: 'flex-end', gap: '6px', flexWrap: 'wrap' }}>
                                                    <button className="hms-action-btn view" title="View Details" onClick={() => openViewModal(member)}
                                                        style={{ padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                                        <Eye size={16} />
                                                    </button>
                                                    <button className="hms-action-btn edit" title="Edit Staff" onClick={() => openEditModal(member)}
                                                        style={{ padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button className="hms-action-btn delete" title="Delete Staff" onClick={() => openDeleteModal(member)}
                                                        style={{ padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                                        <Trash2 size={16} />
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

            {/* ===== MODALS (Same as before) ===== */}
            {/* Add Modal */}
            {isAddOpen && (
                <div className="hms-modal-backdrop" onClick={() => setIsAddOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        maxWidth: '820px',
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
                            padding: '18px 24px',
                            borderBottom: '1px solid var(--border-color)',
                            background: 'linear-gradient(135deg, var(--bg-primary), var(--primary-color)08)'
                        }}>
                            <div>
                                <h3 className="hms-modal-title" style={{
                                    fontSize: '1.15rem',
                                    fontWeight: 600,
                                    margin: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    color: 'var(--text-primary)'
                                }}>
                                    <UserPlus size={22} style={{ color: 'var(--primary-color)' }} />
                                    Add New Staff Member
                                </h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    Fill in the details below to register a new staff member
                                </p>
                            </div>
                            <button
                                className="hms-modal-close"
                                onClick={() => setIsAddOpen(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)',
                                    padding: '6px',
                                    borderRadius: '8px',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
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
                                <X size={20} />
                                <span style={{ fontSize: '0.75rem' }}>Close</span>
                            </button>
                        </div>

                        <div className="hms-modal-body" style={{
                            padding: '24px',
                            overflowY: 'auto',
                            flex: 1,
                            background: 'var(--bg-primary)'
                        }}>
                            {errorMsg && (
                                <div className="alert alert-danger" style={{
                                    marginBottom: '16px',
                                    padding: '12px 16px',
                                    background: '#EF444415',
                                    border: '1px solid #EF444430',
                                    borderRadius: '10px',
                                    color: '#EF4444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}>
                                    <AlertCircle size={18} /> {errorMsg}
                                </div>
                            )}
                            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {/* Personal Information */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    borderBottom: '2px solid var(--border-color)',
                                    paddingBottom: '8px',
                                    marginBottom: '4px'
                                }}>
                                    <User size={16} style={{ color: 'var(--primary-color)' }} />
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Personal Information</span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <InputField
                                        label="Full Name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Ahmed Khan"
                                        error={formErrors.name}
                                        required
                                    />
                                    <InputField
                                        label="Email Address"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="e.g. ahmed@hospital.com"
                                        error={formErrors.email}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <InputField
                                        label="Phone Number"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 03001234567"
                                        error={formErrors.phone}
                                        required
                                    />
                                    <InputField
                                        label="CNIC / ID Number"
                                        name="cnic"
                                        value={formData.cnic}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 42101-1234567-1"
                                        error={formErrors.cnic}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                                    <InputField
                                        label="Date of Birth"
                                        name="date_of_birth"
                                        type="date"
                                        value={formData.date_of_birth}
                                        onChange={handleInputChange}
                                        error={formErrors.date_of_birth}
                                    />
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Gender</label>
                                        <select
                                            name="gender"
                                            className="hms-select"
                                            value={formData.gender}
                                            onChange={handleInputChange}
                                            onBlur={handleBlur}
                                            style={{ width: '100%', height: '42px', padding: '0 12px', border: formErrors.gender && touched.gender ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.85rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
                                        >
                                            {genders.map(g => (
                                                <option key={g} value={g}>{g}</option>
                                            ))}
                                        </select>
                                        {formErrors.gender && touched.gender && <span className="error-text" style={{ fontSize: '0.75rem', color: 'var(--danger-color)' }}>{formErrors.gender}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Blood Group</label>
                                        <select
                                            name="blood_group"
                                            className="hms-select"
                                            value={formData.blood_group}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', height: '42px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.85rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
                                        >
                                            <option value="">Select</option>
                                            {bloodGroups.map(bg => (
                                                <option key={bg} value={bg}>{bg}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Employment Details */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    borderBottom: '2px solid var(--border-color)',
                                    paddingBottom: '8px',
                                    marginTop: '8px'
                                }}>
                                    <Briefcase size={16} style={{ color: 'var(--primary-color)' }} />
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Employment Details</span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Role <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                                        <select
                                            name="role"
                                            className="hms-select"
                                            value={formData.role}
                                            onChange={handleInputChange}
                                            onBlur={handleBlur}
                                            style={{ width: '100%', height: '42px', padding: '0 12px', border: formErrors.role && touched.role ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.85rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
                                        >
                                            {allRoles.map(role => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                        </select>
                                        {formErrors.role && touched.role && <span className="error-text" style={{ fontSize: '0.75rem', color: 'var(--danger-color)' }}>{formErrors.role}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Department</label>
                                        <select
                                            name="department"
                                            className="hms-select"
                                            value={formData.department}
                                            onChange={handleInputChange}
                                            onBlur={handleBlur}
                                            style={{ width: '100%', height: '42px', padding: '0 12px', border: formErrors.department && touched.department ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.85rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
                                        >
                                            <option value="">Select Department</option>
                                            {allDepartments.map(dept => (
                                                <option key={dept} value={dept}>{dept}</option>
                                            ))}
                                        </select>
                                        {formErrors.department && touched.department && <span className="error-text" style={{ fontSize: '0.75rem', color: 'var(--danger-color)' }}>{formErrors.department}</span>}
                                    </div>
                                </div>

                                {formData.role === 'Doctor' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                        <InputField
                                            label="Specialization"
                                            name="specialization"
                                            value={formData.specialization}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Cardiology"
                                        />
                                        <InputField
                                            label="License Number"
                                            name="license_number"
                                            value={formData.license_number}
                                            onChange={handleInputChange}
                                            placeholder="e.g. PMC-12345"
                                            error={formErrors.license_number}
                                        />
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <InputField
                                        label="Qualification"
                                        name="qualification"
                                        value={formData.qualification}
                                        onChange={handleInputChange}
                                        placeholder="e.g. MBBS, FCPS"
                                        error={formErrors.qualification}
                                    />
                                    <InputField
                                        label="Experience (Years)"
                                        name="experience"
                                        value={formData.experience}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 5"
                                        error={formErrors.experience}
                                    />
                                </div>

                                <InputField
                                    label="Address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    placeholder="e.g. House 45-B, Sector G-11, Islamabad"
                                    error={formErrors.address}
                                />

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <InputField
                                        label="Emergency Contact Name"
                                        name="emergency_contact"
                                        value={formData.emergency_contact}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Sara Khan (Wife)"
                                        error={formErrors.emergency_contact}
                                    />
                                    <InputField
                                        label="Emergency Contact Phone"
                                        name="emergency_phone"
                                        value={formData.emergency_phone}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 0300-9876543"
                                        error={formErrors.emergency_phone}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                                    <InputField
                                        label="Joining Date"
                                        name="joining_date"
                                        type="date"
                                        value={formData.joining_date}
                                        onChange={handleInputChange}
                                    />
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Shift</label>
                                        <select
                                            name="shift"
                                            className="hms-select"
                                            value={formData.shift}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', height: '42px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.85rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
                                        >
                                            {allShifts.map(shift => (
                                                <option key={shift} value={shift}>{shift}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Status</label>
                                        <select
                                            name="status"
                                            className="hms-select"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', height: '42px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.85rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
                                        >
                                            {allStatus.map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Account Details */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    borderBottom: '2px solid var(--border-color)',
                                    paddingBottom: '8px',
                                    marginTop: '8px'
                                }}>
                                    <Shield size={16} style={{ color: 'var(--primary-color)' }} />
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Account Details</span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <InputField
                                        label="Username"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        placeholder="e.g. ahmed.khan"
                                        error={formErrors.username}
                                        required
                                    />
                                    <InputField
                                        label="Password"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Min 6 characters"
                                        error={formErrors.password}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <InputField
                                        label="Salary"
                                        name="salary"
                                        value={formData.salary}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 50000"
                                        error={formErrors.salary}
                                    />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <InputField
                                            label="Religion"
                                            name="religion"
                                            value={formData.religion}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Islam"
                                        />
                                        <InputField
                                            label="Nationality"
                                            name="nationality"
                                            value={formData.nationality}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Pakistani"
                                        />
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '12px',
                                    paddingTop: '16px',
                                    borderTop: '1px solid var(--border-color)',
                                    marginTop: '8px'
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
                                        type="submit"
                                        onClick={handleAddSubmit}
                                        disabled={actionLoading}
                                        style={{
                                            padding: '10px 28px',
                                            border: 'none',
                                            borderRadius: '10px',
                                            background: actionLoading ? '#93c5fd' : 'var(--primary-color)',
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
                                                e.target.style.background = '#1D4ED8';
                                                e.target.style.transform = 'translateY(-1px)';
                                                e.target.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.3)';
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
                                        <UserPlus size={18} />
                                        {actionLoading ? 'Adding...' : 'Add Staff Member'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {isViewOpen && selectedStaff && (
                <div className="hms-modal-backdrop" onClick={() => setIsViewOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{
                        maxWidth: '720px',
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
                            padding: '16px 20px',
                            borderBottom: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            flexShrink: 0
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <button
                                    onClick={() => setIsViewOpen(false)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-secondary)',
                                        padding: '4px',
                                        borderRadius: '6px',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                    onMouseEnter={(e) => { e.target.style.background = 'var(--hover-bg)'; }}
                                    onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
                                >
                                    <X size={20} />
                                </button>
                                <h3 className="hms-modal-title" style={{
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    margin: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: 'var(--text-primary)'
                                }}>
                                    <User size={20} style={{ color: 'var(--primary-color)' }} />
                                    Staff Details
                                </h3>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                    onClick={() => window.print()}
                                    style={{
                                        padding: '6px 12px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '6px',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        fontSize: '0.7rem',
                                        color: 'var(--text-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                    onMouseEnter={(e) => { e.target.style.background = 'var(--hover-bg)'; }}
                                    onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
                                >
                                    <Printer size={14} /> Print
                                </button>
                                <button
                                    onClick={() => {
                                        setIsViewOpen(false);
                                        openEditModal(selectedStaff);
                                    }}
                                    style={{
                                        padding: '6px 14px',
                                        border: 'none',
                                        borderRadius: '6px',
                                        background: 'var(--primary-color)',
                                        cursor: 'pointer',
                                        fontSize: '0.7rem',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                    onMouseEnter={(e) => { e.target.style.background = 'var(--primary-hover)'; }}
                                    onMouseLeave={(e) => { e.target.style.background = 'var(--primary-color)'; }}
                                >
                                    <Edit2 size={14} /> Edit
                                </button>
                            </div>
                        </div>

                        <div className="hms-modal-body" style={{
                            padding: '20px',
                            overflowY: 'auto',
                            flex: 1,
                            background: 'var(--bg-primary)'
                        }}>
                            {/* Profile Header */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '20px',
                                padding: '16px 20px',
                                background: 'linear-gradient(135deg, var(--primary-color)10, var(--secondary-color)10)',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)',
                                flexWrap: 'wrap'
                            }}>
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--primary-color), #7C3AED)',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.8rem',
                                    fontWeight: 700,
                                    flexShrink: 0
                                }}>
                                    {selectedStaff.name?.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                                            {selectedStaff.name}
                                        </h2>
                                        <span style={{
                                            fontSize: '0.7rem',
                                            color: 'var(--text-muted)',
                                            background: 'var(--bg-primary)',
                                            padding: '2px 12px',
                                            borderRadius: '12px',
                                            border: '1px solid var(--border-color)'
                                        }}>
                                            #{selectedStaff.id?.slice(0, 6).toUpperCase()}
                                        </span>
                                        {getStatusBadge(selectedStaff.status)}
                                    </div>
                                    <div style={{ display: 'flex', gap: '16px', marginTop: '6px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            <Briefcase size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                            {selectedStaff.role}
                                        </span>
                                        {selectedStaff.specialization && (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                <Stethoscope size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                                {selectedStaff.specialization}
                                            </span>
                                        )}
                                        {selectedStaff.department && (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                <Building size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                                {selectedStaff.department}
                                            </span>
                                        )}
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            <ClockIcon size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                            {selectedStaff.shift}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Staff Details Grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '10px',
                                marginTop: '16px'
                            }}>
                                <div style={{
                                    padding: '10px 14px',
                                    background: 'var(--card-bg)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                        <Phone size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                        Phone
                                    </div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                        {selectedStaff.phone}
                                    </div>
                                </div>
                                <div style={{
                                    padding: '10px 14px',
                                    background: 'var(--card-bg)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                        <Mail size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                        Email
                                    </div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                        {selectedStaff.email || 'N/A'}
                                    </div>
                                </div>
                                {selectedStaff.cnic && (
                                    <div style={{
                                        padding: '10px 14px',
                                        background: 'var(--card-bg)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            <CreditCard size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                            CNIC / ID
                                        </div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                            {selectedStaff.cnic}
                                        </div>
                                    </div>
                                )}
                                {selectedStaff.blood_group && (
                                    <div style={{
                                        padding: '10px 14px',
                                        background: 'var(--card-bg)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            <Droplet size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                            Blood Group
                                        </div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                            {selectedStaff.blood_group}
                                        </div>
                                    </div>
                                )}
                                {selectedStaff.qualification && (
                                    <div style={{
                                        padding: '10px 14px',
                                        background: 'var(--card-bg)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            <Award size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                            Qualification
                                        </div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                            {selectedStaff.qualification}
                                        </div>
                                    </div>
                                )}
                                {selectedStaff.experience && (
                                    <div style={{
                                        padding: '10px 14px',
                                        background: 'var(--card-bg)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            <ClockIcon size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                            Experience
                                        </div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                            {selectedStaff.experience} years
                                        </div>
                                    </div>
                                )}
                                {selectedStaff.joining_date && (
                                    <div style={{
                                        padding: '10px 14px',
                                        background: 'var(--card-bg)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                            Joining Date
                                        </div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                            {new Date(selectedStaff.joining_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                )}
                                {selectedStaff.emergency_contact && (
                                    <div style={{
                                        padding: '10px 14px',
                                        background: 'var(--card-bg)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        gridColumn: '1 / -1'
                                    }}>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            <AlertCircle size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                            Emergency Contact
                                        </div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                            {selectedStaff.emergency_contact}
                                            {selectedStaff.emergency_phone && ` (${selectedStaff.emergency_phone})`}
                                        </div>
                                    </div>
                                )}
                                {selectedStaff.address && (
                                    <div style={{
                                        padding: '10px 14px',
                                        background: 'var(--card-bg)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        gridColumn: '1 / -1'
                                    }}>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                            Address
                                        </div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                            {selectedStaff.address}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="hms-modal-footer" style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '8px',
                            padding: '14px 20px',
                            borderTop: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            flexShrink: 0
                        }}>
                            <button
                                onClick={() => setIsViewOpen(false)}
                                style={{
                                    padding: '8px 20px',
                                    border: '1.5px solid var(--border-color)',
                                    borderRadius: '8px',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'var(--text-secondary)',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => { e.target.style.background = 'var(--hover-bg)'; }}
                                onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    setIsViewOpen(false);
                                    openEditModal(selectedStaff);
                                }}
                                style={{
                                    padding: '8px 20px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    background: 'var(--primary-color)',
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
                                onMouseEnter={(e) => { e.target.style.background = 'var(--primary-hover)'; }}
                                onMouseLeave={(e) => { e.target.style.background = 'var(--primary-color)'; }}
                            >
                                <Edit2 size={16} /> Edit Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditOpen && selectedStaff && (
                <div className="hms-modal-backdrop" onClick={() => setIsEditOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        maxWidth: '820px',
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
                            padding: '18px 24px',
                            borderBottom: '1px solid var(--border-color)',
                            background: 'linear-gradient(135deg, var(--bg-primary), var(--primary-color)08)'
                        }}>
                            <div>
                                <h3 className="hms-modal-title" style={{
                                    fontSize: '1.15rem',
                                    fontWeight: 600,
                                    margin: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    color: 'var(--text-primary)'
                                }}>
                                    <Edit2 size={22} style={{ color: 'var(--secondary-color)' }} />
                                    Edit Staff Member
                                </h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    Update the staff member's information
                                </p>
                            </div>
                            <button
                                className="hms-modal-close"
                                onClick={() => setIsEditOpen(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)',
                                    padding: '6px',
                                    borderRadius: '8px',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
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
                                <X size={20} />
                                <span style={{ fontSize: '0.75rem' }}>Close</span>
                            </button>
                        </div>

                        <div className="hms-modal-body" style={{
                            padding: '24px',
                            overflowY: 'auto',
                            flex: 1,
                            background: 'var(--bg-primary)'
                        }}>
                            {errorMsg && (
                                <div className="alert alert-danger" style={{
                                    marginBottom: '16px',
                                    padding: '12px 16px',
                                    background: '#EF444415',
                                    border: '1px solid #EF444430',
                                    borderRadius: '10px',
                                    color: '#EF4444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}>
                                    <AlertCircle size={18} /> {errorMsg}
                                </div>
                            )}
                            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {/* Personal Information */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    borderBottom: '2px solid var(--border-color)',
                                    paddingBottom: '8px',
                                    marginBottom: '4px'
                                }}>
                                    <User size={16} style={{ color: 'var(--primary-color)' }} />
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Personal Information</span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <InputField
                                        label="Full Name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Ahmed Khan"
                                        error={formErrors.name}
                                        required
                                    />
                                    <InputField
                                        label="Email Address"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="e.g. ahmed@hospital.com"
                                        error={formErrors.email}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <InputField
                                        label="Phone Number"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 03001234567"
                                        error={formErrors.phone}
                                        required
                                    />
                                    <InputField
                                        label="CNIC / ID Number"
                                        name="cnic"
                                        value={formData.cnic}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 42101-1234567-1"
                                        error={formErrors.cnic}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                                    <InputField
                                        label="Date of Birth"
                                        name="date_of_birth"
                                        type="date"
                                        value={formData.date_of_birth}
                                        onChange={handleInputChange}
                                        error={formErrors.date_of_birth}
                                    />
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Gender</label>
                                        <select
                                            name="gender"
                                            className="hms-select"
                                            value={formData.gender}
                                            onChange={handleInputChange}
                                            onBlur={handleBlur}
                                            style={{ width: '100%', height: '42px', padding: '0 12px', border: formErrors.gender && touched.gender ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.85rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
                                        >
                                            {genders.map(g => (
                                                <option key={g} value={g}>{g}</option>
                                            ))}
                                        </select>
                                        {formErrors.gender && touched.gender && <span className="error-text" style={{ fontSize: '0.75rem', color: 'var(--danger-color)' }}>{formErrors.gender}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Blood Group</label>
                                        <select
                                            name="blood_group"
                                            className="hms-select"
                                            value={formData.blood_group}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', height: '42px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.85rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
                                        >
                                            <option value="">Select</option>
                                            {bloodGroups.map(bg => (
                                                <option key={bg} value={bg}>{bg}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Employment Details */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    borderBottom: '2px solid var(--border-color)',
                                    paddingBottom: '8px',
                                    marginTop: '8px'
                                }}>
                                    <Briefcase size={16} style={{ color: 'var(--primary-color)' }} />
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Employment Details</span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Role <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                                        <select
                                            name="role"
                                            className="hms-select"
                                            value={formData.role}
                                            onChange={handleInputChange}
                                            onBlur={handleBlur}
                                            style={{ width: '100%', height: '42px', padding: '0 12px', border: formErrors.role && touched.role ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.85rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
                                        >
                                            {allRoles.map(role => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                        </select>
                                        {formErrors.role && touched.role && <span className="error-text" style={{ fontSize: '0.75rem', color: 'var(--danger-color)' }}>{formErrors.role}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Department</label>
                                        <select
                                            name="department"
                                            className="hms-select"
                                            value={formData.department}
                                            onChange={handleInputChange}
                                            onBlur={handleBlur}
                                            style={{ width: '100%', height: '42px', padding: '0 12px', border: formErrors.department && touched.department ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.85rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
                                        >
                                            <option value="">Select Department</option>
                                            {allDepartments.map(dept => (
                                                <option key={dept} value={dept}>{dept}</option>
                                            ))}
                                        </select>
                                        {formErrors.department && touched.department && <span className="error-text" style={{ fontSize: '0.75rem', color: 'var(--danger-color)' }}>{formErrors.department}</span>}
                                    </div>
                                </div>

                                {formData.role === 'Doctor' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                        <InputField
                                            label="Specialization"
                                            name="specialization"
                                            value={formData.specialization}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Cardiology"
                                        />
                                        <InputField
                                            label="License Number"
                                            name="license_number"
                                            value={formData.license_number}
                                            onChange={handleInputChange}
                                            placeholder="e.g. PMC-12345"
                                            error={formErrors.license_number}
                                        />
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <InputField
                                        label="Qualification"
                                        name="qualification"
                                        value={formData.qualification}
                                        onChange={handleInputChange}
                                        placeholder="e.g. MBBS, FCPS"
                                        error={formErrors.qualification}
                                    />
                                    <InputField
                                        label="Experience (Years)"
                                        name="experience"
                                        value={formData.experience}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 5"
                                        error={formErrors.experience}
                                    />
                                </div>

                                <InputField
                                    label="Address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    placeholder="e.g. House 45-B, Sector G-11, Islamabad"
                                    error={formErrors.address}
                                />

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <InputField
                                        label="Emergency Contact Name"
                                        name="emergency_contact"
                                        value={formData.emergency_contact}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Sara Khan (Wife)"
                                        error={formErrors.emergency_contact}
                                    />
                                    <InputField
                                        label="Emergency Contact Phone"
                                        name="emergency_phone"
                                        value={formData.emergency_phone}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 0300-9876543"
                                        error={formErrors.emergency_phone}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                                    <InputField
                                        label="Joining Date"
                                        name="joining_date"
                                        type="date"
                                        value={formData.joining_date}
                                        onChange={handleInputChange}
                                    />
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Shift</label>
                                        <select
                                            name="shift"
                                            className="hms-select"
                                            value={formData.shift}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', height: '42px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.85rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
                                        >
                                            {allShifts.map(shift => (
                                                <option key={shift} value={shift}>{shift}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Status</label>
                                        <select
                                            name="status"
                                            className="hms-select"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', height: '42px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.85rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
                                        >
                                            {allStatus.map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Account Details */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    borderBottom: '2px solid var(--border-color)',
                                    paddingBottom: '8px',
                                    marginTop: '8px'
                                }}>
                                    <Shield size={16} style={{ color: 'var(--primary-color)' }} />
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Account Details</span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <InputField
                                        label="Username"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        placeholder="e.g. ahmed.khan"
                                        error={formErrors.username}
                                        required
                                    />
                                    <InputField
                                        label="Password (Leave blank to keep current)"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Enter new password to change"
                                        error={formErrors.password}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <InputField
                                        label="Salary"
                                        name="salary"
                                        value={formData.salary}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 50000"
                                        error={formErrors.salary}
                                    />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <InputField
                                            label="Religion"
                                            name="religion"
                                            value={formData.religion}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Islam"
                                        />
                                        <InputField
                                            label="Nationality"
                                            name="nationality"
                                            value={formData.nationality}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Pakistani"
                                        />
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '12px',
                                    paddingTop: '16px',
                                    borderTop: '1px solid var(--border-color)',
                                    marginTop: '8px'
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
                                        type="submit"
                                        onClick={handleEditSubmit}
                                        disabled={actionLoading}
                                        style={{
                                            padding: '10px 28px',
                                            border: 'none',
                                            borderRadius: '10px',
                                            background: actionLoading ? '#93c5fd' : 'var(--primary-color)',
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
                                                e.target.style.background = '#1D4ED8';
                                                e.target.style.transform = 'translateY(-1px)';
                                                e.target.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.3)';
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
                                        <Save size={18} />
                                        {actionLoading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeleteOpen && (
                <div className="hms-modal-backdrop" onClick={() => setIsDeleteOpen(false)}>
                    <div className="hms-modal small" onClick={(e) => e.stopPropagation()} style={{
                        maxWidth: '420px',
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
                                <Trash2 size={20} /> Delete Staff Record
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
                                This will permanently delete <strong>{selectedStaff?.name}</strong>'s staff record.
                            </p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '8px' }}>
                                This action cannot be undone.
                            </p>
                        </div>

                        <div className="hms-modal-footer" style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '8px',
                            padding: '14px 20px',
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
                                    fontSize: '0.85rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'var(--text-secondary)',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => { e.target.style.background = 'var(--hover-bg)'; }}
                                onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteSubmit}
                                disabled={actionLoading}
                                style={{
                                    padding: '8px 20px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    background: actionLoading ? '#fca5a5' : 'var(--danger-color)',
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
                                        e.target.style.background = 'var(--danger-hover)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!actionLoading) {
                                        e.target.style.background = 'var(--danger-color)';
                                    }
                                }}
                            >
                                <Trash2 size={16} />
                                {actionLoading ? 'Deleting...' : 'Delete Staff'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default Staff;