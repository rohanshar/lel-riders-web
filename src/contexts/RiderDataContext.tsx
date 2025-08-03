import React, { createContext, useContext, ReactNode } from 'react';
import { useRiders } from '../hooks/useRiders';
import { Rider, ApiError } from '../types/index';

interface RiderDataContextValue {
  riders: Rider[];
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
  lastFetched: Date | null;
}

const RiderDataContext = createContext<RiderDataContextValue | undefined>(undefined);

interface RiderDataProviderProps {
  children: ReactNode;
}

export const RiderDataProvider: React.FC<RiderDataProviderProps> = ({ children }) => {
  const riderData = useRiders({
    autoFetch: true,
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <RiderDataContext.Provider value={riderData}>
      {children}
    </RiderDataContext.Provider>
  );
};

// Custom hook to use the rider data context
export const useRiderData = (): RiderDataContextValue => {
  const context = useContext(RiderDataContext);
  
  if (!context) {
    throw new Error('useRiderData must be used within a RiderDataProvider');
  }
  
  return context;
};

// Utility hooks that use the context
export const useWaveData = (waveCode: string) => {
  const { riders, loading, error, refetch, lastFetched } = useRiderData();
  
  const waveRiders = React.useMemo(() => {
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

export const useSearchData = (query: string) => {
  const { riders, loading, error, refetch, lastFetched } = useRiderData();
  
  const searchResults = React.useMemo(() => {
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

export const useWaveSummary = () => {
  const { riders, loading, error } = useRiderData();
  
  const waveSummary = React.useMemo(() => {
    const waveMap = new Map<string, { count: number; countries: Set<string> }>();
    
    riders.forEach(rider => {
      const waveMatch = rider.rider_no.match(/^([A-Z]+)/);
      if (waveMatch) {
        const wave = waveMatch[1];
        const waveData = waveMap.get(wave) || { count: 0, countries: new Set() };
        
        waveData.count++;
        if (rider.country) {
          waveData.countries.add(rider.country);
        }
        
        waveMap.set(wave, waveData);
      }
    });
    
    return Array.from(waveMap.entries())
      .map(([code, data]) => ({
        code,
        riderCount: data.count,
        countries: Array.from(data.countries),
      }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [riders]);

  return {
    waves: waveSummary,
    loading,
    error,
  };
};