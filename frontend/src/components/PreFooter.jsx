import React from 'react';
import { ArrowRight } from 'lucide-react';
import prefooterRoadmapImg from '../assets/prefooter-roadmap.jpg';

const PreFooter = ({ onExploreClick }) => {
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else if (onExploreClick) {
      onExploreClick();
    }
  };

  return (
    <section
      id="roadmap"
      className="scroll-reveal"
      style={{
        background: 'var(--color-bg-light)',
        paddingTop: '6rem',
        paddingBottom: '0',
        overflow: 'hidden',
        position: 'relative',
        borderTop: '1px solid var(--color-border-subtle)'
      }}
    >
      <div className="container" style={{ textAlign: 'center', maxWidth: '960px', margin: '0 auto 3.5rem auto' }}>
        {/* Eyebrow badge */}
        <span className="eyebrow" style={{ marginBottom: '1rem' }}>
          MPLADS INTELLIGENCE ROADMAP
        </span>

        {/* Large Serif Title inspired by reference */}
        <h2
          style={{
            fontFamily: 'var(--font-serif-primary)',
            fontSize: 'clamp(2.4rem, 4.8vw, 3.8rem)',
            fontWeight: 500,
            lineHeight: 1.15,
            color: 'var(--color-text-primary)',
            marginBottom: '1.2rem',
            letterSpacing: '-0.02em'
          }}
        >
          A transparent roadmap for every constituency.
        </h2>

        {/* Short supporting text */}
        <p
          style={{
            fontSize: '1.2rem',
            color: 'var(--color-text-secondary)',
            maxWidth: '680px',
            margin: '0 auto 2.2rem auto',
            lineHeight: 1.6
          }}
        >
          Accountability is a continuous journey. Monitor fund flows, detect anomalies, and verify development works with confidence.
        </p>

        {/* CTA Button */}
        <div>
          <button
            onClick={() => scrollToSection('risk-scoring')}
            className="btn-teal"
            style={{
              padding: '0.85rem 2.2rem',
              fontSize: '1.02rem',
              gap: '0.65rem'
            }}
          >
            Explore Dashboard
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Large Scenic Panoramic Line Art Illustration Flush to the Bottom */}
      <div
        style={{
          width: '100%',
          maxWidth: '1380px',
          margin: '0 auto',
          position: 'relative',
          lineHeight: 0,
          borderBottom: '1.5px solid #1D1E22'
        }}
      >
        <img
          src={prefooterRoadmapImg}
          alt="Roadmap to transparent MPLADS governance"
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '440px',
            objectFit: 'cover',
            objectPosition: 'center 40%',
            display: 'block'
          }}
        />
      </div>
    </section>
  );
};

export default PreFooter;
