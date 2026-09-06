import React, { useState, useEffect } from 'react';
import { 
  X, Camera, MapPin, Calendar, CheckCircle2, AlertTriangle, 
  Upload, Download, Shield, Eye, FileText, Lock 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth, ROLES } from '../../context/AuthContext';

export default function EvidenceDrawer({ work, isOpen, onClose }) {
  const { language } = useLanguage();
  const { user, hasPermission, isRole } = useAuth();
  const isHi = language === 'hi';

  const canUpload = hasPermission('evidence.upload');
  const isPublicViewer = typeof isRole === 'function' ? isRole(ROLES.PUBLIC_VIEWER) : false;

  const [evidenceList, setEvidenceList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadNote, setUploadNote] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const workId = work?.work_id || work?.id || '2026-8871';
  const workTitle = work?.work_description || work?.title || `MPLADS Work #${workId}`;

  // Fetch or mock evidence files for the work
  useEffect(() => {
    if (!isOpen || !work) return;

    // Standard demo verification evidence
    setEvidenceList([
      {
        id: 'ev-01',
        filename: `site_foundation_${workId}.jpg`,
        uploader: 'Er. Rajesh Kumar (Field Inspector)',
        role: 'FIELD_INSPECTOR',
        uploadedAt: '2026-02-14 11:32 IST',
        gps: '23.1815° N, 79.9864° E (Accuracy: ±3.2m)',
        tamperProof: 'SHA256: 8f4e2a...c019 (Verified Unaltered)',
        notes: 'Pillar reinforcement and perimeter foundation verified. Construction speed within expected tolerance.',
        stage: 'Foundation & Substructure',
        imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=600&auto=format&fit=crop&q=80',
      },
      {
        id: 'ev-02',
        filename: `slab_casting_${workId}.jpg`,
        uploader: 'Er. Rajesh Kumar (Field Inspector)',
        role: 'FIELD_INSPECTOR',
        uploadedAt: '2026-02-28 15:45 IST',
        gps: '23.1816° N, 79.9865° E (Accuracy: ±2.8m)',
        tamperProof: 'SHA256: 3a91bf...d442 (Verified Unaltered)',
        notes: 'Slab reinforcement cast completed. Concrete curing in progress.',
        stage: 'Superstructure & Roofing',
        imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&auto=format&fit=crop&q=80',
      },
    ]);
  }, [isOpen, work, workId]);

  if (!isOpen) return null;

  const handleSimulateUpload = (e) => {
    e.preventDefault();
    if (!uploadNote.trim()) return;

    const newEvidence = {
      id: `ev-${Date.now()}`,
      filename: `inspection_visit_${Date.now().toString().slice(-4)}.jpg`,
      uploader: user?.fullName || 'Field Inspector',
      role: user?.role || 'FIELD_INSPECTOR',
      uploadedAt: new Date().toLocaleString('en-IN') + ' IST',
      gps: '23.1818° N, 79.9867° E (Live Device GPS)',
      tamperProof: `SHA256: ${Math.random().toString(16).substring(2, 10)}... (Verified)`,
      notes: uploadNote,
      stage: 'Physical Inspection Verification',
      imageUrl: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=600&auto=format&fit=crop&q=80',
    };

    setEvidenceList([newEvidence, ...evidenceList]);
    setUploadNote('');
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'flex-end',
      backdropFilter: 'blur(2px)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '560px',
        background: '#FFFFFF',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.2)',
        borderLeft: '2px solid #1D1E22',
        overflowY: 'auto',
      }}>
        {/* Drawer Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1.5px solid #1D1E22',
          background: '#FAF8F3',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Camera size={20} color="#1D1E22" />
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1D1E22', margin: 0 }}>
                {isHi ? 'भौतिक स्थल साक्ष्य' : 'Site Verification Evidence'}
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#626D7D' }}>
                MPLADS-{workId}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.3rem',
              borderRadius: '6px',
            }}
          >
            <X size={20} color="#1D1E22" />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
          {/* Work Summary Mini Box */}
          <div style={{
            background: '#F4EFE6',
            border: '1px solid #1D1E22',
            borderRadius: '8px',
            padding: '0.85rem 1rem',
          }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1D1E22', marginBottom: '0.25rem' }}>
              {workTitle}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#555', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <span><strong>State:</strong> {work?.state_name || work?.state || 'India'}</span>
              <span><strong>District:</strong> {work?.district_name || work?.district || 'General'}</span>
              <span><strong>Risk Score:</strong> {Math.round(work?.final_risk_score ?? work?.riskScore ?? 75)}/100</span>
            </div>
          </div>

          {/* If Public Viewer: Inform about redacted official documents */}
          {isPublicViewer && (
            <div style={{
              background: '#ECEFF1',
              border: '1px solid #CFD8DC',
              borderRadius: '8px',
              padding: '1rem',
              fontSize: '0.78rem',
              color: '#37474F',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
            }}>
              <Lock size={16} color="#37474F" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong>{isHi ? 'सार्वजनिक दृश्य सूचना: ' : 'Public Disclosure Notice: '}</strong>
                {isHi
                  ? 'व्यक्तिगत गोपनीयता एवं सुरक्षा नियमों के तहत विस्तृत भू-स्थानिक मेटाडेटा केवल अधिकृत सरकारी निरीक्षकों के लिए उपलब्ध है।'
                  : 'High-resolution surveyor telemetry and raw field notes are restricted to authorized government personnel under the MPLADS Transparency Guidelines.'}
              </div>
            </div>
          )}

          {/* Inspector Upload Section (If authorized) */}
          {canUpload && (
            <div style={{
              background: '#E0F2F1',
              border: '1.5px solid #004D40',
              borderRadius: '8px',
              padding: '1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', color: '#004D40', fontWeight: 800, fontSize: '0.84rem' }}>
                <Upload size={16} />
                <span>{isHi ? 'नया स्थल साक्ष्य अपलोड करें' : 'Upload Field Verification Photo'}</span>
              </div>

              {uploadSuccess && (
                <div style={{ background: '#C8E6C9', color: '#1B5E20', padding: '0.4rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  ✓ {isHi ? 'साक्ष्य सफलतापूर्वक दर्ज किया गया!' : 'Evidence securely logged with GPS tag!'}
                </div>
              )}

              <form onSubmit={handleSimulateUpload} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <textarea
                  rows={2}
                  value={uploadNote}
                  onChange={(e) => setUploadNote(e.target.value)}
                  placeholder={isHi ? 'स्थल निरीक्षण टिप्पणी, निर्माण स्थिति...' : 'Inspection notes, physical progress observations...'}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    border: '1px solid #004D40',
                    fontSize: '0.78rem',
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: '#004D40',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    alignSelf: 'flex-start',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <Camera size={14} />
                  <span>{isHi ? 'जियो-टैग फोटो दर्ज करें' : 'Capture & Log Geotagged Evidence'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Evidence List */}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1D1E22', marginBottom: '0.75rem' }}>
              {isHi ? 'सत्यापित साक्ष्य फाइलें' : 'Verified Evidence Log'} ({evidenceList.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {evidenceList.map((item) => (
                <div
                  key={item.id}
                  style={{
                    border: '1px solid #1D1E22',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#FFFFFF',
                  }}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.stage}
                    style={{
                      width: '100%',
                      height: '180px',
                      objectFit: 'cover',
                      display: 'block',
                      borderBottom: '1px solid #1D1E22',
                    }}
                  />
                  <div style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#1D1E22' }}>
                        {item.stage}
                      </span>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        background: '#E8F5E9',
                        color: '#2E7D32',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                      }}>
                        <CheckCircle2 size={11} />
                        Tamper-Proof
                      </span>
                    </div>

                    <p style={{ fontSize: '0.76rem', color: '#444', margin: 0, lineHeight: 1.3 }}>
                      {item.notes}
                    </p>

                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.2rem',
                      fontSize: '0.7rem',
                      color: '#666',
                      background: '#FAF8F3',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      marginTop: '0.25rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <MapPin size={11} color="#006064" />
                        <span>{item.gps}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={11} color="#006064" />
                        <span>Uploaded: {item.uploadedAt} by {item.uploader}</span>
                      </div>
                      <div style={{ fontFamily: 'monospace', color: '#888', fontSize: '0.65rem' }}>
                        {item.tamperProof}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
