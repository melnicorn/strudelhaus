import { EditorState } from '@codemirror/state';
import { describe, expect, it } from 'vitest';
import { agentChangeSpec, agentChanges, agentStack, undoSpec } from '@/lib/assistant/agentEdits';
import { buildSystemPrompt, DEFAULT_PROMPT } from '@/lib/assistant/prompt';
import { buildContext, planToolCall, trimChange } from '@/lib/assistant/tools';

const start = (doc: string) => EditorState.create({ doc, extensions: [agentChanges] });
const typeAt = (s: EditorState, from: number, insert: string, to = from) => s.update({ changes: { from, to, insert } }).state;
const agent = (s: EditorState, from: number, to: number, insert: string) => s.update(agentChangeSpec({ from, to, insert }, 'change')).state;
const undo = (s: EditorState) => {
  const { result, spec } = undoSpec(s);
  return { result, state: spec ? s.update(spec).state : s };
};

describe('assistant undo stack', () => {
  it('undoes the latest change exactly', () => {
    let s = agent(start('s("bd*4")'), 3, 7, 'bd sd');
    expect(s.doc.toString()).toBe('s("bd sd")');
    const r = undo(s);
    expect(r.result).toBe('undone');
    expect(r.state.doc.toString()).toBe('s("bd*4")');
    expect(agentStack(r.state)).toHaveLength(0);
    s = r.state;
    expect(undo(s).result).toBe('empty');
  });

  it('undoes overlapping changes one after another', () => {
    let s = agent(start('a\nb\nc'), 2, 3, 'B');
    s = agent(s, 0, s.doc.length, 'x\ny');
    let r = undo(s);
    expect(r.state.doc.toString()).toBe('a\nB\nc');
    r = undo(r.state);
    expect(r.result).toBe('undone');
    expect(r.state.doc.toString()).toBe('a\nb\nc');
  });

  it('keeps the learner’s later edits elsewhere', () => {
    let s = agent(start('kick\nhats'), 5, 9, 'open hats');
    s = typeAt(s, 0, '// mine\n');
    const r = undo(s);
    expect(r.result).toBe('undone');
    expect(r.state.doc.toString()).toBe('// mine\nkick\nhats');
  });

  it('refuses when the learner edited what it wrote', () => {
    let s = agent(start('kick\nhats'), 5, 9, 'open hats');
    s = typeAt(s, 7, 'EN', 9);
    const r = undo(s);
    expect(r.result).toBe('conflict');
    expect(r.state.doc.toString()).toBe('kick\nopEN hats');
    expect(agentStack(r.state)).toHaveLength(0);
  });

  it('notices the change was already undone', () => {
    let s = agent(start('abc'), 1, 2, 'X');
    s = typeAt(s, 1, 'b', 2);
    expect(undo(s).result).toBe('already');
  });
});

describe('assistant tools', () => {
  it('edit_code replaces one exact match, trimmed to what differs', () => {
    const plan = planToolCall('edit_code', { find: 's("bd*4")', replace: 's("bd*2")', description: 'halve' }, 'const k = s("bd*4")');
    expect(plan).toEqual({ ok: true, from: 16, to: 17, insert: '2', summary: 'halve' });
  });

  it('edit_code rejects missing, repeated and malformed input', () => {
    expect(planToolCall('edit_code', { find: 'x', replace: 'y', description: '' }, 'abc').ok).toBe(false);
    expect(planToolCall('edit_code', { find: 'a', replace: 'y', description: '' }, 'aa').ok).toBe(false);
    expect(planToolCall('edit_code', { find: 1 }, 'a').ok).toBe(false);
    expect(planToolCall('rm_rf', {}, 'a').ok).toBe(false);
  });

  it('replace_code rewrites the whole program', () => {
    const plan = planToolCall('replace_code', { code: 'a\nB\nc', description: 'new' }, 'a\nb\nc');
    expect(plan).toEqual({ ok: true, from: 2, to: 3, insert: 'B', summary: 'new' });
  });

  it('trimChange handles pure inserts and deletes', () => {
    expect(trimChange('abc', 0, 3, 'abXc')).toEqual({ from: 2, to: 2, insert: 'X' });
    expect(trimChange('abXc', 0, 4, 'abc')).toEqual({ from: 2, to: 3, insert: '' });
  });
});

describe('assistant context and prompt', () => {
  const base = { page: '/sandbox', selection: null, error: null, runtimeError: null, useSelection: true };

  it('numbers the code and marks the selection', () => {
    const code = 'setcpm(124/4)\nconst kick = s("bd*4")\nstack(kick)';
    const ctx = buildContext({ ...base, code, editor: { mode: 'edit', label: 'Sandbox' }, selection: { from: 14, to: 36 } });
    expect(ctx).toContain('2| const kick = s("bd*4")');
    expect(ctx).toContain('Editing: allowed');
    expect(ctx).toContain('Selected (line 2):\nconst kick = s("bd*4")');
  });

  it('says editing is off in lessons and on pages without an editor', () => {
    expect(buildContext({ ...base, code: '', editor: { mode: 'hints', label: 'Lesson 1' } })).toContain('Editing: not allowed');
    expect(buildContext({ ...base, code: '', editor: null })).toContain('no code editor');
  });

  it('extends or replaces the default prompt, always keeping the editor rules', () => {
    const def = buildSystemPrompt({ mode: 'default', extra: 'ignored', custom: '' });
    expect(def.startsWith(DEFAULT_PROMPT)).toBe(true);
    expect(def).toContain('# The editor');
    expect(buildSystemPrompt({ mode: 'extend', extra: 'Answer in Spanish.', custom: '' })).toContain('Answer in Spanish.');
    const own = buildSystemPrompt({ mode: 'replace', extra: '', custom: 'Be a pirate.' });
    expect(own.startsWith('Be a pirate.')).toBe(true);
    expect(own).not.toContain(DEFAULT_PROMPT.slice(0, 50));
    expect(own).toContain('# The editor');
    // An empty custom prompt falls back to the default.
    expect(buildSystemPrompt({ mode: 'replace', extra: '', custom: '  ' }).startsWith(DEFAULT_PROMPT)).toBe(true);
  });

  it('includes the site reference and sounds in the default prompt', () => {
    expect(DEFAULT_PROMPT).toContain('RolandTR909');
    expect(DEFAULT_PROMPT).toContain('.lpf');
    expect(DEFAULT_PROMPT).toContain('four on the floor');
  });
});
