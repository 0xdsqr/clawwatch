## Current Behavior
The collector maintains an `ingestedCosts` Set that tracks processed cost entries to avoid duplicates. This Set grows forever and never clears old entries.

## Expected Behavior
The Set should periodically clean up old entries to prevent memory leaks.

## Proposed Fix
1. Add timestamp tracking for Set entries
2. Periodically remove entries older than 7 days
3. Alternatively, use an LRU cache with size limits

## Estimated Impact
**Critical** - This will eventually crash the collector with OOM errors as the Set grows unbounded. In a busy system, this could happen within weeks.

## Reproduction
Run the collector for an extended period with active cost data generation. The memory usage will grow continuously and never decrease.

## Current Location
`collector/poll.ts` line 28: `const ingestedCosts = new Set<string>();`