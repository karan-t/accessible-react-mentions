import type { ParsedMention, TriggerChar } from './types';

// Display names may not contain unescaped `]` — consumers must sanitize at the source.
const DEFAULT_TOKEN_PATTERN = /([^\w\s[\]()])\[([^\]]+)\]\(([^)]+)\)/g;

export interface ParseResult {
  plainText: string;
  mentions: ParsedMention[];
}

// `triggers` restricts recognition to those chars — avoids false positives like `+[link](url)`.
export function parseValue(raw: string, triggers?: readonly TriggerChar[]): ParseResult {
  const pattern =
    triggers && triggers.length > 0 ? buildPatternFor(triggers) : DEFAULT_TOKEN_PATTERN;
  pattern.lastIndex = 0;

  const mentions: ParsedMention[] = [];
  let plainText = '';
  let lastEnd = 0;
  let match: RegExpExecArray | null = pattern.exec(raw);

  while (match !== null) {
    const [whole, trigger, display, idPart] = match;
    plainText += raw.slice(lastEnd, match.index);
    plainText += display ?? '';
    mentions.push({
      id: parseId(idPart ?? ''),
      display: display ?? '',
      trigger: (trigger ?? '@') as TriggerChar,
      index: match.index,
    });
    lastEnd = match.index + (whole?.length ?? 0);
    match = pattern.exec(raw);
  }
  plainText += raw.slice(lastEnd);

  return { plainText, mentions };
}

function buildPatternFor(triggers: readonly TriggerChar[]): RegExp {
  const escaped = triggers.map(escapeForRegex).join('|');
  return new RegExp(`(${escaped})\\[([^\\]]+)\\]\\(([^)]+)\\)`, 'g');
}

function escapeForRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function serializeMention(
  trigger: TriggerChar,
  display: string,
  id: string,
  kind?: string,
): string {
  const idPart = kind ? `${kind}:${id}` : id;
  return `${trigger}[${display}](${idPart})`;
}

function parseId(idPart: string): string {
  const colon = idPart.indexOf(':');
  return colon === -1 ? idPart : idPart.slice(colon + 1);
}
