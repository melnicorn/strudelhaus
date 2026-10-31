// Reads a project's code into a ProjectModel. Pure and synchronous (acorn only), so it can run
// on every keystroke. Anything outside the recognised shapes is reported as custom code and
// left alone; see docs/design.md §2.8.
import { parse, type Node } from 'acorn';
import { METHODS, ROOTS, isStructural } from './allowlist';
import { FINAL_PART } from './model';
import type {
  Arg,
  ArrangeRow,
  Block,
  ChainCall,
  Final,
  Member,
  ModifierBlock,
  PartBlock,
  ProjectModel,
  Range,
  StackBlock,
  Tempo,
} from './model';

/* eslint-disable @typescript-eslint/no-explicit-any */
type N = Node & Record<string, any>;

const range = (n: N): Range => ({ from: n.start, to: n.end });

export function parseProject(code: string): ProjectModel {
  let program: N;
  try {
    program = parse(code, { ecmaVersion: 2022, sourceType: 'script', allowAwaitOutsideFunction: true, locations: true }) as N;
  } catch (err) {
    const e = err as { message: string; loc?: { line: number } };
    return { code, blocks: [], syntaxError: { message: e.message, line: e.loc?.line } };
  }

  const model: ProjectModel = { code, blocks: [] };
  const body: N[] = program.body;
  const lastIndex = findLastIndex(body, (s) => s.type === 'ExpressionStatement' && !isSetcpm(s));

  body.forEach((stmt, i) => {
    if (isSetcpm(stmt)) {
      model.tempo = parseTempo(stmt, code);
    } else if (stmt.type === 'VariableDeclaration' && stmt.declarations.length === 1) {
      const decl = stmt.declarations[0];
      if (decl.id.type === 'Identifier' && decl.init) model.blocks.push(parseBlock(decl.id.name, stmt, decl.init, code));
    } else if (i === lastIndex) {
      model.final = parseFinal(stmt.expression, code);
      if (model.final.kind === 'custom') {
        // A bare part (`s("bd*4").bank(…)`) still gets controls, as an anonymous block.
        const part = parseBlock(FINAL_PART, stmt, stmt.expression, code);
        if (part.kind === 'part') {
          model.blocks.push(part);
          model.final = { kind: 'part', range: range(stmt.expression), status: 'gui' };
        }
      }
    }
  });

  // A stack() the arrangement plays is a section; other stacks are groups.
  if (model.final?.kind === 'arrange') {
    const sections = new Set(model.final.rows.map((r) => r.section.name));
    for (const b of model.blocks) if (b.kind === 'group' && sections.has(b.name)) b.kind = 'section';
  }
  return model;
}

function isSetcpm(stmt: N): boolean {
  return (
    stmt.type === 'ExpressionStatement' &&
    stmt.expression.type === 'CallExpression' &&
    stmt.expression.callee.type === 'Identifier' &&
    ['setcpm', 'setCpm', 'setcps', 'setCps'].includes(stmt.expression.callee.name)
  );
}

function parseTempo(stmt: N, code: string): Tempo {
  const call = stmt.expression;
  const arg = call.arguments[0];
  const argRange = arg ? range(arg) : { from: call.end - 1, to: call.end - 1 };
  const base = { argRange, statement: range(stmt) };
  if (!arg || !/^setcpm$/i.test(call.callee.name)) return { ...base, status: 'custom' };
  // setcpm(124/4) → 124 BPM. setcpm(31) → 124 BPM (written as cycles per minute).
  if (arg.type === 'BinaryExpression' && arg.operator === '/' && isNum(arg.left) && isNum(arg.right) && arg.right.value === 4) {
    return { ...base, bpm: arg.left.value, status: 'gui' };
  }
  if (isNum(arg)) return { ...base, bpm: arg.value * 4, status: 'gui' };
  void code;
  return { ...base, status: 'custom' };
}

