import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, ToggleLeft, ToggleRight, Key, Trash2, X, ChevronDown, Shield } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const ROLES = [
  { code: 'ADMIN', en: 'Administrator', hi: 'प्रशासक' },
  { code: 'MOSPI_OFFICER', en: 'MoSPI Officer', hi: 'MoSPI अधिकारी' },
  { code: 'STATE_OFFICER', en: 'State Officer', hi: 'राज्य अधिकारी' },
  { code: 'DISTRICT_OFFICER', en: 'District Officer', hi: 'जिला अधिकारी' },
  { code: 'MP', en: "Hon'ble MP", hi: 'माननीय सांसद' },
  { code: 'FIELD_INSPECTOR', en: 'Field Inspector', hi: 'क्षेत्र निरीक्षक' },
  { code: 'ANALYST', en: 'Analyst', hi: 'विश्लेषक' },
  { code: 'VIEWER', en: 'Viewer', hi: 'दर्शक' },
];

const API_BASE = '/api';

const AdminUserManagement = () => {
  const { language } = useLanguage();
  const { token } = useAuth();
  const isHi = language === 'hi';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editUser, setEditUser] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    email: '', username: '', fullName: '', password: '', role: 'VIEWER',
    state: '', district: '', projectIds: '',
  });

  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

const DEFAULT_DEMO_USERS = [
  { id: 1, email: 'admin@nirikshak.gov.in', username: 'admin', fullName: 'National Nodal Administrator', role: 'ADMIN', state: null, district: null, is_active: true, created_at: '2026-01-15' },
  { id: 2, email: 'mospi.nodal@nirikshak.gov.in', username: 'mospi_officer', fullName: 'Dr. Ramesh Sharma (MoSPI)', role: 'MOSPI_OFFICER', state: null, district: null, is_active: true, created_at: '2026-02-01' },
  { id: 3, email: 'state.bihar@nirikshak.gov.in', username: 'state_bihar', fullName: 'Shri Anand Verma (State Nodal Bihar)', role: 'STATE_OFFICER', state: 'Bihar', district: null, is_active: true, created_at: '2026-02-10' },
  { id: 4, email: 'dc.kurnool@nirikshak.gov.in', username: 'dc_kurnool', fullName: 'Smt. G. Srijana IAS (District Collector)', role: 'DISTRICT_OFFICER', state: 'Andhra Pradesh', district: 'Kurnool', is_active: true, created_at: '2026-02-15' },
  { id: 5, email: 'inspector.north@nirikshak.gov.in', username: 'inspector_north', fullName: 'Er. Rajesh Kumar (Site Inspector)', role: 'FIELD_INSPECTOR', state: 'Bihar', district: 'Patna', is_active: true, created_at: '2026-03-01' },
  { id: 6, email: 'analyst.ai@nirikshak.gov.in', username: 'analyst_ai', fullName: 'Priya Sundaram (Lead AI Risk Analyst)', role: 'ANALYST', state: null, district: null, is_active: true, created_at: '2026-03-05' },
];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/users`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users && data.users.length > 0 ? data.users : DEFAULT_DEMO_USERS);
      } else {
        setUsers(DEFAULT_DEMO_USERS);
      }
    } catch (e) {
      console.warn('Using default demo users:', e);
      setUsers(DEFAULT_DEMO_USERS);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreateUser = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setFormData({ email: '', username: '', fullName: '', password: '', role: 'VIEWER', state: '', district: '', projectIds: '' });
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.detail || 'Failed to create user');
      }
    } catch (e) { alert('Error creating user'); }
  };

  const handleToggleActive = async (userId, currentActive) => {
    await fetch(`${API_BASE}/admin/users/${userId}`, {
      method: 'PUT', headers: authHeaders,
      body: JSON.stringify({ isActive: !currentActive }),
    });
    fetchUsers();
  };

  const handleResetPassword = async (userId) => {
    const newPw = prompt(isHi ? 'नया पासवर्ड दर्ज करें:' : 'Enter new password:');
    if (!newPw || newPw.length < 6) { alert(isHi ? 'पासवर्ड कम से कम 6 अक्षर का होना चाहिए' : 'Password must be at least 6 characters'); return; }
    await fetch(`${API_BASE}/admin/users/${userId}/reset-password`, {
      method: 'POST', headers: authHeaders,
      body: JSON.stringify({ password: newPw }),
    });
    alert(isHi ? 'पासवर्ड रीसेट हो गया' : 'Password reset successfully');
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = !searchQuery ||
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !filterRole || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleLabel = (code) => {
    const r = ROLES.find(x => x.code === code);
    return r ? (isHi ? r.hi : r.en) : code;
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.6rem', color: '#1D1E22', marginBottom: '0.25rem' }}>
            {isHi ? 'उपयोगकर्ता प्रबंधन' : 'User Management'}
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
            {isHi ? `${users.length} पंजीकृत उपयोगकर्ता` : `${users.length} registered users`}
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-teal" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', gap: '0.4rem' }}>
          <Plus size={16} />
          {isHi ? 'नया उपयोगकर्ता' : 'Create User'}
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isHi ? 'नाम या ईमेल खोजें...' : 'Search by name or email...'}
            style={{
              width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.5rem',
              border: '1.5px solid var(--color-border-dark)', borderRadius: 'var(--radius-md)',
              fontSize: '0.88rem', fontFamily: 'var(--font-sans)', background: '#FFF',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <select
          value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
          style={{
            padding: '0.6rem 0.75rem', border: '1.5px solid var(--color-border-dark)',
            borderRadius: 'var(--radius-md)', fontSize: '0.85rem', fontFamily: 'var(--font-sans)',
            background: '#FFF', cursor: 'pointer', minWidth: '160px',
          }}
        >
          <option value="">{isHi ? 'सभी भूमिकाएं' : 'All Roles'}</option>
          {ROLES.map(r => <option key={r.code} value={r.code}>{isHi ? r.hi : r.en}</option>)}
        </select>
      </div>

      {/* Users Table */}
      <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', fontFamily: 'var(--font-sans)' }}>
          <thead>
            <tr style={{ background: 'var(--color-bg-card-sand)', borderBottom: '1.5px solid #1D1E22' }}>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#4A4D55' }}>{isHi ? 'नाम' : 'Name'}</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#4A4D55' }}>{isHi ? 'ईमेल' : 'Email'}</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#4A4D55' }}>{isHi ? 'भूमिका' : 'Role'}</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#4A4D55' }}>{isHi ? 'क्षेत्राधिकार' : 'Jurisdiction'}</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#4A4D55' }}>{isHi ? 'स्थिति' : 'Status'}</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#4A4D55' }}>{isHi ? 'कार्य' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>{isHi ? 'लोड हो रहा है...' : 'Loading...'}</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>{isHi ? 'कोई उपयोगकर्ता नहीं मिला' : 'No users found'}</td></tr>
            ) : filteredUsers.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <td style={{ padding: '0.7rem 1rem', fontWeight: 600 }}>{u.fullName}</td>
                <td style={{ padding: '0.7rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>{u.email}</td>
                <td style={{ padding: '0.7rem 1rem' }}>
                  <span style={{
                    padding: '0.2rem 0.55rem', background: 'var(--color-accent-teal)',
                    borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 700, color: '#1D1E22',
                    border: '1px solid rgba(29,30,34,0.15)',
                  }}>
                    {getRoleLabel(u.role)}
                  </span>
                </td>
                <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                  {u.district && u.state ? `${u.district}, ${u.state}` : u.state || (isHi ? 'राष्ट्रीय' : 'National')}
                </td>
                <td style={{ padding: '0.7rem 1rem', textAlign: 'center' }}>
                  <button
                    onClick={() => handleToggleActive(u.id, u.isActive)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', width: '100%' }}
                    title={u.isActive ? (isHi ? 'निष्क्रिय करें' : 'Deactivate') : (isHi ? 'सक्रिय करें' : 'Activate')}
                  >
                    {u.isActive ? <ToggleRight size={22} color="var(--color-accent-teal)" /> : <ToggleLeft size={22} color="var(--color-text-muted)" />}
                  </button>
                </td>
                <td style={{ padding: '0.7rem 1rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                    <button onClick={() => handleResetPassword(u.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.3rem', color: '#E5B842' }} title={isHi ? 'पासवर्ड रीसेट' : 'Reset Password'}>
                      <Key size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <>
          <div onClick={() => setShowCreateModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)',
            boxShadow: '4px 6px 0px #1D1E22', width: '480px', maxHeight: '80vh', overflow: 'auto',
            padding: '2rem', zIndex: 201,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.25rem' }}>
                {isHi ? 'नया अधिकारी बनाएं' : 'Create Official User'}
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { key: 'fullName', label: isHi ? 'पूरा नाम' : 'Full Name', type: 'text' },
                { key: 'email', label: isHi ? 'आधिकारिक ईमेल' : 'Official Email', type: 'email' },
                { key: 'username', label: isHi ? 'उपयोगकर्ता ID' : 'Username', type: 'text' },
                { key: 'password', label: isHi ? 'प्रारंभिक पासवर्ड' : 'Initial Password', type: 'password' },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>{label}</label>
                  <input
                    type={type} value={formData[key]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    style={{
                      width: '100%', padding: '0.6rem 0.75rem',
                      border: '1.5px solid var(--color-border-dark)', borderRadius: 'var(--radius-sm)',
                      fontSize: '0.88rem', fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>{isHi ? 'भूमिका' : 'Role'}</label>
                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', border: '1.5px solid var(--color-border-dark)', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }}>
                  {ROLES.map(r => <option key={r.code} value={r.code}>{isHi ? r.hi : r.en}</option>)}
                </select>
              </div>

              {['STATE_OFFICER', 'DISTRICT_OFFICER', 'FIELD_INSPECTOR'].includes(formData.role) && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>{isHi ? 'राज्य' : 'State'}</label>
                    <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder={isHi ? 'उदा. मध्य प्रदेश' : 'e.g. Madhya Pradesh'}
                      style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1.5px solid var(--color-border-dark)', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }} />
                  </div>
                  {['DISTRICT_OFFICER', 'FIELD_INSPECTOR'].includes(formData.role) && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>{isHi ? 'जिला' : 'District'}</label>
                      <input type="text" value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        placeholder={isHi ? 'उदा. जबलपुर' : 'e.g. Jabalpur'}
                        style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1.5px solid var(--color-border-dark)', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }} />
                    </div>
                  )}
                </>
              )}

              <button onClick={handleCreateUser} className="btn-teal" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                <Shield size={16} />
                {isHi ? 'उपयोगकर्ता बनाएं' : 'Create User'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminUserManagement;
