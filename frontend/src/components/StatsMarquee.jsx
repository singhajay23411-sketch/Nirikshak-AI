import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';

const formatCr = (val) => {
  if (!val) return '₹0 Cr';
  return `₹${(val / 10000000).toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr`;
};

const formatNum = (val) => {
  if (!val) return '0';
  return val.toLocaleString('en-IN');
};

const StatsMarquee = ({ customStats = null, speedSeconds = 32 }) => {
  const { t } = useLanguage();
  const { ministryView, duplicateAlerts, costAnomalies, isLoading } = useData();

  let stats = customStats;

  if (!stats) {
    if (isLoading || !ministryView) {
      // Fallback while loading
      stats = [
        { value: '...', label: t('marquee.projects') },
        { value: '...', label: t('marquee.sanctioned') },
        { value: '...', label: t('marquee.utilized') },
        { value: '...', label: t('marquee.highRiskProjects'), highlight: '#FF6B6B' },
        { value: '...', label: t('marquee.anomaliesDetected'), highlight: '#E5B842' },
      ];
    } else {
      const { national_stats, state_wise_benchmarks, top_national_risk_alerts } = ministryView;
      const totalAnomalies = (duplicateAlerts?.length || 0) + (costAnomalies?.length || 0);

      stats = [
        { value: formatNum(national_stats?.total_projects), label: t('marquee.projects') },
        { value: formatCr(national_stats?.total_sanctioned), label: t('marquee.sanctioned') },
        { value: formatCr(national_stats?.total_disbursed), label: t('marquee.utilized') },
        { value: formatNum(top_national_risk_alerts?.length || 0), label: t('marquee.highRiskProjects'), highlight: '#FF6B6B' },
        { value: formatNum(totalAnomalies), label: t('marquee.anomaliesDetected'), highlight: '#E5B842' },
        { value: formatNum(state_wise_benchmarks?.length || 36), label: t('marquee.statesMonitored') }
      ];
    }
  }

  // Render a single stats item sequence
  const renderStatsSequence = (keyPrefix) => (
    <div className="marquee-sequence" key={keyPrefix} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
      {stats.map((item, idx) => (
        <React.Fragment key={`${keyPrefix}-${idx}`}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.88rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: '#FAF8F3'
            }}
          >
            <span
              style={{
                color: item.highlight || '#52B79A',
                fontWeight: 800,
                letterSpacing: '0.04em'
              }}
            >
              {item.value}
            </span>
            <span
              style={{
                color: '#E5E7EB',
                fontWeight: 600,
                letterSpacing: '0.08em'
              }}
            >
              {item.label}
            </span>
          </div>

          {/* Bullet Separator */}
          <span
            style={{
              margin: '0 1.4rem',
              color: '#52B79A',
              fontSize: '1rem',
              userSelect: 'none',
              opacity: 0.8
            }}
          >
            •
          </span>
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div
      className="marquee-container"
      style={{
        width: '100%',
        background: '#1D1E22',
        borderTop: '2px solid #1D1E22',
        borderBottom: '2px solid #1D1E22',
        padding: '0.85rem 0',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
      }}
    >
      {/* Edge gradient masks for smooth fade */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '60px',
          background: 'linear-gradient(to right, #1D1E22 15%, transparent 100%)',
          zIndex: 2,
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '60px',
          background: 'linear-gradient(to left, #1D1E22 15%, transparent 100%)',
          zIndex: 2,
          pointerEvents: 'none'
        }}
      />

      {/* Infinite Scrolling Track (Right to Left) */}
      <div
        className="marquee-track"
        style={{
          display: 'flex',
          width: 'max-content',
          animation: `infiniteMarqueeScroll ${speedSeconds}s linear infinite`,
          willChange: 'transform'
        }}
      >
        {renderStatsSequence('track-1')}
        {renderStatsSequence('track-2')}
        {renderStatsSequence('track-3')}
        {renderStatsSequence('track-4')}
      </div>

      <style>{`
        @keyframes infiniteMarqueeScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default StatsMarquee;
