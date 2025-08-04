import React from 'react';
import { CloudRain, Cloud, Sun } from 'lucide-react';
import type { WeatherData } from '../../types/weather';

interface WeatherIndicatorProps {
  weather: WeatherData;
  size?: 'sm' | 'md';
}

export const WeatherIndicator: React.FC<WeatherIndicatorProps> = ({ weather, size = 'sm' }) => {
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="flex items-center gap-1">
      {weather.condition === 'rain' && (
        <>
          <CloudRain className={`${iconSize} text-blue-500`} />
          <span className={`${textSize} text-blue-600 font-medium`}>
            {weather.description}
            {weather.temperature && ` • ${weather.temperature}°C`}
          </span>
        </>
      )}
      {weather.condition === 'cloudy' && (
        <>
          <Cloud className={`${iconSize} text-gray-500`} />
          <span className={`${textSize} text-gray-600`}>
            Cloudy
            {weather.temperature && ` • ${weather.temperature}°C`}
          </span>
        </>
      )}
      {weather.condition === 'sunny' && (
        <>
          <Sun className={`${iconSize} text-yellow-500`} />
          <span className={`${textSize} text-yellow-600`}>
            Sunny
            {weather.temperature && ` • ${weather.temperature}°C`}
          </span>
        </>
      )}
    </div>
  );
};