import { EnhancedRider } from './riderProcessors';
import { getCheckpointDistance, getTotalDistanceForRider, getWaveStartTime } from '../../config/lel-route';

/**
 * Checkpoint record with timestamp
 */
export interface CheckpointRecord {
  name: string;
  time: string;
  distance_km: number;
}

/**
 * Rider status types
 */
export type RiderStatus = 'not_started' | 'in_progress' | 'finished' | 'dnf';

/**
 * Tracking rider with real-time data
 */
export interface TrackingRider extends EnhancedRider {
  status: RiderStatus;
  checkpoints: CheckpointRecord[];
  currentLocation: string;
  lastCheckpoint: string | null;
  distanceCovered: number;
  estimatedDistance: number;
  elapsedMinutes: number;
  averageSpeed: number;
  progress: number;
}

/**
 * Raw tracking data from API
 */
export interface RawTrackingRider {
  rider_no: string;
  name: string;
  status: RiderStatus;
  checkpoints: Array<{ name: string; time: string }>;
  distance_km: number;
  last_checkpoint: string | null;
}

/**
 * Calculate actual distance covered by a rider
 * @param rider - Raw tracking rider data
 * @returns Actual distance in km
 */
export function calculateActualDistance(rider: RawTrackingRider): number {
  // If distance is provided and valid, use it
  if (rider.distance_km > 0) {
    return rider.distance_km;
  }
  
  // Otherwise, calculate from last checkpoint
  if (rider.last_checkpoint) {
    const checkpointDistance = getCheckpointDistance(rider.last_checkpoint, rider.rider_no);
    if (checkpointDistance > 0) {
      return checkpointDistance;
    }
  }
  
  return 0;
}

/**
 * Calculate elapsed time in minutes
 * @param rider - Raw tracking rider data
 * @param currentTime - Current time in UK timezone
 * @returns Elapsed time in minutes
 */
export function calculateElapsedTime(rider: RawTrackingRider, currentTime: Date): number {
  if (rider.status === 'not_started') return 0;
  
  // Get start time from first checkpoint or wave start time
  let startTimeStr: string;
  if (rider.checkpoints.length > 0) {
    startTimeStr = rider.checkpoints[0].time;
  } else if (rider.status === 'in_progress') {
    // Use wave start time if in progress but no checkpoints yet
    const waveStartTime = getWaveStartTime(rider.rider_no);
    startTimeStr = `Sunday ${waveStartTime}`;
  } else {
    return 0;
  }
  
  // Parse the checkpoint time (format: "Sunday 04:40")
  const startTime = parseCheckpointTime(startTimeStr, currentTime);
  if (!startTime) return 0;
  
  const elapsedMs = currentTime.getTime() - startTime.getTime();
  return Math.max(0, Math.floor(elapsedMs / 1000 / 60)); // Convert to minutes
}

/**
 * Parse checkpoint time string to Date
 * @param timeStr - Time string like "Sunday 04:40"
 * @param referenceDate - Reference date for context
 * @returns Parsed date or null
 */
export function parseCheckpointTime(timeStr: string, referenceDate: Date): Date | null {
  const parts = timeStr.split(' ');
  if (parts.length < 2) return null;
  
  const timePart = parts[parts.length - 1];
  const [hours, minutes] = timePart.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;
  
  // Create date in UK timezone context
  const checkpointDate = new Date(referenceDate);
  checkpointDate.setHours(hours, minutes, 0, 0);
  
  // If checkpoint time is in the future, it was from the previous day
  if (checkpointDate > referenceDate) {
    checkpointDate.setDate(checkpointDate.getDate() - 1);
  }
  
  return checkpointDate;
}

/**
 * Calculate estimated distance based on elapsed time
 * @param actualDistance - Known distance covered
 * @param elapsedMinutes - Time elapsed in minutes
 * @param lastCheckpointTime - Time of last checkpoint
 * @param currentTime - Current time
 * @returns Estimated distance in km
 */
