export type { Adapter } from './adapter';
export { createTextareaAdapter } from './adapters/textarea';
export type { UseMentionOptions, UseMentionResult } from './hooks/useMention';
export { useMention } from './hooks/useMention';
export type { RequestLifecycle, RequestLifecycleOptions } from './request-lifecycle';
export { createRequestLifecycle } from './request-lifecycle';
export type { ParseResult } from './serializer';
export { parseValue, serializeMention } from './serializer';
export type { ActiveTrigger } from './triggers';
export { detectTrigger } from './triggers';
export type {
  ListboxStatus,
  MentionItem,
  MentionSource,
  ParsedMention,
  SearchOptions,
  SearchPage,
  TriggerChar,
  TriggerConfig,
} from './types';
