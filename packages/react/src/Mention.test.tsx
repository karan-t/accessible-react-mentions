/// <reference types="@testing-library/jest-dom" />
import type { MentionItem, TriggerConfig } from '@accessible-react-mentions/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMemo } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Mention } from './Mention';

interface User extends MentionItem {
  id: string;
  display: string;
}

const USERS: User[] = [
  { id: '1', display: 'Ada Lovelace' },
  { id: '2', display: 'Linus Torvalds' },
  { id: '3', display: 'Grace Hopper' },
];

function Harness({ onChange }: { onChange?: (raw: string, plain: string) => void }) {
  const triggers = useMemo<TriggerConfig<User>[]>(
    () => [
      {
        char: '@',
        debounceMs: 0,
        source: async (q) =>
          USERS.filter((u) => q === '' || u.display.toLowerCase().includes(q.toLowerCase())),
      },
    ],
    [],
  );

  return (
    <Mention.Root triggers={triggers} onChange={onChange}>
      <label htmlFor="msg">Message</label>
      <Mention.Input id="msg" rows={4} />
      <Mention.Listbox
        render={(ctx) =>
          ctx.items.map((item, index) => (
            <Mention.Item key={item.id} index={index} item={item}>
              {item.display}
            </Mention.Item>
          ))
        }
      />
    </Mention.Root>
  );
}

describe('Mention', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders a textarea with role="combobox" and the right ARIA wiring', () => {
    render(<Harness />);
    const input = screen.getByRole('combobox', { name: 'Message' });
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveAttribute('aria-haspopup', 'listbox');
  });

  it('opens the listbox when the user types the trigger character', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByRole('combobox', { name: 'Message' });

    await user.click(input);
    await user.keyboard('@');

    const listbox = await screen.findByRole('listbox');
    expect(listbox).toBeTruthy();
    expect(input).toHaveAttribute('aria-expanded', 'true');
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(USERS.length);
  });

  it('accepts the highlighted item on Enter and inserts a markdown-style token', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);
    const input = screen.getByRole('combobox', { name: 'Message' });

    await user.click(input);
    await user.keyboard('@');
    await screen.findByRole('listbox');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    const lastCall = onChange.mock.calls.at(-1);
    expect(lastCall?.[0]).toMatch(/^@\[Linus Torvalds\]\(item:2\)\s$/);
    expect(lastCall?.[1]).toBe('Linus Torvalds ');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the listbox on Escape without inserting', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);
    const input = screen.getByRole('combobox', { name: 'Message' });

    await user.click(input);
    await user.keyboard('@');
    await screen.findByRole('listbox');
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).toBeNull();
    expect(input).toHaveAttribute('aria-expanded', 'false');
    const lastCall = onChange.mock.calls.at(-1);
    expect(lastCall?.[0]).toBe('@');
  });

  it('hands the original item (not a JSON clone) to onSelect', async () => {
    interface RichUser extends MentionItem {
      id: string;
      display: string;
      created: Date;
      onClick: () => void;
    }
    const sentinel = new Date('2024-06-01');
    const noopFn = () => undefined;
    const richItem: RichUser = {
      id: 'r1',
      display: 'Rich',
      created: sentinel,
      onClick: noopFn,
    };

    function RichHarness({ onSelect }: { onSelect: (item: RichUser) => void }) {
      const triggers = useMemo<TriggerConfig<RichUser>[]>(
        () => [{ char: '@', debounceMs: 0, source: async () => [richItem] }],
        [],
      );
      return (
        <Mention.Root triggers={triggers} onSelect={onSelect}>
          <label htmlFor="msg2">Message</label>
          <Mention.Input id="msg2" rows={4} />
          <Mention.Listbox
            render={(ctx) =>
              ctx.items.map((item, index) => (
                <Mention.Item key={item.id} index={index} item={item}>
                  {item.display}
                </Mention.Item>
              ))
            }
          />
        </Mention.Root>
      );
    }

    const onSelect = vi.fn<(item: RichUser) => void>();
    const user = userEvent.setup();
    render(<RichHarness onSelect={onSelect} />);
    const input = screen.getByRole('combobox', { name: 'Message' });

    await user.click(input);
    await user.keyboard('@');
    await screen.findByRole('listbox');
    await user.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalledTimes(1);
    const received = onSelect.mock.calls[0]?.[0];
    expect(received).toBe(richItem);
    expect(received?.created).toBe(sentinel);
    expect(received?.onClick).toBe(noopFn);
  });
});
