# Strudel Workshop

Learn to write [Strudel](https://strudel.cc) code by making 90s house and techno: 33 lessons from a first kick drum to an arranged acid house track. GUI controls are training wheels that always write visible, readable Strudel code.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # Vitest: sync layer, storage, lessons, reference examples
npm run build
```

The footer links to the source at <https://github.com/melnicorn/strudelhaus>, as the AGPL requires. If you deploy a modified fork, set `NEXT_PUBLIC_SOURCE_URL` to your own repository.

## How it's put together

- `docs/research.md`: Phase 1 research (skills, 90s gear, the Strudel API, gaps G1–G14).
- `docs/design.md`: Phase 2 design and the decisions taken. Wireframes: `docs/wireframes/index.html`.
- `lib/audio/engine.ts`: the only module that plays Strudel audio (client-only, a singleton). `lib/strudel/pure.ts` evaluates code without audio for checks, previews and tests.
- `lib/sync/`: the code ⇄ GUI layer. `parseProject` reads code with acorn into blocks with exact source ranges; `generate` turns GUI actions into small guarded text edits. GUI edits never touch text outside their range, and are refused if the code changed underneath them.
- UI: Tailwind v4 + HeroUI v3 (pinned). Conventions, theme tokens and which component to use for what: `docs/ui.md`. Shared pieces live in `components/ui/`.
- `components/blocks/`: panels for parts (step grid, 303 sequencer, degree tracker, chords, sound controls), modifiers, groups (mixer) and the arrangement matrix.
- `content/lessons/`: lessons as typed data. Every solution is tested against its own checks.
- `lib/sounds/`: the sound browser's catalog. `catalog.data.ts` is generated from the sample manifests by `node scripts/gen-sound-catalog.mjs`; `engine.audition()` plays a snippet over whatever is playing.
- `lib/editor/autocomplete.ts` + `completions.ts`: editor autocomplete (methods after a dot, sounds in `s()`, machines in `.bank()`, scales in `.scale()`), fed by the reference and the sound catalog. The checkbox under the editor turns it off; the setting is saved in the browser.
- `lib/dictionary/terms.ts`: the dictionary. Hold ⌘/Ctrl anywhere to underline its words (prose via `withTerms`, code via `lib/editor/terms.ts`); `components/dictionary/TermHover.tsx` shows definitions.
- Strudel packages are pinned to exact versions (npm 1.2.6 / 1.3.0); upstream `main` has breaking changes.

## License

GNU AGPL-3.0-or-later (see `LICENSE`). Uses the `@strudel/*` packages, which are AGPL-3.0-or-later.
