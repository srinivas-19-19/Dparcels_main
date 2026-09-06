import React from 'react';
import { Loader2 } from 'lucide-react';

const PrimaryButton = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // 'primary' | 'outline' | 'secondary'
  isLoading = false,
  disabled = false,
  fullWidth = true,
  icon: Icon = null
}) => {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';

  const baseStyle = {
    width: fullWidth ? '100%' : 'auto',
    height: '50px',
    minHeight: '48px',
    borderRadius: '14px',
    fontSize: '15px',
    fontWeight: '800',
    letterSpacing: '-0.01em',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    border: isOutline ? '1px solid #FF8A00' : 'none',
    backgroundColor: isPrimary 
      ? '#FF8A00' 
      : isOutline 
        ? 'transparent' 
        : '#181818',
    color: isPrimary 
      ? '#000000' 
      : isOutline 
        ? '#FF8A00' 
        : '#FFFFFF',
    boxShadow: isPrimary ? '0 8px 25px rgba(255, 138, 0, 0.25)' : 'none',
    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    position: 'relative',
    overflow: 'hidden',
    userSelect: 'none',
    opacity: disabled ? 0.6 : 1
  };

  const handleMouseEnter = (e) => {
    if (disabled || isLoading) return;
    if (isPrimary) {
      e.currentTarget.style.backgroundColor = '#FF9F1C';
      e.currentTarget.style.boxShadow = '0 12px 30px rgba(255, 138, 0, 0.35)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    } else if (isOutline) {
      e.currentTarget.style.backgroundColor = 'rgba(255, 138, 0, 0.12)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    }
  };

  const handleMouseLeave = (e) => {
    if (disabled || isLoading) return;
    if (isPrimary) {
      e.currentTarget.style.backgroundColor = '#FF8A00';
      e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 138, 0, 0.25)';
      e.currentTarget.style.transform = 'none';
    } else if (isOutline) {
      e.currentTarget.style.backgroundColor = 'transparent';
      e.currentTarget.style.transform = 'none';
    }
  };

  const handleMouseDown = (e) => {
    if (disabled || isLoading) return;
    e.currentTarget.style.transform = 'scale(0.98)';
  };

  const handleMouseUp = (e) => {
    if (disabled || isLoading) return;
    e.currentTarget.style.transform = 'none';
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      style={baseStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {isLoading ? (
        <>
          <Loader2 size={20} className="animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {children}
          {Icon && <Icon size={18} />}
        </>
      )}
    </button>
  );
};

export default PrimaryButton;
