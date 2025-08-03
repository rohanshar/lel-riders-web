import { Rider } from '../../types';
import { isLondonStartRider, getTotalDistanceForRider, getWaveStartTime } from '../../config/lel-route';

/**
 * Enhanced rider type with computed properties
 */
export interface EnhancedRider extends Rider {
  wave: string;
  waveStartTime: string;
  route: 'london' | 'writtle';
  totalDistance: number;
}

/**
 * Extract wave code from rider number
 * @param riderNo - Rider number (e.g., "A25", "LB40")
 * @returns Wave code (e.g., "A", "LB")
 */
export function extractWaveCode(riderNo: string): string {
  const match = riderNo.match(/^([A-Z]+)/);
  return match ? match[1] : '';
}

/**
 * Determine rider's starting route based on rider number
 * @param riderNo - Rider number
 * @returns 'london' or 'writtle'
 */
export function determineRoute(riderNo: string): 'london' | 'writtle' {
  return isLondonStartRider(riderNo) ? 'london' : 'writtle';
}

/**
 * Enhance a rider with computed properties
 * @param rider - Base rider data
 * @returns Enhanced rider with wave, route, and distance info
 */
export function enhanceRider(rider: Rider): EnhancedRider {
  const wave = extractWaveCode(rider.rider_no);
  const route = determineRoute(rider.rider_no);
  const totalDistance = getTotalDistanceForRider(rider.rider_no);
  const waveStartTime = getWaveStartTime(rider.rider_no);

  return {
    ...rider,
    wave,
    waveStartTime,
    route,
    totalDistance
  };
}

/**
 * Enhance multiple riders
 * @param riders - Array of base riders
 * @returns Array of enhanced riders
 */
export function enhanceRiders(riders: Rider[]): EnhancedRider[] {
  return riders.map(enhanceRider);
}

/**
 * Group riders by wave
 * @param riders - Array of riders (base or enhanced)
 * @returns Map of wave code to riders
 */
export function groupRidersByWave<T extends Rider>(riders: T[]): Map<string, T[]> {
  const waveMap = new Map<string, T[]>();
  
  riders.forEach(rider => {
    const wave = extractWaveCode(rider.rider_no);
    if (!waveMap.has(wave)) {
      waveMap.set(wave, []);
    }
    waveMap.get(wave)!.push(rider);
  });
  
  return waveMap;
}

/**
 * Sort riders naturally by rider number
 * @param riders - Array of riders
 * @returns Sorted array of riders
 */
export function sortRidersByNumber<T extends Rider>(riders: T[]): T[] {
  return [...riders].sort((a, b) => 
    a.rider_no.localeCompare(b.rider_no, undefined, { numeric: true })
  );
}

/**
 * Sort riders by name
 * @param riders - Array of riders
 * @returns Sorted array of riders
 */
export function sortRidersByName<T extends Rider>(riders: T[]): T[] {
  return [...riders].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Filter riders by search term (name or rider number)
 * @param riders - Array of riders
 * @param searchTerm - Search term
 * @returns Filtered array of riders
 */
export function filterRidersBySearch<T extends Rider>(riders: T[], searchTerm: string): T[] {
  const term = searchTerm.toLowerCase();
  return riders.filter(rider =>
    rider.name.toLowerCase().includes(term) ||
    rider.rider_no.toLowerCase().includes(term)
  );
}

/**
 * Get unique wave codes from riders
 * @param riders - Array of riders
 * @returns Sorted array of unique wave codes
 */
export function getUniqueWaves(riders: Rider[]): string[] {
  const waves = new Set(riders.map(rider => extractWaveCode(rider.rider_no)));
  return Array.from(waves).sort();
}

/**
 * Count riders by route
 * @param riders - Array of riders
 * @returns Object with london and writtle counts
 */
export function countRidersByRoute(riders: Rider[]): { london: number; writtle: number } {
  let london = 0;
  let writtle = 0;
  
  riders.forEach(rider => {
    if (isLondonStartRider(rider.rider_no)) {
      london++;
    } else {
      writtle++;
    }
  });
  
  return { london, writtle };
}