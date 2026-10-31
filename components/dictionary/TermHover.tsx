'use client';

import { cn } from '@heroui/react';
import { useEffect, useRef, useState } from 'react';
import { TERMS, TERMS_BY_CODE, termId, type Term } from '@/lib/dictionary/terms';
import { isMac } from '@/lib/platform';
import type { RefEntry } from '@/lib/reference/entries';

// Hold ⌘ (Ctrl elsewhere) and every dictionary word on the page gets a dotted underline; hovering
// one shows its definition, and ⌘-click opens it in the dictionary. Words are marked with
// data-term (prose) or data-code (editor tokens: functions and sound names).

interface Tip {
  title: string;
  body: string;
  code?: string;
  footer: string;
  href: string;
  x: number;
  y: number;
  /** Shown above the word when there's no room below. */
  above: boolean;
}

let reference: RefEntry[] | null = null;
const loadReference = () =>
  import('@/lib/reference/entries').then((m) => {
    reference = m.REFERENCE;
  });

function describe(el: HTMLElement, mod: string): Omit<Tip, 'x' | 'y' | 'above'> | null {
  const id = el.dataset.term;
  if (id) {
    const term = TERMS.find((t) => termId(t) === id);
    return term ? termTip(term, mod) : null;
  }
  const word = el.dataset.code;
  if (!word) return null;
  const term = TERMS_BY_CODE.get(word.toLowerCase());
  const ref = reference?.find((r) => r.name === word);
  if (term) {
    const tip = termTip(term, mod);
    return { ...tip, code: ref ? `${ref.display}: ${ref.does}` : undefined };
  }
  if (ref) return { title: ref.display, body: ref.does, footer: `Strudel · ${mod}-click for the reference`, href: `/reference#${encodeURIComponent(ref.name)}` };
  return null;
}

function termTip(term: Term, mod: string): Omit<Tip, 'x' | 'y' | 'above'> {
  return { title: term.term, body: term.definition, footer: `${term.category} · ${mod}-click for more`, href: `/dictionary#${termId(term)}` };
}

export function TermHover() {
  const [tip, setTip] = useState<Tip | null>(null);
  const hovered = useRef<HTMLElement | null>(null);
  const active = useRef(false);

  useEffect(() => {
    const mac = isMac();
    const mod = mac ? '⌘' : 'Ctrl';
    const isModKey = (e: KeyboardEvent) => e.key === (mac ? 'Meta' : 'Control');
    const root = document.documentElement;

    const show = () => {
      const el = hovered.current;
      const info = el && active.current ? describe(el, mod) : null;
      if (!el || !info) return setTip(null);
      const r = el.getBoundingClientRect();
      const above = r.bottom + 180 > window.innerHeight;
      setTip({ ...info, x: Math.max(8, Math.min(r.left, window.innerWidth - 328)), y: above ? r.top - 6 : r.bottom + 6, above });
    };
    const setActive = (on: boolean) => {
      if (active.current === on) return;
      active.current = on;
      root.classList.toggle('terms-on', on);
      if (on && !reference) void loadReference().then(show);
      show();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isModKey(e)) setActive(true);
      // Any other key with the modifier is a shortcut (⌘↵, ⌘C…): get out of the way.
      else if (active.current) setActive(false);
    };
    const onKeyUp = (e: KeyboardEvent) => isModKey(e) && setActive(false);
    const onBlur = () => setActive(false);
    const onOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest?.<HTMLElement>('[data-term], [data-code]') ?? null;
      if (el === hovered.current) return;
      hovered.current = el;
      if (active.current) show();
    };
    // ⌘-click opens the definition. Capture phase, so the editor doesn't add a cursor first.
    const onMouseDown = (e: MouseEvent) => {
      if (!active.current || !(mac ? e.metaKey : e.ctrlKey)) return;
      const el = (e.target as HTMLElement).closest?.<HTMLElement>('[data-term], [data-code]');
      const info = el && describe(el, mod);
      if (!info) return;
      e.preventDefault();
      e.stopPropagation();
      window.open(info.href, '_blank', 'noopener');
      setActive(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    document.addEventListener('mouseover', onOver);
    window.addEventListener('mousedown', onMouseDown, true);
    window.addEventListener('scroll', onBlur, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('mouseover', onOver);
      window.removeEventListener('mousedown', onMouseDown, true);
      window.removeEventListener('scroll', onBlur, true);
    };
  }, []);

  if (!tip) return null;
  return (
    <div
      className={cn(
        'pointer-events-none fixed z-[100] max-w-[320px] rounded-md bg-foreground px-2.5 py-2 text-[13px] leading-[1.4] text-background shadow-[0_6px_18px_rgba(0,0,0,0.25)]',
        tip.above && '-translate-y-full',
      )}
      role="tooltip"
      style={{ left: tip.x, top: tip.y }}
    >
      <b className="mb-0.5 block">{tip.title}</b>
      <div>{tip.body}</div>
      {tip.code && <div className="mt-1.5 font-mono text-xs opacity-85">{tip.code}</div>}
      <div className="mt-1.5 text-xs opacity-65">{tip.footer}</div>
    </div>
  );
}

