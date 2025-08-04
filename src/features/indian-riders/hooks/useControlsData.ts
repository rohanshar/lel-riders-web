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
    // First try to get controls from tracking data (Indian riders specific)
    if (rawTrackingData && rawTrackingData.event && rawTrackingData.event.controls) {
      // Create merged controls list, treating Writtle and London as "Start"
      const mergedControls = rawTrackingData.event.controls.reduce((acc: any[], control: any) => {
        // Skip London control, merge it with Writtle as "Start"
        if (control.name === 'London') return acc;
        
        // Rename Writtle to Start and set km to 0
        if (control.name === 'Writtle') {
          return [...acc, { 
            ...control, 
            name: 'Start', 
            km: 0, 
            id: 'start',
            leg: control.leg || 'North'
          }];
        }
        
        return [...acc, control];
      }, []);
      
      return mergedControls.map((control: any) => {
        // Get the correct distance from the hardcoded route data
        const writtleControl = WRITTLE_START_CONTROLS.find(wc => 
          wc.name === control.name || 
          (control.name === 'Start' && wc.name === 'Writtle')
        );
        
        return {
          id: control.id || control.name,
          name: control.name,
          km: writtleControl?.km ?? control.km ?? 0,
          leg: control.leg || 'North'
        };
      });
    }
    
    // Fallback to route data
    if (!rawRouteData || !rawRouteData.controls) return [];
    
    // If we have a specific rider, get their route controls
    if (riderId) {
      const routeControls = getControlsForRider(riderId);
      return routeControls.map((control, index) => ({
        id: control.name,
        name: control.name,
        km: control.km,
        leg: index < routeControls.length / 2 ? 'North' : 'South' as 'North' | 'South'
      }));
    }
    
    // Otherwise return all controls
    // Map the raw control data to our Control interface
    return rawRouteData.controls.map((control: any) => ({
      id: control.id || control.name,
      name: control.name,
      km: control.km || 0,
      leg: control.leg || 'North'
    }));
  }, [rawTrackingData, rawRouteData, riderId]);
  
  return {
    controls,
    loading: loading.tracking || loading.routes,
    error: errors.tracking ? errors.tracking.message : (errors.routes ? errors.routes.message : null)
  };
};