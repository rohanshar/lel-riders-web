import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { riderService, routeService } from '../services';
import { Rider } from '../types';
import {
  GlobalDataStore,
  GlobalStatistics,
  LoadingState,
  ErrorState,
  UpdateTimestamps,
  RiderFilters,
  RiderSortBy,
  ControlProgress,
  WaveStatisticsExtended,
  RouteData
} from '../types/enhanced';
import {
  enhanceRiders,
  processTrackingRider,
  processWaves,
  processTrackedWaves,
  processControlProgress,
  calculateWaveStatistics,
  getCurrentUKTime,
  sortRidersByNumber,
  sortRidersByName,
  trackingSorters,
  filterRidersBySearch,
  EnhancedRider,
  TrackingRider,
  ProcessedWave,
  TrackedWave,
  RawTrackingRider
} from '../utils/dataProcessors';

// Default cache durations
const CACHE_DURATIONS = {
  riders: 5 * 60 * 1000, // 5 minutes
  tracking: 30 * 1000,   // 30 seconds
  routes: Infinity       // Never expires
};

// Context
const GlobalDataContext = createContext<GlobalDataStore | undefined>(undefined);

interface GlobalDataProviderProps {
  children: ReactNode;
  cacheConfig?: {
    riders?: number;
    tracking?: number;
    routes?: number;
  };
}

