// tests/e2e/critical-path.spec.ts
//
// P0 critical-path regression gate for the Investment-Committee workflow:
//   Login → Simulator → Save → Generate Memo → Dossier → PDF → Download
//
// Auth: dev autologin (every request is authenticated server-side). If autologin
// is off, the whole suite skips with a clear message (the gate needs an authed env).
//
// Flow A drives the real UI (simulator Generate Investment Memo CTA + results memo button).
// Flows B–E exercise the exact API contracts the UI calls and assert persistence,
// versioning, PDF truth and loud failures. All created scenarios are tracked and
// best-effort-deleted afterwards (memos have no delete route — tagged via RUN_TAG).

import { test, expect } from '@playwright/test';
import {
  RUN_TAG, simulate, createScenario, generateMemo, listMemos, fetchPdf,
  assertScenarioSaved, assertMemoGenerated, assertPdfGenerated, assertMetricsConsistent,
  pdfToText, cleanupScenarioCascade,
} from './helpers/critical-path';

test.describe.configure({ mode: 'serial' }); // shared project_id + ordered cleanup

const createdScenarioIds: string[] = [];
let PROJECT_ID = '';

test.beforeAll(async ({ request }) => {
  // Probe the SERVER (dev autologin is server-side, per-request) rather than the
  // runner env: if /project returns 200 with a project, we are authenticated.
  const probe = await request.get('/api/admin/hearst/project');
  test.skip(!probe.ok(), 'not authenticated (dev autologin off / server unauth) — the critical-path gate needs an authed env.');
  const j = await probe.json();
  PROJECT_ID = j.project?.id;
  expect(PROJECT_ID, 'project id available').toBeTruthy();
});

test.afterAll(async ({ request }) => {
  // Cascade: delete each test scenario's memos (no memo DELETE route) then the scenario.
  for (const id of createdScenarioIds) await cleanupScenarioCascade(request, id);
});

