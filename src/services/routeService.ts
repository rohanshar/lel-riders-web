import { API_CONFIG, getApiUrl } from '../config/api';
import { RouteData, ApiError, RouteSegment } from '../types/index';

class RouteService {
  private cache: RouteData | null = null;
  private cacheTimestamp: number = 0;

  /**
   * Fetch route data with caching
   */
  async fetchRouteData(): Promise<RouteData> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.cache && (now - this.cacheTimestamp) < API_CONFIG.cache.cacheTime) {
      return this.cache;
    }

    try {
      const response = await fetch(getApiUrl('routes'));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Cache the data
      this.cache = data;
      this.cacheTimestamp = now;
      
      return data;
    } catch (error) {
      const apiError: ApiError = {
        message: error instanceof Error ? error.message : 'Failed to fetch route data',
        code: 'FETCH_ROUTE_ERROR',
      };
      throw apiError;
    }
  }

  /**
   * Clear the route cache
   */
  clearCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Get distance between two checkpoints
   */
  async getDistanceBetweenCheckpoints(
    startCheckpoint: string,
    endCheckpoint: string
  ): Promise<number> {
    const routeData = await this.fetchRouteData();
    
    const startControl = routeData.controls.find(c => 
      c.name.toLowerCase() === startCheckpoint.toLowerCase()
    );
    const endControl = routeData.controls.find(c => 
      c.name.toLowerCase() === endCheckpoint.toLowerCase()
    );
    
    if (!startControl || !endControl) {
      throw new Error('Invalid checkpoint names');
    }
    
    return Math.abs(endControl.distance - startControl.distance);
  }

}

// Export singleton instance
export const routeService = new RouteService();