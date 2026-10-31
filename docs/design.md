# Strudel Workshop — Phase 2 Design

_Builds on [research.md](research.md). Section references in this doc (§1, §2…) point to sections of **this** document. References to the research doc are written "research §N", and skill IDs (B1, I5, E8…) and gap IDs (G1…) come from that doc. Nothing here is final until the open decisions in [§9](#9-open-decisions-for-you) are made._

Conventions used throughout:
- **1 cycle = 1 bar of 4/4.** Tempo is written `setcpm(BPM/4)`.
- **Code is the single source of truth.** The GUI reads code by parsing it and writes code by splicing text. There is no hidden model that could disagree with the editor.
- **Never silently rewrite.** If a GUI edit would change the *style* of hand-written code (for example, turning `"bd(3,8)"` into explicit steps), it asks first.

---

## 1. Curriculum (2a)

### 1.1 Lesson anatomy

Every lesson is a typed TypeScript object (see §7.4). Because of that, the test suite can transpile, evaluate (with no audio), and query every starter and solution.

| Field | Content |
|---|---|
| `goal` | One sentence, e.g. "Make a 909 kick play on every beat." |
| `concept` | 80–200 words of plain language, with one diagram or audio example where it helps |
| `starter` | The code loaded into the editor |
| `task` | Guided steps, each with an automatic **check** (see below) |
| `challenge` | Optional; it also has a check |
| `solution` | Revealed by "Show solution". It goes into a diff view first; you choose "Use this code" to load it |
| `youNowKnow` | Summary bullets, plus the list of Strudel functions introduced (each linked to the reference page) |
| `skills` | Skill IDs from research §1 |

**Checks.** Checks are music-aware rather than text-matching. We evaluate the learner's code to a pattern (no audio) and run a predicate over `pattern.queryArc(0, n)`. Example: *"a `bd` event starts at 0, ¼, ½, ¾ of every cycle"*. This means `s("bd*4")`, `s("bd bd bd bd")`, and `s("bd!4")` all pass, which teaches that there are many ways to write the same thing. A check can also look at the parsed code, e.g. "uses `.bank(…)`". All checks show a plain hint when they fail.

### 1.2 Lesson list

**Beginner — "First groove"** (mostly making atoms, plus the first `stack`)

| # | Title | Goal | Introduces |
|---|---|---|---|
| 1 | Press Play | Make a kick play once per bar and learn what a cycle is | `s()`, Play/Stop, cycles |
| 2 | Four on the Floor | A 909 kick on every beat at 124 BPM | `*`, `.bank()`, `setcpm()` |
| 3 | Steps and Rests | A clap on beats 2 and 4 | spaces = steps, `~`, `[ ]` |
| 4 | Stacking Parts | Kick and clap together, each with a name | `const`, `stack()` |
| 5 | The Offbeat Hat | An open hat on every "and" | offbeats, `[~ oh]*4` |
| 6 | Sixteenths and Dynamics | Closed hats on 16ths with accents | `hh*16`, `.gain("…")`, patterned arguments |
| 7 | Drum Machine Shopping | Swap between the 808, 909, and 707 | `.bank()` names, `n()`/`:` variants, `< >` |
| 8 | Your First Bassline | An offbeat sawtooth bass in C | `note()`, octaves, `s("sawtooth")` |
| 9 | Dark and Bright | Tame the bass with a low-pass filter | `.lpf()`, cutoff |
| 10 | **Project: Warehouse Loop** | Kick, clap, hats, and bass, saved to your library | library save, review |

**Intermediate — "Sound and harmony"** (sound design inside atoms, modifiers, molecules)

| # | Title | Goal | Introduces |
|---|---|---|---|
| 11 | Swing It | Shuffle the hats like an MPC | `.swingBy()` (GUI shows swing %) |
| 12 | Off the Grid | Syncopated percussion and Euclidean rhythms | `(k,n,rot)`, rim/cb/perc |
| 13 | Every Fourth Bar | A fill every 4 bars, changes every 2 | `< >` across bars, `!`, `@`, `.lastOf()` |
| 14 | Keys and Scales | Write a bassline using scale degrees | `n().scale("C:minor")`, `const key` |
| 15 | The Minor 7th Stab | A classic house chord stab | `,` chords, `chord().voicing()` |
| 16 | Progressions | Two chords alternating over 4 bars, with the bass following the root | `< >` chords, `rootNotes()` |
| 17 | Waveforms | Hear sine, triangle, square, saw, supersaw | synth sounds, `supersaw` params |
| 18 | Envelopes | Turn a pad into a pluck | `attack/decay/sustain/release`, `.adsr()` |
| 19 | Squelch | Resonance and the filter envelope | `.lpq()`, `.lpenv()`, `.lpdecay()`, `.ftype("ladder")` |
| 20 | Space | Reverb on the clap, a dub delay on the stab | `room`, `roomsize`, `delay`, `delaysync`, `delayfeedback`, **`orbit`** |
| 21 | Grit and Width | Overdrive, bitcrush, and panning | `distort`, `crush`, `pan`, `jux` |
| 22 | Movement | A filter that breathes over 8 bars | signals, `.range()`, `.slow()`, `.seg()`, `.lfo()` |
| 23 | Make a Modifier | Write a reusable "dub delay" and apply it | arrow functions `x => x…`, applying a modifier to a part |
| 24 | **Project: Deep Groove** | A drum molecule and a harmonic bed, mixed and saved | molecules, gain balance |

**Expert — "The track"** (the acid voice, arrangement, the mix)

| # | Title | Goal | Introduces |
|---|---|---|---|
| 25 | Acid I: The Line | A 16-step 303-style line | ladder filter, `drive`, square vs saw |
| 26 | Acid II: Accents and Slides | Accents as velocity + filter env, plus a slide workaround (be honest about G1) | patterned `velocity`/`lpenv`, `penv`/`pattack`, `clip` |
| 27 | Acid III: The Sweep | A 32-bar cutoff sweep | long signals, `saw.slow(32)` |
| 28 | Kick vs Bass | Sidechain ducking and a clean low end | `duckorbit`, `duckdepth`, `duckattack`, `hpf` carving |
| 29 | Phrases and Sections | Build intro, drop, and outro as sections | `arrange()`, 8/16/32-bar phrasing |
| 30 | Tension and Release | A build-up and a breakdown | noise riser, `hpf` sweep, `ply`/`fast` rolls, `mask` |
| 31 | Never the Same Twice | Controlled randomness | `degradeBy`, `sometimesBy`, `rand`, `perlin`, `seed` |
| 32 | Mixing in Strudel | Levels, headroom, carving, compression, and what Strudel can't do (G6) | `gain`/`postgain`, `compressor`, `hpf`/`lpf` |
| 33 | **Capstone: Acid Warehouse** | A full arranged track, written by you | everything |

**Capstone shape.** Seven sections, 160 bars at 124 BPM, about 5:10. The learner builds it across three checkpoints: parts, then sections, then arrangement. The GUI is available, but each checkpoint's check passes only on code the learner wrote. "You now know" lists all ~60 functions used.

| Section | Bars | What plays |
|---|---|---|
| Intro | 16 | Drums only; DJ-friendly |
| Build | 16 | Bass enters; acid filter opening; hats added |
| Drop | 32 | Everything |
| Breakdown | 16 | No kick; chords and acid exposed; riser |
| Drop 2 | 32 | Everything plus a variation |
| Outro | 16 | Drums only |
| Tail | 32 | Optional |

### 1.3 Two lessons written out in full (format examples)

**Lesson 2 — Four on the Floor**
- *Goal:* make a 909 kick play on every beat at 124 BPM.
- *Concept:* Strudel thinks in **cycles**. We'll treat one cycle as one bar of four beats. Whatever is inside the quotes is squeezed into one cycle, so `"bd bd bd bd"` gives four evenly spaced kicks per bar. That is "four on the floor", the heartbeat of house. `*4` is shorthand for "repeat 4 times within the step". `setcpm(124/4)` sets 124 beats per minute: 31 cycles (bars) per minute, 4 beats each.
- *Starter:*
  ```js
  setcpm(124/4)
  s("bd")
  ```
- *Task:*
  1. Make the kick play 4 times per bar. Check: bd onsets at 0, ¼, ½, ¾.
  2. Make it a 909 with `.bank("RolandTR909")`. Check: every event has `bank = RolandTR909`.
- *Challenge:* write it a second way that sounds identical. Check: same events, different text.
- *Solution:*
  ```js
  setcpm(124/4)
  s("bd*4").bank("RolandTR909")
  ```
- *You now know:* `setcpm`, `s`, `*`, `.bank`.

**Lesson 26 — Acid II: Accents and Slides**
- *Concept:* on a TB-303, an accented note is louder, *and* its filter opens further and closes faster. Strudel has no accent button, so we build an accent out of what it really is: a pattern of loudness (`velocity`) and a pattern of filter envelope depth (`lpenv`) that line up step for step. The 303's slide (a pitch glide into the next note) doesn't exist in Strudel (G1). We fake it with a pitch envelope that starts a few semitones away and glides into the note. It's close, not exact.
- *Starter:* the line from lesson 25.
- *Task:*
  1. Add `.velocity("1 .6 .6 1 .6 .6 1 .6 …")`.
  2. Add `.lpenv("6 3 3 6 …")`, with accents on the same steps.
  3. On one step, add a slide: `.penv("0 0 0 -5 0 …").pattack(.05)`.
- *Solution / you now know:* `velocity`, `lpenv`, `penv`, `pattack`, `clip`.
- _[Depends on the Phase 3 prototype of the slide workaround. If it sounds poor, the lesson keeps only the accent part and explains why.]_

---

## 2. Building-block model (2b): evaluated

### 2.1 The proposed atomic model

`Atom → Modifier → Molecule → Section → Track`

**Where it works**
- Atoms map cleanly onto Strudel. Each `const kick = s(…)…` is one self-contained pattern expression. Round-tripping a *narrow* atom is very doable (research §5.8).
- Composition in Strudel *is* function application (`stack`, `arrange`, `f(x)`), so the higher levels compile to small, readable code.
- It maps onto how producers think: parts, then a groove, then sections, then a song.

**Where it breaks down**
1. **Modifier vs. orbit semantics.** Per-voice effects (`lpf`, `distort`, `gain`) apply fine to a molecule: `stack(...).lpf(800)` filters every member. But **reverb and delay are per-orbit** (G4). Applying "dub delay" to a molecule silently overwrites the delay settings of any other part on the same orbit. A modifier that contains a send has to carry an orbit, and the system has to allocate orbits project-wide. That is a global concern hiding inside a "reusable local" block.
2. **Sections aren't just molecules.** A section is mostly "which parts are playing, and how they're altered for this section": a filtered-down bass in the build, kick-less drums in the breakdown. Modelling every per-section variant as a new molecule multiplies blocks (`dropDrums`, `buildDrums`, `breakDrums`…). What a section really needs is **parts + per-use modifiers**, which is a matrix, not a hierarchy.
3. **Section vs. Track is a thin distinction.** A track is just `arrange` over sections. Two levels with one concept between them adds vocabulary for a beginner without adding power.
4. **Atoms aren't context-free.** A bassline is only "correct" relative to a key and the chords. A molecule of `bass` + `chords` saved in different keys clashes (design question 1). Drums are context-free; pitched atoms aren't.
5. **Molecules of molecules** (`groove = stack(drums, bed)`) are natural, but they make "reference vs copy" and change propagation recursive.
6. **Time-relative patterns inside `arrange`.** `saw.slow(16)` in a build, or `.lastOf(4, fill)`, depends on the *global* cycle number. Whether `arrange` restarts the cycle count per section is **[UNVERIFIED]**. If it doesn't, a sweep only lines up when sections start on multiples of its length. This affects any section-level model, not just this one, but the atomic model hides it.

### 2.2 Alternative A — "Parts + Arrangement Matrix" (DAW-like, flat)

- A project is a flat list of **parts** (atoms) plus one **arrangement**.
- The arrangement is a grid: rows are parts, columns are sections (each with a length in bars), and each cell is *off*, *on*, or *on + modifier*.
- There are no molecules; grouping is only visual (folders/colours).
- **Pros:** one concept for structure, and it matches Ableton's session/arrangement view, which most tutorials assume. Per-section variation is a cell property. Orbit allocation is easy because there's one flat list.
- **Cons:** no reusable "drum groove" you can drop into another project as one unit. The code for big matrices gets verbose (many `.mask`s).

### 2.3 Alternative B — "Lenses on free code" (no model)

- There are no block types. The GUI offers *lenses* (step grid, knob panel, chord picker) on whatever recognizable expression the cursor is in.
- **Pros:** maximum freedom, and the code reads exactly as written.
- **Cons:** no library structure, no arrangement GUI, weak curriculum scaffolding. The "custom code" scoping becomes "this expression" with no named unit. Good for the sandbox; insufficient on its own.

### 2.4 Recommendation: a trimmed hybrid, "Parts, Modifiers, Groups, Arrangement"

| Level | What it is | Code form |
|---|---|---|
| **Part** (= atom) | One musical line | `const kick = s("bd*4").bank("RolandTR909")` |
| **Modifier** | A reusable function | `const dubDelay = x => x.delay(.4).delaysync(3/16).delayfeedback(.55)` |
| **Group** (= molecule, **one level only**) | A named `stack` of parts, optionally with modifiers | `const drums = stack(kick, clap, hats)` |
| **Arrangement** (= sections + track merged) | Sections, each a stack of parts/groups with per-use modifiers, combined by one `arrange(...)` | see §3.3 |

What changes from your proposal:
- **Sections and Tracks merge** into one Arrangement level. Sections are still named consts in the code, so you still *see* `const drop = …`, but the GUI edits them together as a matrix.
- **Groups are one level deep.** A group can't contain a group. That keeps propagation simple. Hand-written nesting is allowed; it just becomes custom code.
- **Orbits are allocated by the project, not by blocks.** Any part or modifier that uses `room`/`delay`/`duckorbit` gets a project-assigned `.orbit(n)`, inserted visibly into the code and explained in lesson 20. The GUI warns if two sends collide on one orbit.

The curriculum still introduces the levels in your order. Only the top two levels are merged.

**This is decision D1** (§9). I'd like you to pick one of: your 5-level model, the hybrid, or Alternative A.

### 2.5 Design question 1: shared context (key, scale, tempo)

**Tempo** lives only at the project level, as code: `setcpm(124/4)`.
- Parts never contain tempo. They're cycle-relative, so they combine at any tempo.
- Library parts store an informational `bpmHint`.
- If `setcpm` appears inside a part, that part is flagged custom ("tempo belongs in the header").

**Key** lives in the project header as a const:
```js
setcpm(124/4)            // 124 BPM, 1 cycle = 1 bar
const key = "C:minor"    // used by scale-degree parts
```
Pitched parts come in two styles. **This is decision D3.**
- **Absolute notes** (`note("c2 eb2 g2")`). Most readable for beginners (lessons 8–13). The part's key is stored as metadata (`meta.key`).
- **Scale degrees** (`n("0 2 4").scale(key)`). Key-agnostic: the part follows the project key automatically. Introduced in lesson 14 and recommended for library reuse.

**Mismatch detection is data-driven, not metadata-driven.**
1. Query each pitched part for 4–16 cycles.
2. Collect its pitch classes.
3. Compare them to the project scale (via tonal).

If a part uses notes outside the scale, its card shows: *"bass uses E♮ and A♮ — not in C minor."* The fixes offered:
- **Transpose to fit:** adds a visible `.transpose(n)`.
- **Convert to scale degrees:** asks before rewriting.
- **Ignore:** chromatic notes can be intentional.

Metadata keys are only a fallback, for parts that can't be queried.

### 2.6 Design question 2: reference vs. copy (decision D2, I'm not choosing)

| Option | Behaviour | Pros | Cons |
|---|---|---|---|
| **R1. Copy with origin** | Adding a library part to a project copies its code. The copy records `origin: {id, version}`. If the library item changes later, the copy shows "update available" with a diff; you accept or ignore it. | Predictable. What's in the editor is what plays, and the project is self-contained. Matches "code is the source of truth": nothing changes behind your back. | Fixes don't propagate automatically, and you can end up with many slightly different copies. |
| **R2. Live reference** | The project code says `const kick = lib("my-909-kick")` (or the system injects library code at evaluate time). | One edit updates every project. | The code you see isn't the code that plays. That breaks the learning goal and requirement 3. Projects aren't portable without the library. |
| **R3. Linked copy** | Like R1, but while the copy is unchanged it **auto-updates** silently. Once you edit it locally it detaches and shows "update available". | Convenient while still showing the real code. | Code can change under you (visibly, with highlight and toast, but unasked). The "linked/detached" state is one more concept to learn. |

**Within a project**, groups and sections reference parts **by name** (JS identifiers), which is live by nature: edit `kick` and `drums = stack(kick, …)` changes. That's just how JS works, and it's good to learn. Reference vs. copy only matters **between the library and projects**.

My recommendation is **R1**, because it is the only option where the code on screen is always exactly what plays and nothing changes without your click. R3 is the reasonable runner-up.

### 2.7 Design question 3: code generation (exact compiled output)

The project file is one code buffer, divided into **regions** by comment banners. The banners are generated, but harmless if deleted. Every block is one top-level `const` statement. The final expression is what plays.

**Molecule/group-level project** (lesson 24 output):
```js
// ── setup ─────────────────────────────
setcpm(124/4)            // 124 BPM · 1 cycle = 1 bar
const key = "C:minor"

// ── parts ─────────────────────────────
const kick = s("bd*4").bank("RolandTR909")
const clap = s("~ cp ~ cp").bank("RolandTR909").room(.25).orbit(2)
const hats = s("[~ oh]*4").bank("RolandTR909").gain(.6)
const bass = n("[~ 0]*4").scale(key).s("sawtooth").octave(2)
  .lpf(500).decay(.15).sustain(0)
const stab = chord("<Cm7 Fm7>").voicing().s("sawtooth")
  .lpf(1400).decay(.12).sustain(0).struct("[~ x]*2")

// ── modifiers ─────────────────────────
const dubDelay = x => x.delay(.4).delaysync(3/16).delayfeedback(.55).orbit(3)

// ── groups ────────────────────────────
const drums = stack(kick, clap, hats)
const bed   = stack(bass, dubDelay(stab))

// ── play ──────────────────────────────
stack(drums, bed)
```

**Section and track level** (lesson 29+ output, using the hybrid model):
```js
// ── modifiers ─────────────────────────
const dubDelay  = x => x.delay(.4).delaysync(3/16).delayfeedback(.55).orbit(3)
const riseOver  = bars => x => x.lpf(saw.range(300, 6000).slow(bars))

// ── sections ──────────────────────────
const intro     = stack(kick, hats)
const build     = stack(kick, hats, clap, riseOver(16)(bass))
const drop      = stack(drums, bass, dubDelay(stab), acid)
const breakdown = stack(hats, dubDelay(stab), acid.lpf(800))
const outro     = stack(kick, hats)

// ── arrangement ───────────────────────
arrange(
  [16, intro],
  [16, build],
  [32, drop],
  [16, breakdown],
  [32, drop],
  [16, outro],
)
```

Readability rules for the generator:
- One block per `const`.
- Method chains wrap at about 60 columns, with continuation lines indented 2 spaces.
- Numbers are written plainly (`.25`, not `0.25000`).
- Tempo is always `BPM/4`.
- The generator never emits code a lesson hasn't introduced yet. The GUI hides controls for unintroduced functions in lesson mode; in the sandbox everything is available.
- Banners and the order of consts are the generator's *defaults* only. Hand reordering is respected, because the parser identifies blocks by name, not position.

Curried modifiers like `riseOver(16)(bass)` are a JS idiom the learner sees in lesson 30. If you find them unreadable, the alternative is to generate concrete modifiers (`const rise16 = x => …`). This is a minor item in D1.

### 2.8 Design question 4: hand edits at each level

The smallest unit that can become "custom" is **one control** inside a part, not the whole part.

| Level | Recognized shape | Hand edit stays editable when… | Becomes **custom** when… | Scope of custom |
|---|---|---|---|---|
| **Part** | `const NAME = ROOT(...).method(args)…` with ROOT ∈ {`s`, `sound`, `note`, `n`, `chord`} | The changed method is allowlisted and its arguments are literals or mini strings that are representable | (a) The root isn't recognized (`stack(…)`, `cat(…)`, a function call) → **whole part custom** (code-only card, still playable, still referenced by groups). (b) An argument isn't representable (`.gain(sine.range(.4,.8))`) → **that control only** shows "custom"; the others still work. (c) A method isn't allowlisted (`.sometimesBy(.3, …)`) → it's shown as a read-only "custom code" chip. If it's **structure-affecting** (`fast`, `slow`, `rev`, `struct`, `mask`, `ply`, `off`, `every`/`firstOf`/`lastOf`, `euclid*`, `swingBy`), the step grid becomes **view-only**: it shows the queried result but doesn't allow editing, because the grid would no longer match what plays. Sound controls keep working. | Control, grid, or part |
| **Modifier** | `const NAME = x => x.method(args)…` | Same rules as part chains | The body isn't a simple chain (block body, conditionals, different parameter name) | Modifier |
| **Group** | `const NAME = stack(ARG, …)`, where ARG = identifier, `mod(identifier)`, or `identifier.method(literal)` from the allowlist | Members are added, removed, or reordered by hand | Any other argument shape (inline `s("…")`, `cat`, spread) | Group. Its members are untouched and still editable. |
| **Section** | Same shape as a group | Same | Same | Section |
| **Arrangement** | The final statement is `arrange([NUM, IDENT], …)` or `stack(IDENT, …)` | Rows reordered or lengths changed | Anything else (e.g. `pick`, `cat`, a computed array) | Arrangement matrix only |
| **Setup** | `setcpm(NUM/4)` or `setcpm(NUM)`; `const key = "…"` | Same | `setcps`, expressions | Tempo control shows "custom". Transport still works by evaluating. |
| Anything else | Comments, extra consts, helper functions | Preserved byte for byte, never touched | n/a | n/a |

**Syntax errors.** If acorn can't parse the whole buffer, the GUI keeps the last good model, greys out all controls, and shows "Fix the syntax error on line N to re-enable controls". It never writes while the code is unparseable. (`acorn-loose` could recover partial trees, but partial trees risk wrong splices. Rejected for writes.)

**Concurrency guard.** Every GUI edit is `{from, to, expectedText, insert}`. If `expectedText` no longer matches at that range, the edit is dropped and the GUI re-parses. This guarantees the GUI can't clobber something you typed in the meantime.

### 2.9 Design question 5: storage

localStorage keys, all versioned:

| Key | Content |
|---|---|
| `sw:library:v1` | `LibraryItem[]` |
| `sw:projects:v1` | `Project[]`; the sandbox is a project |
| `sw:progress:v1` | lesson progress (§5.5) |
| `sw:settings:v1` | UI preferences |

```ts
type BlockKind = 'part' | 'modifier' | 'group' | 'section' | 'arrangement';
interface LibraryItem {
  id: string;            // nanoid
  kind: BlockKind;
  name: string;          // const name, a valid JS identifier
  code: string;          // the full `const name = …` statement
  role?: 'kick'|'clap'|'snare'|'hats'|'perc'|'bass'|'chords'|'lead'|'acid'|'pad'|'fx'|'other';
  tags: string[];
  key?: string;          // fallback metadata for absolute-note parts
  bpmHint?: number;
  requires: string[];    // names of parts/modifiers it references (groups and sections)
  version: number;       // ++ on each save
  origin?: { libraryId: string; version: number }; // for copies (R1)
  source?: { lessonId: string };
  createdAt: string; updatedAt: string;
}
interface Project {
  id: string; name: string;
  code: string;                      // the whole buffer: source of truth
  blockMeta: Record<string, { libraryOrigin?: {id: string; version: number}; tags?: string[] }>; // keyed by const name
  createdAt: string; updatedAt: string;
}
```
- **Metadata lives in a sidecar** (`blockMeta`) keyed by const name, not in code comments. That keeps the code clean.
  - If you rename a const by hand, the sidecar entry is re-keyed when the parser sees exactly one block disappear and one appear with an identical body. Otherwise the metadata is orphaned, which is harmless.
- **Import/export:** `{ "format": "strudel-workshop", "version": 1, "exportedAt": "...", "items": [...], "projects": [...] }`.
  - Imports are validated with zod.
  - On an id collision you choose *keep both* / *replace* / *skip*.
  - An item whose `requires` are missing imports with a warning.
- **Size:** the code is tiny. A 5 MB localStorage quota holds thousands of items. Writes are debounced (500 ms) and wrapped in try/catch, with a visible "storage full / unavailable" banner.

### 2.10 Design question 6: does the curriculum fit the hierarchy?

Mostly, with one adjustment: **you can't make a groove without stacking**, so a minimal `stack` of named parts appears in Beginner lesson 4. Formal groups wait for lesson 24.

| Tier | Hierarchy level | Lessons |
|---|---|---|
| Beginner | Parts (drum parts, simple bass), plus a bare `stack` | 1–10 |
| Intermediate | Parts with full sound design, Modifiers (23), Groups (24) | 11–24 |
| Expert | Arrangement (sections + track), mixing across the project | 25–33 |

### 2.11 Candidate GUI controls per level (for you to choose: D4)

**Drum part** (choose 1–2)

| Option | Writes | Pros | Cons |
|---|---|---|---|
| **D-a. 16-step grid** (one row per part, optional velocity lane, page per bar for multi-bar parts) | Beat-grouped mini: `"[bd ~ ~ ~] [bd ~ bd ~] …"`, collapsed where unambiguous (`"bd*4"`) | Familiar from the 909 itself; instant; shows the bar visually | Hides mini-notation's power; long strings; the collapse rules must be predictable |
| **D-b. Mini-notation builder** (text input with live explanation tree: hovering a token shows "this `*4` repeats `bd` 4 times in one beat"; palette of tokens) | The string you type | Teaches the actual language; never rewrites style | Slower for pure beginners; less "toy-like" |
| **D-c. Rhythm knobs** (hits / steps / rotation, plus subdivision) | `"bd(3,8,2)"` or `"hh*16"` | Great for percussion and techno; one control, one function | Can't express arbitrary patterns |

**Pitched part** (bass/acid/lead)

| Option | Writes | Pros | Cons |
|---|---|---|---|
| **P-a. 303-style step sequencer** (16 steps × note + octave ± + accent + slide toggles) | `note("…")` plus `velocity("…")`/`lpenv("…")` for accents and `penv` for slides | Era-authentic; teaches what accent and slide *are* in code | Slide is a workaround (G1); writes 3 aligned patterns |
| **P-b. Mini piano roll** (1–4 bars, scale-highlighted rows) | `note("…")` or `n("…").scale(key)` | Visual pitch; good for riffs and bass | More UI to build; overlapping notes are tricky in mini |
| **P-c. Scale-degree tracker** (numbers 0–7 per step, key from the header) | `n("0 ~ 3 ~ …").scale(key)` | Key-agnostic parts; very close to the code | Abstract for total beginners |

**Chords**

| Option | Writes | Pros | Cons |
|---|---|---|---|
| **C-a. Chord-per-bar picker** (choose a chord name from scale-fitting suggestions) | `chord("<Cm7 Fm7>").voicing()` | Fast; teaches progressions | `voicing()` hides the actual notes |
| **C-b. Note stacker** (tick notes on a mini keyboard per chord) | `note("<[c3,eb3,g3,bb3] [f3,ab3,c4,eb4]>")` | Transparent; teaches what a chord is | Verbose code |
| **C-c. Both, toggle** | Either | Shows the equivalence | More work |

**Sound controls** (all parts)

| Option | Pros | Cons |
|---|---|---|
| **S-a. Panel of sliders/knobs only for methods present in the code, plus an "Add control" menu** that inserts `.lpf(800)` etc. | Every visible control maps to visible code | Panel layout changes as code changes |
| **S-b. Fixed "synth panel"** (filter / envelope / FX sections always shown, inactive controls dimmed) | Stable layout like real hardware | Tempting to add code the learner doesn't understand yet |
| **S-c. Inline scrubbing in the editor** (drag a number in the code to change it, Bret Victor style) | The tightest code↔control link; no separate panel | Discoverability; not touch-friendly |

**Modifiers:** M-a, a chain list (add effect → parameters, reorder disabled because Strudel's order is fixed, G5); M-b, a preset gallery with "Apply to…" picker; M-c, code-only with autocomplete and docs (no GUI).

**Groups:** G-a, a **mixer strip** per member (gain, pan, mute/solo, orbit badge); G-b, card bin (drag parts in/out); G-c, layered punchcard preview with member toggles.

**Arrangement:** A-a, **matrix** (rows = parts/groups, columns = sections with bar lengths, cells off/on/modifier); A-b, linear timeline of draggable section blocks; A-c, form strip (`intro 16 | build 16 | …`) above a per-section stack editor.

**My picks if you want defaults:**
- Drums: D-a + D-b toggle
- Pitched: P-a for acid, P-c otherwise
- Chords: C-c
- Sound controls: S-a
- Modifiers: M-a
- Groups: G-a
- Arrangement: A-a (it pairs with the hybrid model)

---

## 3. Code ↔ GUI sync strategy (2c)

### 3.1 Pipeline

```
 CodeMirror doc ──(debounced 150 ms)──► parseProject(code)
     ▲                                     │  acorn (ecmaVersion 2022, ranges)
     │                                     ▼
     │                         ProjectModel { setup, blocks[], final, diagnostics }
     │                                     │  per block: kind, name, range, status
     │                                     │  ('gui' | 'partial' | 'custom'), controls[]
     │                                     ▼
     │                               GUI panels render
     │                                     │  user action
     │                                     ▼
     └──── applyEdits([{from,to,expectedText,insert}], annotation 'gui') ◄── generator
              │
              └─► changed ranges get a 1.5 s highlight decoration (distinct from playing-note highlight)
```

- **Read path.** Parsing derives everything. Each control in the model carries the **exact source range** of the argument it controls.
- **Write path.** The generator produces the smallest text change: an argument literal, a method call inserted or removed, a stack member added. It's applied as a CM6 transaction annotated `gui`. Evaluate-on-change is optional (setting "auto-play GUI edits", default on while playing).
- **No reverse model.** After a GUI edit we re-parse; the GUI never trusts its own state over the code.

### 3.2 Atoms (parts): narrow parse and generate

**The allowlist, v1.** These are stored as a table, so the cheat sheet and the GUI share it.
- Roots: `s`, `sound`, `note`, `n`, `chord`.
- Methods:
  - Sound: `bank`, `n`, `scale`, `voicing`, `octave`, `transpose`, `gain`, `velocity`, `postgain`, `pan`, `speed`, `clip`.
  - Envelope: `attack`, `decay`, `sustain`, `release`, `adsr`.
  - Filter: `lpf`, `lpq`, `hpf`, `hpq`, `bpf`, `ftype`, `drive`, `lpenv`, `lpattack`, `lpdecay`, `lpsustain`, `lprelease`.
  - Effects: `room`, `roomsize`, `delay`, `delaysync`, `delayfeedback`, `orbit`, `distort`, `crush`, `duckorbit`, `duckdepth`, `duckattack`.
  - Synth: `unison`, `spread`, `detune`, `penv`, `pattack`, `struct`, `swingBy`.
- Each method declares its argument kind: `number` (with range), `enum`, `mini` (a mini-notation string), or `mini-number` (numbers patterned in mini, e.g. `.gain(".5 .3")`).

**Mini strings, read.** `mini2ast` checks the syntax. For the grid, we don't interpret the AST ourselves; we **query the evaluated pattern** for cycle 0..N on a 1/16 lattice. Anything that isn't on the lattice means a grid view isn't possible, and we fall back to the text builder (D-b). This keeps the grid honest: it always shows what plays.

**Mini strings, write.** We **only** regenerate a mini string the GUI owns, meaning it parses as **canonical grid form**. Canonical grid form is:
- four beat groups;
- each group a `~`, a single token, or `[a b c d]`;
- optionally collapsed to `"tok*4"` or `"[a b]*4"` when all four beats are identical.

If the string isn't canonical (e.g. `"bd(3,8)"`, `"bd!4"`, `"<bd sd>"`), the first grid click asks: *"Convert `bd(3,8)` to an editable step pattern? Your current notation will be replaced."* with a preview of the new string. Nothing changes without confirmation (requirement 5).

**Worked round trip: drum part.**
```js
const kick = s("bd*4").bank("RolandTR909").gain(.9)
```
1. Parse gives `part{name:'kick', root:s, controls:[mini@[16,22] 'bd*4', bank@[30,43], gain@[50,52]]}`. Query: bd at steps 0, 4, 8, 12, so the grid lights 4 cells. `"bd*4"` is canonical (collapsed).
2. You click step 14 (the last 16th's "and"). The grid serializes to `"bd bd bd [bd ~ bd ~]"`. That isn't uniform, so no collapse.
3. Edit: `{from:16, to:22, expectedText:'"bd*4"', insert:'"bd bd bd [bd ~ bd ~]"'}`. Only the string is highlighted.
4. Re-parse gives the same model, now with 5 hits. Done.
5. Slider gain 0.9 → 0.75: the edit is `{from:50, to:52, expected:'.9', insert:'.75'}`.

**Worked round trip: fallback to custom without breaking groups.**
```js
const hats  = s("hh*16").gain(".6 .3").sometimesBy(.2, x => x.speed(2))
const drums = stack(kick, clap, hats)
```
- `hats`: `sometimesBy` isn't allowlisted, so it shows as a custom chip. It's structure-affecting (random variation), so the grid is **view-only**. The `gain` mini-number lane still edits.
- `drums`: still a recognized group; its mixer strip for `hats` works. Group edits (level/mute) are applied **at the group level**, by wrapping the member as `hats.postgain(.8)` inside `stack(...)`. They never reach into the custom part. A later `.gain()` would *replace* the part's own gain pattern rather than scale it, so the mixer uses `postgain`. If the part already sets `postgain` itself, the mixer strip for it is disabled. **[UNVERIFIED: whether `.mul(gain(x))` scales cleanly is a better option; check in Phase 3.]**

Now you hand-edit `hats` to `const hats = cat(s("hh*16"), s("hh*8"))`. The root isn't recognized, so the **whole part is custom**: a code-only card with a "custom code" badge, controls disabled, preview still playable. `drums` is unaffected, because it references `hats` by name.

### 3.3 Composition levels: generated from structure, lightly parsed

Groups, sections, and the arrangement have tiny grammars (§2.8). The parse extracts identifiers and per-member allowlisted wrappers. GUI operations:

| GUI action | Code edit |
|---|---|
| Add a member | Insert `, name` before `)` |
| Remove a member | Delete `name` plus its comma |
| Reorder (matrix row) | Swap two argument ranges |
| Matrix cell on → off | Remove the member from that section's `stack(...)` |
| Apply a modifier in a cell | Wrap the argument `bass` → `riseOver(16)(bass)`; unwrapping reverses it |
| Change a section length | Edit the number in `[16, build]` |
| Insert a section | Add `const name = stack()` before the arrangement, plus a row `[16, name]` |

**Worked round trip: arrangement.**
- Matrix: turn on `acid` in `breakdown`. Edit: `const breakdown = stack(hats, dubDelay(stab))` becomes `stack(hats, dubDelay(stab), acid)`.
- Change breakdown from 16 to 8 bars: `[16, breakdown]` becomes `[8, breakdown]`.
- If you hand-edit the final statement to `"<intro drop>".pick({intro, drop})`, the matrix shows "custom arrangement". All sections, groups, and parts remain fully editable.

### 3.4 Testing (milestone 3)

- **Text round trip:** `parse(generate(model)) ≅ model` for every canonical form.
- **Musical round trip:** for each GUI operation, apply it and evaluate both the before and after code without audio. Then assert that `queryArc` differs **only** in the intended events.
- **Never-rewrite property:** a randomized test runs a GUI edit against hand-modified buffers and asserts that bytes outside the edit range are identical.
- **Lesson corpus:** every lesson starter and solution parses, evaluates, and passes or fails its checks as expected.
- **Risk to check first in milestone 3:** importing `@strudel/core`/`mini` under Vitest. Plain Node ESM fails on `@kabelsalat/web`. Mitigation: a Vitest `deps.inline` setting or alias for kabelsalat, or `environment: 'jsdom'`.

---

## 4. Shared-context and orbit management (cross-cutting)

- **Header block** (`setcpm`, `key`) is parsed into `ProjectModel.setup`. Transport tempo edits rewrite `setcpm(N/4)`.
- **Orbit allocator.** The project scans for `.orbit(n)` and for parts using `room`/`delay`/`duckorbit`. When the GUI adds a send to a part without an orbit, it inserts `.orbit(nextFree)`, visibly. A diagnostic flags two blocks on the same orbit with different send settings: "clap and stab share orbit 2: only one reverb setting will apply."
- **Sidechain** (lesson 28): `kick.duckorbit(2)` ducks everything on orbit 2. The GUI's "duck under kick" toggle on a part sets that part's orbit, plus `duckorbit` on the kick.

---

## 5. Pages and UX (2d)

### 5.1 Routes

| Route | Page |
|---|---|
| `/` | Landing: continue the current lesson, open the sandbox, view the library |
| `/learn` | Lesson map by tier, with progress |
| `/learn/[lessonId]` | Lesson view |
| `/library` | Library view |
| `/sandbox`, `/sandbox/[projectId]` | Free play |
| `/reference` | Cheat sheet |
| `/about` | License (AGPL-3.0), source link, credits (Strudel, sample sources) |

The footer appears on every page and links to the source and the license.

### 5.2 Lesson view (desktop)

```
┌───────────────────────────────────────────────────────────────────────┐
│ ◀ Lesson 2 of 33 · Four on the Floor            [Beginner] ▓▓░░░░░░  │
├──────────────────────┬────────────────────────────────────────────────┤
│ GOAL                 │ ▶ Play  ■ Stop   124 BPM ▾   bar 3 · beat 2   │  ← transport
│ Make a 909 kick…     ├────────────────────────────────────────────────┤
│                      │ 1  setcpm(124/4)                               │
│ CONCEPT              │ 2  s("bd*4").bank("RolandTR909")               │  ← editor (CM6)
│ Strudel thinks in…   │       ▔▔▔▔ playing-note highlight              │
│                      │                                                │
│ TASK                 ├────────────────────────────────────────────────┤
│ ☑ 1. Four kicks/bar  │ ⚠ [mini] parse error at line 2: …   (errors)   │
│ ☐ 2. Use the 909     ├────────────────────────────────────────────────┤
│ ✦ Challenge          │  GUI PANEL  (only controls this lesson allows) │
│ [Hint] [Solution]    │  kick ▢▣▢▢▣▢▢▢▣▢▢▢▣▢▢▢  bank [TR909 ▾]          │
│                      ├────────────────────────────────────────────────┤
│ YOU NOW KNOW (on ✓)  │  ░░▓░░░▓░░░▓░░░▓  punchcard                   │  ← visualization
└──────────────────────┴────────────────────────────────────────────────┘
```

- **Mobile:** single column with tabs (Lesson / Code / Controls). The transport is pinned at the bottom.
- **Keyboard:** Ctrl/Cmd+Enter plays or pauses (pause freezes the sound; play continues from the same beat, re-running the code first if it changed); Shift+Ctrl/Cmd+Enter or Alt+Enter re-runs the code while playing; Ctrl/Cmd+. stops at once, clears effect tails and goes back to bar 1.
- **Errors:** eval errors underline the line (from acorn `.loc` or the mini error position) and show plain-English help ("A quote is missing"). Runtime errors from the `strudel.log` event show as a toast, e.g. "sound 'bdd' not found: did you mean 'bd'?" (fuzzy match against loaded sound names).

### 5.3 Library view

- **Left:** filters by kind, role, tag, key, and source lesson.
- **Centre:** cards showing the name, a 1-bar punchcard thumbnail (from `queryArc`; no audio needed), the key/role chips, and the code snippet.
- **Card actions:** ▶ preview (plays solo at the project tempo), Add to project (copy, R1), Edit (opens a single-block editor), Tag, Duplicate, Delete (with confirmation), Export.
- **"Combine" mode:** select several parts and choose "Create group". This opens a new sandbox project containing the copies plus `stack(...)`.
- Import/export buttons sit in the header.

### 5.4 Sandbox

- The same layout as a lesson, without the lesson column.
- **Block outline sidebar:** a parse-derived list of setup, parts, modifiers, groups, sections, and arrangement. Each entry has its status badge (GUI / partial / custom). Clicking one scrolls the editor to it and opens its panel.
- All controls are available. Projects are saved continuously.

### 5.5 Progress tracking

- `sw:progress:v1` holds `{ [lessonId]: { status: 'new'|'started'|'done', tasksPassed: number[], challengePassed: boolean, lastCode: string, updatedAt } }`.
- Your last code per lesson is kept, so you can return to it.
- "Reset lesson" restores the starter code after a confirmation.
- No backend.

### 5.6 Reference page

- **Generated** from a typed table (`lib/reference/entries.ts`) built from research §3.
- Each entry has the name, aliases, signature, range/units, a one-line description, a runnable mini-example (click to play), the lesson that introduces it, and caveats (G-notes such as "one per orbit").
- The same table drives the GUI allowlist, editor autocomplete, and hover docs.
- A tests guard keeps it honest: every entry's example must evaluate without errors.

### 5.7 Visualization (cheap options only)

1. **Playing-note highlighting in the editor.** `@strudel/codemirror` `highlightMiniLocations`, driven by `@strudel/draw`'s `Drawer`. **Included.**
2. **Punchcard/pianoroll** in a panel canvas. `@strudel/draw` exposes pianoroll drawing functions; whether they accept our own canvas context is **[UNVERIFIED]**. Fallback: our own ~150-line canvas renderer from queried haps (we already query for checks).
3. **Scope/spectrum** (`.scope()`) draws on a full-page canvas, so it's a poor fit. Deferred.

---

## 6. Architecture (2e)

### 6.1 Principles
- **Two sanctioned Strudel import points, both client-only:**
  - `lib/audio/engine.ts`: playback, the repl, samples, highlighting.
  - `lib/strudel/pure.ts`: transpile, evaluate-to-pattern, `queryArc`, `mini2ast`. Used by the parser, checks, thumbnails, and tests.
  - Both use dynamic `import()`, and both are module-level promise singletons.
- **The engine has an interface; nothing else touches `@strudel/*`.** If upstream changes (`onSchedule`, research §5.6), only those files change.
- **CM6 `EditorState` is authoritative for text.** A small external store mirrors `{code, model, playback}` for React.

### 6.2 Engine interface
```ts
interface AudioEngine {
  init(): Promise<void>;                       // load modules, register synths, sample maps
  unlock(): Promise<void>;                     // resume AudioContext + initAudio (Play click)
  evaluate(code: string): Promise<EvalResult>; // { ok: true, pattern } | { ok: false, error: {message, line?, col?} }
  stop(): void;
  isPlaying(): boolean;
  getCycle(): number;                          // scheduler.now()
  preload(sounds: string[]): Promise<void>;    // loadBuffer for lesson sounds
  onLog(cb: (m: {message: string; type: string}) => void): Unsubscribe;   // strudel.log
  onPlayState(cb: (playing: boolean) => void): Unsubscribe;
  attachHighlighting(view: EditorView): Unsubscribe;  // miniLocations + Drawer loop
}
```

### 6.3 State management
- **Zustand** (small, framework-agnostic, works with `useSyncExternalStore`). Stores:
  - `editorStore`: code, model, diagnostics, `applyEdits`
  - `playbackStore`: playing, cycle, errors
  - `libraryStore`, `progressStore`: persisted
- Not Redux (too heavy). Not plain Context (re-render churn on every parse).
- **Parse runs on the main thread** (acorn is fast; a project is under 200 lines). We can move it to a worker later if needed.

### 6.4 File structure
```
app/
  layout.tsx                 // footer (source link, AGPL)
  page.tsx
  learn/page.tsx
  learn/[lessonId]/page.tsx  // server shell → <LessonClient> via next/dynamic ssr:false
  library/page.tsx
  sandbox/[[...projectId]]/page.tsx
  reference/page.tsx         // static table (no Strudel import needed to render)
  about/page.tsx
components/
  editor/CodeEditor.tsx      // CM6 view, gui-edit highlight, playing highlight
  transport/Transport.tsx
  errors/ErrorPanel.tsx
  blocks/
    PartPanel.tsx  StepGrid.tsx  MiniBuilder.tsx  PitchSequencer.tsx  ChordPicker.tsx
    SoundControls.tsx  ModifierPanel.tsx  GroupMixer.tsx  ArrangementMatrix.tsx
    BlockOutline.tsx  CustomBadge.tsx
  lesson/LessonPane.tsx  TaskList.tsx  SolutionDiff.tsx
  library/LibraryGrid.tsx  BlockCard.tsx  ImportExport.tsx
  viz/Punchcard.tsx
lib/
  audio/engine.ts            // ONLY playback importer of @strudel/*
  strudel/pure.ts            // ONLY pure (no audio) importer
  strudel/types.d.ts         // declare module shims
  sync/
    parseProject.ts          // acorn → ProjectModel
    allowlist.ts             // methods, arg kinds, ranges (shared with reference)
    miniGrid.ts              // canonical grid form ↔ string; lattice query
    generate.ts              // model ops → TextEdit[]
    applyEdits.ts            // expectedText guard
    diagnostics.ts           // key mismatch, orbit collision
  model/types.ts
  storage/{library,projects,progress,settings,schema}.ts   // zod
  lessons/checks.ts          // queryArc predicate helpers
  reference/entries.ts
content/lessons/
  01-press-play.ts … 33-capstone.ts
tests/
  sync/*.test.ts  lessons/*.test.ts  storage/*.test.ts
LICENSE                       // AGPL-3.0
```

### 6.5 Component tree (lesson page)
```
<LessonPage> (server: metadata only)
 └ <LessonClient> (client, ssr:false)
    ├ <LessonPane lesson tasks progress/>
    └ <Workbench projectCode>
       ├ <Transport/>          → engine.unlock/evaluate/stop, tempo → applyEdits(setcpm)
       ├ <CodeEditor/>         → editorStore (authoritative text), engine.attachHighlighting
       ├ <ErrorPanel/>         ← playbackStore.errors
       ├ <BlockPanels model allowedControls/>   → generate → applyEdits
       └ <Punchcard pattern/>  ← pure.query
```

### 6.6 Lesson checks
```ts
check: q => q.onsets('bd', { cycles: 2 }).equals([0, .25, .5, .75])
```
- `q` is a helper over `queryArc` results from the evaluated code.
- Checks run on each successful evaluate, and 500 ms after edits (pure evaluation, no audio).

---

## 7. Phase 3 risks to resolve first
1. A `next build` (Turbopack and webpack) with the pinned packages, plus Vitest importing core/mini (the kabelsalat issue). Milestone 1 and the first task of milestone 3.
2. ~~Whether `arrange` restarts cycles per section.~~ **Resolved (Phase 3, milestone 3):** it does. Each section plays from its own cycle 0, so `saw.slow(16)` in a 16-bar build sweeps exactly across the build (tests/sync/arrangeTiming.test.ts).
3. The `penv`-based slide (G1). Prototype in lesson 26.
4. The swing % → `swingBy` mapping, by ear (G12).
5. Whether `@strudel/draw` pianoroll accepts our own canvas context.
6. Whether a bare final expression interacts with `$:` labels (we avoid labels in generated code; the sandbox allows them).

---

## 8. Lesson list (titles)

**Beginner:** 1 Press Play · 2 Four on the Floor · 3 Steps and Rests · 4 Stacking Parts · 5 The Offbeat Hat · 6 Sixteenths and Dynamics · 7 Drum Machine Shopping · 8 Your First Bassline · 9 Dark and Bright · 10 Project: Warehouse Loop

**Intermediate:** 11 Swing It · 12 Off the Grid · 13 Every Fourth Bar · 14 Keys and Scales · 15 The Minor 7th Stab · 16 Progressions · 17 Waveforms · 18 Envelopes · 19 Squelch · 20 Space · 21 Grit and Width · 22 Movement · 23 Make a Modifier · 24 Project: Deep Groove

**Expert:** 25 Acid I: The Line · 26 Acid II: Accents and Slides · 27 Acid III: The Sweep · 28 Kick vs Bass · 29 Phrases and Sections · 30 Tension and Release · 31 Never the Same Twice · 32 Mixing in Strudel · 33 Capstone: Acid Warehouse

---

## 9. Decisions

**Decided 2026-10-31:** every recommendation in the "My lean" column below was accepted as written. Wireframes for review are in [wireframes/index.html](wireframes/index.html). Phase 3 starts after the wireframes are reviewed.

| # | Decision | Options | My lean (accepted) |
|---|---|---|---|
| **D1** | Building-block model | (a) your 5 levels; (b) **hybrid**: Parts / Modifiers / Groups (1 level) / Arrangement; (c) Alternative A: flat parts + matrix | (b) |
| **D2** | Library → project reuse | **R1** copy + "update available"; R2 live reference; R3 linked copy | R1 |
| **D3** | Default pitch style | Absolute `note()` first, scale degrees from lesson 14 (as in the curriculum); or scale degrees from the start | Absolute first |
| **D4** | GUI controls per level | See §2.11 (drums D-a/b/c, pitched P-a/b/c, chords C-a/b/c, sound S-a/b/c, modifiers M-a/b/c, groups G-a/b/c, arrangement A-a/b/c) | D-a+D-b, P-a+P-c, C-c, S-a, M-a, G-a, A-a |
| D5 | Generated output form | Final expression (`stack`/`arrange`) vs `$:` labels per part | Final expression |
| D6 | Curried modifiers (`riseOver(16)(bass)`) | Allow, or generate only concrete ones (`rise16`) | Concrete until lesson 30 |
| D7 | Lesson checks | Automatic (queryArc predicates) and self-report "mark done"; or self-report only | Both: auto, with manual override |
| D8 | Sample hosting | strudel.cc CDN now, self-host in polish; or self-host from the start | CDN now |
