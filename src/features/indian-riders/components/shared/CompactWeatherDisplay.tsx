import React, { useState } from 'react';
import { Cloud, CloudRain, Sun, Wind, Droplets, Thermometer, AlertTriangle, ChevronDown, ChevronUp, Navigation } from 'lucide-react';
import type { ControlWeatherData } from '../../services/weatherService';
import type { Control } from '../../types/weather';
import { HourlyForecastDisplay } from './HourlyForecastDisplay';
import { getWindType, getWindDirectionName } from '../../utils/windCalculations';

interface CompactWeatherDisplayProps {
  weather: ControlWeatherData;
  control?: Control;
  className?: string;
}

const getWeatherIcon = (condition: string, size: string = 'h-4 w-4') => {
  const lowerCondition = condition.toLowerCase();
  
  if (lowerCondition.includes('rain') || lowerCondition.includes('shower')) {
    return <CloudRain className={`${size} text-blue-500`} />;
  } else if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) {
    return <Cloud className={`${size} text-gray-500`} />;
  } else if (lowerCondition.includes('sun') || lowerCondition.includes('clear')) {
    return <Sun className={`${size} text-yellow-500`} />;
  } else {
    return <Cloud className={`${size} text-gray-400`} />;
  }
};

const getWindDirection = (degrees: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
};

export const CompactWeatherDisplay: React.FC<CompactWeatherDisplayProps> = ({ 
  weather, 
  control,
  className = '' 
}) => {
  const isRainy = weather.current.condition.toLowerCase().includes('rain');
  const isHighWind = weather.current.wind_speed > 25; // km/h
  const isCold = weather.current.temperature < 10;
  const isHot = weather.current.temperature > 25;
  
  const hasWarning = isRainy || isHighWind || isCold || isHot;
  
  // Calculate wind type if control info is available
  const windInfo = control ? getWindType(weather.current.wind_direction, control.leg) : null;

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      {/* Main weather icon and temp */}
      <div className="flex items-center gap-1">
        {getWeatherIcon(weather.current.condition)}
        <span className={`font-medium ${
          isCold ? 'text-blue-600' : isHot ? 'text-orange-600' : ''
        }`}>
          {Math.round(weather.current.temperature)}°
        </span>
      </div>

      {/* Wind info with headwind/tailwind indicator */}
      <div className={`flex items-center gap-1 ${
        isHighWind ? 'text-orange-600 font-medium' : 'text-muted-foreground'
      }`}>
        <Wind className="h-3 w-3" />
        <span>{Math.round(weather.current.wind_speed)}</span>
        {windInfo && (
          <span className={`text-[10px] font-medium ${
            windInfo.type === 'headwind' ? 'text-red-600' : 
            windInfo.type === 'tailwind' ? 'text-green-600' : 
            'text-gray-600'
          }`}>
            {windInfo.type === 'headwind' ? '↓' : windInfo.type === 'tailwind' ? '↑' : '→'}
          </span>
        )}
      </div>

      {/* Rain probability if > 30% */}
      {weather.forecast_24h.rain_probability > 30 && (
        <div className="flex items-center gap-1 text-blue-600">
          <Droplets className="h-3 w-3" />
          <span>{weather.forecast_24h.rain_probability}%</span>
        </div>
      )}

      {/* Warning indicator */}
      {hasWarning && (
        <AlertTriangle className="h-3 w-3 text-orange-500" />
      )}
    </div>
  );
};

// Extended weather display for expanded view
export const ExtendedWeatherDisplay: React.FC<CompactWeatherDisplayProps> = ({ 
  weather,
  control 
}) => {
  const isRainy = weather.current.condition.toLowerCase().includes('rain');
  const isHighWind = weather.current.wind_speed > 25;
  const isCold = weather.current.temperature < 10;
  const isHot = weather.current.temperature > 25;
  
  const windInfo = control ? getWindType(weather.current.wind_direction, control.leg) : null;
  const windDirName = getWindDirectionName(weather.current.wind_direction);

  return (
    <div className="p-3 bg-blue-50 rounded-lg space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {getWeatherIcon(weather.current.condition, 'h-6 w-6')}
          <div>
            <p className="font-medium text-sm">{weather.current.description}</p>
            <p className="text-xs text-muted-foreground">
              Feels like {Math.round(weather.current.feels_like)}°C
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${
            isCold ? 'text-blue-600' : isHot ? 'text-orange-600' : ''
          }`}>
            {Math.round(weather.current.temperature)}°C
          </p>
          <p className="text-xs text-muted-foreground">
            {Math.round(weather.forecast_24h.min_temp)}° / {Math.round(weather.forecast_24h.max_temp)}°
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Wind className={`h-4 w-4 ${isHighWind ? 'text-orange-600' : 'text-gray-500'}`} />
          <div>
            <p className={`font-medium ${isHighWind ? 'text-orange-600' : ''}`}>
              Wind: {Math.round(weather.current.wind_speed)} km/h {windDirName}
            </p>
            {windInfo && (
              <p className={`text-xs ${
                windInfo.type === 'headwind' ? 'text-red-600' : 
                windInfo.type === 'tailwind' ? 'text-green-600' : 
                'text-gray-600'
              } font-medium`}>
                {windInfo.type === 'headwind' ? '↓ Headwind' : 
                 windInfo.type === 'tailwind' ? '↑ Tailwind' : 
                 '→ Crosswind'} ({Math.round(windInfo.component)}%)
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Droplets className="h-4 w-4 text-blue-500" />
          <div>
            <p className="font-medium">Rain: {weather.forecast_24h.rain_probability}%</p>
            {weather.current.precipitation > 0 && (
              <p className="text-muted-foreground">{weather.current.precipitation}mm/h</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-gray-500" />
          <div>
            <p className="font-medium">Humidity: {weather.current.humidity}%</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4 text-yellow-500" />
          <div>
            <p className="font-medium">UV Index: {weather.current.uv_index}</p>
          </div>
        </div>
      </div>

      {/* Cycling-specific warnings */}
      <div className="space-y-1">
        {isRainy && (
          <p className="text-xs text-blue-700 font-medium flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Wet roads - ride with caution
          </p>
        )}
        {isHighWind && (
          <p className="text-xs text-orange-700 font-medium flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Strong winds - expect slower progress
          </p>
        )}
        {isCold && (
          <p className="text-xs text-blue-700 font-medium flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Cold conditions - layer up
          </p>
        )}
        {isHot && (
          <p className="text-xs text-orange-700 font-medium flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Hot weather - stay hydrated
          </p>
        )}
      </div>

      {/* Hourly forecast */}
      {weather.hourly_forecast && weather.hourly_forecast.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <HourlyForecastDisplay hourlyData={weather.hourly_forecast} />
        </div>
      )}
    </div>
  );
};