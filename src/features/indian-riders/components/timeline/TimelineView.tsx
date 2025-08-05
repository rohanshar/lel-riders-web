import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import type { Rider } from '../../types';
import { ControlCard } from './ControlCard';
import { useControlsData } from '../../hooks/useControlsData';
import { useWeatherData } from '../../hooks/useWeatherData';
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
  const { getWeatherForControl } = useWeatherData();
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [showAllRiders, setShowAllRiders] = useState<Record<string, boolean>>({});
  const [showPassedControls, setShowPassedControls] = useState(false);
  const [showFutureControls, setShowFutureControls] = useState(false);
  
  // Process controls and rider data
  const { activeControls, passedControls, futureControls } = useMemo(() => {
    // Show all controls including return journey
    const controlsToShow = controls;
    
    const processedControls = controlsToShow.map((control, index) => {
      const isStart = control.name === 'Start' || index === 0;
      const isLast = index === controlsToShow.length - 1;
      
      // Get riders at this control
      const ridersAtControl = riders.filter((rider: Rider) => {
        if (control.name === 'Writtle' && control.km === 0) {
          // This is the start control
          return rider.checkpoints.some(cp => 
            cp.name === 'Start' || 
            cp.name === 'Writtle' || 
            cp.name === 'London' ||
            cp.name.includes('Start')
          );
        }
        
        // For other controls, match by name and direction
        return rider.checkpoints.some(cp => {
          // For return controls, only match southbound checkpoints (with "S" suffix)
          if (control.isReturn) {
            return cp.name === `${control.name} S`;
          }
          // For northbound controls, match northbound checkpoints (with "N" suffix) or exact name
          return cp.name === `${control.name} N` || cp.name === control.name;
        });
      });
      
      // Count riders currently at this control
      const currentRiderCount = ridersAtControl.filter((rider: Rider) => {
        const lastCheckpoint = rider.checkpoints[rider.checkpoints.length - 1];
        if (!lastCheckpoint) return false;
        
        if (control.name === 'Writtle' && control.km === 0) {
          // This is the start control
          return lastCheckpoint.name === 'Start' || 
            lastCheckpoint.name === 'Writtle' || 
            lastCheckpoint.name === 'London';
        }
        
        // For other controls, check if this is their current location with proper direction
        if (control.isReturn) {
          return lastCheckpoint.name === `${control.name} S`;
        }
        return lastCheckpoint.name === `${control.name} N` || lastCheckpoint.name === control.name;
      }).length;
      
      // Check if we have both London and Writtle riders
      const hasLondonRiders = ridersAtControl.some((rider: Rider) => 
        isLondonStartRider(rider.rider_no)
      );
      const hasWrittleRiders = ridersAtControl.some((rider: Rider) => 
        !isLondonStartRider(rider.rider_no)
      );
      
      const cardId = `${control.name}-${index}`;
      
      // A control is considered "passed" if no riders are currently there
      // and all riders who reached it have moved on (including Start)
      const isPassed = currentRiderCount === 0 && ridersAtControl.length > 0;
      
      return {
        control,
        ridersAtControl,
        currentRiderCount,
        hasLondonRiders,
        hasWrittleRiders,
        isStart,
        isLast,
        cardId,
        isPassed
      };
    });
    
    // Separate controls into three categories: passed, active (with riders), and future (empty)
    const active: typeof processedControls = [];
    const passed: typeof processedControls = [];
    const future: typeof processedControls = [];
    
    processedControls.forEach(controlData => {
      if (controlData.isPassed) {
        passed.push(controlData);
      } else if (controlData.ridersAtControl.length === 0) {
        // No riders have reached this control yet
        future.push(controlData);
      } else {
        // Has riders currently at or have passed through
        active.push(controlData);
      }
    });
    
    return { activeControls: active, passedControls: passed, futureControls: future };
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
      {/* Passed Controls - Collapsed as a single group */}
      {passedControls.length > 0 && (
        <div className="mb-4">
          {!showPassedControls ? (
            <Card 
              className="cursor-pointer hover:shadow-md transition-all duration-200 bg-gray-50"
              onClick={() => setShowPassedControls(true)}
            >
              <CardHeader className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {passedControls.map((_, index) => (
                        <div key={index} className="w-2 h-2 rounded-full bg-gray-400"></div>
                      ))}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-600">
                        {passedControls.length} Passed Control{passedControls.length > 1 ? 's' : ''}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {passedControls.map(pc => pc.control.name).join(' • ')} • Click to expand
                      </p>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </CardHeader>
            </Card>
          ) : (
            <>
              {/* Collapse button */}
              <div 
                className="flex items-center justify-end mb-2 cursor-pointer text-xs text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassedControls(false)}
              >
                <span>Hide passed controls</span>
                <ChevronUp className="h-3 w-3 ml-1" />
              </div>
              {/* Render passed controls */}
              {passedControls.map(({
                control,
                ridersAtControl,
                currentRiderCount,
                hasLondonRiders,
                hasWrittleRiders,
                isStart,
                isLast,
                cardId
              }) => (
                <div key={cardId} className="mb-2">
                  <ControlCard
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
                    weather={isStart ? null : getWeatherForControl(control.name)}
                  />
                </div>
              ))}
            </>
          )}
        </div>
      )}
      
      {/* Active Controls */}
      {activeControls.map(({
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
          weather={isStart ? null : getWeatherForControl(control.name)}
        />
      ))}
      
      {/* Future Controls - Collapsed as a single group */}
      {futureControls.length > 0 && (
        <div className="mt-4">
          {!showFutureControls ? (
            <Card 
              className="cursor-pointer hover:shadow-md transition-all duration-200 bg-gray-50"
              onClick={() => setShowFutureControls(true)}
            >
              <CardHeader className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {futureControls.map((_, index) => (
                        <div key={index} className="w-2 h-2 rounded-full bg-gray-300"></div>
                      ))}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-600">
                        {futureControls.length} Future Control{futureControls.length > 1 ? 's' : ''}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {futureControls.map(fc => fc.control.name).join(' • ')} • Click to expand
                      </p>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </CardHeader>
            </Card>
          ) : (
            <>
              {/* Collapse button */}
              <div 
                className="flex items-center justify-end mb-2 cursor-pointer text-xs text-gray-500 hover:text-gray-700"
                onClick={() => setShowFutureControls(false)}
              >
                <span>Hide future controls</span>
                <ChevronUp className="h-3 w-3 ml-1" />
              </div>
              {/* Render future controls */}
              {futureControls.map(({
                control,
                ridersAtControl,
                currentRiderCount,
                hasLondonRiders,
                hasWrittleRiders,
                isStart,
                isLast,
                cardId
              }) => (
                <div key={cardId} className="mb-2">
                  <ControlCard
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
                    weather={isStart ? null : getWeatherForControl(control.name)}
                  />
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};