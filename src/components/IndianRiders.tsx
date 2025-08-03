import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Users, MapPin, Activity, Search, AlertCircle, CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
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
    refreshTracking
  } = useGlobalData();

  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [londonTime, setLondonTime] = useState<string>('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [cardSortBy, setCardSortBy] = useState<Record<string, 'rank' | 'arrival'>>({});
  const [showStats, setShowStats] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>('');
  const [timeUntilUpdate, setTimeUntilUpdate] = useState<string>('');

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

  // Update time since last update and time until next update
  useEffect(() => {
    const updateTimers = () => {
      if (!lastUpdateTime) return;

      const now = new Date();
      const diffMs = now.getTime() - lastUpdateTime.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const seconds = diffSeconds % 60;

      // Format time since update
      if (diffMinutes === 0) {
        setTimeSinceUpdate(`${seconds}s ago`);
      } else if (diffMinutes === 1) {
        setTimeSinceUpdate(`1 min ${seconds}s ago`);
      } else {
        setTimeSinceUpdate(`${diffMinutes} mins ${seconds}s ago`);
      }

      // Trigger refresh at 10 minutes 30 seconds (630 seconds)
      if (diffSeconds >= 630) {
        refreshTracking();
        setTimeUntilUpdate('refreshing...');
        // Reset the last update time to current to prevent multiple refreshes
        setLastUpdateTime(new Date());
        return;
      }

      // Calculate time until next update (10 minutes = 600 seconds)
      const nextUpdateSeconds = 600 - diffSeconds;
      if (nextUpdateSeconds > 0) {
        const nextMinutes = Math.floor(nextUpdateSeconds / 60);
        const nextSeconds = nextUpdateSeconds % 60;
        if (nextMinutes === 0) {
          setTimeUntilUpdate(`in ${nextSeconds}s`);
        } else if (nextMinutes === 1) {
          setTimeUntilUpdate(`in 1 min ${nextSeconds}s`);
        } else {
          setTimeUntilUpdate(`in ${nextMinutes} mins ${nextSeconds}s`);
        }
      } else {
        setTimeUntilUpdate('any moment...');
      }
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [lastUpdateTime, refreshTracking]);

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
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
        <div className="flex items-center text-muted-foreground">
          <Clock className="h-4 w-4 mr-2" />
          Updated <span className="font-medium text-foreground ml-1">{timeSinceUpdate}</span>
        </div>
        <div className="flex items-center text-muted-foreground">
          <Activity className="h-4 w-4 mr-2" />
          Next update <span className="font-medium text-foreground ml-1">
            {timeUntilUpdate === 'refreshing...' ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                refreshing...
              </span>
            ) : (
              timeUntilUpdate
            )}
          </span>
        </div>
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
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Distance</p>
                    <p className="text-xl font-semibold">{calculateRiderDistance(selectedRider)} km</p>
                  </div>
                  {selectedRider.status === 'in_progress' && selectedRider.average_speed && selectedRider.average_speed > 0 && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Elapsed Time</p>
                        <p className="text-xl font-semibold">{formatTime(selectedRider.elapsed_time || 0)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Speed</p>
                        <p className="text-xl font-semibold">{selectedRider.average_speed?.toFixed(1)} km/h</p>
                      </div>
                    </>
                  )}
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
                        
                        // Calculate elapsed time
                        let elapsedFormatted = '';
                        if (isStartCheckpoint) {
                          elapsedFormatted = '0m';
                        } else {
                          const elapsed = calculateElapsedTime(selectedRider.rider_no, checkpoint.time);
                          if (elapsed !== null) {
                            elapsedFormatted = formatElapsedTime(elapsed);
                          }
                        }
                        
                        return (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold">{checkpoint.name}</h4>
                                <p className="text-sm text-muted-foreground">Checkpoint #{index + 1}</p>
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