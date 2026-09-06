import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Logo from '../components/Logo';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your registered email address');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1000);
  };

  return (
    <div className="app-container">
      <Logo size="normal" showSubtitle={true} />

      <div className="auth-card">
        {!isSubmitted ? (
          <>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#FFFFFF',
              marginBottom: '8px',
              textAlign: 'center'
            }}>
              Reset Password
            </h2>
            <p style={{
              fontSize: '13px',
              color: '#A0A0A0',
              marginBottom: '24px',
              textAlign: 'center',
              lineHeight: '1.4'
            }}>
              Enter your registered Rider email address and we'll send you instructions to reset your password.
            </p>

            <form onSubmit={handleSubmit}>
              <InputField
                label="RIDER EMAIL"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rider@dparcels.com"
                leftIcon={Mail}
                error={error}
                required
              />

              <div style={{ marginTop: '20px' }}>
                <PrimaryButton type="submit" isLoading={isLoading}>
                  Send Reset Link
                </PrimaryButton>
              </div>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '12px 0' }} className="animate-fade-in">
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <CheckCircle2 size={32} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF', marginBottom: '8px' }}>
              Reset Link Sent!
            </h3>
            <p style={{ fontSize: '13px', color: '#A0A0A0', lineHeight: '1.5', marginBottom: '24px' }}>
              We have sent password reset instructions to <strong style={{ color: '#FF8A00' }}>{email}</strong>.
            </p>
          </div>
        )}

        <div style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid #2A2A2A',
          textAlign: 'center'
        }}>
          <Link
            to="/login"
            style={{
              fontSize: '13px',
              fontWeight: '700',
              color: '#FF8A00',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ArrowLeft size={16} />
            Back to Partner Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
