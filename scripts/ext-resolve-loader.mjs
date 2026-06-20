// Node ESM resolve hook: ajoute automatiquement .js aux imports relatifs sans
// extension (les libs du repo sont écrites pour le résolveur webpack/Next).
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export async function resolve(specifier, context, next) {
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && !path.extname(specifier)) {
    const parentPath = fileURLToPath(context.parentURL);
    const base = path.resolve(path.dirname(parentPath), specifier);
    for (const cand of [base + '.js', path.join(base, 'index.js')]) {
      if (existsSync(cand)) {
        return next(specifier + (cand.endsWith('index.js') ? '/index.js' : '.js'), context);
      }
    }
  }
  return next(specifier, context);
}
