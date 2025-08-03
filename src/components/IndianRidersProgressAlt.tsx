import React, { useEffect, useRef, useState, useMemo } from 'react';
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

const IndianRidersProgressAlt: React.FC = () => {
  const { rawTrackingData } = useGlobalData();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Get Indian riders from the tracking data
  const indianRiders = rawTrackingData?.riders || [];

  // Calculate rider positions with estimated progress
  const riderPositions: RiderPosition[] = useMemo(() => indianRiders
    .map((rider: any) => {
      let distance = 0;
      let lastCheckpoint = 'Start';
      let estimatedDistance = 0;

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
          
          // For London riders, normalize the distance to match Writtle riders
          // London riders do extra 20km at start and end, but we show them at same relative position
          const isLondonRider = rider.rider_no.match(/^L[A-H]/);
          if (isLondonRider && distance > 0) {
            // Map London distances to Writtle equivalent
            if (distance <= 20) {
              distance = 0; // Still at start
            } else if (distance >= 1557) {
              distance = 1537; // At finish
            } else {
              distance = distance - 20; // Subtract the initial 20km offset
            }
          }
          
          // Estimate progress if rider is moving
          if (rider.status === 'in_progress' && lastCP.time) {
            try {
              // Use average speed if available, otherwise use a conservative estimate
              const speed = rider.average_speed > 0 ? rider.average_speed : 15; // Default 15 km/h if no speed
              
              // Parse checkpoint time and calculate minutes elapsed
              const timeParts = lastCP.time.split(' ');
              const timeOnly = timeParts[timeParts.length - 1];
              const [hours, minutes] = timeOnly.split(':').map(Number);
              
              const now = new Date();
              const ukNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }));
              const currentMinutes = ukNow.getHours() * 60 + ukNow.getMinutes();
              const checkpointMinutes = hours * 60 + minutes;
              
              let minutesElapsed = currentMinutes - checkpointMinutes;
              if (minutesElapsed < 0) minutesElapsed += 24 * 60; // Handle day boundary
              
              // Only estimate if enough time has passed (more than 10 minutes)
              if (minutesElapsed > 10) {
                // Estimate distance covered since checkpoint
                const estimatedProgress = (speed / 60) * minutesElapsed;
                
                // Find next control to cap the estimate
                const nextControl = controls.find(c => c.km > distance);
                if (nextControl) {
                  const maxProgress = (nextControl.km - distance) * 0.9; // Cap at 90% to next control
                  estimatedDistance = distance + Math.min(estimatedProgress, maxProgress);
                } else {
                  estimatedDistance = distance + estimatedProgress;
                }
              } else {
                estimatedDistance = distance;
              }
            } catch (error) {
              estimatedDistance = distance;
            }
          } else {
            estimatedDistance = distance;
          }
        }
      }

      return {
        rider_no: rider.rider_no,
        name: rider.name,
        distance: estimatedDistance || distance,
        status: rider.status,
        wave: rider.rider_no.match(/^[A-Z]+/)?.[0] || '',
        lastCheckpoint,
        averageSpeed: rider.average_speed
      };
    }), [indianRiders]);

  // Group riders by distance/checkpoint - round to nearest km for better grouping
  const groupedData = useMemo(() => {
    const riderGroups = d3.group(riderPositions, d => Math.round(d.distance));
    return Array.from(riderGroups, ([distance, riders]) => ({
      distance,
      riders: riders.sort((a, b) => a.name.localeCompare(b.name)),
      count: riders.length
    })).sort((a, b) => a.distance - b.distance);
  }, [riderPositions]);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({ width: width - 40, height: 400 });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // D3 visualization
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || groupedData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous content

    const margin = { top: 60, right: 40, bottom: 60, left: 60 }; // Increased left margin
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    // Create clip path for zoom
    svg.append('defs')
      .append('clipPath')
      .attr('id', 'clip')
      .append('rect')
      .attr('width', width)
      .attr('height', height);

    // Create main group
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Get max distance for the route (use Writtle distance as base)
    const maxDistance = 1540; // Use Writtle distance as standard

    // X scale (distance)
    const xScale = d3.scaleLinear()
      .domain([0, maxDistance])
      .range([0, width]);

    // Store current zoom transform
    let currentTransform = d3.zoomIdentity;

    // Create zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([1, 10]) // Allow up to 10x zoom
      .translateExtent([[-100, -100], [width + 100, height + 100]])
      .extent([[0, 0], [width, height]])
      .on('zoom', function(event) {
        currentTransform = event.transform;
        updateVisualization();
      });

    // Function to update visualization based on zoom
    function updateVisualization() {
      // Create new scale based on zoom
      const newXScale = currentTransform.rescaleX(xScale);
      
      // Update axis
      g.select<SVGGElement>('.x-axis').call(xAxis.scale(newXScale));
      
      // Clear and redraw all elements with new scale
      zoomContainer.selectAll('.controls').remove();
      zoomContainer.selectAll('.track-bg').remove();
      zoomContainer.selectAll('.rider-group').remove();
      
      // Redraw track background
      zoomContainer.append('rect')
        .attr('class', 'track-bg')
        .attr('x', 0)
        .attr('y', height/2 - 20)
        .attr('width', width)
        .attr('height', 40)
        .attr('fill', '#e5e7eb')
        .attr('rx', 20);
      
      // Redraw control points
      const controlsGroup = zoomContainer.append('g').attr('class', 'controls');
      controls.forEach(control => {
        const x = newXScale(control.km);
        
        controlsGroup.append('line')
          .attr('x1', x)
          .attr('x2', x)
          .attr('y1', 0)
          .attr('y2', height)
          .attr('stroke', '#d1d5db')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '3,3');

        controlsGroup.append('text')
          .attr('x', x)
          .attr('y', -5)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('fill', '#6b7280')
          .text(control.name);
      });
      
      // Redraw rider groups with new scale
      const groups = zoomContainer.selectAll('.rider-group')
        .data(groupedData)
        .enter()
        .append('g')
        .attr('class', 'rider-group')
        .attr('transform', d => `translate(${newXScale(d.distance)}, ${height/2})`)
        .style('pointer-events', 'all');

      // Bubble circles
      groups.append('circle')
        .attr('r', d => sizeScale(d.count))
        .attr('fill', d => {
          const statusCounts = d3.rollup(d.riders, v => v.length, d => d.status);
          const majorityStatus = Array.from(statusCounts.entries())
            .sort((a, b) => b[1] - a[1])[0][0];
          return colorScale(majorityStatus);
        })
        .attr('fill-opacity', 0.7)
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .style('pointer-events', 'all');

      // Count labels
      groups.append('text')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'middle')
        .attr('font-size', d => Math.min(sizeScale(d.count) * 0.6, 16))
        .attr('font-weight', 'bold')
        .attr('fill', 'white')
        .style('pointer-events', 'none')
        .text(d => d.count);

      // Distance labels - only show if zoomed out enough
      if (currentTransform.k < 3) { // Only show labels when zoom level is less than 3x
        groups
          .filter(d => d.distance > 0)
          .append('text')
          .attr('y', d => sizeScale(d.count) + 15)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('fill', '#374151')
          .style('pointer-events', 'none')
          .text(d => `${d.distance}km`);
      }
      
      // Re-attach tooltips
      attachTooltips(groups);
    }

    // Function to attach tooltips
    function attachTooltips(groups: any) {
      groups
        .on('mouseover', function(event: any, d: any) {
          // Show basic tooltip on hover
          tooltip.transition()
            .duration(200)
            .style('opacity', 0.9);
          
          tooltip.html(`
            <div><strong>${d.count} riders at ${d.distance}km</strong></div>
            <div style="font-size: 11px;">Click to see riders</div>
          `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', function() {
          // Only hide if not clicked
          if (tooltip.attr('data-clicked') !== 'true') {
            tooltip.transition()
              .duration(500)
              .style('opacity', 0);
          }
        })
        .on('click', function(event: any, d: any) {
          event.stopPropagation();
          
          // Mark as clicked
          tooltip.attr('data-clicked', 'true');
          
          // Show detailed tooltip
          tooltip.transition()
            .duration(200)
            .style('opacity', 1);
          
          const riderList = d.riders
            .slice(0, 20)
            .map((r: any) => `${r.name} (${r.rider_no})`)
            .join('<br>');
          
          const moreText = d.riders.length > 20 ? `<br>... and ${d.riders.length - 20} more` : '';
          
          tooltip.html(`
            <div style="position: relative;">
              <button onclick="this.parentElement.parentElement.style.opacity='0'; this.parentElement.parentElement.setAttribute('data-clicked', 'false');" 
                      style="position: absolute; right: -5px; top: -5px; 
                             background: white; color: black; border: none; 
                             border-radius: 50%; width: 20px; height: 20px; 
                             cursor: pointer; font-size: 12px;">×</button>
              <div><strong>${d.count} riders at ${d.distance}km</strong></div>
              <div style="margin-top: 4px; font-size: 11px;">
                ${riderList}${moreText}
              </div>
            </div>
          `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
        });
    }
    
    // Hide tooltip when clicking elsewhere
    d3.select('body').on('click', function() {
      tooltip.attr('data-clicked', 'false');
      tooltip.transition()
        .duration(200)
        .style('opacity', 0);
    });

    // Color scale for status
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['in_progress', 'finished', 'dnf', 'not_started'])
      .range(['#3b82f6', '#10b981', '#ef4444', '#9ca3af']);

    // Add zoom rect for interaction (must be added before zoom container)
    const zoomRect = g.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all');

    // Create zoom container (must be after zoom rect so it's on top)
    const zoomContainer = g.append('g')
      .attr('class', 'zoom-container')
      .attr('clip-path', 'url(#clip)');

    // Add track background to zoom container
    zoomContainer.append('rect')
      .attr('class', 'track-bg')
      .attr('x', 0)
      .attr('y', height/2 - 20)
      .attr('width', width)
      .attr('height', 40)
      .attr('fill', '#e5e7eb')
      .attr('rx', 20);

    // Add distance axis
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d => `${d}km`)
      .ticks(10);

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .append('text')
      .attr('x', width / 2)
      .attr('y', 40)
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .style('font-weight', 'bold')
      .text('Distance (km)');

    // Apply zoom behavior
    zoomRect.call(zoom as any);

    // Get controls
    const controls = getControlsForRider('A1');

    // Size scale for bubbles based on rider count
    const sizeScale = d3.scaleSqrt()
      .domain([1, d3.max(groupedData, d => d.count) || 10])
      .range([10, 40]);

    // Create or reuse tooltip
    let tooltip = d3.select('body').select<HTMLDivElement>('.d3-tooltip');
    if (tooltip.empty()) {
      tooltip = d3.select('body').append('div')
        .attr('class', 'd3-tooltip')
        .style('position', 'absolute')
        .style('padding', '8px 12px')
        .style('background', 'rgba(0, 0, 0, 0.9)')
        .style('color', 'white')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'auto')
        .style('opacity', 0)
        .style('max-width', '300px')
        .style('max-height', '400px')
        .style('overflow-y', 'auto');
    }

    // Initial render
    updateVisualization();

    // Add a legend
    const legendData = [
      { status: 'not_started', label: 'Not Started' },
      { status: 'in_progress', label: 'In Progress' },
      { status: 'finished', label: 'Finished' },
      { status: 'dnf', label: 'DNF' }
    ];

    const legend = g.append('g')
      .attr('transform', `translate(${width - 150}, 10)`);

    legendData.forEach((item, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);
      
      legendRow.append('circle')
        .attr('r', 6)
        .attr('fill', colorScale(item.status));
      
      legendRow.append('text')
        .attr('x', 12)
        .attr('y', 0)
        .attr('alignment-baseline', 'middle')
        .attr('font-size', '12px')
        .text(item.label);
    });

    // Cleanup tooltip on unmount
    return () => {
      d3.select('body').selectAll('.d3-tooltip').remove();
    };
  }, [dimensions, groupedData]);

  const totalRiders = riderPositions.length;
  const inProgressCount = riderPositions.filter(r => r.status === 'in_progress').length;
  const finishedCount = riderPositions.filter(r => r.status === 'finished').length;
  const dnfCount = riderPositions.filter(r => r.status === 'dnf').length;
  const notStartedCount = riderPositions.filter(r => r.status === 'not_started').length;

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Indian Riders Progress Overview
            </CardTitle>
            <CardDescription>
              Bubble chart showing rider groups at each checkpoint ({totalRiders} total riders) • Click bubbles to see riders • Scroll to zoom, drag to pan
            </CardDescription>
          </div>
          <div className="flex gap-3 text-xs">
            <span className="text-gray-500">{notStartedCount} not started</span>
            <span className="text-blue-500">{inProgressCount} in progress</span>
            <span className="text-green-500">{finishedCount} finished</span>
            <span className="text-red-500">{dnfCount} DNF</span>
          </div>
        </div>
      </CardHeader>
      <CardContent ref={containerRef} className="p-4">
        <svg ref={svgRef} width={dimensions.width} height={dimensions.height}></svg>
      </CardContent>
    </Card>
  );
};

export default IndianRidersProgressAlt;