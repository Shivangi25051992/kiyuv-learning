import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['packages/**/*.test.ts', 'apps/**/*.test.{ts,tsx}', 'functions/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', 'firebase/**/*.test.ts']
  }
});
