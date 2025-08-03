// Import and re-export base Rider type
import { Rider } from '../types';
export type { Rider };

// API Response types
export interface ApiResponse<T> {
  data: T;
  lastUpdated?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

// Enhanced Rider types
export interface RiderWithStatus extends Rider {
  status?: string;
  lastSeen?: string;
  checkpoint?: string;
  distance?: number;
  elapsedTime?: string;
}

export interface IndianRider extends RiderWithStatus {
  city?: string;
  state?: string;
  club?: string;
  emergencyContact?: string;
}

// Route types
export interface RoutePoint {
  lat: number;
  lng: number;
  name?: string;
  elevation?: number;
}

export interface RouteSegment {
  start: RoutePoint;
  end: RoutePoint;
  distance: number;
  profile?: string;
}

export interface Control {
  name: string;
  distance: number;
  location: RoutePoint;
  cutoffTime?: string;
  services?: string[];
}

export interface RouteData {
  controls: Control[];
  segments: RouteSegment[];
  totalDistance: number;
  totalElevationGain: number;
}

// Wave types
export interface Wave {
  code: string;
  riders: Rider[];
  startTime?: string;
  description?: string;
}

export interface WaveSummary {
  code: string;
  riderCount: number;
  countries: string[];
  startTime?: string;
}

