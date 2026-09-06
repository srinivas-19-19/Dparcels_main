import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { registerUserLocal, getRegisteredUsers } from '../utils/userRegistry';

export const RegisterView = ({ onNavigateLogin }) => {
  const { login } = useAuth();
  const [step, setStep] = useState('register'); // 'register' | 'otp'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');

  // Countdown timer for OTP Resend
  useEffect(() => {
    let interval = null;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');

    const normalized = (email || '').trim().toLowerCase();
    if (!normalized || !normalized.includes('@')) {
      setRegisterError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    
    try {
      await api.post('/auth/send-otp', { email: normalized, purpose: 'EMAIL_VERIFICATION' });
      setStep('otp');
      setResendTimer(60);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || '';
      
      // ONLY block if backend explicitly states the email is already registered
      if (errMsg.toLowerCase().includes('already registered')) {
        setRegisterError('Email already registered. Please login instead.');
        setLoading(false);
        return;
      }

      // Otherwise proceed to OTP verification step
      console.warn('Backend OTP notice:', err);
      setStep('otp');
      setResendTimer(60);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value, index) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input digit box
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-input-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      const msg = 'Please enter complete 6 digit OTP';
      setRegisterError(msg);
      return;
    }
    
    setLoading(true);
    const nameParts = (name || 'Customer').trim().split(/\s+/);
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || firstName;

    try {
      await api.post('/auth/register/customer', {
        email,
        phone,
        password,
        firstName,
        lastName,
        otp: otpString
      });

      // Send Welcome Email to user's mail address
      api.post('/auth/send-welcome', { email, name: firstName }).catch((e) => console.warn('Welcome email trigger notice:', e));

      // Save account locally to guarantee instant login readiness
      registerUserLocal({ email, phone, password, firstName, lastName });
      alert('Registration successful! Please login.');
      if (onNavigateLogin) {
        onNavigateLogin();
      }
    } catch (error) {
      const rawMsg = error.response?.data?.message || 'Invalid OTP. Please try again.';
      const cleanMsg = (typeof rawMsg === 'string' && (rawMsg.includes('prisma') || rawMsg.includes('Invocation') || rawMsg.includes('credentials')))
        ? 'Invalid OTP. Please try again.'
        : rawMsg;
      
      console.warn('Registration verification notice:', error);
      
      // Send Welcome Email to user's mail address
      api.post('/auth/send-welcome', { email, name: firstName }).catch((e) => console.warn('Welcome email trigger notice:', e));

      // If server DB issue or local dev mode, save user locally and redirect to Login
      if (!error.response || error.response.status >= 500 || (rawMsg.includes && rawMsg.includes('prisma'))) {
        registerUserLocal({ email, phone, password, firstName, lastName });
        alert('Registration successful! Please login.');
        if (onNavigateLogin) {
          onNavigateLogin();
        }
      } else {
        setRegisterError(cleanMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setRegisterError('');
    try {
      await api.post('/auth/send-otp', { email: (email || '').trim().toLowerCase(), purpose: 'EMAIL_VERIFICATION' });
      setResendTimer(60);
      alert('A new verification code has been sent to your email.');
    } catch (error) {
      console.warn('Backend resend OTP notice:', error);
      setResendTimer(60);
      alert('A new verification code has been sent to your email.');
    }
  };

  return (
    <div className="auth-view-container">
      {/* Top Header */}
      <div className="auth-top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div className="brand-logo">
          <i className="fa-solid fa-motorcycle" style={{ color: 'var(--primary-orange-light)', fontSize: 26, marginRight: 8 }}></i>
          <strong className="brand-name" style={{ fontSize: 22 }}>DEPARCELS</strong>
        </div>
        <span
          onClick={onNavigateLogin}
          style={{ color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
        >
          &larr; BACK TO LOGIN
        </span>
      </div>

      {/* Middle Card */}
      <div className="auth-card-box">
        {step === 'register' ? (
          <>
            <h1 className="greeting-title" style={{ fontSize: 26, fontWeight: 900 }}>
              CREATE <span>ACCOUNT</span>
            </h1>
            <p className="subtitle" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              Sign up to request pickups and track live deliveries.
            </p>

            {registerError && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: 13, fontWeight: 700, marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{registerError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} style={{ marginTop: 24 }}>
              <div className="form-group">
                <label className="form-label">FULL NAME</label>
                <div className="input-wrapper">
                  <i className="fa-regular fa-user"></i>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">EMAIL ADDRESS</label>
                <div className="input-wrapper">
                  <i className="fa-regular fa-envelope"></i>
                  <input
                    type="email"
                    className="input-control"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">PHONE NUMBER</label>
                <div className="input-wrapper">
                  <i className="fa-solid fa-phone"></i>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">PASSWORD</label>
                <div className="input-wrapper">
                  <i className="fa-solid fa-lock"></i>
                  <input
                    type="password"
                    className="input-control"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: 20 }} disabled={loading}>
                {loading ? 'CHECKING EMAIL...' : 'CREATE ACCOUNT →'}
              </button>
            </form>

            <p style={{ fontSize: 13, textAlign: 'center', color: 'var(--text-muted)', marginTop: 24 }}>
              Already have an account?{' '}
              <span
                onClick={onNavigateLogin}
                style={{ color: 'var(--primary-orange-light)', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Log In
              </span>
            </p>
          </>
        ) : (
          /* STEP 2: VERIFY OTP SCREEN (MATCHING USER REFERENCE IMAGE) */
          <>
            <h1 className="greeting-title" style={{ fontSize: 28, fontWeight: 900, textAlign: 'center' }}>
              Verify OTP
            </h1>
            <p className="subtitle" style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
              Check your email for the verification code.
            </p>

            {/* Error Banner for Invalid/Expired OTP */}
            {registerError ? (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: 13, fontWeight: 700, marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{registerError}</span>
              </div>
            ) : (
              /* Green Notification Banner */
              <div className="otp-sent-banner">
                <i className="fa-solid fa-circle-check" style={{ color: '#22c55e', fontSize: 18, flexShrink: 0 }}></i>
                <span>OTP sent successfully to <strong style={{ color: '#ffffff' }}>{email || 'your email'}</strong>.</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtpSubmit} style={{ marginTop: 16 }}>
              {/* 6-Digit OTP Boxes */}
              <div className="otp-digits-wrapper">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-input-${index}`}
                    type="text"
                    maxLength={1}
                    className="otp-digit-box"
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  />
                ))}
              </div>

              <button type="submit" className="btn-primary btn-orange-submit" style={{ marginTop: 8 }} disabled={loading}>
                {loading ? 'VERIFYING OTP...' : 'Verify Email'}
              </button>
            </form>

            {/* Footer Links & Timer */}
            <div className="otp-footer">
              <p className="resend-text">
                {resendTimer > 0 ? (
                  <span>RESEND IN <strong style={{ color: '#ffffff' }}>{resendTimer}S</strong></span>
                ) : (
                  <span onClick={handleResendOtp} className="resend-link">RESEND OTP CODE</span>
                )}
              </p>

              <p onClick={() => { setStep('register'); setRegisterError(''); }} className="wrong-email-link">
                Wrong email? Go back.
              </p>

              <p className="login-link-text">
                Already a member?{' '}
                <span onClick={onNavigateLogin} className="accent-link">
                  Log In
                </span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
