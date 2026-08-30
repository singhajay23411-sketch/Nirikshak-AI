import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitCompare, User, MapPin, X, Plus, Search, Download, Info,
  TrendingUp, CheckCircle2, DollarSign, Award, Layers, BarChart3,
  Check, ArrowRight, ShieldCheck, ChevronDown
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { ALL_MPS_DATA } from '../../data/mpPerformanceData';
import Footer from '../Footer';

const METRICS = [
  { id: 'utilization', label: 'Fund Utilization', unit: '%', isPct: true, color: '#52B79A', maxVal: 100 },
  { id: 'completion', label: 'Completion Rate', unit: '%', isPct: true, color: '#7B2CBF', maxVal: 100 },
  { id: 'works', label: 'Works Completed', unit: 'Works', isPct: false, color: '#1E7E34' },
  { id: 'allocated', label: 'Allocated Amount', unit: 'CR', isCurrency: true, color: '#0077B6' },
  { id: 'spent', label: 'Total Expenditure', unit: 'CR', isCurrency: true, color: '#0A2458' }
];

const CompareView = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isHi = language === 'hi';

  // Selected MPs IDs (start empty or with 2 default notable MPs)
  const [selectedMpIds, setSelectedMpIds] = useState([]);
  const [activeMetric, setActiveMetric] = useState('utilization');
  const [selectedFiscalYear, setSelectedFiscalYear] = useState('2024-25');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  // Selected MP objects
  const selectedMps = useMemo(() => {
    return selectedMpIds
      .map(id => ALL_MPS_DATA.find(m => m.id === id))
      .filter(Boolean);
  }, [selectedMpIds]);

  // Candidates for search dropdown
  const availableCandidates = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return ALL_MPS_DATA.filter(m => !selectedMpIds.includes(m.id))
      .filter(m => {
        if (!q) return true;
        return (
          m.name.toLowerCase().includes(q) ||
          m.constituency.toLowerCase().includes(q) ||
          m.state.toLowerCase().includes(q) ||
          m.house.toLowerCase().includes(q)
        );
      })
      .slice(0, 8);
  }, [selectedMpIds, searchQuery]);

  const handleAddMp = (id) => {
    if (selectedMpIds.length >= 4) return;
    if (!selectedMpIds.includes(id)) {
      setSelectedMpIds(prev => [...prev, id]);
    }
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const handleRemoveMp = (id) => {
    setSelectedMpIds(prev => prev.filter(mId => mId !== id));
  };

  const handleClearAll = () => {
    setSelectedMpIds([]);
    setIsSearchOpen(false);
  };

  // Dynamic Comparison Summary Calculations
  const comparisonSummary = useMemo(() => {
    if (selectedMps.length === 0) return null;
    const totalAlloc = selectedMps.reduce((acc, m) => acc + m.allocatedCr, 0);
    const totalSpent = selectedMps.reduce((acc, m) => acc + m.spentCr, 0);
    const avgUtil = totalAlloc > 0 ? ((totalSpent / totalAlloc) * 100).toFixed(1) : 0;
    const totalWorks = selectedMps.reduce((acc, m) => acc + m.worksCompleted, 0);

    return {
      count: selectedMps.length,
      totalAllocCr: totalAlloc.toFixed(1),
      totalSpentCr: totalSpent.toFixed(1),
      avgUtilPct: avgUtil,
      totalWorks
    };
  }, [selectedMps]);

  // Current active metric metadata
  const currentMetricObj = useMemo(() => {
    return METRICS.find(m => m.id === activeMetric) || METRICS[0];
  }, [activeMetric]);

  // Export CSV of Comparison
  const handleExportComparison = () => {
    if (selectedMps.length === 0) return;
    const headers = 'MP Name,Tenure,House,State,Constituency,Allocated (Cr),Spent (Cr),Utilization (%),Works Completed,Completion Rate (%)\n';
    const rows = selectedMps.map(m =>
      `"${m.name}","${m.term}","${m.house}","${m.state}","${m.constituency}",${m.allocatedCr},${m.spentCr},${m.utilizationPct},${m.worksCompleted},${m.completionRate}`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `MPLADS_Compare_${selectedMps.length}_MPs.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minHeight: '100vh', width: '100%', maxWidth: '1440px', margin: '0 auto', padding: '0 1rem' }}>
      {/* ─── 1. BREADCRUMB ─── */}
      <div style={{ paddingTop: '1.25rem', borderBottom: '1px solid rgba(29,30,34,0.08)', paddingBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Home</span>
          <span>/</span>
          <span>MPLADS</span>
          <span>/</span>
          <span style={{ color: '#0A2458', fontWeight: 700 }}>Compare</span>
        </div>
      </div>

      {/* ─── 2. PAGE HEADER ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-serif-primary)',
              fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
              fontWeight: 800,
              color: '#1D1E22',
              margin: '0 0 0.35rem 0',
              lineHeight: 1.2
            }}
          >
            {isHi ? 'निर्वाचन क्षेत्र तुलना' : 'Compare Constituencies'}
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', margin: 0 }}>
            {isHi
              ? 'विभिन्न निर्वाचन क्षेत्रों और सांसदों के बीच प्रदर्शन और फंड उपयोग की तुलना करें'
              : 'Compare performance and fund utilization across different constituencies and MPs'}
          </p>
        </div>
      </div>

      {/* ─── 3. MP SELECTION SECTION (MAX 4) ─── */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1.5px solid #1D1E22',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '3px 4px 0px #1D1E22',
          padding: '1.5rem 1.75rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.25rem', fontWeight: 800, color: '#1D1E22', margin: 0 }}>
              Select MPs to Compare (Max 4)
            </h3>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.5rem', background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-full)', color: '#0A2458' }}>
              {selectedMps.length} / 4 Selected
            </span>
          </div>

          {selectedMps.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#D9534F',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Clear All
            </button>
          )}
        </div>

        {/* Selected MP Chips / Slots Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
            gap: '1rem',
            alignItems: 'stretch'
          }}
        >
          {/* Selected MP Cards */}
          {selectedMps.map((mp, index) => (
            <div
              key={mp.id}
              style={{
                background: '#FAF8F3',
                border: '1.5px solid #1D1E22',
                borderRadius: 'var(--radius-md)',
                boxShadow: '2px 3px 0px #1D1E22',
                padding: '1rem',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: index === 0 ? '#1A73E8' : index === 1 ? '#52B79A' : index === 2 ? '#E5B842' : '#7B2CBF',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 800,
                    fontSize: '0.85rem'
                  }}
                >
                  {index + 1}
                </div>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '0.98rem', fontWeight: 800, margin: '0 0 0.15rem 0', color: '#1D1E22', lineHeight: 1.25 }}>
                    {mp.name}
                  </h4>
                  <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MapPin size={11} />
                    <span>{mp.state}</span>
                    <span>•</span>
                    <span style={{ fontWeight: 700, color: '#0A2458' }}>{mp.house}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1E7E34', marginTop: '0.2rem' }}>
                    Utilized: {mp.utilizationPct}% (₹{mp.spentCr} Cr)
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveMp(mp.id)}
                title="Remove MP"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #1D1E22',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <X size={13} color="#1D1E22" />
              </button>
            </div>
          ))}

          {/* Add MP Trigger Button (Active when < 4) */}
          {selectedMps.length < 4 && (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                style={{
                  width: '100%',
                  minHeight: '85px',
                  height: '100%',
                  background: isSearchOpen ? '#FAF8F3' : '#FFFFFF',
                  border: '1.5px dashed #1D1E22',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  color: '#0A2458',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Plus size={18} strokeWidth={2.4} />
                <span>{selectedMps.length === 0 ? 'Select first MP/Constituency' : selectedMps.length === 1 ? 'Select second to compare' : 'Add MP'}</span>
              </button>

              {/* Search Dropdown Modal/Menu */}
              {isSearchOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    width: '100%',
                    minWidth: 'min(100%, 300px)',
                    maxWidth: 'calc(100vw - 32px)',
                    background: '#FFFFFF',
                    border: '1.5px solid #1D1E22',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '4px 6px 0px #1D1E22',
                    zIndex: 100,
                    padding: '0.85rem'
                  }}
                >
                  <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                    <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                      type="text"
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search MP name, state, or house..."
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                        fontSize: '0.84rem',
                        border: '1.2px solid #1D1E22',
                        borderRadius: 'var(--radius-sm)',
                        background: '#FAF8F3',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {availableCandidates.length === 0 ? (
                      <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        No matching MPs found
                      </div>
                    ) : (
                      availableCandidates.map(candidate => (
                        <div
                          key={candidate.id}
                          onClick={() => handleAddMp(candidate.id)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'background 0.12s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#FAF8F3'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1D1E22' }}>{candidate.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                              {candidate.state} • {candidate.house} ({candidate.term})
                            </div>
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1E7E34' }}>
                            {candidate.utilizationPct}%
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── 4. COMPARISON DASHBOARD OR EMPTY STATE ─── */}
      {selectedMps.length === 0 ? (
        /* Empty State */
        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '3px 4px 0px #1D1E22',
            padding: '4rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FAF8F3', border: '1.5px solid #1D1E22', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <BarChart3 size={28} color="#0A2458" />
          </div>
          <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.65rem', fontWeight: 800, color: '#1D1E22', margin: '0 0 0.5rem 0' }}>
            Start Comparing
          </h3>
          <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', maxWidth: '440px', margin: '0 0 1.5rem 0', lineHeight: 1.4 }}>
            Select MPs from the search above to compare their performance and fund utilization side-by-side.
          </p>
          <button
            type="button"
            onClick={() => {
              if (ALL_MPS_DATA.length >= 2) {
                setSelectedMpIds([ALL_MPS_DATA[0].id, ALL_MPS_DATA[1].id]);
              }
            }}
            className="btn-teal"
            style={{ padding: '0.65rem 1.6rem', fontSize: '0.88rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <Plus size={16} strokeWidth={2.4} />
            <span>Add First MP (Quick Compare)</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Comparison Overview KPI Cards (when >= 2 MPs) */}
          {comparisonSummary && selectedMps.length >= 2 && (
            <div
              style={{
                background: '#FAF8F3',
                border: '1.5px solid #1D1E22',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '3px 4px 0px #1D1E22',
                padding: '1.5rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
                gap: '1.25rem'
              }}
            >
              {/* MPs Selected */}
              <div style={{ background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: '2px 2px 0px #1D1E22' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  MPs SELECTED
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1D1E22', lineHeight: 1.15, marginTop: '0.35rem' }}>
                  {comparisonSummary.count} <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>of 4</span>
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                  Comparative Scope
                </div>
              </div>

              {/* Total Allocated */}
              <div style={{ background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: '2px 2px 0px #1D1E22' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  TOTAL ALLOCATED
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1D1E22', lineHeight: 1.15, marginTop: '0.35rem' }}>
                  ₹{comparisonSummary.totalAllocCr} <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>CR</span>
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                  Combined Budget Pool
                </div>
              </div>

              {/* Total Utilized */}
              <div style={{ background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: '2px 2px 0px #1D1E22' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  TOTAL UTILIZED
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1E7E34', lineHeight: 1.15, marginTop: '0.35rem' }}>
                  ₹{comparisonSummary.totalSpentCr} <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>CR</span>
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#1E7E34', marginTop: '0.25rem' }}>
                  Disbursed Expenditure
                </div>
              </div>

              {/* Average Fund Utilization */}
              <div style={{ background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: '2px 2px 0px #1D1E22' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  AVG. FUND UTILIZATION
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0A2458', lineHeight: 1.15, marginTop: '0.35rem' }}>
                  {comparisonSummary.avgUtilPct}%
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                  Cohort Average
                </div>
              </div>
            </div>
          )}

          {/* ─── 5. PERFORMANCE COMPARISON ANALYTICS CARD ─── */}
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
            {/* Top Toolbar: Metrics Tabs, FY Selector, and Export */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(29,30,34,0.08)', paddingBottom: '1.25rem' }}>
              {/* Metric Buttons */}
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                {METRICS.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActiveMetric(m.id)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      borderRadius: 'var(--radius-sm)',
                      border: '1.2px solid #1D1E22',
                      background: activeMetric === m.id ? '#0A2458' : '#FAF8F3',
                      color: activeMetric === m.id ? '#FFFFFF' : '#1D1E22',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Right Controls: FY Selector & Export */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <select
                  value={selectedFiscalYear}
                  onChange={(e) => setSelectedFiscalYear(e.target.value)}
                  style={{
                    padding: '0.45rem 0.75rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    border: '1.5px solid #1D1E22',
                    borderRadius: 'var(--radius-sm)',
                    background: '#FAF8F3',
                    color: '#1D1E22',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="2024-25">FY 2024–25</option>
                  <option value="2023-24">FY 2023–24</option>
                  <option value="cumulative">Cumulative (2022–28)</option>
                </select>

                <button
                  type="button"
                  onClick={handleExportComparison}
                  className="btn-outline-dark"
                  style={{
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: '#FAF8F3',
                    border: '1.5px solid #1D1E22',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer'
                  }}
                >
                  <Download size={14} />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Dynamic Comparison Bar Chart */}
            {(() => {
              // Extract values for selected metric
              const getVal = (mp) => {
                if (activeMetric === 'utilization') return mp.utilizationPct;
                if (activeMetric === 'completion') return mp.completionRate;
                if (activeMetric === 'works') return mp.worksCompleted;
                if (activeMetric === 'allocated') return mp.allocatedCr;
                if (activeMetric === 'spent') return mp.spentCr;
                return 0;
              };

              const rawMax = Math.max(...selectedMps.map(getVal), currentMetricObj.maxVal || 10);
              const yMax = currentMetricObj.isPct ? 100 : Math.ceil(rawMax * 1.2 / 10) * 10 || 50;
              const yTicks = [yMax, yMax * 0.75, yMax * 0.5, yMax * 0.25, 0];

              const chartW = 700;
              const chartH = 260;
              const plotL = 60;
              const plotR = 670;
              const plotTop = 30;
              const plotBottom = 215;
              const plotWidth = plotR - plotL;
              const plotHeight = plotBottom - plotTop;
              const slotWidth = plotWidth / selectedMps.length;
              const barWidth = Math.min(48, slotWidth * 0.45);

              return (
                <div style={{ position: 'relative', width: '100%', height: '270px' }}>
                  <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    {/* Grid lines and Y-axis labels */}
                    {yTicks.map(val => {
                      const y = plotBottom - (val / yMax) * plotHeight;
                      const label = currentMetricObj.isCurrency
                        ? `₹${val} Cr`
                        : currentMetricObj.isPct
                        ? `${val}%`
                        : `${val}`;

                      return (
                        <g key={val}>
                          <line
                            x1={plotL}
                            y1={y}
                            x2={plotR}
                            y2={y}
                            stroke={val === 0 ? '#1D1E22' : 'rgba(29, 30, 34, 0.08)'}
                            strokeWidth={val === 0 ? '1.5' : '1'}
                            strokeDasharray={val === 0 ? 'none' : '4 4'}
                          />
                          <text
                            x={plotL - 10}
                            y={y + 4}
                            textAnchor="end"
                            fontSize="10"
                            fontWeight="700"
                            fill="var(--color-text-muted)"
                          >
                            {label}
                          </text>
                        </g>
                      );
                    })}

                    {/* Bars for Each MP */}
                    {selectedMps.map((mp, idx) => {
                      const val = getVal(mp);
                      const barH = Math.max(4, (val / yMax) * plotHeight);
                      const slotCenter = plotL + idx * slotWidth + slotWidth / 2;
                      const barX = slotCenter - barWidth / 2;
                      const isHovered = hoveredBarIndex === idx;

                      const colors = ['#1A73E8', '#52B79A', '#E5B842', '#7B2CBF'];
                      const barColor = colors[idx % colors.length];

                      return (
                        <g
                          key={mp.id}
                          onMouseEnter={() => setHoveredBarIndex(idx)}
                          onMouseLeave={() => setHoveredBarIndex(null)}
                          style={{ cursor: 'pointer' }}
                        >
                          {/* Value above bar */}
                          <text
                            x={slotCenter}
                            y={plotBottom - barH - 8}
                            textAnchor="middle"
                            fontSize="11.5"
                            fontWeight="800"
                            fill="#1D1E22"
                          >
                            {currentMetricObj.isCurrency ? `₹${val} Cr` : currentMetricObj.isPct ? `${val}%` : val}
                          </text>

                          {/* Bar Rect */}
                          <rect
                            x={barX}
                            y={plotBottom - barH}
                            width={barWidth}
                            height={barH}
                            fill={barColor}
                            stroke="#1D1E22"
                            strokeWidth="1.2"
                            rx="4"
                            style={{
                              transformOrigin: 'bottom',
                              transition: 'height 0.4s cubic-bezier(0.16, 1, 0.3, 1), fill 0.15s ease'
                            }}
                          />

                          {/* MP Name below Bar */}
                          <text
                            x={slotCenter}
                            y={plotBottom + 20}
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight={isHovered ? '800' : '700'}
                            fill={isHovered ? '#0A2458' : '#1D1E22'}
                          >
                            {mp.name.length > 20 ? mp.name.slice(0, 18) + '…' : mp.name}
                          </text>

                          {/* MP State / House below */}
                          <text
                            x={slotCenter}
                            y={plotBottom + 35}
                            textAnchor="middle"
                            fontSize="9.5"
                            fill="var(--color-text-secondary)"
                          >
                            {mp.state} ({mp.house.slice(0, 2)})
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Tooltip on Hover */}
                  {hoveredBarIndex !== null && (() => {
                    const mp = selectedMps[hoveredBarIndex];
                    const val = getVal(mp);
                    const leftPct = ((hoveredBarIndex + 0.5) / selectedMps.length) * 100;

                    return (
                      <div
                        style={{
                          position: 'absolute',
                          top: '10px',
                          left: `${Math.max(15, Math.min(85, leftPct))}%`,
                          transform: 'translateX(-50%)',
                          background: '#FFFFFF',
                          border: '1.5px solid #1D1E22',
                          borderRadius: 'var(--radius-sm)',
                          boxShadow: '3px 4px 0px #1D1E22',
                          padding: '0.65rem 0.95rem',
                          fontSize: '0.78rem',
                          zIndex: 20,
                          pointerEvents: 'none',
                          minWidth: '160px'
                        }}
                      >
                        <div style={{ fontWeight: 800, color: '#1D1E22', marginBottom: '0.35rem', borderBottom: '1px solid rgba(29,30,34,0.1)', paddingBottom: '0.25rem' }}>
                          {mp.name}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.2rem' }}>
                          <span style={{ color: 'var(--color-text-secondary)' }}>{currentMetricObj.label}:</span>
                          <strong>{currentMetricObj.isCurrency ? `₹${val} Cr` : currentMetricObj.isPct ? `${val}%` : val}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                          <span style={{ color: 'var(--color-text-secondary)' }}>Works Done:</span>
                          <strong>{mp.worksCompleted} / {mp.worksRecommended}</strong>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })()}

            {/* Information Sub-Panel */}
            <div
              style={{
                background: '#FAF8F3',
                border: '1px solid rgba(29,30,34,0.12)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem 1.15rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.82rem',
                color: '#1D1E22'
              }}
            >
              <Info size={18} color="#1A73E8" style={{ flexShrink: 0 }} />
              <div>
                <strong>Comparing performance metrics across selected MPs for FY {selectedFiscalYear}:</strong>{' '}
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  All utilization percentages, sanction milestones, and completed works are cross-referenced with official e-Saksham district nodal registries.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── FOOTER ─── */}
      <Footer hideCTAButtons={true} />
    </div>
  );
};

export default CompareView;
