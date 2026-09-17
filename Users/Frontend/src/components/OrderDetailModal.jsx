import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useJsApiLoader, GoogleMap, Marker, Polyline } from '@react-google-maps/api';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import RiderPaymentModal from './RiderPaymentModal';

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_META = {
  DRAFT:          { color: '#a855f7', label: 'Draft' },
  PAYMENT_PENDING:{ color: '#a855f7', label: 'Payment Pending' },
  CONFIRMED:      { color: '#a855f7', label: 'Confirmed' },
  ASSIGNING:      { color: '#f59e0b', label: 'Finding Rider' },
  RIDER_ASSIGNED: { color: '#3b82f6', label: 'Rider Assigned' },
  ACCEPTED:       { color: '#3b82f6', label: 'Rider Accepted' },
  ARRIVED_PICKUP: { color: '#FF8A00', label: 'At Pickup' },
  PICKED_UP:      { color: '#06b6d4', label: 'Picked Up' },
  IN_TRANSIT:     { color: '#06b6d4', label: 'In Transit' },
  OUT_FOR_DELIVERY:{ color: '#06b6d4', label: 'Out for Delivery' },
  DELIVERED:      { color: '#22c55e', label: 'Delivered' },
  CANCELLED:      { color: '#ef4444', label: 'Cancelled' },
  FAILED:         { color: '#ef4444', label: 'Failed' },
};

const TIMELINE_STEPS = [
  { status: 'ASSIGNING',      icon: 'fa-search',        label: 'Order Placed' },
  { status: 'ACCEPTED',       icon: 'fa-user-check',    label: 'Rider Assigned' },
  { status: 'ARRIVED_PICKUP', icon: 'fa-location-dot',  label: 'At Pickup' },
  { status: 'PICKED_UP',      icon: 'fa-box',           label: 'Picked Up' },
  { status: 'DELIVERED',      icon: 'fa-circle-check',  label: 'Delivered' },
];

const STATUS_ORDER = ['ASSIGNING','RIDER_ASSIGNED','ACCEPTED','ARRIVED_PICKUP','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED'];

const getStepState = (stepStatus, currentStatus) => {
  if (currentStatus === 'CANCELLED' || currentStatus === 'FAILED') return 'upcoming';
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  const stepIdx    = STATUS_ORDER.indexOf(stepStatus);
  if (stepIdx < 0 || currentIdx < 0) return 'upcoming';
  if (stepIdx < currentIdx) return 'done';
  if (stepIdx === currentIdx) return 'current';
  return 'upcoming';
};

const fmt = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : '';

