import { Fragment, type ReactNode } from 'react';
import { findTerms } from '@/lib/dictionary/match';
import { termId, type Term } from '@/lib/dictionary/terms';

/** Renders lesson text: blank-line paragraphs, "- " bullets, `code`, **bold** and *italic*. */
export function Prose({ text }: { text: string }) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <div>
      {blocks.map((block, i) => {
        const lines = block.split('\n');
        // Dictionary words are marked once per paragraph or list.
        const seen = new Set<Term>();
        if (lines.every((l) => l.trim().startsWith('- '))) {
          return (
            <ul key={i} className="mb-2.5 list-disc pl-5 last:mb-0">
              {lines.map((l, j) => (
                <li key={j}>{inline(l.trim().slice(2), seen)}</li>
              ))}
            </ul>
          );
        }
        return <p key={i} className="mb-2.5 last:mb-0">{inline(block.replace(/\n/g, ' '), seen)}</p>;
      })}
    </div>
  );
}

export function inline(text: string, seen: Set<Term> = new Set()): ReactNode {
  // *italic* only around words, so mini-notation like "[hh*4]*3" in hints is left alone.
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|(?<![\w\]"])\*[A-Za-z][^*]*[A-Za-z]\*(?![\w\["]))/g);
  return parts.map((p, i) => {
    if (p.startsWith('`') && p.endsWith('`')) return <code key={i}>{p.slice(1, -1)}</code>;
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{withTerms(p.slice(2, -2), seen)}</strong>;
    if (p.length > 2 && p.startsWith('*') && p.endsWith('*')) return <em key={i}>{withTerms(p.slice(1, -1), seen)}</em>;
    return <Fragment key={i}>{withTerms(p, seen)}</Fragment>;
  });
}

/** Plain text with dictionary words wrapped, so holding ⌘ underlines them and hovering defines them. */
export function withTerms(text: string, seen: Set<Term> = new Set()): ReactNode {
  const matches = findTerms(text, seen);
  if (!matches.length) return text;
  const out: ReactNode[] = [];
  let at = 0;
  for (const m of matches) {
    out.push(text.slice(at, m.from));
    out.push(
      <span key={m.from} data-term={termId(m.term)}>
        {text.slice(m.from, m.to)}
      </span>,
    );
    at = m.to;
  }
  out.push(text.slice(at));
  return out;
}
