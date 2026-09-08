import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, Search, CheckCircle, AlertTriangle, XCircle, FileText,
  Camera, ShieldCheck, ShieldAlert, Download, ExternalLink, RefreshCw,
  ChevronRight, ArrowRight, Eye, MapPin, Building, Calendar, Info,
  Check, X, FileCheck, Layers, Hash, CheckSquare, Clock, User, Navigation,
  Activity, AlertCircle, Percent
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import Footer from '../Footer';
import { exportElementToPdf } from '../../services/pdfExportService';

export default function FieldVerificationView({ onNavigateToResolution }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlProjectId = searchParams.get('projectId');

  const { language } = useLanguage();
  const { user, token } = useAuth();
  const isHi = language === 'hi';

  const [allProjects, setAllProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Field Inspection State
  const [inspectionDate, setInspectionDate] = useState('2026-09-02');
  const [inspectorName, setInspectorName] = useState('Er. R. K. Sharma (Field Technical Inspector)');
  const [inspectorBadge, setInspectorBadge] = useState('INSP-MoSPI-8842');
  const [fieldObservations, setFieldObservations] = useState('');
  const [inspectionStatus, setInspectionStatus] = useState('IN_PROGRESS'); // 'IN_PROGRESS' | 'VERIFIED' | 'ISSUE_RAISED'
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);

  // Interactive Checklist
  const [checklist, setChecklist] = useState({
    foundation: true,
    structure: true,
    materials: false,
    utilization: false,
    safety: true,
    plaque: true
  });

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

          // Prepopulate observation if project has summary
          if (target?.project_summary) {
            setFieldObservations(
              `Ground Inspection Summary: ${target.project_summary}\nRecommended: ${
                (target.recommended_actions && target.recommended_actions[0]) || 'Verify material invoices and physical asset completion.'
              }`
            );
          }

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

  // Derived metrics
  const workId = activeProject?.work_id || 105744;
  const sanctionAmount = activeProject?.sanction_amount || 500000;
  const totalDisbursed = activeProject?.total_disbursed || 500000;
  const financialPct = sanctionAmount > 0 ? Math.min(100, Math.round((totalDisbursed / sanctionAmount) * 100)) : 0;
  const isAnomaly = activeProject?.is_anomaly || (activeProject?.final_risk_score || 0) > 50;

  // Actual physical progress (if anomaly, typically lagging behind financial expenditure)
  const actualPhysicalPct = activeProject?.work_status === 'Completed'
    ? (isAnomaly ? 62 : 100)
    : (isAnomaly ? 38 : 70);

  const progressLag = financialPct - actualPhysicalPct;

  const latNominal = (22.5 + (workId % 5) * 1.8).toFixed(4);
  const lngNominal = (80.2 + (workId % 7) * 1.2).toFixed(4);
  const latActual = isAnomaly ? (parseFloat(latNominal) + 0.042).toFixed(4) : latNominal;
  const lngActual = isAnomaly ? (parseFloat(lngNominal) + 0.038).toFixed(4) : lngNominal;
  const gpsVarianceMeters = isAnomaly ? 4850 : 18;

  const toggleChecklist = (key) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleMarkVerified = () => {
    setInspectionStatus('VERIFIED');
    setActionSuccessMsg(
      isHi
        ? 'भौतिक स्थल सत्यापन सफलतापूर्वक पूर्ण एवं सत्यापित चिन्हित किया गया!'
        : 'Physical field inspection verified and marked certified on MoSPI Nirikshak registry!'
    );

    // Try posting to live backend /api/inspections if available
    try {
      fetch('/api/inspections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          project_id: `MPLADS-${workId}`,
          status: 'completed',
          checklist_data: checklist,
          notes: fieldObservations
        })
      }).catch(() => {});
    } catch (e) {}

    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleRaiseIssue = () => {
    setInspectionStatus('ISSUE_RAISED');
    setActionSuccessMsg(
      isHi
        ? 'स्थल निरीक्षण में गंभीर विसंगति दर्ज की गई! मामला औपचारिक जांच एवं वसूली हेतु अनुशंसित।'
        : 'Ground deficiency raised! Inspection report logged for administrative penalty or recovery.'
    );
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleProceedToResolution = () => {
    if (activeProject) {
      if (onNavigateToResolution) {
        onNavigateToResolution(activeProject.work_id);
      } else {
        navigate(`/features/resolution?projectId=${activeProject.work_id}`);
      }
    }
  };

  if (isLoading || !activeProject) {
    return (
      <div style={{ background: 'var(--color-bg-light)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '3rem', background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)' }}>
          <RefreshCw size={28} className="spin-animation" style={{ color: '#0A2458', margin: '0 auto 1rem' }} />
          <div style={{ fontWeight: 700 }}>{isHi ? 'स्थल सत्यापन स्क्रीन लोड हो रही है...' : 'Loading Field Verification Workspace...'}</div>
        </div>
      </div>
    );
  }

  const checklistItems = [
    {
      key: 'foundation',
      labelEn: 'Foundation work matches approved structural specifications',
      labelHi: 'नींव का कार्य अनुमोदित संरचनात्मक विनिर्देशों से मेल खाता है',
      desc: 'Excavation depth, RCC grading, and load-bearing columns benchmarked.'
    },
    {
      key: 'structure',
      labelEn: 'Superstructure integrity & dimensional geometry verified',
      labelHi: 'ऊपरी संरचना की अखंडता एवं आयाम ज्यामिति सत्यापित',
      desc: 'Wall thickness, ceiling height, and lintel beam positioning.'
    },
    {
      key: 'materials',
      labelEn: 'Quality of construction materials matches CPWD/PWD standard',
      labelHi: 'निर्माण सामग्री की गुणवत्ता CPWD/PWD मानकों के अनुरूप',
      desc: 'Cement grade 53, TMT bars (FE 500D), and cured brickwork.'
    },
    {
      key: 'utilization',
      labelEn: 'Ground physical progress aligns with claimed fund disbursements',
      labelHi: 'जमीनी भौतिक प्रगति संवितरित निधि के समतुल्य है',
      desc: `Physical execution (${actualPhysicalPct}%) vs Disbursed fund tranches (${financialPct}%).`
    },
    {
      key: 'safety',
      labelEn: 'Public safety, drainage & accessibility guidelines implemented',
      labelHi: 'सार्वजनिक सुरक्षा, जल निकासी एवं सुगम्यता दिशानिर्देश लागू',
      desc: 'Adequate slope drainage, pedestrian ramps, and barrier safeguards.'
    },
    {
      key: 'plaque',
      labelEn: 'Statutory MPLADS permanent display plaque installed at asset',
      labelHi: 'परिसंपत्ति पर अनिवार्य एमपीलैड्स स्थायी सूचना पट्टिका स्थापित',
      desc: 'Plaque clearly states MP Name, Sanction Year, Cost, and MoSPI Logo.'
    }
  ];

  return (
    <div className="investigation-screen" style={{ background: 'var(--color-bg-light)', color: 'var(--color-text-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header & Breadcrumbs */}
      <div style={{ background: '#FFFFFF', borderBottom: '1.5px solid #1D1E22', padding: '1rem 2rem' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.84rem', color: 'var(--color-text-secondary)', marginBottom: '0.6rem' }}>
            <button
              type="button"
              onClick={() => navigate(`/features/evidenceReview?projectId=${activeProject.work_id}`)}
              style={{ background: 'none', border: 'none', color: '#0A2458', fontWeight: 600, cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <ArrowLeft size={14} />
              {isHi ? 'प्रमाण समीक्षा' : 'Evidence Review'}
            </button>
            <span>/</span>
            <span>{isHi ? 'जांच कार्यप्रवाह' : 'Investigation Workflow'}</span>
            <span>/</span>
            <span style={{ color: '#1D1E22', fontWeight: 700 }}>{isHi ? 'भौतिक स्थल सत्यापन' : 'Field Verification'}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: '#FEF3C7', border: '1px solid #F59E0B', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 700, color: '#B45309', marginBottom: '0.3rem' }}>
                <Navigation size={13} />
                <span>{isHi ? 'चरण 3: जमीनी भौतिक सत्यापन' : 'STEP 3: PHYSICAL GROUND INSPECTION'}</span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.8rem', fontWeight: 800, color: '#1D1E22', margin: 0 }}>
                {isHi ? 'भौतिक स्थल सत्यापन एवं जीपीएस जियोफेंस' : 'Field Verification & Ground Inspection'}
              </h1>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await exportElementToPdf('field-verification-screen', {
                      filename: `Field_Inspection_Report_MPLADS_${activeProject.work_id}.pdf`,
                      title: isHi ? 'भौतिक स्थल सत्यापन रिपोर्ट' : 'NIRIKSHAK AI — PHYSICAL FIELD VERIFICATION AUDIT REPORT',
                      subtitle: `Work ID: MPLADS-${activeProject.work_id} • Inspector: ${inspectorName}`
                    });
                  } catch (e) {
                    console.error('PDF export failed:', e);
                  }
                }}
                className="btn-outline-dark"
                style={{ padding: '0.55rem 1rem', fontSize: '0.82rem', gap: '0.4rem' }}
              >
                <Download size={14} />
                <span>{isHi ? 'निरीक्षण रिपोर्ट' : 'Export Inspection Report'}</span>
              </button>

              <button
                type="button"
                onClick={handleProceedToResolution}
                className="btn-teal"
                style={{ padding: '0.55rem 1.15rem', fontSize: '0.84rem', gap: '0.4rem' }}
              >
                <span>{isHi ? 'मामला निस्तारण पर जाएं' : 'Proceed to Resolution'}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {actionSuccessMsg && (
        <div style={{ background: '#E8F5E9', borderBottom: '1.5px solid #1E7E34', color: '#1E7E34', padding: '0.75rem 2rem', fontWeight: 700, fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
          <CheckCircle size={16} />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Main Workspace Area */}
      <main id="field-verification-screen" style={{ flex: 1, padding: '1.75rem 2rem', maxWidth: '1440px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {/* Top Info Banner: Location & Inspector Details */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.5rem',
            boxShadow: '2px 3px 0px #1D1E22',
            marginBottom: '1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
            alignItems: 'center'
          }}
        >
          {/* Project Details */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0A2458', fontSize: '0.9rem' }}>
                MPLADS-{activeProject.work_id}
              </span>
              <span style={{ background: '#EAEAEA', color: '#1D1E22', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                {activeProject.work_category || 'Infrastructure'}
              </span>
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1D1E22', lineHeight: 1.3, marginBottom: '0.35rem' }}>
              {activeProject.activity_name || activeProject.work_description}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={14} style={{ color: '#D9534F' }} />
              <span><strong>{activeProject.const_name}</strong>, {activeProject.state_name}</span>
            </div>
          </div>

          {/* Inspector Badge Details */}
          <div style={{ background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '0.85rem 1.1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                {isHi ? 'सत्यापन अधिकारी' : 'Designated Inspector'}
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700, background: '#1D1E22', color: '#FFFFFF', padding: '0.15rem 0.4rem', borderRadius: '3px' }}>
                {inspectorBadge}
              </span>
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1D1E22' }}>
              {inspectorName}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem', display: 'flex', gap: '0.75rem' }}>
              <span>Date: <strong>{inspectionDate}</strong></span>
              <span>Unit: <strong>MoSPI QA Division</strong></span>
            </div>
          </div>

          {/* Status Pillar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              {isHi ? 'स्थल सत्यापन स्थिति' : 'Inspection Verdict'}
            </span>
            <span
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: 800,
                background: inspectionStatus === 'VERIFIED' ? '#E8F5E9' : inspectionStatus === 'ISSUE_RAISED' ? '#FEF2F2' : '#FFF3E0',
                color: inspectionStatus === 'VERIFIED' ? '#1E7E34' : inspectionStatus === 'ISSUE_RAISED' ? '#D9534F' : '#B8860B',
                border: `1.5px solid ${inspectionStatus === 'VERIFIED' ? '#52B79A' : inspectionStatus === 'ISSUE_RAISED' ? '#D9534F' : '#F59E0B'}`
              }}
            >
              {inspectionStatus === 'VERIFIED'
                ? (isHi ? 'सत्यापित एवं प्रमाणित' : 'GROUND CERTIFIED')
                : inspectionStatus === 'ISSUE_RAISED'
                ? (isHi ? 'गंभीर विसंगति दर्ज' : 'DISCREPANCY FLAGGED')
                : (isHi ? 'निरीक्षण प्रगति पर' : 'UNDER INSPECTION')}
            </span>
          </div>
        </div>

        {/* 2-Column Grid: Progress & GPS Left, Checklist & Remarks Right */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1.4fr) minmax(360px, 1.2fr)', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* ══════════════════════════════════════════════════════════
              LEFT COLUMN: PROGRESS COMPARISON, GPS & PHOTOS
              ══════════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* 1. Expected vs Actual Progress Comparison Card */}
            <div className="card-static" style={{ padding: '1.4rem', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', boxShadow: '2px 3px 0px #1D1E22', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Activity size={18} style={{ color: '#0A2458' }} />
                  <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.15rem', color: '#1D1E22', margin: 0 }}>
                    {isHi ? 'अपेक्षित बनाम वास्तविक भौतिक प्रगति' : 'Expected vs Actual Progress Matrix'}
                  </h3>
                </div>

                {progressLag > 15 && (
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, background: '#FEF2F2', color: '#D9534F', border: '1px solid #D9534F', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)' }}>
                    {isHi ? `प्रगति में -${progressLag}% का अंतर` : `Lagging by -${progressLag}%`}
                  </span>
                )}
              </div>

              {/* Side-by-side Progress Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
                {/* Financial Tranche Disbursed */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    <span style={{ color: '#0A2458' }}>
                      {isHi ? 'संवितरित वित्तीय निधि (सरकारी कोष से)' : 'Claimed Financial Disbursement (Treasury)'}
                    </span>
                    <strong style={{ fontSize: '0.92rem' }}>{financialPct}% (₹{totalDisbursed.toLocaleString('en-IN')})</strong>
                  </div>
                  <div style={{ height: '10px', background: '#EAEAEA', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${financialPct}%`, height: '100%', background: '#0A2458', borderRadius: '5px' }} />
                  </div>
                </div>

                {/* Verified Ground Completion */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    <span style={{ color: actualPhysicalPct < financialPct ? '#D9534F' : '#1E7E34' }}>
                      {isHi ? 'वास्तविक जमीनी भौतिक पूर्णता (निरीक्षक द्वारा मूल्यांकित)' : 'Actual Physical Execution (Ground Inspector)'}
                    </span>
                    <strong style={{ fontSize: '0.92rem', color: actualPhysicalPct < financialPct ? '#D9534F' : '#1E7E34' }}>
                      {actualPhysicalPct}%
                    </strong>
                  </div>
                  <div style={{ height: '10px', background: '#EAEAEA', borderRadius: '5px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${actualPhysicalPct}%`,
                        height: '100%',
                        background: actualPhysicalPct < financialPct ? '#D9534F' : '#1E7E34',
                        borderRadius: '5px'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Progress Milestones Matrix */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', background: '#FAF8F3', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid #1D1E22', fontSize: '0.78rem' }}>
                <div>
                  <div style={{ color: 'var(--color-text-muted)', fontWeight: 700 }}>SANCTION STAGE</div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1D1E22', marginTop: '0.2rem' }}>
                    {activeProject.sanction_date ? activeProject.sanction_date.split('T')[0] : '12 Mar 2024'}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--color-text-muted)', fontWeight: 700 }}>TARGET FINISH</div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1D1E22', marginTop: '0.2rem' }}>
                    {activeProject.actual_end_date ? activeProject.actual_end_date.split('T')[0] : '15 Oct 2024'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#D9534F', fontWeight: 700 }}>COMPLETION OVERDUE</div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#D9534F', marginTop: '0.2rem' }}>
                    +{activeProject.completion_delay_days || 180} {isHi ? 'दिन' : 'Days'}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. GPS & Location Geofence Analysis */}
            <div className="card-static" style={{ padding: '1.4rem', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', boxShadow: '2px 3px 0px #1D1E22', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Navigation size={18} style={{ color: '#D9534F' }} />
                  <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.15rem', color: '#1D1E22', margin: 0 }}>
                    {isHi ? 'जीपीएस एवं जियोफेंस सत्यापन' : 'GPS Location & Geofence Compliance'}
                  </h3>
                </div>

                <span
                  style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    background: gpsVarianceMeters > 500 ? '#FEF2F2' : '#E8F5E9',
                    color: gpsVarianceMeters > 500 ? '#D9534F' : '#1E7E34',
                    border: `1px solid ${gpsVarianceMeters > 500 ? '#D9534F' : '#52B79A'}`
                  }}
                >
                  {gpsVarianceMeters > 500 ? 'GEOFENCE BREACH' : 'GEOFENCE IN-BOUNDS'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
                <div style={{ background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    {isHi ? 'स्वीकृत परिसंपत्ति स्थान (दस्तावेज)' : 'Nominal Asset Target Site'}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.86rem', color: '#1D1E22', marginTop: '0.2rem' }}>
                    {latNominal}° N, {lngNominal}° E
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>
                    Constituency: {activeProject.const_name}
                  </div>
                </div>

                <div style={{ background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    {isHi ? 'निरीक्षक डिवाइस कैप्चर (हार्डवेयर)' : 'Inspector Terminal Hardware Capture'}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.86rem', color: '#0A2458', marginTop: '0.2rem' }}>
                    {latActual}° N, {lngActual}° E
                  </div>
                  <div style={{ fontSize: '0.72rem', color: gpsVarianceMeters > 500 ? '#D9534F' : '#1E7E34', fontWeight: 700, marginTop: '0.15rem' }}>
                    Variance: Δ {gpsVarianceMeters > 1000 ? `${(gpsVarianceMeters / 1000).toFixed(2)} km` : `${gpsVarianceMeters} m`}
                  </div>
                </div>
              </div>

              {/* Visual Satellite Geofence Crosshair Box */}
              <div
                style={{
                  background: '#1D1E22',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: '2px solid #52B79A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(82, 183, 154, 0.15)'
                    }}
                  >
                    <MapPin size={20} style={{ color: '#52B79A' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 800 }}>NavIC & GPS Satellite Constellation Lock</div>
                    <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>14 Space Vehicles (SVs) Locked • Accuracy ±2.8m</div>
                  </div>
                </div>

                <div style={{ fontSize: '0.76rem', background: 'rgba(255,255,255,0.1)', padding: '0.35rem 0.75rem', borderRadius: '4px', fontFamily: 'monospace' }}>
                  ELEVATION: 542m MSL
                </div>
              </div>
            </div>

            {/* 3. Site Photographs Gallery */}
            <div className="card-static" style={{ padding: '1.4rem', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', boxShadow: '2px 3px 0px #1D1E22', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Camera size={18} style={{ color: '#1E7E34' }} />
                  <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.15rem', color: '#1D1E22', margin: 0 }}>
                    {isHi ? 'मौके की फोटोग्राफिक जांच' : 'Ground Inspection Site Photographs'}
                  </h3>
                </div>
                <span style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)' }}>
                  3 Photos Uploaded • Signed by Inspector
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                {[
                  { tag: 'Pre-Construction', desc: 'Baseline clearing & trenching', time: '15 Mar 2024' },
                  { tag: 'Mid-Stage Structure', desc: 'Column reinforcement check', time: '22 Aug 2024' },
                  { tag: 'Current Ground Status', desc: 'Current unpaved / delayed progress', time: '02 Sep 2026' }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: '1.5px solid #1D1E22',
                      borderRadius: 'var(--radius-sm)',
                      background: '#FAF8F3',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <div
                      style={{
                        height: '100px',
                        background: '#EAEAEA',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                      }}
                    >
                      <Camera size={28} style={{ color: '#4A4D55' }} />
                      <span
                        style={{
                          position: 'absolute',
                          top: '0.35rem',
                          left: '0.35rem',
                          background: 'rgba(29,30,34,0.85)',
                          color: '#FFFFFF',
                          fontSize: '0.64rem',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '2px',
                          fontWeight: 700
                        }}
                      >
                        {item.tag}
                      </span>
                    </div>
                    <div style={{ padding: '0.55rem', fontSize: '0.74rem' }}>
                      <div style={{ fontWeight: 700, color: '#1D1E22' }}>{item.desc}</div>
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.68rem', marginTop: '0.2rem' }}>
                        {item.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ══════════════════════════════════════════════════════════
              RIGHT COLUMN: CHECKLIST, REMARKS & FINAL ACTIONS
              ══════════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Inspection Checklist Card */}
            <div className="card-static" style={{ padding: '1.4rem', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', boxShadow: '2px 3px 0px #1D1E22', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <CheckSquare size={18} style={{ color: '#0A2458' }} />
                  <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.15rem', color: '#1D1E22', margin: 0 }}>
                    {isHi ? 'भौतिक सत्यापन चेकलिस्ट' : 'Physical Verification Checklist'}
                  </h3>
                </div>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0A2458', background: '#E3F2FD', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                  {Object.values(checklist).filter(Boolean).length} / {checklistItems.length} Verified
                </span>
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '0 0 1rem 0' }}>
                {isHi
                  ? 'प्रत्येक मद का स्थलीय परीक्षण कर चेकलिस्ट को सत्यापित या विसंगत चिन्हित करें:'
                  : 'Toggle verification status for each engineering and compliance standard:'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {checklistItems.map((item) => {
                  const isChecked = Boolean(checklist[item.key]);
                  return (
                    <div
                      key={item.key}
                      onClick={() => toggleChecklist(item.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        padding: '0.75rem 0.85rem',
                        border: '1.5px solid #1D1E22',
                        borderRadius: 'var(--radius-md)',
                        background: isChecked ? '#FAF8F3' : '#FEF2F2',
                        cursor: 'pointer'
                      }}
                    >
                      <div
                        style={{
                          marginTop: '0.15rem',
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          border: `1.5px solid ${isChecked ? '#1E7E34' : '#D9534F'}`,
                          background: isChecked ? '#1E7E34' : '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {isChecked ? <Check size={14} style={{ color: '#FFFFFF' }} /> : <X size={14} style={{ color: '#D9534F' }} />}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1D1E22', lineHeight: 1.3 }}>
                          {isHi ? item.labelHi : item.labelEn}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                          {item.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Field Observations & Remarks Card */}
            <div className="card-static" style={{ padding: '1.4rem', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', boxShadow: '2px 3px 0px #1D1E22', background: '#FFFFFF' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#1D1E22', marginBottom: '0.4rem' }}>
                {isHi ? 'क्षेत्र निरीक्षक की तकनीकी टिप्पणियां' : 'Field Inspector Technical Observations'}
              </label>

              <textarea
                rows={5}
                value={fieldObservations}
                onChange={(e) => setFieldObservations(e.target.value)}
                placeholder={
                  isHi
                    ? 'स्थल पर पाई गई सामग्री, ठेकेदार की उपस्थिति, गुणवत्ता संबंधी कमियां या सिफारिशें यहाँ दर्ज करें...'
                    : 'Enter physical site observations, material quality defects, contractor discrepancies, or sanction recovery recommendations...'
                }
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1.5px solid #1D1E22',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  boxSizing: 'border-box',
                  outline: 'none',
                  background: '#FAF8F3',
                  marginBottom: '1rem',
                  fontFamily: 'var(--font-sans)',
                  lineHeight: 1.45
                }}
              />

              {/* Action Buttons: Mark Verified / Raise Issue */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleMarkVerified}
                  className="btn-teal"
                  style={{
                    padding: '0.7rem 1rem',
                    fontSize: '0.86rem',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    width: '100%'
                  }}
                >
                  <CheckCircle size={17} />
                  <span>{isHi ? 'स्थल सत्यापन प्रमाणित करें' : 'Mark Verified & Certify Field Audit'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRaiseIssue}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    width: '100%',
                    padding: '0.7rem 1rem',
                    background: '#FEF2F2',
                    border: '1.5px solid #D9534F',
                    borderRadius: 'var(--radius-sm)',
                    color: '#D9534F',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    boxShadow: '1.5px 2px 0px #D9534F'
                  }}
                >
                  <AlertTriangle size={17} />
                  <span>{isHi ? 'जमीनी विसंगति दर्ज करें (मुद्दा उठाएं)' : 'Raise Issue & Flag Ground Deficiency'}</span>
                </button>
              </div>
            </div>

            {/* Next Step Card */}
            <div
              style={{
                background: '#FAF8F3',
                border: '1.5px solid #1D1E22',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                boxShadow: '2px 3px 0px #1D1E22'
              }}
            >
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                {isHi ? 'अंतिम जांच चरण' : 'Final Step in Workflow'}
              </div>
              <h4 style={{ margin: '0.3rem 0 0.5rem 0', fontSize: '0.96rem', fontWeight: 800, color: '#1D1E22' }}>
                {isHi ? 'प्रशासनिक मामला निस्तारण' : 'Case Resolution & Administrative Order'}
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.45, margin: '0 0 0.85rem 0' }}>
                {isHi
                  ? 'भौतिक सत्यापन पश्चात सक्षम प्राधिकारी द्वारा वसूली, जुर्माना, कार्य निरस्तीकरण या दोषमुक्ति का अंतिम निर्णय लिया जाता है।'
                  : 'Compile inspection findings, issue administrative sanction recovery orders, or formal case closure docket.'}
              </p>

              <button
                type="button"
                onClick={handleProceedToResolution}
                className="btn-outline-dark"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '0.65rem 1rem',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  gap: '0.4rem'
                }}
              >
                <span>{isHi ? 'चरण 4: मामला निस्तारण' : 'Proceed to Case Resolution'}</span>
                <ArrowRight size={15} />
              </button>
            </div>

          </div>

        </div>
      </main>

      <Footer hideCTAButtons={true} />
    </div>
  );
}
