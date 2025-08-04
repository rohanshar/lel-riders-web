import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import type { Rider } from '../../types';
import { getControlsForRider, getWaveStartTime, calculateElapsedTime, formatElapsedTime } from '@/config/lel-route';
import { calculateTimeAgo } from '../../utils/riderCalculations';

interface CheckpointHistoryProps {
  rider: Rider;
}

interface CheckpointWithStats {
  checkpoint: any;
  index: number;
  elapsedMinutes: number;
  elapsedFormatted: string;
  rank: number | null;
  totalRidersAtCheckpoint: number;
  legTime: string;
  legSpeed: number;
  legDistance: number;
  isStartCheckpoint: boolean;
  timeAgo: string | null;
}

export const CheckpointHistory: React.FC<CheckpointHistoryProps> = ({ rider }) => {
  const controls = getControlsForRider(rider.rider_no);
  const waveStartTime = getWaveStartTime(rider.rider_no);
  
  const checkpointStats = useMemo(() => {
    return rider.checkpoints.map((checkpoint, index): CheckpointWithStats => {
      // Check if this is a start checkpoint
      const isStartCheckpoint = checkpoint.name === 'Start' || 
                              checkpoint.name === 'Writtle' || 
                              checkpoint.name === 'London' ||
                              checkpoint.name.includes('Start');
      
      // Calculate elapsed time
      let elapsedMinutes = 0;
      let elapsedFormatted = '';
      
      if (!isStartCheckpoint) {
        const elapsed = calculateElapsedTime(rider.rider_no, checkpoint.time);
        if (elapsed !== null && elapsed > 0) {
          elapsedMinutes = elapsed;
          elapsedFormatted = formatElapsedTime(elapsed);
        }
      }
      
      // Calculate control-to-control stats
      let legTime = '';
      let legSpeed = 0;
      let legDistance = 0;
      
      if (index > 0) {
        const prevCheckpoint = rider.checkpoints[index - 1];
        
        // Calculate elapsed time for previous checkpoint
        let prevElapsedMinutes = 0;
        if (index === 1) {
          prevElapsedMinutes = 0;
        } else {
          const prevElapsed = calculateElapsedTime(rider.rider_no, prevCheckpoint.time);
          if (prevElapsed !== null) {
            prevElapsedMinutes = prevElapsed;
          }
        }
        
        const timeDiff = elapsedMinutes - prevElapsedMinutes;
        
        // Find distances for current and previous checkpoints
        const cleanCheckpointName = checkpoint.name.replace(/\s+[NSEW]$/, '');
        const cleanPrevCheckpointName = prevCheckpoint.name.replace(/\s+[NSEW]$/, '');
        
        const currentControl = controls.find(c => 
          c.name === cleanCheckpointName ||
          c.name === checkpoint.name ||
          checkpoint.name.includes(c.name) ||
          c.name.includes(cleanCheckpointName)
        );
        const prevControl = controls.find(c => 
          c.name === cleanPrevCheckpointName ||
          c.name === prevCheckpoint.name ||
          prevCheckpoint.name.includes(c.name) ||
          c.name.includes(cleanPrevCheckpointName) ||
          (prevCheckpoint.name === 'Start' && c.km === 0)
        );
        
        if (currentControl && prevControl) {
          legDistance = currentControl.km - prevControl.km;
          if (timeDiff > 0) {
            legSpeed = (legDistance / timeDiff) * 60; // km/h
            const hours = Math.floor(timeDiff / 60);
            const mins = Math.round(timeDiff % 60);
            legTime = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
          }
        }
      }
      
      // Calculate time ago
      const timeAgo = calculateTimeAgo(checkpoint.time);
      
      return {
        checkpoint,
        index,
        elapsedMinutes,
        elapsedFormatted,
        rank: null,
        totalRidersAtCheckpoint: 0,
        legTime,
        legSpeed,
        legDistance,
        isStartCheckpoint,
        timeAgo
      };
    });
  }, [rider, controls]);
  
  if (rider.checkpoints.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-3">Checkpoint History</h3>
        <p className="text-gray-600">No checkpoints recorded yet.</p>
      </div>
    );
  }
  
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Checkpoint History</h3>
      <div className="space-y-3">
        {checkpointStats.map((stats) => (
          <div key={stats.index} className="border rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">{stats.checkpoint.name}</h4>
                <p className="text-sm text-muted-foreground">Checkpoint #{stats.index + 1}</p>
                {stats.legDistance > 0 && (
                  <div className="mt-2 text-xs space-y-1">
                    <p className="text-muted-foreground">Leg: {stats.legDistance} km in {stats.legTime}</p>
                    <p className="text-muted-foreground">Leg Speed: {stats.legSpeed.toFixed(1)} km/h</p>
                  </div>
                )}
              </div>
              <div className="text-right">
                <Badge variant="outline">{stats.checkpoint.time}</Badge>
                {stats.timeAgo && (
                  <p className={`text-xs mt-1 ${
                    stats.index === checkpointStats.length - 1 && stats.timeAgo.includes('h') && parseInt(stats.timeAgo) >= 12 
                      ? 'text-red-600 font-medium' 
                      : 'text-muted-foreground'
                  }`}>
                    {stats.timeAgo}
                  </p>
                )}
                {stats.isStartCheckpoint && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Wave start: {waveStartTime}
                  </p>
                )}
                {stats.elapsedFormatted && (
                  <p className="text-xs text-primary mt-1">Total: {stats.elapsedFormatted}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};