## Current Behavior
Multiple Convex queries use unbounded `.collect()` calls that can return thousands of records without pagination:

- `agents.list()` - Returns all agents
- `costs.byTimeRange()` - Can return massive cost datasets
- `costs.summary()` - Fetches all records from month start and filters in memory
- `activities.recent()` - Global query scanning all records

## Expected Behavior
Queries should use pagination, limits, and efficient database-level filtering.

## Proposed Fix
1. Add pagination support to all list queries
2. Replace `collect()` with `take()` where appropriate
3. Use database-level aggregations instead of in-memory filtering
4. Add LIMIT parameters to frontend queries

## Estimated Impact
**High** - These queries become very slow as data grows. The costs.summary query is particularly problematic as it fetches all cost records from the current month.

## Examples
```typescript
// BAD - unbounded
await ctx.db.query("agents").collect();

// GOOD - limited
await ctx.db.query("agents").take(100);
```

## Current Locations
- `convex/agents.ts` line 7
- `convex/costs.ts` lines 25, 45, 78
- `convex/activities.ts` line 32