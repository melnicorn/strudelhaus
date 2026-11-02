// How a knob or fader shows its number, and how it reads one typed in. Each unit is a pair so
// what you see ("2.5k", "L20", "200ms") is also what you can type.
import { formatNumber } from '@/lib/sync/miniGrid';

export type Unit = 'number' | 'int' | 'hz' | 'pan' | 'seconds' | 'signed';

export function formatValue(v: number, unit: Unit): string {
  switch (unit) {
    case 'hz':
      return v >= 1000 ? `${+(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : String(Math.round(v));
    case 'pan': {
      const p = Math.round((v - 0.5) * 100);
      return p === 0 ? 'C' : p < 0 ? `L${-p}` : `R${p}`;
    }
    case 'seconds':
      return v < 1 ? `${Math.round(v * 1000)}ms` : `${+v.toFixed(2)}s`;
    case 'signed':
      return (v > 0 ? '+' : '') + formatNumber(v);
    case 'int':
      return String(Math.round(v));
    default:
      return formatNumber(v);
  }
}

/** The number a typed readout means, or null when it isn't one. */
export function parseValue(raw: string, unit: Unit): number | null {
  const s = raw.trim().toLowerCase().replace(/^\+/, '');
  if (!s) return null;
  if (unit === 'pan') {
    if (s === 'c') return 0.5;
    const m = /^([lr])\s*(\d+(?:\.\d+)?)$/.exec(s);
    if (m) return 0.5 + (m[1] === 'l' ? -1 : 1) * Number(m[2]) / 100;
  }
  const m = /^(-?\d*\.?\d+)\s*(k|khz|hz|ms|s)?$/.exec(s);
  if (!m) return null;
  let v = Number(m[1]);
  if (m[2] === 'k' || m[2] === 'khz') v *= 1000;
  if (m[2] === 'ms') v /= 1000;
  return Number.isFinite(v) ? v : null;
}
