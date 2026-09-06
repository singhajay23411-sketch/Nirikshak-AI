import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, User, ChevronDown, Shield, BarChart3, Map, 
  FileText, Search, Users, Database, Activity, Cpu, 
  Eye, ClipboardCheck, Camera, Sparkles 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth, ROLES } from '../../context/AuthContext';
import LanguageSwitcher from '../LanguageSwitcher';
import ScopeContextBar from './ScopeContextBar';

// Import dedicated role dashboards
import MospiNationalDashboard from './roles/MospiNationalDashboard';
import StateNodalDashboard from './roles/StateNodalDashboard';
import DistrictAuthorityDashboard from './roles/DistrictAuthorityDashboard';
import MemberOfParliamentDashboard from './roles/MemberOfParliamentDashboard';
import FieldInspectorDashboard from './roles/FieldInspectorDashboard';
import AiRiskAnalystDashboard from './roles/AiRiskAnalystDashboard';
import SystemAdminDashboard from './roles/SystemAdminDashboard';
import PublicViewerDashboard from './roles/PublicViewerDashboard';

// Canonical role navigation configs
const ROLE_NAV_CONFIG = {
  [ROLES.SYSTEM_ADMIN]: [
    { id: 'overview', icon: BarChart3, en: 'System Overview', hi: 'प्रणाली अवलोकन' },
    { id: 'users', icon: Users, en: 'User Management', hi: 'उपयोगकर्ता प्रबंधन' },
    { id: 'audit', icon: Shield, en: 'Audit Registry', hi: 'ऑडिट रजिस्ट्री' },
    { id: 'models', icon: Cpu, en: 'Model Pipeline', hi: 'मॉडल पाइपलाइन' },
  ],
  [ROLES.MOSPI_NATIONAL_OFFICER]: [
    { id: 'overview', icon: BarChart3, en: 'National Overview', hi: 'राष्ट्रीय अवलोकन' },
    { id: 'states', icon: Map, en: 'State Watchlist', hi: 'राज्य निगरानी' },
    { id: 'risk', icon: Shield, en: 'Risk Engine', hi: 'जोखिम इंजन' },
    { id: 'reports', icon: FileText, en: 'Audit Reports', hi: 'ऑडिट रिपोर्ट' },
  ],
  [ROLES.STATE_NODAL_OFFICER]: [
    { id: 'overview', icon: BarChart3, en: 'State Overview', hi: 'राज्य अवलोकन' },
    { id: 'districts', icon: Map, en: 'District Progress', hi: 'जिला प्रगति' },
    { id: 'evidence', icon: Camera, en: 'Evidence Queue', hi: 'साक्ष्य कतार' },
    { id: 'reports', icon: FileText, en: 'Reports', hi: 'रिपोर्ट' },
  ],
  [ROLES.DISTRICT_AUTHORITY]: [
    { id: 'overview', icon: BarChart3, en: 'District Projects', hi: 'जिला परियोजनाएं' },
    { id: 'verification', icon: ClipboardCheck, en: 'Verification Roster', hi: 'सत्यापन रोस्टर' },
    { id: 'cases', icon: Search, en: 'Inquiry Cases', hi: 'जांच मामले' },
    { id: 'reports', icon: FileText, en: 'Reports', hi: 'रिपोर्ट' },
  ],
  [ROLES.MEMBER_OF_PARLIAMENT]: [
    { id: 'overview', icon: BarChart3, en: 'MP Scorecard', hi: 'सांसद स्कोरकार्ड' },
    { id: 'projects', icon: Database, en: 'Constituency Works', hi: 'संसदीय कार्य' },
    { id: 'finance', icon: Activity, en: 'Fund Velocity', hi: 'निधि प्रवाह' },
    { id: 'reports', icon: FileText, en: 'Progress Report', hi: 'प्रगति रिपोर्ट' },
  ],
  [ROLES.FIELD_INSPECTOR]: [
    { id: 'overview', icon: Database, en: 'Assigned Sites', hi: 'आवंटित स्थल' },
    { id: 'verification', icon: ClipboardCheck, en: 'Site Checklist', hi: 'स्थल चेकलिस्ट' },
    { id: 'evidence', icon: Camera, en: 'Geotag Photos', hi: 'जियो-टैग फोटो' },
  ],
  [ROLES.AI_RISK_ANALYST]: [
    { id: 'overview', icon: Cpu, en: 'Model Diagnostics', hi: 'मॉडल डायग्नोस्टिक्स' },
    { id: 'anomalies', icon: Shield, en: 'Anomaly Clusters', hi: 'विसंगति क्लस्टर' },
    { id: 'benchmarks', icon: BarChart3, en: 'Cost Benchmarks', hi: 'लागत मानदंड' },
  ],
  [ROLES.PUBLIC_VIEWER]: [
    { id: 'overview', icon: BarChart3, en: 'Civic Transparency', hi: 'नागरिक पारदर्शिता' },
    { id: 'works', icon: Database, en: 'Public Works', hi: 'सार्वजनिक कार्य' },
  ],
};

