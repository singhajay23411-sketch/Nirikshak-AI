import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, ExternalLink, Camera, ShieldAlert, 
  ChevronLeft, ChevronRight, FileText, CheckCircle2 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth, ROLES } from '../../context/AuthContext';
import InvestigationStatusBadge from './InvestigationStatusBadge';

export default function PriorityWorkTable({
  works = [],
  onSelectWork,
  onOpenEvidence,
  onOpenInvestigation,
  title = 'Priority Works & Anomaly Queue',
  emptyMessage = 'No flagged works found in current jurisdiction.',
}) {
  const { language } = useLanguage();
  const { user, hasPermission, isRole } = useAuth();
  const isHi = language === 'hi';

  const isPublicViewer = typeof isRole === 'function' ? isRole(ROLES.PUBLIC_VIEWER) : false;
  const canInvestigate = hasPermission('investigation.view');
  const canViewEvidence = hasPermission('evidence.view');

  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 7;

  // Filtered and searched works
  const filteredWorks = useMemo(() => {
    return works.filter((w) => {
      const matchText = (
        (w.work_id || w.id || '') + ' ' +
        (w.work_description || w.title || '') + ' ' +
        (w.const_name || w.constituency || '') + ' ' +
        (w.district_name || w.district || '') + ' ' +
        (w.state_name || w.state || '')
      ).toLowerCase();

      const matchesSearch = !search || matchText.includes(search.toLowerCase());
      
      const score = w.final_risk_score ?? w.score ?? w.riskScore ?? 0;
      let matchesLevel = true;
      if (filterLevel === 'HIGH') matchesLevel = score >= 70;
      else if (filterLevel === 'MEDIUM') matchesLevel = score >= 40 && score < 70;
      else if (filterLevel === 'LOW') matchesLevel = score < 40;

      return matchesSearch && matchesLevel;
    });
  }, [works, search, filterLevel]);

  const totalPages = Math.ceil(filteredWorks.length / pageSize) || 1;
  const paginatedWorks = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredWorks.slice(start, start + pageSize);
  }, [filteredWorks, page, pageSize]);

  return (
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
      {/* Header with Search and Risk Filter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1D1E22', margin: 0 }}>
            {isHi ? 'प्राथमिकता कार्य एवं विसंगति कतार' : title}
          </h3>
          <span style={{ fontSize: '0.74rem', color: '#626D7D' }}>
            {filteredWorks.length} {isHi ? 'कार्य पाए गए' : 'works matched jurisdiction scope'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: '#FAF8F5',
            border: '1px solid #1D1E22',
            borderRadius: '6px',
            padding: '0.35rem 0.65rem',
          }}>
            <Search size={14} color="#555" />
            <input
              type="text"
              placeholder={isHi ? 'खोजें (ID, शीर्षक, जिला)...' : 'Search work ID, title, district...'}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.78rem',
                width: '180px',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Risk Level Select */}
          <select
            value={filterLevel}
            onChange={(e) => { setFilterLevel(e.target.value); setPage(1); }}
            style={{
              border: '1px solid #1D1E22',
              borderRadius: '6px',
              padding: '0.35rem 0.65rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              background: '#FAF8F5',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="ALL">{isHi ? 'सभी जोखिम स्तर' : 'All Risk Tiers'}</option>
            <option value="HIGH">{isHi ? 'उच्च जोखिम (≥70)' : 'High Priority (≥70)'}</option>
            <option value="MEDIUM">{isHi ? 'मध्यम जोखिम (40-69)' : 'Moderate (40-69)'}</option>
            <option value="LOW">{isHi ? 'सामान्य (<40)' : 'Standard (<40)'}</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div style={{ overflowX: 'auto', border: '1px solid #EAE6DF', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#FAF8F3', borderBottom: '1.5px solid #1D1E22' }}>
              <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: '#1D1E22' }}>
                {isHi ? 'कार्य विवरण' : 'Work & Identifier'}
              </th>
              <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: '#1D1E22' }}>
                {isHi ? 'स्थान' : 'Jurisdiction'}
              </th>
              <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: '#1D1E22' }}>
                {isHi ? 'स्वीकृत राशि' : 'Sanctioned Cost'}
              </th>
              <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: '#1D1E22' }}>
                {isHi ? 'विसंगति कारक' : 'Flag / Driver'}
              </th>
              <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: '#1D1E22', textAlign: 'center' }}>
                {isHi ? 'जोखिम स्कोर' : 'Risk Score'}
              </th>
              <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: '#1D1E22', textAlign: 'center' }}>
                {isHi ? 'जांच स्थिति' : 'Workflow Status'}
              </th>
              <th style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: '#1D1E22', textAlign: 'right' }}>
                {isHi ? 'कार्रवाई' : 'Actions'}
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedWorks.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedWorks.map((item, idx) => {
                const workId = item.work_id || item.id || `W-${idx}`;
                const title = item.work_description || item.title || item.activity_name || `MPLADS Work #${workId}`;
                const location = item.const_name || item.constituency || item.district_name || item.district || item.state_name || item.state || 'N/A';
                const state = item.state_name || item.state || '';
                const cost = item.sanction_amount
                  ? `₹${(item.sanction_amount / 100000).toFixed(1)} L`
                  : item.sanctionedCostFormatted || (item.cost ? `${item.cost}` : '₹25.0 L');
                const score = Math.round(item.final_risk_score ?? item.score ?? item.riskScore ?? 75);
                const flag = item.factor || item.anomalyType || (score >= 70 ? 'Milestone timeline deviation' : 'Routine monitoring');
                const status = item.investigation_status || (score >= 70 ? 'NEW' : 'RESOLVED');

                const scoreBg = score >= 70 ? '#FFEBEE' : score >= 40 ? '#FFF8E1' : '#E8F5E9';
                const scoreColor = score >= 70 ? '#C62828' : score >= 40 ? '#F57F17' : '#2E7D32';

                return (
                  <tr
                    key={workId}
                    style={{
                      borderBottom: '1px solid #EAE6DF',
                      background: idx % 2 === 0 ? '#FFFFFF' : '#FCFBF9',
                      transition: 'background 0.1s',
                    }}
                  >
                    {/* Work Title & ID */}
                    <td style={{ padding: '0.65rem 0.75rem', maxWidth: '280px' }}>
                      <div style={{ fontWeight: 700, color: '#1D1E22', lineHeight: 1.3, marginBottom: '0.2rem' }}>
                        {title}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#555', fontFamily: 'monospace' }}>
                        ID: MPLADS-{workId}
                      </div>
                    </td>

                    {/* Location */}
                    <td style={{ padding: '0.65rem 0.75rem', color: '#333' }}>
                      <div style={{ fontWeight: 600 }}>{location}</div>
                      {state && <div style={{ fontSize: '0.68rem', color: '#777' }}>{state}</div>}
                    </td>

                    {/* Cost */}
                    <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#1D1E22', whiteSpace: 'nowrap' }}>
                      {cost}
                    </td>

                    {/* Anomaly Driver */}
                    <td style={{ padding: '0.65rem 0.75rem', color: '#555', fontSize: '0.74rem', maxWidth: '200px' }}>
                      {flag}
                    </td>

                    {/* Risk Score */}
                    <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '999px',
                        background: scoreBg,
                        color: scoreColor,
                        fontWeight: 800,
                        fontSize: '0.76rem',
                        border: `1px solid ${scoreColor}40`,
                      }}>
                        {score} / 100
                      </span>
                    </td>

                    {/* Investigation Status */}
                    <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                      <InvestigationStatusBadge status={status} isHi={isHi} size="small" />
                    </td>

                    {/* Action buttons */}
                    <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        {/* Evidence button */}
                        {canViewEvidence && (
                          <button
                            onClick={() => onOpenEvidence && onOpenEvidence(item)}
                            title={isHi ? 'साक्ष्य देखें' : 'View Site Evidence'}
                            style={{
                              background: '#F0F4F8',
                              border: '1px solid #1D1E22',
                              borderRadius: '4px',
                              padding: '0.25rem 0.45rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color: '#1D1E22',
                            }}
                          >
                            <Camera size={12} />
                            <span>{isHi ? 'साक्ष्य' : 'Evidence'}</span>
                          </button>
                        )}

                        {/* Investigate Case Button */}
                        {canInvestigate && !isPublicViewer && (
                          <button
                            onClick={() => onOpenInvestigation && onOpenInvestigation(item)}
                            title={isHi ? 'मामला प्रबंधित करें' : 'Manage Investigation'}
                            style={{
                              background: 'var(--color-accent-teal, #52B79A)',
                              border: '1px solid #1D1E22',
                              borderRadius: '4px',
                              padding: '0.25rem 0.5rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color: '#1D1E22',
                              boxShadow: '1px 1.5px 0px #1D1E22',
                            }}
                          >
                            <ShieldAlert size={12} />
                            <span>{isHi ? 'जांच' : 'Case'}</span>
                          </button>
                        )}

                        {/* Public Details Button */}
                        {isPublicViewer && (
                          <button
                            onClick={() => onSelectWork && onSelectWork(item)}
                            style={{
                              background: '#FAF8F5',
                              border: '1px solid #1D1E22',
                              borderRadius: '4px',
                              padding: '0.25rem 0.5rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color: '#1D1E22',
                            }}
                          >
                            <ExternalLink size={12} />
                            <span>{isHi ? 'विवरण' : 'Details'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.25rem' }}>
          <span style={{ color: '#626D7D' }}>
            {isHi ? 'पृष्ठ' : 'Page'} {page} {isHi ? 'का' : 'of'} {totalPages}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              style={{
                border: '1px solid #1D1E22',
                borderRadius: '4px',
                background: page <= 1 ? '#F0F0F0' : '#FFF',
                padding: '0.25rem 0.5rem',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              style={{
                border: '1px solid #1D1E22',
                borderRadius: '4px',
                background: page >= totalPages ? '#F0F0F0' : '#FFF',
                padding: '0.25rem 0.5rem',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
