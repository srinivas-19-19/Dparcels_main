import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Bell,
  X,
  MapPin,
  Clock,
  Package,
  User,
  ShoppingBag,
  CreditCard,
  Navigation
} from 'lucide-react';
import AdminLiveTracking from './AdminLiveTracking';
import '../styles/dashboard.css';

export default function AdminOrders() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingOrder, setTrackingOrder] = useState(null);

  // Orders dataset matching screenshot
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/orders');
      // Format orders for UI
      const formatted = response.data.data.map(order => ({
        id: `#${order.id.substring(0,6).toUpperCase()}`,
        rawId: order.id,
        customer: order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'N/A',
        rider: order.rider ? `${order.rider.user.firstName} ${order.rider.user.lastName}` : 'Unassigned',
        phone: order.rider ? order.rider.user.phone : 'N/A',
        customerPhone: order.customer ? order.customer.phone : 'N/A',
        pickup: order.pickupLocation,
        drop: order.dropLocation,
        distance: `${order.distance} KM`,
        amount: `₹${order.totalPrice}`,
        status: order.status,
        statusClass: order.status.toLowerCase().replace('_', '-'),
        date: new Date(order.createdAt).toLocaleString(),
        eta: 'N/A', // Compute ETA dynamically later
        distanceLeft: 'N/A'
      }));
      setOrders(formatted);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter orders by search query and status pill
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.rider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.pickup.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterStatus === 'All') return matchesSearch;
    if (filterStatus === 'Pending') return matchesSearch && (o.status === 'Waiting' || o.status === 'Pending');
    if (filterStatus === 'Accepted') return matchesSearch && o.status === 'Picking Up';
    if (filterStatus === 'Picked Up') return matchesSearch && o.status === 'Picking Up';
    if (filterStatus === 'In Transit') return matchesSearch && o.status === 'In Transit';
    if (filterStatus === 'Cancelled') return matchesSearch && o.status === 'Cancelled';
    return matchesSearch;
  });

  // If tracking order is selected, render AdminLiveTracking view
  if (trackingOrder) {
    return (
      <AdminLiveTracking
        order={trackingOrder}
        onBack={() => setTrackingOrder(null)}
      />
    );
  }

  return (
    <div className="orders-view-container">
      {/* Header Row */}
      <div className="orders-header-row">
        <div>
          <h1 className="header-greeting">Orders Management</h1>
          <p className="header-subtext">View and track all customer orders.</p>
        </div>

        <div className="header-actions">
          <button className="icon-btn" title="Search">
            <Search size={18} />
          </button>
          <button className="icon-btn has-badge" title="Notifications">
            <Bell size={18} />
            <span className="header-badge">4</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Status Filter Pills */}
      <div className="orders-actions-bar">
        <div className="orders-search-wrapper">
          <Search size={16} color="#8A9285" />
          <input
            type="text"
            className="orders-search-input"
            placeholder="Search order by ID, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="orders-status-filter-pills">
          {['All', 'Pending', 'Accepted', 'Picked Up', 'In Transit', 'Cancelled'].map((status) => (
            <button
              key={status}
              className={`orders-filter-pill ${filterStatus === status ? 'active' : ''}`}
              onClick={() => setFilterStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* ORDERS TABLE CARD */}
      <div className="orders-table-card">
        <table className="orders-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>CUSTOMER</th>
              <th>RIDER</th>
              <th>PICKUP</th>
              <th>DISTANCE</th>
              <th>AMOUNT</th>
              <th>STATUS</th>
              <th>DATE</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => setTrackingOrder(order)}>
                <td className="order-id-cell">{order.id}</td>
                <td className="customer-cell">{order.customer}</td>
                <td className="rider-name-cell">{order.rider}</td>
                <td className="pickup-cell">{order.pickup}</td>
                <td className="distance-cell">{order.distance}</td>
                <td className="amount-cell">{order.amount}</td>
                <td>
                  <span className={`status-pill ${order.statusClass}`}>
                    {order.status}
                  </span>
                </td>
                <td className="date-cell">{order.date}</td>
                <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="action-icon-btn highlight"
                    title="Live Tracking Map"
                    onClick={() => setTrackingOrder(order)}
                  >
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '2.5rem', color: '#8A9285' }}>
                  No orders found matching criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Pagination Controls */}
      <div className="pagination-bar">
        <button
          className="page-btn"
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={16} />
        </button>
        {[1, 2, 3, 4, 5].map((page) => (
          <button
            key={page}
            className={`page-btn ${currentPage === page ? 'active' : ''}`}
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </button>
        ))}
        <button
          className="page-btn"
          onClick={() => setCurrentPage(Math.min(5, currentPage + 1))}
          disabled={currentPage === 5}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
