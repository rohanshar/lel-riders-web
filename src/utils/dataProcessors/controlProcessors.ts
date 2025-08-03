import { TrackingRider } from './trackingProcessors';
import { getControlsForRider } from '../../config/lel-route';

/**
 * Control point data from route
 */
export interface Control {
  id: string;
  name: string;
  km: number;
  leg: 'North' | 'South';
}

/**
 * Control point with rider progress
 */
export interface ControlProgress {
  control: Control;
  ridersReached: TrackingRider[];
  ridersApproaching: TrackingRider[];
  averageTimeToReach: number; // minutes
  fastestTime: number; // minutes
  slowestTime: number; // minutes
}

/**
 * Control statistics
 */
export interface ControlStatistics {
  totalRiders: number;
  ridersReached: number;
  percentageReached: number;
  averageSpeed: number;
}

/**
 * Check if a rider has reached a specific control
 * @param rider - Tracking rider
 * @param controlName - Control point name
 * @returns True if rider has reached the control
 */
export function hasReachedControl(rider: TrackingRider, controlName: string): boolean {
  // Special handling for start points
  if (controlName === 'Start' || controlName === 'Writtle' || controlName === 'London') {
    return rider.checkpoints.some(cp => 
      cp.name === 'Start' || 
      cp.name === 'Writtle' || 
      cp.name === 'London' ||
      cp.name.toLowerCase().includes('start')
    );
  }
  
  return rider.checkpoints.some(cp => 
    cp.name === controlName || 
    cp.name.includes(controlName)
  );
}

/**
 * Get time taken to reach a control
 * @param rider - Tracking rider
 * @param controlName - Control point name
 * @returns Time in minutes or null
 */
export function getTimeToControl(rider: TrackingRider, controlName: string): number | null {
  const checkpoint = rider.checkpoints.find(cp => {
    if (controlName === 'Start' || controlName === 'Writtle' || controlName === 'London') {
      return cp.name === 'Start' || 
             cp.name === 'Writtle' || 
             cp.name === 'London' ||
             cp.name.toLowerCase().includes('start');
    }
    return cp.name === controlName || cp.name.includes(controlName);
  });
  
  if (!checkpoint) return null;
  
  // For start checkpoint, time is 0
  if (controlName === 'Start' || checkpoint.name === 'Start') return 0;
  
  // Calculate time from start
  if (rider.checkpoints.length > 0) {
    const startCheckpoint = rider.checkpoints[0];
    const checkpointIndex = rider.checkpoints.indexOf(checkpoint);
    
    // Rough estimation: use elapsed time proportionally
    if (rider.elapsedMinutes > 0 && checkpointIndex > 0) {
      return Math.floor(rider.elapsedMinutes * (checkpointIndex / rider.checkpoints.length));
    }
  }
  
  return null;
}

/**
 * Determine if a rider is approaching a control
 * @param rider - Tracking rider
 * @param control - Control point
 * @param thresholdKm - Distance threshold in km (default 50km)
 * @returns True if rider is approaching
 */
export function isApproachingControl(
  rider: TrackingRider, 
  control: Control, 
  thresholdKm: number = 50
): boolean {
  // Can't be approaching if already reached
  if (hasReachedControl(rider, control.name)) return false;
  
  // Not approaching if not started
  if (rider.status === 'not_started') return false;
  
  // Check if within threshold distance
  const distanceToControl = control.km - rider.distanceCovered;
  return distanceToControl > 0 && distanceToControl <= thresholdKm;
}

/**
 * Process control progress for all riders
 * @param controls - List of control points
 * @param riders - List of tracking riders
 * @returns Map of control progress
 */
export function processControlProgress(
  controls: Control[],
  riders: TrackingRider[]
): Map<string, ControlProgress> {
  const progressMap = new Map<string, ControlProgress>();
  
  // Merge Writtle and London into Start for processing
  const processedControls = controls.reduce((acc, control) => {
    if (control.name === 'London') return acc;
    if (control.name === 'Writtle') {
      return [...acc, { ...control, name: 'Start', id: 'start', km: 0 }];
    }
    return [...acc, control];
  }, [] as Control[]);
  
  processedControls.forEach(control => {
    const ridersReached: TrackingRider[] = [];
    const ridersApproaching: TrackingRider[] = [];
    const timesToReach: number[] = [];
    
    riders.forEach(rider => {
      if (hasReachedControl(rider, control.name)) {
        ridersReached.push(rider);
        const time = getTimeToControl(rider, control.name);
        if (time !== null) {
          timesToReach.push(time);
        }
      } else if (isApproachingControl(rider, control)) {
        ridersApproaching.push(rider);
      }
    });
    
    // Calculate time statistics
    let averageTimeToReach = 0;
    let fastestTime = 0;
    let slowestTime = 0;
    
    if (timesToReach.length > 0) {
      averageTimeToReach = timesToReach.reduce((a, b) => a + b, 0) / timesToReach.length;
      fastestTime = Math.min(...timesToReach);
      slowestTime = Math.max(...timesToReach);
    }
    
    progressMap.set(control.id, {
      control,
      ridersReached,
      ridersApproaching,
      averageTimeToReach,
      fastestTime,
      slowestTime
    });
  });
  
  return progressMap;
}

/**
 * Get control statistics
 * @param controlProgress - Control progress data
 * @param totalRiders - Total number of riders
 * @returns Control statistics
 */
export function getControlStatistics(
  controlProgress: ControlProgress,
  totalRiders: number
): ControlStatistics {
  const ridersReached = controlProgress.ridersReached.length;
  const percentageReached = totalRiders > 0 ? (ridersReached / totalRiders) * 100 : 0;
  
  // Calculate average speed to this control
  let totalSpeed = 0;
  let ridersWithSpeed = 0;
  
  controlProgress.ridersReached.forEach(rider => {
    if (rider.averageSpeed > 0) {
      totalSpeed += rider.averageSpeed;
      ridersWithSpeed++;
    }
  });
  
  const averageSpeed = ridersWithSpeed > 0 ? totalSpeed / ridersWithSpeed : 0;
  
  return {
    totalRiders,
    ridersReached,
    percentageReached,
    averageSpeed
  };
}

/**
 * Get next control for a rider
 * @param rider - Tracking rider
 * @param controls - List of controls for rider's route
 * @returns Next control or null
 */
export function getNextControl(rider: TrackingRider, controls: Control[]): Control | null {
  // Get controls for this rider's route
  const riderControls = getControlsForRider(rider.rider_no);
  
  // Find the last reached control
  let lastReachedIndex = -1;
  for (let i = riderControls.length - 1; i >= 0; i--) {
    if (hasReachedControl(rider, riderControls[i].name)) {
      lastReachedIndex = i;
      break;
    }
  }
  
  // Return next control if available
  if (lastReachedIndex < riderControls.length - 1) {
    const nextControlName = riderControls[lastReachedIndex + 1].name;
    return controls.find(c => c.name === nextControlName) || null;
  }
  
  return null;
}

/**
 * Sort control progress by various criteria
 */
export const controlSorters = {
  byDistance: (a: ControlProgress, b: ControlProgress) => 
    a.control.km - b.control.km,
  
  byRidersReached: (a: ControlProgress, b: ControlProgress) => 
    b.ridersReached.length - a.ridersReached.length,
  
  byRidersApproaching: (a: ControlProgress, b: ControlProgress) => 
    b.ridersApproaching.length - a.ridersApproaching.length,
  
  byAverageTime: (a: ControlProgress, b: ControlProgress) => 
    a.averageTimeToReach - b.averageTimeToReach
};