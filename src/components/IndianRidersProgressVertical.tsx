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

const IndianRidersProgressVertical: React.FC = () => {
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
        // Fixed height for vertical layout
        setDimensions({ width: width - 40, height: 800 });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // D3 visualization
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || riderPositions.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous content

    const margin = { top: 20, right: 120, bottom: 40, left: 160 };
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

    // Y scale (distance) - inverted so 0 is at bottom
    const yScale = d3.scaleLinear()
      .domain([0, maxDistance])
      .range([height, 0]);

    // X scale (riders)
    const xScale = d3.scaleBand()
      .domain(riderPositions.map(r => r.rider_no))
      .range([0, width])
      .padding(0.1);

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
      .attr('fill', '#f9fafb')
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 1)
      .attr('rx', 4);

    // Add distance axis (left side)
    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d => `${d}km`)
      .ticks(20);

    g.append('g')
      .call(yAxis)
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -height / 2)
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .style('font-weight', 'bold')
      .text('Distance (km)');

    // Add control points as horizontal lines
    const controls = getControlsForRider('A1'); // Get standard controls
    controls.forEach(control => {
      const y = yScale(control.km);
      
      // Horizontal line for control
      g.append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', y)
        .attr('y2', y)
        .attr('stroke', '#e5e7eb')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3');

      // Control label on the right
      g.append('text')
        .attr('x', width + 5)
        .attr('y', y)
        .attr('alignment-baseline', 'middle')
        .attr('font-size', '11px')
        .attr('fill', '#6b7280')
        .text(control.name);
    });

    // Add rider columns
    const riderColumns = g.selectAll('.rider-column')
      .data(riderPositions)
      .enter()
      .append('g')
      .attr('class', 'rider-column');

    // Background columns (full height)
    riderColumns.append('rect')
      .attr('x', d => xScale(d.rider_no) || 0)
      .attr('y', 0)
      .attr('width', xScale.bandwidth())
      .attr('height', height)
      .attr('fill', '#f3f4f6')
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 0.5)
      .attr('rx', 2);

    // Progress bars
    riderColumns.append('rect')
      .attr('x', d => xScale(d.rider_no) || 0)
      .attr('y', d => yScale(d.distance))
      .attr('width', xScale.bandwidth())
      .attr('height', d => height - yScale(d.distance))
      .attr('fill', d => colorScale(d.status))
      .attr('opacity', 0.8)
      .attr('rx', 2);

    // Rider markers at current position
    const markers = riderColumns.append('g')
      .attr('transform', d => 
        `translate(${(xScale(d.rider_no) || 0) + xScale.bandwidth() / 2}, ${yScale(d.distance)})`
      );

    // Marker circles
    markers.append('circle')
      .attr('r', xScale.bandwidth() / 2 - 2)
      .attr('fill', d => colorScale(d.status))
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    // Current distance labels above markers
    markers
      .filter(d => d.distance > 0)
      .append('text')
      .attr('y', -8)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', d => colorScale(d.status))
      .text(d => `${d.distance}km`);

    // Rider names at bottom (rotated)
    g.selectAll('.rider-name')
      .data(riderPositions)
      .enter()
      .append('text')
      .attr('class', 'rider-name')
      .attr('transform', d => 
        `translate(${(xScale(d.rider_no) || 0) + xScale.bandwidth() / 2}, ${height + 5}) rotate(-45)`
      )
      .attr('text-anchor', 'end')
      .attr('alignment-baseline', 'middle')
      .attr('font-size', '11px')
      .attr('fill', '#374151')
      .text(d => {
        const nameParts = d.name.split(' ');
        return nameParts[nameParts.length - 1]; // Last name only
      });

    // Wave indicators at top
    g.selectAll('.wave-indicator')
      .data(riderPositions)
      .enter()
      .append('text')
      .attr('class', 'wave-indicator')
      .attr('x', d => (xScale(d.rider_no) || 0) + xScale.bandwidth() / 2)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', '#6b7280')
      .text(d => d.wave);

    // Tooltips
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('padding', '8px 12px')
      .style('background', 'rgba(0, 0, 0, 0.9)')
      .style('color', 'white')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', '1000')
      .style('max-width', '200px');

    riderColumns
      .on('mouseover', function(event, d) {
        // Highlight the column
        d3.select(this).select('rect:nth-child(2)')
          .attr('opacity', 1);

        tooltip.transition()
          .duration(200)
          .style('opacity', 1);
        
        tooltip.html(`
          <div><strong>${d.name}</strong></div>
          <div>Rider: ${d.rider_no}</div>
          <div>Wave: ${d.wave}</div>
          <div>Distance: ${d.distance}km</div>
          <div>Last CP: ${d.lastCheckpoint}</div>
          ${d.averageSpeed ? `<div>Avg Speed: ${d.averageSpeed.toFixed(1)}km/h</div>` : ''}
          <div>Status: ${d.status.replace('_', ' ')}</div>
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function() {
        // Remove highlight
        d3.select(this).select('rect:nth-child(2)')
          .attr('opacity', 0.8);

        tooltip.transition()
          .duration(500)
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
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Indian Riders Progress - Vertical View
            </CardTitle>
            <CardDescription>
              Vertical bar visualization showing all Indian riders' progress
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
      <CardContent ref={containerRef} className="p-4 overflow-x-auto">
        <svg ref={svgRef} width={dimensions.width} height={dimensions.height}></svg>
      </CardContent>
    </Card>
  );
};

export default IndianRidersProgressVertical;