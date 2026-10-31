'use client';

import { Button } from '@heroui/react';
import type { FriendlyError } from '@/lib/errors/friendly';

const errorBox = 'min-w-0 rounded-lg border border-danger bg-danger/10 p-3';
const errorDetail = 'mt-1 font-mono text-xs whitespace-pre-wrap text-muted';

interface Props {
  error: FriendlyError | null;
  runtimeError: FriendlyError | null;
  playing: boolean;
  onDismissRuntime(): void;
}

/** Shows the last evaluation error and the last runtime problem (e.g. a missing sound). */
export function ErrorPanel({ error, runtimeError, playing, onDismissRuntime }: Props) {
  if (!error && !runtimeError) return null;
  return (
    <div className="flex flex-col gap-2" role="alert">
      {error && (
        <div className={errorBox}>
          <b>{error.line ? `Line ${error.line}: ` : ''}
            {error.title}</b>
          {error.detail && error.detail !== error.title && <div className={errorDetail}>{error.detail}</div>}
          {playing && <div className="mt-0.5 text-xs text-muted">The music keeps playing the last code that worked.</div>}
        </div>
      )}
      {runtimeError && (
        <div className={errorBox}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <b>
              {runtimeError.title}
              {runtimeError.suggestion && (
                <>
                  {' '}
                  Did you mean <code>{runtimeError.suggestion}</code>?
                </>
              )}
            </b>
            <Button size="sm" variant="secondary" onPress={onDismissRuntime}>
              Dismiss
            </Button>
          </div>
          {runtimeError.detail && <div className={errorDetail}>{runtimeError.detail}</div>}
        </div>
      )}
    </div>
  );
}
