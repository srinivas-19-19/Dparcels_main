import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const HowItWorks = () => {
  const { t } = useLanguage();

  return (
    <div className="how-it-works-section" style={{ textAlign: 'center' }}>
      <h3 className="how-it-works-title" style={{ textAlign: 'center' }}>{t('how_it_works_title')}</h3>
      <div className="how-it-works-card">
        <div className="how-step-item" style={{ alignItems: 'center', textAlign: 'center' }}>
          <div className="how-step-icon-bg">
            <i className="fa-solid fa-file-signature" style={{ color: '#3b82f6' }}></i>
          </div>
          <span className="how-step-text" style={{ textAlign: 'center' }}>{t('step1_title')}</span>
        </div>

        <div className="how-step-item" style={{ alignItems: 'center', textAlign: 'center' }}>
          <div className="how-step-icon-bg">
            <i className="fa-solid fa-motorcycle" style={{ color: '#FF6B00' }}></i>
          </div>
          <span className="how-step-text" style={{ textAlign: 'center' }}>{t('step2_title')}</span>
        </div>

        <div className="how-step-item" style={{ alignItems: 'center', textAlign: 'center' }}>
          <div className="how-step-icon-bg">
            <i className="fa-solid fa-door-open" style={{ color: '#22c55e' }}></i>
          </div>
          <span className="how-step-text" style={{ textAlign: 'center' }}>{t('step3_title')}</span>
        </div>
      </div>
    </div>
  );
};
