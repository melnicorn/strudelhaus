"""A 2-step tune: a track line. python3 scripts/packgen/two_step_tune.py"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from common import *  # noqa: F401,F403

HEAD = '// A 2-step tune. Tempo first:\nsetcpm(132/4)'
KICK = 'const kick = s("bd [~ bd] ~ ~").bank("RolandTR909")'
SNARE = 'const snare = s("~ sd ~ sd").bank("RolandTR909").gain(.7)'
GHOST = 'const ghost = s("~ ~ [~ ~ sd ~] [~ sd ~ ~]").bank("RolandTR909").gain(.3)'
HATS0 = 'const hats = s("hh*16").bank("RolandTR909").gain("[.5 .25 .35 .25]*4")'
HATS = HATS0 + '.swingBy(.2, 8)'
OPENS = 'const opens = s("~ ~ ~ [~ oh]").bank("RolandTR909").gain(.4)'
KEY = 'const key = "C2:minor"'
BASS0 = 'const bass = n("[~ 0] [~ 0] [~ 3] [~ ~]").scale(key).s("square")'
BASS1 = BASS0 + '.decay(.12).sustain(0)'
BASS = BASS1 + '.lpf(700)'
PIANO0 = 'const piano = chord("Cm7").voicing().struct("~ [~ x] ~ [x ~]").s("piano").gain(.6)'
PIANO = PIANO0 + '.clip(.3).room(.3)'
MAIN = 'const main = stack(kick, snare, ghost, hats, opens, bass, piano)'
SWEEP = 'const bassSweep = bass.lpf(sine.range(300, 1200).slow(8))'
DOUBLE = 'const pianoDouble = piano.ply(2)'
DROP = 'const drop = stack(kick, snare, ghost, hats, opens, bassSweep, pianoDouble)'
INTRO = 'const intro = stack(kick, snare, hats, opens)'
OUTRO = 'const outro = stack(kick, hats)'
ARR = 'arrange([8, intro], [16, main], [16, drop], [8, outro])'

def code(*lines):
    return '\n'.join([HEAD, *lines])

# ---------- lesson 1: the kick ----------
L1_S = code('')
L1_1 = code(KICK, 'stack(kick)')
L1_SOL = L1_1

# ---------- lesson 2: snares ----------
L2_1 = code(KICK, SNARE, 'stack(kick, snare)')
L2_SOL = code(KICK, SNARE, GHOST, 'stack(kick, snare, ghost)')

# ---------- lesson 3: hats ----------
L3_1 = code(KICK, SNARE, GHOST, HATS0, 'stack(kick, snare, ghost, hats)')
L3_2 = code(KICK, SNARE, GHOST, HATS, 'stack(kick, snare, ghost, hats)')
L3_SOL = code(KICK, SNARE, GHOST, HATS, OPENS, 'stack(kick, snare, ghost, hats, opens)')

# ---------- lesson 4: bass ----------
DR = [KICK, SNARE, GHOST, HATS, OPENS]
L4_1 = code(KEY, *DR, BASS0, 'stack(kick, snare, ghost, hats, opens, bass)')
L4_2 = code(KEY, *DR, BASS1, 'stack(kick, snare, ghost, hats, opens, bass)')
L4_SOL = code(KEY, *DR, BASS, 'stack(kick, snare, ghost, hats, opens, bass)')

# ---------- lesson 5: piano ----------
L5_1 = code(KEY, *DR, BASS, PIANO0, 'stack(kick, snare, ghost, hats, opens, bass, piano)')
L5_SOL = code(KEY, *DR, BASS, PIANO, 'stack(kick, snare, ghost, hats, opens, bass, piano)')

# ---------- lesson 6: the drop ----------
PARTS = [KEY, *DR, BASS, PIANO]
L6_1 = code(*PARTS, MAIN, 'stack(main)')
L6_2 = code(*PARTS, SWEEP, DOUBLE, MAIN, 'stack(main)')
L6_SOL = code(*PARTS, SWEEP, DOUBLE, MAIN, DROP, 'stack(main)')

# ---------- lesson 7: the arrangement ----------
L7_1 = code(*PARTS, SWEEP, DOUBLE, INTRO, MAIN, DROP, OUTRO, 'stack(main)')
L7_SOL = code(*PARTS, SWEEP, DOUBLE, INTRO, MAIN, DROP, OUTRO, ARR)

# ---------- lesson 8: the mix ----------
HATS_M = HATS + '.hpf(400)'
OPENS_M = OPENS + '.hpf(400)'
SNARE_M = 'const snare = s("~ sd ~ sd").bank("RolandTR909").gain(.7).hpf(150).room(.2).orbit(3)'
GHOST_M = GHOST + '.hpf(150)'
PIANO_M = PIANO0 + '.clip(.3).room(.3).hpf(200).orbit(2)'
def mix(hpf_hats, hpf_snare, piano_orbit):
    return code(KEY, KICK,
                SNARE_M if hpf_snare else SNARE,
                GHOST_M if hpf_snare else GHOST,
                HATS_M if hpf_hats else HATS,
                OPENS_M if hpf_hats else OPENS,
                BASS,
                PIANO_M if piano_orbit else PIANO,
                SWEEP, DOUBLE, INTRO, MAIN, DROP, OUTRO, ARR)
L8_1 = mix(True, False, False)
L8_2 = mix(True, True, False)
L8_SOL = mix(True, True, True)

OFF8 = [0.125, 0.375, 0.625, 0.875]
sq = snd('square')
pn = snd('piano')

lessons = [
    lesson('the-kick', 'The 2-step kick', 'Start the tune: the kick pattern that makes garage skip.',
           'UK garage came out of London in the mid-90s, when DJs sped up New York garage records and producers like Todd Edwards and MJ Cole rebuilt the drums around a **skipping** kick. Instead of four on the floor, the kick lands on beat 1 and the "and" of beat 2: `"bd [~ bd] ~ ~"`. Beats 3 and 4 are left empty, and that gap is the whole feel.\n\nWe build one 2-step tune across this line of lessons; each lesson starts from the code you finished in the one before. Tempo first: garage sits around 130–135 BPM.',
           L1_S,
           [task('Add a part called kick: a TR-909 kick on beat 1 and the "and" of 2.', 'const kick = s("bd [~ bd] ~ ~").bank("RolandTR909"), then play it with stack(kick).',
                 all_(defines('kick'), playsAt('bd', [0, 0.375])))],
           [], L1_SOL, ['B4', 'B6'], ['drums', '909'],
           summary=['The 2-step kick: beat 1 and the "and" of 2, nothing on 3 and 4.', 'Garage runs at 130–135 BPM.'],
           introduces=['s', '.bank', 'stack'], concepts=['the 2-step kick'], preload=kit('bd')),

    lesson('the-snares', 'The snares', 'A snare on 2 and 4, and a quiet ghost that skips between.',
           'The backbeat stays where house left it: a **snare** on beats 2 and 4. What makes it garage is the **ghost snare**: a second, much quieter snare slipped in between the main hits, so the pattern seems to stumble forward. Producers lifted this from swing drummers and from the MPC’s quiet pads.\n\nKeep the ghost well under the main snare; it should be felt, not heard.',
           L1_SOL,
           [task('Add a part called snare on beats 2 and 4, at gain .7.', 'const snare = s("~ sd ~ sd").bank("RolandTR909").gain(.7), and stack(kick, snare).',
                 all_(defines('snare'), includesTimes('sd', [0.25, 0.75]))),
            task('Add a part called ghost: two quiet extra snares off the beat.', 'const ghost = s("~ ~ [~ ~ sd ~] [~ sd ~ ~]").bank("RolandTR909").gain(.3), and stack it.',
                 all_(defines('ghost'), gte(count(s='sd'), 4), some(snd('sd'), w('gain', lt=0.4, default=0.8))))],
           [L2_1], L2_SOL, ['B5', 'I4'], ['drums'],
           summary=['Snare on 2 and 4; a quiet ghost snare in between.', 'Ghosts are felt more than heard: keep them under .4.'],
           introduces=['.gain'], concepts=['ghost notes'], preload=kit('bd', 'sd')),

    lesson('shuffled-hats', 'Shuffled hats', '16th hats with heavy swing, and an open hat on the "and" of 4.',
           'Garage hats **shuffle** harder than house: every second 16th is pushed late, close to a triplet feel. `.swingBy(.2, 8)` is about 60% swing (x = (swing% − 50) / 50). A gain pattern puts the weight on the beats.\n\nOne **open hat** on the "and" of beat 4 lifts the bar into the next one: the classic garage "tss" before the kick comes back.',
           L2_SOL,
           [task('Add a part called hats: 16th closed hats with a gain pattern.', 'const hats = s("hh*16").bank("RolandTR909").gain("[.5 .25 .35 .25]*4"), and stack it.',
                 all_(defines('hats'), eq(count(s='hh'), 16), gte(distinct(snd('hh'), 'gain'), 2))),
            task('Shuffle them hard: swing about 60%.', '.swingBy(.2, 8) on the hats line.',
                 all_(eq(count(s='hh'), 16), gte(timeAt(snd('hh'), 1), 0.072), lte(timeAt(snd('hh'), 1), 0.082))),
            task('Add a part called opens: one open hat on the "and" of 4, quiet.', 'const opens = s("~ ~ ~ [~ oh]").bank("RolandTR909").gain(.4), and stack it.',
                 all_(defines('opens'), playsAt('oh', [0.875], cycles=1)))],
           [L3_1, L3_2], L3_SOL, ['B3', 'I1', 'I4'], ['drums', 'swing'],
           summary=['.swingBy(.2, 8) is about 60% swing.', 'An open hat on the "and" of 4 lifts the bar.'],
           introduces=['.swingBy', 'patterned .gain'], preload=kit('bd', 'sd', 'hh', 'oh')),

    lesson('the-organ-bass', 'The organ bass', 'A short square bass on offbeat 8ths, in a key.',
           'Under the skipping drums garage puts an **organ bass**: a hollow square wave in short stabs, usually on the offbeat 8ths, so it answers the kick instead of sitting on it. Early producers took it from the Korg M1’s organ patch; a square wave with a quick decay and a low-pass gets close.\n\nWe set `const key = "C2:minor"`: the 2 in the scale name puts the degrees in the second octave, and the bass and the chords will share it.',
           L3_SOL,
           [task('Set const key to C2 minor and add a part called bass: square-wave scale degrees on the offbeat 8ths, with rests.', 'const key = "C2:minor" at the top, then const bass = n("[~ 0] [~ 0] [~ 3] [~ ~]").scale(key).s("square"), and stack it.',
                 all_(defined({"key": True}), defines('bass'), inKey(key='C:minor', sel=sq), every(sq, w('$midi', lt=48), w('$time', **{'in': OFF8})))),
            task('Make every bass note a short stab.', '.decay(.12).sustain(0) on the bass line.',
                 every(sq, w('decay', lte=0.2, default=9), w('sustain', eq=0, default=1))),
            task('Round it off with a low-pass at 700 Hz.', '.lpf(700) on the bass line.',
                 every(sq, w('cutoff', lte=900, gt=0)))],
           [L4_1, L4_2], L4_SOL, ['B12', 'I5', 'I10', 'B14'], ['bass', 'organ'],
           summary=['An organ bass: a square wave in short offbeat stabs.', 'scale("C2:minor"): the number picks the octave.'],
           introduces=['n', '.scale', '.decay', '.sustain', '.lpf'], concepts=['const key'], preload=kit('bd', 'sd', 'hh', 'oh')),

    lesson('piano-chops', 'Piano chops', 'A piano chord struck in a syncopated pattern, short and roomy.',
           'Garage borrowed the **piano stab** from house and chopped it: a chord struck on unexpected 16ths, cut short, so it sounds like a sample being triggered from pads. `.struct("~ [~ x] ~ [x ~]")` gives the chord a syncopated rhythm; `.clip(.3)` cuts each hit to a third of its slot; a little `.room` sets it back.\n\nThe chord is C minor 7, the same key as the bass.',
           L4_SOL,
           [task('Add a part called piano: a Cm7 chord on the piano sound in a syncopated struct pattern, at gain .6.', 'const piano = chord("Cm7").voicing().struct("~ [~ x] ~ [x ~]").s("piano").gain(.6), and stack it.',
                 all_(defines('piano'), some(pn), gte(CHORD_SIZE, 3), eq(count(s='piano', where=[w('$time', eq=0)]), 0))),
            task('Chop it short and put it in a room.', '.clip(.3).room(.3) on the piano line.',
                 every(pn, w('clip', lte=0.4, default=1), w('room', gt=0, default=0)))],
           [L5_1], L5_SOL, ['I6', 'I2', 'I14'], ['chords', 'piano'],
           summary=['A chopped piano: a chord in a syncopated struct, cut short with .clip.', 'A little room sets it behind the drums.'],
           introduces=['chord', '.voicing', '.struct', '.clip', '.room'], preload=kit('bd', 'sd', 'hh', 'oh') + [{"s": "piano"}]),

    lesson('the-drop', 'The drop', 'Name the main groove, and build a bigger version of it for the drop.',
           'A garage tune has a **main** groove and a **drop** where the same parts come back bigger. We name the groove as a group, then make the drop’s versions of two parts: the bass with its filter **sweeping** open over 8 bars, and the piano **doubled** so every hit plays twice.\n\nGroups are just stacks with names. For now the tune still plays `stack(main)`; the arrangement comes next.',
           L5_SOL,
           [task('Group every part into a const called main, and play main.', 'const main = stack(kick, snare, ghost, hats, opens, bass, piano), then stack(main) as the last line.',
                 all_(block('main', kind=['group', 'section'], members=['kick', 'snare', 'bass', 'piano']), playsAt('bd', [0, 0.375]))),
            task('Make the drop versions: bassSweep, the bass with an 8-bar filter sweep, and pianoDouble, the piano played twice as often.', 'const bassSweep = bass.lpf(sine.range(300, 1200).slow(8)) and const pianoDouble = piano.ply(2), above main.',
                 all_(defines('bassSweep'), defines('pianoDouble'), matches(r'sine\.range\(\s*300\s*,\s*1200\s*\)\.slow\(\s*8\s*\)'), uses('ply'))),
            task('Group the drop: the drums with bassSweep and pianoDouble, in a const called drop.', 'const drop = stack(kick, snare, ghost, hats, opens, bassSweep, pianoDouble), still playing stack(main).',
                 block('drop', kind=['group', 'section'], members=['kick', 'bassSweep', 'pianoDouble']))],
           [L6_1, L6_2], L6_SOL, ['E6', 'E2', 'I19'], ['arrangement'], composition=True,
           summary=['Groups are stacks with names: main, drop.', 'A drop is the same parts, bigger: a filter sweep, a doubled piano.'],
           introduces=['sine', '.range', '.ply'], concepts=['groups'], preload=kit('bd', 'sd', 'hh', 'oh') + [{"s": "piano"}]),

    lesson('the-arrangement', 'The arrangement', 'Intro, main, drop, outro: the shape of the tune.',
           'A garage record is a DJ tool: it opens with drums a DJ can mix into, builds to the drop, and leaves with drums. Sections are **groups**; `arrange([8, intro], [16, main], …)` plays them for that many bars each, and every section restarts its own bar count, so the bass sweep in the drop starts closed every time.\n\nKeep sections to multiples of 8 bars: that is how DJs count.',
           L6_SOL,
           [task('Add two more groups: intro (kick, snare, hats, opens) and outro (kick, hats). Keep playing main.', 'const intro = stack(kick, snare, hats, opens) and const outro = stack(kick, hats), beside main and drop.',
                 all_(block('intro', kind=['group', 'section'], members=['kick', 'hats']), block('outro', kind=['group', 'section'], members=['kick', 'hats']), not_(block('intro', members=['piano'])))),
            task('Arrange them: 8 bars of intro, 16 of main, 16 of drop, 8 of outro.', 'Replace the last line with arrange([8, intro], [16, main], [16, drop], [8, outro]).',
                 all_(final('arrange'), gte(ROWS, 4), eq(rowBars(0), 8), eq(rowBars(1), 16), eq(count(s='piano', bar=0), 0), some(snd('piano', bar=8)), some(snd('piano', bar=24))))],
           [L7_1], L7_SOL, ['E3', 'E4', 'E7'], ['arrangement', 'track'], composition=True,
           summary=['arrange() plays named sections for so many bars each.', 'Drums-only intro and outro make it a DJ tool.'],
           introduces=['arrange'], concepts=['sections'], preload=kit('bd', 'sd', 'hh', 'oh') + [{"s": "piano"}]),

    lesson('the-mix', 'Project: The mix', 'Clear the low end, set the levels, and give each reverb its own orbit.',
           'The last pass is the **mix**. Everything that is not kick or bass gets a **high-pass** filter, so the low end belongs to those two alone. Levels: nothing above .8 except the kick. And each part that has a reverb gets its own **orbit**, because Strudel keeps one reverb per orbit; two parts sharing one would fight over the settings.\n\nThat is the whole tune: a kick that skips, snares that stumble, hats that shuffle, an organ bass, a chopped piano, and a shape a DJ can play.',
           L7_SOL,
           [task('High-pass the closed and open hats at 400 Hz.', '.hpf(400) on the hats line and the opens line.',
                 all_(every(snd('hh', bar=0), w('hcutoff', gte=300, default=0)), every(snd('oh', bar=0), w('hcutoff', gte=300, default=0)))),
            task('High-pass the snare and the ghost at 150 Hz, and give the snare a touch of room on its own orbit 3.', '.hpf(150) on both snare lines; .room(.2).orbit(3) on the snare line.',
                 all_(every(snd('sd', bar=0), w('hcutoff', gte=100, default=0)), some(snd('sd', bar=0), w('room', gt=0, default=0), w('orbit', eq=3, default=1)))),
            task('High-pass the piano at 200 Hz and move its reverb to orbit 2, so no two reverbs share an orbit.', '.hpf(200).orbit(2) on the piano line.',
                 all_(every(snd('piano', bar=8), w('hcutoff', gte=150, default=0), w('orbit', eq=2, default=1)),
                      every({"bar": 8, "where": [w('s', neq='bd')]}, w('gain', lte=0.8, default=0.8))))],
           [L8_1, L8_2], L8_SOL, ['E11', 'E10', 'E12'], ['mixing', 'project', 'track'], shape='project', composition=True,
           summary=['High-pass everything but kick and bass.', 'Nothing above .8 except the kick.', 'One reverb per orbit.'],
           introduces=['.hpf', '.orbit'], preload=kit('bd', 'sd', 'hh', 'oh') + [{"s": "piano"}]),
]

write(pack('two-step-tune', 'A 2-step tune', 'One UK garage track built from nothing, a lesson at a time: the skipping kick, the snares, the shuffle, an organ bass, chopped piano, a drop, the arrangement and the mix.',
           [track('two-step-tune', 'A 2-step tune', 'Every lesson starts from the code you finished in the one before, and the last one is the whole tune.',
                  lessons, kind='line', requires=['B5', 'B6', 'I1', 'B12', 'I6'])],
           lessons, tags=['garage', 'house', 'swing', 'organ', 'piano', 'track']))
