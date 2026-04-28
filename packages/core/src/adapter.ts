export interface Adapter {
  getValue(): string;
  getCaret(): number;
  /** Replace the slice [start, end) with `replacement`; caret moves to start + replacement.length. */
  splice(start: number, end: number, replacement: string): void;
  subscribe(listener: () => void): () => void;
}
