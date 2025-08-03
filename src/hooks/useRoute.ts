import { useState, useEffect, useCallback } from 'react';
import { routeService } from '../services';
import { RouteData, ApiError } from '../types/index';

interface UseRouteReturn {
  routeData: RouteData | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

export const useRoute = (): UseRouteReturn => {
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchRoute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await routeService.fetchRouteData();
      setRouteData(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  return {
    routeData,
    loading,
    error,
    refetch: fetchRoute,
  };
};