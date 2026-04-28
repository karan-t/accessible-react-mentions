import type { Adapter } from '../adapter';

export function createTextareaAdapter(el: HTMLTextAreaElement): Adapter {
  const listeners = new Set<() => void>();
  // Many of the listeners below fire back-to-back for one user action (input
  // then keyup, mouseup then selectionchange). Dedup on the value+caret tuple
  // so subscribers only see real changes.
  let lastSig = '';
  const notify = () => {
    const sig = `${el.value}\x00${el.selectionEnd ?? el.value.length}`;
    if (sig === lastSig) return;
    lastSig = sig;
    for (const l of listeners) l();
  };

  const onInput = () => notify();
  const onSelectionChange = () => {
    if (document.activeElement === el) notify();
  };
  // Arrow keys move the caret without firing `input`; older Safari needs keyup as fallback.
  const onKeyUp = () => notify();
  const onMouseUp = () => notify();

  el.addEventListener('input', onInput);
  el.addEventListener('keyup', onKeyUp);
  el.addEventListener('mouseup', onMouseUp);
  document.addEventListener('selectionchange', onSelectionChange);

  return {
    getValue() {
      return el.value;
    },
    getCaret() {
      return el.selectionEnd ?? el.value.length;
    },
    splice(start, end, replacement) {
      el.focus();
      el.setRangeText(replacement, start, end, 'end');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          el.removeEventListener('input', onInput);
          el.removeEventListener('keyup', onKeyUp);
          el.removeEventListener('mouseup', onMouseUp);
          document.removeEventListener('selectionchange', onSelectionChange);
        }
      };
    },
  };
}
