import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus, CalendarDays, CheckCircle, Users,
  Clock, BookOpen, Menu, Search, LogOut, Loader, AlertCircle
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import SidebarOverlay from '../../components/SidebarOverlay';
import { supabase } from '../../services/supabaseClient';

const ReceptionistDashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ===== REAL DATA =====
  const [statsData, setStatsData] = useState({
    newRegistrations: 0,
    pendingAppointments: 0,
    patientsToday: 0,
    waitingPatients: 0
  });

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

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Guest';
  const userRole = user?.user_metadata?.role || 'User';
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

  // ===== FETCH REAL DATA =====
  const fetchReceptionistData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get new registrations today
      const { count: newRegistrations } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      // Get pending appointments
      const { count: pendingAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled');

      // Get patients today
      const { count: patientsToday } = await supabase
        .from('appointments')
        .select('patient_id', { count: 'exact', head: true })
        .eq('appointment_date', today);

      // Get waiting patients (checked-in but not seen)
      const { count: waitingPatients } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'checked-in');

      setStatsData({
        newRegistrations: newRegistrations || 0,
        pendingAppointments: pendingAppointments || 0,
        patientsToday: patientsToday || 0,
        waitingPatients: waitingPatients || 0
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReceptionistData();
  }, []);

  const handleNavigate = (page) => {
    navigate(`/${page}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const stats = [
    { icon: UserPlus, value: statsData.newRegistrations, label: 'New Registrations', trend: '+4 vs yesterday', up: true, color: '#2563EB' },
    { icon: CalendarDays, value: statsData.pendingAppointments, label: 'Pending Appointments', trend: '+3 scheduled', up: true, color: '#22C55E' },
    { icon: Users, value: statsData.patientsToday, label: 'Patients Today', trend: '+8 check-ins', up: true, color: '#8B5CF6' },
    { icon: Clock, value: statsData.waitingPatients, label: 'Waiting Patients', trend: '2 in queue', up: false, color: '#F59E0B' }
  ];

  if (loading || isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px', background: 'var(--bg-primary)' }}>
        <Loader size={40} className="spinner" />
        <p>Loading receptionist data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px', background: 'var(--bg-primary)' }}>
        <AlertCircle size={48} color="var(--danger-color)" />
        <h2>Error Loading Data</h2>
        <p>{error}</p>
        <button onClick={fetchReceptionistData} style={{ padding: '10px 24px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar active="receptionist" onNavigate={handleNavigate} user={user} onSignOut={handleSignOut} theme={theme} toggleTheme={toggleTheme} />
      <SidebarOverlay show={sidebarOpen} onClick={() => setSidebarOpen(false)} />

      <div className="main-content">
        <header className="dashboard-header">
          <div className="header-left">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu size={22} /></button>
            <h1>Receptionist Dashboard</h1>
            <form onSubmit={handleSearch} className="header-search-form">
              <Search size={18} className="search-icon" />
              <input type="text" placeholder="Search..." className="search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </form>
          </div>
          <div className="header-right">
            <span className="header-date">{currentDate}</span>
            <span className="header-time">{currentTime}</span>
            <button onClick={fetchReceptionistData} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }} title="Refresh">
              <Loader size={18} />
            </button>
            <div className="header-profile">
              <div className="profile-info">
                <div className="profile-name">{userName}</div>
                <div className="profile-role">{userRole}</div>
                <div className="profile-email">{userEmail}</div>
              </div>
              <div className="header-avatar">{userInitial}</div>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="welcome-section">
            <div className="welcome-text">
              <h2>Welcome back, {userName}! 👋</h2>
              <p>You're signed in as <strong>{userRole}</strong>. Here's what's happening today.</p>
            </div>
          </div>

          <div className="stats-grid">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="stat-card">
                  <div className="stat-card-top">
                    <div className="stat-card-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                      <Icon size={20} />
                    </div>
                  </div>
                  <div className="stat-card-value">{stat.value}</div>
                  <div className="stat-card-label">{stat.label}</div>
                  <div className={`stat-card-trend ${stat.up ? 'up' : 'down'}`}>{stat.trend}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;