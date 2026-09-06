import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const ServiceCards = ({ onSelectService }) => {
  const { t } = useLanguage();

  const services = [
    {
      id: 'food',
      titleKey: 'food_title',
      subKey: 'food_sub',
      iconClass: 'fa-solid fa-utensils',
      iconColor: '#f59e0b',
      bgImage: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'medicine',
      titleKey: 'med_title',
      subKey: 'med_sub',
      iconClass: 'fa-solid fa-prescription-bottle-medical',
      iconColor: '#3b82f6',
      bgImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'groceries',
      titleKey: 'groc_title',
      subKey: 'groc_sub',
      iconClass: 'fa-solid fa-cart-shopping',
      iconColor: '#22c55e',
      bgImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'documents',
      titleKey: 'doc_title',
      subKey: 'doc_sub',
      iconClass: 'fa-solid fa-file-signature',
      iconColor: '#60a5fa',
      bgImage: 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'custom',
      titleKey: 'cust_title',
      subKey: 'cust_sub',
      iconClass: 'fa-solid fa-clipboard-list',
      iconColor: '#ef4444',
      bgImage: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80'
    }
  ];

  return (
    <div className="service-card-list">
      {services.map((item) => (
        <div
          key={item.id}
          className="service-card"
          onClick={() => onSelectService(item.id)}
          style={{ backgroundImage: `url('${item.bgImage}')` }}
        >
          <div className="card-top-bar" style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <div className="card-icon-badge">
              <i className={item.iconClass} style={{ color: item.iconColor }}></i>
            </div>
          </div>
          <div className="service-content">
            <div className="service-title">{t(item.titleKey)}</div>
            <div className="service-sub">{t(item.subKey)}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
