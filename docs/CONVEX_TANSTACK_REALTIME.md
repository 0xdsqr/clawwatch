# Convex + TanStack Start — Real-Time Performance Research

> Compiled 2026-02-02 by Mimizuku. For ClawWatch architecture decisions.

## Current Setup

ClawWatch uses:
- **Convex** (self-hosted) for real-time reactive backend
- **TanStack Start** for SSR + client-side routing
- **Standard Convex React hooks** (`useQuery` from `convex/react`)

## The Recommended Path: Convex + TanStack Query + TanStack Start

Convex officially recommends using all three together via `@convex-dev/react-query`. This is the "sweet spot" per their docs.

### What We Get

1. **Live-updating queries via React Query** — `convexQuery()` wraps Convex subscriptions in TanStack Query's API, giving us `isPending`, `error`, `data` (which Convex's native `useQuery` doesn't provide as cleanly).

2. **SSR with consistent timestamps** — TanStack Start sends a logical timestamp with each query during SSR. All Convex queries see the same snapshot. No more "one query shows pre-mutation, another shows post-mutation" inconsistency.

3. **Subscription session resumption** — SSR renders data, then the client seamlessly resumes the WebSocket subscription. No flash of loading state.

4. **Loader-based preloading** — Routes can prefetch Convex data on hover:
   ```tsx
   export const Route = createFileRoute('/costs')({
     loader: async (opts) => {
       await opts.context.queryClient.ensureQueryData(
         convexQuery(api.costs.summary, {})
       );
     },
     component: CostExplorer,
   });
   ```

5. **gcTime subscription management** — Convex subscriptions stay alive for 5 min (default) after unmount. Page navigations feel instant because data is already cached.

### Migration Path

Current code uses `useQuery` from `convex/react` directly:
```tsx
const agents = useQuery(api.agents.list, {});
```

Should migrate to:
```tsx
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";

const { data: agents, isPending, error } = useQuery(
  convexQuery(api.agents.list, {})
);
```

**Required setup changes:**

1. Install: `bun add @convex-dev/react-query`

2. Wire up `ConvexQueryClient` in `__root.tsx`:
```tsx
import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);
const convexQueryClient = new ConvexQueryClient(convex);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKeyHashFn: convexQueryClient.hashFn(),
      queryFn: convexQueryClient.queryFn(),
    },
  },
});
convexQueryClient.connect(queryClient);
```

3. Wrap app in both providers:
```tsx
<ConvexProvider client={convex}>
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
</ConvexProvider>
```

### Key Performance Considerations

#### What's Already Free (No Extra Work)
- **Data is never stale** — `isStale` is always `false`. No polling, no refetch intervals needed.
- **Automatic invalidation** — When a mutation runs, all affected queries update instantly via WebSocket push.
- **No manual cache invalidation** — Unlike REST + React Query, you never call `queryClient.invalidateQueries()`.
- **Retry handled by Convex** — The WebSocket protocol has its own retry mechanism; React Query's retry options are ignored.

#### Things to Watch
- **gcTime** (default 5 min) — Subscriptions stay alive after unmount. For a monitoring dashboard with many pages, this is GOOD (navigating back is instant). But if we have heavy queries, consider lowering it.
- **Subscription fan-out** — Every `useQuery` call opens a subscription. A dashboard page with 6 queries = 6 subscriptions. Fine for small datasets, but monitor if the self-hosted Convex backend handles the load.
- **SSR performance** — Each SSR request fetches query data server-side. For public dashboards with many concurrent users, this adds load. For our internal use case (1-2 users), negligible.

#### Self-Hosted Convex Specifics
- Our Convex runs in Docker on the same machine (port 3210/3211)
- Network latency is effectively zero (localhost)
- The bottleneck is Convex's function execution time, not network
- Monitor via Docker stats: `docker stats clawpulse-convex-backend-1`

### Mutations via TanStack Query

```tsx
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";

const { mutate, isPending } = useMutation({
  mutationFn: useConvexMutation(api.alerting.createRule),
});
```

### Mixing Hooks

You CAN use both `convex/react` hooks and TanStack Query hooks in the same app. They share the same Convex client and WebSocket connection. Useful for:
- `usePaginatedQuery` (Convex-specific, no TanStack equivalent)
- Incremental migration (don't have to convert everything at once)

## Recommendation for ClawWatch

### Phase 1 (Now)
Keep using `convex/react` hooks. They work fine with TanStack Start for client-side rendering. The dashboard is internal (1-2 users), so SSR performance isn't critical.

### Phase 2 (When Ready)
Migrate to `@convex-dev/react-query` for:
- Better loading/error states (`isPending`, `error`)
- Route-level data preloading via loaders (instant page transitions)
- SSR consistency (all queries see same timestamp)
- `useSuspenseQuery` for cleaner component code

### Phase 3 (If Needed)
- Add route loaders for preloading on hover
- Tune `gcTime` per query based on access patterns
- Consider Convex's `usePaginatedQuery` for activity feeds and cost history with infinite scroll

## References
- [Convex + TanStack Start docs](https://docs.convex.dev/client/tanstack/tanstack-start/)
- [Convex + TanStack Query docs](https://docs.convex.dev/client/tanstack/tanstack-query/)
- [TanStack Start with Convex (blog)](https://news.convex.dev/tanstack-start-with-convex/)
- [convex-tanstack-start example](https://convex-tanstack-start.vercel.app/)
