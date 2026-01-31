## Current Behavior
Frontend components lack memoization and optimization, causing unnecessary re-renders and computations:

1. Dashboard runs expensive formatting on every render
2. No React.memo on pure components
3. Activity feed processes large arrays without virtualization  
4. Cost calculations redone on every render

## Expected Behavior
Optimize rendering performance with proper memoization and virtualization.

## Proposed Fix
1. Add React.memo to pure components
2. Use useMemo for expensive calculations
3. Use useCallback for event handlers
4. Consider virtualization for large lists

## Implementation Example
```typescript
// Before
export function CostExplorer() {
  const summary = useQuery(api.costs.summary, {});
  return <div>{formatCost(summary?.today.cost ?? 0)}</div>;
}

// After  
export const CostExplorer = React.memo(() => {
  const summary = useQuery(api.costs.summary, {});
  
  const formattedCost = useMemo(
    () => formatCost(summary?.today.cost ?? 0),
    [summary?.today.cost]
  );
  
  return <div>{formattedCost}</div>;
});
```

## Estimated Impact
**Medium** - Reduces unnecessary re-renders and computations. Most noticeable on slower devices and with large datasets.

## Target Components
- `Dashboard.tsx` - Multiple formatting calculations
- `CostExplorer.tsx` - Heavy formatting and calculations  
- `ActivityFeed.tsx` - Large list rendering
- `MiniActivityFeed.tsx` - Should be memoized
- `AgentStatusCard.tsx` - Pure component, good memo candidate

## Performance Testing
Add React DevTools Profiler measurements before/after changes.

## Current Locations
- `src/pages/Dashboard.tsx` - No memoization
- `src/pages/CostExplorer.tsx` - Expensive calculations on every render
- `src/components/` - Most components lack React.memo