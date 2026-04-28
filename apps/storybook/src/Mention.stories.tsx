import { Mention, type MentionItem, type TriggerConfig } from '@accessible-react-mentions/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';

interface User extends MentionItem {
  id: string;
  display: string;
  email: string;
}

const ALL_USERS: User[] = [
  { id: '1', display: 'Ada Lovelace', email: 'ada@example.com' },
  { id: '2', display: 'Linus Torvalds', email: 'linus@example.com' },
  { id: '3', display: 'Grace Hopper', email: 'grace@example.com' },
  { id: '4', display: 'Alan Turing', email: 'alan@example.com' },
  { id: '5', display: 'Margaret Hamilton', email: 'margaret@example.com' },
  { id: '6', display: 'Donald Knuth', email: 'donald@example.com' },
  { id: '7', display: 'Tim Berners-Lee', email: 'tim@example.com' },
  { id: '8', display: 'Barbara Liskov', email: 'barbara@example.com' },
];

function BasicMention() {
  const [value, setValue] = useState('');
  const [plainText, setPlainText] = useState('');

  const triggers = useMemo<TriggerConfig<User>[]>(
    () => [
      {
        char: '@',
        debounceMs: 100,
        source: async (query) => {
          const q = query.toLowerCase();
          return ALL_USERS.filter((u) => q === '' || u.display.toLowerCase().includes(q)).slice(
            0,
            6,
          );
        },
      },
    ],
    [],
  );

  return (
    <div style={{ maxWidth: 480, fontFamily: 'system-ui, sans-serif' }}>
      <label htmlFor="msg" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
        Message
      </label>
      <Mention.Root
        triggers={triggers}
        onChange={(raw, plain) => {
          setValue(raw);
          setPlainText(plain);
        }}
      >
        <Mention.Input
          id="msg"
          rows={4}
          placeholder="Type a message. Use @ to mention a teammate."
          style={inputStyle}
        />
        <Mention.Listbox
          className="arm-listbox"
          render={(ctx) => (
            <>
              {ctx.status === 'loading' && (
                <div style={{ ...itemStyle, opacity: 0.7 }}>Loading…</div>
              )}
              {ctx.status === 'error' && (
                <div style={{ ...itemStyle, color: '#a00' }}>Failed to load suggestions.</div>
              )}
              {ctx.status === 'idle' && ctx.items.length === 0 && (
                <div style={{ ...itemStyle, opacity: 0.7 }}>No matches.</div>
              )}
              {ctx.items.map((item, index) => (
                <Mention.Item key={item.id} index={index} item={item}>
                  <UserRow user={item as User} highlighted={ctx.activeIndex === index} />
                </Mention.Item>
              ))}
            </>
          )}
        />
      </Mention.Root>

      <details style={{ marginTop: 16, fontSize: 13, color: '#555' }}>
        <summary style={{ cursor: 'pointer' }}>Debug: raw value, plain text</summary>
        <pre style={{ background: '#f6f6f6', padding: 8, borderRadius: 4, overflowX: 'auto' }}>
          {`raw       : ${JSON.stringify(value)}
plainText : ${JSON.stringify(plainText)}`}
        </pre>
      </details>
    </div>
  );
}

function UserRow({ user, highlighted }: { user: User; highlighted: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        background: highlighted ? '#eef4ff' : 'transparent',
        cursor: 'pointer',
        minHeight: 40,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: '#0070f3',
          color: 'white',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {user.display
          .split(' ')
          .map((p) => p[0])
          .join('')}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{user.display}</span>
        <span style={{ fontSize: 12, color: '#666' }}>{user.email}</span>
      </span>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: 10,
  fontSize: 15,
  fontFamily: 'inherit',
  border: '1px solid #ccc',
  borderRadius: 6,
  resize: 'vertical' as const,
};

const itemStyle = {
  padding: '8px 12px',
  fontSize: 14,
};

const meta: Meta<typeof BasicMention> = {
  title: 'Mention/Basic',
  component: BasicMention,
  parameters: {
    layout: 'padded',
  },
};

export default meta;

type Story = StoryObj<typeof BasicMention>;

export const Default: Story = {};
