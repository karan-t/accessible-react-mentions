# Migrating from `react-mentions`

> Status: this guide is a stub for v0.0.0. The full migration story ships with v1.0.

## The plan

`@accessible-react-mentions/compat-react-mentions` will export `MentionsInput` and `Mention` JSX matching the [`react-mentions`](https://github.com/signavio/react-mentions) public API, backed by the `@accessible-react-mentions/react` core. For most consumers this is a one-line import swap:

```diff
- import { MentionsInput, Mention } from 'react-mentions';
+ import { MentionsInput, Mention } from '@accessible-react-mentions/compat-react-mentions';
```

The value-format design choice (markdown-style `@[Display](id)` tokens) was made specifically so that this compat layer is a thin shim, not a parser bridge.

## What changes for free

- WAI-ARIA 1.2 combobox semantics (`react-mentions` ships none)
- Polite live-region announcements
- Correct keyboard model with `aria-activedescendant`
- Smaller, modern bundle

## What you may need to adjust

- Custom render props that depend on `react-mentions`'s internal classes
- Mention styles, since the new component does not ship default CSS — pair with `@accessible-react-mentions/theme-default` or your own
