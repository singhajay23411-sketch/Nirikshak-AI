import React, { useState } from 'react';
import { Download, FileText, Check, Loader2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { exportStructuredAuditPdf } from '../../services/pdfExportService';

export default function ExportButton({ data, filename = 'nirikshak_official_report', scopeTitle = 'National' }) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isHi = language === 'hi';

  const [exporting, setExporting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    setSuccess(false);

    try {
      if (exportStructuredAuditPdf) {
        await exportStructuredAuditPdf({
          title: `NIRIKSHAK AI — MPLADS OFFICIAL MONITORING REPORT (${scopeTitle.toUpperCase()})`,
          generatedBy: user?.fullName || 'Authorized Official',
          role: user?.role || 'MoSPI Officer',
          generatedAt: new Date().toLocaleString('en-IN'),
          data: data || {},
        });
      } else {
        // Fallback simple download
        const blob = new Blob([JSON.stringify(data || {}, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.4rem 0.85rem',
        background: success ? '#E8F5E9' : '#FFFFFF',
        color: success ? '#2E7D32' : '#1D1E22',
        border: `1.5px solid ${success ? '#2E7D32' : '#1D1E22'}`,
        borderRadius: '6px',
        fontSize: '0.78rem',
        fontWeight: 700,
        cursor: exporting ? 'wait' : 'pointer',
        boxShadow: '1.5px 2px 0px #1D1E22',
        transition: 'all 0.15s ease',
      }}
    >
      {exporting ? (
        <Loader2 size={14} className="animate-spin" />
      ) : success ? (
        <Check size={14} />
      ) : (
        <Download size={14} />
      )}
      <span>
        {exporting
          ? (isHi ? 'तैयार हो रहा है...' : 'Compiling PDF...')
          : success
          ? (isHi ? 'डाउनलोड संपन्न!' : 'Export Ready!')
          : (isHi ? 'आधिकारिक ऑडिट रिपोर्ट' : 'Export Official PDF')}
      </span>
    </button>
  );
}
