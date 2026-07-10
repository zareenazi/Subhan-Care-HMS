import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { dbInvoices, dbPatients, dbAppointments } from '../services/db';
import Button from '../components/Button';
import InputField from '../components/InputField';
import { Plus, Search, Eye, CreditCard, Check, X, FileText, Printer, ShieldAlert } from 'lucide-react';

const Billing = () => {
    const [invoices, setInvoices] = useState([]);
    const [patients, setPatients] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Totals
    const [outstandingAmount, setOutstandingAmount] = useState(0);

    // Modals
    const [isGenerateOpen, setIsGenerateOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);

    // Selected Invoice
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    // Generate Invoice Form
    const [invoiceForm, setInvoiceForm] = useState({
        patient_id: '',
        appointment_id: '',
        amount: '',
        due_date: ''
    });

    // Payment Form
    const [paymentMethod, setPaymentMethod] = useState('Cash');

    const [formErrors, setFormErrors] = useState({});
    const [actionLoading, setActionLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Load billing records
    const loadBilling = async () => {
        setLoading(true);
        try {
            const [invData, patData, apptData] = await Promise.all([
                dbInvoices.getInvoices(),
                dbPatients.getPatients({ limit: 100 }),
                dbAppointments.getAppointments()
            ]);

            setInvoices(invData);
            setPatients(patData.patients || []);
            setAppointments(apptData || []);

            // Calculate outstanding payments (Unpaid/Pending status)
            const outstanding = invData
                .filter(inv => inv.status !== 'Paid')
                .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
            setOutstandingAmount(outstanding);
        } catch (err) {
            console.error('Failed to load billing:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBilling();
    }, []);

    // Filter invoices by search and dropdown status
    const filteredInvoices = invoices.filter(inv => {
        const patientName = inv.patient?.name || '';
        const matchesSearch = patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === '' || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setInvoiceForm(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateInvoiceForm = () => {
        const errors = {};
        if (!invoiceForm.patient_id) errors.patient_id = 'Please select a patient';
        if (!invoiceForm.amount || parseFloat(invoiceForm.amount) <= 0) {
            errors.amount = 'Please enter a valid amount greater than 0';
        }
        if (!invoiceForm.due_date) errors.due_date = 'Please set a due date';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const openGenerateModal = () => {
        setInvoiceForm({
            patient_id: '',
            appointment_id: '',
            amount: '',
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // default 7 days due
        });
        setFormErrors({});
        setErrorMsg('');
        setIsGenerateOpen(true);
    };

    const handleGenerateSubmit = async (e) => {
        e.preventDefault();
        if (!validateInvoiceForm()) return;
        setActionLoading(true);
        setErrorMsg('');
        try {
            await dbInvoices.createInvoice({
                ...invoiceForm,
                amount: parseFloat(invoiceForm.amount),
                status: 'Unpaid'
            });
            setIsGenerateOpen(false);
            loadBilling();
        } catch (err) {
            setErrorMsg(err.message || 'Failed to generate invoice.');
        } finally {
            setActionLoading(false);
        }
    };

    const openPaymentModal = (invoice) => {
        setSelectedInvoice(invoice);
        setPaymentMethod('Cash');
        setIsPaymentOpen(true);
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const updated = await dbInvoices.updateInvoice(selectedInvoice.id, {
                status: 'Paid',
                payment_method: paymentMethod
            });
            // Update selected invoice details
            setSelectedInvoice({
                ...selectedInvoice,
                status: 'Paid',
                payment_method: paymentMethod
            });
            setIsPaymentOpen(false);
            setIsReceiptOpen(true);
            loadBilling();
        } catch (err) {
            alert('Failed to process payment: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const openReceiptModal = (invoice) => {
        setSelectedInvoice(invoice);
        setIsReceiptOpen(true);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <DashboardLayout active="billing" title="Billing & Invoices">
            {/* Outstanding Summary banner */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div className="auth-card" style={{ padding: '20px', borderLeft: '4px solid var(--danger-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'none' }}>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Outstanding Payments</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                            Rs. {outstandingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', padding: '12px', borderRadius: '50%' }}>
                        <ShieldAlert size={24} />
                    </div>
                </div>
            </div>

            {/* Control Bar */}
            <div className="hms-controls-bar">
                <div className="hms-search-box">
                    <Search size={18} className="hms-search-icon" />
                    <input
                        type="text"
                        placeholder="Search by invoice # or patient name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="hms-filters">
                    <select
                        className="hms-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                        <option value="Pending">Pending</option>
                    </select>
                    <Button onClick={openGenerateModal} variant="primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={16} /> Generate Invoice
                    </Button>
                </div>
            </div>

            {/* Invoices Table */}
            <div className="hms-table-container">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>Loading invoicing records...</div>
                ) : filteredInvoices.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>No invoice records found.</div>
                ) : (
                    <table className="hms-table">
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Patient Name</th>
                                <th>Billing Date</th>
                                <th>Due Date</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.map((inv) => (
                                <tr key={inv.id}>
                                    <td style={{ fontWeight: 600 }}>{inv.invoice_number}</td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{inv.patient?.name || 'N/A'}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inv.patient?.phone}</div>
                                    </td>
                                    <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                                    <td>{new Date(inv.due_date).toLocaleDateString()}</td>
                                    <td style={{ fontWeight: 600 }}>Rs. {parseFloat(inv.amount).toFixed(2)}</td>
                                    <td>
                                        <span className="hms-badge secondary">{inv.payment_method || 'Pending'}</span>
                                    </td>
                                    <td>
                                        <span className={`hms-badge ${inv.status === 'Paid' ? 'success' : inv.status === 'Unpaid' ? 'danger' : 'warning'}`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="hms-actions" style={{ justifyContent: 'flex-end' }}>
                                            {inv.status !== 'Paid' ? (
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                    onClick={() => openPaymentModal(inv)}
                                                >
                                                    <CreditCard size={12} /> Collect
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                    onClick={() => openReceiptModal(inv)}
                                                >
                                                    <Eye size={12} /> Receipt
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* GENERATE INVOICE MODAL */}
            {isGenerateOpen && (
                <div className="hms-modal-backdrop">
                    <div className="hms-modal">
                        <div className="hms-modal-header">
                            <h3 className="hms-modal-title">Generate Billing Invoice</h3>
                            <button className="hms-modal-close" onClick={() => setIsGenerateOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleGenerateSubmit}>
                            <div className="hms-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
                                
                                {/* Select Patient */}
                                <div className="form-group">
                                    <label className="form-label">Patient *</label>
                                    <select
                                        name="patient_id"
                                        className="hms-select"
                                        style={{ width: '100%', height: '45px' }}
                                        value={invoiceForm.patient_id}
                                        onChange={handleFormChange}
                                        required
                                    >
                                        <option value="">-- Select Patient --</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>)}
                                    </select>
                                    {formErrors.patient_id && <span className="error-text">{formErrors.patient_id}</span>}
                                </div>

                                {/* Select Linked Appointment (Optional) */}
                                <div className="form-group">
                                    <label className="form-label">Linked Appointment (Optional)</label>
                                    <select
                                        name="appointment_id"
                                        className="hms-select"
                                        style={{ width: '100%', height: '45px' }}
                                        value={invoiceForm.appointment_id}
                                        onChange={handleFormChange}
                                    >
                                        <option value="">-- No Linked Appointment --</option>
                                        {appointments
                                            .filter(app => app.patient_id === invoiceForm.patient_id)
                                            .map(app => <option key={app.id} value={app.id}>{new Date(app.appointment_date).toLocaleDateString()} - {app.time_slot} ({app.doctor?.name})</option>)
                                        }
                                    </select>
                                </div>

                                <InputField
                                    label="Total Amount (Rs.)"
                                    name="amount"
                                    type="number"
                                    step="0.01"
                                    min="1"
                                    value={invoiceForm.amount}
                                    onChange={handleFormChange}
                                    placeholder="Enter billing charge amount"
                                    error={formErrors.amount}
                                    required
                                />

                                <InputField
                                    label="Due Date"
                                    name="due_date"
                                    type="date"
                                    value={invoiceForm.due_date}
                                    onChange={handleFormChange}
                                    error={formErrors.due_date}
                                    required
                                />
                            </div>
                            <div className="hms-modal-footer">
                                <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>Cancel</Button>
                                <Button type="submit" loading={actionLoading}>Create Invoice</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* COLLECT PAYMENT MODAL */}
            {isPaymentOpen && selectedInvoice && (
                <div className="hms-modal-backdrop">
                    <div className="hms-modal small">
                        <div className="hms-modal-header">
                            <h3 className="hms-modal-title">Collect Payment</h3>
                            <button className="hms-modal-close" onClick={() => setIsPaymentOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handlePaymentSubmit}>
                            <div className="hms-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Invoice: {selectedInvoice.invoice_number}</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>Patient: {selectedInvoice.patient?.name}</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-color)', marginTop: '6px' }}>Total Due: Rs. {parseFloat(selectedInvoice.amount).toFixed(2)}</div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Payment Method</label>
                                    <select
                                        className="hms-select"
                                        style={{ width: '100%', height: '45px' }}
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    >
                                        <option value="Cash">💵 Cash</option>
                                        <option value="Card">💳 Credit / Debit Card</option>
                                        <option value="Bank Transfer">🏦 Bank Transfer</option>
                                        <option value="Insurance">🛡️ Insurance Coverage</option>
                                    </select>
                                </div>
                            </div>
                            <div className="hms-modal-footer">
                                <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>Cancel</Button>
                                <Button type="submit" loading={actionLoading}>Process Receipt</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* RECEIPT / PRINT MODAL */}
            {isReceiptOpen && selectedInvoice && (
                <div className="hms-modal-backdrop">
                    <div className="hms-modal">
                        <div className="hms-modal-header">
                            <h3 className="hms-modal-title">Payment Confirmation & Receipt</h3>
                            <button className="hms-modal-close" onClick={() => setIsReceiptOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="hms-modal-body">
                            {/* receipt details */}
                            <div className="invoice-receipt-wrapper">
                                <div className="invoice-receipt-header">
                                    <div>
                                        <div className="invoice-receipt-title">🏥 Subhan Care Hospital</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sector G-8/3, Islamabad, Pakistan</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ph: +92-51-1234567 | care@subhan.com</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary-color)' }}>OFFICIAL RECEIPT</div>
                                        <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Receipt #: REC-{selectedInvoice.id.slice(0, 6).toUpperCase()}</div>
                                        <div style={{ fontSize: '0.8rem' }}>Date: {new Date().toLocaleDateString()}</div>
                                    </div>
                                </div>

                                <div className="invoice-receipt-details">
                                    <div>
                                        <span style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)' }}>Billed To:</span>
                                        <strong>{selectedInvoice.patient?.name}</strong>
                                        <br />Phone: {selectedInvoice.patient?.phone}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)' }}>Invoice References:</span>
                                        Invoice #: {selectedInvoice.invoice_number}
                                        <br />Payment Method: <strong>{selectedInvoice.payment_method}</strong>
                                        <br />Payment Status: <strong style={{ color: '#16A34A' }}>PAID</strong>
                                    </div>
                                </div>

                                <table className="invoice-receipt-table">
                                    <thead>
                                        <tr>
                                            <th>Description</th>
                                            <th style={{ textAlign: 'right' }}>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style={{ padding: '12px 0' }}>
                                                Hospital Consultation & Clinical Services
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Linked to patient consultation record #{selectedInvoice.id.slice(0, 8).toUpperCase()}</div>
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>Rs. {parseFloat(selectedInvoice.amount).toFixed(2)}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                <div className="invoice-receipt-summary">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '240px', fontSize: '0.85rem' }}>
                                        <span>Subtotal:</span>
                                        <span>Rs. {parseFloat(selectedInvoice.amount).toFixed(2)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '240px', fontSize: '0.85rem' }}>
                                        <span>Tax (0%):</span>
                                        <span>Rs. 0.00</span>
                                    </div>
                                    <div className="invoice-receipt-total">
                                        <span>Paid Amount:</span>
                                        <span>Rs. {parseFloat(selectedInvoice.amount).toFixed(2)}</span>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'center', marginTop: '40px', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px dashed var(--border-color)', paddingTop: '16px' }}>
                                    Thank you for choosing Subhan Care Hospital. Wish you a healthy life!
                                </div>
                            </div>
                        </div>
                        <div className="hms-modal-footer">
                            <Button variant="outline" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Printer size={16} /> Print Receipt
                            </Button>
                            <Button onClick={() => setIsReceiptOpen(false)}>Close Receipt</Button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default Billing;
