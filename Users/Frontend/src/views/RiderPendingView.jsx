import React from 'react';
import { useAuth } from '../context/AuthContext';

export const RiderPendingView = () => {
  const { logout } = useAuth();

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center', padding: 20 }}>
      <i className="fa-solid fa-clock" style={{ fontSize: 48, color: 'var(--primary-orange-light)', marginBottom: 20 }}></i>
      <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>Application Under Review</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 15, maxWidth: 300, marginBottom: 30 }}>
        Your delivery partner application has been submitted and is currently pending admin approval. You will be notified once your account is active.
      </p>
      
      <button className="btn-primary" onClick={logout} style={{ width: '100%', maxWidth: 200, padding: '12px', background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-primary)' }}>
        <i className="fa-solid fa-arrow-right-from-bracket" style={{ marginRight: 8 }}></i>
        LOGOUT
      </button>
    </div>
  );
};
