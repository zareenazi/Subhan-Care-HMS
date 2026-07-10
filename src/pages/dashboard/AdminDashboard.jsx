import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Users, Calendar, FileText, Bed,
    Activity, BookOpen, Menu,
    UserPlus, Search, LogOut,
    Settings, User, ChevronDown,
    Loader, AlertCircle, Pill, DollarSign, Stethoscope,
    Eye, Clock, RefreshCw, X, Home, HelpCircle
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import SidebarOverlay from '../../components/SidebarOverlay';
import { supabase } from '../../services/supabaseClient';

const AdminDashboard = () => {
    const { user, signOut, loading } = useAuth();
    const navigate = useNavigate();

    // ===== STATE =====
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState('');
    const [currentTime, setCurrentTime] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [theme, setTheme] = useState('light');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // ===== ACTIVITY VIEW STATE =====
    const [showActivityView, setShowActivityView] = useState(false);
    const [allActivities, setAllActivities] = useState([]);
    const [activityFilter, setActivityFilter] = useState('all');
    const [activitySearch, setActivitySearch] = useState('');
    const [activityLoading, setActivityLoading] = useState(false);

    // ===== REAL DATA STATE =====
    const [statsData, setStatsData] = useState({
        activePatients: 0,
        todayAppointments: 0,
        totalPrescriptions: 0,
        bedOccupancy: '0%',
        bedDetails: '0 / 0 beds in use',
        totalDoctors: 0,
        totalRevenue: 0,
        totalStaff: 0
    });
    const [activities, setActivities] = useState([]);

    // ===== USER DATA =====
    const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Guest';
    const userRole = user?.user_metadata?.role || 'Admin';
    const userEmail = user?.email || '';
    const userInitial = userName.charAt(0).toUpperCase();

    // ============================================================
    // ===== TIME AGO FUNCTION =====
    // ============================================================
    const timeAgo = (timestamp) => {
        if (!timestamp) return 'Just now';
        const now = new Date();
        const then = new Date(timestamp);
        const diff = Math.floor((now - then) / 1000);
        if (diff < 60) return `${diff} sec ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
        return `${Math.floor(diff / 86400)} days ago`;
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    // ============================================================
    // ===== FETCH ALL ACTIVITIES =====
    // ============================================================
    const fetchAllActivities = async () => {
        setActivityLoading(true);
        try {
            console.log('🔄 Fetching all activities...');
            const activitiesList = [];

            // ===== 1. PATIENTS =====
            const { data: patients } = await supabase
                .from('patients')
                .select('id, name, phone, created_at')
                .order('created_at', { ascending: false })
                .limit(20);

            if (patients) {
                patients.forEach(p => {
                    activitiesList.push({
                        id: `patient-${p.id}`,
                        type: 'patient',
                        title: 'New Patient Registered',
                        description: `${p.name} was added to the system`,
                        details: p.phone ? `Phone: ${p.phone}` : '',
                        timestamp: p.created_at,
                        timeAgo: timeAgo(p.created_at),
                        color: '#2563EB',
                        icon: User,
                        link: `/patients/${p.id}`
                    });
                });
            }

            // ===== 2. APPOINTMENTS =====
            const { data: appointments } = await supabase
                .from('appointments')
                .select(`
                    id,
                    appointment_date,
                    time_slot,
                    status,
                    created_at,
                    patients (name),
                    doctors (name)
                `)
                .order('created_at', { ascending: false })
                .limit(20);

            if (appointments) {
                appointments.forEach(a => {
                    const patientName = a.patients?.name || 'Unknown Patient';
                    const doctorName = a.doctors?.name || 'Unknown Doctor';
                    activitiesList.push({
                        id: `appointment-${a.id}`,
                        type: 'appointment',
                        title: 'Appointment Scheduled',
                        description: `${patientName} booked with Dr. ${doctorName}`,
                        details: `${a.appointment_date} at ${a.time_slot} • Status: ${a.status || 'Scheduled'}`,
                        timestamp: a.created_at,
                        timeAgo: timeAgo(a.created_at),
                        color: '#22C55E',
                        icon: Calendar,
                        link: `/appointments`
                    });
                });
            }

            // ===== 3. PRESCRIPTIONS =====
            const { data: prescriptions } = await supabase
                .from('prescriptions')
                .select(`
                    id,
                    medications,
                    diagnosis,
                    created_at,
                    patients (name),
                    doctors (name)
                `)
                .order('created_at', { ascending: false })
                .limit(20);

            if (prescriptions) {
                prescriptions.forEach(p => {
                    const patientName = p.patients?.name || 'Unknown Patient';
                    const doctorName = p.doctors?.name || 'Unknown Doctor';
                    const medShort = p.medications?.substring(0, 40) || 'No medications';
                    activitiesList.push({
                        id: `prescription-${p.id}`,
                        type: 'prescription',
                        title: 'New Prescription Issued',
                        description: `For ${patientName} by Dr. ${doctorName}`,
                        details: `Medications: ${medShort}${p.medications?.length > 40 ? '...' : ''}`,
                        timestamp: p.created_at,
                        timeAgo: timeAgo(p.created_at),
                        color: '#8B5CF6',
                        icon: Pill,
                        link: `/prescriptions`
                    });
                });
            }

            // ===== 4. DOCTORS =====
            const { data: doctors } = await supabase
                .from('doctors')
                .select('id, name, specialization, created_at')
                .order('created_at', { ascending: false })
                .limit(10);

            if (doctors) {
                doctors.forEach(d => {
                    activitiesList.push({
                        id: `doctor-${d.id}`,
                        type: 'doctor',
                        title: 'New Doctor Added',
                        description: `Dr. ${d.name} joined the team`,
                        details: d.specialization ? `Specialization: ${d.specialization}` : '',
                        timestamp: d.created_at,
                        timeAgo: timeAgo(d.created_at),
                        color: '#EC4899',
                        icon: Stethoscope,
                        link: `/doctors`
                    });
                });
            }

            // ===== 5. STAFF =====
            const { data: staff } = await supabase
                .from('staff')
                .select('id, name, role, created_at')
                .order('created_at', { ascending: false })
                .limit(10);

            if (staff) {
                staff.forEach(s => {
                    activitiesList.push({
                        id: `staff-${s.id}`,
                        type: 'staff',
                        title: 'New Staff Member Added',
                        description: `${s.name} joined as ${s.role || 'Staff'}`,
                        details: `Role: ${s.role || 'Staff'}`,
                        timestamp: s.created_at,
                        timeAgo: timeAgo(s.created_at),
                        color: '#F59E0B',
                        icon: User,
                        link: `/staff`
                    });
                });
            }

            // Sort by timestamp (newest first)
            activitiesList.sort((a, b) => {
                return new Date(b.timestamp) - new Date(a.timestamp);
            });

            setAllActivities(activitiesList);
            console.log('✅ All activities loaded:', activitiesList.length);

        } catch (err) {
            console.error('❌ Error fetching activities:', err);
        } finally {
            setActivityLoading(false);
        }
    };

    // ============================================================
    // ===== FETCH DASHBOARD DATA =====
    // ============================================================
    const fetchDashboardData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            console.log('🔄 Fetching admin dashboard data...');

            // ===== 1. GET PATIENTS COUNT =====
            const { count: totalPatients } = await supabase
                .from('patients')
                .select('*', { count: 'exact', head: true });

            // ===== 2. GET TODAY'S APPOINTMENTS =====
            const today = new Date().toISOString().split('T')[0];
            const { count: todayAppointments } = await supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .eq('appointment_date', today);

            // ===== 3. GET TOTAL PRESCRIPTIONS =====
            const { count: totalPrescriptions } = await supabase
                .from('prescriptions')
                .select('*', { count: 'exact', head: true });

            // ===== 4. GET BED OCCUPANCY =====
            const { data: beds } = await supabase
                .from('beds')
                .select('*');

            const totalBeds = beds?.length || 0;
            const occupiedBeds = beds?.filter(b => b.status === 'occupied' || b.status === 'Occupied').length || 0;
            const bedOccupancy = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

            // ===== 5. GET DOCTORS COUNT =====
            const { count: totalDoctors } = await supabase
                .from('doctors')
                .select('*', { count: 'exact', head: true });

            // ===== 6. GET STAFF COUNT (FROM STAFF TABLE) =====
            const { count: staffCount } = await supabase
                .from('staff')
                .select('*', { count: 'exact', head: true });

            // ===== 7. GET TOTAL STAFF = Staff + Doctors =====
            const totalStaff = (staffCount || 0) + (totalDoctors || 0);
            console.log('📊 Staff count:', staffCount);
            console.log('📊 Doctors count:', totalDoctors);
            console.log('📊 Total staff:', totalStaff);

            // ===== 8. GET RECENT ACTIVITIES =====
            const activitiesList = [];

            // Recent patients
            const { data: recentPatients } = await supabase
                .from('patients')
                .select('id, name, created_at')
                .order('created_at', { ascending: false })
                .limit(3);

            if (recentPatients) {
                recentPatients.forEach(p => {
                    activitiesList.push({
                        id: `patient-${p.id}`,
                        text: `New patient registered: <strong>${p.name}</strong>`,
                        time: timeAgo(p.created_at),
                        color: '#2563EB',
                        type: 'patient'
                    });
                });
            }

            // Recent prescriptions
            const { data: recentPrescriptions } = await supabase
                .from('prescriptions')
                .select('id, medications, created_at')
                .order('created_at', { ascending: false })
                .limit(3);

            if (recentPrescriptions) {
                recentPrescriptions.forEach(p => {
                    const medShort = p.medications?.substring(0, 30) || 'Medicine';
                    activitiesList.push({
                        id: `prescription-${p.id}`,
                        text: `New prescription added: <strong>${medShort}...</strong>`,
                        time: timeAgo(p.created_at),
                        color: '#8B5CF6',
                        type: 'prescription'
                    });
                });
            }

            // Recent appointments
            const { data: recentAppointments } = await supabase
                .from('appointments')
                .select(`
                    id,
                    appointment_date,
                    time_slot,
                    created_at,
                    patients (name)
                `)
                .order('created_at', { ascending: false })
                .limit(3);

            if (recentAppointments) {
                recentAppointments.forEach(a => {
                    const patientName = a.patients?.name || 'Unknown';
                    activitiesList.push({
                        id: `appointment-${a.id}`,
                        text: `Appointment scheduled for <strong>${patientName}</strong> on ${a.appointment_date}`,
                        time: timeAgo(a.created_at),
                        color: '#22C55E',
                        type: 'appointment'
                    });
                });
            }

            // Sort by time (newest first)
            activitiesList.sort((a, b) => {
                const timeA = parseInt(a.time) || 0;
                const timeB = parseInt(b.time) || 0;
                return timeA - timeB;
            });

            setStatsData({
                activePatients: totalPatients || 0,
                todayAppointments: todayAppointments || 0,
                totalPrescriptions: totalPrescriptions || 0,
                bedOccupancy: totalBeds > 0 ? `${bedOccupancy}%` : '0%',
                bedDetails: totalBeds > 0 ? `${occupiedBeds} / ${totalBeds} beds in use` : 'No beds available',
                totalDoctors: totalDoctors || 0,
                totalRevenue: 0,
                totalStaff: totalStaff || 0
            });
            setActivities(activitiesList.slice(0, 6));

        } catch (err) {
            console.error('❌ Error fetching dashboard data:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // ============================================================
    // ===== EFFECTS =====
    // ============================================================
    useEffect(() => {
        fetchDashboardData();
        const handleDataChange = () => {
            console.log('🔄 Data changed, refreshing dashboard...');
            fetchDashboardData();
        };
        window.addEventListener('patientAdded', handleDataChange);
        window.addEventListener('prescriptionAdded', handleDataChange);
        window.addEventListener('appointmentAdded', handleDataChange);
        window.addEventListener('bedChanged', handleDataChange);
        window.addEventListener('staffChanged', handleDataChange);
        window.addEventListener('doctorChanged', handleDataChange);
        window.addEventListener('appointmentChanged', handleDataChange);
        window.addEventListener('prescriptionChanged', handleDataChange);
        return () => {
            window.removeEventListener('patientAdded', handleDataChange);
            window.removeEventListener('prescriptionAdded', handleDataChange);
            window.removeEventListener('appointmentAdded', handleDataChange);
            window.removeEventListener('bedChanged', handleDataChange);
            window.removeEventListener('staffChanged', handleDataChange);
            window.removeEventListener('doctorChanged', handleDataChange);
            window.removeEventListener('appointmentChanged', handleDataChange);
            window.removeEventListener('prescriptionChanged', handleDataChange);
        };
    }, []);

    // ===== THEME =====
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    // ===== DATE/TIME =====
    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            setCurrentDate(now.toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            }));
            setCurrentTime(now.toLocaleTimeString('en-US', {
                hour: '2-digit', minute: '2-digit'
            }));
        };
        updateDateTime();
        const interval = setInterval(updateDateTime, 60000);
        return () => clearInterval(interval);
    }, []);

    // ===== DROPDOWN =====
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ============================================================
    // ===== HANDLERS =====
    // ============================================================
    const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const closeSidebar = () => setSidebarOpen(false);

    const handleMyProfile = () => {
        setIsDropdownOpen(false);
        navigate('/my-profile');
    };

    const handleSettings = () => {
        setIsDropdownOpen(false);
        navigate('/settings');
    };

    const handleSignOut = async () => {
        setIsDropdownOpen(false);
        try {
            await signOut();
            navigate('/login');
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    const handleNavigate = (page) => {
        navigate(`/${page}`);
        closeSidebar();
    };

    const handleStatClick = (statName) => {
        const routeMap = {
            'Active Patients': '/patients',
            "Today's Appointments": '/appointments',
            'Total Prescriptions': '/prescriptions',
            'Bed Occupancy': '/beds',
            'Total Doctors': '/doctors',
            'Total Staff': '/staff'
        };
        navigate(routeMap[statName] || '/dashboard');
        closeSidebar();
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    const handleRegisterPatient = () => {
        navigate('/patients/add');
        closeSidebar();
        setTimeout(() => fetchDashboardData(), 1000);
    };

    const handleScheduleAppointment = () => {
        navigate('/appointments');
        closeSidebar();
        setTimeout(() => fetchDashboardData(), 1000);
    };

    const handleNewPrescription = () => {
        navigate('/prescriptions');
        closeSidebar();
        setTimeout(() => fetchDashboardData(), 1000);
    };

    const handleVitalSigns = () => {
        navigate('/vitals');
        closeSidebar();
    };

    const handleManageDoctors = () => {
        navigate('/doctors');
        closeSidebar();
    };

    const handleManageStaff = () => {
        navigate('/staff');
        closeSidebar();
    };

    const handleGenerateInvoice = () => {
        navigate('/invoices/generate');
        closeSidebar();
    };

    const handleOpenHandbook = () => {
        window.open('/handbook.pdf', '_blank');
    };

    const handleViewAllActivity = async () => {
        await fetchAllActivities();
        setShowActivityView(true);
        closeSidebar();
    };

    const closeActivityView = () => {
        setShowActivityView(false);
        setAllActivities([]);
    };

    // ============================================================
    // ===== FILTER ACTIVITIES =====
    // ============================================================
    const filteredActivities = allActivities.filter(activity => {
        if (activityFilter !== 'all' && activity.type !== activityFilter) {
            return false;
        }
        if (activitySearch.trim() !== '') {
            const query = activitySearch.toLowerCase().trim();
            return activity.title.toLowerCase().includes(query) ||
                activity.description.toLowerCase().includes(query) ||
                activity.details.toLowerCase().includes(query);
        }
        return true;
    });

    const getTypeLabel = (type) => {
        const labels = {
            patient: 'Patient',
            appointment: 'Appointment',
            prescription: 'Prescription',
            doctor: 'Doctor',
            staff: 'Staff'
        };
        return labels[type] || type;
    };

    const filterOptions = [
        { value: 'all', label: 'All Activities' },
        { value: 'patient', label: 'Patients' },
        { value: 'appointment', label: 'Appointments' },
        { value: 'prescription', label: 'Prescriptions' },
        { value: 'doctor', label: 'Doctors' },
        { value: 'staff', label: 'Staff' }
    ];

    // ============================================================
    // ===== STATS =====
    // ============================================================
    const stats = [
        {
            icon: Users,
            value: statsData.activePatients,
            label: 'Active Patients',
            trend: `Total patients`,
            up: statsData.activePatients > 0,
            color: '#2563EB',
            onClick: () => handleStatClick('Active Patients')
        },
        {
            icon: Calendar,
            value: statsData.todayAppointments,
            label: "Today's Appointments",
            trend: statsData.todayAppointments > 0 ? `${statsData.todayAppointments} scheduled` : 'No appointments',
            up: statsData.todayAppointments > 0,
            color: '#22C55E',
            onClick: () => handleStatClick("Today's Appointments")
        },
        {
            icon: Pill,
            value: statsData.totalPrescriptions,
            label: 'Total Prescriptions',
            trend: `${statsData.totalPrescriptions} issued`,
            up: statsData.totalPrescriptions > 0,
            color: '#8B5CF6',
            onClick: () => handleStatClick('Total Prescriptions')
        },
        {
            icon: Bed,
            value: statsData.bedOccupancy,
            label: 'Bed Occupancy',
            trend: statsData.bedDetails,
            up: parseInt(statsData.bedOccupancy) < 80,
            color: '#F59E0B',
            onClick: () => handleStatClick('Bed Occupancy')
        }
    ];

    const extraStats = [
        {
            icon: Stethoscope,
            value: statsData.totalDoctors,
            label: 'Total Doctors',
            color: '#EC4899',
            onClick: () => handleStatClick('Total Doctors')
        },
        {
            icon: Users,
            value: statsData.totalStaff,
            label: 'Total Staff',
            color: '#F59E0B',
            onClick: () => handleStatClick('Total Staff')
        }
    ];

    const quickActions = [
        { icon: UserPlus, label: 'Register Patient', color: '#2563EB', onClick: handleRegisterPatient },
        { icon: Calendar, label: 'Schedule Appointment', color: '#22C55E', onClick: handleScheduleAppointment },
        { icon: Pill, label: 'New Prescription', color: '#8B5CF6', onClick: handleNewPrescription },
        { icon: Activity, label: 'Vital Signs', color: '#EF4444', onClick: handleVitalSigns },
        { icon: Stethoscope, label: 'Manage Doctors', color: '#EC4899', onClick: handleManageDoctors },
        { icon: Users, label: 'Manage Staff', color: '#F59E0B', onClick: handleManageStaff },
        { icon: DollarSign, label: 'Generate Invoice', color: '#10B981', onClick: handleGenerateInvoice },
        { icon: Eye, label: 'View All Activity', color: '#8B5CF6', onClick: handleViewAllActivity },
    ];

    // ============================================================
    // ===== LOADING / ERROR =====
    // ============================================================
    if (loading || isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px', background: 'var(--bg-primary)' }}>
                <Loader size={40} className="spinner" />
                <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px', background: 'var(--bg-primary)', padding: '24px' }}>
                <AlertCircle size={48} color="var(--danger-color)" />
                <h2 style={{ color: 'var(--text-primary)' }}>Error Loading Dashboard</h2>
                <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
                <button onClick={fetchDashboardData} style={{ padding: '10px 24px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Retry</button>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <Sidebar
                active="dashboard"
                onNavigate={handleNavigate}
                user={user}
                onSignOut={handleSignOut}
                theme={theme}
                toggleTheme={toggleTheme}
                onClose={closeSidebar}
                isOpen={sidebarOpen}
            />
            <SidebarOverlay show={sidebarOpen} onClick={closeSidebar} />

            <div className="main-content">
                <header className="dashboard-header">
                    <div className="header-left">
                        <button className="hamburger-btn" onClick={toggleSidebar} aria-label="Toggle sidebar">
                            <Menu size={22} />
                        </button>
                        <h1>Dashboard</h1>
                        <form onSubmit={handleSearch} className="header-search-form">
                            <Search size={18} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </form>
                    </div>
                    <div className="header-right">
                        <span className="header-date">{currentDate}</span>
                        <span className="header-time">{currentTime}</span>
                        <button
                            onClick={fetchDashboardData}
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
                                e.currentTarget.style.color = 'var(--primary-color)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'var(--text-secondary)';
                            }}
                            title="Refresh"
                        >
                            <RefreshCw size={18} />
                        </button>

                        {/* ===== PROFILE DROPDOWN ===== */}
                        <div className="profile-dropdown" ref={dropdownRef}>
                            <div className="profile-trigger" onClick={toggleDropdown}>
                                <div className="header-avatar">{userInitial}</div>
                                <div className="profile-info">
                                    <div className="profile-name">{userName}</div>
                                    <div className="profile-role">{userRole}</div>
                                </div>
                                <ChevronDown size={16} className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`} />
                            </div>

                            {isDropdownOpen && (
                                <div className="dropdown-menu">
                                    <div className="dropdown-header">
                                        <div className="dropdown-avatar">{userInitial}</div>
                                        <div>
                                            <div className="dropdown-name">{userName}</div>
                                            <div className="dropdown-email">{userEmail}</div>
                                        </div>
                                    </div>

                                    <div className="dropdown-divider" />

                                    <div className="dropdown-item" onClick={handleMyProfile}>
                                        <User size={18} />
                                        <span>My Profile</span>
                                    </div>

                                    <div className="dropdown-item" onClick={handleSettings}>
                                        <Settings size={18} />
                                        <span>Settings</span>
                                    </div>

                                    <div className="dropdown-item" onClick={() => { setIsDropdownOpen(false); navigate('/dashboard'); }}>
                                        <Home size={18} />
                                        <span>Dashboard</span>
                                    </div>

                                    <div className="dropdown-item" onClick={() => { setIsDropdownOpen(false); navigate('/support'); }}>
                                        <HelpCircle size={18} />
                                        <span>Help & Support</span>
                                    </div>

                                    <div className="dropdown-divider" />

                                    <div className="dropdown-item danger" onClick={handleSignOut}>
                                        <LogOut size={18} />
                                        <span>Sign Out</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="dashboard-content">
                    {/* ===== ACTIVITY VIEW OVERLAY ===== */}
                    {showActivityView && (
                        <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.6)',
                            zIndex: 9999,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px',
                            backdropFilter: 'blur(4px)'
                        }} onClick={closeActivityView}>
                            <div style={{
                                background: 'var(--card-bg)',
                                borderRadius: '16px',
                                maxWidth: '900px',
                                width: '100%',
                                maxHeight: '85vh',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                                border: '1px solid var(--border-color)'
                            }} onClick={(e) => e.stopPropagation()}>
                                {/* Header */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '16px 20px',
                                    borderBottom: '1px solid var(--border-color)',
                                    background: 'var(--bg-primary)',
                                    flexShrink: 0
                                }}>
                                    <div>
                                        <h3 style={{
                                            fontSize: '1.1rem',
                                            fontWeight: 600,
                                            color: 'var(--text-primary)',
                                            margin: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            <ActivityIcon size={20} style={{ color: 'var(--primary-color)' }} />
                                            All Recent Activity
                                        </h3>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            View all activities across the hospital
                                        </p>
                                    </div>
                                    <button
                                        onClick={closeActivityView}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'var(--text-secondary)',
                                            padding: '6px',
                                            borderRadius: '6px',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
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
                                        <span style={{ fontSize: '0.75rem' }}>Close</span>
                                    </button>
                                </div>

                                {/* Filters */}
                                <div style={{
                                    padding: '12px 20px',
                                    borderBottom: '1px solid var(--border-color)',
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '10px',
                                    alignItems: 'center',
                                    background: 'var(--bg-primary)',
                                    flexShrink: 0
                                }}>
                                    <div style={{ flex: 1, minWidth: '180px', position: 'relative' }}>
                                        <Search size={16} style={{
                                            position: 'absolute',
                                            left: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: 'var(--text-muted)'
                                        }} />
                                        <input
                                            type="text"
                                            placeholder="Search activities..."
                                            value={activitySearch}
                                            onChange={(e) => setActivitySearch(e.target.value)}
                                            style={{
                                                width: '100%',
                                                height: '34px',
                                                padding: '4px 12px 4px 34px',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '8px',
                                                fontSize: '0.8rem',
                                                fontFamily: 'var(--font-family)',
                                                background: 'var(--bg-primary)',
                                                color: 'var(--text-primary)',
                                                outline: 'none'
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
                                    <select
                                        value={activityFilter}
                                        onChange={(e) => setActivityFilter(e.target.value)}
                                        style={{
                                            height: '34px',
                                            padding: '0 12px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '8px',
                                            fontSize: '0.75rem',
                                            fontFamily: 'var(--font-family)',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {filterOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {filteredActivities.length} activity{filteredActivities.length !== 1 ? 'ies' : ''}
                                    </span>
                                </div>

                                {/* Activities List */}
                                <div style={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    padding: '16px 20px',
                                    background: 'var(--bg-primary)'
                                }}>
                                    {activityLoading ? (
                                        <div style={{ textAlign: 'center', padding: '40px' }}>
                                            <Loader size={32} className="spinner" />
                                            <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>Loading activities...</p>
                                        </div>
                                    ) : filteredActivities.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                            <ActivityIcon size={40} style={{ color: 'var(--text-muted)' }} />
                                            <p style={{ marginTop: '12px' }}>No activities found</p>
                                        </div>
                                    ) : (
                                        filteredActivities.map((activity, index) => {
                                            const Icon = activity.icon;
                                            return (
                                                <div
                                                    key={activity.id}
                                                    onClick={() => {
                                                        if (activity.link) {
                                                            closeActivityView();
                                                            setTimeout(() => navigate(activity.link), 300);
                                                        }
                                                    }}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                        gap: '12px',
                                                        padding: '12px 14px',
                                                        borderBottom: index < filteredActivities.length - 1 ? '1px solid var(--border-color)' : 'none',
                                                        cursor: activity.link ? 'pointer' : 'default',
                                                        transition: 'all 0.2s ease',
                                                        borderRadius: '8px'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (activity.link) {
                                                            e.currentTarget.style.background = 'var(--hover-bg)';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'transparent';
                                                    }}
                                                >
                                                    <div style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '8px',
                                                        background: `${activity.color}15`,
                                                        color: activity.color,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0
                                                    }}>
                                                        <Icon size={16} />
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'flex-start',
                                                            flexWrap: 'wrap',
                                                            gap: '4px'
                                                        }}>
                                                            <div>
                                                                <div style={{
                                                                    fontSize: '0.85rem',
                                                                    fontWeight: 600,
                                                                    color: 'var(--text-primary)'
                                                                }}>
                                                                    {activity.title}
                                                                </div>
                                                                <div style={{
                                                                    fontSize: '0.75rem',
                                                                    color: 'var(--text-secondary)'
                                                                }}>
                                                                    {activity.description}
                                                                </div>
                                                                {activity.details && (
                                                                    <div style={{
                                                                        fontSize: '0.7rem',
                                                                        color: 'var(--text-muted)',
                                                                        marginTop: '2px'
                                                                    }}>
                                                                        {activity.details}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                flexShrink: 0,
                                                                marginLeft: '12px'
                                                            }}>
                                                                <span style={{
                                                                    fontSize: '0.55rem',
                                                                    padding: '2px 8px',
                                                                    borderRadius: '10px',
                                                                    background: `${activity.color}15`,
                                                                    color: activity.color,
                                                                    fontWeight: 500,
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: '0.3px'
                                                                }}>
                                                                    {getTypeLabel(activity.type)}
                                                                </span>
                                                                <span style={{
                                                                    fontSize: '0.65rem',
                                                                    color: 'var(--text-muted)',
                                                                    whiteSpace: 'nowrap'
                                                                }}>
                                                                    <Clock size={11} style={{ display: 'inline', marginRight: '3px' }} />
                                                                    {activity.timeAgo}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div style={{
                                                            fontSize: '0.6rem',
                                                            color: 'var(--text-muted)',
                                                            marginTop: '2px'
                                                        }}>
                                                            {formatDate(activity.timestamp)}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== WELCOME ===== */}
                    <div className="welcome-section" style={{
                        background: 'linear-gradient(135deg, var(--primary-color), #7C3AED)',
                        padding: '20px 24px',
                        borderRadius: '16px',
                        color: 'white',
                        marginBottom: '24px'
                    }}>
                        <div className="welcome-text">
                            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '4px' }}>
                                Welcome back, {userName}! 👋
                            </h2>
                            <p style={{ opacity: 0.9, fontSize: '0.9rem' }}>
                                You're signed in as <strong>{userRole}</strong>. Here's what's happening today.
                            </p>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '8px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                                <span>👥 Patients: {statsData.activePatients}</span>
                                <span>📅 Appointments: {statsData.todayAppointments}</span>
                                <span>💊 Prescriptions: {statsData.totalPrescriptions}</span>
                                <span>🛏️ Beds: {statsData.bedDetails}</span>
                                <span>👨‍⚕️ Doctors: {statsData.totalDoctors}</span>
                                <span>👤 Staff: {statsData.totalStaff}</span>
                            </div>
                        </div>
                    </div>

                    {/* ===== STATS GRID ===== */}
                    <div className="stats-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '16px',
                        marginBottom: '16px'
                    }}>
                        {stats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <div
                                    key={index}
                                    className="stat-card"
                                    onClick={stat.onClick}
                                    style={{
                                        cursor: 'pointer',
                                        padding: '16px',
                                        background: 'var(--card-bg)',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border-color)',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.borderColor = stat.color;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.borderColor = 'var(--border-color)';
                                    }}
                                >
                                    <div className="stat-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <div className="stat-card-icon" style={{
                                            backgroundColor: `${stat.color}15`,
                                            color: stat.color,
                                            padding: '8px',
                                            borderRadius: '10px',
                                            display: 'flex'
                                        }}>
                                            <Icon size={20} />
                                        </div>
                                    </div>
                                    <div className="stat-card-value" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</div>
                                    <div className="stat-card-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stat.label}</div>
                                    <div className={`stat-card-trend ${stat.up ? 'up' : 'down'}`} style={{
                                        fontSize: '0.7rem',
                                        color: stat.up ? 'var(--success-color)' : 'var(--danger-color)',
                                        marginTop: '4px'
                                    }}>{stat.trend}</div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ===== EXTRA STATS ===== */}
                    <div className="stats-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '16px',
                        marginBottom: '24px'
                    }}>
                        {extraStats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <div
                                    key={index}
                                    className="stat-card"
                                    onClick={stat.onClick}
                                    style={{
                                        cursor: 'pointer',
                                        padding: '16px',
                                        background: 'var(--card-bg)',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border-color)',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.borderColor = stat.color;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.borderColor = 'var(--border-color)';
                                    }}
                                >
                                    <div className="stat-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <div className="stat-card-icon" style={{
                                            backgroundColor: `${stat.color}15`,
                                            color: stat.color,
                                            padding: '8px',
                                            borderRadius: '10px',
                                            display: 'flex'
                                        }}>
                                            <Icon size={20} />
                                        </div>
                                    </div>
                                    <div className="stat-card-value" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</div>
                                    <div className="stat-card-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stat.label}</div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ===== TWO COLUMN ===== */}
                    <div className="dashboard-two-col" style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '20px',
                        marginBottom: '24px'
                    }}>
                        {/* ===== RECENT ACTIVITY ===== */}
                        <div className="activity-card" style={{
                            background: 'var(--card-bg)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            padding: '16px'
                        }}>
                            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div>
                                    <h3 className="card-title" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Recent Activity</h3>
                                    <p className="card-subtitle" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>What happened in the last few hours.</p>
                                </div>
                                <span
                                    className="view-all-link"
                                    onClick={handleViewAllActivity}
                                    style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--primary-color)',
                                        cursor: 'pointer',
                                        fontWeight: 500,
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.textDecoration = 'underline';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.textDecoration = 'none';
                                    }}
                                >
                                    View All →
                                </span>
                            </div>
                            {activities.length > 0 ? (
                                activities.map((activity) => (
                                    <div
                                        key={activity.id}
                                        className="activity-item"
                                        style={{
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '8px 0',
                                            borderBottom: '1px solid var(--border-color)',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'var(--hover-bg)';
                                            e.currentTarget.style.paddingLeft = '4px';
                                            e.currentTarget.style.borderRadius = '4px';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.paddingLeft = '0';
                                            e.currentTarget.style.borderRadius = '0';
                                        }}
                                        onClick={() => {
                                            if (activity.type === 'patient') navigate('/patients');
                                            else if (activity.type === 'prescription') navigate('/prescriptions');
                                            else if (activity.type === 'appointment') navigate('/appointments');
                                        }}
                                    >
                                        <div className="activity-dot" style={{
                                            backgroundColor: activity.color,
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            flexShrink: 0
                                        }} />
                                        <div className="activity-content" style={{ flex: 1 }}>
                                            <p className="activity-text" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0 }}>
                                                <span dangerouslySetInnerHTML={{ __html: activity.text }} />
                                            </p>
                                            <div className="activity-time" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                <Clock size={11} style={{ display: 'inline', marginRight: '4px' }} />
                                                {activity.time}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No recent activities</p>
                            )}
                        </div>

                        {/* ===== QUICK ACTIONS ===== */}
                        <div className="quick-actions-card" style={{
                            background: 'var(--card-bg)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            padding: '16px'
                        }}>
                            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div>
                                    <h3 className="card-title" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Quick Actions</h3>
                                    <p className="card-subtitle" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Get to where you need to go in a click.</p>
                                </div>
                            </div>
                            <div className="quick-actions-grid" style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '8px'
                            }}>
                                {quickActions.map((action, index) => {
                                    const Icon = action.icon;
                                    return (
                                        <button
                                            key={index}
                                            className="quick-action-btn"
                                            onClick={action.onClick}
                                            style={{
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '10px 12px',
                                                background: 'var(--bg-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '8px',
                                                transition: 'all 0.3s ease',
                                                fontFamily: 'var(--font-family)',
                                                fontSize: '0.75rem',
                                                color: 'var(--text-primary)',
                                                fontWeight: 500,
                                                width: '100%'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.borderColor = action.color;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.boxShadow = 'none';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                            }}
                                        >
                                            <div className="quick-action-icon" style={{
                                                backgroundColor: `${action.color}15`,
                                                color: action.color,
                                                padding: '6px',
                                                borderRadius: '6px',
                                                display: 'flex'
                                            }}>
                                                <Icon size={14} />
                                            </div>
                                            {action.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* ===== TRAINING CARD ===== */}
                    <div className="training-card" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px 20px',
                        background: 'var(--card-bg)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        flexWrap: 'wrap',
                        gap: '12px'
                    }}>
                        <div className="training-card-content" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="training-icon" style={{
                                padding: '8px',
                                background: 'var(--primary-color)15',
                                borderRadius: '8px',
                                color: 'var(--primary-color)'
                            }}>
                                <BookOpen size={20} />
                            </div>
                            <div className="training-text" style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                <strong>Need Training?</strong> Open the intern handbook for role onboarding.
                            </div>
                        </div>
                        <button
                            className="training-btn"
                            onClick={handleOpenHandbook}
                            style={{
                                padding: '6px 16px',
                                background: 'var(--primary-color)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                fontFamily: 'var(--font-family)',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#1D4ED8';
                                e.currentTarget.style.transform = 'scale(1.02)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'var(--primary-color)';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            Open Handbook →
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                /* ===== DROPDOWN STYLES ===== */
                .profile-dropdown {
                    position: relative;
                }

                .profile-trigger {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    padding: 4px 12px 4px 4px;
                    border-radius: 50px;
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    transition: all 0.2s ease;
                }

                .profile-trigger:hover {
                    background: var(--hover-bg);
                    border-color: var(--primary-color);
                }

                .header-avatar {
                    width: 34px;
                    height: 34px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--primary-color), #7C3AED);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 0.85rem;
                    flex-shrink: 0;
                }

                .profile-info {
                    display: flex;
                    flex-direction: column;
                    line-height: 1.2;
                }

                .profile-name {
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: var(--text-primary);
                }

                .profile-role {
                    font-size: 0.6rem;
                    color: var(--text-muted);
                }

                .dropdown-arrow {
                    color: var(--text-muted);
                    transition: transform 0.2s ease;
                }

                .dropdown-arrow.open {
                    transform: rotate(180deg);
                }

                /* ===== DROPDOWN MENU ===== */
                .dropdown-menu {
                    position: absolute;
                    top: calc(100% + 8px);
                    right: 0;
                    min-width: 240px;
                    background: var(--card-bg);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    box-shadow: var(--shadow-lg);
                    padding: 6px 0;
                    z-index: 1000;
                    animation: slideDown 0.2s ease;
                }

                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .dropdown-header {
                    padding: 10px 14px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    border-bottom: 1px solid var(--border-color);
                }

                .dropdown-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--primary-color), #7C3AED);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 1rem;
                    flex-shrink: 0;
                }

                .dropdown-name {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--text-primary);
                }

                .dropdown-email {
                    font-size: 0.65rem;
                    color: var(--text-muted);
                }

                .dropdown-divider {
                    margin: 4px 0;
                    border: none;
                    border-top: 1px solid var(--border-color);
                }

                .dropdown-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 14px;
                    width: 100%;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    font-size: 0.8rem;
                    color: var(--text-primary);
                    transition: all 0.15s ease;
                    font-family: var(--font-family);
                }

                .dropdown-item:hover {
                    background: var(--hover-bg);
                }

                .dropdown-item.danger {
                    color: var(--danger-color);
                }

                .dropdown-item.danger:hover {
                    background: rgba(239, 68, 68, 0.08);
                }

                .dropdown-item svg {
                    color: var(--text-muted);
                    flex-shrink: 0;
                }

                .dropdown-item.danger svg {
                    color: var(--danger-color);
                }

                /* ===== RESPONSIVE ===== */
                @media (max-width: 768px) {
                    .dashboard-two-col {
                        grid-template-columns: 1fr !important;
                    }
                    .stats-grid {
                        grid-template-columns: 1fr 1fr !important;
                    }
                    .quick-actions-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .header-right .header-date,
                    .header-right .header-time {
                        display: none;
                    }
                    .profile-info {
                        display: none !important;
                    }
                    .dropdown-menu {
                        min-width: 200px;
                        right: -10px;
                    }
                }

                @media (max-width: 480px) {
                    .stats-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .profile-trigger {
                        padding: 4px !important;
                    }
                    .header-avatar {
                        width: 28px !important;
                        height: 28px !important;
                        font-size: 0.7rem !important;
                    }
                    .dropdown-menu {
                        min-width: 180px;
                        right: -10px;
                    }
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;