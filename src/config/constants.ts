// Application constants
export const APP_CONFIG = {
  // Application metadata
  name: 'LEL 2025 Riders Tracking',
  description: 'Track riders participating in London-Edinburgh-London 2025',
  version: '1.0.0',
  
  // Event details
  event: {
    name: 'London-Edinburgh-London',
    year: 2025,
    startDate: '2025-08-03',
    endDate: '2025-08-07',
    distance: 1540, // km
    timeLimit: 125, // hours
  },
  
  // UI configuration
  ui: {
    itemsPerPage: 50,
    maxRidersPerWave: 60,
    defaultSortField: 'rider_no',
    searchDebounceDelay: 300, // milliseconds
  },
  
  // Feature flags
  features: {
    enableAnalytics: true,
    enableMaps: true,
    enableRealTimeTracking: true,
    enableOfflineSupport: false,
  },
} as const;

// Wave configuration
export const WAVE_CONFIG = {
  // Regular expression to extract wave from rider number
  wavePattern: /^([A-Z]+)/,
  
  // Known waves (for validation)
  knownWaves: [
    'LA', 'LB', 'LC', 'LD', 'LE', 'LF', 'LG', 'LH', 'LI', 'LJ', 'LK', 'LL', 'LM', 'LN', 'LO', 'LP', 'LQ', 'LR', 'LS', 'LT', 'LU', 'LV', 'LW', 'LX', 'LY', 'LZ',
    'AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH', 'AI', 'AJ', 'AK', 'AL', 'AM', 'AN', 'AO', 'AP', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AV', 'AW', 'AX', 'AY', 'AZ',
  ],
} as const;

// Route checkpoints
export const CHECKPOINTS = [
  { name: 'London', km: 0 },
  { name: 'St Ives', km: 108 },
  { name: 'Spalding', km: 205 },
  { name: 'Louth', km: 311 },
  { name: 'Humber Bridge', km: 370 },
  { name: 'Pocklington', km: 438 },
  { name: 'Thirsk', km: 507 },
  { name: 'Barnard Castle', km: 606 },
  { name: 'Brampton', km: 711 },
  { name: 'Moffat', km: 789 },
  { name: 'Edinburgh', km: 870 },
] as const;

// Rider status definitions
export const RIDER_STATUS = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  DNF: 'Did Not Finish',
  DNS: 'Did Not Start',
} as const;

export type RiderStatusType = typeof RIDER_STATUS[keyof typeof RIDER_STATUS];