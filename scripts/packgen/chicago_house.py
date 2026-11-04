"""Chicago house: the jack, the piano riff, the 303 as bass and lead. python3 scripts/packgen/chicago_house.py"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from common import *  # noqa: F401,F403
import common
KEY_VAL = common.KEY  # the `const key` value; KEY below is a code snippet

T = 'setcpm(124/4)'
KICK = 'const kick = s("bd bd bd [bd bd]").bank("RolandTR707")'
CLAP = 'const clap = s("~ cp ~ cp").bank("RolandTR707")'
CLAP2 = 'const clap = s("~ cp ~ [cp cp]").bank("RolandTR707")'
HATS = 'const hats = s("hh*8").bank("RolandTR707").gain(.4)'
TOMS = 'const toms = s("[~ lt] [~ mt] [~ lt] [~ ht]").bank("RolandTR808").gain(.6)'
KEY = 'const key = "C:minor"'
RIFF = 'const riff = n("0 ~ 3 ~ 5 ~ 3 0").scale(key).s("piano").gain(.6)'
ACID_LOW = 'const acid = n("0 0 7 0 3 0 7 5").scale("C1:minor").s("sawtooth").lpf(400).lpq(10)'
ACID_HIGH = 'const acid = n("0 0 7 0 3 0 7 5").scale("C2:minor").s("sawtooth").lpf(1200).lpq(10)'
ACID_SHORT = ACID_HIGH + '.decay(.15).sustain(0)'
ACID_SWEEP = 'const acid = n("0 0 7 0 3 0 7 5").scale("C2:minor").s("sawtooth").lpf(saw.range(300, 2500).slow(4)).lpq(10)'
ACID_SEG = ACID_SWEEP + '.segment(8)'
ACID_Q = 'const acid = n("0 0 7 0 3 0 7 5").scale("C2:minor").s("sawtooth").lpf(saw.range(300, 2500).slow(4)).lpq(sine.range(5, 20).slow(8)).segment(8)'

toms_sel = snd(['lt', 'mt', 'ht'])

lessons = [
    lesson('the-jack', 'The jack', 'Write the jacking 707 kick pattern Chicago house was built on.',
           'Chicago house began in the early 80s at the Warehouse, the club that gave it its name, and on cheap Roland boxes: the TR-707 and TR-808. '
           'Its kick does more than four on the floor. A fifth kick on the **"and" of 4** gives the loop a push into the next bar: that stumble is the **jack**.\n\n'
           '`"bd bd bd [bd bd]"` keeps a kick on every beat and squeezes two into the last one, so the extra hit lands on the "and" of 4. Claps on 2 and 4 answer it.',
           f'{T}\nconst kick = s("bd*4").bank("RolandTR707")\nstack(kick)',
           [task('Add a fifth kick on the "and" of 4.', 's("bd bd bd [bd bd]")', playsAt('bd', [0, 0.25, 0.5, 0.75, 0.875])),
            task('Add a part called clap: a 707 clap on beats 2 and 4.', f'{CLAP}, and stack(kick, clap)',
                 all_(defines('clap'), playsAt('cp', [0.25, 0.75]), every(snd('cp'), w('bank', eq=TR707))))],
           [f'{T}\n{KICK}\nstack(kick)'],
           f'{T}\n{KICK}\n{CLAP}\nstack(kick, clap)', ['B4', 'B5', 'B8'], ['drums', '707'],
           challenge=task('Add quiet 707 closed hats on every 8th.', f'{HATS}, and stack it', all_(playsAt('hh', EIGHTHS), every(snd('hh'), w('gain', lt=0.6, default=0.8)))),
           challengeSolution=f'{T}\n{KICK}\n{CLAP}\n{HATS}\nstack(kick, clap, hats)',
           summary=['The jack: four on the floor plus a kick on the "and" of 4.', '[bd bd] in the last beat squeezes two kicks into one step.', 'The TR-707 is the Chicago machine.'],
           introduces=['[ ]', '.bank'], concepts=['the jack'], preload=kit('bd', 'cp', 'hh', bank=TR707)),

    lesson('jacking-claps-and-toms', 'Jacking claps and toms', 'Double the clap and add 808 toms on the offbeats.',
           'Trax Records tracks are busy below the kick: claps that **double** on the way into beat 1, and **808 toms** bouncing on the offbeats. '
           'The 808 toms are pitched (low, mid, high: `lt`, `mt`, `ht`), so a tom pattern is almost a bassline.\n\n'
           '`"~ cp ~ [cp cp]"` doubles the last clap. `.mask("<1 0>")` lets a part play one bar and rest the next, which is how these records breathe.',
           f'{T}\n{KICK}\n{CLAP}\n{HATS}\nstack(kick, clap, hats)',
           [task('Double the second clap: two claps in the last beat.', 's("~ cp ~ [cp cp]")', playsAt('cp', [0.25, 0.75, 0.875])),
            task('Add a part called toms: 808 low, mid, low, high toms on the offbeats.', f'{TOMS}, and stack it',
                 all_(defines('toms'), playsAt(None, OFFBEATS, cycles=1, sel=toms_sel), every(toms_sel, w('bank', eq=TR808))))],
           [f'{T}\n{KICK}\n{CLAP2}\n{HATS}\nstack(kick, clap, hats)'],
           f'{T}\n{KICK}\n{CLAP2}\n{HATS}\n{TOMS}\nstack(kick, clap, hats, toms)', ['B5', 'B7', 'B8'], ['drums', '808'],
           challenge=task('Let the toms play every other bar only.', '.mask("<1 0>") on the toms line',
                          all_(eq(countOf(dict(toms_sel, bar=0)), 4), eq(countOf(dict(toms_sel, bar=1)), 0))),
           challengeSolution=f'{T}\n{KICK}\n{CLAP2}\n{HATS}\n{TOMS}.mask("<1 0>")\nstack(kick, clap, hats, toms)',
           summary=['[cp cp] doubles a clap into the next bar.', '808 toms (lt, mt, ht) are pitched percussion.', '.mask("<1 0>") plays a part every other bar.'],
           introduces=['.mask'], preload=kit('bd', 'cp', 'hh', bank=TR707) + kit('lt', 'mt', 'ht', bank=TR808)),

    lesson('the-piano-riff', 'The piano riff', 'Write a one-finger piano hook in a key.',
           'The Chicago piano is a **riff**, not a chord: one finger stabbing a few notes of the scale, repeated until it sticks. '
           'Marshall Jefferson’s "Move Your Body" made it the sound of 1986.\n\n'
           '`n("0 ~ 3 ~ 5 ~ 3 0").scale(key)` picks scale degrees, so the riff stays in key however you change the numbers. '
           'One `const key` at the top keeps every pitched part in tune.',
           f'{T}\n{KICK}\n{CLAP2}\n{HATS}\nstack(kick, clap, hats)',
           [task('Declare the key: C minor.', f'{KEY} on the line after setcpm', eq(KEY_VAL, 'c:minor'), replacedLater=True),
            task('Add a part called riff: a piano playing scale degrees 0, 3, 5 in 8ths with rests between.', f'{RIFF}, and stack it',
                 all_(defines('riff'), inKey(sel=snd('piano')), gte(count(s='piano'), 4)))],
           [f'{T}\n{KEY}\n{KICK}\n{CLAP2}\n{HATS}\nstack(kick, clap, hats)'],
           f'{T}\n{KEY}\n{KICK}\n{CLAP2}\n{HATS}\n{RIFF}\nstack(kick, clap, hats, riff)', ['I5', 'B11'], ['piano', 'melody'],
           challenge=task('Move the whole thing to F minor by changing only the key.', 'const key = "F:minor"', all_(eq(KEY_VAL, 'f:minor'), inKey(key='F:minor', sel=snd('piano')))),
           challengeSolution=f'{T}\nconst key = "F:minor"\n{KICK}\n{CLAP2}\n{HATS}\n{RIFF}\nstack(kick, clap, hats, riff)',
           summary=['A riff is a few scale degrees, repeated.', 'n("…").scale(key) keeps it in key.', 'Change the key once and every part follows.'],
           introduces=['n', '.scale'], concepts=['const key'], preload=kit('bd', 'cp', 'hh', bank=TR707) + [{"s": "piano"}]),

    lesson('the-303-bass-and-lead', '303: bass or lead', 'Play the same 303 line low as a bass, then high as a lead.',
           'Phuture bought a TB-303 to make basslines, and found its squelch instead: "Acid Tracks" (1987) is the 303 played **wrong on purpose**. '
           'The same line works two ways. Low and filtered, it is a bass. An octave up with the filter open, it is a lead.\n\n'
           'The octave lives in the scale name: `scale("C1:minor")` is low, `scale("C2:minor")` an octave up. `.lpf` opens the filter and `.lpq` adds the squelch.',
           f'{T}\n{KEY}\n{KICK}\n{CLAP2}\n{HATS}\nstack(kick, clap, hats)',
           [task('Add a part called acid: a sawtooth line in C1 minor, filtered at 400 Hz with resonance 10.', f'{ACID_LOW}, and stack it',
                 all_(defines('acid'), every(snd('sawtooth'), w('$midi', lt=48), w('resonance', gte=8, default=0))), replacedLater=True),
            task('Lift it an octave and open the filter to 1200 Hz: now it is a lead.', 'scale("C2:minor") and .lpf(1200)',
                 every(snd('sawtooth'), w('$midi', gte=36), w('cutoff', gte=1000)))],
           [f'{T}\n{KEY}\n{KICK}\n{CLAP2}\n{HATS}\n{ACID_LOW}\nstack(kick, clap, hats, acid)'],
           f'{T}\n{KEY}\n{KICK}\n{CLAP2}\n{HATS}\n{ACID_HIGH}\nstack(kick, clap, hats, acid)', ['I9', 'I11', 'B14'], ['303', 'acid house', 'bass'],
           challenge=task('Make every note a short pluck.', '.decay(.15).sustain(0) on the acid line', every(snd('sawtooth'), w('sustain', eq=0, default=1), w('decay', lte=0.2, default=9))),
           challengeSolution=f'{T}\n{KEY}\n{KICK}\n{CLAP2}\n{HATS}\n{ACID_SHORT}\nstack(kick, clap, hats, acid)',
           summary=['The octave in the scale name moves the whole line.', 'Low and filtered: bass. High and open: lead.', '.lpq is the squelch.'],
           introduces=['.lpf', '.lpq', '.decay', '.sustain'], preload=kit('bd', 'cp', 'hh', bank=TR707)),

    lesson('hand-played-filter', 'The hand-played filter', 'Automate the cutoff the way a hand on the knob would.',
           'Acid records were played live: a hand on the 303’s cutoff knob, turning it up over a few bars and back down. '
           'A **signal** does the turning: `saw.range(300, 2500).slow(4)` climbs from 300 to 2500 Hz over four bars, then jumps back.\n\n'
           'A knob is not perfectly smooth. `.segment(8)` samples the signal eight times a bar, so the filter moves in small steps like a hand would.',
           f'{T}\n{KEY}\n{KICK}\n{CLAP2}\n{HATS}\n{ACID_HIGH}\nstack(kick, clap, hats, acid)',
           [task('Replace the fixed cutoff with a 4-bar saw from 300 to 2500 Hz.', '.lpf(saw.range(300, 2500).slow(4))',
                 all_(uses('range'), gte(distinct(snd('sawtooth'), 'cutoff', round=0, bars=[0, 1, 2, 3]), 3))),
            task('Step it: sample the sweep eight times a bar.', '.segment(8) at the end of the acid line', all_(uses('segment'), uses('range')))],
           [f'{T}\n{KEY}\n{KICK}\n{CLAP2}\n{HATS}\n{ACID_SWEEP}\nstack(kick, clap, hats, acid)'],
           f'{T}\n{KEY}\n{KICK}\n{CLAP2}\n{HATS}\n{ACID_SEG}\nstack(kick, clap, hats, acid)', ['I18', 'E2'], ['303', 'acid house', 'sound design'],
           challenge=task('Move the resonance too, on an 8-bar sine between 5 and 20.', '.lpq(sine.range(5, 20).slow(8)) instead of .lpq(10)',
                          gte(distinct(snd('sawtooth'), 'resonance', round=0, bars=[0, 2, 4, 6]), 3)),
           challengeSolution=f'{T}\n{KEY}\n{KICK}\n{CLAP2}\n{HATS}\n{ACID_Q}\nstack(kick, clap, hats, acid)',
           summary=['saw.range(a, b).slow(4): a four-bar climb and drop.', '.segment(n) steps a signal like a hand on a knob.', 'Sweep resonance on a different length for variety.'],
           introduces=['sine', '.range', '.slow', '.seg'], preload=kit('bd', 'cp', 'hh', bank=TR707)),

    lesson('a-jack-track', 'Project: A jack track', 'Put the jack, the toms, the piano riff and the 303 together.',
           'A Chicago track is raw: a jacking 707, 808 toms, one piano riff and a 303 doing the rest. Keep it loose and a little too loud.\n\n'
           'One `const key` ties the riff and the acid line together. A hat fill every four bars (`.lastOf(4, …)`) marks the phrase the way a DJ hears it.',
           f'{T}\n{KEY}\nconst kick = s("bd bd bd [bd bd]").bank("RolandTR707")\nstack(kick)',
           [task('Add the clap (doubled), 707 hats on 8ths and the 808 toms, and stack them all.', f'{CLAP2}, {HATS} and {TOMS}',
                 all_(defines('clap'), defines('hats'), defines('toms'), playsAt('cp', [0.25, 0.75, 0.875]), some(toms_sel), between(BPM, 120, 126))),
            task('Add the piano riff and the acid line, both in the key.', f'{RIFF} and const acid = n("0 0 7 0 3 0 7 5").scale(key).s("sawtooth").lpf(1200).lpq(10).octave(2)',
                 all_(defines('riff'), defines('acid'), inKey(sel=snd('piano')), inKey(sel=snd('sawtooth')))),
            task('Make the hats fill in the last bar of every four.', '.lastOf(4, x => x.fast(2)) on the hats line', gt(count(s='hh', bar=3), count(s='hh', bar=0)))],
           [f'{T}\n{KEY}\n{KICK}\n{CLAP2}\n{HATS}\n{TOMS}\nstack(kick, clap, hats, toms)',
            f'{T}\n{KEY}\n{KICK}\n{CLAP2}\n{HATS}\n{TOMS}\n{RIFF}\nconst acid = n("0 0 7 0 3 0 7 5").scale(key).s("sawtooth").lpf(1200).lpq(10).octave(2)\nstack(kick, clap, hats, toms, riff, acid)'],
           f'{T}\n{KEY}\n{KICK}\n{CLAP2}\n{HATS}.lastOf(4, x => x.fast(2))\n{TOMS}\n{RIFF}\nconst acid = n("0 0 7 0 3 0 7 5").scale(key).s("sawtooth").lpf(1200).lpq(10).octave(2)\nstack(kick, clap, hats, toms, riff, acid)',
           ['I19', 'I5', 'E10'], ['project', 'drums', 'piano', '303'], shape='project',
           challenge=task('Sweep the acid filter over 8 bars.', '.lpf(saw.range(300, 2500).slow(8)) instead of .lpf(1200) on the acid line',
                          gte(distinct(snd('sawtooth'), 'cutoff', round=0, bars=[0, 2, 4, 6]), 3)),
           challengeSolution=f'{T}\n{KEY}\n{KICK}\n{CLAP2}\n{HATS}.lastOf(4, x => x.fast(2))\n{TOMS}\n{RIFF}\nconst acid = n("0 0 7 0 3 0 7 5").scale(key).s("sawtooth").lpf(saw.range(300, 2500).slow(8)).lpq(10).octave(2)\nstack(kick, clap, hats, toms, riff, acid)',
           summary=['A jack track: 707 jack, 808 toms, a piano riff, a 303.', 'One const key keeps the riff and the acid in tune.', '.lastOf(4, f) marks the phrase with a fill.'],
           introduces=['.lastOf', '.fast'], preload=kit('bd', 'cp', 'hh', bank=TR707) + kit('lt', 'mt', 'ht', bank=TR808) + [{"s": "piano"}]),
]

write(pack('chicago-house', 'Chicago house', 'The jack, 808 toms, the one-finger piano riff and the 303 as bass and lead: Chicago, 1985–87.',
           [track('the-jack', 'The jack', 'From the jacking kick to a raw jack track with a piano riff and a 303.', lessons,
                  requires=['B5', 'B8', 'I6'], tags=['chicago house', '707'])],
           lessons, tags=['chicago house', 'acid house', 'house', '707', '808', '303']))
