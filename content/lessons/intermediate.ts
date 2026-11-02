import {
  begin,
  defines,
  eventsOf,
  inBar,
  inKey,
  isNote,
  lowestPitchClass,
  maxChordSize,
  midiOf,
  numbersInBar,
  playsAt,
  sound,
  times,
  uses,
  valuesOf,
} from '@/lib/lessons/checks';
import type { CheckContext, Lesson } from '@/lib/lessons/types';

const kit = (...s: string[]) => s.map((x) => ({ s: x, bank: 'RolandTR909' }));
const BEATS = [0, 0.25, 0.5, 0.75];
const DRUMS = `const kick = s("bd*4").bank("RolandTR909")
const clap = s("~ cp ~ cp").bank("RolandTR909")`;

/** Key value written in `const key = "…"`, if any. */
const keyOf = (c: CheckContext) => {
  const b = c.model.blocks.find((x) => x.name === 'key');
  return b?.kind === 'key' && b.value.kind === 'string' ? b.value.value : undefined;
};
const notesIn = (c: CheckContext, cycles = 1) => c.events(cycles).filter(isNote).map(midiOf).filter((m): m is number => m !== null);
const synthEvents = (c: CheckContext, s: string) => c.events().filter((h) => h.value.s === s);
const num = (v: unknown, fallback = NaN) => (v === undefined ? fallback : Number(v));

