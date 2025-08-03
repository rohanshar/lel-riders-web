import { useState, useEffect, useCallback, useMemo } from 'react';
import { riderService } from '../services';
import { Rider, ApiError } from '../types/index';
import { API_CONFIG } from '../config/api';

interface UseRidersOptions {
  autoFetch?: boolean;
  cacheTime?: number;
  onError?: (error: ApiError) => void;
}

interface UseRidersReturn {
  riders: Rider[];
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
  lastFetched: Date | null;
}

// Cache for riders data
let ridersCache: Rider[] | null = null;
let cacheTimestamp: number = 0;

export const useRiders = (options: UseRidersOptions = {}): UseRidersReturn => {
  const { 
    autoFetch = true, 
    cacheTime = API_CONFIG.cache.staleTime,
    onError 
  } = options;

  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchRiders = useCallback(async (force = false) => {
    const now = Date.now();
    
    // Use cache if available and not stale
    if (!force && ridersCache && (now - cacheTimestamp) < cacheTime) {
      setRiders(ridersCache);
      setLastFetched(new Date(cacheTimestamp));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await riderService.fetchRiders();
      
      // Update cache
      ridersCache = data;
      cacheTimestamp = now;
      
      setRiders(data);
      setLastFetched(new Date());
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      
      if (onError) {
        onError(apiError);
      }
    } finally {
      setLoading(false);
    }
  }, [cacheTime, onError]);

  const refetch = useCallback(() => fetchRiders(true), [fetchRiders]);

  useEffect(() => {
    if (autoFetch) {
      fetchRiders();
    }

    // Cleanup function to cancel requests
    return () => {
      riderService.cancelAllRequests();
    };
  }, [autoFetch, fetchRiders]);

  return {
    riders,
    loading,
    error,
    refetch,
    lastFetched,
  };
};

// Hook for fetching riders by wave
export const useRidersByWave = (waveCode: string, options: UseRidersOptions = {}) => {
  const { riders, loading, error, refetch, lastFetched } = useRiders(options);
  
  const waveRiders = useMemo(() => {
    if (!waveCode) return riders;
    return riders.filter(rider => rider.rider_no.startsWith(waveCode));
  }, [riders, waveCode]);

  return {
    riders: waveRiders,
    loading,
    error,
    refetch,
    lastFetched,
  };
};

// Hook for searching riders
export const useRiderSearch = (query: string, options: UseRidersOptions = {}) => {
  const { riders, loading, error, refetch, lastFetched } = useRiders(options);
  
  const searchResults = useMemo(() => {
    if (!query) return riders;
    
    const searchTerm = query.toLowerCase();
    return riders.filter(rider =>
      rider.name.toLowerCase().includes(searchTerm) ||
      rider.rider_no.toLowerCase().includes(searchTerm)
    );
  }, [riders, query]);

  return {
    riders: searchResults,
    loading,
    error,
    refetch,
    lastFetched,
  };
};