import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export const SettingsView = ({ onOpenLanguage }) => {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="view-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div className="settings-icon-badge" style={{ background: 'rgba(255, 107, 0, 0.15)', color: 'var(--primary-orange-light)' }}>
          <i className="fa-solid fa-motorcycle"></i>
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-muted)' }}>{t('settings_pref')}</span>
      </div>

      <h1 className="greeting-title" dangerouslySetInnerHTML={{ __html: t('account_settings') }}></h1>
      <p className="subtitle">{t('settings_sub')}</p>

      <div style={{ marginTop: 16 }}>
        {/* Language Preference Card */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <i className="fa-solid fa-language"></i>
            </div>
            <div>
              <h3 className="settings-card-title">{t('app_language')}</h3>
              <p className="settings-card-sub">{t('app_language_sub')}</p>
            </div>
          </div>
          <button type="button" className="btn-primary" onClick={onOpenLanguage}>
            <i className="fa-solid fa-globe"></i> <span>{t('change_language_btn')}</span>
          </button>
        </div>

        {/* Appearance Box */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-badge">
              <i className="fa-solid fa-palette"></i>
            </div>
            <div>
              <h3 className="settings-card-title">{t('theme_mode')} ({theme.toUpperCase()})</h3>
              <p className="settings-card-sub">{t('theme_sub')}</p>
            </div>
          </div>
          <button type="button" className="btn-primary" onClick={toggleTheme}>
            <i className={theme === 'light' ? 'fa-solid fa-moon' : 'fa-solid fa-sun'}></i>
            <span>{t('toggle_theme')}</span>
          </button>
        </div>

        {/* Personal Details Box */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-badge">
              <i className="fa-solid fa-user-gear"></i>
            </div>
            <div>
              <h3 className="settings-card-title">{t('personal_details')}</h3>
              <p className="settings-card-sub">{t('personal_sub')}</p>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('full_name')}</label>
            <div className="input-wrapper">
              <i className="fa-regular fa-user"></i>
              <input type="text" className="input-control" placeholder="Enter Full Name" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('phone_number')}</label>
            <div className="input-wrapper">
              <i className="fa-solid fa-phone"></i>
              <input type="tel" className="input-control" placeholder="+91 XXXXXXXXXX" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('email_address')}</label>
            <div className="input-wrapper">
              <i className="fa-regular fa-envelope"></i>
              <input type="email" className="input-control" placeholder="XXX@gmail.com" />
            </div>
          </div>

          <button className="btn-primary" style={{ marginTop: 10 }}>
            <i className="fa-solid fa-circle-check"></i> <span>{t('save_changes')}</span>
          </button>
        </div>

        {/* Saved Addresses Box */}
        <div className="settings-card">
          <div className="settings-card-header" style={{ marginBottom: 0 }}>
            <div className="settings-icon-badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
              <i className="fa-solid fa-location-dot"></i>
            </div>
            <div style={{ flex: 1 }}>
              <h3 className="settings-card-title">{t('saved_addresses')}</h3>
              <p className="settings-card-sub">{t('addresses_sub')}</p>
            </div>
            <button className="icon-btn" title="Add New Address">
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
