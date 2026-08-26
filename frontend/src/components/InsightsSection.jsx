import React, { useState } from 'react';
import { MapPin, Filter, Layers, Info, ArrowUpRight } from 'lucide-react';
import IndiaMap from './IndiaMap';

const InsightsSection = () => {
  const [selectedState, setSelectedState] = useState('All');

  const districtRiskData = [
    {
      id: 1,
      district: 'Patna District',
      state: 'Bihar',
      totalProjects: 142,
      sanctionedAmount: '₹28.4 Cr',
      riskCategory: 'Critical',
      anomalyCount: 12,
      color: '#D9534F'
    },
    {
      id: 2,
      district: 'Varanasi District',
      state: 'Uttar Pradesh',
      totalProjects: 198,
      sanctionedAmount: '₹41.2 Cr',
      riskCategory: 'High',
      anomalyCount: 7,
      color: '#E07A5F'
    },
    {
      id: 3,
      district: 'Pune District',
      state: 'Maharashtra',
      totalProjects: 310,
      sanctionedAmount: '₹62.5 Cr',
      riskCategory: 'Medium',
      anomalyCount: 4,
      color: '#E5B842'
    },
    {
      id: 4,
      district: 'Ernakulam District',
      state: 'Kerala',
      totalProjects: 115,
      sanctionedAmount: '₹22.1 Cr',
      riskCategory: 'Low',
      anomalyCount: 1,
      color: '#52B79A'
    }
  ];

  return (
    <section
      id="geospatial"
      className="section-padding"
      style={{
        background: 'var(--color-bg-light)',
        borderTop: '1px solid var(--color-border-subtle)'
      }}
    >
      <div className="container">

        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 3.5rem auto' }}>
          <span className="eyebrow">GEOSPATIAL INTELLIGENCE</span>
          <h2 style={{ fontFamily: 'var(--font-serif-primary)', marginBottom: '1rem' }}>
            See Risk <span style={{ color: 'var(--color-accent-teal-hover)' }}>Across the Map</span>
          </h2>
          <p className="lead">
            Explore project activity, fund utilization and anomaly patterns across districts and states through geospatial intelligence.
          </p>
        </div>

        {/* Geospatial Risk Legend & Controls Bar */}
        <div
          style={{
            background: 'var(--color-bg-card-sand)',
            border: '1.5px solid #1D1E22',
            borderRadius: 'var(--radius-md)',
            padding: '1.2rem 2rem',
            marginBottom: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.2rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem', fontWeight: 700, color: '#1D1E22' }}>
            <Layers size={18} />
            <span>Risk Level Legend:</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
              <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#52B79A', border: '1px solid #1D1E22' }}></span>
              <span>Low</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
              <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#E5B842', border: '1px solid #1D1E22' }}></span>
              <span>Medium</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
              <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#E07A5F', border: '1px solid #1D1E22' }}></span>
              <span>High</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
              <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#D9534F', border: '1px solid #1D1E22' }}></span>
              <span>Critical</span>
            </div>
          </div>
        </div>

        {/* Visual Map & District Risk Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem',
            alignItems: 'center'
          }}
        >
          {/* Interactive India State-Level Risk Map */}
          <IndiaMap />

          {/* District Risk Overview Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {districtRiskData.map((d) => (
              <div
                key={d.id}
                className="card-light"
                style={{ padding: '1.4rem 1.6rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                onClick={() => alert(`Exploring ${d.district} MPLADS projects...`)}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color }}></span>
                    <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.2rem', color: '#1D1E22' }}>
                      {d.district}
                    </h3>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#5A5A5A' }}>
                      ({d.state})
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: '#5A5A5A' }}>
                    {d.totalProjects} Projects • {d.sanctionedAmount} Sanctioned
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: d.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {d.riskCategory} Risk
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#1D1E22', fontWeight: 600 }}>
                    {d.anomalyCount} Anomalies
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};

export default InsightsSection;

