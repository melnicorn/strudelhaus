import { CompletionContext, type Completion } from '@codemirror/autocomplete';
import { javascript } from '@codemirror/lang-javascript';
import { ensureSyntaxTree } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { describe, expect, it } from 'vitest';
import { strudelCompletions } from '@/lib/editor/completions';

function options(withCursor: string): readonly Completion[] {
  const pos = withCursor.indexOf('|');
  const doc = withCursor.replace('|', '');
  const state = EditorState.create({ doc, extensions: [javascript()] });
  ensureSyntaxTree(state, doc.length, 5000);
  return strudelCompletions(new CompletionContext(state, pos, false))!.options;
}

describe('completion ranking', () => {
  it('boosts the GUI filter methods above lastOf for ".l"', () => {
    const boost = (label: string) => options('s("bd").l|').find((o) => o.label === label)!.boost!;
    expect(boost('lpf')).toBeGreaterThan(boost('lpattack'));
    expect(boost('lpattack')).toBeGreaterThan(boost('lastOf'));
  });

  it('gives hand-written entries short right-column labels', () => {
    const detail = (label: string) => options('s("bd").|').find((o) => o.label === label)!.detail;
    expect(detail('lastOf')).toBe('every n cycles');
    expect(detail('every')).toBe('every n cycles');
    expect(detail('slow')).toBe('slow down');
    expect(detail('lpf')).toBe('low-pass cutoff');
  });
});
