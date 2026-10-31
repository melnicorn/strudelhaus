// What the parser extracts from a project's code. Every editable value carries the exact source
// range it came from, so the GUI can change it by splicing text (see generate.ts).

export interface Range {
  from: number;
  to: number;
}

/** A literal argument the GUI can read and rewrite, or an expression it leaves alone. */
export type Arg =
  | { kind: 'number'; value: number; range: Range; raw: string }
  | { kind: 'string'; value: string; range: Range; raw: string }
  | { kind: 'expr'; range: Range; raw: string };

/** One `.method(args)` in a chain. `range` covers from the dot to the closing paren. */
export interface ChainCall {
  method: string;
  range: Range;
  args: Arg[];
  /** Inside the parens. Empty range for `.voicing()`. */
  argsRange: Range;
  /** In the allowlist. */
  known: boolean;
  /** Known, and its arguments are literals the control can edit. */
  editable: boolean;
}

export type BlockStatus = 'gui' | 'partial' | 'custom';

interface BlockBase {
  name: string;
  /** The whole `const name = …` statement. */
  range: Range;
  /** The initializer expression. */
  initRange: Range;
  status: BlockStatus;
  /** Why the block (or part of it) isn't fully GUI-editable. */
  notes: string[];
}

export interface PartBlock extends BlockBase {
  kind: 'part';
  root: { fn: string; arg: Arg; range: Range };
  chain: ChainCall[];
  /** A structural method (fast, every, sometimesBy…) is present: step grids are view-only. */
  structureLocked: boolean;
}

export interface ModifierBlock extends BlockBase {
  kind: 'modifier';
  param: string;
  chain: ChainCall[];
}

/** A wrapped use of a part inside stack(): `dubDelay(stab)`, `clap.postgain(.8)`. */
export interface Member {
  range: Range;
  base: string;
  /** Modifier names, outermost first. */
  wrappers: string[];
  postgain?: Arg;
}

export interface StackBlock extends BlockBase {
  /** 'section' when the arrangement plays it, otherwise 'group'. */
  kind: 'group' | 'section';
  members: Member[];
  /** Position just before the closing paren of stack(…), for appending members. */
  closeParen: number;
  argsRange: Range;
}

export interface CustomBlock extends BlockBase {
  kind: 'custom';
}

export interface KeyBlock extends BlockBase {
  kind: 'key';
  value: Arg;
}

export type Block = PartBlock | ModifierBlock | StackBlock | CustomBlock | KeyBlock;

export interface Tempo {
  /** BPM when written as setcpm(N/4) or setcpm(N). */
  bpm?: number;
  /** The argument of setcpm(…). */
  argRange: Range;
  statement: Range;
  status: 'gui' | 'custom';
}

export interface ArrangeRow {
  range: Range;
  bars: Arg;
  section: { name: string; range: Range };
}

/** Name used for a part written directly as the final expression, e.g. `s("bd*4")`. */
export const FINAL_PART = '$final';

export type Final =
  | { kind: 'part'; range: Range; status: 'gui' }
  | { kind: 'arrange'; range: Range; rows: ArrangeRow[]; closeParen: number; status: 'gui' }
  | { kind: 'stack'; range: Range; members: Member[]; closeParen: number; status: 'gui' }
  | { kind: 'custom'; range: Range; status: 'custom' };

export interface ProjectModel {
  code: string;
  syntaxError?: { message: string; line?: number };
  tempo?: Tempo;
  blocks: Block[];
  final?: Final;
}
