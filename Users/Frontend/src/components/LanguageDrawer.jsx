import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const LanguageDrawer = ({ isOpen, onClose }) => {
  const { currentLang, selectLanguage, t, translations } = useLanguage();

  if (!isOpen) return null;

  const langList = Object.keys(translations).map((key) => ({
    key,
    ...translations[key]
  }));

  return (
    <div className="modal-overlay side-drawer-overlay active">
      <div className="side-drawer-content">
        <div className="side-drawer-header">
          <h2 className="modal-service-header">
            SELECT <span style={{ color: 'var(--primary-orange-light)' }}>LANGUAGE</span>
          </h2>
          <i
            className="fa-solid fa-xmark"
            style={{ cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}
            onClick={onClose}
          ></i>
        </div>

        <p className="subtitle" style={{ marginBottom: 16 }}>
          {t('select_language_sub')}
        </p>

        <div className="language-options-list">
          {langList.map((item) => (
            <div
              key={item.key}
              className={`lang-option-card ${currentLang === item.key ? 'active' : ''}`}
              onClick={() => {
                selectLanguage(item.key);
                onClose();
              }}
            >
              <div className="lang-flag-box">{item.flag}</div>
              <div className="lang-info">
                <div className="lang-name">{item.name}</div>
                <div className="lang-native">{item.native}</div>
              </div>
              <div className="lang-check">
                <i className="fa-solid fa-circle-check"></i>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
