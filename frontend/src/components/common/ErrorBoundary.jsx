import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home, LogIn } from 'lucide-react';

export default class ErrorBoundary extends Component {
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

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoLogin = () => {
    window.location.href = '/login';
  };

  handleGoHome = () => {
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
            background: 'var(--color-bg-light, #FAF8F3)',
            fontFamily: 'var(--font-sans, "Public Sans", sans-serif)',
            padding: '2rem',
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              background: '#FFFFFF',
              border: '1.5px solid #1D1E22',
              borderRadius: '12px',
              padding: '2.5rem',
              boxShadow: '4px 6px 0px #1D1E22',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 1.25rem',
                borderRadius: '50%',
                background: '#FEF3C7',
                border: '1.5px solid #D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={32} color="#D97706" />
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-serif-primary, "Cabinet Grotesk", Georgia, serif)',
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#1D1E22',
                marginBottom: '0.75rem',
              }}
            >
              Application Notice
            </h2>

            <p
              style={{
                fontSize: '0.9rem',
                color: '#6B7280',
                marginBottom: '1.5rem',
                lineHeight: 1.5,
              }}
            >
              {this.state.error?.message || 'An unexpected rendering error occurred. Please reload the dashboard or re-authenticate.'}
            </p>

            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={this.handleReset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.65rem 1.25rem',
                  background: '#0D9488',
                  color: '#FFFFFF',
                  border: '1.5px solid #1D1E22',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '2px 3px 0px #1D1E22',
                }}
              >
                <RefreshCw size={15} /> Reload Dashboard
              </button>

              <button
                onClick={this.handleGoLogin}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.65rem 1.25rem',
                  background: '#FAF8F3',
                  color: '#1D1E22',
                  border: '1.5px solid #1D1E22',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                <LogIn size={15} /> Go to Login
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.65rem 1.25rem',
                  background: '#FAF8F3',
                  color: '#1D1E22',
                  border: '1.5px solid #1D1E22',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                <Home size={15} /> Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
