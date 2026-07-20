import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, HeartPulse, FileText, Users,
  BookOpen, Menu, Search, LogOut, Loader, AlertCircle,
  Stethoscope, Clock, ArrowLeft, ChevronRight, Activity,
  User, Settings, HelpCircle, ChevronDown, UserCircle,
  ClipboardPlus, Activity as VitalIcon, FilePlus, Star,
  Pill, List, Eye, RefreshCw, Plus, Edit2, Trash2,
  Check, X, TrendingUp, TrendingDown, Zap, Home,
  ArrowRight, Sparkles, AlertTriangle,
  CheckCircle, Bell, MessageSquare, Award,
  CalendarDays, Building, Phone, Mail
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import SidebarOverlay from '../../components/SidebarOverlay';
import { supabase } from '../../services/supabaseClient';

const DoctorDashboard = () => {
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
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showNotifications, setShowNotifications] = useState(false);

  // ===== DATA STATE =====
  const [statsData, setStatsData] = useState({
    appointmentsToday: 0,
    activeConsultations: 0,
    prescriptionsIssued: 0,
    totalPatients: 0,
    totalAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    weeklyAppointments: 0,
    monthlyAppointments: 0,
    totalPrescriptions: 0,
    patientsToday: 0,
    satisfactionRate: 0
  });

  const [recentPatients, setRecentPatients] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [allPrescriptions, setAllPrescriptions] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);

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

  // ===== THEME =====
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Doctor';
  const userRole = user?.user_metadata?.role || 'Doctor';
  const userEmail = user?.email || '';
  const userInitial = userName.charAt(0).toUpperCase();
  const doctorSpecialization = user?.user_metadata?.specialization || 'General Physician';
  const doctorDepartment = user?.user_metadata?.department || 'General Medicine';
  const doctorExperience = user?.user_metadata?.experience || '5+ years';

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

  // ===== FETCH REAL DATA =====
  const fetchDoctorData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const doctorId = user?.id;
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const monthStart = new Date();
      monthStart.setDate(1);
      const monthStartStr = monthStart.toISOString().split('T')[0];

      console.log('🔍 Fetching data for doctor ID:', doctorId);

      // ===== 1. ALL PATIENTS =====
      const { data: patientsData, count: totalPatientsCount, error: patientsError } = await supabase
        .from('patients')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (patientsError) {
        console.error('❌ Error fetching patients:', patientsError);
        setAllPatients([]);
      } else {
        console.log('✅ All patients loaded:', patientsData?.length || 0);
        setAllPatients(patientsData || []);
        setRecentPatients((patientsData || []).slice(0, 5));

        const patientsToday = (patientsData || []).filter(p =>
          p.created_at && p.created_at.startsWith(today)
        ).length;
        setStatsData(prev => ({
          ...prev,
          totalPatients: patientsData?.length || 0,
          patientsToday: patientsToday
        }));
      }

      // ===== 2. ALL APPOINTMENTS =====
      const { data: allAppts, error: allAppError } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (
            id,
            name,
            phone,
            email
          )
        `)
        .order('appointment_date', { ascending: false });

      if (allAppError) {
        console.error('❌ Error fetching appointments:', allAppError);
        setAllAppointments([]);
      } else {
        console.log('✅ All appointments loaded:', allAppts?.length || 0);
        setAllAppointments(allAppts || []);
      }

      // ===== FILTER APPOINTMENTS =====
      let doctorAppointments = [];
      if (allAppts) {
        doctorAppointments = allAppts.filter(app => app.doctor_id === doctorId);
        if (doctorAppointments.length === 0 && allAppts.length > 0) {
          console.log('⚠️ No appointments found for this doctor, showing all for testing');
          doctorAppointments = allAppts;
        }
        console.log('✅ Doctor appointments filtered:', doctorAppointments.length);
      }

      // ===== TODAY'S APPOINTMENTS =====
      const todayAppts = doctorAppointments.filter(app => app.appointment_date === today);
      setTodayAppointments(todayAppts);

      // ===== ACTIVE CONSULTATIONS =====
      const activeAppts = doctorAppointments.filter(app =>
        app.status === 'scheduled' || app.status === 'in-progress'
      );

      // ===== COMPLETED APPOINTMENTS =====
      const completedAppts = doctorAppointments.filter(app => app.status === 'completed');

      // ===== CANCELLED APPOINTMENTS =====
      const cancelledAppts = doctorAppointments.filter(app => app.status === 'cancelled');

      // ===== WEEKLY & MONTHLY =====
      const weeklyAppts = doctorAppointments.filter(app => app.appointment_date >= weekStartStr);
      const monthlyAppts = doctorAppointments.filter(app => app.appointment_date >= monthStartStr);

      // ===== UPCOMING APPOINTMENTS =====
      const upcoming = doctorAppointments
        .filter(app => app.appointment_date >= today)
        .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))
        .slice(0, 5);
      setUpcomingAppointments(upcoming);

      // ===== PRESCRIPTIONS =====
      const { data: prescriptionsData, error: prescriptionsError } = await supabase
        .from('prescriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (prescriptionsError) {
        console.error('❌ Error fetching prescriptions:', prescriptionsError);
        setAllPrescriptions([]);
      } else {
        console.log('✅ Prescriptions loaded:', prescriptionsData?.length || 0);
        setAllPrescriptions(prescriptionsData || []);
      }

      let doctorPrescriptions = [];
      if (prescriptionsData) {
        doctorPrescriptions = prescriptionsData.filter(p => p.doctor_id === doctorId);
        if (doctorPrescriptions.length === 0 && prescriptionsData.length > 0) {
          doctorPrescriptions = prescriptionsData;
        }
      }

      // ===== NOTIFICATIONS =====
      const notifs = [];
      if (todayAppts.length > 0) {
        notifs.push({
          id: '1',
          icon: Calendar,
          title: `${todayAppts.length} appointments today`,
          time: 'Just now',
          color: statusColors.primary,
          read: false
        });
      }
      if (completedAppts.length > 0) {
        notifs.push({
          id: '2',
          icon: CheckCircle,
          title: `${completedAppts.length} appointments completed`,
          time: 'Today',
          color: statusColors.success,
          read: false
        });
      }
      if (doctorPrescriptions.length > 0) {
        notifs.push({
          id: '3',
          icon: FileText,
          title: `${doctorPrescriptions.length} prescriptions issued`,
          time: 'This month',
          color: statusColors.purple,
          read: false
        });
      }
      setNotifications(notifs);

      // ===== RECENT ACTIVITIES =====
      const activities = [];
      (patientsData || []).slice(0, 3).forEach(p => {
        activities.push({
          id: p.id,
          type: 'patient',
          title: `New patient registered: ${p.name}`,
          time: p.created_at,
          status: 'registered'
        });
      });
      (doctorAppointments || []).slice(0, 3).forEach(a => {
        const patientName = a.patients?.name || 'Patient';
        activities.push({
          id: a.id,
          type: 'appointment',
          title: `Appointment ${a.status} for ${patientName}`,
          time: a.created_at,
          status: a.status
        });
      });
      activities.sort((a, b) => new Date(b.time) - new Date(a.time));
      setRecentActivities(activities.slice(0, 5));

      // ===== UPDATE STATS =====
      setStatsData(prev => ({
        ...prev,
        appointmentsToday: todayAppts.length || 0,
        activeConsultations: activeAppts.length || 0,
        prescriptionsIssued: doctorPrescriptions.length || 0,
        totalAppointments: doctorAppointments.length || 0,
        completedAppointments: completedAppts.length || 0,
        cancelledAppointments: cancelledAppts.length || 0,
        weeklyAppointments: weeklyAppts.length || 0,
        monthlyAppointments: monthlyAppts.length || 0,
        totalPrescriptions: doctorPrescriptions.length || 0,
        satisfactionRate: 98
      }));

    } catch (err) {
      console.error('❌ Error fetching doctor data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      console.log('🏁 Data fetch complete');
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchDoctorData();

      const handleDataChange = () => {
        fetchDoctorData();
      };

      window.addEventListener('appointmentAdded', handleDataChange);
      window.addEventListener('appointmentUpdated', handleDataChange);
      window.addEventListener('prescriptionAdded', handleDataChange);
      window.addEventListener('patientAdded', handleDataChange);

      return () => {
        window.removeEventListener('appointmentAdded', handleDataChange);
        window.removeEventListener('appointmentUpdated', handleDataChange);
        window.removeEventListener('prescriptionAdded', handleDataChange);
        window.removeEventListener('patientAdded', handleDataChange);
      };
    }
  }, [user]);

  // ===== REFRESH DATA =====
  const refreshData = () => {
    fetchDoctorData();
    setSuccessMsg('✅ Data refreshed successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // ===== NAVIGATION =====
  const handleNavigate = (page) => {
    navigate(`/${page}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/patients?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSignOut = async () => {
    try {
      setShowProfileDropdown(false);
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // ===== TIME AGO =====
  const timeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    const diff = Math.floor((new Date() - new Date(timestamp)) / 1000);
    if (diff < 60) return `${diff} sec ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  // ===== GET STATUS BADGE =====
  const getStatusBadge = (status) => {
    const colors = {
      scheduled: { bg: '#FEF3C7', text: '#D97706', label: 'Scheduled', icon: '⏳' },
      'checked-in': { bg: '#DBEAFE', text: '#2563EB', label: 'Checked In', icon: '✅' },
      'in-progress': { bg: '#DCFCE7', text: '#16A34A', label: 'In Progress', icon: '🔄' },
      completed: { bg: '#DCFCE7', text: '#16A34A', label: 'Completed', icon: '✅' },
      cancelled: { bg: '#FEE2E2', text: '#DC2626', label: 'Cancelled', icon: '❌' },
      'no-show': { bg: '#F3F4F6', text: '#6B7280', label: 'No Show', icon: '⛔' }
    };
    return colors[status] || colors.scheduled;
  };

  // ===== SUCCESS/ERROR STATE =====
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ============================================================
  // ===== STATS CARDS =====
  // ============================================================
  const stats = [
    {
      icon: Calendar,
      value: statsData.appointmentsToday,
      label: "Today's Appointments",
      trend: `${statsData.appointmentsToday} today`,
      up: statsData.appointmentsToday > 0,
      color: statusColors.primary,
      onClick: () => navigate('/appointments')
    },
    {
      icon: HeartPulse,
      value: statsData.activeConsultations,
      label: 'Active Consultations',
      trend: `${statsData.activeConsultations} in-progress`,
      up: statsData.activeConsultations > 0,
      color: statusColors.success,
      onClick: () => navigate('/appointments')
    },
    {
      icon: FileText,
      value: statsData.prescriptionsIssued,
      label: 'Prescriptions Issued',
      trend: `Total: ${statsData.totalPrescriptions}`,
      up: statsData.prescriptionsIssued > 0,
      color: statusColors.purple,
      onClick: () => navigate('/prescriptions')
    },
    {
      icon: Users,
      value: statsData.totalPatients,
      label: 'Total Patients',
      trend: `${statsData.patientsToday} new today`,
      up: statsData.totalPatients > 0,
      color: statusColors.warning,
      onClick: () => navigate('/patients')
    },
    {
      icon: TrendingUp,
      value: statsData.totalAppointments,
      label: 'Total Appointments',
      trend: `This week: ${statsData.weeklyAppointments}`,
      up: statsData.totalAppointments > 0,
      color: statusColors.pink,
      onClick: () => navigate('/appointments')
    },
    {
      icon: CheckCircle,
      value: statsData.completedAppointments,
      label: 'Completed',
      trend: `${statsData.completedAppointments} done`,
      up: statsData.completedAppointments > 0,
      color: statusColors.teal,
      onClick: () => navigate('/appointments')
    }
  ];

  // ============================================================
  // ===== QUICK ACTIONS =====
  // ============================================================
  const quickActions = [
    {
      icon: Users,
      label: 'View Patients',
      color: statusColors.primary,
      onClick: () => navigate('/patients')
    },
    {
      icon: Calendar,
      label: 'My Schedule',
      color: statusColors.success,
      onClick: () => navigate('/appointments')
    },
    {
      icon: Pill,
      label: 'Prescriptions',
      color: statusColors.purple,
      onClick: () => navigate('/prescriptions')
    },
    {
      icon: HeartPulse,
      label: 'Vital Signs',
      color: statusColors.danger,
      onClick: () => navigate('/vitals')
    },
    {
      icon: Plus,
      label: 'New Prescription',
      color: statusColors.pink,
      onClick: () => navigate('/prescriptions/new')
    },
    {
      icon: ClipboardPlus,
      label: 'Patient Visit',
      color: statusColors.teal,
      onClick: () => navigate('/appointments')
    }
  ];

  // ============================================================
  // ===== PROFILE ITEMS =====
  // ============================================================
  const profileItems = [
    { icon: UserCircle, label: 'My Profile', onClick: () => navigate('/my-profile') },
    { icon: Settings, label: 'Settings', onClick: () => navigate('/settings') },
    { icon: Pill, label: 'Prescriptions', onClick: () => navigate('/prescriptions') },
    { icon: Calendar, label: 'My Schedule', onClick: () => navigate('/appointments') },
    { icon: HelpCircle, label: 'Help & Support', onClick: () => navigate('/support') },
    { divider: true },
    { icon: LogOut, label: 'Sign Out', onClick: handleSignOut, danger: true }
  ];

  // ============================================================
  // ===== LOADING & ERROR STATES =====
  // ============================================================
  if (loading || isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px', background: 'var(--bg-primary)' }}>
        <Loader size={40} className="spinner" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading doctor dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px', background: 'var(--bg-primary)' }}>
        <AlertCircle size={48} color="var(--danger-color)" />
        <h2 style={{ color: 'var(--text-primary)' }}>Error Loading Data</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        <button
          onClick={refreshData}
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
      <Sidebar
        active="doctor"
        onNavigate={handleNavigate}
        user={user}
        onSignOut={handleSignOut}
        theme={theme}
        toggleTheme={toggleTheme}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <SidebarOverlay show={sidebarOpen} onClick={() => setSidebarOpen(false)} />

      <div className="main-content">
        <header className="dashboard-header">
          <div className="header-left">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={22} />
            </button>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Doctor Dashboard</h1>
            <form onSubmit={handleSearch} className="header-search-form">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search patients..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
          <div className="header-right">
            <span className="header-date">{currentDate}</span>
            <span className="header-time">{currentTime}</span>

            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: '4px',
                  borderRadius: '6px',
                  position: 'relative',
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
                <Bell size={20} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#EF4444',
                    border: '2px solid var(--card-bg)'
                  }} />
                )}
              </button>

              {showNotifications && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  minWidth: '280px',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '8px 0',
                  zIndex: 1000,
                  animation: 'slideDown 0.2s ease'
                }}>
                  <div style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--border-color)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)'
                  }}>
                    Notifications
                  </div>
                  {notifications.length > 0 ? (
                    notifications.map((notif, index) => {
                      const Icon = notif.icon;
                      return (
                        <div
                          key={index}
                          style={{
                            padding: '8px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            borderBottom: index < notifications.length - 1 ? '1px solid var(--border-color)' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--hover-bg)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <div style={{
                            padding: '6px',
                            borderRadius: '8px',
                            background: `${notif.color}15`,
                            color: notif.color,
                            display: 'flex'
                          }}>
                            <Icon size={14} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                              {notif.title}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                              {notif.time}
                            </div>
                          </div>
                          {!notif.read && (
                            <div style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: '#EF4444'
                            }} />
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div style={{
                      padding: '20px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem'
                    }}>
                      No notifications
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={refreshData}
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
                e.currentTarget.style.transform = 'rotate(45deg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.transform = 'rotate(0deg)';
              }}
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>

            {/* ===== PROFILE ===== */}
            <div className="header-profile" ref={dropdownRef} style={{ position: 'relative' }}>
              <div
                className="profile-trigger"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  padding: '4px 12px 4px 4px',
                  borderRadius: '50px',
                  background: showProfileDropdown ? 'var(--hover-bg)' : 'transparent',
                  transition: 'all 0.2s ease',
                  border: '1px solid var(--border-color)'
                }}
                onMouseEnter={(e) => {
                  if (!showProfileDropdown) {
                    e.currentTarget.style.background = 'var(--hover-bg)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showProfileDropdown) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
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
                  fontSize: '0.85rem'
                }}>
                  {userInitial}
                </div>
                <div className="profile-info" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                  <div className="profile-name" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Dr. {userName}
                  </div>
                  <div className="profile-role" style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                    {doctorSpecialization}
                  </div>
                </div>
                <ChevronDown size={16} style={{
                  color: 'var(--text-muted)',
                  transition: 'transform 0.2s ease',
                  transform: showProfileDropdown ? 'rotate(180deg)' : 'rotate(0deg)'
                }} />
              </div>

              {showProfileDropdown && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  minWidth: '220px',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '6px 0',
                  zIndex: 1000,
                  animation: 'slideDown 0.2s ease'
                }}>
                  <div style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--border-color)',
                    marginBottom: '4px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary-color), #7C3AED)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '0.8rem'
                      }}>
                        {userInitial}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          Dr. {userName}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          {doctorSpecialization}
                        </div>
                        <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
                          {userEmail}
                        </div>
                      </div>
                    </div>
                  </div>

                  {profileItems.map((item, index) => {
                    if (item.divider) {
                      return <hr key={index} style={{ margin: '4px 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />;
                    }
                    const Icon = item.icon;
                    return (
                      <button
                        key={index}
                        onClick={item.onClick}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 14px',
                          width: '100%',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          color: item.danger ? 'var(--danger-color)' : 'var(--text-primary)',
                          transition: 'all 0.15s ease',
                          fontFamily: 'var(--font-family)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--hover-bg)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <Icon size={16} style={{
                          color: item.danger ? 'var(--danger-color)' : 'var(--text-muted)',
                          flexShrink: 0
                        }} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          {/* ===== SUCCESS/ERROR MESSAGES ===== */}
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
              gap: '8px',
              fontSize: '0.85rem'
            }}>
              <CheckCircle size={18} />
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
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.85rem'
            }}>
              <AlertCircle size={18} />
              {errorMsg}
            </div>
          )}

          {/* ===== DOCTOR PROFILE CARD ===== */}
          <div style={{
            background: 'linear-gradient(135deg, var(--primary-color), #7C3AED)',
            padding: '24px',
            borderRadius: '16px',
            color: 'white',
            marginBottom: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              right: '-50px',
              top: '-50px',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)'
            }} />
            <div style={{
              position: 'absolute',
              right: '50px',
              bottom: '-80px',
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.03)'
            }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                fontWeight: 700,
                border: '3px solid rgba(255,255,255,0.3)'
              }}>
                {userInitial}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '2px' }}>
                  Dr. {userName} 👨‍⚕️
                </h2>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', opacity: 0.9, fontSize: '0.85rem' }}>
                  <span><Stethoscope size={14} style={{ display: 'inline', marginRight: '4px' }} /> {doctorSpecialization}</span>
                  <span><Building size={14} style={{ display: 'inline', marginRight: '4px' }} /> {doctorDepartment}</span>
                  <span><Star size={14} style={{ display: 'inline', marginRight: '4px' }} /> {doctorExperience}</span>
                  <span><Users size={14} style={{ display: 'inline', marginRight: '4px' }} /> {statsData.totalPatients} patients</span>
                </div>
              </div>
              <div style={{
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.2)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.6rem', opacity: 0.8 }}>Satisfaction</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{statsData.satisfactionRate}%</div>
              </div>
            </div>
          </div>

          {/* ===== STATS GRID ===== */}
          <div className="stats-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '14px',
            marginBottom: '24px'
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
                    padding: '14px 16px',
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
                  <div className="stat-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div className="stat-card-icon" style={{
                      backgroundColor: `${stat.color}15`,
                      color: stat.color,
                      padding: '6px',
                      borderRadius: '8px',
                      display: 'flex'
                    }}>
                      <Icon size={18} />
                    </div>
                    <span className={`stat-trend ${stat.up ? 'up' : 'down'}`} style={{
                      fontSize: '0.65rem',
                      color: stat.up ? 'var(--success-color)' : 'var(--danger-color)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {stat.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {stat.trend}
                    </span>
                  </div>
                  <div className="stat-card-value" style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</div>
                  <div className="stat-card-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stat.label}</div>
                </div>
              );
            })}
          </div>

          {/* ===== TWO COLUMN LAYOUT ===== */}
          <div className="dashboard-two-col" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {/* ===== RECENT PATIENTS ===== */}
            <div className="activity-card" style={{
              background: 'var(--card-bg)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              padding: '16px'
            }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <h3 className="card-title" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <User size={16} style={{ display: 'inline', marginRight: '6px', color: 'var(--primary-color)' }} />
                    Recent Patients
                  </h3>
                  <p className="card-subtitle" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Latest patient registrations</p>
                </div>
                <span
                  className="view-all-link"
                  onClick={() => navigate('/patients')}
                  style={{
                    fontSize: '0.7rem',
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
              {recentPatients.length > 0 ? (
                recentPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="activity-item"
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
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
                    onClick={() => navigate(`/patients/${patient.id}`)}
                  >
                    <div className="activity-dot" style={{
                      backgroundColor: statusColors.primary,
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      flexShrink: 0
                    }} />
                    <div className="activity-content" style={{ flex: 1 }}>
                      <p className="activity-text" style={{ fontSize: '0.8rem', color: 'var(--text-primary)', margin: 0 }}>
                        <strong>{patient.name}</strong>
                      </p>
                      <div className="activity-time" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {patient.phone || 'No phone'} • {timeAgo(patient.created_at)}
                      </div>
                    </div>
                    <Eye size={14} style={{ color: 'var(--text-muted)' }} />
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0', fontSize: '0.85rem' }}>No recent patients</p>
              )}
            </div>

            {/* ===== UPCOMING APPOINTMENTS ===== */}
            <div className="quick-actions-card" style={{
              background: 'var(--card-bg)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              padding: '16px'
            }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <h3 className="card-title" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <Calendar size={16} style={{ display: 'inline', marginRight: '6px', color: 'var(--warning-color)' }} />
                    Upcoming Appointments
                  </h3>
                  <p className="card-subtitle" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Your next patient visits</p>
                </div>
                <span
                  className="view-all-link"
                  onClick={() => navigate('/appointments')}
                  style={{
                    fontSize: '0.7rem',
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
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appt) => {
                  const status = getStatusBadge(appt.status);
                  return (
                    <div
                      key={appt.id}
                      className="activity-item"
                      style={{
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
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
                      onClick={() => navigate('/appointments')}
                    >
                      <div className="activity-dot" style={{
                        backgroundColor: appt.status === 'scheduled' ? statusColors.success :
                          appt.status === 'in-progress' ? statusColors.warning :
                            appt.status === 'completed' ? statusColors.primary :
                              statusColors.danger,
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        flexShrink: 0
                      }} />
                      <div className="activity-content" style={{ flex: 1 }}>
                        <p className="activity-text" style={{ fontSize: '0.8rem', color: 'var(--text-primary)', margin: 0 }}>
                          <strong>{appt.patients?.name || 'Unknown Patient'}</strong>
                        </p>
                        <div className="activity-time" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                          <span>{appt.appointment_date}</span>
                          <span>•</span>
                          <span>{appt.appointment_time || '09:00'}</span>
                          <span style={{
                            padding: '1px 6px',
                            borderRadius: '8px',
                            fontSize: '0.5rem',
                            fontWeight: 600,
                            background: status.bg,
                            color: status.text
                          }}>
                            {status.icon} {status.label}
                          </span>
                        </div>
                      </div>
                      <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <Calendar size={28} style={{ color: 'var(--text-muted)', marginBottom: '6px' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No upcoming appointments</p>
                  <button
                    onClick={() => navigate('/appointments')}
                    style={{
                      marginTop: '6px',
                      padding: '6px 14px',
                      background: 'var(--primary-color)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      fontFamily: 'var(--font-family)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#1D4ED8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--primary-color)';
                    }}
                  >
                    Book Appointment
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ===== QUICK ACTIONS ===== */}
          <div style={{ marginBottom: '20px' }}>
            <h3 className="card-title" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
              <Zap size={16} style={{ display: 'inline', marginRight: '6px', color: 'var(--primary-color)' }} />
              Quick Actions
            </h3>
            <div className="quick-actions-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '10px'
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
                      padding: '10px 14px',
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      transition: 'all 0.3s ease',
                      fontFamily: 'var(--font-family)',
                      fontSize: '0.75rem',
                      color: 'var(--text-primary)',
                      fontWeight: 500
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
                      padding: '4px',
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

          {/* ===== RECENT ACTIVITY ===== */}
          {recentActivities.length > 0 && (
            <div style={{
              background: 'var(--card-bg)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              padding: '16px'
            }}>
              <h3 style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Clock size={16} style={{ color: 'var(--text-muted)' }} />
                Recent Activity
              </h3>
              {recentActivities.map((activity, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '6px 0',
                    borderBottom: index < recentActivities.length - 1 ? '1px solid var(--border-color)' : 'none'
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: activity.type === 'patient' ? '#2563EB15' : '#8B5CF615',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: activity.type === 'patient' ? '#2563EB' : '#8B5CF6'
                  }}>
                    {activity.type === 'patient' ? <User size={12} /> : <Calendar size={12} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                      {activity.title}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                      {new Date(activity.time).toLocaleString()}
                    </div>
                  </div>
                  {activity.status && (
                    <span style={{
                      padding: '1px 8px',
                      borderRadius: '10px',
                      fontSize: '0.5rem',
                      fontWeight: 600,
                      background: activity.status === 'registered' ? '#2563EB20' :
                        activity.status === 'scheduled' ? '#F59E0B20' :
                          activity.status === 'completed' ? '#22C55E20' :
                            '#EF444420',
                      color: activity.status === 'registered' ? '#2563EB' :
                        activity.status === 'scheduled' ? '#F59E0B' :
                          activity.status === 'completed' ? '#22C55E' :
                            '#EF4444'
                    }}>
                      {activity.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
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

        @media (max-width: 768px) {
          .dashboard-two-col {
            grid-template-columns: 1fr !important;
          }
          .stats-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .quick-actions-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .header-right .header-date,
          .header-right .header-time {
            display: none;
          }
          .header-search-form {
            display: none;
          }
          .profile-info {
            display: none !important;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
          .quick-actions-grid {
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
        }
      `}</style>
    </div>
  );
};

export default DoctorDashboard;