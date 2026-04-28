import type { TriggerChar, TriggerConfig } from './types';

export interface ActiveTrigger {
  trigger: TriggerChar;
  query: string;
  /** Offset of the trigger character. */
  start: number;
  /** Caret offset (one past the last char of the query). */
  end: number;
}

/**
 * The trigger char must sit at a word boundary (start of string or after
 * whitespace / open-bracket / comma) so `email@host` does not start a mention.
 */
export function detectTrigger(
  value: string,
  caret: number,
  triggers: readonly TriggerConfig[],
): ActiveTrigger | null {
  if (caret < 1 || caret > value.length) return null;

  for (const cfg of triggers) {
    const max = cfg.maxQueryLength ?? 64;
    const earliest = Math.max(0, caret - max - 1);

    for (let i = caret - 1; i >= earliest; i--) {
      const ch = value[i];
      if (ch === undefined) continue;
      if (isQueryBreaker(ch)) break;
      if (ch === cfg.char) {
        const before = i === 0 ? undefined : value[i - 1];
        if (before === undefined || isWordBoundary(before)) {
          return {
            trigger: cfg.char,
            query: value.slice(i + 1, caret),
            start: i,
            end: caret,
          };
        }
        break;
      }
    }
  }

  return null;
}

function isQueryBreaker(ch: string): boolean {
  return /\s/.test(ch);
}

function isWordBoundary(ch: string): boolean {
  return /\s/.test(ch) || ch === '(' || ch === '[' || ch === '{' || ch === ',';
}
