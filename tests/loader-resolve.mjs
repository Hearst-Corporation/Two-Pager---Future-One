// Tiny Node ESM loader: appends .js to extensionless lib imports (legacy CJS-style).
// Lets us run /lib/hearst-* code without bundler.

import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    if (!specifier.endsWith('.js') && !specifier.endsWith('.mjs') && !specifier.endsWith('.json')) {
      try {
        return nextResolve(specifier + '.js', context);
      } catch {}
    }
  }
  return nextResolve(specifier, context);
}
