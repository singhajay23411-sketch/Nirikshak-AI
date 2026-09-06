import React from 'react';
import { Shield, AlertTriangle, Info, Layers, CheckCircle2, TrendingUp } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function RiskSummaryCard({
  highCount = 0,
  mediumCount = 0,
  lowCount = 0,
  onFilterChange,
  activeFilter = 'ALL',
  title = 'Risk Assessment Summary',
  pillars = [
    { name: 'Financial Flow Discrepancy', percent: 34, color: '#D9534F' },
    { name: 'Completion Milestone Delay', percent: 28, color: '#E5B842' },
    { name: 'Cost Benchmark Deviation', percent: 19, color: '#0A2458' },
    { name: 'Semantic Duplicate Signature', percent: 11, color: '#9C27B0' },
    { name: 'Agency Concentration Index', percent: 8, color: '#52B79A' },
  ],
}) {
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const total = highCount + mediumCount + lowCount || 1;

  const highPct = Math.round((highCount / total) * 100);
  const medPct = Math.round((mediumCount / total) * 100);
  const lowPct = 100 - highPct - medPct;

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
      {/* Title & Human-in-the-loop Pill */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={18} color="#C62828" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1D1E22', margin: 0 }}>
            {isHi ? 'जोखिम मूल्यांकन सारांश' : title}
          </h3>
        </div>

        <span style={{
          fontSize: '0.68rem',
          fontWeight: 700,
          background: '#FFF3E0',
          color: '#E65100',
          border: '1px solid #FFE0B2',
          padding: '0.2rem 0.5rem',
          borderRadius: '4px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
        }}>
          <Info size={11} />
          {isHi ? 'मानव-सत्यापन अनुशंसित' : 'Human-in-the-Loop Advisory'}
        </span>
      </div>

      {/* Segmented Risk Bar */}
      <div>
        <div style={{
          height: '14px',
          borderRadius: '7px',
          overflow: 'hidden',
          display: 'flex',
          border: '1px solid #1D1E22',
          background: '#EEE',
        }}>
          <div style={{ width: `${highPct}%`, background: '#D9534F', transition: 'width 0.3s' }} title={`High Risk: ${highCount} (${highPct}%)`} />
          <div style={{ width: `${medPct}%`, background: '#E5B842', transition: 'width 0.3s' }} title={`Medium Risk: ${mediumCount} (${medPct}%)`} />
          <div style={{ width: `${lowPct}%`, background: '#52B79A', transition: 'width 0.3s' }} title={`Low Risk: ${lowCount} (${lowPct}%)`} />
        </div>

        {/* Legend buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', gap: '0.5rem' }}>
          <button
            onClick={() => onFilterChange && onFilterChange(activeFilter === 'HIGH' ? 'ALL' : 'HIGH')}
            style={{
              background: activeFilter === 'HIGH' ? '#FFEBEE' : 'transparent',
              border: activeFilter === 'HIGH' ? '1px solid #C62828' : '1px solid transparent',
              borderRadius: '6px',
              padding: '0.2rem 0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D9534F' }} />
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#C62828' }}>
              {isHi ? 'उच्च जोखिम' : 'High Priority'}: <strong>{highCount}</strong> ({highPct}%)
            </span>
          </button>

          <button
            onClick={() => onFilterChange && onFilterChange(activeFilter === 'MEDIUM' ? 'ALL' : 'MEDIUM')}
            style={{
              background: activeFilter === 'MEDIUM' ? '#FFF8E1' : 'transparent',
              border: activeFilter === 'MEDIUM' ? '1px solid #F57F17' : '1px solid transparent',
              borderRadius: '6px',
              padding: '0.2rem 0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E5B842' }} />
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#B78103' }}>
              {isHi ? 'मध्यम जोखिम' : 'Moderate'}: <strong>{mediumCount}</strong> ({medPct}%)
            </span>
          </button>

          <button
            onClick={() => onFilterChange && onFilterChange(activeFilter === 'LOW' ? 'ALL' : 'LOW')}
            style={{
              background: activeFilter === 'LOW' ? '#E8F5E9' : 'transparent',
              border: activeFilter === 'LOW' ? '1px solid #2E7D32' : '1px solid transparent',
              borderRadius: '6px',
              padding: '0.2rem 0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#52B79A' }} />
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#2E7D32' }}>
              {isHi ? 'सामान्य' : 'Normal Pace'}: <strong>{lowCount}</strong> ({lowPct}%)
            </span>
          </button>
        </div>
      </div>

      {/* Anomaly Driver Pillars */}
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#555A64', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
          {isHi ? 'प्रमुख विसंगति चालक' : 'Primary Risk Anomaly Drivers'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {pillars.map((p, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: '#1D1E22', fontWeight: 600 }}>{p.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '60px', height: '6px', background: '#EAE6DF', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${p.percent}%`, height: '100%', background: p.color }} />
                </div>
                <span style={{ fontWeight: 800, color: '#1D1E22', minWidth: '28px', textAlign: 'right' }}>{p.percent}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Official Human-in-the-Loop Advisory Note */}
      <div style={{
        background: '#FAF8F5',
        border: '1px dashed #D5CEBE',
        borderRadius: '6px',
        padding: '0.6rem 0.75rem',
        fontSize: '0.7rem',
        color: '#605B50',
        lineHeight: 1.4,
      }}>
        <strong>{isHi ? 'आधिकारिक दिशानिर्देश: ' : 'Statutory Note: '}</strong>
        {isHi
          ? 'यह जोखिम स्कोर क्षेत्र सत्यापन प्राथमिकताओं को तय करने के लिए एक सांख्यिकीय सूचक है। जमीनी भौतिक सत्यापन के बिना इसे अनियमितता का अंतिम निष्कर्ष नहीं माना जाएगा।'
          : 'Risk scores are probabilistic statistical indicators to guide inspection scheduling and priority resource allocation. Formal administrative actions require physical on-site verification.'}
      </div>
    </div>
  );
}
