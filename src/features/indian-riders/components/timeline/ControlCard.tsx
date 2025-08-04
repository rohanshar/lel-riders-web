import React, { useState, useMemo } from 'react';
import { Users, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Rider, Checkpoint } from '../../types';
import type { Control } from '../../types/weather';
import type { ControlWeatherData } from '../../services/weatherService';
import { CompactWeatherDisplay, ExtendedWeatherDisplay } from '../shared/CompactWeatherDisplay';
import { calculateTimeAgo } from '../../utils/riderCalculations';
import { RiderList } from './RiderList';

interface ControlCardProps {
  control: Control;
  ridersAtControl: Rider[];
  currentRiderCount: number;
  hasLondonRiders: boolean;
  hasWrittleRiders: boolean;
  isStart: boolean;
  isLast: boolean;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  searchTerm: string;
  onSearch: (term: string) => void;
  showAllRiders: boolean;
  onToggleShowAll: () => void;
  selectedRiderId: string | null;
  onSelectRider: (riderId: string | null) => void;
  allRiders: Rider[];
  weather: ControlWeatherData | null;
}

interface RiderWithTimestamp {
  rider: Rider;
  checkpoint: Checkpoint;
  timestamp: Date | null;
}

export const ControlCard: React.FC<ControlCardProps> = ({
  control,
  ridersAtControl,
  currentRiderCount,
  hasLondonRiders,
  hasWrittleRiders,
  isStart,
  isLast,
  isExpanded,
  onToggleExpansion,
  searchTerm,
  onSearch,
  showAllRiders,
  onToggleShowAll,
  selectedRiderId,
  onSelectRider,
  allRiders,
  weather
}) => {
  const riderCount = ridersAtControl.length;
  const writtleDistance = control.km;
  
  // Get latest arrivals
  const latestArrivals = useMemo(() => {
    if (!ridersAtControl.length) return [];
    
    // Parse times and sort by arrival
    const ridersWithParsedTimes = ridersAtControl.map((rider: Rider): RiderWithTimestamp | null => {
      const checkpoint = rider.checkpoints.find((cp: Checkpoint) => 
        cp.name === control.name || cp.name.includes(control.name)
      );
      
      if (!checkpoint?.time) return null;
      
      // Parse checkpoint time to get proper timestamp
      let timestamp: Date | null = null;
      
      if (checkpoint.time.includes('/')) {
        // Format: "3/8 19:32"
        const [date, time] = checkpoint.time.split(' ');
        const [day, month] = date.split('/');
        const [hours, minutes] = time.split(':');
        timestamp = new Date(2025, parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
      } else {
        // Format: "Sunday 08:46" or "Monday 02:29"
        const parts = checkpoint.time.split(' ');
        const dayName = parts[0];
        const timeStr = parts[parts.length - 1];
        const [hours, minutes] = timeStr.split(':').map(Number);
        
        // Event starts on Sunday August 3, 2025
        const eventStartDate = new Date('2025-08-03');
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const eventDayIndex = eventStartDate.getDay();
        const checkpointDayIndex = dayNames.indexOf(dayName);
        
        if (checkpointDayIndex >= 0) {
          let dayOffset = checkpointDayIndex - eventDayIndex;
          if (dayOffset < 0) dayOffset += 7;
          
          timestamp = new Date(eventStartDate);
          timestamp.setDate(timestamp.getDate() + dayOffset);
          timestamp.setHours(hours, minutes, 0, 0);
        }
      }
      
      return { rider, checkpoint, timestamp };
    }).filter((item): item is RiderWithTimestamp => item !== null && item.timestamp !== null);
    
    // Sort by actual timestamp, most recent first
    return ridersWithParsedTimes
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime())
      .slice(0, 3);
  }, [ridersAtControl, control.name]);
  
  return (
    <div className="flex gap-1 sm:gap-4 relative">
      {/* Left side - Circle and Line */}
      <div className="flex flex-col items-center flex-shrink-0">
        {/* Circle with KM */}
        <div className={`
          w-10 h-10 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center z-10
          ${riderCount > 0 ? 'bg-primary text-primary-foreground' : 'bg-gray-200 text-gray-600'}
          ${isStart ? 'ring-2 sm:ring-4 ring-primary/20' : ''}
          transition-all duration-200
        `}>
          <span className="text-[9px] sm:text-xs font-bold">{isStart ? 'START' : `${writtleDistance}`}</span>
          {!isStart && <span className="text-[7px] sm:text-[10px]">km</span>}
        </div>
        
        {/* Connecting Line */}
        {!isLast && (
          <div className={`
            w-0.5 flex-1 mt-1 sm:mt-2
            ${riderCount > 0 ? 'bg-primary/30' : 'bg-gray-200'}
          `} style={{ minHeight: isExpanded ? 'auto' : '60px' }} />
        )}
      </div>

      {/* Right side - Control Card */}
      <Card className={`
        flex-1 mb-3 sm:mb-6 overflow-hidden cursor-pointer
        ${riderCount === 0 ? 'opacity-60' : ''}
        hover:shadow-md transition-all duration-200
      `}
      onClick={() => riderCount > 0 && onToggleExpansion()}
      >
        <CardHeader className="p-3 sm:pb-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 mb-1">
                <CardTitle className="text-base sm:text-lg font-semibold truncate">
                  {control.name}
                </CardTitle>
                {weather && <CompactWeatherDisplay weather={weather} />}
                {!isStart && (
                  <span className="hidden sm:inline text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                    +20km for London start
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {currentRiderCount > 0 && currentRiderCount !== riderCount ? (
                    <span>
                      <span className="sm:hidden">{currentRiderCount}/{riderCount}</span>
                      <span className="hidden sm:inline">{currentRiderCount} here • {riderCount} total</span>
                    </span>
                  ) : (
                    <span>{riderCount} <span className="hidden sm:inline">{riderCount === 1 ? 'rider' : 'riders'}</span></span>
                  )}
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">{control.leg} Leg</span>
              </div>
            </div>
            <div className="flex items-center ml-2">
              {riderCount > 0 && (
                isExpanded ? <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" /> : <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </div>
          </div>
          
          {/* Latest arrivals preview */}
          {!isExpanded && riderCount > 0 && latestArrivals.length > 0 && (
            <div className="mt-2 text-[10px] sm:text-xs text-muted-foreground">
              <div className="flex items-center gap-1 sm:gap-2">
                <Activity className="h-3 w-3" />
                <span>Latest arrivals:</span>
              </div>
              <div className="ml-3 sm:ml-5 mt-1 space-y-0.5">
                {latestArrivals.map(({ rider, checkpoint }) => {
                  const timeAgo = calculateTimeAgo(checkpoint.time);
                  return (
                    <div key={rider.rider_no} className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <span className="font-medium">{rider.name.split(' ')[0]}</span>
                      <span className="text-muted-foreground">
                        • {checkpoint.time}
                        {timeAgo && <span className="text-[9px] sm:text-xs ml-1">({timeAgo})</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardHeader>
        
        {isExpanded && riderCount > 0 && (
          <CardContent className="pt-0 pb-2 sm:pb-3 px-2 sm:px-6">
            {weather && (
              <div className="mb-3">
                <ExtendedWeatherDisplay weather={weather} />
              </div>
            )}
            
            <div className="mb-2 sm:mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleShowAll();
                }}
                className="text-xs h-7 w-full sm:w-auto"
              >
                {showAllRiders ? 'Show only at this control' : 'Show all riders'}
              </Button>
            </div>
            
            <RiderList
              riders={showAllRiders ? allRiders : ridersAtControl}
              control={control}
              searchTerm={searchTerm}
              onSearch={onSearch}
              selectedRiderId={selectedRiderId}
              onSelectRider={onSelectRider}
              showAllRiders={showAllRiders}
            />
          </CardContent>
        )}
      </Card>
    </div>
  );
};