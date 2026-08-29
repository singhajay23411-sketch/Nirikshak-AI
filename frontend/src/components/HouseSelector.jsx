import React, { useState, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const HouseSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHouseId, setSelectedHouseId] = useState('both');
  const timeoutRef = useRef(null);
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const houses = [
    { id: 'lok-sabha', en: 'Lok Sabha', hi: 'लोकसभा' },
    { id: 'rajya-sabha', en: 'Rajya Sabha', hi: 'राज्यसभा' },
    { id: 'both', en: 'Both Houses', hi: 'दोनों सदन' },
  ];

  const currentHouse = houses.find(h => h.id === selectedHouseId) || houses[2];
  const displayLabel = isHi ? currentHouse.hi : currentHouse.en.toUpperCase();

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 180);
  };

  const handleSelect = (houseId) => {
    setSelectedHouseId(houseId);
    setIsOpen(false);
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Button displaying selected house */}
      <button
        type="button"
        className="btn-teal"
        aria-haspopup="true"
        aria-expanded={isOpen}
        style={{
          padding: '0.65rem 0.85rem',
          fontSize: '0.82rem',
          fontWeight: 700,
          minWidth: '136px',
          height: '42px',
          boxSizing: 'border-box',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          position: 'relative',
          userSelect: 'none',
          outline: 'none',
          lineHeight: 1.2,
          color: '#1D1E22',
          letterSpacing: isHi ? 'normal' : '0.04em',
          fontFamily: 'var(--font-sans)'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayLabel}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={2.5}
          color="#1D1E22"
          style={{
            flexShrink: 0,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
        />
      </button>

      {/* Invisible Hover Bridge to ensure zero cursor disconnection */}
      <div
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          height: '8px',
          background: 'transparent',
          pointerEvents: isOpen ? 'auto' : 'none'
        }}
      />

      {/* Dropdown Menu */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          minWidth: '155px',
          background: '#FAF8F3',
          border: '1.5px solid #1D1E22',
          borderRadius: 'var(--radius-md)',
          boxShadow: '3px 4px 0px #1D1E22',
          padding: '0.4rem 0',
          zIndex: 1000,
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          transform: isOpen ? 'translateY(0)' : 'translateY(-6px)',
          transition: 'opacity 0.2s ease, transform 0.2s ease, visibility 0.2s',
          pointerEvents: isOpen ? 'auto' : 'none'
        }}
      >
        {houses.map((house, idx) => {
          const isSelected = selectedHouseId === house.id;
          const isLast = idx === houses.length - 1;
          const itemLabel = isHi ? house.hi : house.en;

          return (
            <div
              key={house.id}
              onClick={() => handleSelect(house.id)}
              style={{
                padding: '0.6rem 1rem',
                fontSize: '0.85rem',
                fontWeight: isSelected ? 700 : 600,
                color: '#1D1E22',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
                transition: 'background-color 0.15s ease, color 0.15s ease',
                borderBottom: isLast ? 'none' : '1px solid rgba(29, 30, 34, 0.08)',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(82, 183, 154, 0.22)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span>{itemLabel}</span>
              {isSelected && (
                <Check size={14} strokeWidth={2.8} color="#1D1E22" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HouseSelector;
