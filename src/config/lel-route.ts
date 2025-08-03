/**
 * LEL 2025 Route Configuration
 * 
 * The London-Edinburgh-London event has TWO starting points:
 * 1. LONDON START - for riders in L-series waves (LA, LB, LC, LD, LE, LF, LG, LH)
 * 2. WRITTLE START - for all other riders (A, AA, AB, etc.)
 * 
 * Both routes MERGE at Northstowe and then continue on the same route.
 */

export interface RouteControl {
  name: string;
  km: number;
  description?: string;
}

/**
 * Control points for WRITTLE START riders
 * These riders skip London and start directly from Writtle
 */
export const WRITTLE_START_CONTROLS: RouteControl[] = [
  { name: 'Writtle', km: 0, description: 'Start point for non-London riders' },
  { name: 'Northstowe', km: 110, description: 'Merge point with London riders' },
  { name: 'Boston', km: 217 },
  { name: 'Louth', km: 307 },
  { name: 'Hessle', km: 423 },
  { name: 'Malton', km: 520 },
  { name: 'Richmond', km: 616 },
  { name: 'Brampton', km: 737 },
  { name: 'Hawick', km: 841 },
  { name: 'Moffat', km: 958 },
  { name: 'Dalkeith', km: 1069 },
  { name: 'Innerleithen', km: 1181 },
  { name: 'Eskdalemiur', km: 1284 },
  { name: 'Henham', km: 1540, description: 'Finish for Writtle start riders' }
];

/**
 * Control points for LONDON START riders (L-series waves)
 * These riders do the full London-Edinburgh-London loop
 */
export const LONDON_START_CONTROLS: RouteControl[] = [
  { name: 'London', km: 0, description: 'Start point for L-series riders' },
  { name: 'Writtle', km: 64, description: 'First control after London' },
  { name: 'Northstowe', km: 174, description: 'Merge point with Writtle riders (64 + 110)' },
  { name: 'Boston', km: 281 },
  { name: 'Louth', km: 371 },
  { name: 'Hessle', km: 487 },
  { name: 'Malton', km: 584 },
  { name: 'Richmond', km: 680 },
  { name: 'Brampton', km: 801 },
  { name: 'Hawick', km: 905 },
  { name: 'Moffat', km: 1022 },
  { name: 'Dalkeith', km: 1133 },
  { name: 'Innerleithen', km: 1245 },
  { name: 'Eskdalemiur', km: 1348 },
  { name: 'London', km: 1604, description: 'Finish - back to London' }
];

/**
 * Wave start times for different rider groups
 */
export const WAVE_START_TIMES: { [key: string]: string } = {
  'A': '03:55',
  'B': '06:30',
  'C': '07:00',
  'LA': '04:35',
  'LB': '04:35',
  'LC': '05:00',
  'LD': '05:00',
  'LE': '05:30',
  'LF': '05:30',
  'LG': '06:00',
  'LH': '06:00',
  // Add more as needed
};

/**
 * Check if a rider is a London start based on their wave code
 * @param riderNo - The rider's bib number (e.g., "LA15", "A25")
 * @returns true if the rider starts from London, false if from Writtle
 */
export const isLondonStartRider = (riderNo: string): boolean => {
  return /^L[A-H]/.test(riderNo);
};

/**
 * Get the appropriate control points for a rider based on their start location
 * @param riderNo - The rider's bib number
 * @returns Array of control points for the rider's route
 */
export const getControlsForRider = (riderNo: string): RouteControl[] => {
  return isLondonStartRider(riderNo) ? LONDON_START_CONTROLS : WRITTLE_START_CONTROLS;
};

/**
 * Get the total distance for a rider based on their start location
 * @param riderNo - The rider's bib number
 * @returns Total distance in kilometers
 */
export const getTotalDistanceForRider = (riderNo: string): number => {
  return isLondonStartRider(riderNo) ? 1604 : 1540;
};

/**
 * Find the distance for a checkpoint name
 * @param checkpointName - Name of the checkpoint (may include directional suffixes like "N", "S")
 * @param riderNo - The rider's bib number to determine which route to use
 * @returns Distance in kilometers, or 0 if not found
 */
export const getCheckpointDistance = (checkpointName: string, riderNo: string): number => {
  const controls = getControlsForRider(riderNo);
  
  // Clean checkpoint name by removing directional suffixes (N, S, E, W)
  const cleanName = checkpointName.replace(/\s+[NSEW]$/, '');
  
  const control = controls.find(c => 
    c.name === cleanName || 
    c.name === checkpointName ||
    checkpointName.includes(c.name) ||
    // Special case: "Start" means Writtle for Writtle riders, London for London riders
    (checkpointName === 'Start' && c.km === 0)
  );
  
  return control ? control.km : 0;
};

/**
 * Get the wave start time for a rider
 * @param riderNo - The rider's bib number
 * @returns Start time in HH:MM format, or default "06:00" if not found
 */
export const getWaveStartTime = (riderNo: string): string => {
  const waveMatch = riderNo.match(/^([A-Z]+)/);
  if (waveMatch) {
    return WAVE_START_TIMES[waveMatch[1]] || '06:00';
  }
  return '06:00';
};