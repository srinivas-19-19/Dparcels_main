import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { HowItWorks } from '../components/HowItWorks';
import { PromoCard } from '../components/PromoCard';
import { ServiceCards } from '../components/ServiceCards';
import { SavedAddressesModal } from '../components/SavedAddressesModal';
import RiderPaymentModal from '../components/RiderPaymentModal';
import OrderDetailModal from '../components/OrderDetailModal';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import dashboardService from '../utils/dashboardService';

const formatOrderStatus = (status) => {
  switch (status) {
    case 'CONFIRMED':
    case 'PAYMENT_PENDING':
      return 'Order Placed • Finding Rider';
    case 'ASSIGNING':
      return 'Assigning Delivery Partner';
    case 'RIDER_ASSIGNED':
    case 'ACCEPTED':
      return 'Rider Assigned • Heading to Pickup';
    case 'ARRIVED_PICKUP':
      return 'Rider at Pickup Location';
    case 'PICKED_UP':
    case 'IN_TRANSIT':
      return 'Package Picked Up • In Transit';
    case 'OUT_FOR_DELIVERY':
      return 'Out for Delivery • Arriving Soon';
    default:
      return status ? status.replace(/_/g, ' ') : 'Order in Progress';
  }
};

export const HomeView = ({
  onOpenLanguage,
  onOpenNotifications,
  onSelectService,
  onNavigateOrders,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeOrderDetailId, setActiveOrderDetailId] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const data = await dashboardService.getHomeDashboard();
      if (data) {
        setDashboard(data);
      }
    } catch (err) {
      console.warn('[HomeView] Notice fetching dashboard:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();

    const handleRefresh = () => fetchDashboard();
    window.addEventListener('dparcels:refreshDashboard', handleRefresh);
    window.addEventListener('dparcels:orderCreated', handleRefresh);

    return () => {
      window.removeEventListener('dparcels:refreshDashboard', handleRefresh);
      window.removeEventListener('dparcels:orderCreated', handleRefresh);
    };
  }, [fetchDashboard]);

  const customerName =
    dashboard?.customer?.firstName ||
    user?.customerProfile?.firstName ||
    'Customer';

  const rawGreeting = t('greeting') || 'NAMASTE, <span>SRINU</span>';
  const dynamicGreeting = rawGreeting.replace(
    /<span>(.*?)<\/span>/i,
    `<span>${customerName.toUpperCase()}</span>`
  );

  const defaultAddress = dashboard?.defaultAddress;
  const activeOrder = dashboard?.activeOrder;
  const unreadCount = dashboard?.stats?.unreadNotificationsCount || 0;

  const handleSelectServiceWithActiveCheck = (serviceType) => {
    if (activeOrder) {
      alert(`You already have an active order (#${activeOrder.trackingId}) in progress. Only one active order can be placed at a time.`);
      setActiveOrderDetailId(activeOrder.id);
      return;
    }
    onSelectService(serviceType);
  };

  return (
    <div className="view-container">
      {/* Top Header with dynamic notification dot */}
      <Header
        onOpenLanguage={onOpenLanguage}
        onOpenNotifications={onOpenNotifications}
        hasUnreadNotif={unreadCount > 0}
      />

      {/* Deliver To Location Bar */}
      <div
        className="home-delivery-bar"
        onClick={() => setIsAddressModalOpen(true)}
        title="Change delivery location"
      >
        <div className="delivery-bar-icon">
          <i
            className={
              defaultAddress?.label === 'Home'
                ? 'fa-solid fa-house'
                : defaultAddress?.label === 'Work'
                ? 'fa-solid fa-briefcase'
                : 'fa-solid fa-location-dot'
            }
          ></i>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              display: 'block',
            }}
          >
            Deliver To
          </span>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-main, #ffffff)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {defaultAddress ? (
              <>
                <span style={{ color: '#FF8800', marginRight: 4 }}>
                  {defaultAddress.label}
                </span>
                • {defaultAddress.streetAddress}, {defaultAddress.city}
              </>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>
                Select delivery address
              </span>
            )}
          </div>
        </div>
        <i
          className="fa-solid fa-chevron-down"
          style={{ fontSize: 11, color: 'var(--text-muted)' }}
        ></i>
      </div>

      {/* Greeting Title */}
      <h1
        className="greeting-title"
        dangerouslySetInnerHTML={{ __html: dynamicGreeting }}
      ></h1>
      <p className="subtitle">{t('subtitle')}</p>

      {/* Live Ongoing Active Order Card (Visible if active order exists) */}
      {activeOrder && (
        <div
          className="home-active-order-card"
          onClick={() => {
            if (onNavigateOrders) onNavigateOrders(activeOrder);
            else window.dispatchEvent(new CustomEvent('dparcels:navigate', { detail: 'orders' }));
          }}
          title="Click to track live order"
        >
          <div className="active-order-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pulsing-live-dot"></span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#FF8800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                LIVE ORDER IN PROGRESS
              </span>
            </div>
            <span className="active-order-tracking-id">
              {activeOrder.trackingId}
            </span>
          </div>

          <div className="active-order-body">
            <div className="active-order-status-badge">
              <i className="fa-solid fa-motorcycle" style={{ color: '#FF8800' }}></i>
              <span>{formatOrderStatus(activeOrder.status)}</span>
            </div>

            <div className="active-order-route">
              <span className="route-pickup">
                {activeOrder.pickupAddress?.split(',')[0] || 'Pickup'}
              </span>
              <i
                className="fa-solid fa-arrow-right"
                style={{ fontSize: 10, color: 'var(--text-muted)' }}
              ></i>
              <span className="route-drop">
                {activeOrder.dropAddress?.split(',')[0] || 'Dropoff'}
              </span>
            </div>

            {activeOrder.rider && (
              <div className="active-order-rider">
                <i className="fa-solid fa-helmet-safety"></i>
                <span>
                  Rider: {activeOrder.rider.firstName} • {activeOrder.rider.vehicleNumber || 'Bike'} (★{activeOrder.rider.rating || '5.0'})
                </span>
              </div>
            )}
          </div>

          <div className="active-order-footer">
            <span>ETA ~{activeOrder.estimatedTimeMins || 20} mins</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {activeOrder.rider && (
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(true)}
                  style={{
                    background: 'linear-gradient(135deg, #FF8800 0%, #FF5500 100%)',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: 10,
                    padding: '5px 12px',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 8px rgba(255, 136, 0, 0.3)'
                  }}
                >
                  <i className="fa-solid fa-qrcode"></i>
                  <span>Pay Rider / QR</span>
                </button>
              )}
              <button type="button" className="btn-track-live" onClick={() => {
                if (activeOrder?.id) setActiveOrderDetailId(activeOrder.id);
                else if (onNavigateOrders) onNavigateOrders();
              }}>
                <span>Track Live</span>
                <i className="fa-solid fa-chevron-right" style={{ fontSize: 10 }}></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How it Works Section */}
      <HowItWorks />

      {/* Promo Card Carousel from Backend Banners */}
      <PromoCard
        onClaim={() => handleSelectServiceWithActiveCheck('food')}
        banners={dashboard?.banners}
      />

      {/* Services Grid */}
      <h3 className="section-heading">{t('services_heading')}</h3>
      <ServiceCards onSelectService={handleSelectServiceWithActiveCheck} />

      {/* Saved Addresses Modal directly launchable from Delivery Bar */}
      <SavedAddressesModal
        isOpen={isAddressModalOpen}
        onClose={() => {
          setIsAddressModalOpen(false);
          fetchDashboard();
        }}
      />

      {/* Rider Payment Modal for active order */}
      {activeOrder && (
        <RiderPaymentModal
          isOpen={isPaymentModalOpen}
          order={{ ...activeOrder, rawId: activeOrder.id, price: activeOrder.totalAmount }}
          onClose={() => {
            setIsPaymentModalOpen(false);
            fetchDashboard();
          }}
        />
      )}

      {/* Order Detail Modal (Track Live) */}
      <OrderDetailModal
        isOpen={Boolean(activeOrderDetailId)}
        orderId={activeOrderDetailId}
        onClose={() => {
          setActiveOrderDetailId(null);
          fetchDashboard();
        }}
        onReorder={(prefillData) => {
          setActiveOrderDetailId(null);
          window.dispatchEvent(new CustomEvent('dparcels:reorder', { detail: prefillData }));
        }}
      />
    </div>
  );
};

export default HomeView;
