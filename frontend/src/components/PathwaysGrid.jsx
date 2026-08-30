import React from 'react';
import { Database, DollarSign, Activity, FileCheck, ShieldCheck, Cpu, AlertTriangle, BarChart3, Search, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const PathwaysGrid = () => {
  const { t } = useLanguage();

  const problemCards = [
    {
      id: 'project-data',
      title: t('problem.cards.projectData.title'),
      icon: Database,
      tagline: t('problem.cards.projectData.tagline'),
      description: t('problem.cards.projectData.description'),
      bulletPoints: [
        t('problem.cards.projectData.bullets.0'),
        t('problem.cards.projectData.bullets.1'),
        t('problem.cards.projectData.bullets.2'),
        t('problem.cards.projectData.bullets.3')
      ]
    },
    {
      id: 'financial-data',
      title: t('problem.cards.financialData.title'),
      icon: DollarSign,
      tagline: t('problem.cards.financialData.tagline'),
      description: t('problem.cards.financialData.description'),
      bulletPoints: [
        t('problem.cards.financialData.bullets.0'),
        t('problem.cards.financialData.bullets.1'),
        t('problem.cards.financialData.bullets.2'),
        t('problem.cards.financialData.bullets.3')
      ]
    },
    {
      id: 'progress-data',
      title: t('problem.cards.progressData.title'),
      icon: Activity,
      tagline: t('problem.cards.progressData.tagline'),
      description: t('problem.cards.progressData.description'),
      bulletPoints: [
        t('problem.cards.progressData.bullets.0'),
        t('problem.cards.progressData.bullets.1'),
        t('problem.cards.progressData.bullets.2'),
        t('problem.cards.progressData.bullets.3')
      ]
    },
    {
      id: 'evidence-docs',
      title: t('problem.cards.evidenceDocs.title'),
      icon: FileCheck,
      tagline: t('problem.cards.evidenceDocs.tagline'),
      description: t('problem.cards.evidenceDocs.description'),
      bulletPoints: [
        t('problem.cards.evidenceDocs.bullets.0'),
        t('problem.cards.evidenceDocs.bullets.1'),
        t('problem.cards.evidenceDocs.bullets.2'),
        t('problem.cards.evidenceDocs.bullets.3')
      ]
    }
  ];

  const processSteps = [
    { label: t('process.steps.0.label'), desc: t('process.steps.0.desc'), icon: Database },
    { label: t('process.steps.1.label'), desc: t('process.steps.1.desc'), icon: Cpu },
    { label: t('process.steps.2.label'), desc: t('process.steps.2.desc'), icon: AlertTriangle },
    { label: t('process.steps.3.label'), desc: t('process.steps.3.desc'), icon: BarChart3 },
    { label: t('process.steps.4.label'), desc: t('process.steps.4.desc'), icon: Search },
    { label: t('process.steps.5.label'), desc: t('process.steps.5.desc'), icon: ShieldCheck }
  ];

  return (
    <div id="problem">
      {/* SECTION 2 — THE PROBLEM */}
      <section
        className="section-padding"
        style={{
          background: 'var(--color-bg-light)',
          borderTop: '1px solid var(--color-border-subtle)',
          position: 'relative'
        }}
      >
        <div className="container">

          {/* Section Header */}
          <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 3.5rem auto' }}>
            <span className="eyebrow">{t('problem.eyebrow')}</span>
            <h2 style={{ fontFamily: 'var(--font-serif-primary)', marginBottom: '1rem' }}>
              {t('problem.heading')} <span style={{ color: 'var(--color-accent-teal-hover)' }}>{t('problem.headingHighlight')}</span>
            </h2>
            <p className="lead">
              {t('problem.lead')}
            </p>
          </div>

          {/* Problem Content Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
              gap: '1.75rem',
              marginBottom: '4rem'
            }}
          >
            {problemCards.map((card) => {
              const IconComp = card.icon;

              return (
                <div key={card.id} className="card-light" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          background: '#E5B842',
                          border: '1.5px solid #1D1E22',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <IconComp size={22} color="#1D1E22" />
                      </div>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.35rem' }}>
                          {card.title}
                        </h3>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#52B79A' }}>
                          {card.tagline}
                        </span>
                      </div>
                    </div>

                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.94rem', lineHeight: 1.6, marginBottom: '1.2rem' }}>
                      {card.description}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {card.bulletPoints.map((pt, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.84rem', color: '#1D1E22' }}>
                          <span style={{ color: '#52B79A', fontWeight: 800 }}>•</span>
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* SECTION 3 — SOLUTION PROCESS */}
      <section
        id="process"
        className="section-padding"
        style={{
          background: 'var(--color-bg-card-sand)',
          borderTop: '1.5px solid var(--color-border-dark)',
          borderBottom: '1.5px solid var(--color-border-dark)'
        }}
      >
        <div className="container">

          <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 3.5rem auto' }}>
            <span className="eyebrow">{t('process.eyebrow')}</span>
            <h2 style={{ fontFamily: 'var(--font-serif-primary)', marginBottom: '1rem' }}>
              {t('process.heading')} <span style={{ color: 'var(--color-accent-teal-hover)' }}>{t('process.headingHighlight')}</span>
            </h2>
            <p className="lead">
              {t('process.lead')}
            </p>
          </div>

          {/* Horizontal Process Steps Flow */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1.2rem',
              alignItems: 'stretch'
            }}
          >
            {processSteps.map((step, idx) => {
              const StepIcon = step.icon;

              return (
                <div
                  key={idx}
                  style={{
                    background: '#FFFFFF',
                    border: '1.5px solid #1D1E22',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.5rem 1.2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    boxShadow: 'var(--shadow-card)'
                  }}
                >
                  <div>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: idx === 3 || idx === 5 ? '#E5B842' : '#52B79A',
                        border: '1.5px solid #1D1E22',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        marginBottom: '1rem'
                      }}
                    >
                      0{idx + 1}
                    </div>

                    <h4 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.05rem', fontWeight: 700, color: '#1D1E22', marginBottom: '0.4rem', lineHeight: 1.25 }}>
                      {step.label}
                    </h4>

                    <p style={{ fontSize: '0.82rem', color: '#5A5A5A', lineHeight: 1.5 }}>
                      {step.desc}
                    </p>
                  </div>

                  {idx < processSteps.length - 1 && (
                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', color: '#1D1E22' }}>
                      <ChevronRight size={18} strokeWidth={2.5} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>
    </div>
  );
};

export default PathwaysGrid;

