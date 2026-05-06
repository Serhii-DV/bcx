import { fileURLToPath } from 'node:url';
import { defineConfig } from '@rstest/core';

export default defineConfig({
  testEnvironment: 'jsdom',
  setupFiles: ['./src/test/setup.ts'],
  resolve: {
    alias: {
      '@lucide/svelte': fileURLToPath(
        new URL('./src/test/mocks/lucide-svelte.ts', import.meta.url),
      ),
    },
  },
});
