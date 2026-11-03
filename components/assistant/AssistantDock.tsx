'use client';

import { Button, cn, TextArea } from '@heroui/react';
import { useEffect, useRef } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import { useEditorStore } from '@/lib/stores/editor';
import { useAssistantStore, type ChatItem } from '@/lib/stores/assistant';
import { AssistantSettings } from './AssistantSettings';

/** Header button that opens and closes the assistant panel. */
export function AssistantToggle() {
  const open = useAssistantStore((s) => s.config.open);
  const setOpen = useAssistantStore((s) => s.setOpen);
  useEffect(() => useAssistantStore.getState().load(), []);
  return (
    <Button size="sm" variant={open ? 'secondary' : 'ghost'} className="ml-auto" aria-pressed={open} onPress={() => setOpen(!open)}>
      ✦ Assistant
    </Button>
  );
}

/** The assistant chat, docked to the right of the page. */
export function AssistantDock() {
  const open = useAssistantStore((s) => s.config.open);
  const loaded = useAssistantStore((s) => s.loaded);
  const hasKey = useAssistantStore((s) => !!s.config.apiKey);
  const showSettings = useAssistantStore((s) => s.showSettings);
  const { setOpen, setShowSettings, clear } = useAssistantStore.getState();
  if (!loaded || !open) return null;

  const settings = showSettings;
  return (
    <aside className="flex w-[400px] shrink-0 flex-col border-l border-border bg-surface" aria-label="Assistant">
      <div className="flex items-center gap-1 border-b border-border px-3 py-1.5">
        <strong className="mr-auto text-sm">{settings ? 'Assistant settings' : 'Assistant'}</strong>
        {!settings && (
          <Button size="sm" variant="ghost" onPress={clear} aria-label="New chat">
            New chat
          </Button>
        )}
        {hasKey && (
          <Button size="sm" variant="ghost" onPress={() => setShowSettings(!showSettings)} aria-label={settings ? 'Back to chat' : 'Settings'}>
            {settings ? '◀ Chat' : '⚙'}
          </Button>
        )}
        <Button size="sm" variant="ghost" isIconOnly onPress={() => setOpen(false)} aria-label="Close the assistant">
          ✕
        </Button>
      </div>
      {settings ? <AssistantSettings /> : <Chat />}
    </aside>
  );
}

const markdown: Components = {
  pre: ({ children }) => <pre className="my-2 overflow-x-auto rounded-md bg-code p-2 font-mono text-xs text-code-foreground">{children}</pre>,
  code: ({ children, className }) => <code className={cn('font-mono text-[0.92em]', !className && 'rounded bg-default px-1')}>{children}</code>,
  p: ({ children }) => <p className="my-1.5">{children}</p>,
  ul: ({ children }) => <ul className="my-1.5 list-disc pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-1.5 list-decimal pl-5">{children}</ol>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
      {children}
    </a>
  ),
};

function Chat() {
  const items = useAssistantStore((s) => s.items);
  const thinking = useAssistantStore((s) => s.thinking);
  const context = useEditorStore((s) => s.context);
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [items, thinking]);

  return (
    <>
      <div ref={list} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 text-sm">
        {context?.mode === 'hints' && (
          <p className="m-0 rounded-md bg-default px-2 py-1.5 text-xs text-muted">
            In lessons the assistant explains and gives hints, but doesn’t change your code: the tasks are yours to do.
          </p>
        )}
        {items.length === 0 && <Suggestions />}
        {items.map((item) => (
          <Item key={item.id} item={item} />
        ))}
        {thinking && <p className="m-0 animate-pulse text-xs text-muted">Thinking…</p>}
      </div>
      <UndoBar />
      <Composer />
    </>
  );
}

function Item({ item }: { item: ChatItem }) {
  switch (item.kind) {
    case 'user':
      return (
        <div className="ml-6 rounded-lg bg-default px-3 py-2">
          <div className="whitespace-pre-wrap">{item.text}</div>
          {item.chips.length > 0 && <div className="mt-1 text-[11px] text-muted">with {item.chips.join(' · ')}</div>}
        </div>
      );
    case 'assistant':
      return (
        <div className="min-w-0 break-words">
          <ReactMarkdown components={markdown}>{item.text}</ReactMarkdown>
        </div>
      );
    case 'edit':
      return (
        <div className={cn('text-xs', item.ok ? 'text-success' : 'text-muted')}>
          {item.ok ? '✎ Changed the code: ' : ''}
          {item.text}
        </div>
      );
    case 'notice':
      return <div className={cn('rounded-md px-2 py-1.5 text-xs', item.error ? 'bg-danger/10 text-danger' : 'bg-default text-muted')}>{item.text}</div>;
  }
}

