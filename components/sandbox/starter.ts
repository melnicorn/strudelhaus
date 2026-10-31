// The project a new sandbox starts with: one of everything the panels can edit.
export const STARTER = `// ── setup ─────────────────────────────
setcpm(124/4)            // BPM ÷ 4 beats: 1 cycle = 1 bar
const key = "C:minor"

// ── parts ─────────────────────────────
const kick = s("bd*4").bank("RolandTR909")
const clap = s("~ cp ~ cp").bank("RolandTR909").room(.25).orbit(2)
const hats = s("[~ oh]*4").bank("RolandTR909").gain("[.6 .4]*4")
const bass = n("[~ 0] [~ 0] [~ 0] [~ 3]").scale(key).s("sawtooth").octave(2)
  .lpf(500).decay(.15).sustain(0)
const stab = chord("<Cm7 Fm7>").voicing().s("sawtooth")
  .lpf(1400).decay(.12).sustain(0).struct("[~ x]*2")
const acid = note("[c2 c2 c3 c2] [eb2 c2 c3 g1] [c2 ~ bb2 c2] [c3 c2 eb2 g2]")
  .s("sawtooth").ftype("ladder").lpf(500).lpq(18).lpdecay(.15).decay(.2).sustain(0)

// ── modifiers ─────────────────────────
const dubDelay = x => x.delay(.4).delaysync(3/16).delayfeedback(.55).orbit(3)

// ── groups ────────────────────────────
const drums = stack(kick, clap, hats)

// ── sections ──────────────────────────
const intro = stack(kick, hats)
const drop = stack(drums, bass, dubDelay(stab), acid)
const breakdown = stack(hats, dubDelay(stab), acid)

// ── arrangement ───────────────────────
arrange(
  [8, intro],
  [16, drop],
  [8, breakdown],
  [16, drop],
)
`;