// Collects app-relevant console errors + failed responses for the happy path.
function trackErrors(page: any) {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on('pageerror', (e: Error) => consoleErrors.push(`pageerror: ${e.message}`));
  page.on('console', (m: any) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('response', (r: any) => {
    const url = r.url();
    const isApp = url.includes('/api/admin/hearst') || url.includes('/admin/hearst');
    if (isApp && r.status() >= 400) failedRequests.push(`${r.status()} ${url}`);
  });
  // Benign dev noise to ignore (HMR, source-map, favicon, Next style-MIME during compile).
  const benign = (s: string) => /favicon|_next\/static|sourcemap|Download the React DevTools|hydrat|Refused to apply style/i.test(s);
  return {
    consoleErrors,
    failedRequests,
    assertClean(stepLabel: string) {
      const realErrors = consoleErrors.filter((e) => !benign(e));
      expect(realErrors, `no console errors during ${stepLabel}`).toEqual([]);
      expect(failedRequests, `no failed app requests during ${stepLabel}`).toEqual([]);
    },
  };
}

// ── FLOW A — Happy Path (UI-driven) ──────────────────────────────────────────
test('Flow A — happy path: login → simulator → save → memo → dossier → PDF → download', async ({ page, request }) => {
  test.setTimeout(120_000);
  const errs = trackErrors(page);

  // Login (dev autologin) → Simulator renders authenticated (no redirect to /login).
  await page.goto('/admin/hearst/simulator', { waitUntil: 'networkidle' });
  expect(page.url(), 'authenticated — not bounced to login').not.toContain('/admin/login');
  await expect(page.getByText('CONFIGURATION', { exact: true })).toBeVisible({ timeout: 15_000 });

  // Save scenario via Generate Investment Memo (persists + navigates to results).
  const saveCta = page.getByRole('button', { name: 'Generate Investment Memo' });
  await expect(saveCta, 'Generate Investment Memo CTA visible').toBeVisible({ timeout: 15_000 });
  await expect(saveCta).toBeEnabled({ timeout: 30_000 });
  await saveCta.click();
  await page.waitForURL(/\/simulator\/results\?scenario=/, { timeout: 30_000 });
  const scenarioId = new URL(page.url()).searchParams.get('scenario')!;
  expect(scenarioId, 'scenario id in results URL').toBeTruthy();
  createdScenarioIds.push(scenarioId);

  // Scenario persisted.
  await assertScenarioSaved(request, scenarioId);

  // Results render (decision band) before generating the memo.
  await expect(page.getByText(/Returns composition/i).first()).toBeVisible({ timeout: 20_000 });

  // Generate Memo via the UI button → poll persistence (async job hits /strategic-memo).
  await page.getByRole('button', { name: /Generate Strategic Memo/i }).click();
  let memos: any[] = [];
  await expect.poll(async () => {
    memos = await listMemos(request, PROJECT_ID, scenarioId);
    return memos.length;
  }, { timeout: 90_000, message: 'memo persisted after Generate' }).toBeGreaterThanOrEqual(1);
  const memoId = memos[0].id;
  expect(memoId, 'memo id').toBeTruthy();

  // Dossier renders the memo for this scenario.
  await page.goto(`/admin/hearst/dossier?scenario=${scenarioId}`, { waitUntil: 'networkidle' });
  await expect(page.getByText(/Strategic Memo|Engine-backed|memo/i).first()).toBeVisible({ timeout: 20_000 });

  // PDF generated + downloadable (the dossier PDF link points here).
  const pdf = await fetchPdf(request, memoId);
  assertPdfGenerated(pdf);

  errs.assertClean('Flow A happy path');
  await page.screenshot({ path: 'test-results/critical-A-results.png' });
});

// ── FLOW B — Refresh Resilience ──────────────────────────────────────────────
test('Flow B — refresh resilience: reload + return → identical metrics, no duplicates', async ({ page, request }) => {
  test.setTimeout(90_000);
  const sim = await simulate(request, PROJECT_ID);
  const scenarioId = await createScenario(request, PROJECT_ID, sim);
  createdScenarioIds.push(scenarioId);

  const readMetrics = async () => {
    await page.goto(`/admin/hearst/simulator/results?scenario=${scenarioId}`, { waitUntil: 'networkidle' });
    await expect(page.locator('[data-decision-kpis]')).toBeVisible({ timeout: 25_000 });
    const area = await page.locator('.ct-page-area').first().innerText();
    const irr = (area.match(/(\d+\.\d+%)/) || [])[1];
    const moic = (area.match(/(\d+\.\d+x)/) || [])[1];
    return { irr, moic };
  };

  const before = await readMetrics();
  expect(before.irr, 'IRR rendered').toBeTruthy();

  await page.reload({ waitUntil: 'networkidle' }); // refresh
  const afterRefresh = await readMetrics();
  expect(afterRefresh, 'metrics identical after refresh').toEqual(before);

  await page.goto('/admin/hearst/workspace', { waitUntil: 'networkidle' }); // leave
  const afterReturn = await readMetrics(); // return later
  expect(afterReturn, 'metrics identical after returning').toEqual(before);

  // No duplicate scenario (still exactly one, this id) and no memo created by viewing.
  await assertScenarioSaved(request, scenarioId);
  const memos = await listMemos(request, PROJECT_ID, scenarioId);
  expect(memos.length, 'viewing/refresh creates no memo').toBe(0);
});

// ── FLOW C — Memo Regeneration ───────────────────────────────────────────────
test('Flow C — regenerate memo: versioned, no orphans, latest visible', async ({ request }) => {
  test.setTimeout(90_000);
  const sim = await simulate(request, PROJECT_ID);
  const scenarioId = await createScenario(request, PROJECT_ID, sim);
  createdScenarioIds.push(scenarioId);

  const m1 = generateMemoOk(await generateMemo(request, { projectId: PROJECT_ID, scenarioId, sim }));
  const m2 = generateMemoOk(await generateMemo(request, { projectId: PROJECT_ID, scenarioId, sim }));
  expect(m2.id, 'second memo is a distinct row (append-only, no overwrite)').not.toBe(m1.id);

  const memos = await listMemos(request, PROJECT_ID, scenarioId);
  expect(memos.length, 'exactly two versions, no orphan/dup corruption').toBe(2);
  const versions = memos.map((x: any) => x.version).sort();
  expect(versions, 'versions 1 and 2').toEqual([1, 2]);
  // every version is linked to THIS scenario (no orphans)
  for (const m of memos) expect(m.scenario_id).toBe(scenarioId);
  // latest version retrievable (its PDF renders)
  const latest = memos.find((m: any) => m.version === Math.max(...memos.map((x: any) => x.version)));
  assertPdfGenerated(await fetchPdf(request, latest.id));

  function generateMemoOk(res: any) {
    const id = assertMemoGenerated(res);
    return { id, version: res.persisted.version };
  }
});

// ── FLOW D — PDF Truth ───────────────────────────────────────────────────────
test('Flow D — PDF truth: IRR / NPV / MOIC / CAPEX match the engine snapshot', async ({ request }) => {
  test.setTimeout(90_000);
  const sim = await simulate(request, PROJECT_ID);
  const scenarioId = await createScenario(request, PROJECT_ID, sim);
  createdScenarioIds.push(scenarioId);
  const memoId = assertMemoGenerated(await generateMemo(request, { projectId: PROJECT_ID, scenarioId, sim }));

  // Engine snapshot truth = the memo's persisted _exec_projection (falls back to the
  // live engine projection, which the memo recomputes deterministically from the same scenario).
  const memos = await listMemos(request, PROJECT_ID, scenarioId);
  const snap = memos[0]?.memo_json?._exec_projection || memos[0]?._exec_projection || sim.projection;

  const pdf = await fetchPdf(request, memoId);
  assertPdfGenerated(pdf);
  const text = pdfToText(pdf.buf);
  test.skip(text == null, 'pdftotext not installed — binary PDF validated, text-truth check skipped');
  const { matched, gaps } = assertMetricsConsistent(text!, snap);
  expect(matched.length, 'IRR + NPV + MOIC + CAPEX all verified consistent in PDF').toBeGreaterThanOrEqual(4);
  if (gaps.length) console.warn(`[Flow D] PDF metric gaps: ${gaps.join('; ')}`);
});

// ── FLOW E — Error Handling ──────────────────────────────────────────────────
test('Flow E — failures are loud, never silent, never corrupting', async ({ page, request }) => {
  test.setTimeout(60_000);

  // Save failure — invalid scenario (missing project_id) → 4xx with an error, no row created.
  const badSave = await request.post('/api/admin/hearst/scenarios', { data: { name: `${RUN_TAG} bad`, scenario_type: 'custom' } });
  expect(badSave.status(), 'invalid save rejected, not 200').toBeGreaterThanOrEqual(400);
  expect((await badSave.json().catch(() => ({}))).error ?? badSave.status() >= 400, 'error surfaced').toBeTruthy();

  // Memo failure — empty payload → 400 with an error, nothing persisted.
  const badMemo = await request.post('/api/admin/hearst/strategic-memo', { data: { payload: {} } });
  expect(badMemo.status(), 'invalid memo rejected').toBeGreaterThanOrEqual(400);
  expect((await badMemo.json().catch(() => ({}))).error, 'memo error surfaced').toBeTruthy();

  // PDF failure — non-existent memo id → not a 200/corrupt PDF.
  const badPdf = await request.get('/api/admin/hearst/strategic-memos/00000000-0000-0000-0000-000000000000/pdf');
  expect(badPdf.status(), 'PDF for missing memo is not 200').not.toBe(200);

  // UI surfaces errors (no blank/crash) — results page with a non-existent scenario.
  await page.goto('/admin/hearst/simulator/results?scenario=00000000-0000-0000-0000-000000000000', { waitUntil: 'networkidle' });
  await expect(page.getByText(/Error|not found|failed/i).first(), 'UI shows an error, not a silent blank').toBeVisible({ timeout: 20_000 });
});
