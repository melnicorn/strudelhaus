"""A Detroit techno record: a track line. python3 scripts/packgen/detroit_record.py"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from common import *  # noqa: F401,F403

HEAD = '// A Detroit techno record\nsetcpm(128/4)\nconst key = "C:minor"'
KICK = 'const kick = s("bd*4").bank("RolandTR909")'
HATS = 'const hats = s("[~ oh]*4").bank("RolandTR909").gain(.4)'
STR0 = 'const strings = n("[0,2,4,6]").scale(key).s("supersaw").gain(.35).attack(.8).release(1.5)'
STR = STR0 + '.hpf(300)'
STAB0 = 'const stab = n("[0,2,4,6,8]").scale(key).s("square").struct("[~ x]*2").gain(.4)'
STAB1 = STAB0 + '.decay(.15).sustain(0)'
STAB = STAB1 + '.lpf(1200)'
TICKS0 = 'const ticks = s("hh*16").bank("RolandTR909").gain("[.5 .25 .35 .25]*4")'
TICKS = TICKS0 + '.swingBy(.14, 8)'
BASS0 = 'const bass = n("[~ 0] [~ 0] [~ 3] [~ 5]").scale(key).s("sawtooth").octave(2)'
BASS = BASS0 + '.decay(.15).sustain(0).lpf(600)'
CLAP = 'const clap = s("<[~ cp ~ cp] [~ cp ~ [cp cp]]>").bank("RolandTR909").gain(.6)'
TICKS_FILL = TICKS + '.lastOf(8, x => x.ply(2))'
SECTIONS = 'const intro = stack(kick, hats, ticks)\nconst main = stack(kick, hats, ticks, strings, stab, bass, clap)\nconst breakdown = stack(strings, stab, clap)\nconst outro = stack(kick, hats)'
ARR = 'arrange([16, intro], [32, main], [16, breakdown], [16, outro])'

S1 = f'{HEAD}\n{KICK}\n{HATS}\nstack(kick, hats)'
S2 = f'{HEAD}\n{KICK}\n{HATS}\n{STR}\nstack(kick, hats, strings)'
S3 = f'{HEAD}\n{KICK}\n{HATS}\n{STR}\n{STAB}\nstack(kick, hats, strings, stab)'
S4 = f'{HEAD}\n{KICK}\n{HATS}\n{STR}\n{STAB}\n{TICKS}\nstack(kick, hats, strings, stab, ticks)'
S5 = f'{HEAD}\n{KICK}\n{HATS}\n{STR}\n{STAB}\n{TICKS}\n{BASS}\nstack(kick, hats, strings, stab, ticks, bass)'
S6 = f'{HEAD}\n{KICK}\n{HATS}\n{STR}\n{STAB}\n{TICKS_FILL}\n{BASS}\n{CLAP}\nstack(kick, hats, strings, stab, ticks, bass, clap)'
S7 = f'{HEAD}\n{KICK}\n{HATS}\n{STR}\n{STAB}\n{TICKS_FILL}\n{BASS}\n{CLAP}\n{SECTIONS}\n{ARR}'
HATS_M = 'const hats = s("[~ oh]*4").bank("RolandTR909").gain(.4).hpf(400)'
TICKS_M = TICKS_FILL + '.hpf(400)'
BASS_M = BASS + '.gain(.7)'
SECTIONS_M = 'const intro = stack(kick, hats, ticks)\nconst build = stack(kick, hats, ticks, strings)\nconst main = stack(kick, hats, ticks, strings, stab, bass, clap)\nconst breakdown = stack(strings, stab, clap)\nconst outro = stack(kick, hats)'
ARR_M = 'arrange([16, intro], [16, build], [32, main], [16, breakdown], [16, outro])'
S8a = f'{HEAD}\n{KICK}\n{HATS_M}\n{STR}\n{STAB}\n{TICKS_M}\n{BASS}\n{CLAP}\n{SECTIONS}\n{ARR}'
S8b = f'{HEAD}\n{KICK}\n{HATS_M}\n{STR}\n{STAB}\n{TICKS_M}\n{BASS_M}\n{CLAP}\n{SECTIONS}\n{ARR}'
S8 = f'{HEAD}\n{KICK}\n{HATS_M}\n{STR}\n{STAB}\n{TICKS_M}\n{BASS_M}\n{CLAP}\n{SECTIONS_M}\n{ARR_M}'

sup = snd('supersaw')
sq = snd('square')
saw = snd('sawtooth')
P909 = kit('bd', 'oh', 'hh', 'cp')

lessons = [
    lesson('the-pulse', 'The pulse', 'Start the record: a 909 kick and quiet open hats at 128 BPM.',
           'Detroit techno was made by three high-school friends from Belleville, Michigan: **Juan Atkins**, **Derrick May** and **Kevin Saunderson**. They heard Kraftwerk and Parliament on the same radio show and built a music that was both: machine-steady and soulful.\n\nIt begins where every techno record begins, with the **pulse**: a TR-909 kick on every beat and open hats on the offbeats. We set `const key` now so every pitched part later agrees. This whole track grows across the next seven lessons; each one starts from the code you finish here.',
           f'{HEAD}\n',
           [task('Add a part called kick: a TR-909 kick on every beat.', 'const kick = s("bd*4").bank("RolandTR909"), then stack(kick).',
                 all_(defines('kick'), includesTimes('bd', BEATS), every(snd('bd'), w('bank', eq=TR909)))),
            task('Add a part called hats: open hats on the offbeats, quiet.', 'const hats = s("[~ oh]*4").bank("RolandTR909").gain(.4), and stack(kick, hats).',
                 all_(defines('hats'), includesTimes('oh', OFFBEATS), every(snd('oh'), w('gain', lt=0.6, default=0.8))))],
           [f'{HEAD}\n{KICK}\nstack(kick)'], S1, ['B4', 'B6', 'B9'], ['drums', '909'],
           summary=['Techno starts with a steady 909 pulse.', 'const key up front keeps every later part in tune.'],
           introduces=['s', '.bank', 'stack'], concepts=['const key'], preload=kit('bd', 'oh')),

    lesson('the-strings', 'The strings', 'Add the Detroit string pad: wide, slow and high-passed.',
           'The sound that made Detroit different from Chicago was **strings**: synthesized string pads borrowed from Italo disco and film scores, floating over the drums. Derrick May’s *Strings of Life* is named for them.\n\nA **supersaw** chord with a slow **attack** and a long **release** does the job. Strings carry no low end, so a **high-pass filter** at 300 Hz takes the mud out and leaves room for the kick. Scale degrees `0,2,4,6` in the key give a minor seventh chord.',
           S1,
           [task('Add a part called strings: a four-note chord in the key on a supersaw, soft, with a slow attack and a long release.',
                 'const strings = n("[0,2,4,6]").scale(key).s("supersaw").gain(.35).attack(.8).release(1.5), and stack it.',
                 all_(defines('strings'), inKey(sel=sup), gte(countOf(sup), 4), every(sup, w('attack', gte=0.5, default=0), w('release', gte=1, default=0)))),
            task('High-pass the strings at 300 Hz.', '.hpf(300) on the strings line.', every(sup, w('hcutoff', gte=250, default=0)))],
           [f'{HEAD}\n{KICK}\n{HATS}\n{STR0}\nstack(kick, hats, strings)'], S2, ['I6', 'I10', 'I12'], ['strings', 'pads', 'chords'],
           summary=['Detroit strings: a supersaw chord with slow attack and release.', 'High-pass pads so they never fight the kick.'],
           introduces=['.attack', '.release', '.hpf', '.scale'], preload=kit('bd', 'oh')),

    lesson('the-chord', 'The chord', 'Add a short minor-ninth stab on the offbeats of 2 and 4.',
           'Under the strings sits the **stab**: a chord hit short and hard. Detroit favoured the **minor ninth**, five notes that sound both dark and bright. Kevin Saunderson’s Inner City records are full of them.\n\nScale degrees `0,2,4,6,8` build it in the key. A **square** wave gives a hollow, synthetic tone; a quick **decay** with no **sustain** makes it a stab rather than a pad; a low-pass filter rounds its top off.',
           S2,
           [task('Add a part called stab: a five-note chord in the key on a square wave, on the offbeats of beats 2 and 4.',
                 'const stab = n("[0,2,4,6,8]").scale(key).s("square").struct("[~ x]*2").gain(.4), and stack it.',
                 all_(defines('stab'), inKey(sel=sq), includesTimes(None, [0.25, 0.75]) if False else eq(values(sq, '$time', unique=True, sorted=True), [0.25, 0.75]), gte(countOf(sq), 10))),
            task('Make it a stab: quick decay, no sustain.', '.decay(.15).sustain(0) on the stab line.',
                 every(sq, w('decay', lte=0.2, default=9), w('sustain', eq=0, default=1))),
            task('Round it off with a low-pass at 1200 Hz.', '.lpf(1200) on the stab line.', every(sq, w('cutoff', lte=1500, gt=0)))],
           [f'{HEAD}\n{KICK}\n{HATS}\n{STR}\n{STAB0}\nstack(kick, hats, strings, stab)',
            f'{HEAD}\n{KICK}\n{HATS}\n{STR}\n{STAB1}\nstack(kick, hats, strings, stab)'],
           S3, ['I6', 'I10', 'B14'], ['chords', 'sound design'],
           summary=['The Detroit stab is a minor ninth, hit short.', 'Short decay and no sustain turn a chord into a stab.'],
           introduces=['.struct', '.decay', '.sustain', '.lpf'], preload=kit('bd', 'oh')),

    lesson('rolling-hats', 'Rolling hats', 'Add 16th hats with accents and a light swing.',
           'What makes a techno groove **roll** is the hi-hat line: closed hats on every 16th, louder on the beat, with a touch of **swing** so the grid breathes. The 909’s hats were sampled from real cymbals, which is why they cut through.\n\nA **gain pattern** in quotes sets a level per step; `.swingBy(.14, 8)` pushes every second 16th a little late, about 57% on an MPC.',
           S3,
           [task('Add a part called ticks: closed hats on every 16th with a gain pattern that accents the beat.',
                 'const ticks = s("hh*16").bank("RolandTR909").gain("[.5 .25 .35 .25]*4"), and stack it.',
                 all_(defines('ticks'), eq(count(s='hh'), 16), gt(valueAt(snd('hh'), 'gain', index=0, default=0.8), valueAt(snd('hh'), 'gain', index=1, default=0.8)))),
            task('Swing them a little: about 57%.', '.swingBy(.14, 8) on the ticks line.',
                 all_(gte(timeAt(snd('hh'), 1), 0.0686), lte(timeAt(snd('hh'), 1), 0.0776)))],
           [f'{HEAD}\n{KICK}\n{HATS}\n{STR}\n{STAB}\n{TICKS0}\nstack(kick, hats, strings, stab, ticks)'], S4, ['B3', 'I4', 'I1'], ['drums', 'swing'],
           summary=['16th hats with accents make a techno groove roll.', '.swingBy(.14, 8) is a light, 57% swing.'],
           introduces=['patterned .gain', '.swingBy'], preload=kit('bd', 'oh', 'hh')),

    lesson('bass-in-the-gaps', 'The bass in the gaps', 'Add an offbeat bass in the key, short and filtered.',
           'Detroit bass lines sit **between the kicks**, on the offbeats, so the low end never doubles up. The notes come from the same key as the strings and the stab, which is what `const key` was for.\n\nA **sawtooth** two octaves down, with a short envelope and a low-pass around 600 Hz, is round and heavy. The pattern `[~ 0] [~ 0] [~ 3] [~ 5]` walks the root, the fourth and the fifth of the scale.',
           S4,
           [task('Add a part called bass: scale degrees in the key on a sawtooth, two octaves down, on every offbeat.',
                 'const bass = n("[~ 0] [~ 0] [~ 3] [~ 5]").scale(key).s("sawtooth").octave(2), and stack it.',
                 all_(defines('bass'), inKey(sel=saw), includesTimes(None, OFFBEATS) if False else eq(values(saw, '$time', unique=True, sorted=True), OFFBEATS))),
            task('Make it short and dark: quick decay, no sustain, low-pass at 600 Hz.', '.decay(.15).sustain(0).lpf(600) on the bass line.',
                 every(saw, w('sustain', eq=0, default=1), w('cutoff', lte=800, gt=0)))],
           [f'{HEAD}\n{KICK}\n{HATS}\n{STR}\n{STAB}\n{TICKS}\n{BASS0}\nstack(kick, hats, strings, stab, ticks, bass)'], S5, ['B12', 'I8', 'I5'], ['bass'],
           summary=['Offbeat bass keeps the low end clear of the kick.', 'Scale degrees in the shared key keep bass and chords agreeing.'],
           introduces=['n', '.octave'], preload=kit('bd', 'oh', 'hh')),

    lesson('variation-every-8', 'Variation every eight', 'Add a two-bar clap and a hat fill every eighth bar.',
           'A loop that never changes is a demo, not a record. Detroit tracks change on the **phrase**: every two bars a small difference, every eight a **fill**.\n\n`<a b>` alternates two patterns bar by bar, so the clap can answer itself. `.lastOf(8, x => x.ply(2))` doubles every hat in the last bar of every eight: a roll that announces the next phrase.',
           S5,
           [task('Add a part called clap: a 909 clap on 2 and 4 in odd bars, with an extra double hit in even bars.',
                 'const clap = s("<[~ cp ~ cp] [~ cp ~ [cp cp]]>").bank("RolandTR909").gain(.6), and stack it.',
                 all_(defines('clap'), includesTimes('cp', [0.25, 0.75]), neq({"times": snd('cp', bar=0)}, {"times": snd('cp', bar=1)}))),
            task('Make the hats roll in the last bar of every eight.', '.lastOf(8, x => x.ply(2)) on the ticks line.',
                 all_(uses('lastOf'), gt(count(s='hh', bar=7), count(s='hh', bar=0))))],
           [f'{HEAD}\n{KICK}\n{HATS}\n{STR}\n{STAB}\n{TICKS}\n{BASS}\n{CLAP}\nstack(kick, hats, strings, stab, ticks, bass, clap)'], S6, ['I19', 'E3'], ['drums', 'arrangement'],
           summary=['< > alternates bar by bar.', '.lastOf(8, f) changes the last bar of every eight.'],
           introduces=['< >', '.lastOf', '.ply'], preload=P909),

    lesson('sections', 'Sections', 'Name the sections and arrange them, with a breakdown that drops the kick.',
           'Detroit records are built for DJs and dancers alike: a drums-only **intro** to mix into, a long **main** section, a **breakdown** where the kick leaves and the strings take over, and an **outro** to mix out of.\n\nA section is a named `stack`. `arrange([16, intro], …)` plays each one for that many bars; every section restarts its own clock.',
           S6,
           [task('Name four sections: intro (kick, hats, ticks), main (everything), breakdown (strings, stab, clap: no kick) and outro (kick, hats). Keep playing main for now.',
                 'const intro = stack(kick, hats, ticks), const main = stack(kick, hats, ticks, strings, stab, bass, clap), const breakdown = stack(strings, stab, clap), const outro = stack(kick, hats); end the code with main.',
                 all_(block('intro', ['group', 'section'], ['kick', 'hats', 'ticks']), block('main', ['group', 'section'], ['kick', 'strings', 'stab', 'bass', 'clap']),
                      block('breakdown', ['group', 'section'], ['strings', 'stab']), block('outro', ['group', 'section'], ['kick', 'hats']))),
            task('Arrange them: 16 bars of intro, 32 of main, 16 of breakdown, 16 of outro.',
                 'Replace the last line with arrange([16, intro], [32, main], [16, breakdown], [16, outro]).',
                 all_(final('arrange'), gte(ROWS, 4), eq(count(s='bd', bar=48), 0), some(snd('square', bar=16)), eq(count(s='square', bar=0), 0)))],
           [f'{HEAD}\n{KICK}\n{HATS}\n{STR}\n{STAB}\n{TICKS_FILL}\n{BASS}\n{CLAP}\n{SECTIONS}\nmain'], S7, ['E4', 'E6', 'E7'], ['arrangement'],
           composition=True,
           summary=['Sections are named stacks; arrange() plays them in turn.', 'A breakdown drops the kick and lets the strings carry the room.'],
           introduces=['arrange'], concepts=['sections'], preload=P909),

    lesson('the-mix', 'Project: The mix', 'Clear the low end, set the levels and finish the arrangement.',
           'Mixing in Strudel means three things: **cut what a part doesn’t need** (high-pass the hats), **keep every level under the kick** (nothing above .8 but the kick itself), and give the record its full **shape**.\n\nA fifth section, a **build** where the strings join the drums before the main section, makes the first drop land. Five sections, 96 bars: a record you could play out.',
           S7,
           [task('High-pass both hat parts at 400 Hz.', '.hpf(400) on the hats line and on the ticks line.',
                 all_(every(snd('oh'), w('hcutoff', gte=300, default=0)), every(snd('hh'), w('hcutoff', gte=300, default=0)))),
            task('Set the bass level to .7, so nothing but the kick is above .8.', '.gain(.7) on the bass line.',
                 all_(every({"s": "sawtooth", "cycles": 33}, w('gain', lte=0.8, defined=True)),
                      every({"cycles": 33, "where": [w("s", neq="bd")]}, w('gain', lte=0.8, default=0.8)))),
            task('Add a build section (kick, hats, ticks, strings) between the intro and main, and arrange all five: 16, 16, 32, 16, 16.',
                 'const build = stack(kick, hats, ticks, strings), then arrange([16, intro], [16, build], [32, main], [16, breakdown], [16, outro]).',
                 all_(block('build', ['group', 'section'], ['strings']), gte(ROWS, 5), gte(rowStart(4), 48), gte(rowBars(4), 16), some(snd('supersaw', bar=16)), eq(count(s='square', bar=16), 0)))],
           [S8a, S8b], S8, ['E10', 'E11', 'E5'], ['project', 'track', 'mixing', 'arrangement'], shape='project', composition=True,
           summary=['High-pass what has no low end; keep every level under the kick.', 'A build before the main section makes the drop land.', 'Five sections, 96 bars: a record.'],
           introduces=['.hpf', '.gain'], concepts=['gain staging'], preload=P909),
]

write(pack('detroit-record', 'A Detroit techno record', 'One track built from nothing, a lesson at a time: pulse, strings, the chord, rolling hats, bass, variation, sections, the mix.',
           [track('detroit-record', 'A Detroit techno record', 'Every lesson starts from the code you finished in the one before, and the last one is a whole record.',
                  lessons, kind='line', requires=['B9', 'I6', 'I9', 'I18'])],
           lessons, tags=['detroit techno', 'techno', 'strings', 'track']))
