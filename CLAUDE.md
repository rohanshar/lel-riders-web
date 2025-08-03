# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LEL 2025 Riders Tracking Web App - A React-based application for tracking riders in the London-Edinburgh-London 2025 cycling event. The app displays real-time rider progress, including Indian riders specifically, with multiple view modes including progress cards, table views, timeline views, and interactive maps.

## Key Architecture

### Route Configuration
The event has TWO start points that are handled by the routing logic in `src/config/lel-route.ts`:
- **London Start**: For L-series wave riders (LA, LB, LC, etc.) - 1604km total
- **Writtle Start**: For all other riders (A, B, C, etc.) - 1540km total

Both routes merge at Northstowe and continue on the same path.

### View Components
- **IndianRiders.tsx**: Main component with multiple view modes (progress, table, timeline)
- **IndianRidersTimeline.tsx**: Timeline view showing control points with expandable cards
- **IndianRidersMap.tsx**: Interactive map view using Leaflet
- **IndianRidersTable.tsx**: Tabular view of rider data

### Timeline View Requirements
The timeline view in `IndianRiders.tsx` (lines 661-717) displays control points as cards. Current behavior shows all riders at each control point. The requirement is to:
1. Make cards expandable (collapsed by default)
2. First card should be "Start (London/Writtle)" to show both start points

## Development Commands

### Running the Application
```bash
npm start        # Start development server on port 3000
npm run build    # Build for production (uses Craco)
npm test         # Run tests in watch mode
```

### Build System
- Uses Create React App with Craco for configuration overrides
- Path alias configured: `@/` maps to `src/`
- TypeScript strict mode enabled

## Tech Stack

- **React 19.1.1** with TypeScript
- **Tailwind CSS** for styling with custom UI components
- **React Router v7** for navigation
- **Leaflet** for interactive maps
- **Radix UI** for accessible UI primitives
- **AWS S3** for data hosting (CORS configured)

## Data Sources

- Riders list: `https://lel-riders-data-2025.s3.ap-south-1.amazonaws.com/riders.json`
- Indian riders tracking: `https://lel-riders-data-2025.s3.ap-south-1.amazonaws.com/indian-riders-tracking.json`
- Route data: `https://lel-riders-data-2025.s3.ap-south-1.amazonaws.com/routes.json`

Data refreshes every 2 minutes for real-time updates.

## Important Implementation Details

### State Management
- Context API used for rider data (`RiderDataContext`)
- Local state for view selections and filters
- Memoized computations for performance

### Time Handling
- All times displayed in UK time (Europe/London timezone)
- Live London time clock shown in the UI
- Elapsed time calculations account for BST

### Performance Considerations
- Data filtering and sorting are memoized
- Route controls limited to first 10 for timeline view
- Map data loaded on-demand when map view is selected

## Testing Notes

No test commands are configured in package.json beyond the default `npm test`. The project uses the standard CRA test setup.

## Deployment

- Configured for Vercel deployment (vercel.json present)
- S3 upload scripts available for data updates
- CORS configuration provided for S3 bucket