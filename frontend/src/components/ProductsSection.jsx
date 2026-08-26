import React, { useState } from 'react';
import { DollarSign, Activity, Scale, Copy, Clock, Image, Users, MapPin, ArrowRight, AlertTriangle } from 'lucide-react';

const ProductsSection = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [budgetSpentPct, setBudgetSpentPct] = useState(85);
  const [progressPct, setProgressPct] = useState(35);

  const features = [
    {
      id: 'financial-anomalies',
      title: 'Financial Anomalies',
      tag: 'FINANCIAL SIGNAL',
      icon: DollarSign,
      description: 'Identify unusual expenditure, abnormal costs and suspicious payment patterns.'
    },
    {
      id: 'progress-inconsistencies',
      title: 'Progress Inconsistencies',
      tag: 'PROGRESS SIGNAL',
      icon: Activity,
      description: 'Compare financial expenditure with reported physical progress.'
    },
    {
      id: 'cost-benchmarking',
      title: 'Cost Benchmarking',
      tag: 'COMPARATIVE SIGNAL',
      icon: Scale,
      description: 'Compare projects with genuinely similar works based on category, location and relevant project characteristics.'
    },
    {
      id: 'duplicate-works',
      title: 'Duplicate Works',
      tag: 'GEOSPATIAL & TEXT SIGNAL',
      icon: Copy,
      description: 'Use project descriptions, locations and other signals to identify potentially duplicated projects.'
    },
    {
      id: 'delay-risk',
      title: 'Delay Risk',
      tag: 'TIMELINE SIGNAL',
      icon: Clock,
      description: 'Identify delayed projects and predict projects that may miss their expected completion.'
    },
    {
      id: 'evidence-verification',
      title: 'Evidence Verification',
      tag: 'MULTIMEDIA SIGNAL',
      icon: Image,
      description: 'Compare uploaded photographs and supporting evidence for potential inconsistencies or reuse.'
    },
    {
      id: 'agency-intelligence',
      title: 'Agency Intelligence',
      tag: 'AGENCY SIGNAL',
      icon: Users,
      description: 'Analyze historical project performance and identify recurring patterns requiring review.'
    },
    {
      id: 'geospatial-intelligence',
      title: 'Geospatial Intelligence',
      tag: 'SPATIAL SIGNAL',
      icon: MapPin,
      description: 'Identify geographic patterns, project clusters and potentially duplicated works.'
    }
  ];

  // Calculate simulated risk score from slider values
  const discrepancy = Math.max(0, budgetSpentPct - progressPct);
  const simulatedRiskScore = Math.min(99, Math.round(20 + discrepancy * 0.9 + (budgetSpentPct > 80 && progressPct < 50 ? 25 : 0)));

  return (
    <section
      id="ai-detection"
      className="section-padding"
      style={{
        background: 'var(--color-bg-light)',
        borderTop: '1px solid var(--color-border-subtle)'
      }}
    >
      <div className="container">

        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 3.5rem auto' }}>
          <span className="eyebrow">AI INTELLIGENCE</span>
          <h2 style={{ fontFamily: 'var(--font-serif-primary)', marginBottom: '1rem' }}>
            What Nirikshak AI <span style={{ color: 'var(--color-accent-teal-hover)' }}>Detects</span>
          </h2>
          <p className="lead">
            Nirikshak AI evaluates multi-signal indicators to spot potential irregularities and highlight high-risk projects for field inspection.
          </p>
        </div>

        {/* Feature Cards Grid (8 items) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
            gap: '1.8rem',
            marginBottom: '3rem'
          }}
        >
          {features.map((feat) => {
            const IconComp = feat.icon;

            return (
              <div key={feat.id} className="card-light" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: '#E5B842',
                        border: '1.5px solid #1D1E22',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <IconComp size={22} color="#1D1E22" />
                    </div>

                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: '#1D1E22',
                        background: 'rgba(82, 183, 154, 0.2)',
                        padding: '0.3rem 0.6rem',
                        borderRadius: 'var(--radius-full)'
                      }}
                    >
                      {feat.tag}
                    </span>
                  </div>

                  <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.35rem', marginBottom: '0.6rem' }}>
                    {feat.title}
                  </h3>

                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                    {feat.description}
                  </p>
                </div>

                <button
                  onClick={() => setActiveModal(feat.id)}
                  className="btn-outline-dark"
                  style={{ width: '100%', padding: '0.65rem', fontSize: '0.85rem' }}
                >
                  Test Detector Signal
                  <ArrowRight size={15} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Interactive Detector Simulator Drawer */}
        {activeModal && (
          <div
            style={{
              marginTop: '2rem',
              background: '#FFFFFF',
              border: '2px solid #1D1E22',
              borderRadius: 'var(--radius-lg)',
              padding: '2.5rem',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <span className="eyebrow" style={{ marginBottom: 0 }}>DETECTOR SIMULATION</span>
                <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.6rem' }}>
                  Progress & Expenditure Discrepancy Simulator
                </h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="btn-outline-dark" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                Close
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'center' }}>
              <div>
                <div style={{ marginBottom: '1.2rem' }}>
                  <label style={{ display: 'block', fontSize: '0.88rem', color: '#1D1E22', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Budget Spent: <strong>{budgetSpentPct}%</strong>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={budgetSpentPct}
                    onChange={(e) => setBudgetSpentPct(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#52B79A', cursor: 'pointer' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', color: '#1D1E22', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Physical Progress: <strong>{progressPct}%</strong>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={progressPct}
                    onChange={(e) => setProgressPct(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#52B79A', cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div
                style={{
                  background: 'var(--color-bg-card-sand)',
                  border: '1.5px solid #1D1E22',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.8rem',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, color: '#1D1E22' }}>
                  SIMULATED ANOMALY RISK SCORE
                </div>
                <div style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '2.8rem', fontWeight: 700, color: simulatedRiskScore > 70 ? '#D9534F' : '#1D1E22', margin: '0.3rem 0' }}>
                  {simulatedRiskScore} <span style={{ fontSize: '1.2rem', color: '#5A5A5A' }}>/ 100</span>
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: simulatedRiskScore > 70 ? '#D9534F' : '#52B79A' }}>
                  {simulatedRiskScore > 70 ? 'HIGH RISK • Inspection Recommended' : 'MODERATE RISK • Monitor Milestones'}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};

export default ProductsSection;

