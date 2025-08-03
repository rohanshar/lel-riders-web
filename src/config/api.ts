export const API_CONFIG = {
  BASE_URL: 'https://lel-riders-data-2025.s3.ap-south-1.amazonaws.com',
  endpoints: {
    riders: 'riders.json',
    indianRiders: 'indian-riders-tracking.json',
    routes: 'routes.json',
  },
  // Cache configuration
  cache: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  },
  // Request configuration
  request: {
    timeout: 30000, // 30 seconds
    retries: 3,
    retryDelay: 1000, // 1 second
  },
} as const;

// Helper function to construct full URLs
export const getApiUrl = (endpoint: keyof typeof API_CONFIG.endpoints): string => {
  return `${API_CONFIG.BASE_URL}/${API_CONFIG.endpoints[endpoint]}`;
};

// API URLs for backward compatibility
export const RIDERS_API_URL = getApiUrl('riders');
export const INDIAN_RIDERS_API_URL = getApiUrl('indianRiders');
export const ROUTES_API_URL = getApiUrl('routes');