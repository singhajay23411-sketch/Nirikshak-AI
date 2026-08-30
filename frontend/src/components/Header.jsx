import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

const NirikshakLogo = () => {
  const [animStage, setAnimStage] = useState('idle'); // 'idle' | 'disappearing' | 'vanished' | 'revealing'
  const [dDelays, setDDelays] = useState([]);
  const [rDelays, setRDelays] = useState([]);

  const primaryChars = "NIRIKSHΛK ΛI".split("");
  const secondaryChars = "MPLΛDS INTELLIGENCE".split("");
  const totalCount = primaryChars.length + secondaryChars.length;

  const handleMouseEnter = () => {
    if (animStage !== 'idle') return;

    // Fisher-Yates shuffle helper to generate random rank indices
    const getRandomDelays = (stepMs) => {
      const indices = Array.from({ length: totalCount }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      const delays = new Array(totalCount);
      indices.forEach((charIdx, rank) => {
        delays[charIdx] = Math.round(rank * stepMs);
      });
      return delays;
    };

    // Separate randomized orders for disappear & reveal
    const disappearDelays = getRandomDelays(8); // 0ms to ~240ms
    const revealDelays = getRandomDelays(9);    // 0ms to ~270ms

    setDDelays(disappearDelays);
    setRDelays(revealDelays);

    // Phase 1: Disappearing in random order (0ms - 360ms)
    setAnimStage('disappearing');

    // Hold vanished state for a distinct 400ms pause beat (360ms - 760ms)
    setTimeout(() => {
      setAnimStage('vanished');
    }, 360);

    // Phase 2: Revealing back in a different random order after the pause (760ms - 1450ms)
    setTimeout(() => {
      setAnimStage('revealing');
    }, 760);

    // Reset to idle after smooth completion
    setTimeout(() => {
      setAnimStage('idle');
    }, 1450);
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        cursor: 'pointer',
        userSelect: 'none'
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 650 200"
        style={{
          height: 'clamp(44px, 7.5vw, 76px)',
          width: 'auto',
          maxWidth: 'min(220px, 48vw)',
          display: 'block'
        }}
      >
        {/* Primary Text: NIRIKSHΛK ΛI */}
        <text
          x="10"
          y="110"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="54"
          fontWeight="800"
          letterSpacing="12"
          fill="#1D1E22"
        >
          {primaryChars.map((char, index) => {
            const charGlobalIdx = index;
            const style = {};
            if (animStage === 'disappearing') {
              style.animation = 'logoDisappear 0.22s cubic-bezier(0.4, 0, 0.2, 1) forwards';
              style.animationDelay = `${dDelays[charGlobalIdx] || 0}ms`;
            } else if (animStage === 'vanished') {
              style.opacity = 0;
              style.transform = 'translateY(-7px) scale(0.8)';
            } else if (animStage === 'revealing') {
              style.animation = 'logoReveal 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards';
              style.animationDelay = `${rDelays[charGlobalIdx] || 0}ms`;
            }

            return (
              <tspan key={`p-${index}`} style={style}>
                {char === " " ? "\u00A0" : char}
              </tspan>
            );
          })}
        </text>

        {/* Secondary Text: MPLΛDS INTELLIGENCE */}
        <text
          x="15"
          y="155"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="18"
          fontWeight="500"
          letterSpacing="12"
          fill="#0A2458"
        >
          {secondaryChars.map((char, index) => {
            const charGlobalIdx = primaryChars.length + index;
            const style = {};
            if (animStage === 'disappearing') {
              style.animation = 'logoDisappear 0.22s cubic-bezier(0.4, 0, 0.2, 1) forwards';
              style.animationDelay = `${dDelays[charGlobalIdx] || 0}ms`;
            } else if (animStage === 'vanished') {
              style.opacity = 0;
              style.transform = 'translateY(-7px) scale(0.8)';
            } else if (animStage === 'revealing') {
              style.animation = 'logoReveal 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards';
              style.animationDelay = `${rDelays[charGlobalIdx] || 0}ms`;
            }

            return (
              <tspan key={`s-${index}`} style={style}>
                {char === " " ? "\u00A0" : char}
              </tspan>
            );
          })}
        </text>
      </svg>
    </div>
  );
};

const DRAWER_WIDTH = 274;

const Header = ({ activeSection, setActiveSection, onFeatureSelect }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedGroup, setMobileExpandedGroup] = useState(null);
  const { t } = useLanguage();

  // Desktop continuous sliding drawer states
  const [activeDrawer, setActiveDrawer] = useState(null); // 'home' | 'problem' | ... | 'more'
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerPos, setDrawerPos] = useState({ left: 0, top: 0, height: 168 });

  const navContainerRef = useRef(null);
  const navButtonRefs = useRef({});
  const closeTimerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 7 Main Navigation Groups: 6 Primary + "More"
  const navGroups = [
    {
      id: 'home',
      label: t('header.nav.home'),
      target: 'hero',
      items: [
        { id: 'overview', label: t('header.drawers.home.overview'), target: 'hero' },
        { id: 'keyMetrics', label: t('header.drawers.home.keyMetrics'), target: 'stats-marquee' },
        { id: 'riskSummary', label: t('header.drawers.home.riskSummary'), target: 'risk-scoring' },
        { id: 'recentAlerts', label: t('header.drawers.home.recentAlerts'), target: 'problem' },
      ]
    },
    {
      id: 'problem',
      label: t('header.nav.problem'),
      target: 'problem',
      items: [
        { id: 'mpladsOverview', label: t('header.drawers.problem.mpladsOverview'), target: 'problem' },
        { id: 'monitoringChallenges', label: t('header.drawers.problem.monitoringChallenges'), target: 'problem' },
        { id: 'commonIrregularities', label: t('header.drawers.problem.commonIrregularities'), target: 'problem' },
      ]
    },
    {
      id: 'solution',
      label: t('header.nav.solution'),
      target: 'process',
      items: [
        { id: 'dataCollection', label: t('header.drawers.solution.dataCollection'), target: 'process' },
        { id: 'aiAnalysis', label: t('header.drawers.solution.aiAnalysis'), target: 'process' },
        { id: 'anomalyDetection', label: t('header.drawers.solution.anomalyDetection'), target: 'ai-detection' },
        { id: 'investigationWorkflow', label: t('header.drawers.solution.investigationWorkflow'), target: 'investigation' },
      ]
    },
    {
      id: 'aiIntelligence',
      label: 'Unified Analysis',
      target: 'ai-detection',
      items: [
        { id: 'unifiedAnalysis', label: 'Unified Analysis', target: 'ai-detection' },
      ]
    },
    {
      id: 'projects',
      label: t('header.nav.projects') || 'Projects',
      target: 'ai-detection',
      items: [
        { id: 'findProject', label: t('header.drawers.projects.findProject') || 'Find Project', target: 'ai-detection' },
        { id: 'browseState', label: t('header.drawers.projects.browseState') || 'Browse State', target: 'geospatial' },
        { id: 'browseMpMla', label: t('header.drawers.projects.browseMpMla') || 'Browse MP/MLA', target: 'stats-marquee' },
        { id: 'compare', label: t('header.drawers.projects.compare') || 'Compare', target: 'process' },
        { id: 'feedback', label: t('header.drawers.projects.feedback') || 'Feedback', target: 'problem' },
      ]
    },
    {
      id: 'investigation',
      label: t('header.nav.investigation'),
      target: 'investigation',
      items: [
        { id: 'highRiskProjects', label: t('header.drawers.investigation.highRiskProjects'), target: 'investigation' },
        { id: 'evidenceReview', label: t('header.drawers.investigation.evidenceReview'), target: 'investigation' },
        { id: 'fieldVerification', label: t('header.drawers.investigation.fieldVerification'), target: 'investigation' },
        { id: 'resolution', label: t('header.drawers.investigation.resolution'), target: 'investigation' },
      ]
    },
    {
      id: 'more',
      label: t('header.nav.more') || 'More',
      target: 'risk-scoring',
      isGrouped: true,
      subGroups: [
        {
          title: t('header.drawers.more.monitoring') || 'MONITORING',
          items: [
            { id: 'projectStatus', label: t('header.drawers.more.projectStatus') || 'Project Status', target: 'stats-marquee' },
            { id: 'projectTimeline', label: t('header.drawers.more.projectTimeline') || 'Project Timeline', target: 'process' },
          ]
        },
        {
          title: t('header.drawers.more.reports') || 'REPORTS',
          items: [
            { id: 'generateReport', label: t('header.drawers.more.generateReport') || 'Generate Report', target: 'investigation' },
            { id: 'auditTrail', label: t('header.drawers.more.auditTrail') || 'Audit Trail', target: 'investigation' },
          ]
        },
        {
          title: t('header.drawers.more.complaints') || 'COMPLAINTS',
          items: [
            { id: 'citizenComplaints', label: t('header.drawers.more.citizenComplaints') || 'Citizen Complaints', target: 'problem' },
            { id: 'complaintTracking', label: t('header.drawers.more.complaintTracking') || 'Complaint Tracking', target: 'investigation' },
            { id: 'complaintAnalytics', label: t('header.drawers.more.complaintAnalytics') || 'Complaint Analytics', target: 'risk-scoring' },
          ]
        }
      ]
    }
  ];

  // Helper to scroll smoothly to a section
  const handleNavClick = (sectionId) => {
    if (setActiveSection) setActiveSection(sectionId);
    setMobileMenuOpen(false);
    setIsDrawerOpen(false);
    setActiveDrawer(null);

    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: sectionId } });
      return;
    }

    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Helper for clicking a specific drawer feature item
  const handleDrawerItemClick = (item) => {
    setIsDrawerOpen(false);
    setActiveDrawer(null);
    setMobileMenuOpen(false);

    if (onFeatureSelect) {
      onFeatureSelect(item.id, item.target);
    } else {
      const targetPath = `/features/${item.id}`;
      if (location.pathname !== targetPath) {
        navigate(targetPath);
      }
    }
  };

  // Calculate drawer position and content-driven height when hovering a nav item
  const updateDrawerPosition = useCallback((groupId) => {
    const buttonEl = navButtonRefs.current[groupId];
    const containerEl = navContainerRef.current;

    if (!buttonEl || !containerEl) return;

    const btnRect = buttonEl.getBoundingClientRect();
    const containerRect = containerEl.getBoundingClientRect();

    // Center of the button relative to nav container
    const btnCenter = btnRect.left + btnRect.width / 2 - containerRect.left;
    let targetLeft = btnCenter - DRAWER_WIDTH / 2;

    // Constrain so it doesn't overflow outside container bounds
    const maxLeft = containerRect.width - DRAWER_WIDTH - 6;
    if (targetLeft < 6) targetLeft = 6;
    if (targetLeft > maxLeft) targetLeft = maxLeft;

    // Natural content-driven height based on number of items/groups
    const group = navGroups.find(g => g.id === groupId);
    let calculatedHeight = 168;

    if (group?.isGrouped && group?.subGroups) {
      // 4 group titles (24px each) + 9 items (36px each) = 96 + 324 = 420px
      const totalItems = group.subGroups.reduce((acc, sg) => acc + sg.items.length, 0);
      calculatedHeight = group.subGroups.length * 24 + totalItems * 36;
    } else if (group?.items) {
      calculatedHeight = group.items.length * 42;
    }

    setDrawerPos({
      left: targetLeft,
      top: btnRect.height + 10,
      height: calculatedHeight
    });
  }, [navGroups]);

  const handleNavMouseEnter = (groupId) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    setActiveDrawer(groupId);
    updateDrawerPosition(groupId);
    setIsDrawerOpen(true);
  };

  const handleNavMouseLeave = () => {
    closeTimerRef.current = setTimeout(() => {
      setIsDrawerOpen(false);
      setActiveDrawer(null);
    }, 180);
  };

  const handleDrawerMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsDrawerOpen(true);
  };

  const handleDrawerMouseLeave = () => {
    closeTimerRef.current = setTimeout(() => {
      setIsDrawerOpen(false);
      setActiveDrawer(null);
    }, 180);
  };

  const currentGroup = navGroups.find(g => g.id === activeDrawer);

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: isScrolled ? '74px' : '86px',
        zIndex: 1000,
        transition: 'all 0.3s ease',
        background: isScrolled ? 'rgba(250, 248, 243, 0.96)' : 'var(--color-bg-light)',
        backdropFilter: isScrolled ? 'blur(10px)' : 'none',
        borderBottom: '1px solid var(--color-border-subtle)',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <div style={{ width: '100%', maxWidth: '100%', padding: '0 clamp(1.25rem, 2.5vw, 2.5rem)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%', position: 'relative' }}>

        {/* Logo Block — left edge */}
        <div
          onClick={() => handleNavClick('hero')}
          className="logo-brand"
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <NirikshakLogo />
        </div>

        {/* Viewport-centered Desktop Navigation Container with Continuous Sliding Drawer */}
        <nav
          ref={navContainerRef}
          className="desktop-nav"
          style={{
            display: 'none',
            gap: '1.25rem',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            height: '100%',
          }}
          onMouseLeave={handleNavMouseLeave}
        >
          {navGroups.map((group) => {
            const isHovered = activeDrawer === group.id;
            return (
              <div
                key={group.id}
                ref={(el) => { navButtonRefs.current[group.id] = el; }}
                onMouseEnter={() => handleNavMouseEnter(group.id)}
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: '100%',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (group.id === 'aiIntelligence') {
                      setIsDrawerOpen(false);
                      setActiveDrawer(null);
                      navigate('/features/aiIntelligence');
                      return;
                    }
                    handleNavClick(group.target);
                  }}
                  className={`nav-item-btn ${isHovered ? 'is-hovered' : ''}`}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    whiteSpace: 'nowrap',
                    padding: '0.35rem 0.55rem',
                    margin: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    outline: 'none',
                  }}
                >
                  {/* Invisible structural anchor reserving constant layout width */}
                  <span
                    style={{
                      visibility: 'hidden',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.94rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      lineHeight: 1.2,
                    }}
                  >
                    {group.label}
                  </span>

                  {/* Visible text layer that transforms into handwritten/script font ONLY on hover */}
                  <span
                    className="nav-text-label"
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontFamily: isHovered ? 'var(--font-handwritten)' : 'var(--font-sans)',
                      fontSize: isHovered ? '1.24rem' : '0.94rem',
                      fontWeight: isHovered ? 700 : 600,
                      fontStyle: isHovered ? 'italic' : 'normal',
                      color: isHovered ? 'var(--color-accent-teal-hover)' : '#1D1E22',
                      letterSpacing: isHovered ? '0.03em' : 'normal',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      transition: 'color 0.16s ease, font-size 0.16s ease',
                    }}
                  >
                    {group.label}
                  </span>
                </button>
              </div>
            );
          })}

          {/* Unified Physical Attached Continuous Sliding Drawer */}
          <div
            onMouseEnter={handleDrawerMouseEnter}
            onMouseLeave={handleDrawerMouseLeave}
            className={`continuous-nav-drawer ${isDrawerOpen ? 'is-open' : ''}`}
            style={{
              position: 'absolute',
              top: `${drawerPos.top}px`,
              left: `${drawerPos.left}px`,
              width: `${DRAWER_WIDTH}px`,
              height: `${drawerPos.height}px`,
              pointerEvents: isDrawerOpen ? 'auto' : 'none',
            }}
          >
            {/* Invisible hover bridge connecting navbar item with drawer */}
            <div
              style={{
                position: 'absolute',
                top: '-16px',
                left: 0,
                right: 0,
                height: '18px',
                background: 'transparent',
              }}
            />

            {/* Tactile Drawer Box */}
            <div
              className="drawer-box"
              style={{
                background: '#FAF8F3',
                border: '1.5px solid #1D1E22',
                borderRadius: 'var(--radius-md)',
                boxShadow: '3px 4px 0px #1D1E22',
                width: '100%',
                height: '100%',
                overflowY: currentGroup?.isGrouped ? 'auto' : 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* If group is standard flat items list */}
              {currentGroup && !currentGroup.isGrouped && currentGroup.items && currentGroup.items.map((item, idx) => {
                const isLast = idx === currentGroup.items.length - 1;
                return (
                  <div
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDrawerItemClick(item);
                    }}
                    className="drawer-item-row"
                    style={{
                      height: '42px',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 1.15rem',
                      borderBottom: isLast ? 'none' : '1px solid rgba(29, 30, 34, 0.1)',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <span className="drawer-item-text" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.label}
                    </span>
                  </div>
                );
              })}

              {/* If group is the More drawer containing visually separated categories */}
              {currentGroup && currentGroup.isGrouped && currentGroup.subGroups && currentGroup.subGroups.map((subGroup, sgIdx) => (
                <div key={subGroup.title} style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Category Header */}
                  <div
                    style={{
                      padding: '0.35rem 1.15rem 0.2rem 1.15rem',
                      fontSize: '0.66rem',
                      fontWeight: 800,
                      letterSpacing: '0.09em',
                      color: '#0A2458',
                      textTransform: 'uppercase',
                      background: 'rgba(243, 239, 230, 0.75)',
                      borderBottom: '1px solid rgba(29, 30, 34, 0.08)',
                      borderTop: sgIdx === 0 ? 'none' : '1px solid rgba(29, 30, 34, 0.12)',
                      userSelect: 'none',
                    }}
                  >
                    {subGroup.title}
                  </div>

                  {/* Items under Category */}
                  {subGroup.items.map((item, itemIdx) => {
                    const isLastInSub = itemIdx === subGroup.items.length - 1 && sgIdx === currentGroup.subGroups.length - 1;
                    return (
                      <div
                        key={item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDrawerItemClick(item);
                        }}
                        className="drawer-item-row"
                        style={{
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 1.15rem',
                          borderBottom: isLastInSub ? 'none' : '1px solid rgba(29, 30, 34, 0.06)',
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        <span className="drawer-item-text" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </nav>

        {/* Fixed Right Action Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0, transform: 'translateX(0.5rem)' }}>
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Explore Dashboard Button - Desktop Only */}
          <button
            onClick={() => handleNavClick('risk-scoring')}
            className="btn-teal header-explore-btn"
            style={{
              padding: '0.65rem 1.4rem',
              fontSize: '0.88rem',
              fontWeight: 600,
              width: '202px',
              minWidth: '202px',
              maxWidth: '202px',
              height: '42px',
              boxSizing: 'border-box',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t('common.exploreDashboard')}
            </span>
            <ArrowRight size={16} style={{ flexShrink: 0 }} />
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'flex',
              background: 'none',
              border: 'none',
              color: '#1D1E22',
              cursor: 'pointer',
              padding: '0.4rem',
              flexShrink: 0
            }}
            className="mobile-toggle"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer (Expandable Accordion Menu) */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#FAF8F3',
            borderBottom: '1.5px solid var(--color-border-dark)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            boxShadow: 'var(--shadow-card)',
            maxHeight: 'calc(100vh - 90px)',
            overflowY: 'auto'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(29,30,34,0.1)' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#5A5A5A' }}>{t('header.switchLanguage')}</span>
            <LanguageSwitcher isMobile={true} />
          </div>

          {/* Mobile Explore Dashboard CTA */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleNavClick('risk-scoring');
            }}
            className="btn-teal"
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '0.92rem',
              fontWeight: 700,
              justifyContent: 'center',
              marginBottom: '0.25rem'
            }}
          >
            <span>{t('common.exploreDashboard')}</span>
            <ArrowRight size={16} />
          </button>

          {navGroups.map((group) => {
            const isExpanded = mobileExpandedGroup === group.id;
            return (
              <div key={group.id} style={{ borderBottom: '1px solid rgba(29,30,34,0.08)' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    if (group.id === 'aiIntelligence') {
                      setMobileMenuOpen(false);
                      navigate('/features/aiIntelligence');
                      return;
                    }
                    setMobileExpandedGroup(isExpanded ? null : group.id);
                  }}
                >
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: '#1D1E22' }}>
                    {group.label}
                  </span>
                  {group.id !== 'aiIntelligence' && (
                    <ChevronDown
                      size={18}
                      style={{
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        color: 'var(--color-text-muted)'
                      }}
                    />
                  )}
                </div>

                {isExpanded && (
                  <div style={{ paddingLeft: '0.75rem', paddingBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {/* Standard flat list */}
                    {!group.isGrouped && group.items && group.items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleDrawerItemClick(item);
                        }}
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 500,
                          color: '#4A4D55',
                          padding: '0.35rem 0',
                          cursor: 'pointer'
                        }}
                      >
                        {item.label}
                      </div>
                    ))}

                    {/* More grouped categories */}
                    {group.isGrouped && group.subGroups && group.subGroups.map((sg) => (
                      <div key={sg.title} style={{ marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0A2458', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>
                          {sg.title}
                        </div>
                        {sg.items.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              setMobileMenuOpen(false);
                              handleDrawerItemClick(item);
                            }}
                            style={{
                              fontSize: '0.86rem',
                              fontWeight: 500,
                              color: '#4A4D55',
                              padding: '0.25rem 0 0.25rem 0.5rem',
                              cursor: 'pointer'
                            }}
                          >
                            {item.label}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Embedded CSS for smooth physics-based drawer transitions */}
      <style>{`
        @keyframes logoDisappear {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-7px) scale(0.8);
          }
        }
        @keyframes logoReveal {
          0% {
            opacity: 0;
            transform: translateY(7px) scale(0.8);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .logo-brand:hover {
          transform: scale(1.03);
        }

        /* Continuous Sliding Drawer Physics */
        .continuous-nav-drawer {
          opacity: 0;
          visibility: hidden;
          transform: translateY(6px) scale(0.98);
          transform-origin: top center;
          transition: 
            left 0.26s cubic-bezier(0.16, 1, 0.3, 1),
            height 0.26s cubic-bezier(0.16, 1, 0.3, 1),
            opacity 0.2s ease,
            transform 0.24s cubic-bezier(0.16, 1, 0.3, 1),
            visibility 0.2s ease;
          will-change: left, height, transform, opacity;
          z-index: 100;
        }

        .continuous-nav-drawer.is-open {
          opacity: 1;
          visibility: visible;
          transform: translateY(0) scale(1);
        }

        /* Drawer Item Row Hover State */
        .drawer-item-row {
          background-color: transparent;
          transition: background-color 0.15s ease, padding-left 0.15s ease;
        }

        .drawer-item-row .drawer-item-text {
          color: #1D1E22;
          font-family: var(--font-sans);
          font-size: 0.86rem;
          font-weight: 600;
          line-height: 1.2;
          transition: color 0.15s ease, font-size 0.15s ease;
        }

        .drawer-item-row:hover {
          background-color: #F3EFE6 !important;
          padding-left: 1.35rem !important;
        }

        .drawer-item-row:hover .drawer-item-text {
          color: var(--color-accent-teal-hover) !important;
          font-family: var(--font-handwritten) !important;
          font-style: italic !important;
          font-size: 1.15rem !important;
          font-weight: 700 !important;
          letter-spacing: 0.02em;
        }

        .nav-item-btn {
          cursor: pointer;
          background: none;
          border: none;
          outline: none;
        }

        .nav-item-btn .nav-text-label {
          color: #1D1E22;
          font-family: var(--font-sans);
          transition: color 0.16s ease, font-size 0.16s ease;
        }

        .nav-item-btn:hover .nav-text-label,
        .nav-item-btn.is-hovered .nav-text-label {
          color: var(--color-accent-teal-hover) !important;
          font-family: var(--font-handwritten) !important;
          font-style: italic !important;
          font-size: 1.24rem !important;
          font-weight: 700 !important;
        }

        @media (min-width: 992px) {
          .desktop-nav { display: flex !important; }
          .mobile-toggle { display: none !important; }
          .header-explore-btn { display: inline-flex !important; }
        }
        @media (max-width: 991px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: flex !important; }
          .header-explore-btn { display: none !important; }
        }
      `}</style>
    </header>
  );
};

export default Header;
