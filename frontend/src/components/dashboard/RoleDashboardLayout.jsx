import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, ChevronDown, Shield, BarChart3, Map, FileText, Search, Users, Database, Activity, Cpu, Eye, ClipboardCheck, Camera, Settings } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import LanguageSwitcher from '../LanguageSwitcher';
import AdminUserManagement from './AdminUserManagement';
import FieldInspectorVerification from './FieldInspectorVerification';
import RoleOverviewPanels from './RoleOverviewPanels';

const ROLE_NAV_CONFIG = {
  ADMIN: [
    { id: 'overview', icon: BarChart3, en: 'Overview', hi: 'अवलोकन' },
    { id: 'users', icon: Users, en: 'User Management', hi: 'उपयोगकर्ता प्रबंधन' },
    { id: 'projects', icon: Database, en: 'Projects', hi: 'परियोजनाएं' },
    { id: 'risk', icon: Shield, en: 'Risk Engine', hi: 'जोखिम इंजन' },
    { id: 'map', icon: Map, en: 'Geospatial', hi: 'भू-स्थानिक' },
    { id: 'reports', icon: FileText, en: 'Reports', hi: 'रिपोर्ट' },
    { id: 'audit', icon: Eye, en: 'Audit Logs', hi: 'ऑडिट लॉग' },
  ],
  MOSPI_OFFICER: [
    { id: 'overview', icon: BarChart3, en: 'National Overview', hi: 'राष्ट्रीय अवलोकन' },
    { id: 'states', icon: Map, en: 'State Comparisons', hi: 'राज्य तुलना' },
    { id: 'risk', icon: Shield, en: 'Risk Intelligence', hi: 'जोखिम खुफिया' },
    { id: 'investigation', icon: Search, en: 'Investigations', hi: 'जांच' },
    { id: 'reports', icon: FileText, en: 'Reports', hi: 'रिपोर्ट' },
  ],
  STATE_OFFICER: [
    { id: 'overview', icon: BarChart3, en: 'State Overview', hi: 'राज्य अवलोकन' },
    { id: 'districts', icon: Map, en: 'District Breakdown', hi: 'जिला विश्लेषण' },
    { id: 'finance', icon: Activity, en: 'Financial Utilization', hi: 'वित्तीय उपयोग' },
    { id: 'evidence', icon: Camera, en: 'Evidence Queue', hi: 'साक्ष्य कतार' },
    { id: 'reports', icon: FileText, en: 'Reports', hi: 'रिपोर्ट' },
  ],
  DISTRICT_OFFICER: [
    { id: 'overview', icon: BarChart3, en: 'District Projects', hi: 'जिला परियोजनाएं' },
    { id: 'delayed', icon: Activity, en: 'Delayed Projects', hi: 'विलंबित परियोजनाएं' },
    { id: 'verification', icon: ClipboardCheck, en: 'Verification Queue', hi: 'सत्यापन कतार' },
    { id: 'cases', icon: Search, en: 'Case Management', hi: 'मामला प्रबंधन' },
    { id: 'reports', icon: FileText, en: 'Reports', hi: 'रिपोर्ट' },
  ],
  MP: [
    { id: 'overview', icon: BarChart3, en: 'MP Scorecard', hi: 'सांसद स्कोरकार्ड' },
    { id: 'projects', icon: Database, en: 'My Constituency Projects', hi: 'मेरी निर्वाचन क्षेत्र परियोजनाएं' },
    { id: 'finance', icon: Activity, en: 'Fund Utilization', hi: 'निधि उपयोग' },
    { id: 'risk', icon: Shield, en: 'Risk Alerts', hi: 'जोखिम चेतावनी' },
    { id: 'map', icon: Map, en: 'Geospatial', hi: 'भू-स्थानिक' },
    { id: 'reports', icon: FileText, en: 'Reports', hi: 'रिपोर्ट' },
  ],
  FIELD_INSPECTOR: [
    { id: 'overview', icon: Database, en: 'My Projects', hi: 'मेरी परियोजनाएं' },
    { id: 'verification', icon: ClipboardCheck, en: 'Site Verification', hi: 'स्थल सत्यापन' },
    { id: 'evidence', icon: Camera, en: 'Photo Evidence', hi: 'फोटो साक्ष्य' },
    { id: 'reports', icon: FileText, en: 'Inspection Reports', hi: 'निरीक्षण रिपोर्ट' },
  ],
  ANALYST: [
    { id: 'overview', icon: Cpu, en: 'AI Models', hi: 'AI मॉडल' },
    { id: 'anomalies', icon: Shield, en: 'Anomaly Detection', hi: 'विसंगति पहचान' },
    { id: 'benchmarks', icon: BarChart3, en: 'Cost Benchmarks', hi: 'लागत मानदंड' },
    { id: 'trends', icon: Activity, en: 'Trends', hi: 'रुझान' },
    { id: 'reports', icon: FileText, en: 'Export', hi: 'निर्यात' },
  ],
  VIEWER: [
    { id: 'overview', icon: BarChart3, en: 'Dashboard', hi: 'डैशबोर्ड' },
    { id: 'projects', icon: Database, en: 'Projects', hi: 'परियोजनाएं' },
    { id: 'risk', icon: Shield, en: 'Risk Overview', hi: 'जोखिम अवलोकन' },
    { id: 'map', icon: Map, en: 'Map', hi: 'मानचित्र' },
    { id: 'reports', icon: FileText, en: 'Reports', hi: 'रिपोर्ट' },
  ],
};

