import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  X, 
  Clock, 
  User,
  Settings
} from 'lucide-react';

const ArrivedAtPickupPage = () => {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(true);

  const handleConfirmPickup = () => {
    navigate('/on-the-way');
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: '#070707',
      color: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0',
      position: 'relative',
      fontFamily: 'var(--font-main)'
    }}>
      {/* Phone Screen Container Frame */}
      <div className="responsive-phone-frame" style={{
        backgroundColor: '#070707',
        border: '1px solid #2A2A2A'
      }}>

        {/* Top Header Label Banner */}
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          backgroundColor: '#000000',
          padding: '4px 0',
          textAlign: 'center',
          fontSize: '11px',
          fontWeight: '700',
          color: '#A0A0A0',
          letterSpacing: '0.05em',
          zIndex: 25
        }}>
          Arrived at Pickup
        </div>

        {/* Header Bar: Online Status */}
        <div style={{
          position: 'absolute',
          top: '24px',
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
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </button>
        </div>

        {/* Map View Canvas */}
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
              <pattern id="grid-arrived" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#1D2636" strokeWidth="1.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="#070707" />
            <rect width="100%" height="100%" fill="url(#grid-arrived)" />

            <path d="M -50 120 Q 200 80 450 220" fill="none" stroke="#253147" strokeWidth="14" />
            <path d="M -20 340 L 450 180" fill="none" stroke="#2D3A54" strokeWidth="10" />
            <path d="M 180 -50 L 220 600" fill="none" stroke="#253147" strokeWidth="16" />

            <path 
              d="M 215 360 L 255 240 L 270 170" 
              fill="none" 
              stroke="#FF8A00" 
              strokeWidth="5" 
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 8px rgba(255, 138, 0, 0.7))' }}
            />

            <g transform="translate(270, 165)">
              <circle cx="0" cy="0" r="14" fill="rgba(255, 138, 0, 0.3)" />
              <circle cx="0" cy="0" r="6" fill="#FF8A00" stroke="#FFFFFF" strokeWidth="2" />
            </g>

            <g transform="translate(215, 360)">
              <path d="M 0 0 L -8 -16 A 10 10 0 1 1 8 -16 Z" fill="#FF8A00" />
              <circle cx="0" cy="-14" r="4" fill="#000000" />
            </g>
          </svg>
        </div>

        {/* Bottom Sheet Card */}
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
                fontSize: '17px',
                fontWeight: '700',
                color: '#FFFFFF',
                margin: 0
              }}>
                Pickup Details
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

            <div style={{ marginBottom: '16px' }}>
              <h4 style={{
                fontSize: '18px',
                fontWeight: '800',
                color: '#FFFFFF',
                margin: '0 0 4px 0'
              }}>
                Delivery #DP1024
              </h4>
              <p style={{
                fontSize: '14px',
                color: '#A0A0A0',
                margin: 0
              }}>
                DParcels Hub, Adoni
              </p>
            </div>

            <div style={{
              height: '1px',
              backgroundColor: '#2A2A2A',
              margin: '16px 0 20px 0'
            }} />

            <div style={{
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#A0A0A0',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: '12px'
              }}>
                OTP Code
              </div>

              <div style={{
                fontSize: '32px',
                fontWeight: '800',
                color: '#FFFFFF',
                letterSpacing: '0.45em',
                fontFamily: 'monospace',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingLeft: '0.45em'
              }}>
                4 8 2 1
              </div>
            </div>

            <button
              onClick={handleConfirmPickup}
              className="primary-orange-btn"
              style={{
                width: '100%',
                height: '50px',
                fontSize: '16px'
              }}
            >
              Confirm Pickup
            </button>
          </div>
        </div>

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
            <span style={{ fontSize: '11px', fontWeight: '700' }}>Home</span>
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
            <span style={{ fontSize: '11px', fontWeight: '700' }}>History</span>
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
            <span style={{ fontSize: '11px', fontWeight: '700' }}>Settings</span>
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
            <span style={{ fontSize: '11px', fontWeight: '700' }}>Profile</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default ArrivedAtPickupPage;
