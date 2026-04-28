import { describe, expect, it } from 'vitest';
import { parseValue, serializeMention } from './serializer';

describe('parseValue', () => {
  it('returns plain text and an empty mentions list when no tokens are present', () => {
    expect(parseValue('hello world')).toEqual({
      plainText: 'hello world',
      mentions: [],
    });
  });

  it('parses a single @-mention and recovers display text', () => {
    const { plainText, mentions } = parseValue('hi @[Jane Doe](user:42), can you review?');
    expect(plainText).toBe('hi Jane Doe, can you review?');
    expect(mentions).toEqual([{ id: '42', display: 'Jane Doe', trigger: '@', index: 3 }]);
  });

  it('parses multiple mentions across different triggers', () => {
    const { plainText, mentions } = parseValue('@[Ada](user:1) please tag #[bug](tag:t-12)');
    expect(plainText).toBe('Ada please tag bug');
    expect(mentions).toHaveLength(2);
    expect(mentions[0]).toMatchObject({ id: '1', display: 'Ada', trigger: '@' });
    expect(mentions[1]).toMatchObject({ id: 't-12', display: 'bug', trigger: '#' });
  });

  it('handles a token at end of string', () => {
    const { plainText, mentions } = parseValue('cc @[Linus](user:l1)');
    expect(plainText).toBe('cc Linus');
    expect(mentions[0]?.index).toBe(3);
  });

  it('treats a bare id (no kind prefix) as the id itself', () => {
    const { mentions } = parseValue('@[X](42)');
    expect(mentions[0]?.id).toBe('42');
  });

  it('is safe to call repeatedly (regex lastIndex is reset)', () => {
    const input = '@[A](u:1) and @[B](u:2)';
    expect(parseValue(input).mentions).toHaveLength(2);
    expect(parseValue(input).mentions).toHaveLength(2);
  });
});

describe('serializeMention', () => {
  it('serializes with kind prefix', () => {
    expect(serializeMention('@', 'Jane Doe', '42', 'user')).toBe('@[Jane Doe](user:42)');
  });

  it('serializes without kind prefix', () => {
    expect(serializeMention('#', 'bug', 't-12')).toBe('#[bug](t-12)');
  });

  it('round-trips through parseValue', () => {
    const token = serializeMention('@', 'Karan', '99', 'user');
    const { mentions } = parseValue(`hi ${token}`);
    expect(mentions[0]).toMatchObject({ id: '99', display: 'Karan', trigger: '@', index: 3 });
  });

  it('round-trips a custom trigger character', () => {
    const token = serializeMention('!', 'Alice', '1', 'user');
    expect(token).toBe('![Alice](user:1)');
    const { plainText, mentions } = parseValue(`cc ${token}`);
    expect(plainText).toBe('cc Alice');
    expect(mentions).toEqual([{ id: '1', display: 'Alice', trigger: '!', index: 3 }]);
  });

  it('parseValue restricts recognition when explicit triggers are provided', () => {
    const { plainText, mentions } = parseValue('@[Ada](u:1) and +[Bob](u:2)', ['@']);
    expect(plainText).toBe('Ada and +[Bob](u:2)');
    expect(mentions).toHaveLength(1);
    expect(mentions[0]).toMatchObject({ trigger: '@', display: 'Ada' });
  });

  it('parseValue escapes regex metacharacters in trigger list', () => {
    const { mentions } = parseValue('*[Star](u:1)', ['*']);
    expect(mentions).toEqual([{ id: '1', display: 'Star', trigger: '*', index: 0 }]);
  });
});