function parseBlock(name: string, stmt: N, init: N, code: string): Block {
  const base = { name, range: range(stmt), initRange: range(init), notes: [] as string[] };

  if (name === 'key' && init.type === 'Literal' && typeof init.value === 'string') {
    return { ...base, kind: 'key', status: 'gui', value: toArg(init, code) };
  }
  if (init.type === 'ArrowFunctionExpression') return parseModifier(base, init, code);
  if (isCall(init, 'stack')) {
    const stack = parseStack(init, code);
    if (stack) return { ...base, kind: 'group', status: 'gui', ...stack } satisfies StackBlock;
    return { ...base, kind: 'custom', status: 'custom', notes: ['stack() contains something other than named parts'] };
  }
  const chain = unwindChain(init, code);
  if (chain && chain.root.type === 'CallExpression' && chain.root.callee.type === 'Identifier') {
    const fn = chain.root.callee.name;
    if ((ROOTS as readonly string[]).includes(fn) && chain.root.arguments.length === 1) {
      return finishPart({ ...base, kind: 'part', status: 'gui', root: { fn, arg: toArg(chain.root.arguments[0], code), range: range(chain.root) }, chain: chain.calls, structureLocked: false });
    }
  }
  return {
    ...base,
    kind: 'custom',
    status: 'custom',
    notes: ['It starts with something the controls don’t model, so only the code can change it.'],
  };
}

function finishPart(part: PartBlock): PartBlock {
  const notes: string[] = [];
  if (part.root.arg.kind !== 'string') notes.push(`${part.root.fn}(…) isn’t a plain string`);
  for (const c of part.chain) {
    if (isStructural(c.method)) part.structureLocked = true;
    if (!c.known) notes.push(`.${c.method}(…) is custom code`);
    else if (!c.editable) notes.push(`.${c.method}(…) has a value the controls can’t edit`);
  }
  part.notes = notes;
  part.status = notes.length ? 'partial' : 'gui';
  return part;
}

function parseModifier(base: { name: string; range: Range; initRange: Range; notes: string[] }, fn: N, code: string): Block {
  const param = fn.params.length === 1 && fn.params[0].type === 'Identifier' ? fn.params[0].name : null;
  const chain = param && fn.body.type !== 'BlockStatement' ? unwindChain(fn.body, code) : null;
  if (!param || !chain || chain.root.type !== 'Identifier' || chain.root.name !== param || chain.calls.length === 0) {
    return { ...base, kind: 'custom', status: 'custom', notes: ['Only modifiers shaped like x => x.method(…) have controls.'] };
  }
  const notes = chain.calls.filter((c) => !c.editable).map((c) => `.${c.method}(…) is custom code`);
  const mod: ModifierBlock = { ...base, kind: 'modifier', param, chain: chain.calls, notes, status: notes.length ? 'partial' : 'gui' };
  return mod;
}

function parseStack(call: N, code: string): Pick<StackBlock, 'members' | 'closeParen' | 'argsRange'> | null {
  const members: Member[] = [];
  for (const arg of call.arguments) {
    const m = parseMember(arg, code);
    if (!m) return null;
    members.push(m);
  }
  return { members, closeParen: call.end - 1, argsRange: argsRangeOf(call, code) };
}

/** `bass`, `dubDelay(stab)`, `rise16(dubDelay(acid))`, `clap.postgain(.8)`. */
function parseMember(node: N, code: string): Member | null {
  if (node.type === 'Identifier') return { range: range(node), base: node.name, wrappers: [] };
  if (node.type === 'CallExpression' && node.arguments.length === 1) {
    if (node.callee.type === 'Identifier') {
      const inner = parseMember(node.arguments[0], code);
      if (!inner || inner.postgain) return null;
      return { ...inner, range: range(node), wrappers: [node.callee.name, ...inner.wrappers] };
    }
    if (node.callee.type === 'MemberExpression' && !node.callee.computed && node.callee.property.name === 'postgain') {
      const inner = parseMember(node.callee.object, code);
      const arg = toArg(node.arguments[0], code);
      if (!inner || inner.postgain || arg.kind !== 'number') return null;
      return { ...inner, range: range(node), postgain: arg };
    }
  }
  return null;
}

