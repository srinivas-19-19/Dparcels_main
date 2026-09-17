import React, { useState, useEffect } from 'react';
import dashboardService from '../utils/dashboardService';

export const NotificationDrawer = ({ isOpen, onClose, onNotificationUpdate }) => {
  const [pushEnabled, setPushEnabled] = useState(() => {
    return localStorage.getItem('pushNotificationsEnabled') !== 'false';
  });

  const [nearbyEnabled, setNearbyEnabled] = useState(() => {
    return localStorage.getItem('nearbyNotificationsEnabled') !== 'false';
  });

  const [dbNotifications, setDbNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const items = await dashboardService.getNotifications();
      setDbNotifications(items || []);
    } catch (err) {
      console.warn('[NotificationDrawer] Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handlePushToggle = (val) => {
    setPushEnabled(val);
    localStorage.setItem('pushNotificationsEnabled', val ? 'true' : 'false');
  };

  const handleNearbyToggle = (val) => {
    setNearbyEnabled(val);
    localStorage.setItem('nearbyNotificationsEnabled', val ? 'true' : 'false');
  };

  const handleMarkAsRead = async (id) => {
    try {
      await dashboardService.markNotificationAsRead(id);
      setDbNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      if (onNotificationUpdate) onNotificationUpdate();
    } catch (err) {
      console.warn('[NotificationDrawer] Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await dashboardService.markAllNotificationsAsRead();
      setDbNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      if (onNotificationUpdate) onNotificationUpdate();
    } catch (err) {
      console.warn('[NotificationDrawer] Error marking all as read:', err);
    }
  };

  if (!isOpen) return null;

  // Format relative timestamp
  const formatTime = (isoString) => {
    if (!isoString) return 'Just now';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  // Build combined notification list
  const combinedList = [];

  // 1. Add DB notifications if any
  dbNotifications.forEach((item) => {
    let icon = '🔔';
    if (item.type === 'ORDER') icon = '📦';
    else if (item.type === 'PROMO') icon = '🏷️';
    else if (item.type === 'RIDER') icon = '🏍️';

    combinedList.push({
      id: item.id,
      icon,
      title: item.title,
      desc: item.body || item.message,
      time: formatTime(item.createdAt),
      isRead: item.isRead,
      isDbItem: true,
    });
  });

  // 2. Add local system alerts based on toggles if list is empty or complementary
  if (nearbyEnabled) {
    combinedList.push({
      id: 'local_nearby',
      icon: '📍',
      title: 'Nearby Delivery Partner Active',
      desc: 'Riders are currently online near your area ready for pickup.',
      time: 'Live',
      isRead: true,
      isDbItem: false,
    });
  }

  if (pushEnabled && dbNotifications.length === 0) {
    combinedList.push(
      {
        id: 'local_welcome',
        icon: '🎉',
        title: 'Welcome to DPARCELS!',
        desc: 'Your account is active. Request food, medicine, groceries & errands anytime.',
        time: 'Today',
        isRead: true,
        isDbItem: false,
      },
      {
        id: 'local_promo',
        icon: '🏷️',
        title: '20% OFF Coupon Activated',
        desc: 'Use promo code DPARCEL20 at checkout for your first order discount.',
        time: 'Available',
        isRead: true,
        isDbItem: false,
      }
    );
  }

  const unreadCount = dbNotifications.filter((n) => !n.isRead).length;

  return (
    <div className="modal-overlay side-drawer-overlay active">
      <div className="side-drawer-content">
        <div className="side-drawer-header">
          <div>
            <h2 className="modal-service-header" style={{ margin: 0 }}>
              NOTIFICATIONS <span style={{ color: 'var(--primary-orange-light)' }}>CENTER</span>
            </h2>
            {unreadCount > 0 && (
              <span style={{ fontSize: 11, color: '#FF8800', fontWeight: 700 }}>
                {unreadCount} new notification{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary-orange-light, #FF8800)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Mark all read
              </button>
            )}
            <i
              className="fa-solid fa-xmark"
              style={{ cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}
              onClick={onClose}
            ></i>
          </div>
        </div>

        {/* Push Notification Toggle */}
        <div className="notif-toggle-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="notif-icon-box">
              <i className="fa-solid fa-bell"></i>
            </div>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                Push Notifications
                <span style={{ fontSize: 9, padding: '2px 6px', background: 'var(--orange-gradient)', color: '#ffffff', borderRadius: 8, fontWeight: 900 }}>LIVE</span>
              </h4>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Receive delivery & promo updates</p>
            </div>
          </div>
          <label className="switch-toggle">
            <input
              type="checkbox"
              checked={pushEnabled}
              onChange={(e) => handlePushToggle(e.target.checked)}
            />
            <span className="switch-slider"></span>
          </label>
        </div>

        {/* Nearby Notifications Toggle */}
        <div className="notif-toggle-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="notif-icon-box" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
              <i className="fa-solid fa-location-crosshairs"></i>
            </div>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                Nearby Notifications
                <span style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', borderRadius: 8, fontWeight: 900 }}>NEARBY</span>
              </h4>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Alerts when rider or delivery is nearby</p>
            </div>
          </div>
          <label className="switch-toggle">
            <input
              type="checkbox"
              checked={nearbyEnabled}
              onChange={(e) => handleNearbyToggle(e.target.checked)}
            />
            <span className="switch-slider"></span>
          </label>
        </div>

        {/* Notification Cards */}
        <div style={{ marginTop: 12 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 24, marginBottom: 8 }}></i>
              <p style={{ fontSize: 12 }}>Loading alerts...</p>
            </div>
          ) : combinedList.length === 0 ? (
            <div className="empty-state">
              <i className="fa-solid fa-bell-slash empty-icon" style={{ fontSize: 38 }}></i>
              <h3 style={{ fontSize: 14 }}>Notifications Off</h3>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Turn on toggles above to view alerts.</p>
            </div>
          ) : (
            combinedList.map((item) => (
              <div
                key={item.id}
                className="notif-item"
                style={{
                  position: 'relative',
                  opacity: item.isRead ? 0.75 : 1,
                  cursor: item.isDbItem && !item.isRead ? 'pointer' : 'default',
                  border: item.isRead ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255, 136, 0, 0.3)',
                }}
                onClick={() => {
                  if (item.isDbItem && !item.isRead) {
                    handleMarkAsRead(item.id);
                  }
                }}
              >
                {!item.isRead && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#FF8800',
                    }}
                  ></span>
                )}
                <div className="notif-item-icon">{item.icon}</div>
                <div style={{ flex: 1, paddingRight: 10 }}>
                  <div className="notif-item-title">{item.title}</div>
                  <div className="notif-item-desc">{item.desc}</div>
                  <div className="notif-item-time">{item.time}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;
