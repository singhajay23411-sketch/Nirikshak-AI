import React from 'react';
import { Shield, MapPin, Building, Award, User, RefreshCw, CheckCircle2, Lock } from 'lucide-react';
import { useAuth, ROLES } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

// Common constituencies available in MPLADS dataset for MP selector
const DEMO_CONSTITUENCIES = [
  { name: 'Varanasi', state: 'Uttar Pradesh', mp: "Hon'ble MP (Varanasi)" },
  { name: 'Jabalpur', state: 'Madhya Pradesh', mp: "Shri Ashish Dubey" },
  { name: 'Kurnool', state: 'Andhra Pradesh', mp: "Shri Bastipati Nagaraju" },
  { name: 'Patna Sahib', state: 'Bihar', mp: "Shri Ravi Shankar Prasad" },
  { name: 'Lucknow', state: 'Uttar Pradesh', mp: "Shri Rajnath Singh" },
  { name: 'Bangalore South', state: 'Karnataka', mp: "Shri Tejasvi Surya" },
  { name: 'Wayanad', state: 'Kerala', mp: "Smt. Priyanka Gandhi Vadra" },
  { name: 'Baramati', state: 'Maharashtra', mp: "Smt. Supriya Sule" },
  { name: 'Gautam Buddha Nagar', state: 'Uttar Pradesh', mp: "Dr. Mahesh Sharma" },
  { name: 'Indore', state: 'Madhya Pradesh', mp: "Shri Shankar Lalwani" },
];

const ROLE_LABELS = {
  [ROLES.SYSTEM_ADMIN]: { en: 'System Administrator', hi: 'प्रणाली प्रशासक', color: '#0A2458' },
  [ROLES.MOSPI_NATIONAL_OFFICER]: { en: 'MoSPI National Nodal Officer', hi: 'राष्ट्रीय नोडल अधिकारी (MoSPI)', color: '#0A2458' },
  [ROLES.STATE_NODAL_OFFICER]: { en: 'State Nodal Officer', hi: 'राज्य नोडल अधिकारी', color: '#1B5E20' },
  [ROLES.DISTRICT_AUTHORITY]: { en: 'District Authority / Collector', hi: 'जिला प्राधिकरण / कलेक्टर', color: '#E65100' },
  [ROLES.MEMBER_OF_PARLIAMENT]: { en: "Hon'ble Member of Parliament", hi: 'माननीय सांसद', color: '#4A148C' },
  [ROLES.FIELD_INSPECTOR]: { en: 'Field Inspection Engineer', hi: 'क्षेत्र निरीक्षण अभियंता', color: '#006064' },
  [ROLES.AI_RISK_ANALYST]: { en: 'AI Risk Intelligence Analyst', hi: 'AI जोखिम खुफिया विश्लेषक', color: '#311B92' },
  [ROLES.PUBLIC_VIEWER]: { en: 'Public Transparency Portal', hi: 'सार्वजनिक पारदर्शिता पोर्टल', color: '#37474F' },
};

