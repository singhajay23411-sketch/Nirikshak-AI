import React, { useState, useEffect } from 'react';
import { ChevronDown, Menu, X, ArrowRight, ShieldAlert } from 'lucide-react';

const NirikshakLogo = () => {
  const [animStage, setAnimStage] = useState('idle'); // 'idle' | 'disappearing' | 'vanished' | 'revealing'
  const [dDelays, setDDelays] = useState([]);
  const [rDelays, setRDelays] = useState([]);

  const primaryChars = "NIRIKSHΛK ΛI".split("");
  const secondaryChars = "MPLΛDS INTELLIGENCE".split("");
  const totalCount = primaryChars.length + secondaryChars.length;

  const handleMouseEnter = () => {
    if (animStage !== 'idle') return;

    // Fisher-Yates shuffle helper to generate random rank indices
    const getRandomDelays = (stepMs) => {
      const indices = Array.from({ length: totalCount }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      const delays = new Array(totalCount);
      indices.forEach((charIdx, rank) => {
        delays[charIdx] = Math.round(rank * stepMs);
      });
      return delays;
    };

    // Separate randomized orders for disappear & reveal
    const disappearDelays = getRandomDelays(8); // 0ms to ~240ms
    const revealDelays = getRandomDelays(9);    // 0ms to ~270ms

    setDDelays(disappearDelays);
    setRDelays(revealDelays);

    // Phase 1: Disappearing in random order (0ms - 360ms)
    setAnimStage('disappearing');

    // Hold vanished state for a distinct 400ms pause beat (360ms - 760ms)
    setTimeout(() => {
      setAnimStage('vanished');
    }, 360);

    // Phase 2: Revealing back in a different random order after the pause (760ms - 1450ms)
    setTimeout(() => {
      setAnimStage('revealing');
    }, 760);

    // Reset to idle after smooth completion
    setTimeout(() => {
      setAnimStage('idle');
    }, 1450);
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        cursor: 'pointer',
        userSelect: 'none'
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 650 200"
        style={{
          height: '80px', // Additional 30% size increase (80px display height)
          width: 'auto',
          display: 'block'
        }}
      >
        {/* Primary Text: NIRIKSHΛK ΛI */}
        <text
          x="10"
          y="110"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="54"
          fontWeight="800"
          letterSpacing="12"
          fill="#1D1E22"
        >
          {primaryChars.map((char, index) => {
            const charGlobalIdx = index;
            const style = {};
            if (animStage === 'disappearing') {
              style.animation = 'logoDisappear 0.22s cubic-bezier(0.4, 0, 0.2, 1) forwards';
              style.animationDelay = `${dDelays[charGlobalIdx] || 0}ms`;
            } else if (animStage === 'vanished') {
              style.opacity = 0;
              style.transform = 'translateY(-7px) scale(0.8)';
            } else if (animStage === 'revealing') {
              style.animation = 'logoReveal 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards';
              style.animationDelay = `${rDelays[charGlobalIdx] || 0}ms`;
            }

            return (
              <tspan key={`p-${index}`} style={style}>
                {char === " " ? "\u00A0" : char}
              </tspan>
            );
          })}
        </text>

        {/* Secondary Text: MPLΛDS INTELLIGENCE */}
        <text
          x="15"
          y="155"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="18"
          fontWeight="500"
          letterSpacing="12"
          fill="#0A2458"
        >
          {secondaryChars.map((char, index) => {
            const charGlobalIdx = primaryChars.length + index;
            const style = {};
            if (animStage === 'disappearing') {
              style.animation = 'logoDisappear 0.22s cubic-bezier(0.4, 0, 0.2, 1) forwards';
              style.animationDelay = `${dDelays[charGlobalIdx] || 0}ms`;
            } else if (animStage === 'vanished') {
              style.opacity = 0;
              style.transform = 'translateY(-7px) scale(0.8)';
            } else if (animStage === 'revealing') {
              style.animation = 'logoReveal 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards';
              style.animationDelay = `${rDelays[charGlobalIdx] || 0}ms`;
            }

            return (
              <tspan key={`s-${index}`} style={style}>
                {char === " " ? "\u00A0" : char}
              </tspan>
            );
          })}
        </text>
      </svg>
    </div>
  );
};

const Header = ({ activeSection, setActiveSection }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'hero', label: 'Home' },
    { id: 'problem', label: 'The Problem' },
    { id: 'process', label: 'Solution Process' },
    { id: 'ai-detection', label: 'AI Intelligence' },
    { id: 'risk-scoring', label: 'Risk Scoring' },
    { id: 'geospatial', label: 'Geospatial Map' },
    { id: 'investigation', label: 'Investigation' }
  ];

  const handleNavClick = (sectionId) => {
    setActiveSection(sectionId);
    setMobileMenuOpen(false);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: isScrolled ? '74px' : '86px',
        zIndex: 1000,
        transition: 'all 0.3s ease',
        background: isScrolled ? 'rgba(250, 248, 243, 0.96)' : 'var(--color-bg-light)',
        backdropFilter: isScrolled ? 'blur(10px)' : 'none',
        borderBottom: '1px solid var(--color-border-subtle)',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <div style={{ width: '100%', maxWidth: '100%', padding: '0 clamp(1.25rem, 2.5vw, 2.5rem)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%', position: 'relative' }}>

        {/* Logo Block — left edge */}
        <div
          onClick={() => handleNavClick('hero')}
          className="logo-brand"
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <NirikshakLogo />
        </div>

        {/* Viewport-centered Desktop Navigation (absolute positioning) */}
        <nav style={{ display: 'none', gap: '1.2rem', alignItems: 'center', justifyContent: 'center', position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }} className="desktop-nav">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className="nav-item-btn"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                whiteSpace: 'nowrap',
                pointerEvents: 'auto',
                padding: '0.25rem 0.35rem',
                margin: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {/* Invisible layout anchor reserving constant width */}
              <span
                style={{
                  visibility: 'hidden',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.96rem',
                  fontWeight: activeSection === link.id ? 700 : 600,
                  whiteSpace: 'nowrap',
                  lineHeight: 1.2
                }}
              >
                {link.label}
              </span>

              {/* Visible text layer that transforms on hover without layout reflow */}
              <span
                className="nav-text-label"
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: activeSection === link.id ? '#1D1E22' : '#2A2C32',
                  fontSize: '0.96rem',
                  fontWeight: activeSection === link.id ? 700 : 600,
                  fontFamily: 'var(--font-sans)',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.2s ease, font-family 0.2s ease, font-size 0.2s ease'
                }}
              >
                {link.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Fixed Right Action Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <button
            onClick={() => handleNavClick('risk-scoring')}
            className="btn-teal"
            style={{ padding: '0.65rem 1.4rem', fontSize: '0.88rem', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            Explore Dashboard
            <ArrowRight size={16} />
          </button>

          <button
            onClick={() => alert("Nirikshak AI Help Desk: Supporting MoSPI & District Authorities in MPLADS Verification.")}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: '#52B79A',
              border: '1.5px solid #1D1E22',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '1.5px 2px 0px #1D1E22',
              flexShrink: 0
            }}
            title="MoSPI Verification Support"
          >
            <ShieldAlert size={20} color="#1D1E22" />
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'flex',
              background: 'none',
              border: 'none',
              color: '#1D1E22',
              cursor: 'pointer',
              padding: '0.4rem'
            }}
            className="mobile-toggle"
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#FAF8F3',
            borderBottom: '1px solid var(--color-border-dark)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          {navLinks.map((link) => (
            <div
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              style={{
                fontSize: '1.05rem',
                fontWeight: 600,
                color: '#1D1E22',
                cursor: 'pointer',
                padding: '0.5rem 0',
                borderBottom: '1px solid rgba(29,30,34,0.08)'
              }}
            >
              {link.label}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes logoDisappear {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-7px) scale(0.8);
          }
        }
        @keyframes logoReveal {
          0% {
            opacity: 0;
            transform: translateY(7px) scale(0.8);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .logo-brand:hover {
          transform: scale(1.03);
        }
        .nav-item-btn {
          pointer-events: auto !important;
          isolation: isolate;
        }
        .nav-item-btn:hover .nav-text-label {
          font-family: var(--font-handwritten) !important;
          font-size: 1.15rem !important;
          color: var(--color-accent-teal-hover) !important;
        }
        @media (min-width: 992px) {
          .desktop-nav { display: flex !important; }
          .mobile-toggle { display: none !important; }
        }
      `}</style>
    </header>
  );
};

export default Header;