// ─── Star Rating Component ────────────────────────────────────────────────────
function StarRating({ value, onChange, readonly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <i
          key={star}
          className={`fa-${(hover || value) >= star ? 'solid' : 'regular'} fa-star`}
          style={{
            fontSize: 24,
            color: (hover || value) >= star ? '#FF8A00' : 'var(--border-color)',
            cursor: readonly ? 'default' : 'pointer',
            transition: 'color 0.15s',
          }}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          onClick={() => !readonly && onChange && onChange(star)}
        />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OrderDetailModal({ isOpen, orderId, onClose, onReorder, onOpenPayment }) {
  const { socket } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('timeline');
  const mapRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  // Rating state
  const [showRating, setShowRating] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);

  // Payment modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/orders/my-orders/${orderId}`);
      const data = res.data?.data || res.data;
      setOrder(data);
      setRatingDone(!!data?.Review);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrder();
      setActiveTab('timeline');
      setShowRating(false);
      setRatingValue(0);
      setRatingFeedback('');
    }
  }, [isOpen, orderId, fetchOrder]);

  // ── Real-time socket sync ──
  useEffect(() => {
    if (!socket || !isOpen || !order) return;

    const handleStatusUpdate = (data) => {
      const isTarget =
        data?.orderId === order.id || data?.trackingId === order.trackingId;
      if (!isTarget) return;
      setOrder((prev) => prev ? { ...prev, status: data.status, rider: data.rider || prev.rider } : prev);
    };

    const handlePaymentConfirmed = (data) => {
      const isTarget =
        data?.orderId === order.id || data?.trackingId === order.trackingId;
      if (!isTarget) return;
      setOrder((prev) =>
        prev
          ? { ...prev, payment: { ...(prev.payment || {}), status: 'PAID', paymentMethod: data?.paymentMethod || 'RIDER_QR' } }
          : prev
      );
    };

    socket.on('order_status_updated', handleStatusUpdate);
    socket.on('order_status_update', handleStatusUpdate);
    socket.on('payment_confirmed', handlePaymentConfirmed);
    return () => {
      socket.off('order_status_updated', handleStatusUpdate);
      socket.off('order_status_update', handleStatusUpdate);
      socket.off('payment_confirmed', handlePaymentConfirmed);
    };
  }, [socket, isOpen, order]);

  const handleSubmitRating = async () => {
    if (!ratingValue) return;
    setRatingSubmitting(true);
    try {
      await api.post(`/orders/${order.id}/rate`, { rating: ratingValue, feedback: ratingFeedback });
      setRatingDone(true);
      setShowRating(false);
      await fetchOrder();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to submit review');
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handleReorder = () => {
    if (!order) return;
    onReorder && onReorder({
      pickupAddress: order.pickupAddress,
      pickupLat: order.pickupLat,
      pickupLng: order.pickupLng,
      dropAddress: order.dropAddress,
      dropLat: order.dropLat,
      dropLng: order.dropLng,
      packageCategory: order.packageCategory,
      serviceType: order.serviceType,
      storeName: order.storeName,
      items: order.items,
      instructions: order.instructions,
    });
    onClose();
  };

  if (!isOpen) return null;

  const statusMeta = STATUS_META[order?.status] || { color: '#a855f7', label: order?.status || '' };
  const isDelivered = order?.status === 'DELIVERED';
  const isCancelled = order?.status === 'CANCELLED' || order?.status === 'FAILED';
  const isPaid = order?.payment?.status === 'PAID';

  const mapPositions = useMemo(() => {
    return order
      ? [
          { lat: order.pickupLat, lng: order.pickupLng },
          { lat: order.dropLat, lng: order.dropLng },
        ]
      : null;
  }, [order?.pickupLat, order?.pickupLng, order?.dropLat, order?.dropLng]);

  useEffect(() => {
    if (mapRef.current && isLoaded && activeTab === 'map' && mapPositions && window.google?.maps) {
      try {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(mapPositions[0]);
        bounds.extend(mapPositions[1]);
        mapRef.current.fitBounds(bounds, 50);
      } catch (e) {
        console.warn('Error setting map bounds', e);
      }
    }
  }, [isLoaded, activeTab, mapPositions]);

  // ── Pricing breakdown ──
  const basePrice = order?.basePrice ?? 39;
  const distancePrice = order?.distancePrice ?? 0;
  const totalAmount = order?.totalAmount ?? 0;
  const distanceKm = order?.distanceKm ?? 0;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 3000,
          background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
        }}
      />

      {/* Modal Sheet */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 3001,
          background: 'var(--card-bg, #1a1a2e)',
          borderRadius: '24px 24px 0 0',
          boxShadow: '0 -8px 60px rgba(0,0,0,0.6)',
          maxHeight: '92vh',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ── Handle bar ── */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--border-color)' }} />
        </div>

        {/* ── Header ── */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 20px 12px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-main)' }}>
              Order Details
            </div>
            {order && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginTop: 2 }}>
                {order.trackingId} &nbsp;•&nbsp;
                <span style={{ color: statusMeta.color }}>{statusMeta.label}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--input-bg)', border: '1px solid var(--border-color)',
              color: 'var(--text-muted)', borderRadius: 10, width: 36, height: 36,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14,
            }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* ── Tab bar ── */}
        <div
          style={{
            display: 'flex', gap: 0,
            padding: '0 16px',
            borderBottom: '1px solid var(--border-color)',
            overflowX: 'auto',
          }}
        >
          {[
            { key: 'timeline', icon: 'fa-timeline', label: 'Timeline' },
            { key: 'map',      icon: 'fa-map',      label: 'Route' },
            { key: 'details',  icon: 'fa-receipt',  label: 'Details' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: '11px 4px', background: 'transparent',
                border: 'none', borderBottom: activeTab === tab.key ? '2px solid #FF8A00' : '2px solid transparent',
                color: activeTab === tab.key ? '#FF8A00' : 'var(--text-muted)',
                fontSize: 11, fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                whiteSpace: 'nowrap', transition: 'color 0.2s',
              }}
            >
              <i className={`fa-solid ${tab.icon}`} style={{ fontSize: 12 }} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Scrollable Body ── */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 16px 24px' }}>

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 28, marginBottom: 12 }} />
              <div style={{ fontSize: 13, fontWeight: 600 }}>Loading order details…</div>
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 12, padding: '16px', textAlign: 'center', color: '#ef4444', fontSize: 13,
            }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 8 }} />
              {error}
            </div>
          )}

          {!loading && !error && order && (
            <>
              {/* ══════════ TIMELINE TAB ══════════ */}
              {activeTab === 'timeline' && (
                <div>
                  {/* Vertical progress steps */}
                  <div style={{ marginBottom: 20 }}>
                    {TIMELINE_STEPS.map((step, idx) => {
                      const state = getStepState(step.status, order.status);
                      const isDone = state === 'done';
                      const isCur  = state === 'current';
                      const color  = isDone ? '#22c55e' : isCur ? '#FF8A00' : 'var(--border-color)';
                      const textColor = isDone || isCur ? 'var(--text-main)' : 'var(--text-muted)';

                      // Find matching event
                      const matchingEvent = order.events?.find((e) =>
                        e.newStatus === step.status ||
                        (step.status === 'ACCEPTED' && (e.newStatus === 'RIDER_ASSIGNED' || e.newStatus === 'ACCEPTED'))
                      );

                      return (
                        <div key={step.status} style={{ display: 'flex', gap: 12, position: 'relative' }}>
                          {/* Icon column */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 36 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: '50%',
                              background: isDone || isCur ? color : 'var(--input-bg)',
                              border: `2px solid ${color}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: isCur ? `0 0 14px ${color}60` : 'none',
                              transition: 'all 0.3s',
                            }}>
                              {isDone
                                ? <i className="fa-solid fa-check" style={{ fontSize: 13, color: '#fff' }} />
                                : <i className={`fa-solid ${step.icon}`} style={{ fontSize: 13, color: isCur ? '#fff' : 'var(--text-muted)' }} />
                              }
                            </div>
                            {idx < TIMELINE_STEPS.length - 1 && (
                              <div style={{
                                width: 2, flex: 1, minHeight: 32,
                                background: isDone ? '#22c55e' : 'var(--border-color)',
                                margin: '4px 0',
                              }} />
                            )}
                          </div>

                          {/* Content column */}
                          <div style={{ paddingBottom: 20, flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: textColor }}>{step.label}</div>
                            {matchingEvent ? (
                              <>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                  {matchingEvent.description}
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                                  {fmt(matchingEvent.createdAt)}
                                </div>
                              </>
                            ) : (
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                {isCur ? 'In progress…' : isDone ? 'Completed' : 'Pending'}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* All events log */}
                  {order.events?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                        Full Activity Log
                      </div>
                      {[...order.events].reverse().map((ev) => (
                        <div
                          key={ev.id}
                          style={{
                            background: 'var(--input-bg)', border: '1px solid var(--border-color)',
                            borderRadius: 10, padding: '8px 12px', marginBottom: 6,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: STATUS_META[ev.newStatus]?.color || 'var(--text-main)' }}>
                              {STATUS_META[ev.newStatus]?.label || ev.newStatus}
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{fmt(ev.createdAt)}</span>
                          </div>
                          {ev.description && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ev.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Rider card */}
                  {order.rider && (
                    <div style={{
                      background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
                      borderRadius: 14, padding: '12px 14px', marginTop: 4,
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                        Your Rider
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 42, height: 42, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <i className="fa-solid fa-motorcycle" style={{ color: '#fff', fontSize: 16 }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)' }}>
                              {order.rider.firstName} {order.rider.lastName || ''}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                              {order.rider.vehicleType || 'Bike'} • {order.rider.vehicleNumber || ''}
                              {order.rider.rating ? ` • ★ ${order.rider.rating}` : ''}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {order.rider.phone && (
                            <a
                              href={`tel:${order.rider.phone}`}
                              style={{
                                background: '#22c55e', color: '#fff', borderRadius: 10,
                                padding: '8px 12px', textDecoration: 'none',
                                fontSize: 13, fontWeight: 800,
                                display: 'flex', alignItems: 'center', gap: 6,
                              }}
                            >
                              <i className="fa-solid fa-phone" />
                            </a>
                          )}
                          {!isDelivered && (
                            <button
                              onClick={() => setPaymentModalOpen(true)}
                              style={{
                                background: isPaid
                                  ? 'rgba(34,197,94,0.15)'
                                  : 'linear-gradient(135deg,#FF8800,#FF5500)',
                                border: isPaid ? '1px solid rgba(34,197,94,0.3)' : 'none',
                                color: isPaid ? '#22c55e' : '#fff',
                                borderRadius: 10, padding: '8px 12px',
                                fontSize: 12, fontWeight: 800, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 6,
                              }}
                            >
                              <i className={`fa-solid ${isPaid ? 'fa-circle-check' : 'fa-qrcode'}`} />
                              <span>{isPaid ? 'Paid' : 'Pay'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rating section */}
                  {isDelivered && (
                    <div style={{ marginTop: 16 }}>
                      {ratingDone || order.Review ? (
                        <div style={{
                          background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                          borderRadius: 12, padding: '12px 14px', textAlign: 'center',
                        }}>
                          <i className="fa-solid fa-star" style={{ color: '#FF8A00', fontSize: 18, marginBottom: 4 }} />
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#22c55e' }}>Review Submitted</div>
                          {order.Review && (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                              <StarRating value={order.Review.rating} readonly />
                              {order.Review.feedback && <div style={{ marginTop: 6 }}>"{order.Review.feedback}"</div>}
                            </div>
                          )}
                        </div>
                      ) : showRating ? (
                        <div style={{
                          background: 'var(--input-bg)', border: '1px solid var(--border-color)',
                          borderRadius: 14, padding: '16px',
                        }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)', marginBottom: 12, textAlign: 'center' }}>
                            Rate your delivery
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                            <StarRating value={ratingValue} onChange={setRatingValue} />
                          </div>
                          <textarea
                            value={ratingFeedback}
                            onChange={(e) => setRatingFeedback(e.target.value)}
                            placeholder="Leave a comment (optional)…"
                            style={{
                              width: '100%', boxSizing: 'border-box',
                              background: 'var(--card-bg)', border: '1px solid var(--border-color)',
                              borderRadius: 10, padding: '10px 12px', fontSize: 13,
                              color: 'var(--text-main)', resize: 'none', minHeight: 70,
                              fontFamily: 'inherit', marginBottom: 12,
                            }}
                          />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => setShowRating(false)}
                              style={{
                                flex: 1, padding: '10px', borderRadius: 10,
                                background: 'var(--card-bg)', border: '1px solid var(--border-color)',
                                color: 'var(--text-muted)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                              }}
                            >Cancel</button>
                            <button
                              onClick={handleSubmitRating}
                              disabled={!ratingValue || ratingSubmitting}
                              style={{
                                flex: 2, padding: '10px', borderRadius: 10,
                                background: ratingValue ? 'linear-gradient(135deg,#FF8800,#FF5500)' : 'var(--border-color)',
                                border: 'none', color: '#fff', fontSize: 13, fontWeight: 800,
                                cursor: ratingValue ? 'pointer' : 'not-allowed',
                                opacity: ratingSubmitting ? 0.7 : 1,
                              }}
                            >
                              {ratingSubmitting ? 'Submitting…' : 'Submit Rating'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowRating(true)}
                          style={{
                            width: '100%', padding: '12px',
                            background: 'linear-gradient(135deg, #FF8800 0%, #FF5500 100%)',
                            border: 'none', borderRadius: 12, color: '#fff',
                            fontSize: 14, fontWeight: 800, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            boxShadow: '0 4px 20px rgba(255,136,0,0.3)',
                          }}
                        >
                          <i className="fa-solid fa-star" />
                          Rate Your Delivery
                        </button>
                      )}
                    </div>
                  )}

                  {/* Re-order button */}
                  {(isDelivered || isCancelled) && onReorder && (
                    <button
                      onClick={handleReorder}
                      style={{
                        width: '100%', padding: '12px', marginTop: 12,
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 12, color: 'var(--text-main)',
                        fontSize: 13, fontWeight: 800, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}
                    >
                      <i className="fa-solid fa-rotate-right" />
                      Re-order
                    </button>
                  )}
                </div>
              )}

              {/* ══════════ MAP TAB ══════════ */}
              {activeTab === 'map' && (
                <div>
                  {/* Location cards */}
                  <div style={{
                    background: 'var(--input-bg)', border: '1px solid var(--border-color)',
                    borderRadius: 12, padding: '12px 14px', marginBottom: 12,
                  }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                      <i className="fa-solid fa-circle-dot" style={{ color: '#22c55e', fontSize: 14, marginTop: 2 }} />
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pickup</div>
                        {order.storeName && (
                          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)' }}>{order.storeName}</div>
                        )}
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{order.pickupAddress}</div>
                      </div>
                    </div>
                    <div style={{ width: 2, height: 16, background: 'var(--border-color)', marginLeft: 6, marginBottom: 10 }} />
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <i className="fa-solid fa-location-dot" style={{ color: '#FF8A00', fontSize: 14, marginTop: 2 }} />
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dropoff</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{order.dropAddress}</div>
                      </div>
                    </div>
                  </div>

                  {/* Google Map */}
                  <div style={{ borderRadius: 14, overflow: 'hidden', height: 280, border: '1px solid var(--border-color)', background: '#222' }}>
                    {isLoaded && order.pickupLat && order.dropLat ? (
                      <GoogleMap
                        mapContainerStyle={{ height: '100%', width: '100%' }}
                        center={{ lat: order.pickupLat, lng: order.pickupLng }}
                        zoom={13}
                        options={{ disableDefaultUI: true, zoomControl: true }}
                        onLoad={(map) => { mapRef.current = map; }}
                      >
                        <Marker
                          position={{ lat: order.pickupLat, lng: order.pickupLng }}
                          title={`Pickup: ${order.storeName || order.pickupAddress}`}
                          icon={'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg width="26" height="26" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg"><circle cx="13" cy="13" r="13" fill="#22c55e"/><circle cx="13" cy="13" r="4" fill="#ffffff"/></svg>')}
                        />
                        <Marker
                          position={{ lat: order.dropLat, lng: order.dropLng }}
                          title={`Drop: ${order.dropAddress}`}
                          icon={'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg width="26" height="26" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg"><circle cx="13" cy="13" r="13" fill="#ef4444"/><circle cx="13" cy="13" r="4" fill="#ffffff"/></svg>')}
                        />
                        <Polyline
                          path={mapPositions}
                          options={{
                            strokeColor: '#FF8A00',
                            strokeWeight: 4,
                            strokeOpacity: 0.85
                          }}
                        />
                      </GoogleMap>
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 24 }}></i>
                      </div>
                    )}
                  </div>

                  <div style={{
                    display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap',
                  }}>
                    <div style={{
                      flex: 1, background: 'var(--input-bg)', border: '1px solid var(--border-color)',
                      borderRadius: 10, padding: '10px 12px', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#FF8A00' }}>
                        {distanceKm.toFixed(1)} km
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Distance</div>
                    </div>
                    <div style={{
                      flex: 1, background: 'var(--input-bg)', border: '1px solid var(--border-color)',
                      borderRadius: 10, padding: '10px 12px', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#3b82f6' }}>
                        ~{order.estimatedTimeMins || '?'} min
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Est. Time</div>
                    </div>
                    <div style={{
                      flex: 1, background: 'var(--input-bg)', border: '1px solid var(--border-color)',
                      borderRadius: 10, padding: '10px 12px', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#22c55e' }}>
                        ₹{totalAmount}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Total Fare</div>
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════ DETAILS TAB ══════════ */}
              {activeTab === 'details' && (
                <div>
                  {/* Package Info */}
                  <Section title="Package Info" icon="fa-box">
                    <Row label="Type" value={order.packageCategory || order.serviceType || 'Standard'} />
                    {order.storeName && <Row label="Store" value={order.storeName} />}
                    {order.instructions && <Row label="Instructions" value={order.instructions} />}

                    {Array.isArray(order.items) && order.items.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                          Items
                        </div>
                        {order.items.map((item, i) => (
                          <div
                            key={i}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0',
                              borderBottom: i < order.items.length - 1 ? '1px solid var(--border-color)' : 'none',
                            }}
                          >
                            <i className="fa-solid fa-circle-check" style={{ color: '#22c55e', fontSize: 10 }} />
                            <span style={{ fontSize: 13, color: 'var(--text-main)' }}>
                              {typeof item === 'object' && item !== null
                                ? `${item.name || item.item || JSON.stringify(item)}${item.qty ? ` × ${item.qty}` : ''}`
                                : item}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Section>

                  {/* Pricing Breakdown */}
                  <Section title="Fare Breakdown" icon="fa-calculator">
                    <div style={{ padding: '2px 0' }}>
                      <PricingRow label="Base fare (first 3 km)" value={`₹${basePrice}`} />
                      <PricingRow
                        label={`Distance charge (${Math.max(0, distanceKm - 3).toFixed(1)} km × ₹10)`}
                        value={`₹${distancePrice}`}
                      />
                      <div style={{ borderTop: '1px solid var(--border-color)', margin: '10px 0' }} />
                      <PricingRow label="Total" value={`₹${totalAmount}`} highlight />
                    </div>
                  </Section>

                  {/* Payment Status */}
                  <Section title="Payment" icon="fa-credit-card">
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 0',
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>
                          {isPaid ? 'Payment Received' : 'Payment Pending'}
                        </div>
                        {order.payment?.paymentMethod && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            Via {order.payment.paymentMethod.replace(/_/g, ' ')}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          background: isPaid ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)',
                          color: isPaid ? '#22c55e' : '#ef4444',
                          border: `1px solid ${isPaid ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                          borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 800,
                        }}>
                          {isPaid ? '● PAID' : '● PENDING'}
                        </span>
                        {!isPaid && order.rider && (
                          <button
                            onClick={() => setPaymentModalOpen(true)}
                            style={{
                              background: 'linear-gradient(135deg,#FF8800,#FF5500)',
                              border: 'none', color: '#fff', borderRadius: 10,
                              padding: '6px 12px', fontSize: 11, fontWeight: 800,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                            }}
                          >
                            <i className="fa-solid fa-qrcode" />
                            Pay
                          </button>
                        )}
                      </div>
                    </div>
                    {order.payment?.updatedAt && isPaid && (
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                        Paid on {fmt(order.payment.updatedAt)}
                      </div>
                    )}
                  </Section>

                  {/* Order Meta */}
                  <Section title="Order Info" icon="fa-info-circle">
                    <Row label="Order ID" value={order.trackingId} mono />
                    <Row label="Placed At" value={fmt(order.createdAt)} />
                    <Row label="Status" value={statusMeta.label} colored={statusMeta.color} />
                  </Section>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Rider Payment Modal */}
      {order && (
        <RiderPaymentModal
          isOpen={paymentModalOpen}
          order={{ ...order, rawId: order.id, price: order.totalAmount }}
          onClose={() => {
            setPaymentModalOpen(false);
            fetchOrder();
          }}
        />
      )}
    </>
  );
}

// ── Small layout helpers ──────────────────────────────────────────────────────
function Section({ title, icon, children }) {
  return (
    <div style={{
      background: 'var(--input-bg)', border: '1px solid var(--border-color)',
      borderRadius: 14, padding: '14px', marginBottom: 12,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 800, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <i className={`fa-solid ${icon}`} style={{ color: '#FF8A00' }} />
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, mono = false, colored }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      <span style={{
        fontSize: 12, fontWeight: 700, color: colored || 'var(--text-main)',
        fontFamily: mono ? 'monospace' : 'inherit', textAlign: 'right', maxWidth: '60%',
      }}>
        {value}
      </span>
    </div>
  );
}

function PricingRow({ label, value, highlight = false }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
      <span style={{
        fontSize: highlight ? 14 : 12,
        color: highlight ? 'var(--text-main)' : 'var(--text-muted)',
        fontWeight: highlight ? 800 : 600,
      }}>
        {label}
      </span>
      <span style={{
        fontSize: highlight ? 16 : 13,
        color: highlight ? '#FF8A00' : 'var(--text-main)',
        fontWeight: highlight ? 900 : 700,
      }}>
        {value}
      </span>
    </div>
  );
}
