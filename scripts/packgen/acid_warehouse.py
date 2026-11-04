"""Acid Warehouse, from a kick to a track: a line that rebuilds the core capstone one lesson at a time.
python3 scripts/packgen/acid_warehouse.py"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from common import *  # noqa: F401,F403

T = '// Acid Warehouse\nsetcpm(126/4)            // BPM ÷ 4 beats: 1 cycle = 1 bar'
KICK = 'const kick = s("bd*4").bank("RolandTR909")'
HATS = 'const hats = s("[~ oh]*4").bank("RolandTR909").gain(.55)'
CLAP = 'const clap = s("~ cp ~ cp").bank("RolandTR909").room(.2).orbit(2)'
TICKS0 = 'const ticks = s("hh*16").bank("RolandTR909").gain("[.4 .2 .3 .2]*4")'
TICKS = TICKS0 + '.swingBy(.16, 8)'
KEY = 'const key = "C:minor"'
BASS0 = 'const bass = n("[~ 0] [~ 0] [~ 0] [~ -2]").scale(key).s("sawtooth").octave(2).gain(.7).orbit(4)'
BASS = 'const bass = n("[~ 0] [~ 0] [~ 0] [~ -2]").scale(key).s("sawtooth").octave(2).gain(.7).orbit(4)\n  .lpf(450).decay(.15).sustain(0)'
LINE = '"[c2 c2 c3 c2] [eb2 c2 c3 g1] [c2 ~ bb2 c2] [c3 c2 eb2 g2]"'
ACID0 = f'const acid = note({LINE}).s("sawtooth").decay(.2).sustain(0).gain(.55).orbit(5)'
ACID1 = ACID0 + '\n  .ftype("ladder").lpf(900).lpq(18).lpdecay(.15)'
VEL = '  .velocity("[.6 1 .6 .6] [.6 .6 1 .6] [.6 .6 .6 .6] [1 .6 .6 .6]")'
LPENV = '  .lpenv("[3 6 3 3] [3 3 6 3] [3 3 3 3] [6 3 3 3]")'
ACID2 = ACID1 + '\n' + VEL
ACID3 = ACID2 + '\n' + LPENV
ACID4 = ACID3.replace('.lpf(900)', '.lpf(saw.range(300, 3000).slow(32))')
ACID5 = ACID4.replace('.lpq(18)', '.lpq(sine.range(15, 22).slow(16))')
STAB = 'const stab = chord("<Cm7 Fm7>").voicing().struct("[~ x]*2").s("sawtooth").lpf(1400).decay(.15).sustain(0).gain(.45)'
DUB = 'const dubDelay = x => x.delay(.4).delaysync(3/16).delayfeedback(.55).orbit(3)'
RISER = 'const riser = s("pink*16").hpf(saw.range(200, 6000).slow(16)).gain(.2)'
PUMP = 'const pump = x => x.duckorbit(4).duckdepth(.7)'

ACID = snd('sawtooth', where=[w('orbit', eq=5)])
BASSEL = snd('sawtooth', where=[w('orbit', eq=4)])
STAB1 = snd('sawtooth', where=[w('orbit', eq=1, default=1)])
STAB3 = snd('sawtooth', where=[w('orbit', eq=3)])


def code(*parts, final='stack(kick, hats)'):
    return '\n'.join([T, *parts, final])


# ---------- stage code, each lesson's solution is the next one's starter ----------
L1_start = T + '\n'
L1_s1 = code(KICK, final='stack(kick)')
L1_sol = code(KICK, HATS, final='stack(kick, hats)')

L2_s1 = code(KICK, CLAP, HATS, final='stack(kick, clap, hats)')
L2_s2 = code(KICK, CLAP, HATS, TICKS0, final='stack(kick, clap, hats, ticks)')
L2_sol = code(KICK, CLAP, HATS, TICKS, final='stack(kick, clap, hats, ticks)')

DRUMS = [KICK, CLAP, HATS, TICKS]
L3_s1 = code(KEY, *DRUMS, BASS0, final='stack(kick, clap, hats, ticks, bass)')
L3_sol = code(KEY, *DRUMS, BASS, final='stack(kick, clap, hats, ticks, bass)')

FIN5 = 'stack(kick, clap, hats, ticks, bass, acid)'
L4_s1 = code(KEY, *DRUMS, BASS, ACID0, final=FIN5)
L4_sol = code(KEY, *DRUMS, BASS, ACID1, final=FIN5)
L5_s1 = code(KEY, *DRUMS, BASS, ACID2, final=FIN5)
L5_sol = code(KEY, *DRUMS, BASS, ACID3, final=FIN5)
L6_s1 = code(KEY, *DRUMS, BASS, ACID4, final=FIN5)
L6_sol = code(KEY, *DRUMS, BASS, ACID5, final=FIN5)
L7_s1 = code(KEY, *DRUMS, BASS, ACID5, STAB, final='stack(kick, clap, hats, ticks, bass, acid, stab)')
L7_sol = code(KEY, *DRUMS, BASS, ACID5, STAB, '', '// ── modifiers ─────────────────────────', DUB,
              final='stack(kick, clap, hats, ticks, bass, acid, dubDelay(stab))')

PARTS = [KEY, '', '// ── parts ─────────────────────────────', *DRUMS, BASS, ACID5, STAB, '', '// ── modifiers ─────────────────────────', DUB]
SECT = '// ── sections ──────────────────────────'
INTRO = 'const intro = stack(kick, hats, ticks)'
DROP = 'const drop = stack(kick, clap, hats, ticks, bass, acid, dubDelay(stab))'
OUTRO = 'const outro = stack(kick, hats)'
L8_s1 = code(*PARTS, '', SECT, INTRO, DROP, OUTRO, final='drop')
ARR = '// ── arrangement ───────────────────────'
L8_sol = code(*PARTS, '', SECT, INTRO, DROP, OUTRO, '', ARR, final='arrange(\n  [16, intro],\n  [32, drop],\n  [16, outro],\n)')

PARTS9 = PARTS[:9] + [RISER] + PARTS[9:]
BUILD = 'const build = stack(kick, hats, ticks, bass, riser)'
BREAK = 'const breakdown = stack(hats, acid, dubDelay(stab))'
L9_s1 = code(*PARTS9, '', SECT, INTRO, BUILD, DROP, OUTRO, '', ARR, final='arrange(\n  [16, intro],\n  [16, build],\n  [32, drop],\n  [16, outro],\n)')
L9_sol = code(*PARTS9, '', SECT, INTRO, BUILD, DROP, BREAK, OUTRO, '', ARR,
              final='arrange(\n  [16, intro],\n  [16, build],\n  [32, drop],\n  [8, breakdown],\n  [16, outro],\n)')

# the mix: high-passes, then the pump, then the full arrangement
CLAPM = CLAP + '.hpf(200)'
HATSM = HATS + '.hpf(300)'
TICKSM = TICKS + '.hpf(400)'
STABM = STAB + '.hpf(200)'
PARTS10 = [KEY, '', '// ── parts ─────────────────────────────', KICK, CLAPM, HATSM, TICKSM, BASS, ACID5, STABM, RISER, '', '// ── modifiers ─────────────────────────', DUB]
ARR9 = 'arrange(\n  [16, intro],\n  [16, build],\n  [32, drop],\n  [8, breakdown],\n  [16, outro],\n)'
L10_s1 = code(*PARTS10, '', SECT, INTRO, BUILD, DROP, BREAK, OUTRO, '', ARR, final=ARR9)
DROPP = 'const drop = stack(pump(kick), clap, hats, ticks, bass, acid, dubDelay(stab))'
BUILDP = 'const build = stack(pump(kick), hats, ticks, bass, riser)'
PARTS10P = PARTS10 + ['// Duck only where the bass (orbit 4) plays: ducking a silent orbit is an error.', PUMP]
L10_s2 = code(*PARTS10P, '', SECT, INTRO, BUILDP, DROPP, BREAK, OUTRO, '', ARR, final=ARR9)
L10_sol = code(*PARTS10P, '', SECT, INTRO, BUILDP, DROPP, BREAK, OUTRO, '', ARR,
               final='arrange(\n  [16, intro],\n  [16, build],\n  [32, drop],\n  [8, breakdown],\n  [16, drop],\n  [16, outro],\n)')

K909 = kit('bd', 'oh', 'cp', 'hh')

lessons = [
    lesson('the-pulse', 'The pulse', 'Start the track: a 909 kick on every beat and open hats on the offbeats, at 126 BPM.',
           'This line of lessons builds one track, **Acid Warehouse**, the way a producer does: a loop that grows, then gets shaped. Each lesson starts from the code you finished in the one before.\n\nIt starts with the pulse. **Four on the floor** (a kick on every beat) is the heartbeat of house and techno, and an **open hat on every offbeat** gives it the push. 126 BPM is a touch faster than house; it suits acid.',
           L1_start,
           [task('Add a part called kick: a TR-909 kick on every beat, and play it.', 'const kick = s("bd*4").bank("RolandTR909"), then stack(kick).',
                 all_(defines('kick'), playsAt('bd', BEATS), every(snd('bd'), w('bank', eq=TR909)))),
            task('Add a part called hats: an open hat on every offbeat, at gain .55.', 'const hats = s("[~ oh]*4").bank("RolandTR909").gain(.55), then stack(kick, hats).',
                 all_(defines('hats'), includesTimes('oh', OFFBEATS), every(snd('oh'), w('gain', lt=0.7, default=0.8))))],
           [L1_s1], L1_sol, ['B4', 'B6', 'B9'], ['drums', '909'],
           summary=['A kick on every beat and an open hat on every offbeat: the pulse.', 'Every lesson in this line starts where the last one ended.'],
           introduces=['s', '.bank', '.gain', 'stack'], preload=kit('bd', 'oh')),

    lesson('clap-and-ticks', 'Clap and ticks', 'Add the clap on 2 and 4 and swung 16th hats.',
           'The **clap** on beats 2 and 4 is the backbeat; a little **reverb** (`.room`) sets it back, and it gets its own **orbit** so that reverb is the clap’s alone.\n\n**Ticks** are closed hats on every 16th. A gain pattern puts the weight on the beat, and **swing** (`.swingBy(.16, 8)`, about 58%) delays every second 16th so the grid stops feeling like a machine.',
           L1_sol,
           [task('Add a part called clap on beats 2 and 4, with a little room on orbit 2.', 'const clap = s("~ cp ~ cp").bank("RolandTR909").room(.2).orbit(2), and stack it.',
                 all_(defines('clap'), playsAt('cp', [0.25, 0.75]), every(snd('cp'), w('room', gt=0, default=0), w('orbit', eq=2, default=1)))),
            task('Add a part called ticks: closed hats on all 16 sixteenths with a gain pattern.', 'const ticks = s("hh*16").bank("RolandTR909").gain("[.4 .2 .3 .2]*4"), and stack it.',
                 all_(defines('ticks'), eq(count(s='hh'), 16), gte(distinct(snd('hh'), 'gain'), 2))),
            task('Swing the ticks: .16 over 8ths, about 58%.', '.swingBy(.16, 8) on the ticks line.',
                 all_(eq(count(s='hh'), 16), between(timeAt(snd('hh'), 1), 0.069, 0.077)))],
           [L2_s1, L2_s2], L2_sol, ['B5', 'I1', 'I4', 'E12'], ['drums', 'swing'],
           summary=['Clap on 2 and 4, in its own room on its own orbit.', '16th ticks with a gain pattern and .swingBy(.16, 8).'],
           introduces=['.room', '.orbit', 'patterned .gain', '.swingBy'], preload=K909),

    lesson('the-bass', 'The bass', 'Add an offbeat bass in C minor, short and dark.',
           'One `const key` keeps every pitched part in tune; the bass reads it with `.scale(key)`. Scale degree 0 is the root (C), −2 is two steps down (A♭), so the line leans and comes home.\n\nThe bass plays on the **offbeats**, between the kicks, so the two never fight for the low end. A short **decay**, no **sustain** and a closed **low-pass** keep it a thump rather than a drone. It sits on **orbit 4**, which the kick will duck later.',
           L2_sol,
           [task('Add const key = "C:minor" and a part called bass: scale degrees [~ 0] [~ 0] [~ 0] [~ -2] on a sawtooth, octave 2, on orbit 4.',
                 'const key = "C:minor" at the top, then const bass = n("[~ 0] [~ 0] [~ 0] [~ -2]").scale(key).s("sawtooth").octave(2).gain(.7).orbit(4), and stack it.',
                 all_(defined(KEY if False else {"key": True}), defines('bass'), inKey(sel=BASSEL), playsAt(None, OFFBEATS, cycles=1, sel=BASSEL))),
            task('Make it short and dark: low-pass 450 Hz, decay .15, no sustain.', '.lpf(450).decay(.15).sustain(0) on the bass line.',
                 every(BASSEL, w('cutoff', lte=600, gt=0), w('decay', lte=0.2, default=9), w('sustain', eq=0, default=1)))],
           [L3_s1], L3_sol, ['I5', 'B12', 'I8', 'I10'], ['bass'],
           summary=['const key + .scale(key) keeps parts in tune.', 'An offbeat bass never fights the kick.', 'Short decay, no sustain, closed filter: a thump.'],
           introduces=['n', '.scale', '.octave', '.lpf', '.decay', '.sustain'], concepts=['const key'], preload=K909),

    lesson('the-303-line', 'The 303 line', 'Add the acid line: sixteen steps through a ladder filter.',
           'The acid voice is a **TB-303**: a sawtooth, a 16-step line that mostly sits on the root with octave jumps, and a **ladder filter** with high **resonance** and a fast **filter envelope** (`.lpenv`, `.lpdecay`), so every note goes "wow".\n\n`.ftype("ladder")` picks the 303-style filter; `.lpq(18)` is the resonance; `.lpdecay(.15)` is how fast the envelope closes. The acid gets **orbit 5**, its own space.',
           L3_sol,
           [task('Add a part called acid: a 16-step sawtooth line on orbit 5.',
                 f'const acid = note({LINE}).s("sawtooth").decay(.2).sustain(0).gain(.55).orbit(5), and stack it.',
                 all_(defines('acid'), gte(countOf(ACID), 12), gte(distinct(ACID, '$midi'), 3))),
            task('Give it the 303 filter: ladder, cutoff 900, resonance 18, a fast filter decay.', '.ftype("ladder").lpf(900).lpq(18).lpdecay(.15) on the acid line.',
                 every(ACID, w('ftype', eq='ladder'), w('resonance', gte=15, default=0), w('lpdecay', lte=0.3, default=9)))],
           [L4_s1], L4_sol, ['E1', 'I11', 'I13'], ['303', 'acid house'],
           summary=['A 303 line: 16 steps, mostly the root, octave jumps.', 'Ladder filter + high resonance + a fast filter decay.'],
           introduces=['.ftype', '.lpq', '.lpdecay'], concepts=['acid'], preload=K909),

    lesson('accents', 'Accents', 'Accent some steps: louder and brighter on the same notes.',
           'On a 303 an **accented** step is louder *and* its filter opens further. Strudel has no accent button, so we build it from two patterns that line up step by step: `.velocity` for loudness and `.lpenv` for filter depth.\n\nAccent three or four steps per bar, never all of them: the contrast is the point.',
           L4_sol,
           [task('Add a velocity pattern with four accented steps (1) and the rest at .6.', '.velocity("[.6 1 .6 .6] [.6 .6 1 .6] [.6 .6 .6 .6] [1 .6 .6 .6]") on the acid line.',
                 all_(gte(countOf(snd('sawtooth', where=[w('orbit', eq=5), w('velocity', gte=0.9, default=1)])), 3), some(ACID, w('velocity', lt=0.9, default=1)))),
            task('Open the filter more on the same steps with an lpenv pattern.', '.lpenv("[3 6 3 3] [3 3 6 3] [3 3 3 3] [6 3 3 3]") on the acid line.',
                 all_(gte(distinct(ACID, 'lpenv'), 2), gte(mx(ACID, 'lpenv', 0), 5)))],
           [L5_s1], L5_sol, ['E1', 'B10'], ['303', 'acid house'],
           summary=['An accent = louder (.velocity) + brighter (.lpenv) on the same steps.'],
           introduces=['.velocity', '.lpenv'], preload=K909),

    lesson('the-sweep', 'The sweep', 'Open the acid filter slowly over 32 bars, and move the resonance.',
           'The magic of acid is the **slow sweep**: the cutoff creeping up over half a minute while the line repeats, until it screams. `saw.range(300, 3000).slow(32)` rises from 300 to 3000 Hz across 32 bars, then falls back.\n\nSweep the **resonance** on a different clock, a 16-bar sine between 15 and 22, so the sound keeps changing character. Inside an arrangement each section restarts the sweep from its first bar.',
           L5_sol,
           [task('Replace the fixed cutoff with a 32-bar saw sweep from 300 to 3000 Hz.', 'Change .lpf(900) to .lpf(saw.range(300, 3000).slow(32)) on the acid line.',
                 all_(lt(valueAt(snd('sawtooth', bar=0, where=[w('orbit', eq=5)]), 'cutoff'), 500),
                      gt(valueAt(snd('sawtooth', bar=16, where=[w('orbit', eq=5)]), 'cutoff'), plus(valueAt(snd('sawtooth', bar=0, where=[w('orbit', eq=5)]), 'cutoff'), 800)))),
            task('Move the resonance on a 16-bar sine between 15 and 22.', 'Change .lpq(18) to .lpq(sine.range(15, 22).slow(16)).',
                 gte(distinct(ACID, 'resonance', round=0, bars=[0, 4, 8, 12]), 3))],
           [L6_s1], L6_sol, ['E2', 'I18'], ['303', 'acid house', 'sound design'],
           summary=['saw.range(a, b).slow(32): a rise over 32 bars.', 'Move resonance on a different cycle for variety.'],
           introduces=['saw', 'sine', '.range', '.slow'], concepts=['long sweeps'], preload=K909),

    lesson('the-stab', 'The stab', 'Add a two-chord stab and send it through a dub delay modifier.',
           'A **stab** is a short chord hit: `chord("<Cm7 Fm7>").voicing()` picks the notes (one chord per bar), `.struct("[~ x]*2")` puts it on the offbeats of 2 and 4.\n\nA **modifier** is a function that takes a part and returns it changed: `const dubDelay = x => x.delay(.4).delaysync(3/16).delayfeedback(.55).orbit(3)`. Apply it where the part is played, `dubDelay(stab)`, so the stab itself stays clean and the same delay can go on anything later.',
           L6_sol,
           [task('Add a part called stab: a Cm7 / Fm7 chord stab on the offbeats of 2 and 4, filtered at 1400 Hz.',
                 'const stab = chord("<Cm7 Fm7>").voicing().struct("[~ x]*2").s("sawtooth").lpf(1400).decay(.15).sustain(0).gain(.45), and stack it.',
                 all_(defines('stab'), gte(CHORD_SIZE, 3), eq(values(STAB1, '$time', unique=True, sorted=True), [0.25, 0.75])), replacedLater=True),
            task('Write a modifier called dubDelay (a dotted-eighth delay on orbit 3) and play the stab through it.',
                 'const dubDelay = x => x.delay(.4).delaysync(3/16).delayfeedback(.55).orbit(3), then dubDelay(stab) in the stack.',
                 all_(block('dubDelay', 'modifier'), matches(r'dubDelay\(\s*stab\s*\)'), every(STAB3, w('delay', gt=0, default=0), w('delaysync', eq=0.1875))))],
           [L7_s1], L7_sol, ['I6', 'I7', 'I15', 'E12'], ['chords', 'effects'],
           summary=['chord(…).voicing().struct(…): which notes, and when.', 'A modifier is a function you apply where a part is played.'],
           introduces=['chord', '.voicing', '.struct', '.delay', '.delaysync', '.delayfeedback'], concepts=['modifiers'], preload=K909),

    lesson('sections', 'Sections', 'Name intro, drop and outro, then arrange them.',
           'A track is sections in a row. A **section** is a stack with a name: the **intro** is drums only, so a DJ can mix in; the **drop** is everything; the **outro** is drums again.\n\n`arrange([16, intro], [32, drop], [16, outro])` plays them for that many bars each. Changes land on **16-bar phrases**, where dancers expect them.',
           L7_sol,
           [task('Define three sections: intro (kick, hats, ticks), drop (everything, with dubDelay(stab)), outro (kick, hats). Play drop for now.',
                 'const intro = stack(kick, hats, ticks), const drop = stack(kick, clap, hats, ticks, bass, acid, dubDelay(stab)), const outro = stack(kick, hats); end the file with drop.',
                 all_(block('intro', ['group', 'section'], ['kick', 'hats', 'ticks']), block('drop', ['group', 'section'], ['kick', 'clap', 'bass', 'acid']), block('outro', ['group', 'section'], ['kick', 'hats']))),
            task('Arrange them: 16 bars of intro, 32 of drop, 16 of outro.', 'Replace the last line with arrange([16, intro], [32, drop], [16, outro]).',
                 all_(final('arrange'), gte(ROWS, 3), eq(rowBars(0), 16), eq(countOf(snd('sawtooth', bar=0)), 0), some(snd('sawtooth', bar=16)), some(snd('bd', bar=0))))],
           [L8_s1], L8_sol, ['E3', 'E4', 'E6', 'E7'], ['arrangement'], composition=True,
           summary=['Sections are named stacks; arrange() plays them for so many bars each.', 'Drums-only intro and outro for the DJ.'],
           introduces=['arrange'], concepts=['sections'], preload=K909),

    lesson('riser-and-breakdown', 'Riser and breakdown', 'Add a build with a noise riser, and a breakdown without the kick.',
           '**Tension and release.** A **build** section adds a **riser**: pink noise whose high-pass sweeps up over 16 bars (`.hpf(saw.range(200, 6000).slow(16))`), so the sound thins and climbs into the drop.\n\nA **breakdown** takes the kick away for 8 bars and leaves the acid and the stab hanging in their echoes. When the kick returns, the room lifts.',
           L8_sol,
           [task('Add a part called riser (pink noise, high-pass sweeping 200 to 6000 Hz over 16 bars) and a 16-bar build section between the intro and the drop.',
                 'const riser = s("pink*16").hpf(saw.range(200, 6000).slow(16)).gain(.2); const build = stack(kick, hats, ticks, bass, riser); arrange([16, intro], [16, build], [32, drop], [16, outro]).',
                 all_(defines('riser'), block('build', ['group', 'section'], ['riser']), gte(ROWS, 4), some(snd('pink', bar=16)), eq(countOf(snd('pink', bar=0)), 0))),
            task('Add an 8-bar breakdown after the drop: hats, acid and the stab, no kick.',
                 'const breakdown = stack(hats, acid, dubDelay(stab)), then arrange([16, intro], [16, build], [32, drop], [8, breakdown], [16, outro]).',
                 all_(block('breakdown', ['group', 'section'], ['acid']), gte(ROWS, 5), eq(countOf(snd('bd', bar=64)), 0), some(snd('sawtooth', bar=64)), some(snd('bd', bar=72))))],
           [L9_s1], L9_sol, ['E5', 'E6'], ['arrangement'], composition=True,
           summary=['A riser is noise with a rising high-pass.', 'A breakdown drops the kick; the return is the release.'],
           introduces=['pink', '.hpf'], concepts=['risers'], preload=K909),

    lesson('the-mix', 'Project: The mix', 'Carve the parts apart, duck the bass under the kick, and finish the arrangement.',
           'Mixing in Strudel is three tools. **High-pass** everything that isn’t bass, so the low end belongs to the kick and the bass. **Duck** the bass under the kick with a `pump` modifier (`duckorbit(4)` points at the bass’s orbit), applied only in sections where the bass plays, because ducking a silent orbit is an error (gap G14).\n\nThen the full shape: intro, build, drop, breakdown, a second drop, outro. 104 bars at 126 BPM is about three and a half minutes.',
           L9_sol,
           [task('High-pass the clap and stab at 200 Hz, the hats at 300, the ticks at 400.', '.hpf(200) on clap and stab, .hpf(300) on hats, .hpf(400) on ticks.',
                 all_(every(snd('cp', bar=32), w('hcutoff', gte=200, default=0)), every(snd('oh', bar=0), w('hcutoff', gte=300, default=0)),
                      every(snd('hh', bar=0), w('hcutoff', gte=400, default=0)), every(snd('sawtooth', bar=32, where=[w('orbit', eq=3)]), w('hcutoff', gte=200, default=0)))),
            task('Write a pump modifier that ducks orbit 4 and apply it to the kick in build and drop only.',
                 'const pump = x => x.duckorbit(4).duckdepth(.7); then pump(kick) in build and drop, plain kick in intro and outro.',
                 all_(block('pump', 'modifier'), every(snd('bd', bar=32), w('duckorbit', eq=4)), every(snd('bd', bar=0), w('duckorbit', defined=False)))),
            task('Finish the arrangement: bring the drop back for 16 bars after the breakdown, before the outro.',
                 'arrange([16, intro], [16, build], [32, drop], [8, breakdown], [16, drop], [16, outro]).',
                 all_(gte(ROWS, 6), gte(rowStart(5), 80), some(snd('bd', bar=72)), some(snd('sawtooth', where=[w('orbit', eq=5)], bar=72))))],
           [L10_s1, L10_s2], L10_sol, ['E8', 'E10', 'E11', 'E14'], ['project', 'track', 'mixing', 'arrangement'], shape='project', composition=True,
           summary=['High-pass what isn’t bass.', 'Duck the bass only where it plays.', 'Intro, build, drop, breakdown, drop, outro: a track.'],
           introduces=['.duckorbit', '.duckdepth'], concepts=['gain staging'], preload=K909),
]

write(pack('acid-warehouse', 'Acid Warehouse, from a kick to a track',
           'The core capstone built the way a producer builds it: one lesson at a time, from a kick to an arranged, mixed track.',
           [track('acid-warehouse', 'Acid Warehouse', 'Every lesson starts from the code you finished in the one before; the last is the whole track.',
                  lessons, kind='line', requires=['B9', 'I6', 'I11', 'I13'])],
           lessons, tags=['acid house', 'techno', '303', '909', 'track']))
