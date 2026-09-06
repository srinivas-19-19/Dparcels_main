import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Bell, 
  MapPin, 
  Package, 
  Star, 
  Phone, 
  AlertTriangle, 
  Gift, 
  Fuel, 
  X,
  Truck,
  Navigation,
  Flame,
  User,
  Copy,
  Check,
  Share2,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import RealMap from '../components/RealMap';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const HomePage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isLight, themeColors } = useTheme();
  const { socket } = useAuth();

  // State Management
  const [isOnline, setIsOnline] = useState(true);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [showReferModal, setShowReferModal] = useState(false);
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Rider & Location Data
  const [riderPos, setRiderPos] = useState([15.6322, 77.2728]);
  const pickupPos = [15.6350, 77.2750]; // DParcels Hub, Adoni
  const dropPos = [15.6260, 77.2710];   // Railway Station, Adoni

  const [routePoints, setRoutePoints] = useState([
    [15.6350, 77.2750],
    [15.6340, 77.2740],
    [15.6322, 77.2728],
    [15.6290, 77.2720],
    [15.6260, 77.2710]
  ]);

  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);

  useEffect(() => {
    fetchOrders();

    if (socket) {
      socket.on('new_order_available', () => {
        fetchOrders();
      });
      socket.on('order_status_update', () => {
        fetchOrders();
      });
      return () => {
        socket.off('new_order_available');
        socket.off('order_status_update');
      }
    }
  }, [socket]);

  const fetchOrders = async () => {
    try {
      const [availableRes, historyRes] = await Promise.all([
        api.get('/orders/available'),
        api.get('/orders')
      ]);
      setAvailableOrders(availableRes.data.data);
      setActiveOrders(historyRes.data.data.filter(o => 
        ['RIDER_ASSIGNED', 'IN_TRANSIT', 'ARRIVED'].includes(o.status)
      ));
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      await api.post(`/orders/${orderId}/accept`);
      navigate('/trip-accepted');
    } catch (error) {
      alert('Failed to accept order');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText('DPARCSREENU100');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      fontFamily: 'var(--font-main, "Plus Jakarta Sans", sans-serif)',
      transition: 'all 0.3s ease',
      userSelect: 'none'
    }}>
      {/* Phone Screen Container Frame */}
      <div className="responsive-phone-frame" style={{
        backgroundColor: themeColors.frameBg,
        border: `1px solid ${themeColors.border}`
      }}>

        {/* ================= 1. TOP HEADER BAR ================= */}
        <div style={{
          backgroundColor: themeColors.headerBg,
          borderBottom: `1px solid ${themeColors.border}`,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 20
        }}>
          {/* DPARCELS Brand Logo */}
          <div style={{ textTransform: 'uppercase', textAlign: 'left' }}>
            <div style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '0.04em', color: themeColors.text, lineHeight: '1' }}>
              <span style={{ color: '#FF8A00' }}>D</span>PARCELS
            </div>
            <div style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.14em', color: themeColors.subText, marginTop: '2px' }}>
              {t('riderPartner')}
            </div>
          </div>

          {/* Right: Notification Bell Button with Badge Count */}
          <button 
            onClick={() => setShowNotificationModal(true)}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: themeColors.cardBg,
              border: `1px solid ${themeColors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: themeColors.text,
              position: 'relative',
              cursor: 'pointer'
            }}
          >
            <Bell size={20} />
            {notificationsEnabled && (
              <span style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: '#FF8A00',
                color: '#000000',
                fontSize: '9px',
                fontWeight: '900',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 8px rgba(255, 138, 0, 0.6)'
              }}>
                3
              </span>
            )}
          </button>
        </div>

        {/* ================= MAIN SCROLLABLE CONTENT AREA ================= */}
        <div style={{
          flex: 1,
          padding: '14px 14px 80px 14px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>

          {/* 2. YOU ARE ONLINE STATUS BANNER CARD */}
          <div style={{
            backgroundColor: themeColors.cardBg,
            border: `1px solid ${themeColors.border}`,
            borderRadius: '20px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: isLight ? '0 4px 14px rgba(0,0,0,0.06)' : '0 8px 24px rgba(0,0,0,0.4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {/* Rider Avatar with Green Online Pulse Dot */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: themeColors.cardSecondary,
                  border: '2px solid #FF8A00',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="48" height="48" viewBox="0 0 100 100" fill="none">
                    <rect width="100" height="100" fill="#1E1E1E" />
                    <circle cx="50" cy="42" r="22" fill="#E0A96D" />
                    <path d="M 32 40 Q 50 64 68 40 C 68 56 32 56 32 40 Z" fill="#2D231E" />
                    <circle cx="43" cy="38" r="2.5" fill="#1E1E1E" />
                    <circle cx="57" cy="38" r="2.5" fill="#1E1E1E" />
                    <path d="M 44 48 Q 50 54 56 48" stroke="#FFFFFF" strokeWidth="2" fill="none" />
                    <path d="M 20 100 C 20 70 80 70 80 100 Z" fill="#FF8A00" />
                  </svg>
                </div>
                <span style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  backgroundColor: isOnline ? '#10B981' : '#EF4444',
                  border: `2px solid ${themeColors.frameBg}`,
                  boxShadow: isOnline ? '0 0 10px #10B981' : 'none'
                }} />
              </div>

              <div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: themeColors.text }}>
                  {isOnline ? t('youAreOnline') : t('youAreOffline')}
                </div>
                <div style={{ fontSize: '11px', color: themeColors.subText, marginTop: '2px' }}>
                  {isOnline ? t('readyToAcceptTrips') : t('goOnlineToReceive')}
                </div>
              </div>
            </div>

            {/* Toggle Switch Button */}
            <button
              onClick={() => setIsOnline(!isOnline)}
              style={{
                width: '52px',
                height: '28px',
                borderRadius: '14px',
                backgroundColor: isOnline ? '#FF8A00' : themeColors.border,
                border: 'none',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background-color 0.25s ease',
                boxShadow: isOnline ? '0 0 12px rgba(255, 138, 0, 0.4)' : 'none'
              }}
            >
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                position: 'absolute',
                top: '3px',
                left: isOnline ? '27px' : '3px',
                transition: 'left 0.25s ease',
                boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
              }} />
            </button>
          </div>

          {/* 3. 4 KEY STATS GRID (2x2 CARDS) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            width: '100%'
          }}>
            {/* Card 1: Today Earnings */}
            <div 
              onClick={() => setShowEarningsModal(true)}
              style={{
                backgroundColor: themeColors.cardBg,
                border: `1px solid ${themeColors.border}`,
                borderRadius: '18px',
                padding: '16px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: themeColors.cardSecondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: themeColors.subText,
                fontSize: '18px',
                fontWeight: '800',
                flexShrink: 0
              }}>
                ₹
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: themeColors.text }}>₹860</div>
                <div style={{ fontSize: '11px', color: themeColors.subText, marginTop: '2px' }}>{t('todayEarnings')}</div>
              </div>
            </div>

            {/* Card 2: Trips Completed */}
            <div 
              onClick={() => navigate('/history')}
              style={{
                backgroundColor: themeColors.cardBg,
                border: `1px solid ${themeColors.border}`,
                borderRadius: '18px',
                padding: '16px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: themeColors.cardSecondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: themeColors.subText,
                flexShrink: 0
              }}>
                <Package size={20} />
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: themeColors.text }}>25</div>
                <div style={{ fontSize: '11px', color: themeColors.subText, marginTop: '2px' }}>{t('tripsCompleted')}</div>
              </div>
            </div>

            {/* Card 3: Rating */}
            <div style={{
              backgroundColor: themeColors.cardBg,
              border: `1px solid ${themeColors.border}`,
              borderRadius: '18px',
              padding: '16px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: themeColors.cardSecondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FF8A00',
                flexShrink: 0
              }}>
                <Star size={20} fill="#FF8A00" color="#FF8A00" />
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: themeColors.text }}>4.8</div>
                <div style={{ fontSize: '11px', color: themeColors.subText, marginTop: '2px' }}>{t('rating')}</div>
              </div>
            </div>

            {/* Card 4: Location */}
            <div 
              onClick={() => setShowMapModal(true)}
              style={{
                backgroundColor: themeColors.cardBg,
                border: `1px solid ${themeColors.border}`,
                borderRadius: '18px',
                padding: '16px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: themeColors.cardSecondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: themeColors.subText,
                flexShrink: 0
              }}>
                <MapPin size={20} />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: themeColors.text }}>{t('location')}</div>
                <div style={{ fontSize: '11px', color: themeColors.subText, marginTop: '2px' }}>Adoni Hub</div>
              </div>
            </div>
          </div>

          {/* 4. ACTIVE TRIP CARD */}
          <div style={{
            backgroundColor: themeColors.cardBg,
            border: `1px solid ${themeColors.border}`,
            borderRadius: '22px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.06)' : '0 8px 24px rgba(0,0,0,0.5)'
          }}>
            {/* Header: Active Trip Title & Status Pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '900', color: themeColors.text, margin: 0 }}>
                  {t('activeTrip')}
                </h3>
                <div style={{ fontSize: '12px', color: themeColors.subText, marginTop: '2px' }}>
                  ID - #DP1024
                </div>
              </div>

              {/* Status Badge Pill */}
              <div style={{
                backgroundColor: '#FF8A00',
                color: '#000000',
                fontSize: '12px',
                fontWeight: '900',
                padding: '8px 16px',
                borderRadius: '20px',
                boxShadow: '0 4px 14px rgba(255, 138, 0, 0.35)'
              }}>
                {t('inTransit')}
              </div>
            </div>

            {/* Customer Details Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '4px'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: themeColors.subText, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('customer')}</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: themeColors.text, marginTop: '2px' }}>
                  Ahmed Rahman
                </div>
              </div>

              {/* Call Phone Button */}
              <a
                href="tel:9876543210"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: themeColors.cardSecondary,
                  border: `1px solid ${themeColors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: themeColors.text,
                  textDecoration: 'none'
                }}
              >
                <Phone size={18} />
              </a>
            </div>

            {/* Progress Route Line */}
            <div style={{ position: 'relative', margin: '8px 0' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative'
              }}>
                {/* Background gray line */}
                <div style={{
                  position: 'absolute',
                  left: '12px',
                  right: '12px',
                  top: '50%',
                  height: '4px',
                  backgroundColor: themeColors.border,
                  transform: 'translateY(-50%)',
                  zIndex: 1
                }} />

                {/* Progress orange line */}
                <div style={{
                  position: 'absolute',
                  left: '12px',
                  width: '45%',
                  top: '50%',
                  height: '4px',
                  backgroundColor: '#FF8A00',
                  transform: 'translateY(-50%)',
                  zIndex: 2
                }} />

                {/* Pickup node */}
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#FF8A00',
                  border: `3px solid ${themeColors.cardBg}`,
                  zIndex: 3
                }} />

                {/* Center Km Badge */}
                <div style={{
                  backgroundColor: themeColors.cardSecondary,
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: '14px',
                  padding: '4px 14px',
                  fontSize: '11px',
                  fontWeight: '800',
                  color: themeColors.text,
                  zIndex: 3
                }}>
                  2.4km
                </div>

                {/* Delivery node */}
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: themeColors.border,
                  border: `3px solid ${themeColors.cardBg}`,
                  zIndex: 3
                }} />
              </div>

              {/* Address labels below line */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '10px'
              }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '10px', color: themeColors.subText }}>{t('pickup')}</div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: themeColors.text, marginTop: '1px' }}>
                    DParcels Hub, Adoni
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: themeColors.subText }}>{t('delivery')}</div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: themeColors.text, marginTop: '1px' }}>
                    Railway Station, Adoni
                  </div>
                </div>
              </div>
            </div>

            {/* Active Trip Action Button */}
            <button
              onClick={() => navigate('/trip-accepted')}
              className="primary-orange-btn"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '4px'
              }}
            >
              <Navigation size={16} />
              <span>{t('viewTrack')}</span>
            </button>
          </div>

          {/* 5. NEW TRIP REQUESTS SECTION */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginTop: '2px'
          }}>
            {/* Section Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: themeColors.text, margin: 0 }}>
                {t('newTripRequests')}
              </h3>
            </div>

            {/* Trip Request Cards List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {availableOrders.length === 0 ? (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: themeColors.subText,
                  fontSize: '14px',
                  backgroundColor: themeColors.cardBg,
                  borderRadius: '16px'
                }}>
                  No new trip requests right now.
                </div>
              ) : (
                availableOrders.map((order) => (
                  <div key={order.id} style={{
                backgroundColor: '#FF8A00',
                borderRadius: '20px',
                padding: '14px 16px',
                color: '#000000',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: '0 6px 20px rgba(255, 138, 0, 0.3)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0,0,0,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Truck size={18} color="#000000" />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '900', color: '#000000' }}>#{order.id.substring(0,6).toUpperCase()}</div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(0,0,0,0.7)' }}>{t('earnings')} - ₹{order.totalPrice * 0.8}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAcceptOrder(order.id)}
                    style={{
                      backgroundColor: '#000000',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: '800',
                      padding: '8px 18px',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                    }}
                  >
                    {t('accept')}
                  </button>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#000000',
                  borderTop: '1px solid rgba(0,0,0,0.12)',
                  paddingTop: '8px'
                }}>
                  <span>{order.pickupLocation}</span>
                  <span style={{ backgroundColor: 'rgba(0,0,0,0.15)', padding: '2px 8px', borderRadius: '10px' }}>{order.category}</span>
                  <span>{order.dropLocation}</span>
                </div>
              </div>
              ))
              )}
            </div>
          </div>

          {/* 6. QUICK ACTIONS ROW */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            width: '100%',
            marginTop: '4px'
          }}>
            {/* Quick Action 1: Fuel Prices */}
            <div 
              onClick={() => setShowFuelModal(true)}
              style={{
                backgroundColor: themeColors.cardBg,
                border: `1px solid ${themeColors.border}`,
                borderRadius: '14px',
                padding: '10px 4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 138, 0, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FF8A00',
                marginBottom: '4px'
              }}>
                <Fuel size={16} />
              </div>
              <span style={{ fontSize: '10px', fontWeight: '700', color: themeColors.text }}>{t('fuelPrices')}</span>
            </div>

            {/* Quick Action 2: SOS */}
            <div 
              onClick={() => setShowSosModal(true)}
              style={{
                backgroundColor: themeColors.cardBg,
                border: `1px solid ${themeColors.border}`,
                borderRadius: '14px',
                padding: '10px 4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
                marginBottom: '4px'
              }}>
                <AlertTriangle size={16} />
              </div>
              <span style={{ fontSize: '10px', fontWeight: '700', color: themeColors.text }}>{t('sosAlert')}</span>
            </div>

            {/* Quick Action 3: Refer & Earn */}
            <div 
              onClick={() => setShowReferModal(true)}
              style={{
                backgroundColor: themeColors.cardBg,
                border: `1px solid ${themeColors.border}`,
                borderRadius: '14px',
                padding: '10px 4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 138, 0, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FF8A00',
                marginBottom: '4px'
              }}>
                <Gift size={16} />
              </div>
              <span style={{ fontSize: '10px', fontWeight: '700', color: themeColors.text }}>{t('referEarn')}</span>
            </div>
          </div>

        </div>

        {/* ================= MODAL 1: FUEL PRICES MODAL ================= */}
        {showFuelModal && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: themeColors.modalOverlay,
            backdropFilter: 'blur(10px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            <div style={{
              width: '100%',
              backgroundColor: themeColors.modalBg,
              border: `1px solid ${themeColors.border}`,
              borderRadius: '20px',
              padding: '20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.95)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Fuel size={22} color="#FF8A00" />
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: '800', color: themeColors.text, margin: 0 }}>
                      {t('fuelPrices')}
                    </h3>
                    <div style={{ fontSize: '10px', color: themeColors.subText }}>Adoni, AP • Updated 6:00 AM</div>
                  </div>
                </div>

                <button onClick={() => setShowFuelModal(false)} style={{ background: 'none', border: 'none', color: themeColors.subText, cursor: 'pointer', padding: '4px' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div style={{ backgroundColor: themeColors.cardBg, border: `1px solid ${themeColors.border}`, borderRadius: '14px', padding: '14px 12px' }}>
                  <div style={{ fontSize: '11px', color: themeColors.subText, fontWeight: '700' }}>⛽ PETROL</div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#FF8A00', margin: '4px 0 2px 0' }}>₹109.45</div>
                  <div style={{ fontSize: '10px', color: '#10B981', fontWeight: '700' }}>▼ -₹0.15 / L</div>
                </div>

                <div style={{ backgroundColor: themeColors.cardBg, border: `1px solid ${themeColors.border}`, borderRadius: '14px', padding: '14px 12px' }}>
                  <div style={{ fontSize: '11px', color: themeColors.subText, fontWeight: '700' }}>🛢️ DIESEL</div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: themeColors.text, margin: '4px 0 2px 0' }}>₹97.20</div>
                  <div style={{ fontSize: '10px', color: themeColors.subText, fontWeight: '700' }}>• Stable / L</div>
                </div>
              </div>

              <button onClick={() => setShowFuelModal(false)} className="primary-orange-btn" style={{ width: '100%', padding: '12px', fontSize: '14px' }}>
                Done
              </button>
            </div>
          </div>
        )}

        {/* ================= MODAL 2: REFER & EARN MODAL ================= */}
        {showReferModal && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: themeColors.modalOverlay,
            backdropFilter: 'blur(10px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            <div style={{
              width: '100%',
              backgroundColor: themeColors.modalBg,
              border: `1px solid ${themeColors.border}`,
              borderRadius: '22px',
              padding: '22px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.95)',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowReferModal(false)} style={{ background: 'none', border: 'none', color: themeColors.subText, cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(255, 138, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', color: '#FF8A00' }}>
                <Gift size={32} />
              </div>

              <h3 style={{ fontSize: '19px', fontWeight: '900', color: themeColors.text, margin: '0 0 4px 0' }}>
                {t('referEarn')}
              </h3>
              <p style={{ fontSize: '12px', color: themeColors.subText, margin: '0 0 16px 0', lineHeight: '1.4' }}>
                Earn ₹100 for every rider partner who registers with your code!
              </p>

              {/* Referral Code Box */}
              <div style={{ backgroundColor: themeColors.cardBg, border: '1px dashed #FF8A00', borderRadius: '14px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '16px', fontWeight: '900', color: '#FF8A00', letterSpacing: '0.08em' }}>DPARCSREENU100</span>
                <button onClick={handleCopyCode} style={{ backgroundColor: '#FF8A00', color: '#000000', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <button onClick={() => setShowReferModal(false)} className="primary-orange-btn" style={{ width: '100%', padding: '12px', fontSize: '14px' }}>
                Done
              </button>
            </div>
          </div>
        )}

        {/* ================= MODAL 3: EMERGENCY SOS MODAL ================= */}
        {showSosModal && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: themeColors.modalOverlay,
            backdropFilter: 'blur(10px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            <div style={{
              width: '100%',
              backgroundColor: themeColors.modalBg,
              border: '1px solid #EF4444',
              borderRadius: '22px',
              padding: '22px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.95)',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowSosModal(false)} style={{ background: 'none', border: 'none', color: themeColors.subText, cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', color: '#EF4444' }}>
                <ShieldAlert size={32} />
              </div>

              <h3 style={{ fontSize: '19px', fontWeight: '900', color: '#EF4444', margin: '0 0 4px 0' }}>
                Emergency SOS
              </h3>
              <p style={{ fontSize: '12px', color: themeColors.subText, margin: '0 0 16px 0' }}>
                Need urgent help? Click below to call 24/7 Police & Safety Helpline.
              </p>

              <a
                href="tel:112"
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  borderRadius: '14px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: '900',
                  fontSize: '15px',
                  marginBottom: '10px',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
                }}
              >
                <Phone size={18} />
                <span>Call Emergency Helpline (112)</span>
              </a>

              <button onClick={() => setShowSosModal(false)} style={{ backgroundColor: themeColors.cardBg, border: `1px solid ${themeColors.border}`, color: themeColors.text, width: '100%', padding: '12px', borderRadius: '14px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ================= MODAL 4: SERVICE AREA MAP MODAL ================= */}
        {showMapModal && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: themeColors.modalOverlay,
            backdropFilter: 'blur(10px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px'
          }}>
            <div style={{
              width: '100%',
              backgroundColor: themeColors.modalBg,
              border: `1px solid ${themeColors.border}`,
              borderRadius: '20px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.85)',
              maxHeight: '94vh',
              overflowY: 'auto'
            }}>
              {/* Modal Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={20} color="#FF8A00" />
                  <h3 style={{ fontSize: '17px', fontWeight: '800', color: themeColors.text, margin: 0 }}>
                    {t('serviceArea')}
                  </h3>
                </div>

                <button
                  onClick={() => setShowMapModal(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: themeColors.cardSecondary,
                    border: `1px solid ${themeColors.border}`,
                    color: themeColors.subText,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Zone Legend Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: themeColors.cardBg,
                padding: '8px 12px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '700',
                color: themeColors.text
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#FF8A00' }} />
                  <span>{t('busyZone')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3B82F6' }} />
                  <span>{t('pickupAreas')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                  <span>{t('dropAreas')}</span>
                </div>
              </div>

              {/* Real Leaflet Service Map View */}
              <div style={{
                width: '100%',
                height: '240px',
                borderRadius: '16px',
                overflow: 'hidden',
                position: 'relative',
                border: `1px solid ${themeColors.border}`
              }}>
                <RealMap
                  riderPos={riderPos}
                  pickupPos={pickupPos}
                  dropPos={dropPos}
                  routePoints={routePoints}
                  showServiceZones={true}
                  onRecenter={() => setRiderPos([15.6322, 77.2728])}
                />
              </div>

              {/* 3 Summary Statistic Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px'
              }}>
                <div style={{
                  backgroundColor: themeColors.cardBg,
                  border: '1px solid rgba(255, 138, 0, 0.3)',
                  borderRadius: '12px',
                  padding: '10px 6px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#FF8A00' }}>12</div>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: themeColors.text, marginTop: '2px' }}>{t('busyZonesCount')}</div>
                </div>

                <div style={{
                  backgroundColor: themeColors.cardBg,
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '12px',
                  padding: '10px 6px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#3B82F6' }}>8</div>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: themeColors.text, marginTop: '2px' }}>{t('pickupAreas')}</div>
                </div>

                <div style={{
                  backgroundColor: themeColors.cardBg,
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '12px',
                  padding: '10px 6px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#10B981' }}>6</div>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: themeColors.text, marginTop: '2px' }}>{t('dropAreas')}</div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowMapModal(false)}
                className="primary-orange-btn"
                style={{ width: '100%', padding: '12px', fontSize: '14px', borderRadius: '12px' }}
              >
                {t('closeMap')}
              </button>
            </div>
          </div>
        )}

        {/* ================= MODAL 5: NOTIFICATIONS MODAL ================= */}
        {showNotificationModal && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: themeColors.modalOverlay,
            backdropFilter: 'blur(10px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            <div style={{
              width: '100%',
              backgroundColor: themeColors.modalBg,
              border: `1px solid ${themeColors.border}`,
              borderRadius: '22px',
              padding: '20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.95)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bell size={20} color="#FF8A00" />
                  <h3 style={{ fontSize: '17px', fontWeight: '800', color: themeColors.text, margin: 0 }}>
                    Notifications
                  </h3>
                </div>

                <button onClick={() => setShowNotificationModal(false)} style={{ background: 'none', border: 'none', color: themeColors.subText, cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                <div style={{ backgroundColor: themeColors.cardBg, borderRadius: '12px', padding: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: themeColors.text }}>🎉 Bonus Payout Credited!</div>
                  <div style={{ fontSize: '11px', color: themeColors.subText, marginTop: '2px' }}>₹100 Referral bonus added to wallet.</div>
                </div>

                <div style={{ backgroundColor: themeColors.cardBg, borderRadius: '12px', padding: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: themeColors.text }}>🔥 High Demand Alert</div>
                  <div style={{ fontSize: '11px', color: themeColors.subText, marginTop: '2px' }}>High order surge near Adoni Hub.</div>
                </div>
              </div>

              <button onClick={() => setShowNotificationModal(false)} className="primary-orange-btn" style={{ width: '100%', padding: '12px', fontSize: '14px' }}>
                Done
              </button>
            </div>
          </div>
        )}

        {/* ================= MODAL 6: TODAY EARNINGS MODAL ================= */}
        {showEarningsModal && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: themeColors.modalOverlay,
            backdropFilter: 'blur(10px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            <div style={{
              width: '100%',
              backgroundColor: themeColors.modalBg,
              border: `1px solid ${themeColors.border}`,
              borderRadius: '22px',
              padding: '20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.95)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: themeColors.text, margin: 0 }}>
                  {t('todayEarnings')} Breakdown
                </h3>
                <button onClick={() => setShowEarningsModal(false)} style={{ background: 'none', border: 'none', color: themeColors.subText, cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ backgroundColor: 'rgba(255, 138, 0, 0.1)', border: '1px solid rgba(255, 138, 0, 0.3)', borderRadius: '16px', padding: '16px', textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: themeColors.subText, textTransform: 'uppercase' }}>Total Net Earnings</div>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#FF8A00', margin: '4px 0' }}>₹860.00</div>
                <div style={{ fontSize: '11px', color: '#10B981', fontWeight: '700' }}>✓ 25 Completed Trips</div>
              </div>

              <button onClick={() => setShowEarningsModal(false)} className="primary-orange-btn" style={{ width: '100%', padding: '12px', fontSize: '14px' }}>
                Done
              </button>
            </div>
          </div>
        )}

        {/* ================= 9. FIXED BOTTOM NAVIGATION BAR ================= */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '64px',
          backgroundColor: themeColors.navBg,
          borderTop: `1px solid ${themeColors.border}`,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          alignItems: 'center',
          zIndex: 30
        }}>
          {/* Tab 1: Home (Active) */}
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
            <span style={{ fontSize: '11px', fontWeight: '800' }}>{t('home')}</span>
          </button>

          {/* Tab 2: History */}
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
              color: themeColors.subText
            }}
          >
            <Package size={18} color={themeColors.subText} />
            <span style={{ fontSize: '11px', fontWeight: '700' }}>{t('history')}</span>
          </button>

          {/* Tab 3: Profile */}
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
              color: themeColors.subText
            }}
          >
            <User size={18} color={themeColors.subText} />
            <span style={{ fontSize: '11px', fontWeight: '700' }}>{t('profile')}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default HomePage;
