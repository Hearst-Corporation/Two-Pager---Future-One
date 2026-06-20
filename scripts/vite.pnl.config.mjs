import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Bundles the real projection engine into a single self-contained IIFE
// (global `PNLEngine`) so the standalone P&L model can run the engine in-browser.
export default defineConfig({
  root,
  configFile: false,
  build: {
    lib: {
      entry: path.resolve(root, 'scripts/pnl-engine-entry.mjs'),
      name: 'PNLEngine',
      formats: ['iife'],
      fileName: () => 'pnl-engine.iife.js',
    },
    outDir: path.resolve(root, 'scripts/pnl-build'),
    emptyOutDir: true,
    minify: 'esbuild',
    target: 'es2019',
    rollupOptions: { external: [] },
  },
});
