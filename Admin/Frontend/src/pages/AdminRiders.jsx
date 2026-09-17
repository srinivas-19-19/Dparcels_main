import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
  RefreshCw,
  Loader2,
  ShieldCheck,
  Bike,
  Clock
} from 'lucide-react';
import AdminRiderDetails from './AdminRiderDetails';
import '../styles/dashboard.css';

export default function AdminRiders() {
  const [filterStatus, setFilterStatus] = useState('Pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRider, setSelectedRider] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Live Data States
  const [pendingRiders, setPendingRiders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [isLoadingAll, setIsLoadingAll] = useState(true);
  const [error, setError] = useState(null);

  // Approval Lifecycle States
  const [approvingId, setApprovingId] = useState(null);
  const [toast, setToast] = useState(null);

  // Auto-dismiss toast after 3.5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Fetch Pending Riders: GET /api/v1/admin/riders/pending
  const fetchPendingRiders = useCallback(async () => {
    try {
      setIsLoadingPending(true);
      setError(null);
      const res = await api.get('/admin/riders/pending');
      const list = res.data?.data || res.data || [];

      const formatted = list.map((r) => {
        const fullName = `${r.firstName || ''} ${r.lastName || ''}`.trim() || r.user?.email?.split('@')[0] || 'New Rider';
        return {
          id: r.id, // RiderProfile ID used for PATCH /admin/riders/:id/approve
          userId: r.userId,
          firstName: r.firstName || '',
          lastName: r.lastName || '',
          name: fullName,
          phone: r.phone || 'N/A',
          vehicleType: r.vehicleType || 'Motorcycle',
          vehicleNumber: r.vehicleNumber || 'N/A',
          isApproved: false,
          isOnline: r.isOnline || false,
          status: 'Pending',
          email: r.user?.email || 'N/A',
          appliedDate: r.user?.createdAt
            ? new Date(r.user.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })
            : 'Recent',
          orders: 0,
          earnings: '₹0.00',
          utrNumber: r.utrNumber || 'N/A',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=FF6B00&color=fff&bold=true`
        };
      });

      setPendingRiders(formatted);
    } catch (err) {
      console.error('Error fetching pending riders:', err);
      const message =
        err.response?.data?.message ||
        (err.response?.status === 403
          ? 'Access denied. Administrator privileges required.'
          : err.response?.status === 401
          ? 'Session expired. Please log in again.'
          : 'Failed to load pending rider applications. Please verify network connection.');
      setError(message);
    } finally {
      setIsLoadingPending(false);
    }
  }, []);

  // Fetch All Riders: GET /api/v1/admin/riders
  const fetchAllRiders = useCallback(async () => {
    try {
      setIsLoadingAll(true);
      const res = await api.get('/admin/riders');
      const list = res.data?.data || res.data || [];

      const formatted = list.map((r) => {
        const fullName = `${r.firstName || ''} ${r.lastName || ''}`.trim() || r.user?.email?.split('@')[0] || 'Rider';
        return {
          id: r.id,
          userId: r.userId,
          name: fullName,
          firstName: r.firstName || '',
          lastName: r.lastName || '',
          phone: r.phone || 'N/A',
          vehicle: `${r.vehicleType || 'Vehicle'} • ${r.vehicleNumber || 'N/A'}`,
          vehicleType: r.vehicleType || 'Motorcycle',
          vehicleNumber: r.vehicleNumber || 'N/A',
          location: 'Tirupati',
          isApproved: r.isApproved,
          isOnline: r.isOnline,
          status: !r.isApproved ? 'Pending' : (r.isOnline ? 'Online' : 'Offline'),
          orders: r._count?.ordersDelivered || 0,
          earnings: '₹0.00',
          email: r.user?.email || 'N/A',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=22C55E&color=fff&bold=true`
        };
      });

      setRiders(formatted);
    } catch (err) {
      console.error('Error fetching all riders:', err);
    } finally {
      setIsLoadingAll(false);
    }
  }, []);

  // Initial Fetch on component mount
  useEffect(() => {
    fetchPendingRiders();
    fetchAllRiders();
  }, [fetchPendingRiders, fetchAllRiders]);

  // Handle Approving Rider: PATCH /api/v1/admin/riders/:id/approve
  const handleApproveRider = async (id, riderName = 'Rider') => {
    // Double-click and concurrent request guard
    if (approvingId) return;

    setApprovingId(id);

    try {
      const response = await api.patch(`/admin/riders/${id}/approve`);
      if (response.status === 200 || response.data?.success) {
        // Optimistic Update: Immediately filter approved rider out of pending list
        setPendingRiders((prev) => prev.filter((r) => r.id !== id));

        // Synchronize in all riders list
        setRiders((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, isApproved: true, status: 'Offline' } : r
          )
        );

        showToast(`Rider "${riderName}" approved successfully! Added to active fleet.`, 'success');
      }
    } catch (err) {
      console.error('Error approving rider:', err);
      const errMsg = err.response?.data?.message || 'Failed to approve rider. Please try again.';
      showToast(errMsg, 'error');
    } finally {
      setApprovingId(null);
    }
  };

  // Add Manual Rider Form State
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
      id: `manual-${Date.now()}`,
      ...newRider,
      vehicleType: newRider.vehicle.split(' ')[0] || 'Vehicle',
      vehicleNumber: newRider.vehicle,
      orders: 0,
      earnings: '₹0.00',
      isApproved: newRider.status !== 'Pending',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newRider.name)}&background=random`
    };

    if (newRider.status === 'Pending') {
      setPendingRiders([created, ...pendingRiders]);
    }
    setRiders([created, ...riders]);
    setShowAddModal(false);
    setNewRider({ name: '', phone: '', vehicle: '', location: '', status: 'Pending' });
    showToast(`Rider "${created.name}" registered.`, 'success');
  };

  // Filtering Logic
  const filteredPendingRiders = pendingRiders.filter((r) => {
    const query = searchTerm.toLowerCase();
    return (
      r.name.toLowerCase().includes(query) ||
      r.phone.includes(query) ||
      r.vehicleNumber.toLowerCase().includes(query) ||
      r.vehicleType.toLowerCase().includes(query) ||
      r.email.toLowerCase().includes(query)
    );
  });

  const filteredAllRiders = riders.filter((r) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      r.name.toLowerCase().includes(query) ||
      r.phone.includes(query) ||
      r.vehicle.toLowerCase().includes(query);

    if (filterStatus === 'Online') return matchesSearch && r.status === 'Online';
    if (filterStatus === 'Offline') return matchesSearch && r.status === 'Offline';
    if (filterStatus === 'Rejected') return matchesSearch && r.status === 'Rejected';
    return matchesSearch;
  });

  // Dynamic counts for status pills
  const pendingCount = pendingRiders.length;
  const allCount = riders.length;
  const onlineCount = riders.filter((r) => r.status === 'Online').length;
  const offlineCount = riders.filter((r) => r.status === 'Offline').length;

  if (selectedRider) {
    return (
      <AdminRiderDetails
        rider={selectedRider}
        onBack={() => setSelectedRider(null)}
      />
    );
  }

  return (
    <div className="riders-view-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          <div className="toast-icon">
            {toast.type === 'success' ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
          </div>
          <span className="toast-message">{toast.message}</span>
          <button
            className="toast-close-btn"
            onClick={() => setToast(null)}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Header Row with Title and Search */}
      <div className="riders-header-row">
        <div>
          <h1 className="header-greeting">Riders Management</h1>
          <p className="header-subtext">
            Review pending rider applications, verify documents, and manage active delivery fleet.
          </p>
        </div>

        {/* Search Bar */}
        <div className="riders-search-wrapper">
          <Search size={18} color="#8A9285" />
          <input
            type="text"
            placeholder="Search by name, phone, license plate..."
            className="riders-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Inline Error Alert Banner */}
      {error && (
        <div className="dashboard-error-banner">
          <div className="error-content">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button
            className="retry-btn"
            onClick={() => {
              fetchPendingRiders();
              fetchAllRiders();
            }}
            title="Retry loading riders"
          >
            <RefreshCw size={13} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Action Bar & Status Filter Pills */}
      <div className="riders-actions-bar">
        <div className="status-filter-pills">
          <button
            className={`status-pill-btn ${filterStatus === 'Pending' ? 'active' : ''}`}
            onClick={() => {
              setFilterStatus('Pending');
              fetchPendingRiders();
            }}
          >
            <span>Pending Approvals</span>
            <span className="count-badge orange">{pendingCount}</span>
          </button>

          <button
            className={`status-pill-btn ${filterStatus === 'All' ? 'active' : ''}`}
            onClick={() => setFilterStatus('All')}
          >
            <span>All Fleet</span>
            <span className="count-badge yellow">{allCount}</span>
          </button>

          <button
            className={`status-pill-btn ${filterStatus === 'Online' ? 'active' : ''}`}
            onClick={() => setFilterStatus('Online')}
          >
            <span>Online</span>
            <span className="count-badge green">{onlineCount}</span>
          </button>

          <button
            className={`status-pill-btn ${filterStatus === 'Offline' ? 'active' : ''}`}
            onClick={() => setFilterStatus('Offline')}
          >
            <span>Offline</span>
            <span className="count-badge gray">{offlineCount}</span>
          </button>
        </div>

        <button className="add-rider-btn" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          <span>+ Add Rider</span>
        </button>
      </div>

      {/* MAIN DATA TABLE: PENDING RIDERS VIEW */}
      {filterStatus === 'Pending' ? (
        <div className="riders-table-card">
          <table className="riders-table">
            <thead>
              <tr>
                <th>RIDER APPLICANT</th>
                <th>PHONE NUMBER</th>
                <th>VEHICLE TYPE</th>
                <th>LICENSE PLATE / NUMBER</th>
                <th>APPLIED ON</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'center' }}>APPROVAL ACTION</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingPending ? (
                // Shimmer Loading Skeleton Rows
                [...Array(4)].map((_, i) => (
                  <tr key={`skeleton-${i}`} className="skeleton-row">
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="skeleton-box avatar" />
                        <div>
                          <div className="skeleton-box text-lg" style={{ marginBottom: '6px' }} />
                          <div className="skeleton-box text-sm" />
                        </div>
                      </div>
                    </td>
                    <td><div className="skeleton-box text-md" /></td>
                    <td><div className="skeleton-box text-sm" /></td>
                    <td><div className="skeleton-box badge" /></td>
                    <td><div className="skeleton-box text-sm" /></td>
                    <td><div className="skeleton-box badge" /></td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="skeleton-box button" style={{ margin: '0 auto' }} />
                    </td>
                  </tr>
                ))
              ) : filteredPendingRiders.length === 0 ? (
                // Clean Empty State
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state-card">
                      <div className="empty-state-icon-wrap">
                        <ShieldCheck size={32} />
                      </div>
                      <div className="empty-state-title">
                        {searchTerm ? 'No Matching Applications' : 'All Rider Applications Approved'}
                      </div>
                      <p className="empty-state-desc">
                        {searchTerm
                          ? `No pending riders matched "${searchTerm}". Try searching by a different name or phone number.`
                          : 'There are no unapproved riders waiting in the queue. All delivery partners are ready and active.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPendingRiders.map((r) => {
                  const isThisApproving = approvingId === r.id;
                  const isAnyApproving = approvingId !== null;

                  return (
                    <tr key={r.id}>
                      <td className="rider-cell">
                        <img src={r.avatar} alt={r.name} className="table-avatar" />
                        <div>
                          <span className="rider-name-text">{r.name}</span>
                          <div className="rider-email-sub">{r.email}</div>
                        </div>
                      </td>
                      <td className="phone-cell">{r.phone}</td>
                      <td className="vehicle-cell">
                        <span className="vehicle-type-pill">
                          <Bike size={15} color="#FF6B00" />
                          <span>{r.vehicleType}</span>
                        </span>
                      </td>
                      <td>
                        <span className="license-plate-badge">{r.vehicleNumber}</span>
                      </td>
                      <td className="location-cell">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem' }}>
                          <Clock size={13} color="#71717A" />
                          {r.appliedDate}
                        </span>
                      </td>
                      <td>
                        <span className="rider-status-badge pending">
                          Pending Approval
                        </span>
                      </td>
                      <td className="actions-cell" style={{ justifyContent: 'center' }}>
                        <button
                          className={`approve-rider-btn ${isThisApproving ? 'is-approving' : ''}`}
                          onClick={() => handleApproveRider(r.id, r.name)}
                          disabled={isAnyApproving}
                          title={isThisApproving ? 'Approving application...' : 'Approve and activate rider'}
                        >
                          {isThisApproving ? (
                            <>
                              <Loader2 size={15} className="animate-spin" />
                              <span>Approving...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={15} />
                              <span>Approve Rider</span>
                            </>
                          )}
                        </button>

                        <button
                          className="action-icon-btn highlight"
                          title="View Rider Profile & Documents"
                          onClick={() => setSelectedRider(r)}
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* ALL / ONLINE / OFFLINE RIDERS TABLE VIEW */
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
              {isLoadingAll ? (
                [...Array(4)].map((_, i) => (
                  <tr key={`sk-all-${i}`} className="skeleton-row">
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="skeleton-box avatar" />
                        <div className="skeleton-box text-lg" />
                      </div>
                    </td>
                    <td><div className="skeleton-box text-md" /></td>
                    <td><div className="skeleton-box text-sm" /></td>
                    <td><div className="skeleton-box text-sm" /></td>
                    <td><div className="skeleton-box badge" /></td>
                    <td><div className="skeleton-box text-sm" /></td>
                    <td><div className="skeleton-box text-sm" /></td>
                    <td><div className="skeleton-box button" /></td>
                  </tr>
                ))
              ) : filteredAllRiders.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state-card">
                      <div className="empty-state-title">No Riders Found</div>
                      <p className="empty-state-desc">No riders found matching the current filter criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAllRiders.map((r) => (
                  <tr key={r.id}>
                    <td className="rider-cell">
                      <img src={r.avatar} alt={r.name} className="table-avatar" />
                      <div>
                        <span className="rider-name-text">{r.name}</span>
                        {r.email && <div className="rider-email-sub">{r.email}</div>}
                      </div>
                    </td>
                    <td className="vehicle-cell">
                      <span className="license-plate-badge" style={{ marginRight: '8px' }}>
                        {r.vehicleNumber}
                      </span>
                      <span>{r.vehicleType}</span>
                    </td>
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
                      {/* If rider in All list is pending, provide quick approve */}
                      {!r.isApproved && (
                        <button
                          className={`approve-rider-btn ${approvingId === r.id ? 'is-approving' : ''}`}
                          onClick={() => handleApproveRider(r.id, r.name)}
                          disabled={approvingId !== null}
                          title="Approve Rider"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        >
                          {approvingId === r.id ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              <span>Approving...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={13} />
                              <span>Approve</span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        className="action-icon-btn highlight"
                        title="View Rider Profile & Documents"
                        onClick={() => setSelectedRider(r)}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="pagination-bar">
        <button className="page-btn" disabled>
          <ChevronLeft size={16} />
        </button>
        <button className="page-btn active">1</button>
        <button className="page-btn">2</button>
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

              <button
                type="submit"
                className="add-rider-btn"
                style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
              >
                <span>Save & Register Rider</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
