# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LEL Riders Web is a React TypeScript application that displays the complete list of registered riders for the London-Edinburgh-London 2025 cycling event. The app fetches rider data from AWS S3 and provides multiple views for browsing 2,008 riders organized in waves (starting groups).

## Key Commands

### Development
```bash
npm install          # Install dependencies
npm start            # Start development server (localhost:3000)
npm test             # Run Jest test suite
npm run build        # Create production build
```

### Testing
```bash
npm test                           # Run all tests in watch mode
npm test -- --coverage            # Run tests with coverage report
npm test ComponentName            # Run tests for specific component
```

## Architecture & Key Concepts

### Routing Structure
- `/` - Homepage with event overview
- `/waves` - Wave summary dashboard showing all waves with rider counts
- `/wave/:wave` - Individual wave detail page with riders list
- `/route` - Interactive map showing the full LEL route with checkpoints
- `/all-riders` - Complete searchable table of all riders
- `/indian-riders` - Filtered view of Indian participants

### Data Flow
- **Data sources**: 
  - Riders: `https://lel-riders-data-2025.s3.ap-south-1.amazonaws.com/riders.json`
  - Route: `https://lel-riders-data-2025.s3.ap-south-1.amazonaws.com/routes.json`
- **Client-side filtering**: All data fetched once, filtered/sorted on client
- **Wave extraction**: Regex pattern `/^([A-Z]+)/` extracts wave prefix from rider numbers

### Component Architecture
```
App.tsx                    # Router and layout wrapper
├── HomePage.tsx          # Landing page
├── WavesSummary.tsx      # Waves dashboard
├── WaveDetail.tsx        # Individual wave view
├── RouteMap.tsx          # Interactive Leaflet map
├── RidersList.tsx        # All riders table view
└── IndianRiders.tsx      # Country-filtered view
```

### Key Patterns

1. **Data Fetching Pattern**: Each component independently fetches data
```typescript
useEffect(() => {
  fetch('https://lel-riders-data-2025.s3.ap-south-1.amazonaws.com/riders.json')
    .then(res => res.json())
    .then(setRiders)
    .catch(setError);
}, []);
```

2. **Natural Sorting**: Alphanumeric rider numbers sorted correctly
```typescript
riders.sort((a, b) => a.rider_no.localeCompare(b.rider_no, undefined, { numeric: true }))
```

3. **Search Implementation**: Filter by name or rider number
```typescript
const filtered = useMemo(() => 
  riders.filter(rider => 
    rider.name.toLowerCase().includes(search) || 
    rider.rider_no.toLowerCase().includes(search)
  ), [riders, search]);
```

### UI Components
- Uses **shadcn/ui** components (Radix UI-based)
- Components located in `src/components/ui/`
- Styling via **Tailwind CSS** with custom theme configuration
- **CRACO** configuration for webpack customization
- Path alias `@/` configured but use relative imports if issues arise

### Type Definitions
```typescript
interface Rider {
  rider_no: string;
  name: string;
  country?: string;
}
```

### Deployment
- Hosted on **Vercel** with automatic deployments
- Configuration in `vercel.json`
- Production builds created with Create React App

## Important Notes

- **TypeScript strict mode** is enabled - ensure all types are properly defined
- **No global state management** - each component manages its own data
- **Mobile-first responsive design** - test on mobile viewports
- **Performance**: Use `useMemo` for expensive operations on large datasets
- **Error boundaries**: Components include error handling for failed data fetches