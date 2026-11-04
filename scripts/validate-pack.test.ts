// Validates lesson packs from the command line (through Vitest, which knows how to load Strudel in Node):
//   npm run lessons:validate                      the built-in packs
//   npm run lessons:validate -- path/to/pack.json one or more pack files
// Prints every finding and fails on any error.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import coreJson from '../content/packs/core.json';
import { CORE_CUSTOMS } from '../lib/lessons/custom';
import { formatFinding, validatePack } from '../lib/lessons/validate';

const paths = (process.env.PACKS ?? '').split(/\s+/).filter(Boolean);
const targets: { name: string; json: unknown; builtin: boolean }[] = paths.length
  ? paths.map((p) => ({ name: p, json: JSON.parse(readFileSync(p, 'utf8')), builtin: /^(content|public)\/packs\//.test(p) }))
  : [{ name: 'content/packs/core.json', json: coreJson, builtin: true }];

for (const t of targets) {
  it(t.name, async () => {
    const r = await validatePack(t.json, t.builtin ? { builtin: true, customs: CORE_CUSTOMS } : {});
    const lines = [`${t.name}: ${r.errors} error(s), ${r.warnings} warning(s), ${r.pack?.lessons.length ?? 0} lesson(s)`, ...r.findings.map((f) => '  ' + formatFinding(f))];
    console.log(lines.join('\n'));
    expect(r.errors, lines.join('\n')).toBe(0);
  }, 120_000);
}
