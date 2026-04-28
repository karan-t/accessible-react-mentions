import { useEffect, useRef, useState } from 'react';

// Screen readers only reliably announce content from a region that was in the
// DOM *before* the message changed — so the live region stays mounted instead
// of being conditional on the listbox.
export interface LiveAnnouncerProps {
  /** Set to '' to clear. */
  message: string;
  /** Defaults to 350ms. */
  debounceMs?: number;
}

export function LiveAnnouncer({ message, debounceMs = 350 }: LiveAnnouncerProps) {
  const [shown, setShown] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    if (message === '') {
      setShown('');
      return;
    }
    timer.current = setTimeout(() => setShown(message), debounceMs);
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, [message, debounceMs]);

  return (
    <div role="status" aria-live="polite" aria-atomic="true" style={visuallyHidden}>
      {shown}
    </div>
  );
}

const visuallyHidden = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const;
