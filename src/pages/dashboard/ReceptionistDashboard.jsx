import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus, CalendarDays, CheckCircle, Users,
  Clock, BookOpen, Menu, Search, LogOut, Loader, AlertCircle,
  Plus, Eye, Edit2, Trash2, Check, X, User,
  Calendar, DollarSign, FileText, Printer, Download,
  Filter, RefreshCw, ChevronDown, ChevronRight,
  MessageSquare, Wallet, Building, Hash, Stethoscope,
  Activity, ClipboardList, Syringe, TrendingUp, TrendingDown,
  BarChart3, PieChart, FileSpreadsheet, Send, Save,
  RotateCcw, MoreVertical, Phone, Mail, MapPin,
  Receipt, Truck, Package, ShoppingBag, Heart,
  Shield, Star, Award, CalendarDays as CalendarDaysIcon,
  Zap, Home, ArrowRight, Settings, Sparkles,
  ArrowLeft, AlertTriangle as AlertTriangleIcon,
  UserCircle, HelpCircle, Appointment, Bed,
  Pill as PillIcon, Clipboard as ClipboardIcon,
  FileText as FileTextIcon, Users as UsersIcon
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import SidebarOverlay from '../../components/SidebarOverlay';
import { supabase } from '../../services/supabaseClient';

const ReceptionistDashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  // ===== UI STATE =====
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // ===== TAB & VIEW STATE =====
  const [activeTab, setActiveTab] = useState('overview');
  const [currentView, setCurrentView] = useState('dashboard');

  // ===== PROFILE DROPDOWN =====
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // ===== USER INFO =====
  const userName = user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Guest';

  const userRole = user?.user_metadata?.role ||
    user?.user_metadata?.user_role ||
    'Receptionist';

  const userEmail = user?.email || '';
  const userInitial = userName.charAt(0).toUpperCase();

  // ===== HANDLE SIGN OUT =====
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // ===== PROFILE DROPDOWN OPTIONS =====
  const profileOptions = [
    { icon: UserCircle, label: 'My Profile', path: '/profile', color: '#3B82F6' },
    { icon: Settings, label: 'Settings', path: '/settings', color: '#6B7280' },
    { icon: HelpCircle, label: 'Help & Support', path: '/help', color: '#8B5CF6' },
    { icon: LogOut, label: 'Logout', path: null, color: '#EF4444', action: handleSignOut }
  ];

  // ===== DATA STATE =====
  const [statsData, setStatsData] = useState({
    newRegistrations: 0,
    pendingAppointments: 0,
    patientsToday: 0,
    waitingPatients: 0,
    totalPatients: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    todayAppointments: 0,
    weeklyAppointments: 0,
    monthlyAppointments: 0
  });

  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [pendingAppointments, setPendingAppointments] = useState([]);

  // ===== FORM STATE =====
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ===== ADD PATIENT FORM =====
  const [patientForm, setPatientForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    age: '',
    gender: '',
    blood_group: '',
    emergency_contact: '',
    emergency_phone: '',
    medical_history: '',
    allergies: '',
    notes: ''
  });

  // ===== ADD APPOINTMENT FORM =====
  const [appointmentForm, setAppointmentForm] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    reason: '',
    notes: '',
    status: 'scheduled'
  });

  // ===== EDIT APPOINTMENT FORM =====
  const [editAppointmentForm, setEditAppointmentForm] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    reason: '',
    notes: '',
    status: 'scheduled'
  });

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isEditAppointmentOpen, setIsEditAppointmentOpen] = useState(false);
  const [isDeleteAppointmentOpen, setIsDeleteAppointmentOpen] = useState(false);
  const [isViewAppointmentOpen, setIsViewAppointmentOpen] = useState(false);

  // ===== CONSTANTS =====
  const genders = ['Male', 'Female', 'Other'];
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const appointmentStatuses = ['scheduled', 'checked-in', 'in-progress', 'completed', 'cancelled', 'no-show'];

  // ===== RESPONSIVE =====
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }));
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // ===== CLOSE PROFILE DROPDOWN =====
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ===== FETCH DATA =====
  const fetchReceptionistData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const monthStart = new Date();
      monthStart.setDate(1);
      const monthStartStr = monthStart.toISOString().split('T')[0];

      // 1. Get all patients
      const { data: patientsData, count: totalPatients, error: patError } = await supabase
        .from('patients')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (patError) throw patError;

      // 2. Get new registrations today
      const { count: newRegistrations } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      // 3. Get all appointments
      const { data: appointmentsData, error: appError } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true });

      if (appError) throw appError;

      // 4. Get pending appointments (scheduled)
      const pending = appointmentsData?.filter(a => a.status === 'scheduled') || [];

      // 5. Get today's appointments
      const todayApps = appointmentsData?.filter(a => a.appointment_date === today) || [];

      // 6. Get waiting patients (checked-in)
      const waiting = appointmentsData?.filter(a => a.status === 'checked-in') || [];

      // 7. Get completed appointments
      const completed = appointmentsData?.filter(a => a.status === 'completed') || [];

      // 8. Get cancelled appointments
      const cancelled = appointmentsData?.filter(a => a.status === 'cancelled') || [];

      // 9. Get weekly appointments
      const weeklyApps = appointmentsData?.filter(a => a.appointment_date >= weekStartStr) || [];

      // 10. Get monthly appointments
      const monthlyApps = appointmentsData?.filter(a => a.appointment_date >= monthStartStr) || [];

      setPatients(patientsData || []);
      setAppointments(appointmentsData || []);
      setTodayAppointments(todayApps);
      setPendingAppointments(pending);

      // Recent activities
      const recentPatients = (patientsData || []).slice(0, 3).map(p => ({
        id: p.id,
        type: 'patient',
        title: `New patient registered: ${p.name}`,
        time: p.created_at,
        status: 'registered'
      }));

      const recentAppointments = (appointmentsData || []).slice(0, 3).map(a => ({
        id: a.id,
        type: 'appointment',
        title: `New appointment scheduled for ${a.patient_name || 'Patient'}`,
        time: a.created_at,
        status: a.status
      }));

      setRecentActivities([...recentPatients, ...recentAppointments].sort((a, b) =>
        new Date(b.time) - new Date(a.time)
      ));

      setStatsData({
        newRegistrations: newRegistrations || 0,
        pendingAppointments: pending.length,
        patientsToday: todayApps.length,
        waitingPatients: waiting.length,
        totalPatients: totalPatients || 0,
        completedAppointments: completed.length,
        cancelledAppointments: cancelled.length,
        todayAppointments: todayApps.length,
        weeklyAppointments: weeklyApps.length,
        monthlyAppointments: monthlyApps.length
      });

    } catch (err) {
      console.error('Error fetching receptionist data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReceptionistData();

    const handleDataChange = () => {
      fetchReceptionistData();
    };
    window.addEventListener('patientAdded', handleDataChange);
    window.addEventListener('appointmentAdded', handleDataChange);
    window.addEventListener('appointmentUpdated', handleDataChange);

    return () => {
      window.removeEventListener('patientAdded', handleDataChange);
      window.removeEventListener('appointmentAdded', handleDataChange);
      window.removeEventListener('appointmentUpdated', handleDataChange);
    };
  }, []);

  // ===== NAVIGATION =====
  const handleNavigate = (page) => {
    navigate(`/${page}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // ===== VIEW NAVIGATION =====
  const goToView = (view) => {
    setCurrentView(view);
    setActiveTab('overview');
    if (view === 'addPatient') {
      setPatientForm({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        age: '',
        gender: '',
        blood_group: '',
        emergency_contact: '',
        emergency_phone: '',
        medical_history: '',
        allergies: '',
        notes: ''
      });
    }
    if (view === 'addAppointment') {
      setAppointmentForm({
        patient_id: '',
        doctor_id: '',
        appointment_date: '',
        appointment_time: '',
        reason: '',
        notes: '',
        status: 'scheduled'
      });
    }
    setErrorMsg('');
    setSuccessMsg('');
  };

  const goBackToDashboard = () => {
    setCurrentView('dashboard');
    setActiveTab('overview');
    fetchReceptionistData();
  };

  // ===== ADD PATIENT =====
  const handleAddPatient = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase
        .from('patients')
        .insert([{
          name: patientForm.name,
          phone: patientForm.phone || null,
          email: patientForm.email || null,
          address: patientForm.address || null,
          city: patientForm.city || null,
          age: patientForm.age ? parseInt(patientForm.age) : null,
          gender: patientForm.gender || null,
          blood_group: patientForm.blood_group || null,
          emergency_contact: patientForm.emergency_contact || null,
          emergency_phone: patientForm.emergency_phone || null,
          medical_history: patientForm.medical_history || null,
          allergies: patientForm.allergies || null,
          notes: patientForm.notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;

      setSuccessMsg(`✅ ${patientForm.name} registered successfully!`);
      setTimeout(() => {
        goBackToDashboard();
      }, 1500);
    } catch (err) {
      setErrorMsg('Failed to register patient: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ===== ADD APPOINTMENT =====
  const handleAddAppointment = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Get patient name
      const patient = patients.find(p => p.id === appointmentForm.patient_id);

      const { error } = await supabase
        .from('appointments')
        .insert([{
          patient_id: appointmentForm.patient_id,
          patient_name: patient?.name || 'Unknown',
          doctor_id: appointmentForm.doctor_id || null,
          appointment_date: appointmentForm.appointment_date,
          appointment_time: appointmentForm.appointment_time || '09:00',
          reason: appointmentForm.reason || null,
          notes: appointmentForm.notes || null,
          status: appointmentForm.status || 'scheduled',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;

      setSuccessMsg('✅ Appointment scheduled successfully!');
      setTimeout(() => {
        goBackToDashboard();
      }, 1500);
    } catch (err) {
      setErrorMsg('Failed to schedule appointment: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ===== UPDATE APPOINTMENT STATUS =====
  const updateAppointmentStatus = async (id, newStatus) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setSuccessMsg(`✅ Appointment status updated to ${newStatus}!`);
      fetchReceptionistData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg('Failed to update appointment: ' + err.message);
      setTimeout(() => setErrorMsg(''), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  // ===== DELETE APPOINTMENT =====
  const handleDeleteAppointment = async () => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', selectedAppointment.id);

      if (error) throw error;

      setSuccessMsg('✅ Appointment deleted successfully!');
      setIsDeleteAppointmentOpen(false);
      fetchReceptionistData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg('Failed to delete appointment: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ===== OPEN FUNCTIONS =====
  const openEditAppointment = (app) => {
    setSelectedAppointment(app);
    setEditAppointmentForm({
      patient_id: app.patient_id || '',
      doctor_id: app.doctor_id || '',
      appointment_date: app.appointment_date || '',
      appointment_time: app.appointment_time || '',
      reason: app.reason || '',
      notes: app.notes || '',
      status: app.status || 'scheduled'
    });
    setIsEditAppointmentOpen(true);
  };

  const openDeleteAppointment = (app) => {
    setSelectedAppointment(app);
    setIsDeleteAppointmentOpen(true);
  };

  const openViewAppointment = (app) => {
    setSelectedAppointment(app);
    setIsViewAppointmentOpen(true);
  };

  // ===== STATS CARDS =====
  const stats = [
    {
      icon: UserPlus,
      value: statsData.newRegistrations,
      label: 'New Registrations',
      trend: `${statsData.newRegistrations} today`,
      up: statsData.newRegistrations > 0,
      color: '#2563EB'
    },
    {
      icon: CalendarDays,
      value: statsData.pendingAppointments,
      label: 'Pending Appointments',
      trend: `${statsData.pendingAppointments} scheduled`,
      up: statsData.pendingAppointments > 0,
      color: '#22C55E'
    },
    {
      icon: Users,
      value: statsData.patientsToday,
      label: 'Patients Today',
      trend: `${statsData.patientsToday} check-ins`,
      up: statsData.patientsToday > 0,
      color: '#8B5CF6'
    },
    {
      icon: Clock,
      value: statsData.waitingPatients,
      label: 'Waiting Patients',
      trend: `${statsData.waitingPatients} in queue`,
      up: false,
      color: '#F59E0B'
    },
    {
      icon: UsersIcon,
      value: statsData.totalPatients,
      label: 'Total Patients',
      trend: 'Registered',
      up: true,
      color: '#EC4899'
    },
    {
      icon: CheckCircle,
      value: statsData.completedAppointments,
      label: 'Completed',
      trend: `${statsData.completedAppointments} done`,
      up: true,
      color: '#22C55E'
    }
  ];

  // ===== QUICK ACTIONS =====
  const quickActions = [
    {
      icon: UserPlus,
      label: 'Register Patient',
      color: '#2563EB',
      view: 'addPatient'
    },
    {
      icon: CalendarDays,
      label: 'Schedule Appointment',
      color: '#22C55E',
      view: 'addAppointment'
    },
    {
      icon: Users,
      label: 'Patient Records',
      color: '#8B5CF6',
      view: 'patients'
    },
    {
      icon: Clock,
      label: 'Today\'s Appointments',
      color: '#F59E0B',
      view: 'appointments'
    },
    {
      icon: BarChart3,
      label: 'Reports',
      color: '#6366F1',
      view: 'reports'
    },
    {
      icon: Settings,
      label: 'Settings',
      color: '#6B7280',
      view: 'settings'
    }
  ];

  // ============================================================
  // ===== RENDER VIEWS =====
  // ============================================================
  const renderView = () => {
    switch (currentView) {
      case 'addPatient':
        return renderAddPatient();
      case 'addAppointment':
        return renderAddAppointment();
      case 'patients':
        return renderPatients();
      case 'appointments':
        return renderAppointments();
      case 'reports':
        return renderReports();
      case 'settings':
        return renderSettings();
      default:
        return null;
    }
  };

  // ============================================================
  // ===== RENDER ADD PATIENT =====
  // ============================================================
  const renderAddPatient = () => (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <button
        onClick={goBackToDashboard}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          fontSize: '0.85rem',
          marginBottom: '16px',
          padding: '4px 0'
        }}
      >
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      {successMsg && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '8px',
          marginBottom: '16px',
          background: '#22C55E15',
          border: '1px solid #22C55E30',
          color: '#16A34A',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Check size={18} /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '8px',
          marginBottom: '16px',
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

      <div style={{
        background: 'var(--card-bg)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        padding: '24px'
      }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserPlus size={20} style={{ color: '#2563EB' }} />
          Register New Patient
        </h2>

        <form onSubmit={handleAddPatient}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Patient Name *
              </label>
              <input
                type="text"
                value={patientForm.name}
                onChange={(e) => setPatientForm(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="Full name"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Phone
              </label>
              <input
                type="tel"
                value={patientForm.phone}
                onChange={(e) => setPatientForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+92-300-1234567"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Email
              </label>
              <input
                type="email"
                value={patientForm.email}
                onChange={(e) => setPatientForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="patient@email.com"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Age
              </label>
              <input
                type="number"
                value={patientForm.age}
                onChange={(e) => setPatientForm(prev => ({ ...prev, age: e.target.value }))}
                placeholder="e.g. 35"
                min="0"
                max="150"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Gender
              </label>
              <select
                value={patientForm.gender}
                onChange={(e) => setPatientForm(prev => ({ ...prev, gender: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              >
                <option value="">Select Gender</option>
                {genders.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Blood Group
              </label>
              <select
                value={patientForm.blood_group}
                onChange={(e) => setPatientForm(prev => ({ ...prev, blood_group: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              >
                <option value="">Select Blood Group</option>
                {bloodGroups.map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Emergency Contact
              </label>
              <input
                type="text"
                value={patientForm.emergency_contact}
                onChange={(e) => setPatientForm(prev => ({ ...prev, emergency_contact: e.target.value }))}
                placeholder="e.g. John Doe"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Emergency Phone
              </label>
              <input
                type="tel"
                value={patientForm.emergency_phone}
                onChange={(e) => setPatientForm(prev => ({ ...prev, emergency_phone: e.target.value }))}
                placeholder="+92-300-1234567"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Address
              </label>
              <input
                type="text"
                value={patientForm.address}
                onChange={(e) => setPatientForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Street address"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                City
              </label>
              <input
                type="text"
                value={patientForm.city}
                onChange={(e) => setPatientForm(prev => ({ ...prev, city: e.target.value }))}
                placeholder="e.g. Islamabad"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: '14px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Medical History
            </label>
            <textarea
              value={patientForm.medical_history}
              onChange={(e) => setPatientForm(prev => ({ ...prev, medical_history: e.target.value }))}
              rows="2"
              placeholder="Any past medical conditions, surgeries, etc."
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ marginTop: '14px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Allergies
            </label>
            <textarea
              value={patientForm.allergies}
              onChange={(e) => setPatientForm(prev => ({ ...prev, allergies: e.target.value }))}
              rows="2"
              placeholder="Any known allergies (medicines, food, etc.)"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ marginTop: '14px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Notes
            </label>
            <textarea
              value={patientForm.notes}
              onChange={(e) => setPatientForm(prev => ({ ...prev, notes: e.target.value }))}
              rows="2"
              placeholder="Additional notes about the patient..."
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)'
          }}>
            <button
              type="button"
              onClick={goBackToDashboard}
              style={{
                padding: '8px 20px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              style={{
                padding: '8px 20px',
                border: 'none',
                borderRadius: '8px',
                background: 'var(--primary-color)',
                color: 'white',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: actionLoading ? 0.6 : 1
              }}
            >
              <Save size={18} />
              {actionLoading ? 'Registering...' : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // ============================================================
  // ===== RENDER ADD APPOINTMENT =====
  // ============================================================
  const renderAddAppointment = () => (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <button
        onClick={goBackToDashboard}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          fontSize: '0.85rem',
          marginBottom: '16px',
          padding: '4px 0'
        }}
      >
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      {successMsg && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '8px',
          marginBottom: '16px',
          background: '#22C55E15',
          border: '1px solid #22C55E30',
          color: '#16A34A',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Check size={18} /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '8px',
          marginBottom: '16px',
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

      <div style={{
        background: 'var(--card-bg)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        padding: '24px'
      }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarDays size={20} style={{ color: '#22C55E' }} />
          Schedule Appointment
        </h2>

        <form onSubmit={handleAddAppointment}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Patient *
            </label>
            <select
              value={appointmentForm.patient_id}
              onChange={(e) => setAppointmentForm(prev => ({ ...prev, patient_id: e.target.value }))}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            >
              <option value="">Select Patient</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.phone ? `(${p.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Appointment Date *
              </label>
              <input
                type="date"
                value={appointmentForm.appointment_date}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, appointment_date: e.target.value }))}
                required
                min={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Appointment Time
              </label>
              <input
                type="time"
                value={appointmentForm.appointment_time}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, appointment_time: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: '14px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Reason
            </label>
            <input
              type="text"
              value={appointmentForm.reason}
              onChange={(e) => setAppointmentForm(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="e.g. Annual checkup, Follow-up, etc."
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginTop: '14px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Notes
            </label>
            <textarea
              value={appointmentForm.notes}
              onChange={(e) => setAppointmentForm(prev => ({ ...prev, notes: e.target.value }))}
              rows="2"
              placeholder="Additional notes..."
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ marginTop: '14px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Status
            </label>
            <select
              value={appointmentForm.status}
              onChange={(e) => setAppointmentForm(prev => ({ ...prev, status: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            >
              {appointmentStatuses.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)'
          }}>
            <button
              type="button"
              onClick={goBackToDashboard}
              style={{
                padding: '8px 20px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              style={{
                padding: '8px 20px',
                border: 'none',
                borderRadius: '8px',
                background: 'var(--primary-color)',
                color: 'white',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: actionLoading ? 0.6 : 1
              }}
            >
              <Save size={18} />
              {actionLoading ? 'Scheduling...' : 'Schedule Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // ============================================================
  // ===== RENDER PATIENTS =====
  // ============================================================
  const renderPatients = () => (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <button
        onClick={goBackToDashboard}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          fontSize: '0.85rem',
          marginBottom: '16px',
          padding: '4px 0'
        }}
      >
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      <div style={{
        background: 'var(--card-bg)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        padding: '24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} style={{ color: '#8B5CF6' }} />
            Patient Records ({patients.length})
          </h2>
          <button
            onClick={() => goToView('addPatient')}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '8px',
              background: '#2563EB',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <UserPlus size={16} /> Register New
          </button>
        </div>

        {patients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👤</div>
            No patients registered yet
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Name</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Phone</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Age</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Gender</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Blood Group</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.slice(0, 20).map((patient, index) => (
                  <tr
                    key={patient.id}
                    style={{
                      borderBottom: index < patients.length - 1 ? '1px solid var(--border-color)' : 'none',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '10px 14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {patient.name}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                      {patient.phone || '-'}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      {patient.age || '-'}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      {patient.gender || '-'}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      {patient.blood_group || '-'}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <button
                        style={{
                          padding: '4px 10px',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          background: 'transparent',
                          cursor: 'pointer',
                          fontSize: '0.65rem',
                          color: 'var(--text-secondary)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--primary-color)';
                          e.currentTarget.style.color = 'var(--primary-color)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                      >
                        <Eye size={12} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {patients.length > 20 && (
              <div style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Showing 20 of {patients.length} patients
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ============================================================
  // ===== RENDER APPOINTMENTS =====
  // ============================================================
  const renderAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayApps = appointments.filter(a => a.appointment_date === today);

    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <button
          onClick={goBackToDashboard}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            marginBottom: '16px',
            padding: '4px 0'
          }}
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>

        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarDays size={20} style={{ color: '#F59E0B' }} />
              Today's Appointments ({todayApps.length})
            </h2>
            <button
              onClick={() => goToView('addAppointment')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                background: '#22C55E',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Plus size={16} /> New Appointment
            </button>
          </div>

          {todayApps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📅</div>
              No appointments scheduled for today
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Patient</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Time</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Reason</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {todayApps.map((app, index) => {
                    const statusColors = {
                      scheduled: { bg: '#FEF3C7', text: '#D97706', label: 'Scheduled' },
                      'checked-in': { bg: '#DBEAFE', text: '#2563EB', label: 'Checked In' },
                      'in-progress': { bg: '#DCFCE7', text: '#16A34A', label: 'In Progress' },
                      completed: { bg: '#DCFCE7', text: '#16A34A', label: 'Completed' },
                      cancelled: { bg: '#FEE2E2', text: '#DC2626', label: 'Cancelled' },
                      'no-show': { bg: '#F3F4F6', text: '#6B7280', label: 'No Show' }
                    };
                    const status = statusColors[app.status] || statusColors.scheduled;

                    return (
                      <tr
                        key={app.id}
                        style={{
                          borderBottom: index < todayApps.length - 1 ? '1px solid var(--border-color)' : 'none',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '10px 14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {app.patient_name || 'Unknown'}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                          {app.appointment_time || '09:00'}
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                          {app.reason || '-'}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 10px',
                            borderRadius: '20px',
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            background: status.bg,
                            color: status.text,
                            border: `1px solid ${status.text}30`
                          }}>
                            {status.label}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => openViewAppointment(app)}
                              style={{
                                padding: '4px 8px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontSize: '0.6rem',
                                color: 'var(--text-secondary)',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--primary-color)';
                                e.currentTarget.style.color = 'var(--primary-color)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                e.currentTarget.style.color = 'var(--text-secondary)';
                              }}
                            >
                              <Eye size={12} /> View
                            </button>
                            <button
                              onClick={() => openEditAppointment(app)}
                              style={{
                                padding: '4px 8px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontSize: '0.6rem',
                                color: 'var(--text-secondary)',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--secondary-color)';
                                e.currentTarget.style.color = 'var(--secondary-color)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                e.currentTarget.style.color = 'var(--text-secondary)';
                              }}
                            >
                              <Edit2 size={12} /> Edit
                            </button>
                            {app.status !== 'completed' && app.status !== 'cancelled' && (
                              <>
                                <button
                                  onClick={() => updateAppointmentStatus(app.id, 'checked-in')}
                                  style={{
                                    padding: '4px 8px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    background: '#2563EB',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '0.6rem'
                                  }}
                                >
                                  Check In
                                </button>
                                <button
                                  onClick={() => updateAppointmentStatus(app.id, 'completed')}
                                  style={{
                                    padding: '4px 8px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    background: '#22C55E',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '0.6rem'
                                  }}
                                >
                                  Complete
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => openDeleteAppointment(app)}
                              style={{
                                padding: '4px 8px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontSize: '0.6rem',
                                color: 'var(--text-secondary)',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--danger-color)';
                                e.currentTarget.style.color = 'var(--danger-color)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                e.currentTarget.style.color = 'var(--text-secondary)';
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
      </div>
    );
  };

  // ============================================================
  // ===== RENDER REPORTS =====
  // ============================================================
  const renderReports = () => (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <button
        onClick={goBackToDashboard}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          fontSize: '0.85rem',
          marginBottom: '16px',
          padding: '4px 0'
        }}
      >
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      <div style={{
        background: 'var(--card-bg)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        padding: '24px'
      }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={20} style={{ color: '#6366F1' }} />
          Reception Reports
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
          <div style={{
            padding: '16px',
            background: 'var(--bg-primary)',
            borderRadius: '10px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Patients</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{statsData.totalPatients}</div>
          </div>

          <div style={{
            padding: '16px',
            background: 'var(--bg-primary)',
            borderRadius: '10px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Today's Patients</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{statsData.patientsToday}</div>
          </div>

          <div style={{
            padding: '16px',
            background: 'var(--bg-primary)',
            borderRadius: '10px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Weekly Appointments</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{statsData.weeklyAppointments}</div>
          </div>

          <div style={{
            padding: '16px',
            background: 'var(--bg-primary)',
            borderRadius: '10px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Monthly Appointments</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{statsData.monthlyAppointments}</div>
          </div>

          <div style={{
            padding: '16px',
            background: '#22C55E10',
            borderRadius: '10px',
            border: '1px solid #22C55E30'
          }}>
            <div style={{ fontSize: '0.7rem', color: '#22C55E' }}>Completed</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22C55E' }}>{statsData.completedAppointments}</div>
          </div>

          <div style={{
            padding: '16px',
            background: '#EF444410',
            borderRadius: '10px',
            border: '1px solid #EF444430'
          }}>
            <div style={{ fontSize: '0.7rem', color: '#EF4444' }}>Cancelled</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#EF4444' }}>{statsData.cancelledAppointments}</div>
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // ===== RENDER SETTINGS =====
  // ============================================================
  const renderSettings = () => (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <button
        onClick={goBackToDashboard}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          fontSize: '0.85rem',
          marginBottom: '16px',
          padding: '4px 0'
        }}
      >
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      <div style={{
        background: 'var(--card-bg)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        padding: '24px'
      }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={20} style={{ color: '#6B7280' }} />
          Settings
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            padding: '16px',
            background: 'var(--bg-primary)',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Theme</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {theme === 'light' ? '☀️ Light' : '🌙 Dark'} mode
              </div>
            </div>
            <button
              onClick={toggleTheme}
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--primary-color)',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              Toggle Theme
            </button>
          </div>

          <div style={{
            padding: '16px',
            background: 'var(--bg-primary)',
            borderRadius: '10px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>About</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Receptionist Dashboard v1.0<br />
              Subhan Care Clinic Management System
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // ===== RENDER DASHBOARD CONTENT =====
  // ============================================================
  const renderDashboardContent = () => {
    if (currentView !== 'dashboard') {
      return null;
    }

    // ===== OVERVIEW TAB =====
    if (activeTab === 'overview') {
      return (
        <>
          {/* Stats Grid */}
          <div className="stats-grid">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="stat-card">
                  <div className="stat-card-top">
                    <div className="stat-card-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                      <Icon size={20} />
                    </div>
                    <span className={`stat-trend ${stat.up ? 'up' : 'down'}`}>
                      {stat.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {stat.trend}
                    </span>
                  </div>
                  <div className="stat-card-value">{stat.value}</div>
                  <div className="stat-card-label">{stat.label}</div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Zap size={18} style={{ color: 'var(--primary-color)' }} />
              Quick Actions
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '12px'
            }}>
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <div
                    key={index}
                    onClick={() => goToView(action.view)}
                    style={{
                      padding: '16px 18px',
                      background: 'var(--card-bg)',
                      border: '2px solid var(--border-color)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      transition: 'all 0.3s ease',
                      fontFamily: 'var(--font-family)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                      e.currentTarget.style.borderColor = action.color;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                  >
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: `${action.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: action.color,
                      flexShrink: 0
                    }}>
                      <Icon size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: '2px'
                      }}>
                        {action.label}
                      </div>
                      <div style={{
                        fontSize: '0.65rem',
                        color: 'var(--text-muted)',
                        opacity: 0.8
                      }}>
                        Click to open
                      </div>
                    </div>
                    <ArrowRight size={16} style={{
                      color: 'var(--text-muted)',
                      opacity: 0.5,
                      transition: 'all 0.3s ease',
                      flexShrink: 0
                    }} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Clock size={18} style={{ color: 'var(--text-muted)' }} />
                Recent Activity
              </h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {recentActivities.length} activities
              </span>
            </div>
            <div style={{ padding: '12px 20px' }}>
              {recentActivities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                  No recent activity
                </div>
              ) : (
                recentActivities.map((activity, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '10px 0',
                      borderBottom: index < recentActivities.length - 1 ? '1px solid var(--border-color)' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: activity.type === 'patient' ? '#2563EB15' : '#22C55E15',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: activity.type === 'patient' ? '#2563EB' : '#22C55E'
                      }}>
                        {activity.type === 'patient' ? <UserPlus size={14} /> : <CalendarDays size={14} />}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          {activity.title}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          {new Date(activity.time).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {activity.status && (
                      <span style={{
                        padding: '2px 10px',
                        borderRadius: '12px',
                        fontSize: '0.6rem',
                        fontWeight: 600,
                        background: activity.status === 'registered' ? '#2563EB20' :
                          activity.status === 'scheduled' ? '#F59E0B20' :
                            '#22C55E20',
                        color: activity.status === 'registered' ? '#2563EB' :
                          activity.status === 'scheduled' ? '#F59E0B' :
                            '#22C55E'
                      }}>
                        {activity.status}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      );
    }

    // ===== APPOINTMENTS TAB =====
    if (activeTab === 'appointments') {
      return renderAppointments();
    }

    return null;
  };

  // ============================================================
  // ===== LOADING & ERROR STATES =====
  // ============================================================
  if (loading || isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px', background: 'var(--bg-primary)' }}>
        <Loader size={40} className="spinner" />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Loading receptionist dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px', background: 'var(--bg-primary)' }}>
        <AlertCircle size={48} color="#EF4444" />
        <h2 style={{ color: 'var(--text-primary)' }}>Error Loading Data</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        <button
          onClick={fetchReceptionistData}
          style={{
            padding: '10px 24px',
            background: 'var(--primary-color)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  // ============================================================
  // ===== MAIN RENDER =====
  // ============================================================
  return (
    <div className="dashboard-layout">
      <Sidebar active="receptionist" onNavigate={handleNavigate} user={user} onSignOut={handleSignOut} theme={theme} toggleTheme={toggleTheme} />
      <SidebarOverlay show={sidebarOpen} onClick={() => setSidebarOpen(false)} />

      <div className="main-content">
        <header className="dashboard-header">
          <div className="header-left">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={22} />
            </button>
            <h1>Receptionist Dashboard</h1>
            <form onSubmit={handleSearch} className="header-search-form">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search patients, appointments..."
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
              onClick={fetchReceptionistData}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>

            {/* ===== PROFILE SECTION WITH DROPDOWN ===== */}
            <div ref={profileRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="header-profile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '4px 12px 4px 4px',
                  borderRadius: '50px',
                  background: 'var(--bg-primary)',
                  border: '2px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontFamily: 'var(--font-family)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary-color)';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Avatar First */}
                <div className="header-avatar" style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary-color), #7C3AED)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  flexShrink: 0
                }}>
                  {userInitial}
                </div>

                {/* Profile Info */}
                <div className="profile-info" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  lineHeight: 1.2,
                  textAlign: 'left'
                }}>
                  <div className="profile-name" style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)'
                  }}>
                    {userName}
                  </div>
                  <div className="profile-role" style={{
                    fontSize: '0.6rem',
                    color: 'var(--text-muted)',
                    textTransform: 'capitalize'
                  }}>
                    {userRole}
                  </div>
                  <div className="profile-email" style={{
                    fontSize: '0.55rem',
                    color: 'var(--text-muted)'
                  }}>
                    {userEmail}
                  </div>
                </div>

                <ChevronDown
                  size={16}
                  style={{
                    color: 'var(--text-muted)',
                    transition: 'transform 0.3s ease',
                    transform: isProfileOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    flexShrink: 0
                  }}
                />
              </button>

              {/* ===== DROPDOWN MENU ===== */}
              {isProfileOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  minWidth: '220px',
                  background: 'var(--card-bg)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                  padding: '6px 0',
                  zIndex: 1000,
                  animation: 'slideDown 0.2s ease'
                }}>
                  {/* User Info Header */}
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-color)',
                    marginBottom: '4px'
                  }}>
                    <div style={{
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem'
                    }}>
                      {userName}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)'
                    }}>
                      {userEmail}
                    </div>
                  </div>

                  {profileOptions.map((option, index) => {
                    const Icon = option.icon;
                    const isLogout = option.label === 'Logout';
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setIsProfileOpen(false);
                          if (option.action) {
                            option.action();
                          } else if (option.path) {
                            navigate(option.path);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 16px',
                          width: '100%',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontFamily: 'var(--font-family)',
                          color: isLogout ? '#EF4444' : 'var(--text-primary)',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isLogout ? '#EF444410' : 'var(--hover-bg)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <Icon size={18} style={{ color: isLogout ? '#EF4444' : option.color }} />
                        {option.label}
                        {!isLogout && option.label !== 'Logout' && (
                          <span style={{
                            marginLeft: 'auto',
                            fontSize: '0.6rem',
                            color: 'var(--text-muted)',
                            opacity: 0.5
                          }}>
                            →
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          {/* Success/Error Messages */}
          {successMsg && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '16px',
              background: '#22C55E15',
              border: '1px solid #22C55E30',
              color: '#16A34A',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Check size={18} />
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '16px',
              background: '#EF444415',
              border: '1px solid #EF444430',
              color: '#EF4444',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={18} />
              {errorMsg}
            </div>
          )}

          {/* Welcome Section - Only in Dashboard View */}
          {currentView === 'dashboard' && (
            <div className="welcome-section">
              <div className="welcome-text">
                <h2>Welcome back, {userName}! 👋</h2>
                <p>You're signed in as <strong>{userRole}</strong>. Here's your reception overview.</p>
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  flexWrap: 'wrap',
                  marginTop: '8px',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)'
                }}>
                  <span>👤 Patients: {statsData.totalPatients}</span>
                  <span>📅 Appointments: {statsData.todayAppointments}</span>
                  <span>⏳ Pending: {statsData.pendingAppointments}</span>
                  <span>🔄 Waiting: {statsData.waitingPatients}</span>
                </div>
              </div>
              <button
                onClick={() => goToView('addPatient')}
                className="btn-primary"
                style={{
                  padding: '10px 20px',
                  background: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'var(--font-family)'
                }}
              >
                <UserPlus size={18} /> Register Patient
              </button>
            </div>
          )}

          {/* ===== TABS - Only in Dashboard View ===== */}
          {currentView === 'dashboard' && (
            <div style={{
              display: 'flex',
              gap: '4px',
              marginBottom: '20px',
              borderBottom: '2px solid var(--border-color)',
              paddingBottom: '8px',
              overflowX: 'auto'
            }}>
              <button
                onClick={() => setActiveTab('overview')}
                style={{
                  padding: '8px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  background: activeTab === 'overview' ? 'var(--primary-color)' : 'transparent',
                  color: activeTab === 'overview' ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: activeTab === 'overview' ? 600 : 400,
                  fontFamily: 'var(--font-family)',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <BarChart3 size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('appointments')}
                style={{
                  padding: '8px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  background: activeTab === 'appointments' ? 'var(--primary-color)' : 'transparent',
                  color: activeTab === 'appointments' ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: activeTab === 'appointments' ? 600 : 400,
                  fontFamily: 'var(--font-family)',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <CalendarDays size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Appointments ({todayAppointments.length})
              </button>
            </div>
          )}

          {/* ===== RENDER CONTENT ===== */}
          {currentView !== 'dashboard' ? renderView() : renderDashboardContent()}
        </div>
      </div>

      {/* ============================================================
          MODALS
          ============================================================ */}

      {/* View Appointment Modal */}
      {isViewAppointmentOpen && selectedAppointment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsViewAppointmentOpen(false);
              setSelectedAppointment(null);
            }
          }}>
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              borderBottom: '2px solid var(--border-color)',
              paddingBottom: '14px'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CalendarDays size={20} style={{ color: '#F59E0B' }} />
                Appointment Details
              </h3>
              <button
                onClick={() => {
                  setIsViewAppointmentOpen(false);
                  setSelectedAppointment(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '4px',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Patient</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {selectedAppointment.patient_name || 'Unknown'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Date</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {new Date(selectedAppointment.appointment_date).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Time</div>
                  <div style={{ color: 'var(--text-primary)' }}>
                    {selectedAppointment.appointment_time || '09:00'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Status</div>
                  <span style={{
                    padding: '2px 10px',
                    borderRadius: '20px',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    background: selectedAppointment.status === 'scheduled' ? '#FEF3C720' :
                      selectedAppointment.status === 'completed' ? '#DCFCE720' :
                        selectedAppointment.status === 'cancelled' ? '#FEE2E220' :
                          '#DBEAFE20',
                    color: selectedAppointment.status === 'scheduled' ? '#D97706' :
                      selectedAppointment.status === 'completed' ? '#16A34A' :
                        selectedAppointment.status === 'cancelled' ? '#DC2626' :
                          '#2563EB'
                  }}>
                    {selectedAppointment.status || 'Scheduled'}
                  </span>
                </div>
              </div>

              {selectedAppointment.reason && (
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Reason</div>
                  <div style={{ color: 'var(--text-primary)' }}>{selectedAppointment.reason}</div>
                </div>
              )}

              {selectedAppointment.notes && (
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Notes</div>
                  <div style={{ color: 'var(--text-primary)' }}>{selectedAppointment.notes}</div>
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '2px solid var(--border-color)'
            }}>
              <button
                onClick={() => {
                  setIsViewAppointmentOpen(false);
                  openEditAppointment(selectedAppointment);
                }}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'var(--secondary-color)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Edit2 size={16} /> Edit
              </button>
              <button
                onClick={() => {
                  setIsViewAppointmentOpen(false);
                  setSelectedAppointment(null);
                }}
                style={{
                  padding: '8px 16px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {isEditAppointmentOpen && selectedAppointment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsEditAppointmentOpen(false);
              setSelectedAppointment(null);
            }
          }}>
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              borderBottom: '2px solid var(--border-color)',
              paddingBottom: '14px'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Edit2 size={20} style={{ color: 'var(--secondary-color)' }} />
                Edit Appointment
              </h3>
              <button
                onClick={() => {
                  setIsEditAppointmentOpen(false);
                  setSelectedAppointment(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '4px',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setActionLoading(true);
              try {
                const { error } = await supabase
                  .from('appointments')
                  .update({
                    appointment_date: editAppointmentForm.appointment_date,
                    appointment_time: editAppointmentForm.appointment_time,
                    reason: editAppointmentForm.reason || null,
                    notes: editAppointmentForm.notes || null,
                    status: editAppointmentForm.status || 'scheduled',
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', selectedAppointment.id);

                if (error) throw error;

                setSuccessMsg('✅ Appointment updated successfully!');
                setIsEditAppointmentOpen(false);
                setSelectedAppointment(null);
                fetchReceptionistData();
                setTimeout(() => setSuccessMsg(''), 3000);
              } catch (err) {
                setErrorMsg('Failed to update appointment: ' + err.message);
              } finally {
                setActionLoading(false);
              }
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    value={editAppointmentForm.appointment_date}
                    onChange={(e) => setEditAppointmentForm(prev => ({ ...prev, appointment_date: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Time
                  </label>
                  <input
                    type="time"
                    value={editAppointmentForm.appointment_time}
                    onChange={(e) => setEditAppointmentForm(prev => ({ ...prev, appointment_time: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Reason
                </label>
                <input
                  type="text"
                  value={editAppointmentForm.reason}
                  onChange={(e) => setEditAppointmentForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Reason for appointment"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginTop: '12px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Status
                </label>
                <select
                  value={editAppointmentForm.status}
                  onChange={(e) => setEditAppointmentForm(prev => ({ ...prev, status: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                >
                  {appointmentStatuses.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: '12px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Notes
                </label>
                <textarea
                  value={editAppointmentForm.notes}
                  onChange={(e) => setEditAppointmentForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows="2"
                  placeholder="Additional notes..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '2px solid var(--border-color)'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditAppointmentOpen(false);
                    setSelectedAppointment(null);
                  }}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    background: actionLoading ? 'var(--secondary-color)70' : 'var(--secondary-color)',
                    color: 'white',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: actionLoading ? 0.6 : 1
                  }}
                >
                  <Save size={16} />
                  {actionLoading ? 'Updating...' : 'Update Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Appointment Modal */}
      {isDeleteAppointmentOpen && selectedAppointment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsDeleteAppointmentOpen(false);
              setSelectedAppointment(null);
            }
          }}>
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '16px',
            maxWidth: '400px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Delete Appointment
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Are you sure you want to delete this appointment?
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Patient: <strong>{selectedAppointment.patient_name}</strong><br />
              Date: <strong>{new Date(selectedAppointment.appointment_date).toLocaleDateString()}</strong>
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setIsDeleteAppointmentOpen(false);
                  setSelectedAppointment(null);
                }}
                style={{
                  padding: '8px 20px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAppointment}
                disabled={actionLoading}
                style={{
                  padding: '8px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  background: actionLoading ? 'var(--danger-color)70' : 'var(--danger-color)',
                  color: 'white',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: actionLoading ? 0.6 : 1
                }}
              >
                {actionLoading ? (
                  <>
                    <Loader size={16} className="spinner" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Permanently
                  </>
                )}
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

        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 16px 18px;
          transition: all 0.3s ease;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .stat-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .stat-card-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-card-value {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .stat-card-label {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .stat-trend {
          font-size: 0.7rem;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .stat-trend.up { color: #22C55E; }
        .stat-trend.down { color: #EF4444; }

        .dashboard-content {
          padding: 24px;
        }

        .welcome-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .welcome-text h2 {
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }
        .welcome-text p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin: 4px 0 0;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 24px;
          background: var(--card-bg);
          border-bottom: 1px solid var(--border-color);
          flex-wrap: wrap;
          gap: 12px;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }
        .header-left h1 {
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }
        .hamburger-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-secondary);
          padding: 4px;
          display: none;
        }
        .header-search-form {
          display: flex;
          align-items: center;
          position: relative;
          flex: 1;
          max-width: 300px;
        }
        .search-icon {
          position: absolute;
          left: 10px;
          color: var(--text-muted);
        }
        .search-input {
          width: 100%;
          padding: 6px 12px 6px 34px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 0.8rem;
          font-family: var(--font-family);
          outline: none;
        }
        .search-input:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .header-date, .header-time {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .header-profile {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 4px 12px 4px 4px;
          border-radius: 50px;
          background: var(--bg-primary);
          border: 2px solid var(--border-color);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .header-profile:hover {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
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
          text-align: left;
        }
        .profile-name {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .profile-role {
          font-size: 0.6rem;
          color: var(--text-muted);
          text-transform: capitalize;
        }
        .profile-email {
          font-size: 0.55rem;
          color: var(--text-muted);
        }

        @media (max-width: 768px) {
          .hamburger-btn { display: block; }
          .header-left h1 { font-size: 1rem; }
          .header-search-form { max-width: 100%; }
          .header-date, .header-time { display: none; }
          .profile-info { display: none; }
          .stats-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
          .dashboard-content { padding: 16px; }
          .stat-card-value { font-size: 1.2rem; }
          .welcome-section { flex-direction: column; align-items: flex-start; }
          .header-profile { padding: 4px; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr; }
          .header-right { gap: 8px; }
          .header-profile { padding: 3px; }
          .header-avatar { width: 28px; height: 28px; font-size: 0.7rem; }
        }
      `}</style>
    </div>
  );
};

export default ReceptionistDashboard;