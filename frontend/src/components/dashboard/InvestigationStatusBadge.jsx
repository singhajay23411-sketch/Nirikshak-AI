import React from 'react';
import { 
  AlertCircle, CheckCircle2, Clock, Send, Eye, 
  HelpCircle, ArrowUpCircle, XCircle, UserCheck, Calendar
} from 'lucide-react';

const STATUS_CONFIG = {
  NEW: {
    label: 'New Anomaly',
    hi: 'नई विसंगति',
    bg: '#FFEBEE',
    color: '#C62828',
    border: '#FFCDD2',
    icon: AlertCircle,
  },
  TRIAGED: {
    label: 'Triaged',
    hi: 'वर्गीकृत',
    bg: '#FFF8E1',
    color: '#F57F17',
    border: '#FFE082',
    icon: Clock,
  },
  ASSIGNED: {
    label: 'Inspector Assigned',
    hi: 'निरीक्षक नियुक्त',
    bg: '#E1F5FE',
    color: '#0277BD',
    border: '#B3E5FC',
    icon: UserCheck,
  },
  FIELD_VISIT_SCHEDULED: {
    label: 'Visit Scheduled',
    hi: 'स्थल दौरा तय',
    bg: '#EDE7F6',
    color: '#512DA8',
    border: '#D1C4E9',
    icon: Calendar,
  },
  EVIDENCE_SUBMITTED: {
    label: 'Evidence Uploaded',
    hi: 'साक्ष्य प्रस्तुत',
    bg: '#E0F2F1',
    color: '#00796B',
    border: '#B2DFDB',
    icon: Send,
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    hi: 'समीक्षाधीन',
    bg: '#FFF3E0',
    color: '#E65100',
    border: '#FFE0B2',
    icon: Eye,
  },
  REQUIRES_CLARIFICATION: {
    label: 'Clarification Needed',
    hi: 'स्पष्टीकरण अपेक्षित',
    bg: '#FBE9E7',
    color: '#D84315',
    border: '#FFCCBC',
    icon: HelpCircle,
  },
  RESOLVED: {
    label: 'Verified & Closed',
    hi: 'सत्यापित एवं बंद',
    bg: '#E8F5E9',
    color: '#2E7D32',
    border: '#A5D6A7',
    icon: CheckCircle2,
  },
  ESCALATED: {
    label: 'Escalated to MoSPI',
    hi: 'MoSPI को अग्रेषित',
    bg: '#FCE4EC',
    color: '#AD1457',
    border: '#F8BBD0',
    icon: ArrowUpCircle,
  },
  FALSE_POSITIVE: {
    label: 'False Positive / Dismissed',
    hi: 'गलत सकारात्मक',
    bg: '#ECEFF1',
    color: '#455A64',
    border: '#CFD8DC',
    icon: XCircle,
  },
};

export default function InvestigationStatusBadge({ status = 'NEW', isHi = false, size = 'normal' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.NEW;
  const Icon = config.icon;
  const isSmall = size === 'small';

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: isSmall ? '0.25rem' : '0.35rem',
      padding: isSmall ? '0.15rem 0.45rem' : '0.25rem 0.65rem',
      borderRadius: '999px',
      background: config.bg,
      color: config.color,
      border: `1px solid ${config.border}`,
      fontSize: isSmall ? '0.68rem' : '0.74rem',
      fontWeight: 700,
      letterSpacing: '0.01em',
      whiteSpace: 'nowrap',
    }}>
      <Icon size={isSmall ? 11 : 13} color={config.color} />
      <span>{isHi ? config.hi : config.label}</span>
    </span>
  );
}
