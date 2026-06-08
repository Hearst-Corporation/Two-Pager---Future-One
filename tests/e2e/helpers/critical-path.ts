// tests/e2e/helpers/critical-path.ts
//
// Reusable helpers + assertions for the IC critical-path E2E suite.
// Auth: dev autologin authenticates every request server-side (middleware), so
// page.request / the `request` fixture are authenticated without a login form.
//
// All created records are tagged with RUN_TAG so they are identifiable and
// best-effort-cleanable. Memo generation falls back to a deterministic
// engine-backed memo (~3s) — the numbers we assert are engine-owned either way.

import { APIRequestContext, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const RUN_TAG = `E2E-TEST-${Date.now()}`;

// ── canonical formatters (mirrored from lib/hearst-format) ───────────────────
export function fmtUSD(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '—';
  const sign = v < 0 ? '-' : '';
  const a = Math.abs(v);
  if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${sign}$${(a / 1e3).toFixed(0)}K`;
  return `${sign}$${a.toFixed(0)}`;
}
export function fmtPct(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '—';
  return `${(v * 100).toFixed(1)}%`;
}
export function fmtX(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '—';
  return `${v.toFixed(2)}x`;
}

// ── API surface (faithful to the routes the UI calls) ────────────────────────
export async function getProjectId(req: APIRequestContext): Promise<string> {
  const r = await req.get('/api/admin/hearst/project');
  expect(r.ok(), 'GET /project').toBeTruthy();
  const j = await r.json();
  expect(j.project?.id, 'project.id present').toBeTruthy();
  return j.project.id;
}

export interface SimResult { scenario: any; projection: any; source_score?: number }

export async function simulate(req: APIRequestContext, projectId: string, overrides: any = {}): Promise<SimResult> {
  const body = {
    input_mode: 'mw_first',
    input_value: { total_mw: 20 },
    archetype_id: 'powered_shell',
    business_model_id: 'hyperscale_lease',
    geography: 'qatar',
    hardware_mix: { classic_pct: 80, liquid_pct: 20, ai_pct: 0, utilization_pct: 80 },
    project_id: projectId,
    ...overrides,
  };
  const r = await req.post('/api/admin/hearst/simulate', { data: body });
  expect(r.ok(), `POST /simulate (${r.status()})`).toBeTruthy();
  return r.json();
}

/** Create a tagged scenario via POST /scenarios (same shape the simulator UI sends). */
export async function createScenario(req: APIRequestContext, projectId: string, sim: SimResult): Promise<string> {
  const sc = sim.scenario || {};
  const body: any = {
    project_id: projectId,
    name: `${RUN_TAG} ${sc.total_mw || 20}MW`,
    scenario_type: 'custom',
    ...sc, // canonical capex_/price_/debt_/exit_ fields (server validates/strips unknowns)
    input_mode: 'mw_first',
    input_value: { total_mw: sc.total_mw || 20 },
    hardware_mix: { classic_pct: 80, liquid_pct: 20, ai_pct: 0, utilization_pct: 80 },
  };
  delete body.id; // never send a client id
  const r = await req.post('/api/admin/hearst/scenarios', { data: body });
  expect(r.ok(), `POST /scenarios (${r.status()}) ${await safeText(r)}`).toBeTruthy();
  const j = await r.json();
  expect(j.scenario?.id, 'created scenario id').toBeTruthy();
  return j.scenario.id;
}

export interface MemoResult { status: number; persisted: any; model_used?: string; persistFailed?: boolean; body: any }

export async function generateMemo(req: APIRequestContext, opts: { projectId: string; scenarioId: string; sim: SimResult; title?: string }): Promise<MemoResult> {
  const r = await req.post('/api/admin/hearst/strategic-memo', {
    data: {
      payload: { scenario: opts.sim.scenario, projection: opts.sim.projection },
      project_id: opts.projectId,
      scenario_id: opts.scenarioId,
      title: opts.title || `${RUN_TAG} memo`,
    },
    timeout: 120_000, // Kimi soft-timeout is 90s; deterministic fallback is ~3s
  });
  const body = await r.json().catch(() => ({}));
  return { status: r.status(), persisted: body.persisted, model_used: body.model_used, persistFailed: body.persistFailed, body };
}

export async function listMemos(req: APIRequestContext, projectId: string, scenarioId?: string): Promise<any[]> {
  const qs = new URLSearchParams({ project_id: projectId });
  if (scenarioId) qs.set('scenario_id', scenarioId);
  const r = await req.get(`/api/admin/hearst/strategic-memos?${qs.toString()}`);
  expect(r.ok(), 'GET /strategic-memos').toBeTruthy();
  const j = await r.json();
  return j.memos || j.rows || (Array.isArray(j) ? j : []);
}

export async function fetchPdf(req: APIRequestContext, memoId: string): Promise<{ status: number; buf: Buffer; contentType: string }> {
  const r = await req.get(`/api/admin/hearst/strategic-memos/${memoId}/pdf`, { timeout: 60_000 });
  const buf = Buffer.from(await r.body());
  return { status: r.status(), buf, contentType: r.headers()['content-type'] || '' };
}

// ── assertions ───────────────────────────────────────────────────────────────
export async function assertScenarioSaved(req: APIRequestContext, scenarioId: string): Promise<any> {
  const r = await req.get(`/api/admin/hearst/scenarios/${scenarioId}`);
  expect(r.status(), 'scenario persisted (GET 200)').toBe(200);
  const j = await r.json();
  expect(j.scenario?.id, 'persisted scenario id matches').toBe(scenarioId);
  return j;
}

export function assertMemoGenerated(memo: MemoResult): string {
  expect(memo.status, `memo POST status (body: ${JSON.stringify(memo.body).slice(0, 200)})`).toBe(200);
  expect(memo.persistFailed, 'memo did not fail to persist').toBeFalsy();
  expect(memo.persisted?.error, 'no persist error').toBeFalsy();
  expect(memo.persisted?.id, 'memo persisted with an id').toBeTruthy();
  return memo.persisted.id;
}

export function assertPdfGenerated(pdf: { status: number; buf: Buffer; contentType: string }): void {
  expect(pdf.status, 'PDF route 200').toBe(200);
  expect(pdf.buf.length, 'PDF size > 0').toBeGreaterThan(1000);
  // Skia/PDF binary begins with %PDF
  expect(pdf.buf.subarray(0, 5).toString('latin1'), 'is a PDF').toContain('%PDF');
}

/** Extracts PDF text via pdftotext when available; returns null to allow graceful skip. */
export function pdfToText(buf: Buffer): string | null {
  try {
    execFileSync('pdftotext', ['-v'], { stdio: 'ignore' });
  } catch {
    return null; // pdftotext not installed → caller degrades to binary-only checks
  }
  const dir = mkdtempSync(join(tmpdir(), 'e2e-pdf-'));
  const f = join(dir, 'memo.pdf');
  writeFileSync(f, buf);
  return execFileSync('pdftotext', [f, '-'], { encoding: 'utf8' });
}

/**
 * Asserts the PDF text contains the engine snapshot's headline board metrics, and
 * never a number that diverges from the snapshot ("no PDF-only numbers").
 * IRR / NPV / MOIC / CAPEX are ALL hard-asserted, each in the canonical board
 * format (MOIC as lowercase "x"). Returns { matched, gaps }.
 */
export function assertMetricsConsistent(pdfText: string, snap: any): { matched: string[]; gaps: string[] } {
  const matched: string[] = [];
  const gaps: string[] = [];
  const checks: Array<[string, string]> = [
    ['IRR(post-tax)', fmtPct(snap.irr_post_tax ?? snap.irr)],
    ['NPV(post-tax)', fmtUSD(snap.npv_post_tax ?? snap.npv)],
    ['MOIC(post-tax)', fmtX(snap.moic_post_tax ?? snap.moic)],
    ['CAPEX', fmtUSD(snap.total_capex)],
  ];
  for (const [label, value] of checks) {
    if (value === '—') continue;
    expect(pdfText, `${label} ${value} present in PDF (no PDF-only numbers)`).toContain(value);
    matched.push(`${label}=${value}`);
  }
  return { matched, gaps };
}

// ── best-effort cleanup ──────────────────────────────────────────────────────
export async function deleteScenario(req: APIRequestContext, scenarioId: string): Promise<void> {
  try { await req.delete(`/api/admin/hearst/scenarios/${scenarioId}`); } catch { /* best effort */ }
}

/** Service-role client (schema crm) for test teardown — memos have no DELETE route. */
function adminSupabase() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    try {
      const env = readFileSync('.env.local', 'utf8');
      url = url || env.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim();
      key = key || env.match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m)?.[1]?.trim();
    } catch { /* .env.local not readable */ }
  }
  if (!url || !key) return null;
  return createClient(url, key, { db: { schema: 'crm' }, auth: { persistSession: false } });
}

/** Cascade-cleanup a test scenario: delete its memos (service role), then the scenario (API). */
export async function cleanupScenarioCascade(req: APIRequestContext, scenarioId: string): Promise<void> {
  const supa = adminSupabase();
  if (supa) { try { await supa.from('strategic_memos').delete().eq('scenario_id', scenarioId); } catch { /* best effort */ } }
  await deleteScenario(req, scenarioId);
}

async function safeText(r: any): Promise<string> { try { return (await r.text()).slice(0, 160); } catch { return ''; } }
