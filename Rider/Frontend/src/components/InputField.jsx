import React from 'react';

const InputField = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  onRightIconClick,
  disabled = false,
  required = false,
  autoComplete
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      marginBottom: '18px',
      width: '100%'
    }}>
      {label && (
        <label style={{
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#A0A0A0',
          marginBottom: '8px',
          display: 'block'
        }}>
          {label} {required && <span style={{ color: '#FF8A00' }}>*</span>}
        </label>
      )}

      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%'
      }}>
        {LeftIcon && (
          <div style={{
            position: 'absolute',
            left: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#A0A0A0',
            pointerEvents: 'none',
            zIndex: 1
          }}>
            <LeftIcon size={18} />
          </div>
        )}

        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          style={{
            width: '100%',
            height: '48px',
            minHeight: '48px',
            backgroundColor: '#111111',
            border: error ? '1px solid #EF4444' : '1px solid #2A2A2A',
            borderRadius: '12px',
            paddingLeft: LeftIcon ? '44px' : '16px',
            paddingRight: RightIcon ? '44px' : '16px',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: '500',
            outline: 'none',
            transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
            fontFamily: 'inherit'
          }}
          onFocus={(e) => {
            if (!error) {
              e.target.style.borderColor = '#FF8A00';
              e.target.style.boxShadow = '0 0 0 3px rgba(255, 138, 0, 0.12)';
            }
          }}
          onBlur={(e) => {
            if (!error) {
              e.target.style.borderColor = '#2A2A2A';
              e.target.style.boxShadow = 'none';
            }
          }}
        />

        {RightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            style={{
              position: 'absolute',
              right: '12px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#A0A0A0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '6px',
              transition: 'color 0.2s ease'
            }}
            tabIndex={-1}
            aria-label="Action"
          >
            <RightIcon size={18} />
          </button>
        )}
      </div>

      {error && (
        <span style={{
          color: '#EF4444',
          fontSize: '12px',
          fontWeight: '500',
          marginTop: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          • {error}
        </span>
      )}
    </div>
  );
};

export default InputField;
