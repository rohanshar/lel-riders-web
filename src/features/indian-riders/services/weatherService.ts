import { API_CONFIG } from '@/config/api';

export interface ControlWeatherData {
  control_id: string;
  control_name: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  current: {
    temperature: number;
    temperature_unit: string;
    condition: string;
    condition_code: number;
    description: string;
    wind_speed: number;
    wind_direction: number;
    humidity: number;
    pressure: number;
    uv_index: number;
    feels_like: number;
    precipitation: number;
  };
  forecast_24h: {
    rain_probability: number;
    max_temp: number;
    min_temp: number;
  };
}

export interface WeatherResponse {
  event: {
    name: string;
    distance_km: number;
    controls: Array<{
      id: string;
      name: string;
      km: number;
      leg: string;
    }>;
  };
  weather: ControlWeatherData[];  // Changed from weather_data to weather
  last_updated: string;
}

class WeatherService {
  private weatherCache: WeatherResponse | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  async fetchWeatherData(): Promise<WeatherResponse> {
    const now = Date.now();
    
    // Return cached data if still fresh
    if (this.weatherCache && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      return this.weatherCache;
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/control-weather.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch weather data: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[WeatherService] Fetched weather data:', data);
      this.weatherCache = data;
      this.lastFetchTime = now;
      return data;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      // Return cached data if available, even if stale
      if (this.weatherCache) {
        return this.weatherCache;
      }
      throw error;
    }
  }

  getWeatherForControl(controlName: string): ControlWeatherData | null {
    if (!this.weatherCache || !this.weatherCache.weather) return null;

    // Clean control name (remove direction suffixes)
    const cleanName = controlName.replace(/\s+[NSEW]$/, '');
    
    return this.weatherCache.weather.find(
      weather => 
        weather.control_name === cleanName ||
        weather.control_name === controlName ||
        cleanName.includes(weather.control_name) ||
        weather.control_name.includes(cleanName)
    ) || null;
  }
}

export const weatherService = new WeatherService();