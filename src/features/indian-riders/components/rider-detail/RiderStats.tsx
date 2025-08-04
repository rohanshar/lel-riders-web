import React, { useMemo } from 'react';
import { MapPin, TrendingUp, Activity, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Rider } from '../../types';
import { calculateRiderDistance, calculateAverageSpeed, shouldBeMarkedDNF, calculateTimeAgo } from '../../utils/riderCalculations';
import { formatElapsedTime, formatExpectedArrival } from '../../utils/timeFormatters';
import { getControlsForRider, getTotalDistanceForRider } from '@/config/lel-route';

interface RiderStatsProps {
  rider: Rider;
  allRiders: Rider[];
}

interface RiderWithElapsed {
  rider: Rider;
  elapsedMinutes: number;
}

export const RiderStats: React.FC<RiderStatsProps> = ({ rider, allRiders }) => {
  // Calculate current stats
  const currentDistance = calculateRiderDistance(rider);
  const averageSpeed = calculateAverageSpeed(rider);
  const isDNF = shouldBeMarkedDNF(rider);
  const totalDistance = getTotalDistanceForRider(rider.rider_no);
  const progressPercentage = (currentDistance / totalDistance) * 100;
  
  // Calculate overall rank
  const overallRank = useMemo(() => {
    if (rider.status === 'not_started' || rider.checkpoints.length <= 1) return null;
    
    // Get all riders who reached at least the same checkpoint
    const ridersAtSameOrBeyond = allRiders.filter((r: Rider) => {
      const riderDistance = calculateRiderDistance(r);
      const selectedRiderDistance = calculateRiderDistance(rider);
      return riderDistance >= selectedRiderDistance && r.checkpoints.length > 1;
    });
    
    // Calculate elapsed time for each rider
    const ridersWithElapsedTime = ridersAtSameOrBeyond.map((r: Rider): RiderWithElapsed => {
      const riderStartCheckpoint = r.checkpoints[0];
      const riderLastCheckpoint = r.checkpoints[r.checkpoints.length - 1];
      
      const parseTime = (timeStr: string): number => {
        const parts = timeStr.split(' ');
        const time = parts[parts.length - 1];
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
      };
      
      const riderStartMinutes = parseTime(riderStartCheckpoint.time);
      const riderLastMinutes = parseTime(riderLastCheckpoint.time);
      let riderElapsedMinutes = riderLastMinutes - riderStartMinutes;
      
      if (riderElapsedMinutes < 0) {
        riderElapsedMinutes += 24 * 60;
      }
      
      return {
        rider: r,
        elapsedMinutes: riderElapsedMinutes
      };
    }).filter((item: RiderWithElapsed) => item.elapsedMinutes > 0);
    
    // Sort by elapsed time
    ridersWithElapsedTime.sort((a, b) => a.elapsedMinutes - b.elapsedMinutes);
    
    const rank = ridersWithElapsedTime.findIndex(
      (item: RiderWithElapsed) => item.rider.rider_no === rider.rider_no
    ) + 1;
    
    return rank > 0 ? { rank, total: ridersWithElapsedTime.length } : null;
  }, [rider, allRiders]);
  
  // Calculate expected arrival at next control
  const nextControlInfo = useMemo(() => {
    if (rider.status !== 'in_progress' || averageSpeed === 0) return null;
    
    const controls = getControlsForRider(rider.rider_no);
    
    // Find the next control
    let nextControl = null;
    for (const control of controls) {
      if (control.km > currentDistance) {
        nextControl = control;
        break;
      }
    }
    
    if (!nextControl || rider.checkpoints.length === 0) return null;
    
    const distanceToNext = nextControl.km - currentDistance;
    const hoursToNext = distanceToNext / averageSpeed;
    
    // Get the last checkpoint arrival time
    const lastCheckpoint = rider.checkpoints[rider.checkpoints.length - 1];
    const { ukTime, istTime } = formatExpectedArrival(lastCheckpoint.time, hoursToNext);
    
    return {
      control: nextControl,
      distanceToNext,
      expectedTime: { ukTime, istTime },
      hoursToNext
    };
  }, [rider, currentDistance, averageSpeed]);
  
  // Get time at last checkpoint for DNF explanation
  const lastCheckpointTime = rider.checkpoints.length > 0 
    ? calculateTimeAgo(rider.checkpoints[rider.checkpoints.length - 1].time)
    : null;

  return (
    <div>
      {isDNF && lastCheckpointTime && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 mb-1">DNF Status Explanation</h4>
              <p className="text-sm text-red-800 mb-2">
                This rider has been marked as DNF because their last checkpoint update was <strong>{lastCheckpointTime}</strong> at <strong>{rider.last_checkpoint || 'Unknown'}</strong>.
              </p>
              <p className="text-sm text-red-800 mb-2">
                Riders are automatically marked as DNF when no checkpoint update is received for more than 12 hours.
              </p>
              <p className="text-sm text-green-700 font-medium">
                ✓ The rider will be automatically marked as active again when they check in at the next control.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <h3 className="text-lg font-semibold mb-3">Current Status</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-600" />
          <span>Current Location: <strong>{rider.current_checkpoint || rider.last_checkpoint || 'Start'}</strong></span>
        </div>
        
        {overallRank && (
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-600" />
            <span>Overall Rank: <strong>#{overallRank.rank}</strong> out of {overallRank.total} active riders</span>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-gray-600" />
          <span>Distance Covered: <strong>{currentDistance} km</strong> ({progressPercentage.toFixed(1)}%)</span>
        </div>
        
        {averageSpeed > 0 && !isDNF && (
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-gray-600" />
            <span>Average Speed: <strong>{averageSpeed.toFixed(1)} km/h</strong></span>
          </div>
        )}
        
        {nextControlInfo && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold mb-2">Expected Next Arrival</h4>
            <div className="space-y-2 text-sm">
              <p>Next Control: <strong>{nextControlInfo.control.name}</strong> ({nextControlInfo.distanceToNext} km away)</p>
              <p>Expected Arrival: <strong>{nextControlInfo.expectedTime.ukTime}</strong></p>
              <p className="text-xs text-gray-600">{nextControlInfo.expectedTime.istTime}</p>
              <p className="text-xs text-gray-600">Travel time: ~{formatElapsedTime(nextControlInfo.hoursToNext * 60)}</p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">Total Distance</div>
            <div className="font-semibold">{totalDistance} km</div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">Remaining</div>
            <div className="font-semibold">{totalDistance - currentDistance} km</div>
          </div>
        </div>
      </div>
    </div>
  );
};