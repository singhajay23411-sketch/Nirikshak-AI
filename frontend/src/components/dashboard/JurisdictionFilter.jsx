import React, { useState, useEffect } from 'react';
import { Filter, MapPin, Check } from 'lucide-react';
import { useAuth, ROLES } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const STATES = [
  'All States',
  'Uttar Pradesh',
  'Bihar',
  'Madhya Pradesh',
  'Andhra Pradesh',
  'Maharashtra',
  'Karnataka',
  'Kerala',
  'Rajasthan',
  'West Bengal',
  'Tamil Nadu',
];

const DISTRICTS_BY_STATE = {
  'Uttar Pradesh': ['All Districts', 'Varanasi', 'Lucknow', 'Gautam Buddha Nagar', 'Gorakhpur', 'Prayagraj'],
  'Bihar': ['All Districts', 'Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Nalanda'],
  'Madhya Pradesh': ['All Districts', 'Jabalpur', 'Indore', 'Bhopal', 'Gwalior', 'Ujjain'],
  'Andhra Pradesh': ['All Districts', 'Kurnool', 'Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati'],
  'Maharashtra': ['All Districts', 'Pune', 'Mumbai Suburban', 'Nagpur', 'Nashik', 'Thane'],
  'Karnataka': ['All Districts', 'Bengaluru Urban', 'Mysuru', 'Belagavi', 'Dharwad'],
  'Kerala': ['All Districts', 'Wayanad', 'Ernakulam', 'Thiruvananthapuram', 'Kozhikode'],
};

export default function JurisdictionFilter({ onFilterChange }) {
  const { user, isRole } = useAuth();
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const isStateOfficer = typeof isRole === 'function' ? isRole(ROLES.STATE_NODAL_OFFICER) : false;
  const isDistrictOfficer = typeof isRole === 'function' ? isRole(ROLES.DISTRICT_AUTHORITY) : false;

  const lockedState = isStateOfficer || isDistrictOfficer ? user?.state : null;
  const lockedDistrict = isDistrictOfficer ? user?.district : null;

  const [selectedState, setSelectedState] = useState(lockedState || 'All States');
  const [selectedDistrict, setSelectedDistrict] = useState(lockedDistrict || 'All Districts');

  useEffect(() => {
    if (lockedState) setSelectedState(lockedState);
    if (lockedDistrict) setSelectedDistrict(lockedDistrict);
  }, [lockedState, lockedDistrict]);

  const handleStateChange = (st) => {
    setSelectedState(st);
    setSelectedDistrict('All Districts');
    if (onFilterChange) {
      onFilterChange({
        state: st === 'All States' ? null : st,
        district: null,
      });
    }
  };

  const handleDistrictChange = (dist) => {
    setSelectedDistrict(dist);
    if (onFilterChange) {
      onFilterChange({
        state: selectedState === 'All States' ? null : selectedState,
        district: dist === 'All Districts' ? null : dist,
      });
    }
  };

  const availableDistricts = DISTRICTS_BY_STATE[selectedState] || ['All Districts'];

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      background: '#FFFFFF',
      border: '1px solid #1D1E22',
      borderRadius: '8px',
      padding: '0.35rem 0.65rem',
      boxShadow: '1px 1.5px 0px #1D1E22',
    }}>
      <Filter size={13} color="#555" />
      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1D1E22', textTransform: 'uppercase' }}>
        {isHi ? 'फ़िल्टर:' : 'Filter:'}
      </span>

      {/* State Selector */}
      <select
        value={selectedState}
        disabled={Boolean(lockedState)}
        onChange={(e) => handleStateChange(e.target.value)}
        style={{
          border: '1px solid #CCC',
          borderRadius: '4px',
          padding: '0.2rem 0.4rem',
          fontSize: '0.74rem',
          fontWeight: 600,
          background: lockedState ? '#F5F5F5' : '#FFF',
          cursor: lockedState ? 'not-allowed' : 'pointer',
          outline: 'none',
        }}
      >
        {lockedState ? (
          <option value={lockedState}>{lockedState}</option>
        ) : (
          STATES.map(s => <option key={s} value={s}>{s}</option>)
        )}
      </select>

      {/* District Selector */}
      <select
        value={selectedDistrict}
        disabled={Boolean(lockedDistrict)}
        onChange={(e) => handleDistrictChange(e.target.value)}
        style={{
          border: '1px solid #CCC',
          borderRadius: '4px',
          padding: '0.2rem 0.4rem',
          fontSize: '0.74rem',
          fontWeight: 600,
          background: lockedDistrict ? '#F5F5F5' : '#FFF',
          cursor: lockedDistrict ? 'not-allowed' : 'pointer',
          outline: 'none',
        }}
      >
        {lockedDistrict ? (
          <option value={lockedDistrict}>{lockedDistrict}</option>
        ) : (
          availableDistricts.map(d => <option key={d} value={d}>{d}</option>)
        )}
      </select>
    </div>
  );
}
