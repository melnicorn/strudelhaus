// Maps a control's value to a 0–1 position and back: linear, or logarithmic for frequencies,
// snapped to the spec's step.

export interface Range {
  min: number;
  max: number;
  step?: number;
  log?: boolean;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function toPosition(r: Range, v: number): number {
  if (r.log) {
    const lo = Math.log(Math.max(r.min, 1e-3));
    const hi = Math.log(r.max);
    return clamp((Math.log(Math.max(v, 1e-3)) - lo) / (hi - lo), 0, 1);
  }
  return clamp((v - r.min) / (r.max - r.min), 0, 1);
}

export function fromPosition(r: Range, p: number): number {
  p = clamp(p, 0, 1);
  if (r.log) {
    const lo = Math.log(Math.max(r.min, 1e-3));
    const hi = Math.log(r.max);
    const raw = Math.exp(lo + p * (hi - lo));
    // Coarser steps higher up, as with a real cutoff knob: 1 Hz, then 10, then 50.
    const step = raw > 1000 ? 50 : raw > 200 ? 10 : 1;
    return clamp(Math.round(raw / step) * step, r.min, r.max);
  }
  const v = r.min + p * (r.max - r.min);
  return snap(r, v);
}

export function snap(r: Range, v: number): number {
  const step = r.step ?? 0.01;
  const snapped = Math.round((v - r.min) / step) * step + r.min;
  return clamp(Number(snapped.toFixed(6)), r.min, r.max);
}
