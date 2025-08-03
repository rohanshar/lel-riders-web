# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LEL 2025 Riders Tracking Web App - A React-based application for tracking riders in the London-Edinburgh-London 2025 cycling event. The app displays real-time rider progress, including Indian riders specifically, with timeline views and interactive maps.

## Development Commands

### Running the Application
```bash
npm start        # Start development server on port 3000
npm run build    # Build for production (uses Craco)
npm test         # Run tests in interactive watch mode
```

### Code Quality
```bash
npx eslint src   # Run ESLint manually (no npm script configured)
npx tsc --noEmit # Run TypeScript type checking manually
```

### Deployment
```bash
./update-s3-cors.sh  # Update CORS configuration for S3 bucket
./upload-to-s3.sh    # Upload data files to S3
```

## Key Architecture

### Route Configuration
The event has TWO start points that are handled by the routing logic in `src/config/lel-route.ts`:
- **London Start**: For L-series wave riders (LA, LB, LC, etc.) - 1604km total
- **Writtle Start**: For all other riders (A, B, C, etc.) - 1540km total

Both routes merge at Northstowe and continue on the same path. The route system includes:
- Wave-based rider identification (`isLondonStartRider()`)
- Dynamic control point assignment (`getControlsForRider()`)
- Distance calculations for each checkpoint

### State Management Architecture

The application uses TWO context providers for state management:

1. **RiderDataProvider** (`src/contexts/RiderDataContext.tsx`)
   - Provides basic rider data fetching and caching
   - Uses `useRiders` hook with 5-minute cache
   - Includes utility hooks like `useWaveData` for filtered data

2. **GlobalDataProvider** (`src/contexts/GlobalDataStore.tsx`)
   - Enhanced data store with comprehensive state management
   - Manages riders, tracking data, routes, and statistics
   - Implements sophisticated caching with configurable durations
   - Provides computed values like wave statistics and control progress

### Data Processing Pipeline

The application uses a modular data processing system in `src/utils/dataProcessors/`:
- `riderProcessors.ts`: Enhances rider data with computed fields
- `trackingProcessors.ts`: Processes real-time tracking information
- `waveProcessors.ts`: Calculates wave-specific statistics
- `controlProcessors.ts`: Manages control point progress
- `timeProcessors.ts`: Handles UK time conversions and elapsed time calculations

### View Components
- **HomePage**: Landing page with event overview
- **WavesSummary**: Overview of all rider waves
- **WaveDetail**: Detailed view of a specific wave
- **RidersList**: Searchable list of all riders
- **IndianRiders**: Main component with timeline view showing control point progress
- **IndianRidersTimeline**: Timeline view showing control points with expandable cards
- **IndianRidersMap**: Interactive map view using Leaflet
- **IndianRidersTable**: Tabular view of rider data
- **RouteMap**: Full route visualization

## Tech Stack

- **React 19.1.1** with TypeScript (strict mode enabled)
- **Create React App** with Craco for build configuration
- **Tailwind CSS** for styling with custom UI components
- **React Router v7** for navigation
- **Leaflet** for interactive maps
- **Radix UI** for accessible UI primitives
- **AWS S3** for data hosting (CORS configured)
- **Path aliasing**: `@/` maps to `src/`

## Data Sources

All data is hosted on AWS S3 with automatic refresh:
- Riders list: `https://lel-riders-data-2025.s3.ap-south-1.amazonaws.com/riders.json`
- Indian riders tracking: `https://lel-riders-data-2025.s3.ap-south-1.amazonaws.com/indian-riders-tracking.json`
- Route data: `https://lel-riders-data-2025.s3.ap-south-1.amazonaws.com/routes.json`

Data refresh intervals:
- Rider data: 5 minutes
- Tracking data: 30 seconds (when using GlobalDataProvider)
- Route data: Cached indefinitely

## Important Implementation Details

### Time Handling
- All times displayed in UK time (Europe/London timezone)
- Live London time clock shown in the UI
- Elapsed time calculations account for BST
- Time formatting utilities in `src/utils/formatUtils.ts`

### Performance Optimizations
- Extensive use of `useMemo` for expensive computations
- Data filtering and sorting are memoized
- Route controls limited to first 10 for timeline view
- Map data loaded on-demand when map view is selected
- Virtual scrolling considered for large rider lists

### Error Handling
- ErrorBoundary component wraps the application
- AsyncBoundary provides loading states
- API errors typed with `ApiError` interface
- Graceful fallbacks for missing data

## Deployment

- **Vercel**: Primary deployment platform (vercel.json configured)
- **S3 Data Updates**: Use provided shell scripts for data updates
- **CORS Configuration**: S3 bucket requires CORS for cross-origin requests

## Testing

The project uses the standard Create React App test setup. No additional test commands are configured beyond `npm test`.