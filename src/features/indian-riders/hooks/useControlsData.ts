import { useMemo } from 'react';
import { useGlobalData } from '@/contexts/GlobalDataStore';
import { getControlsForRider, WRITTLE_START_CONTROLS } from '@/config/lel-route';
import type { Control } from '../types/weather';

interface UseControlsDataReturn {
  controls: Control[];
  loading: boolean;
  error: string | null;
}

export const useControlsData = (riderId?: string): UseControlsDataReturn => {
  const { rawTrackingData, rawRouteData, loading, errors } = useGlobalData();
  
  const controls = useMemo(() => {
    // Use the complete control list from the route configuration
    // Keep original names for matching, but include metadata
    const allControls = WRITTLE_START_CONTROLS.map((control, index) => {
      // Determine if this is northbound or southbound leg
      // Northbound goes up to Eskdalemuir, then return journey starts
      const isNorthbound = !control.description?.includes('Return') && control.name !== 'Henham' && control.name !== 'Writtle' && control.km < 900;
      
      return {
        id: `${control.name}-${index}`,
        name: control.name,
        km: control.km,
        leg: isNorthbound ? 'North' : 'South' as 'North' | 'South',
        isReturn: control.description?.includes('Return') || false,
        description: control.description
      };
    });
    
    return allControls;
  }, []);
  
  return {
    controls,
    loading: loading.tracking || loading.routes,
    error: errors.tracking ? errors.tracking.message : (errors.routes ? errors.routes.message : null)
  };
};