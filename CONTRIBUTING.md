# Contributing

Thanks for your interest in contributing! This project is open to issues, PRs, and especially screen-reader test reports.

## Development setup

```sh
corepack enable
pnpm install
pnpm dev
```

Node 20+ required (24 recommended). Package manager is pinned via Corepack.

## Repository layout

```
apps/
  docs/             Astro Starlight documentation site
  storybook/        Storybook component sandbox
packages/
  core/             Headless engine (no React rendering)
  react/            Unstyled accessible compound component
  theme-default/    Opt-in CSS theme
  compat-react-mentions/  Drop-in react-mentions API shim
  tanstack/         TanStack Query data-source adapter
```

Dependencies flow strictly downward. `react` depends on `core`. The other packages depend on `react`. No package may import from an app.

## Architectural invariants

These constraints are load-bearing — propose alternatives in an issue before changing them.

- **`packages/core` has zero dependencies.** The headless engine being dep-free lets any data layer plug in. Floating UI, TanStack Query, etc. live downstream of `core`.
- **The `Adapter` interface is the architectural seam.** It lives at `packages/core/src/adapter.ts` and is what lets one core power `<textarea>` today and contenteditable / Lexical / Slate later **without breaking changes**. Anything that couples `core` to a specific input surface breaks the v1.x roadmap.
- **`packages/react` uses `aria-activedescendant`, not focus-moving.** The textarea retains DOM focus while the listbox is open. This is the WAI-ARIA 1.2 combobox-with-listbox pattern. Switching to focus-moving would break IME, mobile, and undo behavior.

## Bundle-size budgets

Enforced in CI via `size-limit` — see `.size-limit.json` at the repo root:

- `@accessible-react-mentions/core` ≤ 5 KB gzip ESM
- `@accessible-react-mentions/react` ≤ 6 KB gzip ESM (Floating UI is a peer dep, excluded)

Run `pnpm size` locally to check before opening a PR. If a change pushes either above budget, find a reduction elsewhere or argue for a budget bump explicitly in the PR.

## Workflow

1. Fork and create a feature branch from `main`
2. Make your changes
3. Add a changeset describing what changed: `pnpm changeset`
4. Run `pnpm lint && pnpm test && pnpm build` and confirm green
5. Open a PR

CI will run lint, type-check, unit tests, axe-core a11y checks against every Storybook story, Playwright keyboard E2E, and bundle-size checks. PRs cannot merge with any of these red.

## Accessibility expectations

This project's defining feature is strict WCAG 2.2 compliance. Any change that touches the `react` or `core` package must:

- Pass automated axe-core checks (zero violations)
- Preserve the documented keyboard model
- Be re-tested manually against at least one screen reader before release

Screen-reader test reports for NVDA, JAWS, VoiceOver, and TalkBack are credited contributions. See the [/wcag receipts page](#) on the docs site for the test matrix.

## Reporting accessibility bugs

Open an issue with the `a11y` label. Include:

- Screen reader + browser + OS version
- WCAG 2.2 SC reference if applicable
- A reproducible Storybook story or CodeSandbox

## Code of conduct

Be kind. Assume good intent. Disagreements are fine — disrespect is not.
