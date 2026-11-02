// Project-wide warnings the GUI shows next to blocks.
import { chordProblem, chordSymbolsIn } from '@/lib/music/chords';
import { METHODS } from './allowlist';
import type { ChainCall, ModifierBlock, PartBlock, ProjectModel } from './model';

export interface Diagnostic {
  severity: 'warning' | 'info';
  message: string;
  blocks: string[];
}

const ORBIT_SETTINGS = Object.keys(METHODS).filter((m) => METHODS[m].orbitWide);

function orbitOf(chain: ChainCall[]): number {
  const call = chain.find((c) => c.method === 'orbit');
  const a = call?.args[0];
  return a?.kind === 'number' ? a.value : 1; // Strudel's default orbit is 1
}

function sendSettings(chain: ChainCall[]): string {
  return chain
    .filter((c) => ORBIT_SETTINGS.includes(c.method))
    .map((c) => `${c.method}=${c.args.map((a) => a.raw).join(',')}`)
    .sort()
    .join(' ');
}

/**
 * Two blocks on the same orbit with different reverb/delay settings: only one setting wins
 * (gap G4). Modifiers count too, because they carry sends into whatever they wrap.
 */
export function orbitCollisions(model: ProjectModel): Diagnostic[] {
  const byOrbit = new Map<number, { name: string; settings: string }[]>();
  for (const b of model.blocks) {
    if (b.kind !== 'part' && b.kind !== 'modifier') continue;
    const settings = sendSettings((b as PartBlock | ModifierBlock).chain);
    if (!settings) continue;
    const orbit = orbitOf(b.chain);
    byOrbit.set(orbit, [...(byOrbit.get(orbit) ?? []), { name: b.name, settings }]);
  }
  const out: Diagnostic[] = [];
  for (const [orbit, users] of byOrbit) {
    const distinct = new Set(users.map((u) => u.settings));
    if (users.length > 1 && distinct.size > 1) {
      const names = users.map((u) => u.name);
      out.push({
        severity: 'warning',
        message: `${names.join(' and ')} share orbit ${orbit} but set reverb/delay differently. Only one setting applies; give each its own .orbit(n).`,
        blocks: names,
      });
    }
  }
  return out;
}

/** The lowest orbit no block uses yet (orbits start at 1; 1 is the default). */
export function nextFreeOrbit(model: ProjectModel): number {
  const used = new Set<number>([1]);
  for (const b of model.blocks) if (b.kind === 'part' || b.kind === 'modifier') used.add(orbitOf(b.chain));
  let n = 2;
  while (used.has(n)) n++;
  return n;
}

/**
 * chord("…") symbols that .voicing() doesn't know (Abmaj7 instead of Ab^7): Strudel plays
 * nothing for that bar and says nothing, so the GUI has to.
 */
export function unvoiceableChords(model: ProjectModel): Diagnostic[] {
  const out: Diagnostic[] = [];
  for (const b of model.blocks) {
    if (b.kind !== 'part' || b.root.fn !== 'chord' || b.root.arg.kind !== 'string') continue;
    const seen = new Set<string>();
    for (const symbol of chordSymbolsIn(b.root.arg.value)) {
      const problem = chordProblem(symbol);
      if (problem && !seen.has(symbol)) {
        seen.add(symbol);
        out.push({ severity: 'warning', message: `${b.name}: ${problem}`, blocks: [b.name] });
      }
    }
  }
  return out;
}

/** Names used in stacks or the arrangement that no block defines. */
export function undefinedReferences(model: ProjectModel): Diagnostic[] {
  const defined = new Set(model.blocks.map((b) => b.name));
  const missing = new Set<string>();
  const check = (name: string) => !defined.has(name) && missing.add(name);
  for (const b of model.blocks) {
    if (b.kind === 'group' || b.kind === 'section') for (const m of b.members) [m.base, ...m.wrappers].forEach(check);
  }
  if (model.final?.kind === 'arrange') model.final.rows.forEach((r) => check(r.section.name));
  if (model.final?.kind === 'stack') for (const m of model.final.members) [m.base, ...m.wrappers].forEach(check);
  return [...missing].map((name) => ({ severity: 'warning' as const, message: `“${name}” is used but never defined.`, blocks: [name] }));
}