// Fallback legacy mapping
const LEGACY_ROLE_MAP = {
  ADMIN: ROLES.SYSTEM_ADMIN,
  MOSPI_OFFICER: ROLES.MOSPI_NATIONAL_OFFICER,
  STATE_OFFICER: ROLES.STATE_NODAL_OFFICER,
  DISTRICT_OFFICER: ROLES.DISTRICT_AUTHORITY,
  MP: ROLES.MEMBER_OF_PARLIAMENT,
  VIEWER: ROLES.PUBLIC_VIEWER,
  ANALYST: ROLES.AI_RISK_ANALYST,
};

export default function RoleDashboardLayout({ onLogout }) {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user, logout, isRole } = useAuth();

  const isHi = language === 'hi';
  const isAdmin = typeof isRole === 'function' ? isRole(ROLES.SYSTEM_ADMIN) : false;

  // Active role resolution
  const userCanonicalRole = LEGACY_ROLE_MAP[user?.role] || user?.role || ROLES.MOSPI_NATIONAL_OFFICER;
  const [activePreviewRole, setActivePreviewRole] = useState(userCanonicalRole);
  const [activeTab, setActiveTab] = useState('overview');
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (userCanonicalRole) {
      setActivePreviewRole(userCanonicalRole);
    }
  }, [userCanonicalRole]);

  // Dynamic MP constituency state
  const [selectedConstituency, setSelectedConstituency] = useState(user?.constituency || 'Varanasi');

  // Effective role to display
  const effectiveRole = isAdmin ? activePreviewRole : userCanonicalRole;
  const navItems = ROLE_NAV_CONFIG[effectiveRole] || ROLE_NAV_CONFIG[ROLES.MOSPI_NATIONAL_OFFICER];

  const handleLogout = () => {
    logout();
    if (onLogout) onLogout();
    else navigate('/login');
  };

  // Render role-specific dashboard
  const renderDashboardContent = () => {
    switch (effectiveRole) {
      case ROLES.SYSTEM_ADMIN:
        return <SystemAdminDashboard activeTab={activeTab} />;
      case ROLES.MOSPI_NATIONAL_OFFICER:
        return <MospiNationalDashboard activeTab={activeTab} />;
      case ROLES.STATE_NODAL_OFFICER:
        return <StateNodalDashboard />;
      case ROLES.DISTRICT_AUTHORITY:
        return <DistrictAuthorityDashboard />;
      case ROLES.MEMBER_OF_PARLIAMENT:
        return (
          <MemberOfParliamentDashboard
            selectedConstituency={selectedConstituency}
            onConstituencyChange={setSelectedConstituency}
          />
        );
      case ROLES.FIELD_INSPECTOR:
        return <FieldInspectorDashboard activeTab={activeTab} />;
      case ROLES.AI_RISK_ANALYST:
        return <AiRiskAnalystDashboard />;
      case ROLES.PUBLIC_VIEWER:
        return <PublicViewerDashboard />;
      default:
        return <MospiNationalDashboard activeTab={activeTab} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-light, #FAF8F3)', display: 'flex', flexDirection: 'column' }}>
      {/* Main Top Header */}
      <header style={{
        background: '#FFFFFF',
        borderBottom: '1.5px solid #1D1E22',
        padding: '0 1.5rem',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Left: Brand Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            onClick={() => navigate('/')}
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '1.05rem',
              fontWeight: 900,
              letterSpacing: '0.08em',
              color: '#1D1E22',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Shield size={18} color="#0A2458" />
            <span>NIRIKSHΛK ΛI</span>
          </div>

          {/* Admin Persona Simulator / View Switcher (Only visible to SYSTEM_ADMIN) */}
          {isAdmin && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: '#FFF3E0',
              padding: '0.25rem 0.6rem',
              borderRadius: '6px',
              border: '1px solid #E65100',
            }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#E65100', textTransform: 'uppercase' }}>
                Admin Preview:
              </span>
              <select
                value={activePreviewRole}
                onChange={(e) => { setActivePreviewRole(e.target.value); setActiveTab('overview'); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#1D1E22',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value={ROLES.SYSTEM_ADMIN}>System Administrator</option>
                <option value={ROLES.MOSPI_NATIONAL_OFFICER}>MoSPI National Officer</option>
                <option value={ROLES.STATE_NODAL_OFFICER}>State Nodal Officer</option>
                <option value={ROLES.DISTRICT_AUTHORITY}>District Authority</option>
                <option value={ROLES.MEMBER_OF_PARLIAMENT}>Member of Parliament</option>
                <option value={ROLES.FIELD_INSPECTOR}>Field Inspector</option>
                <option value={ROLES.AI_RISK_ANALYST}>AI Risk Analyst</option>
                <option value={ROLES.PUBLIC_VIEWER}>Public Citizen</option>
              </select>
            </div>
          )}
        </div>

        {/* Center: Dynamic Role Navigation Tabs */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          height: '100%',
          overflowX: 'auto',
        }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.85rem',
                  background: isActive ? 'var(--color-accent-teal, #52B79A)' : 'transparent',
                  border: isActive ? '1.5px solid #1D1E22' : '1px solid transparent',
                  borderRadius: '999px',
                  color: '#1D1E22',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? 800 : 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? '1.5px 2px 0px #1D1E22' : 'none',
                }}
              >
                <Icon size={14} />
                <span>{isHi ? item.hi : item.en}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Language + User Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <LanguageSwitcher />

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.8rem',
                background: '#FAF8F3',
                border: '1.5px solid #1D1E22',
                borderRadius: '999px',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#1D1E22',
                boxShadow: '1px 1.5px 0px #1D1E22',
              }}
            >
              <User size={15} />
              <span>{user?.fullName?.split(' ')[0] || 'Official'}</span>
              <ChevronDown size={13} />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                background: '#FFFFFF',
                border: '1.5px solid #1D1E22',
                borderRadius: '8px',
                boxShadow: '3px 4px 0px #1D1E22',
                minWidth: '220px',
                zIndex: 200,
                overflow: 'hidden',
              }}>
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #EAE6DF', background: '#FAF8F3' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#1D1E22' }}>
                    {user?.fullName || 'Logged In Official'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#666', marginTop: '0.15rem' }}>
                    {user?.email || 'official@nirikshak.gov.in'}
                  </div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#0A2458', marginTop: '0.35rem' }}>
                    Role: {userCanonicalRole}
                  </div>
                </div>

                <div style={{ padding: '0.4rem' }}>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      border: 'none',
                      background: 'transparent',
                      color: '#C62828',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      borderRadius: '4px',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#FFEBEE'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={14} />
                    <span>{isHi ? 'लॉग आउट' : 'Sign Out of Nirikshak'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Scope Context Bar */}
      <ScopeContextBar
        selectedConstituency={selectedConstituency}
        onConstituencyChange={setSelectedConstituency}
      />

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        maxWidth: '1440px',
        width: '100%',
        margin: '0 auto',
        padding: '1.5rem',
      }}>
        {renderDashboardContent()}
      </main>
    </div>
  );
}
