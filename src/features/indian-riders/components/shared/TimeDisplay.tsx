import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw } from 'lucide-react';

interface TimeDisplayProps {
  londonTime: string;
  lastUpdateTime: Date | null;
  timeSinceUpdate: string;
}

export const TimeDisplay: React.FC<TimeDisplayProps> = ({
  londonTime,
  lastUpdateTime,
  timeSinceUpdate
}) => {
  const isStale = lastUpdateTime && (new Date().getTime() - lastUpdateTime.getTime()) > 600000;
  const [timeToNextUpdate, setTimeToNextUpdate] = useState<string>('');
  
  useEffect(() => {
    const updateTimer = () => {
      if (!lastUpdateTime) return;
      
      const now = new Date();
      const timeSinceLastUpdate = now.getTime() - lastUpdateTime.getTime();
      const updateInterval = 10 * 60 * 1000; // 10 minutes in milliseconds
      const timeUntilNext = updateInterval - (timeSinceLastUpdate % updateInterval);
      
      const minutes = Math.floor(timeUntilNext / 60000);
      const seconds = Math.floor((timeUntilNext % 60000) / 1000);
      
      if (minutes > 0) {
        setTimeToNextUpdate(`${minutes}m ${seconds}s`);
      } else {
        setTimeToNextUpdate(`${seconds}s`);
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lastUpdateTime]);
  
  return (
    <>
      {/* London Time Display */}
      <div className="bg-gray-100 rounded-lg p-2 sm:p-3 text-center">
        <div className="text-xs sm:text-sm text-gray-600">London Time</div>
        <div className="text-base sm:text-lg font-semibold">{londonTime}</div>
      </div>
      
      {/* Update Status */}
      <div className="bg-gray-50 rounded-lg p-2 sm:p-3 border border-gray-200">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isStale ? 'bg-orange-500' : 'bg-green-500'} animate-pulse`} />
            <div className="text-xs sm:text-sm">
              <span className="text-gray-600">Updated </span>
              <span className={`font-medium ${isStale ? 'text-orange-600' : 'text-gray-900'}`}>
                {timeSinceUpdate}
              </span>
            </div>
          </div>
          {timeToNextUpdate && (
            <div className="flex items-center gap-1 text-xs sm:text-sm">
              <RefreshCw className="h-3 w-3 text-gray-400" />
              <span className="text-gray-600">Next in </span>
              <span className="font-medium text-gray-900">{timeToNextUpdate}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};