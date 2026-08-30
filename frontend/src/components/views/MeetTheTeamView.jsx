import React, { useState } from 'react';
import { 
  Users, Shield, Sparkles, CheckCircle2, 
  ArrowRight, Code, Database, Cpu, BarChart3, 
  Palette, Compass
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import Footer from '../Footer';
import ajayPhoto from '../../assets/Ajay.png';

/**
 * Reusable Centralized Team Members Data Array
 * All 6 members stored in one clean, easily editable data structure.
 * Replace any image URL or file path easily.
 */
export const TEAM_SAGE_MEMBERS = [
  {
    id: 'ajay',
    name: 'Ajay',
    role: 'Frontend Developer',
    roleHi: 'फ्रंटएंड डेवलपर',
    badge: 'Frontend Architecture',
    badgeColor: '#0A2458',
    image: ajayPhoto,
    avatarInitials: 'AJ',
    avatarBg: '#E8F0FE',
    avatarTextColor: '#0A2458',
    shortBio: 'Builds the frontend experience and user interface of Nirikshak AI • MPLADS.',
    shortBioHi: 'निरीक्षक एआई • एमपीलैड्स के फ्रंटएंड अनुभव और यूजर इंटरफेस का निर्माण करते हैं।',
    responsibilities: 'Develops responsive interfaces, dashboard screens and frontend interactions.',
    responsibilitiesHi: 'रिस्पॉन्सिव इंटरफेस, डैशबोर्ड स्क्रीन और फ्रंटएंड इंटरैक्शन विकसित करते हैं।',
    expertise: 'React, JavaScript, UI development and responsive design.',
    expertiseHi: 'React, JavaScript, UI डेवलपमेंट और रिस्पॉन्सिव डिज़ाइन।',
    skills: ['React', 'JavaScript (ES6+)', 'UI Development', 'Responsive Design', 'Tailwind/CSS'],
    icon: Code
  },
  {
    id: 'vishal',
    name: 'Vishal',
    role: 'Backend Developer',
    roleHi: 'बैकएंड डेवलपर',
    badge: 'Backend & APIs',
    badgeColor: '#1E7E34',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    avatarInitials: 'VS',
    avatarBg: '#E8F5E9',
    avatarTextColor: '#1E7E34',
    shortBio: 'Builds the backend services and APIs that power the platform.',
    shortBioHi: 'प्लेटफॉर्म को संचालित करने वाले बैकएंड सेवाओं और एपीआई का निर्माण करते हैं।',
    responsibilities: 'Develops APIs, backend logic, data handling and system integration.',
    responsibilitiesHi: 'एपीआई, बैकएंड लॉजिक, डेटा हैंडलिंग और सिस्टम इंटीग्रेशन विकसित करते हैं।',
    expertise: 'Backend development, APIs, databases and system architecture.',
    expertiseHi: 'बैकएंड डेवलपमेंट, एपीआई, डेटाबेस और सिस्टम आर्किटेक्चर।',
    skills: ['Backend APIs', 'Node.js/Python', 'Database Architecture', 'System Integration', 'REST'],
    icon: Database
  },
  {
    id: 'demo-ai-ml',
    name: 'Demo Member',
    role: 'AI/ML Developer',
    roleHi: 'एआई/एमएल डेवलपर',
    badge: 'AI & Anomaly Models',
    badgeColor: '#0A2458',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    avatarInitials: 'DM',
    avatarBg: '#E8F0FE',
    avatarTextColor: '#0A2458',
    shortBio: 'Works on intelligent models used for MPLADS project risk analysis.',
    shortBioHi: 'एमपीलैड्स परियोजना जोखिम विश्लेषण के लिए उपयोग किए जाने वाले बुद्धिमान मॉडल पर काम करते हैं।',
    responsibilities: 'Develops and integrates AI/ML models for detecting project risks and anomalies.',
    responsibilitiesHi: 'परियोजना जोखिमों और विसंगतियों का पता लगाने के लिए एआई/एमएल मॉडल विकसित और एकीकृत करते हैं।',
    expertise: 'Machine learning, predictive analysis and AI model integration.',
    expertiseHi: 'मशीन लर्निंग, प्रेडिक्टिव एनालिसिस और एआई मॉडल इंटीग्रेशन।',
    skills: ['Machine Learning', 'Predictive Analysis', 'Anomaly Detection', 'Risk Scoring', 'PyTorch'],
    icon: Cpu
  },
  {
    id: 'demo-data-analyst',
    name: 'Demo Member',
    role: 'Data Analyst',
    roleHi: 'डेटा विश्लेषक',
    badge: 'Data Intelligence',
    badgeColor: '#854D0E',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    avatarInitials: 'DM',
    avatarBg: '#FEF9C3',
    avatarTextColor: '#854D0E',
    shortBio: 'Transforms MPLADS project data into meaningful insights.',
    shortBioHi: 'एमपीलैड्स परियोजना डेटा को सार्थक अंतर्दृष्टि में परिवर्तित करते हैं।',
    responsibilities: 'Analyzes project data, identifies patterns and supports data-driven decisions.',
    responsibilitiesHi: 'परियोजना डेटा का विश्लेषण करते हैं, पैटर्न की पहचान करते हैं और डेटा-संचालित निर्णयों का समर्थन करते हैं।',
    expertise: 'Data analysis, statistics, Python and data visualization.',
    expertiseHi: 'डेटा विश्लेषण, सांख्यिकी, पायथन और डेटा विज़ुअलाइज़ेशन।',
    skills: ['Data Analysis', 'Statistics', 'Python / Pandas', 'Data Visualization', 'MoSPI Metrics'],
    icon: BarChart3
  },
  {
    id: 'demo-ui-ux',
    name: 'Demo Member',
    role: 'UI/UX Designer',
    roleHi: 'यूआई/यूएक्स डिज़ाइनर',
    badge: 'Product & Visual Design',
    badgeColor: '#D9534F',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    avatarInitials: 'DM',
    avatarBg: '#FEF2F2',
    avatarTextColor: '#D9534F',
    shortBio: 'Designs clear, accessible and user-friendly experiences.',
    shortBioHi: 'स्पष्ट, सुलभ और उपयोगकर्ता के अनुकूल अनुभवों को डिज़ाइन करते हैं।',
    responsibilities: 'Creates intuitive layouts and improves usability across the platform.',
    responsibilitiesHi: 'सहज ज्ञान युक्त लेआउट बनाते हैं और पूरे प्लेटफॉर्म पर उपयोगिता में सुधार करते हैं।',
    expertise: 'UI/UX design, user research and interface design.',
    expertiseHi: 'यूआई/यूएक्स डिज़ाइन, उपयोगकर्ता अनुसंधान और इंटरफ़ेस डिज़ाइन।',
    skills: ['UI/UX Design', 'User Research', 'Interface Design', 'Accessibility', 'Figma'],
    icon: Palette
  },
  {
    id: 'demo-project-lead',
    name: 'Demo Member',
    role: 'Project & Research Lead',
    roleHi: 'प्रोजेक्ट एवं रिसर्च लीड',
    badge: 'Research & Strategy',
    badgeColor: '#1E7E34',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
    avatarInitials: 'DM',
    avatarBg: '#E8F5E9',
    avatarTextColor: '#1E7E34',
    shortBio: 'Coordinates research, project direction and overall solution development.',
    shortBioHi: 'अनुसंधान, परियोजना दिशा और समग्र समाधान विकास का समन्वय करते हैं।',
    responsibilities: 'Guides project planning, research and coordination across the team.',
    responsibilitiesHi: 'टीम भर में परियोजना योजना, अनुसंधान और समन्वय का मार्गदर्शन करते हैं।',
    expertise: 'Research, project planning, documentation and coordination.',
    expertiseHi: 'अनुसंधान, परियोजना योजना, प्रलेखन और समन्वय।',
    skills: ['Research', 'Project Planning', 'Documentation', 'Coordination', 'Public Policy'],
    icon: Compass
  }
];

const MeetTheTeamView = () => {
  const { language } = useLanguage();
  const isHi = language === 'hi';

  // State for mobile tap expansion (only ONE card expanded at a time)
  const [expandedMemberId, setExpandedMemberId] = useState(null);
  // State for desktop hover expansion (only hovered card expands)
  const [hoveredMemberId, setHoveredMemberId] = useState(null);

  const handleCardClick = (id) => {
    setExpandedMemberId(prev => (prev === id ? null : id));
  };

  const handleKeyDown = (e, id) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick(id);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', width: '100%' }}>
      {/* ─── 1. PAGE HEADER & TITLE ─── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.25rem',
          borderBottom: '1.5px solid #1D1E22',
          paddingBottom: '1.5rem'
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.76rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.35rem' }}>
            <Users size={15} color="#0A2458" />
            <span>TEAM SAGE • {isHi ? 'परियोजना निर्माता' : 'CREATORS'}</span>
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-serif-primary)',
              fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
              fontWeight: 800,
              color: '#1D1E22',
              margin: 0,
              lineHeight: 1.15
            }}
          >
            {isHi ? 'Meet Team SAGE (टीम सेज से मिलें)' : 'Meet Team SAGE'}
          </h1>
          <p
            style={{
              fontSize: '1.02rem',
              color: 'var(--color-text-secondary)',
              marginTop: '0.5rem',
              margin: '0.5rem 0 0 0',
              maxWidth: '780px',
              lineHeight: 1.55
            }}
          >
            The team behind Nirikshak AI • MPLADS
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 800,
              padding: '0.4rem 1rem',
              background: '#FFFFFF',
              border: '1.5px solid #1D1E22',
              borderRadius: 'var(--radius-full)',
              boxShadow: '1.5px 2px 0px #1D1E22',
              color: '#0A2458',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}
          >
            <Sparkles size={14} color="#52B79A" />
            <span>TEAM SAGE • 6 {isHi ? 'सदस्य' : 'Members'}</span>
          </span>
        </div>
      </div>

      {/* ─── 2. STRICT 3-COLUMN DESKTOP GRID (3 CARDS ROW 1, 3 CARDS ROW 2) ─── */}
      <div className="team-grid-desktop">
        {TEAM_SAGE_MEMBERS.map((member, index) => {
          const isHovered = hoveredMemberId === member.id;
          const isTapped = expandedMemberId === member.id;
          const isExpanded = isHovered || isTapped;
          const IconComponent = member.icon || Users;

          return (
            <div
              key={member.id}
              tabIndex={0}
              role="button"
              aria-expanded={isExpanded}
              aria-label={`${member.name} - ${member.role}`}
              onClick={() => handleCardClick(member.id)}
              onKeyDown={(e) => handleKeyDown(e, member.id)}
              onMouseEnter={() => setHoveredMemberId(member.id)}
              onMouseLeave={() => setHoveredMemberId(null)}
              className="team-member-card"
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #1D1E22',
                borderRadius: 'var(--radius-lg)',
                padding: '1.65rem',
                boxShadow: isExpanded ? '6px 8px 0px #1D1E22' : '3px 4px 0px #1D1E22',
                transform: isExpanded ? 'translateY(-8px) scale(1.015)' : 'translateY(0) scale(1)',
                transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                outline: 'none'
              }}
            >
              {/* Top Row: Index Tag & Domain Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    padding: '0.2rem 0.55rem',
                    background: '#FAF8F3',
                    border: '1px solid #1D1E22',
                    borderRadius: 'var(--radius-sm)',
                    color: '#0A2458'
                  }}
                >
                  TEAM SAGE • 0{index + 1}
                </span>

                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '0.2rem 0.6rem',
                    background: member.avatarBg,
                    border: `1px solid ${member.badgeColor}`,
                    borderRadius: 'var(--radius-full)',
                    color: member.badgeColor,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <IconComponent size={12} strokeWidth={2.4} />
                  <span>{member.badge}</span>
                </span>
              </div>

              {/* Profile Image & Member Identity */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem', marginBottom: '1rem' }}>
                {/* Profile Image with graceful fallback to stylized avatar */}
                <div
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    border: '2px solid #1D1E22',
                    boxShadow: isExpanded ? '2px 3px 0px #1D1E22' : '1.5px 2px 0px #1D1E22',
                    overflow: 'hidden',
                    background: member.avatarBg,
                    flexShrink: 0,
                    position: 'relative',
                    transition: 'transform 0.28s ease',
                    transform: isExpanded ? 'scale(1.05)' : 'scale(1)'
                  }}
                >
                  <img
                    src={member.image}
                    alt={member.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-serif-primary)',
                      fontWeight: 800,
                      fontSize: '1.4rem',
                      color: member.avatarTextColor,
                      zIndex: -1
                    }}
                  >
                    {member.avatarInitials}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      fontFamily: 'var(--font-serif-primary)',
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      color: '#1D1E22',
                      margin: 0,
                      lineHeight: 1.2
                    }}
                  >
                    {member.name}
                  </h3>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      color: '#0A2458',
                      fontWeight: 700,
                      marginTop: '0.2rem',
                      lineHeight: 1.3
                    }}
                  >
                    {isHi ? member.roleHi : member.role}
                  </div>
                </div>
              </div>

              {/* Short 1-Line Basic Description (Always Visible in Normal State) */}
              <p
                style={{
                  fontSize: '0.86rem',
                  color: '#4A4D55',
                  margin: '0 0 0.85rem 0',
                  lineHeight: 1.45,
                  minHeight: '2.8em'
                }}
              >
                {isHi ? member.shortBioHi : member.shortBio}
              </p>

              {/* Expanded Detail Panel — Revealed smoothly on Cursor Hover / Mobile Tap */}
              <div
                style={{
                  maxHeight: isExpanded ? '340px' : '0px',
                  opacity: isExpanded ? 1 : 0,
                  transform: isExpanded ? 'translateY(0)' : 'translateY(8px)',
                  transition: 'max-height 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease, transform 0.25s ease',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}
              >
                <div style={{ height: '1px', background: 'rgba(29, 30, 34, 0.12)', margin: '0.1rem 0' }} />

                {/* Key Responsibilities */}
                <div style={{ background: '#FAF8F3', border: '1px solid rgba(29, 30, 34, 0.15)', borderRadius: 'var(--radius-sm)', padding: '0.65rem 0.85rem' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>
                    {isHi ? 'जिम्मेदारियां (RESPONSIBILITIES)' : 'RESPONSIBILITIES'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#1D1E22', fontWeight: 600, lineHeight: 1.35 }}>
                    {isHi ? member.responsibilitiesHi : member.responsibilities}
                  </div>
                </div>

                {/* Relevant Expertise */}
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0A2458', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>
                    {isHi ? 'विशेषज्ञता (EXPERTISE)' : 'EXPERTISE'}
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#4A4D55', margin: 0, lineHeight: 1.4 }}>
                    {isHi ? member.expertiseHi : member.expertise}
                  </p>
                </div>

                {/* Relevant Skills Pill Tags */}
                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.1rem' }}>
                    {member.skills.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          background: '#F3EFE6',
                          border: '1px solid rgba(29, 30, 34, 0.2)',
                          borderRadius: 'var(--radius-full)',
                          color: '#1D1E22'
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Cue Indicator in Normal State */}
              {!isExpanded && (
                <div style={{ marginTop: 'auto', paddingTop: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--color-text-muted)', fontWeight: 600, borderTop: '1px dashed rgba(29, 30, 34, 0.12)' }}>
                  <span>{isHi ? 'विवरण के लिए होवर / टैप करें' : 'Hover / tap for details'}</span>
                  <ArrowRight size={13} color="var(--color-accent-teal-hover)" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── 3. TEAM SAGE MISSION CARD ─── */}
      <div
        style={{
          background: '#FAF8F3',
          border: '1.5px solid #1D1E22',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem 2.25rem',
          boxShadow: '3px 4px 0px #1D1E22',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0A2458', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          <Shield size={16} />
          <span>TEAM SAGE • {isHi ? 'हमारा दृष्टिकोण' : 'CORE MISSION'}</span>
        </div>
        <h3 style={{ fontFamily: 'var(--font-serif-primary)', fontSize: '1.45rem', fontWeight: 800, color: '#1D1E22', margin: 0, lineHeight: 1.3 }}>
          {isHi
            ? 'सार्वजनिक अवसंरचना विकास में पूर्ण पारदर्शिता और निष्पक्ष जवाबदेही'
            : 'Multi-Signal Algorithmic Vigilance & Public Transparency for India'}
        </h3>
        <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.55, maxWidth: '900px' }}>
          {isHi
            ? 'टीम सेज (TEAM SAGE) द्वारा विकसित निरीक्षक एआई (Nirikshak AI) प्लेटफॉर्म भारत भर में एमपीलैड्स फंड के हर एक रुपये के उपयोग की स्वतंत्र, पारदर्शी और डेटा-संचालित निगरानी सुनिश्चित करता है।'
            : 'Engineered by Team SAGE, Nirikshak AI bridges citizen oversight with automated multi-signal risk intelligence across all 543 Lok Sabha and 245 Rajya Sabha constituencies in India.'}
        </p>
      </div>

      {/* Global Footer with CTA hidden */}
      <Footer hideCTAButtons={true} />
    </div>
  );
};

export default MeetTheTeamView;
