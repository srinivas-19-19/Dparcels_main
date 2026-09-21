import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import RealMap from '../components/RealMap';
import { 
  Package, 
  MapPin, 
  Navigation, 
  Phone, 
  CheckCircle2, 
  Star, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  LogOut, 
  Power, 
  ShieldCheck, 
  Truck, 
  ExternalLink, 
  ChevronRight, 
  IndianRupee, 
  Radio, 
  Sparkles,
  ArrowRight,
  Send,
  SlidersHorizontal,
  FileText
} from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isLight, themeColors } = useTheme();
  const { user, logout, socket } = useAuth();

  // State Management
  const [isOnline, setIsOnline] = useState(true);
  const [stats, setStats] = useState({
    todayEarnings: 0,
    tripsCompleted: 0,
    rating: 5.0,
    city: 'Adoni Hub',
    isOnline: true
  });

  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAcceptingId, setIsAcceptingId] = useState(null);

  // Rider & Hub Coordinate Defaults (Adoni, AP)
  const defaultRiderPos = [15.6322, 77.2728];
  const [riderPos, setRiderPos] = useState(defaultRiderPos);

  useEffect(() => {
    fetchDashboardData();

    // Auto-polling fallback every 6 seconds to keep feed fresh
    const pollInterval = setInterval(() => {
      fetchAvailableOrdersOnly();
    }, 6000);

    return () => clearInterval(pollInterval);
  }, []);

  // Socket.IO Real-time Events
  useEffect(() => {
    if (socket) {
      socket.emit('join_riders');

      const handleNewOrder = (incomingData) => {
        const newOrder = incomingData?.order || incomingData;
        if (!newOrder || !newOrder.id) return;

        setAvailableOrders((prev) => {
          if (prev.some((o) => o.id === newOrder.id)) return prev;
          return [newOrder, ...prev];
        });
      };

      const handleOrderTaken = (data) => {
        if (data?.orderId) {
          setAvailableOrders((prev) => prev.filter((o) => o.id !== data.orderId));
        }
      };

      const handleStatusUpdate = () => {
        fetchDashboardData();
      };

      socket.on('new_order_available', handleNewOrder);
      socket.on('order_taken', handleOrderTaken);
      socket.on('order_status_update', handleStatusUpdate);
      socket.on('order_status_updated', handleStatusUpdate);

      return () => {
        socket.off('new_order_available', handleNewOrder);
        socket.off('order_taken', handleOrderTaken);
        socket.off('order_status_update', handleStatusUpdate);
        socket.off('order_status_updated', handleStatusUpdate);
      };
    }
  }, [socket]);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const [availableRes, riderOrdersRes, statsRes] = await Promise.all([
        api.get('/orders/available').catch(() => ({ data: { data: [] } })),
        api.get('/rider/orders').catch(() => ({ data: { data: [] } })),
        api.get('/rider/stats').catch(() => ({ data: { data: null } }))
      ]);

      setAvailableOrders(availableRes.data?.data || []);
      
      const orders = riderOrdersRes.data?.data || [];
      const currentActive = orders.find((o) =>
        ['ACCEPTED', 'RIDER_ASSIGNED', 'ARRIVED_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(o.status)
      );
      setActiveOrder(currentActive || null);

      if (statsRes.data?.data) {
        setStats(statsRes.data.data);
        setIsOnline(statsRes.data.data.isOnline ?? true);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAvailableOrdersOnly = async () => {
    try {
      const res = await api.get('/orders/available');
      if (res.data?.data) {
        setAvailableOrders(res.data.data);
      }
    } catch {
      // Background poll silently fails if offline
    }
  };

  const handleToggleOnline = async () => {
    const nextOnline = !isOnline;
    setIsOnline(nextOnline);
    try {
      await api.patch('/rider/availability', { isOnline: nextOnline });
      setStats((prev) => ({ ...prev, isOnline: nextOnline }));
    } catch (err) {
      console.error('Failed to update availability:', err);
      setIsOnline(!nextOnline);
      alert(err.response?.data?.message || 'Failed to update availability status.');
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      setIsAcceptingId(orderId);
      const res = await api.post(`/orders/${orderId}/accept`);
      const accepted = res.data?.data || availableOrders.find((o) => o.id === orderId);

      // Celebration effect
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 }
      });

      // Remove from available and set as active
      setAvailableOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (accepted) {
        setActiveOrder({ ...accepted, status: 'ACCEPTED' });
      }

      await fetchDashboardData();
    } catch (error) {
      console.error('Failed to accept order:', error);
      alert(error.response?.data?.message || 'Failed to accept order. It may have already been claimed.');
      fetchDashboardData();
    } finally {
      setIsAcceptingId(null);
    }
  };

  const handleAdvanceStatus = async (orderId, nextStatus) => {
    try {
      setIsUpdatingStatus(true);
      const res = await api.post(`/orders/${orderId}/status`, { status: nextStatus });
      const updated = res.data?.data;

      if (nextStatus === 'DELIVERED') {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
        setActiveOrder(null);
        await fetchDashboardData();
      } else {
        setActiveOrder((prev) => prev ? { ...prev, status: nextStatus } : updated);
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert(error.response?.data?.message || 'Failed to update status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Helper calculation for active order stepper stage
  const getActiveStageIndex = (status) => {
    switch (status) {
      case 'ACCEPTED':
      case 'RIDER_ASSIGNED':
        return 1;
      case 'ARRIVED_PICKUP':
        return 2;
      case 'PICKED_UP':
      case 'IN_TRANSIT':
      case 'OUT_FOR_DELIVERY':
        return 3;
      case 'DELIVERED':
        return 4;
      default:
        return 1;
    }
  };

  // Compute map coordinates from active order or defaults
  const pickupCoords = activeOrder?.pickupCoordinates 
    ? [activeOrder.pickupCoordinates.lat, activeOrder.pickupCoordinates.lng]
    : [15.6350, 77.2750];

  const dropCoords = activeOrder?.dropCoordinates
    ? [activeOrder.dropCoordinates.lat, activeOrder.dropCoordinates.lng]
    : [15.6260, 77.2710];

  const riderName = user?.riderProfile?.firstName
    ? `${user.riderProfile.firstName} ${user.riderProfile.lastName || ''}`.trim()
    : (user?.name || 'Rider Partner');

  const partnerCode = user?.riderProfile?.id 
    ? `#${user.riderProfile.id.slice(-4).toUpperCase()}` 
    : '#RIDER';

  return (
    <div className="rider-app-shell">
      {/* ================= 1. STICKY TOP NAVBAR HUD ================= */}
      <header className="rider-top-navbar">
        <div className="rider-navbar-inner">
          {/* Brand Logo & Live Hub Beacon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '0.04em', color: '#FFFFFF', lineHeight: 1 }}>
                <span style={{ color: '#FF8A00' }}>D</span>PARCELS
              </div>
              <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.14em', color: '#FF8A00', marginTop: '3px' }}>
                DISPATCH COMMAND
              </span>
            </div>

            {/* Live Station Hub Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '700',
              color: '#94A3B8'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isOnline ? '#10B981' : '#EF4444',
                boxShadow: isOnline ? '0 0 8px #10B981' : 'none'
              }} />
              <span>{stats?.city || 'Adoni Central Hub'}</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="desktop-nav-links rider-nav-links">
            <Link to="/home" className="rider-nav-btn active">
              <Truck size={16} />
              <span>Command Center</span>
            </Link>
            <Link to="/history" className="rider-nav-btn">
              <Clock size={16} />
              <span>Trip History</span>
            </Link>
            <Link to="/profile" className="rider-nav-btn">
              <ShieldCheck size={16} />
              <span>Profile & Vehicle</span>
            </Link>
            <Link to="/settings" className="rider-nav-btn">
              <SlidersHorizontal size={16} />
              <span>Settings</span>
            </Link>
          </nav>

          {/* Right Controls: Online/Offline Switch & Profile Chip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Online / Offline Toggle Button */}
            <button
              onClick={handleToggleOnline}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '14px',
                backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${isOnline ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                color: isOnline ? '#10B981' : '#EF4444',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title={isOnline ? 'Click to go offline' : 'Click to go online'}
            >
              <Power size={14} />
              <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </button>

            {/* Rider Profile Card & Logout */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#111D2E',
              border: '1px solid #1F3047',
              padding: '5px 12px',
              borderRadius: '14px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#FF8A00',
                color: '#000000',
                fontWeight: '900',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {riderName.charAt(0).toUpperCase()}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#FFFFFF', lineHeight: 1.1 }}>
                  {riderName}
                </span>
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#FF8A00', marginTop: '2px' }}>
                  ★ {stats?.rating ? Number(stats.rating).toFixed(1) : '5.0'} • {partnerCode}
                </span>
              </div>

              <button
                onClick={logout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  marginLeft: '4px'
                }}
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ================= 2. MAIN VIEWPORT CONTENT ================= */}
      <main className="rider-content-container">
        {/* TOP 4-METRIC KPI HUD STRIP */}
        <section className="rider-kpi-grid">
          {/* KPI 1: Today Earnings */}
          <div className="rider-kpi-card" onClick={() => navigate('/history')} style={{ cursor: 'pointer' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              backgroundColor: 'rgba(255, 138, 0, 0.12)',
              border: '1px solid rgba(255, 138, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FF8A00',
              fontWeight: '900',
              fontSize: '20px',
              flexShrink: 0
            }}>
              ₹
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#FFFFFF', lineHeight: 1.1 }}>
                ₹{stats?.todayEarnings ?? 0}
              </div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', marginTop: '3px' }}>
                Today's Earnings (80% Cut)
              </div>
            </div>
          </div>

          {/* KPI 2: Active Dispatch Status */}
          <div className="rider-kpi-card">
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              backgroundColor: activeOrder ? 'rgba(255, 138, 0, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              border: `1px solid ${activeOrder ? 'rgba(255, 138, 0, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: activeOrder ? '#FF8A00' : '#10B981',
              flexShrink: 0
            }}>
              <Package size={22} />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: activeOrder ? '#FF8A00' : '#10B981', lineHeight: 1.1 }}>
                {activeOrder ? (activeOrder.trackingId || 'ACTIVE TRIP') : (isOnline ? 'READY FOR ORDERS' : 'OFFLINE')}
              </div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', marginTop: '3px' }}>
                {activeOrder ? (activeOrder.status?.replace(/_/g, ' ') || 'In Progress') : 'Current Shift Status'}
              </div>
            </div>
          </div>

          {/* KPI 3: Trips Completed Today */}
          <div className="rider-kpi-card" onClick={() => navigate('/history')} style={{ cursor: 'pointer' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3B82F6',
              flexShrink: 0
            }}>
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#FFFFFF', lineHeight: 1.1 }}>
                {stats?.tripsCompleted ?? 0} Trips
              </div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', marginTop: '3px' }}>
                Completed Deliveries Today
              </div>
            </div>
          </div>

          {/* KPI 4: Partner Rating & Tier */}
          <div className="rider-kpi-card">
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              backgroundColor: 'rgba(255, 138, 0, 0.12)',
              border: '1px solid rgba(255, 138, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FF8A00',
              flexShrink: 0
            }}>
              <Star size={22} fill="#FF8A00" color="#FF8A00" />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#FFFFFF', lineHeight: 1.1 }}>
                ★ {stats?.rating ? Number(stats.rating).toFixed(1) : '5.0'}
              </div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', marginTop: '3px' }}>
                Top Rated Delivery Partner
              </div>
            </div>
          </div>
        </section>

        {/* ================= 3. COMMAND CENTER DUAL-COLUMN LAYOUT ================= */}
        <div className="rider-command-grid">
          {/* ================= COLUMN 1: DISPATCH & LIFECYCLE ACTION TERMINAL ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* SCENARIO A: ACTIVE ORDER IN PROGRESS */}
            {activeOrder ? (
              <div className="rider-card rider-card-highlight">
                {/* Header: Tracking ID + Category + Payout */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      backgroundColor: '#FF8A00',
                      color: '#000000',
                      fontWeight: '900',
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      letterSpacing: '0.04em'
                    }}>
                      MISSION ACTIVE
                    </div>
                    <span style={{ fontSize: '16px', fontWeight: '900', color: '#FFFFFF' }}>
                      {activeOrder.trackingId || (`#${activeOrder.id.substring(0, 8).toUpperCase()}`)}
                    </span>
                  </div>

                  <div style={{
                    backgroundColor: 'rgba(255, 138, 0, 0.15)',
                    border: '1px solid rgba(255, 138, 0, 0.4)',
                    color: '#FF8A00',
                    fontSize: '14px',
                    fontWeight: '900',
                    padding: '6px 14px',
                    borderRadius: '12px'
                  }}>
                    Earn ₹{Math.round(Number(activeOrder.totalAmount ?? activeOrder.totalPrice ?? 0) * 0.8)}
                  </div>
                </div>

                {/* Customer Contact Card */}
                <div style={{
                  backgroundColor: '#111D2E',
                  border: '1px solid #1F3047',
                  borderRadius: '16px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FF8A00'
                    }}>
                      <Truck size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' }}>
                        Customer Contact
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#FFFFFF', marginTop: '2px' }}>
                        {activeOrder.customer?.firstName 
                          ? `${activeOrder.customer.firstName} ${activeOrder.customer.lastName || ''}`.trim()
                          : (activeOrder.customerName || 'Customer')}
                      </div>
                    </div>
                  </div>

                  {/* Direct Phone Call Button */}
                  {activeOrder.customer?.phone && (
                    <a
                      href={`tel:${activeOrder.customer.phone}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: '#10B981',
                        color: '#FFFFFF',
                        padding: '8px 16px',
                        borderRadius: '12px',
                        textDecoration: 'none',
                        fontWeight: '800',
                        fontSize: '12px',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                      }}
                    >
                      <Phone size={14} />
                      <span>Call Customer</span>
                    </a>
                  )}
                </div>

                {/* 4-Stage Visual Delivery Stepper */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Delivery Lifecycle Progress
                  </div>

                  <div className="rider-stepper-track">
                    <div className="rider-stepper-line-bg" />
                    <div 
                      className="rider-stepper-line-active" 
                      style={{ 
                        width: getActiveStageIndex(activeOrder.status) === 1 ? '0%' :
                               getActiveStageIndex(activeOrder.status) === 2 ? '33%' :
                               getActiveStageIndex(activeOrder.status) === 3 ? '66%' : '100%' 
                      }} 
                    />

                    {/* Step 1: Accepted */}
                    <div className={`rider-stepper-node ${getActiveStageIndex(activeOrder.status) >= 1 ? 'completed active' : ''}`}>
                      <div className="rider-stepper-circle">
                        {getActiveStageIndex(activeOrder.status) > 1 ? <CheckCircle2 size={16} /> : '1'}
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: '#FFFFFF' }}>Accepted</span>
                    </div>

                    {/* Step 2: At Pickup */}
                    <div className={`rider-stepper-node ${getActiveStageIndex(activeOrder.status) === 2 ? 'active' : getActiveStageIndex(activeOrder.status) > 2 ? 'completed' : ''}`}>
                      <div className="rider-stepper-circle">
                        {getActiveStageIndex(activeOrder.status) > 2 ? <CheckCircle2 size={16} /> : '2'}
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: '#FFFFFF' }}>At Pickup</span>
                    </div>

                    {/* Step 3: Picked Up */}
                    <div className={`rider-stepper-node ${getActiveStageIndex(activeOrder.status) === 3 ? 'active' : getActiveStageIndex(activeOrder.status) > 3 ? 'completed' : ''}`}>
                      <div className="rider-stepper-circle">
                        {getActiveStageIndex(activeOrder.status) > 3 ? <CheckCircle2 size={16} /> : '3'}
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: '#FFFFFF' }}>In Transit</span>
                    </div>

                    {/* Step 4: Delivered */}
                    <div className={`rider-stepper-node ${getActiveStageIndex(activeOrder.status) === 4 ? 'completed active' : ''}`}>
                      <div className="rider-stepper-circle">
                        4
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: '#FFFFFF' }}>Delivered</span>
                    </div>
                  </div>
                </div>

                {/* Route Intel & Pickup / Dropoff Coordinates */}
                <div style={{
                  backgroundColor: '#111D2E',
                  border: '1px solid #1F3047',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}>
                  {/* Pickup Row */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      color: '#3B82F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <MapPin size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#3B82F6', textTransform: 'uppercase' }}>
                        Pickup Location
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#FFFFFF', marginTop: '2px' }}>
                        {activeOrder.pickupAddress || 'Pickup Store / Hub'}
                      </div>
                      {activeOrder.pickupLandmark && (
                        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                          Landmark: {activeOrder.pickupLandmark}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.06)', margin: '2px 0' }} />

                  {/* Dropoff Row */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 138, 0, 0.15)',
                      color: '#FF8A00',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Navigation size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#FF8A00', textTransform: 'uppercase' }}>
                        Delivery Destination
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#FFFFFF', marginTop: '2px' }}>
                        {activeOrder.dropAddress || 'Customer Destination'}
                      </div>
                      {activeOrder.dropLandmark && (
                        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                          Landmark: {activeOrder.dropLandmark}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Status Banner */}
                {activeOrder.payment?.status === 'PAID' ? (
                  <div style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '14px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#10B981',
                    fontSize: '13px',
                    fontWeight: '800'
                  }}>
                    <CheckCircle2 size={18} />
                    <span>✓ Order is Prepaid Online — Do NOT collect cash from the customer.</span>
                  </div>
                ) : (
                  <div style={{
                    backgroundColor: 'rgba(255, 138, 0, 0.12)',
                    border: '1px solid rgba(255, 138, 0, 0.4)',
                    borderRadius: '14px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#FF8A00',
                    fontSize: '13px',
                    fontWeight: '800'
                  }}>
                    <AlertCircle size={18} />
                    <span>⚠️ CASH ON DELIVERY: Collect ₹{Number(activeOrder.totalAmount ?? activeOrder.totalPrice ?? 0)} from customer.</span>
                  </div>
                )}

                {/* PRIMARY LIFECYCLE ADVANCE ACTION BUTTON */}
                <div>
                  {activeOrder.status === 'ACCEPTED' && (
                    <button
                      onClick={() => handleAdvanceStatus(activeOrder.id, 'ARRIVED_PICKUP')}
                      disabled={isUpdatingStatus}
                      className="primary-orange-btn"
                      style={{
                        width: '100%',
                        padding: '16px',
                        fontSize: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                      }}
                    >
                      <MapPin size={18} />
                      <span>{isUpdatingStatus ? 'Updating...' : 'I Have Arrived at Pickup Location'}</span>
                    </button>
                  )}

                  {activeOrder.status === 'ARRIVED_PICKUP' && (
                    <button
                      onClick={() => handleAdvanceStatus(activeOrder.id, 'PICKED_UP')}
                      disabled={isUpdatingStatus}
                      className="primary-orange-btn"
                      style={{
                        width: '100%',
                        padding: '16px',
                        fontSize: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                      }}
                    >
                      <Package size={18} />
                      <span>{isUpdatingStatus ? 'Updating...' : 'Confirm Package Picked Up & Start Delivery'}</span>
                    </button>
                  )}

                  {['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(activeOrder.status) && (
                    <button
                      onClick={() => handleAdvanceStatus(activeOrder.id, 'DELIVERED')}
                      disabled={isUpdatingStatus}
                      style={{
                        width: '100%',
                        padding: '16px',
                        fontSize: '15px',
                        backgroundColor: '#10B981',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '14px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
                      }}
                    >
                      <CheckCircle2 size={18} />
                      <span>{isUpdatingStatus ? 'Completing...' : 'Confirm Delivered & Complete Trip'}</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* SCENARIO B: NO ACTIVE ORDER (ONLINE FEED OR OFFLINE STANDBY) */
              isOnline ? (
                <div className="rider-card">
                  {/* Feed Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Radio size={18} color="#FF8A00" />
                      <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#FFFFFF', margin: 0 }}>
                        Available Delivery Requests ({availableOrders.length})
                      </h3>
                    </div>

                    <button
                      onClick={fetchDashboardData}
                      disabled={refreshing}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#FF8A00',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                      <span>Refresh Feed</span>
                    </button>
                  </div>

                  {/* Available Orders List OR Live Radar Scanner */}
                  {availableOrders.length === 0 ? (
                    <div style={{
                      backgroundColor: '#111D2E',
                      border: '1px dashed #1F3047',
                      borderRadius: '18px',
                      padding: '36px 20px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {/* Radar Pulse Animation */}
                      <div className="radar-scanner-box">
                        <div className="radar-ring" />
                        <div className="radar-ring" />
                        <div className="radar-ring" />
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          backgroundColor: '#FF8A00',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#000000',
                          boxShadow: '0 0 20px rgba(255, 138, 0, 0.7)',
                          zIndex: 5
                        }}>
                          <Truck size={22} />
                        </div>
                      </div>

                      <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#FFFFFF', margin: '8px 0 4px 0' }}>
                        Scanning Adoni Delivery Hub for Requests...
                      </h4>
                      <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0, maxWidth: '380px', lineHeight: 1.5 }}>
                        You are online and ready. When customer orders are submitted in Adoni, they will appear here in real-time.
                      </p>

                      <div style={{
                        marginTop: '16px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#10B981'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                        <span>Live Socket Connected • Instant Dispatch Active</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {availableOrders.map((order) => {
                        const totalAmt = Number(order.totalAmount ?? order.totalPrice ?? 0);
                        const earnings = Math.round(totalAmt * 0.8);
                        const displayId = order.trackingId || (`#${order.id.substring(0, 8).toUpperCase()}`);
                        const isAccepting = isAcceptingId === order.id;

                        return (
                          <div key={order.id} className="rider-order-item">
                            {/* Card Header: Tracking ID + Category + Payout */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                  backgroundColor: 'rgba(255, 138, 0, 0.15)',
                                  color: '#FF8A00',
                                  padding: '4px 10px',
                                  borderRadius: '8px',
                                  fontSize: '11px',
                                  fontWeight: '800'
                                }}>
                                  {order.serviceType || 'PARCEL EXPRESS'}
                                </div>
                                <span style={{ fontSize: '14px', fontWeight: '900', color: '#FFFFFF' }}>
                                  {displayId}
                                </span>
                              </div>

                              <div style={{ fontSize: '18px', fontWeight: '900', color: '#FF8A00' }}>
                                ₹{earnings} <span style={{ fontSize: '11px', color: '#94A3B8' }}>(Payout)</span>
                              </div>
                            </div>

                            {/* Addresses Snippet */}
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              backgroundColor: '#0D1624',
                              padding: '12px 14px',
                              borderRadius: '12px',
                              border: '1px solid #1A273B'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6', flexShrink: 0 }} />
                                <span style={{ fontSize: '12px', color: '#94A3B8' }}>From:</span>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {order.pickupAddress || 'Pickup Point'}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FF8A00', flexShrink: 0 }} />
                                <span style={{ fontSize: '12px', color: '#94A3B8' }}>To:</span>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {order.dropAddress || 'Destination'}
                                </span>
                              </div>
                            </div>

                            {/* Accept Button & Distance Chip */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '700' }}>
                                Distance: {order.distanceKm ? `${order.distanceKm} km` : 'Adoni Local'}
                              </div>

                              <button
                                onClick={() => handleAcceptOrder(order.id)}
                                disabled={isAccepting}
                                className="primary-orange-btn"
                                style={{
                                  padding: '10px 22px',
                                  fontSize: '13px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}
                              >
                                <span>{isAccepting ? 'Claiming...' : 'ACCEPT DELIVERY'}</span>
                                <ArrowRight size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* OFFLINE STANDBY CARD */
                <div className="rider-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    border: '2px solid #EF4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#EF4444',
                    margin: '0 auto 16px auto'
                  }}>
                    <Power size={32} />
                  </div>

                  <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#FFFFFF', margin: '0 0 6px 0' }}>
                    You Are Currently Offline
                  </h3>
                  <p style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 20px 0', maxWidth: '360px', marginInline: 'auto', lineHeight: 1.5 }}>
                    Turn online to connect to the Adoni Dispatch Hub and start receiving real delivery requests.
                  </p>

                  <button
                    onClick={handleToggleOnline}
                    className="primary-orange-btn"
                    style={{
                      padding: '14px 32px',
                      fontSize: '14px',
                      margin: '0 auto',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Power size={16} />
                    <span>Go Online Now</span>
                  </button>
                </div>
              )
            )}
          </div>

          {/* ================= COLUMN 2: LIVE MAP & FLEET INTEL ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Interactive Route Map Card */}
            <div className="rider-card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Navigation size={18} color="#FF8A00" />
                  <h4 style={{ fontSize: '16px', fontWeight: '900', color: '#FFFFFF', margin: 0 }}>
                    Live GPS & Navigation Route
                  </h4>
                </div>

                <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700' }}>
                  Adoni Hub Region
                </div>
              </div>

              {/* Map Canvas */}
              <div style={{
                width: '100%',
                height: '360px',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid #1E2D42',
                position: 'relative'
              }}>
                <RealMap
                  riderPos={riderPos}
                  pickupPos={pickupCoords}
                  dropPos={dropCoords}
                  routePoints={[pickupCoords, dropCoords]}
                  showServiceZones={!activeOrder}
                  onRecenter={() => setRiderPos(defaultRiderPos)}
                />
              </div>

              {/* External Google Maps Turn-by-Turn Button */}
              {activeOrder ? (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(activeOrder.pickupAddress || 'Adoni')}&destination=${encodeURIComponent(activeOrder.dropAddress || 'Adoni')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: '#111D2E',
                    border: '1px solid #1F3047',
                    borderRadius: '12px',
                    padding: '12px',
                    color: '#FF8A00',
                    fontWeight: '800',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ExternalLink size={16} />
                  <span>Launch Google Maps Turn-by-Turn GPS</span>
                </a>
              ) : (
                <div style={{
                  fontSize: '12px',
                  color: '#94A3B8',
                  textAlign: 'center',
                  padding: '8px 0'
                }}>
                  Showing active delivery zones around Adoni Station & Town Hub
                </div>
              )}
            </div>

            {/* Rider Station & Vehicle Card */}
            <div className="rider-card">
              <h4 style={{ fontSize: '15px', fontWeight: '900', color: '#FFFFFF', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="#FF8A00" />
                <span>Station & Fleet Details</span>
              </h4>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                backgroundColor: '#111D2E',
                border: '1px solid #1F3047',
                borderRadius: '14px',
                padding: '14px'
              }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' }}>
                    Registered Vehicle
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#FFFFFF', marginTop: '2px' }}>
                    {user?.riderProfile?.vehicleType?.toUpperCase() || 'MOTORCYCLE'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#FF8A00', fontWeight: '700', marginTop: '1px' }}>
                    {user?.riderProfile?.vehicleNumber || 'AP 21 REG'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' }}>
                    Operating Station
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#FFFFFF', marginTop: '2px' }}>
                    Adoni Central
                  </div>
                  <div style={{ fontSize: '11px', color: '#10B981', fontWeight: '700', marginTop: '1px' }}>
                    Active Hub
                  </div>
                </div>
              </div>

              {/* Hub Dispatch Helpline */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 0'
              }}>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                  Need assistance on the road?
                </div>
                <a
                  href="tel:1800123456"
                  style={{
                    color: '#FF8A00',
                    fontSize: '12px',
                    fontWeight: '800',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Phone size={13} />
                  <span>Call Dispatcher</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
