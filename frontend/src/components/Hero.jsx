import React, { useState } from 'react';
import { ArrowRight, Play, ShieldAlert, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

import projectApprovalsImg from '../assets/Project Approvals.png';
import financialExpenditureImg from '../assets/Financial Expenditure.png';
import physicalProgressImg from '../assets/Physical Progress,.png';
import evidenceVerificationImg from '../assets/Evidence Verification,.png';
import geospatialIntelligenceImg from '../assets/Geospatial Intelligence.png';
import cardIllustrationImg from '../assets/hero-illustration.jpg';

const PreviewTextLink = ({ text, image, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <span
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="link-underline" onClick={onClick}>
        {text}
      </span>

      {/* Image Preview Popup with Radial "Originating from Text" Portal Animation */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          left: '50%',
          width: '280px',
          height: '190px',
          background: '#FAF8F3',
          border: '1.5px solid #1D1E22',
          borderRadius: 'var(--radius-md)',
          boxShadow: '3px 4px 0px #1D1E22',
          overflow: 'hidden',
          zIndex: 100,
          pointerEvents: 'none',
          opacity: isHovered ? 1 : 0,
          clipPath: isHovered ? 'circle(160% at 50% 0%)' : 'circle(0% at 50% 0%)',
          transform: isHovered ? 'translate(-50%, 0)' : 'translate(-50%, -10px)',
          transition: 'clip-path 0.42s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <img
          src={image}
          alt={text}
          style={{
            width: '280px',
            height: '190px',
            objectFit: 'contain',
            display: 'block'
          }}
        />
      </div>
    </span>
  );
};

const Hero = ({ onExploreClick, onVirtualOfficeClick }) => {
  const { t } = useLanguage();

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="hero"
      style={{
        position: 'relative',
        paddingTop: '8rem',
        paddingBottom: '5rem',
        background: 'var(--color-bg-light)',
        overflow: 'visible'
      }}
    >
      <div className="container">

        {/* Intro Underlined Text Banner */}
        <div style={{ textAlign: 'center', maxWidth: '880px', margin: '0 auto 4rem auto' }}>
          <div
            style={{
              fontFamily: 'var(--font-serif-primary)',
              fontSize: '1.55rem',
              lineHeight: 1.5,
              color: 'var(--color-text-primary)'
            }}
          >
            {t('hero.introLead')}{' '}
            <PreviewTextLink
              text={t('hero.previews.projectApprovals')}
              image={projectApprovalsImg}
              onClick={() => scrollToId('problem')}
            />,{' '}
            <PreviewTextLink
              text={t('hero.previews.financialExpenditure')}
              image={financialExpenditureImg}
              onClick={() => scrollToId('problem')}
            />,{' '}
            <PreviewTextLink
              text={t('hero.previews.physicalProgress')}
              image={physicalProgressImg}
              onClick={() => scrollToId('problem')}
            />,{' '}
            <PreviewTextLink
              text={t('hero.previews.evidenceVerification')}
              image={evidenceVerificationImg}
              onClick={() => scrollToId('ai-detection')}
            />, and{' '}
            <PreviewTextLink
              text={t('hero.previews.geospatialIntelligence')}
              image={geospatialIntelligenceImg}
              onClick={() => scrollToId('geospatial')}
            />.
          </div>
        </div>

        {/* Hero Section Split Layout: Hand-Drawn Ink Line Art Illustration Left + AI Intelligence Title Right */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '3.5rem',
            alignItems: 'center',
            marginBottom: '5rem'
          }}
        >
          {/* Left Column: Authentic Hand-Drawn Government & Geospatial Line Art */}
          <div
            style={{
              position: 'relative',
              background: '#F3EFE6',
              border: '1.5px solid #1D1E22',
              borderRadius: 'var(--radius-lg)',
              padding: '1.8rem 1.2rem',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '390px'
            }}
          >
            {/* Left Hero Card Image Illustration */}
            <img
              src={cardIllustrationImg}
              alt="MPLADS Risk Intelligence Illustration"
              style={{
                width: '100%',
                maxHeight: '345px',
                objectFit: 'contain',
                display: 'block'
              }}
            />

            <div style={{ position: 'absolute', bottom: '1rem', left: '1.5rem' }}>
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  color: '#1D1E22',
                  background: '#E5B842',
                  border: '1px solid #1D1E22',
                  padding: '0.3rem 0.8rem',
                  borderRadius: 'var(--radius-full)'
                }}
              >
                {t('hero.badge')}
              </span>
            </div>
          </div>

          {/* Right Column: Title, Copy & CTA */}
          <div>
            <span className="eyebrow">{t('hero.eyebrow')}</span>

            <h1
              style={{
                fontFamily: 'var(--font-serif-primary)',
                fontSize: '2.8rem',
                marginBottom: '1.2rem',
                color: '#1D1E22',
                fontWeight: 600,
                lineHeight: 1.15
              }}
            >
              {t('hero.headline')}
            </h1>

            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.08rem', lineHeight: 1.7, marginBottom: '2rem' }}>
              {t('hero.description')}
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2rem' }}>
              <button onClick={() => scrollToId('risk-scoring')} className="btn-teal">
                {t('common.exploreDashboard')}
                <ArrowRight size={16} />
              </button>

              <button onClick={() => scrollToId('process')} className="btn-outline-dark">
                {t('hero.ctaHowItWorks')}
              </button>
            </div>

            {/* Supporting Microcopy */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.88rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: '#4A4D55',
                textTransform: 'uppercase',
                borderTop: '1px solid var(--color-border-subtle)',
                paddingTop: '1.2rem'
              }}
            >
              <CheckCircle size={16} color="#52B79A" />
              <span>{t('hero.microcopy')}</span>
            </div>
          </div>
        </div>

        {/* System Positioning & Overview Section */}
        <div
          style={{
            background: 'var(--color-bg-card-sand)',
            border: '1.5px solid var(--color-border-dark)',
            borderRadius: 'var(--radius-lg)',
            padding: '3rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2.5rem',
            alignItems: 'center'
          }}
        >
          <div>
            <p style={{ fontSize: '1.12rem', color: '#1D1E22', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              {t('hero.quote')}
            </p>

            {/* Handwritten Signature Accent */}
            <div className="handwritten">
              {t('hero.signature')}
            </div>
          </div>

          {/* Video Thumbnail Placeholder */}
          <div
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid #1D1E22',
              overflow: 'hidden',
              height: '220px',
              background: 'linear-gradient(135deg, #1D1E22, #2B3A42)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            onClick={() => alert(t('hero.videoAlert'))}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#FAF8F3',
                border: '1.5px solid #1D1E22',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-button)'
              }}
            >
              <Play size={24} color="#1D1E22" style={{ marginLeft: '3px' }} />
            </div>

            <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', color: '#FFFFFF', fontSize: '0.85rem', fontWeight: 600 }}>
              {t('hero.watchVideoText')}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;

