import React, { useState } from 'react';

export const NotificationDrawer = ({ isOpen, onClose }) => {
  const [pushEnabled, setPushEnabled] = useState(() => {
    return localStorage.getItem('pushNotificationsEnabled') !== 'false';
  });

  const [nearbyEnabled, setNearbyEnabled] = useState(() => {
    return localStorage.getItem('nearbyNotificationsEnabled') !== 'false';
  });

  const handlePushToggle = (val) => {
    setPushEnabled(val);
    localStorage.setItem('pushNotificationsEnabled', val ? 'true' : 'false');
  };

  const handleNearbyToggle = (val) => {
    setNearbyEnabled(val);
    localStorage.setItem('nearbyNotificationsEnabled', val ? 'true' : 'false');
  };

  if (!isOpen) return null;

  const notifications = [];

  if (nearbyEnabled) {
    notifications.push({
      icon: '📍',
      title: 'Nearby Delivery Partner Active',
      desc: 'A rider is currently 450m away in your area ready for pickup.',
      time: 'Just now'
    });
  }

  if (pushEnabled) {
    notifications.push(
      {
        icon: '🎉',
        title: 'Welcome to DPARCELS!',
        desc: 'Your account is active. Request food, medicine, groceries & errands anytime.',
        time: '2 mins ago'
      },
      {
        icon: '🏷️',
        title: '20% OFF Coupon Activated',
        desc: 'Use promo code DPARCEL20 at checkout for your first order discount.',
        time: '1 hour ago'
      }
    );
  }

  return (
    <div className="modal-overlay side-drawer-overlay active">
      <div className="side-drawer-content">
        <div className="side-drawer-header">
          <h2 className="modal-service-header">
            NOTIFICATIONS <span style={{ color: 'var(--primary-orange-light)' }}>CENTER</span>
          </h2>
          <i
            className="fa-solid fa-xmark"
            style={{ cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}
            onClick={onClose}
          ></i>
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
          {notifications.length === 0 ? (
            <div className="empty-state">
              <i className="fa-solid fa-bell-slash empty-icon" style={{ fontSize: 38 }}></i>
              <h3 style={{ fontSize: 14 }}>Notifications Off</h3>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Turn on toggles above to view alerts.</p>
            </div>
          ) : (
            notifications.map((item, idx) => (
              <div key={idx} className="notif-item">
                <div className="notif-item-icon">{item.icon}</div>
                <div>
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
