## Lessons

Lessons are JSON packs: `content/packs/core.json` (the curriculum) and `public/packs/*.json` (extra packs, listed in `public/packs/index.json`). Checks are expressions in the language in `lib/lessons/dsl.ts` (summary on the About page); never functions. When writing or changing a lesson, follow the isolation rule in `docs/design.md` §1.1: each task ticks only when the learner does that task, never earlier, and the challenge ticks only in `challengeSolution`. Give every lesson `steps` (the code after each task but the last, applying each hint literally), `teaches` (skill ids from `content/skills.ts`) and `tags`. In a `line` track each starter is the previous solution. Run `npm run lessons:validate -- <pack.json>` until it reports no errors; `npm test -- tests/lessons` must pass.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
