import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../utils/api';
import {
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Package,
  PackageSearch,
  UserX,
  Phone,
  Clock,
  CheckCircle2,
  Calendar,
  X
} from 'lucide-react';
import AdminLiveTracking from './AdminLiveTracking';
import '../styles/dashboard.css';

export default function AdminOrders() {
  // Master State
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  // Selected Order for Live Tracking
  const [trackingOrder, setTrackingOrder] = useState(null);

  // Fetch all orders: GET /api/v1/admin/orders
  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get('/admin/orders');
      const rawOrders = res.data?.data || res.data || [];

      // Format orders into a normalized structure
      const formatted = rawOrders.map((order) => {
        // Safe Customer Details
        const customerName = order.customer
          ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || 'Customer'
          : 'Unknown Customer';
        const customerPhone = order.customer?.phone || 'N/A';

        // Safe Rider Details
        const hasRider = Boolean(order.riderProfileId && order.rider);
        const riderName = hasRider
          ? `${order.rider.firstName || ''} ${order.rider.lastName || ''}`.trim() ||
            order.rider.user?.email?.split('@')[0] ||
            'Assigned Rider'
          : 'Unassigned';
        const riderPhone = hasRider ? (order.rider.phone || 'N/A') : null;

        // Tracking ID
        const trackingId = order.trackingId || `#${order.id.slice(0, 8).toUpperCase()}`;

        // Localized Date/Time
        const formattedDate = order.createdAt
          ? new Date(order.createdAt).toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })
          : 'Recent';

        const amount = Number(order.totalAmount || 0);

        return {
          rawId: order.id,
          id: trackingId,
          trackingId,
          date: formattedDate,
          customer: customerName,
          customerName,
          customerPhone,
          rider: riderName,
          riderName,
          riderPhone,
          hasRider,
          riderProfileId: order.riderProfileId,
          status: order.status || 'DRAFT',
          totalAmount: amount,
          amountFormatted: `₹${amount.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`,
          amount: `₹${amount.toLocaleString('en-IN')}`,
          pickup: order.pickupAddress || 'Address not available',
          drop: order.dropAddress || 'Address not available',
          distance: order.distanceKm ? `${Number(order.distanceKm).toFixed(1)} KM` : 'N/A',
          serviceType: order.serviceType || 'Standard Delivery'
        };
      });

      setOrders(formatted);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Error fetching admin orders:', err);
      const msg =
        err.response?.data?.message ||
        (err.response?.status === 403
          ? 'Access denied. Administrator privileges required.'
          : err.response?.status === 401
          ? 'Session expired. Please log in again.'
          : 'Failed to load platform orders. Please verify your connection.');
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial Fetch on component mount
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Derived State: Dynamic counts for status categories (pure render computation)
  const categoryCounts = useMemo(() => {
    const counts = {
      ALL: orders.length,
      ACTIVE: 0,
      COMPLETED: 0,
      UNASSIGNED: 0,
      CANCELLED: 0
    };

    orders.forEach((o) => {
      if (
        [
          'ASSIGNING',
          'RIDER_ASSIGNED',
          'ACCEPTED',
          'ARRIVED_PICKUP',
          'PICKED_UP',
          'IN_TRANSIT',
          'OUT_FOR_DELIVERY'
        ].includes(o.status)
      ) {
        counts.ACTIVE += 1;
      }
      if (o.status === 'DELIVERED') {
        counts.COMPLETED += 1;
      }
      if (!o.hasRider || o.riderName === 'Unassigned') {
        counts.UNASSIGNED += 1;
      }
      if (o.status === 'CANCELLED' || o.status === 'FAILED') {
        counts.CANCELLED += 1;
      }
    });

    return counts;
  }, [orders]);

  // Derived State: Filtered Orders without mutating master orders array
  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return orders.filter((order) => {
      // 1. Text Search matching Tracking ID, Customer Name/Phone, or Rider Name/Phone
      const matchesSearch =
        !query ||
        order.trackingId.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerPhone.toLowerCase().includes(query) ||
        order.riderName.toLowerCase().includes(query) ||
        (order.riderPhone && order.riderPhone.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      // 2. Status Category filter
      switch (filterCategory) {
        case 'ACTIVE':
          return [
            'ASSIGNING',
            'RIDER_ASSIGNED',
            'ACCEPTED',
            'ARRIVED_PICKUP',
            'PICKED_UP',
            'IN_TRANSIT',
            'OUT_FOR_DELIVERY'
          ].includes(order.status);
        case 'COMPLETED':
          return order.status === 'DELIVERED';
        case 'UNASSIGNED':
          return !order.hasRider || order.riderName === 'Unassigned';
        case 'CANCELLED':
          return order.status === 'CANCELLED' || order.status === 'FAILED';
        case 'ALL':
        default:
          return true;
      }
    });
  }, [orders, searchQuery, filterCategory]);

  // Reset pagination on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory]);

  // Derived State: Paginated slice
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ordersPerPage));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ordersPerPage;
    return filteredOrders.slice(start, start + ordersPerPage);
  }, [filteredOrders, currentPage, ordersPerPage]);

  // Helper: Status badge styling and display label
  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAYMENT_PENDING':
      case 'DRAFT':
        return { className: 'payment-pending', label: 'Payment Pending' };
      case 'CONFIRMED':
      case 'ASSIGNING':
        return { className: 'assigning', label: 'Assigning Rider' };
      case 'ACCEPTED':
      case 'RIDER_ASSIGNED':
        return { className: 'rider-assigned', label: 'Rider Assigned' };
      case 'ARRIVED_PICKUP':
        return { className: 'arrived-pickup', label: 'Arrived at Pickup' };
      case 'PICKED_UP':
        return { className: 'picked-up', label: 'Picked Up' };
      case 'IN_TRANSIT':
        return { className: 'in-transit', label: 'In Transit' };
      case 'OUT_FOR_DELIVERY':
        return { className: 'out-for-delivery', label: 'Out for Delivery' };
      case 'DELIVERED':
        return { className: 'delivered', label: 'Delivered' };
      case 'CANCELLED':
        return { className: 'cancelled', label: 'Cancelled' };
      case 'FAILED':
        return { className: 'failed', label: 'Failed' };
      default:
        return { className: 'draft', label: status || 'Unknown' };
    }
  };

  // Switch to live tracking if selected
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
          <h1 className="header-greeting">Orders Monitoring</h1>
          <p className="header-subtext">
            Live master monitoring of all customer orders, assigned delivery riders, and dispatch states.
          </p>
        </div>

        {/* Header Actions: Refresh Button with Spinner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {lastRefreshed && (
            <span className="last-refreshed-text">
              Updated {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button
            className="refresh-data-btn"
            onClick={fetchOrders}
            disabled={isLoading}
            title="Refresh order records"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {/* Inline Error Alert Banner */}
      {error && (
        <div className="dashboard-error-banner">
          <div className="error-content">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button className="retry-btn" onClick={fetchOrders} title="Retry loading orders">
            <RefreshCw size={13} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Search Bar & Filter Tabs */}
      <div className="orders-actions-bar">
        {/* Search Input */}
        <div className="orders-search-wrapper">
          <Search size={16} color="#8A9285" />
          <input
            type="text"
            className="orders-search-input"
            placeholder="Search by Tracking ID, Customer, or Rider..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              style={{ background: 'transparent', border: 'none', color: '#8A9285', cursor: 'pointer' }}
              onClick={() => setSearchQuery('')}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Status Filter Category Tabs */}
        <div className="status-filter-pills">
          <button
            className={`status-pill-btn ${filterCategory === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterCategory('ALL')}
          >
            <span>All Orders</span>
            <span className="count-badge yellow">{categoryCounts.ALL}</span>
          </button>

          <button
            className={`status-pill-btn ${filterCategory === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => setFilterCategory('ACTIVE')}
          >
            <span>Active Trips</span>
            <span className="count-badge green">{categoryCounts.ACTIVE}</span>
          </button>

          <button
            className={`status-pill-btn ${filterCategory === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setFilterCategory('COMPLETED')}
          >
            <span>Completed</span>
            <span className="count-badge green">{categoryCounts.COMPLETED}</span>
          </button>

          <button
            className={`status-pill-btn ${filterCategory === 'UNASSIGNED' ? 'active' : ''}`}
            onClick={() => setFilterCategory('UNASSIGNED')}
          >
            <span>Unassigned</span>
            <span className="count-badge orange">{categoryCounts.UNASSIGNED}</span>
          </button>

          <button
            className={`status-pill-btn ${filterCategory === 'CANCELLED' ? 'active' : ''}`}
            onClick={() => setFilterCategory('CANCELLED')}
          >
            <span>Cancelled</span>
            <span className="count-badge red">{categoryCounts.CANCELLED}</span>
          </button>
        </div>
      </div>

      {/* ORDERS DATA TABLE */}
      <div className="orders-table-card">
        <table className="orders-table">
          <thead>
            <tr>
              <th>TRACKING ID</th>
              <th>DATE / TIME</th>
              <th>CUSTOMER</th>
              <th>ASSIGNED RIDER</th>
              <th>STATUS</th>
              <th>TOTAL AMOUNT</th>
              <th style={{ textAlign: 'center' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Shimmer Loading Skeleton Rows
              [...Array(5)].map((_, i) => (
                <tr key={`sk-order-${i}`} className="skeleton-row">
                  <td><div className="skeleton-box badge" style={{ width: '110px' }} /></td>
                  <td><div className="skeleton-box text-md" /></td>
                  <td>
                    <div className="skeleton-box text-md" style={{ marginBottom: '6px' }} />
                    <div className="skeleton-box text-sm" />
                  </td>
                  <td>
                    <div className="skeleton-box text-md" style={{ marginBottom: '6px' }} />
                    <div className="skeleton-box text-sm" />
                  </td>
                  <td><div className="skeleton-box badge" style={{ width: '90px' }} /></td>
                  <td><div className="skeleton-box text-md" style={{ width: '80px' }} /></td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="skeleton-box button" style={{ width: '36px', height: '32px', margin: '0 auto' }} />
                  </td>
                </tr>
              ))
            ) : paginatedOrders.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={7}>
                  <div className="empty-state-card">
                    <div className="empty-state-icon-wrap" style={{ background: 'rgba(255, 107, 0, 0.12)', borderColor: 'rgba(255, 107, 0, 0.3)' }}>
                      <PackageSearch size={32} color="#FF6B00" />
                    </div>
                    <div className="empty-state-title">
                      {searchQuery || filterCategory !== 'ALL'
                        ? 'No Orders Match Your Filter'
                        : 'No Orders Placed Yet'}
                    </div>
                    <p className="empty-state-desc">
                      {searchQuery || filterCategory !== 'ALL'
                        ? `No order records matched "${searchQuery}" under ${filterCategory} filter. Try adjusting your query.`
                        : 'Customer orders will appear here automatically as they are placed across the platform.'}
                    </p>
                    {(searchQuery || filterCategory !== 'ALL') && (
                      <button
                        className="clear-filters-btn"
                        onClick={() => {
                          setSearchQuery('');
                          setFilterCategory('ALL');
                        }}
                      >
                        Clear Filters & Search
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              // Order Rows
              paginatedOrders.map((order) => {
                const badge = getStatusBadge(order.status);

                return (
                  <tr
                    key={order.rawId}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setTrackingOrder(order)}
                    title="Click to view live tracking & trip details"
                  >
                    {/* 1. Tracking ID */}
                    <td>
                      <span className="order-tracking-badge">
                        <Package size={14} />
                        <span>{order.trackingId}</span>
                      </span>
                    </td>

                    {/* 2. Date / Time */}
                    <td className="date-cell">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={13} color="#71717A" />
                        <span>{order.date}</span>
                      </span>
                    </td>

                    {/* 3. Customer (Name & Phone) */}
                    <td>
                      <div className="order-party-info">
                        <span className="order-party-name">{order.customerName}</span>
                        <span className="order-party-phone">
                          <Phone size={11} />
                          <span>{order.customerPhone}</span>
                        </span>
                      </div>
                    </td>

                    {/* 4. Assigned Rider (Name & Phone or "Unassigned") */}
                    <td>
                      {order.hasRider ? (
                        <div className="order-party-info">
                          <span className="order-party-name">{order.riderName}</span>
                          <span className="order-party-phone">
                            <Phone size={11} />
                            <span>{order.riderPhone}</span>
                          </span>
                        </div>
                      ) : (
                        <span className="unassigned-rider-badge">
                          <UserX size={13} />
                          <span>Unassigned</span>
                        </span>
                      )}
                    </td>

                    {/* 5. Status Badge */}
                    <td>
                      <span className={`order-status-badge ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>

                    {/* 6. Total Amount formatted */}
                    <td>
                      <span className="order-amount-bold">{order.amountFormatted}</span>
                    </td>

                    {/* 7. Actions */}
                    <td className="actions-cell" style={{ justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        className="action-icon-btn highlight"
                        title="View Live Tracking & Route"
                        onClick={() => setTrackingOrder(order)}
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

      {/* Pagination Controls */}
      <div className="pagination-bar">
        <button
          className="page-btn"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          title="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
          <button
            key={pageNum}
            className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
            onClick={() => setCurrentPage(pageNum)}
          >
            {pageNum}
          </button>
        ))}

        <button
          className="page-btn"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          title="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
