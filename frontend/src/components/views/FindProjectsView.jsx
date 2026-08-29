import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Map, MapPin, Calendar, CreditCard, Search, Filter, RotateCcw,
  ChevronLeft, ChevronRight, X, CheckCircle, Clock, Building, ArrowRight,
  ChevronDown, Check
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { INDIA_STATES_AND_UT } from '../../data/indiaConstituencies';
import Footer from '../Footer';

// ─── REUSABLE TACTILE DROPDOWN WITH LANDING-PAGE HOVER ANIMATION (ALWAYS OPENS DOWNWARD) ───
const NirikshakDropdown = ({
  label,
  value,
  displayValue,
  options = [],
  groups = null,
  placeholder,
  onSelect,
  isHi = false,
  showSearch = true,
  minWidth = '100%'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options or groups based on search input
  const filteredGroups = useMemo(() => {
    if (!groups) return null;
    if (!query.trim()) return groups;
    const q = query.toLowerCase();
    return groups
      .map(group => ({
        ...group,
        items: group.items.filter(item =>
          item.label.toLowerCase().includes(q) ||
          (item.subLabel && item.subLabel.toLowerCase().includes(q))
        )
      }))
      .filter(group => group.items.length > 0);
  }, [groups, query]);

  const filteredOptions = useMemo(() => {
    if (groups) return null;
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter(item =>
      item.label.toLowerCase().includes(q) ||
      (item.subLabel && item.subLabel.toLowerCase().includes(q))
    );
  }, [options, groups, query]);

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: minWidth }}
    >
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: '#1D1E22',
            marginBottom: '0.45rem'
          }}
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(prev => !prev);
          setQuery('');
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          fontSize: '0.9rem',
          fontWeight: 600,
          fontFamily: 'var(--font-sans)',
          color: '#1D1E22',
          background: '#FAF8F3',
          border: '1.5px solid #1D1E22',
          borderRadius: 'var(--radius-md)',
          boxShadow: isOpen ? '1px 2px 0px #1D1E22' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          boxSizing: 'border-box',
          outline: 'none',
          textAlign: 'left'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayValue || placeholder}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={2.4}
          color="#1D1E22"
          style={{
            flexShrink: 0,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            marginLeft: '0.5rem'
          }}
        />
      </button>

      {/* Invisible Hover Bridge */}
      <div
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          height: '6px',
          background: 'transparent',
          pointerEvents: isOpen ? 'auto' : 'none',
          zIndex: 1049
        }}
      />

      {/* Dropdown Menu - GUARANTEED ALWAYS OPENS DOWNWARD */}
      {isOpen && (
        <div
          className="nirikshak-dropdown-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            width: '100%',
            background: '#FAF8F3',
            border: '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-md)',
            boxShadow: '3px 5px 0px #1D1E22',
            zIndex: 1100,
            maxHeight: '320px',
            overflowY: 'auto',
            boxSizing: 'border-box'
          }}
        >
          {/* Quick Search Filter (for lists with search enabled) */}
          {showSearch && (
            <div style={{ padding: '0.5rem 0.65rem', borderBottom: '1px solid rgba(29,30,34,0.1)', background: '#FFFFFF', position: 'sticky', top: 0, zIndex: 10 }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={isHi ? 'सूची में खोजें...' : 'Filter list...'}
                  style={{
                    width: '100%',
                    padding: '0.4rem 0.5rem 0.4rem 2rem',
                    fontSize: '0.8rem',
                    border: '1px solid #1D1E22',
                    borderRadius: 'var(--radius-sm)',
                    background: '#FAF8F3',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Grouped Options (States vs UTs) */}
          {groups ? (
            filteredGroups && filteredGroups.length > 0 ? (
              filteredGroups.map((group, gIdx) => (
                <div key={group.title}>
                  <div
                    style={{
                      padding: '0.4rem 1.15rem 0.25rem 1.15rem',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      letterSpacing: '0.09em',
                      color: '#0A2458',
                      textTransform: 'uppercase',
                      background: 'rgba(243, 239, 230, 0.9)',
                      borderBottom: '1px solid rgba(29, 30, 34, 0.08)',
                      borderTop: gIdx === 0 ? 'none' : '1px solid rgba(29, 30, 34, 0.12)',
                      userSelect: 'none'
                    }}
                  >
                    {group.title} ({group.items.length})
                  </div>

                  {group.items.map((item) => {
                    const isSelected = value === item.value;
                    return (
                      <div
                        key={item.value}
                        onClick={() => {
                          onSelect(item.value);
                          setIsOpen(false);
                        }}
                        className="nirikshak-dropdown-row"
                        style={{
                          height: '38px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0 1.15rem',
                          borderBottom: '1px solid rgba(29, 30, 34, 0.06)',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        <span className="dropdown-item-text">
                          {item.label}
                        </span>
                        {isSelected && (
                          <Check size={14} strokeWidth={2.8} color="#1D1E22" style={{ flexShrink: 0, marginLeft: '0.5rem' }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                {isHi ? 'कोई परिणाम नहीं मिला' : 'No matching results'}
              </div>
            )
          ) : (
            /* Flat List Options */
            filteredOptions && filteredOptions.length > 0 ? (
              filteredOptions.map((item) => {
                const isSelected = value === item.value;
                return (
                  <div
                    key={item.value}
                    onClick={() => {
                      onSelect(item.value);
                      setIsOpen(false);
                    }}
                    className="nirikshak-dropdown-row"
                    style={{
                      height: '38px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 1.15rem',
                      borderBottom: '1px solid rgba(29, 30, 34, 0.06)',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <span className="dropdown-item-text">
                      {item.label}
                    </span>
                    {isSelected && (
                      <Check size={14} strokeWidth={2.8} color="#1D1E22" style={{ flexShrink: 0, marginLeft: '0.5rem' }} />
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                {isHi ? 'कोई परिणाम नहीं मिला' : 'No matching results'}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

// ─── EXTENSIVE MPLADS PROJECTS MOCK DATA ───
const ALL_MOCK_PROJECTS = [];

const ITEMS_PER_PAGE = 12;

const FindProjectsView = () => {
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const [allProjects, setAllProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/data/real_projects.json')
      .then(res => res.json())
      .then(data => {
        setAllProjects(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error loading real projects:", err);
        setIsLoading(false);
      });
  }, []);

  // Filters State
  const [selectedState, setSelectedState] = useState('Bihar');
  const [selectedConstituency, setSelectedConstituency] = useState('Buxar');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('completed'); // 'completed' | 'recommended'
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [costMax, setCostMax] = useState(500); // in Lakhs (0 - 500L)
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPaymentProject, setSelectedPaymentProject] = useState(null);

  // Available constituencies dynamically derived based on state selection directly from CSV
  const availableConstituencies = useMemo(() => {
    if (!selectedState) {
      return INDIA_STATES_AND_UT.flatMap(s => s.constituencies);
    }
    const stateObj = INDIA_STATES_AND_UT.find(s => s.state.toLowerCase() === selectedState.toLowerCase());
    return stateObj ? stateObj.constituencies : [];
  }, [selectedState]);

  // Handle State Change: updates state and resets constituency to the first available in CSV
  const handleStateChange = (newState) => {
    setSelectedState(newState);
    setCurrentPage(1);

    if (newState) {
      const stateObj = INDIA_STATES_AND_UT.find(s => s.state.toLowerCase() === newState.toLowerCase());
      if (stateObj && stateObj.constituencies.length > 0) {
        setSelectedConstituency(stateObj.constituencies[0].name);
      } else {
        setSelectedConstituency('');
      }
    } else {
      setSelectedConstituency('');
    }
  };

  // Reset Filters to initial state
  const handleResetFilters = () => {
    setSelectedState('');
    setSelectedConstituency('');
    setSearchQuery('');
    setActiveTab('completed');
    setSelectedYear('All Years');
    setCostMax(500);
    setCurrentPage(1);
  };

  // Filtered dataset
  const filteredProjects = useMemo(() => {
    return allProjects.filter((p) => {
      // State match
      if (selectedState && p.state.toLowerCase() !== selectedState.toLowerCase()) {
        return false;
      }
      // Constituency match
      if (selectedConstituency) {
        const match =
          p.constituency.toLowerCase() === selectedConstituency.toLowerCase() ||
          p.constituency.toLowerCase().includes(selectedConstituency.toLowerCase()) ||
          selectedConstituency.toLowerCase().includes(p.constituency.toLowerCase());
        if (!match) return false;
      }
      // Status tab match
      if (activeTab === 'completed' && p.type !== 'completed') {
        return false;
      }
      if (activeTab === 'recommended' && p.type !== 'recommended') {
        return false;
      }
      // Year filter match
      if (selectedYear !== 'All Years' && p.year.toString() !== selectedYear) {
        return false;
      }
      // Cost range match (convert cost to Lakhs)
      const costInLakhs = p.cost / 100000;
      if (costInLakhs > costMax) {
        return false;
      }
      // Search query match (title, id, agency, mp)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matches =
          p.title.toLowerCase().includes(query) ||
          p.id.toLowerCase().includes(query) ||
          p.agency.toLowerCase().includes(query) ||
          p.mp.toLowerCase().includes(query);
        if (!matches) return false;
      }

      return true;
    });
  }, [allProjects, selectedState, selectedConstituency, activeTab, selectedYear, costMax, searchQuery]);

  // Aggregate Metrics for Header Badges
  const totalProjectsCount = filteredProjects.length;
  const totalCostCr = useMemo(() => {
    const sum = filteredProjects.reduce((acc, p) => acc + p.cost, 0);
    return (sum / 10000000).toFixed(1);
  }, [filteredProjects]);

  // Pagination Calculations
  const totalPages = Math.max(1, Math.ceil(totalProjectsCount / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProjects = filteredProjects.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const displayConstituencyName = useMemo(() => {
    if (selectedConstituency) {
      const c = availableConstituencies.find(item =>
        item.name.toLowerCase() === selectedConstituency.toLowerCase() ||
        item.id.toLowerCase() === selectedConstituency.toLowerCase()
      );
      if (c) return isHi ? (c.nameHi || c.name) : c.name;
      return selectedConstituency;
    }
    if (selectedState) {
      const stateObj = INDIA_STATES_AND_UT.find(s => s.state.toLowerCase() === selectedState.toLowerCase());
      return isHi ? (stateObj?.stateHi || selectedState) : selectedState;
    }
    return isHi ? 'सभी निर्वाचन क्षेत्र' : 'All Constituencies';
  }, [selectedConstituency, selectedState, availableConstituencies, isHi]);

  // Formatter for Indian Currency (e.g. ₹ 14,96,846)
  const formatIndianCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount).replace('INR', '₹');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minHeight: '100vh' }}>
      {/* ─── TOP SECTION: HERO & PRIMARY FILTERS (MATCHING SCREENSHOT 1) ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: '1rem' }}>
        {/* Map Icon Badge */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-md)',
            background: '#F3EFE6',
            border: '1.5px solid #1D1E22',
            boxShadow: '2px 3px 0px #1D1E22',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem',
            color: 'var(--color-accent-teal-hover)'
          }}
        >
          <Map size={32} strokeWidth={2} color="#1D1E22" />
        </div>

        {/* Title & Subtitle */}
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
          {isHi ? 'मेरे निर्वाचन क्षेत्र में परियोजनाएं खोजें' : 'Find Projects in My Constituency'}
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
            ? 'निर्वाचन क्षेत्र आधारित फ़िल्टरिंग का उपयोग करके अपने क्षेत्र में एमपीलैड्स परियोजनाओं को खोजें और अन्वेषण करें'
            : 'Search and explore MPLADS projects in your area using constituency-based filtering'}
        </p>

        {/* Primary Filter Box (State & Constituency Selectors) */}
        <div
          style={{
            width: '100%',
            background: '#FFFFFF',
            border: '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '3px 4px 0px #1D1E22',
            padding: '1.75rem 2rem',
            boxSizing: 'border-box',
            textAlign: 'left',
            position: 'relative',
            zIndex: 60,
            overflow: 'visible'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* State Selector */}
            <NirikshakDropdown
              label={isHi ? 'राज्य (वैकल्पिक)' : 'State (Optional)'}
              value={selectedState}
              displayValue={
                selectedState
                  ? (isHi
                      ? (INDIA_STATES_AND_UT.find(s => s.state === selectedState)?.stateHi || selectedState)
                      : selectedState)
                  : (isHi ? 'सभी राज्य और केंद्र शासित प्रदेश (36)' : 'All States & UTs (36)')
              }
              placeholder={isHi ? 'सभी राज्य और केंद्र शासित प्रदेश (36)' : 'All States & UTs (36)'}
              groups={[
                {
                  title: isHi ? 'राज्य' : 'States',
                  items: [
                    { value: '', label: isHi ? 'सभी राज्य और केंद्र शासित प्रदेश' : 'All States & UTs' },
                    ...INDIA_STATES_AND_UT.filter(s => s.type === 'State').map(s => ({
                      value: s.state,
                      label: isHi ? s.stateHi : s.state
                    }))
                  ]
                },
                {
                  title: isHi ? 'केंद्र शासित प्रदेश' : 'Union Territories',
                  items: INDIA_STATES_AND_UT.filter(s => s.type === 'Union Territory').map(s => ({
                    value: s.state,
                    label: isHi ? s.stateHi : s.state
                  }))
                }
              ]}
              onSelect={(val) => {
                handleStateChange(val);
              }}
              isHi={isHi}
            />

            {/* Constituency Selector */}
            <NirikshakDropdown
              label={isHi ? 'निर्वाचन क्षेत्र *' : 'Constituency *'}
              value={selectedConstituency}
              displayValue={
                selectedConstituency
                  ? (() => {
                      const c = availableConstituencies.find(item =>
                        item.name.toLowerCase() === selectedConstituency.toLowerCase() ||
                        item.id.toLowerCase() === selectedConstituency.toLowerCase()
                      );
                      return c ? (isHi ? c.nameHi : c.name) : selectedConstituency;
                    })()
                  : (isHi ? 'सभी निर्वाचन क्षेत्र' : 'All Constituencies')
              }
              placeholder={isHi ? 'सभी निर्वाचन क्षेत्र' : 'All Constituencies'}
              options={[
                {
                  value: '',
                  label: isHi ? 'सभी निर्वाचन क्षेत्र' : 'All Constituencies'
                },
                ...availableConstituencies.map(c => ({
                  value: c.name,
                  label: isHi ? c.nameHi : c.name
                }))
              ]}
              onSelect={(val) => {
                setSelectedConstituency(val);
                setCurrentPage(1);
              }}
              isHi={isHi}
            />
          </div>

          {/* Reset Filters Action Button */}
          <div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn-outline-dark"
              style={{
                padding: '0.55rem 1.25rem',
                fontSize: '0.84rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: '#FFFFFF',
                border: '1.5px solid #1D1E22',
                boxShadow: '1.5px 2px 0px #1D1E22'
              }}
            >
              <RotateCcw size={14} />
              <span>{isHi ? 'फ़िल्टर रीसेट करें' : 'Reset Filters'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── MIDDLE SECTION: SUB-HEADER, KPI BADGES & SUB-FILTERS (MATCHING SCREENSHOT 3) ─── */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1.5px solid #1D1E22',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '3px 4px 0px #1D1E22',
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}
      >
        {/* Top Row: Title & Right Stat Badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Title & Tabs */}
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-serif-primary)',
                fontSize: '1.65rem',
                fontWeight: 800,
                color: '#1D1E22',
                margin: '0 0 1rem 0'
              }}
            >
              {isHi ? `${displayConstituencyName} में परियोजनाएं` : `Projects in ${displayConstituencyName}`}
            </h2>

            {/* Status Tabs */}
            <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '2px solid rgba(29,30,34,0.1)' }}>
              <button
                type="button"
                onClick={() => { setActiveTab('completed'); setCurrentPage(1); }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0 0.5rem 0.6rem 0.5rem',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: activeTab === 'completed' ? '#0A2458' : 'var(--color-text-muted)',
                  borderBottom: activeTab === 'completed' ? '3px solid #0A2458' : '3px solid transparent',
                  marginBottom: '-2px',
                  transition: 'all 0.18s ease'
                }}
              >
                {isHi ? 'पूर्ण कार्य' : 'Completed Works'}
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('recommended'); setCurrentPage(1); }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0 0.5rem 0.6rem 0.5rem',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: activeTab === 'recommended' ? '#0A2458' : 'var(--color-text-muted)',
                  borderBottom: activeTab === 'recommended' ? '3px solid #0A2458' : '3px solid transparent',
                  marginBottom: '-2px',
                  transition: 'all 0.18s ease'
                }}
              >
                {isHi ? 'अनुशंसित कार्य' : 'Recommended Works'}
              </button>
            </div>
          </div>

          {/* KPI Stat Cards (Matching screenshot) */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Total Projects Badge */}
            <div
              style={{
                background: '#FAF8F3',
                border: '1.5px solid #1D1E22',
                borderRadius: 'var(--radius-md)',
                boxShadow: '2px 3px 0px #1D1E22',
                padding: '0.75rem 1.4rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1D1E22' }}>
                {totalProjectsCount}
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {isHi ? 'कुल परियोजनाएं' : 'TOTAL PROJECTS'}
              </span>
            </div>

            {/* Total Cost Badge */}
            <div
              style={{
                background: '#FAF8F3',
                border: '1.5px solid #1D1E22',
                borderRadius: 'var(--radius-md)',
                boxShadow: '2px 3px 0px #1D1E22',
                padding: '0.75rem 1.4rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0A2458' }}>
                ₹{totalCostCr} CR
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {isHi ? 'कुल लागत' : 'TOTAL COST'}
              </span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', width: '100%' }}>
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
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder={isHi ? 'परियोजना शीर्षक, कार्य ID, MP या जिला खोजें...' : 'Search projects...'}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.75rem',
              fontSize: '0.9rem',
              fontFamily: 'var(--font-sans)',
              border: '1.5px solid #1D1E22',
              borderRadius: 'var(--radius-md)',
              background: '#FAF8F3',
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />
        </div>

        {/* Sub-Filters Row (Filters icon, Year select, Cost range slider, Clear All) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem',
            paddingTop: '0.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            {/* Filters Pill Button */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.85rem',
                border: '1px solid #1D1E22',
                borderRadius: 'var(--radius-sm)',
                background: '#FAF8F3',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#1D1E22'
              }}
            >
              <Filter size={14} />
              <span>{isHi ? 'फ़िल्टर' : 'Filters'}</span>
            </div>

            {/* Year Selector with matching Tactile Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                {isHi ? 'वर्ष:' : 'Year'}
              </span>
              <NirikshakDropdown
                value={selectedYear}
                displayValue={selectedYear}
                placeholder="All Years"
                showSearch={false}
                minWidth="130px"
                options={[
                  { value: 'All Years', label: isHi ? 'सभी वर्ष' : 'All Years' },
                  { value: '2026', label: '2026' },
                  { value: '2025', label: '2025' },
                  { value: '2024', label: '2024' },
                  { value: '2023', label: '2023' }
                ]}
                onSelect={(val) => {
                  setSelectedYear(val);
                  setCurrentPage(1);
                }}
                isHi={isHi}
              />
            </div>

            {/* Cost Range Slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                {isHi ? 'परियोजना लागत सीमा:' : 'Project Cost Range'}
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1D1E22', minWidth: '85px' }}>
                ₹0 - ₹{costMax}L
              </span>
              <input
                type="range"
                min="5"
                max="500"
                step="10"
                value={costMax}
                onChange={(e) => { setCostMax(Number(e.target.value)); setCurrentPage(1); }}
                style={{
                  accentColor: 'var(--color-accent-teal)',
                  cursor: 'pointer',
                  width: '130px'
                }}
              />
            </div>
          </div>

          {/* Clear All Sub-Filters */}
          <button
            type="button"
            onClick={() => {
              setSelectedYear('All Years');
              setCostMax(500);
              setSearchQuery('');
              setCurrentPage(1);
            }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--color-accent-teal-hover)',
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
          >
            {isHi ? 'सभी साफ़ करें' : 'Clear All'}
          </button>
        </div>
      </div>

      {/* ─── BOTTOM SECTION: 4-COLUMN PROJECT CARDS GRID (MATCHING SCREENSHOT 2) ─── */}
      {isLoading ? (
        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '3px 4px 0px #1D1E22',
            padding: '3rem',
            textAlign: 'center'
          }}
        >
          <div className="animate-spin" style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔄</div>
          <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.35rem', color: '#1D1E22', marginBottom: '0.5rem' }}>
            {isHi ? 'परियोजनाएं लोड हो रही हैं...' : 'Loading Real Projects...'}
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
            {isHi
              ? 'कृपया प्रतीक्षा करें, डेटाबेस से वास्तविक परियोजनाएं लोड की जा रही हैं।'
              : 'Please wait while we load real project records from the dataset.'}
          </p>
        </div>
      ) : paginatedProjects.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '3px 4px 0px #1D1E22',
            padding: '3rem',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
          <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.35rem', color: '#1D1E22', marginBottom: '0.5rem' }}>
            {isHi ? 'कोई परियोजना नहीं मिली' : 'No Projects Found'}
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
            {isHi
              ? 'कृपया चयनित फ़िल्टर या खोज मानदंड समायोजित करें।'
              : 'Try adjusting your state, constituency, year or search keywords.'}
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="btn-teal"
            style={{ padding: '0.55rem 1.4rem', fontSize: '0.86rem' }}
          >
            {isHi ? 'फ़िल्टर रीसेट करें' : 'Reset Filters'}
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: '1.25rem'
          }}
          className="find-projects-grid"
        >
          {paginatedProjects.map((project) => (
            <div
              key={project.id}
              className="card-light project-card-item"
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #1D1E22',
                borderRadius: 'var(--radius-md)',
                boxShadow: '2px 3px 0px #1D1E22',
                padding: '1.35rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1.15rem',
                transition: 'transform 0.16s ease, box-shadow 0.16s ease',
                position: 'relative'
              }}
            >
              {/* Top Details */}
              <div>
                {/* Title */}
                <h4
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    color: '#1D1E22',
                    lineHeight: 1.4,
                    margin: '0 0 0.75rem 0',
                    minHeight: '2.8em',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                  title={project.title}
                >
                  {project.title}
                </h4>

                {/* Category Badge Pill */}
                <div style={{ marginBottom: '1rem' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.2rem 0.65rem',
                      background: '#E8F5E9',
                      border: '1px solid #52B79A',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#1E7E34'
                    }}
                  >
                    {project.category}
                  </span>
                </div>

                {/* Cost */}
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1D1E22', marginBottom: '0.75rem' }}>
                  {formatIndianCurrency(project.cost)}
                </div>

                {/* Implementing Agency / District */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', fontSize: '0.74rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                  <MapPin size={14} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--color-text-muted)' }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {project.agency}
                  </span>
                </div>

                {/* Date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                  <Calendar size={14} style={{ flexShrink: 0 }} />
                  <span>{project.date}</span>
                </div>
              </div>

              {/* Bottom Row: MP Name & Payments Button */}
              <div
                style={{
                  borderTop: '1px solid rgba(29,30,34,0.1)',
                  paddingTop: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1D1E22', letterSpacing: '0.04em' }}>
                    {project.mp}
                  </div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                    {project.constituency}
                  </div>
                </div>

                {/* Payments Action Button */}
                <button
                  type="button"
                  onClick={() => setSelectedPaymentProject(project)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.38rem 0.75rem',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-sans)',
                    background: '#FFFFFF',
                    border: '1.2px solid #1D1E22',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: '1px 1.5px 0px #1D1E22',
                    cursor: 'pointer',
                    color: '#1D1E22',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--color-accent-teal)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#FFFFFF';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <CreditCard size={13} />
                  <span>{isHi ? 'भुगतान' : 'Payments'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── DYNAMIC PAGINATION BAR (MATCHING SCREENSHOT 2) ─── */}
      {filteredProjects.length > 0 && (
        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-md)',
            boxShadow: '2px 3px 0px #1D1E22',
            padding: '0.85rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          {/* Left: Showing items info */}
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            {isHi
              ? `कुल ${totalProjectsCount} परियोजनाओं में से ${startIndex + 1} से ${Math.min(startIndex + ITEMS_PER_PAGE, totalProjectsCount)} दिखा रहे हैं`
              : `Showing ${startIndex + 1} to ${Math.min(startIndex + ITEMS_PER_PAGE, totalProjectsCount)} of ${totalProjectsCount} projects`}
          </div>

          {/* Right: Pagination Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            {/* Previous Button */}
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '0.35rem 0.65rem',
                border: '1px solid #1D1E22',
                borderRadius: '4px',
                background: currentPage === 1 ? '#F3EFE6' : '#FFFFFF',
                color: currentPage === 1 ? '#999' : '#1D1E22',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: currentPage === 1 ? 'none' : '1px 1.5px 0px #1D1E22'
              }}
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page Numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px',
                  border: '1px solid #1D1E22',
                  background: currentPage === pageNum ? 'var(--color-accent-teal)' : '#FFFFFF',
                  color: '#1D1E22',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: currentPage === pageNum ? '1.5px 2px 0px #1D1E22' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {pageNum}
              </button>
            ))}

            {/* Next Button */}
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '0.35rem 0.65rem',
                border: '1px solid #1D1E22',
                borderRadius: '4px',
                background: currentPage === totalPages ? '#F3EFE6' : '#FFFFFF',
                color: currentPage === totalPages ? '#999' : '#1D1E22',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: currentPage === totalPages ? 'none' : '1px 1.5px 0px #1D1E22'
              }}
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>

            {/* Page X of Y Label */}
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>
              {isHi ? `पृष्ठ ${currentPage} / ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
            </span>
          </div>
        </div>
      )}

      {/* ─── PAYMENTS DETAIL MODAL ─── */}
      {selectedPaymentProject && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(29, 30, 34, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setSelectedPaymentProject(null)}
        >
          <div
            style={{
              background: '#FAF8F3',
              border: '2px solid #1D1E22',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '4px 6px 0px #1D1E22',
              width: '100%',
              maxWidth: '560px',
              padding: '1.75rem',
              boxSizing: 'border-box',
              animation: 'loginCardAppear 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1.5px solid #1D1E22', paddingBottom: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {isHi ? 'एमपीलैड्स भुगतान विवरण' : 'MPLADS DISBURSEMENT VOUCHERS'}
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.25rem', fontWeight: 800, color: '#1D1E22', margin: '0.2rem 0 0 0' }}>
                  {selectedPaymentProject.id}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPaymentProject(null)}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #1D1E22',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Project Title */}
            <p style={{ fontSize: '0.86rem', fontWeight: 600, color: '#1D1E22', lineHeight: 1.45, marginBottom: '1.25rem' }}>
              {selectedPaymentProject.title}
            </p>

            {/* Financial Summary Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ background: '#FFFFFF', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{isHi ? 'स्वीकृत राशि' : 'SANCTIONED AMOUNT'}</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1D1E22', marginTop: '0.2rem' }}>
                  {formatIndianCurrency(selectedPaymentProject.cost)}
                </div>
              </div>

              <div style={{ background: '#FFFFFF', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1E7E34' }}>{isHi ? 'कुल संवितरित' : 'TOTAL DISBURSED'}</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1E7E34', marginTop: '0.2rem' }}>
                  {formatIndianCurrency(selectedPaymentProject.disbursed)}
                </div>
              </div>
            </div>

            {/* Installment Timeline */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
                {isHi ? 'किस्त भुगतान इतिहास' : 'INSTALLMENT HISTORY'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedPaymentProject.installments > 0 ? (
                  Array.from({ length: selectedPaymentProject.installments }, (_, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E0E0E0',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.55rem 0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.8rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle size={15} color="#1E7E34" />
                        <span style={{ fontWeight: 700 }}>Installment {idx + 1}</span>
                      </div>
                      <span style={{ fontWeight: 800, color: '#1D1E22' }}>
                        {formatIndianCurrency(selectedPaymentProject.disbursed / selectedPaymentProject.installments)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                    {isHi ? 'कोई संवितरण दर्ज नहीं हुआ (प्रस्तावित कार्य)' : 'No disbursements issued yet (Under Sanction Review)'}
                  </div>
                )}
              </div>
            </div>

            {/* Close Modal Button */}
            <button
              type="button"
              onClick={() => setSelectedPaymentProject(null)}
              className="btn-teal"
              style={{ width: '100%', padding: '0.65rem', fontSize: '0.88rem', fontWeight: 700 }}
            >
              {isHi ? 'बंद करें' : 'Close Details'}
            </button>
          </div>
        </div>
      )}

      {/* ─── FOOTER (MATCHING LANDING PAGE WITH 3 CTA BUTTONS REMOVED) ─── */}
      <Footer hideCTAButtons={true} />

      {/* Responsive Grid CSS & Exact Landing Page Dropdown Hover Animation */}
      <style>{`
        @media (max-width: 1200px) {
          .find-projects-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 640px) {
          .find-projects-grid {
            grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
          }
        }
        .project-card-item:hover {
          transform: translateY(-3px);
          box-shadow: 3.5px 5px 0px #1D1E22 !important;
        }

        /* Continuous Downward Dropdown Physics & Styling */
        .nirikshak-dropdown-menu {
          animation: nirikshakDropdownAppear 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes nirikshakDropdownAppear {
          from {
            opacity: 0;
            transform: translateY(-4px) scale(0.99);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Clean, Subtle Dropdown Item Hover with Slight Text Lift/Pop Effect */
        .nirikshak-dropdown-row {
          background-color: transparent;
          transition: background-color 0.12s ease;
        }

        .nirikshak-dropdown-row .dropdown-item-text {
          color: #1D1E22;
          font-family: var(--font-sans);
          font-size: 0.88rem;
          font-weight: 600;
          line-height: 1.2;
          display: inline-block;
          transition: transform 0.12s ease, color 0.12s ease;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          will-change: transform;
        }

        .nirikshak-dropdown-row:hover {
          background-color: rgba(82, 183, 154, 0.14) !important;
        }

        .nirikshak-dropdown-row:hover .dropdown-item-text {
          transform: translateY(-1.5px);
          color: #0A2458;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
};

export default FindProjectsView;
