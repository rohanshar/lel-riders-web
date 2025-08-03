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
 * Base time: 5:00 AM for A and LA, then 15-minute increments
 */
export const WAVE_START_TIMES: { [key: string]: string } = {
  // Writtle start waves
  'A': '05:00',
  'B': '05:15',
  'C': '05:30',
  'D': '05:45',
  'E': '06:00',
  'F': '06:15',
  'G': '06:30',
  'H': '06:45',
  'I': '07:00',
  'J': '07:15',
  'K': '07:30',
  'L': '07:45',
  'M': '08:00',
  'N': '08:15',
  'O': '08:30',
  'P': '08:45',
  'Q': '09:00',
  'R': '09:15',
  'S': '09:30',
  'T': '09:45',
  'U': '10:00',
  'V': '10:15',
  'W': '10:30',
  'X': '10:45',
  'Y': '11:00',
  'Z': '11:15',
  'AA': '11:30',
  'AB': '11:45',
  'AC': '12:00',
  'AD': '12:15',
  'AE': '12:30',
  'AF': '12:45',
  'AG': '13:00',
  
  // London start waves
  'LA': '05:00',
  'LB': '05:15',
  'LC': '05:30',
  'LD': '05:45',
  'LE': '06:00',
  'LF': '06:15',
  'LG': '06:30',
  'LH': '06:45',
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

/**
 * Calculate elapsed time from wave start to checkpoint arrival
 * @param riderNo - The rider's bib number
 * @param checkpointTime - The checkpoint arrival time (e.g., "3/8 19:32" or "Sunday 08:46")
 * @param eventDate - The event start date (default: "2025-08-03")
 * @returns Elapsed time in minutes, or null if invalid
 */
export const calculateElapsedTime = (
  riderNo: string,
  checkpointTime: string,
  eventDate: string = '2025-08-03'
): number | null => {
  try {
    // Get wave start time
    const waveStartTime = getWaveStartTime(riderNo);
    
    // Handle different time formats
    let checkpointDateStr: string;
    
    if (checkpointTime.includes('/')) {
      // Format: "3/8 19:32"
      const [date, time] = checkpointTime.split(' ');
      if (!date || !time) return null;
      
      const [day, month] = date.split('/');
      const year = eventDate.split('-')[0];
      checkpointDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${time}:00`;
    } else {
      // Format: "Sunday 08:46"
      const parts = checkpointTime.split(' ');
      const time = parts[parts.length - 1];
      if (!time || !time.includes(':')) return null;
      
      // For now, assume it's the same day as the event start
      checkpointDateStr = `${eventDate} ${time}:00`;
    }
    
    const checkpointDate = new Date(checkpointDateStr);
    const startDate = new Date(`${eventDate} ${waveStartTime}:00`);
    
    // Calculate difference in minutes
    const diffMs = checkpointDate.getTime() - startDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    return diffMinutes > 0 ? diffMinutes : null;
  } catch (error) {
    console.error('Error calculating elapsed time:', error);
    return null;
  }
};

/**
 * Format elapsed time from minutes to human-readable format
 * @param minutes - Total elapsed minutes
 * @returns Formatted string like "2d 5h 30m" or "5h 30m"
 */
export const formatElapsedTime = (minutes: number): string => {
  if (minutes < 0) return '0m';
  
  const days = Math.floor(minutes / (24 * 60));
  const hours = Math.floor((minutes % (24 * 60)) / 60);
  const mins = minutes % 60;
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);
  
  return parts.join(' ');
};