function Suggestions() {
  const context = useEditorStore((s) => s.context);
  const send = useAssistantStore((s) => s.send);
  const ideas = !context
    ? ['What is mini-notation?', 'How do I make a four-on-the-floor kick?', 'What makes a sound “acid”?']
    : context.mode === 'edit'
      ? ['Explain what this code does', 'Add an open hi-hat on the offbeat', 'Why can’t I hear anything?']
      : ['Explain the code so far', 'Give me a hint for the next task', 'Why can’t I hear anything?'];
  return (
    <div className="flex flex-col items-start gap-1.5">
      <p className="m-0 text-xs text-muted">
        Ask about Strudel or your code.{context ? ' Select some code to ask about just that part.' : ''}
      </p>
      {ideas.map((idea) => (
        <Button key={idea} size="sm" variant="secondary" onPress={() => void send(idea)}>
          {idea}
        </Button>
      ))}
    </div>
  );
}

function UndoBar() {
  const undo = useEditorStore((s) => s.agentUndo);
  const onUndo = useAssistantStore((s) => s.undo);
  if (!undo.length) return null;
  return (
    <div className="flex items-center gap-2 border-t border-border px-3 py-1.5 text-xs">
      <Button size="sm" variant="secondary" onPress={onUndo}>
        ↶ Undo AI change
      </Button>
      <span className="min-w-0 truncate text-muted">
        {undo.at(-1)}
        {undo.length > 1 && ` (+${undo.length - 1} more)`}
      </span>
    </div>
  );
}

function Composer() {
  const draft = useAssistantStore((s) => s.draft);
  const busy = useAssistantStore((s) => s.busy);
  const useSelection = useAssistantStore((s) => s.useSelection);
  const { setDraft, send, stop, setUseSelection } = useAssistantStore.getState();
  const context = useEditorStore((s) => s.context);
  const selectionLines = useEditorStore((s) => {
    if (!s.selection) return null;
    const from = s.code.slice(0, s.selection.from).split('\n').length;
    const to = s.code.slice(0, s.selection.to).split('\n').length;
    return from === to ? `line ${from}` : `lines ${from}–${to}`;
  });
  const hasError = useEditorStore((s) => !!(s.problems.error || s.problems.runtimeError));
  const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => input.current?.focus(), []);

  return (
    <form
      className="flex flex-col gap-1.5 border-t border-border p-3"
      onSubmit={(e) => {
        e.preventDefault();
        void send(draft);
      }}
    >
      {context && (
        <div className="flex flex-wrap gap-1 text-[11px] text-muted">
          <span className="rounded bg-default px-1.5 py-0.5">{context.mode === 'edit' ? 'Code' : 'Code (read only)'}</span>
          {selectionLines && useSelection && (
            <span className="flex items-center gap-1 rounded bg-default px-1.5 py-0.5">
              Selection: {selectionLines}
              <button type="button" className="hover:text-foreground" aria-label="Don’t send the selection" onClick={() => setUseSelection(false)}>
                ✕
              </button>
            </span>
          )}
          {hasError && <span className="rounded bg-danger/10 px-1.5 py-0.5 text-danger">Error</span>}
        </div>
      )}
      <TextArea
        ref={input}
        aria-label="Message the assistant"
        placeholder={context?.mode === 'edit' ? 'Ask, or tell it what to change…' : 'Ask a question…'}
        value={draft}
        rows={3}
        className="resize-none text-sm"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            void send(draft);
          }
        }}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted">Enter to send · Shift+Enter for a new line</span>
        {busy ? (
          <Button size="sm" variant="secondary" onPress={stop}>
            ■ Stop
          </Button>
        ) : (
          <Button size="sm" type="submit" isDisabled={!draft.trim()}>
            Send
          </Button>
        )}
      </div>
    </form>
  );
}
