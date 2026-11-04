'use client';

import { Button, cn, TextArea, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import { useEditorStore } from '@/lib/stores/editor';
import { useAssistantStore, type ChatItem } from '@/lib/stores/assistant';
import { AssistantSettings } from './AssistantSettings';

type Mode = 'closed' | 'overlay' | 'docked';

/** Header switch for the assistant: off, over the page while hovered, or docked beside it. */
export function AssistantToggle() {
  const mode = useAssistantStore((s) => s.config.mode);
  const setMode = useAssistantStore((s) => s.setMode);
  useEffect(() => useAssistantStore.getState().load(), []);
  return (
    <div className="ml-auto flex items-center gap-2">
      <span className="text-xs text-muted">✦ Assistant</span>
      <ToggleButtonGroup
        size="sm"
        selectionMode="single"
        disallowEmptySelection
        aria-label="Assistant panel"
        selectedKeys={new Set([mode])}
        onSelectionChange={(keys) => {
          const next = [...keys][0] as Mode | undefined;
          if (next) setMode(next);
        }}
      >
        <ToggleButton id="closed" className="h-6 px-2 text-xs md:h-6" aria-label="Assistant off">
          Off
        </ToggleButton>
        <ToggleButton id="overlay" className="h-6 px-2 text-xs md:h-6" aria-label="Assistant shows when you hover the right edge">
          <ToggleButtonGroup.Separator />
          Hover
        </ToggleButton>
        <ToggleButton id="docked" className="h-6 px-2 text-xs md:h-6" aria-label="Assistant docked beside the page">
          <ToggleButtonGroup.Separator />
          Docked
        </ToggleButton>
      </ToggleButtonGroup>
    </div>
  );
}

/** The assistant chat: docked to the right of the page, or floating over it while hovered. */
export function AssistantDock() {
  const mode = useAssistantStore((s) => s.config.mode);
  const loaded = useAssistantStore((s) => s.loaded);
  if (!loaded || mode === 'closed') return null;
  if (mode === 'overlay') return <Overlay />;
  return (
    <aside className="flex w-[400px] shrink-0 flex-col border-l border-border bg-surface" aria-label="Assistant">
      <Panel />
    </aside>
  );
}

const HIDE_DELAY_MS = 350;

/**
 * Hover mode: a tab on the right edge; hovering it slides the panel over the page. It stays while
 * the pointer or keyboard focus is inside, and hides shortly after both leave (or on Escape).
 */
function Overlay() {
  const peek = useAssistantStore((s) => s.peek);
  const setPeek = useAssistantStore((s) => s.setPeek);
  const [hover, setHover] = useState(false);
  const [focused, setFocused] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const shown = hover || focused || peek;

  const enter = () => {
    clearTimeout(timer.current);
    setHover(true);
  };
  const leave = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setHover(false);
      setPeek(false);
    }, HIDE_DELAY_MS);
  };

  return (
    <div
      ref={box}
      className="pointer-events-none absolute inset-y-0 right-0 z-30 flex items-center"
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!box.current?.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      onKeyDown={(e) => {
        if (e.key !== 'Escape') return;
        (document.activeElement as HTMLElement | null)?.blur();
        setFocused(false);
        setHover(false);
        setPeek(false);
      }}
    >
      {shown ? (
        <aside
          className="pointer-events-auto flex h-full w-[400px] flex-col border-l border-border bg-surface shadow-2xl"
          aria-label="Assistant"
          onMouseEnter={enter}
          onMouseLeave={leave}
        >
          <Panel autoFocus={peek} />
        </aside>
      ) : (
        <button
          type="button"
          className="pointer-events-auto h-auto self-center rounded-l-md border border-r-0 border-border bg-surface px-1 py-3 text-xs text-muted shadow-md [writing-mode:vertical-rl] hover:text-foreground"
          onMouseEnter={enter}
          onMouseLeave={leave}
          onClick={() => setPeek(true)}
        >
          ✦ Assistant
        </button>
      )}
    </div>
  );
}

/** The panel's title bar and either the chat or the settings. */
function Panel({ autoFocus = true }: { autoFocus?: boolean }) {
  const mode = useAssistantStore((s) => s.config.mode);
  const hasKey = useAssistantStore((s) => !!s.config.apiKey);
  const settings = useAssistantStore((s) => s.showSettings);
  const { setMode, setShowSettings, clear } = useAssistantStore.getState();
  return (
    <>
      <div className="flex items-center gap-1 border-b border-border px-3 py-1.5">
        <strong className="mr-auto text-sm">{settings ? 'Assistant settings' : 'Assistant'}</strong>
        {!settings && (
          <Button size="sm" variant="ghost" onPress={clear} aria-label="New chat">
            New chat
          </Button>
        )}
        {hasKey && (
          <Button size="sm" variant="ghost" onPress={() => setShowSettings(!settings)} aria-label={settings ? 'Back to chat' : 'Settings'}>
            {settings ? '◀ Chat' : '⚙'}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onPress={() => setMode(mode === 'docked' ? 'overlay' : 'docked')}
          aria-label={mode === 'docked' ? 'Unpin: show only on hover' : 'Pin: dock beside the page'}
        >
          {mode === 'docked' ? 'Unpin' : 'Pin'}
        </Button>
        <Button size="sm" variant="ghost" isIconOnly onPress={() => setMode('closed')} aria-label="Turn the assistant off">
          ✕
        </Button>
      </div>
      {settings ? <AssistantSettings /> : <Chat autoFocus={autoFocus} />}
    </>
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

function Chat({ autoFocus }: { autoFocus: boolean }) {
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
      <Composer autoFocus={autoFocus} />
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

function Composer({ autoFocus }: { autoFocus: boolean }) {
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
  // Not when the overlay opens on hover: focus would keep it open after the pointer leaves.
  useEffect(() => {
    if (autoFocus) input.current?.focus();
  }, [autoFocus]);

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
