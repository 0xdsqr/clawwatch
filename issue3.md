## Current Behavior
The entire application bundle loads eagerly, including the heavy Recharts library (~200KB). All pages are imported at startup even if users never visit them.

## Expected Behavior
Use code splitting and lazy loading to reduce initial bundle size.

## Proposed Fix
1. Convert App.tsx to use React.lazy() for page components
2. Move Recharts imports to dynamic imports within CostChart component
3. Use React.Suspense for loading states
4. Consider lazy loading the entire CostExplorer page

## Estimated Impact
**High** - Could reduce initial bundle size by 60-70% (from ~400KB to ~150KB). Significantly improves Time to Interactive, especially on slower connections.

## Implementation
```typescript
// Convert to lazy loading
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CostExplorer = lazy(() => import('./pages/CostExplorer'));

// In App.tsx
<Suspense fallback={<div>Loading...</div>}>
  {page === 'dashboard' && <Dashboard />}
</Suspense>
```

## Bundle Analysis Needed
Run `npm run build` and check output sizes. Consider using `webpack-bundle-analyzer` equivalent for Vite.

## Current Location
- `src/App.tsx` - All pages imported eagerly
- `src/components/CostChart.tsx` - Recharts imported at module level