import { arrangement, defines, eventsOf, inBar, isNote, midiOf, numbersInBar, sectionStart, sound, uses } from '@/lib/lessons/checks';
import type { CheckContext, Lesson } from '@/lib/lessons/types';
import type { StrudelHap } from '@/lib/audio/engine';

const kit = (...s: string[]) => s.map((x) => ({ s: x, bank: 'RolandTR909' }));
const num = (v: unknown, fallback = NaN) => (v === undefined ? fallback : Number(v));

const LINE = `"[c2 c2 c3 c2] [eb2 c2 c3 g1] [c2 ~ bb2 c2] [c3 c2 eb2 g2]"`;
const ACID = `const acid = note(${LINE})
  .s("sawtooth").ftype("ladder").lpf(500).lpq(18).lpdecay(.15).decay(.2).sustain(0)`;
const ACCENTS = `  .velocity("[.6 1 .6 .6] [.6 .6 1 .6] [.6 .6 .6 .6] [1 .6 .6 .6]")
  .lpenv("[3 6 3 3] [3 3 6 3] [3 3 3 3] [6 3 3 3]")`;
const PARTS = `const kick = s("bd*4").bank("RolandTR909")
const clap = s("~ cp ~ cp").bank("RolandTR909")
const hats = s("[~ oh]*4").bank("RolandTR909").gain(.6)
const bass = note("[~ c2]*4").s("sawtooth").lpf(500)`;

const acidNotes = (c: CheckContext, cycles = 1) => c.events(cycles).filter((h) => isNote(h) && num(h.value.resonance, 0) >= 10);
const hasKick = (c: CheckContext, bar: number) => inBar(c, bar, (h) => sound(h) === 'bd').length > 0;
const hasNotes = (c: CheckContext, bar: number) => inBar(c, bar, isNote).length > 0;
/** First bar of each arrangement row. */
const rowStarts = (c: CheckContext) => arrangement(c).map((_, i) => sectionStart(c, i));

/** Lesson 33's parts and modifiers, followed by `rest` (its sections and what plays). */
const capstone = (rest: string) => `// Acid Warehouse
setcpm(126/4)            // BPM ÷ 4 beats: 1 cycle = 1 bar
const key = "C:minor"

// ── parts ─────────────────────────────
const kick = s("bd*4").bank("RolandTR909")
const clap = s("~ cp ~ cp").bank("RolandTR909").room(.2).orbit(2).hpf(200)
const hats = s("[~ oh]*4").bank("RolandTR909").gain(.55).hpf(300)
const ticks = s("hh*16").bank("RolandTR909").gain("[.4 .2 .3 .2]*4").swingBy(.16, 8).hpf(400)
const bass = n("[~ 0] [~ 0] [~ 0] [~ -2]").scale(key).s("sawtooth").octave(2)
  .lpf(450).decay(.15).sustain(0).gain(.7).orbit(4)
const acid = note(${LINE})
  .s("sawtooth").ftype("ladder").lpf(900).lpq(18).lpdecay(.15).decay(.2).sustain(0)
${ACCENTS}
  .distort(1).gain(.55).orbit(5)
const stab = chord("<Cm7 Fm7>").voicing().struct("[~ x]*2").s("sawtooth")
  .lpf(1400).decay(.15).sustain(0).hpf(200).gain(.45)
const riser = s("pink*16").hpf(saw.range(200, 6000).slow(16)).gain(.2)

// ── modifiers ─────────────────────────
const dubDelay = x => x.delay(.4).delaysync(3/16).delayfeedback(.55).orbit(3)
// Duck only where the bass (orbit 4) plays: ducking a silent orbit is an error.
const pump = x => x.duckorbit(4).duckdepth(.7)

// ── sections ──────────────────────────
${rest}
`;
const INTRO_DROP_OUTRO = `const intro = stack(kick, hats, ticks)
const drop = stack(pump(kick), clap, hats, ticks, bass, acid, dubDelay(stab))
const outro = stack(kick, hats)`;

