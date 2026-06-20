// Génère des pages HTML lisibles pour TOUS les memos (y compris drafts que la
// route PDF refuse), à partir du memo_markdown / memo_json déjà exportés.
// Aucune dépendance externe : mini-renderer markdown -> HTML intégré.
// Sortie: <export>/reports-html/<slug>.html  + reports-html/index.html
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('export-dossiers');
const stamp = process.argv[2] || fs.readdirSync(root).filter((d) => fs.statSync(path.join(root, d)).isDirectory()).sort().pop();
const DIR = path.join(root, stamp);
const MEMO_DIR = path.join(DIR, 'memos');
const OUT = path.join(DIR, 'reports-html');
fs.mkdirSync(OUT, { recursive: true });

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) => esc(s)
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(.+?)\*/g, '<em>$1</em>')
  .replace(/`(.+?)`/g, '<code>$1</code>')
  .replace(/\[(.+?)\]\((https?:[^)]+)\)/g, '<a href="$2">$1</a>');

// mini markdown -> html (headings, ul/ol, tables, hr, paragraphs)
function mdToHtml(md) {
  const lines = String(md || '').split('\n');
  const out = [];
  let i = 0;
  const closeList = (st) => { while (st.length) out.push(`</${st.pop()}>`); };
  const listStack = [];
  while (i < lines.length) {
    let line = lines[i];
    // table
    if (/^\s*\|.*\|\s*$/.test(line) && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] || '')) {
      closeList(listStack);
      const header = line.split('|').slice(1, -1).map((c) => c.trim());
      i += 2;
      const rows = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        rows.push(lines[i].split('|').slice(1, -1).map((c) => c.trim())); i++;
      }
      out.push('<table><thead><tr>' + header.map((h) => `<th>${inline(h)}</th>`).join('') + '</tr></thead><tbody>'
        + rows.map((r) => '<tr>' + r.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table>');
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { closeList(listStack); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); i++; continue; }
    if (/^\s*([-*])\s+/.test(line)) {
      if (listStack[listStack.length - 1] !== 'ul') { closeList(listStack); out.push('<ul>'); listStack.push('ul'); }
      out.push(`<li>${inline(line.replace(/^\s*[-*]\s+/, ''))}</li>`); i++; continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      if (listStack[listStack.length - 1] !== 'ol') { closeList(listStack); out.push('<ol>'); listStack.push('ol'); }
      out.push(`<li>${inline(line.replace(/^\s*\d+\.\s+/, ''))}</li>`); i++; continue;
    }
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) { closeList(listStack); out.push('<hr>'); i++; continue; }
    if (/^\s*$/.test(line)) { closeList(listStack); i++; continue; }
    closeList(listStack);
    let para = line;
    while (i + 1 < lines.length && !/^\s*$/.test(lines[i + 1]) && !/^(#{1,6}\s|[-*]\s|\d+\.\s|\s*\|)/.test(lines[i + 1])) {
      para += ' ' + lines[i + 1]; i++;
    }
    out.push(`<p>${inline(para)}</p>`); i++;
  }
  closeList(listStack);
  return out.join('\n');
}

// Fallback: si pas de markdown, rendre le memo_json section par section.
function jsonToHtml(mj) {
  if (!mj || typeof mj !== 'object') return '<p><em>No structured content.</em></p>';
  const parts = [];
  for (const [k, v] of Object.entries(mj)) {
    if (k.startsWith('_')) continue;
    parts.push(`<h2>${esc(k.replace(/_/g, ' '))}</h2>`);
    parts.push(`<pre class="json">${esc(JSON.stringify(v, null, 2))}</pre>`);
  }
  return parts.join('\n');
}

