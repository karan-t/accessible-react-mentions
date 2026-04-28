import {
  type Adapter,
  createTextareaAdapter,
  type MentionItem,
  type ParsedMention,
  type TriggerConfig,
  type UseMentionResult,
  useMention,
} from '@accessible-react-mentions/core';
import { autoUpdate, flip, offset, shift, size, useFloating } from '@floating-ui/react';
import {
  type CSSProperties,
  createContext,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  type TextareaHTMLAttributes,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { LiveAnnouncer } from './LiveAnnouncer';

interface MentionContextValue<T extends MentionItem = MentionItem> extends UseMentionResult<T> {
  listboxId: string;
  inputRef: Ref<HTMLTextAreaElement>;
  registerInput: (el: HTMLTextAreaElement | null) => void;
  setReference: (el: HTMLElement | null) => void;
  setFloating: (el: HTMLElement | null) => void;
  floatingStyles: CSSProperties;
  itemId: (index: number) => string;
}

const MentionContext = createContext<MentionContextValue | null>(null);

function useMentionContext(): MentionContextValue {
  const ctx = useContext(MentionContext);
  if (ctx === null) {
    throw new Error('Mention.* components must be rendered inside <Mention.Root>.');
  }
  return ctx;
}

export interface MentionRootProps<T extends MentionItem = MentionItem> {
  triggers: readonly TriggerConfig<T>[];
  onChange?: (rawValue: string, plainText: string, mentions: ParsedMention[]) => void;
  onSelect?: (item: T) => void;
  defaultKind?: string;
  children: ReactNode;
}

function Root<T extends MentionItem = MentionItem>(props: MentionRootProps<T>) {
  const { triggers, onChange, onSelect, defaultKind, children } = props;

  const [inputEl, setInputEl] = useState<HTMLTextAreaElement | null>(null);
  const [adapter, setAdapter] = useState<Adapter | null>(null);

  useEffect(() => {
    if (!inputEl) {
      setAdapter(null);
      return;
    }
    setAdapter(createTextareaAdapter(inputEl));
  }, [inputEl]);

  const mention = useMention<T>({
    adapter,
    triggers,
    onChange,
    onSelect,
    defaultKind,
  });

  const listboxId = useId();
  const baseItemId = useId();
  const itemId = useCallback((index: number) => `${baseItemId}-${index}`, [baseItemId]);

  const { refs, floatingStyles } = useFloating({
    open: mention.isOpen,
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(4),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      size({
        apply({ availableHeight, elements }) {
          Object.assign(elements.floating.style, {
            maxHeight: `${Math.max(120, Math.min(320, availableHeight))}px`,
          });
        },
      }),
    ],
  });

  useEffect(() => {
    refs.setReference(inputEl);
  }, [inputEl, refs]);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const registerInput = useCallback((el: HTMLTextAreaElement | null) => {
    inputRef.current = el;
    setInputEl(el);
  }, []);

  const ctx = useMemo<MentionContextValue<T>>(
    () => ({
      ...mention,
      listboxId,
      inputRef,
      registerInput,
      setReference: refs.setReference,
      setFloating: refs.setFloating,
      floatingStyles: floatingStyles as CSSProperties,
      itemId,
    }),
    [
      mention,
      listboxId,
      registerInput,
      refs.setReference,
      refs.setFloating,
      floatingStyles,
      itemId,
    ],
  );

  return (
    <MentionContext.Provider value={ctx as unknown as MentionContextValue}>
      {children}
      <Announcements />
    </MentionContext.Provider>
  );
}

function Announcements() {
  const { isOpen, status, items, activeIndex } = useMentionContext();

  const message = useMemo(() => {
    if (!isOpen) return '';
    if (status === 'loading') return 'Loading suggestions';
    if (status === 'error') return 'Failed to load suggestions';
    if (items.length === 0) return 'No suggestions';
    const active = items[activeIndex];
    const count = `${items.length} suggestion${items.length === 1 ? '' : 's'} available`;
    return active ? `${count}. ${active.display} highlighted.` : count;
  }, [isOpen, status, items, activeIndex]);

  return <LiveAnnouncer message={message} />;
}

