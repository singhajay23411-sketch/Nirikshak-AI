// State-level MPLADS risk data for all Indian states and union territories.
// Replace mock values with API/database data when available.

const stateRiskData = {
  // States
  'ap': { name: 'Andhra Pradesh',       riskLevel: 'Medium',   riskScore: 52, projects: 284, sanctionedAmount: '₹58.3 Cr', anomalies: 6 },
  'ar': { name: 'Arunachal Pradesh',    riskLevel: 'Low',      riskScore: 18, projects: 42,  sanctionedAmount: '₹8.4 Cr',  anomalies: 1 },
  'as': { name: 'Assam',                riskLevel: 'High',     riskScore: 71, projects: 198, sanctionedAmount: '₹41.7 Cr', anomalies: 9 },
  'br': { name: 'Bihar',                riskLevel: 'Critical', riskScore: 89, projects: 342, sanctionedAmount: '₹72.1 Cr', anomalies: 18 },
  'ct': { name: 'Chhattisgarh',         riskLevel: 'High',     riskScore: 68, projects: 167, sanctionedAmount: '₹34.2 Cr', anomalies: 8 },
  'ga': { name: 'Goa',                  riskLevel: 'Low',      riskScore: 14, projects: 38,  sanctionedAmount: '₹7.8 Cr',  anomalies: 0 },
  'gj': { name: 'Gujarat',              riskLevel: 'Medium',   riskScore: 45, projects: 310, sanctionedAmount: '₹65.4 Cr', anomalies: 5 },
  'hr': { name: 'Haryana',              riskLevel: 'Medium',   riskScore: 48, projects: 175, sanctionedAmount: '₹36.8 Cr', anomalies: 4 },
  'hp': { name: 'Himachal Pradesh',     riskLevel: 'Low',      riskScore: 22, projects: 85,  sanctionedAmount: '₹17.2 Cr', anomalies: 1 },
  'jk': { name: 'Jammu and Kashmir',    riskLevel: 'High',     riskScore: 73, projects: 124, sanctionedAmount: '₹26.1 Cr', anomalies: 7 },
  'jh': { name: 'Jharkhand',            riskLevel: 'Critical', riskScore: 85, projects: 215, sanctionedAmount: '₹45.3 Cr', anomalies: 14 },
  'ka': { name: 'Karnataka',            riskLevel: 'Medium',   riskScore: 41, projects: 298, sanctionedAmount: '₹62.7 Cr', anomalies: 5 },
  'kl': { name: 'Kerala',               riskLevel: 'Low',      riskScore: 19, projects: 115, sanctionedAmount: '₹22.1 Cr', anomalies: 1 },
  'mp': { name: 'Madhya Pradesh',       riskLevel: 'Critical', riskScore: 87, projects: 385, sanctionedAmount: '₹81.2 Cr', anomalies: 16 },
  'mh': { name: 'Maharashtra',          riskLevel: 'High',     riskScore: 64, projects: 412, sanctionedAmount: '₹85.6 Cr', anomalies: 10 },
  'mn': { name: 'Manipur',              riskLevel: 'Medium',   riskScore: 55, projects: 56,  sanctionedAmount: '₹11.4 Cr', anomalies: 3 },
  'ml': { name: 'Meghalaya',            riskLevel: 'Medium',   riskScore: 49, projects: 64,  sanctionedAmount: '₹13.1 Cr', anomalies: 3 },
  'mz': { name: 'Mizoram',              riskLevel: 'Low',      riskScore: 16, projects: 35,  sanctionedAmount: '₹7.1 Cr',  anomalies: 0 },
  'nl': { name: 'Nagaland',             riskLevel: 'Medium',   riskScore: 53, projects: 48,  sanctionedAmount: '₹9.8 Cr',  anomalies: 3 },
  'or': { name: 'Odisha',               riskLevel: 'High',     riskScore: 66, projects: 245, sanctionedAmount: '₹51.8 Cr', anomalies: 9 },
  'pb': { name: 'Punjab',               riskLevel: 'Medium',   riskScore: 44, projects: 162, sanctionedAmount: '₹33.5 Cr', anomalies: 4 },
  'rj': { name: 'Rajasthan',            riskLevel: 'High',     riskScore: 69, projects: 328, sanctionedAmount: '₹68.9 Cr', anomalies: 11 },
  'sk': { name: 'Sikkim',               riskLevel: 'Low',      riskScore: 12, projects: 28,  sanctionedAmount: '₹5.6 Cr',  anomalies: 0 },
  'tn': { name: 'Tamil Nadu',           riskLevel: 'Medium',   riskScore: 43, projects: 356, sanctionedAmount: '₹74.2 Cr', anomalies: 5 },
  'tg': { name: 'Telangana',            riskLevel: 'High',     riskScore: 62, projects: 189, sanctionedAmount: '₹39.8 Cr', anomalies: 7 },
  'tr': { name: 'Tripura',              riskLevel: 'Medium',   riskScore: 47, projects: 52,  sanctionedAmount: '₹10.6 Cr', anomalies: 2 },
  'up': { name: 'Uttar Pradesh',        riskLevel: 'Critical', riskScore: 92, projects: 520, sanctionedAmount: '₹108.4 Cr', anomalies: 24 },
  'ut': { name: 'Uttarakhand',          riskLevel: 'Medium',   riskScore: 46, projects: 95,  sanctionedAmount: '₹19.4 Cr', anomalies: 3 },
  'wb': { name: 'West Bengal',          riskLevel: 'Critical', riskScore: 83, projects: 278, sanctionedAmount: '₹58.7 Cr', anomalies: 15 },

  // Union Territories
  'an': { name: 'Andaman and Nicobar',  riskLevel: 'Low',      riskScore: 11, projects: 18,  sanctionedAmount: '₹3.6 Cr',  anomalies: 0 },
  'ch': { name: 'Chandigarh',           riskLevel: 'Low',      riskScore: 15, projects: 22,  sanctionedAmount: '₹4.5 Cr',  anomalies: 0 },
  'dn': { name: 'Dadra and Nagar Haveli', riskLevel: 'Low',    riskScore: 13, projects: 15,  sanctionedAmount: '₹3.1 Cr',  anomalies: 0 },
  'dd': { name: 'Daman and Diu',        riskLevel: 'Low',      riskScore: 10, projects: 12,  sanctionedAmount: '₹2.4 Cr',  anomalies: 0 },
  'dl': { name: 'Delhi',                riskLevel: 'High',     riskScore: 61, projects: 88,  sanctionedAmount: '₹18.2 Cr', anomalies: 5 },
  'ld': { name: 'Lakshadweep',          riskLevel: 'Low',      riskScore: 8,  projects: 8,   sanctionedAmount: '₹1.6 Cr',  anomalies: 0 },
  'py': { name: 'Puducherry',           riskLevel: 'Low',      riskScore: 17, projects: 25,  sanctionedAmount: '₹5.1 Cr',  anomalies: 0 },
  'la': { name: 'Ladakh',               riskLevel: 'Medium',   riskScore: 38, projects: 32,  sanctionedAmount: '₹6.5 Cr',  anomalies: 2 },
};

// Color mapping for risk levels
export const RISK_COLORS = {
  Low:      { fill: '#52B79A', fillOpacity: 0.15, hoverOpacity: 0.50, text: '#52B79A' },
  Medium:   { fill: '#E5B842', fillOpacity: 0.15, hoverOpacity: 0.50, text: '#E5B842' },
  High:     { fill: '#E07A5F', fillOpacity: 0.15, hoverOpacity: 0.50, text: '#E07A5F' },
  Critical: { fill: '#D9534F', fillOpacity: 0.15, hoverOpacity: 0.50, text: '#D9534F' },
};

export default stateRiskData;
