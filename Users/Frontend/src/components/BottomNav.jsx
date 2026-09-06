import React from 'react';
import { useAuth } from '../context/AuthContext';

export const BottomNav = ({ activeTab, onSelectTab }) => {
  const { logout } = useAuth();

  return (
    <nav className="bottom-nav">
      <div
        className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => onSelectTab('home')}
        title="Home"
      >
        <i className="fa-solid fa-house"></i>
      </div>
      <div
        className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
        onClick={() => onSelectTab('orders')}
        title="Orders"
      >
        <i className="fa-solid fa-clock-rotate-left"></i>
      </div>
      <div
        className={`nav-item ${activeTab === 'support' ? 'active' : ''}`}
        onClick={() => onSelectTab('support')}
        title="Support"
      >
        <i className="fa-solid fa-headset"></i>
      </div>
      <div
        className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => onSelectTab('settings')}
        title="Settings"
      >
        <i className="fa-solid fa-gear"></i>
      </div>
      <div
        className="nav-item nav-logout"
        onClick={logout}
        title="Logout"
      >
        <i className="fa-solid fa-arrow-right-from-bracket"></i>
      </div>
    </nav>
  );
};
