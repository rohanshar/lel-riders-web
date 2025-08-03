/**
 * Time processing utilities for LEL event
 * Handles UK timezone conversions and time formatting
 */

/**
 * Get current UK time
 * @returns Current time in UK timezone
 */
export function getCurrentUKTime(): Date {
  // Create a date in UK timezone context
  const now = new Date();
  const ukFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });
  
  const parts = ukFormatter.formatToParts(now);
  const getPart = (type: string): number => {
    const part = parts.find(p => p.type === type);
    return part ? parseInt(part.value) : 0;
  };
  
  return new Date(
    getPart('year'),
    getPart('month') - 1, // JS months are 0-indexed
    getPart('day'),
    getPart('hour'),
    getPart('minute'),
    getPart('second')
  );
}

/**
 * Format UK time as string
 * @param date - Date to format
 * @returns Formatted string like "Sun, 3 Aug, 08:14:49"
 */
export function formatUKTime(date: Date): string {
  return date.toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * Format elapsed time from minutes
 * @param minutes - Elapsed time in minutes
 * @returns Formatted string like "2d 5h 30m" or "5h 30m"
 */
export function formatElapsedTime(minutes: number): string {
  if (minutes <= 0) return '0m';
  
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);
  
  return parts.join(' ');
}

/**
 * Format elapsed time as hours and minutes
 * @param minutes - Elapsed time in minutes
 * @returns Formatted string like "5h 30m"
 */
export function formatElapsedTimeShort(minutes: number): string {
  if (minutes <= 0) return '0h 0m';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  return `${hours}h ${mins}m`;
}

/**
 * Calculate time difference in minutes
 * @param start - Start time
 * @param end - End time
 * @returns Difference in minutes
 */
export function getMinutesDifference(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / 1000 / 60);
}

/**
 * Parse checkpoint time string
 * @param timeStr - Time string like "Sunday 04:40"
 * @param eventStartDate - Event start date for context
 * @returns Parsed date or null
 */
export function parseCheckpointTimeString(timeStr: string, eventStartDate: Date): Date | null {
  const parts = timeStr.split(' ');
  if (parts.length < 2) return null;
  
  const dayName = parts[0];
  const timePart = parts[parts.length - 1];
  const [hours, minutes] = timePart.split(':').map(Number);
  
  if (isNaN(hours) || isNaN(minutes)) return null;
  
  // Map day names to day offsets from Sunday (event start)
  const dayOffsets: Record<string, number> = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };
  
  const dayOffset = dayOffsets[dayName] || 0;
  
  // Create date based on event start date
  const checkpointDate = new Date(eventStartDate);
  checkpointDate.setDate(checkpointDate.getDate() + dayOffset);
  checkpointDate.setHours(hours, minutes, 0, 0);
  
  return checkpointDate;
}

/**
 * Format a date as checkpoint time string
 * @param date - Date to format
 * @returns String like "Sunday 04:40"
 */
export function formatCheckpointTime(date: Date): string {
  const dayName = date.toLocaleDateString('en-GB', { 
    weekday: 'long',
    timeZone: 'Europe/London'
  });
  
  const time = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/London'
  });
  
  return `${dayName} ${time}`;
}

/**
 * Get event start date (Sunday, August 3, 2025)
 * @returns Event start date
 */
export function getEventStartDate(): Date {
  // LEL 2025 starts on Sunday, August 3, 2025
  return new Date(2025, 7, 3, 0, 0, 0, 0); // August is month 7 (0-indexed)
}

/**
 * Check if a time is within the event window
 * @param date - Date to check
 * @returns True if within event window
 */
export function isWithinEventWindow(date: Date): boolean {
  const eventStart = getEventStartDate();
  const eventEnd = new Date(eventStart);
  eventEnd.setDate(eventEnd.getDate() + 5); // 5-day event
  
  return date >= eventStart && date <= eventEnd;
}

/**
 * Calculate estimated arrival time
 * @param currentDistance - Current distance in km
 * @param targetDistance - Target distance in km
 * @param averageSpeed - Average speed in km/h
 * @returns Estimated arrival date or null
 */
export function calculateEstimatedArrival(
  currentDistance: number,
  targetDistance: number,
  averageSpeed: number
): Date | null {
  if (currentDistance >= targetDistance || averageSpeed <= 0) return null;
  
  const remainingDistance = targetDistance - currentDistance;
  const hoursToArrival = remainingDistance / averageSpeed;
  
  const arrivalTime = new Date();
  arrivalTime.setHours(arrivalTime.getHours() + Math.floor(hoursToArrival));
  arrivalTime.setMinutes(arrivalTime.getMinutes() + Math.floor((hoursToArrival % 1) * 60));
  
  return arrivalTime;
}

/**
 * Format duration in hours
 * @param hours - Duration in hours
 * @returns Formatted string like "125.5 hours"
 */
export function formatHours(hours: number): string {
  return `${hours.toFixed(1)} hours`;
}

/**
 * Get time of day description
 * @param date - Date to describe
 * @returns Description like "Early Morning", "Afternoon", etc.
 */
export function getTimeOfDayDescription(date: Date): string {
  const hour = date.getHours();
  
  if (hour >= 5 && hour < 8) return 'Early Morning';
  if (hour >= 8 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  if (hour >= 21 || hour < 5) return 'Night';
  
  return 'Unknown';
}