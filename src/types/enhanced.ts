/**
 * Enhanced type definitions for centralized data processing
 * These types extend the base types with computed properties
 */

import { Rider } from '../types';
import { 
  EnhancedRider as ProcessedEnhancedRider,
  TrackingRider as ProcessedTrackingRider,
  ProcessedWave,
  TrackedWave,
  ControlProgress,
  RiderStatus
} from '../utils/dataProcessors';

// Re-export processed types for convenience
export type { 
  ProcessedEnhancedRider as EnhancedRider,
  ProcessedTrackingRider as TrackingRider,
  ProcessedWave,
  TrackedWave,
  ControlProgress,
  RiderStatus
};

/**
 * Global statistics for the entire event
 */
export interface GlobalStatistics {
  totalRiders: number;
  totalCountries: number;
  totalWaves: number;
  byStatus: {
    notStarted: number;
    inProgress: number;
    finished: number;
    dnf: number;
  };
  byRoute: {
    london: number;
    writtle: number;
  };
  averageDistance: number;
  averageSpeed: number;
  completionRate: number;
  lastUpdated: Date;
}

/**
 * Wave statistics extended with route info
 */
export interface WaveStatisticsExtended {
  code: string;
  startTime: string;
  route: 'london' | 'writtle' | 'mixed';
  riderCount: number;
  countries: string[];
  status: {
    notStarted: number;
    inProgress: number;
    finished: number;
    dnf: number;
  };
  performance: {
    avgDistance: number;
    avgSpeed: number;
    leadRider: ProcessedTrackingRider | null;
  };
}

/**
 * Control point with extended statistics
 */
export interface ControlPointExtended {
  id: string;
  name: string;
  km: number;
  leg: 'North' | 'South';
  ridersReached: number;
  ridersApproaching: number;
  percentageReached: number;
  averageTimeToReach: number;
  fastestRider: ProcessedTrackingRider | null;
  slowestRider: ProcessedTrackingRider | null;
}

/**
 * Filter options for riders
 */
export interface RiderFilters {
  wave?: string;
  status?: RiderStatus;
  country?: string;
  minDistance?: number;
  maxDistance?: number;
  searchTerm?: string;
}

/**
 * Sort options for riders
 */
export type RiderSortBy = 'name' | 'rider_no' | 'distance' | 'speed' | 'status' | 'wave';

/**
 * Loading state for different data sources
 */
export interface LoadingState {
  riders: boolean;
  tracking: boolean;
  routes: boolean;
}

/**
 * Error state for different data sources
 */
export interface ErrorState {
  riders: Error | null;
  tracking: Error | null;
  routes: Error | null;
}

/**
 * Update timestamps for data freshness
 */
export interface UpdateTimestamps {
  riders: Date | null;
  tracking: Date | null;
  routes: Date | null;
}

/**
 * Route data structure
 */
export interface RouteData {
  totalDistance: number;
  controls: Array<{
    id: string;
    name: string;
    km: number;
    leg: 'North' | 'South';
  }>;
  segments: Array<{
    from: string;
    to: string;
    distance: number;
    coordinates: Array<[number, number]>;
  }>;
}

/**
 * Combined data store state
 */
export interface GlobalDataState {
  // Raw data
  rawRiders: Rider[];
  rawTrackingData: any | null;
  rawRouteData: RouteData | null;
  
  // Processed data
  enhancedRiders: ProcessedEnhancedRider[];
  trackingRiders: ProcessedTrackingRider[];
  waves: ProcessedWave[];
  trackedWaves: TrackedWave[];
  
  // Derived intelligence
  globalStatistics: GlobalStatistics;
  controlProgress: Map<string, ControlProgress>;
  waveStatistics: Map<string, WaveStatisticsExtended>;
  
  // State management
  loading: LoadingState;
  errors: ErrorState;
  lastUpdated: UpdateTimestamps;
  
  // Filters and sorting
  activeFilters: RiderFilters;
  activeSortBy: RiderSortBy;
  
  // UI state
  selectedRider: ProcessedTrackingRider | null;
  selectedWave: string | null;
  selectedControl: string | null;
}

/**
 * Actions for the global data store
 */
export interface GlobalDataActions {
  // Data fetching
  fetchAllData: () => Promise<void>;
  refreshRiders: () => Promise<void>;
  refreshTracking: () => Promise<void>;
  refreshRoutes: () => Promise<void>;
  
  // Data access
  getRiderById: (riderNo: string) => ProcessedTrackingRider | ProcessedEnhancedRider | null;
  getWaveByCode: (code: string) => TrackedWave | ProcessedWave | null;
  getControlById: (id: string) => ControlProgress | null;
  
  // Filtering and sorting
  setFilters: (filters: RiderFilters) => void;
  setSortBy: (sortBy: RiderSortBy) => void;
  clearFilters: () => void;
  
  // UI state
  selectRider: (rider: ProcessedTrackingRider | null) => void;
  selectWave: (wave: string | null) => void;
  selectControl: (control: string | null) => void;
}

/**
 * Complete global data store interface
 */
export interface GlobalDataStore extends GlobalDataState, GlobalDataActions {}

/**
 * Cache configuration
 */
export interface CacheConfig {
  riders: number; // Cache duration in ms
  tracking: number;
  routes: number;
}