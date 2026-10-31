'use client';

import { useEffect, useState } from 'react';
import { evaluatePure, onsets } from '@/lib/strudel/pure';
import { stepsFromHaps, type Steps } from '@/lib/sync/miniGrid';
import { FINAL_PART, type ProjectModel } from '@/lib/sync/model';

/** Code that evaluates to just one block, with every other definition still in scope. */
export function soloCode(model: ProjectModel, name: string): string {
  if (name === FINAL_PART) return model.code;
  const end = model.final ? model.final.range.from : model.code.length;
  return `${model.code.slice(0, end)}\n${name}`;
}

/**
 * What a block actually plays in its first bar, as grid steps (null if it doesn't fit a
 * 16-step grid). `tokenOf` picks the label for a hap (its sound, its note…).
 */
export function useQueriedSteps(
  model: ProjectModel,
  name: string,
  enabled: boolean,
  tokenOf: (value: Record<string, unknown>) => string = (v) => String(v.s ?? v.note ?? v.n ?? '?'),
): { steps: Steps | null; loading: boolean } {
  const code = enabled ? soloCode(model, name) : '';
  const [result, setResult] = useState<{ code: string; steps: Steps | null }>({ code: '', steps: null });
  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    evaluatePure(code).then((r) => {
      if (cancelled) return;
      const steps = r.ok
        ? stepsFromHaps(onsets(r.pattern, 0, 1).map((h) => ({ begin: h.whole!.begin.valueOf(), end: h.whole!.end.valueOf(), token: tokenOf(h.value) })))
        : null;
      setResult({ code, steps });
    });
    return () => {
      cancelled = true;
    };
    // tokenOf is expected to be stable in behaviour; re-run only when the code changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);
  return { steps: result.code === code ? result.steps : null, loading: !!code && result.code !== code };
}
