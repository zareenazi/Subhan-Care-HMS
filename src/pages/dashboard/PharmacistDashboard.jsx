import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Clipboard, PackageCheck, AlertTriangle, Pill,
  BookOpen, Menu, Search, LogOut, Loader, AlertCircle,
  Plus, Eye, Edit, Trash2, Check, X, Clock, User,
  Calendar, DollarSign, FileText, Printer, Download,
  Filter, RefreshCw, ChevronDown, ChevronRight,
  MessageSquare, Wallet, Building, Hash, Stethoscope,
  Activity, ClipboardList, Syringe, TrendingUp, TrendingDown,
  BarChart3, PieChart, FileSpreadsheet, Send, Save,
  RotateCcw, MoreVertical, Phone, Mail, MapPin,
  Receipt, Truck, Package, ShoppingBag, Heart,
  Shield, Star, Award, Users, CalendarDays,
  Zap, Home, ArrowRight, Settings, Sparkles,
  ArrowLeft, AlertTriangle as AlertTriangleIcon,
  UserCircle, HelpCircle
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import SidebarOverlay from '../../components/SidebarOverlay';
import { supabase } from '../../services/supabaseClient';

const PharmacistDashboard = () => {
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

  // ===== USER INFO - FIXED =====
  // Try multiple sources to get user data
  const userName = user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Guest';

  const userRole = user?.user_metadata?.role ||
    user?.user_metadata?.user_role ||
    'Pharmacist';

  const userEmail = user?.email || '';
  const userInitial = userName.charAt(0).toUpperCase();

  // Log user data for debugging
  useEffect(() => {
    console.log('👤 User object:', user);
    console.log('👤 User metadata:', user?.user_metadata);
    console.log('👤 User name:', userName);
    console.log('👤 User role:', userRole);
    console.log('👤 User email:', userEmail);
  }, [user]);

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
    pendingPrescriptions: 0,
    totalStockItems: 0,
    nearingExpiry: 0,
    medicinesDispensed: 0,
    totalCategories: 0,
    lowStockItems: 0,
    totalValue: 0,
    monthlyDispensed: 0,
    weeklyDispensed: 0,
    todayDispensed: 0
  });

  const [prescriptions, setPrescriptions] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [tableExists, setTableExists] = useState(true);

  // ===== FORM STATE =====
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ===== ADD MEDICINE FORM =====
  const [medicineForm, setMedicineForm] = useState({
    medicine_name: '',
    stock: '',
    price: '',
    category: '',
    expiry_date: '',
    batch_number: '',
    manufacturer: '',
    supplier: '',
    reorder_level: '10',
    description: '',
    dosage: ''
  });

  // ===== ADD PRESCRIPTION FORM =====
  const [prescriptionForm, setPrescriptionForm] = useState({
    patient_name: '',
    medicine_name: '',
    quantity: '1',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });

  const categories = [
    'Antibiotics', 'Analgesics', 'Antipyretics', 'Antihistamines',
    'Antacids', 'Vitamins', 'Supplements', 'Antidepressants',
    'Antidiabetics', 'Antihypertensives', 'Cough & Cold',
    'Dermatological', 'Eye & Ear', 'Gastrointestinal',
    'Respiratory', 'Cardiovascular', 'Neurological', 'Other'
  ];

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

  // ===== CLOSE PROFILE DROPDOWN ON CLICK OUTSIDE =====
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ===== FETCH DATA FROM SUPABASE DIRECTLY =====
  const fetchPharmacistData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Get pending prescriptions
      const { data: pendingPrescriptions, count: pendingCount, error: presError } = await supabase
        .from('prescriptions')
        .select('*', { count: 'exact' })
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (presError) throw presError;

      // 2. Get all medicines
      const { data: medicinesData, count: stockCount, error: medError } = await supabase
        .from('medicines')
        .select('*', { count: 'exact' })
        .order('medicine_name', { ascending: true });

      if (medError) {
        console.log('Medicines table error:', medError.message);
        setTableExists(false);
        // Use dummy data if table doesn't exist
        const dummyMedicines = [
          { id: 1, medicine_name: 'Panadol 500mg', stock: 150, price: 15, category: 'Analgesics', expiry_date: '2026-12-31' },
          { id: 2, medicine_name: 'Augmentin 625mg', stock: 45, price: 85, category: 'Antibiotics', expiry_date: '2026-11-15' },
          { id: 3, medicine_name: 'Brufen 400mg', stock: 80, price: 25, category: 'Analgesics', expiry_date: '2027-01-20' },
          { id: 4, medicine_name: 'Ciprofloxacin 500mg', stock: 12, price: 45, category: 'Antibiotics', expiry_date: '2026-08-10' },
          { id: 5, medicine_name: 'Omeprazole 20mg', stock: 18, price: 30, category: 'Gastrointestinal', expiry_date: '2026-07-25' },
          { id: 6, medicine_name: 'Ventolin Inhaler', stock: 8, price: 120, category: 'Respiratory', expiry_date: '2026-06-30' },
        ];
        setMedicines(dummyMedicines);
        calculateStats(dummyMedicines);
      } else {
        setTableExists(true);
        setMedicines(medicinesData || []);
        calculateStats(medicinesData || []);
      }

      // 3. Get dispensed prescriptions today
      const today = new Date().toISOString().split('T')[0];
      const { count: todayCount, error: todayError } = await supabase
        .from('prescriptions')
        .select('*', { count: 'exact' })
        .eq('status', 'dispensed')
        .gte('created_at', today);

      if (todayError) throw todayError;

      // 4. Get monthly dispensed
      const monthStart = new Date();
      monthStart.setDate(1);
      const { count: monthlyCount, error: monthlyError } = await supabase
        .from('prescriptions')
        .select('*', { count: 'exact' })
        .eq('status', 'dispensed')
        .gte('created_at', monthStart.toISOString().split('T')[0]);

      if (monthlyError) throw monthlyError;

      // 5. Get weekly dispensed
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const { count: weeklyCount, error: weeklyError } = await supabase
        .from('prescriptions')
        .select('*', { count: 'exact' })
        .eq('status', 'dispensed')
        .gte('created_at', weekStart.toISOString().split('T')[0]);

      if (weeklyError) throw weeklyError;

      setPrescriptions(pendingPrescriptions || []);

      // 6. Recent activities
      const recentPrescriptions = (pendingPrescriptions || []).slice(0, 5).map(p => ({
        id: p.id,
        type: 'prescription',
        title: `New prescription for ${p.patient_name || 'Patient'}`,
        time: p.created_at,
        status: p.status
      }));

      setRecentActivities([...recentPrescriptions].sort((a, b) =>
        new Date(b.time) - new Date(a.time)
      ));

      setStatsData({
        pendingPrescriptions: pendingCount || 0,
        totalStockItems: stockCount || 0,
        nearingExpiry: 0,
        medicinesDispensed: todayCount || 0,
        totalCategories: 0,
        lowStockItems: 0,
        totalValue: 0,
        monthlyDispensed: monthlyCount || 0,
        weeklyDispensed: weeklyCount || 0,
        todayDispensed: todayCount || 0
      });

    } catch (err) {
      console.error('Error fetching pharmacy data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== CALCULATE STATISTICS =====
  const calculateStats = (data) => {
    const total = data.length;
    const inStock = data.filter(m => m.stock > 20).length;
    const lowStock = data.filter(m => m.stock > 0 && m.stock <= 20).length;
    const criticalStock = data.filter(m => m.stock > 0 && m.stock <= 5).length;
    const outOfStock = data.filter(m => m.stock === 0 || !m.stock).length;
    const totalValue = data.reduce((sum, m) => sum + (m.stock * m.price), 0);
    const categories = new Set(data.map(m => m.category || 'Other')).size;

    setStatsData(prev => ({
      ...prev,
      totalStockItems: total,
      nearingExpiry: data.filter(m => m.expiry_date && new Date(m.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length,
      totalCategories: categories,
      lowStockItems: lowStock,
      totalValue: totalValue
    }));

    setExpiringSoon(data.filter(m => m.expiry_date && new Date(m.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)));
    setLowStock(data.filter(m => m.stock <= 20));
  };

  useEffect(() => {
    fetchPharmacistData();

    const handleDataChange = () => {
      fetchPharmacistData();
    };
    window.addEventListener('prescriptionAdded', handleDataChange);
    window.addEventListener('prescriptionUpdated', handleDataChange);
    window.addEventListener('stockUpdated', handleDataChange);
    window.addEventListener('medicineAdded', handleDataChange);

    return () => {
      window.removeEventListener('prescriptionAdded', handleDataChange);
      window.removeEventListener('prescriptionUpdated', handleDataChange);
      window.removeEventListener('stockUpdated', handleDataChange);
      window.removeEventListener('medicineAdded', handleDataChange);
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
    if (view === 'addMedicine') {
      setMedicineForm({
        medicine_name: '',
        stock: '',
        price: '',
        category: '',
        expiry_date: '',
        batch_number: '',
        manufacturer: '',
        supplier: '',
        reorder_level: '10',
        description: '',
        dosage: ''
      });
    }
    if (view === 'addPrescription') {
      setPrescriptionForm({
        patient_name: '',
        medicine_name: '',
        quantity: '1',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      });
    }
    setErrorMsg('');
    setSuccessMsg('');
  };

  const goBackToDashboard = () => {
    setCurrentView('dashboard');
    setActiveTab('overview');
    fetchPharmacistData();
  };

  // ===== HANDLE PRESCRIPTION STATUS =====
  const updatePrescriptionStatus = async (id, status) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('prescriptions')
        .update({
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setSuccessMsg(`✅ Prescription ${status === 'dispensed' ? 'dispensed' : 'cancelled'} successfully!`);
      fetchPharmacistData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg('Failed to update prescription: ' + err.message);
      setTimeout(() => setErrorMsg(''), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  // ===== ADD MEDICINE =====
  const handleAddMedicine = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase
        .from('medicines')
        .insert([{
          medicine_name: medicineForm.medicine_name,
          stock: parseInt(medicineForm.stock) || 0,
          price: parseFloat(medicineForm.price) || 0,
          category: medicineForm.category || 'Other',
          expiry_date: medicineForm.expiry_date || null,
          batch_number: medicineForm.batch_number || null,
          manufacturer: medicineForm.manufacturer || null,
          supplier: medicineForm.supplier || null,
          reorder_level: parseInt(medicineForm.reorder_level) || 10,
          description: medicineForm.description || null,
          dosage: medicineForm.dosage || null,
          status: 'active'
        }]);

      if (error) throw error;

      setSuccessMsg(`✅ ${medicineForm.medicine_name} added successfully!`);
      setTimeout(() => {
        goBackToDashboard();
      }, 1500);
    } catch (err) {
      setErrorMsg('Failed to add medicine: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ===== ADD PRESCRIPTION =====
  const handleAddPrescription = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase
        .from('prescriptions')
        .insert([{
          patient_name: prescriptionForm.patient_name,
          medicine_name: prescriptionForm.medicine_name,
          quantity: parseInt(prescriptionForm.quantity) || 1,
          dosage: prescriptionForm.dosage || null,
          frequency: prescriptionForm.frequency || null,
          duration: prescriptionForm.duration || null,
          instructions: prescriptionForm.instructions || null,
          status: 'pending'
        }]);

      if (error) throw error;

      setSuccessMsg('✅ Prescription added successfully!');
      setTimeout(() => {
        goBackToDashboard();
      }, 1500);
    } catch (err) {
      setErrorMsg('Failed to add prescription: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ===== STATS CARDS =====
  const stats = [
    {
      icon: Clipboard,
      value: statsData.pendingPrescriptions,
      label: 'Pending Prescriptions',
      trend: `${statsData.pendingPrescriptions} awaiting`,
      up: statsData.pendingPrescriptions > 0,
      color: '#EF4444'
    },
    {
      icon: PackageCheck,
      value: statsData.totalStockItems,
      label: 'Total Stock Items',
      trend: `${statsData.totalCategories} categories`,
      up: statsData.totalStockItems > 0,
      color: '#22C55E'
    },
    {
      icon: AlertTriangle,
      value: statsData.nearingExpiry,
      label: 'Nearing Expiry',
      trend: `${statsData.nearingExpiry} items expiring soon`,
      up: false,
      color: '#F59E0B'
    },
    {
      icon: Pill,
      value: statsData.medicinesDispensed,
      label: 'Dispensed Today',
      trend: `This week: ${statsData.weeklyDispensed}`,
      up: statsData.medicinesDispensed > 0,
      color: '#8B5CF6'
    },
    {
      icon: AlertCircle,
      value: statsData.lowStockItems,
      label: 'Low Stock Items',
      trend: 'Need restocking',
      up: false,
      color: '#EC4899'
    },
    {
      icon: DollarSign,
      value: `Rs. ${statsData.totalValue.toLocaleString()}`,
      label: 'Total Inventory Value',
      trend: 'Current stock value',
      up: statsData.totalValue > 0,
      color: '#3B82F6'
    }
  ];

  // ===== QUICK ACTION CARDS =====
  const quickActions = [
    {
      icon: Clipboard,
      label: 'New Prescription',
      color: '#3B82F6',
      view: 'addPrescription'
    },
    {
      icon: PackageCheck,
      label: 'Add Medicine',
      color: '#22C55E',
      view: 'addMedicine'
    },
    {
      icon: AlertTriangle,
      label: 'Check Expiry',
      color: '#F59E0B',
      view: 'expiry'
    },
    {
      icon: Users,
      label: 'Patient Records',
      color: '#8B5CF6',
      view: 'patients'
    },
    {
      icon: Truck,
      label: 'Supplier Orders',
      color: '#EC4899',
      view: 'suppliers'
    },
    {
      icon: BarChart3,
      label: 'Reports',
      color: '#6366F1',
      view: 'reports'
    }
  ];

  // ============================================================
  // ===== RENDER VIEWS =====
  // ============================================================
  const renderView = () => {
    switch (currentView) {
      case 'addMedicine':
        return renderAddMedicine();
      case 'addPrescription':
        return renderAddPrescription();
      case 'expiry':
        return renderExpiry();
      case 'suppliers':
        return renderSuppliers();
      case 'reports':
        return renderReports();
      case 'patients':
        return renderPatients();
      default:
        return null;
    }
  };

  // ============================================================
  // ===== RENDER ADD MEDICINE =====
  // ============================================================
  const renderAddMedicine = () => (
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
          <PackageCheck size={20} style={{ color: '#22C55E' }} />
          Add New Medicine
        </h2>

        <form onSubmit={handleAddMedicine}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Medicine Name *
              </label>
              <input
                type="text"
                value={medicineForm.medicine_name}
                onChange={(e) => setMedicineForm(prev => ({ ...prev, medicine_name: e.target.value }))}
                required
                placeholder="e.g. Panadol 500mg"
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
                Category
              </label>
              <select
                value={medicineForm.category}
                onChange={(e) => setMedicineForm(prev => ({ ...prev, category: e.target.value }))}
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
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Stock (units) *
              </label>
              <input
                type="number"
                value={medicineForm.stock}
                onChange={(e) => setMedicineForm(prev => ({ ...prev, stock: e.target.value }))}
                required
                placeholder="e.g. 100"
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
                Price (Rs.) *
              </label>
              <input
                type="number"
                step="0.01"
                value={medicineForm.price}
                onChange={(e) => setMedicineForm(prev => ({ ...prev, price: e.target.value }))}
                required
                placeholder="e.g. 15.00"
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
                Batch Number
              </label>
              <input
                type="text"
                value={medicineForm.batch_number}
                onChange={(e) => setMedicineForm(prev => ({ ...prev, batch_number: e.target.value }))}
                placeholder="e.g. BATCH-001"
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
                Expiry Date
              </label>
              <input
                type="date"
                value={medicineForm.expiry_date}
                onChange={(e) => setMedicineForm(prev => ({ ...prev, expiry_date: e.target.value }))}
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
                Manufacturer
              </label>
              <input
                type="text"
                value={medicineForm.manufacturer}
                onChange={(e) => setMedicineForm(prev => ({ ...prev, manufacturer: e.target.value }))}
                placeholder="e.g. GSK Pakistan"
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
                Supplier
              </label>
              <input
                type="text"
                value={medicineForm.supplier}
                onChange={(e) => setMedicineForm(prev => ({ ...prev, supplier: e.target.value }))}
                placeholder="e.g. Pharm Distributors"
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
                Reorder Level
              </label>
              <input
                type="number"
                value={medicineForm.reorder_level}
                onChange={(e) => setMedicineForm(prev => ({ ...prev, reorder_level: e.target.value }))}
                placeholder="e.g. 10"
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
                Dosage
              </label>
              <input
                type="text"
                value={medicineForm.dosage}
                onChange={(e) => setMedicineForm(prev => ({ ...prev, dosage: e.target.value }))}
                placeholder="e.g. 500mg, 2 tablets daily"
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
              Description
            </label>
            <textarea
              value={medicineForm.description}
              onChange={(e) => setMedicineForm(prev => ({ ...prev, description: e.target.value }))}
              rows="3"
              placeholder="Brief description of the medicine..."
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
              {actionLoading ? 'Adding...' : 'Add Medicine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // ============================================================
  // ===== RENDER ADD PRESCRIPTION =====
  // ============================================================
  const renderAddPrescription = () => (
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
          <Clipboard size={20} style={{ color: '#3B82F6' }} />
          New Prescription
        </h2>

        <form onSubmit={handleAddPrescription}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Patient Name *
              </label>
              <input
                type="text"
                value={prescriptionForm.patient_name}
                onChange={(e) => setPrescriptionForm(prev => ({ ...prev, patient_name: e.target.value }))}
                required
                placeholder="Enter patient name"
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
                Medicine *
              </label>
              <input
                type="text"
                value={prescriptionForm.medicine_name}
                onChange={(e) => setPrescriptionForm(prev => ({ ...prev, medicine_name: e.target.value }))}
                required
                placeholder="e.g. Panadol 500mg"
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginTop: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Quantity *
              </label>
              <input
                type="number"
                value={prescriptionForm.quantity}
                onChange={(e) => setPrescriptionForm(prev => ({ ...prev, quantity: e.target.value }))}
                required
                min="1"
                placeholder="e.g. 2"
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
                Dosage
              </label>
              <input
                type="text"
                value={prescriptionForm.dosage}
                onChange={(e) => setPrescriptionForm(prev => ({ ...prev, dosage: e.target.value }))}
                placeholder="e.g. 500mg"
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
                Frequency
              </label>
              <input
                type="text"
                value={prescriptionForm.frequency}
                onChange={(e) => setPrescriptionForm(prev => ({ ...prev, frequency: e.target.value }))}
                placeholder="e.g. 3 times daily"
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
                Duration
              </label>
              <input
                type="text"
                value={prescriptionForm.duration}
                onChange={(e) => setPrescriptionForm(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="e.g. 7 days"
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
                Instructions
              </label>
              <input
                type="text"
                value={prescriptionForm.instructions}
                onChange={(e) => setPrescriptionForm(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="e.g. Take after meals"
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
              {actionLoading ? 'Saving...' : 'Save Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // ============================================================
  // ===== RENDER EXPIRY =====
  // ============================================================
  const renderExpiry = () => {
    const today = new Date().toISOString().split('T')[0];
    const expired = medicines.filter(m => m.expiry_date && m.expiry_date < today);
    const expiring = medicines.filter(m =>
      m.expiry_date && m.expiry_date >= today &&
      new Date(m.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    );

    return (
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
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div style={{
            padding: '16px',
            background: '#EF444410',
            borderRadius: '10px',
            border: '1px solid #EF444430',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.8rem', color: '#EF4444', fontWeight: 600 }}>Expired</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#EF4444' }}>{expired.length}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Medicines expired</div>
          </div>
          <div style={{
            padding: '16px',
            background: '#F59E0B10',
            borderRadius: '10px',
            border: '1px solid #F59E0B30',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.8rem', color: '#F59E0B', fontWeight: 600 }}>Expiring Soon</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#F59E0B' }}>{expiring.length}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Within 30 days</div>
          </div>
        </div>

        {medicines.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--text-muted)',
            background: 'var(--card-bg)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💊</div>
            No medicines in inventory
          </div>
        ) : (
          <>
            {expired.length > 0 && (
              <div style={{
                background: 'var(--card-bg)',
                borderRadius: '12px',
                border: '1px solid #EF444430',
                overflow: 'hidden',
                marginBottom: '16px'
              }}>
                <div style={{
                  padding: '12px 16px',
                  background: '#EF444410',
                  borderBottom: '1px solid #EF444430',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertTriangleIcon size={18} color="#EF4444" />
                  <span style={{ fontWeight: 600, color: '#EF4444' }}>Expired Medicines</span>
                </div>
                <div style={{ padding: '12px 16px' }}>
                  {expired.map((med, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '6px 0',
                      borderBottom: i < expired.length - 1 ? '1px solid var(--border-color)' : 'none'
                    }}>
                      <span>💊 {med.medicine_name}</span>
                      <span style={{ color: '#EF4444', fontSize: '0.8rem' }}>
                        Expired: {new Date(med.expiry_date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {expiring.length > 0 && (
              <div style={{
                background: 'var(--card-bg)',
                borderRadius: '12px',
                border: '1px solid #F59E0B30',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '12px 16px',
                  background: '#F59E0B10',
                  borderBottom: '1px solid #F59E0B30',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Calendar size={18} color="#F59E0B" />
                  <span style={{ fontWeight: 600, color: '#F59E0B' }}>Expiring Soon (Within 30 Days)</span>
                </div>
                <div style={{ padding: '12px 16px' }}>
                  {expiring.map((med, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '6px 0',
                      borderBottom: i < expiring.length - 1 ? '1px solid var(--border-color)' : 'none'
                    }}>
                      <span>💊 {med.medicine_name}</span>
                      <span style={{ color: '#F59E0B', fontSize: '0.8rem' }}>
                        Expires: {new Date(med.expiry_date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {expired.length === 0 && expiring.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: 'var(--text-muted)',
                background: 'var(--card-bg)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✅</div>
                No expiry issues found. All medicines are in good standing.
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // ============================================================
  // ===== RENDER SUPPLIERS =====
  // ============================================================
  const renderSuppliers = () => {
    const suppliers = medicines.reduce((acc, med) => {
      if (med.supplier && !acc.includes(med.supplier)) {
        acc.push(med.supplier);
      }
      return acc;
    }, []);

    return (
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
            <Truck size={20} style={{ color: '#EC4899' }} />
            Supplier Orders
          </h2>

          {suppliers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📦</div>
              No suppliers found. Add medicines with supplier information.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              {suppliers.map((supplier, i) => {
                const supplierMedicines = medicines.filter(m => m.supplier === supplier);
                const totalValue = supplierMedicines.reduce((sum, m) => sum + (m.stock * m.price), 0);

                return (
                  <div key={i} style={{
                    padding: '16px',
                    background: 'var(--bg-primary)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: '#EC489915',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#EC4899'
                      }}>
                        <Truck size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{supplier}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {supplierMedicines.length} products
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Total Value: <strong>Rs. {totalValue.toLocaleString()}</strong>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {supplierMedicines.map(m => m.medicine_name).join(', ')}
                    </div>
                    <button
                      style={{
                        marginTop: '10px',
                        padding: '4px 12px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      Contact Supplier
                    </button>
                  </div>
                );
              })}
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
          Pharmacy Reports
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
          <div style={{
            padding: '16px',
            background: 'var(--bg-primary)',
            borderRadius: '10px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Medicines</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{statsData.totalStockItems}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>in {statsData.totalCategories} categories</div>
          </div>

          <div style={{
            padding: '16px',
            background: 'var(--bg-primary)',
            borderRadius: '10px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Inventory Value</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Rs. {statsData.totalValue.toLocaleString()}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total stock value</div>
          </div>

          <div style={{
            padding: '16px',
            background: 'var(--bg-primary)',
            borderRadius: '10px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Prescriptions</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {statsData.pendingPrescriptions} pending
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {statsData.medicinesDispensed} dispensed today
            </div>
          </div>

          <div style={{
            padding: '16px',
            background: 'var(--bg-primary)',
            borderRadius: '10px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Stock Alerts</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#EF4444' }}>
              {statsData.lowStockItems} low stock
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {statsData.nearingExpiry} expiring soon
            </div>
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          <button
            onClick={() => window.print()}
            style={{
              padding: '8px 20px',
              border: 'none',
              borderRadius: '8px',
              background: 'var(--primary-color)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Printer size={18} /> Print Report
          </button>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // ===== RENDER PATIENTS =====
  // ============================================================
  const renderPatients = () => {
    const patients = prescriptions.reduce((acc, p) => {
      if (p.patient_name && !acc.includes(p.patient_name)) {
        acc.push(p.patient_name);
      }
      return acc;
    }, []);

    return (
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
            <Users size={20} style={{ color: '#8B5CF6' }} />
            Patient Records
          </h2>

          {patients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👤</div>
              No patient records found. Add prescriptions to create patient records.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {patients.map((patient, i) => {
                const patientPrescriptions = prescriptions.filter(p => p.patient_name === patient);
                const lastVisit = patientPrescriptions.length > 0
                  ? new Date(Math.max(...patientPrescriptions.map(p => new Date(p.created_at).getTime()))).toLocaleDateString()
                  : 'Never';

                return (
                  <div key={i} style={{
                    padding: '14px 16px',
                    background: 'var(--bg-primary)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>👤 {patient}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {patientPrescriptions.length} prescriptions
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Last visit: {lastVisit}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

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
                        background: activity.type === 'prescription' ? '#3B82F615' : '#22C55E15',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: activity.type === 'prescription' ? '#3B82F6' : '#22C55E'
                      }}>
                        {activity.type === 'prescription' ? <Clipboard size={14} /> : <PackageCheck size={14} />}
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
                        background: activity.status === 'pending' ? '#F59E0B20' :
                          activity.status === 'dispensed' ? '#22C55E20' :
                            '#3B82F620',
                        color: activity.status === 'pending' ? '#F59E0B' :
                          activity.status === 'dispensed' ? '#22C55E' :
                            '#3B82F6'
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

    // ===== PRESCRIPTIONS TAB =====
    if (activeTab === 'prescriptions') {
      return (
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
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <h3 style={{
              fontSize: '0.95rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <ClipboardList size={18} style={{ color: 'var(--primary-color)' }} />
              Pending Prescriptions ({prescriptions.length})
            </h3>
            <button
              onClick={() => goToView('addPrescription')}
              style={{
                padding: '6px 14px',
                border: 'none',
                borderRadius: '8px',
                background: 'var(--primary-color)',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Plus size={14} /> New
            </button>
          </div>

          {prescriptions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📋</div>
              No pending prescriptions
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Patient
                    </th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Medicine
                    </th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Quantity
                    </th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Date
                    </th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Status
                    </th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.map((pres, index) => (
                    <tr
                      key={pres.id}
                      style={{
                        borderBottom: index < prescriptions.length - 1 ? '1px solid var(--border-color)' : 'none',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '10px 14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {pres.patient_name || 'Unknown'}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>
                        {pres.medicine_name || '-'}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-primary)' }}>
                        {pres.quantity || 1}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {new Date(pres.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 10px',
                          borderRadius: '20px',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          background: '#F59E0B20',
                          color: '#F59E0B',
                          border: '1px solid #F59E0B30'
                        }}>
                          ⏳ Pending
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => updatePrescriptionStatus(pres.id, 'dispensed')}
                            style={{
                              padding: '4px 10px',
                              border: 'none',
                              borderRadius: '6px',
                              background: '#22C55E',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: '0.65rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            disabled={actionLoading}
                          >
                            <Check size={12} /> Dispense
                          </button>
                          <button
                            onClick={() => updatePrescriptionStatus(pres.id, 'cancelled')}
                            style={{
                              padding: '4px 10px',
                              border: 'none',
                              borderRadius: '6px',
                              background: '#EF4444',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: '0.65rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            disabled={actionLoading}
                          >
                            <X size={12} /> Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    // ===== INVENTORY/STOCK TAB =====
    if (activeTab === 'stock') {
      return (
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
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <h3 style={{
              fontSize: '0.95rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <PackageCheck size={18} style={{ color: '#22C55E' }} />
              Medicine Inventory ({medicines.length})
            </h3>
            <button
              onClick={() => goToView('addMedicine')}
              style={{
                padding: '6px 14px',
                border: 'none',
                borderRadius: '8px',
                background: '#22C55E',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Plus size={14} /> Add Medicine
            </button>
          </div>

          {medicines.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💊</div>
              <p>No medicines in inventory.</p>
              <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Please add medicines to get started.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Medicine
                    </th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Category
                    </th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Stock
                    </th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Price
                    </th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((med, index) => {
                    const isLow = med.stock <= 20;
                    const isCritical = med.stock <= 5;
                    return (
                      <tr
                        key={med.id}
                        style={{
                          borderBottom: index < medicines.length - 1 ? '1px solid var(--border-color)' : 'none',
                          background: isCritical ? '#EF444410' : isLow ? '#F59E0B10' : 'transparent'
                        }}
                      >
                        <td style={{ padding: '10px 14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                          💊 {med.medicine_name}
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                          {med.category || 'Other'}
                        </td>
                        <td style={{
                          padding: '10px 14px',
                          textAlign: 'center',
                          fontWeight: 600,
                          color: isCritical ? '#EF4444' : isLow ? '#F59E0B' : 'var(--text-primary)'
                        }}>
                          {med.stock} units
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                          Rs. {parseFloat(med.price).toFixed(2)}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 10px',
                            borderRadius: '20px',
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            background: isCritical ? '#EF444420' : isLow ? '#F59E0B20' : '#22C55E20',
                            color: isCritical ? '#EF4444' : isLow ? '#F59E0B' : '#22C55E',
                            border: `1px solid ${isCritical ? '#EF444430' : isLow ? '#F59E0B30' : '#22C55E30'}`
                          }}>
                            {isCritical ? '🔴 Critical' : isLow ? '🟡 Low' : '🟢 In Stock'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    // ===== ALERTS TAB =====
    if (activeTab === 'alerts') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Expiring Soon */}
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--border-color)',
              background: '#F59E0B10',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertTriangle size={18} />
                Expiring Soon ({expiringSoon.length})
              </h3>
            </div>
            {expiringSoon.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                ✅ No medicines expiring soon
              </div>
            ) : (
              <div style={{ padding: '12px 20px' }}>
                {expiringSoon.map((med, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '10px 14px',
                      borderBottom: index < expiringSoon.length - 1 ? '1px solid var(--border-color)' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        💊 {med.medicine_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Expires: {new Date(med.expiry_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '2px 10px',
                        borderRadius: '12px',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        background: '#F59E0B20',
                        color: '#F59E0B'
                      }}>
                        {med.stock} units left
                      </span>
                      <button
                        onClick={() => goToView('addMedicine')}
                        style={{
                          padding: '4px 10px',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          background: 'transparent',
                          cursor: 'pointer',
                          fontSize: '0.65rem',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        Restock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low Stock */}
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--border-color)',
              background: '#EF444410',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={18} />
                Low Stock Items ({lowStock.length})
              </h3>
            </div>
            {lowStock.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                ✅ All medicines have sufficient stock
              </div>
            ) : (
              <div style={{ padding: '12px 20px' }}>
                {lowStock.map((med, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '10px 14px',
                      borderBottom: index < lowStock.length - 1 ? '1px solid var(--border-color)' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        💊 {med.medicine_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Reorder at: {med.reorder_level || 10} units
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '2px 10px',
                        borderRadius: '12px',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        background: med.stock <= 5 ? '#EF444420' : '#F59E0B20',
                        color: med.stock <= 5 ? '#EF4444' : '#F59E0B'
                      }}>
                        {med.stock} units left
                      </span>
                      <button
                        onClick={() => goToView('addMedicine')}
                        style={{
                          padding: '4px 10px',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          background: 'transparent',
                          cursor: 'pointer',
                          fontSize: '0.65rem',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        Restock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
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
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Loading pharmacy dashboard...</p>
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
          onClick={fetchPharmacistData}
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
      <Sidebar active="pharmacy" onNavigate={handleNavigate} user={user} onSignOut={handleSignOut} theme={theme} toggleTheme={toggleTheme} />
      <SidebarOverlay show={sidebarOpen} onClick={() => setSidebarOpen(false)} />

      <div className="main-content">
        <header className="dashboard-header">
          <div className="header-left">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={22} />
            </button>
            <h1>Pharmacy Dashboard</h1>
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
              onClick={fetchPharmacistData}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>

            {/* ===== PROFILE SECTION WITH DROPDOWN - FIXED ===== */}
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
                <h2>Welcome back, {userName}! 💊</h2>
                <p>You're signed in as <strong>{userRole}</strong>. Here's your pharmacy overview.</p>
                {!tableExists && (
                  <div style={{
                    padding: '8px 14px',
                    background: '#EF444415',
                    border: '1px solid #EF444430',
                    borderRadius: '8px',
                    color: '#EF4444',
                    fontSize: '0.8rem',
                    marginTop: '8px'
                  }}>
                    ⚠️ Medicines table not found. Please run the SQL script to create tables.
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  flexWrap: 'wrap',
                  marginTop: '8px',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)'
                }}>
                  <span>📋 Pending: {statsData.pendingPrescriptions}</span>
                  <span>💊 Stock: {statsData.totalStockItems}</span>
                  <span>⚠️ Expiring: {statsData.nearingExpiry}</span>
                  <span>📦 Low Stock: {statsData.lowStockItems}</span>
                  <span>💰 Value: Rs. {statsData.totalValue.toLocaleString()}</span>
                </div>
              </div>
              <button
                onClick={() => goToView('addPrescription')}
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
                <Plus size={18} /> New Prescription
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
                onClick={() => setActiveTab('prescriptions')}
                style={{
                  padding: '8px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  background: activeTab === 'prescriptions' ? 'var(--primary-color)' : 'transparent',
                  color: activeTab === 'prescriptions' ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: activeTab === 'prescriptions' ? 600 : 400,
                  fontFamily: 'var(--font-family)',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <ClipboardList size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Prescriptions ({prescriptions.length})
              </button>
              <button
                onClick={() => setActiveTab('stock')}
                style={{
                  padding: '8px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  background: activeTab === 'stock' ? 'var(--primary-color)' : 'transparent',
                  color: activeTab === 'stock' ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: activeTab === 'stock' ? 600 : 400,
                  fontFamily: 'var(--font-family)',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <PackageCheck size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Inventory ({medicines.length})
              </button>
              <button
                onClick={() => setActiveTab('alerts')}
                style={{
                  padding: '8px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  background: activeTab === 'alerts' ? '#EF4444' : 'transparent',
                  color: activeTab === 'alerts' ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: activeTab === 'alerts' ? 600 : 400,
                  fontFamily: 'var(--font-family)',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <AlertTriangle size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Alerts ({expiringSoon.length + lowStock.length})
              </button>
            </div>
          )}

          {/* ===== RENDER CONTENT ===== */}
          {currentView !== 'dashboard' ? renderView() : renderDashboardContent()}
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

        /* Profile styles - FIXED */
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

export default PharmacistDashboard;