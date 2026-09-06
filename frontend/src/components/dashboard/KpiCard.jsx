import React from 'react';

export default function KpiCard({
  icon: Icon,
  label,
  value,
  subtitle,
  trend,
  trendDirection = 'up', // 'up' or 'down'
  trendIsGood = false,
  color = 'var(--color-accent-teal, #52B79A)',
  confidence,
  badge,
}) {
  const getTrendColor = () => {
    if (trend == null) return null;
    if (trendIsGood) {
      return trendDirection === 'up' ? '#2E7D32' : '#C62828';
    }
    return trendDirection === 'up' ? '#C62828' : '#2E7D32';
  };

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1.5px solid #1D1E22',
      borderRadius: '12px',
      padding: '1.15rem 1.35rem',
      boxShadow: '2.5px 3.5px 0px #1D1E22',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.45rem',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    }}>
      {/* Top row: Icon + Label + Optional Trend / Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          {Icon && (
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: `${color}18`,
              border: `1px solid ${color}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon size={18} color={color} />
            </div>
          )}
          <span style={{
            fontSize: '0.74rem',
            fontWeight: 800,
            color: '#555A64',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            lineHeight: 1.2,
          }}>
            {label}
          </span>
        </div>

        {badge && (
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            padding: '0.15rem 0.45rem',
            borderRadius: '4px',
            background: '#F0F4F8',
            color: '#334E68',
            border: '1px solid #D9E2EC',
          }}>
            {badge}
          </span>
        )}

        {trend != null && (
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            color: getTrendColor(),
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.15rem',
          }}>
            {trendDirection === 'up' ? '↑' : '↓'} {trend}%
          </span>
        )}
      </div>

      {/* Main Metric Value */}
      <div style={{
        fontSize: '1.75rem',
        fontWeight: 900,
        color: '#1D1E22',
        fontFamily: 'var(--font-sans, system-ui, sans-serif)',
        letterSpacing: '-0.02em',
        lineHeight: 1.1,
      }}>
        {value}
      </div>

      {/* Bottom Subtitle / Confidence Indicator */}
      {(subtitle || confidence) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: '#626D7D',
          marginTop: '0.15rem',
        }}>
          {subtitle && <span>{subtitle}</span>}
          {confidence && (
            <span style={{
              fontSize: '0.66rem',
              fontWeight: 700,
              color: '#006064',
              background: '#E0F7FA',
              padding: '0.1rem 0.35rem',
              borderRadius: '3px',
              marginLeft: 'auto',
            }}>
              Confidence: {confidence}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}
