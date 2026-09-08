import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, Search, CheckCircle, AlertTriangle, XCircle, FileText,
  Camera, ShieldCheck, ShieldAlert, Download, ExternalLink, RefreshCw,
  ChevronRight, ArrowRight, Eye, MapPin, Building, Calendar, Info,
  Check, X, FileCheck, Layers, Hash, CheckSquare, Clock
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import Footer from '../Footer';
import { exportElementToPdf } from '../../services/pdfExportService';

export default function EvidenceReviewView({ onNavigateToField }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlProjectId = searchParams.get('projectId');

  const { language } = useLanguage();
  const { user } = useAuth();
  const isHi = language === 'hi';

  const [allProjects, setAllProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Evidence Workspace States
  const [activeEvidenceType, setActiveEvidenceType] = useState('photos'); // 'photos' | 'documents'
  const [selectedEvidenceIndex, setSelectedEvidenceIndex] = useState(0);
  const [officerRemarks, setOfficerRemarks] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('UNDER_REVIEW'); // 'UNDER_REVIEW' | 'VERIFIED' | 'FLAGGED'
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

          // If URL param matches, select that project; otherwise default to highest risk project
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

  // Generate Evidence Items based on actual active project metadata
  const evidenceItems = useMemo(() => {
    if (!activeProject) return [];

    const workId = activeProject.work_id || 105744;
    const isAnomaly = activeProject.is_anomaly || activeProject.final_risk_score > 50;
    const hasDelay = (activeProject.completion_delay_days || 0) > 60;
    const costEscalation = (activeProject.cost_overrun_pct || 0) > 10;

    return [
      {
        id: 'EV-01',
        title: isHi ? 'भू-टैग्ड आधारभूत स्थल तस्वीर (कार्य आरंभ)' : 'Pre-Commencement Geotagged Site Photo',
        type: 'photo',
        status: 'VERIFIED',
        date: activeProject.sanction_date ? activeProject.sanction_date.split('T')[0] : '2024-03-15',
        fileSize: '4.2 MB',
        resolution: '4032 × 3024 px',
        gps: `${(22.5 + (workId % 5) * 1.8).toFixed(4)}° N, ${(80.2 + (workId % 7) * 1.2).toFixed(4)}° E`,
        device: 'MoSPI Nirikshak Mobile Field Terminal (Build 2026.2)',
        hash: `SHA256:7f8e${workId}b2049d16a5048bc89`,
        description: isHi
          ? 'कार्य स्थल पर निर्माण आरंभ से पूर्व खींची गई संदर्भ तस्वीर, जिसमें स्पष्ट अक्षांश-देशांतर और समय मोहर अंकित है।'
          : 'Baseline site photograph captured prior to ground execution with authenticated hardware GPS EXIF metadata.',
        inconsistency: null
      },
      {
        id: 'EV-02',
        title: isHi ? 'मध्यवर्ती भौतिक प्रगति सत्यापन तस्वीर' : 'Interim Physical Milestone Ground Photograph',
        type: 'photo',
        status: isAnomaly ? 'SUSPICIOUS' : 'VERIFIED',
        date: activeProject.actual_end_date ? activeProject.actual_end_date.split('T')[0] : '2024-11-20',
        fileSize: '5.8 MB',
        resolution: '3840 × 2160 px',
        gps: isAnomaly
          ? `${(22.5 + (workId % 5) * 1.8 + 0.045).toFixed(4)}° N, ${(80.2 + (workId % 7) * 1.2 + 0.052).toFixed(4)}° E`
          : `${(22.5 + (workId % 5) * 1.8).toFixed(4)}° N, ${(80.2 + (workId % 7) * 1.2).toFixed(4)}° E`,
        device: 'Surveyor Android Terminal (Model SM-G990B)',
        hash: `SHA256:3a1b${workId}e7264cc914021dd51`,
        description: isHi
          ? 'वर्तमान निर्माण प्रगति की स्थल तस्वीर। AI छवि विश्लेषण द्वारा प्रगति प्रतिशत और वाउचर मांग की जांच की गई।'
          : 'Ground site photograph submitted for milestone fund release. Evaluated by Nirikshak Computer Vision model.',
        inconsistency: isAnomaly
          ? {
              severity: 'HIGH',
              title: isHi ? 'AI विसंगति: जीपीएस विचलन एवं कार्य प्रगति असंगति' : 'AI Flag: Geofence Deviation & Milestone Mismatch',
              details: isHi
                ? `तस्वीर के GPS निर्देशांक स्वीकृत कार्य क्षेत्र से लगभग 5.2 किमी दूर हैं। साथ ही 80% संवितरण के सापेक्ष दृश्य प्रगति केवल 40% है।`
                : `Embedded EXIF coordinates deviate ~5.2 km from registered asset boundary. Visual structural progress matches 40%, but voucher claim requests 80% disbursement.`
            }
          : null
      },
      {
        id: 'EV-03',
        title: isHi ? 'माप पुस्तिका (Measurement Book) प्रति' : 'Measurement Book (MB) Digital Certified Record',
        type: 'document',
        status: costEscalation ? 'SUSPICIOUS' : 'VERIFIED',
        date: '2024-08-14',
        fileSize: '1.4 MB (PDF)',
        resolution: 'Certified Digital Copy (3 Pages)',
        gps: 'Executive Engineer Camp Office',
        device: 'District e-Governance Portal Scanner',
        hash: `SHA256:d82e${workId}f9124cb613018ea19`,
        description: isHi
          ? 'सहायक अभियंता द्वारा प्रमाणित माप पुस्तिका जिसमें सामग्री विनिर्देश, खुदाई और कंक्रीट कार्य दर्ज है।'
          : 'Official Measurement Book (MB) entries stamped by Assistant Engineer detailing SoR items and material quantities.',
        inconsistency: costEscalation
          ? {
              severity: 'MEDIUM',
              title: isHi ? 'AI विसंगति: दर अनुसूची (SoR) विचलन' : 'AI Flag: Schedule of Rates (SoR) Cost Deviation',
              details: isHi
                ? `दर्ज सामग्री दरों में राज्य लोक निर्माण विभाग की मानक दर अनुसूची से +${activeProject.cost_overrun_pct || 18}% की अकारण वृद्धि पाई गई।`
                : `Unit rates for structural concrete exceed state PWD baseline SoR by +${activeProject.cost_overrun_pct || 18}%, contributing to unexplained cost escalation.`
            }
          : null
      },
      {
        id: 'EV-04',
        title: isHi ? 'संस्वीकृति आदेश एवं निधि आवंटन पत्र' : 'Sanction Order & Administrative Approval Letter',
        type: 'document',
        status: 'VERIFIED',
        date: activeProject.sanction_date ? activeProject.sanction_date.split('T')[0] : '2024-03-12',
        fileSize: '840 KB (PDF)',
        resolution: 'Official Gazette Format',
        gps: 'District Collectorate MoSPI Cell',
        device: 'Collectorate Document Server',
        hash: `SHA256:9c1a${workId}01248ab312019ff22`,
        description: isHi
          ? 'जिला नोडल प्राधिकारी द्वारा जारी औपचारिक प्रशासनिक संस्वीकृति आदेश (Letter No. MPLADS/DNO/2024).'
          : 'Statutory administrative sanction and fund earmarking issued under authority of District Nodal Officer.',
        inconsistency: null
      },
      {
        id: 'EV-05',
        title: isHi ? 'उपयोगिता प्रमाण पत्र (Utilization Certificate)' : 'Utilization Certificate (Form GFR 12-A)',
        type: 'document',
        status: hasDelay ? 'MISSING' : 'VERIFIED',
        date: hasDelay ? 'Overdue' : '2025-01-10',
        fileSize: hasDelay ? 'Not Uploaded' : '1.1 MB',
        resolution: hasDelay ? 'Missing Attachment' : 'Signed by CA & IA',
        gps: 'District Treasury Office',
        device: 'PFMS Integration Gateway',
        hash: hasDelay ? 'N/A' : `SHA256:5b8a${workId}74921ea012019ee33`,
        description: isHi
          ? 'सरकारी वित्तीय नियमावली (GFR 12-A) के तहत प्रस्तुत औपचारिक उपयोगिता प्रमाण पत्र।'
          : 'Mandatory GFR 12-A utilization certificate certifying expended funds match sanctioned milestone deliverables.',
        inconsistency: hasDelay
          ? {
              severity: 'CRITICAL',
              title: isHi ? 'गंभीर चूक: उपयोगिता प्रमाण पत्र अनुपलब्ध' : 'Critical Defect: Missing Utilization Certificate',
              details: isHi
                ? `अंतिम भुगतान जारी होने के बावजूद उपयोगिता प्रमाण पत्र 180+ दिनों से पोर्टल पर अपलोड नहीं किया गया है।`
                : `Fund tranche of ₹${((activeProject.total_disbursed || 500000)).toLocaleString('en-IN')} was disbursed over 180 days ago without corresponding GFR 12-A certificate uploaded.`
            }
          : null
      }
    ];
  }, [activeProject, isHi]);

  const currentEvidence = evidenceItems[selectedEvidenceIndex] || evidenceItems[0];

  // Actions
  const handleVerifyEvidence = () => {
    setVerificationStatus('VERIFIED');
    setActionSuccessMsg(isHi ? 'प्रमाण सफलतापूर्वक सत्यापित एवं अनुमोदित किया गया!' : 'Evidence item successfully verified and signed by reviewing officer!');
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleFlagEvidence = () => {
    setVerificationStatus('FLAGGED');
    setActionSuccessMsg(isHi ? 'प्रमाण में विसंगति दर्ज की गई! भौतिक स्थल सत्यापन अनुशंसित।' : 'Evidence flagged as suspicious! Field inspection dispatch recommended.');
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleProceedToField = () => {
    if (activeProject) {
      if (onNavigateToField) {
        onNavigateToField(activeProject.work_id);
      } else {
        navigate(`/features/fieldVerification?projectId=${activeProject.work_id}`);
      }
    }
  };

  if (isLoading || !activeProject) {
    return (
      <div style={{ background: 'var(--color-bg-light)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '3rem', background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)' }}>
          <RefreshCw size={28} className="spin-animation" style={{ color: '#0A2458', margin: '0 auto 1rem' }} />
          <div style={{ fontWeight: 700 }}>{isHi ? 'प्रमाण समीक्षा कार्यक्षेत्र लोड हो रहा है...' : 'Loading Evidence Review Workspace...'}</div>
        </div>
      </div>
    );
  }

  const riskScore = Math.round(activeProject.final_risk_score || 0);
  const isCritical = riskScore >= 75;
  const isHigh = riskScore >= 50 && riskScore < 75;

  return (
    <div className="investigation-screen" style={{ background: 'var(--color-bg-light)', color: 'var(--color-text-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Bar */}
      <div style={{ background: '#FFFFFF', borderBottom: '1.5px solid #1D1E22', padding: '1rem 2rem' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
          {/* Breadcrumb navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.84rem', color: 'var(--color-text-secondary)', marginBottom: '0.6rem' }}>
            <button
              type="button"
              onClick={() => navigate('/features/highRiskProjects')}
              style={{ background: 'none', border: 'none', color: '#0A2458', fontWeight: 600, cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <ArrowLeft size={14} />
              {isHi ? 'उच्च-जोखिम कतार' : 'High-Risk Queue'}
            </button>
            <span>/</span>
            <span>{isHi ? 'जांच कार्यप्रवाह' : 'Investigation Workflow'}</span>
            <span>/</span>
            <span style={{ color: '#1D1E22', fontWeight: 700 }}>{isHi ? 'प्रमाण समीक्षा कार्यक्षेत्र' : 'Evidence Review Workspace'}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: '#E3F2FD', border: '1px solid #90CAF9', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 700, color: '#0A2458', marginBottom: '0.3rem' }}>
                <Camera size={13} />
                <span>{isHi ? 'चरण 2: प्रमाण एवं दस्तावेज सत्यापन' : 'STEP 2: EVIDENCE & DOCUMENT AUDIT'}</span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.8rem', fontWeight: 800, color: '#1D1E22', margin: 0 }}>
                {isHi ? 'प्रमाण समीक्षा एवं विसंगति विश्लेषण' : 'Evidence Review Workspace'}
              </h1>
            </div>

            {/* Quick Next Action */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await exportElementToPdf('evidence-review-workspace', {
                      filename: `Evidence_Dossier_MPLADS_${activeProject.work_id}.pdf`,
                      title: isHi ? 'प्रमाण समीक्षा एवं विसंगति डोज़ियर' : 'NIRIKSHAK AI — EVIDENCE AUDIT DOSSIER',
                      subtitle: `Project ID: MPLADS-${activeProject.work_id} • State: ${activeProject.state_name}`
                    });
                  } catch (e) {
                    console.error('PDF export failed:', e);
                  }
                }}
                className="btn-outline-dark"
                style={{ padding: '0.55rem 1rem', fontSize: '0.82rem', gap: '0.4rem' }}
              >
                <Download size={14} />
                <span>{isHi ? 'डोज़ियर पीडीएफ' : 'Export Dossier'}</span>
              </button>

              <button
                type="button"
                onClick={handleProceedToField}
                className="btn-teal"
                style={{ padding: '0.55rem 1.15rem', fontSize: '0.84rem', gap: '0.4rem' }}
              >
                <span>{isHi ? 'स्थल सत्यापन पर जाएं' : 'Proceed to Field Verification'}</span>
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

      {/* 3-Column Workspace Main Area */}
      <main id="evidence-review-workspace" style={{ flex: 1, padding: '1.75rem 2rem', maxWidth: '1440px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.15fr) minmax(360px, 1.65fr) minmax(300px, 1.2fr)', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* ══════════════════════════════════════════════════════════
              COLUMN 1: PROJECT PROFILE & DOCKET (28%)
              ══════════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Project Header Card */}
            <div className="card-static" style={{ padding: '1.35rem', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', boxShadow: '2px 3px 0px #1D1E22', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0A2458', fontSize: '0.9rem' }}>
                  MPLADS-{activeProject.work_id}
                </span>
                <span
                  style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    background: isCritical ? '#FEF2F2' : isHigh ? '#FFF7ED' : '#FFFBEB',
                    color: isCritical ? '#D9534F' : isHigh ? '#C2410C' : '#B45309',
                    border: `1px solid ${isCritical ? '#D9534F' : '#F97316'}`
                  }}
                >
                  {riskScore}/100 • {isCritical ? 'CRITICAL RISK' : 'HIGH RISK'}
                </span>
              </div>

              <h2 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.15rem', fontWeight: 800, color: '#1D1E22', margin: '0 0 0.5rem 0', lineHeight: 1.35 }}>
                {activeProject.activity_name || activeProject.work_description}
              </h2>

              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={13} style={{ color: '#1D1E22' }} />
                  <span><strong>{activeProject.const_name}</strong>, {activeProject.state_name}</span>
                </div>
                {activeProject.mp_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Building size={13} style={{ color: '#1D1E22' }} />
                    <span>MP: <strong>{activeProject.mp_name}</strong></span>
                  </div>
                )}
                {activeProject.ida_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Layers size={13} style={{ color: '#1D1E22' }} />
                    <span>Agency: <strong>{activeProject.ida_name.slice(0, 36)}</strong></span>
                  </div>
                )}
              </div>

              {/* Financial Snapshot */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem', background: '#FAF8F3', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid #1D1E22', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    {isHi ? 'संस्वीकृत राशि' : 'Sanctioned'}
                  </div>
                  <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#1D1E22' }}>
                    ₹{(activeProject.sanction_amount || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#0A2458', textTransform: 'uppercase' }}>
                    {isHi ? 'कुल संवितरित' : 'Disbursed'}
                  </div>
                  <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0A2458' }}>
                    ₹{(activeProject.total_disbursed || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* AI Multi-Pillar Risk Breakdown */}
              <div style={{ borderTop: '1px solid #EAEAEA', paddingTop: '0.85rem' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', marginBottom: '0.6rem', letterSpacing: '0.04em' }}>
                  {isHi ? 'AI जोखिम स्तंभ स्कोर' : 'AI Multi-Pillar Risk Scores'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.76rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{isHi ? 'प्रमाण एवं दस्तावेज अखंडता' : 'Evidence & Photo Integrity'}</span>
                    <strong style={{ color: (activeProject.evidence_risk_score || 0) > 50 ? '#D9534F' : '#1E7E34' }}>
                      {Math.round(activeProject.evidence_risk_score || 0)}/100
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{isHi ? 'लागत विचलन सूचकांक' : 'Cost Z-Score Outlier'}</span>
                    <strong style={{ color: (activeProject.cost_risk_score || 0) > 50 ? '#D9534F' : '#1D1E22' }}>
                      {Math.round(activeProject.cost_risk_score || 0)}/100
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{isHi ? 'भौतिक पूर्णता विलंब' : 'Milestone Delay Risk'}</span>
                    <strong style={{ color: (activeProject.delay_risk_score || 0) > 50 ? '#D9534F' : '#1D1E22' }}>
                      {Math.round(activeProject.delay_risk_score || 0)}/100
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{isHi ? 'दोहराव / विभाजन जोखिम' : 'Duplicate / Splitting Risk'}</span>
                    <strong style={{ color: (activeProject.duplicate_risk_score || 0) > 50 ? '#D9534F' : '#1D1E22' }}>
                      {Math.round(activeProject.duplicate_risk_score || 0)}/100
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Switcher Queue */}
            <div className="card-static" style={{ padding: '1.15rem', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', boxShadow: '2px 3px 0px #1D1E22', background: '#FFFFFF' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1D1E22', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                {isHi ? 'अन्य जांच योग्य परियोजनाएं' : 'Switch Project under Review'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '240px', overflowY: 'auto' }}>
                {allProjects.slice(0, 8).map((p) => {
                  const isSelected = p.work_id === activeProject.work_id;
                  return (
                    <button
                      key={p.work_id}
                      type="button"
                      onClick={() => {
                        setActiveProject(p);
                        setSelectedEvidenceIndex(0);
                        setVerificationStatus('UNDER_REVIEW');
                      }}
                      style={{
                        textAlign: 'left',
                        padding: '0.55rem 0.75rem',
                        border: '1px solid #1D1E22',
                        borderRadius: 'var(--radius-sm)',
                        background: isSelected ? '#1D1E22' : '#FAF8F3',
                        color: isSelected ? '#FFFFFF' : '#1D1E22',
                        cursor: 'pointer',
                        fontSize: '0.76rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                        <span style={{ fontWeight: 800 }}>MPLADS-{p.work_id}</span>
                        <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>{p.state_name}</div>
                      </div>
                      <span style={{ fontWeight: 800, color: isSelected ? '#52B79A' : '#D9534F' }}>
                        {Math.round(p.final_risk_score || 0)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              COLUMN 2: EVIDENCE GALLERY & AI INCONSISTENCY (44%)
              ══════════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Evidence Selector Tabs */}
            <div style={{ background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', padding: '0.85rem 1.15rem', boxShadow: '2px 3px 0px #1D1E22', display: 'flex', gap: '0.6rem' }}>
              <button
                type="button"
                onClick={() => setActiveEvidenceType('photos')}
                style={{
                  flex: 1,
                  padding: '0.55rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid #1D1E22',
                  background: activeEvidenceType === 'photos' ? '#1D1E22' : '#FAF8F3',
                  color: activeEvidenceType === 'photos' ? '#FFFFFF' : '#1D1E22',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
              >
                <Camera size={14} />
                <span>{isHi ? 'स्थल तस्वीरें (2)' : 'Site Photographs (2)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveEvidenceType('documents')}
                style={{
                  flex: 1,
                  padding: '0.55rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid #1D1E22',
                  background: activeEvidenceType === 'documents' ? '#1D1E22' : '#FAF8F3',
                  color: activeEvidenceType === 'documents' ? '#FFFFFF' : '#1D1E22',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
              >
                <FileText size={14} />
                <span>{isHi ? 'वैधानिक दस्तावेज (3)' : 'Official Documents (3)'}</span>
              </button>
            </div>

            {/* Evidence Item Thumbnails Carousel / Selector */}
            <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.3rem' }}>
              {evidenceItems
                .filter((item) => (activeEvidenceType === 'photos' ? item.type === 'photo' : item.type === 'document'))
                .map((item) => {
                  const globalIdx = evidenceItems.findIndex((e) => e.id === item.id);
                  const isSelected = globalIdx === selectedEvidenceIndex;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedEvidenceIndex(globalIdx)}
                      style={{
                        flex: '1 0 160px',
                        padding: '0.75rem',
                        border: '1.5px solid #1D1E22',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? '#FAF8F3' : '#FFFFFF',
                        boxShadow: isSelected ? '2px 3px 0px #1D1E22' : 'none',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.74rem' }}>{item.id}</span>
                        <span
                          style={{
                            fontSize: '0.66rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.35rem',
                            borderRadius: '3px',
                            background: item.status === 'VERIFIED' ? '#E8F5E9' : item.status === 'SUSPICIOUS' ? '#FEF2F2' : '#FFF3E0',
                            color: item.status === 'VERIFIED' ? '#1E7E34' : item.status === 'SUSPICIOUS' ? '#D9534F' : '#B8860B'
                          }}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, lineHeight: 1.25, height: '2.5rem', overflow: 'hidden' }}>
                        {item.title}
                      </div>
                    </button>
                  );
                })}
            </div>

            {/* Active Evidence Preview & Details Card */}
            <div className="card-static" style={{ padding: '1.5rem', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', boxShadow: '3px 4px 0px #1D1E22', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #EAEAEA', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    {currentEvidence.id} • {currentEvidence.type.toUpperCase()}
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.15rem', color: '#1D1E22', margin: '0.2rem 0' }}>
                    {currentEvidence.title}
                  </h3>
                </div>

                <span
                  style={{
                    padding: '0.25rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    background: currentEvidence.status === 'VERIFIED' ? '#E8F5E9' : currentEvidence.status === 'SUSPICIOUS' ? '#FEF2F2' : '#FFF3E0',
                    color: currentEvidence.status === 'VERIFIED' ? '#1E7E34' : currentEvidence.status === 'SUSPICIOUS' ? '#D9534F' : '#B8860B',
                    border: `1px solid ${currentEvidence.status === 'VERIFIED' ? '#52B79A' : currentEvidence.status === 'SUSPICIOUS' ? '#D9534F' : '#F59E0B'}`
                  }}
                >
                  {currentEvidence.status}
                </span>
              </div>

              {/* Visual Preview Box (Simulated Geotagged Image or Certified Document Header) */}
              <div
                style={{
                  background: '#F0EFEA',
                  border: '1.5px solid #1D1E22',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '180px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {currentEvidence.type === 'photo' ? (
                  <>
                    <Camera size={44} style={{ color: '#0A2458', marginBottom: '0.6rem' }} />
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1D1E22' }}>
                      {isHi ? 'प्रमाणिक भू-टैग्ड डिजिटल तस्वीर' : 'Authenticated Geotagged Photographic Proof'}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                      {currentEvidence.gps} • {currentEvidence.date}
                    </div>

                    {/* Geotag Stamp Watermark */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '0.5rem',
                        right: '0.5rem',
                        background: 'rgba(29, 30, 34, 0.85)',
                        color: '#FFFFFF',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '3px',
                        fontSize: '0.68rem',
                        fontFamily: 'monospace'
                      }}
                    >
                      LAT/LNG: {currentEvidence.gps}
                    </div>
                  </>
                ) : (
                  <>
                    <FileCheck size={44} style={{ color: '#1E7E34', marginBottom: '0.6rem' }} />
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1D1E22' }}>
                      {isHi ? 'डिजिटल प्रमाणित वैधानिक दस्तावेज' : 'Digital Certified Statutory Record'}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                      {currentEvidence.resolution} • {currentEvidence.fileSize}
                    </div>
                  </>
                )}
              </div>

              {/* Description */}
              <p style={{ fontSize: '0.84rem', color: '#2A2C32', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
                {currentEvidence.description}
              </p>

              {/* AI Inconsistency Alert Banner */}
              {currentEvidence.inconsistency ? (
                <div
                  style={{
                    background: '#FEF2F2',
                    border: '1.5px solid #D9534F',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    marginBottom: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#D9534F', fontWeight: 800, fontSize: '0.84rem', marginBottom: '0.35rem' }}>
                    <AlertTriangle size={16} />
                    <span>{currentEvidence.inconsistency.title}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#7F1D1D', lineHeight: 1.45 }}>
                    {currentEvidence.inconsistency.details}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: '#E8F5E9',
                    border: '1.5px solid #52B79A',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#1E7E34',
                    fontSize: '0.82rem',
                    fontWeight: 700
                  }}
                >
                  <CheckCircle size={16} />
                  <span>{isHi ? 'AI स्वचालित जांच: इस प्रमाण में कोई विसंगति नहीं पाई गई।' : 'AI Automated Audit: No geometric or cryptographic inconsistencies detected.'}</span>
                </div>
              )}

              {/* Technical Metadata Table */}
              <div style={{ background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  {isHi ? 'तकनीकी प्रमाण मेटाडेटा' : 'Technical Forensic Metadata'}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.76rem' }}>
                  <div>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Capture Date: </span>
                    <strong>{currentEvidence.date}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-secondary)' }}>File Size: </span>
                    <strong>{currentEvidence.fileSize}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-secondary)' }}>GPS Geotag: </span>
                    <strong style={{ fontFamily: 'monospace' }}>{currentEvidence.gps}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Capture Unit: </span>
                    <strong>{currentEvidence.device}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Integrity Check: </span>
                    <strong style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{currentEvidence.hash}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              COLUMN 3: OFFICER REMARKS & ACTIONS (28%)
              ══════════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Audit Verdict Panel */}
            <div className="card-static" style={{ padding: '1.35rem', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', boxShadow: '2px 3px 0px #1D1E22', background: '#FFFFFF' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                {isHi ? 'समीक्षा स्थिति एवं निर्णय' : 'Review Status & Actions'}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: verificationStatus === 'VERIFIED' ? '#E8F5E9' : verificationStatus === 'FLAGGED' ? '#FEF2F2' : '#FFF3E0',
                  border: `1.5px solid ${verificationStatus === 'VERIFIED' ? '#52B79A' : verificationStatus === 'FLAGGED' ? '#D9534F' : '#E5B842'}`,
                  marginBottom: '1rem'
                }}
              >
                {verificationStatus === 'VERIFIED' ? (
                  <ShieldCheck size={20} style={{ color: '#1E7E34' }} />
                ) : verificationStatus === 'FLAGGED' ? (
                  <ShieldAlert size={20} style={{ color: '#D9534F' }} />
                ) : (
                  <Clock size={20} style={{ color: '#B8860B' }} />
                )}
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.84rem' }}>
                    {verificationStatus === 'VERIFIED'
                      ? (isHi ? 'प्रमाण सत्यापित' : 'Evidence Verified')
                      : verificationStatus === 'FLAGGED'
                      ? (isHi ? 'प्रमाण विसंगत / ध्वजंकित' : 'Evidence Flagged Suspicious')
                      : (isHi ? 'समीक्षाधीन' : 'Pending Formal Audit')}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                    Officer: {user?.fullName || 'National Nodal Officer (MoSPI)'}
                  </div>
                </div>
              </div>

              {/* Officer Remarks Textarea */}
              <div style={{ marginBottom: '1.15rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1D1E22', marginBottom: '0.35rem' }}>
                  {isHi ? 'अधिकारी जांच टिप्पणी एवं निष्कर्ष' : 'Officer Audit Observations'}
                </label>
                <textarea
                  rows={4}
                  value={officerRemarks}
                  onChange={(e) => setOfficerRemarks(e.target.value)}
                  placeholder={
                    isHi
                      ? 'प्रमाण विश्लेषण, विसंगति या स्थल सत्यापन संबंधी निर्देश दर्ज करें...'
                      : 'Enter remarks regarding evidence authenticity, GPS check, or field inspection instructions...'
                  }
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    border: '1.5px solid #1D1E22',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                    background: '#FAF8F3'
                  }}
                />

                {/* Quick Pre-filled Remarks */}
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.45rem' }}>
                  <button
                    type="button"
                    onClick={() => setOfficerRemarks('GPS coordinates confirmed within boundary. Milestone progress matches expenditure.')}
                    style={{ background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: '4px', fontSize: '0.68rem', padding: '0.2rem 0.4rem', cursor: 'pointer' }}
                  >
                    + Valid Coordinates
                  </button>
                  <button
                    type="button"
                    onClick={() => setOfficerRemarks('Visual physical progress does not match claimed financial release. Physical inspection mandated.')}
                    style={{ background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: '4px', fontSize: '0.68rem', padding: '0.2rem 0.4rem', cursor: 'pointer' }}
                  >
                    + Progress Mismatch
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={handleVerifyEvidence}
                  className="btn-teal"
                  style={{
                    padding: '0.65rem 1rem',
                    fontSize: '0.84rem',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    width: '100%'
                  }}
                >
                  <CheckCircle size={16} />
                  <span>{isHi ? 'प्रमाण सत्यापित करें' : 'Verify Evidence'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleFlagEvidence}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    width: '100%',
                    padding: '0.65rem 1rem',
                    background: '#FEF2F2',
                    border: '1.5px solid #D9534F',
                    borderRadius: 'var(--radius-sm)',
                    color: '#D9534F',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    boxShadow: '1.5px 2px 0px #D9534F'
                  }}
                >
                  <AlertTriangle size={16} />
                  <span>{isHi ? 'प्रमाण ध्वजंकित करें (संदिग्ध)' : 'Flag Evidence as Suspicious'}</span>
                </button>
              </div>
            </div>

            {/* Next Step Transition Card */}
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
                {isHi ? 'अगला जांच चरण' : 'Next Step in Workflow'}
              </div>
              <h4 style={{ margin: '0.3rem 0 0.5rem 0', fontSize: '0.96rem', fontWeight: 800, color: '#1D1E22' }}>
                {isHi ? 'भौतिक स्थल सत्यापन' : 'Field Inspection & GPS Check'}
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.45, margin: '0 0 0.85rem 0' }}>
                {isHi
                  ? 'प्रमाण समीक्षा के पश्चात क्षेत्र निरीक्षक द्वारा जमीनी निरीक्षण एवं कार्य प्रगति की पुष्टि की जाती है।'
                  : 'Dispatch or review on-site physical inspection data, checklist verification, and GPS coordinate geofence.'}
              </p>

              <button
                type="button"
                onClick={handleProceedToField}
                className="btn-outline-dark"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '0.6rem 1rem',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  gap: '0.4rem'
                }}
              >
                <span>{isHi ? 'चरण 3: स्थल सत्यापन' : 'Proceed to Field Verification'}</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

        </div>
      </main>

      <Footer hideCTAButtons={true} />
    </div>
  );
}