const RoleDashboardLayout = ({ onLogout }) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isHi = language === 'hi';
  const role = user?.role || 'VIEWER';
  const navItems = ROLE_NAV_CONFIG[role] || ROLE_NAV_CONFIG.VIEWER;

  const handleLogout = () => {
    logout();
    if (onLogout) {
      onLogout();
    } else {
      navigate('/');
    }
  };

  const getRoleLabel = () => {
    const labels = user?.roleLabel;
    if (labels) return isHi ? labels.hi : labels.en;
    return role;
  };

  const getScopeLabel = () => {
    if (user?.district && user?.state) return `${user.district}, ${user.state}`;
    if (user?.state) return user.state;
    return isHi ? 'राष्ट्रीय' : 'National';
  };

  // Render active panel content
  const renderContent = () => {
    if (role === 'ADMIN' && activeTab === 'users') {
      return <AdminUserManagement />;
    }
    if (role === 'FIELD_INSPECTOR' && (activeTab === 'verification' || activeTab === 'evidence')) {
      return <FieldInspectorVerification activeTab={activeTab} />;
    }
    return <RoleOverviewPanels role={role} activeTab={activeTab} user={user} />;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-light)', display: 'flex', flexDirection: 'column' }}>
      {/* Dashboard Header */}
      <header style={{
        background: '#FFFFFF',
        borderBottom: '1.5px solid #1D1E22',
        padding: '0 2rem',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Left: Brand + Role Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '1rem',
            fontWeight: 900,
            letterSpacing: '0.1em',
            color: '#1D1E22',
          }}>
            NIRIKSHΛK ΛI
          </div>
          <div style={{
            padding: '0.25rem 0.7rem',
            background: 'var(--color-accent-teal)',
            border: '1px solid #1D1E22',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.72rem',
            fontWeight: 700,
            color: '#1D1E22',
            letterSpacing: '0.04em',
          }}>
            {getRoleLabel()}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            {getScopeLabel()}
          </span>
        </div>

        {/* Center: Navigation Tabs */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          height: '100%',
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
                  background: isActive ? 'var(--color-accent-teal)' : 'transparent',
                  border: isActive ? '1px solid #1D1E22' : '1px solid transparent',
                  borderRadius: 'var(--radius-full)',
                  color: '#1D1E22',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? 700 : 500,
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease, border-color 0.15s ease',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? '1px 1.5px 0px #1D1E22' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'var(--color-bg-card-sand)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <Icon size={14} />
                <span>{isHi ? item.hi : item.en}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Language + User Profile */}
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
                background: 'var(--color-bg-card-sand)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#1D1E22',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <User size={15} />
              <span>{user?.fullName?.split(' ')[0] || 'User'}</span>
              <ChevronDown size={13} />
            </button>

            {showUserMenu && (
              <>
                <div
                  onClick={() => setShowUserMenu(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                />
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 0.5rem)',
                  background: '#FFFFFF',
                  border: '1.5px solid #1D1E22',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '3px 4px 0px #1D1E22',
                  width: '260px',
                  padding: '1rem',
                  zIndex: 100,
                }}>
                  <div style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1D1E22' }}>{user?.fullName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>{user?.email}</div>
                    <div style={{
                      marginTop: '0.4rem',
                      padding: '0.2rem 0.5rem',
                      background: 'var(--color-accent-teal)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      display: 'inline-block',
                      color: '#1D1E22',
                    }}>
                      {getRoleLabel()} — {getScopeLabel()}
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      background: 'transparent',
                      border: '1px solid var(--color-accent-red)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--color-accent-red)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#FEF2F2';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <LogOut size={15} />
                    {isHi ? 'लॉगआउट' : 'Sign Out'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {renderContent()}
      </main>
    </div>
  );
};

export default RoleDashboardLayout;
