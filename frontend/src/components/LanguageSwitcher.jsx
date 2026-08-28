import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const LanguageSwitcher = ({ isMobile = false }) => {
  const { language, toggleLanguage } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);

  const isEn = language === 'en';

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="btn-teal"
      aria-label={isEn ? "Switch language to Hindi" : "Switch language to English"}
      title={isEn ? "Switch to Hindi (हिंदी)" : "Switch to English (ENGLISH)"}
      style={{
        padding: '0.65rem 1rem',
        fontSize: '0.85rem',
        fontWeight: 700,
        width: '126px',
        minWidth: '126px',
        maxWidth: '126px',
        height: '42px',
        boxSizing: 'border-box',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.45rem',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
        outline: 'none',
        lineHeight: 1.2
      }}
    >
      {/* Globe Icon */}
      <Globe size={16} strokeWidth={2.2} color="#1D1E22" style={{ flexShrink: 0 }} />

      {/* Single Fixed-Size Text Viewport with Smooth Roll/Fade Animation */}
      <div
        style={{
          position: 'relative',
          height: '1.25em',
          width: '68px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        {/* Currently Selected Language */}
        <span
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            textAlign: 'center',
            transform: isHovered ? 'translateY(-135%)' : 'translateY(0%)',
            opacity: isHovered ? 0 : 1,
            transition: 'transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.18s ease',
            color: '#1D1E22',
            fontWeight: 700,
            fontSize: isEn ? '0.82rem' : '0.88rem',
            fontFamily: 'var(--font-sans)',
            whiteSpace: 'nowrap',
            letterSpacing: isEn ? '0.04em' : 'normal'
          }}
        >
          {isEn ? 'ENGLISH' : 'हिंदी'}
        </span>

        {/* Alternative Language Revealed on Hover */}
        <span
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            textAlign: 'center',
            transform: isHovered ? 'translateY(0%)' : 'translateY(135%)',
            opacity: isHovered ? 1 : 0,
            transition: 'transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.18s ease',
            color: '#1D1E22',
            fontWeight: 700,
            fontSize: isEn ? '0.88rem' : '0.82rem',
            fontFamily: 'var(--font-sans)',
            whiteSpace: 'nowrap',
            letterSpacing: isEn ? 'normal' : '0.04em'
          }}
        >
          {isEn ? 'हिंदी' : 'ENGLISH'}
        </span>
      </div>
    </button>
  );
};

export default LanguageSwitcher;



