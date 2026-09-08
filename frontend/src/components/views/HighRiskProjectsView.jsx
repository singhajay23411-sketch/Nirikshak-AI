import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, Search, Filter, ShieldAlert, AlertTriangle, ChevronRight,
  Download, Eye, MapPin, Building, Calendar, DollarSign, Activity,
  Layers, CheckCircle, RefreshCw, ChevronLeft, ArrowUpDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import Footer from '../Footer';
import { exportElementToPdf } from '../../services/pdfExportService';

export default function HighRiskProjectsView({ onNavigateToEvidence }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRiskTier, setSelectedRiskTier] = useState('ALL'); // 'ALL' | 'CRITICAL' | 'HIGH' | 'MODERATE'
  const [selectedState, setSelectedState] = useState('ALL');
  const [sortBy, setSortBy] = useState('risk_desc'); // 'risk_desc' | 'amount_desc' | 'delay_desc'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch('/data/unified_project_evaluations.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          // Normalize and filter queue items (focus on evaluated high-risk, critical or anomaly items)
          const items = Array.isArray(data) ? data : [];
          setProjects(items);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load high-risk projects:', err);
          setError(err.message || 'Failed to load project queue');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Available States for filter
  const stateOptions = useMemo(() => {
    const s = new Set();
    projects.forEach((p) => {
      if (p.state_name) s.add(p.state_name);
    });
    return Array.from(s).sort();
  }, [projects]);

  // Filter & Sort Pipeline
  const filteredProjects = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return projects.filter((p) => {
      // Risk Tier filter
      const tier = (p.risk_tier || '').toUpperCase();
      if (selectedRiskTier === 'CRITICAL' && tier !== 'CRITICAL') return false;
      if (selectedRiskTier === 'HIGH' && tier !== 'HIGH') return false;
      if (selectedRiskTier === 'MODERATE' && tier !== 'MODERATE') return false;

      // State filter
      if (selectedState !== 'ALL' && p.state_name !== selectedState) {
        return false;
      }

      // Text search
      if (q) {
        const idStr = String(p.work_id || '').toLowerCase();
        const fullId = `mplads-${idStr}`;
        const title = (p.activity_name || p.work_description || '').toLowerCase();
        const state = (p.state_name || '').toLowerCase();
        const dist = (p.const_name || '').toLowerCase();
        const agency = (p.ida_name || p.primary_vendor_name || '').toLowerCase();
        const mp = (p.mp_name || '').toLowerCase();

        const match =
          idStr.includes(q) ||
          fullId.includes(q) ||
          title.includes(q) ||
          state.includes(q) ||
          dist.includes(q) ||
          agency.includes(q) ||
          mp.includes(q);

        if (!match) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'risk_desc') {
        return (b.final_risk_score || 0) - (a.final_risk_score || 0);
      }
      if (sortBy === 'amount_desc') {
        return (b.sanction_amount || 0) - (a.sanction_amount || 0);
      }
      if (sortBy === 'delay_desc') {
        return (b.completion_delay_days || 0) - (a.completion_delay_days || 0);
      }
      return 0;
    });
  }, [projects, searchQuery, selectedRiskTier, selectedState, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const pagedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, safePage, pageSize]);

  // Calculate sliding page numbers window: Previous | 1 | 2 | 3 | ... | Next
  const paginationItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (safePage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (safePage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', safePage - 1, safePage, safePage + 1, '...', totalPages];
  }, [safePage, totalPages]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedRiskTier, selectedState, sortBy]);

  // High-Level Aggregate Stats
  const queueStats = useMemo(() => {
    const criticalCount = projects.filter((p) => (p.risk_tier || '').toUpperCase() === 'CRITICAL').length;
    const highCount = projects.filter((p) => (p.risk_tier || '').toUpperCase() === 'HIGH').length;
    const totalAmount = projects
      .filter((p) => (p.risk_tier === 'CRITICAL' || p.risk_tier === 'HIGH'))
      .reduce((sum, p) => sum + (p.sanction_amount || 0), 0);
    const avgDelay = Math.round(
      projects.reduce((sum, p) => sum + (p.completion_delay_days || 0), 0) / Math.max(1, projects.length)
    );

    return {
      criticalCount,
      highCount,
      totalAmountCrores: (totalAmount / 10000000).toFixed(1),
      avgDelay
    };
  }, [projects]);

  // Handle open investigation detail
  const handleOpenInvestigation = (projectId) => {
    if (onNavigateToEvidence) {
      onNavigateToEvidence(projectId);
    } else {
      navigate(`/features/evidenceReview?projectId=${projectId}`);
    }
  };

  // Helper for driver pill label
  const getDriverLabel = (p) => {
    if (p.top_risk_drivers && p.top_risk_drivers.length > 0) {
      const topPillar = p.top_risk_drivers[0].pillar;
      const map = {
        financial_risk_score: isHi ? 'वित्तीय विसंगति' : 'Financial Anomaly',
        progress_risk_score: isHi ? 'प्रगति ठहराव' : 'Progress Stall',
        cost_risk_score: isHi ? 'लागत वृद्धि' : 'Cost Overrun',
        delay_risk_score: isHi ? 'समय सीमा उल्लंघन' : 'Chronic Delay',
        duplicate_risk_score: isHi ? 'संभावित दोहराव' : 'Duplicate Alert',
        evidence_risk_score: isHi ? 'प्रमाण विसंगति' : 'Evidence Gap',
        agency_risk_score_y: isHi ? 'एजेंसी संकेंद्रण' : 'Agency Risk',
        payment_risk_score: isHi ? 'भुगतान विखंडन' : 'Payment Pattern'
      };
      return map[topPillar] || (isHi ? 'बहु-कारक जोखिम' : 'Multi-Factor Risk');
    }
    if (p.cost_overrun_pct > 20) return isHi ? 'लागत वृद्धि' : 'Cost Overrun';
    if (p.completion_delay_days > 180) return isHi ? 'असामान्य देरी' : 'Abnormal Delay';
    return isHi ? 'प्रशासनिक समीक्षा' : 'Audit Priority';
  };

  return (
    <div className="investigation-screen" style={{ background: 'var(--color-bg-light)', color: 'var(--color-text-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Breadcrumb & Header Bar */}
      <div style={{ background: '#FFFFFF', borderBottom: '1.5px solid #1D1E22', padding: '1.25rem 2rem' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
            <button
              type="button"
              onClick={() => navigate('/')}
              style={{ background: 'none', border: 'none', color: '#0A2458', fontWeight: 600, cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <ArrowLeft size={15} />
              {isHi ? 'मुख्य पृष्ठ' : 'Home'}
            </button>
            <span>/</span>
            <span>{isHi ? 'जांच केंद्र' : 'Investigation'}</span>
            <span>/</span>
            <span style={{ color: '#1D1E22', fontWeight: 700 }}>{isHi ? 'उच्च-जोखिम परियोजना कतार' : 'High-Risk Projects'}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#FEF2F2', border: '1px solid #D9534F', padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700, color: '#D9534F', marginBottom: '0.4rem' }}>
                <ShieldAlert size={13} />
                <span>{isHi ? 'सक्रिय विसंगति निगरानी कतार' : 'ACTIVE RISK AUDIT QUEUE'}</span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '2.1rem', fontWeight: 800, color: '#1D1E22', margin: 0, lineHeight: 1.2 }}>
                {isHi ? 'उच्च-जोखिम परियोजना कतार' : 'High-Risk Projects Queue'}
              </h1>
              <p style={{ fontSize: '0.94rem', color: 'var(--color-text-secondary)', marginTop: '0.4rem', margin: 0, maxWidth: '780px', lineHeight: 1.5 }}>
                {isHi
                  ? 'निरीक्षक AI द्वारा बहु-स्तंभीय (लागत, समय, प्रमाण, दोहराव, एजेंसी) विश्लेषण के आधार पर उच्च एवं गंभीर जोखिम वाली प्राथमिक जांच सूची।'
                  : 'Prioritized queue of MPLADS projects flagged for immediate human inspection, grounded in 8 multi-pillar machine learning risk assessments.'}
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await exportElementToPdf('high-risk-projects-content', {
                      filename: 'Nirikshak_High_Risk_Projects_Queue.pdf',
                      title: isHi ? 'निरीक्षक AI - उच्च-जोखिम परियोजना सूची' : 'NIRIKSHAK AI — HIGH-RISK PROJECTS AUDIT QUEUE',
                      subtitle: `Generated on ${new Date().toLocaleDateString()} • Total Flagged: ${filteredProjects.length}`
                    });
                  } catch (e) {
                    console.error('PDF export failed:', e);
                  }
                }}
                className="btn-outline-dark"
                style={{ padding: '0.6rem 1.1rem', fontSize: '0.84rem', gap: '0.45rem' }}
              >
                <Download size={15} />
                <span>{isHi ? 'कतार पीडीएफ' : 'Export Queue PDF'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main id="high-risk-projects-content" style={{ flex: 1, padding: '2rem', maxWidth: '1440px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {/* KPI Metric Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
          <div className="card-static" style={{ padding: '1.15rem 1.25rem', border: '1.5px solid #1D1E22', boxShadow: '2px 3px 0px #1D1E22', background: '#FFFFFF' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D9534F', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isHi ? 'गंभीर जोखिम परियोजनाएं' : 'Critical Tier Projects'}
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#D9534F', marginTop: '0.3rem' }}>
              {queueStats.criticalCount.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
              {isHi ? 'स्कोर ≥ 75 (तत्काल जांच आवश्यक)' : 'Risk Score ≥ 75/100 (Immediate Mandate)'}
            </div>
          </div>

          <div className="card-static" style={{ padding: '1.15rem 1.25rem', border: '1.5px solid #1D1E22', boxShadow: '2px 3px 0px #1D1E22', background: '#FFFFFF' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B8860B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isHi ? 'उच्च जोखिम परियोजनाएं' : 'High Risk Projects'}
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1D1E22', marginTop: '0.3rem' }}>
              {queueStats.highCount.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
              {isHi ? 'स्कोर 50–74 (समीक्षा एवं सत्यापन)' : 'Risk Score 50–74/100 (Inspection Queue)'}
            </div>
          </div>

          <div className="card-static" style={{ padding: '1.15rem 1.25rem', border: '1.5px solid #1D1E22', boxShadow: '2px 3px 0px #1D1E22', background: '#FFFFFF' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0A2458', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isHi ? 'जोखिम में कुल निधि' : 'Public Funds at Risk'}
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0A2458', marginTop: '0.3rem' }}>
              ₹{queueStats.totalAmountCrores} Cr
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
              {isHi ? 'गंभीर व उच्च-जोखिम कार्यों का संवितरण' : 'Cumulative Sanction in Flagged Projects'}
            </div>
          </div>

          <div className="card-static" style={{ padding: '1.15rem 1.25rem', border: '1.5px solid #1D1E22', boxShadow: '2px 3px 0px #1D1E22', background: '#FFFFFF' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isHi ? 'औसत पूर्णता विलंब' : 'Average Delay'}
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1D1E22', marginTop: '0.3rem' }}>
              {queueStats.avgDelay} {isHi ? 'दिन' : 'Days'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
              {isHi ? 'परियोजना लक्षित तिथि से विलंब' : 'Completion days beyond sanction timeline'}
            </div>
          </div>
        </div>

        {/* Filter & Search Bar Controls */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            boxShadow: '2px 3px 0px #1D1E22',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 360px', minWidth: '260px' }}>
              <Search
                size={18}
                style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#1D1E22' }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isHi
                    ? 'परियोजना ID, नाम, जिला, राज्य, MP या एजेंसी खोजें...'
                    : 'Search by Project ID, title, state, district, MP, or agency...'
                }
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem 0.65rem 2.6rem',
                  border: '1.5px solid #1D1E22',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: '#1D1E22',
                  background: '#FAF8F3',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>

            {/* State Dropdown */}
            <div style={{ minWidth: '200px' }}>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem',
                  border: '1.5px solid #1D1E22',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  color: '#1D1E22',
                  background: '#FAF8F3',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="ALL">{isHi ? 'सभी राज्य / केंद्र शासित प्रदेश' : 'All States & UTs'}</option>
                {stateOptions.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div style={{ minWidth: '180px' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem',
                  border: '1.5px solid #1D1E22',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  color: '#1D1E22',
                  background: '#FAF8F3',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="risk_desc">{isHi ? 'क्रम: उच्चतम जोखिम स्कोर' : 'Sort: Highest Risk Score'}</option>
                <option value="amount_desc">{isHi ? 'क्रम: उच्चतम संस्वीकृत राशि' : 'Sort: Highest Sanction Amount'}</option>
                <option value="delay_desc">{isHi ? 'क्रम: अधिकतम विलंब' : 'Sort: Longest Delay'}</option>
              </select>
            </div>
          </div>

          {/* Risk Level Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid #EAEAEA', paddingTop: '0.85rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginRight: '0.3rem' }}>
              {isHi ? 'जोखिम स्तर:' : 'Risk Level:'}
            </span>

            {[
              { key: 'ALL', label: isHi ? 'सभी उच्च प्राथमिकता' : 'All Priority Queue' },
              { key: 'CRITICAL', label: isHi ? 'गंभीर (≥75)' : 'Critical (≥75)' },
              { key: 'HIGH', label: isHi ? 'उच्च (50–74)' : 'High (50–74)' },
              { key: 'MODERATE', label: isHi ? 'मध्यम (35–49)' : 'Moderate (35–49)' }
            ].map((tab) => {
              const active = selectedRiskTier === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedRiskTier(tab.key)}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    border: '1.5px solid #1D1E22',
                    background: active ? '#1D1E22' : '#FAF8F3',
                    color: active ? '#FFFFFF' : '#1D1E22',
                    boxShadow: active ? 'none' : '1px 2px 0px #1D1E22',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}

            <div style={{ marginLeft: 'auto', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              {isHi ? `कुल ${filteredProjects.length} परियोजनाएं` : `Showing ${filteredProjects.length} flagged projects`}
            </div>
          </div>
        </div>

        {/* Project Queue Table */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)' }}>
            <RefreshCw size={28} className="spin-animation" style={{ color: '#0A2458', margin: '0 auto 1rem' }} />
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{isHi ? 'उच्च-जोखिम परियोजना कतार लोड हो रही है...' : 'Loading High-Risk Projects Queue...'}</div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', boxShadow: '2px 3px 0px #1D1E22' }}>
            <AlertTriangle size={32} style={{ color: '#B8860B', margin: '0 auto 0.75rem' }} />
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1D1E22' }}>{isHi ? 'कोई मेल खाती परियोजना नहीं मिली' : 'No matching high-risk projects found'}</div>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginTop: '0.4rem' }}>
              {isHi ? 'कृपया अपना खोज शब्द या फ़िल्टर समायोजित करें।' : 'Try clearing your search query or loosening filter criteria.'}
            </p>
          </div>
        ) : (
          <div style={{ background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', boxShadow: '3px 4px 0px #1D1E22', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ background: '#FAF8F3', borderBottom: '1.5px solid #1D1E22', color: '#1D1E22', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '0.9rem 1.1rem', width: '140px' }}>{isHi ? 'परियोजना ID' : 'Project ID'}</th>
                    <th style={{ padding: '0.9rem 1.1rem' }}>{isHi ? 'शीर्षक एवं कार्य विवरण' : 'Project Title & Details'}</th>
                    <th style={{ padding: '0.9rem 1.1rem', width: '180px' }}>{isHi ? 'राज्य एवं निर्वाचन क्षेत्र' : 'State & Constituency'}</th>
                    <th style={{ padding: '0.9rem 1.1rem', width: '140px' }}>{isHi ? 'जोखिम स्कोर / स्तर' : 'Risk Score & Tier'}</th>
                    <th style={{ padding: '0.9rem 1.1rem', width: '170px' }}>{isHi ? 'प्राथमिक जोखिम चालक' : 'Primary Risk Driver'}</th>
                    <th style={{ padding: '0.9rem 1.1rem', width: '150px' }}>{isHi ? 'राशि एवं संवितरण' : 'Amount Involved'}</th>
                    <th style={{ padding: '0.9rem 1.1rem', width: '120px' }}>{isHi ? 'स्थिति' : 'Status'}</th>
                    <th style={{ padding: '0.9rem 1.1rem', width: '150px', textAlign: 'center' }}>{isHi ? 'कार्रवाई' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedItems.map((proj, idx) => {
                    const tier = (proj.risk_tier || '').toUpperCase();
                    const isCritical = tier === 'CRITICAL' || (proj.final_risk_score >= 75);
                    const isHigh = tier === 'HIGH' || (proj.final_risk_score >= 50 && proj.final_risk_score < 75);
                    const riskScore = Math.round(proj.final_risk_score || 0);

                    const sanction = proj.sanction_amount || 0;
                    const disbursed = proj.total_disbursed || 0;
                    const ratioPct = sanction > 0 ? Math.min(100, Math.round((disbursed / sanction) * 100)) : 0;

                    return (
                      <tr
                        key={proj.work_id || idx}
                        style={{
                          borderBottom: '1px solid #EAEAEA',
                          background: idx % 2 === 0 ? '#FFFFFF' : '#FAF8F3'
                        }}
                      >
                        {/* Project ID */}
                        <td style={{ padding: '1rem 1.1rem', verticalAlign: 'top' }}>
                          <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0A2458', fontSize: '0.84rem' }}>
                            MPLADS-{proj.work_id}
                          </div>
                          <span
                            style={{
                              display: 'inline-block',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              background: '#EAEAEA',
                              color: '#4A4D55',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '4px',
                              marginTop: '0.3rem'
                            }}
                          >
                            {proj.work_category || 'Infrastructure'}
                          </span>
                        </td>

                        {/* Title & Description */}
                        <td style={{ padding: '1rem 1.1rem', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 700, color: '#1D1E22', marginBottom: '0.25rem', lineHeight: 1.35, fontSize: '0.88rem' }}>
                            {proj.activity_name || proj.work_description || `Work ${proj.work_id}`}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                            {proj.mp_name && <span>MP: <strong>{proj.mp_name}</strong></span>}
                            {proj.ida_name && <span>Agency: <strong>{proj.ida_name.slice(0, 32)}</strong></span>}
                          </div>
                        </td>

                        {/* Location */}
                        <td style={{ padding: '1rem 1.1rem', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 700, color: '#1D1E22', fontSize: '0.84rem' }}>
                            {proj.state_name || 'N/A'}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                            <MapPin size={12} />
                            <span>{proj.const_name || 'General District'}</span>
                          </div>
                        </td>

                        {/* Risk Score & Level */}
                        <td style={{ padding: '1rem 1.1rem', verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                            <span
                              style={{
                                fontSize: '1.05rem',
                                fontWeight: 800,
                                color: isCritical ? '#D9534F' : isHigh ? '#E65100' : '#B8860B'
                              }}
                            >
                              {riskScore}/100
                            </span>
                          </div>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.2rem 0.55rem',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              background: isCritical ? '#FEF2F2' : isHigh ? '#FFF7ED' : '#FFFBEB',
                              color: isCritical ? '#D9534F' : isHigh ? '#C2410C' : '#B45309',
                              border: `1px solid ${isCritical ? '#D9534F' : isHigh ? '#F97316' : '#F59E0B'}`
                            }}
                          >
                            {isCritical ? 'CRITICAL RISK' : isHigh ? 'HIGH RISK' : 'MODERATE'}
                          </span>
                        </td>

                        {/* Primary Risk Driver */}
                        <td style={{ padding: '1rem 1.1rem', verticalAlign: 'top' }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              background: '#FAF8F3',
                              border: '1px solid #1D1E22',
                              padding: '0.25rem 0.55rem',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              color: '#1D1E22'
                            }}
                          >
                            <AlertTriangle size={12} style={{ color: '#D9534F' }} />
                            <span>{getDriverLabel(proj)}</span>
                          </div>
                          {proj.completion_delay_days > 0 && (
                            <div style={{ fontSize: '0.74rem', color: '#D9534F', marginTop: '0.25rem' }}>
                              +{proj.completion_delay_days} days delay
                            </div>
                          )}
                        </td>

                        {/* Amount Involved */}
                        <td style={{ padding: '1rem 1.1rem', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 800, color: '#1D1E22' }}>
                            ₹{(sanction).toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                            Disbursed: ₹{(disbursed).toLocaleString('en-IN')} ({ratioPct}%)
                          </div>
                          {/* Mini Progress Bar */}
                          <div style={{ height: '5px', background: '#EAEAEA', borderRadius: '3px', marginTop: '0.35rem', overflow: 'hidden' }}>
                            <div style={{ width: `${ratioPct}%`, height: '100%', background: ratioPct > 90 ? '#D9534F' : '#0A2458' }} />
                          </div>
                        </td>

                        {/* Project Status */}
                        <td style={{ padding: '1rem 1.1rem', verticalAlign: 'top' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              background: proj.work_status === 'Completed' ? '#E8F5E9' : proj.work_status === 'Sanctioned' ? '#E3F2FD' : '#FFF3E0',
                              color: proj.work_status === 'Completed' ? '#1E7E34' : proj.work_status === 'Sanctioned' ? '#0A2458' : '#B8860B',
                              border: `1px solid ${proj.work_status === 'Completed' ? '#52B79A' : '#90CAF9'}`
                            }}
                          >
                            {proj.work_status || 'Under Review'}
                          </span>
                        </td>

                        {/* Action: View Investigation Button */}
                        <td style={{ padding: '1rem 1.1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenInvestigation(proj.work_id)}
                            className="btn-teal"
                            style={{
                              padding: '0.5rem 0.85rem',
                              fontSize: '0.78rem',
                              gap: '0.35rem',
                              width: '100%',
                              justifyContent: 'center'
                            }}
                          >
                            <Eye size={14} />
                            <span>{isHi ? 'जांच देखें' : 'View Investigation'}</span>
                            <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Toolbar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1.25rem',
                background: '#FAF8F3',
                borderTop: '1.5px solid #1D1E22',
                fontSize: '0.82rem',
                fontWeight: 600
              }}
            >
              <div style={{ color: 'var(--color-text-secondary)', fontWeight: 700 }}>
                {isHi
                  ? `कुल ${filteredProjects.length} उच्च-जोखिम परियोजनाओं में से ${filteredProjects.length === 0 ? 0 : (safePage - 1) * pageSize + 1} से ${Math.min(safePage * pageSize, filteredProjects.length)} प्रदर्शित`
                  : `Showing ${filteredProjects.length === 0 ? 0 : (safePage - 1) * pageSize + 1} to ${Math.min(safePage * pageSize, filteredProjects.length)} of ${filteredProjects.length} high-risk projects`}
              </div>

              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Previous Button */}
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    document.getElementById('high-risk-projects-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  style={{
                    padding: '0.4rem 0.75rem',
                    border: '1.5px solid #1D1E22',
                    borderRadius: 'var(--radius-sm)',
                    background: safePage <= 1 ? '#EAEAEA' : '#FFFFFF',
                    color: safePage <= 1 ? '#888888' : '#1D1E22',
                    cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontWeight: 700,
                    boxShadow: safePage <= 1 ? 'none' : '1px 2px 0px #1D1E22'
                  }}
                >
                  <ChevronLeft size={14} />
                  <span>{isHi ? 'पिछला' : 'Previous'}</span>
                </button>

                {/* Page Number Buttons: 1 | 2 | 3 | ... */}
                {paginationItems.map((item, idx) => {
                  if (item === '...') {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        style={{
                          padding: '0 0.35rem',
                          color: '#1D1E22',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          userSelect: 'none'
                        }}
                      >
                        ...
                      </span>
                    );
                  }

                  const isActive = item === safePage;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setCurrentPage(item);
                        document.getElementById('high-risk-projects-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      style={{
                        minWidth: '34px',
                        height: '34px',
                        padding: '0 0.45rem',
                        background: isActive ? '#1D1E22' : '#FFFFFF',
                        color: isActive ? '#FFFFFF' : '#1D1E22',
                        border: '1.5px solid #1D1E22',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 800,
                        fontSize: '0.84rem',
                        cursor: isActive ? 'default' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '1px 2px 0px #1D1E22'
                      }}
                    >
                      {item}
                    </button>
                  );
                })}

                {/* Next Button */}
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                    document.getElementById('high-risk-projects-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  style={{
                    padding: '0.4rem 0.75rem',
                    border: '1.5px solid #1D1E22',
                    borderRadius: 'var(--radius-sm)',
                    background: safePage >= totalPages ? '#EAEAEA' : '#FFFFFF',
                    color: safePage >= totalPages ? '#888888' : '#1D1E22',
                    cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontWeight: 700,
                    boxShadow: safePage >= totalPages ? 'none' : '1px 2px 0px #1D1E22'
                  }}
                >
                  <span>{isHi ? 'अगला' : 'Next'}</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer hideCTAButtons={true} />
    </div>
  );
}
