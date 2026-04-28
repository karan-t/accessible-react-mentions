# @accessible-react-mentions/core

Headless engine for [accessible-react-mentions](https://github.com/karan-t/accessible-react-mentions) — a strictly WCAG 2.2-compliant React mentions library.

This package has **zero dependencies** (other than its `react` peer) and ships only the input-surface-agnostic parts: state machine, trigger detection, request lifecycle (debounce + AbortSignal + dedup + LRU cache + pagination), markdown-style value serializer, and the [`Adapter`](#adapter) interface that any input surface plugs into. The hooks consume React; the data + lifecycle code does not.

If you want a ready-made React component, install [`@accessible-react-mentions/react`](../react) instead.

## Install

```sh
pnpm add @accessible-react-mentions/core
```

Peer: `react@^18 || ^19`.

## Quick start

```ts
import { useMention, createTextareaAdapter } from '@accessible-react-mentions/core';
```

See the [`useMention` reference](https://accessible-react-mentions.vercel.app/reference/use-mention/) for the full API.

## Adapter

The `Adapter` interface is the architectural seam that lets one core power `<textarea>` today and contenteditable / Lexical / Slate later, without breaking changes:

```ts
interface Adapter {
  getValue(): string;
  getCaret(): number;
  splice(start: number, end: number, replacement: string): void;
  subscribe(listener: () => void): () => void;
}
```

`createTextareaAdapter(el)` ships with this package. Other adapters land in v1.x.

## License

MIT