export interface MentionInputProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  /** When true (default), Tab on an open listbox accepts the highlighted item. */
  acceptOnTab?: boolean;
}

function Input(props: MentionInputProps) {
  const { acceptOnTab = true, onKeyDown, ...rest } = props;
  const ctx = useMentionContext();
  const {
    isOpen,
    listboxId,
    activeIndex,
    items,
    itemId,
    accept,
    close,
    moveHighlight,
    registerInput,
  } = ctx;

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;

    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        moveHighlight(1);
        return;
      case 'ArrowUp':
        e.preventDefault();
        moveHighlight(-1);
        return;
      case 'Home':
        e.preventDefault();
        moveHighlight(-items.length);
        return;
      case 'End':
        e.preventDefault();
        moveHighlight(items.length);
        return;
      case 'PageDown':
        e.preventDefault();
        moveHighlight(5);
        return;
      case 'PageUp':
        e.preventDefault();
        moveHighlight(-5);
        return;
      case 'Enter':
        // Only intercept Enter when there's a candidate; otherwise let the
        // textarea insert a newline (e.g. while loading or on error).
        if (items.length > 0) {
          e.preventDefault();
          accept();
        }
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        close();
        break;
      case 'Tab':
        if (acceptOnTab && items.length > 0 && activeIndex >= 0) {
          e.preventDefault();
          accept();
        }
        break;
      default:
    }
  };

  const activeId = isOpen && activeIndex >= 0 ? itemId(activeIndex) : undefined;

  return (
    <textarea
      {...rest}
      ref={registerInput}
      role="combobox"
      aria-expanded={isOpen}
      aria-controls={listboxId}
      aria-autocomplete="list"
      aria-activedescendant={activeId}
      aria-haspopup="listbox"
      onKeyDown={handleKeyDown}
    />
  );
}

export interface MentionListboxProps {
  children?: ReactNode;
  render?: (ctx: UseMentionResult) => ReactNode;
  className?: string;
}

function Listbox({ children, render, className }: MentionListboxProps) {
  const ctx = useMentionContext();
  if (!ctx.isOpen) return null;

  return (
    <div
      ref={ctx.setFloating}
      id={ctx.listboxId}
      role="listbox"
      style={{ ...ctx.floatingStyles, overflowY: 'auto' }}
      className={className}
    >
      {render ? render(ctx) : children}
    </div>
  );
}

export interface MentionItemProps<T extends MentionItem = MentionItem> {
  index: number;
  item: T;
  children: ReactNode;
  className?: string;
}

function Item<T extends MentionItem = MentionItem>(props: MentionItemProps<T>) {
  const { index, item, children, className } = props;
  const ctx = useMentionContext();
  const isActive = ctx.activeIndex === index;
  const id = ctx.itemId(index);

  return (
    <div
      id={id}
      role="option"
      tabIndex={-1}
      aria-selected={isActive}
      data-active={isActive ? '' : undefined}
      className={className}
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        // Prevent the textarea from losing focus before splice runs.
        e.preventDefault();
        ctx.acceptItem(item);
      }}
      onMouseEnter={() => ctx.setHighlight(index)}
    >
      {children}
    </div>
  );
}

function Loading({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div role="presentation" className={className} data-arm-state="loading">
      {children ?? 'Loading…'}
    </div>
  );
}

function Error_({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div role="presentation" className={className} data-arm-state="error">
      {children ?? 'Failed to load suggestions.'}
    </div>
  );
}

function Empty({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div role="presentation" className={className} data-arm-state="empty">
      {children ?? 'No suggestions.'}
    </div>
  );
}

export const Mention = Object.assign(Root, {
  Root,
  Input,
  Listbox,
  Item,
  Loading,
  Error: Error_,
  Empty,
});

export type { MentionItem, ParsedMention, TriggerConfig, UseMentionResult };
export { useMention };
