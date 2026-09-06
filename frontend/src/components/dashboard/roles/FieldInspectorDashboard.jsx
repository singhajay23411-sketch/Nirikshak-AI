import React, { useState } from 'react';
import { 
  ClipboardCheck, Camera, MapPin, CheckCircle, 
  Clock, AlertTriangle, FileText, Upload, Shield 
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import KpiCard from '../KpiCard';
import FieldInspectorVerification from '../FieldInspectorVerification';
import EvidenceDrawer from '../EvidenceDrawer';
import AssistantPanel from '../AssistantPanel';

export default function FieldInspectorDashboard({ activeTab = 'verification' }) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isHi = language === 'hi';

  const [selectedWorkForEvidence, setSelectedWorkForEvidence] = useState(null);

  const assignedCount = user?.projectIds ? user.projectIds.length : 3;

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
            <ClipboardCheck size={20} color="#006064" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1D1E22', margin: 0 }}>
              {isHi ? 'क्षेत्रीय भौतिक सत्यापन कंसोल' : 'Field Inspection & Physical Verification Console'}
            </h2>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#555', margin: 0 }}>
            {user?.fullName || 'Er. Rajesh Kumar'} • {user?.district || 'Jabalpur'} Division • CPWD / State PWD Specifications
          </p>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: '#E0F2F1',
          border: '1px solid #004D40',
          padding: '0.35rem 0.75rem',
          borderRadius: '999px',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: '#004D40',
        }}>
          <MapPin size={13} />
          <span>GPS Geotag Telemetry Active</span>
        </div>
      </div>

      {/* Inspector KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '1.25rem',
      }}>
        <KpiCard
          icon={ClipboardCheck}
          label={isHi ? 'आवंटित निरीक्षण स्थल' : 'Assigned Project Sites'}
          value={String(assignedCount)}
          subtitle="Priority Sites in Jabalpur"
          color="#006064"
          confidence={99}
        />
        <KpiCard
          icon={Clock}
          label={isHi ? 'सत्यापन लंबित' : 'Pending Verification'}
          value="2"
          subtitle="Milestone visits due this week"
          color="#E65100"
          confidence={95}
        />
        <KpiCard
          icon={Camera}
          label={isHi ? 'जियो-टैग फोटो साक्ष्य' : 'Verified Evidence Photos'}
          value="118"
          subtitle="Tamper-proof EXIF logs"
          color="#1B5E20"
          confidence={98}
        />
        <KpiCard
          icon={CheckCircle}
          label={isHi ? 'पूर्ण निरीक्षण रिपोर्ट' : 'Completed Certificates'}
          value="42"
          subtitle="Handed over to District Authority"
          color="#0A2458"
          confidence={99}
        />
      </div>

      {/* Verification Workspace (Checklist + Photo Upload) */}
      <div style={{
        background: '#FFFFFF',
        border: '1.5px solid #1D1E22',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '2.5px 3.5px 0px #1D1E22',
      }}>
        <FieldInspectorVerification activeTab={activeTab} />
      </div>

      {/* Inspector Guidance Assistant */}
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
