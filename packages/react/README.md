# @accessible-react-mentions/react

Unstyled, **strictly WCAG 2.2-compliant** React mentions component built on the WAI-ARIA 1.2 [Combobox With Listbox Popup](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) pattern.

Part of [accessible-react-mentions](https://github.com/karan-t/accessible-react-mentions).

## Install

```sh
pnpm add @accessible-react-mentions/react @floating-ui/react
```

Peers: `react@^18 || ^19`, `react-dom@^18 || ^19`, `@floating-ui/react@^0.27`.

## Minimal example

```tsx
import { Mention, type TriggerConfig } from '@accessible-react-mentions/react';
import { useMemo, useState } from 'react';

const USERS = [
  { id: '1', display: 'Ada Lovelace' },
  { id: '2', display: 'Linus Torvalds' },
];

export function MessageBox() {
  const [value, setValue] = useState('');
  const triggers = useMemo<TriggerConfig[]>(() => [
    {
      char: '@',
      source: async (q) =>
        USERS.filter((u) => u.display.toLowerCase().includes(q.toLowerCase())),
    },
  ], []);

  return (
    <Mention.Root triggers={triggers} onChange={(raw) => setValue(raw)}>
      <Mention.Input rows={4} placeholder="Use @ to mention a teammate." />
      <Mention.Listbox render={(ctx) =>
        ctx.items.map((item, i) => (
          <Mention.Item key={item.id} index={i} item={item}>
            {item.display}
          </Mention.Item>
        ))
      } />
    </Mention.Root>
  );
}
```

## What you get for free

- WAI-ARIA 1.2 combobox semantics on the textarea (`role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`)
- Polite live-region announcements ("5 suggestions available. Ada Lovelace highlighted.")
- Keyboard model: `↑/↓`, `Home/End`, `PageUp/PageDown`, `Enter`, `Escape`, `Tab` (configurable)
- Debounced + cancellable requests with an in-memory LRU cache
- Empty-query results (typing `@` alone calls `source('', …)` for recents/teammates)

Ships zero styles. Pair with [`@accessible-react-mentions/theme-default`](../theme-default) or your own.

## Docs

[accessible-react-mentions.vercel.app](https://accessible-react-mentions.vercel.app)

## License

MIT
