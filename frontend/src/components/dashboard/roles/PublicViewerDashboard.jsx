import React, { useState } from 'react';
import { 
  Eye, CheckCircle, Database, TrendingUp, Search, 
  MapPin, Building, ExternalLink, Shield 
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useData } from '../../../context/DataContext';
import KpiCard from '../KpiCard';
import PriorityWorkTable from '../PriorityWorkTable';
import JurisdictionFilter from '../JurisdictionFilter';

export default function PublicViewerDashboard() {
  const { language } = useLanguage();
  const { unifiedProjects, realProjects } = useData();
  const isHi = language === 'hi';

  const [selectedWork, setSelectedWork] = useState(null);
  const [filterScope, setFilterScope] = useState({ state: null, district: null });

  const displayWorks = (unifiedProjects && unifiedProjects.length > 0) ? unifiedProjects : (realProjects || []);

  const filteredWorks = displayWorks.filter((w) => {
    if (filterScope.state && (w.state_name || w.state) !== filterScope.state) return false;
    if (filterScope.district && (w.district_name || w.district) !== filterScope.district) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Citizen Welcome Banner */}
      <div style={{
        background: '#FAF8F3',
        border: '1.5px solid #1D1E22',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '2.5px 3.5px 0px #1D1E22',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Eye size={20} color="#0A2458" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1D1E22', margin: 0 }}>
              {isHi ? 'नागरिक सार्वजनिक पारदर्शिता पोर्टल' : 'Citizen Transparency & Public Works Portal'}
            </h2>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#555', margin: 0 }}>
            {isHi
              ? 'संसदीय निधि से वित्तपोषित सभी विकास कार्यों की खुली जानकारी एवं सार्वजनिक सत्यापन'
              : 'Open Citizen Data on Parliament Member Local Area Development Scheme (MPLADS)'}
          </p>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.35rem 0.75rem',
          borderRadius: '999px',
          background: '#E8F5E9',
          color: '#1B5E20',
          border: '1px solid #A5D6A7',
          fontSize: '0.75rem',
          fontWeight: 700,
        }}>
          <CheckCircle size={14} />
          <span>Open Public Data • SIH 2026</span>
        </div>
      </div>

      {/* Citizen KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '1.25rem',
      }}>
        <KpiCard
          icon={Database}
          label={isHi ? 'कुल सार्वजनिक कार्य' : 'Total Monitored Works'}
          value="4,684"
          subtitle="Grounded in 543 Constituencies"
          color="#0A2458"
        />
        <KpiCard
          icon={CheckCircle}
          label={isHi ? 'पूर्ण सामुदायिक संपत्तियां' : 'Completed Public Assets'}
          value="2,890"
          subtitle="Hospitals, schools, roads, water"
          color="#2E7D32"
        />
        <KpiCard
          icon={TrendingUp}
          label={isHi ? 'सार्वजनिक निधि उपयोग' : 'National Fund Utilization'}
          value="93.8%"
          subtitle="Audited and reconciled"
          color="#1B5E20"
        />
        <KpiCard
          icon={Building}
          label={isHi ? 'सक्रिय कार्य प्रगति पर' : 'Ongoing Works'}
          value="1,794"
          subtitle="Tracked in real time"
          color="#E65100"
        />
      </div>

      {/* Filter and Priority Work Catalog */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <JurisdictionFilter onFilterChange={setFilterScope} />
      </div>

      {/* Public Works Catalog Table */}
      <PriorityWorkTable
        works={filteredWorks}
        onSelectWork={setSelectedWork}
        title={isHi ? 'सार्वजनिक विकास कार्य सूची' : 'Public Development Works Catalog'}
        emptyMessage="No works found for selected region."
      />

      {/* Citizen Details Modal */}
      {selectedWork && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backdropFilter: 'blur(2px)',
        }}>
          <div style={{
            background: '#FFFFFF',
            border: '2px solid #1D1E22',
            borderRadius: '12px',
            maxWidth: '520px',
            width: '100%',
            padding: '1.5rem',
            boxShadow: '4px 6px 0px #1D1E22',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#1D1E22', margin: 0 }}>
                  {selectedWork.work_description || selectedWork.title || 'Work Details'}
                </h3>
                <span style={{ fontSize: '0.72rem', color: '#666', fontFamily: 'monospace' }}>
                  ID: MPLADS-{selectedWork.work_id || selectedWork.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedWork(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
              <div><strong>State:</strong> {selectedWork.state_name || selectedWork.state || 'N/A'}</div>
              <div><strong>District / Constituency:</strong> {selectedWork.const_name || selectedWork.district_name || selectedWork.district || 'N/A'}</div>
              <div><strong>Sanctioned Cost:</strong> {selectedWork.sanction_amount ? `₹${(selectedWork.sanction_amount/100000).toFixed(1)} Lakhs` : '₹25.0 Lakhs'}</div>
              <div><strong>Status:</strong> {selectedWork.status || 'Active in Execution'}</div>
            </div>

            <div style={{
              background: '#FAF8F3',
              border: '1px solid #EAE6DF',
              borderRadius: '6px',
              padding: '0.75rem',
              fontSize: '0.72rem',
              color: '#555',
            }}>
              This work is monitored under the MPLADS Transparency Guidelines. Citizen feedback and RTI inquiries may be routed to the respective District Authority.
            </div>

            <button
              onClick={() => setSelectedWork(null)}
              style={{
                background: '#1D1E22',
                color: '#FFF',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
