import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import template from '@/content/packs/template.json';
import { allowedMethods, corePack, lessonHref, lessonState, knownSkills, searchLessons } from '@/lib/lessons/packs';
import { formatFinding, validatePack } from '@/lib/lessons/validate';

const index = JSON.parse(readFileSync('public/packs/index.json', 'utf8')) as string[];

describe('extra packs', () => {
  for (const file of index) {
    it(`${file} validates`, async () => {
      const r = await validatePack(JSON.parse(readFileSync(`public/packs/${file}`, 'utf8')), { builtin: true });
      expect(r.findings.filter((f) => f.level === 'error').map(formatFinding)).toEqual([]);
      expect(r.pack?.id).not.toBe('core');
    }, 120_000);
  }

  it('the author template validates as a community pack', async () => {
    const r = await validatePack(template);
    expect(r.findings.filter((f) => f.level === 'error').map(formatFinding)).toEqual([]);
  });
});

describe('pack registry', () => {
  const first = corePack.lessons[0];
  const tenth = corePack.lessons[9];

  it('qualifies ids and hrefs', () => {
    expect(first.id).toBe('01-press-play');
    expect(lessonHref(first)).toBe('/learn/01-press-play');
    expect(lessonHref({ id: 'deep-house/piano-stab', packId: 'deep-house' })).toBe('/lesson/?id=deep-house%2Fpiano-stab');
  });

  it('allows the methods of earlier lessons and of the skills involved', () => {
    const m = allowedMethods(tenth);
    expect(m.has('lpf')).toBe(true);
    expect(m.has('bank')).toBe(true);
    expect(m.has('swingBy')).toBe(false);
  });

  it('marks the next lesson of each track and knows skills from done lessons', () => {
    const progress = { '01-press-play': { status: 'done' as const, tasksPassed: [0, 1], challengePassed: false, manual: false, updatedAt: '2026-01-01T00:00:00.000Z' } };
    const known = knownSkills(progress);
    expect(known.has('B5')).toBe(true);
    expect(known.has('B4')).toBe(true); // a prerequisite of B5
    expect(lessonState(first, progress, known)).toBe('done');
    expect(lessonState(corePack.lessons[1], progress, known)).toBe('next');
    expect(lessonState(corePack.lessons[2], progress, known)).toBe('open');
  });

  it('searches titles, tags and skills', () => {
    expect(searchLessons('acid').map((l) => l.id)).toContain('25-acid-line');
    expect(searchLessons('', ['project']).every((l) => l.tags.includes('project'))).toBe(true);
    expect(searchLessons('swing').map((l) => l.id)).toContain('11-swing-it');
  });
});
