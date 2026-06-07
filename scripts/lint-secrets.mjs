// @enable-adrien:layer=front-cockpit v=1
// lint-secrets.mjs — détecte les secrets hardcodés dans le code source.
// Zéro dépendance. Calqué sur lint-cockpit.mjs. exit 1 sur violation.
// Échappatoire ligne : // secret-lint-allow

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, extname } from 'path';

const ROOT = process.cwd();

const SECRET_RES = [
  { re: /\bsk-ant-[A-Za-z0-9_-]{20,}/, label: 'Anthropic API key' },
  { re: /\bsk-proj-[A-Za-z0-9_-]{20,}/, label: 'OpenAI API key' },
  { re: /\bghp_[A-Za-z0-9]{36}/, label: 'GitHub PAT' },
  { re: /\bhyper_api_[A-Za-z0-9]{20,}/, label: 'Hypercli API key' },
  { re: /\bre_[A-Za-z0-9_]{16,}(?=[^a-z]|$)/, label: 'Resend API key' },
  { re: /\bxoxb-[A-Za-z0-9-]{20,}/, label: 'Slack bot token' },
  { re: /\bAIza[A-Za-z0-9_-]{35}/, label: 'Google API key' },
  { re: /\bxaat-[A-Za-z0-9_-]{20,}/, label: 'Axiom token' },
  { re: /\bsk-lf-[A-Za-z0-9_-]{20,}/, label: 'Langfuse secret key' },
  { re: /\bpk-lf-[A-Za-z0-9_-]{20,}/, label: 'Langfuse public key' },
  { re: /\bcfat_[A-Za-z0-9_-]{20,}/, label: 'Cloudflare API token' },
  { re: /\bcfut_[A-Za-z0-9_-]{20,}/, label: 'Cloudflare tunnel token' },
  { re: /\bsignkey-prod-[a-f0-9]{40,}/, label: 'Inngest signing key' },
  { re: /\bvcp_[A-Za-z0-9]{40,}/, label: 'Vercel token' },
  { re: /\bsk_[a-z0-9]{32,}/, label: 'ElevenLabs API key' },
];

const ALLOW_PATHS = [
  /node_modules/,
  /\.next/,
  /\.env/,
  /\.bak/,
  /coverage/,
  /playwright-report/,
  /scripts\/lint-secrets\.mjs/, // self-exemption
];

const SCAN_EXTS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.json', '.md']);

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (ALLOW_PATHS.some(re => re.test(full))) continue;
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if (SCAN_EXTS.has(extname(entry))) files.push(full);
  }
  return files;
}

let violations = 0;
for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file);
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (line.includes('secret-lint-allow')) return;
    for (const { re, label } of SECRET_RES) {
      if (re.test(line)) {
        console.error(`${rel}:${i + 1}  ${label} en clair → déplace dans .env.local (process.env.X)`);
        violations++;
      }
    }
  });
}

if (violations > 0) {
  console.error(`\n✗ lint-secrets : ${violations} secret(s) hardcodé(s) détecté(s)`);
  process.exit(1);
}
console.log('✓ lint-secrets : aucun secret hardcodé');
