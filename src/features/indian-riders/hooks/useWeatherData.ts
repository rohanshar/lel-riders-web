import { useState, useEffect } from 'react';
import { weatherService, type WeatherResponse, type ControlWeatherData } from '../services/weatherService';

export const useWeatherData = () => {
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        const data = await weatherService.fetchWeatherData();
        setWeatherData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    
    // Refresh weather data every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getWeatherForControl = (controlName: string): ControlWeatherData | null => {
    if (!weatherData || !weatherData.weather) return null;
    
    // Clean control name (remove direction suffixes)
    const cleanName = controlName.replace(/\s+[NSEW]$/, '');
    
    console.log(`[getWeatherForControl] Looking for weather for: "${controlName}" (cleaned: "${cleanName}")`);
    console.log('[getWeatherForControl] Available weather locations:', weatherData.weather.map(w => w.control_name));
    
    const found = weatherData.weather.find(
      weather => 
        weather.control_name === cleanName ||
        weather.control_name === controlName ||
        cleanName.includes(weather.control_name) ||
        weather.control_name.includes(cleanName)
    );
    
    console.log(`[getWeatherForControl] Found weather:`, found);
    
    return found || null;
  };

  return {
    weatherData,
    loading,
    error,
    getWeatherForControl
  };
};