// frontend/src/services/dataLoader.js

/**
 * Fetches JSON or GeoJSON files from the public /data/ folder.
 * Includes caching to avoid redundant network requests.
 */

const cache = new Map();

async function fetchFromDataDir(filename) {
  if (cache.has(filename)) {
    return cache.get(filename);
  }

  try {
    const response = await fetch(`/data/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${filename}: ${response.statusText}`);
    }
    const data = await response.json();
    cache.set(filename, data);
    return data;
  } catch (error) {
    console.error(`Error loading data from ${filename}:`, error);
    return null; // Return null gracefully so components can handle it
  }
}

// -----------------------------------------------------------------------------
// Exposed Fetchers for Real Live Data
// -----------------------------------------------------------------------------

export async function getMinistryView() {
  return fetchFromDataDir('Ministry_View.json');
}

export async function getDistrictAuthorityView() {
  return fetchFromDataDir('District_Authority_View.json');
}

export async function getMPView() {
  return fetchFromDataDir('MP_View.json');
}

export async function getUnifiedProjectEvaluations() {
  return fetchFromDataDir('unified_project_evaluations.json');
}

export async function getDuplicateProjectAlerts() {
  return fetchFromDataDir('duplicate_project_alerts.json');
}

export async function getCostAndDelayAnomalies() {
  return fetchFromDataDir('cost_and_delay_anomalies.json');
}

export async function getFinGuardAnomalies() {
  return fetchFromDataDir('finguard_anomalies.json');
}

export async function getGeoIntelHeatmap() {
  return fetchFromDataDir('geointel_heatmap.geojson');
}

export async function getConstituencyHHI() {
  return fetchFromDataDir('constituency_hhi.json');
}

export async function getVendorRiskNetwork() {
  return fetchFromDataDir('vendor_risk_network.json');
}

export async function getVendorCartelGroups() {
  return fetchFromDataDir('vendor_cartel_groups.json');
}
