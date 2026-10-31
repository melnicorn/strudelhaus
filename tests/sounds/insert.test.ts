import { describe, expect, it } from 'vitest';
import { addPartToCode, partNameFor } from '@/lib/sounds/insert';

describe('addPartToCode', () => {
  it('adds a const and a stack member when the last line is a stack', () => {
    const code = 'setcpm(124/4)\nconst kick = s("bd*4")\nstack(kick)\n';
    const out = addPartToCode(code, 'cp', 's("cp").bank("RolandTR909")');
    expect(out.code).toBe('setcpm(124/4)\nconst kick = s("bd*4")\nconst cp = s("cp").bank("RolandTR909")\nstack(kick, cp)\n');
  });

  it('picks a free name', () => {
    const code = 'const bd = s("bd*4")\nstack(bd)\n';
    expect(addPartToCode(code, 'bd', 's("bd:2")').name).toBe('bd2');
  });

  it('plays the new part when the project is empty', () => {
    expect(addPartToCode('', 'saw', 'note("c3").s("sawtooth")').code).toBe('const saw = note("c3").s("sawtooth")\nsaw\n');
  });

  it('leaves other last lines alone', () => {
    const code = 's("bd*4")\n';
    expect(addPartToCode(code, 'cp', 's("cp")').code).toBe('const cp = s("cp")\ns("bd*4")\n');
  });

  it('makes variable names', () => {
    expect(partNameFor('bd:2')).toBe('bd');
    expect(partNameFor('sawtooth')).toBe('saw');
  });
});
