import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Instagram } from 'lucide-react';
import type { Rider, Checkpoint } from '../../types';
import { formatRiderName } from '../../utils/formatters';
import { calculateTimeAgo } from '../../utils/riderCalculations';

interface RiderListItemProps {
  rider: Rider;
  checkpoint: Checkpoint | undefined;
  elapsedMinutes: number;
  elapsedFormatted: string;
  hasProgressedBeyond?: boolean;
  averageSpeed?: number;
  isDNF?: boolean;
  rank?: number;
  isSelected: boolean;
  onSelect: () => void;
  sortMode: 'arrival' | 'rank';
}

export const RiderListItem: React.FC<RiderListItemProps> = ({
  rider,
  checkpoint,
  elapsedMinutes,
  elapsedFormatted,
  hasProgressedBeyond,
  averageSpeed,
  isDNF,
  rank,
  isSelected,
  onSelect,
  sortMode
}) => {
  if (!checkpoint) return null;

  // Determine background color based on status
  let bgColor = '';
  let borderClass = '';
  
  if (isDNF) {
    bgColor = 'bg-red-50';
  } else if (averageSpeed && averageSpeed < 15 && rider.status === 'in_progress') {
    bgColor = 'bg-yellow-50';
  }
  
  if (isSelected) {
    bgColor = 'bg-blue-100';
  } else if (rider.instagram) {
    // Subtle highlight for riders with Instagram
    bgColor = bgColor || 'bg-gradient-to-r from-pink-50 to-purple-50';
    borderClass = 'border-l-2 border-pink-300';
  }

  return (
    <div 
      className={`flex items-center justify-between px-1 sm:px-2 py-1 sm:py-1.5 rounded hover:bg-gray-50 cursor-pointer text-sm ${
        hasProgressedBeyond ? 'opacity-60' : ''
      } ${bgColor} ${borderClass} transition-colors`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
        {rank && sortMode === 'rank' && !isDNF && (
          <span className="text-xs font-medium text-muted-foreground w-6 sm:w-8 flex-shrink-0">#{rank}</span>
        )}
        <span className={`font-medium truncate ${isDNF ? 'text-red-600' : ''}`}>
          {formatRiderName(rider.name, rider.rider_no)}
        </span>
        <span className="hidden sm:inline text-xs text-muted-foreground flex-shrink-0">({rider.rider_no})</span>
        {rider.instagram && (
          <a
            href={rider.instagram}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
            title={`Follow ${rider.name.split(' ')[0]} on Instagram`}
          >
            <Instagram className="w-3 h-3 text-pink-600 hover:text-pink-700" />
          </a>
        )}
        {isDNF && (
          <Badge className="bg-red-500 text-white text-[10px] sm:text-xs px-1 sm:px-1.5 py-0 flex-shrink-0" title="No update for 16+ hours">DNF</Badge>
        )}
        {hasProgressedBeyond && !isDNF && (
          <span className="text-xs text-muted-foreground flex-shrink-0" title="Rider has progressed to a later control">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 sm:gap-4 text-xs flex-shrink-0">
        <span className="text-muted-foreground">
          <span className="hidden sm:inline">{checkpoint.time}</span>
          {(() => {
            const timeAgo = calculateTimeAgo(checkpoint.time);
            if (timeAgo) {
              return (
                <>
                  <span className={`sm:hidden text-[10px] ${isDNF ? 'text-red-600 font-medium' : ''}`}>{timeAgo}</span>
                  <span className={`hidden sm:inline text-xs ml-1 ${isDNF ? 'text-red-600 font-medium' : ''}`}>({timeAgo})</span>
                </>
              );
            }
            return <span className="sm:hidden">{checkpoint.time.split(' ').pop()}</span>;
          })()}
        </span>
        {elapsedMinutes > 0 && !isDNF && (
          <Badge 
            variant={sortMode === 'rank' && rank && rank <= 3 ? "default" : "secondary"} 
            className={`text-xs px-1.5 sm:px-2 py-0 min-w-[50px] sm:min-w-[60px] text-center ${
              sortMode === 'rank' && rank && rank <= 3 ? 'font-semibold' : ''
            }`}
          >
            {elapsedFormatted}
          </Badge>
        )}
        {averageSpeed !== undefined && averageSpeed > 0 && !isDNF && (
          <span className={`hidden sm:inline text-[10px] sm:text-xs ${
            averageSpeed < 15 ? 'text-yellow-600 font-medium' : 'text-muted-foreground'
          }`}>
            {averageSpeed.toFixed(1)} km/h
          </span>
        )}
      </div>
    </div>
  );
};