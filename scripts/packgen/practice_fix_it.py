"""Practice: fix it. Each starter has one bug; the goal says what you hear. python3 scripts/packgen/practice_fix_it.py"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from common import *  # noqa: F401,F403

T = 'setcpm(124/4)'
K = 'const kick = s("bd*4").bank("RolandTR909")'
C = 'const clap = s("~ cp ~ cp").bank("RolandTR909")'
H = 'const hats = s("[~ oh]*4").bank("RolandTR909").gain(.5)'


def fix(id, title, hear, clue, starter, hint, check, solution, teaches, tags, summary, preload=None):
    return lesson(id, title, hear, clue, starter,
                  [task('Find and fix it.', hint, check)], [], solution, teaches, tags, shape='fix',
                  summary=summary, preload=preload or kit('bd', 'cp', 'oh', 'hh'))


lessons = [
    fix('missing-from-stack', 'The silent hats', 'The kick and clap play, but you hear no hats at all.',
        'Defining a part gives it a name. A name on its own makes no sound.',
        f'{T}\n{K}\n{C}\n{H}\nstack(kick, clap)',
        'Add hats to the stack: stack(kick, clap, hats).',
        all_(playsAt('bd', BEATS), playsAt('oh', OFFBEATS)),
        f'{T}\n{K}\n{C}\n{H}\nstack(kick, clap, hats)', ['B9'], ['drums'],
        ['A part only plays once it is in the stack.']),

    fix('tempo-too-fast', 'Four times too fast', 'Everything races: the loop is over in a second.',
        'Strudel counts cycles per minute, and our cycle is a bar of four beats.',
        f'setcpm(124)\n{K}\n{C}\nstack(kick, clap)',
        'setcpm(124/4): divide the BPM by the four beats in a bar.',
        all_(between(BPM, 120, 128), playsAt('bd', BEATS)),
        f'{T}\n{K}\n{C}\nstack(kick, clap)', ['B1'], ['drums'],
        ['setcpm takes cycles per minute: BPM/4.']),

    fix('misspelled-bank', 'Sound not found', 'The clap plays, but the kick is missing and the panel warns about a sound.',
        'Drum machine names are exact. Compare the kick’s bank with the clap’s.',
        f'{T}\nconst kick = s("bd*4").bank("RolandTR99")\n{C}\nstack(kick, clap)',
        'Spell the bank RolandTR909 on the kick line.',
        all_(playsAt('bd', BEATS), every(snd('bd'), w('bank', eq=TR909))),
        f'{T}\n{K}\n{C}\nstack(kick, clap)', ['B8'], ['drums', '909'],
        ['Bank names must match exactly.']),

    fix('squeezed-kick', 'Eight kicks, not four', 'The kick stutters: twice as many hits as you asked for.',
        'Brackets squeeze what is inside them into one step, and *4 repeats that step.',
        f'{T}\nconst kick = s("[bd bd]*4").bank("RolandTR909")\n{C}\nstack(kick, clap)',
        'Write the kick as s("bd*4"): one bd per step, four steps.',
        all_(playsAt('bd', BEATS), playsAt('cp', [0.25, 0.75])),
        f'{T}\n{K}\n{C}\nstack(kick, clap)', ['B3'], ['drums'],
        ['[a b]*4 is eight hits; a*4 is four.']),

    fix('filtered-away', 'Where did the hats go?', 'The hats are in the stack, but you hear only a faint tick, if anything.',
        'A low-pass filter at 80 Hz leaves almost nothing of a hi-hat, which lives above 3 kHz.',
        f'{T}\n{K}\nconst hats = s("hh*8").bank("RolandTR909").gain(.5).lpf(80)\nstack(kick, hats)',
        'Remove .lpf(80) from the hats, or raise it to .lpf(8000).',
        all_(playsAt('hh', EIGHTHS), not_(some(snd('hh'), w('cutoff', lt=2000)))),
        f'{T}\n{K}\nconst hats = s("hh*8").bank("RolandTR909").gain(.5)\nstack(kick, hats)', ['B14'], ['drums', 'sound design'],
        ['A low-pass cutoff below a sound’s range silences it.']),

    fix('shared-delay', 'The delay fights itself', 'The stab’s long echo keeps breaking up, and the hats echo oddly too.',
        'Strudel has one delay per orbit. Two parts with different delay settings on the same orbit overwrite each other.',
        f'{T}\n{K}\nconst stab = note("[~ [c3,eb3,g3]]*2").s("sawtooth").lpf(1200).delay(.5).delaysync(3/16).delayfeedback(.6)\nconst hats = s("hh*8").bank("RolandTR909").gain(.4).delay(.2).delaysync(1/8).delayfeedback(.2)\nstack(kick, stab, hats)',
        'Put the hats on their own orbit: add .orbit(2) to the hats line.',
        all_(some(snd('hh'), w('delay', gt=0, default=0), w('orbit', neq=1, default=1)),
             some(snd('sawtooth'), w('delay', gt=0, default=0), w('orbit', eq=1, default=1))),
        f'{T}\n{K}\nconst stab = note("[~ [c3,eb3,g3]]*2").s("sawtooth").lpf(1200).delay(.5).delaysync(3/16).delayfeedback(.6)\nconst hats = s("hh*8").bank("RolandTR909").gain(.4).delay(.2).delaysync(1/8).delayfeedback(.2).orbit(2)\nstack(kick, stab, hats)',
        ['E12', 'I15'], ['effects'], ['One delay (and one reverb) per orbit.'], preload=kit('bd', 'hh')),

    fix('ducking-nothing', 'Duck target does not exist', 'Pressing Play gives an error about a duck target orbit.',
        'Sidechain ducks another orbit. The kick says which one; it must be an orbit something plays on.',
        f'{T}\nconst kick = s("bd*4").bank("RolandTR909").duckorbit(3).duckdepth(.8)\nconst bass = note("[~ c2]*4").s("sawtooth").lpf(500).orbit(2)\nstack(kick, bass)',
        'Point the kick at the bass’s orbit: .duckorbit(2).',
        all_(every(snd('bd'), w('duckorbit', eq=2)), every(snd('sawtooth'), w('orbit', eq=2))),
        f'{T}\nconst kick = s("bd*4").bank("RolandTR909").duckorbit(2).duckdepth(.8)\nconst bass = note("[~ c2]*4").s("sawtooth").lpf(500).orbit(2)\nstack(kick, bass)',
        ['E8'], ['mixing', 'bass'], ['duckorbit must name an orbit that plays.'], preload=kit('bd')),

    fix('runaway-feedback', 'The echo never stops', 'The stab’s echoes pile up until everything is a wash of noise.',
        'Delay feedback is how much of each echo comes back round. At 1, nothing ever dies away.',
        f'{T}\n{K}\nconst stab = note("[~ [c3,eb3,g3]]*2").s("sawtooth").lpf(1200).delay(.5).delaysync(3/16).delayfeedback(1)\nstack(kick, stab)',
        'Bring the feedback down: .delayfeedback(.6).',
        every(snd('sawtooth'), w('delayfeedback', gt=0, lt=0.9, default=0)),
        f'{T}\n{K}\nconst stab = note("[~ [c3,eb3,g3]]*2").s("sawtooth").lpf(1200).delay(.5).delaysync(3/16).delayfeedback(.6)\nstack(kick, stab)',
        ['I15'], ['effects'], ['Keep delay feedback below 1.'], preload=kit('bd')),

    fix('melody-not-chord', 'A chord that plays one note at a time', 'You wanted one chord stab, but you hear three notes in a row.',
        'In mini-notation spaces make steps; commas make a chord.',
        f'{T}\n{K}\nconst stab = note("c3 eb3 g3").s("sawtooth").lpf(1500).decay(.2).sustain(0)\nstack(kick, stab)',
        'Write the notes with commas: note("[c3,eb3,g3]").',
        all_(gte(CHORD_SIZE, 3), some(snd('sawtooth'))),
        f'{T}\n{K}\nconst stab = note("[c3,eb3,g3]").s("sawtooth").lpf(1500).decay(.2).sustain(0)\nstack(kick, stab)',
        ['I6'], ['chords'], ['Commas stack notes into a chord; spaces put them in a row.'], preload=kit('bd')),

    fix('clipping', 'Distorted and crackly', 'The kick crackles and the whole mix sounds harsh.',
        'Gain above 1 pushes a sound past full scale and it clips.',
        f'{T}\nconst kick = s("bd*4").bank("RolandTR909").gain(1.8)\n{C}\nstack(kick, clap)',
        'Set the kick’s gain to 1 or less: .gain(.9).',
        every({}, w('gain', lte=1, default=0.8)),
        f'{T}\nconst kick = s("bd*4").bank("RolandTR909").gain(.9)\n{C}\nstack(kick, clap)',
        ['E10'], ['mixing'], ['Keep every gain at 1 or below.']),

    fix('reassigned-name', 'Assignment to constant', 'Pressing Play gives an error about assigning to a constant, and nothing plays.',
        'A const can be defined once. Reusing the name later tries to overwrite it.',
        f'{T}\n{K}\n{H}\nhats = s("hh*8").bank("RolandTR909").gain(.4)\nstack(kick, hats)',
        'Give the second part its own name: const ticks = s("hh*8")…, and stack(kick, hats, ticks).',
        all_(defines('ticks'), playsAt('oh', OFFBEATS), playsAt('hh', EIGHTHS)),
        f'{T}\n{K}\n{H}\nconst ticks = s("hh*8").bank("RolandTR909").gain(.4)\nstack(kick, hats, ticks)',
        ['B9'], ['drums'], ['Every part needs its own const name.']),

    fix('commented-out', 'Nothing plays', 'Play does nothing: no sound, and the panel says the code made no pattern.',
        'Two slashes turn the rest of a line into a comment. Check the last line.',
        f'{T}\n{K}\n{C}\n// stack(kick, clap)',
        'Remove the // in front of stack(kick, clap).',
        all_(final('stack'), playsAt('bd', BEATS), playsAt('cp', [0.25, 0.75])),
        f'{T}\n{K}\n{C}\nstack(kick, clap)', ['B9'], ['drums'],
        ['A // comment silences the whole line.']),
]

write(pack('practice-fix-it', 'Practice: fix it', 'Each starter has one bug. The brief says what you hear; find what is wrong.',
           [track('fix-it', 'Fix it', 'Twelve broken loops, one bug each.', lessons)], lessons, tags=['house', 'techno']))
