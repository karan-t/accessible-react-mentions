# @accessible-react-mentions/tanstack

[TanStack Query](https://tanstack.com/query) data-source adapter for [`@accessible-react-mentions/core`](../core). Bridges a consumer's existing `QueryClient` into the mention data contract — so a chat app with thousands of users gets cache sharing, request dedup, and `useInfiniteQuery`-backed pagination across the whole app, not just the mention picker.

> **Status: pre-alpha (v0.0.0).** This is a workspace placeholder so the package name is reserved on npm. The functional `useTanStackMentionSource` hook ships with v1.0.

## Why a separate package

The headless core has zero dependencies and ships its own request lifecycle (debounce + AbortSignal + dedup + LRU + pagination). That's enough for most consumers.

If your app already uses TanStack Query, this adapter lets the mention listbox share your existing `QueryClient` so:

- Cache lookups for the same `@`-list are deduplicated app-wide
- Hovering a user card pre-populates the mention picker
- TanStack devtools, retry policies, and offline behavior carry over

## Planned API

```tsx
import { useTanStackMentionSource } from '@accessible-react-mentions/tanstack';

const usersSource = useTanStackMentionSource({
  queryKey: (query) => ['users', { q: query }],
  queryFn: ({ pageParam, signal, query }) =>
    fetch(`/api/users?q=${query}&cursor=${pageParam ?? ''}`, { signal }).then((r) => r.json()),
  getNextPageParam: (last) => last.nextCursor,
});

<Mention.Trigger char="@" source={usersSource} />
```

## License

MIT
