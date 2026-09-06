import React, { useState } from 'react';
import { 
  Shield, Users, Database, Activity, CheckCircle, 
  Server, Lock, RefreshCw, Key, FileText, AlertCircle 
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import KpiCard from '../KpiCard';
import AdminUserManagement from '../AdminUserManagement';
import ExportButton from '../ExportButton';

const AUDIT_LOGS = [
  { timestamp: '2026-02-14 16:45:12', user: 'admin@nirikshak.gov.in', action: 'ROLE_PERMISSION_CHECK', target: 'SYSTEM_ADMIN', ip: '10.0.4.12', status: 'SUCCESS' },
  { timestamp: '2026-02-14 16:30:04', user: 'mospi.officer@nirikshak.gov.in', action: 'INVESTIGATION_TRIAGE', target: 'MPLADS-2026-8871', ip: '10.0.2.88', status: 'SUCCESS' },
  { timestamp: '2026-02-14 15:18:22', user: 'district.jabalpur@nirikshak.gov.in', action: 'INSPECTOR_ASSIGNMENT', target: 'Er. Rajesh Kumar', ip: '10.0.7.14', status: 'SUCCESS' },
  { timestamp: '2026-02-14 14:02:50', user: 'inspector@nirikshak.gov.in', action: 'EVIDENCE_UPLOAD', target: 'site_foundation_8871.jpg', ip: '10.0.9.33', status: 'SUCCESS' },
  { timestamp: '2026-02-14 11:20:19', user: 'mp.loksabha@nirikshak.gov.in', action: 'CONSTITUENCY_REPORT_VIEW', target: 'Varanasi', ip: '10.0.5.10', status: 'SUCCESS' },
];

export default function SystemAdminDashboard({ activeTab = 'overview' }) {
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const [adminTab, setAdminTab] = useState(activeTab === 'users' ? 'users' : 'overview');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Admin Header */}
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
            <Shield size={20} color="#0A2458" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1D1E22', margin: 0 }}>
              {isHi ? 'प्रणाली प्रशासन एवं सुरक्षा नियंत्रण' : 'System Administration & Security Operations'}
            </h2>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#555', margin: 0 }}>
            Role-Based Access Control (RBAC) • Audit Registry • Precomputed Artifact Telemetry
          </p>
        </div>

        {/* Tab Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#FFFFFF', padding: '0.25rem', borderRadius: '8px', border: '1px solid #1D1E22' }}>
          <button
            onClick={() => setAdminTab('overview')}
            style={{
              background: adminTab === 'overview' ? '#1D1E22' : 'transparent',
              color: adminTab === 'overview' ? '#FFF' : '#1D1E22',
              border: 'none',
              borderRadius: '6px',
              padding: '0.35rem 0.75rem',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {isHi ? 'प्रणाली स्थिति' : 'System Telemetry'}
          </button>
          <button
            onClick={() => setAdminTab('users')}
            style={{
              background: adminTab === 'users' ? '#1D1E22' : 'transparent',
              color: adminTab === 'users' ? '#FFF' : '#1D1E22',
              border: 'none',
              borderRadius: '6px',
              padding: '0.35rem 0.75rem',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {isHi ? 'उपयोगकर्ता प्रबंधन' : 'User Management'}
          </button>
        </div>
      </div>

      {adminTab === 'users' ? (
        <div style={{
          background: '#FFFFFF',
          border: '1.5px solid #1D1E22',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '2.5px 3.5px 0px #1D1E22',
        }}>
          <AdminUserManagement />
        </div>
      ) : (
        <>
          {/* Admin KPIs */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '1.25rem',
          }}>
            <KpiCard
              icon={Users}
              label={isHi ? 'अधिकृत उपयोगकर्ता' : 'Authorized Role Accounts'}
              value="8 Roles"
              subtitle="All 8 demo personas provisioned"
              color="#0A2458"
              confidence={100}
            />
            <KpiCard
              icon={Server}
              label={isHi ? 'आर्टिफैक्ट स्वास्थ्य' : 'Artifact Engine Status'}
              value="Healthy (v2026.1)"
              subtitle="Precomputed JSON/GeoJSON online"
              color="#1B5E20"
              confidence={100}
            />
            <KpiCard
              icon={Lock}
              label={isHi ? 'सुरक्षा घटनाएं' : 'Security Violations'}
              value="0 Breaches"
              subtitle="Server-side scope validation active"
              color="#00796B"
              confidence={100}
            />
            <KpiCard
              icon={Activity}
              label={isHi ? 'सिस्टम अपटाइम' : 'API Service Uptime'}
              value="99.98%"
              subtitle="FastAPI + SQLite User DB"
              color="#4A148C"
              confidence={100}
            />
          </div>

          {/* Audit Registry Table */}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={18} color="#0A2458" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1D1E22', margin: 0 }}>
                  {isHi ? 'सुरक्षा एवं भूमिका पहुंच ऑडिट रजिस्ट्री' : 'Security & Role Access Audit Registry'}
                </h3>
              </div>
              <ExportButton data={AUDIT_LOGS} scopeTitle="System Audit Logs" />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #1D1E22', background: '#FAF8F3' }}>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Timestamp</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Actor Account</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Action</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Target Resource</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Client IP</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {AUDIT_LOGS.map((log, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #EAE6DF' }}>
                      <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'monospace', color: '#666' }}>{log.timestamp}</td>
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: '#1D1E22' }}>{log.user}</td>
                      <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'monospace', color: '#0A2458', fontWeight: 700 }}>{log.action}</td>
                      <td style={{ padding: '0.6rem 0.75rem', color: '#555' }}>{log.target}</td>
                      <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'monospace', color: '#777' }}>{log.ip}</td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          background: '#E8F5E9',
                          color: '#2E7D32',
                        }}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
