import { describe, expect, it } from 'vitest';
import { detectTrigger } from './triggers';
import type { TriggerConfig } from './types';

const noopSource = async () => ({ items: [] });

const triggers: TriggerConfig[] = [
  { char: '@', source: noopSource },
  { char: '#', source: noopSource },
];

describe('detectTrigger', () => {
  it('returns null when caret is at position 0', () => {
    expect(detectTrigger('@', 0, triggers)).toBeNull();
  });

  it('detects an empty query right after the trigger', () => {
    const r = detectTrigger('hi @', 4, triggers);
    expect(r).toEqual({ trigger: '@', query: '', start: 3, end: 4 });
  });

  it('detects an in-progress query', () => {
    const r = detectTrigger('hello @ja', 9, triggers);
    expect(r).toEqual({ trigger: '@', query: 'ja', start: 6, end: 9 });
  });

  it('refuses to trigger when the @ is part of an email address', () => {
    expect(detectTrigger('write me at user@host', 21, triggers)).toBeNull();
  });

  it('triggers when the trigger char is the very first character', () => {
    const r = detectTrigger('@ada', 4, triggers);
    expect(r).toEqual({ trigger: '@', query: 'ada', start: 0, end: 4 });
  });

  it('breaks the query at whitespace', () => {
    expect(detectTrigger('@ada looking', 12, triggers)).toBeNull();
  });

  it('respects maxQueryLength', () => {
    const long = `@${'a'.repeat(100)}`;
    const r = detectTrigger(long, long.length, [
      { char: '@', source: noopSource, maxQueryLength: 5 },
    ]);
    expect(r).toBeNull();
  });

  it('matches a different trigger character', () => {
    const r = detectTrigger('see #bug', 8, triggers);
    expect(r).toEqual({ trigger: '#', query: 'bug', start: 4, end: 8 });
  });

  it('triggers after an opening bracket', () => {
    const r = detectTrigger('(@ada', 5, triggers);
    expect(r).toEqual({ trigger: '@', query: 'ada', start: 1, end: 5 });
  });
});
