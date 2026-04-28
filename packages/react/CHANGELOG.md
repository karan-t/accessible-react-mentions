# @accessible-react-mentions/react

## 0.1.0

### Minor Changes

- 17217a3: Initial v0.1 release.
  - `@accessible-react-mentions/core`: zero-dep headless engine. State machine, multi-trigger registry, request lifecycle (debounce + AbortSignal + LRU + cursor pagination), markdown-style serializer, and an `Adapter` interface for renderer-agnostic surfaces. Ships with a `<textarea>` adapter and the `useMention` hook.
  - `@accessible-react-mentions/react`: unstyled accessible `Mention` compound component on the WAI-ARIA 1.2 combobox-with-listbox pattern. Uses `aria-activedescendant` so the textarea retains caret/edit state. Floating UI for positioning (peer dep). Polite live-region announcer. Full keyboard model (Arrow/Home/End/PageUp/PageDown/Enter/Esc/Tab).

### Patch Changes

- Updated dependencies [17217a3]
  - @accessible-react-mentions/core@0.1.0
