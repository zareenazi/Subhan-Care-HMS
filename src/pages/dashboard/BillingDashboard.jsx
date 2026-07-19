import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Sidebar from '../../components/Sidebar';
import SidebarOverlay from '../../components/SidebarOverlay';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Eye, CreditCard, Check, X, FileText, Printer,
  ShieldAlert, Download, Filter, Calendar, Users, DollarSign,
  TrendingUp, TrendingDown, AlertCircle, Edit, Trash2,
  RefreshCw, ChevronDown, ChevronRight, MoreVertical,
  Clock, User, Phone, Mail, MapPin, Hash, Receipt,
  Wallet, Banknote, Building, Tag, Percent, Calculator,
  MessageSquare, FileCheck, Send, Save, RotateCcw,
  Home, ArrowLeft, Loader, Clipboard, Pill, Stethoscope,
  FileSpreadsheet, FileJson, Activity, Truck, Package, Box,
  Settings, Sun, Moon, Menu, LogOut
} from 'lucide-react';

const BillingDashboard = () => {
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = React.useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // ===== DATA STATE =====
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [supplierPayments, setSupplierPayments] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [activeTab, setActiveTab] = useState('invoices');

  // ===== INVOICE FILTER STATE =====
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('all');
  const [invoiceDateFilter, setInvoiceDateFilter] = useState('');
  const [showInvoiceFilters, setShowInvoiceFilters] = useState(false);
  const [invoiceSortBy, setInvoiceSortBy] = useState('newest');

  // ===== SUPPLIER PAYMENT FILTER STATE =====
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [paymentDateFilter, setPaymentDateFilter] = useState('');
  const [showPaymentFilters, setShowPaymentFilters] = useState(false);
  const [paymentSortBy, setPaymentSortBy] = useState('newest');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  const [statsData, setStatsData] = useState({
    unpaidInvoices: 0,
    paymentsCollected: 0,
    collectedAmount: 0,
    pendingAmount: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    cancelledInvoices: 0,
    averageAmount: 0,
    monthlyRevenue: 0,
    weeklyRevenue: 0,
    todayRevenue: 0,
    totalSupplierPayments: 0,
    totalSupplierPaid: 0,
    totalSupplierPending: 0,
    supplierPaidAmount: 0,
    supplierPendingAmount: 0,
    totalSuppliers: 0
  });

  // ===== MODAL STATES =====
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // ===== SUPPLIER PAYMENT MODAL STATES =====
  const [showSupplierPaymentModal, setShowSupplierPaymentModal] = useState(false);
  const [showSupplierPaymentViewModal, setShowSupplierPaymentViewModal] = useState(false);
  const [showSupplierPaymentEditModal, setShowSupplierPaymentEditModal] = useState(false);
  const [showSupplierPaymentDeleteModal, setShowSupplierPaymentDeleteModal] = useState(false);
  const [showSupplierReceiptModal, setShowSupplierReceiptModal] = useState(false);
  const [showSupplierPayModal, setShowSupplierPayModal] = useState(false);
  const [selectedSupplierPayment, setSelectedSupplierPayment] = useState(null);
  const [lastProcessedPayment, setLastProcessedPayment] = useState(null);

  // ===== FORM STATE =====
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_id: '',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    items: [],
    item_name: '',
    item_description: '',
    item_quantity: 1,
    item_price: '',
    subtotal: 0,
    discount_type: 'percentage',
    discount_value: 0,
    discount_amount: 0,
    tax_type: 'percentage',
    tax_value: 0,
    tax_amount: 0,
    total: 0,
    notes: '',
    reference: '',
    department: '',
    status: 'pending',
    paid_amount: 0,
    payment_method: 'cash',
    payment_notes: '',
    remaining_amount: 0
  });

  // ===== SUPPLIER PAYMENT FORM (FIXED - notes instead of payment_notes) =====
  const [supplierPaymentForm, setSupplierPaymentForm] = useState({
    supplier_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    reference: '',
    notes: '',  // ← FIXED: payment_notes se notes
    status: 'paid'
  });

  // ===== SUPPLIER PAY FORM (FIXED - notes instead of payment_notes) =====
  const [supplierPayForm, setSupplierPayForm] = useState({
    amount: '',
    payment_method: 'cash',
    notes: ''  // ← FIXED: payment_notes se notes
  });

  const [formErrors, setFormErrors] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ===== USER INFO =====
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Guest';
  const userRole = user?.user_metadata?.role || 'User';
  const userEmail = user?.email || '';
  const userInitial = userName.charAt(0).toUpperCase();

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

  // ===== CLOSE DROPDOWN ON OUTSIDE CLICK =====
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // ===== FETCH DATA =====
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch Invoices
      const { data: invoicesData, error: invError } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (invError) throw invError;

      const { data: patientsData, error: patError } = await supabase
        .from('patients')
        .select('id, name, phone, email');

      if (patError) throw patError;

      const mergedInvoices = invoicesData?.map(inv => ({
        ...inv,
        patient: patientsData?.find(p => p.id === inv.patient_id) || null
      })) || [];

      setInvoices(mergedInvoices);
      setPatients(patientsData || []);

      // Fetch Suppliers
      const { data: suppliersData, error: supError } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true });

      if (supError) {
        setSuppliers([]);
      } else {
        setSuppliers(suppliersData || []);
      }

      // Fetch Supplier Payments
      const { data: paymentsData, error: payError } = await supabase
        .from('supplier_payments')
        .select('*, suppliers:supplier_id(name, phone)')
        .order('created_at', { ascending: false });

      if (payError) {
        setSupplierPayments([]);
      } else {
        setSupplierPayments(paymentsData || []);
      }

      // Calculate Stats
      const unpaid = mergedInvoices.filter(i => i.status === 'unpaid' || i.status === 'pending');
      const paid = mergedInvoices.filter(i => i.status === 'paid');
      const cancelled = mergedInvoices.filter(i => i.status === 'cancelled');
      const totalCollected = paid.reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0);
      const totalPending = unpaid.reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0);

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const monthlyRevenue = paid
        .filter(i => {
          const date = new Date(i.created_at);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weeklyRevenue = paid
        .filter(i => new Date(i.created_at) >= weekAgo)
        .reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0);

      const today = new Date().toDateString();
      const todayRevenue = paid
        .filter(i => new Date(i.created_at).toDateString() === today)
        .reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0);

      const supplierPaid = (paymentsData || []).filter(p => p.status === 'paid');
      const supplierPending = (paymentsData || []).filter(p => p.status === 'pending');
      const supplierPaidAmount = supplierPaid.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      const supplierPendingAmount = supplierPending.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

      setStatsData({
        unpaidInvoices: unpaid.length,
        paymentsCollected: paid.length,
        collectedAmount: totalCollected,
        pendingAmount: totalPending,
        totalInvoices: mergedInvoices.length,
        paidInvoices: paid.length,
        cancelledInvoices: cancelled.length,
        averageAmount: mergedInvoices.length > 0 ? totalCollected / mergedInvoices.length : 0,
        monthlyRevenue: monthlyRevenue,
        weeklyRevenue: weeklyRevenue,
        todayRevenue: todayRevenue,
        totalSupplierPayments: paymentsData?.length || 0,
        totalSupplierPaid: supplierPaid.length,
        totalSupplierPending: supplierPending.length,
        supplierPaidAmount: supplierPaidAmount,
        supplierPendingAmount: supplierPendingAmount,
        totalSuppliers: suppliersData?.length || 0
      });

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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

  const handleSignOut = async () => {
    setIsDropdownOpen(false);
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // ===== FILTERED INVOICES =====
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = searchQuery === '' ||
      inv.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.patient?.phone?.includes(searchQuery);

    const matchesStatus = invoiceStatusFilter === 'all' || inv.status === invoiceStatusFilter;

    const matchesDate = invoiceDateFilter === '' ||
      new Date(inv.invoice_date || inv.created_at).toDateString() === new Date(invoiceDateFilter).toDateString();

    return matchesSearch && matchesStatus && matchesDate;
  });

  // ===== SORT INVOICES =====
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    if (invoiceSortBy === 'newest') {
      return new Date(b.created_at) - new Date(a.created_at);
    } else if (invoiceSortBy === 'oldest') {
      return new Date(a.created_at) - new Date(b.created_at);
    } else if (invoiceSortBy === 'amount') {
      return parseFloat(b.total) - parseFloat(a.total);
    } else if (invoiceSortBy === 'patient') {
      return (a.patient?.name || '').localeCompare(b.patient?.name || '');
    }
    return 0;
  });

  // ===== FILTERED SUPPLIER PAYMENTS =====
  const filteredSupplierPayments = supplierPayments.filter(payment => {
    const matchesSearch = searchQuery === '' ||
      payment.suppliers?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.reference?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = paymentStatusFilter === 'all' || payment.status === paymentStatusFilter;
    const matchesSupplier = supplierFilter === '' || payment.supplier_id === supplierFilter;
    const matchesMethod = methodFilter === '' || payment.payment_method === methodFilter;

    const matchesDate = paymentDateFilter === '' ||
      new Date(payment.payment_date).toDateString() === new Date(paymentDateFilter).toDateString();

    return matchesSearch && matchesStatus && matchesSupplier && matchesMethod && matchesDate;
  });

  // ===== SORT SUPPLIER PAYMENTS =====
  const sortedSupplierPayments = [...filteredSupplierPayments].sort((a, b) => {
    if (paymentSortBy === 'newest') {
      return new Date(b.created_at) - new Date(a.created_at);
    } else if (paymentSortBy === 'oldest') {
      return new Date(a.created_at) - new Date(b.created_at);
    } else if (paymentSortBy === 'amount') {
      return parseFloat(b.amount) - parseFloat(a.amount);
    } else if (paymentSortBy === 'supplier') {
      return (a.suppliers?.name || '').localeCompare(b.suppliers?.name || '');
    }
    return 0;
  });

  // ===== GET STATUS BADGE =====
  const getStatusBadge = (status) => {
    const map = {
      paid: { label: 'Paid', color: '#22C55E', bg: '#22C55E15' },
      unpaid: { label: 'Unpaid', color: '#EF4444', bg: '#EF444415' },
      pending: { label: 'Pending', color: '#F59E0B', bg: '#F59E0B15' },
      partial: { label: 'Partial', color: '#8B5CF6', bg: '#8B5CF615' },
      cancelled: { label: 'Cancelled', color: '#6B7280', bg: '#6B728015' },
      refunded: { label: 'Refunded', color: '#EC4899', bg: '#EC489915' }
    };
    return map[status] || map.pending;
  };

  // ===== GET SUPPLIER PAYMENT STATUS BADGE =====
  const getSupplierPaymentStatusBadge = (status) => {
    const map = {
      paid: { label: 'Paid', color: '#22C55E', bg: '#22C55E15', icon: '✅' },
      pending: { label: 'Pending', color: '#F59E0B', bg: '#F59E0B15', icon: '⏳' }
    };
    return map[status] || map.pending;
  };

  // ===== OPEN MODALS =====
  const openViewModal = (invoice) => {
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  };

  const openEditModal = (invoice) => {
    setSelectedInvoice(invoice);
    setFormData({
      patient_id: invoice.patient_id || '',
      doctor_id: invoice.doctor_id || '',
      appointment_id: invoice.appointment_id || '',
      invoice_number: invoice.invoice_number || '',
      invoice_date: invoice.invoice_date || new Date().toISOString().split('T')[0],
      due_date: invoice.due_date || '',
      items: invoice.items || [],
      item_name: '',
      item_description: '',
      item_quantity: 1,
      item_price: '',
      subtotal: invoice.subtotal || 0,
      discount_type: invoice.discount_type || 'percentage',
      discount_value: invoice.discount_value || 0,
      discount_amount: invoice.discount_amount || 0,
      tax_type: invoice.tax_type || 'percentage',
      tax_value: invoice.tax_value || 0,
      tax_amount: invoice.tax_amount || 0,
      total: invoice.total || 0,
      notes: invoice.notes || '',
      reference: invoice.reference || '',
      department: invoice.department || '',
      status: invoice.status || 'pending'
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (invoice) => {
    setSelectedInvoice(invoice);
    setShowDeleteModal(true);
  };

  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setFormData(prev => ({
      ...prev,
      paid_amount: 0,
      payment_method: 'cash',
      payment_notes: '',
      remaining_amount: invoice.total || 0
    }));
    setShowPaymentModal(true);
  };

  // ===== SUPPLIER PAYMENT MODALS =====
  const openSupplierPaymentModal = () => {
    setSupplierPaymentForm({
      supplier_id: '',
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      reference: '',
      notes: '',
      status: 'paid'
    });
    setErrorMsg('');
    setSuccessMsg('');
    setShowSupplierPaymentModal(true);
  };

  const openSupplierPaymentViewModal = (payment) => {
    setSelectedSupplierPayment(payment);
    setShowSupplierPaymentViewModal(true);
  };

  const openSupplierPaymentEditModal = (payment) => {
    setSelectedSupplierPayment(payment);
    setSupplierPaymentForm({
      supplier_id: payment.supplier_id || '',
      amount: payment.amount || '',
      payment_date: payment.payment_date || new Date().toISOString().split('T')[0],
      payment_method: payment.payment_method || 'cash',
      reference: payment.reference || '',
      notes: payment.notes || '',
      status: payment.status || 'paid'
    });
    setErrorMsg('');
    setSuccessMsg('');
    setShowSupplierPaymentEditModal(true);
  };

  const openSupplierPaymentDeleteModal = (payment) => {
    setSelectedSupplierPayment(payment);
    setShowSupplierPaymentDeleteModal(true);
  };

  const openSupplierReceiptModal = (payment) => {
    setSelectedSupplierPayment(payment);
    setShowSupplierReceiptModal(true);
  };

  // ===== OPEN SUPPLIER PAY MODAL (like invoice pay) =====
  const openSupplierPayModal = (payment) => {
    setSelectedSupplierPayment(payment);
    setSupplierPayForm({
      amount: payment.amount || 0,
      payment_method: 'cash',
      notes: ''
    });
    setErrorMsg('');
    setSuccessMsg('');
    setShowSupplierPayModal(true);
  };

  // ===== HANDLE PAYMENT =====
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const paidAmount = parseFloat(formData.paid_amount) || 0;
      const totalAmount = parseFloat(selectedInvoice.total) || 0;
      const remaining = totalAmount - paidAmount;

      const { error } = await supabase
        .from('invoices')
        .update({
          status: remaining <= 0 ? 'paid' : 'partial',
          payment_method: formData.payment_method,
          paid_amount: paidAmount,
          remaining_amount: remaining,
          payment_notes: formData.payment_notes || null,
          payment_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedInvoice.id);

      if (error) throw error;

      setSuccessMsg('✅ Payment processed successfully!');
      setShowPaymentModal(false);
      setShowReceiptModal(true);
      await fetchData();

    } catch (err) {
      setErrorMsg('Failed to process payment: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ===== HANDLE SUPPLIER PAY (FIXED - notes instead of payment_notes) =====
  const handleSupplierPaySubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(supplierPayForm.amount) || 0;
    const totalAmount = parseFloat(selectedSupplierPayment.amount) || 0;

    if (amount <= 0) {
      setErrorMsg('Please enter a valid amount');
      return;
    }
    if (amount > totalAmount) {
      setErrorMsg('Payment amount cannot exceed total amount');
      return;
    }

    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const remaining = totalAmount - amount;
      const newStatus = remaining <= 0 ? 'paid' : 'pending';

      const { data, error } = await supabase
        .from('supplier_payments')
        .update({
          amount: amount,
          status: newStatus,
          payment_method: supplierPayForm.payment_method,
          notes: supplierPayForm.notes || null,  // ← FIXED: payment_notes se notes
          payment_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSupplierPayment.id)
        .select();

      if (error) throw error;

      const updatedPayment = {
        ...selectedSupplierPayment,
        ...data?.[0],
        suppliers: suppliers.find(s => s.id === selectedSupplierPayment.supplier_id)
      };
      setLastProcessedPayment(updatedPayment);

      setSuccessMsg(`✅ Payment of Rs. ${amount.toFixed(2)} processed successfully!`);
      setShowSupplierPayModal(false);
      setShowSupplierReceiptModal(true);
      await fetchData();

    } catch (err) {
      setErrorMsg('Failed to process payment: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ===== HANDLE SUPPLIER PAYMENT (FIXED - notes instead of payment_notes) =====
  const handleSupplierPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!supplierPaymentForm.supplier_id) {
      setErrorMsg('Please select a supplier');
      return;
    }
    if (!supplierPaymentForm.amount || parseFloat(supplierPaymentForm.amount) <= 0) {
      setErrorMsg('Please enter a valid amount');
      return;
    }

    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const paymentData = {
        supplier_id: supplierPaymentForm.supplier_id,
        amount: parseFloat(supplierPaymentForm.amount),
        payment_date: supplierPaymentForm.payment_date || new Date().toISOString().split('T')[0],
        payment_method: supplierPaymentForm.payment_method,
        reference: supplierPaymentForm.reference || null,
        notes: supplierPaymentForm.notes || null,  // ← FIXED: payment_notes se notes
        status: supplierPaymentForm.status || 'paid',
        created_by: user?.id || null,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('supplier_payments')
        .insert([paymentData])
        .select();

      if (error) throw error;

      const processedPayment = {
        ...paymentData,
        id: data?.[0]?.id,
        suppliers: suppliers.find(s => s.id === paymentData.supplier_id)
      };
      setLastProcessedPayment(processedPayment);

      setSuccessMsg(`✅ Payment of Rs. ${supplierPaymentForm.amount} processed successfully!`);
      setShowSupplierPaymentModal(false);
      setShowSupplierReceiptModal(true);
      await fetchData();

    } catch (err) {
      setErrorMsg('Failed to process payment: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ===== HANDLE SUPPLIER PAYMENT UPDATE (FIXED - notes instead of payment_notes) =====
  const handleSupplierPaymentUpdate = async (e) => {
    e.preventDefault();
    if (!supplierPaymentForm.supplier_id) {
      setErrorMsg('Please select a supplier');
      return;
    }
    if (!supplierPaymentForm.amount || parseFloat(supplierPaymentForm.amount) <= 0) {
      setErrorMsg('Please enter a valid amount');
      return;
    }

    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const paymentData = {
        supplier_id: supplierPaymentForm.supplier_id,
        amount: parseFloat(supplierPaymentForm.amount),
        payment_date: supplierPaymentForm.payment_date || new Date().toISOString().split('T')[0],
        payment_method: supplierPaymentForm.payment_method,
        reference: supplierPaymentForm.reference || null,
        notes: supplierPaymentForm.notes || null,  // ← FIXED: payment_notes se notes
        status: supplierPaymentForm.status || 'paid',
        updated_by: user?.id || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('supplier_payments')
        .update(paymentData)
        .eq('id', selectedSupplierPayment.id);

      if (error) throw error;

      setSuccessMsg(`✅ Payment updated successfully!`);
      setShowSupplierPaymentEditModal(false);
      await fetchData();

    } catch (err) {
      setErrorMsg('Failed to update payment: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ===== HANDLE SUPPLIER PAYMENT DELETE =====
  const handleSupplierPaymentDelete = async () => {
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase
        .from('supplier_payments')
        .delete()
        .eq('id', selectedSupplierPayment.id);

      if (error) throw error;

      setSuccessMsg('✅ Payment deleted successfully!');
      setShowSupplierPaymentDeleteModal(false);
      await fetchData();

    } catch (err) {
      setErrorMsg('Failed to delete payment: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ===== HANDLE DELETE =====
  const handleDelete = async () => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', selectedInvoice.id);

      if (error) throw error;

      setSuccessMsg('✅ Invoice deleted successfully!');
      setShowDeleteModal(false);
      await fetchData();

    } catch (err) {
      setErrorMsg('Failed to delete invoice: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ===== HANDLE UPDATE =====
  const handleUpdate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          patient_id: formData.patient_id,
          doctor_id: formData.doctor_id || null,
          appointment_id: formData.appointment_id || null,
          invoice_number: formData.invoice_number,
          invoice_date: formData.invoice_date,
          due_date: formData.due_date,
          items: formData.items,
          subtotal: formData.subtotal,
          discount_type: formData.discount_type,
          discount_value: formData.discount_value || 0,
          discount_amount: formData.discount_amount || 0,
          tax_type: formData.tax_type,
          tax_value: formData.tax_value || 0,
          tax_amount: formData.tax_amount || 0,
          total: formData.total,
          notes: formData.notes || null,
          reference: formData.reference || null,
          department: formData.department || null,
          status: formData.status || 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedInvoice.id);

      if (error) throw error;

      setSuccessMsg('✅ Invoice updated successfully!');
      setShowEditModal(false);
      await fetchData();

    } catch (err) {
      setErrorMsg('Failed to update invoice: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ===== EXPORT FUNCTIONS =====
  const exportInvoicesToCSV = () => {
    setExporting(true);
    try {
      const headers = [
        'Invoice #', 'Patient Name', 'Patient Phone',
        'Date', 'Due Date', 'Subtotal', 'Discount', 'Tax', 'Total',
        'Status', 'Payment Method', 'Reference', 'Notes'
      ];

      const rows = sortedInvoices.map(inv => [
        inv.invoice_number || 'N/A',
        inv.patient?.name || 'N/A',
        inv.patient?.phone || 'N/A',
        new Date(inv.invoice_date || inv.created_at).toLocaleDateString(),
        new Date(inv.due_date).toLocaleDateString(),
        parseFloat(inv.subtotal || 0).toFixed(2),
        parseFloat(inv.discount_amount || 0).toFixed(2),
        parseFloat(inv.tax_amount || 0).toFixed(2),
        parseFloat(inv.total || 0).toFixed(2),
        inv.status || 'pending',
        inv.payment_method || 'N/A',
        inv.reference || '',
        inv.notes || ''
      ]);

      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoices_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMsg('✅ Invoices CSV exported successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg('Failed to export CSV: ' + err.message);
      setTimeout(() => setErrorMsg(''), 3000);
    } finally {
      setExporting(false);
      setShowExportMenu(false);
    }
  };

  const exportInvoicesToExcel = () => {
    setExporting(true);
    try {
      const headers = [
        'Invoice #', 'Patient Name', 'Patient Phone',
        'Date', 'Due Date', 'Subtotal', 'Discount', 'Tax', 'Total',
        'Status', 'Payment Method', 'Reference', 'Notes'
      ];

      let html = `
                <html xmlns:o="urn:schemas-microsoft-com:office:office" 
                      xmlns:x="urn:schemas-microsoft-com:office:excel" 
                      xmlns="http://www.w3.org/TR/REC-html40">
                <head>
                    <meta charset="UTF-8">
                    <style>
                        table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; }
                        th { background-color: #4A90D9; color: white; padding: 8px; border: 1px solid #ddd; }
                        td { padding: 6px 8px; border: 1px solid #ddd; }
                        .paid { color: green; }
                        .unpaid { color: red; }
                        .pending { color: orange; }
                    </style>
                </head>
                <body>
                    <h2>🏥 Subhan Care Clinic - Invoices Report</h2>
                    <p>Generated: ${new Date().toLocaleString()}</p>
                    <p>Total Invoices: ${sortedInvoices.length}</p>
                    <p>Total Revenue: Rs. ${statsData.collectedAmount.toFixed(2)}</p>
                    <br/>
                    <table>
                        <thead>
                            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
            `;

      sortedInvoices.forEach(inv => {
        const statusClass = inv.status === 'paid' ? 'paid' :
          inv.status === 'unpaid' ? 'unpaid' : 'pending';
        html += `
                    <tr>
                        <td>${inv.invoice_number || 'N/A'}</td>
                        <td>${inv.patient?.name || 'N/A'}</td>
                        <td>${inv.patient?.phone || 'N/A'}</td>
                        <td>${new Date(inv.invoice_date || inv.created_at).toLocaleDateString()}</td>
                        <td>${new Date(inv.due_date).toLocaleDateString()}</td>
                        <td>${parseFloat(inv.subtotal || 0).toFixed(2)}</td>
                        <td>${parseFloat(inv.discount_amount || 0).toFixed(2)}</td>
                        <td>${parseFloat(inv.tax_amount || 0).toFixed(2)}</td>
                        <td><strong>${parseFloat(inv.total || 0).toFixed(2)}</strong></td>
                        <td class="${statusClass}">${inv.status || 'pending'}</td>
                        <td>${inv.payment_method || 'N/A'}</td>
                        <td>${inv.reference || ''}</td>
                        <td>${inv.notes || ''}</td>
                    </tr>
                `;
      });

      html += `
                        </tbody>
                    </table>
                    <br/>
                    <p style="color: #666; font-size: 11px;">This is a system-generated report from Subhan Care Clinic HMS.</p>
                </body>
                </html>
            `;

      const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoices_${new Date().toISOString().split('T')[0]}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMsg('✅ Invoices Excel exported successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg('Failed to export Excel: ' + err.message);
      setTimeout(() => setErrorMsg(''), 3000);
    } finally {
      setExporting(false);
      setShowExportMenu(false);
    }
  };

  const exportInvoicesToJSON = () => {
    setExporting(true);
    try {
      const data = sortedInvoices.map(inv => ({
        invoice_number: inv.invoice_number,
        patient: {
          name: inv.patient?.name || 'N/A',
          phone: inv.patient?.phone || 'N/A',
          email: inv.patient?.email || 'N/A'
        },
        date: inv.invoice_date || inv.created_at,
        due_date: inv.due_date,
        financials: {
          subtotal: parseFloat(inv.subtotal || 0),
          discount: parseFloat(inv.discount_amount || 0),
          tax: parseFloat(inv.tax_amount || 0),
          total: parseFloat(inv.total || 0)
        },
        status: inv.status,
        payment_method: inv.payment_method || 'N/A',
        items: inv.items || [],
        reference: inv.reference || '',
        notes: inv.notes || ''
      }));

      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoices_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMsg('✅ Invoices JSON exported successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg('Failed to export JSON: ' + err.message);
      setTimeout(() => setErrorMsg(''), 3000);
    } finally {
      setExporting(false);
      setShowExportMenu(false);
    }
  };

  const printInvoicesReport = () => {
    window.print();
    setShowExportMenu(false);
  };

  // ===== SUPPLIER PAYMENT EXPORT FUNCTIONS =====
  const exportSupplierPaymentsToCSV = () => {
    setExporting(true);
    try {
      const headers = [
        'Supplier', 'Amount', 'Payment Method', 'Payment Date',
        'Status', 'Reference', 'Notes'
      ];

      const rows = sortedSupplierPayments.map(p => [
        p.suppliers?.name || 'N/A',
        parseFloat(p.amount || 0).toFixed(2),
        p.payment_method || 'N/A',
        new Date(p.payment_date).toLocaleDateString(),
        p.status || 'pending',
        p.reference || '',
        p.notes || ''
      ]);

      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `supplier_payments_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMsg('✅ Supplier Payments CSV exported successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg('Failed to export CSV: ' + err.message);
      setTimeout(() => setErrorMsg(''), 3000);
    } finally {
      setExporting(false);
      setShowExportMenu(false);
    }
  };

  const exportSupplierPaymentsToExcel = () => {
    setExporting(true);
    try {
      const headers = [
        'Supplier', 'Amount', 'Payment Method', 'Payment Date',
        'Status', 'Reference', 'Notes'
      ];

      let html = `
                <html xmlns:o="urn:schemas-microsoft-com:office:office" 
                      xmlns:x="urn:schemas-microsoft-com:office:excel" 
                      xmlns="http://www.w3.org/TR/REC-html40">
                <head>
                    <meta charset="UTF-8">
                    <style>
                        table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; }
                        th { background-color: #8B5CF6; color: white; padding: 8px; border: 1px solid #ddd; }
                        td { padding: 6px 8px; border: 1px solid #ddd; }
                        .paid { color: green; }
                        .pending { color: orange; }
                    </style>
                </head>
                <body>
                    <h2>🏥 Subhan Care Clinic - Supplier Payments Report</h2>
                    <p>Generated: ${new Date().toLocaleString()}</p>
                    <p>Total Payments: ${sortedSupplierPayments.length}</p>
                    <p>Total Paid: Rs. ${statsData.supplierPaidAmount.toFixed(2)}</p>
                    <br/>
                    <table>
                        <thead>
                            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
            `;

      sortedSupplierPayments.forEach(p => {
        const statusClass = p.status === 'paid' ? 'paid' : 'pending';
        html += `
                    <tr>
                        <td>${p.suppliers?.name || 'N/A'}</td>
                        <td>${parseFloat(p.amount || 0).toFixed(2)}</td>
                        <td>${p.payment_method || 'N/A'}</td>
                        <td>${new Date(p.payment_date).toLocaleDateString()}</td>
                        <td class="${statusClass}">${p.status || 'pending'}</td>
                        <td>${p.reference || ''}</td>
                        <td>${p.notes || ''}</td>
                    </tr>
                `;
      });

      html += `
                        </tbody>
                    </table>
                    <br/>
                    <p style="color: #666; font-size: 11px;">This is a system-generated report from Subhan Care Clinic HMS.</p>
                </body>
                </html>
            `;

      const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `supplier_payments_${new Date().toISOString().split('T')[0]}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMsg('✅ Supplier Payments Excel exported successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg('Failed to export Excel: ' + err.message);
      setTimeout(() => setErrorMsg(''), 3000);
    } finally {
      setExporting(false);
      setShowExportMenu(false);
    }
  };

  const exportSupplierPaymentsToJSON = () => {
    setExporting(true);
    try {
      const data = sortedSupplierPayments.map(p => ({
        supplier: p.suppliers?.name || 'N/A',
        amount: parseFloat(p.amount || 0),
        payment_method: p.payment_method || 'N/A',
        payment_date: p.payment_date,
        status: p.status || 'pending',
        reference: p.reference || '',
        notes: p.notes || ''
      }));

      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `supplier_payments_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMsg('✅ Supplier Payments JSON exported successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg('Failed to export JSON: ' + err.message);
      setTimeout(() => setErrorMsg(''), 3000);
    } finally {
      setExporting(false);
      setShowExportMenu(false);
    }
  };

  const printSupplierPaymentsReport = () => {
    window.print();
    setShowExportMenu(false);
  };

  // ===== CLEAR INVOICE FILTERS =====
  const clearInvoiceFilters = () => {
    setSearchQuery('');
    setInvoiceStatusFilter('all');
    setInvoiceDateFilter('');
    setInvoiceSortBy('newest');
    setShowInvoiceFilters(false);
  };

  // ===== CLEAR PAYMENT FILTERS =====
  const clearPaymentFilters = () => {
    setSearchQuery('');
    setPaymentStatusFilter('all');
    setPaymentDateFilter('');
    setSupplierFilter('');
    setMethodFilter('');
    setPaymentSortBy('newest');
    setShowPaymentFilters(false);
  };

  // ===== STATS CARDS =====
  const stats = [
    {
      icon: FileText,
      value: statsData.totalInvoices,
      label: 'Total Invoices',
      trend: `${statsData.unpaidInvoices} pending`,
      up: statsData.totalInvoices > 0,
      color: '#3B82F6'
    },
    {
      icon: CreditCard,
      value: statsData.paymentsCollected,
      label: 'Payments Collected',
      trend: `${statsData.paidInvoices} paid`,
      up: true,
      color: '#22C55E'
    },
    {
      icon: Banknote,
      value: `Rs. ${statsData.collectedAmount.toLocaleString()}`,
      label: 'Collected Amount',
      trend: `Monthly: Rs. ${statsData.monthlyRevenue.toLocaleString()}`,
      up: true,
      color: '#2563EB'
    },
    {
      icon: TrendingUp,
      value: `Rs. ${statsData.pendingAmount.toLocaleString()}`,
      label: 'Pending Amount',
      trend: `${statsData.unpaidInvoices} invoices pending`,
      up: false,
      color: '#F59E0B'
    }
  ];

  // ===== SUPPLIER PAYMENT STATS =====
  const supplierStats = [
    {
      icon: Truck,
      value: statsData.totalSuppliers,
      label: 'Total Suppliers',
      color: '#8B5CF6'
    },
    {
      icon: Wallet,
      value: statsData.totalSupplierPayments,
      label: 'Total Payments',
      color: '#3B82F6'
    },
    {
      icon: Check,
      value: statsData.totalSupplierPaid,
      label: 'Paid',
      color: '#22C55E'
    },
    {
      icon: Clock,
      value: statsData.totalSupplierPending,
      label: 'Pending',
      color: '#F59E0B'
    },
    {
      icon: Banknote,
      value: `Rs. ${statsData.supplierPaidAmount.toLocaleString()}`,
      label: 'Paid Amount',
      color: '#10B981'
    },
    {
      icon: AlertCircle,
      value: `Rs. ${statsData.supplierPendingAmount.toLocaleString()}`,
      label: 'Pending Amount',
      color: '#EF4444'
    }
  ];

  if (loading || isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px', background: 'var(--bg-primary)' }}>
        <Loader size={40} className="spinner" />
        <p>Loading billing data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar active="billing" onNavigate={handleNavigate} user={user} onSignOut={handleSignOut} theme={theme} toggleTheme={toggleTheme} />
      <SidebarOverlay show={sidebarOpen} onClick={() => setSidebarOpen(false)} />

      <div className="main-content">
        <header className="dashboard-header">
          <div className="header-left">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu size={22} /></button>
            <h1>Billing Dashboard</h1>
            <form onSubmit={handleSearch} className="header-search-form">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search invoices, suppliers..."
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
              onClick={fetchData}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>

            <div className="profile-dropdown" ref={dropdownRef}>
              <div className="profile-trigger" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
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
                  <div className="dropdown-item" onClick={() => { setIsDropdownOpen(false); navigate('/profile'); }}>
                    <User size={18} />
                    <span>My Profile</span>
                  </div>
                  <div className="dropdown-item" onClick={() => { setIsDropdownOpen(false); navigate('/settings'); }}>
                    <Settings size={18} />
                    <span>Settings</span>
                  </div>
                  <div className="dropdown-item" onClick={toggleTheme}>
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
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
          {/* Welcome Section */}
          <div className="welcome-section">
            <div className="welcome-text">
              <h2>Welcome back, {userName}! 💰</h2>
              <p>You're signed in as <strong>{userRole}</strong>. Here's what's happening today.</p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>📄 Invoices: {statsData.totalInvoices}</span>
                <span>💰 Collected: Rs. {statsData.collectedAmount.toLocaleString()}</span>
                <span>⏳ Pending: Rs. {statsData.pendingAmount.toLocaleString()}</span>
                <span>📦 Supplier Payments: Rs. {statsData.supplierPaidAmount.toLocaleString()}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/billing')}
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
                  fontFamily: 'var(--font-family)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--primary-hover)';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'var(--primary-color)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <Plus size={18} /> New Invoice
              </button>
              <button
                onClick={openSupplierPaymentModal}
                style={{
                  padding: '10px 20px',
                  background: '#8B5CF6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'var(--font-family)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#7C3AED';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#8B5CF6';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <Truck size={18} /> Supplier Payment
              </button>
            </div>
          </div>

          {/* ===== TABS ===== */}
          <div style={{
            display: 'flex',
            gap: '4px',
            marginBottom: '20px',
            borderBottom: '2px solid var(--border-color)',
            paddingBottom: '8px',
            overflowX: 'auto'
          }}>
            <button
              onClick={() => setActiveTab('invoices')}
              style={{
                padding: '8px 20px',
                border: 'none',
                borderRadius: '8px',
                background: activeTab === 'invoices' ? 'var(--primary-color)' : 'transparent',
                color: activeTab === 'invoices' ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: activeTab === 'invoices' ? 600 : 400,
                fontFamily: 'var(--font-family)',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <FileText size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Invoices
              <span style={{
                marginLeft: '6px',
                fontSize: '0.6rem',
                background: 'var(--primary-color)15',
                color: 'var(--primary-color)',
                padding: '1px 8px',
                borderRadius: '12px',
                fontWeight: 600
              }}>
                {invoices.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('supplier-payments')}
              style={{
                padding: '8px 20px',
                border: 'none',
                borderRadius: '8px',
                background: activeTab === 'supplier-payments' ? '#8B5CF6' : 'transparent',
                color: activeTab === 'supplier-payments' ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: activeTab === 'supplier-payments' ? 600 : 400,
                fontFamily: 'var(--font-family)',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Truck size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Supplier Payments
              <span style={{
                marginLeft: '6px',
                fontSize: '0.6rem',
                background: '#8B5CF615',
                color: '#8B5CF6',
                padding: '1px 8px',
                borderRadius: '12px',
                fontWeight: 600
              }}>
                {supplierPayments.length}
              </span>
            </button>
          </div>

          {/* ============================================================ */}
          {/* ===== INVOICES TAB ===== */}
          {/* ============================================================ */}
          {activeTab === 'invoices' && (
            <>
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

              {/* Extra Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div style={{
                  padding: '12px 16px',
                  background: 'var(--card-bg)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Today</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Rs. {statsData.todayRevenue.toLocaleString()}
                  </div>
                </div>
                <div style={{
                  padding: '12px 16px',
                  background: 'var(--card-bg)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>This Week</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Rs. {statsData.weeklyRevenue.toLocaleString()}
                  </div>
                </div>
                <div style={{
                  padding: '12px 16px',
                  background: 'var(--card-bg)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>This Month</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Rs. {statsData.monthlyRevenue.toLocaleString()}
                  </div>
                </div>
                <div style={{
                  padding: '12px 16px',
                  background: 'var(--card-bg)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Avg Invoice</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Rs. {statsData.averageAmount.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Invoice Controls */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                padding: '12px 16px',
                background: 'var(--card-bg)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: '16px'
              }}>
                <div style={{ flex: 1, minWidth: '160px', position: 'relative' }}>
                  <Search size={16} style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }} />
                  <input
                    type="text"
                    placeholder="Search invoices..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      height: '36px',
                      padding: '6px 12px 6px 34px',
                      border: '1.5px solid var(--border-color)',
                      borderRadius: '10px',
                      fontSize: '0.8rem',
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
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setShowInvoiceFilters(!showInvoiceFilters)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 12px',
                      height: '36px',
                      border: '1.5px solid var(--border-color)',
                      borderRadius: '10px',
                      background: 'var(--bg-primary)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
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
                    <Filter size={14} style={{ color: 'var(--primary-color)' }} /> Filters
                    {(invoiceStatusFilter !== 'all' || invoiceDateFilter || searchQuery) && (
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
                        1
                      </span>
                    )}
                  </button>

                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      disabled={exporting}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '5px 12px',
                        height: '36px',
                        border: '1.5px solid var(--border-color)',
                        borderRadius: '10px',
                        background: 'var(--bg-primary)',
                        cursor: exporting ? 'not-allowed' : 'pointer',
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-family)',
                        color: 'var(--text-secondary)',
                        opacity: exporting ? 0.6 : 1,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!exporting) {
                          e.target.style.background = 'var(--hover-bg)';
                          e.target.style.borderColor = 'var(--primary-color)';
                          e.target.style.color = 'var(--text-primary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!exporting) {
                          e.target.style.background = 'var(--bg-primary)';
                          e.target.style.borderColor = 'var(--border-color)';
                          e.target.style.color = 'var(--text-secondary)';
                        }
                      }}
                    >
                      <Download size={14} /> Export
                      <ChevronDown size={12} />
                    </button>

                    {showExportMenu && !exporting && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '4px',
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        boxShadow: 'var(--shadow-lg)',
                        minWidth: '180px',
                        zIndex: 100,
                        padding: '4px 0',
                        animation: 'slideDown 0.2s ease'
                      }}>
                        <button onClick={exportInvoicesToCSV} style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '8px 14px', width: '100%', border: 'none',
                          background: 'transparent', cursor: 'pointer',
                          fontSize: '0.8rem', fontFamily: 'var(--font-family)',
                          color: 'var(--text-primary)',
                          transition: 'all 0.15s ease'
                        }}
                          onMouseEnter={(e) => e.target.style.background = 'var(--hover-bg)'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                          <FileText size={16} style={{ color: '#3B82F6' }} />
                          <span>CSV</span>
                        </button>
                        <button onClick={exportInvoicesToExcel} style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '8px 14px', width: '100%', border: 'none',
                          background: 'transparent', cursor: 'pointer',
                          fontSize: '0.8rem', fontFamily: 'var(--font-family)',
                          color: 'var(--text-primary)',
                          transition: 'all 0.15s ease'
                        }}
                          onMouseEnter={(e) => e.target.style.background = 'var(--hover-bg)'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                          <FileSpreadsheet size={16} style={{ color: '#22C55E' }} />
                          <span>Excel</span>
                        </button>
                        <button onClick={exportInvoicesToJSON} style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '8px 14px', width: '100%', border: 'none',
                          background: 'transparent', cursor: 'pointer',
                          fontSize: '0.8rem', fontFamily: 'var(--font-family)',
                          color: 'var(--text-primary)',
                          transition: 'all 0.15s ease'
                        }}
                          onMouseEnter={(e) => e.target.style.background = 'var(--hover-bg)'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                          <FileJson size={16} style={{ color: '#8B5CF6' }} />
                          <span>JSON</span>
                        </button>
                        <div style={{ borderTop: '1px solid var(--border-color)', margin: '4px 8px' }} />
                        <button onClick={printInvoicesReport} style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '8px 14px', width: '100%', border: 'none',
                          background: 'transparent', cursor: 'pointer',
                          fontSize: '0.8rem', fontFamily: 'var(--font-family)',
                          color: 'var(--text-primary)',
                          transition: 'all 0.15s ease'
                        }}
                          onMouseEnter={(e) => e.target.style.background = 'var(--hover-bg)'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                          <Printer size={16} style={{ color: '#F59E0B' }} />
                          <span>Print</span>
                        </button>
                        <button onClick={() => setShowExportMenu(false)} style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '8px 14px', width: '100%', border: 'none',
                          background: 'transparent', cursor: 'pointer',
                          fontSize: '0.8rem', fontFamily: 'var(--font-family)',
                          color: 'var(--text-secondary)',
                          borderTop: '1px solid var(--border-color)',
                          marginTop: '4px', paddingTop: '8px',
                          transition: 'all 0.15s ease'
                        }}
                          onMouseEnter={(e) => { e.target.style.background = 'var(--hover-bg)'; e.target.style.color = 'var(--text-primary)'; }}
                          onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--text-secondary)'; }}>
                          <X size={16} />
                          <span>Close</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => navigate('/billing')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 14px',
                      height: '36px',
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
                    <Plus size={14} /> New Invoice
                  </button>
                </div>
              </div>

              {/* Invoice Filters */}
              {showInvoiceFilters && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  padding: '12px 16px',
                  background: 'var(--bg-primary)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  marginBottom: '16px',
                  alignItems: 'center'
                }}>
                  <select
                    value={invoiceStatusFilter}
                    onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                    style={{
                      height: '34px',
                      padding: '0 12px',
                      border: '1.5px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-family)',
                      background: 'var(--card-bg)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      cursor: 'pointer',
                      minWidth: '120px'
                    }}
                  >
                    <option value="all">All Status</option>
                    <option value="paid">✅ Paid</option>
                    <option value="unpaid">❌ Unpaid</option>
                    <option value="pending">⏳ Pending</option>
                    <option value="partial">🔶 Partial</option>
                    <option value="cancelled">⛔ Cancelled</option>
                    <option value="refunded">🔄 Refunded</option>
                  </select>

                  <input
                    type="date"
                    value={invoiceDateFilter}
                    onChange={(e) => setInvoiceDateFilter(e.target.value)}
                    style={{
                      height: '34px',
                      padding: '0 12px',
                      border: '1.5px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-family)',
                      background: 'var(--card-bg)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      minWidth: '140px'
                    }}
                  />

                  <select
                    value={invoiceSortBy}
                    onChange={(e) => setInvoiceSortBy(e.target.value)}
                    style={{
                      height: '34px',
                      padding: '0 12px',
                      border: '1.5px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-family)',
                      background: 'var(--card-bg)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      cursor: 'pointer',
                      minWidth: '110px'
                    }}
                  >
                    <option value="newest">📅 Newest</option>
                    <option value="oldest">📅 Oldest</option>
                    <option value="amount">💰 By Amount</option>
                    <option value="patient">👤 By Patient</option>
                  </select>

                  <button
                    onClick={clearInvoiceFilters}
                    style={{
                      padding: '4px 12px',
                      height: '34px',
                      border: '1.5px solid var(--border-color)',
                      borderRadius: '8px',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
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
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {sortedInvoices.length} invoice{sortedInvoices.length !== 1 ? 's' : ''} found
                  </span>
                </div>
              )}

              {/* Invoices Table */}
              <div style={{
                borderRadius: '12px',
                overflow: 'hidden',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.8rem',
                    minWidth: '750px'
                  }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Invoice #
                        </th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Patient
                        </th>
                        <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Date
                        </th>
                        <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Amount
                        </th>
                        <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Status
                        </th>
                        <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedInvoices.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📄</div>
                            No invoices found
                          </td>
                        </tr>
                      ) : (
                        sortedInvoices.slice(0, 10).map(inv => {
                          const status = getStatusBadge(inv.status);
                          return (
                            <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {inv.invoice_number}
                              </td>
                              <td style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>
                                {inv.patient?.name || 'Unknown'}
                                {inv.patient?.phone && (
                                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{inv.patient.phone}</div>
                                )}
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                <Clock size={11} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} />
                                {new Date(inv.invoice_date || inv.created_at).toLocaleDateString()}
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                                Rs. {parseFloat(inv.total).toFixed(2)}
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                <span style={{
                                  padding: '2px 10px',
                                  borderRadius: '20px',
                                  fontSize: '0.65rem',
                                  fontWeight: 600,
                                  background: status.bg,
                                  color: status.color,
                                  border: `1px solid ${status.color}30`
                                }}>
                                  {status.label}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                  <button
                                    onClick={() => openViewModal(inv)}
                                    style={{
                                      padding: '4px 8px',
                                      border: '1px solid var(--border-color)',
                                      borderRadius: '6px',
                                      background: 'transparent',
                                      cursor: 'pointer',
                                      fontSize: '0.65rem',
                                      color: 'var(--text-secondary)',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => { e.target.style.borderColor = 'var(--primary-color)'; e.target.style.color = 'var(--primary-color)'; }}
                                    onMouseLeave={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.color = 'var(--text-secondary)'; }}
                                    title="View"
                                  >
                                    <Eye size={12} /> View
                                  </button>
                                  <button
                                    onClick={() => openEditModal(inv)}
                                    style={{
                                      padding: '4px 8px',
                                      border: '1px solid var(--border-color)',
                                      borderRadius: '6px',
                                      background: 'transparent',
                                      cursor: 'pointer',
                                      fontSize: '0.65rem',
                                      color: 'var(--text-secondary)',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => { e.target.style.borderColor = '#22C55E'; e.target.style.color = '#22C55E'; }}
                                    onMouseLeave={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.color = 'var(--text-secondary)'; }}
                                    title="Edit"
                                  >
                                    <Edit size={12} /> Edit
                                  </button>
                                  {inv.status !== 'paid' && inv.status !== 'cancelled' && inv.status !== 'refunded' && (
                                    <button
                                      onClick={() => openPaymentModal(inv)}
                                      style={{
                                        padding: '4px 8px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '6px',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        fontSize: '0.65rem',
                                        color: 'var(--text-secondary)',
                                        transition: 'all 0.2s'
                                      }}
                                      onMouseEnter={(e) => { e.target.style.borderColor = '#10B981'; e.target.style.color = '#10B981'; }}
                                      onMouseLeave={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.color = 'var(--text-secondary)'; }}
                                      title="Pay"
                                    >
                                      <CreditCard size={12} /> Pay
                                    </button>
                                  )}
                                  <button
                                    onClick={() => openDeleteModal(inv)}
                                    style={{
                                      padding: '4px 8px',
                                      border: '1px solid var(--border-color)',
                                      borderRadius: '6px',
                                      background: 'transparent',
                                      cursor: 'pointer',
                                      fontSize: '0.65rem',
                                      color: 'var(--text-secondary)',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => { e.target.style.borderColor = '#EF4444'; e.target.style.color = '#EF4444'; }}
                                    onMouseLeave={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.color = 'var(--text-secondary)'; }}
                                    title="Delete"
                                  >
                                    <Trash2 size={12} /> Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                {sortedInvoices.length > 10 && (
                  <div style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Showing 10 of {sortedInvoices.length} invoices
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ============================================================ */}
          {/* ===== SUPPLIER PAYMENTS TAB ===== */}
          {/* ============================================================ */}
          {activeTab === 'supplier-payments' && (
            <>
              <div className="stats-grid">
                {supplierStats.map((stat, index) => {
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
                    </div>
                  );
                })}
              </div>

              {/* Supplier Payment Controls */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                padding: '12px 16px',
                background: 'var(--card-bg)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: '16px'
              }}>
                <div style={{ flex: 1, minWidth: '160px', position: 'relative' }}>
                  <Search size={16} style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }} />
                  <input
                    type="text"
                    placeholder="Search suppliers, reference..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      height: '36px',
                      padding: '6px 12px 6px 34px',
                      border: '1.5px solid var(--border-color)',
                      borderRadius: '10px',
                      fontSize: '0.8rem',
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
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setShowPaymentFilters(!showPaymentFilters)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 12px',
                      height: '36px',
                      border: '1.5px solid var(--border-color)',
                      borderRadius: '10px',
                      background: 'var(--bg-primary)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
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
                    <Filter size={14} style={{ color: 'var(--primary-color)' }} /> Filters
                  </button>

                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      disabled={exporting}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '5px 12px',
                        height: '36px',
                        border: '1.5px solid var(--border-color)',
                        borderRadius: '10px',
                        background: 'var(--bg-primary)',
                        cursor: exporting ? 'not-allowed' : 'pointer',
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-family)',
                        color: 'var(--text-secondary)',
                        opacity: exporting ? 0.6 : 1,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!exporting) {
                          e.target.style.background = 'var(--hover-bg)';
                          e.target.style.borderColor = 'var(--primary-color)';
                          e.target.style.color = 'var(--text-primary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!exporting) {
                          e.target.style.background = 'var(--bg-primary)';
                          e.target.style.borderColor = 'var(--border-color)';
                          e.target.style.color = 'var(--text-secondary)';
                        }
                      }}
                    >
                      <Download size={14} /> Export
                      <ChevronDown size={12} />
                    </button>

                    {showExportMenu && !exporting && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '4px',
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        boxShadow: 'var(--shadow-lg)',
                        minWidth: '180px',
                        zIndex: 100,
                        padding: '4px 0',
                        animation: 'slideDown 0.2s ease'
                      }}>
                        <button onClick={exportSupplierPaymentsToCSV} style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '8px 14px', width: '100%', border: 'none',
                          background: 'transparent', cursor: 'pointer',
                          fontSize: '0.8rem', fontFamily: 'var(--font-family)',
                          color: 'var(--text-primary)',
                          transition: 'all 0.15s ease'
                        }}
                          onMouseEnter={(e) => e.target.style.background = 'var(--hover-bg)'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                          <FileText size={16} style={{ color: '#3B82F6' }} />
                          <span>CSV</span>
                        </button>
                        <button onClick={exportSupplierPaymentsToExcel} style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '8px 14px', width: '100%', border: 'none',
                          background: 'transparent', cursor: 'pointer',
                          fontSize: '0.8rem', fontFamily: 'var(--font-family)',
                          color: 'var(--text-primary)',
                          transition: 'all 0.15s ease'
                        }}
                          onMouseEnter={(e) => e.target.style.background = 'var(--hover-bg)'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                          <FileSpreadsheet size={16} style={{ color: '#22C55E' }} />
                          <span>Excel</span>
                        </button>
                        <button onClick={exportSupplierPaymentsToJSON} style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '8px 14px', width: '100%', border: 'none',
                          background: 'transparent', cursor: 'pointer',
                          fontSize: '0.8rem', fontFamily: 'var(--font-family)',
                          color: 'var(--text-primary)',
                          transition: 'all 0.15s ease'
                        }}
                          onMouseEnter={(e) => e.target.style.background = 'var(--hover-bg)'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                          <FileJson size={16} style={{ color: '#8B5CF6' }} />
                          <span>JSON</span>
                        </button>
                        <div style={{ borderTop: '1px solid var(--border-color)', margin: '4px 8px' }} />
                        <button onClick={printSupplierPaymentsReport} style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '8px 14px', width: '100%', border: 'none',
                          background: 'transparent', cursor: 'pointer',
                          fontSize: '0.8rem', fontFamily: 'var(--font-family)',
                          color: 'var(--text-primary)',
                          transition: 'all 0.15s ease'
                        }}
                          onMouseEnter={(e) => e.target.style.background = 'var(--hover-bg)'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                          <Printer size={16} style={{ color: '#F59E0B' }} />
                          <span>Print</span>
                        </button>
                        <button onClick={() => setShowExportMenu(false)} style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '8px 14px', width: '100%', border: 'none',
                          background: 'transparent', cursor: 'pointer',
                          fontSize: '0.8rem', fontFamily: 'var(--font-family)',
                          color: 'var(--text-secondary)',
                          borderTop: '1px solid var(--border-color)',
                          marginTop: '4px', paddingTop: '8px',
                          transition: 'all 0.15s ease'
                        }}
                          onMouseEnter={(e) => { e.target.style.background = 'var(--hover-bg)'; e.target.style.color = 'var(--text-primary)'; }}
                          onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--text-secondary)'; }}>
                          <X size={16} />
                          <span>Close</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={openSupplierPaymentModal}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 14px',
                      height: '36px',
                      border: 'none',
                      borderRadius: '10px',
                      background: '#8B5CF6',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-family)',
                      color: 'white',
                      fontWeight: 500,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#7C3AED';
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#8B5CF6';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <Plus size={14} /> New Payment
                  </button>
                </div>
              </div>

              {/* Supplier Payment Filters */}
              {showPaymentFilters && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  padding: '12px 16px',
                  background: 'var(--bg-primary)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  marginBottom: '16px',
                  alignItems: 'center'
                }}>
                  <select
                    value={paymentStatusFilter}
                    onChange={(e) => setPaymentStatusFilter(e.target.value)}
                    style={{
                      height: '34px',
                      padding: '0 12px',
                      border: '1.5px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-family)',
                      background: 'var(--card-bg)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      cursor: 'pointer',
                      minWidth: '120px'
                    }}
                  >
                    <option value="all">All Status</option>
                    <option value="paid">✅ Paid</option>
                    <option value="pending">⏳ Pending</option>
                  </select>

                  <select
                    value={supplierFilter}
                    onChange={(e) => setSupplierFilter(e.target.value)}
                    style={{
                      height: '34px',
                      padding: '0 12px',
                      border: '1.5px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-family)',
                      background: 'var(--card-bg)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      cursor: 'pointer',
                      minWidth: '140px'
                    }}
                  >
                    <option value="">All Suppliers</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>

                  <select
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value)}
                    style={{
                      height: '34px',
                      padding: '0 12px',
                      border: '1.5px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-family)',
                      background: 'var(--card-bg)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      cursor: 'pointer',
                      minWidth: '120px'
                    }}
                  >
                    <option value="">All Methods</option>
                    <option value="cash">💵 Cash</option>
                    <option value="card">💳 Card</option>
                    <option value="bank_transfer">🏦 Bank Transfer</option>
                    <option value="online">🌐 Online Payment</option>
                  </select>

                  <input
                    type="date"
                    value={paymentDateFilter}
                    onChange={(e) => setPaymentDateFilter(e.target.value)}
                    style={{
                      height: '34px',
                      padding: '0 12px',
                      border: '1.5px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-family)',
                      background: 'var(--card-bg)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      minWidth: '140px'
                    }}
                  />

                  <select
                    value={paymentSortBy}
                    onChange={(e) => setPaymentSortBy(e.target.value)}
                    style={{
                      height: '34px',
                      padding: '0 12px',
                      border: '1.5px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-family)',
                      background: 'var(--card-bg)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      cursor: 'pointer',
                      minWidth: '110px'
                    }}
                  >
                    <option value="newest">📅 Newest</option>
                    <option value="oldest">📅 Oldest</option>
                    <option value="amount">💰 By Amount</option>
                    <option value="supplier">👤 By Supplier</option>
                  </select>

                  <button
                    onClick={clearPaymentFilters}
                    style={{
                      padding: '4px 12px',
                      height: '34px',
                      border: '1.5px solid var(--border-color)',
                      borderRadius: '8px',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
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
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {sortedSupplierPayments.length} payment{sortedSupplierPayments.length !== 1 ? 's' : ''} found
                  </span>
                </div>
              )}

              {/* Supplier Payments Table */}
              <div style={{
                borderRadius: '12px',
                overflow: 'hidden',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
                marginTop: '20px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)'
                }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Truck size={18} style={{ color: '#8B5CF6' }} />
                    Supplier Payment History
                    <span style={{
                      fontSize: '0.65rem',
                      background: '#8B5CF615',
                      color: '#8B5CF6',
                      padding: '1px 10px',
                      borderRadius: '12px'
                    }}>
                      {sortedSupplierPayments.length}
                    </span>
                  </h3>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  {sortedSupplierPayments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📦</div>
                      No supplier payments found
                      {showPaymentFilters && <p>Try clearing your filters</p>}
                    </div>
                  ) : (
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '0.8rem',
                      minWidth: '750px'
                    }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                            Supplier
                          </th>
                          <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                            Amount
                          </th>
                          <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                            Method
                          </th>
                          <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                            Date
                          </th>
                          <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                            Status
                          </th>
                          <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                            Reference
                          </th>
                          <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedSupplierPayments.map((payment) => {
                          const status = getSupplierPaymentStatusBadge(payment.status);
                          return (
                            <tr key={payment.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {payment.suppliers?.name || 'Unknown Supplier'}
                                {payment.suppliers?.phone && (
                                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{payment.suppliers.phone}</div>
                                )}
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#10B981' }}>
                                Rs. {parseFloat(payment.amount).toFixed(2)}
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'center', textTransform: 'capitalize' }}>
                                {payment.payment_method || 'N/A'}
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {new Date(payment.payment_date).toLocaleDateString()}
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                <span style={{
                                  padding: '2px 10px',
                                  borderRadius: '20px',
                                  fontSize: '0.65rem',
                                  fontWeight: 600,
                                  background: status.bg,
                                  color: status.color,
                                  border: `1px solid ${status.color}30`
                                }}>
                                  {status.icon} {status.label}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {payment.reference || '—'}
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                  <button
                                    onClick={() => openSupplierPaymentViewModal(payment)}
                                    style={{
                                      padding: '4px 8px',
                                      border: '1px solid var(--border-color)',
                                      borderRadius: '6px',
                                      background: 'transparent',
                                      cursor: 'pointer',
                                      fontSize: '0.65rem',
                                      color: 'var(--text-secondary)',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.borderColor = 'var(--primary-color)';
                                      e.target.style.color = 'var(--primary-color)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.borderColor = 'var(--border-color)';
                                      e.target.style.color = 'var(--text-secondary)';
                                    }}
                                    title="View Payment"
                                  >
                                    <Eye size={14} />
                                  </button>
                                  <button
                                    onClick={() => openSupplierPaymentEditModal(payment)}
                                    style={{
                                      padding: '4px 8px',
                                      border: '1px solid var(--border-color)',
                                      borderRadius: '6px',
                                      background: 'transparent',
                                      cursor: 'pointer',
                                      fontSize: '0.65rem',
                                      color: 'var(--text-secondary)',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.borderColor = '#22C55E';
                                      e.target.style.color = '#22C55E';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.borderColor = 'var(--border-color)';
                                      e.target.style.color = 'var(--text-secondary)';
                                    }}
                                    title="Edit Payment"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  {/* ===== SUPPLIER PAY BUTTON ===== */}
                                  <button
                                    onClick={() => openSupplierPayModal(payment)}
                                    style={{
                                      padding: '4px 8px',
                                      border: 'none',
                                      borderRadius: '6px',
                                      background: '#10B981',
                                      cursor: 'pointer',
                                      fontSize: '0.65rem',
                                      color: 'white',
                                      fontWeight: 500,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.background = '#059669';
                                      e.target.style.transform = 'scale(1.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.background = '#10B981';
                                      e.target.style.transform = 'scale(1)';
                                    }}
                                    title="Pay Now"
                                  >
                                    <CreditCard size={12} /> Pay
                                  </button>
                                  <button
                                    onClick={() => openSupplierPaymentDeleteModal(payment)}
                                    style={{
                                      padding: '4px 8px',
                                      border: '1px solid var(--border-color)',
                                      borderRadius: '6px',
                                      background: 'transparent',
                                      cursor: 'pointer',
                                      fontSize: '0.65rem',
                                      color: 'var(--text-secondary)',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.borderColor = '#EF4444';
                                      e.target.style.color = '#EF4444';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.borderColor = 'var(--border-color)';
                                      e.target.style.color = 'var(--text-secondary)';
                                    }}
                                    title="Delete Payment"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                  <button
                                    onClick={() => openSupplierReceiptModal(payment)}
                                    style={{
                                      padding: '4px 8px',
                                      border: '1px solid var(--border-color)',
                                      borderRadius: '6px',
                                      background: 'transparent',
                                      cursor: 'pointer',
                                      fontSize: '0.65rem',
                                      color: 'var(--text-secondary)',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.borderColor = '#F59E0B';
                                      e.target.style.color = '#F59E0B';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.borderColor = 'var(--border-color)';
                                      e.target.style.color = 'var(--text-secondary)';
                                    }}
                                    title="View Receipt"
                                  >
                                    <Receipt size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {sortedSupplierPayments.length > 10 && (
                  <div style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Showing 10 of {sortedSupplierPayments.length} payments
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* ===== SUPPLIER PAY MODAL (like invoice pay) ===== */}
      {/* ============================================================ */}
      {showSupplierPayModal && selectedSupplierPayment && (
        <div className="modal-backdrop" onClick={() => setShowSupplierPayModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
            maxWidth: '450px',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'var(--card-bg)',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            margin: '16px',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={20} style={{ color: '#10B981' }} />
                Process Payment
              </h3>
              <button onClick={() => setShowSupplierPayModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            {errorMsg && <div style={{ padding: '10px', background: '#EF444415', border: '1px solid #EF444430', borderRadius: '8px', color: '#EF4444', marginBottom: '12px' }}>{errorMsg}</div>}
            {successMsg && <div style={{ padding: '10px', background: '#22C55E15', border: '1px solid #22C55E30', borderRadius: '8px', color: '#16A34A', marginBottom: '12px' }}>{successMsg}</div>}

            <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supplier</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedSupplierPayment.suppliers?.name || 'Unknown'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Amount Due</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Rs. {parseFloat(selectedSupplierPayment.amount).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reference</span>
                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{selectedSupplierPayment.reference || 'N/A'}</span>
              </div>
            </div>

            <form onSubmit={handleSupplierPaySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  <DollarSign size={14} style={{ display: 'inline', marginRight: '4px', color: '#10B981' }} />
                  Payment Amount *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={supplierPayForm.amount}
                  onChange={(e) => setSupplierPayForm(prev => ({ ...prev, amount: e.target.value }))}
                  min="0.01"
                  max={parseFloat(selectedSupplierPayment.amount)}
                  step="0.01"
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 14px',
                    fontSize: '1rem',
                    border: '2px solid var(--border-color)',
                    borderRadius: '10px',
                    background: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <span>Max: Rs. {parseFloat(selectedSupplierPayment.amount).toFixed(2)}</span>
                  <span>Remaining: Rs. {(parseFloat(selectedSupplierPayment.amount) - parseFloat(supplierPayForm.amount || 0)).toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  <Wallet size={14} style={{ display: 'inline', marginRight: '4px', color: '#8B5CF6' }} />
                  Payment Method *
                </label>
                <select
                  value={supplierPayForm.payment_method}
                  onChange={(e) => setSupplierPayForm(prev => ({ ...prev, payment_method: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 14px',
                    fontSize: '0.9rem',
                    border: '2px solid var(--border-color)',
                    borderRadius: '10px',
                    background: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                >
                  <option value="cash">💵 Cash</option>
                  <option value="card">💳 Card</option>
                  <option value="bank_transfer">🏦 Bank Transfer</option>
                  <option value="online">🌐 Online Payment</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  <MessageSquare size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} />
                  Payment Notes (Optional)
                </label>
                <textarea
                  value={supplierPayForm.notes}  // ← FIXED: payment_notes se notes
                  onChange={(e) => setSupplierPayForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any notes about this payment..."
                  style={{
                    width: '100%',
                    minHeight: '50px',
                    padding: '10px 14px',
                    fontSize: '0.85rem',
                    border: '2px solid var(--border-color)',
                    borderRadius: '10px',
                    background: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    resize: 'vertical',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '8px',
                padding: '12px',
                background: 'var(--bg-primary)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Total</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Rs. {parseFloat(selectedSupplierPayment.amount).toFixed(2)}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Paid</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#10B981' }}>
                    Rs. {parseFloat(supplierPayForm.amount || 0).toFixed(2)}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Remaining</div>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: parseFloat(selectedSupplierPayment.amount) - parseFloat(supplierPayForm.amount || 0) > 0 ? '#EF4444' : '#10B981'
                  }}>
                    Rs. {(parseFloat(selectedSupplierPayment.amount) - parseFloat(supplierPayForm.amount || 0)).toFixed(2)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowSupplierPayModal(false)}
                  style={{ padding: '8px 18px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.target.style.background = 'var(--hover-bg)'; e.target.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--text-secondary)'; }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSupplierPaySubmit}
                  disabled={actionLoading || !supplierPayForm.amount || parseFloat(supplierPayForm.amount) <= 0}
                  style={{
                    padding: '8px 18px',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#10B981',
                    color: 'white',
                    cursor: actionLoading || !supplierPayForm.amount || parseFloat(supplierPayForm.amount) <= 0 ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    opacity: actionLoading || !supplierPayForm.amount || parseFloat(supplierPayForm.amount) <= 0 ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  <CreditCard size={16} style={{ display: 'inline', marginRight: '4px' }} />
                  {actionLoading ? 'Processing...' : 'Process Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ===== SUPPLIER PAYMENT RECEIPT MODAL ===== */}
      {/* ============================================================ */}
      {showSupplierReceiptModal && (selectedSupplierPayment || lastProcessedPayment) && (
        <div className="modal-backdrop" onClick={() => setShowSupplierReceiptModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
            maxWidth: '450px',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'var(--card-bg)',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            margin: '16px',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ textAlign: 'center', paddingBottom: '16px', borderBottom: '2px dashed var(--border-color)', marginBottom: '16px' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary-color)' }}>🏥 Subhan Care Clinic</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sector G-8, Islamabad | Ph: +92-51-1234567</div>
              <div style={{ marginTop: '8px', padding: '4px 14px', background: '#10B98115', color: '#10B981', borderRadius: '20px', display: 'inline-block', fontSize: '0.75rem', fontWeight: 600 }}>
                ✅ Payment Successful
              </div>
            </div>

            {(() => {
              const payment = selectedSupplierPayment || lastProcessedPayment;
              return (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem', marginBottom: '16px', padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', display: 'block' }}>Supplier</span>
                      <strong>{payment.suppliers?.name || 'Unknown Supplier'}</strong>
                      {payment.suppliers?.phone && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{payment.suppliers.phone}</div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', display: 'block' }}>Receipt #</span>
                      <strong>SP-{String(payment.id || Date.now()).slice(0, 8).toUpperCase()}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', display: 'block' }}>Payment Date</span>
                      <strong>{new Date(payment.payment_date || Date.now()).toLocaleDateString()}</strong>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', display: 'block' }}>Method</span>
                      <strong style={{ textTransform: 'capitalize' }}>{payment.payment_method || 'N/A'}</strong>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '12px 0', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '1rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Payment Amount</span>
                      <span style={{ fontWeight: 700, color: '#10B981', fontSize: '1.2rem' }}>
                        Rs. {parseFloat(payment.amount).toFixed(2)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                      <span style={{
                        fontWeight: 600,
                        color: payment.status === 'paid' ? '#22C55E' : '#F59E0B'
                      }}>
                        {payment.status === 'paid' ? '✅ Paid' : '⏳ Pending'}
                      </span>
                    </div>
                    {payment.reference && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Reference</span>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{payment.reference}</span>
                      </div>
                    )}
                  </div>

                  {payment.notes && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '8px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '12px' }}>
                      <strong>📝 Notes:</strong> {payment.notes}
                    </div>
                  )}

                  <div style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-muted)', borderTop: '1px dashed var(--border-color)', paddingTop: '12px' }}>
                    Thank you for the payment! 💰
                  </div>
                </>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '12px' }}>
              <button
                onClick={() => window.print()}
                style={{ padding: '8px 18px', border: 'none', borderRadius: '8px', background: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.85rem', color: 'white', transition: 'all 0.2s' }}
                onMouseEnter={(e) => e.target.style.background = 'var(--primary-hover)'}
                onMouseLeave={(e) => e.target.style.background = 'var(--primary-color)'}
              >
                <Printer size={16} style={{ display: 'inline', marginRight: '4px' }} /> Print
              </button>
              <button
                onClick={() => {
                  setShowSupplierReceiptModal(false);
                  setLastProcessedPayment(null);
                }}
                style={{ padding: '8px 18px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.target.style.background = 'var(--hover-bg)'; e.target.style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--text-secondary)'; }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ===== SUPPLIER PAYMENT VIEW MODAL ===== */}
      {/* ============================================================ */}
      {showSupplierPaymentViewModal && selectedSupplierPayment && (
        <div className="modal-backdrop" onClick={() => setShowSupplierPaymentViewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
            maxWidth: '480px',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'var(--card-bg)',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            margin: '16px',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={20} style={{ color: '#8B5CF6' }} />
                Payment Details
              </h3>
              <button onClick={() => setShowSupplierPaymentViewModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              padding: '12px',
              background: 'var(--bg-primary)',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              marginBottom: '16px'
            }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Supplier</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedSupplierPayment.suppliers?.name || 'Unknown'}
                </div>
                {selectedSupplierPayment.suppliers?.phone && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {selectedSupplierPayment.suppliers.phone}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Amount</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#10B981' }}>
                  Rs. {parseFloat(selectedSupplierPayment.amount).toFixed(2)}
                </div>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              padding: '12px',
              background: 'var(--bg-primary)',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              marginBottom: '16px'
            }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Payment Method</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                  {selectedSupplierPayment.payment_method || 'N/A'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Payment Date</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {new Date(selectedSupplierPayment.payment_date).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              padding: '12px',
              background: 'var(--bg-primary)',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              marginBottom: '16px'
            }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Status</div>
                <div>
                  <span style={{
                    padding: '2px 12px',
                    borderRadius: '20px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    background: selectedSupplierPayment.status === 'paid' ? '#22C55E15' : '#F59E0B15',
                    color: selectedSupplierPayment.status === 'paid' ? '#22C55E' : '#F59E0B',
                    border: `1px solid ${selectedSupplierPayment.status === 'paid' ? '#22C55E' : '#F59E0B'}30`
                  }}>
                    {selectedSupplierPayment.status === 'paid' ? '✅ Paid' : '⏳ Pending'}
                  </span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Reference</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {selectedSupplierPayment.reference || '—'}
                </div>
              </div>
            </div>

            {selectedSupplierPayment.notes && (
              <div style={{
                padding: '12px',
                background: 'var(--bg-primary)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Notes</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                  {selectedSupplierPayment.notes}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <button
                onClick={() => {
                  setShowSupplierPaymentViewModal(false);
                  openSupplierPaymentEditModal(selectedSupplierPayment);
                }}
                style={{ padding: '6px 16px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.target.style.borderColor = '#22C55E'; e.target.style.color = '#22C55E'; }}
                onMouseLeave={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.color = 'var(--text-secondary)'; }}
              >
                <Edit size={14} style={{ display: 'inline', marginRight: '4px' }} /> Edit
              </button>
              <button
                onClick={() => setShowSupplierPaymentViewModal(false)}
                style={{ padding: '6px 16px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ===== SUPPLIER PAYMENT EDIT MODAL ===== */}
      {/* ============================================================ */}
      {showSupplierPaymentEditModal && selectedSupplierPayment && (
        <div className="modal-backdrop" onClick={() => setShowSupplierPaymentEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
            maxWidth: '480px',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'var(--card-bg)',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            margin: '16px',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit size={20} style={{ color: '#22C55E' }} />
                Edit Payment
              </h3>
              <button onClick={() => setShowSupplierPaymentEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            {errorMsg && <div style={{ padding: '10px', background: '#EF444415', border: '1px solid #EF444430', borderRadius: '8px', color: '#EF4444', marginBottom: '12px' }}>{errorMsg}</div>}
            {successMsg && <div style={{ padding: '10px', background: '#22C55E15', border: '1px solid #22C55E30', borderRadius: '8px', color: '#16A34A', marginBottom: '12px' }}>{successMsg}</div>}

            <form onSubmit={handleSupplierPaymentUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  <Building size={14} style={{ display: 'inline', marginRight: '4px', color: '#8B5CF6' }} />
                  Supplier *
                </label>
                <select
                  value={supplierPaymentForm.supplier_id}
                  onChange={(e) => setSupplierPaymentForm(prev => ({ ...prev, supplier_id: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 14px',
                    fontSize: '0.9rem',
                    border: '2px solid var(--border-color)',
                    borderRadius: '10px',
                    background: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                >
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  <DollarSign size={14} style={{ display: 'inline', marginRight: '4px', color: '#10B981' }} />
                  Amount *
                </label>
                <input
                  type="number"
                  value={supplierPaymentForm.amount}
                  onChange={(e) => setSupplierPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                  min="0.01"
                  step="0.01"
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 14px',
                    fontSize: '1rem',
                    border: '2px solid var(--border-color)',
                    borderRadius: '10px',
                    background: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  <Calendar size={14} style={{ display: 'inline', marginRight: '4px', color: '#3B82F6' }} />
                  Payment Date
                </label>
                <input
                  type="date"
                  value={supplierPaymentForm.payment_date}
                  onChange={(e) => setSupplierPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))}
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 14px',
                    fontSize: '0.9rem',
                    border: '2px solid var(--border-color)',
                    borderRadius: '10px',
                    background: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  <Wallet size={14} style={{ display: 'inline', marginRight: '4px', color: '#8B5CF6' }} />
                  Payment Method
                </label>
                <select
                  value={supplierPaymentForm.payment_method}
                  onChange={(e) => setSupplierPaymentForm(prev => ({ ...prev, payment_method: e.target.value }))}
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 14px',
                    fontSize: '0.9rem',
                    border: '2px solid var(--border-color)',
                    borderRadius: '10px',
                    background: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                >
                  <option value="cash">💵 Cash</option>
                  <option value="card">💳 Card</option>
                  <option value="bank_transfer">🏦 Bank Transfer</option>
                  <option value="online">🌐 Online Payment</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  <Hash size={14} style={{ display: 'inline', marginRight: '4px', color: '#6B7280' }} />
                  Reference (Optional)
                </label>
                <input
                  type="text"
                  value={supplierPaymentForm.reference}
                  onChange={(e) => setSupplierPaymentForm(prev => ({ ...prev, reference: e.target.value }))}
                  placeholder="Invoice # or reference number"
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 14px',
                    fontSize: '0.9rem',
                    border: '2px solid var(--border-color)',
                    borderRadius: '10px',
                    background: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  <MessageSquare size={14} style={{ display: 'inline', marginRight: '4px', color: '#6B7280' }} />
                  Notes (Optional)
                </label>
                <textarea
                  value={supplierPaymentForm.notes}
                  onChange={(e) => setSupplierPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional notes..."
                  style={{
                    width: '100%',
                    minHeight: '50px',
                    padding: '10px 14px',
                    fontSize: '0.85rem',
                    border: '2px solid var(--border-color)',
                    borderRadius: '10px',
                    background: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    resize: 'vertical',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  <Check size={14} style={{ display: 'inline', marginRight: '4px', color: '#10B981' }} />
                  Status
                </label>
                <select
                  value={supplierPaymentForm.status}
                  onChange={(e) => setSupplierPaymentForm(prev => ({ ...prev, status: e.target.value }))}
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 14px',
                    fontSize: '0.9rem',
                    border: '2px solid var(--border-color)',
                    borderRadius: '10px',
                    background: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                >
                  <option value="paid">✅ Paid</option>
                  <option value="pending">⏳ Pending</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowSupplierPaymentEditModal(false)}
                  style={{ padding: '8px 18px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.target.style.background = 'var(--hover-bg)'; e.target.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--text-secondary)'; }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSupplierPaymentUpdate}
                  disabled={actionLoading}
                  style={{
                    padding: '8px 18px',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#8B5CF6',
                    color: 'white',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    opacity: actionLoading ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { if (!actionLoading) e.target.style.background = '#7C3AED'; }}
                  onMouseLeave={(e) => { if (!actionLoading) e.target.style.background = '#8B5CF6'; }}
                >
                  <Save size={16} style={{ display: 'inline', marginRight: '4px' }} />
                  {actionLoading ? 'Updating...' : 'Update Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ===== SUPPLIER PAYMENT DELETE MODAL ===== */}
      {/* ============================================================ */}
      {showSupplierPaymentDeleteModal && selectedSupplierPayment && (
        <div className="modal-backdrop" onClick={() => setShowSupplierPaymentDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
            maxWidth: '400px',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'var(--card-bg)',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            margin: '16px',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>Delete Payment?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Supplier: <strong>{selectedSupplierPayment.suppliers?.name || 'Unknown'}</strong><br />
              Amount: <strong>Rs. {parseFloat(selectedSupplierPayment.amount).toFixed(2)}</strong><br />
              Date: <strong>{new Date(selectedSupplierPayment.payment_date).toLocaleDateString()}</strong>
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '8px' }}>This action cannot be undone.</p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={() => setShowSupplierPaymentDeleteModal(false)}
                style={{ padding: '8px 18px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.target.style.background = 'var(--hover-bg)'; e.target.style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--text-secondary)'; }}
              >
                Cancel
              </button>
              <button
                onClick={handleSupplierPaymentDelete}
                disabled={actionLoading}
                style={{
                  padding: '8px 18px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#EF4444',
                  color: 'white',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  opacity: actionLoading ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { if (!actionLoading) e.target.style.background = '#DC2626'; }}
                onMouseLeave={(e) => { if (!actionLoading) e.target.style.background = '#EF4444'; }}
              >
                <Trash2 size={16} style={{ display: 'inline', marginRight: '4px' }} />
                {actionLoading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ===== SUPPLIER PAYMENT ADD MODAL ===== */}
      {/* ============================================================ */}
      {showSupplierPaymentModal && (
        <div className="modal-backdrop" onClick={() => setShowSupplierPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
            maxWidth: '480px',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'var(--card-bg)',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            margin: '16px',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={20} style={{ color: '#8B5CF6' }} />
                Supplier Payment
              </h3>
              <button onClick={() => setShowSupplierPaymentModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            {errorMsg && <div style={{ padding: '10px', background: '#EF444415', border: '1px solid #EF444430', borderRadius: '8px', color: '#EF4444', marginBottom: '12px' }}>{errorMsg}</div>}
            {successMsg && <div style={{ padding: '10px', background: '#22C55E15', border: '1px solid #22C55E30', borderRadius: '8px', color: '#16A34A', marginBottom: '12px' }}>{successMsg}</div>}

            <form onSubmit={handleSupplierPaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  <Building size={14} style={{ display: 'inline', marginRight: '4px', color: '#8B5CF6' }} />
                  Supplier *
                </label>
                <select
                  value={supplierPaymentForm.supplier_id}
                  onChange={(e) => setSupplierPaymentForm(prev => ({ ...prev, supplier_id: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 14px',
                    fontSize: '0.9rem',
                    border: '2px solid var(--border-color)',
                    borderRadius: '10px',
                    background: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                >
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  <DollarSign size={14} style={{ display: 'inline', marginRight: '4px', color: '#10B981' }} />
                  Amount *
                </label>
                <input
                  type="number"
                  value={supplierPaymentForm.amount}
                  onChange={(e) => setSupplierPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                  min="0.01"
                  step="0.01"
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 14px',
                    fontSize: '1rem',
                    border: '2px solid var(--border-color)',
                    borderRadius: '10px',
                    background: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  <Calendar size={14} style={{ display: 'inline', marginRight: '4px', color: '#3B82F6' }} />
                  Payment Date
                </label>
                <input
                  type="date"
                  value={supplierPaymentForm.payment_date}
                  onChange={(e) => setSupplierPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))}
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 14px',
                    fontSize: '0.9rem',
                    border: '2px solid var(--border-color)',
                    borderRadius: '10px',
                    background: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  <Wallet size={14} style={{ display: 'inline', marginRight: '4px', color: '#8B5CF6' }} />
                  Payment Method
                </label>
                <select
                  value={supplierPaymentForm.payment_method}
                  onChange={(e) => setSupplierPaymentForm(prev => ({ ...prev, payment_method: e.target.value }))}
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 14px',
                    fontSize: '0.9rem',
                    border: '2px solid var(--border-color)',
                    borderRadius: '10px',
                    background: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                >
                  <option value="cash">💵 Cash</option>
                  <option value="card">💳 Card</option>
                  <option value="bank_transfer">🏦 Bank Transfer</option>
                  <option value="online">🌐 Online Payment</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  <Hash size={14} style={{ display: 'inline', marginRight: '4px', color: '#6B7280' }} />
                  Reference (Optional)
                </label>
                <input
                  type="text"
                  value={supplierPaymentForm.reference}
                  onChange={(e) => setSupplierPaymentForm(prev => ({ ...prev, reference: e.target.value }))}
                  placeholder="Invoice # or reference number"
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 14px',
                    fontSize: '0.9rem',
                    border: '2px solid var(--border-color)',
                    borderRadius: '10px',
                    background: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  <MessageSquare size={14} style={{ display: 'inline', marginRight: '4px', color: '#6B7280' }} />
                  Notes (Optional)
                </label>
                <textarea
                  value={supplierPaymentForm.notes}
                  onChange={(e) => setSupplierPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional notes..."
                  style={{
                    width: '100%',
                    minHeight: '50px',
                    padding: '10px 14px',
                    fontSize: '0.85rem',
                    border: '2px solid var(--border-color)',
                    borderRadius: '10px',
                    background: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    resize: 'vertical',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  <Check size={14} style={{ display: 'inline', marginRight: '4px', color: '#10B981' }} />
                  Status
                </label>
                <select
                  value={supplierPaymentForm.status}
                  onChange={(e) => setSupplierPaymentForm(prev => ({ ...prev, status: e.target.value }))}
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 14px',
                    fontSize: '0.9rem',
                    border: '2px solid var(--border-color)',
                    borderRadius: '10px',
                    background: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                >
                  <option value="paid">✅ Paid</option>
                  <option value="pending">⏳ Pending</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowSupplierPaymentModal(false)}
                  style={{ padding: '8px 18px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.target.style.background = 'var(--hover-bg)'; e.target.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--text-secondary)'; }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSupplierPaymentSubmit}
                  disabled={actionLoading}
                  style={{
                    padding: '8px 18px',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#8B5CF6',
                    color: 'white',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    opacity: actionLoading ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { if (!actionLoading) e.target.style.background = '#7C3AED'; }}
                  onMouseLeave={(e) => { if (!actionLoading) e.target.style.background = '#8B5CF6'; }}
                >
                  <Save size={16} style={{ display: 'inline', marginRight: '4px' }} />
                  {actionLoading ? 'Processing...' : 'Record Payment'}
                </button>
              </div>
            </form>
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

                .modal-backdrop {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    backdrop-filter: blur(4px);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 999;
                    animation: fadeIn 0.2s ease;
                }
                .modal-content {
                    animation: slideUp 0.3s ease;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
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
                    margin-bottom: 6px;
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
                    font-size: 1.3rem;
                    font-weight: 700;
                    color: var(--text-primary);
                }
                .stat-card-label {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                }
                .stat-trend {
                    font-size: 0.65rem;
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
                    transition: all 0.2s ease;
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

                .profile-dropdown {
                    position: relative;
                }
                .profile-trigger {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 4px 12px 4px 4px;
                    border-radius: 50px;
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .profile-trigger:hover {
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
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

                .dropdown-menu {
                    position: absolute;
                    top: calc(100% + 8px);
                    right: 0;
                    min-width: 240px;
                    background: var(--card-bg);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    box-shadow: var(--shadow-xl);
                    padding: 8px 0;
                    z-index: 1000;
                    animation: slideDown 0.2s ease;
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .dropdown-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 16px;
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
                    font-size: 0.7rem;
                    color: var(--text-muted);
                }
                .dropdown-divider {
                    height: 1px;
                    background: var(--border-color);
                    margin: 6px 12px;
                }
                .dropdown-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px 16px;
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 0.85rem;
                }
                .dropdown-item:hover {
                    background: var(--hover-bg);
                    color: var(--text-primary);
                }
                .dropdown-item.danger {
                    color: var(--danger-color);
                }
                .dropdown-item.danger:hover {
                    background: #EF444415;
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
                    .profile-trigger { padding: 4px; }
                    .dropdown-menu { right: -60px; min-width: 200px; }
                }
                @media (max-width: 480px) {
                    .stats-grid { grid-template-columns: 1fr; }
                    .header-right { gap: 8px; }
                    .profile-trigger { padding: 3px; }
                    .header-avatar { width: 28px; height: 28px; font-size: 0.7rem; }
                    .dropdown-menu { right: -80px; min-width: 180px; }
                }
            `}</style>
    </div>
  );
};

export default BillingDashboard;