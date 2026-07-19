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
    History, Wallet, List, BarChart3, File, FileBox,
    ChevronUp
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
    // ===== EXPORT FUNCTIONS =====
    // ============================================================

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

    const exportToPDF = () => {
        setExporting(true);
        try {
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
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background-color: #2563EB; color: white; padding: 10px; text-align: left; font-size: 12px; }
                        td { padding: 8px 10px; border-bottom: 1px solid #ddd; font-size: 12px; }
                        .low-stock { color: #F59E0B; font-weight: bold; }
                        .out-of-stock { color: #EF4444; font-weight: bold; }
                        .good-stock { color: #22C55E; font-weight: bold; }
                        .footer { margin-top: 30px; text-align: center; color: #999; font-size: 11px; border-top: 1px solid #ddd; padding-top: 20px; }
                        .stats { margin: 20px 0; padding: 15px; background: #f0f4ff; border-radius: 8px; }
                        .stats span { display: inline-block; margin-right: 30px; font-size: 13px; }
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
        const matchesSearch = searchQuery === '' ||
            item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.suppliers?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

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
        } else if (sortBy === 'supplier') {
            return (a.suppliers?.name || '').localeCompare(b.suppliers?.name || '');
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

    // ============================================================
    // ===== CATEGORY MODAL - INLINE STYLES =====
    // ============================================================
    const CategoryModal = () => (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(4px)'
        }} onClick={() => setIsCategoryOpen(false)}>
            <div style={{
                background: 'var(--card-bg)',
                borderRadius: '16px',
                maxWidth: '450px',
                width: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)',
                margin: '16px',
                overflow: 'hidden'
            }} onClick={(e) => e.stopPropagation()}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    flexShrink: 0
                }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Layers size={18} style={{ color: '#8B5CF6' }} /> Add Category
                    </h3>
                    <button onClick={() => setIsCategoryOpen(false)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-secondary)', padding: '4px', borderRadius: '6px'
                    }}>
                        <X size={18} />
                    </button>
                </div>
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                    {errorMsg && <div style={{ padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.85rem', background: '#EF444415', border: '1px solid #EF444430', color: '#EF4444' }}><AlertCircle size={16} /> {errorMsg}</div>}
                    {successMsg && <div style={{ padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.85rem', background: '#22C55E15', border: '1px solid #22C55E30', color: '#16A34A' }}><Check size={16} /> {successMsg}</div>}
                    <form onSubmit={handleCategorySubmit}>
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Category Name *</label>
                            <input type="text" name="name" value={categoryForm.name} onChange={handleCategoryChange} placeholder="e.g. Surgical Supplies" required style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Description</label>
                            <input type="text" name="description" value={categoryForm.description} onChange={handleCategoryChange} placeholder="Category description" style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Color</label>
                            <input type="color" name="color" value={categoryForm.color} onChange={handleCategoryChange} style={{ width: '100%', height: '40px', padding: '4px', cursor: 'pointer', border: '1.5px solid var(--border-color)', borderRadius: '8px', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '8px',
                            paddingTop: '14px',
                            borderTop: '1px solid var(--border-color)',
                            marginTop: '8px',
                            flexWrap: 'wrap'
                        }}>
                            <button type="button" onClick={() => setIsCategoryOpen(false)} style={{ padding: '6px 16px', border: '1.5px solid var(--border-color)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-family)', color: 'var(--text-secondary)' }}>Cancel</button>
                            <button type="submit" disabled={actionLoading} style={{ padding: '6px 16px', border: 'none', borderRadius: '8px', background: actionLoading ? 'var(--primary-color)70' : 'var(--primary-color)', cursor: actionLoading ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-family)', color: 'white', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Layers size={14} /> {actionLoading ? 'Adding...' : 'Add Category'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );

    // ============================================================
    // ===== SUPPLIER MODAL - INLINE STYLES =====
    // ============================================================
    const SupplierModal = () => (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(4px)'
        }} onClick={() => setIsSupplierOpen(false)}>
            <div style={{
                background: 'var(--card-bg)',
                borderRadius: '16px',
                maxWidth: '550px',
                width: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)',
                margin: '16px',
                overflow: 'hidden'
            }} onClick={(e) => e.stopPropagation()}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    flexShrink: 0
                }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Truck size={18} style={{ color: '#8B5CF6' }} /> Add Supplier
                    </h3>
                    <button onClick={() => setIsSupplierOpen(false)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-secondary)', padding: '4px', borderRadius: '6px'
                    }}>
                        <X size={18} />
                    </button>
                </div>
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                    {errorMsg && <div style={{ padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.85rem', background: '#EF444415', border: '1px solid #EF444430', color: '#EF4444' }}><AlertCircle size={16} /> {errorMsg}</div>}
                    {successMsg && <div style={{ padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.85rem', background: '#22C55E15', border: '1px solid #22C55E30', color: '#16A34A' }}><Check size={16} /> {successMsg}</div>}
                    <form onSubmit={handleSupplierSubmit}>
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Supplier Name *</label>
                            <input type="text" name="name" value={supplierForm.name} onChange={handleSupplierChange} placeholder="e.g. MediCare Supplies" required style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Contact Person</label>
                            <input type="text" name="contact_person" value={supplierForm.contact_person} onChange={handleSupplierChange} placeholder="e.g. Mr. Ahmed" style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Phone</label>
                                <input type="text" name="phone" value={supplierForm.phone} onChange={handleSupplierChange} placeholder="e.g. 051-1234567" style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Email</label>
                                <input type="email" name="email" value={supplierForm.email} onChange={handleSupplierChange} placeholder="info@supplier.com" style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Address</label>
                            <input type="text" name="address" value={supplierForm.address} onChange={handleSupplierChange} placeholder="Complete address" style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>City</label>
                                <input type="text" name="city" value={supplierForm.city} onChange={handleSupplierChange} placeholder="e.g. Islamabad" style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Payment Terms</label>
                                <input type="text" name="payment_terms" value={supplierForm.payment_terms} onChange={handleSupplierChange} placeholder="e.g. Net 30 days" style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '8px',
                            paddingTop: '14px',
                            borderTop: '1px solid var(--border-color)',
                            marginTop: '8px',
                            flexWrap: 'wrap'
                        }}>
                            <button type="button" onClick={() => setIsSupplierOpen(false)} style={{ padding: '6px 16px', border: '1.5px solid var(--border-color)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-family)', color: 'var(--text-secondary)' }}>Cancel</button>
                            <button type="submit" disabled={actionLoading} style={{ padding: '6px 16px', border: 'none', borderRadius: '8px', background: actionLoading ? 'var(--primary-color)70' : 'var(--primary-color)', cursor: actionLoading ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-family)', color: 'white', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Truck size={14} /> {actionLoading ? 'Adding...' : 'Add Supplier'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );

    // ============================================================
    // ===== ADD ITEM MODAL - INLINE STYLES =====
    // ============================================================
    const AddItemModal = () => (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(4px)'
        }} onClick={() => setIsAddOpen(false)}>
            <div style={{
                background: 'var(--card-bg)',
                borderRadius: '16px',
                maxWidth: '700px',
                width: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)',
                margin: '16px',
                overflow: 'hidden'
            }} onClick={(e) => e.stopPropagation()}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    flexShrink: 0
                }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Package size={18} style={{ color: 'var(--primary-color)' }} /> Add Inventory Item
                    </h3>
                    <button onClick={() => setIsAddOpen(false)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-secondary)', padding: '4px', borderRadius: '6px'
                    }}>
                        <X size={18} />
                    </button>
                </div>
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                    {errorMsg && <div style={{ padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.85rem', background: '#EF444415', border: '1px solid #EF444430', color: '#EF4444' }}><AlertCircle size={16} /> {errorMsg}</div>}
                    {successMsg && <div style={{ padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.85rem', background: '#22C55E15', border: '1px solid #22C55E30', color: '#16A34A' }}><Check size={16} /> {successMsg}</div>}
                    <form onSubmit={handleAddSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Item Name *</label>
                                <input type="text" name="item_name" value={formData.item_name} onChange={handleFormChange} required placeholder="Enter item name" style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                                {formErrors.item_name && <span style={{ fontSize: '0.7rem', color: 'var(--danger-color)', display: 'block', marginTop: '4px' }}>{formErrors.item_name}</span>}
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Category *</label>
                                <select name="category" value={formData.category} onChange={handleFormChange} required style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}>
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                                {formErrors.category && <span style={{ fontSize: '0.7rem', color: 'var(--danger-color)', display: 'block', marginTop: '4px' }}>{formErrors.category}</span>}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Quantity *</label>
                                <input type="number" name="quantity" value={formData.quantity} onChange={handleFormChange} min="0" required placeholder="0" style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                                {formErrors.quantity && <span style={{ fontSize: '0.7rem', color: 'var(--danger-color)', display: 'block', marginTop: '4px' }}>{formErrors.quantity}</span>}
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Minimum Quantity</label>
                                <input type="number" name="minimum_quantity" value={formData.minimum_quantity} onChange={handleFormChange} min="0" placeholder="10" style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Selling Price (Rs.) *</label>
                                <input type="number" name="price" value={formData.price} onChange={handleFormChange} step="0.01" min="0" required placeholder="0.00" style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                                {formErrors.price && <span style={{ fontSize: '0.7rem', color: 'var(--danger-color)', display: 'block', marginTop: '4px' }}>{formErrors.price}</span>}
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Cost Price (Rs.)</label>
                                <input type="number" name="cost_price" value={formData.cost_price} onChange={handleFormChange} step="0.01" min="0" placeholder="0.00" style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Unit</label>
                                <select name="unit" value={formData.unit} onChange={handleFormChange} style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}>
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
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Supplier</label>
                                <select name="supplier_id" value={formData.supplier_id} onChange={handleFormChange} style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}>
                                    <option value="">Select Supplier</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Location</label>
                                <input type="text" name="location" value={formData.location} onChange={handleFormChange} placeholder="e.g. Store Room A, Shelf 3" style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Batch Number</label>
                                <input type="text" name="batch_number" value={formData.batch_number} onChange={handleFormChange} placeholder="e.g. BATCH-2024-001" style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Expiry Date</label>
                                <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleFormChange} style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Reorder Point</label>
                                <input type="number" name="reorder_point" value={formData.reorder_point} onChange={handleFormChange} min="0" placeholder="5" style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Description / Notes</label>
                            <textarea name="notes" value={formData.notes} onChange={handleFormChange} placeholder="Additional notes..." rows={isMobile ? 2 : 3} style={{ width: '100%', padding: '8px 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', resize: 'vertical', minHeight: '60px' }} />
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '8px',
                            paddingTop: '14px',
                            borderTop: '1px solid var(--border-color)',
                            marginTop: '8px',
                            flexWrap: 'wrap'
                        }}>
                            <button type="button" onClick={() => setIsAddOpen(false)} style={{ padding: '6px 16px', border: '1.5px solid var(--border-color)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-family)', color: 'var(--text-secondary)' }}>Cancel</button>
                            <button type="submit" disabled={actionLoading} style={{ padding: '6px 16px', border: 'none', borderRadius: '8px', background: actionLoading ? 'var(--primary-color)70' : 'var(--primary-color)', cursor: actionLoading ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-family)', color: 'white', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Package size={14} /> {actionLoading ? 'Adding...' : 'Add Item'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );

    // ============================================================
    // ===== EDIT ITEM MODAL - INLINE STYLES =====
    // ============================================================
    const EditItemModal = () => (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(4px)'
        }} onClick={() => setIsEditOpen(false)}>
            <div style={{
                background: 'var(--card-bg)',
                borderRadius: '16px',
                maxWidth: '700px',
                width: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)',
                margin: '16px',
                overflow: 'hidden'
            }} onClick={(e) => e.stopPropagation()}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    flexShrink: 0
                }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Edit size={18} style={{ color: '#22C55E' }} /> Edit Item
                    </h3>
                    <button onClick={() => setIsEditOpen(false)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-secondary)', padding: '4px', borderRadius: '6px'
                    }}>
                        <X size={18} />
                    </button>
                </div>
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                    {errorMsg && <div style={{ padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.85rem', background: '#EF444415', border: '1px solid #EF444430', color: '#EF4444' }}><AlertCircle size={16} /> {errorMsg}</div>}
                    {successMsg && <div style={{ padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.85rem', background: '#22C55E15', border: '1px solid #22C55E30', color: '#16A34A' }}><Check size={16} /> {successMsg}</div>}
                    <form onSubmit={handleEditSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Item Name *</label>
                                <input type="text" name="item_name" value={formData.item_name} onChange={handleFormChange} required placeholder="Enter item name" style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                                {formErrors.item_name && <span style={{ fontSize: '0.7rem', color: 'var(--danger-color)', display: 'block', marginTop: '4px' }}>{formErrors.item_name}</span>}
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Category *</label>
                                <select name="category" value={formData.category} onChange={handleFormChange} required style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}>
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                                {formErrors.category && <span style={{ fontSize: '0.7rem', color: 'var(--danger-color)', display: 'block', marginTop: '4px' }}>{formErrors.category}</span>}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Quantity *</label>
                                <input type="number" name="quantity" value={formData.quantity} onChange={handleFormChange} min="0" required placeholder="0" style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                                {formErrors.quantity && <span style={{ fontSize: '0.7rem', color: 'var(--danger-color)', display: 'block', marginTop: '4px' }}>{formErrors.quantity}</span>}
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Minimum Quantity</label>
                                <input type="number" name="minimum_quantity" value={formData.minimum_quantity} onChange={handleFormChange} min="0" placeholder="10" style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Selling Price (Rs.) *</label>
                                <input type="number" name="price" value={formData.price} onChange={handleFormChange} step="0.01" min="0" required placeholder="0.00" style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                                {formErrors.price && <span style={{ fontSize: '0.7rem', color: 'var(--danger-color)', display: 'block', marginTop: '4px' }}>{formErrors.price}</span>}
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Cost Price (Rs.)</label>
                                <input type="number" name="cost_price" value={formData.cost_price} onChange={handleFormChange} step="0.01" min="0" placeholder="0.00" style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Notes</label>
                            <textarea name="notes" value={formData.notes} onChange={handleFormChange} rows={isMobile ? 2 : 3} placeholder="Additional notes..." style={{ width: '100%', padding: '8px 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', resize: 'vertical', minHeight: '60px' }} />
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '8px',
                            paddingTop: '14px',
                            borderTop: '1px solid var(--border-color)',
                            marginTop: '8px',
                            flexWrap: 'wrap'
                        }}>
                            <button type="button" onClick={() => setIsEditOpen(false)} style={{ padding: '6px 16px', border: '1.5px solid var(--border-color)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-family)', color: 'var(--text-secondary)' }}>Cancel</button>
                            <button type="submit" disabled={actionLoading} style={{ padding: '6px 16px', border: 'none', borderRadius: '8px', background: actionLoading ? 'var(--primary-color)70' : 'var(--primary-color)', cursor: actionLoading ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-family)', color: 'white', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Save size={14} /> {actionLoading ? 'Saving...' : 'Update Item'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );

    // ============================================================
    // ===== RESTOCK MODAL - INLINE STYLES =====
    // ============================================================
    const RestockModal = () => (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(4px)'
        }} onClick={() => setIsRestockOpen(false)}>
            <div style={{
                background: 'var(--card-bg)',
                borderRadius: '16px',
                maxWidth: '450px',
                width: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)',
                margin: '16px',
                overflow: 'hidden'
            }} onClick={(e) => e.stopPropagation()}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    flexShrink: 0
                }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <PackageOpen size={18} style={{ color: '#8B5CF6' }} /> Restock Item
                    </h3>
                    <button onClick={() => setIsRestockOpen(false)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-secondary)', padding: '4px', borderRadius: '6px'
                    }}>
                        <X size={18} />
                    </button>
                </div>
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                    {errorMsg && <div style={{ padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.85rem', background: '#EF444415', border: '1px solid #EF444430', color: '#EF4444' }}><AlertCircle size={16} /> {errorMsg}</div>}
                    <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Item</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedItem?.item_name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Quantity</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedItem?.quantity || 0} {selectedItem?.unit || 'pcs'}</span>
                        </div>
                    </div>
                    <form onSubmit={handleRestockSubmit}>
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>Add Quantity *</label>
                            <input type="number" value={restockQty} onChange={(e) => setRestockQty(e.target.value)} placeholder="Enter quantity to add" min="1" required style={{ width: '100%', height: '40px', padding: '0 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontFamily: 'var(--font-family)', fontSize: isMobile ? '1rem' : '1.1rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '8px',
                            paddingTop: '14px',
                            borderTop: '1px solid var(--border-color)',
                            marginTop: '8px',
                            flexWrap: 'wrap'
                        }}>
                            <button type="button" onClick={() => setIsRestockOpen(false)} style={{ padding: '6px 16px', border: '1.5px solid var(--border-color)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-family)', color: 'var(--text-secondary)' }}>Cancel</button>
                            <button type="submit" disabled={actionLoading} style={{ padding: '6px 16px', border: 'none', borderRadius: '8px', background: actionLoading ? 'var(--primary-color)70' : 'var(--primary-color)', cursor: actionLoading ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-family)', color: 'white', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <PackageOpen size={14} /> {actionLoading ? 'Restocking...' : 'Confirm Restock'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );

    // ============================================================
    // ===== DELETE MODAL - INLINE STYLES =====
    // ============================================================
    const DeleteModal = () => (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(4px)'
        }} onClick={() => setIsDeleteOpen(false)}>
            <div style={{
                background: 'var(--card-bg)',
                borderRadius: '16px',
                maxWidth: '400px',
                width: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)',
                margin: '16px',
                overflow: 'hidden'
            }} onClick={(e) => e.stopPropagation()}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    flexShrink: 0
                }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Trash2 size={18} style={{ color: 'var(--danger-color)' }} /> Delete Item
                    </h3>
                    <button onClick={() => setIsDeleteOpen(false)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-secondary)', padding: '4px', borderRadius: '6px'
                    }}>
                        <X size={18} />
                    </button>
                </div>
                <div style={{ padding: '20px', textAlign: 'center', overflowY: 'auto', flex: 1 }}>
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚠️</div>
                    <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '8px' }}>Are you sure you want to delete this item?</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Item: <strong>{selectedItem?.item_name}</strong><br />Category: <strong>{selectedItem?.category || 'N/A'}</strong><br />Quantity: <strong>{selectedItem?.quantity || 0} units</strong></p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '8px' }}>This action cannot be undone.</p>
                </div>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '14px 20px',
                    borderTop: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    flexWrap: 'wrap'
                }}>
                    <button type="button" onClick={() => setIsDeleteOpen(false)} style={{ padding: '6px 16px', border: '1.5px solid var(--border-color)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-family)', color: 'var(--text-secondary)' }}>Cancel</button>
                    <button onClick={handleDeleteSubmit} disabled={actionLoading} style={{ padding: '6px 16px', border: 'none', borderRadius: '8px', background: actionLoading ? 'var(--danger-color)70' : 'var(--danger-color)', cursor: actionLoading ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-family)', color: 'white', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Trash2 size={14} /> {actionLoading ? 'Deleting...' : 'Delete Permanently'}
                    </button>
                </div>
            </div>
        </div>
    );

    // ============================================================
    // ===== VIEW ITEM MODAL - INLINE STYLES =====
    // ============================================================
    const ViewItemModal = () => (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(4px)'
        }} onClick={() => setIsViewOpen(false)}>
            <div style={{
                background: 'var(--card-bg)',
                borderRadius: '16px',
                maxWidth: '550px',
                width: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)',
                margin: '16px',
                overflow: 'hidden'
            }} onClick={(e) => e.stopPropagation()}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    flexShrink: 0
                }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Package size={18} style={{ color: 'var(--primary-color)' }} /> Item Details
                    </h3>
                    <button onClick={() => setIsViewOpen(false)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-secondary)', padding: '4px', borderRadius: '6px'
                    }}>
                        <X size={18} />
                    </button>
                </div>
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                        <div style={{ padding: '10px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Item Name</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedItem?.item_name}</div>
                        </div>
                        <div style={{ padding: '10px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Category</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedItem?.category || 'N/A'}</div>
                        </div>
                        <div style={{ padding: '10px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Quantity</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedItem?.quantity || 0} {selectedItem?.unit || 'pcs'}</div>
                        </div>
                        <div style={{ padding: '10px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Price</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Rs. {parseFloat(selectedItem?.price || 0).toFixed(2)}</div>
                        </div>
                    </div>
                    {selectedItem?.notes && (
                        <div style={{ padding: '10px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Notes</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '4px' }}>{selectedItem.notes}</div>
                        </div>
                    )}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '8px',
                        paddingTop: '14px',
                        borderTop: '1px solid var(--border-color)',
                        marginTop: '8px',
                        flexWrap: 'wrap'
                    }}>
                        <button onClick={() => { setIsViewOpen(false); openHistoryModal(selectedItem); }} style={{ padding: '6px 16px', border: 'none', borderRadius: '8px', background: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-family)', color: 'white', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}><History size={14} /> History</button>
                        <button onClick={() => { setIsViewOpen(false); openEditModal(selectedItem); }} style={{ padding: '6px 16px', border: '1.5px solid var(--border-color)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-family)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}><Edit size={14} /> Edit</button>
                        <button onClick={() => { setIsViewOpen(false); openRestockModal(selectedItem); }} style={{ padding: '6px 16px', border: 'none', borderRadius: '8px', background: '#10B981', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-family)', color: 'white', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}><PackageOpen size={14} /> Restock</button>
                        <button onClick={() => setIsViewOpen(false)} style={{ padding: '6px 16px', border: '1.5px solid var(--border-color)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-family)', color: 'var(--text-secondary)' }}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    );

    // ============================================================
    // ===== RESTOCK HISTORY MODAL - INLINE STYLES =====
    // ============================================================
    const HistoryModal = () => (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(4px)'
        }} onClick={() => setIsHistoryOpen(false)}>
            <div style={{
                background: 'var(--card-bg)',
                borderRadius: '16px',
                maxWidth: '700px',
                width: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)',
                margin: '16px',
                overflow: 'hidden'
            }} onClick={(e) => e.stopPropagation()}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    flexShrink: 0
                }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <History size={18} style={{ color: '#8B5CF6' }} /> Restock History - {selectedItem?.item_name}
                    </h3>
                    <button onClick={() => setIsHistoryOpen(false)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-secondary)', padding: '4px', borderRadius: '6px'
                    }}>
                        <X size={18} />
                    </button>
                </div>
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                    {selectedHistory.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}><div style={{ fontSize: '3rem', marginBottom: '12px' }}>📦</div><h3>No Restock History</h3><p>This item has not been restocked yet.</p></div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: isMobile ? '400px' : '600px' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>Date</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>Quantity</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>Previous Qty</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>New Qty</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>Reason</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedHistory.map((movement, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '8px 14px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(movement.created_at).toLocaleString()}</td>
                                            <td style={{ padding: '8px 14px', textAlign: 'center', fontWeight: 600, color: '#8B5CF6' }}>+{movement.quantity}</td>
                                            <td style={{ padding: '8px 14px', textAlign: 'center' }}>{movement.previous_quantity}</td>
                                            <td style={{ padding: '8px 14px', textAlign: 'center', fontWeight: 600, color: '#10B981' }}>{movement.new_quantity}</td>
                                            <td style={{ padding: '8px 14px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{movement.reason || 'Restock'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    padding: '14px 20px',
                    borderTop: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)'
                }}>
                    <button onClick={() => setIsHistoryOpen(false)} style={{ padding: '6px 16px', border: '1.5px solid var(--border-color)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-family)', color: 'var(--text-secondary)' }}>Close</button>
                </div>
            </div>
        </div>
    );

    // ============================================================
    // ===== PAYMENT HISTORY MODAL - INLINE STYLES =====
    // ============================================================
    const PaymentHistoryModal = () => (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(4px)'
        }} onClick={() => setIsPaymentHistoryOpen(false)}>
            <div style={{
                background: 'var(--card-bg)',
                borderRadius: '16px',
                maxWidth: '700px',
                width: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)',
                margin: '16px',
                overflow: 'hidden'
            }} onClick={(e) => e.stopPropagation()}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    flexShrink: 0
                }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Wallet size={18} style={{ color: '#10B981' }} /> Payment History
                    </h3>
                    <button onClick={() => setIsPaymentHistoryOpen(false)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-secondary)', padding: '4px', borderRadius: '6px'
                    }}>
                        <X size={18} />
                    </button>
                </div>
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                    {payments.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}><div style={{ fontSize: '3rem', marginBottom: '12px' }}>💰</div><h3>No Payments Recorded</h3><p>No supplier payments have been recorded yet.</p></div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: isMobile ? '400px' : '600px' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>Supplier</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>Amount</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>Method</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>Date</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>Status</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>Reference</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((payment, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '8px 14px', fontWeight: 600 }}>{payment.suppliers?.name || 'N/A'}</td>
                                            <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 600, color: '#10B981' }}>Rs. {parseFloat(payment.amount).toFixed(2)}</td>
                                            <td style={{ padding: '8px 14px', textAlign: 'center' }}>{payment.payment_method || 'N/A'}</td>
                                            <td style={{ padding: '8px 14px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(payment.payment_date).toLocaleDateString()}</td>
                                            <td style={{ padding: '8px 14px', textAlign: 'center' }}><span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 600, background: payment.status === 'paid' ? '#10B98115' : '#F59E0B15', color: payment.status === 'paid' ? '#10B981' : '#F59E0B', border: `1px solid ${payment.status === 'paid' ? '#10B981' : '#F59E0B'}30` }}>{payment.status === 'paid' ? '✅ Paid' : '⏳ Pending'}</span></td>
                                            <td style={{ padding: '8px 14px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{payment.reference || 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Total Paid:</span>
                        <span style={{ fontWeight: 700, color: '#10B981', fontSize: isMobile ? '0.9rem' : '1.1rem' }}>Rs. {stats.totalPaidAmount.toFixed(2)}</span>
                    </div>
                </div>
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    padding: '14px 20px',
                    borderTop: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)'
                }}>
                    <button onClick={() => setIsPaymentHistoryOpen(false)} style={{ padding: '6px 16px', border: '1.5px solid var(--border-color)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-family)', color: 'var(--text-secondary)' }}>Close</button>
                </div>
            </div>
        </div>
    );

    // ============================================================
    // ===== LOW STOCK ALERT MODAL - INLINE STYLES =====
    // ============================================================
    const LowStockModal = () => (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(4px)'
        }} onClick={() => setIsLowStockOpen(false)}>
            <div style={{
                background: 'var(--card-bg)',
                borderRadius: '16px',
                maxWidth: '700px',
                width: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)',
                margin: '16px',
                overflow: 'hidden'
            }} onClick={(e) => e.stopPropagation()}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    flexShrink: 0
                }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={18} style={{ color: '#F59E0B' }} /> Low Stock Alert
                    </h3>
                    <button onClick={() => setIsLowStockOpen(false)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-secondary)', padding: '4px', borderRadius: '6px'
                    }}>
                        <X size={18} />
                    </button>
                </div>
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                    {lowStockItems.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}><div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div><h3>All items are well stocked!</h3><p>No low stock items found.</p></div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: isMobile ? '400px' : '600px' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>Item</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>Category</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>Current Qty</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>Min Qty</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>Status</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lowStockItems.map(item => {
                                        const status = getStockStatus(item);
                                        return (
                                            <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '8px 14px', fontWeight: 600 }}>{item.item_name}</td>
                                                <td style={{ padding: '8px 14px' }}>{item.category || 'N/A'}</td>
                                                <td style={{ padding: '8px 14px', textAlign: 'center' }}>{item.quantity}</td>
                                                <td style={{ padding: '8px 14px', textAlign: 'center' }}>{item.minimum_quantity}</td>
                                                <td style={{ padding: '8px 14px', textAlign: 'center' }}><span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 600, background: status.bg, color: status.color, border: `1px solid ${status.color}30` }}>{status.icon} {status.label}</span></td>
                                                <td style={{ padding: '8px 14px', textAlign: 'right' }}>
                                                    <button onClick={() => { setIsLowStockOpen(false); openRestockModal(item); }} style={{ padding: '4px 12px', fontSize: '0.7rem', border: 'none', borderRadius: '6px', background: 'var(--primary-color)', cursor: 'pointer', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><PackageOpen size={14} /> Restock</button>
                                                    <button onClick={() => { setIsLowStockOpen(false); openHistoryModal(item); }} style={{ padding: '4px 12px', fontSize: '0.7rem', border: '1.5px solid var(--border-color)', borderRadius: '6px', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}><History size={14} /> History</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    padding: '14px 20px',
                    borderTop: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)'
                }}>
                    <button onClick={() => setIsLowStockOpen(false)} style={{ padding: '6px 16px', border: '1.5px solid var(--border-color)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-family)', color: 'var(--text-secondary)' }}>Close</button>
                </div>
            </div>
        </div>
    );

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
                    {notificationType === 'success' ? <Check size={20} style={{ flexShrink: 0 }} /> : <AlertCircle size={20} style={{ flexShrink: 0 }} />}
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{notificationMessage}</span>
                    <button onClick={() => setShowNotification(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '4px', marginLeft: 'auto', opacity: 0.8 }}><X size={18} /></button>
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

                    {/* EXPORT BUTTON */}
                    <div style={{ position: 'relative', flex: isMobile ? 1 : 'none' }}>
                        <button onClick={() => setShowExportMenu(!showExportMenu)} disabled={exporting} style={{
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
                            {exporting ? <Loader size={14} className="spinner" /> : <Download size={14} />}
                            {isMobile ? 'Export' : 'Export'} <ChevronDown size={12} />
                        </button>

                        {showExportMenu && !exporting && (
                            <div style={{
                                position: 'absolute', top: '100%', right: 0,
                                marginTop: '4px', background: 'var(--card-bg)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '10px', boxShadow: 'var(--shadow-lg)',
                                minWidth: isMobile ? '160px' : '200px',
                                zIndex: 100, padding: '6px 0',
                                animation: 'slideDown 0.2s ease'
                            }}>
                                <button onClick={exportToCSV} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '8px 14px', width: '100%', border: 'none',
                                    background: 'transparent', cursor: 'pointer',
                                    fontSize: '0.75rem', fontFamily: 'var(--font-family)',
                                    color: 'var(--text-primary)',
                                    transition: 'all 0.15s ease'
                                }}
                                    onMouseEnter={(e) => e.target.style.background = 'var(--hover-bg)'}
                                    onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                                    <FileText size={16} style={{ color: '#3B82F6' }} /><span>CSV</span>
                                </button>
                                <button onClick={exportToExcel} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '8px 14px', width: '100%', border: 'none',
                                    background: 'transparent', cursor: 'pointer',
                                    fontSize: '0.75rem', fontFamily: 'var(--font-family)',
                                    color: 'var(--text-primary)',
                                    transition: 'all 0.15s ease'
                                }}
                                    onMouseEnter={(e) => e.target.style.background = 'var(--hover-bg)'}
                                    onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                                    <FileSpreadsheet size={16} style={{ color: '#22C55E' }} /><span>Excel</span>
                                </button>
                                <button onClick={exportToPDF} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '8px 14px', width: '100%', border: 'none',
                                    background: 'transparent', cursor: 'pointer',
                                    fontSize: '0.75rem', fontFamily: 'var(--font-family)',
                                    color: 'var(--text-primary)',
                                    transition: 'all 0.15s ease'
                                }}
                                    onMouseEnter={(e) => e.target.style.background = 'var(--hover-bg)'}
                                    onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                                    <FileBox size={16} style={{ color: '#EF4444' }} /><span>PDF</span>
                                </button>
                                <button onClick={exportToJSON} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '8px 14px', width: '100%', border: 'none',
                                    background: 'transparent', cursor: 'pointer',
                                    fontSize: '0.75rem', fontFamily: 'var(--font-family)',
                                    color: 'var(--text-primary)',
                                    transition: 'all 0.15s ease'
                                }}
                                    onMouseEnter={(e) => e.target.style.background = 'var(--hover-bg)'}
                                    onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                                    <FileJson size={16} style={{ color: '#8B5CF6' }} /><span>JSON</span>
                                </button>
                                <div style={{ borderTop: '1px solid var(--border-color)', margin: '4px 8px' }} />
                                <button onClick={printReport} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '8px 14px', width: '100%', border: 'none',
                                    background: 'transparent', cursor: 'pointer',
                                    fontSize: '0.75rem', fontFamily: 'var(--font-family)',
                                    color: 'var(--text-primary)',
                                    transition: 'all 0.15s ease'
                                }}
                                    onMouseEnter={(e) => e.target.style.background = 'var(--hover-bg)'}
                                    onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                                    <Printer size={16} style={{ color: '#F59E0B' }} /><span>Print</span>
                                </button>
                                <button onClick={() => setShowExportMenu(false)} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '8px 14px', width: '100%', border: 'none',
                                    background: 'transparent', cursor: 'pointer',
                                    fontSize: '0.75rem', fontFamily: 'var(--font-family)',
                                    color: 'var(--text-secondary)',
                                    borderTop: '1px solid var(--border-color)',
                                    marginTop: '4px', paddingTop: '8px',
                                    transition: 'all 0.15s ease'
                                }}
                                    onMouseEnter={(e) => { e.target.style.background = 'var(--hover-bg)'; e.target.style.color = 'var(--text-primary)'; }}
                                    onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--text-secondary)'; }}>
                                    <X size={16} /><span>Close</span>
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
                        flex: isMobile ? 1 : 'none', justifyContent: 'center'
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
                        flex: isMobile ? 1 : 'none', justifyContent: 'center'
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

            {/* ===== FILTERS BAR ===== */}
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
                        placeholder="Search items, category, supplier..."
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
                        onClick={() => setShowFilters(!showFilters)}
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
                        {activeFilterCount > 0 && (
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
                                {activeFilterCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={openAddModal}
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
                        <Plus size={14} /> New Item
                    </button>
                </div>
            </div>

            {/* ===== FILTERS DROPDOWN ===== */}
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
                    alignItems: 'center',
                    animation: 'fadeIn 0.2s ease'
                }}>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
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
                            minWidth: '120px',
                            flex: isMobile ? 1 : 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
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
                            minWidth: '110px',
                            flex: isMobile ? 1 : 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                    >
                        <option value="">All Status</option>
                        <option value="good">✅ In Stock</option>
                        <option value="low">⚠️ Low Stock</option>
                        <option value="out">❌ Out of Stock</option>
                    </select>

                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
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
                            minWidth: '130px',
                            flex: isMobile ? 1 : 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                    />

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
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
                            minWidth: '100px',
                            flex: isMobile ? 1 : 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                    >
                        <option value="newest">📅 Newest</option>
                        <option value="oldest">📅 Oldest</option>
                        <option value="name">🔤 By Name</option>
                        <option value="quantity">📦 By Quantity</option>
                        <option value="price">💰 By Price</option>
                        <option value="supplier">👤 By Supplier</option>
                    </select>

                    <button
                        onClick={clearFilters}
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

                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found
                    </span>
                </div>
            )}

            {/* ===== TABLE ===== */}
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
                        <p>
                            {activeFilterCount > 0
                                ? 'Try clearing your filters to see all items.'
                                : 'Start by adding your first inventory item.'}
                        </p>
                        <br />
                        <button onClick={openAddModal} className="btn-primary">
                            <Plus size={16} /> {activeFilterCount > 0 ? 'Clear Filters & Add Item' : 'First Item'}
                        </button>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="hms-table" style={{ minWidth: isMobile ? '500px' : '700px' }}>
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
                                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                    <button onClick={() => openViewModal(item)} className="hms-action-btn" title="View"><Eye size={14} /></button>
                                                    <button onClick={() => openRestockModal(item)} className="hms-action-btn success" title="Restock"><PackageOpen size={14} /></button>
                                                    <button onClick={() => openEditModal(item)} className="hms-action-btn" title="Edit"><Edit size={14} /></button>
                                                    <button onClick={() => openDeleteModal(item)} className="hms-action-btn danger" title="Delete"><Trash2 size={14} /></button>
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

            {/* ===== MODALS ===== */}
            {isCategoryOpen && <CategoryModal />}
            {isSupplierOpen && <SupplierModal />}
            {isAddOpen && <AddItemModal />}
            {isEditOpen && <EditItemModal />}
            {isRestockOpen && <RestockModal />}
            {isDeleteOpen && <DeleteModal />}
            {isViewOpen && <ViewItemModal />}
            {isHistoryOpen && <HistoryModal />}
            {isPaymentHistoryOpen && <PaymentHistoryModal />}
            {isLowStockOpen && <LowStockModal />}

            <style>{`
                .spinner { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

                .hms-table-container {
                    border-radius: 12px;
                    overflow: hidden;
                    background: var(--card-bg);
                    border: 1px solid var(--border-color);
                    box-shadow: var(--shadow-sm);
                }

                .hms-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.8rem;
                    min-width: 700px;
                }

                .hms-table th {
                    padding: 10px 14px;
                    text-align: left;
                    font-size: 0.65rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--text-secondary);
                    background: var(--bg-primary);
                    border-bottom: 2px solid var(--border-color);
                }

                .hms-table td {
                    padding: 8px 14px;
                    border-bottom: 1px solid var(--border-color);
                }

                .hms-table tbody tr:hover {
                    background: var(--hover-bg);
                }

                .hms-action-btn {
                    padding: 4px 6px;
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    background: transparent;
                    cursor: pointer;
                    color: var(--text-secondary);
                    transition: all 0.2s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                }

                .hms-action-btn:hover {
                    border-color: var(--primary-color);
                    color: var(--primary-color);
                    background: rgba(37, 99, 235, 0.04);
                }

                .hms-action-btn.success:hover {
                    border-color: #8B5CF6;
                    color: #8B5CF6;
                    background: rgba(139, 92, 246, 0.04);
                }

                .hms-action-btn.danger:hover {
                    border-color: #EF4444;
                    color: #EF4444;
                    background: rgba(239, 68, 68, 0.04);
                }

                .btn-cancel {
                    padding: 6px 16px;
                    border: 1.5px solid var(--border-color);
                    border-radius: 8px;
                    background: transparent;
                    cursor: pointer;
                    font-size: 0.8rem;
                    font-family: var(--font-family);
                    color: var(--text-secondary);
                    transition: all 0.2s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    justify-content: center;
                }

                .btn-cancel:hover {
                    background: var(--hover-bg);
                    color: var(--text-primary);
                }

                .btn-primary {
                    padding: 6px 16px;
                    border: none;
                    border-radius: 8px;
                    background: var(--primary-color);
                    cursor: pointer;
                    font-size: 0.8rem;
                    font-family: var(--font-family);
                    color: white;
                    font-weight: 500;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.2s ease;
                    justify-content: center;
                }

                .btn-primary:hover:not(:disabled) {
                    background: var(--primary-hover);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
                }

                .btn-primary:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .btn-success {
                    padding: 6px 16px;
                    border: none;
                    border-radius: 8px;
                    background: #10B981;
                    cursor: pointer;
                    font-size: 0.8rem;
                    font-family: var(--font-family);
                    color: white;
                    font-weight: 500;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.2s ease;
                    justify-content: center;
                }

                .btn-success:hover:not(:disabled) {
                    background: #059669;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
                }

                .btn-danger {
                    padding: 6px 16px;
                    border: none;
                    border-radius: 8px;
                    background: var(--danger-color);
                    cursor: pointer;
                    font-size: 0.8rem;
                    font-family: var(--font-family);
                    color: white;
                    font-weight: 500;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.2s ease;
                    justify-content: center;
                }

                .btn-danger:hover:not(:disabled) {
                    background: var(--danger-hover);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
                }

                .btn-edit {
                    padding: 6px 16px;
                    border: 1.5px solid var(--border-color);
                    border-radius: 8px;
                    background: transparent;
                    cursor: pointer;
                    font-size: 0.8rem;
                    font-family: var(--font-family);
                    color: var(--text-secondary);
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.2s ease;
                    justify-content: center;
                }

                .btn-edit:hover {
                    border-color: #22C55E;
                    color: #22C55E;
                    background: rgba(34, 197, 94, 0.04);
                }

                /* ===== RESPONSIVE TABLES ===== */
                @media (max-width: 768px) {
                    .hms-table-container { border-radius: 8px; }
                    .hms-table { min-width: 500px; font-size: 0.7rem; }
                    .hms-table th, .hms-table td { padding: 6px 10px; }
                    .btn-cancel, .btn-primary, .btn-success, .btn-danger, .btn-edit {
                        width: 100%;
                        justify-content: center;
                        padding: 10px 16px;
                    }
                }

                @media (max-width: 480px) {
                    .hms-table { min-width: 400px; font-size: 0.65rem; }
                    .hms-table th, .hms-table td { padding: 4px 8px; }
                    .hms-action-btn { padding: 3px 4px; font-size: 0.6rem; }
                }

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