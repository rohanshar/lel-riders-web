import { API_CONFIG } from '@/config/api';

export interface HourlyForecast {
  time: string; // ISO format timestamp
  time_unix: number; // Unix timestamp
  is_historical: boolean; // true for past hours, false for future
  hours_from_now: number | null; // null for historical, number for future
  temperature: number;
  feels_like: number;
  precipitation_probability: number;
  precipitation: number;
  wind_speed: number;
  wind_direction: number;
  weather_code: number;
  condition: string;
  description: string;
}

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
  hourly_forecast?: HourlyForecast[];
  metadata?: {
    description: string;
    current_utc_time: string;
    current_local_time: string;
    total_hours: number;
    historical_hours: number;
    forecast_hours: number;
    timezone: string;
    note: string;
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
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async fetchWeatherData(): Promise<WeatherResponse> {
    const now = Date.now();
    
    // Return cached data if still fresh
    if (this.weatherCache && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      return this.weatherCache;
    }

    try {
      // Add cache-busting parameter
      const cacheBuster = `?t=${Date.now()}`;
      const url = `${API_CONFIG.BASE_URL}/control-weather.json${cacheBuster}`;
      
      console.log('Fetching weather from:', url);
      
      const response = await fetch(url, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch weather data: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Log sample data to verify what we're getting
      if (data.weather && data.weather.length > 0 && data.weather[0].hourly_forecast) {
        const sample = data.weather[0];
        console.log('Weather data for:', sample.control_name);
        console.log('Historical hours:', sample.hourly_forecast.filter((h: HourlyForecast) => h.is_historical).length);
        console.log('Future hours:', sample.hourly_forecast.filter((h: HourlyForecast) => !h.is_historical).length);
        console.log('First 3 hours:', sample.hourly_forecast.slice(0, 3).map((h: HourlyForecast) => ({
          time: h.time,
          is_historical: h.is_historical
        })));
      }
      
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