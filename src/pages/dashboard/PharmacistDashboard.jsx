import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Clipboard, PackageCheck, AlertTriangle, Pill,
  BookOpen, Menu, Search, LogOut, Loader, AlertCircle
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import SidebarOverlay from '../../components/SidebarOverlay';
import { supabase } from '../../services/supabaseClient';

const PharmacistDashboard = () => {
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
    pendingPrescriptions: 0,
    totalStockItems: 0,
    nearingExpiry: 0,
    medicinesDispensed: 0
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
  const fetchPharmacistData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get pending prescriptions
      const { count: pendingPrescriptions } = await supabase
        .from('prescriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get total stock items
      const { count: totalStockItems } = await supabase
        .from('medicines')
        .select('*', { count: 'exact', head: true });

      // Get nearing expiry items (expiry_date < 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const { count: nearingExpiry } = await supabase
        .from('medicines')
        .select('*', { count: 'exact', head: true })
        .lt('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0]);

      // Get medicines dispensed today
      const today = new Date().toISOString().split('T')[0];
      const { count: medicinesDispensed } = await supabase
        .from('prescriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'dispensed')
        .gte('created_at', today);

      setStatsData({
        pendingPrescriptions: pendingPrescriptions || 0,
        totalStockItems: totalStockItems || 0,
        nearingExpiry: nearingExpiry || 0,
        medicinesDispensed: medicinesDispensed || 0
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPharmacistData();
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
    { icon: Clipboard, value: statsData.pendingPrescriptions, label: 'Pending Prescriptions', trend: '+2 today', up: false, color: '#EF4444' },
    { icon: PackageCheck, value: statsData.totalStockItems, label: 'Total Stock Items', trend: '+12 this month', up: true, color: '#22C55E' },
    { icon: AlertTriangle, value: statsData.nearingExpiry, label: 'Nearing Expiry', trend: '-3 vs last month', up: true, color: '#F59E0B' },
    { icon: Pill, value: statsData.medicinesDispensed, label: 'Medicines Dispensed', trend: '+8 today', up: true, color: '#8B5CF6' }
  ];

  if (loading || isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px', background: 'var(--bg-primary)' }}>
        <Loader size={40} className="spinner" />
        <p>Loading pharmacy data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px', background: 'var(--bg-primary)' }}>
        <AlertCircle size={48} color="var(--danger-color)" />
        <h2>Error Loading Data</h2>
        <p>{error}</p>
        <button onClick={fetchPharmacistData} style={{ padding: '10px 24px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar active="pharmacy" onNavigate={handleNavigate} user={user} onSignOut={handleSignOut} theme={theme} toggleTheme={toggleTheme} />
      <SidebarOverlay show={sidebarOpen} onClick={() => setSidebarOpen(false)} />

      <div className="main-content">
        <header className="dashboard-header">
          <div className="header-left">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu size={22} /></button>
            <h1>Pharmacy Dashboard</h1>
            <form onSubmit={handleSearch} className="header-search-form">
              <Search size={18} className="search-icon" />
              <input type="text" placeholder="Search..." className="search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </form>
          </div>
          <div className="header-right">
            <span className="header-date">{currentDate}</span>
            <span className="header-time">{currentTime}</span>
            <button onClick={fetchPharmacistData} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }} title="Refresh">
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
              <h2>Welcome back, {userName}! 💊</h2>
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

export default PharmacistDashboard;