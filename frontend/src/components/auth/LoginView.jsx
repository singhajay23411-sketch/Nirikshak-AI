import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import LanguageSwitcher from '../LanguageSwitcher';
import bgImage from '../../assets/image.png';

const DEMO_ACCOUNTS = [
  { label: 'Admin', labelHi: 'प्रशासक', email: 'admin@nirikshak.gov.in', password: 'admin123' },
  { label: 'MoSPI Officer', labelHi: 'MoSPI अधिकारी', email: 'mospi@nirikshak.gov.in', password: 'mospi123' },
  { label: 'State Officer (UP)', labelHi: 'राज्य अधिकारी (UP)', email: 'state.up@nirikshak.gov.in', password: 'state123' },
  { label: 'District Officer (Jabalpur)', labelHi: 'जिला अधिकारी (जबलपुर)', email: 'district.jabalpur@nirikshak.gov.in', password: 'district123' },
  { label: 'Field Inspector', labelHi: 'क्षेत्र निरीक्षक', email: 'inspector@nirikshak.gov.in', password: 'inspector123' },
  { label: 'Analyst', labelHi: 'विश्लेषक', email: 'analyst@nirikshak.gov.in', password: 'analyst123' },
  { label: 'Viewer', labelHi: 'दर्शक', email: 'viewer@nirikshak.gov.in', password: 'viewer123' },
];

