# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LEL 2025 Riders Tracking Web App - A React-based application for tracking riders in the London-Edinburgh-London 2025 cycling event. The app displays real-time rider progress, including Indian riders specifically, with timeline views and interactive maps.

This is a **monorepo** containing multiple projects:
- **`lel-riders-web/`** - Main production app (Create React App + Craco)
- **`lel-riders-web2/`** - Modern rewrite (Vite + React Query + Zustand)
- **Python scripts** - Data extraction and processing
- **`testing/`** - Node.js utilities for token extraction

## Development Commands

### Main App (`lel-riders-web/`)
```bash
npm start        # Start development server on port 3000
npm run build    # Build for production (uses Craco)
npm test         # Run tests in interactive watch mode

# Manual code quality checks (no npm scripts configured)
npx eslint src --ext .ts,.tsx  # Run ESLint
npx tsc --noEmit               # Run TypeScript type checking
```

### Modern App (`lel-riders-web2/`)
```bash
npm run dev          # Vite development server
npm run build        # TypeScript + Vite build
npm run lint         # ESLint
npm run typecheck    # TypeScript checking
npm run format       # Prettier formatting
npm run format:check # Check formatting
npm run preview      # Preview production build
```

### Data Management & Deployment
```bash
# In project root
./update-s3-cors.sh  # Update CORS configuration for S3 bucket
./upload-to-s3.sh    # Upload data files to S3

# Python scripts for data extraction
python generate_riders_list.py    # Extract rider data
python tracking_riders_new.py     # Generate tracking updates
```

### Testing Individual Components
For the main app, use Jest's pattern matching:
```bash
npm test -- IndianRiders        # Test specific component
npm test -- --coverage         # Run with coverage report
```

## Key Architecture

### Dual Start System
The event has TWO start points handled by `src/config/lel-route.ts`:
- **London Start**: L-series waves (LA, LB, LC, etc.) - 1604km total
- **Writtle Start**: All other waves (A, B, C, etc.) - 1540km total

Routes merge at Northstowe. The system provides:
- `isLondonStartRider(riderId)` - Determines start location by wave
- `getControlsForRider(riderId)` - Returns correct control sequence
- `getTotalDistanceForRider(riderId)` - Returns correct total distance

### State Management Architecture

**Dual Context Pattern** - Choose based on needs:

1. **RiderDataProvider** (`src/contexts/RiderDataContext.tsx`)
   - Simple data fetching with 5-minute cache
   - Use for basic rider displays
   - Provides `useWaveData` hook for filtered data

2. **GlobalDataProvider** (`src/contexts/GlobalDataStore.tsx`)
   - Enhanced store with comprehensive caching
   - Use for complex views needing real-time updates
   - Manages riders, tracking, routes, and computed statistics
   - Configurable cache durations per data type

### Data Processing Pipeline

Modular processors in `src/utils/dataProcessors/`:
- **riderProcessors**: Enhances with `searchableText`, `waveCode`
- **trackingProcessors**: Merges tracking with rider data
- **waveProcessors**: Computes wave statistics (started, finished, DNS)
- **controlProcessors**: Calculates control point progress
- **timeProcessors**: UK timezone handling with BST awareness

### Component Architecture

**View Components:**
- `IndianRiders` - Main container with tab navigation
- `IndianRidersTimeline` - Control point progress cards (limited to 10 controls)
- `IndianRidersMap` - Leaflet map (lazy-loaded on tab switch)
- `WavesSummary` - All waves overview with statistics
- `WaveDetail` - Single wave deep dive

**Shared Components:**
- `AsyncBoundary` - Loading/error states wrapper
- `ErrorBoundary` - Application-level error handling
- `PageHeader` - Consistent page headers

### Performance Patterns

1. **Memoization Strategy**:
   ```typescript
   const filteredRiders = useMemo(() => 
     riders.filter(r => r.wave === selectedWave),
     [riders, selectedWave]
   );
   ```

2. **Abort Controller Pattern**:
   ```typescript
   useEffect(() => {
     const controller = new AbortController();
     fetchData(controller.signal);
     return () => controller.abort();
   }, []);
   ```

3. **Timeline Optimization**: First 10 controls only to prevent DOM overload

## Data Sources & Refresh Intervals

All S3-hosted with CORS enabled:
- **Riders**: 5-minute refresh - `riders.json`
- **Tracking**: 30-second refresh (GlobalDataProvider) - `indian-riders-tracking.json`
- **Routes**: Cached indefinitely - `routes.json`

S3 bucket: `lel-riders-data-2025.s3.ap-south-1.amazonaws.com`

## Critical Implementation Details

### Time Handling
- Display in UK time (`Europe/London`) with BST awareness
- Use `formatElapsedTime()` for ride durations
- Live clock component uses 1-second interval

### Search Implementation
- Pre-computed `searchableText` field includes name and rider ID
- Case-insensitive substring matching
- Debounce search input for performance

### Map Integration
- Leaflet tiles from OpenStreetMap
- Custom marker icons for controls and rider positions
- Bounds calculated dynamically from route data

### Error States
- Network errors: "Failed to load data. Please try again."
- No data: "No riders found" with appropriate context
- Tracking unavailable: Graceful degradation to basic view

## TypeScript Patterns

### Type Imports
```typescript
import type { Rider, TrackingData } from '@/types';
```

### API Error Handling
```typescript
interface ApiError {
  message: string;
  status?: number;
  data?: unknown;
}
```

### Route Configuration Types
```typescript
interface RouteControl {
  id: string;
  name: string;
  distance: number;
  cutoff: string;
}
```

## Deployment Notes

- **Vercel**: Automatic deployments from main branch
- **Environment**: No environment variables required (all data public)
- **CORS**: Must be configured on S3 bucket for API access
- **Build Output**: Static files, no server required