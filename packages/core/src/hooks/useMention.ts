import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { Adapter } from '../adapter';
import { createRequestLifecycle, type RequestLifecycle } from '../request-lifecycle';
import { parseValue, serializeMention } from '../serializer';
import { type ActiveTrigger, detectTrigger } from '../triggers';
import type { ListboxStatus, MentionItem, ParsedMention, TriggerConfig } from '../types';

export interface UseMentionOptions<T extends MentionItem = MentionItem> {
  adapter: Adapter | null;
  triggers: readonly TriggerConfig<T>[];
  onChange?: (rawValue: string, plainText: string, mentions: ParsedMention[]) => void;
  onSelect?: (item: T, trigger: ActiveTrigger) => void;
  /** Namespace for inserted token ids when the item itself has no `kind`. Defaults to 'item'. */
  defaultKind?: string;
}

export interface UseMentionResult<T extends MentionItem = MentionItem> {
  value: string;
  plainText: string;
  mentions: ParsedMention[];
  active: ActiveTrigger | null;
  isOpen: boolean;
  status: ListboxStatus;
  items: T[];
  hasMore: boolean;
  /** -1 means no highlight. */
  activeIndex: number;
  moveHighlight: (delta: number) => void;
  setHighlight: (index: number) => void;
  accept: () => void;
  acceptItem: (item: T) => void;
  close: () => void;
  loadMore: () => void;
}

export function useMention<T extends MentionItem = MentionItem>(
  options: UseMentionOptions<T>,
): UseMentionResult<T> {
  const { adapter, triggers, onChange, onSelect, defaultKind = 'item' } = options;

  const lifecycles = useMemo(() => {
    const map = new Map<string, RequestLifecycle<T>>();
    for (const t of triggers) {
      map.set(t.char, createRequestLifecycle<T>({ source: t.source, debounceMs: t.debounceMs }));
    }
    return map;
  }, [triggers]);

  const subscribe = useCallback(
    (cb: () => void) => (adapter ? adapter.subscribe(cb) : () => undefined),
    [adapter],
  );
  // \x00 separates value and caret in the snapshot string — neither field can contain it.
  const getSnapshot = useCallback(
    () => (adapter ? `${adapter.getValue()}\x00${adapter.getCaret()}` : '\x00'),
    [adapter],
  );
  const adapterSnapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const [value, caretStr] = adapterSnapshot.split('\x00') as [string, string];
  const caret = Number.parseInt(caretStr ?? '0', 10);

  const active = useMemo(() => detectTrigger(value, caret, triggers), [value, caret, triggers]);

  const activeTrigger = active?.trigger ?? null;
  const activeQuery = active?.query ?? null;
  useEffect(() => {
    if (activeTrigger === null) {
      for (const lc of lifecycles.values()) lc.reset();
      return;
    }
    lifecycles.get(activeTrigger)?.search(activeQuery ?? '');
  }, [activeTrigger, activeQuery, lifecycles]);

  const lcSubscribe = useCallback(
    (cb: () => void) => {
      if (!active) return () => undefined;
      const lc = lifecycles.get(active.trigger);
      return lc ? lc.subscribe(cb) : () => undefined;
    },
    [active, lifecycles],
  );
  // Returns the lifecycle's result by reference — cloning would strip non-JSON
  // metadata (Date, function, etc.) consumers attach to MentionItem.
  const lcGetSnapshot = useCallback((): LcSnapshot<T> => {
    if (!active) return EMPTY_SNAPSHOT as LcSnapshot<T>;
    const lc = lifecycles.get(active.trigger);
    return lc ? (lc.getSnapshot() as LcSnapshot<T>) : (EMPTY_SNAPSHOT as LcSnapshot<T>);
  }, [active, lifecycles]);
  const lcResult = useSyncExternalStore(lcSubscribe, lcGetSnapshot, lcGetSnapshot);

  const [activeIndex, setActiveIndex] = useState(0);
  const lastQueryRef = useRef<string | null>(null);
  useEffect(() => {
    if (active?.query !== lastQueryRef.current) {
      lastQueryRef.current = active?.query ?? null;
      setActiveIndex(0);
    }
  }, [active?.query]);
  const clampedIndex =
    lcResult.items.length === 0
      ? -1
      : Math.min(Math.max(0, activeIndex), lcResult.items.length - 1);

  const isOpen =
    active !== null &&
    (lcResult.items.length > 0 || lcResult.status === 'loading' || lcResult.status === 'error');

  const triggerChars = useMemo(() => triggers.map((t) => t.char), [triggers]);
  const parsed = useMemo(() => parseValue(value, triggerChars), [value, triggerChars]);

  const prevValueRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      onChange?.(value, parsed.plainText, parsed.mentions);
    }
  }, [value, parsed, onChange]);

  const close = useCallback(() => {
    for (const lc of lifecycles.values()) lc.reset();
  }, [lifecycles]);

  const acceptItem = useCallback(
    (item: T) => {
      if (!active || !adapter) return;
      // Coerce `kind` to string so a non-string field can't corrupt the token.
      const itemKind = (item as { kind?: unknown }).kind;
      const kind = typeof itemKind === 'string' ? itemKind : defaultKind;
      const token = serializeMention(active.trigger, item.display, item.id, kind);
      adapter.splice(active.start, active.end, `${token} `);
      onSelect?.(item, active);
      close();
    },
    [active, adapter, defaultKind, onSelect, close],
  );

  const accept = useCallback(() => {
    const item = lcResult.items[clampedIndex];
    if (item !== undefined) acceptItem(item);
  }, [lcResult.items, clampedIndex, acceptItem]);

  const moveHighlight = useCallback(
    (delta: number) => {
      setActiveIndex((i) => {
        if (lcResult.items.length === 0) return -1;
        const next = i + delta;
        if (next < 0) return 0;
        if (next >= lcResult.items.length) return lcResult.items.length - 1;
        return next;
      });
    },
    [lcResult.items.length],
  );

  const loadMore = useCallback(() => {
    if (!active) return;
    lifecycles.get(active.trigger)?.loadNextPage();
  }, [active, lifecycles]);

  return {
    value,
    plainText: parsed.plainText,
    mentions: parsed.mentions,
    active,
    isOpen,
    status: lcResult.status,
    items: lcResult.items,
    hasMore: lcResult.hasMore,
    activeIndex: clampedIndex,
    moveHighlight,
    setHighlight: setActiveIndex,
    accept,
    acceptItem,
    close,
    loadMore,
  };
}

interface LcSnapshot<T extends MentionItem> {
  status: ListboxStatus;
  items: T[];
  hasMore: boolean;
  query?: string;
  cursor?: unknown;
  error?: unknown;
}

// Stable identity for useSyncExternalStore.
const EMPTY_SNAPSHOT: LcSnapshot<MentionItem> = {
  status: 'idle',
  items: [],
  hasMore: false,
};
