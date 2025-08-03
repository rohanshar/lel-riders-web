import { Rider, WaveSummary } from '../types/index';
import { WAVE_CONFIG } from '../config/constants';

/**
 * Extract wave code from rider number
 */
export const extractWaveFromRiderNo = (riderNo: string): string => {
  const match = riderNo.match(WAVE_CONFIG.wavePattern);
  return match ? match[1] : '';
};

/**
 * Group riders by wave
 */
export const groupRidersByWave = (riders: Rider[]): Map<string, Rider[]> => {
  const waveMap = new Map<string, Rider[]>();
  
  riders.forEach(rider => {
    const wave = extractWaveFromRiderNo(rider.rider_no);
    if (wave) {
      if (!waveMap.has(wave)) {
        waveMap.set(wave, []);
      }
      waveMap.get(wave)!.push(rider);
    }
  });
  
  return waveMap;
};

/**
 * Calculate wave statistics
 */
export const calculateWaveStatistics = (riders: Rider[]): {
  totalWaves: number;
  averageRidersPerWave: number;
  largestWave: { code: string; count: number };
  smallestWave: { code: string; count: number };
} => {
  const waveMap = groupRidersByWave(riders);
  const waveCounts = Array.from(waveMap.entries()).map(([code, riders]) => ({
    code,
    count: riders.length,
  }));
  
  if (waveCounts.length === 0) {
    return {
      totalWaves: 0,
      averageRidersPerWave: 0,
      largestWave: { code: '', count: 0 },
      smallestWave: { code: '', count: 0 },
    };
  }
  
  const totalRiders = waveCounts.reduce((sum, wave) => sum + wave.count, 0);
  const largestWave = waveCounts.reduce((max, wave) => 
    wave.count > max.count ? wave : max
  );
  const smallestWave = waveCounts.reduce((min, wave) => 
    wave.count < min.count ? wave : min
  );
  
  return {
    totalWaves: waveCounts.length,
    averageRidersPerWave: totalRiders / waveCounts.length,
    largestWave,
    smallestWave,
  };
};

/**
 * Sort riders naturally by rider number
 */
export const sortRidersByNumber = (riders: Rider[]): Rider[] => {
  return [...riders].sort((a, b) => {
    const aMatch = a.rider_no.match(/^([A-Z]+)(\d+)$/);
    const bMatch = b.rider_no.match(/^([A-Z]+)(\d+)$/);
    
    if (aMatch && bMatch) {
      const [, aPrefix, aNum] = aMatch;
      const [, bPrefix, bNum] = bMatch;
      
      // Compare prefix first
      const prefixCompare = aPrefix.localeCompare(bPrefix);
      if (prefixCompare !== 0) return prefixCompare;
      
      // If same prefix, compare numbers numerically
      return parseInt(aNum) - parseInt(bNum);
    }
    
    // Fallback to regular string comparison
    return a.rider_no.localeCompare(b.rider_no, undefined, { numeric: true });
  });
};

/**
 * Get wave summary from riders
 */
export const getWaveSummary = (riders: Rider[]): WaveSummary[] => {
  const waveMap = new Map<string, { riders: Rider[]; countries: Set<string> }>();
  
  riders.forEach(rider => {
    const wave = extractWaveFromRiderNo(rider.rider_no);
    if (wave) {
      if (!waveMap.has(wave)) {
        waveMap.set(wave, { riders: [], countries: new Set() });
      }
      const waveData = waveMap.get(wave)!;
      waveData.riders.push(rider);
      if (rider.country) {
        waveData.countries.add(rider.country);
      }
    }
  });
  
  return Array.from(waveMap.entries())
    .map(([code, data]) => ({
      code,
      riderCount: data.riders.length,
      countries: Array.from(data.countries),
    }))
    .sort((a, b) => a.code.localeCompare(b.code));
};

/**
 * Validate wave code
 */
export const isValidWaveCode = (code: string): boolean => {
  return WAVE_CONFIG.knownWaves.includes(code as any);
};

/**
 * Get riders for a specific wave
 */
export const getRidersByWave = (riders: Rider[], waveCode: string): Rider[] => {
  return riders.filter(rider => 
    extractWaveFromRiderNo(rider.rider_no) === waveCode
  );
};

/**
 * Search riders by query
 */
export const searchRiders = (riders: Rider[], query: string): Rider[] => {
  const searchTerm = query.toLowerCase();
  return riders.filter(rider =>
    rider.name.toLowerCase().includes(searchTerm) ||
    rider.rider_no.toLowerCase().includes(searchTerm) ||
    (rider.country && rider.country.toLowerCase().includes(searchTerm))
  );
};