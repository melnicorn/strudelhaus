'use client';

import { Button, Drawer } from '@heroui/react';
import { useState } from 'react';
import { DEFAULT_MACHINE, drumLabel, findMachine, MACHINES, type Machine } from '@/lib/sounds/catalog';
import { withTerms } from '@/components/lesson/Prose';
import { Hint } from '@/components/ui/Hint';
import { SimpleSelect } from '@/components/ui/SimpleSelect';
import { drumCode, machineDemo, MachineSounds, useAudition } from './parts';

interface Props {
  /** The part's current .bank("…") text, or '' for none. */
  bank: string;
  /** The part's step-grid rows ("bd", "sd:2", …). */
  rows: string[];
  /** The row the drawer was opened from, if any. */
  row?: string;
  /** Lessons that haven't introduced .bank() yet can't switch machines. */
  canChangeBank: boolean;
  /** False when the grid is view-only, so rows can't be swapped. */
  canUseSounds: boolean;
  onUseBank(bank: string): void;
  /** Swap `from` for `to` (e.g. "bd" → "bd:2"), or add `to` as a new row when `from` is null. */
  onUseSound(from: string | null, to: string): void;
  onClose(): void;
}

/** Side drawer for trying sounds and swapping them into the drum part it was opened from. */
export function SoundDrawer({ bank, rows, row, canChangeBank, canUseSounds, onUseBank, onUseSound, onClose }: Props) {
  const [machine, setMachine] = useState<Machine>(() => findMachine(bank) ?? DEFAULT_MACHINE);
  const [picked, setPicked] = useState<{ sound: string; n: number } | null>(null);
  const { play, error } = useAudition();

  const current = findMachine(bank);
  const sameMachine = current?.bank === machine.bank;
  const pickedName = picked ? (picked.n ? `${picked.sound}:${picked.n}` : picked.sound) : null;
  // The row this sound would replace: the one the drawer was opened from if it's the same instrument,
  // otherwise the first row playing that instrument.
  const base = (r: string) => r.split(':')[0];
  const target = picked ? (row && base(row) === picked.sound ? row : rows.find((r) => base(r) === picked.sound)) : undefined;

  const option = (m: Machine) => ({ value: m.bank, label: m.name });
  const actionClass = 'h-auto min-h-8 w-full py-1 whitespace-normal';

  // The parent renders the drawer only while it's open; Escape, the ✕ and clicks outside all call onClose.
  return (
    <Drawer.Backdrop isOpen variant="transparent" onOpenChange={(open) => !open && onClose()}>
      <Drawer.Content placement="right">
        <Drawer.Dialog aria-label="Sounds" className="w-[min(380px,100vw)] max-w-[100vw] gap-2 border-l border-border p-3.5 sm:w-[380px]">
          <Drawer.CloseTrigger aria-label="Close sounds" className="end-3 top-3" />
          <Drawer.Header className="gap-2">
            <Drawer.Heading className="m-0 text-[15px] font-semibold">Sounds</Drawer.Heading>
            <div className="flex items-center gap-2">
              <SimpleSelect
                aria-label="Drum machine"
                className="min-w-0 flex-1"
                triggerClassName="w-full"
                value={machine.bank}
                onChange={(v) => {
                  setMachine(findMachine(v) ?? DEFAULT_MACHINE);
                  setPicked(null);
                }}
                options={[
                  {
                    label: '90s house & techno',
                    options: [...MACHINES.filter((m) => m.classic).map(option), { value: '', label: 'Default kit (no bank)' }],
                  },
                  { label: 'More machines', options: MACHINES.filter((m) => !m.classic).map(option) },
                ]}
              />
              <Button size="sm" variant="secondary" onPress={() => void play(machineDemo(machine), 2)}>
                ▶ Beat
              </Button>
            </div>
            {machine.blurb && <Hint>{withTerms(machine.blurb)}</Hint>}
          </Drawer.Header>

          <Drawer.Body className="text-foreground">
            <MachineSounds
              compact
              machine={machine}
              selected={picked}
              onPick={(sound, n) => {
                setPicked({ sound, n });
                void play(drumCode(machine.bank, sound, n));
              }}
            />
          </Drawer.Body>

          <Drawer.Footer className="flex-col items-stretch gap-1.5 border-t border-separator pt-2 empty:hidden">
            {!sameMachine && canChangeBank && (
              <Button size="sm" variant="primary" className={actionClass} onPress={() => onUseBank(machine.bank)}>
                Use {machine.bank ? machine.name : 'the default kit'} for this part
              </Button>
            )}
            {pickedName && sameMachine && canUseSounds && (
              target ? (
                target !== pickedName && (
                  <Button size="sm" variant="primary" className={actionClass} onPress={() => onUseSound(target, pickedName)}>
                    Use {pickedName} in the {target} row
                  </Button>
                )
              ) : (
                <Button size="sm" variant="primary" className={actionClass} onPress={() => onUseSound(null, pickedName)}>
                  Add a {drumLabel(picked!.sound).replace(/^\S+ - /, '')} row ({pickedName})
                </Button>
              )
            )}
            {pickedName && !sameMachine && <Hint>Switch this part to {machine.name} first to use its {pickedName}.</Hint>}
            {error && <Hint tone="danger">{error}</Hint>}
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
