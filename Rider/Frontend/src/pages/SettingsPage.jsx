import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Lock, 
  LogOut, 
  Bell, 
  Volume2, 
  Globe, 
  Moon, 
  Sun,
  Laptop,
  HelpCircle, 
  FileText, 
  Shield, 
  Info, 
  Clock, 
  Settings,
  X,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2
} from 'lucide-react';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { lang, setLang, t } = useLanguage();
  const { theme, setTheme, isLight, themeColors } = useTheme();
  
  const [notifications, setNotifications] = useState(true);
  const [soundVibration, setSoundVibration] = useState(true);

  // Active Modal State: null | 'personalInfo' | 'changePassword' | 'help' | 'terms' | 'privacy' | 'about' | 'language' | 'theme'
  const [activeModal, setActiveModal] = useState(null);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const availableLanguages = [
    { id: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
    { id: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
    { id: 'hi', name: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
    { id: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { id: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' }
  ];

  const availableThemes = [
    { id: 'Dark', name: 'Dark Mode', desc: 'Sleek dark theme for night riding', icon: Moon },
    { id: 'Light', name: 'Light Mode', desc: 'High-contrast bright theme for daytime', icon: Sun },
    { id: 'System', name: 'System Default', desc: 'Sync automatically with phone settings', icon: Laptop }
  ];

  const getLanguageDisplayName = (langId) => {
    const found = availableLanguages.find(l => l.id === langId);
    return found ? `${found.native}` : 'English';
  };

  const handleLogout = () => {
    navigate('/login');
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => {
      setPasswordSuccess(false);
      setActiveModal(null);
    }, 2000);
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: themeColors.bg,
      color: themeColors.text,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0',
      position: 'relative',
      fontFamily: 'var(--font-main)',
      transition: 'all 0.3s ease'
    }}>
      {/* Phone Screen Container Frame */}
      <div className="responsive-phone-frame" style={{
        backgroundColor: themeColors.frameBg,
        border: `1px solid ${themeColors.border}`
      }}>

        {/* Main Scrollable Content */}
        <div style={{
          flex: 1,
          padding: '20px 16px 80px 16px',
          overflowY: 'auto'
        }}>
          {/* Top Header: Back button & Title */}
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            paddingTop: '8px'
          }}>
            <button
              onClick={() => navigate('/home')}
              style={{
                position: 'absolute',
                left: '0',
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                backgroundColor: themeColors.cardBg,
                border: `1px solid ${themeColors.border}`,
                color: themeColors.text,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <ChevronLeft size={20} />
            </button>

            <div style={{ textAlign: 'center' }}>
              <h1 style={{
                fontSize: '20px',
                fontWeight: '800',
                color: themeColors.text,
                margin: 0
              }}>
                {t('settingsTitle')}
              </h1>
              <p style={{
                fontSize: '12px',
                color: themeColors.subText,
                margin: '2px 0 0 0',
                fontWeight: '500'
              }}>
                {t('settingsSubtitle')}
              </p>
            </div>
          </div>

          {/* SECTION 1: ACCOUNT */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '0.08em',
              color: themeColors.subText,
              textTransform: 'uppercase',
              marginBottom: '10px',
              paddingLeft: '2px'
            }}>
              {t('account')}
            </div>

            <div style={{
              backgroundColor: themeColors.cardBg,
              border: `1px solid ${themeColors.border}`,
              borderRadius: '16px',
              overflow: 'hidden'
            }}>
              <div
                onClick={() => setActiveModal('personalInfo')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderBottom: `1px solid ${themeColors.innerBorder}`,
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <User size={18} color={themeColors.subText} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: themeColors.text }}>
                      {t('personalInfo')}
                    </div>
                    <div style={{ fontSize: '11px', color: themeColors.subText, marginTop: '1px' }}>
                      {t('updateDetails')}
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} color={themeColors.subText} />
              </div>

              <div
                onClick={() => {
                  setPasswordError('');
                  setPasswordSuccess(false);
                  setActiveModal('changePassword');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderBottom: `1px solid ${themeColors.innerBorder}`,
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <Lock size={18} color={themeColors.subText} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: themeColors.text }}>
                      {t('changePassword')}
                    </div>
                    <div style={{ fontSize: '11px', color: themeColors.subText, marginTop: '1px' }}>
                      {t('updatePassword')}
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} color={themeColors.subText} />
              </div>

              <div
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <LogOut size={18} color="#EF4444" />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#EF4444' }}>
                      {t('logout')}
                    </div>
                    <div style={{ fontSize: '11px', color: themeColors.subText, marginTop: '1px' }}>
                      {t('signOutAccount')}
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} color={themeColors.subText} />
              </div>
            </div>
          </div>

          {/* SECTION 2: PREFERENCES */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '0.08em',
              color: themeColors.subText,
              textTransform: 'uppercase',
              marginBottom: '10px',
              paddingLeft: '2px'
            }}>
              {t('preferences')}
            </div>

            <div style={{
              backgroundColor: themeColors.cardBg,
              border: `1px solid ${themeColors.border}`,
              borderRadius: '16px',
              overflow: 'hidden'
            }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderBottom: `1px solid ${themeColors.innerBorder}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <Bell size={18} color={themeColors.subText} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: themeColors.text }}>
                      {t('notifications')}
                    </div>
                    <div style={{ fontSize: '11px', color: themeColors.subText, marginTop: '1px' }}>
                      {t('manageNotif')}
                    </div>
                  </div>
                </div>
                
                <div
                  onClick={() => setNotifications(!notifications)}
                  style={{
                    width: '46px',
                    height: '26px',
                    borderRadius: '20px',
                    backgroundColor: notifications ? '#FF8A00' : '#2A2A2A',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                    boxShadow: notifications ? '0 0 10px rgba(255, 138, 0, 0.4)' : 'none'
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
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderBottom: `1px solid ${themeColors.innerBorder}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <Volume2 size={18} color={themeColors.subText} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: themeColors.text }}>
                      {t('soundVibration')}
                    </div>
                    <div style={{ fontSize: '11px', color: themeColors.subText, marginTop: '1px' }}>
                      {t('manageSounds')}
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setSoundVibration(!soundVibration)}
                  style={{
                    width: '46px',
                    height: '26px',
                    borderRadius: '20px',
                    backgroundColor: soundVibration ? '#FF8A00' : '#2A2A2A',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                    boxShadow: soundVibration ? '0 0 10px rgba(255, 138, 0, 0.4)' : 'none'
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    position: 'absolute',
                    top: '3px',
                    left: soundVibration ? '23px' : '3px',
                    transition: 'left 0.2s ease'
                  }} />
                </div>
              </div>

              <div
                onClick={() => setActiveModal('language')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderBottom: `1px solid ${themeColors.innerBorder}`,
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <Globe size={18} color={themeColors.subText} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: themeColors.text }}>
                      {t('language')}
                    </div>
                    <div style={{ fontSize: '11px', color: themeColors.subText, marginTop: '1px' }}>
                      {t('chooseLanguage')}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#FF8A00', fontWeight: '700' }}>
                    {getLanguageDisplayName(lang)}
                  </span>
                  <ChevronRight size={18} color={themeColors.subText} />
                </div>
              </div>

              <div
                onClick={() => setActiveModal('theme')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <Moon size={18} color={themeColors.subText} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: themeColors.text }}>
                      {t('theme')}
                    </div>
                    <div style={{ fontSize: '11px', color: themeColors.subText, marginTop: '1px' }}>
                      {t('chooseTheme')}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#FF8A00', fontWeight: '700' }}>{theme}</span>
                  <ChevronRight size={18} color={themeColors.subText} />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: SUPPORT */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '0.08em',
              color: themeColors.subText,
              textTransform: 'uppercase',
              marginBottom: '10px',
              paddingLeft: '2px'
            }}>
              {t('support')}
            </div>

            <div style={{
              backgroundColor: themeColors.cardBg,
              border: `1px solid ${themeColors.border}`,
              borderRadius: '16px',
              overflow: 'hidden'
            }}>
              <div
                onClick={() => setActiveModal('help')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderBottom: `1px solid ${themeColors.innerBorder}`,
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <HelpCircle size={18} color={themeColors.subText} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: themeColors.text }}>
                      {t('helpSupport')}
                    </div>
                    <div style={{ fontSize: '11px', color: themeColors.subText, marginTop: '1px' }}>
                      {t('getHelp')}
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} color={themeColors.subText} />
              </div>

              <div
                onClick={() => setActiveModal('terms')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderBottom: `1px solid ${themeColors.innerBorder}`,
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <FileText size={18} color={themeColors.subText} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: themeColors.text }}>
                      {t('termsConditions')}
                    </div>
                    <div style={{ fontSize: '11px', color: themeColors.subText, marginTop: '1px' }}>
                      {t('readTerms')}
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} color={themeColors.subText} />
              </div>

              <div
                onClick={() => setActiveModal('privacy')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderBottom: `1px solid ${themeColors.innerBorder}`,
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <Shield size={18} color={themeColors.subText} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: themeColors.text }}>
                      {t('privacyPolicy')}
                    </div>
                    <div style={{ fontSize: '11px', color: themeColors.subText, marginTop: '1px' }}>
                      {t('readPrivacy')}
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} color={themeColors.subText} />
              </div>

              <div
                onClick={() => setActiveModal('about')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <Info size={18} color={themeColors.subText} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: themeColors.text }}>
                      {t('aboutDparcels')}
                    </div>
                    <div style={{ fontSize: '11px', color: themeColors.subText, marginTop: '1px' }}>
                      {t('appVersionInfo')}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', color: themeColors.subText, fontWeight: '500' }}>v2.5.0</span>
                  <ChevronRight size={18} color={themeColors.subText} />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ================= MODAL DIALOG OVERLAYS ================= */}
        {activeModal && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 40,
            display: 'flex',
            alignItems: 'flex-end',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{
              width: '100%',
              maxHeight: '90%',
              backgroundColor: themeColors.frameBg,
              borderTop: `1px solid ${themeColors.border}`,
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.8)',
              overflowY: 'auto'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '18px',
                paddingBottom: '12px',
                borderBottom: `1px solid ${themeColors.border}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {activeModal === 'changePassword' && <KeyRound size={22} color="#FF8A00" />}
                  {activeModal === 'personalInfo' && <User size={22} color="#FF8A00" />}
                  {activeModal === 'language' && <Globe size={22} color="#FF8A00" />}
                  {activeModal === 'theme' && <Moon size={22} color="#FF8A00" />}
                  {activeModal === 'help' && <HelpCircle size={22} color="#FF8A00" />}
                  {activeModal === 'terms' && <FileText size={22} color="#FF8A00" />}
                  {activeModal === 'privacy' && <Shield size={22} color="#FF8A00" />}
                  {activeModal === 'about' && <Info size={22} color="#FF8A00" />}
                  
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: themeColors.text, margin: 0 }}>
                    {activeModal === 'changePassword' && t('changePassword')}
                    {activeModal === 'personalInfo' && t('personalInfo')}
                    {activeModal === 'language' && t('selectLanguage')}
                    {activeModal === 'theme' && t('selectTheme')}
                    {activeModal === 'help' && t('helpSupport')}
                    {activeModal === 'terms' && t('termsConditions')}
                    {activeModal === 'privacy' && t('privacyPolicy')}
                    {activeModal === 'about' && t('aboutDparcels')}
                  </h2>
                </div>

                <button
                  onClick={() => setActiveModal(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: themeColors.subText,
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {activeModal === 'changePassword' && (
                <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {passwordSuccess ? (
                    <div style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid #10B981',
                      borderRadius: '14px',
                      padding: '20px',
                      textAlign: 'center',
                      color: '#10B981'
                    }}>
                      <CheckCircle2 size={36} style={{ margin: '0 auto 10px auto' }} />
                      <div style={{ fontSize: '16px', fontWeight: '800' }}>Password Changed Successfully!</div>
                      <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.9 }}>Your new password is now active.</div>
                    </div>
                  ) : (
                    <>
                      {passwordError && (
                        <div style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid #EF4444',
                          borderRadius: '12px',
                          padding: '10px 14px',
                          fontSize: '13px',
                          color: '#EF4444',
                          fontWeight: '600'
                        }}>
                          {passwordError}
                        </div>
                      )}

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: themeColors.subText, display: 'block', marginBottom: '6px' }}>
                          Current Password
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showCurrentPass ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                            style={{
                              width: '100%',
                              height: '46px',
                              backgroundColor: themeColors.cardBg,
                              border: `1px solid ${themeColors.border}`,
                              borderRadius: '12px',
                              padding: '0 40px 0 14px',
                              color: themeColors.text,
                              fontSize: '14px',
                              boxSizing: 'border-box'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPass(!showCurrentPass)}
                            style={{
                              position: 'absolute',
                              right: '12px',
                              top: '13px',
                              background: 'none',
                              border: 'none',
                              color: themeColors.subText,
                              cursor: 'pointer'
                            }}
                          >
                            {showCurrentPass ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: themeColors.subText, display: 'block', marginBottom: '6px' }}>
                          New Password
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showNewPass ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password (min. 6 chars)"
                            style={{
                              width: '100%',
                              height: '46px',
                              backgroundColor: themeColors.cardBg,
                              border: `1px solid ${themeColors.border}`,
                              borderRadius: '12px',
                              padding: '0 40px 0 14px',
                              color: themeColors.text,
                              fontSize: '14px',
                              boxSizing: 'border-box'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPass(!showNewPass)}
                            style={{
                              position: 'absolute',
                              right: '12px',
                              top: '13px',
                              background: 'none',
                              border: 'none',
                              color: themeColors.subText,
                              cursor: 'pointer'
                            }}
                          >
                            {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: themeColors.subText, display: 'block', marginBottom: '6px' }}>
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          style={{
                            width: '100%',
                            height: '46px',
                            backgroundColor: themeColors.cardBg,
                            border: `1px solid ${themeColors.border}`,
                            borderRadius: '12px',
                            padding: '0 14px',
                            color: themeColors.text,
                            fontSize: '14px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <button
                        type="submit"
                        className="primary-orange-btn"
                        style={{
                          marginTop: '10px',
                          width: '100%',
                          height: '48px',
                          fontSize: '15px'
                        }}
                      >
                        Update Password
                      </button>
                    </>
                  )}
                </form>
              )}

              {activeModal === 'personalInfo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ backgroundColor: themeColors.cardBg, border: `1px solid ${themeColors.border}`, borderRadius: '14px', padding: '14px 16px' }}>
                    <div style={{ fontSize: '11px', color: themeColors.subText, textTransform: 'uppercase', fontWeight: '700' }}>Full Name</div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: themeColors.text, marginTop: '2px' }}>Gorkal sreenu</div>
                  </div>

                  <div style={{ backgroundColor: themeColors.cardBg, border: `1px solid ${themeColors.border}`, borderRadius: '14px', padding: '14px 16px' }}>
                    <div style={{ fontSize: '11px', color: themeColors.subText, textTransform: 'uppercase', fontWeight: '700' }}>Rider ID</div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#FF8A00', marginTop: '2px' }}>#0007</div>
                  </div>

                  <div style={{ backgroundColor: themeColors.cardBg, border: `1px solid ${themeColors.border}`, borderRadius: '14px', padding: '14px 16px' }}>
                    <div style={{ fontSize: '11px', color: themeColors.subText, textTransform: 'uppercase', fontWeight: '700' }}>Phone Number</div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: themeColors.text, marginTop: '2px' }}>+91 98765 43210</div>
                  </div>

                  <div style={{ backgroundColor: themeColors.cardBg, border: `1px solid ${themeColors.border}`, borderRadius: '14px', padding: '14px 16px' }}>
                    <div style={{ fontSize: '11px', color: themeColors.subText, textTransform: 'uppercase', fontWeight: '700' }}>Registered Hub</div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: themeColors.text, marginTop: '2px' }}>DParcels Hub, Adoni</div>
                  </div>

                  <div style={{ backgroundColor: themeColors.cardBg, border: `1px solid ${themeColors.border}`, borderRadius: '14px', padding: '14px 16px' }}>
                    <div style={{ fontSize: '11px', color: themeColors.subText, textTransform: 'uppercase', fontWeight: '700' }}>Vehicle Registration</div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: themeColors.text, marginTop: '2px' }}>Motorcycle • AP 21 XY 4321</div>
                  </div>

                  <button
                    onClick={() => setActiveModal(null)}
                    className="primary-orange-btn"
                    style={{
                      marginTop: '10px',
                      width: '100%',
                      height: '46px',
                      fontSize: '14px'
                    }}
                  >
                    {t('close')}
                  </button>
                </div>
              )}

              {activeModal === 'language' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {availableLanguages.map((l) => {
                    const isSelected = lang === l.id;
                    return (
                      <div
                        key={l.id}
                        onClick={() => {
                          setLang(l.id);
                          setActiveModal(null);
                        }}
                        style={{
                          backgroundColor: isSelected 
                            ? 'rgba(255, 138, 0, 0.12)'
                            : themeColors.cardBg,
                          border: isSelected 
                            ? '2px solid #FF8A00' 
                            : `1px solid ${themeColors.border}`,
                          borderRadius: '14px',
                          padding: '14px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '20px' }}>{l.flag}</span>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: '700', color: themeColors.text }}>
                              {l.name}
                            </div>
                            <div style={{ fontSize: '12px', color: themeColors.subText }}>
                              {l.native}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: '#FF8A00',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#000000'
                          }}>
                            <Check size={16} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {activeModal === 'theme' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {availableThemes.map((thm) => {
                    const IconComponent = thm.icon;
                    const isSelected = theme === thm.id;
                    return (
                      <div
                        key={thm.id}
                        onClick={() => {
                          setTheme(thm.id);
                          setActiveModal(null);
                        }}
                        style={{
                          backgroundColor: isSelected 
                            ? 'rgba(255, 138, 0, 0.12)'
                            : themeColors.cardBg,
                          border: isSelected 
                            ? '2px solid #FF8A00' 
                            : `1px solid ${themeColors.border}`,
                          borderRadius: '14px',
                          padding: '14px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            backgroundColor: isSelected ? '#FF8A00' : (isLight ? '#E2E8F0' : '#262C36'),
                            color: isSelected ? '#000000' : themeColors.subText,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <IconComponent size={20} />
                          </div>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: '700', color: themeColors.text }}>
                              {thm.name}
                            </div>
                            <div style={{ fontSize: '11px', color: themeColors.subText }}>
                              {thm.desc}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: '#FF8A00',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#000000'
                          }}>
                            <Check size={16} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {activeModal !== 'changePassword' && activeModal !== 'personalInfo' && (
                <button
                  onClick={() => setActiveModal(null)}
                  className="primary-orange-btn"
                  style={{
                    marginTop: '20px',
                    width: '100%',
                    height: '46px',
                    fontSize: '14px'
                  }}
                >
                  {t('close')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bottom Navigation Bar */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '64px',
          backgroundColor: themeColors.navBg,
          borderTop: `1px solid ${themeColors.border}`,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          alignItems: 'center',
          zIndex: 30
        }}>
          {/* Tab 1: Home */}
          <button
            onClick={() => navigate('/home')}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer',
              color: themeColors.subText
            }}
          >
            <Home size={18} color={themeColors.subText} />
            <span style={{ fontSize: '11px', fontWeight: '700' }}>{t('home') || 'Home'}</span>
          </button>

          {/* Tab 2: History */}
          <button
            onClick={() => navigate('/history')}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer',
              color: themeColors.subText
            }}
          >
            <Clock size={18} color={themeColors.subText} />
            <span style={{ fontSize: '11px', fontWeight: '700' }}>{t('history') || 'History'}</span>
          </button>

          {/* Tab 3: Profile */}
          <button
            onClick={() => navigate('/profile')}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer',
              color: themeColors.subText
            }}
          >
            <User size={18} color={themeColors.subText} />
            <span style={{ fontSize: '11px', fontWeight: '700' }}>{t('profile') || 'Profile'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;
