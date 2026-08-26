import React, { useState } from 'react';
import { Database, DollarSign, Activity, FileCheck, ArrowRight, ShieldCheck, Cpu, AlertTriangle, BarChart3, Search, ChevronRight } from 'lucide-react';

const PathwaysGrid = () => {
  const problemCards = [
    {
      id: 'project-data',
      title: 'Project Data',
      icon: Database,
      tagline: 'Approvals & Classifications',
      description: 'Project approvals, locations, categories, implementing agencies and project status.',
      bulletPoints: [
        'Sanction orders & administrative approvals',
        'Geographic district & constituency tagging',
        'Implementing agency registration & performance',
        'Project sector classification & scope definition'
      ]
    },
    {
      id: 'financial-data',
      title: 'Financial Data',
      icon: DollarSign,
      tagline: 'Funds & Expenditure Flow',
      description: 'Sanctioned amounts, releases, expenditure and payment information.',
      bulletPoints: [
        'Sanctioned cost vs. installment releases',
        'Vendor payments & voucher breakdowns',
        'Unspent balance & interest tracking',
        'Utilization certificate (UC) alignment'
      ]
    },
    {
      id: 'progress-data',
      title: 'Progress Data',
      icon: Activity,
      tagline: 'Timelines & Execution Rates',
      description: 'Project timelines, completion dates and physical progress.',
      bulletPoints: [
        'Start dates, milestones & expected completion',
        'Reported physical completion percentages',
        'Historical delay metrics & extension requests',
        'Site inspection frequency & status logs'
      ]
    },
    {
      id: 'evidence-docs',
      title: 'Evidence & Documents',
      icon: FileCheck,
      tagline: 'Photographs & Official Records',
      description: 'Photographs and supporting project documentation.',
      bulletPoints: [
        'Geotagged site photographs & work logs',
        'Measurement books (MB) & completion reports',
        'Contractor agreements & technical sanction files',
        'Audit queries & public grievance reports'
      ]
    }
  ];

  const processSteps = [
    { label: 'MPLADS DATA', desc: 'Financial, physical & photo signals', icon: Database },
    { label: 'AI ANALYSIS', desc: 'Cross-project pattern matching', icon: Cpu },
    { label: 'ANOMALY DETECTION', desc: 'Flags discrepancies & delays', icon: AlertTriangle },
    { label: 'RISK SCORING', desc: 'Quantified 0-100 risk score', icon: BarChart3 },
    { label: 'EXPLAINABLE EVIDENCE', desc: 'Human-readable factor breakdowns', icon: Search },
    { label: 'INVESTIGATION PRIORITY', desc: 'Focused physical verification', icon: ShieldCheck }
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
            <span className="eyebrow">THE PROBLEM</span>
            <h2 style={{ fontFamily: 'var(--font-serif-primary)', marginBottom: '1rem' }}>
              Thousands of Projects. <span style={{ color: 'var(--color-accent-teal-hover)' }}>One Intelligence Layer.</span>
            </h2>
            <p className="lead">
              MPLADS involves thousands of development projects, multiple authorities and substantial public funds. Manually examining project approvals, expenditure, progress, payments and supporting evidence can make it difficult to identify unusual patterns in time.
            </p>
          </div>

          {/* Problem Content Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
              gap: '1.8rem',
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
            <span className="eyebrow">SOLUTION PROCESS</span>
            <h2 style={{ fontFamily: 'var(--font-serif-primary)', marginBottom: '1rem' }}>
              From Project Data to <span style={{ color: 'var(--color-accent-teal-hover)' }}>Actionable Risk Intelligence</span>
            </h2>
            <p className="lead">
              Nirikshak AI combines multiple signals across MPLADS projects to identify potential irregularities and bring high-priority cases to the attention of officials.
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

