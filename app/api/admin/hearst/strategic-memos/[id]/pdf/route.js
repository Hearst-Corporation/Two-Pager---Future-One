// GET /api/admin/hearst/strategic-memos/[id]/pdf
//
// Boardroom Report (2 pages). Server-rendered, institutional. Renders ALREADY
// computed data (no engine touch): Executive Scorecard + cashflow-to-breakeven
// + capital waterfall + benchmark peers (page 1); Recommendation + risk matrix
// + deployment timeline (page 2). Plain-language via Executive Mode.

import { NextResponse } from 'next/server';
import { requireProfile, getAdminClient } from '@/lib/supabase-admin';
import { exec, TONE_HEX, fmtUsd, fmtPct, fmtX } from '@/lib/executive-language';

export const runtime = 'nodejs';
export const maxDuration = 60;

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ── Executive scorecard cards ─────────────────────────────────────────────
function card(c) {
  const col = TONE_HEX[c.tone] || '#555';
  return `<div class="card">
    <div class="card-label">${esc(c.label)}</div>
    <div class="card-value">${esc(c.raw)}</div>
    <div class="card-verdict" style="color:${col};border-color:${col}">${esc(c.verdict)}</div>
    <div class="card-hint">${esc(c.hint || '')}</div>
  </div>`;
}

// ── Cashflow-to-breakeven (bars = annual FCF, line = cumulative) ───────────
function cashflowSvg(snap) {
  const ys = (snap?.years || []).filter(y => y.fcf != null || y.cum != null);
  if (ys.length < 2) return '<div class="muted">Cashflow series not available for this memo version.</div>';
  const W = 700, H = 150, pad = 30, n = ys.length;
  const fcf = ys.map(y => y.fcf || 0), cum = ys.map(y => y.cum || 0);
  const allV = [...fcf, ...cum, 0];
  const mn = Math.min(...allV), mx = Math.max(...allV);
  const sx = i => pad + (i * (W - 2 * pad)) / (n - 1);
  const sy = v => H - pad - ((v - mn) / (mx - mn || 1)) * (H - 2 * pad);
  const zeroY = sy(0);
  const bw = (W - 2 * pad) / n * 0.5;
  const bars = ys.map((y, i) => {
    const v = y.fcf || 0; const yTop = sy(Math.max(v, 0)); const h = Math.abs(sy(v) - zeroY);
    return `<rect x="${sx(i) - bw / 2}" y="${yTop}" width="${bw}" height="${h}" fill="${v >= 0 ? '#9fb8c4' : '#d9b3b3'}"/>`;
  }).join('');
  const line = cum.map((v, i) => `${sx(i)},${sy(v)}`).join(' ');
  const cross = cum.findIndex(v => v >= 0);
  const breakeven = cross > 0 ? `<circle cx="${sx(cross)}" cy="${sy(0)}" r="4" fill="#1b7a4b"/><text x="${sx(cross)}" y="${sy(0) - 8}" font-size="9" fill="#1b7a4b" text-anchor="middle">breakeven Y${ys[cross].y}</text>` : '';
  return `<svg viewBox="0 0 ${W} ${H}" width="100%">
    <line x1="${pad}" y1="${zeroY}" x2="${W - pad}" y2="${zeroY}" stroke="#ccc"/>
    ${bars}
    <polyline points="${line}" fill="none" stroke="#7a1730" stroke-width="2"/>
    ${breakeven}
    ${ys.map((y, i) => `<text x="${sx(i)}" y="${H - 8}" font-size="8" fill="#888" text-anchor="middle">Y${y.y}</text>`).join('')}
  </svg>`;
}

