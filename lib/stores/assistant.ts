// The assistant chat: settings, the conversation, and the request loop. The browser calls the
// Claude API directly with the learner's own key (there is no server). The conversation sent to
// the API only ever grows (each request repeats it, so prompt caching keeps that cheap); the
// list shown in the panel is kept alongside it.
import Anthropic from '@anthropic-ai/sdk';
import { create } from 'zustand';
import { agentStack, applyAgentChange, undoAgentChange } from '@/lib/assistant/agentEdits';
import { assistantConfigSchema, loadAssistantConfig, saveAssistantConfig, type AssistantConfig } from '@/lib/assistant/config';
import { buildSystemPrompt } from '@/lib/assistant/prompt';
import { buildContext, EDIT_TOOLS, planToolCall } from '@/lib/assistant/tools';
import { useEditorStore } from './editor';
import { afterAssistantEdit } from './model';

type Message = Anthropic.Beta.BetaMessageParam;

export type ChatItem =
  | { id: number; kind: 'user'; text: string; chips: string[] }
  | { id: number; kind: 'assistant'; text: string }
  | { id: number; kind: 'edit'; text: string; ok: boolean }
  | { id: number; kind: 'notice'; text: string; error?: boolean };

type NewItem = ChatItem extends infer T ? (T extends ChatItem ? Omit<T, 'id'> : never) : never;

interface AssistantStore {
  config: AssistantConfig;
  loaded: boolean;
  load(): void;
  setConfig(patch: Partial<AssistantConfig>): void;
  setMode(mode: AssistantConfig['mode']): void;
  /** Overlay mode: show the panel without hovering (e.g. "Ask the assistant"), until the pointer leaves it. */
  peek: boolean;
  setPeek(peek: boolean): void;
  /** The panel shows settings instead of the chat. */
  showSettings: boolean;
  setShowSettings(show: boolean): void;

  items: ChatItem[];
  busy: boolean;
  /** Waiting for the first words of a reply (the model thinks first). */
  thinking: boolean;
  draft: string;
  setDraft(draft: string): void;
  /** Send the selection with the next message (the chip can be removed). */
  useSelection: boolean;
  setUseSelection(use: boolean): void;
  send(text: string): Promise<void>;
  stop(): void;
  clear(): void;
  /** Undo the assistant's latest change to the code. */
  undo(): void;
  /** Open the panel with a question about the current error. */
  askAboutError(): void;
}

const MAX_STEPS = 8;
let ids = 1;
let messages: Message[] = [];
let controller: AbortController | null = null;

function contextChips(useSelection: boolean): string[] {
  const { context, selection, code, problems } = useEditorStore.getState();
  if (!context) return [];
  const chips = [context.mode === 'edit' ? 'Code' : 'Code (read only)'];
  if (useSelection && selection) {
    const from = code.slice(0, selection.from).split('\n').length;
    const to = code.slice(0, selection.to).split('\n').length;
    chips.push(from === to ? `Selection: line ${from}` : `Selection: lines ${from}–${to}`);
  }
  if (problems.error || problems.runtimeError) chips.push('Error');
  return chips;
}

function friendlyApiError(e: unknown): string {
  if (e instanceof Anthropic.AuthenticationError) return 'The API key was rejected. Check it in the assistant settings.';
  if (e instanceof Anthropic.PermissionDeniedError) return 'This API key isn’t allowed to use that model. Try another model in settings.';
  if (e instanceof Anthropic.RateLimitError) return 'Rate limited by the Claude API. Wait a moment and try again.';
  if (e instanceof Anthropic.BadRequestError) return `The Claude API refused the request: ${e.message}`;
  if (e instanceof Anthropic.APIConnectionError) return 'Couldn’t reach the Claude API. Are you offline?';
  if (e instanceof Anthropic.APIError) return `Claude API error ${e.status ?? ''}: ${e.message}`;
  return e instanceof Error ? e.message : String(e);
}

