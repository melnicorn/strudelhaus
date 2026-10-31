import { Card, cn } from '@heroui/react';
import type { ReactNode } from 'react';

interface Props {
  /** Small uppercase heading. */
  title?: ReactNode;
  /** Buttons or chips shown at the right of the heading row. */
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  id?: string;
  'aria-label'?: string;
}

/** The workshop's boxed section: a flat HeroUI Card with an optional heading row. */
export function Panel({ title, actions, children, className, ...rest }: Props) {
  return (
    <Card className={cn('min-w-0 gap-2 rounded-lg border border-border p-3 shadow-none', className)} {...rest}>
      {(title || actions) && (
        <div className="flex min-h-6 items-center gap-2">
          {title && <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">{title}</h3>}
          {actions && <div className="ml-auto flex items-center gap-1.5">{actions}</div>}
        </div>
      )}
      {children}
    </Card>
  );
}
