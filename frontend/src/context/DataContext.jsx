import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getMinistryView,
  getDistrictAuthorityView,
  getMPView,
  getUnifiedProjectEvaluations,
  getDuplicateProjectAlerts,
  getCostAndDelayAnomalies,
  getFinGuardAnomalies,
  getGeoIntelHeatmap,
  getConstituencyHHI,
  getVendorRiskNetwork,
  getVendorCartelGroups,
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
    mpView: null,
    unifiedProjects: null,
    duplicateAlerts: null,
    costAnomalies: null,
    finguardAnomalies: null,
    geoIntelMap: null,
    constituencyHHI: null,
    vendorRisk: null,
    vendorCartels: null,
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
          geoIntelMap,
          constituencyHHI,
          vendorRisk,
          vendorCartels,
        ] = await Promise.all([
          getMinistryView(),
          getDistrictAuthorityView(),
          getMPView(),
          getUnifiedProjectEvaluations(),
          getDuplicateProjectAlerts(),
          getCostAndDelayAnomalies(),
          getFinGuardAnomalies(),
          getGeoIntelHeatmap(),
          getConstituencyHHI(),
          getVendorRiskNetwork(),
          getVendorCartelGroups(),
        ]);

        setData({
          ministryView,
          districtView,
          mpView,
          unifiedProjects,
          duplicateAlerts,
          costAnomalies,
          finguardAnomalies,
          geoIntelMap,
          constituencyHHI,
          vendorRisk,
          vendorCartels,
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
