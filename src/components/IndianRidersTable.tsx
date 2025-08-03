import React from 'react';
import { MapPin, Clock, TrendingUp } from 'lucide-react';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { getTotalDistanceForRider } from '../config/lel-route';

interface Checkpoint {
  name: string;
  time: string;
}

interface Rider {
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

interface IndianRidersTableProps {
  riders: Rider[];
  onRiderClick: (rider: Rider) => void;
}

const IndianRidersTable: React.FC<IndianRidersTableProps> = ({ riders, onRiderClick }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-500">In Progress</Badge>;
      case 'finished':
        return <Badge variant="default" className="bg-green-500">Finished</Badge>;
      case 'dnf':
        return <Badge variant="destructive">DNF</Badge>;
      default:
        return <Badge variant="secondary">Not Started</Badge>;
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getProgress = (rider: Rider): number => {
    const totalDistance = getTotalDistanceForRider(rider.rider_no);
    
    if (rider.distance_km > 0) {
      return Math.min((rider.distance_km / totalDistance) * 100, 100);
    } else if (rider.estimated_distance && rider.estimated_distance > 0) {
      return Math.min((rider.estimated_distance / totalDistance) * 100, 100);
    }
    return 0;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="w-[100px]">Bib</TableHead>
            <TableHead className="w-[80px]">Wave</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead>Current Location</TableHead>
            <TableHead className="w-[100px]">Distance</TableHead>
            <TableHead className="w-[100px]">Progress</TableHead>
            <TableHead className="w-[100px]">Elapsed</TableHead>
            <TableHead className="w-[80px]">Speed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {riders.map((rider, index) => (
            <TableRow 
              key={rider.rider_no}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => onRiderClick(rider)}
            >
              <TableCell className="font-medium">{index + 1}</TableCell>
              <TableCell className="font-medium">{rider.name}</TableCell>
              <TableCell>{rider.rider_no}</TableCell>
              <TableCell>{rider.rider_no.match(/^[A-Z]+/)?.[0] || ''}</TableCell>
              <TableCell>{getStatusBadge(rider.status)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-gray-500" />
                  <span className="text-sm">{rider.current_checkpoint || 'Start'}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm font-medium">
                  {rider.distance_km > 0 ? `${rider.distance_km} km` : 
                   rider.estimated_distance ? `~${Math.round(rider.estimated_distance)} km` : 
                   '0 km'}
                </span>
              </TableCell>
              <TableCell>
                <div className="w-full">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProgress(rider)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">{Math.round(getProgress(rider))}%</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {rider.elapsed_time && rider.elapsed_time > 0 ? (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-gray-500" />
                    <span className="text-sm">{formatTime(rider.elapsed_time)}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell>
                {rider.average_speed ? (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-gray-500" />
                    <span className="text-sm">{rider.average_speed.toFixed(1)} km/h</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default IndianRidersTable;