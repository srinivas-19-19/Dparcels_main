import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  X
} from 'lucide-react';
import AdminRiderDetails from './AdminRiderDetails';
import '../styles/dashboard.css';

export default function AdminRiders() {
  const [filterStatus, setFilterStatus] = useState('All 23');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRider, setSelectedRider] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/riders');
      const formatted = response.data.data.map((r, i) => ({
        id: r.id, // rider profile ID
        userId: r.userId,
        name: `${r.user.firstName} ${r.user.lastName}`,
        vehicle: `${r.vehicleType} • ${r.vehicleNumber}`,
        phone: r.user.phone,
        location: 'Tirupati', // Can be updated if we track last known location
        status: !r.isApproved ? 'Pending' : (r.isOnline ? 'Online' : 'Offline'),
        orders: r._count.orders,
        earnings: '₹0.00', // Update when payment aggregating is available
        utrNumber: r.utrNumber,
        avatar: `https://ui-avatars.com/api/?name=${r.user.firstName}+${r.user.lastName}&background=random`
      }));
      setRiders(formatted);
    } catch (error) {
      console.error('Error fetching riders:', error);
    } finally {
      setLoading(false);
    }
  };

  const [newRider, setNewRider] = useState({
    name: '',
    phone: '',
    vehicle: '',
    location: '',
    status: 'Pending'
  });

  const handleAddRiderSubmit = (e) => {
    e.preventDefault();
    if (!newRider.name || !newRider.phone) return;

    const created = {
      id: riders.length + 1,
      ...newRider,
      orders: 0,
      earnings: '₹0',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
    };

    setRiders([created, ...riders]);
    setShowAddModal(false);
    setNewRider({ name: '', phone: '', vehicle: '', location: '', status: 'Pending' });
  };

  const filteredRiders = riders.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.phone.includes(searchTerm) ||
      r.vehicle.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus.includes('Online')) return matchesSearch && r.status === 'Online';
    if (filterStatus.includes('Offline')) return matchesSearch && r.status === 'Offline';
    if (filterStatus.includes('Pending')) return matchesSearch && r.status === 'Pending';
    if (filterStatus.includes('Rejected')) return matchesSearch && r.status === 'Rejected';
    return matchesSearch;
  });

  if (selectedRider) {
    return <AdminRiderDetails rider={selectedRider} onBack={() => setSelectedRider(null)} />;
  }

  return (
    <div className="riders-view-container">
      {/* Top Header Row with Title and Search */}
      <div className="riders-header-row">
        <div>
          <h1 className="header-greeting">Riders Management</h1>
          <p className="header-subtext">Manage active delivery partners, track earnings, and verify submitted documents.</p>
        </div>

        {/* Search Bar */}
        <div className="riders-search-wrapper">
          <Search size={18} color="#8A9285" />
          <input
            type="text"
            placeholder="Search rider by name, phone, vehicle..."
            className="riders-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Action Bar & Status Filter Pills */}
      <div className="riders-actions-bar">
        <div className="status-filter-pills">
          <button
            className={`status-pill-btn ${filterStatus === 'All 23' ? 'active' : ''}`}
            onClick={() => setFilterStatus('All 23')}
          >
            <span>All</span>
            <span className="count-badge yellow">23</span>
          </button>

          <button
            className={`status-pill-btn ${filterStatus === 'Online 6' ? 'active' : ''}`}
            onClick={() => setFilterStatus('Online 6')}
          >
            <span>Online</span>
            <span className="count-badge green">6</span>
          </button>

          <button
            className={`status-pill-btn ${filterStatus === 'Offline 10' ? 'active' : ''}`}
            onClick={() => setFilterStatus('Offline 10')}
          >
            <span>Offline</span>
            <span className="count-badge gray">10</span>
          </button>

          <button
            className={`status-pill-btn ${filterStatus === 'Pending 3' ? 'active' : ''}`}
            onClick={() => setFilterStatus('Pending 3')}
          >
            <span>Pending</span>
            <span className="count-badge yellow">3</span>
          </button>

          <button
            className={`status-pill-btn ${filterStatus === 'Rejected 2' ? 'active' : ''}`}
            onClick={() => setFilterStatus('Rejected 2')}
          >
            <span>Rejected</span>
            <span className="count-badge red">2</span>
          </button>
        </div>

        <button className="add-rider-btn" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          <span>+ Add Rider</span>
        </button>
      </div>

      {/* RIDERS TABLE */}
      <div className="riders-table-card">
        <table className="riders-table">
          <thead>
            <tr>
              <th>RIDER NAME</th>
              <th>VEHICLE DETAILS</th>
              <th>PHONE NUMBER</th>
              <th>LOCATION / ZONE</th>
              <th>STATUS</th>
              <th>ORDERS</th>
              <th>EARNINGS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredRiders.map((r) => (
              <tr key={r.id}>
                <td className="rider-cell">
                  <img src={r.avatar} alt={r.name} className="table-avatar" />
                  <span className="rider-name-text">{r.name}</span>
                </td>
                <td className="vehicle-cell">{r.vehicle}</td>
                <td className="phone-cell">{r.phone}</td>
                <td className="location-cell">{r.location}</td>
                <td>
                  <span className={`rider-status-badge ${r.status.toLowerCase()}`}>
                    {r.status}
                  </span>
                </td>
                <td className="orders-cell">{r.orders}</td>
                <td className="earnings-cell">{r.earnings}</td>
                <td className="actions-cell">
                  <button
                    className="action-icon-btn highlight"
                    title="View Rider Profile & Documents"
                    onClick={() => setSelectedRider(r)}
                  >
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="pagination-bar">
        <button className="page-btn" disabled>
          <ChevronLeft size={16} />
        </button>
        <button className="page-btn active">1</button>
        <button className="page-btn">2</button>
        <button className="page-btn">3</button>
        <button className="page-btn">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* ADD RIDER MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Add New Delivery Rider</h3>
              <button className="close-modal-btn" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddRiderSubmit} className="modal-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Suresh Kumar"
                  value={newRider.name}
                  onChange={(e) => setNewRider({ ...newRider, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +91 9876543210"
                  value={newRider.phone}
                  onChange={(e) => setNewRider({ ...newRider, phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Vehicle Model & Number</label>
                <input
                  type="text"
                  placeholder="e.g. Honda Activa 6G (AP 03 AB 1234)"
                  value={newRider.vehicle}
                  onChange={(e) => setNewRider({ ...newRider, vehicle: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Assigned Delivery Zone</label>
                <input
                  type="text"
                  placeholder="e.g. Tirupati Central / Sector 4"
                  value={newRider.location}
                  onChange={(e) => setNewRider({ ...newRider, location: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Initial Status</label>
                <select
                  value={newRider.status}
                  onChange={(e) => setNewRider({ ...newRider, status: e.target.value })}
                >
                  <option value="Pending">Pending Verification</option>
                  <option value="Online">Online / Active</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>

              <button type="submit" className="add-rider-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                <span>Save & Register Rider</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
