import type { MentionItem, MentionSource, SearchPage } from './types';

type Result<T extends MentionItem> =
  | { status: 'idle'; query: string; items: T[]; hasMore: boolean; cursor: unknown }
  | { status: 'loading'; query: string; items: T[]; hasMore: boolean; cursor: unknown }
  | {
      status: 'error';
      query: string;
      items: T[];
      hasMore: boolean;
      cursor: unknown;
      error: unknown;
    };

export interface RequestLifecycleOptions<T extends MentionItem = MentionItem> {
  source: MentionSource<T>;
  debounceMs?: number;
  cacheSize?: number;
}

export interface RequestLifecycle<T extends MentionItem = MentionItem> {
  search(query: string): void;
  loadNextPage(): void;
  reset(): void;
  subscribe(listener: (result: Result<T>) => void): () => void;
  getSnapshot(): Result<T>;
}

export function createRequestLifecycle<T extends MentionItem>(
  options: RequestLifecycleOptions<T>,
): RequestLifecycle<T> {
  const debounceMs = options.debounceMs ?? 150;
  const cache = createLRU<string, SearchPage<T>>(options.cacheSize ?? 32);

  let result: Result<T> = makeIdle('');
  let debounceHandle: ReturnType<typeof setTimeout> | null = null;
  let inflight: AbortController | null = null;
  const listeners = new Set<(r: Result<T>) => void>();

  const emit = (next: Result<T>) => {
    result = next;
    for (const l of listeners) l(next);
  };

  const cancelDebounce = () => {
    if (debounceHandle !== null) {
      clearTimeout(debounceHandle);
      debounceHandle = null;
    }
  };

  const cancelInflight = () => {
    if (inflight !== null) {
      inflight.abort();
      inflight = null;
    }
  };

  const fetchPage = async (query: string, cursor: unknown, append: boolean) => {
    cancelInflight();
    const controller = new AbortController();
    inflight = controller;

    const cacheKey = cacheKeyFor(query, cursor);
    const cached = cache.get(cacheKey);
    if (cached !== undefined && !append) {
      emit({
        status: 'idle',
        query,
        items: cached.items,
        hasMore: cached.hasMore ?? false,
        cursor: cached.cursor,
      });
      return;
    }

    emit({
      status: 'loading',
      query,
      items: append ? result.items : [],
      hasMore: append ? result.hasMore : false,
      cursor: append ? result.cursor : undefined,
    });

    try {
      const raw = await options.source(query, { signal: controller.signal, cursor });
      if (controller.signal.aborted) return;

      const page: SearchPage<T> = Array.isArray(raw) ? { items: raw } : raw;
      cache.set(cacheKey, page);

      const merged = append ? [...result.items, ...page.items] : page.items;
      emit({
        status: 'idle',
        query,
        items: merged,
        hasMore: page.hasMore ?? false,
        cursor: page.cursor,
      });
    } catch (err) {
      if (controller.signal.aborted) return;
      if ((err as { name?: string })?.name === 'AbortError') return;
      emit({
        status: 'error',
        query,
        items: result.items,
        hasMore: result.hasMore,
        cursor: result.cursor,
        error: err,
      });
    } finally {
      if (inflight === controller) inflight = null;
    }
  };

  return {
    search(query) {
      cancelDebounce();

      // Cache hit: serve immediately, skip both the loading flash and the
      // debounce. Preserve `result` reference if we're already showing it so
      // useSyncExternalStore doesn't see a spurious change.
      const cached = cache.get(cacheKeyFor(query, undefined));
      if (cached !== undefined) {
        cancelInflight();
        if (result.status === 'idle' && result.query === query && result.items === cached.items) {
          return;
        }
        emit({
          status: 'idle',
          query,
          items: cached.items,
          hasMore: cached.hasMore ?? false,
          cursor: cached.cursor,
        });
        return;
      }

      // Clear stale items synchronously so a fast Enter inside the debounce
      // window can't accept an option from the previous query.
      if (query !== result.query) {
        cancelInflight();
        emit({
          status: 'loading',
          query,
          items: [],
          hasMore: false,
          cursor: undefined,
        });
      }
      // Empty query fires immediately so the listbox can show "recents".
      if (query === '') {
        void fetchPage('', undefined, false);
        return;
      }
      debounceHandle = setTimeout(() => {
        void fetchPage(query, undefined, false);
      }, debounceMs);
    },
    loadNextPage() {
      if (!result.hasMore) return;
      if (result.status === 'loading') return;
      void fetchPage(result.query, result.cursor, true);
    },
    reset() {
      cancelDebounce();
      cancelInflight();
      emit(makeIdle(''));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot() {
      return result;
    },
  };
}

function makeIdle<T extends MentionItem>(query: string): Result<T> {
  return { status: 'idle', query, items: [], hasMore: false, cursor: undefined };
}

function cacheKeyFor(query: string, cursor: unknown): string {
  if (cursor === undefined || cursor === null) return query;
  if (typeof cursor === 'string' || typeof cursor === 'number') return `${query}\x00${cursor}`;
  return `${query}\x00${JSON.stringify(cursor)}`;
}

interface LRU<K, V> {
  get(key: K): V | undefined;
  set(key: K, value: V): void;
}

function createLRU<K, V>(max: number): LRU<K, V> {
  const map = new Map<K, V>();
  return {
    get(key) {
      const v = map.get(key);
      if (v === undefined) return undefined;
      map.delete(key);
      map.set(key, v);
      return v;
    },
    set(key, value) {
      if (map.has(key)) map.delete(key);
      map.set(key, value);
      if (map.size > max) {
        const oldest = map.keys().next().value;
        if (oldest !== undefined) map.delete(oldest);
      }
    },
  };
}
