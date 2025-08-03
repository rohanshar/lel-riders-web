import { EnhancedRider, extractWaveCode, sortRidersByNumber } from './riderProcessors';
import { TrackingRider, RiderStatus } from './trackingProcessors';
import { getWaveStartTime } from '../../config/lel-route';

/**
 * Wave statistics
 */
export interface WaveStatistics {
  total: number;
  notStarted: number;
  inProgress: number;
  finished: number;
  dnf: number;
  avgDistance: number;
  avgSpeed: number;
  completionRate: number;
}

/**
 * Processed wave with metadata
 */
export interface ProcessedWave {
  code: string;
  startTime: string;
  riders: EnhancedRider[];
  statistics: WaveStatistics;
  route: 'london' | 'writtle' | 'mixed';
}

/**
 * Wave with tracking data
 */
export interface TrackedWave extends ProcessedWave {
  trackingRiders: TrackingRider[];
}

/**
 * Calculate statistics for a group of riders
 * @param riders - Array of riders (enhanced or tracking)
 * @returns Wave statistics
 */
export function calculateWaveStatistics<T extends EnhancedRider>(riders: T[]): WaveStatistics {
  const total = riders.length;
  if (total === 0) {
    return {
      total: 0,
      notStarted: 0,
      inProgress: 0,
      finished: 0,
      dnf: 0,
      avgDistance: 0,
      avgSpeed: 0,
      completionRate: 0
    };
  }
  
  // Count by status (if tracking data available)
  let notStarted = 0;
  let inProgress = 0;
  let finished = 0;
  let dnf = 0;
  let totalDistance = 0;
  let totalSpeed = 0;
  let ridersWithSpeed = 0;
  
  riders.forEach(rider => {
    if ('status' in rider) {
      const trackingRider = rider as unknown as TrackingRider;
      switch (trackingRider.status) {
        case 'not_started':
          notStarted++;
          break;
        case 'in_progress':
          inProgress++;
          break;
        case 'finished':
          finished++;
          break;
        case 'dnf':
          dnf++;
          break;
      }
      
      if (trackingRider.distanceCovered > 0) {
        totalDistance += trackingRider.distanceCovered;
      }
      
      if (trackingRider.averageSpeed > 0) {
        totalSpeed += trackingRider.averageSpeed;
        ridersWithSpeed++;
      }
    } else {
      // If no tracking data, all are not started
      notStarted = total;
    }
  });
  
  const avgDistance = total > 0 ? totalDistance / total : 0;
  const avgSpeed = ridersWithSpeed > 0 ? totalSpeed / ridersWithSpeed : 0;
  const completionRate = total > 0 ? (finished / total) * 100 : 0;
  
  return {
    total,
    notStarted,
    inProgress,
    finished,
    dnf,
    avgDistance,
    avgSpeed,
    completionRate
  };
}

/**
 * Determine wave route type
 * @param riders - Riders in the wave
 * @returns 'london', 'writtle', or 'mixed'
 */
export function determineWaveRoute(riders: EnhancedRider[]): 'london' | 'writtle' | 'mixed' {
  if (riders.length === 0) return 'writtle';
  
  const routes = new Set(riders.map(r => r.route));
  if (routes.size === 1) {
    return routes.values().next().value;
  }
  return 'mixed';
}

/**
 * Process waves from enhanced riders
 * @param riders - Array of enhanced riders
 * @returns Array of processed waves
 */
export function processWaves(riders: EnhancedRider[]): ProcessedWave[] {
  const waveMap = new Map<string, EnhancedRider[]>();
  
  // Group by wave
  riders.forEach(rider => {
    const wave = rider.wave;
    if (!waveMap.has(wave)) {
      waveMap.set(wave, []);
    }
    waveMap.get(wave)!.push(rider);
  });
  
  // Process each wave
  const waves: ProcessedWave[] = [];
  waveMap.forEach((waveRiders, code) => {
    // Sort riders within wave
    const sortedRiders = sortRidersByNumber(waveRiders);
    
    // Use the first rider to get wave start time
    const startTime = waveRiders.length > 0 
      ? waveRiders[0].waveStartTime 
      : getWaveStartTime(`${code}1`);
    
    waves.push({
      code,
      startTime,
      riders: sortedRiders,
      statistics: calculateWaveStatistics(sortedRiders),
      route: determineWaveRoute(sortedRiders)
    });
  });
  
  // Sort waves alphabetically
  return waves.sort((a, b) => a.code.localeCompare(b.code));
}

/**
 * Process waves with tracking data
 * @param trackingRiders - Array of tracking riders
 * @returns Array of tracked waves
 */
export function processTrackedWaves(trackingRiders: TrackingRider[]): TrackedWave[] {
  const waveMap = new Map<string, TrackingRider[]>();
  
  // Group by wave
  trackingRiders.forEach(rider => {
    const wave = rider.wave;
    if (!waveMap.has(wave)) {
      waveMap.set(wave, []);
    }
    waveMap.get(wave)!.push(rider);
  });
  
  // Process each wave
  const waves: TrackedWave[] = [];
  waveMap.forEach((waveRiders, code) => {
    // Sort riders within wave
    const sortedRiders = sortRidersByNumber(waveRiders);
    
    // Use the first rider to get wave start time
    const startTime = waveRiders.length > 0 
      ? waveRiders[0].waveStartTime 
      : getWaveStartTime(`${code}1`);
    
    waves.push({
      code,
      startTime,
      riders: sortedRiders,
      trackingRiders: sortedRiders,
      statistics: calculateWaveStatistics(sortedRiders),
      route: determineWaveRoute(sortedRiders)
    });
  });
  
  // Sort waves alphabetically
  return waves.sort((a, b) => a.code.localeCompare(b.code));
}

/**
 * Get wave summary (code and rider count)
 * @param waves - Array of processed waves
 * @returns Array of wave summaries
 */
export function getWaveSummaries(waves: ProcessedWave[]): Array<{ code: string; count: number; startTime: string }> {
  return waves.map(wave => ({
    code: wave.code,
    count: wave.riders.length,
    startTime: wave.startTime
  }));
}

/**
 * Find wave by code
 * @param waves - Array of waves
 * @param code - Wave code to find
 * @returns Wave or undefined
 */
export function findWaveByCode<T extends ProcessedWave>(waves: T[], code: string): T | undefined {
  return waves.find(wave => wave.code === code);
}

/**
 * Get overall statistics from all waves
 * @param waves - Array of waves
 * @returns Combined statistics
 */
export function getCombinedStatistics(waves: ProcessedWave[]): WaveStatistics {
  const allRiders: EnhancedRider[] = [];
  waves.forEach(wave => allRiders.push(...wave.riders));
  return calculateWaveStatistics(allRiders);
}