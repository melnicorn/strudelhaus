// The dictionary: music and production words a beginner meets in the lessons, in plain language.
// Code details live in the Reference page; `code` links a term to the Strudel functions or sound
// names that do it, so hovering those in the editor explains them too.

export type TermCategory = 'Rhythm' | 'Drums' | 'Sound & synthesis' | 'Harmony' | 'Mixing & effects' | 'Song structure' | 'Styles & gear' | 'Strudel';

export const TERM_CATEGORIES: TermCategory[] = ['Rhythm', 'Drums', 'Sound & synthesis', 'Harmony', 'Mixing & effects', 'Song structure', 'Styles & gear', 'Strudel'];

export interface Term {
  term: string;
  category: TermCategory;
  definition: string;
  /** Other spellings matched in text ("hi-hats", "hihat"). */
  aliases?: string[];
  /** Phrases to match instead of the term itself, for words that are ambiguous on their own. */
  match?: string[];
  /** Strudel functions / sound names that do this (editor hover, Reference links). */
  code?: string[];
  seeAlso?: string[];
}

export const TERMS: Term[] = [
  // Rhythm
  { term: 'beat', category: 'Rhythm', definition: 'The steady pulse you tap your foot to. In house and techno there are four beats in every bar.', aliases: ['beats'], seeAlso: ['bar', 'BPM'] },
  { term: 'bar', category: 'Rhythm', definition: 'A group of four beats, the basic unit tracks are counted in (“an 8-bar loop”). In this workshop one Strudel cycle is one bar.', aliases: ['bars'], seeAlso: ['cycle', 'beat'] },
  { term: 'BPM', category: 'Rhythm', definition: 'Beats per minute: the speed of the track. House sits around 118–128 BPM, techno around 125–140.', aliases: ['tempo'], code: ['setcpm', 'setcps'], seeAlso: ['beat'] },
  { term: 'step', category: 'Rhythm', definition: 'One slot in a pattern. A drum machine splits a bar into 16 steps (16th notes), and each step is either a hit or silent.', aliases: ['steps', 'step sequencer'], seeAlso: ['16th note', 'mini-notation'] },
  { term: '16th note', category: 'Rhythm', definition: 'A quarter of a beat; there are 16 in a bar. Hi-hat patterns usually live on 16ths.', aliases: ['16th notes', '16ths', 'sixteenth notes', 'sixteenths'], seeAlso: ['step'] },
  { term: 'offbeat', category: 'Rhythm', definition: 'Halfway between two beats (“and” in “1 and 2 and”). The open hi-hat on the offbeat is the classic house “tss”.', aliases: ['offbeats', 'off-beat', 'off the beat'], seeAlso: ['open hi-hat'] },
  { term: 'four on the floor', category: 'Rhythm', definition: 'A kick drum on every beat: 1, 2, 3, 4. The foundation of house and techno.', seeAlso: ['kick'] },
  { term: 'backbeat', category: 'Rhythm', definition: 'Beats 2 and 4, where the clap or snare usually goes.', seeAlso: ['clap', 'snare'] },
  { term: 'groove', category: 'Rhythm', definition: 'How a rhythm feels: the small timing and loudness differences that make it move rather than march.', seeAlso: ['swing', 'velocity'] },
  { term: 'swing', category: 'Rhythm', definition: 'Delaying every second 16th note a little so the rhythm shuffles. 50% is straight; 55–60% is a typical house swing.', aliases: ['shuffle'], code: ['swingBy', 'swing'], seeAlso: ['groove'] },
  { term: 'syncopation', category: 'Rhythm', definition: 'Accents that land between the beats instead of on them, making a rhythm feel pushed or funky.', aliases: ['syncopated'] },
  { term: 'polyrhythm', category: 'Rhythm', definition: 'Two rhythms with different lengths playing together, so they line up in a new way each bar. Techno uses 3-step patterns over 4/4 a lot.', aliases: ['polymeter', 'polyrhythms'], seeAlso: ['euclidean rhythm'] },
  { term: 'euclidean rhythm', category: 'Rhythm', definition: 'A rhythm made by spreading k hits as evenly as possible over n steps, like 3 hits in 8 steps. Many traditional rhythms turn out to be euclidean.', aliases: ['euclidean rhythms', 'euclidean'], seeAlso: ['polyrhythm'] },
  { term: 'velocity', category: 'Rhythm', definition: 'How hard a note is played, which mostly means how loud it is. Varying velocity makes a pattern feel human.', code: ['velocity'], seeAlso: ['accent'] },
  { term: 'accent', category: 'Rhythm', definition: 'A note played harder than the others. On a TB-303 an accent is louder and opens the filter further.', aliases: ['accents', 'accented'], seeAlso: ['velocity', 'TB-303'] },

  // Drums
  { term: 'kick', category: 'Drums', definition: 'The bass drum: the deep thump that marks the beat. bd in Strudel.', aliases: ['kick drum', 'kicks', 'bass drum'], code: ['bd'], seeAlso: ['four on the floor'] },
  { term: 'snare', category: 'Drums', definition: 'A sharp, cracking drum, usually on beats 2 and 4. sd in Strudel.', aliases: ['snare drum', 'snares'], code: ['sd'], seeAlso: ['backbeat'] },
  { term: 'clap', category: 'Drums', definition: 'A hand-clap sound. In house the clap often replaces the snare on 2 and 4. cp in Strudel.', aliases: ['claps', 'handclap'], code: ['cp'], seeAlso: ['backbeat'] },
  { term: 'hi-hat', category: 'Drums', definition: 'A pair of cymbals clamped together. Closed (hh) is a short “tss”; it carries the 8th- or 16th-note pulse.', aliases: ['hi-hats', 'hihat', 'hihats', 'hat', 'hats', 'closed hi-hat'], code: ['hh'], seeAlso: ['open hi-hat'] },
  { term: 'open hi-hat', category: 'Drums', definition: 'The hi-hat with its cymbals apart: a longer, splashier “tsssh”. On the offbeat it is the sound of house. oh in Strudel.', aliases: ['open hat', 'open hats', 'open hi-hats'], code: ['oh'], seeAlso: ['offbeat'] },
  { term: 'rimshot', category: 'Drums', definition: 'A click made by hitting the rim of a drum. Short and woody; good for syncopated patterns. rim in Strudel.', aliases: ['rim', 'rimshots'], code: ['rim'] },
  { term: 'tom', category: 'Drums', definition: 'Pitched drums (low, mid, high) used for fills and tribal-sounding techno rhythms. lt, mt, ht in Strudel.', aliases: ['toms'], code: ['lt', 'mt', 'ht'] },
  { term: 'ride', category: 'Drums', definition: 'A big cymbal played in a steady pattern; it gives a lighter, shimmering pulse than hi-hats. rd in Strudel.', aliases: ['ride cymbal'], code: ['rd'] },
  { term: 'crash', category: 'Drums', definition: 'A loud cymbal splash that marks the start of a new section. cr in Strudel.', aliases: ['crash cymbal'], code: ['cr'] },
  { term: 'percussion', category: 'Drums', definition: 'Extra rhythmic sounds on top of the kit (shakers, congas, cowbells) that fill out a groove.', aliases: ['perc'], code: ['perc', 'sh', 'cb', 'tb'] },
  { term: 'drum machine', category: 'Drums', definition: 'A box that plays programmed drum patterns. Roland’s TR-808 and TR-909 defined the sound of house and techno. In Strudel you pick one with .bank().', aliases: ['drum machines'], code: ['bank'], seeAlso: ['TR-909', 'TR-808'] },
  { term: 'sample', category: 'Sound & synthesis', definition: 'A recording of a sound, played back on demand. Strudel’s drum sounds are samples; :n picks a different recording of the same instrument.', aliases: ['samples', 'variant', 'variants'], code: ['s', 'sound'], seeAlso: ['synth'] },

  // Sound & synthesis
  { term: 'synth', category: 'Sound & synthesis', definition: 'An instrument that makes sound electronically, from oscillators and filters, instead of playing back recordings.', aliases: ['synthesizer', 'synths', 'synthesiser'], seeAlso: ['oscillator', 'sample'] },
  { term: 'oscillator', category: 'Sound & synthesis', definition: 'The part of a synth that makes the raw tone. Its waveform decides the basic character: sine, triangle, square or sawtooth.', aliases: ['oscillators'], seeAlso: ['waveform'] },
  { term: 'waveform', category: 'Sound & synthesis', definition: 'The shape of a sound wave. Smooth shapes (sine) sound pure; sharp corners (saw, square) add harmonics and sound brighter.', aliases: ['waveforms', 'wave', 'waves'], seeAlso: ['harmonics'] },
  { term: 'sine', category: 'Sound & synthesis', definition: 'The purest waveform: a single tone with no harmonics. Used for sub bass and booming 808-style kicks.', aliases: ['sine wave'], code: ['sine'], seeAlso: ['waveform'] },
  { term: 'triangle', category: 'Sound & synthesis', definition: 'A soft waveform, slightly brighter than a sine. Gentle basses and pads.', aliases: ['triangle wave'], code: ['triangle', 'tri'], seeAlso: ['waveform'] },
  { term: 'square', category: 'Sound & synthesis', definition: 'A hollow, woody waveform with only odd harmonics. Organ-like basses and retro game sounds.', aliases: ['square wave'], code: ['square', 'sqr', 'pulse'], seeAlso: ['waveform'] },
  { term: 'sawtooth', category: 'Sound & synthesis', definition: 'A waveform shaped like saw teeth: it ramps up, then drops. Full of harmonics, so it sounds bright and buzzy, perfect for filtering. The TB-303 acid sound starts from one.', aliases: ['saw', 'saw wave', 'sawtooth wave', 'saws'], code: ['sawtooth', 'saw'], seeAlso: ['supersaw', 'low-pass filter'] },
  { term: 'supersaw', category: 'Sound & synthesis', definition: 'Several sawtooth waves slightly out of tune with each other, playing at once. The huge, shimmering chord sound of rave and trance.', code: ['supersaw'], seeAlso: ['sawtooth', 'detune'] },
  { term: 'noise', category: 'Sound & synthesis', definition: 'Random sound with no pitch: a hiss. White noise is bright, pink softer, brown deep. Used for hats, risers and sweeps.', aliases: ['white noise', 'pink noise', 'brown noise'], code: ['white', 'pink', 'brown', 'crackle'], seeAlso: ['riser'] },
  { term: 'harmonics', category: 'Sound & synthesis', definition: 'Quieter higher tones that ride along with every note and give it its colour. Filters work by removing some of them.', aliases: ['overtones'], seeAlso: ['waveform', 'filter'] },
  { term: 'detune', category: 'Sound & synthesis', definition: 'Putting copies of a sound slightly out of tune with each other, which makes it sound wider and richer.', aliases: ['detuned'], code: ['detune'], seeAlso: ['supersaw'] },
  { term: 'pitch', category: 'Sound & synthesis', definition: 'How high or low a note sounds.', seeAlso: ['octave', 'semitone'] },
  { term: 'filter', category: 'Sound & synthesis', definition: 'Removes part of the sound’s frequencies, making it darker, thinner or more focused. Moving a filter while a part plays is the heart of house and techno.', aliases: ['filters', 'filtered', 'filtering'], seeAlso: ['low-pass filter', 'high-pass filter', 'cutoff'] },
  { term: 'low-pass filter', category: 'Sound & synthesis', definition: 'Lets the lows through and cuts the highs: closing it makes a sound darker and muffled, opening it makes it brighter.', aliases: ['low-pass', 'lowpass', 'lpf', 'low pass filter', 'low-pass filters'], code: ['lpf', 'cutoff', 'lp'], seeAlso: ['cutoff', 'resonance'] },
  { term: 'high-pass filter', category: 'Sound & synthesis', definition: 'Lets the highs through and cuts the lows: thins a sound out. Used to clear space for the kick and bass, and on builds.', aliases: ['high-pass', 'highpass', 'hpf', 'high pass filter'], code: ['hpf', 'hcutoff', 'hp'], seeAlso: ['build-up'] },
  { term: 'cutoff', category: 'Sound & synthesis', definition: 'The frequency where a filter starts cutting, in hertz (Hz). Turning the cutoff is “opening” or “closing” the filter.', aliases: ['cutoff frequency'], code: ['lpf', 'cutoff'], seeAlso: ['filter', 'Hz'] },
  { term: 'resonance', category: 'Sound & synthesis', definition: 'A boost right at the filter’s cutoff. Turned up high it whistles and squelches: the acid sound.', aliases: ['reso'], code: ['lpq', 'resonance'], seeAlso: ['acid', 'cutoff'] },
  { term: 'Hz', category: 'Sound & synthesis', definition: 'Hertz: vibrations per second, the unit for pitch and filter frequencies. People hear roughly 20 Hz (deep rumble) to 20,000 Hz (high hiss).', aliases: ['hertz', 'kHz', 'frequency', 'frequencies'], seeAlso: ['cutoff'] },
  { term: 'envelope', category: 'Sound & synthesis', definition: 'How something changes over the length of one note: how fast it starts (attack), fades (decay), holds (sustain) and dies away (release).', aliases: ['envelopes', 'ADSR', 'amp envelope'], code: ['adsr'], seeAlso: ['attack', 'decay', 'sustain', 'release', 'filter envelope'] },
  { term: 'attack', category: 'Sound & synthesis', definition: 'How long a note takes to reach full volume. Short is punchy; long swells in like a pad.', code: ['attack'], seeAlso: ['envelope'] },
  { term: 'decay', category: 'Sound & synthesis', definition: 'How long a note takes to fall from its peak to the sustain level. Short decay with no sustain gives plucky, percussive notes.', code: ['decay'], seeAlso: ['envelope'] },
  { term: 'sustain', category: 'Sound & synthesis', definition: 'The level a note holds at while it keeps playing, after the attack and decay.', code: ['sustain'], seeAlso: ['envelope'] },
  { term: 'release', category: 'Sound & synthesis', definition: 'How long a note takes to fade out after it ends.', code: ['release'], seeAlso: ['envelope'] },
  { term: 'filter envelope', category: 'Sound & synthesis', definition: 'An envelope that moves the filter cutoff with each note instead of the volume, so every note “wows” open and closes again.', aliases: ['filter envelopes'], code: ['lpenv', 'lpattack', 'lpdecay', 'lpsustain', 'lprelease'], seeAlso: ['acid', 'envelope'] },
  { term: 'LFO', category: 'Sound & synthesis', definition: 'Low-frequency oscillator: a slow wave that moves a setting up and down by itself, like a hand turning a knob. In Strudel, sine.range(…).slow(…) does this.', aliases: ['LFOs'], seeAlso: ['sweep'] },
  { term: 'sweep', category: 'Sound & synthesis', definition: 'Moving a setting (usually a filter) gradually over several bars, so a part slowly opens up or darkens.', aliases: ['sweeps', 'filter sweep'], seeAlso: ['LFO', 'build-up'] },
  { term: 'slide', category: 'Sound & synthesis', definition: 'Gliding smoothly from one note’s pitch to the next instead of jumping. A signature of the TB-303 acid line.', aliases: ['slides', 'glide', 'portamento'], seeAlso: ['TB-303'] },

  // Harmony
  { term: 'note', category: 'Harmony', definition: 'A single pitched sound, named by letter (c, d, e…) and octave number: c3, eb2.', aliases: ['notes', 'note name', 'note names'], code: ['note'], seeAlso: ['octave', 'semitone'] },
  { term: 'octave', category: 'Harmony', definition: 'The distance from one note to the next note of the same name (c2 to c3). Up an octave is twice the frequency.', aliases: ['octaves'], seeAlso: ['note'] },
  { term: 'semitone', category: 'Harmony', definition: 'The smallest step between notes in Western music: one piano key to the very next. 12 semitones make an octave.', aliases: ['semitones', 'half step'], seeAlso: ['octave'] },
  { term: 'scale', category: 'Harmony', definition: 'A set of notes that sound good together, like C minor. Picking notes from one scale keeps a track in key.', aliases: ['scales', 'minor scale', 'major scale'], code: ['scale'], seeAlso: ['key', 'scale degree'] },
  { term: 'scale degree', category: 'Harmony', definition: 'A note’s position in a scale: 0 is the root, 1 the next note up, and so on. Writing degrees instead of note names lets you change key in one place.', aliases: ['scale degrees', 'degree', 'degrees'], code: ['n'], seeAlso: ['scale', 'root'] },
  { term: 'key', category: 'Harmony', definition: 'The home note and scale a track is built on, like C minor. Parts in the same key sound like they belong together.', match: ['in key', 'same key', 'key of', 'in the key', 'out of key', 'change key'], seeAlso: ['scale', 'root'] },
  { term: 'root', category: 'Harmony', definition: 'The home note of a scale or a chord, the one it is named after. Basslines often play the root of each chord.', aliases: ['root note', 'root notes'], code: ['rootNotes'], seeAlso: ['chord', 'bassline'] },
  { term: 'minor', category: 'Harmony', definition: 'A darker, moodier scale or chord, the usual choice for techno and deep house.', aliases: ['minor key', 'minor chord'], seeAlso: ['scale', 'chord'] },
  { term: 'chord', category: 'Harmony', definition: 'Several notes played at the same time. Named by root and type: Cm7 is C minor seventh.', aliases: ['chords', 'chord progression', 'progression'], code: ['chord'], seeAlso: ['voicing', 'stab'] },
  { term: 'voicing', category: 'Harmony', definition: 'Which octave each note of a chord goes in. Good voicings keep chords close together so they move smoothly.', aliases: ['voicings', 'voiced'], code: ['voicing'], seeAlso: ['chord'] },
  { term: 'arpeggio', category: 'Harmony', definition: 'A chord played one note at a time in a repeating pattern instead of all at once.', aliases: ['arpeggios', 'arp', 'arps', 'arpeggiated'], code: ['arp'], seeAlso: ['chord'] },

  // Mixing & effects
  { term: 'gain', category: 'Mixing & effects', definition: 'How loud a part is. Keep parts below 1 so the total doesn’t distort.', aliases: ['volume'], code: ['gain', 'postgain', 'velocity'], seeAlso: ['mix'] },
  { term: 'mix', category: 'Mixing & effects', definition: 'Balancing the parts against each other (loudness, filtering, space) so everything can be heard.', aliases: ['mixing', 'mixer'], seeAlso: ['gain'] },
  { term: 'pan', category: 'Mixing & effects', definition: 'Where a sound sits between the left and right speakers.', aliases: ['panning', 'panned'], code: ['pan'] },
  { term: 'reverb', category: 'Mixing & effects', definition: 'The echo of a room or hall, which makes a sound feel further away and bigger.', code: ['room', 'size', 'roomsize'], seeAlso: ['delay'] },
  { term: 'delay', category: 'Mixing & effects', definition: 'An effect that repeats a sound a moment later, fading each time: an echo in time with the music.', aliases: ['echo', 'echoes'], code: ['delay', 'delaytime', 'delayfeedback'], seeAlso: ['dub delay', 'reverb'] },
  { term: 'dub delay', category: 'Mixing & effects', definition: 'A long, dark, repeating delay, taken from Jamaican dub and used heavily in dub techno.', seeAlso: ['delay'] },
  { term: 'distortion', category: 'Mixing & effects', definition: 'Overdriving a sound so it gets gritty and crunchy. A little makes acid lines and kicks bite.', aliases: ['distorted', 'overdrive'], code: ['distort', 'shape', 'crush'] },
  { term: 'sidechain', category: 'Mixing & effects', definition: 'Turning one part down every time another plays, usually the bass ducking under each kick. It makes the track breathe and “pump”.', aliases: ['sidechaining', 'ducking', 'duck', 'pumping', 'pump'], code: ['duckorbit', 'duckattack', 'duckdepth'], seeAlso: ['kick'] },
  { term: 'orbit', category: 'Strudel', definition: 'A separate effects channel in Strudel. Parts on different orbits get their own reverb and delay, and sidechain ducking targets an orbit.', aliases: ['orbits'], code: ['orbit'], seeAlso: ['sidechain'] },

  // Song structure
  { term: 'loop', category: 'Song structure', definition: 'A short pattern that repeats. House and techno tracks are built by layering loops and bringing them in and out.', aliases: ['loops', 'looping'], seeAlso: ['layer', 'section'] },
  { term: 'layer', category: 'Song structure', definition: 'One of several parts playing at once. Stacking layers builds a full track from simple pieces.', aliases: ['layers', 'layering', 'layered'], code: ['stack'], seeAlso: ['loop'] },
  { term: 'part', category: 'Strudel', definition: 'In this workshop: one named pattern (kick, bass, chords…) that you can turn on and off in sections.', match: [] },
  { term: 'section', category: 'Song structure', definition: 'A stretch of a track with a particular set of parts playing: intro, breakdown, drop… Usually 8, 16 or 32 bars.', aliases: ['sections'], seeAlso: ['arrangement'] },
  { term: 'arrangement', category: 'Song structure', definition: 'The order of sections that turns loops into a whole track, deciding what plays when.', aliases: ['arrange', 'arranging', 'arranged'], code: ['arrange'], seeAlso: ['section'] },
  { term: 'intro', category: 'Song structure', definition: 'The opening section, often just drums, so DJs can mix it in.', aliases: ['intros', 'outro', 'outros'], seeAlso: ['section'] },
  { term: 'build-up', category: 'Song structure', definition: 'A section that raises tension before the drop: filters open, risers grow, drums get busier.', aliases: ['buildup', 'build-ups'], seeAlso: ['riser', 'drop'] },
  { term: 'drop', category: 'Song structure', definition: 'The moment the full groove comes back in, usually after a build-up or breakdown.', match: ['the drop', 'a drop', 'drop section'], seeAlso: ['build-up', 'breakdown'] },
  { term: 'breakdown', category: 'Song structure', definition: 'A section where the kick and drums drop out and the track breathes, before building back up.', aliases: ['breakdowns'], seeAlso: ['drop'] },
  { term: 'riser', category: 'Song structure', definition: 'A sound that climbs in pitch or brightness to build tension, often filtered noise.', aliases: ['risers', 'uplifter'], seeAlso: ['build-up', 'noise'] },
  { term: 'fill', category: 'Song structure', definition: 'A short burst of extra drums at the end of a phrase that signals something is about to change.', aliases: ['fills', 'drum fill'] },
  { term: 'stab', category: 'Harmony', definition: 'A short, punchy chord hit, often on the offbeat. Organ and piano stabs are classic 90s house.', aliases: ['stabs', 'chord stab', 'chord stabs'], seeAlso: ['chord'] },
  { term: 'bassline', category: 'Harmony', definition: 'The low-pitched melody that locks in with the kick and carries the groove.', aliases: ['basslines', 'bass line', 'bass'], seeAlso: ['root', 'acid'] },
  { term: 'pad', category: 'Harmony', definition: 'A soft, sustained chord sound that fills the background.', aliases: ['pads'], seeAlso: ['attack', 'chord'] },

  // Styles & gear
  { term: 'house', category: 'Styles & gear', definition: 'Dance music born in Chicago clubs in the mid-1980s: four-on-the-floor kick around 120–128 BPM, offbeat hats, soulful chords.', aliases: ['house music', 'Chicago house'], seeAlso: ['deep house', 'acid house'] },
  { term: 'deep house', category: 'Styles & gear', definition: 'A smoother, jazzier house style with warm chords and pads, slower and less busy.', seeAlso: ['house'] },
  { term: 'acid house', category: 'Styles & gear', definition: 'House built around the squelching TB-303 bassline, from Chicago (1987) to UK raves.', seeAlso: ['acid', 'TB-303'] },
  { term: 'acid', category: 'Styles & gear', definition: 'The squelchy, rubbery sound of a TB-303 bassline with its filter resonance turned up and accents and slides in the pattern.', aliases: ['acid line', 'acid lines', 'acid bass'], seeAlso: ['TB-303', 'resonance', 'filter envelope'] },
  { term: 'techno', category: 'Styles & gear', definition: 'Machine-driven dance music born in Detroit in the mid-1980s: harder, more hypnotic and less song-like than house, around 125–140 BPM.', aliases: ['Detroit techno', 'dub techno'], seeAlso: ['house'] },
  { term: 'TB-303', category: 'Styles & gear', definition: 'Roland’s 1981 bass synth. It flopped as a bass guitar replacement, then became the acid sound when producers turned its knobs.', aliases: ['303', 'TB303', 'Roland TB-303'], seeAlso: ['acid', 'slide', 'accent'] },
  { term: 'TR-909', category: 'Styles & gear', definition: 'Roland’s 1983 drum machine: punchy kick and crisp sampled hats. The house and techno drum machine.', aliases: ['909', 'TR909', 'Roland TR-909'], code: ['RolandTR909', 'tr909'], seeAlso: ['drum machine'] },
  { term: 'TR-808', category: 'Styles & gear', definition: 'Roland’s 1980 drum machine: deep boomy kick, snappy clap and the famous cowbell.', aliases: ['808', 'TR808', 'Roland TR-808'], code: ['RolandTR808', 'tr808'], seeAlso: ['drum machine'] },

  // Strudel
  { term: 'cycle', category: 'Strudel', definition: 'Strudel’s unit of time: a pattern repeats once per cycle. This workshop sets things up so one cycle is one bar.', aliases: ['cycles'], code: ['setcpm', 'fast', 'slow'], seeAlso: ['bar'] },
  { term: 'pattern', category: 'Strudel', definition: 'Anything Strudel can play: a description of events over time, like s("bd*4").', aliases: ['patterns'], seeAlso: ['mini-notation'] },
  { term: 'mini-notation', category: 'Strudel', definition: 'The short rhythm language inside Strudel’s quotes: "bd ~ sd ~", "hh*8", "<c2 eb2>".', aliases: ['mini notation'], seeAlso: ['pattern', 'step'] },
];

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Stable anchor id for a term on the dictionary page. */
export const termId = (t: Term | string) => slug(typeof t === 'string' ? t : t.term);

export function findTerm(name: string): Term | undefined {
  const n = name.toLowerCase();
  return TERMS.find((t) => t.term.toLowerCase() === n || t.aliases?.some((a) => a.toLowerCase() === n));
}

/** Terms by the Strudel function or sound name that does them (editor hovers). */
export const TERMS_BY_CODE: ReadonlyMap<string, Term> = new Map(
  TERMS.flatMap((t) => (t.code ?? []).map((c) => [c.toLowerCase(), t] as const)).reverse(),
);
