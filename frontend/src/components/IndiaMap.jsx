import React, { useState, useRef, useCallback, useMemo } from 'react';
import IndiaMapSVG from '@svg-maps/india';
import stateRiskData, { RISK_COLORS } from '../data/IndiaMapData';
import { useLanguage } from '../context/LanguageContext';

const IndiaMap = () => {
  const { t } = useLanguage();
  const [hoveredState, setHoveredState] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [selectedState, setSelectedState] = useState(null); // for touch devices
  const containerRef = useRef(null);

  const handleMouseEnter = useCallback((stateId) => {
    setHoveredState(stateId);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredState(null);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTooltipPos({ x, y });
  }, []);

  const handleTouchStart = useCallback((stateId) => {
    setSelectedState((prev) => (prev === stateId ? null : stateId));
    setHoveredState(stateId);
  }, []);

  // Get fill color for a state based on risk level and hover status
  const getStateFill = useCallback((stateId) => {
    const data = stateRiskData[stateId];
    if (!data) return { fill: '#E8E4DA', opacity: 0.6 };

    const colors = RISK_COLORS[data.riskLevel];
    const isActive = hoveredState === stateId || selectedState === stateId;

    return {
      fill: colors.fill,
      opacity: isActive ? colors.hoverOpacity : colors.fillOpacity,
    };
  }, [hoveredState, selectedState]);

  // Determine active state for tooltip
  const activeStateId = hoveredState || selectedState;
  const activeData = activeStateId ? stateRiskData[activeStateId] : null;

  // Tooltip positioning with boundary clamping
  const tooltipStyle = useMemo(() => {
    if (!activeData) return {};
    const tooltipW = 260;
    const tooltipH = 200;
    let tx = tooltipPos.x + 16;
    let ty = tooltipPos.y - 10;

    // Clamp to right edge
    if (containerRef.current) {
      const containerW = containerRef.current.offsetWidth;
      const containerH = containerRef.current.offsetHeight;
      if (tx + tooltipW > containerW) tx = tooltipPos.x - tooltipW - 16;
      if (ty + tooltipH > containerH) ty = containerH - tooltipH - 10;
      if (ty < 0) ty = 10;
    }

    return {
      left: `${tx}px`,
      top: `${ty}px`,
    };
  }, [activeData, tooltipPos]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '380px',
        background: '#F3EFE6',
        border: '1.5px solid #1D1E22',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem 1rem 2.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Map Title */}
      <div style={{
        fontSize: '0.72rem',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        color: '#1D1E22',
        marginBottom: '0.8rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        {t('indiaMap.mapTitle')}
      </div>

      {/* SVG Map */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={IndiaMapSVG.viewBox}
        style={{
          width: '100%',
          maxWidth: '480px',
          height: 'auto',
          display: 'block',
        }}
        role="img"
        aria-label="Interactive India state-level risk map"
      >
        {IndiaMapSVG.locations.map((location) => {
          const { fill, opacity } = getStateFill(location.id);
          const isActive = hoveredState === location.id || selectedState === location.id;
          const localizedName = t(`indiaMap.states.${location.id}`, stateRiskData[location.id]?.name || location.name);

          return (
            <path
              key={location.id}
              id={`state-${location.id}`}
              d={location.path}
              fill={fill}
              fillOpacity={opacity}
              stroke="#1D1E22"
              strokeWidth={isActive ? '1.2' : '0.5'}
              strokeLinejoin="round"
              onMouseEnter={() => handleMouseEnter(location.id)}
              onMouseLeave={handleMouseLeave}
              onTouchStart={(e) => {
                e.preventDefault();
                handleTouchStart(location.id);
              }}
              style={{
                cursor: 'pointer',
                transition: 'fill-opacity 0.25s ease, stroke-width 0.2s ease, filter 0.25s ease',
                filter: isActive ? `drop-shadow(0 0 6px ${fill})` : 'none',
              }}
            >
              <title>{localizedName}</title>
            </path>
          );
        })}
      </svg>

      {/* Tooltip */}
      <div
        style={{
          position: 'absolute',
          ...tooltipStyle,
          pointerEvents: 'none',
          zIndex: 50,
          opacity: activeData ? 1 : 0,
          transform: activeData ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.96)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
          willChange: 'opacity, transform',
        }}
      >
        {activeData && (
          <div style={{
            background: '#FEFCF7',
            border: '1.5px solid #1D1E22',
            borderRadius: '10px',
            padding: '1rem 1.2rem',
            width: '250px',
            boxShadow: '0 6px 24px rgba(29, 30, 34, 0.12)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}>
            {/* State Name */}
            <div style={{
              fontSize: '0.95rem',
              fontWeight: 800,
              color: '#1D1E22',
              marginBottom: '0.5rem',
              fontFamily: 'var(--font-serif-primary, Georgia, serif)',
              lineHeight: 1.2,
            }}>
              {t(`indiaMap.states.${activeStateId}`, activeData.name)}
            </div>

            {/* Risk Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: RISK_COLORS[activeData.riskLevel].fill + '18',
              border: `1px solid ${RISK_COLORS[activeData.riskLevel].fill}`,
              borderRadius: '4px',
              padding: '0.2rem 0.55rem',
              marginBottom: '0.65rem',
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: RISK_COLORS[activeData.riskLevel].fill,
                display: 'inline-block',
              }}></span>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: RISK_COLORS[activeData.riskLevel].text,
              }}>
                {t(`indiaMap.riskLevels.${activeData.riskLevel.toLowerCase()}`, activeData.riskLevel)} {t('indiaMap.tooltip.riskSuffix')}
              </span>
            </div>

            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.45rem 1rem',
              borderTop: '1px solid rgba(29, 30, 34, 0.1)',
              paddingTop: '0.55rem',
            }}>
              <StatRow label={t('indiaMap.tooltip.projects')} value={activeData.projects} />
              <StatRow label={t('indiaMap.tooltip.riskScore')} value={`${activeData.riskScore}%`} highlight={activeData.riskLevel} />
              <StatRow label={t('indiaMap.tooltip.sanctioned')} value={activeData.sanctionedAmount} />
              <StatRow label={t('indiaMap.tooltip.anomalies')} value={activeData.anomalies} highlight={activeData.anomalies > 5 ? 'High' : null} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Mini stat row component for tooltip
const StatRow = ({ label, value, highlight }) => (
  <div>
    <div style={{
      fontSize: '0.62rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: '#8A8A8A',
      marginBottom: '0.1rem',
    }}>
      {label}
    </div>
    <div style={{
      fontSize: '0.82rem',
      fontWeight: 700,
      color: highlight ? RISK_COLORS[highlight]?.text || '#1D1E22' : '#1D1E22',
    }}>
      {value}
    </div>
  </div>
);

export default IndiaMap;
