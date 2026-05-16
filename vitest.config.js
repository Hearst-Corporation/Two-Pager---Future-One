import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node', // Most of our tests are server-side. Per-file override for component tests.
    globals: false,
    include: ['test/**/*.spec.{js,jsx}', 'test/**/*.test.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['lib/**/*.js', 'app/api/**/*.js', 'middleware.js'],
      exclude: ['**/*.spec.*', '**/*.test.*'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
});
