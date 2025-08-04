import React, { useState, useEffect } from 'react';
import { TrendingUp, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LatestUpdate {
  riderName: string;
  riderNo: string;
  checkpoint: string;
  time: string;
  timestamp: Date;
  minutesAgo: number;
}

interface LatestUpdatesCardProps {
  updates: LatestUpdate[];
  onSelectRider?: (riderId: string) => void;
}

export const LatestUpdatesCard: React.FC<LatestUpdatesCardProps> = ({ updates, onSelectRider }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute instead of every second
    return () => clearInterval(timer);
  }, []);
  
  if (updates.length === 0) return null;
  
  const getTimeAgo = (timestamp: Date) => {
    // Get current UK time for accurate comparison
    const ukTimeString = currentTime.toLocaleString('en-US', { 
      timeZone: 'Europe/London',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    // Parse UK time string to get actual UK time as Date object
    const [datePart, timePart] = ukTimeString.split(', ');
    const [month, day, year] = datePart.split('/');
    const [hours, minutes, seconds] = timePart.split(':');
    const ukCurrentTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds));
    
    const diff = ukCurrentTime.getTime() - timestamp.getTime();
    const totalMinutes = Math.floor(diff / 1000 / 60);
    
    if (totalMinutes < 1) {
      return 'just now';
    } else if (totalMinutes < 60) {
      return totalMinutes === 1 ? '1 min ago' : `${totalMinutes} mins ago`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      if (mins === 0) {
        return `${hours}h ago`;
      }
      return `${hours}h ${mins}m ago`;
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
            <span className="hidden sm:inline">Latest Updates</span>
            <span className="sm:hidden">Updates</span>
          </CardTitle>
          <Badge variant="secondary" className="text-[10px] sm:text-xs">
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {updates.map((update, index) => (
            <div 
              key={`${update.riderNo}-${update.checkpoint}-${index}`}
              className={`flex items-center justify-between text-xs py-1.5 px-2 rounded transition-colors ${
                onSelectRider ? 'hover:bg-gray-50 cursor-pointer' : ''
              }`}
              onClick={() => onSelectRider?.(update.riderNo)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Badge variant="outline" className="text-xs px-1.5 py-0 shrink-0">
                  {getTimeAgo(update.timestamp)}
                </Badge>
                <span className="font-medium truncate">
                  {update.riderName}
                </span>
                <span className="hidden sm:inline text-muted-foreground">
                  ({update.riderNo})
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <MapPin className="h-3 w-3 text-muted-foreground hidden sm:inline" />
                <span className="font-medium text-xs">{update.checkpoint}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};