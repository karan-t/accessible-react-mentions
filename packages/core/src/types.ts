export type TriggerChar = string;

export interface MentionItem {
  id: string;
  display: string;
  [key: string]: unknown;
}

export interface ParsedMention {
  id: string;
  display: string;
  trigger: TriggerChar;
  /** Offset of the trigger character in the raw value (not the plain text). */
  index: number;
}

export interface SearchPage<T extends MentionItem = MentionItem> {
  items: T[];
  hasMore?: boolean;
  cursor?: unknown;
}

export interface SearchOptions {
  signal: AbortSignal;
  cursor?: unknown;
}

export type MentionSource<T extends MentionItem = MentionItem> = (
  query: string,
  opts: SearchOptions,
) => Promise<SearchPage<T> | T[]>;

export interface TriggerConfig<T extends MentionItem = MentionItem> {
  char: TriggerChar;
  source: MentionSource<T>;
  /** Defaults to 150ms. */
  debounceMs?: number;
  /** Defaults to 64. */
  maxQueryLength?: number;
}

export type ListboxStatus = 'closed' | 'opening' | 'idle' | 'loading' | 'error';
