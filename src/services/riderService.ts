import { API_CONFIG, getApiUrl } from '../config/api';
import { Rider, IndianRider, ApiResponse, ApiError } from '../types/index';

class RiderService {
  private abortControllers: Map<string, AbortController> = new Map();

  /**
   * Generic fetch wrapper with error handling and retry logic
   */
  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit = {},
    retries: number = API_CONFIG.request.retries
  ): Promise<T> {
    const controller = new AbortController();
    const key = url;
    
    // Cancel any existing request to the same URL
    this.cancelRequest(key);
    this.abortControllers.set(key, controller);

    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.request.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.abortControllers.delete(key);
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      this.abortControllers.delete(key);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }

        if (retries > 0 && !error.message.includes('abort')) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, API_CONFIG.request.retryDelay));
          return this.fetchWithRetry<T>(url, options, retries - 1);
        }
      }

      throw error;
    }
  }

  /**
   * Cancel a specific request
   */
  private cancelRequest(key: string): void {
    const controller = this.abortControllers.get(key);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(key);
    }
  }

  /**
   * Cancel all ongoing requests
   */
  cancelAllRequests(): void {
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
  }

  /**
   * Fetch all riders
   */
  async fetchRiders(): Promise<Rider[]> {
    try {
      const data = await this.fetchWithRetry<Rider[]>(getApiUrl('riders'));
      return data;
    } catch (error) {
      const apiError: ApiError = {
        message: error instanceof Error ? error.message : 'Failed to fetch riders',
        code: 'FETCH_RIDERS_ERROR',
      };
      throw apiError;
    }
  }

  /**
   * Fetch Indian riders tracking data
   */
  async fetchIndianRiders(): Promise<ApiResponse<IndianRider[]>> {
    try {
      const data = await this.fetchWithRetry<ApiResponse<IndianRider[]>>(
        getApiUrl('indianRiders')
      );
      return data;
    } catch (error) {
      const apiError: ApiError = {
        message: error instanceof Error ? error.message : 'Failed to fetch Indian riders',
        code: 'FETCH_INDIAN_RIDERS_ERROR',
      };
      throw apiError;
    }
  }

  /**
   * Fetch riders for a specific wave
   */
  async fetchRidersByWave(waveCode: string): Promise<Rider[]> {
    const allRiders = await this.fetchRiders();
    return allRiders.filter(rider => 
      rider.rider_no.startsWith(waveCode)
    );
  }

  /**
   * Search riders by name or rider number
   */
  async searchRiders(query: string): Promise<Rider[]> {
    const allRiders = await this.fetchRiders();
    const searchTerm = query.toLowerCase();
    
    return allRiders.filter(rider =>
      rider.name.toLowerCase().includes(searchTerm) ||
      rider.rider_no.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Get riders by country
   */
  async getRidersByCountry(country: string): Promise<Rider[]> {
    const allRiders = await this.fetchRiders();
    return allRiders.filter(rider => 
      rider.country?.toLowerCase() === country.toLowerCase()
    );
  }

  /**
   * Get rider statistics
   */
  async getRiderStatistics(): Promise<{
    totalRiders: number;
    byCountry: Map<string, number>;
    byWave: Map<string, number>;
  }> {
    const riders = await this.fetchRiders();
    
    const byCountry = new Map<string, number>();
    const byWave = new Map<string, number>();
    
    riders.forEach(rider => {
      // Count by country
      const country = rider.country || 'Unknown';
      byCountry.set(country, (byCountry.get(country) || 0) + 1);
      
      // Count by wave
      const waveMatch = rider.rider_no.match(/^([A-Z]+)/);
      if (waveMatch) {
        const wave = waveMatch[1];
        byWave.set(wave, (byWave.get(wave) || 0) + 1);
      }
    });
    
    return {
      totalRiders: riders.length,
      byCountry,
      byWave,
    };
  }
}

// Export singleton instance
export const riderService = new RiderService();