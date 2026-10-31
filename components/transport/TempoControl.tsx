'use client';

import { Chip, Input } from '@heroui/react';
import { useDraft } from '@/lib/hooks/useDraft';
import { runGuiEdit, useModelStore } from '@/lib/stores/model';
import { setTempo } from '@/lib/sync/generate';

/** BPM field that writes `setcpm(BPM/4)` into the code. */
export function TempoControl() {
  const tempo = useModelStore((s) => s.model.tempo);
  const bpm = tempo?.bpm;
  const [draft, setDraft] = useDraft(bpm ? String(bpm) : '');
  if (tempo && tempo.status !== 'gui') {
    return (
      <Chip size="sm" className="bg-custom/15 text-custom" title="The tempo line is custom code">
        tempo: custom
      </Chip>
    );
  }
  const commit = () => {
    const n = Number(draft);
    if (n >= 40 && n <= 220 && n !== bpm) runGuiEdit((m) => setTempo(m, n));
    else setDraft(bpm ? String(bpm) : '');
  };
  return (
    <label className="flex items-center gap-1.5">
      <Input
        type="number"
        min={40}
        max={220}
        value={draft}
        placeholder="120"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        aria-label="Tempo in BPM"
        className="min-h-8 w-16 px-2 py-1"
      />
      BPM
    </label>
  );
}
