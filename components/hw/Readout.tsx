'use client';

import { cn } from '@heroui/react';
import { useEffect, useRef, useState } from 'react';

interface Props {
  /** The value as shown. */
  text: string;
  /** Called with what was typed; return false to reject it (the readout snaps back). */
  onCommit(raw: string): boolean;
  /** Dimmed: the value is the default. */
  dim?: boolean;
  isDisabled?: boolean;
  /** Where focus goes after a commit or cancel (the knob or fader). */
  focusAfter?: React.RefObject<HTMLElement | null>;
  'aria-label': string;
  className?: string;
}

/**
 * The small amber number under a knob or fader. It is also a text field: click it, type,
 * Enter commits, Esc cancels. `Readout.edit(ref)` opens it from the keyboard.
 */
export function Readout({ text, onCommit, dim, isDisabled, focusAfter, className, ...rest }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const input = useRef<HTMLInputElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const done = useRef(false);
  useEffect(() => {
    if (editing) {
      done.current = false;
      input.current?.focus();
      input.current?.select();
    }
  }, [editing]);
  const finish = (commit: boolean) => {
    if (done.current) return;
    done.current = true;
    if (!commit || !onCommit(draft)) setDraft(text);
    setEditing(false);
    (focusAfter?.current ?? button.current)?.focus();
  };
  const base = 'min-w-11 rounded-[3px] border border-black bg-hw-deep px-1.5 py-px text-center font-mono text-[11px] leading-[15px]';
  if (editing) {
    return (
      <input
        ref={input}
        className={cn(base, 'w-14 text-white outline-none focus:border-led', className)}
        value={draft}
        aria-label={rest['aria-label']}
        spellCheck={false}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => finish(true)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') finish(true);
          if (e.key === 'Escape') finish(false);
        }}
      />
    );
  }
  return (
    <button
      ref={button}
      type="button"
      data-readout
      className={cn(base, 'cursor-text hover:border-hw-muted', dim ? 'text-hw-muted' : 'text-led', isDisabled && 'cursor-default opacity-50', className)}
      aria-label={`${rest['aria-label']}: ${text}. Press to type a value`}
      disabled={isDisabled}
      onClick={() => {
        setDraft(text);
        setEditing(true);
      }}
    >
      {text}
    </button>
  );
}
