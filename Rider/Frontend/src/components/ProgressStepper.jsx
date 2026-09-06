import React from 'react';
import { Check } from 'lucide-react';

const ProgressStepper = ({ currentStep = 1 }) => {
  const steps = [
    { number: 1, label: 'ACCOUNT' },
    { number: 2, label: 'SERVICE' },
    { number: 3, label: 'UPLOADS' }
  ];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      backgroundColor: '#111111',
      border: '1px solid #2A2A2A',
      borderRadius: '14px',
      padding: '12px 14px',
      marginBottom: '24px'
    }}>
      {steps.map((step, index) => {
        const isActive = currentStep === step.number;
        const isCompleted = currentStep > step.number;

        return (
          <React.Fragment key={step.number}>
            {/* Step Item */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: isActive || isCompleted ? 1 : 0.45,
              transition: 'all 0.3s ease'
            }}>
              {/* Step Circle/Badge */}
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: isCompleted 
                  ? '#FF8A00' 
                  : isActive 
                    ? '#FF8A00' 
                    : '#2A2A2A',
                color: isCompleted || isActive ? '#000000' : '#A0A0A0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: '800',
                boxShadow: isActive ? '0 0 12px rgba(255, 138, 0, 0.4)' : 'none'
              }}>
                {isCompleted ? <Check size={14} strokeWidth={3} /> : step.number}
              </div>

              {/* Step Label */}
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '0.05em',
                color: isActive 
                  ? '#FF8A00' 
                  : isCompleted 
                    ? '#FFFFFF' 
                    : '#A0A0A0',
                whiteSpace: 'nowrap'
              }}>
                {step.label}
              </span>
            </div>

            {/* Separator Arrow */}
            {index < steps.length - 1 && (
              <span style={{
                color: isCompleted ? '#FF8A00' : '#2A2A2A',
                fontSize: '12px',
                fontWeight: '700',
                margin: '0 2px',
                userSelect: 'none'
              }}>
                →
              </span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ProgressStepper;
