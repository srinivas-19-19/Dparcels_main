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
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999, padding: 20, background: 'red', color: 'white', overflow: 'auto' }}>
          <h1>Map Rendering Error</h1>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 16, fontWeight: 'bold' }}>
            {this.state.error?.toString()}
          </pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, marginTop: 10 }}>
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: 20, padding: 10, cursor: 'pointer', background: 'black', color: 'white', border: 'none' }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
