# Indian Riders Feature Module

This module contains all components, hooks, utilities and types for the Indian Riders tracking feature in the LEL 2025 Riders Tracking Web App.

## Architecture

The module follows a feature-based architecture with clear separation of concerns:

```
indian-riders/
├── components/          # UI components
│   ├── timeline/       # Timeline view components
│   ├── statistics/     # Statistics display components
│   ├── latest-updates/ # Latest updates display
│   ├── rider-detail/   # Rider detail dialog components
│   └── shared/         # Shared UI components
├── hooks/              # Custom React hooks
├── utils/              # Business logic and utilities
├── types/              # TypeScript type definitions
└── constants/          # Static data and configuration
```

## Key Components

### IndianRidersContainer
The main orchestrator component that:
- Manages global state for Indian riders
- Coordinates sub-components
- Handles tab navigation between Timeline and Progress views

### TimelineView
Displays riders' progress through controls in a vertical timeline:
- Shows first 10 controls for London-Edinburgh journey
- Expandable cards for each control
- Real-time rider tracking at each checkpoint

### RiderDetailDialog
Modal dialog showing detailed information about a selected rider:
- Current status and statistics
- Progress ranking
- Checkpoint history with elapsed times

## Hooks

### useIndianRidersData
Primary data hook that:
- Fetches rider and tracking data
- Calculates statistics
- Provides refresh functionality

### useRiderSearch
Manages search functionality:
- Filters riders by name or number
- Sorts by distance covered

### useLatestUpdates
Calculates most recent checkpoint arrivals across all riders

## Utilities

### riderCalculations
- `calculateRiderDistance()` - Total distance covered including London start offset
- `calculateAverageSpeed()` - Speed based on elapsed time
- `shouldBeMarkedDNF()` - DNF determination based on inactivity

### timeFormatters
- `formatElapsedTime()` - Formats duration in hours/minutes
- `getCurrentUKTime()` - Gets current UK time
- `formatExpectedArrival()` - Calculates expected arrival times

### statusHelpers
- `getStatusBadge()` - React component for status badges
- `getStatusIcon()` - React component for status icons

## Usage

Import the main container component:

```typescript
import IndianRidersContainer from '@/features/indian-riders';

// Use in your app
<IndianRidersContainer />
```

## Performance Optimizations

1. **Memoization** - Heavy calculations are memoized using `useMemo`
2. **Component Splitting** - Large component broken into smaller, focused components
3. **Lazy Loading** - Map component lazy loaded on tab switch
4. **Limited Rendering** - Timeline shows only first 10 controls

## Future Improvements

1. **Virtualization** - Implement react-window for long rider lists
2. **Testing** - Add unit tests for utilities and integration tests for components
3. **Caching** - Implement more sophisticated caching strategies
4. **Analytics** - Add tracking for user interactions