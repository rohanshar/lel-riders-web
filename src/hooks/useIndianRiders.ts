import { useState, useEffect, useCallback } from 'react';
import { riderService } from '../services';
import { IndianRider, ApiResponse, ApiError } from '../types/index';

interface UseIndianRidersReturn {
  riders: IndianRider[];
  loading: boolean;
  error: ApiError | null;
  lastUpdated: string | null;
  refetch: () => Promise<void>;
}

export const useIndianRiders = (): UseIndianRidersReturn => {
  const [riders, setRiders] = useState<IndianRider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchIndianRiders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response: ApiResponse<IndianRider[]> = await riderService.fetchIndianRiders();
      
      if (response.data) {
        setRiders(response.data);
        setLastUpdated(response.lastUpdated || new Date().toISOString());
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIndianRiders();

    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchIndianRiders, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
      riderService.cancelAllRequests();
    };
  }, [fetchIndianRiders]);

  return {
    riders,
    loading,
    error,
    lastUpdated,
    refetch: fetchIndianRiders,
  };
};