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
import { LanguageDrawer } from './components/LanguageDrawer';
import { NotificationDrawer } from './components/NotificationDrawer';

const MainContent = () => {
  const { isLoggedIn } = useAuth();
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
      <div className="app-container">
        {authPage === 'login' ? (
          <LoginView onNavigateRegister={() => setAuthPage('register')} />
        ) : (
          <RegisterView onNavigateLogin={() => setAuthPage('login')} />
        )}
      </div>
    );
  }

  return (
    <div className="app-container">
      {activeTab === 'home' && (
        <HomeView
          onOpenLanguage={() => setIsLanguageOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onSelectService={handleOpenOrderModal}
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
      <OrderModal
        isOpen={isOrderModalOpen}
        serviceType={selectedService}
        onClose={() => setIsOrderModalOpen(false)}
      />

      <LanguageDrawer
        isOpen={isLanguageOpen}
        onClose={() => setIsLanguageOpen(false)}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
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
