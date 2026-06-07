'use client';

// /admin/hearst/workspace — Saved work only. Two lists:
//   • Saved Scenarios  (GET /scenarios?project_id) → Open in Simulator · Delete
//   • Reports / Memos  (GET /strategic-memos)       → Open Dossier · Open PDF
// No admin / CRM / users / teams / settings / analytics. Read-mostly.
// Primitives UI (Table/SectionHead/Button) — tokens --cp-* uniquement.

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { SectionHead, Table, Row, Cell, Button } from '@/components/hearst/ui';

const fmtDate = (s) => { try { return new Date(s).toLocaleDateString(); } catch { return s; } };

export default function WorkspacePage() {
  const [scenarios, setScenarios] = useState(null);
  const [memos, setMemos] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      let pid = null;
      try { const pj = await fetch('/api/admin/hearst/project').then(r => r.json()); pid = (pj.project || pj)?.id || null; } catch {}
      const [sc, mc] = await Promise.allSettled([
        pid ? fetch(`/api/admin/hearst/scenarios?project_id=${pid}`).then(r => r.json()) : Promise.resolve({ scenarios: [] }),
        fetch('/api/admin/hearst/strategic-memos?limit=100').then(r => r.json()),
      ]);
      setScenarios(sc.status === 'fulfilled' ? (sc.value.scenarios || sc.value.rows || []) : []);
      setMemos(mc.status === 'fulfilled' ? (mc.value.memos || []) : []);
    } catch (e) { setErr(String(e)); setScenarios([]); setMemos([]); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteScenario(id, name) {
    if (!window.confirm(`Delete scenario "${name}"? This cannot be undone.`)) return;
    setBusy(id);
    try {
      const r = await fetch(`/api/admin/hearst/scenarios/${id}`, { method: 'DELETE' });
      if (!r.ok) { const j = await r.json().catch(() => ({})); setErr(j.error || `Delete failed (${r.status})`); }
      else await load();
    } catch (e) { setErr(String(e)); } finally { setBusy(null); }
  }

  return (
    <div className="oracle-page">
      <header className="oracle-page-header">
        <h1>Workspace</h1>
        <p className="oracle-subtitle">Your saved work — scenarios and reports. Reopen a scenario in the Simulator or open its report.</p>
      </header>

      {err && <div style={S.err}>Error: {err}</div>}

      {/* ── Saved Scenarios ── */}
      <section className="oracle-section">
        <SectionHead title="Saved scenarios" hint={`${scenarios?.length ?? '—'} saved`} />
        {scenarios === null && <div style={S.empty}>Loading scenarios…</div>}
        {scenarios && scenarios.length === 0 && <div style={S.empty}>No saved scenarios yet. Build one in the Simulator and click "Save this plan".</div>}
        {scenarios && scenarios.length > 0 && (
          <Table head={['Name', 'Type', 'Created', 'Status', '']}>
            {scenarios.map(s => (
              <Row key={s.id}>
                <Cell label>{s.name}</Cell>
                <Cell>{s.scenario_type || '—'}</Cell>
                <Cell>{fmtDate(s.created_at)}</Cell>
                <Cell><span style={S.statusText}>{s.is_active ? 'Active' : 'Saved'}</span></Cell>
                <Cell style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <Link href={`/admin/hearst/simulator?scenario=${s.id}`} style={S.action}>Open in Simulator →</Link>
                  <Button variant="ghost" size="sm" disabled={busy === s.id} onClick={() => deleteScenario(s.id, s.name)} style={{ marginLeft: 'var(--cp-space-3)' }}>
                    {busy === s.id ? '…' : 'Delete'}
                  </Button>
                </Cell>
              </Row>
            ))}
          </Table>
        )}
      </section>

      {/* ── Reports / Memos ── */}
      <section className="oracle-section">
        <SectionHead title="Reports / memos" hint={`${memos?.length ?? '—'} reports`} />
        {memos === null && <div style={S.empty}>Loading reports…</div>}
        {memos && memos.length === 0 && <div style={S.empty}>No reports yet. Generate a strategic memo from the Simulator.</div>}
        {memos && memos.length > 0 && (
          <Table head={['Title', 'Created', 'Status', '']}>
            {memos.map(m => (
              <Row key={m.id}>
                <Cell label>{m.title}</Cell>
                <Cell>{fmtDate(m.created_at)}</Cell>
                <Cell><span style={S.statusText}>{m.status}</span></Cell>
                <Cell style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <Link href={`/admin/hearst/dossier?memo=${m.id}`} style={S.action}>Open Dossier →</Link>
                  <a href={`/api/admin/hearst/strategic-memos/${m.id}/pdf`} target="_blank" rel="noreferrer" style={S.actionMuted}>PDF ↓</a>
                </Cell>
              </Row>
            ))}
          </Table>
        )}
      </section>
    </div>
  );
}

const S = {
  statusText: { fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-muted)', textTransform: 'capitalize' },
  action: { color: 'var(--cp-accent)', textDecoration: 'none', fontWeight: 'var(--cp-weight-semibold)', fontSize: 'var(--cp-font-sm)', marginLeft: 'var(--cp-space-3)' },
  actionMuted: { color: 'var(--cp-text-muted)', textDecoration: 'none', fontWeight: 'var(--cp-weight-semibold)', fontSize: 'var(--cp-font-sm)', marginLeft: 'var(--cp-space-3)' },
  err: { padding: 'var(--cp-space-3)', borderRadius: 'var(--cp-radius-sm)', background: 'var(--cp-error-bg)', color: 'var(--cp-error)', border: '1px solid var(--cp-border)', marginBottom: 'var(--cp-space-4)' },
  empty: { padding: 'var(--cp-space-8)', color: 'var(--cp-text-muted)', textAlign: 'center', fontSize: 'var(--cp-font-md)' },
};
