"""Detroit techno: strings, the Motor City chord, rolling hats, rimshots, bass, a groove. python3 scripts/packgen/detroit_techno.py"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from common import *  # noqa: F401,F403

T = 'setcpm(128/4)'
K = 'const kick = s("bd*4").bank("RolandTR909")'
C = 'const clap = s("~ cp ~ cp").bank("RolandTR909")'
STRINGS = 'const strings = note("[c3,eb3,g3,bb3]").s("supersaw").attack(.8).release(1.5).gain(.3).hpf(300)'
STRINGS_RAW = 'const strings = note("[c3,eb3,g3,bb3]").s("supersaw").gain(.3)'
STRINGS_ENV = 'const strings = note("[c3,eb3,g3,bb3]").s("supersaw").attack(.8).release(1.5).gain(.3)'
CHORD = 'const stab = note("[c3,eb3,g3,bb3,d4]").struct("[~ x]*2").s("square").decay(.15).sustain(0).gain(.4)'
HATS = 'const hats = s("hh*16").bank("RolandTR909").gain("[.5 .25 .35 .25]*4")'
OPEN = 'const open = s("[~ oh]*4").bank("RolandTR909").gain(.45)'
RIM = 'const rim = s("rim(5,16,2)").bank("RolandTR909").gain(.5)'
BASS = 'const bass = n("[~ 0] [~ 0] [~ 5] [~ 3]").scale("C2:minor").s("sawtooth").decay(.15).sustain(0).lpf(600)'

sup = snd('supersaw')
sq = snd('square')
saw = snd('sawtooth')

lessons = [
    lesson('strings', 'Strings', 'Lay a soft, wide string pad under the drums.',
           'Detroit techno (Juan Atkins, Derrick May, Kevin Saunderson, mid-1980s) took the drum machine and put **strings** over it: synthesized pads that swell and fade like an orchestra heard from across a lake. The Motor City sound is drums that are hard and strings that are tender.\n\nA **supersaw** is several detuned sawtooths at once, wide and shimmering. A slow **attack** makes each chord fade in; a long **release** lets it hang after the note ends. A **high-pass filter** on the pad keeps its lows out of the kick’s way.',
           f'{T}\n{K}\n{C}\nstack(kick, clap)',
           [task('Add a part called strings: a C minor 7 chord on the supersaw, held for the bar, at gain .3.',
                 'const strings = note("[c3,eb3,g3,bb3]").s("supersaw").gain(.3), and stack(kick, clap, strings)',
                 all_(defines('strings'), gte(countOf(sup), 3), every(sup, w('gain', lte=0.4, default=0.8)))),
            task('Make it swell: a slow attack of .8 and a release of 1.5.', '.attack(.8).release(1.5) on the strings line',
                 every(sup, w('attack', gte=0.5, default=0), w('release', gte=1, default=0))),
            task('High-pass the strings at 300 Hz so they stay out of the kick’s way.', '.hpf(300) on the strings line',
                 every(sup, w('hcutoff', gte=250, default=0)))],
           [f'{T}\n{K}\n{C}\n{STRINGS_RAW}\nstack(kick, clap, strings)',
            f'{T}\n{K}\n{C}\n{STRINGS_ENV}\nstack(kick, clap, strings)'],
           f'{T}\n{K}\n{C}\n{STRINGS}\nstack(kick, clap, strings)',
           ['I9', 'I10', 'I12'], ['strings', 'pads', 'sound design'],
           challenge=task('Change the chord every two bars: Cm7, then Ab major 7 (ab2 c3 eb3 g3).',
                          'note("<[c3,eb3,g3,bb3]@2 [ab2,c3,eb3,g3]@2>") instead of the fixed chord',
                          neq(values(snd('supersaw', bar=0), '$pc', unique=True, sorted=True), values(snd('supersaw', bar=2), '$pc', unique=True, sorted=True))),
           challengeSolution=f'{T}\n{K}\n{C}\nconst strings = note("<[c3,eb3,g3,bb3]@2 [ab2,c3,eb3,g3]@2>").s("supersaw").attack(.8).release(1.5).gain(.3).hpf(300)\nstack(kick, clap, strings)',
           summary=['Detroit strings: a supersaw chord with slow attack and long release.', 'High-pass pads so the kick keeps the lows.', '@2 inside < > holds an item for two bars.'],
           introduces=['supersaw', '.attack', '.release', '.hpf'], concepts=['strings'], preload=kit('bd', 'cp')),

    lesson('motor-city-chord', 'The Motor City chord', 'Stab a minor ninth chord, short and bright.',
           'The chord Detroit is known for is the **minor ninth**: a minor seventh with one more note on top (C, E♭, G, B♭, D). It sounds unresolved and a little melancholy, which is the whole mood of the city’s records.\n\nPlayed as a short **stab** on the offbeats of 2 and 4, it answers the clap. A **square** wave gives it the hollow, plastic edge of the cheap Japanese synths Detroit was made on; a quick **decay** with no **sustain** keeps each hit short.',
           f'{T}\n{K}\n{C}\n{STRINGS}\nstack(kick, clap, strings)',
           [task('Add a part called stab: the five notes c3 eb3 g3 bb3 d4 together, on a square wave, hitting on the offbeats of 2 and 4.',
                 'const stab = note("[c3,eb3,g3,bb3,d4]").struct("[~ x]*2").s("square").gain(.4), and stack it',
                 all_(defines('stab'), gte(countOf(snd('square', at=0.25)), 5), eq(values(sq, '$time', unique=True, sorted=True), [0.25, 0.75]))),
            task('Make every stab short: decay .15 and no sustain.', '.decay(.15).sustain(0) on the stab line',
                 every(sq, w('decay', lte=0.25, default=9), w('sustain', eq=0, default=1)))],
           [f'{T}\n{K}\n{C}\n{STRINGS}\nconst stab = note("[c3,eb3,g3,bb3,d4]").struct("[~ x]*2").s("square").gain(.4)\nstack(kick, clap, strings, stab)'],
           f'{T}\n{K}\n{C}\n{STRINGS}\n{CHORD}\nstack(kick, clap, strings, stab)',
           ['I6', 'I10'], ['chords', 'sound design'],
           challenge=task('Put the stab in a room with a short delay: room .3 and a dotted-eighth delay, on its own orbit 2.',
                          '.room(.3).delay(.3).delaysync(3/16).orbit(2) on the stab line',
                          every(sq, w('room', gt=0, default=0), w('delay', gt=0, default=0), w('orbit', eq=2, default=1))),
           challengeSolution=f'{T}\n{K}\n{C}\n{STRINGS}\n{CHORD}.room(.3).delay(.3).delaysync(3/16).orbit(2)\nstack(kick, clap, strings, stab)',
           summary=['The minor ninth is the Detroit chord: m7 plus a ninth on top.', 'Short stabs on the offbeats of 2 and 4 answer the clap.', 'A square wave with a fast decay is the classic stab tone.'],
           introduces=['note', '.struct', '.decay', '.sustain'], concepts=['the minor ninth'], preload=kit('bd', 'cp')),

    lesson('rolling-hats', 'Rolling 909 hats', 'Program 16th hats with accents and open hats on the offbeats.',
           'Detroit drums roll. The closed hat runs in **16ths**, never flat: a **gain pattern** puts weight on the beat and lets the in-between hits fall back, so the loop pushes forward. The **open hat** on every offbeat is the "tss" that makes a room move.\n\nThe TR-909’s sampled hats are bright and a little metallic, which is exactly the Detroit colour. Two parts, one machine.',
           f'{T}\n{K}\n{C}\n{STRINGS}\n{CHORD}\nstack(kick, clap, strings, stab)',
           [task('Add a part called hats: closed 909 hats on all 16 sixteenths.', 'const hats = s("hh*16").bank("RolandTR909"), and stack it',
                 all_(defines('hats'), playsAt('hh', SIXTEENTHS))),
            task('Give the hats a gain pattern so the hit on each beat is the loudest of its four.', '.gain("[.5 .25 .35 .25]*4") on the hats line',
                 all_(gte(distinct(snd('hh'), 'gain'), 2), gt(valueAt(snd('hh'), 'gain', index=0, default=0.8), valueAt(snd('hh'), 'gain', index=1, default=0.8)))),
            task('Add a part called open: an open hat on every offbeat at gain .45.', 'const open = s("[~ oh]*4").bank("RolandTR909").gain(.45)',
                 all_(defines('open'), playsAt('oh', OFFBEATS), every(snd('oh'), w('gain', lte=0.5, default=0.8))))],
           [f'{T}\n{K}\n{C}\n{STRINGS}\n{CHORD}\nconst hats = s("hh*16").bank("RolandTR909")\nstack(kick, clap, strings, stab, hats)',
            f'{T}\n{K}\n{C}\n{STRINGS}\n{CHORD}\n{HATS}\nstack(kick, clap, strings, stab, hats)'],
           f'{T}\n{K}\n{C}\n{STRINGS}\n{CHORD}\n{HATS}\n{OPEN}\nstack(kick, clap, strings, stab, hats, open)',
           ['B3', 'I4', 'B6'], ['drums', '909'],
           challenge=task('Shorten the open hat so it chokes before the next beat.', '.clip(.6) on the open line',
                          every(snd('oh'), w('clip', lt=1, gt=0))),
           challengeSolution=f'{T}\n{K}\n{C}\n{STRINGS}\n{CHORD}\n{HATS}\n{OPEN}.clip(.6)\nstack(kick, clap, strings, stab, hats, open)',
           summary=['16th hats with a gain pattern roll instead of ticking.', 'Open hats on the offbeats push the groove.', '.clip shortens a sample.'],
           introduces=['patterned .gain', '.clip'], preload=kit('bd', 'cp', 'hh', 'oh')),

    lesson('rimshots', 'Syncopated rimshots', 'Add a rimshot pattern that lands off the grid.',
           'Detroit borrowed its percussion feel from funk and electro: short **rimshots** that fall between the kicks instead of on them. That is **syncopation**: accents where you don’t expect them.\n\nA **Euclidean rhythm** spreads hits as evenly as possible across the steps. `"rim(5,16,2)"` puts 5 rimshots across 16 steps, rotated by 2, which lands them off the beat without you placing each one by hand.',
           f'{T}\n{K}\n{C}\n{STRINGS}\n{CHORD}\n{HATS}\n{OPEN}\nstack(kick, clap, strings, stab, hats, open)',
           [task('Add a part called rim: five 909 rimshots spread over 16 steps with "rim(5,16)".', 'const rim = s("rim(5,16)").bank("RolandTR909").gain(.5), and stack it',
                 all_(defines('rim'), eq(countOf(snd('rim')), 5))),
            task('Rotate it by 2 so the first rimshot leaves the downbeat.', 's("rim(5,16,2)")',
                 all_(eq(countOf(snd('rim')), 5), gt(timeAt(snd('rim'), 0), 0)))],
           [f'{T}\n{K}\n{C}\n{STRINGS}\n{CHORD}\n{HATS}\n{OPEN}\nconst rim = s("rim(5,16)").bank("RolandTR909").gain(.5)\nstack(kick, clap, strings, stab, hats, open, rim)'],
           f'{T}\n{K}\n{C}\n{STRINGS}\n{CHORD}\n{HATS}\n{OPEN}\n{RIM}\nstack(kick, clap, strings, stab, hats, open, rim)',
           ['I2', 'I3'], ['drums', '909'],
           challenge=task('Pan the rimshots to one side and give them a little room.', '.pan(.7).room(.2) on the rim line',
                          every(snd('rim'), w('pan', neq=0.5), w('room', gt=0, default=0))),
           challengeSolution=f'{T}\n{K}\n{C}\n{STRINGS}\n{CHORD}\n{HATS}\n{OPEN}\n{RIM}.pan(.7).room(.2)\nstack(kick, clap, strings, stab, hats, open, rim)',
           summary=['Syncopation: hits between the beats.', '"x(k,n,rot)" spreads k hits over n steps; the third number rotates.', 'Pan percussion off-centre; keep kick, bass and clap in the middle.'],
           introduces=['(k,n,rot)', '.pan'], preload=kit('bd', 'cp', 'hh', 'oh', 'rim')),

    lesson('bass-in-the-gaps', 'Bass in the gaps', 'Write a filtered bassline that sits between the kicks and in the key.',
           'Kick and bass both live in the lows, so Detroit keeps them apart in **time**: the bass plays on the **offbeats**, in the gaps the kick leaves. Each note is short so it never smears into the next kick.\n\nScale degrees keep it in **C minor** with the strings and the stab: `n("0 5 3").scale("C2:minor")` picks notes of the scale, and the 2 in the scale name puts them in the second octave. A low-pass around 600 Hz rounds the sawtooth off.',
           f'{T}\n{K}\n{C}\n{STRINGS}\n{CHORD}\n{HATS}\n{OPEN}\n{RIM}\nstack(kick, clap, strings, stab, hats, open, rim)',
           [task('Add a part called bass: sawtooth scale degrees of C minor, octave 2, on every offbeat.',
                 'const bass = n("[~ 0] [~ 0] [~ 5] [~ 3]").scale("C2:minor").s("sawtooth"), and stack it',
                 all_(defines('bass'), playsAt(None, OFFBEATS, cycles=1, sel=saw), inKey('C:minor', sel=saw), every(saw, w('$midi', lt=48)))),
            task('Make every bass note short: decay .15 and no sustain.', '.decay(.15).sustain(0) on the bass line',
                 every(saw, w('decay', lte=0.25, default=9), w('sustain', eq=0, default=1))),
            task('Round it off with a low-pass filter at 600 Hz.', '.lpf(600) on the bass line',
                 every(saw, w('cutoff', lte=800, gt=0)))],
           [f'{T}\n{K}\n{C}\n{STRINGS}\n{CHORD}\n{HATS}\n{OPEN}\n{RIM}\nconst bass = n("[~ 0] [~ 0] [~ 5] [~ 3]").scale("C2:minor").s("sawtooth")\nstack(kick, clap, strings, stab, hats, open, rim, bass)',
            f'{T}\n{K}\n{C}\n{STRINGS}\n{CHORD}\n{HATS}\n{OPEN}\n{RIM}\nconst bass = n("[~ 0] [~ 0] [~ 5] [~ 3]").scale("C2:minor").s("sawtooth").decay(.15).sustain(0)\nstack(kick, clap, strings, stab, hats, open, rim, bass)'],
           f'{T}\n{K}\n{C}\n{STRINGS}\n{CHORD}\n{HATS}\n{OPEN}\n{RIM}\n{BASS}\nstack(kick, clap, strings, stab, hats, open, rim, bass)',
           ['B12', 'I8', 'I5'], ['bass'],
           challenge=task('Duck the bass under the kick: put the bass on orbit 4 and make the kick duck that orbit.',
                          '.orbit(4) on the bass; .duckorbit(4).duckdepth(.6) on the kick',
                          all_(every(saw, w('orbit', eq=4, default=1)), every(snd('bd'), w('duckorbit', eq=4), w('duckdepth', gte=0.4, default=0)))),
           challengeSolution=f'{T}\nconst kick = s("bd*4").bank("RolandTR909").duckorbit(4).duckdepth(.6)\n{C}\n{STRINGS}\n{CHORD}\n{HATS}\n{OPEN}\n{RIM}\n{BASS}.orbit(4)\nstack(kick, clap, strings, stab, hats, open, rim, bass)',
           summary=['Offbeat bass leaves the kick its space.', 'n("…").scale("C2:minor") keeps the bass in key and in octave 2.', 'Short, filtered notes never smear into the next kick.'],
           introduces=['n', '.scale', '.lpf'], preload=kit('bd', 'cp', 'hh', 'oh', 'rim')),

    lesson('detroit-groove', 'Project: a Detroit groove', 'Put strings, stab, hats, rimshots and bass together, in one key.',
           'All of it in one loop: hard 909 drums, tender strings, a minor-ninth stab, rimshots off the grid and a bass in the gaps. This is the shape of a Transmat or Metroplex 12-inch before the arrangement.\n\nOne `const key` keeps the bass in tune with the chords, so moving the whole track to another key is one edit. Keep the strings and the stab quieter than the drums: Detroit mixes let the machines lead.',
           f'{T}\nconst key = "C:minor"\n{K}\n{C}\n{HATS}\nstack(kick, clap, hats)',
           [task('Add the strings: a C minor 7 supersaw chord with slow attack and release, high-passed, at gain .3.',
                 'const strings = note("[c3,eb3,g3,bb3]").s("supersaw").attack(.8).release(1.5).gain(.3).hpf(300)',
                 all_(defines('strings'), every(sup, w('attack', gte=0.5, default=0), w('hcutoff', gte=250, default=0), w('gain', lte=0.4, default=0.8)))),
            task('Add the Motor City stab on the offbeats of 2 and 4, short, on a square wave.',
                 'const stab = note("[c3,eb3,g3,bb3,d4]").struct("[~ x]*2").s("square").decay(.15).sustain(0).gain(.4)',
                 all_(defines('stab'), gte(countOf(snd('square', at=0.25)), 4), every(sq, w('sustain', eq=0, default=1)))),
            task('Add rimshots with "rim(5,16,2)" and a bass in the key on the offbeats, short and filtered.',
                 'const rim = s("rim(5,16,2)").bank("RolandTR909").gain(.5) and const bass = n("[~ 0] [~ 0] [~ 5] [~ 3]").scale(key).s("sawtooth").octave(2).decay(.15).sustain(0).lpf(600)',
                 all_(defines('rim'), eq(countOf(snd('rim')), 5), defines('bass'), inKey(sel=saw), playsAt(None, OFFBEATS, cycles=1, sel=saw), every(saw, w('cutoff', lte=800, gt=0))))],
           [f'{T}\nconst key = "C:minor"\n{K}\n{C}\n{HATS}\n{STRINGS}\nstack(kick, clap, hats, strings)',
            f'{T}\nconst key = "C:minor"\n{K}\n{C}\n{HATS}\n{STRINGS}\n{CHORD}\nstack(kick, clap, hats, strings, stab)'],
           f'{T}\nconst key = "C:minor"\n{K}\n{C}\n{HATS}\n{STRINGS}\n{CHORD}\n{RIM}\nconst bass = n("[~ 0] [~ 0] [~ 5] [~ 3]").scale(key).s("sawtooth").octave(2).decay(.15).sustain(0).lpf(600)\nstack(kick, clap, hats, strings, stab, rim, bass)',
           ['I7', 'I8', 'E10'], ['project', 'chords', 'drums', 'bass'], shape='project',
           challenge=task('Drop the kick in the last bar of every four, so the strings show through.', 'Add .mask("<1 1 1 0>") to the kick line',
                          all_(eq(countOf(snd('bd', bar=3)), 0), playsAt('bd', BEATS))),
           challengeSolution=f'{T}\nconst key = "C:minor"\nconst kick = s("bd*4").bank("RolandTR909").mask("<1 1 1 0>")\n{C}\n{HATS}\n{STRINGS}\n{CHORD}\n{RIM}\nconst bass = n("[~ 0] [~ 0] [~ 5] [~ 3]").scale(key).s("sawtooth").octave(2).decay(.15).sustain(0).lpf(600)\nstack(kick, clap, hats, strings, stab, rim, bass)',
           summary=['A Detroit groove: hard drums, tender strings, a minor-ninth stab, a bass in the gaps.', 'One const key keeps the bass with the chords.', '.mask("<1 1 1 0>") drops a part every fourth bar.'],
           introduces=['.mask', 'const key'], preload=kit('bd', 'cp', 'hh', 'rim')),
]

write(pack('detroit-techno', 'Detroit techno', 'Strings over machines: the Motor City sound, on the skills from the core lessons.',
           [track('detroit-basics', 'Detroit basics', 'Strings, the minor-ninth stab, rolling hats, rimshots and a bass in the gaps, then a groove.',
                  lessons, requires=['B9', 'I6', 'I9'])],
           lessons, tags=['detroit techno', 'techno', 'strings', 'pads']))
