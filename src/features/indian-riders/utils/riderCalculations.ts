import type { Rider } from '../types';
import { isLondonStartRider, getControlsForRider } from '@/config/lel-route';

export const calculateRiderDistance = (rider: Rider): number => {
  if (!rider.checkpoints || rider.checkpoints.length === 0) {
    return 0;
  }
  
  const lastCheckpoint = rider.checkpoints[rider.checkpoints.length - 1];
  if (!lastCheckpoint) {
    return 0;
  }
  
  // Get the controls for this rider
  const controls = getControlsForRider(rider.rider_no);
  
  // Clean checkpoint name (remove direction suffixes like N, S, E, W)
  const cleanCheckpointName = lastCheckpoint.name.replace(/\s+[NSEW]$/, '');
  
  // Find the matching control
  const matchingControl = controls.find(control => 
    control.name === cleanCheckpointName ||
    control.name === lastCheckpoint.name ||
    lastCheckpoint.name.includes(control.name) ||
    control.name.includes(cleanCheckpointName)
  );
  
  if (matchingControl) {
    return matchingControl.km;
  }
  
  // If no match found, return 0
  return 0;
};

export const calculateAverageSpeed = (rider: Rider): number => {
  const currentDistance = calculateRiderDistance(rider);
  
  if (currentDistance === 0 || rider.checkpoints.length <= 1) {
    return 0;
  }
  
  // Get actual start time from first checkpoint
  const startCheckpoint = rider.checkpoints[0];
  const lastCheckpoint = rider.checkpoints[rider.checkpoints.length - 1];
  
  // Calculate elapsed time between actual start and last checkpoint
  const startTime = startCheckpoint.time;
  const lastTime = lastCheckpoint.time;
  
  // Parse times - both are in "Sunday HH:MM" format
  const parseTime = (timeStr: string): number => {
    const parts = timeStr.split(' ');
    const time = parts[parts.length - 1];
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const startMinutes = parseTime(startTime);
  const lastMinutes = parseTime(lastTime);
  let elapsedMinutes = lastMinutes - startMinutes;
  
  // Handle day boundary
  if (elapsedMinutes < 0) {
    elapsedMinutes += 24 * 60;
  }
  
  if (elapsedMinutes > 0) {
    return (currentDistance / elapsedMinutes) * 60; // km/h
  }
  
  return 0;
};

export const shouldBeMarkedDNF = (rider: Rider): boolean => {
  if (rider.status === 'dnf' || rider.status === 'finished') return rider.status === 'dnf';
  if (rider.checkpoints.length === 0) return false;
  
  const lastCheckpoint = rider.checkpoints[rider.checkpoints.length - 1];
  if (!lastCheckpoint.time) return false;
  
  // Get hours since last checkpoint
  const hoursSinceLastCheckpoint = getHoursSinceCheckpoint(lastCheckpoint.time);
  
  // Only mark as DNF if they've been at the same control for 16+ hours
  return hoursSinceLastCheckpoint >= 16;
};

export const getHoursSinceCheckpoint = (checkpointTime: string): number => {
  // ⚠️ CRITICAL: This function calculates hours since checkpoint in UK TIME ⚠️
  // All checkpoint times are UK times, calculations must use UK time
  
  if (!checkpointTime || checkpointTime === '-') return 0;
  
  try {
    // Get current time and format it properly
    const now = new Date();
    
    // Parse checkpoint time - format is "Sunday 13:45" or just "13:45"
    const parts = checkpointTime.split(' ');
    const timeStr = parts[parts.length - 1];
    const [checkpointHours, checkpointMinutes] = timeStr.split(':').map(Number);
    
    if (isNaN(checkpointHours) || isNaN(checkpointMinutes)) return 0;
    
    // Create two dates in UK timezone to compare
    // First, create a date for the checkpoint
    const eventStartDate = new Date('2025-08-03T00:00:00'); // Sunday Aug 3, 2025
    
    let checkpointDate: Date;
    
    if (parts.length > 1 && parts[0]) {
      // We have a day name like "Sunday 13:45"
      const dayName = parts[0];
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayIndex = daysOfWeek.indexOf(dayName);
      
      if (dayIndex !== -1) {
        // Calculate the actual date for this checkpoint
        checkpointDate = new Date(eventStartDate);
        checkpointDate.setDate(eventStartDate.getDate() + dayIndex);
        checkpointDate.setHours(checkpointHours, checkpointMinutes, 0, 0);
      } else {
        // Shouldn't happen, but fallback
        console.warn('Unknown day name in checkpoint time:', dayName);
        return 0;
      }
    } else {
      // No day name, just time - this shouldn't happen in LEL data
      console.warn('Checkpoint time without day name:', checkpointTime);
      return 0;
    }
    
    // Calculate difference in milliseconds
    const diffMs = now.getTime() - checkpointDate.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    
    // Return hours, but ensure it's not negative (shouldn't be possible, but just in case)
    return Math.max(0, hours);
  } catch (error) {
    console.error('Error calculating hours since checkpoint:', error, checkpointTime);
    return 0;
  }
};

export const calculateTimeAgo = (checkpointTime: string): string => {
  // ⚠️ CRITICAL TIMEZONE INFORMATION ⚠️
  // ALL checkpoint times in the JSON are in UK TIME (Europe/London)
  // The LEL event is in the UK, so ALL times are UK times
  
  if (!checkpointTime || checkpointTime === '-') return '';
  
  try {
    const hours = getHoursSinceCheckpoint(checkpointTime);
    const minutesAgo = Math.floor(hours * 60);
    
    if (minutesAgo < 0) return ''; // Future time
    if (minutesAgo < 60) {
      return `${minutesAgo}m ago`;
    } else if (minutesAgo < 24 * 60) {
      const hoursAgo = Math.floor(minutesAgo / 60);
      const minsAgo = minutesAgo % 60;
      return minsAgo > 0 ? `${hoursAgo}h ${minsAgo}m ago` : `${hoursAgo}h ago`;
    } else {
      const daysAgo = Math.floor(minutesAgo / (24 * 60));
      const hoursRemainder = Math.floor((minutesAgo % (24 * 60)) / 60);
      if (daysAgo === 1 && hoursRemainder === 0) {
        return '1 day ago';
      } else if (daysAgo === 1) {
        return `1 day ${hoursRemainder}h ago`;
      } else {
        return `${daysAgo} days ago`;
      }
    }
  } catch (error) {
    return '';
  }
};