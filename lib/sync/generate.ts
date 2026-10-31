// GUI actions → minimal text edits. Every edit names the exact text it replaces (`expected`),
// so applyGuiEdits refuses it if the code changed in the meantime. Nothing here rewrites
// text outside the range a control owns.
import type { TextEdit } from '@/lib/editor/guiEdits';
import { METHODS } from './allowlist';
import { formatNumber } from './miniGrid';
import type { Arg, ChainCall, Member, ModifierBlock, PartBlock, ProjectModel, Range, StackBlock } from './model';

const slice = (code: string, r: Range) => code.slice(r.from, r.to);

function replace(code: string, r: Range, insert: string): TextEdit {
  return { from: r.from, to: r.to, expected: slice(code, r), insert };
}

/** Writes a JS string literal for mini-notation, keeping the original quote style. */
export function quote(value: string, like?: Arg): string {
  const q = like?.raw?.[0] === '`' ? '`' : like?.raw?.[0] === "'" ? "'" : '"';
  return q + value.replace(new RegExp(q, 'g'), '\\' + q) + q;
}

/** Literal for a control value: numbers plainly, strings quoted. */
export function literal(value: number | string, like?: Arg): string {
  return typeof value === 'number' ? formatNumber(value) : quote(value, like);
}

// ---------- tempo ----------

export function setTempo(model: ProjectModel, bpm: number): TextEdit[] {
  const code = model.code;
  const value = `${formatNumber(Math.round(bpm * 10) / 10)}/4`;
  if (model.tempo) {
    if (model.tempo.status !== 'gui') return [];
    return [replace(code, model.tempo.argRange, value)];
  }
  return [{ from: 0, to: 0, expected: '', insert: `setcpm(${value})\n` }];
}

// ---------- parts and modifiers ----------

export function setRootArg(code: string, part: PartBlock, value: string): TextEdit[] {
  return [replace(code, part.root.arg.range, quote(value, part.root.arg))];
}

/** Sets the single argument of an existing call. */
export function setCallArg(code: string, call: ChainCall, value: number | string): TextEdit[] {
  if (call.args.length === 1) return [replace(code, call.args[0].range, literal(value, call.args[0]))];
  return [replace(code, call.argsRange, literal(value))];
}

/** Sets a control: edits the call if present, otherwise appends `.method(value)`. */
export function setControl(
  code: string,
  block: PartBlock | ModifierBlock,
  method: string,
  value: number | string,
): TextEdit[] {
  const call = block.chain.find((c) => c.method === method);
  if (call) return call.editable ? setCallArg(code, call, value) : [];
  return addMethod(code, block, method, value);
}

/** Appends `.method(value)` at the end of the chain. */
export function addMethod(code: string, block: PartBlock | ModifierBlock, method: string, value?: number | string): TextEdit[] {
  const spec = METHODS[method];
  const v = value ?? spec?.default;
  const arg = spec?.arg === 'none' || v === undefined ? '' : literal(v);
  const end = chainEnd(block);
  const call = `.${method}(${arg})`;
  // Keep generated code readable: start a new indented line instead of growing a long one.
  const lineStart = code.lastIndexOf('\n', end - 1) + 1;
  const wrap = end - lineStart + call.length > MAX_LINE;
  return [{ from: end, to: end, expected: '', insert: wrap ? `\n  ${call}` : call }];
}

const MAX_LINE = 72;

/** Removes `.method(…)`, including the line break before it if it sat on its own line. */
export function removeCall(code: string, call: ChainCall): TextEdit[] {
  let from = call.range.from;
  const before = code.slice(0, from);
  const ws = /\n[ \t]*$/.exec(before);
  if (ws) from -= ws[0].length;
  return [{ from, to: call.range.to, expected: code.slice(from, call.range.to), insert: '' }];
}

function chainEnd(block: PartBlock | ModifierBlock): number {
  if (block.chain.length) return block.chain[block.chain.length - 1].range.to;
  if (block.kind === 'part') return block.root.range.to;
  return block.initRange.to;
}

// ---------- stacks: groups, sections, the final stack ----------

type StackLike = Pick<StackBlock, 'members' | 'closeParen'>;

