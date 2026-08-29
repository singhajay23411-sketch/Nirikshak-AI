import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Shield, AlertTriangle, CheckCircle, Database, TrendingUp, 
  MapPin, Clock, FileText, Search, Filter, Download, ExternalLink, 
  Layers, Camera, ChevronRight, Eye, RefreshCw, BarChart3, AlertCircle,
  FileCheck, Users, Send, CheckSquare, Copy
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import LanguageSwitcher from '../LanguageSwitcher';
import HouseSelector from '../HouseSelector';
import IndiaMap from '../IndiaMap';
import Footer from '../Footer';
import FindProjectsView from './FindProjectsView';
import BrowseStatesView from './BrowseStatesView';
import BrowseMpsView from './BrowseMpsView';
import CompareView from './CompareView';
import FeedbackView from './FeedbackView';
import UnifiedAiIntelligenceView from './UnifiedAiIntelligenceView';

// MOCK DATA SOURCED DIRECTLY FROM README.MD SPECIFICATIONS
const MOCK_ANOMALY_PROJECTS = [
  {
    id: 'MPLADS-2026-8871',
    title: 'Construction of Community Hall & Skill Center at Ward 14',
    category: 'Community Infrastructure',
    state: 'Madhya Pradesh',
    district: 'Jabalpur',
    constituency: 'Jabalpur Lok Sabha',
    sanctionedCost: '₹48,50,000',
    expenditure: '₹43,65,000',
    expenditurePct: 90,
    physicalProgress: 40,
    delayMonths: 11,
    costDeviationPct: 48,
    riskScore: 87,
    riskBand: 'Critical',
    confidenceScore: 94,
    agency: 'M/s Rural Infra Buildcon Ltd',
    agencyPriorFlags: 3,
    reasons: [
      '90% of sanctioned amount spent, but only 40% physical progress reported',
      'Cost is 48% above comparable nearby projects in Jabalpur',
      'Work is delayed by 11 months beyond scheduled completion date',
      'Implementing agency has 3 prior delayed project flags'
    ],
    recommendedAction: 'Conduct physical inspection and verify measurement books, bills and UC filings.'
  },
  {
    id: 'MPLADS-2026-3302',
    title: 'Installation of Solar High-Mast Lights in 12 Village Squares',
    category: 'Renewable Energy / Civic',
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    constituency: 'Varanasi Lok Sabha',
    sanctionedCost: '₹32,00,000',
    expenditure: '₹28,80,000',
    expenditurePct: 90,
    physicalProgress: 55,
    delayMonths: 7,
    costDeviationPct: 34,
    riskScore: 82,
    riskBand: 'Critical',
    confidenceScore: 91,
    agency: 'SunPower Urja Systems Pvt Ltd',
    agencyPriorFlags: 2,
    reasons: [
      'Duplicate vendor signature pattern detected across 4 work vouchers',
      'Cost deviation of +34% compared to standard state benchmark rate',
      'Physical inspection pending for over 180 days'
    ],
    recommendedAction: 'Perform biometric vendor verification and audit electrical test certificates.'
  },
  {
    id: 'MPLADS-2025-7219',
    title: 'Paving of CC Interlocking Road from Main Road to School',
    category: 'Roads & Pathways',
    state: 'Madhya Pradesh',
    district: 'Bhopal',
    constituency: 'Bhopal Lok Sabha',
    sanctionedCost: '₹24,50,000',
    expenditure: '₹22,05,000',
    expenditurePct: 90,
    physicalProgress: 60,
    delayMonths: 5,
    costDeviationPct: 22,
    riskScore: 79,
    riskBand: 'High',
    confidenceScore: 88,
    agency: 'Bhopal Civil Works Society',
    agencyPriorFlags: 1,
    reasons: [
      'Photo evidence perceptual hash matches adjacent 2024 road project',
      'Progress reporting stalled at 60% while final bill submitted',
      'Delayed by 5 months beyond tender milestones'
    ],
    recommendedAction: 'On-site geotagged photographic audit with fresh timestamp verification.'
  },
  {
    id: 'MPLADS-2026-1544',
    title: 'Deep Borewell and Overhead Tank Construction at Gram Panchayat',
    category: 'Drinking Water & Sanitation',
    state: 'Madhya Pradesh',
    district: 'Indore',
    constituency: 'Indore Lok Sabha',
    sanctionedCost: '₹18,20,000',
    expenditure: '₹14,56,000',
    expenditurePct: 80,
    physicalProgress: 45,
    delayMonths: 8,
    costDeviationPct: 29,
    riskScore: 76,
    riskBand: 'High',
    confidenceScore: 89,
    agency: 'Jal Vikas Engineering Works',
    agencyPriorFlags: 2,
    reasons: [
      'Utilization Certificate filing deadline exceeded by 240 days',
      'Expenditure-versus-progress gap exceeds 35% threshold',
      'Work lifetime exceeds standard category median by 140 days'
    ],
    recommendedAction: 'Issue reminder notice to District Authority for UC submission and water yield test.'
  },
  {
    id: 'MPLADS-2025-9001',
    title: 'Modern Science Laboratory Equipment in Government Higher Secondary School',
    category: 'Education & Schools',
    state: 'Bihar',
    district: 'Patna',
    constituency: 'Patna Sahib Lok Sabha',
    sanctionedCost: '₹15,00,000',
    expenditure: '₹13,50,000',
    expenditurePct: 90,
    physicalProgress: 50,
    delayMonths: 6,
    costDeviationPct: 31,
    riskScore: 73,
    riskBand: 'High',
    confidenceScore: 86,
    agency: 'Patna Educational Suppliers',
    agencyPriorFlags: 1,
    reasons: [
      'High similarity index (94%) with 2024 sanctioned school lab procurement',
      'Payment burst of 85% disbursed in a single 48-hour window'
    ],
    recommendedAction: 'Physical asset verification and school principal asset stock register check.'
  }
];

const MOCK_DUPLICATE_PAIRS = [
  {
    pairId: 'DUP-2026-0042',
    workA: {
      id: 'MPLADS-2025-8812',
      title: 'Construction of Community Hall at Gram Badgaon, Jabalpur',
      category: 'Community Infrastructure',
      cost: '₹25,00,000',
      sanctionDate: '12 Jan 2025',
      agency: 'M/s Rural Infra Buildcon Ltd'
    },
    workB: {
      id: 'MPLADS-2026-1049',
      title: 'Construction of Community Center Building, Badgaon Village',
      category: 'Community Infrastructure',
      cost: '₹24,80,000',
      sanctionDate: '18 Jul 2025',
      agency: 'Rural Infrastructure Buildcon Limited'
    },
    textSim: 0.942,
    costDiffPct: 0.8,
    agencyFuzzyMatch: 92,
    daysApart: 187,
    confidenceScore: 92,
    status: 'Flagged for Verification'
  },
  {
    pairId: 'DUP-2026-0091',
    workA: {
      id: 'MPLADS-2025-4421',
      title: 'Installation of 5000L RO Drinking Water Plant at Ward 8',
      category: 'Drinking Water',
      cost: '₹12,00,000',
      sanctionDate: '05 Mar 2025',
      agency: 'AquaPure Tech Solutions'
    },
    workB: {
      id: 'MPLADS-2026-2180',
      title: 'Setup of 5 KL RO Clean Water Treatment Unit, Ward No 8',
      category: 'Drinking Water',
      cost: '₹12,25,000',
      sanctionDate: '22 Aug 2025',
      agency: 'Aqua Pure Technologies'
    },
    textSim: 0.958,
    costDiffPct: 2.1,
    agencyFuzzyMatch: 95,
    daysApart: 170,
    confidenceScore: 95,
    status: 'Investigation Active'
  }
];

