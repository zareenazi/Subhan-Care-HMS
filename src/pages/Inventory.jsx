import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { dbInventory } from '../services/db';
import Button from '../components/Button';
import InputField from '../components/InputField';
import { Plus, Search, Edit, X, PackageOpen } from 'lucide-react';

const Inventory = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isRestockOpen, setIsRestockOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const [formData, setFormData] = useState({
        item_name: '',
        category: 'Surgical Supplies',
        quantity: '',
        price: ''
    });

    const [restockQty, setRestockQty] = useState('');
    const [formErrors, setFormErrors] = useState({});
    const [actionLoading, setActionLoading] = useState(false);

    const loadInventory = async () => {
        setLoading(true);
        try {
            const data = await dbInventory.getInventory();
            setItems(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInventory();
    }, []);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.item_name.trim()) errors.item_name = 'Item name is required';
        if (!formData.quantity || parseInt(formData.quantity) < 0) {
            errors.quantity = 'Please enter a valid initial quantity';
        }
        if (!formData.price || parseFloat(formData.price) < 0) {
            errors.price = 'Please enter a valid item price';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setActionLoading(true);
        try {
            await dbInventory.createInventory({
                item_name: formData.item_name,
                category: formData.category,
                quantity: parseInt(formData.quantity),
                price: parseFloat(formData.price)
            });
            setIsAddOpen(false);
            loadInventory();
        } catch (err) {
            alert('Failed to add item: ' + err.message);
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
            const newQty = (parseInt(selectedItem.quantity) || 0) + parseInt(restockQty);
            await dbInventory.updateInventory(selectedItem.id, { quantity: newQty });
            setIsRestockOpen(false);
            loadInventory();
        } catch (err) {
            alert('Failed to restock: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const filtered = items.filter(item =>
        item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout active="inventory" title="Inventory Management">
            {/* Control Bar */}
            <div className="hms-controls-bar">
                <div className="hms-search-box">
                    <Search size={18} className="hms-search-icon" />
                    <input
                        type="text"
                        placeholder="Search items, category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button onClick={() => setIsAddOpen(true)} variant="primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={16} /> Add Inventory Item
                </Button>
            </div>

            {/* List */}
            <div className="hms-table-container">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>Loading inventory...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>No items registered.</div>
                ) : (
                    <table className="hms-table">
                        <thead>
                            <tr>
                                <th>Item Name</th>
                                <th>Category</th>
                                <th>Quantity Stock</th>
                                <th>Unit Price</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(item => {
                                const isLow = item.quantity <= 10;
                                return (
                                    <tr key={item.id}>
                                        <td style={{ fontWeight: 600 }}>{item.item_name}</td>
                                        <td>{item.category}</td>
                                        <td>{item.quantity} units</td>
                                        <td>Rs. {parseFloat(item.price).toFixed(2)}</td>
                                        <td>
                                            <span className={`hms-badge ${isLow ? 'danger' : 'success'}`}>
                                                {isLow ? 'Low Stock' : 'Good Level'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => { setSelectedItem(item); setRestockQty(''); setIsRestockOpen(true); }}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '0.75rem' }}
                                            >
                                                <PackageOpen size={12} /> Restock
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ADD ITEM MODAL */}
            {isAddOpen && (
                <div className="hms-modal-backdrop">
                    <div className="hms-modal">
                        <div className="hms-modal-header">
                            <h3 className="hms-modal-title">Add Supply Item</h3>
                            <button className="hms-modal-close" onClick={() => setIsAddOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddSubmit}>
                            <div className="hms-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <InputField
                                    label="Item Name / Model"
                                    name="item_name"
                                    value={formData.item_name}
                                    onChange={handleFormChange}
                                    placeholder="e.g. Disposable Syringes 5ml"
                                    error={formErrors.item_name}
                                    required
                                />

                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <select
                                        name="category"
                                        className="hms-select"
                                        style={{ width: '100%', height: '45px' }}
                                        value={formData.category}
                                        onChange={handleFormChange}
                                    >
                                        <option value="Surgical Supplies">Surgical Supplies</option>
                                        <option value="General Ward Materials">General Ward Materials</option>
                                        <option value="Laboratory Chemicals">Laboratory Chemicals</option>
                                        <option value="Protective Gears">Protective Gears</option>
                                    </select>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <InputField
                                        label="Initial Quantity"
                                        name="quantity"
                                        type="number"
                                        value={formData.quantity}
                                        onChange={handleFormChange}
                                        placeholder="e.g. 100"
                                        error={formErrors.quantity}
                                        required
                                    />
                                    <InputField
                                        label="Unit Cost (Rs.)"
                                        name="price"
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={handleFormChange}
                                        placeholder="e.g. 25.00"
                                        error={formErrors.price}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="hms-modal-footer">
                                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                                <Button type="submit" loading={actionLoading}>Register Item</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* RESTOCK MODAL */}
            {isRestockOpen && selectedItem && (
                <div className="hms-modal-backdrop">
                    <div className="hms-modal small">
                        <div className="hms-modal-header">
                            <h3 className="hms-modal-title">Restock Supply</h3>
                            <button className="hms-modal-close" onClick={() => setIsRestockOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleRestockSubmit}>
                            <div className="hms-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <strong style={{ display: 'block', fontSize: '0.95rem' }}>{selectedItem.item_name}</strong>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Quantity: {selectedItem.quantity} units</span>
                                </div>
                                <InputField
                                    label="Add Quantity Units"
                                    type="number"
                                    value={restockQty}
                                    onChange={(e) => setRestockQty(e.target.value)}
                                    placeholder="Enter restocking counts"
                                    required
                                />
                            </div>
                            <div className="hms-modal-footer">
                                <Button variant="outline" onClick={() => setIsRestockOpen(false)}>Cancel</Button>
                                <Button type="submit" loading={actionLoading}>Confirm Restock</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default Inventory;
