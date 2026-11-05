import { describe, expect, it } from 'vitest';
import { MAX_CHARS, MAX_CHATS, MAX_ITEMS, messagesFromItems, prune, titleFor, upsert, type ChatRecord, type StoredItem } from '@/lib/assistant/history';

const chat = (id: string, updatedAt: number, items: StoredItem[] = [{ id: 1, kind: 'user', text: `q ${id}`, chips: [] }]): ChatRecord => ({
  id,
  title: titleFor(items),
  page: '/sandbox',
  startedAt: updatedAt,
  updatedAt,
  items,
});

describe('chat history', () => {
  it('keeps the newest MAX_CHATS, newest first', () => {
    const many = Array.from({ length: MAX_CHATS + 5 }, (_, i) => chat(`c${i}`, i));
    const kept = prune(many);
    expect(kept).toHaveLength(MAX_CHATS);
    expect(kept[0].id).toBe(`c${MAX_CHATS + 4}`);
    expect(kept.at(-1)!.id).toBe('c5');
  });

  it('trims long transcripts and drops the oldest chats past the size budget', () => {
    const long = chat('long', 10, Array.from({ length: MAX_ITEMS + 50 }, (_, i) => ({ id: i, kind: 'assistant' as const, text: 'x' })));
    expect(prune([long])[0].items).toHaveLength(MAX_ITEMS);
    const big = (id: string, t: number) => chat(id, t, [{ id: 1, kind: 'user', text: 'y'.repeat(MAX_CHARS / 3), chips: [] }]);
    const kept = prune([big('a', 1), big('b', 2), big('c', 3), big('d', 4)]);
    expect(kept.map((c) => c.id)).toEqual(['d', 'c']);
    // The newest chat always survives, even over budget on its own.
    expect(prune([big('solo', 1), { ...big('huge', 2), items: [{ id: 1, kind: 'user', text: 'z'.repeat(MAX_CHARS * 2), chips: [] }] }])).toHaveLength(1);
  });

  it('upsert replaces by id and removes chats with no question', () => {
    const a = chat('a', 1);
    const list = upsert([a], { ...a, updatedAt: 5, title: 'new' });
    expect(list).toEqual([{ ...a, updatedAt: 5, title: 'new' }]);
    expect(upsert(list, { ...a, items: [{ id: 1, kind: 'notice', text: 'nothing asked' }] })).toEqual([]);
  });

  it('titles a chat by its first question, shortened', () => {
    expect(titleFor([{ id: 1, kind: 'user', text: '  Why   is it\nquiet? ', chips: [] }])).toBe('Why is it quiet?');
    expect(titleFor([{ id: 1, kind: 'user', text: 'w'.repeat(80), chips: [] }])).toBe(`${'w'.repeat(57)}…`);
    expect(titleFor([])).toBe('Chat');
  });

  it('rebuilds alternating messages from a transcript', () => {
    const items: StoredItem[] = [
      { id: 1, kind: 'notice', text: 'ignored' },
      { id: 2, kind: 'assistant', text: 'ignored: before any question' },
      { id: 3, kind: 'user', text: 'Add hats', chips: ['Code'] },
      { id: 4, kind: 'edit', text: 'Added hats', ok: true },
      { id: 5, kind: 'assistant', text: 'Done.' },
      { id: 6, kind: 'assistant', text: 'They play on the offbeat.' },
      { id: 7, kind: 'user', text: 'Louder?', chips: [] },
      { id: 8, kind: 'user', text: 'And faster', chips: [] },
      { id: 9, kind: 'assistant', text: 'Sure.' },
      { id: 10, kind: 'user', text: 'Unanswered', chips: [] },
    ];
    expect(messagesFromItems(items)).toEqual([
      { role: 'user', content: 'Add hats' },
      { role: 'assistant', content: 'Done.\n\nThey play on the offbeat.' },
      { role: 'user', content: 'Louder?\n\nAnd faster' },
      { role: 'assistant', content: 'Sure.' },
    ]);
  });
});
