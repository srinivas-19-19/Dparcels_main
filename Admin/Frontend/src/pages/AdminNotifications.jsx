import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  Bell,
  CheckCircle2,
  Send,
  Filter,
  UserCheck,
  ShoppingBag,
  AlertTriangle,
  CreditCard,
  X,
  Check
} from 'lucide-react';
import '../styles/dashboard.css';

export default function AdminNotifications() {
  const [filterType, setFilterType] = useState('All');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/notifications');
      const formatted = response.data.data.map(notif => ({
        id: notif.id,
        title: notif.title,
        message: notif.body,
        time: new Date(notif.createdAt).toLocaleString(),
        category: notif.user ? notif.user.role : 'System',
        read: notif.isRead,
        iconType: notif.user?.role === 'RIDER' ? 'rider' : notif.user?.role === 'CUSTOMER' ? 'order' : 'system'
      }));
      setNotifications(formatted);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const [broadcastForm, setBroadcastForm] = useState({
    target: 'ALL',
    title: '',
    message: ''
  });

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleToggleRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.title || !broadcastForm.message) return;

    try {
      await api.post('/admin/notifications/broadcast', {
        title: broadcastForm.title,
        message: broadcastForm.message,
        targetRole: broadcastForm.target
      });
      alert('Broadcast sent successfully!');
      setShowBroadcastModal(false);
      setBroadcastForm({ target: 'ALL', title: '', message: '' });
      fetchNotifications();
    } catch (error) {
      alert('Failed to send broadcast');
    }
  };

  const filteredNotifs = notifications.filter((n) => {
    if (filterType === 'All') return true;
    if (filterType === 'Unread') return !n.read;
    return n.category === filterType;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="notifications-view-container">
      {/* Header Bar */}
      <div className="notifications-header-row">
        <div>
          <h1 className="header-greeting">Notifications & Alerts</h1>
          <p className="header-subtext">Manage system alerts, delivery broadcasts, and admin logs.</p>
        </div>

        <div className="notif-header-actions">
          <button className="back-to-riders-btn" onClick={handleMarkAllRead}>
            <Check size={16} />
            <span>Mark All as Read</span>
          </button>

          <button className="add-rider-btn" onClick={() => setShowBroadcastModal(true)}>
            <Send size={16} />
            <span>Send Broadcast</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills Bar */}
      <div className="notif-filter-bar">
        <div className="status-filter-pills">
          {['All', 'Unread', 'Orders', 'Riders', 'Payments', 'System'].map((cat) => (
            <button
              key={cat}
              className={`status-pill-btn ${filterType === cat ? 'active' : ''}`}
              onClick={() => setFilterType(cat)}
            >
              <span>{cat}</span>
              {cat === 'Unread' && unreadCount > 0 && (
                <span className="count-badge yellow">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* NOTIFICATIONS LIST CONTAINER */}
      <div className="notifications-list-card">
        {filteredNotifs.map((item) => (
          <div
            key={item.id}
            className={`notification-item-row ${item.read ? 'read' : 'unread'}`}
            onClick={() => handleToggleRead(item.id)}
          >
            <div className="notif-icon-box">
              {item.iconType === 'rider' && <UserCheck size={18} color="#FFD21F" />}
              {item.iconType === 'order' && <ShoppingBag size={18} color="#22C55E" />}
              {item.iconType === 'system' && <AlertTriangle size={18} color="#CA8A04" />}
              {item.iconType === 'cancel' && <X size={18} color="#EF4444" />}
              {item.iconType === 'payment' && <CreditCard size={18} color="#22C55E" />}
            </div>

            <div className="notif-content-meta">
              <div className="notif-title-line">
                <span className="notif-title-text">{item.title}</span>
                {!item.read && <span className="unread-dot-badge"></span>}
              </div>
              <p className="notif-msg-text">{item.message}</p>
              <span className="notif-time-stamp">{item.time}</span>
            </div>

            <button
              className="action-icon-btn"
              title={item.read ? 'Mark as Unread' : 'Mark as Read'}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleRead(item.id);
              }}
            >
              {item.read ? <Bell size={16} color="#8A9285" /> : <CheckCircle2 size={16} color="#FFD21F" />}
            </button>
          </div>
        ))}

        {filteredNotifs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#8A9285' }}>
            No notifications matching current filter.
          </div>
        )}
      </div>

      {/* SEND BROADCAST MODAL */}
      {showBroadcastModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Send Push Broadcast</h3>
              <button className="close-modal-btn" onClick={() => setShowBroadcastModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSendBroadcast} className="modal-form">
              <div className="form-group">
                <label>Target Audience</label>
                <select 
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none' }}
                value={broadcastForm.target}
                onChange={(e) => setBroadcastForm({...broadcastForm, target: e.target.value})}
              >
                <option value="ALL">All Users</option>
                <option value="RIDER">All Riders</option>
                <option value="CUSTOMER">All Customers</option>
              </select> 
              </div>

              <div className="form-group">
                <label>Notification Title</label>
                <input
                  type="text"
                  placeholder="e.g. Rain Surge Alert active in Tirupati"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Message Content</label>
                <textarea
                  rows="4"
                  className="modal-textarea"
                  placeholder="Type push message body..."
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="add-rider-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                <Send size={16} />
                <span>Send Broadcast Now</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
