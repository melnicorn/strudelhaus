// The @strudel/* packages ship no TypeScript types (upstream PR #1871 is unmerged).
// We type only the surface we use, in lib/audio/engine.ts and lib/strudel/pure.ts.
declare module '@strudel/core';
declare module '@strudel/mini';
declare module '@strudel/transpiler';
declare module '@strudel/webaudio';
declare module '@strudel/tonal';
declare module '@strudel/draw';
declare module '@strudel/codemirror';
