import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { 
  User, 
  Landmark, 
  HelpCircle, 
  Shield, 
  Settings, 
  LogOut, 
  ChevronRight, 
  Star,
  Clock,
  Home,
  Phone,
  MessageSquare,
  Mail,
  X,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Headphones,
  Globe,
  Moon,
  Sun,
  Laptop,
  Bell,
  Volume2,
  KeyRound,
  Bike,
  Check,
  Package
} from 'lucide-react';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { lang, setLang, t } = useLanguage();
  const { theme, setTheme, isLight, themeColors } = useTheme();

  // Settings Toggles
  const [notifications, setNotifications] = useState(true);
  const [soundVibration, setSoundVibration] = useState(true);

  // Active Modal States
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showPersonalInfoModal, setShowPersonalInfoModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    { id: 'Dark', name: 'Dark Mode', desc: 'Sleek dark theme', icon: Moon },
    { id: 'Light', name: 'Light Mode', desc: 'Bright light theme', icon: Sun }
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
    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
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
      setShowPasswordModal(false);
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
      fontFamily: 'var(--font-main, "Plus Jakarta Sans", sans-serif)',
      transition: 'all 0.3s ease',
      userSelect: 'none'
    }}>
      {/* Phone Screen Container Frame */}
      <div className="responsive-phone-frame" style={{
        backgroundColor: themeColors.frameBg,
        border: `1px solid ${themeColors.border}`
      }}>

        {/* ================= MAIN SCROLLABLE CONTENT ================= */}
        <div style={{
          flex: 1,
          padding: '20px 16px 80px 16px',
          overflowY: 'auto'
        }}>

          {/* 1. TOP PROFILE HEADER */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '18px',
            paddingTop: '4px'
          }}>
            {/* Avatar Photo with Orange Glowing Border */}
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: themeColors.cardSecondary,
              overflow: 'hidden',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2.5px solid #FF8A00`,
              boxShadow: '0 4px 16px rgba(255, 138, 0, 0.4)'
            }}>
              <svg width="72" height="72" viewBox="0 0 100 100" fill="none">
                <rect width="100" height="100" fill="#181818" />
                <circle cx="50" cy="42" r="22" fill="#E0A96D" />
                <path d="M 32 40 Q 50 64 68 40 C 68 56 32 56 32 40 Z" fill="#2D231E" />
                <circle cx="43" cy="38" r="2.5" fill="#1E1E1E" />
                <circle cx="57" cy="38" r="2.5" fill="#1E1E1E" />
                <path d="M 44 48 Q 50 54 56 48" stroke="#FFFFFF" strokeWidth="2" fill="none" />
                <path d="M 20 100 C 20 70 80 70 80 100 Z" fill="#FF8A00" />
              </svg>
            </div>

            {/* Rider Name & Badge */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h1 style={{
                  fontSize: '20px',
                  fontWeight: '900',
                  color: themeColors.text,
                  margin: 0,
                  letterSpacing: '-0.01em'
                }}>
                  Gorkal sreenu
                </h1>
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: '#3B82F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: '900'
                }}>
                  ✓
                </div>
              </div>

              <div style={{
                fontSize: '12px',
                color: '#FF8A00',
                fontWeight: '800',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>#0007</span>
                <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10B981', padding: '2px 8px', borderRadius: '10px', fontSize: '10px' }}>Verified</span>
              </div>
            </div>
          </div>

          {/* 2. METRIC SUMMARY CARDS */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            marginBottom: '18px'
          }}>
            {/* Rating Card */}
            <div style={{
              backgroundColor: themeColors.cardBg,
              border: `1px solid ${themeColors.border}`,
              borderRadius: '16px',
              padding: '14px'
            }}>
              <div style={{
                fontSize: '22px',
                fontWeight: '900',
                color: themeColors.text,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                lineHeight: '1'
              }}>
                <span>5.0</span>
                <Star size={18} fill="#FF8A00" color="#FF8A00" />
              </div>
              <div style={{
                fontSize: '11px',
                color: themeColors.subText,
                marginTop: '4px',
                fontWeight: '600'
              }}>
                (24 {t('reviews')})
              </div>
            </div>

            {/* Total Earnings Card */}
            <div style={{
              backgroundColor: themeColors.cardBg,
              border: `1px solid ${themeColors.border}`,
              borderRadius: '16px',
              padding: '14px'
            }}>
              <div style={{
                fontSize: '10px',
                fontWeight: '700',
                color: themeColors.subText,
                marginBottom: '4px',
                textTransform: 'uppercase'
              }}>
                {t('lifetimeEarnings')}
              </div>
              <div style={{
                fontSize: '22px',
                fontWeight: '900',
                color: '#FF8A00',
                lineHeight: '1'
              }}>
                ₹11,420
              </div>
            </div>
          </div>

          {/* 3. ACCOUNT & VEHICLE SECTION */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              fontSize: '11px',
              fontWeight: '800',
              color: themeColors.subText,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '8px',
              paddingLeft: '4px'
            }}>
              {t('accountVehicle')}
            </div>

            <div style={{
              backgroundColor: themeColors.cardBg,
              border: `1px solid ${themeColors.border}`,
              borderRadius: '16px',
              overflow: 'hidden'
            }}>
              {/* Personal Info Item */}
              <div
                onClick={() => setShowPersonalInfoModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderBottom: `1px solid ${themeColors.innerBorder}`,
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: themeColors.cardSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: themeColors.text }}>
                    <User size={15} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: themeColors.text }}>
                    {t('personalInfo')}
                  </span>
                </div>
                <ChevronRight size={18} color={themeColors.subText} />
              </div>

              {/* Bank Details Item */}
              <div
                onClick={() => setShowBankModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderBottom: `1px solid ${themeColors.innerBorder}`,
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: themeColors.cardSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: themeColors.text }}>
                    <Landmark size={15} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: themeColors.text }}>
                    {t('bankDetails')}
                  </span>
                </div>
                <ChevronRight size={18} color={themeColors.subText} />
              </div>

              {/* Vehicle Item */}
              <div
                onClick={() => setShowVehicleModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderBottom: `1px solid ${themeColors.innerBorder}`,
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: themeColors.cardSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: themeColors.text }}>
                    <Bike size={15} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: themeColors.text }}>
                    {t('vehicleLicense')}
                  </span>
                </div>
                <ChevronRight size={18} color={themeColors.subText} />
              </div>

              {/* Change Password & Security Item */}
              <div
                onClick={() => setShowPasswordModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: themeColors.cardSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: themeColors.text }}>
                    <KeyRound size={15} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: themeColors.text }}>
                    {t('changePasswordSecurity')}
                  </span>
                </div>
                <ChevronRight size={18} color={themeColors.subText} />
              </div>
            </div>
          </div>

          {/* 4. APP SETTINGS & PREFERENCES SECTION */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              fontSize: '11px',
              fontWeight: '800',
              color: themeColors.subText,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '8px',
              paddingLeft: '4px'
            }}>
              {t('supportSettings')}
            </div>

            <div style={{
              backgroundColor: themeColors.cardBg,
              border: `1px solid ${themeColors.border}`,
              borderRadius: '16px',
              overflow: 'hidden'
            }}>
              {/* Language Selector */}
              <div
                onClick={() => setShowLanguageModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderBottom: `1px solid ${themeColors.innerBorder}`,
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: themeColors.cardSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF8A00' }}>
                    <Globe size={15} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: themeColors.text }}>
                    {t('appLanguage')}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#FF8A00', fontWeight: '700' }}>{getLanguageDisplayName(lang)}</span>
                  <ChevronRight size={18} color={themeColors.subText} />
                </div>
              </div>

              {/* Theme Selector */}
              <div
                onClick={() => setShowThemeModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderBottom: `1px solid ${themeColors.innerBorder}`,
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: themeColors.cardSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF8A00' }}>
                    <Moon size={15} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: themeColors.text }}>
                    {t('appearanceTheme')}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: themeColors.subText, fontWeight: '700' }}>{theme}</span>
                  <ChevronRight size={18} color={themeColors.subText} />
                </div>
              </div>

              {/* Help & Support */}
              <div
                onClick={() => setShowSupportModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: 'rgba(255, 138, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF8A00' }}>
                    <Headphones size={15} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: themeColors.text }}>
                    {t('helpSupport')}
                  </span>
                </div>
                <ChevronRight size={18} color="#FF8A00" />
              </div>
            </div>
          </div>

          {/* 5. LOGOUT BUTTON */}
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: themeColors.cardBg,
              border: `1px solid ${themeColors.border}`,
              borderRadius: '16px',
              color: '#EF4444',
              fontSize: '14px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <LogOut size={16} color="#EF4444" />
            <span>{t('logoutAccount')}</span>
          </button>

        </div>

        {/* ================= MODAL: CHANGE PASSWORD MODAL ================= */}
        {showPasswordModal && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: themeColors.modalOverlay,
            backdropFilter: 'blur(10px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            <div style={{
              width: '100%',
              backgroundColor: themeColors.modalBg,
              border: `1px solid ${themeColors.border}`,
              borderRadius: '22px',
              padding: '20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.9)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <KeyRound size={20} color="#FF8A00" />
                  <h3 style={{ fontSize: '17px', fontWeight: '800', color: themeColors.text, margin: 0 }}>
                    {t('changePasswordSecurity')}
                  </h3>
                </div>
                <button onClick={() => setShowPasswordModal(false)} style={{ background: 'none', border: 'none', color: themeColors.subText, cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              {passwordSuccess ? (
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                  <CheckCircle2 size={32} color="#10B981" style={{ margin: '0 auto 8px auto' }} />
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#10B981' }}>Password Changed Successfully!</div>
                  <div style={{ fontSize: '11px', color: themeColors.subText, marginTop: '4px' }}>Your security credentials have been updated.</div>
                </div>
              ) : (
                <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {passwordError && (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid #EF4444', color: '#EF4444', borderRadius: '10px', padding: '10px', fontSize: '12px', fontWeight: '700' }}>
                      {passwordError}
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: themeColors.subText, marginBottom: '4px', display: 'block' }}>Current Password</label>
                    <input
                      type="password"
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        backgroundColor: themeColors.cardBg,
                        border: `1px solid ${themeColors.border}`,
                        borderRadius: '12px',
                        padding: '12px 14px',
                        color: themeColors.text,
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: themeColors.subText, marginBottom: '4px', display: 'block' }}>New Password</label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        backgroundColor: themeColors.cardBg,
                        border: `1px solid ${themeColors.border}`,
                        borderRadius: '12px',
                        padding: '12px 14px',
                        color: themeColors.text,
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: themeColors.subText, marginBottom: '4px', display: 'block' }}>Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        backgroundColor: themeColors.cardBg,
                        border: `1px solid ${themeColors.border}`,
                        borderRadius: '12px',
                        padding: '12px 14px',
                        color: themeColors.text,
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <button type="submit" className="primary-orange-btn" style={{ width: '100%', padding: '12px', fontSize: '14px', marginTop: '4px' }}>
                    Update Password
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ================= MODAL 1: HELP & SUPPORT MODAL ================= */}
        {showSupportModal && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: themeColors.modalOverlay,
            backdropFilter: 'blur(10px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            <div style={{
              width: '100%',
              backgroundColor: themeColors.modalBg,
              border: `1px solid ${themeColors.border}`,
              borderRadius: '22px',
              padding: '20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.85)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Headphones size={22} color="#FF8A00" />
                  <h3 style={{ fontSize: '17px', fontWeight: '800', color: themeColors.text, margin: 0 }}>
                    {t('riderSupportCenter')}
                  </h3>
                </div>

                <button onClick={() => setShowSupportModal(false)} style={{ background: 'none', border: 'none', color: themeColors.subText, cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                <a
                  href="tel:18001234567"
                  style={{
                    backgroundColor: '#FF8A00',
                    color: '#000000',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Phone size={20} color="#000000" />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '900', color: '#000000' }}>{t('callHelpline')}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(0,0,0,0.8)', fontWeight: '700' }}>1800-123-4567</div>
                    </div>
                  </div>
                  <ChevronRight size={18} color="#000000" />
                </a>
              </div>

              <button onClick={() => setShowSupportModal(false)} className="primary-orange-btn" style={{ width: '100%', padding: '12px', fontSize: '14px' }}>
                {t('closeSupport')}
              </button>
            </div>
          </div>
        )}

        {/* ================= MODAL 2: LANGUAGE SELECTOR MODAL ================= */}
        {showLanguageModal && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: themeColors.modalOverlay,
            backdropFilter: 'blur(10px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            <div style={{
              width: '100%',
              backgroundColor: themeColors.modalBg,
              border: `1px solid ${themeColors.border}`,
              borderRadius: '22px',
              padding: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={20} color="#FF8A00" />
                  <h3 style={{ fontSize: '17px', fontWeight: '800', color: themeColors.text, margin: 0 }}>{t('appLanguage')}</h3>
                </div>
                <button onClick={() => setShowLanguageModal(false)} style={{ background: 'none', border: 'none', color: themeColors.subText, cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {availableLanguages.map((l) => {
                  const isSelected = lang === l.id;
                  return (
                    <div
                      key={l.id}
                      onClick={() => { setLang(l.id); setShowLanguageModal(false); }}
                      style={{
                        backgroundColor: isSelected ? 'rgba(255, 138, 0, 0.12)' : themeColors.cardBg,
                        border: isSelected ? '1px solid #FF8A00' : `1px solid ${themeColors.border}`,
                        borderRadius: '12px',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>{l.flag}</span>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: isSelected ? '#FF8A00' : themeColors.text }}>{l.native}</span>
                        <span style={{ fontSize: '12px', color: themeColors.subText }}>({l.name})</span>
                      </div>
                      {isSelected && <Check size={18} color="#FF8A00" />}
                    </div>
                  );
                })}
              </div>

              <button onClick={() => setShowLanguageModal(false)} className="primary-orange-btn" style={{ width: '100%', padding: '12px', fontSize: '14px' }}>
                Done
              </button>
            </div>
          </div>
        )}

        {/* ================= MODAL 3: THEME SELECTOR MODAL ================= */}
        {showThemeModal && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: themeColors.modalOverlay,
            backdropFilter: 'blur(10px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            <div style={{
              width: '100%',
              backgroundColor: themeColors.modalBg,
              border: `1px solid ${themeColors.border}`,
              borderRadius: '22px',
              padding: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: themeColors.text, margin: 0 }}>{t('appearanceTheme')}</h3>
                <button onClick={() => setShowThemeModal(false)} style={{ background: 'none', border: 'none', color: themeColors.subText, cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {availableThemes.map((tItem) => {
                  const IconComp = tItem.icon;
                  const isSelected = theme === tItem.id;
                  return (
                    <div
                      key={tItem.id}
                      onClick={() => { setTheme(tItem.id); setShowThemeModal(false); }}
                      style={{
                        backgroundColor: isSelected ? 'rgba(255, 138, 0, 0.12)' : themeColors.cardBg,
                        border: isSelected ? '1px solid #FF8A00' : `1px solid ${themeColors.border}`,
                        borderRadius: '12px',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <IconComp size={18} color={isSelected ? '#FF8A00' : themeColors.subText} />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '800', color: isSelected ? '#FF8A00' : themeColors.text }}>{tItem.name}</div>
                          <div style={{ fontSize: '10px', color: themeColors.subText }}>{tItem.desc}</div>
                        </div>
                      </div>
                      {isSelected && <Check size={18} color="#FF8A00" />}
                    </div>
                  );
                })}
              </div>

              <button onClick={() => setShowThemeModal(false)} className="primary-orange-btn" style={{ width: '100%', padding: '12px', fontSize: '14px' }}>
                Done
              </button>
            </div>
          </div>
        )}

        {/* ================= 6. FIXED BOTTOM NAVIGATION BAR ================= */}
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
            <span style={{ fontSize: '11px', fontWeight: '700' }}>{t('home')}</span>
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
            <Package size={18} color={themeColors.subText} />
            <span style={{ fontSize: '11px', fontWeight: '700' }}>{t('history')}</span>
          </button>

          {/* Tab 3: Profile (Active) */}
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
              color: '#FF8A00'
            }}
          >
            <User size={18} color="#FF8A00" />
            <span style={{ fontSize: '11px', fontWeight: '800' }}>{t('profile')}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
