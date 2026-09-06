import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, ROLES } from '../../context/AuthContext';
import { Shield, AlertTriangle } from 'lucide-react';

/**
 * ProtectedRoute — Route guard component
 * Redirects to /login if not authenticated.
 * Shows 403 if authenticated but unauthorized.
 *
 * Props:
 *   children - The protected content
 *   requiredRoles - Array of allowed roles (optional)
 *   requiredPermission - Required permission string (optional)
 */
const ProtectedRoute = ({ children, requiredRoles, requiredPermission }) => {
  const { isAuthenticated, isLoading, user, hasPermission } = useAuth();
  const location = useLocation();

  // Show loading while checking session
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg-light)',
        fontFamily: 'var(--font-sans)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px', height: '48px', margin: '0 auto 1rem',
            border: '3px solid var(--color-border-subtle)',
            borderTopColor: 'var(--color-accent-teal)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Verifying session...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // Not authenticated → redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check
  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = user?.role;
    if (!requiredRoles.includes(userRole)) {
      return <ForbiddenPage message="Your role does not have access to this section." />;
    }
  }

  // Permission check
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <ForbiddenPage message={`Missing permission: ${requiredPermission}`} />;
  }

  return children;
};

/**
 * 403 Forbidden page component
 */
const ForbiddenPage = ({ message }) => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-bg-light)',
    fontFamily: 'var(--font-sans)',
    padding: '2rem',
  }}>
    <div style={{
      textAlign: 'center',
      maxWidth: '480px',
      background: '#FFF',
      border: '1.5px solid #1D1E22',
      borderRadius: 'var(--radius-lg, 12px)',
      padding: '2.5rem',
      boxShadow: '3px 4px 0px #1D1E22',
    }}>
      <div style={{
        width: '64px', height: '64px',
        margin: '0 auto 1.25rem',
        borderRadius: '50%',
        background: '#FEF2F2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Shield size={32} color="#D9534F" />
      </div>
      <h2 style={{
        fontFamily: 'var(--font-serif-primary)',
        fontSize: '1.5rem',
        fontWeight: 800,
        color: '#1D1E22',
        marginBottom: '0.75rem',
      }}>
        Access Denied
      </h2>
      <p style={{
        fontSize: '0.9rem',
        color: 'var(--color-text-muted)',
        marginBottom: '1.5rem',
        lineHeight: 1.6,
      }}>
        {message || 'You do not have permission to access this page.'}
      </p>
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        justifyContent: 'center',
      }}>
        <button
          onClick={() => window.history.back()}
          style={{
            padding: '0.6rem 1.25rem',
            background: 'var(--color-bg-card-sand)',
            border: '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Go Back
        </button>
        <button
          onClick={() => (window.location.href = '/dashboard')}
          style={{
            padding: '0.6rem 1.25rem',
            background: 'var(--color-accent-teal)',
            border: '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            boxShadow: '2px 3px 0px #1D1E22',
          }}
        >
          Dashboard
        </button>
      </div>
    </div>
  </div>
);

export default ProtectedRoute;
