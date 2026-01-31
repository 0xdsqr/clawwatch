## Current Behavior
The database has no data retention policy. Tables like `costRecords`, `healthChecks`, `activities`, and `snitchEvents` grow forever without any cleanup mechanism.

## Expected Behavior
Implement automatic data retention policies to prevent database bloat.

## Proposed Fix
1. Add a scheduled cleanup job in Convex
2. Delete records older than configurable thresholds:
   - Activities: 30 days
   - Health checks: 7 days  
   - Cost records: 1 year (or aggregate to daily/weekly after 30 days)
   - Snitch events: 90 days
3. Add admin endpoints for manual cleanup

## Estimated Impact
**High** - Without cleanup, the database will grow indefinitely. Query performance will degrade, and storage costs will increase dramatically over time.

## Implementation
```typescript
// convex/cleanup.ts
export const cleanupOldRecords = internalMutation({
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const oldActivities = await ctx.db
      .query("activities")
      .filter(q => q.lt(q.field("_creationTime"), thirtyDaysAgo))
      .take(100);
      
    for (const activity of oldActivities) {
      await ctx.db.delete(activity._id);
    }
  }
});
```

## Cron Job Needed
Set up a daily cron job to run the cleanup function.

## Current Tables Affected
- `costRecords` - No retention policy
- `healthChecks` - No retention policy  
- `activities` - No retention policy
- `snitchEvents` - No retention policy