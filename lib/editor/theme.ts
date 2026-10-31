import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';

const editorTheme = EditorView.theme(
  {
    '&': { backgroundColor: '#1e1e1e', color: '#e6e6e6', borderRadius: '8px', fontSize: '14px' },
    '.cm-content': { fontFamily: 'var(--font-mono)', padding: '10px 0', caretColor: '#fff' },
    '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.6' },
    '.cm-gutters': { backgroundColor: '#1e1e1e', color: '#6e6e6e', border: 'none', borderRadius: '8px 0 0 8px' },
    '.cm-activeLine': { backgroundColor: 'rgba(255,255,255,0.04)' },
    '.cm-activeLineGutter': { backgroundColor: 'transparent', color: '#bbb' },
    '&.cm-focused .cm-cursor': { borderLeftColor: '#fff' },
    '&.cm-focused .cm-selectionBackground, ::selection, .cm-selectionBackground': {
      backgroundColor: 'rgba(120,160,255,0.3) !important',
    },
    '.cm-playing': { outline: '1.5px solid #f8f8f2', borderRadius: '2px' },
    '.cm-gui-changed': { borderRadius: '2px', animation: 'cm-gui-flash 1.6s ease-out' },
    '.cm-error-line': { backgroundColor: 'rgba(255,80,80,0.15)' },
  },
  { dark: true },
);

const highlight = HighlightStyle.define([
  { tag: t.string, color: '#ce9178' },
  { tag: [t.number, t.bool], color: '#b5cea8' },
  { tag: t.comment, color: '#6a9955', fontStyle: 'italic' },
  { tag: [t.keyword, t.definitionKeyword, t.modifier], color: '#569cd6' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: '#dcdcaa' },
  { tag: t.propertyName, color: '#dcdcaa' },
  { tag: t.variableName, color: '#9cdcfe' },
  { tag: t.definition(t.variableName), color: '#4fc1ff' },
  { tag: [t.operator, t.punctuation], color: '#d4d4d4' },
]);

export const strudelTheme = [editorTheme, syntaxHighlighting(highlight)];
