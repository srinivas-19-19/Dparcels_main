import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export const RiderHomeView = () => {
  const { user, logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const isOnline = user?.riderProfile?.isOnline || false;

  const toggleStatus = async () => {
    setLoading(true);
    try {
      // We will create this endpoint in the backend for Rider status toggle
      const response = await api.put('/rider/status', { isOnline: !isOnline });
      updateUser({ riderProfile: { ...user.riderProfile, isOnline: !isOnline } });
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Could not update status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-container" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold' }}>Rider Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Welcome, {user?.riderProfile?.firstName || 'Partner'}</p>
        </div>
        <button onClick={logout} style={{ background: 'transparent', border: 'none', color: 'var(--primary-orange-light)', cursor: 'pointer', fontSize: 14, fontWeight: 'bold' }}>
          LOGOUT
        </button>
      </div>

      <div style={{ background: 'var(--surface-dark)', padding: 20, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 'bold' }}>Current Status</h3>
          <p style={{ color: isOnline ? '#10b981' : 'var(--text-muted)', fontSize: 14, marginTop: 4, fontWeight: 'bold' }}>
            {isOnline ? 'ONLINE - Looking for orders' : 'OFFLINE'}
          </p>
        </div>
        <button 
          className="btn-primary" 
          onClick={toggleStatus} 
          disabled={loading}
          style={{ width: 'auto', padding: '10px 20px', background: isOnline ? '#ef4444' : '#10b981' }}
        >
          {isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
        </button>
      </div>

      {/* Map & Available Orders will go here in Phase 10 */}
      <div style={{ background: 'var(--surface-dark)', padding: 30, borderRadius: 12, textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed rgba(255,255,255,0.1)' }}>
        <i className="fa-solid fa-map-location-dot" style={{ fontSize: 40, marginBottom: 15, opacity: 0.5 }}></i>
        <p>Available orders will appear here when you are online.</p>
      </div>
    </div>
  );
};
