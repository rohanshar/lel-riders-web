import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { MapPin, Users, AlertCircle } from 'lucide-react';
import { useGlobalData } from '../contexts';
import { getControlsForRider, getTotalDistanceForRider, getWaveStartTime } from '../config/lel-route';

interface ApproximatedRider {
  rider_no: string;
  name: string;
  wave: string;
  status: 'in_progress' | 'finished' | 'dnf' | 'not_started';
  lastCheckpoint: {
    name: string;
    distance: number;
    arrival: string;
    departure?: string;
  };
  nextCheckpoint: {
    name: string;
    distance: number;
  };
  approximatedDistance: number;
  isApproximated: boolean;
  timeSinceLastUpdate: number; // minutes
  averageSpeed: number;
  confidence: 'high' | 'medium' | 'low';
}

const RouteVisualization: React.FC = () => {
  const { rawTrackingData, loading, errors, refreshTracking } = useGlobalData();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredRider, setHoveredRider] = useState<string | null>(null);

  // Fetch data on mount if not available
  useEffect(() => {
    if (!rawTrackingData && !loading.tracking && !errors.tracking) {
      refreshTracking();
    }
  }, [rawTrackingData, loading.tracking, errors.tracking, refreshTracking]);

  // Get Indian riders from the tracking data
  const indianRiders = rawTrackingData?.riders || [];

  // Calculate approximated positions for all riders
  const approximatedRiders = useMemo((): ApproximatedRider[] => {
    if (!indianRiders.length) return [];

    const currentTime = new Date();
    const results: ApproximatedRider[] = [];

    indianRiders.forEach((rider: any) => {
      // Skip riders who haven't started
      if (rider.status === 'not_started' || !rider.checkpoints || rider.checkpoints.length === 0) {
        return;
      }

      // Get rider's route controls
      const controls = getControlsForRider(rider.rider_no);
      const wave = rider.rider_no.match(/^[A-Z]+/)?.[0] || '';

      // Find last checkpoint with arrival time
      let lastCheckpointData: any = null;
      let lastCheckpointIndex = -1;
      
      for (let i = rider.checkpoints.length - 1; i >= 0; i--) {
        if (rider.checkpoints[i].time) {
          lastCheckpointData = rider.checkpoints[i];
          lastCheckpointIndex = i;
          break;
        }
      }

      if (!lastCheckpointData) return;

      // Find matching control for distance
      const lastControlName = lastCheckpointData.name.replace(/\s+[NSEW]$/, '');
      const lastControl = controls.find(c => 
        c.name === lastControlName || 
        c.name === lastCheckpointData.name ||
        (lastCheckpointData.name === 'Start' && c.km === 0)
      );

      if (!lastControl) return;

      // Find next control
      const currentControlIndex = controls.findIndex(c => c.name === lastControl.name);
      const nextControl = controls[currentControlIndex + 1];

      // Parse checkpoint time
      const checkpointTime = parseCheckpointTime(lastCheckpointData.time, rider.rider_no);
      if (!checkpointTime) return;

      // Calculate time since checkpoint
      const timeSinceMinutes = Math.floor((currentTime.getTime() - checkpointTime.getTime()) / (1000 * 60));

      let approximatedDistance = lastControl.km;
      let isApproximated = false;
      let confidence: 'high' | 'medium' | 'low' = 'high';

      // If rider has departed (either explicit departure time or been at control > 5 minutes)
      const hasDepart = lastCheckpointData.departure || timeSinceMinutes > 5;
      
      if (hasDepart && rider.status === 'in_progress' && nextControl) {
        // Calculate average speed (km/h)
        const avgSpeed = rider.average_speed || 15; // Default 15 km/h if not available
        
        // Estimate distance traveled since departure
        const timeSinceDeparture = lastCheckpointData.departure 
          ? timeSinceMinutes 
          : Math.max(0, timeSinceMinutes - 5); // Assume 5 min stop if no departure time
        
        const estimatedDistance = (timeSinceDeparture / 60) * avgSpeed;
        
        // Calculate approximated position, but cap before next control
        const maxDistance = nextControl.km - 2; // 2km buffer before next control
        approximatedDistance = Math.min(lastControl.km + estimatedDistance, maxDistance);
        isApproximated = true;

        // Determine confidence based on time since last update
        if (timeSinceMinutes < 60) {
          confidence = 'high';
        } else if (timeSinceMinutes < 180) {
          confidence = 'medium';
        } else {
          confidence = 'low';
        }
      }

      results.push({
        rider_no: rider.rider_no,
        name: rider.name,
        wave,
        status: rider.status,
        lastCheckpoint: {
          name: lastControl.name,
          distance: lastControl.km,
          arrival: lastCheckpointData.time,
          departure: lastCheckpointData.departure
        },
        nextCheckpoint: nextControl ? {
          name: nextControl.name,
          distance: nextControl.km
        } : {
          name: 'Finish',
          distance: getTotalDistanceForRider(rider.rider_no)
        },
        approximatedDistance,
        isApproximated,
        timeSinceLastUpdate: timeSinceMinutes,
        averageSpeed: rider.average_speed || 15,
        confidence
      });
    });

    // Sort by distance (furthest first)
    return results.sort((a, b) => b.approximatedDistance - a.approximatedDistance);
  }, [indianRiders]);

  // Update dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        // Height based on route distance - about 0.8px per km
        const maxDistance = 1604; // Maximum possible distance
        const height = maxDistance * 0.8 + 200; // Extra space for labels
        setDimensions({ width: Math.max(width - 40, 400), height });
      }
    };

    setTimeout(updateDimensions, 100);
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // D3 Visualization
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || approximatedRiders.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 60, right: 120, bottom: 60, left: 120 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Get max distance for scale
    const maxDistance = Math.max(...approximatedRiders.map(r => 
      getTotalDistanceForRider(r.rider_no)
    ));

    // Y scale (distance) - inverted so start is at top
    const yScale = d3.scaleLinear()
      .domain([0, maxDistance])
      .range([0, height]);

    // Add route background (the "road")
    const roadWidth = width * 0.6;
    const roadX = (width - roadWidth) / 2;

    // Road gradient for visual effect
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'road-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#e5e7eb');
    gradient.append('stop')
      .attr('offset', '15%')
      .attr('stop-color', '#f3f4f6');
    gradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', '#f9fafb');
    gradient.append('stop')
      .attr('offset', '85%')
      .attr('stop-color', '#f3f4f6');
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#e5e7eb');

    // Draw the road
    g.append('rect')
      .attr('x', roadX)
      .attr('y', 0)
      .attr('width', roadWidth)
      .attr('height', height)
      .attr('fill', 'url(#road-gradient)')
      .attr('stroke', '#d1d5db')
      .attr('stroke-width', 2)
      .attr('rx', 4);

    // Add center line (dashed)
    g.append('line')
      .attr('x1', width / 2)
      .attr('x2', width / 2)
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#9ca3af')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '10,10')
      .attr('opacity', 0.5);

    // Add control points
    const controls = getControlsForRider('A1'); // Get standard controls
    
    controls.forEach(control => {
      const y = yScale(control.km);
      
      // Control station (horizontal bar)
      g.append('rect')
        .attr('x', roadX - 20)
        .attr('y', y - 4)
        .attr('width', roadWidth + 40)
        .attr('height', 8)
        .attr('fill', '#6b7280')
        .attr('stroke', '#374151')
        .attr('stroke-width', 2)
        .attr('rx', 4);

      // Control name (left side)
      g.append('text')
        .attr('x', roadX - 30)
        .attr('y', y)
        .attr('text-anchor', 'end')
        .attr('alignment-baseline', 'middle')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('fill', '#111827')
        .text(control.name);

      // Distance (right side)
      g.append('text')
        .attr('x', roadX + roadWidth + 30)
        .attr('y', y)
        .attr('text-anchor', 'start')
        .attr('alignment-baseline', 'middle')
        .attr('font-size', '11px')
        .attr('fill', '#6b7280')
        .text(`${control.km}km`);
    });

    // Color scale for rider status
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['in_progress', 'finished', 'dnf'])
      .range(['#3b82f6', '#10b981', '#ef4444']);

    // Add riders
    const riderGroups = g.selectAll('.rider')
      .data(approximatedRiders)
      .enter()
      .append('g')
      .attr('class', 'rider')
      .attr('transform', d => {
        const y = yScale(d.approximatedDistance);
        // Spread riders horizontally to avoid overlap
        const baseX = width / 2;
        const offset = (Math.random() - 0.5) * roadWidth * 0.6;
        return `translate(${baseX + offset}, ${y})`;
      });

    // Rider markers
    riderGroups.append('circle')
      .attr('r', d => hoveredRider === d.rider_no ? 8 : 6)
      .attr('fill', d => colorScale(d.status))
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .attr('opacity', d => {
        if (!d.isApproximated) return 1;
        switch (d.confidence) {
          case 'high': return 0.9;
          case 'medium': return 0.7;
          case 'low': return 0.5;
        }
      })
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => setHoveredRider(d.rider_no))
      .on('mouseout', () => setHoveredRider(null));

    // Approximation indicator (pulsing ring for approximated positions)
    riderGroups
      .filter(d => d.isApproximated)
      .append('circle')
      .attr('r', 10)
      .attr('fill', 'none')
      .attr('stroke', d => colorScale(d.status))
      .attr('stroke-width', 1)
      .attr('opacity', 0.5)
      .style('animation', 'pulse 2s infinite');

    // Wave labels (for leading riders)
    riderGroups
      .filter((d, i) => i < 20) // Only top 20 riders
      .append('text')
      .attr('x', 12)
      .attr('y', 0)
      .attr('alignment-baseline', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', '#374151')
      .text(d => d.wave);

    // Tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('padding', '12px')
      .style('background', 'rgba(0, 0, 0, 0.9)')
      .style('color', 'white')
      .style('border-radius', '6px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', '1000');

    riderGroups
      .on('mouseover', function(event, d) {
        tooltip.transition()
          .duration(200)
          .style('opacity', 1);
        
        const statusText = d.isApproximated 
          ? `Approx. ${d.approximatedDistance.toFixed(1)}km (${d.confidence} confidence)`
          : `At ${d.lastCheckpoint.name} (${d.lastCheckpoint.distance}km)`;
        
        tooltip.html(`
          <div style="font-weight: bold; margin-bottom: 4px">${d.name}</div>
          <div>Rider: ${d.rider_no} (Wave ${d.wave})</div>
          <div>Status: ${d.status.replace('_', ' ')}</div>
          <div>${statusText}</div>
          <div>Last update: ${d.timeSinceLastUpdate}min ago</div>
          <div>Avg speed: ${d.averageSpeed.toFixed(1)}km/h</div>
          <div style="margin-top: 4px; font-size: 11px">
            Next: ${d.nextCheckpoint.name} (${d.nextCheckpoint.distance}km)
          </div>
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function() {
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });

    // Add CSS for pulsing animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { r: 10; opacity: 0.5; }
        50% { r: 15; opacity: 0.2; }
        100% { r: 10; opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);

    // Cleanup
    return () => {
      d3.select('body').selectAll('.tooltip').remove();
      style.remove();
    };
  }, [dimensions, approximatedRiders, hoveredRider]);

  // Loading state
  if (loading.tracking || !rawTrackingData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Route Visualization...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (errors.tracking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-red-600">{errors.tracking.message || 'Failed to load tracking data'}</p>
          <div className="flex justify-center mt-4">
            <button 
              onClick={() => refreshTracking()}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeCount = approximatedRiders.length;
  const inProgressCount = approximatedRiders.filter(r => r.status === 'in_progress').length;
  const finishedCount = approximatedRiders.filter(r => r.status === 'finished').length;
  const dnfCount = approximatedRiders.filter(r => r.status === 'dnf').length;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Indian Riders - Route Visualization
            </CardTitle>
            <CardDescription>
              Live positions of riders along the LEL route (scroll to follow the journey)
            </CardDescription>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{activeCount} active riders</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>In Progress ({inProgressCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Finished ({finishedCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>DNF ({dnfCount})</span>
            </div>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="h-3 w-3" />
          <span>Positions between checkpoints are approximated based on average speed</span>
        </div>
      </CardHeader>
      <CardContent ref={containerRef} className="p-4 overflow-auto" style={{ maxHeight: '80vh' }}>
        <svg ref={svgRef} width={dimensions.width} height={dimensions.height}></svg>
      </CardContent>
    </Card>
  );
};

// Helper function to parse checkpoint time
function parseCheckpointTime(timeStr: string, riderNo: string): Date | null {
  try {
    // Get current UK time for reference
    const ukTimeString = new Date().toLocaleString('en-US', { 
      timeZone: 'Europe/London',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const [datePart, timePart] = ukTimeString.split(', ');
    const [month, day, year] = datePart.split('/');
    const [hours, minutes, seconds] = timePart.split(':');
    const currentUKTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds));

    // Event starts on Sunday August 3, 2025
    const eventStartDate = new Date('2025-08-03');
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    let checkpointDate: Date;

    if (timeStr.includes('/')) {
      // Format: "3/8 19:32"
      const [date, time] = timeStr.split(' ');
      const [dayNum, monthNum] = date.split('/');
      const [hrs, mins] = time.split(':');
      checkpointDate = new Date(currentUKTime.getFullYear(), parseInt(monthNum) - 1, parseInt(dayNum), parseInt(hrs), parseInt(mins));
    } else {
      // Format: "Sunday 08:46"
      const parts = timeStr.split(' ');
      const dayName = parts[0];
      const time = parts[parts.length - 1];
      const [hrs, mins] = time.split(':').map(Number);
      
      const eventDayIndex = eventStartDate.getDay();
      const checkpointDayIndex = dayNames.indexOf(dayName);
      
      if (checkpointDayIndex >= 0) {
        let dayOffset = checkpointDayIndex - eventDayIndex;
        if (dayOffset < 0) dayOffset += 7;
        
        checkpointDate = new Date(eventStartDate);
        checkpointDate.setDate(checkpointDate.getDate() + dayOffset);
        checkpointDate.setHours(hrs, mins, 0, 0);
      } else {
        return null;
      }
    }

    return checkpointDate;
  } catch (error) {
    console.error('Error parsing checkpoint time:', error);
    return null;
  }
}

export default RouteVisualization;