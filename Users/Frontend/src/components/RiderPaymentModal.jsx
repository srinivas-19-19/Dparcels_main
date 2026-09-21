import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export const RiderPaymentModal = ({ isOpen, onClose, order }) => {
  const { socket } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  // Sync initial state from order prop
  useEffect(() => {
    if (order) {
      const alreadyPaid = order.payment?.status === 'PAID' || order.paymentStatus === 'PAID';
      setIsPaid(alreadyPaid);
    }
  }, [order]);

  // Fetch detailed payment QR information whenever modal opens
  useEffect(() => {
    if (!isOpen || !order) return;

    const orderIdentifier = order.rawId || order.id;
    if (!orderIdentifier) return;

    setLoading(true);
    api.get(`/payments/order/${orderIdentifier}/qr`)
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          setPaymentData(res.data.data);
          if (res.data.data.payment?.status === 'PAID') {
            setIsPaid(true);
          }
        }
      })
      .catch((err) => {
        console.warn('[RiderPaymentModal] Failed to fetch payment QR:', err?.response?.data || err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, order]);

  // Listen for real-time payment confirmation via Socket.IO
  useEffect(() => {
    if (!socket || !isOpen) return;

    const handlePaymentConfirmed = (data) => {
      const currentOrderId = order?.rawId || order?.id;
      const currentTrackingId = order?.id;

      if (
        data?.orderId === currentOrderId ||
        data?.trackingId === currentTrackingId ||
        data?.orderId === paymentData?.orderId
      ) {
        setIsPaid(true);
        // Refresh background dashboards and order lists
        window.dispatchEvent(new CustomEvent('dparcels:refreshDashboard'));
        window.dispatchEvent(new CustomEvent('dparcels:paymentConfirmed', { detail: data }));
      }
    };

    socket.on('payment_confirmed', handlePaymentConfirmed);
    return () => {
      socket.off('payment_confirmed', handlePaymentConfirmed);
    };
  }, [socket, isOpen, order, paymentData]);

  if (!isOpen || !order) return null;

  const totalAmount = paymentData?.totalAmount ?? order.price ?? 49;
  const trackingId = paymentData?.trackingId || order.id || 'ORDER';
  const rider = paymentData?.rider || order.rider || {};
  const upiId = rider.upiId;
  const qrUrl = paymentData?.rider?.effectiveQrUrl || rider.paymentQrUrl;

  const handleCopyUpi = () => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId).then(() => {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2200);
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'fadeIn 0.25s ease'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--bg-modal, #0f172a)',
          border: '1px solid var(--border-color, rgba(255, 136, 0, 0.3))',
          borderRadius: 24,
          width: '100%',
          maxWidth: 440,
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.7), 0 0 32px rgba(255, 136, 0, 0.15)',
          color: 'var(--text-main, #f8fafc)',
          position: 'relative',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #FF8800 0%, #FF5500 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: 18,
                boxShadow: '0 4px 12px rgba(255, 136, 0, 0.35)'
              }}
            >
              <i className="fa-solid fa-qrcode"></i>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em' }}>
                Payment to Rider
              </h3>
              <span style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)', fontWeight: 500 }}>
                Direct UPI QR / Cash Handover
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: 'var(--text-muted, #94a3b8)',
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 14,
              transition: 'background 0.2s'
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Amount & Live Status Card */}
        <div
          style={{
            background: isPaid
              ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(255, 136, 0, 0.15) 0%, rgba(255, 85, 0, 0.06) 100%)',
            border: isPaid
              ? '1px solid rgba(34, 197, 94, 0.4)'
              : '1px solid rgba(255, 136, 0, 0.35)',
            borderRadius: 16,
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div>
            <span style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Amount Due
            </span>
            <div style={{ fontSize: 28, fontWeight: 900, color: isPaid ? '#22c55e' : '#FF8800', lineHeight: 1.15, marginTop: 2 }}>
              ₹{totalAmount}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted, #94a3b8)', marginTop: 4, fontWeight: 500 }}>
              Order #{trackingId} • Base ₹39 + ₹10/km
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 800,
                background: isPaid ? '#22c55e' : 'rgba(255, 136, 0, 0.2)',
                color: isPaid ? '#ffffff' : '#FF8800',
                border: isPaid ? 'none' : '1px solid rgba(255, 136, 0, 0.4)',
                boxShadow: isPaid ? '0 4px 12px rgba(34, 197, 94, 0.35)' : 'none'
              }}
            >
              {isPaid ? (
                <>
                  <i className="fa-solid fa-check"></i>
                  <span>Payment Verified</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-clock-rotate-left"></i>
                  <span>Awaiting Rider Verification</span>
                </>
              )}
            </span>
            <div style={{ fontSize: 10, color: 'var(--text-muted, #94a3b8)', marginTop: 6 }}>
              {isPaid ? 'Rider confirmed receipt' : 'Manual verification by rider'}
            </div>
          </div>
        </div>

        {/* Rider Identification Pill */}
        {rider?.name || rider?.firstName ? (
          <div
            style={{
              background: 'var(--input-bg, #121d2f)',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
              borderRadius: 14,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  color: '#22c55e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14
                }}
              >
                <i className="fa-solid fa-motorcycle"></i>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main, #f8fafc)' }}>
                  {rider.name || `${rider.firstName} ${rider.lastName || ''}`}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted, #cbd5e1)', fontWeight: 600 }}>
                  {rider.vehicleType || 'Bike'} • {rider.vehicleNumber || 'Assigned Rider'}
                  {rider.rating ? ` • ★ ${rider.rating}` : ''}
                </div>
              </div>
            </div>

            {rider.phone && (
              <a
                href={`tel:${rider.phone}`}
                style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  color: '#22c55e',
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
        ) : null}

        {/* QR Code Container */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 20,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>
              <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 28, color: '#FF8800' }}></i>
              <div style={{ marginTop: 12, fontSize: 12, fontWeight: 600 }}>Loading Rider QR Code...</div>
            </div>
          ) : qrUrl ? (
            <>
              <div
                style={{
                  position: 'relative',
                  width: 220,
                  height: 220,
                  borderRadius: 12,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f8fafc',
                  border: '2px dashed #cbd5e1'
                }}
              >
                <img
                  src={qrUrl}
                  alt="Rider Payment QR"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    padding: 6
                  }}
                  onError={(e) => {
                    // If image load fails, generate dynamic QR
                    if (upiId) {
                      e.currentTarget.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=${upiId}&am=${totalAmount}&cu=INR`)}`;
                    }
                  }}
                />
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: '#1e293b', fontWeight: 700, textAlign: 'center' }}>
                Scan with any UPI App (GPay / PhonePe / Paytm)
              </div>
            </>
          ) : upiId ? (
            <>
              <div
                style={{
                  width: 220,
                  height: 220,
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: '#f8fafc',
                  border: '2px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(`upi://pay?pa=${upiId}&am=${totalAmount}&cu=INR`)}`}
                  alt="Generated UPI QR"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }}
                />
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: '#1e293b', fontWeight: 700, textAlign: 'center' }}>
                Scan with Google Pay, PhonePe, or Paytm
              </div>
            </>
          ) : (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: '#1e293b' }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: '#fef3c7',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto',
                  fontSize: 26
                }}
              >
                <i className="fa-solid fa-money-bill-wave"></i>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                Pay Cash Directly or Scan Physical QR
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, maxWidth: 260, margin: '4px auto 0 auto' }}>
                The delivery partner will present their personal QR code scanner or accept cash directly upon arrival.
              </div>
            </div>
          )}
        </div>

        {/* Copyable UPI ID Strip */}
        {upiId && (
          <div
            style={{
              background: 'var(--input-bg, #121d2f)',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
              borderRadius: 12,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12
            }}
          >
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted, #cbd5e1)', fontWeight: 700, textTransform: 'uppercase' }}>
                Rider UPI ID
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#FF8800', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {upiId}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyUpi}
              style={{
                background: copiedUpi ? '#22c55e' : 'rgba(255, 136, 0, 0.15)',
                border: copiedUpi ? 'none' : '1px solid rgba(255, 136, 0, 0.4)',
                color: copiedUpi ? '#ffffff' : '#FF8800',
                borderRadius: 10,
                padding: '6px 12px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {copiedUpi ? (
                <>
                  <i className="fa-solid fa-check"></i>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-copy"></i>
                  <span>Copy UPI</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Payment Instructions Note */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
            borderRadius: 12,
            padding: '10px 14px',
            fontSize: 11,
            color: 'var(--text-muted, #94a3b8)',
            lineHeight: 1.45
          }}
        >
          <div style={{ fontWeight: 700, color: 'var(--text-main, #ffffff)', marginBottom: 2 }}>
            💡 Manual Payment Guidelines:
          </div>
          1. Scan QR or transfer exact <strong>₹{totalAmount}</strong> to rider's UPI ID.<br />
          2. Cash handover directly to rider is always accepted.<br />
          3. Rider will verify and confirm receipt on their device.
        </div>

        {/* Bottom Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              background: isPaid ? '#22c55e' : 'linear-gradient(135deg, #FF8800 0%, #FF5500 100%)',
              border: 'none',
              borderRadius: 14,
              color: '#ffffff',
              padding: '13px 18px',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: isPaid
                ? '0 6px 18px rgba(34, 197, 94, 0.35)'
                : '0 6px 18px rgba(255, 136, 0, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s'
            }}
          >
            {isPaid ? (
              <>
                <i className="fa-solid fa-circle-check"></i>
                <span>Payment Completed</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-hand-holding-dollar"></i>
                <span>I Have Paid / Handed Cash</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiderPaymentModal;
