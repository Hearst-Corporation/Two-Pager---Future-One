/* eslint-disable no-console */
import { PILLARS } from '../components/pitch-misa/shared/pillars.js';
import fs from 'node:fs';

const esc = (s) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`);

const lines = ['-- Auto-generated seed', "delete from crm.operators;"];
for (const pid of ['datacenter', 'mining', 'hub']) {
  const p = PILLARS[pid];
  for (const op of p.operators) {
    lines.push(
      `insert into crm.operators (pillar, rank, name, country, role, one_liner, status, notes) values (${esc(pid)}, ${esc(op.rank)}, ${esc(op.name)}, ${esc(op.country)}, ${esc(op.role)}, ${esc(op.oneLiner)}, 'identified', 'Seed — initial target for Futur One × MISA pitch.');`,
    );
  }
}
fs.writeFileSync('scripts/seed.sql', lines.join('\n'));
console.log(`Wrote ${lines.length - 2} rows to scripts/seed.sql`);
