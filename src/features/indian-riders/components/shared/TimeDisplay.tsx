import React from 'react';
import { Clock } from 'lucide-react';

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
  
  return (
    <>
      {/* London Time Display */}
      <div className="bg-gray-100 rounded-lg p-2 sm:p-3 text-center">
        <div className="text-xs sm:text-sm text-gray-600">London Time</div>
        <div className="text-base sm:text-lg font-semibold">{londonTime}</div>
      </div>
      
      {/* Last Updated */}
      <div className="flex items-center text-muted-foreground text-xs sm:text-sm">
        <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
        <span className="hidden sm:inline">Updated</span>
        <span className="sm:hidden">Upd</span>
        <span className={`font-medium ml-1 ${isStale ? 'text-orange-600' : 'text-foreground'}`}>
          {timeSinceUpdate}
        </span>
        {isStale && (
          <span className="hidden sm:inline text-orange-600 ml-2">(Data may be stale)</span>
        )}
      </div>
    </>
  );
};