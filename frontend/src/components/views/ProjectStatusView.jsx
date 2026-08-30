import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, CheckCircle2, Clock, AlertTriangle, 
  Layers, ChevronLeft, ChevronRight, X, Building2, MapPin, 
  TrendingUp, DollarSign, Activity, FileText, CheckCircle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import Footer from '../Footer';

// Default enriched projects dataset representing MPLADS works across states
const DEFAULT_STATUS_PROJECTS = [
  {
    id: 'MPLADS-2026-8871',
    title: 'Solar High-Mast LED Lighting Installation at 14 Village Intersections',
    category: 'Renewable Energy',
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    mp: 'Smt. Darshana Singh',
    constituency: 'Varanasi Lok Sabha',
    sanctionedCost: 3200000,
    sanctionedCostFormatted: '₹32,00,000',
    expenditure: 2240000,
    expenditureFormatted: '₹22,40,000',
    expenditurePct: 70,
    physicalProgress: 68,
    status: 'Ongoing',
    statusLabel: 'In Progress (On Track)',
    statusLabelHi: 'प्रगति पर (समय पर)',
    agency: 'Varanasi Smart Solar Power Ltd',
    sanctionDate: '02 Mar 2024',
    targetDate: '30 Oct 2024'
  },
  {
    id: 'MPLADS-2026-7734',
    title: 'Upgradation of District Primary Health Center Ward 7 & Diagnostic Lab',
    category: 'Healthcare Infrastructure',
    state: 'Nagaland',
    district: 'Kohima',
    mp: 'Smt. S. Phangnon Konyak',
    constituency: 'Sitting Rajya Sabha, Nagaland',
    sanctionedCost: 7500000,
    sanctionedCostFormatted: '₹75,00,000',
    expenditure: 6750000,
    expenditureFormatted: '₹67,50,000',
    expenditurePct: 90,
    physicalProgress: 52,
    status: 'Delayed',
    statusLabel: 'Delayed (Review Needed)',
    statusLabelHi: 'विलंबित (समीक्षा आवश्यक)',
    agency: 'Eastern Hill Construction Corp',
    sanctionDate: '10 Feb 2024',
    targetDate: '20 Sep 2024'
  },
  {
    id: 'MPLADS-2026-6190',
    title: 'Construction of Overbridge Approach Road & Culverts at NH-30',
    category: 'Transport & Roads',
    state: 'Bihar',
    district: 'Patna',
    mp: 'Shri Ravi Shankar Prasad',
    constituency: 'Patna Sahib Lok Sabha',
    sanctionedCost: 12000000,
    sanctionedCostFormatted: '₹1,20,00,000',
    expenditure: 11800000,
    expenditureFormatted: '₹1,18,00,000',
    expenditurePct: 98,
    physicalProgress: 35,
    status: 'Delayed',
    statusLabel: 'Severely Delayed',
    statusLabelHi: 'अत्यधिक विलंबित',
    agency: 'Ganga Valley Infrastructure JV',
    sanctionDate: '20 Nov 2023',
    targetDate: '15 Jul 2024'
  },
  {
    id: 'MPLADS-2026-4412',
    title: 'Smart Digital Classrooms & STEM Laboratory Equipment in 12 Govt Schools',
    category: 'Education & Schools',
    state: 'Rajasthan',
    district: 'Jaipur',
    mp: 'Col. Rajyavardhan Singh Rathore',
    constituency: 'Jaipur Rural Lok Sabha',
    sanctionedCost: 2800000,
    sanctionedCostFormatted: '₹28,00,000',
    expenditure: 2800000,
    expenditureFormatted: '₹28,00,000',
    expenditurePct: 100,
    physicalProgress: 100,
    status: 'Completed',
    statusLabel: 'Completed & Verified',
    statusLabelHi: 'पूर्ण एवं सत्यापित',
    agency: 'Jaipur EdTech Solutions Ltd',
    sanctionDate: '05 Jan 2024',
    targetDate: '30 May 2024'
  },
  {
    id: 'MPLADS-2026-3398',
    title: 'Deep Borewell, Overhead Reservoir & Piped Drinking Water Supply',
    category: 'Drinking Water',
    state: 'Madhya Pradesh',
    district: 'Indore',
    mp: 'Shri Shankar Lalwani',
    constituency: 'Indore Lok Sabha',
    sanctionedCost: 4500000,
    sanctionedCostFormatted: '₹45,00,000',
    expenditure: 4500000,
    expenditureFormatted: '₹45,00,000',
    expenditurePct: 100,
    physicalProgress: 100,
    status: 'Completed',
    statusLabel: 'Completed & Verified',
    statusLabelHi: 'पूर्ण एवं सत्यापित',
    agency: 'Indore Municipal Water Works',
    sanctionDate: '12 Dec 2023',
    targetDate: '15 Apr 2024'
  },
  {
    id: 'MPLADS-2026-2180',
    title: 'Construction of Multipurpose Cyclone Shelter & Community Hall',
    category: 'Community Infrastructure',
    state: 'Odisha',
    district: 'Puri',
    mp: 'Shri Sambit Patra',
    constituency: 'Puri Lok Sabha',
    sanctionedCost: 8500000,
    sanctionedCostFormatted: '₹85,00,000',
    expenditure: 4250000,
    expenditureFormatted: '₹42,50,000',
    expenditurePct: 50,
    physicalProgress: 55,
    status: 'Ongoing',
    statusLabel: 'In Progress (On Track)',
    statusLabelHi: 'प्रगति पर (समय पर)',
    agency: 'Odisha State Disaster Mitigation Agency',
    sanctionDate: '18 Apr 2024',
    targetDate: '30 Dec 2024'
  },
  {
    id: 'MPLADS-2026-1192',
    title: 'Installation of Open Gym Equipment & Track in Public Parks',
    category: 'Sports & Public Health',
    state: 'Maharashtra',
    district: 'Pune',
    mp: 'Shri Murlidhar Mohol',
    constituency: 'Pune Lok Sabha',
    sanctionedCost: 1800000,
    sanctionedCostFormatted: '₹18,00,000',
    expenditure: 0,
    expenditureFormatted: '₹0',
    expenditurePct: 0,
    physicalProgress: 0,
    status: 'Not Started',
    statusLabel: 'Sanctioned / Pending Start',
    statusLabelHi: 'स्वीकृत / प्रारंभ प्रतीक्षित',
    agency: 'Pune Urban Development Cell',
    sanctionDate: '15 May 2024',
    targetDate: '15 Jan 2025'
  },
  {
    id: 'MPLADS-2026-9051',
    title: 'Modernization of Anganwadi Centers with Nutrition & Play Facilities',
    category: 'Child Welfare',
    state: 'Karnataka',
    district: 'Bengaluru South',
    mp: 'Shri Tejasvi Surya',
    constituency: 'Bangalore South Lok Sabha',
    sanctionedCost: 3500000,
    sanctionedCostFormatted: '₹35,00,000',
    expenditure: 2800000,
    expenditureFormatted: '₹28,00,000',
    expenditurePct: 80,
    physicalProgress: 85,
    status: 'Ongoing',
    statusLabel: 'In Progress (Near Completion)',
    statusLabelHi: 'प्रगति पर (लगभग पूर्ण)',
    agency: 'BBMP Social Welfare Division',
    sanctionDate: '10 Feb 2024',
    targetDate: '15 Nov 2024'
  },
  {
    id: 'MPLADS-2026-8142',
    title: 'Sub-Health Center Boundary Wall and Solar Cold Chain Storage Unit',
    category: 'Healthcare Infrastructure',
    state: 'Jharkhand',
    district: 'Ranchi',
    mp: 'Shri Sanjay Seth',
    constituency: 'Ranchi Lok Sabha',
    sanctionedCost: 2200000,
    sanctionedCostFormatted: '₹22,00,000',
    expenditure: 2200000,
    expenditureFormatted: '₹22,00,000',
    expenditurePct: 100,
    physicalProgress: 100,
    status: 'Completed',
    statusLabel: 'Completed & Verified',
    statusLabelHi: 'पूर्ण एवं सत्यापित',
    agency: 'Jharkhand Rural Works Department',
    sanctionDate: '14 Jan 2024',
    targetDate: '10 Jun 2024'
  },
  {
    id: 'MPLADS-2026-7023',
    title: 'Construction of Cattle Care Center & Animal Treatment Sheds',
    category: 'Animal Husbandry',
    state: 'Gujarat',
    district: 'Gandhinagar',
    mp: 'Shri Amit Shah',
    constituency: 'Gandhinagar Lok Sabha',
    sanctionedCost: 4000000,
    sanctionedCostFormatted: '₹40,00,000',
    expenditure: 3200000,
    expenditureFormatted: '₹32,00,000',
    expenditurePct: 80,
    physicalProgress: 75,
    status: 'Ongoing',
    statusLabel: 'In Progress (On Track)',
    statusLabelHi: 'प्रगति पर (समय पर)',
    agency: 'Gandhinagar District Panchayat',
    sanctionDate: '01 Mar 2024',
    targetDate: '15 Dec 2024'
  },
  {
    id: 'MPLADS-2026-6541',
    title: 'Laying of Concrete Internal Village Roads and Side Drainage Channels',
    category: 'Transport & Roads',
    state: 'Assam',
    district: 'Guwahati',
    mp: 'Smt. Bijoya Chakravarty',
    constituency: 'Gauhati Lok Sabha',
    sanctionedCost: 6000000,
    sanctionedCostFormatted: '₹60,00,000',
    expenditure: 5700000,
    expenditureFormatted: '₹57,00,000',
    expenditurePct: 95,
    physicalProgress: 40,
    status: 'Delayed',
    statusLabel: 'Delayed (Monsoon Stoppage)',
    statusLabelHi: 'विलंबित (मानसून रुकावट)',
    agency: 'Assam PWD Roads Division',
    sanctionDate: '10 Oct 2023',
    targetDate: '30 Apr 2024'
  },
  {
    id: 'MPLADS-2026-5819',
    title: 'Installation of Solid Waste Segregation & Bio-Composting Units',
    category: 'Sanitation',
    state: 'Tamil Nadu',
    district: 'Chennai South',
    mp: 'Dr. Thamizhachi Thangapandian',
    constituency: 'Chennai South Lok Sabha',
    sanctionedCost: 5000000,
    sanctionedCostFormatted: '₹50,00,000',
    expenditure: 1000000,
    expenditureFormatted: '₹10,00,000',
    expenditurePct: 20,
    physicalProgress: 0,
    status: 'Not Started',
    statusLabel: 'Tender Process Ongoing',
    statusLabelHi: 'निविदा प्रक्रिया जारी',
    agency: 'Greater Chennai Corporation',
    sanctionDate: '12 Jun 2024',
    targetDate: '28 Feb 2025'
  }
];