export function memberText(m: { base: string; wrappers: string[]; postgain?: number }): string {
  let t = m.base;
  for (const w of [...m.wrappers].reverse()) t = `${w}(${t})`;
  if (m.postgain !== undefined && m.postgain !== 1) t += `.postgain(${formatNumber(m.postgain)})`;
  return t;
}

export function addMember(code: string, stack: StackLike, text: string): TextEdit[] {
  const at = stack.members.length ? stack.members[stack.members.length - 1].range.to : stack.closeParen;
  const insert = stack.members.length ? `, ${text}` : text;
  return [{ from: at, to: at, expected: '', insert }];
}

export function removeMember(code: string, stack: StackLike, index: number): TextEdit[] {
  const m = stack.members[index];
  if (!m) return [];
  let { from, to } = m.range;
  if (index < stack.members.length - 1) {
    to = stack.members[index + 1].range.from; // "a, " — take the following separator
  } else if (index > 0) {
    from = stack.members[index - 1].range.to; // ", a" — take the preceding separator
  }
  return [{ from, to, expected: code.slice(from, to), insert: '' }];
}

/** Rewrites one member (wrap/unwrap a modifier, change its level). */
export function rewriteMember(
  code: string,
  member: Member,
  change: { wrappers?: string[]; postgain?: number },
): TextEdit[] {
  const next = {
    base: member.base,
    wrappers: change.wrappers ?? member.wrappers,
    postgain: change.postgain ?? (member.postgain?.kind === 'number' ? member.postgain.value : undefined),
  };
  return [replace(code, member.range, memberText(next))];
}

// ---------- arrangement ----------

export function setSectionBars(code: string, model: ProjectModel, rowIndex: number, bars: number): TextEdit[] {
  if (model.final?.kind !== 'arrange') return [];
  const row = model.final.rows[rowIndex];
  return row ? [replace(code, row.bars.range, String(Math.max(1, Math.round(bars))))] : [];
}

/** Adds `const name = stack()` before the arrangement and a row `[bars, name]` at its end. */
export function addSection(code: string, model: ProjectModel, name: string, bars = 16): TextEdit[] {
  if (model.final?.kind !== 'arrange') return [];
  const final = model.final;
  const lineStart = code.lastIndexOf('\n', final.range.from) + 1;
  const decl: TextEdit = { from: lineStart, to: lineStart, expected: '', insert: `const ${name} = stack()\n\n` };
  const last = final.rows[final.rows.length - 1];
  const at = last ? last.range.to : final.closeParen;
  const rowText = last ? `,\n  [${bars}, ${name}]` : `[${bars}, ${name}]`;
  return [decl, { from: at, to: at, expected: '', insert: rowText }];
}

export function removeArrangeRow(code: string, model: ProjectModel, rowIndex: number): TextEdit[] {
  if (model.final?.kind !== 'arrange') return [];
  const rows = model.final.rows;
  const asMembers = rows.map((r) => ({ range: r.range, base: r.section.name, wrappers: [] }));
  return removeMember(code, { members: asMembers, closeParen: model.final.closeParen }, rowIndex);
}

export function moveArrangeRow(code: string, model: ProjectModel, rowIndex: number, delta: -1 | 1): TextEdit[] {
  if (model.final?.kind !== 'arrange') return [];
  const rows = model.final.rows;
  const other = rowIndex + delta;
  if (other < 0 || other >= rows.length) return [];
  const a = rows[Math.min(rowIndex, other)];
  const b = rows[Math.max(rowIndex, other)];
  // Swap the two row texts in one edit spanning both, keeping the separator between them.
  const span = { from: a.range.from, to: b.range.to };
  const between = code.slice(a.range.to, b.range.from);
  return [replace(code, span, slice(code, b.range) + between + slice(code, a.range))];
}

/** Inserts a new block (`const …`) before the final statement, or at the end. */
export function insertBlock(model: ProjectModel, text: string): TextEdit[] {
  const code = model.code;
  const at = model.final ? code.lastIndexOf('\n', model.final.range.from) + 1 : code.length;
  const insert = model.final ? `${text}\n` : `${code.endsWith('\n') || !code ? '' : '\n'}${text}\n`;
  return [{ from: at, to: at, expected: '', insert }];
}
