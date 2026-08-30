import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, X, Send, ShieldAlert, ArrowRight, RotateCcw,
  ChevronDown, ChevronUp, Database, Sparkles, AlertCircle, CheckCircle2, User, Bot
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { processQueryClientSide } from '../utils/clientAssistantEngine';

/**
 * Safe inline markdown-like formatter that parses bold, lists, and line breaks
 * without using dangerouslySetInnerHTML.
 */
const FormattedMessage = ({ text }) => {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="assistant-formatted-text" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} style={{ height: '0.25rem' }} />;
        }

        // Parse bold segments **bold**
        const parseBold = (str) => {
          const parts = str.split(/(\*\*.*?\*\*)/g);
          return parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
              return <strong key={pIdx} style={{ fontWeight: 700, color: '#1D1E22' }}>{part.slice(2, -2)}</strong>;
            }
            return part;
          });
        };

        // Bullet point
        if (trimmed.startsWith('• ') || trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', paddingLeft: '0.35rem' }}>
              <span style={{ color: '#52B79A', fontWeight: 'bold' }}>•</span>
              <span style={{ flex: 1 }}>{parseBold(trimmed.slice(2))}</span>
            </div>
          );
        }

        // Table header or row with pipes |
        if (trimmed.includes('|') && !trimmed.startsWith('---')) {
          const cells = trimmed.split('|').map(c => c.trim()).filter(c => c.length > 0);
          if (cells.length > 1) {
            return (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: `repeat(${cells.length}, 1fr)`, gap: '0.3rem', background: '#F4EFE6', padding: '0.25rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                {cells.map((cell, cIdx) => (
                  <span key={cIdx} style={{ fontWeight: cIdx === 0 ? 600 : 400 }}>{parseBold(cell)}</span>
                ))}
              </div>
            );
          }
        }

        // Numbered list item
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', paddingLeft: '0.35rem' }}>
              <span style={{ fontWeight: 700, color: '#1D1E22', minWidth: '16px' }}>{numMatch[1]}.</span>
              <span style={{ flex: 1 }}>{parseBold(numMatch[2])}</span>
            </div>
          );
        }

        return (
          <div key={idx} style={{ wordBreak: 'break-word' }}>
            {parseBold(line)}
          </div>
        );
      })}
    </div>
  );
};