export const useAssistantStore = create<AssistantStore>((set, get) => {
  const push = (item: NewItem) => {
    const full = { ...item, id: ids++ } as ChatItem;
    set({ items: [...get().items, full] });
    return full.id;
  };
  const update = (id: number, text: string) =>
    set({ items: get().items.map((it) => (it.id === id && it.kind === 'assistant' ? { ...it, text } : it)) });

  return {
    config: loadDefaults(),
    loaded: false,
    load() {
      if (get().loaded) return;
      const config = loadAssistantConfig();
      // Without a key there is nothing to chat with yet: start on the settings.
      set({ config, loaded: true, showSettings: !config.apiKey });
    },
    setConfig(patch) {
      const config = { ...get().config, ...patch };
      set({ config });
      saveAssistantConfig(config);
    },
    setMode(mode) {
      get().setConfig({ mode });
    },
    peek: false,
    setPeek: (peek) => set({ peek }),
    showSettings: false,
    setShowSettings: (showSettings) => set({ showSettings }),

    items: [],
    busy: false,
    thinking: false,
    draft: '',
    setDraft: (draft) => set({ draft }),
    useSelection: true,
    setUseSelection: (useSelection) => set({ useSelection }),

    async send(text) {
      const question = text.trim();
      const { config, busy, useSelection } = get();
      if (!question || busy) return;
      if (!config.apiKey) {
        set({ showSettings: true });
        return;
      }
      const editor = useEditorStore.getState();
      const context = buildContext({
        editor: editor.context,
        page: typeof location !== 'undefined' ? location.pathname : '',
        code: editor.code,
        selection: editor.selection,
        error: editor.problems.error,
        runtimeError: editor.problems.runtimeError,
        useSelection,
      });
      push({ kind: 'user', text: question, chips: contextChips(useSelection) });
      set({ draft: '', busy: true, thinking: true, useSelection: true });

      const start = messages.length;
      messages = [...messages, { role: 'user', content: [{ type: 'text', text: context }, { type: 'text', text: question }] }];
      const client = new Anthropic({ apiKey: config.apiKey, dangerouslyAllowBrowser: true });
      const system = buildSystemPrompt(config.prompt);
      // Haiku has no server-side fallback; on the others a declined request is retried on another model.
      const fallback = config.model !== 'claude-haiku-5-5';
      controller = new AbortController();
      let answered = false;

      try {
        for (let step = 0; step < MAX_STEPS; step++) {
          const replyId = push({ kind: 'assistant', text: '' });
          let reply = '';
          const stream = client.beta.messages.stream(
            {
              model: config.model,
              max_tokens: 64000,
              system,
              messages,
              // Always sent, even where editing is off: the history may hold earlier tool calls, and a
              // fixed tool list keeps the cached prefix the same on every page. Lessons are guarded
              // by the context block and by the check below.
              tools: EDIT_TOOLS,
              thinking: { type: 'adaptive' },
              output_config: { effort: 'medium' },
              cache_control: { type: 'ephemeral' },
              ...(fallback && { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const }),
            },
            { signal: controller.signal },
          );
          stream.on('text', (delta) => {
            reply += delta;
            set({ thinking: false });
            update(replyId, reply);
          });
          const message = await stream.finalMessage();
          messages = [...messages, { role: 'assistant', content: message.content as Anthropic.Beta.BetaContentBlockParam[] }];
          answered = true;
          set({ thinking: false });
          if (!reply) set({ items: get().items.filter((it) => it.id !== replyId) });

          if (message.stop_reason === 'refusal') {
            push({ kind: 'notice', text: 'Claude declined to answer that.', error: true });
            break;
          }
          if (message.stop_reason === 'max_tokens') {
            push({ kind: 'notice', text: 'The reply was cut off (too long).', error: true });
            break;
          }
          const calls = message.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use');
          if (message.stop_reason !== 'tool_use' || !calls.length) break;

          const results: Anthropic.Beta.BetaToolResultBlockParam[] = calls.map((call) => {
            const { view, context } = useEditorStore.getState();
            if (!view || context?.mode !== 'edit') {
              return { type: 'tool_result', tool_use_id: call.id, is_error: true, content: 'Editing is not allowed on this page.' };
            }
            const plan = planToolCall(call.name, call.input, view.state.doc.toString());
            if (!plan.ok) {
              push({ kind: 'edit', text: 'Couldn’t apply a change (retrying)', ok: false });
              return { type: 'tool_result', tool_use_id: call.id, is_error: true, content: plan.message };
            }
            applyAgentChange(view, { from: plan.from, to: plan.to, insert: plan.insert }, plan.summary);
            afterAssistantEdit();
            push({ kind: 'edit', text: plan.summary, ok: true });
            return { type: 'tool_result', tool_use_id: call.id, content: 'Applied. The editor now holds the changed code.' };
          });
          messages = [...messages, { role: 'user', content: results }];
          set({ thinking: true });
        }
      } catch (e) {
        if (!answered) messages = messages.slice(0, start);
        if (!(e instanceof Anthropic.APIUserAbortError)) push({ kind: 'notice', text: friendlyApiError(e), error: true });
      } finally {
        controller = null;
        set({ busy: false, thinking: false, items: get().items.filter((it) => it.kind !== 'assistant' || it.text) });
      }
    },
    stop() {
      controller?.abort();
    },
    clear() {
      controller?.abort();
      messages = [];
      set({ items: [] });
    },
    undo() {
      const { view } = useEditorStore.getState();
      if (!view || !agentStack(view.state).length) return;
      const result = undoAgentChange(view);
      if (result === 'undone') afterAssistantEdit();
      if (result === 'conflict') push({ kind: 'notice', text: 'You’ve edited what that change wrote, so it can’t be undone from here. Use ⌘Z / Ctrl+Z instead.' });
      if (result === 'already') push({ kind: 'notice', text: 'That change was already undone.' });
    },
    askAboutError() {
      const { config, setMode, setShowSettings, setDraft } = get();
      if (config.mode === 'closed') setMode('overlay');
      set({ peek: true });
      setShowSettings(false);
      setDraft('Why does my code give this error, and how do I fix it?');
    },
  };
});

function loadDefaults(): AssistantConfig {
  // localStorage isn't there during server rendering; load() reads it in an effect.
  return assistantConfigSchema.parse({});
}
