# Strudel Workshop — Phase 1 Research

_Compiled 2026-10-31. Strudel facts were checked against the Codeberg `main` source (codeberg.org/uzu/strudel), the live strudel.cc docs, and the published npm tarballs. The parser, the transpiler, and server-side imports were exercised in Node. Music facts are cited to Sound On Sound, Attack Magazine, Roland, Ableton Learning Music, iZotope, Native Instruments, and others._

**Confidence markers**
- **[UNVERIFIED]**: plausible, but not confirmed in the source or docs. Must be prototyped before we rely on it.
- **[search summary]**: the source page could not be fetched directly; the claim comes from a search-engine summary of it.
- **[derived]**: my own inference from verified facts, not a quoted claim.

Contents
1. [Tiered skill map (1a)](#1-tiered-skill-map-1a)
2. [90s house/techno specifics (1b)](#2-90s-housetechno-specifics-1b)
3. [Strudel capabilities mapped to skills (1c)](#3-strudel-capabilities-mapped-to-skills-1c)
4. [Gaps: what Strudel can't do (well)](#4-gaps-what-strudel-cant-do-well)
5. [Technical integration (1d)](#5-technical-integration-1d)
6. [Recommendations going into Phase 2](#6-recommendations-going-into-phase-2)
7. [Sources](#7-sources)

---

## 1. Tiered skill map (1a)

Each skill has an ID so later documents can refer to it. The **Strudel** column points to §3.

### Beginner: make a loop that grooves

| ID | Skill | Plain-English explanation | Prereqs | Why it matters in house/techno | Strudel |
|---|---|---|---|---|---|
| B1 | Tempo / BPM | How fast the music goes, counted in beats per minute. House runs about 118–128 BPM; techno about 120–140. | none | Tempo is the most basic genre marker, and DJs need a steady one to mix. | `setcpm(bpm/4)` §3.10 |
| B2 | Beats & bars | A beat is one pulse you'd tap your foot to. A bar is a group of 4 beats. Songs are built from bars. | B1 | Everything in house is counted in bars: "the bass comes in after 8 bars". | 1 cycle = 1 bar (convention) |
| B3 | Subdivisions & the step grid | Splitting a beat into smaller equal pieces: 2 = 8th notes, 4 = 16th notes. A 16-step grid is one bar of 16ths. | B2 | Hats and percussion live on 8ths and 16ths. Drum machines like the 909 are 16-step grids. | mini-notation `[ ]`, `*` |
| B4 | Four-on-the-floor | A kick drum on every beat of every bar. | B2 | The defining heartbeat of house and techno. | `s("bd*4")` |
| B5 | Kick, clap/snare, hats | The core drum kit: kick (low thump), clap or snare (crack on beats 2 and 4, the "backbeat"), closed hat (short tick), open hat (longer "tss"). | B4 | Kick + clap on 2 & 4 + offbeat open hat is the classic house groove. | `bd sd cp hh oh` |
| B6 | Offbeats | The halfway point between beats (the "and" in "1 and 2 and"). | B3 | An offbeat open hat gives house its forward "push". | `"~ oh"` |
| B7 | Rests | Silence in a slot. Leaving gaps is as important as placing notes. | B3 | Space keeps grooves tight and stops the mix from getting cluttered. | `~` or `-` |
| B8 | Drum machine character | Each machine (808, 909, 707…) has its own sound. Picking one sets the era. | B5 | A 909 kick and 909 hats immediately read as 90s house and techno. | `.bank("RolandTR909")` |
| B9 | Layering parts | Playing several patterns at once to make a groove. | B5 | Every track is layers. | `stack()`, `$:` blocks |
| B10 | Volume (gain) & velocity | How loud a part is, and how hard each individual hit is. | B5 | Hat dynamics make a beat feel human. Balancing levels keeps the kick on top. | `.gain()`, `.velocity()` |
| B11 | Notes & octaves | Pitches have letter names (C, D, E…). The same letter 12 semitones higher is an octave, and sounds "the same, but higher". | none | Needed for any bass, chord, or melody. | `note("c2 eb2")` |
| B12 | Simple bassline | A low, repeating, pitched line that locks with the kick. | B4, B11 | Bass plus kick is the engine of a house track. | `note(...).s("sawtooth")` |
| B13 | Samples vs synths | A sample plays back a recording. A synth generates sound electronically from a waveform. | none | 90s tracks mix both: sampled drums and pianos, synthesized basslines. | `s("bd")` vs `s("sawtooth")` |
| B14 | Low-pass filter & cutoff | A filter removes frequencies. A low-pass keeps the lows and cuts the highs above the **cutoff**, so a lower cutoff sounds darker and more muffled. | B13 | The filter is the most important hands-on control in acid house and techno. | `.lpf(hz)` |

### Intermediate: sound design, harmony, and variation

| ID | Skill | Plain-English explanation | Prereqs | Why it matters | Strudel |
|---|---|---|---|---|---|
| I1 | Swing / groove | Pushing every second 16th slightly late. 50% is straight; 54–60% is a loose house shuffle. | B3 | The MPC/909 shuffle is what makes Chicago house bounce. | `.swingBy(x, n)` §3.7 |
| I2 | Syncopation | Accents in unexpected places: offbeats, or resting on a strong beat. | B6 | Syncopated percussion and bass give a groove its tension. | `"~ x ~ [~ x]"`, Euclid |
| I3 | Euclidean & polyrhythms | Spreading N hits as evenly as possible over M steps. Patterns of different lengths drifting against each other. | I2 | A quick route to percussion that sounds African or Latin, and to rolling techno. | `"bd(3,8)"`, `{ }%16` |
| I4 | Ghost notes & dynamics | Quiet in-between hits and per-step volume accents. | B10 | They add groove and life to hats and percussion. | patterned `.gain("…")` |
| I5 | Scales & keys | The set of notes that "belong" together, with one home note. Minor keys dominate techno. | B11 | Keeps the bass, chords, and riffs from clashing. | `n("0 2 4").scale("C:minor")` |
| I6 | Chords | Three or more notes at once. A minor 7th (e.g. C–E♭–G–B♭) is the classic house and Detroit chord. | I5 | Chord stabs, organ, and pads are the emotional core of house. | `chord("Cm7").voicing()`, `"c3,eb3,g3,bb3"` |
| I7 | Chord progressions | A repeating sequence of chords, often 2 or 4 chords over 4 or 8 bars. | I6 | Gives a track movement and mood. | `chord("<Cm7 Fm7>")` |
| I8 | Bass vs kick | Kick and bass both live in the lowest frequencies and mask each other. Place bass notes in the gaps between kicks, or duck the bass when the kick hits (sidechain). | B12 | Avoids a muddy, boomy low end. The offbeat bass is a house staple. | rhythm placement; `duckorbit` |
| I9 | Oscillator waveforms | Sine (pure), triangle (soft), square (hollow), sawtooth (bright, buzzy). | B13 | A saw or square through a resonant filter is the 303. Sine is a clean sub bass. | `s("sawtooth")` etc. |
| I10 | Envelopes (ADSR) | How a sound's volume changes over time: Attack (fade in), Decay (drop), Sustain (held level), Release (fade out). | I9 | Short "plucky" basses and stabs come from fast decay with low sustain. | `.attack .decay .sustain .release`, `.adsr("a:d:s:r")` |
| I11 | Resonance | A boost at the cutoff frequency that makes the filter "squelch" or whistle. | B14 | The acid sound is high resonance plus a moving cutoff. | `.lpq(0–50)` |
| I12 | High-pass & band-pass | High-pass removes lows (thins a sound out). Band-pass keeps a middle band. | B14 | High-passing pads and hats clears space for the kick and bass. High-pass sweeps are used in builds. | `.hpf`, `.bpf` |
| I13 | Filter envelope | An envelope that moves the cutoff on each note. | I10, I11 | The "wow" on each 303 note. | `.lpenv() .lpattack() .lpdecay()…` |
| I14 | Reverb | A simulated room tail. More = further away, bigger. | B9 | Space on claps and stabs. Dub techno lives on it. | `.room() .roomsize()` |
| I15 | Delay / echo | Repeats of a sound, often synced to the tempo (dotted 8ths are classic). | B9 | Dub stabs and acid-line depth. | `.delay() .delaytime() .delayfeedback()` |
| I16 | Distortion / saturation | Overdriving a sound to add harmonics and grit. | I9 | Overdriven 303s, crunchy 12-bit drums. | `.distort()`, `.crush()`, `.ftype("ladder").drive()` |
| I17 | Panning | Placing a sound left or right. | B9 | Width for percussion. Keep the kick, bass, and clap centred. | `.pan(0–1)` |
| I18 | LFO / modulation | A slow, repeating wave that moves a setting automatically, e.g. a cutoff that rises and falls. | B14 | Gives evolving, hypnotic movement to techno loops. | signals `sine.range()`, `.lfo({...})` |
| I19 | Pattern variation | Changing a loop every N bars (a fill, a dropped hit) so it doesn't feel static. | B9 | Fills mark phrase boundaries. Variation keeps repetition interesting. | `.lastOf(4, f)`, `.sometimesBy`, `<…>` |
| I20 | Sound selection & tuning | Choosing samples and tuning kicks or basses to the key. | B8, I5 | A tuned kick avoids clashing with the bass. | `.n()`, `.speed()`, `.note()` on samples |

### Expert: arrangement, the acid voice, and mixing

| ID | Skill | Plain-English explanation | Prereqs | Why it matters | Strudel |
|---|---|---|---|---|---|
| E1 | 303 acid line programming | A 16-step monosynth line with **accents** (louder, brighter, snappier notes) and **slides** (pitch glides into the next note). | I9–I13 | The core of acid house. | Approximated; see §4 gap G1/G2 |
| E2 | Filter sweeps / automation over time | Moving cutoff or resonance over many bars, by hand or on a schedule. | I18 | The main tension tool in acid and techno. | slow signals (`saw.slow(16)`), `.seg()` |
| E3 | Phrasing (8/16/32 bars) | Changes happen at the start of 8-, 16- or 32-bar blocks. | B2 | Dancers and DJs expect change on phrase boundaries. | `arrange([16, a], …)`, `.mask("<0!16 1!16>")` |
| E4 | Song sections | Intro, build, drop, breakdown, outro. | E3 | The shape of a club track. | `arrange()`, `pick()` |
| E5 | Tension & release | Remove elements, filter them down, add risers or snare rolls, then bring everything back at the drop. | E2, E4 | The emotional arc of a track. | mask, filter signals, `ply`, `fast` rolls |
| E6 | Adding/removing layers | Entering and exiting parts on phrase boundaries. | E3 | 90s tracks are built almost entirely this way. | per-part `.mask()` |
| E7 | DJ-friendly intro/outro | 16–32 bars of mostly drums at the start and end, so a DJ can beatmatch. | E4 | An era convention. | arrangement |
| E8 | Sidechain / ducking | The bass or pads dip in volume each time the kick hits, making a "pumping" sound. | I8 | Clarity in the low end, plus the pumping house feel. | `.duckorbit() .duckdepth() .duckattack()` |
| E9 | Compression | Automatically evening out loud and quiet parts. | B10 | Punch and glue. | `.compressor("thr:ratio:knee:att:rel")` (per voice) |
| E10 | Gain staging & levels | Keeping every part at a sensible level so nothing clips and the kick stays on top. | B10 | Prevents distortion and a mix that sounds louder but worse. | `.gain`, `.postgain`, master headroom |
| E11 | Frequency space / avoiding mud | Each part gets its own frequency range: kick 50–100 Hz, mud 200–500 Hz, hats 3–12 kHz. Cut what a part doesn't need. | I12 | A clear, powerful mix. | `.hpf()` on non-bass parts; no EQ (gap G6) |
| E12 | Effect buses | Sending several parts to one shared reverb or delay. | I14, I15 | Cohesion, and CPU efficiency. | `.orbit(n)` (one delay and one reverb per orbit) |
| E13 | Probability & generative variation | Random but controlled changes so a loop never repeats exactly. | I19 | Long hypnotic techno sets. | `degradeBy`, `sometimesBy`, `rand`, `perlin`, `.seed` |
| E14 | Complete arrangement | Putting all of the above into a 5–7 minute track. | all | Capstone. | named consts + `arrange()` |

---

## 2. 90s house/techno specifics (1b)

### 2.1 Gear and sonic traits, with Strudel fidelity

| Gear | What it contributed | Strudel availability | Fidelity | Notes |
|---|---|---|---|---|
| **Roland TR-909** (1983) | Hybrid: analog kick, snare, and toms; 6-bit **sampled** hats and cymbals. "Punchy analog drums" plus "crisp, sharply defined hats". Has shuffle and flam. Became *the* house drum machine once it was cheap secondhand. | Bank `RolandTR909`: `bd cp cr hh ht lt mt oh rd rim sd` | **High.** The samples are recordings of a real 909. | Fixed samples, so no per-hit tuning or decay knobs. Approximate them with `.speed()`, `.decay()` (via `clip`/release), and `.lpf()`. |
| **Roland TR-808** (1980) | All analog. Long booming kick, snappy snare, cowbell, clap. The "heart of electro, techno, house". | `RolandTR808`: `bd cb cp cr hh ht lt mt oh perc rim sd sh` | High (samples) | The long-decay 808 kick is a fixed sample. Use `n()` to pick other variants. |
| **TR-707 / 727** (1985) | Digital 8-bit PCM. Plasticky kick, tambourine, rimshot. The 727 adds Latin percussion. Used in Chicago house. | `RolandTR707`: `bd cb cp cr hh ht lt mt oh rim sd tb`; `RolandTR727`: `perc sh` only | High for the 707; **partial** for the 727 (only perc and shaker; no named bongo, conga, or agogo slots) | |
| **TR-606** | Thin analog kit, often paired with the 303 | `RolandTR606`: `bd cr hh ht lt oh sd` (no clap or rim) | High | |
| **Roland TB-303** (1981) | Single saw/square oscillator → 24 dB/oct resonant low-pass → envelope. 16-step sequencer with **accent** and **slide**. Accent: louder, the decay knob is bypassed (shortest decay), and an "accent sweep" pushes the cutoff further (more so at high resonance). Repeated accents **stack**. Slide: that note's gate stays open into the next note and the pitch glides over a **fixed** time. | No 303 sample bank or model. Build it from `s("sawtooth"/"square")` + `.lpf/.lpq` + `.ftype("ladder")` + `.lpenv/.lpdecay` + `.distort` | **Medium.** Waveform, resonant 24 dB ladder filter, filter envelope, and drive are all present. **No portamento/slide** (G1). **No accent control** (G2), only a manual approximation. No stacked-accent behaviour. | The most important fidelity gap for an acid curriculum. See §4. |
| **Juno-60/106** | Warm chorused pads and strings (e.g. "Can You Feel It") | `s("sawtooth"/"supersaw")` + `.lpf` + `.chorus()`; the `RolandSystem100`/`RolandSH09` banks hold drum samples, not synth voices | Medium | `supersaw` with `unison`/`spread`/`detune` plus `.room()` gets a usable pad. |
| **SH-101** | Analog mono bass/lead with portamento and an arpeggiator | Saw/square/pulse synths | Medium (no portamento, again) | |
| **Korg M1** (1988) | The "Organ 2" house organ bass (*Show Me Love*). The "Piano 16" house/rave piano. | A `KorgM1` **drum** bank exists (drum sounds, not the piano). The `piano` sample set (Salamander grand) is in the REPL prebake. Organ bass can be synthesized: triangle plus a sine 19 semitones up (MusicRadar recipe), i.e. `note(...).s("triangle")` stacked with `.add(note(19)).s("sine")`. | **Low–medium.** No M1 piano sample. The acoustic grand works for piano riffs but sounds "nicer" than an M1. | `soundfonts` (`gm_*` GM sounds) include organs and electric pianos, a reasonable stand-in **[UNVERIFIED which GM organ is closest]**. |
| **E-mu SP-1200** | 12-bit, 26 kHz grit | `EmuSP12` bank; `.crush(12)` / `.coarse()` for lo-fi | Medium | `coarse` only works in Chromium browsers. |
| **Akai S900/S950, MPC60** | 12-bit sampling; MPC **swing**/timing feel | `AkaiMPC60` and `AkaiXR10` banks; `.crush()` | Medium; the swing is approximated by `swingBy` | |
| **Yamaha DX100/DX7** | FM bass ("Solid Bass" on Inner City's *Good Life*); harsh Detroit tones | FM synthesis: `.fm()`, `.fmh()`, FM envelopes | Medium (2-op style FM is possible) | No DX patches; the sound has to be designed by hand. |
| **Roland R-8** | Early-90s studio drums with "Feel" humanize | `RolandR8` bank | High (samples) | Weak evidence for its house role. |

### 2.2 Characteristic patterns (and how they look in Strudel)

All of these assume the convention **1 cycle = 1 bar of 4/4**. Use `setcpm(bpm/4)`.

| Pattern | Description | Strudel (sketch, verified syntax) |
|---|---|---|
| Four-on-the-floor | Kick on every beat | `s("bd*4").bank("RolandTR909")` |
| Clap on 2 & 4 | The backbeat | `s("~ cp ~ cp").bank("RolandTR909")` |
| Offbeat open hat | "and" of every beat | `s("[~ oh]*4").bank("RolandTR909")` |
| 16th closed hats with dynamics | Steady 16ths with accents | `s("hh*16").bank("RolandTR909").gain("[.5 .3 .7 .3]*4")` |
| House shuffle | 16ths with 55–60% swing | `.swingBy(0.08, 8)` (≈58%) **[derived]**. `swingBy(x, n)` delays the 2nd half of each of `n` slices by `x` (as a fraction of the slice). With n=8 (eighth notes), x=0.1 ≈ 60% swing and x=1/6 ≈ 66% (triplet). Needs an ear check in the prototype. |
| Offbeat bass | Bass notes between the kicks | `note("[~ c2]*4").s("sawtooth").lpf(400)` |
| Acid 303 line | 16-step saw line, resonant, envelope-modulated, accents | `note("c2 c2 c3 c2 eb2 c2 c3 g1 …").s("sawtooth").ftype("ladder").lpf(sine.range(300,2000).slow(16)).lpq(18).lpenv(4).lpdecay(.15).lpsustain(0).decay(.2).sustain(0).distort(1)` |
| Minor-7th stabs | Short chord hits on offbeats | `note("[~ <[c3,eb3,g3,bb3] [f3,ab3,c4,eb4]>]*2").s("sawtooth").lpf(1200).decay(.15).sustain(0).room(.3)` or `chord("<Cm7 Fm7>").voicing()` |
| Dub techno chord | Minor chord, delay feedback, high-passed repeats | `… .delay(.5).delaysync(3/16).delayfeedback(.6).hpf(200)`. `delaysync` is in cycles, so 3/16 of a bar is a dotted 8th and stays locked to tempo. `delaytime` is in seconds. |
| Piano riff | Syncopated chord riff | `note("…").s("piano")` (needs the `piano` sample map loaded) |
| Organ bass | M1-style | `stack(note(p).s("triangle"), note(p).add(19).s("sine").gain(.4))` **[derived from the MusicRadar recipe]** |

### 2.3 Typical tempos (sourced)

| Style | BPM | Strudel |
|---|---|---|
| House (general) | 115–130 | `setcpm(30)` = 120 BPM |
| Chicago house | 120–125 | `setcpm(30.5)` = 122 BPM |
| 90s house | 122–127 | `setcpm(31.25)` = 125 BPM |
| Acid house | ~122–129 | `setcpm(31)` = 124 BPM |
| Early Detroit techno | 120–125 (Attack Magazine). The often-quoted 125–135 is **not** supported. | |
| Early-90s rave/techno | 127–135; dub techno up to ~145 (Basic Channel) | `setcpm(33)` = 132 BPM |

### 2.4 Arrangement conventions of the era

- Sections are built in **multiples of 4, 8, or 16 bars** (Ableton). Changes land on 8- or 16-bar boundaries, often marked with a crash or a fill (Attack's *No UFO's* breakdown).
- **DJ intros and outros**: 16–32 bars of mostly drums. 32 bars at 128 BPM ≈ 1 minute (MusicRadar **[search summary]**).
- **Breakdown**: the drums drop out (or down to kick only) for 8–16 bars, the melodic or acid part is exposed, then everything drops back in. Native Instruments' acid example: drums out around bar 17, back at bar 25.
- **Builds**: strip elements, add risers, snare rolls, and percussion; sweep a filter open (≈200 Hz → 20 kHz) into the drop.
- **Length**: club mixes typically run 6+ minutes (anecdotal; no authoritative source found). 192 bars at 125 BPM ≈ 6:09 **[derived]**.

A typical 90s skeleton for the capstone (bars):
`Intro 16 (drums) → Build 16 (+bass, +hats, filter opening) → Drop 32 (everything) → Breakdown 16 (no kick; chords/acid exposed) → Drop 2 32 → Outro 16 (drums only)`, which is 128 bars ≈ 4:06 at 125 BPM. Lengthen sections for a "club mix".

In Strudel, **1 bar = 1 cycle**, so this is `arrange([16, intro], [16, build], [32, drop], …)`. See §3.9.

---

## 3. Strudel capabilities mapped to skills (1c)

Source of truth: `packages/core/{controls,pattern,signal,repl,cyclist}.mjs`, `packages/mini/krill.pegjs`, `packages/superdough/*.mjs`, `packages/tonal/voicings.mjs`, `website/src/repl/prebake.mjs` on Codeberg `main`. Cross-checked against the npm 1.2.6/1.3.0 builds (which already include `lfo`, `duckorbit`, `transient`, `delaysync`, wavetables).

> **Docs lag the source.** `supersaw`, `pulse`, `sbd`, `bytebeat`, mini-notation `{}`, `.`, `..`, `^`, and `beat()` exist in the source but are missing from (or only in examples on) the matching docs pages. Our cheat sheet should be generated from what we verify, not copied from the docs.

### 3.1 Mini-notation (skills B3–B7, I2, I3)

| Syntax | Meaning | Example |
|---|---|---|
| space | Steps squeezed into one cycle | `"bd sd bd sd"` |
| `[ ]` | Subdivide one step | `"bd [hh hh]"` |
| `< >` | Alternate: one item per cycle | `"<c2 eb2 f2>"` |
| `~` or `-` | Rest | `"~ cp ~ cp"` |
| `*n` / `/n` | Speed up / slow down (patternable) | `"hh*16"`, `"bd*<2 3>"` |
| `!n` / `!` | Replicate without speeding up | `"bd!4"` |
| `@n` / `_` | Elongate (weight) | `"c2@3 eb2"` |
| `,` | Play simultaneously | `"c3,eb3,g3"` |
| `{ }` / `{ }%n` | Polymeter | `"{bd sd hh}%4"` |
| `(k,n,rot)` | Euclidean rhythm | `"bd(3,8,2)"` |
| `?` / `?p` | Randomly drop (seeded) | `"hh*16?0.2"` |
| `\|` | Random choice per cycle | `"[bd\|sd]"` |
| `:` | Sample index / multi-value | `"bd:3"`, `lpf("800:10")` |
| `.` (spaced) | Group into "feet" | `"bd sd . hh hh hh"` |
| `..` | Range | `n("0 .. 7")` |

Quoting: in the REPL transpiler, `"…"` and backtick strings are mini-notation and `'…'` is a plain string. We will use the transpiler, so this holds for us.

### 3.2 Sound and sample selection (B5, B8, B13, I20)

- `s("name")` (alias `sound`). Value form is `name:index:gain`.
- `n(i)`: sample index (0-based; wraps around).
- `.bank("RolandTR909")`: prepends the bank name. Case-insensitive.
- Short aliases (`tr909`, `tr808`…) only work after `aliasBank('…/tidal-drum-machines-alias.json')`.
- **71 drum-machine banks** are in `tidal-drum-machines.json`. Era-relevant ones: `RolandTR909`, `RolandTR808`, `RolandTR707`, `RolandTR727`, `RolandTR606`, `RolandTR505`, `RolandR8`, `RolandCompurhythm78`, `AkaiMPC60`, `AkaiXR10`, `EmuSP12`, `LinnDrum`, `LinnLM1`, `OberheimDMX`, `KorgM1`, `AlesisHR16`, `BossDR110`. Note that the CR-78 is `RolandCompurhythm78`, not `RolandCR78`.
- Drum names: `bd sd rim cp hh oh cr rd ht mt lt sh cb tb perc misc fx`. Not every bank has every name (e.g. the 606 has no `cp`).
- `.speed(x)`: playback rate, so it changes pitch and length. `.begin/.end/.loop/.clip`.
- What the strudel.cc REPL prebakes (from `https://strudel.b-cdn.net`): `tidal-drum-machines`, `uzu-drumkit` (the unprefixed `bd`/`sd`/… defaults), `piano`, `vcsl`, `mridangam`, `uzu-wavetables`, a small Dirt-Samples subset, ZZFX, and GM soundfonts. **None of this loads automatically for us**; see §5.4.

### 3.3 Synths (B12, B13, I9, E1)

| Sound | Parameters |
|---|---|
| `sine` `sawtooth` `square` `triangle` (aliases `sin saw sqr tri`) | Default amp envelope a .001 / d .05 / s .6 / r .01 |
| `supersaw` | `unison` (5), `spread` (0–1, .6), `detune` (.18) |
| `pulse` | `pw`, `pwrate`, `pwsweep` |
| `sbd` | Synth kick: `decay`, `pdecay`, `penv` |
| `white` `pink` `brown` `crackle` | Noise sources; `.noise(amt)` mixes noise into an oscillator |
| FM (any oscillator) | `fm` (index), `fmh` (ratio), `fmattack/fmdecay/fmsustain/fmrelease`, `fmenv` (`lin`/`exp`, the latter "might be broken"), `fmwave`; numbered variants 1–8 |
| `user` | Additive: `.partials([...])`, `.phases([...])` |
| Wavetables `wt_*` | `wt` (position 0–1), `warp`, `warpmode` + envelopes/LFOs (needs the `uzu-wavetables` map) |
| ZZFX `zzfx`, `z_*` | Retro game-synth parameters |

Pitch: `note("c2")` (names default to octave 3; MIDI numbers also accepted), `n("0 2 4").scale("C:minor")` (colon-separated scale names; patternable), `freq`, `transpose`, `scaleTranspose`, `octave` **[UNVERIFIED for superdough beyond the frequency multiply]**.
Pitch envelope: `penv` (semitones), `pattack`, `pdecay`, `prelease`, `pcurve`, `panchor`.
Other: `vib` (rate:depth), `chorus` (0–1).

### 3.4 Chords and voicings (I6, I7)

- `chord("<Cm7 Fm7 Bb7 Eb^7>").voicing()`, with controls `dict` (default `ireal`; also `lefthand`, `triads`, `guidetones`), `anchor` (default `c5`), `mode` (`below|above|duck|root`), `offset`, `octaves`. `n()` after `voicing` arpeggiates.
- `rootNotes(octave)` gives the chord's root, which is handy for basslines.
- `.voicings('lefthand')` is **deprecated**.
- Raw alternative: `note("c3,eb3,g3,bb3")`. More transparent for a beginner, and easier for the GUI to round-trip.

### 3.5 Envelopes and filters (B14, I10–I13)

| Control (aliases) | Range |
|---|---|
| `attack/att`, `decay/dec`, `sustain/sus`, `release/rel`, `hold` | seconds; sustain 0–1 |
| `.adsr("a:d:s:r")`, `.ad`, `.ar` (avoid `.ds`: it collides with `delaysync`) | |
| `lpf/cutoff/ctf/lp` | Hz 0–20000; `"hz:q"` form allowed |
| `lpq/resonance` | 0–50 |
| `hpf/hp`, `hpq` · `bpf/bp`, `bpq` | Hz / Q |
| `ftype` | `12db` (default), `ladder`, `24db` |
| `drive` | Filter overdrive (ladder) |
| `djf` | 0–1 DJ filter (<.5 low-pass, >.5 high-pass) |
| `vowel` | `a e i o u …` |
| Filter env: `lpenv/lpe` (depth, ±), `lpattack/lpa`, `lpdecay/lpd`, `lpsustain/lps`, `lprelease/lpr` (+ `hp*`, `bp*`), `fanchor` | |
| Per-filter LFO: `lprate`, `lpsync`, `lpdepth`, `lpshape`… | |
| Generic modulators: `.lfo({ c, rate, sync, depth, shape, … })`, `.env({ c, a, d, s, r, depth })` (modulates the previous control by default) | |

### 3.6 Effects (I14–I17, E8–E12)

| Effect | Controls / range | Scope |
|---|---|---|
| Level | `gain` (exponential; default .8), `velocity` (0–1, multiplies), `postgain` | per voice |
| Pan | `pan` 0 (L) … 1 (R) | per voice |
| Distortion | `distort("amt:postgain:type")` (types `diode fold chebyshev scurve asym sinefold`), `crush` (1 harsh … 16 clean), `coarse` (Chromium only), `shape` (deprecated) | per voice |
| Tremolo | `tremolo` (Hz), `tremolosync` (cycles), `tremolodepth`, `tremoloshape` | per voice |
| Phaser | `phaser` (rate), `phaserdepth`, `phasercenter`, `phasersweep` | per voice |
| **Compressor** | `compressor("threshold:ratio:knee:attack:release")`, e.g. `"-20:20:10:.002:.02"` | **per voice**, not a bus compressor |
| Transient | `transient("attack:sustain")` (−1…1) | per voice |
| **Delay** | `delay` (0–1, or `"lvl:time:fb"`), `delaytime` (s), `delaysync` (cycles, default 3/16), `delayfeedback` (<1) | **one per orbit** |
| **Reverb** | `room` (level), `roomsize` (0–10), `roomfade`, `roomlp`, `roomdim`, `ir` (impulse response) | **one per orbit** |
| Bus | `orbit(n)` (default 1); `orbit("2,3")` duplicates to several | |
| **Sidechain** | `duckorbit("2")` on the trigger (e.g. the kick), plus `duckdepth` (0–1), `duckonset`, `duckattack` (recovery, s); the ducked part goes on `.orbit(2)` | per orbit |

The per-voice signal chain has a fixed order: filters → vowel → coarse → crush → distort → tremolo → compressor → pan → phaser → postgain → sends. **No user-defined chain order and no duplicate effects** (G5).

### 3.7 Pattern transformations (I1, I19, E13)

- **Time**: `fast`, `slow`, `hurry`, `rev`, `palindrome`, `ply`, `segment/seg`, `early`, `late`, `inside`, `outside`, `zoom`, `linger`, `iter`, `swingBy(x, n)`, `swing(n)`.
- **Conditional**: `firstOf(n, f)` (alias `every`), `lastOf(n, f)`, `when`, `chunk`, `within`.
- **Random**: `sometimesBy(p, f)`, `sometimes`, `often`, `rarely`, `almostNever`, `almostAlways`, `someCyclesBy`, `degradeBy`, `shuffle`, `scramble`, `choose`, `wchoose`, `randcat`, `seed`.
- **Layering**: `stack`, `off(t, f)`, `superimpose`, `layer`, `jux`, `juxBy`, `echo`.
- **Structure**: `struct("x ~ x")`, `mask("1 0")`, `euclid`, `euclidRot`, `euclidLegato`.
- **Math**: `add`, `sub`, `mul`, `range`, `rangex`.
- **Concatenation**: `cat`/`slowcat` (one item per cycle), `seq`/`fastcat` (all in one cycle), `stepcat`/`timecat` (weighted, within a cycle), `arrange` (weighted, across cycles), `polymeter`.
- **REPL blocks**: `$: pat` (anonymous), `name: pat` (named), `_$:` / `_name:` (muted), `S$:` (solo), `pat.hush()`, `all(f)`, `each(f)`.

### 3.8 Signals (I18, E2)

- Unipolar 0–1: `sine cosine saw isaw tri square rand perlin`.
- Bipolar: `sine2`, `saw2`….
- Integers: `irand(n)`.
- Other: `run(n)`, `mousex`, `mousey`, `time`.
- Methods: `.range(a,b)`, `.rangex()`, `.slow()`, `.fast()`, `.segment(n)`.
- Example 16-bar filter sweep: `.lpf(saw.range(200, 4000).slow(16))`.
- **Caveat**: a signal is sampled once per event. A long held note won't sweep. Use `.seg(16)` or an audio-rate `.lfo()` or `.lpenv()` instead.

### 3.9 Song structure (E3–E7, E14)

- `arrange([16, intro], [16, build], [32, drop], [16, breakdown], [32, drop2], [16, outro])`: each entry is `[cycles, pattern]`. **This is our primary arrangement primitive.**
- `"<a b>".pick({a, b})` / `inhabit`: choose sections from a pattern of names.
- `.mask("<0!16 1!48>")`: per-part enter/exit over cycles.
- `seqPLoop([start, end, pat], …)`: absolute-time sections that may overlap.
- No bar counter or song timeline exists. Position is derived from cycles. **[derived]** Our UI must compute "bar N of section X" itself from `scheduler.now()` (cycles) and the arrangement data.

### 3.10 Tempo (B1)

- Strudel counts **cycles**, not beats. The default is **0.5 cycles per second (cps)**.
- `setcps(x)`, `setcpm(x)`.
- The docs' rule: `setcpm(bpm / beatsPerCycle)`. With our convention of 1 cycle = 1 bar of 4 beats: **`setcpm(bpm/4)`**, i.e. `cps = bpm / 240`. 125 BPM → `setcpm(125/4)` = 31.25 cpm = 0.521 cps.
- Writing `setcpm(125/4)` literally in the code is clearer to a learner than `setcpm(31.25)`. We'll generate it that way.
- `.cpm()` on a pattern is deprecated.

### 3.11 Visualization

- `.pianoroll()`, `.punchcard()`, `.spiral()`, `.scope()`, `.fscope()`, `.spectrum()`: full-page canvas (`@strudel/draw`, `@strudel/webaudio`).
- Inline widget variants `._pianoroll()`, `._scope()`… need `@strudel/codemirror`.
- `.color("cyan")`.
- **Active-note highlighting** in the editor is provided by `@strudel/codemirror` (`highlightExtension`, `updateMiniLocations`, `highlightMiniLocations`). This is cheap to get and very valuable for learning.

---

## 4. Gaps: what Strudel can't do (well)

| # | Gap | Impact | Mitigation |
|---|---|---|---|
| **G1** | **No portamento / glide / 303 slide** on synth voices. `portamento` is commented out in `controls.mjs` ("TODO: slide param for certain synths"). `slide` exists but only ZZFX uses it. | Acid lines lose their signature glide. | Approximate: on the slid-to note, use `penv` with a negative semitone offset equal to the interval, plus a short `pattack` and `pcurve`, so the pitch glides up into the note **[UNVERIFIED that this sounds acceptable; prototype in Phase 3]**. Also lengthen the slid note (`clip`/`legato` > 1) so it overlaps. The lesson will be honest that this is a workaround. |
| **G2** | **No accent control** and no accent-sweep/stacking circuit. | Accents must be hand-built. | Pattern `velocity`, `lpenv`, and `lpdecay` together, e.g. an accent mask turned into `.velocity("1 .6 .6 1 …").lpenv("6 3 3 6 …")`. This is actually a good teaching moment: it shows *what* an accent does. |
| G3 | Signals are sampled once per event, not continuously. | Sweeps on long notes are stepped or static. | `.seg(n)` or `.lfo()` / `.lpenv()`. |
| G4 | **One delay and one reverb per orbit.** Two parts on the same orbit with different settings overwrite each other. | A silent, confusing bug for learners. | The GUI assigns each part its own orbit when it sets reverb or delay, and warns on conflicts. |
| G5 | Fixed per-voice effect order; can't duplicate effects (no lpf → distort → lpf). | Limits some sound design. | Accept it. Note it in the cheat sheet. |
| G6 | **No EQ** (no parametric/shelf EQ) and **no master-bus compressor or limiter**. `compressor` is per voice. | "Mixing basics" can only be taught with gain, high-pass/low-pass, and ducking. | Teach frequency carving with `hpf` and `lpf`. Teach levels with `gain` and `postgain`. Be honest that real mixing needs a DAW. Possibly add our own master limiter node outside Strudel **[UNVERIFIED feasibility: superdough owns its output graph]**. |
| G7 | No song timeline, bar counter, or automation lanes. | The GUI must reconstruct "where are we in the song". | Compute it from `scheduler.now()` and our arrangement data. |
| G8 | Samples load lazily, so the first hit of a new sound can be dropped ("took too long"). | First play sounds broken. | Preload the samples a lesson uses with `loadBuffer` before enabling Play. |
| G9 | No authentic M1 piano or organ, no Juno/303/101 synth models, no 727 congas or bongos. | Lower fidelity for era-specific timbres. | Acoustic `piano` samples, GM soundfonts, and the synthesized organ bass recipe. State the shortfall in lessons. |
| G10 | Drum samples are fixed. No 909 "tune / decay / attack" knobs. | Less sound shaping per hit. | `.speed()`, `.clip()`/`release`, `.lpf()`, `.hpf()`. |
| G11 | `coarse` is Chromium only; `fmenv("exp")` is flaky; `shape` is deprecated (can get loud); `.ds` is ambiguous. | | Keep these out of the curriculum and the GUI. |
| G12 | `swing` is expressed as a time offset, not an "MPC %". | Conversion needed. | **Measured in Phase 3:** `swingBy(x, 8)` delays the second 16th of each 8th by x/16 of a bar, so an MPC swing of p% is `x = (p − 50)/50` (58% → `.16`, 66% triplet feel → `.32`). The earlier ×½ estimate was wrong. |
| G14 | **`duckorbit(n)` throws "duck target orbit n does not exist" while nothing has played on orbit n** (found in Phase 3). | Sidechain in an arrangement breaks in sections without the ducked part. | Apply the duck with a modifier only in sections where the target plays; the app explains the error in plain words. |
| G13 | No recording or export to WAV in our planned packages. `renderPatternAudio` exists in `@strudel/webaudio`. | Nice-to-have for the capstone. | Defer; investigate `renderPatternAudio` later. |

---

## 5. Technical integration (1d)

### 5.1 Packages (verified on npm, 2026-10-31)

All are **AGPL-3.0-or-later**, **ESM-only**, and ship **no TypeScript types** (a TS pull request, #1871, is open and unmerged). **npm is ~9 months behind `main`**: the last release was 2026-01-18, and `main` has breaking changes (see 5.6).

| Package | Version | What it provides | Imports on the server? | Use? |
|---|---|---|---|---|
| `@strudel/core` | 1.2.6 | Pattern engine, controls, `repl()`, `evalScope`, `Cyclist` | Bundled: logs "cannot use window" and continues. Plain Node ESM: **fails** (the `@kabelsalat/web` export issue, fixed on `main` only). | **Yes** |
| `@strudel/mini` | 1.2.6 | Mini-notation: `mini`, `m`, `mini2ast`, `getLeafLocations` | Yes | **Yes** |
| `@strudel/transpiler` | 1.2.6 | `transpiler()` (acorn + escodegen), returns `{output, miniLocations, widgets}` | Yes | **Yes** |
| `@strudel/webaudio` | 1.3.0 | `webaudioRepl`, `webaudioOutput`, re-exports superdough (`samples`, `getAudioContext`, `initAudio`, `registerSynthSounds`, `aliasBank`, `loadBuffer`), `renderPatternAudio` | Yes (AudioContext created lazily) | **Yes** |
| `superdough` | 1.3.0 | Synth/sampler engine (a dependency of webaudio) | Yes | transitive |
| `@strudel/tonal` | 1.2.6 | `scale`, `chord`/`voicing`, tonaljs | Yes | **Yes** |
| `@strudel/draw` | 1.2.6 | `pianoroll`, `punchcard`, `Drawer` (animation-frame loop used for highlighting) | Yes | **Yes** |
| `@strudel/codemirror` | 1.3.0 | `StrudelMirror`, plus CM6 extensions: `highlightExtension`, `updateMiniLocations`, `highlightMiniLocations`, `flash`, themes, sliders | Yes | **Yes (the extensions)** |
| `@strudel/soundfonts` | 1.3.0 | GM `gm_*` instruments | **No** (window) | Optional, dynamic import only |
| `@strudel/web` | 1.3.0 | Prebuilt all-in-one bundle (243 KB gz) with `initStrudel`, `evaluate`, `hush` | **No** (`window.initStrudel` at top level) | **No.** It bundles its own copy of core, so combining it with codemirror loads core twice. |
| `@strudel/repl` | 1.3.0 | `<strudel-editor>` web component (5 MB, full prebake) | **No** | **No.** It injects DOM siblings React doesn't own, and gives no fine-grained control. |
| `@strudel/midi` | 1.3.0 | MIDI out | Yes | Not needed |

**Recommendation:** use the individual packages, pinned to **exact** versions: `@strudel/core@1.2.6 @strudel/mini@1.2.6 @strudel/transpiler@1.2.6 @strudel/webaudio@1.3.0 @strudel/tonal@1.2.6 @strudel/draw@1.2.6 @strudel/codemirror@1.3.0`, plus our own `@codemirror/*` deduped to a single copy. Write local `declare module '@strudel/*'` type shims, typed for the surface we use.

### 5.2 Evaluating code, playback, and errors

Two ways to drive it, both verified in the 1.3.0 source:

- `webaudioRepl({ transpiler, onEvalError, beforeEval, afterEval, onToggle, setInterval, clearInterval })` returns `{ scheduler, evaluate(code, autostart=true), start, stop, pause, setCps, state }`.
- `StrudelMirror` (from `@strudel/codemirror`) wraps the same `repl()` and owns a CodeMirror view. It **requires** `prebake`, `defaultOutput: webaudioOutput`, `getTime`, and `transpiler` to be passed in.

The transpiler turns `"…"` into `m('…', offset)` (with source offsets for highlighting), turns `$:` labels into `.p('$')`, auto-awaits `samples()`, and makes the last statement the return value. It runs via `Function(...)`, so **the CSP must allow `'unsafe-eval'`**.

**Error surfaces:**
1. **Syntax and mini-notation errors.** These are caught inside `evaluate`, which calls `onEvalError(err)` and sets `state.evalError`. **`evaluate` never rejects**, so we must use the callback. Acorn errors carry `.loc`, which lets us underline the line.
2. **Runtime query errors** (thrown while the scheduler runs) and **output errors** (e.g. `sound xyz not found! Is it loaded?`). These **only** go to the logger, which does `console.log` and dispatches `CustomEvent('strudel.log', {detail:{message, type}})` on `document`. We listen for that event. The logger de-dupes repeats for 1 s.

**Stop and start:** `repl.stop()` stops and resets to cycle 0. `pause()` keeps the position. `evaluate()` auto-starts.

**Audio unlock:**
- `initAudioOnFirstClick` listens to `mousedown` only.
- `initAudio()` has a bug (#2164, open) and never calls `resume()`.
- **Fix:** our Play button handler calls `getAudioContext().resume()`, then `initAudio()` (once).

**Background tabs:** pass `setInterval`/`clearInterval` from `worker-timers`, as strudel.cc does, so playback isn't throttled.

### 5.3 Editor: CodeMirror 6 with Strudel extensions

- **Option A — `StrudelMirror`.** Gives us everything (evaluate keys, highlighting, flash, widgets). It creates its own `EditorView` and repl and listens for `document` events. Drawbacks: React doesn't own its lifecycle; `clear()` doesn't destroy the view (call `editor.destroy()` too); its settings persist to localStorage under `codemirror-settings`.
- **Option B — our own CM6 `EditorView`** plus `@strudel/codemirror`'s plain extensions (`highlightExtension`, `flashField`, theme). After eval, call `updateMiniLocations(view, meta.miniLocations)`. Every animation frame (via `@strudel/draw`'s `Drawer`), call `highlightMiniLocations(view, now, haps)`.
- **Recommendation: Option B.** We need tight control over transactions so we can (a) apply GUI-generated edits as precise CM6 changes, (b) highlight *changed* spans with our own decoration (separate from the playing-note highlight), and (c) mark blocks read-only or "custom". Both rely on CM6 `StateField`s, so `@codemirror/state` and `@codemirror/view` **must be deduped** or the effects silently won't match.

### 5.4 Samples

- `samples(url | map, baseUrl?)` **only registers names**. Each file is fetched and decoded on first trigger and cached in memory. Supported sources: `github:user/repo`, `shabda:`, and `local:` shorthands.
- What we'll load on init (mirrors strudel.cc's prebake):
  ```js
  registerSynthSounds();
  samples('https://strudel.b-cdn.net/tidal-drum-machines.json',
          'https://strudel.b-cdn.net/tidal-drum-machines/machines/', { tag: 'drum-machines' });
  samples('https://strudel.b-cdn.net/uzu-drumkit.json', 'https://strudel.b-cdn.net/uzu-drumkit/');
  samples('https://strudel.b-cdn.net/piano.json', 'https://strudel.b-cdn.net/piano/');
  aliasBank('https://strudel.b-cdn.net/tidal-drum-machines-alias.json');
  ```
- **Sizes:** `tidal-drum-machines.json` is 124 KB (683 sounds) and fetches in ~0.2 s. One 909 kick WAV is about 82 KB. A lesson typically needs under 1 MB of audio.
- **CDN headers:** `access-control-allow-origin: *` and `cache-control: max-age=2592000` (30 days).
- **Offline:** Strudel itself does no persistence. strudel.cc uses a Workbox `CacheFirst` service worker. Options for us:
  - (a) add a service worker later;
  - (b) **self-host** a curated subset (909/808/707/606 plus piano) in `/public/samples/`. That gives us independence from the CDN and deterministic lessons; pass `baseUrl` explicitly, because the JSON `_base` points at GitHub.
  - Recommend starting with the CDN and self-hosting the curated subset during polish.
- **Preload:** before enabling Play in a lesson, call `loadBuffer` for the sounds it uses (gap G8).

### 5.5 Next.js / React pitfalls

1. **SSR.** Nothing from `@strudel/*` may be imported in server components or at module top level of a client component that SSRs. Put all Strudel access behind `await import()` inside a client-only engine module, and mount editor and transport components with `next/dynamic(…, { ssr: false })`. The maintainer won't support Next or webpack (issue #1351, "run all the strudel stuff on the client only").
2. **StrictMode double mount.** The clock, trigger function, `Pattern.prototype` patches, `globalThis` (≈900 names from `evalScope`), and the AudioContext are all **module-global**. So: **create the engine once, as a module-level promise singleton**, never inside `useEffect`. Effects only attach and detach UI. Cleanup stops playback and destroys the editor view.
3. **Never `close()` the AudioContext.** superdough caches its controller and worklet state against it. Use `suspend()`/`resume()`.
4. **Bundling.** AudioWorklets are inlined `data:` URLs, so no special webpack or Turbopack config is needed. The SharedWorker asset is only used with `sync: true`, which we won't use. **[UNVERIFIED: no real `next build` was run.]** Milestone 1 must run `next build` early.
5. **Globals.** `evalScope` defines `s`, `n`, `note`, `stack`, `silence`… on `globalThis`. Avoid app code that depends on globals with those names.

### 5.6 Version drift risk

- `main` removed `defaultOutput` from `repl()` in favour of `onSchedule(hap, time, cps)` (PR #2138), and removed supradough (#2147).
- The `/technical-manual/repl` docs already describe `onSchedule`, which **does not match npm 1.3.0**.
- Mitigation: pin exact versions; isolate everything behind **one engine module** (`lib/audio/engine.ts`) with our own interface (`init`, `unlock`, `evaluate(code) → {ok, error}`, `stop`, `onLog`, `onHighlight`, `getCycle`, `setCpm`). A future upgrade then touches one file.

### 5.7 Licensing

- Every `@strudel/*` package, plus transitive deps such as `@kabelsalat/*` and `supradough`, is AGPL-3.0-or-later.
- strudel.cc's project-start page says derivative work must use the same license and that "source code must be distributed along with web publication".
- This confirms your plan: AGPL-3.0 `LICENSE` in the repo, and a footer link to the source.

### 5.8 Parsing for GUI round-tripping: options evaluated

**What Strudel gives us (verified by running it):**
- `mini2ast('"bd*4 [~ sd]"')` returns a krill AST with source offsets per atom.
- `getLeafLocations` returns the location of each mini-notation leaf.
- `transpiler(code)` returns `{ output, miniLocations }`.
- A pattern can be **queried in Node without audio**: `s(mini("bd*2 sd")).bank("RolandTR909").queryArc(0,1)` returns the events. That is excellent for tests and for GUI previews such as step grids.
- **Not available:** a mini-notation printer (AST → string). escodegen drops formatting and comments.

| Option | How | Pros | Cons |
|---|---|---|---|
| **A. Constrained generated format only** (regex/template) | The GUI generates code from a template and recognizes only exact template output | Trivial to build | Brittle. Any whitespace or quote change by hand flips the block to "custom". Bad for a learner who edits by hand. |
| **B. JS AST (acorn) + whitelist + mini AST** | Parse each block with acorn (`ecmaVersion: 2022, locations: true`, same as Strudel). Walk the method chain `s(...).bank(...).gain(...)`. Accept only whitelisted calls and literal args. Validate and decode mini strings with `mini2ast`. **Apply GUI edits by splicing the exact source ranges** (`node.start`/`node.end`) instead of regenerating. | Tolerates formatting, comments, and argument reordering. Edits stay minimal and highlightable. Precise "custom" detection: anything outside the whitelist. Acorn is already a transitive dependency. | More code: a whitelist schema per atom type, plus a small mini-notation serializer for the subset the GUI writes (sequences, `~`, `[ ]`, `*n`, `<>`, `,`). |
| **C. Mini-notation parsing only** | Treat each block as a single mini string | Simple for drum grids | Doesn't cover method chains (bank, gain, lpf…), which carry half the meaning. |

**Recommendation: B, combined with a canonical generation style from A.**
- The GUI *generates* a canonical, readable form, such as `const kick = s("bd*4").bank("RolandTR909").gain(0.9)`, but *recognizes* any code acorn parses into a whitelisted shape.
- Edits are range splices, which directly gives us requirement 4: highlight the changed span.
- Anything unrecognized puts that block, and only that block, into "custom code".
- The mini serializer only needs to cover the subset the GUI can produce. Mini strings outside that subset make the specific *control* read-only, not the whole block.
- Tests can use `queryArc` to assert that parse → generate round trips are **musically identical**, not just textually equal.

---

## 6. Recommendations going into Phase 2

1. **Convention: 1 cycle = 1 bar of 4/4**, and tempo is written as `setcpm(BPM/4)`. Every lesson, the GUI, and the arrangement math rely on this.
2. **Code format**:
   - each building block is a top-level `const name = …;`;
   - the composition is a single final expression (`stack(...)` or `arrange(...)`);
   - **or** use `$:`/named labels per part.

   Labels give free mute and solo (`_name:`) but can't be referenced by other blocks. `const`s compose. I'll weigh this in design.md (a hybrid is likely: consts for blocks, one `$:` for the output).
3. **Engine**: individual pinned packages, a module-level singleton, CM6 with Strudel extensions, and manual audio resume. Listen to `strudel.log` for runtime errors.
4. **Parser**: acorn chain parser with a whitelist, `mini2ast` validation, range-splice edits, and `queryArc`-based round-trip tests.
5. **Samples**: start with the strudel.cc CDN maps, preload per lesson, and self-host the curated 909/808/707/606/piano subset during polish.
6. **Acid curriculum**: teach accents as patterned `velocity` plus `lpenv`. Prototype a `penv`-based slide early in Phase 3, and if it sounds poor, say so in the lesson rather than hiding it.
7. **Orbits**: the GUI auto-assigns orbits to parts that use reverb or delay (gap G4), and teaches orbits explicitly in the effects-bus lesson.
8. **Early risk check in milestone 1**: run `next build` (Turbopack and webpack) with the pinned packages before anything else.

---

## 7. Sources

### Strudel
- Source on `main`: https://codeberg.org/uzu/strudel. Files:
  - `packages/core/controls.mjs`, `pattern.mjs`, `signal.mjs`, `repl.mjs`, `cyclist.mjs`, `evaluate.mjs`
  - `packages/mini/krill.pegjs`, `mini.mjs`
  - `packages/superdough/superdough.mjs`, `synth.mjs`, `sampler.mjs`, `helpers.mjs`
  - `packages/tonal/voicings.mjs`
  - `packages/codemirror/codemirror.mjs`
  - `packages/draw/pianoroll.mjs`
  - `packages/transpiler/transpiler.mjs`
  - `packages/web/web.mjs`
  - `website/src/repl/prebake.mjs`, `website/astro.config.mjs`
- Docs:
  - https://strudel.cc/learn/mini-notation/
  - https://strudel.cc/learn/samples/
  - https://strudel.cc/learn/synths/
  - https://strudel.cc/learn/effects/
  - https://strudel.cc/learn/signals/
  - https://strudel.cc/learn/lfo/
  - https://strudel.cc/learn/time-modifiers/
  - https://strudel.cc/learn/conditional-modifiers/
  - https://strudel.cc/learn/random-modifiers/
  - https://strudel.cc/learn/visual-feedback/
  - https://strudel.cc/understand/cycles/
  - https://strudel.cc/understand/voicings/
  - https://strudel.cc/technical-manual/project-start/
  - https://strudel.cc/technical-manual/packages/
  - https://strudel.cc/technical-manual/repl/
- Issues and PRs:
  - #1351 (Next.js/webpack): https://codeberg.org/uzu/strudel/issues/1351
  - #2164 (audio resume): https://codeberg.org/uzu/strudel/issues/2164
  - #1921 and #1930 (kabelsalat export)
  - PR #2138 (`onSchedule`), PR #2147 (supradough removal), PR #1871 (TypeScript)
  - Old GitHub mirror: https://github.com/tidalcycles/strudel/issues/555
- npm registry: `npm view` for each package (2026-10-31)
- Sample CDN: https://strudel.b-cdn.net/tidal-drum-machines.json, `…/tidal-drum-machines-alias.json`, `…/uzu-drumkit.json`, `…/piano.json`

### Gear and history
- Roland TR-808: https://www.roland.com/us/promos/roland_tr-808/
- Roland TR-909: https://www.roland.com/us/promos/roland_tr-909/ · https://www.roland.com/global/promos/909day/ [search summary]
- Sound On Sound, *The History of Roland, Part 2*: https://www.soundonsound.com/people/history-roland-part-2
- Roland, TR-707/727: https://articles.roland.com/mod-squad-a-history-of-tr-707-and-tr-727-modifications/ [search summary]
- Attack Magazine, TB-303 hardware focus: https://www.attackmagazine.com/technique/hardware-focus/roland-tb-303/
- Robin Whittle (Devil Fish designer), 303 accent and slide:
  - https://www.firstpr.com.au/rwi/dfish/303-unique.html
  - https://www.firstpr.com.au/rwi/dfish/303-slide.html
  - https://www.firstpr.com.au/rwi/dfish/
- Sound On Sound, Behringer TD-3-MO review: https://www.soundonsound.com/reviews/behringer-td-3-mo
- Sound On Sound, ReBirth RB-338 review: https://www.soundonsound.com/reviews/steinbergpropellerheads-rebirth-rb338-techno-micro-composer
- Juno history: https://perfectcircuit.com/signal/roland-juno-history [search summary]
- Wikipedia (backup only): Roland TB-303, Juno-106, SH-101, Korg M1, E-mu SP-1200, Akai S900, Roland R-8, Ensoniq Mirage
- MusicRadar, M1 organ bass and piano [search summary]:
  - https://www.musicradar.com/how-to/classic-house-organ-robin-s-show-me-love
  - https://www.musicradar.com/how-to/how-to-make-90s-rave-style-piano-chords
- Sound On Sound, Akai MPC60 revisited: https://www.soundonsound.com/music-business/akai-mpc60-revisited
- Attack Magazine, Yamaha DX7: https://www.attackmagazine.com/technique/hardware-focus/yamaha-dx7/
- Ableton Learning Music, *Good Life*: https://learningmusic.ableton.com/make-basslines/good-life.html
- Attack Magazine, nine samplers that defined dance music: https://attackmagazine.com/features/long-read/nine-samplers-that-defined-dance-music/4

### Patterns, tempo, and arrangement
- Attack Magazine Beat Dissected:
  - 90s house: https://www.attackmagazine.com/technique/beat-dissected/90s-house/
  - 21st-century Chicago house: https://www.attackmagazine.com/technique/beat-dissected/21st-century-chicago-house/
  - Armando-style acid house: https://www.attackmagazine.com/technique/beat-dissected/armando-acid-house/
  - Motor City Detroit techno: https://www.attackmagazine.com/technique/beat-dissected/motor-city-detroit-techno/
  - Belleville techno: https://www.attackmagazine.com/technique/beat-dissected/belleville-techno/
- Attack Magazine, interview with Roger Linn on swing: https://www.attackmagazine.com/features/interview/roger-linn-swing-groove-magic-mpc-timing/
- Attack Magazine, acid house bassline tutorial: https://www.attackmagazine.com/technique/tutorials/how-to-make-an-acid-house-bassline/
- Attack Magazine, theory of techno pads: https://attackmagazine.com/technique/tutorials/the-theory-of-techno-pads-part-1
- MusicTech, Chicago-style acid bassline: https://musictech.com/guides/essential-guide/how-to-create-a-chicago-style-acid-house-bassline
- Native Instruments blog:
  - https://www.native-instruments.com/blogs/blog/90s-house-music
  - https://www.native-instruments.com/blogs/blog/acid-house
  - https://blog.native-instruments.com/drum-programming-101/
- Ableton Learning Music:
  - tempo and genre: https://learningmusic.ableton.com/make-beats/tempo-and-genre.html
  - backbeats: https://learningmusic.ableton.com/make-beats/backbeats.html
  - bars: https://learningmusic.ableton.com/make-beats/bars.html
  - song structure: https://learningmusic.ableton.com/song-structure/song-structure.html
  - keys and scales: https://learningmusic.ableton.com/notes-and-scales/keys-and-scales.html
  - modes: https://learningmusic.ableton.com/advanced-topics/modes.html
  - chords: https://learningmusic.ableton.com/chords/chords.html
  - seventh chords: https://learningmusic.ableton.com/advanced-topics/seventh-chords.html
- MusicRadar, club track intros: https://www.musicradar.com/how-to/how-to-create-the-perfect-intro-for-your-club-track [search summary]
- MusicRadar, build-ups and breakdowns: https://musicradar.com/how-to/build-up-break-down [search summary]
- Attack Magazine Deconstructed, *No UFO's*: https://www.attackmagazine.com/technique/deconstructed/model-500-no-ufos/ [search summary]

### Sound design and mixing
- Sound On Sound, Synth School parts 2 and 4:
  - https://www.soundonsound.com/techniques/synth-school-part-2
  - https://www.soundonsound.com/techniques/synth-school-part-4
- Ableton Learning Synths (cited as links only; the text wouldn't load): https://learningsynths.ableton.com/
- iZotope:
  - kick and bass: https://www.izotope.com/en/learn/how-to-mix-kick-and-bass
  - sidechain: https://www.izotope.com/en/learn/11-creative-sidechain-compression-techniques.html
  - reverb pre-delay: https://www.izotope.com/en/learn/reverb-pre-delay
  - saturation: https://www.izotope.com/en/learn/what-is-audio-saturation
  - EQ cheat sheet: https://www.izotope.com/community/blog/eq-cheat-sheet
  - gain staging [search summary]: https://www.izotope.com/en/learn/gain-staging-what-it-is-and-how-to-do-it
  - panning [search summary]: https://www.izotope.com/en/learn/10-tips-for-better-mixes-through-panning.html
- Britannica, syncopation: https://www.britannica.com/art/syncopation-music

### Weakly sourced claims (flagged)
- Mirage and R-8 in house; the DX7 "Bass 1" preset; the "Detroit chord" as a one-finger minor 7th (forum only); Dorian/Phrygian as typical techno modes; typical track length; the exact 303 glide time in ms (not sourced, so omitted).
