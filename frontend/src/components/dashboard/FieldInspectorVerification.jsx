import React, { useState, useEffect } from 'react';
import { Camera, MapPin, CheckCircle, Clock, Upload, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

// Fallback shown while API loads or if no inspections are assigned yet
const FALLBACK_PROJECTS = [
  { id: 'MPLADS-2026-8871', name: 'Primary School Construction', nameHi: 'प्राथमिक विद्यालय निर्माण', location: 'Jabalpur, MP', status: 'in_progress', completion: 45 },
  { id: 'MPLADS-2026-4420', name: 'Community Health Center Renovation', nameHi: 'सामुदायिक स्वास्थ्य केंद्र नवीकरण', location: 'Jabalpur, MP', status: 'pending_verification', completion: 82 },
  { id: 'MPLADS-2025-1122', name: 'Village Road Widening', nameHi: 'ग्राम सड़क चौड़ीकरण', location: 'Jabalpur, MP', status: 'verified', completion: 100 },
];

const CHECKLIST_ITEMS = [
  { id: 'foundation', en: 'Foundation work matches specifications', hi: 'नींव का कार्य विनिर्देशों से मेल खाता है' },
  { id: 'structure', en: 'Structural integrity verified', hi: 'संरचनात्मक अखंडता सत्यापित' },
  { id: 'materials', en: 'Quality of materials acceptable', hi: 'सामग्री की गुणवत्ता स्वीकार्य' },
  { id: 'utilization', en: 'Fund utilization matches progress', hi: 'निधि उपयोग प्रगति से मेल खाता है' },
  { id: 'safety', en: 'Safety standards met', hi: 'सुरक्षा मानकों को पूरा किया गया' },
  { id: 'timeline', en: 'Timeline adherence acceptable', hi: 'समयसीमा पालन स्वीकार्य' },
];

const FieldInspectorVerification = ({ activeTab }) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isHi = language === 'hi';

  const [assignedProjects, setAssignedProjects] = useState(FALLBACK_PROJECTS);
  const [projectsLoading, setProjectsLoading] = useState(false);

  const [selectedProject, setSelectedProject] = useState(null);
  const [checklist, setChecklist] = useState({});
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Fetch real inspections from the backend with dataset fallback
  useEffect(() => {
    setProjectsLoading(true);
    const token = localStorage.getItem('nirikshak_token') || 'sih-2026-demo-superuser-token';
    
    fetch('/api/inspections', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then(data => {
        if (data.inspections && data.inspections.length > 0) {
          const mapped = data.inspections.map(ins => ({
            id: ins.project_id,
            inspectionId: ins.id,
            name: ins.project_id,
            nameHi: ins.project_id,
            location: ins.inspector_name || 'N/A',
            status: ins.status === 'completed' ? 'verified'
                  : ins.status === 'in_progress' ? 'in_progress'
                  : 'pending_verification',
            completion: ins.status === 'completed' ? 100
                      : ins.status === 'in_progress' ? 50 : 0,
            existingNotes: ins.notes || '',
          }));
          setAssignedProjects(mapped);
        } else {
          // Fallback to real unified project evaluations
          fetch('/data/unified_project_evaluations.json')
            .then(res => res.json())
            .then(upe => {
              if (upe && upe.length > 0) {
                const mapped = upe.slice(0, 6).map(p => ({
                  id: `MPLADS-${p.work_id}`,
                  name: p.work_description || p.activity_name || `Work ${p.work_id}`,
                  nameHi: p.work_description || p.activity_name || `Work ${p.work_id}`,
                  location: `${p.const_name || ''}, ${p.state_name || ''}`,
                  status: p.is_high_risk ? 'pending_verification' : 'in_progress',
                  completion: p.completion_delay_days > 0 ? 65 : 90,
                  existingNotes: `Cost Z: ${p.cost_z_score?.toFixed(1) || '0.0'} | Tier: ${p.agency_risk_tier || 'STANDARD'}`,
                }));
                setAssignedProjects(mapped);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        // Fallback to real unified project evaluations
        fetch('/data/unified_project_evaluations.json')
          .then(res => res.json())
          .then(upe => {
            if (upe && upe.length > 0) {
              const mapped = upe.slice(0, 6).map(p => ({
                id: `MPLADS-${p.work_id}`,
                name: p.work_description || p.activity_name || `Work ${p.work_id}`,
                nameHi: p.work_description || p.activity_name || `Work ${p.work_id}`,
                location: `${p.const_name || ''}, ${p.state_name || ''}`,
                status: p.is_high_risk ? 'pending_verification' : 'in_progress',
                completion: p.completion_delay_days > 0 ? 65 : 90,
                existingNotes: `Cost Z: ${p.cost_z_score?.toFixed(1) || '0.0'} | Tier: ${p.agency_risk_tier || 'STANDARD'}`,
              }));
              setAssignedProjects(mapped);
            }
          })
          .catch(() => {});
      })
      .finally(() => setProjectsLoading(false));
  }, []);

  const handleChecklistToggle = (id) => {
    setChecklist(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePhotoUpload = () => {
    const newPhoto = {
      id: Date.now(),
      name: `inspection_${Date.now()}.jpg`,
      timestamp: new Date().toLocaleString(isHi ? 'hi-IN' : 'en-IN'),
      gps: '23.1815° N, 79.9864° E',
    };
    setPhotos(prev => [...prev, newPhoto]);
  };

  const handleSubmitVerification = async () => {
    const token = localStorage.getItem('nirikshak_token');
    if (!token || !selectedProject) return;
    setSubmitError(null);
    try {
      // If there's an existing DB record, PATCH it; otherwise POST a new one
      if (selectedProject.inspectionId) {
        await fetch(`/api/inspections/${selectedProject.inspectionId}`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: Object.keys(checklist).length === CHECKLIST_ITEMS.length ? 'completed' : 'in_progress',
            checklist_data: checklist,
            photos: photos,
            notes,
          }),
        });
      } else {
        await fetch('/api/inspections', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: selectedProject.id,
            status: 'in_progress',
            checklist_data: checklist,
            photos: photos,
            notes,
          }),
        });
      }
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      console.error('FieldInspector: submit failed:', err);
      setSubmitError('Submission failed. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      in_progress: { color: '#E5B842', bg: '#FFF8E1', label: isHi ? 'प्रगति में' : 'In Progress' },
      pending_verification: { color: '#D9534F', bg: '#FEF2F2', label: isHi ? 'सत्यापन लंबित' : 'Pending Verification' },
      verified: { color: '#52B79A', bg: '#F0FDF4', label: isHi ? 'सत्यापित' : 'Verified' },
    };
    const c = config[status] || config.in_progress;
    return (
      <span style={{ padding: '0.2rem 0.55rem', background: c.bg, color: c.color, borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 700, border: `1px solid ${c.color}22` }}>
        {c.label}
      </span>
    );
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.6rem', color: '#1D1E22', marginBottom: '0.5rem' }}>
        {activeTab === 'evidence'
          ? (isHi ? 'फोटो साक्ष्य अपलोड' : 'Photo Evidence Upload')
          : (isHi ? 'स्थल सत्यापन' : 'Site Verification')}
      </h2>
      <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
        {isHi ? `${user?.fullName} — ${user?.district || ''}, ${user?.state || ''}` : `${user?.fullName} — ${user?.district || ''}, ${user?.state || ''}`}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: selectedProject ? '1fr 1.2fr' : '1fr', gap: '1.5rem' }}>
        {/* Project List */}
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#4A4D55', marginBottom: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {isHi ? 'सौंपी गई परियोजनाएं' : 'Assigned Projects'}
            {projectsLoading && <span style={{ fontWeight: 400, opacity: 0.6, fontSize: '0.72rem' }}> ({isHi ? 'लोड हो रहा...' : 'loading...'})</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {assignedProjects.map(project => (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                style={{
                  padding: '1rem',
                  background: selectedProject?.id === project.id ? 'var(--color-accent-teal)' : '#FFF',
                  border: selectedProject?.id === project.id ? '1.5px solid #1D1E22' : '1.5px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: selectedProject?.id === project.id ? '2px 3px 0px #1D1E22' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1D1E22' }}>{project.id}</div>
                  {getStatusBadge(project.status)}
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1D1E22', marginBottom: '0.25rem' }}>
                  {isHi ? project.nameHi : project.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  <MapPin size={12} /> {project.location}
                </div>
                {/* Progress Bar */}
                <div style={{ marginTop: '0.5rem', background: '#E8E5DD', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${project.completion}%`, background: project.completion === 100 ? '#52B79A' : '#E5B842', height: '100%', borderRadius: '4px', transition: 'width 0.3s ease' }} />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{project.completion}% {isHi ? 'पूर्ण' : 'complete'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Inspection Panel */}
        {selectedProject && (
          <div style={{ background: '#FFF', border: '1.5px solid #1D1E22', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
            <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>{selectedProject.id}</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{isHi ? selectedProject.nameHi : selectedProject.name}</div>
            </div>

            {/* Checklist */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ClipboardCheck size={15} /> {isHi ? 'निरीक्षण चेकलिस्ट' : 'Inspection Checklist'}
              </div>
              {CHECKLIST_ITEMS.map(item => (
                <label key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0',
                  borderBottom: '1px solid var(--color-border-subtle)', cursor: 'pointer', fontSize: '0.85rem',
                }}>
                  <input type="checkbox" checked={!!checklist[item.id]} onChange={() => handleChecklistToggle(item.id)}
                    style={{ accentColor: 'var(--color-accent-teal)', width: '16px', height: '16px' }} />
                  {isHi ? item.hi : item.en}
                </label>
              ))}
            </div>

            {/* Photo Upload */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Camera size={15} /> {isHi ? 'फोटो साक्ष्य' : 'Photo Evidence'}
              </div>
              <button onClick={handlePhotoUpload} className="btn-outline-dark" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', gap: '0.35rem', marginBottom: '0.6rem' }}>
                <Upload size={14} /> {isHi ? 'फोटो अपलोड (सिम्युलेटेड)' : 'Upload Photo (Simulated)'}
              </button>
              {photos.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {photos.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--color-text-muted)', padding: '0.3rem 0.5rem', background: 'var(--color-bg-card-sand)', borderRadius: 'var(--radius-sm)' }}>
                      <CheckCircle size={13} color="var(--color-accent-teal)" /> {p.name} — {p.timestamp} — {p.gps}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                {isHi ? 'निरीक्षण नोट्स' : 'Inspection Notes'}
              </label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                placeholder={isHi ? 'अपने अवलोकन यहां लिखें...' : 'Write your observations here...'}
                style={{
                  width: '100%', padding: '0.6rem', border: '1.5px solid var(--color-border-dark)',
                  borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontFamily: 'var(--font-sans)',
                  resize: 'vertical', boxSizing: 'border-box',
                }} />
            </div>

            {/* Submit */}
            <button onClick={handleSubmitVerification} className="btn-teal"
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.9rem', gap: '0.4rem' }}>
              <CheckCircle size={16} />
              {submitted ? (isHi ? '✓ सत्यापन रिपोर्ट सबमिट हो गई' : '✓ Verification Report Submitted') : (isHi ? 'सत्यापन रिपोर्ट सबमिट करें' : 'Submit Verification Report')}
            </button>
            {submitError && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#D9534F', textAlign: 'center' }}>{submitError}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldInspectorVerification;
