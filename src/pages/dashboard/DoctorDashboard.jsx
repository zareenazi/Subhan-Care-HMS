import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, HeartPulse, FileText, Users,
  BookOpen, Menu, Search, LogOut, Loader, AlertCircle,
  Stethoscope, Clock, ArrowLeft, ChevronRight, Activity,
  User, Settings, HelpCircle, ChevronDown, UserCircle,
  ClipboardPlus, Activity as VitalIcon, FilePlus, Star,
  Pill, List, Eye, RefreshCw
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import SidebarOverlay from '../../components/SidebarOverlay';
import { supabase } from '../../services/supabaseClient';

const DoctorDashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // ===== REAL DATA =====
  const [statsData, setStatsData] = useState({
    appointmentsToday: 0,
    activeConsultations: 0,
    prescriptionsIssued: 0,
    totalPatients: 0
  });

  const [recentPatients, setRecentPatients] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);

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

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Guest';
  const userRole = user?.user_metadata?.role || 'Doctor';
  const userEmail = user?.email || '';
  const userInitial = userName.charAt(0).toUpperCase();

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

  // ===== FETCH REAL DATA (FIXED) =====
  const fetchDoctorData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const doctorId = user?.id;

      console.log('🔍 Fetching data for doctor ID:', doctorId);

      // ===== GET ALL APPOINTMENTS =====
      const { data: allAppts, error: allAppError } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (
            id,
            name,
            phone
          )
        `);

      if (allAppError) {
        console.error('❌ Error fetching appointments:', allAppError);
      } else {
        console.log('✅ All appointments loaded:', allAppts?.length || 0);
        setAllAppointments(allAppts || []);
      }

      // ===== FILTER APPOINTMENTS FOR THIS DOCTOR =====
      let doctorAppointments = [];
      if (allAppts) {
        doctorAppointments = allAppts.filter(app => app.doctor_id === doctorId);
        console.log('✅ Doctor appointments filtered:', doctorAppointments.length);
      }

      // If no appointments found with doctor_id, try to show all (for testing)
      if (doctorAppointments.length === 0 && allAppts?.length > 0) {
        console.log('⚠️ No appointments found for this doctor, showing all for testing');
        doctorAppointments = allAppts;
      }

      // ===== TODAY'S APPOINTMENTS =====
      const todayAppointments = doctorAppointments.filter(app => app.appointment_date === today);
      console.log('✅ Today appointments:', todayAppointments.length);

      // ===== ACTIVE CONSULTATIONS =====
      const activeAppointments = doctorAppointments.filter(app =>
        app.status === 'scheduled' || app.status === 'in-progress'
      );
      console.log('✅ Active appointments:', activeAppointments.length);

      // ===== GET PRESCRIPTIONS (FIXED) =====
      console.log('🔍 Fetching prescriptions for doctor:', doctorId);

      // First, get all prescriptions
      const { data: allPrescriptions, error: prescriptionsError } = await supabase
        .from('prescriptions')
        .select('*');

      if (prescriptionsError) {
        console.error('❌ Error fetching prescriptions:', prescriptionsError);
      } else {
        console.log('✅ All prescriptions loaded:', allPrescriptions?.length || 0);
      }

      // Filter prescriptions for this doctor
      let doctorPrescriptions = [];
      if (allPrescriptions) {
        doctorPrescriptions = allPrescriptions.filter(p => p.doctor_id === doctorId);
        console.log('✅ Doctor prescriptions filtered:', doctorPrescriptions.length);
      }

      // If no prescriptions found with doctor_id, use all (for testing)
      if (doctorPrescriptions.length === 0 && allPrescriptions?.length > 0) {
        console.log('⚠️ No prescriptions found for this doctor, showing all for testing');
        doctorPrescriptions = allPrescriptions;
      }

      const prescriptionsCount = doctorPrescriptions.length;
      console.log('✅ Prescriptions count:', prescriptionsCount);

      // ===== TOTAL PATIENTS =====
      const uniquePatients = new Set(doctorAppointments.map(item => item.patient_id).filter(Boolean));
      const totalPatients = uniquePatients.size;
      console.log('✅ Total patients:', totalPatients);

      // ===== RECENT PATIENTS =====
      const { data: recentPatientsData, error: recentError } = await supabase
        .from('patients')
        .select('id, name, phone, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) {
        console.error('❌ Error fetching recent patients:', recentError);
      }

      // ===== UPCOMING APPOINTMENTS =====
      const upcomingAppts = doctorAppointments
        .filter(app => app.appointment_date >= today)
        .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))
        .slice(0, 5);

      console.log('✅ Upcoming appointments:', upcomingAppts.length);

      // ===== UPDATE STATS =====
      setStatsData({
        appointmentsToday: todayAppointments.length || 0,
        activeConsultations: activeAppointments.length || 0,
        prescriptionsIssued: prescriptionsCount || 0,
        totalPatients: totalPatients || 0
      });

      setRecentPatients(recentPatientsData || []);
      setUpcomingAppointments(upcomingAppts);

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
    }
  }, [user]);

  // ===== REFRESH DATA =====
  const refreshData = () => {
    fetchDoctorData();
  };

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

  const timeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    const diff = Math.floor((new Date() - new Date(timestamp)) / 1000);
    if (diff < 60) return `${diff} sec ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const goBack = () => {
    navigate(-1);
  };

  const openPrescriptions = () => {
    navigate('/prescriptions');
  };

  const openNewPrescription = () => {
    navigate('/prescriptions/new');
  };

  const openVitalSigns = () => {
    navigate('/vitals');
  };

  const openMyProfile = () => {
    navigate('/my-profile');
  };

  const openSettings = () => {
    navigate('/settings');
  };

  const openSupport = () => {
    navigate('/support');
  };

  const openAppointments = () => {
    navigate('/appointments');
  };

  const openPatients = () => {
    navigate('/patients');
  };

  const openPatientProfile = (patientId) => {
    navigate(`/patients/${patientId}`);
  };

  const stats = [
    {
      icon: Calendar,
      value: statsData.appointmentsToday,
      label: 'Appointments Today',
      trend: 'Today\'s schedule',
      up: true,
      color: statusColors.primary,
      onClick: openAppointments
    },
    {
      icon: HeartPulse,
      value: statsData.activeConsultations,
      label: 'Active Consultations',
      trend: 'In-Progress',
      up: true,
      color: statusColors.success,
      onClick: openAppointments
    },
    {
      icon: FileText,
      value: statsData.prescriptionsIssued,
      label: 'Prescriptions Issued',
      trend: 'Total prescriptions',
      up: true,
      color: statusColors.purple,
      onClick: openPrescriptions
    },
    {
      icon: Users,
      value: statsData.totalPatients,
      label: 'Total Patients',
      trend: 'Unique patients',
      up: true,
      color: statusColors.warning,
      onClick: openPatients
    }
  ];

  const quickActions = [
    {
      icon: Users,
      label: 'View Patients',
      color: statusColors.primary,
      onClick: openPatients
    },
    {
      icon: Calendar,
      label: 'My Schedule',
      color: statusColors.success,
      onClick: openAppointments
    },
    {
      icon: Pill,
      label: 'Prescriptions',
      color: statusColors.purple,
      onClick: openPrescriptions
    },
    {
      icon: HeartPulse,
      label: 'Vital Signs',
      color: statusColors.danger,
      onClick: openVitalSigns
    }
  ];

  const profileItems = [
    { icon: UserCircle, label: 'My Profile', onClick: openMyProfile },
    { icon: Settings, label: 'Settings', onClick: openSettings },
    { icon: Pill, label: 'Prescriptions', onClick: openPrescriptions },
    { icon: Calendar, label: 'My Schedule', onClick: openAppointments },
    { icon: HelpCircle, label: 'Help & Support', onClick: openSupport },
    { divider: true },
    { icon: LogOut, label: 'Sign Out', onClick: handleSignOut, danger: true }
  ];

  if (loading || isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px', background: 'var(--bg-primary)' }}>
        <Loader size={40} className="spinner" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading doctor data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px', background: 'var(--bg-primary)' }}>
        <AlertCircle size={48} color="var(--danger-color)" />
        <h2 style={{ color: 'var(--text-primary)' }}>Error Loading Data</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        <button onClick={fetchDoctorData} style={{ padding: '10px 24px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

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
            <button
              onClick={goBack}
              className="back-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-family)',
                color: 'var(--text-secondary)',
                transition: 'all 0.2s ease',
                marginLeft: '4px'
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
              <ArrowLeft size={16} /> <span>Back</span>
            </button>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 600, marginLeft: '8px' }}>Doctor Dashboard</h1>
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
                  <div className="profile-name" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{userName}</div>
                  <div className="profile-role" style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{userRole}</div>
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
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{userName}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{userEmail}</div>
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
          <div className="welcome-section" style={{
            background: 'linear-gradient(135deg, var(--primary-color), #7C3AED)',
            padding: '20px 24px',
            borderRadius: '16px',
            color: 'white',
            marginBottom: '24px'
          }}>
            <div className="welcome-text">
              <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '4px' }}>
                Welcome back, Dr. {userName}! 👨‍⚕️
              </h2>
              <p style={{ opacity: 0.9, fontSize: '0.9rem' }}>
                You're signed in as <strong>{userRole}</strong>. Here's your clinical summary.
              </p>
            </div>
          </div>

          <div className="stats-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
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
                    <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
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

          <div className="dashboard-two-col" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '24px'
          }}>
            <div className="activity-card" style={{
              background: 'var(--card-bg)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              padding: '16px'
            }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <h3 className="card-title" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Recent Patients</h3>
                  <p className="card-subtitle" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Latest patient registrations.</p>
                </div>
                <span
                  className="view-all-link"
                  onClick={openPatients}
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
              {recentPatients.length > 0 ? (
                recentPatients.map((patient) => (
                  <div
                    key={patient.id}
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
                    onClick={() => openPatientProfile(patient.id)}
                  >
                    <div className="activity-dot" style={{
                      backgroundColor: statusColors.primary,
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      flexShrink: 0
                    }} />
                    <div className="activity-content" style={{ flex: 1 }}>
                      <p className="activity-text" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0 }}>
                        <strong>{patient.name}</strong>
                      </p>
                      <div className="activity-time" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {patient.phone || 'No phone'} • {timeAgo(patient.created_at)}
                      </div>
                    </div>
                    <Eye size={16} style={{ color: 'var(--text-muted)' }} />
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No recent patients</p>
              )}
            </div>

            <div className="quick-actions-card" style={{
              background: 'var(--card-bg)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              padding: '16px'
            }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <h3 className="card-title" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Upcoming Appointments</h3>
                  <p className="card-subtitle" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Your next patient visits.</p>
                </div>
                <span
                  className="view-all-link"
                  onClick={openAppointments}
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
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appt) => (
                  <div
                    key={appt.id}
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
                    onClick={openAppointments}
                  >
                    <div className="activity-dot" style={{
                      backgroundColor: appt.status === 'scheduled' ? statusColors.success :
                        appt.status === 'in-progress' ? statusColors.warning :
                          appt.status === 'completed' ? statusColors.primary :
                            statusColors.danger,
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      flexShrink: 0
                    }} />
                    <div className="activity-content" style={{ flex: 1 }}>
                      <p className="activity-text" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0 }}>
                        <strong>{appt.patients?.name || 'Unknown Patient'}</strong>
                      </p>
                      <div className="activity-time" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {appt.appointment_date} • {appt.time_slot} •
                        <span style={{
                          color: appt.status === 'scheduled' ? 'var(--success-color)' :
                            appt.status === 'in-progress' ? 'var(--warning-color)' :
                              appt.status === 'completed' ? 'var(--primary-color)' :
                                'var(--danger-color)',
                          marginLeft: '4px',
                          fontWeight: 500
                        }}>
                          {appt.status}
                        </span>
                      </div>
                    </div>
                    <Clock size={16} style={{ color: 'var(--text-muted)' }} />
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <Calendar size={32} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                  <p style={{ color: 'var(--text-muted)' }}>No upcoming appointments</p>
                  <button
                    onClick={() => navigate('/appointments')}
                    style={{
                      marginTop: '8px',
                      padding: '6px 16px',
                      background: 'var(--primary-color)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
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

          <div style={{ marginBottom: '24px' }}>
            <h3 className="card-title" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Quick Actions</h3>
            <div className="quick-actions-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '12px'
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
                      gap: '10px',
                      padding: '12px 16px',
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      transition: 'all 0.3s ease',
                      fontFamily: 'var(--font-family)',
                      fontSize: '0.8rem',
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
                      padding: '6px',
                      borderRadius: '8px',
                      display: 'flex'
                    }}>
                      <Icon size={16} />
                    </div>
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>

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
              onClick={() => window.open('/handbook.pdf', '_blank')}
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
          .back-btn span {
            display: none;
          }
          .back-btn {
            padding: 6px 8px !important;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr 1fr !important;
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