// scripts/smoke-openai.mjs — vérifie OPENAI_API_KEY (quota/billing). Exit 0 = OK.

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

function loadEnvFile(name) {
  const p = join(ROOT, name);
  if (!existsSync(p)) return {};
  const out = {};
  for (const raw of readFileSync(p, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

const env = { ...loadEnvFile('.env.local'), ...loadEnvFile('.env'), ...process.env };
const key = env.OPENAI_API_KEY;
const model = env.OPENAI_CHAT_MODEL || 'gpt-4o';

if (!key) {
  console.error('✗ OPENAI_API_KEY manquant (.env.local)');
  process.exit(1);
}

const { default: OpenAI } = await import('openai');
const client = new OpenAI({ apiKey: key });

try {
  const r = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: 'Reply with exactly: ok' }],
    max_tokens: 5,
  });
  const text = (r.choices[0]?.message?.content || '').trim();
  console.log(`✓ OpenAI smoke OK (${model}) → ${text.slice(0, 40)}`);
} catch (e) {
  const msg = e?.message || String(e);
  console.error(`✗ OpenAI smoke failed: ${msg.slice(0, 240)}`);
  if (/quota|billing|429/i.test(msg)) {
    console.error('  → Recharge le compte : https://platform.openai.com/settings/organization/billing');
  }
  process.exit(1);
}
