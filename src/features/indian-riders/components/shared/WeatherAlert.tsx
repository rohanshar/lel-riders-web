import React from 'react';
import { CloudRain } from 'lucide-react';
import type { WeatherData, Control } from '../../types/weather';

interface WeatherAlertProps {
  weather: WeatherData;
  control: Control;
}

export const WeatherAlert: React.FC<WeatherAlertProps> = ({ weather, control }) => {
  if (weather.condition !== 'rain') return null;

  return (
    <div className="mb-3 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start gap-2">
        <CloudRain className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-xs sm:text-sm font-semibold text-blue-900 mb-0.5 sm:mb-1">Weather Alert</h4>
          <p className="text-[10px] sm:text-xs text-blue-800">
            {weather.description} expected at {control.name}. 
            {weather.temperature && ` Temperature: ${weather.temperature}°C.`}
            <span className="hidden sm:inline">{' '}Riders should prepare appropriate rain gear and ride with extra caution.</span>
            <span className="sm:hidden">{' '}Ride with caution.</span>
          </p>
        </div>
      </div>
    </div>
  );
};