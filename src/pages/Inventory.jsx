import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, Edit, X, PackageOpen, Package, ShoppingBag,
    AlertCircle, Check, Trash2, RefreshCw, Filter, Calendar,
    Download, FileText, FileSpreadsheet, FileJson, Printer,
    ChevronDown, Eye, Clock, DollarSign, Layers,
    Tag, Hash, MessageSquare, Save, RotateCcw,
    ArrowLeft, Loader, Clipboard, Truck, Box,
    TrendingUp, TrendingDown, Users, Warehouse,
    Receipt, CreditCard, Banknote, Building, Bell,
    History, Wallet, List, BarChart3, File, FileBox
} from 'lucide-react';

const Inventory = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // ===== STATE =====
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [stockMovements, setStockMovements] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState('newest');
    const [exporting, setExporting] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationType, setNotificationType] = useState('success');

    // ===== STATS =====
    const [stats, setStats] = useState({
        totalItems: 0,
        totalCategories: 0,
        totalSuppliers: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        totalValue: 0,
        mostUsedCategory: '',
        itemsAddedToday: 0,
        totalRestocks: 0,
        totalPayments: 0,
        pendingPayments: 0,
        totalPaidAmount: 0
    });

    // ===== MODAL STATES =====
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isRestockOpen, setIsRestockOpen] = useState(false);
    const [isSupplierOpen, setIsSupplierOpen] = useState(false);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [isLowStockOpen, setIsLowStockOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [selectedHistory, setSelectedHistory] = useState([]);

    // ===== FORM STATE =====
    const [formData, setFormData] = useState({
        item_name: '',
        category: '',
        description: '',
        quantity: '',
        minimum_quantity: 10,
        price: '',
        cost_price: '',
        supplier_id: '',
        location: '',
        batch_number: '',
        expiry_date: '',
        unit: 'pcs',
        reorder_point: 5,
        notes: ''
    });

    const [supplierForm, setSupplierForm] = useState({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        payment_terms: ''
    });

    const [categoryForm, setCategoryForm] = useState({
        name: '',
        description: '',
        color: '#3B82F6'
    });

    const [paymentForm, setPaymentForm] = useState({
        supplier_id: '',
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        reference: '',
        notes: '',
        status: 'paid'
    });

    const [restockQty, setRestockQty] = useState('');
    const [formErrors, setFormErrors] = useState({});
    const [actionLoading, setActionLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // ===== NOTIFICATION =====
    const showNotificationMessage = (message, type = 'success') => {
        setNotificationMessage(message);
        setNotificationType(type);
        setShowNotification(true);
        setTimeout(() => {
            setShowNotification(false);
        }, 3000);
    };

    // ===== RESPONSIVE =====
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ===== GO BACK =====
    const goBack = () => {
        navigate(-1);
    };

    // ===== LOAD DATA =====
    const loadInventory = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const { data: itemsData, error: itemsError } = await supabase
                .from('inventory')
                .select('*, suppliers:supplier_id(name, phone, email)')
                .order('created_at', { ascending: false });

            if (itemsError) {
                console.error('Error loading inventory:', itemsError);
                setErrorMsg('Failed to load inventory: ' + itemsError.message);
                setItems([]);
            } else {
                console.log('✅ Inventory loaded:', itemsData);
                setItems(itemsData || []);
                const lowStock = (itemsData || []).filter(item =>
                    item.quantity <= item.minimum_quantity && item.quantity > 0
                );
                setLowStockItems(lowStock);
                calculateStats(itemsData || []);
            }

            const { data: categoriesData, error: categoriesError } = await supabase
                .from('inventory_categories')
                .select('*')
                .order('name', { ascending: true });

            if (categoriesError) {
                console.error('Error loading categories:', categoriesError);
                const defaultCategories = [
                    { id: '1', name: 'Surgical Supplies', color: '#3B82F6' },
                    { id: '2', name: 'General Ward Materials', color: '#22C55E' },
                    { id: '3', name: 'Laboratory Chemicals', color: '#8B5CF6' },
                    { id: '4', name: 'Protective Gears', color: '#EF4444' },
                    { id: '5', name: 'Pharmaceuticals', color: '#EC4899' },
                    { id: '6', name: 'Medical Equipment', color: '#F59E0B' },
                    { id: '7', name: 'Stationery', color: '#6B7280' }
                ];
                setCategories(defaultCategories);
            } else {
                setCategories(categoriesData || []);
            }

            const { data: suppliersData, error: suppliersError } = await supabase
                .from('suppliers')
                .select('*')
                .order('name', { ascending: true });

            if (suppliersError) {
                console.error('Error loading suppliers:', suppliersError);
                setSuppliers([]);
            } else {
                setSuppliers(suppliersData || []);
            }

            const { data: movementsData, error: movementsError } = await supabase
                .from('stock_movements')
                .select('*, inventory:inventory_id(item_name, unit)')
                .order('created_at', { ascending: false })
                .limit(50);

            if (movementsError) {
                console.error('Error loading stock movements:', movementsError);
                setStockMovements([]);
            } else {
                setStockMovements(movementsData || []);
            }

            const { data: paymentsData, error: paymentsError } = await supabase
                .from('supplier_payments')
                .select('*, suppliers:supplier_id(name)')
                .order('created_at', { ascending: false });

            if (paymentsError) {
                console.error('Error loading payments:', paymentsError);
                setPayments([]);
            } else {
                setPayments(paymentsData || []);
            }

            setStats(prev => ({
                ...prev,
                totalCategories: categoriesData?.length || 7,
                totalSuppliers: suppliersData?.length || 0,
                totalRestocks: movementsData?.filter(m => m.movement_type === 'restock').length || 0,
                totalPayments: paymentsData?.filter(p => p.status === 'paid').length || 0,
                pendingPayments: paymentsData?.filter(p => p.status === 'pending').length || 0,
                totalPaidAmount: paymentsData?.filter(p => p.status === 'paid').reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0) || 0
            }));

        } catch (err) {
            console.error('Error loading data:', err);
            setErrorMsg('Failed to load data: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInventory();
    }, []);

    // ===== CALCULATE STATS =====
    const calculateStats = (data) => {
        const total = data.length;
        const lowStock = data.filter(item => item.quantity <= item.minimum_quantity && item.quantity > 0).length;
        const outOfStock = data.filter(item => item.quantity <= 0).length;
        const totalValue = data.reduce((acc, item) => acc + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0), 0);

        const categoryCount = {};
        data.forEach(item => {
            const cat = item.category || 'Uncategorized';
            categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        });
        const mostUsedCategory = Object.entries(categoryCount)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

        const today = new Date().toDateString();
        const todayItems = data.filter(item => {
            const createdDate = new Date(item.created_at).toDateString();
            return createdDate === today;
        }).length;

        setStats(prev => ({
            ...prev,
            totalItems: total,
            lowStockItems: lowStock,
            outOfStockItems: outOfStock,
            totalValue: totalValue,
            mostUsedCategory: mostUsedCategory,
            itemsAddedToday: todayItems
        }));
    };

    // ===== OPEN MODALS =====
    const openAddModal = () => {
        setFormData({
            item_name: '',
            category: '',
            description: '',
            quantity: '',
            minimum_quantity: 10,
            price: '',
            cost_price: '',
            supplier_id: '',
            location: '',
            batch_number: '',
            expiry_date: '',
            unit: 'pcs',
            reorder_point: 5,
            notes: ''
        });
        setFormErrors({});
        setErrorMsg('');
        setSuccessMsg('');
        setIsAddOpen(true);
    };

    const openEditModal = (item) => {
        setSelectedItem(item);
        setFormData({
            item_name: item.item_name || '',
            category: item.category || '',
            description: item.description || '',
            quantity: item.quantity || '',
            minimum_quantity: item.minimum_quantity || 10,
            price: item.price || '',
            cost_price: item.cost_price || '',
            supplier_id: item.supplier_id || '',
            location: item.location || '',
            batch_number: item.batch_number || '',
            expiry_date: item.expiry_date || '',
            unit: item.unit || 'pcs',
            reorder_point: item.reorder_point || 5,
            notes: item.notes || ''
        });
        setFormErrors({});
        setErrorMsg('');
        setSuccessMsg('');
        setIsEditOpen(true);
    };

    const openViewModal = (item) => {
        setSelectedItem(item);
        setIsViewOpen(true);
    };

    const openDeleteModal = (item) => {
        setSelectedItem(item);
        setIsDeleteOpen(true);
    };

    const openRestockModal = (item) => {
        setSelectedItem(item);
        setRestockQty('');
        setIsRestockOpen(true);
    };

    const openSupplierModal = () => {
        setSupplierForm({
            name: '',
            contact_person: '',
            phone: '',
            email: '',
            address: '',
            city: '',
            payment_terms: ''
        });
        setErrorMsg('');
        setSuccessMsg('');
        setIsSupplierOpen(true);
    };

    const openCategoryModal = () => {
        setCategoryForm({
            name: '',
            description: '',
            color: '#3B82F6'
        });
        setErrorMsg('');
        setSuccessMsg('');
        setIsCategoryOpen(true);
    };

    const openPaymentModal = (supplier) => {
        setSelectedSupplier(supplier);
        setPaymentForm({
            supplier_id: supplier?.id || '',
            amount: '',
            payment_date: new Date().toISOString().split('T')[0],
            payment_method: 'cash',
            reference: '',
            notes: '',
            status: 'paid'
        });
        setIsPaymentOpen(true);
    };

    const openReceiptModal = (payment) => {
        setSelectedPayment(payment);
        setIsReceiptOpen(true);
    };

    const openLowStockModal = () => {
        setIsLowStockOpen(true);
    };

    const openHistoryModal = (item) => {
        setSelectedItem(item);
        const itemHistory = stockMovements.filter(m => m.inventory_id === item.id);
        setSelectedHistory(itemHistory);
        setIsHistoryOpen(true);
    };

    const openPaymentHistoryModal = () => {
        setIsPaymentHistoryOpen(true);
    };

    // ===== HANDLE FORM CHANGE =====
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSupplierChange = (e) => {
        const { name, value } = e.target;
        setSupplierForm(prev => ({ ...prev, [name]: value }));
    };

    const handleCategoryChange = (e) => {
        const { name, value } = e.target;
        setCategoryForm(prev => ({ ...prev, [name]: value }));
    };

    const handlePaymentChange = (e) => {
        const { name, value } = e.target;
        setPaymentForm(prev => ({ ...prev, [name]: value }));
    };

    // ===== VALIDATE FORM =====
    const validateForm = () => {
        const errors = {};
        if (!formData.item_name.trim()) errors.item_name = 'Item name is required';
        if (!formData.category) errors.category = 'Please select a category';
        if (!formData.quantity || parseInt(formData.quantity) < 0) {
            errors.quantity = 'Please enter a valid quantity';
        }
        if (!formData.price || parseFloat(formData.price) < 0) {
            errors.price = 'Please enter a valid price';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // ===== CREATE ITEM =====
    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setActionLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const itemData = {
                item_name: formData.item_name.trim(),
                category: formData.category,
                description: formData.description || null,
                quantity: parseInt(formData.quantity) || 0,
                minimum_quantity: parseInt(formData.minimum_quantity) || 10,
                price: parseFloat(formData.price) || 0,
                cost_price: parseFloat(formData.cost_price) || 0,
                supplier_id: formData.supplier_id || null,
                location: formData.location || null,
                batch_number: formData.batch_number || null,
                expiry_date: formData.expiry_date || null,
                unit: formData.unit || 'pcs',
                reorder_point: parseInt(formData.reorder_point) || 5,
                notes: formData.notes || null,
                created_by: user?.id || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('inventory')
                .insert([itemData])
                .select();

            if (error) {
                console.error('Error adding item:', error);
                setErrorMsg('Failed to add item: ' + error.message);
                return;
            }

            console.log('✅ Item added:', data);
            setSuccessMsg('✅ Item added successfully!');
            showNotificationMessage('Item added successfully!', 'success');
            setIsAddOpen(false);
            await loadInventory();
            window.dispatchEvent(new Event('inventoryChanged'));

        } catch (err) {
            console.error('Error adding item:', err);
            setErrorMsg('Error adding item: ' + err.message);
            showNotificationMessage('Failed to add item', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // ===== UPDATE ITEM =====
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setActionLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const itemData = {
                item_name: formData.item_name.trim(),
                category: formData.category,
                description: formData.description || null,
                quantity: parseInt(formData.quantity) || 0,
                minimum_quantity: parseInt(formData.minimum_quantity) || 10,
                price: parseFloat(formData.price) || 0,
                cost_price: parseFloat(formData.cost_price) || 0,
                supplier_id: formData.supplier_id || null,
                location: formData.location || null,
                batch_number: formData.batch_number || null,
                expiry_date: formData.expiry_date || null,
                unit: formData.unit || 'pcs',
                reorder_point: parseInt(formData.reorder_point) || 5,
                notes: formData.notes || null,
                updated_by: user?.id || null,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('inventory')
                .update(itemData)
                .eq('id', selectedItem.id);

            if (error) {
                console.error('Error updating item:', error);
                setErrorMsg('Failed to update item: ' + error.message);
                return;
            }

            console.log('✅ Item updated');
            setSuccessMsg('✅ Item updated successfully!');
            showNotificationMessage('Item updated successfully!', 'success');
            setIsEditOpen(false);
            await loadInventory();
            window.dispatchEvent(new Event('inventoryChanged'));

        } catch (err) {
            console.error('Error updating item:', err);
            setErrorMsg('Error updating item: ' + err.message);
            showNotificationMessage('Failed to update item', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // ===== RESTOCK ITEM =====
    const handleRestockSubmit = async (e) => {
        e.preventDefault();
        if (!restockQty || parseInt(restockQty) <= 0) {
            setErrorMsg('Please enter a quantity greater than zero');
            return;
        }
        setActionLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const newQty = (parseInt(selectedItem.quantity) || 0) + parseInt(restockQty);

            const { error } = await supabase
                .from('inventory')
                .update({
                    quantity: newQty,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedItem.id);

            if (error) {
                console.error('Error restocking:', error);
                setErrorMsg('Failed to restock: ' + error.message);
                return;
            }

            await supabase
                .from('stock_movements')
                .insert([{
                    inventory_id: selectedItem.id,
                    movement_type: 'restock',
                    quantity: parseInt(restockQty),
                    previous_quantity: parseInt(selectedItem.quantity) || 0,
                    new_quantity: newQty,
                    reason: `Restocked ${restockQty} units`,
                    performed_by: user?.id || null,
                    created_at: new Date().toISOString()
                }]);

            console.log('✅ Restocked successfully');
            setSuccessMsg('✅ Restocked successfully!');
            showNotificationMessage(`Restocked ${restockQty} units successfully!`, 'success');
            setIsRestockOpen(false);
            await loadInventory();
            window.dispatchEvent(new Event('inventoryChanged'));

        } catch (err) {
            console.error('Error restocking:', err);
            setErrorMsg('Error restocking: ' + err.message);
            showNotificationMessage('Failed to restock', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // ===== DELETE ITEM =====
    const handleDeleteSubmit = async () => {
        setActionLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const { error } = await supabase
                .from('inventory')
                .delete()
                .eq('id', selectedItem.id);

            if (error) {
                console.error('Error deleting item:', error);
                setErrorMsg('Failed to delete item: ' + error.message);
                return;
            }

            console.log('✅ Item deleted');
            setSuccessMsg('✅ Item deleted successfully!');
            showNotificationMessage('Item deleted successfully!', 'success');
            setIsDeleteOpen(false);
            await loadInventory();
            window.dispatchEvent(new Event('inventoryChanged'));

        } catch (err) {
            console.error('Error deleting item:', err);
            setErrorMsg('Error deleting item: ' + err.message);
            showNotificationMessage('Failed to delete item', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // ===== CREATE SUPPLIER =====
    const handleSupplierSubmit = async (e) => {
        e.preventDefault();
        if (!supplierForm.name.trim()) {
            setErrorMsg('Supplier name is required');
            showNotificationMessage('Supplier name is required', 'error');
            return;
        }
        setActionLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const { data: existingSupplier } = await supabase
                .from('suppliers')
                .select('id, name')
                .eq('name', supplierForm.name.trim())
                .maybeSingle();

            if (existingSupplier) {
                setErrorMsg(`Supplier "${supplierForm.name}" already exists!`);
                showNotificationMessage(`Supplier "${supplierForm.name}" already exists!`, 'error');
                setActionLoading(false);
                return;
            }

            const supplierData = {
                name: supplierForm.name.trim(),
                contact_person: supplierForm.contact_person || null,
                phone: supplierForm.phone || null,
                email: supplierForm.email || null,
                address: supplierForm.address || null,
                city: supplierForm.city || null,
                payment_terms: supplierForm.payment_terms || null,
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('suppliers')
                .insert([supplierData])
                .select();

            if (error) {
                console.error('Error adding supplier:', error);
                setErrorMsg('Failed to add supplier: ' + error.message);
                showNotificationMessage('Failed to add supplier', 'error');
                return;
            }

            console.log('✅ Supplier added:', data);
            setSuccessMsg('✅ Supplier added successfully!');
            showNotificationMessage(`Supplier "${supplierForm.name}" added successfully! 🎉`, 'success');
            setIsSupplierOpen(false);
            setSupplierForm({
                name: '',
                contact_person: '',
                phone: '',
                email: '',
                address: '',
                city: '',
                payment_terms: ''
            });
            await loadInventory();

        } catch (err) {
            console.error('Error adding supplier:', err);
            setErrorMsg('Error adding supplier: ' + err.message);
            showNotificationMessage('Error adding supplier', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // ===== CREATE CATEGORY =====
    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        if (!categoryForm.name.trim()) {
            setErrorMsg('Category name is required');
            showNotificationMessage('Category name is required', 'error');
            return;
        }
        setActionLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const { data: existingCategory } = await supabase
                .from('inventory_categories')
                .select('id, name')
                .eq('name', categoryForm.name.trim())
                .maybeSingle();

            if (existingCategory) {
                setErrorMsg(`Category "${categoryForm.name}" already exists!`);
                showNotificationMessage(`Category "${categoryForm.name}" already exists!`, 'error');
                setActionLoading(false);
                return;
            }

            const categoryData = {
                name: categoryForm.name.trim(),
                description: categoryForm.description || null,
                color: categoryForm.color || '#3B82F6',
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('inventory_categories')
                .insert([categoryData])
                .select();

            if (error) {
                console.error('Error adding category:', error);
                setErrorMsg('Failed to add category: ' + error.message);
                showNotificationMessage('Failed to add category', 'error');
                return;
            }

            console.log('✅ Category added:', data);
            setSuccessMsg('✅ Category added successfully!');
            showNotificationMessage(`Category "${categoryForm.name}" added successfully! 🎉`, 'success');
            setIsCategoryOpen(false);
            setCategoryForm({
                name: '',
                description: '',
                color: '#3B82F6'
            });
            await loadInventory();

        } catch (err) {
            console.error('Error adding category:', err);
            setErrorMsg('Error adding category: ' + err.message);
            showNotificationMessage('Error adding category', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // ===== PROCESS PAYMENT =====
    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
            setErrorMsg('Please enter a valid amount');
            showNotificationMessage('Please enter a valid amount', 'error');
            return;
        }
        setActionLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const paymentData = {
                supplier_id: paymentForm.supplier_id,
                amount: parseFloat(paymentForm.amount),
                payment_date: paymentForm.payment_date || new Date().toISOString().split('T')[0],
                payment_method: paymentForm.payment_method,
                reference: paymentForm.reference || null,
                notes: paymentForm.notes || null,
                status: paymentForm.status || 'paid',
                created_by: user?.id || null,
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('supplier_payments')
                .insert([paymentData])
                .select();

            if (error) {
                console.error('Error processing payment:', error);
                setErrorMsg('Failed to process payment: ' + error.message);
                showNotificationMessage('Failed to process payment', 'error');
                return;
            }

            console.log('✅ Payment processed:', data);
            setSuccessMsg('✅ Payment processed successfully!');
            showNotificationMessage(`Payment of Rs. ${paymentForm.amount} processed successfully! 💰`, 'success');
            setIsPaymentOpen(false);
            openReceiptModal(data?.[0]);
            await loadInventory();

        } catch (err) {
            console.error('Error processing payment:', err);
            setErrorMsg('Error processing payment: ' + err.message);
            showNotificationMessage('Error processing payment', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // ============================================================
    // ===== EXPORT FUNCTIONS - COMPLETE =====
    // ============================================================

    // ===== 1. EXPORT TO CSV =====
    const exportToCSV = () => {
        setExporting(true);
        try {
            const headers = [
                'Item Name', 'Category', 'Quantity', 'Minimum Quantity',
                'Price (Rs.)', 'Cost Price (Rs.)', 'Unit', 'Location',
                'Batch Number', 'Supplier', 'Status', 'Notes'
            ];

            const rows = filteredItems.map(item => [
                `"${item.item_name || 'N/A'}"`,
                `"${item.category || 'N/A'}"`,
                item.quantity || 0,
                item.minimum_quantity || 0,
                parseFloat(item.price || 0).toFixed(2),
                parseFloat(item.cost_price || 0).toFixed(2),
                `"${item.unit || 'pcs'}"`,
                `"${item.location || 'N/A'}"`,
                `"${item.batch_number || 'N/A'}"`,
                `"${item.suppliers?.name || 'N/A'}"`,
                `"${getStockStatus(item).label}"`,
                `"${item.notes || ''}"`
            ]);

            const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

            // Create download
            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `inventory_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setSuccessMsg('✅ CSV exported successfully!');
            showNotificationMessage('CSV exported successfully!', 'success');
        } catch (err) {
            setErrorMsg('Failed to export CSV: ' + err.message);
            showNotificationMessage('Failed to export CSV', 'error');
        } finally {
            setExporting(false);
            setShowExportMenu(false);
        }
    };

    // ===== 2. EXPORT TO EXCEL =====
    const exportToExcel = () => {
        setExporting(true);
        try {
            const headers = [
                'Item Name', 'Category', 'Quantity', 'Minimum Quantity',
                'Price (Rs.)', 'Cost Price (Rs.)', 'Unit', 'Location',
                'Batch Number', 'Supplier', 'Status', 'Notes'
            ];

            let html = `
                <html xmlns:o="urn:schemas-microsoft-com:office:office" 
                      xmlns:x="urn:schemas-microsoft-com:office:excel" 
                      xmlns="http://www.w3.org/TR/REC-html40">
                <head>
                    <meta charset="UTF-8">
                    <!--[if gte mso 9]>
                    <xml>
                        <x:ExcelWorkbook>
                            <x:ExcelWorksheets>
                                <x:ExcelWorksheet>
                                    <x:Name>Inventory</x:Name>
                                    <x:WorksheetOptions>
                                        <x:DisplayGridlines/>
                                    </x:WorksheetOptions>
                                </x:ExcelWorksheet>
                            </x:ExcelWorksheets>
                        </x:ExcelWorkbook>
                    </xml>
                    <![endif]-->
                    <style>
                        table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; }
                        th { background-color: #4A90D9; color: white; padding: 8px; border: 1px solid #ddd; }
                        td { padding: 6px 8px; border: 1px solid #ddd; }
                        tr:nth-child(even) { background-color: #f9f9f9; }
                        .low-stock { color: #F59E0B; font-weight: bold; }
                        .out-of-stock { color: #EF4444; font-weight: bold; }
                        .good-stock { color: #22C55E; font-weight: bold; }
                        .total-row { background-color: #e8f0fe; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <h2>🏥 Subhan Care Clinic - Inventory Report</h2>
                    <p>Generated: ${new Date().toLocaleString()}</p>
                    <p>Total Items: ${filteredItems.length}</p>
                    <p>Total Value: Rs. ${stats.totalValue.toFixed(2)}</p>
                    <p>Total Restocks: ${stats.totalRestocks}</p>
                    <p>Total Payments: Rs. ${stats.totalPaidAmount.toFixed(2)}</p>
                    <br/>
                    <table>
                        <thead>
                            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
            `;

            filteredItems.forEach(item => {
                const status = getStockStatus(item);
                const statusClass = status.type === 'low' ? 'low-stock' :
                    status.type === 'out' ? 'out-of-stock' : 'good-stock';
                html += `
                    <tr>
                        <td>${item.item_name || 'N/A'}</td>
                        <td>${item.category || 'N/A'}</td>
                        <td>${item.quantity || 0}</td>
                        <td>${item.minimum_quantity || 0}</td>
                        <td>${parseFloat(item.price || 0).toFixed(2)}</td>
                        <td>${parseFloat(item.cost_price || 0).toFixed(2)}</td>
                        <td>${item.unit || 'pcs'}</td>
                        <td>${item.location || 'N/A'}</td>
                        <td>${item.batch_number || 'N/A'}</td>
                        <td>${item.suppliers?.name || 'N/A'}</td>
                        <td class="${statusClass}">${status.label}</td>
                        <td>${item.notes || ''}</td>
                    </tr>
                `;
            });

            // Totals row
            const totalQty = filteredItems.reduce((acc, item) => acc + (parseInt(item.quantity) || 0), 0);
            const totalValue = filteredItems.reduce((acc, item) => acc + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0), 0);

            html += `
                        <tr class="total-row">
                            <td colspan="2" style="text-align:right;"><strong>TOTALS</strong></td>
                            <td><strong>${totalQty}</strong></td>
                            <td colspan="2"></td>
                            <td><strong>Rs. ${totalValue.toFixed(2)}</strong></td>
                            <td colspan="6"></td>
                        </tr>
                    </tbody>
                </table>
                <br/>
                <p style="color: #666; font-size: 11px;">This is a system-generated report from Subhan Care Clinic HMS.</p>
                </body>
                </html>
            `;

            const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `inventory_${new Date().toISOString().split('T')[0]}.xls`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setSuccessMsg('✅ Excel exported successfully!');
            showNotificationMessage('Excel exported successfully!', 'success');
        } catch (err) {
            setErrorMsg('Failed to export Excel: ' + err.message);
            showNotificationMessage('Failed to export Excel', 'error');
        } finally {
            setExporting(false);
            setShowExportMenu(false);
        }
    };

    // ===== 3. EXPORT TO PDF (using print) =====
    const exportToPDF = () => {
        setExporting(true);
        try {
            // Create a printable version
            const printWindow = window.open('', '_blank', 'width=800,height=600');
            if (!printWindow) {
                alert('Please allow popups to print the report.');
                setExporting(false);
                return;
            }

            const headers = [
                'Item Name', 'Category', 'Quantity', 'Price (Rs.)',
                'Supplier', 'Status', 'Notes'
            ];

            let html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Inventory Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; }
                        h2 { color: #2563EB; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .header h1 { font-size: 24px; margin: 0; }
                        .header p { color: #666; font-size: 14px; margin: 5px 0; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background-color: #2563EB; color: white; padding: 10px; text-align: left; font-size: 12px; }
                        td { padding: 8px 10px; border-bottom: 1px solid #ddd; font-size: 12px; }
                        tr:nth-child(even) { background-color: #f9f9f9; }
                        .low-stock { color: #F59E0B; font-weight: bold; }
                        .out-of-stock { color: #EF4444; font-weight: bold; }
                        .good-stock { color: #22C55E; font-weight: bold; }
                        .footer { margin-top: 30px; text-align: center; color: #999; font-size: 11px; border-top: 1px solid #ddd; padding-top: 20px; }
                        .stats { margin: 20px 0; padding: 15px; background: #f0f4ff; border-radius: 8px; }
                        .stats span { display: inline-block; margin-right: 30px; font-size: 13px; }
                        .stats strong { color: #2563EB; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>🏥 Subhan Care Clinic</h1>
                        <p>Inventory Report - ${new Date().toLocaleString()}</p>
                    </div>
                    
                    <div class="stats">
                        <span>📦 Total Items: <strong>${filteredItems.length}</strong></span>
                        <span>💰 Total Value: <strong>Rs. ${stats.totalValue.toFixed(2)}</strong></span>
                        <span>📊 Total Restocks: <strong>${stats.totalRestocks}</strong></span>
                        <span>💳 Total Payments: <strong>Rs. ${stats.totalPaidAmount.toFixed(2)}</strong></span>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
            `;

            filteredItems.slice(0, 50).forEach(item => {
                const status = getStockStatus(item);
                const statusClass = status.type === 'low' ? 'low-stock' :
                    status.type === 'out' ? 'out-of-stock' : 'good-stock';
                html += `
                    <tr>
                        <td>${item.item_name || 'N/A'}</td>
                        <td>${item.category || 'N/A'}</td>
                        <td>${item.quantity || 0} ${item.unit || 'pcs'}</td>
                        <td>Rs. ${parseFloat(item.price || 0).toFixed(2)}</td>
                        <td>${item.suppliers?.name || 'N/A'}</td>
                        <td class="${statusClass}">${status.label}</td>
                        <td>${item.notes || ''}</td>
                    </tr>
                `;
            });

            if (filteredItems.length > 50) {
                html += `
                    <tr>
                        <td colspan="7" style="text-align:center; color:#999; padding:20px;">
                            ... and ${filteredItems.length - 50} more items
                        </td>
                    </tr>
                `;
            }

            html += `
                        </tbody>
                    </table>
                    
                    <div class="footer">
                        <p>Generated by Subhan Care Clinic HMS | ${new Date().toLocaleString()}</p>
                        <p style="font-size: 10px;">This is a system-generated report.</p>
                    </div>
                    
                    <script>
                        window.onload = function() {
                            window.print();
                            setTimeout(function() {
                                window.close();
                            }, 1000);
                        }
                    <\/script>
                </body>
                </html>
            `;

            printWindow.document.write(html);
            printWindow.document.close();

            setSuccessMsg('✅ PDF exported successfully!');
            showNotificationMessage('PDF exported successfully!', 'success');
        } catch (err) {
            setErrorMsg('Failed to export PDF: ' + err.message);
            showNotificationMessage('Failed to export PDF', 'error');
        } finally {
            setExporting(false);
            setShowExportMenu(false);
        }
    };

    // ===== 4. EXPORT TO JSON =====
    const exportToJSON = () => {
        setExporting(true);
        try {
            const data = {
                generated_at: new Date().toISOString(),
                total_items: filteredItems.length,
                total_value: stats.totalValue,
                items: filteredItems.map(item => ({
                    item_name: item.item_name,
                    category: item.category,
                    quantity: parseInt(item.quantity || 0),
                    minimum_quantity: parseInt(item.minimum_quantity || 0),
                    price: parseFloat(item.price || 0),
                    cost_price: parseFloat(item.cost_price || 0),
                    unit: item.unit || 'pcs',
                    location: item.location || '',
                    batch_number: item.batch_number || '',
                    supplier: item.suppliers?.name || '',
                    status: getStockStatus(item).label,
                    notes: item.notes || '',
                    created_at: item.created_at,
                    updated_at: item.updated_at
                }))
            };

            const jsonStr = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `inventory_${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setSuccessMsg('✅ JSON exported successfully!');
            showNotificationMessage('JSON exported successfully!', 'success');
        } catch (err) {
            setErrorMsg('Failed to export JSON: ' + err.message);
            showNotificationMessage('Failed to export JSON', 'error');
        } finally {
            setExporting(false);
            setShowExportMenu(false);
        }
    };

    // ===== 5. PRINT REPORT =====
    const printReport = () => {
        setExporting(true);
        try {
            window.print();
            showNotificationMessage('Printing report...', 'success');
        } catch (err) {
            setErrorMsg('Failed to print: ' + err.message);
            showNotificationMessage('Failed to print', 'error');
        } finally {
            setExporting(false);
            setShowExportMenu(false);
        }
    };

    // ===== FILTERED ITEMS =====
    const filteredItems = items.filter(item => {
        const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.location || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === '' || item.category === categoryFilter;
        const matchesStatus = statusFilter === '' || getStockStatus(item).type === statusFilter;
        const matchesDate = dateFilter === '' ||
            new Date(item.created_at).toDateString() === new Date(dateFilter).toDateString();
        return matchesSearch && matchesCategory && matchesStatus && matchesDate;
    });

    // ===== SORT ITEMS =====
    const sortedItems = [...filteredItems].sort((a, b) => {
        if (sortBy === 'newest') {
            return new Date(b.created_at) - new Date(a.created_at);
        } else if (sortBy === 'oldest') {
            return new Date(a.created_at) - new Date(b.created_at);
        } else if (sortBy === 'name') {
            return (a.item_name || '').localeCompare(b.item_name || '');
        } else if (sortBy === 'quantity') {
            return (parseInt(b.quantity) || 0) - (parseInt(a.quantity) || 0);
        } else if (sortBy === 'price') {
            return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
        }
        return 0;
    });

    // ===== CLEAR FILTERS =====
    const clearFilters = () => {
        setSearchQuery('');
        setCategoryFilter('');
        setStatusFilter('');
        setDateFilter('');
        setSortBy('newest');
        setShowFilters(false);
    };

    const activeFilterCount = (searchQuery ? 1 : 0) + (categoryFilter ? 1 : 0) +
        (statusFilter ? 1 : 0) + (dateFilter ? 1 : 0);

    // ===== GET STOCK STATUS =====
    const getStockStatus = (item) => {
        const qty = parseInt(item.quantity) || 0;
        const min = parseInt(item.minimum_quantity) || 0;
        if (qty <= 0) {
            return { label: 'Out of Stock', type: 'out', color: '#EF4444', bg: '#EF444415', icon: '❌' };
        } else if (qty <= min) {
            return { label: 'Low Stock', type: 'low', color: '#F59E0B', bg: '#F59E0B15', icon: '⚠️' };
        } else {
            return { label: 'In Stock', type: 'good', color: '#22C55E', bg: '#22C55E15', icon: '✅' };
        }
    };

    // ===== GET RESTOCK COUNT =====
    const getRestockCount = (itemId) => {
        return stockMovements.filter(m => m.inventory_id === itemId && m.movement_type === 'restock').length;
    };

    return (
        <DashboardLayout active="inventory" title="Inventory Management">
            {/* ===== NOTIFICATION TOAST ===== */}
            {showNotification && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: 10000,
                    padding: '14px 20px',
                    borderRadius: '12px',
                    background: notificationType === 'success' ? '#10B981' : '#EF4444',
                    color: 'white',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    minWidth: isMobile ? '90%' : '350px',
                    maxWidth: isMobile ? '95%' : '450px',
                    animation: 'slideInRight 0.5s ease'
                }}>
                    {notificationType === 'success' ? (
                        <Check size={20} style={{ flexShrink: 0 }} />
                    ) : (
                        <AlertCircle size={20} style={{ flexShrink: 0 }} />
                    )}
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{notificationMessage}</span>
                    <button
                        onClick={() => setShowNotification(false)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            padding: '4px',
                            marginLeft: 'auto',
                            opacity: 0.8
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* ===== BACK BUTTON ===== */}
            <div style={{ marginBottom: '16px' }}>
                <button onClick={goBack} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', background: 'transparent',
                    border: '1px solid var(--border-color)', borderRadius: '10px',
                    cursor: 'pointer', fontSize: '0.8rem',
                    fontFamily: 'var(--font-family)', color: 'var(--text-secondary)',
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
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '20px', flexWrap: 'wrap', gap: '12px'
            }}>
                <div>
                    <h1 style={{
                        fontSize: isMobile ? '1.1rem' : '1.4rem',
                        fontWeight: 600, color: 'var(--text-primary)',
                        margin: 0, display: 'flex', alignItems: 'center', gap: '10px'
                    }}>
                        <Package size={isMobile ? 20 : 24} style={{ color: 'var(--primary-color)' }} />
                        Inventory Management
                    </h1>
                    <p style={{
                        fontSize: '0.85rem', color: 'var(--text-secondary)',
                        marginTop: '4px', display: isMobile ? 'none' : 'block'
                    }}>
                        Manage hospital supplies, equipment, and inventory items
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
                    <button onClick={loadInventory} style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '6px 12px', border: '1px solid var(--border-color)',
                        borderRadius: '8px', background: 'transparent', cursor: 'pointer',
                        fontSize: '0.75rem', fontFamily: 'var(--font-family)',
                        color: 'var(--text-secondary)', transition: 'all 0.2s ease',
                        flex: isMobile ? 1 : 'none'
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

                    {/* ===== EXPORT BUTTON WITH FULL MENU ===== */}
                    <div style={{ position: 'relative', flex: isMobile ? 1 : 'none' }}>
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            disabled={exporting}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 12px', border: '1px solid var(--border-color)',
                                borderRadius: '8px', background: 'var(--bg-primary)',
                                cursor: exporting ? 'not-allowed' : 'pointer',
                                fontSize: '0.75rem', fontFamily: 'var(--font-family)',
                                color: 'var(--text-secondary)',
                                opacity: exporting ? 0.6 : 1,
                                transition: 'all 0.2s ease',
                                width: '100%', justifyContent: 'center'
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
                            {exporting ? (
                                <Loader size={14} className="spinner" />
                            ) : (
                                <Download size={14} />
                            )}
                            {isMobile ? 'Export' : 'Export'}
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
                                minWidth: isMobile ? '180px' : '200px',
                                zIndex: 100,
                                padding: '6px 0',
                                animation: 'slideDown 0.2s ease'
                            }}>
                                {/* CSV Option */}
                                <button
                                    onClick={exportToCSV}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '8px 14px', width: '100%', border: 'none',
                                        background: 'transparent', cursor: 'pointer',
                                        fontSize: '0.8rem', fontFamily: 'var(--font-family)',
                                        color: 'var(--text-primary)',
                                        transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = 'var(--hover-bg)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = 'transparent';
                                    }}
                                >
                                    <FileText size={16} style={{ color: '#3B82F6' }} />
                                    <span>Export as CSV</span>
                                </button>

                                {/* Excel Option */}
                                <button
                                    onClick={exportToExcel}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '8px 14px', width: '100%', border: 'none',
                                        background: 'transparent', cursor: 'pointer',
                                        fontSize: '0.8rem', fontFamily: 'var(--font-family)',
                                        color: 'var(--text-primary)',
                                        transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = 'var(--hover-bg)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = 'transparent';
                                    }}
                                >
                                    <FileSpreadsheet size={16} style={{ color: '#22C55E' }} />
                                    <span>Export as Excel (.xls)</span>
                                </button>

                                {/* PDF Option */}
                                <button
                                    onClick={exportToPDF}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '8px 14px', width: '100%', border: 'none',
                                        background: 'transparent', cursor: 'pointer',
                                        fontSize: '0.8rem', fontFamily: 'var(--font-family)',
                                        color: 'var(--text-primary)',
                                        transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = 'var(--hover-bg)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = 'transparent';
                                    }}
                                >
                                    <FileBox size={16} style={{ color: '#EF4444' }} />
                                    <span>Export as PDF</span>
                                </button>

                                {/* JSON Option */}
                                <button
                                    onClick={exportToJSON}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '8px 14px', width: '100%', border: 'none',
                                        background: 'transparent', cursor: 'pointer',
                                        fontSize: '0.8rem', fontFamily: 'var(--font-family)',
                                        color: 'var(--text-primary)',
                                        transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = 'var(--hover-bg)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = 'transparent';
                                    }}
                                >
                                    <FileJson size={16} style={{ color: '#8B5CF6' }} />
                                    <span>Export as JSON</span>
                                </button>

                                <div style={{
                                    borderTop: '1px solid var(--border-color)',
                                    margin: '4px 8px'
                                }} />

                                {/* Print Option */}
                                <button
                                    onClick={printReport}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '8px 14px', width: '100%', border: 'none',
                                        background: 'transparent', cursor: 'pointer',
                                        fontSize: '0.8rem', fontFamily: 'var(--font-family)',
                                        color: 'var(--text-primary)',
                                        transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = 'var(--hover-bg)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = 'transparent';
                                    }}
                                >
                                    <Printer size={16} style={{ color: '#F59E0B' }} />
                                    <span>Print Report</span>
                                </button>

                                {/* Close Option */}
                                <button
                                    onClick={() => setShowExportMenu(false)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '8px 14px', width: '100%', border: 'none',
                                        background: 'transparent', cursor: 'pointer',
                                        fontSize: '0.8rem', fontFamily: 'var(--font-family)',
                                        color: 'var(--text-secondary)',
                                        borderTop: '1px solid var(--border-color)',
                                        marginTop: '4px', paddingTop: '8px',
                                        transition: 'all 0.15s ease'
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
                                    <X size={16} />
                                    <span>Close</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <button onClick={openSupplierModal} style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '6px 12px', border: '1px solid var(--border-color)',
                        borderRadius: '8px', background: 'transparent', cursor: 'pointer',
                        fontSize: '0.75rem', fontFamily: 'var(--font-family)',
                        color: 'var(--text-secondary)', transition: 'all 0.2s ease',
                        flex: isMobile ? 1 : 'none'
                    }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'var(--hover-bg)';
                            e.target.style.color = 'var(--text-primary)';
                            e.target.style.borderColor = '#8B5CF6';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'transparent';
                            e.target.style.color = 'var(--text-secondary)';
                            e.target.style.borderColor = 'var(--border-color)';
                        }}
                    >
                        <Truck size={14} /> {isMobile ? 'Supplier' : 'Add Supplier'}
                    </button>

                    <button onClick={openCategoryModal} style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '6px 12px', border: '1px solid var(--border-color)',
                        borderRadius: '8px', background: 'transparent', cursor: 'pointer',
                        fontSize: '0.75rem', fontFamily: 'var(--font-family)',
                        color: 'var(--text-secondary)', transition: 'all 0.2s ease',
                        flex: isMobile ? 1 : 'none'
                    }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'var(--hover-bg)';
                            e.target.style.color = 'var(--text-primary)';
                            e.target.style.borderColor = '#8B5CF6';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'transparent';
                            e.target.style.color = 'var(--text-secondary)';
                            e.target.style.borderColor = 'var(--border-color)';
                        }}
                    >
                        <Layers size={14} /> {isMobile ? 'Category' : 'Add Category'}
                    </button>

                    <button onClick={openAddModal} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '6px 12px', border: 'none', borderRadius: '8px',
                        background: 'var(--primary-color)', cursor: 'pointer',
                        fontSize: '0.75rem', fontFamily: 'var(--font-family)',
                        color: 'white', fontWeight: 500, transition: 'all 0.2s ease',
                        flex: isMobile ? 1 : 'none', justifyContent: 'center'
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
                        <Plus size={14} /> {isMobile ? 'Add' : 'Add Item'}
                    </button>
                </div>
            </div>

            {/* ===== STATS CARDS ===== */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '12px', marginBottom: '20px'
            }}>
                {/* Total Items */}
                <div style={{
                    padding: '14px 16px', background: 'var(--card-bg)',
                    borderRadius: '12px', border: '1px solid var(--border-color)',
                    transition: 'all 0.3s ease', cursor: 'pointer'
                }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Package size={16} style={{ color: '#3B82F6' }} />
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total Items</span>
                    </div>
                    <div style={{ fontSize: isMobile ? '1.1rem' : '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {stats.totalItems}
                    </div>
                </div>

                {/* Low Stock */}
                <div style={{
                    padding: '14px 16px', background: 'var(--card-bg)',
                    borderRadius: '12px', border: '1px solid var(--border-color)',
                    transition: 'all 0.3s ease', cursor: 'pointer'
                }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    onClick={openLowStockModal}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <AlertCircle size={16} style={{ color: '#F59E0B' }} />
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Low Stock</span>
                    </div>
                    <div style={{ fontSize: isMobile ? '1.1rem' : '1.4rem', fontWeight: 700, color: '#F59E0B' }}>
                        {stats.lowStockItems}
                    </div>
                </div>

                {/* Payments */}
                <div style={{
                    padding: '14px 16px', background: 'var(--card-bg)',
                    borderRadius: '12px', border: '1px solid var(--border-color)',
                    transition: 'all 0.3s ease', cursor: 'pointer'
                }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    onClick={openPaymentHistoryModal}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Wallet size={16} style={{ color: '#10B981' }} />
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Payments</span>
                    </div>
                    <div style={{ fontSize: isMobile ? '1.1rem' : '1.4rem', fontWeight: 700, color: '#10B981' }}>
                        Rs. {stats.totalPaidAmount.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                        {stats.totalPayments} paid • {stats.pendingPayments} pending
                    </div>
                </div>

                {/* Restocks */}
                <div style={{
                    padding: '14px 16px', background: 'var(--card-bg)',
                    borderRadius: '12px', border: '1px solid var(--border-color)',
                    transition: 'all 0.3s ease', cursor: 'pointer'
                }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <History size={16} style={{ color: '#8B5CF6' }} />
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Restocks</span>
                    </div>
                    <div style={{ fontSize: isMobile ? '1.1rem' : '1.4rem', fontWeight: 700, color: '#8B5CF6' }}>
                        {stats.totalRestocks}
                    </div>
                </div>

                {/* Total Value */}
                <div style={{
                    padding: '14px 16px', background: 'var(--card-bg)',
                    borderRadius: '12px', border: '1px solid var(--border-color)',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <DollarSign size={16} style={{ color: '#10B981' }} />
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total Value</span>
                    </div>
                    <div style={{ fontSize: isMobile ? '1.1rem' : '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Rs. {stats.totalValue.toFixed(2)}
                    </div>
                </div>
            </div>

            {/* ============================================================ */}
            {/* ===== TABLE ===== */}
            {/* ============================================================ */}
            <div className="hms-table-container">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <div className="spinner" style={{ margin: '0 auto 12px' }}>⏳</div>
                        Loading inventory...
                    </div>
                ) : sortedItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📦</div>
                        <h3>No Items Found</h3>
                        <p>Start by adding your first inventory item.</p>
                        <br />
                        <button onClick={openAddModal} className="btn-primary">
                            <Plus size={16} /> First Item
                        </button>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="hms-table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Category</th>
                                    <th style={{ textAlign: 'center' }}>Qty</th>
                                    <th style={{ textAlign: 'right' }}>Price</th>
                                    <th style={{ textAlign: 'center' }}>Status</th>
                                    <th style={{ textAlign: 'center' }}>Restocks</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedItems.map(item => {
                                    const status = getStockStatus(item);
                                    return (
                                        <tr key={item.id}>
                                            <td style={{ fontWeight: 600 }}>
                                                {item.item_name}
                                                {item.suppliers?.name && (
                                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                                                        <Truck size={10} style={{ display: 'inline', marginRight: '2px' }} />
                                                        {item.suppliers.name}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: '12px', fontSize: '0.6rem',
                                                    background: 'var(--primary-color)10', color: 'var(--primary-color)'
                                                }}>
                                                    {item.category || 'Uncategorized'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center', fontWeight: 500 }}>
                                                {item.quantity || 0} {item.unit || 'pcs'}
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 500 }}>
                                                Rs. {parseFloat(item.price || 0).toFixed(2)}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '2px 10px', borderRadius: '20px', fontSize: '0.65rem',
                                                    fontWeight: 600, background: status.bg, color: status.color,
                                                    border: `1px solid ${status.color}30`
                                                }}>
                                                    {status.icon} {status.label}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center', color: '#8B5CF6', fontSize: '0.8rem' }}>
                                                <button
                                                    onClick={() => openHistoryModal(item)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        color: '#8B5CF6',
                                                        fontWeight: 600,
                                                        fontSize: '0.8rem',
                                                        fontFamily: 'var(--font-family)',
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.background = '#8B5CF615';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.background = 'transparent';
                                                    }}
                                                >
                                                    {getRestockCount(item.id)}
                                                </button>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                                    <button onClick={() => openViewModal(item)} className="hms-action-btn" title="View">
                                                        <Eye size={14} />
                                                    </button>
                                                    <button onClick={() => openRestockModal(item)} className="hms-action-btn success" title="Restock">
                                                        <PackageOpen size={14} />
                                                    </button>
                                                    <button onClick={() => openEditModal(item)} className="hms-action-btn" title="Edit">
                                                        <Edit size={14} />
                                                    </button>
                                                    <button onClick={() => openDeleteModal(item)} className="hms-action-btn danger" title="Delete">
                                                        <Trash2 size={14} />
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

            {/* ============================================================ */}
            {/* ===== ALL MODALS ===== */}
            {/* ============================================================ */}

            {/* Category Modal */}
            {isCategoryOpen && (
                <div className="hms-modal-backdrop" onClick={() => setIsCategoryOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                        <div className="hms-modal-header">
                            <h3 className="hms-modal-title"><Layers size={18} style={{ color: '#8B5CF6' }} /> Add Category</h3>
                            <button onClick={() => setIsCategoryOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="hms-modal-body">
                            {errorMsg && <div className="alert alert-danger"><AlertCircle size={16} /> {errorMsg}</div>}
                            {successMsg && <div className="alert alert-success"><Check size={16} /> {successMsg}</div>}
                            <form onSubmit={handleCategorySubmit}>
                                <div className="form-group">
                                    <label>Category Name *</label>
                                    <input type="text" name="name" value={categoryForm.name} onChange={handleCategoryChange} placeholder="e.g. Surgical Supplies" required />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <input type="text" name="description" value={categoryForm.description} onChange={handleCategoryChange} placeholder="Category description" />
                                </div>
                                <div className="form-group">
                                    <label>Color</label>
                                    <input type="color" name="color" value={categoryForm.color} onChange={handleCategoryChange} style={{ height: '40px', padding: '4px', cursor: 'pointer' }} />
                                </div>
                                <div className="hms-modal-footer">
                                    <button type="button" onClick={() => setIsCategoryOpen(false)} className="btn-cancel">Cancel</button>
                                    <button type="submit" disabled={actionLoading} className="btn-primary"><Layers size={14} /> {actionLoading ? 'Adding...' : 'Add Category'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Supplier Modal */}
            {isSupplierOpen && (
                <div className="hms-modal-backdrop" onClick={() => setIsSupplierOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
                        <div className="hms-modal-header">
                            <h3 className="hms-modal-title"><Truck size={18} style={{ color: '#8B5CF6' }} /> Add Supplier</h3>
                            <button onClick={() => setIsSupplierOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="hms-modal-body">
                            {errorMsg && <div className="alert alert-danger"><AlertCircle size={16} /> {errorMsg}</div>}
                            {successMsg && <div className="alert alert-success"><Check size={16} /> {successMsg}</div>}
                            <form onSubmit={handleSupplierSubmit}>
                                <div className="form-group">
                                    <label>Supplier Name *</label>
                                    <input type="text" name="name" value={supplierForm.name} onChange={handleSupplierChange} placeholder="e.g. MediCare Supplies" required />
                                </div>
                                <div className="form-group">
                                    <label>Contact Person</label>
                                    <input type="text" name="contact_person" value={supplierForm.contact_person} onChange={handleSupplierChange} placeholder="e.g. Mr. Ahmed" />
                                </div>
                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label>Phone</label>
                                        <input type="text" name="phone" value={supplierForm.phone} onChange={handleSupplierChange} placeholder="e.g. 051-1234567" />
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input type="email" name="email" value={supplierForm.email} onChange={handleSupplierChange} placeholder="info@supplier.com" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Address</label>
                                    <input type="text" name="address" value={supplierForm.address} onChange={handleSupplierChange} placeholder="Complete address" />
                                </div>
                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label>City</label>
                                        <input type="text" name="city" value={supplierForm.city} onChange={handleSupplierChange} placeholder="e.g. Islamabad" />
                                    </div>
                                    <div className="form-group">
                                        <label>Payment Terms</label>
                                        <input type="text" name="payment_terms" value={supplierForm.payment_terms} onChange={handleSupplierChange} placeholder="e.g. Net 30 days" />
                                    </div>
                                </div>
                                <div className="hms-modal-footer">
                                    <button type="button" onClick={() => setIsSupplierOpen(false)} className="btn-cancel">Cancel</button>
                                    <button type="submit" disabled={actionLoading} className="btn-primary"><Truck size={14} /> {actionLoading ? 'Adding...' : 'Add Supplier'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Item Modal */}
            {isAddOpen && (
                <div className="hms-modal-backdrop" onClick={() => setIsAddOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="hms-modal-header">
                            <h3 className="hms-modal-title"><Package size={18} style={{ color: 'var(--primary-color)' }} /> Add Inventory Item</h3>
                            <button onClick={() => setIsAddOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="hms-modal-body">
                            {errorMsg && <div className="alert alert-danger"><AlertCircle size={16} /> {errorMsg}</div>}
                            {successMsg && <div className="alert alert-success"><Check size={16} /> {successMsg}</div>}
                            <form onSubmit={handleAddSubmit}>
                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label>Item Name *</label>
                                        <input type="text" name="item_name" value={formData.item_name} onChange={handleFormChange} required />
                                        {formErrors.item_name && <span className="error-text">{formErrors.item_name}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label>Category *</label>
                                        <select name="category" value={formData.category} onChange={handleFormChange} required>
                                            <option value="">Select Category</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </select>
                                        {formErrors.category && <span className="error-text">{formErrors.category}</span>}
                                    </div>
                                </div>

                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label>Quantity *</label>
                                        <input type="number" name="quantity" value={formData.quantity} onChange={handleFormChange} min="0" required />
                                        {formErrors.quantity && <span className="error-text">{formErrors.quantity}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label>Minimum Quantity</label>
                                        <input type="number" name="minimum_quantity" value={formData.minimum_quantity} onChange={handleFormChange} min="0" />
                                    </div>
                                </div>

                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label>Selling Price (Rs.) *</label>
                                        <input type="number" name="price" value={formData.price} onChange={handleFormChange} step="0.01" min="0" required />
                                        {formErrors.price && <span className="error-text">{formErrors.price}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label>Cost Price (Rs.)</label>
                                        <input type="number" name="cost_price" value={formData.cost_price} onChange={handleFormChange} step="0.01" min="0" />
                                    </div>
                                </div>

                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label>Unit</label>
                                        <select name="unit" value={formData.unit} onChange={handleFormChange}>
                                            <option value="pcs">Pieces (pcs)</option>
                                            <option value="box">Box</option>
                                            <option value="pack">Pack</option>
                                            <option value="bottle">Bottle</option>
                                            <option value="strip">Strip</option>
                                            <option value="vial">Vial</option>
                                            <option value="ampoule">Ampoule</option>
                                            <option value="tablet">Tablet</option>
                                            <option value="capsule">Capsule</option>
                                            <option value="ml">ML</option>
                                            <option value="mg">MG</option>
                                            <option value="g">Gram</option>
                                            <option value="kg">KG</option>
                                            <option value="roll">Roll</option>
                                            <option value="sheet">Sheet</option>
                                            <option value="set">Set</option>
                                            <option value="pair">Pair</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Supplier</label>
                                        <select name="supplier_id" value={formData.supplier_id} onChange={handleFormChange}>
                                            <option value="">Select Supplier</option>
                                            {suppliers.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label>Location</label>
                                        <input type="text" name="location" value={formData.location} onChange={handleFormChange} placeholder="e.g. Store Room A, Shelf 3" />
                                    </div>
                                    <div className="form-group">
                                        <label>Batch Number</label>
                                        <input type="text" name="batch_number" value={formData.batch_number} onChange={handleFormChange} placeholder="e.g. BATCH-2024-001" />
                                    </div>
                                </div>

                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label>Expiry Date</label>
                                        <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleFormChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Reorder Point</label>
                                        <input type="number" name="reorder_point" value={formData.reorder_point} onChange={handleFormChange} min="0" />
                                    </div>
                                </div>

                                <div className="form-group full-width">
                                    <label>Description / Notes</label>
                                    <textarea name="notes" value={formData.notes} onChange={handleFormChange} placeholder="Additional notes..." rows={isMobile ? 2 : 3} />
                                </div>

                                <div className="hms-modal-footer">
                                    <button type="button" onClick={() => setIsAddOpen(false)} className="btn-cancel">Cancel</button>
                                    <button type="submit" disabled={actionLoading} className="btn-primary">
                                        <Package size={14} /> {actionLoading ? 'Adding...' : 'Add Item'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Item Modal */}
            {isEditOpen && selectedItem && (
                <div className="hms-modal-backdrop" onClick={() => setIsEditOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="hms-modal-header">
                            <h3 className="hms-modal-title"><Edit size={18} style={{ color: '#22C55E' }} /> Edit Item</h3>
                            <button onClick={() => setIsEditOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="hms-modal-body">
                            {errorMsg && <div className="alert alert-danger"><AlertCircle size={16} /> {errorMsg}</div>}
                            {successMsg && <div className="alert alert-success"><Check size={16} /> {successMsg}</div>}
                            <form onSubmit={handleEditSubmit}>
                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label>Item Name *</label>
                                        <input type="text" name="item_name" value={formData.item_name} onChange={handleFormChange} required />
                                        {formErrors.item_name && <span className="error-text">{formErrors.item_name}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label>Category *</label>
                                        <select name="category" value={formData.category} onChange={handleFormChange} required>
                                            <option value="">Select Category</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </select>
                                        {formErrors.category && <span className="error-text">{formErrors.category}</span>}
                                    </div>
                                </div>

                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label>Quantity *</label>
                                        <input type="number" name="quantity" value={formData.quantity} onChange={handleFormChange} min="0" required />
                                        {formErrors.quantity && <span className="error-text">{formErrors.quantity}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label>Minimum Quantity</label>
                                        <input type="number" name="minimum_quantity" value={formData.minimum_quantity} onChange={handleFormChange} min="0" />
                                    </div>
                                </div>

                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label>Selling Price (Rs.) *</label>
                                        <input type="number" name="price" value={formData.price} onChange={handleFormChange} step="0.01" min="0" required />
                                        {formErrors.price && <span className="error-text">{formErrors.price}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label>Cost Price (Rs.)</label>
                                        <input type="number" name="cost_price" value={formData.cost_price} onChange={handleFormChange} step="0.01" min="0" />
                                    </div>
                                </div>

                                <div className="form-group full-width">
                                    <label>Notes</label>
                                    <textarea name="notes" value={formData.notes} onChange={handleFormChange} rows={2} />
                                </div>

                                <div className="hms-modal-footer">
                                    <button type="button" onClick={() => setIsEditOpen(false)} className="btn-cancel">Cancel</button>
                                    <button type="submit" disabled={actionLoading} className="btn-primary"><Save size={14} /> {actionLoading ? 'Saving...' : 'Update Item'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Restock Modal */}
            {isRestockOpen && selectedItem && (
                <div className="hms-modal-backdrop" onClick={() => setIsRestockOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                        <div className="hms-modal-header">
                            <h3 className="hms-modal-title"><PackageOpen size={18} style={{ color: '#8B5CF6' }} /> Restock Item</h3>
                            <button onClick={() => setIsRestockOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="hms-modal-body">
                            {errorMsg && <div className="alert alert-danger"><AlertCircle size={16} /> {errorMsg}</div>}
                            <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Item</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedItem.item_name}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Quantity</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedItem.quantity || 0} {selectedItem.unit || 'pcs'}</span>
                                </div>
                            </div>
                            <form onSubmit={handleRestockSubmit}>
                                <div className="form-group">
                                    <label>Add Quantity *</label>
                                    <input type="number" value={restockQty} onChange={(e) => setRestockQty(e.target.value)} placeholder="Enter quantity to add" min="1" required style={{ fontSize: '1.1rem' }} />
                                </div>
                                <div className="hms-modal-footer">
                                    <button type="button" onClick={() => setIsRestockOpen(false)} className="btn-cancel">Cancel</button>
                                    <button type="submit" disabled={actionLoading} className="btn-primary"><PackageOpen size={14} /> {actionLoading ? 'Restocking...' : 'Confirm Restock'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeleteOpen && selectedItem && (
                <div className="hms-modal-backdrop" onClick={() => setIsDeleteOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="hms-modal-header">
                            <h3 className="hms-modal-title"><Trash2 size={18} style={{ color: 'var(--danger-color)' }} /> Delete Item</h3>
                            <button onClick={() => setIsDeleteOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="hms-modal-body" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚠️</div>
                            <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '8px' }}>Are you sure you want to delete this item?</p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Item: <strong>{selectedItem.item_name}</strong><br />Category: <strong>{selectedItem.category || 'N/A'}</strong><br />Quantity: <strong>{selectedItem.quantity || 0} units</strong></p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '8px' }}>This action cannot be undone.</p>
                        </div>
                        <div className="hms-modal-footer" style={{ justifyContent: 'center' }}>
                            <button type="button" onClick={() => setIsDeleteOpen(false)} className="btn-cancel">Cancel</button>
                            <button onClick={handleDeleteSubmit} disabled={actionLoading} className="btn-danger"><Trash2 size={14} /> {actionLoading ? 'Deleting...' : 'Delete Permanently'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Item Modal */}
            {isViewOpen && selectedItem && (
                <div className="hms-modal-backdrop" onClick={() => setIsViewOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
                        <div className="hms-modal-header">
                            <h3 className="hms-modal-title"><Package size={18} style={{ color: 'var(--primary-color)' }} /> Item Details</h3>
                            <button onClick={() => setIsViewOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="hms-modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                                <div style={{ padding: '10px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Item Name</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedItem.item_name}</div>
                                </div>
                                <div style={{ padding: '10px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Category</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedItem.category || 'N/A'}</div>
                                </div>
                                <div style={{ padding: '10px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Quantity</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedItem.quantity || 0} {selectedItem.unit || 'pcs'}</div>
                                </div>
                                <div style={{ padding: '10px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Price</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Rs. {parseFloat(selectedItem.price || 0).toFixed(2)}</div>
                                </div>
                            </div>
                            {selectedItem.notes && (
                                <div style={{ padding: '10px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Notes</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '4px' }}>{selectedItem.notes}</div>
                                </div>
                            )}
                            <div className="hms-modal-footer">
                                <button onClick={() => { setIsViewOpen(false); openHistoryModal(selectedItem); }} className="btn-primary"><History size={14} /> History</button>
                                <button onClick={() => { setIsViewOpen(false); openEditModal(selectedItem); }} className="btn-edit"><Edit size={14} /> Edit</button>
                                <button onClick={() => { setIsViewOpen(false); openRestockModal(selectedItem); }} className="btn-success"><PackageOpen size={14} /> Restock</button>
                                <button onClick={() => setIsViewOpen(false)} className="btn-cancel">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Restock History Modal */}
            {isHistoryOpen && selectedItem && (
                <div className="hms-modal-backdrop" onClick={() => setIsHistoryOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div className="hms-modal-header">
                            <h3 className="hms-modal-title"><History size={18} style={{ color: '#8B5CF6' }} /> Restock History - {selectedItem.item_name}</h3>
                            <button onClick={() => setIsHistoryOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="hms-modal-body">
                            {selectedHistory.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}><div style={{ fontSize: '3rem', marginBottom: '12px' }}>📦</div><h3>No Restock History</h3><p>This item has not been restocked yet.</p></div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="hms-table">
                                        <thead>
                                            <tr><th>Date</th><th style={{ textAlign: 'center' }}>Quantity</th><th style={{ textAlign: 'center' }}>Previous Qty</th><th style={{ textAlign: 'center' }}>New Qty</th><th>Reason</th></tr>
                                        </thead>
                                        <tbody>
                                            {selectedHistory.map((movement, index) => (
                                                <tr key={index}>
                                                    <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(movement.created_at).toLocaleString()}</td>
                                                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#8B5CF6' }}>+{movement.quantity}</td>
                                                    <td style={{ textAlign: 'center' }}>{movement.previous_quantity}</td>
                                                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#10B981' }}>{movement.new_quantity}</td>
                                                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{movement.reason || 'Restock'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <div className="hms-modal-footer"><button onClick={() => setIsHistoryOpen(false)} className="btn-cancel">Close</button></div>
                    </div>
                </div>
            )}

            {/* Payment History Modal */}
            {isPaymentHistoryOpen && (
                <div className="hms-modal-backdrop" onClick={() => setIsPaymentHistoryOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div className="hms-modal-header">
                            <h3 className="hms-modal-title"><Wallet size={18} style={{ color: '#10B981' }} /> Payment History</h3>
                            <button onClick={() => setIsPaymentHistoryOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="hms-modal-body">
                            {payments.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}><div style={{ fontSize: '3rem', marginBottom: '12px' }}>💰</div><h3>No Payments Recorded</h3><p>No supplier payments have been recorded yet.</p></div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="hms-table">
                                        <thead>
                                            <tr><th>Supplier</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th><th>Reference</th></tr>
                                        </thead>
                                        <tbody>
                                            {payments.map((payment, index) => (
                                                <tr key={index}>
                                                    <td style={{ fontWeight: 600 }}>{payment.suppliers?.name || 'N/A'}</td>
                                                    <td style={{ fontWeight: 600, color: '#10B981' }}>Rs. {parseFloat(payment.amount).toFixed(2)}</td>
                                                    <td>{payment.payment_method || 'N/A'}</td>
                                                    <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(payment.payment_date).toLocaleDateString()}</td>
                                                    <td><span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 600, background: payment.status === 'paid' ? '#10B98115' : '#F59E0B15', color: payment.status === 'paid' ? '#10B981' : '#F59E0B', border: `1px solid ${payment.status === 'paid' ? '#10B981' : '#F59E0B'}30` }}>{payment.status === 'paid' ? '✅ Paid' : '⏳ Pending'}</span></td>
                                                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{payment.reference || 'N/A'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Total Paid:</span>
                                <span style={{ fontWeight: 700, color: '#10B981', fontSize: '1.1rem' }}>Rs. {stats.totalPaidAmount.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="hms-modal-footer"><button onClick={() => setIsPaymentHistoryOpen(false)} className="btn-cancel">Close</button></div>
                    </div>
                </div>
            )}

            {/* Low Stock Alert Modal */}
            {isLowStockOpen && (
                <div className="hms-modal-backdrop" onClick={() => setIsLowStockOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div className="hms-modal-header">
                            <h3 className="hms-modal-title"><AlertCircle size={18} style={{ color: '#F59E0B' }} /> Low Stock Alert</h3>
                            <button onClick={() => setIsLowStockOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="hms-modal-body">
                            {lowStockItems.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}><div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div><h3>All items are well stocked!</h3><p>No low stock items found.</p></div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="hms-table">
                                        <thead>
                                            <tr><th>Item</th><th>Category</th><th style={{ textAlign: 'center' }}>Current Qty</th><th style={{ textAlign: 'center' }}>Min Qty</th><th style={{ textAlign: 'center' }}>Status</th><th style={{ textAlign: 'right' }}>Action</th></tr>
                                        </thead>
                                        <tbody>
                                            {lowStockItems.map(item => {
                                                const status = getStockStatus(item);
                                                return (
                                                    <tr key={item.id}>
                                                        <td style={{ fontWeight: 600 }}>{item.item_name}</td>
                                                        <td>{item.category || 'N/A'}</td>
                                                        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                                        <td style={{ textAlign: 'center' }}>{item.minimum_quantity}</td>
                                                        <td style={{ textAlign: 'center' }}><span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 600, background: status.bg, color: status.color, border: `1px solid ${status.color}30` }}>{status.icon} {status.label}</span></td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <button onClick={() => { setIsLowStockOpen(false); openRestockModal(item); }} className="btn-primary" style={{ padding: '4px 12px', fontSize: '0.7rem' }}><PackageOpen size={14} /> Restock</button>
                                                            <button onClick={() => { setIsLowStockOpen(false); openHistoryModal(item); }} className="btn-edit" style={{ padding: '4px 12px', fontSize: '0.7rem', marginLeft: '4px' }}><History size={14} /> History</button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <div className="hms-modal-footer"><button onClick={() => setIsLowStockOpen(false)} className="btn-cancel">Close</button></div>
                    </div>
                </div>
            )}

            <style>{`
                .spinner { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

                .hms-modal-backdrop {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.6); z-index: 9999;
                    display: flex; align-items: center; justify-content: center;
                    padding: 20px; backdrop-filter: blur(4px); animation: fadeIn 0.3s ease;
                }

                .hms-modal {
                    background: var(--card-bg); border-radius: 16px;
                    max-width: 700px; width: 100%; max-height: 90vh;
                    display: flex; flex-direction: column;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    border: 1px solid var(--border-color); margin: 16px;
                    animation: fadeIn 0.3s ease;
                }

                .hms-modal-header {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 16px 20px; border-bottom: 1px solid var(--border-color);
                    background: var(--bg-primary); border-radius: 16px 16px 0 0;
                    flex-shrink: 0;
                }

                .hms-modal-title {
                    font-size: 1rem; font-weight: 600; margin: 0;
                    display: flex; align-items: center; gap: 8px;
                    color: var(--text-primary);
                }

                .hms-modal-body {
                    padding: 20px; overflow-y: auto; flex: 1;
                }

                .hms-modal-footer {
                    display: flex; justify-content: flex-end; gap: 8px;
                    padding: 14px 20px; border-top: 1px solid var(--border-color);
                    background: var(--bg-primary); border-radius: 0 0 16px 16px;
                    flex-shrink: 0; flex-wrap: wrap;
                    margin-top: 16px;
                }

                .hms-table-container {
                    border-radius: 12px; overflow: hidden;
                    background: var(--card-bg); border: 1px solid var(--border-color);
                    box-shadow: var(--shadow-sm);
                }

                .hms-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; min-width: 700px; }
                .hms-table th { padding: 10px 14px; text-align: left; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-secondary); background: var(--bg-primary); border-bottom: 2px solid var(--border-color); }
                .hms-table td { padding: 8px 14px; border-bottom: 1px solid var(--border-color); }
                .hms-table tbody tr:hover { background: var(--hover-bg); }

                .hms-action-btn {
                    padding: 4px 6px; border: 1px solid var(--border-color);
                    border-radius: 6px; background: transparent; cursor: pointer;
                    color: var(--text-secondary); transition: all 0.2s ease;
                    display: inline-flex; align-items: center; gap: 3px;
                }
                .hms-action-btn:hover { border-color: var(--primary-color); color: var(--primary-color); background: rgba(37,99,235,0.04); }
                .hms-action-btn.success:hover { border-color: #8B5CF6; color: #8B5CF6; background: rgba(139,92,246,0.04); }
                .hms-action-btn.danger:hover { border-color: #EF4444; color: #EF4444; background: rgba(239,68,68,0.04); }

                .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                .form-group { margin-bottom: 12px; }
                .form-group label { display: block; font-size: 0.75rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 4px; }
                .form-group input, .form-group select, .form-group textarea {
                    width: 100%; height: 40px; padding: 0 12px;
                    border: 1.5px solid var(--border-color); border-radius: 8px;
                    font-family: var(--font-family); font-size: 0.8rem;
                    background: var(--card-bg); color: var(--text-primary);
                    outline: none; transition: all 0.2s ease;
                }
                .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
                    border-color: var(--primary-color); box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
                }
                .form-group textarea { height: auto; padding: 8px 12px; resize: vertical; }
                .full-width { grid-column: 1 / -1; }
                .error-text { font-size: 0.7rem; color: var(--danger-color); }

                .alert { padding: 10px 14px; border-radius: 8px; display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 0.85rem; }
                .alert-danger { background: #EF444415; border: 1px solid #EF444430; color: #EF4444; }
                .alert-success { background: #22C55E15; border: 1px solid #22C55E30; color: #16A34A; }

                .btn-cancel { padding: 6px 16px; border: 1.5px solid var(--border-color); border-radius: 8px; background: transparent; cursor: pointer; font-size: 0.8rem; font-family: var(--font-family); color: var(--text-secondary); transition: all 0.2s ease; }
                .btn-cancel:hover { background: var(--hover-bg); color: var(--text-primary); }
                .btn-primary { padding: 6px 16px; border: none; border-radius: 8px; background: var(--primary-color); cursor: pointer; font-size: 0.8rem; font-family: var(--font-family); color: white; font-weight: 500; display: flex; align-items: center; gap: 6px; transition: all 0.2s ease; }
                .btn-primary:hover:not(:disabled) { background: var(--primary-hover); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37,99,235,0.25); }
                .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
                .btn-success { padding: 6px 16px; border: none; border-radius: 8px; background: #10B981; cursor: pointer; font-size: 0.8rem; font-family: var(--font-family); color: white; font-weight: 500; display: flex; align-items: center; gap: 6px; transition: all 0.2s ease; }
                .btn-success:hover:not(:disabled) { background: #059669; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16,185,129,0.25); }
                .btn-danger { padding: 6px 16px; border: none; border-radius: 8px; background: var(--danger-color); cursor: pointer; font-size: 0.8rem; font-family: var(--font-family); color: white; font-weight: 500; display: flex; align-items: center; gap: 6px; transition: all 0.2s ease; }
                .btn-danger:hover:not(:disabled) { background: var(--danger-hover); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(239,68,68,0.25); }
                .btn-edit { padding: 6px 16px; border: 1.5px solid var(--border-color); border-radius: 8px; background: transparent; cursor: pointer; font-size: 0.8rem; font-family: var(--font-family); color: var(--text-secondary); display: flex; align-items: center; gap: 6px; transition: all 0.2s ease; }
                .btn-edit:hover { border-color: #22C55E; color: #22C55E; background: rgba(34,197,94,0.04); }

                @media (max-width: 768px) {
                    .hms-modal-backdrop { padding: 0; align-items: flex-end; }
                    .hms-modal { margin: 0; border-radius: 16px 16px 0 0; max-height: 95vh; animation: slideUp 0.3s ease; max-width: 100%; }
                    .hms-modal-header { padding: 12px 16px; }
                    .hms-modal-body { padding: 14px; }
                    .hms-modal-footer { padding: 12px 16px; flex-direction: column; }
                    .hms-modal-footer button { width: 100%; justify-content: center; padding: 12px; }
                    .hms-table { min-width: 500px; font-size: 0.7rem; }
                    .form-grid-2 { grid-template-columns: 1fr; }
                }

                /* Print Styles */
                @media print {
                    .hms-modal-backdrop { display: none !important; }
                    .hms-modal { max-width: 100% !important; box-shadow: none !important; border: none !important; }
                    .hms-modal-header { background: #f8f9fa !important; }
                    .hms-modal-footer { display: none !important; }
                    .btn-edit, .btn-primary, .btn-success, .btn-danger, .btn-cancel { display: none !important; }
                }
            `}</style>
        </DashboardLayout>
    );
};

export default Inventory;