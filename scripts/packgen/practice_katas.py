"""Practice: katas. A brief, one target, no walkthrough. python3 scripts/packgen/practice_katas.py"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from common import *  # noqa: F401,F403

T = 'setcpm(124/4)'
K = 'const kick = s("bd*4").bank("RolandTR909")'
C = 'const clap = s("~ cp ~ cp").bank("RolandTR909")'


def kata(id, title, brief, starter, done, hint, check, solution, teaches, tags, preload=None, composition=False):
    return lesson(id, title, brief, '', starter, [task(f'Done when: {done}', hint, check)], [], solution, teaches, tags,
                  shape='kata', summary=[], preload=preload or kit('bd', 'cp', 'hh', 'sd'), composition=composition)


def times(s, bar):
    return {"times": {"s": s, "bar": bar}}


lessons = [
    kata('fill-no-hats', 'The fill', 'A four-bar phrase: hats in bars 1–3, none in bar 4, and a snare fill in bar 4.',
         f'{T}\n{K}\nconst hats = s("hh*8").bank("RolandTR909").gain(.4)\nconst snare = s("~ sd ~ sd").bank("RolandTR909")\nstack(kick, hats, snare)',
         'closed hats play in bars 1–3 and not at all in bar 4; bar 4 has more snare hits than bar 1.',
         'hats: s("<[hh*8] [hh*8] [hh*8] ~>"); snare: s("<[~ sd ~ sd]!3 [sd*8]>") or .lastOf(4, x => x.ply(4)).',
         all_(gte(count(s='hh', bar=0), 4), gte(count(s='hh', bar=2), 4), eq(count(s='hh', bar=3), 0),
              gt(count(s='sd', bar=3), count(s='sd', bar=0))),
         f'{T}\n{K}\nconst hats = s("<[hh*8] [hh*8] [hh*8] ~>").bank("RolandTR909").gain(.4)\nconst snare = s("~ sd ~ sd").bank("RolandTR909").lastOf(4, x => x.ply(4))\nstack(kick, hats, snare)',
         ['I19', 'E3'], ['drums', 'arrangement']),

    kata('bass-between-kicks', 'Never on the kick', 'A bassline of at least four notes a bar, none of them on a beat.',
         f'{T}\n{K}\nconst bass = note("c2*4").s("sawtooth").lpf(600)\nstack(kick, bass)',
         'the kick plays four on the floor and no bass note starts on a beat; at least four bass notes a bar.',
         'Offbeats and 16ths: note("[~ c2] [~ c2 ~ eb2] [~ c2] [~ g1 ~ c2]").',
         all_(playsAt('bd', BEATS), gte(count(s='sawtooth'), 4), not_(some(snd('sawtooth'), w('$time', **{'in': BEATS})))),
         f'{T}\n{K}\nconst bass = note("[~ c2] [~ c2 ~ eb2] [~ c2] [~ g1 ~ c2]").s("sawtooth").lpf(600)\nstack(kick, bass)',
         ['I8', 'B12'], ['bass'], preload=kit('bd')),

    kata('own-orbits', 'Three orbits', 'Three parts, each on its own orbit, nothing louder than .7.',
         f'{T}\n{K}\n{C}\nconst hats = s("[~ oh]*4").bank("RolandTR909")\nstack(kick, clap, hats)',
         'the three parts use three different orbits and every part has a gain of .7 or less.',
         '.orbit(1), .orbit(2), .orbit(3), and .gain(.7) or lower on each line.',
         all_(gte(distinct({}, 'orbit'), 3), every({}, w('gain', lte=0.7, default=0.8))),
         f'{T}\nconst kick = s("bd*4").bank("RolandTR909").gain(.7).orbit(1)\nconst clap = s("~ cp ~ cp").bank("RolandTR909").gain(.6).orbit(2)\nconst hats = s("[~ oh]*4").bank("RolandTR909").gain(.5).orbit(3)\nstack(kick, clap, hats)',
         ['E12', 'E10'], ['mixing'], preload=kit('bd', 'cp', 'oh')),

    kata('two-chords-a-minor', 'Two chords in A minor', 'A two-chord progression in A minor, each chord lasting two bars.',
         f'{T}\n{K}\nconst stab = chord("Am7").voicing().struct("[~ x]*2").s("sawtooth").lpf(1500)\nstack(kick, stab)',
         'every note is in A minor, bars 1 and 2 share a chord, and bar 3 has a different one.',
         'chord("<Am7!2 Dm7!2>") keeps each chord for two bars.',
         all_(inKey('A:minor', sel=snd('sawtooth')), gte(CHORD_SIZE, 3),
              eq(values(snd('sawtooth', bar=0), '$pc', unique=True, sorted=True), values(snd('sawtooth', bar=1), '$pc', unique=True, sorted=True)),
              neq(values(snd('sawtooth', bar=0), '$pc', unique=True, sorted=True), values(snd('sawtooth', bar=2), '$pc', unique=True, sorted=True))),
         f'{T}\n{K}\nconst stab = chord("<Am7!2 Dm7!2>").voicing().struct("[~ x]*2").s("sawtooth").lpf(1500)\nstack(kick, stab)',
         ['I7', 'I5'], ['chords'], preload=kit('bd')),

    kata('three-accents', 'Three accents', 'Sixteenth hats with exactly three accented hits per bar.',
         f'{T}\n{K}\nconst hats = s("hh*16").bank("RolandTR909").gain(.3)\nstack(kick, hats)',
         'there are 16 hats a bar and exactly three of them have a gain of .8 or more; the rest are quieter.',
         '.gain("[.8 .3 .3 .3] [.3 .3 .8 .3] [.3 .3 .3 .3] [.8 .3 .3 .3]")',
         all_(eq(count(s='hh'), 16), eq(countOf(snd('hh', where=[w('gain', gte=0.8, default=0.8)])), 3)),
         f'{T}\n{K}\nconst hats = s("hh*16").bank("RolandTR909").gain("[.8 .3 .3 .3] [.3 .3 .8 .3] [.3 .3 .3 .3] [.8 .3 .3 .3]")\nstack(kick, hats)',
         ['I4', 'B10'], ['drums'], preload=kit('bd', 'hh')),

    kata('the-breakdown', 'The breakdown', 'A 24-bar arrangement: 8 bars of groove, 8 bars of breakdown with no kick, 8 bars of groove.',
         f'{T}\n{K}\n{C}\nconst stab = note("[~ [c3,eb3,g3]]*2").s("sawtooth").lpf(1200).decay(.2).sustain(0)\nstack(kick, clap, stab)',
         'the code ends in arrange(…) with three 8-bar sections; bar 9 has the stab but no kick; bars 1 and 17 have the kick.',
         'const groove = stack(kick, clap, stab); const breakdown = stack(clap, stab); arrange([8, groove], [8, breakdown], [8, groove])',
         all_(final('arrange'), gte(ROWS, 3), eq(rowBars(0), 8), eq(rowBars(1), 8), eq(rowBars(2), 8),
              gt(count(s='bd', bar=0), 0), eq(count(s='bd', bar=8), 0), some(snd('sawtooth', bar=8)), gt(count(s='bd', bar=16), 0)),
         f'{T}\n{K}\n{C}\nconst stab = note("[~ [c3,eb3,g3]]*2").s("sawtooth").lpf(1200).decay(.2).sustain(0)\nconst groove = stack(kick, clap, stab)\nconst breakdown = stack(clap, stab)\narrange([8, groove], [8, breakdown], [8, groove])',
         ['E4', 'E5', 'E6'], ['arrangement'], preload=kit('bd', 'cp'), composition=True),

    kata('four-accents-303', 'Four accents', 'A 16-step 303 line with exactly four accented steps.',
         f'{T}\n{K}\nconst acid = note("[c2 c2 c3 c2] [eb2 c2 c3 g1] [c2 ~ bb2 c2] [c3 c2 eb2 g2]").s("sawtooth").ftype("ladder").lpf(600).lpq(18).lpenv(4).lpdecay(.15)\nstack(kick, acid)',
         'the line keeps its ladder filter and resonance, and exactly four of its notes have a velocity of .9 or more.',
         '.velocity("[1 .6 .6 .6] [.6 .6 1 .6] [.6 .6 .6 .6] [1 .6 1 .6]")',
         all_(every(snd('sawtooth'), w('ftype', eq='ladder'), w('resonance', gte=10, default=0)),
              eq(countOf(snd('sawtooth', where=[w('velocity', gte=0.9, default=1)])), 4), gte(count(s='sawtooth'), 12)),
         f'{T}\n{K}\nconst acid = note("[c2 c2 c3 c2] [eb2 c2 c3 g1] [c2 ~ bb2 c2] [c3 c2 eb2 g2]").s("sawtooth").ftype("ladder").lpf(600).lpq(18).lpenv(4).lpdecay(.15)\n  .velocity("[1 .6 .6 .6] [.6 .6 1 .6] [.6 .6 .6 .6] [1 .6 1 .6]")\nstack(kick, acid)',
         ['E1'], ['303', 'acid house'], preload=kit('bd')),

    kata('never-the-same-bar', 'Four different bars', 'A kick pattern that is different in each of four bars, and repeats after that.',
         f'{T}\n{K}\nstack(kick)',
         'the kick’s rhythm differs between every pair of the first four bars.',
         's("<[bd*4] [bd ~ bd bd] [bd bd ~ bd] [bd bd] ~ bd ~>")',
         all_(neq(times('bd', 0), times('bd', 1)), neq(times('bd', 0), times('bd', 2)), neq(times('bd', 0), times('bd', 3)),
              neq(times('bd', 1), times('bd', 2)), neq(times('bd', 1), times('bd', 3)), neq(times('bd', 2), times('bd', 3)),
              gt(count(s='bd', bar=3), 0)),
         f'{T}\nconst kick = s("<[bd*4] [bd ~ bd bd] [bd bd ~ bd] [bd bd] ~ bd ~>").bank("RolandTR909")\nstack(kick)',
         ['I19', 'B2'], ['drums'], preload=kit('bd')),
]

write(pack('practice-katas', 'Practice: katas', 'A brief and a target, no walkthrough. Write it any way you like.',
           [track('katas', 'Katas', 'Eight briefs. Done when the check says so.', lessons)], lessons, tags=['house', 'techno']))
