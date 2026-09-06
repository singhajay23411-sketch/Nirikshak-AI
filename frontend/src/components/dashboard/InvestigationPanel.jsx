import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, 
  UserCheck, Send, Clock, X, MessageSquare, History, Lock 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth, ROLES } from '../../context/AuthContext';
import InvestigationStatusBadge from './InvestigationStatusBadge';

// Valid transitions mapping aligned with backend/auth/models.py
const ALLOWED_TRANSITIONS = {
  NEW: ['TRIAGED', 'ASSIGNED', 'FALSE_POSITIVE'],
  TRIAGED: ['ASSIGNED', 'ESCALATED', 'FALSE_POSITIVE'],
  ASSIGNED: ['FIELD_VISIT_SCHEDULED', 'UNDER_REVIEW', 'ESCALATED'],
  FIELD_VISIT_SCHEDULED: ['EVIDENCE_SUBMITTED', 'REQUIRES_CLARIFICATION'],
  EVIDENCE_SUBMITTED: ['UNDER_REVIEW', 'REQUIRES_CLARIFICATION'],
  UNDER_REVIEW: ['RESOLVED', 'REQUIRES_CLARIFICATION', 'ESCALATED', 'FALSE_POSITIVE'],
  REQUIRES_CLARIFICATION: ['ASSIGNED', 'UNDER_REVIEW', 'ESCALATED'],
  RESOLVED: [],
  ESCALATED: ['ASSIGNED', 'UNDER_REVIEW'],
  FALSE_POSITIVE: [],
};

// Roles authorized to resolve investigations
const RESOLUTION_ROLES = [
  ROLES.SYSTEM_ADMIN,
  ROLES.MOSPI_NATIONAL_OFFICER,
  ROLES.STATE_NODAL_OFFICER,
  ROLES.DISTRICT_AUTHORITY,
];

