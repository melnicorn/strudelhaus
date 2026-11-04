"""Ambient / downtempo. python3 scripts/packgen/ambient.py"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from common import *  # noqa: F401,F403

T = 'setcpm(80/4)'
PAD0 = 'const pad = note("[c3,eb3,g3,bb3]").s("supersaw").lpf(800).gain(.4)'
PAD1 = 'const pad = note("[c3,eb3,g3,bb3]").s("supersaw").lpf(800).gain(.4).attack(1)'
PAD2 = 'const pad = note("[c3,eb3,g3,bb3]").s("supersaw").lpf(800).gain(.4).attack(1).release(2)'
PAD2C = 'const pad = note("<[c3,eb3,g3,bb3] [ab2,c3,eb3,g3]>").slow(2).s("supersaw").lpf(800).gain(.4).attack(1).release(2)'
PADP = 'const pad = note("[c3,eb3,g3,bb3]").s("supersaw").gain(.4).attack(1).release(2).lpf(perlin.range(300, 1500).slow(8))'
PADPP = PADP + '.pan(perlin.range(.2, .8).slow(5))'
PADW = PADPP + '\n  .room(.9).delay(.6).delaysync(3/8).delayfeedback(.8).orbit(2)'
PULSE = 'const pulse = note("c2*4").s("sine").decay(.3).sustain(0).gain(.5)'
TICK = 'const tick = s("<~ [~ ~ ~ rim]>").bank("RolandTR606").gain(.3).room(.6).orbit(3)'
sup = snd('supersaw')

lessons = [
    lesson('pads-without-drums', 'Pads without drums', 'Make a chord that fades in and out instead of hitting.',
           'Ambient music (Brian Eno named it, in 1978) is built from sounds that **arrive slowly** and leave slowly. A pad is a chord with a long **attack** (the fade in) and a long **release** (the fade out), so the edges of each note disappear.\n\nA **supersaw** through a closed low-pass filter is the softest pad the site has. Keep the gain low: pads add up.',
           f'{T}\n{PAD0}\nstack(pad)',
           [task('Give the pad a one-second attack.', '.attack(1) on the pad line.', every(sup, w('attack', gte=0.8, default=0))),
            task('And a two-second release, so each chord hangs on.', '.release(2) on the pad line.', every(sup, w('release', gte=1.5, default=0)))],
           [f'{T}\n{PAD1}\nstack(pad)'], f'{T}\n{PAD2}\nstack(pad)', ['I10', 'I9'], ['pads', 'sound design'],
           challenge=task('Alternate two chords, each lasting two bars.', 'note("<[c3,eb3,g3,bb3] [ab2,c3,eb3,g3]>").slow(2): angle brackets alternate, .slow(2) stretches each to two bars.',
                          neq(values(snd('supersaw', bar=0), '$pc', unique=True, sorted=True), values(snd('supersaw', bar=2), '$pc', unique=True, sorted=True))),
           challengeSolution=f'{T}\n{PAD2C}\nstack(pad)',
           summary=['A pad is a chord with a slow attack and a long release.', 'supersaw + a closed lpf is the softest pad here.'],
           introduces=['.attack', '.release'], concepts=['pads']),

    lesson('perlin-on-everything', 'Perlin on everything', 'Let smooth randomness move the filter and the stereo image.',
           '**Perlin noise** is random but smooth: it wanders rather than jumps. Give it to a control and the sound drifts the way weather does.\n\n`perlin.range(300, 1500).slow(8)` wanders between 300 and 1500 Hz over about eight bars. Put it on `.lpf` and the pad breathes; on `.pan` and it drifts between the speakers. Use different `.slow` values so the movements never line up.',
           f'{T}\n{PAD2}\nstack(pad)',
           [task('Replace the fixed cutoff with perlin wandering between 300 and 1500 Hz over 8 bars.', '.lpf(perlin.range(300, 1500).slow(8)) instead of .lpf(800).',
                 all_(matches('perlin'), gte(distinct(sup, 'cutoff', round=0, bars=[0, 2, 4, 6]), 3))),
            task('Drift the pad between the speakers with perlin on .pan, over 5 bars.', '.pan(perlin.range(.2, .8).slow(5))',
                 gte(distinct(sup, 'pan', round=2, bars=[0, 1, 2, 3]), 2))],
           [f'{T}\n{PADP}\nstack(pad)'], f'{T}\n{PADPP}\nstack(pad)', ['I18', 'I17'], ['sound design', 'randomness'],
           challenge=task('Let the level breathe too: perlin between .3 and .5 on the gain.', '.gain(perlin.range(.3, .5).slow(7)) instead of .gain(.4).',
                          gte(distinct(sup, 'gain', round=2, bars=[0, 1, 2, 3]), 2)),
           challengeSolution=f'{T}\n' + PADPP.replace('.gain(.4)', '.gain(perlin.range(.3, .5).slow(7))') + '\nstack(pad)',
           summary=['perlin is smooth randomness: it wanders.', 'Different .slow values keep movements out of step.'],
           introduces=['perlin', '.range', '.slow', '.pan']),

    lesson('washes', 'Washes', 'Drown the pad in reverb and a long delay.',
           'Ambient space is made of **reverb** turned up past where a mixer would stop, and **delays** whose feedback is so high the echoes become a texture.\n\n`.room(.9)` is a huge hall. A delay of three eighths (`.delaysync(3/8)`) with feedback near .8 repeats for a long time. Keep the pad on its own **orbit** so these settings are the pad’s alone.',
           f'{T}\n{PADPP}\nstack(pad)',
           [task('A very big reverb on the pad: room .8 or more.', '.room(.9) on the pad line.', every(sup, w('room', gte=0.8, default=0))),
            task('A long delay: three eighths, feedback .8, on its own orbit 2.', '.delay(.6).delaysync(3/8).delayfeedback(.8).orbit(2)',
                 every(sup, w('delay', gt=0, default=0), w('delaysync', eq=0.375), w('delayfeedback', gte=0.7, lt=1, default=0), w('orbit', eq=2, default=1)))],
           [f'{T}\n{PADPP}\n  .room(.9)\nstack(pad)'], f'{T}\n{PADW}\nstack(pad)', ['I14', 'I15', 'E12'], ['effects'],
           challenge=task('Thin the pad out underneath so the wash doesn’t turn to mud: high-pass at 200 Hz.', '.hpf(200)', every(sup, w('hcutoff', gte=150, default=0))),
           challengeSolution=f'{T}\n{PADW}.hpf(200)\nstack(pad)',
           summary=['Reverb and feedback past the usual limits make a wash.', 'One orbit per part keeps the settings apart.'],
           introduces=['.room', '.delay', '.delaysync', '.delayfeedback', '.orbit', '.hpf']),

    lesson('pulse-without-kick', 'A pulse without a kick', 'Keep time without a drum kit.',
           'Downtempo keeps a pulse, but not with a kick drum. A soft **sine** on each beat, short and quiet, is felt more than heard. A single rimshot every other bar is enough rhythm.\n\nThe pulse sits in its own space: no reverb, so it stays close while the pad is far away.',
           f'{T}\n{PADW}\nstack(pad)',
           [task('Add a part called pulse: a short sine c2 on every beat, quiet.', 'const pulse = note("c2*4").s("sine").decay(.3).sustain(0).gain(.5), and stack it.',
                 all_(defines('pulse'), playsAt(None, BEATS, cycles=1, sel=snd('sine')), every(snd('sine'), w('sustain', eq=0, default=1))), replacedLater=True),
            task('Add a part called tick: one 606 rimshot on the last 16th of every other bar, in a room.', 'const tick = s("<~ [~ ~ ~ rim]>").bank("RolandTR606").gain(.3).room(.6).orbit(3), and stack it.',
                 all_(defines('tick'), eq(count(s='rim', bar=0), 0), eq(count(s='rim', bar=1), 1)))],
           [f'{T}\n{PADW}\n{PULSE}\nstack(pad, pulse)'], f'{T}\n{PADW}\n{PULSE}\n{TICK}\nstack(pad, pulse, tick)', ['B4', 'I19', 'I20'], ['drums', 'bass'],
           challenge=task('Let the pulse skip a beat now and then.', '.degradeBy(.2) on the pulse line.', all_(uses('degradeBy'), defines('pulse'))),
           challengeSolution=f'{T}\n{PADW}\n{PULSE}.degradeBy(.2)\n{TICK}\nstack(pad, pulse, tick)',
           summary=['A quiet sine on the beat keeps time without drums.', 'A hit every other bar is plenty.'],
           introduces=['sine', '.degradeBy'], preload=kit('rim', bank='RolandTR606')),

    lesson('a-drift', 'Project: A drift', 'Put a pad, a pulse and the washes together in one key, slowly.',
           'Everything from this pack in one piece, at 80 BPM or slower. One `const key` keeps the pad and the pulse in tune. Nothing hits; everything arrives.\n\nIf you arrange it, let the pad play alone for the first section: ambient pieces begin with the room, not the beat.',
           f'{T}\nconst key = "C:minor"\nstack()',
           [task('A pad in the key, slow attack and release, with the breathing filter.', 'const pad = n("[0,2,4,6]").scale(key).s("supersaw").gain(.4).attack(1).release(2).lpf(perlin.range(300, 1500).slow(8)), and stack(pad).',
                 all_(defines('pad'), inKey(sel=sup), every(sup, w('attack', gte=0.8, default=0), w('release', gte=1.5, default=0)), matches('perlin'))),
            task('Wash it: big room, long delay, its own orbit.', '.room(.9).delay(.6).delaysync(3/8).delayfeedback(.8).orbit(2) on the pad.',
                 every(sup, w('room', gte=0.8, default=0), w('delayfeedback', gte=0.7, lt=1, default=0), w('orbit', eq=2, default=1))),
            task('Add the sine pulse on the root, in the key.', 'const pulse = n("0*4").scale(key).s("sine").decay(.3).sustain(0).gain(.5), and stack it.',
                 all_(defines('pulse'), inKey(sel=snd('sine')), playsAt(None, BEATS, cycles=1, sel=snd('sine'))), replacedLater=True)],
           [f'{T}\nconst key = "C:minor"\nconst pad = n("[0,2,4,6]").scale(key).s("supersaw").gain(.4).attack(1).release(2).lpf(perlin.range(300, 1500).slow(8))\nstack(pad)',
            f'{T}\nconst key = "C:minor"\nconst pad = n("[0,2,4,6]").scale(key).s("supersaw").gain(.4).attack(1).release(2).lpf(perlin.range(300, 1500).slow(8))\n  .room(.9).delay(.6).delaysync(3/8).delayfeedback(.8).orbit(2)\nstack(pad)'],
           f'{T}\nconst key = "C:minor"\nconst pad = n("[0,2,4,6]").scale(key).s("supersaw").gain(.4).attack(1).release(2).lpf(perlin.range(300, 1500).slow(8))\n  .room(.9).delay(.6).delaysync(3/8).delayfeedback(.8).orbit(2)\nconst pulse = n("0*4").scale(key).s("sine").decay(.3).sustain(0).gain(.5)\nstack(pad, pulse)',
           ['I5', 'E10', 'E12'], ['project', 'pads'], shape='project', composition=True,
           challenge=task('Arrange it: 8 bars of pad alone, then 16 with the pulse, then 8 of pad again.', 'const intro = stack(pad), const body = stack(pad, pulse), then arrange([8, intro], [16, body], [8, intro]).',
                          all_(final('arrange'), gte(ROWS, 3), eq(count(s='sine', bar=0), 0), some(snd('sine', bar=8)))),
           challengeSolution=f'{T}\nconst key = "C:minor"\nconst pad = n("[0,2,4,6]").scale(key).s("supersaw").gain(.4).attack(1).release(2).lpf(perlin.range(300, 1500).slow(8))\n  .room(.9).delay(.6).delaysync(3/8).delayfeedback(.8).orbit(2)\nconst pulse = n("0*4").scale(key).s("sine").decay(.3).sustain(0).gain(.5)\nconst intro = stack(pad)\nconst body = stack(pad, pulse)\narrange([8, intro], [16, body], [8, intro])',
           summary=['One key, one pad, one pulse, and a lot of space.', 'Begin with the room, not the beat.'],
           introduces=['arrange'], concepts=['const key']),
]

write(pack('ambient', 'Ambient and downtempo', 'Pads, drift, washes and a pulse without a kick: slow music made of space.',
           [track('drift', 'Drift', 'Pads, perlin, washes, a pulse, then a piece.', lessons, requires=['I9', 'I14', 'I18'])],
           lessons, tags=['ambient', 'pads', 'effects']))
