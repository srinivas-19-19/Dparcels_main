import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Clock, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Navigation } from 'lucide-react';
import Logo from '../components/Logo';
import PrimaryButton from '../components/PrimaryButton';

const ApplicationStatusPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const riderName = state.riderName || 'Rider Partner';

  const documentStatuses = [
    { name: 'Profile Photo', status: 'Approved', icon: CheckCircle2, isApproved: true },
    { name: 'Aadhaar Card', status: 'Approved', icon: CheckCircle2, isApproved: true },
    { name: 'Driving License', status: 'Under Review', icon: Clock, isApproved: false },
    { name: 'Vehicle RC', status: 'Approved', icon: CheckCircle2, isApproved: true },
    { name: 'Payment QR', status: 'Approved', icon: CheckCircle2, isApproved: true }
  ];

  return (
    <div className="app-container">
      <Logo size="normal" showSubtitle={true} />

      <div className="auth-card auth-card-wide animate-fade-in">
        {/* Status Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 138, 0, 0.12)',
            border: '2px solid rgba(255, 138, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: '0 0 20px rgba(255, 138, 0, 0.25)'
          }}>
            <Clock size={32} color="#FF8A00" className="animate-spin" style={{ animationDuration: '6s' }} />
          </div>

          <h2 style={{
            fontSize: '22px',
            fontWeight: '800',
            color: '#FFFFFF',
            margin: '0 0 4px 0'
          }}>
            Your application is
          </h2>
          <h1 style={{
            fontSize: '26px',
            fontWeight: '800',
            color: '#FF8A00',
            margin: 0
          }}>
            Under Review
          </h1>

          <p style={{
            fontSize: '13px',
            color: '#A0A0A0',
            marginTop: '8px'
          }}>
            Welcome, <strong style={{ color: '#FFFFFF' }}>{riderName}</strong>! Our verification team is validating your uploaded documents.
          </p>
        </div>

        {/* Document Status List */}
        <div style={{
          backgroundColor: '#111111',
          border: '1px solid #2A2A2A',
          borderRadius: '14px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <h3 style={{
            fontSize: '12px',
            fontWeight: '700',
            letterSpacing: '0.08em',
            color: '#A0A0A0',
            textTransform: 'uppercase',
            marginBottom: '14px'
          }}>
            DOCUMENT VERIFICATION STATUS
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {documentStatuses.map((doc, idx) => {
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    backgroundColor: '#181818',
                    border: '1px solid #2A2A2A'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {doc.isApproved ? (
                      <CheckCircle2 size={18} color="#10B981" />
                    ) : (
                      <Clock size={18} color="#FF8A00" />
                    )}
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF' }}>
                      {doc.name}
                    </span>
                  </div>

                  <div style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: doc.isApproved ? '#10B981' : '#FF8A00',
                    backgroundColor: doc.isApproved ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 138, 0, 0.12)',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {doc.isApproved ? '✓ Approved' : '⏳ Under Review'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Verification Time Card */}
        <div style={{
          backgroundColor: 'rgba(255, 138, 0, 0.08)',
          border: '1px solid rgba(255, 138, 0, 0.35)',
          borderRadius: '14px',
          padding: '16px',
          textAlign: 'center',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <AlertCircle size={22} color="#FF8A00" />
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em', color: '#A0A0A0', textTransform: 'uppercase' }}>
              Estimated Verification Time
            </div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#FF8A00', marginTop: '2px' }}>
              24–48 hours
            </div>
          </div>
        </div>

        {/* Primary CTA: Proceed to Rider Home App */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <PrimaryButton onClick={() => navigate('/home')} icon={Navigation}>
            Proceed to Rider Home App →
          </PrimaryButton>

          <PrimaryButton variant="outline" onClick={() => navigate('/login')}>
            Back to Login
          </PrimaryButton>
        </div>
      </div>

      <footer style={{
        marginTop: '28px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        fontWeight: '700',
        color: '#A0A0A0',
        letterSpacing: '0.1em'
      }}>
        <ShieldCheck size={14} />
        <span>DPARCELS ONBOARDING SYSTEM</span>
      </footer>
    </div>
  );
};

export default ApplicationStatusPage;
