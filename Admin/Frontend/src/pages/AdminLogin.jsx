import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';

export default function AdminLogin() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    rememberMe: false
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (apiError) setApiError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Email or username is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setApiError('');

    try {
      const response = await api.post('/auth/login', {
        email: formData.identifier,
        password: formData.password,
        role: 'ADMIN'
      });
      login(response.data.user, response.data.accessToken);
      navigate('/admin/dashboard');
    } catch (err) {
      setApiError(err.response?.data?.error || 'Invalid credentials. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      navigate('/admin/dashboard');
    }, 600);
  };

  return (
    <AuthLayout>
      <div className="card-header">
        <h2 className="card-title">Welcome Back! 👋</h2>
        <p className="card-subtitle">Sign in to your admin account</p>
      </div>

      {apiError && (
        <div className="alert-banner error">
          <AlertCircle size={18} />
          <span>{apiError}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleLogin} noValidate>
        {/* Email / Username Field */}
        <div className="form-group">
          <label className="form-label" htmlFor="identifier">
            Email or Username
          </label>
          <div className="input-wrapper">
            <span className="input-icon">
              <Mail size={18} />
            </span>
            <input
              id="identifier"
              name="identifier"
              type="text"
              className={`form-input ${errors.identifier ? 'input-error' : ''}`}
              placeholder="Enter your email or username"
              value={formData.identifier}
              onChange={handleChange}
              disabled={isLoading}
              autoComplete="username"
            />
          </div>
          {errors.identifier && (
            <span className="error-message">
              <AlertCircle size={14} />
              {errors.identifier}
            </span>
          )}
        </div>

        {/* Password Field */}
        <div className="form-group">
          <label className="form-label" htmlFor="password">
            Password
          </label>
          <div className="input-wrapper">
            <span className="input-icon">
              <Lock size={18} />
            </span>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className={`form-input has-eye ${errors.password ? 'input-error' : ''}`}
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="eye-button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <span className="error-message">
              <AlertCircle size={14} />
              {errors.password}
            </span>
          )}
        </div>

        {/* Options Row */}
        <div className="form-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="rememberMe"
              className="checkbox-input"
              checked={formData.rememberMe}
              onChange={handleChange}
              disabled={isLoading}
            />
            <span>Remember Me</span>
          </label>
          <a
            href="#forgot-password"
            className="forgot-link"
            onClick={(e) => {
              e.preventDefault();
              alert('Password reset instructions sent to registered admin email.');
            }}
          >
            Forgot Password?
          </a>
        </div>

        {/* Login Button */}
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? (
            <>
              <div className="spinner"></div>
              <span>Signing In...</span>
            </>
          ) : (
            <>
              <span>LOGIN</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="auth-divider">
        <span>OR</span>
      </div>

      {/* Google Login */}
      <button
        type="button"
        className="btn-google"
        onClick={handleGoogleLogin}
        disabled={isLoading}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Login with Google</span>
      </button>
    </AuthLayout>
  );
}