export const GlobalDataProvider: React.FC<GlobalDataProviderProps> = ({ 
  children,
  cacheConfig = {}
}) => {
  // Cache configuration - memoize to prevent infinite loops
  const cacheDurations = useMemo(() => ({
    ...CACHE_DURATIONS,
    ...cacheConfig
  }), [cacheConfig]);

  // Raw data
  const [rawRiders, setRawRiders] = useState<Rider[]>([]);
  const [rawTrackingData, setRawTrackingData] = useState<any>(null);
  const [rawRouteData, setRawRouteData] = useState<RouteData | null>(null);

  // Loading and error states
  const [loading, setLoading] = useState<LoadingState>({
    riders: false,
    tracking: false,
    routes: false
  });
  const [errors, setErrors] = useState<ErrorState>({
    riders: null,
    tracking: null,
    routes: null
  });
  const [lastUpdated, setLastUpdated] = useState<UpdateTimestamps>({
    riders: null,
    tracking: null,
    routes: null
  });

  // Filters and sorting
  const [activeFilters, setActiveFilters] = useState<RiderFilters>({});
  const [activeSortBy, setActiveSortBy] = useState<RiderSortBy>('distance');

  // UI state
  const [selectedRider, setSelectedRider] = useState<TrackingRider | null>(null);
  const [selectedWave, setSelectedWave] = useState<string | null>(null);
  const [selectedControl, setSelectedControl] = useState<string | null>(null);

  // Process enhanced riders
  const enhancedRiders = useMemo(() => {
    return enhanceRiders(rawRiders);
  }, [rawRiders]);

  // Process tracking riders
  const trackingRiders = useMemo(() => {
    if (!rawTrackingData?.riders) return [];
    
    const currentTime = getCurrentUKTime();
    const trackingMap = new Map<string, RawTrackingRider>();
    
    // Create map of tracking data
    rawTrackingData.riders.forEach((rider: RawTrackingRider) => {
      trackingMap.set(rider.rider_no, rider);
    });
    
    // Process each enhanced rider with tracking data if available
    return enhancedRiders.map(enhancedRider => {
      const trackingData = trackingMap.get(enhancedRider.rider_no);
      
      if (trackingData) {
        return processTrackingRider(trackingData, enhancedRider, currentTime);
      }
      
      // Return enhanced rider with default tracking values
      return {
        ...enhancedRider,
        status: 'not_started' as const,
        checkpoints: [],
        currentLocation: 'Not Started',
        lastCheckpoint: null,
        distanceCovered: 0,
        estimatedDistance: 0,
        elapsedMinutes: 0,
        averageSpeed: 0,
        progress: 0
      } as TrackingRider;
    });
  }, [enhancedRiders, rawTrackingData]);

  // Process waves
  const waves = useMemo(() => {
    return processWaves(enhancedRiders);
  }, [enhancedRiders]);

  // Process tracked waves
  const trackedWaves = useMemo(() => {
    if (!rawTrackingData) return [];
    return processTrackedWaves(trackingRiders);
  }, [trackingRiders, rawTrackingData]);

  // Process control progress
  const controlProgress = useMemo(() => {
    if (!rawTrackingData?.event?.controls) return new Map();
    return processControlProgress(rawTrackingData.event.controls, trackingRiders);
  }, [rawTrackingData, trackingRiders]);

  // Calculate global statistics
  const globalStatistics = useMemo((): GlobalStatistics => {
    const totalRiders = enhancedRiders.length;
    const countries = new Set(enhancedRiders.map(r => r.country || 'Unknown'));
    const totalCountries = countries.size;
    const totalWaves = waves.length;
    
    // Count by status
    const statusCounts = trackingRiders.reduce((acc, rider) => {
      switch(rider.status) {
        case 'not_started':
          acc.notStarted++;
          break;
        case 'in_progress':
          acc.inProgress++;
          break;
        case 'finished':
          acc.finished++;
          break;
        case 'dnf':
          acc.dnf++;
          break;
      }
      return acc;
    }, { notStarted: 0, inProgress: 0, finished: 0, dnf: 0 });
    
    // Count by route
    const routeCounts = enhancedRiders.reduce((acc, rider) => {
      acc[rider.route]++;
      return acc;
    }, { london: 0, writtle: 0 });
    
    // Calculate averages
    const activeRiders = trackingRiders.filter(r => r.distanceCovered > 0);
    const totalDistance = activeRiders.reduce((sum, r) => sum + r.distanceCovered, 0);
    const totalSpeed = activeRiders.reduce((sum, r) => sum + r.averageSpeed, 0);
    
    return {
      totalRiders,
      totalCountries,
      totalWaves,
      byStatus: statusCounts,
      byRoute: routeCounts,
      averageDistance: activeRiders.length > 0 ? totalDistance / activeRiders.length : 0,
      averageSpeed: activeRiders.length > 0 ? totalSpeed / activeRiders.length : 0,
      completionRate: totalRiders > 0 ? (statusCounts.finished / totalRiders) * 100 : 0,
      lastUpdated: new Date()
    };
  }, [enhancedRiders, waves, trackingRiders]);

  // Calculate wave statistics
  const waveStatistics = useMemo(() => {
    const statsMap = new Map<string, WaveStatisticsExtended>();
    
    trackedWaves.forEach(wave => {
      const stats = calculateWaveStatistics(wave.trackingRiders);
      const countries = new Set(wave.riders.map(r => r.country || 'Unknown'));
      
      // Find lead rider
      const leadRider = wave.trackingRiders
        .filter(r => r.distanceCovered > 0)
        .sort((a, b) => b.distanceCovered - a.distanceCovered)[0] || null;
      
      statsMap.set(wave.code, {
        code: wave.code,
        startTime: wave.startTime,
        route: wave.route,
        riderCount: wave.riders.length,
        countries: Array.from(countries),
        status: {
          notStarted: stats.notStarted,
          inProgress: stats.inProgress,
          finished: stats.finished,
          dnf: stats.dnf
        },
        performance: {
          avgDistance: stats.avgDistance,
          avgSpeed: stats.avgSpeed,
          leadRider
        }
      });
    });
    
    return statsMap;
  }, [trackedWaves]);

  // Filter and sort riders
  const filteredAndSortedRiders = useMemo(() => {
    let riders = [...trackingRiders];
    
    // Apply filters
    if (activeFilters.wave) {
      riders = riders.filter(r => r.wave === activeFilters.wave);
    }
    if (activeFilters.status) {
      riders = riders.filter(r => r.status === activeFilters.status);
    }
    if (activeFilters.country) {
      riders = riders.filter(r => r.country === activeFilters.country);
    }
    if (activeFilters.minDistance !== undefined) {
      riders = riders.filter(r => r.distanceCovered >= activeFilters.minDistance!);
    }
    if (activeFilters.maxDistance !== undefined) {
      riders = riders.filter(r => r.distanceCovered <= activeFilters.maxDistance!);
    }
    if (activeFilters.searchTerm) {
      riders = filterRidersBySearch(riders, activeFilters.searchTerm);
    }
    
    // Apply sorting
    switch (activeSortBy) {
      case 'name':
        return sortRidersByName(riders);
      case 'rider_no':
        return sortRidersByNumber(riders);
      case 'distance':
        return riders.sort(trackingSorters.byDistance);
      case 'speed':
        return riders.sort(trackingSorters.bySpeed);
      case 'status':
        return riders.sort(trackingSorters.byStatus);
      case 'wave':
        return riders.sort((a, b) => a.wave.localeCompare(b.wave));
      default:
        return riders;
    }
  }, [trackingRiders, activeFilters, activeSortBy]);

  // Data fetching functions
  const fetchRiders = useCallback(async () => {
    setLoading(prev => ({ ...prev, riders: true }));
    setErrors(prev => ({ ...prev, riders: null }));
    
    try {
      const data = await riderService.fetchRiders();
      setRawRiders(data);
      setLastUpdated(prev => ({ ...prev, riders: new Date() }));
    } catch (error) {
      setErrors(prev => ({ ...prev, riders: error as Error }));
    } finally {
      setLoading(prev => ({ ...prev, riders: false }));
    }
  }, []);

  const fetchTracking = useCallback(async () => {
    setLoading(prev => ({ ...prev, tracking: true }));
    setErrors(prev => ({ ...prev, tracking: null }));
    
    try {
      const response = await fetch('https://lel-riders-data-2025.s3.ap-south-1.amazonaws.com/indian-riders-tracking.json');
      const data = await response.json();
      setRawTrackingData(data);
      setLastUpdated(prev => ({ ...prev, tracking: new Date() }));
    } catch (error) {
      setErrors(prev => ({ ...prev, tracking: error as Error }));
    } finally {
      setLoading(prev => ({ ...prev, tracking: false }));
    }
  }, []);

  const fetchRoutes = useCallback(async () => {
    setLoading(prev => ({ ...prev, routes: true }));
    setErrors(prev => ({ ...prev, routes: null }));
    
    try {
      const data = await routeService.fetchRouteData();
      setRawRouteData(data as any);
      setLastUpdated(prev => ({ ...prev, routes: new Date() }));
    } catch (error) {
      setErrors(prev => ({ ...prev, routes: error as Error }));
    } finally {
      setLoading(prev => ({ ...prev, routes: false }));
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    await Promise.all([
      fetchRiders(),
      fetchTracking(),
      fetchRoutes()
    ]);
  }, [fetchRiders, fetchTracking, fetchRoutes]);

  // Auto-refresh based on cache configuration
  useEffect(() => {
    // Initial fetch
    fetchAllData();
    
    // Set up refresh intervals
    const intervals: NodeJS.Timeout[] = [];
    
    if (cacheDurations.riders < Infinity) {
      intervals.push(setInterval(() => fetchRiders(), cacheDurations.riders));
    }
    if (cacheDurations.tracking < Infinity) {
      intervals.push(setInterval(() => fetchTracking(), cacheDurations.tracking));
    }
    if (cacheDurations.routes < Infinity) {
      intervals.push(setInterval(() => fetchRoutes(), cacheDurations.routes));
    }
    
    return () => {
      intervals.forEach(clearInterval);
    };
    // Only run on mount and when cache durations change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheDurations]);

  // Data access functions
  const getRiderById = useCallback((riderNo: string) => {
    return trackingRiders.find(r => r.rider_no === riderNo) || 
           enhancedRiders.find(r => r.rider_no === riderNo) || 
           null;
  }, [trackingRiders, enhancedRiders]);

  const getWaveByCode = useCallback((code: string) => {
    return trackedWaves.find(w => w.code === code) || 
           waves.find(w => w.code === code) || 
           null;
  }, [trackedWaves, waves]);

  const getControlById = useCallback((id: string) => {
    return controlProgress.get(id) || null;
  }, [controlProgress]);

  // Context value
  const value: GlobalDataStore = {
    // Raw data
    rawRiders,
    rawTrackingData,
    rawRouteData,
    
    // Processed data
    enhancedRiders,
    trackingRiders: filteredAndSortedRiders,
    waves,
    trackedWaves,
    
    // Derived intelligence
    globalStatistics,
    controlProgress,
    waveStatistics,
    
    // State management
    loading,
    errors,
    lastUpdated,
    
    // Filters and sorting
    activeFilters,
    activeSortBy,
    
    // UI state
    selectedRider,
    selectedWave,
    selectedControl,
    
    // Actions
    fetchAllData,
    refreshRiders: fetchRiders,
    refreshTracking: fetchTracking,
    refreshRoutes: fetchRoutes,
    getRiderById,
    getWaveByCode,
    getControlById,
    setFilters: setActiveFilters,
    setSortBy: setActiveSortBy,
    clearFilters: () => setActiveFilters({}),
    selectRider: setSelectedRider,
    selectWave: setSelectedWave,
    selectControl: setSelectedControl
  };

  return (
    <GlobalDataContext.Provider value={value}>
      {children}
    </GlobalDataContext.Provider>
  );
};

// Hook to use the global data store
export const useGlobalData = (): GlobalDataStore => {
  const context = useContext(GlobalDataContext);
  
  if (!context) {
    throw new Error('useGlobalData must be used within a GlobalDataProvider');
  }
  
  return context;
};