import React from 'react';

const Logo = ({ size = 'normal', showSubtitle = true }) => {
  const isLarge = size === 'large';
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: isLarge ? '28px' : '20px',
      textAlign: 'center'
    }}>
      {/* Scooter Rider Graphic Icon */}
      <div style={{
        position: 'relative',
        width: isLarge ? '64px' : '52px',
        height: isLarge ? '64px' : '52px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #FF8A00 0%, #E86F00 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 25px rgba(255, 138, 0, 0.35)',
        marginBottom: '12px'
      }}>
        {/* Rider Scooter SVG */}
        <svg 
          width={isLarge ? "36" : "30"} 
          height={isLarge ? "36" : "30"} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#000000" 
          strokeWidth="2.2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="6" cy="18" r="2.5" />
          <circle cx="18" cy="18" r="2.5" />
          <path d="M8.5 18h7" />
          <path d="M6 15.5l2-6.5h5.5l2 6.5" />
          <rect x="3.5" y="8" width="4" height="4" rx="1" fill="#000000" stroke="none" />
          <path d="M12 9h4.5l1.5 3" />
          <path d="M14 6h3" />
        </svg>
      </div>

      {/* Brand Name: DParcels */}
      <h1 style={{
        fontSize: isLarge ? '26px' : '22px',
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: '-0.03em',
        lineHeight: '1.2',
        margin: '0 0 4px 0'
      }}>
        <span style={{ color: '#FF8A00' }}>D</span>Parcels
      </h1>

      {/* App Badge */}
      {showSubtitle && (
        <div style={{
          fontSize: '10px',
          fontWeight: '700',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#FF8A00',
          backgroundColor: 'rgba(255, 138, 0, 0.12)',
          border: '1px solid rgba(255, 138, 0, 0.35)',
          padding: '3px 10px',
          borderRadius: '20px',
          marginTop: '2px'
        }}>
          RIDER PARTNER APP
        </div>
      )}
    </div>
  );
};

export default Logo;
