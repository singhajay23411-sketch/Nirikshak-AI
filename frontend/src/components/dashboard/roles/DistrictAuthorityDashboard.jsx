import React, { useState } from 'react';
import { 
  Database, AlertTriangle, CheckCircle, Clock, 
  UserCheck, Camera, ShieldAlert, FileText, Send 
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import KpiCard from '../KpiCard';
import RiskSummaryCard from '../RiskSummaryCard';
import PriorityWorkTable from '../PriorityWorkTable';
import EvidenceDrawer from '../EvidenceDrawer';
import InvestigationPanel from '../InvestigationPanel';
import ExportButton from '../ExportButton';
import AssistantPanel from '../AssistantPanel';

export default function DistrictAuthorityDashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { unifiedProjects, realProjects, districtView } = useData();
  const isHi = language === 'hi';

  const userDistrict = user?.district || 'Jabalpur';
  const userState = user?.state || 'Madhya Pradesh';

  const [selectedWorkForEvidence, setSelectedWorkForEvidence] = useState(null);
  const [selectedWorkForInvestigation, setSelectedWorkForInvestigation] = useState(null);
  const [activeRiskFilter, setActiveRiskFilter] = useState('ALL');

  const displayWorks = (unifiedProjects && unifiedProjects.length > 0) ? unifiedProjects : (realProjects || []);

  const districtWorks = React.useMemo(() => {
    const dTerm = userDistrict.toLowerCase();
    const matches = displayWorks.filter(w => {
      const d = (w.district_name || w.district || w.constituency || '').toLowerCase();
      return d.includes(dTerm) || dTerm.includes(d);
    });
    return matches.length > 0 ? matches : displayWorks.filter(w => (w.state_name || w.state || '').toLowerCase().includes(userState.toLowerCase())).slice(0, 15);
  }, [displayWorks, userDistrict, userState]);

  const totalWorksCount = districtWorks.length || 32;
  const certifiedCount = districtWorks.filter(w => w.type === 'completed' || String(w.status || '').toLowerCase().includes('completed')).length || Math.round(totalWorksCount * 0.72);
  const certifiedPct = Math.round((certifiedCount / totalWorksCount) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1D1E22', margin: 0 }}>
            {isHi ? `जिला निगरानी डैशबोर्ड — ${userDistrict}` : `District Monitoring Authority — ${userDistrict}`}
          </h2>
          <span style={{ fontSize: '0.74rem', color: '#626D7D' }}>
            {userState} • Smt. G. Srijana, IAS (Collector & DM) • Ground Inspection & Audit Authority
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ExportButton data={districtWorks.slice(0, 40)} scopeTitle={`District ${userDistrict}`} />
        </div>
      </div>

      {/* District KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '1.25rem',
      }}>
        <KpiCard
          icon={Database}
          label={isHi ? 'जिला परियोजनाएं' : `Works in ${userDistrict}`}
          value={String(totalWorksCount)}
          subtitle="Sanctioned MPLADS Works"
          color="#E65100"
          confidence={98}
        />
        <KpiCard
          icon={AlertTriangle}
          label={isHi ? 'सक्रिय जांच मामले' : 'Active Anomaly Inquiries'}
          value="2"
          subtitle="INV-2026-MP-001, MP-002"
          trend={1}
          trendDirection="down"
          trendIsGood={true}
          color="#C62828"
          confidence={96}
        />
        <KpiCard
          icon={UserCheck}
          label={isHi ? 'स्थल दौरा निर्धारित' : 'Field Visits Scheduled'}
          value="2"
          subtitle="Assigned to Er. Rajesh Kumar"
          color="#006064"
          confidence={97}
        />
        <KpiCard
          icon={CheckCircle}
          label={isHi ? 'प्रमाणित पूर्ण कार्य' : 'Physically Certified'}
          value={String(certifiedCount)}
          subtitle={`${certifiedPct}% Ground Verification Rate`}
          color="#2E7D32"
          confidence={99}
        />
      </div>

      {/* Grid: Risk Profile + Inspector Deployment Status */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '1.5rem',
      }}>
        <RiskSummaryCard
          title={`District Risk Index (${userDistrict})`}
          highCount={12}
          mediumCount={44}
          lowCount={154}
          activeFilter={activeRiskFilter}
          onFilterChange={setActiveRiskFilter}
        />

        {/* Inspector Roster Box */}
        <div style={{
          background: '#FFFFFF',
          border: '1.5px solid #1D1E22',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          boxShadow: '2.5px 3.5px 0px #1D1E22',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1D1E22', margin: 0 }}>
              {isHi ? 'क्षेत्र निरीक्षक दल तैनाती' : 'Field Inspector Squad & Roster'}
            </h3>
            <span style={{ fontSize: '0.72rem', color: '#626D7D' }}>Division Jabalpur</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {[
              { name: 'Er. Rajesh Kumar', sector: 'Civil Works North', active: 3, verified: 42, status: 'On Site' },
              { name: 'Er. Sunita Sen', sector: 'Health Infrastructure', active: 2, verified: 35, status: 'Available' },
              { name: 'Er. Amit Tripathi', sector: 'Rural Roads & Solar', active: 3, verified: 38, status: 'On Site' },
            ].map((ins, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 0.75rem',
                border: '1px solid #EAE6DF',
                borderRadius: '6px',
                background: '#FAF8F5',
                fontSize: '0.76rem',
              }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#1D1E22' }}>{ins.name}</div>
                  <div style={{ color: '#666', fontSize: '0.7rem' }}>{ins.sector}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: '#006064' }}>{ins.active} Active Visits</div>
                  <span style={{
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.35rem',
                    borderRadius: '4px',
                    background: ins.status === 'On Site' ? '#E1F5FE' : '#E8F5E9',
                    color: ins.status === 'On Site' ? '#0277BD' : '#2E7D32',
                  }}>
                    {ins.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Priority Work Queue */}
      <PriorityWorkTable
        works={districtWorks}
        onOpenEvidence={setSelectedWorkForEvidence}
        onOpenInvestigation={setSelectedWorkForInvestigation}
        title={isHi ? `जिला जांच एवं सत्यापन कतार (${userDistrict})` : `District Verification & Anomaly Inquiries (${userDistrict})`}
      />

      {/* Assistant */}
      <AssistantPanel />

      {/* Drawers */}
      <EvidenceDrawer
        work={selectedWorkForEvidence}
        isOpen={Boolean(selectedWorkForEvidence)}
        onClose={() => setSelectedWorkForEvidence(null)}
      />
      <InvestigationPanel
        work={selectedWorkForInvestigation}
        isOpen={Boolean(selectedWorkForInvestigation)}
        onClose={() => setSelectedWorkForInvestigation(null)}
      />
    </div>
  );
}