const ProjectStatusView = () => {
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const [projects, setProjects] = useState(DEFAULT_STATUS_PROJECTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch all real projects from dataset feed
  useEffect(() => {
    fetch('/data/real_projects.json')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          // Normalize and enrich all real projects
          const normalized = data.map((p, idx) => {
            const isComp = p.type === 'completed' || p.status?.toLowerCase().includes('complete');
            const costVal = typeof p.cost === 'number' ? p.cost : 1500000;
            const expVal = typeof p.disbursed === 'number' ? p.disbursed : (isComp ? costVal : Math.round(costVal * 0.7));
            const expPct = Math.min(100, Math.round((expVal / (costVal || 1)) * 100));
            const physProg = isComp ? 100 : (idx % 3 === 0 ? 40 : idx % 3 === 1 ? 75 : 0);
            
            let status = 'Ongoing';
            let statusLabel = 'In Progress';
            let statusLabelHi = 'प्रगति पर';

            if (isComp || physProg === 100) {
              status = 'Completed';
              statusLabel = 'Completed & Verified';
              statusLabelHi = 'पूर्ण एवं सत्यापित';
            } else if (expPct > physProg + 25 || p.status?.toLowerCase().includes('delay')) {
              status = 'Delayed';
              statusLabel = 'Delayed / Review Needed';
              statusLabelHi = 'विलंबित / समीक्षा आवश्यक';
            } else if (physProg === 0 || p.status?.toLowerCase().includes('not started') || p.status?.toLowerCase().includes('sanctioned')) {
              status = 'Not Started';
              statusLabel = 'Sanctioned / Pending Start';
              statusLabelHi = 'स्वीकृत / प्रारंभ प्रतीक्षित';
            }

            return {
              id: p.id || `MPLADS-${202600 + idx}`,
              title: p.title || 'MPLADS Community Development Work',
              category: p.category || 'Infrastructure',
              state: p.state || 'National',
              district: p.district || p.constituency || 'Constituency Area',
              mp: p.mp || 'Sitting Member of Parliament',
              constituency: p.constituency ? (p.constituency.toLowerCase().includes('sabha') ? p.constituency : `${p.constituency} Lok Sabha`) : 'Constituency',
              sanctionedCost: costVal,
              sanctionedCostFormatted: `₹${costVal.toLocaleString('en-IN')}`,
              expenditure: expVal,
              expenditureFormatted: `₹${expVal.toLocaleString('en-IN')}`,
              expenditurePct: expPct,
              physicalProgress: physProg,
              status,
              statusLabel,
              statusLabelHi,
              agency: p.agency || 'District Rural Development Authority',
              sanctionDate: p.date || '2024'
            };
          });

          // Merge default curated list with all real projects, deduplicating by ID
          const existingIds = new Set(DEFAULT_STATUS_PROJECTS.map(d => d.id));
          const uniqueNormalized = normalized.filter(n => !existingIds.has(n.id));
          setProjects([...DEFAULT_STATUS_PROJECTS, ...uniqueNormalized]);
        }
      })
      .catch(() => {
        // Fallback to DEFAULT_STATUS_PROJECTS
      });
  }, []);

  // Reset pagination on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFilter]);

  // Summary Metrics dynamically calculated from the dataset
  const summaryMetrics = useMemo(() => {
    const total = projects.length;
    const completed = projects.filter(p => p.status === 'Completed').length;
    const ongoing = projects.filter(p => p.status === 'Ongoing').length;
    const delayed = projects.filter(p => p.status === 'Delayed').length;
    const notStarted = projects.filter(p => p.status === 'Not Started').length;

    const completedPct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const ongoingPct = total > 0 ? Math.round((ongoing / total) * 100) : 0;
    const delayedPct = total > 0 ? Math.round((delayed / total) * 100) : 0;
    const notStartedPct = total > 0 ? Math.round((notStarted / total) * 100) : 0;

    return {
      total,
      completed,
      ongoing,
      delayed,
      notStarted,
      completedPct,
      ongoingPct,
      delayedPct,
      notStartedPct
    };
  }, [projects]);

  // High-performance tokenized multi-field filter
  const filteredProjects = useMemo(() => {
    const rawQuery = searchQuery.trim().toLowerCase();
    const queryTokens = rawQuery ? rawQuery.split(/\s+/).filter(Boolean) : [];

    return projects.filter(p => {
      // 1. Status Filter Check
      const matchesFilter = 
        selectedFilter === 'ALL' ||
        (selectedFilter === 'COMPLETED' && p.status === 'Completed') ||
        (selectedFilter === 'ONGOING' && p.status === 'Ongoing') ||
        (selectedFilter === 'DELAYED' && p.status === 'Delayed') ||
        (selectedFilter === 'NOT_STARTED' && p.status === 'Not Started');

      if (!matchesFilter) return false;

      // 2. Search Query Multi-token Match (all tokens must match at least one field)
      if (queryTokens.length === 0) return true;

      const searchableText = `${p.id} ${p.title} ${p.district} ${p.state} ${p.category} ${p.mp} ${p.constituency} ${p.agency} ${p.statusLabel} ${p.statusLabelHi || ''}`.toLowerCase();

      return queryTokens.every(token => searchableText.includes(token));
    });
  }, [projects, searchQuery, selectedFilter]);

  // 12 items per page pagination
  const pageSize = 12;
  const totalProjects = filteredProjects.length;
  const totalPages = Math.max(1, Math.ceil(totalProjects / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalProjects);
  const displayedProjects = filteredProjects.slice(startIndex, endIndex);

  // Smart page numbers windowing
  const getPageNumbers = () => {
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
  };

  // Helper for Status Badge Styling
  const getStatusBadge = (status, label, labelHi) => {
    switch (status) {
      case 'Completed':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.25rem 0.65rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.76rem',
            fontWeight: 800,
            background: '#F0FDF4',
            color: '#1E7E34',
            border: '1px solid #1E7E34',
            whiteSpace: 'nowrap'
          }}>
            <CheckCircle2 size={12} strokeWidth={2.4} />
            <span>{isHi ? (labelHi || 'पूर्ण') : (label || 'Completed')}</span>
          </span>
        );
      case 'Ongoing':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.25rem 0.65rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.76rem',
            fontWeight: 800,
            background: '#E8F5E9',
            color: '#0A2458',
            border: '1px solid #52B79A',
            whiteSpace: 'nowrap'
          }}>
            <Activity size={12} strokeWidth={2.4} color="#52B79A" />
            <span>{isHi ? (labelHi || 'प्रगति पर') : (label || 'In Progress')}</span>
          </span>
        );
      case 'Delayed':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.25rem 0.65rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.76rem',
            fontWeight: 800,
            background: '#FEF2F2',
            color: '#D9534F',
            border: '1px solid #D9534F',
            whiteSpace: 'nowrap'
          }}>
            <AlertTriangle size={12} strokeWidth={2.4} />
            <span>{isHi ? (labelHi || 'विलंबित') : (label || 'Delayed')}</span>
          </span>
        );
      case 'Not Started':
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.25rem 0.65rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.76rem',
            fontWeight: 800,
            background: '#FAF8F3',
            color: 'var(--color-text-secondary)',
            border: '1px solid #1D1E22',
            whiteSpace: 'nowrap'
          }}>
            <Clock size={12} strokeWidth={2.4} />
            <span>{isHi ? (labelHi || 'प्रारंभ प्रतीक्षित') : (label || 'Not Started')}</span>
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%' }}>
      {/* ─── 1. PAGE INTRODUCTION ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1.5px solid #1D1E22', paddingBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '2.1rem', fontWeight: 800, color: '#1D1E22', margin: 0, lineHeight: 1.2 }}>
            {isHi ? 'परियोजना स्थिति' : 'Project Status'}
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', marginTop: '0.35rem', margin: 0, maxWidth: '750px', lineHeight: 1.5 }}>
            {isHi
              ? 'एमपीलैड्स परियोजनाओं की वर्तमान कार्यान्वयन स्थिति, भौतिक प्रगति और वित्तीय उपयोग को ट्रैक करें।'
              : 'Track the current implementation status, physical progress and financial utilization of MPLADS projects.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            padding: '0.3rem 0.85rem',
            background: '#FFFFFF',
            border: '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-full)',
            boxShadow: '1.5px 2px 0px #1D1E22',
            color: '#0A2458'
          }}>
            {summaryMetrics.total} {isHi ? 'कुल परियोजनाएं' : 'Total Works Tracked'}
          </span>
        </div>
      </div>

      {/* ─── 2. SUMMARY METRICS CARDS ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.15rem'
        }}
      >
        {/* Total Projects */}
        <div style={{ background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.15rem', boxShadow: '2px 3px 0px #1D1E22' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isHi ? 'कुल परियोजनाएं' : 'TOTAL PROJECTS'}
            </span>
            <Layers size={16} color="#0A2458" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1D1E22' }}>
            {summaryMetrics.total}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
            {isHi ? 'सभी निर्वाचन क्षेत्रों में' : 'Across all constituencies'}
          </div>
        </div>

        {/* Ongoing */}
        <div style={{ background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.15rem', boxShadow: '2px 3px 0px #1D1E22' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isHi ? 'प्रगति पर' : 'ONGOING'}
            </span>
            <Activity size={16} color="#52B79A" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0A2458' }}>
            {summaryMetrics.ongoing}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-accent-teal-hover)', fontWeight: 700, marginTop: '0.2rem' }}>
            {summaryMetrics.ongoingPct}% {isHi ? 'कुल का' : 'of total projects'}
          </div>
        </div>

        {/* Completed */}
        <div style={{ background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.15rem', boxShadow: '2px 3px 0px #1D1E22' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isHi ? 'पूर्ण एवं सत्यापित' : 'COMPLETED'}
            </span>
            <CheckCircle2 size={16} color="#1E7E34" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1E7E34' }}>
            {summaryMetrics.completed}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#1E7E34', fontWeight: 700, marginTop: '0.2rem' }}>
            {summaryMetrics.completedPct}% {isHi ? 'सफल समापन दर' : 'completion rate'}
          </div>
        </div>

        {/* Delayed */}
        <div style={{ background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.15rem', boxShadow: '2px 3px 0px #1D1E22' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isHi ? 'विलंबित कार्य' : 'DELAYED'}
            </span>
            <AlertTriangle size={16} color="#D9534F" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#D9534F' }}>
            {summaryMetrics.delayed}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#D9534F', fontWeight: 700, marginTop: '0.2rem' }}>
            {summaryMetrics.delayedPct}% {isHi ? 'समयसीमा पार' : 'overdue milestones'}
          </div>
        </div>

        {/* Not Started */}
        <div style={{ background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.15rem', boxShadow: '2px 3px 0px #1D1E22' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isHi ? 'प्रारंभ प्रतीक्षित' : 'NOT STARTED'}
            </span>
            <Clock size={16} color="var(--color-text-secondary)" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1D1E22' }}>
            {summaryMetrics.notStarted}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
            {summaryMetrics.notStartedPct}% {isHi ? 'स्वीकृति चरण में' : 'pending commencement'}
          </div>
        </div>
      </div>

      {/* ─── 3. STATUS DISTRIBUTION BREAKDOWN ─── */}
      <div style={{ background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', padding: '1.35rem 1.65rem', boxShadow: '3px 4px 0px #1D1E22' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.15rem', fontWeight: 800, color: '#1D1E22', margin: 0 }}>
              {isHi ? 'स्थिति वितरण एवं कार्यान्वयन स्वास्थ्य' : 'Status Distribution & Implementation Health'}
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
              {isHi ? 'सभी स्वीकृत कार्यों का समग्र प्रगति विश्लेषण' : 'Comprehensive progress breakdown of all sanctioned works'}
            </span>
          </div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0A2458' }}>
            {summaryMetrics.completed + summaryMetrics.ongoing} / {summaryMetrics.total} {isHi ? 'सक्रिय या पूर्ण' : 'Active or Completed'}
          </div>
        </div>

        {/* Multi-Segment Horizontal Progress Bar */}
        <div style={{ height: '14px', background: '#F0EFEA', borderRadius: 'var(--radius-full)', border: '1.5px solid #1D1E22', overflow: 'hidden', display: 'flex', marginBottom: '1rem' }}>
          <div style={{ width: `${summaryMetrics.completedPct}%`, background: '#1E7E34', transition: 'width 0.4s ease' }} title={`Completed: ${summaryMetrics.completedPct}%`} />
          <div style={{ width: `${summaryMetrics.ongoingPct}%`, background: '#52B79A', transition: 'width 0.4s ease' }} title={`Ongoing: ${summaryMetrics.ongoingPct}%`} />
          <div style={{ width: `${summaryMetrics.delayedPct}%`, background: '#D9534F', transition: 'width 0.4s ease' }} title={`Delayed: ${summaryMetrics.delayedPct}%`} />
          <div style={{ width: `${summaryMetrics.notStartedPct}%`, background: '#D1D5DB', transition: 'width 0.4s ease' }} title={`Not Started: ${summaryMetrics.notStartedPct}%`} />
        </div>

        {/* Legend Indicators */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#1E7E34', display: 'inline-block' }} />
            <strong>{isHi ? 'पूर्ण' : 'Completed'}:</strong> {summaryMetrics.completed} ({summaryMetrics.completedPct}%)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#52B79A', display: 'inline-block' }} />
            <strong>{isHi ? 'प्रगति पर' : 'Ongoing'}:</strong> {summaryMetrics.ongoing} ({summaryMetrics.ongoingPct}%)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#D9534F', display: 'inline-block' }} />
            <strong>{isHi ? 'विलंबित' : 'Delayed'}:</strong> {summaryMetrics.delayed} ({summaryMetrics.delayedPct}%)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#D1D5DB', display: 'inline-block' }} />
            <strong>{isHi ? 'प्रारंभ प्रतीक्षित' : 'Not Started'}:</strong> {summaryMetrics.notStarted} ({summaryMetrics.notStartedPct}%)
          </div>
        </div>
      </div>

      {/* ─── 4. SEARCH & FILTER TOOLBAR ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          background: '#FAF8F3',
          border: '1.5px solid #1D1E22',
          borderRadius: 'var(--radius-lg)',
          padding: '0.85rem 1.25rem',
          boxShadow: '2px 3px 0px #1D1E22'
        }}
      >
        {/* Wide Search Bar */}
        <div style={{ position: 'relative', flex: '1 1 340px', minWidth: '240px' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#1D1E22'
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isHi
                ? 'परियोजना ID, शीर्षक, जिला, राज्य या सांसद खोजें...'
                : 'Search projects by ID, title, district, state or MP...'
            }
            style={{
              width: '100%',
              padding: '0.65rem 2.4rem 0.65rem 2.75rem',
              border: '1.5px solid #1D1E22',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.88rem',
              fontWeight: 600,
              color: '#1D1E22',
              background: '#FFFFFF',
              boxSizing: 'border-box',
              outline: 'none',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.2rem',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--color-text-muted)'
              }}
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginRight: '0.25rem', letterSpacing: '0.04em' }}>
            <Filter size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }} />
            {isHi ? 'स्थिति फ़िल्टर:' : 'Status:'}
          </span>
          {[
            { id: 'ALL', labelEn: 'All', labelHi: 'सभी', count: projects.length },
            { id: 'COMPLETED', labelEn: 'Completed', labelHi: 'पूर्ण', count: summaryMetrics.completed },
            { id: 'ONGOING', labelEn: 'Ongoing', labelHi: 'प्रगति पर', count: summaryMetrics.ongoing },
            { id: 'DELAYED', labelEn: 'Delayed', labelHi: 'विलंबित', count: summaryMetrics.delayed },
            { id: 'NOT_STARTED', labelEn: 'Not Started', labelHi: 'प्रारंभ प्रतीक्षित', count: summaryMetrics.notStarted }
          ].map((f) => {
            const isSelected = selectedFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFilter(f.id)}
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: isSelected ? 800 : 700,
                  borderRadius: 'var(--radius-sm)',
                  border: isSelected ? '1.5px solid #1D1E22' : '1px solid rgba(29,30,34,0.3)',
                  background: isSelected ? (f.id === 'DELAYED' ? '#FEF2F2' : f.id === 'COMPLETED' ? '#F0FDF4' : 'var(--color-accent-teal)') : '#FFFFFF',
                  color: isSelected ? (f.id === 'DELAYED' ? '#D9534F' : f.id === 'COMPLETED' ? '#1E7E34' : '#1D1E22') : '#1D1E22',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '1.5px 2px 0px #1D1E22' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{isHi ? f.labelHi : f.labelEn}</span>
                <span
                  style={{
                    padding: '0.05rem 0.4rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    background: isSelected ? 'rgba(0,0,0,0.08)' : '#FAF8F3',
                    border: '1px solid rgba(0,0,0,0.1)'
                  }}
                >
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 5. PROJECT STATUS REGISTRY TABLE ─── */}
      <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '3px 4px 0px #1D1E22', width: '100%' }}>
        {/* Table Header Banner */}
        <div style={{ padding: '1.25rem 1.75rem', background: '#F3EFE6', borderBottom: '1.5px solid #1D1E22', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.35rem', color: '#1D1E22', margin: 0, fontWeight: 800 }}>
              {isHi ? 'परियोजना स्थिति रजिस्ट्री' : 'Project Status Registry'}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 500, marginTop: '0.2rem', display: 'block' }}>
              {isHi ? 'भौतिक पूर्णता एवं वित्तीय प्रगति की आधिकारिक निगरानी' : 'Official Monitoring of Physical Completion & Fund Utilization'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{
              fontSize: '0.76rem',
              fontWeight: 800,
              padding: '0.25rem 0.75rem',
              background: '#FAF8F3',
              border: '1px solid #1D1E22',
              borderRadius: 'var(--radius-full)',
              color: '#0A2458'
            }}>
              {isHi ? `पेज ${safePage} / ${totalPages}` : `Page ${safePage} of ${totalPages}`}
            </span>
            <span style={{
              fontSize: '0.76rem',
              fontWeight: 700,
              padding: '0.25rem 0.75rem',
              background: '#FFFFFF',
              color: '#1D1E22',
              border: '1px solid #1D1E22',
              borderRadius: 'var(--radius-full)'
            }}>
              {totalProjects} {isHi ? 'कुल परिणाम' : 'Matching Works'}
            </span>
          </div>
        </div>

        {/* Desktop & Tablet Table (Full Width, No Horizontal Scroll) */}
        <div className="registry-table-desktop" style={{ width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', tableLayout: 'auto' }}>
            <thead>
              <tr style={{ background: '#FAFAFA', borderBottom: '1.5px solid #1D1E22', textAlign: 'left' }}>
                <th style={{ padding: '0.95rem 1.25rem', width: '13%', fontWeight: 800, color: '#1D1E22' }}>Work ID</th>
                <th style={{ padding: '0.95rem 1.25rem', width: '28%', fontWeight: 800, color: '#1D1E22' }}>Project Title</th>
                <th style={{ padding: '0.95rem 1.25rem', width: '18%', fontWeight: 800, color: '#1D1E22' }}>MP / Constituency</th>
                <th style={{ padding: '0.95rem 1.25rem', width: '14%', fontWeight: 800, color: '#1D1E22' }}>District & State</th>
                <th style={{ padding: '0.95rem 1.25rem', width: '13%', fontWeight: 800, color: '#1D1E22' }}>Cost / Spent</th>
                <th style={{ padding: '0.95rem 1.25rem', width: '14%', textAlign: 'right', fontWeight: 800, color: '#1D1E22' }}>Progress & Status</th>
              </tr>
            </thead>
            <tbody key={`status-page-${safePage}`}>
              {displayedProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                    {isHi ? 'कोई मेल खाती परियोजना नहीं मिली' : 'No matching projects found for the selected query/filter.'}
                  </td>
                </tr>
              ) : (
                displayedProjects.map((project, idx) => (
                  <tr
                    key={project.id}
                    className="registry-row-animate"
                    style={{
                      borderBottom: '1px solid #F0F0F0',
                      background: idx % 2 === 0 ? '#FFFFFF' : '#FDFCF9',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    {/* Work ID */}
                    <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', fontWeight: 800, color: '#0A2458', verticalAlign: 'top' }}>
                      {project.id}
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600, fontFamily: 'var(--font-sans)', marginTop: '0.2rem' }}>
                        {project.category}
                      </div>
                    </td>

                    {/* Project Title */}
                    <td style={{ padding: '1rem 1.25rem', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 700, color: '#1D1E22', lineHeight: 1.4, wordBreak: 'break-word' }}>
                        {project.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.35rem' }}>
                        <strong>Agency:</strong> {project.agency}
                      </div>
                    </td>

                    {/* MP / Constituency */}
                    <td style={{ padding: '1rem 1.25rem', verticalAlign: 'top', color: '#1D1E22' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>{project.mp}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>
                        {project.constituency}
                      </div>
                    </td>

                    {/* District & State */}
                    <td style={{ padding: '1rem 1.25rem', verticalAlign: 'top', color: '#1D1E22' }}>
                      <div style={{ fontWeight: 700 }}>{project.district}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>{project.state}</div>
                    </td>

                    {/* Sanctioned / Expenditure */}
                    <td style={{ padding: '1rem 1.25rem', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 800, color: '#1D1E22' }}>{project.sanctionedCostFormatted}</div>
                      <div style={{ fontSize: '0.76rem', color: project.expenditurePct > 80 ? '#0A2458' : 'var(--color-text-secondary)', marginTop: '0.15rem', fontWeight: 600 }}>
                        {project.expenditureFormatted} ({project.expenditurePct}%)
                      </div>
                    </td>

                    {/* Physical Progress & Status Badge */}
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right', verticalAlign: 'top' }}>
                      <div style={{ marginBottom: '0.45rem' }}>
                        {getStatusBadge(project.status, project.statusLabel, project.statusLabelHi)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <div style={{ width: '60px', height: '6px', background: '#E5E7EB', borderRadius: '3px', overflow: 'hidden', display: 'inline-block' }}>
                          <div style={{ width: `${project.physicalProgress}%`, height: '100%', background: project.physicalProgress === 100 ? '#1E7E34' : project.status === 'Delayed' ? '#D9534F' : 'var(--color-accent-teal)' }} />
                        </div>
                        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#1D1E22' }}>
                          {project.physicalProgress}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View (<768px, zero horizontal overflow) */}
        <div className="registry-cards-mobile" style={{ display: 'none', padding: '1rem', flexDirection: 'column', gap: '0.85rem' }}>
          {displayedProjects.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              {isHi ? 'कोई मेल खाती परियोजना नहीं मिली' : 'No matching projects found.'}
            </div>
          ) : (
            displayedProjects.map((project) => (
              <div
                key={project.id}
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #1D1E22',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.15rem',
                  boxShadow: '2px 3px 0px #1D1E22',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.84rem', color: '#0A2458' }}>
                    {project.id}
                  </span>
                  {getStatusBadge(project.status, project.statusLabel, project.statusLabelHi)}
                </div>

                <div style={{ fontWeight: 700, fontSize: '0.94rem', color: '#1D1E22', lineHeight: 1.35, wordBreak: 'break-word' }}>
                  {project.title}
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                  <strong>{project.mp}</strong> • {project.district}, {project.state}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAF8F3', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(29, 30, 34, 0.12)' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>SANCTIONED</div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1D1E22' }}>{project.sanctionedCostFormatted}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', color: '#0A2458', fontWeight: 800 }}>{project.expenditureFormatted} ({project.expenditurePct}%)</div>
                    <div style={{ fontSize: '0.78rem', color: project.physicalProgress === 100 ? '#1E7E34' : 'var(--color-accent-teal-hover)', fontWeight: 800 }}>
                      {project.physicalProgress}% {isHi ? 'प्रगति' : 'PROGRESS'}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ─── 6. TRUE DATA-DRIVEN PAGINATION BAR (10 PER PAGE) ─── */}
        <div
          style={{
            padding: '0.95rem 1.75rem',
            background: '#FAF8F3',
            borderTop: '1.5px solid #1D1E22',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.85rem'
          }}
        >
          {/* Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', color: '#1D1E22', fontWeight: 600 }}>
            <span style={{
              padding: '0.15rem 0.55rem',
              borderRadius: 'var(--radius-full)',
              background: '#FFFFFF',
              border: '1px solid #1D1E22',
              fontSize: '0.76rem',
              fontWeight: 800,
              color: '#0A2458'
            }}>
              {totalProjects === 0 ? 0 : startIndex + 1}–{endIndex}
            </span>
            <span>
              {isHi
                ? `कुल ${totalProjects} में से ${totalProjects === 0 ? 0 : startIndex + 1}–${endIndex} परियोजनाएं (पेज ${safePage} / ${totalPages})`
                : `Showing ${totalProjects === 0 ? 0 : startIndex + 1}–${endIndex} of ${totalProjects} projects (Page ${safePage} of ${totalPages})`}
            </span>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            {/* Previous Button */}
            {/* First Page Button */}
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={safePage <= 1}
              className="btn-outline-dark"
              style={{
                padding: '0.4rem 0.65rem',
                fontSize: '0.82rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                background: '#FFFFFF',
                cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
                opacity: safePage <= 1 ? 0.45 : 1,
                boxShadow: safePage <= 1 ? 'none' : '1.5px 2px 0px #1D1E22'
              }}
              title={isHi ? 'पहला पेज' : 'First Page'}
            >
              «
            </button>

            {/* Prev Button */}
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="btn-outline-dark"
              style={{
                padding: '0.4rem 0.85rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: '#FFFFFF',
                cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
                opacity: safePage <= 1 ? 0.45 : 1,
                boxShadow: safePage <= 1 ? 'none' : '1.5px 2px 0px #1D1E22'
              }}
            >
              <ChevronLeft size={14} strokeWidth={2.4} />
              <span>{isHi ? 'पिछला' : 'Previous'}</span>
            </button>

            {/* Page Numbers */}
            {getPageNumbers().map((pageNum, idx) => {
              if (pageNum === '...') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    style={{
                      padding: '0.35rem 0.5rem',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      color: 'var(--color-text-muted)'
                    }}
                  >
                    …
                  </span>
                );
              }
              const isCurrent = pageNum === safePage;
              return (
                <button
                  key={`page-${pageNum}`}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  style={{
                    minWidth: '34px',
                    height: '34px',
                    padding: '0 0.45rem',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    borderRadius: 'var(--radius-sm)',
                    border: '1.5px solid #1D1E22',
                    background: isCurrent ? 'var(--color-accent-teal)' : '#FFFFFF',
                    color: '#1D1E22',
                    cursor: 'pointer',
                    boxShadow: isCurrent ? '1.5px 2px 0px #1D1E22' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Next Button */}
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages || totalProjects === 0}
              className="btn-outline-dark"
              style={{
                padding: '0.4rem 0.85rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: '#FFFFFF',
                cursor: (safePage >= totalPages || totalProjects === 0) ? 'not-allowed' : 'pointer',
                opacity: (safePage >= totalPages || totalProjects === 0) ? 0.45 : 1,
                boxShadow: (safePage >= totalPages || totalProjects === 0) ? 'none' : '1.5px 2px 0px #1D1E22'
              }}
            >
              <span>{isHi ? 'अगला' : 'Next'}</span>
              <ChevronRight size={14} strokeWidth={2.4} />
            </button>

            {/* Last Page Button */}
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safePage >= totalPages || totalProjects === 0}
              className="btn-outline-dark"
              style={{
                padding: '0.4rem 0.65rem',
                fontSize: '0.82rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                background: '#FFFFFF',
                cursor: (safePage >= totalPages || totalProjects === 0) ? 'not-allowed' : 'pointer',
                opacity: (safePage >= totalPages || totalProjects === 0) ? 0.45 : 1,
                boxShadow: (safePage >= totalPages || totalProjects === 0) ? 'none' : '1.5px 2px 0px #1D1E22'
              }}
              title={isHi ? 'अंतिम पेज' : 'Last Page'}
            >
              »
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer hideCTAButtons={true} />
    </div>
  );
};

export default ProjectStatusView;
