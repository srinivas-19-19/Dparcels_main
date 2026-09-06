import React from 'react';
import { Zap } from 'lucide-react';

const MotorcycleIcon = ({ color, size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5.5" cy="17.5" r="3.5" />
    <circle cx="18.5" cy="17.5" r="3.5" />
    <path d="M15 6h-4l-3 6h7.5l2.5-4.5h-3" />
    <path d="M9 17.5l2.5-5.5h4l3 5.5" />
    <path d="M13 6V4" />
  </svg>
);

const ScooterIcon = ({ color, size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="18" r="2.5" />
    <circle cx="18" cy="18" r="2.5" />
    <path d="M8.5 18h7" />
    <path d="M6 15.5l2-6.5h5.5l2 6.5" />
    <rect x="3.5" y="8" width="4" height="4" rx="1" fill={color} stroke="none" />
    <path d="M12 9h4.5l1.5 3" />
    <path d="M14 6h3" />
  </svg>
);

const VehicleCard = ({ id, label, description, iconType, isSelected, onClick }) => {
  const renderIcon = () => {
    const iconColor = isSelected ? '#000000' : '#FF8A00';
    if (iconType === 'motorbike') return <MotorcycleIcon color={iconColor} size={28} />;
    if (iconType === 'scooter') return <ScooterIcon color={iconColor} size={28} />;
    if (iconType === 'electric') return <Zap color={iconColor} size={28} strokeWidth={2.2} />;
    return <MotorcycleIcon color={iconColor} size={28} />;
  };

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px 18px',
        borderRadius: '14px',
        backgroundColor: isSelected ? '#FF8A00' : '#111111',
        border: isSelected ? '2px solid #FF8A00' : '1px solid #2A2A2A',
        boxShadow: isSelected ? '0 8px 25px rgba(255, 138, 0, 0.35)' : 'none',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        userSelect: 'none',
        marginBottom: '12px'
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = 'rgba(255, 138, 0, 0.45)';
          e.currentTarget.style.backgroundColor = '#181818';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = '#2A2A2A';
          e.currentTarget.style.backgroundColor = '#111111';
        }
      }}
    >
      {/* Icon Badge */}
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        backgroundColor: isSelected ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 138, 0, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {renderIcon()}
      </div>

      {/* Text Info */}
      <div style={{ flex: 1 }}>
        <h4 style={{
          fontSize: '16px',
          fontWeight: '800',
          color: isSelected ? '#000000' : '#FFFFFF',
          margin: '0 0 2px 0'
        }}>
          {label}
        </h4>
        {description && (
          <p style={{
            fontSize: '12px',
            color: isSelected ? 'rgba(0, 0, 0, 0.8)' : '#A0A0A0',
            margin: 0,
            lineHeight: '1.3'
          }}>
            {description}
          </p>
        )}
      </div>

      {/* Radio Checkmark Indicator */}
      <div style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        border: isSelected ? '6px solid #000000' : '2px solid #A0A0A0',
        backgroundColor: isSelected ? '#FF8A00' : 'transparent',
        flexShrink: 0,
        transition: 'all 0.2s ease'
      }} />
    </div>
  );
};

export default VehicleCard;
