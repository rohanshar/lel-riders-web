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
    // Parse checkpoint time directly (already in UK time)
    const parts = checkpointTime.split(' ');
    const timeStr = parts[parts.length - 1];
    const [checkpointHours, checkpointMinutes] = timeStr.split(':').map(Number);
    
    if (isNaN(checkpointHours) || isNaN(checkpointMinutes)) return 0;
    
    // ⚠️ Get current UK time properly ⚠️
    const ukTimeString = new Date().toLocaleString('en-US', { 
      timeZone: 'Europe/London',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    // Parse UK time string to get actual UK time
    const [datePart, timePart] = ukTimeString.split(', ');
    const [month, day, year] = datePart.split('/');
    const [hours, minutes] = timePart.split(':');
    const ukNow = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
    
    // For the LEL event starting Sunday Aug 3, 2025
    const eventStartDate = new Date('2025-08-03'); // Sunday
    
    let checkpointDate: Date;
    
    if (parts.length > 1 && parts[0]) {
      // We have a day name
      const dayName = parts[0];
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const checkpointDayIndex = daysOfWeek.indexOf(dayName);
      
      if (checkpointDayIndex !== -1) {
        checkpointDate = new Date(eventStartDate);
        checkpointDate.setDate(eventStartDate.getDate() + checkpointDayIndex);
        checkpointDate.setHours(checkpointHours, checkpointMinutes, 0, 0);
      } else {
        checkpointDate = new Date(ukNow);
        checkpointDate.setHours(checkpointHours, checkpointMinutes, 0, 0);
        if (checkpointDate > ukNow) {
          checkpointDate.setDate(checkpointDate.getDate() - 1);
        }
      }
    } else {
      checkpointDate = new Date(ukNow);
      checkpointDate.setHours(checkpointHours, checkpointMinutes, 0, 0);
      if (checkpointDate > ukNow) {
        checkpointDate.setDate(checkpointDate.getDate() - 1);
      }
    }
    
    const minutesAgo = Math.floor((ukNow.getTime() - checkpointDate.getTime()) / (1000 * 60));
    return minutesAgo / 60; // Return hours
  } catch (error) {
    console.error('Error calculating hours since checkpoint:', error);
    return 0;
  }
};

export const calculateTimeAgo = (checkpointTime: string): string => {
  // ⚠️ CRITICAL TIMEZONE INFORMATION ⚠️
  // ALL checkpoint times in the JSON are in UK TIME (Europe/London)
  // The LEL event is in the UK, so ALL times are UK times
  // DO NOT convert to IST or any other timezone!
  // This function MUST calculate "ago" times using UK time ONLY
  
  if (!checkpointTime || checkpointTime === '-') return '';
  
  try {
    // Parse checkpoint time - format is usually "Sunday 13:45" or "13:45"
    // These times are ALREADY in UK time
    const parts = checkpointTime.split(' ');
    const timeStr = parts[parts.length - 1];
    const [checkpointHours, checkpointMinutes] = timeStr.split(':').map(Number);
    
    if (isNaN(checkpointHours) || isNaN(checkpointMinutes)) return '';
    
    // ⚠️ IMPORTANT: Get current UK time properly ⚠️
    // We need the actual current time in UK timezone
    const ukTimeString = new Date().toLocaleString('en-US', { 
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
    const ukNow = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds));
    
    // For the LEL event starting Sunday Aug 3, 2025
    const eventStartDate = new Date('2025-08-03'); // Sunday
    
    let checkpointDate: Date;
    
    if (parts.length > 1 && parts[0]) {
      // We have a day name
      const dayName = parts[0];
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const checkpointDayIndex = daysOfWeek.indexOf(dayName);
      
      if (checkpointDayIndex !== -1) {
        // Calculate the actual date based on the day name
        // The event starts on Sunday (index 0)
        checkpointDate = new Date(eventStartDate);
        checkpointDate.setDate(eventStartDate.getDate() + checkpointDayIndex);
        checkpointDate.setHours(checkpointHours, checkpointMinutes, 0, 0);
      } else {
        // Fallback if day name not recognized
        checkpointDate = new Date(ukNow);
        checkpointDate.setHours(checkpointHours, checkpointMinutes, 0, 0);
        if (checkpointDate > ukNow) {
          checkpointDate.setDate(checkpointDate.getDate() - 1);
        }
      }
    } else {
      // No day name, assume today or yesterday
      checkpointDate = new Date(ukNow);
      checkpointDate.setHours(checkpointHours, checkpointMinutes, 0, 0);
      if (checkpointDate > ukNow) {
        checkpointDate.setDate(checkpointDate.getDate() - 1);
      }
    }
    
    const minutesAgo = Math.floor((ukNow.getTime() - checkpointDate.getTime()) / (1000 * 60));
    
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