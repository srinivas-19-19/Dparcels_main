import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import RiderPaymentModal from '../components/RiderPaymentModal';
import OrderDetailModal from '../components/OrderDetailModal';

const STEPS = [
  { key: 'CREATED', label: 'Placed', icon: 'fa-check' },
  { key: 'ACCEPTED', label: 'Assigned', icon: 'fa-user-check' },
  { key: 'ARRIVED_PICKUP', label: 'At Pickup', icon: 'fa-location-dot' },
  { key: 'PICKED_UP', label: 'On Way', icon: 'fa-motorcycle' },
  { key: 'DELIVERED', label: 'Delivered', icon: 'fa-circle-check' }
];

const getStepNumber = (status) => {
  switch (status) {
    case 'DRAFT':
    case 'PAYMENT_PENDING':
    case 'CONFIRMED':
      return 1;
    case 'ASSIGNING':
    case 'RIDER_ASSIGNED':
    case 'ACCEPTED':
      return 2;
    case 'ARRIVED_PICKUP':
      return 3;
    case 'PICKED_UP':
    case 'IN_TRANSIT':
    case 'OUT_FOR_DELIVERY':
      return 4;
    case 'DELIVERED':
      return 5;
    default:
      return 1;
  }
};

const getStatusMeta = (status) => {
  switch (status) {
    case 'DELIVERED':
      return {
        bg: 'rgba(34, 197, 94, 0.15)',
        color: '#22c55e',
        category: 'completed'
      };
    case 'CANCELLED':
    case 'FAILED':
      return {
        bg: 'rgba(239, 68, 68, 0.15)',
        color: '#ef4444',
        category: 'completed'
      };
    case 'ARRIVED_PICKUP':
      return {
        bg: 'rgba(255, 138, 0, 0.15)',
        color: '#FF8A00',
        category: 'active'
      };
    case 'PICKED_UP':
    case 'IN_TRANSIT':
    case 'OUT_FOR_DELIVERY':
      return {
        bg: 'rgba(6, 182, 212, 0.15)',
        color: '#06b6d4',
        category: 'active'
      };
    case 'ACCEPTED':
    case 'RIDER_ASSIGNED':
      return {
        bg: 'rgba(59, 130, 246, 0.15)',
        color: '#3b82f6',
        category: 'active'
      };
    case 'PAYMENT_PENDING':
    case 'CONFIRMED':
    default:
      return {
        bg: 'rgba(168, 85, 247, 0.15)',
        color: '#a855f7',
        category: 'active'
      };
  }
};

