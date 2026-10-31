import { useState } from 'react';

/**
 * Local editable copy of a value that resets whenever the value changes from outside
 * (e.g. the learner edits the code by hand while a slider shows the old number).
 */
export function useDraft<T>(value: T): [T, (v: T) => void] {
  const [draft, setDraft] = useState(value);
  const [seen, setSeen] = useState(value);
  if (!Object.is(seen, value)) {
    setSeen(value);
    setDraft(value);
  }
  return [draft, setDraft];
}
