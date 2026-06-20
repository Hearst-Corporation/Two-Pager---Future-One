// Exporte TOUT ce qui est en base (déjà lancé) via l'API Next loguée (engine prod) :
//  - projet HEARST
//  - 155 scénarios + PNL calculé (years, IRR/NPV/MOIC/EBITDA/DSCR/capex…) -> JSON + CSV par année
//  - memos stratégiques : JSON complet (memo_json) + rendu HTML imprimable
//  - sources (evidence register)
//  - deals (archetypes)
//
// Sortie: export-dossiers/<timestamp>/  + manifest.json + README.md
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.ORACLE_BASE || 'http://localhost:5005/api/admin/hearst';

const STAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const OUT = path.resolve('export-dossiers', STAMP);
fs.mkdirSync(OUT, { recursive: true });

const w = (rel, data) => {
  const p = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  return p;
};
const slug = (s) => String(s || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);
const short = (id) => String(id || '').slice(0, 8);

async function getJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}
async function getText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

const manifest = { exported_at: new Date().toISOString(), base: BASE, counts: {} };

// ── Project ──
console.log('• project');
const { project } = await getJson(`${BASE}/project`);
w('project.json', project);
const PID = project.id;
manifest.project = { id: PID, name: project.name };

// ── Scenarios + PNL (paginé pour tout récupérer) ──
console.log('• scenarios (+ PNL)…');
const sc = await getJson(`${BASE}/scenarios?project_id=${PID}&limit=1000`);
const scenarios = sc.scenarios || [];
console.log(`  ${scenarios.length} / ${sc.count} scénarios`);
manifest.counts.scenarios = scenarios.length;
w('scenarios/_all-scenarios.json', scenarios);
const scIndex = [];
for (const s of scenarios) {
  const name = `${slug(s.scenario_type)}__${slug(s.name)}__${short(s.id)}`;
  w(`scenarios/${name}.json`, s);
  // PNL année par année -> CSV
  const years = s.projection?.years;
  if (Array.isArray(years) && years.length) {
    const cols = Object.keys(years[0]);
    const csv = [cols.join(','), ...years.map((y) => cols.map((c) => JSON.stringify(y[c] ?? '')).join(','))].join('\n');
    w(`scenarios/pnl-csv/${name}.csv`, csv);
  }
  const pj = s.projection || {};
  scIndex.push({
    id: s.id, name: s.name, type: s.scenario_type, is_active: s.is_active, is_locked: s.is_locked,
    total_mw: s.total_mw, irr: pj.irr, npv: pj.npv, moic: pj.moic,
    stabilized_ebitda: pj.stabilized_ebitda, dscr_stabilized: pj.dscr_stabilized,
    total_capex: pj.total_capex, file: `scenarios/${name}.json`,
  });
}
w('scenarios/_index.json', scIndex);

// ── Strategic memos (full + HTML) ──
console.log('• strategic memos (full + HTML)…');
const ml = await getJson(`${BASE}/strategic-memos?project_id=${PID}`);
const memoList = ml.memos || [];
manifest.counts.memos = memoList.length;
w('memos/_index.json', memoList);
let memoOk = 0;
for (const m of memoList) {
  const base = `memos/${slug(m.title)}__${short(m.id)}`;
  try {
    const detail = await getJson(`${BASE}/strategic-memos/${m.id}`);
    w(`${base}.json`, detail);
    const mj = detail.memo?.memo_json || {};
    const md = detail.memo?.memo_markdown || mj.markdown || mj.body_md || null;
    if (md) w(`${base}.md`, md);
    memoOk++;
  } catch (e) { console.warn(`  ⚠ memo ${short(m.id)} detail: ${e.message}`); }
  // HTML imprimable seulement pour les memos exportables (approved/reviewed/archived).
  if (['approved', 'reviewed', 'archived'].includes(m.status)) {
    try {
      const html = await getText(`${BASE}/strategic-memos/${m.id}/pdf?format=html`);
      w(`${base}.html`, html);
    } catch (e) { console.warn(`  ⚠ memo ${short(m.id)} html: ${e.message}`); }
  }
}
manifest.counts.memos_with_detail = memoOk;

// ── Sources ──
console.log('• sources…');
try {
  const sr = await getJson(`${BASE}/sources?project_id=${PID}&limit=1000`);
  w('sources.json', sr.sources || sr);
  manifest.counts.sources = (sr.sources || []).length;
} catch (e) { console.warn(`  ⚠ sources: ${e.message}`); }

// ── Deals ──
console.log('• deals…');
try {
  const dl = await getJson(`${BASE}/deals`);
  w('deals.json', dl.deals || dl);
  manifest.counts.deals = (dl.deals || []).length;
} catch (e) { console.warn(`  ⚠ deals: ${e.message}`); }

// ── Manifest + README ──
w('manifest.json', manifest);
const readme = `# Export base de données — Oracle / HEARST
Généré : ${manifest.exported_at}
Projet : ${project.name} (${PID})

## Contenu
${Object.entries(manifest.counts).map(([k, v]) => `- **${k}** : ${v}`).join('\n')}

## Dossiers
- \`project.json\` — projet HEARST (sponsor, partenaires, pays…)
- \`scenarios/\` — 1 JSON par scénario : inputs + **PNL calculé** (revenue/power/opex/EBITDA/FCF/DSCR) + IRR/NPV/MOIC/capex
- \`scenarios/pnl-csv/\` — **PNL année par année en CSV** (Excel/Numbers)
- \`scenarios/_index.json\` — table récap (IRR, NPV, MOIC, EBITDA, DSCR, capex) par scénario
- \`memos/\` — memos stratégiques : \`.json\` (memo_json complet), \`.md\` si rendu, **\`.html\` imprimable**
- \`sources.json\` — evidence register
- \`deals.json\` — archétypes de deals
`;
w('README.md', readme);

console.log('\n✓ Export →', OUT);
console.log(JSON.stringify(manifest.counts, null, 2));
