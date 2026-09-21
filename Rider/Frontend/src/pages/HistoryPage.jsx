import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { 
  Clock, 
  Calendar, 
  Search, 
  Package, 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  TrendingUp, 
  X, 
  ArrowLeft,
  Truck,
  Power,
  ShieldCheck,
  SlidersHorizontal,
  LogOut,
  ExternalLink
} from 'lucide-react';

const HistoryPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isLight } = useTheme();
  const { user, logout } = useAuth();

  const [selectedPeriod, setSelectedPeriod] = useState('all_time');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTripModal, setSelectedTripModal] = useState(null);
  const [allTripsData, setAllTripsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/rider/orders');
      
      const formatted = (res.data?.data || []).map((order) => {
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

        const totalAmt = Number(order.totalAmount ?? order.totalPrice ?? 0);
        const earningsNum = Math.round(totalAmt * 0.8);
        const customerName = order.customer?.firstName 
          ? `${order.customer.firstName} ${order.customer.lastName || ''}`.trim()
          : (order.customerName || 'Customer');

        return {
          id: order.trackingId || `#${order.id.substring(0, 8).toUpperCase()}`,
          rawId: order.id,
          serviceType: order.serviceType || 'PARCEL EXPRESS',
          period,
          pickup: order.pickupAddress || 'Adoni Hub Store',
          drop: order.dropAddress || 'Destination Address',
          pickupLandmark: order.pickupLandmark,
          dropLandmark: order.dropLandmark,
          distance: order.distanceKm ? `${order.distanceKm} km` : 'Adoni Local',
          distVal: Number(order.distanceKm || 0),
          earnings: earningsNum,
          totalAmount: totalAmt,
          time: orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: orderDate.toLocaleDateString(),
          status: order.status,
          paymentStatus: order.payment?.status || 'PAID',
          customer: customerName,
          customerPhone: order.customer?.phone
        };
      });

      setAllTripsData(formatted);
    } catch (error) {
      console.error('Failed to load rider trip history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter based on period tab
  const periodTrips = allTripsData.filter((trip) => {
    if (selectedPeriod === 'today') return trip.period === 'today';
    if (selectedPeriod === 'yesterday') return trip.period === 'yesterday';
    if (selectedPeriod === 'this_week') return trip.period === 'today' || trip.period === 'yesterday' || trip.period === 'this_week';
    return true;
  });

  // Filter based on search query
  const filteredTrips = periodTrips.filter((trip) =>
    trip.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trip.pickup.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trip.drop.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trip.customer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Summary Metrics
  const totalEarnings = periodTrips.reduce((sum, t) => sum + t.earnings, 0);
  const totalTripsCount = periodTrips.length;
  const totalDistance = periodTrips.reduce((sum, t) => sum + t.distVal, 0).toFixed(1);
  const avgPayout = totalTripsCount > 0 ? Math.round(totalEarnings / totalTripsCount) : 0;

  const riderName = user?.riderProfile?.firstName
    ? `${user.riderProfile.firstName} ${user.riderProfile.lastName || ''}`.trim()
    : (user?.name || 'Rider Partner');

  return (
    <div className="rider-app-shell">
      {/* ================= TOP NAVBAR HUD ================= */}
      <header className="rider-top-navbar">
        <div className="rider-navbar-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '0.04em', color: '#FFFFFF', lineHeight: 1 }}>
                <span style={{ color: '#FF8A00' }}>D</span>PARCELS
              </div>
              <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.14em', color: '#FF8A00', marginTop: '3px' }}>
                TRIP HISTORY & EARNINGS
              </span>
            </div>
          </div>

          <nav className="desktop-nav-links rider-nav-links">
            <Link to="/home" className="rider-nav-btn">
              <Truck size={16} />
              <span>Command Center</span>
            </Link>
            <Link to="/history" className="rider-nav-btn active">
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => navigate('/home')}
              className="primary-orange-btn"
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to Dispatch</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTENT AREA ================= */}
      <main className="rider-content-container">
        {/* TOP SUMMARY 4-CARD HUD */}
        <section className="rider-kpi-grid">
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
              fontWeight: '900',
              fontSize: '20px'
            }}>
              ₹
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#FFFFFF', lineHeight: 1.1 }}>
                ₹{totalEarnings}
              </div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', marginTop: '3px' }}>
                Period Earnings (80% Share)
              </div>
            </div>
          </div>

          <div className="rider-kpi-card">
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3B82F6'
            }}>
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#FFFFFF', lineHeight: 1.1 }}>
                {totalTripsCount} Trips
              </div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', marginTop: '3px' }}>
                Deliveries in Period
              </div>
            </div>
          </div>

          <div className="rider-kpi-card">
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981'
            }}>
              <Navigation size={22} />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#FFFFFF', lineHeight: 1.1 }}>
                {totalDistance} km
              </div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', marginTop: '3px' }}>
                Total Distance Covered
              </div>
            </div>
          </div>

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
              color: '#FF8A00'
            }}>
              <TrendingUp size={22} />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#FFFFFF', lineHeight: 1.1 }}>
                ₹{avgPayout}
              </div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', marginTop: '3px' }}>
                Average Payout / Trip
              </div>
            </div>
          </div>
        </section>

        {/* FILTERS & SEARCH ROW */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px'
        }}>
          {/* Timeframe Segmented Control Tabs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#0D1624',
            border: '1px solid #1E2D42',
            borderRadius: '14px',
            padding: '4px',
            gap: '4px'
          }}>
            {[
              { id: 'all_time', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'this_week', label: 'This Week' }
            ].map((tab) => {
              const isActive = selectedPeriod === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedPeriod(tab.id)}
                  style={{
                    backgroundColor: isActive ? '#FF8A00' : 'transparent',
                    color: isActive ? '#000000' : '#94A3B8',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '8px 18px',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Input Field */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '340px'
          }}>
            <Search size={16} color="#64748B" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by Tracking ID, Address, or Customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#0D1624',
                border: '1px solid #1E2D42',
                borderRadius: '12px',
                padding: '10px 14px 10px 38px',
                color: '#FFFFFF',
                fontSize: '13px',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* TRIPS LIST */}
        <div className="rider-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#FFFFFF', margin: 0 }}>
              Completed & Assigned Deliveries ({filteredTrips.length})
            </h3>
            <button
              onClick={fetchHistory}
              style={{
                background: 'none',
                border: 'none',
                color: '#FF8A00',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Refresh History
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
              Loading trip history...
            </div>
          ) : filteredTrips.length === 0 ? (
            <div style={{
              backgroundColor: '#111D2E',
              border: '1px dashed #1F3047',
              borderRadius: '16px',
              padding: '40px 20px',
              textAlign: 'center',
              color: '#94A3B8'
            }}>
              <Package size={36} color="#64748B" style={{ marginBottom: '10px' }} />
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF' }}>No Trips Found</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Completed delivery trips will be automatically recorded here with payout breakdown.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredTrips.map((trip) => (
                <div
                  key={trip.rawId}
                  onClick={() => setSelectedTripModal(trip)}
                  style={{
                    backgroundColor: '#111D2E',
                    border: '1px solid #1F3047',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 138, 0, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#1F3047';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Left: ID + Category + Customer */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '220px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      backgroundColor: trip.status === 'DELIVERED' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 138, 0, 0.12)',
                      border: `1px solid ${trip.status === 'DELIVERED' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 138, 0, 0.3)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: trip.status === 'DELIVERED' ? '#10B981' : '#FF8A00'
                    }}>
                      <Package size={20} />
                    </div>

                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '900', color: '#FFFFFF' }}>
                        {trip.id}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                        {trip.customer} • {trip.serviceType}
                      </div>
                    </div>
                  </div>

                  {/* Center: Route Snippet */}
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#FFFFFF' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3B82F6' }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                        {trip.pickup}
                      </span>
                      <span style={{ color: '#64748B' }}>→</span>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FF8A00' }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                        {trip.drop}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                      {trip.date} at {trip.time} • {trip.distance}
                    </div>
                  </div>

                  {/* Right: Earnings & Status Pill */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: '#FF8A00' }}>
                        ₹{trip.earnings}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '700' }}>
                        Payout (80%)
                      </div>
                    </div>

                    <div style={{
                      backgroundColor: trip.status === 'DELIVERED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 138, 0, 0.15)',
                      border: `1px solid ${trip.status === 'DELIVERED' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 138, 0, 0.4)'}`,
                      color: trip.status === 'DELIVERED' ? '#10B981' : '#FF8A00',
                      padding: '6px 12px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '800',
                      textTransform: 'uppercase'
                    }}>
                      {trip.status?.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ================= TRIP DETAIL MODAL ================= */}
      {selectedTripModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(6, 11, 19, 0.85)',
          backdropFilter: 'blur(12px)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '520px',
            backgroundColor: '#0D1624',
            border: '1px solid #1E2D42',
            borderRadius: '22px',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#FFFFFF', margin: 0 }}>
                  Trip Details
                </h3>
                <span style={{ fontSize: '12px', color: '#FF8A00', fontWeight: '800' }}>
                  {selectedTripModal.id}
                </span>
              </div>

              <button
                onClick={() => setSelectedTripModal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Payout Breakdown */}
            <div style={{
              backgroundColor: '#111D2E',
              border: '1px solid #1F3047',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700' }}>Net Rider Payout</div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#FF8A00', marginTop: '2px' }}>
                  ₹{selectedTripModal.earnings}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700' }}>Customer Total</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#FFFFFF', marginTop: '2px' }}>
                  ₹{selectedTripModal.totalAmount}
                </div>
              </div>
            </div>

            {/* Route Details */}
            <div style={{
              backgroundColor: '#111D2E',
              border: '1px solid #1F3047',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: '#3B82F6', fontWeight: '800', textTransform: 'uppercase' }}>
                  Pickup Address
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF', marginTop: '2px' }}>
                  {selectedTripModal.pickup}
                </div>
              </div>

              <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.06)' }} />

              <div>
                <div style={{ fontSize: '11px', color: '#FF8A00', fontWeight: '800', textTransform: 'uppercase' }}>
                  Dropoff Address
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF', marginTop: '2px' }}>
                  {selectedTripModal.drop}
                </div>
              </div>
            </div>

            {/* Customer & Timestamp Details */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              fontSize: '12px'
            }}>
              <div style={{ backgroundColor: '#111D2E', padding: '12px', borderRadius: '12px', border: '1px solid #1F3047' }}>
                <div style={{ color: '#94A3B8', fontSize: '10px', fontWeight: '700' }}>CUSTOMER</div>
                <div style={{ color: '#FFFFFF', fontWeight: '800', marginTop: '2px' }}>{selectedTripModal.customer}</div>
              </div>

              <div style={{ backgroundColor: '#111D2E', padding: '12px', borderRadius: '12px', border: '1px solid #1F3047' }}>
                <div style={{ color: '#94A3B8', fontSize: '10px', fontWeight: '700' }}>COMPLETED ON</div>
                <div style={{ color: '#FFFFFF', fontWeight: '800', marginTop: '2px' }}>{selectedTripModal.date} {selectedTripModal.time}</div>
              </div>
            </div>

            <button
              onClick={() => setSelectedTripModal(null)}
              className="primary-orange-btn"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '14px',
                borderRadius: '12px'
              }}
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
