import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Bike, MapPin, Navigation, Activity } from 'lucide-react';

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

// Create numbered icons for checkpoints
const createNumberedIcon = (number: number) => {
  return L.divIcon({
    className: 'numbered-marker',
    html: `${number}`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

interface RoutePoint {
  id: number;
  lat: number;
  lon: number;
  dist: number;
  elev: number;
  checkpoint?: string;
}

interface Route {
  id: number;
  name: string;
  colour: string;
  coords: RoutePoint[];
}

// Component to fit map bounds to route
function FitBounds({ coords }: { coords: RoutePoint[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords.map(coord => [coord.lat, coord.lon]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coords, map]);
  
  return null;
}

const RouteMap: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<number>(0);

  useEffect(() => {
    fetch('https://lel-riders-data-2025.s3.ap-south-1.amazonaws.com/routes.json')
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch route data');
        return response.json();
      })
      .then(data => {
        setRoutes(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[600px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center min-h-[600px]">
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error loading route</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );

  if (routes.length === 0) return (
    <div className="flex justify-center items-center min-h-[600px]">
      <Card>
        <CardHeader>
          <CardTitle>No routes found</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );

  // Collect all checkpoints from all routes
  const allCheckpoints: RoutePoint[] = [];
  const allCoords: RoutePoint[] = [];
  
  routes.forEach(route => {
    const routeCheckpoints = route.coords.filter(point => point.checkpoint);
    allCheckpoints.push(...routeCheckpoints);
    allCoords.push(...route.coords);
  });

  // Sort checkpoints by distance to maintain the order
  const checkpoints = allCheckpoints.sort((a, b) => a.dist - b.dist);
  
  // Add return leg indicators to checkpoint names
  const processedCheckpoints = checkpoints.map((checkpoint, index) => {
    // Check if this is a return leg control by looking for duplicates
    const sameNameCheckpoints = checkpoints.filter(cp => cp.checkpoint === checkpoint.checkpoint);
    if (sameNameCheckpoints.length > 1) {
      // This is a control visited twice (outbound and return)
      const isReturn = checkpoint.dist > sameNameCheckpoints[0].dist;
      return {
        ...checkpoint,
        displayName: isReturn ? `${checkpoint.checkpoint} (Return)` : checkpoint.checkpoint
      };
    }
    return {
      ...checkpoint,
      displayName: checkpoint.checkpoint
    };
  });
  
  // Use the first route for display purposes
  const currentRoute = routes[0] || { coords: [], colour: '#3428e2' };
  const totalDistance = Math.max(...allCoords.map(c => c.dist), 0);

  return (
    <div className="space-y-6">
      {/* Map Container */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            LEL 2025 Route Map
          </CardTitle>
          <CardDescription>
            Interactive map showing the full route from London/Writtle to Edinburgh and back (1537-1557km)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[600px] w-full rounded-b-lg overflow-hidden">
            <MapContainer
              center={[52.0, -1.0]}
              zoom={6}
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Route polylines - show all routes */}
              {routes.map((route, index) => (
                <Polyline
                  key={route.id}
                  positions={route.coords.map(coord => [coord.lat, coord.lon])}
                  color={route.colour || '#3428e2'}
                  weight={2}
                  opacity={0.7}
                />
              ))}
              
              {/* Checkpoint markers */}
              {processedCheckpoints.map((checkpoint, index) => (
                <Marker
                  key={`${checkpoint.id}-${index}`}
                  position={[checkpoint.lat, checkpoint.lon]}
                  icon={createNumberedIcon(index + 1)}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold text-lg">#{index + 1} - {checkpoint.displayName}</h3>
                      <p className="text-sm">Distance: {checkpoint.dist.toFixed(1)} km</p>
                      <p className="text-sm">Elevation: {checkpoint.elev.toFixed(0)} m</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
              
              <FitBounds coords={allCoords} />
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Checkpoints List */}
      <Card>
        <CardHeader>
          <CardTitle>Control Points</CardTitle>
          <CardDescription>
            All checkpoints along the route including both outbound and return journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processedCheckpoints.map((checkpoint, index) => {
              const isReturn = checkpoint.displayName?.includes('(Return)');
              return (
                <div 
                  key={`${checkpoint.id}-${index}`} 
                  className={`flex items-center gap-3 p-3 rounded-lg border bg-card hover:shadow-md transition-shadow ${
                    isReturn ? 'border-orange-200 bg-orange-50/50' : ''
                  }`}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    isReturn ? 'bg-orange-500/10' : 'bg-primary/10'
                  }`}>
                    <span className={`text-sm font-bold ${isReturn ? 'text-orange-600' : 'text-primary'}`}>
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{checkpoint.displayName}</h4>
                    <div className="flex gap-3 text-sm text-muted-foreground">
                      <span>{checkpoint.dist.toFixed(1)} km</span>
                      <span>•</span>
                      <span>{checkpoint.elev.toFixed(0)}m elev</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RouteMap;