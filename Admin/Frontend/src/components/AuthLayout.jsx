import React from 'react';
import { Package } from 'lucide-react';
import '../styles/auth.css';

export default function AuthLayout({ children }) {
  return (
    <div className="auth-wrapper centered">
      {/* Background Ambient Glow Elements */}
      <div className="auth-glow-1"></div>
      <div className="auth-glow-2"></div>

      <div className="auth-centered-container">
        {/* Centered DParcels Branding Badge */}
        <div className="brand-header centered">
          <div className="brand-logo-icon">
            <Package size={26} strokeWidth={2.5} />
          </div>
          <div className="brand-logo-text">
            <span className="brand-title">DPARCELS.</span>
            <span className="brand-subtitle">ADMIN PANEL</span>
          </div>
        </div>

        {/* Authentication Form Card */}
        <div className="auth-card">
          {children}
        </div>

        {/* Footer */}
        <footer className="auth-footer centered">
          &copy; 2026 DParcels. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
