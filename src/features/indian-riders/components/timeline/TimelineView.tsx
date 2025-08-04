import React, { useState, useMemo } from 'react';
import type { Rider } from '../../types';
import type { Control } from '../../types/weather';
import { ControlCard } from './ControlCard';
import { useControlsData } from '../../hooks/useControlsData';
import { isLondonStartRider } from '@/config/lel-route';

interface TimelineViewProps {
  riders: Rider[];
  searchTerm: string;
  onSearch: (term: string) => void;
  selectedRiderId: string | null;
  onSelectRider: (riderId: string | null) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  riders,
  searchTerm,
  onSearch,
  selectedRiderId,
  onSelectRider
}) => {
  const { controls } = useControlsData();
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [showAllRiders, setShowAllRiders] = useState<Record<string, boolean>>({});
  
  // Process controls and rider data
  const processedControls = useMemo(() => {
    // First 10 controls for London-Edinburgh journey
    const controlsToShow = controls.slice(0, 10);
    
    return controlsToShow.map((control, index) => {
      const isStart = control.name === 'Start' || index === 0;
      const isLast = index === controlsToShow.length - 1;
      
      // Get riders at this control
      const ridersAtControl = riders.filter((rider: Rider) => {
        if (isStart) {
          return rider.checkpoints.some(cp => 
            cp.name === 'Start' || 
            cp.name === 'Writtle' || 
            cp.name === 'London' ||
            cp.name.includes('Start')
          );
        }
        return rider.checkpoints.some(cp => 
          cp.name === control.name || 
          cp.name.includes(control.name)
        );
      });
      
      // Count riders currently at this control
      const currentRiderCount = ridersAtControl.filter((rider: Rider) => {
        const lastCheckpoint = rider.checkpoints[rider.checkpoints.length - 1];
        if (isStart) {
          return lastCheckpoint && (
            lastCheckpoint.name === 'Start' || 
            lastCheckpoint.name === 'Writtle' || 
            lastCheckpoint.name === 'London'
          );
        }
        return lastCheckpoint && 
          (lastCheckpoint.name === control.name || 
           lastCheckpoint.name.includes(control.name));
      }).length;
      
      // Check if we have both London and Writtle riders
      const hasLondonRiders = ridersAtControl.some((rider: Rider) => 
        isLondonStartRider(rider.rider_no)
      );
      const hasWrittleRiders = ridersAtControl.some((rider: Rider) => 
        !isLondonStartRider(rider.rider_no)
      );
      
      const cardId = `${control.name}-${index}`;
      
      return {
        control,
        ridersAtControl,
        currentRiderCount,
        hasLondonRiders,
        hasWrittleRiders,
        isStart,
        isLast,
        cardId
      };
    });
  }, [controls, riders]);
  
  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };
  
  const toggleShowAllRiders = (cardId: string) => {
    setShowAllRiders(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };
  
  return (
    <div className="relative">
      {processedControls.map(({
        control,
        ridersAtControl,
        currentRiderCount,
        hasLondonRiders,
        hasWrittleRiders,
        isStart,
        isLast,
        cardId
      }) => (
        <ControlCard
          key={cardId}
          control={control}
          ridersAtControl={ridersAtControl}
          currentRiderCount={currentRiderCount}
          hasLondonRiders={hasLondonRiders}
          hasWrittleRiders={hasWrittleRiders}
          isStart={isStart}
          isLast={isLast}
          isExpanded={expandedCards.has(cardId)}
          onToggleExpansion={() => toggleCardExpansion(cardId)}
          searchTerm={searchTerm}
          onSearch={onSearch}
          showAllRiders={showAllRiders[cardId] || false}
          onToggleShowAll={() => toggleShowAllRiders(cardId)}
          selectedRiderId={selectedRiderId}
          onSelectRider={onSelectRider}
          allRiders={riders}
        />
      ))}
    </div>
  );
};