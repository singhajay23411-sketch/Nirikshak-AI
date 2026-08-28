import React, { useState } from 'react';
import { ShieldAlert, AlertCircle, CheckCircle2, ChevronDown, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const VirtualOffice = () => {
  const { t } = useLanguage();
  const [openAccordion, setOpenAccordion] = useState('docket');
  const [submittedForm, setSubmittedForm] = useState(false);
  const [inspectionData, setInspectionData] = useState({ officerName: '', district: '', projectRef: 'MPLADS-2026-8871', date: '' });

  const toggleAccordion = (id) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const irregularitiesList = [
    t('riskScoring.dossier.irregularitiesList.0'),
    t('riskScoring.dossier.irregularitiesList.1'),
    t('riskScoring.dossier.irregularitiesList.2'),
    t('riskScoring.dossier.irregularitiesList.3'),
    t('riskScoring.dossier.irregularitiesList.4')
  ];

  const pipelineSteps = [
    { label: t('investigation.steps.0.label'), isAccent: false },
    { label: t('investigation.steps.1.label'), isAccent: false },
    { label: t('investigation.steps.2.label'), isAccent: false },
    { label: t('investigation.steps.3.label'), isAccent: false },
    { label: t('investigation.steps.4.label'), isAccent: true }
  ];

  return (
    <div id="risk-scoring">
      {/* SECTION 5 — RISK SCORE */}
      <section
        className="section-padding"
        style={{
          paddingTop: '6rem',
          paddingBottom: '6rem',
          background: 'var(--color-bg-light)',
          borderTop: '1px solid var(--color-border-subtle)',
          position: 'relative'
        }}
      >
        <div className="container">

          {/* Section Header */}
          <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 3.5rem auto' }}>
            <span className="eyebrow">{t('riskScoring.eyebrow')}</span>
            <h2 style={{ fontFamily: 'var(--font-serif-primary)', marginBottom: '1rem' }}>
              {t('riskScoring.heading')} <span style={{ color: 'var(--color-accent-teal-hover)' }}>{t('riskScoring.headingHighlight')}</span>
            </h2>
            <p className="lead">
              {t('riskScoring.lead')}
            </p>
          </div>

          {/* Project Risk Card Container */}
          <div
            style={{
              maxWidth: '920px',
              margin: '0 auto',
              background: 'var(--color-bg-card)',
              border: '2px solid var(--color-border-dark)',
              borderRadius: 'var(--radius-lg)',
              padding: '3rem 2.5rem',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            {/* Risk Card Header Banner */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1.5rem',
                paddingBottom: '1.8rem',
                borderBottom: '1.5px solid var(--color-border-subtle)',
                marginBottom: '2rem'
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#5A5A5A' }}>
                  {t('riskScoring.dossier.badge')}
                </span>
                <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.8rem', color: '#1D1E22', marginTop: '0.2rem' }}>
                  {t('riskScoring.dossier.title')}
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#5A5A5A' }}>
                  {t('riskScoring.dossier.meta')}
                </span>
              </div>

              {/* Risk Score Pill & Level */}
              <div
                style={{
                  background: 'var(--color-bg-card-sand)',
                  border: '1.5px solid #1D1E22',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem 1.6rem',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#D9534F' }}>
                  {t('riskScoring.dossier.riskLevel')}
                </div>
                <div style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '2.4rem', fontWeight: 700, color: '#1D1E22', lineHeight: 1.1 }}>
                  87 <span style={{ fontSize: '1.1rem', color: '#5A5A5A' }}>/ 100</span>
                </div>
              </div>
            </div>

            {/* Potential Irregularities List */}
            <div style={{ marginBottom: '2.2rem' }}>
              <h4 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.25rem', color: '#1D1E22', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={20} color="#D9534F" />
                {t('riskScoring.dossier.irregularitiesHeading')}
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.9rem' }}>
                {irregularitiesList.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#FAF8F3',
                      border: '1px solid #1D1E22',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.8rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: '#1D1E22'
                    }}
                  >
                    <span style={{ color: '#D9534F', fontWeight: 800 }}>⚠</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Action Box */}
            <div
              style={{
                background: 'rgba(82, 183, 154, 0.15)',
                border: '1.5px solid #1D1E22',
                borderRadius: 'var(--radius-md)',
                padding: '1.4rem 1.8rem',
                marginBottom: '2.5rem'
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#1D1E22', marginBottom: '0.3rem' }}>
                {t('riskScoring.dossier.actionTitle')}
              </div>
              <div style={{ fontSize: '1.02rem', fontWeight: 700, color: '#1D1E22' }}>
                {t('riskScoring.dossier.actionText')}
              </div>
            </div>

            {/* Mandatory Prominent Disclaimer Box */}
            <div
              style={{
                background: 'var(--color-bg-card-sand)',
                border: '1.5px dashed #1D1E22',
                borderRadius: 'var(--radius-md)',
                padding: '1.4rem 1.8rem',
                textAlign: 'center'
              }}
            >
              <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1D1E22', lineHeight: 1.5 }}>
                <ShieldAlert size={18} color="#E5B842" style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                {t('riskScoring.dossier.disclaimer')}
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 7 — INVESTIGATION CENTER */}
      <section
        id="investigation"
        className="section-padding"
        style={{
          background: 'var(--color-bg-card-sand)',
          borderTop: '1.5px solid var(--color-border-dark)'
        }}
      >
        <div className="container">

          <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 3.5rem auto' }}>
            <span className="eyebrow">{t('investigation.eyebrow')}</span>
            <h2 style={{ fontFamily: 'var(--font-serif-primary)', marginBottom: '1rem' }}>
              {t('investigation.heading')} <span style={{ color: 'var(--color-accent-teal-hover)' }}>{t('investigation.headingHighlight')}</span>
            </h2>
            <p className="lead">
              {t('investigation.lead')}
            </p>

            {/* Process Banner */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #1D1E22',
                borderRadius: 'var(--radius-md)',
                padding: '1.2rem 2rem',
                marginTop: '2.5rem',
                marginBottom: '3rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '1.2rem',
                flexWrap: 'wrap',
                pointerEvents: 'none'
              }}
            >
              {pipelineSteps.map((step, idx, arr) => (
                <React.Fragment key={step.label}>
                  <span
                    className="step-hover-item"
                    style={{
                      position: 'relative',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: '0.2rem 0.4rem',
                      margin: 0,
                      pointerEvents: 'auto',
                      isolation: 'isolate',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {/* Invisible constant layout width anchor */}
                    <span
                      style={{
                        visibility: 'hidden',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.2,
                        minWidth: '85px',
                        textAlign: 'center',
                        display: 'inline-block'
                      }}
                    >
                      {step.label}
                    </span>

                    {/* Visible text layer that animates on hover */}
                    <span
                      className="step-text-label"
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: step.isAccent ? '#52B79A' : '#1D1E22',
                        whiteSpace: 'nowrap',
                        transition: 'font-family 0.25s ease, color 0.2s ease, font-size 0.2s ease',
                        minWidth: '85px',
                        textAlign: 'center',
                        display: 'inline-block'
                      }}
                    >
                      {step.label}
                    </span>
                  </span>

                  {idx < arr.length - 1 && <ArrowRight size={16} color="#52B79A" />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Investigation Accordion Box */}
          <div
            style={{
              maxWidth: '900px',
              margin: '0 auto',
              background: '#FFFFFF',
              border: '1.5px solid var(--color-border-dark)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            {/* Accordion 1: Review Project Anomaly Docket */}
            <div style={{ borderBottom: '1.5px solid var(--color-border-dark)' }}>
              <div
                onClick={() => toggleAccordion('docket')}
                style={{
                  padding: '1.4rem 1.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  color: '#1D1E22',
                  background: openAccordion === 'docket' ? 'rgba(82, 183, 154, 0.1)' : 'transparent'
                }}
              >
                <span>{t('investigation.docketTitle')}</span>
                <ChevronDown size={20} style={{ transform: openAccordion === 'docket' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>

              {openAccordion === 'docket' && (
                <div style={{ padding: '1.5rem 1.8rem', background: '#FAF8F3', borderTop: '1px solid var(--color-border-subtle)' }}>
                  <p style={{ fontSize: '0.9rem', color: '#5A5A5A', marginBottom: '1rem' }}>
                    {t('investigation.docketLead')}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', border: '1px solid #1D1E22', padding: '0.8rem 1.2rem', borderRadius: 'var(--radius-sm)' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t('investigation.project1Title')}</div>
                        <div style={{ fontSize: '0.78rem', color: '#D9534F', fontWeight: 600 }}>{t('investigation.project1Sub')}</div>
                      </div>
                      <button onClick={() => alert(t('investigation.alerts.dossier1'))} className="btn-teal" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>
                        {t('investigation.generateDossierBtn')}
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', border: '1px solid #1D1E22', padding: '0.8rem 1.2rem', borderRadius: 'var(--radius-sm)' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t('investigation.project2Title')}</div>
                        <div style={{ fontSize: '0.78rem', color: '#E5B842', fontWeight: 600 }}>{t('investigation.project2Sub')}</div>
                      </div>
                      <button onClick={() => alert(t('investigation.alerts.dossier2'))} className="btn-teal" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>
                        {t('investigation.generateDossierBtn')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 2: Schedule Official Verification Inspection */}
            <div>
              <div
                onClick={() => toggleAccordion('schedule')}
                style={{
                  padding: '1.4rem 1.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  color: '#1D1E22',
                  background: openAccordion === 'schedule' ? 'rgba(82, 183, 154, 0.1)' : 'transparent'
                }}
              >
                <span>{t('investigation.scheduleTitle')}</span>
                <ChevronDown size={20} style={{ transform: openAccordion === 'schedule' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>

              {openAccordion === 'schedule' && (
                <div style={{ padding: '1.5rem 1.8rem', background: '#FAF8F3', borderTop: '1px solid var(--color-border-subtle)' }}>
                  {submittedForm ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                      <CheckCircle2 size={36} color="#52B79A" style={{ margin: '0 auto 0.5rem auto' }} />
                      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{t('investigation.dispatchLoggedTitle')}</div>
                      <div style={{ fontSize: '0.88rem', color: '#5A5A5A' }}>{t('investigation.dispatchLoggedDesc')}</div>
                    </div>
                  ) : (
                    <form onSubmit={(e) => { e.preventDefault(); setSubmittedForm(true); }} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      <input
                        type="text"
                        required
                        value={inspectionData.officerName}
                        onChange={(e) => setInspectionData({ ...inspectionData, officerName: e.target.value })}
                        placeholder={t('investigation.officerNamePlaceholder')}
                        style={{ padding: '0.75rem', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-sans)' }}
                      />
                      <input
                        type="text"
                        required
                        value={inspectionData.district}
                        onChange={(e) => setInspectionData({ ...inspectionData, district: e.target.value })}
                        placeholder={t('investigation.districtPlaceholder')}
                        style={{ padding: '0.75rem', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-sans)' }}
                      />
                      <button type="submit" className="btn-teal" style={{ padding: '0.75rem' }}>
                        {t('investigation.issueMandateBtn')}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <button
              onClick={() => alert(t('investigation.alerts.fullPortal'))}
              className="btn-teal"
              style={{ padding: '0.85rem 2.2rem', fontSize: '1rem' }}
            >
              {t('investigation.openPortalBtn')}
              <ArrowRight size={18} />
            </button>
          </div>

        </div>
      </section>

      <style>{`
        .step-hover-item {
          pointer-events: auto !important;
          isolation: isolate;
        }
        .step-hover-item:hover .step-text-label {
          font-family: var(--font-handwritten) !important;
          font-size: 1.05rem !important;
          color: var(--color-accent-teal-hover) !important;
          text-transform: uppercase !important;
        }
      `}</style>
    </div>
  );
};

export default VirtualOffice;