const LoginView = ({ onBack, onLoginSuccess }) => {
  const { t, language } = useLanguage();
  const { login, isLoading, error: authError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [localError, setLocalError] = useState('');

  const isHi = language === 'hi';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email.trim()) {
      setLocalError(t('auth.errorEmailRequired') || (isHi ? 'कृपया ईमेल या उपयोगकर्ता ID दर्ज करें' : 'Please enter your email or User ID'));
      return;
    }
    if (!password) {
      setLocalError(t('auth.errorPasswordRequired') || (isHi ? 'कृपया पासवर्ड दर्ज करें' : 'Please enter your password'));
      return;
    }

    const result = await login(email.trim(), password, rememberMe);
    if (result.success) {
      onLoginSuccess && onLoginSuccess(result.user);
    }
  };

  const handleDemoLogin = async (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setLocalError('');

    const result = await login(account.email, account.password, false);
    if (result.success) {
      onLoginSuccess && onLoginSuccess(result.user);
    }
  };

  const displayError = localError || authError;

  return (
    <div
      className="nirikshak-login-viewport"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        height: '100dvh',
        background: `#FAF8F3 url(${bgImage}) no-repeat left top / cover`,
        backgroundPosition: 'left top',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 999,
      }}
    >
      {/* Subtle overlay on smaller screens for readability */}
      <div className="login-bg-overlay" />

      {/* Top Header Bar */}
      <header
        style={{
          padding: '0.85rem 2.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {/* Left: Back to Public Portal with persistent dark text on hover */}
        <button
          type="button"
          onClick={onBack}
          className="btn-back-portal"
        >
          <ArrowLeft size={15} />
          <span>{t('auth.backToPortal') || (isHi ? 'सार्वजनिक पोर्टल' : 'Public Portal')}</span>
        </button>

        {/* Right: Brand emblem & Language Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '0.9rem',
              fontWeight: 900,
              letterSpacing: '0.12em',
              color: '#1D1E22',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            NIRIKSHΛK ΛI
          </div>

          <LanguageSwitcher />
        </div>
      </header>

      {/* Main Area: Shifted further leftward into the center-right empty space */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0.25rem 19% 1rem 2rem',
          zIndex: 10,
          position: 'relative',
          overflow: 'hidden',
        }}
        className="login-main-container"
      >
        {/* Login Panel */}
        <div
          className="login-panel-card"
          style={{
            width: '100%',
            maxWidth: '430px',
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '3px 4px 0px #1D1E22',
            padding: '1.5rem 1.85rem',
            animation: 'loginCardAppear 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            boxSizing: 'border-box',
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: '1rem' }}>
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.16em',
                color: '#0A2458',
                textTransform: 'uppercase',
                marginBottom: '0.25rem',
              }}
            >
              {t('auth.ministry') || (isHi ? 'सांख्यिकी एवं कार्यक्रम कार्यान्वयन मंत्रालय' : 'Ministry of Statistics & Programme Implementation')}
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-serif-primary)',
                fontSize: '1.55rem',
                fontWeight: 700,
                color: '#1D1E22',
                lineHeight: 1.18,
                marginBottom: '0.3rem',
              }}
            >
              {t('auth.portalLogin') || (isHi ? 'अधिकारी पोर्टल लॉगिन' : 'Official Portal Login')}
            </h1>

            <p
              style={{
                fontSize: '0.82rem',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.45,
              }}
            >
              {t('auth.loginSubtitle') || (isHi
                ? 'MPLADS जोखिम खुफिया प्रणाली में सुरक्षित रूप से साइन इन करें।'
                : 'Securely sign in to the MPLADS Risk Intelligence System.')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Email / User ID */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: '#1D1E22',
                  marginBottom: '0.25rem',
                  letterSpacing: '0.02em',
                }}
              >
                {t('auth.emailLabel') || (isHi ? 'आधिकारिक ईमेल / उपयोगकर्ता ID' : 'Official Email / User ID')}
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder') || 'name@nirikshak.gov.in'}
                  autoComplete="email"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.85rem 0.55rem 2.5rem',
                    border: '1.5px solid var(--color-border-dark)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-sans)',
                    background: '#FFFFFF',
                    color: '#1D1E22',
                    outline: 'none',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-accent-teal)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(82,183,154,0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--color-border-dark)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: '#1D1E22',
                  marginBottom: '0.25rem',
                  letterSpacing: '0.02em',
                }}
              >
                {t('auth.passwordLabel') || (isHi ? 'पासवर्ड' : 'Password')}
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder') || (isHi ? 'पासवर्ड दर्ज करें' : 'Enter your password')}
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    padding: '0.55rem 2.5rem 0.55rem 2.5rem',
                    border: '1.5px solid var(--color-border-dark)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-sans)',
                    background: '#FFFFFF',
                    color: '#1D1E22',
                    outline: 'none',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-accent-teal)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(82,183,154,0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--color-border-dark)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.65rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.2rem',
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                  }}
                  tabIndex={-1}
                  title={showPassword ? (isHi ? 'पासवर्ड छिपाएं' : 'Hide password') : (isHi ? 'पासवर्ड दिखाएं' : 'Show password')}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  color: '#4A4D55',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    accentColor: 'var(--color-accent-teal)',
                    width: '14px',
                    height: '14px',
                    cursor: 'pointer',
                  }}
                />
                {t('auth.rememberMe') || (isHi ? 'मुझे याद रखें' : 'Remember me')}
              </label>

              <button
                type="button"
                onClick={() => alert(t('auth.contactAdmin') || (isHi ? 'कृपया प्रशासक से संपर्क करें' : 'Please contact your administrator'))}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--color-accent-teal-hover)',
                  textDecoration: 'underline',
                  textUnderlineOffset: '2.5px',
                }}
              >
                {t('auth.forgotPassword') || (isHi ? 'पासवर्ड भूल गए?' : 'Forgot password?')}
              </button>
            </div>

            {/* Error Message */}
            {displayError && (
              <div
                style={{
                  padding: '0.5rem 0.75rem',
                  background: '#FEF2F2',
                  border: '1px solid #D9534F',
                  borderRadius: 'var(--radius-sm)',
                  color: '#D9534F',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                }}
              >
                {displayError}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-teal"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.68rem',
                fontSize: '0.88rem',
                fontWeight: 700,
                justifyContent: 'center',
                gap: '0.45rem',
                opacity: isLoading ? 0.7 : 1,
                pointerEvents: isLoading ? 'none' : 'auto',
                marginTop: '0.1rem',
              }}
            >
              <ShieldCheck size={17} />
              {isLoading
                ? (t('auth.authenticating') || (isHi ? 'प्रमाणित हो रहा है...' : 'Authenticating...'))
                : (t('auth.secureLogin') || (isHi ? 'सुरक्षित लॉगिन' : 'Secure Sign In'))}
            </button>
          </form>

          {/* Demo Accounts Drawer */}
          <div style={{ marginTop: '0.85rem' }}>
            <button
              type="button"
              onClick={() => setShowDemo(!showDemo)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.76rem',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                padding: 0,
                letterSpacing: '0.02em',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#1D1E22'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
            >
              {showDemo ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {t('auth.demoAccounts') || (isHi ? 'डेमो खाते (त्वरित लॉगिन)' : 'Demo Accounts (Quick Login)')}
            </button>

            {showDemo && (
              <div
                style={{
                  marginTop: '0.5rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '0.35rem',
                  animation: 'drawerSlideDown 0.2s ease-out',
                  maxHeight: '135px',
                  overflowY: 'auto',
                  paddingRight: '0.2rem',
                }}
              >
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => handleDemoLogin(account)}
                    disabled={isLoading}
                    style={{
                      padding: '0.35rem 0.6rem',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      fontFamily: 'var(--font-sans)',
                      background: 'rgba(247, 244, 236, 0.95)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      color: '#1D1E22',
                      textAlign: 'left',
                      transition: 'background 0.15s ease, border-color 0.15s ease, transform 0.1s ease',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--color-accent-teal)';
                      e.currentTarget.style.borderColor = 'var(--color-border-dark)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(247, 244, 236, 0.95)';
                      e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {isHi ? account.labelHi : account.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div
            style={{
              marginTop: '0.85rem',
              padding: '0.45rem 0.75rem',
              background: 'rgba(247, 244, 236, 0.85)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <div
              style={{
                fontSize: '0.66rem',
                fontWeight: 700,
                color: '#0A2458',
                marginBottom: '0.15rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {t('auth.securityNoticeTitle') || (isHi ? 'सुरक्षा सूचना' : 'Security Notice')}
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--color-text-muted)',
                lineHeight: 1.35,
              }}
            >
              {t('auth.securityNoticeText') || (isHi
                ? 'यह एक सुरक्षित सरकारी प्रणाली है। अनधिकृत पहुंच प्रतिबंधित और निगरानी में है।'
                : 'This is a secure government system. Unauthorized access is prohibited and monitored.')}
            </div>
          </div>
        </div>
      </main>

      {/* Embedded CSS for animations, button hover behavior, and responsive layout */}
      <style>{`
        @keyframes loginCardAppear {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes drawerSlideDown {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Persistent dark text back button on normal, hover, and active states */
        .btn-back-portal {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.48rem 1.15rem;
          font-size: 0.82rem;
          font-weight: 600;
          font-family: var(--font-sans);
          color: #1D1E22 !important;
          background: rgba(250, 248, 243, 0.9);
          border: 1.5px solid #1D1E22;
          border-radius: var(--radius-full);
          box-shadow: 1.5px 2px 0px #1D1E22;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          cursor: pointer;
          transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.15s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease;
          text-decoration: none;
        }

        .btn-back-portal:hover {
          color: #1D1E22 !important;
          background: #FFFFFF;
          box-shadow: 2.5px 3.5px 0px #1D1E22;
          transform: translate(-1.5px, -2px);
        }

        .btn-back-portal:active {
          color: #1D1E22 !important;
          transform: translate(1.5px, 2px) !important;
          box-shadow: 0px 0px 0px #1D1E22 !important;
        }

        .nirikshak-login-viewport {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100vh;
          height: 100dvh;
          background-size: cover !important;
          background-position: left top !important;
          background-repeat: no-repeat !important;
          background-color: #FAF8F3 !important;
          overflow: hidden;
        }

        .login-bg-overlay {
          display: none;
        }

        @media (max-width: 1400px) {
          .login-main-container {
            padding-right: 14% !important;
          }
        }

        @media (max-width: 1200px) {
          .login-main-container {
            padding-right: 10% !important;
          }
        }

        @media (max-width: 1024px) {
          .nirikshak-login-viewport {
            background-position: left top !important;
          }
          .login-main-container {
            padding-right: 6% !important;
          }
        }

        @media (max-height: 680px), (max-width: 860px) {
          .nirikshak-login-viewport {
            position: fixed !important;
            background-position: center top !important;
            height: 100vh !important;
            height: 100dvh !important;
            overflow-y: auto !important;
          }
          .login-bg-overlay {
            display: block;
            position: absolute;
            inset: 0;
            background: rgba(250, 248, 243, 0.75);
            backdrop-filter: blur(3px);
            z-index: 1;
          }
          .login-main-container {
            justify-content: center !important;
            padding: 1.25rem !important;
            overflow: visible !important;
          }
          .login-panel-card {
            max-width: 440px !important;
            background: rgba(255, 255, 255, 0.97) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginView;
