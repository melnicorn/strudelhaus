// The autocomplete popup: CodeMirror's, fed by lib/editor/completions (loaded on first use) and
// styled like the editor. Enter accepts, Esc closes, Ctrl-Space opens it by hand; Tab still indents
// and ⌘↵ still plays/pauses (that keymap is registered ahead of this one). Wrapped in a compartment so
// the setting can switch it off live.
import { autocompletion, type Completion, type CompletionContext } from '@codemirror/autocomplete';
import { Compartment, type Extension } from '@codemirror/state';
import { EditorView, tooltips } from '@codemirror/view';

export const autocompleteCompartment = new Compartment();

let source: Promise<typeof import('./completions')> | undefined;
const lazySource = (context: CompletionContext) => (source ??= import('./completions')).then((m) => m.strudelCompletions(context));

/** The small tag before each option, by completion type. */
const TAGS: Record<string, string> = {
  method: 'fn',
  function: 'fn',
  variable: 'sig',
  part: 'part',
  drum: 'drum',
  synth: 'synth',
  classic: '★',
  scale: 'scale',
  chord: 'chord',
};

const tag = {
  render(completion: Completion) {
    const span = document.createElement('span');
    span.className = 'cm-completionTag';
    span.textContent = TAGS[completion.type ?? ''] ?? '';
    return span;
  },
  position: 20,
};

const popupTheme = EditorView.theme(
  {
    '.cm-tooltip.cm-tooltip-autocomplete': {
      backgroundColor: '#262624',
      border: '1px solid #3c3b37',
      borderRadius: '6px',
      padding: '3px',
      boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
      color: '#e6e6e6',
    },
    '.cm-tooltip.cm-tooltip-autocomplete > ul': { fontFamily: 'var(--font-mono)', fontSize: '13px', maxHeight: '14em' },
    '.cm-tooltip.cm-tooltip-autocomplete > ul > li': {
      display: 'flex',
      alignItems: 'baseline',
      gap: '8px',
      padding: '2px 8px',
      borderRadius: '4px',
      lineHeight: '1.5',
    },
    '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': { backgroundColor: '#4a2412', color: '#fff' },
    '.cm-completionTag': {
      flex: 'none',
      width: '34px',
      fontFamily: 'var(--font-sans)',
      fontSize: '10px',
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: '#ff8a4c',
    },
    '.cm-completionMatchedText': { textDecoration: 'none', fontWeight: '600', color: '#fff' },
    '.cm-completionDetail': {
      marginLeft: 'auto',
      paddingLeft: '16px',
      fontFamily: 'var(--font-sans)',
      fontStyle: 'normal',
      fontSize: '12px',
      color: '#9a9890',
      maxWidth: '170px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '.cm-tooltip.cm-completionInfo': {
      backgroundColor: '#262624',
      border: '1px solid #3c3b37',
      borderRadius: '6px',
      padding: '8px 10px',
      width: '280px',
      maxWidth: '280px',
      fontFamily: 'var(--font-sans)',
      fontSize: '13px',
      lineHeight: '1.45',
      color: '#e6e6e6',
      boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
    },
    '.cm-ref-info b': { display: 'block', marginBottom: '2px', fontFamily: 'var(--font-mono)' },
    '.cm-ref-ex': { marginTop: '6px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#dcdcaa', whiteSpace: 'pre-wrap' },
    '.cm-ref-meta': { marginTop: '6px', fontSize: '12px', color: '#9a9890' },
    // A phone has no room beside the list: the list alone is still useful.
    '@media (max-width: 640px)': { '.cm-tooltip.cm-completionInfo': { display: 'none' } },
  },
  { dark: true },
);

export function autocomplete(enabled: boolean): Extension {
  if (!enabled) return [];
  return [
    autocompletion({ override: [lazySource], icons: false, addToOptions: [tag], interactionDelay: 150 }),
    // Mounted on <body>: inside the editor the popup sits in the sticky column's stacking context
    // and the GUI panels beside it paint over it.
    tooltips({ position: 'fixed', parent: document.body }),
    popupTheme,
  ];
}
