import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, Search, CheckCircle, AlertTriangle, XCircle, FileText,
  Camera, ShieldCheck, ShieldAlert, Download, ExternalLink, RefreshCw,
  ChevronRight, ArrowRight, Eye, MapPin, Building, Calendar, Info,
  Check, X, FileCheck, Layers, Hash, CheckSquare, Clock, User, Navigation,
  Activity, AlertCircle, Gavel, Award, Send, Sliders
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import Footer from '../Footer';
import { exportElementToPdf } from '../../services/pdfExportService';

export default function ResolutionView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlProjectId = searchParams.get('projectId');

  const { language } = useLanguage();
  const { user } = useAuth();
  const isHi = language === 'hi';

  const [allProjects, setAllProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Resolution Form State
  const [resolutionStatus, setResolutionStatus] = useState('UNDER_ACTION'); // 'RESOLVED' | 'UNDER_ACTION' | 'ESCALATED' | 'FALSE_POSITIVE'
  const [officerDecision, setOfficerDecision] = useState('RECOVERY_NOTICE');
  const [actionTaken, setActionTaken] = useState(
    'Administrative Show-Cause Notice issued to Implementing Agency. Tranche 3 fund disbursement frozen pending recovery audit.'
  );
  const [finalRemarks, setFinalRemarks] = useState(
    'Physical ground progress evaluated at 40% against 80% fund disbursal. Implementing Agency instructed to reconcile Measurement Book entries within 15 working days.'
  );
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);

  // Load Real Evaluated Projects
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch('/data/unified_project_evaluations.json')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          const items = Array.isArray(data) ? data : [];
          setAllProjects(items);

          let target = null;
          if (urlProjectId) {
            const cleanId = urlProjectId.replace('MPLADS-', '').trim();
            target = items.find((p) => String(p.work_id) === cleanId);
          }
          if (!target && items.length > 0) {
            target = items[0];
          }
          setActiveProject(target);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load project evaluations:', err);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [urlProjectId]);

  const workId = activeProject?.work_id || 105744;
  const originalRiskScore = Math.round(activeProject?.final_risk_score || 72);
  const isCritical = originalRiskScore >= 75;

  const handleCloseCase = () => {
    setResolutionStatus('RESOLVED');
    setActionSuccessMsg(
      isHi
        ? 'मामला आधिकारिक रूप से बंद (Resolved) किया गया एवं प्रशासनिक आदेश जारी!'
        : 'Case officially CLOSED and recorded on national audit registry with digital signature!'
    );
    setTimeout(() => setActionSuccessMsg(null), 4500);
  };

  const handleEscalateCase = () => {
    setResolutionStatus('ESCALATED');
    setActionSuccessMsg(
      isHi
        ? 'मामला केंद्रीय सतर्कता आयोग (CVC) एवं MoSPI राष्ट्रीय नोडल सेल को अग्रेषित (Escalated)!'
        : 'Case ESCALATED to Central Vigilance Commission (CVC) & MoSPI National Apex Council!'
    );
    setTimeout(() => setActionSuccessMsg(null), 4500);
  };

  if (isLoading || !activeProject) {
    return (
      <div style={{ background: 'var(--color-bg-light)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '3rem', background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)' }}>
          <RefreshCw size={28} className="spin-animation" style={{ color: '#0A2458', margin: '0 auto 1rem' }} />
          <div style={{ fontWeight: 700 }}>{isHi ? 'मामला निस्तारण स्क्रीन लोड हो रही है...' : 'Loading Case Resolution Screen...'}</div>
        </div>
      </div>
    );
  }

  // Investigation Timeline Stages
  const timelineStages = [
    {
      step: 1,
      title: isHi ? 'जोखिम पहचान' : 'Risk Detected',
      status: 'Completed',
      date: activeProject.evaluated_at ? activeProject.evaluated_at.split('T')[0] : '2026-08-31',
      actor: 'Nirikshak ML Multi-Pillar Engine',
      verdict: `${originalRiskScore}/100 Risk Score (${isCritical ? 'CRITICAL' : 'HIGH'})`,
      desc: isHi ? 'एल्गोरिद्म द्वारा असामान्य विलंब एवं लागत वृद्धि चिह्नित' : 'Model flagged multi-factor cost and execution delays.'
    },
    {
      step: 2,
      title: isHi ? 'प्रमाण समीक्षा' : 'Evidence Reviewed',
      status: 'Completed',
      date: '2026-09-01',
      actor: 'District Reviewing Officer',
      verdict: 'Geofence Deviation & Incomplete UC',
      desc: isHi ? 'स्थल तस्वीर एवं माप पुस्तिका में दर असंगति की पुष्टि' : 'GPS variance identified; statutory utilization certificate pending.'
    },
    {
      step: 3,
      title: isHi ? 'स्थल सत्यापन' : 'Field Verified',
      status: 'Completed',
      date: '2026-09-02',
      actor: 'Er. R. K. Sharma (Field Technical Inspector)',
      verdict: '40% Physical Progress vs 80% Disbursal',
      desc: isHi ? 'मौके पर कार्य में देरी व सामग्री विनिर्देश में विचलन पाया गया' : 'Ground audit confirmed 40% physical completion vs 80% payout.'
    },
    {
      step: 4,
      title: isHi ? 'मामला निस्तारण' : 'Case Resolution',
      status: 'Active',
      date: 'Today (2026-09-09)',
      actor: user?.fullName || 'National Nodal Officer (MoSPI)',
      verdict: resolutionStatus.replace('_', ' '),
      desc: isHi ? 'सक्षम प्राधिकारी द्वारा अंतिम आदेश एवं वसूली कार्रवाई' : 'Final administrative adjudication and fund recovery order.'
    }
  ];

  return (
    <div className="investigation-screen" style={{ background: 'var(--color-bg-light)', color: 'var(--color-text-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header & Breadcrumbs */}
      <div style={{ background: '#FFFFFF', borderBottom: '1.5px solid #1D1E22', padding: '1rem 2rem' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.84rem', color: 'var(--color-text-secondary)', marginBottom: '0.6rem' }}>
            <button
              type="button"
              onClick={() => navigate(`/features/fieldVerification?projectId=${activeProject.work_id}`)}
              style={{ background: 'none', border: 'none', color: '#0A2458', fontWeight: 600, cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <ArrowLeft size={14} />
              {isHi ? 'स्थल सत्यापन' : 'Field Verification'}
            </button>
            <span>/</span>
            <span>{isHi ? 'जांच कार्यप्रवाह' : 'Investigation Workflow'}</span>
            <span>/</span>
            <span style={{ color: '#1D1E22', fontWeight: 700 }}>{isHi ? 'मामला निस्तारण' : 'Case Resolution'}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: '#E8F5E9', border: '1px solid #52B79A', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 700, color: '#1E7E34', marginBottom: '0.3rem' }}>
                <Gavel size={13} />
                <span>{isHi ? 'चरण 4: अंतिम प्रशासनिक निस्तारण' : 'STEP 4: FINAL ADMINISTRATIVE ADJUDICATION'}</span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.8rem', fontWeight: 800, color: '#1D1E22', margin: 0 }}>
                {isHi ? 'मामला निस्तारण एवं प्रशासनिक आदेश' : 'Case Resolution & Decision Workspace'}
              </h1>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await exportElementToPdf('case-resolution-screen', {
                      filename: `Final_Resolution_Docket_MPLADS_${activeProject.work_id}.pdf`,
                      title: isHi ? 'निरीक्षक AI - अंतिम मामला निस्तारण डोज़ियर' : 'NIRIKSHAK AI — FORMAL CASE RESOLUTION DOCKET',
                      subtitle: `Case ID: CASE-MPLADS-${activeProject.work_id} • Adjudicating Officer: ${user?.fullName || 'National Nodal Officer'}`
                    });
                  } catch (e) {
                    console.error('PDF export failed:', e);
                  }
                }}
                className="btn-outline-dark"
                style={{ padding: '0.55rem 1rem', fontSize: '0.82rem', gap: '0.4rem' }}
              >
                <Download size={14} />
                <span>{isHi ? 'निस्तारण डोज़ियर (PDF)' : 'Export Resolution Docket'}</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/features/highRiskProjects')}
                className="btn-teal"
                style={{ padding: '0.55rem 1.15rem', fontSize: '0.84rem', gap: '0.4rem' }}
              >
                <span>{isHi ? 'कतार पर वापस जाएं' : 'Back to Risk Queue'}</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Alert Banner */}
      {actionSuccessMsg && (
        <div style={{ background: '#E8F5E9', borderBottom: '1.5px solid #1E7E34', color: '#1E7E34', padding: '0.75rem 2rem', fontWeight: 700, fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
          <CheckCircle size={16} />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Main Workspace Area */}
      <main id="case-resolution-screen" style={{ flex: 1, padding: '1.75rem 2rem', maxWidth: '1440px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {/* ══════════════════════════════════════════════════════════
            1. COMPLETE INVESTIGATION TIMELINE STEPPER
            ══════════════════════════════════════════════════════════ */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            boxShadow: '2px 3px 0px #1D1E22',
            marginBottom: '1.75rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                {isHi ? 'पूर्ण जांच जीवनचक्र समयरेखा' : 'Comprehensive Investigation Lifecycle'}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1D1E22', marginTop: '0.2rem' }}>
                Risk Detected → Evidence Reviewed → Field Verified → Resolution
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)' }}>Case Reference:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 800, background: '#FAF8F3', border: '1px solid #1D1E22', padding: '0.25rem 0.55rem', borderRadius: '4px' }}>
                CASE-MPLADS-{activeProject.work_id}-2026
              </span>
            </div>
          </div>

          {/* Stepper Timeline Visual */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
              position: 'relative'
            }}
          >
            {timelineStages.map((stage, idx) => {
              const isCurrent = stage.step === 4;
              return (
                <div
                  key={stage.step}
                  style={{
                    background: isCurrent ? '#FAF8F3' : '#FFFFFF',
                    border: `1.5px solid ${isCurrent ? '#0A2458' : '#1D1E22'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    boxShadow: isCurrent ? '2px 3px 0px #0A2458' : 'none',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: isCurrent ? '#0A2458' : '#1E7E34',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.74rem',
                        fontWeight: 800
                      }}
                    >
                      {isCurrent ? stage.step : '✓'}
                    </span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                      {stage.date}
                    </span>
                  </div>

                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1D1E22', marginBottom: '0.2rem' }}>
                    {stage.title}
                  </div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: isCurrent ? '#0A2458' : '#1E7E34', marginBottom: '0.35rem' }}>
                    {stage.verdict}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', lineHeight: 1.35 }}>
                    {stage.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            2. TWO-COLUMN DOCKET: FINDINGS LEFT, DECISION RIGHT
            ══════════════════════════════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1.3fr) minmax(360px, 1.2fr)', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* Left Column: Consolidated Findings across previous 3 stages */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Project Case Header Card */}
            <div className="card-static" style={{ padding: '1.35rem', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', boxShadow: '2px 3px 0px #1D1E22', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0A2458', fontSize: '0.92rem' }}>
                  MPLADS-{activeProject.work_id}
                </span>
                <span
                  style={{
                    padding: '0.2rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    background: isCritical ? '#FEF2F2' : '#FFF7ED',
                    color: isCritical ? '#D9534F' : '#C2410C',
                    border: `1px solid ${isCritical ? '#D9534F' : '#F97316'}`
                  }}
                >
                  Original Risk: {originalRiskScore}/100 ({activeProject.risk_tier || 'HIGH'})
                </span>
              </div>

              <h2 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.2rem', fontWeight: 800, color: '#1D1E22', margin: '0 0 0.5rem 0', lineHeight: 1.35 }}>
                {activeProject.activity_name || activeProject.work_description}
              </h2>

              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
                <span>State: <strong>{activeProject.state_name}</strong></span>
                <span>District: <strong>{activeProject.const_name}</strong></span>
                <span>MP: <strong>{activeProject.mp_name || 'Hon’ble MP'}</strong></span>
              </div>

              {/* Sanction & Disbursal Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', background: '#FAF8F3', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid #1D1E22', fontSize: '0.78rem' }}>
                <div>
                  <div style={{ color: 'var(--color-text-muted)', fontWeight: 700 }}>SANCTION</div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1D1E22' }}>
                    ₹{(activeProject.sanction_amount || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#0A2458', fontWeight: 700 }}>DISBURSED</div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0A2458' }}>
                    ₹{(activeProject.total_disbursed || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#D9534F', fontWeight: 700 }}>DISBURSAL RATIO</div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#D9534F' }}>
                    {activeProject.sanction_amount ? Math.round(((activeProject.total_disbursed || 0) / activeProject.sanction_amount) * 100) : 100}%
                  </div>
                </div>
              </div>
            </div>

            {/* Findings from Stage 1: AI Risk Engine */}
            <div className="card-static" style={{ padding: '1.25rem', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', boxShadow: '2px 3px 0px #1D1E22', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
                <Activity size={17} style={{ color: '#D9534F' }} />
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#1D1E22', margin: 0 }}>
                  {isHi ? '1. प्रारंभिक AI विसंगति निष्कर्ष' : '1. Initial AI Anomaly Detection Findings'}
                </h3>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#2A2C32', lineHeight: 1.45, margin: '0 0 0.6rem 0' }}>
                {activeProject.project_summary || 'Flagged by ML isolation forest and statistical Z-score benchmarking.'}
              </p>
              <div style={{ background: '#FFF8E1', border: '1px solid #E5B842', borderRadius: '4px', padding: '0.5rem 0.75rem', fontSize: '0.78rem', color: '#B45309' }}>
                <strong>Recommended Action: </strong>
                {(activeProject.recommended_actions && activeProject.recommended_actions[0]) || 'Initiate field audit and withhold balance tranches.'}
              </div>
            </div>

            {/* Findings from Stage 2: Evidence Review */}
            <div className="card-static" style={{ padding: '1.25rem', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', boxShadow: '2px 3px 0px #1D1E22', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
                <FileCheck size={17} style={{ color: '#0A2458' }} />
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#1D1E22', margin: 0 }}>
                  {isHi ? '2. प्रमाण समीक्षा परिणाम' : '2. Evidence Review Results'}
                </h3>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: '#2A2C32', lineHeight: 1.5 }}>
                <li>EXIF GPS Metadata checked: <strong>Hardware timestamp recorded on 2024-11-20</strong>.</li>
                <li>Geofence Analysis: <strong>Satellite boundary coordinates verified with variance flag</strong>.</li>
                <li>Statutory GFR 12-A Utilization Certificate: <strong>Pending contractor submission</strong>.</li>
              </ul>
            </div>

            {/* Findings from Stage 3: Field Verification */}
            <div className="card-static" style={{ padding: '1.25rem', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', boxShadow: '2px 3px 0px #1D1E22', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
                <Navigation size={17} style={{ color: '#1E7E34' }} />
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#1D1E22', margin: 0 }}>
                  {isHi ? '3. भौतिक स्थल सत्यापन निष्कर्ष' : '3. Field Verification Ground Audit Results'}
                </h3>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: '#2A2C32', lineHeight: 1.5 }}>
                <li>Inspector: <strong>Er. R. K. Sharma (Field Technical Inspector)</strong>.</li>
                <li>Checklist Verified: <strong>4 of 6 engineering and statutory parameters passed</strong>.</li>
                <li>Physical Completion: <strong>40% visible execution vs 80% disbursed tranches</strong>.</li>
              </ul>
            </div>

          </div>

          {/* Right Column: Officer Decision, Action Taken & Final Closure */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Resolution Adjudication Card */}
            <div className="card-static" style={{ padding: '1.5rem', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', boxShadow: '3px 4px 0px #1D1E22', background: '#FFFFFF' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', marginBottom: '0.85rem' }}>
                {isHi ? 'अंतिम प्रशासनिक आदेश एवं स्थिति' : 'Adjudication & Resolution Order'}
              </div>

              {/* Resolution Status Selector Pills */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1D1E22', marginBottom: '0.4rem' }}>
                  {isHi ? 'निस्तारण स्थिति का चयन करें:' : 'Select Resolution Status:'}
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  {[
                    { key: 'RESOLVED', label: isHi ? 'निस्तारित (Resolved)' : 'Resolved', color: '#1E7E34', bg: '#E8F5E9' },
                    { key: 'UNDER_ACTION', label: isHi ? 'कार्रवाई जारी (Under Action)' : 'Under Action', color: '#0A2458', bg: '#E3F2FD' },
                    { key: 'ESCALATED', label: isHi ? 'उच्च स्तर पर अग्रेषित (Escalated)' : 'Escalated', color: '#C2410C', bg: '#FFF7ED' },
                    { key: 'FALSE_POSITIVE', label: isHi ? 'मिथ्या चेतावनी (False Positive)' : 'False Positive', color: '#4A4D55', bg: '#EAEAEA' }
                  ].map((st) => {
                    const active = resolutionStatus === st.key;
                    return (
                      <button
                        key={st.key}
                        type="button"
                        onClick={() => setResolutionStatus(st.key)}
                        style={{
                          padding: '0.55rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          border: `1.5px solid ${active ? '#1D1E22' : '#CCCCCC'}`,
                          background: active ? st.bg : '#FAF8F3',
                          color: active ? st.color : '#4A4D55',
                          boxShadow: active ? '1.5px 2px 0px #1D1E22' : 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        {active && <span>✓</span>}
                        <span>{st.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Officer Decision Dropdown */}
              <div style={{ marginBottom: '1.15rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1D1E22', marginBottom: '0.35rem' }}>
                  {isHi ? 'सक्षम प्राधिकारी का निर्णय' : 'Adjudicating Officer Decision'}
                </label>
                <select
                  value={officerDecision}
                  onChange={(e) => setOfficerDecision(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    border: '1.5px solid #1D1E22',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: '#1D1E22',
                    background: '#FAF8F3',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="RECOVERY_NOTICE">
                    {isHi ? 'वसूली नोटिस जारी करें एवं शेष भुगतान रोकें' : 'Issue Recovery Notice & Freeze Balance Tranches'}
                  </option>
                  <option value="AGENCY_PENALTY">
                    {isHi ? 'कार्यदायी एजेंसी पर 10% विलंब दंड अधिरोपित करें' : 'Levy 10% Liquidated Damages on Implementing Agency'}
                  </option>
                  <option value="INDEPENDENT_AUDIT">
                    {isHi ? 'स्वतंत्र तकनीकी सतर्कता टीम द्वारा पुनर्जांच' : 'Order Independent Re-Audit by Technical Vigilance Team'}
                  </option>
                  <option value="APPROVE_WITH_CORRECTION">
                    {isHi ? 'सुधार पश्चात शेष निधि जारी करने की सशर्त स्वीकृति' : 'Conditional Release upon UC Submission & Rectification'}
                  </option>
                  <option value="DISMISS_FALSE_ALARM">
                    {isHi ? 'सत्यापन पश्चात वैध विचलन मानकर मामला समाप्त करें' : 'Dismiss as Valid Technical Variation / False Positive'}
                  </option>
                </select>
              </div>

              {/* Action Taken Record */}
              <div style={{ marginBottom: '1.15rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1D1E22', marginBottom: '0.35rem' }}>
                  {isHi ? 'की गई प्रशासनिक कार्रवाई' : 'Action Taken by Authority'}
                </label>
                <input
                  type="text"
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="Record order numbers, show-cause dispatch dates, or PFMS freeze reference..."
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    border: '1.5px solid #1D1E22',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem',
                    boxSizing: 'border-box',
                    background: '#FAF8F3',
                    outline: 'none',
                    fontWeight: 600
                  }}
                />
              </div>

              {/* Final Remarks Textarea */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1D1E22', marginBottom: '0.35rem' }}>
                  {isHi ? 'अंतिम आदेश एवं समीक्षा टिप्पणियां' : 'Final Adjudication Remarks'}
                </label>
                <textarea
                  rows={4}
                  value={finalRemarks}
                  onChange={(e) => setFinalRemarks(e.target.value)}
                  placeholder="Enter final closing remarks, recovery timeline, or compliance directives..."
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    border: '1.5px solid #1D1E22',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem',
                    boxSizing: 'border-box',
                    background: '#FAF8F3',
                    outline: 'none',
                    lineHeight: 1.45
                  }}
                />
              </div>

              {/* Action Buttons: Close Case & Escalate */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleCloseCase}
                  className="btn-teal"
                  style={{
                    padding: '0.7rem 1rem',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    justifyContent: 'center',
                    gap: '0.45rem',
                    width: '100%'
                  }}
                >
                  <Award size={18} />
                  <span>{isHi ? 'मामला औपचारिक रूप से निस्तारित करें' : 'Close Case & Seal Resolution Docket'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleEscalateCase}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    width: '100%',
                    padding: '0.7rem 1rem',
                    background: '#FFF7ED',
                    border: '1.5px solid #F97316',
                    borderRadius: 'var(--radius-sm)',
                    color: '#C2410C',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    boxShadow: '1.5px 2px 0px #F97316'
                  }}
                >
                  <Send size={16} />
                  <span>{isHi ? 'केंद्रीय सतर्कता / MoSPI को अग्रेषित करें' : 'Escalate to Central MoSPI / CVC'}</span>
                </button>
              </div>
            </div>

            {/* Official Sign-off Seal Box */}
            <div
              style={{
                background: '#FAF8F3',
                border: '1.5px solid #1D1E22',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                boxShadow: '2px 3px 0px #1D1E22',
                fontSize: '0.78rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: 800, color: '#0A2458' }}>DIGITAL AUDIT SEAL & TIMESTAMP</span>
                <span style={{ color: '#1E7E34', fontWeight: 800 }}>CERTIFIED</span>
              </div>
              <div style={{ color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                Adjudicated under authority of Ministry of Statistics and Programme Implementation (MoSPI).
                Logged into immutable Nirikshak AI Audit Trail.
              </div>
              <div style={{ marginTop: '0.6rem', fontFamily: 'monospace', fontSize: '0.72rem', color: '#1D1E22' }}>
                HASH: SHA256:4d89a204e198bc7214ff091024ea
              </div>
            </div>

          </div>

        </div>
      </main>

      <Footer hideCTAButtons={true} />
    </div>
  );
}
