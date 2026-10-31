import { describe, expect, it } from 'vitest';
import { DEFAULT_MACHINE, findMachine, MACHINES } from '@/lib/sounds/catalog';

describe('sound catalog', () => {
  it('names machines readably', () => {
    const names = Object.fromEntries(MACHINES.map((m) => [m.bank, m.name]));
    expect(names.RolandTR909).toBe('Roland TR-909');
    expect(names.YamahaRX21).toBe('Yamaha RX-21');
    expect(names.SequentialCircuitsTom).toBe('Sequential Circuits Tom');
    expect(MACHINES.every((m) => m.name.length > 0 && m.sounds.length > 0)).toBe(true);
  });

  it('lists classics first and kit pieces before extras', () => {
    expect(MACHINES[0].classic).toBe(true);
    const tr909 = findMachine('RolandTR909')!;
    expect(tr909.sounds[0][0]).toBe('bd');
    expect(Object.fromEntries(tr909.sounds).sd).toBe(16);
  });

  it('finds banks by alias and ignores case', () => {
    expect(findMachine('tr909')?.bank).toBe('RolandTR909');
    expect(findMachine('rolandtr808')?.bank).toBe('RolandTR808');
    expect(findMachine('')).toBe(DEFAULT_MACHINE);
    expect(findMachine('nope')).toBeUndefined();
  });
});
