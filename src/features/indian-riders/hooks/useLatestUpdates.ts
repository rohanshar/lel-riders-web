import { useMemo } from 'react';
import type { Rider } from '../types';

export interface LatestUpdate {
  riderName: string;
  riderNo: string;
  checkpoint: string;
  time: string;
  timestamp: Date;
  minutesAgo: number;
}

export const useLatestUpdates = (riders: Rider[]): LatestUpdate[] => {
  return useMemo(() => {
    if (!riders || riders.length === 0) return [];

    const updates: LatestUpdate[] = [];

    // Event starts on Sunday August 3, 2025
    const eventStartDate = new Date('2025-08-03');
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Collect all checkpoint arrivals with timestamps
    riders.forEach((rider: Rider) => {
      // Get only the last checkpoint for each rider (most recent update)
      if (rider.checkpoints.length > 0) {
        const lastCheckpoint = rider.checkpoints[rider.checkpoints.length - 1];
        
        if (lastCheckpoint.time) {
          // Parse the checkpoint time
          // Get current London time for comparison
          const now = new Date();
          const londonTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/London"}));
          let checkpointDate: Date;
          
          if (lastCheckpoint.time.includes('/')) {
            // Format: "3/8 19:32"
            const [date, time] = lastCheckpoint.time.split(' ');
            const [day, month] = date.split('/');
            const [hours, minutes] = time.split(':');
            checkpointDate = new Date(2025, parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
          } else {
            // Format: "Sunday 08:46" or "Monday 02:29"
            const parts = lastCheckpoint.time.split(' ');
            const dayName = parts[0];
            const timeStr = parts[parts.length - 1];
            const [hours, minutes] = timeStr.split(':').map(Number);
            
            const eventDayIndex = eventStartDate.getDay();
            const checkpointDayIndex = dayNames.indexOf(dayName);
            
            if (checkpointDayIndex >= 0) {
              let dayOffset = checkpointDayIndex - eventDayIndex;
              if (dayOffset < 0) dayOffset += 7;
              
              checkpointDate = new Date(eventStartDate);
              checkpointDate.setDate(checkpointDate.getDate() + dayOffset);
              checkpointDate.setHours(hours, minutes, 0, 0);
            } else {
              return; // Skip if we can't parse the date
            }
          }
          
          const minutesAgo = Math.floor((londonTime.getTime() - checkpointDate.getTime()) / (1000 * 60));
          
          // Only include updates from the last 24 hours
          if (minutesAgo >= 0 && minutesAgo < 24 * 60) {
            updates.push({
              riderName: rider.name,
              riderNo: rider.rider_no,
              checkpoint: lastCheckpoint.name,
              time: lastCheckpoint.time,
              timestamp: checkpointDate,
              minutesAgo
            });
          }
        }
      }
    });

    // Sort by most recent first
    updates.sort((a, b) => a.minutesAgo - b.minutesAgo);

    // Return top 10 most recent updates
    return updates.slice(0, 10);
  }, [riders]);
};