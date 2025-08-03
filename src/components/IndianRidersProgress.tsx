import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Activity } from 'lucide-react';
import { useGlobalData } from '../contexts';
import { getControlsForRider, getTotalDistanceForRider } from '../config/lel-route';

interface RiderPosition {
  rider_no: string;
  name: string;
  distance: number;
  status: 'in_progress' | 'finished' | 'dnf' | 'not_started';
  wave: string;
  lastCheckpoint: string;
  averageSpeed?: number;
}

const IndianRidersProgress: React.FC = () => {
  const { rawTrackingData } = useGlobalData();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Get Indian riders from the tracking data
  const indianRiders = rawTrackingData?.riders || [];

  // Calculate rider positions - filter to only show active riders
  const riderPositions: RiderPosition[] = indianRiders
    .filter((rider: any) => rider.status !== 'not_started') // Only show riders who have started
    .map((rider: any) => {
      let distance = 0;
      let lastCheckpoint = 'Start';

      if (rider.checkpoints && rider.checkpoints.length > 0) {
        const lastCP = rider.checkpoints[rider.checkpoints.length - 1];
        lastCheckpoint = lastCP.name;
        
        // Find the control distance
        const controls = getControlsForRider(rider.rider_no);
        const control = controls.find(c => 
          c.name === lastCP.name.replace(/\s+[NSEW]$/, '') ||
          c.name === lastCP.name ||
          (lastCP.name === 'Start' && c.km === 0)
        );
        
        if (control) {
          distance = control.km;
        }
      }

      return {
        rider_no: rider.rider_no,
        name: rider.name,
        distance,
        status: rider.status,
        wave: rider.rider_no.match(/^[A-Z]+/)?.[0] || '',
        lastCheckpoint,
        averageSpeed: rider.average_speed
      };
    })
    .sort((a: RiderPosition, b: RiderPosition) => b.distance - a.distance); // Sort by distance descending

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        // Calculate height based on number of riders, with min/max limits
        const riderHeight = Math.max(300, Math.min(800, riderPositions.length * 15));
        setDimensions({ width: width - 40, height: riderHeight });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [riderPositions.length]);

  // D3 visualization
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || riderPositions.length === 0) return;

    console.log('Rendering D3 with positions:', riderPositions);
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous content

    const margin = { top: 60, right: 40, bottom: 60, left: 60 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    // Create main group
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Get max distance for the route
    const maxDistance = riderPositions.length > 0 
      ? Math.max(...riderPositions.map(r => getTotalDistanceForRider(r.rider_no)))
      : 1540;

    // X scale (distance)
    const xScale = d3.scaleLinear()
      .domain([0, maxDistance])
      .range([0, width]);

    // Y scale (riders spread)
    const yScale = d3.scaleBand()
      .domain(riderPositions.map(r => r.rider_no))
      .range([0, height])
      .padding(0.5); // Increased padding for better spacing

    // Color scale for status
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['in_progress', 'finished', 'dnf', 'not_started'])
      .range(['#3b82f6', '#10b981', '#ef4444', '#9ca3af']);

    // Add track background
    g.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#f3f4f6')
      .attr('rx', 4);

    // Add distance axis
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d => `${d}km`)
      .ticks(10);

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .append('text')
      .attr('x', width / 2)
      .attr('y', 40)
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .style('font-weight', 'bold')
      .text('Distance (km)');

    // Add control points
    const controls = getControlsForRider('A1'); // Get standard controls
    controls.forEach(control => {
      const x = xScale(control.km);
      
      // Vertical line for control
      g.append('line')
        .attr('x1', x)
        .attr('x2', x)
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', '#d1d5db')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3');

      // Control label
      g.append('text')
        .attr('x', x)
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', '#6b7280')
        .text(control.name);
    });

    // Add rider tracks
    const tracks = g.selectAll('.rider-track')
      .data(riderPositions)
      .enter()
      .append('g')
      .attr('class', 'rider-track');

    // Track lines
    tracks.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', d => (yScale(d.rider_no) || 0) + yScale.bandwidth() / 2)
      .attr('y2', d => (yScale(d.rider_no) || 0) + yScale.bandwidth() / 2)
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 2);

    // Progress lines
    tracks.append('line')
      .attr('x1', 0)
      .attr('x2', d => xScale(d.distance))
      .attr('y1', d => (yScale(d.rider_no) || 0) + yScale.bandwidth() / 2)
      .attr('y2', d => (yScale(d.rider_no) || 0) + yScale.bandwidth() / 2)
      .attr('stroke', d => colorScale(d.status))
      .attr('stroke-width', 4)
      .attr('stroke-linecap', 'round');

    // Rider markers
    const markers = tracks.append('g')
      .attr('transform', d => 
        `translate(${xScale(d.distance)}, ${(yScale(d.rider_no) || 0) + yScale.bandwidth() / 2})`
      );

    // Marker circles
    markers.append('circle')
      .attr('r', 6) // Smaller circles
      .attr('fill', d => colorScale(d.status))
      .attr('stroke', 'white')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer');

    // Rider names - only show for riders who have made progress
    markers
      .filter(d => d.distance > 20) // Only show names for riders past 20km
      .append('text')
      .attr('x', -10)
      .attr('y', 0)
      .attr('text-anchor', 'end')
      .attr('alignment-baseline', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#374151')
      .text(d => d.name.split(' ').slice(-1)[0]); // Last name only

    // Distance labels - only for riders with progress
    markers
      .filter(d => d.distance > 0)
      .append('text')
      .attr('x', 12)
      .attr('y', 0)
      .attr('text-anchor', 'start')
      .attr('alignment-baseline', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#6b7280')
      .text(d => `${d.distance}km`);

    // Tooltips
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('padding', '8px 12px')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', '1000');

    markers
      .on('mouseover', function(event, d) {
        tooltip.transition()
          .duration(200)
          .style('opacity', 1);
        
        tooltip.html(`
          <div><strong>${d.name}</strong></div>
          <div>Rider: ${d.rider_no} | Wave: ${d.wave}</div>
          <div>Distance: ${d.distance}km</div>
          <div>Last CP: ${d.lastCheckpoint}</div>
          ${d.averageSpeed ? `<div>Avg Speed: ${d.averageSpeed.toFixed(1)}km/h</div>` : ''}
          <div>Status: ${d.status.replace('_', ' ')}</div>
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function() {
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      })
      .on('click', function(event, d) {
        event.stopPropagation();
        
        // Show persistent tooltip on click
        tooltip.transition()
          .duration(200)
          .style('opacity', 1);
        
        tooltip.html(`
          <div style="position: relative;">
            <button onclick="this.parentElement.parentElement.style.opacity='0'" 
                    style="position: absolute; right: -5px; top: -5px; 
                           background: white; color: black; border: none; 
                           border-radius: 50%; width: 20px; height: 20px; 
                           cursor: pointer; font-size: 12px;">×</button>
            <div><strong>${d.name}</strong></div>
            <div>Rider: ${d.rider_no} | Wave: ${d.wave}</div>
            <div>Distance: ${d.distance}km</div>
            <div>Last CP: ${d.lastCheckpoint}</div>
            ${d.averageSpeed ? `<div>Avg Speed: ${d.averageSpeed.toFixed(1)}km/h</div>` : ''}
            <div>Status: ${d.status.replace('_', ' ')}</div>
          </div>
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px')
          .style('pointer-events', 'auto');
      });

    // Hide tooltip when clicking elsewhere
    d3.select('body').on('click', function() {
      tooltip.transition()
        .duration(200)
        .style('opacity', 0);
    });

    // Cleanup tooltip on unmount
    return () => {
      d3.select('body').selectAll('.tooltip').remove();
    };
  }, [dimensions, riderPositions]);

  const inProgressCount = riderPositions.filter(r => r.status === 'in_progress').length;
  const finishedCount = riderPositions.filter(r => r.status === 'finished').length;
  const dnfCount = riderPositions.filter(r => r.status === 'dnf').length;

  if (!rawTrackingData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (indianRiders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Data Available</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">No Indian riders data available at the moment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Indian Riders Progress
            </CardTitle>
            <CardDescription>
              Linear visualization of all Indian riders' positions on the route
              {riderPositions.length > 0 && ` (${riderPositions.length} active riders)`}
            </CardDescription>
          </div>
          <div className="flex gap-4 text-sm">
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
      </CardHeader>
      <CardContent ref={containerRef} className="p-4">
        <svg ref={svgRef} width={dimensions.width} height={dimensions.height}></svg>
      </CardContent>
    </Card>
  );
};

export default IndianRidersProgress;