function parseFinal(expr: N, code: string): Final {
  if (isCall(expr, 'arrange')) {
    const rows: ArrangeRow[] = [];
    for (const el of expr.arguments) {
      if (el.type !== 'ArrayExpression' || el.elements.length !== 2) return { kind: 'custom', range: range(expr), status: 'custom' };
      const [bars, section] = el.elements;
      const barsArg = toArg(bars, code);
      if (barsArg.kind !== 'number' || section.type !== 'Identifier') return { kind: 'custom', range: range(expr), status: 'custom' };
      rows.push({ range: range(el), bars: barsArg, section: { name: section.name, range: range(section) } });
    }
    return { kind: 'arrange', range: range(expr), rows, closeParen: expr.end - 1, status: 'gui' };
  }
  if (isCall(expr, 'stack')) {
    const s = parseStack(expr, code);
    if (s) return { kind: 'stack', range: range(expr), members: s.members, closeParen: s.closeParen, status: 'gui' };
  }
  return { kind: 'custom', range: range(expr), status: 'custom' };
}

/** Walks `root(...).a(...).b(...)` outward-in; returns the root node and calls in source order. */
function unwindChain(node: N, code: string): { root: N; calls: ChainCall[] } | null {
  const calls: ChainCall[] = [];
  let cur = node;
  while (cur.type === 'CallExpression' && cur.callee.type === 'MemberExpression' && !cur.callee.computed && cur.callee.property.type === 'Identifier') {
    const method: string = cur.callee.property.name;
    const args = cur.arguments.map((a: N) => toArg(a, code));
    const spec = METHODS[method];
    const known = !!spec;
    const editable = known && argsEditable(spec.arg, args);
    // From the dot (after the object) to the closing paren.
    const dot = code.lastIndexOf('.', cur.callee.property.start);
    calls.unshift({ method, range: { from: dot, to: cur.end }, args, argsRange: argsRangeOf(cur, code), known, editable });
    cur = cur.callee.object;
  }
  if (cur.type !== 'CallExpression' && cur.type !== 'Identifier') return null;
  return { root: cur, calls };
}

function argsEditable(kind: string, args: Arg[]): boolean {
  if (kind === 'none') return args.length === 0;
  if (args.length !== 1) return false;
  const a = args[0];
  if (kind === 'number') return a.kind === 'number';
  if (kind === 'mini-number') return a.kind === 'number' || a.kind === 'string';
  return a.kind === 'string';
}

function argsRangeOf(call: N, code: string): Range {
  if (call.arguments.length) return { from: call.arguments[0].start, to: call.arguments[call.arguments.length - 1].end };
  const open = code.indexOf('(', call.callee.end);
  return { from: open + 1, to: open + 1 };
}

function toArg(node: N, code: string): Arg {
  const raw = code.slice(node.start, node.end);
  const r = range(node);
  const num = numericValue(node);
  if (num !== null) return { kind: 'number', value: num, range: r, raw };
  if (node.type === 'Literal' && typeof node.value === 'string') return { kind: 'string', value: node.value, range: r, raw };
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return { kind: 'string', value: node.quasis[0].value.cooked, range: r, raw };
  }
  return { kind: 'expr', range: r, raw };
}

/** 0.5, -3, 3/16 (a fraction of two literals counts as a number). */
function numericValue(node: N): number | null {
  if (isNum(node)) return node.value;
  if (node.type === 'UnaryExpression' && node.operator === '-' && isNum(node.argument)) return -node.argument.value;
  if (node.type === 'BinaryExpression' && node.operator === '/' && isNum(node.left) && isNum(node.right) && node.right.value !== 0) {
    return node.left.value / node.right.value;
  }
  return null;
}

function isNum(node: N): boolean {
  return node?.type === 'Literal' && typeof node.value === 'number';
}

function isCall(node: N, name: string): boolean {
  return node?.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === name;
}

function findLastIndex<T>(arr: T[], pred: (t: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) if (pred(arr[i])) return i;
  return -1;
}

/** Block lookup helpers. */
export function findBlock(model: ProjectModel, name: string): Block | undefined {
  return model.blocks.find((b) => b.name === name);
}

export function getCall(part: PartBlock | ModifierBlock, method: string): ChainCall | undefined {
  return part.chain.find((c) => c.method === method);
}
