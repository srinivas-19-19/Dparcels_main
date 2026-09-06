import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { 
  X, 
  Clock, 
  User,
  Settings,
  Navigation,
  CornerUpRight,
  Volume2
} from 'lucide-react';

const TripAcceptedPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { themeColors } = useTheme();

  const [isOnline, setIsOnline] = useState(true);
  const [showGPSModal, setShowGPSModal] = useState(false);

  const handleNavigateClick = () => {
    setShowGPSModal(true);
  };

  const handleArrivedAtPickup = () => {
    navigate('/arrived-at-pickup');
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
      fontFamily: 'var(--font-main)'
    }}>
      {/* Phone Screen Frame Container */}
      <div className="responsive-phone-frame" style={{
        backgroundColor: '#070707',
        border: '1px solid #2A2A2A'
      }}>

        {/* Header Bar: Online Status */}
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          pointerEvents: 'none'
        }}>
          <button
            onClick={() => setIsOnline(!isOnline)}
            style={{
              pointerEvents: 'auto',
              backgroundColor: '#111111',
              border: '1px solid #2A2A2A',
              borderRadius: '24px',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
              cursor: 'pointer'
            }}
          >
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: isOnline ? '#10B981' : '#EF4444',
              boxShadow: isOnline ? '0 0 10px #10B981' : 'none'
            }} />
            <span style={{
              fontSize: '12px',
              fontWeight: '800',
              color: isOnline ? '#10B981' : '#EF4444',
              letterSpacing: '0.05em'
            }}>
              {isOnline ? t('online') : t('offline')}
            </span>
          </button>
        </div>

        {/* Map View Canvas with Route Line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#070707',
          overflow: 'hidden'
        }}>
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.95 }}>
            <defs>
              <pattern id="grid-trip" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#1D2636" strokeWidth="1.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="#070707" />
            <rect width="100%" height="100%" fill="url(#grid-trip)" />

            <path d="M -50 120 Q 200 80 450 220" fill="none" stroke="#253147" strokeWidth="14" />
            <path d="M -20 340 L 450 180" fill="none" stroke="#2D3A54" strokeWidth="10" />
            <path d="M 180 -50 L 220 600" fill="none" stroke="#253147" strokeWidth="16" />

            <path 
              d="M 215 360 L 255 240 L 270 170" 
              fill="none" 
              stroke="#FF8A00" 
              strokeWidth="6" 
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 8px rgba(255, 138, 0, 0.7))' }}
            />

            <g transform="translate(270, 165)">
              <circle cx="0" cy="0" r="14" fill="rgba(255, 138, 0, 0.25)" />
              <circle cx="0" cy="0" r="6" fill="#FF8A00" stroke="#FFFFFF" strokeWidth="2" />
            </g>

            <g transform="translate(215, 360)">
              <path d="M 0 0 L -8 -16 A 10 10 0 1 1 8 -16 Z" fill="#FF8A00" />
              <circle cx="0" cy="-14" r="4" fill="#000000" />
            </g>
          </svg>
        </div>

        {/* Bottom Sheet Card: "Delivery #DP1024" */}
        <div style={{
          position: 'absolute',
          bottom: '68px',
          left: '12px',
          right: '12px',
          zIndex: 15
        }}>
          <div style={{
            backgroundColor: '#111111',
            border: '1px solid #2A2A2A',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.85)',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '800',
                color: '#FFFFFF',
                margin: 0
              }}>
                Delivery #DP1024
              </h3>

              <button
                onClick={() => navigate('/home')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#A0A0A0',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '500',
                color: '#A0A0A0',
                marginBottom: '2px'
              }}>
                {t('pickup')}
              </div>
              <div style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#FFFFFF'
              }}>
                DParcels Hub, Adoni
              </div>
            </div>

            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#A0A0A0',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>4.8 km away</span>
              <span style={{ color: '#FF8A00' }}>•</span>
              <span>16 min</span>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {/* Navigate Button */}
              <button
                onClick={handleNavigateClick}
                className="primary-orange-btn"
                style={{
                  width: '100%',
                  height: '48px',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Navigation size={18} />
                <span>{t('navigate')}</span>
              </button>

              <button
                onClick={handleArrivedAtPickup}
                style={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: '#181818',
                  border: '1px solid #2A2A2A',
                  borderRadius: '12px',
                  color: '#FFFFFF',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {t('arrivedAtPickup')}
              </button>
            </div>
          </div>
        </div>

        {/* LIVE GPS NAVIGATION MODAL */}
        {showGPSModal && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(7,7,7,0.92)',
            backdropFilter: 'blur(8px)',
            zIndex: 40,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '24px 16px'
          }}>
            <div style={{
              backgroundColor: '#10B981',
              borderRadius: '20px',
              padding: '20px',
              color: '#FFFFFF',
              boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <CornerUpRight size={38} strokeWidth={3} />
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '900' }}>In 200m</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>Turn right onto Main Hub Road</div>
                </div>
              </div>
              <Volume2 size={24} />
            </div>

            <div style={{
              backgroundColor: '#111111',
              border: '1px solid #2A2A2A',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '12px', color: '#A0A0A0', fontWeight: '600' }}>DESTINATION</div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#FFFFFF', marginTop: '2px' }}>DParcels Hub, Adoni</div>
              <div style={{ fontSize: '13px', color: '#FF8A00', fontWeight: '700', marginTop: '4px' }}>4.8 km • 16 min ETA</div>
            </div>

            <button
              onClick={() => setShowGPSModal(false)}
              style={{
                width: '100%',
                height: '50px',
                backgroundColor: '#EF4444',
                border: 'none',
                borderRadius: '14px',
                color: '#FFFFFF',
                fontSize: '16px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              Exit Navigation
            </button>
          </div>
        )}

        {/* Bottom Navigation Bar */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '64px',
          backgroundColor: '#070707',
          borderTop: '1px solid #2A2A2A',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          zIndex: 30
        }}>
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
              color: '#FF8A00'
            }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2px',
              width: '18px',
              height: '18px'
            }}>
              <div style={{ backgroundColor: '#FF8A00', borderRadius: '2px' }} />
              <div style={{ backgroundColor: '#FF8A00', borderRadius: '2px' }} />
              <div style={{ backgroundColor: '#FF8A00', borderRadius: '2px' }} />
              <div style={{ backgroundColor: '#FF8A00', borderRadius: '2px' }} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: '700' }}>{t('home')}</span>
          </button>

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
              color: '#A0A0A0'
            }}
          >
            <Clock size={18} />
            <span style={{ fontSize: '11px', fontWeight: '700' }}>{t('history')}</span>
          </button>

          <button
            onClick={() => navigate('/settings')}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer',
              color: '#A0A0A0'
            }}
          >
            <Settings size={18} />
            <span style={{ fontSize: '11px', fontWeight: '700' }}>{t('settings')}</span>
          </button>

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
              color: '#A0A0A0'
            }}
          >
            <User size={18} />
            <span style={{ fontSize: '11px', fontWeight: '700' }}>{t('profile')}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default TripAcceptedPage;
