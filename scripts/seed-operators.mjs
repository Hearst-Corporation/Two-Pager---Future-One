/* eslint-disable no-console */
import { PILLARS } from '../components/pitch-misa/shared/pillars.js';

const SUPABASE_URL = 'https://zrvlmhuymhyrzonnihce.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const rows = [];
for (const pid of ['datacenter', 'mining', 'hub']) {
  const p = PILLARS[pid];
  for (const op of p.operators) {
    rows.push({
      pillar: pid,
      rank: op.rank,
      name: op.name,
      country: op.country,
      role: op.role,
      one_liner: op.oneLiner,
      status: 'identified',
      notes: 'Seed entry — initial target identified for Futur One × MISA pitch.',
    });
  }
}

console.log(`Seeding ${rows.length} operators...`);

const res = await fetch(`${SUPABASE_URL}/rest/v1/operators`, {
  method: 'POST',
  headers: {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Profile': 'crm',
    'Content-Type': 'application/json',
    Prefer: 'return=representation,resolution=merge-duplicates',
  },
  body: JSON.stringify(rows),
});

const text = await res.text();
console.log('Status:', res.status);
console.log(text.slice(0, 1500));
