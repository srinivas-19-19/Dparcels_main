import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { 
  X, 
  Clock, 
  User, 
  Settings, 
  Navigation, 
  CornerUpRight, 
  Volume2, 
  CheckCircle2, 
  MapPin, 
  Package, 
  Check, 
  Phone,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

const TripAcceptedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { themeColors } = useTheme();
  const { socket } = useAuth();

  const [activeOrder, setActiveOrder] = useState(location.state?.order || null);
  const [orderStatus, setOrderStatus] = useState(location.state?.order?.status || 'ACCEPTED');
  const [loading, setLoading] = useState(!location.state?.order);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showGPSModal, setShowGPSModal] = useState(false);

  const watchIdRef = useRef(null);

  // 1. Fetch active order on mount if not in location state
  useEffect(() => {
    fetchActiveOrder();
  }, []);

  const fetchActiveOrder = async () => {
    try {
      const res = await api.get('/rider/orders');
      const orders = res.data?.data || [];
      const current = orders.find((o) =>
        ['ACCEPTED', 'RIDER_ASSIGNED', 'ARRIVED_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(o.status)
      );
      if (current) {
        setActiveOrder(current);
        setOrderStatus(current.status);
      }
    } catch (err) {
      console.error('Failed to fetch active order:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Realtime socket status updates
  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (data) => {
      if (data?.orderId && activeOrder?.id && data.orderId === activeOrder.id) {
        setOrderStatus(data.status);
      }
    };

    socket.on('order_status_updated', handleStatusUpdate);
    socket.on('order_status_update', handleStatusUpdate);

    return () => {
      socket.off('order_status_updated', handleStatusUpdate);
      socket.off('order_status_update', handleStatusUpdate);
    };
  }, [socket, activeOrder?.id]);

  // 3. Geolocation watchPosition tracker (stops when DELIVERED)
  useEffect(() => {
    if (orderStatus === 'DELIVERED') {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          if (socket && activeOrder?.id) {
            socket.emit('update_location', {
              orderId: activeOrder.id,
              lat: latitude,
              lng: longitude
            });
          }
        },
        (err) => console.warn('[Geolocation watchPosition]:', err?.message || err),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    }

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [orderStatus, activeOrder?.id, socket]);

  // 4. Determine Dynamic Button text and next status based on state machine
  const getButtonConfig = () => {
    switch (orderStatus) {
      case 'ACCEPTED':
      case 'RIDER_ASSIGNED':
        return {
          label: 'Arrived at Pickup',
          nextStatus: 'ARRIVED_PICKUP',
          bgColor: '#FF8A00',
          textColor: '#000000',
          stageTitle: 'Heading to Pickup',
          stageSubtitle: 'Navigate to merchant hub'
        };
      case 'ARRIVED_PICKUP':
        return {
          label: 'Confirm Pickup',
          nextStatus: 'PICKED_UP',
          bgColor: '#FF8A00',
          textColor: '#000000',
          stageTitle: 'At Pickup Location',
          stageSubtitle: 'Verify package & confirm pickup'
        };
      case 'PICKED_UP':
      case 'IN_TRANSIT':
      case 'OUT_FOR_DELIVERY':
        return {
          label: 'Swipe to Complete Delivery',
          nextStatus: 'DELIVERED',
          bgColor: '#10B981',
          textColor: '#FFFFFF',
          stageTitle: 'Delivering to Customer',
          stageSubtitle: 'Head towards destination'
        };
      case 'DELIVERED':
        return {
          label: 'Delivery Completed ✓',
          nextStatus: null,
          bgColor: '#10B981',
          textColor: '#FFFFFF',
          stageTitle: 'Order Delivered',
          stageSubtitle: 'Great job!'
        };
      default:
        return {
          label: 'Arrived at Pickup',
          nextStatus: 'ARRIVED_PICKUP',
          bgColor: '#FF8A00',
          textColor: '#000000',
          stageTitle: 'Active Trip',
          stageSubtitle: 'En route'
        };
    }
  };

  const currentConfig = getButtonConfig();

  // 5. Advance Status API Call
  const handleAdvanceStatus = async () => {
    if (!activeOrder?.id || isSubmitting) return;

    const nextStatus = currentConfig.nextStatus;
    if (!nextStatus) return;

    try {
      setIsSubmitting(true);
      await api.post(`/orders/${activeOrder.id}/status`, { status: nextStatus });
      setOrderStatus(nextStatus);

      if (nextStatus === 'DELIVERED') {
        // Stop tracker
        if (watchIdRef.current !== null && navigator.geolocation) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }

        // Celebrate with confetti
        try {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FF8A00', '#10B981', '#FFFFFF']
          });
        } catch (e) {}

        // Redirect to HomePage available orders feed
        setTimeout(() => {
          navigate('/home');
        }, 1600);
      }
    } catch (error) {
      console.error('Failed to advance order status:', error);
      alert(error.response?.data?.message || 'Failed to update order status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayId = activeOrder?.trackingId || (activeOrder?.id ? `#${activeOrder.id.substring(0, 6).toUpperCase()}` : 'Order');
  const pickupAddress = activeOrder?.pickupAddress || activeOrder?.pickupLocation || 'Pickup Location';
  const dropAddress = activeOrder?.dropAddress || activeOrder?.dropLocation || 'Delivery Location';
  const distance = activeOrder?.distanceKm ? `${activeOrder.distanceKm} km` : 'Calculating...';
  const eta = activeOrder?.estimatedTimeMins ? `${activeOrder.estimatedTimeMins} min` : 'Pending';
  const customerName = activeOrder?.customer?.firstName ? `${activeOrder.customer.firstName} ${activeOrder.customer.lastName || ''}`.trim() : (activeOrder?.customerName || 'Customer');
  const customerPhone = activeOrder?.customer?.phone || '';

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: themeColors.bg,
      color: themeColors.text,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0',
      position: 'relative',
      fontFamily: 'var(--font-main)'
    }}>
      {/* Phone Screen Frame Container */}
      <div className="responsive-phone-frame" style={{
        backgroundColor: '#070707',
        border: '1px solid #2A2A2A'
      }}>

        {/* Top Header Stage Banner */}
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          backgroundColor: '#000000',
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 25,
          borderBottom: '1px solid #1A1A1A'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: currentConfig.bgColor,
              boxShadow: `0 0 8px ${currentConfig.bgColor}`
            }} />
            <span style={{ fontSize: '11px', fontWeight: '800', color: currentConfig.bgColor }}>
              {currentConfig.stageTitle.toUpperCase()}
            </span>
          </div>
          <span style={{ fontSize: '10px', color: '#888888', fontWeight: '700' }}>
            {displayId}
          </span>
        </div>

        {/* Header Bar: Online Status */}
        <div style={{
          position: 'absolute',
          top: '36px',
          right: '16px',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          pointerEvents: 'none'
        }}>
          <button
            onClick={() => setIsOnline(!isOnline)}
            style={{
              pointerEvents: 'auto',
              backgroundColor: '#111111',
              border: '1px solid #2A2A2A',
              borderRadius: '24px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
              cursor: 'pointer'
            }}
          >
            <span style={{
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              backgroundColor: isOnline ? '#10B981' : '#EF4444',
              boxShadow: isOnline ? '0 0 10px #10B981' : 'none'
            }} />
            <span style={{
              fontSize: '11px',
              fontWeight: '800',
              color: isOnline ? '#10B981' : '#EF4444',
              letterSpacing: '0.05em'
            }}>
              {isOnline ? t('online') : t('offline')}
            </span>
          </button>
        </div>

        {/* Map View Canvas with Route Line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#070707',
          overflow: 'hidden'
        }}>
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.95 }}>
            <defs>
              <pattern id="grid-trip" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#1D2636" strokeWidth="1.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="#070707" />
            <rect width="100%" height="100%" fill="url(#grid-trip)" />

            <path d="M -50 120 Q 200 80 450 220" fill="none" stroke="#253147" strokeWidth="14" />
            <path d="M -20 340 L 450 180" fill="none" stroke="#2D3A54" strokeWidth="10" />
            <path d="M 180 -50 L 220 600" fill="none" stroke="#253147" strokeWidth="16" />

            {/* Active GPS Route line */}
            <path 
              d="M 215 360 L 255 240 L 270 170" 
              fill="none" 
              stroke={currentConfig.bgColor} 
              strokeWidth="6" 
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 8px ${currentConfig.bgColor})` }}
            />

            <g transform="translate(270, 165)">
              <circle cx="0" cy="0" r="14" fill="rgba(255, 138, 0, 0.25)" />
              <circle cx="0" cy="0" r="6" fill="#FF8A00" stroke="#FFFFFF" strokeWidth="2" />
            </g>

            <g transform="translate(215, 360)">
              <path d="M 0 0 L -8 -16 A 10 10 0 1 1 8 -16 Z" fill="#10B981" />
              <circle cx="0" cy="-14" r="4" fill="#000000" />
            </g>
          </svg>
        </div>

        {/* Bottom Sheet Card */}
        <div style={{
          position: 'absolute',
          bottom: '72px',
          left: '12px',
          right: '12px',
          zIndex: 15
        }}>
          <div style={{
            backgroundColor: '#111111',
            border: '1px solid #2A2A2A',
            borderRadius: '22px',
            padding: '18px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.85)',
            animation: 'fadeIn 0.3s ease'
          }}>
            {/* Header: Title & Close */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div>
                <h3 style={{
                  fontSize: '17px',
                  fontWeight: '900',
                  color: '#FFFFFF',
                  margin: 0
                }}>
                  Delivery {displayId}
                </h3>
                <div style={{ fontSize: '11px', color: '#888888', marginTop: '2px', fontWeight: '600' }}>
                  {currentConfig.stageSubtitle}
                </div>
              </div>

              <div style={{
                backgroundColor: 'rgba(255, 138, 0, 0.15)',
                color: '#FF8A00',
                fontSize: '11px',
                fontWeight: '900',
                padding: '4px 10px',
                borderRadius: '12px'
              }}>
                ● {orderStatus}
              </div>
            </div>

            {/* Customer & Call details */}
            <div style={{
              background: '#161616',
              borderRadius: '14px',
              padding: '10px 12px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: '1px solid #222222'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#262626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF'
                }}>
                  <User size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#FFFFFF' }}>
                    {customerName}
                  </div>
                  <div style={{ fontSize: '10px', color: '#888888' }}>
                    Customer
                  </div>
                </div>
              </div>

              <a
                href={`tel:${customerPhone}`}
                style={{
                  backgroundColor: '#22c55e',
                  color: '#FFFFFF',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  boxShadow: '0 4px 10px rgba(34, 197, 94, 0.3)'
                }}
              >
                <Phone size={14} />
              </a>
            </div>

            {/* Address Details based on status */}
            <div style={{
              marginBottom: '14px',
              background: '#161616',
              borderRadius: '14px',
              padding: '10px 12px',
              border: '1px solid #222222'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#888888', textTransform: 'uppercase' }}>
                  {orderStatus === 'PICKED_UP' || orderStatus === 'IN_TRANSIT' ? 'Dropoff Destination' : 'Pickup Point'}
                </div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#FFFFFF', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {orderStatus === 'PICKED_UP' || orderStatus === 'IN_TRANSIT' ? dropAddress : pickupAddress}
                </div>
              </div>

              <div style={{
                fontSize: '11px',
                fontWeight: '700',
                color: '#888888',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>{distance}</span>
                <span style={{ color: '#FF8A00' }}>•</span>
                <span>{eta}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {/* Dynamic Call To Action Button */}
              <button
                onClick={handleAdvanceStatus}
                disabled={isSubmitting || orderStatus === 'DELIVERED'}
                style={{
                  width: '100%',
                  height: '50px',
                  backgroundColor: currentConfig.bgColor,
                  border: 'none',
                  borderRadius: '14px',
                  color: currentConfig.textColor,
                  fontSize: '15px',
                  fontWeight: '900',
                  cursor: isSubmitting || orderStatus === 'DELIVERED' ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: `0 6px 20px ${currentConfig.bgColor}40`,
                  transition: 'all 0.2s ease',
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                {isSubmitting ? (
                  <span>Updating...</span>
                ) : (
                  <>
                    {orderStatus === 'ACCEPTED' || orderStatus === 'RIDER_ASSIGNED' ? (
                      <MapPin size={18} />
                    ) : orderStatus === 'ARRIVED_PICKUP' ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <Check size={18} />
                    )}
                    <span>{currentConfig.label}</span>
                  </>
                )}
              </button>

              {/* Secondary Navigation Button */}
              <button
                onClick={() => setShowGPSModal(true)}
                style={{
                  width: '100%',
                  height: '42px',
                  backgroundColor: '#1C1C1C',
                  border: '1px solid #2A2A2A',
                  borderRadius: '14px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Navigation size={15} />
                <span>Turn-by-Turn GPS</span>
              </button>
            </div>
          </div>
        </div>

        {/* LIVE GPS NAVIGATION MODAL */}
        {showGPSModal && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(7,7,7,0.95)',
            backdropFilter: 'blur(8px)',
            zIndex: 40,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '24px 16px'
          }}>
            <div style={{
              backgroundColor: '#10B981',
              borderRadius: '20px',
              padding: '20px',
              color: '#FFFFFF',
              boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <CornerUpRight size={38} strokeWidth={3} />
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '900' }}>In 200m</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>
                    Turn right onto Main Hub Road
                  </div>
                </div>
              </div>
              <Volume2 size={24} />
            </div>

            <div style={{
              backgroundColor: '#111111',
              border: '1px solid #2A2A2A',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '11px', color: '#A0A0A0', fontWeight: '700', textTransform: 'uppercase' }}>
                {orderStatus === 'PICKED_UP' || orderStatus === 'IN_TRANSIT' ? 'Dropoff Destination' : 'Pickup Destination'}
              </div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#FFFFFF', marginTop: '4px' }}>
                {orderStatus === 'PICKED_UP' || orderStatus === 'IN_TRANSIT' ? dropAddress : pickupAddress}
              </div>
              <div style={{ fontSize: '12px', color: '#FF8A00', fontWeight: '700', marginTop: '4px' }}>
                {distance} • {eta} ETA
              </div>
            </div>

            <button
              onClick={() => setShowGPSModal(false)}
              style={{
                width: '100%',
                height: '50px',
                backgroundColor: '#EF4444',
                border: 'none',
                borderRadius: '14px',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              Exit Navigation
            </button>
          </div>
        )}

        {/* Bottom Navigation Bar */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '64px',
          backgroundColor: '#070707',
          borderTop: '1px solid #2A2A2A',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          zIndex: 30
        }}>
          <button
            onClick={() => navigate('/home')}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer',
              color: '#FF8A00'
            }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2px',
              width: '18px',
              height: '18px'
            }}>
              <div style={{ backgroundColor: '#FF8A00', borderRadius: '2px' }} />
              <div style={{ backgroundColor: '#FF8A00', borderRadius: '2px' }} />
              <div style={{ backgroundColor: '#FF8A00', borderRadius: '2px' }} />
              <div style={{ backgroundColor: '#FF8A00', borderRadius: '2px' }} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: '700' }}>{t('home')}</span>
          </button>

          <button
            onClick={() => navigate('/history')}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer',
              color: '#A0A0A0'
            }}
          >
            <Clock size={18} />
            <span style={{ fontSize: '11px', fontWeight: '700' }}>{t('history')}</span>
          </button>

          <button
            onClick={() => navigate('/settings')}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer',
              color: '#A0A0A0'
            }}
          >
            <Settings size={18} />
            <span style={{ fontSize: '11px', fontWeight: '700' }}>{t('settings')}</span>
          </button>

          <button
            onClick={() => navigate('/profile')}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer',
              color: '#A0A0A0'
            }}
          >
            <User size={18} />
            <span style={{ fontSize: '11px', fontWeight: '700' }}>{t('profile')}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default TripAcceptedPage;