export const OrdersView = ({ onGoHome }) => {
  const { t } = useLanguage();
  const { socket } = useAuth();
  const [filter, setFilter] = useState('all');

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentModalOrder, setPaymentModalOrder] = useState(null);
  const [detailOrderId, setDetailOrderId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();

    const handleOrderCreated = () => fetchOrders();
    const handlePaymentConfirmedEvent = () => fetchOrders();

    window.addEventListener('dparcels:orderCreated', handleOrderCreated);
    window.addEventListener('dparcels:paymentConfirmed', handlePaymentConfirmedEvent);

    if (!socket) {
      return () => {
        window.removeEventListener('dparcels:orderCreated', handleOrderCreated);
        window.removeEventListener('dparcels:paymentConfirmed', handlePaymentConfirmedEvent);
      };
    }

    const handleStatusUpdated = (data) => {
      const targetOrderId = data?.orderId || data?.id;
      if (!targetOrderId && !data?.trackingId) return;

      const newStatus = data?.status || 'ACCEPTED';
      const riderInfo = data?.rider;
      const meta = getStatusMeta(newStatus);

      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          const isTarget =
            (targetOrderId && order.rawId === targetOrderId) ||
            (data?.trackingId && order.trackingId === data.trackingId) ||
            (targetOrderId && order.id === `#${targetOrderId.substring(0, 6).toUpperCase()}`);

          if (isTarget) {
            return {
              ...order,
              status: newStatus,
              category: meta.category,
              statusBg: meta.bg,
              statusColor: meta.color,
              rider: riderInfo || order.rider
            };
          }
          return order;
        })
      );
    };

    const handlePaymentConfirmed = (data) => {
      const targetOrderId = data?.orderId || data?.id;
      if (!targetOrderId && !data?.trackingId) return;

      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          const isTarget =
            (targetOrderId && order.rawId === targetOrderId) ||
            (data?.trackingId && order.trackingId === data.trackingId);

          if (isTarget) {
            return {
              ...order,
              paymentStatus: 'PAID',
              payment: { ...(order.payment || {}), status: 'PAID', paymentMethod: data?.paymentMethod || 'RIDER_QR' }
            };
          }
          return order;
        })
      );
    };

    socket.on('order_status_updated', handleStatusUpdated);
    socket.on('order_status_update', handleStatusUpdated);
    socket.on('payment_confirmed', handlePaymentConfirmed);

    return () => {
      window.removeEventListener('dparcels:orderCreated', handleOrderCreated);
      window.removeEventListener('dparcels:paymentConfirmed', handlePaymentConfirmedEvent);
      socket.off('order_status_updated', handleStatusUpdated);
      socket.off('order_status_update', handleStatusUpdated);
      socket.off('payment_confirmed', handlePaymentConfirmed);
    };
  }, [socket]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await api.post(`/orders/${orderId}/cancel`, { reason: 'Cancelled by customer' });
      fetchOrders();
      window.dispatchEvent(new CustomEvent('dparcels:refreshDashboard'));
    } catch (err) {
      console.error('[OrdersView] Cancel error:', err);
      alert(err.response?.data?.message || 'Failed to cancel order.');
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/my-orders');
      
      const formattedOrders = (response.data?.data || []).map((order) => {
        const meta = getStatusMeta(order.status);
        const rawType = (order.packageCategory || order.serviceType || 'CUSTOM').toUpperCase();
        const icon =
          rawType === 'FOOD'
            ? 'fa-utensils'
            : rawType === 'MEDICINE'
            ? 'fa-capsules'
            : rawType === 'GROCERIES'
            ? 'fa-cart-shopping'
            : rawType === 'DOCUMENTS'
            ? 'fa-file-lines'
            : 'fa-box';

        const storeDisplay = order.storeName
          ? `${order.storeName} (${order.pickupAddress})`
          : order.pickupAddress || order.pickupLocation || 'Pickup Location';

        const itemsDisplay =
          Array.isArray(order.items) && order.items.length > 0
            ? order.items.join(', ')
            : order.instructions || order.packageCategory || rawType || 'Standard Package';

        return {
          id: `#${(order.trackingId || order.id).substring(0, 6).toUpperCase()}`,
          rawId: order.id,
          trackingId: order.trackingId,
          category: meta.category,
          type: rawType,
          icon,
          iconBg: 'rgba(255, 107, 0, 0.15)',
          iconColor: '#FF6B00',
          store: storeDisplay,
          drop: order.dropAddress || order.dropLocation || 'Drop Location',
          status: order.status,
          statusBg: meta.bg,
          statusColor: meta.color,
          time: new Date(order.createdAt).toLocaleString(),
          amount: `₹${order.totalAmount ?? order.totalPrice ?? 0}`,
          price: order.totalAmount ?? order.totalPrice ?? 0,
          payment: order.payment || null,
          paymentStatus: order.payment?.status || 'PENDING',
          items: itemsDisplay,
          rider: order.rider || null
        };
      });
      setOrders(formattedOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesFilter =
      filter === 'all' || order.category === filter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q ||
      (order.id && order.id.toLowerCase().includes(q)) ||
      (order.trackingId && order.trackingId.toLowerCase().includes(q)) ||
      (order.type && order.type.toLowerCase().includes(q)) ||
      (order.store && order.store.toLowerCase().includes(q)) ||
      (order.drop && order.drop.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="view-container orders-view-container" style={{ width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 16 }}>
        <div>
          <h1 className="greeting-title" style={{ fontSize: 24, fontWeight: 900 }} dangerouslySetInnerHTML={{ __html: t('your_orders_title') }}></h1>
          <p className="subtitle" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t('orders_sub')}</p>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: 12, width: '100%' }}>
        <i className="fa-solid fa-magnifying-glass" style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text-muted)', fontSize: 13, pointerEvents: 'none',
        }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by ID, type, address…"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'var(--input-bg)', border: '1px solid var(--border-color)',
            borderRadius: 12, padding: '10px 12px 10px 36px',
            fontSize: 13, color: 'var(--text-main)', fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: 14, lineHeight: 1,
            }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        )}
      </div>

      <div className="filter-row orders-filter-row" style={{ width: '100%', display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
          style={{ flex: 1, padding: '11px 4px', fontSize: 11, fontWeight: 800 }}
        >
          {t('all_orders')} ({orders.length})
        </button>
        <button
          className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
          style={{ flex: 1, padding: '11px 4px', fontSize: 11, fontWeight: 800 }}
        >
          {t('active_orders')} ({orders.filter(o => o.category === 'active').length})
        </button>
        <button
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
          style={{ flex: 1, padding: '11px 4px', fontSize: 11, fontWeight: 800 }}
        >
          {t('completed_orders')} ({orders.filter(o => o.category === 'completed').length})
        </button>
      </div>

      {filteredOrders.length > 0 ? (
        <div className="orders-cards-grid" style={{ width: '100%' }}>
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="order-card-item"
              onClick={() => setDetailOrderId(order.rawId)}
              style={{
                width: '100%',
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: 18,
                padding: 16,
                boxSizing: 'border-box',
                transition: 'all 0.25s ease',
                cursor: 'pointer',
              }}
            >
              {/* Top Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: order.iconBg,
                      color: order.iconColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18
                    }}
                  >
                    <i className={`fa-solid ${order.icon}`}></i>
                  </div>
                  <div>
                    <strong style={{ fontSize: 14, color: 'var(--text-main)', display: 'block' }}>{order.type}</strong>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>ID: {order.id} • {order.time}</span>
                  </div>
                </div>

                <span
                  style={{
                    background: order.statusBg,
                    color: order.statusColor,
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: 20,
                    letterSpacing: 0.5
                  }}
                >
                  ● {order.status}
                </span>
              </div>

              {/* Progress Timeline Stepper */}
              <div style={{
                background: 'var(--input-bg)',
                borderRadius: 12,
                padding: '12px 6px',
                marginBottom: 12,
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                  {STEPS.map((step, idx) => {
                    const stepNum = idx + 1;
                    const currentStepNum = getStepNumber(order.status);
                    const isPassed = stepNum < currentStepNum;
                    const isCurrent = stepNum === currentStepNum;
                    const isUpcoming = stepNum > currentStepNum;

                    const activeColor = order.status === 'DELIVERED' ? '#22c55e' : isCurrent ? '#FF8A00' : '#22c55e';

                    return (
                      <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative', zIndex: 2 }}>
                        {/* Circle node */}
                        <div style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          backgroundColor: isUpcoming ? 'var(--card-bg)' : activeColor,
                          border: isUpcoming ? '2px solid var(--border-color)' : `2px solid ${activeColor}`,
                          color: isUpcoming ? 'var(--text-muted)' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 9,
                          fontWeight: 800,
                          boxShadow: isCurrent ? `0 0 10px ${activeColor}80` : 'none',
                          transition: 'all 0.3s ease'
                        }}>
                          {isPassed ? (
                            <i className="fa-solid fa-check" style={{ fontSize: 8 }}></i>
                          ) : (
                            <i className={`fa-solid ${step.icon}`} style={{ fontSize: 8 }}></i>
                          )}
                        </div>

                        {/* Label */}
                        <span style={{
                          fontSize: 9,
                          marginTop: 4,
                          fontWeight: isCurrent ? 800 : 600,
                          color: isUpcoming ? 'var(--text-muted)' : isCurrent ? activeColor : 'var(--text-main)',
                          textAlign: 'center',
                          whiteSpace: 'nowrap'
                        }}>
                          {step.label}
                        </span>

                        {/* Connector line to next node */}
                        {idx < STEPS.length - 1 && (
                          <div style={{
                            position: 'absolute',
                            top: 11,
                            left: '50%',
                            width: '100%',
                            height: 2,
                            backgroundColor: stepNum < currentStepNum ? '#22c55e' : 'var(--border-color)',
                            zIndex: -1
                          }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Locations */}
              <div style={{ background: 'var(--input-bg)', borderRadius: 12, padding: '10px 12px', marginBottom: 12, border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-main)', marginBottom: 6 }}>
                  <i className="fa-solid fa-circle-dot" style={{ color: '#22c55e', fontSize: 10 }}></i>
                  <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.store}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-main)' }}>
                  <i className="fa-solid fa-location-dot" style={{ color: 'var(--primary-orange-light)', fontSize: 10 }}></i>
                  <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.drop}</span>
                </div>
              </div>

              {/* Rider Assigned Details */}
              {order.rider && (
                <div style={{
                  background: 'rgba(34, 197, 94, 0.08)',
                  border: '1px solid rgba(34, 197, 94, 0.25)',
                  borderRadius: 12,
                  padding: '10px 12px',
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: '#22c55e',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14
                    }}>
                      <i className="fa-solid fa-motorcycle"></i>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-main)' }}>
                        {order.rider.firstName} {order.rider.lastName || ''}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
                        {order.rider.vehicleType || 'Bike'} • {order.rider.vehicleNumber || 'Assigned'}
                        {order.rider.rating ? ` • ★ ${order.rider.rating}` : ''}
                      </div>
                    </div>
                  </div>
                  {order.rider.phone && (
                    <a
                      href={`tel:${order.rider.phone}`}
                      style={{
                        backgroundColor: '#22c55e',
                        color: '#ffffff',
                        fontSize: 11,
                        textDecoration: 'none',
                        fontWeight: 800,
                        padding: '6px 12px',
                        borderRadius: 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <i className="fa-solid fa-phone" style={{ fontSize: 10 }}></i>
                      <span>Call</span>
                    </a>
                  )}
                </div>
              )}

              {/* Items Summary & Price */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, maxWidth: '65%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {order.items}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {order.rider && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPaymentModalOrder(order); }}
                      style={{
                        background: order.paymentStatus === 'PAID'
                          ? 'rgba(34, 197, 94, 0.14)'
                          : 'linear-gradient(135deg, #FF8800 0%, #FF5500 100%)',
                        border: order.paymentStatus === 'PAID'
                          ? '1px solid rgba(34, 197, 94, 0.35)'
                          : 'none',
                        color: order.paymentStatus === 'PAID' ? '#22c55e' : '#ffffff',
                        borderRadius: 10,
                        padding: '4px 10px',
                        fontSize: 10,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        boxShadow: order.paymentStatus === 'PAID' ? 'none' : '0 2px 8px rgba(255, 136, 0, 0.3)'
                      }}
                    >
                      <i className={`fa-solid ${order.paymentStatus === 'PAID' ? 'fa-circle-check' : 'fa-qrcode'}`}></i>
                      <span>{order.paymentStatus === 'PAID' ? 'Paid / View QR' : 'Pay Rider / QR'}</span>
                    </button>
                  )}
                  {['DRAFT', 'PAYMENT_PENDING', 'CONFIRMED', 'ASSIGNING', 'RIDER_ASSIGNED'].includes(order.status) && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleCancelOrder(order.rawId); }}
                      style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        borderRadius: 10,
                        padding: '4px 9px',
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  )}
                  <strong style={{ fontSize: 16, color: 'var(--primary-orange-light)', fontWeight: 900 }}>{order.amount}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state orders-empty-state" style={{ width: '100%', boxSizing: 'border-box' }}>
          <i className="fa-solid fa-box-open empty-icon"></i>
          <h3 style={{ fontSize: 15 }}>{t('no_active_orders')}</h3>
          <p className="start-order-text" onClick={onGoHome}>
            {t('start_ordering')}
          </p>
        </div>
      )}

      {/* Rider Payment Modal */}
      <RiderPaymentModal
        isOpen={Boolean(paymentModalOrder)}
        order={paymentModalOrder}
        onClose={() => {
          setPaymentModalOrder(null);
          fetchOrders();
        }}
      />

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={Boolean(detailOrderId)}
        orderId={detailOrderId}
        onClose={() => {
          setDetailOrderId(null);
          fetchOrders();
        }}
        onReorder={(prefillData) => {
          setDetailOrderId(null);
          window.dispatchEvent(new CustomEvent('dparcels:reorder', { detail: prefillData }));
        }}
      />
    </div>
  );
};
