import { cn } from '@heroui/react';
import type { ReactNode } from 'react';

/** Small muted helper text under or beside a control. */
export function Hint({ children, className, tone }: { children: ReactNode; className?: string; tone?: 'danger' }) {
  return <p className={cn('m-0 text-xs leading-snug', tone === 'danger' ? 'text-danger' : 'text-muted', className)}>{children}</p>;
}
