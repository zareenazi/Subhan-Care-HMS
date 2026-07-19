import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { dbPharmacy } from '../services/db';
import { supabase } from '../services/supabaseClient';
import {
    Plus, Search, PackageOpen, X, Edit2, Trash2,
    AlertCircle, CheckCircle, Loader, Filter,
    ChevronDown, Eye, Printer, Download,
    TrendingUp, TrendingDown, DollarSign,
    Package, ShoppingCart, Clock, RefreshCw,
    AlertTriangle, FileText, Calendar,
    User, Phone, Mail, MapPin, Building,
    Clipboard, Pill, Syringe, Scissors,
    Stethoscope, HeartPulse, Activity,
    Save, ArrowLeft, ChevronLeft, ChevronRight,
    Receipt, CreditCard, Users, UserPlus,
    FileSpreadsheet, FileJson
} from 'lucide-react';

const Pharmacy = () => {
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [showFilters, setShowFilters] = useState(false);
    const [activeTab, setActiveTab] = useState('inventory');

    // ===== PATIENTS STATE =====
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);

    // ===== DISPENSE STATE =====
    const [cartItems, setCartItems] = useState([]);
    const [selectedMedicine, setSelectedMedicine] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [invoiceGenerated, setInvoiceGenerated] = useState(false);
    const [invoiceData, setInvoiceData] = useState(null);
    const [dispenseHistory, setDispenseHistory] = useState([]);
    const [invoices, setInvoices] = useState([]);

    // ===== MODAL STATES =====
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isRestockOpen, setIsRestockOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isInvoiceViewOpen, setIsInvoiceViewOpen] = useState(false);
    const [isInvoiceEditOpen, setIsInvoiceEditOpen] = useState(false);
    const [isInvoiceDeleteOpen, setIsInvoiceDeleteOpen] = useState(false);
    const [selectedMed, setSelectedMed] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    // ===== EXPORT STATE =====
    const [exporting, setExporting] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    // ===== FORM DATA =====
    const [formData, setFormData] = useState({
        medicine_name: '',
        generic_name: '',
        category: '',
        manufacturer: '',
        supplier: '',
        batch_number: '',
        expiry_date: '',
        stock: '',
        min_stock: '',
        max_stock: '',
        reorder_level: '',
        purchase_price: '',
        selling_price: '',
        discount_percent: '',
        strength: '',
        dosage_form: '',
        unit: '',
        requires_prescription: false,
        is_controlled: false,
        side_effects: '',
        indications: '',
        contraindications: '',
        storage_conditions: '',
        notes: '',
        status: 'active'
    });

    // ===== INVOICE EDIT FORM =====
    const [invoiceEditData, setInvoiceEditData] = useState({
        patient_name: '',
        patient_phone: '',
        invoice_date: '',
        due_date: '',
        total: '',
        status: 'pending',
        payment_method: 'cash',
        notes: ''
    });

    const [restockQty, setRestockQty] = useState('');
    const [restockNote, setRestockNote] = useState('');
    const [formErrors, setFormErrors] = useState({});
    const [actionLoading, setActionLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // ===== STATISTICS =====
    const [stats, setStats] = useState({
        totalMedicines: 0,
        lowStock: 0,
        criticalStock: 0,
        outOfStock: 0,
        totalValue: 0,
        categories: 0,
        suppliers: 0
    });

    // ===== BILLING DASHBOARD STATS =====
    const [billingStats, setBillingStats] = useState({
        totalInvoices: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        unpaidAmount: 0,
        partialAmount: 0,
        balance: 0
    });

    // ===== CONSTANTS =====
    const categories = [
        'Analgesics', 'Antibiotics', 'Antivirals', 'Antifungals',
        'Antihistamines', 'Cardiovascular', 'Respiratory', 'Gastrointestinal',
        'Neurological', 'Psychiatric', 'Endocrine', 'Dermatological',
        'Ophthalmological', 'Vitamins', 'Supplements', 'Herbal',
        'Vaccines', 'Insulin', 'Steroids', 'Other'
    ];

    const dosageForms = [
        'Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops',
        'Cream', 'Ointment', 'Gel', 'Patch', 'Inhaler',
        'Spray', 'Suppository', 'Powder', 'Granules', 'Suspension'
    ];

    const units = ['mg', 'g', 'kg', 'ml', 'L', 'IU', 'Unit', 'mcg', 'mmol'];

    // ===== TOAST =====
    const [toast, setToast] = useState({
        show: false,
        message: '',
        type: 'success'
    });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    // ===== LOAD PHARMACY =====
    const loadPharmacy = async () => {
        setLoading(true);
        try {
            const data = await dbPharmacy.getPharmacy();
            setMedicines(data || []);
            calculateStats(data || []);
        } catch (err) {
            console.error('❌ Load pharmacy error:', err);
            showToast('Failed to load pharmacy data', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ===== LOAD PATIENTS =====
    const loadPatients = async () => {
        try {
            const { data, error } = await supabase
                .from('patients')
                .select('id, name, phone, email, address')
                .order('name');
            if (error) throw error;
            setPatients(data || []);
        } catch (error) {
            console.error('❌ Load patients error:', error);
        }
    };

    // ===== FIXED: LOAD INVOICES - MATCHES YOUR SCHEMA =====
    const loadInvoices = useCallback(async () => {
        try {
            console.log('🔄 Loading invoices from database...');

            const { data: invoicesData, error: invoicesError } = await supabase
                .from('invoices')
                .select('*')
                .order('created_at', { ascending: false });

            if (invoicesError) {
                console.error('❌ Invoices Error:', invoicesError);
                setInvoices([]);
                setDispenseHistory([]);
                updateBillingStats([]);
                return;
            }

            console.log('✅ Invoices loaded from DB:', invoicesData?.length || 0);

            if (!invoicesData || invoicesData.length === 0) {
                setInvoices([]);
                setDispenseHistory([]);
                updateBillingStats([]);
                return;
            }

            // Get patient names
            const patientIds = invoicesData.map(inv => inv.patient_id).filter(id => id);
            let patientsMap = {};

            if (patientIds.length > 0) {
                const { data: patientsData, error: patientsError } = await supabase
                    .from('patients')
                    .select('id, name, phone')
                    .in('id', patientIds);

                if (!patientsError && patientsData) {
                    patientsMap = patientsData.reduce((acc, p) => {
                        acc[p.id] = p;
                        return acc;
                    }, {});
                }
            }

            // Parse items from JSONB
            const mergedData = invoicesData.map(inv => ({
                ...inv,
                patients: patientsMap[inv.patient_id] || { name: inv.patient_name || 'Unknown' },
                // If items is JSONB, parse it, otherwise use empty array
                invoice_items: inv.items ? (typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items) : [],
                // Map status to payment_status for compatibility
                payment_status: inv.status,
                // Map total to total_amount for compatibility
                total_amount: inv.total
            }));

            console.log('📋 Merged invoices count:', mergedData.length);
            setInvoices(mergedData);
            setDispenseHistory(mergedData);
            updateBillingStats(mergedData);

        } catch (error) {
            console.error('❌ Error loading invoices:', error);
            setInvoices([]);
            setDispenseHistory([]);
            updateBillingStats([]);
        }
    }, []);

    // ===== UPDATE BILLING STATS - MATCHES YOUR SCHEMA =====
    const updateBillingStats = (invoiceData) => {
        const data = invoiceData || invoices;
        const totalInvoices = data.length;

        // Use 'total' column from your schema
        const totalAmount = data.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

        // Use 'status' column from your schema
        const paidAmount = data
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

        const pendingAmount = data
            .filter(inv => inv.status === 'pending')
            .reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

        const unpaidAmount = data
            .filter(inv => inv.status === 'unpaid')
            .reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

        const partialAmount = data
            .filter(inv => inv.status === 'partial')
            .reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

        const balance = totalAmount - paidAmount;

        setBillingStats({
            totalInvoices,
            totalAmount,
            paidAmount,
            pendingAmount,
            unpaidAmount,
            partialAmount,
            balance
        });
    };

    // ===== REFRESH ALL DATA =====
    const refreshAllData = async () => {
        setLoading(true);
        try {
            await loadPharmacy();
            await loadPatients();
            await loadInvoices();
            showToast('✅ All data refreshed successfully!', 'success');
        } catch (err) {
            console.error('Refresh error:', err);
            showToast('Failed to refresh data', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ===== INITIAL LOAD =====
    useEffect(() => {
        console.log('🚀 Initial load - fetching all data...');
        loadPharmacy();
        loadPatients();
        loadInvoices();
    }, [loadInvoices]);

    // ===== CALCULATE STATISTICS =====
    const calculateStats = (data) => {
        const total = data.length;
        const lowStock = data.filter(m => m.stock > 0 && m.stock <= 20).length;
        const criticalStock = data.filter(m => m.stock > 0 && m.stock <= 5).length;
        const outOfStock = data.filter(m => m.stock === 0 || !m.stock).length;
        const totalValue = data.reduce((sum, m) => sum + (parseFloat(m.selling_price || m.price || 0) * parseInt(m.stock || 0)), 0);
        const categories = new Set(data.map(m => m.category).filter(Boolean)).size;
        const suppliers = new Set(data.map(m => m.supplier).filter(Boolean)).size;

        setStats({
            totalMedicines: total,
            lowStock,
            criticalStock,
            outOfStock,
            totalValue,
            categories,
            suppliers
        });
    };

    // ===== HANDLE FORM CHANGES =====
    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, [name]: newValue }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleInvoiceEditChange = (e) => {
        const { name, value } = e.target;
        setInvoiceEditData(prev => ({ ...prev, [name]: value }));
    };

    const handleRestockChange = (e) => {
        setRestockQty(e.target.value);
    };

    // ===== VALIDATE FORM =====
    const validateForm = () => {
        const errors = {};
        if (!formData.medicine_name.trim()) {
            errors.medicine_name = 'Medicine name is required';
        }
        if (!formData.generic_name.trim()) {
            errors.generic_name = 'Generic name is required';
        }
        if (!formData.category) {
            errors.category = 'Please select a category';
        }
        if (!formData.stock || parseInt(formData.stock) < 0) {
            errors.stock = 'Please enter a valid stock level';
        }
        if (!formData.selling_price || parseFloat(formData.selling_price) < 0) {
            errors.selling_price = 'Please enter a valid selling price';
        }
        if (!formData.dosage_form) {
            errors.dosage_form = 'Please select dosage form';
        }
        if (!formData.unit) {
            errors.unit = 'Please select unit';
        }
        if (!formData.batch_number) {
            errors.batch_number = 'Batch number is required';
        }
        if (!formData.expiry_date) {
            errors.expiry_date = 'Expiry date is required';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // ===== ADD MEDICINE =====
    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setActionLoading(true);

        try {
            const medicineData = {
                ...formData,
                stock: parseInt(formData.stock),
                min_stock: formData.min_stock ? parseInt(formData.min_stock) : 0,
                max_stock: formData.max_stock ? parseInt(formData.max_stock) : 0,
                reorder_level: formData.reorder_level ? parseInt(formData.reorder_level) : 0,
                purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : 0,
                selling_price: parseFloat(formData.selling_price),
                discount_percent: formData.discount_percent ? parseFloat(formData.discount_percent) : 0,
                requires_prescription: formData.requires_prescription || false,
                is_controlled: formData.is_controlled || false,
                status: formData.status || 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            await dbPharmacy.createPharmacy(medicineData);
            showToast(`✅ ${formData.medicine_name} added successfully!`, 'success');
            setIsAddOpen(false);
            resetForm();
            loadPharmacy();
        } catch (err) {
            showToast('Failed to register medicine: ' + err.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // ===== EDIT MEDICINE =====
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setActionLoading(true);

        try {
            const medicineData = {
                ...formData,
                stock: parseInt(formData.stock),
                min_stock: formData.min_stock ? parseInt(formData.min_stock) : 0,
                max_stock: formData.max_stock ? parseInt(formData.max_stock) : 0,
                reorder_level: formData.reorder_level ? parseInt(formData.reorder_level) : 0,
                purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : 0,
                selling_price: parseFloat(formData.selling_price),
                discount_percent: formData.discount_percent ? parseFloat(formData.discount_percent) : 0,
                requires_prescription: formData.requires_prescription || false,
                is_controlled: formData.is_controlled || false,
                status: formData.status || 'active',
                updated_at: new Date().toISOString()
            };

            await dbPharmacy.updatePharmacy(selectedMed.id, medicineData);
            showToast(`✅ ${formData.medicine_name} updated successfully!`, 'success');
            setIsEditOpen(false);
            resetForm();
            loadPharmacy();
        } catch (err) {
            showToast('Failed to update medicine: ' + err.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // ===== RESTOCK MEDICINE =====
    const handleRestockSubmit = async (e) => {
        e.preventDefault();
        if (!restockQty || parseInt(restockQty) <= 0) {
            showToast('Please enter a quantity greater than zero', 'error');
            return;
        }
        setActionLoading(true);

        try {
            const newStock = (parseInt(selectedMed.stock) || 0) + parseInt(restockQty);
            await dbPharmacy.updatePharmacy(selectedMed.id, {
                stock: newStock,
                restock_history: [
                    ...(selectedMed.restock_history || []),
                    {
                        date: new Date().toISOString(),
                        quantity: parseInt(restockQty),
                        note: restockNote || 'Regular restock',
                        previous_stock: parseInt(selectedMed.stock) || 0
                    }
                ],
                updated_at: new Date().toISOString()
            });
            showToast(`✅ ${selectedMed.medicine_name} restocked successfully!`, 'success');
            setIsRestockOpen(false);
            setRestockQty('');
            setRestockNote('');
            loadPharmacy();
        } catch (err) {
            showToast('Failed to restock: ' + err.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // ===== DELETE MEDICINE =====
    const handleDeleteSubmit = async () => {
        setActionLoading(true);
        try {
            await dbPharmacy.deletePharmacy(selectedMed.id);
            showToast(`✅ ${selectedMed.medicine_name} deleted successfully!`, 'success');
            setIsDeleteOpen(false);
            loadPharmacy();
        } catch (err) {
            showToast('Failed to delete medicine: ' + err.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // ===== FIXED: EDIT INVOICE - MATCHES YOUR SCHEMA =====
    const handleInvoiceEditSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);

        try {
            const updateData = {
                patient_name: invoiceEditData.patient_name,
                patient_phone: invoiceEditData.patient_phone || '',
                invoice_date: invoiceEditData.invoice_date,
                due_date: invoiceEditData.due_date || invoiceEditData.invoice_date,
                total: parseFloat(invoiceEditData.total) || 0,
                status: invoiceEditData.status,
                payment_method: invoiceEditData.payment_method,
                notes: invoiceEditData.notes || '',
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('invoices')
                .update(updateData)
                .eq('id', selectedInvoice.id);

            if (error) throw error;

            showToast(`✅ Invoice ${selectedInvoice.invoice_number} updated successfully!`, 'success');
            setIsInvoiceEditOpen(false);
            setSelectedInvoice(null);
            await loadInvoices();
        } catch (err) {
            showToast('Failed to update invoice: ' + err.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // ===== FIXED: DELETE INVOICE =====
    const handleInvoiceDeleteSubmit = async () => {
        setActionLoading(true);
        try {
            // Delete invoice (items are in JSONB, so they get deleted with invoice)
            const { error } = await supabase
                .from('invoices')
                .delete()
                .eq('id', selectedInvoice.id);

            if (error) throw error;

            showToast(`✅ Invoice ${selectedInvoice.invoice_number} deleted successfully!`, 'success');
            setIsInvoiceDeleteOpen(false);
            setSelectedInvoice(null);
            await loadInvoices();
        } catch (err) {
            showToast('Failed to delete invoice: ' + err.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // ===== FIXED: UPDATE INVOICE STATUS - MATCHES YOUR SCHEMA =====
    const updateInvoiceStatus = async (invoiceId, newStatus) => {
        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('invoices')
                .update({
                    status: newStatus,
                    payment_date: newStatus === 'paid' ? new Date().toISOString() : null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', invoiceId);

            if (error) throw error;

            showToast(`✅ Invoice status updated to ${newStatus}!`, 'success');
            await loadInvoices();
        } catch (err) {
            showToast('Failed to update invoice status: ' + err.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // ===== RESET FORM =====
    const resetForm = () => {
        setFormData({
            medicine_name: '',
            generic_name: '',
            category: '',
            manufacturer: '',
            supplier: '',
            batch_number: '',
            expiry_date: '',
            stock: '',
            min_stock: '',
            max_stock: '',
            reorder_level: '',
            purchase_price: '',
            selling_price: '',
            discount_percent: '',
            strength: '',
            dosage_form: '',
            unit: '',
            requires_prescription: false,
            is_controlled: false,
            side_effects: '',
            indications: '',
            contraindications: '',
            storage_conditions: '',
            notes: '',
            status: 'active'
        });
        setFormErrors({});
    };

    const resetInvoiceEditForm = () => {
        setInvoiceEditData({
            patient_name: '',
            patient_phone: '',
            invoice_date: '',
            due_date: '',
            total: '',
            status: 'pending',
            payment_method: 'cash',
            notes: ''
        });
    };

    // ===== OPEN FUNCTIONS =====
    const openEdit = (med) => {
        setSelectedMed(med);
        setFormData({
            medicine_name: med.medicine_name || '',
            generic_name: med.generic_name || '',
            category: med.category || '',
            manufacturer: med.manufacturer || '',
            supplier: med.supplier || '',
            batch_number: med.batch_number || '',
            expiry_date: med.expiry_date || '',
            stock: med.stock || '',
            min_stock: med.min_stock || '',
            max_stock: med.max_stock || '',
            reorder_level: med.reorder_level || '',
            purchase_price: med.purchase_price || '',
            selling_price: med.selling_price || med.price || '',
            discount_percent: med.discount_percent || '',
            strength: med.strength || '',
            dosage_form: med.dosage_form || '',
            unit: med.unit || '',
            requires_prescription: med.requires_prescription || false,
            is_controlled: med.is_controlled || false,
            side_effects: med.side_effects || '',
            indications: med.indications || '',
            contraindications: med.contraindications || '',
            storage_conditions: med.storage_conditions || '',
            notes: med.notes || '',
            status: med.status || 'active'
        });
        setIsEditOpen(true);
    };

    const openView = (med) => {
        setSelectedMed(med);
        setIsViewOpen(true);
    };

    const openDelete = (med) => {
        setSelectedMed(med);
        setIsDeleteOpen(true);
    };

    const openRestock = (med) => {
        setSelectedMed(med);
        setRestockQty('');
        setRestockNote('');
        setIsRestockOpen(true);
    };

    const openInvoiceView = (inv) => {
        setSelectedInvoice(inv);
        setIsInvoiceViewOpen(true);
    };

    const openInvoiceEdit = (inv) => {
        setSelectedInvoice(inv);
        setInvoiceEditData({
            patient_name: inv.patient_name || inv.patients?.name || '',
            patient_phone: inv.patient_phone || '',
            invoice_date: inv.invoice_date || new Date().toISOString().split('T')[0],
            due_date: inv.due_date || inv.invoice_date || new Date().toISOString().split('T')[0],
            total: inv.total || 0,
            status: inv.status || 'pending',
            payment_method: inv.payment_method || 'cash',
            notes: inv.notes || ''
        });
        setIsInvoiceEditOpen(true);
    };

    const openInvoiceDelete = (inv) => {
        setSelectedInvoice(inv);
        setIsInvoiceDeleteOpen(true);
    };

    // ============================================================
    // ===== DISPENSE FUNCTIONS =====
    // ============================================================
    const addToCart = () => {
        if (!selectedMedicine) {
            showToast('Please select a medicine', 'error');
            return;
        }
        if (!quantity || quantity < 1) {
            showToast('Please enter valid quantity', 'error');
            return;
        }
        if (quantity > selectedMedicine.stock) {
            showToast(`Only ${selectedMedicine.stock} units available`, 'error');
            return;
        }

        const existing = cartItems.find(item => item.medicine_id === selectedMedicine.id);

        if (existing) {
            const newQty = existing.quantity + parseInt(quantity);
            if (newQty > selectedMedicine.stock) {
                showToast(`Only ${selectedMedicine.stock} units available`, 'error');
                return;
            }
            setCartItems(cartItems.map(item =>
                item.medicine_id === selectedMedicine.id
                    ? { ...item, quantity: newQty, total: item.price * newQty }
                    : item
            ));
        } else {
            setCartItems([
                ...cartItems,
                {
                    medicine_id: selectedMedicine.id,
                    medicine_name: selectedMedicine.medicine_name,
                    price: parseFloat(selectedMedicine.selling_price || selectedMedicine.price || 0),
                    quantity: parseInt(quantity),
                    total: parseFloat(selectedMedicine.selling_price || selectedMedicine.price || 0) * parseInt(quantity)
                }
            ]);
        }

        setSelectedMedicine(null);
        setQuantity(1);
        showToast('✅ Medicine added to cart!', 'success');
    };

    const removeFromCart = (index) => {
        setCartItems(cartItems.filter((_, i) => i !== index));
    };

    const updateQuantity = (index, newQuantity) => {
        if (newQuantity < 1) return;
        const medicine = medicines.find(m => m.id === cartItems[index].medicine_id);
        if (newQuantity > medicine.stock) {
            showToast(`Only ${medicine.stock} units available`, 'error');
            return;
        }
        const updated = [...cartItems];
        updated[index].quantity = newQuantity;
        updated[index].total = updated[index].price * newQuantity;
        setCartItems(updated);
    };

    const calculateTotals = () => {
        const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
        const tax = subtotal * 0.05;
        const total = subtotal + tax;
        return { subtotal, tax, total };
    };

    // ============================================================
    // ===== FIXED: DISPENSE MEDICINE - MATCHES YOUR SCHEMA =====
    // ============================================================
    const dispenseMedicine = async () => {
        if (!selectedPatient) {
            showToast('Please select a patient', 'error');
            return;
        }
        if (cartItems.length === 0) {
            showToast('Cart is empty! Add some medicines', 'error');
            return;
        }

        setLoading(true);

        try {
            const { subtotal, tax, total } = calculateTotals();
            const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
            const today = new Date().toISOString().split('T')[0];
            const now = new Date().toISOString();

            // Build items array for JSONB
            const itemsArray = cartItems.map(item => ({
                medicine_id: item.medicine_id,
                medicine_name: item.medicine_name,
                quantity: item.quantity,
                price: item.price,
                total: item.total
            }));

            console.log('📝 Creating invoice with data:', {
                invoice_number: invoiceNumber,
                patient_id: selectedPatient.id,
                patient_name: selectedPatient.name,
                patient_phone: selectedPatient.phone || '',
                invoice_date: today,
                subtotal: subtotal,
                tax_amount: tax,
                total: total,
                status: paymentMethod === 'cash' ? 'paid' : 'pending',
                items: itemsArray
            });

            // ============================================================
            // 1. CREATE INVOICE - MATCHES YOUR SCHEMA
            // ============================================================
            const invoiceData = {
                invoice_number: invoiceNumber,
                patient_id: selectedPatient.id,
                patient_name: selectedPatient.name,
                patient_phone: selectedPatient.phone || '',
                invoice_date: today,
                due_date: today,
                subtotal: parseFloat(subtotal.toFixed(2)),
                discount_type: 'percentage',
                discount_value: 0,
                discount_amount: 0,
                tax_type: 'percentage',
                tax_value: 5,
                tax_amount: parseFloat(tax.toFixed(2)),
                total: parseFloat(total.toFixed(2)),
                items: itemsArray,
                status: paymentMethod === 'cash' ? 'paid' : 'pending',
                payment_method: paymentMethod,
                paid_amount: paymentMethod === 'cash' ? parseFloat(total.toFixed(2)) : 0,
                remaining_amount: paymentMethod === 'cash' ? 0 : parseFloat(total.toFixed(2)),
                payment_date: paymentMethod === 'cash' ? now : null,
                notes: `Pharmacy dispense - ${cartItems.length} items`,
                department: 'Pharmacy',
                created_at: now,
                updated_at: now
            };

            console.log('📤 Inserting invoice:', invoiceData);

            const { data: invoice, error: invoiceError } = await supabase
                .from('invoices')
                .insert([invoiceData])
                .select();

            if (invoiceError) {
                console.error('❌ Invoice Error:', invoiceError);
                showToast('Failed to create invoice: ' + invoiceError.message, 'error');
                setLoading(false);
                return;
            }

            if (!invoice || invoice.length === 0) {
                showToast('Failed to create invoice - no data returned', 'error');
                setLoading(false);
                return;
            }

            const newInvoice = invoice[0];
            console.log('✅ Invoice created:', newInvoice);

            // ============================================================
            // 2. UPDATE STOCK FOR EACH MEDICINE
            // ============================================================
            let stockErrors = [];

            for (const item of cartItems) {
                try {
                    // Get current stock
                    const { data: medicine, error: stockError } = await supabase
                        .from('pharmacy')
                        .select('stock')
                        .eq('id', item.medicine_id)
                        .single();

                    if (stockError) {
                        console.error('❌ Stock Error:', stockError);
                        stockErrors.push(item.medicine_name);
                        continue;
                    }

                    const currentStock = medicine?.stock || 0;
                    const newStock = currentStock - item.quantity;

                    if (newStock < 0) {
                        stockErrors.push(`${item.medicine_name} (insufficient stock)`);
                        continue;
                    }

                    // Update stock
                    await supabase
                        .from('pharmacy')
                        .update({ stock: newStock, updated_at: now })
                        .eq('id', item.medicine_id);

                    console.log(`✅ Stock updated: ${item.medicine_name} ${currentStock} → ${newStock}`);

                } catch (itemError) {
                    console.error('❌ Error updating stock:', itemError);
                    stockErrors.push(item.medicine_name);
                }
            }

            // ============================================================
            // 3. SHOW SUCCESS
            // ============================================================
            setInvoiceData(newInvoice);
            setInvoiceGenerated(true);

            let message = `✅ ${invoiceNumber} generated! ${cartItems.length} item(s) dispensed.`;
            if (stockErrors.length > 0) {
                message += ` ⚠️ Issues with: ${stockErrors.join(', ')}`;
            }
            showToast(message, stockErrors.length > 0 ? 'warning' : 'success');

            setCartItems([]);
            setSelectedPatient(null);
            setSelectedMedicine(null);
            setQuantity(1);

            // ===== RELOAD DATA =====
            await loadInvoices();
            await loadPharmacy();

        } catch (error) {
            console.error('❌ Error dispensing medicine:', error);
            showToast('Failed to dispense: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // ===== EXPORT FUNCTIONS =====
    const exportToCSV = () => {
        setExporting(true);
        try {
            const dataToExport = filteredAndSorted.length > 0 ? filteredAndSorted : medicines;
            const headers = ['Medicine Name', 'Generic Name', 'Category', 'Stock', 'Selling Price', 'Status', 'Expiry Date'];
            const rows = dataToExport.map(med => [
                med.medicine_name || 'N/A',
                med.generic_name || 'N/A',
                med.category || 'N/A',
                med.stock || 0,
                parseFloat(med.selling_price || med.price || 0).toFixed(2),
                getStatusBadge(med).label,
                med.expiry_date ? new Date(med.expiry_date).toLocaleDateString() : 'N/A'
            ]);

            const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `pharmacy_inventory_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showToast('✅ CSV exported successfully!', 'success');
        } catch (err) {
            showToast('Failed to export CSV: ' + err.message, 'error');
        } finally {
            setExporting(false);
            setShowExportMenu(false);
        }
    };

    const exportToExcel = () => {
        setExporting(true);
        try {
            const dataToExport = filteredAndSorted.length > 0 ? filteredAndSorted : medicines;
            let html = `
                <html xmlns:o="urn:schemas-microsoft-com:office:office" 
                      xmlns:x="urn:schemas-microsoft-com:office:excel" 
                      xmlns="http://www.w3.org/TR/REC-html40">
                <head><meta charset="UTF-8">
                <style>
                    table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; }
                    th { background-color: #4A90D9; color: white; padding: 8px; border: 1px solid #ddd; }
                    td { padding: 6px 8px; border: 1px solid #ddd; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                </style>
                </head>
                <body>
                    <h2>Pharmacy Inventory Report</h2>
                    <p>Generated: ${new Date().toLocaleString()}</p>
                    <table>
                        <thead><tr>
                            <th>#</th><th>Medicine Name</th><th>Generic Name</th>
                            <th>Category</th><th>Stock</th><th>Selling Price</th>
                            <th>Status</th><th>Expiry Date</th>
                        </tr></thead>
                        <tbody>
            `;

            dataToExport.forEach((med, index) => {
                const status = getStatusBadge(med);
                html += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${med.medicine_name || 'N/A'}</td>
                        <td>${med.generic_name || 'N/A'}</td>
                        <td>${med.category || 'N/A'}</td>
                        <td>${med.stock || 0}</td>
                        <td>Rs. ${parseFloat(med.selling_price || med.price || 0).toFixed(2)}</td>
                        <td>${status.label}</td>
                        <td>${med.expiry_date ? new Date(med.expiry_date).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                `;
            });

            html += `</tbody></table></body></html>`;

            const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `pharmacy_inventory_${new Date().toISOString().split('T')[0]}.xls`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showToast('✅ Excel exported successfully!', 'success');
        } catch (err) {
            showToast('Failed to export Excel: ' + err.message, 'error');
        } finally {
            setExporting(false);
            setShowExportMenu(false);
        }
    };

    const exportToPDF = () => {
        setShowExportMenu(false);
        const printWindow = window.open('', '_blank', 'width=1000,height=800');
        if (!printWindow) {
            showToast('Please allow popups for this site', 'error');
            return;
        }

        const dataToExport = filteredAndSorted.length > 0 ? filteredAndSorted : medicines;
        let htmlContent = `
            <!DOCTYPE html>
            <html>
            <head><title>Pharmacy Inventory Report</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #2563EB; text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background-color: #2563EB; color: white; padding: 10px; text-align: left; }
                td { padding: 8px 10px; border: 1px solid #ddd; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .status-badge { padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; display: inline-block; }
                .status-in-stock { background: #DCFCE7; color: #16A34A; }
                .status-low-stock { background: #FEF3C7; color: #D97706; }
                .status-critical { background: #FEE2E2; color: #DC2626; }
                .status-out-of-stock { background: #FEE2E2; color: #EF4444; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 11px; }
            </style>
            </head>
            <body>
                <h1>Pharmacy Inventory Report</h1>
                <p style="text-align:center;">Generated: ${new Date().toLocaleString()}</p>
                <table>
                    <thead><tr>
                        <th>#</th><th>Medicine Name</th><th>Generic Name</th>
                        <th>Category</th><th>Stock</th><th>Price</th><th>Status</th><th>Expiry</th>
                    </tr></thead>
                    <tbody>
        `;

        dataToExport.forEach((med, index) => {
            const status = getStatusBadge(med);
            const statusClass = status.label === 'In Stock' ? 'status-in-stock' :
                status.label === 'Low Stock' ? 'status-low-stock' :
                    status.label === 'Critical' ? 'status-critical' : 'status-out-of-stock';

            htmlContent += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${med.medicine_name || 'N/A'}</td>
                    <td>${med.generic_name || 'N/A'}</td>
                    <td>${med.category || 'N/A'}</td>
                    <td>${med.stock || 0}</td>
                    <td>Rs. ${parseFloat(med.selling_price || med.price || 0).toFixed(2)}</td>
                    <td><span class="status-badge ${statusClass}">${status.icon} ${status.label}</span></td>
                    <td>${med.expiry_date ? new Date(med.expiry_date).toLocaleDateString() : 'N/A'}</td>
                </tr>
            `;
        });

        htmlContent += `
                    </tbody>
                </table>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} Subhan Care Clinic. All rights reserved.</p>
                </div>
                <div style="text-align:center; margin-top:20px;">
                    <button onclick="window.print()" style="padding:10px 30px; background:#2563EB; color:white; border:none; border-radius:8px; cursor:pointer;">🖨️ Print</button>
                    <button onclick="window.close()" style="padding:10px 30px; background:#6B7280; color:white; border:none; border-radius:8px; cursor:pointer; margin-left:10px;">❌ Close</button>
                </div>
                <script>
                    setTimeout(() => window.print(), 1000);
                <\/script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
        showToast('✅ PDF generated!', 'success');
    };

    const exportToJSON = () => {
        setExporting(true);
        try {
            const dataToExport = filteredAndSorted.length > 0 ? filteredAndSorted : medicines;
            const jsonData = dataToExport.map(med => ({
                id: med.id,
                medicine_name: med.medicine_name,
                generic_name: med.generic_name,
                category: med.category,
                stock: parseInt(med.stock) || 0,
                selling_price: parseFloat(med.selling_price || med.price) || 0,
                status: getStatusBadge(med).label,
                expiry_date: med.expiry_date
            }));

            const jsonStr = JSON.stringify({
                report_date: new Date().toISOString(),
                total_medicines: jsonData.length,
                data: jsonData
            }, null, 2);

            const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `pharmacy_inventory_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showToast('✅ JSON exported!', 'success');
        } catch (err) {
            showToast('Failed to export JSON: ' + err.message, 'error');
        } finally {
            setExporting(false);
            setShowExportMenu(false);
        }
    };

    const printReport = () => {
        window.print();
        setShowExportMenu(false);
    };

    // ===== FILTERED AND SORTED MEDICINES =====
    const filteredAndSorted = medicines
        .filter(med => {
            const matchesSearch = med.medicine_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (med.generic_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (med.manufacturer || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = filterCategory === 'all' || med.category === filterCategory;
            const matchesStatus = filterStatus === 'all' ||
                (filterStatus === 'in-stock' && med.stock > 0) ||
                (filterStatus === 'low-stock' && med.stock > 0 && med.stock <= 20) ||
                (filterStatus === 'critical' && med.stock > 0 && med.stock <= 5) ||
                (filterStatus === 'out-of-stock' && (med.stock === 0 || !med.stock));
            return matchesSearch && matchesCategory && matchesStatus;
        })
        .sort((a, b) => {
            if (sortBy === 'name') return a.medicine_name.localeCompare(b.medicine_name);
            if (sortBy === 'stock') return (a.stock || 0) - (b.stock || 0);
            if (sortBy === 'price') return (parseFloat(a.selling_price || a.price || 0) - parseFloat(b.selling_price || b.price || 0));
            if (sortBy === 'category') return (a.category || '').localeCompare(b.category || '');
            if (sortBy === 'expiry') return (a.expiry_date || '').localeCompare(b.expiry_date || '');
            return 0;
        });

    // ===== GET STATUS BADGE =====
    const getStatusBadge = (med) => {
        const stock = parseInt(med.stock) || 0;
        if (stock <= 0) {
            return { label: 'Out of Stock', color: '#EF4444', bg: '#FEE2E2', icon: '🔴' };
        } else if (stock <= 5) {
            return { label: 'Critical', color: '#DC2626', bg: '#FEE2E2', icon: '🔴' };
        } else if (stock <= 20) {
            return { label: 'Low Stock', color: '#D97706', bg: '#FEF3C7', icon: '🟡' };
        } else {
            return { label: 'In Stock', color: '#16A34A', bg: '#DCFCE7', icon: '🟢' };
        }
    };

    const getInvoiceStatusBadge = (status) => {
        const colors = {
            paid: { bg: '#DCFCE7', text: '#16A34A', icon: '✅' },
            pending: { bg: '#FEF3C7', text: '#D97706', icon: '⏳' },
            unpaid: { bg: '#FEE2E2', text: '#DC2626', icon: '❌' },
            partial: { bg: '#DBEAFE', text: '#2563EB', icon: '🔶' },
            cancelled: { bg: '#F3F4F6', text: '#6B7280', icon: '⛔' },
            refunded: { bg: '#F3F4F6', text: '#6B7280', icon: '↩️' }
        };
        return colors[status] || colors.pending;
    };

    // ===== STAT CARD =====
    const StatCard = ({ icon: Icon, title, value, color, subtitle }) => (
        <div style={{
            background: 'var(--card-bg)',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                    padding: '10px',
                    borderRadius: '10px',
                    background: color + '15',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Icon size={20} style={{ color }} />
                </div>
                <div>
                    <div style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        {title}
                    </div>
                    <div style={{
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)'
                    }}>
                        {value}
                    </div>
                    {subtitle && (
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            {subtitle}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // ============================================================
    // ===== RENDER INVENTORY TAB =====
    // ============================================================
    const renderInventory = () => {
        return (
            <>
                {/* Statistics */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '12px',
                    marginBottom: '24px'
                }}>
                    <StatCard
                        icon={Package}
                        title="Total Medicines"
                        value={stats.totalMedicines}
                        color="var(--primary-color)"
                        subtitle={`${stats.categories} categories`}
                    />
                    <StatCard
                        icon={AlertTriangle}
                        title="Low Stock"
                        value={stats.lowStock}
                        color="#D97706"
                        subtitle={`${stats.criticalStock} critical`}
                    />
                    <StatCard
                        icon={AlertCircle}
                        title="Out of Stock"
                        value={stats.outOfStock}
                        color="#EF4444"
                    />
                    <StatCard
                        icon={DollarSign}
                        title="Inventory Value"
                        value={`Rs. ${stats.totalValue.toLocaleString()}`}
                        color="#22C55E"
                        subtitle={`${stats.suppliers} suppliers`}
                    />
                </div>

                {/* Controls Bar */}
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
                    <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                        <Search size={16} style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)'
                        }} />
                        <input
                            type="text"
                            placeholder="Search by name, generic, manufacturer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px 8px 36px',
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
                                padding: '6px 12px',
                                border: '1.5px solid var(--border-color)',
                                borderRadius: '10px',
                                background: 'var(--bg-primary)',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontFamily: 'var(--font-family)',
                                color: 'var(--text-secondary)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <Filter size={14} style={{ color: 'var(--primary-color)' }} />
                            Filters
                        </button>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={{
                                padding: '6px 12px',
                                border: '1.5px solid var(--border-color)',
                                borderRadius: '10px',
                                fontSize: '0.75rem',
                                fontFamily: 'var(--font-family)',
                                background: 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="name">Sort by Name</option>
                            <option value="stock">Sort by Stock</option>
                            <option value="price">Sort by Price</option>
                            <option value="category">Sort by Category</option>
                            <option value="expiry">Sort by Expiry</option>
                        </select>

                        <button
                            onClick={refreshAllData}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                border: '1.5px solid var(--border-color)',
                                borderRadius: '10px',
                                background: 'var(--bg-primary)',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontFamily: 'var(--font-family)',
                                color: 'var(--text-secondary)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <RefreshCw size={14} /> Refresh
                        </button>

                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                disabled={exporting}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 14px',
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
                            >
                                {exporting ? <Loader size={14} className="spinner" /> : <Download size={14} />}
                                {exporting ? 'Exporting...' : 'Export'}
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
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                                    minWidth: '200px',
                                    zIndex: 100,
                                    padding: '6px 0'
                                }}>
                                    <button onClick={exportToCSV} style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        padding: '10px 16px', width: '100%', border: 'none',
                                        background: 'transparent', cursor: 'pointer',
                                        fontSize: '0.8rem', fontFamily: 'var(--font-family)',
                                        color: 'var(--text-primary)',
                                        transition: 'all 0.15s ease'
                                    }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                        <FileText size={16} style={{ color: '#3B82F6' }} />
                                        CSV
                                    </button>
                                    <button onClick={exportToExcel} style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        padding: '10px 16px', width: '100%', border: 'none',
                                        background: 'transparent', cursor: 'pointer',
                                        fontSize: '0.8rem', fontFamily: 'var(--font-family)',
                                        color: 'var(--text-primary)',
                                        transition: 'all 0.15s ease'
                                    }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                        <FileSpreadsheet size={16} style={{ color: '#22C55E' }} />
                                        Excel
                                    </button>
                                    <button onClick={exportToPDF} style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        padding: '10px 16px', width: '100%', border: 'none',
                                        background: 'transparent', cursor: 'pointer',
                                        fontSize: '0.8rem', fontFamily: 'var(--font-family)',
                                        color: 'var(--text-primary)',
                                        transition: 'all 0.15s ease'
                                    }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                        <Printer size={16} style={{ color: '#EF4444' }} />
                                        PDF
                                    </button>
                                    <button onClick={exportToJSON} style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        padding: '10px 16px', width: '100%', border: 'none',
                                        background: 'transparent', cursor: 'pointer',
                                        fontSize: '0.8rem', fontFamily: 'var(--font-family)',
                                        color: 'var(--text-primary)',
                                        transition: 'all 0.15s ease'
                                    }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                        <FileJson size={16} style={{ color: '#8B5CF6' }} />
                                        JSON
                                    </button>
                                    <button onClick={printReport} style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        padding: '10px 16px', width: '100%', border: 'none',
                                        background: 'transparent', cursor: 'pointer',
                                        fontSize: '0.8rem', fontFamily: 'var(--font-family)',
                                        color: 'var(--text-primary)',
                                        transition: 'all 0.15s ease',
                                        borderTop: '1px solid var(--border-color)',
                                        marginTop: '4px', paddingTop: '10px'
                                    }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                        <Printer size={16} style={{ color: '#F59E0B' }} />
                                        Print Report
                                    </button>
                                    <button onClick={() => setShowExportMenu(false)} style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        padding: '10px 16px', width: '100%', border: 'none',
                                        background: 'transparent', cursor: 'pointer',
                                        fontSize: '0.8rem', fontFamily: 'var(--font-family)',
                                        color: 'var(--text-secondary)',
                                        transition: 'all 0.15s ease',
                                        borderTop: '1px solid var(--border-color)',
                                        paddingTop: '10px'
                                    }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover-bg)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                                        <X size={16} />
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => { resetForm(); setIsAddOpen(true); }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 14px',
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
                                e.currentTarget.style.background = '#1D4ED8';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'var(--primary-color)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <Plus size={14} /> Add
                        </button>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
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
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
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
                                minWidth: '130px'
                            }}
                        >
                            <option value="all">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
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
                            <option value="in-stock">🟢 In Stock</option>
                            <option value="low-stock">🟡 Low Stock</option>
                            <option value="critical">🔴 Critical</option>
                            <option value="out-of-stock">⭕ Out of Stock</option>
                        </select>

                        <button
                            onClick={() => { setFilterCategory('all'); setFilterStatus('all'); }}
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
                        >
                            Clear All
                        </button>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {filteredAndSorted.length} medicines found
                        </span>
                    </div>
                )}

                {/* Table */}
                <div style={{
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                            <Loader size={30} className="spinner" style={{ color: 'var(--primary-color)' }} />
                            <p style={{ marginTop: '12px' }}>Loading medicines...</p>
                        </div>
                    ) : filteredAndSorted.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                            <Package size={50} style={{ opacity: 0.3 }} />
                            <h3 style={{ marginTop: '12px', color: 'var(--text-primary)' }}>
                                {searchQuery ? 'No Results Found' : 'No Medicines'}
                            </h3>
                            <p style={{ marginBottom: '12px' }}>
                                {searchQuery ? `No matches for "${searchQuery}"` : 'Start by adding your first medicine'}
                            </p>
                            {searchQuery ? (
                                <button onClick={() => setSearchQuery('')} style={{
                                    padding: '8px 16px', background: 'var(--primary-color)',
                                    color: 'white', border: 'none', borderRadius: '8px',
                                    cursor: 'pointer', fontSize: '0.85rem'
                                }}>
                                    Clear Search
                                </button>
                            ) : (
                                <button onClick={() => { resetForm(); setIsAddOpen(true); }} style={{
                                    padding: '8px 16px', background: 'var(--primary-color)',
                                    color: 'white', border: 'none', borderRadius: '8px',
                                    cursor: 'pointer', fontSize: '0.85rem',
                                    display: 'inline-flex', alignItems: 'center', gap: '6px'
                                }}>
                                    <Plus size={16} /> Add Medicine
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '700px' }}>
                                <thead>
                                    <tr style={{
                                        background: 'var(--bg-primary)',
                                        borderBottom: '2px solid var(--border-color)'
                                    }}>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.65rem', textTransform: 'uppercase' }}>Medicine</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.65rem', textTransform: 'uppercase' }}>Category</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.65rem', textTransform: 'uppercase' }}>Stock</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.65rem', textTransform: 'uppercase' }}>Price</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.65rem', textTransform: 'uppercase' }}>Status</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.65rem', textTransform: 'uppercase' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAndSorted.map((med, index) => {
                                        const status = getStatusBadge(med);
                                        const stock = parseInt(med.stock) || 0;
                                        const price = parseFloat(med.selling_price || med.price || 0);
                                        const isExpired = med.expiry_date && new Date(med.expiry_date) < new Date();

                                        return (
                                            <tr key={med.id} style={{
                                                borderBottom: index < filteredAndSorted.length - 1 ? '1px solid var(--border-color)' : 'none',
                                                transition: 'background 0.2s ease',
                                                background: isExpired ? 'var(--danger-color)10' : 'transparent'
                                            }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = isExpired ? 'var(--danger-color)20' : 'var(--hover-bg)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = isExpired ? 'var(--danger-color)10' : 'transparent';
                                                }}>
                                                <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--text-primary)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{
                                                            width: '32px', height: '32px', borderRadius: '8px',
                                                            background: 'var(--primary-color)15',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            color: 'var(--primary-color)'
                                                        }}>
                                                            <Pill size={16} />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{med.medicine_name}</div>
                                                            {med.generic_name && (
                                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                                                    {med.generic_name}
                                                                    {med.strength && ` • ${med.strength}`}
                                                                </div>
                                                            )}
                                                            {isExpired && (
                                                                <div style={{ fontSize: '0.6rem', color: 'var(--danger-color)', fontWeight: 600 }}>⚠️ EXPIRED</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                                    {med.category || 'N/A'}
                                                </td>
                                                <td style={{
                                                    padding: '12px 16px', textAlign: 'center', fontWeight: 600,
                                                    color: stock <= 5 ? 'var(--danger-color)' : stock <= 20 ? '#D97706' : 'var(--text-primary)',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    {stock}
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                                                    Rs. {price.toFixed(2)}
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '3px 12px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 600,
                                                        background: status.bg, color: status.color,
                                                        border: `1px solid ${status.color}30`,
                                                        display: 'inline-flex', alignItems: 'center', gap: '4px'
                                                    }}>
                                                        {status.icon} {status.label}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                                        <button onClick={() => openView(med)} style={{
                                                            padding: '4px 8px', border: '1px solid var(--border-color)',
                                                            borderRadius: '6px', background: 'transparent', cursor: 'pointer',
                                                            fontSize: '0.65rem', fontFamily: 'var(--font-family)',
                                                            color: 'var(--text-secondary)',
                                                            transition: 'all 0.2s ease',
                                                            display: 'inline-flex', alignItems: 'center', gap: '3px'
                                                        }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.borderColor = 'var(--primary-color)';
                                                                e.currentTarget.style.color = 'var(--primary-color)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                                                e.currentTarget.style.color = 'var(--text-secondary)';
                                                            }}>
                                                            <Eye size={12} /> View
                                                        </button>
                                                        <button onClick={() => openRestock(med)} style={{
                                                            padding: '4px 8px', border: '1px solid var(--border-color)',
                                                            borderRadius: '6px', background: 'transparent', cursor: 'pointer',
                                                            fontSize: '0.65rem', fontFamily: 'var(--font-family)',
                                                            color: 'var(--text-secondary)',
                                                            transition: 'all 0.2s ease',
                                                            display: 'inline-flex', alignItems: 'center', gap: '3px'
                                                        }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.borderColor = '#8B5CF6';
                                                                e.currentTarget.style.color = '#8B5CF6';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                                                e.currentTarget.style.color = 'var(--text-secondary)';
                                                            }}>
                                                            <PackageOpen size={12} /> Restock
                                                        </button>
                                                        <button onClick={() => openEdit(med)} style={{
                                                            padding: '4px 8px', border: '1px solid var(--border-color)',
                                                            borderRadius: '6px', background: 'transparent', cursor: 'pointer',
                                                            fontSize: '0.65rem', fontFamily: 'var(--font-family)',
                                                            color: 'var(--text-secondary)',
                                                            transition: 'all 0.2s ease',
                                                            display: 'inline-flex', alignItems: 'center', gap: '3px'
                                                        }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.borderColor = 'var(--secondary-color)';
                                                                e.currentTarget.style.color = 'var(--secondary-color)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                                                e.currentTarget.style.color = 'var(--text-secondary)';
                                                            }}>
                                                            <Edit2 size={12} /> Edit
                                                        </button>
                                                        <button onClick={() => openDelete(med)} style={{
                                                            padding: '4px 8px', border: '1px solid var(--border-color)',
                                                            borderRadius: '6px', background: 'transparent', cursor: 'pointer',
                                                            fontSize: '0.65rem', fontFamily: 'var(--font-family)',
                                                            color: 'var(--text-secondary)',
                                                            transition: 'all 0.2s ease',
                                                            display: 'inline-flex', alignItems: 'center', gap: '3px'
                                                        }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.borderColor = 'var(--danger-color)';
                                                                e.currentTarget.style.color = 'var(--danger-color)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                                                e.currentTarget.style.color = 'var(--text-secondary)';
                                                            }}>
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
            </>
        );
    };

    // ============================================================
    // ===== RENDER DISPENSE TAB =====
    // ============================================================
    const renderDispense = () => {
        const { subtotal, tax, total } = calculateTotals();

        return (
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '24px'
            }}>
                {/* LEFT: Dispense Form */}
                <div style={{
                    background: 'var(--card-bg)',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <h3 style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <Pill size={20} style={{ color: 'var(--primary-color)' }} />
                        Dispense Medicine
                    </h3>

                    {/* Patient Selection */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            marginBottom: '6px'
                        }}>
                            <User size={14} style={{ display: 'inline', marginRight: '4px' }} />
                            Select Patient *
                        </label>
                        <select
                            value={selectedPatient?.id || ''}
                            onChange={(e) => {
                                const patient = patients.find(p => p.id === e.target.value);
                                setSelectedPatient(patient || null);
                            }}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                border: '1.5px solid var(--border-color)',
                                borderRadius: '10px',
                                fontSize: '0.9rem',
                                background: 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                appearance: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="">Search patient...</option>
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} {p.phone ? `(${p.phone})` : ''}
                                </option>
                            ))}
                        </select>
                        {selectedPatient && (
                            <div style={{
                                marginTop: '6px',
                                padding: '8px 12px',
                                background: 'var(--primary-color)10',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                color: 'var(--text-secondary)'
                            }}>
                                👤 {selectedPatient.name} {selectedPatient.phone && `📞 ${selectedPatient.phone}`}
                            </div>
                        )}
                    </div>

                    {/* Medicine Selection */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            marginBottom: '6px'
                        }}>
                            <Package size={14} style={{ display: 'inline', marginRight: '4px' }} />
                            Add Medicine *
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <select
                                value={selectedMedicine?.id || ''}
                                onChange={(e) => {
                                    const med = medicines.find(m => m.id === e.target.value);
                                    setSelectedMedicine(med || null);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '10px 14px',
                                    border: '1.5px solid var(--border-color)',
                                    borderRadius: '10px',
                                    fontSize: '0.9rem',
                                    background: 'var(--bg-primary)',
                                    color: 'var(--text-primary)',
                                    outline: 'none',
                                    appearance: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="">Search medicine...</option>
                                {medicines.filter(m => m.stock > 0).map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.medicine_name} (Stock: {m.stock}) - Rs. {m.selling_price || m.price}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                min="1"
                                max={selectedMedicine?.stock || 10}
                                style={{
                                    width: '80px',
                                    padding: '10px 8px',
                                    border: '1.5px solid var(--border-color)',
                                    borderRadius: '10px',
                                    fontSize: '0.9rem',
                                    background: 'var(--bg-primary)',
                                    color: 'var(--text-primary)',
                                    outline: 'none',
                                    textAlign: 'center'
                                }}
                            />
                            <button
                                onClick={addToCart}
                                style={{
                                    padding: '10px 16px',
                                    border: 'none',
                                    borderRadius: '10px',
                                    background: 'var(--primary-color)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#1D4ED8';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'var(--primary-color)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <Plus size={16} /> Add
                            </button>
                        </div>
                        {selectedMedicine && (
                            <div style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                                marginTop: '4px'
                            }}>
                                Stock: {selectedMedicine.stock} | Price: Rs. {selectedMedicine.selling_price || selectedMedicine.price}
                            </div>
                        )}
                    </div>

                    {/* Cart Items */}
                    <div style={{
                        background: 'var(--bg-primary)',
                        borderRadius: '12px',
                        padding: '12px',
                        minHeight: '150px',
                        maxHeight: '300px',
                        overflow: 'auto',
                        border: '1px solid var(--border-color)',
                        marginBottom: '16px'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            padding: '4px 8px',
                            borderBottom: '2px solid var(--border-color)',
                            marginBottom: '8px'
                        }}>
                            <span style={{ flex: 2 }}>Medicine</span>
                            <span style={{ width: '50px', textAlign: 'center' }}>Qty</span>
                            <span style={{ width: '70px', textAlign: 'right' }}>Price</span>
                            <span style={{ width: '80px', textAlign: 'right' }}>Total</span>
                            <span style={{ width: '30px' }}></span>
                        </div>

                        {cartItems.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                                <Package size={30} style={{ opacity: 0.3 }} />
                                <p style={{ marginTop: '8px', fontSize: '0.85rem' }}>No medicines added yet</p>
                            </div>
                        ) : (
                            cartItems.map((item, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '6px 8px',
                                    borderBottom: '1px solid var(--border-color)',
                                    background: index % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)'
                                }}>
                                    <span style={{ flex: 2, fontSize: '0.85rem', fontWeight: 500 }}>
                                        {item.medicine_name}
                                    </span>
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                                        min="1"
                                        style={{
                                            width: '50px',
                                            padding: '4px 6px',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '6px',
                                            fontSize: '0.8rem',
                                            textAlign: 'center',
                                            background: 'var(--card-bg)',
                                            color: 'var(--text-primary)'
                                        }}
                                    />
                                    <span style={{ width: '70px', fontSize: '0.85rem', textAlign: 'right' }}>
                                        Rs. {item.price}
                                    </span>
                                    <span style={{ width: '80px', fontSize: '0.85rem', fontWeight: 600, textAlign: 'right' }}>
                                        Rs. {item.total}
                                    </span>
                                    <button
                                        onClick={() => removeFromCart(index)}
                                        style={{
                                            padding: '4px 8px',
                                            border: 'none',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            color: 'var(--danger-color)'
                                        }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Payment Method */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            marginBottom: '6px'
                        }}>
                            <CreditCard size={14} style={{ display: 'inline', marginRight: '4px' }} />
                            Payment Method *
                        </label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {['cash', 'card', 'insurance', 'online'].map(method => (
                                <button
                                    key={method}
                                    onClick={() => setPaymentMethod(method)}
                                    style={{
                                        padding: '6px 14px',
                                        borderRadius: '8px',
                                        border: paymentMethod === method ? '2px solid var(--primary-color)' : '1.5px solid var(--border-color)',
                                        background: paymentMethod === method ? 'var(--primary-color)10' : 'transparent',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        fontFamily: 'var(--font-family)',
                                        color: paymentMethod === method ? 'var(--primary-color)' : 'var(--text-secondary)',
                                        textTransform: 'capitalize',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {method}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Totals */}
                    <div style={{
                        padding: '12px',
                        background: 'var(--bg-primary)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        marginBottom: '16px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
                            <span>Rs. {subtotal.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Tax (5%):</span>
                            <span>Rs. {tax.toFixed(2)}</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            borderTop: '2px solid var(--border-color)',
                            paddingTop: '8px',
                            marginTop: '4px',
                            color: 'var(--text-primary)'
                        }}>
                            <span>Total:</span>
                            <span style={{ color: 'var(--primary-color)' }}>Rs. {total.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Dispense Button */}
                    <button
                        onClick={dispenseMedicine}
                        disabled={loading || cartItems.length === 0 || !selectedPatient}
                        style={{
                            width: '100%',
                            padding: '14px',
                            border: 'none',
                            borderRadius: '12px',
                            background: loading || cartItems.length === 0 || !selectedPatient
                                ? 'var(--primary-color)70'
                                : 'var(--primary-color)',
                            color: 'white',
                            cursor: loading || cartItems.length === 0 || !selectedPatient
                                ? 'not-allowed'
                                : 'pointer',
                            fontSize: '1rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading && cartItems.length > 0 && selectedPatient) {
                                e.currentTarget.style.background = '#1D4ED8';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading && cartItems.length > 0 && selectedPatient) {
                                e.currentTarget.style.background = 'var(--primary-color)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }
                        }}
                    >
                        {loading ? (
                            <>
                                <Loader size={18} className="spinner" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <CheckCircle size={20} />
                                Dispense & Generate Invoice
                            </>
                        )}
                    </button>
                </div>

                {/* RIGHT: Billing Dashboard */}
                <div style={{
                    background: 'var(--card-bg)',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px'
                    }}>
                        <h3 style={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <DollarSign size={20} style={{ color: '#22C55E' }} />
                            Billing Dashboard
                        </h3>
                        <button
                            onClick={refreshAllData}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                                color: 'var(--text-secondary)',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--hover-bg)';
                                e.currentTarget.style.borderColor = 'var(--primary-color)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                            }}
                        >
                            <RefreshCw size={14} /> Refresh
                        </button>
                    </div>

                    {/* Billing Stats - MATCHES YOUR SCHEMA */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '10px',
                        marginBottom: '16px'
                    }}>
                        <div style={{
                            padding: '12px',
                            background: 'var(--bg-primary)',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Invoices</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {billingStats.totalInvoices}
                            </div>
                        </div>
                        <div style={{
                            padding: '12px',
                            background: 'var(--bg-primary)',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Amount</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                Rs. {billingStats.totalAmount.toFixed(2)}
                            </div>
                        </div>
                        <div style={{
                            padding: '12px',
                            background: 'var(--bg-primary)',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Paid</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#22C55E' }}>
                                Rs. {billingStats.paidAmount.toFixed(2)}
                            </div>
                        </div>
                        <div style={{
                            padding: '12px',
                            background: 'var(--bg-primary)',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pending</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#D97706' }}>
                                Rs. {billingStats.pendingAmount.toFixed(2)}
                            </div>
                        </div>
                        <div style={{
                            padding: '12px',
                            background: 'var(--bg-primary)',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Unpaid</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#EF4444' }}>
                                Rs. {billingStats.unpaidAmount.toFixed(2)}
                            </div>
                        </div>
                        <div style={{
                            padding: '12px',
                            background: 'var(--bg-primary)',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Partial</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#8B5CF6' }}>
                                Rs. {billingStats.partialAmount.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    {/* Balance */}
                    <div style={{
                        padding: '16px',
                        background: 'var(--primary-color)10',
                        borderRadius: '12px',
                        border: '2px solid var(--primary-color)30',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Balance (Total - Paid)
                        </div>
                        <div style={{
                            fontSize: '1.6rem',
                            fontWeight: 700,
                            color: billingStats.balance > 0 ? '#D97706' : '#22C55E'
                        }}>
                            Rs. {billingStats.balance.toFixed(2)}
                        </div>
                    </div>

                    {/* Recent Invoices */}
                    <div style={{ marginTop: '16px' }}>
                        <h4 style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            marginBottom: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <Receipt size={14} style={{ color: 'var(--primary-color)' }} />
                            Recent Invoices
                        </h4>
                        {invoices.slice(0, 5).map(inv => {
                            const status = getInvoiceStatusBadge(inv.status);
                            return (
                                <div key={inv.id} style={{
                                    padding: '8px 12px',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    marginBottom: '6px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '0.75rem'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 500 }}>{inv.invoice_number}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                                            {inv.patients?.name || inv.patient_name}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontWeight: 600 }}>
                                            Rs. {(parseFloat(inv.total) || 0).toFixed(2)}
                                        </span>
                                        <span style={{
                                            padding: '1px 8px',
                                            borderRadius: '12px',
                                            fontSize: '0.55rem',
                                            fontWeight: 600,
                                            background: status.bg,
                                            color: status.text
                                        }}>
                                            {status.icon} {inv.status}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    // ============================================================
    // ===== RENDER INVOICES TAB =====
    // ============================================================
    const renderInvoices = () => {
        return (
            <div style={{
                background: 'var(--card-bg)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid var(--border-color)'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    flexWrap: 'wrap',
                    gap: '10px'
                }}>
                    <h3 style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <FileText size={20} style={{ color: 'var(--primary-color)' }} />
                        All Pharmacy Invoices ({invoices.length})
                    </h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={refreshAllData}
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
                                color: 'var(--text-secondary)',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--hover-bg)';
                                e.currentTarget.style.borderColor = 'var(--primary-color)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                            }}
                        >
                            <RefreshCw size={14} /> Refresh
                        </button>
                        <button
                            onClick={() => setActiveTab('dispense')}
                            style={{
                                padding: '8px 16px',
                                background: 'var(--primary-color)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
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
                            <Plus size={16} /> New Dispense
                        </button>
                    </div>
                </div>

                {invoices.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        <Receipt size={50} style={{ opacity: 0.3 }} />
                        <p style={{ marginTop: '8px' }}>No invoices found</p>
                        <button
                            onClick={() => setActiveTab('dispense')}
                            style={{
                                marginTop: '12px',
                                padding: '8px 16px',
                                background: 'var(--primary-color)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.85rem'
                            }}
                        >
                            Dispense First Medicine
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {invoices.map(inv => {
                            const status = getInvoiceStatusBadge(inv.status);
                            const total = parseFloat(inv.total) || 0;

                            return (
                                <div key={inv.id} style={{
                                    padding: '12px 16px',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '8px',
                                    transition: 'all 0.2s ease'
                                }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--primary-color)';
                                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--border-color)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            padding: '8px',
                                            borderRadius: '8px',
                                            background: 'var(--primary-color)15',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <Receipt size={18} style={{ color: 'var(--primary-color)' }} />
                                        </div>
                                        <div>
                                            <div style={{
                                                fontWeight: 600,
                                                color: 'var(--text-primary)',
                                                fontSize: '0.85rem'
                                            }}>
                                                {inv.invoice_number}
                                            </div>
                                            <div style={{
                                                fontSize: '0.7rem',
                                                color: 'var(--text-muted)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                flexWrap: 'wrap'
                                            }}>
                                                <span>👤 {inv.patients?.name || inv.patient_name || 'Unknown'}</span>
                                                <span>•</span>
                                                <span>📅 {new Date(inv.created_at).toLocaleDateString()}</span>
                                                <span>•</span>
                                                <span>💊 {inv.items?.length || 0} items</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        flexWrap: 'wrap'
                                    }}>
                                        <span style={{
                                            fontWeight: 700,
                                            color: 'var(--text-primary)',
                                            fontSize: '0.9rem'
                                        }}>
                                            Rs. {total.toFixed(2)}
                                        </span>
                                        <span style={{
                                            padding: '2px 10px',
                                            borderRadius: '20px',
                                            fontSize: '0.65rem',
                                            fontWeight: 600,
                                            background: status.bg,
                                            color: status.text,
                                            border: `1px solid ${status.text}30`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            {status.icon} {inv.status || 'pending'}
                                        </span>

                                        {/* Action Buttons */}
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button
                                                onClick={() => openInvoiceView(inv)}
                                                style={{
                                                    padding: '4px 8px',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: '6px',
                                                    background: 'transparent',
                                                    cursor: 'pointer',
                                                    fontSize: '0.65rem',
                                                    color: 'var(--text-secondary)',
                                                    transition: 'all 0.2s ease',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '3px'
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
                                                onClick={() => openInvoiceEdit(inv)}
                                                style={{
                                                    padding: '4px 8px',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: '6px',
                                                    background: 'transparent',
                                                    cursor: 'pointer',
                                                    fontSize: '0.65rem',
                                                    color: 'var(--text-secondary)',
                                                    transition: 'all 0.2s ease',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '3px'
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
                                            {/* Status Update Buttons */}
                                            {inv.status !== 'paid' && (
                                                <button
                                                    onClick={() => updateInvoiceStatus(inv.id, 'paid')}
                                                    disabled={actionLoading}
                                                    style={{
                                                        padding: '4px 8px',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '6px',
                                                        background: 'transparent',
                                                        cursor: actionLoading ? 'not-allowed' : 'pointer',
                                                        fontSize: '0.65rem',
                                                        color: '#22C55E',
                                                        transition: 'all 0.2s ease',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '3px',
                                                        opacity: actionLoading ? 0.6 : 1
                                                    }}
                                                >
                                                    <CheckCircle size={12} /> Mark Paid
                                                </button>
                                            )}
                                            {inv.status === 'paid' && (
                                                <button
                                                    onClick={() => updateInvoiceStatus(inv.id, 'pending')}
                                                    disabled={actionLoading}
                                                    style={{
                                                        padding: '4px 8px',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '6px',
                                                        background: 'transparent',
                                                        cursor: actionLoading ? 'not-allowed' : 'pointer',
                                                        fontSize: '0.65rem',
                                                        color: '#D97706',
                                                        transition: 'all 0.2s ease',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '3px',
                                                        opacity: actionLoading ? 0.6 : 1
                                                    }}
                                                >
                                                    <Clock size={12} /> Mark Pending
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openInvoiceDelete(inv)}
                                                style={{
                                                    padding: '4px 8px',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: '6px',
                                                    background: 'transparent',
                                                    cursor: 'pointer',
                                                    fontSize: '0.65rem',
                                                    color: 'var(--text-secondary)',
                                                    transition: 'all 0.2s ease',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '3px'
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
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    // ============================================================
    // ===== RENDER REPORTS TAB =====
    // ============================================================
    const renderReports = () => {
        const totalRevenue = invoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
        const paidRevenue = invoices.filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
        const pendingRevenue = invoices.filter(inv => inv.status === 'pending' || inv.status === 'unpaid')
            .reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

        return (
            <div style={{
                background: 'var(--card-bg)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid var(--border-color)'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    flexWrap: 'wrap',
                    gap: '10px'
                }}>
                    <h3 style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <TrendingUp size={20} style={{ color: '#8B5CF6' }} />
                        Pharmacy Reports
                    </h3>
                    <button
                        onClick={refreshAllData}
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
                            color: 'var(--text-secondary)',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--hover-bg)';
                            e.currentTarget.style.borderColor = 'var(--primary-color)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                        }}
                    >
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px',
                    marginBottom: '20px'
                }}>
                    <div style={{
                        padding: '16px',
                        background: 'var(--bg-primary)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Medicines</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {medicines.length}
                        </div>
                    </div>
                    <div style={{
                        padding: '16px',
                        background: 'var(--bg-primary)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Low Stock</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#D97706' }}>
                            {medicines.filter(m => m.stock > 0 && m.stock <= 20).length}
                        </div>
                    </div>
                    <div style={{
                        padding: '16px',
                        background: 'var(--bg-primary)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Dispensed</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                            {invoices.length}
                        </div>
                    </div>
                    <div style={{
                        padding: '16px',
                        background: 'var(--bg-primary)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Revenue</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#22C55E' }}>
                            Rs. {totalRevenue.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ============================================================
    // ===== VIEW INVOICE MODAL =====
    // ============================================================
    const renderInvoiceViewModal = () => {
        if (!isInvoiceViewOpen || !selectedInvoice) return null;

        const inv = selectedInvoice;
        const status = getInvoiceStatusBadge(inv.status);
        const total = parseFloat(inv.total) || 0;
        const items = inv.items || [];

        return (
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
                        setIsInvoiceViewOpen(false);
                        setSelectedInvoice(null);
                    }
                }}>
                <div style={{
                    background: 'var(--card-bg)',
                    borderRadius: '20px',
                    maxWidth: '600px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    padding: '28px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-color)'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
                        borderBottom: '2px solid var(--border-color)',
                        paddingBottom: '14px'
                    }}>
                        <h3 style={{
                            margin: 0,
                            fontSize: '1.2rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <Receipt size={20} style={{ color: 'var(--primary-color)' }} />
                            Invoice Details
                        </h3>
                        <button
                            onClick={() => {
                                setIsInvoiceViewOpen(false);
                                setSelectedInvoice(null);
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
                            onMouseEnter={(e) => {
                                e.target.style.background = 'var(--hover-bg)';
                                e.target.style.color = 'var(--danger-color)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'transparent';
                                e.target.style.color = 'var(--text-muted)';
                            }}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Invoice Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 16px',
                            background: 'var(--bg-primary)',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Invoice #</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{inv.invoice_number}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Date</div>
                                <div>{new Date(inv.created_at).toLocaleDateString()}</div>
                            </div>
                        </div>

                        {/* Patient Info */}
                        <div style={{
                            padding: '12px 16px',
                            background: 'var(--bg-primary)',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Patient</div>
                            <div style={{ fontWeight: 600 }}>{inv.patients?.name || inv.patient_name || 'Unknown'}</div>
                            {inv.patient_phone && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    📞 {inv.patient_phone}
                                </div>
                            )}
                        </div>

                        {/* Items */}
                        {items && items.length > 0 && (
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                                    Items ({items.length})
                                </div>
                                <div style={{
                                    background: 'var(--bg-primary)',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)',
                                    padding: '8px'
                                }}>
                                    {items.map((item, idx) => (
                                        <div key={idx} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '6px 8px',
                                            borderBottom: idx < items.length - 1 ? '1px solid var(--border-color)' : 'none',
                                            fontSize: '0.8rem'
                                        }}>
                                            <span>{item.medicine_name} x {item.quantity}</span>
                                            <span>Rs. {(parseFloat(item.total) || 0).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Totals */}
                        <div style={{
                            padding: '12px 16px',
                            background: 'var(--bg-primary)',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
                                <span>Rs. {(parseFloat(inv.subtotal) || 0).toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Tax:</span>
                                <span>Rs. {(parseFloat(inv.tax_amount) || 0).toFixed(2)}</span>
                            </div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                borderTop: '2px solid var(--border-color)',
                                paddingTop: '8px',
                                marginTop: '4px',
                                color: 'var(--text-primary)'
                            }}>
                                <span>Total:</span>
                                <span style={{ color: 'var(--primary-color)' }}>Rs. {total.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Payment Status */}
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: '10px',
                            border: `2px solid ${status.text}30`,
                            background: status.bg,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Payment Status</span>
                            <span style={{
                                padding: '4px 14px',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                color: status.text,
                                background: 'white'
                            }}>
                                {status.icon} {inv.status || 'pending'}
                            </span>
                        </div>

                        {/* Payment Method */}
                        {inv.payment_method && (
                            <div style={{
                                padding: '12px 16px',
                                background: 'var(--bg-primary)',
                                borderRadius: '10px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Payment Method</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 500, textTransform: 'capitalize' }}>
                                    {inv.payment_method}
                                </div>
                            </div>
                        )}

                        {inv.notes && (
                            <div style={{
                                padding: '12px 16px',
                                background: 'var(--bg-primary)',
                                borderRadius: '10px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Notes</div>
                                <div style={{ fontSize: '0.85rem' }}>{inv.notes}</div>
                            </div>
                        )}

                        {/* Actions */}
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            marginTop: '8px',
                            justifyContent: 'flex-end'
                        }}>
                            <button
                                onClick={() => {
                                    setIsInvoiceViewOpen(false);
                                    openInvoiceEdit(inv);
                                }}
                                style={{
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderRadius: '10px',
                                    background: 'var(--secondary-color)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#16A34A';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'var(--secondary-color)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <Edit2 size={16} /> Edit
                            </button>
                            <button
                                onClick={() => {
                                    setIsInvoiceViewOpen(false);
                                    setSelectedInvoice(null);
                                }}
                                style={{
                                    padding: '8px 16px',
                                    border: '1.5px solid var(--border-color)',
                                    borderRadius: '10px',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    color: 'var(--text-secondary)',
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
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ============================================================
    // ===== EDIT INVOICE MODAL =====
    // ============================================================
    const renderInvoiceEditModal = () => {
        if (!isInvoiceEditOpen || !selectedInvoice) return null;

        return (
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
                        setIsInvoiceEditOpen(false);
                        setSelectedInvoice(null);
                        resetInvoiceEditForm();
                    }
                }}>
                <div style={{
                    background: 'var(--card-bg)',
                    borderRadius: '20px',
                    maxWidth: '500px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    padding: '28px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-color)'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
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
                            Edit Invoice - {selectedInvoice.invoice_number}
                        </h3>
                        <button
                            onClick={() => {
                                setIsInvoiceEditOpen(false);
                                setSelectedInvoice(null);
                                resetInvoiceEditForm();
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
                            onMouseEnter={(e) => {
                                e.target.style.background = 'var(--hover-bg)';
                                e.target.style.color = 'var(--danger-color)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'transparent';
                                e.target.style.color = 'var(--text-muted)';
                            }}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleInvoiceEditSubmit}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Patient Name *
                                </label>
                                <input
                                    type="text"
                                    name="patient_name"
                                    value={invoiceEditData.patient_name}
                                    onChange={handleInvoiceEditChange}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Phone
                                </label>
                                <input
                                    type="text"
                                    name="patient_phone"
                                    value={invoiceEditData.patient_phone}
                                    onChange={handleInvoiceEditChange}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        Invoice Date *
                                    </label>
                                    <input
                                        type="date"
                                        name="invoice_date"
                                        value={invoiceEditData.invoice_date}
                                        onChange={handleInvoiceEditChange}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            fontSize: '0.9rem',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            transition: 'all 0.2s ease'
                                        }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        Due Date
                                    </label>
                                    <input
                                        type="date"
                                        name="due_date"
                                        value={invoiceEditData.due_date}
                                        onChange={handleInvoiceEditChange}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            fontSize: '0.9rem',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            transition: 'all 0.2s ease'
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Total Amount (Rs.) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="total"
                                    value={invoiceEditData.total}
                                    onChange={handleInvoiceEditChange}
                                    placeholder="0.00"
                                    min="0"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        Status *
                                    </label>
                                    <select
                                        name="status"
                                        value={invoiceEditData.status}
                                        onChange={handleInvoiceEditChange}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            fontSize: '0.9rem',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            appearance: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                        <option value="unpaid">Unpaid</option>
                                        <option value="partial">Partial</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="refunded">Refunded</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        Payment Method
                                    </label>
                                    <select
                                        name="payment_method"
                                        value={invoiceEditData.payment_method}
                                        onChange={handleInvoiceEditChange}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            fontSize: '0.9rem',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            appearance: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="card">Card</option>
                                        <option value="insurance">Insurance</option>
                                        <option value="online">Online</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Notes
                                </label>
                                <textarea
                                    name="notes"
                                    value={invoiceEditData.notes}
                                    onChange={handleInvoiceEditChange}
                                    placeholder="Additional notes..."
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        resize: 'vertical',
                                        fontFamily: 'inherit',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '10px',
                            marginTop: '24px',
                            paddingTop: '16px',
                            borderTop: '2px solid var(--border-color)'
                        }}>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsInvoiceEditOpen(false);
                                    setSelectedInvoice(null);
                                    resetInvoiceEditForm();
                                }}
                                style={{
                                    padding: '10px 24px',
                                    border: '1.5px solid var(--border-color)',
                                    borderRadius: '10px',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'var(--text-secondary)',
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
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={actionLoading}
                                style={{
                                    padding: '10px 28px',
                                    border: 'none',
                                    borderRadius: '10px',
                                    background: actionLoading ? 'var(--secondary-color)70' : 'var(--secondary-color)',
                                    color: 'white',
                                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.9rem',
                                    fontFamily: 'var(--font-family)',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    opacity: actionLoading ? 0.7 : 1,
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    if (!actionLoading) {
                                        e.currentTarget.style.background = '#16A34A';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(34,197,94,0.3)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!actionLoading) {
                                        e.currentTarget.style.background = 'var(--secondary-color)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }
                                }}
                            >
                                {actionLoading ? (
                                    <>
                                        <Loader size={18} className="spinner" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Update Invoice
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    // ============================================================
    // ===== DELETE INVOICE MODAL =====
    // ============================================================
    const renderInvoiceDeleteModal = () => {
        if (!isInvoiceDeleteOpen || !selectedInvoice) return null;

        return (
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
                        setIsInvoiceDeleteOpen(false);
                        setSelectedInvoice(null);
                    }
                }}>
                <div style={{
                    background: 'var(--card-bg)',
                    borderRadius: '20px',
                    maxWidth: '420px',
                    width: '100%',
                    padding: '28px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-color)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚠️</div>
                    <h3 style={{
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: '8px'
                    }}>
                        Delete Invoice
                    </h3>
                    <p style={{
                        fontSize: '0.9rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '4px'
                    }}>
                        Are you sure you want to delete invoice <strong>{selectedInvoice.invoice_number}</strong>?
                    </p>
                    <p style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        marginBottom: '16px'
                    }}>
                        This will also delete all associated items. This action cannot be undone.
                    </p>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button
                            onClick={() => {
                                setIsInvoiceDeleteOpen(false);
                                setSelectedInvoice(null);
                            }}
                            style={{
                                padding: '10px 24px',
                                border: '1.5px solid var(--border-color)',
                                borderRadius: '10px',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontFamily: 'var(--font-family)',
                                color: 'var(--text-secondary)',
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
                            Cancel
                        </button>
                        <button
                            onClick={handleInvoiceDeleteSubmit}
                            disabled={actionLoading}
                            style={{
                                padding: '10px 28px',
                                border: 'none',
                                borderRadius: '10px',
                                background: actionLoading ? 'var(--danger-color)70' : 'var(--danger-color)',
                                color: 'white',
                                cursor: actionLoading ? 'not-allowed' : 'pointer',
                                fontSize: '0.9rem',
                                fontFamily: 'var(--font-family)',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                opacity: actionLoading ? 0.7 : 1,
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                if (!actionLoading) {
                                    e.currentTarget.style.background = '#DC2626';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(239,68,68,0.3)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!actionLoading) {
                                    e.currentTarget.style.background = 'var(--danger-color)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }
                            }}
                        >
                            {actionLoading ? (
                                <>
                                    <Loader size={18} className="spinner" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 size={18} />
                                    Delete Permanently
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ============================================================
    // ===== VIEW MEDICINE MODAL =====
    // ============================================================
    const renderViewModal = () => {
        if (!isViewOpen || !selectedMed) return null;

        const status = getStatusBadge(selectedMed);
        const stock = parseInt(selectedMed.stock) || 0;
        const price = parseFloat(selectedMed.selling_price || selectedMed.price || 0);
        const isExpired = selectedMed.expiry_date && new Date(selectedMed.expiry_date) < new Date();

        return (
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
                    if (e.target === e.currentTarget) setIsViewOpen(false);
                }}>
                <div style={{
                    background: 'var(--card-bg)',
                    borderRadius: '20px',
                    maxWidth: '600px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    padding: '28px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-color)'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
                        borderBottom: '2px solid var(--border-color)',
                        paddingBottom: '14px'
                    }}>
                        <h3 style={{
                            margin: 0,
                            fontSize: '1.2rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <Eye size={20} style={{ color: 'var(--primary-color)' }} />
                            Medicine Details
                        </h3>
                        <button
                            onClick={() => setIsViewOpen(false)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                padding: '4px',
                                borderRadius: '6px',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = 'var(--hover-bg)';
                                e.target.style.color = 'var(--danger-color)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'transparent';
                                e.target.style.color = 'var(--text-muted)';
                            }}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '16px',
                            background: 'var(--bg-primary)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '14px',
                                background: 'var(--primary-color)15',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Pill size={28} style={{ color: 'var(--primary-color)' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {selectedMed.medicine_name}
                                </div>
                                {selectedMed.generic_name && (
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        {selectedMed.generic_name}
                                        {selectedMed.strength && ` • ${selectedMed.strength}`}
                                    </div>
                                )}
                                <div style={{ marginTop: '4px' }}>
                                    <span style={{
                                        padding: '2px 12px',
                                        borderRadius: '20px',
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                        background: status.bg,
                                        color: status.color,
                                        border: `1px solid ${status.color}30`
                                    }}>
                                        {status.icon} {status.label}
                                    </span>
                                    {isExpired && (
                                        <span style={{
                                            padding: '2px 12px',
                                            borderRadius: '20px',
                                            fontSize: '0.65rem',
                                            fontWeight: 600,
                                            background: '#FEE2E2',
                                            color: '#DC2626',
                                            marginLeft: '8px'
                                        }}>
                                            ⚠️ EXPIRED
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '10px'
                        }}>
                            <div style={{
                                padding: '10px 14px',
                                background: 'var(--bg-primary)',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Category</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                    {selectedMed.category || 'N/A'}
                                </div>
                            </div>
                            <div style={{
                                padding: '10px 14px',
                                background: 'var(--bg-primary)',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dosage Form</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                    {selectedMed.dosage_form || 'N/A'}
                                </div>
                            </div>
                            <div style={{
                                padding: '10px 14px',
                                background: 'var(--bg-primary)',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Stock</div>
                                <div style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    color: stock <= 5 ? 'var(--danger-color)' : stock <= 20 ? '#D97706' : 'var(--text-primary)'
                                }}>
                                    {stock} units
                                </div>
                            </div>
                            <div style={{
                                padding: '10px 14px',
                                background: 'var(--bg-primary)',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Selling Price</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    Rs. {price.toFixed(2)}
                                </div>
                            </div>
                            {selectedMed.manufacturer && (
                                <div style={{
                                    padding: '10px 14px',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Manufacturer</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                        {selectedMed.manufacturer}
                                    </div>
                                </div>
                            )}
                            {selectedMed.supplier && (
                                <div style={{
                                    padding: '10px 14px',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Supplier</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                        {selectedMed.supplier}
                                    </div>
                                </div>
                            )}
                            {selectedMed.batch_number && (
                                <div style={{
                                    padding: '10px 14px',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Batch Number</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                        {selectedMed.batch_number}
                                    </div>
                                </div>
                            )}
                            {selectedMed.expiry_date && (
                                <div style={{
                                    padding: '10px 14px',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Expiry Date</div>
                                    <div style={{
                                        fontSize: '0.85rem',
                                        fontWeight: 500,
                                        color: isExpired ? 'var(--danger-color)' : 'var(--text-primary)'
                                    }}>
                                        {new Date(selectedMed.expiry_date).toLocaleDateString()}
                                        {isExpired && <span style={{ fontSize: '0.7rem', color: 'var(--danger-color)', marginLeft: '6px' }}>⚠️ EXPIRED</span>}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => { setIsViewOpen(false); openRestock(selectedMed); }}
                                style={{
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderRadius: '10px',
                                    background: '#8B5CF6',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-family)',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#7C3AED';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#8B5CF6';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <PackageOpen size={16} /> Restock
                            </button>
                            <button
                                onClick={() => { setIsViewOpen(false); openEdit(selectedMed); }}
                                style={{
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderRadius: '10px',
                                    background: 'var(--secondary-color)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-family)',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#16A34A';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'var(--secondary-color)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <Edit2 size={16} /> Edit
                            </button>
                            <button
                                onClick={() => setIsViewOpen(false)}
                                style={{
                                    padding: '8px 16px',
                                    border: '1.5px solid var(--border-color)',
                                    borderRadius: '10px',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'var(--text-secondary)',
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
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ============================================================
    // ===== RESTOCK MODAL =====
    // ============================================================
    const renderRestockModal = () => {
        if (!isRestockOpen || !selectedMed) return null;

        return (
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
                    if (e.target === e.currentTarget) setIsRestockOpen(false);
                }}>
                <div style={{
                    background: 'var(--card-bg)',
                    borderRadius: '20px',
                    maxWidth: '450px',
                    width: '100%',
                    padding: '28px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-color)'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
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
                            <PackageOpen size={20} style={{ color: '#8B5CF6' }} />
                            Restock Medicine
                        </h3>
                        <button
                            onClick={() => setIsRestockOpen(false)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                padding: '4px',
                                borderRadius: '6px',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = 'var(--hover-bg)';
                                e.target.style.color = 'var(--danger-color)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'transparent';
                                e.target.style.color = 'var(--text-muted)';
                            }}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleRestockSubmit}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{
                                padding: '12px 16px',
                                background: 'var(--bg-primary)',
                                borderRadius: '10px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {selectedMed.medicine_name}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Current Stock: <strong>{selectedMed.stock || 0}</strong> units
                                </div>
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Quantity to Add *
                                </label>
                                <input
                                    type="number"
                                    value={restockQty}
                                    onChange={handleRestockChange}
                                    placeholder="Enter quantity"
                                    min="1"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Note (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={restockNote}
                                    onChange={(e) => setRestockNote(e.target.value)}
                                    placeholder="e.g. Regular restock"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                            </div>

                            {restockQty && parseInt(restockQty) > 0 && (
                                <div style={{
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    background: '#DCFCE7',
                                    border: '1px solid #16A34A30',
                                    fontSize: '0.8rem',
                                    color: '#16A34A'
                                }}>
                                    New Total: {parseInt(selectedMed.stock) + parseInt(restockQty)} units
                                </div>
                            )}
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '10px',
                            marginTop: '24px',
                            paddingTop: '16px',
                            borderTop: '2px solid var(--border-color)'
                        }}>
                            <button
                                type="button"
                                onClick={() => setIsRestockOpen(false)}
                                style={{
                                    padding: '10px 24px',
                                    border: '1.5px solid var(--border-color)',
                                    borderRadius: '10px',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'var(--text-secondary)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={actionLoading}
                                style={{
                                    padding: '10px 28px',
                                    border: 'none',
                                    borderRadius: '10px',
                                    background: actionLoading ? '#8B5CF670' : '#8B5CF6',
                                    color: 'white',
                                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.9rem',
                                    fontFamily: 'var(--font-family)',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    opacity: actionLoading ? 0.7 : 1,
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {actionLoading ? (
                                    <>
                                        <Loader size={18} className="spinner" />
                                        Restocking...
                                    </>
                                ) : (
                                    <>
                                        <PackageOpen size={18} />
                                        Confirm Restock
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    // ============================================================
    // ===== DELETE MEDICINE MODAL =====
    // ============================================================
    const renderDeleteModal = () => {
        if (!isDeleteOpen || !selectedMed) return null;

        return (
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
                    if (e.target === e.currentTarget) setIsDeleteOpen(false);
                }}>
                <div style={{
                    background: 'var(--card-bg)',
                    borderRadius: '20px',
                    maxWidth: '420px',
                    width: '100%',
                    padding: '28px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-color)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚠️</div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                        Delete Medicine
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Are you sure you want to delete <strong>{selectedMed.medicine_name}</strong>?
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                        This action cannot be undone.
                    </p>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button
                            onClick={() => setIsDeleteOpen(false)}
                            style={{
                                padding: '10px 24px',
                                border: '1.5px solid var(--border-color)',
                                borderRadius: '10px',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontFamily: 'var(--font-family)',
                                color: 'var(--text-secondary)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteSubmit}
                            disabled={actionLoading}
                            style={{
                                padding: '10px 28px',
                                border: 'none',
                                borderRadius: '10px',
                                background: actionLoading ? 'var(--danger-color)70' : 'var(--danger-color)',
                                color: 'white',
                                cursor: actionLoading ? 'not-allowed' : 'pointer',
                                fontSize: '0.9rem',
                                fontFamily: 'var(--font-family)',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                opacity: actionLoading ? 0.7 : 1,
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {actionLoading ? (
                                <>
                                    <Loader size={18} className="spinner" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 size={18} />
                                    Delete Permanently
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ============================================================
    // ===== EDIT MEDICINE MODAL =====
    // ============================================================
    const renderEditModal = () => {
        if (!isEditOpen || !selectedMed) return null;

        return (
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
                    if (e.target === e.currentTarget) setIsEditOpen(false);
                }}>
                <div style={{
                    background: 'var(--card-bg)',
                    borderRadius: '20px',
                    maxWidth: '750px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    padding: '28px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-color)'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
                        borderBottom: '2px solid var(--border-color)',
                        paddingBottom: '14px'
                    }}>
                        <h3 style={{
                            margin: 0,
                            fontSize: '1.2rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <Edit2 size={20} style={{ color: 'var(--secondary-color)' }} />
                            Edit Medicine
                        </h3>
                        <button
                            onClick={() => setIsEditOpen(false)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                padding: '4px',
                                borderRadius: '6px',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = 'var(--hover-bg)';
                                e.target.style.color = 'var(--danger-color)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'transparent';
                                e.target.style.color = 'var(--text-muted)';
                            }}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleEditSubmit}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '16px'
                        }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <h4 style={{
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    borderBottom: '1px solid var(--border-color)',
                                    paddingBottom: '8px'
                                }}>
                                    <FileText size={14} style={{ color: 'var(--primary-color)' }} />
                                    Basic Information
                                </h4>
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Medicine Name *
                                </label>
                                <input
                                    type="text"
                                    name="medicine_name"
                                    value={formData.medicine_name}
                                    onChange={handleFormChange}
                                    placeholder="e.g. Panadol 500mg"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: formErrors.medicine_name ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                                {formErrors.medicine_name && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--danger-color)' }}>
                                        {formErrors.medicine_name}
                                    </span>
                                )}
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Generic Name *
                                </label>
                                <input
                                    type="text"
                                    name="generic_name"
                                    value={formData.generic_name}
                                    onChange={handleFormChange}
                                    placeholder="e.g. Paracetamol"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: formErrors.generic_name ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                                {formErrors.generic_name && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--danger-color)' }}>
                                        {formErrors.generic_name}
                                    </span>
                                )}
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Category *
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleFormChange}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: formErrors.category ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        appearance: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                {formErrors.category && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--danger-color)' }}>
                                        {formErrors.category}
                                    </span>
                                )}
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Manufacturer
                                </label>
                                <input
                                    type="text"
                                    name="manufacturer"
                                    value={formData.manufacturer}
                                    onChange={handleFormChange}
                                    placeholder="e.g. GSK, Pfizer"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Supplier
                                </label>
                                <input
                                    type="text"
                                    name="supplier"
                                    value={formData.supplier}
                                    onChange={handleFormChange}
                                    placeholder="e.g. Subhan Care Distributors"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Batch Number *
                                </label>
                                <input
                                    type="text"
                                    name="batch_number"
                                    value={formData.batch_number}
                                    onChange={handleFormChange}
                                    placeholder="e.g. BATCH-2024-001"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: formErrors.batch_number ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                                {formErrors.batch_number && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--danger-color)' }}>
                                        {formErrors.batch_number}
                                    </span>
                                )}
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Expiry Date *
                                </label>
                                <input
                                    type="date"
                                    name="expiry_date"
                                    value={formData.expiry_date}
                                    onChange={handleFormChange}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: formErrors.expiry_date ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                                {formErrors.expiry_date && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--danger-color)' }}>
                                        {formErrors.expiry_date}
                                    </span>
                                )}
                            </div>

                            <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                                <h4 style={{
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    borderBottom: '1px solid var(--border-color)',
                                    paddingBottom: '8px'
                                }}>
                                    <Activity size={14} style={{ color: 'var(--secondary-color)' }} />
                                    Dosage & Strength
                                </h4>
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Dosage Form *
                                </label>
                                <select
                                    name="dosage_form"
                                    value={formData.dosage_form}
                                    onChange={handleFormChange}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: formErrors.dosage_form ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        appearance: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="">Select Dosage Form</option>
                                    {dosageForms.map(form => (
                                        <option key={form} value={form}>{form}</option>
                                    ))}
                                </select>
                                {formErrors.dosage_form && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--danger-color)' }}>
                                        {formErrors.dosage_form}
                                    </span>
                                )}
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Strength
                                </label>
                                <input
                                    type="text"
                                    name="strength"
                                    value={formData.strength}
                                    onChange={handleFormChange}
                                    placeholder="e.g. 500mg, 10mg/ml"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Unit *
                                </label>
                                <select
                                    name="unit"
                                    value={formData.unit}
                                    onChange={handleFormChange}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: formErrors.unit ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        appearance: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="">Select Unit</option>
                                    {units.map(u => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </select>
                                {formErrors.unit && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--danger-color)' }}>
                                        {formErrors.unit}
                                    </span>
                                )}
                            </div>

                            <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                                <h4 style={{
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    borderBottom: '1px solid var(--border-color)',
                                    paddingBottom: '8px'
                                }}>
                                    <Package size={14} style={{ color: '#8B5CF6' }} />
                                    Stock & Pricing
                                </h4>
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Current Stock *
                                </label>
                                <input
                                    type="number"
                                    name="stock"
                                    value={formData.stock}
                                    onChange={handleFormChange}
                                    placeholder="0"
                                    min="0"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: formErrors.stock ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                                {formErrors.stock && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--danger-color)' }}>
                                        {formErrors.stock}
                                    </span>
                                )}
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Minimum Stock Level
                                </label>
                                <input
                                    type="number"
                                    name="min_stock"
                                    value={formData.min_stock}
                                    onChange={handleFormChange}
                                    placeholder="10"
                                    min="0"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Maximum Stock Level
                                </label>
                                <input
                                    type="number"
                                    name="max_stock"
                                    value={formData.max_stock}
                                    onChange={handleFormChange}
                                    placeholder="100"
                                    min="0"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Reorder Level
                                </label>
                                <input
                                    type="number"
                                    name="reorder_level"
                                    value={formData.reorder_level}
                                    onChange={handleFormChange}
                                    placeholder="5"
                                    min="0"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Purchase Price (Rs.)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="purchase_price"
                                    value={formData.purchase_price}
                                    onChange={handleFormChange}
                                    placeholder="0.00"
                                    min="0"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Selling Price (Rs.) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="selling_price"
                                    value={formData.selling_price}
                                    onChange={handleFormChange}
                                    placeholder="0.00"
                                    min="0"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: formErrors.selling_price ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                                {formErrors.selling_price && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--danger-color)' }}>
                                        {formErrors.selling_price}
                                    </span>
                                )}
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Discount (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="discount_percent"
                                    value={formData.discount_percent}
                                    onChange={handleFormChange}
                                    placeholder="0"
                                    min="0"
                                    max="100"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                            </div>

                            <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                                <h4 style={{
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    borderBottom: '1px solid var(--border-color)',
                                    paddingBottom: '8px'
                                }}>
                                    <Clipboard size={14} style={{ color: '#14B8A6' }} />
                                    Additional Information
                                </h4>
                            </div>

                            <div style={{ gridColumn: '1 / -1' }}>
                                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '0.85rem',
                                        color: 'var(--text-secondary)',
                                        cursor: 'pointer'
                                    }}>
                                        <input
                                            type="checkbox"
                                            name="requires_prescription"
                                            checked={formData.requires_prescription}
                                            onChange={handleFormChange}
                                            style={{
                                                width: '18px',
                                                height: '18px',
                                                accentColor: 'var(--primary-color)',
                                                cursor: 'pointer'
                                            }}
                                        />
                                        Requires Prescription
                                    </label>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '0.85rem',
                                        color: 'var(--text-secondary)',
                                        cursor: 'pointer'
                                    }}>
                                        <input
                                            type="checkbox"
                                            name="is_controlled"
                                            checked={formData.is_controlled}
                                            onChange={handleFormChange}
                                            style={{
                                                width: '18px',
                                                height: '18px',
                                                accentColor: 'var(--danger-color)',
                                                cursor: 'pointer'
                                            }}
                                        />
                                        Controlled Substance
                                    </label>
                                </div>
                            </div>

                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Storage Conditions
                                </label>
                                <textarea
                                    name="storage_conditions"
                                    value={formData.storage_conditions}
                                    onChange={handleFormChange}
                                    placeholder="e.g. Store below 25°C, Protect from light"
                                    rows={2}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        resize: 'vertical',
                                        fontFamily: 'inherit',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                            </div>

                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Notes
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleFormChange}
                                    placeholder="Any additional notes about this medicine"
                                    rows={2}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        resize: 'vertical',
                                        fontFamily: 'inherit',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Status
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleFormChange}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        appearance: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="discontinued">Discontinued</option>
                                </select>
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '10px',
                            marginTop: '24px',
                            paddingTop: '16px',
                            borderTop: '2px solid var(--border-color)'
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
                                    fontSize: '0.9rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'var(--text-secondary)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={actionLoading}
                                style={{
                                    padding: '10px 28px',
                                    border: 'none',
                                    borderRadius: '10px',
                                    background: actionLoading ? 'var(--secondary-color)70' : 'var(--secondary-color)',
                                    color: 'white',
                                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.9rem',
                                    fontFamily: 'var(--font-family)',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    opacity: actionLoading ? 0.7 : 1,
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {actionLoading ? (
                                    <>
                                        <Loader size={18} className="spinner" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Update Medicine
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    // ============================================================
    // ===== ADD MEDICINE MODAL =====
    // ============================================================
    const renderAddModal = () => {
        if (!isAddOpen) return null;

        return (
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
                    if (e.target === e.currentTarget) setIsAddOpen(false);
                }}>
                <div style={{
                    background: 'var(--card-bg)',
                    borderRadius: '20px',
                    maxWidth: '750px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    padding: '28px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-color)'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
                        borderBottom: '2px solid var(--border-color)',
                        paddingBottom: '14px'
                    }}>
                        <h3 style={{
                            margin: 0,
                            fontSize: '1.2rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <Package size={20} style={{ color: 'var(--primary-color)' }} />
                            Add New Medicine
                        </h3>
                        <button
                            onClick={() => setIsAddOpen(false)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                padding: '4px',
                                borderRadius: '6px',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = 'var(--hover-bg)';
                                e.target.style.color = 'var(--danger-color)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'transparent';
                                e.target.style.color = 'var(--text-muted)';
                            }}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleAddSubmit}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '16px'
                        }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <h4 style={{
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    borderBottom: '1px solid var(--border-color)',
                                    paddingBottom: '8px'
                                }}>
                                    <FileText size={14} style={{ color: 'var(--primary-color)' }} />
                                    Basic Information
                                </h4>
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Medicine Name *
                                </label>
                                <input
                                    type="text"
                                    name="medicine_name"
                                    value={formData.medicine_name}
                                    onChange={handleFormChange}
                                    placeholder="e.g. Panadol 500mg"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: formErrors.medicine_name ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                                {formErrors.medicine_name && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--danger-color)' }}>
                                        {formErrors.medicine_name}
                                    </span>
                                )}
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Generic Name *
                                </label>
                                <input
                                    type="text"
                                    name="generic_name"
                                    value={formData.generic_name}
                                    onChange={handleFormChange}
                                    placeholder="e.g. Paracetamol"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: formErrors.generic_name ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                                {formErrors.generic_name && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--danger-color)' }}>
                                        {formErrors.generic_name}
                                    </span>
                                )}
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Category *
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleFormChange}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: formErrors.category ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        appearance: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                {formErrors.category && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--danger-color)' }}>
                                        {formErrors.category}
                                    </span>
                                )}
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Manufacturer
                                </label>
                                <input
                                    type="text"
                                    name="manufacturer"
                                    value={formData.manufacturer}
                                    onChange={handleFormChange}
                                    placeholder="e.g. GSK, Pfizer"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Supplier
                                </label>
                                <input
                                    type="text"
                                    name="supplier"
                                    value={formData.supplier}
                                    onChange={handleFormChange}
                                    placeholder="e.g. Subhan Care Distributors"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Batch Number *
                                </label>
                                <input
                                    type="text"
                                    name="batch_number"
                                    value={formData.batch_number}
                                    onChange={handleFormChange}
                                    placeholder="e.g. BATCH-2024-001"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: formErrors.batch_number ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                                {formErrors.batch_number && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--danger-color)' }}>
                                        {formErrors.batch_number}
                                    </span>
                                )}
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Expiry Date *
                                </label>
                                <input
                                    type="date"
                                    name="expiry_date"
                                    value={formData.expiry_date}
                                    onChange={handleFormChange}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: formErrors.expiry_date ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                                {formErrors.expiry_date && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--danger-color)' }}>
                                        {formErrors.expiry_date}
                                    </span>
                                )}
                            </div>

                            <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                                <h4 style={{
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    borderBottom: '1px solid var(--border-color)',
                                    paddingBottom: '8px'
                                }}>
                                    <Activity size={14} style={{ color: 'var(--secondary-color)' }} />
                                    Dosage & Strength
                                </h4>
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Dosage Form *
                                </label>
                                <select
                                    name="dosage_form"
                                    value={formData.dosage_form}
                                    onChange={handleFormChange}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: formErrors.dosage_form ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        appearance: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="">Select Dosage Form</option>
                                    {dosageForms.map(form => (
                                        <option key={form} value={form}>{form}</option>
                                    ))}
                                </select>
                                {formErrors.dosage_form && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--danger-color)' }}>
                                        {formErrors.dosage_form}
                                    </span>
                                )}
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Strength
                                </label>
                                <input
                                    type="text"
                                    name="strength"
                                    value={formData.strength}
                                    onChange={handleFormChange}
                                    placeholder="e.g. 500mg, 10mg/ml"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Unit *
                                </label>
                                <select
                                    name="unit"
                                    value={formData.unit}
                                    onChange={handleFormChange}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: formErrors.unit ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        appearance: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="">Select Unit</option>
                                    {units.map(u => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </select>
                                {formErrors.unit && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--danger-color)' }}>
                                        {formErrors.unit}
                                    </span>
                                )}
                            </div>

                            <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                                <h4 style={{
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    borderBottom: '1px solid var(--border-color)',
                                    paddingBottom: '8px'
                                }}>
                                    <Package size={14} style={{ color: '#8B5CF6' }} />
                                    Stock & Pricing
                                </h4>
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Current Stock *
                                </label>
                                <input
                                    type="number"
                                    name="stock"
                                    value={formData.stock}
                                    onChange={handleFormChange}
                                    placeholder="0"
                                    min="0"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: formErrors.stock ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                                {formErrors.stock && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--danger-color)' }}>
                                        {formErrors.stock}
                                    </span>
                                )}
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Minimum Stock Level
                                </label>
                                <input
                                    type="number"
                                    name="min_stock"
                                    value={formData.min_stock}
                                    onChange={handleFormChange}
                                    placeholder="10"
                                    min="0"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Maximum Stock Level
                                </label>
                                <input
                                    type="number"
                                    name="max_stock"
                                    value={formData.max_stock}
                                    onChange={handleFormChange}
                                    placeholder="100"
                                    min="0"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Reorder Level
                                </label>
                                <input
                                    type="number"
                                    name="reorder_level"
                                    value={formData.reorder_level}
                                    onChange={handleFormChange}
                                    placeholder="5"
                                    min="0"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Purchase Price (Rs.)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="purchase_price"
                                    value={formData.purchase_price}
                                    onChange={handleFormChange}
                                    placeholder="0.00"
                                    min="0"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Selling Price (Rs.) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="selling_price"
                                    value={formData.selling_price}
                                    onChange={handleFormChange}
                                    placeholder="0.00"
                                    min="0"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: formErrors.selling_price ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                                {formErrors.selling_price && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--danger-color)' }}>
                                        {formErrors.selling_price}
                                    </span>
                                )}
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Discount (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="discount_percent"
                                    value={formData.discount_percent}
                                    onChange={handleFormChange}
                                    placeholder="0"
                                    min="0"
                                    max="100"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                            </div>

                            <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                                <h4 style={{
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    borderBottom: '1px solid var(--border-color)',
                                    paddingBottom: '8px'
                                }}>
                                    <Clipboard size={14} style={{ color: '#14B8A6' }} />
                                    Additional Information
                                </h4>
                            </div>

                            <div style={{ gridColumn: '1 / -1' }}>
                                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '0.85rem',
                                        color: 'var(--text-secondary)',
                                        cursor: 'pointer'
                                    }}>
                                        <input
                                            type="checkbox"
                                            name="requires_prescription"
                                            checked={formData.requires_prescription}
                                            onChange={handleFormChange}
                                            style={{
                                                width: '18px',
                                                height: '18px',
                                                accentColor: 'var(--primary-color)',
                                                cursor: 'pointer'
                                            }}
                                        />
                                        Requires Prescription
                                    </label>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '0.85rem',
                                        color: 'var(--text-secondary)',
                                        cursor: 'pointer'
                                    }}>
                                        <input
                                            type="checkbox"
                                            name="is_controlled"
                                            checked={formData.is_controlled}
                                            onChange={handleFormChange}
                                            style={{
                                                width: '18px',
                                                height: '18px',
                                                accentColor: 'var(--danger-color)',
                                                cursor: 'pointer'
                                            }}
                                        />
                                        Controlled Substance
                                    </label>
                                </div>
                            </div>

                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Storage Conditions
                                </label>
                                <textarea
                                    name="storage_conditions"
                                    value={formData.storage_conditions}
                                    onChange={handleFormChange}
                                    placeholder="e.g. Store below 25°C, Protect from light"
                                    rows={2}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        resize: 'vertical',
                                        fontFamily: 'inherit',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                            </div>

                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Notes
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleFormChange}
                                    placeholder="Any additional notes about this medicine"
                                    rows={2}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        resize: 'vertical',
                                        fontFamily: 'inherit',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    Status
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleFormChange}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        appearance: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="discontinued">Discontinued</option>
                                </select>
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '10px',
                            marginTop: '24px',
                            paddingTop: '16px',
                            borderTop: '2px solid var(--border-color)'
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
                                    fontSize: '0.9rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'var(--text-secondary)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={actionLoading}
                                style={{
                                    padding: '10px 28px',
                                    border: 'none',
                                    borderRadius: '10px',
                                    background: actionLoading ? 'var(--primary-color)70' : 'var(--primary-color)',
                                    color: 'white',
                                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.9rem',
                                    fontFamily: 'var(--font-family)',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    opacity: actionLoading ? 0.7 : 1,
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {actionLoading ? (
                                    <>
                                        <Loader size={18} className="spinner" />
                                        Adding...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Add Medicine
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    // ============================================================
    // ===== MAIN RETURN =====
    // ============================================================
    return (
        <DashboardLayout active="pharmacy" title="Pharmacy & Dispensary">
            {/* ===== TOAST ===== */}
            {toast.show && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: 10000,
                    animation: 'slideInRight 0.5s ease-out',
                    maxWidth: '450px',
                    width: '100%'
                }}>
                    <div style={{
                        padding: '16px 20px',
                        borderRadius: '12px',
                        background: toast.type === 'success' ? '#22C55E' : toast.type === 'warning' ? '#F59E0B' : '#EF4444',
                        color: 'white',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        {toast.type === 'success' ? <CheckCircle size={24} /> :
                            toast.type === 'warning' ? <AlertTriangle size={24} /> : <AlertCircle size={24} />}
                        <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500 }}>
                            {toast.message}
                        </div>
                        <button
                            onClick={() => setToast({ show: false, message: '', type: 'success' })}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                padding: '4px',
                                opacity: 0.8
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* ===== BACK BUTTON ===== */}
            <div style={{ marginBottom: '16px' }}>
                <button
                    onClick={() => window.history.back()}
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
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>
            </div>

            {/* ===== HEADER ===== */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
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
                        <Package size={24} style={{ color: 'var(--primary-color)' }} />
                        Pharmacy Management
                    </h1>
                    <p style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        marginTop: '4px'
                    }}>
                        Manage medicines inventory, dispense to patients, and track invoices
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                        onClick={refreshAllData}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '8px 14px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '10px',
                            background: 'var(--bg-primary)',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-family)',
                            color: 'var(--text-secondary)',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--hover-bg)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                            e.currentTarget.style.borderColor = 'var(--primary-color)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--bg-primary)';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                        }}
                    >
                        <RefreshCw size={14} /> Refresh
                    </button>

                    <button
                        onClick={() => { resetForm(); setIsAddOpen(true); }}
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
                            e.currentTarget.style.background = '#1D4ED8';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--primary-color)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <Plus size={16} /> Add Medicine
                    </button>
                </div>
            </div>

            {/* ===== TABS ===== */}
            <div style={{
                display: 'flex',
                gap: '4px',
                marginBottom: '20px',
                background: 'var(--card-bg)',
                padding: '4px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                overflowX: 'auto'
            }}>
                {[
                    { id: 'inventory', label: '📦 Inventory' },
                    { id: 'dispense', label: '💊 Dispense' },
                    { id: 'invoices', label: '🧾 Invoices' },
                    { id: 'reports', label: '📊 Reports' }
                ].map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '10px',
                                border: 'none',
                                background: isActive ? 'var(--primary-color)' : 'transparent',
                                color: isActive ? 'white' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontFamily: 'var(--font-family)',
                                fontWeight: isActive ? 600 : 400,
                                transition: 'all 0.2s ease',
                                whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.background = 'var(--hover-bg)';
                                    e.currentTarget.style.color = 'var(--text-primary)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                }
                            }}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* ===== TAB CONTENT ===== */}
            {activeTab === 'inventory' && renderInventory()}
            {activeTab === 'dispense' && renderDispense()}
            {activeTab === 'invoices' && renderInvoices()}
            {activeTab === 'reports' && renderReports()}

            {/* ===== MODALS ===== */}
            {renderAddModal()}
            {renderEditModal()}
            {renderViewModal()}
            {renderRestockModal()}
            {renderDeleteModal()}
            {renderInvoiceViewModal()}
            {renderInvoiceEditModal()}
            {renderInvoiceDeleteModal()}

            <style>{`
                .spinner {
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }

                @media (max-width: 768px) {
                    .grid-2-cols {
                        grid-template-columns: 1fr !important;
                    }
                    .stats-grid {
                        grid-template-columns: 1fr 1fr !important;
                    }
                }

                @media (max-width: 480px) {
                    .stats-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </DashboardLayout>
    );
};

export default Pharmacy;