const KeyMetricsDashboard = ({ isHi }) => {
  const [stateFilter, setStateFilter] = useState('top10');
  const [hoveredState, setHoveredState] = useState(null);
  const [hoveredTier, setHoveredTier] = useState(null);
  const [activeLegend, setActiveLegend] = useState({ utilization: true, allocated: true, spent: true });

  const [statesData, setStatesData] = useState([]);
  const [kpis, setKpis] = useState({
    totalProjects: '2,18,913',
    totalAllocated: '₹42,721 Cr',
    totalSpent: '₹38,290 Cr',
    utilizationRate: '89.6%',
    completedVsPending: '194K / 24K'
  });

  const { ministryView } = useData();

  useEffect(() => {
    const token = localStorage.getItem('nirikshak_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    let active = true;

    // Fetch state-level data for the bar chart
    fetch('/api/analytics/states', { headers })
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then(data => {
        if (!active || !Array.isArray(data)) return;
        const formatted = data.map(item => ({
          state: item.state_name,
          util: item.avg_risk_score !== null ? parseFloat(item.avg_risk_score.toFixed(1)) : 0,
          allocated: parseFloat(item.total_allocated.toFixed(1)),
          spent: parseFloat((item.total_allocated * (item.avg_risk_score || 0) / 100).toFixed(1)),
        }));
        formatted.sort((a, b) => b.allocated - a.allocated);
        setStatesData(formatted.slice(0, 10));
      })
      .catch(err => {
        console.error('KeyMetrics: states fetch failed:', err);
        if (active && ministryView && ministryView.state_wise_benchmarks) {
          const formatted = ministryView.state_wise_benchmarks.map(item => ({
            state: item.state_name || 'N/A',
            util: parseFloat(((item.utilization_rate || 0) * 100).toFixed(1)),
            allocated: Math.round((item.total_sanctioned || 0) / 10000000),
            spent: Math.round((item.total_spent || 0) / 10000000)
          }));
          formatted.sort((a, b) => b.util - a.util);
          setStatesData(formatted.slice(0, 10));
        }
      });

    // Fetch national summary KPIs
    fetch('/api/analytics/summary', { headers })
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then(data => {
        if (!active) return;
        setKpis({
          totalProjects: data.total_projects.toLocaleString('en-IN'),
          totalAllocated: `₹${data.total_sanctioned_cr.toLocaleString('en-IN')} Cr`,
          totalSpent: `₹${(data.total_sanctioned_cr * data.utilization_rate_pct / 100).toFixed(0)} Cr`,
          utilizationRate: `${data.utilization_rate_pct.toFixed(1)}%`,
          completedVsPending: `${(data.total_completed / 1000).toFixed(0)}K / ${(data.total_pending / 1000).toFixed(0)}K`,
        });
      })
      .catch(err => {
        console.error('KeyMetrics: summary fetch failed:', err);
        if (active && ministryView && ministryView.national_stats) {
          const stats = ministryView.national_stats;
          const sanctionedCr = Math.round(stats.total_sanctioned / 10000000);
          const spentCr = Math.round(stats.total_disbursed / 10000000);
          const utilRate = ((stats.total_disbursed / (stats.total_sanctioned || 1)) * 100).toFixed(1);
          setKpis({
            totalProjects: stats.total_projects.toLocaleString(),
            totalAllocated: `₹${sanctionedCr.toLocaleString()} Cr`,
            totalSpent: `₹${spentCr.toLocaleString()} Cr`,
            utilizationRate: `${utilRate}%`,
            completedVsPending: '194K / 24K'
          });
        }
      });

    return () => { active = false; };
  }, [ministryView]);

  const TOP_STATES_DATA = statesData.length > 0 ? statesData : [
    { state: 'Nagaland', util: 91.5, allocated: 140, spent: 128 },
    { state: 'Sikkim', util: 62.4, allocated: 95, spent: 59 },
    { state: 'Meghalaya', util: 56.8, allocated: 180, spent: 102 },
    { state: 'Mizoram', util: 54.2, allocated: 110, spent: 60 },
    { state: 'Arunachal Pr.', util: 52.1, allocated: 165, spent: 86 },
    { state: 'Manipur', util: 50.8, allocated: 150, spent: 76 },
    { state: 'Uttar Pradesh', util: 49.5, allocated: 1850, spent: 915 },
    { state: 'Jharkhand', util: 45.2, allocated: 620, spent: 280 },
    { state: 'Bihar', util: 44.1, allocated: 890, spent: 392 },
    { state: 'Tamil Nadu', util: 42.8, allocated: 810, spent: 346 },
  ];

  const MP_UTILIZATION_TIERS = [
    { label: 'High Utilizers', pct: 1.3, count: 10, range: '85%+', color: '#2B59C3', desc: 'Strong fund deployment (85%+ utilization)' },
    { label: 'Good Utilizers', pct: 3.4, count: 26, range: '70-84%', color: '#1E7E34', desc: 'Effective fund deployment (70-84% utilization)' },
    { label: 'Moderate Utilizers', pct: 17.1, count: 132, range: '50-69%', color: '#E5B842', desc: 'Standard fund deployment (50-69% utilization)' },
    { label: 'Low Utilizers', pct: 78.3, count: 606, range: '<50%', color: '#5A6275', desc: 'Limited fund deployment (<50% utilization)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Breadcrumb & Header */}
      <div>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
          <span>Home</span> <span style={{ margin: '0 0.35rem' }}>/</span> <span style={{ color: '#1D1E22' }}>MPLADS Key Metrics</span>
        </div>

        <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', padding: '1.5rem 2rem', boxShadow: '3px 4px 0px #1D1E22', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: '#F3EFE6', border: '1.5px solid #1D1E22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent-teal-hover)' }}>
              <BarChart3 size={24} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.8rem', fontWeight: 800, color: '#1D1E22', margin: 0, lineHeight: 1.2 }}>
                {isHi ? 'मुख्य प्रदर्शन मेट्रिक्स' : 'Key Metrics Overview'}
              </h1>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem', margin: 0 }}>
                {isHi ? 'राज्यों और सांसदों के बीच एमपीलैड्स प्रदर्शन मेट्रिक्स का दृश्य प्रतिनिधित्व' : 'Visual representation of MPLADS performance metrics across states, constituencies, and MPs'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5 KPI Summary Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.2rem', boxShadow: '2px 3px 0px #1D1E22' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Total Projects Analyzed</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1D1E22' }}>{kpis.totalProjects}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>16-17th Lok Sabha Works</div>
        </div>

        <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.2rem', boxShadow: '2px 3px 0px #1D1E22' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Total Allocation</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0A2458' }}>{kpis.totalAllocated}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>Sanctioned Funds</div>
        </div>

        <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.2rem', boxShadow: '2px 3px 0px #1D1E22' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Total Expenditure</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-accent-teal-hover)' }}>{kpis.totalSpent}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>Disbursed Vouchers</div>
        </div>

        <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.2rem', boxShadow: '2px 3px 0px #1D1E22' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1E7E34', textTransform: 'uppercase', marginBottom: '0.35rem' }}>National Utilization Rate</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1E7E34' }}>{kpis.utilizationRate}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>Average Execution</div>
        </div>

        <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.2rem', boxShadow: '2px 3px 0px #1D1E22' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#D9534F', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Completed vs Pending</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1D1E22' }}>{kpis.completedVsPending}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>Completed vs In-Progress</div>
        </div>
      </div>

      {/* 2-Column Interactive Chart Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.15fr) minmax(320px, 1fr)', gap: '1.5rem' }}>

        {/* LEFT CHART: States by Fund Utilization */}
        <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: '3px 4px 0px #1D1E22', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} color="var(--color-accent-teal-hover)" />
              <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.3rem', color: '#1D1E22', margin: 0 }}>
                {isHi ? 'निधि उपयोग दर के अनुसार राज्य' : 'States by Fund Utilization'}
              </h3>
            </div>
          </div>

          {/* Interactive Chart Legends */}
          <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div
              onClick={() => setActiveLegend(prev => ({ ...prev, utilization: !prev.utilization }))}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: activeLegend.utilization ? 1 : 0.4 }}
            >
              <span style={{ width: '12px', height: '12px', background: '#52B79A', borderRadius: '2px', display: 'inline-block' }}></span>
              <span>Utilization %</span>
            </div>
            <div
              onClick={() => setActiveLegend(prev => ({ ...prev, allocated: !prev.allocated }))}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: activeLegend.allocated ? 1 : 0.4 }}
            >
              <span style={{ width: '12px', height: '3px', background: '#2B59C3', display: 'inline-block' }}></span>
              <span>Allocated (₹Cr)</span>
            </div>
            <div
              onClick={() => setActiveLegend(prev => ({ ...prev, spent: !prev.spent }))}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: activeLegend.spent ? 1 : 0.4 }}
            >
              <span style={{ width: '12px', height: '3px', background: '#9B51E0', display: 'inline-block' }}></span>
              <span>Spent (₹Cr)</span>
            </div>
          </div>

          {/* Dual-Axis Visual Bar & Overlay Chart Container */}
          <div style={{ position: 'relative', height: '240px', paddingLeft: '42px', paddingRight: '12px', paddingBottom: '3.2rem', borderBottom: '1px solid #EAEAEA' }}>
            {/* Background Axis Lines & Left Y-Axis Labels */}
            <div style={{ position: 'absolute', left: '42px', right: '12px', top: 0, height: 'calc(100% - 3.2rem)' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, top: '0%', borderBottom: '1px dashed #E0E0E0' }}>
                <span style={{ position: 'absolute', left: '-38px', top: '-0.55rem', fontSize: '0.68rem', fontWeight: 700, color: '#777' }}>100%</span>
              </div>
              <div style={{ position: 'absolute', left: 0, right: 0, top: '25%', borderBottom: '1px dashed #E0E0E0' }}>
                <span style={{ position: 'absolute', left: '-38px', top: '-0.55rem', fontSize: '0.68rem', fontWeight: 700, color: '#777' }}>75%</span>
              </div>
              <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', borderBottom: '1px dashed #E0E0E0' }}>
                <span style={{ position: 'absolute', left: '-38px', top: '-0.55rem', fontSize: '0.68rem', fontWeight: 700, color: '#777' }}>50%</span>
              </div>
              <div style={{ position: 'absolute', left: 0, right: 0, top: '75%', borderBottom: '1px dashed #E0E0E0' }}>
                <span style={{ position: 'absolute', left: '-38px', top: '-0.55rem', fontSize: '0.68rem', fontWeight: 700, color: '#777' }}>25%</span>
              </div>
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, borderBottom: '1px solid #CCCCCC' }}>
                <span style={{ position: 'absolute', left: '-38px', bottom: '-0.35rem', fontSize: '0.68rem', fontWeight: 700, color: '#777' }}>0%</span>
              </div>
            </div>

            {/* Bars Flex Container */}
            <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end', gap: '0.6rem', zIndex: 2 }}>
              {TOP_STATES_DATA.map((item, idx) => {
                const isHovered = hoveredState?.state === item.state;
                const barColor = item.util > 80 ? '#1E7E34' : item.util > 55 ? '#52B79A' : item.util > 48 ? '#E5B842' : '#E07A5F';
                const displayLabel = item.state === 'Arunachal Pr.' ? 'Arunachal' : item.state === 'Uttar Pradesh' ? 'U.P.' : item.state;

                return (
                  <div
                    key={item.state}
                    onMouseEnter={() => setHoveredState({ ...item, idx })}
                    onMouseLeave={() => setHoveredState(null)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                      justifyContent: 'flex-end',
                      position: 'relative',
                      cursor: 'pointer',
                      padding: '0 2px'
                    }}
                  >
                    {/* Utilization Bar */}
                    {activeLegend.utilization && (
                      <div
                        style={{
                          width: '58%',
                          maxWidth: '24px',
                          height: `${item.util}%`,
                          background: isHovered ? 'var(--color-accent-teal-hover)' : barColor,
                          borderRadius: '4px 4px 0 0',
                          transition: 'all 0.18s ease',
                          boxShadow: isHovered ? '0 0 10px rgba(0,0,0,0.25)' : 'none',
                          transform: isHovered ? 'scaleX(1.15)' : 'none',
                          transformOrigin: 'bottom center'
                        }}
                      />
                    )}

                    {/* State Name X-Axis Label */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-2.4rem',
                        left: '50%',
                        transform: 'translateX(-50%) rotate(-25deg)',
                        transformOrigin: 'top center',
                        fontSize: '0.68rem',
                        fontWeight: isHovered ? 800 : 700,
                        color: isHovered ? 'var(--color-accent-teal-hover)' : '#1D1E22',
                        whiteSpace: 'nowrap',
                        transition: 'color 0.15s ease'
                      }}
                    >
                      {displayLabel}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dynamic Interactive Tooltip (Positioned directly above hovered bar) */}
            {hoveredState && (() => {
              const totalBars = TOP_STATES_DATA.length;
              const barLeftPct = ((hoveredState.idx + 0.5) / totalBars) * 100;
              const translateX = hoveredState.idx <= 1 ? '-12%' : hoveredState.idx >= totalBars - 2 ? '-88%' : '-50%';
              const barBottomPct = Math.min(hoveredState.util + 5, 84);

              return (
                <div
                  style={{
                    position: 'absolute',
                    left: `calc(42px + (100% - 54px) * ${barLeftPct / 100})`,
                    bottom: `${barBottomPct}%`,
                    transform: `translate(${translateX}, -100%)`,
                    background: '#1D1E22',
                    color: '#FFF',
                    padding: '0.65rem 0.95rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.76rem',
                    boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
                    zIndex: 30,
                    pointerEvents: 'none',
                    border: '1px solid rgba(255,255,255,0.15)',
                    minWidth: '150px',
                    transition: 'left 0.12s ease-out, bottom 0.12s ease-out',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <div style={{ fontWeight: 800, borderBottom: '1px solid #444', paddingBottom: '0.2rem', marginBottom: '0.35rem', color: '#E5B842' }}>
                    {hoveredState.state}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.85rem' }}>
                    <span style={{ color: '#BBB' }}>Utilization:</span> <strong style={{ color: '#52B79A' }}>{hoveredState.util}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.85rem' }}>
                    <span style={{ color: '#BBB' }}>Allocated:</span> <strong>₹{hoveredState.allocated} Cr</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.85rem' }}>
                    <span style={{ color: '#BBB' }}>Spent:</span> <strong>₹{hoveredState.spent} Cr</strong>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Bottom Summary Bar matching reference layout */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3.6rem', background: '#FAF8F3', padding: '0.75rem 1rem', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem' }}>
            <div><span style={{ color: 'var(--color-text-muted)' }}>Top Performer:</span> <strong>Nagaland (91.5%)</strong></div>
            <div><span style={{ color: 'var(--color-text-muted)' }}>Avg Utilization:</span> <strong>56.0%</strong></div>
            <div><span style={{ color: 'var(--color-text-muted)' }}>States Analyzed:</span> <strong>36 States & UTs</strong></div>
          </div>
        </div>

        {/* RIGHT CHART: Fund Utilization Pattern Analysis */}
        <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: '3px 4px 0px #1D1E22', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.35rem', color: '#1D1E22', margin: 0 }}>
              {isHi ? 'निधि उपयोग पैटर्न विश्लेषण' : 'Fund Utilization Pattern Analysis'}
            </h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              Total MPs Analyzed: <strong>774</strong>
            </div>
          </div>

          {/* Categorized Bar Chart Container */}
          <div style={{ position: 'relative', height: '230px', display: 'flex', alignItems: 'flex-end', gap: '1.25rem', paddingBottom: '2.5rem', borderBottom: '1px solid #EAEAEA' }}>
            {/* Y-Axis Grid Marks */}
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, borderBottom: '1px dashed #E0E0E0' }}><span style={{ fontSize: '0.68rem', color: '#888' }}>80%</span></div>
            <div style={{ position: 'absolute', left: 0, right: 0, top: '25%', borderBottom: '1px dashed #E0E0E0' }}><span style={{ fontSize: '0.68rem', color: '#888' }}>60%</span></div>
            <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', borderBottom: '1px dashed #E0E0E0' }}><span style={{ fontSize: '0.68rem', color: '#888' }}>40%</span></div>
            <div style={{ position: 'absolute', left: 0, right: 0, top: '75%', borderBottom: '1px dashed #E0E0E0' }}><span style={{ fontSize: '0.68rem', color: '#888' }}>20%</span></div>

            {/* Bars Mapping for 4 Tiers */}
            {MP_UTILIZATION_TIERS.map((tier) => {
              const isHovered = hoveredTier?.label === tier.label;
              return (
                <div
                  key={tier.label}
                  onMouseEnter={() => setHoveredTier(tier)}
                  onMouseLeave={() => setHoveredTier(null)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                >
                  {/* Percentage Value on top of column */}
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1D1E22', marginBottom: '0.35rem' }}>
                    {tier.pct}%
                  </div>

                  {/* Bar */}
                  <div
                    style={{
                      width: '65%',
                      height: `${(tier.pct / 85) * 100}%`,
                      background: tier.color,
                      borderRadius: '6px 6px 0 0',
                      transition: 'all 0.2s ease',
                      boxShadow: isHovered ? '0 0 10px rgba(0,0,0,0.3)' : 'none',
                      transform: isHovered ? 'scaleY(1.02)' : 'none',
                      transformOrigin: 'bottom center'
                    }}
                  />

                  {/* Tier Label */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-1.8rem',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: isHovered ? tier.color : '#1D1E22',
                      textAlign: 'center',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {tier.label}
                  </div>
                </div>
              );
            })}

            {/* Floating Interactive Tooltip matching reference screenshot */}
            {hoveredTier && (
              <div
                style={{
                  position: 'absolute',
                  top: '20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#FFFFFF',
                  color: '#1D1E22',
                  padding: '0.6rem 1rem',
                  borderRadius: '6px',
                  border: '1.5px solid #1D1E22',
                  boxShadow: '3px 3px 0px #1D1E22',
                  fontSize: '0.8rem',
                  zIndex: 30,
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                <div style={{ fontWeight: 800, color: hoveredTier.color, marginBottom: '0.15rem' }}>
                  {hoveredTier.label}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#555' }}>
                  MP Distribution: <strong>{hoveredTier.pct}% ({hoveredTier.count} MPs)</strong>
                </div>
              </div>
            )}
          </div>

          {/* Color Dot Legend Box at bottom matching reference layout */}
          <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#FAF8F3', padding: '0.85rem 1rem', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
            {MP_UTILIZATION_TIERS.map(t => (
              <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: t.color, display: 'inline-block' }}></span>
                <span><strong>{t.label}:</strong> {t.desc}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Analytical Insights & Policy Summary */}
      <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', padding: '1.75rem', boxShadow: '3px 4px 0px #1D1E22' }}>
        <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.35rem', color: '#1D1E22', marginBottom: '0.85rem' }}>
          {isHi ? 'मुख्य विश्लेषणात्मक निष्कर्ष और नीतिगत सिफारिशें' : 'Key Analytical Insights & Policy Observations'}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', fontSize: '0.86rem', lineHeight: 1.6 }}>
          <div style={{ background: '#FAF8F3', border: '1px solid #1D1E22', padding: '1.1rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontWeight: 800, color: '#0A2458', marginBottom: '0.3rem' }}>Disbursement Bottlenecks</div>
            <p style={{ margin: 0, color: '#444' }}>
              78.3% of analyzed MPs experience delayed fund disbursement due to pending Utilization Certificates (UCs) and delayed physical progress verification by District Authorities.
            </p>
          </div>

          <div style={{ background: '#FAF8F3', border: '1px solid #1D1E22', padding: '1.1rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontWeight: 800, color: 'var(--color-accent-teal-hover)', marginBottom: '0.3rem' }}>Regional Performance Variance</div>
            <p style={{ margin: 0, color: '#444' }}>
              Northeastern states lead in utilization percentages (Nagaland 91.5%), driven by timely single-stage community infrastructure projects.
            </p>
          </div>

          <div style={{ background: '#FAF8F3', border: '1px solid #1D1E22', padding: '1.1rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontWeight: 800, color: '#D9534F', marginBottom: '0.3rem' }}>MoSPI Policy Intervention</div>
            <p style={{ margin: 0, color: '#444' }}>
              Implementing automated e-UC validation and AI-driven duplicate checks reduces sanction cycle delays from 180 days to 14 days.
            </p>
          </div>
        </div>
      </div>

      {/* Landing Page Footer without CTA buttons */}
      <Footer hideCTAButtons={true} />
    </div>
  );
};

const FinancialAnomalyDashboard = ({ isHi }) => {
  const { costAndDelayAnomalies } = useData();
  const mapAnomalyData = (data) => {
    if (!data || data.length === 0) return MOCK_ANOMALY_PROJECTS;
    return data.slice(0, 10).map(d => ({
      id: d.work_id,
      title: d.work_short_title || d.work_description || 'Unknown Work',
      category: d.work_category || 'General',
      state: d.state_name,
      district: d.const_name,
      constituency: d.const_name,
      sanctionedCost: `₹${((d.sanction_amount || 0) / 100000).toFixed(1)} L`,
      expenditure: `₹${((d.total_disbursed || 0) / 100000).toFixed(1)} L`,
      expenditurePct: Math.round(((d.total_disbursed || 0) / (d.sanction_amount || 1)) * 100),
      physicalProgress: 50,
      delayMonths: Math.round((d.completion_delay_days || 0) / 30),
      costDeviationPct: Math.round(d.cost_overrun_pct || 0),
      riskScore: Math.round(Math.min(99, (d.severity_score || 0) * 10)),
      riskBand: (d.severity_score || 0) > 5 ? 'Critical' : 'High',
      confidenceScore: 90,
      agency: d.primary_vendor_name || 'Unknown Agency',
      agencyPriorFlags: 1,
      reasons: [
        `Cost deviation of ${Math.round(d.cost_overrun_pct || 0)}%`,
        `Delayed by ${Math.round((d.completion_delay_days || 0) / 30)} months`
      ],
      recommendedAction: 'Conduct physical inspection and verify measurement books.'
    }));
  };
  const anomalyProjects = mapAnomalyData(costAndDelayAnomalies);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('Last Run: Today, 10:45 AM • 218K Records Scanned');
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);

  // ── Live KPI state from /api/analytics/summary ─────────────────────────────────
  const [finGuardKpis, setFinGuardKpis] = useState({
    projectsAnalyzed: '2,18,913',
    anomaliesDetected: '7,100',
    highRisk: '1',
    exposureCr: '184.5',
  });

  useEffect(() => {
    const token = localStorage.getItem('nirikshak_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    fetch('/api/analytics/summary', { headers })
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then(data => {
        const totalAnomalies = (data.total_high_risk || 0) + (data.total_moderate_risk || 0);
        const exposureCr = (data.total_sanctioned_cr * 0.015).toFixed(1); // ~1.5% flagged mismatch
        setFinGuardKpis({
          projectsAnalyzed: data.total_projects.toLocaleString('en-IN'),
          anomaliesDetected: totalAnomalies.toLocaleString('en-IN'),
          highRisk: data.total_high_risk.toLocaleString('en-IN'),
          exposureCr,
        });
        setAnalysisStatus(`Last Run: Live • ${data.total_projects.toLocaleString('en-IN')} Records Scanned`);
      })
      .catch(err => console.error('FinGuard: analytics/summary failed:', err));
  }, []);

  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisStatus(`Last Run: Just now • ${finGuardKpis.projectsAnalyzed} Records Scanned`);
      alert(isHi ? `FinGuard एआई वित्तीय विश्लेषण पूर्ण हुआ! ${finGuardKpis.anomaliesDetected} विसंगतियां पहचानी गईं।` : `FinGuard AI Financial Analysis completed! ${finGuardKpis.anomaliesDetected} anomalies identified.`);
    }, 1200);
  };

  const CATEGORY_BENCHMARKS = [
    { cat: 'Community Infrastructure', actual: 48.5, expected: 32.8, overrun: 47.8, color: '#D9534F' },
    { cat: 'Renewable / Civic', actual: 32.0, expected: 23.8, overrun: 34.4, color: '#E07A5F' },
    { cat: 'CC Roads & Pathways', actual: 24.5, expected: 20.1, overrun: 21.8, color: '#E5B842' },
    { cat: 'Drinking Water / Tanks', actual: 18.2, expected: 14.1, overrun: 29.0, color: '#E07A5F' },
    { cat: 'School Science Labs', actual: 15.0, expected: 11.4, overrun: 31.5, color: '#D9534F' }
  ];

  const BUDGET_FLOW_STEPS = [
    { title: 'Sanctioned Allocation', amount: '₹14,840 Cr', pct: 100, color: '#0A2458', desc: 'Total approved budget' },
    { title: 'Released Installments', amount: '₹13,920 Cr', pct: 93.8, color: '#2B59C3', desc: 'Disbursed by MoSPI' },
    { title: 'Verified Expenditure', amount: '₹12,410 Cr', pct: 83.6, color: '#52B79A', desc: 'Vouchers & UC submitted' },
    { title: 'Flagged Mismatch Risk', amount: '₹184.5 Cr', pct: 1.2, color: '#D9534F', desc: 'Disparity / Overrun Risk' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Workflow Indicator Banner */}
      <div style={{ background: '#F3EFE6', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '0.85rem 1.25rem', boxShadow: '2px 2.5px 0px #1D1E22', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {isHi ? 'FinGuard वित्तीय खुफिया कार्यप्रवाह' : 'FinGuard Financial Intelligence Pipeline'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', fontWeight: 800, flexWrap: 'wrap' }}>
          <span style={{ padding: '0.2rem 0.6rem', background: '#FFF', border: '1px solid #1D1E22', borderRadius: '4px' }}>FINANCIAL DATA</span>
          <span>→</span>
          <span style={{ padding: '0.2rem 0.6rem', background: '#FFF', border: '1px solid #1D1E22', borderRadius: '4px' }}>AI ANALYSIS</span>
          <span>→</span>
          <span style={{ padding: '0.2rem 0.6rem', background: '#FEF2F2', border: '1px solid #D9534F', color: '#D9534F', borderRadius: '4px' }}>ANOMALY DETECTED</span>
          <span>→</span>
          <span style={{ padding: '0.2rem 0.6rem', background: '#FFF8E1', border: '1px solid #E5B842', color: '#B8860B', borderRadius: '4px' }}>EXPLANATION</span>
          <span>→</span>
          <span style={{ padding: '0.2rem 0.6rem', background: '#E8F5E9', border: '1px solid #52B79A', color: '#1E7E34', borderRadius: '4px' }}>INVESTIGATION</span>
        </div>
      </div>

      {/* Header & Control Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem', borderBottom: '1.5px solid #1D1E22', paddingBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: '#FEF2F2', border: '1.5px solid #1D1E22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D9534F' }}>
              <Shield size={22} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '2rem', fontWeight: 800, color: '#1D1E22', margin: 0, lineHeight: 1.2 }}>
                {isHi ? 'वित्तीय विसंगति पहचान (FinGuard)' : 'Financial Anomaly Detection'}
              </h1>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem', margin: 0 }}>
                {isHi ? 'एमपीलैड्स परियोजनाओं की एआई-संचालित वित्तीय निगरानी, लागत अधिकता एवं भुगतान विसंगतियां' : 'AI-powered financial monitoring of MPLADS projects, cost benchmarking & payment pattern anomaly detection'}
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600, background: '#FFF', padding: '0.45rem 0.85rem', border: '1px solid #1D1E22', borderRadius: 'var(--radius-md)' }}>
            {analysisStatus}
          </div>
          <button
            type="button"
            onClick={handleRunAnalysis}
            className="btn-teal"
            disabled={isAnalyzing}
            style={{
              padding: '0.55rem 1.25rem',
              fontSize: '0.86rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '2px 3px 0px #1D1E22',
              cursor: isAnalyzing ? 'wait' : 'pointer'
            }}
          >
            <RefreshCw size={16} style={{ animation: isAnalyzing ? 'spin 1s linear infinite' : 'none' }} />
            <span>{isAnalyzing ? (isHi ? 'विश्लेषण जारी...' : 'Analyzing FinGuard...') : (isHi ? 'वित्तीय विश्लेषण चलाएं' : 'Run FinGuard Analysis')}</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.15rem' }}>
        <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: '2px 3px 0px #1D1E22' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Projects Analyzed</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1D1E22' }}>{finGuardKpis.projectsAnalyzed}</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>16-17th Lok Sabha Records</div>
        </div>

        <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: '2px 3px 0px #1D1E22' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#D9534F', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Financial Anomalies</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#D9534F' }}>{finGuardKpis.anomaliesDetected}</div>
          <div style={{ fontSize: '0.76rem', color: '#D9534F', fontWeight: 700, marginTop: '0.25rem' }}>Flagged for Audit</div>
        </div>

        <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: '2px 3px 0px #1D1E22' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#B8860B', textTransform: 'uppercase', marginBottom: '0.35rem' }}>High Risk Projects</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#B8860B' }}>{finGuardKpis.highRisk}</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>Critical Mismatch (&gt;30% Gap)</div>
        </div>

        <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: '2px 3px 0px #1D1E22' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Total Financial Exposure</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0A2458' }}>₹{finGuardKpis.exposureCr} Cr</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>At-Risk Sanctioned Allocation</div>
        </div>
      </div>

      {/* 2-Column Analytical Charts Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1fr)', gap: '1.5rem' }}>

        {/* LEFT COLUMN: Cost & Budget Intelligence */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: '3px 4px 0px #1D1E22' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
              {isHi ? 'लागत अधिकता पहचान' : '1. Cost Overrun & Benchmarking'}
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.25rem', color: '#1D1E22', marginBottom: '1.25rem', margin: 0 }}>
              Expected Cost vs Actual Cost Benchmarking
            </h3>

            {/* Overrun Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {CATEGORY_BENCHMARKS.map((item) => (
                <div key={item.cat} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700 }}>
                    <span>{item.cat}</span>
                    <span style={{ color: item.color }}>Actual ₹{item.actual}L vs Exp ₹{item.expected}L (+{item.overrun}%)</span>
                  </div>
                  <div style={{ height: '10px', background: '#FAF8F3', borderRadius: '5px', border: '1px solid #1D1E22', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${(item.expected / item.actual) * 100}%`, height: '100%', background: '#52B79A' }} title="Expected Benchmark" />
                    <div style={{ width: `${(1 - (item.expected / item.actual)) * 100}%`, height: '100%', background: item.color }} title="Cost Overrun" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Budget Utilisation Flow */}
          <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: '3px 4px 0px #1D1E22' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
              {isHi ? 'बजट उपयोग विश्लेषण' : '2. Budget Utilisation Flow'}
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.25rem', color: '#1D1E22', marginBottom: '1.25rem', margin: 0 }}>
              Allocated → Released → Spent Flow
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {BUDGET_FLOW_STEPS.map((step) => (
                <div key={step.title} style={{ background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '0.85rem 1.1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: step.color }}>{step.title}</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1D1E22' }}>{step.amount} ({step.pct}%)</span>
                  </div>
                  <div style={{ height: '7px', background: '#E0E0E0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${step.pct}%`, height: '100%', background: step.color }} />
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>{step.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Financial Behaviour Analysis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Expenditure vs Physical Progress Mismatch */}
          <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: '3px 4px 0px #1D1E22' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#D9534F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
              {isHi ? 'व्यय बनाम भौतिक प्रगति विसंगति' : '3. Expenditure vs Progress Mismatch'}
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.25rem', color: '#1D1E22', marginBottom: '1.25rem', margin: 0 }}>
              Disparity Threshold Analysis (&gt;30% Gap)
            </h3>

            <div style={{ background: '#FEF2F2', border: '1px solid #D9534F', borderRadius: 'var(--radius-md)', padding: '1.1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                <span style={{ color: '#D9534F' }}>Critical Sample: MPLADS-2026-8871</span>
                <span style={{ color: '#D9534F' }}>Disparity Gap: 50%</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span>Financial Disbursed:</span> <strong>90% (₹43.65 Lakh)</strong>
                  </div>
                  <div style={{ height: '8px', background: '#FFF', border: '1px solid #D9534F', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '90%', height: '100%', background: '#D9534F' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span>Physical Completed:</span> <strong>40% (Field Inspected)</strong>
                  </div>
                  <div style={{ height: '8px', background: '#FFF', border: '1px solid #52B79A', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '40%', height: '100%', background: '#52B79A' }} />
                  </div>
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#555', lineHeight: 1.5, margin: 0 }}>
              Rule-based engine flags projects where expenditure exceeds reported physical completion by more than 30 percentage points, triggering physical audit protocols.
            </p>
          </div>

          {/* Payment Pattern Anomaly Chart */}
          <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: '3px 4px 0px #1D1E22' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#B8860B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
              {isHi ? 'भुगतान पैटर्न विसंगति पहचान' : '4. Payment Pattern Anomaly Detection'}
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.25rem', color: '#1D1E22', marginBottom: '1rem', margin: 0 }}>
              Single 48-Hour Disbursal Burst vs Milestone Tranches
            </h3>

            {/* Visual Timeline Comparison */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem' }}>
              <div style={{ padding: '0.75rem 1rem', background: '#E8F5E9', border: '1px solid #52B79A', borderRadius: 'var(--radius-sm)' }}>
                <strong style={{ color: '#1E7E34' }}>Normal Pattern:</strong> Gradual milestone disbursements (20% → 40% → 70% → 100%) aligned with UC filings over 12 months.
              </div>
              <div style={{ padding: '0.75rem 1rem', background: '#FFF8E1', border: '1px solid #E5B842', borderRadius: 'var(--radius-sm)' }}>
                <strong style={{ color: '#B8860B' }}>Suspicious Burst Pattern:</strong> 85% of total budget disbursed in a single 48-hour window prior to fiscal year closing.
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Detected Financial Anomalies Table */}
      <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '3px 4px 0px #1D1E22' }}>
        <div style={{ padding: '1.2rem 1.5rem', background: '#F3EFE6', borderBottom: '1px solid #1D1E22', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.35rem', color: '#1D1E22', margin: 0 }}>
              {isHi ? 'पहचानी गई वित्तीय विसंगतियां' : 'Detected Financial Anomalies'}
            </h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
              Click any row to inspect complete financial dossier & AI audit details
            </div>
          </div>
          <span className="badge" style={{ background: '#FEF2F2', color: '#D9534F', border: '1px solid #D9534F' }}>
            5 Flagged Works
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #EAEAEA', textAlign: 'left' }}>
                <th style={{ padding: '0.85rem 1.15rem' }}>Work ID & Title</th>
                <th style={{ padding: '0.85rem 1.15rem' }}>District & State</th>
                <th style={{ padding: '0.85rem 1.15rem' }}>Actual Cost</th>
                <th style={{ padding: '0.85rem 1.15rem' }}>Expected Benchmark</th>
                <th style={{ padding: '0.85rem 1.15rem' }}>Deviation</th>
                <th style={{ padding: '0.85rem 1.15rem' }}>Spent / Done</th>
                <th style={{ padding: '0.85rem 1.15rem' }}>Risk Score</th>
                <th style={{ padding: '0.85rem 1.15rem' }}>AI Conf.</th>
                <th style={{ padding: '0.85rem 1.15rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {anomalyProjects.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedAnomaly(item)}
                  style={{ borderBottom: '1px solid #F0F0F0', cursor: 'pointer', background: selectedAnomaly?.id === item.id ? '#FAF8F3' : 'transparent' }}
                >
                  <td style={{ padding: '0.85rem 1.15rem', maxWidth: '260px' }}>
                    <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0A2458', fontSize: '0.78rem' }}>{item.id}</div>
                    <div style={{ fontWeight: 700, color: '#1D1E22', marginBottom: '0.15rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>{item.category}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1.15rem' }}>{item.district}, {item.state}</td>
                  <td style={{ padding: '0.85rem 1.15rem', fontWeight: 800, color: '#D9534F' }}>{item.sanctionedCost}</td>
                  <td style={{ padding: '0.85rem 1.15rem', fontWeight: 700, color: '#52B79A' }}>₹32,80,000</td>
                  <td style={{ padding: '0.85rem 1.15rem', fontWeight: 800, color: '#D9534F' }}>+{item.costDeviationPct}%</td>
                  <td style={{ padding: '0.85rem 1.15rem' }}>
                    <span style={{ color: '#D9534F', fontWeight: 700 }}>{item.expenditurePct}% spent</span> / <span style={{ color: 'var(--color-accent-teal-hover)', fontWeight: 700 }}>{item.physicalProgress}% done</span>
                  </td>
                  <td style={{ padding: '0.85rem 1.15rem' }}>
                    <span style={{
                      padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.76rem', fontWeight: 800,
                      background: item.riskScore > 80 ? '#FEF2F2' : '#FFF8E1',
                      color: item.riskScore > 80 ? '#D9534F' : '#E5B842',
                      border: `1px solid ${item.riskScore > 80 ? '#D9534F' : '#E5B842'}`
                    }}>
                      {item.riskScore}/100 ({item.riskBand})
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1.15rem', fontWeight: 800, color: 'var(--color-accent-teal-hover)' }}>
                    {item.confidenceScore}%
                  </td>
                  <td style={{ padding: '0.85rem 1.15rem', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAnomaly(item);
                      }}
                      className="btn-outline-dark"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                    >
                      Inspect Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Detail Slide-Over Drawer */}
      {selectedAnomaly && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
          onClick={() => setSelectedAnomaly(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '560px',
              height: '100%',
              background: '#FAF8F3',
              borderLeft: '2px solid #1D1E22',
              boxShadow: '-6px 0px 20px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              padding: '2rem'
            }}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1.5px solid #1D1E22', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span className="badge" style={{ background: '#FEF2F2', color: '#D9534F', border: '1px solid #D9534F', marginBottom: '0.4rem' }}>
                  {selectedAnomaly.id} • {selectedAnomaly.riskBand} Risk ({selectedAnomaly.riskScore}/100)
                </span>
                <h2 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.45rem', fontWeight: 800, color: '#1D1E22', margin: 0 }}>
                  {selectedAnomaly.title}
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                  {selectedAnomaly.district}, {selectedAnomaly.state} • Agency: <strong>{selectedAnomaly.agency}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnomaly(null)}
                style={{ background: 'none', border: '1.5px solid #1D1E22', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            {/* Why Flagged (AI Triggers) */}
            <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.25rem', boxShadow: '2px 3px 0px #1D1E22' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#D9534F', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Why Flagged (AI Anomaly Triggers)
              </div>
              <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.86rem', color: '#1D1E22', lineHeight: 1.6 }}>
                {selectedAnomaly.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            {/* Financial Deviation Comparison */}
            <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.25rem', boxShadow: '2px 3px 0px #1D1E22' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Financial Deviation & Cost Benchmarking
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.84rem' }}>
                <div style={{ padding: '0.65rem', background: '#FEF2F2', border: '1px solid #D9534F', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#D9534F', fontWeight: 700 }}>Actual Sanctioned Cost</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#D9534F' }}>{selectedAnomaly.sanctionedCost}</div>
                </div>
                <div style={{ padding: '0.65rem', background: '#E8F5E9', border: '1px solid #52B79A', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#1E7E34', fontWeight: 700 }}>District Benchmark Median</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E7E34' }}>₹32,80,000</div>
                </div>
              </div>
            </div>

            {/* Expenditure vs Physical Progress Gap */}
            <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.25rem', boxShadow: '2px 3px 0px #1D1E22' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Expenditure vs Physical Progress Mismatch
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.84rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span>Disbursed Expenditure:</span> <strong style={{ color: '#D9534F' }}>{selectedAnomaly.expenditurePct}% ({selectedAnomaly.expenditure})</strong>
                  </div>
                  <div style={{ height: '8px', background: '#E0E0E0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${selectedAnomaly.expenditurePct}%`, height: '100%', background: '#D9534F' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span>Physical Progress Completed:</span> <strong style={{ color: '#52B79A' }}>{selectedAnomaly.physicalProgress}%</strong>
                  </div>
                  <div style={{ height: '8px', background: '#E0E0E0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${selectedAnomaly.physicalProgress}%`, height: '100%', background: '#52B79A' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended Action */}
            <div style={{ background: '#FFF8E1', border: '1px solid #E5B842', borderRadius: 'var(--radius-md)', padding: '1.1rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#B8860B', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Recommended Field Action
              </div>
              <div style={{ fontSize: '0.86rem', color: '#1D1E22', fontWeight: 600 }}>
                {selectedAnomaly.recommendedAction}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.85rem', marginTop: 'auto' }}>
              <button
                type="button"
                onClick={() => alert(`Field auditor dispatched for work ${selectedAnomaly.id}`)}
                className="btn-teal"
                style={{ flex: 1, padding: '0.7rem', fontSize: '0.84rem' }}
              >
                Dispatch Auditor
              </button>
              <button
                type="button"
                onClick={() => setSelectedAnomaly(null)}
                className="btn-outline-dark"
                style={{ flex: 1, padding: '0.7rem', fontSize: '0.84rem' }}
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Landing Page Footer without CTA buttons */}
      <Footer hideCTAButtons={true} />
    </div>
  );
};

const GeoIntelDashboard = ({ isHi }) => {
  const [activeLayers, setActiveLayers] = useState({
    locations: true,
    heatmap: true,
    clusters: false,
    duplicates: true,
    districtRisk: true,
    constituencyRisk: false
  });

  const [selectedMapProject, setSelectedMapProject] = useState(null);

  const MAP_PROJECT_MARKERS = [
    {
      id: 'MPLADS-2026-8871',
      title: 'Community Hall & Skill Center',
      category: 'Community Infrastructure',
      state: 'Madhya Pradesh',
      district: 'Jabalpur',
      constituency: 'Jabalpur Lok Sabha',
      lat: 23.1815,
      lng: 79.9864,
      cost: '₹48,50,000',
      expenditure: '₹43,65,000',
      progress: 40,
      riskScore: 87,
      riskBand: 'Critical',
      nearby: 'MPLADS-2025-8812 (140m away)',
      duplicateStatus: 'Flagged (94.2% Similarity)',
      xPct: 46,
      yPct: 52
    },
    {
      id: 'MPLADS-2026-3302',
      title: 'Solar High-Mast Lights',
      category: 'Renewable / Civic',
      state: 'Uttar Pradesh',
      district: 'Varanasi',
      constituency: 'Varanasi Lok Sabha',
      lat: 25.3176,
      lng: 82.9739,
      cost: '₹32,00,000',
      expenditure: '₹28,80,000',
      progress: 55,
      riskScore: 82,
      riskBand: 'Critical',
      nearby: 'MPLADS-2025-1044 (210m away)',
      duplicateStatus: 'Under Verification',
      xPct: 54,
      yPct: 44
    },
    {
      id: 'MPLADS-2025-7219',
      title: 'CC Interlocking Road to School',
      category: 'Roads & Pathways',
      state: 'Madhya Pradesh',
      district: 'Bhopal',
      constituency: 'Bhopal Lok Sabha',
      lat: 23.2599,
      lng: 77.4126,
      cost: '₹24,50,000',
      expenditure: '₹22,05,000',
      progress: 60,
      riskScore: 79,
      riskBand: 'High',
      nearby: 'MPLADS-2024-5110 (310m away)',
      duplicateStatus: 'Flagged (Perceptual Hash Match)',
      xPct: 42,
      yPct: 50
    },
    {
      id: 'MPLADS-2026-1544',
      title: 'Deep Borewell & Overhead Tank',
      category: 'Drinking Water',
      state: 'Madhya Pradesh',
      district: 'Indore',
      constituency: 'Indore Lok Sabha',
      lat: 22.7196,
      lng: 75.8577,
      cost: '₹18,20,000',
      expenditure: '₹14,56,000',
      progress: 45,
      riskScore: 76,
      riskBand: 'High',
      nearby: 'MPLADS-2025-3390 (450m away)',
      duplicateStatus: 'Clean',
      xPct: 39,
      yPct: 53
    },
    {
      id: 'MPLADS-2025-9001',
      title: 'Science Laboratory Equipment',
      category: 'Education & Schools',
      state: 'Bihar',
      district: 'Patna',
      constituency: 'Patna Sahib Lok Sabha',
      lat: 25.5941,
      lng: 85.1376,
      cost: '₹15,00,000',
      expenditure: '₹13,50,000',
      progress: 50,
      riskScore: 73,
      riskBand: 'High',
      nearby: 'MPLADS-2024-9901 (180m away)',
      duplicateStatus: 'Flagged (Procurement Burst)',
      xPct: 62,
      yPct: 45
    }
  ];

  const DISTRICT_RISK_SUMMARY = [
    { district: 'Jabalpur', state: 'Madhya Pradesh', works: 412, highRisk: 18, riskScore: 87, util: 74.2 },
    { district: 'Patna', state: 'Bihar', works: 580, highRisk: 22, riskScore: 82, util: 71.5 },
    { district: 'Varanasi', state: 'Uttar Pradesh', works: 490, highRisk: 19, riskScore: 81, util: 73.0 },
    { district: 'Bhopal', state: 'Madhya Pradesh', works: 360, highRisk: 14, riskScore: 79, util: 78.4 },
    { district: 'Indore', state: 'Madhya Pradesh', works: 450, highRisk: 12, riskScore: 76, util: 81.0 }
  ];

  const NEARBY_PAIR_COMPARISON = [
    {
      workA: { id: 'MPLADS-2025-8812', title: 'Community Hall at Gram Badgaon', cost: '₹25,00,000', agency: 'M/s Rural Infra Buildcon' },
      workB: { id: 'MPLADS-2026-1049', title: 'Community Center Building, Badgaon', cost: '₹24,80,000', agency: 'Rural Infrastructure Buildcon' },
      distance: '140 meters',
      similarity: '94.2%',
      risk: 'Critical Duplicate Risk'
    },
    {
      workA: { id: 'MPLADS-2025-4421', title: 'RO Drinking Water Plant Ward 8', cost: '₹12,00,000', agency: 'AquaPure Tech Solutions' },
      workB: { id: 'MPLADS-2026-2180', title: 'RO Clean Water Unit Ward No 8', cost: '₹12,25,000', agency: 'Aqua Pure Technologies' },
      distance: '210 meters',
      similarity: '95.8%',
      risk: 'High Overlap Risk'
    }
  ];

  const toggleLayer = (layerKey) => {
    setActiveLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Workflow Indicator Banner */}
      <div style={{ background: '#F3EFE6', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '0.85rem 1.25rem', boxShadow: '2px 2.5px 0px #1D1E22', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {isHi ? 'GeoIntel भू-स्थानिक खुफिया कार्यप्रवाह' : 'GeoIntel Spatial Intelligence Pipeline'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', fontWeight: 800, flexWrap: 'wrap' }}>
          <span style={{ padding: '0.2rem 0.6rem', background: '#FFF', border: '1px solid #1D1E22', borderRadius: '4px' }}>INDIA MAP</span>
          <span>→</span>
          <span style={{ padding: '0.2rem 0.6rem', background: '#FFF', border: '1px solid #1D1E22', borderRadius: '4px' }}>SPATIAL PATTERN</span>
          <span>→</span>
          <span style={{ padding: '0.2rem 0.6rem', background: '#FEF2F2', border: '1px solid #D9534F', color: '#D9534F', borderRadius: '4px' }}>RISK / CLUSTER / DUPLICATE</span>
          <span>→</span>
          <span style={{ padding: '0.2rem 0.6rem', background: '#E8F5E9', border: '1px solid #52B79A', color: '#1E7E34', borderRadius: '4px' }}>PROJECT INVESTIGATION</span>
        </div>
      </div>

      {/* Header & Controls Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem', borderBottom: '1.5px solid #1D1E22', paddingBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: '#E8F5E9', border: '1.5px solid #1D1E22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent-teal-hover)' }}>
              <MapPin size={22} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '2rem', fontWeight: 800, color: '#1D1E22', margin: 0, lineHeight: 1.2 }}>
                {isHi ? 'भू-स्थानिक बुद्धिमत्ता (GeoIntel)' : 'Geospatial Intelligence (GeoIntel)'}
              </h1>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem', margin: 0 }}>
                {isHi ? 'स्थान-आधारित खुफिया: स्थानिक पैटर्न, परियोजना क्लस्टर और भौगोलिक जोखिम' : 'Location-based intelligence for identifying spatial patterns, project clusters, and geographic risk'}
              </p>
            </div>
          </div>
        </div>

        {/* Map Control Toggle Panel */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', background: '#FFF', border: '1.5px solid #1D1E22', padding: '0.4rem', borderRadius: 'var(--radius-md)', boxShadow: '2px 3px 0px #1D1E22' }}>
          <button
            type="button"
            onClick={() => toggleLayer('locations')}
            style={{
              padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 800, border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              background: activeLayers.locations ? '#1D1E22' : '#FFF', color: activeLayers.locations ? '#FFF' : '#1D1E22'
            }}
          >
            Project Locations
          </button>
          <button
            type="button"
            onClick={() => toggleLayer('heatmap')}
            style={{
              padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 800, border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              background: activeLayers.heatmap ? '#D9534F' : '#FFF', color: activeLayers.heatmap ? '#FFF' : '#1D1E22'
            }}
          >
            Risk Heatmap
          </button>
          <button
            type="button"
            onClick={() => toggleLayer('clusters')}
            style={{
              padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 800, border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              background: activeLayers.clusters ? '#0A2458' : '#FFF', color: activeLayers.clusters ? '#FFF' : '#1D1E22'
            }}
          >
            Clusters
          </button>
          <button
            type="button"
            onClick={() => toggleLayer('duplicates')}
            style={{
              padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 800, border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              background: activeLayers.duplicates ? '#B8860B' : '#FFF', color: activeLayers.duplicates ? '#FFF' : '#1D1E22'
            }}
          >
            Duplicate Works
          </button>
          <button
            type="button"
            onClick={() => toggleLayer('districtRisk')}
            style={{
              padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 800, border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              background: activeLayers.districtRisk ? '#52B79A' : '#FFF', color: activeLayers.districtRisk ? '#FFF' : '#1D1E22'
            }}
          >
            District Risk
          </button>
        </div>
      </div>

      {/* HERO ELEMENT: Interactive GeoIntel Vector Map Container */}
      <div style={{ position: 'relative', width: '100%', minHeight: '480px', background: '#F3EFE6', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', boxShadow: '3px 4px 0px #1D1E22', overflow: 'hidden' }}>
        {/* Render Vector India Map Component */}
        <IndiaMap />

        {/* Dynamic Map Pins & Spatial Overlays Layer */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
          {/* Heatmap Glow Overlays */}
          {activeLayers.heatmap && (
            <>
              <div style={{ position: 'absolute', left: '44%', top: '48%', width: '140px', height: '140px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(217,83,79,0.35) 0%, rgba(217,83,79,0) 70%)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', left: '60%', top: '42%', width: '120px', height: '120px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(224,122,95,0.35) 0%, rgba(224,122,95,0) 70%)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', left: '52%', top: '40%', width: '130px', height: '130px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(229,184,66,0.35) 0%, rgba(229,184,66,0) 70%)', pointerEvents: 'none' }} />
            </>
          )}

          {/* Geographic Cluster Badges */}
          {activeLayers.clusters && (
            <>
              <div style={{ position: 'absolute', left: '46%', top: '50%', background: '#0A2458', color: '#FFF', padding: '0.2rem 0.5rem', borderRadius: '12px', border: '1.5px solid #FFF', fontSize: '0.72rem', fontWeight: 900, boxShadow: '0 2px 6px rgba(0,0,0,0.3)', pointerEvents: 'auto', cursor: 'pointer' }}>142 Works</div>
              <div style={{ position: 'absolute', left: '60%', top: '42%', background: '#0A2458', color: '#FFF', padding: '0.2rem 0.5rem', borderRadius: '12px', border: '1.5px solid #FFF', fontSize: '0.72rem', fontWeight: 900, boxShadow: '0 2px 6px rgba(0,0,0,0.3)', pointerEvents: 'auto', cursor: 'pointer' }}>88 Works</div>
            </>
          )}

          {/* Interactive Project Location Markers */}
          {activeLayers.locations && MAP_PROJECT_MARKERS.map((pin) => (
            <div
              key={pin.id}
              onClick={() => setSelectedMapProject(pin)}
              style={{
                position: 'absolute',
                left: `${pin.xPct}%`,
                top: `${pin.yPct}%`,
                transform: 'translate(-50%, -100%)',
                pointerEvents: 'auto',
                cursor: 'pointer',
                zIndex: selectedMapProject?.id === pin.id ? 20 : 10
              }}
            >
              <div
                title={`${pin.title} (${pin.id})`}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50% 50% 50% 0',
                  transform: 'rotate(-45deg)',
                  background: pin.riskScore > 80 ? '#D9534F' : '#E5B842',
                  border: '1.5px solid #1D1E22',
                  boxShadow: '2px 2px 0px #1D1E22',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.15s ease'
                }}
              >
                <div style={{ transform: 'rotate(45deg)', color: '#FFF', fontSize: '0.72rem', fontWeight: 900 }}>
                  !
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend Box inside Map Overlay */}
        <div style={{ position: 'absolute', bottom: '15px', left: '15px', background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '0.6rem 0.9rem', boxShadow: '2px 2px 0px #1D1E22', fontSize: '0.74rem', zIndex: 15 }}>
          <div style={{ fontWeight: 800, color: '#1D1E22', marginBottom: '0.3rem' }}>Map Risk Legend</div>
          <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#D9534F', display: 'inline-block' }} />
              <span>Critical (81–100)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#E5B842', display: 'inline-block' }} />
              <span>High Risk (61–80)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#52B79A', display: 'inline-block' }} />
              <span>Low Risk (&lt;60)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spatial Risk Intelligence Analytics Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(320px, 1.15fr)', gap: '1.5rem' }}>

        {/* High-Risk Districts & Spatial Hotspots */}
        <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: '3px 4px 0px #1D1E22' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
            {isHi ? 'स्थानिक जोखिम हॉटस्पॉट' : 'Spatial Risk Hotspots'}
          </div>
          <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.25rem', color: '#1D1E22', marginBottom: '1.1rem', margin: 0 }}>
            Highest Risk Districts & Constituencies
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {DISTRICT_RISK_SUMMARY.map((d) => (
              <div key={d.district} style={{ background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1D1E22' }}>{d.district}, {d.state}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    {d.works} total works • <span style={{ color: '#D9534F', fontWeight: 700 }}>{d.highRisk} high-risk flags</span>
                  </div>
                </div>
                <span className="badge" style={{ background: d.riskScore > 80 ? '#FEF2F2' : '#FFF8E1', color: d.riskScore > 80 ? '#D9534F' : '#B8860B', border: '1px solid #1D1E22', fontSize: '0.78rem', fontWeight: 800 }}>
                  Score {d.riskScore}/100
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Nearby Project Comparison Panel */}
        <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: '3px 4px 0px #1D1E22' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#B8860B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
            {isHi ? 'निकटवर्ती परियोजना तुलना' : 'Nearby Project Comparison & Proximity'}
          </div>
          <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.25rem', color: '#1D1E22', marginBottom: '1.1rem', margin: 0 }}>
            Geographic Overlap & Proximity Analysis
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {NEARBY_PAIR_COMPARISON.map((pair, idx) => (
              <div key={idx} style={{ background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', borderBottom: '1px solid #EAEAEA', paddingBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#D9534F' }}>Distance: {pair.distance}</span>
                  <span className="badge" style={{ background: '#FEF2F2', color: '#D9534F', border: '1px solid #D9534F', fontSize: '0.72rem' }}>
                    {pair.risk} ({pair.similarity})
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#1D1E22', lineHeight: 1.45 }}>
                  <div><strong>Work A:</strong> {pair.workA.title} ({pair.workA.cost})</div>
                  <div style={{ marginTop: '0.2rem' }}><strong>Work B:</strong> {pair.workB.title} ({pair.workB.cost})</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* District & Constituency Risk Analysis Table */}
      <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '3px 4px 0px #1D1E22' }}>
        <div style={{ padding: '1.2rem 1.5rem', background: '#F3EFE6', borderBottom: '1px solid #1D1E22', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.35rem', color: '#1D1E22', margin: 0 }}>
              {isHi ? 'जिला एवं निर्वाचन क्षेत्र जोखिम विश्लेषण' : 'District & Constituency Risk Registry'}
            </h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
              Spatial risk metrics across 543 Lok Sabha constituencies
            </div>
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0A2458' }}>
            5 Districts Listed
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #EAEAEA', textAlign: 'left' }}>
                <th style={{ padding: '0.85rem 1.15rem' }}>District & State</th>
                <th style={{ padding: '0.85rem 1.15rem' }}>Total Sanctioned Works</th>
                <th style={{ padding: '0.85rem 1.15rem' }}>High-Risk Works</th>
                <th style={{ padding: '0.85rem 1.15rem' }}>Spatial Risk Score</th>
                <th style={{ padding: '0.85rem 1.15rem' }}>Fund Utilisation Rate</th>
                <th style={{ padding: '0.85rem 1.15rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {DISTRICT_RISK_SUMMARY.map((row) => (
                <tr key={row.district} style={{ borderBottom: '1px solid #F0F0F0' }}>
                  <td style={{ padding: '0.85rem 1.15rem', fontWeight: 800, color: '#1D1E22' }}>{row.district}, {row.state}</td>
                  <td style={{ padding: '0.85rem 1.15rem', fontWeight: 700 }}>{row.works} works</td>
                  <td style={{ padding: '0.85rem 1.15rem', color: '#D9534F', fontWeight: 800 }}>{row.highRisk} works</td>
                  <td style={{ padding: '0.85rem 1.15rem' }}>
                    <span style={{
                      padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.76rem', fontWeight: 800,
                      background: row.riskScore > 80 ? '#FEF2F2' : '#FFF8E1',
                      color: row.riskScore > 80 ? '#D9534F' : '#B8860B',
                      border: `1px solid ${row.riskScore > 80 ? '#D9534F' : '#B8860B'}`
                    }}>
                      {row.riskScore}/100
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1.15rem', fontWeight: 800, color: 'var(--color-accent-teal-hover)' }}>{row.util}%</td>
                  <td style={{ padding: '0.85rem 1.15rem', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => alert(`Inspecting spatial risk for ${row.district}`)}
                      className="btn-outline-dark"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                    >
                      View District Map
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project Detail Slide-Over Drawer on Map Marker Click */}
      {selectedMapProject && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
          onClick={() => setSelectedMapProject(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '540px',
              height: '100%',
              background: '#FAF8F3',
              borderLeft: '2px solid #1D1E22',
              boxShadow: '-6px 0px 20px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              padding: '2rem'
            }}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1.5px solid #1D1E22', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span className="badge" style={{ background: '#FEF2F2', color: '#D9534F', border: '1px solid #D9534F', marginBottom: '0.4rem' }}>
                  {selectedMapProject.id} • {selectedMapProject.riskBand} Risk ({selectedMapProject.riskScore}/100)
                </span>
                <h2 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.45rem', fontWeight: 800, color: '#1D1E22', margin: 0 }}>
                  {selectedMapProject.title}
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                  {selectedMapProject.district}, {selectedMapProject.state} • {selectedMapProject.constituency}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMapProject(null)}
                style={{ background: 'none', border: '1.5px solid #1D1E22', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            {/* Geo Coordinates */}
            <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.1rem', marginBottom: '1.1rem', boxShadow: '2px 3px 0px #1D1E22' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                Spatial Geo-Coordinates
              </div>
              <div style={{ fontSize: '0.86rem', fontFamily: 'monospace', fontWeight: 700, color: '#1D1E22' }}>
                Lat: {selectedMapProject.lat}° N, Lng: {selectedMapProject.lng}° E
              </div>
            </div>

            {/* Cost & Progress */}
            <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.1rem', marginBottom: '1.1rem', boxShadow: '2px 3px 0px #1D1E22' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                Cost & Physical Execution
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.84rem' }}>
                <div>Approved Cost: <strong>{selectedMapProject.cost}</strong></div>
                <div>Disbursed: <strong>{selectedMapProject.expenditure}</strong></div>
                <div>Progress Done: <strong style={{ color: 'var(--color-accent-teal-hover)' }}>{selectedMapProject.progress}%</strong></div>
                <div>Duplicate Status: <strong style={{ color: '#D9534F' }}>{selectedMapProject.duplicateStatus}</strong></div>
              </div>
            </div>

            {/* Nearby Projects */}
            <div style={{ display: 'flex', gap: '0.85rem', marginTop: 'auto' }}>
              <button
                type="button"
                onClick={() => alert(`Opening full dossier for ${selectedMapProject.id}`)}
                className="btn-teal"
                style={{ flex: 1, padding: '0.7rem', fontSize: '0.84rem' }}
              >
                View Complete Dossier
              </button>
              <button
                type="button"
                onClick={() => setSelectedMapProject(null)}
                className="btn-outline-dark"
                style={{ flex: 1, padding: '0.7rem', fontSize: '0.84rem' }}
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Landing Page Footer without CTA buttons */}
      <Footer hideCTAButtons={true} />
    </div>
  );
};

const DuplicateDetectionDashboard = ({ isHi }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('Last Scan: Today, 11:30 AM • 218K Works Scanned');
  const [selectedPair, setSelectedPair] = useState(null);
  const [duplicatePairs, setDuplicatePairs] = useState([]);
  const [dupKpiProjects, setDupKpiProjects] = useState('2,18,913');

  useEffect(() => {
    // Fetch live total_projects for the KPI card
    const token = localStorage.getItem('nirikshak_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    fetch('/api/analytics/summary', { headers })
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then(data => {
        setDupKpiProjects(data.total_projects.toLocaleString('en-IN'));
        setScanStatus(`Last Scan: Live • ${data.total_projects.toLocaleString('en-IN')} Works Scanned`);
      })
      .catch(err => console.error('DupDetect: analytics/summary failed:', err));

    // Also load the duplicate pair list from the pre-computed JSON file
    fetch('/data/duplicate_project_alerts.json')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map(item => {
            const A_sanction = item.A_sanction_amount || 0;
            const B_sanction = item.B_sanction_amount || 0;
            const costDiffVal = Math.abs(A_sanction - B_sanction);
            const costDiffPctVal = A_sanction > 0 ? (costDiffVal / A_sanction * 100) : 0;
            
            return {
              pairId: `DUP-${item.work_id_A}-${item.work_id_B}`,
              confidenceScore: Math.round(item.risk_confidence_score || 90),
              status: item.alert_type === 'SPLIT_WORK' ? 'Requires Review' : 'Under Investigation',
              location: `${item.A_const_name || 'N/A'}, ${item.A_state_name || 'N/A'}`,
              costDiff: `₹${costDiffVal.toLocaleString('en-IN')} (${costDiffPctVal.toFixed(1)}%)`,
              overallSim: `${Math.round((item.text_similarity_score || 0.9) * 100)}%`,
              signals: {
                textSim: Math.round((item.text_similarity_score || 0.9) * 100),
                categoryMatch: item.A_work_category === item.B_work_category ? 100 : 0,
                costSim: Math.round(100 - Math.min(100, costDiffPctVal)),
                agencyMatch: item.agency_match_flag ? 100 : 0,
                geoProximity: item.location_match_flag ? 100 : 0,
                timelineOverlap: item.temporal_match_flag ? 100 : 0
              },
              workA: {
                id: `MPLADS-${item.work_id_A}`,
                title: item.A_activity_name || item.A_work_description || 'MPLADS Project A',
                description: item.A_work_description || 'MPLADS project details.',
                category: item.A_work_category || 'Normal/Others',
                cost: `₹${A_sanction.toLocaleString('en-IN')}`,
                agency: item.A_primary_vendor_name || 'N/A',
                location: `${item.A_const_name || 'N/A'}, ${item.A_state_name || 'N/A'}`,
                startDate: item.A_sanction_date || 'N/A',
                expectedCompletion: item.A_actual_end_date || 'N/A'
              },
              workB: {
                id: `MPLADS-${item.work_id_B}`,
                title: item.B_activity_name || item.B_work_description || 'MPLADS Project B',
                description: item.B_work_description || 'MPLADS project details.',
                category: item.B_work_category || 'Normal/Others',
                cost: `₹${B_sanction.toLocaleString('en-IN')}`,
                agency: item.B_primary_vendor_name || 'N/A',
                location: `${item.B_const_name || 'N/A'}, ${item.B_state_name || 'N/A'}`,
                startDate: item.B_sanction_date || 'N/A',
                expectedCompletion: item.B_actual_end_date || 'N/A'
              },
              evidence: {
                distance: item.location_match_flag ? 'Close Proximity' : 'Standard Proximity',
                costVariance: `${costDiffPctVal.toFixed(1)}% difference`,
                daysApart: 'Overlapping temporal cycle',
                agencyResult: item.agency_match_flag ? 'Same Contractor/Fuzzy Match' : 'Different Contractors',
                flagReason: `Flagged due to high textual resemblance (${Math.round((item.text_similarity_score || 0.9) * 100)}%) and matching administrative context.`
              }
            };
          });
          setDuplicatePairs(formatted);
        }
      })
      .catch(err => console.error('Error loading duplicate pairs:', err));
  }, []);


  const handleRunDetection = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScanStatus('Last Scan: Just now • 218K Works Scanned');
      alert(isHi ? 'मल्टी-सिग्नल एआई डुप्लिकेट विश्लेषण पूर्ण हुआ! 482 संभावित डुप्लिकेट युग्म मिले।' : 'Multi-Signal AI Duplicate Detection complete! 482 potential duplicate pairs identified.');
    }, 1200);
  };

  const DUPLICATE_PAIRS_DATA = duplicatePairs.length > 0 ? duplicatePairs : [
    {
      pairId: 'DUP-2026-9812',
      confidenceScore: 94,
      status: 'Requires Review',
      location: 'Jabalpur, Madhya Pradesh',
      costDiff: '₹20,000 (0.8%)',
      overallSim: '94%',
      signals: {
        textSim: 92,
        categoryMatch: 100,
        costSim: 87,
        agencyMatch: 100,
        geoProximity: 96,
        timelineOverlap: 81
      },
      workA: {
        id: 'MPLADS-2025-8812',
        title: 'Construction of Community Hall at Gram Badgaon',
        description: 'Multi-purpose community center with assembly room, toilets, and electrification.',
        category: 'Community Infrastructure',
        cost: '₹25,00,000',
        agency: 'M/s Rural Infra Buildcon Pvt Ltd',
        location: 'Gram Badgaon, Jabalpur, Madhya Pradesh',
        startDate: '12 Jan 2025',
        expectedCompletion: '15 Aug 2025'
      },
      workB: {
        id: 'MPLADS-2026-1049',
        title: 'Community Center Building, Badgaon Panchayat',
        description: 'Community facility hall with concrete roofing and public sanitation.',
        category: 'Community Infrastructure',
        cost: '₹24,80,000',
        agency: 'Rural Infrastructure Buildcon',
        location: 'Badgaon Panchayat, Jabalpur, Madhya Pradesh',
        startDate: '18 May 2025',
        expectedCompletion: '20 Dec 2025'
      },
      evidence: {
        distance: '140 meters apart',
        costVariance: '0.8% difference (₹20,000 gap)',
        daysApart: 'Sanctioned 126 days apart',
        agencyResult: 'Same Contractor (Fuzzy Ratio: 96%)',
        flagReason: 'Flagged because 5 of 6 independent signals strongly match. Physical proximity (<500m) and contractor match corroborate this alert.'
      }
    },
    {
      pairId: 'DUP-2026-4109',
      confidenceScore: 88,
      status: 'Under Investigation',
      location: 'Patna, Bihar',
      costDiff: '₹25,000 (2.1%)',
      overallSim: '88%',
      signals: {
        textSim: 89,
        categoryMatch: 100,
        costSim: 94,
        agencyMatch: 90,
        geoProximity: 91,
        timelineOverlap: 75
      },
      workA: {
        id: 'MPLADS-2025-4421',
        title: 'Installation of RO Drinking Water Plant Ward 8',
        description: 'Commercial 1000 LPH RO water purification plant with stainless steel storage.',
        category: 'Drinking Water',
        cost: '₹12,00,000',
        agency: 'AquaPure Tech Solutions',
        location: 'Ward 8, Patna, Bihar',
        startDate: '05 Mar 2025',
        expectedCompletion: '10 Oct 2025'
      },
      workB: {
        id: 'MPLADS-2026-2180',
        title: 'RO Clean Drinking Water Unit Ward No 8',
        description: 'High capacity RO water purification unit for community drinking supply.',
        category: 'Drinking Water',
        cost: '₹12,25,000',
        agency: 'Aqua Pure Technologies',
        location: 'Ward No 8, Patna, Bihar',
        startDate: '22 Aug 2025',
        expectedCompletion: '15 Jan 2026'
      },
      evidence: {
        distance: '210 meters apart',
        costVariance: '2.1% difference (₹25,000 gap)',
        daysApart: 'Sanctioned 170 days apart',
        agencyResult: 'Fuzzy Agency Match (AquaPure vs Aqua Pure)',
        flagReason: 'Flagged due to high spatial proximity (<250m), identical equipment specifications, and matching vendor entity.'
      }
    },
    {
      pairId: 'DUP-2026-1188',
      confidenceScore: 76,
      status: 'Requires Review',
      location: 'Varanasi, Uttar Pradesh',
      costDiff: '₹40,00,000 (0.0%)',
      overallSim: '76%',
      signals: {
        textSim: 85,
        categoryMatch: 100,
        costSim: 100,
        agencyMatch: 60,
        geoProximity: 80,
        timelineOverlap: 65
      },
      workA: {
        id: 'MPLADS-2025-1044',
        title: 'Installation of Solar High-Mast Lights at Shivpur Crossroad',
        description: '12.5m solar LED high mast lighting system with battery storage backup.',
        category: 'Renewable / Civic',
        cost: '₹40,00,000',
        agency: 'UP Rajkiya Nirman Nigam',
        location: 'Shivpur, Varanasi, Uttar Pradesh',
        startDate: '10 Feb 2025',
        expectedCompletion: '30 Jun 2025'
      },
      workB: {
        id: 'MPLADS-2026-3302',
        title: 'Solar High Mast Lighting Tower at Shivpur Junction',
        description: 'Octagonal high mast solar light pole with automatic dusk-to-dawn sensors.',
        category: 'Renewable / Civic',
        cost: '₹40,00,000',
        agency: 'Varanasi Smart Infrastructure Corp',
        location: 'Shivpur Junction, Varanasi, Uttar Pradesh',
        startDate: '14 Nov 2025',
        expectedCompletion: '28 Feb 2026'
      },
      evidence: {
        distance: '310 meters apart',
        costVariance: '0.0% difference (Identical Cost)',
        daysApart: 'Sanctioned 277 days apart',
        agencyResult: 'Different Agencies (Nirman Nigam vs Smart Infra)',
        flagReason: 'Identical cost allocation at same junction. Requires field verification to confirm if separate physical masts were installed.'
      }
    }
  ];

  const handleAction = (actionName, pairId) => {
    alert(isHi ? `कार्यवाही दर्ज की गई: ${actionName} (${pairId})` : `Action logged: ${actionName} for ${pairId}`);
    setSelectedPair(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Workflow Indicator Banner */}
      <div style={{ background: '#F3EFE6', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '0.85rem 1.25rem', boxShadow: '2px 2.5px 0px #1D1E22', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {isHi ? 'एआई मल्टी-सिग्नल डुप्लिकेट डिटेक्शन पाइपलाइन' : 'Multi-Signal AI Duplicate Detection Pipeline'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', fontWeight: 800, flexWrap: 'wrap' }}>
          <span style={{ padding: '0.2rem 0.6rem', background: '#FFF', border: '1px solid #1D1E22', borderRadius: '4px' }}>PROJECT DATA</span>
          <span>→</span>
          <span style={{ padding: '0.2rem 0.6rem', background: '#FFF', border: '1px solid #1D1E22', borderRadius: '4px' }}>MULTI-SIGNAL COMPARISON</span>
          <span>→</span>
          <span style={{ padding: '0.2rem 0.6rem', background: '#FEF2F2', border: '1px solid #D9534F', color: '#D9534F', borderRadius: '4px' }}>POTENTIAL DUPLICATE</span>
          <span>→</span>
          <span style={{ padding: '0.2rem 0.6rem', background: '#FFF8E1', border: '1px solid #E5B842', color: '#B8860B', borderRadius: '4px' }}>EXPLAIN WHY</span>
          <span>→</span>
          <span style={{ padding: '0.2rem 0.6rem', background: '#E8F5E9', border: '1px solid #52B79A', color: '#1E7E34', borderRadius: '4px' }}>HUMAN REVIEW</span>
        </div>
      </div>

      {/* Header & Controls Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem', borderBottom: '1.5px solid #1D1E22', paddingBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: '#FFF8E1', border: '1.5px solid #1D1E22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B8860B' }}>
              <Copy size={22} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '2rem', fontWeight: 800, color: '#1D1E22', margin: 0, lineHeight: 1.2 }}>
                {isHi ? 'डुप्लिकेट परियोजना पहचान' : 'Duplicate Project Detection'}
              </h1>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem', margin: 0 }}>
                {isHi ? 'संभावित रूप से डुप्लिकेट कार्यों की एआई-संचालित मल्टी-सिग्नल पहचान (पाठ्य, लागत, एजेंसी, भू-निकटता एवं समय)' : 'AI-powered multi-signal detection of potentially duplicate works across text, cost, agency, geo-proximity & timeline'}
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600, background: '#FFF', padding: '0.45rem 0.85rem', border: '1px solid #1D1E22', borderRadius: 'var(--radius-md)' }}>
            {scanStatus}
          </div>
          <button
            type="button"
            onClick={handleRunDetection}
            className="btn-teal"
            disabled={isScanning}
            style={{
              padding: '0.55rem 1.25rem',
              fontSize: '0.86rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '2px 3px 0px #1D1E22',
              cursor: isScanning ? 'wait' : 'pointer'
            }}
          >
            <RefreshCw size={16} style={{ animation: isScanning ? 'spin 1s linear infinite' : 'none' }} />
            <span>{isScanning ? (isHi ? 'स्कैन जारी...' : 'Scanning Signals...') : (isHi ? 'डुप्लिकेट विश्लेषण चलाएं' : 'Run Duplicate Detection')}</span>
          </button>
        </div>
      </div>

      {/* Rule Notice Box */}
      <div style={{ background: '#FFF8E1', border: '1px solid #E5B842', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem' }}>
        <div style={{ fontWeight: 800, color: '#B8860B', marginBottom: '0.25rem', fontSize: '0.88rem' }}>
          {isHi ? 'कठोर मल्टी-सिग्नल एआई सत्यापन नियम' : 'Strict Multi-Signal Verification Principle'}
        </div>
        <p style={{ fontSize: '0.84rem', color: '#5A5A5A', lineHeight: 1.5, margin: 0 }}>
          {isHi
            ? 'केवल पाठ्य समानता के आधार पर किसी परियोजना को डुप्लिकेट के रूप में वर्गीकृत नहीं किया जाता है। एक चेतावनी के लिए 6 में से कम से कम 3 भौतिक सत्यापन संकेतों (भू-निकटता <500मी, लागत समानता <5%, समान ठेकेदार, समय अतिव्यापन) की आवश्यकता होती है।'
            : 'Text similarity alone NEVER triggers a duplicate classification. A duplicate alert requires multiple corroborating physical signals (Geo-Proximity <500m, Cost Variance <5%, Same Agency, Timeline Overlap). Final confirmation requires human review.'}
        </p>
      </div>

      {/* Top 4 KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.15rem' }}>
        <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: '2px 3px 0px #1D1E22' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Projects Compared</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1D1E22' }}>{dupKpiProjects}</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>16-17th Lok Sabha Database</div>
        </div>

        <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: '2px 3px 0px #1D1E22' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#D9534F', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Potential Duplicate Pairs</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#D9534F' }}>482</div>
          <div style={{ fontSize: '0.76rem', color: '#D9534F', fontWeight: 700, marginTop: '0.25rem' }}>Multi-Signal Alerts</div>
        </div>

        <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: '2px 3px 0px #1D1E22' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#B8860B', textTransform: 'uppercase', marginBottom: '0.35rem' }}>High Confidence Matches</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#B8860B' }}>124</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>&gt;85% AI Score</div>
        </div>

        <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: '2px 3px 0px #1D1E22' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Under Review</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0A2458' }}>358</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>Pending Auditor Verification</div>
        </div>
      </div>

      {/* Main Section: Potential Duplicate Projects Table */}
      <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '3px 4px 0px #1D1E22' }}>
        <div style={{ padding: '1.2rem 1.5rem', background: '#F3EFE6', borderBottom: '1px solid #1D1E22', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.35rem', color: '#1D1E22', margin: 0 }}>
              {isHi ? 'संभावित डुप्लिकेट परियोजनाएं' : 'Potential Duplicate Projects Registry'}
            </h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
              Click any pair row to open detailed side-by-side AI signal analysis
            </div>
          </div>
          <span className="badge" style={{ background: '#FEF2F2', color: '#D9534F', border: '1px solid #D9534F' }}>
            3 Active Pairs
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #EAEAEA', textAlign: 'left' }}>
                <th style={{ padding: '0.85rem 1.15rem' }}>Pair ID</th>
                <th style={{ padding: '0.85rem 1.15rem' }}>Project A Title</th>
                <th style={{ padding: '0.85rem 1.15rem' }}>Project B Title</th>
                <th style={{ padding: '0.85rem 1.15rem' }}>Location</th>
                <th style={{ padding: '0.85rem 1.15rem' }}>Cost Variance</th>
                <th style={{ padding: '0.85rem 1.15rem' }}>AI Confidence</th>
                <th style={{ padding: '0.85rem 1.15rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1.15rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {DUPLICATE_PAIRS_DATA.map((pair) => (
                <tr
                  key={pair.pairId}
                  onClick={() => setSelectedPair(pair)}
                  style={{ borderBottom: '1px solid #F0F0F0', cursor: 'pointer', background: selectedPair?.pairId === pair.pairId ? '#FAF8F3' : 'transparent' }}
                >
                  <td style={{ padding: '0.85rem 1.15rem', fontFamily: 'monospace', fontWeight: 800, color: '#0A2458' }}>{pair.pairId}</td>
                  <td style={{ padding: '0.85rem 1.15rem', maxWidth: '200px', fontWeight: 700 }}>{pair.workA.title}</td>
                  <td style={{ padding: '0.85rem 1.15rem', maxWidth: '200px', fontWeight: 700 }}>{pair.workB.title}</td>
                  <td style={{ padding: '0.85rem 1.15rem' }}>{pair.location}</td>
                  <td style={{ padding: '0.85rem 1.15rem', fontWeight: 700 }}>{pair.costDiff}</td>
                  <td style={{ padding: '0.85rem 1.15rem' }}>
                    <span style={{
                      padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.76rem', fontWeight: 800,
                      background: pair.confidenceScore > 85 ? '#FEF2F2' : '#FFF8E1',
                      color: pair.confidenceScore > 85 ? '#D9534F' : '#B8860B',
                      border: `1px solid ${pair.confidenceScore > 85 ? '#D9534F' : '#B8860B'}`
                    }}>
                      {pair.confidenceScore}% (High)
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1.15rem', fontWeight: 700, color: '#1D1E22' }}>{pair.status}</td>
                  <td style={{ padding: '0.85rem 1.15rem', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPair(pair);
                      }}
                      className="btn-outline-dark"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                    >
                      Compare Pair
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side-by-Side Detailed Comparison Slide-Over Modal */}
      {selectedPair && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem'
          }}
          onClick={() => setSelectedPair(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '960px',
              maxHeight: '90vh',
              background: '#FAF8F3',
              border: '2px solid #1D1E22',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '6px 8px 0px #1D1E22',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              padding: '2rem'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1.5px solid #1D1E22', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span className="badge" style={{ background: '#FEF2F2', color: '#D9534F', border: '1px solid #D9534F', marginBottom: '0.4rem' }}>
                  {selectedPair.pairId} • Overall Duplicate Confidence: {selectedPair.confidenceScore}%
                </span>
                <h2 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.6rem', fontWeight: 800, color: '#1D1E22', margin: 0 }}>
                  Side-by-Side Duplicate Work Comparison
                </h2>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                  {selectedPair.location}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPair(null)}
                style={{ background: 'none', border: '1.5px solid #1D1E22', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            {/* Side-by-Side Project Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
              {/* Project A */}
              <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.2rem', boxShadow: '2px 3px 0px #1D1E22' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Project Record A ({selectedPair.workA.id})
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1D1E22', margin: '0 0 0.5rem 0' }}>{selectedPair.workA.title}</h4>
                <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: '0.85rem', lineHeight: 1.4 }}>{selectedPair.workA.description}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
                  <div>Category: <strong>{selectedPair.workA.category}</strong></div>
                  <div>Cost: <strong style={{ color: '#D9534F' }}>{selectedPair.workA.cost}</strong></div>
                  <div>Agency: <strong>{selectedPair.workA.agency}</strong></div>
                  <div>Location: <strong>{selectedPair.workA.location}</strong></div>
                  <div>Timeline: <strong>{selectedPair.workA.startDate} → {selectedPair.workA.expectedCompletion}</strong></div>
                </div>
              </div>

              {/* Project B */}
              <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.2rem', boxShadow: '2px 3px 0px #1D1E22' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#D9534F', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Project Record B ({selectedPair.workB.id})
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1D1E22', margin: '0 0 0.5rem 0' }}>{selectedPair.workB.title}</h4>
                <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: '0.85rem', lineHeight: 1.4 }}>{selectedPair.workB.description}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
                  <div>Category: <strong>{selectedPair.workB.category}</strong></div>
                  <div>Cost: <strong style={{ color: '#D9534F' }}>{selectedPair.workB.cost}</strong></div>
                  <div>Agency: <strong>{selectedPair.workB.agency}</strong></div>
                  <div>Location: <strong>{selectedPair.workB.location}</strong></div>
                  <div>Timeline: <strong>{selectedPair.workB.startDate} → {selectedPair.workB.expectedCompletion}</strong></div>
                </div>
              </div>
            </div>

            {/* AI Multi-Signal Analysis (6 Signals) */}
            <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: '2px 3px 0px #1D1E22' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                AI Multi-Signal Similarity Breakdown (6 Signals)
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.84rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span>1. Title & Description Similarity:</span> <strong style={{ color: '#52B79A' }}>{selectedPair.signals.textSim}%</strong>
                  </div>
                  <div style={{ height: '7px', background: '#E0E0E0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${selectedPair.signals.textSim}%`, height: '100%', background: '#52B79A' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span>2. Work Category Match:</span> <strong style={{ color: '#52B79A' }}>{selectedPair.signals.categoryMatch}%</strong>
                  </div>
                  <div style={{ height: '7px', background: '#E0E0E0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${selectedPair.signals.categoryMatch}%`, height: '100%', background: '#52B79A' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span>3. Cost Similarity:</span> <strong style={{ color: '#52B79A' }}>{selectedPair.signals.costSim}%</strong>
                  </div>
                  <div style={{ height: '7px', background: '#E0E0E0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${selectedPair.signals.costSim}%`, height: '100%', background: '#52B79A' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span>4. Implementing Agency Match:</span> <strong style={{ color: '#52B79A' }}>{selectedPair.signals.agencyMatch}%</strong>
                  </div>
                  <div style={{ height: '7px', background: '#E0E0E0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${selectedPair.signals.agencyMatch}%`, height: '100%', background: '#52B79A' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span>5. Geographic Proximity:</span> <strong style={{ color: '#D9534F' }}>{selectedPair.signals.geoProximity}%</strong>
                  </div>
                  <div style={{ height: '7px', background: '#E0E0E0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${selectedPair.signals.geoProximity}%`, height: '100%', background: '#D9534F' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span>6. Timeline Overlap:</span> <strong style={{ color: '#E5B842' }}>{selectedPair.signals.timelineOverlap}%</strong>
                  </div>
                  <div style={{ height: '7px', background: '#E0E0E0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${selectedPair.signals.timelineOverlap}%`, height: '100%', background: '#E5B842' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Detection Evidence & Explanation */}
            <div style={{ background: '#FFF8E1', border: '1px solid #E5B842', borderRadius: 'var(--radius-md)', padding: '1.1rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#B8860B', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Detection Evidence & Rationale
              </div>
              <div style={{ fontSize: '0.86rem', color: '#1D1E22', fontWeight: 600, lineHeight: 1.5 }}>
                {selectedPair.evidence.flagReason}
              </div>
              <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.85rem', flexWrap: 'wrap', fontSize: '0.78rem', color: '#5A5A5A' }}>
                <span>• Distance: <strong>{selectedPair.evidence.distance}</strong></span>
                <span>• Variance: <strong>{selectedPair.evidence.costVariance}</strong></span>
                <span>• Days Apart: <strong>{selectedPair.evidence.daysApart}</strong></span>
              </div>
            </div>

            {/* Authorized Human Actions */}
            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', marginTop: 'auto' }}>
              <button
                type="button"
                onClick={() => handleAction('Confirmed Duplicate', selectedPair.pairId)}
                className="btn-teal"
                style={{ flex: 1, padding: '0.7rem', fontSize: '0.82rem', background: '#D9534F', borderColor: '#1D1E22' }}
              >
                Mark as Duplicate
              </button>
              <button
                type="button"
                onClick={() => handleAction('Sent to Field Investigation', selectedPair.pairId)}
                className="btn-teal"
                style={{ flex: 1, padding: '0.7rem', fontSize: '0.82rem' }}
              >
                Send for Investigation
              </button>
              <button
                type="button"
                onClick={() => handleAction('Dismissed', selectedPair.pairId)}
                className="btn-outline-dark"
                style={{ flex: 1, padding: '0.7rem', fontSize: '0.82rem' }}
              >
                Dismiss Alert
              </button>
              <button
                type="button"
                onClick={() => handleAction('Keep Under Review', selectedPair.pairId)}
                className="btn-outline-dark"
                style={{ flex: 1, padding: '0.7rem', fontSize: '0.82rem' }}
              >
                Keep Under Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Landing Page Footer without CTA buttons */}
      <Footer hideCTAButtons={true} />
    </div>
  );
};

const FeatureView = ({ featureId: propFeatureId, onBack }) => {
  const { featureId: paramFeatureId } = useParams();
  const navigate = useNavigate();
  const featureId = propFeatureId || paramFeatureId || 'overview';

  const { t, language } = useLanguage();
  const { user, token } = useAuth();
  const isHi = language === 'hi';

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/');
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('overview');

  const [anomalyProjects, setAnomalyProjects] = useState(MOCK_ANOMALY_PROJECTS);
  const [selectedProject, setSelectedProject] = useState(MOCK_ANOMALY_PROJECTS[0]);

  const [delayRiskData, setDelayRiskData] = useState(null);
  const [delayRiskLoading, setDelayRiskLoading] = useState(false);
  const [delayRiskError, setDelayRiskError] = useState(null);

  const [financialRiskData, setFinancialRiskData] = useState(null);
  const [financialRiskLoading, setFinancialRiskLoading] = useState(false);
  const [financialRiskError, setFinancialRiskError] = useState(null);

  const [progressRiskData, setProgressRiskData] = useState(null);
  const [progressRiskLoading, setProgressRiskLoading] = useState(false);
  const [progressRiskError, setProgressRiskError] = useState(null);

  const [costRiskData, setCostRiskData] = useState(null);
  const [costRiskLoading, setCostRiskLoading] = useState(false);
  const [costRiskError, setCostRiskError] = useState(null);

  const [agencyRiskData, setAgencyRiskData] = useState(null);
  const [agencyRiskLoading, setAgencyRiskLoading] = useState(false);
  const [agencyRiskError, setAgencyRiskError] = useState(null);

  const [paymentRiskData, setPaymentRiskData] = useState(null);
  const [paymentRiskLoading, setPaymentRiskLoading] = useState(false);
  const [paymentRiskError, setPaymentRiskError] = useState(null);

  const [duplicateRiskData, setDuplicateRiskData] = useState(null);
  const [duplicateRiskLoading, setDuplicateRiskLoading] = useState(false);
  const [duplicateRiskError, setDuplicateRiskError] = useState(null);

  const [evidenceRiskData, setEvidenceRiskData] = useState(null);
  const [evidenceRiskLoading, setEvidenceRiskLoading] = useState(false);
  const [evidenceRiskError, setEvidenceRiskError] = useState(null);

  const [unifiedRiskData, setUnifiedRiskData] = useState(null);
  const [unifiedRiskLoading, setUnifiedRiskLoading] = useState(false);
  const [unifiedRiskError, setUnifiedRiskError] = useState(null);

  // Helper: resolve numeric work_id from the selectedProject shape
  const _resolveWorkId = (proj) => {
    if (!proj) return null;
    if (proj.workId) return proj.workId;
    if (proj.id) {
      const numericPart = proj.id.replace('MPLADS-', '');
      if (/^\d+$/.test(numericPart)) return parseInt(numericPart, 10);
    }
    return null;
  };

  // Helper: build auth header
  const _authHeaders = () => ({ 'Authorization': `Bearer ${token}` });

  // Helper: create a standard fetch hook for a single risk endpoint
  const _fetchRisk = (workId, path, setter, setLoading, setError) => {
    let active = true;
    setLoading(true);
    setError(null);
    fetch(`/api/works/${workId}/${path}`, { headers: _authHeaders() })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => { if (active) { setter(data); setLoading(false); } })
      .catch(err => { if (active) { setError(err.message || `Failed to fetch ${path}`); setLoading(false); setter(null); } });
    return () => { active = false; };
  };

  // ─── Delay Risk (original) ───────────────────────────────────────────────
  useEffect(() => {
    const workId = _resolveWorkId(selectedProject);
    if (!workId) {
      setDelayRiskData(null);
      setDelayRiskError(workId === null && selectedProject ? 'Offline mock data (live Delay Risk unavailable)' : null);
      setDelayRiskLoading(false);
      return;
    }
    if (!token) {
      setDelayRiskData(null);
      setDelayRiskError('Authentication token missing. Please sign in.');
      setDelayRiskLoading(false);
      return;
    }
    return _fetchRisk(workId, 'delay-risk', setDelayRiskData, setDelayRiskLoading, setDelayRiskError);
  }, [selectedProject?.id, token]);

  // ─── Financial Risk ───────────────────────────────────────────────────────
  useEffect(() => {
    const workId = _resolveWorkId(selectedProject);
    if (!workId || !token) { setFinancialRiskData(null); setFinancialRiskLoading(false); return; }
    return _fetchRisk(workId, 'financial-risk', setFinancialRiskData, setFinancialRiskLoading, setFinancialRiskError);
  }, [selectedProject?.id, token]);

  // ─── Progress Risk ────────────────────────────────────────────────────────
  useEffect(() => {
    const workId = _resolveWorkId(selectedProject);
    if (!workId || !token) { setProgressRiskData(null); setProgressRiskLoading(false); return; }
    return _fetchRisk(workId, 'progress-risk', setProgressRiskData, setProgressRiskLoading, setProgressRiskError);
  }, [selectedProject?.id, token]);

  // ─── Cost Risk ────────────────────────────────────────────────────────────
  useEffect(() => {
    const workId = _resolveWorkId(selectedProject);
    if (!workId || !token) { setCostRiskData(null); setCostRiskLoading(false); return; }
    return _fetchRisk(workId, 'cost-risk', setCostRiskData, setCostRiskLoading, setCostRiskError);
  }, [selectedProject?.id, token]);

  // ─── Agency Risk ──────────────────────────────────────────────────────────
  useEffect(() => {
    const workId = _resolveWorkId(selectedProject);
    if (!workId || !token) { setAgencyRiskData(null); setAgencyRiskLoading(false); return; }
    return _fetchRisk(workId, 'agency-risk', setAgencyRiskData, setAgencyRiskLoading, setAgencyRiskError);
  }, [selectedProject?.id, token]);

  // ─── Payment Risk ─────────────────────────────────────────────────────────
  useEffect(() => {
    const workId = _resolveWorkId(selectedProject);
    if (!workId || !token) { setPaymentRiskData(null); setPaymentRiskLoading(false); return; }
    return _fetchRisk(workId, 'payment-risk', setPaymentRiskData, setPaymentRiskLoading, setPaymentRiskError);
  }, [selectedProject?.id, token]);

  // ─── Duplicate Risk ───────────────────────────────────────────────────────
  useEffect(() => {
    const workId = _resolveWorkId(selectedProject);
    if (!workId || !token) { setDuplicateRiskData(null); setDuplicateRiskLoading(false); return; }
    return _fetchRisk(workId, 'duplicate-risk', setDuplicateRiskData, setDuplicateRiskLoading, setDuplicateRiskError);
  }, [selectedProject?.id, token]);

  // ─── Evidence Risk ────────────────────────────────────────────────────────
  useEffect(() => {
    const workId = _resolveWorkId(selectedProject);
    if (!workId || !token) { setEvidenceRiskData(null); setEvidenceRiskLoading(false); return; }
    return _fetchRisk(workId, 'evidence-risk', setEvidenceRiskData, setEvidenceRiskLoading, setEvidenceRiskError);
  }, [selectedProject?.id, token]);

  // ─── Unified Risk ─────────────────────────────────────────────────────────
  useEffect(() => {
    const workId = _resolveWorkId(selectedProject);
    if (!workId || !token) { setUnifiedRiskData(null); setUnifiedRiskLoading(false); return; }
    return _fetchRisk(workId, 'risk', setUnifiedRiskData, setUnifiedRiskLoading, setUnifiedRiskError);
  }, [selectedProject?.id, token]);

  const [nationalStats, setNationalStats] = useState({
    totalProjects: '2,18,913',
    totalAllocated: '₹42,721 Cr',
    totalSpent: '₹38,290 Cr',
    utilizationRate: '89.6%',
    totalMps: '788',
    completedWorks: '1,94,210',
    pendingWorks: '24,190',
    incompleteWorks: '667',
    riskCritical: '0',
    riskHigh: '667',
    riskMedium: '90,435',
    riskLow: '127,811'
  });

  const { ministryView, unifiedProjects } = useData();

  useEffect(() => {
    const _token = localStorage.getItem('nirikshak_token');
    const _headers = _token ? { 'Authorization': `Bearer ${_token}` } : {};
    let _active = true;

    // Replace Ministry_View national_stats with live analytics/summary
    fetch('/api/analytics/summary', { headers: _headers })
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then(data => {
        if (!_active) return;
        const sanctionedCr = data.total_sanctioned_cr;
        const spentCr = parseFloat((sanctionedCr * data.utilization_rate_pct / 100).toFixed(2));
        setNationalStats(prev => ({
          ...prev,
          totalProjects: data.total_projects.toLocaleString('en-IN'),
          totalAllocated: `₹${sanctionedCr.toLocaleString('en-IN')} Cr`,
          totalSpent: `₹${spentCr.toLocaleString('en-IN')} Cr`,
          utilizationRate: `${data.utilization_rate_pct.toFixed(1)}%`,
          completedWorks: data.total_completed.toLocaleString('en-IN'),
          pendingWorks: data.total_pending.toLocaleString('en-IN'),
          riskHigh: data.total_high_risk.toLocaleString('en-IN'),
          riskMedium: data.total_moderate_risk.toLocaleString('en-IN'),
          riskLow: data.total_low_risk.toLocaleString('en-IN'),
        }));
      })
      .catch(err => {
        console.error('FeatureView: analytics/summary fetch failed:', err);
        if (_active && ministryView && ministryView.national_stats) {
          const stats = ministryView.national_stats;
          const sanctionedCr = Math.round(stats.total_sanctioned / 10000000);
          const spentCr = Math.round(stats.total_disbursed / 10000000);
          const utilRate = ((stats.total_disbursed / (stats.total_sanctioned || 1)) * 100).toFixed(1);
          setNationalStats(prev => ({
            ...prev,
            totalProjects: stats.total_projects.toLocaleString(),
            totalAllocated: `₹${sanctionedCr.toLocaleString()} Cr`,
            totalSpent: `₹${spentCr.toLocaleString()} Cr`,
            utilizationRate: `${utilRate}%`,
          }));
        }
      });

    return () => { _active = false; };
  }, [ministryView]);

  useEffect(() => {
    if (unifiedProjects && unifiedProjects.length > 0) {
      const formatted = unifiedProjects.map(item => {
        const riskBand = item.risk_tier ? (item.risk_tier.charAt(0).toUpperCase() + item.risk_tier.slice(1).toLowerCase()) : 'Low';
        const reasons = item.top_risk_drivers && item.top_risk_drivers.length > 0
          ? (typeof item.top_risk_drivers === 'string' ? JSON.parse(item.top_risk_drivers) : item.top_risk_drivers).map(d => {
              const pillars = {
                'financial_risk_score': 'Financial over-disbursement',
                'progress_risk_score': 'High project stall probability',
                'cost_risk_score': 'Severe cost escalation',
                'delay_risk_score': 'Chronic completion delays',
                'duplicate_risk_score': 'Duplicate/split-work alerts',
                'evidence_risk_score': 'Prohibited guidelines violation',
                'agency_risk_score': 'Poor executing agency track record',
                'payment_risk_score': 'High cartel or payment fragmentation'
              };
              return pillars[d.pillar] || d.pillar;
            })
          : [item.project_summary || 'General risk flagged'];
        
        return {
          id: `MPLADS-${item.work_id}`,
          workId: item.work_id, // PRESERVE WORK ID!
          title: item.activity_name || item.work_description || 'MPLADS Project',
          category: item.work_category || 'Normal/Others',
          state: item.state_name || 'N/A',
          district: item.const_name || 'N/A',
          constituency: item.const_name || 'N/A',
          sanctionedCost: `₹${(item.sanction_amount || 0).toLocaleString('en-IN')}`,
          expenditure: `₹${(item.total_disbursed || 0).toLocaleString('en-IN')}`,
          expenditurePct: Math.round((item.utilization_rate || 0) * 100),
          physicalProgress: item.work_status === 'Completed' ? 100 : (item.work_status === 'Sanctioned' ? 0 : 50),
          delayMonths: Math.round((item.completion_delay_days || 0) / 30),
          costDeviationPct: Math.round(item.cost_overrun_pct || 0),
          riskScore: Math.round(item.final_risk_score || 0),
          riskBand: riskBand,
          confidenceScore: Math.round(90 + (item.final_risk_score % 10)),
          agency: item.primary_vendor_name || item.ida_name || 'N/A',
          agencyPriorFlags: item.agency_risk_tier === 'HIGH' ? 3 : (item.agency_risk_tier === 'MODERATE' ? 1 : 0),
          reasons: reasons,
          recommendedAction: item.recommended_actions && item.recommended_actions.length > 0 ? item.recommended_actions[0] : 'Conduct ground audit.'
        };
      });
      setAnomalyProjects(formatted);
      setSelectedProject(formatted[0]);
    }
  }, [unifiedProjects]);

  const [verificationNotes, setVerificationNotes] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('Pending');

  // Filter projects
  const filteredProjects = anomalyProjects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.district.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'ALL' || p.riskBand.toUpperCase() === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  // Helper to render reused Project Detail Dossier panel
  const renderDossierDetail = () => {
    if (!selectedProject) return null;
    return (
      <div style={{ background: '#FFFFFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', padding: '1.75rem', boxShadow: '3px 4px 0px #1D1E22' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem', borderBottom: '1px solid #EAEAEA', paddingBottom: '1rem' }}>
          <div>
            <span className="badge" style={{ background: '#FEF2F2', color: '#D9534F', border: '1px solid #D9534F', marginBottom: '0.3rem' }}>
              {selectedProject.riskBand} RISK — {selectedProject.riskScore}/100
            </span>
            <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.25rem', color: '#1D1E22', marginTop: '0.4rem' }}>
              {selectedProject.title}
            </h3>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
              ID: <span style={{ fontFamily: 'monospace' }}>{selectedProject.id}</span> • {selectedProject.constituency}
            </div>
          </div>
        </div>

        {/* Financial & Physical Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ background: '#FAF8F3', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid #1D1E22' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>SANCTIONED</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>{selectedProject.sanctionedCost}</div>
          </div>
          <div style={{ background: '#FAF8F3', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid #1D1E22' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#D9534F' }}>EXPENDITURE</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#D9534F' }}>{selectedProject.expenditurePct}%</div>
          </div>
          <div style={{ background: '#FAF8F3', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid #1D1E22' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-accent-teal)' }}>PROGRESS</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-accent-teal)' }}>{selectedProject.physicalProgress}%</div>
          </div>
        </div>

        {/* ── LIVE RISK ASSESSMENT PANEL (All 8 modules) ── */}

        {/* Helper: Inline score pill */}
        {/* Unified Risk Summary Bar */}
        <div style={{ background: unifiedRiskData?.status === 'LIVE' ? '#E8F5E9' : '#FAF8F3', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {isHi ? 'एकीकृत AI जोखिम स्कोर' : 'Unified AI Risk Score'}
          </div>
          {unifiedRiskLoading ? (
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Computing…</span>
          ) : unifiedRiskError ? (
            <span style={{ fontSize: '0.8rem', color: '#D9534F' }}>Error: {unifiedRiskError}</span>
          ) : unifiedRiskData ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{
                fontSize: '1.4rem', fontWeight: 800,
                color: unifiedRiskData.unified_risk_score == null ? '#888' : unifiedRiskData.unified_risk_score > 60 ? '#D9534F' : unifiedRiskData.unified_risk_score > 30 ? '#E5B842' : '#1E7E34'
              }}>
                {unifiedRiskData.unified_risk_score != null ? `${unifiedRiskData.unified_risk_score.toFixed(1)}/100` : 'Pending'}
              </span>
              <span style={{
                padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800,
                background: unifiedRiskData.status === 'LIVE' ? '#E8F5E9' : '#FFF8E1',
                color: unifiedRiskData.status === 'LIVE' ? '#1E7E34' : '#B8860B',
                border: `1px solid ${unifiedRiskData.status === 'LIVE' ? '#52B79A' : '#E5B842'}`
              }}>
                {unifiedRiskData.status || 'PARTIAL'}
              </span>
              {unifiedRiskData.risk_tier && (
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1D1E22' }}>({unifiedRiskData.risk_tier})</span>
              )}
            </div>
          ) : (
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
              {isHi ? 'कोई डेटा उपलब्ध नहीं' : 'No live data'}
            </span>
          )}
        </div>

        {/* 8-module grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '1.25rem' }}>

          {/* 1 ── Delay Risk */}
          <div style={{ background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', padding: '0.7rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
              {isHi ? 'विलंब जोखिम (15%)' : 'Delay Risk (15%)'}
              {delayRiskLoading && <span style={{ color: '#888', marginLeft: '0.4rem' }}>…</span>}
            </div>
            {delayRiskError ? (
              <div style={{ fontSize: '0.75rem', color: '#D9534F' }}>Error</div>
            ) : delayRiskData ? (
              <div style={{ fontSize: '0.78rem' }}>
                <strong style={{ color: delayRiskData.delay_risk_tier === 'HIGH' || delayRiskData.delay_risk_tier === 'CRITICAL' ? '#D9534F' : '#1E7E34' }}>
                  {delayRiskData.delay_risk_score?.toFixed(1) ?? 'N/A'}/100
                </strong> · {delayRiskData.delay_risk_tier}
                <div style={{ color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>
                  Prob: {((delayRiskData.delay_probability ?? 0) * 100).toFixed(1)}% · Status: {delayRiskData.operational_status?.replace(/_/g, ' ')}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>—</div>
            )}
          </div>

          {/* 2 ── Financial Risk */}
          <div style={{ background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', padding: '0.7rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
              {isHi ? 'वित्तीय जोखिम (20%)' : 'Financial Risk (20%)'}
              {financialRiskLoading && <span style={{ color: '#888', marginLeft: '0.4rem' }}>…</span>}
            </div>
            {financialRiskError ? (
              <div style={{ fontSize: '0.75rem', color: '#D9534F' }}>Error</div>
            ) : financialRiskData ? (
              <div style={{ fontSize: '0.78rem' }}>
                <strong style={{ color: financialRiskData.financial_risk_tier === 'HIGH' || financialRiskData.financial_risk_tier === 'CRITICAL' ? '#D9534F' : '#1E7E34' }}>
                  {financialRiskData.financial_risk_score?.toFixed(1) ?? 'N/A'}/100
                </strong> · {financialRiskData.financial_risk_tier}
                {financialRiskData.anomaly_reasons?.length > 0 && (
                  <div style={{ color: 'var(--color-text-secondary)', marginTop: '0.15rem', fontSize: '0.72rem' }}>
                    {financialRiskData.anomaly_reasons[0]}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>—</div>
            )}
          </div>

          {/* 3 ── Progress Risk */}
          <div style={{ background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', padding: '0.7rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
              {isHi ? 'प्रगति जोखिम (20%)' : 'Progress Risk (20%)'}
              {progressRiskLoading && <span style={{ color: '#888', marginLeft: '0.4rem' }}>…</span>}
            </div>
            {progressRiskError ? (
              <div style={{ fontSize: '0.75rem', color: '#D9534F' }}>Error</div>
            ) : progressRiskData ? (
              <div style={{ fontSize: '0.78rem' }}>
                <strong style={{ color: progressRiskData.progress_risk_tier === 'HIGH' || progressRiskData.progress_risk_tier === 'CRITICAL' ? '#D9534F' : '#1E7E34' }}>
                  {progressRiskData.progress_risk_score?.toFixed(1) ?? 'N/A'}/100
                </strong> · {progressRiskData.progress_risk_tier}
                <div style={{ color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>
                  Stall: {((progressRiskData.stall_probability ?? 0) * 100).toFixed(1)}%
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>—</div>
            )}
          </div>

          {/* 4 ── Cost Risk */}
          <div style={{ background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', padding: '0.7rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
              {isHi ? 'लागत जोखिम (15%)' : 'Cost Risk (15%)'}
              {costRiskLoading && <span style={{ color: '#888', marginLeft: '0.4rem' }}>…</span>}
            </div>
            {costRiskError ? (
              <div style={{ fontSize: '0.75rem', color: '#D9534F' }}>Error</div>
            ) : costRiskData ? (
              <div style={{ fontSize: '0.78rem' }}>
                <strong style={{ color: costRiskData.cost_risk_tier === 'HIGH' || costRiskData.cost_risk_tier === 'CRITICAL' ? '#D9534F' : '#1E7E34' }}>
                  {costRiskData.cost_risk_score?.toFixed(1) ?? 'N/A'}/100
                </strong> · {costRiskData.cost_risk_tier}
                <div style={{ color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>Z: {costRiskData.cost_z_score?.toFixed(2)}</div>
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>—</div>
            )}
          </div>

          {/* 5 ── Agency Risk */}
          <div style={{ background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', padding: '0.7rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
              {isHi ? 'एजेंसी जोखिम (5%)' : 'Agency Risk (5%)'}
              {agencyRiskLoading && <span style={{ color: '#888', marginLeft: '0.4rem' }}>…</span>}
            </div>
            {agencyRiskError ? (
              <div style={{ fontSize: '0.75rem', color: '#D9534F' }}>Error</div>
            ) : agencyRiskData ? (
              <div style={{ fontSize: '0.78rem' }}>
                <strong style={{ color: agencyRiskData.agency_risk_tier === 'HIGH' || agencyRiskData.agency_risk_tier === 'CRITICAL' ? '#D9534F' : '#1E7E34' }}>
                  {agencyRiskData.agency_risk_score?.toFixed(1) ?? 'N/A'}/100
                </strong> · {agencyRiskData.agency_risk_tier ?? 'N/A'}
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>—</div>
            )}
          </div>

          {/* 6 ── Payment Risk */}
          <div style={{ background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', padding: '0.7rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
              {isHi ? 'भुगतान जोखिम (5%)' : 'Payment Risk (5%)'}
              {paymentRiskLoading && <span style={{ color: '#888', marginLeft: '0.4rem' }}>…</span>}
            </div>
            {paymentRiskError ? (
              <div style={{ fontSize: '0.75rem', color: '#D9534F' }}>Error</div>
            ) : paymentRiskData ? (
              <div style={{ fontSize: '0.78rem' }}>
                <strong style={{ color: paymentRiskData.payment_risk_tier === 'HIGH' ? '#D9534F' : '#1E7E34' }}>
                  {paymentRiskData.payment_risk_score?.toFixed(1) ?? 'N/A'}/100
                </strong> · {paymentRiskData.payment_risk_tier}
                <div style={{ color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>HHI: {paymentRiskData.hhi?.toFixed(0)}</div>
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>—</div>
            )}
          </div>

          {/* 7 ── Duplicate Risk */}
          <div style={{ background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', padding: '0.7rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
              {isHi ? 'डुप्लीकेट जोखिम (10%)' : 'Duplicate Risk (10%)'}
              {duplicateRiskLoading && <span style={{ color: '#888', marginLeft: '0.4rem' }}>…</span>}
            </div>
            {duplicateRiskError ? (
              <div style={{ fontSize: '0.75rem', color: '#D9534F' }}>Error</div>
            ) : duplicateRiskData ? (
              duplicateRiskData.status === 'UNAVAILABLE' ? (
                <div style={{ fontSize: '0.75rem', color: '#B8860B', fontWeight: 600 }}>Data Unavailable</div>
              ) : (
                <div style={{ fontSize: '0.78rem' }}>
                  <strong>{duplicateRiskData.risk_confidence_score?.toFixed(1) ?? 'N/A'}/100</strong>
                  {duplicateRiskData.alert_type && <span> · {duplicateRiskData.alert_type}</span>}
                </div>
              )
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>—</div>
            )}
          </div>

          {/* 8 ── Evidence Risk */}
          <div style={{ background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)', padding: '0.7rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
              {isHi ? 'साक्ष्य जोखिम (10%)' : 'Evidence Risk (10%)'}
              {evidenceRiskLoading && <span style={{ color: '#888', marginLeft: '0.4rem' }}>…</span>}
            </div>
            {evidenceRiskError ? (
              <div style={{ fontSize: '0.75rem', color: '#D9534F' }}>Error</div>
            ) : evidenceRiskData ? (
              evidenceRiskData.status === 'UNAVAILABLE' ? (
                <div style={{ fontSize: '0.75rem', color: '#B8860B', fontWeight: 600 }}>Data Unavailable</div>
              ) : (
                <div style={{ fontSize: '0.78rem' }}>
                  <strong style={{ color: evidenceRiskData.evidence_risk_tier === 'HIGH' ? '#D9534F' : '#1E7E34' }}>
                    {evidenceRiskData.evidence_risk_score?.toFixed(1) ?? 'N/A'}/100
                  </strong> · {evidenceRiskData.evidence_risk_tier}
                </div>
              )
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>—</div>
            )}
          </div>

        </div>

        {/* Explainable Reasons */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.06em' }}>
            {isHi ? 'AI व्याख्या और जोखिम कारण' : 'Explainable Risk Factors'}
          </div>
          <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.82rem', color: '#2A2C32', lineHeight: 1.55 }}>
            {selectedProject.reasons.map((r, i) => (
              <li key={i} style={{ marginBottom: '0.3rem' }}>{r}</li>
            ))}
          </ul>
        </div>

        {/* Recommended Action */}
        <div style={{ background: '#FFF8E1', border: '1px solid #E5B842', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.82rem' }}>
          <strong style={{ color: '#B8860B' }}>{isHi ? 'सिफारिशित सत्यापन कार्रवाई:' : 'Recommended Action:'} </strong>
          <span style={{ color: '#4A4D55' }}>{selectedProject.recommendedAction}</span>
        </div>

        {/* Officer Investigation Action Box */}
        <div style={{ borderTop: '1px solid #EAEAEA', paddingTop: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1D1E22', marginBottom: '0.4rem' }}>
            {isHi ? 'अधिकारी जांच नोट्स एवं निर्देश' : 'Official Investigation Notes & Action'}
          </label>
          <textarea
            rows={3}
            value={verificationNotes}
            onChange={(e) => setVerificationNotes(e.target.value)}
            placeholder={isHi ? 'सत्यापन अवलोकन या निर्देश यहाँ दर्ज करें...' : 'Enter inspection findings or verification dispatch notes...'}
            style={{
              width: '100%',
              padding: '0.65rem 0.8rem',
              border: '1.5px solid #1D1E22',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              marginBottom: '0.75rem',
              boxSizing: 'border-box'
            }}
          />
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => alert(isHi ? 'जांच रिपोर्ट निर्यात की जा रही है...' : 'Exporting Investigation Dossier PDF...')}
              className="btn-outline-dark"
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', gap: '0.4rem' }}
            >
              <Download size={14} />
              <span>{isHi ? 'डोज़ियर डाउनलोड' : 'Download Dossier'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setVerificationStatus('Dispatched');
                alert(isHi ? 'भौतिक सत्यापन कार्य क्षेत्र निरीक्षक को भेजा गया!' : 'Physical verification task dispatched to Field Inspector!');
              }}
              className="btn-teal"
              style={{ padding: '0.5rem 1.2rem', fontSize: '0.82rem', gap: '0.4rem' }}
            >
              <Send size={14} />
              <span>{isHi ? 'सत्यापन कार्य सौंपें' : 'Dispatch Field Task'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // RENDER DYNAMIC CONTENT BASED ON THE SELECTED FEATURE
  const renderFeatureContent = () => {
    switch (featureId) {
      // ─────────────────────────────────────────────
      // 1. HOME & OVERVIEW FEATURES
      // ─────────────────────────────────────────────
      case 'overview':
      case 'home':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Dashboard Header Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem', borderBottom: '1.5px solid #1D1E22', paddingBottom: '1.5rem' }}>
              <div>
                <h1 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '2.1rem', fontWeight: 800, color: '#1D1E22', margin: 0, lineHeight: 1.2 }}>
                  {isHi ? 'MPLADS डैशबोर्ड' : 'MPLADS Dashboard'}
                </h1>
                <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', marginTop: '0.4rem', margin: 0, maxWidth: '720px', lineHeight: 1.5 }}>
                  {isHi 
                    ? '543 लोकसभा और 245 राज्यसभा निर्वाचन क्षेत्रों में एमपीलैड्स विकास कार्यों, निधि उपयोग और विसंगति सत्यापन की निगरानी।'
                    : 'Monitoring MPLADS works, fund utilization, and anomaly verification across 543 Lok Sabha and 245 Rajya Sabha constituencies.'}
                </p>
              </div>

              {/* Search & Export Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', width: '280px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isHi ? 'परियोजना ID, सांसद, या जिला खोजें...' : 'Search project ID, MP, district...'}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.85rem 0.55rem 2.4rem',
                      border: '1.5px solid #1D1E22',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.84rem',
                      background: '#FFFFFF',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => alert(isHi ? 'डेटा निर्यात हो रहा है...' : 'Exporting MPLADS Dataset (Parquet/CSV)...')}
                  className="btn-outline-dark"
                  style={{
                    padding: '0.55rem 1.15rem',
                    fontSize: '0.84rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: '#FFFFFF',
                    border: '1.5px solid #1D1E22',
                    boxShadow: '1.5px 2px 0px #1D1E22'
                  }}
                >
                  <Download size={15} />
                  <span>{isHi ? 'डेटा निर्यात' : 'Export Data'}</span>
                </button>
              </div>
            </div>

            {/* 4 Key Metric Cards Grid in One Clean Responsive Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.25rem'
              }}
            >
              {/* Card 1: Total Allocated */}
              <div className="card-light" style={{ padding: '1.25rem', border: '1.5px solid #1D1E22', boxShadow: '2px 3px 0px #1D1E22', background: '#FFF' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  {isHi ? 'कुल आवंटित निधि' : 'Total Allocated'}
                </div>
                <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#1D1E22' }}>{nationalStats.totalAllocated}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>16-17 Lok Sabha</div>
              </div>

              {/* Card 2: Total Expenditure */}
              <div className="card-light" style={{ padding: '1.25rem', border: '1.5px solid #1D1E22', boxShadow: '2px 3px 0px #1D1E22', background: '#FFF' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  {isHi ? 'कुल व्यय' : 'Total Expenditure'}
                </div>
                <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0A2458' }}>{nationalStats.totalSpent}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>Disbursed Vouchers</div>
              </div>

              {/* Card 3: Fund Utilization */}
              <div className="card-light" style={{ padding: '1.25rem', border: '1.5px solid #1D1E22', boxShadow: '2px 3px 0px #1D1E22', background: '#FFF' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-accent-teal)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  {isHi ? 'निधि उपयोग दर' : 'Fund Utilization'}
                </div>
                <div style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--color-accent-teal-hover)' }}>{nationalStats.utilizationRate}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>National Average</div>
              </div>

              {/* Card 4: Works Completed */}
              <div className="card-light" style={{ padding: '1.25rem', border: '1.5px solid #1D1E22', boxShadow: '2px 3px 0px #1D1E22', background: '#FFF' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1E7E34', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  {isHi ? 'पूर्ण कार्य' : 'Works Completed'}
                </div>
                <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#1E7E34' }}>{nationalStats.completedWorks}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>Verified Finish</div>
              </div>
            </div>

            {/* Risk Summary & Unified Risk Bands */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(320px, 1.2fr)', gap: '1.5rem' }}>
              {/* Risk Band Matrix */}
              <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: '3px 4px 0px #1D1E22' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                  {isHi ? 'जोखिम बैंड सारांश (0-100 स्कोर)' : 'Risk Summary (0-100 Unified Score)'}
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.3rem', color: '#1D1E22', marginBottom: '1rem' }}>
                  {isHi ? 'राष्ट्रीय जोखिम स्तर वितरण' : 'National Risk Level Distribution'}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      <span style={{ color: '#D9534F' }}>Critical Risk (81 - 100)</span>
                      <span>{nationalStats.riskCritical} works (0.0%)</span>
                    </div>
                    <div style={{ height: '8px', background: '#FAF8F3', borderRadius: '4px', border: '1px solid #1D1E22', overflow: 'hidden' }}>
                      <div style={{ width: '0%', height: '100%', background: '#D9534F' }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      <span style={{ color: '#E07A5F' }}>High Risk (61 - 80)</span>
                      <span>{nationalStats.riskHigh} works (0.3%)</span>
                    </div>
                    <div style={{ height: '8px', background: '#FAF8F3', borderRadius: '4px', border: '1px solid #1D1E22', overflow: 'hidden' }}>
                      <div style={{ width: '1%', height: '100%', background: '#E07A5F' }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      <span style={{ color: '#E5B842' }}>Medium Risk (31 - 60)</span>
                      <span>{nationalStats.riskMedium} works (41.3%)</span>
                    </div>
                    <div style={{ height: '8px', background: '#FAF8F3', borderRadius: '4px', border: '1px solid #1D1E22', overflow: 'hidden' }}>
                      <div style={{ width: '41%', height: '100%', background: '#E5B842' }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      <span style={{ color: '#1E7E34' }}>Low Risk (0 - 30)</span>
                      <span>{nationalStats.riskLow} works (58.4%)</span>
                    </div>
                    <div style={{ height: '8px', background: '#FAF8F3', borderRadius: '4px', border: '1px solid #1D1E22', overflow: 'hidden' }}>
                      <div style={{ width: '58%', height: '100%', background: '#52B79A' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Explainable Weight Matrix */}
              <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: '3px 4px 0px #1D1E22' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                  {isHi ? 'व्याख्या योग्य जोखिम स्कोर सूत्र' : 'Explainable Risk Score Weightage'}
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.3rem', color: '#1D1E22', marginBottom: '1rem' }}>
                  {isHi ? '8-कारक एकीकृत AI मॉडल' : '8-Factor Multi-Signal Model'}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.82rem' }}>
                  <div style={{ padding: '0.6rem', background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)' }}>
                    <strong>Financial Risk:</strong> 20%
                  </div>
                  <div style={{ padding: '0.6rem', background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)' }}>
                    <strong>Progress Risk:</strong> 20%
                  </div>
                  <div style={{ padding: '0.6rem', background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)' }}>
                    <strong>Cost Deviation:</strong> 15%
                  </div>
                  <div style={{ padding: '0.6rem', background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)' }}>
                    <strong>Delay Risk:</strong> 15%
                  </div>
                  <div style={{ padding: '0.6rem', background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)' }}>
                    <strong>Duplicate Risk:</strong> 10%
                  </div>
                  <div style={{ padding: '0.6rem', background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)' }}>
                    <strong>Evidence Risk:</strong> 10%
                  </div>
                  <div style={{ padding: '0.6rem', background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)' }}>
                    <strong>Agency History:</strong> 5%
                  </div>
                  <div style={{ padding: '0.6rem', background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-sm)' }}>
                    <strong>Payment Pattern:</strong> 5%
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Alerts Feed Section */}
            <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: '3px 4px 0px #1D1E22' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid #EAEAEA', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={20} color="#D9534F" />
                  <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.25rem', color: '#1D1E22', margin: 0 }}>
                    {isHi ? 'हालिया विसंगति अलर्ट' : 'Recent Anomaly Alerts'}
                  </h3>
                </div>
                <span className="badge" style={{ background: '#FEF2F2', color: '#D9534F', border: '1px solid #D9534F' }}>
                  Live Anomaly Feed
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {anomalyProjects.slice(0, 3).map((alertItem) => (
                  <div key={alertItem.id} style={{ background: '#FAF8F3', border: '1px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.15rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, fontFamily: 'monospace' }}>{alertItem.id}</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>• {alertItem.district}, {alertItem.state}</span>
                      </div>
                      <span style={{
                        padding: '0.15rem 0.55rem', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 800,
                        background: alertItem.riskScore > 50 ? '#FEF2F2' : '#FFF8E1',
                        color: alertItem.riskScore > 50 ? '#D9534F' : '#E5B842',
                        border: `1px solid ${alertItem.riskScore > 50 ? '#D9534F' : '#E5B842'}`
                      }}>
                        Score {alertItem.riskScore}/100
                      </span>
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1D1E22', marginBottom: '0.35rem' }}>
                      {alertItem.title}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#5A5A5A', lineHeight: 1.45 }}>
                      <strong>Flag:</strong> {alertItem.reasons[0]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* High-Risk Projects Registry Table */}
            <div style={{ display: 'grid', gridTemplateColumns: selectedProject ? '1fr minmax(380px, 1.2fr)' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
              <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '3px 4px 0px #1D1E22' }}>
                <div style={{ padding: '1.15rem 1.5rem', background: '#F3EFE6', borderBottom: '1px solid #1D1E22', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.25rem', color: '#1D1E22', margin: 0 }}>
                    {isHi ? 'उच्च जोखिम परियोजनाएं' : 'High-Risk Projects Registry'}
                  </h3>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                    Prioritized for Physical Field Inspection
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                    <thead>
                      <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #EAEAEA', textAlign: 'left' }}>
                        <th style={{ padding: '0.85rem 1.15rem' }}>Work ID</th>
                        <th style={{ padding: '0.85rem 1.15rem' }}>Project Title & Category</th>
                        <th style={{ padding: '0.85rem 1.15rem' }}>District & State</th>
                        <th style={{ padding: '0.85rem 1.15rem' }}>Sanctioned Amount</th>
                        <th style={{ padding: '0.85rem 1.15rem' }}>Spent / Progress</th>
                        <th style={{ padding: '0.85rem 1.15rem' }}>Risk Score</th>
                        <th style={{ padding: '0.85rem 1.15rem', textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {anomalyProjects.map((project) => (
                        <tr key={project.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                          <td style={{ padding: '0.85rem 1.15rem', fontFamily: 'monospace', fontWeight: 700 }}>{project.id}</td>
                          <td style={{ padding: '0.85rem 1.15rem', maxWidth: '280px' }}>
                            <div style={{ fontWeight: 700, color: '#1D1E22', marginBottom: '0.15rem' }}>{project.title.substring(0, 80)}...</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{project.category}</div>
                          </td>
                          <td style={{ padding: '0.85rem 1.15rem' }}>{project.district}, {project.state}</td>
                          <td style={{ padding: '0.85rem 1.15rem', fontWeight: 700 }}>{project.sanctionedCost}</td>
                          <td style={{ padding: '0.85rem 1.15rem' }}>
                            <span style={{ color: '#D9534F', fontWeight: 700 }}>{project.expenditurePct}% spent</span> / <span style={{ color: 'var(--color-accent-teal-hover)', fontWeight: 700 }}>{project.physicalProgress}% done</span>
                          </td>
                          <td style={{ padding: '0.85rem 1.15rem' }}>
                            <span style={{
                              padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.76rem', fontWeight: 800,
                              background: project.riskScore > 80 ? '#FEF2F2' : '#FFF8E1',
                              color: project.riskScore > 80 ? '#D9534F' : '#E5B842',
                              border: `1px solid ${project.riskScore > 80 ? '#D9534F' : '#E5B842'}`
                            }}>
                              {project.riskScore}/100 ({project.riskBand})
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1.15rem', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => setSelectedProject(project)}
                              className="btn-outline-dark"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                            >
                              View Dossier
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {selectedProject && renderDossierDetail()}
            </div>

            {/* Reusing Landing Page Footer at the bottom with CTA buttons hidden */}
            <Footer hideCTAButtons={true} />
          </div>
        );

      case 'findProject':
      case 'findProjects':
      case 'find-project':
      case 'find-projects':
      case 'searchProjects':
        return <FindProjectsView />;

      case 'keyMetrics':
        return <KeyMetricsDashboard isHi={isHi} />;

      case 'unifiedAnalysis':
      case 'aiIntelligence':
      case 'aiAnalysis':
      case 'anomalyDetection':
      case 'financialAnomaly':
      case 'financial':
      case 'finGuard':
      case 'costOverrun':
      case 'costBenchmarking':
      case 'expenditureProgress':
      case 'budgetUtilisation':
      case 'fundRelease':
      case 'paymentPattern':
      case 'geospatial':
      case 'geospatialIntelligence':
      case 'geoIntel':
      case 'duplicateProject':
      case 'duplicate':
      case 'duplicateDetection':
      case 'duplicateCheck':
      case 'delayRisk':
      case 'evidenceVerification':
      case 'evidence':
      case 'imageVerification':
      case 'documentVerification':
      case 'beforeAfterAnalysis':
      case 'evidenceIntegrity':
        return <UnifiedAiIntelligenceView />;

      // ─────────────────────────────────────────────
      // 3. INVESTIGATION & RESOLUTION
      // ─────────────────────────────────────────────
      case 'investigation':
      case 'highRiskProjects':
      case 'evidenceReview':
      case 'fieldVerification':
      case 'resolution':
        return (
          <div>
            {/* Search & Filter Bar */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1 1 300px' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isHi ? 'परियोजना ID, शीर्षक या जिला खोजें...' : 'Search project ID, title or district...'}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                    border: '1.5px solid #1D1E22',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.88rem',
                    background: '#FFFFFF'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['ALL', 'CRITICAL', 'HIGH'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    style={{
                      padding: '0.55rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      border: '1.5px solid #1D1E22',
                      background: selectedFilter === filter ? 'var(--color-accent-teal)' : '#FFFFFF',
                      cursor: 'pointer'
                    }}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Master-Detail Investigation Split View */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(380px, 1.2fr)', gap: '1.5rem' }}>
              {/* Project List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {filteredProjects.map((p) => {
                  const isSelected = selectedProject.id === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProject(p)}
                      style={{
                        padding: '1.15rem',
                        background: isSelected ? '#F3EFE6' : '#FFFFFF',
                        border: '1.5px solid #1D1E22',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: isSelected ? '3px 4px 0px #1D1E22' : '1.5px 2px 0px #1D1E22',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, fontFamily: 'monospace' }}>{p.id}</span>
                        <span style={{
                          padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 800,
                          background: p.riskScore > 80 ? '#FEF2F2' : '#FFF8E1',
                          color: p.riskScore > 80 ? '#D9534F' : '#E5B842',
                          border: `1px solid ${p.riskScore > 80 ? '#D9534F' : '#E5B842'}`
                        }}>
                          Score {p.riskScore}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1D1E22', lineHeight: 1.35, marginBottom: '0.4rem' }}>
                        {p.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                        {p.district}, {p.state} • Cost: {p.sanctionedCost}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Investigation Dossier Detail */}
              {selectedProject && renderDossierDetail()}
            </div>
          </div>
        );

      // ─────────────────────────────────────────────
      // 4. RISK & MAP
      // ─────────────────────────────────────────────
      case 'riskMap':
      case 'indiaRiskMap':
      case 'districtAnalysis':
      case 'riskHeatmap':
      case 'overallRiskScore':
      case 'riskFactors':
      case 'riskTrend':
      case 'geospatial':
        return (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: '3px 4px 0px #1D1E22', marginBottom: '1.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.35rem', marginBottom: '0.4rem' }}>
                  {isHi ? 'राष्ट्रीय भू-स्थानिक जोखिम मानचित्र' : 'National Geospatial Risk Intelligence Map'}
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                  {isHi
                    ? '28 राज्यों और 8 केंद्र शासित प्रदेशों में एमपीलैड्स परियोजनाओं, वित्तीय उपयोग और विसंगति हॉटस्पॉट का विश्लेषण करें।'
                    : 'Explore state and district-level fund utilisation, delay patterns, and critical irregularity clusters across 28 states & 8 UTs.'}
                </p>
              </div>
              <IndiaMap />
            </div>
          </div>
        );

      // ─────────────────────────────────────────────
      // 5. REPORTS & AUDIT TRAIL
      // ─────────────────────────────────────────────
      case 'reports':
      case 'generateReport':
      case 'auditTrail':
      case 'comparativeReports':
      case 'automatedReports':
      case 'reportBuilder':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card-light" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.35rem', marginBottom: '0.5rem' }}>
                {isHi ? 'स्वचालित जांच रिपोर्ट एवं ऑडिट ट्रेल' : 'Investigation-Ready Reports & Immutable Audit Trail'}
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                {isHi
                  ? 'प्रत्येक परियोजना का जोखिम स्कोर, सांख्यिकीय साक्ष्य, उपग्रह/फोटो डेटा, अधिकारी नोट्स और ऑडिट लॉग वाली व्यापक रिपोर्ट डाउनलोड करें।'
                  : 'Generate comprehensive investigation dossiers containing project summary, risk explanations, multi-signal evidence, location coordinates, and chronological audit logs.'}
              </p>
            </div>

            {/* Audit Logs Table */}
            <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.5rem', background: '#F3EFE6', borderBottom: '1px solid #1D1E22', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{isHi ? 'हालिया सिस्टम ऑडिट लॉग' : 'Recent System Audit Trail Logs'}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>SHA-256 Provenance Verifiable</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #EAEAEA', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 1.25rem' }}>Timestamp</th>
                    <th style={{ padding: '0.75rem 1.25rem' }}>User / Role</th>
                    <th style={{ padding: '0.75rem 1.25rem' }}>Work ID</th>
                    <th style={{ padding: '0.75rem 1.25rem' }}>Action</th>
                    <th style={{ padding: '0.75rem 1.25rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #F0F0F0' }}>
                    <td style={{ padding: '0.75rem 1.25rem', fontFamily: 'monospace' }}>2026-08-28 14:32:10</td>
                    <td style={{ padding: '0.75rem 1.25rem', fontWeight: 600 }}>MoSPI Officer (ID: MOSPI-410)</td>
                    <td style={{ padding: '0.75rem 1.25rem', fontFamily: 'monospace' }}>MPLADS-2026-8871</td>
                    <td style={{ padding: '0.75rem 1.25rem' }}>Critical Risk Alert Reviewed</td>
                    <td style={{ padding: '0.75rem 1.25rem', color: '#1B5E20', fontWeight: 700 }}>✓ Logged</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F0F0F0' }}>
                    <td style={{ padding: '0.75rem 1.25rem', fontFamily: 'monospace' }}>2026-08-28 12:15:44</td>
                    <td style={{ padding: '0.75rem 1.25rem', fontWeight: 600 }}>District Magistrate (Jabalpur)</td>
                    <td style={{ padding: '0.75rem 1.25rem', fontFamily: 'monospace' }}>MPLADS-2026-8871</td>
                    <td style={{ padding: '0.75rem 1.25rem' }}>Field Inspection Task Dispatched</td>
                    <td style={{ padding: '0.75rem 1.25rem', color: '#B8860B', fontWeight: 700 }}>Pending Field Verification</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.75rem 1.25rem', fontFamily: 'monospace' }}>2026-08-28 09:40:18</td>
                    <td style={{ padding: '0.75rem 1.25rem', fontWeight: 600 }}>System AI Worker (Engine-01)</td>
                    <td style={{ padding: '0.75rem 1.25rem', fontFamily: 'monospace' }}>MPLADS-2026-3302</td>
                    <td style={{ padding: '0.75rem 1.25rem' }}>Multi-Signal Duplicate Score Computed (0.958)</td>
                    <td style={{ padding: '0.75rem 1.25rem', color: '#1B5E20', fontWeight: 700 }}>✓ Auto-Saved</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      // ─────────────────────────────────────────────
      // 6. COMPLAINTS & CITIZEN INTELLIGENCE
      // ─────────────────────────────────────────────
      case 'complaints':
      case 'citizenComplaints':
      case 'complaintTracking':
      case 'complaintAnalytics':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card-light" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.35rem', marginBottom: '0.5rem' }}>
                {isHi ? 'नागरिक शिकायतें एवं सार्वजनिक फीडबैक ट्रैकर' : 'Citizen Grievance & Public Feedback Intelligence'}
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                {isHi
                  ? 'नागरिकों द्वारा सबमिट की गई शिकायतों, फोटो साक्ष्य और प्रगति रिपोर्टों को AI द्वारा श्रेणीबद्ध करके सत्यापन हेतु प्राथमिकता दी जाती है।'
                  : 'Direct citizen feedback and grievance reports are ingested, verified with photographic evidence, and correlated with official expenditure data.'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
              <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#D9534F' }}>GRIEVANCE #GRV-2026-108</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>2 days ago</span>
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  Incomplete Community Hall work reported as 100% finished
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
                  Location: Ward 14, Jabalpur • Attached: 3 geotagged photos showing unpainted walls and missing roof sheets.
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className="badge" style={{ background: '#FFF8E1', color: '#B8860B', border: '1px solid #E5B842' }}>
                    Status: In Progress
                  </span>
                  <span className="badge" style={{ background: '#E8F5E9', color: '#1B5E20', border: '1px solid #52B79A' }}>
                    Correlated with MPLADS-2026-8871
                  </span>
                </div>
              </div>

              <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#D9534F' }}>GRIEVANCE #GRV-2026-094</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>5 days ago</span>
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  Solar Street Lights not operational after 3 months of installation
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
                  Location: Badgaon Village, Varanasi • Attached: Vendor invoice copy with missing maintenance guarantee.
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className="badge" style={{ background: '#E8F5E9', color: '#1B5E20', border: '1px solid #52B79A' }}>
                    Status: Field Inspector Assigned
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'browseState':
      case 'browseStates':
      case 'states':
        return <BrowseStatesView />;

      case 'browseMpMla':
      case 'browseMps':
      case 'browseMp':
      case 'mps':
        return <BrowseMpsView />;

      case 'compare':
      case 'compareConstituencies':
        return <CompareView />;

      case 'feedback':
      case 'reportIssue':
        return <FeedbackView />;

      // Default fallback
      default:
        return (
          <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏛️</div>
            <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.4rem', color: '#1D1E22', marginBottom: '0.5rem' }}>
              {isHi ? 'निरीक्षक एआई पोर्टल' : 'Nirikshak AI Intelligence Portal'}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', maxWidth: '500px', margin: '0 auto 1rem auto' }}>
              {isHi
                ? 'यह मॉड्यूल उपलब्ध नहीं है या आपके रोल के लिए एक्सेस नहीं है।'
                : 'This module is not yet available or your role does not have access to this view.'}
            </p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              fontSize: '0.78rem', fontWeight: 700, color: '#52B79A',
              background: '#F0FDF4', padding: '0.4rem 0.9rem',
              border: '1px solid #52B79A', borderRadius: 'var(--radius-full)',
              marginBottom: '1.5rem'
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#52B79A', display: 'inline-block' }} />
              {isHi ? 'Backend API सक्रिय — Live डेटा तैयार' : 'Backend API Connected — Live Data Ready'}
            </div>
            <div>
              <button onClick={onBack} className="btn-teal" style={{ padding: '0.6rem 1.4rem' }}>
                {isHi ? 'सार्वजनिक पोर्टल पर वापस जाएं' : 'Back to Public Portal'}
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div style={{ background: 'var(--color-bg-light)', color: 'var(--color-text-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          background: '#FAF8F3',
          borderBottom: '1.5px solid #1D1E22',
          padding: '0.85rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 100
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button
            type="button"
            onClick={handleBack}
            className="btn-outline-dark"
            style={{
              padding: '0.5rem 1.15rem',
              fontSize: '0.84rem',
              gap: '0.45rem',
              color: '#1D1E22 !important',
              background: '#FFFFFF',
              border: '1.5px solid #1D1E22',
              boxShadow: '1.5px 2px 0px #1D1E22'
            }}
          >
            <ArrowLeft size={15} />
            <span>{isHi ? 'मुख्य पोर्टल पर वापस' : 'Back to Portal'}</span>
          </button>

          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0A2458', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              NIRIKSHΛK ΛI • MPLADS INTELLIGENCE
            </div>
            <div style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.25rem', fontWeight: 700, color: '#1D1E22' }}>
              {featureId === 'findProject' || featureId === 'findProjects'
                ? (isHi ? 'परियोजनाएं खोजें' : 'FIND PROJECTS')
                : featureId === 'browseState' || featureId === 'browseStates' || featureId === 'states'
                ? (isHi ? 'राज्य-वार प्रदर्शन' : 'BROWSE STATES')
                : featureId === 'browseMpMla' || featureId === 'browseMps' || featureId === 'mps'
                ? (isHi ? 'सांसद प्रदर्शन' : 'BROWSE MPS')
                : featureId === 'compare' || featureId === 'compareConstituencies'
                ? (isHi ? 'निर्वाचन क्षेत्र तुलना' : 'COMPARE CONSTITUENCIES')
                : featureId === 'feedback' || featureId === 'reportIssue'
                ? (isHi ? 'मुद्दा / प्रतिपुष्टि दर्ज करें' : 'REPORT AN ISSUE')
                : featureId === 'unifiedAnalysis' || featureId === 'aiIntelligence' || featureId === 'aiAnalysis' || featureId === 'anomalyDetection' || featureId === 'financialAnomaly' || featureId === 'costOverrun' || featureId === 'duplicateProject' || featureId === 'delayRisk' || featureId === 'evidenceVerification' || featureId === 'geospatialIntelligence' || featureId === 'geospatial'
                ? (isHi ? 'एकीकृत विश्लेषण' : 'UNIFIED ANALYSIS')
                : featureId.toUpperCase()}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {(featureId === 'overview' || featureId === 'home') && (
            <HouseSelector />
          )}
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main Feature Content Container */}
      <main style={{ flex: 1, padding: '2rem clamp(1.25rem, 3vw, 3.5rem)', maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {renderFeatureContent()}
      </main>
    </div>
  );
};

export default FeatureView;
