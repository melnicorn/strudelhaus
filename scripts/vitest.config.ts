import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// The validator CLI: the app's Vitest setup, pointed at scripts/ instead of tests/.
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('../', import.meta.url)) } },
  test: {
    include: ['scripts/validate-pack.test.ts'],
    environment: 'node',
    server: { deps: { inline: [/@strudel\//, /@kabelsalat\//, 'superdough'] } },
  },
});
