import { CompletionContext } from '@codemirror/autocomplete';
import { javascript } from '@codemirror/lang-javascript';
import { ensureSyntaxTree } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { describe, expect, it } from 'vitest';
import { SCALES, strudelCompletions } from '@/lib/editor/completions';
import { evaluatePure, onsets } from '@/lib/strudel/pure';

/** Completions at the `|` in the code. */
function complete(withCursor: string, explicit = false) {
  const pos = withCursor.indexOf('|');
  const doc = withCursor.replace('|', '');
  const state = EditorState.create({ doc, extensions: [javascript()] });
  ensureSyntaxTree(state, doc.length, 5000);
  const result = strudelCompletions(new CompletionContext(state, pos, explicit));
  return result && { from: result.from, labels: result.options.map((o) => o.label), typed: doc.slice(result.from, pos) };
}

describe('editor completions', () => {
  it('suggests methods after a dot', () => {
    const r = complete('note("c2").s("sawtooth").l|');
    expect(r?.typed).toBe('l');
    expect(r?.labels).toEqual(expect.arrayContaining(['lpf', 'lpq', 'lastOf']));
    expect(r?.labels).not.toContain('stack');
  });

  it('includes aliases as methods', () => {
    expect(complete('s("bd").|')?.labels).toEqual(expect.arrayContaining(['slow', 'every', 'sometimes', 'segment']));
  });

  it('suggests functions and your own parts at the start of an expression', () => {
    const r = complete('const kick = s("bd*4")\nstack(k|)');
    expect(r?.typed).toBe('k');
    expect(r?.labels).toEqual(expect.arrayContaining(['s', 'note', 'stack', 'sine', 'kick']));
  });

  it('stays quiet in numbers, comments and when naming a const', () => {
    expect(complete('s("bd").gain(0.|)')).toBeNull();
    expect(complete('// lp|')).toBeNull();
    expect(complete('const ki|')).toBeNull();
  });

  it('suggests drum names and synths inside s("…")', () => {
    const r = complete('s("~ o|")');
    expect(r?.typed).toBe('o');
    expect(r?.labels).toEqual(expect.arrayContaining(['oh', 'bd', 'sawtooth']));
  });

  it("lists only the machine's sounds when the chain has a .bank()", () => {
    const r = complete('s("b|").gain(.8).bank("RolandTR909")');
    expect(r?.labels).toContain('bd');
    expect(r?.labels).not.toContain('sawtooth');
    expect(r?.labels).not.toContain('cb'); // the 909 has no cowbell
  });

  it('does not pop up on an empty word or after a variant colon in s()', () => {
    expect(complete('s("bd |")')).toBeNull();
    expect(complete('s("bd:|")')).toBeNull();
    expect(complete('s("bd |")', true)?.labels).toContain('sd');
  });

  it('suggests machines inside .bank("…"), classics first', () => {
    const r = complete('s("bd*4").bank("Roland|")');
    expect(r?.typed).toBe('Roland');
    expect(r?.labels.slice(0, 3)).toEqual(['RolandTR808', 'RolandTR606', 'RolandTR909']);
    expect(r?.labels.length).toBeGreaterThan(60);
  });

  it('suggests scales after the root and colon', () => {
    expect(complete('n("0 2").scale("C|")')).toBeNull();
    const r = complete('n("0 2").scale("C:min|")');
    expect(r?.typed).toBe('min');
    expect(r?.labels).toContain('minor:pentatonic');
    expect(complete('n("0").scale("Eb2:minor:pen|")')?.typed).toBe('minor:pen');
    expect(complete('n("0").scale("<C:minor F:|>")')?.typed).toBe('');
  });

  it('suggests fixed choices for enum methods', () => {
    expect(complete('note("c2").ftype("|")', true)?.labels).toEqual(['12db', 'ladder', '24db']);
  });

  it('says nothing inside other strings (rhythms, notes, masks)', () => {
    expect(complete('note("c2 e|")')).toBeNull();
    expect(complete('s("hh*8").mask("1 0|")')).toBeNull();
    expect(complete('s("bd").struct("x ~ x|")')).toBeNull();
  });

  it('does not complete after a closed string', () => {
    expect(complete('s("bd")|')).toBeNull();
  });

  for (const [scale] of SCALES) {
    it(`scale "${scale}" is one Strudel knows`, async () => {
      const r = await evaluatePure(`n("0 2 4").scale("C:${scale}").s("sawtooth")`);
      if (!r.ok) throw new Error(r.message);
      // An unknown scale logs a Tonal error and plays nothing.
      const notes = onsets(r.pattern, 0, 1).map((h) => h.value.note);
      expect(notes).toHaveLength(3);
      expect(notes.every((n) => n !== undefined)).toBe(true);
    });
  }
});

describe('chord completions', () => {
  it('offers chord qualities after a root inside chord("…")', () => {
    const r = complete('chord("<Cm7 Ab|>")');
    expect(r?.typed).toBe('');
    expect(r?.labels.slice(0, 3)).toEqual(['-7', '^7', '7']);
    expect(r?.labels).toContain('-7b5');
    expect(r?.labels).not.toContain('maj7');
  });

  it('keeps the root and completes a part-typed quality', () => {
    const r = complete('chord("Ab^|")');
    expect(r?.typed).toBe('^');
    expect(r?.labels).toEqual(expect.arrayContaining(['^7', '^9']));
  });
});
