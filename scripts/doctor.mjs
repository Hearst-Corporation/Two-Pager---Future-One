// @enable-adrien:layer=front-cockpit v=1
// doctor.mjs — préflight lisible : dit ce qui manque pour `npm run dev`/`build`.
// Complète le fail-fast de lib/env-validation.js avec un diagnostic humain.
// N'AFFICHE JAMAIS la valeur d'un secret — seulement présent/absent.
// Source de vérité des vars requises : lib/env-validation.js.

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

// Doit refléter lib/env-validation.js (REQUIRED_*). Tenu volontairement court.
const REQUIRED_SERVER = ['SUPABASE_SERVICE_ROLE_KEY', 'OPENAI_API_KEY'];
const REQUIRED_PUBLIC = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];

// Charge .env.local (Next le charge au runtime ; ce script standalone ne l'a pas).
function loadEnvFile(name) {
  const p = join(ROOT, name);
  if (!existsSync(p)) return {};
  const out = {};
  for (const raw of readFileSync(p, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return out;
}

const fileEnv = { ...loadEnvFile('.env.local'), ...loadEnvFile('.env') };
const env = { ...fileEnv, ...process.env };
const present = (k) => Boolean(env[k] && String(env[k]).length > 0);

const hasEnvLocal = existsSync(join(ROOT, '.env.local'));
console.log(`\n🩺 Oracle doctor — préflight environnement`);
console.log(`   .env.local : ${hasEnvLocal ? 'présent' : 'ABSENT (cp .env.example .env.local)'}`);

const missing = [];
console.log('\n   Variables requises :');
for (const k of [...REQUIRED_SERVER, ...REQUIRED_PUBLIC]) {
  const ok = present(k);
  if (!ok) missing.push(k);
  console.log(`     ${ok ? '✓' : '✗'} ${k}`);
}

if (missing.length > 0) {
  console.error(`\n   ✗ ${missing.length} variable(s) manquante(s) : ${missing.join(', ')}`);
  console.error(`   → renseigne-les dans .env.local (cf. .env.example + ~/.claude/api-config/SERVICES.md)\n`);
  process.exit(process.argv.includes('--strict') ? 1 : 0);
}
console.log('\n   ✓ Environnement complet — npm run dev / build OK\n');
