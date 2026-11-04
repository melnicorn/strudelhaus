"""Electro: the 808, syncopated 16th bass, slides, arps and pads. python3 scripts/packgen/electro.py"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from common import *  # noqa: F401,F403

T = 'setcpm(130/4)'
K = 'const kick = s("bd [~ bd] ~ [bd ~]").bank("RolandTR808")'
S = 'const snare = s("~ sd ~ sd").bank("RolandTR808")'
B = 'const bell = s("cb(3,8)").bank("RolandTR808").gain(.5)'
R = 'const rim = s("[~ ~ ~ rim]*4").bank("RolandTR808").gain(.5)'
DRUMS = f'{K}\n{S}\n{B}'
BASS0 = 'const bass = n("0 ~ 0 ~ ~ 0 ~ 3 ~ ~ 0 ~ 7 ~ ~ 0").scale("C2:minor").s("square")'
BASS1 = BASS0 + '.decay(.1).sustain(0)'
BASS2 = BASS1 + '.lpf(600)'
SLIDE1 = BASS2 + '\n  .penv("[0 0 0 0] [0 0 0 -3] [0 0 0 0] [0 0 0 0]").pattack(.08)'
SLIDE2 = BASS2 + '\n  .penv("[0 0 0 0] [0 0 0 -3] [0 0 0 0] [0 0 0 0]").pattack(.15)'
SLIDE3 = BASS2 + '\n  .penv("[0 0 0 0] [0 0 0 -3] [0 0 0 0] [5 0 0 0]").pattack(.15)'
ARP0 = 'const arp = note("[c4,eb4,g4,bb4]").arp("[0 1 2 3]*4").s("triangle").gain(.4)'
ARP1 = ARP0 + '.decay(.08).sustain(0)'
ARP2 = 'const arp = note("[c4,eb4,g4,bb4]").arp("[0 1 2 3 2 1]*2").s("triangle").gain(.4).decay(.08).sustain(0)'
ARP3 = ARP2 + '.lpf(sine.range(400, 3000).slow(4))'
PAD0 = 'const pad = note("[c3,eb3,g3]").s("pulse").attack(.5).release(1).gain(.3)'
PAD1 = PAD0 + '\n  .lpf(sine.range(300, 2000).slow(8)).lpq(10)'
PAD2 = PAD1 + '.hpf(200)'
PAD3 = PAD2 + '.orbit(2).room(.5)'

sq = snd('square')
tri = snd('triangle')
pul = snd('pulse')

lessons = [
    lesson('the-808-kit', 'The 808 kit', 'Program a broken electro beat on the TR-808.',
           'Electro is the robot funk of the early 80s: Kraftwerk’s machines, then Afrika Bambaataa’s *Planet Rock* in 1982, built on the **Roland TR-808**. The 808 has a long, booming kick, a snappy snare, and the famous **cowbell** and claves.\n\n'
           'Unlike house, electro drums are **broken**: the kick skips beats and lands on 16ths, the snare holds 2 and 4, and the cowbell plays a pattern of its own. `cb(3,8)` spreads three cowbells over eight steps.',
           f'{T}\nconst kick = s("bd*4").bank("RolandTR808")\nstack(kick)',
           [task('Break the kick up: beat 1, the "and" of 2, and beat 4.', 's("bd [~ bd] ~ [bd ~]")', playsAt('bd', [0, 0.375, 0.75])),
            task('Add a part called snare: 808 snare on beats 2 and 4.', f'{S}, and stack it', all_(defines('snare'), playsAt('sd', [0.25, 0.75]))),
            task('Add a part called bell: three cowbells over eight steps, quiet.', f'{B}, and stack it', all_(defines('bell'), playsAt('cb', [0, 0.375, 0.75])))],
           [f'{T}\n{K}\nstack(kick)', f'{T}\n{K}\n{S}\nstack(kick, snare)'],
           f'{T}\n{DRUMS}\nstack(kick, snare, bell)', ['B5', 'B8', 'I2'], ['drums', '808'],
           challenge=task('Add a part called rim: a rimshot on the last 16th of every beat.', f'{R}, and stack it',
                          all_(defines('rim'), playsAt('rim', [0.1875, 0.4375, 0.6875, 0.9375]))),
           challengeSolution=f'{T}\n{DRUMS}\n{R}\nstack(kick, snare, bell, rim)',
           summary=['Electro drums skip beats and land on 16ths.', 'cb(3,8): three cowbells over eight steps.', 'The 808 kick, snare and cowbell set the era.'],
           introduces=['.bank', '(k,n,rot)'], concepts=['the broken beat'],
           preload=kit('bd', 'sd', 'cb', 'rim', bank=TR808)),

    lesson('the-16th-bass', 'The syncopated 16th bass', 'Write a bass on a 16-step grid with rests, short and dark.',
           'Electro bass lives on the **16th grid**: a few notes, lots of rests, landing off the beat so it talks to the drums. Drexciya and Egyptian Lover made whole tracks from one such line.\n\n'
           'Sixteen steps in quotes is one bar of 16ths; `~` is a rest. `n("0 … 7").scale("C2:minor")` keeps the notes in key and in the second octave. A fast **decay** with no **sustain** makes each note a blip; a **low-pass** keeps it dark.',
           f'{T}\n{DRUMS}\nstack(kick, snare, bell)',
           [task('Add a part called bass: a square wave on 16 steps, mostly rests, in C minor, octave 2.', f'{BASS0}, and stack it',
                 all_(defines('bass'), inKey('C:minor', sel=sq), gte(countOf(sq), 5), every(sq, w('$midi', lte=48)), some(sq, w('$time', eq=0.3125)))),
            task('Make each note a blip: decay .1, no sustain.', '.decay(.1).sustain(0) on the bass', every(sq, w('decay', lte=0.15, default=9), w('sustain', eq=0, default=1))),
            task('Darken it with a low-pass at 600 Hz.', '.lpf(600) on the bass', every(sq, w('cutoff', lte=800, gt=0)))],
           [f'{T}\n{DRUMS}\n{BASS0}\nstack(kick, snare, bell, bass)', f'{T}\n{DRUMS}\n{BASS1}\nstack(kick, snare, bell, bass)'],
           f'{T}\n{DRUMS}\n{BASS2}\nstack(kick, snare, bell, bass)', ['B12', 'I2', 'I10', 'B14'], ['bass'],
           challenge=task('Give the filter some resonance so the blips ping.', '.lpq(8) on the bass', every(sq, w('resonance', gte=6, default=0))),
           challengeSolution=f'{T}\n{DRUMS}\n{BASS2}.lpq(8)\nstack(kick, snare, bell, bass)',
           summary=['Sixteen steps in quotes is a bar of 16ths.', 'Few notes, many rests, off the beat: syncopation.', 'Short decay, no sustain, low-pass: the electro blip.'],
           introduces=['n', '.scale', '.decay', '.sustain', '.lpf'], preload=kit('bd', 'sd', 'cb', bank=TR808)),

    lesson('slides', 'Slides', 'Bend into notes with a pitch envelope.',
           'The electro bass **slides**: the pitch glides up (or down) into a note. Strudel’s synths have no portamento, so we fake it with a **pitch envelope**: `.penv` is how many semitones the note starts away from itself, `.pattack` how long it takes to arrive.\n\n'
           'A pattern of `penv` values lines up step by step with the bass, so you choose which notes slide. `-3` starts three semitones below and rises; a positive number falls into the note.',
           f'{T}\n{DRUMS}\n{BASS2}\nstack(kick, snare, bell, bass)',
           [task('Slide up into the note on step 8 (the second group’s last step) from 3 semitones below.',
                 '.penv("[0 0 0 0] [0 0 0 -3] [0 0 0 0] [0 0 0 0]").pattack(.08) on the bass',
                 some(sq, w('$time', eq=0.4375), w('penv', eq=-3, default=0), w('pattack', gt=0, default=0))),
            task('Make the slide slower: .15 seconds.', '.pattack(.15)', every(sq, w('pattack', gte=0.12, default=0)))],
           [f'{T}\n{DRUMS}\n{SLIDE1}\nstack(kick, snare, bell, bass)'],
           f'{T}\n{DRUMS}\n{SLIDE2}\nstack(kick, snare, bell, bass)', ['E1', 'I10'], ['bass', 'sound design'],
           challenge=task('Add a second slide, falling into step 13 from 5 semitones above.', 'Change the last group to [5 0 0 0]',
                          some(sq, w('$time', eq=0.75), w('penv', eq=5, default=0))),
           challengeSolution=f'{T}\n{DRUMS}\n{SLIDE3}\nstack(kick, snare, bell, bass)',
           summary=['.penv(semitones) + .pattack(seconds) fakes a slide.', 'A penv pattern picks which steps slide.', 'Negative bends up into the note; positive falls into it.'],
           introduces=['.penv', '.pattack'], concepts=['slides'], preload=kit('bd', 'sd', 'cb', bank=TR808)),

    lesson('the-robot-arp', 'The robotic arp', 'Play a chord one note at a time, in 16ths.',
           'The **arpeggio** is electro’s melody: a chord played one note at a time, fast and even, like a sequencer. Kraftwerk’s *Trans-Europe Express* and *Numbers* run on them.\n\n'
           '`.arp("0 1 2 3")` takes a chord and plays its notes in that order (0 is the lowest). `"[0 1 2 3]*4"` is sixteen notes a bar. Short notes keep it mechanical; a slow filter sweep makes the machine breathe.',
           f'{T}\n{DRUMS}\n{SLIDE2}\nstack(kick, snare, bell, bass)',
           [task('Add a part called arp: a Cm7 chord on a triangle wave, arpeggiated up in 16ths.', f'{ARP0}, and stack it',
                 all_(defines('arp'), eq(countOf(tri), 16), gte(distinct(tri, '$midi'), 4), every(tri, w('$midi', gte=60))), replacedLater=True),
            task('Make the notes short: decay .08, no sustain.', '.decay(.08).sustain(0) on the arp', every(tri, w('decay', lte=0.1, default=9), w('sustain', eq=0, default=1))),
            task('Run it up and down instead: 0 1 2 3 2 1, twice a bar.', '.arp("[0 1 2 3 2 1]*2")', all_(eq(countOf(tri), 12), gte(distinct(tri, '$midi'), 4)))],
           [f'{T}\n{DRUMS}\n{SLIDE2}\n{ARP0}\nstack(kick, snare, bell, bass, arp)', f'{T}\n{DRUMS}\n{SLIDE2}\n{ARP1}\nstack(kick, snare, bell, bass, arp)'],
           f'{T}\n{DRUMS}\n{SLIDE2}\n{ARP2}\nstack(kick, snare, bell, bass, arp)', ['I6', 'I19'], ['melody', 'chords'],
           challenge=task('Sweep a filter over the arp across 4 bars.', '.lpf(sine.range(400, 3000).slow(4)) on the arp',
                          gte(distinct(tri, 'cutoff', round=0, bars=[0, 1, 2, 3]), 3)),
           challengeSolution=f'{T}\n{DRUMS}\n{SLIDE2}\n{ARP3}\nstack(kick, snare, bell, bass, arp)',
           summary=['.arp("0 1 2 3") plays a chord one note at a time.', '"[…]*4" makes it 16ths.', 'Short notes keep it mechanical.'],
           introduces=['.arp', 'note'], concepts=['arpeggios'], preload=kit('bd', 'sd', 'cb', bank=TR808)),

    lesson('vocoder-pads', 'Vocoder-ish pads', 'A slow, resonant pad that moves on its own.',
           'Electro’s voice was the **vocoder**: a robot singing. We can’t vocode here, but a **pulse** wave with a slow attack and a **resonant filter** moving on a signal gets the nasal, talking quality.\n\n'
           '`.attack(.5)` fades each chord in; `.release(1)` lets it tail off. `sine.range(300, 2000).slow(8)` drives the cutoff up and down over eight bars, and `.lpq(10)` makes it vowel-like. A **high-pass** keeps the pad out of the bass’s way.',
           f'{T}\n{DRUMS}\n{SLIDE2}\n{ARP2}\nstack(kick, snare, bell, bass, arp)',
           [task('Add a part called pad: a C minor triad on a pulse wave, slow attack, long release, quiet.', f'{PAD0}, and stack it',
                 all_(defines('pad'), some(pul), every(pul, w('attack', gte=0.4, default=0), w('release', gte=0.5, default=0)))),
            task('Move a resonant filter over it: an 8-bar sine between 300 and 2000 Hz, resonance 10.', '.lpf(sine.range(300, 2000).slow(8)).lpq(10) on the pad',
                 all_(every(pul, w('resonance', gte=8, default=0)), gte(distinct(pul, 'cutoff', round=0, bars=[0, 2, 4, 6]), 3))),
            task('High-pass the pad at 200 Hz so it stays out of the bass.', '.hpf(200) on the pad', every(pul, w('hcutoff', gte=150, default=0)))],
           [f'{T}\n{DRUMS}\n{SLIDE2}\n{ARP2}\n{PAD0}\nstack(kick, snare, bell, bass, arp, pad)', f'{T}\n{DRUMS}\n{SLIDE2}\n{ARP2}\n{PAD1}\nstack(kick, snare, bell, bass, arp, pad)'],
           f'{T}\n{DRUMS}\n{SLIDE2}\n{ARP2}\n{PAD2}\nstack(kick, snare, bell, bass, arp, pad)', ['I9', 'I10', 'I11', 'I18'], ['sound design', 'pads'],
           challenge=task('Put the pad in its own room: orbit 2, room .5.', '.orbit(2).room(.5) on the pad', every(pul, w('orbit', eq=2, default=1), w('room', gte=0.4, default=0))),
           challengeSolution=f'{T}\n{DRUMS}\n{SLIDE2}\n{ARP2}\n{PAD3}\nstack(kick, snare, bell, bass, arp, pad)',
           summary=['Pulse + slow attack + resonant moving filter: the robot voice.', 'sine.range(a, b).slow(8) drives the cutoff.', 'High-pass pads to clear the bass.'],
           introduces=['.attack', '.release', '.lpq', 'sine', '.hpf'], preload=kit('bd', 'sd', 'cb', bank=TR808)),

    lesson('electro-cut', 'Project: an electro cut', 'Put the kit, the bass, the arp and the pad together in one key.',
           'Everything from this pack in one loop. `const key` holds the key so the bass and the arp agree, and changing it later is one edit. Keep the pad quiet and high-passed; the kick and the bass own the low end.',
           f'{T}\nconst key = "C:minor"\nstack()',
           [task('The 808 kit: a broken kick, snare on 2 and 4, a cowbell pattern.', f'{K}\n{S}\n{B}\nstack(kick, snare, bell)',
                 all_(defines('kick'), defines('snare'), defines('bell'), playsAt('sd', [0.25, 0.75]), some(snd('cb')), not_(playsAt('bd', BEATS)))),
            task('A syncopated square bass in the key, short, dark.', 'const bass = n("0 ~ 0 ~ ~ 0 ~ 3 ~ ~ 0 ~ 7 ~ ~ 0").scale(key).s("square").decay(.1).sustain(0).lpf(600)',
                 all_(defines('bass'), inKey(sel=sq), gte(countOf(sq), 5), every(sq, w('sustain', eq=0, default=1), w('cutoff', lte=800, gt=0)))),
            task('A triangle arp in 16ths with short notes.', 'const arp = note("[c4,eb4,g4,bb4]").arp("[0 1 2 3]*4").s("triangle").gain(.4).decay(.08).sustain(0)',
                 all_(defines('arp'), gte(countOf(tri), 12), every(tri, w('decay', lte=0.15, default=9)))),
            task('A quiet pulse pad with a slow attack, high-passed.', 'const pad = note("[c3,eb3,g3]").s("pulse").attack(.5).release(1).gain(.3).hpf(200)',
                 all_(defines('pad'), every(pul, w('attack', gte=0.4, default=0), w('hcutoff', gte=150, default=0), w('gain', lte=0.4, default=0.8))))],
           [f'{T}\nconst key = "C:minor"\n{DRUMS}\nstack(kick, snare, bell)',
            f'{T}\nconst key = "C:minor"\n{DRUMS}\nconst bass = n("0 ~ 0 ~ ~ 0 ~ 3 ~ ~ 0 ~ 7 ~ ~ 0").scale(key).s("square").decay(.1).sustain(0).lpf(600)\nstack(kick, snare, bell, bass)',
            f'{T}\nconst key = "C:minor"\n{DRUMS}\nconst bass = n("0 ~ 0 ~ ~ 0 ~ 3 ~ ~ 0 ~ 7 ~ ~ 0").scale(key).s("square").decay(.1).sustain(0).lpf(600)\n{ARP1}\nstack(kick, snare, bell, bass, arp)'],
           f'{T}\nconst key = "C:minor"\n{DRUMS}\nconst bass = n("0 ~ 0 ~ ~ 0 ~ 3 ~ ~ 0 ~ 7 ~ ~ 0").scale(key).s("square").decay(.1).sustain(0).lpf(600)\n{ARP1}\n{PAD0}.hpf(200)\nstack(kick, snare, bell, bass, arp, pad)',
           ['I5', 'I8', 'E10'], ['project', 'drums', 'bass', 'melody'], shape='project',
           challenge=task('Double the snare every fourth bar.', 'Add .lastOf(4, x => x.fast(2)) to the snare', gt(count(s='sd', bar=3), count(s='sd', bar=0))),
           challengeSolution=f'{T}\nconst key = "C:minor"\n{K}\n{S}.lastOf(4, x => x.fast(2))\n{B}\nconst bass = n("0 ~ 0 ~ ~ 0 ~ 3 ~ ~ 0 ~ 7 ~ ~ 0").scale(key).s("square").decay(.1).sustain(0).lpf(600)\n{ARP1}\n{PAD0}.hpf(200)\nstack(kick, snare, bell, bass, arp, pad)',
           summary=['An electro cut: broken 808 drums, a 16th bass, an arp, a pad.', 'One const key keeps the bass and arp in tune.', '.lastOf(4, …) marks the phrase.'],
           introduces=['.lastOf', '.fast'], preload=kit('bd', 'sd', 'cb', bank=TR808)),
]

write(pack('electro', 'Electro', 'The robot funk of the 808: broken beats, syncopated 16th bass with slides, arpeggios and talking pads.',
           [track('electro-basics', 'Electro basics', 'The 808 kit, a 16th bass with slides, a robotic arp, a vocoder-ish pad, then an electro cut.',
                  lessons, requires=['B5', 'B8', 'B12', 'I10'], tags=['808'])],
           lessons, tags=['electro', '808', 'bass', 'melody']))
