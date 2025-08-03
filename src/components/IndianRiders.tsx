import React, { useState, useEffect, useMemo } from 'react';
import { Clock, TrendingUp, TrendingDown, Users, MapPin, Activity, ChevronRight, Search, AlertCircle, CheckCircle, XCircle, Loader2, Map, List, Table } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import IndianRidersMap from './IndianRidersMap';
import IndianRidersTable from './IndianRidersTable';
import { 
  isLondonStartRider, 
  getCheckpointDistance, 
  getTotalDistanceForRider,
  getWaveStartTime,
  getControlsForRider
} from '../config/lel-route';

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

interface TrackingData {
  event: {
    name: string;
    distance_km: number;
    controls: Control[];
  };
  last_updated: string;
  riders: Rider[];
}

const IndianRiders: React.FC = () => {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedView, setSelectedView] = useState('progress');
  const [sortBy, setSortBy] = useState('distance');
  const [showMap, setShowMap] = useState(false);
  const [routeData, setRouteData] = useState<any>(null);
  const [londonTime, setLondonTime] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://lel-riders-data-2025.s3.ap-south-1.amazonaws.com/indian-riders-tracking.json');
        if (!response.ok) throw new Error('Failed to fetch tracking data');
        const data = await response.json();
        setTrackingData(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchData();
    // Refresh data every 2 minutes for more frequent updates
    const interval = setInterval(fetchData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch route data for map
  useEffect(() => {
    if (showMap) {
      fetch('https://lel-riders-data-2025.s3.ap-south-1.amazonaws.com/routes.json')
        .then(res => res.json())
        .then(setRouteData)
        .catch(console.error);
    }
  }, [showMap]);

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

  const processedRiders = useMemo(() => {
    if (!trackingData) return [];

    return trackingData.riders.map(rider => {
      // Calculate current checkpoint
      const currentCheckpoint = rider.last_checkpoint || 'Not Started';

      // Calculate elapsed time and average speed for in_progress riders
      let elapsedTime = 0;
      let averageSpeed = 0;
      let estimatedDistance = rider.distance_km;

      // Calculate actual distance from checkpoint if not provided
      let actualDistance = rider.distance_km;
      if (rider.last_checkpoint && rider.distance_km === 0) {
        const checkpointDist = getCheckpointDistance(rider.last_checkpoint, rider.rider_no);
        if (checkpointDist > 0) {
          actualDistance = checkpointDist;
          estimatedDistance = checkpointDist;
        }
      }
      
      if (rider.checkpoints.length > 0 || rider.status === 'in_progress' || rider.status === 'finished') {
        // For in_progress riders with no checkpoints yet, create a virtual start checkpoint
        let startCheckpoint = rider.checkpoints.length > 0 ? rider.checkpoints[0] : null;
        
        // If rider is in_progress but has no checkpoints, use their wave start time
        if (!startCheckpoint && rider.status === 'in_progress') {
          const startTimeStr = getWaveStartTime(rider.rider_no);
          startCheckpoint = { name: 'Start', time: `Sunday ${startTimeStr}` };
        }
        
        if (startCheckpoint) {
          // Parse time format like "Sunday 04:40"
          const parseTime = (timeStr: string) => {
            const parts = timeStr.split(' ');
            if (parts.length >= 2) {
              const timePart = parts[parts.length - 1];
              const [hours, minutes] = timePart.split(':').map(Number);
              // Event is in UK time (BST = UTC+1)
              // Get the current UK date
              const ukNow = new Date();
              const ukFormatter = new Intl.DateTimeFormat('en-GB', {
                timeZone: 'Europe/London',
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
              });
              const ukDateParts = ukFormatter.formatToParts(ukNow);
              const ukYear = parseInt(ukDateParts.find(p => p.type === 'year')!.value);
              const ukMonth = parseInt(ukDateParts.find(p => p.type === 'month')!.value) - 1; // JS months are 0-indexed
              const ukDay = parseInt(ukDateParts.find(p => p.type === 'day')!.value);
              
              // Create date for the checkpoint time
              const eventStartDate = new Date(ukYear, ukMonth, ukDay, hours, minutes, 0, 0);
              
              // If the checkpoint time is in the future (e.g., checkpoint says 07:23 but current time is 07:44),
              // it means the checkpoint was from earlier today
              if (eventStartDate > ukNow) {
                // Use today's date
                return eventStartDate;
              }
              
              return eventStartDate;
            }
            return null;
          };
          
          const startTime = parseTime(startCheckpoint.time);
          if (startTime) {
            // Get current UK time - fix the time zone conversion
            const now = new Date();
            const ukFormatter = new Intl.DateTimeFormat('en-GB', {
              timeZone: 'Europe/London',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            });
            
            const ukParts = ukFormatter.formatToParts(now);
            const ukTime = new Date(
              parseInt(ukParts.find(p => p.type === 'year')!.value),
              parseInt(ukParts.find(p => p.type === 'month')!.value) - 1,
              parseInt(ukParts.find(p => p.type === 'day')!.value),
              parseInt(ukParts.find(p => p.type === 'hour')!.value),
              parseInt(ukParts.find(p => p.type === 'minute')!.value),
              parseInt(ukParts.find(p => p.type === 'second')!.value)
            );
            
            elapsedTime = Math.floor((ukTime.getTime() - startTime.getTime()) / 1000 / 60); // minutes
            
            // Make sure elapsed time is positive
            if (elapsedTime < 0) elapsedTime = 0;
            
            if (actualDistance > 0 && elapsedTime > 0) {
              averageSpeed = actualDistance / (elapsedTime / 60); // km/h
            }
            
            // Always calculate estimated distance based on elapsed time
            if (elapsedTime > 0) {
              // If they have recorded distance, estimate from their last checkpoint
              if (actualDistance > 0) {
                // Find time since last checkpoint
                const lastCheckpoint = rider.checkpoints[rider.checkpoints.length - 1];
                if (lastCheckpoint) {
                  const lastCheckpointTime = parseTime(lastCheckpoint.time);
                  if (lastCheckpointTime) {
                    const timeSinceLastCheckpoint = Math.floor((ukTime.getTime() - lastCheckpointTime.getTime()) / 1000 / 60); // minutes
                    // Estimate distance covered since last checkpoint at 18 km/h
                    const distanceSinceLastCheckpoint = Math.min(18 * (timeSinceLastCheckpoint / 60), 200); // Cap at 200km
                    estimatedDistance = actualDistance + distanceSinceLastCheckpoint;
                  }
                }
              } else {
                // If no distance recorded yet, estimate based on 18 km/h average from start
                estimatedDistance = Math.min(18 * (elapsedTime / 60), 200); // Cap initial estimate at 200km
              }
            }
          }
        }
      }

      return {
        ...rider,
        distance_km: actualDistance,
        current_checkpoint: currentCheckpoint,
        elapsed_time: elapsedTime,
        average_speed: averageSpeed,
        estimated_distance: estimatedDistance
      };
    });
  }, [trackingData]);

  const filteredRiders = useMemo(() => {
    let riders = processedRiders;

    // Apply search filter
    if (searchTerm) {
      riders = riders.filter(rider =>
        rider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rider.rider_no.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort riders
    switch (sortBy) {
      case 'distance':
        return riders.sort((a, b) => b.distance_km - a.distance_km);
      case 'name':
        return riders.sort((a, b) => a.name.localeCompare(b.name));
      case 'rider_no':
        return riders.sort((a, b) => a.rider_no.localeCompare(b.rider_no));
      case 'status':
        const statusOrder = { in_progress: 0, finished: 1, not_started: 2, dnf: 3 };
        return riders.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
      default:
        return riders;
    }
  }, [processedRiders, searchTerm, sortBy]);

  const statistics = useMemo(() => {
    if (!trackingData) return null;

    const total = trackingData.riders.length;
    const inProgress = trackingData.riders.filter(r => r.status === 'in_progress').length;
    const finished = trackingData.riders.filter(r => r.status === 'finished').length;
    const dnf = trackingData.riders.filter(r => r.status === 'dnf').length;
    const notStarted = trackingData.riders.filter(r => r.status === 'not_started').length;

    return { total, inProgress, finished, dnf, notStarted };
  }, [trackingData]);

  const formatTime = (minutes: number) => {
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = minutes % 60;
    
    if (days > 0) {
      return `${days}d ${hours}h ${mins}m`;
    }
    return `${hours}h ${mins}m`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Badge className="bg-green-500 text-white">In Progress</Badge>;
      case 'finished':
        return <Badge className="bg-blue-500 text-white">Finished</Badge>;
      case 'dnf':
        return <Badge className="bg-red-500 text-white">DNF</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">Not Started</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Loader2 className="h-4 w-4 animate-spin text-green-500" />;
      case 'finished':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'dnf':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[600px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center min-h-[600px]">
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error loading tracking data</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );

  if (!trackingData || !statistics) return null;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Riders</CardTitle>
            <Users className="h-4 w-4 text-primary opacity-50" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total}</div>
            <p className="text-xs text-muted-foreground">Indian participants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Loader2 className="h-4 w-4 text-green-500 animate-spin" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.inProgress}</div>
            <p className="text-xs text-muted-foreground">Currently riding</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finished</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statistics.finished}</div>
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

      {/* London Time Display */}
      <div className="bg-gray-100 rounded-lg p-3 text-center">
        <div className="text-sm text-gray-600">London Time</div>
        <div className="text-lg font-semibold">{londonTime}</div>
      </div>

      {/* Last Updated and View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="h-4 w-4 mr-2" />
          Last updated: {new Date(trackingData.last_updated).toLocaleString()}
        </div>
        <div className="flex gap-2">
          <Button
            variant={!showMap ? "default" : "outline"}
            size="sm"
            onClick={() => setShowMap(false)}
            className="flex items-center gap-2"
          >
            <List className="h-4 w-4" />
            List
          </Button>
          <Button
            variant={showMap ? "default" : "outline"}
            size="sm"
            onClick={() => setShowMap(true)}
            className="flex items-center gap-2"
          >
            <Map className="h-4 w-4" />
            Map
          </Button>
        </div>
      </div>

      {/* Map or List View */}
      {showMap ? (
        <IndianRidersMap trackingData={trackingData} routeData={routeData} />
      ) : (
        <>
          {/* Filters and Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search by name or rider number..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="distance">Sort by Distance</option>
                  <option value="name">Sort by Name</option>
                  <option value="rider_no">Sort by Rider No</option>
                  <option value="status">Sort by Status</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for different views */}
          <Tabs value={selectedView} onValueChange={setSelectedView}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="progress">Progress View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-4">
          {filteredRiders.map((rider, index) => (
            <Card 
              key={rider.rider_no} 
              className="cursor-pointer hover:shadow-md transition-shadow border-gray-200"
              onClick={() => setSelectedRider(rider)}
            >
              <CardContent className="p-6">
                <div className="space-y-3">
                  {/* Header Section */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold">
                        #{index + 1} {rider.name}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                        <span>Bib: {rider.rider_no}</span>
                        <span>Wave: {rider.rider_no.match(/^[A-Z]+/)?.[0] || ''}</span>
                        <span>Started: {(() => {
                          // Extract start time from rider data or use wave default
                          if (rider.checkpoints.length > 0) {
                            return rider.checkpoints[0].time.split(' ')[1];
                          }
                          return getWaveStartTime(rider.rider_no);
                        })()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {rider.elapsed_time !== undefined && rider.elapsed_time > 0 && (
                        <div className="text-sm text-gray-600">
                          Elapsed: {formatTime(rider.elapsed_time)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Current Location */}
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-600" />
                    <span>Current Location: <strong>{rider.current_checkpoint || 'Start'}</strong></span>
                  </div>

                  {/* Progress Bar with Controls */}
                  {(rider.status === 'in_progress' || rider.status === 'finished' || rider.status === 'not_started') && (() => {
                    // Get route information for this rider
                    const controlDistances = getControlsForRider(rider.rider_no);
                    const totalDistance = getTotalDistanceForRider(rider.rider_no);
                    
                    return (
                      <div className="mt-3">
                        <div className="relative">
                          {/* Progress bar background */}
                          <div className="w-full bg-gray-200 h-2">
                            {/* Show estimated progress for all riders */}
                            {(() => {
                              const showEstimated = rider.estimated_distance !== undefined && rider.estimated_distance > 0;
                              const estimatedWidth = showEstimated ? Math.min((rider.estimated_distance / totalDistance) * 100, 100) : 0;
                              const actualWidth = rider.distance_km > 0 ? Math.min((rider.distance_km / totalDistance) * 100, 100) : 0;
                              
                              return (
                                <>
                                  {showEstimated && (
                                    <div
                                      className="bg-blue-300 h-2 transition-all duration-300"
                                      style={{ width: `${estimatedWidth}%` }}
                                    />
                                  )}
                                  {rider.distance_km > 0 && (
                                    <div
                                      className="absolute top-0 bg-blue-500 h-2 transition-all duration-300"
                                      style={{ width: `${actualWidth}%` }}
                                    />
                                  )}
                                </>
                              );
                            })()}
                          </div>
                          
                          {/* Control point markers */}
                          <div className="absolute top-0 w-full h-2">
                            {controlDistances.slice(0, 6).map((control) => (
                              <div
                                key={`${control.name}-${control.km}`}
                                className="absolute top-0"
                                style={{ left: `${(control.km / totalDistance) * 100}%` }}
                              >
                                <div className="w-0.5 h-2 bg-gray-400"></div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Control labels with distances */}
                        <div className="flex justify-between mt-1">
                          {controlDistances.slice(0, 5).map((control, index) => {
                            const isReached = rider.distance_km >= control.km;
                            const prevControl = index > 0 ? controlDistances[index - 1] : null;
                            const distance = prevControl ? control.km - prevControl.km : control.km;
                            
                            return (
                              <div key={`${control.name}-${index}`} className="text-center">
                                <div className={`text-xs ${isReached ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                                  {control.name}
                                </div>
                                {index > 0 && (
                                  <div className="text-xs text-gray-400 mt-0.5">
                                    {distance} km
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Average Speed and Legend */}
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      <span>
                        Average Speed: {rider.average_speed > 0 ? `${rider.average_speed.toFixed(1)} km/h` : '0.0 km/h'}
                      </span>
                    </div>
                    {rider.estimated_distance && rider.estimated_distance > rider.distance_km && (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 bg-blue-300"></div>
                        <span>Estimated @ 18 km/h</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          {trackingData.event.controls.slice(0, 10).map((control) => {
            const ridersAtControl = filteredRiders.filter(rider => {
              // Check if any checkpoint matches this control name
              return rider.checkpoints.some(cp => {
                // The checkpoint might be the control name or might contain it
                return cp.name === control.name || 
                       cp.name.includes(control.name) || 
                       (control.name === 'Writtle' && cp.name === 'Start');
              });
            });

            return (
              <Card key={control.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {control.name} ({control.km} km)
                  </CardTitle>
                  <CardDescription>{control.leg} Leg</CardDescription>
                </CardHeader>
                <CardContent>
                  {ridersAtControl.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No riders reached yet</p>
                  ) : (
                    <div className="space-y-2">
                      {ridersAtControl.map(rider => {
                        const checkpoint = rider.checkpoints.find(cp => 
                          cp.name === control.name || 
                          cp.name.includes(control.name) || 
                          (control.name === 'Writtle' && cp.name === 'Start')
                        );
                        if (!checkpoint) return null;

                        return (
                          <div 
                            key={rider.rider_no} 
                            className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer"
                            onClick={() => setSelectedRider(rider)}
                          >
                            <div className="flex items-center gap-3">
                              {getStatusIcon(rider.status)}
                              <span className="font-medium">{rider.name}</span>
                              <span className="text-sm text-muted-foreground">({rider.rider_no})</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <span>{checkpoint.time}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
        
        <TabsContent value="table" className="mt-4">
          <IndianRidersTable 
            riders={filteredRiders}
            onRiderClick={setSelectedRider}
          />
        </TabsContent>
      </Tabs>
        </>
      )}

      {/* Rider Detail Dialog */}
      <Dialog open={!!selectedRider} onOpenChange={(open: boolean) => !open && setSelectedRider(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedRider && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {selectedRider.name}
                </DialogTitle>
                <DialogDescription>
                  <div className="flex items-center gap-4 mt-2">
                    <span>Rider No: {selectedRider.rider_no}</span>
                    {getStatusBadge(selectedRider.status)}
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Distance</p>
                    <p className="text-xl font-semibold">{selectedRider.distance_km} km</p>
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
                    <span>{((selectedRider.distance_km / trackingData.event.distance_km) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full"
                      style={{ width: `${Math.min((selectedRider.distance_km / trackingData.event.distance_km) * 100, 100)}%` }}
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
                      {selectedRider.checkpoints.map((checkpoint, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold">{checkpoint.name}</h4>
                              <p className="text-sm text-muted-foreground">Checkpoint #{index + 1}</p>
                            </div>
                            <Badge variant="outline">{checkpoint.time}</Badge>
                          </div>
                        </div>
                      ))}
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