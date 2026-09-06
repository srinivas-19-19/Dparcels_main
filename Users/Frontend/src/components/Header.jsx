import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const Header = ({ onOpenLanguage, onOpenNotifications, hasUnreadNotif }) => {
  const { currentLang } = useLanguage();

  return (
    <div className="home-header">
      <div className="brand-logo">
        <img 
          src="images/dparcels_logo.jpg" 
          alt="DPARCELS Logo" 
          className="brand-logo-img" 
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <strong className="brand-name">DPARCELS</strong>
      </div>
      <div className="header-actions">
        <button 
          type="button" 
          className="icon-btn lang-btn" 
          onClick={onOpenLanguage} 
          title="Select Language"
        >
          <i className="fa-solid fa-language"></i>
          <span className="lang-code-badge">{currentLang.toUpperCase()}</span>
        </button>
        <button 
          type="button" 
          className="icon-btn" 
          onClick={onOpenNotifications} 
          title="Notifications"
        >
          <i className="fa-solid fa-bell"></i>
          {hasUnreadNotif && <span className="notif-badge-dot"></span>}
        </button>
      </div>
    </div>
  );
};
