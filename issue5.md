## Current Behavior
The collector re-reads and parses entire JSONL transcript files on every polling cycle (default 30s), even for files that haven't changed. This becomes very expensive as transcript files grow large.

## Expected Behavior  
Only process new/changed content using incremental processing techniques.

## Proposed Fix
1. Track file modification times and sizes to detect changes
2. Store file read positions/offsets to only read new lines
3. Use file watching (fs.watch) instead of pure polling where possible
4. Batch multiple small changes before sending to Convex

## Estimated Impact
**Medium** - With large transcript files, the collector can consume significant CPU and I/O on every cycle. This also increases API pressure on Convex.

## Benchmarks Needed
- Current: Reading 10MB JSONL file takes ~50ms every 30s = 1.67% CPU overhead
- Target: Only reading new lines should reduce this to <1ms for unchanged files

## Implementation Strategy
```typescript
interface FileState {
  path: string;
  size: number;
  mtime: number;
  lastPosition: number;
}

const fileStates = new Map<string, FileState>();
```

## Current Location
`collector/poll.ts` - `pollTranscripts()` function reads entire files every time

## Additional Benefits
- Reduced memory usage
- Lower disk I/O
- Faster polling cycles
- Less Convex API pressure