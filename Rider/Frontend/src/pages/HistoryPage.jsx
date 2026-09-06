import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Calendar, 
  Clock, 
  User,
  Home,
  CheckCircle2,
  TrendingUp,
  Search,
  Navigation,
  X,
  Award,
  Package,
  Flame
} from 'lucide-react';
import api from '../utils/api';

const HistoryPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isLight, themeColors } = useTheme();
  
  // Filter States
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTripModal, setSelectedTripModal] = useState(null);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);

  const [allTripsData, setAllTripsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders');
      
      const formatted = res.data.data.map(order => {
        // Simple logic to map dates to period string
        const today = new Date();
        const orderDate = new Date(order.createdAt);
        let period = 'all_time';
        if (orderDate.toDateString() === today.toDateString()) {
          period = 'today';
        } else {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          if (orderDate.toDateString() === yesterday.toDateString()) {
            period = 'yesterday';
          } else if (today - orderDate < 7 * 24 * 60 * 60 * 1000) {
            period = 'this_week';
          }
        }

        return {
          id: `#${order.id.substring(0, 6).toUpperCase()}`,
          period,
          pickup: order.pickupLocation,
          drop: order.dropLocation,
          distance: 'N/A km',
          distVal: 0,
          duration: 'N/A',
          baseFare: `₹${(order.totalPrice * 0.8).toFixed(0)}`, // Example
          bonus: '₹0',
          earnings: (order.totalPrice * 0.8).toFixed(0),
          time: orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: order.status,
          paymentMethod: 'UPI/Cash',
          customer: order.customer?.customerProfile?.firstName || 'Customer'
        };
      });
      setAllTripsData(formatted);
    } catch (error) {
      console.error('Failed to load history', error);
    } finally {
      setLoading(false);
    }
  };

  // 1. Filter trips based on timeframe selection
  const periodTrips = allTripsData.filter(trip => {
    if (selectedPeriod === 'today') return trip.period === 'today';
    if (selectedPeriod === 'yesterday') return trip.period === 'yesterday';
    if (selectedPeriod === 'this_week') return trip.period === 'today' || trip.period === 'yesterday' || trip.period === 'this_week';
    if (selectedPeriod === 'all_time') return true;
    return true;
  });

  // 2. Filter based on search query
  const filteredTrips = periodTrips.filter(trip => 
    trip.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trip.pickup.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trip.drop.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trip.customer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 3. Dynamic Summary Calculations
  const totalEarnings = periodTrips.reduce((sum, t) => sum + t.earnings, 0);
  const totalTripsCount = periodTrips.length;
  const totalDistance = periodTrips.reduce((sum, t) => sum + t.distVal, 0).toFixed(1);
  const avgPayout = totalTripsCount > 0 ? (totalEarnings / totalTripsCount).toFixed(1) : 0;

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

        {/* ================= 1. HEADER SECTION ================= */}
        <div style={{
          backgroundColor: themeColors.headerBg,
          borderBottom: `1px solid ${themeColors.border}`,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 20
        }}>
          <div>
            <h1 style={{
              fontSize: '20px',
              fontWeight: '900',
              color: themeColors.text,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Clock size={22} color="#FF8A00" />
              <span>{t('tripHistory')}</span>
            </h1>
            <p style={{ fontSize: '11px', color: themeColors.subText, margin: '2px 0 0 0' }}>
              {t('historySubtitle')}
            </p>
          </div>

          {/* Calendar Date Picker Button */}
          <button 
            onClick={() => setShowDatePickerModal(true)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: themeColors.cardBg,
              border: `1px solid ${themeColors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FF8A00',
              cursor: 'pointer'
            }}
          >
            <Calendar size={18} />
          </button>
        </div>

        {/* ================= MAIN SCROLLABLE CONTENT ================= */}
        <div style={{
          flex: 1,
          padding: '14px 14px 80px 14px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>

          {/* 2. TIMEFRAME SEGMENTED CONTROL TAB BAR */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '4px',
            backgroundColor: themeColors.cardBg,
            border: `1px solid ${themeColors.border}`,
            borderRadius: '14px',
            padding: '4px',
            width: '100%'
          }}>
            {[
              { id: 'today', label: t('today') },
              { id: 'yesterday', label: t('yesterday') },
              { id: 'this_week', label: t('thisWeek') },
              { id: 'all_time', label: t('allTime') }
            ].map((tab) => {
              const isActive = selectedPeriod === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedPeriod(tab.id)}
                  style={{
                    backgroundColor: isActive ? '#FF8A00' : 'transparent',
                    color: isActive ? '#000000' : themeColors.subText,
                    border: 'none',
                    borderRadius: '10px',
                    padding: '8px 2px',
                    fontSize: '11px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 2px 8px rgba(255, 138, 0, 0.3)' : 'none'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* 3. ADVANCED SUMMARY METRIC CARDS (2x2 GRID) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            width: '100%'
          }}>
            {/* Metric Card 1: Total Earnings */}
            <div style={{
              backgroundColor: themeColors.cardBg,
              border: `1px solid ${themeColors.border}`,
              borderRadius: '18px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: isLight ? '0 4px 14px rgba(0,0,0,0.05)' : '0 4px 16px rgba(0,0,0,0.4)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', color: themeColors.subText, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t('totalEarnings')}
                </span>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 138, 0, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FF8A00',
                  fontSize: '13px',
                  fontWeight: '900'
                }}>
                  ₹
                </div>
              </div>

              <div>
                <div style={{ fontSize: '22px', fontWeight: '900', color: themeColors.text, lineHeight: '1' }}>
                  ₹{totalEarnings}
                </div>
                <div style={{ fontSize: '10px', color: '#10B981', fontWeight: '700', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <TrendingUp size={12} />
                  <span>{t('allSettled')}</span>
                </div>
              </div>
            </div>

            {/* Metric Card 2: Completed Trips */}
            <div style={{
              backgroundColor: themeColors.cardBg,
              border: `1px solid ${themeColors.border}`,
              borderRadius: '18px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: isLight ? '0 4px 14px rgba(0,0,0,0.05)' : '0 4px 16px rgba(0,0,0,0.4)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', color: themeColors.subText, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t('tripsDone')}
                </span>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981'
                }}>
                  <CheckCircle2 size={15} />
                </div>
              </div>

              <div>
                <div style={{ fontSize: '22px', fontWeight: '900', color: themeColors.text, lineHeight: '1' }}>
                  {totalTripsCount}
                </div>
                <div style={{ fontSize: '10px', color: themeColors.subText, fontWeight: '600', marginTop: '6px' }}>
                  100% On-time
                </div>
              </div>
            </div>

            {/* Metric Card 3: Distance Covered */}
            <div style={{
              backgroundColor: themeColors.cardBg,
              border: `1px solid ${themeColors.border}`,
              borderRadius: '18px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: isLight ? '0 4px 14px rgba(0,0,0,0.05)' : '0 4px 16px rgba(0,0,0,0.4)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', color: themeColors.subText, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t('totalDistance')}
                </span>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#3B82F6'
                }}>
                  <Navigation size={14} />
                </div>
              </div>

              <div>
                <div style={{ fontSize: '22px', fontWeight: '900', color: themeColors.text, lineHeight: '1' }}>
                  {totalDistance} km
                </div>
                <div style={{ fontSize: '10px', color: themeColors.subText, fontWeight: '600', marginTop: '6px' }}>
                  {t('distance')}
                </div>
              </div>
            </div>

            {/* Metric Card 4: Avg Payout */}
            <div style={{
              backgroundColor: themeColors.cardBg,
              border: `1px solid ${themeColors.border}`,
              borderRadius: '18px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: isLight ? '0 4px 14px rgba(0,0,0,0.05)' : '0 4px 16px rgba(0,0,0,0.4)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', color: themeColors.subText, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t('avgPayout')}
                </span>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 138, 0, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FF8A00'
                }}>
                  <Award size={15} />
                </div>
              </div>

              <div>
                <div style={{ fontSize: '22px', fontWeight: '900', color: '#FF8A00', lineHeight: '1' }}>
                  ₹{avgPayout}
                </div>
                <div style={{ fontSize: '10px', color: themeColors.subText, fontWeight: '600', marginTop: '6px' }}>
                  Per trip
                </div>
              </div>
            </div>
          </div>

          {/* 4. SEARCH & FILTER BAR */}
          <div style={{
            backgroundColor: themeColors.cardBg,
            border: `1px solid ${themeColors.border}`,
            borderRadius: '14px',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Search size={16} color={themeColors.subText} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                color: themeColors.text,
                fontSize: '13px',
                width: '100%',
                fontWeight: '500'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', color: themeColors.subText, cursor: 'pointer', padding: '2px' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* 5. LIST OF COMPLETED TRIP CARDS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingLeft: '2px'
            }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: themeColors.subText, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {t('completedDeliveries')} ({filteredTrips.length})
              </span>
              <span style={{ fontSize: '11px', color: '#10B981', fontWeight: '700' }}>
                ✓ {t('allSettled')}
              </span>
            </div>

            {filteredTrips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => setSelectedTripModal(trip)}
                style={{
                  backgroundColor: themeColors.cardBg,
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: '20px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  cursor: 'pointer',
                  boxShadow: isLight ? '0 4px 14px rgba(0,0,0,0.05)' : '0 6px 20px rgba(0,0,0,0.4)'
                }}
              >
                {/* Trip Card Top Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '900', color: themeColors.text }}>
                      #{trip.id}
                    </span>
                    <span style={{ fontSize: '11px', color: themeColors.subText }}>• {trip.time}</span>
                  </div>

                  {/* Completed Green Badge */}
                  <div style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#10B981',
                    fontSize: '10px',
                    fontWeight: '800',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <CheckCircle2 size={12} />
                    <span>{t('completed')}</span>
                  </div>
                </div>

                {/* Address Route Timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6', flexShrink: 0 }} />
                    <div style={{ fontSize: '12px', color: themeColors.text, fontWeight: '600' }}>
                      {trip.pickup}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FF8A00', flexShrink: 0 }} />
                    <div style={{ fontSize: '12px', color: themeColors.text, fontWeight: '800' }}>
                      {trip.drop}
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: `1px solid ${themeColors.innerBorder}`,
                  paddingTop: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ backgroundColor: themeColors.cardSecondary, padding: '4px 8px', borderRadius: '8px', fontSize: '10px', color: themeColors.subText, fontWeight: '700' }}>
                      {trip.distance}
                    </span>
                    <span style={{ backgroundColor: themeColors.cardSecondary, padding: '4px 8px', borderRadius: '8px', fontSize: '10px', color: themeColors.subText, fontWeight: '700' }}>
                      {trip.duration}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: themeColors.subText }}>{t('earnings')}:</span>
                    <span style={{ fontSize: '17px', fontWeight: '900', color: '#FF8A00' }}>
                      ₹{trip.earnings}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* ================= 6. FIXED BOTTOM NAVIGATION BAR ================= */}
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
          {/* Tab 1: Home */}
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
              color: themeColors.subText
            }}
          >
            <Home size={18} color={themeColors.subText} />
            <span style={{ fontSize: '11px', fontWeight: '700' }}>{t('home')}</span>
          </button>

          {/* Tab 2: History (Active) */}
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
              color: '#FF8A00'
            }}
          >
            <Package size={18} color="#FF8A00" />
            <span style={{ fontSize: '11px', fontWeight: '800' }}>{t('history')}</span>
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

export default HistoryPage;
