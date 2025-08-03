import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Clock, MapPin, Activity, Users, Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Create custom icons for different rider statuses
const createRiderIcon = (status: string, isEstimated: boolean = false) => {
  const colors: { [key: string]: string } = {
    in_progress: '#10b981',
    not_started: '#6b7280',
    finished: '#3b82f6',
    dnf: '#ef4444'
  };
  
  const color = colors[status] || colors.not_started;
  const opacity = isEstimated ? 0.7 : 1;
  
  return L.divIcon({
    className: 'rider-marker',
    html: `
      <div style="
        background-color: ${color};
        opacity: ${opacity};
        width: ${isEstimated ? '12px' : '16px'};
        height: ${isEstimated ? '12px' : '16px'};
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [isEstimated ? 12 : 16, isEstimated ? 12 : 16],
    iconAnchor: [isEstimated ? 6 : 8, isEstimated ? 6 : 8],
  });
};

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
}

interface Control {
  id: string;
  name: string;
  km: number;
  leg: 'North' | 'South';
  lat?: number;
  lon?: number;
}

interface RoutePoint {
  lat: number;
  lon: number;
  dist: number;
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

// Control coordinates (these would ideally come from the route data)
const controlCoordinates: { [key: string]: [number, number] } = {
  'Start': [51.51538, -0.09206],
  'Writtle': [51.7287, 0.4265],
  'London': [51.51538, -0.09206],
  'Northstowe': [52.2808, 0.0639],
  'Boston': [52.9789, -0.0265],
  'Louth': [53.3683, -0.0061],
  'Hessle': [53.7242, -0.4343],
  'Malton': [54.1352, -0.7967],
  'Richmond': [54.4033, -1.7336],
  'Brampton': [54.9406, -2.7361],
  'Hawick': [55.4216, -2.7853],
  'Moffat': [55.3309, -3.4425],
  'Dalkeith': [55.8931, -3.0678],
  'Innerleithen': [55.6194, -3.0619],
  'Eskdalemiur': [55.3167, -3.2667],
  'Henham': [51.9458, 0.2858]
};

// Component to fit map bounds
function FitBounds({ riders }: { riders: any[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (riders.length > 0) {
      const bounds = L.latLngBounds(riders.map(r => r.position));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [riders, map]);
  
  return null;
}

const IndianRidersMap: React.FC<{ trackingData: TrackingData | null; routeData: any }> = ({ trackingData, routeData }) => {
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);

  // Calculate rider positions
  const riderPositions = useMemo(() => {
    if (!trackingData || !routeData) return [];
    
    const positions: any[] = [];
    const currentTime = new Date();
    
    trackingData.riders.forEach(rider => {
      if (!rider.rider_no || !rider.name) return; // Skip riders without info
      
      let position: [number, number] | null = null;
      let isEstimated = false;
      let estimatedDistance = rider.distance_km;
      
      if (rider.status === 'not_started') {
        // Place at start based on wave
        const isLondonStart = rider.rider_no.startsWith('LA') || rider.rider_no.startsWith('LB') || 
                             rider.rider_no.startsWith('LC') || rider.rider_no.startsWith('LD') ||
                             rider.rider_no.startsWith('LE') || rider.rider_no.startsWith('LF') ||
                             rider.rider_no.startsWith('LG') || rider.rider_no.startsWith('LH');
        position = isLondonStart ? controlCoordinates['London'] : controlCoordinates['Writtle'];
      } else if (rider.status === 'in_progress' && rider.checkpoints.length > 0) {
        const lastCheckpoint = rider.checkpoints[rider.checkpoints.length - 1];
        
        // If at a control, use control position
        if (controlCoordinates[lastCheckpoint.name]) {
          position = controlCoordinates[lastCheckpoint.name];
          
          // Calculate estimated position if time has passed since checkpoint
          // Parse time like "Sunday 04:40"
          const checkpointTime = new Date(); // For now, simplified
          const elapsedHours = 2; // Simplified - in production, parse actual time
          const estimatedKm = 18 * elapsedHours; // 18 km/h average
          
          if (estimatedKm > 5) { // Only show estimated position if moved significantly
            isEstimated = true;
            estimatedDistance = rider.distance_km + estimatedKm;
            
            // Find position along route at estimated distance
            if (routeData && routeData[0] && routeData[0].coords) {
              const routeCoords = routeData[0].coords;
              for (let i = 0; i < routeCoords.length - 1; i++) {
                if (routeCoords[i].dist <= estimatedDistance && routeCoords[i + 1].dist > estimatedDistance) {
                  // Interpolate between points
                  const ratio = (estimatedDistance - routeCoords[i].dist) / 
                               (routeCoords[i + 1].dist - routeCoords[i].dist);
                  const lat = routeCoords[i].lat + (routeCoords[i + 1].lat - routeCoords[i].lat) * ratio;
                  const lon = routeCoords[i].lon + (routeCoords[i + 1].lon - routeCoords[i].lon) * ratio;
                  position = [lat, lon];
                  break;
                }
              }
            }
          }
        }
      }
      
      if (position) {
        positions.push({
          rider,
          position,
          isEstimated,
          estimatedDistance
        });
      }
    });
    
    return positions;
  }, [trackingData, routeData]);

  const statistics = useMemo(() => {
    if (!trackingData) return null;

    const total = trackingData.riders.filter(r => r.rider_no && r.name).length;
    const inProgress = trackingData.riders.filter(r => r.rider_no && r.name && r.status === 'in_progress').length;
    const notStarted = trackingData.riders.filter(r => r.rider_no && r.name && r.status === 'not_started').length;

    return { total, inProgress, notStarted };
  }, [trackingData]);

  if (!trackingData || !statistics) return null;

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total on Map</CardTitle>
            <Users className="h-4 w-4 text-primary opacity-50" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total}</div>
            <p className="text-xs text-muted-foreground">Indian riders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Route</CardTitle>
            <Navigation className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.inProgress}</div>
            <p className="text-xs text-muted-foreground">Currently riding</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Start</CardTitle>
            <MapPin className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{statistics.notStarted}</div>
            <p className="text-xs text-muted-foreground">Not started</p>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Live Rider Positions
          </CardTitle>
          <CardDescription>
            Indian riders shown at their last known control or estimated position (18 km/h avg)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[600px] w-full rounded-b-lg overflow-hidden">
            <MapContainer
              center={[52.5, -1.5]}
              zoom={6}
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Route line if available */}
              {routeData && routeData[0] && (
                <Polyline
                  positions={routeData[0].coords.map((coord: RoutePoint) => [coord.lat, coord.lon])}
                  color="#3b82f6"
                  weight={3}
                  opacity={0.4}
                />
              )}
              
              {/* Control points */}
              {Object.entries(controlCoordinates).map(([name, coords]) => (
                <Circle
                  key={name}
                  center={coords}
                  radius={2000}
                  pathOptions={{
                    color: '#6366f1',
                    fillColor: '#e0e7ff',
                    fillOpacity: 0.5,
                    weight: 2
                  }}
                >
                  <Popup>
                    <div className="font-semibold">{name}</div>
                  </Popup>
                </Circle>
              ))}
              
              {/* Rider markers */}
              {riderPositions.map(({ rider, position, isEstimated, estimatedDistance }) => (
                <Marker
                  key={rider.rider_no}
                  position={position}
                  icon={createRiderIcon(rider.status, isEstimated)}
                  eventHandlers={{
                    click: () => setSelectedRider(rider)
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <h3 className="font-bold text-lg">{rider.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{rider.rider_no}</p>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <Badge className={`text-xs ${
                            rider.status === 'in_progress' ? 'bg-green-500' :
                            rider.status === 'finished' ? 'bg-blue-500' :
                            rider.status === 'dnf' ? 'bg-red-500' :
                            'bg-gray-500'
                          } text-white`}>
                            {rider.status === 'in_progress' ? 'In Progress' :
                             rider.status === 'finished' ? 'Finished' :
                             rider.status === 'dnf' ? 'DNF' : 'Not Started'}
                          </Badge>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>Distance:</span>
                          <span className="font-semibold">
                            {isEstimated ? `~${estimatedDistance.toFixed(0)}` : rider.distance_km} km
                          </span>
                        </div>
                        
                        {rider.last_checkpoint && (
                          <div className="flex justify-between">
                            <span>Last checkpoint:</span>
                            <span className="font-semibold">{rider.last_checkpoint}</span>
                          </div>
                        )}
                        
                        {isEstimated && (
                          <div className="text-xs text-gray-500 mt-2">
                            * Estimated position at 18 km/h
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
              
              <FitBounds riders={riderPositions} />
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Map Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow"></div>
              <span>In Progress (at control)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 opacity-70 border-2 border-white shadow"></div>
              <span>In Progress (estimated)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-500 border-2 border-white shadow"></div>
              <span>Not Started</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-indigo-600"></div>
              <span>Control Point</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IndianRidersMap;