const FloatingWidgets = ({ onLoginClick, selectedWorkId, selectedMpId, selectedConstituency, selectedState }) => {
  const { t, language } = useLanguage();
  const { token, isAuthenticated, user } = useAuth();
  
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const [activeEvidenceIndex, setActiveEvidenceIndex] = useState(null);
  const [dataSnapshot, setDataSnapshot] = useState(null);

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Initialize conversation ID on mount
  useEffect(() => {
    setConversationId(`conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
  }, []);

  // Update initial greeting when language changes or on first load
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'greeting',
          sender: 'assistant',
          text: t('floatingWidgets.greeting'),
          suggestions: [
            'Show the top 5 highest-risk projects in Bihar',
            'Which MPs have the highest risk?',
            'Find duplicate alerts for work 158087',
            'What does HHI mean?',
          ],
          evidence: [],
          disclaimer: null,
        }
      ]);
    }
  }, [language, t, messages.length]);

  // Auto scroll to bottom
  useEffect(() => {
    if (chatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, chatOpen]);

  const sendQuery = async (queryText) => {
    const textToSend = queryText || inputText;
    if (!textToSend || !textToSend.trim() || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Build context
    const context = {
      selected_work_id: selectedWorkId || null,
      selected_mp_id: selectedMpId || null,
      selected_constituency: selectedConstituency || null,
      selected_state: selectedState || null,
      current_page: window.location.pathname || 'home',
    };

    try {
      let data = null;

      // 1. First attempt to call the FastAPI server backend
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/api/assistant/query', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            message: textToSend.trim(),
            conversation_id: conversationId,
            context,
          }),
        });

        if (response.ok) {
          data = await response.json();
        }
      } catch (fetchErr) {
        // Backend not reachable, fall through to client-side fallback
        data = null;
      }

      // 2. If backend was unreachable or returned non-200, use client-side analytics processor
      if (!data) {
        data = await processQueryClientSide(textToSend.trim(), context);
      }

      if (data && data.data_snapshot) {
        setDataSnapshot(data.data_snapshot);
      }

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data?.answer || t('floatingWidgets.automatedReply'),
        evidence: data?.evidence || [],
        suggestions: data?.suggestions || [],
        disclaimer: data?.disclaimer || null,
        dataSnapshot: data?.data_snapshot || null,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Assistant query error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: 'assistant',
          isError: true,
          text: 'Unable to process query. Please try asking again.',
          retryQuery: textToSend.trim(),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    sendQuery();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuery();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'greeting-reset',
        sender: 'assistant',
        text: t('floatingWidgets.greeting'),
        suggestions: [
          'Show the top 5 highest-risk projects in Bihar',
          'Which MPs have the highest risk?',
          'What does HHI mean?',
        ],
        evidence: [],
      }
    ]);
    setConversationId(`conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
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
            width: 'clamp(68px, 14vw, 94px)',
            height: 'clamp(68px, 14vw, 94px)',
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
          <svg
            viewBox="0 0 100 100"
            style={{
              width: '100%',
              height: '100%',
              display: 'block'
            }}
          >
            <defs>
              <path
                id="riskMapCirclePath"
                d="M 16,50 A 34,34 0 0,0 84,50"
                fill="none"
              />
            </defs>

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

            <g
              transform={isRiskBtnHovered ? "translate(24, 13) scale(1.06)" : "translate(24, 14)"}
              style={{ transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
              <polygon
                points="2,9 18,3 18,37 2,43"
                fill="#FFFDF7"
                stroke="#1D1E22"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <polygon
                points="18,3 34,9 34,43 18,37"
                fill="#FAF5E8"
                stroke="#1D1E22"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <polygon
                points="34,9 50,3 50,37 34,43"
                fill="#F2EBD9"
                stroke="#1D1E22"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />

              <path
                d="M 8,30 Q 24,18 44,24"
                fill="none"
                stroke="#52B79A"
                strokeWidth="2.2"
                strokeDasharray="2 1.5"
                strokeLinecap="round"
              />

              <circle cx="10" cy="30" r="1.8" fill="#1D1E22" />

              <g
                transform={isRiskBtnHovered ? "translate(0, -2)" : "translate(0, 0)"}
                style={{ transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                <ellipse cx="26" cy="24" rx="4" ry="1.5" fill="rgba(29,30,34,0.3)" />
                <path
                  d="M 26,9 C 22,9 19,12 19,16 C 19,21.5 26,27 26,27 C 26,27 33,21.5 33,16 C 33,12 30,9 26,9 Z"
                  fill="#D9534F"
                  stroke="#1D1E22"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <circle cx="26" cy="15.5" r="2.2" fill="#FAF8F3" stroke="#1D1E22" strokeWidth="0.8" />
              </g>
            </g>

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
          <span>{isAuthenticated ? `${user?.name || user?.email}` : t('footer.actions.login')}</span>
          <ArrowRight size={16} />
        </button>

        {chatOpen ? (
          <div
            style={{
              width: 'clamp(320px, 92vw, 420px)',
              height: 'clamp(420px, 78vh, 580px)',
              background: '#FAF8F3',
              border: '2px solid #1D1E22',
              borderRadius: 'var(--radius-lg, 12px)',
              boxShadow: '5px 7px 0px #1D1E22',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'slideUpFade 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Header */}
            <div
              style={{
                background: '#52B79A',
                borderBottom: '2px solid #1D1E22',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={20} color="#1D1E22" />
                <div>
                  <div style={{ fontWeight: 800, color: '#1D1E22', fontSize: '0.92rem', lineHeight: 1.2 }}>
                    {t('floatingWidgets.assistantTitle')}
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#1D1E22', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#2A9D8F' }} />
                    Decision Support • Live Intelligence
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  onClick={handleClearChat}
                  title={t('floatingWidgets.clearChat')}
                  aria-label={t('floatingWidgets.clearChat')}
                  style={{
                    background: '#FAF8F3',
                    border: '1px solid #1D1E22',
                    borderRadius: '6px',
                    padding: '0.3rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <RotateCcw size={14} color="#1D1E22" />
                </button>
                <button
                  onClick={() => setChatOpen(false)}
                  aria-label="Close Assistant"
                  style={{
                    background: '#FAF8F3',
                    border: '1px solid #1D1E22',
                    borderRadius: '6px',
                    padding: '0.3rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={16} color="#1D1E22" />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div
              style={{
                flex: 1,
                padding: '0.9rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                background: '#FAF8F3'
              }}
            >
              {messages.map((m, i) => (
                <div
                  key={m.id || i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start',
                    gap: '0.35rem',
                    maxWidth: '100%'
                  }}
                >
                  {/* Bubble */}
                  <div
                    style={{
                      background: m.sender === 'user' ? '#52B79A' : (m.isError ? '#FFEBE8' : '#FFFFFF'),
                      border: '1.5px solid #1D1E22',
                      borderRadius: m.sender === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      boxShadow: '2px 3px 0px #1D1E22',
                      padding: '0.75rem 0.95rem',
                      fontSize: '0.86rem',
                      maxWidth: '92%',
                      color: '#1D1E22',
                      lineHeight: 1.5,
                    }}
                  >
                    <FormattedMessage text={m.text} />

                    {/* Retry button on error */}
                    {m.isError && m.retryQuery && (
                      <button
                        onClick={() => sendQuery(m.retryQuery)}
                        style={{
                          marginTop: '0.5rem',
                          background: '#D9534F',
                          color: '#FFFFFF',
                          border: '1px solid #1D1E22',
                          borderRadius: '4px',
                          padding: '0.3rem 0.6rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        <RotateCcw size={12} />
                        {t('floatingWidgets.retry')}
                      </button>
                    )}

                    {/* Disclaimer if present */}
                    {m.disclaimer && (
                      <div
                        style={{
                          marginTop: '0.55rem',
                          paddingTop: '0.45rem',
                          borderTop: '1px dashed #D3CABA',
                          fontSize: '0.72rem',
                          color: '#666666',
                          fontStyle: 'italic'
                        }}
                      >
                        ℹ️ {m.disclaimer}
                      </div>
                    )}
                  </div>

                  {/* Evidence Accordion (Assistant only) */}
                  {m.evidence && m.evidence.length > 0 && (
                    <div style={{ width: '92%', marginLeft: '2px' }}>
                      <button
                        onClick={() => setActiveEvidenceIndex(activeEvidenceIndex === i ? null : i)}
                        style={{
                          background: '#EAE5D9',
                          border: '1px solid #1D1E22',
                          borderRadius: '6px',
                          padding: '0.25rem 0.55rem',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: '#1D1E22',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <Database size={12} />
                        {activeEvidenceIndex === i
                          ? t('floatingWidgets.hideEvidence')
                          : t('floatingWidgets.viewEvidence').replace('{count}', m.evidence.length)}
                        {activeEvidenceIndex === i ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>

                      {activeEvidenceIndex === i && (
                        <div
                          style={{
                            marginTop: '0.35rem',
                            background: '#FFFFFF',
                            border: '1px solid #1D1E22',
                            borderRadius: '6px',
                            padding: '0.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem',
                            fontSize: '0.75rem',
                            boxShadow: '2px 2px 0px #1D1E22'
                          }}
                        >
                          <div style={{ fontWeight: 700, color: '#1D1E22', borderBottom: '1px solid #EAE5D9', paddingBottom: '0.2rem' }}>
                            {t('floatingWidgets.evidence')}
                          </div>
                          {m.evidence.map((ev, evIdx) => (
                            <div key={evIdx} style={{ padding: '0.2rem 0', borderBottom: evIdx < m.evidence.length - 1 ? '1px dashed #F0ECE1' : 'none' }}>
                              <div style={{ fontWeight: 600, color: '#1D1E22' }}>{ev.label}: <span style={{ fontWeight: 400 }}>{ev.value}</span></div>
                              <div style={{ fontSize: '0.68rem', color: '#777', display: 'flex', gap: '0.6rem' }}>
                                <span>{t('floatingWidgets.sourceLabel')}: <strong>{ev.source}</strong></span>
                                {ev.record_id && <span>{t('floatingWidgets.recordLabel')}: {ev.record_id}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Suggestion Chips */}
                  {m.suggestions && m.suggestions.length > 0 && i === messages.length - 1 && !isLoading && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', width: '92%', marginTop: '0.2rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#666' }}>{t('floatingWidgets.suggestions')}</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {m.suggestions.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => sendQuery(sug)}
                            style={{
                              background: '#FAF8F3',
                              border: '1px solid #1D1E22',
                              borderRadius: '16px',
                              padding: '0.25rem 0.6rem',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              color: '#1D1E22',
                              cursor: 'pointer',
                              textAlign: 'left',
                              boxShadow: '1px 2px 0px #1D1E22',
                              transition: 'transform 0.12s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                          >
                            💡 {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div
                  style={{
                    alignSelf: 'flex-start',
                    background: '#FFFFFF',
                    border: '1.5px solid #1D1E22',
                    borderRadius: '12px 12px 12px 2px',
                    boxShadow: '2px 3px 0px #1D1E22',
                    padding: '0.65rem 0.95rem',
                    fontSize: '0.8rem',
                    color: '#555',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Sparkles size={16} color="#52B79A" className="animate-spin" />
                  <span>{t('floatingWidgets.thinking')}</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <form
              onSubmit={handleFormSubmit}
              style={{
                padding: '0.6rem 0.75rem',
                borderTop: '2px solid #1D1E22',
                background: '#FFFFFF',
                display: 'flex',
                alignItems: 'flex-end',
                gap: '0.5rem'
              }}
            >
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('floatingWidgets.inputPlaceholder')}
                disabled={isLoading}
                style={{
                  flex: 1,
                  border: '1px solid #1D1E22',
                  borderRadius: '8px',
                  padding: '0.5rem 0.65rem',
                  fontSize: '0.84rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                  resize: 'none',
                  maxHeight: '80px',
                  lineHeight: 1.4,
                  background: '#FAF8F3'
                }}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                aria-label="Send message"
                style={{
                  background: (!inputText.trim() || isLoading) ? '#CCCCCC' : '#52B79A',
                  border: '1.5px solid #1D1E22',
                  borderRadius: '8px',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: (!inputText.trim() || isLoading) ? 'not-allowed' : 'pointer',
                  boxShadow: (!inputText.trim() || isLoading) ? 'none' : '2px 2px 0px #1D1E22',
                  transition: 'all 0.12s ease'
                }}
              >
                <Send size={15} color="#1D1E22" />
              </button>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setChatOpen(true)}
            className="btn-teal"
            style={{
              padding: '0.75rem 1.4rem',
              fontSize: '0.9rem',
              boxShadow: '3px 4px 0px #1D1E22',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
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
