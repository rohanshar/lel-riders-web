import { useMemo } from 'react';
import { useGlobalData } from '@/contexts/GlobalDataStore';
import type { Rider } from '../types';
import { shouldBeMarkedDNF } from '../utils/riderCalculations';

interface IndianRidersStatistics {
  total: number;
  inProgress: number;
  finished: number;
  dnf: number;
  notStarted: number;
}

interface UseIndianRidersDataReturn {
  riders: Rider[];
  statistics: IndianRidersStatistics;
  loading: boolean;
  error: string | null;
  lastUpdateTime: Date | null;
  refreshData: () => void;
}

export const useIndianRidersData = (): UseIndianRidersDataReturn => {
  const { 
    rawTrackingData,
    loading: globalLoading,
    errors: globalError,
    refreshTracking: originalRefreshTracking
  } = useGlobalData();
  
  const loading = globalLoading.tracking;
  const error = globalError.tracking ? globalError.tracking.message : null;
  
  // Extract riders from tracking data
  const riders = useMemo(() => {
    if (!rawTrackingData) return [];
    return rawTrackingData.riders || [];
  }, [rawTrackingData]);
  
  // Calculate statistics
  const statistics = useMemo((): IndianRidersStatistics => {
    if (!riders.length) return { total: 0, inProgress: 0, finished: 0, dnf: 0, notStarted: 0 };
    
    const inProgress = riders.filter((r: Rider) => r.status === 'in_progress' && !shouldBeMarkedDNF(r)).length;
    const finished = riders.filter((r: Rider) => r.status === 'finished').length;
    const dnf = riders.filter((r: Rider) => r.status === 'dnf' || shouldBeMarkedDNF(r)).length;
    const notStarted = riders.filter((r: Rider) => r.status === 'not_started').length;
    
    return { total: riders.length, inProgress, finished, dnf, notStarted };
  }, [riders]);
  
  // Get last update time
  const lastUpdateTime = useMemo(() => {
    if (!rawTrackingData) return null;
    // API uses 'last_updated' field
    if (rawTrackingData.last_updated) {
      return new Date(rawTrackingData.last_updated);
    }
    return null;
  }, [rawTrackingData]);
  
  // Refresh function
  const refreshData = async () => {
    await originalRefreshTracking();
  };
  
  return {
    riders,
    statistics,
    loading,
    error,
    lastUpdateTime,
    refreshData
  };
};