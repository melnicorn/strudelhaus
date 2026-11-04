"""A deep house EP track: a track line. python3 scripts/packgen/deep_house_ep.py"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from common import *  # noqa: F401,F403

HEAD = 'setcpm(120/4)\nconst key = "C:minor"'
KICK = 'const kick = s("bd*4").bank("RolandTR909")'
CLAP0 = 'const clap = s("~ cp ~ cp").bank("RolandTR909").gain(.7).room(.2)'
CLAP = CLAP0 + '.lastOf(8, x => x.ply(2))'
HATS = 'const hats = s("hh*16").bank("RolandTR909").gain("[.5 .25 .35 .25]*4").swingBy(.14, 8)'
HATS_MIX = HATS + '.hpf(300)'
BASS0 = 'const bass = n("[~ 0] [~ 0] [~ 3] [~ 0]").scale("C2:minor").s("square")'
BASS1 = BASS0 + '.decay(.12).sustain(0)'
BASS = BASS1 + '.lpf(700)'
PIANO0 = 'const piano = chord("<Cm7 Fm7>").voicing().struct("[~ x]*2").s("piano")'
PIANO = PIANO0 + '.gain(.5).room(.3)'
PIANO_MIX = PIANO + '.orbit(2).hpf(150)'
OPEN = 'const open = s("[~ oh]*4").bank("RolandTR909").gain(.4).mask("<0 0 0 0 1 1 1 1>")'
DARK = 'const dark = x => x.lpf(400)'
BREAKDOWN = 'const breakdown = stack(piano, hats)'
MAIN = 'const main = stack(kick, clap, hats, open, bass, piano)'
INTRO = 'const intro = stack(kick, hats, dark(piano))'
OUTRO = 'const outro = stack(kick, hats)'
ARR = 'arrange([16, intro], [32, main], [16, breakdown], [32, main], [16, outro])'


def code(*lines):
    return '\n'.join([HEAD, *lines])


S1a = code(KICK, 'stack(kick)')
S1b = code(KICK, CLAP0, 'stack(kick, clap)')
S1 = code(KICK, CLAP0, HATS, 'stack(kick, clap, hats)')
S2a = code(KICK, CLAP0, HATS, BASS0, 'stack(kick, clap, hats, bass)')
S2b = code(KICK, CLAP0, HATS, BASS1, 'stack(kick, clap, hats, bass)')
S2 = code(KICK, CLAP0, HATS, BASS, 'stack(kick, clap, hats, bass)')
S3a = code(KICK, CLAP0, HATS, BASS, PIANO0, 'stack(kick, clap, hats, bass, piano)')
S3 = code(KICK, CLAP0, HATS, BASS, PIANO, 'stack(kick, clap, hats, bass, piano)')
S4a = code(KICK, CLAP, HATS, BASS, PIANO, 'stack(kick, clap, hats, bass, piano)')
S4 = code(KICK, CLAP, HATS, OPEN, BASS, PIANO, 'stack(kick, clap, hats, open, bass, piano)')
FINAL = 'stack(kick, clap, hats, open, bass, piano)'
S5a = code(KICK, CLAP, HATS, OPEN, BASS, PIANO, '', BREAKDOWN, FINAL)
S5 = code(KICK, CLAP, HATS, OPEN, BASS, PIANO, '', BREAKDOWN, MAIN, FINAL)
S6a = code(KICK, CLAP, HATS, OPEN, BASS, PIANO, '', DARK, '', BREAKDOWN, MAIN, FINAL)
S6 = code(KICK, CLAP, HATS, OPEN, BASS, PIANO, '', DARK, '', INTRO, BREAKDOWN, MAIN, FINAL)
S7a = code(KICK, CLAP, HATS, OPEN, BASS, PIANO, '', DARK, '', INTRO, BREAKDOWN, MAIN, OUTRO, FINAL)
S7 = code(KICK, CLAP, HATS, OPEN, BASS, PIANO, '', DARK, '', INTRO, BREAKDOWN, MAIN, OUTRO, ARR)
S8a = code(KICK, CLAP, HATS_MIX, OPEN, BASS, PIANO, '', DARK, '', INTRO, BREAKDOWN, MAIN, OUTRO, ARR)
S8 = code(KICK, CLAP, HATS_MIX, OPEN, BASS, PIANO_MIX, '', DARK, '', INTRO, BREAKDOWN, MAIN, OUTRO, ARR)

P = kit('bd', 'cp', 'hh', 'oh') + [{"s": "piano"}]
TAGS = ['deep house']

lessons = [
    lesson('the-groove', 'The groove', 'Start the track: a 909 kick, a clap in a small room, shuffled hats.',
           'This line of lessons builds one deep house track from nothing. Each lesson picks the code up where the last one left it, so by the end you will have written a whole record.\n\nDeep house starts with a **groove** rather than a beat: four on the floor, a clap on 2 and 4 pushed back with a little reverb, and 16th hats that **shuffle** (every second 16th a touch late) with a gain pattern so the beat breathes. 120 BPM, a little slower than the core lessons.',
           HEAD + '\n',
           [task('Add a part called kick: a TR-909 kick on every beat.', f'{KICK}, then play it with stack(kick).',
                 all_(defines('kick'), includesTimes('bd', BEATS), every(snd('bd'), w('bank', eq=TR909)))),
            task('Add a part called clap on beats 2 and 4, at gain .7, in a small room.', f'{CLAP0}, and stack(kick, clap).',
                 all_(defines('clap'), includesTimes('cp', [0.25, 0.75]), every(snd('cp'), w('room', gt=0, default=0), w('gain', lte=0.7, default=0.8)))),
            task('Add a part called hats: 16th hats with a gain pattern, swung about 57%.', f'{HATS}, and stack(kick, clap, hats).',
                 all_(defines('hats'), eq(count(s='hh', bar=0), 16), gte(timeAt(snd('hh'), 1), 0.0686), gte(distinct(snd('hh'), 'gain'), 2)))],
           [S1a, S1b], S1, ['B4', 'B5', 'I1', 'I4'], TAGS + ['drums', '909'],
           summary=['Kick on the beats, clap on 2 and 4, shuffled 16th hats.', 'A gain pattern and .swingBy make the hats breathe.'],
           introduces=['s', '.bank', '.room', '.swingBy', 'patterned .gain'], preload=P),

    lesson('the-organ-bass', 'The organ bass', 'Add the hollow square-wave bass between the kicks, in the key.',
           'The deep house bass is an **organ bass**: a square wave in short stabs on the **offbeats**, so it never collides with the kick. It stays in the key, C minor, so the piano we add next agrees with it.\n\n`n("0 … 3").scale("C2:minor")` picks scale degrees; the 2 in the scale name puts them in the second octave. A fast **decay** with no **sustain** makes each note a stab, and a low-pass around 700 Hz keeps it woody.',
           S1,
           [task('Add a part called bass: a square wave on scale degrees of C minor, octave 2, on every offbeat.', f'{BASS0}, and stack it.',
                 all_(defines('bass'), playsAt(None, OFFBEATS, cycles=1, sel=snd('square')), inKey(key='C:minor', sel=snd('square')), every(snd('square'), w('$midi', lt=48)))),
            task('Make every bass note a short stab: quick decay, no sustain.', '.decay(.12).sustain(0) on the bass line.',
                 every(snd('square'), w('decay', lte=0.2, default=9), w('sustain', eq=0, default=1))),
            task('Round it off with a low-pass at 700 Hz.', '.lpf(700) on the bass line.',
                 every(snd('square'), w('cutoff', lte=900, gt=0)))],
           [S2a, S2b], S2, ['B12', 'I5', 'I10'], TAGS + ['bass', 'organ'],
           summary=['A square wave in short offbeat stabs is the organ bass.', 'scale("C2:minor") keeps it in key and in octave 2.'],
           introduces=['n', '.scale', '.decay', '.sustain', '.lpf'], preload=P),

    lesson('the-piano-stab', 'The piano stab', 'Add the piano chords, answering the clap, behind the drums.',
           'The sound of deep house is a **sampled piano** playing minor-seventh chords on the offbeats of 2 and 4, where it answers the clap instead of sitting on it.\n\n`chord("<Cm7 Fm7>").voicing()` picks the notes and alternates two chords bar by bar; `.struct("[~ x]*2")` says when they hit. Keep it quiet and in a little **reverb**: the piano lives behind the drums.',
           S2,
           [task('Add a part called piano: Cm7 and Fm7 alternating, on the piano sound, hitting on the offbeats of 2 and 4.', f'{PIANO0}, and stack it.',
                 all_(defines('piano'), gte(CHORD_SIZE, 3), eq(values(snd('piano'), '$time', unique=True, sorted=True), [0.25, 0.75]),
                      neq(values(snd('piano', bar=0), '$pc', unique=True, sorted=True), values(snd('piano', bar=1), '$pc', unique=True, sorted=True)))),
            task('Put it behind the drums: gain .5 and a little room.', '.gain(.5).room(.3) on the piano line.',
                 every(snd('piano'), w('gain', lte=0.6, default=0.8), w('room', gt=0, default=0)))],
           [S3a], S3, ['I6', 'I7', 'I14'], TAGS + ['chords', 'piano'],
           summary=['chord(…).voicing().struct("[~ x]*2"): the deep house piano.', 'Angle brackets alternate chords bar by bar.'],
           introduces=['chord', '.voicing', '.struct'], preload=P),

    lesson('the-8-bar-phrase', 'The 8-bar phrase', 'Make the loop breathe over eight bars: a clap fill and open hats in the second half.',
           'Dance music is counted in **phrases** of 8 bars. A loop that is identical every bar feels static; one that changes at the phrase boundary feels like it is going somewhere.\n\nTwo small moves: `.lastOf(8, x => x.ply(2))` doubles the claps in the last bar of every eight (a fill), and open hats that only play in bars 5–8, using `.mask("<0 0 0 0 1 1 1 1>")`, which silences them for the first four.',
           S3,
           [task('Double the clap in the last bar of every eight.', 'Add .lastOf(8, x => x.ply(2)) to the clap line.',
                 gt(count(s='cp', bar=7), count(s='cp', bar=0))),
            task('Add a part called open: offbeat open hats that only play in bars 5 to 8.', f'{OPEN}, and stack it.',
                 all_(defines('open'), eq(count(s='oh', bar=0), 0), gt(count(s='oh', bar=4), 0), eq(count(s='oh', bar=3), 0)))],
           [S4a], S4, ['E3', 'I19', 'E6'], TAGS + ['drums', 'arrangement'],
           summary=['Change something every 8 bars.', '.lastOf(8, f) makes a fill; .mask("<0 … 1 …>") brings a part in by bar.'],
           introduces=['.lastOf', '.ply', '.mask'], preload=P),

    lesson('the-breakdown', 'The breakdown', 'Name the sections: a piano breakdown and the main groove.',
           'A track is a loop with a **shape**, and the shape is made of **sections**: named stacks of the parts that play in them. The **breakdown** is where the kick drops out and the piano carries the room; **main** is everything.\n\nNaming them changes nothing yet: the last line still plays all the parts. The next lessons add the intro and the outro, and then arrange the sections in order.',
           S4,
           [task('Define a group called breakdown with just the piano and the hats.', f'{BREAKDOWN}, above the last line.',
                 block('breakdown', ['group', 'section'], ['piano', 'hats'])),
            task('Define a group called main with every part.', f'{MAIN}, below breakdown. Keep the last line as it is.',
                 block('main', ['group', 'section'], ['kick', 'clap', 'hats', 'open', 'bass', 'piano']))],
           [S5a], S5, ['E4', 'E6'], TAGS + ['arrangement'], composition=True,
           summary=['Sections are named stacks.', 'A breakdown drops the kick and lets the piano carry the room.'],
           introduces=['stack'], concepts=['sections'], preload=P),

    lesson('the-filtered-intro', 'The filtered intro', 'Build an intro where the piano is heard through a closed filter.',
           'The classic deep house opening: drums and a **filtered** piano, the chords muffled as if through a wall, until the filter opens and the track arrives.\n\nA **modifier** is a reusable change: `const dark = x => x.lpf(400)` is a function that low-passes whatever you hand it. `dark(piano)` inside the intro section filters the piano there and nowhere else.',
           S5,
           [task('Define a modifier called dark that low-passes a part at 400 Hz.', f'{DARK}, above the sections.',
                 block('dark', 'modifier')),
            task('Define a group called intro: kick, hats and the darkened piano.', f'{INTRO}, above breakdown.',
                 all_(block('intro', ['group', 'section'], ['kick', 'hats']), matches(r'dark\(\s*piano\s*\)')))],
           [S6a], S6, ['E7', 'B14'], TAGS + ['arrangement', 'effects'], composition=True,
           summary=['A modifier is a function you apply to a part.', 'A filtered intro hides the chords until the drop.'],
           introduces=['x => …'], concepts=['modifiers'], preload=P),

    lesson('the-arrangement', 'The arrangement', 'Put the sections in order: intro, main, breakdown, main, outro.',
           'Now the record takes shape. `arrange([bars, section], …)` plays each section for that many bars, in turn, and each section restarts its own clock, so the 8-bar phrase starts fresh every time.\n\nA DJ-friendly **outro** of kick and hats lets the next record mix in. 16 + 32 + 16 + 32 + 16 = 112 bars: about 3¾ minutes at 120 BPM.',
           S6,
           [task('Define a group called outro: kick and hats only.', f'{OUTRO}, below main.',
                 block('outro', ['group', 'section'], ['kick', 'hats'])),
            task('Replace the last line with the arrangement: 16 bars of intro, 32 main, 16 breakdown, 32 main, 16 outro.', f'{ARR}',
                 all_(final('arrange'), gte(ROWS, 5), gte(rowBars(0), 16), eq(count(s='bd', bar=48), 0), some(snd('piano', bar=48)), some(snd('bd', bar=16)), some(snd('square', bar=16))))],
           [S7a], S7, ['E3', 'E4', 'E7'], TAGS + ['arrangement', 'track'], composition=True,
           summary=['arrange() plays sections for so many bars each.', 'Intro and outro of drums let a DJ mix the record.'],
           introduces=['arrange'], preload=P),

    lesson('the-mix', 'Project: The mix', 'Clear the low end and set the levels so the kick stays on top.',
           'The last job is the **mix**. Two rules carry most of it: cut what a part does not need, and keep the kick the loudest thing.\n\nA **high-pass** on the hats (300 Hz) and the piano (150 Hz) removes lows they never used, so the kick and bass have the bottom to themselves. The piano gets its own **orbit** so its reverb is its own. Every part but the kick sits at gain .8 or below.',
           S7,
           [task('High-pass the hats at 300 Hz.', '.hpf(300) at the end of the hats line.',
                 every(snd('hh'), w('hcutoff', gte=300, default=0))),
            task('Give the piano its own orbit, 2, and high-pass it at 150 Hz.', '.orbit(2).hpf(150) at the end of the piano line.',
                 every(snd('piano'), w('orbit', eq=2, default=1), w('hcutoff', gte=150, default=0))),
            task('Check the levels: every part except the kick at gain .8 or below.', 'They already are; this ticks once the two edits above are in and nothing is louder than .8.',
                 all_(every({"where": [w('s', neq='bd')], "cycles": 17}, w('gain', lte=0.8, default=0.8)), every(snd('hh'), w('hcutoff', gte=300, default=0)), every(snd('piano'), w('orbit', eq=2, default=1))))],
           [S8a, S8], S8, ['E10', 'E11', 'E12'], TAGS + ['project', 'mixing', 'track'], shape='project', composition=True,
           summary=['High-pass what doesn’t need lows.', 'One orbit per effect; the kick stays loudest.', 'You wrote a whole deep house record.'],
           introduces=['.hpf', '.orbit'], preload=P),
]

write(pack('deep-house-ep', 'A deep house EP track', 'One deep house track built from nothing, a lesson at a time: groove, organ bass, piano, phrase, sections, arrangement, mix.',
           [track('deep-house-ep', 'A deep house EP track', 'Every lesson starts from the code you finished in the one before, and the last one is the whole record.',
                  lessons, kind='line', requires=['B9', 'I6', 'I1', 'B12'])],
           lessons, tags=['deep house', 'house', 'piano', 'organ', 'track']))
