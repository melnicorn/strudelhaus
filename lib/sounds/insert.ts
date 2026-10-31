import { applyTextEdits } from '@/lib/sync/applyText';
import { addMember, insertBlock } from '@/lib/sync/generate';
import { parseProject } from '@/lib/sync/parseProject';

/**
 * Adds `const <name> = <expr>` to a project's code and, when the last line is a
 * stack(…), adds the new part to it so it's heard. Returns the new code and the name used.
 */
export function addPartToCode(code: string, baseName: string, expr: string): { code: string; name: string } {
  const model = parseProject(code);
  const taken = new Set(model.blocks.map((b) => b.name));
  let name = baseName;
  for (let n = 2; taken.has(name); n++) name = `${baseName}${n}`;
  let next = applyTextEdits(code, insertBlock(model, `const ${name} = ${expr}`));
  const after = parseProject(next);
  if (after.final?.kind === 'stack') next = applyTextEdits(next, addMember(next, after.final, name));
  else if (!after.final) next = `${next}${name}\n`;
  return { code: next, name };
}

/** A short, valid variable name for a sound ("bd:2" → "bd", "sawtooth" → "saw"). */
export function partNameFor(sound: string): string {
  const base = sound.split(':')[0].replace(/[^A-Za-z0-9_$]/g, '');
  const short: Record<string, string> = { sawtooth: 'saw', triangle: 'tri', supersaw: 'supersaw' };
  return short[base] ?? (/^\d/.test(base) ? `s${base}` : base || 'sound');
}
