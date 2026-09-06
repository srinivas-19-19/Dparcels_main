import React from 'react';
import { Header } from '../components/Header';
import { HowItWorks } from '../components/HowItWorks';
import { PromoCard } from '../components/PromoCard';
import { ServiceCards } from '../components/ServiceCards';
import { useLanguage } from '../context/LanguageContext';

export const HomeView = ({ onOpenLanguage, onOpenNotifications, onSelectService }) => {
  const { t } = useLanguage();

  return (
    <div className="view-container">
      <Header
        onOpenLanguage={onOpenLanguage}
        onOpenNotifications={onOpenNotifications}
        hasUnreadNotif={true}
      />

      <h1 className="greeting-title" dangerouslySetInnerHTML={{ __html: t('greeting') }}></h1>
      <p className="subtitle">{t('subtitle')}</p>

      <HowItWorks />

      <PromoCard onClaim={() => onSelectService('food')} />

      <h3 className="section-heading">{t('services_heading')}</h3>

      <ServiceCards onSelectService={onSelectService} />
    </div>
  );
};
