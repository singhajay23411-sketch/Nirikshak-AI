import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Laptop, Copy, Check, ExternalLink, ArrowRight, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const LIVE_URL = "http://155.248.255.235";

const QrDemoView = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const [isMobile, setIsMobile] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(userAgent);
    const isSmallScreen = window.innerWidth <= 768;
    setIsMobile(isMobileUA || isSmallScreen);

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCopy = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(LIVE_URL).then(onCopied).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }

    function onCopied() {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }

    function fallbackCopy() {
      const textarea = document.createElement('textarea');
      textarea.value = LIVE_URL;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand('copy');
        onCopied();
      } catch (err) {
        alert('Link: ' + LIVE_URL);
      }
      document.body.removeChild(textarea);
    }
  };

  const handleLaunchPhone = () => {
    navigate('/');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg-light, #FAF8F3)',
        color: '#1D1E22',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem 1rem',
        backgroundImage: 'radial-gradient(rgba(29, 30, 34, 0.05) 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }}
    >
      <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto' }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: '#FFFFFF',
              border: '1.5px solid #1D1E22',
              borderRadius: '9999px',
              padding: '0.35rem 0.95rem',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#0A2458',
              boxShadow: '2px 2.5px 0px #1D1E22',
              marginBottom: '0.75rem'
            }}
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#52B79A', display: 'inline-block' }} />
            <span>NIRIKSHΛK ΛI • MPLADS</span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-serif-primary, serif)',
              fontSize: 'clamp(1.85rem, 5vw, 2.35rem)',
              fontWeight: 700,
              color: '#1D1E22',
              lineHeight: 1.18,
              letterSpacing: '-0.015em',
              margin: '0 0 0.45rem 0'
            }}
          >
            {isHi ? 'निरीक्षक AI अन्वेषण करें' : 'Explore Nirikshak AI'}
          </h1>

          <p style={{ fontSize: '0.95rem', color: '#4A4D55', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
            {isHi ? 'प्लेटफॉर्म एक्सेस करने का तरीका चुनें' : 'Choose how you want to access the platform'}
          </p>
        </div>

        {/* Main Selection Card */}
        <div
          style={{
            background: '#FFFFFF',
            border: '2px solid #1D1E22',
            borderRadius: '22px',
            padding: '1.75rem 1.5rem',
            boxShadow: '4px 6px 0px #1D1E22',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}
        >
          {/* Option 1: Open on Phone */}
          <div
            style={{
              border: '1.5px solid #1D1E22',
              borderRadius: '16px',
              padding: '1.25rem',
              background: '#FFFFFF',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <div
                style={{
                  fontSize: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  background: '#FFFFFF',
                  border: '1.5px solid #1D1E22',
                  borderRadius: '12px',
                  boxShadow: '2px 2px 0px #1D1E22'
                }}
              >
                📱
              </div>
              <div style={{ fontFamily: 'var(--font-serif-primary, serif)', fontSize: '1.2rem', fontWeight: 700, color: '#1D1E22' }}>
                {isHi ? 'फोन पर खोलें' : 'Open on Phone'}
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#4A4D55', lineHeight: 1.45, marginBottom: '0.95rem' }}>
              {isHi ? 'लाइव वेबसाइट को सीधे इस डिवाइस पर खोलें' : 'Open the live website directly on this device'}
            </p>

            <button
              onClick={handleLaunchPhone}
              className="btn-teal"
              style={{
                width: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.55rem',
                padding: '0.82rem 1.4rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <span>{isHi ? 'फोन पर शुरू करें' : 'Launch on Phone'}</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Option 2: Open on Laptop (Recommended) */}
          <div
            style={{
              border: '1.5px solid #1D1E22',
              borderRadius: '16px',
              padding: '1.25rem',
              background: '#EBF8F4',
              boxShadow: '3px 4px 0px #1D1E22',
              position: 'relative'
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '-10px',
                right: '14px',
                background: '#52B79A',
                border: '1.5px solid #1D1E22',
                borderRadius: '9999px',
                fontSize: '0.68rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '0.15rem 0.6rem',
                color: '#1D1E22',
                boxShadow: '1.5px 2px 0px #1D1E22'
              }}
            >
              {isHi ? 'अनुशंसित' : 'Recommended'}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <div
                style={{
                  fontSize: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  background: '#FFFFFF',
                  border: '1.5px solid #1D1E22',
                  borderRadius: '12px',
                  boxShadow: '2px 2px 0px #1D1E22'
                }}
              >
                💻
              </div>
              <div style={{ fontFamily: 'var(--font-serif-primary, serif)', fontSize: '1.2rem', fontWeight: 700, color: '#1D1E22' }}>
                {isHi ? 'लैपटॉप पर खोलें' : 'Open on Laptop'}
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#4A4D55', lineHeight: 1.45, marginBottom: '0.75rem' }}>
              {isHi ? 'अपने लैपटॉप पर जारी रखें' : 'Continue on your laptop'}
            </p>

            <div style={{ borderTop: '1px dashed rgba(29, 30, 34, 0.25)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4A4D55' }}>
                {isHi ? 'यह लिंक अपने लैपटॉप पर खोलें:' : 'Open this link on your laptop:'}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    flex: 1,
                    background: '#FFFFFF',
                    border: '1.5px solid #1D1E22',
                    borderRadius: '10px',
                    padding: '0.6rem 0.8rem',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: '#0A2458',
                    fontFamily: 'monospace',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    userSelect: 'all'
                  }}
                  title={LIVE_URL}
                >
                  {LIVE_URL}
                </div>

                <button
                  onClick={handleCopy}
                  style={{
                    background: copied ? '#52B79A' : '#1D1E22',
                    color: copied ? '#1D1E22' : '#FFFFFF',
                    border: '1.5px solid #1D1E22',
                    borderRadius: '10px',
                    padding: '0.6rem 0.95rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? (isHi ? '✓ कॉपी हुआ' : '✓ Link Copied') : (isHi ? 'कॉपी करें' : 'Copy Link')}</span>
                </button>
              </div>

              <p style={{ fontSize: '0.78rem', color: '#6B7280', lineHeight: 1.4, margin: 0 }}>
                ℹ️ {isHi ? 'लिंक कॉपी करें और अपने लैपटॉप ब्राउज़र में पेस्ट करें।' : 'Copy the link and paste it into your laptop browser.'}
              </p>

              <a
                href={LIVE_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#0A2458',
                  textDecoration: 'underline',
                  textAlign: 'center',
                  marginTop: '0.15rem'
                }}
              >
                {isHi ? 'या सीधे नए टैब में खोलें ↗' : 'Or open directly in new tab ↗'}
              </a>
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.76rem', color: '#6B7280', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div>Ministry of Statistics & Programme Implementation (MoSPI) • Government of India</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 600, color: '#1E7E34' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1E7E34', display: 'inline-block' }} />
            <span>Live System Online (155.248.255.235)</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default QrDemoView;
