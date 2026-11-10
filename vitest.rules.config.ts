import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['firebase/**/*.test.ts'],
    testTimeout: 30000
  }
});
