import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { 
  SlidersHorizontal, 
  Truck, 
  Clock, 
  ShieldCheck, 
  ArrowLeft, 
  Globe, 
  Moon, 
  Sun, 
  Bell, 
  Volume2, 
  Info, 
  FileText, 
  Check, 
  LogOut 
} from 'lucide-react';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  const [notifications, setNotifications] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);

  const availableLanguages = [
    { id: 'en', name: 'English', native: 'English' },
    { id: 'te', name: 'Telugu', native: 'తెలుగు' },
    { id: 'hi', name: 'Hindi', native: 'हिंदी' },
    { id: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
    { id: 'ta', name: 'Tamil', native: 'தமிழ்' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="rider-app-shell">
      {/* ================= TOP NAVBAR HUD ================= */}
      <header className="rider-top-navbar">
        <div className="rider-navbar-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '0.04em', color: '#FFFFFF', lineHeight: 1 }}>
                <span style={{ color: '#FF8A00' }}>D</span>PARCELS
              </div>
              <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.14em', color: '#FF8A00', marginTop: '3px' }}>
                APP PREFERENCES & SETTINGS
              </span>
            </div>
          </div>

          <nav className="desktop-nav-links rider-nav-links">
            <Link to="/home" className="rider-nav-btn">
              <Truck size={16} />
              <span>Command Center</span>
            </Link>
            <Link to="/history" className="rider-nav-btn">
              <Clock size={16} />
              <span>Trip History</span>
            </Link>
            <Link to="/profile" className="rider-nav-btn">
              <ShieldCheck size={16} />
              <span>Profile & Vehicle</span>
            </Link>
            <Link to="/settings" className="rider-nav-btn active">
              <SlidersHorizontal size={16} />
              <span>Settings</span>
            </Link>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => navigate('/home')}
              className="primary-orange-btn"
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to Dispatch</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN SETTINGS VIEWPORT ================= */}
      <main className="rider-content-container">
        <div className="rider-command-grid">
          {/* COLUMN 1: APP PREFERENCES */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Language Selection Card */}
            <div className="rider-card">
              <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#FFFFFF', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Globe size={20} color="#FF8A00" />
                <span>App Language</span>
              </h3>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
                Select your preferred language for navigation, orders, and system alerts.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginTop: '6px' }}>
                {availableLanguages.map((l) => {
                  const isSelected = lang === l.id;
                  return (
                    <button
                      key={l.id}
                      onClick={() => setLang(l.id)}
                      style={{
                        backgroundColor: isSelected ? 'rgba(255, 138, 0, 0.15)' : '#111D2E',
                        border: `1px solid ${isSelected ? '#FF8A00' : '#1F3047'}`,
                        borderRadius: '12px',
                        padding: '12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: isSelected ? '#FF8A00' : '#FFFFFF' }}>
                          {l.native}
                        </span>
                        {isSelected && <Check size={14} color="#FF8A00" />}
                      </div>
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}>{l.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notifications & Audio Alerts */}
            <div className="rider-card">
              <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#FFFFFF', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Bell size={20} color="#FF8A00" />
                <span>Audio & Dispatch Alerts</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '6px' }}>
                <div style={{
                  backgroundColor: '#111D2E',
                  border: '1px solid #1F3047',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#FFFFFF' }}>
                      Push Notifications
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                      Instant alerts for new incoming orders in Adoni hub
                    </div>
                  </div>

                  <button
                    onClick={() => setNotifications(!notifications)}
                    style={{
                      width: '46px',
                      height: '26px',
                      borderRadius: '13px',
                      backgroundColor: notifications ? '#FF8A00' : '#1F3047',
                      border: 'none',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: '#FFFFFF',
                      position: 'absolute',
                      top: '3px',
                      left: notifications ? '23px' : '3px',
                      transition: 'left 0.2s ease'
                    }} />
                  </button>
                </div>

                <div style={{
                  backgroundColor: '#111D2E',
                  border: '1px solid #1F3047',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#FFFFFF' }}>
                      Loud Chime on Order Match
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                      Play high-visibility audio alert when a new request is dispatched
                    </div>
                  </div>

                  <button
                    onClick={() => setSoundAlerts(!soundAlerts)}
                    style={{
                      width: '46px',
                      height: '26px',
                      borderRadius: '13px',
                      backgroundColor: soundAlerts ? '#FF8A00' : '#1F3047',
                      border: 'none',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: '#FFFFFF',
                      position: 'absolute',
                      top: '3px',
                      left: soundAlerts ? '23px' : '3px',
                      transition: 'left 0.2s ease'
                    }} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2: LEGAL, ABOUT & LOGOUT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* System Information Card */}
            <div className="rider-card">
              <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#FFFFFF', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Info size={20} color="#FF8A00" />
                <span>System & Version</span>
              </h3>

              <div style={{
                backgroundColor: '#111D2E',
                border: '1px solid #1F3047',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#94A3B8' }}>Application</span>
                  <span style={{ color: '#FFFFFF', fontWeight: '800' }}>DParcels Partner Terminal</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#94A3B8' }}>Version</span>
                  <span style={{ color: '#FF8A00', fontWeight: '800' }}>2.0.4 (Enterprise)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#94A3B8' }}>Dispatch Engine</span>
                  <span style={{ color: '#10B981', fontWeight: '800' }}>Socket.IO Real-time Connected</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#94A3B8' }}>Operating Region</span>
                  <span style={{ color: '#FFFFFF', fontWeight: '800' }}>Adoni, Kurnool District, AP</span>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="rider-card">
              <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#FFFFFF', margin: 0 }}>
                Account Actions
              </h3>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
                Manage your active session or log out of this device.
              </p>

              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#EF4444',
                  borderRadius: '14px',
                  padding: '14px',
                  fontSize: '14px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '6px'
                }}
              >
                <LogOut size={16} />
                <span>Log Out from All Devices</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
