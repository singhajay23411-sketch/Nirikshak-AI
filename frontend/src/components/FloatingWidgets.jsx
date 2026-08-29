import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Send, ShieldAlert, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const FloatingWidgets = ({ onLoginClick }) => {
  const { t, language } = useLanguage();
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');

  // Update initial greeting when language changes if no conversation has started
  useEffect(() => {
    setMessages([
      { sender: 'assistant', text: t('floatingWidgets.greeting') }
    ]);
  }, [language, t]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsgs = [...messages, { sender: 'user', text: inputText }];
    setMessages(newMsgs);
    setInputText('');

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: t('floatingWidgets.automatedReply') }
      ]);
    }, 1000);
  };

  const scrollToGeospatial = () => {
    const el = document.getElementById('geospatial');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLoginClick = () => {
    if (onLoginClick) {
      onLoginClick();
    } else {
      alert(t('footer.alerts.login'));
    }
  };

  const [isRiskBtnHovered, setIsRiskBtnHovered] = useState(false);
  const [isRiskBtnPressed, setIsRiskBtnPressed] = useState(false);

  return (
    <>
      {/* Upgraded Premium Floating Risk Map Circular Badge Bottom Left */}
      <div
        onClick={scrollToGeospatial}
        onMouseEnter={() => setIsRiskBtnHovered(true)}
        onMouseLeave={() => { setIsRiskBtnHovered(false); setIsRiskBtnPressed(false); }}
        onMouseDown={() => setIsRiskBtnPressed(true)}
        onMouseUp={() => setIsRiskBtnPressed(false)}
        role="button"
        tabIndex={0}
        aria-label={t('floatingWidgets.riskMapTooltip')}
        title={t('floatingWidgets.riskMapTooltip')}
        style={{
          position: 'fixed',
          bottom: 'clamp(20px, 3vw, 30px)',
          left: 'clamp(20px, 3vw, 30px)',
          zIndex: 999,
          cursor: 'pointer',
          userSelect: 'none',
          outline: 'none',
          transform: isRiskBtnPressed
            ? 'scale(0.96) translate(2px, 3px)'
            : isRiskBtnHovered
            ? 'scale(1.06) translate(-2px, -3px)'
            : 'scale(1) translate(0, 0)',
          transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div
          style={{
            width: '94px',
            height: '94px',
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #F3C756 0%, #E5B842 55%, #D4A32A 100%)',
            border: '1.5px solid #1D1E22',
            boxShadow: isRiskBtnPressed
              ? '0px 0px 0px #1D1E22, 0 2px 6px rgba(0, 0, 0, 0.08)'
              : isRiskBtnHovered
              ? '0 0 24px rgba(82, 183, 154, 0.5), 5px 6px 0px #1D1E22, 0 12px 24px rgba(0, 0, 0, 0.16)'
              : '3.5px 4.5px 0px #1D1E22, 0 6px 16px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            transition: 'box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Detailed SVG Map Stamp Graphic */}
          <svg
            viewBox="0 0 100 100"
            style={{
              width: '100%',
              height: '100%',
              display: 'block'
            }}
          >
            <defs>
              {/* Circular Path for the bottom text */}
              <path
                id="riskMapCirclePath"
                d="M 16,50 A 34,34 0 0,0 84,50"
                fill="none"
              />
            </defs>

            {/* Inner dashed ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#1D1E22"
              strokeWidth="1"
              strokeDasharray={isRiskBtnHovered ? "4 2" : "2.5 2.5"}
              opacity={isRiskBtnHovered ? 0.6 : 0.3}
              style={{ transition: 'all 0.2s ease' }}
            />

            {/* Center Illustrated Folded Map Graphic */}
            <g
              transform={isRiskBtnHovered ? "translate(24, 13) scale(1.06)" : "translate(24, 14)"}
              style={{ transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
              {/* Fold 1 (Left panel) */}
              <polygon
                points="2,9 18,3 18,37 2,43"
                fill="#FFFDF7"
                stroke="#1D1E22"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              {/* Fold 2 (Center panel) */}
              <polygon
                points="18,3 34,9 34,43 18,37"
                fill="#FAF5E8"
                stroke="#1D1E22"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              {/* Fold 3 (Right panel) */}
              <polygon
                points="34,9 50,3 50,37 34,43"
                fill="#F2EBD9"
                stroke="#1D1E22"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />

              {/* Map Route / Contour Line */}
              <path
                d="M 8,30 Q 24,18 44,24"
                fill="none"
                stroke="#52B79A"
                strokeWidth="2.2"
                strokeDasharray="2 1.5"
                strokeLinecap="round"
              />

              {/* Road waypoint node */}
              <circle cx="10" cy="30" r="1.8" fill="#1D1E22" />

              {/* Red Location Pin on Map */}
              <g
                transform={isRiskBtnHovered ? "translate(0, -2)" : "translate(0, 0)"}
                style={{ transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                {/* Pin shadow */}
                <ellipse cx="26" cy="24" rx="4" ry="1.5" fill="rgba(29,30,34,0.3)" />
                {/* Pin body */}
                <path
                  d="M 26,9 C 22,9 19,12 19,16 C 19,21.5 26,27 26,27 C 26,27 33,21.5 33,16 C 33,12 30,9 26,9 Z"
                  fill="#D9534F"
                  stroke="#1D1E22"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                {/* Pin center eye */}
                <circle cx="26" cy="15.5" r="2.2" fill="#FAF8F3" stroke="#1D1E22" strokeWidth="0.8" />
              </g>
            </g>

            {/* Curved Outer Text Stamp */}
            <text
              fill="#1D1E22"
              fontSize="7.8"
              fontWeight="800"
              letterSpacing="2"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              <textPath href="#riskMapCirclePath" startOffset="50%" textAnchor="middle">
                {t('floatingWidgets.riskMapLabel')}
              </textPath>
            </text>
          </svg>
        </div>
      </div>

      {/* Floating Chat Assistant "Nirikshak AI" & Login Button Bottom Right */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '0.85rem'
        }}
      >
        {/* Floating Login Button matching landing-page footer design */}
        <button
          onClick={handleLoginClick}
          className="btn-teal"
          style={{
            justifyContent: 'space-between',
            padding: '0.7rem 1.4rem',
            fontSize: '0.92rem',
            gap: '0.75rem',
            whiteSpace: 'nowrap'
          }}
        >
          <span>{t('footer.actions.login')}</span>
          <ArrowRight size={16} />
        </button>
        {chatOpen ? (
          <div
            style={{
              width: '330px',
              height: '430px',
              background: '#FAF8F3',
              border: '2px solid #1D1E22',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '4px 6px 0px #1D1E22',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div
              style={{
                background: '#52B79A',
                borderBottom: '1.5px solid #1D1E22',
                padding: '0.8rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ fontWeight: 800, color: '#1D1E22', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldAlert size={18} />
                {t('floatingWidgets.assistantTitle')}
              </div>
              <button
                onClick={() => setChatOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} color="#1D1E22" />
              </button>
            </div>

            {/* Chat Body */}
            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {messages.map((m, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                    background: m.sender === 'user' ? '#52B79A' : '#FFFFFF',
                    border: '1px solid #1D1E22',
                    borderRadius: '12px',
                    padding: '0.65rem 0.9rem',
                    fontSize: '0.85rem',
                    maxWidth: '88%',
                    color: '#1D1E22',
                    lineHeight: 1.5
                  }}
                >
                  {m.text}
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSend} style={{ padding: '0.6rem', borderTop: '1.5px solid #1D1E22', background: '#FFFFFF', display: 'flex', gap: '0.4rem' }}>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t('floatingWidgets.inputPlaceholder')}
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.85rem', fontFamily: 'var(--font-sans)' }}
              />
              <button type="submit" style={{ background: '#52B79A', border: '1px solid #1D1E22', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Send size={14} color="#1D1E22" />
              </button>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setChatOpen(true)}
            className="btn-teal"
            style={{ padding: '0.75rem 1.4rem', fontSize: '0.9rem', boxShadow: '3px 4px 0px #1D1E22' }}
          >
            <MessageSquare size={18} />
            {t('floatingWidgets.openChatBtn')}
          </button>
        )}
      </div>
    </>
  );
};

export default FloatingWidgets;

