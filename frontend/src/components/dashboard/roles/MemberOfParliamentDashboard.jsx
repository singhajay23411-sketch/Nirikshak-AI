import React, { useState, useMemo } from 'react';
import { 
  Award, TrendingUp, CheckCircle, AlertCircle, 
  MapPin, Building, PieChart, FileText, Camera, Shield 
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import KpiCard from '../KpiCard';
import PriorityWorkTable from '../PriorityWorkTable';
import EvidenceDrawer from '../EvidenceDrawer';
import ExportButton from '../ExportButton';
import AssistantPanel from '../AssistantPanel';

const SECTOR_DISTRIBUTION = [
  { sector: 'Drinking Water & Sanitation', count: 12, percent: 35, color: '#0277BD' },
  { sector: 'Education Infrastructure', count: 9, percent: 26, color: '#2E7D32' },
  { sector: 'Rural Roads & Pathways', count: 7, percent: 21, color: '#E65100' },
  { sector: 'Community Halls & Centers', count: 4, percent: 12, color: '#6A1B9A' },
  { sector: 'Public Health & Clinics', count: 2, percent: 6, color: '#C2185B' },
];

export default function MemberOfParliamentDashboard({ selectedConstituency, onConstituencyChange }) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { unifiedProjects, realProjects, mpScorecardSummary, mpView } = useData();
  const isHi = language === 'hi';

  const activeConstituency = selectedConstituency || user?.constituency || 'Varanasi';
  const [selectedWorkForEvidence, setSelectedWorkForEvidence] = useState(null);

  const displayWorks = (unifiedProjects && unifiedProjects.length > 0) ? unifiedProjects : (realProjects || []);

  // Filter works by active constituency
  const constituencyWorks = useMemo(() => {
    const term = activeConstituency.toLowerCase();
    const matches = displayWorks.filter(w => {
      const c = (w.const_name || w.constituency || '').toLowerCase();
      const d = (w.district_name || w.district || '').toLowerCase();
      return c.includes(term) || d.includes(term) || term.includes(c);
    });
    return matches.length > 0 ? matches : displayWorks.slice(0, 12);
  }, [displayWorks, activeConstituency]);

  // Active MP details from precomputed scorecard or MP_View
  const activeScorecard = useMemo(() => {
    if (!mpScorecardSummary) return null;
    const term = activeConstituency.toLowerCase();
    return mpScorecardSummary.find(s => {
      const c = (s.const_name || s.constituency_name || '').toLowerCase();
      return c.includes(term) || term.includes(c);
    }) || null;
  }, [mpScorecardSummary, activeConstituency]);

  const activeMpView = useMemo(() => {
    if (!mpView) return null;
    const term = activeConstituency.toLowerCase();
    return mpView.find(s => {
      const c = (s.constituency_name || s.const_name || '').toLowerCase();
      return c.includes(term) || term.includes(c);
    }) || null;
  }, [mpView, activeConstituency]);

  // Dynamic values
  const mpName = activeScorecard?.mp_name || activeMpView?.mp_name || (
    activeConstituency.toLowerCase() === 'varanasi' ? 'Shri Narendra Modi' :
    activeConstituency.toLowerCase() === 'jabalpur' ? 'Shri Ashish Dubey' :
    activeConstituency.toLowerCase() === 'lucknow' ? 'Shri Rajnath Singh' :
    activeConstituency.toLowerCase() === 'baramati' ? 'Smt. Supriya Sule' :
    activeConstituency.toLowerCase().includes('hamirpur') ? 'Shri Anurag Singh Thakur' :
    user?.fullName || "Hon'ble Member of Parliament"
  );

  const totalWorksCount = activeScorecard?.total_works || constituencyWorks.length || 38;
  const utilRateFormatted = activeScorecard?.utilization_rate 
    ? `${(activeScorecard.utilization_rate * 100).toFixed(1)}%`
    : activeMpView?.utilization_rate 
    ? `${(activeMpView.utilization_rate * 100).toFixed(1)}%` 
    : '94.4%';

  const completedCount = constituencyWorks.filter(w => 
    w.type === 'completed' || String(w.status || '').toLowerCase().includes('completed')
  ).length || Math.round(totalWorksCount * 0.76);

  const completedPct = Math.round((completedCount / totalWorksCount) * 100);

  const advisoryCount = constituencyWorks.filter(w => 
    (w.final_risk_score && w.final_risk_score > 35) || w.type === 'sanctioned'
  ).length || 3;

  const totalSpentFormatted = activeMpView?.total_disbursed 
    ? `₹${(activeMpView.total_disbursed / 10000000).toFixed(1)} Cr`
    : '₹24.15 Cr';

  // Dynamic Sectoral breakdown
  const dynamicSectors = useMemo(() => {
    const counts = {};
    const colors = ['#0277BD', '#2E7D32', '#E65100', '#6A1B9A', '#C2185B', '#00796B', '#D84315'];
    for (const w of constituencyWorks) {
      const cat = w.category || 'Community Infrastructure';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    const total = constituencyWorks.length || 1;
    const list = Object.entries(counts).map(([sector, count], idx) => ({
      sector,
      count,
      percent: Math.round((count / total) * 100),
      color: colors[idx % colors.length]
    }));
    return list.length > 0 ? list : SECTOR_DISTRIBUTION;
  }, [constituencyWorks]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Welcome Header */}
      <div style={{
        background: '#FAF8F3',
        border: '1.5px solid #1D1E22',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '2.5px 3.5px 0px #1D1E22',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Award size={22} color="#4A148C" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1D1E22', margin: 0 }}>
              {isHi ? `सांसद डैशबोर्ड — ${mpName} (${activeConstituency})` : `Hon'ble MP Scorecard — ${mpName} (${activeConstituency})`}
            </h2>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#555', margin: 0 }}>
            {isHi
              ? 'संसदीय निर्वाचन क्षेत्र विकास योजना (MPLADS) प्रगति एवं पारदर्शी निगरानी रिपोर्ट'
              : 'Constituency Development & Priority Work Implementation Tracker • 17th / 18th Lok Sabha'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <ExportButton data={constituencyWorks} scopeTitle={`MP Scorecard — ${activeConstituency}`} />
        </div>
      </div>

      {/* KPI Cards: Constructive & Advisory */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '1.25rem',
      }}>
        <KpiCard
          icon={Building}
          label={isHi ? 'अनुशंसित विकास कार्य' : 'Total Works Recommended'}
          value={String(totalWorksCount)}
          subtitle="Constituency Sanction Pool"
          color="#4A148C"
          confidence={99}
        />
        <KpiCard
          icon={TrendingUp}
          label={isHi ? 'निधि उपयोग अनुपात' : 'Fund Utilization Rate'}
          value={utilRateFormatted}
          subtitle={`${totalSpentFormatted} Expended / Released`}
          trend={9}
          trendDirection="up"
          trendIsGood={true}
          color="#1B5E20"
          confidence={96}
        />
        <KpiCard
          icon={CheckCircle}
          label={isHi ? 'पूर्ण एवं लोकार्पित कार्य' : 'Works Completed & Grounded'}
          value={String(completedCount)}
          subtitle={`${completedPct}% Completion Velocity`}
          trend={6}
          trendDirection="up"
          trendIsGood={true}
          color="#00796B"
          confidence={98}
        />
        <KpiCard
          icon={AlertCircle}
          label={isHi ? 'प्रगति समीक्षा अनुशंसित' : 'Progress Review Advisory'}
          value={String(advisoryCount)}
          subtitle="Milestone velocity check requested"
          color="#F57F17"
          confidence={92}
        />
      </div>

      {/* Grid: Sectoral Breakdown + Advisory Guidance */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '1.5rem',
      }}>
        {/* Sectoral Breakdown */}
        <div style={{
          background: '#FFFFFF',
          border: '1.5px solid #1D1E22',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          boxShadow: '2.5px 3.5px 0px #1D1E22',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1D1E22', margin: 0 }}>
              {isHi ? 'क्षेत्रवार विकास आवंटन' : 'Sectoral Recommendation Distribution'}
            </h3>
            <span style={{ fontSize: '0.72rem', color: '#626D7D' }}>{activeConstituency}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {dynamicSectors.map((s, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                  <span style={{ fontWeight: 700, color: '#1D1E22' }}>{s.sector}</span>
                  <span style={{ fontWeight: 800, color: s.color }}>{s.count} works ({s.percent}%)</span>
                </div>
                <div style={{ height: '6px', background: '#EAE6DF', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${s.percent}%`, height: '100%', background: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Constructive Advisory Box */}
        <div style={{
          background: '#FFFDF9',
          border: '1.5px solid #1D1E22',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          boxShadow: '2.5px 3.5px 0px #1D1E22',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Shield size={18} color="#0A2458" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1D1E22', margin: 0 }}>
              {isHi ? 'सांसद प्राथमिकता सूचना एवं परामर्श' : 'Parliamentary Oversight Advisory'}
            </h3>
          </div>

          <div style={{
            background: '#F0F4F8',
            border: '1px solid #D9E2EC',
            borderRadius: '6px',
            padding: '0.75rem',
            fontSize: '0.76rem',
            color: '#334E68',
            lineHeight: 1.4,
          }}>
            <strong>Positive Milestone:</strong> Fund utilization in {activeConstituency} stands at {utilRateFormatted} ({totalSpentFormatted} utilized), exceeding national benchmarks. {completedCount} community asset works are physically completed and active.
          </div>

          <div style={{
            background: '#FFF8E1',
            border: '1px solid #FFE082',
            borderRadius: '6px',
            padding: '0.75rem',
            fontSize: '0.76rem',
            color: '#8D6E63',
            lineHeight: 1.4,
          }}>
            <strong>Recommendation:</strong> {advisoryCount} community works are currently under milestone verification. Coordination with the District Planning Authority will expedite Stage-II/III final disbursements.
          </div>
        </div>
      </div>

      {/* Constituency Works Table */}
      <PriorityWorkTable
        works={constituencyWorks}
        onOpenEvidence={setSelectedWorkForEvidence}
        title={isHi ? `संसदीय क्षेत्र विकास कार्य (${activeConstituency})` : `Constituency Development Works (${activeConstituency})`}
        emptyMessage={`No works found for ${activeConstituency}. Try selecting another constituency from the switcher above.`}
      />

      {/* Assistant */}
      <AssistantPanel selectedConstituency={activeConstituency} />

      {/* Evidence Drawer */}
      <EvidenceDrawer
        work={selectedWorkForEvidence}
        isOpen={Boolean(selectedWorkForEvidence)}
        onClose={() => setSelectedWorkForEvidence(null)}
      />
    </div>
  );
}
