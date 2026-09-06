import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Logo from '../components/Logo';
import InputField from '../components/InputField';
import PasswordField from '../components/PasswordField';
import PrimaryButton from '../components/PrimaryButton';
import { LogIn } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { themeColors } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email/phone and password');
      return;
    }
    setErrorMsg('');
    setIsLoggingIn(true);
    
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });
      const { user, accessToken } = response.data.data;
      if (user.role !== 'RIDER') {
        throw new Error('Unauthorized role. Only riders can login here.');
      }
      login(user, accessToken);
      navigate('/home');
    } catch (error) {
      console.error('Login error:', error);
      setErrorMsg(error.response?.data?.message || error.message || 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsLoggingIn(true);
    setTimeout(() => {
      navigate('/home');
    }, 800);
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: themeColors.bg,
      color: themeColors.text,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      position: 'relative',
      fontFamily: 'var(--font-main, "Plus Jakarta Sans", sans-serif)',
      userSelect: 'none'
    }}>
      {/* Phone / Form Container Frame */}
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: themeColors.cardBg,
        border: `1px solid ${themeColors.border}`,
        borderRadius: '24px',
        padding: '36px 24px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Top Branding Logo */}
        <Logo size="large" showSubtitle={true} />

        <h2 style={{
          fontSize: '22px',
          fontWeight: '900',
          color: '#FFFFFF',
          margin: '12px 0 4px 0',
          textAlign: 'center'
        }}>
          Rider Partner Login
        </h2>

        <p style={{
          fontSize: '13px',
          color: '#A0A0A0',
          margin: '0 0 24px 0',
          textAlign: 'center'
        }}>
          Welcome back! Sign in to access your delivery dashboard.
        </p>

        {errorMsg && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #EF4444',
            color: '#EF4444',
            borderRadius: '12px',
            padding: '12px',
            fontSize: '13px',
            marginBottom: '16px',
            textAlign: 'center',
            fontWeight: '600'
          }}>
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <InputField
            id="email-input"
            label="Email or Mobile Number"
            placeholder="e.g. rider@dparcels.com or 9876543210"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <PasswordField
            id="password-input"
            label="Password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-4px' }}>
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              style={{
                background: 'none',
                border: 'none',
                color: '#FF8A00',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Forgot Password?
            </button>
          </div>

          {/* Primary Login Button */}
          <div style={{ marginTop: '8px' }}>
            <PrimaryButton type="submit" fullWidth isLoading={isLoggingIn}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <LogIn size={18} />
                <span>LOGIN TO DPARCELS</span>
              </div>
            </PrimaryButton>
          </div>
        </form>

        {/* OR Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: '22px 0 18px 0'
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#282828' }} />
          <span style={{ fontSize: '11px', color: '#A0A0A0', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            OR CONTINUE WITH
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#282828' }} />
        </div>

        {/* Sign in with Google Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoggingIn}
          style={{
            width: '100%',
            height: '48px',
            backgroundColor: '#181818',
            border: '1px solid #333333',
            borderRadius: '14px',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            transition: 'all 0.2s ease'
          }}
        >
          {/* Official Google G SVG Icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          <span>Sign in with Google</span>
        </button>

        {/* Footer link to Register */}
        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '13px',
          color: '#A0A0A0',
          borderTop: '1px solid #222222',
          paddingTop: '18px'
        }}>
          Want to join DParcels?{' '}
          <button
            type="button"
            onClick={() => navigate('/register')}
            style={{
              background: 'none',
              border: 'none',
              color: '#FF8A00',
              fontWeight: '800',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Register Here
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
