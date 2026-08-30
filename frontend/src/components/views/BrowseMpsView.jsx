import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Info, Download, LayoutGrid, List, MapPin, CheckCircle2,
  AlertTriangle, ArrowRight, X, TrendingUp, DollarSign, Award,
  Users, Check, ChevronDown, User, Shield
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import {
  ALL_MPS_DATA,
  getMpsSummaryStats,
  mpToSlug
} from '../../data/mpPerformanceData';
import Footer from '../Footer';

const PAGE_SIZE_INCREMENT = 12;

const BrowseMpsView = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isHi = language === 'hi';

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('all'); // 'all' | 'high' | 'avg' | 'low'
  const [selectedHouse, setSelectedHouse] = useState('Rajya Sabha'); // 'Rajya Sabha' | 'Lok Sabha' | 'all'
  const [sortBy, setSortBy] = useState('utilization'); // 'utilization' | 'completion' | 'works' | 'allocated' | 'spent' | 'name' | 'constituency'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [visibleCount, setVisibleCount] = useState(12);

  // Calculate top summary statistics based on current house
  const houseMps = useMemo(() => {
    if (selectedHouse === 'all') return ALL_MPS_DATA;
    return ALL_MPS_DATA.filter(m => m.house === selectedHouse);
  }, [selectedHouse]);

  const summaryStats = useMemo(() => {
    return getMpsSummaryStats(houseMps);
  }, [houseMps]);

  // Filtered and sorted dataset
  const filteredMps = useMemo(() => {
    let list = ALL_MPS_DATA;

    // Filter by House
    if (selectedHouse !== 'all') {
      list = list.filter(m => m.house === selectedHouse);
    }

    // Filter by Tier
    if (selectedTier === 'high') {
      list = list.filter(m => m.utilizationPct >= 70);
    } else if (selectedTier === 'avg') {
      list = list.filter(m => m.utilizationPct >= 40 && m.utilizationPct < 70);
    } else if (selectedTier === 'low') {
      list = list.filter(m => m.utilizationPct < 40);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.constituency.toLowerCase().includes(q) ||
        m.state.toLowerCase().includes(q)
      );
    }

    // Sorting
    return [...list].sort((a, b) => {
      if (sortBy === 'utilization') return b.utilizationPct - a.utilizationPct;
      if (sortBy === 'completion') return b.completionRate - a.completionRate;
      if (sortBy === 'works') return b.worksCompleted - a.worksCompleted;
      if (sortBy === 'allocated') return b.allocatedCr - a.allocatedCr;
      if (sortBy === 'spent') return b.spentCr - a.spentCr;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'constituency') return a.constituency.localeCompare(b.constituency);
      return 0;
    });
  }, [selectedHouse, selectedTier, searchQuery, sortBy]);

  const displayedMps = useMemo(() => {
    return filteredMps.slice(0, visibleCount);
  }, [filteredMps, visibleCount]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedHouse !== 'all') count++;
    if (selectedTier !== 'all') count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [selectedHouse, selectedTier, searchQuery]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedTier('all');
    setSelectedHouse('all');
    setSortBy('utilization');
    setVisibleCount(12);
  };

  const handleExport = () => {
    const csvHeader = 'Name,Term,House,State,Constituency,Allocated (Cr),Spent (Cr),Utilization (%),Works Completed,Completion Rate (%)\n';
    const csvRows = filteredMps.map(m =>
      `"${m.name}","${m.term}","${m.house}","${m.state}","${m.constituency}",${m.allocatedCr},${m.spentCr},${m.utilizationPct},${m.worksCompleted},${m.completionRate}`
    ).join('\n');

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `MPLADS_MPs_Performance_${selectedHouse.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minHeight: '100vh', width: '100%', maxWidth: '1440px', margin: '0 auto', padding: '0 1rem' }}>
      {/* ─── 1. BREADCRUMB ─── */}
      <div style={{ paddingTop: '1.25rem', borderBottom: '1px solid rgba(29,30,34,0.08)', paddingBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>{isHi ? 'होम' : 'Home'}</span>
          <span>/</span>
          <span>MPLADS</span>
          <span>/</span>
          <span style={{ color: '#0A2458', fontWeight: 700 }}>{isHi ? 'सांसद ब्राउज़ करें' : 'Browse MPs'}</span>
        </div>
      </div>

      {/* ─── 2. PAGE HEADER ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
            <h1
              style={{
                fontFamily: 'var(--font-serif-primary)',
                fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                fontWeight: 800,
                color: '#1D1E22',
                margin: 0,
                lineHeight: 1.2
              }}
            >
              {isHi ? 'संसद सदस्य फंड उपयोग' : 'Member of Parliament Fund Utilization'}
            </h1>
            <div
              title="MPLADS fund performance data aggregated from official MoSPI portal"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#E8F0FE',
                color: '#1A73E8',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <Info size={15} strokeWidth={2.4} />
            </div>
          </div>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', margin: 0 }}>
            {isHi
              ? 'निर्वाचन क्षेत्रों में व्यक्तिगत सांसद के प्रदर्शन और कार्य वितरण का अन्वेषण एवं विश्लेषण करें'
              : 'Browse and analyze individual MP performance across constituencies'}
          </p>
        </div>
      </div>

      {/* ─── 3. SUMMARY STATISTICS SECTION (5 CARDS IN ROUNDED CONTAINER) ─── */}
      <div
        style={{
          background: '#FAF8F3',
          border: '1.5px solid #1D1E22',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '3px 4px 0px #1D1E22',
          padding: '1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem'
        }}
      >
        {/* TOTAL MPs */}
        <div style={{ background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: '2px 2px 0px #1D1E22' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {isHi ? 'कुल सांसद' : 'TOTAL MPs'}
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1D1E22', lineHeight: 1.15, marginTop: '0.35rem' }}>
            {summaryStats.totalMps}
          </div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0A2458', marginTop: '0.25rem', textTransform: 'uppercase' }}>
            {selectedHouse}
          </div>
        </div>

        {/* TOTAL ALLOCATED */}
        <div style={{ background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: '2px 2px 0px #1D1E22' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {isHi ? 'कुल आवंटित' : 'TOTAL ALLOCATED'}
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1D1E22', lineHeight: 1.15, marginTop: '0.35rem' }}>
            {Number(summaryStats.totalAllocatedCr).toLocaleString()} <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>CR</span>
          </div>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            {isHi ? 'केंद्रीय एमपीलैड्स आवंटन' : 'Central MPLADS Grant'}
          </div>
        </div>

        {/* TOTAL UTILIZED */}
        <div style={{ background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: '2px 2px 0px #1D1E22' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {isHi ? 'कुल व्यय' : 'TOTAL UTILIZED'}
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1E7E34', lineHeight: 1.15, marginTop: '0.35rem' }}>
            {Number(summaryStats.totalUtilizedCr).toLocaleString()} <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>CR</span>
          </div>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#1E7E34', marginTop: '0.25rem' }}>
            {isHi ? 'सत्यापित संवितरण' : 'Verified Expenditure'}
          </div>
        </div>

        {/* AVG. UTILIZATION */}
        <div style={{ background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: '2px 2px 0px #1D1E22' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {isHi ? 'औसत उपयोग' : 'AVG. UTILIZATION'}
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0A2458', lineHeight: 1.15, marginTop: '0.35rem' }}>
            {summaryStats.avgUtilizationPct}%
          </div>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            {isHi ? 'राष्ट्रीय दक्षता' : 'Deployment Efficiency'}
          </div>
        </div>

        {/* WORKS COMPLETED */}
        <div style={{ background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: '2px 2px 0px #1D1E22' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {isHi ? 'पूर्ण कार्य' : 'WORKS COMPLETED'}
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1D1E22', lineHeight: 1.15, marginTop: '0.35rem' }}>
            {summaryStats.totalWorksCompleted.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#52B79A', marginTop: '0.25rem' }}>
            {isHi ? 'भौतिक रूप से सत्यापित' : 'Physically Verified'}
          </div>
        </div>
      </div>

      {/* ─── 4. PERFORMANCE CLASSIFICATION (3 HORIZONTAL CARDS) ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '1.25rem' }}>
        {/* High Performers */}
        <div
          onClick={() => setSelectedTier(selectedTier === 'high' ? 'all' : 'high')}
          style={{
            background: selectedTier === 'high' ? '#E8F5E9' : '#FFFFFF',
            border: selectedTier === 'high' ? '2px solid #1E7E34' : '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-md)',
            boxShadow: '3px 4px 0px #1D1E22',
            padding: '1.25rem 1.5rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1E7E34', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {isHi ? 'शीर्ष प्रदर्शनकर्ता' : 'HIGH PERFORMERS'}
            </span>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1E7E34' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1D1E22' }}>
            {summaryStats.highCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            {isHi ? '≥70% उपयोग वाले सांसद' : 'MPs with ≥70% utilization'}
          </div>
        </div>

        {/* Average Performers */}
        <div
          onClick={() => setSelectedTier(selectedTier === 'avg' ? 'all' : 'avg')}
          style={{
            background: selectedTier === 'avg' ? '#FFF8E1' : '#FFFFFF',
            border: selectedTier === 'avg' ? '2px solid #E5B842' : '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-md)',
            boxShadow: '3px 4px 0px #1D1E22',
            padding: '1.25rem 1.5rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#B8860B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {isHi ? 'औसत प्रदर्शनकर्ता' : 'AVERAGE PERFORMERS'}
            </span>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E5B842' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1D1E22' }}>
            {summaryStats.avgCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            {isHi ? '40–69% उपयोग वाले सांसद' : 'MPs with 40–69% utilization'}
          </div>
        </div>

        {/* Needs Improvement */}
        <div
          onClick={() => setSelectedTier(selectedTier === 'low' ? 'all' : 'low')}
          style={{
            background: selectedTier === 'low' ? '#FFEBEE' : '#FFFFFF',
            border: selectedTier === 'low' ? '2px solid #D9534F' : '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-md)',
            boxShadow: '3px 4px 0px #1D1E22',
            padding: '1.25rem 1.5rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D9534F', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {isHi ? 'सुधार की आवश्यकता' : 'NEEDS IMPROVEMENT'}
            </span>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D9534F' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1D1E22' }}>
            {summaryStats.needsImpCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            {isHi ? '<40% उपयोग वाले सांसद' : 'MPs with <40% utilization'}
          </div>
        </div>
      </div>

      {/* ─── 5. FILTER / CONTROL PANEL ─── */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1.5px solid #1D1E22',
          borderRadius: 'var(--radius-md)',
          boxShadow: '3px 4px 0px #1D1E22',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search size={17} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(12); }}
              placeholder={isHi ? 'सांसद, निर्वाचन क्षेत्र या राज्य खोजें...' : 'Search MPs, constituencies, or states...'}
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.6rem',
                fontSize: '0.88rem',
                fontFamily: 'var(--font-sans)',
                border: '1.5px solid #1D1E22',
                borderRadius: 'var(--radius-sm)',
                background: '#FAF8F3',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Controls Group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            {/* Utilization Level Dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Utilization Level:</span>
              <select
                value={selectedTier}
                onChange={(e) => { setSelectedTier(e.target.value); setVisibleCount(12); }}
                style={{
                  padding: '0.5rem 0.85rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  border: '1.5px solid #1D1E22',
                  borderRadius: 'var(--radius-sm)',
                  background: '#FAF8F3',
                  color: '#1D1E22',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="all">All MPs</option>
                <option value="high">High Performers</option>
                <option value="avg">Average Performers</option>
                <option value="low">Needs Improvement</option>
              </select>
            </div>

            {/* House Dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>House:</span>
              <select
                value={selectedHouse}
                onChange={(e) => { setSelectedHouse(e.target.value); setVisibleCount(12); }}
                style={{
                  padding: '0.5rem 0.85rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  border: '1.5px solid #1D1E22',
                  borderRadius: 'var(--radius-sm)',
                  background: '#FAF8F3',
                  color: '#1D1E22',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="Rajya Sabha">Rajya Sabha</option>
                <option value="Lok Sabha">Lok Sabha</option>
                <option value="all">All Houses</option>
              </select>
            </div>

            {/* Sort By Dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '0.5rem 0.85rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  border: '1.5px solid #1D1E22',
                  borderRadius: 'var(--radius-sm)',
                  background: '#FAF8F3',
                  color: '#1D1E22',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="utilization">Fund Utilization</option>
                <option value="completion">Completion Rate</option>
                <option value="works">Works Completed</option>
                <option value="allocated">Allocated Amount</option>
                <option value="spent">Total Expenditure</option>
                <option value="name">MP Name</option>
                <option value="constituency">Constituency</option>
              </select>
            </div>

            {/* Grid / List Toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'transparent' }}>View</span>
              <div style={{ display: 'flex', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '0.45rem 0.75rem',
                    background: viewMode === 'grid' ? '#1A73E8' : '#FAF8F3',
                    color: viewMode === 'grid' ? '#FFFFFF' : '#1D1E22',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <LayoutGrid size={14} />
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '0.45rem 0.75rem',
                    background: viewMode === 'list' ? '#1A73E8' : '#FAF8F3',
                    color: viewMode === 'list' ? '#FFFFFF' : '#1D1E22',
                    border: 'none',
                    borderLeft: '1.5px solid #1D1E22',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <List size={14} />
                  <span>List</span>
                </button>
              </div>
            </div>

            {/* Export Button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'transparent' }}>Export</span>
              <button
                type="button"
                onClick={handleExport}
                className="btn-outline-dark"
                style={{
                  padding: '0.48rem 0.85rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: '#FAF8F3',
                  border: '1.5px solid #1D1E22',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer'
                }}
              >
                <Download size={14} />
                <span>Export</span>
                <Info size={13} color="#1A73E8" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(29,30,34,0.08)', paddingTop: '0.85rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1D1E22' }}>
              All MPs ({filteredMps.length})
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
              {filteredMps.length} MPs found with {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''}
            </span>

            {/* Filter Chips */}
            {selectedHouse !== 'all' && (
              <span
                onClick={() => setSelectedHouse('all')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.2rem 0.6rem',
                  background: '#FAF8F3',
                  border: '1px solid #1D1E22',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {selectedHouse} <X size={12} />
              </span>
            )}

            {selectedTier !== 'all' && (
              <span
                onClick={() => setSelectedTier('all')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.2rem 0.6rem',
                  background: '#FAF8F3',
                  border: '1px solid #1D1E22',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {selectedTier === 'high' ? 'High Performers' : selectedTier === 'avg' ? 'Average Performers' : 'Needs Improvement'} <X size={12} />
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleClearFilters}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--color-accent-teal-hover)',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* ─── 6. MP CARDS (GRID OR LIST VIEW) ─── */}
      {filteredMps.length === 0 ? (
        <div style={{ background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</div>
          <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.35rem', color: '#1D1E22' }}>No MPs Found</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
            Try changing your search terms or clearing active filters.
          </p>
          <button type="button" onClick={handleClearFilters} className="btn-teal" style={{ padding: '0.5rem 1.25rem' }}>
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* 4-COLUMN RESPONSIVE GRID */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 270px), 1fr))',
            gap: '1.25rem'
          }}
        >
          {displayedMps.map((mp) => {
            const isHigh = mp.utilizationPct >= 70;
            const isAvg = mp.utilizationPct >= 40 && mp.utilizationPct < 70;
            const badgeBg = isHigh ? '#E8F5E9' : isAvg ? '#FFF8E1' : '#FFEBEE';
            const badgeColor = isHigh ? '#1E7E34' : isAvg ? '#B8860B' : '#D9534F';
            const barColor = isHigh ? '#52B79A' : isAvg ? '#E5B842' : '#D9534F';

            return (
              <div
                key={mp.id}
                className="mp-card-item"
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #1D1E22',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '3px 4px 0px #1D1E22',
                  padding: '1.4rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  position: 'relative'
                }}
              >
                {/* Top: Avatar & Name */}
                <div>
                  {/* Blue Avatar Circle */}
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: '#1A73E8',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '0.85rem'
                    }}
                  >
                    <User size={24} />
                  </div>

                  {/* MP Name & Term */}
                  <h4 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.12rem', fontWeight: 800, color: '#1D1E22', margin: '0 0 0.35rem 0', lineHeight: 1.3 }}>
                    {mp.name} ({mp.term})
                  </h4>

                  {/* Location Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.76rem', color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>
                    <MapPin size={13} />
                    <span>{mp.constituency}</span>
                  </div>

                  {/* House Badge */}
                  <div style={{ display: 'inline-block', padding: '0.15rem 0.55rem', background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', fontSize: '0.72rem', fontWeight: 700, color: '#0A2458' }}>
                    {mp.house}
                  </div>
                </div>

                {/* Financial Figures Box */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                    background: '#FAF8F3',
                    border: '1px solid #1D1E22',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>ALLOCATED</div>
                    <div style={{ fontSize: '1.18rem', fontWeight: 800, color: '#1D1E22', marginTop: '0.15rem' }}>
                      {mp.allocatedCr} <span style={{ fontSize: '0.75rem' }}>CR</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>SPENT</div>
                    <div style={{ fontSize: '1.18rem', fontWeight: 800, color: '#1D1E22', marginTop: '0.15rem' }}>
                      {mp.spentCr} <span style={{ fontSize: '0.75rem' }}>CR</span>
                    </div>
                  </div>
                </div>

                {/* Incomplete Warning Banner if applicable */}
                {mp.warning && (
                  <div
                    style={{
                      background: '#FFF3E0',
                      border: '1px solid #FF9800',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.4rem 0.65rem',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#E65100',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <AlertTriangle size={13} />
                    <span>{mp.warning}</span>
                  </div>
                )}

                {/* Fund Utilization Section */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      <span>FUND UTILIZATION</span>
                      <Info size={12} />
                    </div>
                    <span style={{ padding: '0.15rem 0.5rem', background: badgeBg, color: badgeColor, border: `1px solid ${badgeColor}`, borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 800 }}>
                      {mp.utilizationPct}%
                    </span>
                  </div>

                  <div style={{ background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', padding: '0.55rem 0.75rem' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#1D1E22', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <DollarSign size={12} />
                      <span>₹{mp.spentCr} CR of ₹{mp.allocatedCr} CR used</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#EAEAEA', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, mp.utilizationPct)}%`, height: '100%', background: barColor }} />
                    </div>
                  </div>
                </div>

                {/* Work Stats Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#1E7E34' }}>
                    <CheckCircle2 size={13} />
                    <span>COMPLETED {mp.worksCompleted}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#1A73E8' }}>
                    <Award size={13} />
                    <span>RECOMMENDED {mp.worksRecommended}</span>
                  </span>
                </div>

                {/* Completion Rate */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  <span>COMPLETION RATE</span>
                  <span style={{ fontWeight: 800, color: '#1D1E22' }}>{mp.completionRate}%</span>
                </div>

                {/* Bottom View Details Link */}
                <div style={{ borderTop: '1px solid rgba(29,30,34,0.1)', paddingTop: '0.75rem', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => navigate(`/mps/${mp.slug}`)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      color: 'var(--color-accent-teal-hover)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <span>View Details →</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* HORIZONTAL LIST VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {displayedMps.map((mp) => {
            const isHigh = mp.utilizationPct >= 70;
            const isAvg = mp.utilizationPct >= 40 && mp.utilizationPct < 70;
            const badgeColor = isHigh ? '#1E7E34' : isAvg ? '#B8860B' : '#D9534F';
            const badgeBg = isHigh ? '#E8F5E9' : isAvg ? '#FFF8E1' : '#FFEBEE';

            return (
              <div
                key={mp.id}
                className="mp-card-item"
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #1D1E22',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '3px 4px 0px #1D1E22',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1.25rem'
                }}
              >
                {/* Left Profile */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 'min(100%, 260px)' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#1A73E8', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={22} />
                  </div>
                  <div>
                    <h4 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.2rem 0', color: '#1D1E22' }}>
                      {mp.name} ({mp.term})
                    </h4>
                    <div style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <MapPin size={12} />
                      <span>{mp.constituency}</span>
                      <span>•</span>
                      <span style={{ fontWeight: 700, color: '#0A2458' }}>{mp.house}</span>
                    </div>
                  </div>
                </div>

                {/* Mid Financials */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>ALLOCATED</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1D1E22' }}>₹{mp.allocatedCr} CR</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>SPENT</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E7E34' }}>₹{mp.spentCr} CR</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>UTILIZATION</div>
                    <span style={{ padding: '0.15rem 0.5rem', background: badgeBg, color: badgeColor, border: `1px solid ${badgeColor}`, borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 800 }}>
                      {mp.utilizationPct}%
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>COMPLETED</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1D1E22' }}>{mp.worksCompleted} / {mp.worksRecommended}</div>
                  </div>
                </div>

                {/* Right Action */}
                <div>
                  <button
                    type="button"
                    onClick={() => navigate(`/mps/${mp.slug}`)}
                    className="btn-teal"
                    style={{ padding: '0.45rem 1.1rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <span>View Details</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── 7. LOAD MORE CONTROLS ─── */}
      {visibleCount < filteredMps.length && (
        <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
            Showing {displayedMps.length} of {filteredMps.length} MPs
          </div>
          <button
            type="button"
            onClick={() => setVisibleCount(prev => prev + PAGE_SIZE_INCREMENT)}
            className="btn-outline-dark"
            style={{
              padding: '0.6rem 1.75rem',
              fontSize: '0.86rem',
              fontWeight: 800,
              background: '#FFFFFF',
              border: '1.5px solid #1D1E22',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '2px 3px 0px #1D1E22',
              cursor: 'pointer'
            }}
          >
            Load more
          </button>
        </div>
      )}

      {/* ─── FOOTER ─── */}
      <Footer hideCTAButtons={true} />

      <style>{`
        .mp-card-item {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .mp-card-item:hover {
          transform: translateY(-3px);
          box-shadow: 4px 6px 0px #1D1E22 !important;
        }
      `}</style>
    </div>
  );
};

export default BrowseMpsView;
