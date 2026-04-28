# @accessible-react-mentions/theme-default

Opt-in default CSS theme for [`@accessible-react-mentions/react`](../react). Plain CSS with CSS variables, dark mode via `prefers-color-scheme`, reduced-motion variants via `prefers-reduced-motion`, and RTL via logical properties.

> **Status: pre-alpha.** Class hooks and selectors may change before v1.0.

## Install

```sh
pnpm add @accessible-react-mentions/theme-default
```

## Usage

```ts
import '@accessible-react-mentions/theme-default';
```

That's it. The theme targets `[role="listbox"]` and `[role="option"]` directly, so it works with the unstyled component out of the box. To customize without re-implementing, override the CSS variables exported by `tokens.css`:

```css
:root {
  --arm-listbox-radius: 4px;
  --arm-item-bg-active: #d1fae5;
}
```

See `src/tokens.css` for the full list.

## License

MIT
