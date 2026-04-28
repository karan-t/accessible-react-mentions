# @accessible-react-mentions/compat-react-mentions

Drop-in API shim that lets apps using [`signavio/react-mentions`](https://github.com/signavio/react-mentions) migrate to [accessible-react-mentions](https://github.com/karan-t/accessible-react-mentions) with a one-line import change.

> **Status: pre-alpha (v0.0.0).** This is a workspace placeholder so the package name is reserved on npm and the docs links resolve. The functional `MentionsInput` / `Mention` API ships with v1.0.

## The plan

```diff
- import { MentionsInput, Mention } from 'react-mentions';
+ import { MentionsInput, Mention } from '@accessible-react-mentions/compat-react-mentions';
```

The value-format design choice (markdown-style `@[Display](id)` tokens) was made specifically so that this compat layer is a thin shim over the new core, not a parser bridge.

See [MIGRATION.md](./MIGRATION.md) for the full migration story.

## License

MIT
