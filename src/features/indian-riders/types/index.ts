export * from './weather';

// Checkpoint type
export interface Checkpoint {
  name: string;
  time: string;
  km?: number;
}

// Tracking Rider type specific to Indian riders tracking
export interface TrackingRider {
  rider_no: string;
  name: string;
  status: 'not_started' | 'in_progress' | 'finished' | 'dnf';
  checkpoints: Checkpoint[];
  distance_km: number;
  last_checkpoint: string | null;
  current_checkpoint?: string;
  elapsed_time?: number;
  average_speed?: number;
  estimated_distance?: number;
}

// Alias for compatibility
export type Rider = TrackingRider;