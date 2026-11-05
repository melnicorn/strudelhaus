// Past chats, kept in this browser. Budget: the app shares one localStorage origin (about 5 MB
// in every browser) with the library, projects and imported packs, so chats get a small, fixed
// slice of it. Only the transcript is kept (what the panel shows), not the API messages: those
// repeat the code and the context every turn and would be many times the size. Resuming a chat
// rebuilds the model's view from the transcript (see messagesFromItems).
import { z } from 'zod';
import { KEYS, readJson, writeJson } from '@/lib/storage/kv';

const itemSchema = z.discriminatedUnion('kind', [
  z.object({ id: z.number(), kind: z.literal('user'), text: z.string(), chips: z.array(z.string()) }),
  z.object({ id: z.number(), kind: z.literal('assistant'), text: z.string() }),
  z.object({ id: z.number(), kind: z.literal('edit'), text: z.string(), ok: z.boolean() }),
  z.object({ id: z.number(), kind: z.literal('notice'), text: z.string(), error: z.boolean().optional() }),
]);

export const chatRecordSchema = z.object({
  id: z.string(),
  title: z.string(),
  /** Where the chat happened (pathname), to show in the list. */
  page: z.string(),
  startedAt: z.number(),
  updatedAt: z.number(),
  items: z.array(itemSchema),
});
export type ChatRecord = z.infer<typeof chatRecordSchema>;
export type StoredItem = z.infer<typeof itemSchema>;

const listSchema = z.array(chatRecordSchema).catch([]);

/** How many chats to keep, newest first. */
export const MAX_CHATS = 20;
/** The most the whole history may take, in UTF-16 units (what localStorage counts); about 1 MB. */
export const MAX_CHARS = 500_000;
/** A single chat keeps at most this many transcript items (the oldest are dropped). */
export const MAX_ITEMS = 200;

export function loadHistory(): ChatRecord[] {
  return readJson(KEYS.chats, listSchema, []);
}

export function saveHistory(chats: ChatRecord[]): boolean {
  return writeJson(KEYS.chats, chats);
}

/** Newest first; at most MAX_CHATS, MAX_ITEMS each, and MAX_CHARS in all (oldest chats go first). */
export function prune(chats: ChatRecord[]): ChatRecord[] {
  const kept = [...chats]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_CHATS)
    .map((c) => (c.items.length > MAX_ITEMS ? { ...c, items: c.items.slice(-MAX_ITEMS) } : c));
  while (kept.length > 1 && JSON.stringify(kept).length > MAX_CHARS) kept.pop();
  return kept;
}

/** Puts `chat` in (replacing one with the same id), or removes it when its transcript is empty. */
export function upsert(chats: ChatRecord[], chat: ChatRecord): ChatRecord[] {
  const rest = chats.filter((c) => c.id !== chat.id);
  return prune(chat.items.some((it) => it.kind === 'user') ? [chat, ...rest] : rest);
}

/** The first thing the learner asked, trimmed to a line. */
export function titleFor(items: StoredItem[]): string {
  const first = items.find((it) => it.kind === 'user')?.text.trim().replace(/\s+/g, ' ') ?? '';
  return first.length > 60 ? `${first.slice(0, 57)}…` : first || 'Chat';
}

export function newChatId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * The conversation to send when a chat is resumed: the learner's questions and the assistant's
 * replies, in turns. Edits and notices aren't messages; the context block the code was sent with
 * is gone too (the next turn sends the current code). Adjacent same-role items merge so the
 * roles alternate, and an unanswered last question is dropped (it will be asked again, or not).
 */
export function messagesFromItems(items: StoredItem[]): { role: 'user' | 'assistant'; content: string }[] {
  const out: { role: 'user' | 'assistant'; content: string }[] = [];
  for (const it of items) {
    if (it.kind !== 'user' && it.kind !== 'assistant') continue;
    if (!it.text.trim()) continue;
    const last = out.at(-1);
    if (last && last.role === it.kind) last.content += `\n\n${it.text}`;
    else if (out.length || it.kind === 'user') out.push({ role: it.kind, content: it.text });
  }
  if (out.at(-1)?.role === 'user') out.pop();
  return out;
}

/** "just now", "5 min ago", "yesterday", or a date. */
export function timeAgo(t: number, now = Date.now()): string {
  const s = Math.max(0, now - t) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 172800) return 'yesterday';
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} days ago`;
  return new Date(t).toLocaleDateString();
}