export function calculateEstimatedDistance(
  actualDistance: number,
  elapsedMinutes: number,
  lastCheckpointTime: string | null,
  currentTime: Date
): number {
  if (elapsedMinutes <= 0) return actualDistance;
  
  // If we have actual distance and a recent checkpoint
  if (actualDistance > 0 && lastCheckpointTime) {
    const lastTime = parseCheckpointTime(lastCheckpointTime, currentTime);
    if (lastTime) {
      const timeSinceLastCheckpoint = (currentTime.getTime() - lastTime.getTime()) / 1000 / 60;
      // Estimate at 18 km/h since last checkpoint
      const additionalDistance = Math.min(18 * (timeSinceLastCheckpoint / 60), 200);
      return actualDistance + additionalDistance;
    }
  }
  
  // If no distance recorded yet, estimate from start at 18 km/h
  if (actualDistance === 0) {
    return Math.min(18 * (elapsedMinutes / 60), 200);
  }
  
  return actualDistance;
}

/**
 * Calculate average speed
 * @param distance - Distance covered in km
 * @param elapsedMinutes - Time elapsed in minutes
 * @returns Average speed in km/h
 */
export function calculateAverageSpeed(distance: number, elapsedMinutes: number): number {
  if (distance <= 0 || elapsedMinutes <= 0) return 0;
  return distance / (elapsedMinutes / 60);
}

/**
 * Calculate progress percentage
 * @param distance - Distance covered
 * @param totalDistance - Total route distance
 * @returns Progress percentage (0-100)
 */
export function calculateProgress(distance: number, totalDistance: number): number {
  if (totalDistance <= 0) return 0;
  return Math.min((distance / totalDistance) * 100, 100);
}

/**
 * Determine current location from checkpoints
 * @param checkpoints - List of checkpoints
 * @param lastCheckpoint - Last checkpoint name
 * @returns Current location string
 */
export function determineCurrentLocation(
  checkpoints: Array<{ name: string; time: string }>,
  lastCheckpoint: string | null
): string {
  if (lastCheckpoint) return lastCheckpoint;
  if (checkpoints.length > 0) return checkpoints[checkpoints.length - 1].name;
  return 'Not Started';
}

/**
 * Enhance tracking data with calculated fields
 * @param rawRider - Raw tracking data
 * @param enhancedRider - Enhanced rider base data
 * @param currentTime - Current time for calculations
 * @returns Fully processed tracking rider
 */
export function processTrackingRider(
  rawRider: RawTrackingRider,
  enhancedRider: EnhancedRider,
  currentTime: Date
): TrackingRider {
  const actualDistance = calculateActualDistance(rawRider);
  const elapsedMinutes = calculateElapsedTime(rawRider, currentTime);
  
  // Get last checkpoint time for estimation
  const lastCheckpointTime = rawRider.checkpoints.length > 0
    ? rawRider.checkpoints[rawRider.checkpoints.length - 1].time
    : null;
  
  const estimatedDistance = calculateEstimatedDistance(
    actualDistance,
    elapsedMinutes,
    lastCheckpointTime,
    currentTime
  );
  
  const averageSpeed = calculateAverageSpeed(actualDistance, elapsedMinutes);
  const progress = calculateProgress(
    Math.max(actualDistance, estimatedDistance),
    enhancedRider.totalDistance
  );
  
  const currentLocation = determineCurrentLocation(
    rawRider.checkpoints,
    rawRider.last_checkpoint
  );
  
  // Enhance checkpoints with distances
  const checkpointsWithDistance: CheckpointRecord[] = rawRider.checkpoints.map(cp => ({
    ...cp,
    distance_km: getCheckpointDistance(cp.name, rawRider.rider_no)
  }));
  
  return {
    ...enhancedRider,
    status: rawRider.status,
    checkpoints: checkpointsWithDistance,
    currentLocation,
    lastCheckpoint: rawRider.last_checkpoint,
    distanceCovered: actualDistance,
    estimatedDistance,
    elapsedMinutes,
    averageSpeed,
    progress
  };
}

/**
 * Sort tracking riders by various criteria
 */
export const trackingSorters = {
  byDistance: (a: TrackingRider, b: TrackingRider) => 
    b.distanceCovered - a.distanceCovered,
  
  byProgress: (a: TrackingRider, b: TrackingRider) => 
    b.progress - a.progress,
  
  bySpeed: (a: TrackingRider, b: TrackingRider) => 
    b.averageSpeed - a.averageSpeed,
  
  byStatus: (a: TrackingRider, b: TrackingRider) => {
    const statusOrder: Record<RiderStatus, number> = {
      'in_progress': 0,
      'finished': 1,
      'not_started': 2,
      'dnf': 3
    };
    return statusOrder[a.status] - statusOrder[b.status];
  }
};