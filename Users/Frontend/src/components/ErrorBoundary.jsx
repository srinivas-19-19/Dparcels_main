import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleResetSession = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-app, #0f172a)',
            color: '#f8fafc',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            padding: 24,
            boxSizing: 'border-box'
          }}
        >
          <div
            style={{
              maxWidth: 480,
              width: '100%',
              background: 'var(--bg-card, #1e293b)',
              border: '1px solid rgba(255, 107, 0, 0.3)',
              borderRadius: 20,
              padding: 28,
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'rgba(255, 107, 0, 0.15)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16
              }}
            >
              <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 28, color: '#ff6b00' }}></i>
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px 0', color: '#fff' }}>
              Something Went Wrong
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted, #94a3b8)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              An unexpected display issue occurred. You can reload the page or reset your active session.
            </p>

            {this.state.error?.message && (
              <div
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 20,
                  fontSize: 12,
                  color: '#fca5a5',
                  textAlign: 'left',
                  fontFamily: 'monospace',
                  maxHeight: 120,
                  overflowY: 'auto'
                }}
              >
                {this.state.error.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #ff8800 0%, #ff5500 100%)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-rotate-right" style={{ marginRight: 6 }}></i>
                Reload Page
              </button>

              <button
                type="button"
                onClick={this.handleResetSession}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#e2e8f0',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-arrow-right-from-bracket" style={{ marginRight: 6 }}></i>
                Reset & Login
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

