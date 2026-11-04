"""UK garage / 2-step: a skills track of six lessons. python3 scripts/packgen/uk_garage.py"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from common import *  # noqa: F401,F403

T = 'setcpm(132/4)'
KICK = 'const kick = s("bd [~ bd] ~ ~").bank("RolandTR909")'
SNARE = 'const snare = s("~ sd ~ sd").bank("RolandTR909").gain(.8)'
HATS = 'const hats = s("hh*16").bank("RolandTR909").gain("[.5 .25 .35 .25]*4").swingBy(.2, 8)'
BASS = 'const bass = n("[~ 0] [~ 0] [~ 3] [~ 5]").scale("C2:minor").s("square").decay(.12).sustain(0).lpf(800)'
PIANO = 'const piano = chord("<Cm7 Fm7>").voicing().struct("[~ x ~ ~] [~ ~ x ~] [~ x ~ ~] [x ~ ~ x]").s("piano").clip(.4).gain(.6)'
SKIP = 'const skip = s("[~ ~ ~ rim] [~ ~ rim ~] [~ ~ ~ rim] [~ sd:1 ~ ~]").bank("RolandTR909").gain(.3)'

TWO_STEP_KICK = [0, 0.375]
OFF8 = [0.125, 0.375, 0.625, 0.875]

lessons = [
    lesson('two-step-kick', 'The 2-step kick', 'Break the four-on-the-floor: a kick on 1 and the "and" of 2, snare on 2 and 4.',
           'UK garage grew out of the London pirate-radio scene in the mid-90s, speeding up American garage house and, in **2-step**, throwing away the steady kick. Producers like Todd Edwards and MJ Cole made the drums skip instead of stomp.\n\nThe 2-step kick hits on **beat 1** and the **"and" of 2**: `"bd [~ bd] ~ ~"`. The snare keeps the backbeat on 2 and 4, so the groove still turns over every bar even though the kick is missing half its steps.\n\nThat gap is the whole style: with no kick on 3, the bass and the vocal have room to move.',
           f'{T}\nconst kick = s("bd*4").bank("RolandTR909")\nstack(kick)',
           [task('Make the kick play on beat 1 and the "and" of 2 only.', 's("bd [~ bd] ~ ~")', playsAt('bd', TWO_STEP_KICK), replacedLater=True),
            task('Add a part called snare on beats 2 and 4.', f'{SNARE}, then stack(kick, snare)',
                 all_(defines('snare'), playsAt('sd', [0.25, 0.75])))],
           [f'{T}\n{KICK}\nstack(kick)'],
           f'{T}\n{KICK}\n{SNARE}\nstack(kick, snare)', ['B5', 'B7', 'I2'], ['drums', 'garage'],
           challenge=task('Add a second kick on the last 16th of beat 4, so the bar pushes into the next.', 's("bd [~ bd] ~ [~ ~ ~ bd]")',
                          playsAt('bd', [0, 0.375, 0.9375])),
           challengeSolution=f'{T}\nconst kick = s("bd [~ bd] ~ [~ ~ ~ bd]").bank("RolandTR909")\n{SNARE}\nstack(kick, snare)',
           summary=['2-step drops the kick from beats 2, 3 and 4: it hits on 1 and the "and" of 2.', 'The snare keeps 2 and 4 so the bar still turns over.', 'The gap on beat 3 is where the bass lives.'],
           introduces=['~', '[ ]'], concepts=['2-step'], preload=kit('bd', 'sd')),

    lesson('skipping-hats', 'Skipping hats', 'Shuffle 16th hats hard enough to skip, with accents on the beat.',
           'Garage swings much harder than house. On an MPC you would push swing to 60% or more; here `.swingBy(.2, 8)` delays every second 16th by a fifth of a step and the hats start to **skip**.\n\nA gain pattern puts the weight on the beat and keeps the in-between hats light, so the shuffle reads as bounce rather than mess. An open hat on the "and" of 2 and 4 is the classic garage answer to the snare.',
           f'{T}\n{KICK}\n{SNARE}\nconst hats = s("hh*8").bank("RolandTR909").gain(.4)\nstack(kick, snare, hats)',
           [task('Make the hats 16ths with the hit on each beat louder than the next one.', 's("hh*16") with .gain("[.5 .25 .35 .25]*4")',
                 all_(eq(countOf(snd('hh')), 16),
                      gt(valueAt(snd('hh'), 'gain', index=0, default=0.8), valueAt(snd('hh'), 'gain', index=1, default=0.8)))),
            task('Swing them hard: about 60%.', '.swingBy(.2, 8) on the hats line',
                 all_(eq(countOf(snd('hh')), 16), gte(timeAt(snd('hh'), 1), 1 / 16 + 0.16 / 16), lte(timeAt(snd('hh'), 1), 1 / 16 + 0.26 / 16)))],
           [f'{T}\n{KICK}\n{SNARE}\nconst hats = s("hh*16").bank("RolandTR909").gain("[.5 .25 .35 .25]*4")\nstack(kick, snare, hats)'],
           f'{T}\n{KICK}\n{SNARE}\n{HATS}\nstack(kick, snare, hats)', ['I1', 'I4'], ['drums', 'swing'],
           challenge=task('Add an open hat on the "and" of 2 and the "and" of 4, quiet.', 'const open = s("~ [~ oh] ~ [~ oh]").bank("RolandTR909").gain(.4)',
                          all_(playsAt('oh', [0.375, 0.875]), every(snd('oh'), w('gain', lt=0.6, default=0.8)))),
           challengeSolution=f'{T}\n{KICK}\n{SNARE}\n{HATS}\nconst open = s("~ [~ oh] ~ [~ oh]").bank("RolandTR909").gain(.4)\nstack(kick, snare, hats, open)',
           summary=['Garage swing is heavy: .swingBy(.2, 8) is about 60%.', 'A gain pattern keeps the weight on the beat.', 'An open hat on the "and" of 2 and 4 answers the snare.'],
           introduces=['.swingBy', 'patterned .gain'], preload=kit('bd', 'sd', 'hh', 'oh')),

    lesson('organ-bass-eighths', 'The organ bass in 8ths', 'Write a short, hollow bass on the offbeat 8ths, in a key.',
           'Where house puts the bass on the offbeats of a steady kick, 2-step lets it **bounce in the gaps**: short organ-like stabs on every offbeat 8th, over a kick that only hits twice a bar. The square wave through a low-pass is the cheap-organ tone of a thousand white labels.\n\nKeep it in a key so it agrees with the piano later: `n("…").scale("C2:minor")` picks degrees of C minor two octaves down. Short decay, no sustain, and it stays out of the snare’s way.',
           f'{T}\n{KICK}\n{SNARE}\n{HATS}\nstack(kick, snare, hats)',
           [task('Add a part called bass: a square wave on every offbeat 8th, scale degrees of C minor in octave 2.',
                 'const bass = n("[~ 0] [~ 0] [~ 3] [~ 5]").scale("C2:minor").s("square"), and stack it',
                 all_(defines('bass'), playsAt(None, OFF8, cycles=1, sel=snd('square')), inKey('C:minor', sel=snd('square')),
                      every(snd('square'), w('$midi', lt=48)))),
            task('Make every note a short stab: quick decay, no sustain.', '.decay(.12).sustain(0) on the bass line',
                 every(snd('square'), w('decay', lte=0.2, default=9), w('sustain', eq=0, default=1))),
            task('Round it off with a low-pass around 800 Hz.', '.lpf(800) on the bass line',
                 every(snd('square'), w('cutoff', lte=1000, gt=0)))],
           [f'{T}\n{KICK}\n{SNARE}\n{HATS}\nconst bass = n("[~ 0] [~ 0] [~ 3] [~ 5]").scale("C2:minor").s("square")\nstack(kick, snare, hats, bass)',
            f'{T}\n{KICK}\n{SNARE}\n{HATS}\nconst bass = n("[~ 0] [~ 0] [~ 3] [~ 5]").scale("C2:minor").s("square").decay(.12).sustain(0)\nstack(kick, snare, hats, bass)'],
           f'{T}\n{KICK}\n{SNARE}\n{HATS}\n{BASS}\nstack(kick, snare, hats, bass)', ['B12', 'I5', 'I10'], ['bass', 'organ'],
           challenge=task('Add a sine sub an octave below on the same degrees.', 'const sub = n("[~ 0] [~ 0] [~ 3] [~ 5]").scale("C1:minor").s("sine").decay(.2).sustain(0).gain(.6)',
                          some(snd('sine'), w('$midi', lt=40))),
           challengeSolution=f'{T}\n{KICK}\n{SNARE}\n{HATS}\n{BASS}\nconst sub = n("[~ 0] [~ 0] [~ 3] [~ 5]").scale("C1:minor").s("sine").decay(.2).sustain(0).gain(.6)\nstack(kick, snare, hats, bass, sub)',
           summary=['The 2-step bass bounces in the gaps the kick leaves: offbeat 8ths.', 'scale("C2:minor") picks degrees two octaves down.', 'Short decay, no sustain, low-pass: a cheap organ.'],
           introduces=['n', '.scale', '.decay', '.sustain', '.lpf'], preload=kit('bd', 'sd', 'hh')),

    lesson('chopped-piano', 'Chopped piano', 'Strike a piano chord in a syncopated pattern, cut short.',
           'Garage producers chopped vocals and pianos into stabs and re-played them against the beat. Without vocals we chop the **piano**: one chord, struck wherever the pattern says, each hit cut short with `.clip`.\n\n`chord("<Cm7 Fm7>").voicing()` picks the notes; `.struct("…")` is the rhythm, one `x` per hit; `.clip(.4)` shortens every note to 40% of its step, so the chord stabs instead of ringing. Keep the pattern **syncopated**: hits off the beat more often than on it.',
           f'{T}\n{KICK}\n{SNARE}\n{HATS}\n{BASS}\nstack(kick, snare, hats, bass)',
           [task('Add a part called piano: a Cm7 chord struck in a syncopated 16th pattern.',
                 'const piano = chord("Cm7").voicing().struct("[~ x ~ ~] [~ ~ x ~] [~ x ~ ~] [x ~ ~ x]").s("piano").gain(.6), and stack it',
                 all_(defines('piano'), gte(CHORD_SIZE, 3), gte(countOf(snd('piano', where=[w('$time', neq=0)])), 3),
                      gte(distinct(snd('piano'), '$time'), 4))),
            task('Cut every hit short with clip.', '.clip(.4) on the piano line', every(snd('piano'), w('clip', lte=0.5, gt=0)))],
           [f'{T}\n{KICK}\n{SNARE}\n{HATS}\n{BASS}\nconst piano = chord("Cm7").voicing().struct("[~ x ~ ~] [~ ~ x ~] [~ x ~ ~] [x ~ ~ x]").s("piano").gain(.6)\nstack(kick, snare, hats, bass, piano)'],
           f'{T}\n{KICK}\n{SNARE}\n{HATS}\n{BASS}\nconst piano = chord("Cm7").voicing().struct("[~ x ~ ~] [~ ~ x ~] [~ x ~ ~] [x ~ ~ x]").s("piano").clip(.4).gain(.6)\nstack(kick, snare, hats, bass, piano)',
           ['I6', 'I2'], ['chords', 'piano'],
           challenge=task('Change the chord every bar: Cm7, then Fm7.', 'chord("<Cm7 Fm7>")',
                          neq(values(snd('piano', bar=0), '$pc', unique=True, sorted=True), values(snd('piano', bar=1), '$pc', unique=True, sorted=True))),
           challengeSolution=f'{T}\n{KICK}\n{SNARE}\n{HATS}\n{BASS}\n{PIANO}\nstack(kick, snare, hats, bass, piano)',
           summary=['.struct("…") gives a chord a rhythm; one x per hit.', '.clip(.4) cuts each note to 40% of its step: a stab, not a ring.', 'Syncopate: more hits off the beat than on it.'],
           introduces=['chord', '.voicing', '.struct', '.clip'], preload=kit('bd', 'sd', 'hh') + [{"s": "piano"}]),

    lesson('the-skip', 'The skip', 'Add ghost rims and a second snare between the main hits.',
           'What makes 2-step drums **skip** is everything that happens between the kick and the snare: quiet rimshots a 16th before the beat, a second, softer snare on an offbeat, hits you feel more than hear.\n\nThey go in their own part, kept at a low gain, so the main snare stays in charge. `sd:1` picks the second snare sample, a touch different from the backbeat one.',
           f'{T}\n{KICK}\n{SNARE}\n{HATS}\n{BASS}\n{PIANO}\nstack(kick, snare, hats, bass, piano)',
           [task('Add a part called skip: rimshots on the last 16th of beats 1 and 3, and the third 16th of beat 2, quiet.',
                 'const skip = s("[~ ~ ~ rim] [~ ~ rim ~] [~ ~ ~ rim] ~").bank("RolandTR909").gain(.3), and stack it',
                 all_(defines('skip'), playsAt('rim', [0.1875, 0.375, 0.6875]), every(snd('rim'), w('gain', lt=0.5, default=0.8)))),
            task('Add a ghost snare in the skip part: the second 16th of beat 4, using sd:1.', 'Change the last ~ to [~ sd:1 ~ ~]',
                 all_(includesTimes('sd', [0.8125]), some(snd('sd', at=0.8125), w('n', eq=1), w('gain', lt=0.5, default=0.8))))],
           [f'{T}\n{KICK}\n{SNARE}\n{HATS}\n{BASS}\n{PIANO}\nconst skip = s("[~ ~ ~ rim] [~ ~ rim ~] [~ ~ ~ rim] ~").bank("RolandTR909").gain(.3)\nstack(kick, snare, hats, bass, piano, skip)'],
           f'{T}\n{KICK}\n{SNARE}\n{HATS}\n{BASS}\n{PIANO}\n{SKIP}\nstack(kick, snare, hats, bass, piano, skip)', ['I4', 'I2'], ['drums'],
           challenge=task('Add a second ghost snare on the second 16th of beat 2, just as quiet.', 'Change [~ ~ rim ~] to [~ sd:1 rim ~]',
                          all_(includesTimes('sd', [0.3125, 0.8125]), some(snd('sd', at=0.3125), w('gain', lt=0.5, default=0.8)))),
           challengeSolution=f'{T}\n{KICK}\n{SNARE}\n{HATS}\n{BASS}\n{PIANO}\nconst skip = s("[~ ~ ~ rim] [~ sd:1 rim ~] [~ ~ ~ rim] [~ sd:1 ~ ~]").bank("RolandTR909").gain(.3)\nstack(kick, snare, hats, bass, piano, skip)',
           summary=['Ghost hits between the main ones make the drums skip.', 'Keep them in their own part at a low gain.', 'sd:1 is a second snare sample.'],
           introduces=[':', '.gain'], concepts=['ghost notes'], preload=kit('bd', 'sd', 'rim', 'hh') + [{"s": "piano"}]),

    lesson('two-step-tune', 'Project: A 2-step tune', 'Put the kick, the skip, the organ bass and the chopped piano together, in one key.',
           'A 2-step tune from this pack’s parts: skipping drums, a bass in the gaps, a chopped piano answering it. One `const key` keeps the bass and the piano in tune, so a new key is one edit.\n\nKeep the levels garage-like: the snare the loudest thing, the piano behind the drums, the bass felt in the gap on beat 3. Then a fill every four bars so the loop breathes.',
           f'{T}\nconst key = "C:minor"\n{KICK}\n{SNARE}\nstack(kick, snare)',
           [task('Add hard-swung 16th hats with a gain pattern, and stack them.', f'{HATS}',
                 all_(defines('hats'), eq(countOf(snd('hh')), 16), gte(timeAt(snd('hh'), 1), 1 / 16 + 0.16 / 16))),
            task('Add the organ bass on the offbeat 8ths, in the key, short and filtered.',
                 'const bass = n("[~ 0] [~ 0] [~ 3] [~ 5]").scale(key).s("square").decay(.12).sustain(0).lpf(800)',
                 all_(defines('bass'), inKey(sel=snd('square')), playsAt(None, OFF8, cycles=1, sel=snd('square')),
                      every(snd('square'), w('sustain', eq=0, default=1), w('cutoff', lte=1000, gt=0)))),
            task('Add the chopped piano, two chords alternating, clipped short, behind the drums.',
                 f'{PIANO}',
                 all_(defines('piano'), gte(CHORD_SIZE, 3), every(snd('piano'), w('clip', lte=0.5, gt=0), w('gain', lte=0.7, default=0.8)),
                      neq(values(snd('piano', bar=0), '$pc', unique=True, sorted=True), values(snd('piano', bar=1), '$pc', unique=True, sorted=True))))],
           [f'{T}\nconst key = "C:minor"\n{KICK}\n{SNARE}\n{HATS}\nstack(kick, snare, hats)',
            f'{T}\nconst key = "C:minor"\n{KICK}\n{SNARE}\n{HATS}\nconst bass = n("[~ 0] [~ 0] [~ 3] [~ 5]").scale(key).s("square").decay(.12).sustain(0).lpf(800)\nstack(kick, snare, hats, bass)'],
           f'{T}\nconst key = "C:minor"\n{KICK}\n{SNARE}\n{HATS}\nconst bass = n("[~ 0] [~ 0] [~ 3] [~ 5]").scale(key).s("square").decay(.12).sustain(0).lpf(800)\n{PIANO}\nstack(kick, snare, hats, bass, piano)',
           ['I7', 'I8', 'I19'], ['project', 'garage', 'drums', 'bass', 'chords'], shape='project',
           challenge=task('Roll the snare on the last bar of every four.', 'Add .lastOf(4, x => x.ply(2)) to the snare line',
                          gt(countOf(snd('sd', bar=3)), countOf(snd('sd', bar=0)))),
           challengeSolution=f'{T}\nconst key = "C:minor"\n{KICK}\nconst snare = s("~ sd ~ sd").bank("RolandTR909").gain(.8).lastOf(4, x => x.ply(2))\n{HATS}\nconst bass = n("[~ 0] [~ 0] [~ 3] [~ 5]").scale(key).s("square").decay(.12).sustain(0).lpf(800)\n{PIANO}\nstack(kick, snare, hats, bass, piano)',
           summary=['A 2-step tune: skipping drums, bass in the gaps, a chopped piano.', 'One const key keeps bass and piano in tune.', 'A fill every four bars (.lastOf) marks the phrase.'],
           introduces=['.lastOf', '.ply'], concepts=['const key'], preload=kit('bd', 'sd', 'hh') + [{"s": "piano"}]),
]

tracks = [track('two-step-basics', '2-step basics', 'The skipping kick, hard swing, an organ bass in the gaps and a chopped piano.',
                lessons, requires=['B5', 'B6', 'I1', 'B12'], tags=['garage', 'swing'])]

write(pack('uk-garage', 'UK garage', 'The London 2-step sound: a kick that skips, hats that shuffle hard, an organ bass in the gaps and a chopped piano.',
           tracks, lessons, tags=['garage', 'house', 'swing', 'organ', 'piano']))