const PAGE = (title, meta, bodyHtml) => `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>
:root{--ink:#1a1a1a;--soft:#555;--hair:#e4e0d8;--ox:#6b1b22;--bg:#faf8f4}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.6 -apple-system,Segoe UI,Helvetica,Arial,sans-serif}
.wrap{max-width:880px;margin:0 auto;padding:48px 32px 96px;background:#fff;min-height:100vh;box-shadow:0 0 40px rgba(0,0,0,.05)}
.back{display:inline-block;margin-bottom:24px;color:var(--ox);text-decoration:none;font-size:13px}
.meta{color:var(--soft);font-size:13px;border-left:3px solid var(--ox);padding-left:12px;margin:0 0 28px}
h1{font-size:26px;line-height:1.25;margin:0 0 8px}
h2{font-size:19px;margin:32px 0 10px;padding-bottom:6px;border-bottom:1px solid var(--hair)}
h3{font-size:16px;margin:22px 0 8px}
table{border-collapse:collapse;width:100%;margin:16px 0;font-size:14px}
th,td{border:1px solid var(--hair);padding:7px 10px;text-align:left;vertical-align:top}
th{background:#f3efe8}
code{background:#f3efe8;padding:1px 5px;border-radius:3px;font-size:13px}
pre.json{background:#1e1e1e;color:#dcdcdc;padding:14px;border-radius:6px;overflow:auto;font-size:12px}
ul,ol{padding-left:22px}
hr{border:none;border-top:1px solid var(--hair);margin:24px 0}
a{color:var(--ox)}
@media print{body{background:#fff}.wrap{box-shadow:none;max-width:none}.back{display:none}}
</style></head><body><div class="wrap">
<a class="back" href="index.html">← Tous les reports</a>
<h1>${esc(title)}</h1>
<div class="meta">${meta}</div>
${bodyHtml}
</div></body></html>`;

const slug = (s) => String(s || 'memo').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);
const files = fs.readdirSync(MEMO_DIR).filter((f) => f.endsWith('.json') && !f.startsWith('_'));
const index = [];

for (const f of files) {
  const j = JSON.parse(fs.readFileSync(path.join(MEMO_DIR, f), 'utf8'));
  const m = j.memo || j;
  const title = m.title || m.executive_summary || 'Untitled memo';
  const meta = [
    m.status ? `Statut: <strong>${esc(m.status)}</strong>` : null,
    m.confidence_level ? `Confiance: ${esc(m.confidence_level)}` : null,
    m.region ? `Région: ${esc(m.region)}` : null,
    m.stakeholder ? `Stakeholder: ${esc(m.stakeholder)}` : null,
    m.provider_used ? `Modèle: ${esc(m.provider_used)}` : null,
    m.data_as_of ? `Data as of: ${esc(m.data_as_of)}` : null,
    m.created_at ? `Créé: ${esc(String(m.created_at).slice(0, 10))}` : null,
  ].filter(Boolean).join(' · ');
  const body = m.memo_markdown ? mdToHtml(m.memo_markdown) : jsonToHtml(m.memo_json);
  const name = `${slug(title)}__${String(m.id).slice(0, 8)}.html`;
  fs.writeFileSync(path.join(OUT, name), PAGE(title, meta, body));
  index.push({ name, title, status: m.status, created_at: m.created_at, region: m.region, stakeholder: m.stakeholder });
}

index.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
const rows = index.map((x) => `<tr>
  <td><a href="${x.name}">${esc(x.title)}</a></td>
  <td><span class="badge ${x.status}">${esc(x.status || '')}</span></td>
  <td>${esc(x.region || '')}</td><td>${esc(x.stakeholder || '')}</td>
  <td>${esc(String(x.created_at || '').slice(0, 10))}</td></tr>`).join('\n');

fs.writeFileSync(path.join(OUT, 'index.html'), `<!DOCTYPE html><html lang="fr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reports stratégiques — HEARST</title>
<style>
:root{--ink:#1a1a1a;--soft:#555;--hair:#e4e0d8;--ox:#6b1b22;--bg:#faf8f4}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.6 -apple-system,Segoe UI,Helvetica,Arial,sans-serif}
.wrap{max-width:1000px;margin:0 auto;padding:48px 32px}
h1{font-size:28px;margin:0 0 6px}.sub{color:var(--soft);margin:0 0 28px}
table{border-collapse:collapse;width:100%;background:#fff;box-shadow:0 0 30px rgba(0,0,0,.05)}
th,td{border-bottom:1px solid var(--hair);padding:10px 14px;text-align:left;font-size:14px}
th{background:#f3efe8;position:sticky;top:0}
a{color:var(--ox);text-decoration:none;font-weight:600}a:hover{text-decoration:underline}
.badge{font-size:11px;padding:2px 8px;border-radius:10px;background:#eee;text-transform:uppercase;letter-spacing:.04em}
.badge.approved{background:#d7ecd7;color:#1d5e1d}.badge.draft{background:#f0e3c7;color:#7a5a12}
</style></head><body><div class="wrap">
<h1>Reports stratégiques — HEARST</h1>
<p class="sub">${index.length} memos · export ${esc(stamp)}</p>
<table><thead><tr><th>Title</th><th>Statut</th><th>Région</th><th>Stakeholder</th><th>Créé</th></tr></thead>
<tbody>${rows}</tbody></table>
</div></body></html>`);

console.log(`✓ ${index.length} reports HTML → ${OUT}`);
console.log(`  index: ${path.join(OUT, 'index.html')}`);
