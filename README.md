# accessible-react-mentions

[![npm version](https://img.shields.io/npm/v/@accessible-react-mentions/react?label=%40accessible-react-mentions%2Freact)](https://www.npmjs.com/package/@accessible-react-mentions/react)
[![CI](https://github.com/karan-t/accessible-react-mentions/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/karan-t/accessible-react-mentions/actions/workflows/ci.yml)
[![Chromatic](https://github.com/karan-t/accessible-react-mentions/actions/workflows/chromatic.yml/badge.svg?branch=main)](https://github.com/karan-t/accessible-react-mentions/actions/workflows/chromatic.yml)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/@accessible-react-mentions/react?label=gzip)](https://bundlephobia.com/package/@accessible-react-mentions/react)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

A modern, **strictly WCAG 2.2-compliant** React mentions library that works with any text input surface — built around a headless core with composable, accessible primitives.

**[Live docs →](https://arm.karanthakur.xyz)** · **[Live Storybook →](https://main--69f09040cfe4aa198be08f5a.chromatic.com)**

## Why

The popular [`react-mentions`](https://github.com/signavio/react-mentions) has known accessibility gaps and slow maintenance momentum. PrimeReact's `Mention` is solid but coupled to its own ecosystem. Syncfusion's is paid. There is real room for a free, framework-agnostic, strictly WCAG 2.2-compliant mention component.

This project ships:

- A **headless core** (state machine + request lifecycle + adapter interface) with zero dependencies
- An **unstyled accessible component** built on the WAI-ARIA 1.2 combobox-with-listbox pattern
- An opt-in **default theme**
- A drop-in **`react-mentions` compatibility layer** for one-line migration *(roadmap)*
- An optional **TanStack Query** data-source adapter for chat apps with thousands of users *(roadmap)*

Every applicable WCAG 2.2 Success Criterion is mapped to either an automated test or a documented manual screen-reader checklist on the [WCAG receipts page](https://arm.karanthakur.xyz/wcag).

## Install

```sh
pnpm add @accessible-react-mentions/react @floating-ui/react
```

(`@floating-ui/react` is a peer dependency.)

## Quick start

```tsx
import { Mention } from '@accessible-react-mentions/react';

const triggers = [{
  char: '@',
  source: async (q, { signal }) =>
    fetch(`/api/users?q=${q}`, { signal }).then(r => r.json()),
}];

<Mention.Root triggers={triggers} onChange={(raw, plain, mentions) => save(raw)}>
  <label htmlFor="msg">Message</label>
  <Mention.Input id="msg" rows={4} />
  <Mention.Listbox
    render={(ctx) => ctx.items.map((item, i) => (
      <Mention.Item key={item.id} index={i} item={item}>
        {item.display}
      </Mention.Item>
    ))}
  />
</Mention.Root>
```

See the [getting started guide](https://arm.karanthakur.xyz/guides/getting-started) for full usage, including pagination, multi-trigger, and the headless `useMention` hook.

## Packages

| Package | Status | Description |
|---|---|---|
| [`@accessible-react-mentions/core`](./packages/core) | **v0.1** | Headless engine — state machine, triggers, request lifecycle, serializer, adapter interface |
| [`@accessible-react-mentions/react`](./packages/react) | **v0.1** | Unstyled accessible compound component |
| [`@accessible-react-mentions/theme-default`](./packages/theme-default) | roadmap | Opt-in CSS theme with dark mode, reduced-motion variants, RTL |
| [`@accessible-react-mentions/compat-react-mentions`](./packages/compat-react-mentions) | roadmap | Drop-in API shim for migrating from `react-mentions` |
| [`@accessible-react-mentions/tanstack`](./packages/tanstack) | roadmap | TanStack Query data-source adapter |

## Local development

```sh
corepack enable
pnpm install
pnpm dev          # all dev servers
pnpm storybook    # Storybook only
pnpm docs         # docs site only
pnpm test         # all package tests
pnpm lint         # Biome lint
pnpm build        # build all packages
```

Requires Node 22+ (24 recommended). Package manager is pinned via Corepack — no global pnpm install needed.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Accessibility contributions (especially screen-reader testing reports) are particularly welcome.

## Acknowledgements

This project stands on the shoulders of work that came before it.

- **[`react-mentions`](https://github.com/signavio/react-mentions)** by Signavio (MIT licensed) — pioneered the React mention component pattern and the markdown-style `@[Display](id)` value format that we deliberately adopt so the [`compat-react-mentions`](./packages/compat-react-mentions) package can offer a one-line migration path. The motivation for *this* project is to address known accessibility gaps in `react-mentions` while preserving its data shape, not to invalidate its work — it remains the most widely-deployed React mention library and informed many of our design choices.
- **[PrimeReact's `Mention` component](https://primereact.org/mention/)** — demonstrated that an accessible mention component is achievable in React; useful prior art when settling on the WAI-ARIA 1.2 combobox-with-listbox pattern.
- **[WAI-ARIA Authoring Practices Guide — Combobox With Listbox Popup](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)** — the keyboard model, focus model, and ARIA wiring all follow APG guidance.
- **[Floating UI](https://floating-ui.com/)** — listbox positioning (peer dep, not bundled).
- **[axe-core](https://github.com/dequelabs/axe-core)** by Deque — every PR is gated on its WCAG 2.2 AA rule set.
- **[Radix UI](https://www.radix-ui.com/) and [Headless UI](https://headlessui.com/)** — informed the layered headless-primitives + unstyled-component architecture.

## License

[MIT](./LICENSE)