export const intermediate: Lesson[] = [
  {
    id: '11-swing-it',
    number: 11,
    tier: 'intermediate',
    title: 'Swing It',
    goal: 'Shuffle the hats like an MPC.',
    concept: `Straight 16th notes are perfectly even. **Swing** pushes every second 16th a little late, so the hats lean forward and "shuffle". Chicago house and Detroit techno usually swing by 55–60%.

Roger Linn, who designed the swing on the MPC, describes it like this: **50%** is straight, **66%** puts the late note on the triplet, and around **54%** loosens the feel without sounding swung.

In Strudel: \`.swingBy(x, 8)\` cuts the bar into 8 slices (8th notes) and delays the second half of each slice. To get **p%** swing, use \`x = (p − 50) / 50\`: 54% is \`.swingBy(.08, 8)\`. The panel's swing control writes this for you.`,
    starter: `setcpm(124/4)
${DRUMS}
const hats = s("hh*16").bank("RolandTR909").gain("[.7 .35]*8")
stack(kick, clap, hats)`,
    tasks: [
      {
        text: 'Swing the hats with .swingBy(…, 8).',
        hint: 'Add .swingBy(.08, 8) to the hats.',
        check: (c) => {
          const t = times(c, (h) => sound(h) === 'hh');
          return t.length === 16 && t[1] > 1 / 16 + 0.002 && Math.abs(t[0]) < 1e-6;
        },
      },
      {
        text: 'Set a house swing between 55% and 62%.',
        hint: 'x = (p − 50) / 50: 55% → .1, 62% → .24.',
        check: (c) => {
          const t = times(c, (h) => sound(h) === 'hh');
          const p = 50 + ((t[1] - 1 / 16) * 16 * 50) / 1; // delay of x/16 bar → p = 50 + 50x
          return t.length === 16 && p >= 54.9 && p <= 62.1;
        },
        // The challenge swings harder, past house range.
        replacedLater: true,
      },
    ],
    challenge: {
      text: 'Try the triplet feel: 66% swing.',
      hint: 'x = (66 − 50) / 50 = .32',
      check: (c) => {
        const t = times(c, (h) => sound(h) === 'hh');
        return t.length === 16 && Math.abs(t[1] - (1 / 16 + 0.32 / 16)) < 0.003;
      },
    },
    steps: [
      `setcpm(124/4)
${DRUMS}
const hats = s("hh*16").bank("RolandTR909").gain("[.7 .35]*8").swingBy(.08, 8)
stack(kick, clap, hats)`,
    ],
    solution: `setcpm(124/4)
${DRUMS}
const hats = s("hh*16").bank("RolandTR909").gain("[.7 .35]*8").swingBy(.16, 8)
stack(kick, clap, hats)`,
    challengeSolution: `setcpm(124/4)
${DRUMS}
const hats = s("hh*16").bank("RolandTR909").gain("[.7 .35]*8").swingBy(.32, 8)
stack(kick, clap, hats)`,
    summary: ['Swing delays every second 16th note.', '.swingBy(x, 8): x = (swing% − 50) / 50.', '55–60% is classic house shuffle.'],
    introduces: ['.swingBy'],
    skills: ['I1'],
    preload: kit('bd', 'cp', 'hh'),
  },
  {
    id: '12-off-the-grid',
    number: 12,
    tier: 'intermediate',
    title: 'Off the Grid',
    goal: 'Add syncopated percussion with Euclidean rhythms.',
    concept: `**Syncopation** means accenting the "wrong" places: offbeats, or just before a beat. It's what makes percussion feel alive against a steady kick.

A quick way to get good syncopated rhythms is the **Euclidean rhythm**: spread *k* hits as evenly as possible over *n* steps. \`"rim(3,8)"\` gives 3 rimshots over 8 steps: x . . x . . x . — the famous "tresillo" found in Latin, African and house music.

Add a third number to rotate it: \`"rim(3,8,1)"\` shifts the pattern round by one step. Try \`(5,16)\`, \`(7,16)\` and \`(3,8)\` on cowbell (\`cb\`), rimshot (\`rim\`) or toms (\`lt\`, \`mt\`, \`ht\`).`,
    starter: `setcpm(124/4)
${DRUMS}
stack(kick, clap)`,
    tasks: [
      {
        text: 'Add a part called perc that plays rim(3,8), and stack it.',
        hint: 'const perc = s("rim(3,8)").bank("RolandTR909")',
        check: (c) => defines(c, 'perc') && playsAt(c, 'rim', [0, 3 / 8, 6 / 8]),
        replacedLater: true,
      },
      {
        text: 'Rotate it so the first rim no longer lands on the downbeat.',
        hint: 'rim(3,8,1)',
        check: (c) => {
          const t = times(c, (h) => sound(h) === 'rim');
          return t.length === 3 && t[0] > 0;
        },
      },
    ],
    challenge: {
      text: 'Add a cowbell with 5 hits spread over 16 steps.',
      hint: 's("cb(5,16)").bank("RolandTR808"): the 909 has no cowbell!',
      check: (c) => times(c, (h) => sound(h) === 'cb').length === 5,
    },
    steps: [
      `setcpm(124/4)
${DRUMS}
const perc = s("rim(3,8)").bank("RolandTR909")
stack(kick, clap, perc)`,
    ],
    solution: `setcpm(124/4)
${DRUMS}
const perc = s("rim(3,8,1)").bank("RolandTR909")
stack(kick, clap, perc)`,
    challengeSolution: `setcpm(124/4)
${DRUMS}
const perc = s("rim(3,8,1)").bank("RolandTR909")
const bell = s("cb(5,16)").bank("RolandTR808").gain(.5)
stack(kick, clap, perc, bell)`,
    summary: ['Syncopation accents unexpected places.', '"x(k,n)" spreads k hits over n steps; a third number rotates.'],
    introduces: ['(k,n,rot)'],
    skills: ['I2', 'I3'],
    preload: [...kit('bd', 'cp', 'rim'), { s: 'cb', bank: 'RolandTR808' }],
  },
  {
    id: '13-every-fourth-bar',
    number: 13,
    tier: 'intermediate',
    title: 'Every Fourth Bar',
    goal: 'Change the clap every other bar, and add a fill every 4 bars.',
    concept: `A loop that never changes gets boring. Dance music changes on **phrase boundaries**: every 2, 4 or 8 bars.

\`< >\` already picks one item per bar: \`"<[~ cp ~ cp] [~ cp ~ [cp cp]]>"\` alternates two clap patterns.

\`.lastOf(4, f)\` applies a change \`f\` in the **last bar of every 4**. A **fill** is a short variation that announces the next phrase. \`x => x.ply(2)\` doubles every hit, a quick and effective fill. (\`x => …\` is a small function: "take the pattern x and return a changed version".)

\`!\` repeats a step without squeezing (\`"bd!3 ~"\`), and \`@\` makes a step longer (\`"c2@3 eb2"\` holds c2 for three quarters of the bar).`,
    starter: `setcpm(124/4)
${DRUMS}
const hats = s("[~ oh]*4").bank("RolandTR909").gain(.6)
stack(kick, clap, hats)`,
    tasks: [
      {
        text: 'Make the clap alternate between two patterns, one per bar.',
        hint: 's("<[~ cp ~ cp] [~ cp ~ [cp cp]]>")',
        check: (c) => times(c, (h) => sound(h) === 'cp', 0).join() !== times(c, (h) => sound(h) === 'cp', 1).join(),
      },
      {
        text: 'Add a fill to the hats in the last bar of every 4 with .lastOf(4, x => x.ply(2)).',
        hint: 'Put it at the end of the hats line.',
        check: (c) => inBar(c, 3, (h) => sound(h) === 'oh').length > inBar(c, 0, (h) => sound(h) === 'oh').length && inBar(c, 7, (h) => sound(h) === 'oh').length > 4,
      },
    ],
    challenge: {
      text: 'Write a kick pattern using ! that plays three kicks and rests on the last beat.',
      hint: '"bd!3 ~"',
      check: (c) => playsAt(c, 'bd', [0, 0.25, 0.5]) && /bd!3/.test(c.code),
    },
    steps: [
      `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const clap = s("<[~ cp ~ cp] [~ cp ~ [cp cp]]>").bank("RolandTR909")
const hats = s("[~ oh]*4").bank("RolandTR909").gain(.6)
stack(kick, clap, hats)`,
    ],
    solution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const clap = s("<[~ cp ~ cp] [~ cp ~ [cp cp]]>").bank("RolandTR909")
const hats = s("[~ oh]*4").bank("RolandTR909").gain(.6).lastOf(4, x => x.ply(2))
stack(kick, clap, hats)`,
    challengeSolution: `setcpm(124/4)
const kick = s("bd!3 ~").bank("RolandTR909")
const clap = s("<[~ cp ~ cp] [~ cp ~ [cp cp]]>").bank("RolandTR909")
const hats = s("[~ oh]*4").bank("RolandTR909").gain(.6).lastOf(4, x => x.ply(2))
stack(kick, clap, hats)`,
    summary: ['Change things every 2, 4 or 8 bars.', '.lastOf(n, f) changes the last bar of every n.', 'x => x.ply(2) is a function that doubles every hit.', '! repeats a step; @ lengthens one.'],
    introduces: ['.lastOf', '.ply', '!', '@', 'x => …'],
    skills: ['I19', 'E3'],
    preload: kit('bd', 'cp', 'oh'),
  },
  {
    id: '14-keys-and-scales',
    number: 14,
    tier: 'intermediate',
    title: 'Keys and Scales',
    goal: 'Write a bassline with scale degrees that follows the key.',
    concept: `A **scale** is a set of notes that sound good together. The **key** says which note is "home". Almost all techno, and most deep house, is in a **minor** key.

Instead of note names you can write **scale degrees**: \`n("0 2 4").scale("C:minor")\` plays the 1st, 3rd and 5th notes of C minor (C, E♭, G). Degree 0 is the home note; 7 is home again one octave up.

Put the key in one place, \`const key = "C:minor"\`, and use \`.scale(key)\` everywhere. Change the key once and every degree-based part follows, and they never clash. That's why library parts in degrees combine so easily.`,
    starter: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const bass = note("[~ c2] [~ c2] [~ eb2] [~ g1]").s("sawtooth").lpf(500)
stack(kick, bass)`,
    tasks: [
      {
        text: 'Add const key = "C:minor" near the top.',
        hint: 'const key = "C:minor"',
        check: (c) => keyOf(c) !== undefined,
      },
      {
        text: 'Rewrite the bass with n(…).scale(key): use degrees, at octave 2.',
        hint: 'n("[~ 0] [~ 0] [~ 2] [~ -3]").scale(key).s("sawtooth").octave(2). Negative degrees go below home.',
        check: (c) => uses(c, 'scale') && /scale\(\s*key\s*\)/.test(c.code) && notesIn(c).length >= 3 && notesIn(c).every((m) => inKey(m, keyOf(c) ?? 'C:minor')),
      },
    ],
    challenge: {
      text: 'Change the key to A:minor. Every note should move together.',
      hint: 'Only the key line changes.',
      check: (c) => (keyOf(c) ?? '').toLowerCase() === 'a:minor' && notesIn(c).length > 0 && notesIn(c).every((m) => inKey(m, 'A:minor')) && notesIn(c).some((m) => m % 12 === 9),
    },
    steps: [
      `setcpm(124/4)
const key = "C:minor"
const kick = s("bd*4").bank("RolandTR909")
const bass = note("[~ c2] [~ c2] [~ eb2] [~ g1]").s("sawtooth").lpf(500)
stack(kick, bass)`,
    ],
    solution: `setcpm(124/4)
const key = "C:minor"
const kick = s("bd*4").bank("RolandTR909")
const bass = n("[~ 0] [~ 0] [~ 2] [~ -3]").scale(key).s("sawtooth").octave(2).lpf(500)
stack(kick, bass)`,
    challengeSolution: `setcpm(124/4)
const key = "A:minor"
const kick = s("bd*4").bank("RolandTR909")
const bass = n("[~ 0] [~ 0] [~ 2] [~ -3]").scale(key).s("sawtooth").octave(2).lpf(500)
stack(kick, bass)`,
    summary: ['A key = a home note plus a scale.', 'n("0 2 4").scale("C:minor") plays scale degrees.', 'One const key keeps every part in tune.'],
    introduces: ['n', '.scale', '.octave', 'const key'],
    skills: ['I5', 'I20'],
    preload: kit('bd'),
  },
  {
    id: '15-minor-seventh-stab',
    number: 15,
    tier: 'intermediate',
    title: 'The Minor 7th Stab',
    goal: 'Play a classic house chord stab.',
    concept: `A **chord** is several notes played together. A comma in mini-notation means "at the same time": \`note("c3,eb3,g3")\` is a C minor chord.

Add one more note from the scale, the 7th, and you get **C minor 7** (C, E♭, G, B♭). That warm, slightly melancholy sound is the house and Detroit chord. Played short on the offbeats, it's a **stab**.

\`chord("Cm7").voicing()\` asks Strudel to pick nice positions for the notes. It's shorter to write, but hides the notes: the chord panel shows which notes it picked.`,
    starter: `setcpm(124/4)
${DRUMS}
stack(kick, clap)`,
    tasks: [
      {
        text: 'Add a part called stab that plays C minor 7 (c3, eb3, g3, bb3) all at once.',
        hint: 'const stab = note("[c3,eb3,g3,bb3]").s("sawtooth").lpf(1500)',
        check: (c) => defines(c, 'stab') && maxChordSize(c) >= 4,
      },
      {
        text: 'Make it a stab: two short hits on the offbeats of beats 2 and 4.',
        hint: 'note("[~ [c3,eb3,g3,bb3]]*2"), and shorten it with .clip(.3).',
        check: (c) => {
          const t = [...new Set(c.events().filter(isNote).map(begin))].sort();
          return t.length === 2 && Math.abs(t[0] - 0.25) < 1e-6 && Math.abs(t[1] - 0.75) < 1e-6;
        },
      },
    ],
    challenge: {
      text: 'Write it with chord("Cm7").voicing() instead, keeping the rhythm with .struct("[~ x]*2").',
      hint: 'chord("Cm7").voicing().struct("[~ x]*2").s("sawtooth")',
      check: (c) => uses(c, 'chord') && uses(c, 'voicing') && maxChordSize(c) >= 3,
    },
    steps: [
      `setcpm(124/4)
${DRUMS}
const stab = note("[c3,eb3,g3,bb3]").s("sawtooth").lpf(1500)
stack(kick, clap, stab)`,
    ],
    solution: `setcpm(124/4)
${DRUMS}
const stab = note("[~ [c3,eb3,g3,bb3]]*2").s("sawtooth").lpf(1500).clip(.3)
stack(kick, clap, stab)`,
    challengeSolution: `setcpm(124/4)
${DRUMS}
const stab = chord("Cm7").voicing().struct("[~ x]*2").s("sawtooth").lpf(1500).clip(.3)
stack(kick, clap, stab)`,
    summary: ['"a,b,c" plays notes together.', 'A minor 7th chord is the classic house chord.', 'chord("Cm7").voicing() picks the notes for you.', '.clip(…) shortens notes.'],
    introduces: [',', 'chord', '.voicing', '.struct', '.clip'],
    skills: ['I6'],
    preload: kit('bd', 'cp'),
  },
  {
    id: '16-progressions',
    number: 16,
    tier: 'intermediate',
    title: 'Progressions',
    goal: 'Move between chords, with the bass following the root.',
    concept: `A **chord progression** is a sequence of chords that repeats. House often uses just two chords, a bar each: \`chord("<Cm7 Fm7>")\`.

The bass usually plays the **root**, the note a chord is named after (C for Cm7, F for Fm7). \`.rootNotes(2)\` turns a chord pattern into its root notes in octave 2, so the bass always follows the chords, even when you change them.

**Spelling matters.** Strudel writes a major seventh as \`^7\` (\`Ab^7\`), not \`maj7\`, and a minor seventh as \`-7\` or \`m7\`. A chord name it doesn't know plays **nothing**, silently; \`.rootNotes()\` still finds the root, so the bass moves while the chord drops out. The panel beside the code warns you when that happens.`,
    starter: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const stab = chord("Cm7").voicing().struct("[~ x]*2").s("sawtooth").lpf(1500).clip(.3)
stack(kick, stab)`,
    tasks: [
      {
        text: 'Make the stab alternate Cm7 and Fm7, one per bar.',
        hint: 'chord("<Cm7 Fm7>")',
        check: (c) => {
          const pcs = (cy: number) => [...new Set(inBar(c, cy, isNote).map(midiOf).map((m) => (m ?? 0) % 12))].sort().join();
          return pcs(0) !== pcs(1) && inBar(c, 1, isNote).some((h) => (midiOf(h) ?? 0) % 12 === 5);
        },
      },
      {
        text: 'Add a bass that plays the root of each chord with .rootNotes(2).',
        hint: 'const bass = chord("<Cm7 Fm7>").rootNotes(2).struct("[~ x]*4").s("sawtooth").lpf(400)',
        check: (c) => uses(c, 'rootNotes') && lowestPitchClass(c, 0) === 0 && lowestPitchClass(c, 1) === 5,
      },
    ],
    challenge: {
      text: 'Make it a four-chord progression: Cm7, Fm7, Ab major 7th, Gm7 (remember: ^7, not maj7).',
      hint: '"<Cm7 Fm7 Ab^7 Gm7>" in both parts (or a const chords = "<…>" they share).',
      // The roots must move, and every bar must have a voiced chord above the root (Abmaj7 would leave bar 3 bass-only).
      check: (c) =>
        [0, 1, 2, 3].map((b) => lowestPitchClass(c, b)).join() === '0,5,8,7' &&
        [0, 1, 2, 3].every((b) => new Set(inBar(c, b, isNote).map((h) => (midiOf(h) ?? 0) % 12)).size >= 3),
    },
    steps: [
      `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const stab = chord("<Cm7 Fm7>").voicing().struct("[~ x]*2").s("sawtooth").lpf(1500).clip(.3)
stack(kick, stab)`,
    ],
    solution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const stab = chord("<Cm7 Fm7>").voicing().struct("[~ x]*2").s("sawtooth").lpf(1500).clip(.3)
const bass = chord("<Cm7 Fm7>").rootNotes(2).struct("[~ x]*4").s("sawtooth").lpf(400)
stack(kick, stab, bass)`,
    challengeSolution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const stab = chord("<Cm7 Fm7 Ab^7 Gm7>").voicing().struct("[~ x]*2").s("sawtooth").lpf(1500).clip(.3)
const bass = chord("<Cm7 Fm7 Ab^7 Gm7>").rootNotes(2).struct("[~ x]*4").s("sawtooth").lpf(400)
stack(kick, stab, bass)`,
    summary: ['A progression is a repeating chord sequence.', '"<A B>" gives each chord a bar.', '.rootNotes(octave) gives a bass that follows the chords.'],
    introduces: ['.rootNotes'],
    skills: ['I7', 'I8'],
    preload: kit('bd'),
  },
  {
    id: '17-waveforms',
    number: 17,
    tier: 'intermediate',
    title: 'Waveforms',
    goal: 'Hear sine, triangle, square, sawtooth and supersaw.',
    concept: `A synthesizer starts with an **oscillator** making a simple repeating wave. The wave's shape decides the tone:

- **sine**: pure and round. A clean sub bass. It has no harmonics, so below about 80 Hz (c2 and under) laptop speakers play almost nothing of it: use headphones, and trust the beat LEDs when you can't hear it.
- **triangle**: soft, a little hollow.
- **square**: hollow and woody, good for basses and leads (the TB-303 has saw and square).
- **sawtooth**: bright and buzzy, full of harmonics; the classic for filtering.
- **supersaw**: several detuned saws at once: wide, shiny pads and trance leads. \`.unison(n)\` sets how many, \`.detune(…)\` how far apart.`,
    starter: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const bass = note("[~ c2]*4").s("sawtooth").lpf(800)
stack(kick, bass)`,
    tasks: [
      {
        text: 'Change the bass to a square wave.',
        hint: '.s("square")',
        check: (c) => synthEvents(c, 'square').length > 0,
      },
      {
        text: 'Add a pad: a long supersaw chord with 7 unison voices.',
        hint: 'const pad = note("[c3,eb3,g3]").s("supersaw").unison(7).lpf(2000).gain(.4)',
        check: (c) => synthEvents(c, 'supersaw').some((h) => num(h.value.unison) >= 7),
      },
    ],
    challenge: {
      text: 'Add a sine sub under the bass: the same notes (c2), s("sine"). Headphones on: a pure 65 Hz tone barely exists on small speakers, and on its own it can sound like nothing at all.',
      hint: 'const sub = note("[~ c2]*4").s("sine").gain(1.2). Solo the bass and the sub in turn: the sub adds weight you feel more than hear.',
      // c2 or lower (c3 is MIDI 48): a sub, not just any sine.
      check: (c) => synthEvents(c, 'sine').some((h) => (midiOf(h) ?? 99) < 48),
    },
    steps: [
      `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const bass = note("[~ c2]*4").s("square").lpf(800)
stack(kick, bass)`,
    ],
    solution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const bass = note("[~ c2]*4").s("square").lpf(800)
const pad = note("[c3,eb3,g3]").s("supersaw").unison(7).lpf(2000).gain(.4)
stack(kick, bass, pad)`,
    challengeSolution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const bass = note("[~ c2]*4").s("square").lpf(800)
const pad = note("[c3,eb3,g3]").s("supersaw").unison(7).lpf(2000).gain(.4)
const sub = note("[~ c2]*4").s("sine").gain(1.2)
stack(kick, bass, pad, sub)`,
    summary: ['The oscillator wave shapes the tone.', 'Saw and square are bright; sine is pure.', 'supersaw stacks detuned saws: .unison, .detune, .spread.'],
    introduces: ['sine', 'triangle', 'square', 'supersaw', '.unison', '.detune', '.spread'],
    skills: ['I9'],
    preload: kit('bd'),
  },
  {
    id: '18-envelopes',
    number: 18,
    tier: 'intermediate',
    title: 'Envelopes',
    goal: 'Turn a long note into a pluck, and another into a slow pad.',
    concept: `An **envelope** shapes how a note's volume changes over time, in four stages called **ADSR**:

- **Attack**: how long it takes to fade in (seconds).
- **Decay**: how long it takes to fall to the sustain level.
- **Sustain**: the level held while the note lasts (0 to 1, a level, not a time).
- **Release**: how long it fades out after the note ends.

A **pluck** is a fast attack, short decay and zero sustain: \`.attack(.005).decay(.15).sustain(0)\`. A **pad** fades in slowly and lingers: \`.attack(.5).release(1)\`. \`.adsr(".01:.15:0:.1")\` sets all four at once.`,
    starter: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const stab = note("[~ [c3,eb3,g3,bb3]]*2").s("sawtooth").lpf(1500)
const pad = note("<[c3,eb3,g3] [f3,ab3,c4]>").s("supersaw").lpf(1800).gain(.35)
stack(kick, stab, pad)`,
    tasks: [
      {
        text: 'Make the stab a pluck: decay .2 or less and sustain 0.',
        hint: '.decay(.15).sustain(0)',
        check: (c) => {
          const evs = c.events().filter((h) => h.value.s === 'sawtooth');
          return evs.length > 0 && evs.every((h) => num(h.value.decay, 9) <= 0.2 && num(h.value.sustain, 1) === 0);
        },
      },
      {
        text: 'Give the pad a slow attack (at least .3 s) and a long release (at least .5 s).',
        hint: '.attack(.5).release(1)',
        check: (c) => synthEvents(c, 'supersaw').some((h) => num(h.value.attack, 0) >= 0.3 && num(h.value.release, 0) >= 0.5),
      },
    ],
    challenge: {
      text: 'Write the stab envelope with .adsr("…") in one go.',
      hint: '.adsr(".005:.15:0:.05")',
      check: (c) => uses(c, 'adsr') && c.events().some((h) => h.value.s === 'sawtooth' && num(h.value.sustain, 1) === 0),
    },
    steps: [
      `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const stab = note("[~ [c3,eb3,g3,bb3]]*2").s("sawtooth").lpf(1500).decay(.15).sustain(0)
const pad = note("<[c3,eb3,g3] [f3,ab3,c4]>").s("supersaw").lpf(1800).gain(.35)
stack(kick, stab, pad)`,
    ],
    solution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const stab = note("[~ [c3,eb3,g3,bb3]]*2").s("sawtooth").lpf(1500).decay(.15).sustain(0)
const pad = note("<[c3,eb3,g3] [f3,ab3,c4]>").s("supersaw").lpf(1800).gain(.35).attack(.5).release(1)
stack(kick, stab, pad)`,
    challengeSolution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const stab = note("[~ [c3,eb3,g3,bb3]]*2").s("sawtooth").lpf(1500).adsr(".005:.15:0:.05")
const pad = note("<[c3,eb3,g3] [f3,ab3,c4]>").s("supersaw").lpf(1800).gain(.35).attack(.5).release(1)
stack(kick, stab, pad)`,
    summary: ['ADSR: attack, decay, sustain (a level), release.', 'Pluck: short decay, zero sustain.', 'Pad: slow attack, long release.'],
    introduces: ['.attack', '.decay', '.sustain', '.release', '.adsr'],
    skills: ['I10'],
    preload: kit('bd'),
  },
  {
    id: '19-squelch',
    number: 19,
    tier: 'intermediate',
    title: 'Squelch',
    goal: 'Add resonance and a filter envelope: the first taste of acid.',
    concept: `**Resonance** boosts the frequencies right at the filter's cutoff. A little adds bite; a lot makes the filter "whistle" and **squelch**. In Strudel it's \`.lpq(…)\` (0 to about 40).

A **filter envelope** moves the cutoff on every note: it opens quickly, then closes. \`.lpenv(4)\` sets how far it opens, \`.lpdecay(.15)\` how fast it closes. Each note gets a "wow" or "yow".

\`.ftype("ladder")\` switches to a 24 dB "ladder" filter, the steep, rubbery type in the TB-303 and Moog synths. Add \`.drive(…)\` to overdrive it.`,
    starter: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const bass = note("[c2 c2 c3 c2]*4").s("sawtooth").lpf(400).decay(.15).sustain(0)
stack(kick, bass)`,
    tasks: [
      {
        text: 'Turn the resonance up to 12 or more.',
        hint: '.lpq(15)',
        check: (c) => c.events().filter(isNote).every((h) => num(h.value.resonance, 0) >= 12),
      },
      {
        text: 'Add a filter envelope that opens and closes quickly (lpenv above 0, lpdecay .3 or less).',
        hint: '.lpenv(4).lpdecay(.15)',
        check: (c) => c.events().filter(isNote).every((h) => num(h.value.lpenv, 0) > 0 && num(h.value.lpdecay, 9) <= 0.3),
      },
    ],
    challenge: {
      text: 'Switch to the ladder filter and add some drive.',
      hint: '.ftype("ladder").drive(2)',
      check: (c) => c.events().filter(isNote).every((h) => h.value.ftype === 'ladder' && num(h.value.drive, 0) > 0),
    },
    steps: [
      `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const bass = note("[c2 c2 c3 c2]*4").s("sawtooth").lpf(400).decay(.15).sustain(0).lpq(15)
stack(kick, bass)`,
    ],
    solution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const bass = note("[c2 c2 c3 c2]*4").s("sawtooth").lpf(400).decay(.15).sustain(0)
  .lpq(15).lpenv(4).lpdecay(.15)
stack(kick, bass)`,
    challengeSolution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const bass = note("[c2 c2 c3 c2]*4").s("sawtooth").lpf(400).decay(.15).sustain(0)
  .lpq(15).lpenv(4).lpdecay(.15).ftype("ladder").drive(2)
stack(kick, bass)`,
    summary: ['.lpq(…) adds resonance at the cutoff.', '.lpenv and .lpdecay move the cutoff on every note.', '.ftype("ladder") is the steep 303-style filter.'],
    introduces: ['.lpq', '.lpenv', '.lpdecay', '.ftype', '.drive'],
    skills: ['I11', 'I13'],
    preload: kit('bd'),
  },
  {
    id: '20-space',
    number: 20,
    tier: 'intermediate',
    title: 'Space',
    goal: 'Put reverb on the clap and a dub delay on the stab.',
    concept: `**Reverb** simulates a room: \`.room(.3)\` adds some, \`.roomsize(4)\` makes the room bigger. **Delay** repeats a sound: \`.delay(.4)\` sets the level, \`.delaysync(3/16)\` the time in bars (3/16 of a bar is a **dotted 8th**, the classic dub delay), \`.delayfeedback(.5)\` how many repeats (keep it under 1!).

One catch, and it's important: Strudel has **one reverb and one delay per orbit**. An **orbit** is a shared effect bus. Parts on the same orbit share the same reverb and delay settings, so if the clap and the stab both use orbit 1 with different settings, only one setting wins.

The fix: give each part with its own space its own orbit, \`.orbit(2)\`, \`.orbit(3)\`… The panels warn you when two parts collide.`,
    starter: `setcpm(124/4)
${DRUMS}
const stab = note("[~ [c3,eb3,g3,bb3]]*2").s("sawtooth").lpf(1500).decay(.15).sustain(0)
stack(kick, clap, stab)`,
    tasks: [
      {
        text: 'Give the clap some reverb on its own orbit (2).',
        hint: '.room(.3).orbit(2)',
        check: (c) => eventsOf(c, 'cp').every((h) => num(h.value.room, 0) > 0 && num(h.value.orbit, 1) === 2),
      },
      {
        text: 'Give the stab a dotted-8th delay (delaysync 3/16) on a different orbit.',
        hint: '.delay(.4).delaysync(3/16).delayfeedback(.5).orbit(3)',
        check: (c) =>
          c.events().filter(isNote).every((h) => num(h.value.delay, 0) > 0 && Math.abs(num(h.value.delaysync) - 3 / 16) < 1e-6 && num(h.value.orbit, 1) !== 2),
      },
    ],
    challenge: {
      text: 'Make the delay trail on: feedback .6 or more (but below 1).',
      hint: '.delayfeedback(.65)',
      check: (c) => c.events().filter(isNote).every((h) => num(h.value.delayfeedback, 0) >= 0.6 && num(h.value.delayfeedback, 0) < 1),
    },
    steps: [
      `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const clap = s("~ cp ~ cp").bank("RolandTR909").room(.3).orbit(2)
const stab = note("[~ [c3,eb3,g3,bb3]]*2").s("sawtooth").lpf(1500).decay(.15).sustain(0)
stack(kick, clap, stab)`,
    ],
    solution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const clap = s("~ cp ~ cp").bank("RolandTR909").room(.3).orbit(2)
const stab = note("[~ [c3,eb3,g3,bb3]]*2").s("sawtooth").lpf(1500).decay(.15).sustain(0)
  .delay(.4).delaysync(3/16).delayfeedback(.5).orbit(3)
stack(kick, clap, stab)`,
    challengeSolution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const clap = s("~ cp ~ cp").bank("RolandTR909").room(.3).orbit(2)
const stab = note("[~ [c3,eb3,g3,bb3]]*2").s("sawtooth").lpf(1500).decay(.15).sustain(0)
  .delay(.4).delaysync(3/16).delayfeedback(.65).orbit(3)
stack(kick, clap, stab)`,
    summary: ['.room/.roomsize: reverb. .delay/.delaysync/.delayfeedback: echoes.', 'delaysync(3/16) is a dotted-8th dub delay.', 'One reverb and one delay per orbit: give each its own .orbit(n).'],
    introduces: ['.room', '.roomsize', '.delay', '.delaysync', '.delayfeedback', '.orbit'],
    skills: ['I14', 'I15', 'E12'],
    preload: kit('bd', 'cp'),
  },
  {
    id: '21-grit-and-width',
    number: 21,
    tier: 'intermediate',
    title: 'Grit and Width',
    goal: 'Overdrive the bass, crush the drums and spread the hats.',
    concept: `**Distortion** overdrives a sound, adding harmonics and grit: late-80s acid producers ran the 303 through overdriven mixers. \`.distort(…)\` (try 0.5 to 3) does that.

**Bitcrushing** lowers the resolution like an old 12-bit sampler (SP-1200, MPC60): \`.crush(8)\` is crunchy, \`.crush(16)\` nearly clean.

**Panning** places a sound left (0) or right (1); 0.5 is the centre. Keep the kick, bass and clap in the centre. Spread hats and percussion: \`.pan("0 1")\` bounces a part from side to side.`,
    starter: `setcpm(124/4)
${DRUMS}
const hats = s("hh*8").bank("RolandTR909").gain(.5)
const bass = note("[~ c2]*4").s("sawtooth").lpf(600)
stack(kick, clap, hats, bass)`,
    tasks: [
      {
        text: 'Overdrive the bass with .distort(…).',
        hint: '.distort(1.5)',
        check: (c) => c.events().filter(isNote).every((h) => num(h.value.distort, 0) > 0),
      },
      {
        text: 'Make the hats move between left and right.',
        hint: '.pan("0 1") or .pan("[.2 .8]*4")',
        check: (c) => valuesOf(c, 'pan', 1, (h) => sound(h) === 'hh').length >= 2,
      },
    ],
    challenge: {
      text: 'Crush the clap to 8 bits for a 12-bit sampler feel.',
      hint: '.crush(8)',
      check: (c) => eventsOf(c, 'cp').every((h) => num(h.value.crush, 99) <= 8),
    },
    steps: [
      `setcpm(124/4)
${DRUMS}
const hats = s("hh*8").bank("RolandTR909").gain(.5)
const bass = note("[~ c2]*4").s("sawtooth").lpf(600).distort(1.5)
stack(kick, clap, hats, bass)`,
    ],
    solution: `setcpm(124/4)
${DRUMS}
const hats = s("hh*8").bank("RolandTR909").gain(.5).pan("0 1")
const bass = note("[~ c2]*4").s("sawtooth").lpf(600).distort(1.5)
stack(kick, clap, hats, bass)`,
    challengeSolution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const clap = s("~ cp ~ cp").bank("RolandTR909").crush(8)
const hats = s("hh*8").bank("RolandTR909").gain(.5).pan("0 1")
const bass = note("[~ c2]*4").s("sawtooth").lpf(600).distort(1.5)
stack(kick, clap, hats, bass)`,
    summary: ['.distort adds grit; .crush lowers the bit depth.', '.pan places sounds (0 left, 1 right).', 'Keep kick, bass and clap centred.'],
    introduces: ['.distort', '.crush', '.pan'],
    skills: ['I16', 'I17'],
    preload: kit('bd', 'cp', 'hh'),
  },
  {
    id: '22-movement',
    number: 22,
    tier: 'intermediate',
    title: 'Movement',
    goal: 'Make a filter that breathes on its own over 8 bars.',
    concept: `Turning knobs by hand is how acid was made. In code, a **signal** turns the knob for you. Signals are smooth waves that run along with the music: \`sine\`, \`saw\` (rises, then drops), \`tri\`, \`rand\`, \`perlin\` (smooth random).

They go from 0 to 1, so scale them with \`.range(min, max)\`, and slow them down: \`sine.range(300, 2000).slow(8)\` sweeps once every 8 bars. Use one anywhere a number goes: \`.lpf(sine.range(300, 2000).slow(8))\`.

One catch: a signal is read **once per note**. A long held note won't sweep. \`.seg(16)\` chops the part into 16 steps per bar so the filter updates 16 times.`,
    starter: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const bass = note("[c2 c2 c3 c2]*4").s("sawtooth").lpq(10).decay(.15).sustain(0)
stack(kick, bass)`,
    tasks: [
      {
        text: 'Sweep the bass cutoff between 300 and 2000 Hz over 8 bars.',
        hint: '.lpf(sine.range(300, 2000).slow(8))',
        check: (c) => {
          // sine starts mid-way and peaks a quarter of the way through: compare bars 2 and 6.
          const a = numbersInBar(c, 2, 'cutoff', isNote)[0];
          const b = numbersInBar(c, 6, 'cutoff', isNote)[0];
          return a >= 250 && b <= 2050 && Math.abs(a - b) > 500;
        },
      },
      {
        text: 'Add a held pad note and use .seg(16) so its filter moves within the bar too.',
        hint: 'const pad = note("[c3,g3]").s("supersaw").seg(16).lpf(saw.range(400, 3000)).gain(.3)',
        check: (c) => new Set(numbersInBar(c, 0, 'cutoff', (h) => h.value.s === 'supersaw')).size >= 4,
      },
    ],
    challenge: {
      text: 'Use perlin (smooth random) instead of sine for the bass sweep.',
      hint: 'perlin.range(300, 2000).slow(4)',
      check: (c) => uses(c, 'lpf') && /perlin/.test(c.code),
    },
    steps: [
      `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const bass = note("[c2 c2 c3 c2]*4").s("sawtooth").lpq(10).decay(.15).sustain(0)
  .lpf(sine.range(300, 2000).slow(8))
stack(kick, bass)`,
    ],
    solution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const bass = note("[c2 c2 c3 c2]*4").s("sawtooth").lpq(10).decay(.15).sustain(0)
  .lpf(sine.range(300, 2000).slow(8))
const pad = note("[c3,g3]").s("supersaw").seg(16).lpf(saw.range(400, 3000)).gain(.3)
stack(kick, bass, pad)`,
    challengeSolution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const bass = note("[c2 c2 c3 c2]*4").s("sawtooth").lpq(10).decay(.15).sustain(0)
  .lpf(perlin.range(300, 2000).slow(4))
const pad = note("[c3,eb3,g3]").s("supersaw").seg(16).lpf(saw.range(400, 3000)).gain(.3)
stack(kick, bass, pad)`,
    summary: ['Signals (sine, saw, tri, rand, perlin) move values automatically.', '.range(min, max) scales them; .slow(n) stretches them over n bars.', '.seg(n) gives long notes n updates per bar.'],
    introduces: ['sine', 'saw', 'perlin', '.range', '.slow', '.seg'],
    skills: ['I18', 'E2'],
    preload: kit('bd'),
  },
  {
    id: '23-make-a-modifier',
    number: 23,
    tier: 'intermediate',
    title: 'Make a Modifier',
    goal: 'Write a reusable "dub delay" and apply it to two parts.',
    concept: `You've written \`x => x.ply(2)\` already: a small **function** that takes a pattern and returns a changed one. Give it a name and it becomes a **modifier** you can reuse:

\`const dubDelay = x => x.delay(.4).delaysync(3/16).delayfeedback(.55).orbit(3)\`

Then \`dubDelay(stab)\` is the stab with dub delay. Apply it inside a \`stack(…)\` and the original part stays unchanged elsewhere.

Modifiers get their own panel, and groups show which modifiers each member uses. They're saved to the library like parts.`,
    starter: `setcpm(124/4)
${DRUMS}
const stab = note("[~ [c3,eb3,g3,bb3]]*2").s("sawtooth").lpf(1500).decay(.15).sustain(0)
const lead = note("<g4 bb4>").s("square").lpf(2000).decay(.2).sustain(0).struct("~ ~ ~ x")
stack(kick, clap, stab, lead)`,
    tasks: [
      {
        text: 'Write a modifier called dubDelay that adds a dotted-8th delay on orbit 3.',
        hint: 'const dubDelay = x => x.delay(.4).delaysync(3/16).delayfeedback(.55).orbit(3)',
        check: (c) => c.model.blocks.some((b) => b.name === 'dubDelay' && b.kind === 'modifier'),
      },
      {
        text: 'Apply it to both the stab and the lead in the stack.',
        hint: 'stack(kick, clap, dubDelay(stab), dubDelay(lead))',
        check: (c) => {
          const evs = c.events(2).filter(isNote);
          return evs.length > 0 && evs.every((h) => num(h.value.delay, 0) > 0) && /dubDelay\(\s*stab\s*\)/.test(c.code) && /dubDelay\(\s*lead\s*\)/.test(c.code);
        },
      },
    ],
    challenge: {
      text: 'Write a second modifier, dark, that closes the filter to 500 Hz, and apply it to the stab as well.',
      hint: 'const dark = x => x.lpf(500), then dark(dubDelay(stab)).',
      check: (c) => c.model.blocks.some((b) => b.name === 'dark' && b.kind === 'modifier') && c.events().some((h) => num(h.value.cutoff) === 500 && num(h.value.delay, 0) > 0),
    },
    steps: [
      `setcpm(124/4)
${DRUMS}
const stab = note("[~ [c3,eb3,g3,bb3]]*2").s("sawtooth").lpf(1500).decay(.15).sustain(0)
const lead = note("<g4 bb4>").s("square").lpf(2000).decay(.2).sustain(0).struct("~ ~ ~ x")
const dubDelay = x => x.delay(.4).delaysync(3/16).delayfeedback(.55).orbit(3)
stack(kick, clap, stab, lead)`,
    ],
    solution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const clap = s("~ cp ~ cp").bank("RolandTR909")
const stab = note("[~ [c3,eb3,g3,bb3]]*2").s("sawtooth").lpf(1500).decay(.15).sustain(0)
const lead = note("<g4 bb4>").s("square").lpf(2000).decay(.2).sustain(0).struct("~ ~ ~ x")
const dubDelay = x => x.delay(.4).delaysync(3/16).delayfeedback(.55).orbit(3)
stack(kick, clap, dubDelay(stab), dubDelay(lead))`,
    challengeSolution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const clap = s("~ cp ~ cp").bank("RolandTR909")
const stab = note("[~ [c3,eb3,g3,bb3]]*2").s("sawtooth").lpf(1500).decay(.15).sustain(0)
const lead = note("<g4 bb4>").s("square").lpf(2000).decay(.2).sustain(0).struct("~ ~ ~ x")
const dubDelay = x => x.delay(.4).delaysync(3/16).delayfeedback(.55).orbit(3)
const dark = x => x.lpf(500)
stack(kick, clap, dark(dubDelay(stab)), dubDelay(lead))`,
    summary: ['A modifier is a named function: const name = x => x.…', 'name(part) applies it without changing the part itself.', 'Modifiers can be combined: dark(dubDelay(stab)).'],
    introduces: ['modifiers'],
    skills: ['I15', 'E12'],
    composition: true,
    preload: kit('bd', 'cp'),
  },
  {
    id: '24-deep-groove',
    number: 24,
    tier: 'intermediate',
    title: 'Project: Deep Groove',
    goal: 'Build a drum group and a harmonic bed, mixed and saved.',
    concept: `A **group** is a named stack of parts: \`const drums = stack(kick, clap, hats)\`. Groups keep big projects tidy and give you one thing to turn up, mute or move in the arrangement later.

Each group gets a **mixer** in the panel: a fader per member writes \`.postgain(…)\` at that spot in the stack, so the part itself stays untouched (and reusable).

Build a deep house groove: a drum group, a "bed" group with bass and chords in one key, a tempo around 120, and a final \`stack(drums, bed)\`. Balance it so the kick is the loudest thing, then save the parts to your library.`,
    starter: `setcpm(120/4)
const key = "C:minor"

`,
    tasks: [
      {
        text: 'Define kick, clap and hats, and group them: const drums = stack(kick, clap, hats).',
        hint: 'Write the three parts, then the drums group. End with drums to hear it.',
        // Only that the group exists: playing it with the bed is task 3.
        check: (c) =>
          c.model.blocks.some((b) => b.name === 'drums' && (b.kind === 'group' || b.kind === 'section') && ['kick', 'clap', 'hats'].every((n) => b.members.some((m) => m.base === n))),
      },
      {
        text: 'Define a bass and chords that use the key, and group them as bed.',
        hint: 'n("…").scale(key) for the bass; chord("<Cm7 Fm7>").voicing() for chords. Then const bed = stack(bass, chords), and end with bed to hear it on its own.',
        check: (c) => c.model.blocks.some((b) => b.name === 'bed' && b.kind === 'group') && notesIn(c, 2).length > 0 && notesIn(c, 2).every((m) => inKey(m, keyOf(c) ?? 'C:minor')),
      },
      {
        text: 'Play both groups: stack(drums, bed), at 118–124 BPM.',
        hint: 'Last line: stack(drums, bed)',
        check: (c) => c.model.final?.kind === 'stack' && c.bpm !== undefined && c.bpm >= 118 && c.bpm <= 124 && c.events().some(isNote) && playsAt(c, 'bd', BEATS),
      },
    ],
    challenge: {
      text: 'Turn the hats down in the drum group with .postgain (use the mixer fader).',
      hint: 'stack(kick, clap, hats.postgain(.6))',
      check: (c) => /hats\.postgain\(/.test(c.code),
    },
    steps: [
      `setcpm(120/4)
const key = "C:minor"
const kick = s("bd*4").bank("RolandTR909")
const clap = s("~ cp ~ cp").bank("RolandTR909").room(.2).orbit(2)
const hats = s("[~ oh]*4").bank("RolandTR909")
const drums = stack(kick, clap, hats)
drums`,
      `setcpm(120/4)
const key = "C:minor"
const kick = s("bd*4").bank("RolandTR909")
const clap = s("~ cp ~ cp").bank("RolandTR909").room(.2).orbit(2)
const hats = s("[~ oh]*4").bank("RolandTR909")
const bass = n("[~ 0] [~ 0] [~ 2] [~ -3]").scale(key).s("sawtooth").octave(2).lpf(500)
const chords = chord("<Cm7 Fm7>").voicing().struct("[~ x]*2").s("sawtooth").lpf(1400).decay(.2).sustain(0)
const drums = stack(kick, clap, hats)
const bed = stack(bass, chords)
bed`,
    ],
    solution: `setcpm(120/4)
const key = "C:minor"
const kick = s("bd*4").bank("RolandTR909")
const clap = s("~ cp ~ cp").bank("RolandTR909").room(.2).orbit(2)
const hats = s("[~ oh]*4").bank("RolandTR909")
const bass = n("[~ 0] [~ 0] [~ 2] [~ -3]").scale(key).s("sawtooth").octave(2).lpf(500)
const chords = chord("<Cm7 Fm7>").voicing().struct("[~ x]*2").s("sawtooth").lpf(1400).decay(.2).sustain(0)
const drums = stack(kick, clap, hats)
const bed = stack(bass, chords)
stack(drums, bed)`,
    challengeSolution: `setcpm(120/4)
const key = "C:minor"
const kick = s("bd*4").bank("RolandTR909")
const clap = s("~ cp ~ cp").bank("RolandTR909").room(.2).orbit(2)
const hats = s("[~ oh]*4").bank("RolandTR909")
const bass = n("[~ 0] [~ 0] [~ 2] [~ -3]").scale(key).s("sawtooth").octave(2).lpf(500)
const chords = chord("<Cm7 Fm7>").voicing().struct("[~ x]*2").s("sawtooth").lpf(1400).decay(.2).sustain(0)
const drums = stack(kick, clap, hats.postgain(.6))
const bed = stack(bass, chords)
stack(drums, bed)`,
    summary: ['A group is a named stack of parts.', 'Mixer faders write .postgain at the use site.', 'Keep the kick loudest; keep parts in one key.'],
    introduces: ['groups', '.postgain'],
    skills: ['E10', 'I8'],
    composition: true,
    preload: kit('bd', 'cp', 'oh'),
  },
];

void sound;
void begin;
