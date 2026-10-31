'use client';

import { Button, Tooltip, type ButtonProps } from '@heroui/react';
import type { ReactNode } from 'react';

/**
 * A HeroUI button with hover help. React Aria buttons drop `title`, and a disabled button gets
 * no hover events, so a disabled one sits in a Tooltip.Trigger wrapper that still shows the tip
 * (use it to say why the button is off).
 */
export function TipButton({ tip, ...props }: ButtonProps & { tip?: ReactNode }) {
  const button = <Button {...props} />;
  if (!tip) return button;
  return (
    <Tooltip delay={500}>
      {props.isDisabled ? <Tooltip.Trigger className="inline-flex">{button}</Tooltip.Trigger> : button}
      <Tooltip.Content className="max-w-64 text-xs">{tip}</Tooltip.Content>
    </Tooltip>
  );
}
