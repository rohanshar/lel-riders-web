import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Users, MapPin, Activity, Search, AlertCircle, CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { 
  getTotalDistanceForRider,
  getWaveStartTime,
  getControlsForRider,
  calculateElapsedTime,
  formatElapsedTime,
  isLondonStartRider,
  WRITTLE_START_CONTROLS,
  LONDON_START_CONTROLS
} from '../config/lel-route';
import { useGlobalData } from '../contexts';

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

interface Control {
  id: string;
  name: string;
  km: number;
  leg: 'North' | 'South';
}

const IndianRiders: React.FC = () => {
  const { 
    rawTrackingData,
    loading: globalLoading,
    errors: globalError,
    refreshTracking: originalRefreshTracking
  } = useGlobalData();
  
  // SAFETY: Wrap refreshTracking to prevent any automatic calls
  const refreshTracking = React.useCallback(async () => {
    console.log('[IndianRiders] Manual refresh triggered by user');
    return originalRefreshTracking();
  }, [originalRefreshTracking]);

  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [londonTime, setLondonTime] = useState<string>('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [cardSortBy, setCardSortBy] = useState<Record<string, 'rank' | 'arrival'>>({});
  const [showStats, setShowStats] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Map GlobalData to component's expected format
  const trackingData = useMemo(() => {
    if (!rawTrackingData) return null;
    return rawTrackingData;
  }, [rawTrackingData]);
  
  const loading = globalLoading.tracking;
  const error = globalError.tracking?.message || null;

  // Set last update time when data changes
  useEffect(() => {
    if (trackingData && trackingData.last_updated) {
      setLastUpdateTime(new Date(trackingData.last_updated));
    }
  }, [trackingData]);

  // Update London time every second
  useEffect(() => {
    const updateLondonTime = () => {
      const londonTime = new Date().toLocaleString('en-GB', {
        timeZone: 'Europe/London',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      setLondonTime(londonTime);
    };

    updateLondonTime();
    const interval = setInterval(updateLondonTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update time since last update only - NO AUTO REFRESH
  useEffect(() => {
    // SAFETY CHECK: Ensure no auto-refresh
    const updateTimers = () => {
      if (!lastUpdateTime) return;

      const now = new Date();
      const diffMs = now.getTime() - lastUpdateTime.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const seconds = diffSeconds % 60;

      // SAFETY: Log if we're near the old auto-refresh time
      if (diffSeconds >= 600 && diffSeconds <= 660) {
        console.warn('[IndianRiders] Near 10-minute mark but auto-refresh is DISABLED');
      }

      // Format time since update - DISPLAY ONLY, NO ACTIONS
      if (diffMinutes === 0) {
        setTimeSinceUpdate(`${seconds}s ago`);
      } else if (diffMinutes === 1) {
        setTimeSinceUpdate(`1 min ${seconds}s ago`);
      } else if (diffMinutes < 60) {
        setTimeSinceUpdate(`${diffMinutes} mins ${seconds}s ago`);
      } else {
        const hours = Math.floor(diffMinutes / 60);
        const mins = diffMinutes % 60;
        setTimeSinceUpdate(`${hours}h ${mins}m ago`);
      }
      
      // SAFETY: Absolutely no refresh calls here
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [lastUpdateTime]); // SAFETY: Removed refreshTracking from deps

  // Toggle card expansion
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

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!trackingData) return { total: 0, inProgress: 0, finished: 0, dnf: 0, notStarted: 0 };
    
    const riders = trackingData.riders || [];
    const inProgress = riders.filter((r: Rider) => r.status === 'in_progress').length;
    const finished = riders.filter((r: Rider) => r.status === 'finished').length;
    const dnf = riders.filter((r: Rider) => r.status === 'dnf').length;
    const notStarted = riders.filter((r: Rider) => r.status === 'not_started').length;
    
    return { total: riders.length, inProgress, finished, dnf, notStarted };
  }, [trackingData]);

  // Helper functions
  const formatRiderName = (name: string, riderNo: string) => {
    const isLondonStart = isLondonStartRider(riderNo);
    return (
      <>
        {name}
        {isLondonStart && <sup className="text-xs text-muted-foreground ml-1">+20km</sup>}
      </>
    );
  };

  // Calculate actual distance based on rider's checkpoints
  const calculateRiderDistance = (rider: Rider): number => {
    if (!rider.checkpoints || rider.checkpoints.length === 0) return 0;
    
    // Get the appropriate controls for this rider
    const controls = getControlsForRider(rider.rider_no);
    
    // Find the furthest checkpoint the rider has reached
    let maxDistance = 0;
    
    rider.checkpoints.forEach(checkpoint => {
      // Clean checkpoint name (remove directional suffixes)
      const cleanName = checkpoint.name.replace(/\s+[NSEW]$/, '');
      
      // Find matching control
      const control = controls.find(c => 
        c.name === cleanName || 
        c.name === checkpoint.name ||
        checkpoint.name.includes(c.name) ||
        (checkpoint.name === 'Start' && c.km === 0)
      );
      
      if (control && control.km > maxDistance) {
        maxDistance = control.km;
      }
    });
    
    return maxDistance;
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case 'finished':
        return <Badge className="bg-green-500">Finished</Badge>;
      case 'dnf':
        return <Badge className="bg-red-500">DNF</Badge>;
      case 'not_started':
        return <Badge className="bg-gray-500">Not Started</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'finished':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'dnf':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'not_started':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  // Filter and sort riders
  const filteredRiders = useMemo(() => {
    if (!trackingData) return [];
    
    let riders = trackingData.riders || [];
    
    // Filter by search term
    if (searchTerm) {
      riders = riders.filter((rider: Rider) => 
        rider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rider.rider_no.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort riders by distance (fixed)
    riders = [...riders].sort((a: Rider, b: Rider) => {
      return calculateRiderDistance(b) - calculateRiderDistance(a);
    });
    
    return riders;
  }, [trackingData, searchTerm]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error loading data</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );

  if (!trackingData) return null;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="border rounded-lg p-4">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowStats(!showStats)}
        >
          <h2 className="text-lg font-semibold">Statistics</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {statistics.inProgress} riding • {statistics.finished} finished
            </span>
            {showStats ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>
        
        {showStats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Riders</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total}</div>
            <p className="text-xs text-muted-foreground">Indian participants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statistics.inProgress}</div>
            <p className="text-xs text-muted-foreground">Currently riding</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finished</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.finished}</div>
            <p className="text-xs text-muted-foreground">Completed the ride</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DNF</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistics.dnf}</div>
            <p className="text-xs text-muted-foreground">Did not finish</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not Started</CardTitle>
            <AlertCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{statistics.notStarted}</div>
            <p className="text-xs text-muted-foreground">Yet to start</p>
          </CardContent>
        </Card>
          </div>
        )}
      </div>

      {/* London Time Display */}
      <div className="bg-gray-100 rounded-lg p-3 text-center">
        <div className="text-sm text-gray-600">London Time</div>
        <div className="text-lg font-semibold">{londonTime}</div>
      </div>

      {/* Last Updated */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center text-muted-foreground text-sm">
          <Clock className="h-4 w-4 mr-2" />
          Updated <span className={`font-medium ml-1 ${
            lastUpdateTime && (new Date().getTime() - lastUpdateTime.getTime()) > 600000 
              ? 'text-orange-600' 
              : 'text-foreground'
          }`}>{timeSinceUpdate}</span>
          {lastUpdateTime && (new Date().getTime() - lastUpdateTime.getTime()) > 600000 && (
            <span className="text-orange-600 ml-2">(Data may be stale)</span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            setIsRefreshing(true);
            console.log('[Manual Refresh] Starting refresh at', new Date().toISOString());
            try {
              await refreshTracking();
              console.log('[Manual Refresh] Completed successfully');
              // Force update of last update time
              setLastUpdateTime(new Date());
            } catch (error) {
              console.error('[Manual Refresh] Failed:', error);
            } finally {
              setIsRefreshing(false);
            }
          }}
          disabled={isRefreshing || loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing || loading ? 'animate-spin' : ''}`} />
          {isRefreshing || loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search by name or rider number..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

          {/* Timeline View */}
          <div className="space-y-3">
            {(() => {
              // Create merged controls list, treating Writtle and London as "Start"
              const mergedControls = trackingData.event.controls.reduce((acc: any[], control: any) => {
                // Skip London control, merge it with Writtle as "Start"
                if (control.name === 'London') return acc;
                
                // Rename Writtle to Start and set km to 0
                if (control.name === 'Writtle') {
                  return [...acc, { ...control, name: 'Start', km: 0, id: 'start' }];
                }
                
                return [...acc, control];
              }, [] as Control[]);

              return mergedControls.slice(0, 10).map((control: any) => {
                const isStart = control.name === 'Start';
                const cardId = control.id || control.name;
                const isExpanded = expandedCards.has(cardId);
                
                // For Start, include riders who have "Start", "Writtle", or "London" in their checkpoints
                const ridersAtControl = filteredRiders.filter((rider: Rider) => {
                  if (isStart) {
                    return rider.checkpoints.some(cp => 
                      cp.name === 'Start' || 
                      cp.name === 'Writtle' || 
                      cp.name === 'London' ||
                      cp.name.includes('Start')
                    );
                  }
                  return rider.checkpoints.some(cp => {
                    return cp.name === control.name || 
                           cp.name.includes(control.name);
                  });
                });

                const riderCount = ridersAtControl.length;
                
                // Check if we have both London and Writtle start riders at this control
                const hasLondonRiders = ridersAtControl.some((r: Rider) => isLondonStartRider(r.rider_no));
                const hasWrittleRiders = ridersAtControl.some((r: Rider) => !isLondonStartRider(r.rider_no));
                
                // Get distances for both start types
                const writtleDistance = WRITTLE_START_CONTROLS.find(c => c.name === control.name)?.km || 0;
                const londonDistance = LONDON_START_CONTROLS.find(c => c.name === control.name)?.km || 0;
                
                // Format the distance display
                const getDistanceDisplay = () => {
                  if (isStart) return '';
                  
                  if (hasLondonRiders && hasWrittleRiders) {
                    // Show Writtle distance with note about London start
                    return ` (${writtleDistance} km, +20 for London start)`;
                  } else if (hasLondonRiders) {
                    // Only London riders
                    return ` (${londonDistance} km)`;
                  } else {
                    // Only Writtle riders or no riders
                    return ` (${writtleDistance} km)`;
                  }
                };

                return (
                  <Card key={cardId} className="overflow-hidden">
                    <CardHeader className="py-3">
                      <div 
                        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors rounded p-2 -m-2"
                        onClick={() => toggleCardExpansion(cardId)}
                      >
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-base">
                            {control.name}{getDistanceDisplay()}
                          </CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            {riderCount} {riderCount === 1 ? 'rider' : 'riders'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{control.leg} Leg</span>
                          {riderCount > 0 && (
                            isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                      {!isExpanded && riderCount > 0 && (() => {
                        // Get latest 3 arrivals
                        const sortedByArrival = [...ridersAtControl].sort((a: Rider, b: Rider) => {
                          const aTime = a.checkpoints.find((cp: Checkpoint) => 
                            cp.name === control.name || cp.name.includes(control.name)
                          )?.time || '';
                          const bTime = b.checkpoints.find((cp: Checkpoint) => 
                            cp.name === control.name || cp.name.includes(control.name)
                          )?.time || '';
                          return bTime.localeCompare(aTime);
                        }).slice(0, 3);
                        
                        return (
                          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                            <Activity className="h-3 w-3" />
                            <span>Latest: {sortedByArrival.map(r => r.name.split(' ')[0]).join(', ')}</span>
                          </div>
                        );
                      })()}
                    </CardHeader>
                    {isExpanded && riderCount > 0 && (
                      <CardContent className="pt-0 pb-3">
                        <div className="mb-3 flex justify-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCardSortBy(prev => ({
                                ...prev,
                                [cardId]: prev[cardId] === 'arrival' ? 'rank' : 'arrival'
                              }));
                            }}
                            className="text-xs"
                          >
                            Sort by: {cardSortBy[cardId] === 'arrival' ? 'Arrival Time ↓' : 'Rank (Elapsed Time)'}
                          </Button>
                        </div>
                        <div className="space-y-1">
                          {(() => {
                            // Sort riders by elapsed time
                            interface RiderWithElapsedTime {
                              rider: Rider;
                              checkpoint: Checkpoint | undefined;
                              elapsedMinutes: number;
                              elapsedFormatted: string;
                            }
                            
                            const ridersWithElapsedTime = ridersAtControl.map((rider: Rider): RiderWithElapsedTime => {
                              const checkpoint = rider.checkpoints.find(cp => {
                                if (isStart) {
                                  return cp.name === 'Start' || 
                                         cp.name === 'Writtle' || 
                                         cp.name === 'London' ||
                                         cp.name.includes('Start');
                                }
                                return cp.name === control.name || 
                                       cp.name.includes(control.name);
                              });
                              
                              // Calculate elapsed time directly
                              let elapsedMinutes = 0;
                              let elapsedFormatted = '';
                              
                              if (checkpoint) {
                                // For start checkpoint, elapsed time is 0
                                if (isStart) {
                                  elapsedMinutes = 0;
                                  elapsedFormatted = '0m';
                                } else {
                                  // Calculate elapsed time from wave start
                                  const elapsed = calculateElapsedTime(rider.rider_no, checkpoint.time);
                                  if (elapsed !== null) {
                                    elapsedMinutes = elapsed;
                                    elapsedFormatted = formatElapsedTime(elapsed);
                                  }
                                }
                              }
                              
                              return {
                                rider,
                                checkpoint,
                                elapsedMinutes,
                                elapsedFormatted
                              };
                            }).filter((item: RiderWithElapsedTime) => item.checkpoint);
                            
                            // Sort based on selected option
                            const sortMode = cardSortBy[cardId] || 'rank';
                            if (sortMode === 'arrival') {
                              // Sort by arrival time (latest first)
                              ridersWithElapsedTime.sort((a: RiderWithElapsedTime, b: RiderWithElapsedTime) => {
                                const aTime = a.checkpoint?.time || '';
                                const bTime = b.checkpoint?.time || '';
                                return bTime.localeCompare(aTime);
                              });
                            } else {
                              // Sort by elapsed time (fastest first)
                              ridersWithElapsedTime.sort((a: RiderWithElapsedTime, b: RiderWithElapsedTime) => a.elapsedMinutes - b.elapsedMinutes);
                            }
                            
                            return ridersWithElapsedTime.map(({ rider, checkpoint, elapsedFormatted }: RiderWithElapsedTime, index: number) => {
                              if (!checkpoint) return null;

                              return (
                                <div 
                                  key={rider.rider_no} 
                                  className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer text-sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedRider(rider);
                                  }}
                                >
                                  <div className="flex items-center gap-2 flex-1">
                                    {sortMode === 'rank' && (
                                      <span className="text-xs font-medium text-muted-foreground w-8">#{index + 1}</span>
                                    )}
                                    {getStatusIcon(rider.status)}
                                    <span className="font-medium">{formatRiderName(rider.name, rider.rider_no)}</span>
                                    <span className="text-xs text-muted-foreground">({rider.rider_no})</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs">
                                    <span className="text-muted-foreground">{checkpoint.time}</span>
                                    <Badge 
                                      variant={sortMode === 'rank' && index < 3 ? "default" : "secondary"} 
                                      className="text-xs px-2 py-0 min-w-[60px] text-center"
                                    >
                                      {elapsedFormatted}
                                    </Badge>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              });
            })()}
          </div>

      {/* Rider Detail Dialog */}
      <Dialog open={!!selectedRider} onOpenChange={(open: boolean) => !open && setSelectedRider(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedRider && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {formatRiderName(selectedRider.name, selectedRider.rider_no)}
                </DialogTitle>
                <DialogDescription>
                  <div className="flex items-center gap-4 mt-2">
                    <span>Rider No: {selectedRider.rider_no}</span>
                    {getStatusBadge(selectedRider.status)}
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-6">
                {/* Current Status */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Current Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-600" />
                      <span>Current Location: <strong>{selectedRider.current_checkpoint || selectedRider.last_checkpoint || 'Start'}</strong></span>
                    </div>
                    {selectedRider.status === 'in_progress' && (() => {
                      // Calculate expected arrival at next control
                      const currentDistance = calculateRiderDistance(selectedRider);
                      const controls = getControlsForRider(selectedRider.rider_no);
                      
                      console.log('[Expected Arrival Debug]', {
                        rider: selectedRider.name,
                        status: selectedRider.status,
                        currentDistance,
                        checkpoints: selectedRider.checkpoints.length,
                        controls: controls.length
                      });
                      
                      // Find the next control
                      let nextControl = null;
                      for (const control of controls) {
                        if (control.km > currentDistance) {
                          nextControl = control;
                          break;
                        }
                      }
                      
                      // Calculate average speed from actual data
                      let averageSpeed = 0;
                      if (currentDistance > 0 && selectedRider.checkpoints.length > 0) {
                        const lastCheckpoint = selectedRider.checkpoints[selectedRider.checkpoints.length - 1];
                        const elapsed = calculateElapsedTime(selectedRider.rider_no, lastCheckpoint.time);
                        if (elapsed && elapsed > 0) {
                          averageSpeed = (currentDistance / elapsed) * 60; // km/h
                        }
                      }
                      
                      if (nextControl && averageSpeed > 0 && selectedRider.checkpoints.length > 0) {
                        const distanceToNext = nextControl.km - currentDistance;
                        const hoursToNext = distanceToNext / averageSpeed;
                        
                        // Get the last checkpoint arrival time
                        const lastCheckpoint = selectedRider.checkpoints[selectedRider.checkpoints.length - 1];
                        const lastCheckpointTime = lastCheckpoint.time; // Format: "Sunday 11:56"
                        
                        // Parse the checkpoint time (assuming format like "Sunday 11:56")
                        const timeParts = lastCheckpointTime.split(' ');
                        const dayName = timeParts[0];
                        const timeOnly = timeParts[timeParts.length - 1]; // Get "11:56"
                        const [checkpointHours, checkpointMinutes] = timeOnly.split(':').map(Number);
                        
                        // Calculate expected arrival by adding travel time to checkpoint time
                        const totalMinutesAtCheckpoint = checkpointHours * 60 + checkpointMinutes;
                        const travelMinutes = Math.round(hoursToNext * 60);
                        const totalMinutesExpected = totalMinutesAtCheckpoint + travelMinutes;
                        
                        // Handle day overflow
                        let expectedDay = dayName;
                        let expectedHours = Math.floor(totalMinutesExpected / 60);
                        let expectedMinutes = totalMinutesExpected % 60;
                        
                        if (expectedHours >= 24) {
                          expectedHours = expectedHours % 24;
                          // Simple day progression (would need proper date handling for production)
                          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                          const currentDayIndex = days.indexOf(dayName);
                          expectedDay = days[(currentDayIndex + 1) % 7];
                        }
                        
                        // Format the expected time
                        const expectedTime = `${expectedDay} ${expectedHours.toString().padStart(2, '0')}:${expectedMinutes.toString().padStart(2, '0')}`;
                        
                        // Calculate IST time (UK + 4:30 hours during BST, + 5:30 during GMT)
                        // Since this is summer (London-Edinburgh-London typically runs in July/August), UK is in BST (UTC+1)
                        // IST is UTC+5:30, so IST = BST + 4:30
                        const totalMinutesIST = totalMinutesExpected + (4 * 60 + 30); // Add 4:30 hours
                        let expectedDayIST = expectedDay;
                        let expectedHoursIST = Math.floor(totalMinutesIST / 60);
                        let expectedMinutesIST = totalMinutesIST % 60;
                        
                        if (expectedHoursIST >= 24) {
                          expectedHoursIST = expectedHoursIST % 24;
                          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                          const currentDayIndex = days.indexOf(expectedDay);
                          expectedDayIST = days[(currentDayIndex + 1) % 7];
                        }
                        
                        const expectedTimeIST = `${expectedHoursIST.toString().padStart(2, '0')}:${expectedMinutesIST.toString().padStart(2, '0')} IST`;
                        
                        return (
                          <>
                            <div className="flex items-center gap-2">
                              <Activity className="h-4 w-4 text-gray-600" />
                              <span>Next Control: <strong>{nextControl.name}</strong> ({distanceToNext} km away)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-600" />
                              <span>Expected Arrival: <strong>{expectedTime}</strong> ({expectedTimeIST}) • {Math.floor(hoursToNext)}h {Math.round((hoursToNext % 1) * 60)}m from last control</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>Based on average speed: {averageSpeed.toFixed(1)} km/h</span>
                            </div>
                          </>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Distance</p>
                    <p className="text-xl font-semibold">{calculateRiderDistance(selectedRider)} km</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Elapsed Time</p>
                    <p className="text-xl font-semibold">
                      {(() => {
                        if (selectedRider.status === 'not_started') return '-';
                        if (selectedRider.checkpoints.length === 0) return '-';
                        const lastCheckpoint = selectedRider.checkpoints[selectedRider.checkpoints.length - 1];
                        const elapsed = calculateElapsedTime(selectedRider.rider_no, lastCheckpoint.time);
                        return elapsed !== null ? formatElapsedTime(elapsed) : '-';
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Speed</p>
                    <p className="text-xl font-semibold">
                      {(() => {
                        if (selectedRider.status === 'not_started') return '-';
                        const distance = calculateRiderDistance(selectedRider);
                        if (distance === 0 || selectedRider.checkpoints.length === 0) return '-';
                        const lastCheckpoint = selectedRider.checkpoints[selectedRider.checkpoints.length - 1];
                        const elapsed = calculateElapsedTime(selectedRider.rider_no, lastCheckpoint.time);
                        if (elapsed && elapsed > 0) {
                          const speed = (distance / elapsed) * 60; // km/h
                          return `${speed.toFixed(1)} km/h`;
                        }
                        return '-';
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Checkpoints</p>
                    <p className="text-xl font-semibold">{selectedRider.checkpoints.length}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{((calculateRiderDistance(selectedRider) / getTotalDistanceForRider(selectedRider.rider_no)) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full"
                      style={{ width: `${Math.min((calculateRiderDistance(selectedRider) / getTotalDistanceForRider(selectedRider.rider_no)) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Checkpoint History */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Checkpoint History</h3>
                  {selectedRider.checkpoints.length === 0 ? (
                    <p className="text-muted-foreground">No checkpoints reached yet</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedRider.checkpoints.map((checkpoint: Checkpoint, index: number) => {
                        const isStartCheckpoint = index === 0 || checkpoint.name === 'Start' || 
                                                checkpoint.name === 'Writtle' || checkpoint.name === 'London';
                        const waveStartTime = getWaveStartTime(selectedRider.rider_no);
                        const controls = getControlsForRider(selectedRider.rider_no);
                        
                        // Calculate elapsed time
                        let elapsedFormatted = '';
                        let elapsedMinutes = 0;
                        if (isStartCheckpoint) {
                          elapsedFormatted = '0m';
                          elapsedMinutes = 0;
                        } else {
                          const elapsed = calculateElapsedTime(selectedRider.rider_no, checkpoint.time);
                          if (elapsed !== null) {
                            elapsedFormatted = formatElapsedTime(elapsed);
                            elapsedMinutes = elapsed;
                          }
                        }
                        
                        // Calculate control-to-control speed and time
                        let legTime = '';
                        let legSpeed = 0;
                        let legDistance = 0;
                        
                        if (index > 0) {
                          const prevCheckpoint = selectedRider.checkpoints[index - 1];
                          const prevElapsed = calculateElapsedTime(selectedRider.rider_no, prevCheckpoint.time) || 0;
                          const timeDiff = elapsedMinutes - prevElapsed;
                          
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
                            (prevCheckpoint.name === 'Start' && c.km === 0) ||
                            (cleanPrevCheckpointName === 'Northstowe' && c.name === 'Northstowe')
                          );
                          
                          console.log('[Leg Debug]', {
                            checkpoint: checkpoint.name,
                            cleanName: cleanCheckpointName,
                            currentControl: currentControl?.name,
                            prevCheckpoint: prevCheckpoint.name,
                            cleanPrevName: cleanPrevCheckpointName,
                            prevControl: prevControl?.name
                          });
                          
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
                        
                        return (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold">{checkpoint.name}</h4>
                                <p className="text-sm text-muted-foreground">Checkpoint #{index + 1}</p>
                                {legDistance > 0 && (
                                  <div className="mt-2 text-xs space-y-1">
                                    <p className="text-muted-foreground">Leg: {legDistance} km in {legTime}</p>
                                    <p className="text-muted-foreground">Leg Speed: {legSpeed.toFixed(1)} km/h</p>
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <Badge variant="outline">{checkpoint.time}</Badge>
                                {isStartCheckpoint && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Wave start: {waveStartTime}
                                  </p>
                                )}
                                {elapsedFormatted && (
                                  <p className="text-xs text-primary mt-1">Total: {elapsedFormatted}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IndianRiders;