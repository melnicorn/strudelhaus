'use client';

import { Button, cn, TextArea, ToggleButton } from '@heroui/react';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { isMac } from '@/lib/platform';
import ReactMarkdown, { type Components } from 'react-markdown';
import { useEditorStore } from '@/lib/stores/editor';
import { useAssistantStore, type ChatItem } from '@/lib/stores/assistant';
import { AssistantSettings } from './AssistantSettings';

const noSubscribe = () => () => {};
/** Mac keyboards say ⌘ where others say Ctrl (false during server render). */
const useIsMacKeyboard = () => useSyncExternalStore(noSubscribe, isMac, () => false);

const HIDE_DELAY_MS = 350;
let hideTimer: ReturnType<typeof setTimeout> | undefined;

/** Pointer enters the header button or the floating panel: show it; leaves both: hide it shortly after. */
const hoverIn = () => {
  clearTimeout(hideTimer);
  useAssistantStore.getState().setPeek(true);
};
const hoverOut = () => {
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => useAssistantStore.getState().setPeek(false), HIDE_DELAY_MS);
};

/**
 * Header button for the assistant. Pressed, the panel is docked open beside the page; released, it is
 * closed but floats over the page while the button (or the panel itself) is hovered.
 */
export function AssistantToggle() {
  const docked = useAssistantStore((s) => s.config.mode === 'docked');
  const setMode = useAssistantStore((s) => s.setMode);
  const mac = useIsMacKeyboard();
  useEffect(() => useAssistantStore.getState().load(), []);
  // ⌘/ (Ctrl+/) from anywhere on the page; the code editor binds the same key in its own keymap.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || !(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
      if ((e.target as HTMLElement | null)?.closest?.('.cm-editor')) return;
      e.preventDefault();
      clearTimeout(hideTimer);
      useAssistantStore.getState().openChat();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const key = mac ? '⌘/' : 'Ctrl+/';
  return (
    <ToggleButton
      size="sm"
      className="ml-auto h-6 px-2 text-xs md:h-6"
      isSelected={docked}
      onChange={(on) => {
        clearTimeout(hideTimer);
        useAssistantStore.getState().setPeek(false);
        setMode(on ? 'docked' : 'closed');
      }}
      onHoverStart={() => {
        if (!docked) hoverIn();
      }}
      onHoverEnd={() => {
        if (!docked) hoverOut();
      }}
      aria-label={docked ? `Assistant: docked. Press to close it (it then shows while hovered). ${key} opens the chat.` : `Assistant: closed. Press to keep it open. ${key} opens the chat.`}
    >
      ✦ Assistant <kbd className="ml-1 font-sans text-[10px] text-muted">{key}</kbd>
    </ToggleButton>
  );
}

/** The assistant chat: docked to the right of the page, or floating over it while hovered. */
export function AssistantDock() {
  const docked = useAssistantStore((s) => s.config.mode === 'docked');
  const loaded = useAssistantStore((s) => s.loaded);
  if (!loaded) return null;
  if (!docked) return <Overlay />;
  return (
    <aside className="flex w-[400px] shrink-0 flex-col border-l border-border bg-surface" aria-label="Assistant">
      <Panel />
    </aside>
  );
}

/**
 * Not docked: the panel floats over the page's right edge while the header button or the panel is
 * hovered, or while keyboard focus is inside it; Escape hides it.
 */
function Overlay() {
  const peek = useAssistantStore((s) => s.peek);
  const setPeek = useAssistantStore((s) => s.setPeek);
  const [focused, setFocused] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => () => clearTimeout(hideTimer), []);
  if (!peek && !focused) return null;

  return (
    <div
      ref={box}
      className="absolute inset-y-0 right-0 z-30 flex"
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!box.current?.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      onKeyDown={(e) => {
        if (e.key !== 'Escape') return;
        (document.activeElement as HTMLElement | null)?.blur();
        setFocused(false);
        clearTimeout(hideTimer);
        setPeek(false);
      }}
    >
      <aside
        className="flex h-full w-[400px] flex-col border-l border-border bg-surface shadow-2xl"
        aria-label="Assistant"
        onMouseEnter={hoverIn}
        onMouseLeave={hoverOut}
      >
        <Panel autoFocus={false} />
      </aside>
    </div>
  );
}

/** The panel's title bar and either the chat or the settings. */
function Panel({ autoFocus = true }: { autoFocus?: boolean }) {
  const docked = useAssistantStore((s) => s.config.mode === 'docked');
  const hasKey = useAssistantStore((s) => !!s.config.apiKey);
  const settings = useAssistantStore((s) => s.showSettings);
  const { setMode, setShowSettings, setPeek, clear } = useAssistantStore.getState();
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
          onPress={() => {
            clearTimeout(hideTimer);
            setPeek(false);
            setMode(docked ? 'closed' : 'docked');
          }}
          aria-label={docked ? 'Close: show only while hovered' : 'Keep open beside the page'}
        >
          {docked ? 'Close' : 'Keep open'}
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
  const focusRequest = useAssistantStore((s) => s.focusRequest);
  const input = useRef<HTMLTextAreaElement>(null);
  // Not when the overlay opens on hover: focus would keep it open after the pointer leaves.
  useEffect(() => {
    if (autoFocus) input.current?.focus();
  }, [autoFocus]);
  // ⌘/ (Ctrl+/): the chat was opened to type in; focus the prompt (also when already open).
  useEffect(() => {
    if (focusRequest) input.current?.focus();
  }, [focusRequest]);

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
