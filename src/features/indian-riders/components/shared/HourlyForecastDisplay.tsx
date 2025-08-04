import React, { useState, useMemo } from 'react';
import { ChevronRight, CloudRain, Wind, Thermometer } from 'lucide-react';
import type { HourlyForecast } from '../../services/weatherService';

interface HourlyForecastDisplayProps {
  hourlyData: HourlyForecast[];
  className?: string;
}

const getWeatherIcon = (condition: string) => {
  const lowerCondition = condition.toLowerCase();
  
  if (lowerCondition.includes('rain') || lowerCondition.includes('shower')) {
    return '🌧️';
  } else if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) {
    return '☁️';
  } else if (lowerCondition.includes('sun') || lowerCondition.includes('clear')) {
    return '☀️';
  } else if (lowerCondition.includes('storm') || lowerCondition.includes('thunder')) {
    return '⛈️';
  } else if (lowerCondition.includes('snow')) {
    return '❄️';
  } else if (lowerCondition.includes('fog') || lowerCondition.includes('mist')) {
    return '🌫️';
  } else {
    return '🌤️';
  }
};

export const HourlyForecastDisplay: React.FC<HourlyForecastDisplayProps> = ({ 
  hourlyData, 
  className = '' 
}) => {
  const [expandedHours, setExpandedHours] = useState<Set<number>>(new Set());
  const [showAll, setShowAll] = useState(false);

  // Filter to only show future hours using the API's is_historical flag
  const futureHours = useMemo(() => {
    // Use is_historical flag directly - no fallbacks
    return hourlyData.filter(hour => !hour.is_historical);
  }, [hourlyData]);

  // Group hours into time periods for better organization
  const groupedHours = useMemo(() => {
    const periods = {
      next6: futureHours.slice(0, 6),
      next12: futureHours.slice(6, 12),
      next24: futureHours.slice(12, 24)
    };
    return periods;
  }, [futureHours]);

  const hoursToShow = showAll ? futureHours : groupedHours.next6;

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Europe/London'
    });
  };

  const formatHour = (timeStr: string) => {
    // The API provides times without timezone, but they are already in London time
    // Extract just the hour part directly
    const hourMatch = timeStr.match(/T(\d{2}):/);
    if (hourMatch) {
      return parseInt(hourMatch[1]).toString();
    }
    
    // Fallback to parsing (shouldn't happen)
    const date = new Date(timeStr);
    return date.getHours().toString();
  };

  // Find critical weather conditions in future hours
  const criticalHours = useMemo(() => {
    return futureHours.filter(hour => 
      hour.precipitation_probability > 70 || 
      hour.wind_speed > 30 ||
      hour.temperature < 5 ||
      hour.temperature > 30
    );
  }, [futureHours]);

  if (!hourlyData || hourlyData.length === 0 || futureHours.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Summary of critical conditions */}
      {criticalHours.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs">
          <p className="font-semibold text-orange-900 mb-1">⚠️ Weather Alerts Next 24h:</p>
          <ul className="space-y-1 text-orange-800">
            {criticalHours.slice(0, 3).map((hour, idx) => (
              <li key={idx}>
                {formatHour(hour.time)}: 
                {hour.precipitation_probability > 70 && ` ${hour.precipitation_probability}% rain`}
                {hour.wind_speed > 30 && ` ${Math.round(hour.wind_speed)}km/h wind`}
                {hour.temperature < 5 && ` ${Math.round(hour.temperature)}°C cold`}
                {hour.temperature > 30 && ` ${Math.round(hour.temperature)}°C hot`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Hourly forecast display */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            Hourly Forecast
            <span className="text-xs text-muted-foreground font-normal">
              ({showAll ? `${futureHours.length} hours` : `Next ${Math.min(6, futureHours.length)} hours`})
            </span>
          </h4>
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            {showAll ? 'Show less' : `Show all (${futureHours.length}h)`}
          </button>
        </div>

        {/* Mobile-optimized hourly view */}
        <div className="space-y-1">
          {hoursToShow.map((hour, idx) => {
            const isExpanded = expandedHours.has(idx);
            const isHighRain = hour.precipitation_probability > 50;
            const isHighWind = hour.wind_speed > 25;
            
            return (
              <div
                key={idx}
                className={`border rounded-lg transition-all ${
                  isHighRain || isHighWind ? 'border-orange-300 bg-orange-50/50' : 'border-gray-200'
                }`}
              >
                <div
                  className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    const newExpanded = new Set(expandedHours);
                    if (newExpanded.has(idx)) {
                      newExpanded.delete(idx);
                    } else {
                      newExpanded.add(idx);
                    }
                    setExpandedHours(newExpanded);
                  }}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-medium">
                        {formatHour(hour.time)}
                      </span>
                      {hour.hours_from_now !== null && (
                        <span className="text-[10px] text-muted-foreground">
                          in {hour.hours_from_now}h
                        </span>
                      )}
                    </div>
                    <span className="text-lg">
                      {getWeatherIcon(hour.condition)}
                    </span>
                    <span className="text-xs font-medium">
                      {Math.round(hour.temperature)}°
                    </span>
                    
                    {/* Key indicators */}
                    <div className="flex items-center gap-2 text-xs">
                      {hour.precipitation_probability > 30 && (
                        <span className={`flex items-center gap-1 ${
                          isHighRain ? 'text-blue-700 font-medium' : 'text-blue-600'
                        }`}>
                          <CloudRain className="h-3 w-3" />
                          {hour.precipitation_probability}%
                        </span>
                      )}
                      {hour.wind_speed > 15 && (
                        <span className={`flex items-center gap-1 ${
                          isHighWind ? 'text-orange-700 font-medium' : 'text-gray-600'
                        }`}>
                          <Wind className="h-3 w-3" />
                          {Math.round(hour.wind_speed)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <ChevronRight className={`h-3 w-3 text-gray-400 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`} />
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-3 pb-2 text-xs space-y-1 border-t">
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <span className="text-muted-foreground">Feels like:</span>
                        <span className="ml-1 font-medium">{Math.round(hour.feels_like)}°C</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Wind:</span>
                        <span className="ml-1 font-medium">
                          {Math.round(hour.wind_speed)} km/h
                        </span>
                      </div>
                      {hour.precipitation > 0 && (
                        <div>
                          <span className="text-muted-foreground">Rain:</span>
                          <span className="ml-1 font-medium">{hour.precipitation}mm</span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Condition:</span>
                        <span className="ml-1 font-medium">{hour.description}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick summary for mobile */}
        <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
          <div className="bg-gray-50 rounded p-2 text-center">
            <Thermometer className="h-3 w-3 mx-auto mb-1 text-gray-600" />
            <div className="font-medium">
              {Math.round(Math.min(...hoursToShow.map(h => h.temperature)))}° - 
              {Math.round(Math.max(...hoursToShow.map(h => h.temperature)))}°
            </div>
            <div className="text-gray-600">Temp range</div>
          </div>
          <div className="bg-gray-50 rounded p-2 text-center">
            <CloudRain className="h-3 w-3 mx-auto mb-1 text-blue-600" />
            <div className="font-medium">
              {Math.max(...hoursToShow.map(h => h.precipitation_probability))}%
            </div>
            <div className="text-gray-600">Max rain</div>
          </div>
          <div className="bg-gray-50 rounded p-2 text-center">
            <Wind className="h-3 w-3 mx-auto mb-1 text-gray-600" />
            <div className="font-medium">
              {Math.round(Math.max(...hoursToShow.map(h => h.wind_speed)))} km/h
            </div>
            <div className="text-gray-600">Max wind</div>
          </div>
        </div>
      </div>
    </div>
  );
};