// Turns Strudel/JS error text into something a beginner can act on.

export interface FriendlyError {
  title: string;
  detail?: string;
  /** A sound name the learner probably meant. */
  suggestion?: string;
  line?: number;
}

export function friendlyEvalError(message: string, line?: number): FriendlyError {
  if (/^\[mini\] parse error/.test(message)) {
    const unclosed = /but "\\?"" found/.test(message);
    return {
      title: unclosed
        ? 'A bracket inside the quotes isn’t closed: every [ needs a ], every < needs a >.'
        : 'Something inside the quotes isn’t valid mini-notation.',
      detail: message.replace(/^\[mini\] /, ''),
      line,
    };
  }
  if (/Unterminated string/i.test(message)) return { title: 'A quote is missing: every " needs a closing ".', detail: message, line };
  if (/Unexpected token/i.test(message)) {
    return { title: 'There’s a typo near here: maybe a missing comma, bracket or quote.', detail: message, line };
  }
  const undef = /(\w+) is not defined/.exec(message);
  if (undef) return { title: `Strudel doesn’t know “${undef[1]}”. Check the spelling.`, detail: message, line };
  const notFn = /(\S+) is not a function/.exec(message);
  if (notFn) return { title: `“${notFn[1]}” isn’t a function you can call here. Check the spelling.`, detail: message, line };
  return { title: message, line };
}

/** Recognises runtime log messages worth showing; returns null for chatter. */
export function friendlyRuntimeMessage(message: string, soundNames: () => string[]): FriendlyError | null {
  const missing = /sound (\S+) not found/i.exec(message);
  if (missing) {
    const full = missing[1].replace(/[!"']/g, '');
    const names = soundNames();
    const sep = full.lastIndexOf('_');
    // Banked sounds are registered as "<bank>_<sound>"; talk about the sound and its bank separately.
    const bank = sep > 0 ? full.slice(0, sep).toLowerCase() : null;
    if (bank && names.some((n) => n.toLowerCase().startsWith(bank + '_'))) {
      const sound = full.slice(sep + 1);
      const inBank = names.filter((n) => n.toLowerCase().startsWith(bank + '_')).map((n) => n.slice(bank.length + 1));
      return {
        title: `The ${full.slice(0, sep)} bank has no sound called “${sound}”.`,
        suggestion: closest(sound, inBank),
        detail: `Sounds in this bank: ${inBank.join(' ')}`,
      };
    }
    return { title: `There’s no sound called “${full}”.`, suggestion: closest(full, names), detail: message };
  }
  const duck = /duck target orbit (\d+) does not exist/.exec(message);
  if (duck) {
    return {
      title: `The kick ducks orbit ${duck[1]}, but nothing is playing on orbit ${duck[1]} right now.`,
      detail: 'Only duck in sections where the ducked part plays (e.g. with a modifier applied in those sections).',
    };
  }
  if (/took too long/.test(message)) return null; // first-load latency (gap G8), handled by preloading
  if (/error/i.test(message) && !/\[eval\] error/.test(message)) return { title: message };
  return null;
}

function closest(name: string, candidates: string[]): string | undefined {
  const target = name.toLowerCase();
  // Banked names look like "RolandTR909_bd"; compare the part after the underscore too.
  let best: string | undefined;
  let bestScore = Infinity;
  for (const c of candidates) {
    const short = c.includes('_') ? c.slice(c.lastIndexOf('_') + 1) : c;
    const score = Math.min(distance(target, c.toLowerCase()), distance(target, short.toLowerCase()) + 0.5);
    if (score < bestScore) {
      bestScore = score;
      best = c.includes('_') && distance(target, short.toLowerCase()) + 0.5 === score ? short : c;
    }
  }
  return bestScore <= 2 ? best : undefined;
}

function distance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 3) return 99;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}
