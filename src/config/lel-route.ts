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
  { name: 'Northstowe', km: 90, description: 'Merge point with London riders' },
  { name: 'Boston', km: 193 },
  { name: 'Louth', km: 248 },
  { name: 'Hessle', km: 305 },
  { name: 'Malton', km: 373 },
  { name: 'Richmond', km: 467 },
  { name: 'Brampton', km: 581 },
  { name: 'Hawick', km: 654 },
  { name: 'Moffat', km: 725 },
  { name: 'Dalkeith', km: 807 },
  { name: 'Innerleithen', km: 846 },
  { name: 'Eskdalemuir', km: 896 },
  { name: 'Brampton', km: 953, description: 'Return' },
  { name: 'Richmond', km: 1066, description: 'Return' },
  { name: 'Malton', km: 1157, description: 'Return' },
  { name: 'Hessle', km: 1225, description: 'Return' },
  { name: 'Louth', km: 1284, description: 'Return' },
  { name: 'Boston', km: 1340, description: 'Return' },
  { name: 'Northstowe', km: 1443, description: 'Return' },
  { name: 'Henham', km: 1494 },
  { name: 'Writtle', km: 1537, description: 'Finish' }
];

/**
 * Control points for LONDON START riders (L-series waves)
 * These riders do the full London-Edinburgh-London loop
 * All distances are +20km compared to Writtle start
 */
export const LONDON_START_CONTROLS: RouteControl[] = [
  { name: 'London', km: 0, description: 'Start point for L-series riders' },
  { name: 'Writtle', km: 20, description: 'First control after London' },
  { name: 'Northstowe', km: 110, description: 'Merge point with Writtle riders' },
  { name: 'Boston', km: 213 },
  { name: 'Louth', km: 268 },
  { name: 'Hessle', km: 325 },
  { name: 'Malton', km: 393 },
  { name: 'Richmond', km: 487 },
  { name: 'Brampton', km: 601 },
  { name: 'Hawick', km: 674 },
  { name: 'Moffat', km: 745 },
  { name: 'Dalkeith', km: 827 },
  { name: 'Innerleithen', km: 866 },
  { name: 'Eskdalemuir', km: 916 },
  { name: 'Brampton', km: 973, description: 'Return' },
  { name: 'Richmond', km: 1086, description: 'Return' },
  { name: 'Malton', km: 1177, description: 'Return' },
  { name: 'Hessle', km: 1245, description: 'Return' },
  { name: 'Louth', km: 1304, description: 'Return' },
  { name: 'Boston', km: 1360, description: 'Return' },
  { name: 'Northstowe', km: 1463, description: 'Return' },
  { name: 'Henham', km: 1514 },
  { name: 'London', km: 1557, description: 'Finish - back to London' }
];

/**
 * Wave start times for different rider groups
 * Writtle start waves: Base time 4:00 AM, then 15-minute increments
 * London start waves: Base time 5:00 AM, then 15-minute increments
 */
export const WAVE_START_TIMES: { [key: string]: string } = {
  // Writtle start waves (start at 4:00 AM)
  'A': '04:00',
  'B': '04:15',
  'C': '04:30',
  'D': '04:45',
  'E': '05:00',
  'F': '05:15',
  'G': '05:30',
  'H': '05:45',
  'I': '06:00',
  'J': '06:15',
  'K': '06:30',
  'L': '06:45',
  'M': '07:00',
  'N': '07:15',
  'O': '07:30',
  'P': '07:45',
  'Q': '08:00',
  'R': '08:15',
  'S': '08:30',
  'T': '08:45',
  'U': '09:00',
  'V': '09:15',
  'W': '09:30',
  'X': '09:45',
  'Y': '10:00',
  'Z': '10:15',
  'AA': '10:30',
  'AB': '10:45',
  'AC': '11:00',
  'AD': '11:15',
  'AE': '11:30',
  'AF': '11:45',
  'AG': '12:00',
  
  // London start waves (start at 5:00 AM)
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
  return isLondonStartRider(riderNo) ? 1557 : 1537;
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
 * @returns Start time in HH:MM format, or default based on rider type
 */
export const getWaveStartTime = (riderNo: string): string => {
  const waveMatch = riderNo.match(/^([A-Z]+)/);
  if (waveMatch) {
    const waveCode = waveMatch[1];
    if (WAVE_START_TIMES[waveCode]) {
      return WAVE_START_TIMES[waveCode];
    }
    // Default based on whether it's a London start or not
    return isLondonStartRider(riderNo) ? '05:00' : '04:00';
  }
  // Default for non-London riders
  return '04:00';
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