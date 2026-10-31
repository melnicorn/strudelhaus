import { allHave, defines, eventsOf, includesTimes, playsAt, sound, times, uses, valuesOf } from '@/lib/lessons/checks';
import type { Lesson } from '@/lib/lessons/types';

const TR909 = 'RolandTR909';
const kit = (...s: string[]) => s.map((x) => ({ s: x, bank: TR909 }));
const OFFBEATS = [0.125, 0.375, 0.625, 0.875];
const BEATS = [0, 0.25, 0.5, 0.75];

export const beginner: Lesson[] = [
  {
    id: '01-press-play',
    number: 1,
    tier: 'beginner',
    title: 'Press Play',
    goal: 'Make a kick drum play, and learn what a cycle is.',
    concept: `Strudel turns **code into a loop**. The loop is called a **cycle**, and Strudel plays it over and over.

\`s("bd")\` means "play the sound called **bd**" (bass drum, the kick) once per cycle. In this workshop one cycle is one **bar** of music: four beats, the length of counting "1 2 3 4".

Press **▶ Play** (or Ctrl/Cmd+Enter in the editor); the same key pauses. Change the code and press **⟳ Update** (Shift+Ctrl/Cmd+Enter): the music updates without stopping. **■ Stop** (or Ctrl/Cmd+.) stops it and goes back to bar 1.`,
    starter: `s("bd")`,
    tasks: [
      {
        text: 'Press Play and listen to the kick once per bar.',
        hint: 'Click ▶ Play above the code, or put the cursor in the code and press Ctrl+Enter (Cmd+Enter on a Mac).',
        check: (c) => eventsOf(c, 'bd').length === 1,
        replacedLater: true,
      },
      {
        text: 'Change bd to sd (a snare drum) and run it again.',
        hint: 'Edit the text inside the quotes so it reads s("sd"), then press Update (or Play if it is stopped).',
        check: (c) => eventsOf(c, 'sd').length >= 1,
      },
    ],
    challenge: {
      text: 'Make it play a hand clap. Its name is cp.',
      hint: 'Sound names are short: bd, sd, cp, hh, oh…',
      check: (c) => eventsOf(c, 'cp').length >= 1,
    },
    solution: `s("sd")`,
    challengeSolution: `s("cp")`,
    summary: ['Strudel plays your code as a repeating loop called a cycle.', 'One cycle is one bar of four beats in this workshop.', 's("…") plays a sound by its name.'],
    introduces: ['s', 'Play / Stop', 'Ctrl+Enter'],
    skills: ['B2', 'B5', 'B13'],
    preload: [{ s: 'bd' }, { s: 'sd' }, { s: 'cp' }],
  },
  {
    id: '02-four-on-the-floor',
    number: 2,
    tier: 'beginner',
    title: 'Four on the Floor',
    goal: 'Make a 909 kick play on every beat at 124 BPM.',
    concept: `Everything inside the quotes is **squeezed into one cycle**. \`"bd bd bd bd"\` is four steps, so you get four evenly spaced kicks per bar: one on every beat. That steady thump is **four on the floor**, the heartbeat of house and techno.

\`*4\` is a shortcut for "repeat this 4 times inside its step", so \`"bd*4"\` sounds the same as \`"bd bd bd bd"\`.

\`setcpm(124/4)\` sets the tempo. **BPM** means beats per minute. Strudel counts **cycles per minute**, and our cycle holds 4 beats, so 124 BPM is \`124/4\` cycles per minute. Most house music sits between 118 and 128 BPM.

\`.bank("RolandTR909")\` picks which drum machine plays the sound. The Roland TR-909 is *the* 90s house drum machine.`,
    starter: `setcpm(124/4)
s("bd")`,
    tasks: [
      {
        text: 'Make the kick play 4 times per bar.',
        hint: 'Write four bd steps inside the quotes, or use *4.',
        check: (c) => playsAt(c, 'bd', BEATS),
      },
      {
        text: 'Make it a TR-909 kick with .bank("RolandTR909").',
        hint: 'Add .bank("RolandTR909") straight after the closing ) of s(…). The drum machine control in the panel writes the same code.',
        check: (c) => allHave(c, 'bd', 'bank', TR909),
      },
    ],
    challenge: {
      text: 'Write the same four kicks a different way that sounds identical.',
      hint: 'Try "bd bd bd bd" if you used *4, or "bd!4" (! repeats a step without squeezing it).',
      check: (c) => playsAt(c, 'bd', BEATS) && !/"bd\*4"/.test(c.code),
    },
    solution: `setcpm(124/4)
s("bd*4").bank("RolandTR909")`,
    challengeSolution: `setcpm(124/4)
s("bd bd bd bd").bank("RolandTR909")`,
    summary: ['Steps inside the quotes share one bar equally.', '*n repeats a step n times inside its own slot.', 'setcpm(BPM/4) sets the tempo for 4 beats per bar.', '.bank(…) chooses the drum machine.'],
    introduces: ['setcpm', '*', '.bank'],
    skills: ['B1', 'B4', 'B8'],
    preload: kit('bd'),
  },
  {
    id: '03-steps-and-rests',
    number: 3,
    tier: 'beginner',
    title: 'Steps and Rests',
    goal: 'Put a clap on beats 2 and 4.',
    concept: `A **rest** is a step where nothing plays. In Strudel a rest is \`~\` (a dash \`-\` works too).

\`"~ cp ~ cp"\` is four steps: silence, clap, silence, clap. That puts the clap on **beats 2 and 4**, the **backbeat**, which is where almost every house track claps.

Square brackets **subdivide** one step: \`"~ cp ~ [cp cp]"\` squeezes two claps into the last beat. Brackets can hold any number of steps, and they can nest.

Try the step grid in the panel: each click writes a new pattern string, highlighted in the code.`,
    starter: `setcpm(124/4)
s("~ ~ ~ ~").bank("RolandTR909")`,
    tasks: [
      {
        text: 'Make a clap play on beats 2 and 4.',
        hint: 'Four steps: rest, clap, rest, clap.',
        check: (c) => playsAt(c, 'cp', [0.25, 0.75]),
        replacedLater: true,
      },
      {
        text: 'Use [ ] to add a quick second clap at the end of beat 4.',
        hint: 'Replace the last cp with [cp cp].',
        check: (c) => includesTimes(c, 'cp', [0.25, 0.75, 0.875]),
      },
    ],
    challenge: {
      text: 'Write the plain clap-on-2-and-4 pattern as one half-bar, repeated twice with *.',
      hint: '"[~ cp]" is half a bar. Repeat it twice.',
      check: (c) => playsAt(c, 'cp', [0.25, 0.75]) && /\[\s*~\s+cp\s*\]\s*\*\s*2/.test(c.code),
    },
    solution: `setcpm(124/4)
s("~ cp ~ [cp cp]").bank("RolandTR909")`,
    challengeSolution: `setcpm(124/4)
s("[~ cp]*2").bank("RolandTR909")`,
    summary: ['~ is a rest.', 'Beats 2 and 4 are the backbeat.', '[ ] squeezes several steps into one.'],
    introduces: ['~', '[ ]'],
    skills: ['B3', 'B5', 'B7'],
    preload: kit('cp'),
  },
  {
    id: '04-stacking-parts',
    number: 4,
    tier: 'beginner',
    title: 'Stacking Parts',
    goal: 'Play the kick and the clap together, each with its own name.',
    concept: `Real tracks are **layers**: kick, clap, hats and bass all playing at once. In Strudel, \`stack(a, b, …)\` plays patterns at the same time.

To keep things readable, give each part a name with \`const\`:

\`const kick = s("bd*4")\`

\`const\` is plain JavaScript for "this name means this value". Then the last line says what to play: \`stack(kick, clap)\`.

From now on every part gets its own panel on the right, and the panel's name matches the \`const\` name.`,
    starter: `setcpm(124/4)
s("bd*4").bank("RolandTR909")`,
    tasks: [
      {
        text: 'Name the kick: put const kick = in front of it, and add a last line that just says kick.',
        hint: 'Line 2 becomes: const kick = s("bd*4").bank("RolandTR909"). Then a new line: kick',
        check: (c) => defines(c, 'kick') && eventsOf(c, 'bd').length === 4,
      },
      {
        text: 'Add const clap = … with a clap on 2 and 4, and play both with stack(kick, clap).',
        hint: 'const clap = s("~ cp ~ cp").bank("RolandTR909"), and change the last line to stack(kick, clap).',
        check: (c) => defines(c, 'clap') && uses(c, 'stack') && playsAt(c, 'bd', BEATS) && playsAt(c, 'cp', [0.25, 0.75]),
      },
    ],
    challenge: {
      text: 'Add a third part called snare that plays sd on the last 16th of the bar.',
      hint: 'A bar has 16 sixteenths: "~ ~ ~ [~ ~ ~ sd]" puts sd on the last one.',
      check: (c) => defines(c, 'snare') && includesTimes(c, 'sd', [15 / 16]),
    },
    solution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const clap = s("~ cp ~ cp").bank("RolandTR909")
stack(kick, clap)`,
    challengeSolution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const clap = s("~ cp ~ cp").bank("RolandTR909")
const snare = s("~ ~ ~ [~ ~ ~ sd]").bank("RolandTR909")
stack(kick, clap, snare)`,
    summary: ['const name = … gives a part a name.', 'stack(…) plays parts at the same time.', 'The last line of the code is what plays.'],
    introduces: ['const', 'stack'],
    skills: ['B9'],
    preload: kit('bd', 'cp', 'sd'),
  },
  {
    id: '05-offbeat-hat',
    number: 5,
    tier: 'beginner',
    title: 'The Offbeat Hat',
    goal: 'Add an open hi-hat on every "and" between the beats.',
    concept: `Count "**1** and **2** and **3** and **4** and". The beats are the numbers; the **offbeats** are the "and"s, exactly halfway between.

An **open hi-hat** (\`oh\`) on every offbeat is the classic house "tss" that pushes the groove forward. Against a four-on-the-floor kick it gives the famous *boom-tss boom-tss*.

\`"[~ oh]"\` is one beat split in half: rest, then hat. Repeat it with \`*4\` to fill the bar.`,
    starter: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const clap = s("~ cp ~ cp").bank("RolandTR909")
stack(kick, clap)`,
    tasks: [
      {
        text: 'Add const hats = … with an open hat (oh) on every offbeat, and add it to the stack.',
        hint: 'const hats = s("[~ oh]*4").bank("RolandTR909"), then stack(kick, clap, hats).',
        check: (c) => playsAt(c, 'oh', OFFBEATS) && playsAt(c, 'bd', BEATS),
      },
      {
        text: 'The hats are loud. Turn them down with .gain(.6).',
        hint: 'Add .gain(.6) at the end of the hats line. The gain control in the panel writes it for you.',
        check: (c) => eventsOf(c, 'oh').every((h) => Number(h.value.gain) < 0.8),
      },
    ],
    challenge: {
      text: 'Add a closed hat (hh) on every beat, quieter than the open hat.',
      hint: 'Another part: s("hh*4").gain(.3). Remember to stack it.',
      check: (c) => playsAt(c, 'hh', BEATS) && eventsOf(c, 'hh').every((h) => Number(h.value.gain ?? 0.8) < Number(eventsOf(c, 'oh')[0]?.value.gain ?? 0.8)),
    },
    solution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const clap = s("~ cp ~ cp").bank("RolandTR909")
const hats = s("[~ oh]*4").bank("RolandTR909").gain(.6)
stack(kick, clap, hats)`,
    challengeSolution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const clap = s("~ cp ~ cp").bank("RolandTR909")
const hats = s("[~ oh]*4").bank("RolandTR909").gain(.6)
const closed = s("hh*4").bank("RolandTR909").gain(.3)
stack(kick, clap, hats, closed)`,
    summary: ['Offbeats are halfway between the beats.', 'oh is an open hi-hat; hh a closed one.', '.gain(…) sets how loud a part is (about 0 to 1).'],
    introduces: ['.gain', 'oh', 'hh'],
    skills: ['B6', 'B10'],
    preload: kit('bd', 'cp', 'oh', 'hh'),
  },
  {
    id: '06-sixteenths-and-dynamics',
    number: 6,
    tier: 'beginner',
    title: 'Sixteenths and Dynamics',
    goal: 'Play closed hats on every 16th note, with accents.',
    concept: `Split each beat into four and you get **16th notes**: 16 per bar. Fast closed hats on 16ths add energy, especially in techno.

A row of identical hits sounds robotic. Drummers vary how hard they hit: that's **dynamics** (or velocity). In Strudel you can give \`.gain\` a **pattern** instead of one number:

\`.gain("[.8 .3 .5 .3]*4")\`

Each beat gets a loud first 16th, quieter middle ones. Any control can take a pattern in quotes like this, and it lines up with the notes step by step.`,
    starter: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const hats = s("hh").bank("RolandTR909")
stack(kick, hats)`,
    tasks: [
      {
        text: 'Make the closed hats play on all 16 sixteenths.',
        hint: 'hh*16',
        check: (c) => playsAt(c, 'hh', Array.from({ length: 16 }, (_, i) => i / 16)),
      },
      {
        text: 'Give the hats a gain pattern so the hit on each beat is louder than the next 16th.',
        hint: '.gain("[.8 .3 .5 .3]*4"): the first value of each group lands on the beat.',
        check: (c) => {
          const hh = eventsOf(c, 'hh');
          const g = (t: number) => Number(hh.find((h) => Math.abs(h.whole!.begin.valueOf() - t) < 1e-6)?.value.gain ?? 0.8);
          return hh.length === 16 && BEATS.every((b) => g(b) > g(b + 1 / 16));
        },
      },
    ],
    challenge: {
      text: 'Leave a gap: make the hats rest on the very last 16th of the bar.',
      hint: 'Write the bar as four beat groups and leave the last step empty: "[hh*4]!3 [hh hh hh ~]". (!3 repeats the group as three steps; *3 would squeeze all three into one.)',
      check: (c) => times(c, (h) => sound(h) === 'hh').length === 15 && playsAt(c, 'hh', Array.from({ length: 15 }, (_, i) => i / 16)),
    },
    solution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const hats = s("hh*16").bank("RolandTR909").gain("[.8 .3 .5 .3]*4")
stack(kick, hats)`,
    challengeSolution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const hats = s("[hh*4]!3 [hh hh hh ~]").bank("RolandTR909")
stack(kick, hats)`,
    summary: ['16th notes: four per beat, sixteen per bar.', 'Dynamics: louder and quieter hits make a groove feel played.', 'Controls accept patterns: .gain("…") changes per step.'],
    introduces: ['*16', 'patterned .gain'],
    skills: ['B3', 'B10', 'I4'],
    preload: kit('bd', 'hh'),
  },
  {
    id: '07-drum-machine-shopping',
    number: 7,
    tier: 'beginner',
    title: 'Drum Machine Shopping',
    goal: 'Hear the 808, 909 and 707, and switch machines every bar.',
    concept: `Each drum machine has its own character. The **TR-808** has a long, booming kick. The **TR-909** punches harder and has bright sampled hats: the house sound. The **TR-707** is lighter and more "plastic", common on early Chicago house records.

Swap the bank and listen. The drum names stay the same (\`bd\`, \`cp\`, \`oh\`…), which is why the same pattern works on every machine. (Not every machine has every sound: the 606 has no clap.)

Angle brackets \`< >\` choose **one item per cycle**: \`"<RolandTR909 RolandTR808>"\` uses the 909 in bar 1, the 808 in bar 2, then repeats. Machines often have several versions of a sound too: \`"bd:1"\` or \`.n(1)\` picks the second one.`,
    starter: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const clap = s("~ cp ~ cp").bank("RolandTR909")
stack(kick, clap)`,
    tasks: [
      {
        text: 'Change both parts to the TR-808 (RolandTR808).',
        hint: 'Change the bank text on both lines. The drum machine menu in each panel does it too.',
        check: (c) => allHave(c, 'bd', 'bank', 'RolandTR808') && allHave(c, 'cp', 'bank', 'RolandTR808'),
        replacedLater: true,
      },
      {
        text: 'Make the kick switch machine every bar: 909, then 808.',
        hint: '.bank("<RolandTR909 RolandTR808>")',
        check: (c) => {
          const banks = [0, 1].map((cy) => String(c.pattern.queryArc(cy, cy + 1).find((h) => sound(h) === 'bd')?.value.bank ?? '').toLowerCase());
          return banks[0] !== banks[1] && banks.includes('rolandtr909') && banks.includes('rolandtr808');
        },
      },
    ],
    challenge: {
      text: 'Try the TR-707 clap, and pick its second clap sound with :1.',
      hint: 's("~ cp:1 ~ cp:1").bank("RolandTR707")',
      check: (c) => eventsOf(c, 'cp').some((h) => String(h.value.bank).toLowerCase() === 'rolandtr707' && Number(h.value.n) === 1),
    },
    solution: `setcpm(124/4)
const kick = s("bd*4").bank("<RolandTR909 RolandTR808>")
const clap = s("~ cp ~ cp").bank("RolandTR808")
stack(kick, clap)`,
    challengeSolution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const clap = s("~ cp:1 ~ cp:1").bank("RolandTR707")
stack(kick, clap)`,
    summary: ['Banks: RolandTR909, RolandTR808, RolandTR707, RolandTR606…', '< > picks one item per bar.', ':n or .n(n) chooses a variation of a sound.'],
    introduces: ['< >', ':', '.n'],
    skills: ['B8', 'I20'],
    preload: [...kit('bd', 'cp'), { s: 'bd', bank: 'RolandTR808' }, { s: 'cp', bank: 'RolandTR808' }],
  },
  {
    id: '08-first-bassline',
    number: 8,
    tier: 'beginner',
    title: 'Your First Bassline',
    goal: 'Play a sawtooth bass on the offbeats, in C.',
    concept: `Drums are sounds; a bassline is **notes**. \`note("c2")\` plays the note C. The number is the **octave**: \`c2\` is low, \`c3\` is the same note one octave higher. Bass lives around octaves 1 and 2.

So far we've played **samples** (recordings of drum machines). A bass usually comes from a **synthesizer**, which makes sound electronically. \`.s("sawtooth")\` uses a sawtooth wave: bright and buzzy, the raw material of house bass and acid.

Putting the bass on the **offbeats** (\`"[~ c2]*4"\`) keeps it out of the kick's way. That bouncing kick–bass, kick–bass is pure house.`,
    starter: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const bass = note("c2").s("sawtooth")
stack(kick, bass)`,
    tasks: [
      {
        text: 'Move the bass to the offbeats: four notes per bar, between the kicks.',
        hint: 'note("[~ c2]*4")',
        check: (c) => sameTimes(times(c, (h) => h.value.note !== undefined), OFFBEATS),
      },
      {
        text: 'Change the last bass note of the bar to eb2 (E flat).',
        hint: 'Write the four beats out: note("[~ c2] [~ c2] [~ c2] [~ eb2]")',
        check: (c) => valuesOf(c, 'note', 1, (h) => h.value.note !== undefined).map(String).map((s) => s.toLowerCase()).includes('eb2'),
      },
    ],
    challenge: {
      text: 'Jump the second note up an octave (c3) for a bouncier line.',
      hint: '"[~ c2] [~ c3] [~ c2] [~ eb2]"',
      check: (c) => valuesOf(c, 'note', 1, (h) => h.value.note !== undefined).map(String).map((s) => s.toLowerCase()).includes('c3'),
    },
    solution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const bass = note("[~ c2] [~ c3] [~ c2] [~ eb2]").s("sawtooth")
stack(kick, bass)`,
    summary: ['note("c2") plays a pitch; the number is the octave.', 'Samples are recordings; synths generate sound.', 's("sawtooth") is a bright, buzzy synth wave.', 'Offbeat bass leaves room for the kick.'],
    introduces: ['note', '.s("sawtooth")', 'octaves'],
    skills: ['B11', 'B12', 'B13'],
    preload: kit('bd'),
  },
  {
    id: '09-dark-and-bright',
    number: 9,
    tier: 'beginner',
    title: 'Dark and Bright',
    goal: 'Tame the bass with a low-pass filter.',
    concept: `A raw sawtooth is harsh. A **filter** removes part of a sound. A **low-pass** filter lets the lows pass and cuts the highs above its **cutoff** frequency.

\`.lpf(400)\` sets the cutoff to 400 Hz (Hertz, vibrations per second). Lower numbers sound darker and more muffled; higher numbers sound brighter. Human hearing goes up to about 18,000 Hz.

Turning the filter cutoff is the most important "knob" in acid house and techno. Drag the **low-pass cutoff** slider in the bass panel while it plays: each time you let go, the number in the code changes.`,
    starter: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const bass = note("[~ c2] [~ c3] [~ c2] [~ eb2]").s("sawtooth")
stack(kick, bass)`,
    tasks: [
      {
        text: 'Add a low-pass filter to the bass with a cutoff of 600 Hz or lower.',
        hint: 'Add .lpf(400) to the end of the bass line, or use "+ Add control" in the bass panel.',
        check: (c) => {
          const cut = c.events().filter((h) => h.value.note !== undefined).map((h) => Number(h.value.cutoff));
          return cut.length > 0 && cut.every((x) => x > 0 && x <= 600);
        },
        replacedLater: true,
      },
      {
        text: 'Make the filter alternate: dark in bar 1, bright in bar 2.',
        hint: '.lpf("<300 2000>")',
        check: (c) => {
          const cut = (cy: number) => Number(c.pattern.queryArc(cy, cy + 1).find((h) => h.value.note !== undefined)?.value.cutoff);
          return cut(0) > 0 && cut(1) > 0 && Math.max(cut(0), cut(1)) >= 3 * Math.min(cut(0), cut(1));
        },
      },
    ],
    challenge: {
      text: 'Give every note its own cutoff with a pattern of four values.',
      hint: '.lpf("300 600 900 1500"): one value per beat.',
      check: (c) => valuesOf(c, 'cutoff', 1, (h) => h.value.note !== undefined).length >= 3,
    },
    solution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const bass = note("[~ c2] [~ c3] [~ c2] [~ eb2]").s("sawtooth").lpf("<300 2000>")
stack(kick, bass)`,
    challengeSolution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const bass = note("[~ c2] [~ c3] [~ c2] [~ eb2]").s("sawtooth").lpf("300 600 900 1500")
stack(kick, bass)`,
    summary: ['A low-pass filter keeps the lows and cuts the highs.', 'The cutoff (in Hz) sets where: lower is darker.', '.lpf(…) can take a pattern like any control.'],
    introduces: ['.lpf'],
    skills: ['B14'],
    preload: kit('bd'),
  },
  {
    id: '10-warehouse-loop',
    number: 10,
    tier: 'beginner',
    title: 'Project: Warehouse Loop',
    goal: 'Build a complete four-part house loop and save it to your library.',
    concept: `Time to put it all together, from memory where you can. A classic house loop has four parts:

- **kick**: four on the floor
- **clap**: on 2 and 4
- **hats**: open hat on the offbeats (closed 16ths optional)
- **bass**: offbeat notes, filtered

Write each as a named \`const\`, stack them, and set the tempo between 118 and 128 BPM. When it grooves, use **Save parts to library** below the lesson so you can reuse them later.`,
    starter: `// Your warehouse loop. Tempo first:
setcpm(124/4)

`,
    tasks: [
      {
        text: 'Set a house tempo between 118 and 128 BPM.',
        hint: 'setcpm(124/4)',
        check: (c) => c.bpm !== undefined && c.bpm >= 118 && c.bpm <= 128,
      },
      {
        text: 'Define kick, clap, hats and bass as named parts.',
        hint: 'Four const lines, one per part.',
        check: (c) => ['kick', 'clap', 'hats', 'bass'].every((n) => defines(c, n)),
      },
      {
        text: 'Stack them so the groove plays: kick on every beat, clap on 2 and 4, hats on the offbeats, bass notes too.',
        hint: 'Last line: stack(kick, clap, hats, bass)',
        check: (c) =>
          playsAt(c, 'bd', BEATS) && playsAt(c, 'cp', [0.25, 0.75]) && includesTimes(c, 'oh', OFFBEATS) && c.events().some((h) => h.value.note !== undefined),
      },
    ],
    challenge: {
      text: 'Make the bass change in the second bar using < >.',
      hint: 'note("<[~ c2]*4 [~ eb2]*4>")',
      check: (c) => {
        const notes = (cy: number) => c.pattern.queryArc(cy, cy + 1).filter((h) => h.value.note !== undefined && h.hasOnset()).map((h) => String(h.value.note)).join(' ');
        return notes(0) !== notes(1);
      },
    },
    solution: `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const clap = s("~ cp ~ cp").bank("RolandTR909")
const hats = s("[~ oh]*4").bank("RolandTR909").gain(.6)
const bass = note("<[~ c2]*4 [~ eb2]*4>").s("sawtooth").lpf(500)
stack(kick, clap, hats, bass)`,
    summary: ['You can build a complete house groove from scratch.', 'Named parts can be saved and reused from the library.'],
    introduces: ['library'],
    skills: ['B1', 'B4', 'B5', 'B6', 'B9', 'B12', 'B14'],
    preload: kit('bd', 'cp', 'oh'),
  },
];

function sameTimes(a: number[], b: number[]) {
  return a.length === b.length && a.every((x, i) => Math.abs(x - b[i]) < 1e-6);
}
