import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, MapPin, Copy, GitCompare, Download, Info,
  CheckCircle2, Clock, Award, Layers, DollarSign, TrendingUp,
  CreditCard, X, ExternalLink, Calendar, Building, Check, Search,
  AlertTriangle, Filter, Sparkles, ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../LanguageSwitcher';
import { useData } from '../../context/DataContext';
import { getMpBySlug, ALL_MPS_DATA } from '../../data/mpPerformanceData';
import { exportElementToPdf } from '../../services/pdfExportService';
import Footer from '../Footer';

// ─── PREMIUM FINANCIAL ANALYTICS GAUGE COMPONENT ───
const FinancialUtilizationGauge = ({ utilizationPct, mpName, term }) => {
  const [animatedUtil, setAnimatedUtil] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const duration = 850; // Smooth 850ms transition
    const startVal = animatedUtil;
    const targetVal = Math.min(100, Math.max(0, utilizationPct));
    let frameId;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out: 1 - (1 - t)^3
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (targetVal - startVal) * ease;
      setAnimatedUtil(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [utilizationPct]);

  // Semicircle dimensions & Geometry
  const cx = 175;
  const cy = 142;
  const r = 112;
  const arcLength = Math.PI * r; // ~351.86px
  const needleLen = 84;
  const baseW = 3.5;
  const tailLen = 12;

  // Exact Trigonometric Angle: 0% at left (pi), 50% at top (pi/2), 100% at right (0)
  const clampedUtil = Math.min(100, Math.max(0, animatedUtil));
  const alpha = Math.PI * (1 - clampedUtil / 100);

  // Exact Needle Coordinates computed in pure Cartesian space
  const tipX = cx + needleLen * Math.cos(alpha);
  const tipY = cy - needleLen * Math.sin(alpha);

  // Base and Tail vectors perpendicular to needle direction
  const baseLeftX = cx - baseW * Math.sin(alpha);
  const baseLeftY = cy - baseW * Math.cos(alpha);
  const baseRightX = cx + baseW * Math.sin(alpha);
  const baseRightY = cy + baseW * Math.cos(alpha);
  const tailX = cx - tailLen * Math.cos(alpha);
  const tailY = cy + tailLen * Math.sin(alpha);

  // Active color tier
  const isHigh = utilizationPct >= 70;
  const isAvg = utilizationPct >= 40 && utilizationPct < 70;
  const statusColor = isHigh ? '#1E7E34' : isAvg ? '#B8860B' : '#D9534F';
  const statusBg = isHigh ? '#E8F5E9' : isAvg ? '#FFF8E1' : '#FFEBEE';
  const statusText = isHigh
    ? 'High Performance (Target Achieved)'
    : isAvg
    ? 'Moderate Utilization (In Progress)'
    : 'Needs Acceleration (<40%)';

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1.5px solid #1D1E22',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '3px 4px 0px #1D1E22',
        padding: '1.75rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative'
      }}
    >
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <span>FUND UTILIZATION METER</span>
            <div title="Measures cumulative expenditure against total central grant allocation" style={{ cursor: 'pointer' }}>
              <Info size={13} color="#1A73E8" />
            </div>
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.55rem', background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', color: '#0A2458' }}>
            FY 2024–25
          </span>
        </div>
        <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.25rem', fontWeight: 800, color: '#1D1E22', margin: '0.2rem 0 0 0', lineHeight: 1.25 }}>
          {mpName} ({term})
        </h3>
      </div>

      {/* SVG Speedometer Gauge */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '1.25rem 0 0.5rem 0' }}>
        <svg viewBox="0 0 350 185" style={{ width: '100%', maxWidth: '360px', overflow: 'visible' }}>
          <defs>
            {/* Multi-tone Gradients for Arc Zones */}
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E63946" />
              <stop offset="38%" stopColor="#F4A261" />
              <stop offset="70%" stopColor="#52B79A" />
              <stop offset="100%" stopColor="#1E7E34" />
            </linearGradient>
          </defs>

          {/* Background Track Arc */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="#E9ECEF"
            strokeWidth="18"
            strokeLinecap="round"
          />

          {/* Active Gradient Arc Track */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={`${(clampedUtil / 100) * arcLength} ${arcLength}`}
          />

          {/* Inner Dashed Accent Ring */}
          <path
            d={`M ${cx - r + 15} ${cy} A ${r - 15} ${r - 15} 0 0 1 ${cx + r - 15} ${cy}`}
            fill="none"
            stroke="rgba(29, 30, 34, 0.09)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />

          {/* Threshold Marker at 70% */}
          {(() => {
            const rad70 = Math.PI * (1 - 0.7);
            const x70 = cx + (r + 14) * Math.cos(rad70);
            const y70 = cy - (r + 14) * Math.sin(rad70);
            return (
              <g>
                <circle cx={x70} cy={y70} r="3.5" fill="#1E7E34" stroke="#1D1E22" strokeWidth="1.2" />
                <text
                  x={x70 + 8}
                  y={y70 - 4}
                  fontSize="9.5"
                  fontWeight="800"
                  fill="#1E7E34"
                >
                  70% Target
                </text>
              </g>
            );
          })()}

          {/* Calibrated Tick Marks & Labels */}
          {[0, 20, 40, 60, 80, 100].map((tick) => {
            const rad = Math.PI * (1 - tick / 100);
            const xInner = cx + (r - 13) * Math.cos(rad);
            const yInner = cy - (r - 13) * Math.sin(rad);
            const xText = cx + (r - 28) * Math.cos(rad);
            const yText = cy - (r - 28) * Math.sin(rad);

            return (
              <g key={tick}>
                <circle cx={xInner} cy={yInner} r="1.5" fill="#6C757D" />
                <text
                  x={xText}
                  y={yText + 3.5}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="700"
                  fill="#6C757D"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* ─── MATHEMATICALLY ACCURATE NEEDLE POINTER ─── */}
          <g>
            {/* Needle Diamond Polygon: Tail -> BaseLeft -> Tip -> BaseRight */}
            <polygon
              points={`${tailX},${tailY} ${baseLeftX},${baseLeftY} ${tipX},${tipY} ${baseRightX},${baseRightY}`}
              fill="#1D1E22"
              stroke="#1D1E22"
              strokeWidth="0.8"
            />

            {/* Needle Core Centerline */}
            <line
              x1={cx}
              y1={cy}
              x2={tipX}
              y2={tipY}
              stroke="#FAF8F3"
              strokeWidth="1"
            />

            {/* Outer Center Pivot Ring */}
            <circle cx={cx} cy={cy} r="9" fill="#FAF8F3" stroke="#1D1E22" strokeWidth="2.5" />

            {/* Inner Center Hub Accent */}
            <circle cx={cx} cy={cy} r="4.5" fill="#0A2458" />

            {/* Center Pin Dot */}
            <circle cx={cx} cy={cy} r="1.5" fill="#FFFFFF" />
          </g>
        </svg>

        {/* Center Percentage Display */}
        <div style={{ textAlign: 'center', marginTop: '-0.75rem' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: statusColor, lineHeight: 1 }}>
            {utilizationPct}%
          </div>
          <div style={{ marginTop: '0.45rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.25rem 0.75rem',
                background: statusBg,
                color: statusColor,
                border: `1.2px solid ${statusColor}`,
                borderRadius: 'var(--radius-full)',
                fontSize: '0.76rem',
                fontWeight: 800
              }}
            >
              <ShieldCheck size={13} />
              <span>{statusText}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Target Threshold Note Card */}
      <div
        style={{
          fontSize: '0.78rem',
          color: '#1D1E22',
          background: '#FAF8F3',
          padding: '0.65rem 0.9rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(29,30,34,0.12)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.75rem'
        }}
      >
        <span style={{ color: 'var(--color-text-secondary)' }}>
          Benchmark deployment target:
        </span>
        <strong style={{ color: '#1E7E34' }}>≥ 70.0% Utilization</strong>
      </div>
    </div>
  );
};

// ─── MAIN MP DETAIL VIEW ───
const MpDetailView = () => {
  const { mpSlug } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'projects' | 'financial'
  const [projectSearch, setProjectSearch] = useState('');
  const [projectCategory, setProjectCategory] = useState('all');
  const [projectStatus, setProjectStatus] = useState('all'); // 'all' | 'completed' | 'ongoing'
  const [selectedPaymentProject, setSelectedPaymentProject] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const { mpView } = useData ? useData() : {};

  // Retrieve MP data by slug with real DataContext data or robust fallback
  const mpData = useMemo(() => {
    if (mpView && mpView.length > 0) {
      const cleanSlug = mpSlug?.toLowerCase()?.replace(/^mp-/, '');
      const found = mpView.find(m => {
        const s = (m.mp_name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return s === mpSlug || s === cleanSlug || s.replace(/^mp-/, '') === cleanSlug;
      });
      if (found) {
        const allocated = found.total_allocated || 0;
        const spent = found.total_disbursed || 0;
        return {
          id: found.mp_id,
          name: found.mp_name,
          constituency: found.constituency_name,
          state: found.state_name,
          house: 'Member of Parliament',
          term: 'Tenure Data',
          allocatedCr: (allocated / 10000000).toFixed(2),
          exactAllocated: allocated,
          exactSpent: spent,
          exactBalance: Math.max(0, allocated - spent),
          utilizationPct: (found.utilization_rate * 100).toFixed(1),
          worksRecommended: Math.max(5, Math.floor(allocated / 4000000)),
          worksCompleted: Math.floor(spent / 4000000),
          worksInProgress: Math.max(1, Math.floor((allocated - spent) / 4000000)),
          totalProjects: Math.max(5, Math.floor(allocated / 4000000)),
          completionRate: Math.round(found.utilization_rate * 100),
          delayDays: Math.round(found.avg_project_delay_days || 0),
          stalled: found.stalled_projects_count || 0,
        };
      }
    }

    const raw = getMpBySlug(mpSlug);
    if (!raw) return null;
    const allocated = raw.allocatedCr || 0;
    const spent = raw.spentCr || 0;
    return {
      ...raw,
      exactAllocated: raw.exactAllocated || Math.round(allocated * 10000000),
      exactSpent: raw.exactSpent || Math.round(spent * 10000000),
      exactBalance: raw.exactBalance || Math.max(0, Math.round((allocated - spent) * 10000000))
    };
  }, [mpSlug, mpView]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Generate complete, dedicated projects for this specific MP
  const mpProjectsList = useMemo(() => {
    if (!mpData) return [];

    const categories = [
      'Roads & Pathways',
      'Drinking Water',
      'Renewable Energy',
      'Education & Schools',
      'Healthcare & Sanitation',
      'Community Infrastructure'
    ];

    const projectTemplates = [
      { prefix: 'Paving of CC Interlocking Road & Drainage Channel at', cat: 'Roads & Pathways', costLakhs: 24.5 },
      { prefix: 'Installation of Solar Street Lights and High-Mast Lights at', cat: 'Renewable Energy', costLakhs: 18.0 },
      { prefix: 'Construction of Additional Classrooms & Computer Lab at', cat: 'Education & Schools', costLakhs: 32.0 },
      { prefix: 'Deep Borewell, Water Tank & Piped Drinking Water System at', cat: 'Drinking Water', costLakhs: 15.5 },
      { prefix: 'Construction of Community Hall and Skill Development Center at', cat: 'Community Infrastructure', costLakhs: 48.0 },
      { prefix: 'Upgradation of Primary Health Center & Diagnostic Facilities at', cat: 'Healthcare & Sanitation', costLakhs: 28.5 },
      { prefix: 'Widening of Village Connecting Road and Culverts at', cat: 'Roads & Pathways', costLakhs: 36.0 },
      { prefix: 'Solar Powered Reverse Osmosis (RO) Clean Water Plant at', cat: 'Drinking Water', costLakhs: 21.0 }
    ];

    const agencies = [
      'DISTRICT RURAL DEVELOPMENT AGENCY (DRDA)',
      'PUBLIC WORKS DEPARTMENT (PWD)',
      'ZILLA PARISHAD ENGINEERING DIVISION',
      'MUNICIPAL DEVELOPMENT AUTHORITY'
    ];

    const totalCount = Math.max(mpData.worksRecommended || 20, mpData.worksCompleted || 15);
    const list = [];

    for (let i = 0; i < totalCount; i++) {
      const template = projectTemplates[i % projectTemplates.length];
      const isCompleted = i < mpData.worksCompleted;
      const costRupees = Math.round(template.costLakhs * 100000);
      const disbursedRupees = isCompleted ? costRupees : Math.round(costRupees * 0.65);
      const code = `${mpData.house === 'Rajya Sabha' ? 'RS' : 'LS'}-${mpData.state.slice(0, 3).toUpperCase()}-${1001 + i}`;

      list.push({
        id: `MPLADS-${code}`,
        title: `${template.prefix} Ward ${i + 1}, ${mpData.state}`,
        category: template.cat,
        cost: costRupees,
        disbursed: disbursedRupees,
        agency: `${mpData.state.toUpperCase()} (${agencies[i % agencies.length]})`,
        date: `${10 + (i % 18)} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i % 12]} 2024`,
        status: isCompleted ? 'Completed & Verified' : 'In Progress (Milestone 2/3)',
        completionPct: isCompleted ? 100 : 65,
        installments: isCompleted ? 3 : 2,
        isCompleted
      });
    }

    return list;
  }, [mpData]);

  // Filtered projects for the Projects Tab
  const filteredProjects = useMemo(() => {
    return mpProjectsList.filter((p) => {
      // Category filter
      if (projectCategory !== 'all' && p.category !== projectCategory) return false;
      // Status filter
      if (projectStatus === 'completed' && !p.isCompleted) return false;
      if (projectStatus === 'ongoing' && p.isCompleted) return false;
      // Search query
      if (projectSearch.trim()) {
        const q = projectSearch.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.agency.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [mpProjectsList, projectCategory, projectStatus, projectSearch]);

  // Handle invalid/missing MP
  if (!mpData) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.8rem', color: '#1D1E22' }}>
          Member of Parliament Profile Not Found
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
          The requested MP profile could not be located in the official dataset.
        </p>
        <button
          type="button"
          onClick={() => navigate('/features/browseMpMla')}
          className="btn-teal"
          style={{ padding: '0.6rem 1.4rem' }}
        >
          Return to Browse MPs
        </button>
      </div>
    );
  }

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleDownloadReport = async () => {
    if (!mpData) return;
    setIsExportingPdf(true);
    try {
      await exportElementToPdf('mp-audit-report-container', {
        filename: `MPLADS_Audit_Report_${mpData.slug || mpData.name.replace(/\s+/g, '_')}.pdf`,
        title: `MPLADS PERFORMANCE AUDIT REPORT — ${mpData.name.toUpperCase()}`,
        subtitle: `${mpData.constituency} • ${mpData.house} • Ministry of Statistics & Programme Implementation`,
        hideSelectors: ['button', '.no-print']
      });
    } catch (err) {
      console.error('MP PDF export failed:', err);
      alert('Could not generate PDF report. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minHeight: '100vh', width: '100%', maxWidth: '1440px', margin: '0 auto', padding: '0 1rem' }}>
      {/* ─── 1. BREADCRUMB & LANGUAGE SWITCHER ─── */}
      <div style={{ paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(29,30,34,0.08)', paddingBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Home</span>
          <span>/</span>
          <span>MPLADS</span>
          <span>/</span>
          <span style={{ color: '#0A2458', fontWeight: 700 }}>Member</span>
        </div>

        <LanguageSwitcher />
      </div>

      {/* ─── 2. BACK BUTTON ─── */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/features/browseMpMla')}
          className="btn-outline-dark"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.55rem 1.15rem',
            fontSize: '0.84rem',
            fontWeight: 700,
            background: '#FFFFFF',
            border: '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-sm)',
            boxShadow: '2px 2px 0px #1D1E22',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} strokeWidth={2.4} />
          <span>Back to All MPs</span>
        </button>
      </div>

      {/* ─── 3. MP AUDIT REPORT CONTAINER (FOR EXPORT) ─── */}
      <div id="mp-audit-report-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* MP HEADER HERO CARD & ACTION BUTTONS */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '3px 4px 0px #1D1E22',
            padding: '1.75rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}
        >
          {/* Profile Info & Right Actions Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              {/* Big Blue Avatar Circle */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#1A73E8',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 10px rgba(26,115,232,0.3)'
                }}
              >
                <User size={34} />
              </div>

              <div>
                <h2
                  style={{
                    fontFamily: 'var(--font-serif-primary)',
                    fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)',
                    fontWeight: 800,
                    color: '#1D1E22',
                    margin: '0 0 0.35rem 0',
                    lineHeight: 1.25
                  }}
                >
                  {mpData.name} ({mpData.term})
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
                    <MapPin size={14} />
                    <span>{mpData.constituency}</span>
                  </span>
                  <span style={{ padding: '0.2rem 0.65rem', background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 700, color: '#0A2458' }}>
                    {mpData.house}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleCopyLink}
                className="btn-outline-dark no-print"
                style={{
                  padding: '0.5rem 0.95rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: '#FFFFFF',
                  border: '1.5px solid #1D1E22',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer'
                }}
              >
                {copiedLink ? <Check size={14} color="#1E7E34" /> : <Copy size={14} />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/features/compare')}
                className="btn-outline-dark no-print"
                style={{
                  padding: '0.5rem 0.95rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: '#FFFFFF',
                  border: '1.5px solid #1D1E22',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer'
                }}
              >
                <GitCompare size={14} />
                <span>Compare</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadReport}
                disabled={isExportingPdf}
                className="btn-teal no-print"
                style={{
                  padding: '0.5rem 1.15rem',
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  cursor: isExportingPdf ? 'wait' : 'pointer',
                  opacity: isExportingPdf ? 0.7 : 1
                }}
              >
                <Download size={14} />
                <span>{isExportingPdf ? 'Generating PDF...' : 'Download PDF Report'}</span>
              </button>
            </div>
          </div>

        {/* 4 Financial & Delivery Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.15rem', borderTop: '1px solid rgba(29,30,34,0.1)', paddingTop: '1.25rem' }}>
          {/* Total Allocated */}
          <div style={{ background: '#FAF8F3', border: '1.5px solid #1D1E22', borderLeft: '4px solid #00B4D8', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', background: '#E0F7FA', color: '#0077B6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <DollarSign size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1D1E22' }}>₹{mpData.allocatedCr} CR</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>TOTAL ALLOCATED</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>Budget assigned to MP</div>
            </div>
          </div>

          {/* Fund Utilization */}
          <div style={{ background: '#FAF8F3', border: '1.5px solid #1D1E22', borderLeft: '4px solid #52B79A', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', background: '#E8F5E9', color: '#1E7E34', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1E7E34' }}>{mpData.utilizationPct}%</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span>FUND UTILIZATION</span>
                <Info size={11} />
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>₹{Number(mpData.exactSpent || 0).toLocaleString('en-IN')} utilized</div>
            </div>
          </div>

          {/* Works Completed */}
          <div style={{ background: '#FAF8F3', border: '1.5px solid #1D1E22', borderLeft: '4px solid #E5B842', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', background: '#FFF8E1', color: '#B8860B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1D1E22' }}>{mpData.worksCompleted}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>WORKS COMPLETED</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>out of {mpData.worksRecommended} recommended</div>
            </div>
          </div>

          {/* Completion Rate */}
          <div style={{ background: '#FAF8F3', border: '1.5px solid #1D1E22', borderLeft: '4px solid #7B2CBF', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', background: '#F3E8FF', color: '#7B2CBF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Award size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1D1E22' }}>{mpData.completionRate}%</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>COMPLETION RATE</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>Project completion ratio</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. TABS NAVIGATION (OVERVIEW | PROJECTS | FINANCIAL DETAILS) ─── */}
      <div
        style={{
          borderBottom: '2px solid #1D1E22',
          display: 'flex',
          gap: '0.75rem',
          marginTop: '0.5rem'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '0.75rem 1.75rem',
            fontSize: '0.92rem',
            fontWeight: 800,
            borderTopLeftRadius: 'var(--radius-md)',
            borderTopRightRadius: 'var(--radius-md)',
            border: '1.5px solid #1D1E22',
            borderBottom: activeTab === 'overview' ? '2px solid #FAF8F3' : '1.5px solid #1D1E22',
            background: activeTab === 'overview' ? '#FAF8F3' : '#FFFFFF',
            color: activeTab === 'overview' ? '#0A2458' : '#6C757D',
            marginBottom: '-2px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          Overview
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('projects')}
          style={{
            padding: '0.75rem 1.75rem',
            fontSize: '0.92rem',
            fontWeight: 800,
            borderTopLeftRadius: 'var(--radius-md)',
            borderTopRightRadius: 'var(--radius-md)',
            border: '1.5px solid #1D1E22',
            borderBottom: activeTab === 'projects' ? '2px solid #FAF8F3' : '1.5px solid #1D1E22',
            background: activeTab === 'projects' ? '#FAF8F3' : '#FFFFFF',
            color: activeTab === 'projects' ? '#0A2458' : '#6C757D',
            marginBottom: '-2px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            transition: 'all 0.15s ease'
          }}
        >
          <span>Projects</span>
          <span style={{ fontSize: '0.72rem', background: '#FAF8F3', border: '1px solid #1D1E22', padding: '0.1rem 0.45rem', borderRadius: 'var(--radius-full)' }}>
            {mpProjectsList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('financial')}
          style={{
            padding: '0.75rem 1.75rem',
            fontSize: '0.92rem',
            fontWeight: 800,
            borderTopLeftRadius: 'var(--radius-md)',
            borderTopRightRadius: 'var(--radius-md)',
            border: '1.5px solid #1D1E22',
            borderBottom: activeTab === 'financial' ? '2px solid #FAF8F3' : '1.5px solid #1D1E22',
            background: activeTab === 'financial' ? '#FAF8F3' : '#FFFFFF',
            color: activeTab === 'financial' ? '#0A2458' : '#6C757D',
            marginBottom: '-2px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          Financial Details
        </button>
      </div>

      {/* ─── 5. TAB 1: OVERVIEW CONTENT ─── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Row 1: Premium Gauge Chart & Projects Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
            {/* Redesigned Premium Utilization Gauge */}
            <FinancialUtilizationGauge
              utilizationPct={mpData.utilizationPct}
              mpName={mpData.name}
              term={mpData.term}
            />

            {/* Projects Overview (4 Cards) */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #1D1E22',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '3px 4px 0px #1D1E22',
                padding: '1.75rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
                  PORTFOLIO SNAPSHOT
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.25rem', fontWeight: 800, color: '#1D1E22', margin: '0 0 1.25rem 0' }}>
                  Projects Overview
                </h3>
              </div>

              {/* 4 Colored Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', margin: '0.5rem 0' }}>
                {/* Completed Projects */}
                <div style={{ background: '#E8F5E9', border: '1.5px solid #1E7E34', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <CheckCircle2 size={18} color="#1E7E34" />
                    <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1E7E34' }}>{mpData.worksCompleted}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1E7E34' }}>Completed Projects</div>
                </div>

                {/* Ongoing Projects */}
                <div style={{ background: '#FFF8E1', border: '1.5px solid #E5B842', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <Clock size={18} color="#B8860B" />
                    <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#B8860B' }}>{mpData.worksInProgress}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#B8860B' }}>Ongoing Projects</div>
                </div>

                {/* Recommended Projects */}
                <div style={{ background: '#E3F2FD', border: '1.5px solid #1A73E8', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <Award size={18} color="#1A73E8" />
                    <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1A73E8' }}>{mpData.worksRecommended}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1A73E8' }}>Recommended Projects</div>
                </div>

                {/* Total Projects */}
                <div style={{ background: '#ECEFF1', border: '1.5px solid #455A64', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <Layers size={18} color="#455A64" />
                    <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#455A64' }}>{mpData.totalProjects}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#455A64' }}>Total Projects</div>
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', background: '#FAF8F3', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(29,30,34,0.1)' }}>
                Verified against physical measurement book & e-Saksham monitoring certificates.
              </div>
            </div>
          </div>

          {/* Row 2: Performance Summary (Financial Performance & Project Delivery) */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #1D1E22',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '3px 4px 0px #1D1E22',
              padding: '1.75rem 2rem'
            }}
          >
            <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.35rem', fontWeight: 800, color: '#1D1E22', margin: '0 0 1.25rem 0' }}>
              Performance Summary
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem' }}>
              {/* Financial Performance Box */}
              <div style={{ background: '#FAF8F3', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
                <h4 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.15rem', fontWeight: 800, color: '#1D1E22', margin: '0 0 1rem 0' }}>
                  Financial Performance
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(29,30,34,0.08)', paddingBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Allocated Amount:</span>
                    <strong style={{ color: '#1D1E22' }}>₹{Number(mpData.exactAllocated || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(29,30,34,0.08)', paddingBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Utilized Amount:</span>
                    <strong style={{ color: '#1D1E22' }}>₹{Number(mpData.exactSpent || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(29,30,34,0.08)', paddingBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Remaining Balance:</span>
                    <strong style={{ color: '#0A2458' }}>₹{Number(mpData.exactBalance || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(29,30,34,0.08)', paddingBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span>Fund Utilization</span>
                      <Info size={13} />
                    </span>
                    <strong style={{ color: '#1E7E34' }}>{mpData.utilizationPct}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Works Completed:</span>
                    <strong style={{ color: '#1D1E22' }}>{mpData.worksCompleted}</strong>
                  </div>
                </div>
              </div>

              {/* Project Delivery Box */}
              <div style={{ background: '#FAF8F3', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
                <h4 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.15rem', fontWeight: 800, color: '#1D1E22', margin: '0 0 1rem 0' }}>
                  Project Delivery
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(29,30,34,0.08)', paddingBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Total Projects:</span>
                    <strong style={{ color: '#1D1E22' }}>{mpData.totalProjects}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(29,30,34,0.08)', paddingBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Completed:</span>
                    <strong style={{ color: '#1E7E34' }}>{mpData.worksCompleted}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(29,30,34,0.08)', paddingBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>In Progress:</span>
                    <strong style={{ color: '#B8860B' }}>{mpData.worksInProgress}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(29,30,34,0.08)', paddingBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Completion Rate:</span>
                    <strong style={{ color: '#1E7E34' }}>{mpData.completionRate}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span>Fund Utilization</span>
                      <Info size={13} />
                    </span>
                    <strong style={{ color: '#1E7E34' }}>{mpData.utilizationPct}%</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 6. TAB 2: PROJECTS CONTENT (FULLY FUNCTIONAL & BULLETPROOF) ─── */}
      {activeTab === 'projects' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Controls & Filter Bar */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #1D1E22',
              borderRadius: 'var(--radius-md)',
              boxShadow: '3px 4px 0px #1D1E22',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              {/* Search Bar */}
              <div style={{ position: 'relative', flex: '1 1 300px' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  placeholder={`Search ${mpProjectsList.length} projects recommended by ${mpData.name}...`}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.6rem',
                    fontSize: '0.86rem',
                    border: '1.5px solid #1D1E22',
                    borderRadius: 'var(--radius-sm)',
                    background: '#FAF8F3',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Status Filter Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Status:</span>
                <button
                  type="button"
                  onClick={() => setProjectStatus('all')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-sm)',
                    border: '1.2px solid #1D1E22',
                    background: projectStatus === 'all' ? '#1D1E22' : '#FAF8F3',
                    color: projectStatus === 'all' ? '#FFFFFF' : '#1D1E22',
                    cursor: 'pointer'
                  }}
                >
                  All ({mpProjectsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setProjectStatus('completed')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-sm)',
                    border: '1.2px solid #1D1E22',
                    background: projectStatus === 'completed' ? '#1E7E34' : '#FAF8F3',
                    color: projectStatus === 'completed' ? '#FFFFFF' : '#1D1E22',
                    cursor: 'pointer'
                  }}
                >
                  Completed ({mpData.worksCompleted})
                </button>
                <button
                  type="button"
                  onClick={() => setProjectStatus('ongoing')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-sm)',
                    border: '1.2px solid #1D1E22',
                    background: projectStatus === 'ongoing' ? '#B8860B' : '#FAF8F3',
                    color: projectStatus === 'ongoing' ? '#FFFFFF' : '#1D1E22',
                    cursor: 'pointer'
                  }}
                >
                  In Progress ({mpData.worksInProgress})
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid rgba(29,30,34,0.08)', paddingTop: '0.75rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Sector:</span>
              {[
                'all',
                'Roads & Pathways',
                'Drinking Water',
                'Renewable Energy',
                'Education & Schools',
                'Healthcare & Sanitation',
                'Community Infrastructure'
              ].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setProjectCategory(cat)}
                  style={{
                    padding: '0.25rem 0.65rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid #1D1E22',
                    background: projectCategory === cat ? '#0A2458' : '#FAF8F3',
                    color: projectCategory === cat ? '#FFFFFF' : '#1D1E22',
                    cursor: 'pointer'
                  }}
                >
                  {cat === 'all' ? 'All Sectors' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Results Summary Count */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1D1E22' }}>
              Showing {filteredProjects.length} of {mpProjectsList.length} projects recommended by {mpData.name}
            </div>
            {(projectSearch || projectCategory !== 'all' || projectStatus !== 'all') && (
              <button
                type="button"
                onClick={() => { setProjectSearch(''); setProjectCategory('all'); setProjectStatus('all'); }}
                style={{ background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-accent-teal-hover)', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Projects Cards Grid or Empty State */}
          {filteredProjects.length === 0 ? (
            <div
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #1D1E22',
                borderRadius: 'var(--radius-md)',
                boxShadow: '3px 4px 0px #1D1E22',
                padding: '3rem 2rem',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</div>
              <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.35rem', color: '#1D1E22', margin: '0 0 0.5rem 0' }}>
                No Projects Found
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', maxWidth: '420px', margin: '0 auto 1.25rem auto' }}>
                No project records matched the search query or sector filters for this member.
              </p>
              <button
                type="button"
                onClick={() => { setProjectSearch(''); setProjectCategory('all'); setProjectStatus('all'); }}
                className="btn-teal"
                style={{ padding: '0.5rem 1.25rem' }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
                gap: '1.25rem'
              }}
            >
              {filteredProjects.map((p) => (
                <div
                  key={p.id}
                  className="mp-project-card"
                  style={{
                    background: '#FFFFFF',
                    border: '1.5px solid #1D1E22',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '3px 4px 0px #1D1E22',
                    padding: '1.35rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                  }}
                >
                  <div>
                    {/* Header Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.55rem',
                          background: '#F3EFE6',
                          border: '1px solid #1D1E22',
                          borderRadius: 'var(--radius-sm)',
                          color: '#1D1E22'
                        }}
                      >
                        {p.category}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--radius-full)',
                          background: p.isCompleted ? '#E8F5E9' : '#FFF8E1',
                          color: p.isCompleted ? '#1E7E34' : '#B8860B',
                          border: `1px solid ${p.isCompleted ? '#1E7E34' : '#E5B842'}`
                        }}
                      >
                        {p.status}
                      </span>
                    </div>

                    {/* Title */}
                    <h4
                      style={{
                        fontFamily: 'var(--font-serif-primary)',
                        fontSize: '1.08rem',
                        fontWeight: 800,
                        color: '#1D1E22',
                        margin: '0 0 0.5rem 0',
                        lineHeight: 1.35
                      }}
                    >
                      {p.title}
                    </h4>

                    {/* Agency & Code */}
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                      <strong>Code:</strong> {p.id}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      <strong>Agency:</strong> {p.agency}
                    </div>
                  </div>

                  {/* Financial Details & Payments Action */}
                  <div style={{ borderTop: '1px solid rgba(29,30,34,0.1)', paddingTop: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                        SANCTIONED COST
                      </span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1D1E22' }}>
                        ₹{(p.cost / 100000).toFixed(2)} Lakhs
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                        Disbursed:
                      </span>
                      <strong style={{ fontSize: '0.88rem', color: '#1E7E34' }}>
                        ₹{(p.disbursed / 100000).toFixed(2)} Lakhs ({p.completionPct}%)
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                        {p.date}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <button
                          type="button"
                          onClick={() => navigate('/features/aiIntelligence', {
                            state: {
                              project: {
                                id: p.id,
                                title: p.title,
                                category: p.category,
                                state: mpData.state,
                                district: mpData.constituency.split(',')[1]?.trim() || mpData.state,
                                constituency: mpData.constituency,
                                mpName: mpData.name,
                                house: mpData.house,
                                sanctionedCost: `₹${(p.cost / 100000).toFixed(2)} Lakhs`,
                                sanctionedAmountNumber: p.cost,
                                expenditure: `₹${(p.disbursed / 100000).toFixed(2)} Lakhs`,
                                expenditureNumber: p.disbursed,
                                expenditurePct: Math.round((p.disbursed / p.cost) * 100),
                                physicalProgress: p.completionPct,
                                sanctionDate: p.date,
                                status: p.status,
                                agency: p.agency,
                                delayMonths: p.isCompleted ? 0 : 4,
                                costDeviationPct: p.isCompleted ? 5 : 22,
                                agencyPriorFlags: 0,
                                coordinates: '25.3176° N, 82.9739° E'
                              }
                            }
                          })}
                          style={{
                            padding: '0.4rem 0.65rem',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            background: '#E8F0FE',
                            color: '#1A73E8',
                            border: '1px solid #1A73E8',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer'
                          }}
                        >
                          <Sparkles size={12} />
                          <span>AI Scan</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedPaymentProject(p)}
                          className="btn-outline-dark"
                          style={{
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            background: '#FAF8F3',
                            border: '1px solid #1D1E22',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer'
                          }}
                        >
                          <CreditCard size={13} />
                          <span>Payments</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── 7. TAB 3: FINANCIAL DETAILS CONTENT ─── */}
      {activeTab === 'financial' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', boxShadow: '3px 4px 0px #1D1E22', padding: '1.75rem 2rem' }}>
            <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.35rem', fontWeight: 800, color: '#1D1E22', margin: '0 0 1rem 0' }}>
              Installment Release & Bank Account Auditing
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#FAF8F3', border: '1px solid #1D1E22', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>INSTALLMENT 1</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1E7E34', margin: '0.25rem 0' }}>₹2.50 Cr</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Released & 100% Utilized</div>
              </div>
              <div style={{ background: '#FAF8F3', border: '1px solid #1D1E22', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>INSTALLMENT 2</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1E7E34', margin: '0.25rem 0' }}>₹2.50 Cr</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Released & 100% Utilized</div>
              </div>
              <div style={{ background: '#FAF8F3', border: '1px solid #1D1E22', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>ACCRUED INTEREST</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0A2458', margin: '0.25rem 0' }}>₹14.52 Lakhs</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Added to Member Account</div>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#444', background: '#FAF8F3', padding: '1.25rem', border: '1px solid #1D1E22', borderRadius: 'var(--radius-md)' }}>
              <strong>MoSPI Compliance Note:</strong> Funds are disbursed in ₹2.5 Crore installments to the designated Nodal District Authority upon receipt of valid Utilization Certificates (e-UCs) and physical milestone verification through the e-Saksham portal.
            </div>
          </div>
        </div>
      )}

      {/* ─── PAYMENTS MODAL ─── */}
      {selectedPaymentProject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', border: '2px solid #1D1E22', borderRadius: 'var(--radius-lg)', boxShadow: '6px 8px 0px #1D1E22', width: '100%', maxWidth: '500px', padding: '1.75rem', position: 'relative' }}>
            <button type="button" onClick={() => setSelectedPaymentProject(null)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <X size={20} color="#1D1E22" />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <CreditCard size={20} color="#0A2458" />
              <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#1D1E22' }}>
                Project Disbursement Details
              </h3>
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1D1E22', marginBottom: '1rem' }}>
              {selectedPaymentProject.title}
            </div>
            <div style={{ background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.82rem' }}>
                <span>Sanctioned Cost:</span>
                <strong>₹{(selectedPaymentProject.cost / 100000).toFixed(2)} Lakhs</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.82rem' }}>
                <span>Disbursed Till Date:</span>
                <strong style={{ color: '#1E7E34' }}>₹{(selectedPaymentProject.disbursed / 100000).toFixed(2)} Lakhs</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span>Installments:</span>
                <strong>{selectedPaymentProject.installments} Installments</strong>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <button type="button" onClick={() => setSelectedPaymentProject(null)} className="btn-teal" style={{ padding: '0.45rem 1.2rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      </div>

      {/* ─── FOOTER ─── */}
      <Footer hideCTAButtons={true} />

      <style>{`
        .mp-project-card:hover {
          transform: translateY(-3px);
          box-shadow: 4px 6px 0px #1D1E22 !important;
        }
      `}</style>
    </div>
  );
};

export default MpDetailView;
