'use client';

import { cn, Header, ListBox, Select, Separator, type Key } from '@heroui/react';
import { Fragment, type ReactNode } from 'react';

export interface SelectOption {
  value: string;
  label: ReactNode;
  /** Plain text for type-ahead and screen readers when `label` isn't a string. */
  textValue?: string;
}
export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

interface Props {
  value: string;
  onChange(value: string): void;
  options: (SelectOption | SelectGroup)[];
  'aria-label': string;
  /** Rendered in the trigger instead of the selected option's label (e.g. a short code). */
  renderValue?(value: string): ReactNode;
  placeholder?: string;
  isDisabled?: boolean;
  className?: string;
  triggerClassName?: string;
}

// React Aria keys can't be empty strings; '' (e.g. "no bank") travels as this instead.
const EMPTY = '\u0000empty';
const toKey = (v: string) => (v === '' ? EMPTY : v);
const fromKey = (k: Key | null) => (k === EMPTY || k == null ? '' : String(k));

const isGroup = (o: SelectOption | SelectGroup): o is SelectGroup => 'options' in o;

/** A HeroUI Select for a plain list of string values: the common case in the workshop. */
export function SimpleSelect({ value, onChange, options, renderValue, placeholder, isDisabled, className, triggerClassName, ...rest }: Props) {
  const item = (o: SelectOption) => (
    <ListBox.Item key={o.value} id={toKey(o.value)} textValue={o.textValue ?? (typeof o.label === 'string' ? o.label : o.value)}>
      {o.label}
      <ListBox.ItemIndicator />
    </ListBox.Item>
  );
  return (
    <Select
      aria-label={rest['aria-label']}
      className={cn('w-auto', className)}
      value={toKey(value)}
      onChange={(k) => onChange(fromKey(k as Key | null))}
      placeholder={placeholder}
      isDisabled={isDisabled}
    >
      <Select.Trigger className={cn('min-h-8 py-1 text-sm', triggerClassName)}>
        {renderValue ? <span className="truncate">{renderValue(value)}</span> : <Select.Value />}
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover className="min-w-48">
        <ListBox>
          {options.map((o, i) =>
            isGroup(o) ? (
              <Fragment key={o.label}>
                {i > 0 && <Separator />}
                <ListBox.Section>
                  <Header>{o.label}</Header>
                  {o.options.map(item)}
                </ListBox.Section>
              </Fragment>
            ) : (
              item(o)
            ),
          )}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
