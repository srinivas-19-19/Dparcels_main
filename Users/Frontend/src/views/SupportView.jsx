import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export const SupportView = ({ onGoOrders }) => {
  const { t } = useLanguage();
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    { qKey: 'faq1_q', aKey: 'faq1_a' },
    { qKey: 'faq2_q', aKey: 'faq2_a' },
    { qKey: 'faq3_q', aKey: 'faq3_a' }
  ];

  return (
    <div className="view-container">
      <h1 className="greeting-title" dangerouslySetInnerHTML={{ __html: t('how_can_we_help') }}></h1>
      <p className="subtitle">{t('support_sub')}</p>

      <div style={{ marginTop: 16 }}>
        {/* Call Support Card */}
        <div className="support-card">
          <i className="fa-solid fa-phone icon-green"></i>
          <h4 style={{ fontWeight: 800, fontSize: 15 }}>{t('call_support')}</h4>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t('call_support_sub')}</p>
          <span className="status-online">{t('available_247')}</span>
        </div>

        {/* Live Chat Card */}
        <div className="support-card">
          <i className="fa-solid fa-comment-dots" style={{ color: 'var(--primary-orange-light)', fontSize: 20, marginBottom: 8 }}></i>
          <h4 style={{ fontWeight: 800, fontSize: 15 }}>{t('live_chat')}</h4>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t('live_chat_sub')}</p>
          <button className="btn-primary" style={{ marginTop: 10 }}>{t('start_chat_now')}</button>
        </div>

        {/* FAQs */}
        <h3 className="section-heading">{t('faq_title')}</h3>
        <div className="faq-container">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className={`faq-item ${activeFaq === idx ? 'active' : ''}`}
              onClick={() => toggleFaq(idx)}
            >
              <div className="faq-question">
                <span>{t(faq.qKey)}</span>
                <i className="fa-solid fa-chevron-down" style={{ transition: 'transform 0.2s ease' }}></i>
              </div>
              <div className="faq-answer">
                {t(faq.aKey)}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Orders History */}
        <div className="support-card" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)' }}>{t('recent_orders')}</span>
            <span
              style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary-orange-light)', cursor: 'pointer' }}
              onClick={onGoOrders}
            >
              {t('view_all')}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            {t('no_order_history')}
          </div>
        </div>
      </div>
    </div>
  );
};
