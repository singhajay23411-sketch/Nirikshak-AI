import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building, Users, DollarSign, TrendingUp, CheckCircle,
  Award, AlertTriangle, Search, Filter, Calendar, MapPin, CreditCard,
  Layers, BarChart2, PieChart, Activity, X, Clock, ExternalLink
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../LanguageSwitcher';
import { getStateBySlug, ALL_STATES_PERFORMANCE } from '../../data/statePerformanceData';
import Footer from '../Footer';

const StateDetailView = () => {
  const { stateSlug } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'mps' | 'projects'
  const [mpSearch, setMpSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [projectTypeFilter, setProjectTypeFilter] = useState('all'); // 'all' | 'completed' | 'recommended'
  const [hoveredMonth, setHoveredMonth] = useState(null);
  const [selectedPaymentProject, setSelectedPaymentProject] = useState(null);

  // Retrieve current state data
  const stateData = useMemo(() => {
    const data = getStateBySlug(stateSlug);
    if (data) return data;
    // Default fallback to Bihar if slug is not matched
    return ALL_STATES_PERFORMANCE.find(s => s.slug === 'bihar') || ALL_STATES_PERFORMANCE[0];
  }, [stateSlug]);

  // Derive MPs list from constituencies dataset
  const stateMpsList = useMemo(() => {
    if (!stateData || !stateData.constituencies) return [];
    return stateData.constituencies.map((c, index) => {
      const isTop = index % 3 === 0;
      const isLow = index % 7 === 0 && index !== 0;
      const util = isTop ? 88.5 - (index % 4) : isLow ? 62.4 + (index % 5) : 76.2 + (index % 6);
      const allocatedCr = 5.0;
      const utilizedCr = Number(((allocatedCr * util) / 100).toFixed(2));
      const worksRec = 20 + (index % 8);
      const worksDone = Math.round((worksRec * (util - 4)) / 100);

      let status = 'Good';
      let statusColor = '#1E7E34';
      let statusBg = '#E8F5E9';
      if (util >= 82) {
        status = 'High Performer';
        statusColor = '#1E7E34';
        statusBg = '#E8F5E9';
      } else if (util < 70) {
        status = 'Needs Review';
        statusColor = '#D9534F';
        statusBg = '#FFEBEE';
      } else {
        status = 'Average';
        statusColor = '#B8860B';
        statusBg = '#FFF8E1';
      }

      return {
        sno: c.sno || index + 1,
        constituency: c.name,
        constituencyHi: c.nameHi || c.name,
        mpName: `${c.name} Representative MP`,
        allocatedCr,
        utilizedCr,
        utilizationPct: Number(util.toFixed(1)),
        worksRecommended: worksRec,
        worksCompleted: worksDone,
        status,
        statusColor,
        statusBg
      };
    });
  }, [stateData]);

  // Filtered MPs
  const filteredMps = useMemo(() => {
    if (!mpSearch.trim()) return stateMpsList;
    const q = mpSearch.toLowerCase();
    return stateMpsList.filter(mp =>
      mp.constituency.toLowerCase().includes(q) ||
      mp.constituencyHi.includes(q) ||
      mp.mpName.toLowerCase().includes(q)
    );
  }, [stateMpsList, mpSearch]);

  // State-specific projects mock dataset
  const stateProjectsList = useMemo(() => {
    if (!stateData || !stateData.constituencies) return [];
    const categories = ['Roads & Pathways', 'Renewable Energy', 'Education & Schools', 'Drinking Water', 'Community Hall'];
    const agencies = [
      'DISTRICT PLANNING OFFICE',
      'RURAL DEVELOPMENT AGENCY',
      'PUBLIC WORKS DEPARTMENT',
      'MUNICIPAL CORPORATION'
    ];

    const list = [];
    stateData.constituencies.slice(0, 16).forEach((c, idx) => {
      list.push({
        id: `MPLADS-${stateData.slug.toUpperCase()}-${idx + 1}-A`,
        title: `Installation of Solar High-Mast Lights & Community Wells in ${c.name}`,
        category: categories[idx % categories.length],
        cost: 2500000 + (idx * 350000),
        agency: `${stateData.state.toUpperCase()} (${agencies[idx % agencies.length]})`,
        date: `${10 + (idx % 18)} Nov 2024`,
        constituency: c.name,
        type: idx % 4 === 0 ? 'recommended' : 'completed',
        disbursed: idx % 4 === 0 ? 0 : 2500000 + (idx * 350000),
        installments: idx % 4 === 0 ? 0 : 3,
        status: idx % 4 === 0 ? 'Under Technical Scrutiny' : 'Completed & Verified'
      });
      list.push({
        id: `MPLADS-${stateData.slug.toUpperCase()}-${idx + 1}-B`,
        title: `Construction of Modern Science Lab & Library in ${c.name} Senior Secondary School`,
        category: 'Education & Schools',
        cost: 1800000 + (idx * 200000),
        agency: `${stateData.state.toUpperCase()} (${agencies[(idx + 1) % agencies.length]})`,
        date: `${5 + (idx % 20)} Jan 2025`,
        constituency: c.name,
        type: 'completed',
        disbursed: 1800000 + (idx * 200000),
        installments: 2,
        status: 'Completed & Verified'
      });
    });
    return list;
  }, [stateData]);

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return stateProjectsList.filter(p => {
      if (projectTypeFilter === 'completed' && p.type !== 'completed') return false;
      if (projectTypeFilter === 'recommended' && p.type !== 'recommended') return false;
      if (projectSearch.trim()) {
        const q = projectSearch.toLowerCase();
        return p.title.toLowerCase().includes(q) || p.constituency.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [stateProjectsList, projectTypeFilter, projectSearch]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minHeight: '100vh', width: '100%', maxWidth: '1440px', margin: '0 auto', padding: '0 1rem' }}>
      {/* ─── 1. TOP NAVIGATION / BACK BUTTON & LANGUAGE SWITCHER ─── */}
      <div style={{ paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => navigate('/features/browseState')}
          className="btn-outline-dark"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
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
          <span>{isHi ? 'सभी राज्यों पर वापस जाएं' : 'Back to All States'}</span>
        </button>

        <LanguageSwitcher />
      </div>

      {/* ─── 2. STATE HEADER & HERO ─── */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1.5px solid #1D1E22',
          borderRadius: 'var(--radius-md)',
          boxShadow: '3px 4px 0px #1D1E22',
          padding: '1.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
            <span
              style={{
                padding: '0.2rem 0.65rem',
                background: '#FAF8F3',
                border: '1.2px solid #1D1E22',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#0A2458'
              }}
            >
              NATIONAL RANK #{stateData.rank}
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
              {stateData.type}
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-serif-primary)',
              fontSize: 'clamp(2rem, 3.2vw, 2.5rem)',
              fontWeight: 800,
              color: '#1D1E22',
              margin: '0 0 0.35rem 0',
              lineHeight: 1.2
            }}
          >
            {isHi ? (stateData.stateHi || stateData.state) : stateData.state}
          </h1>

          <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', margin: 0 }}>
            {isHi
              ? 'विस्तृत एमपीलैड्स प्रदर्शन, वित्तीय आवंटन एवं सांसद-वार डिलीवरी रिपोर्ट'
              : 'Detailed MPLADS performance, parliamentary expenditure intelligence & constituency works delivery'}
          </p>
        </div>

        {/* Action / Performance Badge */}
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.2rem',
              background: stateData.performanceCategory === 'High' ? '#E8F5E9' : stateData.performanceCategory === 'Needs Improvement' ? '#FFEBEE' : '#FFF8E1',
              border: `1.5px solid ${stateData.performanceCategory === 'High' ? '#1E7E34' : stateData.performanceCategory === 'Needs Improvement' ? '#D9534F' : '#E5B842'}`,
              borderRadius: 'var(--radius-md)',
              boxShadow: '2px 2px 0px #1D1E22'
            }}
          >
            <Award size={18} color={stateData.performanceCategory === 'High' ? '#1E7E34' : stateData.performanceCategory === 'Needs Improvement' ? '#D9534F' : '#B8860B'} />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1D1E22' }}>
              {stateData.performanceCategory.toUpperCase()} PERFORMER
            </span>
          </div>
        </div>
      </div>

      {/* ─── 3. STATE LEVEL KPI CARDS (4 CARDS) ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem'
        }}
      >
        {/* Total MPs */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-md)',
            boxShadow: '3px 4px 0px #1D1E22',
            padding: '1.4rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-sm)',
              background: '#FAF8F3',
              border: '1.2px solid #1D1E22',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Users size={22} color="#0A2458" />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {isHi ? 'कुल सांसद सीटें' : 'TOTAL MPS'}
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1D1E22', lineHeight: 1.15, marginTop: '0.2rem' }}>
              {stateData.mpCount}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
              {isHi ? 'लोकसभा निर्वाचन क्षेत्र' : 'Lok Sabha Constituencies'}
            </div>
          </div>
        </div>

        {/* Total Allocated */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-md)',
            boxShadow: '3px 4px 0px #1D1E22',
            padding: '1.4rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-sm)',
              background: '#FAF8F3',
              border: '1.2px solid #1D1E22',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <DollarSign size={22} color="#0A2458" />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {isHi ? 'कुल आवंटित राशि' : 'TOTAL ALLOCATED'}
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1D1E22', lineHeight: 1.15, marginTop: '0.2rem' }}>
              ₹{stateData.totalAllocatedCr} <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>CR</span>
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
              ₹5.0 Cr per MP / Cycle
            </div>
          </div>
        </div>

        {/* Fund Utilization */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-md)',
            boxShadow: '3px 4px 0px #1D1E22',
            padding: '1.4rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-sm)',
              background: '#FAF8F3',
              border: '1.2px solid #1D1E22',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <TrendingUp size={22} color="#1E7E34" />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {isHi ? 'फंड उपयोग दर' : 'FUND UTILIZATION'}
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1E7E34', lineHeight: 1.15, marginTop: '0.2rem' }}>
              {stateData.utilizationPct}%
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1E7E34', marginTop: '0.2rem' }}>
              ₹{stateData.totalUtilizedCr} Cr Disbursed
            </div>
          </div>
        </div>

        {/* Works Completed */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-md)',
            boxShadow: '3px 4px 0px #1D1E22',
            padding: '1.4rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-sm)',
              background: '#FAF8F3',
              border: '1.2px solid #1D1E22',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <CheckCircle size={22} color="#52B79A" />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {isHi ? 'पूर्ण कार्य' : 'WORKS COMPLETED'}
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1D1E22', lineHeight: 1.15, marginTop: '0.2rem' }}>
              {stateData.worksCompleted}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52B79A', marginTop: '0.2rem' }}>
              {stateData.completionPct}% of {stateData.worksRecommended} Works
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. TABS NAVIGATION (OVERVIEW | MPS PERFORMANCE | PROJECTS) ─── */}
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
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <Activity size={16} />
          <span>{isHi ? 'अवलोकन' : 'Overview'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mps')}
          style={{
            padding: '0.75rem 1.75rem',
            fontSize: '0.92rem',
            fontWeight: 800,
            borderTopLeftRadius: 'var(--radius-md)',
            borderTopRightRadius: 'var(--radius-md)',
            border: '1.5px solid #1D1E22',
            borderBottom: activeTab === 'mps' ? '2px solid #FAF8F3' : '1.5px solid #1D1E22',
            background: activeTab === 'mps' ? '#FAF8F3' : '#FFFFFF',
            color: activeTab === 'mps' ? '#0A2458' : '#6C757D',
            marginBottom: '-2px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <Users size={16} />
          <span>{isHi ? 'सांसद प्रदर्शन' : 'MPs Performance'}</span>
          <span style={{ fontSize: '0.75rem', background: '#FAF8F3', border: '1px solid #1D1E22', padding: '0.1rem 0.45rem', borderRadius: 'var(--radius-full)' }}>
            {stateData.mpCount}
          </span>
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
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <Layers size={16} />
          <span>{isHi ? 'परियोजनाएं' : 'Projects'}</span>
          <span style={{ fontSize: '0.75rem', background: '#FAF8F3', border: '1px solid #1D1E22', padding: '0.1rem 0.45rem', borderRadius: 'var(--radius-full)' }}>
            {stateProjectsList.length}
          </span>
        </button>
      </div>

      {/* ─── 5. TAB 1: OVERVIEW CONTENT ─── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            {/* Chart 1: Interactive Monthly Trend Bar Chart */}
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
              {/* Header & Legend */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: '#1D1E22' }}>
                    {isHi ? 'मासिक फंड संवितरण एवं उपयोग ट्रेंड' : 'Monthly Fund Release & Expenditure Trend'}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                    FY 2024–25 Cumulative (₹ in Crores)
                  </div>
                </div>

                {/* Top-Right Legend */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    background: '#FAF8F3',
                    border: '1px solid #1D1E22',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.78rem',
                    fontWeight: 700
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1D1E22' }}>
                    <span style={{ width: '12px', height: '12px', background: '#52B79A', borderRadius: '3px', border: '1px solid #1D1E22', display: 'inline-block' }} />
                    {isHi ? 'आवंटित' : 'Allocated'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1D1E22' }}>
                    <span style={{ width: '12px', height: '12px', background: '#0A2458', borderRadius: '3px', border: '1px solid #1D1E22', display: 'inline-block' }} />
                    {isHi ? 'व्यय' : 'Utilized'}
                  </span>
                </div>
              </div>

              {/* Responsive SVG Bar Chart with Dynamic Headroom Scaling */}
              {(() => {
                const maxValRaw = Math.max(
                  ...stateData.monthlyTrend.map(m => Math.max(m.allocatedCr, m.spentCr)),
                  10
                );
                // Headroom calculation: ~15% headroom above highest value
                const yHeadroom = maxValRaw * 1.15;
                const yStep = Math.max(10, Math.ceil(yHeadroom / 4 / 10) * 10);
                const yMax = yStep * 4;
                const yTicks = [yMax, yStep * 3, yStep * 2, yStep, 0];

                const chartWidth = 720;
                const chartHeight = 270;
                const plotLeft = 65;
                const plotRight = 705;
                const plotTop = 20;
                const plotBottom = 225;
                const plotH = plotBottom - plotTop;
                const plotW = plotRight - plotLeft;
                const slotW = plotW / 12;
                const barWidth = 14;
                const barGap = 3;

                return (
                  <div style={{ position: 'relative', width: '100%', height: '280px' }}>
                    <svg
                      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                      style={{ width: '100%', height: '100%', overflow: 'visible' }}
                    >
                      {/* Horizontal Grid lines and Y-Axis labels */}
                      {yTicks.map((val) => {
                        const y = plotBottom - (val / yMax) * plotH;
                        return (
                          <g key={val}>
                            <line
                              x1={plotLeft}
                              y1={y}
                              x2={plotRight}
                              y2={y}
                              stroke={val === 0 ? '#1D1E22' : 'rgba(29, 30, 34, 0.08)'}
                              strokeWidth={val === 0 ? '1.5' : '1'}
                              strokeDasharray={val === 0 ? 'none' : '4 4'}
                            />
                            <text
                              x={plotLeft - 10}
                              y={y + 4}
                              textAnchor="end"
                              fontSize="10.5"
                              fontWeight="700"
                              fill="var(--color-text-muted)"
                            >
                              ₹{val} Cr
                            </text>
                          </g>
                        );
                      })}

                      {/* Grouped Bars per Month */}
                      {stateData.monthlyTrend.map((m, idx) => {
                        const slotCenterX = plotLeft + idx * slotW + slotW / 2;
                        const allocH = Math.max(2, (m.allocatedCr / yMax) * plotH);
                        const spentH = Math.max(2, (m.spentCr / yMax) * plotH);
                        const isHovered = hoveredMonth === idx;

                        const allocX = slotCenterX - barWidth - barGap / 2;
                        const spentX = slotCenterX + barGap / 2;

                        return (
                          <g
                            key={m.month}
                            onMouseEnter={() => setHoveredMonth(idx)}
                            onMouseLeave={() => setHoveredMonth(null)}
                            style={{ cursor: 'pointer' }}
                          >
                            {/* Hover Column Background Highlight */}
                            {isHovered && (
                              <rect
                                x={slotCenterX - slotW / 2 + 3}
                                y={plotTop}
                                width={slotW - 6}
                                height={plotH}
                                fill="rgba(82, 183, 154, 0.08)"
                                rx="4"
                              />
                            )}

                            {/* Allocated Bar (Teal) */}
                            <rect
                              x={allocX}
                              y={plotBottom - allocH}
                              width={barWidth}
                              height={allocH}
                              fill={isHovered ? '#40916C' : '#52B79A'}
                              stroke="#1D1E22"
                              strokeWidth="1.2"
                              rx="3"
                              className="trend-bar-grow"
                            />

                            {/* Utilized Bar (Navy) */}
                            <rect
                              x={spentX}
                              y={plotBottom - spentH}
                              width={barWidth}
                              height={spentH}
                              fill={isHovered ? '#14367B' : '#0A2458'}
                              stroke="#1D1E22"
                              strokeWidth="1.2"
                              rx="3"
                              className="trend-bar-grow"
                            />

                            {/* Month Label on X-Axis */}
                            <text
                              x={slotCenterX}
                              y={plotBottom + 22}
                              textAnchor="middle"
                              fontSize="11"
                              fontWeight={isHovered ? '800' : '600'}
                              fill={isHovered ? '#0A2458' : '#1D1E22'}
                              style={{ transition: 'fill 0.15s ease' }}
                            >
                              {m.month}
                            </text>
                          </g>
                        );
                      })}
                    </svg>

                    {/* Premium Clean Hover Tooltip */}
                    {hoveredMonth !== null && (() => {
                      const item = stateData.monthlyTrend[hoveredMonth];
                      const totalMonths = stateData.monthlyTrend.length;
                      const leftPct = ((hoveredMonth + 0.5) / totalMonths) * 100;
                      const monthNames = {
                        Apr: 'April', May: 'May', Jun: 'June', Jul: 'July',
                        Aug: 'August', Sep: 'September', Oct: 'October', Nov: 'November',
                        Dec: 'December', Jan: 'January', Feb: 'February', Mar: 'March'
                      };
                      const fullMonth = monthNames[item.month] || item.month;
                      const utilRatio = ((item.spentCr / item.allocatedCr) * 100).toFixed(1);

                      return (
                        <div
                          style={{
                            position: 'absolute',
                            top: '15px',
                            left: `${Math.max(14, Math.min(86, leftPct))}%`,
                            transform: 'translateX(-50%)',
                            background: '#FFFFFF',
                            border: '1.5px solid #1D1E22',
                            borderRadius: 'var(--radius-sm)',
                            boxShadow: '3px 4px 0px #1D1E22',
                            padding: '0.75rem 1rem',
                            fontSize: '0.78rem',
                            zIndex: 20,
                            pointerEvents: 'none',
                            minWidth: '175px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <div style={{ fontWeight: 800, color: '#1D1E22', borderBottom: '1px solid rgba(29,30,34,0.1)', paddingBottom: '0.35rem', marginBottom: '0.45rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{fullMonth}</span>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1E7E34' }}>{utilRatio}% Spent</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.25rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-secondary)' }}>
                              <span style={{ width: '8px', height: '8px', background: '#52B79A', borderRadius: '2px', display: 'inline-block' }} />
                              Allocated:
                            </span>
                            <strong style={{ color: '#1D1E22' }}>₹{item.allocatedCr} Cr</strong>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-secondary)' }}>
                              <span style={{ width: '8px', height: '8px', background: '#0A2458', borderRadius: '2px', display: 'inline-block' }} />
                              Utilized:
                            </span>
                            <strong style={{ color: '#0A2458' }}>₹{item.spentCr} Cr</strong>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}
            </div>

            {/* Chart 2: MP Performance Distribution */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #1D1E22',
                borderRadius: 'var(--radius-md)',
                boxShadow: '3px 4px 0px #1D1E22',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.2rem 0', color: '#1D1E22' }}>
                  {isHi ? 'सांसदों का प्रदर्शन विभाजन' : 'MP Delivery & Performance Tiers'}
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                  Breakdown across {stateData.mpCount} constituencies
                </div>
              </div>

              {/* 3 Tier Progress Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', margin: '1.5rem 0' }}>
                {/* High Performers */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1E7E34' }}>
                      <span style={{ width: '10px', height: '10px', background: '#1E7E34', borderRadius: '50%', display: 'inline-block' }} />
                      High Performers (&gt; 80% Utilization)
                    </span>
                    <span style={{ color: '#1D1E22' }}>{stateData.highMps} MPs</span>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: '#F3EFE6', borderRadius: '5px', overflow: 'hidden', border: '1px solid #1D1E22' }}>
                    <div style={{ width: `${(stateData.highMps / stateData.mpCount) * 100}%`, height: '100%', background: '#1E7E34' }} />
                  </div>
                </div>

                {/* Average Performers */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#B8860B' }}>
                      <span style={{ width: '10px', height: '10px', background: '#E5B842', borderRadius: '50%', display: 'inline-block' }} />
                      Average Performers (70% - 80%)
                    </span>
                    <span style={{ color: '#1D1E22' }}>{stateData.avgMps} MPs</span>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: '#F3EFE6', borderRadius: '5px', overflow: 'hidden', border: '1px solid #1D1E22' }}>
                    <div style={{ width: `${(stateData.avgMps / stateData.mpCount) * 100}%`, height: '100%', background: '#E5B842' }} />
                  </div>
                </div>

                {/* Needs Improvement */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#D9534F' }}>
                      <span style={{ width: '10px', height: '10px', background: '#D9534F', borderRadius: '50%', display: 'inline-block' }} />
                      Needs Improvement (&lt; 70%)
                    </span>
                    <span style={{ color: '#1D1E22' }}>{stateData.lowMps} MPs</span>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: '#F3EFE6', borderRadius: '5px', overflow: 'hidden', border: '1px solid #1D1E22' }}>
                    <div style={{ width: `${(stateData.lowMps / stateData.mpCount) * 100}%`, height: '100%', background: '#D9534F' }} />
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', background: '#FAF8F3', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(29,30,34,0.1)' }}>
                💡 <strong>Audit Insight:</strong> Top performing MPs in {stateData.state} achieved an average work completion turnaround of 6.2 months.
              </div>
            </div>
          </div>

          {/* Financial Breakdown Section (4 Cards) */}
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.35rem', fontWeight: 800, margin: '0 0 1rem 0', color: '#1D1E22' }}>
              {isHi ? 'वित्तीय विवरण एवं संवितरण स्थिति' : 'Financial Breakdown & Disbursal Status'}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              {/* Total Sanctioned */}
              <div style={{ background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: '2px 3px 0px #1D1E22' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>TOTAL SANCTIONED</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1D1E22', margin: '0.35rem 0' }}>₹{stateData.totalAllocatedCr} Cr</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>100% of Central Budget</div>
              </div>

              {/* Total Released */}
              <div style={{ background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: '2px 3px 0px #1D1E22' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>TOTAL RELEASED</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0A2458', margin: '0.35rem 0' }}>₹{stateData.totalReleasedCr} Cr</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>94.0% Released to Dist Authorities</div>
              </div>

              {/* Total Utilized */}
              <div style={{ background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: '2px 3px 0px #1D1E22' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>TOTAL UTILIZED</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1E7E34', margin: '0.35rem 0' }}>₹{stateData.totalUtilizedCr} Cr</div>
                <div style={{ fontSize: '0.75rem', color: '#1E7E34', fontWeight: 700 }}>{stateData.utilizationPct}% Net Expenditure</div>
              </div>

              {/* Unspent Balance */}
              <div style={{ background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: '2px 3px 0px #1D1E22' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>UNSPENT BALANCE</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D9534F', margin: '0.35rem 0' }}>₹{stateData.unspentCr} Cr</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Available for Ongoing Works</div>
              </div>
            </div>
          </div>

          {/* Sector-wise Allocation */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #1D1E22',
              borderRadius: 'var(--radius-md)',
              boxShadow: '3px 4px 0px #1D1E22',
              padding: '1.5rem'
            }}
          >
            <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.2rem', fontWeight: 800, margin: '0 0 1.25rem 0', color: '#1D1E22' }}>
              {isHi ? 'क्षेत्र-वार व्यय वितरण' : 'Sector-wise Expenditure Distribution'}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
              {stateData.sectorBreakdown.map((sec) => (
                <div key={sec.sector} style={{ background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>{sec.sector}</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1D1E22', margin: '0.25rem 0' }}>{sec.pct}%</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>₹{sec.amountCr} Cr Disbursed</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── 6. TAB 2: MPS PERFORMANCE CONTENT ─── */}
      {activeTab === 'mps' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* MP Search & Filter Bar */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #1D1E22',
              borderRadius: 'var(--radius-md)',
              boxShadow: '3px 4px 0px #1D1E22',
              padding: '1rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div style={{ position: 'relative', flex: '1 1 280px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                value={mpSearch}
                onChange={(e) => setMpSearch(e.target.value)}
                placeholder={isHi ? 'निर्वाचन क्षेत्र या सांसद खोजें...' : 'Search Constituency or MP name...'}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem 0.6rem 2.5rem',
                  fontSize: '0.86rem',
                  border: '1.5px solid #1D1E22',
                  borderRadius: 'var(--radius-sm)',
                  background: '#FAF8F3',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
              Showing {filteredMps.length} of {stateMpsList.length} Constituencies
            </div>
          </div>

          {/* MPs Table */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #1D1E22',
              borderRadius: 'var(--radius-md)',
              boxShadow: '3px 4px 0px #1D1E22',
              overflowX: 'auto'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead>
                <tr style={{ background: '#FAF8F3', borderBottom: '1.5px solid #1D1E22' }}>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>S.No</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Constituency</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Allocated</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Utilized</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Utilization %</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Works Done</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredMps.map((mp) => (
                  <tr key={mp.constituency} style={{ borderBottom: '1px solid rgba(29,30,34,0.08)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>#{mp.sno}</td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.88rem', fontWeight: 800, color: '#1D1E22' }}>
                      {isHi ? mp.constituencyHi : mp.constituency}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: '#1D1E22' }}>₹{mp.allocatedCr} Cr</td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', fontWeight: 700, color: '#1E7E34' }}>₹{mp.utilizedCr} Cr</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, minWidth: '45px' }}>{mp.utilizationPct}%</span>
                        <div style={{ width: '60px', height: '6px', background: '#EAEAEA', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${mp.utilizationPct}%`, height: '100%', background: mp.statusColor }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: '#1D1E22' }}>
                      {mp.worksCompleted} / {mp.worksRecommended}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ padding: '0.25rem 0.65rem', background: mp.statusBg, color: mp.statusColor, border: `1px solid ${mp.statusColor}`, borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 800 }}>
                        {mp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── 7. TAB 3: PROJECTS CONTENT ─── */}
      {activeTab === 'projects' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Project Controls Bar */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #1D1E22',
              borderRadius: 'var(--radius-md)',
              boxShadow: '3px 4px 0px #1D1E22',
              padding: '1rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div style={{ position: 'relative', flex: '1 1 280px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                placeholder={isHi ? 'परियोजना शीर्षक या निर्वाचन क्षेत्र खोजें...' : 'Search project title or constituency...'}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem 0.6rem 2.5rem',
                  fontSize: '0.86rem',
                  border: '1.5px solid #1D1E22',
                  borderRadius: 'var(--radius-sm)',
                  background: '#FAF8F3',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Status Pills */}
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={() => setProjectTypeFilter('all')}
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid #1D1E22',
                  background: projectTypeFilter === 'all' ? '#1D1E22' : '#FAF8F3',
                  color: projectTypeFilter === 'all' ? '#FFFFFF' : '#1D1E22',
                  cursor: 'pointer'
                }}
              >
                {isHi ? 'सभी' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => setProjectTypeFilter('completed')}
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid #1D1E22',
                  background: projectTypeFilter === 'completed' ? '#1D1E22' : '#FAF8F3',
                  color: projectTypeFilter === 'completed' ? '#FFFFFF' : '#1D1E22',
                  cursor: 'pointer'
                }}
              >
                {isHi ? 'पूर्ण कार्य' : 'Completed Works'}
              </button>
              <button
                type="button"
                onClick={() => setProjectTypeFilter('recommended')}
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid #1D1E22',
                  background: projectTypeFilter === 'recommended' ? '#1D1E22' : '#FAF8F3',
                  color: projectTypeFilter === 'recommended' ? '#FFFFFF' : '#1D1E22',
                  cursor: 'pointer'
                }}
              >
                {isHi ? 'अनुशंसित कार्य' : 'Recommended Works'}
              </button>
            </div>
          </div>

          {/* 4-Column Projects Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.25rem'
            }}
          >
            {filteredProjects.map((proj) => (
              <div
                key={proj.id}
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #1D1E22',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '2.5px 3.5px 0px #1D1E22',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.15rem 0.5rem', background: '#F3EFE6', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)' }}>
                      {proj.category}
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: proj.type === 'completed' ? '#1E7E34' : '#B8860B' }}>
                      {proj.status}
                    </span>
                  </div>

                  <h4 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.05rem', fontWeight: 800, color: '#1D1E22', margin: '0 0 0.5rem 0', lineHeight: 1.3 }}>
                    {proj.title}
                  </h4>

                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MapPin size={12} />
                    <span>Constituency: {proj.constituency}</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(29,30,34,0.1)', paddingTop: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>SANCTIONED COST</span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1D1E22' }}>₹{(proj.cost / 100000).toFixed(2)} Lakhs</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{proj.date}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentProject(proj)}
                      className="btn-outline-dark"
                      style={{
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        background: '#FAF8F3',
                        border: '1px solid #1D1E22',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer'
                      }}
                    >
                      <CreditCard size={12} />
                      <span>{isHi ? 'भुगतान' : 'Payments'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── PAYMENTS MODAL ─── */}
      {selectedPaymentProject && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '1rem'
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              border: '2px solid #1D1E22',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '6px 8px 0px #1D1E22',
              width: '100%',
              maxWidth: '520px',
              padding: '1.75rem',
              position: 'relative'
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedPaymentProject(null)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <X size={20} color="#1D1E22" />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <CreditCard size={20} color="#0A2458" />
              <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#1D1E22' }}>
                {isHi ? 'परियोजना संवितरण विवरण' : 'Project Disbursement Details'}
              </h3>
            </div>

            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1D1E22', marginBottom: '1rem', lineHeight: 1.3 }}>
              {selectedPaymentProject.title}
            </div>

            <div style={{ background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Sanctioned Cost:</span>
                <span style={{ fontWeight: 800 }}>₹{(selectedPaymentProject.cost / 100000).toFixed(2)} Lakhs</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Disbursed Till Date:</span>
                <span style={{ fontWeight: 800, color: '#1E7E34' }}>₹{(selectedPaymentProject.disbursed / 100000).toFixed(2)} Lakhs</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Installments Released:</span>
                <span style={{ fontWeight: 800 }}>{selectedPaymentProject.installments} Installments</span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setSelectedPaymentProject(null)}
                className="btn-teal"
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
              >
                {isHi ? 'बंद करें' : 'Close Details'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── FOOTER ─── */}
      <Footer hideCTAButtons={true} />

      {/* Chart Styles & Micro-Animations */}
      <style>{`
        .trend-bar-grow {
          transform-origin: bottom;
          animation: trendBarAppear 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transition: fill 0.15s ease, opacity 0.15s ease;
        }

        @keyframes trendBarAppear {
          from {
            transform: scaleY(0);
            opacity: 0.2;
          }
          to {
            transform: scaleY(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default StateDetailView;
