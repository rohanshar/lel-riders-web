import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Rider, Checkpoint } from '../../types';
import type { Control } from '../../types/weather';
import { RiderListItem } from './RiderListItem';
import { 
  calculateElapsedTime,
  formatElapsedTime,
} from '@/config/lel-route';
import { calculateRiderDistance, shouldBeMarkedDNF } from '../../utils/riderCalculations';

interface RiderListProps {
  riders: Rider[];
  control: Control;
  searchTerm: string;
  onSearch: (term: string) => void;
  selectedRiderId: string | null;
  onSelectRider: (riderId: string | null) => void;
  showAllRiders: boolean;
}

interface RiderWithElapsedTime {
  rider: Rider;
  checkpoint: Checkpoint | undefined;
  elapsedMinutes: number;
  elapsedFormatted: string;
  hasProgressedBeyond?: boolean;
  averageSpeed?: number;
  isDNF?: boolean;
  rank?: number;
}

export const RiderList: React.FC<RiderListProps> = ({
  riders,
  control,
  searchTerm,
  onSearch,
  selectedRiderId,
  onSelectRider,
  showAllRiders
}) => {
  const [sortBy, setSortBy] = useState<'arrival' | 'rank'>('rank');
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  
  const isStart = control.name === 'Start' || control.name === 'Writtle' || control.name === 'London';
  
  // Process riders with elapsed time
  const processedRiders = useMemo(() => {
    const ridersWithElapsedTime = riders.map((rider: Rider): RiderWithElapsedTime => {
      const checkpoint = rider.checkpoints.find(cp => {
        if (isStart) {
          return cp.name === 'Start' || 
                 cp.name === 'Writtle' || 
                 cp.name === 'London' ||
                 cp.name.includes('Start');
        }
        return cp.name === control.name || 
               cp.name.includes(control.name);
      });
      
      // Check if rider has progressed beyond this control
      const currentControlIndex = rider.checkpoints.findIndex(cp => {
        if (isStart) {
          return cp.name === 'Start' || cp.name === 'Writtle' || cp.name === 'London';
        }
        return cp.name === control.name || cp.name.includes(control.name);
      });
      const hasProgressedBeyond = currentControlIndex >= 0 && currentControlIndex < rider.checkpoints.length - 1;
      
      // Calculate elapsed time directly
      let elapsedMinutes = 0;
      let elapsedFormatted = '';
      let averageSpeed = 0;
      
      if (checkpoint) {
        // For start checkpoint, elapsed time is 0
        if (isStart) {
          elapsedMinutes = 0;
          elapsedFormatted = '0m';
        } else {
          // Calculate elapsed time from wave start
          const elapsed = calculateElapsedTime(rider.rider_no, checkpoint.time);
          if (elapsed !== null && elapsed > 0) {
            elapsedMinutes = elapsed;
            elapsedFormatted = formatElapsedTime(elapsed);
            
            // Calculate average speed
            const distance = calculateRiderDistance(rider);
            if (distance > 0 && elapsedMinutes > 0) {
              averageSpeed = (distance / elapsedMinutes) * 60; // km/h
            }
          }
        }
      }
      
      // Check if rider is DNF
      const isDNF = shouldBeMarkedDNF(rider);
      
      return {
        rider,
        checkpoint,
        elapsedMinutes,
        elapsedFormatted,
        hasProgressedBeyond,
        averageSpeed,
        isDNF
      };
    }).filter((item: RiderWithElapsedTime) => item.checkpoint);
    
    // Sort first (before filtering) to establish ranks
    let sortedRiders = [...ridersWithElapsedTime];
    if (sortBy === 'arrival') {
      // Sort by arrival time (latest first)
      sortedRiders.sort((a, b) => {
        const aTime = a.checkpoint?.time || '';
        const bTime = b.checkpoint?.time || '';
        return bTime.localeCompare(aTime);
      });
    } else {
      // Sort by elapsed time (fastest first), filtering out invalid times
      sortedRiders.sort((a, b) => {
        // Put riders with valid times first
        if (a.elapsedMinutes <= 0 && b.elapsedMinutes > 0) return 1;
        if (a.elapsedMinutes > 0 && b.elapsedMinutes <= 0) return -1;
        return a.elapsedMinutes - b.elapsedMinutes;
      });
    }
    
    // Add rank numbers to all riders
    const rankedRiders = sortedRiders.map((item, index) => ({
      ...item,
      rank: sortBy === 'rank' && !item.isDNF ? index + 1 : undefined
    }));
    
    // Now filter based on view mode
    let displayRiders = showAllRiders 
      ? rankedRiders 
      : rankedRiders.filter((item: RiderWithElapsedTime) => !item.hasProgressedBeyond);
    
    // Apply search filter
    if (localSearchTerm) {
      displayRiders = displayRiders.filter(({ rider }) => 
        rider.name.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
        rider.rider_no.toLowerCase().includes(localSearchTerm.toLowerCase())
      );
    }
    
    return displayRiders;
  }, [riders, control, isStart, showAllRiders, localSearchTerm, sortBy]);
  
  const hiddenCount = riders.filter(r => {
    const hasCheckpoint = r.checkpoints.some(cp => {
      if (isStart) {
        return cp.name === 'Start' || cp.name === 'Writtle' || cp.name === 'London';
      }
      return cp.name === control.name || cp.name.includes(control.name);
    });
    return hasCheckpoint;
  }).length - processedRiders.length;
  
  return (
    <div className="space-y-1.5 sm:space-y-3">
      <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search riders..."
            value={localSearchTerm}
            onChange={(e) => {
              setLocalSearchTerm(e.target.value);
              onSearch(e.target.value);
            }}
            onClick={(e) => e.stopPropagation()}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSortBy(prev => prev === 'arrival' ? 'rank' : 'arrival');
          }}
          className="text-xs h-8 px-3 whitespace-nowrap"
        >
          <span className="hidden sm:inline">Sort: </span>{sortBy === 'arrival' ? 'Arrival ↓' : 'Rank'}
        </Button>
      </div>
      
      {!showAllRiders && hiddenCount > 0 && (
        <div className="text-center py-2 text-xs text-muted-foreground border-b">
          <span className="font-medium">{hiddenCount} {hiddenCount === 1 ? 'rider has' : 'riders have'}</span> reached the next control
        </div>
      )}
      
      <div className="space-y-0.5 sm:space-y-1">
        {processedRiders.map((item) => (
          <RiderListItem
            key={item.rider.rider_no}
            {...item}
            isSelected={item.rider.rider_no === selectedRiderId}
            onSelect={() => onSelectRider(item.rider.rider_no)}
            sortMode={sortBy}
          />
        ))}
      </div>
    </div>
  );
};