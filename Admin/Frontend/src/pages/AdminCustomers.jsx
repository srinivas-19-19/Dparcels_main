import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  Search,
  Plus,
  Eye,
  X,
  UserCheck,
  ShoppingBag,
  CreditCard,
  Ban,
  CheckCircle
} from 'lucide-react';
import '../styles/dashboard.css';

export default function AdminCustomers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/customers');
      const formatted = response.data.data.map((c, i) => ({
        id: c.id,
        rawId: c.id,
        name: `${c.firstName} ${c.lastName}`,
        email: c.email,
        phone: c.phone,
        totalOrders: c._count.ordersAsCustomer,
        totalSpent: '₹0.00', // Update when payment aggregating is possible per customer
        status: c.status,
        address: 'N/A', // Update when address book is available
        avatar: `https://ui-avatars.com/api/?name=${c.firstName}+${c.lastName}&background=random`
      }));
      setCustomers(formatted);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    status: 'Active'
  });

  const handleAddCustomerSubmit = (e) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) return;

    const created = {
      id: 100 + customers.length + 1,
      ...newCustomer,
      totalOrders: 0,
      totalSpent: '₹0.00',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
    };

    setCustomers([created, ...customers]);
    setShowAddModal(false);
    setNewCustomer({ name: '', email: '', phone: '', address: '', status: 'Active' });
  };

  const handleToggleBlockStatus = (id) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: c.status === 'Active' ? 'Blocked' : 'Active' } : c
      )
    );
    if (selectedCustomer && selectedCustomer.id === id) {
      setSelectedCustomer((prev) => ({
        ...prev,
        status: prev.status === 'Active' ? 'Blocked' : 'Active'
      }));
    }
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="customers-view-container">
      {/* Header Row */}
      <div className="customers-header-row">
        <div>
          <h1 className="header-greeting">Customers Management</h1>
          <p className="header-subtext">View registered user accounts, order history, and account status.</p>
        </div>

        <button className="add-rider-btn" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          <span>+ Add Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="customers-search-bar">
        <Search size={18} color="#8A9285" />
        <input
          type="text"
          placeholder="Search customer by name, phone, email..."
          className="customers-search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* CUSTOMERS TABLE */}
      <div className="customers-table-card">
        <table className="customers-table">
          <thead>
            <tr>
              <th>CUSTOMER</th>
              <th>EMAIL ADDRESS</th>
              <th>PHONE NUMBER</th>
              <th>TOTAL ORDERS</th>
              <th>TOTAL SPENT</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((c) => (
              <tr key={c.id}>
                <td className="customer-cell-with-avatar">
                  <img src={c.avatar} alt={c.name} className="table-avatar" />
                  <span className="customer-name-text">{c.name}</span>
                </td>
                <td className="email-cell">{c.email}</td>
                <td className="phone-cell">{c.phone}</td>
                <td className="orders-cell">{c.totalOrders}</td>
                <td className="spent-cell">{c.totalSpent}</td>
                <td>
                  <span className={`status-badge-cust ${c.status.toLowerCase()}`}>
                    {c.status}
                  </span>
                </td>
                <td className="actions-cell">
                  <button
                    className="action-icon-btn highlight"
                    title="View Customer Profile"
                    onClick={() => setSelectedCustomer(c)}
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className="action-icon-btn"
                    title={c.status === 'Active' ? 'Block Customer' : 'Unblock Customer'}
                    onClick={() => handleToggleBlockStatus(c.id)}
                  >
                    {c.status === 'Active' ? (
                      <Ban size={16} color="#EF4444" />
                    ) : (
                      <CheckCircle size={16} color="#22C55E" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CUSTOMER DETAILS MODAL */}
      {selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Customer Profile Details</h3>
              <button className="close-modal-btn" onClick={() => setSelectedCustomer(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-avatar-row">
                <img src={selectedCustomer.avatar} alt={selectedCustomer.name} className="detail-avatar" />
                <div>
                  <h4 className="detail-name">{selectedCustomer.name}</h4>
                  <span className={`status-badge-cust ${selectedCustomer.status.toLowerCase()}`}>
                    {selectedCustomer.status}
                  </span>
                </div>
              </div>

              <div className="tracking-fields-list">
                <div className="field-row">
                  <span className="field-label">Customer ID</span>
                  <span className="field-value">#CUST-{selectedCustomer.id}</span>
                </div>
                <div className="field-row">
                  <span className="field-label">Phone Number</span>
                  <span className="field-value">{selectedCustomer.phone}</span>
                </div>
                <div className="field-row">
                  <span className="field-label">Email Address</span>
                  <span className="field-value">{selectedCustomer.email}</span>
                </div>
                <div className="field-row">
                  <span className="field-label">Delivery Address</span>
                  <span className="field-value">{selectedCustomer.address}</span>
                </div>
                <div className="field-row">
                  <span className="field-label">Total Orders Placed</span>
                  <span className="field-value yellow">{selectedCustomer.totalOrders}</span>
                </div>
                <div className="field-row">
                  <span className="field-label">Lifetime Spend</span>
                  <span className="field-value yellow">{selectedCustomer.totalSpent}</span>
                </div>
              </div>

              <button
                className="btn-contact rider"
                style={{ marginTop: '1.5rem' }}
                onClick={() => handleToggleBlockStatus(selectedCustomer.id)}
              >
                {selectedCustomer.status === 'Active' ? 'Block Account' : 'Unblock Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CUSTOMER MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Add New Customer Account</h3>
              <button className="close-modal-btn" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddCustomerSubmit} className="modal-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Anusha Reddy"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +91 9123456789"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. anusha@gmail.com"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Primary Delivery Address</label>
                <input
                  type="text"
                  placeholder="e.g. Sector 4, MG Road, Tirupati"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="add-rider-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                <span>Register Customer Account</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