// ── Capital waterfall: −CAPEX → +Σ FCF → +Terminal → Equity value ──────────
function waterfallSvg(snap) {
  if (!snap?.total_capex) return '<div class="muted">Capital waterfall not available.</div>';
  const capex = -(snap.total_capex || 0);
  const sumFcf = (snap.years || []).reduce((a, y) => a + (y.fcf || 0), 0);
  const tv = snap.terminal_value || 0;
  const net = capex + sumFcf + tv;
  const steps = [
    { label: 'Capital', v: capex }, { label: 'Op. cash (10y)', v: sumFcf }, { label: 'Exit value', v: tv }, { label: 'Net to equity', v: net, total: true },
  ];
  const W = 700, H = 135, pad = 24; const maxAbs = Math.max(...steps.map(s => Math.abs(s.v)), Math.abs(net), 1);
  const colW = (W - 2 * pad) / steps.length * 0.6; const baseY = H - pad;
  const h = v => (Math.abs(v) / maxAbs) * (H - 2 * pad);
  let run = 0; const bars = steps.map((s, i) => {
    const x = pad + i * ((W - 2 * pad) / steps.length) + ((W - 2 * pad) / steps.length - colW) / 2;
    let y, height, col;
    if (s.total) { height = h(s.v); y = baseY - height; col = s.v >= 0 ? '#1b7a4b' : '#a23030'; run = s.v; }
    else { const start = run; run += s.v; const top = Math.max(start, run); const bot = Math.min(start, run); y = baseY - h(top); height = h(top) - h(bot); col = s.v >= 0 ? '#9fb8c4' : '#d9b3b3'; }
    return `<rect x="${x}" y="${y}" width="${colW}" height="${Math.max(height, 1)}" fill="${col}"/>
      <text x="${x + colW / 2}" y="${baseY + 12}" font-size="8" fill="#666" text-anchor="middle">${esc(s.label)}</text>
      <text x="${x + colW / 2}" y="${y - 4}" font-size="8" fill="#333" text-anchor="middle">${fmtUsd(s.v)}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%"><line x1="${pad}" y1="${baseY}" x2="${W - pad}" y2="${baseY}" stroke="#ddd"/>${bars}</svg>`;
}

// ── Risk matrix: severity rows × risk chips ────────────────────────────────
function riskMatrix(memo) {
  const items = memo?.risks_constraints?.items || [];
  if (!items.length) return '<div class="muted">No structured risks.</div>';
  const sev = { HIGH: [], MEDIUM: [], LOW: [] };
  items.forEach(it => (sev[(it.severity || 'MEDIUM').toUpperCase()] ||= sev.MEDIUM).push(it));
  const colour = { HIGH: '#a23030', MEDIUM: '#b3661a', LOW: '#7a6a1f' };
  return ['HIGH', 'MEDIUM', 'LOW'].map(s => `
    <div class="risk-row"><div class="risk-sev" style="background:${colour[s]}">${s}</div>
      <div class="risk-chips">${(sev[s] || []).map(it => `<span class="chip" title="${esc(it.mitigation || '')}">${esc(it.label)}${it.category ? ` · ${esc(it.category)}` : ''}</span>`).join('') || '<span class="muted">—</span>'}</div>
    </div>`).join('');
}

// ── Deployment timeline ────────────────────────────────────────────────────
function timelineSvg(memo) {
  const phases = memo?.deployment_roadmap?.phases || [];
  if (!phases.length) return '<div class="muted">No phased timeline.</div>';
  const parse = (s) => { const m = String(s || '').match(/\d+/); return m ? +m[0] : null; };
  const pts = phases.map(p => ({ label: p.label, m: parse(p.months_from_t0) })).filter(p => p.m != null);
  if (!pts.length) return `<ul class="tl-list">${phases.map(p => `<li><b>${esc(p.label)}</b> — ${esc(p.months_from_t0)}</li>`).join('')}</ul>`;
  const maxM = Math.max(...pts.map(p => p.m), 1); const W = 700, H = 90, pad = 30;
  const x = m => pad + (m / maxM) * (W - 2 * pad);
  return `<svg viewBox="0 0 ${W} ${H}" width="100%">
    <line x1="${pad}" y1="40" x2="${W - pad}" y2="40" stroke="#7a1730" stroke-width="2"/>
    ${pts.map((p, i) => `<circle cx="${x(p.m)}" cy="40" r="5" fill="#7a1730"/>
      <text x="${x(p.m)}" y="${i % 2 ? 64 : 26}" font-size="9" fill="#333" text-anchor="middle">${esc(p.label)}</text>
      <text x="${x(p.m)}" y="${i % 2 ? 76 : 16}" font-size="8" fill="#999" text-anchor="middle">T+${p.m}mo</text>`).join('')}
  </svg>`;
}

function reco(memo) {
  const ra = memo?.recommended_architecture || {};
  const cfg = ra.config || {};
  const cfgLine = Object.entries(cfg).filter(([, v]) => v).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(' · ');
  return `${ra.rationale ? `<p>${esc(ra.rationale)}</p>` : ''}${cfgLine ? `<div class="cfg">${esc(cfgLine)}</div>` : ''}`;
}

function peers(memo) {
  const cmp = memo?.market_benchmarking?.comparables || [];
  if (!cmp.length) return '';
  return `<div class="peers">${cmp.slice(0, 6).map(c => `<div class="peer"><div class="peer-name">${esc(c.name)}</div><div class="peer-metric">${esc(c.metric)}</div><div class="peer-val">${esc(c.value)}</div></div>`).join('')}</div>`;
}

function buildHtml(row) {
  const m = row.memo_json || {};
  const snap = m._exec_projection || {};
  const cb = m.confidence_block || {};
  const df = m.data_freshness || {};
  const exsum = m.executive_summary || {};
  const cards = [
    exec.irr(snap.irr ?? null), exec.moic(snap.moic ?? null), exec.npv(snap.npv ?? null),
    exec.capexPerMw(snap.capex_per_mw ?? null), exec.dscr(snap.dscr_stabilized ?? null),
    exec.confidence(cb.confidence_level || row.confidence_level, cb.source_density),
  ];
  const codCard = exec.cod(snap.cod_offset_months, df.data_as_of || row.data_as_of);
  return `<!doctype html><html><head><meta charset="utf-8"><title>ORACLE — Strategic Memo</title><style>
    @page { margin: 14mm 14mm; size: A4; }
    * { box-sizing: border-box; }
    body { font-family: 'Georgia','Times New Roman',serif; color:#1a1a1a; font-size:10.5pt; margin:0; }
    .bar { background:#7a1730; color:#fff; padding:10px 16px; border-radius:8px; display:flex; justify-content:space-between; align-items:flex-end; }
    .bar h1 { font-size:18pt; margin:0; }
    .bar .meta { font-size:8.5pt; opacity:.9; text-align:right; line-height:1.5; }
    .pill { display:inline-block; background:rgba(255,255,255,.18); border:1px solid rgba(255,255,255,.5); border-radius:10px; padding:1px 8px; font-size:8pt; }
    h2 { font-size:10.5pt; color:#7a1730; text-transform:uppercase; letter-spacing:.05em; border-bottom:1px solid #e0c0c8; padding-bottom:2px; margin:9px 0 5px; }
    .scorecard { display:flex; gap:8px; flex-wrap:wrap; }
    .card { flex:1 1 30%; border:1px solid #e2dde0; border-radius:8px; padding:8px 10px; min-width:150px; }
    .card-label { font-size:8pt; color:#888; text-transform:uppercase; letter-spacing:.04em; }
    .card-value { font-size:18pt; font-weight:bold; color:#1a1a1a; line-height:1.1; margin:2px 0; }
    .card-verdict { display:inline-block; font-size:8pt; border:1px solid; border-radius:10px; padding:0 7px; font-weight:bold; }
    .card-hint { font-size:7.5pt; color:#aaa; margin-top:3px; }
    .lead { font-size:11.5pt; font-style:italic; color:#333; margin:8px 0; }
    .bullets { margin:4px 0; padding-left:18px; } .bullets li { margin:2px 0; }
    .muted { color:#aaa; font-size:9pt; font-style:italic; }
    .peers { display:flex; gap:6px; flex-wrap:wrap; } .peer { flex:1 1 30%; border:1px solid #eee; border-radius:6px; padding:6px 8px; min-width:120px; }
    .peer-name { font-weight:bold; font-size:9pt; } .peer-metric { font-size:7.5pt; color:#999; } .peer-val { font-size:10pt; color:#7a1730; }
    .reco { background:#faf6f7; border-left:3px solid #7a1730; padding:8px 12px; border-radius:0 6px 6px 0; }
    .cfg { font-size:8.5pt; color:#555; margin-top:6px; }
    .risk-row { display:flex; gap:8px; align-items:flex-start; margin:4px 0; }
    .risk-sev { color:#fff; font-size:8pt; font-weight:bold; padding:2px 8px; border-radius:4px; width:64px; text-align:center; flex:0 0 auto; }
    .risk-chips { display:flex; gap:4px; flex-wrap:wrap; } .chip { background:#f1ecee; border:1px solid #e2dde0; border-radius:10px; padding:1px 8px; font-size:8pt; }
    .tl-list { font-size:9pt; }
    .footer { margin-top:14px; border-top:1px solid #ccc; padding-top:6px; font-size:8pt; color:#888; }
    .pagebreak { page-break-before: always; }
  </style></head><body>
    <div class="bar">
      <div><h1>${esc(row.title)}</h1><div style="font-size:9pt">${esc(row.region || '')} · ${esc(row.stakeholder || '')} &nbsp; <span class="pill">AI-ASSISTED · INDICATIVE</span></div></div>
      <div class="meta">Strategic Memo · v${esc(row.version)} · ${esc((row.status || 'draft').toUpperCase())}<br/>Model ${esc(row.provider_used || 'n/a')}<br/>Generated ${esc(new Date(row.created_at).toLocaleDateString())} · ${esc(codCard.label)} ${esc(codCard.raw)} · Data as of ${esc(df.data_as_of || row.data_as_of || 'n/a')}</div>
    </div>

    ${exsum.headline ? `<div class="lead">${esc(exsum.headline)}</div>` : ''}

    <h2>Executive Scorecard</h2>
    <div class="scorecard">${cards.map(card).join('')}</div>

    <h2>Path to Breakeven — Annual &amp; Cumulative Cash Flow (10y)</h2>
    ${cashflowSvg(snap)}

    <h2>Capital Waterfall</h2>
    ${waterfallSvg(snap)}

    <h2>Market Position</h2>
    ${peers(m) || '<div class="muted">No peer comparables in this memo.</div>'}

    <div class="pagebreak"></div>

    <h2>Recommendation</h2>
    <div class="reco">${reco(m) || '<span class="muted">See executive summary.</span>'}</div>
    ${Array.isArray(exsum.bullets) && exsum.bullets.length ? `<ul class="bullets">${exsum.bullets.slice(0, 5).map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}

    <h2>Risk Matrix</h2>
    ${riskMatrix(m)}

    <h2>Deployment Timeline</h2>
    ${timelineSvg(m)}

    <div style="text-align:center;font-size:10px;color:#6b7280;padding-top:12px;border-top:1px solid #e5e7eb;margin-top:14px;">Generated by ORACLE · ${esc(row.model_used || row.provider_used || 'n/a')} · Confidential</div>

    <div class="footer">
      <b>AI-assisted · Indicative · Human review required.</b> Figures are modelled estimates, not investment advice.<br/>
      Confidence ${esc(cb.confidence_level || 'n/a')} (${esc(cb.source_density || 'n/a')}) · data as of ${esc(df.data_as_of || 'n/a')} · ORACLE memo ${esc(row.id)} v${esc(row.version)} · generated ${esc(new Date(row.created_at).toISOString())}.
    </div>
  </body></html>`;
}

export async function GET(_req, { params }) {
  const auth = await requireProfile('viewer');
  if (auth instanceof NextResponse) return auth;

  const supa = getAdminClient();
  const { data: row, error } = await supa.from('strategic_memos').select('*').eq('id', params.id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  let browser;
  try {
    const puppeteer = (await import('puppeteer')).default;
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(buildHtml(row), { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    const filename = `oracle-memo-${(row.title || 'memo').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-v${row.version}.pdf`;
    return new NextResponse(Buffer.from(pdf), { status: 200, headers: {
      'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'no-store',
    } });
  } catch (e) {
    if (browser) { try { await browser.close(); } catch {} }
    return NextResponse.json({ error: 'pdf_generation_failed', detail: e?.message }, { status: 500 });
  }
}