export default function ScopeContextBar({ onConstituencyChange, selectedConstituency }) {
  const { user, isRole } = useAuth();
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const roleMeta = ROLE_LABELS[user?.role] || {
    en: user?.role || 'Authorized Official',
    hi: user?.role || 'अधिकृत अधिकारी',
    color: '#1D1E22',
  };

  const isMp = typeof isRole === 'function' ? isRole(ROLES.MEMBER_OF_PARLIAMENT) : false;
  const isAdmin = typeof isRole === 'function' ? isRole(ROLES.SYSTEM_ADMIN) : false;

  // Scope description
  const getJurisdictionDisplay = () => {
    if (isMp) {
      return selectedConstituency || user?.constituency || 'Varanasi';
    }
    if (user?.district) return `${user.district}, ${user.state || 'India'}`;
    if (user?.state) return `${user.state} (All Districts)`;
    if (user?.projectIds && user.projectIds.length > 0) {
      return `${user.projectIds.length} Assigned Project Sites`;
    }
    return isHi ? 'अखिल भारतीय (राष्ट्रीय अधिकार क्षेत्र)' : 'All-India (National Jurisdiction)';
  };

  return (
    <div style={{
      background: '#FFFDF9',
      borderBottom: '1.5px solid #1D1E22',
      borderTop: '1px solid #E5E0D8',
      padding: '0.65rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '0.75rem',
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)',
    }}>
      {/* Left: Role identity + Scope Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {/* Role Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.25rem 0.65rem',
          borderRadius: '999px',
          background: `${roleMeta.color}15`,
          border: `1px solid ${roleMeta.color}40`,
          color: roleMeta.color,
          fontSize: '0.78rem',
          fontWeight: 700,
        }}>
          <Shield size={13} color={roleMeta.color} />
          <span>{isHi ? roleMeta.hi : roleMeta.en}</span>
        </div>

        {/* Scope Indicator */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.25rem 0.65rem',
          borderRadius: '6px',
          background: '#F4EFE6',
          border: '1px solid #1D1E22',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: '#1D1E22',
        }}>
          <MapPin size={13} color="#1D1E22" />
          <span>
            <strong>{isHi ? 'अधिकार क्षेत्र: ' : 'Scope: '}</strong>
            {getJurisdictionDisplay()}
          </span>
        </div>

        {/* MP Constituency Switcher — Allows MP to map & access any constituency */}
        {isMp && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.2rem 0.5rem',
            borderRadius: '6px',
            background: '#EDE7F6',
            border: '1px solid #5E35B1',
          }}>
            <Building size={13} color="#5E35B1" />
            <label htmlFor="mp-constituency-select" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#4527A0' }}>
              {isHi ? 'संसदीय क्षेत्र बदलें:' : 'Constituency:'}
            </label>
            <select
              id="mp-constituency-select"
              value={selectedConstituency || user?.constituency || 'Varanasi'}
              onChange={(e) => onConstituencyChange && onConstituencyChange(e.target.value)}
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                border: '1px solid #7E57C2',
                borderRadius: '4px',
                background: '#FFF',
                padding: '0.15rem 0.4rem',
                cursor: 'pointer',
                color: '#311B92',
                outline: 'none',
              }}
            >
              {DEMO_CONSTITUENCIES.map(c => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.state})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* House Type & Tenure for MP */}
        {isMp && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            background: '#F0F4F8',
            fontSize: '0.72rem',
            color: '#334E68',
            fontWeight: 600,
          }}>
            <Award size={12} />
            <span>Lok Sabha • 17th / 18th Parliament</span>
          </div>
        )}
      </div>

      {/* Right: Security Classification + Precomputed Artifact Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          fontSize: '0.7rem',
          fontWeight: 700,
          color: '#1B5E20',
          background: '#E8F5E9',
          border: '1px solid #A5D6A7',
          padding: '0.2rem 0.5rem',
          borderRadius: '4px',
        }}>
          <CheckCircle2 size={11} />
          <span>Precomputed Intelligence • v2026.1</span>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          fontSize: '0.68rem',
          fontWeight: 800,
          letterSpacing: '0.04em',
          color: user?.role === ROLES.PUBLIC_VIEWER ? '#37474F' : '#C62828',
          background: user?.role === ROLES.PUBLIC_VIEWER ? '#ECEFF1' : '#FFEBEE',
          border: `1px solid ${user?.role === ROLES.PUBLIC_VIEWER ? '#CFD8DC' : '#FFCDD2'}`,
          padding: '0.2rem 0.5rem',
          borderRadius: '4px',
          textTransform: 'uppercase',
        }}>
          <Lock size={10} />
          <span>{user?.role === ROLES.PUBLIC_VIEWER ? 'Open Public View' : 'Restricted Official Use'}</span>
        </div>
      </div>
    </div>
  );
}
