import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { dbPharmacy } from '../services/db';
import Button from '../components/Button';
import InputField from '../components/InputField';
import { Plus, Search, PackageOpen, X } from 'lucide-react';

const Pharmacy = () => {
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isRestockOpen, setIsRestockOpen] = useState(false);
    const [selectedMed, setSelectedMed] = useState(null);

    const [formData, setFormData] = useState({
        medicine_name: '',
        stock: '',
        price: ''
    });

    const [restockQty, setRestockQty] = useState('');
    const [formErrors, setFormErrors] = useState({});
    const [actionLoading, setActionLoading] = useState(false);

    const loadPharmacy = async () => {
        setLoading(true);
        try {
            const data = await dbPharmacy.getPharmacy();
            setMedicines(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPharmacy();
    }, []);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.medicine_name.trim()) errors.medicine_name = 'Medicine name is required';
        if (!formData.stock || parseInt(formData.stock) < 0) {
            errors.stock = 'Please enter a valid stock level';
        }
        if (!formData.price || parseFloat(formData.price) < 0) {
            errors.price = 'Please enter a valid medicine price';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setActionLoading(true);
        try {
            await dbPharmacy.createPharmacy({
                medicine_name: formData.medicine_name,
                stock: parseInt(formData.stock),
                price: parseFloat(formData.price)
            });
            setIsAddOpen(false);
            loadPharmacy();
        } catch (err) {
            alert('Failed to register medicine: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRestockSubmit = async (e) => {
        e.preventDefault();
        if (!restockQty || parseInt(restockQty) <= 0) {
            alert('Please enter a quantity greater than zero');
            return;
        }
        setActionLoading(true);
        try {
            const newStock = (parseInt(selectedMed.stock) || 0) + parseInt(restockQty);
            await dbPharmacy.updatePharmacy(selectedMed.id, { stock: newStock });
            setIsRestockOpen(false);
            loadPharmacy();
        } catch (err) {
            alert('Failed to restock: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const filtered = medicines.filter(med =>
        med.medicine_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout active="pharmacy" title="Pharmacy & Dispensary">
            {/* Control Bar */}
            <div className="hms-controls-bar">
                <div className="hms-search-box">
                    <Search size={18} className="hms-search-icon" />
                    <input
                        type="text"
                        placeholder="Search medicines..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button onClick={() => setIsAddOpen(true)} variant="primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={16} /> Add Medicine Stock
                </Button>
            </div>

            {/* List */}
            <div className="hms-table-container">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>Loading medicines database...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>No medicines cataloged yet.</div>
                ) : (
                    <table className="hms-table">
                        <thead>
                            <tr>
                                <th>Medicine Brand Name</th>
                                <th>Stock Availability</th>
                                <th>Unit Retail Cost</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(med => {
                                const isLow = med.stock <= 20;
                                return (
                                    <tr key={med.id}>
                                        <td style={{ fontWeight: 600 }}>💊 {med.medicine_name}</td>
                                        <td>{med.stock} tablets/vials</td>
                                        <td>Rs. {parseFloat(med.price).toFixed(2)}</td>
                                        <td>
                                            <span className={`hms-badge ${isLow ? 'danger' : 'success'}`}>
                                                {isLow ? 'Low Stock Alert' : 'In Stock'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => { setSelectedMed(med); setRestockQty(''); setIsRestockOpen(true); }}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '0.75rem' }}
                                            >
                                                <PackageOpen size={12} /> Refill Stock
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ADD MEDICINE MODAL */}
            {isAddOpen && (
                <div className="hms-modal-backdrop">
                    <div className="hms-modal">
                        <div className="hms-modal-header">
                            <h3 className="hms-modal-title">Register Medicine Stock</h3>
                            <button className="hms-modal-close" onClick={() => setIsAddOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddSubmit}>
                            <div className="hms-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <InputField
                                    label="Medicine / Formula Name"
                                    name="medicine_name"
                                    value={formData.medicine_name}
                                    onChange={handleFormChange}
                                    placeholder="e.g. Panadol 500mg (Paracetamol)"
                                    error={formErrors.medicine_name}
                                    required
                                />

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <InputField
                                        label="Initial Stock Pack/Units"
                                        name="stock"
                                        type="number"
                                        value={formData.stock}
                                        onChange={handleFormChange}
                                        placeholder="e.g. 500"
                                        error={formErrors.stock}
                                        required
                                    />
                                    <InputField
                                        label="Unit Retail Cost (Rs.)"
                                        name="price"
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={handleFormChange}
                                        placeholder="e.g. 15.00"
                                        error={formErrors.price}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="hms-modal-footer">
                                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                                <Button type="submit" loading={actionLoading}>Catalog Medicine</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* RESTOCK MODAL */}
            {isRestockOpen && selectedMed && (
                <div className="hms-modal-backdrop">
                    <div className="hms-modal small">
                        <div className="hms-modal-header">
                            <h3 className="hms-modal-title">Dispensary Stock Refill</h3>
                            <button className="hms-modal-close" onClick={() => setIsRestockOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleRestockSubmit}>
                            <div className="hms-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <strong style={{ display: 'block', fontSize: '0.95rem' }}>{selectedMed.medicine_name}</strong>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Stock: {selectedMed.stock} counts</span>
                                </div>
                                <InputField
                                    label="Add Refill Stock Units"
                                    type="number"
                                    value={restockQty}
                                    onChange={(e) => setRestockQty(e.target.value)}
                                    placeholder="Enter additional counts"
                                    required
                                />
                            </div>
                            <div className="hms-modal-footer">
                                <Button variant="outline" onClick={() => setIsRestockOpen(false)}>Cancel</Button>
                                <Button type="submit" loading={actionLoading}>Confirm Refill</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default Pharmacy;