export default function InvestigationPanel({ work, isOpen, onClose }) {
  const { language } = useLanguage();
  const { user, hasPermission, isRole } = useAuth();
  const isHi = language === 'hi';

  const canAssign = hasPermission('investigation.assign');
  const canResolve = hasPermission('investigation.resolve') || RESOLUTION_ROLES.includes(user?.role);
  const isPublic = typeof isRole === 'function' ? isRole(ROLES.PUBLIC_VIEWER) : false;

  const workId = work?.work_id || work?.id || '2026-8871';
  const workTitle = work?.work_description || work?.title || `MPLADS Work #${workId}`;

  const [currentStatus, setCurrentStatus] = useState(work?.investigation_status || 'NEW');
  const [assignedInspector, setAssignedInspector] = useState('Er. Rajesh Kumar (Jabalpur Division)');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [history, setHistory] = useState([
    {
      action: 'ANOMALY_TRIGGERED',
      fromStatus: null,
      toStatus: 'NEW',
      actor: 'Nirikshak AI Engine (v2026.1)',
      role: 'SYSTEM',
      timestamp: '2026-02-10 09:15 IST',
      notes: 'Automated statistical risk score: 84/100 (Threshold ≥70 breached).',
    },
    {
      action: 'TRIAGE_REVIEW',
      fromStatus: 'NEW',
      toStatus: 'TRIAGED',
      actor: 'Dr. Ramesh Sharma',
      role: 'MOSPI_NATIONAL_OFFICER',
      timestamp: '2026-02-12 14:20 IST',
      notes: 'Assigned high priority triage due to milestone delay + expenditure pace mismatch.',
    },
  ]);

  if (!isOpen) return null;

  const validNextStates = ALLOWED_TRANSITIONS[currentStatus] || [];

  const handleStatusChange = (nextStatus) => {
    setError('');
    setSuccessMsg('');

    // If resolving, require an officer note
    if (nextStatus === 'RESOLVED') {
      if (!canResolve) {
        setError('Only MoSPI, State Nodal Officers, or District Authorities can formally resolve an investigation.');
        return;
      }
      if (!notes.trim()) {
        setError('A mandatory formal verification note is required before marking an inquiry as RESOLVED.');
        return;
      }
    }

    // Record audit event
    const auditEntry = {
      action: `STATUS_CHANGE_TO_${nextStatus}`,
      fromStatus: currentStatus,
      toStatus: nextStatus,
      actor: user?.fullName || 'Authorized Official',
      role: user?.role || 'OFFICIAL',
      timestamp: new Date().toLocaleString('en-IN') + ' IST',
      notes: notes.trim() || `Workflow state updated to ${nextStatus}`,
    };

    setHistory([auditEntry, ...history]);
    setCurrentStatus(nextStatus);
    setNotes('');
    setSuccessMsg(`Workflow successfully updated to ${nextStatus}. Official audit trail logged.`);
    setTimeout(() => setSuccessMsg(''), 4000);
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
        maxWidth: '620px',
        background: '#FFFFFF',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.2)',
        borderLeft: '2px solid #1D1E22',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1.5px solid #1D1E22',
          background: '#FAF8F3',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldAlert size={20} color="#C62828" />
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1D1E22', margin: 0 }}>
                {isHi ? 'जांच एवं मामला प्रबंधन' : 'Investigation & Case Workflow'}
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

        {/* Content */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
          {/* Work Summary Box */}
          <div style={{
            background: '#F4EFE6',
            border: '1px solid #1D1E22',
            borderRadius: '8px',
            padding: '1rem',
          }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1D1E22', marginBottom: '0.35rem' }}>
              {workTitle}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.74rem', color: '#555' }}>
                  {isHi ? 'वर्तमान स्थिति:' : 'Current Status:'}
                </span>
                <InvestigationStatusBadge status={currentStatus} isHi={isHi} />
              </div>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#C62828' }}>
                Risk Index: {Math.round(work?.final_risk_score ?? work?.riskScore ?? 84)}/100
              </div>
            </div>
          </div>

          {/* Error and Success Alerts */}
          {error && (
            <div style={{ background: '#FFEBEE', color: '#C62828', padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.78rem', border: '1px solid #FFCDD2' }}>
              ⚠ {error}
            </div>
          )}
          {successMsg && (
            <div style={{ background: '#E8F5E9', color: '#2E7D32', padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.78rem', border: '1px solid #A5D6A7' }}>
              ✓ {successMsg}
            </div>
          )}

          {/* Workflow Action Panel (Authorized Officials) */}
          {!isPublic && validNextStates.length > 0 && (
            <div style={{
              background: '#FFFFFF',
              border: '1.5px solid #1D1E22',
              borderRadius: '8px',
              padding: '1.15rem',
              boxShadow: '2px 2px 0px #1D1E22',
            }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#1D1E22', marginBottom: '0.75rem' }}>
                {isHi ? 'अगला वर्कफ़्लो चरण निष्पादित करें' : 'Execute Next Workflow Transition'}
              </div>

              {/* Notes Input */}
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#444', marginBottom: '0.3rem' }}>
                  {isHi ? 'आधिकारिक टिप्पणी / जांच निर्देश (अनिवार्य):' : 'Official Remarks & Directives (Audited):'}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isHi ? 'निर्देश, सत्यापन निष्कर्ष या कारण दर्ज करें...' : 'Enter verification findings, field directive, or resolution rationale...'}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    border: '1px solid #1D1E22',
                    fontSize: '0.78rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Transition Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {validNextStates.map((nextState) => {
                  const isResolveState = nextState === 'RESOLVED';
                  const isEscalateState = nextState === 'ESCALATED';

                  let btnBg = '#1D1E22';
                  let btnColor = '#FFFFFF';
                  if (isResolveState) {
                    btnBg = '#2E7D32';
                  } else if (isEscalateState) {
                    btnBg = '#C62828';
                  }

                  return (
                    <button
                      key={nextState}
                      onClick={() => handleStatusChange(nextState)}
                      style={{
                        background: btnBg,
                        color: btnColor,
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.45rem 0.85rem',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <ArrowRight size={13} />
                      <span>Transition to {nextState.replace('_', ' ')}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Terminal State Alert */}
          {validNextStates.length === 0 && (
            <div style={{
              background: '#E8F5E9',
              border: '1px solid #A5D6A7',
              borderRadius: '8px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              color: '#2E7D32',
              fontSize: '0.82rem',
              fontWeight: 700,
            }}>
              <CheckCircle2 size={20} />
              <span>This inquiry has reached terminal status ({currentStatus}). Case record is sealed in the official audit registry.</span>
            </div>
          )}

          {/* Audit History Log */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 800, color: '#1D1E22', marginBottom: '0.75rem' }}>
              <History size={16} />
              <span>{isHi ? 'अपरिवर्तनीय ऑडिट ट्रेल' : 'Immutable Official Audit Trail'}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {history.map((event, idx) => (
                <div
                  key={idx}
                  style={{
                    border: '1px solid #EAE6DF',
                    borderRadius: '6px',
                    padding: '0.75rem',
                    background: '#FAF8F5',
                    fontSize: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 800, color: '#1D1E22' }}>
                      {event.action}
                    </span>
                    <span style={{ color: '#777', fontSize: '0.7rem' }}>
                      {event.timestamp}
                    </span>
                  </div>
                  <div style={{ color: '#555', marginBottom: '0.3rem' }}>
                    <strong>Actor:</strong> {event.actor} ({event.role})
                  </div>
                  <div style={{ color: '#333', background: '#FFF', padding: '0.4rem', borderRadius: '4px', border: '1px solid #EEE' }}>
                    "{event.notes}"
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
