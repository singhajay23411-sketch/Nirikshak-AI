import React, { useMemo } from 'react';
import { Shield, AlertTriangle, TrendingUp, Users, Database, Clock, CheckCircle, BarChart3, Map, FileText, Eye } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';

const StatCard = ({ icon: Icon, label, value, trend, color = 'var(--color-accent-teal)' }) => (
  <div style={{
    background: '#FFF',
    border: '1.5px solid #1D1E22',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem 1.5rem',
    boxShadow: '2px 3px 0px #1D1E22',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
      </div>
      {trend && <span style={{ fontSize: '0.72rem', fontWeight: 700, color: trend > 0 ? '#D9534F' : '#52B79A' }}>{trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>}
    </div>
    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1D1E22', fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em' }}>{value}</div>
  </div>
);

const ProjectTable = ({ projects, isHi }) => (
  <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border-subtle)', fontWeight: 700, fontSize: '0.92rem' }}>
      {isHi ? 'उच्च जोखिम परियोजनाएं' : 'High-Risk Projects'}
    </div>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
      <thead>
        <tr style={{ background: 'var(--color-bg-card-sand)', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#4A4D55' }}>{isHi ? 'परियोजना ID' : 'Project ID'}</th>
          <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#4A4D55' }}>{isHi ? 'निर्वाचन क्षेत्र' : 'Constituency'}</th>
          <th style={{ padding: '0.6rem 1rem', textAlign: 'center', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#4A4D55' }}>{isHi ? 'जोखिम स्कोर' : 'Risk Score'}</th>
          <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#4A4D55' }}>{isHi ? 'प्रमुख कारक' : 'Key Factor'}</th>
        </tr>
      </thead>
      <tbody>
        {projects.map((p, i) => (
          <tr key={i} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
            <td style={{ padding: '0.6rem 1rem', fontWeight: 600, fontFamily: 'monospace' }}>{p.id}</td>
            <td style={{ padding: '0.6rem 1rem', color: 'var(--color-text-secondary)' }}>{p.constituency}</td>
            <td style={{ padding: '0.6rem 1rem', textAlign: 'center' }}>
              <span style={{
                padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 800,
                background: p.score > 75 ? '#FEF2F2' : '#FFF8E1',
                color: p.score > 75 ? '#D9534F' : '#E5B842',
                border: `1px solid ${p.score > 75 ? '#D9534F' : '#E5B842'}33`,
              }}>
                {p.score}
              </span>
            </td>
            <td style={{ padding: '0.6rem 1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{p.factor}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const MOCK_HIGH_RISK = [
  { id: 'MPLADS-2026-8871', constituency: 'Jabalpur', score: 87, factor: 'Cost inflation + delayed progress' },
  { id: 'MPLADS-2026-3302', constituency: 'Lucknow', score: 82, factor: 'Duplicate vendor signatures' },
  { id: 'MPLADS-2025-7219', constituency: 'Bhopal', score: 79, factor: 'Photo evidence mismatch' },
  { id: 'MPLADS-2026-1544', constituency: 'Indore', score: 76, factor: 'UC filing deadline exceeded' },
  { id: 'MPLADS-2025-9001', constituency: 'Varanasi', score: 73, factor: 'Financial utilization anomaly' },
];

const RoleOverviewPanels = ({ role, activeTab, user }) => {
  const { language } = useLanguage();
  const { unifiedProjects, ministryView, duplicateAlerts, finguardAnomalies, isLoading } = useData();
  const isHi = language === 'hi';

  const highRiskProjects = useMemo(() => {
    if (!unifiedProjects) return [];
    return unifiedProjects.slice(0, 5).map(item => {
      let factor = "General risk factors";
      if (item.anomaly_reasons && item.anomaly_reasons.length > 0) {
        const drivers = typeof item.anomaly_reasons === 'string' ? JSON.parse(item.anomaly_reasons) : item.anomaly_reasons;
        if (drivers && drivers.length > 0) {
          const pillars = {
            'financial_risk_score': 'Financial over-disbursements',
            'progress_risk_score': 'High project stall probability',
            'cost_risk_score': 'Severe cost escalation',
            'delay_risk_score': 'Chronic completion delays',
            'duplicate_risk_score': 'Duplicate/split-work alerts',
            'evidence_risk_score': 'Prohibited guidelines violation',
            'agency_risk_score': 'Poor executing agency track record',
            'payment_risk_score': 'High cartel or payment fragmentation'
          };
          factor = pillars[drivers[0].pillar] || factor;
        }
      }
      return {
        id: `MPLADS-${item.work_id}`,
        constituency: item.const_name || item.state_name || 'N/A',
        score: Math.round(item.final_risk_score),
        factor: factor
      };
    });
  }, [unifiedProjects]);

  const scopeLabel = user?.district && user?.state
    ? `${user.district}, ${user.state}`
    : user?.state || (isHi ? 'राष्ट्रीय' : 'National');

  const renderOverviewStats = () => {
    if (isLoading || !ministryView) return [];
    
    const { national_stats } = ministryView;
    const totalProjects = national_stats?.total_projects?.toLocaleString('en-IN') || '2,18,913';
    const topRisk = ministryView?.top_national_risk_alerts?.length || '667';
    const totalAnomalies = ((duplicateAlerts?.length || 0) + (finguardAnomalies?.length || 0)).toLocaleString('en-IN') || '1,420';

    const configs = {
      ADMIN: [
        { icon: Users, label: isHi ? 'कुल उपयोगकर्ता' : 'Total Users', value: '7', color: '#0A2458' },
        { icon: Database, label: isHi ? 'कुल परियोजनाएं' : 'Total Projects', value: totalProjects, color: 'var(--color-accent-teal)' },
        { icon: AlertTriangle, label: isHi ? 'उच्च जोखिम' : 'High Risk', value: topRisk, trend: 8, color: '#D9534F' },
        { icon: Shield, label: isHi ? 'जांच सक्रिय' : 'Active Investigations', value: '28', color: '#E5B842' },
      ],
      MOSPI_OFFICER: [
        { icon: Database, label: isHi ? 'राष्ट्रीय परियोजनाएं' : 'National Projects', value: totalProjects, color: 'var(--color-accent-teal)' },
        { icon: AlertTriangle, label: isHi ? 'उच्च जोखिम' : 'High Risk', value: topRisk, trend: 8, color: '#D9534F' },
        { icon: TrendingUp, label: isHi ? 'वित्तीय विसंगतियां' : 'Financial Anomalies', value: totalAnomalies, trend: -3, color: '#E5B842' },
        { icon: CheckCircle, label: isHi ? 'सत्यापित' : 'Verified', value: '1,94,210', color: '#52B79A' },
      ],
      STATE_OFFICER: [
        { icon: Database, label: isHi ? 'राज्य परियोजनाएं' : 'State Projects', value: '1,847', color: 'var(--color-accent-teal)' },
        { icon: AlertTriangle, label: isHi ? 'जोखिम चिह्नित' : 'Risk Flagged', value: '43', trend: 5, color: '#D9534F' },
        { icon: Clock, label: isHi ? 'विलंबित' : 'Delayed', value: '127', color: '#E5B842' },
        { icon: CheckCircle, label: isHi ? 'पूर्ण' : 'Completed', value: '982', color: '#52B79A' },
      ],
      DISTRICT_OFFICER: [
        { icon: Database, label: isHi ? 'जिला परियोजनाएं' : 'District Projects', value: '284', color: 'var(--color-accent-teal)' },
        { icon: AlertTriangle, label: isHi ? 'जोखिम चिह्नित' : 'Risk Flagged', value: '12', trend: 2, color: '#D9534F' },
        { icon: Clock, label: isHi ? 'सत्यापन लंबित' : 'Pending Verification', value: '18', color: '#E5B842' },
        { icon: CheckCircle, label: isHi ? 'सत्यापित' : 'Verified', value: '196', color: '#52B79A' },
      ],
      FIELD_INSPECTOR: [
        { icon: Database, label: isHi ? 'सौंपी गई' : 'Assigned', value: '3', color: 'var(--color-accent-teal)' },
        { icon: Clock, label: isHi ? 'लंबित' : 'Pending', value: '1', color: '#E5B842' },
        { icon: CheckCircle, label: isHi ? 'सत्यापित' : 'Verified', value: '1', color: '#52B79A' },
        { icon: BarChart3, label: isHi ? 'प्रगति में' : 'In Progress', value: '1', color: '#0A2458' },
      ],
      ANALYST: [
        { icon: Shield, label: isHi ? 'विसंगतियां ज्ञात' : 'Anomalies Detected', value: totalAnomalies, color: '#D9534F' },
        { icon: Database, label: isHi ? 'डुप्लिकेट संदिग्ध' : 'Duplicate Suspects', value: duplicateAlerts?.length || '482', color: '#E5B842' },
        { icon: TrendingUp, label: isHi ? 'लागत विचलन' : 'Cost Deviations', value: '89', trend: -12, color: 'var(--color-accent-teal)' },
        { icon: BarChart3, label: isHi ? 'मॉडल सटीकता' : 'Model Accuracy', value: '94.2%', color: '#52B79A' },
      ],
      VIEWER: [
        { icon: Database, label: isHi ? 'कुल परियोजनाएं' : 'Total Projects', value: totalProjects, color: 'var(--color-accent-teal)' },
        { icon: AlertTriangle, label: isHi ? 'जोखिम चिह्नित' : 'Risk Flagged', value: topRisk, color: '#D9534F' },
        { icon: Map, label: isHi ? 'राज्य कवर' : 'States Covered', value: '36', color: '#0A2458' },
        { icon: FileText, label: isHi ? 'रिपोर्ट उपलब्ध' : 'Reports Available', value: '47', color: '#E5B842' },
      ],
    };

    return configs[role] || configs.VIEWER;
  };

  const stats = renderOverviewStats();

  if (activeTab !== 'overview' && activeTab !== 'risk' && activeTab !== 'projects') {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏗️</div>
        <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.4rem', color: '#1D1E22', marginBottom: '0.5rem' }}>
          {isHi ? 'जल्द आ रहा है' : 'Coming Soon'}
        </h3>
        <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted)', maxWidth: '400px', margin: '0 auto' }}>
          {isHi
            ? 'यह मॉड्यूल विकास में है। पूर्ण संस्करण में यह सुविधा उपलब्ध होगी।'
            : 'This module is under development. It will be available in the full production release.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Scope Heading */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.6rem', color: '#1D1E22', marginBottom: '0.25rem' }}>
          {activeTab === 'overview'
            ? (isHi ? 'अवलोकन' : 'Overview')
            : activeTab === 'risk'
              ? (isHi ? 'जोखिम खुफिया' : 'Risk Intelligence')
              : (isHi ? 'परियोजनाएं' : 'Projects')}
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
          {scopeLabel} — {user?.fullName}
        </p>
      </div>

      {/* Stat Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Read-Only Badge for Viewer */}
      {role === 'VIEWER' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem',
          background: '#FFF8E1', border: '1px solid #E5B842', borderRadius: 'var(--radius-sm)',
          fontSize: '0.82rem', fontWeight: 600, color: '#B8860B', marginBottom: '1.5rem',
        }}>
          <Eye size={15} />
          {isHi ? 'केवल-पठन मोड — आप डेटा देख सकते हैं, लेकिन संशोधित नहीं कर सकते।' : 'Read-Only Mode — You can view data but cannot modify it.'}
        </div>
      )}

      {/* High Risk Projects Table */}
      <ProjectTable projects={highRiskProjects} isHi={isHi} />
    </div>
  );
};

export default RoleOverviewPanels;
