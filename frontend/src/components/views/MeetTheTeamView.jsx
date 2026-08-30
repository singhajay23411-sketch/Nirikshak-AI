import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import Footer from '../Footer';
import ajayPhoto from '../../assets/Ajay.png';
import vishalPhoto from '../../assets/vishal.jpg';
import prasannPhoto from '../../assets/Prasann.png';
import adityaPhoto from '../../assets/Aditya.png';
import prachiPhoto from '../../assets/prachi.png';
import srishtiPhoto from '../../assets/Srishti.png';

/**
 * Centralized, clean Team SAGE dataset with exact roles and descriptions.
 */
export const TEAM_SAGE_MEMBERS = [
  {
    id: 'ajay-raj',
    name: 'Ajay Raj',
    role: 'Frontend & Product Interface Lead',
    roleHi: 'फ्रंटएंड एवं प्रोडक्ट इंटरफेस लीड',
    image: ajayPhoto,
    avatarInitials: 'AR',
    avatarBg: '#E8F0FE',
    avatarTextColor: '#0A2458',
    description: 'Designed and developed the frontend experience, dashboards and interactive interfaces of Nirikshak AI.',
    descriptionHi: 'निरीक्षक एआई के फ्रंटएंड अनुभव, डैशबोर्ड और इंटरैक्टिव इंटरफेस का डिज़ाइन एवं विकास किया।'
  },
  {
    id: 'vishal-kumar-singh',
    name: 'Vishal Kumar Singh',
    role: 'Backend, Data Engineering & Integration Lead',
    roleHi: 'बैकएंड, डेटा इंजीनियरिंग एवं इंटीग्रेशन लीड',
    image: vishalPhoto,
    avatarInitials: 'VS',
    avatarBg: '#E8F5E9',
    avatarTextColor: '#1E7E34',
    description: 'Leads backend architecture, MPLADS data engineering, database design and system integration.',
    descriptionHi: 'बैकएंड आर्किटेक्चर, एमपीलैड्स डेटा इंजीनियरिंग, डेटाबेस डिज़ाइन और सिस्टम एकीकरण का नेतृत्व करते हैं।'
  },
  {
    id: 'prasann-puri-goswami',
    name: 'Prasann Puri Goswami',
    role: 'AI Analytics & Backend Engineer',
    roleHi: 'एआई एनालिटिक्स एवं बैकएंड इंजीनियर',
    image: prasannPhoto,
    avatarInitials: 'PG',
    avatarBg: '#FEF3C7',
    avatarTextColor: '#92400E',
    description: 'Works on AI analytics, delay and progress-risk analysis and evidence-based anomaly detection.',
    descriptionHi: 'एआई एनालिटिक्स, डिले एवं प्रोग्रेस-रिस्क विश्लेषण और साक्ष्य-आधारित विसंगति पहचान पर कार्य करते हैं।'
  },
  {
    id: 'aditya-mishra',
    name: 'Aditya Mishra',
    role: 'Quality Assurance & Data Validation Associate',
    roleHi: 'क्वालिटी एश्योरेंस एवं डेटा वैलिडेशन एसोसिएट',
    image: adityaPhoto,
    avatarInitials: 'AM',
    avatarBg: '#EDE9FE',
    avatarTextColor: '#5B21B6',
    description: 'Ensures platform reliability through data validation, testing and quality assurance.',
    descriptionHi: 'डेटा सत्यापन, परीक्षण और गुणवत्ता आश्वासन के माध्यम से प्लेटफॉर्म की विश्वसनीयता सुनिश्चित करते हैं।'
  },
  {
    id: 'prachi-phadke',
    name: 'Prachi Phadke',
    role: 'UX Review, Presentation & Demo Lead',
    roleHi: 'यूएक्स रिव्यू, प्रेजेंटेशन एवं डेमो लीड',
    image: prachiPhoto,
    avatarInitials: 'PP',
    avatarBg: '#FCE7F3',
    avatarTextColor: '#9D174D',
    description: 'Focuses on usability, UX review, presentation strategy and the overall demonstration experience.',
    descriptionHi: 'उपयोगिता, यूएक्स समीक्षा, प्रस्तुति रणनीति और समग्र प्रदर्शन अनुभव पर ध्यान केंद्रित करती हैं।'
  },
  {
    id: 'srishti-kumari',
    name: 'Srishti Kumari',
    role: 'Domain Research & Documentation Lead',
    roleHi: 'डोमेन रिसर्च एवं डॉक्यूमेंटेशन लीड',
    image: srishtiPhoto,
    avatarInitials: 'SK',
    avatarBg: '#E0F2FE',
    avatarTextColor: '#0369A1',
    description: 'Leads MPLADS domain research, documentation, policy context and impact analysis.',
    descriptionHi: 'एमपीलैड्स डोमेन अनुसंधान, प्रलेखन, नीति संदर्भ और प्रभाव विश्लेषण का नेतृत्व करती हैं।'
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem', width: '100%', padding: '1rem 0 3rem 0' }}>

      {/* ─── 1. CENTERED HERO TITLE & SUBTITLE ─── */}
      <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto' }}>
        <h1
          style={{
            fontFamily: 'var(--font-serif-primary)',
            fontSize: 'clamp(2.4rem, 4.5vw, 3.4rem)',
            fontWeight: 700,
            color: '#1D1E22',
            margin: '0 0 0.85rem 0',
            lineHeight: 1.15,
            letterSpacing: '-0.01em'
          }}
        >
          {isHi ? 'Meet Team SAGE (टीम सेज से मिलें)' : 'Meet Team SAGE'}
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(1rem, 1.8vw, 1.18rem)',
            color: '#4A4D55',
            margin: 0,
            lineHeight: 1.6,
            fontWeight: 500
          }}
        >
          The team behind Nirikshak AI • MPLADS
        </p>
      </div>

      {/* ─── 2. CLEAN 3-COLUMN DESKTOP GRID ─── */}
      <div className="team-grid-desktop">
        {TEAM_SAGE_MEMBERS.map((member) => {
          const isHovered = hoveredMemberId === member.id;
          const isTapped = expandedMemberId === member.id;
          const isExpanded = isHovered || isTapped;

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
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                outline: 'none',
                transform: isExpanded ? 'translateY(-8px) scale(1.015)' : 'translateY(0) scale(1)',
                transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
                userSelect: 'none'
              }}
            >
              {/* Photo Box */}
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  borderRadius: '16px',
                  border: '1.5px solid #1D1E22',
                  boxShadow: isExpanded ? '5px 7px 0px #1D1E22' : '3px 4px 0px #1D1E22',
                  overflow: 'hidden',
                  background: member.avatarBg,
                  position: 'relative',
                  marginBottom: '0.85rem',
                  transition: 'box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <img
                  src={member.image}
                  alt={member.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center top',
                    display: 'block',
                    transition: 'transform 0.32s ease',
                    transform: isExpanded ? 'scale(1.04)' : 'scale(1)'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />

                {/* Fallback stylized avatar initials if image is missing */}
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
                    fontSize: '1.8rem',
                    color: member.avatarTextColor,
                    zIndex: -1
                  }}
                >
                  {member.avatarInitials}
                </div>
              </div>

              {/* Text Information Below Photo: Name & Role (Always Visible) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-serif-primary)',
                    fontSize: 'clamp(1.05rem, 1.15vw, 1.25rem)',
                    fontWeight: 700,
                    color: '#1D1E22',
                    margin: 0,
                    lineHeight: 1.2
                  }}
                >
                  {member.name}
                </h3>

                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'clamp(0.78rem, 0.88vw, 0.86rem)',
                    color: '#0A2458',
                    fontWeight: 600,
                    lineHeight: 1.3
                  }}
                >
                  {isHi ? member.roleHi : member.role}
                </div>

                {/* Short 2–3 Line Professional Description — Revealed on Hover/Tap with Fade + Slide-up */}
                <div
                  style={{
                    maxHeight: isExpanded ? '140px' : '0px',
                    opacity: isExpanded ? 1 : 0,
                    transform: isExpanded ? 'translateY(0)' : 'translateY(6px)',
                    transition: 'max-height 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease, transform 0.25s ease, margin-top 0.25s ease',
                    overflow: 'hidden',
                    marginTop: isExpanded ? '0.35rem' : '0px'
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.78rem',
                      color: '#4A4D55',
                      lineHeight: 1.45,
                      margin: 0
                    }}
                  >
                    “{isHi ? member.descriptionHi : member.description}”
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Global Footer */}
      <Footer hideCTAButtons={true} />
    </div>
  );
};

export default MeetTheTeamView;