export const expert: Lesson[] = [
  {
    id: '25-acid-line',
    number: 25,
    tier: 'expert',
    title: 'Acid I: The Line',
    goal: 'Write a 16-step 303-style acid line.',
    concept: `The **Roland TB-303** was a small bass synth with a 16-step sequencer: one oscillator (saw or square), a resonant 24 dB filter and an envelope. It flopped as a "bass guitar replacement". Then Chicago producers (Phuture's *Acid Tracks*, 1987) cranked the resonance and twisted the knobs while it played, and **acid house** was born.

An acid line is usually 16 steps of 16th notes, mostly on one root note, jumping octaves (c2 → c3) and touching a few other notes from the minor scale. The sequencer panel shows exactly that: a note per step.

The sound: \`.s("sawtooth").ftype("ladder")\`, a low cutoff, high resonance (15+), and a short filter envelope.`,
    starter: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const acid = note("c2*16").s("sawtooth")
stack(kick, acid)`,
    tasks: [
      {
        text: 'Write a 16-step line with at least three different notes (use the sequencer or edit the string).',
        hint: `note(${LINE})`,
        check: (c) => {
          const evs = c.events().filter(isNote);
          return evs.length >= 12 && new Set(evs.map(midiOf)).size >= 3;
        },
      },
      {
        text: 'Give it the 303 sound: ladder filter, cutoff 800 Hz or lower, resonance 15 or more, short filter envelope.',
        hint: '.ftype("ladder").lpf(500).lpq(18).lpenv(4).lpdecay(.15)',
        check: (c) =>
          c.events().filter(isNote).every((h) => h.value.ftype === 'ladder' && num(h.value.cutoff, 99999) <= 800 && num(h.value.resonance, 0) >= 15 && num(h.value.lpdecay, 9) <= 0.3),
      },
    ],
    challenge: {
      text: 'Overdrive it like late-80s acid: add .distort(…).',
      hint: '.distort(1.5)',
      check: (c) => c.events().filter(isNote).every((h) => num(h.value.distort, 0) > 0),
    },
    steps: [
      `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const acid = note(${LINE}).s("sawtooth")
stack(kick, acid)`,
    ],
    solution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const acid = note(${LINE}).s("sawtooth")
  .ftype("ladder").lpf(500).lpq(18).lpenv(4).lpdecay(.15)
stack(kick, acid)`,
    challengeSolution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const acid = note(${LINE}).s("sawtooth")
  .ftype("ladder").lpf(500).lpq(18).lpenv(4).lpdecay(.15)
  .distort(1.5)
stack(kick, acid)`,
    summary: ['A 303 line: 16 steps, mostly one root, octave jumps.', 'Saw + ladder filter + high resonance + short filter envelope.'],
    introduces: ['acid'],
    skills: ['E1'],
    preload: kit('bd'),
  },
  {
    id: '26-accents-and-slides',
    number: 26,
    tier: 'expert',
    title: 'Acid II: Accents and Slides',
    goal: 'Add accents, and a slide, to the acid line.',
    concept: `On a TB-303, an **accented** step is louder, *and* its filter opens further and closes faster. Strudel has no accent button, so we build accents out of what they are: a pattern of **loudness** (\`.velocity\`) and a pattern of **filter envelope depth** (\`.lpenv\`) that line up step by step. The sequencer's accent row writes both.

A **slide** makes the pitch glide from one note into the next. Strudel has **no real slide** (this is a genuine gap). The workaround: a pitch envelope that starts the note at the *previous* note's pitch and rises into its own over a short time: \`.penv(…)\` (in semitones) with \`.pattack(.06)\`. The ≈slide row computes the right amount for you. It's close, not identical: listen and judge.`,
    starter: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
${ACID}
stack(kick, acid)`,
    tasks: [
      {
        text: 'Accent at least three steps: velocity 1 on those, lower elsewhere.',
        hint: 'Click the accent row in the sequencer, or add .velocity("[.6 1 .6 .6] [.6 .6 1 .6] [.6 .6 .6 .6] [1 .6 .6 .6]").',
        check: (c) => {
          const v = c.events().filter(isNote).map((h) => num(h.value.velocity, 1));
          return v.filter((x) => x >= 0.9).length >= 3 && v.some((x) => x < 0.9);
        },
      },
      {
        text: 'Make the accented steps brighter too: a higher .lpenv on exactly the same steps.',
        hint: '.lpenv("[3 6 3 3] [3 3 6 3] [3 3 3 3] [6 3 3 3]"), matching the velocity pattern.',
        check: (c) => {
          const evs = c.events().filter(isNote);
          const top = Math.max(...evs.map((h) => num(h.value.lpenv, 0)));
          return evs.every((h) => (num(h.value.velocity, 1) >= 0.9) === (num(h.value.lpenv, 0) === top)) && evs.some((h) => num(h.value.lpenv, 0) < top);
        },
      },
      {
        text: 'Add one ≈slide into the eb2 on step 5 (from the c2 before it).',
        hint: 'Click ≈ slide on step 5, or add .penv("[0 0 0 0] [3 0 0 0] [0 0 0 0] [0 0 0 0]").pattack(.06): c2 → eb2 is 3 semitones.',
        check: (c) => {
          const h = c.events().filter(isNote).find((x) => Math.abs(x.whole!.begin.valueOf() - 4 / 16) < 1e-6);
          return !!h && num(h.value.penv, 0) === 3 && num(h.value.pattack, 0) > 0;
        },
      },
    ],
    steps: [
      `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
${ACID}
  .velocity("[.6 1 .6 .6] [.6 .6 1 .6] [.6 .6 .6 .6] [1 .6 .6 .6]")
stack(kick, acid)`,
      `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
${ACID}
${ACCENTS}
stack(kick, acid)`,
    ],
    solution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
${ACID}
${ACCENTS}
  .penv("[0 0 0 0] [3 0 0 0] [0 0 0 0] [0 0 0 0]").pattack(.06)
stack(kick, acid)`,
    summary: ['An accent = louder (.velocity) + brighter (.lpenv) on the same steps.', 'Strudel has no true slide; .penv + .pattack bends up from the previous note.'],
    introduces: ['.velocity', '.penv', '.pattack'],
    skills: ['E1'],
    preload: kit('bd'),
  },
  {
    id: '27-the-sweep',
    number: 27,
    tier: 'expert',
    title: 'Acid III: The Sweep',
    goal: 'Open the acid filter slowly over 32 bars.',
    concept: `The magic of acid is the **slow sweep**: the filter creeping open over a minute or more while the line repeats, tension building until it screams. DJs and producers did it by hand. We automate it with a long signal.

\`saw.range(300, 3000).slow(32)\` rises from 300 to 3000 Hz across 32 bars, then drops back. Inside an arrangement each section restarts its own clock, so a sweep in a 32-bar section always starts at its beginning.

Sweep resonance too, more slowly or out of step, so the sound keeps changing character.`,
    starter: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
${ACID}
${ACCENTS}
stack(kick, acid)`,
    tasks: [
      {
        text: 'Replace the fixed cutoff with a 32-bar saw sweep from about 300 to 3000 Hz.',
        hint: '.lpf(saw.range(300, 3000).slow(32))',
        check: (c) => {
          const at = (bar: number) => numbersInBar(c, bar, 'cutoff', isNote)[0];
          return at(0) < 500 && at(16) > at(0) + 800 && at(31) > at(16) && at(31) <= 3100;
        },
      },
      {
        text: 'Make the resonance move too, on a 16-bar sine.',
        hint: '.lpq(sine.range(10, 22).slow(16))',
        check: (c) => new Set([0, 4, 8, 12].map((b) => Math.round(numbersInBar(c, b, 'resonance', isNote)[0]))).size >= 3,
      },
    ],
    challenge: {
      text: 'Use .seg(16) so the sweep also moves within each bar on held notes (try it on a pad).',
      hint: 'const pad = note("[c3,g3]").s("supersaw").seg(16).lpf(saw.range(400, 4000).slow(32)).gain(.25)',
      check: (c) => uses(c, 'seg') && c.events().some((h) => h.value.s === 'supersaw'),
    },
    steps: [
      `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const acid = note(${LINE})
  .s("sawtooth").ftype("ladder").lpq(18).lpdecay(.15).decay(.2).sustain(0)
${ACCENTS}
  .lpf(saw.range(300, 3000).slow(32))
stack(kick, acid)`,
    ],
    solution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const acid = note(${LINE})
  .s("sawtooth").ftype("ladder").lpdecay(.15).decay(.2).sustain(0)
${ACCENTS}
  .lpf(saw.range(300, 3000).slow(32)).lpq(sine.range(10, 22).slow(16))
stack(kick, acid)`,
    challengeSolution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const acid = note(${LINE})
  .s("sawtooth").ftype("ladder").lpdecay(.15).decay(.2).sustain(0)
${ACCENTS}
  .lpf(saw.range(300, 3000).slow(32)).lpq(sine.range(10, 22).slow(16))
const pad = note("[c3,g3]").s("supersaw").seg(16).lpf(saw.range(400, 4000).slow(32)).gain(.25)
stack(kick, acid, pad)`,
    summary: ['Long signals automate the classic acid sweep.', 'saw.range(a, b).slow(32): a rise over 32 bars.', 'Move resonance on a different cycle for variety.'],
    introduces: ['long sweeps'],
    skills: ['E2'],
    preload: kit('bd'),
  },
  {
    id: '28-kick-vs-bass',
    number: 28,
    tier: 'expert',
    title: 'Kick vs Bass',
    goal: 'Duck the bass under the kick and clean up the low end.',
    concept: `The kick and the bass both live in the lowest frequencies (roughly 40–120 Hz). When they hit together they blur into **mud**.

Two fixes:
- **Sidechain ducking**: every time the kick hits, the bass briefly gets quieter. It clears room and adds the "pumping" house feel. In Strudel the kick does the ducking: \`kick.duckorbit(2)\` ducks everything on **orbit 2**, so put the bass on \`.orbit(2)\`. \`.duckdepth(…)\` sets how much (0–1), \`.duckattack(…)\` how fast it comes back.
- One catch: the ducked orbit must be **playing**. If nothing is on orbit 2 yet (say, in an intro without bass), Strudel reports "duck target orbit 2 does not exist". Only duck in sections where the bass plays.
- **High-pass everything else**: hats, claps and pads don't need low end. \`.hpf(200)\` (high-pass filter) removes everything below 200 Hz, leaving the bottom to kick and bass.`,
    starter: `setcpm(124/4)
${PARTS}
stack(kick, clap, hats, bass)`,
    tasks: [
      {
        text: 'Put the bass on orbit 2 and make the kick duck orbit 2.',
        hint: 'bass: .orbit(2). kick: .duckorbit(2).',
        check: (c) => {
          const bassOrbit = c.events().find(isNote)?.value.orbit;
          return bassOrbit !== undefined && Number(bassOrbit) !== 1 && eventsOf(c, 'bd').every((h) => num(h.value.duckorbit) === Number(bassOrbit));
        },
      },
      {
        text: 'High-pass the hats and clap at 200 Hz or above.',
        hint: '.hpf(250) on both.',
        check: (c) => [...eventsOf(c, 'oh'), ...eventsOf(c, 'cp')].every((h) => num(h.value.hcutoff, 0) >= 200),
      },
    ],
    challenge: {
      text: 'Set a deep duck (.duckdepth .8 or more) with a slower recovery (.duckattack .2 or more).',
      hint: '.duckdepth(.9).duckattack(.25) on the kick.',
      check: (c) => eventsOf(c, 'bd').every((h) => num(h.value.duckdepth, 0) >= 0.8 && num(h.value.duckattack, 0) >= 0.2),
    },
    steps: [
      `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909").duckorbit(2)
const clap = s("~ cp ~ cp").bank("RolandTR909")
const hats = s("[~ oh]*4").bank("RolandTR909").gain(.6)
const bass = note("[~ c2]*4").s("sawtooth").lpf(500).orbit(2)
stack(kick, clap, hats, bass)`,
    ],
    solution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909").duckorbit(2)
const clap = s("~ cp ~ cp").bank("RolandTR909").hpf(250)
const hats = s("[~ oh]*4").bank("RolandTR909").gain(.6).hpf(250)
const bass = note("[~ c2]*4").s("sawtooth").lpf(500).orbit(2)
stack(kick, clap, hats, bass)`,
    challengeSolution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909").duckorbit(2).duckdepth(.9).duckattack(.25)
const clap = s("~ cp ~ cp").bank("RolandTR909").hpf(250)
const hats = s("[~ oh]*4").bank("RolandTR909").gain(.6).hpf(250)
const bass = note("[~ c2]*4").s("sawtooth").lpf(500).orbit(2)
stack(kick, clap, hats, bass)`,
    summary: ['Kick and bass fight for the same low frequencies.', 'kick.duckorbit(n) ducks everything on orbit n.', '.hpf removes lows from parts that don’t need them.'],
    introduces: ['.duckorbit', '.duckdepth', '.duckattack', '.hpf'],
    skills: ['I8', 'E8', 'E11'],
    preload: kit('bd', 'cp', 'oh'),
  },
  {
    id: '29-phrases-and-sections',
    number: 29,
    tier: 'expert',
    title: 'Phrases and Sections',
    goal: 'Arrange an intro, a drop and an outro.',
    concept: `A track is a loop that **changes over time**. Dance music changes in **phrases** of 8, 16 or 32 bars: a new part enters, or one drops out, right at the start of a phrase.

A **section** is a named stack of what plays in that part of the song: \`const intro = stack(kick, hats)\`. \`arrange([bars, section], …)\` plays sections one after another:

\`arrange([8, intro], [16, drop], [8, outro])\`

Each section starts its own bar count from 1, so fills and sweeps line up with it. The **arrangement panel** shows sections as columns and parts as rows: click a cell to add or remove a part from a section.

DJs need **intros and outros** of mostly drums (16–32 bars) so they can mix your track in and out.`,
    starter: `setcpm(124/4)
${PARTS}
stack(kick, clap, hats, bass)`,
    tasks: [
      {
        text: 'Make two sections, intro (kick and hats) and drop (everything), and play arrange([8, intro], [16, drop]).',
        hint: 'const intro = stack(kick, hats)\nconst drop = stack(kick, clap, hats, bass)\narrange([8, intro], [16, drop])',
        check: (c) => {
          const rows = arrangement(c);
          return rows.length >= 2 && hasKick(c, 0) && !hasNotes(c, 0) && hasNotes(c, rowStarts(c)[1]);
        },
      },
      {
        text: 'Add an 8-bar outro of drums only after the drop.',
        hint: 'const outro = stack(kick, hats), then add [8, outro] to the arrangement.',
        check: (c) => {
          const rows = arrangement(c);
          const last = rowStarts(c)[rows.length - 1];
          return rows.length >= 3 && hasKick(c, last) && !hasNotes(c, last);
        },
      },
      {
        text: 'Stretch the drop to a full 32-bar phrase, keeping every section a multiple of 4 bars.',
        hint: '[32, drop]',
        check: (c) => {
          const rows = arrangement(c);
          const starts = rowStarts(c);
          return rows.length >= 3 && rows.every((r) => r.bars > 0 && r.bars % 4 === 0) && rows.some((r, i) => r.bars >= 32 && hasNotes(c, starts[i]));
        },
      },
    ],
    challenge: {
      text: 'Make the intro DJ-friendly: 16 bars of drums only.',
      hint: '[16, intro]',
      check: (c) => arrangement(c)[0]?.bars >= 16 && !hasNotes(c, 0) && !hasNotes(c, 15),
    },
    steps: [
      `setcpm(124/4)
${PARTS}
const intro = stack(kick, hats)
const drop = stack(kick, clap, hats, bass)
arrange([8, intro], [16, drop])`,
      `setcpm(124/4)
${PARTS}
const intro = stack(kick, hats)
const drop = stack(kick, clap, hats, bass)
const outro = stack(kick, hats)
arrange([8, intro], [16, drop], [8, outro])`,
    ],
    solution: `setcpm(124/4)
${PARTS}
const intro = stack(kick, hats)
const drop = stack(kick, clap, hats, bass)
const outro = stack(kick, hats)
arrange([8, intro], [32, drop], [8, outro])`,
    challengeSolution: `setcpm(124/4)
${PARTS}
const intro = stack(kick, hats)
const drop = stack(kick, clap, hats, bass)
const outro = stack(kick, hats)
arrange([16, intro], [32, drop], [8, outro])`,
    summary: ['Change things on 8/16/32-bar phrases.', 'A section is a named stack; arrange([bars, section], …) sequences them.', 'Each section counts its bars from 1.', 'Give DJs drum-only intros and outros.'],
    introduces: ['arrange', 'sections'],
    skills: ['E3', 'E4', 'E6', 'E7'],
    composition: true,
    preload: kit('bd', 'cp', 'oh'),
  },
  {
    id: '30-tension-and-release',
    number: 30,
    tier: 'expert',
    title: 'Tension and Release',
    goal: 'Build a breakdown with a riser and a snare roll, then drop back in.',
    concept: `The best moment in a club track is when everything **comes back**. To make it hit, take things away first.

A **breakdown** removes the kick (and often the bass) for 8–16 bars, leaving chords, pads or the acid line exposed. Then **tension** builds:
- a **riser**: noise (\`s("pink*16")\` or \`white\`) with a high-pass filter sweeping up: \`.hpf(saw.range(200, 6000).slow(8))\`
- a **snare roll** that speeds up: \`.lastOf(8, x => x.ply(4))\` quadruples the hits in the last bar of every 8

Then the **drop**: the kick and bass return on bar 1 of a new phrase. That's **release**.`,
    starter: `setcpm(126/4)
${PARTS}
const intro = stack(kick, hats)
const drop = stack(kick, clap, hats, bass)
arrange(
  [8, intro],
  [16, drop],
)`,
    tasks: [
      {
        text: 'Add an 8-bar breakdown with no kick, followed by the drop again.',
        hint: 'const breakdown = stack(hats, bass) and arrange(…, [8, breakdown], [16, drop]).',
        check: (c) => {
          const starts = rowStarts(c);
          return starts.some((s, i) => i < starts.length - 1 && !hasKick(c, s) && hasKick(c, starts[i + 1]) && hasNotes(c, starts[i + 1]));
        },
      },
      {
        text: 'Add a noise riser to the breakdown whose high-pass rises across it.',
        hint: 'const riser = s("pink*16").hpf(saw.range(200, 6000).slow(8)).gain(.25), and add riser to the breakdown stack.',
        check: (c) =>
          rowStarts(c).some((s, i) => {
            const bars = arrangement(c)[i].bars;
            const noise = (h: StrudelHap) => sound(h) === 'pink' || sound(h) === 'white' || sound(h) === 'brown';
            const a = numbersInBar(c, s, 'hcutoff', noise)[0];
            const b = numbersInBar(c, s + bars - 1, 'hcutoff', noise)[0];
            return a > 0 && b > a + 1000;
          }),
      },
    ],
    challenge: {
      text: 'Add a snare roll: 16 snares in the last bar of the breakdown.',
      hint: 'const roll = s("sd*4").bank("RolandTR909").lastOf(8, x => x.ply(4)).gain(.5), added to the breakdown.',
      check: (c) => Array.from({ length: 64 }, (_, b) => inBar(c, b, (h) => sound(h) === 'sd').length).some((n) => n >= 16),
    },
    steps: [
      `setcpm(126/4)
${PARTS}
const intro = stack(kick, hats)
const drop = stack(kick, clap, hats, bass)
const breakdown = stack(hats, bass)
arrange(
  [8, intro],
  [16, drop],
  [8, breakdown],
  [16, drop],
)`,
    ],
    solution: `setcpm(126/4)
${PARTS}
const riser = s("pink*16").hpf(saw.range(200, 6000).slow(8)).gain(.25)
const intro = stack(kick, hats)
const drop = stack(kick, clap, hats, bass)
const breakdown = stack(hats, bass, riser)
arrange(
  [8, intro],
  [16, drop],
  [8, breakdown],
  [16, drop],
)`,
    challengeSolution: `setcpm(126/4)
${PARTS}
const riser = s("pink*16").hpf(saw.range(200, 6000).slow(8)).gain(.25)
const roll = s("sd*4").bank("RolandTR909").lastOf(8, x => x.ply(4)).gain(.5)
const intro = stack(kick, hats)
const drop = stack(kick, clap, hats, bass)
const breakdown = stack(hats, bass, riser, roll)
arrange(
  [8, intro],
  [16, drop],
  [8, breakdown],
  [16, drop],
)`,
    summary: ['Remove the kick to build tension; bring it back to release it.', 'Risers: noise with a rising high-pass.', 'Rolls: .lastOf(8, x => x.ply(4)).'],
    introduces: ['pink', 'risers', 'rolls'],
    skills: ['E5', 'E6'],
    composition: true,
    preload: kit('bd', 'cp', 'oh', 'sd'),
  },
  {
    id: '31-never-the-same-twice',
    number: 31,
    tier: 'expert',
    title: 'Never the Same Twice',
    goal: 'Add controlled randomness so the loop keeps evolving.',
    concept: `Long techno tracks stay hypnotic because tiny details keep changing. Strudel can add **controlled randomness**:

- \`.degradeBy(.3)\` randomly drops about 30% of the hits.
- \`.sometimesBy(.25, x => x.speed(2))\` applies a change to about a quarter of the hits (\`.sometimes\`, \`.often\` and \`.rarely\` are shortcuts).
- \`rand\` is a random signal: \`.gain(rand.range(.3, .7))\`.

It's not really random: it's the same every time you play (so your track is repeatable). \`.seed(n)\` picks a different "random" variation.`,
    starter: `setcpm(128/4)
const kick = s("bd*4").bank("RolandTR909")
const hats = s("hh*16").bank("RolandTR909").gain(.4)
const perc = s("rim(5,16)").bank("RolandTR909").gain(.5)
stack(kick, hats, perc)`,
    tasks: [
      {
        text: 'Make the hats drop some hits at random with .degradeBy(…).',
        hint: '.degradeBy(.3)',
        check: (c) => new Set([0, 1, 2, 3].map((b) => inBar(c, b, (h) => sound(h) === 'hh').length)).size >= 2,
      },
      {
        text: 'Use .sometimesBy to play some rimshots at double speed (higher pitch).',
        hint: '.sometimesBy(.3, x => x.speed(2))',
        check: (c) => {
          const rims = c.events(8).filter((h) => sound(h) === 'rim');
          return uses(c, 'sometimesBy') && rims.some((h) => num(h.value.speed, 1) === 2) && rims.some((h) => num(h.value.speed, 1) !== 2);
        },
      },
    ],
    challenge: {
      text: 'Give the hats random volumes with rand.',
      hint: '.gain(rand.range(.25, .6))',
      check: (c) => new Set(inBar(c, 0, (h) => sound(h) === 'hh').map((h) => num(h.value.gain).toFixed(2))).size >= 4,
    },
    steps: [
      `setcpm(128/4)
const kick = s("bd*4").bank("RolandTR909")
const hats = s("hh*16").bank("RolandTR909").gain(.4).degradeBy(.3)
const perc = s("rim(5,16)").bank("RolandTR909").gain(.5)
stack(kick, hats, perc)`,
    ],
    solution: `setcpm(128/4)
const kick = s("bd*4").bank("RolandTR909")
const hats = s("hh*16").bank("RolandTR909").gain(.4).degradeBy(.3)
const perc = s("rim(5,16)").bank("RolandTR909").gain(.5).sometimesBy(.3, x => x.speed(2))
stack(kick, hats, perc)`,
    challengeSolution: `setcpm(128/4)
const kick = s("bd*4").bank("RolandTR909")
const hats = s("hh*16").bank("RolandTR909").gain(rand.range(.25, .6)).degradeBy(.3)
const perc = s("rim(5,16)").bank("RolandTR909").gain(.5).sometimesBy(.3, x => x.speed(2))
stack(kick, hats, perc)`,
    summary: ['.degradeBy drops random hits.', '.sometimesBy(p, f) applies f to some hits.', 'rand is a random signal; .seed(n) picks another variation.'],
    introduces: ['.degradeBy', '.sometimesBy', 'rand', '.seed', '.speed'],
    skills: ['E13'],
    preload: kit('bd', 'hh', 'rim'),
  },
  {
    id: '32-mixing-in-strudel',
    number: 32,
    tier: 'expert',
    title: 'Mixing in Strudel',
    goal: 'Balance levels, carve frequencies and avoid clipping.',
    concept: `**Mixing** makes every part audible without the whole thing distorting.

- **Gain staging**: if parts are too loud they add up and **clip** (harsh digital distortion). Keep gains at or below 1, and turn things *down* rather than up. The kick should be the loudest part.
- **Frequency space**: give each part its own range. Kick thump 50–100 Hz; bass 40–120 Hz; mud lives at 200–500 Hz; hats sparkle at 3–12 kHz. High-pass everything that isn't kick or bass.
- **Compression** evens out loud and quiet hits: \`.compressor("-20:4:10:.005:.1")\` (threshold dB : ratio : knee : attack : release).

**Strudel's limits (be honest):** there's no EQ to boost or cut a band, and no compressor or limiter on the whole mix. Filters, gain and ducking get you a long way. A finished release would still be mixed in a DAW.`,
    starter: `setcpm(126/4)
const kick = s("bd*4").bank("RolandTR909").gain(1.3)
const clap = s("~ cp ~ cp").bank("RolandTR909").gain(1.2)
const hats = s("[~ oh]*4").bank("RolandTR909").gain(1.1)
const pad = note("<[c3,eb3,g3] [f3,ab3,c4]>").s("supersaw").gain(1)
const bass = note("[~ c2]*4").s("sawtooth").lpf(500).gain(1.2)
stack(kick, clap, hats, pad, bass)`,
    tasks: [
      {
        text: 'Bring every gain down to 1 or less, with the kick the loudest.',
        hint: 'kick .9, clap .7, hats .5, pad .35, bass .7',
        check: (c) => {
          const evs = c.events();
          const kick = Math.max(...eventsOf(c, 'bd').map((h) => num(h.value.gain, 0.8)));
          return evs.every((h) => num(h.value.gain, 0.8) <= 1) && evs.filter((h) => sound(h) !== 'bd').every((h) => num(h.value.gain, 0.8) <= kick);
        },
      },
      {
        text: 'High-pass the clap, hats and pad at 150 Hz or more.',
        hint: '.hpf(200) on each.',
        check: (c) => c.events().filter((h) => ['cp', 'oh', 'supersaw'].includes(sound(h))).every((h) => num(h.value.hcutoff, 0) >= 150),
      },
    ],
    challenge: {
      text: 'Add a compressor to the clap to even it out.',
      hint: '.compressor("-20:4:10:.005:.1")',
      check: (c) => eventsOf(c, 'cp').every((h) => h.value.compressor !== undefined),
    },
    steps: [
      `setcpm(126/4)
const kick = s("bd*4").bank("RolandTR909").gain(.9)
const clap = s("~ cp ~ cp").bank("RolandTR909").gain(.7)
const hats = s("[~ oh]*4").bank("RolandTR909").gain(.5)
const pad = note("<[c3,eb3,g3] [f3,ab3,c4]>").s("supersaw").gain(.35)
const bass = note("[~ c2]*4").s("sawtooth").lpf(500).gain(.7)
stack(kick, clap, hats, pad, bass)`,
    ],
    solution: `setcpm(126/4)
const kick = s("bd*4").bank("RolandTR909").gain(.9)
const clap = s("~ cp ~ cp").bank("RolandTR909").gain(.7).hpf(200)
const hats = s("[~ oh]*4").bank("RolandTR909").gain(.5).hpf(200)
const pad = note("<[c3,eb3,g3] [f3,ab3,c4]>").s("supersaw").gain(.35).hpf(200)
const bass = note("[~ c2]*4").s("sawtooth").lpf(500).gain(.7)
stack(kick, clap, hats, pad, bass)`,
    challengeSolution: `setcpm(126/4)
const kick = s("bd*4").bank("RolandTR909").gain(.9)
const clap = s("~ cp ~ cp").bank("RolandTR909").gain(.7).hpf(200).compressor("-20:4:10:.005:.1")
const hats = s("[~ oh]*4").bank("RolandTR909").gain(.5).hpf(200)
const pad = note("<[c3,eb3,g3] [f3,ab3,c4]>").s("supersaw").gain(.35).hpf(200)
const bass = note("[~ c2]*4").s("sawtooth").lpf(500).gain(.7)
stack(kick, clap, hats, pad, bass)`,
    summary: ['Keep gains ≤ 1 and the kick loudest.', 'High-pass everything but kick and bass.', '.compressor evens out a part; Strudel has no master EQ or limiter.'],
    introduces: ['.compressor', 'gain staging'],
    skills: ['E9', 'E10', 'E11'],
    preload: kit('bd', 'cp', 'oh'),
  },
  {
    id: '33-capstone',
    number: 33,
    tier: 'expert',
    title: 'Capstone: Acid Warehouse',
    goal: 'Write a complete, arranged 90s acid house track yourself.',
    concept: `Everything comes together. Write a full track, around five minutes, from an empty page. Look back at earlier lessons whenever you need, but write the code yourself.

The shape (bars):

- **intro** 16: drums only, DJ-friendly
- **build** 16: bass and acid enter, the filter opens
- **drop** 32: everything
- **breakdown** 16: no kick; chords, acid, a riser
- **drop** again 32
- **outro** 16: drums only

Checklist: tempo 120–130 · a key · named parts (kick, clap, hats, bass, acid; chords and percussion are a bonus) · accents on the acid · a sidechained bass · reverb/delay on their own orbits · high-passed hats · sections in multiples of 4 bars.

When you're done, save your parts to the library. You wrote a track in code.`,
    starter: `// Acid Warehouse
setcpm(126/4)            // BPM ÷ 4 beats: 1 cycle = 1 bar
const key = "C:minor"

// ── parts ─────────────────────────────

// ── modifiers ─────────────────────────

// ── sections ──────────────────────────

// ── arrangement ───────────────────────
`,
    tasks: [
      {
        text: 'Parts: define kick, clap, hats, bass and acid, and play them together.',
        hint: 'One const each, then stack(kick, clap, hats, bass, acid). The acid needs a ladder filter and high resonance.',
        check: (c) => ['kick', 'clap', 'hats', 'bass', 'acid'].every((n) => defines(c, n)),
      },
      {
        text: 'DJ-friendly: arrange an intro and an outro with kick but no bass or acid, around a drop with everything.',
        hint: 'const intro = stack(kick, hats, ticks), const drop = stack(kick, clap, hats, bass, acid), const outro = stack(kick, hats), then arrange([16, intro], [32, drop], [16, outro])',
        check: (c) => {
          const starts = rowStarts(c);
          const first = starts[0];
          const last = starts[starts.length - 1];
          return starts.length > 1 && hasKick(c, first) && !hasNotes(c, first) && hasKick(c, last) && !hasNotes(c, last);
        },
      },
      {
        text: 'Breakdown: after the drop, a section with no kick but with music.',
        hint: 'const breakdown = stack(hats, acid, stab, riser), then [16, breakdown] after the drop.',
        check: (c) => {
          const starts = rowStarts(c);
          return starts.slice(1, -1).some((s) => !hasKick(c, s) && hasNotes(c, s));
        },
      },
      {
        text: 'Drop again: some section has kick, bass and the acid line together, and it plays at least twice.',
        hint: '[32, drop] again after the breakdown.',
        check: (c) => {
          const rows = arrangement(c);
          const starts = rowStarts(c);
          const full = starts.filter((s) => hasKick(c, s) && acidNotes({ ...c, events: () => inBar(c, s) } as CheckContext).length > 0 && inBar(c, s, (h) => isNote(h) && (midiOf(h) ?? 99) < 40).length > 0);
          return full.length >= 2 && rows.length >= 2;
        },
      },
      {
        text: 'Build: add a section after the intro, for at least six sections, each a multiple of 4 bars, at least 96 bars in total.',
        hint: 'const build = stack(kick, hats, ticks, bass, acid), then [16, build] after the intro.',
        check: (c) => {
          const rows = arrangement(c);
          return rows.length >= 6 && rows.every((r) => r.bars % 4 === 0) && rows.reduce((s, r) => s + r.bars, 0) >= 96;
        },
      },
    ],
    challenge: {
      text: 'In the build, open the acid filter across the whole section.',
      hint: 'A modifier like const rise = x => x.lpf(saw.range(300, 2500).slow(16)), applied to acid in the build.',
      check: (c) => {
        const starts = rowStarts(c);
        const rows = arrangement(c);
        return starts.some((s, i) => {
          const a = numbersInBar(c, s, 'cutoff', (h) => isNote(h) && num(h.value.resonance, 0) >= 10)[0];
          const b = numbersInBar(c, s + rows[i].bars - 1, 'cutoff', (h) => isNote(h) && num(h.value.resonance, 0) >= 10)[0];
          return a > 0 && b > a * 2;
        });
      },
    },
    steps: [
      capstone('stack(kick, clap, hats, bass, acid)'),
      capstone(`${INTRO_DROP_OUTRO}

// ── arrangement ───────────────────────
arrange(
  [16, intro],
  [32, drop],
  [16, outro],
)`),
      capstone(`${INTRO_DROP_OUTRO}
const breakdown = stack(hats, acid, dubDelay(stab), riser)

// ── arrangement ───────────────────────
arrange(
  [16, intro],
  [32, drop],
  [16, breakdown],
  [16, outro],
)`),
      capstone(`${INTRO_DROP_OUTRO}
const breakdown = stack(hats, acid, dubDelay(stab), riser)

// ── arrangement ───────────────────────
arrange(
  [16, intro],
  [32, drop],
  [16, breakdown],
  [32, drop],
  [16, outro],
)`),
    ],
    solution: capstone(`${INTRO_DROP_OUTRO}
const breakdown = stack(hats, acid, dubDelay(stab), riser)
const build = stack(pump(kick), hats, ticks, bass, acid)

// ── arrangement ───────────────────────
arrange(
  [16, intro],
  [16, build],
  [32, drop],
  [16, breakdown],
  [32, drop],
  [16, outro],
)`),
    challengeSolution: capstone(`${INTRO_DROP_OUTRO}
const breakdown = stack(hats, acid, dubDelay(stab), riser)
const rise = x => x.lpf(saw.range(300, 2500).slow(16))
const build = stack(pump(kick), hats, ticks, bass, rise(acid))

// ── arrangement ───────────────────────
arrange(
  [16, intro],
  [16, build],
  [32, drop],
  [16, breakdown],
  [32, drop],
  [16, outro],
)`),
    summary: ['You can write a complete arranged track in Strudel code.', 'Parts, modifiers, sections and arrange() are all plain, readable code.'],
    introduces: ['capstone'],
    skills: ['E14'],
    composition: true,
    preload: kit('bd', 'cp', 'oh', 'hh'),
  },
];
