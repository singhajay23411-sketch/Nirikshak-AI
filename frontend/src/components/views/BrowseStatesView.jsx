import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Map, Search, ArrowRight, TrendingUp, Award, AlertTriangle,
  Building, CheckCircle2, ChevronRight, Filter, Users, DollarSign
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import {
  ALL_STATES_PERFORMANCE,
  getNationalPerformanceSummary
} from '../../data/statePerformanceData';
import Footer from '../Footer';

const BrowseStatesView = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'states' | 'uts' | 'high' | 'needs_improvement'
  const [sortBy, setSortBy] = useState('rank'); // 'rank' | 'allocated' | 'mps' | 'completed'

  const nationalSummary = useMemo(() => getNationalPerformanceSummary(), []);

  // Filter and sort the 36 States/UTs
  const filteredStates = useMemo(() => {
    return ALL_STATES_PERFORMANCE.filter((s) => {
      // Type or Category filter
      if (selectedFilter === 'states' && s.type !== 'State') return false;
      if (selectedFilter === 'uts' && s.type !== 'Union Territory') return false;
      if (selectedFilter === 'high' && s.performanceCategory !== 'High') return false;
      if (selectedFilter === 'needs_improvement' && s.performanceCategory !== 'Needs Improvement') return false;

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          s.state.toLowerCase().includes(q) ||
          (s.stateHi && s.stateHi.includes(q)) ||
          s.type.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'rank') return a.rank - b.rank;
      if (sortBy === 'allocated') return b.totalAllocatedCr - a.totalAllocatedCr;
      if (sortBy === 'mps') return b.mpCount - a.mpCount;
      if (sortBy === 'completed') return b.worksCompleted - a.worksCompleted;
      return 0;
    });
  }, [selectedFilter, searchQuery, sortBy]);

  const handleStateClick = (slug) => {
    navigate(`/states/${slug}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', minHeight: '100vh', width: '100%', maxWidth: '1440px', margin: '0 auto', padding: '0 1rem' }}>
      {/* ─── 1. HERO HEADER ─── */}
      <div style={{ textAlign: 'center', paddingTop: '1.25rem' }}>
        {/* Top Icon Badge */}
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: 'var(--radius-md)',
            background: '#F3EFE6',
            border: '1.5px solid #1D1E22',
            boxShadow: '2px 3px 0px #1D1E22',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}
        >
          <Building size={28} strokeWidth={2} color="#0A2458" />
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-serif-primary)',
            fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
            fontWeight: 800,
            color: '#1D1E22',
            margin: '0 0 0.5rem 0',
            lineHeight: 1.2
          }}
        >
          {isHi ? 'राज्य-वार एमपीलैड्स प्रदर्शन' : 'State-wise MPLADS Performance'}
        </h1>

        <p
          style={{
            fontSize: '0.95rem',
            color: 'var(--color-text-secondary)',
            maxWidth: '680px',
            margin: '0 auto 2rem auto',
            lineHeight: 1.5
          }}
        >
          {isHi
            ? 'भारत के सभी 28 राज्यों और 8 केंद्र शासित प्रदेशों में एमपीलैड्स फंड उपयोग, स्वीकृत कार्यों और सांसदों के प्रदर्शन का अन्वेषण करें'
            : 'Explore MPLADS fund utilization, approved works, and parliamentary delivery across all 28 Indian States and 8 Union Territories'}
        </p>
      </div>

      {/* ─── 2. SUMMARY KPI SECTION (4 CARDS) ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
          gap: '1.25rem'
        }}
      >
        {/* Total States / UTs */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-md)',
            boxShadow: '3px 4px 0px #1D1E22',
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem'
          }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: 'var(--radius-sm)',
              background: '#FAF8F3',
              border: '1.2px solid #1D1E22',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Map size={24} color="#0A2458" />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {isHi ? 'कुल राज्य एवं केंद्र शासित प्रदेश' : 'TOTAL STATES & UTS'}
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1D1E22', lineHeight: 1.15, marginTop: '0.2rem' }}>
              {nationalSummary.totalStates}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52B79A', marginTop: '0.25rem' }}>
              28 States • 8 UTs
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
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem'
          }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: 'var(--radius-sm)',
              background: '#FAF8F3',
              border: '1.2px solid #1D1E22',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <DollarSign size={24} color="#0A2458" />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {isHi ? 'कुल आवंटित राशि' : 'TOTAL ALLOCATED'}
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1D1E22', lineHeight: 1.15, marginTop: '0.2rem' }}>
              ₹{nationalSummary.totalAllocatedCr} <span style={{ fontSize: '1rem', fontWeight: 700 }}>CR</span>
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
              543 Lok Sabha Seats
            </div>
          </div>
        </div>

        {/* Total Utilized */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-md)',
            boxShadow: '3px 4px 0px #1D1E22',
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem'
          }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: 'var(--radius-sm)',
              background: '#FAF8F3',
              border: '1.2px solid #1D1E22',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <TrendingUp size={24} color="#1E7E34" />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {isHi ? 'कुल व्यय राशि' : 'TOTAL UTILIZED'}
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1E7E34', lineHeight: 1.15, marginTop: '0.2rem' }}>
              ₹{nationalSummary.totalUtilizedCr} <span style={{ fontSize: '1rem', fontWeight: 700 }}>CR</span>
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1E7E34', marginTop: '0.25rem' }}>
              {nationalSummary.totalCompletedWorks.toLocaleString()} Works Finished
            </div>
          </div>
        </div>

        {/* Average Utilization */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-md)',
            boxShadow: '3px 4px 0px #1D1E22',
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem'
          }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: 'var(--radius-sm)',
              background: '#FAF8F3',
              border: '1.2px solid #1D1E22',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Award size={24} color="#52B79A" />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {isHi ? 'औसत उपयोग दर' : 'AVG UTILIZATION'}
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0A2458', lineHeight: 1.15, marginTop: '0.2rem' }}>
              {nationalSummary.avgUtilizationPct}%
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
              National Efficiency Index
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. PERFORMANCE CATEGORY HIGHLIGHT CARDS (3 TIERS) ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
          gap: '1.25rem'
        }}
      >
        {/* High Performers */}
        <div
          onClick={() => setSelectedFilter(selectedFilter === 'high' ? 'all' : 'high')}
          style={{
            background: selectedFilter === 'high' ? '#E8F5E9' : '#FFFFFF',
            border: selectedFilter === 'high' ? '2px solid #1E7E34' : '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-md)',
            boxShadow: '3px 4px 0px #1D1E22',
            padding: '1.25rem 1.5rem',
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1E7E34', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {isHi ? 'शीर्ष प्रदर्शनकर्ता' : 'HIGH PERFORMERS'}
            </span>
            <span style={{ padding: '0.2rem 0.6rem', background: '#E8F5E9', border: '1px solid #1E7E34', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 800, color: '#1E7E34' }}>
              ≥ 80% Utilization
            </span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1D1E22' }}>
            {nationalSummary.highPerformersCount} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>States & UTs</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.4rem' }}>
            Chandigarh, Goa, Kerala, Gujarat, Himachal Pradesh, TN...
          </div>
        </div>

        {/* Average Performers */}
        <div
          onClick={() => setSelectedFilter(selectedFilter === 'states' ? 'all' : 'states')}
          style={{
            background: selectedFilter === 'states' ? '#FFF8E1' : '#FFFFFF',
            border: selectedFilter === 'states' ? '2px solid #E5B842' : '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-md)',
            boxShadow: '3px 4px 0px #1D1E22',
            padding: '1.25rem 1.5rem',
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#B8860B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {isHi ? 'औसत प्रदर्शनकर्ता' : 'AVERAGE PERFORMERS'}
            </span>
            <span style={{ padding: '0.2rem 0.6rem', background: '#FFF8E1', border: '1px solid #E5B842', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 800, color: '#B8860B' }}>
              70% - 79% Utilization
            </span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1D1E22' }}>
            {nationalSummary.avgPerformersCount} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>States & UTs</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.4rem' }}>
            Bihar, Maharashtra, Rajasthan, Karnataka, Odisha, Punjab...
          </div>
        </div>

        {/* Needs Improvement */}
        <div
          onClick={() => setSelectedFilter(selectedFilter === 'needs_improvement' ? 'all' : 'needs_improvement')}
          style={{
            background: selectedFilter === 'needs_improvement' ? '#FFEBEE' : '#FFFFFF',
            border: selectedFilter === 'needs_improvement' ? '2px solid #D9534F' : '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-md)',
            boxShadow: '3px 4px 0px #1D1E22',
            padding: '1.25rem 1.5rem',
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D9534F', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {isHi ? 'सुधार की आवश्यकता' : 'NEEDS IMPROVEMENT'}
            </span>
            <span style={{ padding: '0.2rem 0.6rem', background: '#FFEBEE', border: '1px solid #D9534F', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 800, color: '#D9534F' }}>
              &lt; 70% Utilization
            </span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1D1E22' }}>
            {nationalSummary.needsImprovementCount} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>States & UTs</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.4rem' }}>
            Manipur, Nagaland, Meghalaya, J&K...
          </div>
        </div>
      </div>

      {/* ─── 4. SEARCH & FILTER CONTROLS BAR ─── */}
      <div
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
          gap: '1rem'
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 320px' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)'
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isHi ? 'राज्य या केंद्र शासित प्रदेश का नाम खोजें...' : 'Search State or Union Territory name...'}
            style={{
              width: '100%',
              padding: '0.7rem 1rem 0.7rem 2.75rem',
              fontSize: '0.88rem',
              fontFamily: 'var(--font-sans)',
              border: '1.5px solid #1D1E22',
              borderRadius: 'var(--radius-sm)',
              background: '#FAF8F3',
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />
        </div>

        {/* Filter Pills & Sort Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              style={{
                padding: '0.45rem 0.9rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid #1D1E22',
                background: selectedFilter === 'all' ? '#1D1E22' : '#FAF8F3',
                color: selectedFilter === 'all' ? '#FFFFFF' : '#1D1E22',
                cursor: 'pointer'
              }}
            >
              {isHi ? 'सभी (36)' : 'All (36)'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('states')}
              style={{
                padding: '0.45rem 0.9rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid #1D1E22',
                background: selectedFilter === 'states' ? '#1D1E22' : '#FAF8F3',
                color: selectedFilter === 'states' ? '#FFFFFF' : '#1D1E22',
                cursor: 'pointer'
              }}
            >
              {isHi ? 'केवल राज्य (28)' : 'States (28)'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('uts')}
              style={{
                padding: '0.45rem 0.9rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid #1D1E22',
                background: selectedFilter === 'uts' ? '#1D1E22' : '#FAF8F3',
                color: selectedFilter === 'uts' ? '#FFFFFF' : '#1D1E22',
                cursor: 'pointer'
              }}
            >
              {isHi ? 'केंद्र शासित प्रदेश (8)' : 'UTs (8)'}
            </button>
          </div>

          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              {isHi ? 'क्रमबद्ध:' : 'Sort:'}
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '0.45rem 0.75rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                border: '1px solid #1D1E22',
                borderRadius: 'var(--radius-sm)',
                background: '#FAF8F3',
                color: '#1D1E22',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="rank">{isHi ? 'रैंक (उपयोग दर)' : 'Rank (Utilization %)'}</option>
              <option value="allocated">{isHi ? 'आवंटित राशि' : 'Allocated Funds'}</option>
              <option value="mps">{isHi ? 'सांसदों की संख्या' : 'Number of MPs'}</option>
              <option value="completed">{isHi ? 'पूर्ण कार्य' : 'Works Completed'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── 5. STATE CARDS GRID (ALL 36 STATES & UTS) ─── */}
      {filteredStates.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-md)',
            boxShadow: '3px 4px 0px #1D1E22',
            padding: '3rem',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏛️</div>
          <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.35rem', color: '#1D1E22', marginBottom: '0.5rem' }}>
            {isHi ? 'कोई राज्य/केंद्र शासित प्रदेश नहीं मिला' : 'No States or UTs Found'}
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
            {isHi ? 'कृपया अपना खोज शब्द या फ़िल्टर साफ़ करें।' : 'Try clearing your search query or adjusting the category filter.'}
          </p>
          <button
            type="button"
            onClick={() => { setSearchQuery(''); setSelectedFilter('all'); }}
            className="btn-teal"
            style={{ padding: '0.55rem 1.4rem', fontSize: '0.86rem' }}
          >
            {isHi ? 'फ़िल्टर साफ़ करें' : 'Clear Filters'}
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: '1.5rem'
          }}
          className="browse-states-grid"
        >
          {filteredStates.map((stateItem) => {
            const isHigh = stateItem.performanceCategory === 'High';
            const isLow = stateItem.performanceCategory === 'Needs Improvement';
            const badgeColor = isHigh ? '#1E7E34' : isLow ? '#D9534F' : '#B8860B';
            const badgeBg = isHigh ? '#E8F5E9' : isLow ? '#FFEBEE' : '#FFF8E1';

            return (
              <div
                key={stateItem.slug}
                onClick={() => handleStateClick(stateItem.slug)}
                className="state-card-item"
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #1D1E22',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '3px 4px 0px #1D1E22',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1.25rem',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
              >
                {/* Card Top: Rank & State Name & MP Count */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    {/* Rank Badge */}
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
                      RANK #{stateItem.rank}
                    </span>

                    {/* MP Seats Badge */}
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--color-text-secondary)'
                      }}
                    >
                      <Users size={13} />
                      <span>{stateItem.mpCount} {isHi ? 'सांसद' : 'MPs'}</span>
                    </span>
                  </div>

                  {/* State Name */}
                  <h3
                    style={{
                      fontFamily: 'var(--font-serif-primary)',
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      color: '#1D1E22',
                      margin: '0 0 0.2rem 0',
                      lineHeight: 1.25
                    }}
                  >
                    {isHi ? (stateItem.stateHi || stateItem.state) : stateItem.state}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    {stateItem.type}
                  </div>
                </div>

                {/* Financial Figures Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.85rem',
                    background: '#FAF8F3',
                    border: '1px solid #1D1E22',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem 1rem'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      {isHi ? 'कुल आवंटित' : 'ALLOCATED'}
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1D1E22', marginTop: '0.15rem' }}>
                      ₹{stateItem.totalAllocatedCr} <span style={{ fontSize: '0.75rem' }}>CR</span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      {isHi ? 'कुल व्यय' : 'UTILIZED'}
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1E7E34', marginTop: '0.15rem' }}>
                      ₹{stateItem.totalUtilizedCr} <span style={{ fontSize: '0.75rem' }}>CR</span>
                    </div>
                  </div>
                </div>

                {/* Utilization Progress Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    <span style={{ color: '#1D1E22' }}>{isHi ? 'फंड उपयोग' : 'Fund Utilization'}</span>
                    <span style={{ color: badgeColor }}>{stateItem.utilizationPct}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#EAEAEA', borderRadius: '4px', overflow: 'hidden', border: '1px solid #1D1E22' }}>
                    <div
                      style={{
                        width: `${Math.min(100, stateItem.utilizationPct)}%`,
                        height: '100%',
                        background: isHigh ? 'var(--color-accent-teal)' : isLow ? '#D9534F' : '#E5B842',
                        borderRadius: '4px',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>

                {/* Works Summary & Action Footer */}
                <div
                  style={{
                    borderTop: '1px solid rgba(29,30,34,0.1)',
                    paddingTop: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    <span style={{ fontWeight: 800, color: '#1D1E22' }}>{stateItem.worksCompleted}</span> / {stateItem.worksRecommended} {isHi ? 'कार्य पूर्ण' : 'Works Done'}
                  </div>

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--color-accent-teal-hover)'
                    }}
                  >
                    <span>{isHi ? 'विवरण देखें' : 'View Details'}</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── FOOTER ─── */}
      <Footer hideCTAButtons={true} />

      {/* Responsive Styles */}
      <style>{`
        .state-card-item:hover {
          transform: translateY(-3px);
          box-shadow: 4px 6px 0px #1D1E22 !important;
        }
        @media (max-width: 768px) {
          .browse-states-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BrowseStatesView;
