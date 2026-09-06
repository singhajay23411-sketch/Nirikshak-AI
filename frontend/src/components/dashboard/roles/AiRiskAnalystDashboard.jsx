import React, { useState } from 'react';
import { 
  Cpu, Activity, Shield, TrendingUp, AlertTriangle, 
  Layers, BarChart3, Database, FileText, CheckCircle2 
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useData } from '../../../context/DataContext';
import KpiCard from '../KpiCard';
import RiskSummaryCard from '../RiskSummaryCard';
import PriorityWorkTable from '../PriorityWorkTable';
import EvidenceDrawer from '../EvidenceDrawer';
import ExportButton from '../ExportButton';
import AssistantPanel from '../AssistantPanel';

const MODEL_SPECS = [
  { name: 'Financial Velocity Anomaly Detector', type: 'Isolation Forest + Rolling Z-Score', version: 'v2.4', auc: 0.948, weight: '30%', status: 'Active' },
  { name: 'Cost Benchmark Deviation Engine', type: 'Quantile Regressor (95th percentile)', version: 'v1.8', auc: 0.925, weight: '25%', status: 'Active' },
  { name: 'Duplicate Semantic Matcher', type: 'MiniLM-L6-v2 Embeddings + Cosine', version: 'v3.1', auc: 0.961, weight: '20%', status: 'Active' },
  { name: 'Contractor Cartel Concentration (HHI)', type: 'Graph Network Centrality', version: 'v1.2', auc: 0.914, weight: '15%', status: 'Active' },
  { name: 'Milestone Progress Stall Predictor', type: 'Survival Analysis / Cox Proportional', version: 'v2.0', auc: 0.938, weight: '10%', status: 'Active' },
];

export default function AiRiskAnalystDashboard() {
  const { language } = useLanguage();
  const { unifiedProjects, realProjects } = useData();
  const isHi = language === 'hi';

  const [selectedWorkForEvidence, setSelectedWorkForEvidence] = useState(null);
  const [activeRiskFilter, setActiveRiskFilter] = useState('ALL');

  const displayWorks = (unifiedProjects && unifiedProjects.length > 0) ? unifiedProjects : (realProjects || []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner */}
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
            <Cpu size={20} color="#311B92" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1D1E22', margin: 0 }}>
              {isHi ? 'AI जोखिम खुफिया एवं सांख्यिकीय विश्लेषण' : 'AI Risk Intelligence & Model Telemetry'}
            </h2>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#555', margin: 0 }}>
            Explainable AI (XAI) Model Diagnostics • Anomaly Weights • Baseline Benchmark Calibration
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ExportButton data={MODEL_SPECS} scopeTitle="AI Risk Engine Diagnostics" />
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '1.25rem',
      }}>
        <KpiCard
          icon={Cpu}
          label={isHi ? 'सक्रिय ML पाइपलाइन' : 'Ensemble ML Models'}
          value="5 Active"
          subtitle="Trained on 100k+ historical works"
          color="#311B92"
          confidence={99}
        />
        <KpiCard
          icon={Activity}
          label={isHi ? 'मॉडल समग्र सटीकता (AUC)' : 'Composite Ensemble AUC'}
          value="0.942"
          subtitle="Cross-validated with field audits"
          trend={1.2}
          trendDirection="up"
          trendIsGood={true}
          color="#1B5E20"
          confidence={98}
        />
        <KpiCard
          icon={AlertTriangle}
          label={isHi ? 'सांख्यिकीय बाह्य बिंदु' : 'Statistical Outliers'}
          value="902"
          subtitle="Pillar anomaly score ≥70"
          color="#C62828"
          confidence={93}
        />
        <KpiCard
          icon={Layers}
          label={isHi ? 'समानार्थी क्लस्टर' : 'Semantic Clusters'}
          value="142"
          subtitle="Duplicate/split-work clusters"
          color="#0A2458"
          confidence={96}
        />
      </div>

      {/* Model Roster & Weights Table */}
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
            {isHi ? 'एन्सेम्बल मॉडल विनिर्देश एवं भार' : 'Active Anomaly Pillar Models & Weights'}
          </h3>
          <span style={{ fontSize: '0.72rem', color: '#626D7D' }}>Artifact Pipeline: nirikshak-v2026.1</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #1D1E22', background: '#FAF8F3' }}>
                <th style={{ padding: '0.6rem 0.75rem' }}>Model Name</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Algorithm / Architecture</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>AUC-ROC</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Weight</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {MODEL_SPECS.map((m, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #EAE6DF' }}>
                  <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: '#1D1E22' }}>{m.name}</td>
                  <td style={{ padding: '0.6rem 0.75rem', color: '#555', fontFamily: 'monospace' }}>{m.type}</td>
                  <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: '#1B5E20' }}>{m.auc}</td>
                  <td style={{ padding: '0.6rem 0.75rem', fontWeight: 800 }}>{m.weight}</td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      background: '#E8F5E9',
                      color: '#2E7D32',
                    }}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Risk Distribution + Statutory Note */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '1.5rem',
      }}>
        <RiskSummaryCard
          highCount={902}
          mediumCount={1450}
          lowCount={2332}
          activeFilter={activeRiskFilter}
          onFilterChange={setActiveRiskFilter}
        />

        <div style={{
          background: '#FFFDF9',
          border: '1.5px solid #1D1E22',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          boxShadow: '2.5px 3.5px 0px #1D1E22',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1D1E22', margin: 0 }}>
            {isHi ? 'एक्सप्लेनेबल AI (XAI) मार्गदर्शन' : 'Explainable AI (XAI) Feature Importance'}
          </h3>
          <p style={{ fontSize: '0.76rem', color: '#555', lineHeight: 1.4, margin: 0 }}>
            Top SHAP contributors across flagged works:
          </p>
          <ul style={{ fontSize: '0.75rem', color: '#333', paddingLeft: '1.25rem', margin: 0, lineHeight: 1.6 }}>
            <li><strong>Sanction vs Expenditure Ratio:</strong> Disproportionate early releases prior to milestone sign-off (+0.38 impact).</li>
            <li><strong>Days Since Last Inspection:</strong> Chronic lack of photographic evidence beyond 180 days (+0.29 impact).</li>
            <li><strong>Agency Concentration Ratio:</strong> Single vendor securing &gt;60% works in a single block (+0.21 impact).</li>
            <li><strong>Cosine Semantic Overlap:</strong> Title/description matches existing sanctioned work in adjacent ward (+0.12 impact).</li>
          </ul>
        </div>
      </div>

      {/* Outlier Works Queue */}
      <PriorityWorkTable
        works={displayWorks}
        onOpenEvidence={setSelectedWorkForEvidence}
        title={isHi ? 'सांख्यिकीय बाह्य कार्य कतार (स्कोर ≥70)' : 'Statistical Outlier Works Queue (Risk Score ≥70)'}
      />

      {/* Assistant */}
      <AssistantPanel />

      {/* Evidence Drawer */}
      <EvidenceDrawer
        work={selectedWorkForEvidence}
        isOpen={Boolean(selectedWorkForEvidence)}
        onClose={() => setSelectedWorkForEvidence(null)}
      />
    </div>
  );
}
