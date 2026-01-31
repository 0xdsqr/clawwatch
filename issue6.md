## Current Behavior
Several queries are inefficient due to missing database indexes:

1. Agent lookup by name uses `.filter()` instead of index
2. Activities queries order by `_creationTime` without index  
3. No index on agent name for faster lookups
4. No composite indexes for common query patterns

## Expected Behavior
Add proper indexes to support efficient querying patterns.

## Proposed Fix
Update `schema.ts` with additional indexes:

```typescript
agents: defineTable({
  // ... existing fields
})
  .index("by_status", ["status"])
  .index("by_name", ["name"])  // NEW - for agent.upsert() query

activities: defineTable({
  // ... existing fields  
})
  .index("by_agent", ["agentId"])
  .index("by_creation_time", ["_creationTime"])  // NEW - for ordering
  .index("by_agent_time", ["agentId", "_creationTime"])  // NEW - for agent activity feeds
```

## Estimated Impact  
**Medium** - These queries will become slow as data grows. The agent name lookup is particularly problematic for high-frequency upsert operations.

## Query Analysis
- `agents.upsert()` - Currently filters by name (table scan)
- `activities.recent()` - Orders by `_creationTime` (inefficient without index)
- `agents.healthSummary()` - Multiple queries could benefit from composite indexes

## Breaking Changes
Schema changes in Convex require careful deployment coordination.

## Current Locations
- `convex/schema.ts` - Missing indexes
- `convex/agents.ts` line 22 - Inefficient name lookup
- `convex/activities.ts` line 32 - Inefficient ordering