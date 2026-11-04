"""Trance: supersaw chords, gated pads, arps, sidechain, the 32-bar build. python3 scripts/packgen/trance.py"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from common import *  # noqa: F401,F403

T = 'setcpm(138/4)'
K = 'const kick = s("bd*4").bank("RolandTR909")'
C = 'const clap = s("~ cp ~ cp").bank("RolandTR909").gain(.7)'
H = 'const hats = s("[~ oh]*4").bank("RolandTR909").gain(.4)'
CHORDS = '"<[a3,c4,e4] [f3,a3,c4] [c4,e4,g4] [g3,b3,d4]>"'
PAD0 = f'const pad = note({CHORDS}).s("supersaw").gain(.35)'
PAD1 = f'const pad = note({CHORDS}).s("supersaw").gain(.35).unison(7).detune(.4)'
PAD2 = f'const pad = note({CHORDS}).s("supersaw").gain(.35).unison(7).detune(.4).release(.8)'
PAD3 = f'const pad = note({CHORDS}).s("supersaw").gain(.35).unison(7).detune(.4).release(.8).lpf(1500)'
GATED = f'const pad = note({CHORDS}).s("supersaw").gain(.35).unison(7).detune(.4).lpf(1500).struct("x*16").clip(.5)'
ARP0 = f'const arp = note({CHORDS}).arp("[0 1 2 1]*4").s("sawtooth").gain(.4)'
ARP1 = f'const arp = note({CHORDS}).arp("[0 1 2 1]*4").s("sawtooth").gain(.4).lpf(1200).lpq(5)'
ARP2 = f'const arp = note({CHORDS}).arp("[0 1 2 1]*4").s("sawtooth").gain(.4).lpf(sine.range(600, 2400).slow(8)).lpq(5)'

drums = kit('bd', 'cp', 'oh')
ss = snd('supersaw')
saw = snd('sawtooth')

lessons = [
    lesson('supersaw-chords', 'Supersaw chords', 'Make a wide, detuned trance chord that rings on.',
           'Trance grew out of Frankfurt clubs and Goa beaches in the early 90s, and by the end of the decade its sound was the **supersaw**: seven sawtooth waves slightly out of tune with each other, so one chord sounds like a wall of strings.\n\n`s("supersaw")` gives you that oscillator. `.unison(7)` sets how many voices, `.detune(.4)` how far apart they drift. A long `.release` lets each chord hang into the next, which is where the euphoria lives.\n\nWe play one chord per bar with `< >`, in A minor: the key half the genre is written in.',
           f'{T}\n{K}\n{C}\nstack(kick, clap)',
           [task('Add a part called pad: a supersaw playing one chord per bar from "<[a3,c4,e4] [f3,a3,c4] [c4,e4,g4] [g3,b3,d4]>".',
                 f'{PAD0}, then stack(kick, clap, pad).',
                 all_(defines('pad'), some(ss), gte(CHORD_SIZE, 3))),
            task('Widen it: seven voices, detuned.', '.unison(7).detune(.4) on the pad.',
                 every(ss, w('unison', gte=5, default=1), w('detune', gt=0, default=0))),
            task('Let each chord ring into the next with a long release.', '.release(.8) on the pad.',
                 every(ss, w('release', gte=0.5, default=0)))],
           [f'{T}\n{K}\n{C}\n{PAD0}\nstack(kick, clap, pad)', f'{T}\n{K}\n{C}\n{PAD1}\nstack(kick, clap, pad)'],
           f'{T}\n{K}\n{C}\n{PAD2}\nstack(kick, clap, pad)', ['I6', 'I9', 'I10'], ['pads', 'chords', 'sound design'],
           challenge=task('Take the fizz off the top with a low-pass around 1500 Hz.', '.lpf(1500) on the pad.',
                          every(ss, w('cutoff', lte=2000, gt=0))),
           challengeSolution=f'{T}\n{K}\n{C}\n{PAD3}\nstack(kick, clap, pad)',
           summary=['supersaw = several detuned saws at once.', '.unison sets the voices, .detune how far apart.', 'A long .release makes chords ring into each other.'],
           introduces=['.unison', '.detune', '.release'], concepts=['the supersaw'], preload=drums),

    lesson('gated-pads', 'Gated pads', 'Chop a held pad into pumping 16ths.',
           'A trance pad rarely just sits there. Producers ran pads through a **gate** driven by the sequencer, so the chord stutters in 16ths and locks to the kick.\n\nIn Strudel the gate is `.struct`: it gives a pattern a new rhythm. `.struct("x*16")` retriggers the chord sixteen times a bar. `.clip(.5)` makes each hit last half its step, which is the gap that makes it pump.\n\nChange the pattern of x and ~ and you have a different gate rhythm: the trance trick of the late 90s.',
           f'{T}\n{K}\n{C}\n{PAD3}\nstack(kick, clap, pad)',
           [task('Gate the pad: retrigger the chord on every 16th.', '.struct("x*16") on the pad (and drop the .release(.8)).',
                 all_(eq(distinct(ss, '$time'), 16), gte(countOf(ss), 16)), replacedLater=True),
            task('Shorten each hit to half a step so the gate breathes.', '.clip(.5) on the pad.',
                 every(ss, w('clip', lte=0.6, gt=0)))],
           [f'{T}\n{K}\n{C}\nconst pad = note({CHORDS}).s("supersaw").gain(.35).unison(7).detune(.4).lpf(1500).struct("x*16")\nstack(kick, clap, pad)'],
           f'{T}\n{K}\n{C}\n{GATED}\nstack(kick, clap, pad)', ['I10', 'I19'], ['pads', 'sound design'],
           challenge=task('Give the gate a rhythm: play three 16ths, rest one, four times a bar.', '.struct("[x x x ~]*4")',
                          eq(distinct(ss, '$time'), 12)),
           challengeSolution=f'{T}\n{K}\n{C}\nconst pad = note({CHORDS}).s("supersaw").gain(.35).unison(7).detune(.4).lpf(1500).struct("[x x x ~]*4").clip(.5)\nstack(kick, clap, pad)',
           summary=['.struct("x*16") retriggers a chord in 16ths: a gate.', '.clip shortens each hit so the gate pumps.', 'Rests in the struct pattern make a gate rhythm.'],
           introduces=['.struct', '.clip'], concepts=['gated pads'], preload=drums),

    lesson('the-arpeggio', 'The arpeggio', 'Run a 16th-note arpeggio over the chords.',
           'The arpeggio is trance’s melody machine: the chord’s notes played one at a time, fast, up and down. On hardware it was an **arpeggiator**; here it is `.arp`.\n\n`.arp("[0 1 2 1]*4")` plays note 0, 1, 2, 1 of each chord (0 is the lowest), four times a bar: sixteen notes that follow the chord as it changes.\n\nA sawtooth through a low-pass with a little resonance keeps it bright but not harsh, and a slow filter sweep makes it come alive.',
           f'{T}\n{K}\n{C}\n{GATED}\nstack(kick, clap, pad)',
           [task('Add a part called arp: the same chords, arpeggiated 0 1 2 1 in 16ths on a sawtooth.',
                 f'{ARP0}, then stack(kick, clap, pad, arp).',
                 all_(defines('arp'), eq(countOf(saw), 16), gte(distinct(saw, '$midi'), 3))),
            task('Filter it: cutoff 1200 Hz with a touch of resonance.', '.lpf(1200).lpq(5) on the arp.',
                 every(saw, w('cutoff', lte=1500, gt=0), w('resonance', gte=3, default=0)), replacedLater=True)],
           [f'{T}\n{K}\n{C}\n{GATED}\n{ARP0}\nstack(kick, clap, pad, arp)'],
           f'{T}\n{K}\n{C}\n{GATED}\n{ARP1}\nstack(kick, clap, pad, arp)', ['I6', 'I11', 'I18'], ['melody', 'sound design'],
           challenge=task('Sweep the arp’s filter on an 8-bar sine between 600 and 2400 Hz.', '.lpf(sine.range(600, 2400).slow(8)) instead of .lpf(1200)',
                          gte(distinct(saw, 'cutoff', round=0, bars=[0, 2, 4, 6]), 3)),
           challengeSolution=f'{T}\n{K}\n{C}\n{GATED}\n{ARP2}\nstack(kick, clap, pad, arp)',
           summary=['.arp("0 1 2 1") plays a chord one note at a time.', 'A filtered sawtooth is the classic arp voice.', 'A slow sine on the cutoff keeps it moving.'],
           introduces=['.arp', '.lpq', 'sine'], concepts=['the arpeggiator'], preload=drums),

    lesson('sidechained-pads', 'Sidechained pads', 'Make the kick pump the pad.',
           'The trance pump: every kick pushes the pad down, and the pad swells back up between kicks. In a studio that is a compressor **sidechained** to the kick; in Strudel it is **ducking**.\n\nDucking works per **orbit**. Put the pad on its own orbit, then tell the kick to duck that orbit: `.duckorbit(2)` names it, `.duckdepth(.8)` says how far down, `.duckattack(.3)` how quickly it comes back.\n\nIt only works on an orbit something is playing on, so the pad goes on orbit 2 first.',
           f'{T}\n{K}\n{C}\n{GATED}\nstack(kick, clap, pad)',
           [task('Put the pad on its own orbit, number 2.', '.orbit(2) on the pad.', every(ss, w('orbit', eq=2, default=1))),
            task('Duck orbit 2 from the kick, 80% deep.', '.duckorbit(2).duckdepth(.8) on the kick.',
                 every(snd('bd'), w('duckorbit', eq=2), w('duckdepth', gte=0.6, default=0)))],
           [f'{T}\n{K}\n{C}\n{GATED}.orbit(2)\nstack(kick, clap, pad)'],
           f'{T}\nconst kick = s("bd*4").bank("RolandTR909").duckorbit(2).duckdepth(.8)\n{C}\n{GATED}.orbit(2)\nstack(kick, clap, pad)',
           ['E8', 'E12'], ['effects', 'mixing'],
           challenge=task('Slow the recovery so the swell is audible.', '.duckattack(.3) on the kick.',
                          every(snd('bd'), w('duckattack', gte=0.2, default=0))),
           challengeSolution=f'{T}\nconst kick = s("bd*4").bank("RolandTR909").duckorbit(2).duckdepth(.8).duckattack(.3)\n{C}\n{GATED}.orbit(2)\nstack(kick, clap, pad)',
           summary=['Ducking is per orbit: the pad gets its own.', '.duckorbit(n).duckdepth(d) on the kick pumps that orbit.', '.duckattack sets how fast the pad swells back.'],
           introduces=['.orbit', '.duckorbit', '.duckdepth', '.duckattack'], concepts=['sidechain'], preload=drums),

    lesson('build-and-drop', 'The 32-bar build and the drop', 'Raise the tension for 32 bars, then let everything in.',
           'Trance is built in 32-bar blocks. The **build** takes away the kick, adds a **riser** (noise whose high-pass climbs for 32 bars) and opens the pad’s filter slowly, so the room leans forward. Then the **drop**: kick, bass, everything.\n\nTwo long signals do the work: `saw.range(200, 8000).slow(32)` on the riser’s `.hpf`, and `saw.range(300, 4000).slow(32)` on the pad’s `.lpf`. Both climb for 32 bars and reset.\n\nA snare roll in the last bar, `.mask("<0!31 1>")`, is the classic cue that the drop is coming.',
           f'{T}\n{K}\n{C}\n{GATED}.orbit(2)\n{ARP1}\nstack(kick, clap, pad, arp)',
           [task('Add a part called riser: pink noise whose high-pass climbs from 200 to 8000 Hz over 32 bars.',
                 'const riser = s("pink*16").hpf(saw.range(200, 8000).slow(32)).gain(.2), then stack it.',
                 all_(defines('riser'), some(snd('pink')),
                      gt(valueAt(snd('pink', bar=31), 'hcutoff'), plus(valueAt(snd('pink', bar=0), 'hcutoff'), 1000)))),
            task('Open the pad’s filter over the same 32 bars, from 300 to 4000 Hz.', '.lpf(saw.range(300, 4000).slow(32)) instead of .lpf(1500) on the pad.',
                 gt(valueAt(snd('supersaw', bar=24), 'cutoff'), plus(valueAt(snd('supersaw', bar=0), 'cutoff'), 1000)))],
           [f'{T}\n{K}\n{C}\n{GATED}.orbit(2)\n{ARP1}\nconst riser = s("pink*16").hpf(saw.range(200, 8000).slow(32)).gain(.2)\nstack(kick, clap, pad, arp, riser)'],
           f'{T}\n{K}\n{C}\nconst pad = note({CHORDS}).s("supersaw").gain(.35).unison(7).detune(.4).lpf(saw.range(300, 4000).slow(32)).struct("x*16").clip(.5).orbit(2)\n{ARP1}\nconst riser = s("pink*16").hpf(saw.range(200, 8000).slow(32)).gain(.2)\nstack(kick, clap, pad, arp, riser)',
           ['E2', 'E5'], ['arrangement', 'effects'],
           challenge=task('Add a snare roll in bar 32 only: 16 snares, masked out of the other 31 bars.',
                          'const roll = s("sd*16").bank("RolandTR909").gain(.6).mask("<0!31 1>"), then stack it.',
                          all_(gte(count(s='sd', bar=31), 16), eq(count(s='sd', bar=0), 0))),
           challengeSolution=f'{T}\n{K}\n{C}\nconst pad = note({CHORDS}).s("supersaw").gain(.35).unison(7).detune(.4).lpf(saw.range(300, 4000).slow(32)).struct("x*16").clip(.5).orbit(2)\n{ARP1}\nconst riser = s("pink*16").hpf(saw.range(200, 8000).slow(32)).gain(.2)\nconst roll = s("sd*16").bank("RolandTR909").gain(.6).mask("<0!31 1>")\nstack(kick, clap, pad, arp, riser, roll)',
           summary=['A build: riser up, filter opening, over 32 bars.', 'saw.range(a, b).slow(32) climbs for 32 bars and resets.', '.mask("<0!31 1>") plays something in bar 32 only.'],
           introduces=['sine', '.range', '.slow', '.hpf', '.mask'], concepts=['the build', 'risers', 'saw signals'], preload=drums + kit('sd')),

    lesson('trance-anthem', 'Project: A trance anthem', 'Arrange the pad, arp and riser into intro, build and drop.',
           'Everything from this pack in the shape of a record: a drum **intro** a DJ can mix, a 32-bar **build** with the riser and the pad opening but no kick, and the **drop** with the kick ducking the pad and the arp on top.\n\nOne `const key` keeps the arp in tune, so moving the whole anthem to another key is one edit. Sections are named stacks; `arrange()` plays them in turn, and each section restarts its own clock, so the 32-bar sweeps line up with the build.',
           f'{T}\nconst kick = s("bd*4").bank("RolandTR909").duckorbit(2).duckdepth(.8)\n{C}\n{H}\nconst pad = note({CHORDS}).s("supersaw").gain(.35).unison(7).detune(.4).lpf(saw.range(300, 4000).slow(32)).struct("x*16").clip(.5).orbit(2)\nconst arp = n("[0 2 4 2]*4").scale("A3:minor").s("sawtooth").gain(.4).lpf(1200).lpq(5)\nconst riser = s("pink*16").hpf(saw.range(200, 8000).slow(32)).gain(.2)\nstack(kick, clap, hats, pad, arp, riser)',
           [task('Put the key in one place: const key = "A3:minor", and make the arp use it.', 'const key = "A3:minor" near the top, then .scale(key) on the arp.',
                 all_(defined(KEY), eq(KEY, 'a3:minor'), matches(r'scale\(\s*key\s*\)'))),
            task('Name three sections: intro (kick, hats), build (hats, clap, pad, arp, riser) and drop (everything but the riser). Keep playing drop for now.',
                 'const intro = stack(kick, hats), const build = stack(hats, clap, pad, arp, riser), const drop = stack(kick, clap, hats, pad, arp); end with drop.',
                 all_(block('intro', ['group', 'section'], ['kick', 'hats']),
                      block('build', ['group', 'section'], ['pad', 'arp', 'riser']),
                      block('drop', ['group', 'section'], ['kick', 'pad', 'arp']))),
            task('Arrange them: 16 bars of intro, 32 of build, 32 of drop.', 'Replace the last line with arrange([16, intro], [32, build], [32, drop]).',
                 all_(final('arrange'), gte(ROWS, 3), eq(count(s='sawtooth', bar=0), 0), eq(count(s='bd', bar=16), 0),
                      some(snd('sawtooth', bar=16)), some(snd('bd', bar=48))))],
           [f'{T}\nconst key = "A3:minor"\nconst kick = s("bd*4").bank("RolandTR909").duckorbit(2).duckdepth(.8)\n{C}\n{H}\nconst pad = note({CHORDS}).s("supersaw").gain(.35).unison(7).detune(.4).lpf(saw.range(300, 4000).slow(32)).struct("x*16").clip(.5).orbit(2)\nconst arp = n("[0 2 4 2]*4").scale(key).s("sawtooth").gain(.4).lpf(1200).lpq(5)\nconst riser = s("pink*16").hpf(saw.range(200, 8000).slow(32)).gain(.2)\nstack(kick, clap, hats, pad, arp, riser)',
            f'{T}\nconst key = "A3:minor"\nconst kick = s("bd*4").bank("RolandTR909").duckorbit(2).duckdepth(.8)\n{C}\n{H}\nconst pad = note({CHORDS}).s("supersaw").gain(.35).unison(7).detune(.4).lpf(saw.range(300, 4000).slow(32)).struct("x*16").clip(.5).orbit(2)\nconst arp = n("[0 2 4 2]*4").scale(key).s("sawtooth").gain(.4).lpf(1200).lpq(5)\nconst riser = s("pink*16").hpf(saw.range(200, 8000).slow(32)).gain(.2)\nconst intro = stack(kick, hats)\nconst build = stack(hats, clap, pad, arp, riser)\nconst drop = stack(kick, clap, hats, pad, arp)\ndrop'],
           f'{T}\nconst key = "A3:minor"\nconst kick = s("bd*4").bank("RolandTR909").duckorbit(2).duckdepth(.8)\n{C}\n{H}\nconst pad = note({CHORDS}).s("supersaw").gain(.35).unison(7).detune(.4).lpf(saw.range(300, 4000).slow(32)).struct("x*16").clip(.5).orbit(2)\nconst arp = n("[0 2 4 2]*4").scale(key).s("sawtooth").gain(.4).lpf(1200).lpq(5)\nconst riser = s("pink*16").hpf(saw.range(200, 8000).slow(32)).gain(.2)\nconst intro = stack(kick, hats)\nconst build = stack(hats, clap, pad, arp, riser)\nconst drop = stack(kick, clap, hats, pad, arp)\narrange([16, intro], [32, build], [32, drop])',
           ['E3', 'E4', 'E7', 'E14'], ['project', 'track', 'arrangement'], shape='project', composition=True,
           challenge=task('Add a 16-bar drum outro after the drop.', 'const outro = stack(kick, hats), then arrange([16, intro], [32, build], [32, drop], [16, outro]).',
                          all_(gte(ROWS, 4), some(snd('bd', bar=80)), eq(count(s='sawtooth', bar=80), 0))),
           challengeSolution=f'{T}\nconst key = "A3:minor"\nconst kick = s("bd*4").bank("RolandTR909").duckorbit(2).duckdepth(.8)\n{C}\n{H}\nconst pad = note({CHORDS}).s("supersaw").gain(.35).unison(7).detune(.4).lpf(saw.range(300, 4000).slow(32)).struct("x*16").clip(.5).orbit(2)\nconst arp = n("[0 2 4 2]*4").scale(key).s("sawtooth").gain(.4).lpf(1200).lpq(5)\nconst riser = s("pink*16").hpf(saw.range(200, 8000).slow(32)).gain(.2)\nconst intro = stack(kick, hats)\nconst build = stack(hats, clap, pad, arp, riser)\nconst drop = stack(kick, clap, hats, pad, arp)\nconst outro = stack(kick, hats)\narrange([16, intro], [32, build], [32, drop], [16, outro])',
           summary=['Intro, 32-bar build, drop: the trance shape.', 'One const key keeps the melody parts in tune.', 'Sections are named stacks; arrange() plays them in turn.'],
           introduces=['arrange', '.scale'], concepts=['sections', 'const key'], preload=drums + kit('sd')),
]

write(pack('trance', 'Trance', 'Supersaw chords, gated pads, arpeggios, sidechain and the 32-bar build, at 138 BPM.',
           [track('trance-basics', 'Trance basics', 'A pad, a gate, an arp, the pump, the build, then an anthem.', lessons,
                  requires=['I6', 'I10', 'I18', 'E3'], tags=['trance'])],
           lessons, tags=['trance', 'pads', 'arrangement', 'sound design']))
