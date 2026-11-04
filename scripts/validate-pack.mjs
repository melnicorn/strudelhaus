#!/usr/bin/env node
// `npm run lessons:validate [-- pack.json …]`: hands the paths to the Vitest script and keeps its exit code.
import { spawnSync } from 'node:child_process';
const r = spawnSync('npx', ['vitest', 'run', '--config', 'scripts/vitest.config.ts', 'scripts/validate-pack.test.ts'], {
  stdio: 'inherit',
  env: { ...process.env, PACKS: process.argv.slice(2).join(' ') },
});
process.exit(r.status ?? 1);
