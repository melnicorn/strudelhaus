import { TERMS, type Term } from './terms';

export interface TermMatch {
  from: number;
  to: number;
  term: Term;
}

const PHRASES = new Map<string, Term>();
for (const t of TERMS) for (const p of t.match ?? [t.term, ...(t.aliases ?? [])]) if (!PHRASES.has(p.toLowerCase())) PHRASES.set(p.toLowerCase(), t);

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Longest phrases first, so "open hi-hat" wins over "hi-hat" and "kick drum" over "kick".
const PATTERN = new RegExp(
  `(?<![\\w-])(${[...PHRASES.keys()].sort((a, b) => b.length - a.length).map(escape).join('|')})(?![\\w-])`,
  'gi',
);

/**
 * Dictionary words in plain text. Each term is matched once: `seen` carries the terms already
 * marked (pass the same set for a whole paragraph so it isn't covered in dots).
 */
export function findTerms(text: string, seen: Set<Term> = new Set()): TermMatch[] {
  const out: TermMatch[] = [];
  for (const m of text.matchAll(PATTERN)) {
    const term = PHRASES.get(m[1].toLowerCase());
    if (!term || seen.has(term)) continue;
    seen.add(term);
    out.push({ from: m.index!, to: m.index! + m[1].length, term });
  }
  return out;
}
