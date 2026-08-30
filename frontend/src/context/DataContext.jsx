import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getMinistryView,
  getDistrictAuthorityView,
  getMPView,
  getUnifiedProjectEvaluations,
  getDuplicateProjectAlerts,
  getCostAndDelayAnomalies,
  getFinGuardAnomalies,
  getFinGuardConstituencySummary,
  getGeoIntelHeatmap,
  getConstituencyHHI,
  getConstituencyRiskHeatmap,
  getVendorRiskNetwork,
  getVendorCartelGroups,
  getMpScorecardSummary,
  getRealProjects,
  getExportManifest,
  getAssistantManifest,
} from '../services/dataLoader';

const DataContext = createContext(null);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [data, setData] = useState({
    ministryView: null,
    districtView: null,
    districtAuthorityView: null,
    mpView: null,
    unifiedProjects: null,
    unifiedProjectEvaluations: null,
    duplicateAlerts: null,
    duplicateProjectAlerts: null,
    costAnomalies: null,
    costAndDelayAnomalies: null,
    finguardAnomalies: null,
    finguardConstituencySummary: null,
    geoIntelMap: null,
    geoIntelHeatmap: null,
    constituencyHHI: null,
    constituencyRiskHeatmap: null,
    vendorRisk: null,
    vendorRiskNetwork: null,
    vendorCartels: null,
    vendorCartelGroups: null,
    mpScorecardSummary: null,
    realProjects: null,
    exportManifest: null,
    assistantManifest: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAllData() {
      try {
        setIsLoading(true);
        const [
          ministryView,
          districtView,
          mpView,
          unifiedProjects,
          duplicateAlerts,
          costAnomalies,
          finguardAnomalies,
          finguardConstituencySummary,
          geoIntelMap,
          constituencyHHI,
          constituencyRiskHeatmap,
          vendorRisk,
          vendorCartels,
          mpScorecardSummary,
          realProjects,
          exportManifest,
          assistantManifest,
        ] = await Promise.all([
          getMinistryView(),
          getDistrictAuthorityView(),
          getMPView(),
          getUnifiedProjectEvaluations(),
          getDuplicateProjectAlerts(),
          getCostAndDelayAnomalies(),
          getFinGuardAnomalies(),
          getFinGuardConstituencySummary(),
          getGeoIntelHeatmap(),
          getConstituencyHHI(),
          getConstituencyRiskHeatmap(),
          getVendorRiskNetwork(),
          getVendorCartelGroups(),
          getMpScorecardSummary(),
          getRealProjects(),
          getExportManifest(),
          getAssistantManifest(),
        ]);

        setData({
          ministryView,
          districtView,
          districtAuthorityView: districtView,
          mpView,
          unifiedProjects,
          unifiedProjectEvaluations: unifiedProjects,
          duplicateAlerts,
          duplicateProjectAlerts: duplicateAlerts,
          costAnomalies,
          costAndDelayAnomalies: costAnomalies,
          finguardAnomalies,
          finguardConstituencySummary,
          geoIntelMap,
          geoIntelHeatmap: geoIntelMap,
          constituencyHHI,
          constituencyRiskHeatmap,
          vendorRisk,
          vendorRiskNetwork: vendorRisk,
          vendorCartels,
          vendorCartelGroups: vendorCartels,
          mpScorecardSummary,
          realProjects,
          exportManifest,
          assistantManifest,
        });
      } catch (err) {
        console.error("Failed to load initial data context:", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAllData();
  }, []);

  const value = {
    ...data,
    isLoading,
    error,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
