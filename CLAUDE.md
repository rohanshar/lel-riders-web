# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LEL 2025 Riders Tracking Web App - A React-based application for tracking riders in the London-Edinburgh-London 2025 cycling event. The app displays real-time rider progress across 23 checkpoints, with special focus on Indian riders, featuring timeline views, interactive maps, and wave-based statistics.

## Development Commands

```bash
npm start        # Start development server on port 3000
npm run build    # Build for production (uses CRACO)
npm test         # Run tests in interactive watch mode

# Code quality checks - run these before committing
npx eslint src --ext .ts,.tsx  # Run ESLint
npx tsc --noEmit               # Run TypeScript type checking
```

## Key Architecture

### Dual Start System
The event has TWO start points handled by `src/config/lel-route.ts`:
- **London Start**: L-series waves (LA, LB, LC, etc.) - 1557km total
- **Writtle Start**: All other waves (A, B, C, etc.) - 1537km total

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
   - NOTE: Auto-refresh is currently DISABLED (set to Infinity) for safety

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
- `IndianRidersProgress` - Recently added progress visualization
- `IndianRidersProgressAlt` - Alternative progress view
- `WavesSummary` - All waves overview with statistics
- `WaveDetail` - Single wave deep dive

**Shared Components:**
- `AsyncBoundary` - Loading/error states wrapper
- `ErrorBoundary` - Application-level error handling
- UI components in `src/components/ui/` - Radix UI based components

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

## Data Sources & API Configuration

All S3-hosted with CORS enabled (see `src/config/api.ts`):
- **Riders**: `riders.json` - 5-minute cache
- **Tracking**: `indian-riders-tracking.json` - 30-second refresh in GlobalDataProvider
- **Routes**: `routes.json` - Cached indefinitely

S3 bucket: `lel-riders-data-2025.s3.ap-south-1.amazonaws.com`

## Critical Implementation Details

### Time Handling
- Display in UK time (`Europe/London`) with BST awareness
- Use `formatElapsedTime()` for ride durations
- Wave start times configured in `lel-route.ts`:
  - Writtle waves: Start at 4:00 AM + 15-minute increments
  - London waves: Start at 5:00 AM + 15-minute increments

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

## TypeScript Configuration

- Strict mode enabled
- Path alias: `@/*` → `./src/*` (configured in tsconfig.json and craco.config.js)
- Type imports preferred: `import type { Rider } from '@/types'`

### Core Types (`src/types/`)
```typescript
interface Rider {
  rider_no: string;
  name: string;
  country?: string;
  wave?: string;
}

interface TrackingRider extends Rider {
  status: 'not_started' | 'in_progress' | 'finished' | 'dnf';
  checkpoints: CheckpointEntry[];
  distance_km: number;
  last_checkpoint: string | null;
}
```

## Testing Strategy

- Jest with React Testing Library
- Run specific tests: `npm test -- IndianRiders`
- Coverage reports: `npm test -- --coverage`
- Test files alongside components (*.test.tsx)

## Build Configuration

- Create React App with CRACO for custom webpack config
- Tailwind CSS with custom configuration
- CSS-in-JS utilities via `class-variance-authority` and `clsx`

## Development Tips

- Check git status before starting - uncommitted changes exist
- The app uses React 19 (latest version)
- UI components use Radix UI primitives with Tailwind styling
- Build info available via `src/buildInfo.ts`