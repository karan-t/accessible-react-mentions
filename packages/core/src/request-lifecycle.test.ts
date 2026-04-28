import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequestLifecycle } from './request-lifecycle';
import type { MentionItem } from './types';

interface User extends MentionItem {
  display: string;
  id: string;
}

const fakeUsers: User[] = [
  { id: '1', display: 'Ada' },
  { id: '2', display: 'Linus' },
  { id: '3', display: 'Grace' },
];

describe('createRequestLifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts idle with an empty query', () => {
    const lc = createRequestLifecycle({ source: async () => fakeUsers });
    expect(lc.getSnapshot()).toMatchObject({ status: 'idle', query: '', items: [] });
  });

  it('debounces successive search calls and emits one fetch', async () => {
    const source = vi.fn(async (_query: string) => fakeUsers);
    const lc = createRequestLifecycle<User>({ source, debounceMs: 100 });

    lc.search('a');
    lc.search('ad');
    lc.search('ada');
    expect(source).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(100);
    expect(source).toHaveBeenCalledTimes(1);
    const firstCall = source.mock.calls[0];
    expect(firstCall?.[0]).toBe('ada');
  });

  it('aborts the in-flight request when a new search supersedes it', async () => {
    let abortedFromInside = false;
    const source = vi.fn(async (_q: string, opts: { signal: AbortSignal }) => {
      return await new Promise<User[]>((resolve, reject) => {
        opts.signal.addEventListener('abort', () => {
          abortedFromInside = true;
          reject(new DOMException('aborted', 'AbortError'));
        });
        setTimeout(() => resolve(fakeUsers), 1000);
      });
    });
    const lc = createRequestLifecycle<User>({ source, debounceMs: 0 });

    lc.search('first');
    await vi.advanceTimersByTimeAsync(0);
    lc.search('second');
    await vi.advanceTimersByTimeAsync(0);

    expect(abortedFromInside).toBe(true);
  });

  it('fires immediately for the empty query (recents path)', () => {
    const source = vi.fn(async (_query: string) => fakeUsers);
    const lc = createRequestLifecycle<User>({ source, debounceMs: 1000 });
    lc.search('');
    expect(source).toHaveBeenCalledTimes(1);
  });

  it('caches results so re-typing the same query does not refetch', async () => {
    const source = vi.fn(async (_query: string) => fakeUsers);
    const lc = createRequestLifecycle<User>({ source, debounceMs: 0 });

    lc.search('a');
    await vi.advanceTimersByTimeAsync(0);
    await Promise.resolve();
    await Promise.resolve();
    expect(source).toHaveBeenCalledTimes(1);

    lc.search('a');
    await vi.advanceTimersByTimeAsync(0);
    expect(source).toHaveBeenCalledTimes(1);
  });

  it('appends paginated items via loadNextPage when hasMore is true', async () => {
    const pages = [
      { items: [{ id: '1', display: 'A' }], hasMore: true, cursor: 'c1' },
      { items: [{ id: '2', display: 'B' }], hasMore: false, cursor: undefined },
    ];
    let call = 0;
    const lc = createRequestLifecycle<User>({
      source: async () => {
        const page = pages[call++];
        if (page === undefined) throw new Error('test consumed more pages than provided');
        return page;
      },
      debounceMs: 0,
    });

    lc.search('x');
    await vi.advanceTimersByTimeAsync(0);
    await Promise.resolve();
    await Promise.resolve();
    expect(lc.getSnapshot().items).toHaveLength(1);
    expect(lc.getSnapshot().hasMore).toBe(true);

    lc.loadNextPage();
    await vi.advanceTimersByTimeAsync(0);
    await Promise.resolve();
    await Promise.resolve();
    expect(lc.getSnapshot().items).toHaveLength(2);
    expect(lc.getSnapshot().hasMore).toBe(false);
  });

  it('reset() aborts in-flight and returns to empty idle', async () => {
    const lc = createRequestLifecycle<User>({
      source: async () => new Promise(() => undefined),
      debounceMs: 0,
    });
    lc.search('a');
    await vi.advanceTimersByTimeAsync(0);
    lc.reset();
    expect(lc.getSnapshot()).toMatchObject({ status: 'idle', items: [], query: '' });
  });

  it('exposes errors via the error status', async () => {
    const lc = createRequestLifecycle<User>({
      source: async () => {
        throw new Error('boom');
      },
      debounceMs: 0,
    });
    lc.search('a');
    await vi.advanceTimersByTimeAsync(0);
    await Promise.resolve();
    await Promise.resolve();
    expect(lc.getSnapshot().status).toBe('error');
  });

  it('clears items immediately when a new query supersedes the current one', async () => {
    const lc = createRequestLifecycle<User>({
      source: async (q: string) =>
        fakeUsers.filter((u) => u.display.toLowerCase().includes(q.toLowerCase())),
      debounceMs: 100,
    });

    lc.search('a');
    await vi.advanceTimersByTimeAsync(100);
    await Promise.resolve();
    await Promise.resolve();
    expect(lc.getSnapshot().items.length).toBeGreaterThan(0);
    expect(lc.getSnapshot().query).toBe('a');

    lc.search('g');
    expect(lc.getSnapshot().items).toEqual([]);
    expect(lc.getSnapshot().status).toBe('loading');
    expect(lc.getSnapshot().query).toBe('g');
  });

  it('preserves item identity (no JSON cloning)', async () => {
    interface RichUser extends User {
      created: Date;
      onSelect: () => void;
      meta: { ref: object };
    }
    const sentinel = { id: 'sentinel' };
    const richUsers: RichUser[] = [
      {
        id: '1',
        display: 'Ada',
        created: new Date('2024-01-01'),
        onSelect: () => undefined,
        meta: { ref: sentinel },
      },
    ];
    const lc = createRequestLifecycle<RichUser>({
      source: async () => richUsers,
      debounceMs: 0,
    });

    lc.search('a');
    await vi.advanceTimersByTimeAsync(0);
    await Promise.resolve();
    await Promise.resolve();

    const item = lc.getSnapshot().items[0];
    expect(item).toBe(richUsers[0]);
    expect(item?.created).toBeInstanceOf(Date);
    expect(typeof item?.onSelect).toBe('function');
    expect(item?.meta.ref).toBe(sentinel);
  });
});
