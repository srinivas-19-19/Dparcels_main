import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HomeView } from './views/HomeView';
import { OrdersView } from './views/OrdersView';
import { SupportView } from './views/SupportView';
import { SettingsView } from './views/SettingsView';
import { LoginView } from './views/LoginView';
import { RegisterView } from './views/RegisterView';
import { BottomNav } from './components/BottomNav';
import { OrderModal } from './components/OrderModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageDrawer } from './components/LanguageDrawer';
import { NotificationDrawer } from './components/NotificationDrawer';

import { RiderPendingView } from './views/RiderPendingView';
import { RiderHomeView } from './views/RiderHomeView';

const MainContent = () => {
  const { isLoggedIn, user } = useAuth();
  const [authPage, setAuthPage] = useState('login'); // 'login' | 'register'
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'orders' | 'support' | 'settings'

  // Modals / Drawers state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('custom');
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const handleOpenOrderModal = (serviceType) => {
    setSelectedService(serviceType);
    setIsOrderModalOpen(true);
  };

  if (!isLoggedIn) {
    return (
      <div className="app-viewport-wrapper">
        <div className="app-container">
          {authPage === 'login' ? (
            <LoginView onNavigateRegister={() => setAuthPage('register')} />
          ) : (
            <RegisterView onNavigateLogin={() => setAuthPage('login')} />
          )}
        </div>
      </div>
    );
  }

  if (user?.role === 'RIDER') {
    if (!user?.riderProfile?.isApproved) {
      return (
        <div className="app-viewport-wrapper">
          <div className="app-container">
            <RiderPendingView />
          </div>
        </div>
      );
    }

    return (
      <div className="app-viewport-wrapper">
        <div className="app-container" style={{ display: 'flex', flexDirection: 'column' }}>
          <RiderHomeView />
          {/* We'll add Rider Bottom Nav later if needed */}
        </div>
      </div>
    );
  }

  return (
    <div className="app-viewport-wrapper">
      <div className="app-container">
        {activeTab === 'home' && (
          <HomeView
            onOpenLanguage={() => setIsLanguageOpen(true)}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onSelectService={handleOpenOrderModal}
            onNavigateOrders={() => setActiveTab('orders')}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersView onGoHome={() => setActiveTab('home')} />
        )}

        {activeTab === 'support' && (
          <SupportView onGoOrders={() => setActiveTab('orders')} />
        )}

        {activeTab === 'settings' && (
          <SettingsView onOpenLanguage={() => setIsLanguageOpen(true)} />
        )}

        <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Modals and Drawers */}
        <ErrorBoundary>
          <OrderModal
            isOpen={isOrderModalOpen}
            serviceType={selectedService}
            onClose={() => setIsOrderModalOpen(false)}
            onNavigateOrders={() => {
              setIsOrderModalOpen(false);
              setActiveTab('orders');
            }}
          />
        </ErrorBoundary>

        <LanguageDrawer
          isOpen={isLanguageOpen}
          onClose={() => setIsLanguageOpen(false)}
        />

        <NotificationDrawer
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          onNotificationUpdate={() => {
            window.dispatchEvent(new CustomEvent('dparcels:refreshDashboard'));
          }}
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <MainContent />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
