import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
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
    FileSpreadsheet, FileJson, Activity
} from 'lucide-react';

const Billing = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // ===== STATE =====
    const [invoices, setInvoices] = useState([]);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState('newest');
    const [exporting, setExporting] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    // ===== STATS =====
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalInvoices: 0,
        paidInvoices: 0,
        unpaidInvoices: 0,
        pendingInvoices: 0,
        cancelledInvoices: 0,
        outstandingAmount: 0,
        averageInvoice: 0,
        monthlyRevenue: 0,
        weeklyRevenue: 0,
        revenueChange: 0
    });

    // ===== MODAL STATES =====
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

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
        item_total: '',
        subtotal: 0,
        discount_type: 'percentage',
        discount_value: 0,
        discount_amount: 0,
        tax_type: 'percentage',
        tax_value: 0,
        tax_amount: 0,
        total: 0,
        payment_method: '',
        paid_amount: 0,
        remaining_amount: 0,
        payment_notes: '',
        notes: '',
        billing_address: '',
        billing_phone: '',
        billing_email: '',
        reference: '',
        department: '',
        status: 'pending'
    });

    const [formErrors, setFormErrors] = useState({});
    const [actionLoading, setActionLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // ===== GO BACK =====
    const goBack = () => {
        navigate(-1);
    };

    // ===== OPEN MODALS =====
    const openAddModal = () => {
        const today = new Date();
        const dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + 7);

        setFormData({
            patient_id: '',
            doctor_id: '',
            appointment_id: '',
            invoice_number: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
            invoice_date: today.toISOString().split('T')[0],
            due_date: dueDate.toISOString().split('T')[0],
            items: [],
            item_name: '',
            item_description: '',
            item_quantity: 1,
            item_price: '',
            item_total: '',
            subtotal: 0,
            discount_type: 'percentage',
            discount_value: 0,
            discount_amount: 0,
            tax_type: 'percentage',
            tax_value: 0,
            tax_amount: 0,
            total: 0,
            payment_method: '',
            paid_amount: 0,
            remaining_amount: 0,
            payment_notes: '',
            notes: '',
            billing_address: '',
            billing_phone: '',
            billing_email: '',
            reference: '',
            department: '',
            status: 'pending'
        });
        setFormErrors({});
        setErrorMsg('');
        setSuccessMsg('');
        setIsAddOpen(true);
    };

    const openEditModal = (invoice) => {
        console.log('📝 Opening Edit Modal for invoice:', invoice);
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
            item_total: '',
            subtotal: invoice.subtotal || 0,
            discount_type: invoice.discount_type || 'percentage',
            discount_value: invoice.discount_value || 0,
            discount_amount: invoice.discount_amount || 0,
            tax_type: invoice.tax_type || 'percentage',
            tax_value: invoice.tax_value || 0,
            tax_amount: invoice.tax_amount || 0,
            total: invoice.total || 0,
            payment_method: invoice.payment_method || '',
            paid_amount: invoice.paid_amount || 0,
            remaining_amount: invoice.remaining_amount || 0,
            payment_notes: invoice.payment_notes || '',
            notes: invoice.notes || '',
            billing_address: invoice.billing_address || '',
            billing_phone: invoice.billing_phone || '',
            billing_email: invoice.billing_email || '',
            reference: invoice.reference || '',
            department: invoice.department || '',
            status: invoice.status || 'pending'
        });
        setFormErrors({});
        setErrorMsg('');
        setSuccessMsg('');
        setIsEditOpen(true);
    };

    const openViewModal = (invoice) => {
        setSelectedInvoice(invoice);
        setIsViewOpen(true);
    };

    const openDeleteModal = (invoice) => {
        setSelectedInvoice(invoice);
        setIsDeleteOpen(true);
    };

    const openPaymentModal = (invoice) => {
        setSelectedInvoice(invoice);
        setFormData(prev => ({
            ...prev,
            paid_amount: 0,
            payment_method: 'cash',
            payment_notes: '',
            remaining_amount: parseFloat(invoice.total) || 0
        }));
        setIsPaymentOpen(true);
    };

    // ===== LOAD DATA =====
    const loadData = async () => {
        console.log('🔄 Loading data started...');
        setLoading(true);
        setErrorMsg('');

        try {
            console.log('📊 Fetching invoices...');
            const { data: invoicesData, error: invoicesError } = await supabase
                .from('invoices')
                .select('*')
                .order('invoice_date', { ascending: false });

            if (invoicesError) {
                console.error('❌ Error loading invoices:', invoicesError);
                setErrorMsg('Failed to load invoices: ' + invoicesError.message);
                setInvoices([]);
            } else {
                console.log('✅ Invoices loaded:', invoicesData);
                console.log('📊 Total invoices count:', invoicesData?.length || 0);

                if (invoicesData && invoicesData.length > 0) {
                    const patientIds = [...new Set(invoicesData.map(inv => inv.patient_id).filter(id => id))];
                    console.log('👤 Patient IDs:', patientIds);

                    if (patientIds.length > 0) {
                        const { data: patientsData, error: patientsError } = await supabase
                            .from('patients')
                            .select('id, name, phone, email, address')
                            .in('id', patientIds);

                        if (patientsError) {
                            console.error('❌ Error fetching patients:', patientsError);
                        } else {
                            console.log('✅ Patients fetched:', patientsData);
                            const mergedData = invoicesData.map(inv => ({
                                ...inv,
                                patients: patientsData?.find(p => p.id === inv.patient_id) || null
                            }));
                            console.log('📋 Merged data:', mergedData);
                            setInvoices(mergedData);
                            calculateStats(mergedData);
                        }
                    } else {
                        setInvoices(invoicesData || []);
                        calculateStats(invoicesData || []);
                    }
                } else {
                    setInvoices([]);
                    calculateStats([]);
                }
            }

            // Load patients
            console.log('👤 Fetching patients...');
            const { data: patientsData, error: patientsError } = await supabase
                .from('patients')
                .select('id, name, phone, email, address')
                .order('name');

            if (patientsError) {
                console.error('❌ Error loading patients:', patientsError);
            } else {
                console.log('✅ Patients loaded:', patientsData?.length || 0);
                setPatients(patientsData || []);
            }

            // Load doctors
            const { data: doctorsData, error: doctorsError } = await supabase
                .from('doctors')
                .select('id, name, specialization')
                .order('name');

            if (doctorsError) {
                console.error('❌ Error loading doctors:', doctorsError);
            } else {
                console.log('✅ Doctors loaded:', doctorsData?.length || 0);
                setDoctors(doctorsData || []);
            }

            // Load appointments
            const { data: appointmentsData, error: appointmentsError } = await supabase
                .from('appointments')
                .select('id, patient_id, doctor_id, appointment_date, time_slot, status')
                .order('appointment_date', { ascending: false });

            if (appointmentsError) {
                console.error('❌ Error loading appointments:', appointmentsError);
            } else {
                console.log('✅ Appointments loaded:', appointmentsData?.length || 0);
                setAppointments(appointmentsData || []);
            }

        } catch (err) {
            console.error('❌ Error loading data:', err);
            setErrorMsg('Failed to load data: ' + err.message);
        } finally {
            setLoading(false);
            console.log('✅ Data loading completed');
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // ===== CALCULATE STATS =====
    const calculateStats = (data) => {
        if (!data || data.length === 0) {
            setStats({
                totalRevenue: 0,
                totalInvoices: 0,
                paidInvoices: 0,
                unpaidInvoices: 0,
                pendingInvoices: 0,
                cancelledInvoices: 0,
                outstandingAmount: 0,
                averageInvoice: 0,
                monthlyRevenue: 0,
                weeklyRevenue: 0,
                revenueChange: 0
            });
            return;
        }

        const total = data.length;
        const paid = data.filter(inv => inv.status === 'paid');
        const unpaid = data.filter(inv => inv.status === 'unpaid');
        const pending = data.filter(inv => inv.status === 'pending');
        const cancelled = data.filter(inv => inv.status === 'cancelled');

        const totalRevenue = paid.reduce((acc, inv) => acc + (parseFloat(inv.total) || 0), 0);
        const outstanding = data
            .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
            .reduce((acc, curr) => acc + (parseFloat(curr.total) || 0), 0);

        const average = total > 0 ? totalRevenue / total : 0;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthlyRevenue = data
            .filter(inv => {
                if (inv.status !== 'paid') return false;
                const invDate = new Date(inv.invoice_date || inv.created_at);
                return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
            })
            .reduce((acc, inv) => acc + (parseFloat(inv.total) || 0), 0);

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weeklyRevenue = data
            .filter(inv => {
                if (inv.status !== 'paid') return false;
                const invDate = new Date(inv.invoice_date || inv.created_at);
                return invDate >= weekAgo;
            })
            .reduce((acc, inv) => acc + (parseFloat(inv.total) || 0), 0);

        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const lastMonthRevenue = data
            .filter(inv => {
                if (inv.status !== 'paid') return false;
                const invDate = new Date(inv.invoice_date || inv.created_at);
                return invDate.getMonth() === lastMonth && invDate.getFullYear() === lastMonthYear;
            })
            .reduce((acc, inv) => acc + (parseFloat(inv.total) || 0), 0);

        const revenueChange = lastMonthRevenue > 0
            ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
            : monthlyRevenue > 0 ? 100 : 0;

        setStats({
            totalRevenue,
            totalInvoices: total,
            paidInvoices: paid.length,
            unpaidInvoices: unpaid.length,
            pendingInvoices: pending.length,
            cancelledInvoices: cancelled.length,
            outstandingAmount: outstanding,
            averageInvoice: average,
            monthlyRevenue,
            weeklyRevenue,
            revenueChange
        });
    };

    // ===== EXPORT FUNCTIONS =====
    const exportToCSV = () => {
        setExporting(true);
        try {
            const headers = [
                'Invoice #', 'Patient Name', 'Patient Phone', 'Patient Email',
                'Date', 'Due Date', 'Subtotal', 'Discount', 'Tax', 'Total',
                'Status', 'Payment Method', 'Reference', 'Notes'
            ];

            const rows = filteredInvoices.map(inv => [
                inv.invoice_number || 'N/A',
                inv.patients?.name || 'N/A',
                inv.patients?.phone || 'N/A',
                inv.patients?.email || 'N/A',
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

            setSuccessMsg('✅ CSV exported successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            console.error('Export error:', err);
            setErrorMsg('Failed to export CSV: ' + err.message);
            setTimeout(() => setErrorMsg(''), 3000);
        } finally {
            setExporting(false);
            setShowExportMenu(false);
        }
    };

    const exportToExcel = () => {
        setExporting(true);
        try {
            const headers = [
                'Invoice #', 'Patient Name', 'Patient Phone', 'Patient Email',
                'Date', 'Due Date', 'Subtotal', 'Discount', 'Tax', 'Total',
                'Status', 'Payment Method', 'Reference', 'Notes'
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
                                    <x:Name>Invoices</x:Name>
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
                        .total-row { background-color: #e8f0fe; font-weight: bold; }
                        .paid { color: green; }
                        .unpaid { color: red; }
                        .pending { color: orange; }
                    </style>
                </head>
                <body>
                    <h2>🏥 Subhan Care Clinic - Invoices Report</h2>
                    <p>Generated: ${new Date().toLocaleString()}</p>
                    <p>Total Invoices: ${filteredInvoices.length}</p>
                    <p>Total Revenue: Rs. ${stats.totalRevenue.toFixed(2)}</p>
                    <br/>
                    <table>
                        <thead>
                            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
            `;

            filteredInvoices.forEach(inv => {
                const statusClass = inv.status === 'paid' ? 'paid' :
                    inv.status === 'unpaid' ? 'unpaid' : 'pending';
                html += `
                    <tr>
                        <td>${inv.invoice_number || 'N/A'}</td>
                        <td>${inv.patients?.name || 'N/A'}</td>
                        <td>${inv.patients?.phone || 'N/A'}</td>
                        <td>${inv.patients?.email || 'N/A'}</td>
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

            const totalSubtotal = filteredInvoices.reduce((acc, inv) => acc + parseFloat(inv.subtotal || 0), 0);
            const totalDiscount = filteredInvoices.reduce((acc, inv) => acc + parseFloat(inv.discount_amount || 0), 0);
            const totalTax = filteredInvoices.reduce((acc, inv) => acc + parseFloat(inv.tax_amount || 0), 0);
            const totalAmount = filteredInvoices.reduce((acc, inv) => acc + parseFloat(inv.total || 0), 0);

            html += `
                        <tr class="total-row">
                            <td colspan="6" style="text-align:right;"><strong>TOTALS</strong></td>
                            <td><strong>${totalSubtotal.toFixed(2)}</strong></td>
                            <td><strong>${totalDiscount.toFixed(2)}</strong></td>
                            <td><strong>${totalTax.toFixed(2)}</strong></td>
                            <td><strong>${totalAmount.toFixed(2)}</strong></td>
                            <td colspan="4"></td>
                        </tr>
                    </tbody>
                </table>
                <br/>
                <p style="color: #666; font-size: 11px;">This is a system-generated report from Subhan Care Clinic HMS.</p>
                </body>
                </html>
            `;

            const blob = new Blob(['\uFEFF' + html], {
                type: 'application/vnd.ms-excel;charset=utf-8'
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `invoices_${new Date().toISOString().split('T')[0]}.xls`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setSuccessMsg('✅ Excel file exported successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            console.error('Export error:', err);
            setErrorMsg('Failed to export Excel: ' + err.message);
            setTimeout(() => setErrorMsg(''), 3000);
        } finally {
            setExporting(false);
            setShowExportMenu(false);
        }
    };

    const exportToJSON = () => {
        setExporting(true);
        try {
            const data = filteredInvoices.map(inv => ({
                invoice_number: inv.invoice_number,
                patient: {
                    name: inv.patients?.name || 'N/A',
                    phone: inv.patients?.phone || 'N/A',
                    email: inv.patients?.email || 'N/A'
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

            setSuccessMsg('✅ JSON exported successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            console.error('Export error:', err);
            setErrorMsg('Failed to export JSON: ' + err.message);
            setTimeout(() => setErrorMsg(''), 3000);
        } finally {
            setExporting(false);
            setShowExportMenu(false);
        }
    };

    const printReport = () => {
        window.print();
        setShowExportMenu(false);
    };

    // ===== HANDLE FORM CHANGE =====
    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;

        setFormData(prev => {
            const updated = { ...prev, [name]: newValue };

            if (name === 'patient_id' && newValue) {
                const selectedPatient = patients.find(p => p.id === newValue);
                if (selectedPatient) {
                    updated.billing_address = selectedPatient.address || '';
                    updated.billing_phone = selectedPatient.phone || '';
                    updated.billing_email = selectedPatient.email || '';
                }
            }

            if (name === 'appointment_id' && newValue) {
                const selectedAppointment = appointments.find(a => a.id === newValue);
                if (selectedAppointment) {
                    updated.doctor_id = selectedAppointment.doctor_id || '';
                    if (selectedAppointment.patient_id) {
                        updated.patient_id = selectedAppointment.patient_id;
                        const selectedPatient = patients.find(p => p.id === selectedAppointment.patient_id);
                        if (selectedPatient) {
                            updated.billing_address = selectedPatient.address || '';
                            updated.billing_phone = selectedPatient.phone || '';
                            updated.billing_email = selectedPatient.email || '';
                        }
                    }
                }
            }

            if (['subtotal', 'discount_value', 'tax_value', 'discount_type', 'tax_type'].includes(name)) {
                const subtotal = parseFloat(updated.subtotal) || 0;
                const discountValue = parseFloat(updated.discount_value) || 0;
                const taxValue = parseFloat(updated.tax_value) || 0;

                let discountAmount = 0;
                let taxAmount = 0;

                if (updated.discount_type === 'percentage') {
                    discountAmount = (subtotal * discountValue) / 100;
                } else {
                    discountAmount = discountValue;
                }

                if (updated.tax_type === 'percentage') {
                    taxAmount = ((subtotal - discountAmount) * taxValue) / 100;
                } else {
                    taxAmount = taxValue;
                }

                updated.discount_amount = discountAmount;
                updated.tax_amount = taxAmount;
                updated.total = subtotal - discountAmount + taxAmount;
            }

            return updated;
        });

        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // ===== VALIDATE FORM =====
    const validateForm = () => {
        const errors = {};
        if (!formData.patient_id) {
            errors.patient_id = 'Please select a patient';
        }
        if (!formData.invoice_date) {
            errors.invoice_date = 'Please select invoice date';
        }
        if (!formData.due_date) {
            errors.due_date = 'Please select due date';
        }
        if (formData.items.length === 0) {
            errors.items = 'Please add at least one item';
        }
        if (formData.total <= 0) {
            errors.total = 'Invoice total must be greater than 0';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // ===== ADD ITEM =====
    const addItem = () => {
        const itemName = formData.item_name?.trim() || '';
        const itemPriceStr = formData.item_price?.toString().trim() || '';
        const itemPrice = parseFloat(itemPriceStr);

        if (!itemName) {
            setErrorMsg('❌ Please enter item name');
            return;
        }

        if (!itemPriceStr || isNaN(itemPrice) || itemPrice <= 0) {
            setErrorMsg('❌ Please enter a valid price');
            return;
        }

        const quantity = parseInt(formData.item_quantity) || 1;
        const total = quantity * itemPrice;

        const newItem = {
            id: Date.now(),
            name: itemName,
            description: formData.item_description?.trim() || '',
            quantity: quantity,
            price: itemPrice,
            total: total
        };

        setFormData(prev => {
            const updatedItems = [...prev.items, newItem];
            const newSubtotal = updatedItems.reduce((acc, item) => acc + item.total, 0);

            const discountValue = parseFloat(prev.discount_value) || 0;
            const taxValue = parseFloat(prev.tax_value) || 0;
            let discountAmount = 0;
            let taxAmount = 0;

            if (prev.discount_type === 'percentage') {
                discountAmount = (newSubtotal * discountValue) / 100;
            } else {
                discountAmount = discountValue;
            }

            if (prev.tax_type === 'percentage') {
                taxAmount = ((newSubtotal - discountAmount) * taxValue) / 100;
            } else {
                taxAmount = taxValue;
            }

            return {
                ...prev,
                items: updatedItems,
                subtotal: newSubtotal,
                discount_amount: discountAmount,
                tax_amount: taxAmount,
                total: newSubtotal - discountAmount + taxAmount,
                item_name: '',
                item_description: '',
                item_quantity: 1,
                item_price: '',
                item_total: ''
            };
        });

        setErrorMsg('');
        setSuccessMsg(`✅ "${itemName}" added successfully!`);
        setTimeout(() => setSuccessMsg(''), 2000);
    };

    // ===== REMOVE ITEM =====
    const removeItem = (itemId) => {
        setFormData(prev => {
            const updatedItems = prev.items.filter(item => item.id !== itemId);
            const newSubtotal = updatedItems.reduce((acc, item) => acc + item.total, 0);

            const discountValue = parseFloat(prev.discount_value) || 0;
            const taxValue = parseFloat(prev.tax_value) || 0;
            let discountAmount = 0;
            let taxAmount = 0;

            if (prev.discount_type === 'percentage') {
                discountAmount = (newSubtotal * discountValue) / 100;
            } else {
                discountAmount = discountValue;
            }

            if (prev.tax_type === 'percentage') {
                taxAmount = ((newSubtotal - discountAmount) * taxValue) / 100;
            } else {
                taxAmount = taxValue;
            }

            return {
                ...prev,
                items: updatedItems,
                subtotal: newSubtotal,
                discount_amount: discountAmount,
                tax_amount: taxAmount,
                total: newSubtotal - discountAmount + taxAmount
            };
        });
    };

    // ===== CREATE INVOICE =====
    const handleAddSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setActionLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const invoiceData = {
                patient_id: formData.patient_id,
                doctor_id: formData.doctor_id || null,
                appointment_id: formData.appointment_id || null,
                invoice_number: formData.invoice_number || `INV-${Date.now()}`,
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
                status: 'pending',
                notes: formData.notes || null,
                billing_address: formData.billing_address || null,
                billing_phone: formData.billing_phone || null,
                billing_email: formData.billing_email || null,
                reference: formData.reference || null,
                department: formData.department || null,
                created_by: user?.id || null,
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('invoices')
                .insert([invoiceData])
                .select();

            if (error) {
                console.error('❌ Supabase error:', error);
                setErrorMsg('Failed to create invoice: ' + error.message);
                setActionLoading(false);
                return;
            }

            console.log('✅ Invoice created successfully:', data);

            setSuccessMsg(`✅ Invoice ${data?.[0]?.invoice_number || ''} generated successfully!`);
            setIsAddOpen(false);

            setFormData(prev => ({
                ...prev,
                items: [],
                subtotal: 0,
                discount_amount: 0,
                tax_amount: 0,
                total: 0
            }));

            await loadData();

        } catch (err) {
            console.error('❌ Error creating invoice:', err);
            setErrorMsg('Error creating invoice: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // ===== UPDATE INVOICE =====
    const handleEditSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setActionLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const invoiceData = {
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
                billing_address: formData.billing_address || null,
                billing_phone: formData.billing_phone || null,
                billing_email: formData.billing_email || null,
                reference: formData.reference || null,
                department: formData.department || null,
                updated_by: user?.id || null,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('invoices')
                .update(invoiceData)
                .eq('id', selectedInvoice.id);

            if (error) {
                console.error('❌ Supabase error:', error);
                setErrorMsg('Failed to update invoice: ' + error.message);
                setActionLoading(false);
                return;
            }

            console.log('✅ Invoice updated successfully');
            setSuccessMsg(`✅ Invoice ${selectedInvoice.invoice_number} updated successfully!`);
            setIsEditOpen(false);

            await loadData();

        } catch (err) {
            console.error('❌ Error updating invoice:', err);
            setErrorMsg('Error updating invoice: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // ===== PROCESS PAYMENT =====
    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const paidAmount = parseFloat(formData.paid_amount) || 0;
            const totalAmount = parseFloat(selectedInvoice.total) || 0;
            const remaining = totalAmount - paidAmount;

            const paymentData = {
                status: remaining <= 0 ? 'paid' : 'partial',
                payment_method: formData.payment_method,
                paid_amount: paidAmount,
                remaining_amount: remaining,
                payment_notes: formData.payment_notes || null,
                payment_date: new Date().toISOString().split('T')[0],
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('invoices')
                .update(paymentData)
                .eq('id', selectedInvoice.id);

            if (error) {
                console.error('Error processing payment:', error);
                setErrorMsg('Failed to process payment: ' + error.message);
                return;
            }

            console.log('✅ Payment processed');
            setSuccessMsg('✅ Payment processed successfully!');
            setIsPaymentOpen(false);
            setIsReceiptOpen(true);
            await loadData();

        } catch (err) {
            console.error('Error processing payment:', err);
            setErrorMsg('Error processing payment: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // ===== DELETE INVOICE =====
    const handleDeleteSubmit = async () => {
        setActionLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const { error } = await supabase
                .from('invoices')
                .delete()
                .eq('id', selectedInvoice.id);

            if (error) {
                console.error('Error deleting invoice:', error);
                setErrorMsg('Failed to delete invoice: ' + error.message);
                return;
            }

            console.log('✅ Invoice deleted');
            setSuccessMsg('✅ Invoice deleted successfully!');
            setIsDeleteOpen(false);
            await loadData();

        } catch (err) {
            console.error('Error deleting invoice:', err);
            setErrorMsg('Error deleting invoice: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // ===== FILTERED INVOICES =====
    const filteredInvoices = invoices.filter(inv => {
        const patientName = inv.patients?.name || '';
        const invoiceNumber = inv.invoice_number || '';
        const patientPhone = inv.patients?.phone || '';

        const matchesSearch = searchQuery === '' ||
            patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            patientPhone.includes(searchQuery);

        const matchesStatus = statusFilter === '' || inv.status === statusFilter;

        const matchesDate = dateFilter === '' ||
            new Date(inv.invoice_date || inv.created_at).toDateString() === new Date(dateFilter).toDateString();

        return matchesSearch && matchesStatus && matchesDate;
    });

    // ===== SORT INVOICES =====
    const sortedInvoices = [...filteredInvoices].sort((a, b) => {
        if (sortBy === 'newest') {
            return new Date(b.invoice_date || b.created_at) - new Date(a.invoice_date || a.created_at);
        } else if (sortBy === 'oldest') {
            return new Date(a.invoice_date || a.created_at) - new Date(b.invoice_date || b.created_at);
        } else if (sortBy === 'amount') {
            return parseFloat(b.total) - parseFloat(a.total);
        } else if (sortBy === 'patient') {
            return (a.patients?.name || '').localeCompare(b.patients?.name || '');
        }
        return 0;
    });

    // ===== CLEAR FILTERS =====
    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('');
        setDateFilter('');
        setSortBy('newest');
        setShowFilters(false);
    };

    const activeFilterCount = (searchQuery ? 1 : 0) + (statusFilter ? 1 : 0) + (dateFilter ? 1 : 0);

    // ===== GET STATUS BADGE =====
    const getStatusBadge = (status) => {
        const statusMap = {
            paid: { label: 'Paid', color: '#22C55E', bg: '#22C55E15' },
            unpaid: { label: 'Unpaid', color: '#EF4444', bg: '#EF444415' },
            pending: { label: 'Pending', color: '#F59E0B', bg: '#F59E0B15' },
            partial: { label: 'Partial', color: '#8B5CF6', bg: '#8B5CF615' },
            cancelled: { label: 'Cancelled', color: '#6B7280', bg: '#6B728015' },
            refunded: { label: 'Refunded', color: '#EC4899', bg: '#EC489915' }
        };
        return statusMap[status] || statusMap.pending;
    };

    // ===== GET APPOINTMENT INFO =====
    const getAppointmentInfo = (appointmentId) => {
        if (!appointmentId) return null;
        return appointments.find(a => a.id === appointmentId);
    };

    return (
        <DashboardLayout active="billing" title="Billing & Invoices">
            {/* ===== BACK BUTTON ===== */}
            <div style={{ marginBottom: '16px' }}>
                <button
                    onClick={goBack}
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
            <div className="billing-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
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
                        <DollarSign size={24} style={{ color: 'var(--primary-color)' }} />
                        Billing & Invoices
                    </h1>
                    <p style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        marginTop: '4px'
                    }}>
                        Manage patient invoices, payments, and billing records
                    </p>
                </div>
                <div className="billing-header-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                        onClick={loadData}
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
                            fontFamily: 'var(--font-family)',
                            color: 'var(--text-secondary)',
                            transition: 'all 0.2s ease'
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
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            disabled={exporting}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 14px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
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
                            {exporting ? <Loader size={14} className="spinner" /> : <Download size={14} />}
                            {exporting ? 'Exporting...' : 'Export'}
                            <ChevronDown size={12} />
                        </button>

                        {showExportMenu && !exporting && (
                            <div className="export-dropdown" style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '4px',
                                background: 'var(--card-bg)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '10px',
                                boxShadow: 'var(--shadow-lg)',
                                minWidth: '200px',
                                zIndex: 100,
                                padding: '4px 0',
                                animation: 'slideDown 0.2s ease'
                            }}>
                                <button onClick={exportToCSV} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '8px 14px',
                                    width: '100%',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'var(--text-primary)',
                                    transition: 'all 0.15s ease'
                                }}
                                    onMouseEnter={(e) => e.target.style.background = 'var(--hover-bg)'}
                                    onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                                    <FileText size={16} style={{ color: '#3B82F6' }} />
                                    <span>Export as CSV</span>
                                </button>
                                <button onClick={exportToExcel} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '8px 14px',
                                    width: '100%',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'var(--text-primary)',
                                    transition: 'all 0.15s ease'
                                }}
                                    onMouseEnter={(e) => e.target.style.background = 'var(--hover-bg)'}
                                    onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                                    <FileSpreadsheet size={16} style={{ color: '#22C55E' }} />
                                    <span>Export as Excel (.xls)</span>
                                </button>
                                <button onClick={exportToJSON} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '8px 14px',
                                    width: '100%',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'var(--text-primary)',
                                    transition: 'all 0.15s ease'
                                }}
                                    onMouseEnter={(e) => e.target.style.background = 'var(--hover-bg)'}
                                    onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                                    <FileJson size={16} style={{ color: '#8B5CF6' }} />
                                    <span>Export as JSON</span>
                                </button>
                                <div style={{ borderTop: '1px solid var(--border-color)', margin: '4px 8px' }} />
                                <button onClick={printReport} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '8px 14px',
                                    width: '100%',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'var(--text-primary)',
                                    transition: 'all 0.15s ease'
                                }}
                                    onMouseEnter={(e) => e.target.style.background = 'var(--hover-bg)'}
                                    onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                                    <Printer size={16} style={{ color: '#F59E0B' }} />
                                    <span>Print Report</span>
                                </button>
                                <button onClick={() => setShowExportMenu(false)} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '8px 14px',
                                    width: '100%',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'var(--text-secondary)',
                                    transition: 'all 0.15s ease',
                                    borderTop: '1px solid var(--border-color)',
                                    marginTop: '4px',
                                    paddingTop: '8px'
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
                        onClick={openAddModal}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            border: 'none',
                            borderRadius: '8px',
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

            {/* ===== STATS CARDS ===== */}
            <div className="stats-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                marginBottom: '20px'
            }}>
                <div style={{
                    padding: '14px 16px',
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    transition: 'all 0.3s ease'
                }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <DollarSign size={16} style={{ color: '#10B981' }} />
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total Revenue</span>
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Rs. {stats.totalRevenue.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: stats.revenueChange >= 0 ? '#10B981' : '#EF4444' }}>
                        {stats.revenueChange >= 0 ? '▲' : '▼'} {Math.abs(stats.revenueChange).toFixed(1)}% from last month
                    </div>
                </div>
                <div style={{
                    padding: '14px 16px',
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    transition: 'all 0.3s ease'
                }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <FileText size={16} style={{ color: 'var(--primary-color)' }} />
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total Invoices</span>
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {stats.totalInvoices}
                    </div>
                </div>
                <div style={{
                    padding: '14px 16px',
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    transition: 'all 0.3s ease'
                }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Check size={16} style={{ color: '#22C55E' }} />
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Paid</span>
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#22C55E' }}>
                        {stats.paidInvoices}
                    </div>
                </div>
                <div style={{
                    padding: '14px 16px',
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    transition: 'all 0.3s ease'
                }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <AlertCircle size={16} style={{ color: '#EF4444' }} />
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Unpaid</span>
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#EF4444' }}>
                        {stats.unpaidInvoices}
                    </div>
                </div>
                <div style={{
                    padding: '14px 16px',
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    transition: 'all 0.3s ease'
                }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Clock size={16} style={{ color: '#F59E0B' }} />
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Pending</span>
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#F59E0B' }}>
                        {stats.pendingInvoices}
                    </div>
                </div>
            </div>

            {/* ===== CONTROLS BAR ===== */}
            <div className="hms-controls-bar" style={{
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
                <div className="hms-search-box" style={{ flex: 1, minWidth: '160px', position: 'relative' }}>
                    <Search size={16} className="hms-search-icon" style={{
                        position: 'absolute',
                        left: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)'
                    }} />
                    <input
                        type="text"
                        placeholder="Search by patient, invoice #, or phone..."
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
                <div className="controls-actions" style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                        <Plus size={14} /> New Invoice
                    </button>
                </div>
            </div>

            {/* ===== FILTERS BAR ===== */}
            {showFilters && (
                <div className="filters-bar" style={{
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
                            minWidth: '120px'
                        }}
                    >
                        <option value="">All Status</option>
                        <option value="paid">✅ Paid</option>
                        <option value="unpaid">❌ Unpaid</option>
                        <option value="pending">⏳ Pending</option>
                        <option value="partial">🔶 Partial</option>
                        <option value="cancelled">⛔ Cancelled</option>
                        <option value="refunded">🔄 Refunded</option>
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
                            minWidth: '140px'
                        }}
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
                            minWidth: '110px'
                        }}
                    >
                        <option value="newest">📅 Newest</option>
                        <option value="oldest">📅 Oldest</option>
                        <option value="amount">💰 By Amount</option>
                        <option value="patient">👤 By Patient</option>
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
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {sortedInvoices.length} invoice{sortedInvoices.length !== 1 ? 's' : ''} found
                    </span>
                </div>
            )}

            {/* ===== TABLE ===== */}
            <div className="hms-table-container" style={{
                borderRadius: '12px',
                overflow: 'hidden',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)'
            }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        <div className="spinner" style={{ margin: '0 auto 12px' }}>⏳</div>
                        Loading invoices...
                    </div>
                ) : sortedInvoices.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📄</div>
                        <h3 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>No Invoices Found</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            {activeFilterCount > 0 ? 'Try clearing your filters to see all invoices.' : 'Start by creating your first invoice.'}
                        </p>
                        <br />
                        <button
                            onClick={openAddModal}
                            style={{
                                marginTop: '12px',
                                padding: '8px 20px',
                                background: 'var(--primary-color)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontFamily: 'var(--font-family)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'var(--primary-hover)'}
                            onMouseLeave={(e) => e.target.style.background = 'var(--primary-color)'}
                        >
                            <Plus size={16} /> First Invoice
                        </button>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <table className="hms-table" style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '0.8rem',
                            minWidth: '800px'
                        }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                        <Hash size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Invoice #
                                    </th>
                                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                        <User size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Patient
                                    </th>
                                    <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                        <Calendar size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Date
                                    </th>
                                    <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                        <DollarSign size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Amount
                                    </th>
                                    <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                        Status
                                    </th>
                                    <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedInvoices.map(inv => {
                                    const status = getStatusBadge(inv.status);
                                    const appointment = getAppointmentInfo(inv.appointment_id);
                                    return (
                                        <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s ease' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '8px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {inv.invoice_number}
                                                {inv.reference && (
                                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                                                        Ref: {inv.reference}
                                                    </div>
                                                )}
                                                {appointment && (
                                                    <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
                                                        <Activity size={10} style={{ display: 'inline', marginRight: '2px' }} />
                                                        Appt: {new Date(appointment.appointment_date).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '8px 14px', color: 'var(--text-primary)' }}>
                                                {inv.patients?.name || 'Unknown Patient'}
                                                {inv.patients?.phone && (
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                                        {inv.patients.phone}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '8px 14px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                                <Clock size={11} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} />
                                                {new Date(inv.invoice_date || inv.created_at).toLocaleDateString()}
                                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                                                    Due: {new Date(inv.due_date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                Rs. {parseFloat(inv.total).toFixed(2)}
                                            </td>
                                            <td style={{ padding: '8px 14px', textAlign: 'center' }}>
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
                                            <td style={{ padding: '8px 14px', textAlign: 'right' }}>
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
                                                            fontFamily: 'var(--font-family)',
                                                            color: 'var(--text-secondary)',
                                                            transition: 'all 0.2s ease',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '3px'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.target.style.borderColor = 'var(--primary-color)';
                                                            e.target.style.color = 'var(--primary-color)';
                                                            e.target.style.background = 'rgba(37, 99, 235, 0.04)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.target.style.borderColor = 'var(--border-color)';
                                                            e.target.style.color = 'var(--text-secondary)';
                                                            e.target.style.background = 'transparent';
                                                        }}
                                                    >
                                                        <Eye size={12} /> View
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
                                                                fontFamily: 'var(--font-family)',
                                                                color: 'var(--text-secondary)',
                                                                transition: 'all 0.2s ease',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '3px'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.target.style.borderColor = '#10B981';
                                                                e.target.style.color = '#10B981';
                                                                e.target.style.background = 'rgba(16, 185, 129, 0.04)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.target.style.borderColor = 'var(--border-color)';
                                                                e.target.style.color = 'var(--text-secondary)';
                                                                e.target.style.background = 'transparent';
                                                            }}
                                                        >
                                                            <CreditCard size={12} /> Pay
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => openEditModal(inv)}
                                                        style={{
                                                            padding: '4px 8px',
                                                            border: '1px solid var(--border-color)',
                                                            borderRadius: '6px',
                                                            background: 'transparent',
                                                            cursor: 'pointer',
                                                            fontSize: '0.65rem',
                                                            fontFamily: 'var(--font-family)',
                                                            color: 'var(--text-secondary)',
                                                            transition: 'all 0.2s ease',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '3px'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.target.style.borderColor = '#22C55E';
                                                            e.target.style.color = '#22C55E';
                                                            e.target.style.background = 'rgba(34, 197, 94, 0.04)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.target.style.borderColor = 'var(--border-color)';
                                                            e.target.style.color = 'var(--text-secondary)';
                                                            e.target.style.background = 'transparent';
                                                        }}
                                                    >
                                                        <Edit size={12} /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteModal(inv)}
                                                        style={{
                                                            padding: '4px 8px',
                                                            border: '1px solid var(--border-color)',
                                                            borderRadius: '6px',
                                                            background: 'transparent',
                                                            cursor: 'pointer',
                                                            fontSize: '0.65rem',
                                                            fontFamily: 'var(--font-family)',
                                                            color: 'var(--text-secondary)',
                                                            transition: 'all 0.2s ease',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '3px'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.target.style.borderColor = '#EF4444';
                                                            e.target.style.color = '#EF4444';
                                                            e.target.style.background = 'rgba(239, 68, 68, 0.04)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.target.style.borderColor = 'var(--border-color)';
                                                            e.target.style.color = 'var(--text-secondary)';
                                                            e.target.style.background = 'transparent';
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

            {/* ============================================================ */}
            {/* ===== ADD INVOICE MODAL ===== */}
            {/* ============================================================ */}
            {isAddOpen && (
                <div className="hms-modal-backdrop" onClick={() => setIsAddOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{
                        maxWidth: '700px',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'var(--card-bg)',
                        borderRadius: '16px',
                        boxShadow: 'var(--shadow-xl)',
                        border: '1px solid var(--border-color)',
                        width: '100%',
                        margin: '16px'
                    }}>
                        <div className="hms-modal-header" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '16px 20px',
                            borderBottom: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            borderRadius: '16px 16px 0 0'
                        }}>
                            <h3 className="hms-modal-title" style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'var(--text-primary)'
                            }}>
                                <FileText size={18} style={{ color: 'var(--primary-color)' }} />
                                New Invoice
                            </h3>
                            <button
                                onClick={() => setIsAddOpen(false)}
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
                                    e.target.style.background = 'var(--hover-bg)';
                                    e.target.style.color = 'var(--danger-color)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'transparent';
                                    e.target.style.color = 'var(--text-secondary)';
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="hms-modal-body" style={{
                            padding: '20px',
                            overflowY: 'auto',
                            flex: 1
                        }}>
                            {errorMsg && (
                                <div className="alert alert-danger" style={{
                                    marginBottom: '12px',
                                    padding: '10px 14px',
                                    background: '#EF444415',
                                    border: '1px solid #EF444430',
                                    borderRadius: '8px',
                                    color: '#EF4444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <AlertCircle size={16} /> {errorMsg}
                                </div>
                            )}
                            {successMsg && (
                                <div className="alert alert-success" style={{
                                    marginBottom: '12px',
                                    padding: '10px 14px',
                                    background: '#22C55E15',
                                    border: '1px solid #22C55E30',
                                    borderRadius: '8px',
                                    color: '#16A34A',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <Check size={16} /> {successMsg}
                                </div>
                            )}

                            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {/* Patient & Doctor & Appointment */}
                                <div className="grid-3-cols" style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr 1fr',
                                    gap: '12px'
                                }}>
                                    <div className="form-group">
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.8rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}><User size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--primary-color)' }} /> Patient *</label>
                                        <select
                                            name="patient_id"
                                            className="hms-select"
                                            value={formData.patient_id}
                                            onChange={handleFormChange}
                                            required
                                            style={{
                                                width: '100%',
                                                height: '40px',
                                                padding: '0 12px',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '10px',
                                                fontFamily: 'var(--font-family)',
                                                fontSize: '0.8rem',
                                                background: 'var(--card-bg)',
                                                color: 'var(--text-primary)',
                                                outline: 'none',
                                                transition: 'all 0.2s ease',
                                                appearance: 'none',
                                                cursor: 'pointer'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = 'var(--primary-color)';
                                                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = 'var(--border-color)';
                                                e.target.style.boxShadow = 'none';
                                            }}
                                        >
                                            <option value="">-- Choose Patient --</option>
                                            {patients.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} {p.phone ? `(${p.phone})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        {formErrors.patient_id && <span className="error-text" style={{ fontSize: '0.75rem', color: 'var(--danger-color)' }}>{formErrors.patient_id}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.8rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}><Stethoscope size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--secondary-color)' }} /> Doctor</label>
                                        <select
                                            name="doctor_id"
                                            className="hms-select"
                                            value={formData.doctor_id}
                                            onChange={handleFormChange}
                                            style={{
                                                width: '100%',
                                                height: '40px',
                                                padding: '0 12px',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '10px',
                                                fontFamily: 'var(--font-family)',
                                                fontSize: '0.8rem',
                                                background: 'var(--card-bg)',
                                                color: 'var(--text-primary)',
                                                outline: 'none',
                                                transition: 'all 0.2s ease',
                                                appearance: 'none',
                                                cursor: 'pointer'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = 'var(--primary-color)';
                                                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = 'var(--border-color)';
                                                e.target.style.boxShadow = 'none';
                                            }}
                                        >
                                            <option value="">-- Choose Doctor --</option>
                                            {doctors.map(d => (
                                                <option key={d.id} value={d.id}>
                                                    Dr. {d.name} {d.specialization ? `(${d.specialization})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.8rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}><Activity size={14} style={{ display: 'inline', marginRight: '4px', color: '#8B5CF6' }} /> Appointment</label>
                                        <select
                                            name="appointment_id"
                                            className="hms-select"
                                            value={formData.appointment_id}
                                            onChange={handleFormChange}
                                            style={{
                                                width: '100%',
                                                height: '40px',
                                                padding: '0 12px',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '10px',
                                                fontFamily: 'var(--font-family)',
                                                fontSize: '0.8rem',
                                                background: 'var(--card-bg)',
                                                color: 'var(--text-primary)',
                                                outline: 'none',
                                                transition: 'all 0.2s ease',
                                                appearance: 'none',
                                                cursor: 'pointer'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = 'var(--primary-color)';
                                                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = 'var(--border-color)';
                                                e.target.style.boxShadow = 'none';
                                            }}
                                        >
                                            <option value="">-- Select Appointment --</option>
                                            {appointments.map(a => {
                                                const patient = patients.find(p => p.id === a.patient_id);
                                                return (
                                                    <option key={a.id} value={a.id}>
                                                        {new Date(a.appointment_date).toLocaleDateString()} - {a.time_slot || 'N/A'}
                                                        {patient ? ` (${patient.name})` : ''}
                                                        {a.status ? ` [${a.status}]` : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        {formData.appointment_id && (
                                            <div style={{
                                                fontSize: '0.65rem',
                                                color: 'var(--text-muted)',
                                                marginTop: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                <Check size={12} style={{ color: '#22C55E' }} />
                                                Appointment linked to invoice
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="grid-2-cols" style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '12px'
                                }}>
                                    <div className="form-group">
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.8rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}><Calendar size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--primary-color)' }} /> Invoice Date *</label>
                                        <input
                                            type="date"
                                            name="invoice_date"
                                            className="input-control"
                                            value={formData.invoice_date}
                                            onChange={handleFormChange}
                                            required
                                            style={{
                                                width: '100%',
                                                height: '40px',
                                                padding: '0 12px',
                                                fontFamily: 'var(--font-family)',
                                                fontSize: '0.8rem',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '10px',
                                                background: 'var(--card-bg)',
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
                                        {formErrors.invoice_date && <span className="error-text" style={{ fontSize: '0.75rem', color: 'var(--danger-color)' }}>{formErrors.invoice_date}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.8rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}><Calendar size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--warning-color)' }} /> Due Date *</label>
                                        <input
                                            type="date"
                                            name="due_date"
                                            className="input-control"
                                            value={formData.due_date}
                                            onChange={handleFormChange}
                                            required
                                            style={{
                                                width: '100%',
                                                height: '40px',
                                                padding: '0 12px',
                                                fontFamily: 'var(--font-family)',
                                                fontSize: '0.8rem',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '10px',
                                                background: 'var(--card-bg)',
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
                                        {formErrors.due_date && <span className="error-text" style={{ fontSize: '0.75rem', color: 'var(--danger-color)' }}>{formErrors.due_date}</span>}
                                    </div>
                                </div>

                                {/* Invoice Items */}
                                <div style={{
                                    background: 'var(--bg-primary)',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '10px'
                                    }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            <Clipboard size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                            Invoice Items
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            {formData.items.length} item{formData.items.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div className="add-item-row" style={{
                                        display: 'grid',
                                        gridTemplateColumns: '2fr 1fr 1fr 0.5fr auto',
                                        gap: '8px',
                                        alignItems: 'center',
                                        marginBottom: '8px'
                                    }}>
                                        <input
                                            type="text"
                                            placeholder="Item name"
                                            value={formData.item_name || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))}
                                            onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
                                            style={{
                                                height: '34px',
                                                padding: '0 10px',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '8px',
                                                fontSize: '0.75rem',
                                                fontFamily: 'var(--font-family)',
                                                background: 'var(--card-bg)',
                                                color: 'var(--text-primary)',
                                                outline: 'none',
                                                transition: 'border-color 0.2s ease'
                                            }}
                                            onFocus={(e) => { e.target.style.borderColor = 'var(--primary-color)'; }}
                                            onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; }}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Qty"
                                            value={formData.item_quantity || 1}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value) || 1;
                                                setFormData(prev => ({ ...prev, item_quantity: val > 0 ? val : 1 }));
                                            }}
                                            min="1"
                                            style={{
                                                height: '34px',
                                                padding: '0 10px',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '8px',
                                                fontSize: '0.75rem',
                                                fontFamily: 'var(--font-family)',
                                                background: 'var(--card-bg)',
                                                color: 'var(--text-primary)',
                                                outline: 'none',
                                                width: '60px',
                                                transition: 'border-color 0.2s ease'
                                            }}
                                            onFocus={(e) => { e.target.style.borderColor = 'var(--primary-color)'; }}
                                            onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; }}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Price"
                                            value={formData.item_price || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, item_price: e.target.value }))}
                                            onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
                                            min="0"
                                            step="0.01"
                                            style={{
                                                height: '34px',
                                                padding: '0 10px',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '8px',
                                                fontSize: '0.75rem',
                                                fontFamily: 'var(--font-family)',
                                                background: 'var(--card-bg)',
                                                color: 'var(--text-primary)',
                                                outline: 'none',
                                                width: '80px',
                                                transition: 'border-color 0.2s ease'
                                            }}
                                            onFocus={(e) => { e.target.style.borderColor = 'var(--primary-color)'; }}
                                            onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; }}
                                        />
                                        <span style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            color: 'var(--text-primary)',
                                            minWidth: '60px'
                                        }}>
                                            Rs. {((parseInt(formData.item_quantity) || 0) * (parseFloat(formData.item_price) || 0)).toFixed(2)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={addItem}
                                            style={{
                                                padding: '4px 8px',
                                                border: 'none',
                                                borderRadius: '6px',
                                                background: 'var(--primary-color)',
                                                color: 'white',
                                                cursor: 'pointer',
                                                fontSize: '0.7rem',
                                                fontFamily: 'var(--font-family)',
                                                transition: 'all 0.2s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '2px',
                                                whiteSpace: 'nowrap'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.background = 'var(--primary-hover)';
                                                e.target.style.transform = 'scale(1.05)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.background = 'var(--primary-color)';
                                                e.target.style.transform = 'scale(1)';
                                            }}
                                        >
                                            <Plus size={14} /> Add
                                        </button>
                                    </div>
                                    {formData.items.length > 0 && (
                                        <div style={{
                                            maxHeight: '150px',
                                            overflowY: 'auto',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '8px',
                                            background: 'var(--card-bg)'
                                        }}>
                                            {formData.items.map(item => (
                                                <div key={item.id} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '6px 10px',
                                                    borderBottom: '1px solid var(--border-color)'
                                                }}>
                                                    <div style={{ flex: 1 }}>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                                            {item.name}
                                                        </span>
                                                        {item.description && (
                                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                                                                {item.description}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginRight: '12px' }}>
                                                        {item.quantity} x Rs. {item.price.toFixed(2)} = Rs. {item.total.toFixed(2)}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(item.id)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            color: 'var(--danger-color)',
                                                            padding: '2px'
                                                        }}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {formErrors.items && <span className="error-text" style={{ fontSize: '0.75rem', color: 'var(--danger-color)' }}>{formErrors.items}</span>}
                                </div>

                                {/* Financials */}
                                <div className="grid-3-cols" style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr 1fr',
                                    gap: '12px'
                                }}>
                                    <div className="form-group">
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}>Subtotal</label>
                                        <input
                                            type="number"
                                            name="subtotal"
                                            className="input-control"
                                            value={formData.subtotal}
                                            onChange={handleFormChange}
                                            step="0.01"
                                            style={{
                                                width: '100%',
                                                height: '36px',
                                                padding: '0 10px',
                                                fontFamily: 'var(--font-family)',
                                                fontSize: '0.75rem',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '8px',
                                                background: 'var(--bg-primary)',
                                                color: 'var(--text-secondary)',
                                                outline: 'none'
                                            }}
                                            readOnly
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}>Discount</label>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <input
                                                type="number"
                                                name="discount_value"
                                                className="input-control"
                                                value={formData.discount_value}
                                                onChange={handleFormChange}
                                                min="0"
                                                step="0.01"
                                                style={{
                                                    flex: 1,
                                                    height: '36px',
                                                    padding: '0 10px',
                                                    fontFamily: 'var(--font-family)',
                                                    fontSize: '0.75rem',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    background: 'var(--card-bg)',
                                                    color: 'var(--text-primary)',
                                                    outline: 'none'
                                                }}
                                            />
                                            <select
                                                name="discount_type"
                                                className="hms-select"
                                                value={formData.discount_type}
                                                onChange={handleFormChange}
                                                style={{
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.7rem',
                                                    fontFamily: 'var(--font-family)',
                                                    background: 'var(--card-bg)',
                                                    color: 'var(--text-primary)',
                                                    outline: 'none',
                                                    width: '70px'
                                                }}
                                            >
                                                <option value="percentage">%</option>
                                                <option value="fixed">Rs.</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}>Tax</label>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <input
                                                type="number"
                                                name="tax_value"
                                                className="input-control"
                                                value={formData.tax_value}
                                                onChange={handleFormChange}
                                                min="0"
                                                step="0.01"
                                                style={{
                                                    flex: 1,
                                                    height: '36px',
                                                    padding: '0 10px',
                                                    fontFamily: 'var(--font-family)',
                                                    fontSize: '0.75rem',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    background: 'var(--card-bg)',
                                                    color: 'var(--text-primary)',
                                                    outline: 'none'
                                                }}
                                            />
                                            <select
                                                name="tax_type"
                                                className="hms-select"
                                                value={formData.tax_type}
                                                onChange={handleFormChange}
                                                style={{
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.7rem',
                                                    fontFamily: 'var(--font-family)',
                                                    background: 'var(--card-bg)',
                                                    color: 'var(--text-primary)',
                                                    outline: 'none',
                                                    width: '70px'
                                                }}
                                            >
                                                <option value="percentage">%</option>
                                                <option value="fixed">Rs.</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Totals */}
                                <div className="totals-section" style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr 1fr 1fr',
                                    gap: '8px',
                                    padding: '12px',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Subtotal</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            Rs. {formData.subtotal.toFixed(2)}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Discount</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#10B981' }}>
                                            -Rs. {formData.discount_amount.toFixed(2)}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Tax</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#F59E0B' }}>
                                            +Rs. {formData.tax_amount.toFixed(2)}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                                            Rs. {formData.total.toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                {/* Reference & Notes */}
                                <div className="grid-2-cols" style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '12px'
                                }}>
                                    <div className="form-group">
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.8rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}><Hash size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Reference</label>
                                        <input
                                            type="text"
                                            name="reference"
                                            className="input-control"
                                            value={formData.reference}
                                            onChange={handleFormChange}
                                            placeholder="Reference number or PO #"
                                            style={{
                                                width: '100%',
                                                height: '40px',
                                                padding: '0 12px',
                                                fontFamily: 'var(--font-family)',
                                                fontSize: '0.8rem',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '10px',
                                                background: 'var(--card-bg)',
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
                                    <div className="form-group">
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.8rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}><FileText size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Department</label>
                                        <input
                                            type="text"
                                            name="department"
                                            className="input-control"
                                            value={formData.department}
                                            onChange={handleFormChange}
                                            placeholder="e.g. Cardiology, OPD, ICU"
                                            style={{
                                                width: '100%',
                                                height: '40px',
                                                padding: '0 12px',
                                                fontFamily: 'var(--font-family)',
                                                fontSize: '0.8rem',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '10px',
                                                background: 'var(--card-bg)',
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
                                </div>

                                {/* Notes */}
                                <div className="form-group">
                                    <label className="form-label" style={{
                                        display: 'block',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}><MessageSquare size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Notes</label>
                                    <textarea
                                        name="notes"
                                        className="input-control"
                                        value={formData.notes}
                                        onChange={handleFormChange}
                                        placeholder="Additional notes or instructions..."
                                        style={{
                                            minHeight: '50px',
                                            width: '100%',
                                            padding: '8px 12px',
                                            fontFamily: 'var(--font-family)',
                                            fontSize: '0.8rem',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            background: 'var(--card-bg)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            resize: 'vertical',
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
                            </form>
                        </div>
                        <div className="hms-modal-footer" style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '8px',
                            padding: '14px 20px',
                            borderTop: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            borderRadius: '0 0 16px 16px'
                        }}>
                            <button
                                onClick={() => setIsAddOpen(false)}
                                style={{
                                    padding: '6px 16px',
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
                                    e.target.style.background = 'var(--hover-bg)';
                                    e.target.style.color = 'var(--text-primary)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'transparent';
                                    e.target.style.color = 'var(--text-secondary)';
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddSubmit}
                                disabled={actionLoading}
                                style={{
                                    padding: '6px 16px',
                                    border: 'none',
                                    borderRadius: '10px',
                                    background: 'var(--primary-color)',
                                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'white',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    opacity: actionLoading ? 0.7 : 1,
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    if (!actionLoading) {
                                        e.target.style.background = 'var(--primary-hover)';
                                        e.target.style.transform = 'translateY(-1px)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.25)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!actionLoading) {
                                        e.target.style.background = 'var(--primary-color)';
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = 'none';
                                    }
                                }}
                            >
                                <FileText size={14} />
                                {actionLoading ? 'Generating...' : 'Generate Invoice'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* ===== EDIT INVOICE MODAL ===== */}
            {/* ============================================================ */}
            {isEditOpen && selectedInvoice && (
                <div className="hms-modal-backdrop" onClick={() => setIsEditOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{
                        maxWidth: '700px',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'var(--card-bg)',
                        borderRadius: '16px',
                        boxShadow: 'var(--shadow-xl)',
                        border: '1px solid var(--border-color)',
                        width: '100%',
                        margin: '16px'
                    }}>
                        <div className="hms-modal-header" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '16px 20px',
                            borderBottom: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            borderRadius: '16px 16px 0 0'
                        }}>
                            <h3 className="hms-modal-title" style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'var(--text-primary)'
                            }}>
                                <Edit size={18} style={{ color: '#22C55E' }} />
                                Edit Invoice - {selectedInvoice.invoice_number}
                            </h3>
                            <button
                                onClick={() => setIsEditOpen(false)}
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
                                    e.target.style.background = 'var(--hover-bg)';
                                    e.target.style.color = 'var(--danger-color)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'transparent';
                                    e.target.style.color = 'var(--text-secondary)';
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="hms-modal-body" style={{
                            padding: '20px',
                            overflowY: 'auto',
                            flex: 1
                        }}>
                            {errorMsg && (
                                <div className="alert alert-danger" style={{
                                    marginBottom: '12px',
                                    padding: '10px 14px',
                                    background: '#EF444415',
                                    border: '1px solid #EF444430',
                                    borderRadius: '8px',
                                    color: '#EF4444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <AlertCircle size={16} /> {errorMsg}
                                </div>
                            )}
                            {successMsg && (
                                <div className="alert alert-success" style={{
                                    marginBottom: '12px',
                                    padding: '10px 14px',
                                    background: '#22C55E15',
                                    border: '1px solid #22C55E30',
                                    borderRadius: '8px',
                                    color: '#16A34A',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <Check size={16} /> {successMsg}
                                </div>
                            )}
                            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {/* Patient & Doctor & Appointment */}
                                <div className="grid-3-cols" style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr 1fr',
                                    gap: '12px'
                                }}>
                                    <div className="form-group">
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.8rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}><User size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--primary-color)' }} /> Patient *</label>
                                        <select
                                            name="patient_id"
                                            className="hms-select"
                                            value={formData.patient_id}
                                            onChange={handleFormChange}
                                            required
                                            style={{
                                                width: '100%',
                                                height: '40px',
                                                padding: '0 12px',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '10px',
                                                fontFamily: 'var(--font-family)',
                                                fontSize: '0.8rem',
                                                background: 'var(--card-bg)',
                                                color: 'var(--text-primary)',
                                                outline: 'none',
                                                transition: 'all 0.2s ease',
                                                appearance: 'none',
                                                cursor: 'pointer'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = 'var(--primary-color)';
                                                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = 'var(--border-color)';
                                                e.target.style.boxShadow = 'none';
                                            }}
                                        >
                                            <option value="">-- Choose Patient --</option>
                                            {patients.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} {p.phone ? `(${p.phone})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        {formErrors.patient_id && <span className="error-text" style={{ fontSize: '0.75rem', color: 'var(--danger-color)' }}>{formErrors.patient_id}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.8rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}><Stethoscope size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--secondary-color)' }} /> Doctor</label>
                                        <select
                                            name="doctor_id"
                                            className="hms-select"
                                            value={formData.doctor_id}
                                            onChange={handleFormChange}
                                            style={{
                                                width: '100%',
                                                height: '40px',
                                                padding: '0 12px',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '10px',
                                                fontFamily: 'var(--font-family)',
                                                fontSize: '0.8rem',
                                                background: 'var(--card-bg)',
                                                color: 'var(--text-primary)',
                                                outline: 'none',
                                                transition: 'all 0.2s ease',
                                                appearance: 'none',
                                                cursor: 'pointer'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = 'var(--primary-color)';
                                                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = 'var(--border-color)';
                                                e.target.style.boxShadow = 'none';
                                            }}
                                        >
                                            <option value="">-- Choose Doctor --</option>
                                            {doctors.map(d => (
                                                <option key={d.id} value={d.id}>
                                                    Dr. {d.name} {d.specialization ? `(${d.specialization})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.8rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}><Activity size={14} style={{ display: 'inline', marginRight: '4px', color: '#8B5CF6' }} /> Appointment</label>
                                        <select
                                            name="appointment_id"
                                            className="hms-select"
                                            value={formData.appointment_id}
                                            onChange={handleFormChange}
                                            style={{
                                                width: '100%',
                                                height: '40px',
                                                padding: '0 12px',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '10px',
                                                fontFamily: 'var(--font-family)',
                                                fontSize: '0.8rem',
                                                background: 'var(--card-bg)',
                                                color: 'var(--text-primary)',
                                                outline: 'none',
                                                transition: 'all 0.2s ease',
                                                appearance: 'none',
                                                cursor: 'pointer'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = 'var(--primary-color)';
                                                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = 'var(--border-color)';
                                                e.target.style.boxShadow = 'none';
                                            }}
                                        >
                                            <option value="">-- Select Appointment --</option>
                                            {appointments.map(a => {
                                                const patient = patients.find(p => p.id === a.patient_id);
                                                return (
                                                    <option key={a.id} value={a.id}>
                                                        {new Date(a.appointment_date).toLocaleDateString()} - {a.time_slot || 'N/A'}
                                                        {patient ? ` (${patient.name})` : ''}
                                                        {a.status ? ` [${a.status}]` : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        {formData.appointment_id && (
                                            <div style={{
                                                fontSize: '0.65rem',
                                                color: 'var(--text-muted)',
                                                marginTop: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                <Check size={12} style={{ color: '#22C55E' }} />
                                                Appointment linked to invoice
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="grid-2-cols" style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '12px'
                                }}>
                                    <div className="form-group">
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.8rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}><Calendar size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--primary-color)' }} /> Invoice Date *</label>
                                        <input
                                            type="date"
                                            name="invoice_date"
                                            className="input-control"
                                            value={formData.invoice_date}
                                            onChange={handleFormChange}
                                            required
                                            style={{
                                                width: '100%',
                                                height: '40px',
                                                padding: '0 12px',
                                                fontFamily: 'var(--font-family)',
                                                fontSize: '0.8rem',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '10px',
                                                background: 'var(--card-bg)',
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
                                        {formErrors.invoice_date && <span className="error-text" style={{ fontSize: '0.75rem', color: 'var(--danger-color)' }}>{formErrors.invoice_date}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.8rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}><Calendar size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--warning-color)' }} /> Due Date *</label>
                                        <input
                                            type="date"
                                            name="due_date"
                                            className="input-control"
                                            value={formData.due_date}
                                            onChange={handleFormChange}
                                            required
                                            style={{
                                                width: '100%',
                                                height: '40px',
                                                padding: '0 12px',
                                                fontFamily: 'var(--font-family)',
                                                fontSize: '0.8rem',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '10px',
                                                background: 'var(--card-bg)',
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
                                        {formErrors.due_date && <span className="error-text" style={{ fontSize: '0.75rem', color: 'var(--danger-color)' }}>{formErrors.due_date}</span>}
                                    </div>
                                </div>

                                {/* Invoice Items */}
                                <div style={{
                                    background: 'var(--bg-primary)',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '10px'
                                    }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            <Clipboard size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                            Invoice Items
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            {formData.items.length} item{formData.items.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div className="add-item-row" style={{
                                        display: 'grid',
                                        gridTemplateColumns: '2fr 1fr 1fr 0.5fr auto',
                                        gap: '8px',
                                        alignItems: 'center',
                                        marginBottom: '8px'
                                    }}>
                                        <input
                                            type="text"
                                            placeholder="Item name"
                                            value={formData.item_name || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))}
                                            onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
                                            style={{
                                                height: '34px',
                                                padding: '0 10px',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '8px',
                                                fontSize: '0.75rem',
                                                fontFamily: 'var(--font-family)',
                                                background: 'var(--card-bg)',
                                                color: 'var(--text-primary)',
                                                outline: 'none',
                                                transition: 'border-color 0.2s ease'
                                            }}
                                            onFocus={(e) => { e.target.style.borderColor = 'var(--primary-color)'; }}
                                            onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; }}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Qty"
                                            value={formData.item_quantity || 1}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value) || 1;
                                                setFormData(prev => ({ ...prev, item_quantity: val > 0 ? val : 1 }));
                                            }}
                                            min="1"
                                            style={{
                                                height: '34px',
                                                padding: '0 10px',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '8px',
                                                fontSize: '0.75rem',
                                                fontFamily: 'var(--font-family)',
                                                background: 'var(--card-bg)',
                                                color: 'var(--text-primary)',
                                                outline: 'none',
                                                width: '60px',
                                                transition: 'border-color 0.2s ease'
                                            }}
                                            onFocus={(e) => { e.target.style.borderColor = 'var(--primary-color)'; }}
                                            onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; }}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Price"
                                            value={formData.item_price || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, item_price: e.target.value }))}
                                            onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
                                            min="0"
                                            step="0.01"
                                            style={{
                                                height: '34px',
                                                padding: '0 10px',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '8px',
                                                fontSize: '0.75rem',
                                                fontFamily: 'var(--font-family)',
                                                background: 'var(--card-bg)',
                                                color: 'var(--text-primary)',
                                                outline: 'none',
                                                width: '80px',
                                                transition: 'border-color 0.2s ease'
                                            }}
                                            onFocus={(e) => { e.target.style.borderColor = 'var(--primary-color)'; }}
                                            onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; }}
                                        />
                                        <span style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            color: 'var(--text-primary)',
                                            minWidth: '60px'
                                        }}>
                                            Rs. {((parseInt(formData.item_quantity) || 0) * (parseFloat(formData.item_price) || 0)).toFixed(2)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={addItem}
                                            style={{
                                                padding: '4px 8px',
                                                border: 'none',
                                                borderRadius: '6px',
                                                background: 'var(--primary-color)',
                                                color: 'white',
                                                cursor: 'pointer',
                                                fontSize: '0.7rem',
                                                fontFamily: 'var(--font-family)',
                                                transition: 'all 0.2s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '2px',
                                                whiteSpace: 'nowrap'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.background = 'var(--primary-hover)';
                                                e.target.style.transform = 'scale(1.05)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.background = 'var(--primary-color)';
                                                e.target.style.transform = 'scale(1)';
                                            }}
                                        >
                                            <Plus size={14} /> Add
                                        </button>
                                    </div>
                                    {formData.items.length > 0 && (
                                        <div style={{
                                            maxHeight: '150px',
                                            overflowY: 'auto',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '8px',
                                            background: 'var(--card-bg)'
                                        }}>
                                            {formData.items.map(item => (
                                                <div key={item.id} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '6px 10px',
                                                    borderBottom: '1px solid var(--border-color)'
                                                }}>
                                                    <div style={{ flex: 1 }}>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                                            {item.name}
                                                        </span>
                                                        {item.description && (
                                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                                                                {item.description}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginRight: '12px' }}>
                                                        {item.quantity} x Rs. {item.price.toFixed(2)} = Rs. {item.total.toFixed(2)}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(item.id)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            color: 'var(--danger-color)',
                                                            padding: '2px'
                                                        }}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {formErrors.items && <span className="error-text" style={{ fontSize: '0.75rem', color: 'var(--danger-color)' }}>{formErrors.items}</span>}
                                </div>

                                {/* Financials */}
                                <div className="grid-3-cols" style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr 1fr',
                                    gap: '12px'
                                }}>
                                    <div className="form-group">
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}>Subtotal</label>
                                        <input
                                            type="number"
                                            name="subtotal"
                                            className="input-control"
                                            value={formData.subtotal}
                                            onChange={handleFormChange}
                                            step="0.01"
                                            style={{
                                                width: '100%',
                                                height: '36px',
                                                padding: '0 10px',
                                                fontFamily: 'var(--font-family)',
                                                fontSize: '0.75rem',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '8px',
                                                background: 'var(--bg-primary)',
                                                color: 'var(--text-secondary)',
                                                outline: 'none'
                                            }}
                                            readOnly
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}>Discount</label>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <input
                                                type="number"
                                                name="discount_value"
                                                className="input-control"
                                                value={formData.discount_value}
                                                onChange={handleFormChange}
                                                min="0"
                                                step="0.01"
                                                style={{
                                                    flex: 1,
                                                    height: '36px',
                                                    padding: '0 10px',
                                                    fontFamily: 'var(--font-family)',
                                                    fontSize: '0.75rem',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    background: 'var(--card-bg)',
                                                    color: 'var(--text-primary)',
                                                    outline: 'none'
                                                }}
                                            />
                                            <select
                                                name="discount_type"
                                                className="hms-select"
                                                value={formData.discount_type}
                                                onChange={handleFormChange}
                                                style={{
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.7rem',
                                                    fontFamily: 'var(--font-family)',
                                                    background: 'var(--card-bg)',
                                                    color: 'var(--text-primary)',
                                                    outline: 'none',
                                                    width: '70px'
                                                }}
                                            >
                                                <option value="percentage">%</option>
                                                <option value="fixed">Rs.</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}>Tax</label>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <input
                                                type="number"
                                                name="tax_value"
                                                className="input-control"
                                                value={formData.tax_value}
                                                onChange={handleFormChange}
                                                min="0"
                                                step="0.01"
                                                style={{
                                                    flex: 1,
                                                    height: '36px',
                                                    padding: '0 10px',
                                                    fontFamily: 'var(--font-family)',
                                                    fontSize: '0.75rem',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    background: 'var(--card-bg)',
                                                    color: 'var(--text-primary)',
                                                    outline: 'none'
                                                }}
                                            />
                                            <select
                                                name="tax_type"
                                                className="hms-select"
                                                value={formData.tax_type}
                                                onChange={handleFormChange}
                                                style={{
                                                    height: '36px',
                                                    padding: '0 8px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.7rem',
                                                    fontFamily: 'var(--font-family)',
                                                    background: 'var(--card-bg)',
                                                    color: 'var(--text-primary)',
                                                    outline: 'none',
                                                    width: '70px'
                                                }}
                                            >
                                                <option value="percentage">%</option>
                                                <option value="fixed">Rs.</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Totals */}
                                <div className="totals-section" style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr 1fr 1fr',
                                    gap: '8px',
                                    padding: '12px',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Subtotal</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            Rs. {formData.subtotal.toFixed(2)}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Discount</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#10B981' }}>
                                            -Rs. {formData.discount_amount.toFixed(2)}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Tax</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#F59E0B' }}>
                                            +Rs. {formData.tax_amount.toFixed(2)}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                                            Rs. {formData.total.toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                {/* Reference & Notes */}
                                <div className="grid-2-cols" style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '12px'
                                }}>
                                    <div className="form-group">
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.8rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}><Hash size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Reference</label>
                                        <input
                                            type="text"
                                            name="reference"
                                            className="input-control"
                                            value={formData.reference}
                                            onChange={handleFormChange}
                                            placeholder="Reference number or PO #"
                                            style={{
                                                width: '100%',
                                                height: '40px',
                                                padding: '0 12px',
                                                fontFamily: 'var(--font-family)',
                                                fontSize: '0.8rem',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '10px',
                                                background: 'var(--card-bg)',
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
                                    <div className="form-group">
                                        <label className="form-label" style={{
                                            display: 'block',
                                            fontSize: '0.8rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}><FileText size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Department</label>
                                        <input
                                            type="text"
                                            name="department"
                                            className="input-control"
                                            value={formData.department}
                                            onChange={handleFormChange}
                                            placeholder="e.g. Cardiology, OPD, ICU"
                                            style={{
                                                width: '100%',
                                                height: '40px',
                                                padding: '0 12px',
                                                fontFamily: 'var(--font-family)',
                                                fontSize: '0.8rem',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '10px',
                                                background: 'var(--card-bg)',
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
                                </div>

                                {/* Notes */}
                                <div className="form-group">
                                    <label className="form-label" style={{
                                        display: 'block',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}><MessageSquare size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Notes</label>
                                    <textarea
                                        name="notes"
                                        className="input-control"
                                        value={formData.notes}
                                        onChange={handleFormChange}
                                        placeholder="Additional notes or instructions..."
                                        style={{
                                            minHeight: '50px',
                                            width: '100%',
                                            padding: '8px 12px',
                                            fontFamily: 'var(--font-family)',
                                            fontSize: '0.8rem',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            background: 'var(--card-bg)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            resize: 'vertical',
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
                            </form>
                        </div>
                        <div className="hms-modal-footer" style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '8px',
                            padding: '14px 20px',
                            borderTop: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            borderRadius: '0 0 16px 16px'
                        }}>
                            <button
                                onClick={() => setIsEditOpen(false)}
                                style={{
                                    padding: '6px 16px',
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
                                    e.target.style.background = 'var(--hover-bg)';
                                    e.target.style.color = 'var(--text-primary)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'transparent';
                                    e.target.style.color = 'var(--text-secondary)';
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditSubmit}
                                disabled={actionLoading}
                                style={{
                                    padding: '6px 16px',
                                    border: 'none',
                                    borderRadius: '10px',
                                    background: 'var(--primary-color)',
                                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'white',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    opacity: actionLoading ? 0.7 : 1,
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    if (!actionLoading) {
                                        e.target.style.background = 'var(--primary-hover)';
                                        e.target.style.transform = 'translateY(-1px)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.25)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!actionLoading) {
                                        e.target.style.background = 'var(--primary-color)';
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = 'none';
                                    }
                                }}
                            >
                                <Save size={14} />
                                {actionLoading ? 'Saving...' : 'Update Invoice'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* ===== VIEW INVOICE MODAL ===== */}
            {/* ============================================================ */}
            {isViewOpen && selectedInvoice && (
                <div className="hms-modal-backdrop" onClick={() => setIsViewOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{
                        maxWidth: '650px',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'var(--card-bg)',
                        borderRadius: '16px',
                        boxShadow: 'var(--shadow-xl)',
                        border: '1px solid var(--border-color)',
                        width: '100%',
                        margin: '16px'
                    }}>
                        <div className="hms-modal-header" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '16px 20px',
                            borderBottom: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            borderRadius: '16px 16px 0 0'
                        }}>
                            <h3 className="hms-modal-title" style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'var(--text-primary)'
                            }}>
                                <FileText size={18} style={{ color: 'var(--primary-color)' }} />
                                Invoice Details
                            </h3>
                            <button
                                onClick={() => setIsViewOpen(false)}
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
                                    e.target.style.background = 'var(--hover-bg)';
                                    e.target.style.color = 'var(--danger-color)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'transparent';
                                    e.target.style.color = 'var(--text-secondary)';
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="hms-modal-body" style={{
                            padding: '20px',
                            overflowY: 'auto',
                            flex: 1
                        }}>
                            <div style={{
                                borderBottom: '2px solid var(--border-color)',
                                paddingBottom: '14px',
                                marginBottom: '16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '10px'
                            }}>
                                <div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-color)' }}>🏥 Subhan Care Clinic</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ph: +92-51-1234567 | Sector G-8, Islamabad</div>
                                </div>
                                <div style={{
                                    padding: '3px 12px',
                                    borderRadius: '20px',
                                    background: 'rgba(37, 99, 235, 0.08)',
                                    color: 'var(--primary-color)',
                                    fontSize: '0.65rem',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Invoice #{selectedInvoice.invoice_number}
                                </div>
                            </div>
                            <div className="view-grid-2-cols" style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '12px',
                                marginBottom: '16px',
                                fontSize: '0.8rem'
                            }}>
                                <div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block', marginBottom: '2px' }}>
                                        <User size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--primary-color)' }} /> Patient
                                    </span>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {selectedInvoice.patients?.name || 'Unknown'}
                                    </div>
                                    {selectedInvoice.patients?.phone && (
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            {selectedInvoice.patients.phone}
                                        </div>
                                    )}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block', marginBottom: '2px' }}>
                                        <Calendar size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} /> Date
                                    </span>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {new Date(selectedInvoice.invoice_date || selectedInvoice.created_at).toLocaleDateString()}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        Due: {new Date(selectedInvoice.due_date).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                            {/* Items */}
                            {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                                <div style={{
                                    borderTop: '1px solid var(--border-color)',
                                    paddingTop: '14px',
                                    marginBottom: '14px'
                                }}>
                                    <h4 style={{
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        marginBottom: '6px',
                                        color: 'var(--text-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <Clipboard size={16} style={{ color: 'var(--primary-color)' }} /> Invoice Items
                                    </h4>
                                    <div style={{
                                        background: 'var(--bg-primary)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        overflow: 'hidden'
                                    }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                            <thead>
                                                <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
                                                    <th style={{ padding: '6px 10px', textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)' }}>Item</th>
                                                    <th style={{ padding: '6px 10px', textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-muted)' }}>Qty</th>
                                                    <th style={{ padding: '6px 10px', textAlign: 'right', fontSize: '0.65rem', color: 'var(--text-muted)' }}>Price</th>
                                                    <th style={{ padding: '6px 10px', textAlign: 'right', fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedInvoice.items.map((item, index) => (
                                                    <tr key={index} style={{ borderBottom: index < selectedInvoice.items.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                                        <td style={{ padding: '6px 10px', color: 'var(--text-primary)' }}>{item.name}</td>
                                                        <td style={{ padding: '6px 10px', textAlign: 'center', color: 'var(--text-primary)' }}>{item.quantity}</td>
                                                        <td style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text-primary)' }}>Rs. {item.price.toFixed(2)}</td>
                                                        <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>Rs. {item.total.toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            {/* Totals */}
                            <div style={{
                                borderTop: '1px solid var(--border-color)',
                                paddingTop: '14px',
                                marginBottom: '14px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '20px',
                                    fontSize: '0.8rem',
                                    flexWrap: 'wrap'
                                }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Subtotal</div>
                                        <div style={{ color: 'var(--text-secondary)' }}>Rs. {parseFloat(selectedInvoice.subtotal || 0).toFixed(2)}</div>
                                    </div>
                                    {selectedInvoice.discount_amount > 0 && (
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Discount</div>
                                            <div style={{ color: '#10B981' }}>-Rs. {parseFloat(selectedInvoice.discount_amount).toFixed(2)}</div>
                                        </div>
                                    )}
                                    {selectedInvoice.tax_amount > 0 && (
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Tax</div>
                                            <div style={{ color: '#F59E0B' }}>+Rs. {parseFloat(selectedInvoice.tax_amount).toFixed(2)}</div>
                                        </div>
                                    )}
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Total</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                                            Rs. {parseFloat(selectedInvoice.total).toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {selectedInvoice.notes && (
                                <div style={{
                                    borderTop: '1px solid var(--border-color)',
                                    paddingTop: '14px',
                                    marginBottom: '14px'
                                }}>
                                    <h4 style={{
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        marginBottom: '6px',
                                        color: 'var(--text-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <FileText size={16} style={{ color: 'var(--warning-color)' }} /> Notes
                                    </h4>
                                    <div style={{
                                        fontSize: '0.8rem',
                                        color: 'var(--text-secondary)',
                                        background: 'var(--bg-primary)',
                                        padding: '10px',
                                        borderRadius: '10px',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        {selectedInvoice.notes}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="hms-modal-footer" style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '8px',
                            padding: '14px 20px',
                            borderTop: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            borderRadius: '0 0 16px 16px'
                        }}>
                            <button
                                onClick={() => {
                                    setIsViewOpen(false);
                                    openEditModal(selectedInvoice);
                                }}
                                style={{
                                    padding: '6px 16px',
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
                                    e.target.style.borderColor = '#22C55E';
                                    e.target.style.color = '#22C55E';
                                    e.target.style.background = 'rgba(34, 197, 94, 0.04)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.borderColor = 'var(--border-color)';
                                    e.target.style.color = 'var(--text-secondary)';
                                    e.target.style.background = 'transparent';
                                }}
                            >
                                <Edit size={14} /> Edit
                            </button>
                            <button
                                onClick={() => {
                                    setIsViewOpen(false);
                                    openPaymentModal(selectedInvoice);
                                }}
                                style={{
                                    padding: '6px 16px',
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
                                    e.target.style.borderColor = '#10B981';
                                    e.target.style.color = '#10B981';
                                    e.target.style.background = 'rgba(16, 185, 129, 0.04)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.borderColor = 'var(--border-color)';
                                    e.target.style.color = 'var(--text-secondary)';
                                    e.target.style.background = 'transparent';
                                }}
                            >
                                <CreditCard size={14} /> Pay
                            </button>
                            <button
                                onClick={() => window.print()}
                                style={{
                                    padding: '6px 16px',
                                    border: 'none',
                                    borderRadius: '10px',
                                    background: 'var(--primary-color)',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'white',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
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
                                <Printer size={14} /> Print
                            </button>
                            <button
                                onClick={() => setIsViewOpen(false)}
                                style={{
                                    padding: '6px 16px',
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
                                    e.target.style.background = 'var(--hover-bg)';
                                    e.target.style.color = 'var(--text-primary)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'transparent';
                                    e.target.style.color = 'var(--text-secondary)';
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* ===== PAYMENT MODAL ===== */}
            {/* ============================================================ */}
            {isPaymentOpen && selectedInvoice && (
                <div className="hms-modal-backdrop" onClick={() => setIsPaymentOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{
                        maxWidth: '480px',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'var(--card-bg)',
                        borderRadius: '16px',
                        boxShadow: 'var(--shadow-xl)',
                        border: '1px solid var(--border-color)',
                        width: '100%',
                        margin: '16px'
                    }}>
                        <div className="hms-modal-header" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '16px 20px',
                            borderBottom: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            borderRadius: '16px 16px 0 0'
                        }}>
                            <h3 className="hms-modal-title" style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'var(--text-primary)'
                            }}>
                                <CreditCard size={18} style={{ color: '#10B981' }} />
                                Process Payment
                            </h3>
                            <button
                                onClick={() => setIsPaymentOpen(false)}
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
                                    e.target.style.background = 'var(--hover-bg)';
                                    e.target.style.color = 'var(--danger-color)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'transparent';
                                    e.target.style.color = 'var(--text-secondary)';
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="hms-modal-body" style={{
                            padding: '20px',
                            overflowY: 'auto',
                            flex: 1
                        }}>
                            {errorMsg && (
                                <div className="alert alert-danger" style={{
                                    marginBottom: '12px',
                                    padding: '10px 14px',
                                    background: '#EF444415',
                                    border: '1px solid #EF444430',
                                    borderRadius: '8px',
                                    color: '#EF4444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <AlertCircle size={16} /> {errorMsg}
                                </div>
                            )}
                            <div style={{
                                padding: '14px',
                                background: 'var(--bg-primary)',
                                borderRadius: '10px',
                                border: '1px solid var(--border-color)',
                                marginBottom: '16px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    paddingBottom: '8px',
                                    borderBottom: '1px solid var(--border-color)'
                                }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Invoice #</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {selectedInvoice.invoice_number}
                                    </span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '8px 0',
                                    borderBottom: '1px solid var(--border-color)'
                                }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Patient</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                        {selectedInvoice.patients?.name || 'Unknown'}
                                    </span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    paddingTop: '8px'
                                }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Amount</span>
                                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                                        Rs. {parseFloat(selectedInvoice.total).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                            <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div className="form-group">
                                    <label className="form-label" style={{
                                        display: 'block',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '6px'
                                    }}>
                                        <DollarSign size={14} style={{ display: 'inline', marginRight: '4px', color: '#10B981' }} />
                                        Payment Amount *
                                    </label>
                                    <input
                                        type="number"
                                        name="paid_amount"
                                        className="input-control"
                                        value={formData.paid_amount}
                                        onChange={handleFormChange}
                                        min="0.01"
                                        max={parseFloat(selectedInvoice.total)}
                                        step="0.01"
                                        required
                                        autoFocus
                                        style={{
                                            width: '100%',
                                            height: '44px',
                                            padding: '0 14px',
                                            fontFamily: 'var(--font-family)',
                                            fontSize: '1rem',
                                            border: '2px solid var(--border-color)',
                                            borderRadius: '10px',
                                            background: 'var(--card-bg)',
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
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '0.7rem',
                                        color: 'var(--text-muted)',
                                        marginTop: '4px'
                                    }}>
                                        <span>Max: Rs. {parseFloat(selectedInvoice.total).toFixed(2)}</span>
                                        <span>Remaining: Rs. {(parseFloat(selectedInvoice.total) - parseFloat(formData.paid_amount || 0)).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{
                                        display: 'block',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '6px'
                                    }}>
                                        <Wallet size={14} style={{ display: 'inline', marginRight: '4px', color: '#8B5CF6' }} />
                                        Payment Method *
                                    </label>
                                    <select
                                        name="payment_method"
                                        className="hms-select"
                                        value={formData.payment_method}
                                        onChange={handleFormChange}
                                        required
                                        style={{
                                            width: '100%',
                                            height: '44px',
                                            padding: '0 14px',
                                            border: '2px solid var(--border-color)',
                                            borderRadius: '10px',
                                            fontFamily: 'var(--font-family)',
                                            fontSize: '0.9rem',
                                            background: 'var(--card-bg)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            transition: 'all 0.2s ease',
                                            appearance: 'none',
                                            cursor: 'pointer'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--primary-color)';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border-color)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    >
                                        <option value="cash">💵 Cash</option>
                                        <option value="card">💳 Card</option>
                                        <option value="bank_transfer">🏦 Bank Transfer</option>
                                        <option value="insurance">🛡️ Insurance</option>
                                        <option value="online">🌐 Online Payment</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{
                                        display: 'block',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '6px'
                                    }}>
                                        <MessageSquare size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} />
                                        Payment Notes (Optional)
                                    </label>
                                    <textarea
                                        name="payment_notes"
                                        className="input-control"
                                        value={formData.payment_notes}
                                        onChange={handleFormChange}
                                        placeholder="Any notes about this payment..."
                                        style={{
                                            minHeight: '50px',
                                            width: '100%',
                                            padding: '10px 14px',
                                            fontFamily: 'var(--font-family)',
                                            fontSize: '0.85rem',
                                            border: '2px solid var(--border-color)',
                                            borderRadius: '10px',
                                            background: 'var(--card-bg)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            resize: 'vertical',
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
                                            Rs. {parseFloat(selectedInvoice.total).toFixed(2)}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Paid</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#10B981' }}>
                                            Rs. {parseFloat(formData.paid_amount || 0).toFixed(2)}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Remaining</div>
                                        <div style={{
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                            color: parseFloat(selectedInvoice.total) - parseFloat(formData.paid_amount || 0) > 0 ? '#EF4444' : '#10B981'
                                        }}>
                                            Rs. {(parseFloat(selectedInvoice.total) - parseFloat(formData.paid_amount || 0)).toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="hms-modal-footer" style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '8px',
                            padding: '14px 20px',
                            borderTop: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            borderRadius: '0 0 16px 16px'
                        }}>
                            <button
                                onClick={() => setIsPaymentOpen(false)}
                                style={{
                                    padding: '8px 18px',
                                    border: '1.5px solid var(--border-color)',
                                    borderRadius: '10px',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
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
                                Cancel
                            </button>
                            <button
                                onClick={handlePaymentSubmit}
                                disabled={actionLoading || !formData.paid_amount || parseFloat(formData.paid_amount) <= 0}
                                style={{
                                    padding: '8px 18px',
                                    border: 'none',
                                    borderRadius: '10px',
                                    background: '#10B981',
                                    cursor: actionLoading || !formData.paid_amount || parseFloat(formData.paid_amount) <= 0 ? 'not-allowed' : 'pointer',
                                    fontSize: '0.85rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'white',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    opacity: actionLoading || !formData.paid_amount || parseFloat(formData.paid_amount) <= 0 ? 0.6 : 1,
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    if (!actionLoading && formData.paid_amount && parseFloat(formData.paid_amount) > 0) {
                                        e.target.style.background = '#059669';
                                        e.target.style.transform = 'translateY(-1px)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.25)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!actionLoading && formData.paid_amount && parseFloat(formData.paid_amount) > 0) {
                                        e.target.style.background = '#10B981';
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = 'none';
                                    }
                                }}
                            >
                                <CreditCard size={16} />
                                {actionLoading ? 'Processing...' : 'Process Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* ===== RECEIPT MODAL ===== */}
            {/* ============================================================ */}
            {isReceiptOpen && selectedInvoice && (
                <div className="hms-modal-backdrop" onClick={() => setIsReceiptOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{
                        maxWidth: '450px',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'var(--card-bg)',
                        borderRadius: '16px',
                        boxShadow: 'var(--shadow-xl)',
                        border: '1px solid var(--border-color)',
                        width: '100%',
                        margin: '16px'
                    }}>
                        <div className="hms-modal-header" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '16px 20px',
                            borderBottom: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            borderRadius: '16px 16px 0 0'
                        }}>
                            <h3 className="hms-modal-title" style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'var(--text-primary)'
                            }}>
                                <Receipt size={18} style={{ color: '#10B981' }} />
                                Payment Receipt
                            </h3>
                            <button
                                onClick={() => setIsReceiptOpen(false)}
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
                                    e.target.style.background = 'var(--hover-bg)';
                                    e.target.style.color = 'var(--danger-color)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'transparent';
                                    e.target.style.color = 'var(--text-secondary)';
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="hms-modal-body" style={{
                            padding: '20px',
                            overflowY: 'auto',
                            flex: 1
                        }}>
                            <div style={{
                                textAlign: 'center',
                                paddingBottom: '16px',
                                borderBottom: '2px dashed var(--border-color)',
                                marginBottom: '16px'
                            }}>
                                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary-color)' }}>🏥 Subhan Care Clinic</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ph: +92-51-1234567 | Sector G-8, Islamabad</div>
                                <div style={{
                                    marginTop: '10px',
                                    padding: '4px 16px',
                                    background: '#10B98115',
                                    color: '#10B981',
                                    borderRadius: '20px',
                                    display: 'inline-block',
                                    fontSize: '0.75rem',
                                    fontWeight: 600
                                }}>
                                    ✅ Payment Successful
                                </div>
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '6px 12px',
                                fontSize: '0.85rem',
                                marginBottom: '16px',
                                padding: '12px',
                                background: 'var(--bg-primary)',
                                borderRadius: '8px'
                            }}>
                                <div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', display: 'block' }}>Invoice #</span>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {selectedInvoice.invoice_number}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', display: 'block' }}>Date</span>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {new Date().toLocaleDateString()}
                                    </div>
                                </div>
                                <div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', display: 'block' }}>Patient</span>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {selectedInvoice.patients?.name || 'Unknown'}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', display: 'block' }}>Payment Method</span>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                                        {formData.payment_method || 'N/A'}
                                    </div>
                                </div>
                            </div>
                            <div style={{
                                borderTop: '1px solid var(--border-color)',
                                borderBottom: '1px solid var(--border-color)',
                                padding: '12px 0',
                                marginBottom: '12px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Total Amount</span>
                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                        Rs. {parseFloat(selectedInvoice.total).toFixed(2)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Paid Amount</span>
                                    <span style={{ fontWeight: 600, color: '#10B981' }}>
                                        Rs. {parseFloat(formData.paid_amount || selectedInvoice.total).toFixed(2)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: '1px dashed var(--border-color)', marginTop: '4px', paddingTop: '8px' }}>
                                    <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Remaining Balance</span>
                                    <span style={{
                                        fontWeight: 700,
                                        color: parseFloat(selectedInvoice.total) - parseFloat(formData.paid_amount || selectedInvoice.total) > 0 ? '#EF4444' : '#10B981'
                                    }}>
                                        Rs. {(parseFloat(selectedInvoice.total) - parseFloat(formData.paid_amount || selectedInvoice.total)).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                            {formData.payment_notes && (
                                <div style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--text-muted)',
                                    padding: '8px 12px',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <span style={{ fontWeight: 500 }}>📝 Notes:</span> {formData.payment_notes}
                                </div>
                            )}
                            <div style={{
                                textAlign: 'center',
                                marginTop: '12px',
                                fontSize: '0.65rem',
                                color: 'var(--text-muted)',
                                borderTop: '1px dashed var(--border-color)',
                                paddingTop: '12px'
                            }}>
                                Thank you for your payment! 🎉
                            </div>
                        </div>
                        <div className="hms-modal-footer" style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '8px',
                            padding: '14px 20px',
                            borderTop: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            borderRadius: '0 0 16px 16px'
                        }}>
                            <button
                                onClick={() => window.print()}
                                style={{
                                    padding: '8px 18px',
                                    border: 'none',
                                    borderRadius: '10px',
                                    background: 'var(--primary-color)',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'white',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
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
                                <Printer size={16} /> Print Receipt
                            </button>
                            <button
                                onClick={() => setIsReceiptOpen(false)}
                                style={{
                                    padding: '8px 18px',
                                    border: '1.5px solid var(--border-color)',
                                    borderRadius: '10px',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
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
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* ===== DELETE CONFIRMATION MODAL ===== */}
            {/* ============================================================ */}
            {isDeleteOpen && selectedInvoice && (
                <div className="hms-modal-backdrop" onClick={() => setIsDeleteOpen(false)}>
                    <div className="hms-modal" onClick={(e) => e.stopPropagation()} style={{
                        maxWidth: '400px',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'var(--card-bg)',
                        borderRadius: '16px',
                        boxShadow: 'var(--shadow-xl)',
                        border: '1px solid var(--border-color)',
                        width: '100%',
                        margin: '16px'
                    }}>
                        <div className="hms-modal-header" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '14px 18px',
                            borderBottom: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            borderRadius: '16px 16px 0 0'
                        }}>
                            <h3 className="hms-modal-title" style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'var(--text-primary)'
                            }}>
                                <Trash2 size={18} style={{ color: 'var(--danger-color)' }} />
                                Delete Invoice
                            </h3>
                            <button
                                onClick={() => setIsDeleteOpen(false)}
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
                                    e.target.style.background = 'var(--hover-bg)';
                                    e.target.style.color = 'var(--danger-color)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'transparent';
                                    e.target.style.color = 'var(--text-secondary)';
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="hms-modal-body" style={{
                            padding: '18px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚠️</div>
                            <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
                                Are you sure you want to delete this invoice?
                            </p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                Invoice: <strong>{selectedInvoice.invoice_number}</strong>
                                <br />
                                Patient: <strong>{selectedInvoice.patients?.name || 'Unknown'}</strong>
                                <br />
                                Amount: <strong>Rs. {parseFloat(selectedInvoice.total).toFixed(2)}</strong>
                            </p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '8px' }}>
                                This action cannot be undone.
                            </p>
                        </div>
                        <div className="hms-modal-footer" style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '8px',
                            padding: '12px 18px',
                            borderTop: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            borderRadius: '0 0 16px 16px'
                        }}>
                            <button
                                onClick={() => setIsDeleteOpen(false)}
                                style={{
                                    padding: '6px 16px',
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
                                    e.target.style.background = 'var(--hover-bg)';
                                    e.target.style.color = 'var(--text-primary)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'transparent';
                                    e.target.style.color = 'var(--text-secondary)';
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteSubmit}
                                disabled={actionLoading}
                                style={{
                                    padding: '6px 16px',
                                    border: 'none',
                                    borderRadius: '10px',
                                    background: 'var(--danger-color)',
                                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'white',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    opacity: actionLoading ? 0.7 : 1,
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    if (!actionLoading) {
                                        e.target.style.background = 'var(--danger-hover)';
                                        e.target.style.transform = 'translateY(-1px)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.25)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!actionLoading) {
                                        e.target.style.background = 'var(--danger-color)';
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = 'none';
                                    }
                                }}
                            >
                                <Trash2 size={14} />
                                {actionLoading ? 'Deleting...' : 'Delete Permanently'}
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
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* ===== MOBILE RESPONSIVENESS ===== */
                @media (max-width: 768px) {
                    .hms-modal {
                        max-width: 95% !important;
                        margin: 8px !important;
                        max-height: 95vh !important;
                        border-radius: 12px !important;
                    }
                    
                    .hms-modal-header {
                        padding: 12px 14px !important;
                    }
                    
                    .hms-modal-body {
                        padding: 14px !important;
                    }
                    
                    .hms-modal-footer {
                        padding: 10px 14px !important;
                        flex-wrap: wrap !important;
                    }
                    
                    .hms-modal-footer button {
                        justify-content: center !important;
                        width: 100% !important;
                    }
                    
                    .grid-3-cols {
                        grid-template-columns: 1fr !important;
                        gap: 10px !important;
                    }
                    
                    .grid-2-cols {
                        grid-template-columns: 1fr !important;
                        gap: 10px !important;
                    }
                    
                    .totals-section {
                        grid-template-columns: 1fr 1fr !important;
                        gap: 6px !important;
                        padding: 10px !important;
                    }
                    
                    .totals-section > div {
                        text-align: center !important;
                    }
                    
                    .stats-grid {
                        grid-template-columns: 1fr 1fr !important;
                        gap: 8px !important;
                    }
                    
                    .stats-grid > div {
                        padding: 10px 12px !important;
                    }
                    
                    .stats-grid > div > div:last-child {
                        font-size: 1rem !important;
                    }
                    
                    .hms-table-container {
                        overflow-x: auto !important;
                        -webkit-overflow-scrolling: touch !important;
                    }
                    
                    .hms-table {
                        min-width: 650px !important;
                        font-size: 0.7rem !important;
                    }
                    
                    .hms-table th,
                    .hms-table td {
                        padding: 6px 8px !important;
                    }
                    
                    .hms-controls-bar {
                        flex-direction: column !important;
                        align-items: stretch !important;
                        gap: 8px !important;
                    }
                    
                    .hms-search-box {
                        width: 100% !important;
                    }
                    
                    .controls-actions {
                        display: flex !important;
                        flex-wrap: wrap !important;
                        gap: 6px !important;
                        justify-content: center !important;
                    }
                    
                    .billing-header {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 10px !important;
                    }
                    
                    .billing-header-actions {
                        width: 100% !important;
                        justify-content: flex-start !important;
                        flex-wrap: wrap !important;
                    }
                    
                    .filters-bar {
                        flex-direction: column !important;
                        align-items: stretch !important;
                    }
                    
                    .filters-bar select,
                    .filters-bar input {
                        width: 100% !important;
                    }
                    
                    .view-grid-2-cols {
                        grid-template-columns: 1fr !important;
                        gap: 6px !important;
                    }
                    
                    .view-grid-2-cols > div:last-child {
                        text-align: left !important;
                    }
                    
                    .receipt-grid {
                        grid-template-columns: 1fr !important;
                        gap: 6px !important;
                    }
                    
                    .receipt-grid > div:last-child {
                        text-align: left !important;
                    }
                    
                    .export-dropdown {
                        right: -30px !important;
                        min-width: 180px !important;
                    }
                    
                    .add-item-row {
                        display: flex !important;
                        flex-direction: column !important;
                        gap: 6px !important;
                    }
                    
                    .add-item-row input,
                    .add-item-row select {
                        width: 100% !important;
                    }
                    
                    .hms-modal input,
                    .hms-modal select,
                    .hms-modal textarea {
                        font-size: 16px !important;
                    }
                }
                
                @media (max-width: 480px) {
                    .hms-modal {
                        max-width: 98% !important;
                        margin: 4px !important;
                        border-radius: 8px !important;
                    }
                    
                    .stats-grid {
                        grid-template-columns: 1fr 1fr !important;
                        gap: 6px !important;
                    }
                    
                    .stats-grid > div {
                        padding: 8px 10px !important;
                    }
                    
                    .stats-grid > div > div:last-child {
                        font-size: 0.9rem !important;
                    }
                    
                    .billing-header h1 {
                        font-size: 1.1rem !important;
                    }
                    
                    .hms-modal-header h3 {
                        font-size: 0.85rem !important;
                    }
                }
            `}</style>
        </DashboardLayout>
    );
};

export default Billing;